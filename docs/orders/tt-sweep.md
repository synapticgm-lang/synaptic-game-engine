# tt-sweep — Part B: whole-game sweep (14 Oct 2026)

Order: `docs/orders/tt-sweep-order.md` (Part B of tt-consolidate; Part A is `docs/orders/tt-consolidate.md`).

## Result

- **Shipped.** Commit `227ba7cc` on `main`, pushed.
- **Stamp:** `2026-10-14p` → `2026-10-14q`. This is a play change: the opening's random name and place picks now repeat for the same save.
- **Live:** `https://www.synapticgm.com/version.json` read `{"hud":"2026-10-14q","build":"2026-10-14q"}` at 19:34, about 40 seconds after the push.
- **Edge:** no edge code changed. Neither touched file is synced: `librarySkills` is stubbed on the edge, and the edge `openingEstablishment` is a separate stub. `sync-gm-edge-shared --check` reports "edge copies match". No `gm-turn` deploy.
- **Fix run:** one. No retries.

## How the sweep was done (check first)

Step 8 (`docs/orders/tt-build-8-audit.md`, commit `16d41921`) already audited every setting, button, tab, panel and system on 13 Oct. This sweep:

- re-checked Step 8's open items;
- checked everything that has landed since then (Steps 5–9, travel, coin and credits, the library jobs, the tt-fix rounds and tt-consolidate).

Checks run:

1. **Markers.** TODO / FIXME / stub / "coming soon" in `src` (tests excluded). Every hit was either a word inside a rule or prose, or an item Step 8 already listed.
2. **House-rule settings.** Every field of `rules/houseRules.ts` traced to an engine reader. All 21 are connected:
   - `startingLevel` and `statMethod` → `creationFlow`;
   - `deathRule`, `secretDeathSaves`, `diceVisibility` and `soloScaling` → `roundFight`;
   - `travelPace` → `travelPace` / `travelJourney`;
   - `restVariant` → `recoveryRules` / `awayRest`;
   - `critRule`, `cleave` and `flanking` → `roundCombat`;
   - `heroicInspiration` → `recoveryRules` / `roundFight`;
   - the three pillar sliders → `arcDirector` / `travelJourney`.
3. **Dice theme and effect mode (Step 9c).** `DiceAnimationMode` is read by `CenterPanel`, `RollDie`, `DiceTrayToolbar`, `DiceFormulaBuilder` and `rollView`. Connected.
4. **Save fields added since Step 8.** All 50 have a reader. The six with only one reader outside `types.ts` were traced by hand: `approvalWarnings`, `budgetXp`, `hoursSinceCheck`, `jobsRolledDay`, `pcJob`, and `leg`, which is only a local name.
5. **Library jobs.**
   - `fuse.js` is used through `typedNameMatch`, and four modules read it.
   - zod: `parseGmTurnResponse` is read by `gmProxy`, and `saveFileProblem` by `db`.
   - **Not done:** `parseSkillEntries` had no caller. Fixed below.
   - **Not done:** `Math.random` was still in game logic. Fixed below.

## FIXED

### 1. Opening random name and place were not seeded (library job 3 left half done)

- **Cause.** `openingEstablishment.pickRandom` used `Math.random`. Two openings on the same save could therefore differ, and replays of an opening could not reproduce it:
  - "Random name" in the opening;
  - "a random place";
  - the Earth origin place (summoned-pact);
  - the place fallback for a campaign with no starting location.
- **Mechanism.** `pickRandom` draws from `seededRng.hashUnit`, keyed on the save seed (else the save id), the turn, and the field. That is the same shared home every other engine roll uses.
  - `pickEarthPlace(state?)` takes the state.
  - `pickPlaceForCampaign` reuses `pickEarthPlace` instead of a second copy.
