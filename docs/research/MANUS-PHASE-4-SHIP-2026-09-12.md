# Manus Phase 4 ship (2026-09-12)

**Stamp:** HUD/BUILD `2026-09-12c`  
**Branch:** `fireworks-free-09a`  
**Honest count:** **24** unique Summoned Pact cards — not 200. Existing bible deck stays (~20+). Combined `openingHookDeck` is ≥44 unique locations.

## What Phase 4 is in code

An authored **opener deck**, not a writer rewrite and not a GM call.

- `src/data/campaigns/summonedPactPhase4Hooks.ts` — 24 unique `location` / `faction` / `summonIntent` / `openingOffer` / `page1` cards
- Spread onto `summonedPact.openingHooks` (same seed pick as New Game stitch)
- Other flagship decks (Cursed Keep, Salt Road, Thornferry, Hero Awakening) keep their existing catalogs — **not** cloned to 200
- No `callOpeningGm` on New Game. No SNAPSHOT/CRAFT. Mid writer OFF.

## New Game preview

`previewOpeningHook(bible, openerSeed)` in `openingEstablishment.ts` is the **same card** `resolveOpeningHookPick` / `stitchOpeningScene` will use.

- New Game premade picker paints Place / Why / Cast / first line (`data-testid="opening-hook-preview"`)
- **Another opening** calls `freshOpenerSeed()` so the player can reroll before Start
- Same seed is stable; different seeds can pick another card
- Preview is local — no GM spend

## Tests

`src/game/playtest12cManusPhase4.test.ts` — 24 unique Phase 4 locations, deck ≥44, preview matches stitch, seed stability.

## Cut from the plan

- 200 unique hooks (honest 24 extra SP cards)
- Rewriting every bible to a 200-card deck
- 60-seed density / 4×T50 gate
- Stitch-as-writer / SNAPSHOT/CRAFT / new GM prompt rules
- `gm-turn` deploy (client + Fate only)
