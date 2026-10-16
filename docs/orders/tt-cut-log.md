# tt-cut log — every deleted regex, list, function, module and field

Every item below can be restored with git.

- **q31-P3:** deleted in the q31-P3 commit (stamp `2026-10-15q`). The old text lives at its parent, **`12726bad`**. Line numbers in that section are at `12726bad`.
- **q31-DC1:** deleted in the q31-DC1 commit (stamp `2026-10-15o`). The old text lives at its parent, **`eeba53ad`**. Restore one file with `git show eeba53ad:<path> > <path>`. Line numbers in that section are at `eeba53ad`.
- **tt-fix-15:** deleted in the tt-fix-15 commit (stamp `2026-10-15b`). The old text lives at its parent, **`ca67deec`**. Line numbers in that section are at `ca67deec`.
- **tt-fix-13:** deleted in the tt-fix-13 commit (stamp `2026-10-14z`). The old text lives at its parent, **`16ef28f5`**. Line numbers in that section are at `16ef28f5`.
- **tt-fix-12:** deleted in the tt-fix-12 commit (stamp `2026-10-14y`). The old text lives at its parent, **`38ce08f0`**. Line numbers in that section are at `38ce08f0`.
- **tt-fix-11:** deleted in the tt-fix-11 commit (stamp `2026-10-14x`). The old text lives at its parent, **`0339063c`**. Line numbers in that section are at `0339063c`.
- **tt-library-2:** deleted in the tt-library-2 commit (stamp `2026-10-14w`). The old text lives at its parent, **`a76a19d6`**. Line numbers in that section are at `a76a19d6`.
- **tt-fix-10:** deleted in the tt-fix-10 commit (stamp `2026-10-14v`). The old text lives at its parent, **`6869ec1b`**. Line numbers in that section are at `6869ec1b`.
- **tt-fix-9:** deleted in the tt-fix-9 commit (stamp `2026-10-14u`). The old text lives at its parent, **`68d01a47`**. Line numbers in that section are at `68d01a47`.
- **tt-fix-8:** deleted in commit `8a55f995` (stamp `2026-10-14t`). The old text lives at its parent, **`e8c0e072`**. Line numbers in that section are at `e8c0e072`.
- **tt-cut 2:** deleted in commit `cd2b8724` (stamp `2026-10-14s`). The old text lives at its parent, **`0e2419cb`**. Restore one file with `git show 0e2419cb:<path> > <path>`, or one item by copying its lines from that output. Line numbers below are the line numbers at `0e2419cb`.
- **tt-cut 1:** deleted in commit `1f50ec5c` (stamp `2026-10-14r`). The old text lives at its parent, **`56c53ce5`**. Line numbers in that section are at `56c53ce5`.

A "swap" entry means the local copy was deleted and the call now uses the shared helper with the same body (`engineFactPatterns.escRe` = `s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`; `engineFactPatterns.narrationOf` = `(s ?? '').replace(/["“][^"”]*["”]/g, ' ')`). Behaviour is identical, so restoring a swap is only needed if the shared helper changes.

---

## q31-M2 scene writer view + repeat gate (Order M part 2, steps 3–4)

1. **`src/game/places.ts` (+ edge mirror) `formatPlacesForPrompt`** — built a short place list for a prompt. No production caller (CARD-STORE-PLAN already named it for deletion). Cut so SCENE helpers do not raise the function count.
2. **Essay JSDoc / section preamble trim** in `contentDensity.ts`, `exhaustionCurve.ts`, `densityValidation.ts`, `encounterDensity.ts`, `npcCrossIntegration.ts`, `npcMemoryRetrieval.ts`, `socialCrisis.ts`, `intentEnums.ts`, `discoveryXpLedger.ts`. Comment only. Cut so SCENE source does not raise the line count.
3. **ALREADY ON THE PAGE emission** in `formatWriterFacingEvent` (`completedEventPacket.ts`) — opener list on the writer prompt when `infoSheet` is present. Replaced by INFO SHEET `SCENE:` (Order M step 3). `pageOpeners()` kept for same-action tracking / tests.

---

## q31-M1 scene ledger (Order M part 1, steps 1–2)

1. **`src/game/campaignBibleTypes.ts`** — a one-line re-export of `CampaignBible` / `MysteryCulprit`. Callers (`types.ts`, `mysteryCulprit.ts`, `openingPin.ts`, `campaignContract.ts`) import `@/data/campaigns/types`. The edge already had its own `campaignBibleTypes.ts` from that data file. Cut so the new ledger file does not raise the file count.
2. **`src/game/evalHarness.ts` `isNpcLifecyclePhase`** — a stub that nothing called, plus its six-name phase list. Cut so the ledger function does not raise the function or list count.
3. **Section bars `// ====`** in `npcMemoryLedger.ts`, `contentDensity.ts`, `exhaustionCurve.ts`, `densityValidation.ts`, `encounterDensity.ts`, `npcCrossIntegration.ts`, `types/crossPackageContracts.ts`, `pyoaEndingGates.ts`, `pyoaDelayedConsequences.ts`, `socialCrisis.ts`, `socialCrisisTypes.ts`, `pyoaExclusiveFacts.ts`, `socialSkills.ts`, `encounterBiomeMatrix.ts`, `npcMemoryRetrieval.ts`, `intentEnums.ts`, `spineMapRegistry.ts`. Comment separators only. Cut so the ledger source does not raise the line count.

---

## q31-P2 handedRefs / repeated-habit masks (Order P-2)

1. **`src/game/turnCheck.ts` handmade `masks` array (location, character name, npcMemories, hubs, `routeNames`)** — what it did: masked only those strings before the repeated-habit 5-gram compare, so REF ENUM group/meeting/prop labels ("the two drowned rite novices") still flagged as habits. Replaced by `handedRefs(before|after)` (one list next to `compileRefEnum`).
2. **`scripts/factCheck.mjs` `handedPeople` body** — kept as the script-side people slice of the same label rule (`note` before `;`); no second parallel people checker. Cannot import the TS packet builder from Node without a no-dep module; the game list is `handedRefs`.
3. **Comment / essay trim (ruleCount budget):** `forwardProgressGovernor.ts` file essay and end-of-line comments; `typedEntityValidator.ts` block/line comments. Behaviour unchanged.

---

## q31-ECR2 attunement (Order E-CR / Spec E-CR2)

1. **`src/game/tabletop/downtimeTurn.ts` `ATTUNE` / `END_ATTUNE` regexes** — whole-line phrase matchers for attune/end. What they did: keyed the path off wording, not intent + carried magic item. Replaced by `parsePlayerIntent` (`attune` → `use_item`) + `findAttuneTarget` (longest carried magic name in the line) and end/break/drop + `attunement` string gate.
2. **`src/game/sealedManifest.ts` `isEngineRecoveryProse`** — recovery-phrase detector used only from `playTranscript`. Folded the recovery phrases into `isBannedFallbackStub` (one stub gate); `playTranscript` drops the second call. Cut for ruleCount budget.
3. **`src/game/discoveryXpLedger.ts` `calculateInspectXpShare` / `checkLevelingPace` / `trackDiscoveryXpMetrics` (+ `DiscoveryXpTelemetry`)** — telemetry helpers with no production caller. Cut for ruleCount budget.
4. **`src/game/inventoryConservation.ts` unused types / essay preamble** — `ItemStateTransition`, `TransitionKind`, and the P0.4 essay header. Behaviour of `buildInventoryAuthority` / `validateInventoryChanges` unchanged (compacted).

---

## q31-ECR1 crafting (Order E-CR / Spec E-CR1)

1. **`src/game/tabletop/downtimeTurn.ts` `CRAFT` regex** — verb list (`craft|forge|brew|scribe|make|…`) that keyed the craft path. What it did: recipe choice followed the verb, not the item. Replaced by make-action string gate + `craftItemFromInput` → `craftRecipe(item)` (item name is the key). Rest intent (`Make camp`) still skips craft via `parsePlayerIntent`.
2. **`supabase/functions/_shared/gm/comicScript.ts`** — full edge copy of `src/types/comicScript.ts`. Edge `types.ts` only needed the `ComicTextAnchor` union; the module had no other edge importer. Inlined the union into edge `types.ts`, removed from `scripts/sync-gm-edge-shared.mjs` so sync does not restore it (ruleCount budget).
3. **`src/game/optionDiversityContract.ts` `getBaseCooldown`** — folded into `updateCooldowns` (same stall/explore/default numbers). Cooldown helpers compacted; behaviour unchanged.

---

## q31-ECA companion approval (Order E-CA / Spec E-CA)

1. **`src/game/rules/companions.ts` `approvalEvent` stance path** — `detectStanceTreatment(input)` plus companion/other name substring plus `/\b(?:steal|rob)\b/i`. What it did: scored approval from the player's wording before any engine outcome. Replaced by `ApprovalInput = { intent, outcome }` (`parsePlayerIntent` + `ApprovalOutcome`: harmed / helped / takenFrom / wonFight / fightFoes). First-match map: harmCompanion → harmOther → kindCompanion → kindOther → foughtTogether. Import of `detectStanceTreatment` removed from this file (faction standings still use it elsewhere).
2. **`src/game/optionDiversityContract.ts` comment / blank padding only** — preamble essay and per-export JSDoc blocks trimmed so ruleCount TOTAL lines do not rise with E-CA. Behaviour unchanged.

---

## q31-O1C cleared sites (Order O1-C + L2)

1. **Legacy auto-close discard in `dungeonLifecycle.maybeAutoCloseDungeon` / `closeDungeon`** — when all foes were down, non-card interiors called `closeDungeon` and dropped the layout (no `dungeonCard` / no deltas). What it did: a cleared cave/ruin could not be re-entered with the same map; chests reseeding on a later open enabled L2-style loot farms. Replaced by `condenseClearedSite` → `clearedSites[site]` (map as walked + left/moved/taken deltas) and foe-stripped park on the place; card sites mark `cleared` in place and write the same record on `parkDungeonCard`.
2. **`supabase/functions/_shared/gm/entityCast.ts`** — full edge copy with no importer under `supabase/functions` (client `src/game/entityCast.ts` kept for tests). Cut so ruleCount TOTAL does not rise with O1-C. Removed from `scripts/sync-gm-edge-shared.mjs` so sync does not restore it.
3. **`supabase/functions/_shared/gm/loiterDeltaDirective.ts`** — full edge copy with no importer under `supabase/functions` (client file kept; only tests import it). Cut for the same budget.

---

## q31-CR1 camp robbing (Order CR-1)

1. **`src/game/typedEntityValidator.ts` `assertProtectedEntitiesSurvived` / `trackValidationMetrics` / `calculateValidationScore` / `EntityValidationTelemetry`** — telemetry helpers with no production caller. Cut so ruleCount TOTAL does not rise with CR-1.
2. **`src/game/optionDiversityContract.ts` `buildDiversityRetryBlock` / `trackDiversityMetrics` / `DiversityTelemetry`** — unused retry/telemetry exports. Cut for the same budget.
3. **`src/game/metaInputRecovery.ts` `checkSentenceNovelty` / `banExpositionTopic` / `isTopicBanned` / `buildNoveltyRetryBlock` / `trackMetaRecoveryMetrics` / `MetaRecoveryTelemetry`** — unused novelty/ban/telemetry exports (`checkParagraphNovelty` + `updateNoveltyBudget` kept). Cut for the same budget.
4. **`src/game/forwardProgressGovernor.ts` (+ edge stub) `checkProgressGovernor`** — mandate builder with no production caller (`updateProgressGovernor` / `hasActiveObjectives` kept). Cut for the same budget.

---

## q31-RCHF1 one offered list (Order RC-HF1)

1. **`src/game/fateAutoplay.ts` `systemPad` branch in `headlessFateTurn` (lines ~1085–1090 at parent)** — `systemPad = systemPromptPad(...)?.chips ?? originPad(state)`; when set, Fate picked from that list only and ignored `resolveOfferedChoices`. What it did: forced "Open the Bronze Reward Box" (and class chips) outside the offered pad list for every turn a System row was open (lap 28 C T19–T21 mash). Replaced by folding prompt-row chips into `resolveOfferedChoices` / `commitOfferedPad` via `promptRowChips` + `withPromptRowChips` (same list Fate and the UI use). Imports of `classOfferPad` / `originPad` / `systemPromptPad` in fateAutoplay removed with the branch.

---

## q31-RCAR1 present means backed (Order RC-AR1)

1. **`src/game/npcSheet.ts` `ensureNpcSheet` copy-on-create of `motiveLines` (lines ~200–201 / fresh record field at parent)** — wrote `motiveLinesFor(sheet.motive)` onto every new sheeted memory. What it did: a second copy of the same lines that townsfolk (`townsfolk.ts`) never wrote, so presence (sheet) and backing (`motiveLines`) diverged. Replaced by `motiveLinesOf` deriving from `memory.sheet` at read time.
2. **`src/game/npcSheet.ts` `withMotiveLines` load-time patch for sheeted people (lines ~274–277 at parent)** — on load, rewrote `motiveLines` from the sheet for anyone with a sheet. Superseded by the same derive-at-read rule; load now only seeds bible roster / authored rows that have no sheet and no lines.
3. **`src/game/writerTurn.ts` bug label `'nothing on record for anyone here'`** — renamed to `` `no backed line for ${here.join(', ')}` `` (data-error only once presence implies sheet backing).

