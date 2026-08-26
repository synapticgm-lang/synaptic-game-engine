# Playtest 2026-08-26 — Free mid-game GM timeouts

**Session:** `aaabaae0-751b-4c9d-98cf-9e4de623bb5f`  
**Stamp fixed:** `2026-08-26c`

## Root cause

Continue mid-campaign (turns 15–18) used `GM_PROXY_TIMEOUT_DEFAULT_MS` = **30s**. Free/DeepSeek often needs longer → client abort → Class A transport retries → busy modal “retrying (2)” → exhausted with “still compiling” proxy message.

Every fail in this export: `kind: timeout`, `timeoutMs: 30000`.

## Fix (26c)

| Phase | Before | After |
|---|---|---|
| First post-open / honeymoon | 75s | 75s (unchanged) |
| Early (turn ≤ 8) | 55s | 55s (unchanged) |
| Mid/late default | **30s** | **55s** |
| Mid/late Free hosted | **30s** | **60s** |

Also: timeout busy copy → `Timed out — retrying (N)…`; skip expand + quality-retry after a transport retry in the same turn.

## Evidence

- `synaptic-debug-session-aaabaae0.json` — full error-log paste
- `synaptic-debug-latest.json` — same snapshot
