# Path A ship — implementation note (2026-08-28a)

**Stamp:** `2026-08-28a`  
**Bundle:** `docs/research/recommended-ship-bundle-2026-08-27.md` (John authorized)

## Shipped (Wave 0–2 vertical slice)

| Module | Role |
|---|---|
| `runManifest.ts` | Immutable run manifest + event seq |
| `beatContract.ts` | 3–5 contracts × 4 flagship bibles |
| `arcDirector.ts` | Pre-GM beat select + commit (quest stage, encounter, XP chunk) |
| `choiceCompiler.ts` | Fingerprint cooldown + gate disposition + pad supplement |
| `npcTopicFsm.ts` | Exhausted dialogue topics |
| `socialMilestoneLedger.ts` | Talk/listen/overhear once XP (15–25) |
| `pressureClock.ts` | Stagnation T5+ SNAPSHOT snippet |
| `stateTx.ts` | `beat_commit`, `quest_stage` tx kinds |

**LitRPG pacing:** L1→L2 **200 XP** (`defaults.ts`); arc chunk **+45** on Circle's Price stage 2; inspect **once-per-evidence-id**; **T15** combat drought pressure.

**Integration:** `useGame` + `fateAutoplay` run ArcDirector before `callGm`; `qualityGovernance` delegates ChoiceCompiler + Arc SNAPSHOT lines.

**T12 hook default:** Quest stage-2 + STATUS receipt (not level-by-T20 requirement).

**Stagnation Mid writer:** NO (deferred Wave 5).

## Deferred

- Wave 3 sealed manifest / deterministic fallback prose
- Wave 4 clean 12×300 eval under manifest
- Full replay hash verifier (B007)
- Daily milestone XP (B045)
- Voice cadence Wave 5 / Opt 10 Mid writer

## Verify

```bash
npm test -- src/game/playtest28aArcDirector.test.ts
npm run fate-autoplay -- --matrix-40 --turns 20
```

**Redeploy:** Client-only for this batch. Edge `stateTx` stub synced for new kinds; no `gm-turn` logic change required unless SNAPSHOT edge copy is stale.
