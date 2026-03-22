---
name: generate-nft-combinations
description: Generate composite NFT images by pairing assets from two visual layers, exporting rendered outputs plus a manifest. Use when someone wants to combine trait layers, prototype collection combinations, or adapt the workflow to a new NFT idea with custom asset groups and metadata rules.
---

# Generate NFT Combinations

Use this skill when someone wants to create NFT outputs by combining assets from two image layers:
- `layer A`: the base canvas or primary artwork
- `layer B`: the overlay, accessory, frame, effect, or second trait layer

In `cmai`, this supports a real NFT collection workflow by producing collection assets and previews that connect to an actual community and marketplace path, not just a standalone art demo.

The bundled tools randomly or exhaustively pair the two layers, render composite images, and write a `manifest.json` that records which assets were used.

## What This Skill Assumes

- The workflow is a two-layer composition:
  - layer A sets the output dimensions
  - layer B is resized or placed on top of layer A
- Inputs are flat image files such as `png`, `jpg`, `jpeg`, `webp`, `tif`, `tiff`, or `avif`
- Transparent PNGs work best for the overlay layer

If the idea needs more than two layers, weighted rarity, or custom metadata rules, use this skill as the starting point and extend the scripts for that collection.

## Prerequisites

Install dependencies from the skill folder:

```bash
cd .
npm install
```

## Main Command

```bash
scripts/nft-combinations \
  --layer-a-dir ./layer-a \
  --layer-b-dir ./layer-b \
  --count 20
```

## Common Usage

```bash
# Use the built-in folders inside the skill:
# - put base images in ./layer-a
# - put overlay images in ./layer-b
# - generated files go to ./output
scripts/nft-combinations --count 50

# Unique pairs only
scripts/nft-combinations \
  --count 24 \
  --mode without-replacement

# Override the default folders and labels for a new project
scripts/nft-combinations \
  --layer-a-dir ./project-inputs/base-assets \
  --layer-b-dir ./project-inputs/overlay-assets \
  --layer-a-label character \
  --layer-b-label accessory \
  --output-dir ./project-output/composited \
  --count 24

# Generate every possible pair
scripts/nft-combinations --mode all-pairs
```

## Tiered Drop Helper

Use `generate-class-drop.mjs` when the collection has grouped subfolders such as `common`, `rare`, and `legendary`, and you want:
- only same-tier combinations
- unique layer A + layer B pairs
- optional tiers where every overlay in that tier must appear exactly once
- a packaged drop folder with `Media/`, `README.txt`, and `metadata-file.csv`

Example:

```bash
node scripts/generate-class-drop.mjs \
  --layer-a-root ./traits/layer-a \
  --layer-b-root ./traits/layer-b \
  --class-config-file ./tier-config.json \
  --drop-dir ./drop-package \
  --count 120 \
  --collection-name "My Collection" \
  --name-prefix "Token #" \
  --description "A layered NFT drop built from custom traits." \
  --layer-a-attribute Background \
  --layer-b-attribute Accessory
```

Example `tier-config.json`:

```json
[
  {
    "classLabel": "common",
    "layerASubdir": "common",
    "layerBSubdir": "common",
    "outputSubdir": "common",
    "weight": 8
  },
  {
    "classLabel": "rare",
    "layerASubdir": "rare",
    "layerBSubdir": "rare",
    "outputSubdir": "rare",
    "weight": 3
  },
  {
    "classLabel": "legendary",
    "layerASubdir": "legendary",
    "layerBSubdir": "legendary",
    "outputSubdir": "legendary",
    "includeEachLayerBOnce": true
  }
]
```

## Guidelines For Adapting This Skill To A New NFT Idea

When turning this into a project-specific NFT generator, define these things first:

1. Layer model:
Choose what layer A and layer B represent for the collection, for example `character + accessory`, `background + frame`, or `base art + effect`.

2. Asset rules:
Decide whether every pair is allowed, whether only same-tier pairs are valid, and whether any traits must appear exactly once or at fixed positions.

