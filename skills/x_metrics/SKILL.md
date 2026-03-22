---
name: x_metrics
description: Analyze public X/Twitter activity for any account using the workspace X CLI. Use when someone wants a lightweight metrics or activity readout for a person
---

# X Metrics

Use this skill for lightweight public-account analysis on X.

This skill is a reporting layer on top of `x_skills`. Use the command patterns from `../x_tools/SKILL.md` and prefer `xpost search` plus `xpost get` for arbitrary accounts.

For `cmai`, this supports operator visibility into public narratives, account activity, and social context around the community and collection activity.

Do not use:
- browser automation for X

For DMs, inbox review, replies, posting, or engagement actions, use `x_skills` directly with these commands:
- `xpost dms [--count 20]`
- `xpost dm-thread <thread_id>`
- `xpost dm <username_or_user_id> "Your message"`
- `xpost mentions [--count 20]`

## Core Idea

This skill is intentionally generic:
- the target can be any public handle
- the output is a recent-activity summary, not a full-fidelity analytics export
- the data source is the workspace X CLI, so always state the sample size and query used

Normalize the target handle first:
- accept `@handle` or `handle`
- strip the leading `@` when building queries
- treat the search query as the source of truth for arbitrary accounts

## Recommended Commands

Use these command shapes for a generic account review:

```bash
# Recent public posts by a target account
xpost search "from:HANDLE -is:reply" --count 25

# Include replies if the user wants conversational behavior too
xpost search "from:HANDLE" --count 25

# Recent public mentions of that account
xpost search "@HANDLE -from:HANDLE" --count 25

# Inspect a specific tweet more closely
xpost get TWEET_ID
```

Use `xpost mentions` only for the authenticated account's own mentions inbox. For random public accounts, prefer `xpost search "@HANDLE -from:HANDLE"`.

## Workflow

1. Normalize the handle.
2. Pull recent posts with `xpost search "from:HANDLE -is:reply"`.
3. Pull recent public mentions with `xpost search "@HANDLE -from:HANDLE"`.
4. If one or two tweets matter most, inspect them with `xpost get`.
5. Summarize what the fetched sample shows.
6. State coverage limits clearly: recent public sample, not full historical analytics.

## What To Report

For each run, include:
- the target handle
- the commands or query shapes used
- the number of posts and mentions inspected
- recurring topics or narratives
- notable tweets or mentions worth opening
- any visible engagement patterns
- a short limitations note

If the CLI output includes public metrics such as likes, replies, reposts, quotes, or views:
- aggregate only over the fetched sample
- label the result as sample-based
- do not present it as complete account analytics

If the CLI output does not include structured metrics:
- give a qualitative activity summary instead
- rank notable tweets by what was visible in the returned output

## Example Summary Frame

```text
Target: @handle
Posts reviewed: 25 recent posts from search query `from:handle -is:reply`
Mentions reviewed: 25 recent results from query `@handle -from:handle`
Themes: product updates, collector outreach, event reactions
Notable items: one post with strong visible engagement, two recurring questions in mentions
Limits: recent public sample from X CLI, not full analytics export
```

## Guardrails

- Use `x_skills` command patterns as the source of truth for X actions.
- For arbitrary people or brands, prefer search-driven collection over authenticated-account commands.
- When the user wants action, such as replying or sending a DM, move into the corresponding `x_skills` workflow instead of inventing a metrics-only shortcut.
