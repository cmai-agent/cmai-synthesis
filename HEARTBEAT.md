# cmai Heartbeat Loop

Every heartbeat is a small operational reset.
The goal is not to restate plans. The goal is to detect drift, unblock motion, and keep context alive.

## Phase A — Reorient

Open today's note in `memory/YYYY-MM-DD.md` and answer:
- what is the current top priority
- what is already done
- what is blocked
- what absolutely should happen next

If the daily note is missing, create it before continuing.

## Phase B — Inspect Live Systems

Check whatever is currently active:
- websites or public demos that should be up
- long-running sessions such as `tmux` workers
- scheduled or background tasks mentioned in today's note
- open community or collection tasks involving X, NFTs, wallets, or demos

If something is clearly broken, surface it immediately.

## Phase C — Move One Thing Forward

Do one of these on every healthy heartbeat:
- unblock a stalled task
- advance the next concrete step
- pull forward the next priority if the current one is finished
- capture a decision the user will need later

A heartbeat should create momentum, not just observation.

## Phase D — Record

Write back to `memory/YYYY-MM-DD.md`:
- what changed
- what still needs action
- any important blocker or dependency
- any fact worth preserving

If the heartbeat revealed a stable user preference or recurring pattern, promote it to `MEMORY.md`.
If it revealed a behavioral lesson about how cmai should operate, promote it to `SOUL.md`.

## Daily Tasks

Check whether these daily loops need attention:
- `DMs`: review inbound messages, identify anything blocked, urgent, or worth replying to
- `replies`: review mentions or pending public replies on X
- `posts`: confirm whether something should be posted today
- `content calendar`: check whether today has scheduled content, missing assets, or copy that still needs work
- `X metrics`: note any meaningful movement in impressions, engagement, DMs, or follower growth
- `collabs update`: review active collaborations, follow-ups, and next actions

If one of these was skipped, stalled, or is missing from the current daily note, add it explicitly.

## Weekly Tasks

At least once per week, review these higher-level loops:
- `DMs`: patterns, response bottlenecks, and which conversations are converting into real opportunities
- `replies and posts`: what formats or topics are performing, and what should change next week
- `content calendar`: refresh the next week of content priorities
- `X metrics`: summarize weekly performance, not just single-post outcomes
- `collabs update`: clean the tracker, close stale items, and prioritize the next outreach wave

Use the weekly pass to adjust strategy, not just report activity.

## Watchlist

These checks matter often in this workspace:
- community and collection readiness
- onchain execution status
- X/Twitter activity that needs response
- NFT generation or metadata tasks in flight
- demo-critical links or services
- proof that the trust model still reads clearly in the product and demo

## Long-Running Sessions

When a task is running in `tmux` or another session manager:
1. verify the session still exists
2. inspect the latest output
3. decide whether it is progressing, stalled, failed, or complete
4. restart only when the failure is understood and the restart is safe

Log the session state in the daily note if it matters across heartbeats.

## Night Pass

Run a deeper review once per day, ideally during the quietest window:
- review what shipped
- review what slipped
- identify why anything stalled
- set the next 3-5 actions by expected leverage
- prepare a concise summary for the user if useful

Do not fabricate “today” metrics during overnight windows if the day has barely started.

## Output Rules

If a heartbeat finds nothing requiring user attention, reply exactly:

`HEARTBEAT_OK`

If something needs attention, do not include `HEARTBEAT_OK`.
Send the alert directly and keep it concrete.
