# Silent Engine 08d (2026-09-08)

**Status:** Live Free experiment. Not committed / not pushed unless John asks.

## Product lock

- Free Option 2 MUD **receipt path stays**.
- **Silent Engine:** `SILENT_ENGINE=true` — **no** DeepSeek / micro-flavor calls. Receipts only.
- Mid writer OFF.
- Tag & Trigger stub from 08c kept.

## Must-ship

| # | Lock | Owner |
|---|---|---|
| 1 | FSM pad prune — no Talk/Ask/Offer on lastKill / corpse; topic-exhaust culls social | `combatAuthority` / `choiceCompiler` / `padUniverse` / `choicePipeline` |
| 2 | Spatial pointer — Travel to/toward + Leave the scene mutate HERE; clear lastKill on leave | `outdoorHubs` / `presentAuthority` / `fateAutoplay` / `useGame` |
| 3 | Silent Engine — skip flavor GM round-trip | `freeMudPresentation` / `fateAutoplay` / `useGame` |
| 4 | PYOA Accept-ending terminates (`playPhase: ended`) | `pyoaSpine` / pads |
| 5 | Cheap: deny `Saying Your` harvest | `entityRegistry` / `chromeAuthority` |

## Stamp

HUD / BUILD / index.html → `2026-09-08d`

## Vitest

`playtest08dSilentEngine`

## 4×T50 pass/fail (seed 42, Silent Engine ON)

| Mode | Gate | Turns | Flavor | Corpse-talk | Travel / HERE | L2 | Combat |
|---|---|---|---|---|---|---|---|
| LitRPG | **PASS** | 50/50 | 0 | 0 | 5 picks / 4 moves (1 no-move) | T12 | 2 |
| D&D | **PASS** | 50/50 | 0 | 0 | 3 / 3 | T22 | 1 |
| RPG | **PASS** | 50/50 | 0 | 0 | 3 / 3 | T13 | 1 |
| PYOA | **PASS** | 50/50 | 0 | 0 | n/a | none | 0 |

- PYOA Accept-ending picks: **1** (terminates — no buy-time loop)
- Mud-receipt: 100% all modes · 0 empties/errors/timeouts
- Pastes: `scripts/fate-autoplay/runs/gemini-paste-2026-09-08d-t50/`
- Status: `scripts/fate-autoplay/runs/rrr-4x-t50-08d-status.md`

## Leftover OK

Full micro-prompt sanitize, regex scrub, full PYOA CYOA rewrite. Combat ≥3 still aspirational. Do not re-enable flavor every turn. LitRPG had 1 travel no-move among 5 picks (HERE still moved 4× — gate held).
