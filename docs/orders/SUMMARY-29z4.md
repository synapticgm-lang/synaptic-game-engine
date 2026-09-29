# SUMMARY 29z4 — tester tells the truth, and the seed-66 failures stop

Commit: `4c0f50b` (code + stamp) on `main`, pushed with this summary.
Stamp: `2026-09-29z4` (HUD, `index.html`, `public/version.json`, `runManifest`, stamp tests).
No playtest, no T10 / T100. No edge file changed, so no edge deploy.

## Tester (`src/game/turnCheck.ts`)

The hypothesis was right on all three points.
- The first word of the action is the verb, so it is dropped from the words the prose must name. "keep" is no longer a stop-word. "Investigate the keep" now looks for "keep", and "asking after the keep" passes.
- Stems drop plural and verb endings before matching ("exits" becomes "exit"), so "marking each exit" passes.
- A walk with no object ("Walk on", "Keep walking") passes when the prose moves the body ("crossed", "stepped", "watched them pass", "kept going"). A walk the prose never moves is still a down.
- Travel: only the destination counts (the chip destination, or `journey.to`). The ground on the way ("Back streets") and the new current location no longer count. A capitalised short name counts ("the Close" for Cathedral Close). A lowercase common word does not ("drew close"). RPG T6 "Travel toward Salt Road Waystation" with only "kept to the back streets" is now a P0.

## Gemini notes (`scripts/fate-autoplay/autoThumbs.mjs` + new `judgeNotes.mjs`)

- The key lookup reads `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY`, from the environment or from `.env.local` / `.env` / `scripts/.env`.
- Reply text is read from `message.content` (string or parts). If that is empty, it is read from `message.reasoning`.
- Parsing takes a JSON array, fenced or not. If the array is cut off, it keeps every complete verdict object.
- Turn labels like `"T5"` now match turn 5. Before, `Number("T5")` was NaN, which alone could produce "0/10 turns judged". The prompt labels turns `T5`, so the model tends to echo that.
- A batch that returns no usable verdict counts as failed. If no turn was judged, the status reads `failed (model, 0/N turns judged, …)`, not `ok`.
- The API was not called in this order.

## Game (seed-66 causes)

- **Who-are-you:** `openingSpokenIdentityQuote` no longer falls back to "We are the ones who found you here." A speaker with an info sheet gives their name. A bare role label gives no canned line, so the writer answers as that person. The who-ask speaker is the opening-cast lead, else the person whose sheet puts them here, else the card role (`openingWhoSpeaker`).
- **"streets's" / "The back streets of the streets":** the name list the writer sees split the last word off every name, so "Back streets" added a bare "streets". It now only splits off a capitalised last word ("Close" from Cathedral Close still works).
- **Lowercase splice ("no mind. the innkeep"):** a salvaged token line that starts with a painted label now gets a capital.
- **"same worn their clothes":** the kit determiner check now looks at the whole noun phrase before the token: up to three words back, stopping at a preposition. "in the same worn @kit" and "in worn @kit" get no possessive. "They kept @kit" still becomes "kept their clothes".
- **T11 "here" on the old place:** `playerFacingLocation` preferred the location sheet name, which still held the opening arena after the walk. The sheet name now wins only when it names the current place (or a place inside it). Otherwise the place just entered is "here".

## Tests

- New `src/game/playtest29z4TesterTruth.test.ts` (20 tests) passes.
- Four older tests asserted the canned "we found you here" line (10f, 10j, 11b, 12g). They now assert the role answers without it.

## Checks

- tsc (`tsconfig.app.json`): 601 errors, same as before.
- vitest: 128 failures, the same names as `docs/orders/vitest.json`. No new failure names.
- build: exits 0.

Checks that still fail: the same 128 baseline vitest failures and the same 601 tsc errors. Nothing new.

Leftover: the edge copies under `supabase/functions/_shared/gm/` were not synced (no edge deploy, per the order). Hosted `gm-turn` still uses the client-built packet, so the name-list, who-line and "here" fixes reach the writer from the client. The judge fixes are untested against a live Gemini reply (no API call in this order).

ALL DONE
