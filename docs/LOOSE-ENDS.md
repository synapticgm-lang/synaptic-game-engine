# Loose ends audit (28j-L1)

Source: `docs/loose-ends-raw.txt` (knip compact: 473 unused files, 231 unused-export groups, 127 unused type groups, 3 unresolved imports, 10 unlisted deps) cross-checked against `docs/CODEMAP.md` (stamp `2026-09-28j`, commit `f007ad0`) with one caller grep per item. Read-only audit — no source edits.

## Summary

| Status | Rows |
|---|---|
| connected | 34 |
| disconnected-but-valuable | 8 |
| truly dead | 19 |
| unsure | 22 |
| **total** | **83** |

How to read knip's noise:

- Most "unused exports" are **connected**: the symbol is still called inside its own file; only the `export` keyword is unneeded.
- Knip has no entry points configured for Deno edge functions, npm-script harnesses, or `wof/`. So `supabase/functions/**`, `scripts/fate-autoplay/run.ts` and similar, and `wof/src/**` all show up as "unused files" even though they run.
- ~250 of the 473 unused files are research pastes under `docs/research/**` (Manus/Gemini deliverables and prototypes). They are docs, not live code.
- Several `src/game` modules are imported **only by vitest files**. Knip treats tests as entries, so these show as "unused exports", not "unused files". These modules are the real disconnected systems.

## Maps / templates

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `interiorGenerator.interiorTemplates` | Building / cave / ship room templates | connected | Already reached: `interiorGenerator` → `dungeonCard` → `useGame` / `choiceCompiler` |
| `mapEngine` `addLandmarkToLocalMap` / `presentInteriorMap` / `addRoomToInteriorMap` / `lookLikeEntrance` | Local map + interior floor-plan building | connected | Used inside `mapEngine` (export only is unused) |
| `dungeonLifecycle` `buildInteriorFloorPlan` / `shouldAutoCloseDungeon` | Multi-room interior plan; dungeon auto-close on clear | connected | Used by `mapEngine` and internally |
| `dungeonCard` `buildDungeonCard` / `parkDungeonCard` / `dungeonRoomFacts` / `DUNGEON_CARD_BLUEPRINT` | Dungeon card from templates + biome | connected | Used internally; module imported by `useGame` / `enterInterior` |
| `enterInterior` `playerEntersInterior` / `buildConvenienceStoreDungeon` / `maybeAdvanceDungeonRoom` | Enter-building → seeded dungeon graph | connected | Used internally; module imported by `useGame` |
| `worldAtlas.revealWorldRegion`, `worldMapAuthority` `settlementBiomeTags` / `settlementsFromAtlas` | Atlas fog + settlement biome lock | connected | Used internally |
| `dungeonBiomes.BIOME_ALIASES`, `data/worldOutlines.WORLD_OUTLINES` | Biome aliasing; world outlines | connected | Used internally |
| `outdoorHubs` per-bible `*_HUBS` / `hubsForBible` / `buildPlaceCard` | Outdoor hub registry per LitRPG bible | connected | Used internally via the hub lookup |
| `worldAtlas.defaultAtlasForMode` | One-line wrapper: outline → atlas | truly dead | — (callers use `pickWorldOutline` + `instantiateWorldAtlas` directly) |
| `places.sheetFromPlace` | PlaceRecord → LocationSheet converter | truly dead | — |

## Loot

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `dungeonSeed.openLootableInDungeon` | Open a named lootable (chest/crate) on the current dungeon node; returns hidden loot | disconnected-but-valuable | `useGame` search/inspect branch when `activeDungeon` node has lootables (feed result to `looseItems` pickup) |
| `dungeonSeed` `rollLootRarity` / `PITY_THRESHOLDS` / `interactablesFromNode` | Rarity roll with pity; node interactables | connected | Used internally |
| `lootTableRegistry` `SGM_COIN_PURSE` / `SGM_TREASURE_CACHE` / `sgmItemRarity` / `CLASS_FIT_SHARE` | Loot tables | connected | Used internally; module imported by `combat` / `engineFight` / `dungeonCard` / `useGame` |
| `salvage` `generateSalvageYield` / `getAvailableProfessions` | System Salvage yields | connected | Used internally; module in `MerchantWindow` / `useGame` |
| `inventory.addMaterials` | Merge crafting materials into `state.materials` | unsure | Salvage yield commit in `MerchantWindow` if materials are meant to stack |
| `inventoryConservation` `snapshotInventory` / `restoreInventoryFromSnapshot` / `checkInventoryConservation` / metrics | Bag rollback + conservation check (27w) | unsure | Module is live via `qualityGovernance`; these helpers never called — would sit in `qualityGovernance` commit |

