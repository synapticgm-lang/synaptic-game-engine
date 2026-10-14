# Tabletop fix step 4 — report (14 Oct)

Order: `docs/orders/tt-fix-4-order.md`. Evidence: `docs/orders/mode-tt-lap-5.md` and the lap 5 run folders (s426, s430, s432). Modes touched: tabletop (cursed-keep). Story RPG and LitRPG behaviour is unchanged, except the shared plain travel fact in item 2.

## Items

### (1) Quest-step chip dropped from the menu (s432, s426)
- **Cause:** the chip was built (`Story chip: Examine the deep gouge marks`, s432 T2), then dropped twice on the way to the menu because it names an object the beat never narrated:
  - `choiceWarden.filterInventedContextChoices` dropped it as invented context, and `playTranscript.compileOfferedChoices` kept it out through its `removed` set.
  - `chipLegality.chipProblem` flagged the same inspect chip as an unnarrated object.
  - The s426 cart-tracks chip went the same way.
- **Fix:** the tabletop step chip is an engine fact, so both checks now accept it.
  - `src/game/choiceWarden.ts:178` adds `tabletopStepChip(state)` to the engine-chip set.
  - `src/game/chipLegality.ts:273` exempts it from the unnarrated-object check.

### (2) Travel-record leaks (17 errors)
- **Cause (checked):** this was not a pattern gap. Five channels handed the writer the raw record:
  1. The ENGINE RESULT line printed the raw travel receipt (`Travel: back streets between A and B — leg 1 of 2 — +30 min, now afternoon; B still ahead; chance meeting: …`) and told the writer to state it plainly.
  2. The road-meeting fact carried the STATUS life clause.
  3. The INFO SHEET LAST and FACTS lines repeated the raw receipts.
  4. The INFO SHEET OPEN line and the ground-truth ledger (`Active Main Story` / `Active Side Quests`) handed the quest title and the open step text.
  5. The repair prompts passed the raw engine fact as `Engine fact:`.
- **Fix:** the writer is now handed only the destination and a plain time fact. Gates still read the raw `completedEvent.engineResult`.
  - `src/game/travelJourney.ts:667` adds `writerTravelFact`, which turns a receipt into "Arrived at X. Some time passed on the way; it is now afternoon." or "On the way to X, not there yet. …".
  - `src/game/travelJourney.ts:686` adds `writerEngineResult`, which swaps every receipt in an engine fact for that form.
  - `src/game/completedEventPacket.ts:1275` builds the ENGINE RESULT line from `writerEngineResult`.
  - `src/game/travelJourney.ts:657`: the road-meeting fact no longer carries the life clause. STATUS still has it through `encounterNote`.
  - `src/game/infoSheet.ts:22` (`writerReceipt`) applies the plain form to LAST and FACTS receipts in all modes.
  - `src/game/infoSheet.ts:28` (`questRecordHidden`): in tabletop, LAST and FACTS drop chrome and quest-record lines, and OPEN omits the quest.
  - `src/game/writerInfoLayer.ts:87` (`questLines`): the tabletop ledger has no `Active Main Story` / `Active Side Quests`.
  - `src/game/writerTurn.ts` repair prompts use `writerEngineResult` for `Engine fact:`.
- **Fact checker:** it still sees the raw record. `scripts/factCheck.mjs:236` reads `row.engineFact` first and merges `row.openQuests`, which `src/game/fateAutoplay.ts:2133` now writes on every turn row.
- **Edge:** `supabase/functions/_shared/gm/travelJourney.ts:38` (stub) gets the same pure `writerTravelFact` / `writerEngineResult` / `meetingMoveBase`.

### (3) Answer repairs invented NPC lines
- **Cause:** `repairMissingAnswer` asked the writer for a reply from anyone here, with nothing to hold the reply to.
- **Fix:** a repair may only quote a backed line.
  - `src/game/writerTurn.ts:286` (`backedAnswerFacts`) collects what each person here is on record as saying: authored topic lines, the opening card's want for the card's cast, and the motive on their sheet.
  - `src/game/writerTurn.ts:362`: with no backed line for anyone here, the repair takes the skip path (`skipped: no backed line for anyone here`) and asks nothing.
  - The request lists `Known to say:` and says "Add no new fact".
  - `src/game/writerTurn.ts:301` (`quoteHeldToFacts`) and `:382`: a reply that does not carry a backed fact is refused (`repair reply is not held to a backed line`).

### (4) Kit names pasted into prose
- **Cause:** the writer was handed catalog labels ("Chain Mail", "[Uncommon] Iron Shield (worn)").
- **Fix:** `src/game/inventory.ts:32` gives `kitRefDisplay(name, plain)` a tabletop form: rarity tags and notes stripped, every word lowercase except possessives and names after "of".
  - Tabletop passes `plain` at `src/game/writerInfoLayer.ts:24` (every inventory, equipped and pocket line) and `src/game/completedEventPacket.ts:674` / `:683` (kit refs).
  - LitRPG and story RPG keep their item names.

