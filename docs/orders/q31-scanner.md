# q31-scanner — whole-tree ruleCount scanner

Scripts-only job (no order from `queued-fix-orders.md`; it does cover, and widens, RC-0 there). No game code changed. The ruleCount gate does not apply to this session.

## Cause

`scripts/ruleCount.mjs:5-20` (at `82cb32b4`) counted a fixed list of 14 files. The "ruleCount TOTAL must not rise" gate therefore saw nothing outside those files. A new regex or word list in any other `src/game` or `supabase/functions/_shared/gm` file went uncounted. One listed file, `src/game/fullProseGate.ts`, no longer exists, so the old TOTAL was really 13 files.

## Fix

`scripts/ruleCount.mjs` now walks every source file (`.ts .tsx .mts .cts .js .jsx .mjs .cjs`) under `src/game` and `supabase/functions/_shared/gm`. Tests (`*.test.*`, `*.spec.*`) and `.d.ts` are excluded. The counted metrics are unchanged: lines, regex literals, `new RegExp`, all-string lists of 3 or more (and their entries), and functions.

The output has one line per root, then `OLD14` (the old 14-path list, kept so the trend line continues), then `TOTAL` (the whole tree). Each line also prints a `files` count. `--files` prints one line per file.

## Baseline (main `82cb32b4`, 15 Oct 2026)

| Set | files | lines | regex | newRegExp | lists (entries) | fns |
|---|---|---|---|---|---|---|
| OLD14 (old TOTAL) | 13 | 8470 | 847 | 90 | 19 (271) | 1031 |
| `src/game` | 369 | 125868 | 5138 | 280 | 760 (4191) | 9081 |
| `_shared/gm` | 126 | 41733 | 2228 | 142 | 434 (2126) | 2992 |
| **TOTAL (new)** | **495** | **167601** | **7366** | **422** | **1194 (6317)** | **12073** |

From now on, "ruleCount TOTAL must not rise" compares the `TOTAL` line against this baseline. `_shared/gm` holds edge copies of many `src/game` files, so an edit to a synced file counts twice. That is consistent before and after an edit, so the gate still works. OLD14 includes `scripts/factCheck.mjs`, which is outside both roots. TOTAL does not count scripts.

The baseline is also recorded where later orders read it: under RC-0 in `docs/orders/queued-fix-orders.md`, and in the ruleCount line of `docs/orders/tt-overnight-fix-template.md`.

## Deletions

Logged in `docs/orders/tt-cut-log.md` under "q31-scanner whole-tree rule scanner" (the fixed file list as the only scope).

## Replay staging (R1-R16)

None belong to this order. It is a counting script with no game behaviour to replay.

## Tests / gates (run outside the model)

| Gate | Result |
|---|---|
| vitest | 76 failing, all present in the q31-P1 list (101, which included 24 stamp tests now on the new stamp). 0 new. |
| replay bank | 57 failing (limit 64) |
| tsc (`tsconfig.app.json`) | 552 (limit 552) |
| build | green |

## ruleCount before / after

Before: 14-file TOTAL lines 8470 / regex 847 / newRegExp 90 / lists 19 (271) / fns 1031. After: OLD14 is identical; the new whole-tree TOTAL is in the table above. No game code changed, so no rule count moved.

## Stamp

`2026-10-15k` -> `2026-10-15l` (`public/version.json`, `index.html`, `Hud.tsx`, `BUILD_STAMP`, stamp tests). No edge file changed, so there is no gm-turn deploy.

## NEXT

- If John wants scripts in TOTAL too (`scripts/factCheck.mjs`, `scripts/fate-autoplay/autoThumbs.mjs`, per the RC-0 brief), add `scripts` as a third root and re-record the baseline.