## XP

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `xpRules` `DND_XP_BY_CR` / thresholds / `normalizeCr` | Tabletop XP by CR | connected | Used internally; module in `characterXp` / `engineFight` / `useGame` |
| `xpPolicy` `combatXpAmount` / `questXpAmount` | XP amounts per mode | connected | Used internally; module in `arcDirector` / mode engines |
| `beatRegistry` `COMBAT_BEATS` / `QUEST_BEATS` / `TRAVEL_BEATS` / `xpFromTemplate` | Versioned beat templates (02ac) | connected | Used internally; module in `arcDirector` |
| `dailyMilestoneLedger.DAILY_QUEST_MILESTONE_XP` | B045 daily +20 | connected | Used internally |
| `discoveryXpLedger` `calculateResolutionXp` / `calculateRiskXp` / `calculateInspectXpShare` / `checkLevelingPace` | Resolution/risk XP math + pace check | unsure | Module live via `qualityGovernance`; these four are uncalled. `checkLevelingPace` would fit the Fate run summary |
| `socialProgression` (whole module) | Social XP track, novelty-key XP, relationship/faction unlocks | disconnected-but-valuable | `arcDirector` social milestone step (beside `socialMilestoneLedger`) — matches the open "social track" pacing question |

## Combat

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `encounterBible` catalog exports | Authored encounter catalog | connected | Imported by `arcDirector`, `graphChoices`, and 5 encounter modules |
| `encounterTerminalFsm` `formatEncounterClearedStatus` / `encounterCapsForMode` | Terminal FSM receipts + caps | connected | Used internally |
| `recoveryRules` `RECOVERY_TABLE` / `isSafeHubRest` | Rest/recovery table | connected | Used internally; module in `arcDirector` / `engineFight` |
| `encounterTelegraph` (whole module, test-only) | Pre-engagement warning cues so a fight is legible before commit | disconnected-but-valuable | `arcDirector` drought spawn (`shouldSpawnCombat` preface) |
| `encounterStakes` (test-only) | Materialize stakes + legal actions per template | unsure | `arcDirector` spawn commit, if stakes should gate pads |
| `encounterTemplateLoader` (test-only) | Loads 48 WS-4 templates (8/8/8 + 24 PYOA) | unsure | Overlaps `src/data/encounters` catalog; would feed `encounterBible` |
| `encounterAftermath` + `encounterResolutionMechanics` (test-only) | Typed receipts on encounter end (XP/loot/faction/quest) | unsure | Overlaps `encounterTerminalFsm` clear receipts; would sit at clear commit in `useGame` |
| `encounterResolution` `validateEncounterResolution` / `formatEncounterAftermath` / metrics | 27w resolution validator | truly dead | — (module live via `qualityGovernance`; these never called) |
| `combatReceipt.formatCombatTelegraph` | One-line threat telegraph | truly dead | — (superseded) |
| `ledgerCombat.itemLooksLikeWeapon` | Weapon-name regex | truly dead | — (weapon grounding lives in `searchContinuity`) |
| `aiService.callGmAutoFight` | Auto Fight GM call | unsure | Referenced only inside `aiService`; confirm Auto Fight still routes through it |

