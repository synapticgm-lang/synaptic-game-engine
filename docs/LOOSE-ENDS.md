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

## Review of dead + unsure items (28 Sep)

Judged against the current design: engine-owned milestone XP, engine loot, one-turn `engineFight` combat, generated dungeon cards/interiors from existing templates, open-world light premade stories, NPC tracking, anti-circling chips. The audit tables above hold 20 "truly dead" rows (the summary says 19) and 22 "unsure" rows; all 42 are reviewed here.

### Maps / templates

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Default atlas shortcut (`worldAtlas.defaultAtlasForMode`) | One-line wrapper that picks a world outline and builds an atlas from it. | No. Callers already call the two underlying steps directly. | REMOVE — safe, nothing calls it; `pickWorldOutline` + `instantiateWorldAtlas` do the job. **DONE** (src + edge copy). |
| Place-to-location-sheet converter (`places.sheetFromPlace`) | Turns a saved place record into a location sheet. | No. Dungeon cards and interiors are built from templates (`dungeonCard` / `interiorGenerator`), not converted from place records. | REMOVE — safe, no callers; superseded by the dungeon card path. **DONE** (src + edge copy). |

### Loot

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Add crafting materials (`inventory.addMaterials`) | Merges salvage materials into the player's material storage. | No. Salvage already returns a new state with the materials merged (`MerchantWindow` uses `result.newState`). | REMOVE — safe; superseded by the salvage module's own commit. **DONE** (src + edge copy). |
| Bag snapshot / rollback / conservation check (`inventoryConservation` helpers) | Snapshot the bag before a turn, restore it, and check nothing appeared or vanished. | No. Engine loot is the only thing that changes the bag, and a failed turn already falls back to the last committed state. | REMOVE the uncalled helpers — safe; engine loot + commit-only state cover it. Keep the parts `qualityGovernance` calls. **DONE** — removed `checkInventoryConservation`, `snapshotInventory`, `restoreInventoryFromSnapshot`, `trackInventoryMetrics`, `calculateBagStability`, `InventoryTelemetry`; kept `buildInventoryAuthority` / `validateInventoryChanges` and the rest. |

### XP

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Resolution / risk / inspect XP math + leveling pace check (`discoveryXpLedger` four helpers) | Computes XP for resolving, risking, and inspecting, plus a "are they levelling on pace" check. | The three XP formulas: no — milestone XP is engine-owned (`arcDirector` / `xpPolicy`). The pace check: yes, as a measuring tool for the open "L2 by T15–25" question. | WIRE IN — `checkLevelingPace` only, into the Fate autoplay `summary.json` writer; remove the three XP formulas (superseded by engine milestone XP). **DONE (partial)** — `calculateResolutionXp` + `calculateRiskXp` removed; `calculateInspectXpShare` SKIPPED (the kept `checkLevelingPace` calls it); `checkLevelingPace` not wired yet (order 28k-A said not now). |

