# PYOA-FLAGS report

## Files changed
- `src/game/pyoaSpine.ts` — `when` / `variants` on spine types; UMBRA build carries both; `legalSpineExits` gates on `pyoaCondHolds`; page helpers + `spineSelfEnding` use `resolvePyoaPage`; test-only `installPyoaTestSpineNodes`
- `src/game/pyoaCond.ts` — unchanged (API kept; already pure / import-free)
- `src/data/pyoa/umbraBook.json.d.ts` — additive `exits.when?`, `nodes.variants?`, `nodes.place?`
- `src/game/pyoaFlags.test.ts` — new vitest coverage
- `supabase/functions/_shared/gm/pyoaSpine.ts` — synced
- `supabase/functions/_shared/gm/pyoaCond.ts` — newly synced (import graph from pyoaSpine)

Did **not** edit `umbraBook.json`, XP code, or other worktrees. No push / deploy.

## How gating and variants flow
1. **Flags** still live on `state.pyoaSpine.flags` (set by exit `setFlags` in `applyExit`). Mid-book saves already persist them.
2. **Exit chips / match / auto-pick / snapshot / fuzzy:** every consumer goes through `legalSpineExits` → `spineChoiceLabels` / `spineEngineChipLabels` / `matchSpineExit` / `formatPyoaSpineSnapshotLines` / `choiceEdge` / `choiceCompiler` / Fate. An exit is legal only when `pyoaCondHolds(exit.when, flags)` (and existing Thornferry Wren gates). Missing `when` = always offered.
3. **Dead-end safety net:** if every exit fails `when` on a non-ending node, offer exits with no `when`; if none, offer all exits. Never throws.
4. **Page text:** `authoredPageText` / `authoredStartPage` return `resolvePyoaPage(node.page, node.variants, flags)`. `spineSelfEnding` resolves `dest.page` with flags **after** that exit’s `setFlags` would apply.

## Tests
`src/game/pyoaFlags.test.ts` (5): condition equal / array / `_` / `true` / `not` / `any` / AND; page before/after/replace/order/no-match; `legalSpineExits` + `spineChoiceLabels` on a synthetic book; never-dead-end fallback; `authoredPageText` variant layer.

Related spine tests still pass aside from the pre-existing `playtest15a` HUD stamp expect (`2026-10-16d` vs live `2026-10-27a`).

## Gate
- `npx vitest run src/game/pyoaFlags.test.ts` — 5/5 pass
- `npx tsc --noEmit -p tsconfig.app.json` — 547 errors (≤552)
- `npm run build` — clean
- `node scripts/sync-gm-edge-shared.mjs --check` — clean

ORDER_DONE
