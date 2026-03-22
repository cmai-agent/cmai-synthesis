#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(SCRIPT_DIR, "..");

const DEFAULT_CLASS_CONFIGS = [
  {
    classLabel: "common",
    layerASubdir: "common",
    layerBSubdir: "common",
    outputSubdir: "common",
    weight: 8,
  },
  {
    classLabel: "rare",
    layerASubdir: "rare",
    layerBSubdir: "rare",
    outputSubdir: "rare",
    weight: 3,
  },
  {
    classLabel: "legendary",
    layerASubdir: "legendary",
    layerBSubdir: "legendary",
    outputSubdir: "legendary",
    includeEachLayerBOnce: true,
  },
];

function printHelp() {
  console.log(`Generate Tiered NFT Drop

Usage:
  node generate-class-drop.mjs [options]

Options:
  --layer-a-root <dir>         Root folder for layer A assets grouped by class
  --layer-b-root <dir>         Root folder for layer B assets grouped by class
  --class-config-file <path>   JSON file describing classes and subdirectories
  --output-root <dir>          Folder for generated composite images
  --date-folder <name>         Subfolder inside output-root for this run
  --drop-dir <dir>             Final packaged drop folder
  --drop-template-dir <dir>    Optional folder containing README.txt to copy
  --count <n>                  Number of outputs to generate
  --overlay-fit <fit>          stretch | contain | cover | none (default: stretch)
  --forced-layer-b <name>      Force a specific layer B asset into a target position
  --forced-index <n>           1-based position for the forced layer B asset
  --collection-name <text>     Collection name for metadata
  --name-prefix <text>         Token name prefix (default: Token #)
  --description <text>         Description for metadata rows
  --layer-a-attribute <text>   CSV attribute column label for layer A
  --layer-b-attribute <text>   CSV attribute column label for layer B
  --clean                      Remove the target output and drop folders first
  --help                       Show this help message
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

function todayDateFolder() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function parseArgs(argv) {
  const defaultDateFolder = todayDateFolder();
  const args = {
    layerARoot: path.join(SKILL_ROOT, "layer-a"),
    layerBRoot: path.join(SKILL_ROOT, "layer-b"),
    classConfigFile: "",
    outputRoot: path.join(SKILL_ROOT, "output"),
    dateFolder: defaultDateFolder,
    dropDir: path.join(SKILL_ROOT, `drop-${defaultDateFolder}`),
    dropTemplateDir: "",
    count: 100,
    overlayFit: "stretch",
    forcedLayerB: "",
    forcedIndex: 1,
    collectionName: "NFT Collection",
    namePrefix: "Token #",
    description: "Layered NFT collection generated from custom asset groups.",
    layerAAttribute: "Layer A",
    layerBAttribute: "Layer B",
    clean: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help") {
      args.help = true;
      continue;
    }

    if (token === "--clean") {
      args.clean = true;
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
      case "--layer-a-root":
        args.layerARoot = path.resolve(value);
        break;
      case "--layer-b-root":
        args.layerBRoot = path.resolve(value);
        break;
      case "--class-config-file":
        args.classConfigFile = path.resolve(value);
        break;
      case "--output-root":
        args.outputRoot = path.resolve(value);
        break;
      case "--date-folder":
        args.dateFolder = value.trim();
        break;
      case "--drop-dir":
        args.dropDir = path.resolve(value);
        break;
      case "--drop-template-dir":
        args.dropTemplateDir = path.resolve(value);
        break;
      case "--count":
        args.count = parseInteger(value, "--count");
        break;
      case "--overlay-fit":
        if (!["stretch", "contain", "cover", "none"].includes(value)) {
          fail("--overlay-fit must be one of: stretch, contain, cover, none");
        }
        args.overlayFit = value;
        break;
      case "--forced-layer-b":
        args.forcedLayerB = value;
        break;
      case "--forced-index":
        args.forcedIndex = parseInteger(value, "--forced-index");
        break;
      case "--collection-name":
        args.collectionName = value;
        break;
      case "--name-prefix":
        args.namePrefix = value;
        break;
      case "--description":
        args.description = value;
        break;
      case "--layer-a-attribute":
        args.layerAAttribute = value;
        break;
      case "--layer-b-attribute":
        args.layerBAttribute = value;
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

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function loadClassConfigs(classConfigFile) {
  if (!classConfigFile) {
    return DEFAULT_CLASS_CONFIGS;
  }

  const parsed = JSON.parse(await readFile(classConfigFile, "utf8"));
  if (!Array.isArray(parsed) || parsed.length === 0) {
    fail("--class-config-file must contain a non-empty JSON array.");
  }

  return parsed.map((config, index) => {
    if (!config || typeof config !== "object") {
      fail(`Class config at index ${index} must be an object.`);
    }
    if (!config.classLabel || !config.layerASubdir || !config.layerBSubdir) {
      fail(
        `Class config at index ${index} must include classLabel, layerASubdir, and layerBSubdir.`
      );
    }

    return {
      classLabel: String(config.classLabel),
      layerASubdir: String(config.layerASubdir),
      layerBSubdir: String(config.layerBSubdir),
      outputSubdir: String(config.outputSubdir || config.classLabel),
      weight:
        config.weight == null
          ? 1
          : parseInteger(String(config.weight), `class weight for ${config.classLabel}`),
      includeEachLayerBOnce: Boolean(config.includeEachLayerBOnce),
    };
  });
}

function allocateClassCounts(preparedClasses, totalCount) {
  const counts = {};
  let guaranteed = 0;
  const weightedClasses = [];

  for (const classConfig of preparedClasses) {
    if (classConfig.includeEachLayerBOnce) {
      counts[classConfig.classLabel] = classConfig.layerBItems.length;
      guaranteed += classConfig.layerBItems.length;
    } else {
      counts[classConfig.classLabel] = 0;
      weightedClasses.push(classConfig);
    }
  }

  if (guaranteed > totalCount) {
    fail(
      `Requested ${totalCount} outputs, but ${guaranteed} outputs are mandatory based on includeEachLayerBOnce tiers.`
    );
  }

  const remaining = totalCount - guaranteed;
  const totalCapacity = weightedClasses.reduce((sum, classConfig) => sum + classConfig.capacity, 0);

  if (remaining > totalCapacity) {
    fail(
      `Requested ${totalCount} outputs, but only ${guaranteed + totalCapacity} unique combinations are available.`
    );
  }

  if (weightedClasses.length === 0) {
    if (remaining > 0) {
      fail(
        `Requested ${totalCount} outputs, but only ${guaranteed} outputs are available across tiers that require every layer B asset exactly once.`
      );
    }
    return counts;
  }

  const totalWeight = weightedClasses.reduce((sum, classConfig) => sum + classConfig.weight, 0);
  let assigned = 0;
  const fractions = [];

  for (const classConfig of weightedClasses) {
    const raw = (remaining * classConfig.weight) / totalWeight;
    const base = Math.min(Math.floor(raw), classConfig.capacity);
    counts[classConfig.classLabel] = base;
    assigned += base;
    fractions.push({
      classLabel: classConfig.classLabel,
      remainder: raw - Math.floor(raw),
    });
  }

  let leftovers = remaining - assigned;
  fractions.sort((left, right) => right.remainder - left.remainder);

  while (leftovers > 0) {
    let placed = false;
    for (const fraction of fractions) {
      const classConfig = weightedClasses.find((entry) => entry.classLabel === fraction.classLabel);
      if (counts[fraction.classLabel] < classConfig.capacity) {
        counts[fraction.classLabel] += 1;
        leftovers -= 1;
        placed = true;
        if (leftovers === 0) {
          break;
        }
      }
    }
    if (!placed) {
      fail("Could not allocate the requested number of unique combinations.");
    }
  }

  return counts;
}

function buildUniquePairJobs(classConfig, count) {
  const allPairs = [];
  for (const layerA of classConfig.layerAItems) {
    for (const layerB of classConfig.layerBItems) {
      allPairs.push({
        classLabel: classConfig.classLabel,
        layerA,
        layerB,
      });
    }
  }

  if (count > allPairs.length) {
    fail(
      `${classConfig.classLabel}: requested ${count} unique pairs, but only ${allPairs.length} are available.`
    );
  }

  return shuffle(allPairs).slice(0, count);
}

function buildIncludeEachLayerBOnceJobs(classConfig) {
  const shuffledLayerA = shuffle(classConfig.layerAItems);
  const shuffledLayerB = shuffle(classConfig.layerBItems);

  return shuffledLayerB.map((layerB, index) => ({
    classLabel: classConfig.classLabel,
    layerA: shuffledLayerA[index % shuffledLayerA.length],
    layerB,
  }));
}

function placeForcedJob(jobs, forcedLayerB, forcedIndex) {
  if (!forcedLayerB) {
    return jobs;
  }

  const targetPosition = forcedIndex - 1;
  if (targetPosition < 0 || targetPosition >= jobs.length) {
    fail(`--forced-index ${forcedIndex} is outside the generated range.`);
  }

  const forcedPosition = jobs.findIndex((job) => job.layerB.name === forcedLayerB);
  if (forcedPosition === -1) {
    fail(`Could not find forced layer B asset "${forcedLayerB}" in the generated jobs.`);
  }

  [jobs[targetPosition], jobs[forcedPosition]] = [jobs[forcedPosition], jobs[targetPosition]];
  return jobs;
}

async function renderComposite(job, outputPath, overlayFit) {
  const baseImage = sharp(job.layerA.path);
  const metadata = await baseImage.metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    fail(`Could not read dimensions for ${job.layerA.path}`);
  }

  let overlayPipeline = sharp(job.layerB.path);
  if (overlayFit !== "none") {
    const fitMap = {
      stretch: "fill",
      contain: "contain",
      cover: "cover",
    };

    overlayPipeline = overlayPipeline.resize({
      width,
      height,
      fit: fitMap[overlayFit],
      position: "center",
    });
  }

  const overlayBuffer = await overlayPipeline.png().toBuffer();

  await baseImage
    .composite([
      {
        input: overlayBuffer,
        gravity: "center",
      },
    ])
    .png()
    .toFile(outputPath);
}

async function readmeTemplate(dropTemplateDir, collectionName, dateFolder) {
  if (dropTemplateDir) {
    const templatePath = path.join(dropTemplateDir, "README.txt");
    try {
      await access(templatePath);
      return {
        copyFrom: templatePath,
      };
    } catch {
      // Fall back to a generated README.
    }
  }

  return {
    content: `Collection: ${collectionName}
Generated on: ${new Date().toISOString()}
Batch folder: ${dateFolder}

Contents:
- Media/: rendered PNG assets
- metadata-file.csv: token metadata import file
- README.txt: package notes
`,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const classConfigs = await loadClassConfigs(args.classConfigFile);
  const baseOutputDir = path.join(args.outputRoot, args.dateFolder);
  const mediaDir = path.join(args.dropDir, "Media");

  if (args.clean) {
    await rm(baseOutputDir, { recursive: true, force: true });
    await rm(args.dropDir, { recursive: true, force: true });
  }

  const preparedClasses = [];
  for (const config of classConfigs) {
    const layerAItems = await listImages(path.join(args.layerARoot, config.layerASubdir));
    const layerBItems = await listImages(path.join(args.layerBRoot, config.layerBSubdir));

    if (layerAItems.length === 0) {
      fail(`No layer A images found for class ${config.classLabel}`);
    }
    if (layerBItems.length === 0) {
      fail(`No layer B images found for class ${config.classLabel}`);
    }

    preparedClasses.push({
      ...config,
      layerAItems,
      layerBItems,
      capacity: config.includeEachLayerBOnce ? layerBItems.length : layerAItems.length * layerBItems.length,
    });
  }

  const allocatedCounts = allocateClassCounts(preparedClasses, args.count);

  let jobs = [];
  for (const classConfig of preparedClasses) {
    if (classConfig.includeEachLayerBOnce) {
      jobs.push(...buildIncludeEachLayerBOnceJobs(classConfig));
      continue;
    }

    jobs.push(...buildUniquePairJobs(classConfig, allocatedCounts[classConfig.classLabel]));
  }

  jobs = shuffle(jobs);
  jobs = placeForcedJob(jobs, args.forcedLayerB, args.forcedIndex);

  for (const classConfig of preparedClasses) {
    await mkdir(path.join(baseOutputDir, classConfig.outputSubdir), { recursive: true });
  }
  await mkdir(mediaDir, { recursive: true });

  const manifest = {
    createdAt: new Date().toISOString(),
    dateFolder: args.dateFolder,
    collectionName: args.collectionName,
    description: args.description,
    classConfigFile: args.classConfigFile || null,
    rules: {
      sameClassOnly: true,
      uniquePairs: true,
      forcedLayerB: args.forcedLayerB || null,
      forcedIndex: args.forcedLayerB ? args.forcedIndex : null,
      targetCount: args.count,
      overlayFit: args.overlayFit,
    },
    sourceRoots: {
      layerARoot: args.layerARoot,
      layerBRoot: args.layerBRoot,
      outputDir: baseOutputDir,
      dropDir: args.dropDir,
      dropTemplateDir: args.dropTemplateDir || null,
    },
    sourceCounts: Object.fromEntries(
      preparedClasses.map((classConfig) => [
        classConfig.classLabel,
        {
          layerA: classConfig.layerAItems.length,
          layerB: classConfig.layerBItems.length,
          capacity: classConfig.capacity,
          allocated: allocatedCounts[classConfig.classLabel],
          includeEachLayerBOnce: classConfig.includeEachLayerBOnce,
        },
      ])
    ),
    generatedCounts: Object.fromEntries(
      preparedClasses.map((classConfig) => [classConfig.classLabel, 0])
    ),
    outputs: [],
  };

  for (const [index, job] of jobs.entries()) {
    const tokenId = index + 1;
    const filename = `combined-${String(tokenId).padStart(4, "0")}.png`;
    const classConfig = preparedClasses.find((candidate) => candidate.classLabel === job.classLabel);
    const outputPath = path.join(baseOutputDir, classConfig.outputSubdir, filename);

    await renderComposite(job, outputPath, args.overlayFit);

    const output = {
      index: tokenId,
      file: filename,
      outputPath,
      classLabel: job.classLabel,
      layerA: job.layerA.name,
      layerAPath: job.layerA.path,
      layerB: job.layerB.name,
      layerBPath: job.layerB.path,
      dropMediaFile: `${tokenId}.png`,
    };

    manifest.generatedCounts[job.classLabel] += 1;
    manifest.outputs.push(output);
    await copyFile(outputPath, path.join(mediaDir, output.dropMediaFile));
    console.log(`Generated ${filename} <- ${job.layerA.name} + ${job.layerB.name} (${job.classLabel})`);
  }

  const metadataRows = [
    [
      "tokenID",
      "name",
      "description",
      "file_name",
      "external_url",
      `attributes[${args.layerAAttribute}]`,
      `attributes[${args.layerBAttribute}]`,
    ].join(","),
  ];

  for (const output of manifest.outputs) {
    metadataRows.push(
      [
        output.index,
        `${args.namePrefix}${output.index}`,
        args.description,
        output.dropMediaFile,
        "",
        stripExtension(output.layerA),
        stripExtension(output.layerB),
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const readme = await readmeTemplate(args.dropTemplateDir, args.collectionName, args.dateFolder);
  if (readme.copyFrom) {
    await copyFile(readme.copyFrom, path.join(args.dropDir, "README.txt"));
  } else {
    await writeFile(path.join(args.dropDir, "README.txt"), readme.content, "utf8");
  }

  await writeFile(path.join(args.dropDir, "metadata-file.csv"), `${metadataRows.join("\n")}\n`, "utf8");
  await writeFile(path.join(baseOutputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Manifest written to ${path.join(baseOutputDir, "manifest.json")}`);
  console.log(`Drop package written to ${args.dropDir}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
