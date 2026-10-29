# MERGE-SEAMS audit — "two owners of one fact"

Audited at `main` `7c34bc7c` (2026-10-29). Read-only static analysis; no AI turns spent, nothing fixed.
Method: TypeScript-AST scan of every non-test `src/**/*.ts(x)` for writers of tracked `GameState`/`SceneFacts`/`NpcMemory` fields
(`scripts/audit-writers.cjs`, output in the appendix), import-graph reachability of the two turn orchestrators
(`scripts/audit-reach.cjs`), `node scripts/sync-gm-edge-shared.mjs --check`, export diffs of every hand-authored edge stub against its `src/game` original,
a cross-file scan for duplicated regex literals and same-named constants, and targeted greps for prose/regex-derived reads and authored-text speech paths.
"Writer" = a direct assignment, or a property in an object literal that spreads existing state (a state patch). It over-counts a little (harness, fixtures, return-shape literals) and under-counts writes made through helper functions that take the field name dynamically.

Verdict in one paragraph: the one-owner-per-fact rule is broken most badly for **who is present / has left a scene** (23 writer files for `sceneFacts.present`, 6 for `NpcMemory.present`, 4 independent writers of `shouldExit/exitReason`, and 36 files reading `lastKill` against 8 reading `shouldExit`), for **the turn commit itself** (`useGame.ts` and `fateAutoplay.ts` are two orchestrators that copy fields by hand), for **the edge copies** (8 hand-written stubs whose behaviour differs from src, excluded from the drift check), and for **"is the scene empty / alone"** (four separate prose-regex derivations). These are the same shapes that produced T10AI–AR.

---

## Ranked risk list

Each item: where it is, why it is a risk, proposed single owner.

### HIGH

**H1. Presence and NPC exit have no single writer or reader.**
- Writers of `sceneFacts.present`, 23 files: `combatAuthority.ts:239,462`, `crowdAuthority.ts:506-579`, `encounterTerminalFsm.ts:355`, `errorRepairWarden.ts:408,447`, `hereSpot.ts:167`, `narrativeHarvest.ts:306`, `npcMemory.ts:382,833`, `openThreads.ts:516`, `presentAuthority.ts:137`, `saveMigration.ts:79`, `sceneFacts.ts:72,329,461`, `stealParley.ts:474`, `travelJourney.ts:1829,2115`, `useGame.ts:5366`, `vignetteLock.ts:207,230,274`, `openingPointerCard.ts:414-425`, `openingPin.ts:143`, `arcDirector.ts:1267`, `tagTrigger.ts:47,65`, `timeline.ts:90`.
- A second presence fact lives on the record: `NpcMemory.present` (`types.ts` NpcMemory), written by `encounterTerminalFsm.ts:346`, `npcMemory.ts:650`, `npcRecords.ts:305`, `stealParley.ts:446-461`, `tabletopQuestProgress.ts:222`, `travelJourney.ts:1807`. Also `crowd` (7 files), `anonymousRoles`, `leftBehind`, `hereSpot`.
- Exit fields `shouldExit/exitReason` are written independently by `encounterTerminalFsm.ts:344-346`, `npcMemory.ts:815-816` (quest-accepted), `openThreads.ts:504-505` (stall-pressure), and `npcLifecycleFsm.ts:198,218` has a *different* lifecycle state machine for the same event (`entering → exiting → absent`) that is not the field `peopleHere` reads.
- Reader side: `peopleHere` (`scenePresence.ts:65-114`) is the one reader, but it is a union of six sources (presence record, companions, `activeEncounter`, opening cast, road meeting, memories by location) with special cases (`crowdDepartedByRecord` branch at :70-90, `UNDERWAY_HERE` special case at :79-86). Each past bug (T10AI, T10AN, T10AQ-fix) added another branch. "Is this foe gone" is read from `sceneFacts.lastKill` in 36 files but from `shouldExit` in 8, so a corpse can be gone in one and talkable in the other (T10AP). `talkEnvelope.ts:190-194` has its own corpse rule on `lastKill`.
- Proposed single owner: extend `presentAuthority.ts` into the only module that may seat, unseat or exit an NPC (`seat(npcId)`, `exit(npcId, reason)`), with `NpcMemory` as the record and `sceneFacts.present`/`crowd` *derived* from it. `lastKill` becomes display only.

