# q31-mergeacc1

Merged `acc-1` (`5787681f`, from ACC-1a `0f856eeb`) into `main` with `git merge --no-ff acc-1`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change (Settings > Accessibility: text scale, contrast, motion, easy-read font, read-aloud speed and choices). Stamp `2026-10-16z11` (was `2026-10-16z10`). No edge file changed against main, so `gm-turn` was not deployed.

Branch report: `docs/orders/q31-ACC1.md` is not on `acc-1`. The branch commits are the report:

- `0f856eeb` ACC-1a: Accessibility tab + central text scale (root font-size; px font sizes to rem at build)
- `7d06338c` ACC-1b: central contrast tokens (`text-slate-300`..`600` via CSS variables, AA by default) + High contrast setting
- `c3f09fd9` ACC-1c: read-aloud speed/volume, read choices aloud, screen-reader live region for new beats
- `5787681f` ACC-1d: global focus outline, Reduce motion setting (follows device by default), Easy-read font with WCAG spacing

Those commits do not touch `docs/orders/tt-cut-log.md`. Main's cut log stays. One cut was made on the way in and logged under `q31-mergeacc1`.

## Cause

Settings had no single place that applied text size, contrast, motion, and the read-aloud controls. Each screen would have needed its own patch. `acc-1` puts that in `applyAccessibilityToDocument` (`src/game/accessibility.ts:115`), called from `src/App.tsx` once the settings object changes.

## Conflicts

1. **`src/App.tsx` imports.** Main has `canOpenMerchant` from `merchant` (shop-b). `acc-1` has `applyAccessibilityToDocument` from `accessibility`. Both stay. The merchant gate still runs at the merchant button. The accessibility effect still runs on `game.settings`.

`src/game/types.ts` and `src/game/useGame.ts` auto-merged. `Settings` extends `AccessibilitySettings`. Read-aloud still goes through `withChoicesSpeech` on the existing speech payload.

## Fix

One module owns the settings and paints them on `<html>` (font-size percent, `sgm-high-contrast`, `sgm-reduce-motion`, `sgm-readable-font`). Tailwind `text-slate-300`..`600` read the same CSS variables. The spoken-choice line still adds a full stop when the chip has none; that check reads the last character. The regex `/[.!?]$/` from `acc-1` was not kept (see the cut log).

## Tests

`src/game/accessibility.acc1a.test.ts` through `acc1d` (19) passed. They are inside the full vitest run as well.

## ruleCount TOTAL

Clean HEAD before the merge (worktree `.tmp-wt-mergeacc1`, removed after): files 491, lines 163339, regex 6920, newRegExp 380, lists 1187 (6246), fns 11795.

This merge, same worktree plus only the merged `src/game` files: files 492, lines 163502, regex 6920, newRegExp 380, lists 1187 (6246), fns 11813.

regex, newRegExp, and lists match. Files, lines, and functions rise by `accessibility.ts`. No deletion from main except the incoming punctuation regex, which never landed.

## Gates

| Gate | Result |
|---|---|
| vitest | 108 failing / 2897 passed / 1 pending. mergewm was 108 failing / 2878 passed. No accessibility test failed. `seed94InfestationClear` did not fail. |
| replay bank | 62 failing / 565 passed / 28 skipped (limit 64). Same failing count as mergewm. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). The three `App.tsx` errors are the existing boot-phase comparison and `autoFightWarning` null checks. |
| build | green (again after the punctuation cut). |

## Replay staging (R1–R16)

None of R1–R16 is accessibility. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

None for this merge.

## Ship

Stamp `2026-10-16z11`. No edge file changed, so `gm-turn` was not deployed.
