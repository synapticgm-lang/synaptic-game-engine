# SUMMARY 28s

## Fix (commit 4e5ddcd, stamp 2026-09-28s)
MASTER-28o had no jobs left (28o–28r + FINAL were all done), so 28s was only the FINAL test notes. Each fix is engine-side and applies across the game.
- **Thornferry never left the ford.** The spine moved its node but never moved the player. Spine nodes now have a `place`, and taking an exit sets HERE to the destination's place (Umbra reads `place` from its book when the book has one). Spine exits and the "Accept the ending that follows" chip now come from `spineEngineChipLabels` and are treated as engine edges. Both invented-context filters (`filterInventedContextChoices` and `choiceNamesUnnarratedObject`) keep them.
- **"Sealed blue panel" in Thornferry.** `seedOpeningSceneFacts` put a `blue panel` prop into HERE for every mode. Scene props now drop panel chrome outside LitRPG, both at seed and on each committed beat (`stripModeChromeProps`). The opening card's FORBID line only names the blue panel in LitRPG.
- **SP kit label pasted verbatim.** `kitRefDisplay` turns a catalog label into something that reads mid-sentence ("The clothes you had on when the light took you" becomes "your clothes"). It is used in the ref list, the noun allowlist and the writer's Equipped Gear / Inventory lines.
- **SP doubled place label.** The writer typed the start of the HERE label and then the token. Token Prose rendering now drops that typed echo before the painted label (`collapseEchoedLabel`) and capitalises sentence starts.
- **SP travel stamp reprinted on repeat trips.** Pre-writer hub travel changed `currentLocation` but left `locationSheet` stale, so the writer was shown the old place. Fate also never rotated `previousLocationSheet`, so the camera stamp kept naming "Cathedral Close". Now `syncSheetToMovedHere` updates the sheet when HERE moves before the writer (live and Fate). `enforceCameraOnProse` takes the turn-start place as the origin, so it skips a trip to where you already are. `ensureTravelArrivalProse` never stamps an arrival twice.
- Vitest playtest28sSpineTravelKit (7). Edge synced.
- Gates: tsc=601, vitest fails=128 new=0, build 0, deno 52, T10 P0=0 runs=3. Push and `gm-turn` deploy OK on the first run (no fix run used).

## T50 test (stamp 2026-09-28s)
- 6 runs × 50 turns: hosted Free writer through `gm-turn`, Fate pick mode, seed 56, loop auto-stop on. autoThumbs (model-free, `autoThumbs.mjs`) ran on each finished run. The three play modes are the harness's `--ai-agent-mode` values: maxlevel, storyfollower, completionist. Thornferry plays as pyoa, summoned-pact as litrpg. Logs: docs/orders/t50-28s-logs/.
- Stitched/fallback turns: 0 in all 6 runs (E_fallback 0).

| Run | Turns | Mean turn ms | No-progress | Thumbs up/down/unclear | Places | Level |
|---|---|---|---|---|---|---|
| Thornferry maxlevel | 25 (loop stop) | 4535 | 76% | 6/2/3 | 6 | L1 |
| Thornferry storyfollower | 29 (loop stop) | 4485 | 83% | 5/11/4 | 5 | L1 |
| Thornferry completionist | 27 (loop stop) | 5011 | 81% | 5/8/8 | 5 | L1 |
| SP s56 maxlevel | 50 | 6408 | 50% | 17/6/11 | 12 | L3 |
| SP s56 storyfollower | 50 | 6173 | 60% | 10/10/7 | 10 | L2 (220/225) |
| SP s56 completionist | 50 | 7277 | 56% | 14/5/15 | 10 | L3 |

Before this fix, the FINAL test had Thornferry on 1 place with 95%+ no-progress.

Notes:
- **Thornferry maxlevel:** the spine now runs end to end (landing, streets, road east, mill hamlet, ford, Highmark gate, mill ending, T5–T16), with HERE following each exit. But "Accept the ending that follows" (picked at T20) does not end the run: Fate never reads `playPhase: 'ended'`. Play continues on leftover crisis pads ("Choose the risky fork", "Face the crisis now") at Highmark gate until the loop stop.
- **Thornferry storyfollower:** the writer typed the place name twice ("the ferry inn at the ferry inn at Thornferry", T4), outside the token paint, so the echo collapse did not catch it. Wren's "The oak door is at your back." repeats (T10). XP stalls after T4 in all three Thornferry runs, because spine exits give no XP.
- **Thornferry completionist:** standout: 5 distinct places, 0 repeat visits, and no blue panel in any Thornferry prose. Wrong: T11–T20 are 10 turns at the toll wall with repeated lines before the loop stop.
- **SP maxlevel:** standout: L3 by T26 (a fight won on West Wall). Twelve places, with kit labels, doubled place labels and stale travel stamps all at 0 in all 3 SP runs. Every stamp now names the real origin, and each repeat stamp follows an actual trip away and back.
- **SP storyfollower:** Brother Tam's "The seventh ring dumped you into bread-steam, not the vault" repeats T5–T7 in the cathedral kitchens (same in the other two SP runs). There are 5-turn kitchen loops before the first exit.
- **SP completionist:** L2 at T13 on reaching Lowmarket and L3 at T34 on reaching Cathedral Close. There are 7 trips into Cathedral Undercroft, each correctly stamped from its real origin.

Leftover (not fixed, would need a new fix run): Fate should stop (or pads should close) once a spine ending is accepted, and the leftover PYOA crisis pads should starve after the spine ends. Thornferry spine exits give no XP. Place-name echoes the writer types outside the token paint are not collapsed.

ALL DONE
