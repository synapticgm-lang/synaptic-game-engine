# 37 — Phase 0 leftovers: server Gemini fallback, database metering, IP headers

**Phase:** Phase 0 leftovers  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  
**Gate:** Every item needs John's go first. Do not rotate the OpenRouter key until he says so.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Remove the server Gemini fallback, move per-user metering into the database, and key rate limits on the real client IP header.

## Background
gm-turn/index.ts ~119-130 still has a server Gemini path (`GEMINI_API_KEY`). The in-memory 60-per-minute cap is not enough. The old-log abuse check, key rotation and the broken OPENROUTER_API_KEY_SYNAPTICGM box variable are Synapticgm or John steps, not Cursor.

**Previous attempts:** none found in HISTORY.md.

## Files you may read
- supabase/functions/gm-turn/index.ts
- supabase/config.toml
- supabase/migrations/025_gm_turn_captures.sql

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- supabase/functions/gm-turn/index.ts
- new: supabase/migrations/0NN_turn_meter.sql (next free number)

Nothing else, and no new files except those listed.

## Acceptance criteria
- No Gemini code path on the server.
- Per-user meter in the database.
- Rate limit keyed on the real client IP header.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: after John's yes and the deploy, 10 turns: play still works.

## Forbidden
- Touching or printing secrets.
- Rotating keys.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/37-phase0-leftovers` from the latest `main`.
- PR title: `[37] Phase 0 leftovers: server Gemini fallback, database metering, IP headers`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
