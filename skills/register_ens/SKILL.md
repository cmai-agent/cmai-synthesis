---
name: register_ens
description: Register a .eth ENS name from a funded signer, set the latest public resolver, write forward address records, and set both default and legacy primary-name records in one run. Use when the user wants to buy an ENS domain for real, finish setup onchain, or hand a self-contained ENS purchase flow to another operator.
metadata:
  short-description: One-shot ENS buy + setup
---

# Register ENS

Use this skill when the goal is to execute a real `.eth` registration end-to-end, not just quote it.

In `cmai`, ENS is part of the trusted identity layer that makes the agent more legible and more natively Ethereum-based than a plain Web2 assistant.

## What this skill does

The bundled script:
- checks availability and current ownership
- registers the name if it is still free
- sets the latest public resolver
- sets forward address records
- sets both default and legacy primary-name records when the signer owns the name
- verifies the final onchain state

## Requirements

- A funded signer configured locally
- Optional RPC configuration for the target chain
- For the full one-shot path, keep `owner == signer address`

## Execute

From the skill folder:

```bash
npm install
node scripts/register_and_configure_ens.mjs --name example.eth
```

Useful flags:
- `--years 1`
- `--owner <owner-address>`
- `--wait-seconds 65`
- `--dry-run`

## Notes

- If the name is already registered to the target owner, the script skips registration and only repairs resolver and primary-name records.
- If `owner != signer`, the script can still register the name, but it will skip primary-name setup because reverse records require control of the owner address.
