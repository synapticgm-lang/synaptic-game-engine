# ORDER PYOA-FLAGS: make authored PYOA books read their flags

Branch `pyoa/books` (this worktree). Do not push or deploy. Do not touch XP code. Do not touch any other worktree.

## Why (root cause)
Umbra (`src/data/pyoa/umbraBook.json`, 999 pages) sets 9 flags on 54 exits (`setFlags`), the engine stores them in
`state.pyoaSpine.flags`, and nothing ever reads them. Earlier choices cannot change later pages or later choices.
Fix the engine and data format once, properly, so any authored PYOA book can gate exits and vary page text by flags.
Umbra stays offline and AI-free. The game stays SRD-free here (this is gamebook logic only).

## Already written for you (read it, keep its API)
`src/game/pyoaCond.ts` is pure and has no imports: `pyoaCondHolds(cond, flags)`, `resolvePyoaPage(page, variants, flags)`,
`pyoaCondFlags`, `pyoaCondReads`, types `PyoaCond`, `PyoaPageVariant`. You may fix bugs in it, add tests, but keep the
exported names and JSON shapes, because scripts import it directly with node (type stripping), so it must stay free of
imports and of TS-only syntax that node cannot strip (no enums, no parameter properties).

## Data format (additive; existing JSON stays valid)
- Exit: optional `when: PyoaCond`. The exit is only offered (chip, matching, auto-pick, snapshot lines, fuzzy match) when it holds.
- Node: optional `variants: PyoaPageVariant[]`. The page text shown to the player is `resolvePyoaPage(node.page, node.variants, flags)`.
- Safety net: if gating removes every exit from a non-ending node, offer the exits that have no `when` (never a dead end);
  if there are none, offer all of them. Never throw.

## What to build
1. Wire `when` into `legalSpineExits` and every place that lists, matches or counts spine exits (`spineChoiceLabels`,
   `spineEngineChipLabels`, `matchSpineExit` callers, `choiceEdge.ts`, `choiceCompiler.ts`, `fateAutoplay.ts`, snapshot lines).
   Search for every use of `exits` on spine nodes and of `node.page` / `dest.page` / `authoredPageText` / `authoredStartPage`.
   Every place that shows or reads the page text must use the flag-resolved text (flags from `state.pyoaSpine.flags`;
   for `dest.page` in `spineSelfEnding` use the flags the exit would set).
2. Carry `when` and `variants` through the `UMBRA_SPINE` build in `pyoaSpine.ts` (type `PyoaSpineExit.when`, `PyoaSpineNode.variants`),
   and update `src/data/pyoa/umbraBook.json.d.ts` (exits: `when?`, nodes: `variants?`).
3. A saved game in the middle of a book must keep working: flags already live in saves, nothing new to persist.
4. Edge copies: `supabase/functions/_shared/gm/pyoaSpine.ts` is a generated copy. Run `node scripts/sync-gm-edge-shared.mjs`
   after your change and keep `--check` clean. If `pyoaCond.ts` becomes part of the import graph, the sync script must pick it up.
5. Tests (new file `src/game/pyoaFlags.test.ts`, vitest): condition matching (equal, array, `_` unset, `true`, not, any, AND of keys),
   page variants (before/after/replace, order, no match = base text), exit gating through `legalSpineExits` with a tiny synthetic
   book (build the state by hand; do not edit umbraBook.json), the "never a dead end" safety net, and that `spineChoiceLabels`
   follows the gate. Do not edit `umbraBook.json` in this order.
6. Do not rename or reformat unrelated code. Fix root causes only.

## Gate (same as the merge gate)
- No new failing tests beyond `merge-logs/baseline-fails.txt` + `merge-logs/known-flaky.txt`.
- `npx tsc --noEmit -p tsconfig.app.json` has 552 or fewer errors.
- `npm run build` is clean.
Run only the tests you touched plus related PYOA tests while working; the wrapper script runs the full gate afterwards.

## Report
Write `docs/orders/pyoa/PYOA-FLAGS-report.md`: files changed, how gating and variants flow through the engine, tests added.
Last line exactly `ORDER_DONE` or `ORDER_STOP`.
