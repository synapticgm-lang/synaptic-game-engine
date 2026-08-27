# Path A ship — implementation note (2026-08-28b)

**Stamp:** `2026-08-28b`  
**Bundle:** Follow-on to `2026-08-28a` (John authorized push)

## Shipped

| Item | Module | Notes |
|---|---|---|
| T12 hook STATUS wiring | `arcDirector`, `useGame`, `stateTx` | Beat commits stamp `turn+1`; `formatArcStatusReceipts` → player STATUS |
| Mid writer NO | `writerPolicy.ts` | `STAGNATION_MID_WRITER_ENABLED = false`; `resolveWriterTierForTurn` never escalates |
| B045 daily milestone | `dailyMilestoneLedger.ts` | +20 XP first quest objective tick per UTC day (LitRPG) |
| I07 discovery uniqueness | `discoveryXpLedger`, `qualityGovernance` | `isDiscoveryExhausted` hard block on commit |
| I10 hub beat exhaustion | `choiceCompiler` | Gate/travel pads drop after 2 hub beats at hub |
| Receipt liveness telemetry | `receiptTelemetry.ts`, `fateAutoplay` | Per-turn `receiptCounts` in turns.jsonl |
| Run manifest output | `fateAutoplay` | `manifest.json` + `runManifest` on summary.json |

## T12 hook (confirmed)

Talk-only Summoned Pact path: `sp-beat-orient` @ T2+, `sp-beat-hear-reason` @ T4+ on talk → quest stage-2 +45 XP + STATUS lines. **Not** level-by-T20.

## Deferred (unchanged from 28a)

- Wave 3 sealed manifest / deterministic fallback prose
- Wave 4 clean 12×300 eval under manifest
- Stagnation Mid writer (Option 10) — **NO** until Wave 5 gates pass
- Full replay hash verifier (B007)

## Verify

```bash
npm test -- src/game/playtest28aArcDirector.test.ts src/game/playtest28bManusSlice.test.ts
```

**Redeploy:** Client-only.
