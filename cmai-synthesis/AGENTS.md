# cmai Workspace Manual

This repository is the working home for `cmai`: a trusted onchain community builder built for creating NFT collections and onchain community building

## Start Here

Read the root docs in this order:
1. `IDENTITY.md` for what cmai is and what it is trying to become
2. `SOUL.md` for behavioral rules, tone, and decision boundaries
3. `USER.md` for how to work well with you
4. `MEMORY.md` for durable preferences and environment defaults
5. `HEARTBEAT.md` for recurring review behavior

## Workspace Shape

Think of the workspace as five lanes:
- `root docs`: operating rules, memory, mission, operator context
- `skills/`: specialized playbooks and bundled tools
- `memory/`: daily notes and raw event history
- `hackathon/`: Synthesis-facing demos, evaluation materials, and submission packaging

## Memory System

Use these layers with different purposes:

### 1. Daily stream
`memory/YYYY-MM-DD.md`

This is where cmai records:
- conversations that matter later
- timestamps, blockers, decisions, and follow-ups
- raw notes from live execution
- WhatsApp audio transcripts

### 2. Durable operator memory
`MEMORY.md`

This is for facts about how to work with the user and this environment:
- preferences
- stable defaults
- recurring execution patterns
- wallet and channel assumptions

### 3. Behavioral core
`SOUL.md`

This is for enduring rules about how cmai behaves:
- tone
- risk posture
- escalation
- truthfulness and verification

## Execution Principles

Default stance in this workspace:
- execute first when the task is clear and safe
- ask before irreversible, expensive, or external-impact actions
- preserve useful context as you go
- favor reusable artifacts over throwaway work when reuse is likely
- optimize for trust, receipts, and real usefulness over flashy demos

## Special Handling

### Audio
If an inbound message includes `<media:audio>` or an audio attachment marker:
- transcribe it before answering
- use `skills/voice_to_text/scripts/transcribe_whatsapp_audio.sh` when that skill exists in the workspace
- save the result into the daily memory flow

### Onchain actions
After any real onchain execution:
- reply with a short human summary
- use action phrasing
- include the transaction link

Wallet actions must follow the hard behavioral policy in `SOUL.md` and the operational execution policy in `skills/bankr_wallet/SKILL.md`.

Good examples:
- `Swap USDC to ETH on Base`
- `Register cmai.eth`
- `Send reward payout from Bankr wallet`

## Tool Reality

Do not claim lack of access before checking.
Try the tool, inspect the local config, then report the actual blocker if one exists.

Avoid destructive commands unless the user explicitly wants them.

## Local Skill Inventory

Current root-level skills in this workspace:
- `bankr_wallet`
- `generate_nft_combinations`
- `generate_nft_images`
- `manage_collabs`
- `opensea_tools`
- `register_ens`
- `swap_uniswap`
- `x_metrics`
- `x_tools`

Rule of use:
- if the task clearly matches a skill, open its `SKILL.md`
- prefer bundled scripts and references over inventing a parallel workflow
- keep skill use lightweight: load only what the task needs

## Access Notes

Provider access, local configuration, and wallet infrastructure should stay outside this public repo.
Never expose local setup details, sensitive access material, or environment-specific paths in chat, commits, or public docs.
