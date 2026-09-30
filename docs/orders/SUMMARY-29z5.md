# SUMMARY 29z5 — the prose-thumb rubric is the notes contract

Commit: `f8046bd` on `main`, pushed with this summary.
No game prose changed. No playtest, no judge API call, no stamp bump, no edge file touched.

## Rubric in one place (`scripts/fate-autoplay/judgeNotes.mjs`)

- `PROSE_THUMB_RUBRIC` holds the standard from the order: the "would I teach the next turn from this beat?" vote, what earns an up, the list of prose crimes, what not to down, which checks apply when, "most turns should be unmarked", and one concrete thing per comment. It also says progress is never a reason for an up.
- `buildJudgePrompt(batch)` builds the whole notes prompt: rubric, then the reply format, then the turns. `autoThumbs.mjs --notes` now calls it. The old inline `JUDGE_RUBRIC` in `autoThumbs.mjs` is gone. `SGM_THUMBS_MODEL` only picks the model. Every batch sends the same standard.
- The reply format asks for one object for every turn, with `"verdict":"up"|"down"|"unmarked"`. Anything other than up or down counts as unmarked. The `followed` (ignored action) and `stiff` fields are unchanged.

## Progress is not a prose thumb (`scripts/fate-autoplay/autoThumbs.mjs`)

- Fight won, level up, new place, loot, quest step and XP now go to a per-turn `progress` list. They no longer go to `up`. The report's Progress section gains a "Progress turns" line.
- Only the notes model puts a turn in `up`. Without `--notes`, no turn is thumbed up.

## Unmarked stays unmarked

- Each turn now has a `thumb` field. It is `null` until the model marks the turn, then `up`, `down` or `unmarked`. A turn the model skips keeps `null`, and nothing local fills it.
- `applyVerdicts` counts each turn once, even if the reply repeats it.

## Status line

- `notesStatus` reports how many turns the model marked, with the up/down/unmarked split and the number never marked.
- It says `ok` only when every turn came back, `partial` when at least half did, and `failed` when most turns were never marked.
- The report's Thumbs section splits into two lines: prose thumbs from the notes model (up / down / unmarked / never marked, plus the status), and turn verdicts from local flags plus the model.

## Local P0 checks kept

- `turnCheck` P0s and downs, junk labels, repeated lines, stalls and fight contradictions still set a turn to `down` as separate flags. The judge's ignored-action and stiff-line P0s are unchanged.

## Tests

- New `src/game/playtest29z5ProseThumbRubric.test.ts` (4 tests, no API call):
  - the notes prompt contains the rubric;
  - a reply marking 1 of 3 turns is not `ok` (says `1/3 … 2 never marked`) and gives the other two no thumb and no `up`;
  - an explicit `unmarked` counts as marked but is not a thumb;
  - a run with XP, loot and a new place and no model gives no prose thumbs-up; the report lists it under Progress turns.
- The 29z2 and 29z4 autoThumbs/judge tests still pass.

## Checks

- tsc (`tsconfig.app.json`): 601 errors, same as the baseline.
- vitest: 128 failures, the same names as `docs/orders/vitest.json`. No new failure names.

Leftover: the browser AI-player (`scripts/ai-player-browser/`) still thumbs each live turn with its own prompt and the `humanJudge` floor. This order covered the notes pass only. The pre-existing uncommitted `humanJudge.mjs` edit was left alone.

ALL DONE
