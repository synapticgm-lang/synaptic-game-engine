# q31-mergeqv

Merged `qv` (`13b3f3b2`, stacked on `k-1`) into `main` with `git merge --no-ff qv`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change (the quest journal shows the current step and promises). Stamp `2026-10-16z9` (was `2026-10-16z8`). No edge file changed against main, so `gm-turn` was not deployed.

Branch reports: `docs/orders/q31-QVa.md`, `docs/orders/q31-QVb.md`. The branch's `tt-cut-log` K1 entry is kept. Main already has Cursor's K1/K2 (`2f24bf54`, `22fb3bd3`), so k-1's `commitments.ts` and its types were not taken.

## Cause

The journal (`src/components/QuestLogModal.tsx`, before this merge) listed quest name and status only. It did not read the open step's target or Order K's commitment record (`GameState.commitments`, `src/game/types.ts:589` and `:964`, written by `recordTurnCommitments` in `src/game/stateTx.ts:472`).

## Conflicts

1. **`docs/orders/tt-cut-log.md`.** Kept main's q31-RCN4 and P-5a/c/d/e sections. Appended the branch's K1 entry. Did not restore the branch's planned RC-N4 line: that cut already shipped on main.
2. **`src/game/commitments.test.ts` (add/add).** Kept main's K1/K2 tests.
3. **`src/game/npcRelationships.ts`.** Kept main.
4. **`src/game/sceneLedger.test.ts`.** Kept main.
5. **`src/game/sceneLedger.ts`.** Kept main. k-1's second ledger-promise path was not reintroduced.
6. **`src/game/stateTx.ts`.** Kept main's `recordTurnCommitments` (quest reveal and world deals, settled on the turn record).
7. **`src/game/systemNotice.ts`.** Kept main's promise/deal/agreement notice rules.
8. **`src/game/types.ts`.** Kept main's `Commitment` and `GameState.commitments`. Dropped k-1's type edits.
9. **`supabase/functions/_shared/gm/npcRelationships.ts`.** Kept main.
10. **`supabase/functions/_shared/gm/types.ts`.** Kept main.

`src/game/commitments.ts` and `src/game/commitmentsCheck.test.ts` came in only from k-1. They were removed from the merge. `src/App.tsx` and `src/components/QuestLogModal.tsx` auto-merged. `questView.ts` / `questView.test.ts` came in as new files and were pointed at main's `Commitment` (`promiseId`, `kind`, `to`, `description`, `dueTurn`, `status`, `madeTurn`).

## Fix

`questTargetViews` (`src/game/questView.ts:15`) lists each active quest's open step, its target and place, and "here" from `targetSpot` / `atPlace`. `promiseViews` (`src/game/questView.ts:48`) lists `state.commitments`, open first. The journal shows a Current step card (`QuestLogModal.tsx` around the `quest-target` block) and a Promises tab (`QuestLogModal.tsx:128`) only when there are commitments. Layout stays one column under the `sm` breakpoint (640px). No second commitment store and no new word list.

## Tests

`src/game/questView.test.ts` (5) passed, including a quest taken from a giver becoming an open promise and then kept when the quest completes, through main's `commitTurnRecord`.

## ruleCount TOTAL

Clean HEAD (worktree `.tmp-wt-mergeqv`, removed after): files 489, lines 163108, regex 6920, newRegExp 380, lists 1187 (6246), fns 11775.

This merge: files 490, lines 163184, regex 6920, newRegExp 380, lists 1187 (6246), fns 11777.

regex, newRegExp, and lists match. Files, lines, and functions rise by the read-only view (`questView.ts`, two functions, no inner arrows). No deletion from main. k-1's `commitments.ts` was not added.

## Gates

| Gate | Result |
|---|---|
| vitest | 109 failing / 2871 passed / 1 other. mergep5ac's saved run was 110 failing. No quest-view test failed. `seed94InfestationClear` did not fire. |
| replay bank | 62 failing / 565 passed / 28 skipped (limit 64). Same failing count as mergep5. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). No new errors in `questView.ts` or `QuestLogModal.tsx`. |
| build | green. |

## Replay staging (R1–R16)

None of R1–R16 is the quest journal. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases, not the journal's Current step or Promises tab.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

None for this merge. The Promises tab is empty until a quest reveal or a world deal writes a commitment through `recordTurnCommitments`.

## Ship

Stamp `2026-10-16z9` is on `main`. No edge file changed, so `gm-turn` was not deployed.

TT_DONE
