#!/usr/bin/env node

import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
  ".avif",
]);

const VALID_MODES = new Set([
  "with-replacement",
  "without-replacement",
  "all-pairs",
]);

const VALID_FITS = new Set(["stretch", "contain", "cover", "none"]);
const VALID_FORMATS = new Set(["png", "jpeg", "webp"]);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_DIRECTORIES = {
  layerADir: path.join(SKILL_ROOT, "layer-a"),
  layerBDir: path.join(SKILL_ROOT, "layer-b"),
  outputDir: path.join(SKILL_ROOT, "output"),
};
const DEFAULT_DIRECTORY_LABELS = {
  layerADir: "<skill>/layer-a",
  layerBDir: "<skill>/layer-b",
  outputDir: "<skill>/output",
};

function printHelp() {
  console.log(`NFT Combinations

Usage:
  nft-combinations [options]

Default directories:
  layer-a                  ${DEFAULT_DIRECTORY_LABELS.layerADir}
  layer-b                  ${DEFAULT_DIRECTORY_LABELS.layerBDir}
  output                   ${DEFAULT_DIRECTORY_LABELS.outputDir}

Options:
  --layer-a-dir <dir>      Override the layer A directory
  --layer-b-dir <dir>      Override the layer B directory
  --layer-a-label <text>   Label stored in the manifest for layer A (default: layerA)
  --layer-b-label <text>   Label stored in the manifest for layer B (default: layerB)
  --output-dir <dir>       Override the output directory
  --count <n>              Number of images to generate (default: 10, except all-pairs)
  --mode <mode>            with-replacement | without-replacement | all-pairs
  --overlay-fit <fit>      stretch | contain | cover | none (default: stretch)
  --format <format>        png | jpeg | webp (default: png)
  --quality <n>            Output quality for jpeg/webp (default: 90)
  --prefix <text>          Output filename prefix (default: combined)
  --manifest-name <name>   Manifest filename (default: manifest.json)
  --dry-run                Validate and write the manifest without rendering
  --help                   Show this help message
`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fail(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

function parseArgs(argv) {
  const args = {
    ...DEFAULT_DIRECTORIES,
    layerALabel: "layerA",
    layerBLabel: "layerB",
    mode: "with-replacement",
    overlayFit: "stretch",
    format: "png",
    quality: 90,
    prefix: "combined",
    manifestName: "manifest.json",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help") {
      args.help = true;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (!token.startsWith("--")) {
      fail(`Unexpected argument: ${token}`);
    }

    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) {
      fail(`Missing value for ${token}`);
    }

    index += 1;

    switch (token) {
      case "--layer-a-dir":
        args.layerADir = path.resolve(value);
        break;
      case "--layer-b-dir":
        args.layerBDir = path.resolve(value);
        break;
      case "--layer-a-label":
        args.layerALabel = value.trim() || "layerA";
        break;
      case "--layer-b-label":
        args.layerBLabel = value.trim() || "layerB";
        break;
      case "--output-dir":
        args.outputDir = path.resolve(value);
        break;
      case "--count":
        args.count = parseInteger(value, "--count");
        break;
      case "--mode":
        if (!VALID_MODES.has(value)) {
          fail(`--mode must be one of: ${Array.from(VALID_MODES).join(", ")}`);
        }
        args.mode = value;
        break;
      case "--overlay-fit":
        if (!VALID_FITS.has(value)) {
          fail(`--overlay-fit must be one of: ${Array.from(VALID_FITS).join(", ")}`);
        }
        args.overlayFit = value;
        break;
      case "--format":
        if (!VALID_FORMATS.has(value)) {
          fail(`--format must be one of: ${Array.from(VALID_FORMATS).join(", ")}`);
        }
        args.format = value;
        break;
      case "--quality":
        args.quality = parseInteger(value, "--quality");
        break;
      case "--prefix":
        args.prefix = value.trim() || "combined";
        break;
      case "--manifest-name":
        args.manifestName = value.trim() || "manifest.json";
        break;
      default:
        fail(`Unknown option: ${token}`);
    }
  }

  return args;
}

async function listImages(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      path: path.join(directoryPath, entry.name),
      ext: path.extname(entry.name).toLowerCase(),
    }))
    .filter((entry) => IMAGE_EXTENSIONS.has(entry.ext))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildJobs(layerAItems, layerBItems, args) {
  if (args.mode === "all-pairs") {
    const allPairs = [];
    for (const layerA of layerAItems) {
      for (const layerB of layerBItems) {
        allPairs.push({ layerA, layerB });
      }
    }
    const shuffled = shuffle(allPairs);
    return args.count ? shuffled.slice(0, args.count) : shuffled;
  }

  if (args.mode === "without-replacement") {
    const count = args.count ?? 10;
    const allPairs = [];
    for (const layerA of layerAItems) {
      for (const layerB of layerBItems) {
        allPairs.push({ layerA, layerB });
      }
    }
    if (count > allPairs.length) {
      fail(
        `Requested ${count} unique pairs, but only ${allPairs.length} combinations are available.`
      );
    }
    return shuffle(allPairs).slice(0, count);
  }

  const count = args.count ?? 10;
  return Array.from({ length: count }, () => ({
    layerA: randomItem(layerAItems),
    layerB: randomItem(layerBItems),
  }));
}