- **Modes:** all three (LitRPG summoned-pact uses the Earth origin pick).
- **File:** `src/game/openingEstablishment.ts:127` (`pickRandom`), `:239` (`pickEarthPlace`), `:262`, `:2917`, `:3230`.

### 2. Skill library loaded with a cast, not its zod schema (library job 2 left half done)

- **Cause.** `rules/librarySkills.ts` loaded the four skill JSON batches as `as unknown as LibraryEntry[]`. The schema built for this edge (`schemas.parseSkillEntries`, `SkillEntrySchema`) had no caller. A malformed entry would have reached the engine unchecked.
- **Mechanism.** `LIBRARY_ENTRIES` now goes through `parseSkillEntries` at load.
  - All 122 real entries were checked against the strict schema before wiring: 0 failures.
- **Modes:** LitRPG named skills, plus the skill matching every mode reads.
- **File:** `src/game/rules/librarySkills.ts:28`.

## LISTED (not fixed this session)

| Item | Mode | File:line | Owner | Reason |
|---|---|---|---|---|
| Shop "Buy (soon)" grants packs with no payment | all | `src/components/CapacityPackShop.tsx:280`, `src/game/subscriptionTiers.ts:56` (`shopLive`) | payments | Product decision and live Stripe secrets |
| `createCheckoutSession` unreachable; `create-checkout` edge fn; `package_receipts` table unused | all | `src/game/stripeCheckout.ts:20` | payments | Same payments job |
| Rewarded ads grant turns with no ad (stub provider) | all | `src/game/rewardedAds.ts:44`, `:219` | ads | Needs an ad provider (AppLixir / AdMob kids) |
| `situationPacket.ts` (SNAPSHOT, recovery mandate, progress governor, pressure clock, power scaling) is orphaned — no importer | all | `src/game/situationPacket.ts` | writer packet | Wiring it changes the writer packet; needs its own step and a writer-quality gate |
| Dead modules (`pyoaEndingGates`, `socialStakes`, `folkVoiceExpectations`, `leverageMechanics`, `encounterStakes`, `fullProseGate`, `speechActRails`, `claimGrounding`, ~250 dead exports) | all | `src/game/*` | dead-code sweep | Several are synced to edge and named in old tests; a deletion sweep with its own bank run |
| qualityGovernance fields written, never read (`turnsSinceLastEncounter`, `recentXpAwards`, `lastHubLocation`, `craftSignals`) | all | `src/game/qualityGovernance.ts:122`, `:135` | dead-code sweep | Same sweep |
| Dead settings keys (`requireTurnConfirm`, `aiProvider`, `textSpeed`, `stat*`, `dndMode`, `video*`, `image*`) | all | `src/game/types.ts:1876`, `:1966` | save schema | `types` is synced to edge; removal needs old-save loading checks; no player effect |
| Dead save data (`replayHashes`, `campaignDivergences`, `oracleLog` — no UI) | all | `src/game/types.ts:837`, `:845`, `:924` | save schema | Keep for debug or drop with a save repair: John's call |
| `game_sessions` table has no migration in the repo | all | `src/game/cloudSync.ts:149`, `:177` | ops | Needs the live schema to write the migration |
| Dice sound hook `sgm:dice-roll` fires with no listener | all | `src/game/rules/rollView.ts:82`, `:86` | audio | Howler.js waits until the game has sound (library note) |
| Settings opened from the main menu show LitRPG sections | menu | `src/App.tsx` (menu `SettingsModal`) | settings UI | No save is loaded; needs an "applies to" label per section |
| Premade New Game always starts at "standard" strictness | all | `src/components/NewGameModal.tsx` (`beginPremade`) | product | Product call: should premades take the global default? |
| LitRPG bounty pays a stub receipt | L | `src/game/tagTrigger.ts:131` | LitRPG rewards | Needs a reward rule |
| Loaned-item tracking TODO | all | `src/game/inventoryConservation.ts:84` | inventory | No loan feature exists yet |
| Support email marked "TODO: confirm" | all | `src/legal/legalDocs.ts:7` | John | John to confirm the address |
| Error box rate-limit branch never shown | all | `src/components/EngineOverlay.tsx:120`, `:140` | UI | Harmless; rate-limit has its own path |
| Dungeon map fallback has no underground builder | all | `src/components/DungeonMapModal.tsx` | maps | Also an open playtest note; a map-system job |
| `rollD20WithAdv` / `pickFateChoice` default to `Math.random` when no rng is passed | all | `src/game/checkRules.ts:173`, `src/game/fatePick.ts:14`, `:26` | engine rng | Every live caller passes a seeded rng (`checkMath:433`, `travelJourney:1240`, `:1375`, `roundCombat`); the default is never used in play. Removing it changes test signatures |
| Custom Expert "Randomize" uses `Math.random` | all | `src/game/customExpertDraft.ts:77`, `:308` | New Game UI | Draft randomizer before a save exists (no seed yet); not a replayed roll |
| `pyoaDelayedConsequences` "Coming soon" placeholders | P | `src/game/pyoaDelayedConsequences.ts:220` | PYOA | PYOA is out of scope |
| `evalHarness` stubs | dev | `src/game/evalHarness.ts:36`, `:56`, `:61` | dev | Dev-only |
| "Check the exits" told as "the ways out" flags `action-object-missing` (from Part A) | all | `src/game/turnCheck.ts` | turn check | Wants the place card's exits read as the object; a synonym list would be a patch |
| Rule-count reduction not done (from Part A) | all | writer / gate / checker files | pipeline | Totals went up in Part A; the cut needs its own step |

