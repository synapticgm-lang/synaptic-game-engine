# Path A ship — implementation note (2026-08-28c)

**Stamp:** `2026-08-28c`  
**Bundle:** Full ranked Manus follow-up from 28b (John authorized)

## Shipped

| Item | Module | Notes |
|---|---|---|
| Wave 3 sealed manifest | `sealedManifest.ts` | Beat/effects hash before GM; gist + required facts |
| Wave 3 deterministic fallback | `sealedManifest.ts`, `useGame`, `fateAutoplay` | Empty/timeout/fail → local prose; ledger preserved |
| B007 replay hash | `replayHash.ts` | Canonical slice hash per commit; chain verifier |
| B018–B021 ChoiceEdge | `choiceEdge.ts`, `choiceCompiler.ts` | Legal edges from beat registry + scene graph |
| B043 receipt liveness gates | `arcDirector.ts` | Combat by T8/T15; PYOA crisis by T12 (ArcDirector commits) |
| B022–B025 exhaustion suite | `npcTopicFsm`, `choiceCompiler`, `pyoaBranchLedger` | Topic FSM stage advance; hub gate matrix; PYOA branch ledger |
| Wave 4 eval harness | `evalHarness.ts`, `fateAutoplay` | `eval.json`; manifest binding; quarantine flags; liveness in summary |
| Chaos tests | `playtest28cManusComplete.test.ts` | GM fail after ArcDirector — ledger unchanged, fallback applied |
| Voice cadence Wave 5 | `voiceCadenceSystem.ts`, `qualityGovernance.ts` | Authority voice hints over sealed manifest |
| Mid writer | `writerPolicy.ts` | **NO** — `STAGNATION_MID_WRITER_ENABLED = false` |

## Deferred (unchanged)

- Stagnation Mid writer (Option 10) until Wave 5 gates pass on clean 12×300
- Full RenderCoordinator LLM repair (B027 one-repair against GM prose schema)

## Verify

```bash
npm test -- src/game/playtest28aArcDirector.test.ts src/game/playtest28bManusSlice.test.ts src/game/playtest28cManusComplete.test.ts
npm run eval:12x300
npm run fate-autoplay -- --matrix-40 --turns 20
```

Detached 12×300 (long batch):

```powershell
npm run fate-autoplay:detach -- --modes-agents-300 --turns 300 --seed 100
```

Outputs: `transcript.md`, `turns.jsonl`, `summary.json`, `manifest.json`, `eval.json`

**Redeploy:** Client-only. No `gm-turn` redeploy required.
