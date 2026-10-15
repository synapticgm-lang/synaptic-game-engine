# q31-LToff - LanguageTool removed for good

Order LT-off from `docs/orders/queued-fix-orders.md` (John 12:47). Removal only: no replacement grammar regex, word list or checker was added.

## Cause

- `src/game/warden.ts:244` (at `1c4412be`) turned on `enableGrammarCheck` for the High tier, and `warden.ts:308` then ran `applyProseWardenAsync`.
- `src/game/proseWarden.ts:1668-1684` ran `applyProseWarden` and then `quickGrammarCheck` from `src/game/grammarCheck.ts`. That file sent the prose to the public `api.languagetool.org` and applied its replacements.
- The edge copy `supabase/functions/_shared/gm/proseWarden.ts:1675` imported `./grammarCheck`, which does not exist on the edge. The import failed and the failure was caught silently.

## Fix

- Deleted `src/game/grammarCheck.ts`.
- `proseWarden.ts` (src and edge copy): removed `enableGrammarCheck` from `ProseWardenContext` and deleted `applyProseWardenAsync`. The wrapper had no other job. `applyProseWarden` is now the only prose path. The comment at :780 no longer mentions LanguageTool.
- `warden.ts`: removed the High-tier flag, the ctx field and the `polishedBase` branch. `runWarden` stays `async` (`Promise<WardenResult>`), so no caller changed.
- `npm uninstall languagetool-api` (`package.json`, `package-lock.json`).
- `src/legal/credits.ts`: removed the `languagetool-api` row. `src/game/ttCoinCredits.test.ts:104`: dropped its assertion (John 12:47).
- `git grep -i -E "languagetool|grammarCheck" -- src supabase scripts package.json` returns nothing.

## Deletions

Logged in `docs/orders/tt-cut-log.md` under "q31-LToff LanguageTool removed for good".

## Replay staging (R1-R16)

None belong to this order. LT-off removes a High-tier network call and has no scene behaviour to replay. Replay and autoplay run on Free, which never ran the check.

## Tests / gates (run outside the model)

| Gate | Result |
|---|---|
| vitest | 76 failing, 0 new vs the q31-scanner baseline. The first full run showed 78. The 2 extra (`playtest27aRepair1` 27b S3, `seed94OpeningHealthPresence` blue panel, which was a STACK_TRACE_ERROR) passed alone and were absent on a full rerun, so they were load flakes. |
| replay bank | 57 failing (limit 64), 0 new |
| tsc (`tsconfig.app.json`) | 550 (limit 552). Down 2 with the package gone. |
| build | green |

## ruleCount before / after

| | files | lines | regex | newRegExp | lists (entries) | fns |
|---|---|---|---|---|---|---|
| TOTAL before | 495 | 167601 | 7366 | 422 | 1194 (6317) | 12073 |
| TOTAL after | 494 | 167422 | 7366 | 422 | 1194 (6317) | 12062 |

OLD14 is unchanged (8470 / 847 / 90 / 19 (271) / 1031).

## Prose regression check

No lap was run, because this session runs no laps. The removed path ran only on the High tier, and autoplay laps run on Free. Free never called LanguageTool, so the next lap's readability gate count, judge "broken"/"stiff" P0s and factCheck flags should not move from this change. Compare them on the next lap.

## Stamp

`2026-10-15l` -> `2026-10-15m` (`public/version.json`, `index.html`, `Hud.tsx`, `runManifest.BUILD_STAMP`, stamp tests). The edge `proseWarden.ts` changed, so this is synced and `gm-turn` is deployed.

## NEXT

- Nothing left from LT-off. Next in the queue is B + F (replay seam and clock).
