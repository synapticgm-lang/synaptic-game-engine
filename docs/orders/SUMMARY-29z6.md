# SUMMARY 29z6 — the prose judge asks "is this turn good to play?"

Commit: `a744f28` on `main`, pushed with this summary.
No game prose changed. No playtest, no judge API call, no PYOA, no stamp bump, no edge file touched.

## Rubric (`scripts/fate-autoplay/judgeNotes.mjs`)

`PROSE_THUMB_RUBRIC` is still the one standard every notes batch sends, whatever `SGM_THUMBS_MODEL` is. It now also asks "is this turn good to play?", not only "did the turn break?", and lists five more downs:

- The prose plays the player: it writes their dialogue, feelings, or next decision instead of stopping after the world's reaction.
- The same habit, smell, light, or sentence shape comes back in new words.
- A fact appears that the scene and the info sheet never established (an invented person, place, or past event).
- The voice is wrong for the mode: a system ledger in tabletop or story RPG, or novel interiority where the mode wants a shared table.
- The turn ends by lecturing, listing options, or asking "what do you do?"

Right after that list the rubric says again: do not down a fair dice fail, a short honest empty, or a rules result, because a failed roll is not bad writing.

These rules stay as they were: one crime is enough for a down, most turns stay unmarked, and progress (XP, a new place, loot, a fight) is never a reason for an up.

## Local flags kept

The `turnCheck` P0s and downs are unchanged. The judge's ignored-action and stiff-line flags are unchanged too.

## Test

`src/game/playtest29z5ProseThumbRubric.test.ts` has one new test (5 tests now, no API call). It checks that the notes prompt contains "good to play?", all five new downs, the restated fair-fail exception, the one-crime rule, and the no-progress-up rule.

## Checks

- tsc (`tsconfig.app.json`): 601 errors, same as the baseline.
- vitest: 128 failures, the same names as `docs/orders/vitest.json`. No new failure names.
- Both passed on the first run, so no fix run was used.

The existing uncommitted edits in the tree (including `humanJudge.mjs`) were left alone and are not in this commit.

ALL DONE
