# [cmai🤖.eth](https://x.com/cmai_agent)

> A trusted AI community builder for NFT collections and onchain community work.

## 10-Second Pitch

`cmai🤖.eth` is a trusted AI community builder designed to help with real NFT collection and onchain community work while keeping sensitive actions bounded, reviewable and legible without giving the agent unlimited control.

## Problem

Community building is still slow, manual, and hard to scale.

Teams creating NFT collections and onchain communities have to manage:
- DMs and replies
- collaborations
- content and posting
- allowlists and coordination
- identity and wallet-linked actions

Most teams do not trust an agent with money, access, identity, or public-facing decisions. The target user for this problem is:
- a founder
- a creator
- a small team building an NFT collection or onchain community

## Solution

`cmai` is designed to make real community work delegatable while keeping sensitive actions bounded, reviewable, and legible.

It helps teams handle:
- community support and social operations
- collaboration workflows
- NFT collection workflows
- ENS and wallet-linked identity tasks
- bounded onchain execution

The core risk it resolves is simple:

How do you let an agent help with real onchain community building and NFT collection work without giving it unsafe autonomy over money, identity, access, and community trust?


## Early Results

The agent got meaningful traction during the hackathon:

- **Impressions:** `1.6M`
- **Engagements:** `152K`
- **DMs:** `60K`
- **Followers:** `11K`
- **Whitelist requests:** `10K`

**X Profile:** [x.com/cmai_agent](https://x.com/cmai_agent)

## What Shipped

- **Live public identity:** active X presence at [x.com/cmai_agent](https://x.com/cmai_agent)
- **Community workflow handling:** support, replies, DMs, collaborations, and inbound coordination
- **ENS and identity work:** agent-facing naming and Ethereum-native identity flows
- **Bounded wallet actions:** guarded execution paths with approval boundaries and clear reporting
- **NFT collection workflow:** collection planning, creative generation, combinations, and operational prep

## Build Stack

- **Agent framework:** `other` (`OpenClaw`)
- **Agent harness:** `openclaw`
- **Model:** `gpt-5.4`
- **Key skills:** `bankr-wallet-ops`, `register_ens`, `swap_uniswap`, `x_skills`, `x_metrics`, `voice-to-text`, `manage_collabs`, `opensea_skill`, `generate-nft-images`, `generate-nft-combinations`
- **External tools:** `OpenClaw`, `GitHub`, `Bankr`, `ENS`, `Uniswap API`, `OpenSea API`, `X CLI`, `ElevenLabs Speech-to-Text`

## How to Run

```bash
git clone https://github.com/cmai-agent/cmai-synthesis.git
cd cmai-synthesis

# Start by reading the main docs
open README.md

# Then run skill-specific flows from the relevant skill folder
# Example:
cd skills/register_ens
```

## Repo Structure

- `README.md` - judge-first overview of the project, proof, stack, and links
- `AGENTS.md` - workspace operating manual for how `cmai` should run inside this repo
- `IDENTITY.md` - high-level identity, role, and mission of `cmai`
- `SOUL.md` - behavioral rules, risk posture, and communication style
- `HEARTBEAT.md` - daily and weekly operational loops for recurring checks and maintenance
- `MEMORY.md` - general template for durable non-sensitive preferences and defaults
- `USER.md` - general template for lightweight notes about the human operator
- `hackathon/` - submission-facing materials such as name, description, problem statement, demo story, track strategy, metadata, assets, and build logs
- `skills/` - reusable capabilities that make up the working system
- `memory/` - daily notes, transcripts, and time-based operating context when used

### Skills Overview

- `skills/bankr_wallet/` - bounded wallet execution layer and public framing for Bankr-based onchain actions
- `skills/register_ens/` - end-to-end ENS registration and configuration flows
- `skills/swap_uniswap/` - guarded Uniswap swap and bridge execution
- `skills/opensea_tools/` - NFT collection deployment support and OpenSea analytics or marketplace operations
- `skills/generate_nft_images/` - image-variation generation for NFT creative workflows
- `skills/generate_nft_combinations/` - trait and layer combination workflows for NFT collections
- `skills/manage_collabs/` - collaboration tracking, outreach, and community-partner coordination
- `skills/x_tools/` - X posting, replies, DMs, search, and engagement operations
- `skills/x_metrics/` - public-account analysis and lightweight X reporting
- `skills/voice_to_text/` - audio transcription and WhatsApp voice-note transcription flows
- `skills/crops_design/` - design-thinking support for shaping product direction and problem framing

### Hackathon Docs

- `hackathon/README.md` - submission-facing summary of the project story
- `hackathon/name.md` - official project name
- `hackathon/description.md` - short public description
- `hackathon/problemStatement.md` - the user pain and trust problem being solved
- `hackathon/tracks.md` - target tracks and why the project fits them
- `hackathon/submissionMetadata.md` - structured metadata for the submission
- `hackathon/conversationLog.md` - chronological build story

## Judge Scan

- **Demo Story:** [hackathon/demoVideo.md](./hackathon/demoVideo.md)
- **Hackathon Pack:** [hackathon/README.md](./hackathon/README.md)
- **Conversation Log:** [hackathon/conversationLog.md](./hackathon/conversationLog.md)
- **Submission Metadata:** [hackathon/submissionMetadata.md](./hackathon/submissionMetadata.md)
- **X Profile:** [x.com/cmai_agent](https://x.com/cmai_agent)
- **Public Repo:** [cmai-agent/cmai-synthesis](https://github.com/cmai-agent/cmai-synthesis)

### Why It Fits Synthesis and Ethereym

- it is a real human-agent collaboration, not an agent-shaped wrapper
- it is open source in a public repo
- the agent has a real identity, both onchain (ENS, wallet) and offchain (X account)
- the agent contributed meaningfully to design, coordination, execution, and operations
- the trust model is grounded in onchain identity, bounded actions, and receipts
- it is built around a real user problem 

### Why This Agent Is Real

During the hackathon, the agent contributed to:
- community and social operations
- collaboration handling and outreach
- NFT collection workflow support
- ENS and identity work
- bounded wallet execution flows

The strongest evidence is in the live public presence at [x.com/cmai_agent](https://x.com/cmai_agent).