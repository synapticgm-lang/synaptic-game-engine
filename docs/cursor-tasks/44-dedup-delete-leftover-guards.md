# 44 — Delete leftover prose guards and dead validators

**Phase:** De-dup (after Phase 8 part A)  
**Depends on:** 25, 28  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
After brief 28's one validator and brief 25's id-based fact check, no other post-prose guard, warden, scrub or validator is left on the turn path, and dead validator files are deleted.

## Background
DUPLICATION.md D11. HISTORY H10 records proseWarden as retired on 27 Oct, but `src/game/proseWarden.ts` (1,470 lines) is still on main. `useGame.ts`, `fateAutoplay.ts` and `readabilityGate.ts` still import `scrubFalseArrivalWhenHere` and `scrubEntityMadLibs` from it. Also still live: `warden.ts:runWarden`, `errorRepairWarden.ts`, `perspectiveWarden.ts`, `readabilityGate.ts`, `engineFactGate.ts` with `engineFactPatterns.ts`, `beatCommitGate.ts`, `contentPostFilter.ts`, `fluidProseRails.ts`, `choiceWarden.ts`, `suggestionValidation.ts`, `actionValidation.ts`, `typedEntityValidator.ts` and `apiValidation.ts`. Dead, with 0 importers outside tests: `povRails.ts` and `densityValidation.ts`.

**Previous attempts:** see HISTORY.md H5, H6, H10. Wardens were retired and re-added (T10WARDEN2 four days later). Don't add any guard back. If a deleted guard was hiding a real bug, name the bug and the brief that should fix it at the source; don't keep the guard. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/writerContract.ts or the validator from brief 28
- src/game/proseWarden.ts (exports only)
- src/game/warden.ts
- src/game/readabilityGate.ts
- src/game/errorRepairWarden.ts
- src/game/perspectiveWarden.ts
- src/game/engineFactGate.ts
- src/game/beatCommitGate.ts (search by export)
- src/game/resolveTurn.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- the files above (delete; keep only what brief 28's validator or brief 25's id check calls, moved into those files)
- src/game/povRails.ts, src/game/densityValidation.ts (delete)
- src/game/resolveTurn.ts (remove the calls)
- the tests that pin the deleted guards (delete)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Acceptance criteria
- `rg -l "proseWarden|runWarden|errorRepairWarden" src` finds nothing outside the PR's own deletion notes.
- One validator remains on the writer path.
- The PR lists each deleted file and what, if anything, replaced it.
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a 20-turn game in two modes. A person reads every turn for broken sentences, wrong arrivals and repeats. Report anything that looks like a deleted guard was hiding a bug, and don't patch it here.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/44-dedup-delete-leftover-guards` from the latest `main`.
- PR title: `[44] Delete leftover prose guards and dead validators`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
