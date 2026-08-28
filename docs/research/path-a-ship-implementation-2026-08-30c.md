# Path A ship — implementation note (2026-08-30c)

**Stamp:** `2026-08-30c`  
**Bundle:** Opening GM call + turn-fail class  
**Prior:** `2026-08-30a` / hide chrome `2026-08-29g`

## Shipped

| Item | Module |
|---|---|
| Opening/New Game GM uses real `callGm` args | `callOpeningGm` — `result.text`, timeout |
| TypeError / ReferenceError / `GM proxy error` / blank classify | `classifyTurnFailure` |
| Continue keeps previous session in next export | `debugLogger` `LAST_SESSION_LOG_KEY` |
| Vitest | `playtest29hTurnFail` |
| Stamp | HUD / index / `BUILD_STAMP` = `2026-08-30c` |
| Mid writer | **OFF** |

## Redeploy

Client only. Hard refresh after Vercel lands.
