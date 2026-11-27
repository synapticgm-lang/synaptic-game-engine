# 17 — Client sends gm-turn a small typed writer request, not the whole save

**Phase:** R9, part C  
**Depends on:** 16  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
The client sends the edge only the typed writer request; the edge stops rebuilding the packet from the whole save.

## Background
Audit G9 (gm-turn/index.ts ~398-401 rebuilds the packet on the edge; about 130 twin files in supabase/functions/_shared/gm/). Fewer twins means fewer drift bugs and lower cost.

**Previous attempts:** see HISTORY.md H11. Your PR must say how this approach differs from those attempts.

## Files you may read
- supabase/functions/gm-turn/index.ts
- src/game/resolveTurn.ts
- scripts/sync-gm-edge-shared.mjs
- src/game/openRouterChat.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- supabase/functions/gm-turn/index.ts
- src/game/resolveTurn.ts (writer-request stage)
- supabase/functions/_shared/gm/ (only via `npm run sync:gm-edge`; the script removes orphans)

Nothing else, and no new files except those listed.

## Acceptance criteria
- The request body is a typed writer request; no full save on the wire.
- `npm run check:gm-edge` passes and the twin count drops.
- No change to the origin allowlist, the server-chosen endpoint, or the meter (Phase 0 stays locked down).

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: after John's yes and the gm-turn deploy, 10 turns per mode.

## Forbidden
- Any client-controlled setting the server acts on.
- Touching secrets or env vars.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/17-r9-small-writer-request` from the latest `main`.
- PR title: `[17] Client sends gm-turn a small typed writer request, not the whole save`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