### Combat

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Encounter resolution validator (`encounterResolution.validateEncounterResolution` / `formatEncounterAftermath` / metrics) | 27w check that a fight actually resolved, plus an aftermath text line. | No. `engineFight` settles a fight in one turn and `encounterTerminalFsm` writes the clear receipt. | REMOVE — safe; superseded by `engineFight` + terminal FSM receipts. **DONE** (also `trackEncounterMetrics` / `EncounterTelemetry`). |
| One-line threat warning (`combatReceipt.formatCombatTelegraph`) | Prints a short "a threat approaches" line. | No. The spawn preface (`autoFightSpawnPreface` / drought preface) does this, and `encounterTelegraph` is the shortlisted richer version. | REMOVE — safe; superseded by the spawn preface. **DONE** |
| Weapon-name guess (`ledgerCombat.itemLooksLikeWeapon`) | Regex that guesses whether an item name is a weapon. | No. Weapon grounding lives in `searchContinuity`. | REMOVE — safe, no callers. **DONE** |
| Encounter approaches with requirements (`encounterStakes`) | Builds per-template approach options (fight / talk / sneak…) and marks which ones the player qualifies for. | Unclear. `graphChoices` already gives Attack / Flee / Talk pads; this would add requirement-gated approaches on top. | JOHN DECIDES — should fights offer template-specific approaches gated by kit/skills, or are the existing Attack / Flee / Parley pads enough? **SKIPPED** (John decides; not in 28k-A). |
| Encounter template loader (`encounterTemplateLoader`) | Loads the 48 WS-4 encounter templates. | No. The authored catalog in `src/data/encounters` feeds `encounterBible` already (12b). | REMOVE — safe; superseded by the `src/data/encounters` catalog. **DONE** |
| Encounter end receipts (`encounterAftermath` + `encounterResolutionMechanics`) | Multi-step fight resolution plus typed XP / loot / faction / quest receipts at the end. | No. One-turn `engineFight`, engine loot, and the terminal FSM clear receipts own all of this. | REMOVE — safe, test-only; superseded by `engineFight` + `encounterTerminalFsm`. **DONE** |
| Auto Fight writer call (`aiService.callGmAutoFight` + `aiService.direct.callGmAutoFightDirect`) | Asked the writer to narrate an Auto Fight. | No. Auto Fight now narrates from a template (`narrateAutoFightTemplate`) and commits with `commitAutoFightLedger` in `useGame`. | REMOVE — safe; superseded by the template + ledger Auto Fight path. **DONE** |

### NPCs

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| NPC turnover engine (`npcTurnover`) | Decides when an NPC leaves, relocates, changes role, or hands off to a successor. | Mostly no. NPC exit is already handled by `npcMemory` `shouldExit` (12c) and `npcLifecycleFsm`; this is only reached from the dead coordinator. | REMOVE — safe; superseded by 12c exit + lifecycle FSM. **DONE** |
| Per-NPC memory block for the writer (`npcMemoryLedger.buildMemorySituationSection`) | Writes a memory section about each NPC into the writer packet. | No. `npcMemory.formatNpcMemoriesForPrompt` is the live version. | REMOVE — safe; duplicate of the live formatter. **DONE** (plus its now-orphaned private helper `formatKeyMomentSummary`). |
| Leverage and social stakes (`leverageMechanics`, `socialStakes`) | Templates for leverage assets and what is at stake in social crises. | Unclear. Social crises run in `arcDirector` without them. | JOHN DECIDES — should social crises carry mechanical leverage (items/secrets that change outcomes), or stay as story beats? **SKIPPED** (John decides; not in 28k-A). |

