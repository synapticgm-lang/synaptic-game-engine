# q31-mergechipcheck

Merged `chipcheck` (`111d057e`) into `main` with `git merge --no-ff chipcheck`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. `shop-b` (`644bf674`) is already an ancestor of main (`q31-mergeshopb`), so this merge adds only the chipcheck commit.

This is a play change (chip kinds and Buy/Sell chips). Stamp `2026-10-16z5` (was `2026-10-16z4`). No edge file changed, so gm-turn was not deployed.

## Cause

Chips on main were labels only (`EngineChip` in `src/game/choicePipeline.ts`, before this merge). `chipcheck` sets `ChipKind` on each builder chip (`choicePipeline.ts:378`) and names the resolver in `CHIP_RESOLVERS` (`src/game/chipCheck.ts:12`). `checkChipKinds` (`chipCheck.ts:51`) flags `dead-chip` and `missing-chip-kind` on the turn check (`turnCheck.ts` down list). Shop chips (`src/game/shopChips.ts:22`) call main's shop-a functions: `buyItem` (`merchant.ts:141`) and `sellItem` (`merchant.ts:176`), with prices from `shopPriceCp` / `srdSaleCp`.

## Conflicts

None. Git auto-merged `src/game/useGame.ts` (the shop turn sits after `applyTabletopQuestTurn`). The other six files came in clean. They do not overlap the uncommitted tree, so the merge was not aborted.

## Fix

`shopChips.ts` already imported main's `merchantHere`, `merchantStock`, `canAfford`, `buyPriceLabel`, `sellPriceLabel`, `buyItem`, and `sellItem`. No second price table.

After the merge, three matchers from the branch were removed so regex and string-lists stay at the q31-mergeshopb count (logged in `docs/orders/tt-cut-log.md`):

- Shop-chip pick matches the chip's own label by trim and case (`shopChips.ts` `pickedShopChip`).
- The person check takes the first word at the first space (`chipCheck.ts`).
- Exit / journey / hub is one `offersKind` call with rest arguments, not a three-string array.

Each shop edge id includes the item (`choiceEdge.ts`), so two Buy rows are not the same id. The branch cut log was unchanged (nothing deleted on `111d057e`); those existing entries stay.

## Tests

`src/game/chipCheck.test.ts` + `shopA.test.ts` + `shopB.test.ts`: 37 passed after the matcher cut.

## ruleCount TOTAL

Clean merge commit (worktree `.tmp-wt-mergechipcheck`, removed after): files 486, lines 162681, regex 6904, newRegExp 378, lists 1188 (6249), fns 11729.

q31-mergeshopb clean HEAD: files 484, lines 162454, regex 6901, newRegExp 378, lists 1187 (6246), fns 11701.

After the matcher cut (same commit tree, three regex literals and one 3-string list removed): regex 6901, newRegExp 378, lists 1187 (6246). regex, newRegExp, and lists match the previous ship. Files, lines, and functions rise with `chipCheck.ts` and `shopChips.ts` (the chip-kind mechanism).

## Gates

| Gate | Result |
|---|---|
| vitest | 107 failing / 2847 passed (1 other). Same count as q31-mergeshopb. No chip or shop test failed. `seed94InfestationClear` did not fire. |
| replay bank | 63 failing / 655 (limit 64). Same count as q31-mergeshopb. |
| tsc | 552 (limit 552), before and after the matcher cut. None in the chip files. |
| build | green on the merge commit. |

## Replay staging (R1–R16)

R6 is the gold shop. **Blocked:** `docs/orders/replay-case-staging.md` still has no tape (the row says the feature was not built and gives no run id). Price, half-sale, and Buy/Sell chip asserts stay in `shopA.test.ts` and `chipCheck.test.ts`.

## NEXT

- Word-based chip checks (`ghost-chip` / `unrelated-chip` in `chipLegality.ts`) are still in place. `q31-chipcheck.md` left them because replay-bank tests assert them. Promoting `dead-chip` / `missing-chip-kind` to P0 needs that bank pass.
- Fate's headless turn does not call `resolveShopChip`. Live play does (`useGame.ts`).
- Stock by place, and gems selling at full list value, stay as in q31-mergeshopb.

## Ship

Stamp `2026-10-16z5`. No edge sync. No gm-turn deploy.

TT_DONE
