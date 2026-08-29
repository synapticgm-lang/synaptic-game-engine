# Memorable plate vs opening prose — FIX 2026-08-30W

## Issue (Josie, HUD 2026-08-30S)

Chapter One plate: character **collapsed** on **plain rectangular slabs**.  
Committed prose: **standing** on a **circular mosaic** of cracked tiles.

## Root cause

`pinOpeningHereScene` preferred `pickedHook` over committed GM prose (`hook || stripped`). Summoned Pact hook cards often say “on your back.” A second regex treated `summoning circle` / `cold stone` as a **lying-on-the-floor** splash even when the writer stood them on a mosaic.

## Site-wide lock (not mosaic-only)

`formatSceneArtLock` in `src/game/sceneArtLock.ts` binds **stance, floor, presence, place** from committed prose + `sceneFacts` (hook only if prose is empty). Wired into:

- All memorable beats (`synthesizeMemorablePrompt` — opener, death, ending, boss, legendary, ruler, beauty, writer-tag)
- `buildImagePromptForKind` / `ImagePromptContext` (generate-image)
- `buildDeterministicOnePanel` (BeatSpec)
- `buildVisualConsistencyBlock` (every plate’s continuity block)

No hardcoded “on the floor” Chapter One splash. Kid Mode / copyright-safe original art unchanged.

## Files

- `src/game/sceneArtLock.ts`
- `src/game/memorableMoments.ts`
- `src/game/comicImagePrompt.ts`
- `src/game/comicBeatSpec.ts`
- `src/game/visualConsistency.ts`
- `src/game/useGame.ts` (`sceneImageContext` passes last GM + sceneFacts)
- `src/game/playtest30wPlateRewrite.test.ts`
- `src/game/memorableMoments.test.ts`

## Residuals

- Already-generated plates on this save will not regenerate.
- HUD chip left to the home-scroll agent (`Hud.tsx` not touched). Index meta `2026-08-30W` / BUILD `2026-08-30p`.
- Mid writer OFF.
