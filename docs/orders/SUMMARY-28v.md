# SUMMARY 28v

## 28v0 — PYOA out of test harnesses
- Commit 39cef7d, stamp 2026-09-29v0; pushed, gm-turn deployed.
- Gates: tsc=601 (max 601), vitest fails=128 new=0, build exit=0, deno errors=52 (max 52), T10 P0=0 runs=3.
- T10 is now one run per mode with --game-mode: litrpg summoned-pact s27, tabletop cursed-keep s27, rpg salt-road-heist s27 (each prints P0=<n>).
- Harness: new --game-mode litrpg|tabletop|rpg (alias --engine); PYOA mode and PYOA bibles (incl. Thornferry Road) refused by the CLI; matrix/premade lists, modes-agents, live-drive T10/T20, opening paste, Gemini pack order and ai-player flagships drop PYOA.
- Fix run used once: first gate run flagged 12 stamp-pinned tests (expected 2026-09-29u1); updated to v0, rerun passed.
