# q31-Bfinish - Order B replay seam shipped

Order B from `docs/orders/queued-fix-orders.md`, finished from the saved `docs/orders/b-leftover.patch` (q31-B ended without a commit). The replay seam ships; the rest of Order B is listed under NEXT.

## Cause

- `src/game/placeNames.ts:38` (`knownPlaceNames`) and `:148` (`roomOfHub`): tt-fix-2 (stamp `2026-10-14g`) made an opening place take the matched quest spine's map pin and made a room of an indoor hub that hub. Replaying a tape built before `14g` therefore started in a different place, so later turns reached a different scene (ds151 T7 went to "back streets" instead of the recorded "open road between Keep Gate and Greyhollow Inn").
- `src/game/travelJourney.ts:663-676` (at `6b55f4e4`): the replay seam was a bare on/off flag (`setReplayRecordedMeetings`). It knew a tape was being replayed but not when the tape was built, so no world step could be held back for an older tape.

## Fix

- New `src/game/replaySeam.ts`: the one replay seam. `setReplayTape(stamp)` carries the tape's build stamp (`meta.runManifest.buildStamp`); `replayPreFeature(feature?)` with no feature means "a tape is replayed", and with a feature means "the tape was built before that step shipped". One table `FEATURE_STAMP` (`openingPlaceNames: '2026-10-14g'`).
- `replayRun.ts`: sets the seam from the tape's stamp and clears it afterwards (was `setReplayRecordedMeetings(true/false)`).
- `placeNames.ts`: the spine-pin and hub-room steps are off for a tape built before `14g`.
- `travelJourney.ts`: the old flag and its two functions are gone; the three reads (recorded meeting roll, road camp, camp watches) use `replayPreFeature()`. Live play and new fate-autoplay runs never set the seam (pinned by `ttTravel.test.ts`).
- Function count held flat by folding the patch's separate `replayingTape()` into `replayPreFeature()`; behaviour is the patch's, including tapes with no stamp (not treated as pre-feature).
- `ttTravel.bank.ts` ds151 T7 case retargeted (decision: Order B, the replay reaches the tape's own scene). Details in `tt-cut-log.md`.

## Tests / gates (run outside the model)

| Gate | Result |
|---|---|
| replay bank | **46 failing** (limit 64). Baseline from a separate worktree of HEAD `6b55f4e4` (`.tmp-wt-q31-Bfinish`): 57. 0 new, 11 fixed: mode2 fl151 T8 flee; mode4 "Face the thugs", Story RPG loot, mode4 guard; modeGap6 ×2; tt6a dawn, darkness, travel pace; tt6c crafting, attunement. |
| vitest | 77 vs 76 in the last saved run (q31-LToff). The one extra, `playtest30iFogOfWar` "detects locations mentioned in narrative", is a seed flake: it failed 1 of 4 runs on clean HEAD in the worktree and 1 of 4 in the shared tree. 0 new from this change. |
| tsc (`tsconfig.app.json`) | 550 (limit 552) |
| build | green |
| stamp tests | 254 passed |

## ruleCount before / after

| | files | lines | regex | newRegExp | lists (entries) | fns |
|---|---|---|---|---|---|---|
| TOTAL before | 494 | 167422 | 7366 | 422 | 1194 (6317) | 12062 |
| TOTAL after | 495 | 167430 | 7366 | 422 | 1194 (6317) | 12062 |

Regex, lists and functions do not rise. Files +1 and lines +8 are the new seam file the order prescribes (19 lines), less the flag and comment removed from travelJourney. OLD14 unchanged.

## Replay staging (R1-R16)

- None belongs to Order B itself. R1-R4 only note "pin the tape with the replay seam". Their tapes exist (distill-1, stamp `2026-10-15i`, after every dated step in the seam), so the seam does not change them, and their checks belong to G/H (R1, R4), questtargets/O1 (R2, R3). Add them with those orders.
- R5 blocked: no tape has a camp. R6 blocked: tt-build-shop not built. R7-R16 belong to Order S.

## Ship

Client-only, replay-harness behaviour (the seam is never set in live play). `placeNames.ts` and `travelJourney.ts` on the edge are stubs, so no edge sync and no `gm-turn` deploy. Stamp `2026-10-15m` -> `2026-10-15n`.

Commit `7fe35177`, pushed to main (36 files by explicit path; `humanJudge.mjs`, `.tmp-*` and `needs-john.md` left out). Vercel git build is live: `https://www.synapticgm.com/version.json` reads `2026-10-15n`. Stash `WIP on main: 82cb32b4` dropped (other stashes untouched). Worktree `.tmp-wt-q31-Bfinish` removed (its `node_modules` / tape junctions unlinked first). `docs/orders/b-leftover.patch` kept.

## NEXT (rest of Order B, not small enough for this session)

- Headcount: `sizeMeeting` still runs inside the replay branch (`travelJourney.ts:826`). Keeping the recorded headcount conflicts with Order A ("set expectations to what the SRD budget now gives"); already `needs-john.md` item 9.
- Date the remaining world steps in `FEATURE_STAMP`: the d6 meeting roll per watch (`2026-10-14l`, tt-travel), camps placed as places (tt-build-camps), quest targets placed on quest creation (tt-build-questtargets). Today the recorded roll and no-camps apply to every replayed tape, whatever its stamp.
- Order F: seed the world clock from the tape's recorded hour through this seam (tt6a darkness, m52).
- Tapes with no `buildStamp` predate every dated step but are not treated as pre-feature (patch behaviour kept); revisit when dating the steps above.
- Still failing Order B cases to re-check after those: m28, m8, s80, m42 crowd, s72, m50 ×2.
