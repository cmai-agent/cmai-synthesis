---
name: bankr-wallet-ops
description: Operate a dedicated Bankr wallet safely for agent-driven onchain actions. Use when setting up or documenting Bankr wallet flows for an agent, especially for balances, wallet identity, swaps, ENS-related actions, transfers, trusted-address/security setup, or bounded execution with human approval.
---

# Bankr Wallet Ops

Use this skill to define, document, or run the Bankr wallet layer behind an agent system.

This skill is for **wallet operations under explicit boundaries**, not for unconstrained trading or generic crypto chat.

In `cmai`, this is one of the core trust skills: it makes the wallet execution layer legible, bounded, and suitable for a real product instead of a hackathon-only wallet demo.

## Core model

Treat Bankr as the execution layer behind the agent.

The expected sequence is:
1. decide what action is being proposed
2. check policy / permission boundaries
3. require human approval for meaningful write actions
4. execute through Bankr
5. log the result and report the outcome clearly

## What this skill covers

Use this skill when the task involves one or more of these:
- dedicated Bankr wallet setup for an agent
- balance checks and wallet identity checks
- trusted-address or wallet security configuration
- small bounded swaps
- ENS-related wallet actions
- NFT-related wallet actions
- reward or transfer flows from the agent wallet
- documenting the Bankr architecture for a repo, submission, or hackathon package

For concrete workspace patterns and public-facing phrasing, load the reference files listed at the end of this skill instead of expanding the main instructions.

## Safety posture

Default to this safety posture unless the user explicitly wants something else:
- use a **dedicated Bankr wallet**, not a personal wallet
- keep only limited funds in it
- prefer Base for early tests when possible
- start with small actions first
- require explicit human approval before meaningful write actions
- do not commit Bankr credentials to git
- keep Bankr as infrastructure behind the trust model, not the whole product story

## Wallet policy

Use this execution policy for wallet actions in `cmai`.

Default amount policy:
- `small amount` = `<= $100` equivalent
- `big amount` = `> $100` equivalent

Risk overrides:
- treat illiquid assets, highly volatile assets, treasury-like balances, valuable NFTs, and rare collection items as high-risk even if the estimated value looks small
- treat sales, NFT listings, bridges, unfamiliar contract interactions, and broad approvals as high-risk regardless of nominal amount

### Read-only actions
Allowed by default:
- address checks
- balance checks
- wallet identity checks
- supported chain checks

### Allowed on direct human instruction after one explicit action summary
No second confirmation by default for small amounts:
- small transfers
- small swaps
- small approvals needed for a specific transaction

Before execution, summarize:
- wallet
- chain
- token or NFT
- amount
- destination or contract
- action type
- expected effect

### Always re-confirm before execution
- sales of NFTs or tokens
- any transfer, swap, bridge, approval, or listing above the threshold
- any new contract interaction introduced by the agent
- any approval broader than the immediate transaction
- any movement touching treasury-like balances or valuable NFTs
- any action where the quote, simulation, or transaction preview is unclear

### Contract interaction rules
- only interact with explicit wallets and explicit contracts
- only use methods or flows that can be described clearly before execution
- stop if the payload, spender, recipient, or resolved destination is unclear
- do not use unlimited allowances by default when a tighter approval is possible
- do not proceed with unverified or unexplained contract interactions

### Initiative rule
- if the human initiates the action, a small movement may proceed after a precise action summary
- if the agent initiates the action, any movement, sale, swap, bridge, approval, or listing always needs explicit human approval

## Quick operating pattern

### Read-only checks
Safe by default:
- confirm wallet address
- check balances
- inspect supported chains
- inspect whether the Bankr account is configured as expected

### Sensitive but operational setup
Use care and explain the effect:
- trusted address updates
- wallet security changes
- access scope decisions
- enabling write access

### Write actions
Pause at approval unless the user already asked for the exact action:
- swaps
- transfers
- ENS registration or configuration actions
- NFT-related wallet writes
- rewards or payouts

After any onchain action, report it in a short action style summary and include the transaction link when available.

When the task needs operational details already seen in this workspace, read `references/used-patterns.md`.

## Recommended hackathon framing

For hackathon or demo work, present Bankr like this:
- the agent proposes a wallet action
- the trust / approval layer constrains what is allowed
- the human approves when needed
- Bankr performs the wallet-side execution
- the system logs and reports what happened

This is stronger than presenting Bankr as random wallet functionality.

When the task is about repo docs, architecture notes, or submission wording, read `references/public-architecture.md`.

## References

Read these only when relevant:
- [`references/used-patterns.md`](references/used-patterns.md) — load for concrete operating patterns, current wallet context, setup flow, security defaults, and examples already used in this workspace
- [`references/public-architecture.md`](references/public-architecture.md) — load for public-facing architecture language, repo or hackathon framing, and examples of good vs bad Bankr descriptions
