# Path A ship — implementation note (2026-08-29e)

**Stamp:** `2026-08-29e`  
**Bundle:** World-map overhaul — premade geography + harvest lock + dungeon lifecycle + biome quests  
**Prior:** `docs/research/path-a-ship-implementation-2026-08-29d.md`

## Design (John)

AI writes fluff/meat and develops NPCs; **pipeline owns geography and mechanics**.  
No premade *response* cards. Premade **world map** (towns/cities/shores) at New Game so the GM cannot invent continents.

## Shipped

| Item | Module |
|---|---|
| Settlements on all world outlines | `data/worldOutlines.ts` |
| Atlas always for LitRPG/DnD/RPG (even bible `worldOutlineId: null`) | `pickWorldOutline` / `seedWorldAtlas` |
| Seed settlements → `places` (`mapCanonical`) | `worldMapAuthority.seedWorldMapPlaces` + useGame / fateAutoplay New Game |
| WORLD MAP AUTHORITY in situation packet | `situationPacket` + `formatWorldMapAuthorityBlock` |
| Invent-lock: no new cities/towns/shores in place registry | `places.upsertPlaceFromSheet` / `touchPlaceVisit` |
| Geography scrub in prose | `narrativeHarvest.scrubInventedGeography` |
| NPC harvest → lorebook + npcMemories | `narrativeHarvest.harvestNarrativeIntoLedger` |
| Dungeon open at `allowsDungeon` sites; close when cleared | `dungeonLifecycle` + `enterInterior` |
| Biome-sane quest sites (no farming in ash desert) | `questPlay.applyBiomeSaneQuestSites` |
| Vitest | `playtest29eWorldMapOverhaul.test.ts` |
| Stamp | HUD / index / `BUILD_STAMP` = `2026-08-29e` |
| Mid writer | **OFF** |

## Verify

```bash
npm test -- src/game/playtest29eWorldMapOverhaul.test.ts src/game/playtest29dGeminiCalibrated.test.ts
node scripts/sync-gm-edge-shared.mjs
npx supabase functions deploy gm-turn
```

## Redeploy

Client + `gm-turn` (WORLD MAP AUTHORITY in packet).

## Residual

- Hub banks still exist alongside atlas (merged, not removed); shattered-coast hubs join Saltmar atlas (29e follow-up)
- Hub `linkedQuestIds` reveal on arrival; dungeon `clearedNodeIds` written on room clear; fate-autoplay harvest/geography/dungeon-close parity (29e follow-up)
- PYOA remains closed atlas by default
- Harvest name regex is heuristic (Title Case)
- Full loot-table pre-roll still deferred
- Content depth / Gemini 7+ still needs 4×300 re-score under 29e (do not run until John asks)
