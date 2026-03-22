---
name: x_skills
description: Handle X/Twitter posting, mentions, replies, engagement, search, and DM-oriented workflows using the workspace X CLI, preferring xpost commands when available.
---

# X/Twitter — x-skills

Use this skill for all X/Twitter work: posting, mentions, replies, engagement, search, and DMs.

For `cmai`, this is part of the real community operations layer: not just broadcasting content, but handling support, outreach, and public-facing coordination where trust and tone matter.

All X/Twitter interactions should go through the configured workspace CLI. When `xpost` supports the action, use it. Never use browser automation for X.

## Setup

1. Install: `npm install -g xpost-cli`
2. Configure X access locally outside the repo before using the workspace CLI.

## Commands

```bash
# Post a tweet
xpost post "Your tweet text here"

# Reply to a tweet
xpost reply <tweet_id> "Your reply text"

# Quote tweet
xpost quote <tweet_id> "Your quote text"

# Get mentions
xpost mentions [--count 20]

# Search recent tweets
xpost search "query string" [--count 10]

# Like a tweet
xpost like <tweet_id>

# Retweet
xpost retweet <tweet_id>

# Delete a tweet
xpost delete <tweet_id>

# Get a single tweet
xpost get <tweet_id>

# Home timeline
xpost home [--count 20]

# Read recent DMs
xpost dms [--count 20]

# Read a DM thread
xpost dm-thread <thread_id>

# Send a DM
xpost dm <username_or_user_id> "Your message"
```

## Capability map

- `x_posting`: publish tweets and quote tweets
- `x_replies`: reply to tweets and respond to mentions
- `x_engagement`: read mentions, like, retweet, inspect home timeline
- `x_search`: search recent tweets and inspect specific tweets
- `x_dms`: read and send DMs 

## Replies workflow

Use this skill for public replies when the user wants to answer a tweet or handle mentions.

Preferred workflow:
- read the target tweet or mentions context first
- draft a concise reply in the requested tone
- send the reply through the X CLI
- confirm the posted reply back to the user

Reply commands:

```bash
# Inspect mentions
xpost mentions [--count 20]

# Reply to a specific tweet
xpost reply <tweet_id> "Your reply text"

# Inspect a tweet before replying
xpost get <tweet_id>
```

Reply guardrails:
- Always read the target tweet before replying when a `tweet_id` is available
- Keep replies short unless the user asks for a longer thread
- If the reply is sensitive, controversial, or brand-critical, show the draft before sending unless the user explicitly asked for direct execution

## DMs workflow

Use this skill for X direct messages when the user wants to review inbox messages, draft a DM, send a DM, or continue an existing DM thread.

Preferred workflow:
- read the DM inbox or target thread first
- read the current DM thread or inbox context
- draft the outgoing message in the requested tone
- send the DM through the workspace X CLI
- summarize what was sent or what blocked execution

DM commands:

```bash
# Read recent DMs
xpost dms [--count 20]

# Read a DM thread
xpost dm-thread <thread_id>

# Send a DM
xpost dm <username_or_user_id> "Your message"
```

DM guardrails:
- Never send a DM without confirming the recipient and message body
- When continuing an existing thread, read the recent context first
- For outreach or sensitive conversations, draft first unless the user explicitly wants immediate send
- Respect local account limits and the workspace sending policy

## Rate Limits 
- POST tweets: 100/15min, 10,000/24hrs
- GET mentions: 300/15min
- GET timeline: 900/15min
- Search recent: 300/15min
- Likes: 50/15min, 1,000/24hrs
- DM sends: follow local account and workspace limits

## Tips
- Always use the configured X CLI — never use browser automation for X
- Output is JSON by default; use `--pretty` for formatted or `--text` for plain
- For engagement: reply to mentions promptly, quote-tweet interesting content with your take
- Keep DM usage within the local account and workspace limits
