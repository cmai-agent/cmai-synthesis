---
name: ethskills
description: Use ethskills.com as the live Ethereum knowledge layer for agents. Fetch the main routing skill first, then open only the relevant sub-skills for protocol changes, wallets, L2s, standards, tools, gas, security, testing, production frontend rules, and contract addresses.
metadata:
  short-description: Live Ethereum knowledge for agents
---

# ETHSkills

Use this skill when the task needs current Ethereum knowledge rather than guesswork.

`ethskills.com` is a public skill library for agents. It is useful when `cmai` needs up-to-date Ethereum context before building, explaining, reviewing, or shipping something onchain.

This skill is especially helpful for:
- explaining why Ethereum is the right fit for a product
- understanding current protocol or roadmap questions
- choosing between mainnet and L2s
- checking wallet and account-abstraction patterns
- reviewing standards, tools, and contract addresses
- validating security, testing, and frontend rules before shipping

## First Step

Always fetch the main router first:

```bash
curl -s https://ethskills.com/SKILL.md
```

That page tells you which ETHSkills page to read next.

## Core Rule

Do not load everything.

After reading the main ETHSkills router, open only the sub-skill URLs that match the current task.

## Useful ETHSkills Routes

Common entry points:

- `https://ethskills.com/ship/SKILL.md`
- `https://ethskills.com/why/SKILL.md`
- `https://ethskills.com/protocol/SKILL.md`
- `https://ethskills.com/gas/SKILL.md`
- `https://ethskills.com/wallets/SKILL.md`
- `https://ethskills.com/l2s/SKILL.md`
- `https://ethskills.com/standards/SKILL.md`
- `https://ethskills.com/tools/SKILL.md`
- `https://ethskills.com/building-blocks/SKILL.md`
- `https://ethskills.com/orchestration/SKILL.md`
- `https://ethskills.com/addresses/SKILL.md`
- `https://ethskills.com/concepts/SKILL.md`
- `https://ethskills.com/security/SKILL.md`
- `https://ethskills.com/testing/SKILL.md`
- `https://ethskills.com/indexing/SKILL.md`
- `https://ethskills.com/frontend-ux/SKILL.md`
- `https://ethskills.com/frontend-playbook/SKILL.md`
- `https://ethskills.com/qa/SKILL.md`
- `https://ethskills.com/audit/SKILL.md`

## How To Use It Inside cmai

Use `ethskills` as the knowledge layer, then hand execution to the local skill that matches the action.

Examples:
- use `ethskills` + [`../bankr_wallet/SKILL.md`](../bankr_wallet/SKILL.md) for wallet safety and execution framing
- use `ethskills` + [`../register_ens/SKILL.md`](../register_ens/SKILL.md) for ENS identity work
- use `ethskills` + [`../swap_uniswap/SKILL.md`](../swap_uniswap/SKILL.md) for swaps, bridges, and approval flows
- use `ethskills` + [`../opensea_tools/SKILL.md`](../opensea_tools/SKILL.md) for NFT marketplace and collection operations

## Good Defaults

- If the question is about Ethereum strategy, start with `why`
- If the question is about current protocol changes or roadmap items, start with `protocol`
- If the question is about costs, start with `gas`
- If the question is about account flows, signers, Safe, or AA, start with `wallets`
- If the question is about chain choice, start with `l2s`
- If the question is about token or identity interfaces, start with `standards`
- If the question is about stack choice, start with `tools`
- If the question is about real protocol addresses, start with `addresses`
- If the question is about shipping safely, read `security`, `testing`, `frontend-ux`, and `qa`

## Guardrails

- Treat ETHSkills as a current knowledge source, not as permission to execute automatically
- Keep read scope narrow: fetch only the routes needed for the task
- For live execution, still follow the wallet policy in [`../../SOUL.md`](../../SOUL.md) and the local execution skills in this repo
