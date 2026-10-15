# tt-fix-15 - overnight root-cause round

Read: `tt-fix-15-order.md`, `tt-fix-14.md`, `CURSOR-STANDING-BRIEF.md`. The fixes sit at shared points: the world clock, the token line gate, the one repair request, and the gate's reading of words.

## Items picked and why

All five items in the order. None was attempted in an earlier round (tt-fix-12, 13 and 14 only deferred them), so the repeat rule did not apply. Nothing was written to `needs-john.md`.

1. **The travel day's hour counter reset with every journey.** Two short trips in one day never reached the SRD forced-march limit.
2. **Gate-dropped lines never got a repair, and a failed repair could keep its sentence.** The order: one repair request per turn holding every flagged line; whatever still fails is removed.
3. **A long rest could be taken again at once.** SRD allows one per 24 hours.
4. **The camp label was a fixed word** ("the night's watches") whatever the hour.
5. **The gate misread words.** It took "their breath evening out" as a time of day, and factCheck flagged the generic "man" in "higher than a man could reach".

## Cause and fix

### 1. One day clock (world clock)
- **Cause:** `travelJourney.ts:1130` (at `ca67deec`) set `journey.hoursToday = gap.hoursPerLeg` on each new journey. The counter lived on the journey, so a second journey the same day started at zero.
- **Fix:**
  - `types.ts:925-929` adds `worldDay`, `roadDay {since, hours}` and `lastLongRestAt` to GameState. `TravelJourney.hoursToday` is gone.
  - `travelJourney.ts:345` `worldClock` = day × 24 + hour; `advanceClock` (`:375`) carries whole days into `worldDay`.
  - `roadHoursToday` (`:356`) reads the waking day's road hours. A day starts on waking (`wakeToNewDay`, `:362`) or once 24 hours have passed (`roadDayStart`, `:350`).
  - `marchHours` (`:1425`) is the one place road hours are logged, for start, step and single-step trips. It rolls the SRD Extended Travel CON save for each hour past 8.
  - `dayIsSpent` (`:1241`), the day-spent lines and the pads all read the same clock.
  - The camp ends with `wakeToNewDay` (`:1599`).
  - `fateAutoplay` / `useGame` copy the new fields with `worldHour`.

### 2. One repair request holds every flagged and dropped line
- **Cause:**
  - `tokenProse.acceptTokenOrLedgerStory` json-partial dropped failing lines silently.
  - `writerTurn.repairRejectedSentences` kept a failed or unchanged sentence when it was the only one telling the event or naming the destination.
  - `repairMissingAnswer` could send a second request.
- **Fix:**
  - `tokenProse.ts:1200,1295` reports each dropped line (`DroppedLine`: painted sentence, reason, and the kept line it followed). `renderWriterDraft` passes it on.
  - `writerTurn.ts:520` adds the dropped lines to the same request as the flagged sentences. A flag no single sentence carries goes on the first flagged pair.
  - A passing rewrite takes the sentence's place, or for a dropped line goes back after its kept line.
  - Anything else, including an unchanged reply (`:564`), stays off the page (`:567`). The keep logic is deleted (cut log).
  - `writerTurn.ts:421`: the answer repair does not send a second request when the sentence repair already sent one.
  - The engine's own `withMoveDestination` sentence still adds a missing destination.

### 3. One long rest per 24 hours
- **Cause:** `recoveryRules.srdRest` had no record of the last long rest.
- **Fix:** `recoveryRules.ts:181,203`.
  - `lastLongRestAt` is stored on the world clock (measured from when the last rest began).
  - Too soon, the hours until a long rest is allowed pass awake first. The receipt says "after Nh awake (one long rest per 24 hours)" and the clock advances by the wait plus the rest.
  - So a road camp still heals rather than refusing the rest.

### 4. Camp label from the clock
- **Cause:** `makeCamp` wrote fixed words ("the night's watches", "past nightfall", "night is coming on").
- **Fix:**
  - `travelJourney.ts:1592`: the camp receipt and fact give the span from the clock ("camped from morning until dusk").
  - The forced-march and day-spent facts no longer name the night.

