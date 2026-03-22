# Bankr Wallet Ops — Used Patterns

## Scope in this workspace

Bankr is used here as the dedicated wallet execution layer for the agent.
In submission framing, that supports the `trust` and `Agents that pay` story because the wallet actions are bounded, reviewable, and tied to a real user workflow.

The main patterns already used or explicitly planned are:
- dedicated agent wallet setup
- wallet identity and balance checks
- trusted-address / wallet security updates
- bounded swaps
- ENS-related wallet actions
- NFT-related wallet interactions
- reward sending from the agent wallet

## Current wallet context

In this public repo, wallet examples should stay descriptive rather than account-specific.
Document the existence of a dedicated agent wallet, but do not publish concrete wallet addresses here.

## Bankr setup pattern

Recommended setup flow:
1. install Bankr CLI
2. log in with a dedicated account
3. choose explicit access scope
4. verify with identity and balances
5. keep initial funds limited
6. run only small approved actions first

## Security pattern

Use these rules by default:
- separate Bankr wallet from personal funds
- keep access material out of git
- keep access controls tight
- prefer low-cost chains like Base for first tests
- make the human approve meaningful writes

## Concrete examples seen in this workspace

### Wallet configured for the agent
Hackathon progress notes record that the agent wallet was configured with Bankr.

### Trusted-address security updates
Hackathon notes record that wallet safety controls were tightened during testing.

### First rewards sent from the wallet
Hackathon progress notes record that the agent sent first rewards using its own wallet via Bankr.

### ENS-related operations
Planning docs tie Bankr to ENS-related actions and bounded wallet execution.
Daily notes also show Bankr-specific blockers around resolver access, wrapped ENS names, and pricing constraints during ENS work.

### Swap-related operations
Hackathon plans explicitly position Bankr as a candidate wallet execution layer for bounded swap flows.

## How to talk about Bankr publicly

Best framing:
- Bankr is the execution layer
- the trust model sits above it
- approvals and policy define what can happen
- Bankr performs the wallet-side action
- the system records what happened

Avoid framing it as:
- a random wallet plugin
- an unrestricted autonomous trading bot
- the whole product itself