**H2. Two turn orchestrators commit state by hand-copied field lists.**
- Live: `useGame.ts` (6,499 lines). Harness that T10 rounds exercise: `fateAutoplay.ts` (3,002 lines), sharing only `runTurnSpine`. Their field lists are written separately: `useGame.ts:4658-4670` vs `fateAutoplay.ts:1895-1905` (travel commit) — T10AQ's death/`travelBeat` copy had to be added to the harness copy by hand. `fateAutoplay.ts:2127-2129` rebuilds presence/crowd, `:2208` runs `dropAbsentListenerChips`, `useGame.ts:4643` does the same independently.
- Modules reachable from live play but not from the harness (so T10 rounds never exercise them): `mainQuestEnd.ts` (writes `playPhase`), `npcCrossIntegration.ts` (writes a separate `npcRelationships`), `ledgerTrap.ts`, `locality.ts`, `campaignMemory.ts`, `combatReceipt.ts`, `questJournalEnrich.ts`, `ledgerRevision.ts`, `rules/awayRest.ts`, `salvage.ts`, `semanticMemory.ts`.
- Risk: a fix that passes T10 rounds can be absent or different in the shipped path. The reverse also holds: harness-only commit code can hide a live bug.
- Proposed single owner: one `commitTurn(state, result)` function (new module) holding the field copy list, called by both `useGame.ts` and `fateAutoplay.ts`; add a harness-vs-live parity test for it.

**H3. Edge stubs change behaviour, and the drift check skips them.**
- `node scripts/sync-gm-edge-shared.mjs --check` reports "edge copies match" while skipping 8 hand stubs: `openingEstablishment.ts` (398 vs 3,393 lines), `travelJourney.ts` (163 vs 2,143), `placeNames.ts` (10 vs 212), `talkEnvelope.ts` (4 vs 270), `spokenAnswer.ts` (30 vs 881), `skillGates.ts` (3 vs 268), `litrpgSystemWindow.ts` (164 vs 311), `settlementQuestCards.ts` (6 vs 424). Stub export names are all present in src (no stub-only names except `UNDERWAY_HERE`); signatures and behaviour are not checked.
- Behaviour that differs on the edge:
  - `openingEstablishment.ts:180` `openingCastStillHere` always `false`, src `:1323` is conditional on the opening card place and travel.
  - Edge `openingCastNames` (`:168`) is a different algorithm (reads `present[]` and regexes the hook prose); src is `:1331`. So edge `peopleHere` (`scenePresence.ts:105-117`) differs from the client's.
  - `spokenAnswer.ts` (edge) `ensureSpokenAnswer` returns the prose as-is, `stripSpeakerSilence` and `demandActAnswered` do nothing, so every T10AL/AM/AO/AP/AR speech fix exists only in src. `talkEnvelope.ts` `spokenTalkFallback` returns `''`. `skillGates`/`placeNames` return empty lists.
  - `travelJourney.ts` (edge) holds hand-copied `travelBeatFact` (:15), `roadDeathBookProse` (:21, added by T10AQ), `ROAD_LABELS` (:35, hard-coded 7 labels; src derives it from `GROUND_LABEL` at `travelJourney.ts:121-129`) and a second `UNDERWAY_HERE` (:31, also exported from `locationName.ts:32`).
- When it bites: `gm-turn/index.ts:355-360` rebuilds the packet on the edge if `state.completedEvent` is missing, using the stubs. The client normally sends the packet, so this is a latent path, and the harness never runs the edge at all (only the boot probe does).
- Proposed single owner: no stub that re-implements logic. Split the pure core of each module (`openingCast.ts`, `roadDeath.ts`, `spokenAnswer` core) so the edge imports the real file; or make the edge refuse a turn with no client packet instead of rebuilding.