Not counted as gaps: `Math.random` for new ids and new seeds (`combat.ts:96`, `customDesigns.ts:103`, `debugLogger.ts:18`, `defaults.ts:80`, `fateAutoplay.ts:451`, `liveDrive.ts:58`, `mapEngine.ts:264`, `npcMemoryLedger.ts:138`, `openingEstablishment.freshOpenerSeed`, `sheetLibrary.ts:45`, `useGame.ts:456`). These make a fresh id or the seed itself, not a roll inside a save.

## Tests

Run in the shell, outside the model. Only failures were compared.

| Gate | Baseline (tt-consolidate) | After | Limit |
|---|---|---|---|
| vitest failing | 77 names (78 count) | 76 | no new beyond baseline + flakes |
| replay bank failing | 64 | 64 | ≤ 64 |
| tsc errors (`tsconfig.app.json`) | 570 | 570 | ≤ 570 |
| `npm run build` | green | green | green |

- **vitest:** 0 new failing names against `.tmp-cons-vitest-after2.json`. Two baseline names passed this run, both known seed flakes: `playtest30iFogOfWar` "detects locations mentioned in narrative" and `seed94InfestationClear` "pays 50 XP".
- **Replay bank:** the 64 failing names are identical to the baseline (`.tmp-cons-bank-after2.json`). 536 passed.
- **New:** `src/game/ttSweep.test.ts` (2 tests, both pass):
  - the opening place pick repeats for the same save and turn, and varies across seeds;
  - the skill library loads through the zod schema, and a bad entry throws.
- **Stamp tests:** the 24 `playtest*` files pinned to the stamp were moved to `2026-10-14q`. A sample of two (36 tests) passed after the bump.
- **No test laps** (none ordered for Part B).

## Commit and stamp

- Commit `227ba7cc`: `src/game/openingEstablishment.ts`, `src/game/rules/librarySkills.ts`, `src/game/ttSweep.test.ts`, and the stamp files (`index.html`, `public/version.json`, `src/components/Hud.tsx`, `src/game/runManifest.ts`, 24 stamp-pinned tests).
- Left out on purpose: `scripts/ai-player-browser/humanJudge.mjs` and the other unrelated tree edits.
- Stamp `2026-10-14q`, live.

TT_DONE