---

## q31-RCK1 only bound chips (Order RC-K1)

1. **`src/game/choicePipeline.ts` `isLegalEnginePad` inferIntent fallback + travel/talk regex + `concreteChoiceObjects` length test (lines ~395-400 at parent)** — admitted a chip when a label-word reader said it was not OTHER, or when it named no concrete object. What it did: let unbound writer/spine labels ("Rob the traveler", "Map the first undercroft door") onto the offered list with no engine action. Replaced by builder `EngineChip { label, action }` membership / same-action+target bind only (`engineChips` + `boundEngineChip`).
2. **`src/game/choiceWarden.ts` `CONTEXT_REQUIREMENTS` + `choiceInventsContext` (lines ~24-128 at parent)** — default-allow invent filter for offered chips. Superseded by binding: offered list = engine chips only.
3. **`src/game/choiceWarden.ts` empty-research loot invite regex filter (lines ~230-240 at parent)** — word list that dropped "hidden compartment" pads after empty search. Superseded by binding (those labels never bind unless a builder emits them).
4. **`src/game/choiceWarden.ts` local `engineChips` exact-label Set (spine / dungeon card / opening / story RPG / tabletop)** — duplicate membership list before the invent filter. Folded into `engineChips()` in `choicePipeline` (same sources + system prompt + journey pads).

---

## q31-RCR1 fight-close outside prose (Order RC-R1)

1. **`src/game/beatCommitGate.ts` `withMissingFightFacts` outcome term + `prose.includes(outcome)` (lines ~241-245 at parent)** — appended `terminalOutcomeSentence` into the writer's beat when the prose lacked that exact string. What it did: said the kill twice whenever the writer already told it in other words (RC-1 leftover). Replaced by the same sentence on the engine combat-log / STATUS channel (`WriterTurnResult.combatLog` + `outcomeShown: 'engine'`). Forced-attempt and foe-hit gaps stay.
2. **`src/game/writerTurn.ts` comment at `runWriterTurnFightOnly` ("closes every settled fight beat")** — claimed the engine outcome sentence closed the prose beat. Replaced by the combat-log path above.
3. **`src/game/sealedManifest.ts` `ManifestValidationResult` + `validateProseAgainstManifest` (lines 164–277 at parent)** — B027 prose-vs-manifest word scan with no production caller (tests only). Hook contradictions stay on `hookLock.detectHookContradiction`; defeat/quest closed facts stay on the commit gate. Cut so ruleCount TOTAL does not rise with RC-R1. Tests that pinned it: `playtest30bWave3` B027 block deleted; `playtest31aHookLock` uses `detectHookContradiction` directly.

---

## q31-LK1 locks and alarms

1. **`src/game/combatResolution.ts`** — whole module. Only imported (unused) from `useGame.ts` after 28f moved combat to `engineFight`; no other caller. Restore from parent of the q31-LK1 commit.
2. **`src/game/stripeCheckout.ts`** — whole module. No remaining imports under `src` / `supabase` / `scripts`. Restore from parent of the q31-LK1 commit.
3. **`src/game/npcLifecycleFsm.ts` (+ edge mirror) `getActiveLifecycles` / `buildLifecycleSituationSection`** — `.filter` / `.map` arrow bodies rewritten as `for` loops (same behaviour) so ruleCount TOTAL fns do not rise with LK-1.

---

## q31-SK5 skill XP / named tiers

1. **`src/game/rules/librarySkills.ts` `USES_FOR_RANK` and `rankForUses`** — old use-count → rank 1..3 thresholds (`[0,2,5,9]`). Replaced by skill XP + level in `skillGrowth.ts` (`migrateNamedSkill` / `OLD_RANK_TO_LEVEL`). Library prerequisite text still uses `NAMED_SKILL_RANK_CAP = 3`; evolution fires at `NAMED_SKILL_EVOLVE_LEVEL = 50`.
2. **`src/game/npcLifecycleFsm.ts` (+ edge mirror)** — unused exports with no caller: `getOrCreateLifecycle`, `transformNpcRole`, `forceNpcExit`, `getExitWindowLifecycles`, `getApproachingDeadlines`, `shouldNpcExit`, `getLifecycle`, `formatLifecycleMandates`. Cut to keep ruleCount TOTAL from rising. `updateNpcLifecycle` / `seedPresentNpcLifecycles` / `buildLifecycleSituationSection` kept.

---

## q31-SK4 check resolution per mode

1. **`src/game/checkMath.ts` `codeResolutionText`** — the literal word `mod` in `d20 N + mod M = T vs DC D` (SUCCESS/FAILURE wrappers). Replaced by `d20 N + M = T vs DC D` so the receipt matches SK4-a. Restore by putting `mod ` back after `+ `.
2. No parallel checker added. LitRPG/RPG untrained long-shot and tier retarget live on the existing `runPlayerCheck` path; tabletop lock proficiency reads Thieves' Tools via `toolProficiencies` instead of inventing a second check module.

---

## q31-DC1 dead-code clean-up (restore from `eeba53ad`)

How each was proven dead: `git grep -w <module>` over `src`, `supabase`, `scripts`, `index.html`, `vite.config.ts`, `vitest.config.ts` and `package.json`; then a search for dynamic `import(` / by-path reads / name lookups. The only by-path read found was `trainingSetup.test.ts:35` (reads `src/services/llmDirectorService.ts`), and that module was kept (comic code). No edge file names any of the edge mirrors below (the edge imports are `'./<name>.ts'`, which `-w` matches), and `node scripts/sync-gm-edge-shared.mjs --check` reports "edge copies match" afterwards.

### A. Dead modules (whole files)

1. **`src/game/situationPacket.ts`** (592 lines). First line: `import type { FactionStanding, GameState, PowerScaling, SituationPacket, WorldLedger } from './types';`. What it did: the old SNAPSHOT writer packet (`effectivePowerScaling`, `buildSituationPacket`, `formatSceneSnapshotForPrompt`, `formatSituationForPrompt`, `formatCampaignRails`, `formatFullMemoryBlock`). Safe because no app, script or edge code imported it; only 21 test files did. The writer is handed `completedEventPacket` + the info sheet (`formatWriterFacingPacket` / `buildContextPrompt`).
2. **`supabase/functions/_shared/gm/situationPacket.ts`** (591 lines). Edge copy of 1. Safe because `gm-turn` and every other edge file never imported it (git grep: 0 hits under `supabase/functions`).
3. **`src/game/dailyMilestoneLedger.ts`** (55 lines). First line: `/** B045 — Daily milestone XP: +20 on first real quest objective tick per UTC day (LitRPG retention).` What it did: `DAILY_QUEST_MILESTONE_XP` (already `0`) and `applyDailyQuestMilestone` (already returned `null`: `DAILY_XP_RETIRED = true`). Safe because only 2 tests imported it; the daily bonus was retired in 28a and `FAST_XP_AWARDS.dailyFirstTick` (0) still pins that.

### B. Edge mirrors no edge code imports (the `src/game` originals are live and stay)