3. Folder structure:
Pick a directory layout that matches the concept. For simple projects, use one folder per layer. For rarity-driven projects, use tier subfolders plus a JSON class config.

4. Metadata schema:
Decide the collection name, token naming pattern, description, CSV attribute names, and whether filenames or manifest fields need extra columns.

5. Output policy:
Choose the target count, file format, fit mode, naming prefix, and whether generation should be random, unique-only, or full cartesian.

## Turning A User Idea Into A New NFT Generator

When the user arrives with only a concept, translate it into the generator in this order:

1. Write the concept in one sentence:
Summarize the collection as `what is repeated + what changes + what makes a token special`.

2. Map the concept to the current layer model:
- if the idea fits `base + overlay`, keep this skill as-is
- if it needs same-tier pairing, tier quotas, or drop packaging, use `generate-class-drop.mjs`
- if it needs more than two visual layers or trait dependencies, plan a follow-on script instead of overloading the generic one

3. Rename the layers in the user's vocabulary:
Choose labels that match the idea, such as `character`, `mask`, `frame`, `aura`, or `ticket`, so the manifest and metadata read naturally.

4. Decide the pairing rules:
Document whether all combinations are valid, whether tiers must match, whether some traits are mandatory, and whether a specific trait should appear once, often, or rarely.

5. Choose the folder layout:
- simple concept: one folder per layer
- rarity or class-based concept: subfolders per tier plus a class config file
- custom logic concept: project folder plus an extra script that reads a JSON config

6. Define the output package:
Pick the token naming pattern, collection title, description, manifest fields, CSV attribute names, and whether the user needs just rendered images or a marketplace-ready drop package.

7. Run a dry pass before real rendering:
Use `--dry-run` first so the manifest, pair counts, and naming scheme can be checked before generating final images.

## Intake Checklist For A New Collection

Before editing scripts, capture these answers from the user's idea:
- What are the two main visual groups being combined?
- Are all pairs valid, or are some combinations forbidden?
- Does rarity matter, and if so, is it random weight, fixed class, or must-appear rules?
- Does the output need only images, or also manifest and CSV metadata?
- Is the goal a small prototype, a full drop, or a generator the user will reuse later?

If any answer forces three or more independent trait layers, weighted rarity, or rule-based exclusions, keep the current skill as the prototype and create a project-specific extension instead of forcing everything into two-layer flags.

## How To Build A New Project-Specific Version

If the user has a specific collection idea, adapt this skill in this order:

1. Keep `nft-combinations.mjs` if the project is still a simple two-layer compositor.
2. Add or rename CLI labels so the manifest uses the user’s vocabulary.
3. Update `generate-class-drop.mjs` only if the project needs tier logic, forced placements, or CSV packaging.
4. Add extra scripts only when the collection needs behavior this generic version cannot express cleanly, such as weighted rarity, 3+ layers, or dependency rules between traits.
5. Preserve the generic version as the base skill and put project-specific assumptions in clearly named flags, config files, or a separate follow-on skill.

## Suggested Build Flow

Use this quick build sequence when the user wants you to turn the idea into working generation steps:

1. Create or confirm the input folder structure that matches the concept.
2. Pick whether `nft-combinations` or `generate-class-drop.mjs` is the right base.
3. Rename labels and metadata fields to the user's vocabulary.
4. Run `--dry-run` and inspect the manifest.
5. Adjust trait rules or counts.
6. Generate a small sample set.
7. Only then run the final production-sized batch.

## Useful Options

- `--count`: number of images to generate. Default: `10`, except `all-pairs` where omitting it generates the full cartesian product
- `--mode`: `with-replacement`, `without-replacement`, or `all-pairs`
- `--overlay-fit`: `stretch`, `contain`, `cover`, or `none`. Default: `stretch`
- `--format`: `png`, `jpeg`, or `webp`. Default: `png`
- `--prefix`: output filename prefix. Default: `combined`
- `--dry-run`: validate inputs and write the manifest without rendering images

## Notes

- Layer B is composited on top of layer A
- By default the overlay is resized to the exact layer A size with `stretch`
- Output dimensions always follow the selected layer A image
