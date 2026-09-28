# Template map — where the game's map and interior templates live

Written 2026-09-28 (28j) so nobody has to search again. Paths are relative to `game/project`.

| File | What it holds | Rooms | Connections | Sizes | Biome/terrain |
|---|---|---|---|---|---|
| `src/data/worldOutlines.ts` | 4 premade world maps: `crescent-isles`, `spine-marches`, `grid-metro`, `shatter-coast`. Each has regions (with connections) and settlements (kind, regionId, allowsDungeon, questTags). `pickWorldOutline()` picks one at New Game, unless a bible pins `worldOutlineId`. | Settlements, not rooms | Yes (region graph) | No, and no x/y grid | Yes: region `tags` (coast, forest, mine…) and settlement `biome` |
| `src/game/worldAtlas.ts` | `seedWorldAtlas()` / `instantiateWorldAtlas()`: turns an outline into `state.worldAtlas` | — | — | — | Carried through from the outline |
| `src/game/mapEngine.ts` → `SHED_LAYOUTS` (2), `RUIN_LAYOUTS` (3), `GRAND_LAYOUTS` (2), type `InteriorRoomSpec` | 7 whole-building floor plans with B1/1F/2F floors, stairs and secret rooms. Exported since 28j. | Yes (labels) | Yes (`links`) | Yes (`x, y, w, h, z`) | No |
| `src/game/mapEngine.ts` → `CORE_BLUEPRINTS` | `blueprint_cave_small_01` (3 rooms) and `blueprint_spaceship_medium_01` (4 rooms, vehicle) | Yes | Yes | Grid coords only | Tags only (subterranean, sci-fi) |
| `src/game/mapEngine.ts` → `generateProceduralBlueprint(shape, name, n)` | Procedural shapes: `web`, or `grid`/chain (any size) | Generated ("Name - Hex n") | Yes | Grid coords | No |
| `src/game/mapEngine.ts` → `buildInteriorFloorPlan()`, `buildLocalAreaMap()` | House interiors (they pick one of the 7 layouts) and 3×3 street maps | Yes | Yes | Yes / slots | No |
| `src/game/data/encounters/D10_biome_spawn_matrix.csv` (+ `encounterBiomeMatrix.ts`) | Per-bible site "biomes" (for example summoned-pact `crypt-dungeon`) with allowed and excluded actor families. Loaded async. `detectBiome()` guesses a biome from a name. | No | No | No | Site kinds per bible (story data) |
| `src/data/dungeonBiomes.ts` (28i) | Shared table: biome → creature families and biome room flavour, plus threat modifiers (undead, ash, blight) | No | No | No | Yes |
| `src/game/interiorGenerator.ts` (28j) | Generic generator built on the templates above. It picks templates, decides the size, stacks floors (stairs/ladders), adds a seeded extra door, may add one secret room and assigns room roles. Dungeon cards use it. Buildings and vehicles can call it with `kind: 'building' \| 'vehicle'`. | Output | Output | Output | No (biome comes from the atlas + dungeonBiomes) |

## Missing template types
Ships and boats, carts and wagons, trains, towers and keeps, and mines and sewers have no dedicated layouts. Dungeons reuse the RUIN layouts, the small cave and the procedural shapes. No interior template carries biome or terrain.

## Story-data note
summoned-pact pins no `worldOutlineId`, so it gets a random outline that does not contain its hubs. The Cathedral Undercroft therefore has no map cell, and its biome comes from the hub text fallback.
