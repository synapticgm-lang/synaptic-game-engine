# Manus Phase 2–3 ship (2026-09-12)

**Stamp:** HUD/BUILD `2026-09-12b`  
**Branch:** `fireworks-free-09a`  
**Not done at write:** commit/push (closed with 12c push). Phase 4 closed in `MANUS-PHASE-4-SHIP-2026-09-12.md` (24 SP hooks + preview, not 200). Still no `gm-turn` deploy.

## What Phase 2 is in code

An authored encounter **catalog**, not a new combat machine.

- `src/data/encounters/` — LitRPG 8+5+3 (+ hub ties), D&D 8+5+3, RPG 8+5+3, PYOA 8 crisis rows
- `src/game/encounterBible.ts` — `selectCatalogEncounter` / `catalogDroughtNames` / `isCatalogFoeTalkForbidden`
- `arcDirector.hubSkirmishEncounter` picks `seed.foeName` (fallback: catalog drought table)
- `shouldSpawnCombat` cadence and `encounterTerminalFsm` **unchanged**
- Graph skips living Talk for a catalog lastKill

XP stays on the existing curve (trash 25 / elite 35 / boss 50, L2@150). No loot RNG. No SNAPSHOT/CRAFT. No stitch-as-writer.

## What Phase 3 is in code

Summoned Pact **content** on owners that already exist.

- 7 hubs on `SUMMONED_PACT_HUBS` (Mireglass March, Cinderwake Trail, The Sump Court, Hollow Engine, The Argent Ledger, Saint Vhal’s Reliquary, The Integration Scar)
- 30 named `keyNPCs` (First Last / Title+Given, original only)
- 16 `starterQuests` (hidden until `revealQuestsFromHubLinks`)
- `entityRegistry` locations + NPC names so harvest is not Title-Case soup
- `seedBibleNpcRoster` → dormant `npcMemories[]` (no `introSpoken` until first harvest)
- Hub arrival beats in `hubEncounters.ts`
- Travel graph prefers hubs linked to a revealed quest

## Tests

`src/game/playtest12bManusPhase23.test.ts` — catalog pick, lastKill Talk starve, hubs + travel, roster/registry, quest reveal, 12a first-meet on a seeded NPC.

## Cut from the plan

- New combat FSM / flee-loop rewrite
- Loot tables + coin rolls + L2 curve change
- 60 extra encounter seeds / 300t density register
- NPC turnover clocks
- Phase 4 (200 hooks + New Game preview)
- Parallel `npcMemory` Record / packet essays
