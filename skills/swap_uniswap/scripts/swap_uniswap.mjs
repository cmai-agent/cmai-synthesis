import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { ethers } from "ethers";

const TRADING_API_BASE_URL = "https://trade-api.gateway.uniswap.org/v1";
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
const WETH_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function withdraw(uint256 amount)"
];

const CHAINS = {
  ethereum: {
    id: 1,
    label: "Ethereum",
    nativeSymbol: "ETH",
    rpcEnv: "ETHEREUM_RPC_URL",
    defaultRpcUrl: "https://ethereum-rpc.publicnode.com",
    explorerBaseUrl: "https://etherscan.io/tx/",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  base: {
    id: 8453,
    label: "Base",
    nativeSymbol: "ETH",
    rpcEnv: "BASE_RPC_URL",
    defaultRpcUrl: "https://base-rpc.publicnode.com",
    explorerBaseUrl: "https://basescan.org/tx/",
    weth: "0x4200000000000000000000000000000000000006"
  },
  arbitrum: {
    id: 42161,
    label: "Arbitrum",
    nativeSymbol: "ETH",
    rpcEnv: "ARBITRUM_RPC_URL",
    defaultRpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    explorerBaseUrl: "https://arbiscan.io/tx/",
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  },
  optimism: {
    id: 10,
    label: "Optimism",
    nativeSymbol: "ETH",
    rpcEnv: "OPTIMISM_RPC_URL",
    defaultRpcUrl: "https://optimism-rpc.publicnode.com",
    explorerBaseUrl: "https://optimistic.etherscan.io/tx/",
    weth: "0x4200000000000000000000000000000000000006"
  },
  polygon: {
    id: 137,
    label: "Polygon",
    nativeSymbol: "POL",
    rpcEnv: "POLYGON_RPC_URL",
    defaultRpcUrl: "https://polygon-bor-rpc.publicnode.com",
    explorerBaseUrl: "https://polygonscan.com/tx/",
    weth: ""
  },
  unichain: {
    id: 130,
    label: "Unichain",
    nativeSymbol: "ETH",
    rpcEnv: "UNICHAIN_RPC_URL",
    defaultRpcUrl: "https://unichain-rpc.publicnode.com",
    explorerBaseUrl: "https://uniscan.xyz/tx/",
    weth: "0x4200000000000000000000000000000000000006"
  }
};

const EXECUTE_CONFIRMATION = "EXECUTE_SWAP";
const AUCTION_ROUTES = new Set(["DUTCH_V2", "DUTCH_V3", "PRIORITY", "DUTCH_LIMIT", "LIMIT_ORDER"]);

function printHelp() {
  console.log(`Usage:
  node scripts/swap_uniswap.mjs --chain base --token-in 0x... --token-out 0x... --amount-in 100 [options]

Required:
  --chain <name>          Chain alias: ${Object.keys(CHAINS).join(", ")}
  --token-in <address>    ERC20 token address to spend
  --token-out <address>   ERC20 token address to receive
  --amount-in <value>     Human-readable exact-input amount

Optional:
  --wallet <address>      Wallet to inspect in dry-run mode when no signer key is set
  --recipient <address>   Recipient address (defaults to wallet/signer)
  --slippage-bps <n>      Slippage in basis points (default: 50)
  --routing <mode>        Routing preference (BEST_PRICE or FASTEST, default: BEST_PRICE)
  --protocols <list>      Comma-separated protocols, for example V2,V3,V4
  --unwrap-weth           Unwrap received WETH into native ETH on supported chains
  --rpc-url <url>         Override RPC URL
  --dry-run               Quote only (default)
  --execute               Execute approval + swap transactions
  --confirm EXECUTE_SWAP  Required alongside --execute
  --help                  Show this help
`);
}

function parseArgs(argv) {
  const args = {
    chain: "",
    tokenIn: "",
    tokenOut: "",
    amountIn: "",
    wallet: "",
    recipient: "",
    slippageBps: 50,
    routing: "BEST_PRICE",
    protocols: [],
    unwrapWeth: false,
    dryRun: true,
    execute: false,
    confirm: "",
    rpcUrl: ""
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--chain") {
      args.chain = String(argv[++i] || "").trim().toLowerCase();
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
    if (arg === "--protocols") {
      const raw = String(argv[++i] || "").trim();
      args.protocols = raw ? raw.split(",").map((part) => part.trim().toUpperCase()).filter(Boolean) : [];
      continue;
    }
    if (arg === "--unwrap-weth") {
      args.unwrapWeth = true;
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
    if (arg === "--rpc-url") {
      args.rpcUrl = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.chain || !(args.chain in CHAINS)) {
    throw new Error(`--chain must be one of: ${Object.keys(CHAINS).join(", ")}`);
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
    decimals: Number(decimals),
    contract: token
  };
}

function extractExpectedOutput(rawQuote, outputDecimals) {
  if (rawQuote.routing === "CLASSIC" && rawQuote.quote?.output?.amount) {
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

async function main() {
  const args = parseArgs(process.argv);
  const chain = CHAINS[args.chain];
  const apiKey = await loadApiKey();
  if (!apiKey) {
    throw new Error("UNISWAP_API_KEY is required. Set it in env or ~/.config/uniswap/api_key");
  }

  const rpcUrl = resolveRpcUrl(chain, args.rpcUrl);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signerKey = process.env.SWAP_SIGNER_PRIVATE_KEY?.trim() || "";
  const signer = signerKey ? new ethers.Wallet(signerKey, provider) : null;
  const walletAddress = args.wallet ? ethers.getAddress(args.wallet) : signer?.address;
  if (!walletAddress) {
    throw new Error("Provide --wallet for dry-run or set SWAP_SIGNER_PRIVATE_KEY");
  }
  if (args.execute && !signer) {
    throw new Error("SWAP_SIGNER_PRIVATE_KEY is required for --execute");
  }

  const recipient = args.recipient ? ethers.getAddress(args.recipient) : walletAddress;
  const [tokenIn, tokenOut] = await Promise.all([
    getTokenMetadata(args.tokenIn, provider),
    getTokenMetadata(args.tokenOut, provider)
  ]);

  const amountInRaw = ethers.parseUnits(args.amountIn, tokenIn.decimals);
  const approvalResponse = await fetchTradingApi("/check_approval", apiKey, {
    walletAddress,
    token: tokenIn.address,
    amount: amountInRaw.toString(),
    chainId: chain.id
  });

  const quoteRequest = {
    swapper: walletAddress,
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    tokenInChainId: String(chain.id),
    tokenOutChainId: String(chain.id),
    amount: amountInRaw.toString(),
    type: "EXACT_INPUT",
    slippageTolerance: args.slippageBps / 100,
    routingPreference: args.routing
  };
  if (recipient !== walletAddress) {
    quoteRequest.recipient = recipient;
  }
  if (args.protocols.length > 0) {
    quoteRequest.protocols = args.protocols;
  }

  const quoteResponse = await fetchTradingApi("/quote", apiKey, quoteRequest);
  const expectedOut = extractExpectedOutput(quoteResponse, tokenOut.decimals);
  const approvalRequired = Boolean(approvalResponse?.approval);
  const route = quoteResponse.routing || "UNKNOWN";
  const summaryTargetSymbol = args.unwrapWeth && chain.weth && ethers.getAddress(chain.weth) === tokenOut.address
    ? chain.nativeSymbol
    : tokenOut.symbol;

  const report = {
    mode: args.dryRun ? "dry-run" : "execute",
    chain: chain.label,
    walletAddress,
    recipient,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: args.amountIn,
    amountInRaw: amountInRaw.toString(),
    routing: route,
    approvalRequired,
    approvalTarget: approvalResponse?.approval?.to || null,
    expectedOutput: expectedOut.human ? `${expectedOut.human} ${summaryTargetSymbol}` : null,
    expectedOutputRaw: expectedOut.raw ? expectedOut.raw.toString() : null,
    gasFeeUsd: quoteResponse?.quote?.gasFeeUSD || null,
    gasUseEstimate: quoteResponse?.quote?.gasUseEstimate || null,
    routeSource: expectedOut.source,
    unwrapWeth: args.unwrapWeth
  };

  if (args.dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (route !== "CLASSIC") {
    throw new Error(`Execution currently supports CLASSIC routes only. Quote returned ${route}.`);
  }
  if (AUCTION_ROUTES.has(route)) {
    throw new Error(`Execution does not support auction route ${route} in v1.`);
  }
  const signerBalance = await provider.getBalance(walletAddress);
  console.log(JSON.stringify({
    ...report,
    signerBalanceEth: ethers.formatEther(signerBalance)
  }, null, 2));

  const txResults = [];
  if (approvalRequired) {
    const approvalTx = await sendPreparedTransaction(signer, approvalResponse.approval, "approval-confirmed");
    txResults.push({
      ...approvalTx,
      txUrl: buildTxUrl(chain, approvalTx.txHash)
    });
  }

  const { permitData, permitTransaction, ...cleanQuote } = quoteResponse;
  const swapRequest = { ...cleanQuote };
  if (permitData && typeof permitData === "object") {
    swapRequest.signature = await signPermitData(signer, permitData);
    swapRequest.permitData = permitData;
  }
  const swapResponse = await fetchTradingApi("/swap", apiKey, swapRequest);
  validateSwapResponse(swapResponse);

  const preOutputBalance = await tokenOut.contract.balanceOf(walletAddress);
  const swapTx = await sendPreparedTransaction(signer, swapResponse.swap, "swap-confirmed");
  txResults.push({
    ...swapTx,
    txUrl: buildTxUrl(chain, swapTx.txHash)
  });

  const postOutputBalance = await tokenOut.contract.balanceOf(walletAddress);
  const outputDelta = postOutputBalance - preOutputBalance;

  let unwrapResult = null;
  if (args.unwrapWeth) {
    if (!chain.weth || ethers.getAddress(chain.weth) !== tokenOut.address) {
      throw new Error(`--unwrap-weth requires token-out to be the chain WETH address for ${chain.label}`);
    }
    if (outputDelta > 0n) {
      const weth = new ethers.Contract(chain.weth, WETH_ABI, signer);
      const unwrapTx = await weth.withdraw(outputDelta);
      const unwrapReceipt = await unwrapTx.wait();
      unwrapResult = {
        label: "unwrap-confirmed",
        txHash: unwrapReceipt.hash,
        blockNumber: unwrapReceipt.blockNumber,
        txUrl: buildTxUrl(chain, unwrapReceipt.hash)
      };
      txResults.push(unwrapResult);
    }
  }

  const summary = `Swap ${args.amountIn} ${tokenIn.symbol} to ${summaryTargetSymbol} on ${chain.label}`;
  console.log(JSON.stringify({
    action: summary,
    txHash: swapTx.txHash,
    txUrl: buildTxUrl(chain, swapTx.txHash),
    approvalTxHash: txResults.find((item) => item.label === "approval-confirmed")?.txHash || null,
    unwrapTxHash: unwrapResult?.txHash || null,
    actualOutputRaw: outputDelta.toString(),
    actualOutput: `${formatUnitsSafe(outputDelta, tokenOut.decimals)} ${tokenOut.symbol}`,
    onchainSummary: summary,
    transactions: txResults
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
