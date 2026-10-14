# tt-fix-1 — tabletop roots from mode-tt lap 2 §8

Order: `docs/orders/tt-fix-1-order.md`. No laps, no autoplay runs. Player-facing: yes (stamp bump, client push, `gm-turn` deploy).

## Roots

**1. The quest moves on the wrong thing (E4 + E5).**
- The director's `ck-beat-objective` beat (turn 2+) ticked "Speak with Oskar" without Oskar ever being met, so quest-tick XP paid for a talk that never happened. `src/game/arcDirector.ts:642-645` — a step heard from a named person (`talkStepPerson`, `src/game/questGiver.ts:53-56`) is never ticked on a beat timer. The beat still commits its receipt.
- The tabletop quest had no way to move on from play, and no chip at Keep Gate. New `src/game/tabletopQuestProgress.ts` (built like `storyRpgProgress`): a talk step ticks when the player talks to that person while they are here; a step that names a known place ("Examine the keep gate") gets its own chip at that place and ticks when taken there. Any open step can be taken, so doing the gate first does not pay for the talk. It's wired into `useGame.ts:2812` and `fateAutoplay.ts:1200`. The chip goes through `choiceRanking.storyChip` (`src/game/choiceRanking.ts:349`) and the `dnd-investigate` edge (`src/game/choiceEdge.ts:208`), which used to be a fixed "Investigate the keep".
- `objectiveChip` drops a bracketed aside before cutting ("Examine the keep gate (the chain…)" becomes "Examine the keep gate").

**2. The fight is hidden from the player and the writer (E1, E2, N1).**
- STATUS: `filterSystemLogForEngine` dropped any line with `d20 … DC` as noise, so round lines with saves disappeared. `src/game/systemLog.ts:186-194`: tabletop round, initiative, opening-strike and death-save lines are now kept, with their rolls.
- Writer fact: round outcomes reached the writer only as a mandate, never as the required fact. `runArcDirectorBeforeGm` now returns `fightFacts` (`src/game/arcDirector.ts:1239-1248`), which `useGame.ts:2830` and `fateAutoplay.ts:1216` add to `engineResultFact`.
- Dying: the ongoing death-save fact now says the PC lies unconscious at 0 HP and cannot move, speak or act (`src/game/tabletop/roundFight.ts:599`).

**3. Repairs that drop the right line or miss the wrong one.**
- B T9 "heading toward the Greyhollow Inn" was dropped as "place already left". The trip destination's only unshared word ("Inn") was too short to count, so the shared "Greyhollow" read as the graveyard. Now, when a destination has no long word of its own, its whole name counts (`src/game/sceneContextTail.ts:191-192`).
- C T16: the repair note "X is behind" got written as "the gate behind them". The note now says X is a place the player already left and nothing from it is within sight or reach (`sceneContextTail.ts:327`). The pinned string in `src/__tests__/replayBank/m34lap34.bank.ts` was updated to match.
- A T18: "the only way out now was through it" was read as an exit count. It's skipped in `src/game/exitCount.ts:78-79`.
- B T13 / F T14: the answer repair could take another person's quote as the answer. `repairMissingAnswer` (`src/game/writerTurn.ts:283-291`) now finds who the player named. Only that person is asked to answer, and the repair also runs when the quotes on the page belong to someone else. A pronoun quote right after a sentence naming that person still counts as their answer.

**4. "Go back to X" did nothing (N2).** The chip label was not read by the travel parsers. Added `go/head/walk back to` to `parseTravelDestination` (`src/game/outdoorHubs.ts:468, 476`), `TRAVEL_COMMIT` and `playerCommittedArrivalTravel` (`src/game/travelAuthority.ts:21, 42`).

**5. Fights spawn into the middle of a conversation (N3), with indoor wording outdoors.**
- An overdue fight waits when the player speaks to someone here by name: `shouldSpawnCombat` (`src/game/arcDirector.ts:350-370`) and the beat commit (`arcDirector.ts:1071`), which also covers a forced encounter beat. Seek-fight chips still spawn.
- Spawn line: "from the edge of the room" / "forces the doorway" is used only when `placeScale` says indoor. Outdoor gets "the open ground", and an unknown scale (Greyhollow Graveyard) gets neutral wording (`src/game/combatAuthority.ts:278-298`, callers `combatAuthority.ts:437`, `arcDirector.ts:344`). The story-body scrub and detector cover all three wordings.

**6. Cheap extras (done).**
- A stable death save now advances the clock to the hour the PC wakes (`roundFight.ts:594-596`).
- No quest nudge while the PC is dying (`choiceRanking.ts:260`).

Not touched: the ending popup (`mainQuestEnd.ts`, mode-gap 8). D T6 ("stepped toward the washed-out road") was left as arguably correct.

## Tests

- New `src/game/ttFix1.test.ts`: 16 tests, at least one per root. All pass.
- One fix pass after the first run. Three failures:
  - `talkStepPerson` was case-sensitive on "Speak", so the root-1 guard never fired. Fixed.
  - One wrong assertion of mine (the trip start counts as stale only when the camera is put in it). Fixed.
  - The spawn guard read the wrong people list (now `chipLegality.peopleHere`). Fixed.
- Full vitest after the fix: 0 new failures against the baseline (`.tmp-ttfix1-base-fails.txt`) apart from:
  - the known flakes `playtest29uTravelGap` and `playtest30iFogOfWar`;
  - `playtest27aRepair1` "S3 talk target", which passes 9/9 on its own (load timing in the full run).
- tsc (`tsconfig.app.json`): 570, baseline 601. Build: green.
- 24 stamp-pin tests moved from 14e to 14f.

## Ship

- **Stamp: `2026-10-14f`, not the `2026-10-14c` the order named.** 14c was already used by b7baf54b (mode-gap 6), and live was 14e. Shipping 14c would have put the version backwards for the force-latest check.
- Commit `6d775f7d` on `main`, pushed. This step's files only: `humanJudge.mjs` and the other tree edits were left out.
- Edge: ran `node scripts/sync-gm-edge-shared.mjs`, which changed `combatAuthority`, `outdoorHubs`, `sceneContextTail` and `travelAuthority`. Then ran `npx supabase functions deploy gm-turn`, which reported "Deployed Functions".
- Live: https://www.synapticgm.com/version.json shows `{"hud":"2026-10-14f","build":"2026-10-14f"}`, about 80 s after push.

TT_DONE