### Quests / PYOA

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Quest end-state check (`questCompletionSchema` `checkQuestTerminalState` etc.) | 27w check that a finished quest is really in a finished state. | No. `questGuards.applyQuestCompleteGuard` (shortlisted) covers the real risk. | REMOVE the uncalled checks — safe; superseded by the quest-complete guard. **DONE** — removed `checkQuestTerminalState`, `buildQuestCompletion`, `formatQuestCompletionNarrative`, `buildCrisisFork` / `CrisisBranch`, `trackQuestMetrics` / `QuestTelemetry`; kept `buildQuestSchema` / `needsQuestOption` / `formatQuestPressureMandate`. |
| Milestone mandate line (`spineMapRegistry.formatMilestoneMandate`) | Writes "MILESTONE DUE / OVERDUE" into the writer prompt. | No. Milestones are committed by the engine, and the packet diet removed mandate lines. | REMOVE — safe; only reached by scripts. **DONE** |
| PYOA ending gates (`pyoaEndingGates`) | Ending catalog with prerequisites, priority pick, and a turn-150 deadline. | Unclear. Umbra plays a compiled book with ending chips; Thornferry has 4 ending leaves on `pyoaSpine`; other PYOA books have neither. | JOHN DECIDES — will every PYOA book become a compiled chip book, or do AI-prose PYOA books need gated endings? **SKIPPED** (John decides; not in 28k-A). |
| PYOA crisis catalogs (`pyoaCrisisRegistry`, `pyoaCatalogLoader`) | Catalogs of PYOA crises per book. | Only as content. No live code reads them. | JOHN DECIDES — is this catalog the content source for future PYOA book compiles, or can it go? **DONE** — John kept it: moved both modules plus their only data (`src/game/data/pyoa/*.json`) to `docs/archive/pyoa-crisis-catalogs/` with a README; no build imports remain. |
| Delayed consequence builders (`pyoaDelayedConsequences` `create*Consequence` / `cancelConsequence`) | Creates "echo / return / reckoning" consequences that fire later. | No. Nothing creates them, and compiled books write consequences into the pages. | REMOVE the constructors — safe; keep the live part of the module. **DONE** — removed `createEcho/Return/ReckoningConsequence` + `cancelConsequence`; schedule / due / deliver / situation / journal / ending parts kept. |
| Branch convergence detector (`pyoaConvergence`) | Detects when branches rejoin. | No. | REMOVE — safe, test-only; superseded by `pyoaSpine`. **DONE** |
| Replay / speedrun scaffolding (`pyoaReplay`) | Replays a PYOA run. | No. | REMOVE — safe, test-only. **DONE** |
| Version 2 branch ledger + consequences (`pyoaBranchLedgerV2`, `pyoaDelayedConsequencesV2`) | WS-5 rewrites of the branch ledger. | No. Version 1 `pyoaBranchLedger` is live; V2 needs the unlisted `nanoid`. | REMOVE — safe; superseded by V1. **DONE** (plus its only test, `playtest30bWave1.test.ts`). |
| Pre-turn coordinator (`packageCoordination` + `exclusiveFactsRegistry` + `receiptLedger`) | WS-2/4/5 orchestrator that was meant to commit facts before the writer. | No. `arcDirector` does pre-writer commits. | REMOVE — safe, test-only; `exclusiveFactsRegistry` has a broken import. **DONE** (plus its only test, `playtest31aCoordination.test.ts`). |

### UI / art

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Stripe checkout on the client (`game/stripeCheckout.ts`) | Buy button → Stripe checkout → entitlement sync. | Only when payments launch. | JOHN DECIDES — is Stripe still the web payment path for capacity packs, or will packs go through a store billing path instead? **SKIPPED** (John decides; Stripe untouched). |
| Comic Director (`services/llmDirectorService.ts`) | Asks a model to script multi-panel comic pages. | No while Director is off; Comic-lite single plates are the live path. | JOHN DECIDES — are multi-panel Director comics ever coming back, or is single-plate Comic-lite final? **SKIPPED** (John decides; comic director untouched). |
| Old image call (`imageGen.generateImage`) | Legacy browser-side image request. | No. Hosted art goes through the `generate-image` edge function. | REMOVE `generateImage` only — safe; keep `softenPrompt` / `ImageModerationError`, which `useGame` imports. **DONE** (its private prompt helpers went with it). |
| Recent-choice window (`game/choiceTracking.ts`) | Remembers the last 10 choices. | No. Anti-circling lives in `choiceCompiler` semantic cooldown + `graphChoices`. | REMOVE — safe; superseded by the chip cooldown. **DONE** |
| Comic page bake (`comicPageCompositor.bakeComicPageSnapshot`) | Flattens a comic page into one image. | No. | REMOVE — safe, no callers. **DONE** |
| Old transcript download (`playTranscript.downloadPlayTranscript`) | Earlier play-transcript download. | No, if Settings "Download play" uses the dump export as the audit says. | REMOVE — safe once the Settings button is confirmed on the dump export (file is excluded from agent reads, so not opened here). **SKIPPED** — Settings "Download play" is confirmed on the dump export (`handleDownloadTranscript` → `downloadPlayDump`), but `playTranscript.ts` is blocked for agent read/edit; delete `downloadPlayTranscript` by hand. |
| Grammar fixer (`grammarCheck`) | Sends writer text to LanguageTool for fixes. | No. Prose fixes are deterministic in `proseWarden`. | REMOVE — safe, test-only. **SKIPPED** — live caller: `warden.ts` → `applyProseWardenAsync` → `import('./grammarCheck')` (src + edge `proseWarden`). |
| Day-1 narrator stub (`narratorProvider`) | Early placeholder narrator. | No. | REMOVE — safe, test-only. **DONE** |

