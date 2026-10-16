# q32-merge37b

Merged commit `33668256` (branch `n4fix`, TT37-N4) into `main` with `git merge --no-ff 33668256`. Main was already checked out. No checkout, rebase, reset, stash, or force. The merge commit is `995ba204`.

This is a play change. The time check now treats a recorded rest span as the clock. Stamp `2026-10-16z14` (was `2026-10-16z13`). `tokenProse.ts` is not an edge sync file, and the edge stub has no time check, so `gm-turn` was not deployed.

Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files.

## Cause

`src/game/tokenProse.ts:338` `lineHasWrongTimeOfDay`. The record can say `camped from night until morning, now morning`. The check only allowed `now <slot>` (or the save clock). "Slept through the night" was a true line for that span, the gate refused it, and the repair wrote a shorter time ("a few hours"). The repair is already rechecked by the same gates.

## Conflicts

None. `git merge --no-ff` used the ort strategy. The only file in `33668256` is `src/game/tokenProse.ts`, and that file had no local edits.

## Fix

The allowed slots are still the engine-result clock. A recorded `from <slot> until|till|to <slot>` on those same lines covers every slot the span passes, wrapping past night. The slot names are the ones already on `DAY_PART_WORDS` (dusk and evening stay one word group). No second clock list.

`33668256` had added `CLOCK_ORDER`, `clockSpan`, and a second engine-result regex. Those were not kept. Logged in `docs/orders/tt-cut-log.md`. The existing TT37 notes in that file stay.

## Tests

`src/game/ttFix37.test.ts` N4 (the branch test, without the later S1 case): slept through the night and dawn are allowed on `from night until morning`; afternoon is not.

## ruleCount TOTAL

Clean parent `65ffb552` (worktree `.tmp-wt-q32-base`, removed after): files 493, lines 163544, regex 6920, newRegExp 380, lists 1187 (6246), fns 11816.

After the fold, `src/game/tokenProse.ts` is lines 1438 (was 1441), regex 164, newRegExp 40, lists 3 (18), fns 198 (was 201).

TOTAL: files 493, lines 163541, regex 6920, newRegExp 380, lists 1187 (6246), fns 11813.

TOTAL did not rise. OLD14 lines 8556 → 8553, fns 1027 → 1024. The 27 collapsed blank lines in `tokenProse.ts` were padding.

## Gates

Run on the shared tree. Replay bank and vitest see the fate-autoplay tapes and the existing uncommitted edits.

| Gate | Result |
|---|---|
| vitest (shared tree) | 108 failing / 2902 passed / 1 pending. q32-merge37a was 106 failing / 2903 passed / 1 pending. No failure names the time check. `playtest28c` and `playtest30b` fallback length (prose 38 and 27) also fail on clean parent `65ffb552`. `seed94InfestationClear` is the known flake; this run's seed-94 failure is the opening-card sentence check. |
| replay bank | 62 failing / 565 passed / 28 pending (limit 64). Same failing count as q32-merge37a. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). |
| build | green |

## Replay staging (R1–R16)

None of R1–R16 is this time-span check. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

A duration claim ("a few hours") checked against the record's hours needs a duration fact in the record. Not built. TT37-N3b and TT37-S1 are later commits on `n4fix`, not `33668256`.

## Ship

Stamp `2026-10-16z14`. No edge file changed, so `gm-turn` was not deployed.
