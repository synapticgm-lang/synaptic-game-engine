# q31-mergeop1

Merged `op-1` (`706b29b6`, parent `d928f33d`) into `main` with `git merge --no-ff op-1`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change (a road meeting or traveler opens from a seeded idea). Stamp `2026-10-16z6` (was `2026-10-16z5`). `types.ts` is an edge copy, so `gm-turn` is deployed.

## Cause

Meetings and travelers had a look and a want, and no opener idea (`src/game/travelJourney.ts` `nameMeeting`, before this merge). `backedAnswerFacts` (`src/game/writerTurn.ts`) did not treat that meeting as backed, so m48 fl150 T10 failed tt-fix-4. Branch report: `docs/orders/q31-OP1.md`.

## Conflicts

None. Git auto-merged `src/game/travelJourney.ts`, `src/game/types.ts`, and `src/game/writerTurn.ts` onto main's current functions. The other four files came in clean. They do not overlap the uncommitted tree.

## Fix

`pickOpenerIdea` (`src/game/openerIdeas.ts:21`) picks one row from `src/data/openerIdeas.json` by the meeting key. `nameMeeting` (`src/game/travelJourney.ts:856`) stores that id on `RoadEncounter.openerIdea` (`src/game/types.ts:1225`). `roadMeetingFact` (`travelJourney.ts:978`) hands the gist to the writer with the never-copy rule. `roadMeetingOpenerLines` (`travelJourney.ts:936`) is the backed line, and `backedAnswerFacts` (`writerTurn.ts:357`) reads it. The idea text is not a quote.

The 6-word copy check stays (`copiesOpenerIdea`, `openerIdeas.ts:54`). Its two regexes were replaced by `ideaWords` (`openerIdeas.ts:39`), a character walk, and logged in `docs/orders/tt-cut-log.md`. Branch `op-1` had no cut-log entries of its own; the existing log stays.

## Tests

`src/game/openerIdeas.test.ts` (7) and replay `m48lap48` (4) passed.

## ruleCount TOTAL

Clean HEAD before the merge (worktree `.tmp-wt-mergeop1`, removed after): files 486, lines 162684, regex 6901, newRegExp 378, lists 1187 (6246), fns 11728.

This commit (worktree `.tmp-wt-mergeop1c`, removed after): files 487, lines 162785, regex 6901, newRegExp 378, lists 1187 (6246), fns 11738.

regex, newRegExp, and lists match. Files, lines, and functions rise with `openerIdeas.ts` and `roadMeetingOpenerLines` (ten functions: the idea helpers, the `find` callback, and the backed-line reader).

## Gates

| Gate | Result |
|---|---|
| vitest | 108 failing / 2854 passed. Chipcheck's saved run was 107 failing. The one extra name is `opening player bubbles seals kit cover instead of blocking with a questionnaire` (`openingEstablishment.test.ts:221`), marked there as a full-run flake since 14 Oct. Run alone it passed. No opener test failed. `seed94InfestationClear` did not fire. |
| replay bank | 62 failing / 565 passed / 28 other (655, limit 64). Under chipcheck's 63. m48 fl150 T10 passed. |
| tsc | 552 (limit 552). |
| build | green. |

## Replay staging (R1–R16)

R1 is a thugs brief and a group motive line, not a meeting/traveler opener idea. It stays out of this merge. m48, the OP-1 tape, is already in the bank and this merge updates that case. R2–R4, R7, and R8–R16 are other orders. R5 and R6 stay blocked (no camp tape; shop price tape still missing in `replay-case-staging.md`).

## NEXT

- Fate's headless path uses the same `roadMeetingFact` / `backedAnswerFacts` as live play.
- The opening kit-cover flake is still unmarked as an allowed flake. It is not an OP-1 failure.

## Ship

Stamp `2026-10-16z6`. Edge `types.ts` synced. `gm-turn` was deployed from the commit (`4d1086f0`), so the uncommitted `pyoaSpine.ts` edit was not left on the function.

TT_DONE