### Edge functions

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Stripe checkout + webhook endpoints (`create-checkout`, `stripe-webhook`) | Server side of Stripe payments. | Only when payments launch. | JOHN DECIDES — same question as the client Stripe checkout: keep for launch, or drop for store billing? **SKIPPED** (John decides; Stripe untouched). |

### Other

| Item | What it does / was meant for | Does the game need it? | Recommendation |
|---|---|---|---|
| Research code pastes (`docs/research/**`) | Manus/Gemini prototypes kept as reference. | Not as code. | REMOVE from the audit scope — add to knip `ignore`; keep the files as docs. **DONE** — new `knip.json` ignores `docs/research/**` and `docs/archive/**`; files kept. |
| One-off probes (`scripts/tmp-*`, `scripts/_probe/*`, `_tmp-*`, `_dbg-*`, `_longrun-*`) | Throwaway debugging scripts. | No. | REMOVE — safe, no npm script uses them. **DONE** (`scripts/tmp-*`, `scripts/_probe/`, `ai-player-browser/_tmp-*`, `fate-autoplay/_dbg-*` / `_longrun-*`). |
| Old batch runners (`run0*FourModeT50.ts`, `write-02*-owner-map.mjs`, old paste writers) | Scripts for past test batches. | No. Their runs and pastes are already on disk. | REMOVE — safe; `run.ts` is the live harness. **DONE** — removed `run0*FourModeT50.ts`, `write-02u/02v-owner-map.mjs`, and unreferenced paste writers (`generate-gemini-paste-z1.mjs`, `generate-paste-packs.ts/.mjs`, `writeGeminiPastePacks.ts`). Kept `writeGeminiPastes.ts` / `exportOpeningStitchPaste.ts` (npm) and `collectOvernightPastes.mjs` (still called). The old `start-*-4xt50.ps1` / `rrr-02u/02v` launchers were left and now point at deleted runners. |
| Old prompt formatters (`worldSim.formatWorldLedgerForPrompt`, `sceneFacts.formatSceneFactsForPrompt`) | Wrote world and scene facts into the prompt. | No. | REMOVE — safe; replaced by SNAPSHOT / packet diet. **DONE** (`sceneFacts` edge copy too). |
| Scored memory retrieval (`campaignMemory.retrieveMemoriesSmartly`) | Async ranked pick of old memories for the prompt. | No. The live keyword retrieve + SNAPSHOT (25b) is enough, and an async scorer adds wait time on Free. | REMOVE — safe; superseded by the live retrieve. **DONE** (src + edge copy). |
| Open-obligation turn block (`intentContract.checkUnresolvedObligations`) | Would block a turn while the writer owes the player an answer. | No. Blocking a send conflicts with the always-respond / lost-send rules; obligations already drive a retry. | REMOVE — safe; superseded by the obligation retry. **DONE** |
| Unused exported types (127) | Type exports nobody imports. | No. | REMOVE — harmless cleanup. **SKIPPED** — not marked safe, and the 127 are not listed here. |
| Duplicate exports (`memorableMoments` caps, `NPC_ROLE_REGISTRY` = `ROLE_OBLIGATIONS`) | Second names for the same value. | No. | REMOVE the aliases — safe cleanup. **DONE (partial)** — removed `FIRST_SESSION_SOFT_CAP` / `SESSION_SOFT_CAP`; `ROLE_OBLIGATIONS` SKIPPED (live caller `npcLifecycleFsm`). |
| Broken import paths (`exclusiveFactsRegistry`, `playtest31aCoordination.test`, WOF paste test) | Point at a sibling `./crossPackageContracts` that does not exist (the real file is `src/game/types/crossPackageContracts.ts`). | No. | REMOVE together with the pre-turn coordinator; ignore the WOF paste test in knip. **DONE** (both `src/game` files deleted; WOF paste test covered by the `docs/research/**` knip ignore). |

**Counts: WIRE IN 1, REMOVE 34, JOHN DECIDES 7.**

28k removals: done 33, skipped 9
