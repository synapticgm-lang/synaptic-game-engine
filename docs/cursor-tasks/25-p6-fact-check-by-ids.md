# 25 — Fact checker compares what the writer bound with what the engine committed

**Phase:** Phase 6, part A  
**Depends on:** 13  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
factGate checks refs, inventory changes and movement by id. On a failure it repairs or drops that one line. It stops judging sentences with English word sets.

## Background
factGate.ts judges sentences with English word sets and deletes on doubt ('She opened the shutters slowly' is cut). Audit 14 (`PLACED_VERBS`, roomProps.ts), 16 (`sells|offers` regex, factGate.ts ~531), 22 (factGate.ts ~43-73, 471-490, 649-657). Absorbs 'Knife pop-in'. Writer-rejection rule (11 Oct): a rejected draft never reaches the page; one targeted repair request names only the flagged error; no plain fallback lines; every rejection is logged to the writer dataset. John's batched AI check (9 Nov) is used only where ids cannot decide. Open question: factGate.ts ~76 and ~89 read process.env in the browser; report what you find.

**Previous attempts:** see HISTORY.md H9, H10. The fact gate was consolidated three times (29z9e 1 Oct, M4 27 Oct, #8/#10/#22 9–10 Nov). Each time, English word sets came back. Ids decide, or the line is kept: no new word set, and no deleting on doubt. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/factGate.ts
- src/game/roomProps.ts
- src/game/writerTurn.ts
- src/game/resolveTurn.ts (fact-check stage)
- src/game/factGate.test.ts
- src/game/factGateTurn.test.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/factGate.ts
- src/game/roomProps.ts
- src/game/writerTurn.ts (targeted repair only)
- the factGate test files (delete word-list assertions; add id tests)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- No English word set decides keep or cut.
- Invented people and items are caught by id; good lines are kept.
- One targeted repair per flagged line; rejections logged.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 turns per mode with removed sentences shown beside the prose (staff debug view). A person reads both.

## Forbidden
- Adding a word, verb or name to any list.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/25-p6-fact-check-by-ids` from the latest `main`.
- PR title: `[25] Fact checker compares what the writer bound with what the engine committed`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
