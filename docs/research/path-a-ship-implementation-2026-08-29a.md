# Path A ship — implementation note (2026-08-29a)

**Stamp:** `2026-08-29a`  
**Bundle:** Manus score-boost post-28c (terminal authority) — John authorized implement + push  
**Ingest:** `docs/research/manus-score-boost-ingest-2026-08-27.md`  
**Pastes:** `docs/research/pasted/manus-score-boost-2026-08-27/`

## Shipped

| Item | Module | Notes |
|---|---|---|
| Encounter Terminal FSM | `encounterTerminalFsm.ts` | idle→engaged→resolving→terminal; flee/parley/max caps; `encounterCleared` receipts |
| ArcDirector wire | `arcDirector.ts` | Tick/force-clear before beat commits; skirmish init with FSM fields |
| Combat pad lock | `choiceEdge.ts`, `choiceCompiler.ts` | Engaged → combat/talk only; no travel/merchant/Earth junk/generic inspect; flee/parley drop at cap |
| Entity scrub allowlist | `narrativeScrub.ts`, `typedEntityValidator.ts`, `proseWarden.ts` | Protected mobs/items/NPCs/locations; ban mark/panel/nearby-building replacements |
| STATUS leak firewall | `statusFirewall.ts` → `systemLog.ts`, `sealedManifest.ts` | Strip GM_VOICE / PYOA / RenderFallback / campaign-contract from player chrome |
| Topic / PYOA branch | `npcTopicFsm.ts`, `pyoaBranchLedger.ts` | Topic commits; charter locks branch; Buy time / Call for help exhaust → lock |
| Eval gates | `evalHarness.ts` | clearedByT50, no purgatory@T15, branchLockedByT30, freeT12DurableDelta |
| Headless clear fix | `fateAutoplay.ts` | Do not resurrect cleared `activeEncounter` from arc snapshot |
| Vitest | `playtest29aScoreBoost.test.ts` | Terminal FSM + pad lock + firewall + allowlist + PYOA lock |
| Mid writer | `writerPolicy.ts` | **NO** unchanged |

## Caps (Manus T2 defaults)

| Mode | maxEngaged | maxFailedFlee | maxFailedParley |
|---|---:|---:|---:|
| LitRPG | 8 | 2 | 1 |
| DnD | 10 | 2 | 2 |

## Honest uplift

**4.5–6.5/10** on worst cells if gates pass on same seeds — not 8/10 this batch (Manus T9).

## Deferred

- Stagnation Mid writer (Opt 10)
- Second LLM critic
- Full contamination quarantine evaluator pipeline beyond existing hooks
- Feature-flag shadow rollout (shipped on by default)

## Verify

```bash
npm test -- src/game/playtest29aScoreBoost.test.ts src/game/playtest28cManusComplete.test.ts
npm run fate-autoplay -- --matrix-40 --turns 20
```

Worst-cell re-run (detached):

```powershell
npm run fate-autoplay:detach -- --modes-agents-300 --turns 300 --seed 100
```

**Redeploy:** Client-only. No `gm-turn` redeploy required (STATUS firewall + scrub are client; edge proseWarden mark soften is optional later sync).
