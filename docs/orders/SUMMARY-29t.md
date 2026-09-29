# SUMMARY 29t — thumbs on fate-autoplay

Stamp `2026-09-29t1`.

## What changed

- `scripts/fate-autoplay/run.ts`: new `scoreRunThumbs(runDir)` runs the existing scorer, `node scripts/fate-autoplay/autoThumbs.mjs <runDir>`, with no `--notes`. It is called after every `runFateAutoplay` in `run.ts` (single run, matrix / matrix-40, and both blocks of night-storyforge), once that run's `turns.jsonl` is written.
- If the scorer fails (spawn error, non-zero exit, or a throw), the error is logged as `→ thumbs failed …` and the run keeps going. A thumbs failure never stops the game.
- No new store, feed format, or scorer. No model call.
- Stamp `2026-09-29s1` → `2026-09-29t1` in `Hud.tsx`, `runManifest.ts`, `index.html`, `public/version.json`, and the stamp checks in the playtest tests.

Not covered: `--modes-agents-300` runs its cells through `modesAgents300.ts`, which the order did not name, so those cells still get no automatic thumbs.

## Existing runs scored (not replayed)

| Run folder | thumbs.json |
|---|---|
| `2026-09-29T12-22-54-912Z_summoned-pact_cold-system_s62` | yes |
| `2026-09-29T12-32-56-215Z_cursed-keep_chilled-gm_s62` | yes |
| `2026-09-29T12-37-00-107Z_salt-road-heist_chilled-gm_s62` | yes |

Each folder also got `report.md` from the same scorer. `scripts/fate-autoplay/runs/` is gitignored, so these files stay local and are not committed.

## Check

- A 2-turn `--dry-run` (no GM calls) into a temp folder logged `→ thumbs.json written` and left `thumbs.json` in the run folder.

## Gates

- tsc (`tsconfig.app.json`): 601, the same set as the stashed baseline (compared with line numbers stripped).
- Vitest: 1928 tests, 128 failed, same as baseline. No new failure names.
- Build: exit 0.
- No edge deploy. No T10, no T100.

ALL DONE
