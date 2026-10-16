# q31-shopa

In-game shop engine only (gold). Real-money shop, payments, and ads were not touched. Chips at a merchant stay shop-b.

## Cause

`src/game/rules/coins.ts` `ITEM_COST_CP` (was the hand list at the old `srdSaleCp`) held 23 adventuring prices typed beside the weapons table, and `srdSaleCp` used `Math.max(1, floor(cost / 2))`, so a 1 CP item could not sell for 0. `src/game/merchant.ts` `sellItem` (the salvage / SRD sale at the old line 51) had no buy at list price and no engine receipt.

## Fix

- `src/data/srd/srdShopGear.json`: the 183 SRD 5.2.1 rows from `docs/design/shop-price-data.json`. Weapons and armour still come from `srdGearCostCp()` and overwrite any same name.
- `shopPriceCp` (`src/game/rules/coins.ts:195`) is the one lookup. Curly and straight apostrophes match. `srdSaleCp` (`coins.ts:207`) pays `floor(cost / 2)` copper. `changeFor` already turns that into the largest smaller coins (5 GP -> 2 GP 5 SP; 1 SP -> 5 CP; 1 CP -> 0).
- `buyItem` (`src/game/merchant.ts:97`) deducts the list price from the purse (change via `payCoins`) or whole gold in other modes, adds the item, and writes one system-log receipt. `sellItem` (`merchant.ts:132`) does the same on the way out. Unlisted goods and a short purse change nothing.
- Credits `usedFor` on the existing SRD 5.2.1 row now says shop prices. The CC BY 4.0 notice was already the required line.

## Tests

`src/game/shopA.test.ts` (21): Rope 1 GP, Rations 5 SP, Longsword 15 GP from srdGear, half-price sale including 1 CP -> 0, buy deducts and adds, cannot buy without coin.

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists (entries) | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162385 | 6901 | 378 | 1187 (6246) | 11690 |
| after | 484 | 162484 | 6901 | 378 | 1187 (6246) | 11699 |

regex, newRegExp, and lists did not rise. fns rose by the shop lookup, buy, and receipt functions. No new regex and no exception list.

## Gates

| Gate | Result |
|---|---|
| vitest | 109 failing / 2939 (2829 passed). Against q31-K2's 108: `seed94InfestationClear` did not fire; fog-of-war "locations mentioned in narrative" did (it is inside q31-K1's 108). The 29u "Walk on" chip failed once in the full run and passed on its own. No shop test failed. |
| replay bank | 63 failing / 655 (limit 64). The tt6b coin sale case passed. The tt6b failure is session-zero progression, already in the 63. |
| tsc | 552 (limit 552). None in the shop files. |
| build | green. |

## Replay staging (R1–R16)

R6 is this order. **Blocked:** the staging row has no tape. The price, half-sale, and change asserts are in `shopA.test.ts`. A gem sold at full value is not in those tests: `shop-price-data.json` has no gem or art rows.

## NEXT

- shop-b: Buy / Sell chips only when a merchant is present and the purse can pay (`choicePipeline` engine chips).
- Stock by place: a hub sells tools, gear, and food; a stable sells mounts and tack; a port sells ships. Spellcasting services stay off unless a temple is present.
- Gems, art, and trade goods sell at full list value (SRD p.89). They need a price source; this file does not have one.
- One shop transaction also showing on the `commitTurnRecord` STATUS grant line (the receipt is the system log today).

## Ship

Stamp `2026-10-16z3` (was `2026-10-16z2`). No edge file changed, so gm-turn was not deployed.

TT_DONE
