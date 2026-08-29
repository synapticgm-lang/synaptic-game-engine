# Path A — Josie authority owners (2026-08-31c)

Site-wide ledger owners for the remaining WHY-DRIFT holes. Not NEVER-LINES. Mid writer **OFF**. HUD `2026-08-31d` / BUILD `2026-08-30w`.

Force-latest (same push): `src/game/forceLatest.ts` — boot + visibility compare running HUD/BUILD to deployed `sgm-build` / `/version.json`; one-shot hard reload; SW + caches cleared; saves/login/settings kept. Old 30S `present[]` chrome (`Place`, blue panel) still stripped on Continue via `applySaveRepair` → `repairChromePresent` (rev 4+, now 5).

Evidence: `docs/bugs/playtest-2026-08-30-josie/WHY-DRIFT.md`.

| Hole | Owner | Where |
|---|---|---|
| Send-back / protest ≠ name cover | `isPlayDemand` + `playerGivesOrRefusesName` | `openingEstablishment.applyOpeningAnswer` — defers to play after `sceneWritten`. Name cover only on actual name give/refuse. |
| Outdoor → indoor snap without travel | `cameraLock` + `enforceCameraOnState` / `enforceCameraOnProse` | `travelAuthority.ts`. Map/dungeon snap back; real travel prepends leave/reach. `resolveMapScale` + `resolvePlayAreaMap(allowInterior)`. useGame + fateAutoplay. |
| Pad leftover opening chips | `classifyPlayerIntent` + intent pads | `choiceCompiler.compileChoices` + `choiceWarden` after demand/inspect/flee. |
| Faction “paid for” vs accident lock | `factionNoteForHook` / `alignFactionNotesToHook` | `hookLock.ts` → `situationPacket` FACTION MATRIX. |
| Hear-reason / talk XP on contradicted why | `talkContradictsLockedWhy` | `arcDirector.shouldCommitBeat` + social milestone skip. |
| Numbered list in opening book | `stripChoiceList` singleton + `scan`/`try` offer verbs | `parser.ts` — always on GM story (useGame already strips opening). |
| Registration / System wallpaper as person | `chromeAuthority` tokens | `registration`, `registration incomplete`, `system wallpaper`, `status window`. Never `present[]`. |
| Chapter One plate regenerate | already `sceneArtLock` (30W) | Residual: already-fired plate stays. |

Thumbs: `GmResponseFeedback` on NarrativeView + classic LogRow; `gmFeedbackService`; SQL `021_gm_feedback_log_entry.sql`. Any signed-in tester/player/staff/admin. No Test Lab gate.

## Residual

- Already-generated Chapter One plate will not regenerate.
- Opening GM can still invent a crowd size before first harvest.
- Inspect-the-panel pads stay; handlers-steps grammar not rewritten.
- Modeled NPC lie (knowingly contradict hookLock) is not shipped.
- Admin Play Feedback review is in the Admin repo, not the player Settings nav.

Vitest: `playtest31cJosieAuthority`.