async function renderComposite(job, outputPath, args) {
  const baseImage = sharp(job.layerA.path);
  const metadata = await baseImage.metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    fail(`Could not read dimensions for ${job.layerA.path}`);
  }

  let overlayPipeline = sharp(job.layerB.path);
  let compositeOptions = { gravity: "center" };

  if (args.overlayFit !== "none") {
    const fitMap = {
      stretch: "fill",
      contain: "contain",
      cover: "cover",
    };

    overlayPipeline = overlayPipeline.resize({
      width,
      height,
      fit: fitMap[args.overlayFit],
      position: "center",
    });
  }

  const overlayBuffer = await overlayPipeline.png().toBuffer();
  const composite = baseImage.composite([
    {
      input: overlayBuffer,
      ...compositeOptions,
    },
  ]);

  if (args.format === "jpeg") {
    await composite.jpeg({ quality: args.quality }).toFile(outputPath);
    return;
  }

  if (args.format === "webp") {
    await composite.webp({ quality: args.quality }).toFile(outputPath);
    return;
  }

  await composite.png().toFile(outputPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const layerAItems = await listImages(args.layerADir);
  const layerBItems = await listImages(args.layerBDir);

  if (layerAItems.length === 0) {
    fail(`No supported layer A images found in ${args.layerADir}`);
  }

  if (layerBItems.length === 0) {
    fail(`No supported layer B images found in ${args.layerBDir}`);
  }

  await mkdir(args.outputDir, { recursive: true });

  const jobs = buildJobs(layerAItems, layerBItems, args);
  const effectiveCount = args.mode === "all-pairs" ? jobs.length : args.count ?? 10;
  const extension = args.format === "jpeg" ? "jpg" : args.format;
  const manifest = {
    createdAt: new Date().toISOString(),
    options: {
      layerADir: args.layerADir,
      layerBDir: args.layerBDir,
      layerALabel: args.layerALabel,
      layerBLabel: args.layerBLabel,
      outputDir: args.outputDir,
      count: effectiveCount,
      mode: args.mode,
      overlayFit: args.overlayFit,
      format: args.format,
      quality: args.quality,
      prefix: args.prefix,
      dryRun: args.dryRun,
    },
    inputs: {
      layerA: {
        label: args.layerALabel,
        count: layerAItems.length,
      },
      layerB: {
        label: args.layerBLabel,
        count: layerBItems.length,
      },
    },
    totals: {
      generated: jobs.length,
    },
    outputs: [],
  };

  for (const [index, job] of jobs.entries()) {
    const filename = `${args.prefix}-${String(index + 1).padStart(4, "0")}.${extension}`;
    const outputPath = path.join(args.outputDir, filename);

    if (!args.dryRun) {
      await renderComposite(job, outputPath, args);
    }

    manifest.outputs.push({
      index: index + 1,
      file: filename,
      outputPath,
      layerA: {
        label: args.layerALabel,
        name: job.layerA.name,
        path: job.layerA.path,
      },
      layerB: {
        label: args.layerBLabel,
        name: job.layerB.name,
        path: job.layerB.path,
      },
    });

    console.log(
      `${args.dryRun ? "Planned" : "Generated"} ${filename} <- ${job.layerA.name} + ${job.layerB.name}`
    );
  }

  const manifestPath = path.join(args.outputDir, args.manifestName);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