**H4. "Alone / empty scene" and presence are inferred from prose by four different readers; prose also writes state.**
- Readers on prose + regex: `choicePipeline.ts:185-198` `isAloneOrEmptyScene` (`/\b(nobody|no one|alone|empty|…)\b/`), `stanceDensity.ts:114-125` `isAloneScene` (identical copy), `choiceWarden.ts:103-108` (same regex, inline), `chipRules.ts:66-77` `EMPTY_ROOM`, `sceneManifest.ts:16` (uses only `aloneArrival`). Same word-list regex lives in `choicePipeline.ts:191` and `stanceDensity.ts:119`; they have already diverged in inputs (crowd stamp checked in stanceDensity only).
- Writers from prose: `narrativeHarvest.ts:243-308` builds `present[]` from the writer's prose, then `harvestCrowdIntoSceneFacts` (`crowdAuthority.ts:500-580`), `harvestRoleOccupancy` (`closedScenePerson.ts:245`), `applyClosedFactHarvest` (`closedFactLedger.ts:91`) all parse prose. T10AI-2 (`\bno one\b` matching "no one else") was exactly this class. Time of day does the same: `sceneFacts.ts:139-143` reads dawn/dusk words from prose, guarded only when `worldHour` is a number (`:366-367`).
- Proposed single owner: `sceneOccupancy(state)` computed from engine state only (inside the H1 presence authority); chips, warden and stance all call it. Prose harvest may add unnamed flavour, never clear or replace seated people.

**H5. Death and "the run ended" are represented four ways, with a guard that cannot see one of the writers.**
- `deathSaves.dead` (`rules/death.ts:244-248`) is meant to be the one writer; `selfKillGuard.test.ts:83` enforces it by searching for the literal `dead: true`. `rules/roundCombat.ts:1395` sets `state.dead = true` (assignment) and `tabletop/roundFight.ts:553,628,674,706,722,726` write `deathSaves` directly, so the guard passes while the "one death point" rule is not actually enforced (the death-save roll in `roundCombat.ts` is arguably a legitimate input, but the guard cannot tell).
- `playPhase === 'ended'` is a second death/ending flag written by `playPhase.ts:34-54`, `useGame.ts:4667`, `mainQuestEnd.ts:90`, `pyoaSpine.ts`, `pyoaEndingGates.ts:440`, `saveMigration.ts:110`, `rules/death.ts:133`, read in 11 modules. `hp <= 0` is tested in 9 modules.
- The death page has three producers: `travelJourney.ts:1844` `roadDeathBookProse`, `useGame.ts:3785`, the harness end rule `fateAutoplay.ts:2247`, plus the edge copy (H3).
- Proposed single owner: `rules/death.ts` exports `isDead(state)` and `commitDeath`; a guard that bans `deathSaves`/`.dead` writes outside it (AST, not text).

**H6. Fight resolution is five engines and three copies of "is this an escape / parley / attack".**
- Engines: `engineFight.ts` (LitRPG), `tabletop/roundFight.ts` + `rules/roundCombat.ts` (tabletop), `ledgerCombat.ts`, `combat.ts`, `oneCameraFight.ts`; end-of-fight state goes through `encounterTerminalFsm.ts` (T10AP). `hp` is written by 26 modules.
- The flee regex `/\b(flee|run away|escape|retreat|withdraw|bolt)\b/i` is defined three times: `encounterTerminalFsm.ts:93`, `engineFight.ts:41`, `travelJourney.ts:1000`; the parley regex twice (`encounterTerminalFsm.ts:97`, `engineFight.ts:42`). T10AP's "Face chip is not an attack" was this seam.
- Proposed single owner: `encounterTerminalFsm.ts` classifies intent (`classifyFightIntent`) and is the only module allowed to end an encounter or write exit fields; others import it.

**H7. Authored speech reaches the page through three composers and four call sites.**
- `spokenAnswer.ts` `spokenExchangeLine` (:189, called :851,:870) builds a line from the NPC ledger (`need`, agenda, motive bank `npcMotiveLines.json` via `npcSheet.ts:7`, pool at :221-247); `talkEnvelope.ts:175` `spokenTalkFallback` composes another line from `manusTopicBanks` (and its own corpse rule). `ensureSpokenAnswer` runs at `writerTurn.ts:252`, `writerTurn.ts:353` and `completedEventPacket.ts:2440`; `spokenTalkFallback` at `completedEventPacket.ts:1271,2307,2353,2490`. `manusTopicBanks` is imported by `npcMemory.ts:8` (writes role lines into `facts`), `spokenAnswer.ts:16`, `talkEnvelope.ts:29`, `writerTurn.ts:41`.
- Role-template `need` text is read in `spokenAnswer.ts:221`, `openThreads.ts:81`, `sceneAffordances.ts:296`, `questGenerator.ts:163`. T10AL/AM/AO/AR each fixed one call path of the same "ledger need used as a reply" mistake.
- Proposed single owner: one `composeNpcLine(state, speaker, input)` (new, pure) used by every fallback; the ledger need is allowed only for an addressed ask.

