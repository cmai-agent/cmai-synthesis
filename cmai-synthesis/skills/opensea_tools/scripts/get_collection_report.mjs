#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = "https://api.opensea.io";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function readApiKey() {
  if (process.env.OPENSEA_API_KEY) return process.env.OPENSEA_API_KEY.trim();
  const apiKeyPath = path.join(os.homedir(), ".config", "opensea", "api_key");
  if (fs.existsSync(apiKeyPath)) {
    return fs.readFileSync(apiKeyPath, "utf8").trim();
  }
  return "";
}

function pickFirst(obj, paths) {
  for (const candidate of paths) {
    const keys = candidate.split(".");
    let value = obj;
    let ok = true;
    for (const key of keys) {
      if (value && Object.prototype.hasOwnProperty.call(value, key)) {
        value = value[key];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
}

function extractArray(payload, candidates) {
  for (const key of candidates) {
    const value = pickFirst(payload, [key]);
    if (Array.isArray(value)) return value;
  }
  return [];
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function summarizeTraits(traitsPayload, limit) {
  const traitsRoot = pickFirst(traitsPayload, ["traits"]) ?? traitsPayload;
  if (!traitsRoot || typeof traitsRoot !== "object") return [];

  const flattened = [];
  for (const [traitName, values] of Object.entries(traitsRoot)) {
    if (!values || typeof values !== "object") continue;
    for (const [traitValue, data] of Object.entries(values)) {
      const count = toNumber(
        pickFirst(data, ["count"]) ?? (typeof data === "number" ? data : null),
      );
      flattened.push({
        trait_type: traitName,
        value: traitValue,
        count,
      });
    }
  }

  return flattened
    .sort((a, b) => (b.count ?? -1) - (a.count ?? -1))
    .slice(0, limit);
}

function summarizeEvents(eventsPayload, limit) {
  const events = extractArray(eventsPayload, ["asset_events", "events"]);
  return events.slice(0, limit).map((event) => ({
    event_type: pickFirst(event, ["event_type"]),
    when: pickFirst(event, ["event_timestamp", "created_date"]),
    from: pickFirst(event, ["from_account.address", "maker.address"]),
    to: pickFirst(event, ["to_account.address", "taker.address"]),
    quantity: pickFirst(event, ["quantity"]),
    payment_token: pickFirst(event, ["payment.symbol", "payment_token.symbol"]),
    price: pickFirst(event, ["payment.quantity", "sale_price", "starting_price"]),
    nft: pickFirst(event, [
      "nft.identifier",
      "nft.token_id",
      "asset.identifier",
      "asset.token_id",
    ]),
  }));
}

function summarizeOrders(payload, type, limit) {
  const orders = extractArray(payload, ["orders", "listings", "offers"]);
  return orders.slice(0, limit).map((order) => ({
    type,
    price: pickFirst(order, [
      "price.current.value",
      "current_price",
      "base_price",
      "price.amount.decimal",
    ]),
    token: pickFirst(order, [
      "price.current.currency",
      "protocol_data.parameters.offer.0.token",
      "payment_token_contract.symbol",
    ]),
    chain: pickFirst(order, ["chain"]),
    maker: pickFirst(order, ["maker.address", "maker"]),
    taker: pickFirst(order, ["taker.address", "taker"]),
    expiration: pickFirst(order, ["expiration_time", "closing_date"]),
  }));
}

async function requestJson(url, apiKey) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${text}`);
  }

  return response.json();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  if (!slug) {
    console.error("Usage: node scripts/get_collection_report.mjs --slug <collection-slug>");
    process.exit(1);
  }

  const apiKey = readApiKey();
  if (!apiKey) {
    console.error("Missing OPENSEA_API_KEY and ~/.config/opensea/api_key");
    process.exit(1);
  }

  const eventsLimit = Number(args["events-limit"] ?? 8);
  const traitLimit = Number(args["trait-limit"] ?? 8);
  const listingLimit = Number(args["listing-limit"] ?? 5);
  const offerLimit = Number(args["offer-limit"] ?? 5);

  const eventTypes = args["event-type"];
  const eventsUrl = new URL(`${BASE_URL}/api/v2/events/collection/${slug}`);
  eventsUrl.searchParams.set("limit", String(eventsLimit));
  if (eventTypes) {
    for (const eventType of String(eventTypes).split(",")) {
      eventsUrl.searchParams.append("event_type", eventType.trim());
    }
  }

  const urls = {
    collection: `${BASE_URL}/api/v2/collections/${slug}`,
    stats: `${BASE_URL}/api/v2/collections/${slug}/stats`,
    traits: `${BASE_URL}/api/v2/traits/${slug}`,
    events: eventsUrl.toString(),
    bestListings: `${BASE_URL}/api/v2/listings/collection/${slug}/best`,
    offers: `${BASE_URL}/api/v2/offers/collection/${slug}`,
  };

  const [collection, stats, traits, events, bestListings, offers] = await Promise.all([
    requestJson(urls.collection, apiKey),
    requestJson(urls.stats, apiKey),
    requestJson(urls.traits, apiKey),
    requestJson(urls.events, apiKey),
    requestJson(urls.bestListings, apiKey),
    requestJson(urls.offers, apiKey),
  ]);

  const summary = {
    requested_at: new Date().toISOString(),
    slug,
    docs: "https://docs.opensea.io/reference/api-overview",
    collection: {
      name: pickFirst(collection, ["collection", "name"]),
      description: pickFirst(collection, ["description"]),
      owner: pickFirst(collection, ["owner"]),
      category: pickFirst(collection, ["category"]),
      safelist_status: pickFirst(collection, ["safelist_status"]),
      image_url: pickFirst(collection, ["image_url"]),
      banner_image_url: pickFirst(collection, ["banner_image_url"]),
      external_url: pickFirst(collection, ["project_url", "external_url"]),
    },
    stats: {
      total_volume: pickFirst(stats, [
        "total.volume",
        "stats.total_volume",
        "total_volume",
      ]),
      floor_price: pickFirst(stats, [
        "total.floor_price",
        "stats.floor_price",
        "floor_price",
      ]),
      holders: pickFirst(stats, [
        "total.num_owners",
        "stats.num_owners",
        "num_owners",
        "total.owners",
      ]),
      total_supply: pickFirst(stats, [
        "total.total_supply",
        "stats.total_supply",
        "total_supply",
        "count",
      ]),
      market_cap: pickFirst(stats, [
        "total.market_cap",
        "stats.market_cap",
        "market_cap",
      ]),
    },
    top_traits: summarizeTraits(traits, traitLimit),
    recent_events: summarizeEvents(events, eventsLimit),
    best_listings: summarizeOrders(bestListings, "listing", listingLimit),
    best_offers: summarizeOrders(offers, "offer", offerLimit),
  };

  const holders = toNumber(summary.stats.holders);
  const totalSupply = toNumber(summary.stats.total_supply);
  summary.derived = {
    avg_items_per_holder:
      holders && totalSupply ? Number((totalSupply / holders).toFixed(2)) : null,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
