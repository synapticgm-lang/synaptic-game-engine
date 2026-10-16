# q31-EKIT: class starting kits (Order E-KIT / Spec E-KIT)

Stamp `2026-10-16p` (from `2026-10-16o`). Play change: tabletop creation kits are the SRD 5.2.1 Choose A or B lists (gold-only option is id `B`, not a parallel `coin` label); Druid no longer double-counts the focus; creation inventory cannot hold Bracers of Defense / other magic unless the SRD kit names it. Client `tabletop/characterBuild` + `creationFlow` + `sheetLibrary` + builder chip text; fixture `docs/test-data/srd-class-kits.json`. No edge / gm-turn change.

## Cause

- **`characterBuild.ts` `CLASS_KITS` (~:236):** eleven classes stored SRD option B as id `coin` ("Coin instead") instead of id `B`. Fighter correctly had A + B gear packages plus SRD (c) 155 GP as `coin`.
- **Druid kit A:** listed both `Quarterstaff` and `Druidic Focus` while SRD 5.2.1 says `Druidic Focus (Quarterstaff)` — one item. Bracers of Defense were never in any kit (confirmed); tt6c Bracers cases stay loot/attunement (E-CR2).

## Fix

- Fixture `docs/test-data/srd-class-kits.json` (SRD 5.2.1 CC BY 4.0; 12 × A/B = 24 rows) from Traits tables / 5e-bits class `starting_equipment_options` descs.
- `CLASS_KITS`: gold-only rows → id `B` + GP label; Fighter keeps `coin` as (c) 155 GP; drop Druid's extra `Druidic Focus`.
- `kitDef` / creation / sheet-library: legacy `coin` maps to gold-only B; chips show `N GP` for empty-gear kits.
- Data + creation asserts in `ttEkitClassKits.test.ts` (no magic at creation; Bracers never a chip).

## Tests

- `ttEkitClassKits.test.ts` 5/5 green.
- tt1 writer-packet walk updated to chip `100 GP` (was `Coin instead (100 GP)`).

## Replay staging (R1–R16)

| Case | Status |
|---|---|
| R1–R16 | Do not belong to E-KIT (no creation-kit seats). **Not added.** |
| Opening kit (mode3 fix 2 / R17 kit clause) | Already covered in bank; not duplicated. |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 105 failing / 2878 (vs ECR2 106). 0 E-KIT-related. |
| replay bank | 64 failing / 652 (limit 64). |
| tsc (`tsconfig.app.json`) | 0 (limit 552) |
| build | green |

Fix runs: 0 (gates green first pass).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162792 | 6916 | 381 | 1189 (6287) | 11722 |
| after | 484 | 162792 | 6916 | 381 | 1189 (6287) | 11722 |

TOTAL did not rise.

## Ship

Client stamp `2026-10-16p`. No gm-turn deploy. Pushed; Vercel git build; live `version.json` verified below.

## NEXT

- Sub-chips for Bard musical instrument / Monk artisan tools (house default Lute / Woodcarver's Tools today; Spec allows until a sub-chip exists).
- Fighter (c) could be labeled in the fixture as a third audited row if John wants 25 rows instead of 24 A/B.
- tt1 rest/expertise bank fail (`modifier` 0 vs 4) is pre-existing, not this order.