### (5) Check chips did not say what failure costs (TT32)
- **Cause:** road-meeting check chips ("Talk your way past the thugs", "Slip past the dead", "Skirt around the camp", "Hide from the creature", "Talk to whoever blocks the way") never said what failure costs.
- **Fix:** those chips now carry the cost.
  - `src/game/travelJourney.ts:370` (`FAIL_COST`) and `:375` (`withFailCost`) append it: ", but fail and they attack", or ", but fail and it attacks" for the creature.
  - `:382` (`meetingMoveBase`) strips the tail, so the move still matches its check: `roadMeetingMove` `:756` and `isJourneyPad` `:406`.
  - The packet's PLAYER line (`src/game/completedEventPacket.ts:978`) is the base move, so the writer is not told the player failed.

### (6) Oskar step unreachable; one-look spines
- **Cause, Oskar:** "Speak with Oskar at the Greyhollow Tavern" anchors to a person, and nothing ever placed Oskar. `placeQuestGivers` places only a quest's giver, and only at New Game. The step's place was not found either, because `tabletopStepPlace` matched hub names, not aliases, and "Greyhollow Tavern" is an alias of Greyhollow Inn.
- **Fix, Oskar:**
  - `src/game/tabletopQuestProgress.ts:27`: `tabletopStepPlace` matches hub aliases.
  - `:44` (`placeTabletopStepPeople`): a main-quest talk step's person gets a record at the step's place, using the existing record if there is one, so arriving there finds them.
  - `:140` runs it every turn at the start of `applyTabletopQuestTurn`.
- **Cause, spines:** `tabletopSpineToStarterQuest` built a one-objective quest, so one look paid 75 for the step plus 100 for completion.
- **Fix, spines:** `src/data/quests/tabletopMainSpines.ts:600`: each spine's follow-on beat (`threeBeats[1]`, a real action in all 24 spines) is its second step, anchored at the same pin. Main quests now take two separate turns and never end on one look.
- **Old saves:** saves that already hold a one-step spine keep it.

### (7) False "down" flags on route names
- **Cause:** the `repeated-habit` five-gram check masked place, NPC and hub names, but not the route names the engine gives the writer ("Back streets", the trip's HERE label, its ground and its two ends). So "the narrow back streets of" counted as a habit.
- **Fix:**
  - `src/game/travelJourney.ts:87` (`routeNames`) lists those route names.
  - `src/game/turnCheck.ts:661` masks them for the state before and after the turn, the same way places are masked.

### (8) Tabletop pays challenge-rating XP only (John's ruling)
- **Fix:** `src/game/sandboxXp.ts:429`: the fight-deed block (First Kill, 3 / 10 fights won) runs for LitRPG and story RPG only. Tabletop pays fights by CR alone.
- LitRPG XP and reward boxes are unchanged. Story RPG's First Kill item is unchanged.
- I read the ruling as covering the deed/achievement XP it names. Quest-step XP (75 per step, 100 on completion) still pays in tabletop, since item 6 assumes it does.

## Tests
- New: `src/game/ttFix4.test.ts`, with one test per item (9 tests).
- Pinned tests updated to the new rules:
  - `ttFix1` root 3: Tilde now has a record, plus a skip-path case.
  - `s77RootDRecord`: LAST shows the plain travel fact.
  - `s79RootAOneChipList`, `s81RootBLostRoadFight`, `seed93WriterFacts`, `playtest29xRareCampStall`: chips carry the failure cost.
  - `playtest28aXpMilestone`, `playtest29z1AchievementCircling`: tabletop deed XP is 0.
- First full vitest run: 84 failed. Against the tt-fix-3 baseline, the 9 new failures were all pins of the rules above. 27d and 28s came from lowercase kit in LitRPG, which was fixed by scoping `plain` to tabletop.
- One fix run. Final full vitest: **75 failed of 2585, 0 new** against baseline (76). `playtest30iFogOfWar` passed this time.
- tsc (`tsconfig.app.json`): **570**. Build: **green**.
- Stamp-pin suites: 23 files, 247 tests passed.

## Commit / deploy / stamp
- Commit `430fb4c8` on `main`, pushed (`9d9da04a..430fb4c8`). Only this step's files are in it. `humanJudge.mjs`, `.cursor/rules/playtest-notes.mdc`, `.gitignore`, other `docs/orders` edits and `.tmp*` are not.
- Edge sync: `node scripts/sync-gm-edge-shared.mjs` synced `completedEventPacket`, `infoSheet`, `inventory` and `writerInfoLayer`. The edge `travelJourney` stub got the three new exports, and every named import in the synced edge files resolves.
- `npx supabase functions deploy gm-turn`: Deployed Functions. OPTIONS returned 200 (it boots).
- Stamp `2026-10-14h` → **`2026-10-14i`** (HUD, BUILD, `index.html` meta, `public/version.json`, stamp pins).
- https://www.synapticgm.com/version.json returned `{"hud":"2026-10-14i","build":"2026-10-14i"}` after 90 s.

TT_DONE
