# Playtest dump — 2026-09-10 watchtower start (save `d3b60d00`)

HUD at capture: `2026-09-10g`. Phoenix Ashrise. LitRPG Summoned Pact, alone watchtower stump, Jax.

## Thumbs (player)

| Turn | Player | What landed | Note |
|---|---|---|---|
| T0 | (opening) | Authored watchtower page 1, still asked for a name | “Good start but name ask though auto-filled” |
| T2 | `Inspect the panel` | `You looked through this room.` | “I asked to check the panel” |
| T3 | `Inspect the panel` | `You looked again at this room. blue panel had not moved.` | “Again wrong response” |
| UI | `Explore the room for any signs of where you are or anything of use` | Repair: force the door / listen first | 21j skip missed `explore` |
| T4 | Explore + `listen first` glued | Third person “The hand reached…” | Perspective + repair glue |
| T5 | `What can I see around me` | Essay; hear-reason quest while alone | leftover Class C |
| T6 | windows/doors/gaps | `You have examined everything here.` | Silent loiter empty |

## Owners (10h)

1. **Class B+D — `Inspect the panel`.** `hallTalkAsksPanel` only matched `blue panel` / `what's the panel`. Line missed → not `shouldStitchOpeningContinue` → Silent `inspect` → `You looked through this room.` Widen to the same regex as `playerAskedAboutSystemPanel`. Silent receipt skips panel inspect.

2. **Class A — explore `or`.** `detectRepairSituation` treated “where you are **or** anything of use” as two moves. `isSpecificActionWithCompoundTarget` / `isExploreOrLayoutAsk` did not include `explore`. Never force-door on explore-for-X-or-Y.

3. **Class B — name ask after auto-fill.** Watchtower `page1` ends “The panel waits on a name. What do you enter?” even when Jax is locked. `stitchOpeningScene` drops that tail when a lockable name is already on the sheet. New Game runs `mergePreferredProfileIntoOpening` before the stitch.

4. **Class E — System window “Jaxax / lockeded”.** Ledger strings are clean. Phoenix Ashrise Cinzel Decorative inherited onto the plate. Force UI mono + no ligatures on `[data-sgm-system-window]`.

## Leftover (not this batch)

Silent Look/Wait still receipts. Alone watchtower vs Circle’s Price hear-reason. Combat receipts ≥3. Do not re-enable flavor every turn.
