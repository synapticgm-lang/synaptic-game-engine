# Inspect → name-ask (Class B) — 2026-08-30T

**Live:** synapticgm.com HUD `2026-08-30S`. Phoenix Ashrise theme (HUD “Phoenix Ash…” is the theme, not a locked PC name).

**Player:** chose offered chip **Inspect the immediate surroundings**. GM wrote **“They are still waiting for a name you will own.”** John: “Didnt ask for a name and this was an option offered.” Follow-ups: options must stay relevant; thumbs on every GM beat including the starter; tester/staff/player/admin can all rate.

**Screenshot:** `screenshot.png` (copied from the playtest capture).

## Root cause

`applyOpeningAnswer` treated inspect as a failed **name cover** parse. After `sceneWritten`, only `isPlayerQuestion` deferred to play. Inspect is not a question, so the name cover stayed current and the canned parse-fail line fired:

`They are still waiting for a name you will own.`

(`src/game/openingEstablishment.ts`)

Option relevance already exists (invented-context filter, LAST PAD, stall recycle, ChoiceCompiler cooldown) but **does not** drop leftover name/origin/kit cover chips after a physical inspect. `resolveOfferedChoices` preferred `establishmentChoices` whenever opening was still pending.

Thumbs were **not** gated on Test Lab / staff / `play_access`. They were missing because:

1. Classic `LogRow` never mounted `GmResponseFeedback` (only NarrativeView).
2. Feedback unique key was `(user_id, save_id, turn_number)` — opening is turn 0; loading hid the buttons (`if (loading) return null`).
3. `bibleId={state.bibleId}` was undefined (`campaignBibleId` is the field).

## Fix

- Look-around / inspect after the opening scene **defers to play**. Name cover stays on the ledger; no name-waiting prose; no name chips spawned by inspect.
- Pad filter drops “Give them your name” / “Tell them who you are” / similar when the last player act was inspect and they did not mention a name.
- Thumbs on NarrativeView **and** classic LogRow for every real GM story (including opening / turn 0). Keyed by `log_entry_id`. Any signed-in account. SQL `021`.

**Stamp:** HUD `2026-08-30T` / BUILD `2026-08-30m`. Mid writer OFF.