## NPCs

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `npcLifecycleFsm` `buildLifecycleSituationSection` / `formatLifecycleMandates` / `shouldNpcExit` | Tells the writer which NPCs are entering/leaving/overdue | disconnected-but-valuable | `situationPacket` (module already live via `arcDirector`, but the packet never shows it) |
| `npcCrossIntegration` (whole module, test-only) | Witness memory sync, gossip, faction propagation between NPCs | disconnected-but-valuable | `useGame` post-harvest commit, next to the `npcMemories[]` update |
| `socialSkills` (test-only) | Hybrid auto/roll social resolution with outcome bands | disconnected-but-valuable | `checkRules` social DC path |
| `npcTurnover` | NPC turnover actions | unsure | Only reached via `packageCoordination` (test-only); would be `arcDirector` |
| `npcMemoryLedger.buildMemorySituationSection` | Per-NPC memory block for the packet | unsure | Overlaps `npcMemory.formatNpcMemoriesForPrompt` (live) |
| `leverageMechanics`, `socialStakes` (test-only) | Leverage assets / social stakes templates | unsure | `socialCrisis` in `arcDirector`, if social crises need them |
| `npcRoleRegistry` | Role registry | connected | In `npcLifecycleFsm` / `npcMemory`; note duplicate export `NPC_ROLE_REGISTRY` = `ROLE_OBLIGATIONS` |
| `npcMemory` merchant/quest-giver/social-pad helpers | 12c social leftover | connected | Used internally |
| `manusHonestRoster` `MANUS_*_NPCS` / `_QUESTS` | 17c roster | connected | Imported by 5 bible files |
| `npcRelationships.TRUST_BANDS` | Trust bands | connected | Module in `checkRules` |
| `folkVoiceExpectations.FOLK_VOICE_PROFILES` | Folk voice banks | connected | Used internally |

## Quests

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `questGuards.applyQuestCompleteGuard` | Refuses completing a quest that was never revealed/active | disconnected-but-valuable | `questPlay` `<quest-complete>` handling |
| `questCompletionSchema` `checkQuestTerminalState` etc. | Quest terminal-state schema (27w) | unsure | Module live via `qualityGovernance`; check call would be in `questPlay` |
| `questPlay` `mainSpineQuest` / `nextMainObjective` / `mainQuestPlacePin` | Resume-main + map pin | connected | Used internally |
| `litrpg/storyRpg/tabletopMainSpines` helpers | 17a/d/e spine matchers | connected | Used internally |
| `questJournalEnrich.GENERIC_QUEST_PROVENANCE` | Journal provenance filter | connected | Used internally |
| `mysteryCulprit` `pickMysteryCulprit` / `resolveMysteryCulprit` | Giltwood hidden killer | connected | Used internally |
| `spineMapRegistry.formatMilestoneMandate` | Milestone mandate line | unsure | Module only reached by scripts (`densityValidation`); would be `situationPacket` |
| `pyoaEndingGates` (test-only) | Ending prerequisite + priority selection | unsure | Overlaps `pyoaSpine` ending leaves / Umbra compiled book |
| `pyoaCrisisRegistry`, `pyoaCatalogLoader` | PYOA crisis catalogs | unsure | Only via `packageCoordination` / tests |
| `pyoaDelayedConsequences` `create*Consequence` / `cancelConsequence` | Consequence constructors | unsure | Module live; constructors never called — would be at PYOA fork commit |
| `pyoaConvergence` (test-only) | Branch convergence detection | truly dead | — (superseded by `pyoaSpine`) |
| `pyoaReplay` (test-only) | Replay / speedrun scaffolding | truly dead | — |
| `pyoaBranchLedgerV2`, `pyoaDelayedConsequencesV2` | WS-5 V2 rewrites | truly dead | — (V1 `pyoaBranchLedger` is live; V2 depends on unlisted `nanoid`) |
| `packageCoordination` + `exclusiveFactsRegistry` + `receiptLedger` | WS-2/4/5 pre-GM commit orchestrator | truly dead | — (test-only; `exclusiveFactsRegistry` imports a missing `./crossPackageContracts`) |

