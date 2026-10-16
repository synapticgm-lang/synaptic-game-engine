# q31-ECR1: crafting (Order E-CR / Spec E-CR1)

Stamp `2026-10-16n` (from `2026-10-16m`). Play change: tabletop crafting resolves by **item recipe** (SRD 5.2.1), including the magic-item path, consumable halving, scroll Material check, and journey/hostile refuse. Attunement (E-CR2) not in this order. Client `rules/downtime` + `tabletop/downtimeTurn`; edge: comicScript cut + types inline (no gm-turn behaviour change).

## Cause

- **`downtimeTurn.ts` `CRAFT` (~:28 at parent) + `craftRecipe`:** only Potion of Healing and scrolls were magic recipes; other magic items fell to "no crafting rule". The craft path keyed off a verb regex, not the item name. No Arcana+tool pair for magic items, no consumable half (p.207), no scroll Material gate, no journey/hostile `you can't work here` refuse.

## Fix

- `craftRecipe`: magic items from `MAGIC_ITEMS` use the p.207 time/cost table + category tool + `requireArcana`; consumables (not scrolls) halved (exact days → clock hours); Potion of Healing keeps the brew rule; scrolls gain optional `SpellDef.material` / consumed (Chromatic Orb diamond).
- `craftItemFromInput` + make-action gate: item name is the key; Rest (`Make camp`) skips; journey / live encounter refuse with nothing spent.
- `craftItem` check order: tool → Arcana (magic) → spell prepared → material → purse → pay → `advanceClock(24×days)` → add item; magic receipt `(Arcana, <tool>)`.
- `Potion of Climbing` added to `MAGIC_ITEMS` (SRD Common consumable).
- ruleCount: deleted edge `comicScript`, folded `getBaseCooldown`, dropped `CRAFT` regex.

## Tests

- `ttEcr1Crafting.test.ts` 4/4 green (Plate, brew, L1 scroll, Common consumable, Cloak, refusals, Material).
- tt6c crafting case covered by the same `resolveDowntimeTurn` path (bank run in gates).

## Replay staging (R1–R16)

| Case | Status |
|---|---|
| R1–R16 | Do not belong to E-CR1 (no crafting seats). **Not added.** |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 103 failing / 2869 (vs ECA 104). 0 new from E-CR1; `ttEcr1Crafting` 4/4 green. Allowed flake `seed94InfestationClear` not required. |
| replay bank | 64 failing / 652 (limit 64). tt6c crafting case green; 4 other tt6c cases (mastery / features / Smite / Bracers pick) pre-existing vs this order. |
| tsc (`tsconfig.app.json`) | 551 (limit 552) |
| build | green |

Fix runs: 1 (tsc `replaceAll` + test `itemType: 'gear'`).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before (q31-ECA) | 485 | 162899 | 6927 | 381 | 1191 (6302) | 11728 |
| after | 484 | 162881 | 6918 | 381 | 1189 (6287) | 11728 |

TOTAL did not rise (lines / regex / lists down; fns flat).

## Ship

Commits `526d51e8` + `d6119177` (edge types sync), pushed; `gm-turn` redeployed (types inline / comicScript cut). Live `www.synapticgm.com/version.json` = `2026-10-16n`.

## NEXT

- **E-CR2** attunement (4th refuse, cursed end, 24 h away, Short Rest reuse, identify-rest rule).
- Permanent Common magic item in the SRD catalogue is only potions/scrolls; Common full rate is checked via consumable ×2.
- Assistants dividing craft days when companions exist (tabletop divisor stays 1).
