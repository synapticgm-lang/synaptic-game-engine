# tt-cut 1 — lap-10 roots through the shared mechanisms

Shipped as stamp `2026-10-14r` (live `2026-10-14q` → `r`), commit `1f50ec5c` on `main`. gm-turn deployed and boots (OPTIONS 200; POST `{}` → 400 `state is required`). https://www.synapticgm.com/version.json reads `{"hud":"2026-10-14r","build":"2026-10-14r"}`.

One fix run. No laps. No playtests. `humanJudge.mjs` left out on purpose.

## Gates

| Gate | Baseline | After | Limit |
|---|---|---|---|
| Vitest failing | 77 / 2676 | 79 / 2686 | no new beyond baseline + flakes |
| Replay bank failing | 64 / 628 | 64 / 628 (same set) | ≤ 64 |
| tsc errors | 570 | 570 | ≤ 570 |
| Build | green | green | green |

The two extra vitest failures are flakes, not new failures:

- `seed94InfestationClear` "pays 50 XP" — the random-seed flake already recorded in `tt-consolidate.md`.
- `openingEstablishment` "seals kit cover instead of blocking with a questionnaire" — failed 1 of 3 runs on the stashed original tree; 3 of 3 pass with this change.

No re-pins in the bank. The only test edits beyond the new file are the stamp pins (`2026-10-14q` → `r`, 23 playtest files; 255/255 pass).

## What changed (each root through an existing mechanism)

- **(a) Warden obeys this turn's event.** `obeyLedgerNouns` takes an optional `isThisTurnsEvent` check. A sentence with an invented name is still dropped, unless it carries this turn's event; then only the clause with the invented name is cut and the event clause stays. `applyProseWarden` passes the check through `ProseWardenContext.isThisTurnsEvent`; `useGame` and `fateAutoplay` hand it `thisTurnsEventCheck` from `writerTurn` (which now accepts a `{ state, playerInput }` pick). One `new RegExp` removed from `ledgerNounObey`.
- **(b) One canonical place name.** The only quest step across all bibles that used a hub alias was Cursed Keep's "Speak with Oskar at the Greyhollow Tavern"; the source text now says Greyhollow Inn (the hub's real name). An invariant test walks every bible so no step can name a hub by an alias again. A runtime alias resolver in `storyDataBoundary` was tried and reverted: it created an import cycle with `outdoorHubs`.
- **(c) Nudges use the first-sight card rule.** The `choiceRanking` hub nudge gets its detail from `placeFirstSight`, so card text only appears when that rule allows it (first entry or looking); otherwise the nudge names the place only.
- **(d) Exits count as the acted-on object.** `turnCheck` action-object-missing now reads exits from `handedExits` (the engine `Exits:` receipt, else the sheet). "Check the exits" is satisfied when the prose names a handed exit.
- **(e) One handed-facts list for worn items and speech.** `WORN_OR_BODY` and `BAG_WORD` moved from `tokenProse` into `engineFactPatterns`, which both the game gate and `scripts/factCheck.mjs` import. `factCheck` dropped its own `GARMENTS` / `BAG_WORDS` sets and its worn words in `ITEMS`. The exit-place check reads narration with speech masked, the same way the item check already did.

Trade-off: hood and cloak are now treated as worn by both checkers. Lap 10 had counted A T17's hood as a real item miss; it now passes, matching the game gate.

## Tests

`src/game/ttCut1.test.ts` (10 tests, all pass):

- (a) The lap-10 F T5 line keeps "Jax forced a path forward…" and loses only the "Brother Tam" clause, both in `obeyLedgerNouns` and through `applyProseWarden`.
- (b) The Cursed Keep step says Greyhollow Inn; no bible step uses a hub alias; a new game journal shows the real name.
- (c) A circling nudge off the first-sight turn names the place with no card text.
- (d) "Check the exits" with an Exits receipt is not flagged; unrelated prose still is.
- (e) Worn boots are not flagged as an item but a lantern is; "treeline" inside speech is not an exit-place claim but "The only other road led to the Treeline." is.

## Rule counts (same scanner as tt-consolidate, now saved as `scripts/ruleCount.mjs`)

| | Lines | Regex literals | `new RegExp` | String lists (items) | Functions |
|---|---|---|---|---|---|
| Before | 8781 | 895 | 91 | 30 (377) | 1064 |
| After | 8789 | 894 | 91 | 28 (354) | 1065 |

By file: `tokenProse` 1461→1457 lines, regex 174→172; `engineFactPatterns` 164→170, regex 28→30 (the two moved in); `writerTurn` 688→691; `turnCheck` 756→760, functions 107→108; `factCheck.mjs` 554→553, regex 131→130, lists 7 (180) → 5 (157). Outside the scanner's file set, `ledgerNounObey` lost one `new RegExp`. No new regexes or lists were added.

## Files

`scripts/ruleCount.mjs` (new), `scripts/factCheck.mjs`, `src/data/campaigns/cursedKeep.ts`, `src/game/{choiceRanking,engineFactPatterns,fateAutoplay,ledgerNounObey,proseWarden,tokenProse,turnCheck,useGame,writerTurn}.ts`, `src/game/ttCut1.test.ts` (new), stamp files (`index.html`, `public/version.json`, `Hud.tsx`, `runManifest.ts`, test pins).

Edge: the sync changed `supabase/functions/_shared/gm/ledgerNounObey.ts` and `proseWarden.ts`; gm-turn redeployed.

## Left open

- E T20 "Keep lookout" and B T14 verb swap were not in this order's scope.

TT_DONE
