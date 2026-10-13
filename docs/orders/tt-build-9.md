# tt-build 9: sheets, theme, dice

Ship: commit `9715d126`, stamp `2026-10-13y`. Live on https://www.synapticgm.com/version.json at 22:12 (about 50 s after the push). Client only; no edge deploy (`sync-gm-edge-shared --check`: edge copies match). No manual vercel.

## Check first: what already existed

Searched `src`, `docs` and `docs/library/RESOURCES-INDEX.md` for: builder / character builder / sheet page, `creationFlow`, `sheetLibrary`, `characterBuild`, `PREGENS`, `deriveTabletopSheet`, theme vars (`--sgm-*`), `data-sgm-dice`, `DicePreview`, `liveDiceItem`, `diceAnimation`, `sgm-dice-roll-excited`, `sgm-dice-fx-`, `rollDie`, STATUS roll lines.

| Part | Path | State before step 9 |
|---|---|---|
| Chip character creation (stages, validate, keep) | `src/game/tabletop/creationFlow.ts` | Working. No page; chips only. |
| Character maths, `PREGENS`, `deriveTabletopSheet`, `scoresForMethod`, `assignByPriority` | `src/game/tabletop/characterBuild.ts` | Working; reused as is. |
| Saved-sheet library + sync | `src/game/tabletop/sheetLibrary.ts`, `sheetLibrarySync.ts` | Working; no sheet preview. |
| Session-zero screen | `src/components/SessionZeroPanel.tsx` | Working; hardcoded slate colours, no builder. |
| In-game tabletop sheet | `src/components/CharacterWindow.tsx` (`DndSheet`) | Working; hardcoded slate boxes, not an SRD layout. |
| Character dashboard + Pre-Made Cards | `src/components/CharacterSheetView.tsx` | Dashboard showed a fake weight (item count); Pre-Made Cards were invented presets with a dead Select button. |
| LitRPG status window | `src/components/LitrpgSystemWindow.tsx` | Hardcoded sky colours. |
| Theme vars + materials | `src/index.css` (`--sgm-accent/bg/text/panel-texture`, `--sgm-dice-*`) | Working; sheets didn't use them. |
| Dice skins | `src/components/DicePreview.tsx` (`DicePreview`, `liveDiceItem`) | Working; only in the shop, themes and tray. |
| Dice animation setting (static / normal / excited) | `src/game/types.ts`, `defaults.ts` (`diceAnimation`), `SettingsModal.tsx` | Saved, but only the tray read it. |
| Excited effect CSS | `src/index.css` (`sgm-dice-roll-excited`, `sgm-dice-fx-*`) | Working; fixed length, not scaled to the roll. |
| Dice tray + formula builder | `src/components/qol/DiceTrayToolbar.tsx`, `DiceFormulaBuilder.tsx` | Rolled their own `Math.random`, not the dice rule. The formula builder ignored the animation setting and drew its own shapes. |
| Engine dice | `src/game/rules/dice.ts` (`rollDie`); STATUS lines from `checkRules` / combat / death saves | Working. Engine rolls in the play log showed as text only: no skin, no animation. |
| Creation dice | `creationFlow.ts` (`creationRng`) | Working; seeded from the save. |

Missing, so built new: the builder page, one shared SRD sheet layout, a sheet preview without a running game, and a reader that finds the d20s in a STATUS line.

## What landed (file:function)

### 9a: character builder
- `src/components/CharacterBuilderPanel.tsx:CharacterBuilderPanel` is the builder page, laid out like an open SRD 5.2.1 sheet (no WotC trade dress). It covers name, class, species, background, the score method (standard array / point buy / 4d6), kit and HP method, with a live preview.
  - Every number comes from the engine: `scoresForMethod`, `assignByPriority`, `validateSheet`, `deriveTabletopSheet`.
  - In play, 4d6 uses the save's `creationRng`, so it gives the same roll as the chips. That roll is kept and can't be re-rolled or typed over ("Rolled for this game").
- `src/game/tabletop/creationFlow.ts:takeBuiltSheet` sends a built sheet through the same confirm stage as the chips. A refused sheet stays on the start page, and it does nothing outside creation.
- `src/game/useGame.ts:applyBuiltSheet`, wired through `src/App.tsx` → `CenterPanel` (`onUseBuiltSheet`).
- `src/game/tabletop/sheetPreview.ts:previewSheet` / `previewSavedSheet` / `pregenSheets` build a sheet preview from saved picks with the same derive path as the game.
- `src/components/TabletopSheetLayout.tsx:TabletopSheetLayout` is the one shared sheet layout: abilities with saves, an AC / Init / Speed / HP / PB strip, skills, features, spellcasting (with concentration), and the SRD credit.
- Mounted in:
  - `SessionZeroPanel` (build new / view saved)
  - `CenterPanel` ("Open the character builder" while creation is pending)
  - `CharacterWindow:DndSheet` (in-game sheet)
  - `CharacterSheetView:DndDashboard` and `TabletopCards` (Pre-Made Cards in tabletop are now You + the real `PREGENS` + saved sheets, each with "View sheet")

