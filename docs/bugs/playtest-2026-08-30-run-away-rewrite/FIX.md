# Player line rewritten — FIX 2026-08-30W

## Issue (Josie, HUD 2026-08-30S)

Typed **“I run away.”** Player bubble showed:

> I scan for any hostile threat before committing — if none is present, I stay alert and choose a safer scene action.

### Follow-up (same template leaked into GM prose)

GM then quoted a localized copy as spoken dialogue:

> “I scan the blue panel before committing,” you state … “if none is present, I stay alert and choose a safer scene action.”

Physical inspect/scan was treated as speech. “If none is present” has no referent in-world.

## Exact template / function

**Template** (constant `CANNED_SAFER_SCENE_LINE` in `src/game/intentParser.ts`):

`I scan for any hostile threat before committing — if none is present, I stay alert and choose a safer scene action.`

**Producer:** `groundPlayerAction()` — the block that fired when `parsePlayerIntent` was `attack` or `flee` and `sceneHasThreat` was false. That string was then:

1. Returned as `validateActionHard().rewritten`
2. Assigned to `hardGateRewritten` in `useGame` → became `rewriteSource` → **player bubble**
3. Assigned to `sanitizedInput = grounded.text` → **GM playerAction** (writer echoed it, swapped “hostile threat” for “the blue panel”)

**Why “I run away” matched:** `RULES` flee regex `/\b(flee|run away|retreat|escape|back away)\b/i`.

**Why inspect/scan became “you state”:** `isSpeechOrProtest` treated short `I …` lines as talk unless a small physical-verb list matched. `scan` / `inspect` were missing, so `I scan the blue panel` was `talk`, then the writer narrated `you state`.

## Site-wide lock (not a one-line patch)

- **Bubble:** `playerVisibleActionText` — typed/spoken line, Kid Mode mask only.
- **GM input:** `gmFacingPlayerAction` — never send the safer-scene template or an inspect→“I address” rewrite.
- **Speech vs action:** `playerTypedDialogue` + expanded `LOOK_OR_PHYSICAL` (scan/inspect/flee/leave/walk away). Talk/protest (16a) still honors real dialogue.
- **Warden (named, merge-safe vs crowd-count):** `scrubSaferSceneMeta` + `scrubFalseSpokenAction` in `proseWarden.ts`, called after `scrubInventedCrowdSize`.
- **Prompt rail:** `speechActRails` — physical acts are not speech; never write the meta phrases.

## Files

- `src/game/intentParser.ts`
- `src/game/useGame.ts`
- `src/game/fateAutoplay.ts` (log keeps `displayLine`)
- `src/game/proseWarden.ts` (`scrubSaferSceneMeta`, `scrubFalseSpokenAction`)
- `src/game/speechActRails.ts`
- `src/game/playtest30wPlateRewrite.test.ts`
- `index.html` (`2026-08-30W`) — HUD chip left to the home-scroll agent (`Hud.tsx` untouched)
- `src/game/runManifest.ts` (`2026-08-30p`)

## Residuals

- Already-committed log lines and GM beats on this save stay as written.
- Kid Mode still rewrites slurs / sex / gore.
- Mid writer OFF.
