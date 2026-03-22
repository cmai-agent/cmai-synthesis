import crypto from "node:crypto";
import process from "node:process";
import { ethers } from "ethers";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ETH_REGISTRAR_CONTROLLER = "0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547";
const PUBLIC_RESOLVER = "0xF29100983E058B709F3D539b0c765937B804AC15";
const DEFAULT_REVERSE_REGISTRAR = "0x283F227c4Bd38ecE252C4Ae7ECE650B0e913f1f9";
const LEGACY_REVERSE_REGISTRAR = "0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb";
const ETH_COIN_TYPE = 60n;
const DEFAULT_COIN_TYPE = 0n;

const REGISTRY_ABI = [
  "function owner(bytes32 node) view returns (address)",
  "function resolver(bytes32 node) view returns (address)",
  "function setResolver(bytes32 node, address resolver)"
];

const CONTROLLER_ABI = [
  "function available(string label) view returns (bool)",
  "function rentPrice(string label, uint256 duration) view returns (tuple(uint256 base,uint256 premium))",
  "function register((string label,address owner,uint256 duration,bytes32 secret,address resolver,bytes[] data,uint8 reverseRecord,bytes32 referrer) registration) payable",
  "function makeCommitment((string label,address owner,uint256 duration,bytes32 secret,address resolver,bytes[] data,uint8 reverseRecord,bytes32 referrer) registration) pure returns (bytes32 commitment)",
  "function commit(bytes32 commitment)"
];

const RESOLVER_ABI = [
  "function addr(bytes32 node) view returns (address)",
  "function addr(bytes32 node, uint256 coinType) view returns (bytes)",
  "function setAddr(bytes32 node, address a)",
  "function setAddr(bytes32 node, uint256 coinType, bytes addressBytes)",
  "function name(bytes32 node) view returns (string)"
];

const DEFAULT_REVERSE_ABI = [
  "function setName(string name) external",
  "function nameForAddr(address addr) view returns (string)"
];

const LEGACY_REVERSE_ABI = [
  "function setName(string name) external returns (bytes32)",
  "function node(address addr) pure returns (bytes32)"
];

