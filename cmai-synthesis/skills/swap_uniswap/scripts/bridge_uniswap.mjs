import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { ethers } from "ethers";

const TRADING_API_BASE_URL = "https://trade-api.gateway.uniswap.org/v1";
const EXECUTE_CONFIRMATION = "EXECUTE_BRIDGE";
const TRACKING_KEYS = new Set([
  "routing",
  "requestid",
  "quoteid",
  "swapid",
  "bridgeid",
  "orderid",
  "trackingid",
  "externaltransferid",
  "txhash",
  "transactionhash",
  "hash"
]);
const AUCTION_ROUTES = new Set(["DUTCH_V2", "DUTCH_V3", "PRIORITY", "DUTCH_LIMIT", "LIMIT_ORDER"]);
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const CHAINS = {
  ethereum: {
    id: 1,
    label: "Ethereum",
    rpcEnv: "ETHEREUM_RPC_URL",
    defaultRpcUrl: "https://ethereum-rpc.publicnode.com",
    explorerBaseUrl: "https://etherscan.io/tx/"
  },
  base: {
    id: 8453,
    label: "Base",
    rpcEnv: "BASE_RPC_URL",
    defaultRpcUrl: "https://base-rpc.publicnode.com",
    explorerBaseUrl: "https://basescan.org/tx/"
  },
  arbitrum: {
    id: 42161,
    label: "Arbitrum",
    rpcEnv: "ARBITRUM_RPC_URL",
    defaultRpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    explorerBaseUrl: "https://arbiscan.io/tx/"
  },
  optimism: {
    id: 10,
    label: "Optimism",
    rpcEnv: "OPTIMISM_RPC_URL",
    defaultRpcUrl: "https://optimism-rpc.publicnode.com",
    explorerBaseUrl: "https://optimistic.etherscan.io/tx/"
  },
  polygon: {
    id: 137,
    label: "Polygon",
    rpcEnv: "POLYGON_RPC_URL",
    defaultRpcUrl: "https://polygon-bor-rpc.publicnode.com",
    explorerBaseUrl: "https://polygonscan.com/tx/"
  },
  unichain: {
    id: 130,
    label: "Unichain",
    rpcEnv: "UNICHAIN_RPC_URL",
    defaultRpcUrl: "https://unichain-rpc.publicnode.com",
    explorerBaseUrl: "https://uniscan.xyz/tx/"
  }
};