### 9b: theme on every sheet
- `src/index.css` adds the `sgm-sheet-*` classes (boxes, labels, modifiers, proficiency marks, buttons). They use the theme accent, text, background and panel texture, with the old look as the fallback.
- These classes are used by the builder, saved-sheet previews, the in-game sheet, the dashboard and session zero.
- `src/components/LitrpgSystemWindow.tsx` uses `sgm-system-window*`, which follows the theme accent. Without a theme it shows the old sky blue.
- The STATUS panels in `CenterPanel:SystemLogPanel` and `NarrativeView` use `sgm-status-panel/head/line`.

### 9c: connect existing dice (nothing rebuilt)
- `src/game/rules/rollView.ts:splitRollLine` / `shownD20` find every d20 the engine already printed in a STATUS line, including several on a round or initiative line. It doesn't change the text and never rolls.
  - `rollAnimationMs` / `rollAnimationScale`: static 0; normal 450 ms; excited 700 ms + up to 800 ms and 1.0 to 1.35 scale, both growing with the engine's kept number.
  - `emitDiceRoll` (`sgm:dice-roll`) is a hook for a later sound pack. It is skipped when the mode is static.
- `src/components/RollDie.tsx:RollLine` / `RollDie` put the player's own die (`DicePreview` + `liveDiceItem` skin + `sgm-dice-fx-*` material) before each engine d20.
  - Only the newest GM turn animates (`RollDisplayContext`); older turns stay still.
  - Crit and fumble glows come from the engine's number.
- `CenterPanel` busy die: `DicePreview` in the live skin and effect mode, instead of a generic icon.
- Unconnected dice parts found and fixed:
  - `DiceTrayToolbar` rolled its own random. It now rolls through `rules/dice.rollDie`, picks the result before the animation, and scales excited to the result.
  - `DiceFormulaBuilder` ignored the `diceAnimation` setting and drew its own die shapes. It now gets the setting, works out the result first, and uses `DicePreview` dice in the player's skin.
  - Engine STATUS rolls had no die at all; `RollLine` (above) adds one.

## What the player sees
- Tabletop: during character creation, an "Open the character builder" button opens a full sheet page. The player picks everything on one screen and sees the finished sheet before using it. The chips still work, and both give the same numbers.
- Saved sheets and the ready-made heroes open as a real sheet page, not a list.
- The sheet, saved sheets, session zero and the LitRPG status window take on the equipped theme's colours and texture.
- Every d20 in a STATUS line shows a small die in the player's dice skin. In normal mode it rolls briefly. In excited mode high rolls spin longer and bigger, with a glow on a 20 and a dull tint on a 1. Static shows no motion. The number is always the engine's.
- LitRPG and RPG: no die in STATUS (the engine already strips dice there) and no builder. Their sheets and Pre-Made Cards are unchanged. The only visible change is that the status window follows the theme accent.

## Tests
- New unit: `src/game/rules/rollView.test.ts`, 6 passing.
- New bank: `src/__tests__/replayBank/tt9.bank.ts`, 6 passing (cursed-keep ds151). Cases:
  - The builder sheet gives the same printed numbers as the chips.
  - The preview matches the in-game sheet (pregens and a point-buy rogue).
  - A refused sheet stays on the start page, and the builder does nothing outside creation.
  - 4d6 with `creationRng` gives the same roll as the chips.
  - Every d20 on the tape's STATUS gets a die.
  - LitRPG and RPG show no die and no builder.
- Whole replay bank: 96 files, 511 passed. LitRPG and RPG cases are green.
- writer-quality: the same 12 known failures (s78–s84); none new.
- tsc: 572 (baseline 572, ceiling 601).
- vitest: 76 failing against the 77 baseline; none in touched files. The 27 stamp tests pass on `2026-10-13y`.
- Build: green.
- Smoke: not run — NO TEST LAPS.
- OpenRouter spend: 0 USD.

## Mode maths differences to unify
None added. The step changed only display; no maths changed.

## NEXT (for John)
- LitRPG/RPG `PlainDashboard` still shows a fake weight (item count) and spellbook. I left it because those modes must not change.
- LitRPG/RPG Pre-Made Cards are still the old invented presets with a dead Select button. Same reason.
- The sheet validator accepts 4d6 scores as written for library and pasted sheets. The builder can't fake them in play, but a pasted sheet can.
- No dice sound pack exists. The `sgm:dice-roll` hook is ready for one.
- The formula builder's advantage subtotal multiplies the kept die by the count when count > 1. This is an old bug I noticed but did not touch.

TT_DONE
