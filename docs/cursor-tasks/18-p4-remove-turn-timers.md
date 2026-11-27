# 18 — Delete count-based forced events

**Phase:** Phase 4, part A  
**Depends on:** 13  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
No event is forced by a turn counter: no fights every N turns, no class after 3 turns, no hub exit by turn 50, no nudge after 3 turns, no 'will not wait' lines.

## Background
Audit P1 (arcDirector.ts ~406-427, fights every 8/12/15/20 turns, `shouldSpawnCombat`), P2 (rules/characterClass.ts ~36-57, class after 3 turns and a turn-20 unlock), P3 (choiceCompiler.ts ~418, 549-566, hub exit by turn 50), P5 (choiceRanking.ts ~487 `nudgeIfStuck`), P9 (director.ts ~596, 762 'will not wait'). Absorbs 'Rest/camp arriving early'.

**Previous attempts:** see HISTORY.md H14. No earlier removal attempt was found. A '4 turns remaining' timer leaked into the prose on 7 Oct. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/arcDirector.ts
- src/game/rules/characterClass.ts
- src/game/choiceCompiler.ts
- src/game/choiceRanking.ts
- src/game/director.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/arcDirector.ts
- src/game/rules/characterClass.ts
- src/game/choiceCompiler.ts
- src/game/choiceRanking.ts
- src/game/director.ts
- the cadence, nudge, hub-deadline and class-patience tests (delete those assertions)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- None of the named forces remain.
- Fights, class choice and leaving the hub happen because of the story or the player's choice.
- No new threshold.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: a 40-turn LitRPG game plus 15 turns of loitering in town: nothing forced, no empty threats.

## Forbidden
- Replacing a timer with another timer, backstop or 'safety' counter.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/18-p4-remove-turn-timers` from the latest `main`.
- PR title: `[18] Delete count-based forced events`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