### 5. Read a word's role, not the word
- **Cause:**
  - `tokenProse.lineHasWrongTimeOfDay` matched any time word, including the verb "evening out".
  - factCheck counted any "man" as a new person.
- **Fix:**
  - `tokenProse.ts:388`: a time word ending in a verb's -ing counts only where a noun stands. That means opening a clause, or straight after a determiner or preposition (the existing `DETERMINER_RE` / `PREPOSITION_RE`).
  - `factCheck.mjs:432`: a person word that is the standard of a comparison ("than", "like", "the way") or the subject of a might-be ("could", "would", …) brings nobody on.
  - **Trade-off:** "a cold evening" still counts as a time word. A clause-internal "as evening fell" (after a conjunction) is now missed.

### Offset (keep ruleCount level)
Logged in `tt-cut-log.md` (restore from `ca67deec`):
- 10 inline regex-escape copies swapped to `engineFactPatterns.escRe` (7 in tokenProse, 3 in writerTurn, plus writerTurn's local `esc`).
- `sentencePattern` folded into `replaceDraftSentence`.
- Four single-use helpers folded into their only caller: `factHasTimeRecord`, `rollContradictionProblem`, `distinctiveTokens`, `nameTokens`.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | newRegExp | lists (entries) | fns |
|---|---|---|---|---|---|
| before | 8506 | 860 | 90 | 20 (274) | 1045 |
| after | 8505 | 849 | 90 | 20 (274) | 1040 |

## Tests

New `src/game/ttFix15.test.ts` (9 tests):
1. A new journey adds to today's road hours and rolls the CON save past 8. A day 24 hours gone does not count.
2. Two dropped lines go in one request and land after their kept lines. An empty or unchanged reply adds nothing.
3. A second long rest within 24 hours waits awake; the clock and `lastLongRestAt` move by 24.
4. A camp at 10:00 / 21:00 says "camped from morning / evening until".
5. "their breath evening out" passes, while "The evening air" / "Morning light" at midday fail. "higher than a man could reach" is not a person, while "A man stood by the door" is.

Updated to the new rules:
- `ttTravel.test.ts` and `ttTravel.bank.ts` set `roadDay`.
- `ttFix5` (an unchanged repair now leaves the page).
- `ttFix3` (an unrepairable record read-out leaves even as the only destination sentence).
- `s77.bank` T9 checks the packet only. The repair request now quotes the writer's own dropped line back, which is the order's rule.
- `m23lap23.bank` replays its four runs one after another. They share the mocked writer queue, and a repair reads it after an await, so a parallel load mixed the runs.

Fix runs:
- **Run 1:** the camp test read `extra`; the span is on the travel `receipt`.
- **Run 2:**
  - The pinned tests above.
  - The m23 load order.
  - The new test's factCheck import made dynamic (tsc).
- **Final run:**
  - **Vitest:** 79 failing of 2731. These are the 78 tt-fix-14 baseline names plus `phantomFight` "turn back from a road meeting" and `playtest29uTravelGap` "walking on reaches the far place". Both are known flakes (they failed in earlier rounds' full runs on old code: tt-fix-14, lib2, mg1/2/4, multi30/42/54) and both pass alone. A 15× loop failed once.
  - **Replay bank:** 62 failing of 628, no new names.
  - **tsc** (`-p tsconfig.app.json`): 552.
  - **Build:** green.
  - **Stamp-pinned tests:** 254 pass.

Leftover: m22, m24 and m34 bank files still load their replays in parallel over the same queue. They pass now, but they can mix runs the same way.

## Ship

- Commit `dfb1ea87`, pushed to main. Stamp `2026-10-15b` (HUD / BUILD / index.html / version.json / runManifest / pinned tests).
- `humanJudge.mjs`, the other modified docs, `needs-john.md` and `.tmp-*` files were not committed.
- Edge: `sync-gm-edge-shared` synced `types.ts`, and `--check` says the copies match. `gm-turn` is deployed; OPTIONS returns 200.
- https://www.synapticgm.com/version.json → `{"hud":"2026-10-15b","build":"2026-10-15b"}`.
- No laps.

TT_DONE
