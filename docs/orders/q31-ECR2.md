# q31-ECR2: attunement (Order E-CR / Spec E-CR2)

Stamp `2026-10-16o` (from `2026-10-16n`). Play change: tabletop attunement resolves by **intent + carried magic item** (SRD 5.2.1), reuses the Short Rest hour path, refuses a 4th / cursed end / same-rest identify, interrupts on pending encounter, and ends away slots after 24 h of world clock. Client `rules/magicItems` + `tabletop/downtimeTurn` + `recoveryRules.takeShortRestHour` + `inventory.removeItem` / `advanceClock` tick; edge: types + intentParser sync (no gm-turn behaviour change beyond synced types).

## Cause

- **`downtimeTurn.ts` `ATTUNE` / `END_ATTUNE` (~:26–27 at parent) + bare `advanceClock(1)`:** attune/end keyed off phrase regexes, not intent + item; voluntary end spent no Short Rest; no identify-rest refuse, no interrupt, no 24 h away timer; 4th-item refuse existed in `attunementProblem` but was not covered by a different 4th name in tt6c.

## Fix

- Trigger: `attune` → `use_item` intent; end/break/drop + `attunement` string gate; `findAttuneTarget` = longest carried magic name in the line. Deleted `ATTUNE` / `END_ATTUNE`.
- Attune/end: `takeShortRestHour` (clock + `shortRestRecovery`); identify-rest refuse; pending-encounter interrupt (hour passes, no attune); cursed voluntary end refuse; death clear already in `commitDeath`.
- Away: `markAwayAttuned` on `removeItem`; `tickAwayAttunements` in `advanceClock` (≥24 h).
- Brooch of Shielding in `MAGIC_ITEMS` so tt6c can refuse a true 4th.
- ruleCount: folded `isEngineRecoveryProse` into `isBannedFallbackStub`; cut discovery XP telemetry; compacted `inventoryConservation`.

## Tests

- `ttEcr2Attunement.test.ts` 4/4 green.
- tt6c attunement case: 4th Brooch refuse + voluntary end `+1h` (cite E-CR2 / SRD Short Rest).

## Replay staging (R1–R16)

| Case | Status |
|---|---|
| R1–R16 | Do not belong to E-CR2 (no attunement seats). **Not added.** |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 106 failing / 2873 (vs ECA 104). 0 E-CR2-related; flake `seed94InfestationClear` ×1 allowed. |
| replay bank | 64 failing / 652 (limit 64). tt6c attunement + crafting green. |
| tsc (`tsconfig.app.json`) | 0 (limit 552) |
| build | green |

Fix runs: 1 (restore recovery phrases into `isBannedFallbackStub` after build missed `playTranscript` import).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before (q31-ECR1) | 484 | 162879 | 6918 | 381 | 1189 (6287) | 11728 |
| after | 484 | 162745 | 6916 | 381 | 1189 (6287) | 11720 |

TOTAL did not rise (lines / regex / fns down).

## Ship

Commits `47166897` + `d90d62e2` + `653a4a98` (edge inventory inline, no `magicItems` on edge). Pushed; `gm-turn` redeployed. Live `www.synapticgm.com/version.json` = `2026-10-16o`.

## NEXT

- Reclaim path: returning a dropped attuned item within 24 h should clear `awayAttuned` and restore `attuned`.
- Drop/sell paths that bypass `removeItem` (direct inventory filter) should also start the away timer.
- Identify-via-Short-Rest writer that sets `identifiedTurn` (house: loot is identified on gain).