## UI

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `components/admin/GmFeedbackReview.tsx` | Admin review of thumbs feedback (filters, CSV) | disconnected-but-valuable | Admin section of `SettingsModal` (notes say "Admin Play Feedback page still unmounted") |
| `comic/NarrativeText` | Comic/narrative text renderer | connected | 5 importers (knip flags the export style only) |
| `game/stripeCheckout.ts` | Client Stripe checkout + entitlement sync | unsure | `CapacityPackShop` buy button — payments are parked as ops |
| `services/llmDirectorService.ts` | Graphic-novel Director panel scripting | unsure | Director deliberately off; would be memorable/comic pipeline |
| `imageGen.generateImage` | Legacy image call | unsure | Module imported by `useGame` for other exports; hosted path is `generate-image` |
| `game/choiceTracking.ts` | 10-turn recent-choice window | truly dead | — |
| `comicPageCompositor.bakeComicPageSnapshot` | Bake comic page image | truly dead | — |
| `playTranscript.downloadPlayTranscript` | Old transcript download | truly dead | — (Debug uses the dump export) |
| `grammarCheck` (test-only) | LanguageTool post-GM fixes | truly dead | — |
| `narratorProvider` (test-only) | Day-1 narrator stub | truly dead | — |

## Edge functions

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `gm-turn/index.ts`, `generate-image/index.ts` | Hosted turn + image endpoints | connected | Deno entries (knip has no Supabase entry config) |
| `_shared/gm/*` (~100 files) | Synced copies of `src/game` for `gm-turn` | connected | Loaded by `gm-turn`; kept in sync by `npm run sync:gm-edge` |
| `_shared/playPrivileges.ts` | Writer/tier clamps | connected | Used by `gm-turn` |
| `create-checkout/index.ts`, `stripe-webhook/index.ts` | Stripe checkout + webhook | unsure | No client caller (`stripeCheckout.ts` is unused); goes live with payments ops |

## Other

| Item | What it was for | Status | The one place it should connect |
|---|---|---|---|
| `docs/research/**` code (~250 files) | Manus/Gemini deliverables, prototypes | truly dead | — (keep as docs; add to knip `ignore`) |
| `scripts/tmp-*`, `scripts/_probe/*`, `ai-player-browser/_tmp-*`, `fate-autoplay/_dbg-*` / `_longrun-*` | One-off probes | truly dead | — |
| `scripts/fate-autoplay/run0*FourModeT50.ts`, `write-02*-owner-map.mjs`, old paste writers | Historic batch runners | truly dead | — |
| `scripts/fate-autoplay/run.ts`, `dualReview`, `autoImprove`, `curriculumImprove`, `writeGeminiPastes`, live-drive, `geminiReview` | Harness tools | connected | `package.json` npm scripts |
| `scripts/ai-player-browser/*` | Browser AI-player harness | connected | npm `ai-player-*` (uses unlisted `puppeteer-core`) |
| `wof/src/**` | WOF sandbox engine | connected | WOF build only — never live `src/` |
| `campaignMemory.retrieveMemoriesSmartly` | Scored memory retrieval | unsure | `situationPacket` memory retrieve (live uses simpler retrieve) |
| `worldSim.formatWorldLedgerForPrompt`, `sceneFacts.formatSceneFactsForPrompt` | Old prompt formatters | truly dead | — (replaced by SNAPSHOT / packet diet) |
| `intentContract.checkUnresolvedObligations` | Blocks turn with open obligations | unsure | Pre-GM gate in `useGame`, if still wanted |
| 127 unused exported types | Type exports | truly dead | — (harmless) |
| Duplicate exports (`memorableMoments` caps, `npcRoleRegistry`) | Aliases | truly dead | — (cleanup) |
| Unresolved imports (`exclusiveFactsRegistry`, `playtest31aCoordination.test`, WOF paste test) | Broken paths to `crossPackageContracts` | unsure | Only matters if `packageCoordination` is ever revived |

## Disconnected but valuable — shortlist

- `dungeonSeed.openLootableInDungeon` → `useGame` dungeon search/inspect branch (real chest loot instead of prose).
- `socialProgression` → `arcDirector` social milestone step (social XP track).
- `encounterTelegraph` → `arcDirector` drought spawn preface.
- `npcLifecycleFsm.buildLifecycleSituationSection` → `situationPacket`.
- `npcCrossIntegration` → `useGame` post-harvest `npcMemories[]` commit.
- `socialSkills` → `checkRules` social DC path.
- `questGuards.applyQuestCompleteGuard` → `questPlay` quest-complete handling.
- `GmFeedbackReview.tsx` → Admin section of `SettingsModal`.
