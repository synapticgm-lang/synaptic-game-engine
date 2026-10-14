# tt-fix-7 — fixes for mode-tt-lap-8

Live before: `2026-10-14n` (HEAD `41bb3e07`). Shipped: `2026-10-14o`, commit `fff99693`, pushed to `origin/main`.
Tabletop stays SRD 5.2.1 as written: no rules were changed. One fix run.

## 1. The writer read out the travel record and told the arrival twice

**Cause.** tt-fix-4 and tt-travel made the travel facts plain, but every live path still gave the writer travel lines that were already shaped like narration, and the writer copied them.
- The ENGINE RESULT line from `writerTravelFact` said "Some time passed on the way" and "not there yet".
- The underway movement line said "Not arrived at X yet; do not narrate arriving".
- The arrival movement line said "set out from X earlier and has been on the way since: write the end of that walk". So an arrival came through twice (ENGINE RESULT "Arrived at X" plus "from A to X" with a walk to finish), and the writer wrote "the long walk ended" and then "you reach X".
- The INFO SHEET LAST lines came from the same receipts.

The live path is the edge `buildContextPrompt`, which uses the edge `travelJourney.ts` stub (a hand copy of `writerTravelFact`) and the synced `completedEventPacket.ts`. Both carried the phrases.

**Fix.**
- `src/game/travelJourney.ts:862` `writerTravelFact` now gives a state, not a sentence: "On the X toward Y." / "Arrived at Y." plus "It is now dusk." (`:867`). The edge stub `supabase/functions/_shared/gm/travelJourney.ts` has the same change.
- `src/game/completedEventPacket.ts:1087`: the underway line shows the ground with no arrival, and never tells how long the trip has taken or how far is left.
- `src/game/completedEventPacket.ts:1103`: the arrival walk clause makes the arrival one sentence, with no account of the walk, and never a step out of the place left. It uses the PC's name, not a hard-coded Jax.

**Tests.**
- `ttFix7.test.ts` item 1 (2 tests): client and edge give the same forms, and neither movement line has read-out phrases.
- Re-pinned `m54lap54.bank.ts` (`WALK` regex and "never a step out of") to the new wording.

## 2. Repeated tabletop checklist fails

- **TT01 (dice visible).**
  - Cause: `isEngineCheckLine` did not match the `formatCheckRecord` shape the travel jobs write (look-out, navigation, foraging), so those rolls never reached tabletop STATUS.
  - Fix: `src/game/systemLog.ts` `isEngineCheckLine` now accepts `Name d20 (n | adv: a, b) ... = N vs DC N — success|failure`.
  - Test: `ttFix7` TT01.