### MEDIUM

**M1. Location is a string key with 64 write sites and a magic road sentinel.** `currentLocation` is written in 19 files (`travelJourney.ts` 19, `useGame.ts` 10, `fateAutoplay.ts` 5, `dungeonCard.ts` 4, `dungeonLifecycle.ts` 4, …). `UNDERWAY_HERE = 'On the road between places'` (`locationName.ts:32`) is compared in 7 modules (`combatAuthority`, `npcRecords`, `sceneContextTail`, `scenePresence`, `travelJourney`, `turnCheck`, `locationName`). The sentinel is one shared stamp for all roads, which is what reseated Merrit Pike in T10AQ. `locationSheet` (8 files), `places` (17 files), `mapFocusPlace`, `placeVisitLog`, `worldAtlas`, `journey` each hold part of "where am I". Owner: `placeAuthority.moveTo(state, place)` as the only writer of `currentLocation`; the road becomes `state.journey`, not a location string.

**M2. `travelJourney.ts` (2,143 lines) is a god module that owns the world clock.** `advanceClock` lives there and is imported by `rules/death.ts:147,197,235`, `tabletop/downtimeTurn.ts:133,202`, `tabletop/roundFight.ts:673,726`, `recoveryRules.ts:89,193,241`, `lockAttempt.ts:280`, `rules/awayRest.ts:63`. The same file writes `present`, `crowd`, `hereSpot` (:2089-2117), `npcMemories` (:1807), `gold` (:1045), hp, inventory, `journey`, `roadDay`. `worldHour/worldDay/roadDay` are copied by hand in `useGame.ts:4661-4663` and `fateAutoplay.ts:1896-1898`. Owner: `worldClock.ts` (clock, day, time of day); travel only asks it to advance.

**M3. Chips and options: 14 modules (~9,000 lines), two final filters.** `choiceCompiler` (1,375), `choicePipeline` (1,492), `choiceRanking` (717), `choiceEdge`, `choiceWarden`, `chipLegality` (347), `chipRules`, `chipCheck`, `graphChoices`, `padUniverse`, `sceneAffordances` (1,449), `beatCommitGate`, `choiceTierRules`, `choiceJournal`. Each derives presence itself (H4). `choices` is written by `useGame.ts` (12 patches) and `fateAutoplay.ts` (8). `chipProblem` (`chipLegality.ts:175`) is applied at `turnCheck.ts:139,570`, `chipLegality.ts:322,333`, `useGame.ts:4643`, `fateAutoplay.ts:2208`, but ordering vs `applyOptionCooldown` (`sceneAffordances.ts:821`) is not enforced (T10AR picker bias). Owner: one `finalizeChoices(state, candidates)` called last by both orchestrators.

**M4. Quests live in four ledgers.** `quests` (18 writer files: `arcDirector`, `questGenerator`, `questPlay`, `tabletopQuestProgress`, `storyRpgProgress`, `questRoutes`, `useGame`, …), `openThreads` (`openThreads.ts`), settlement quest cards on places (`settlementQuestCards.ts`, edge stub is a no-op), `commitments` (`stateTx`). Owner: `questJournal` as the only writer; the others become views.

**M5. NpcMemory is a god record with parallel fields.** Attitude is held as `disposition`, `attitude`, `currentMood`, `relationshipStatus`, `stance`, `persona`; motive as `need`, `goal`, `sheet.need`, `motiveLines`; "told" as `facts`, `completedTopics`, `said`, `introSpoken`. 25 files write `npcMemories`. `state.relationships` is only ever initialised (`defaults.ts:121`) while `npcCrossIntegration.ts:268` writes a different `npcRelationships`. Owner: `npcMemory.ts` mutation API; pick one of each parallel field and migrate.

