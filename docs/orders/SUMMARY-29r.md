# SUMMARY 29r — place templates + XP in every mode

Stamp `2026-09-29r1`.

## Part A. Place templates
- New `src/game/placeTemplates.ts`, next to the existing shed, ruin and grand layouts, the cave and sewer themes, and the spaceship blueprint. Those were not touched. Each template has an id, a one-line label, up to four interior names, a reuse list, and empty `who` / `where` for the writer.
  - Insides: `bld-inside-house`, `bld-inside-shop`, `bld-inside-tavern`, `bld-inside-barn`. Each is a one-floor plan with one room per interior name.
  - Shapes: `bld-shape-cliff-village`, `bld-shape-cave-dwelling`, `bld-shape-sea-harbour`, `bld-shape-river-harbour`. `settlementShapeTemplate(kind, biome)` picks one. A river biome gives the river harbour. A sea biome, or a shore with no river word, gives the sea harbour. The two have different ids and interior names. Shapes have no floor plan, no picture, and no quest card.
  - Vehicles: `veh-cart-hand`, `veh-wagon-covered`, `veh-wagon-merchant`, `veh-cart-farm`, `veh-boat-fishing`, `veh-boat-barge`, `veh-boat-cargo`, `veh-boat-rowboat`. Interior kind `vehicle`.
- `mapEngine.interiorBuildingScale` has a new `inside` scale. A place label that matches a house, shop, tavern or barn reuse word now gets that plan in `pickInteriorLayout` instead of the ruin layout. Like sheds, it counts as one floor for the rebuild check. A label with damage words (ruin, burnt, husk, collapsed…) still gets the ruin layout, so a burnt-out house stays a ruin.
- `interiorGenerator.interiorTemplates` now includes the four insides (kind `building`) and the eight vehicles (kind `vehicle`). The grand layouts no longer carry the `house` tag, so a house request goes to the house plan.
- `placeAuthority.isInteriorPlace` now also treats house / cottage / shop / barn / stable as interiors, so those places reach the floor plan. Inn and tavern were already on that list. Street words still win over them.

## Part B. XP in every mode
- `milestoneXp` in `xpRules.ts` takes two new optional values, `playerLevel` and `areaLevel`. When the player is 6 or more levels above the area, the amount after the difficulty scale becomes 5 percent, rounded. It is never 0 when the full amount was at least 1. D&D keeps the CR table or budget band and shows the cut in its maths line. There is no new XP table.
- `placeAuthority.milestoneAreaOpts(state)` supplies those two values. The area level is the same local area level chests use, before the party ±3 clamp. With the clamp on, a 6-level gap could never happen. `resolveLocalAreaLevel` now also returns `rawLevel`.
- Every milestone payer passes those values:
  - `sandboxXp`: quest, encounter, place, person, dungeon cleared, spine
  - `engineFight`: encounter
  - `dungeonCard`: room, entry, dungeon
  - `useGame`: auto-fight encounter
- Discovery XP in `discoveryXpLedger.ts` no longer has its own flat list (15/5/10/20/25). Each discovery type maps to a milestone kind and goes through `milestoneXp` with the same cut:
  - location → significantPlace
  - npc → significantPerson
  - quest clue → questStep
  - first combat → encounter
  - object / fact / secret / skill → roomCleared
  - resolution → questComplete
- Settlement cards: `finishSettlementQuestCard` calls `completeSettlementQuestCard` and pays `milestoneXp(mode, 'questComplete')` once, with award key `settlement-card:<id>`.
  - D&D uses the local area level (clamped, the same value chests use) as the budget level, so the amount comes from the High band for the area, not the player level.
  - rpg and litrpg pay the flat 100, then the cut if it applies.
  - PYOA pays nothing.
  - A finished card also grants one item from the grade-1 chest roll (`chestProfileForGrade(1)`) at the area level. The roll is reseeded up to 12 times if it comes up empty.
  - A card that is already done or already paid pays nothing and grants nothing.
- What counts as finishing: picking an open card's chip at that card's own place (`settlementCardForChip` checks the turn-start and this-turn location). It is not offered during opening covers, dungeons or fights. This runs inside `applySandboxXpAwards`, so live play (`useGame`) and autoplay (`fateAutoplay`) share it. The item goes to inventory and a `Loot:` STATUS line.
- Authored main-quest amounts and authored reward strings are unchanged apart from the shared cut. `awardQuestXp` is not called.

## Gates
- tsc (`tsconfig.app.json`): 601, the same set. I compared it with a stashed baseline run. The only text differences are union members printed in a different order.
- vitest: 128 failed / 1920. The baseline is 128 / 1909, and the failure names are identical, so there are no new failure names.
  - New `playtest29rPlaceTemplatesXp`: 11 tests, all passing.
  - I updated one existing assertion: `playtest28aArcDirector` "inspect awards XP once per evidence-id" expected the old flat 5. It now expects the shared discovery amount.
  - Stamp tests were bumped from q1 to r1.
- build: exit 0.
- No Supabase edge file changed, so there was no Deno check and no `gm-turn` deploy.

## T10 (seed 61, fate pick, Free writer; same command lines as `docs/orders/t10.ps1` with the seed changed)
- litrpg summoned-pact: 10/10 turns, 0 errors, P0=0 (`runs/2026-09-29T10-08-49-224Z_summoned-pact_cold-system_s61`)
- tabletop cursed-keep: 10/10 turns, 0 errors, P0=0 (`runs/2026-09-29T10-08-49-225Z_cursed-keep_chilled-gm_s61`)
- rpg salt-road-heist: 10/10 turns, 0 errors, P0=0 (`runs/2026-09-29T10-08-49-213Z_salt-road-heist_chilled-gm_s61`)

## Notes
- The order didn't define "stake resolved", so it is read as the card's chip being picked at its place: one pick finishes the card, once.
- The edge copy of `mapEngine.ts` (synced by `sync-gm-edge-shared`) was not re-synced. That would be an edge change, and the order only allows a deploy if an edge file changed.

ALL DONE
