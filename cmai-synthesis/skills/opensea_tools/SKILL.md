---
name: opensea_skill
description: Deploy OpenSea-compatible NFT collections, read collection analytics and marketplace data via the OpenSea API, and operate post-mint workflows like metadata refreshes, listings, offers, and event monitoring. Use when the user wants to create an NFT collection, inspect an existing collection, or automate OpenSea-facing NFT operations.
metadata:
  short-description: Create and analyze NFT collections on OpenSea
---

# OpenSea Skill

Use this skill for OpenSea collection work.

For `cmai`, this is part of the real NFT collection stack: it connects the agent to collection deployment, marketplace visibility, and post-mint operations in a way judges can recognize as product value.

Split the task into two lanes:
- `deploy lane`: contract deployment, metadata wiring, and collection preparation
- `data lane`: collection stats, traits, events, listings, offers, and metadata refreshes via the OpenSea API

Important constraint:
- The OpenSea API does not deploy NFT contracts. The bundled bootstrap covers the custom-contract deployment path used in this repo.

## What this skill does

Bundled assets and scripts:
- `scripts/bootstrap_foundry_collection.sh`: creates a Foundry project with a standard OpenSea-compatible ERC-721 contract and deploy script
- `scripts/get_collection_report.mjs`: fetches a compact collection report from OpenSea including stats, traits, recent events, listings, and offers
- `assets/foundry/`: template contract, Foundry config, env example, and deploy script

Read [opensea_api.md](references/opensea_api.md) when you need endpoint names, URLs, or docs links.

## Requirements

- Local OpenSea API access configured outside the repo
- `forge` for the deployment bootstrap path
- local chain RPC access and a funded deployer when broadcasting a deployment
- Metadata already hosted somewhere stable such as IPFS, Arweave, or HTTPS

## Workflow

### 1. Deploy a collection contract

Use this when the user wants a real contract, not just marketplace analytics.

Bootstrap a project:

```bash
bash scripts/bootstrap_foundry_collection.sh \
  --target /absolute/path/to/my-collection \
  --name "My Collection" \
  --symbol MYC \
  --base-uri "ipfs://CID/" \
  --contract-uri "ipfs://CID/contract.json" \
  --max-supply 1000
```

Then deploy from the generated project:

```bash
cd /absolute/path/to/my-collection
cp .env.example .env
source .env
forge script script/DeployOpenSeaCollection.s.sol:DeployOpenSeaCollection \
  --rpc-url "$RPC_URL" \
  --broadcast
```

Deploy notes:
- The bundled template is a standard owner-mintable ERC-721 with `contractURI()`, `baseURI`, and capped supply support
- Before going live, validate token metadata and contract-level metadata against OpenSea requirements

### 2. Read a collection report

Use the bundled report script for quick collection intelligence:

```bash
node scripts/get_collection_report.mjs \
  --slug doodles-official \
  --events-limit 8 \
  --trait-limit 8 \
  --listing-limit 5 \
  --offer-limit 5
```

The report tries to summarize:
- collection identity and links
- floor, supply, owners/holders, and volume when exposed by the API
- top traits by count
- recent collection events
- cheapest active listings
- active collection offers

### 3. Post-mint operations

Recommended follow-ups after deploy:
- refresh metadata when reveal or metadata changes happen
- inspect collection traits for rarity distribution and QA
- watch recent sales/listings/offers around mint windows
- monitor collection events continuously if you need alerts or automations

## Recommended extra capabilities

Besides the two capabilities you asked for, I recommend these for the skill:

1. `metadata QA + refresh`
   Use OpenSea metadata validation and refresh endpoints so the agent can check reveal files and force refresh stale NFTs.
2. `listing and offer intelligence`
   Read best listings, collection offers, and recent events to detect floor pressure, bid support, and liquidity health.
3. `collection checklist`
   Verify `contractURI`, royalty settings, collection links, image assets, and metadata before announcing the collection.
4. `wallet/account views`
   Add wallet inventory and account profile reads to inspect which addresses hold or trade the collection.

## Guardrails

- Default to read-only unless the user explicitly asks to deploy or broadcast transactions
- Treat deployment as high-risk: confirm chain, RPC, owner address, base URI, contract URI, and max supply before broadcasting
- Do not pretend the API can deploy the contract
- After any on-chain action, report a short human summary and include the transaction link