**M6. Campaign-specific (PYOA/Thornferry) rules sit in shared presence paths.** `closedScenePerson.ts:75-77,134` (`isThornferryClerkSite` used by `harvestRoleOccupancy`, which writes `anonymousRoles`), `presentAuthority.ts:26-39` (`locationsEquivalentForPresence` hard-codes Mill Landing/The Ford/Harbor Quay), `beatContract.ts:185-244`, `chromeAuthority.ts:66-69`, `entityRegistry.ts:31`. They run in every mode; T10 rounds use other bibles, so these branches are never exercised. Owner: PYOA rules behind a campaign hook in `campaignContract`.

**M7. Final-prose passes are duplicated.** `narrativeScrub.ts:234-240,301` and `proseWarden.ts:766-772,779` hold identical regexes ("someone nearby does…", "opens onto the speaker"); `stripUnauthorizedNpcSpeech` (`intentParser.ts:712`, called `writerTurn.ts:763`) and `stripSpeakerSilence` (`spokenAnswer.ts:526`, called `spokenAnswer.ts:788,876` and `writerTurn.ts:592`) both rewrite speech. T10AK/AL were ordering bugs between these passes. Owner: one `sealPage(prose, packet)` pipeline with a documented pass order and one regex table.

### LOW

- **L1. `gold` vs `purse`.** Two fields, but `rules/coins.ts:117-134` (`purseOf`/`settlePurse`) folds `gold` deltas into the purse by design. `merchant.ts:181,210,253,287`, `travelJourney.ts:1045`, `rules/death.ts:136,220,235` and `useGame.ts:2731,4703` write `gold` only, which is fine as long as `settlePurse` runs once per turn. Owner already exists; add a test that no module writes `purse` outside `coins.ts` (today `merchant.ts:206` and `tabletop/downtimeTurn.ts:133` do).
- **L2. Duplicated constants and regex.** `SHOUTING` (`factLocks.ts:24`, `sceneFacts.ts:22`), `NAME_STOP` (`openingEstablishment.ts:2177`, `openingPointerCard.ts:43`), `WRITER_RHYTHM_WINDOW/CHAR_CAP` (`beatContract.ts:393`, `completedEventPacket.ts:266`, both on the edge), `DANGEROUS_TIER` (`rules/exploration.ts:65`, `travelJourney.ts:519`), `TALK_CHIP` (`choiceCompiler.ts:1349`, `optionDiversityContract.ts:174`), crowd-token list (`crowdAuthority.ts:31`, `sceneFacts.ts:107`), attitude regexes (`factionStandings.ts:218-226`, `npcMemory.ts:225-231`). 27 regex literals appear in more than one file; 25 same-named constants, 15 with different values (most harmless, e.g. `DB_NAME`).
- **L3. Harness-only state writes.** `fateAutoplay.ts:755,769,1896-1904,2127-2129,2319` write state fields outside the shared commit (see H2); keep them out once `commitTurn` exists.
- **L4. `timeline`/`entityRecords`** (8 and 4 writer files) duplicate NPC facts already in `npcMemories`; they feed the writer context, not the page.

---

## Should we add a gate test that enforces single writers? Yes.

Proposal, cheapest first (each is a vitest test in the main gate, ratchet style: the current set is the allow-list, new writers fail):

1. **Single-writer ratchet (AST).** Check in `scripts/audit-writers.cjs` logic as `src/game/singleWriter.test.ts` with an allow-list per guarded field (`sceneFacts.present`/`crowd`, `NpcMemory.present`/`shouldExit`/`exitReason`, `deathSaves`, `playPhase`, `currentLocation`, `worldHour/worldDay/roadDay`, `purse`). Starts at today's counts (e.g. 23 files for `present`) and may only go down; the H1/H5 refactors then shrink the lists to one entry. This would have flagged T10AP (a fourth exit writer) and the `roundCombat.ts:1395` death bypass. Replace the text search in `selfKillGuard.test.ts:83` with this AST check.
2. **Stub parity.** Test that every stub export matches the src export's parameter count, that stubs define no constant that also exists in src (`UNDERWAY_HERE`, `ROAD_LABELS`), and that the stub list in `sync-gm-edge-shared.mjs` does not grow without a recorded reason.
3. **Orchestrator parity.** After `commitTurn` exists (H2): a test that both `useGame.ts` and `fateAutoplay.ts` call it and that neither spreads travel/death fields by hand.
4. **No new prose-regex presence reads.** A ban list: any `.test(...)` on a variable named `prose|story|storyProse|recentStory` inside a function that returns presence/alone/empty must go through `sceneOccupancy` (lint-style grep; approximate).
5. **Speech composer rule.** Test that quoted authored NPC lines (`asSpokenAgenda`, `authoredTopicsFor`, motive bank) are only imported by the one composer module.

