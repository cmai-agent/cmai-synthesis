---
name: swap_uniswap
description: Quote and execute Uniswap swaps and bridges with a funded signer using the Uniswap Trading API. Use when the user wants to preview approval and quote requirements, run a guarded same-chain swap, submit a cross-chain ERC20 bridge, or get a short on-chain summary plus transaction link.
metadata:
  short-description: One-shot Uniswap trade
---

# Swap Uniswap

Use this skill when the goal is to execute a real Uniswap trade, not just discuss routing. It now covers both same-chain swaps and cross-chain bridges.

For `cmai`, this skill strengthens the `Agents that pay` story by showing a real finance path with guardrails, confirmations, and explicit execution boundaries.

## What this skill does

The bundled scripts:
- check token metadata
- check whether token approval is needed
- fetch quotes from the Uniswap Trading API
- execute approvals when required
- execute same-chain swap transactions for supported routes
- execute supported cross-chain bridge submission transactions
- optionally unwrap WETH to native ETH on supported chains for same-chain swaps
- return a short action summary plus explorer link or bridge tracking identifiers

## Safety model

- Default mode is `--dry-run`
- Real execution requires both `--execute` and the route-specific confirmation string
- Ask the user to confirm the transaction summary before using `--execute`
- Current execution path is intentionally conservative:
  - `scripts/swap_uniswap.mjs` is for same-chain swaps only and uses `--confirm EXECUTE_SWAP`
  - `scripts/bridge_uniswap.mjs` is for cross-chain routes only and uses `--confirm EXECUTE_BRIDGE`
  - approval-based routes only
  - if the quote requires Permit2 or returns an auction route, the scripts stop and explain why
  - bridge submission confirms the source-chain transaction only; destination delivery can complete later

## Requirements

- Local Uniswap API access configured outside the repo
- A funded signer configured locally for execution, or `--wallet` for quote-only checks
- Optional RPC overrides for the target chains

## Same-Chain Swap

From the skill folder:

```bash
npm install
node scripts/swap_uniswap.mjs \
  --chain base \
  --token-in <token-in-address> \
  --token-out <token-out-address> \
  --amount-in 100 \
  --dry-run
```

Real execution:

```bash
node scripts/swap_uniswap.mjs \
  --chain base \
  --token-in <token-in-address> \
  --token-out <token-out-address> \
  --amount-in 100 \
  --execute \
  --confirm EXECUTE_SWAP
```

Useful flags:
- `--wallet 0x...`
- `--recipient 0x...`
- `--slippage-bps 50`
- `--routing BEST_PRICE`
- `--unwrap-weth`
- `--protocols V2,V3,V4`
- `--rpc-url <url>`

## Cross-Chain Bridge

From the same skill folder:

```bash
node scripts/bridge_uniswap.mjs \
  --from-chain base \
  --to-chain ethereum \
  --token-in <token-in-address> \
  --token-out <token-out-address> \
  --amount-in 100 \
  --wallet <wallet-address> \
  --dry-run
```

Real execution:

```bash
node scripts/bridge_uniswap.mjs \
  --from-chain base \
  --to-chain ethereum \
  --token-in <token-in-address> \
  --token-out <token-out-address> \
  --amount-in 100 \
  --execute \
  --confirm EXECUTE_BRIDGE
```

Useful flags:
- `--recipient 0x...`
- `--slippage-bps 50`
- `--routing BEST_PRICE`
- `--from-rpc-url <url>`
- `--to-rpc-url <url>`

## Notes

- For a native-ETH style outcome on Base, Optimism, Arbitrum, Ethereum, or Unichain, quote to WETH and add `--unwrap-weth`.
- If Uniswap returns a Permit2-dependent or UniswapX route, the scripts exit instead of guessing how to sign it.
- Prefer a dry-run first for bridges and inspect the `tracking` object in the JSON output for later status checks.
- After any successful on-chain action, report the short action summary and the explorer link back to the user.
