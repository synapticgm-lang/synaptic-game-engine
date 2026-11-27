# 28 — One writer output contract and one validator

**Phase:** Phase 8, part A  
**Depends on:** 05, 13, 25  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
One output contract (rendered for JSON-schema, tool-call and plain models) and one validator. No XML tags inside a JSON call.

## Background
Audit G7 (gm-turn/index.ts ~104-106, XML map tags inside JSON), 31c (openingWriterNotes.ts ~648 strips [SYSTEM] and [THE AUDITOR] leaks).

**Previous attempts:** see HISTORY.md H5, H6, H10. Leak-stripping and wardens were added and retired more than once (H10). The contract removes tags at the source. No new strip step. Your PR must say how this approach differs from those attempts.

## Files you may read
- supabase/functions/gm-turn/index.ts
- src/game/systemPrompt.ts
- src/game/writerTurn.ts
- src/game/openingWriterNotes.ts
- src/game/openRouterChat.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new: src/game/writerContract.ts
- src/game/systemPrompt.ts
- src/game/writerTurn.ts
- src/game/openingWriterNotes.ts
- supabase/functions/gm-turn/index.ts
- contract tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- One contract, one validator; tags cannot leak because the contract has none.
- The leak-strip code is removed.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 turns per mode on the default free model: no leaks, prose holds.

## Forbidden
- Tuning the prompt to one model.
- A tag or phrase filter.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/28-p8-one-output-contract` from the latest `main`.
- PR title: `[28] One writer output contract and one validator`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