function parseArgs(argv) {
  const args = {
    name: "",
    owner: "",
    years: 1,
    waitSeconds: 65,
    dryRun: false,
    rpcUrl: process.env.ENS_RPC_URL || "https://ethereum-rpc.publicnode.com"
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--name") {
      args.name = String(argv[++i] || "").trim().toLowerCase();
      continue;
    }
    if (arg === "--owner") {
      args.owner = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--years") {
      args.years = Number(argv[++i]);
      continue;
    }
    if (arg === "--wait-seconds") {
      args.waitSeconds = Number(argv[++i]);
      continue;
    }
    if (arg === "--rpc-url") {
      args.rpcUrl = String(argv[++i] || "").trim();
      continue;
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.name.endsWith(".eth")) {
    throw new Error("--name must be a full .eth name");
  }
  if (!Number.isFinite(args.years) || args.years < 1) {
    throw new Error("--years must be a number >= 1");
  }
  if (!Number.isFinite(args.waitSeconds) || args.waitSeconds < 60) {
    throw new Error("--wait-seconds must be a number >= 60");
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatEth(wei) {
  return ethers.formatEther(wei);
}

function addressBytes(address) {
  return ethers.getBytes(address);
}

function sameAddress(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

async function waitForAndLog(txPromise, label) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(JSON.stringify({
    step: label,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  }, null, 2));
  return receipt;
}

async function main() {
  const args = parseArgs(process.argv);
  const privateKey = process.env.ENS_SIGNER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ENS_SIGNER_PRIVATE_KEY is required");
  }

  const provider = new ethers.JsonRpcProvider(args.rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const owner = args.owner ? ethers.getAddress(args.owner) : signer.address;
  const name = args.name;
  const label = name.slice(0, -4);
  const duration = BigInt(args.years) * 31536000n;
  const node = ethers.namehash(name);

  const registry = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, provider);
  const controller = new ethers.Contract(ETH_REGISTRAR_CONTROLLER, CONTROLLER_ABI, provider);
  const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, provider);
  const defaultReverse = new ethers.Contract(DEFAULT_REVERSE_REGISTRAR, DEFAULT_REVERSE_ABI, provider);
  const legacyReverse = new ethers.Contract(LEGACY_REVERSE_REGISTRAR, LEGACY_REVERSE_ABI, provider);

  const initialAvailable = await controller.available(label);
  const currentOwner = initialAvailable ? ethers.ZeroAddress : await registry.owner(node);

  if (!initialAvailable && !sameAddress(currentOwner, owner)) {
    throw new Error(`${name} is already owned by ${currentOwner}, not ${owner}`);
  }

  const resolverIface = new ethers.Interface(RESOLVER_ABI);
  const registration = {
    label,
    owner,
    duration,
    secret: `0x${crypto.randomBytes(32).toString("hex")}`,
    resolver: PUBLIC_RESOLVER,
    data: [
      resolverIface.encodeFunctionData("setAddr(bytes32,address)", [node, owner]),
      resolverIface.encodeFunctionData("setAddr(bytes32,uint256,bytes)", [node, DEFAULT_COIN_TYPE, addressBytes(owner)])
    ],
    reverseRecord: 0,
    referrer: ethers.ZeroHash
  };

  const quote = await controller.rentPrice(label, duration);
  const total = quote.base + quote.premium;
  const maxValue = (total * 110n) / 100n;
  const balance = await provider.getBalance(signer.address);

  const report = {
    signer: signer.address,
    owner,
    name,
    available: initialAvailable,
    currentOwner,
    totalEth: formatEth(total),
    maxValueEth: formatEth(maxValue),
    signerBalanceEth: formatEth(balance)
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ mode: "dry-run", report }, null, 2));
    return;
  }

  if (initialAvailable) {
    const requiredBalance = maxValue + ethers.parseEther("0.005");
    if (balance < requiredBalance) {
      throw new Error(
        `Signer ${signer.address} has ${formatEth(balance)} ETH, need at least ${formatEth(requiredBalance)} ETH`
      );
    }

    const controllerWithSigner = controller.connect(signer);
    const commitment = await controller.makeCommitment(registration);

    console.log(JSON.stringify({
      mode: "register-and-configure",
      report,
      commitment
    }, null, 2));

    await waitForAndLog(controllerWithSigner.commit(commitment), "commit-confirmed");
    await sleep(args.waitSeconds * 1000);

    const availableBeforeRegister = await controller.available(label);
    if (!availableBeforeRegister) {
      throw new Error(`${name} is no longer available before register`);
    }

    const refreshedQuote = await controller.rentPrice(label, duration);
    const refreshedTotal = refreshedQuote.base + refreshedQuote.premium;
    const refreshedMaxValue = (refreshedTotal * 110n) / 100n;

    await waitForAndLog(
      controllerWithSigner.register(registration, { value: refreshedMaxValue }),
      "register-confirmed"
    );
  } else {
    console.log(JSON.stringify({
      mode: "configure-existing-name",
      report
    }, null, 2));
  }

  const registryWithSigner = registry.connect(signer);
  const resolverWithSigner = resolver.connect(signer);
  const defaultReverseWithSigner = defaultReverse.connect(signer);
  const legacyReverseWithSigner = legacyReverse.connect(signer);

  const liveResolver = await registry.resolver(node);
  if (!sameAddress(liveResolver, PUBLIC_RESOLVER)) {
    await waitForAndLog(
      registryWithSigner.setResolver(node, PUBLIC_RESOLVER),
      "resolver-set"
    );
  }

  const liveAddr = await resolver.addr(node);
  if (!sameAddress(liveAddr, owner)) {
    await waitForAndLog(
      resolverWithSigner["setAddr(bytes32,address)"](node, owner),
      "forward-eth-addr-set"
    );
  }

  const liveDefaultAddrBytes = await resolver["addr(bytes32,uint256)"](node, DEFAULT_COIN_TYPE);
  const wantedDefaultAddrBytes = ethers.hexlify(addressBytes(owner));
  if (ethers.hexlify(liveDefaultAddrBytes).toLowerCase() !== wantedDefaultAddrBytes.toLowerCase()) {
    await waitForAndLog(
      resolverWithSigner["setAddr(bytes32,uint256,bytes)"](node, DEFAULT_COIN_TYPE, addressBytes(owner)),
      "forward-default-addr-set"
    );
  }

  let defaultReverseName = "";
  let legacyReverseName = "";
  if (sameAddress(owner, signer.address)) {
    defaultReverseName = await defaultReverse.nameForAddr(owner);
    if (defaultReverseName !== name) {
      await waitForAndLog(
        defaultReverseWithSigner.setName(name),
        "default-primary-name-set"
      );
    }

    const legacyReverseNode = await legacyReverse.node(owner);
    const legacyReverseResolver = await registry.resolver(legacyReverseNode);
    if (!sameAddress(legacyReverseResolver, ethers.ZeroAddress)) {
      legacyReverseName = await resolver.name(legacyReverseNode);
    }
    if (legacyReverseName !== name) {
      await waitForAndLog(
        legacyReverseWithSigner.setName(name),
        "legacy-primary-name-set"
      );
    }
  }

  const finalOwner = await registry.owner(node);
  const finalResolver = await registry.resolver(node);
  const finalAddr = await resolver.addr(node);
  const finalDefaultAddrBytes = await resolver["addr(bytes32,uint256)"](node, DEFAULT_COIN_TYPE);
  const finalDefaultReverseName = sameAddress(owner, signer.address)
    ? await defaultReverse.nameForAddr(owner)
    : null;
  const finalLegacyReverseNode = await legacyReverse.node(owner);
  const finalLegacyReverseResolver = await registry.resolver(finalLegacyReverseNode);
  const finalLegacyReverseName = sameAddress(finalLegacyReverseResolver, PUBLIC_RESOLVER)
    ? await resolver.name(finalLegacyReverseNode)
    : null;

  console.log(JSON.stringify({
    step: "final-state",
    name,
    owner: finalOwner,
    resolver: finalResolver,
    forwardEthAddr: finalAddr,
    forwardDefaultAddrHex: ethers.hexlify(finalDefaultAddrBytes),
    defaultPrimaryName: finalDefaultReverseName,
    legacyPrimaryName: finalLegacyReverseName
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
