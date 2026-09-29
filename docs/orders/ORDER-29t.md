# ORDER 29t thumbs on fate-autoplay

The game already stores thumbs and the trainer already finds them. Do not add a new store, a new feed format, or a new scorer. Do not call a model. Do not pass --notes.

Fate autoplay (scripts/fate-autoplay/run.ts) finishes a run and writes turns.jsonl, then stops. It never calls scripts/fate-autoplay/autoThumbs.mjs, so no thumbs.json is written and the trainer has nothing to find.

After each run has written its turns.jsonl, call the existing scorer on that run folder:
node scripts/fate-autoplay/autoThumbs.mjs <runDir>
No --notes. If the scorer fails, log the error and still finish the run. Do not stop the game for a thumbs failure.

Then score the three runs that already exist. Do not replay them.
- scripts/fate-autoplay/runs/2026-09-29T12-22-54-912Z_summoned-pact_cold-system_s62
- scripts/fate-autoplay/runs/2026-09-29T12-32-56-215Z_cursed-keep_chilled-gm_s62
- scripts/fate-autoplay/runs/2026-09-29T12-37-00-107Z_salt-road-heist_chilled-gm_s62

Gates: tsc stays 601, same set. Vitest: no new failure names (baseline 128). Build exit 0. No edge deploy. No T10 and no T100.

Stamp 2026-09-29t1. Commit and push only the named files you changed. Write docs/orders/SUMMARY-29t.md and end it with ALL DONE or STOPPED. Say whether each of the three folders now has thumbs.json.
