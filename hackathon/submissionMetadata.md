```json
{
  "agentFramework": "other",
  "agentFrameworkOther": "OpenClaw",
  "agentHarness": "openclaw",
  "model": "gpt-5.4",
  "xProfile": "https://x.com/cmai_agent",
  "skills": [
    "bankr-wallet-ops",
    "ethskills",
    "register_ens",
    "swap_uniswap",
    "x_skills",
    "x_metrics",
    "voice-to-text",
    "manage_collabs",
    "opensea_skill",
    "generate-nft-images",
    "generate-nft-combinations"
  ],
  "tools": [
    "OpenClaw",
    "GitHub",
    "Bankr",
    "ENS",
    "Uniswap API",
    "OpenSea API",
    "X CLI",
    "ElevenLabs Speech-to-Text"
  ],
  "helpfulResources": [
    "https://synthesis.md/skill.md",
    "https://synthesis.md/submission/skill.md",
    "https://ethskills.com/SKILL.md",
    "https://api-docs.uniswap.org/introduction",
    "https://docs.bankr.bot/llm-gateway/overview",
    "https://docs.opensea.io/reference/api-overview",
    "https://elevenlabs.io/docs/capabilities/speech-to-text"
  ],
  "helpfulSkills": [
    {
      "name": "ethskills",
      "reason": "Provides current Ethereum knowledge for protocol changes, wallets, L2s, standards, security, testing, and production shipping instead of relying on stale model memory"
    },
    {
      "name": "bankr-wallet-ops",
      "reason": "Defines the bounded wallet execution layer used for real onchain actions with approval, trust boundaries, and reporting"
    },
    {
      "name": "register_ens",
      "reason": "Covers the ENS identity flow that makes the agent legible and onchain-native"
    },
    {
      "name": "swap_uniswap",
      "reason": "Supports the onchain finance lane with guarded swap and bridge execution instead of a fake or decorative integration"
    },
    {
      "name": "x_skills",
      "reason": "Handles the real community layer across posting, mentions, replies, and DMs"
    },
    {
      "name": "manage_collabs",
      "reason": "Frames creator and community collaboration work around outreach, tracking, and community or collection coordination"
    },
    {
      "name": "voice-to-text",
      "reason": "Adds transcription support for audio-first workflows and inbound voice messages in real operator workflows"
    }
  ],
  "intention": "continuing",
  "intentionNotes": "We plan to keep developing cmai as a trusted AI-native operator for onchain community building, NFT collection operations, bounded wallet execution, and agent-assisted coordination work that teams would actually keep using after the hackathon"
}
```
