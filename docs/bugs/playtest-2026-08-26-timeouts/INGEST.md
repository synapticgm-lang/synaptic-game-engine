# INGEST — playtest timeouts 2026-08-26

**Ingested:** 2026-08-26 (full debug dumps from John Downloads)  
**sessionId:** `aaabaae0-751b-4c9d-98cf-9e4de623bb5f`

## Sources copied

| Source | Dest |
|---|---|
| `Downloads/synaptic-debug-latest (1).json` | `synaptic-debug-latest.json` |
| `Downloads/synaptic-debug-session-aaabaae0.json` | `synaptic-debug-session-aaabaae0.json` |

## Verdict from dumps

- Mid-campaign **Continue** on turns **15–18**
- Every Class A fail: `kind: timeout` with **`timeoutMs: 30000`**
- Client aborted Free/DeepSeek before the writer finished → transport retries → exhausted

## Code status

Stamp **2026-08-26c** already on `main` (`5375e73`): mid-game default **55s**, Free hosted **60s**, first-post-open **75s**, busy copy `Timed out — retrying (N)…`. No further timeout change in this ingest. 26b choice grounding left untouched.