function printHelp() {
  console.log(`Usage:
  node scripts/bridge_uniswap.mjs --from-chain base --to-chain ethereum --token-in 0x... --token-out 0x... --amount-in 100 [options]

Required:
  --from-chain <name>      Source chain alias: ${Object.keys(CHAINS).join(", ")}
  --to-chain <name>        Destination chain alias: ${Object.keys(CHAINS).join(", ")}
  --token-in <address>     Source-chain ERC20 token address to spend
  --token-out <address>    Destination-chain ERC20 token address to receive
  --amount-in <value>      Human-readable exact-input amount

Optional:
  --wallet <address>       Wallet to inspect in dry-run mode when no signer key is set
  --recipient <address>    Destination recipient address (defaults to wallet/signer)
  --slippage-bps <n>       Slippage in basis points (default: 50)
  --routing <mode>         Routing preference (BEST_PRICE or FASTEST, default: BEST_PRICE)
  --from-rpc-url <url>     Override source-chain RPC URL
  --to-rpc-url <url>       Override destination-chain RPC URL
  --dry-run                Quote only (default)
  --execute                Execute approval + bridge submission transaction
  --confirm EXECUTE_BRIDGE Required alongside --execute
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    fromChain: "",
    toChain: "",
    tokenIn: "",
    tokenOut: "",
    amountIn: "",
    wallet: "",
    recipient: "",
    slippageBps: 50,
    routing: "BEST_PRICE",
    fromRpcUrl: "",
    toRpcUrl: "",
    dryRun: true,
    execute: false,
    confirm: ""
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--from-chain") {
      args.fromChain = String(argv[++i] || "").trim().toLowerCase();
      continue;
    }
    if (arg === "--to-chain") {
      args.toChain = String(argv[++i] || "").trim().toLowerCase();
      continue;
    }
    if (arg === "--token-in") {
      args.tokenIn = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--token-out") {
      args.tokenOut = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--amount-in") {
      args.amountIn = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--wallet") {
      args.wallet = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--recipient") {
      args.recipient = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--slippage-bps") {
      args.slippageBps = Number(argv[++i]);
      continue;
    }
    if (arg === "--routing") {
      args.routing = String(argv[++i] || "").trim().toUpperCase();
      continue;
    }
    if (arg === "--from-rpc-url") {
      args.fromRpcUrl = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--to-rpc-url") {
      args.toRpcUrl = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      args.execute = false;
      continue;
    }
    if (arg === "--execute") {
      args.execute = true;
      args.dryRun = false;
      continue;
    }
    if (arg === "--confirm") {
      args.confirm = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.fromChain || !(args.fromChain in CHAINS)) {
    throw new Error(`--from-chain must be one of: ${Object.keys(CHAINS).join(", ")}`);
  }
  if (!args.toChain || !(args.toChain in CHAINS)) {
    throw new Error(`--to-chain must be one of: ${Object.keys(CHAINS).join(", ")}`);
  }
  if (args.fromChain === args.toChain) {
    throw new Error("bridge_uniswap.mjs is for cross-chain routes only. Use swap_uniswap.mjs for same-chain swaps.");
  }
  if (!ethers.isAddress(args.tokenIn) || !ethers.isAddress(args.tokenOut)) {
    throw new Error("--token-in and --token-out must be ERC20 addresses");
  }
  if (!/^[0-9]+(\.[0-9]+)?$/.test(args.amountIn)) {
    throw new Error("--amount-in must be a non-negative decimal string");
  }
  if (!Number.isFinite(args.slippageBps) || args.slippageBps < 1 || args.slippageBps > 10_000) {
    throw new Error("--slippage-bps must be a number between 1 and 10000");
  }
  if (!["BEST_PRICE", "FASTEST"].includes(args.routing)) {
    throw new Error("--routing must be BEST_PRICE or FASTEST");
  }
  if (args.wallet && !ethers.isAddress(args.wallet)) {
    throw new Error("--wallet must be a valid address");
  }
  if (args.recipient && !ethers.isAddress(args.recipient)) {
    throw new Error("--recipient must be a valid address");
  }
  if (args.execute && args.confirm !== EXECUTE_CONFIRMATION) {
    throw new Error(`Execution requires --confirm ${EXECUTE_CONFIRMATION}`);
  }

  return args;
}

async function loadApiKey() {
  const envKey = process.env.UNISWAP_API_KEY?.trim();
  if (envKey) {
    return envKey;
  }
  const configPath = path.join(os.homedir(), ".config", "uniswap", "api_key");
  try {
    const key = (await fs.readFile(configPath, "utf8")).trim();
    return key || null;
  } catch {
    return null;
  }
}

function resolveRpcUrl(chain, explicitRpcUrl) {
  if (explicitRpcUrl) {
    return explicitRpcUrl;
  }
  return process.env[chain.rpcEnv] || chain.defaultRpcUrl;
}

function formatUnitsSafe(value, decimals, precision = 6) {
  const human = ethers.formatUnits(value, decimals);
  const [whole, fraction = ""] = human.split(".");
  if (!fraction) {
    return whole;
  }
  return `${whole}.${fraction.slice(0, precision).replace(/0+$/, "")}`.replace(/\.$/, "");
}

function buildTxUrl(chain, txHash) {
  return `${chain.explorerBaseUrl}${txHash}`;
}

async function fetchTradingApi(endpoint, apiKey, body) {
  const response = await fetch(`${TRADING_API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "x-universal-router-version": "2.0"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Trading API request failed for ${endpoint} (${response.status})`);
  }
  return data;
}

async function getTokenMetadata(address, provider) {
  const token = new ethers.Contract(address, ERC20_ABI, provider);
  const [symbol, decimals] = await Promise.all([
    token.symbol(),
    token.decimals()
  ]);
  return {
    address: ethers.getAddress(address),
    symbol,
    decimals: Number(decimals)
  };
}

function extractExpectedOutput(rawQuote, outputDecimals) {
  if (rawQuote.quote?.output?.amount) {
    const raw = BigInt(rawQuote.quote.output.amount);
    return {
      raw,
      human: formatUnitsSafe(raw, outputDecimals),
      source: "quote.output.amount"
    };
  }
  const firstOutput = rawQuote.quote?.orderInfo?.outputs?.[0];
  if (firstOutput?.startAmount) {
    const raw = BigInt(firstOutput.startAmount);
    return {
      raw,
      human: formatUnitsSafe(raw, outputDecimals),
      source: "quote.orderInfo.outputs[0].startAmount"
    };
  }
  return {
    raw: null,
    human: null,
    source: null
  };
}

function collectTrackingFields(value, prefix = "", depth = 0, out = {}) {
  if (value == null || depth > 4) {
    return out;
  }
  if (Array.isArray(value)) {
    value.slice(0, 3).forEach((entry, index) => {
      collectTrackingFields(entry, `${prefix}[${index}]`, depth + 1, out);
    });
    return out;
  }
  if (typeof value !== "object") {
    return out;
  }
  for (const [key, entry] of Object.entries(value)) {
    const pathLabel = prefix ? `${prefix}.${key}` : key;
    if (entry == null) {
      continue;
    }
    const normalizedKey = key.toLowerCase();
    if (TRACKING_KEYS.has(normalizedKey) && (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean")) {
      out[pathLabel] = String(entry);
    }
    if (typeof entry === "object") {
      collectTrackingFields(entry, pathLabel, depth + 1, out);
    }
  }
  return out;
}

function validateSwapResponse(response) {
  if (!response?.swap?.data || response.swap.data === "0x") {
    throw new Error("Swap response is missing executable calldata");
  }
  if (!ethers.isAddress(response.swap.to) || !ethers.isAddress(response.swap.from)) {
    throw new Error("Swap response contains invalid addresses");
  }
}

async function sendPreparedTransaction(signer, prepared, label) {
  const tx = await signer.sendTransaction({
    to: prepared.to,
    data: prepared.data,
    value: BigInt(prepared.value || "0"),
    gasLimit: prepared.gasLimit ? BigInt(prepared.gasLimit) : undefined
  });
  const receipt = await tx.wait();
  return {
    label,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

async function signPermitData(signer, permitData) {
  if (!permitData?.domain || !permitData?.types || !permitData?.values) {
    throw new Error("permitData is missing domain/types/values");
  }
  const types = { ...permitData.types };
  delete types.EIP712Domain;
  return signer.signTypedData(permitData.domain, types, permitData.values);
}

async function prepareSwapRequest(quoteResponse, signer) {
  const route = String(quoteResponse.routing || "").toUpperCase();
  const { permitData, permitTransaction, ...cleanQuote } = quoteResponse;
  const request = { ...cleanQuote };

  if (permitData && typeof permitData === "object") {
    request.signature = await signPermitData(signer, permitData);
    if (!AUCTION_ROUTES.has(route)) {
      request.permitData = permitData;
    }
  }

  return request;
}

async function main() {
  const args = parseArgs(process.argv);
  const fromChain = CHAINS[args.fromChain];
  const toChain = CHAINS[args.toChain];
  const apiKey = await loadApiKey();
  if (!apiKey) {
    throw new Error("UNISWAP_API_KEY is required. Set it in env or ~/.config/uniswap/api_key");
  }

  const sourceRpcUrl = resolveRpcUrl(fromChain, args.fromRpcUrl);
  const destinationRpcUrl = resolveRpcUrl(toChain, args.toRpcUrl);
  const sourceProvider = new ethers.JsonRpcProvider(sourceRpcUrl);
  const destinationProvider = new ethers.JsonRpcProvider(destinationRpcUrl);

  const signerKey = process.env.SWAP_SIGNER_PRIVATE_KEY?.trim() || "";
  const signer = signerKey ? new ethers.Wallet(signerKey, sourceProvider) : null;
  const walletAddress = args.wallet ? ethers.getAddress(args.wallet) : signer?.address;
  if (!walletAddress) {
    throw new Error("Provide --wallet for dry-run or set SWAP_SIGNER_PRIVATE_KEY");
  }
  if (args.execute && !signer) {
    throw new Error("SWAP_SIGNER_PRIVATE_KEY is required for --execute");
  }

  const recipient = args.recipient ? ethers.getAddress(args.recipient) : walletAddress;
  const [tokenIn, tokenOut] = await Promise.all([
    getTokenMetadata(args.tokenIn, sourceProvider),
    getTokenMetadata(args.tokenOut, destinationProvider)
  ]);

  const amountInRaw = ethers.parseUnits(args.amountIn, tokenIn.decimals);
  const approvalResponse = await fetchTradingApi("/check_approval", apiKey, {
    walletAddress,
    token: tokenIn.address,
    amount: amountInRaw.toString(),
    chainId: fromChain.id
  });

  const quoteResponse = await fetchTradingApi("/quote", apiKey, {
    swapper: walletAddress,
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    tokenInChainId: String(fromChain.id),
    tokenOutChainId: String(toChain.id),
    amount: amountInRaw.toString(),
    type: "EXACT_INPUT",
    slippageTolerance: args.slippageBps / 100,
    routingPreference: args.routing,
    recipient
  });

  const expectedOut = extractExpectedOutput(quoteResponse, tokenOut.decimals);
  const route = String(quoteResponse.routing || "UNKNOWN").toUpperCase();
  const tracking = collectTrackingFields({ quote: quoteResponse });
  const report = {
    mode: args.dryRun ? "dry-run" : "execute",
    fromChain: fromChain.label,
    toChain: toChain.label,
    walletAddress,
    recipient,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: args.amountIn,
    amountInRaw: amountInRaw.toString(),
    routing: route,
    bridgeReady: route === "BRIDGE",
    approvalRequired: Boolean(approvalResponse?.approval),
    approvalTarget: approvalResponse?.approval?.to || null,
    expectedOutput: expectedOut.human ? `${expectedOut.human} ${tokenOut.symbol}` : null,
    expectedOutputRaw: expectedOut.raw ? expectedOut.raw.toString() : null,
    gasFeeUsd: quoteResponse?.quote?.gasFeeUSD || null,
    gasUseEstimate: quoteResponse?.quote?.gasUseEstimate || null,
    routeSource: expectedOut.source,
    tracking
  };

  if (args.dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (route !== "BRIDGE") {
    throw new Error(`Execution currently supports BRIDGE routes only. Quote returned ${route}.`);
  }
  if (AUCTION_ROUTES.has(route)) {
    throw new Error(`Execution does not support auction route ${route} in v1.`);
  }

  console.log(JSON.stringify({
    ...report,
    signerBalanceSourceEth: ethers.formatEther(await sourceProvider.getBalance(walletAddress))
  }, null, 2));

  const transactions = [];
  if (approvalResponse?.approval) {
    const approvalTx = await sendPreparedTransaction(signer, approvalResponse.approval, "approval-confirmed");
    transactions.push({
      ...approvalTx,
      txUrl: buildTxUrl(fromChain, approvalTx.txHash)
    });
  }

  const swapRequest = await prepareSwapRequest(quoteResponse, signer);
  const swapResponse = await fetchTradingApi("/swap", apiKey, swapRequest);
  validateSwapResponse(swapResponse);

  const bridgeTx = await sendPreparedTransaction(signer, swapResponse.swap, "bridge-submitted");
  transactions.push({
    ...bridgeTx,
    txUrl: buildTxUrl(fromChain, bridgeTx.txHash)
  });

  console.log(JSON.stringify({
    action: `Bridge ${args.amountIn} ${tokenIn.symbol} from ${fromChain.label} to ${tokenOut.symbol} on ${toChain.label}`,
    txHash: bridgeTx.txHash,
    txUrl: buildTxUrl(fromChain, bridgeTx.txHash),
    onchainSummary: `Bridge submission sent on ${fromChain.label}; destination settlement is still pending`,
    bridgeStatus: "submitted-on-source-chain",
    expectedOutput: report.expectedOutput,
    expectedOutputRaw: report.expectedOutputRaw,
    tracking: collectTrackingFields({ quote: quoteResponse, swap: swapResponse }),
    transactions
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
