---
name: manage_collabs
description: Manage NFT or creator collaborations for any project, using the workspace X CLI for DMs, lightweight tracker workflows, and optional NFT combination planning based on the user's idea.
description: Manage creator or community collaborations for any project, using the workspace X CLI for DMs and lightweight tracker workflows.
---

# Manage Collabs

Use this skill when the user wants help running collaborations with creators, collectors, communities, or partners around an NFT project or drop.

In `cmai`, this is part of the real operator story: collaboration handling, outreach, and follow-up are core community-building tasks that teams actually struggle to delegate safely.

This skill should stay generic:
- do not assume a specific collection, art direction, schema, or workspace layout
- do not hardcode local absolute paths into the plan unless the user already gave them
- do not assume whitelist terms such as `GTD` or `FCFS` unless the current project actually uses them

## Primary DM Workflow

For X/Twitter DMs, use [`../x_tools/SKILL.md`](../x_tools/SKILL.md).

Use the workspace X CLI for DM sending and thread management in this workflow, especially:

```bash
# Read recent DMs
xpost dms --count 20

# Read a DM thread
xpost dm-thread <thread_id>

# Send a DM
xpost dm <username_or_user_id> "Your message"
```

Default DM process:

1. Read the thread or recent inbox context first.
2. Draft the outgoing message in the user's requested tone.
3. Confirm recipient and message body unless the user explicitly asked for immediate sending.
4. Send through `xpost dm`.
5. Report what was sent or what blocked execution.

## Collaboration Workflow

Start by identifying which of these jobs the user actually wants:
- inbound triage
- outbound outreach
- follow-up management
- grant or access coordination
- wallet collection
- partner status tracking

Then keep the workflow project-shaped rather than forcing an old schema.

Recommended operating order:

1. Clarify the collaboration goal from the current conversation.
2. Inspect any existing tracker, notes, or DM thread the user already has.
3. Build or update a minimal tracker that matches the current project.
4. Use X DMs for outreach or follow-up.

## Tracker Guidance

If the user already has a CSV, JSON, or Notion-style tracker, preserve that structure unless it is clearly broken.

If no tracker exists, start with a minimal schema such as:
- `handle`
- `display_name`
- `status`
- `category`
- `asks`
- `deliverables`
- `wallet`
- `last_contact_at`
- `next_action`
- `notes`

Only add fields like `requested_GTD`, `accepted_FCFS`, campaign phases, or special labels when the user asks for that exact operating model.

## Automation Stance

This skill is instruction-first.

Do not assume there is a ready-made local automation for the current collaboration project.
If the user needs project-specific tooling, build or adapt a small helper only after the workflow and schema are clear.

Prefer:
- direct use of `xpost dm` for messaging
- a simple project-local tracker
- explicit scripts created for the current collaboration setup

## Guardrails

- Never send a DM without checking the latest thread context.
- Never assume the current user wants the old tracker schema.
- Keep the skill focused on collaboration handling, outreach, follow-up, and tracker hygiene.
