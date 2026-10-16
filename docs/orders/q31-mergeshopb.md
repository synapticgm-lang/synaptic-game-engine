# q31-mergeshopb

Merged `shop-b` (`644bf674`) into `main` with `git merge --no-ff shop-b`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged.

This is a play change (the Merchant Buy tab). Stamp `2026-10-16z4` (was `2026-10-16z3`). No edge file changed, so gm-turn was not deployed.

## Cause

`shop-b` was stacked on our shop-a (`4985d901`). Main already has Cursor's shop-a (`ed9221c7`, `docs/orders/q31-shopa.md`): `shopPriceCp` / `srdSaleCp` / `changeFor` in `src/game/rules/coins.ts` and `buyItem` / `sellItem` in `src/game/merchant.ts`. The branch brought a second copy of that engine plus the Buy tab.

## Conflicts

1. `src/game/rules/coins.ts` — kept main. Dropped shop-b's `priceKey` regex and `PRICE_BY_KEY` map. `shopPriceCp` (`coins.ts:195`), `srdSaleCp` (`coins.ts:207`) and `changeFor` stay the lookup, the half-price sale, and the change.
2. `src/game/merchant.ts` — kept main's `buyItem` (`merchant.ts:141`) and `sellItem` (`merchant.ts:176`), including `priceKeyId` with no regex. Kept shop-b's presence gate and pointed it at those functions: `merchantHere` (`merchant.ts:79`) uses `presentNpcRecords` plus role `merchant`; `merchantStock` (`merchant.ts:92`) prices each row with `shopPriceCp`; `canAfford` (`merchant.ts:107`) uses the same `payCoins` / gold check as `buyItem`; `canOpenMerchant` (`merchant.ts:113`) opens tabletop only when that merchant is here. Town stock is tools, adventuring gear, and food. Dropped the apostrophe regex and the three-name array so the rule count did not gain a list.
3. `docs/orders/tt-cut-log.md` — kept main's q31-shopa and q31-M3 lines and shop-b's two cut-log lines (the tabletop merchant block, and the manual shop-a price deletion). Added a q31-mergeshopb line for the duplicate engine that this merge dropped.

`srdShopGear.json` and `shopA.test.ts` were already the same on both sides, so they did not conflict.

## Fix

`src/App.tsx` opens the merchant through `canOpenMerchant`. `src/components/MerchantWindow.tsx` Buy tab calls `buyItem`. Tests: `src/game/shopB.test.ts` (7) and `src/game/shopA.test.ts` (21).

## ruleCount TOTAL

Clean HEAD worktree `.tmp-wt-mergeshopb` (removed after): files 484, lines 162454, regex 6901, newRegExp 378, lists 1187 (6246), fns 11701.

Working tree after the merge (includes other people's uncommitted files, which this commit does not take): files 484, lines 162528, regex 6901, newRegExp 378, lists 1187 (6246), fns 11704.

regex, newRegExp, and lists did not rise. This order adds five functions in `merchant.ts` (presence, stock, afford, open, and the record callback).

## Gates

| Gate | Result |
|---|---|
| vitest | 107 failing / 2838 passed. Under q31-shopa's 109. No shop test failed. `seed94InfestationClear` did not fire. |
| replay bank | 63 failing / 655 (limit 64). Same count as q31-shopa. |
| tsc | 552 (limit 552). None in the shop files. |
| build | green (this commit). |

## Replay staging (R1–R16)

R6 is the shop. **Blocked:** `docs/orders/replay-case-staging.md` has no tape that checks gold prices. m22, m23, m30, and m41 only mention merchants. The price, half-sale, and change asserts stay in `shopA.test.ts`. A gem sold at full value is still not in the price file.

## NEXT

- Buy / Sell chips in the choice pipeline when a merchant is present and the purse can pay (tt-build-chipcheck, not this merge).
- Stock by place: a stable sells mounts and tack; a port sells ships. Spellcasting services stay off unless a temple is present.
- Gems, art, and trade goods sell at full list value (SRD p.89). They need a price source.
- One shop transaction also showing on the `commitTurnRecord` STATUS grant line (the receipt is the system log today).

## Ship

Stamp `2026-10-16z4`. No edge sync. No gm-turn deploy.

TT_DONE