- **TT02 (the engine's places are named, the destination stays in view).**
  - Cause: route-stop names were not in `handedWriterText`, so the `capital` gate cut lines naming them. And a beat that lost its line naming the destination was committed without the place.
  - Fix:
    - `src/game/completedEventPacket.ts:1055` hands the movement line plus each named route stop.
    - `src/game/writerTurn.ts:229` `withMoveDestination` (called at `:218`) adds one plain sentence naming the destination, only on a move turn whose prose does not already name it. It skips road labels and room labels.
  - Tests: `ttFix7` TT02 (2 tests).
- **TT13 (the player can speak through a question chip).**
  - Cause: `playerLineSpeaks` did not count a line starting with who/what/where/why/how/when/which as speech, so "Who are you" was treated as the writer voicing the PC.
  - Fix: `src/game/engineFactPatterns.ts:65`.
  - Test: `ttFix7` TT13.
- **TT18 (no person who is not here).**
  - Cause: place blurbs name standing NPCs ("— Nell Rudd keeps the gate"), and "What it is:" plus the arrival sight handed them to the writer even when that person was absent.
  - Fix:
    - `src/game/outdoorHubs.ts:638` `placeBlurbForWriter` drops any part of a blurb that names a known person who is not in `sceneFacts.present`.
    - It is used in `src/game/writerInfoLayer.ts:163` and `src/game/travelJourney.ts:1074`.
  - Test: `ttFix7` TT18.
- **TT19 (a quest step ticks on the real event).**
  - Cause: steps like "to track its trail up the hill" were classed as talk/act, so they ticked on the chip, not on arrival.
  - Fix: `src/game/tabletopQuestProgress.ts:99` `MOVE_STEP_PURPOSE` (used at `:107`) classes a move by its purpose.
  - Test: `ttFix7` TT19.
- **TT21 / item 3 (answer repair).** See section 3.
- **TT25 (prose that does not match the facts).** The prepended destination (TT02) and the plain travel state (item 1) cover the travel cases.
  - Leftover, writer-only, with no engine owner found: the E T12 quest sign and the E T20 meeting "wants" line.
  - TT02 A5/D2 and TT13 B8/F6 are also writer-only leftovers.

## 3. Repair errors rose from 2 to 5

**Which path.** Four of the five came from the answer repair (`repairMissingAnswer`), and one (R3) from the sentence repair (`repairRejectedSentences`).
- The answer repair gave the harvest placeholder card ("Met in play. Details unfold through conversation.", `narrativeHarvest.ts:131`) as a person's backed line. It also took the writer's third-person notes ("Col Thatch keeps the gate") as speech.
- The sentence repair re-checked a repaired line without the line-fact gate, so a repaired line could bring back a fact the gate rejects.

**Fix.**
- `src/game/writerTurn.ts:325`: `backedAnswerFacts` skips `harvest-npc-` cards, so a person with no real backed line is skipped rather than asked for.
- `src/game/writerTurn.ts:357`: `speaksOfSelf`. The bug branch at `:434` rejects a reply where the speaker talks about themselves by name. The request at `:375` asks for first person, never their own name, and never a copy of a note.
- `src/game/writerTurn.ts:441`: the sentence repair's re-check now also runs `plainLineFactProblem`.

**Tests.**
- `ttFix7` item 3 (2 tests).
- Re-pinned `m47lap47.bank.ts` fl151 T8: Col Thatch's only card is the placeholder, so no ask is sent. `answerRepairRequest` still says Jax is the player's character.

## Side fix found by the bank

`src/game/tokenProse.ts:460`: the time-of-day gate read time slots from every handed line, including old INFO SHEET LAST history. With the shorter travel lines, an old "It is now morning." made "morning light" look backed on a dusk turn (s83 T8). The gate now reads slots only from `engine result:` lines.

## Checks

| Check | Result | Gate |
|---|---|---|
| vitest | 78 failing. The 76 baseline names are unchanged, plus 2 flakes that pass alone (`playtest30iFogOfWar` locations; `playtest27aRepair1` S3, a random housing pick, passed 3 of 4 runs, untouched code). 0 new. | no new |
| Replay bank | 64 failing, same names as HEAD | ≤ 64 |
| tsc (`tsconfig.app.json`) | 570 | ≤ 570 |
| Build | green | green |
| `ttFix7.test.ts` | 10 / 10 | — |

Stamp pins moved from `2026-10-14n` to `2026-10-14o` in 24 playtest tests, plus `index.html`, `public/version.json`, `Hud.tsx` and `runManifest.ts`.

## Deploy

- `node scripts/sync-gm-edge-shared.mjs` updated the edge copies of `completedEventPacket`, `outdoorHubs` and `writerInfoLayer`; the edge `travelJourney` stub was edited by hand.
- `npx supabase functions deploy gm-turn` deployed. OPTIONS returned 200, and POST `{}` returned `state is required` (no 503 BOOT_ERROR).
- https://www.synapticgm.com/version.json showed `{"hud":"2026-10-14o","build":"2026-10-14o"}` after 4 polls.

Not committed (as ordered): `humanJudge.mjs`, `.cursor/rules/playtest-notes.mdc`, `.gitignore`, the other docs/orders edits, and `.tmp*`.

TT_DONE
