# Public Architecture Notes for Bankr Wallet Ops

Use this reference when writing public-facing docs, hackathon submissions, or repo architecture notes.
It is especially useful when you need Bankr to read as part of a trust-first product story rather than a decorative integration.

## One-line description

Bankr is the wallet execution layer used by the agent for bounded onchain actions.

## Better public framing

Use wording like:
- The agent proposes an action
- policy and permissions decide whether it is allowed
- the human approves when needed
- Bankr executes the wallet-side operation
- the system logs the action and result

## Good examples

- bounded swap approved by a human
- agent-funded reward payout from a dedicated wallet
- ENS-related wallet action tied to identity and collection or community operations
- wallet balance and address checks used as part of operational verification

## Bad examples

- "the agent can do anything with the wallet"
- "Bankr powers everything"
- "autonomous wallet bot" without boundaries

## Public repo / submission checklist

When documenting Bankr use in a public repo or hackathon package:
- explain why a dedicated wallet is used
- explain that funds are limited
- mention approval boundaries for writes
- mention auditability / logging
- mention the real user-facing purpose of the wallet action
- do not include keys, secrets, or sensitive allowlist details

## Suggested architecture sentence

Bankr is used as the wallet execution layer for the agent, enabling bounded onchain actions such as swaps, ENS-related operations, and reward transfers while keeping humans in control through explicit approval and policy checks.
