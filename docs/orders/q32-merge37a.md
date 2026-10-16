# q32-merge37a

Merged commit `e4084317` (branch `n4fix`, TT37-1) into `main` with `git merge --no-ff e4084317`. Main was already checked out. No checkout, rebase, reset, stash, or force. The merge commit is `ab02fe08`.

This is a harness change. The fact checker now treats this leg's road stops as the road. Stamp `2026-10-16z13` (was `2026-10-16z12`). No edge file changed against main, so `gm-turn` was not deployed.

Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files.

`docs/orders/tt-cut-log.md` already had the uncommitted TT37 block (no code deleted; N3b pool note; SRD Languages credit). This merge deleted nothing and did not stage that file, so those lines stay in the working tree.

## Cause

`src/game/travelJourney.ts:1678` writes the engine fact `The way passes ${stop.name}.` for a stop on the road being walked. `compileNounAllowlist` already allows those stops. `scripts/factCheck.mjs` `checkTurn` treated a place named in "the path ran past X" as a way out (`exit-place`) because the stop is not an exit. Lap 37 A T12 and D T14 flagged the Hollow Spring. F T8 flagged the Burned Farm.

## Conflicts

None. `git merge --no-ff` used the ort strategy. The only file in `e4084317` is `scripts/factCheck.mjs`, and that file had no local edits.

## Fix

`factsFor` (`scripts/factCheck.mjs:197`) collects this leg's stops from the engine's own "The way passes X." fact. The exit-place check (`scripts/factCheck.mjs:346`) skips a stop on the road being walked. Same mechanism for every stop the travel fact names. No place-name list.

## Tests

Fact check `--turn` on the lap 37 tapes, parent checker vs this merge:

| Run | Turn | Parent | Merge |
|---|---|---|---|
| A `s18006` | T12 Hollow Spring | 1 exit-place | 0 |
| D `s18174` | T14 Hollow Spring | 1 exit-place | 0 |
| F `s18219` | T8 Burned Farm | 1 exit-place | 0 |

## ruleCount TOTAL

Clean parent `1ee9a89f` (worktree `.tmp-wt-q32-base`, removed after): files 493, lines 163544, regex 6920, newRegExp 380, lists 1187 (6246), fns 11816.

Clean merge (worktree `.tmp-wt-q32-merge37a`): files 493, lines 163544, regex 6920, newRegExp 380, lists 1187 (6246), fns 11816.

TOTAL is unchanged. `scripts/factCheck.mjs` is in OLD14 only. OLD14 lines 8551 → 8556, regex 844 → 846, fns 1025 → 1027 (the stop match and the two callbacks). No deletion.

## Gates

Run on the merge. Replay bank and the shared-tree vitest see the fate-autoplay tapes and the existing uncommitted edits. The clean worktree vitest (113 failed / 2845 passed) does not include those edits; the shared-tree run is the comparison to q31-mergesttn.

| Gate | Result |
|---|---|
| vitest (shared tree) | 106 failing / 2903 passed / 1 pending. q31-mergesttn was 107 failing / 2902 passed / 1 pending. No new failures. |
| replay bank | 62 failing / 565 passed / 28 skipped (limit 64). Same failing count as q31-mergesttn. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). |
| build | green |

## Replay staging (R1–R16)

None of R1–R16 is this fact-check. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

None for this merge. TT37-N4, TT37-N3b, and TT37-S1 are later commits on `n4fix`, not `e4084317`.

## Ship

Stamp `2026-10-16z13` is on `main` (`6a72af3f`). No edge file changed, so `gm-turn` was not deployed.

The git push started a production build. Live `https://www.synapticgm.com/version.json` is `2026-10-16z13`.

TT_DONE
