# q31-mergewm

Merged `wm` (`ce54481c`, WM-a `654311af`, from main `7d3bacaa`) into `main` with `git merge --no-ff wm`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change (the world map opens from the HUD when the story has an atlas). Stamp `2026-10-16z10` (was `2026-10-16z9`). No edge file changed against main, so `gm-turn` was not deployed.

Branch reports: `docs/orders/q31-WMa.md`, `docs/orders/q31-WMb.md`. Those commits do not touch `docs/orders/tt-cut-log.md`, so main's cut log is unchanged and nothing from the branch was dropped.

## Cause

Main had atlas data (`src/game/worldAtlas.ts`) and settlement authority (`src/game/worldMapAuthority.ts`) and no view of them. The map button opened the local floor plan only (`src/App.tsx` map modal, before this merge).

## Conflicts

1. **`src/App.tsx` imports.** Kept main's `promiseViews` / `questTargetViews` from `questView` (the quest journal from `q31-mergeqv`) and the branch's `worldMapLayoutFor` from `worldMapLayout`. Both are used: the journal props and the world-map modal.

`src/components/Hud.tsx` auto-merged. The World map button sits beside Quests, desktop and mobile tray, and only when `state.worldAtlas` is set. `WorldMapModal.tsx`, `worldMapLayout.ts`, and `worldMapLayout.test.ts` came in as new files.

## Fix

`worldMapLayout` (`src/game/worldMapLayout.ts:74`) lays regions out on rings by hops from the outline's first region, so the picture does not move as the player travels. Settlements sit around their region. Unrevealed regions hide their settlements; a revealed unvisited settlement is greyed; a visited one is full. Roads that touch fog are unknown. The marker is the current settlement, or a point along the journey by `legsDone` / `legsTotal`. `WorldMapModal` draws that layout in our own SVG (biome glyphs, dashed unknown roads, region outline, marker), with drag pan and wheel / pinch / button zoom. No second place store and no fast travel.

## Tests

`src/game/worldMapLayout.test.ts` (6) passed inside the full vitest run (no world-map failure).

## ruleCount TOTAL

Clean HEAD (worktree `.tmp-wt-mergewm`, removed after): files 490, lines 163184, regex 6920, newRegExp 380, lists 1187 (6246), fns 11777.

This merge: files 491, lines 163339, regex 6920, newRegExp 380, lists 1187 (6246), fns 11795.

regex, newRegExp, and lists match. Files, lines, and functions rise by `worldMapLayout.ts` (155 lines, 18 functions, no regex and no string list). `WorldMapModal.tsx` is under `src/components` and is outside the scanner. No deletion from main.

## Gates

| Gate | Result |
|---|---|
| vitest | 108 failing / 2878 passed / 1 pending. mergeqv's saved run was 109 failing / 2871 passed. The only failure name that was not in that run is `seed94InfestationClear` (allowed flake). Two names from that run did not fail this time (`playtest27aRepair1`, `s85Roots`). No world-map test failed. |
| replay bank | 62 failing / 565 passed / 28 skipped (limit 64). Same failing count as mergeqv. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). No errors in `worldMapLayout.ts` or `WorldMapModal.tsx`. |
| build | green. |

## Replay staging (R1–R16)

None of R1–R16 is the world map. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

None for this merge.

## Ship

Stamp `2026-10-16z10` is on `main` (`a895cd6f`). No edge file changed, so `gm-turn` was not deployed.

Vercel project `project` and Vercel project `synaptic-game-engine` built `a895cd6f`. Live `https://www.synapticgm.com/version.json` is `2026-10-16z10`.

TT_DONE