Suggested order if John wants fixes: H1 + H5 (state owners, with the ratchet test), then H2 (shared `commitTurn`), then H3/H4. H6/H7 once the presence owner exists.

---

## Appendix A — writer counts per tracked field (files / hits), non-test `src`

Generated by `node scripts/audit-writers.cjs "<fields>" out.json`.

| Fact | Field(s) | Writer files | Notes |
|---|---|---|---|
| Presence | `present` | 24 | 23 excluding a fixture |
| | `crowd` | 7 | |
| | `anonymousRoles` / `leftBehind` / `hereSpot` | 2 / 1 / 3 | |
| | `sceneFacts` (any patch) | 36 | |
| NPC memory / said | `npcMemories` | 26 | |
| | `said` | 1 (`npcMemory.ts:1066,1115`) | readers: `spokenAnswer`, `turnCheck` and others |
| | `shouldExit` / `exitReason` | 3 / 4 | |
| Location | `currentLocation` | 19 (64 hits) | |
| | `locationSheet` / `places` / `placeVisitLog` / `mapFocusPlace` | 8 / 17 / 4 / 2 | |
| HP / death | `hp` | 26 (27 with a fixture) | |
| | `deathSaves` | 3 (`death.ts`, `roundFight.ts`, harness) | |
| | `playPhase` | 7 | |
| Inventory | `inventory` | 23 | |
| | `gold` / `purse` | 9 / 4 | |
| Quests | `quests` | 18 | |
| | `openThreads` | 1 | |
| Time | `worldHour` / `worldDay` / `roadDay` / `timeOfDay` | 3 / 2 / 3 / 2 | clock owner is in `travelJourney.ts` |
| Travel | `journey` / `travelBeat` | 4 / 2 | |
| Chips and options | `choices` / `offeredPad` / `recentOfferedActions` | 5 / 5 / 1 | |
| Fight | `activeEncounter` / `roundCombat` / `lastKill` | 13 / 3 / 3 | `lastKill` has 36 reader files |
| Packet | `completedEvent` / `sealedManifest` | 4 / 1 | |

## Appendix B — import-graph reachability

`useGame.ts` reaches 414 modules and `fateAutoplay.ts` 377; 105 of the modules each imports directly are shared. Reachable from live only (game modules): `awayRecap`, `campaignMemory`, `combatReceipt`, `ledgerRevision`, `ledgerTrap`, `locality`, `mainQuestEnd`, `npcCrossIntegration`, `outcomeToken`, `questJournalEnrich`, `rules/awayRest`, `salvage`, `semanticMemory`, `tutorialBeats`, `writerPolicy` and UI/image/comic modules. Harness only: `evalHarness`, `invariants/turnInvariants`, `liveDrive`, `readabilityGate`, `receiptTelemetry`.

## Appendix C — edge stubs (not checked for drift)

| Stub (edge `_shared/gm/`) | Stub lines | src lines | Behaviour |
|---|---|---|---|
| `openingEstablishment.ts` | 398 | 3,393 | `openingCastStillHere` = false; `openingCastNames` different algorithm |
| `travelJourney.ts` | 163 | 2,143 | road meeting hooks empty; hand-copied `roadDeathBookProse`, `travelBeatFact`, `ROAD_LABELS`, `UNDERWAY_HERE` |
| `spokenAnswer.ts` | 30 | 881 | `ensureSpokenAnswer` returns prose unchanged |
| `talkEnvelope.ts` | 4 | 270 | `spokenTalkFallback` returns `''` |
| `skillGates.ts` | 3 | 268 | `gateFactLines` returns `[]` |
| `placeNames.ts` | 10 | 212 | both functions return `[]` |
| `litrpgSystemWindow.ts` | 164 | 311 | partial |
| `settlementQuestCards.ts` | 6 | 424 | `seedSettlementQuestCards` returns the place unchanged |