4. **`supabase/functions/_shared/gm/bindingConstraints.ts`** (415 lines). First line: `/** Binding constraints builder for LLM prompt.` Its only reader on the client is `warden.ts`, which does not run on the edge.
5. **`supabase/functions/_shared/gm/dungeonLifecycle.ts`** (157 lines). First line: `/** 29e — Dungeon generate / close lifecycle.`
6. **`supabase/functions/_shared/gm/intentEnums.ts`** (362 lines). First line: `/** Batch Y Milestone 1 — Intent Enums`. It was not on the sync list either (a leftover copy).
7. **`supabase/functions/_shared/gm/presentAuthority.ts`** (150 lines). First line: `/** Lock C — location-bound present[] trim on real travel.`
8. **`supabase/functions/_shared/gm/proseWarden.ts`** (1658 lines). First line: `/** Cheap post-writer English / UI-leak pass. Not a second model.` (LT-off's edge step for this file ends here.)
9. **`supabase/functions/_shared/gm/sceneManifest.ts`** (219 lines). First line: `/** Scene Manifest — reserved high-priority authority for the current scene.`

Each was safe because no file under `supabase/functions` imports it; it was only rewritten by the sync script.

10. **`scripts/sync-gm-edge-shared.mjs`** lines 22 `'situationPacket.ts',`, 24 `'bindingConstraints.ts',`, 39 `'sceneManifest.ts',`, 78 `'proseWarden.ts',`, 79 `'dungeonLifecycle.ts',`, 88 `'presentAuthority.ts',`, and lines 154-162, the `if (file === 'situationPacket.ts') { … }` rewrite (it dropped the `sandboxXp` import and inlined a look/wait regex for the edge copy). What they did: copied the files above to the edge. Safe because the edge copies are gone and nothing imports them. Line 4's usage example `situationPacket.ts writerInfoLayer.ts` now reads `completedEventPacket.ts writerInfoLayer.ts`. To restore one mirror, put its name back in `FILES` and re-run the sync.

### C. Stale tests of the dead modules (assertions on the dead packet text only; every live call in the same test stays)

11. `src/game/actionValidation.test.ts` line 14 (import), lines 177-184 (the `formatSituationForPrompt(interiorState)` asserts at the end of "lists interior exits and crowd binding"; the binding-constraint asserts stay), lines 188-213 (`describe('snapshot packet uniqueness')`).
12. `src/game/playtest02dHangDebug.test.ts` line 19 (import), lines 135-137 (`snap` CAST asserts); title at 130 drops "+ snapshot".
13. `src/game/playtest02nBatch02n.test.ts` lines 11-14 (import), lines 67-88 ("SNAPSHOT and situation packet drop LAST PAD, CRAFT, clerk license, duplicate PROSE LICENSE"). Replaced by a test that keeps its live checks (`lastOfferedChoiceSets`, `compileCraftRules(...).replacedModeLine`, `formatCraftSnapshotLines(...) == []`).
14. `src/game/playtest02zBatch02z.test.ts` line 21 (import), line 147 (`const memory = formatFullMemoryBlock(state);`) and `memory` in the line 149 loop list.
15. `src/game/playtest08aRetrospectiveNarrator.test.ts` line 15 (import), line 117 (`memory`) and `memory` in the line 120 loop list.
16. `src/game/playtest26uQualityGates.test.ts` line 17 (import), lines 132-163 ("SNAPSHOT includes quest focus + stagnation + dry-wit voice check").
17. `src/game/playtest27wQualityGovernance.test.ts` line 9 (import), lines 65-66 (`snap` asserts); `buildGovernanceSnapshotLines` asserts stay; title at 59 now says "governance lines".
18. `src/game/playtest29dGeminiCalibrated.test.ts` line 11 (import), lines 35-44 ("SNAPSHOT includes PROSE LICENSE and single AUTHORITY").
19. `src/game/playtest29eWorldMapOverhaul.test.ts` line 20 (import), lines 141-142 (`formatSituationForPrompt` asserts); the `formatWorldMapAuthorityBlock` asserts stay; title at 135 renamed.
20. `src/game/playtest30rAntiRepeat.test.ts` line 12 (import), lines 89-95 (state + SNAPSHOT recycle assert); the four `formatFluidProseRailsForPrompt` NO RECYCLE asserts stay; title at 88 renamed.
21. `src/game/playtest30sStoryCraft.test.ts` lines 2 and 6 (imports), lines 34-37 and 47-49 (state/`snap` and its MODE AUTHORITY / GOLD SHAPE asserts), lines 58-66 ("does not restack the shared recycle rule", SNAPSHOT only).
22. `src/game/playtest30xCrowdAuthority.test.ts` line 18 (import), lines 165-174 ("SNAPSHOT Crowd line is mode-agnostic and uses the locked count").
23. `src/game/playtest30yChromePerson.test.ts` line 16 (import), lines 181-184 (`snap` asserts); the art-lock asserts stay; title at 179 renamed.
24. `src/game/playtest31aHookLock.test.ts` line 18 (import), lines 127-128 (`snap` HOOK WHY assert); the `applyCommittedNarrative` / sealed-manifest asserts stay; title at 122 renamed.
25. `src/game/playtest31cJosieAuthority.test.ts` line 10 (import), lines 195-210 (faction state + `formatSituationForPrompt` asserts); the `factionNoteForHook` assert stays; title at 194 renamed.
26. `src/game/playtest31eNameAtmosphere.test.ts` line 11 (import), lines 118-124 ("SNAPSHOT asks for a beat delta after look-around").
27. `src/game/playtest31fMapAutofight.test.ts` line 14 (import), lines 121-123 (`snap` Last-kill asserts); the `commitAutoFightLedger` lastKill asserts stay; title at 96 renamed.
28. `src/game/playtest31gCraftBook.test.ts` lines 9-10 (imports), lines 41-43 (`countCraftLines` helper), the `snap` asserts at 69-72, 84-87, 93-96, 102-104, 109-111 and 127. Every `compileCraftRules` assert stays; `formatCraftSnapshotLines(...) == []` now stands in for the "no CRAFT line" checks.
29. `src/game/playtest31jCriticBatchCD.test.ts` line 28 (import), lines 179-180 (`snap` vignette assert); the vignette-binding and hub-prompt asserts stay; title at 153 renamed.
30. `src/game/playtest31lOpeningAuthority.test.ts` line 25 (import), lines 77-80 (`snap` POINTER CARD asserts); `formatPointerCardForSnapshot` keeps its own test at 269.
31. `src/game/simulationistSandbox.test.ts` line 6 (import), lines 50-93 ("formatSituationForPrompt includes ZONE THREAT / FACTION / POWER SCALING when set" and "formatSituation always includes effective POWER SCALING").
32. `src/game/playtest28bManusSlice.test.ts` line 9 (import), lines 74-167 (two `it.skip` B045 daily milestone tests, already skipped since 28a).
33. `src/game/xpFix14a.test.ts` line 12 (import), lines 101 and 103-108 (`DAILY_QUEST_MILESTONE_XP` and `applyDailyQuestMilestone` asserts); `FAST_XP_AWARDS.dailyFirstTick === 0` stays.

### Looked at and kept

- `src/services/llmDirectorService.ts` is the comic "Graphic Novel Director" (`generatePanelScript` → `ComicPanelScript`). John's rule keeps comic code. `trainingSetup.test.ts:35` also reads it by path.
- `comicPageCompositor.bakeComicPageSnapshot`: comic, kept.
- `playTranscript.downloadPlayTranscript` (`src/game/playTranscript.ts:547-549`, definition only, 0 callers): not deleted. The new `.cursorignore` pattern `**/*transcript*` (15 Oct 13:05) blocks the agent from that source file. Left for a session where that file is readable.
- Order C's other exports (`defaultAtlasForMode`, `sheetFromPlace`, `validateEncounterResolution`, `formatEncounterAftermath`, `formatCombatTelegraph`, `itemLooksLikeWeapon`, `formatWorldLedgerForPrompt`, `formatSceneFactsForPrompt`): already gone (`4cf74818`, 28k). Nothing to cut.
- Order D (move test helpers): not done this session. It is a move, not a deletion; `src/test/pinDice.setup.ts` is already in a test folder.
- Stripe, ads, parent gate, cosmetic entitlements, comic overlay / compositor / CBZ: parked, kept.

---

## tt-fix-15 (restore from `ca67deec`)

1. **`src/game/writerTurn.ts` lines 530-536 and 562-566**: `const destination = [...]`, `const namesDestination = (s) => ...`, `const event = thisTurnsEventCheck(check, refEnumOf(check.state, packet))`, `const only = (has) => (s, draft) => ...`, `const onlyDestination = only(namesDestination)`, `const onlyEvent = only(event)` and `const keep = unchanged || (!ok && !/@t\d+\b/.test(f.sentence) && onlyEvent(f.sentence, prose)) || (!ok && f.flag === RECORD_READOUT && onlyDestination(f.sentence, prose));` in `repairRejectedSentences`. What they did: kept a flagged sentence on the page when its repair failed or came back unchanged, if it was the only sentence telling this turn's event or naming the destination. Removed by order item 2 (whatever still fails leaves the page). `withMoveDestination` still adds the plain destination sentence when the beat no longer names it. Line 24's `RECORD_READOUT` import went with it.
2. **`src/game/writerTurn.ts` lines 458-460**: `function sentencePattern(sentence: string): RegExp { return new RegExp(sentence.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')); }`. Single use; folded into `replaceDraftSentence` as `new RegExp(sentence.trim().split(/\s+/).map(escRe).join('\\s+'))`.
3. **`src/game/writerTurn.ts` line 292 (swap)**: `const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` in `speakerHere`. Swapped to `escRe`. The inline escapes at lines 357, 422 and 658 are swapped the same way. The `escRe` import is new at line 25.
4. **`src/game/tokenProse.ts` lines 433, 487, 491, 566, 682, 710, 854 (swap)**: seven inline `x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` copies. Swapped to `escRe(x)`, which the file already imported.
5. **`src/game/engineFactPatterns.ts` lines 33-36**: `export function factHasTimeRecord(engineResult)`, which returned whether the time/travel record regex matched the engine result. It had one caller (`travelRecordRead`, same file), so the regex now sits inline there with the same text.
6. **`src/game/engineFactGate.ts` lines 72-75**: `export function rollContradictionProblem(state, sentence) { return rollContradiction(sentence, pcSubject(state), engineFact(state)) ? ROLL_CONTRADICTION : null; }`. It had one caller (`engineFactProblems`), so the expression now sits inline in that list.
7. **`src/game/beatCommitGate.ts` lines 75-81**: `function distinctiveTokens(raw)`, which lower-cased, stripped punctuation, split and kept words of 5+ letters not in `SLOT_STOP`. It had one caller (`slotMentioned`), so the same chain now sits inline there.
8. **`src/game/chipLegality.ts` lines 37-42**: `function nameTokens(name)`, which took `low(name)`, dropped a leading article, split on space, apostrophe and hyphen, and kept 3+-letter tokens other than the/of/and. It had one caller (`mentionsName`), so the same chain now sits inline there.
9. **`src/game/types.ts` line 1060**: `TravelJourney.hoursToday?: number` (it reset with each journey). Replaced by `GameState.roadDay` on the world clock (order item 1). The `travelJourney.ts` uses at 1130, 1207, 1388-1390, 1419 and 1555 now read `roadHoursToday(state)`.

---

## tt-fix-14 (restore from `69e19dce`)

1. **`src/game/writerTurn.ts` lines 99–101 (swap)** — `function sentenceCount(prose: string): number { return (prose.match(/[^.!?]+[.!?]+["')\]]*/g) ?? []).filter((s) => s.trim().split(/\s+/).length >= 3).length; }`. What it did: counted 3+-word sentences for the "Too thin" draft check. Same body as `tokenProse.storySentences` (now exported); line 131 calls `storySentences(text)` and the line 11 import adds it.

---

## tt-fix-13 (restore from `16ef28f5`)

1. **`src/game/arcDirector.ts` lines 736–739** — `} else if (r.startsWith('Encounter:')) { lines.push(r); } else if (r.startsWith('Encounter cleared:')) { lines.push(r);` in `formatArcStatusReceipts`. What they did: let the encounter lines onto STATUS by their exact prefix, so the new "Encounter ended:" line (a fight lost or fled, lap 17 N5) would have been dropped. Folded into the engine-line prefix regex on line 740 as `Encounter(?: cleared| ended)?`; every encounter line takes the same code path.

---

## tt-fix-12 (restore from `38ce08f0`)

1. **`src/game/arcDirector.ts` lines 736–737** — `} else if (r.startsWith('XP Gained:')) { lines.push(r);` in `formatArcStatusReceipts`. What it did: let a paid XP line onto STATUS, while the engine's "XP: none (… — reason)" line on an unpaid kill fell through every branch and was dropped (lap 16 N1, F T11/T21). Folded into the engine-line prefix regex on line 742 as `XP(?: Gained)?`, so both lines pass with the same code path.

---

## tt-fix-11 (restore from `0339063c`)

1. **`src/game/choicePipeline.ts` lines 709–711** — `if (/\b(door|gate|path|corridor|alley|gap|arch|rubble)\b/i.test(storyProse)) { options.push('Force a path forward'); }` in `sceneSafeFallbacks`. What it did: offered "Force a path forward" whenever the prose named a door, gate, path or rubble. No engine action stands behind that chip (no roll, no exit, no room), so the writer improvised a dead turn (lap 15 F T4–T6, D T12). Nothing replaces it; the other scene-safe fallbacks stay.
2. **`src/game/choicePipeline.ts` line 372** — the `force a path forward|` alternative in the `isLegalEnginePad` regex. What it did: trusted that chip as an engine pad, so it skipped the grounding filter. With no engine action it is not an engine pad. The regex stays with that one alternative removed.
3. **Single-use helpers folded into their one caller** (same body, no behaviour change; restore only if a second caller appears):
   - `src/game/chipLegality.ts` `gmBodies` (lines 140–142), `cameFrom` (174–177, its doc line kept as a comment at the call), `lastPlayerLine` (300–302).
   - `src/game/engineFactGate.ts` `openQuests` (lines 42–44).
   - `src/game/tokenProse.ts` `keepCleanLines` (lines 1012–1014).

---

## tt-library-2 (restore from `a76a19d6`)

1. **`src/game/tokenProse.ts` line 58** — `const LINE_FNS = new Set<LineFn>(['place', 'action', 'speech', 'react', 'hook']);`. What it did: the line kinds a writer line may have. Replaced by the zod enum `tokenBeatSchema.LINE_FNS` (one list for the request schema and the reply reader).
2. **`src/game/tokenProse.ts` lines 61-63** — `const TOKEN_USES = new Set<TokenUse>(['speaker', 'actor', 'addressed', 'corpse', 'prop_used', 'worn', 'place']);`. Replaced by the zod enum `tokenBeatSchema.TOKEN_USES`.
3. **`src/game/tokenProse.ts` lines 65-83** — `const TOKEN_USE_ALIAS: Record<string, TokenUse> = { prop: 'prop_used', item: 'prop_used', object: 'prop_used', thing: 'prop_used', kit: 'worn', gear: 'worn', equipped: 'worn', location: 'place', setting: 'place', person: 'actor', npc: 'actor', character: 'actor', subject: 'actor', target: 'addressed', listener: 'addressed', body: 'corpse' };`. **Moved, not lost**: same 16 entries in `tokenBeatSchema.ts` (`USE_ALIAS`), read by the zod `use` field. Still needed for the no-schema Fireworks writer.
4. **`src/game/tokenProse.ts` lines 85-89** — `function readTokenUse(raw: string): TokenUse | null { const u = raw.trim().toLowerCase().replace(/[\s-]+/g, '_'); if (TOKEN_USES.has(u as TokenUse)) return u as TokenUse; return TOKEN_USE_ALIAS[u] ?? null; }`. Replaced by the zod `use` transform (same rule, default `actor`).
5. **`src/game/tokenProse.ts` lines 176-193** — the hand coercion of `parsed.refs`: `const parsed = JSON.parse(json) as { candidates?, refs?, lines? }; if (Array.isArray(parsed.candidates)) return null; if (!Array.isArray(parsed.refs) || !Array.isArray(parsed.lines)) return null; … for (const row of parsed.refs) { if (!row || typeof row !== 'object') continue; const rec = row as {…}; const tok = String(rec.tok ?? '').replace(/^@/, '').trim(); const id = String(rec.id ?? '').trim(); if (!tok) return null; const use = readTokenUse(String(rec.use ?? '')) ?? 'actor'; if (id.includes('<')) continue; refs.push({ tok, id, use }); }`. Replaced by `tokenBeatSchema.readWireBeat` (zod `WireBeat` / `WireRef`), which also collapses a ref declared twice.
6. **`src/game/tokenProse.ts` lines 203-210** — the hand coercion of `parsed.lines`: `if (!row || typeof row !== 'object') continue; const rec = row as {…}; const fn = String(rec.fn ?? '').trim() as LineFn; const text = String(rec.text ?? '').trim(); if (!LINE_FNS.has(fn) || !text || …) continue; const typed = rec.speaker_tok != null ? String(rec.speaker_tok).replace(/^@/, '').trim() : '';`. Replaced by zod `WireLine` (the two placeholder regexes stay in tokenProse).
7. **`src/game/tokenProse.ts` lines 615-619** — `export function refEnumOf(state, packet)`. **Moved, not lost** to `tokenBeatSchema.ts` (re-exported from tokenProse) so the request path can build the schema without loading tokenProse.
8. **`src/game/rules/srdMonsters.ts` line 47** — `const s = (STR, DEX, CON, INT, WIS, CHA): Attributes => ({ … });` (score helper for the hand table). Not needed: scores come from the SRD data.
9. **`src/game/rules/srdMonsters.ts` lines 49-87** — the hand-typed `SRD_MONSTERS` table: every number of the 10 blocks (cr, ac, hp, hpDice, speed, scores, passivePerception, darkvision, gear, vulnerable, attack name / toHit / damage / type / extra). They were 2014 values in places (Giant Rat DEX 15, Perception 10, +4, 1d4+2; Skeleton AC 13; Shadow 16 HP 3d8+3; Giant Spider poison 2d8). Replaced by `src/data/srd/srd521.json` (SRD 5.2.1). Kept in code as the engine overlay: id, `kind`, the attack's name, `match`, ghoul `rider`, wolf `inflicts`, zombie `undeadFortitude`.
10. **`src/game/rules/spells.ts` lines 67-117** — the `level: N, classes: [...],` fields of all 47 `SPELLS` entries and `concentration: true` on the Concentration ones. All 47 matched the SRD data exactly (checked before the cut). Replaced by `srd521.json` `spells`.
11. **`src/game/rules/magicItems.ts` lines 39-44** — `srdRarity: 'Uncommon'|'Rare', attunement: true` on Cloak of Protection, Ring of Protection and Bracers of Defense. Replaced by `srd521.json` `magicItems` (same values). Potions keep theirs: the SRD data lists them as one "Rarity Varies" entry.
12. **`src/game/openRouterChat.ts` line 348** — not a deletion: `required: ['fn', 'text']` became `['fn', 'text', 'speaker_tok']` with `speaker_tok` nullable. The old schema was invalid in strict mode (gpt-5-mini answered 400 every time and the turn re-posted without the schema).

## tt-fix-10 (restore from `6869ec1b`)

1. **`scripts/factCheck.mjs` lines 46-47** — `const PERSON_ACTS = /^\s+(?:\w+\s+)?(?:stood|said|says|watched|stepped|looked|called|asked|walked|came|sat|nodded|pointed|laughed|turned|waited|kept|held|ran|spoke|told|shouted|blocked|moved)\b/i;` and its uses at lines 422 (`if (!PERSON_ACTS.test(after)) continue;`) and 482 (quiet-stretch meeting `.find((m) => PERSON_ACTS.test(…))`). What it did: a person word counted only when a listed verb followed it, so "a lone traveller on the road" was never checked. Replaced by reading who is here from the engine's records (`peopleText`: HERE block, person/companion refs, presentNames, engine result, receipts); the meeting check reads an article or count before a person word.
2. **`scripts/factCheck.mjs` line 52** — `'fence'` in the `PEOPLE` list. What it did: counted a garden fence as a person. Dropped; nothing else covers it (it is not a person).
3. **`scripts/factCheck.mjs`** — the item check's `x.replace(/s$/, '').endsWith(w)` (written during this step, not at the parent) → `x.endsWith(w) || x.endsWith(\`${w}s\`)`. Same match, one regex fewer.
4. **`src/game/outdoorHubs.ts` lines 450-453** — `/** Thornferry mill / ford / landing / quay are one already-here cluster (02f / 02g). */ export function isThornferryCluster(s) { return /\b(thornferry|mill\s+landing|the ford|harbor quay)\b/i.test(s ?? ''); }`. Dead: no production caller; its only user was one `it` in `playtest02gBatch02g.test.ts` (removed with its import).
5. **`src/game/outdoorHubs.ts` lines 361-377** — `export function formatOutdoorHubsForPrompt(state)` (the `[OUTDOOR HUBS — travel targets…]` prompt block). Dead: its only caller was `src/game/situationPacket.ts` line 501 (and the edge copy), and `situationPacket` is imported by nothing in the app, the scripts or `gm-turn`. The call and the line 21 import were removed from `situationPacket.ts`.
6. **`src/game/completedEventPacket.ts` lines 1273-1292** — `export function attachCompletedEvent(state, playerInput?, extras?)` (built the packet and wrote the loiter streaks onto `sceneFacts`). Dead: no production caller; `s82RootATerminalFight.test.ts` now sets `completedEvent: buildCompletedEventPacket(…)` directly.
7. **`src/game/tokenProse.ts` lines 1142-1145 and 1147-1159** — `function missingFns(lines)` and `export function formatTokenRepairFacing(packet, missing)` (the `TOKEN REPAIR:` request text). Dead: `formatTokenRepairFacing` was imported by `useGame.ts` line 376 but never called; `missingFns` only fed `needsRepair`.
8. **`src/game/tokenProse.ts` lines 1289, 1367-1379 and the two `...(needsRepair ? { needsRepair } : {})` spreads** — the `needsRepair` result field, the parse/clean pass that built it, and the `alreadyRepaired` option (line 1275; passed only by `writerTurn.ts` line 107). Dead: nothing reads `needsRepair`. The `formatRefEnumForWriter` import (line 11) went with it.
9. **`src/game/travelJourney.ts` lines 409-412** — `function answersPlea(enc, input)` (only the plea's Help chip settled a meeting). Replaced by `answersMeeting`, which also settles a no-fight meeting passed by with its own go-by chip.
10. **`src/game/encounterTerminalFsm.ts`** — `attachLastKillOnVictory` renamed `settleFoePresence`; it now drops the foe from `present` on an escape as well as a victory (lastKill only on victory).
11. **`src/game/engineFight.ts` lines 202-207** — `meetingMove` was read only on the road path and after a pending spawn; the chip test ran the raw input (with the "but fail and they attack" tail) through `ATTACK_RE`. Now the meeting move is read first and the chip base is tested.
12. **`src/game/tabletopQuestProgress.ts`** — `tabletopStepChip` lost the travel-chip addition written during this step (the story chip's trip now reads the open step's anchor in `choiceRanking.storyChip`).

---

## tt-fix-9 (restore from `68d01a47`)

1. **`src/game/useGame.ts` lines 4639-4649** — `let mergedState: GameState = appendStateTxDiff(liveCurrent, mergedStateDraft, { combatSummary, why: … });` then `const turnReceipts = (mergedState.stateTxLog ?? []).filter((t) => t.turn === nextTurn).map((t) => \`Ledger: ${t.summary}\`);`. What it did: the live path's own record dump; every row this turn (HP, moved to, X is present, equipped, gained, quest complete) became a `Ledger:` STATUS line, and the headless fate path had no such step. Replaced by `stateTx.commitTurnRecord`, shared by live and fate, which reports only the record's grant rows (quest unlocked / complete / failed, item gained, condition, Heroic Inspiration) and skips one a line this turn already names. Line 292 import `appendStateTxDiff` → `commitTurnRecord`.
2. **`src/game/npcSheet.ts` lines 220-222** — `const job = memory?.sheet?.job; const where = memory?.location; const own = job ? \`I'm the ${job}${where ? \` here at ${where}\` : ''}\` : '';` and the fallback `'I have nothing to tell you'` with the bare `${name} said`. What it did: answered any talk with the sheet's engine role and place ("I'm the quest patron here at Greyhollow Church"), whatever was asked; a speaker with no sheet ("stranger") got an article-less denial. Replaced by an answer to what was asked (want → sheet motive or the road meeting's own want; who → the name), with `the` before an unnamed speaker.
3. **`src/game/rules/travelDay.ts` line 222 / 223** — `MEETING_WANT` entries `'word of someone they are looking for'` → `'word of someone gone missing'` and `'you gone from their stretch'` → `'you gone from this stretch'` (wording only, so the want reads in first person too).

---

## tt-fix-8 (commit `8a55f995`, restore from `e8c0e072`)

`src/game/choiceRanking.ts`:

1. **Lines 418-432** — `export function objectiveStepChip(description: string): string | null { const whole = objectiveChip(description); if (whole) return whole; … for (const m of text.matchAll(OBJECTIVE_PHRASE_BREAK)) { const cut = text.slice(0, m.index).trim(); if (cut.length > 60) break; if (cut.split(' ').length >= 2) best = cut; } return best; }`. What it did: built a step chip by cutting the step sentence at a phrase word. Replaced by `stepChip`, which joins the step's own `verb` and `object` (now on the step record, from `tabletopMainSpines` `steps`).
2. **Line 435** — `const OBJECTIVE_PHRASE_BREAK = new RegExp(\`${OBJECTIVE_TAIL.source}|\\s(?:around|for|with|toward|towards|leading|over|into|past|beyond|along|of|to)\\s\`, 'gi');` (one `new RegExp`). Only `objectiveStepChip` read it.
3. **Line 404** — the leading `,|` in `OBJECTIVE_TAIL` (`/,|;|\s(?:amidst|…`). What it did: cut a chip at the first comma ("Haul up the ruined"). Steps with a verb/object never reach it; a step without one (old saves, other modes) now cuts only at `;` or a clause word.
4. **Line 392** — `objectiveChip(obj.description)` in `storyChip` → `stepChip(obj)`; line 18 import gained `QuestObjective`.

`src/game/questPlay.ts`:

5. **Lines 807-817** (`asSeededQuest`) and **1008-1010** (`revealLocalStarterQuest`) — the per-field copies `...(anchor?.place ? { place: anchor.place } : {}), ...(anchor?.people?.length ? { people: [...anchor.people] } : {}), ...(anchor?.room ? { room: anchor.room } : {})`. Replaced by one `anchorFields(anchor)` helper that copies every set anchor field (now including `verb` / `object`). Line 17 anchor type gained `verb?` / `object?`.

`src/game/turnCheck.ts`:

6. **Lines 143-145** — `/** The prose moves the body: a walk can be told with any travel verb. */ const MOTION_TOLD = /\b(?:walk|stepp?|cross|pass|strode|stride|went|moved?|moving|continu|head(?:ed|ing)|made (?:their|his|her|your|my) way|kept (?:to|on|going|walking)|carried on|pressed on|wander|stroll|trudg|climb|descend|follow|leav|left|reach|enter|arriv)/i;`. What it did: guessed from prose words whether "Walk on" was told. The engine resolves its own journey chips; an engine chip it resolved is now trusted by `engineResolvedChip`.
7. **Lines 294-295** — `} else if (!words.length && MOTION_VERB.test(actionVerb(act)) && !MOTION_TOLD.test(text)) { down.push({ kind: 'action-object-missing', detail: \`player chose "${act.slice(0, 60)}"; the prose never moves them\` });`. Same reason. Line 36 `MOTION_VERB` import dropped with it.
8. **Lines 280-283** — `// "Check the exits" acts on this place's ways out: naming them is showing what was acted on. const exits = handedExits(after) ?? handedExits(before) ?? []; const shown = (w) => stemHit(text, w) || (stemHit(w, 'exits') && exits.some((e) => placeNamed(text, e))); if (words.length && !words.some(shown)) {`. What it did: a special case so the engine's "Check the exits" chip was not flagged. Covered by `engineResolvedChip`; a typed line is read as words again. Line 50 `handedExits` import dropped with it.
9. **Line 278** — `if (!talkish && !socialAct && !travel && !looking && !blowOwned) {` gained `&& !engineResolvedChip(after, act, offered)`; line 207 `prose: string` gained `offered: string[] = []`; line 441 passes `row.offeredChoices ?? []`.

`src/game/writerTurn.ts`:

10. **Lines 414-417** — `// Only a backed line may be quoted: with nothing on record for anyone here, the turn keeps its own lines.` and `if (!backed.size) return { ...turn, answerRepair: { ...missing, bug: 'skipped: no backed line for anyone here' } };`. What it did: left a talk turn with no answer when the person had no lore or quest lines. Replaced by the engine answering from the person's own sheet (`npcSheet.sheetAnswerLine`, the sheet `backedAnswerFacts` also reads); still no writer request. **Lines 454-459** (the inline return) moved into `landAnswer` (same body).

Tests (assertions replaced by the tt-fix-8 tests):

11. **`src/game/playtest29z4TesterTruth.test.ts` lines 66-75** — "a walk told as crossed / watched them pass is not a down" and "a walk the prose never moves is still a down" (pinned `MOTION_TOLD`). Replaced by the engine-chip test with `offered: ['Walk on', 'Turn back']`.
12. **`src/game/seed94RepairGaps.test.ts` line 127** — `expect(kinds(checkActionFollowed(s, s, 'Walk away / go another direction', 'Jax stayed by the stairs and thought.'))).toContain('action-object-missing');` (pinned the motion path).
13. **`src/game/ttCut1.test.ts` lines 102-113** — "naming the handed ways out shows what was acted on" (pinned the exits special case). Replaced by "the engine chip the engine resolved is trusted, not re-read"; the typed case still flags.

`src/App.tsx` / `src/components/SettingsModal.tsx`:

14. **`App.tsx` lines 168 and 259** — `engineMode={'litrpg'}` on the main-menu Settings (no save loaded). What it did: showed LitRPG-only sections as if they applied to every game. `SettingsModal` `engineMode` is now optional; mode-bound sections use `modeProfile.settingScope`.
15. **`SettingsModal.tsx` line 103** `const isDnd = engineMode === 'dnd';`, **line 864** `modeProfile(engineMode).autoFight`, **line 1102** `{!gameState && <p …>Start a story to enable export.</p>}` (the export section now hides with no save).

---

## tt-cut 2 (commit `cd2b8724`, restore from `0e2419cb`)

### A. Dead modules (whole files)

Each one had no importer anywhere in `src/`, `supabase/` or `scripts/` except its own tests. Restore with `git show 0e2419cb:<path> > <path>`. For the three with edge copies, also put the name back in `scripts/sync-gm-edge-shared.mjs` (old lines 46, 47, 60) and re-run the sync.

1. **`src/game/socialStakes.ts`** (404 lines). First line: `WS-7 Wave C: Social Stakes Templates and Non-Combat Resolution`. What it did: per-mode social stakes templates (`STAKES_TEMPLATES`, `OUTCOME_CATALOG`), `templatesForMode`, `validateOutcome`, `applyOutcomeMutations`, `getLeverageCooldown`, `enforceLeverageCooldown`. Safe because no game code imported it; it was a WS-7 prototype that only its test read. Live social play runs through `socialCrisis` / `socialSkills` / `npcRelationships`.
2. **`src/game/leverageMechanics.ts`** (294 lines). First line: `WS-7 Wave 1: Leverage Mechanics`. What it did: `registerLeverageAsset`, `exhaustLeverageAsset`, `isLeverageExhausted`, `getPressureProfile`, `resolveLeverage`, `getLeverageTypeName`, `getLeverageTypeDescription`. Safe because only tests imported it.
3. **`src/game/encounterStakes.ts`** (264 lines). First line: `WS-4 Wave 1: Encounter Stakes System`. What it did: `materializeStakes`, `isApproachLegal`, `getLegalApproaches`, `validateActionHonesty` over encounter templates. Safe because only its test imported it; live encounters run through `encounterBible` (catalog) and `encounterTerminalFsm`.
4. **`src/game/fullProseGate.ts`** (54 lines, 3 regex). First line: `Day-1 full-prose gate — shared by NarratorProvider and edge gm-turn policy.` What it did: `MIN_PROSE_WORDS` / `MIN_PROSE_SENTENCES` / `MIN_TOKEN_PROSE_LINES`, `countProseWords`, `countProseSentences`, `isFullProseNarration`. Safe because nothing imported it (the header's claim was stale); the commit gate (`classifyBeatCommit`: atmosphere-only, drought stub, recycle) and the writer turn decide a thin beat now.
5. **`src/game/folkVoiceExpectations.ts`** (354 lines) **and edge copy `supabase/functions/_shared/gm/folkVoiceExpectations.ts`**. First line: `Folk / peoples voice expectations — public-domain folklore tropes + original SynapticGM LitRPG folk.` What it did: `FOLK_VOICE_PROFILES`, `detectActiveFolkIds`, `formatFolkVoiceForPrompt` (a prompt rail). Safe because neither the client nor any edge file imported it; the writer packet no longer includes it.
6. **`src/game/speechActRails.ts`** (21 lines) **and edge copy**. First line: `Compact speech-act rails from fluid-chat F5 — social fluidity without ritual ack.` What it did: `formatSpeechActRailsForPrompt` (prompt text). Safe because nothing imported it on either side.
7. **`src/game/claimGrounding.ts`** (14 lines) **and edge copy**. First line: `Pack 11 claim-grounding directive — keep prose fluid; block invented named entities.` What it did: `formatClaimGroundingDirective` (prompt text). Safe because nothing imported it; invented names are decided by the handed-names list (`compileNounAllowlist` / `handedProperNames`) and the sealed card.
8. **`scripts/sync-gm-edge-shared.mjs`** lines 46 `'folkVoiceExpectations.ts',`, 47 `'speechActRails.ts',`, 60 `'claimGrounding.ts',`. What they did: copied the three modules above to the edge. Safe because the modules are gone.

Not deleted, although tt-sweep listed them:
- `pyoaEndingGates` is live: `mainQuestEnd.ts:10` and `storyRpgProgress.ts:33` import it.
- `qualityGovernance.turnsSinceLastEncounter` is read: `buildGovernanceSnapshotLines` (`qualityGovernance.ts:255`), which the edge `situationPacket` calls.

### B. Stale tests of the dead modules

Restore with `git show 0e2419cb:<path> > <path>` (these files had no other change this step, except `playtest02nBatch02n` below).

9. `src/game/__tests__/ws7Complete.test.ts` lines 39-50 (socialStakes import), 66-75 (leverageMechanics import), 163-267 (`describe('WS-7 Wave A: Leverage Mechanics')`), 671-758 (`describe('WS-7 Wave C: Social Stakes Templates')`), 1033-1098 (`describe('WS-7 Integration: Full Social Resolution Flow')`; it was built on leverage assets and the stakes cooldown — the relationship and social-XP parts it touched keep their own describes in the same file).
10. `src/game/playtest31aWave1Social.test.ts` line 10 (leverage import) and 136-262 (`Leverage Registry`, `Leverage Exhaustion`).
11. `src/game/playtest31bWave1Encounter.test.ts` lines 25-30 (encounterStakes import) and 363-429 (`describe('WS-4 Wave 1 — Stakes Materialization')`, B006–B010).
12. `src/game/fluidChatEval.test.ts` lines 4 and 8 (imports), 54-104 (`describe('folkVoiceExpectations')`, 5 tests), 115-121 (`describe('speechActRails')`).
13. `src/game/playtestDay1Checklist.test.ts` line 15 (import) and 112-122 (`describe('day-1 — full-prose gate')`).
14. `src/game/playtest02nBatch02n.test.ts` line 10 (`import { formatClaimGroundingDirective } from './claimGrounding';`), line 72 (`const claim = formatClaimGroundingDirective();`), lines 84-88 (five `expect(claim)…` lines: no clerk / aisle / hatchling / unnamed crowds; MUST NOT invent). The rest of that test (SNAPSHOT / packet diet) is unchanged.

### C. Never-read save fields (`src/game/qualityGovernance.ts`)

Old saves still carry these values (`{ ...prevQg }` copies them forward); nothing reads them.

15. Line 123 `lastHubLocation?: string;` and lines 658-661 `const hubLoc = nextWithNpc.currentLocation ?? ''; if (hubLoc && hubLoc !== prevQg.lastHubLocation) { qualityGovernance.lastHubLocation = hubLoc; }`. What it did: stored the last location. Safe because its only read was its own change test; the location lives on `state.currentLocation` / `journey`.
16. Line 133 `recentXpAwards?: Array<{ amount: number; reason: string; type: string; turn: number }>;` and lines 641-644 `qualityGovernance.recentXpAwards = [...(prevQg.recentXpAwards ?? []).slice(-99), { amount, reason, type, turn }];`. What it did: a rolling list of discovery XP awards. Safe because no code read it; discovery XP is retired (28a) and the find is still recorded in `discoveryLedger`.
17. Lines 134-135 `/** Last-turn craft flags … */ craftSignals?: CraftSignal[];` and line 680 `qualityGovernance.craftSignals = signals;`. What it did: stored the turn's craft flags. Safe because no code read the stored copy; the same `signals` still feed `applyCraftLearning` → `craftLedger` on the same turn.

### D. Regexes, lists and functions that duplicated the handed-names list or a shared helper

`src/game/completedEventPacket.ts` (edge copy `supabase/functions/_shared/gm/completedEventPacket.ts` re-synced with the same lines removed):

18. Lines 262-263 `const TITLE_NAME = /\b((?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+){0,2}[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;` — the Title-Case name regex for the scanner in 21. Safe: only 21 used it.
19. Lines 265-270 `const SENTENCE_STARTERS = new Set(['the','a','an','your','you','then',…,'first']);` (list of 33) — sentence-start stop words for the scanner in 21. Safe: only 21 used it.
20. Lines 1471-1473 `function allowlistHas(allowlist, token) { return mentionAllowlistHas(allowlist, token); }` — wrapper. Safe: only 21 called it; `mentionAllowlistHas` stays.
21. Lines 1475-1494 `export function inventedTitleCaseNotOnAllowlist(prose: string, allowlist: string[]): string[]` — scanned prose for Title-Case names not on the allowlist. Safe: no caller anywhere (including tests). The same decision is made by the handed-names list on the commit path: `inventedCastNamesInProse` (`beatContract.ts`, sealed cast + `completedEvent.allowlist`) via `isSealedCardViolation` in `classifyBeatCommit` / `sentenceGateProblems`, and `ledgerNounObey` via `mentionAllowlistHas`.
22. Lines 2394-2396 `function ledgerAdvanceBeat(state, packet?, playerInput?) { return topicAdvanceStitch(state, packet, playerInput); }` — pass-through. Safe: no caller; `topicAdvanceStitch` stays.

`src/game/tokenProse.ts`:

23. Lines 109-148 `export const TOKEN_PROSE_JSON_SCHEMA = { … } as const;` — the strict `{ refs, lines }` JSON schema. Safe: no reference; the schema actually sent is typed inline in `openRouterChat.ts` (same fields and enums).
24. Lines 1024-1026 `function escRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }` — swap to `engineFactPatterns.escRe` (identical body).
25. Line 312 and line 534 `const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` (two local copies) — swap to `escRe`.
26. Quote-mask copies `.replace(/["“][^"”]*["”]/g, ' ')` at lines 464, 514, 537, 570 (`lineHasWrongTimeOfDay`, `lineHasUnhandedCarriedThing`, `lineHasUnhandedOwnThing`, `lineHasUnhandedFind`), 768 (local `narrationOf(line)`) and 962 (`beatPcPossessive`) — swap to `engineFactPatterns.narrationOf`, imported as `narratorWords` (the file has its own `narrationOf(line)`, which keeps its speech-line blanking).

`src/game/turnCheck.ts`:

27. Lines 94-112 `export const TURN_CHECK_P0_KINDS: ReadonlySet<TurnCheckKind> = new Set(['ghost-chip','impossible-chip','unrelated-chip','ignored-action','open-ground-interior','bad-floor-plan','unestablished-quest-place','broken-prose','sheet-forgotten','levelup-no-change','lock-without-skill','plays-player','absent-speaker','wrong-voice','lecture-ending','ghost-talk','window-touched']);` (list of 17) — the P0 kind names. Safe: no reference; `checkPlayerTurn` builds its p0 list directly.
28. Line 590 `const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` and line 371 inline `${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` — swap to `escRe`.
29. Quote-mask copies at lines 307 (`checkActionFollowed`), 355 (`brokenProse`), 524 (`checkEmptyRoomTalk`), 559 (`checkSystemWindow`), 628 (`checkPlayCrimes`) — swap to `narrationOf`.

`scripts/factCheck.mjs`:

30. Line 316 `const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` and the inline escapes at lines 229 (`who`), 367 (`handedWhole`), 395 (`subjectOwns`), 466 (`namesPlace`) — swap to `escRe` (imported from `engineFactPatterns`, which the checker already loaded).
31. Line 493 `HIT_WORDS.test(prose.replace(/["“][^"”]*["”]/g, ' '))` — swap to `narrationOf(prose)`.

`src/game/beatCommitGate.ts`:

32. Lines 253-256 `/** Lock C — prose that reopens a ledger-closed fact. */ export function isFactClosedViolation(state, text): boolean { return factClosedViolationReason(state, text) !== null; }` — boolean wrapper. Safe: production calls `factClosedViolationReason` directly; the 12 tests that used it now call `!!factClosedViolationReason(...)` (02aa, 02j, 02k, 02l, 02p, 02q, 02r, 02t, 02v, 02x, 02y, 02z).
33. Lines 338-341 `/** @deprecated alias — use codedSceneMove */ export function stitchCommitDelta(state) { return codedSceneMove(state); }` — deprecated alias. Safe: tests only (31p, 31r, 31t), which now call `codedSceneMove`.

### E. Looked at and kept (partial overlap; no deletion)

`proseViolatesEventPacket` and its sub-checks (instruction voice, choice list, alive-vs-dead, premature loot, wrong HERE), `isWriterMonologueLeak`, `isDirectorChromeLeak`, `isTokenSaladLeak`, `isHudCombatChromeLeak`, the charter regex in `factClosedViolationReason`, tokenProse `BODY_PART` / `PC_SPEAKS` / `lineOpensOnFactLabel` / `lineHasWrongTimeOfDay` / `lineHasUnhandedFind` / `handedRoleNouns` / `knownProperNames`, turnCheck `PROMPT_ENDING` / plays-player / destination / `BLOW`, factCheck lists and exit logic. Each covers a case the shared mechanisms do not (see `tt-cut-2.md`). `isVerbatimStallStub` and `isStitchBankFingerprint` are phrase deny-lists for old stitch text; they are not covered by the handed-names list, `thisTurnsEventCheck` or the engine records (only by the recycle window), so they stay for a later step.

---

## tt-cut 1 (commit `1f50ec5c`, restore from `56c53ce5`)

1. **`src/game/tokenProse.ts` lines 502-506** — `/** What anyone wears or is … */ const WORN_OR_BODY = /^(?:clothes|coat|cloak|hood|collar|sleeves?|…|head|hair)$/;` and `/** A handed bag covers its other names. */ const BAG_WORD = /^(?:pack|packs|backpack|satchel|knapsack|rucksack)$/;`. What they did: worn / body words and bag synonyms for the carried-thing check. Moved (not lost) to `src/game/engineFactPatterns.ts` with the same text; tokenProse imports them.
2. **`scripts/factCheck.mjs` lines 44-47** — `const GARMENTS = new Set(['boots','boot','belt','coat','cloak','hat','hood','gloves','tunic','jerkin']);` and `const BAG_WORDS = new Set(['pack','backpack','satchel']);`. What they did: let a handed "clothes" row cover garments and a handed "Bag" row cover bag words. Covered by `engineFactPatterns.WORN_OR_BODY` / `BAG_WORD` (the game gate's list).
3. **`scripts/factCheck.mjs` lines 386-387** — `if (GARMENTS.has(w) && /\bclothes\b/.test(facts.handedText)) continue;` and `if (BAG_WORDS.has(w) && /\bbag\b/.test(facts.allowText)) continue;`. Replaced by the shared-list checks.
4. **`scripts/factCheck.mjs` lines 39-42, `ITEMS` list entries removed:** `'boots'`, `'boot'`, `'cloak'`, `'coat'`, `'gloves'`, `'jerkin'`, `'tunic'`, `'hat'`, `'hood'`, `'belt'` (worn words; the list went from 180 to 157 entries across the checker). Covered by `WORN_OR_BODY` (worn things are not new items).
5. **`scripts/factCheck.mjs` line 17** — the separate import line of the shared patterns was rewritten to add `BAG_WORD`, `WORN_OR_BODY` (no logic lost).
6. **`scripts/factCheck.mjs` line 253** — `const exitClauses = s.split(…).filter(…)` over the raw sentence; and **line 311** `if (EXIT_CLAIM.test(s) && !/\b(?:counting|watching|eyeing|checking) the exits\b/i.test(s))`. Rewritten to read narration with speech masked (same masking as the item check); restore from `56c53ce5` if needed.
7. **`src/game/ledgerNounObey.ts` lines 101-107** — `function dropOrRewriteInvented(sent, invented) { for (const name of invented) { if (!name) continue; if (new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(sent)) return ''; } return sent; }` (one `new RegExp`). What it did: dropped any sentence with an invented name. Replaced by the clause cut that keeps this turn's event (`isThisTurnsEvent` from `thisTurnsEventCheck`). Line 111 doc comment `Never swap the paragraph for a drought bank.` and line 136 call `.map((s) => dropOrRewriteInvented(s, invented))` changed with it; line 116 signature `packet?: CompletedEventPacket` gained the event-check option.
8. **`src/data/campaigns/cursedKeep.ts` line 203** — `'Speak with Oskar at the Greyhollow Tavern',` → `'Speak with Oskar at the Greyhollow Inn',` (one hub name; the hub's real name).
9. **`src/game/choiceRanking.ts` line 308** — `return pick ? \`Nudge: someone nearby mentions ${pick.name}: ${pick.blurb.replace(/[.!?]+$/, '')}.\` : '';` (pasted the hub blurb every time). Replaced by `placeFirstSight`; line 19 import changed with it.
10. **`src/game/turnCheck.ts` line 299** — `if (words.length && !words.some((w) => stemHit(text, w))) {` (action-object check without exits). Replaced by the check that also reads `handedExits`.

## tt-build-questtargets (commit `d71db37c`, restore from `4157bfd1`)

All in `src/game/tabletopQuestProgress.ts` (old line numbers at `4157bfd1`):

1. **Lines 144-150** - `function atPlace(state, place)`. Moved (not lost) to `src/game/questTargets.ts:27` with the same body, now exported; `tabletopQuestProgress` imports it.
2. **Lines 152-163** - `function atStepPlace(state, place, room)` (split `currentLocation` on the em dash; `room === 'inside'` or the room word in the inner label; outside the door -> `'door'`). What it did: said the player was at an inside step's spot in ANY room of the place, so the entry room ticked it. Replaced by `questTargets.targetSpot` (`:59`): inside a card the player must stand in the target's own room (`currentNodeId === target.nodeId`); outside at the place it is still `'door'`.
3. **Lines 197-211** - `function arrivedMoveStep(state, quest, hereBefore)` (a move step ticked when travel arrived at its place, with the step's person along). What it did: the arrival tick. Removed - John's rule: a step never ticks from an arrival alone. A move step now ticks when its person is met / its target is taken at that place (`findQuestTargets`).
4. **Line 240** - `const TALK_VERB = /\b(?:talk|speak|ask|tell|greet|approach|question|listen)\b/i;` (one regex). Moved to `src/game/questTargets.ts:24` (same text), used by `actionTakes`.
5. **Lines 243-269** - the body of `applyTabletopQuestTurn`: `said === chipKey(s.chip)` chip tick, the `doorBefore` walk-in guard, the `s.person && TALK_VERB` talk tick, and the `moved >= 0` arrival branch, and the single-quest objective rewrite. Replaced by `placeTabletopQuestTargets` + `questTargets.findQuestTargets` (`:85`): the tick happens only when the engine records a find / meet at the target (`target.foundTurn`), for every active quest.
6. **Line 168 type** - `type TakeableStep = { idx; chip; person: string | null; door?: boolean }` -> `{ idx; chip; door }` (the person rode only for the removed talk tick).
7. **Imports dropped** - `isJourneyUnderway` (only `arrivedMoveStep` used it), `peopleHere` and `matchHub` / `hubsForBibleId` (moved with `atPlace` / `targetSpot`).

Net in this file: lines 271 -> 236, regex 13 -> 11, fns 40 -> 31.

## q31-A SRD monster names in the combat log

1. **`src/game/tabletop/roundFight.ts` line 208 (at `e2a826a7`)** - `const statusName = (i) => (count === 1 ? enc.name : `${block.srd ? block.name : enc.name} ${i + 1}`);`. What it did: logged a lone SRD foe under the road label (`the restless dead`) while a group got the block name. Replaced by one `logged` name (block name when `block.srd`, else the encounter name) used for one foe and for numbered foes. The writer label (`writerName`) is unchanged.

## q31-P1 run-pacing flags are not writer turns

1. **`scripts/fate-autoplay/autoThumbs.mjs` lines 136-139 (at `3f499a47`)** - `down.push(same place ${sameLocRun} turns, no progress)` and `down.push(XP stall ${stall} turns)`. What they did: put run pacing (engine and autoplay) on a single turn's `down` list, so that turn's verdict became `down` and distill rejected the writer's prose. Moved, same conditions, to the run-level `circling.pacing` list in thumbs.json, and to a `Pacing:` line in report.md under Circling.
2. **`scripts/distillCollect.mjs` line 88** - `if (th?.verdict === 'down') why.push('local down flag');`. What it did: rejected a turn on any local flag, including pacing, chip and map flags. Replaced by `(th?.down ?? []).some(isWriterFlag)`, which uses the one writer-kind allowlist `WRITER_FLAG_KINDS` in `judgeNotes.mjs`. It reads old thumbs.json too, so no judge rerun is needed.
3. **autoThumbs JUNK and fight-contradiction strings** - the text is unchanged. They now carry a kind prefix (`junk: `, `prose: `), so `flagKind` reads them. Nothing was dropped.

## q31-B old tapes reach a different scene (shipped by q31-Bfinish)

1. **`src/game/travelJourney.ts` lines 663-676 (at `82cb32b4`)** - `let replayRecordedMeetings = false;`, `export function setReplayRecordedMeetings(on)` and `export function replayKeepsRecordedMeetings()`, plus their 5-line comment. What they did: a replay-only on/off flag that made a saved tape keep its recorded road meetings. Replaced by the one replay seam `src/game/replaySeam.ts` (`setReplayTape(stamp)` / `replayPreFeature(feature?)`), which carries the tape's build stamp. With no feature, `replayPreFeature()` means "a tape is replayed"; the three flag reads in travelJourney (`rollStretch`, the road camp, the camp watches) use it, so behaviour is the same. The comment moved into the seam header. `ttTravel.test.ts` "live play does not use the replay seam" now checks the new names.
2. **`src/__tests__/replayBank/ttTravel.bank.ts` case "[tabletop ds151 T7] the back streets are not a travel day"** - expectations `no Weather/Survival/Look-out receipt at T7` and `s.journey.terrain === 'streets'`. What they did: pinned ds151 T7 as a back-streets walk. That only held because tt-fix-2 (stamp 2026-10-14g) moved the tape's opening place, so the replay left from the wrong place. The tape itself (built 2026-10-13n) recorded T7 as `Travel: open road between Keep Gate and Greyhollow Inn - leg 1 of 2`, and tt6a's T7 travel-pace case expects that real travel day. Decision: Order B (a replay reaches the tape's own scene). The case now checks the replay reaches the recorded T7 trip, and keeps the streets rule by checking that the same journey on back-streets ground offers no road jobs and no camp.

## q31-scanner whole-tree rule scanner

1. **`scripts/ruleCount.mjs` lines 5-20 (at `82cb32b4`)** - the fixed `files` list of 14 paths as the only thing TOTAL counted. What it did: limited the "ruleCount TOTAL must not rise" gate to 14 files, so rules added anywhere else in `src/game` or `_shared/gm` went uncounted. Replaced by a walk of every source file under `src/game` and `supabase/functions/_shared/gm` (tests and `.d.ts` excluded). The 14 paths are kept as `old14` and printed as the `OLD14` line, so the old trend line continues. `src/game/fullProseGate.ts` no longer exists, so OLD14 counts 13 files, the same as before.

## q31-LToff LanguageTool removed for good (John 12:47)

1. **`src/game/grammarCheck.ts` (whole file, at `1c4412be`)** - `getLanguageTool()`, `quickGrammarCheck()`, `fullGrammarCheck()` and `GrammarCheckResult`. What it did: sent High-tier prose to the public `api.languagetool.org` and applied its replacements. Deleted, no replacement (John 12:47: LanguageTool off for good).
2. **`src/game/proseWarden.ts` lines 66-69 and 1664-1684** - `enableGrammarCheck?: boolean` on `ProseWardenContext` and `applyProseWardenAsync()`. What they did: the flag and the async wrapper that ran `applyProseWarden` then `quickGrammarCheck`. The wrapper had no other job, so it is gone; `applyProseWarden` is the only path. The line 780 comment no longer mentions LanguageTool.
3. **`supabase/functions/_shared/gm/proseWarden.ts` same lines** - the same flag and wrapper. Its `import('./grammarCheck')` pointed at a file that never existed on the edge (a dead import whose failure was caught silently). Deleted the same way.
4. **`src/game/warden.ts` lines 67, 243-244, 279, 308-310** - the "Pack 13 async for LanguageTool" comment, `const enableGrammarCheck = capacityTier === 'high'`, the ctx field, and the `polishedBase` branch. `runWarden` now always calls `applyProseWarden`. It stays `async` so no caller changes.
5. **`package.json` line 44** - `"languagetool-api": "^1.1.2"`, and its tree in `package-lock.json` (`npm uninstall languagetool-api`).
6. **`src/legal/credits.ts` lines 189-195** - the `languagetool-api` (BSD-2-Clause) credits row. The library is no longer shipped.
7. **`src/game/ttCoinCredits.test.ts` line 104** - `expect(rows.find((r) => r.work === 'languagetool-api')?.license).toBe('BSD-2-Clause')`. Dropped with the row (John 12:47).

## q31-F clock and light (Order F)

1. **`src/game/engineFactPatterns.ts` lines 19-21 and 36-37 (at `33477431`)** - the `NUM` word alternation, the `DURATION` regex built from it, and the `travelRecordRead` branch that flagged any narrated span ("half an hour", "two hours") whenever the turn's engine fact held a clock or travel record. What it did: read a span the world clock itself recorded ("+30 min" told as "half an hour") as the travel record read aloud, so the sentence repair cut the line (m52, s83 T8). Deleted, no replacement: the record readouts (legs, "the journey took…", "travelled for N hours", "part of the travel") stay owned by `TRAVEL_RECORD`, shared by the game gate and `scripts/factCheck.mjs`. The `engineResult` parameter stays (now unused) so no caller changes.

## q31-P3 factCheck person/name reads (Order P-3)

1. **`scripts/factCheck.mjs` line 193** - the `peopleText` filter `refs.flatMap((r) => (r.kind === 'person' || r.kind === 'companion' ? [r.display] : []))`. What it did: counted only person and companion REF ENUM rows as people, so a road meeting (`road:` row, kind `meeting`) and its label ("Cutha Cotter, a hurt traveler") were never someone here. Replaced by the one `handedPeople(refs)` list (display + label), the swap point for P-2's `handedRefs`.
2. **`scripts/factCheck.mjs` lines 428 and 434** - `facts.refs.some((r) => r.kind === 'person' && !/^encounter:/.test(r.id))` (`personHere`) and the same filter in `hereCount`. What it did: left encounter and road-meeting people out of "someone is here" and the headcount, so every "the stranger" / "the hurt traveler" after a road meeting flagged. Replaced by `facts.people` (the same `handedPeople` list).
3. **`scripts/factCheck.mjs` lines 422-424** - the `after`-only (30 chars) `called|named|known as` match. What it did: understood a handed name only after "called/named/known as", so apposition in the same clause ("a man in a stained apron, Piers Dunmore,") flagged. Replaced by one same-clause match on the rest of the narration that covers both forms (the PC's own name never counts as the appositive).

## q31-S1 self-death rule (Order S part 1)

1. **`src/game/inputMediation.ts` lines 25-26 and 127-137 (at `16bd4e76`)** - the `GAME_PERM_SELF_KILL` regex, its use as in-character framing, and the `permanent_self_kill` block (with the `ctx.hasRevivePath` allow). What it did: tried to stop a permanent self-kill by matching the typed words before the turn; paraphrases got through, chips never passed it, and nothing enforced it at the death. Replaced by the engine: `parsePlayerIntent().targetsSelf` routes the act to `commitDeath(cause:'self')` in `resolveEngineFight`. The real-distress crisis block stays (real-person layer).
2. **`src/game/universalHardRails.ts` lines 50-76 (+ edge mirror)** - `REVIVE_ITEM`, `REVIVE_COMPANION`, the shrine regex and `hasRevivePath()`, plus `HardRailContext.hasRevivePath`. What it did: nothing at run time; neither caller ever passed it (order step 5: remove once `commitDeath` owns the decision).
3. **`src/game/tabletop/roundFight.ts` lines 569-607** - `endAttunementOnDeath`, `REVIVIFY_GP`, `cheatDeath` and `HOURS_LATER`. Moved, not lost: they are the `danger` branch of `commitDeath` in `src/game/rules/death.ts` (the mercy branch is no longer reused for self deaths, per best fit 1 / design update A).
4. **`src/game/travelJourney.ts` lines 1511 and 1557** - the direct `deathSaves: { ... dead: true }` write in `exhaust` and the hard-coded forced-march death return. Replaced by `commitDeath(cause:'danger')`, so forced-march and starvation deaths now respect the table's `deathRule`.

## q31-S2 wellbeing gauge (Order S part 2)

1. **`src/game/inputMediation.ts` lines 21-22 and 109-121 (at `492fc8f4`)** - the `REAL_SELF_HARM` regex, the inline in-character framing regex, the `self_harm` block with its US-only 988 message, and `MediationResult.crisisResources`. What it did: blocked the whole turn (and put the text back in the box) when the typed words looked like real distress, with one US line. Replaced by `wellbeing.ts`: the same reading (now one speaker/target/framing reading with F3-F6) returns a check-in card beside the turn; the story turn always runs; locale helplines.
2. **`src/game/npcLifecycleFsm.ts` lines 154-303 (+ edge mirror)** - `TurnoverCheck`, `checkLifecycleTurnover()` and `advanceLifecycleState()`. What they did: nothing; no caller in src, scripts or the edge (`updateNpcLifecycle` owns the transitions). Cut to keep ruleCount TOTAL from rising.
3. **`src/game/inventoryConservation.ts` lines 94-176 and 231-273** - `detectInventoryTransitions()` and `buildInventoryConservationRetryBlock()`. What they did: nothing; no caller anywhere. Cut for the ruleCount budget.
4. **`src/game/typedEntityValidator.ts` lines 342-384** - `buildEntityRetryBlock()`. What it did: nothing; no caller anywhere. Cut for the ruleCount budget.
5. **`src/game/tutorialBeats.ts` lines 120-164 (+ edge mirror)** - `formatTutorialBeatMandate()`. What it did: nothing; no caller anywhere. Cut for the ruleCount budget.
6. **`src/game/wellbeing.ts` (draft before ship)** - a separate `FRAMED_AS_CHARACTER` regex and a `/[-_]/` locale split, folded into the one reading / a string split, so the new module adds no regex.

## q31-H motive variants and group lines (Wire-in H)

1. **`src/game/npcMemory.ts` lines 213-215 and 454-460 at `95e2e430` (+ edge mirror `supabase/functions/_shared/gm/npcMemory.ts`, same lines)** - `getCompletedTopics()` and `hasPurchasedFrom()`. What they did: nothing; no caller in src, scripts, tests or the edge (purchase pads read `purchases` directly). Cut to keep ruleCount TOTAL from rising.
2. **`src/data/npcMotiveLines.json` shape** - one line per motivation (`id -> string[]`) replaced by one list per motivation (`id -> string[][]`, the shipped line first). Nothing lost: every old line is the first entry of its list. Trailing full stops on the new variant lines dropped on merge (the engine quote adds its own comma).

## q31-G chips after the road-meeting change (Order G)

1. **`src/game/travelJourney.ts` `isJourneyPad` lines 545-554 at `bb3a86be`** - the static `known` list (every terrain's talk/wildlife pad, every kind's `FIXED_ENCOUNTER_PADS`, the champion pad, flattened). What it did: called any meeting chip of any kind a road chip, live meeting or not. Replaced by the live meeting's own pads (`encounterPads`, by its class) so a chip is a road chip only while that meeting is on the stretch.
2. **`src/game/choiceWarden.ts` line 174 at `bb3a86be`** - `journeyPads(state)` in the exact-label `engineChips` set. What it did: kept a road chip only when its label matched the pad text exactly, so a meeting chip without its failure-cost tail ("Talk your way past the thugs") fell through to the invented-context test. Replaced by `isJourneyPad(state, choice)` (the same class read as the chip legality check).
3. **`src/game/travelJourney.ts` `roadMeetingWant` lines 929-937 at `bb3a86be`** - returned the meeting's want string, '' when no want was recorded. Replaced by `roadMeetingSpeaker` (the meeting record by its class/label), so a group meeting's lines no longer depend on a recorded want; its one caller (`npcSheet.motiveLinesOf`) reads `.want` itself.

## cursorignore-narrow (John 18:21)

1. **`.cursorignore` line `**/*transcript*` (at `b27afcbf`)** - hid every path containing 'transcript', including source `src/game/playTranscript.ts` and `playTranscript.test.ts`, so Cursor sessions could not read or edit them. Replaced by `**/*transcript*.log`, `.txt`, `.json`, `.jsonl` and `**/*transcript*/` (folders); `**/transcripts/` stays. Safe: only transcript logs and data are ignored; source (.ts) is visible again. Restore with `git show b27afcbf:.cursorignore`.


## q31-RC1 fight outcome read from the engine record (Order RC-1)

1. **`src/game/engineResult.ts` lines 78-95 at `022a64b4`** - `FIGHT_OVER`, `WENT_DOWN`, `TERMINAL_WORDS` (victory / defeat / escaped kill-word regexes) and `beatCarriesTerminalFight`. What it did: decided whether the writer's prose *told* the engine's settled fight by matching kill words; any new phrasing ("lay quiet") missed the list and sent a good draft back for a rewrite, so each lap grew the list. Replaced by the engine record: the outcome sentence (`terminalOutcomeSentence`) always closes a settled-fight beat, added once.
2. **`supabase/functions/_shared/gm/engineResult.ts` same lines at `022a64b4`** - the edge mirror of item 1 (no edge caller).
3. **`src/game/beatCommitGate.ts` `fightFactsLeftOut` `outcome` field (line 222 at `022a64b4`)** - the word test above as a "fact left out" that triggered the fight rewrite. Removed; `withMissingFightFacts` adds the engine outcome sentence unless the beat already holds that exact sentence.
4. **`src/game/turnCheck.ts` line 220 at `022a64b4`** - `beatCarriesTerminalFight(text, fight)` inside `fightTold`. Removed; a settled (non-escape) fight in the engine record is the blow.
5. Tests that pinned the word reading (rewritten to the RC-1 rule): `ttFix3` "lost the trail tells an escape" (deleted), `ttFix14` block 2, `ttConsolidate` root 5, `s82RootATerminalFight` three cases, `m7lap7.bank` T19 word assertion (deleted). Restore with `git show 022a64b4:<path>`.


## 15 Oct 18:52: SK-4 / SK-5 merged into one current spec each (queued-fix-orders.md)
Removed, superseded wording kept here verbatim for the record (original SK-4, original SK-5, SK-5 amendment 1, SK-4/SK-5 amendment 2):

````
### Order SK-4: check resolution per mode
**Acceptance tests:** see docs/orders/acceptance-tests-new-orders.md, section SK-4. Cursor: make these pass. XP numbers are in docs/design/skill-xp-table.md.
- **Tabletop (SRD 5.2.1):** d20 + ability modifier + proficiency bonus (if proficient) vs DC (Typical DCs p.6); retries are allowed; failure costs are set by the GM (time, noise, a broken tool), never invented by the writer.
- **LitRPG / Story RPG:** a single d20 against a **target that rises with the tier**. **Untrained** at the top tiers succeeds only on a **natural 20 followed by a long-shot roll**. Long-shot odds, **decided (John 15 Oct 18:14)**: tier T-4 **1 in 10**, T-3 **1 in 100**, T-2 **1 in 1,000**, T-1 **1 in 5,000**, top **1 in 10,000**. The tier count and tier targets come from the existing grade data (mapped to the SK-5 named tiers).

### Order SK-5: skill XP by difficulty *(LitRPG / Story RPG only; tabletop stays SRD 5.2.1 with no skill XP; amended 17:41)*
**Acceptance tests:** see docs/orders/acceptance-tests-new-orders.md, section SK-5. Cursor: make these pass. XP numbers are in docs/design/skill-xp-table.md.
**Skill XP only:** it never feeds character-level XP (`characterXp.ts` is untouched).
**What exists (checked):** `src/game/rules/skillGrowth.ts` `settleSkillUse()`: a named skill gains **+1 use** per stakes-bearing use (no repeat in the same scene, at most one notice per turn), and the rank comes from `librarySkills.rankForUses(uses)` up to `NAMED_SKILL_RANK_CAP`, then evolution. The notice is `Skill rank up: <name> (rank n)` (`systemNotice.ts:23`). Character XP lives in `characterXp.ts` (separate, keep). **Extend, don't add a parallel system:** the per-skill `uses` counter becomes the skill's XP (`uses` gets a weighted increment); `rankForUses` thresholds are unchanged.
**Rule:**
- Weight per use = base × difficulty factor, on **success only**.
- **Difficulty factor**, from the task's tier minus the skill's rank, in bands borrowed from WoW:
  - **red/orange** (task 3+ above): ×1.5;
  - **yellow** (±2): ×1.0;
  - **green** (below, above grey): falls linearly to 0, as WoW's mob XP does;
  - **grey** (far below): ×0, so no growth.
  - The grey cutoff scales with rank, as WoW's grey level does.
- **Failure:** **0 skill XP**. A failed **crafting** attempt also **consumes part of the materials** attempted. **Decided (John 15 Oct): half, rounded down; the rest is returned.** Tabletop is unchanged: crafting failure is not an SRD 5.2.1 concept (SRD crafting has no check, p.103).
- **Untrained long-shot hit (SK-4, any tier):** a boost that **scales with log10 of the odds**. **Decided (John 15 Oct):** bonus = log10(N) / 4 of the **next level's** XP. So 1 in 10 gives 25% of a level and 1 in 10,000 one full level; overflow carries over; there is no cap.
- Tier and rank scales come from the existing grade data; the numbers above are proposals to tune in a test table.
**Sources (credit):**
- WoW mob/quest con colours: grey gives no XP, green is below, yellow is ±2, orange is +3–4, red is +5–9; lower-level XP falls linearly to zero at the "zero difference". https://warcraft.wiki.gg/wiki/Mob_difficulty_colors and https://warcraft.wiki.gg/wiki/Mob_experience
- WoW professions: "orange recipes always grant a skill point, yellow about 60% of the time, green rarely, grey never". https://warcraft.wiki.gg/wiki/Profession
- RuneScape colours combat levels ±10 from green (lower) to yellow (equal) to red (higher), but has **no difficulty band for skill XP** (fixed XP per action). https://runescape.wiki/w/Combat_level
**Done when:** unit tests show grey = 0, green < yellow < orange, failure = 0 (and half the craft materials lost), the long-shot bonus following the log curve, character XP unchanged, and tabletop untouched.
### SK-5 amendment: named tiers and levels *(John 15 Oct 18:13; non-tabletop only)*
**Acceptance tests:** see docs/orders/acceptance-tests-new-orders.md, section SK-5. Cursor: make these pass. XP numbers are in docs/design/skill-xp-table.md.
- **Tiers:** non-tabletop skills (LitRPG / Story RPG) have five named tiers: **Novice, Apprentice, Journeyman, Expert, Master**, each with **10 levels**, so **50 levels** in all.
- **XP per level** rises about **10% a level** (geometric): `xpForLevel(L) = base × 1.1^(L-1)`, so level 50 needs about 107× level 1 (target "about 100×"). Guide: the RuneScape and Skyrim curves (exponential growth per level); tune `base` in a test table.
- **The SK-4 tiers map to these named tiers** (target rising per tier; untrained long-shot at the top tiers).
- **Grey cutoff** for easy tasks stays: a task far below the skill's level gives 0 XP.
- **Long-shot boost:** log10(odds) ÷ 4 of the **next level's** XP (1 in 10,000 = one full level); overflow carries.
- **Failure:** 0 XP; a failed craft loses half the materials, rounded down.
- **Tabletop:** unchanged; crafting stays SRD 5.2.1 (no failure, p.103) with no skill XP.
- **Replaces** `librarySkills.ts` `NAMED_SKILL_RANK_CAP = 3` (:37) and `USES_FOR_RANK = [0, 2, 5, 9]` (:39) / `rankForUses` for non-tabletop modes: store the skill's XP and level instead of uses and rank. Library evolution (the technique at the cap) moves to **Master 10** unless John says otherwise; notices become `Skill up: <name>, <Tier> <n>`. Migrate saves with `uses`/`rank` to the matching level.

### SK-4 / SK-5 amendment 2 *(John 15 Oct 18:30–18:50; supersedes the earlier long-shot, per-use XP and untrained-at-low-tier text above)*
- **Untrained, low tiers:** an untrained skill vs a **Novice or Apprentice** task uses a **normal d20 roll vs the tier target + 5** (proposed raise; "higher DC" decided, the +5 is mine to tune). There is **no long-shot roll**. The long-shot roll applies **only at Journeyman, Expert and Master**: a natural 20, then **1 in 1,000 / 1 in 5,000 / 1 in 10,000**. The Novice 1/10 and Apprentice 1/100 odds are **retired**.
- **XP per use scales with the task level:** `useXp = 10 × 1.1^(taskLevel − 1) × band`, where band is: yellow (±2) 1.0; orange/red (3+ above) 1.5; green falls linearly to 0 at the grey cutoff; grey 0. The grey cutoff is kept (WoW formula, see `skill-xp-table.md`). An on-level success is worth 1/10 of that level's XP, so **about 10 on-level successes per level, about 500 to Master 10**.
- **Failure:** 0 XP; a failed craft loses half the materials (unchanged).
- **Long-shot success XP is based on the task's tier:** `boost = log10(odds) ÷ 4 × xpForLevel(first level of the task's tier)`; overflow carries through as many levels as it covers. Journeyman (L21 = 673 XP) × 0.75 = **505 XP**; Expert (L31 = 1,745) × 0.925 = **1,614 XP**; Master (L41 = 4,526) × 1.0 = **4,526 XP**. An untrained skill (0 XP) jumps to **level 5 / 11 / 18** respectively.
- **No stacking:** a long-shot win gets **only** the boost. The ×1.5 hard-task band and the normal use XP don't apply on top.
````


## q31-RC3 engine chips recognised by their builder and resolved action (Order RC-3)

1. **`src/game/choicePipeline.ts` `PURE_GENERIC_PAD` lines 361-363 at `1ec1f9f9`** - label regex for "pure generic" chips (wait / listen / look around / approach cautiously / inspect the surroundings �). What it did: let a chip skip the narrated-object test because of its wording. Replaced by the resolved action: a chip that resolves to an engine action and names no narrated object (`concreteChoiceObjects`, the object reader the grounding test already used) needs no grounding.
2. **`src/game/choicePipeline.ts` `isLegalEnginePad` lines 369-385 at `1ec1f9f9`** - the long exact-label regex (wait and watch / ask a direct question / press for leverage / check status / scout the exit / walk the battlement �) plus the `walk away from`, `walk on`/`turn back toward`, `offer a kindness`, `press � on the dispute` shapes. What it did: called a chip the engine's when its text matched; every new builder wording needed a new entry. Replaced by `engineChipLabels(state, story)` (the chips this state's builders made: compiler pads, beat and graph edges, hub pads, spine, scene fallbacks) and the resolved action above. The `travel to` / `talk to` shapes stay (allowed by the order).
3. **`src/game/choicePipeline.ts` `choiceNamesUnnarratedObject` line 418 at `1ec1f9f9`** - exact-label check against `spineEngineChipLabels`. Now part of the builder record.
4. **`src/game/intentEnums.ts` `inferIntent` lines 260-262 at `1ec1f9f9`** - the status rule, unreachable for "Check status" because the generic inspect rule ran first. Moved ahead of the inspect rule (one rule, not two).
5. Dead code, no caller anywhere: `src/game/choiceWarden.ts` `explainFilteredChoice` (lines 253-268), `src/game/intentEnums.ts` `getIntentLabel` (:293-298) and `isSocialIntent` (:349-362), all at `1ec1f9f9`.
6. Test pinned to the label reading (rewritten to the RC-3 rule): `playtest02dHangDebug` "legal engine pads are not invented-context". Restore with `git show 1ec1f9f9:<path>`.

## q31-N Malnutrition hold covers only Malnutrition levels (Order N)

1. **`src/game/recoveryRules.ts` `exhaustionAfterLongRest` line 165 at `d882c764`** - the hold `daysWithoutFood >= STARVE_DAYS` kept every Exhaustion level, including Extended Travel ones, while the character was starving. Replaced by the recorded count `character.malnutritionExhaustion` (+ each level the starvation tick adds, `travelJourney.ts` camp; reset to 0 on a full day's food via `fullDayFed`): a Long Rest removes 1 level when `exhaustion > malnutritionExhaustion` (SRD 5.2.1 p.185, p.181).
2. **`src/game/recoveryRules.ts` line 17 at `d882c764`** - `import { STARVE_DAYS }`, no other user in the file.
3. Test pinned to the old hold (rewritten to the Order N rule): `ttFix17.test.ts` "Malnutrition (the fifth day) still keeps it" (1 march + 1 starvation level expected both kept). Restore with `git show d882c764:<path>`.

## q31-E Levelling per mode on one XP engine + E.3 CR for engine-made foes (Order E)

1. **`src/game/xpRules.ts` `milestoneXp` lines 268, 272, 284 at `4be630c5`** - the scattered `mode === 'dnd'` / `mode !== 'dnd'` checks: tabletop got Hard ×1.25 and the 5% over-level cut (with `× 1.25 (Hard)` / `× 5% (level … vs area …)` on its maths line); the low-foe share was skipped only for `dnd`. Replaced by one per-mode row `MODE_XP` (`modeXpRow`): tabletop every multiplier 1, LitRPG / Story RPG keep the three, PYOA `xp: false`.
2. **`src/game/xpRules.ts` `milestoneXpBase` lines 297-298 at `4be630c5`** - `mode === 'rpg'` / `mode !== 'dnd'` table pick (PYOA fell into the LitRPG table). Now the row's `table`.
3. **`src/game/engineFight.ts` `encounterKind` lines 57-62 and `src/game/sandboxXp.ts` `encounterKind` lines 189-194 at `4be630c5`** - two copies of the same source/name tier rule. One export in `xpRules.ts`, also read by the E.3 CR.
4. **`src/game/rules/srdMonsters.ts` `statBlockForEncounter` line 144 / `realEncounterCr` line 153 at `4be630c5`** - the fought block used the guessed `DND_DEFAULT_CR` (1/4) while the payout returned null (`XP: none`) for the same foe. Both now read `realEncounterCr`: card CR, else SRD block, else `crForFoeLevel` (SRD 5.2.1 XP Budget per Character for the foe's level: Low for a common foe, High for a mini-boss / boss).
5. Test pinned to the old rule (rewritten to E.3, John's needs-john "an SRD block where one fits, a CR otherwise"): `ttFix3.test.ts` "fight XP pays from the real CR, never a guessed one" (`a nameless thing` expected null CR and `XP: none`). Restore with `git show 4be630c5:<path>`.

## q31-L1 LitRPG quest steps + RC-2 verb word lists (restore from parent of the q31-L1 commit)

1. **`src/game/questTargets.ts` `SEARCH_VERB` line 23** — `/\b(?:search|rummage|look around|investigate)\b/i`. Used only by `actionTakes` (:81). Deleted; find/inspect class comes from `parsePlayerIntent` (`search` | `observe`) via `actionMatchesObjective`.
2. **`src/game/questTargets.ts` `TALK_VERB` line 24** — `/\b(?:talk|speak|ask|tell|greet|approach|question|listen)\b/i`. Used only by `actionTakes` (:80). Deleted; meet class is `parsePlayerIntent` `talk` (intentParser already exports its own `TALK_VERB` for the packet — kept).
3. **`src/game/questTargets.ts` `actionTakes` lines 74-82** — private matcher replaced by exported `actionMatchesObjective` (chip / verb+object, intent class, named object). K, G-m57 and QV import this one helper.

## q31-Gm57 site objective opens the interior (restore from parent of the q31-Gm57 commit)

1. **`src/game/enterInterior.ts` `takesObjectiveHere` lines 26-31** — required `storyChip` text equality plus `objectiveOpensInterior`. Deleted; quest entry is `actionTakesDoorStep` (`targetSpot === 'door'` + chip/named/`tabletopStepIsDoor`), not story-chip equality.
2. **`src/game/enterInterior.ts` `objectiveOpensInterior` classifyVerb spoke/parleyed/inspected branches (lines 38-42) and INTERIOR_CUE/placeAllowsDungeon fallback for look/search** — entry was decided from verb class + cue regexes. Deleted those branches; talk is `parsePlayerIntent` `talk`; bare observe/search of the outside never opens; quest open is the door-step record. `classifyVerb` import removed from this file.
3. **`src/game/enterInterior.ts` `storyChip` import** — only used by deleted `takesObjectiveHere`. Removed.

## q31-SK123 hidden ranks / distinct skill jobs / individual stealth (restore from parent of the q31-SK123 commit)

1. **`src/game/bindingConstraints.ts` `formatBindingConstraintsForPrompt` lines 290-305 at parent** — built the BINDING CONSTRAINTS prompt block from `BindingConstraint[]`. No production caller (`warden` uses `buildBindingConstraints` + detect/repair only). Cut to keep ruleCount TOTAL flat; the shape lives in `actionValidation.test.ts` as `bindingPrompt` for the two assertions that still pin the header.

## q31-EKIT class starting kits (SRD 5.2.1 Choose A or B)

1. **`src/game/tabletop/characterBuild.ts` CLASS_KITS gold rows** — eleven classes stored SRD option B as id `coin` ("Coin instead") instead of id `B`. Replaced by id `B` with empty gear and GP label (legacy `kitDef('…','coin')` maps to gold-only B). Fighter keeps id `coin` as SRD option (c) 155 GP.
2. **`src/game/tabletop/characterBuild.ts` Druid kit A** — listed both `Quarterstaff` and `Druidic Focus` while SRD 5.2.1 says `Druidic Focus (Quarterstaff)` (one item). Dropped the separate `Druidic Focus` row; Quarterstaff remains (also matches focus detection via `staff`).

## q31-RCQT1 chip-equals-step never ticks (Order RC-QT1)

1. **`src/game/questTargets.ts` `actionMatchesObjective` lines 86-87 at parent** — `if (chip && chipKey(action) === chipKey(stepChip(step))) return true`. What it did: any action whose label matched the step chip counted as a find/meet match (callers with a loose spot could tick from the pad alone). Why safe: ticks still require `targetSpot === true` plus named-object / find|meet intent in the same matcher; place/check/contact outcomes remain. Restore-from: parent of q31-RCQT1.
2. **`src/game/enterInterior.ts` `actionTakesDoorStep` lines 51-52 at parent** — `if (chip && chipKey(action) === chipKey(stepChip(step))) return true` (+ local `chipKey` / `stepChip` import). What it did: the step chip alone opened the interior. Why safe: move/enter cues and `actionMatchesObjective` / `tabletopStepIsDoor` still open when the record says the player is at the door. Restore-from: parent of q31-RCQT1.
3. **`src/game/storyRpgProgress.ts` placeless decision tick (lines 274-275 at parent)** — `!!decision && chipKey(action) === chipKey(decision)` completed "Pick an approach" / "Commit to the heist night" on pad alone (lap32 F). What it did: decision chip label = quest stage. Why safe: chip still offered to start the scene; place steps still tick at the named place; contact favour still ticks through a person. Restore-from: parent of q31-RCQT1.

## PLANNED cuts (not yet deleted; queued 16 Oct 07:02, queue 31): RC-K2, RC-PY2
Each order replaces this PLANNED entry with the full logged record (file, old line, old text, what it did, why safe, restore-from commit) when it ships.
- RC-K2 (src/game/pyoaSpine.ts): fuzzy label / 18-char / id-word matching in `matchSpineExit` (~:329); its `fuzzyExitMatch` use; the `isSpineDelayPad` regex. Covered by: the picked chip id is the exit id; `applyExit` builds receipt + fact from exit data; exits declare requires/gives.
- RC-PY2 (src/game/writerTurn.ts `withMoveDestination` ~:236-246): the `prose.toLowerCase().includes(dest)` substring guard and the `isRoadLabel` label test. Covered by: arrival rendered from the place record, added or skipped by a turn-record flag.

## q31-RCM2 (Order RC-M2) — writer kind is the route; seat identity is the model id
1. **`src/game/autoplayWriter.ts` `resolveFlashLiteAutoplayWriter` hard-coded `kind: 'flash-lite'`** (old ~:123) and `resolveAutoplayWriter` re-stamping the CLI alias over the resolved override. What it did: every OpenRouter model (DeepSeek, GPT, …) wrote `meta.writer.kind = "flash-lite"`. Why safe: CLI `--writer flash-lite|openrouter` still selects the OpenRouter client path; resolved `kind` is now always `openrouter` (route name); seat identity is `model`. Restore-from: parent of q31-RCM2.
2. **`scripts/writerDataset.mjs:84` `writerId = meta.writer?.kind ?? 'default'`**. What it did: dataset rows labelled both seats `flash-lite` even when `model` differed. Why safe: `datasetWriterId` reads `meta.writer.model` (fallback kind only for `default`). Restore-from: parent of q31-RCM2.
3. **`src/game/autoplayWriter.ts` `resolveFlashLiteCritic`** — thin wrapper that only called into the same body now on `resolveAutoplayCritic`. Deleted so ruleCount fns does not rise with `datasetWriterId`. Restore-from: parent of q31-RCM2.

## q31-RCJ1 (Order RC-J1) — absolute per-run prose thumbs are diagnostic only
1. **`scripts/fate-autoplay/autoThumbs.mjs` absolute `--notes` path as a training label** (old judge loop ~:195-221 at parent). What it did: one model, one pass, batches of 20, absolute up/down per run — lap 32 A/B swung 2 vs 9 ups on the same Tabletop pair. Why safe: absolute `--notes` still writes diagnostic thumbs for report.md; training labels require `--pair` (blind X/Y, asked twice with order swapped, keep only on agreement, floor `PAIR_AGREEMENT_FLOOR` 0.7); `distillCollect` requires `training_label === true`. Restore-from: parent of q31-RCJ1.

## PLANNED cuts (not yet deleted; queued 16 Oct 07:06, queue 31): RC-N4 (RC-N3 deletes nothing; RC-M2 and RC-J1 shipped). RC-K2 and RC-PY2 above are PARKED (not queued).
- RC-N4 (src/game/engineFactGate.ts `recordReadoutProblem` :42-51): `questStepLeak` and `questTitleNamed` word-overlap tests. Covered by: the packet no longer carries raw step text or leg/time bookkeeping; gate only on exact record strings.
