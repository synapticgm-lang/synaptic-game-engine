# 19 — Repeated options stay on screen, ranked lower; remove the 5-turn cooldown and streak caps

**Phase:** Phase 4, part B (John's 27 Nov decision)  
**Depends on:** 13  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
A repeated option is never removed by a counter. It may rank lower. Remove the 5-turn repeat cooldown and the streak caps.

## Background
John decided on 27 Nov: repeated options stay on screen and are only ranked lower, with no 5-turn cooldown timer. Code: `isOnCooldown` in src/game/optionDiversityContract.ts and `REPEAT_COOLDOWN_TURNS` in src/game/sceneAffordances.ts (~225), used in fourSlotPads.ts ~810-816 (`state.qualityGovernance.optionCooldowns`); streak caps of 2 in fourSlotPads.ts ~54-58 (P4); `inspectStreak`, `waitStreak`, `engineRecoveryStreak` in types.ts ~1996-2015 (36b). Absorbs the camp off-pad loop (with 13). The hunt death cooldown (`wildsHuntDeathCooldownUntilTurn`, choiceRanking.ts ~960-1145) also withholds options by counter: rank Hunt and Seek lower when hurt instead, and say so in the PR.

## Files you may read
- src/game/optionDiversityContract.ts
- src/game/sceneAffordances.ts
- src/game/fourSlotPads.ts
- src/game/finalOptions.ts
- src/game/choiceRanking.ts
- src/game/types.ts (streak and cooldown fields only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/optionDiversityContract.ts
- src/game/sceneAffordances.ts (cooldown constant only)
- src/game/fourSlotPads.ts
- src/game/finalOptions.ts (ranking only)
- src/game/choiceRanking.ts
- src/game/types.ts (remove streak and cooldown fields; old saves must still load)
- streak and cooldown tests (delete, or rewrite as ranking tests)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- No legal option is removed because of how recently or often it was chosen.
- Repeats rank lower through the one ranking in finalOptions.ts.
- REPEAT_COOLDOWN_TURNS, optionCooldowns and the streak fields are gone; old saves still load.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 30 turns in one LitRPG and one tabletop game, repeatedly picking look, wait or camp: the options stay, just lower, and the prose does not loop.

## Forbidden
- A new cooldown, streak cap or turn threshold under another name.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/19-p4-repeats-ranked-lower-no-cooldown` from the latest `main`.
- PR title: `[19] Repeated options stay on screen, ranked lower; remove the 5-turn cooldown and streak caps`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
