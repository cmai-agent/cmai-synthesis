---
name: generate-nft-images
description: Generate themed NFT image variants from a reference image using OpenAI image edits.
---

# Generate NFT Images

Use this skill when you want to create multiple NFT-style variations from one reference asset while preserving the original composition.

For `cmai`, this skill supports the collection pipeline by turning concepts into usable collection and content assets instead of leaving the project at the mockup stage.

It wraps the repo's existing OpenAI image-edit workflow and gives you repo-native defaults for:
- a default reference image
- a reusable NFT-oriented prompt template
- a timestamped output folder under `output/generate-nft-images/`

## Prerequisites

- Node.js 20+
- OpenAI access configured locally outside the repo

## Main Command

```bash
scripts/generate-nft-images --prompts '["gold chrome","zombie","ice","lava"]'
```

## Common Usage

```bash
# Use the default reference image and the default NFT template
scripts/generate-nft-images \
  --prompts '["gold chrome","zombie","ice","lava"]'

# Use prompts from a text file, one per line
scripts/generate-nft-images \
  --prompts-file /absolute/path/to/themes.txt

# Override the reference image
scripts/generate-nft-images \
  --reference /absolute/path/to/reference.png \
  --prompts '["diamond","toxic","neon grid"]'

# Override the output folder
scripts/generate-nft-images \
  --prompts-file /absolute/path/to/themes.txt \
  --output-dir /absolute/path/to/output/nft-batch

# Dry run to inspect the generated manifest without calling OpenAI
scripts/generate-nft-images \
  --prompts '["gold chrome","zombie"]' \
  --dry-run
```

## Defaults

If you do not provide these flags, the wrapper supplies them automatically:

- `--use-default-reference`
- `--template-file nft-template.txt`
- `--output-dir output/generate-nft-images/<timestamp>`

## Notes

- The wrapper passes through any extra options supported by `tools/openai-image-batch/generate-images.mjs`
- The default reference image lives at `../../tools/openai-image-batch/reference/default-reference.png`
- The default template lives at `nft-template.txt`
- Best results come from clean source assets with a centered subject and transparent background
