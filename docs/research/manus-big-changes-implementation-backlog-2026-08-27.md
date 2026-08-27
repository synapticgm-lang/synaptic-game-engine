# Manus BIG CHANGES — implementation backlog (2026-08-27)

**Source:** T9 from `docs/research/pasted/manus-big-changes-2026-08-27/bundle/`  
**Status:** **Waiting** — implement when John authorizes ship; not part of 27w.  
**Supersedes:** Incremental tuning of shipped `qualityGovernance.ts` modules.

## Critical path

```
Run manifest → event envelope → atomic StateTx → replayable SNAPSHOT
  → BeatContract registry → ArcDirector → mode resolvers
  → choice authority → sealed manifest/fallback → liveness suites → clean 12×300
```

## Definition of done (program)

| Area | Exit criterion |
|---|---|
| Authority | Due beat + effects commit before GM; forced GM disagreement changes no state |
| Replay | Full event replay reproduces final state hash |
| Liveness | T4 early deadlines + T8 long-run quotas pass |
| Choices | Every pad item maps to legal edge; fingerprint + diversity gates pass |
| Exhaustion | Discovery, topic, hub, gate, branch — zero integrity violations |
| Cost | Normal Free turn ≤1 Flash Lite call; repair/escalation capped |
| Evidence | Every artifact binds to immutable run manifest |

## Waves

| Wave | Epics | Exit gate |
|---:|---|---|
| 0 | E0 provenance, E1 event foundation (B001–B007) | Manifests immutable; replay hash passes |
| 1 | E2 contracts, E3 ArcDirector, E4 mode slices (B008–B017) | Each mode: first anchor + terminal receipt under fault injection |
| 2 | E5 choice authority, E6 exhaustion (B018–B025) | Adversarial inspect/wait/topic policies terminate |
| 3 | E7 sealed render + fallback (B026–B028) | Chaos tests preserve identical ledger |
| 4 | E8 eval + E10 decision evidence (B029–B033, B037–B040) | Clean 12×300 + 20-turn hook study |
| 5 | E9 cost/voice (B034–B036) | **Only after** Waves 0–4 pass |

## P0 stories (start here when John says go)

| ID | Story | Owner | Wave |
|---|---|---|---|
| B001 | Immutable `RunManifest` | `EvalHarness` | 0 |
| B002 | Review cell binding + quarantine | `EvalHarness` | 0 |
| B003 | Canonical event envelope | `EventStore` | 0 |
| B004 | Atomic event-group append (CAS) | `StateTx` | 0 |
| B005 | Idempotency registry | `StateTx` | 0 |
| B006 | Deterministic mechanic seed | `ModeRules` | 0 |
| B007 | SNAPSHOT projectors + replay verifier | `ProjectionService` | 0 |
| B008 | `BeatContract` schema | `EncounterBible` | 1 |
| B011 | ArcDirector shadow mode | `ArcDirector` | 1 |
| B012 | Authoritative `ArcDecisionCommitted` (vertical slices) | `ArcDirector` | 1 |
| B014–B017 | Per-mode vertical slices | `ModeRules.*` | 1 |
| B018 | `ChoiceEdge` + legal outgoing enumeration | `ChoiceCompiler` | 2 |
| B019 | Semantic fingerprint + cooldown | `ChoiceCompiler` | 2 |
| B021 | Deprecate freeform primary pads in enabled slices | `ChoiceCompiler` | 2 |

Full 40-item CSV: `docs/research/pasted/manus-big-changes-2026-08-27/bundle/SynapticGM_big_changes_quality_governance_2026-08-27_T9_implementation_backlog.csv`

## Per-mode first-session gates (T4)

| Mode | By turn | Required proof |
|---|---:|---|
| LitRPG | 2 / 6 / 8 | Pact objective → encounter → combat round |
| DnD | 5 / 12 | Seeded check → hazard/hostility + clue change |
| Story RPG | 6 / 12 | Social delta → irreversible consequence |
| PYOA | 4 / 8 / 20 | Crisis → branch lock → ending or closed crisis |

## Starter content minimum

| Mode | Contracts | Path |
|---|---:|---|
| LitRPG | 5–8 | Pact objective → hub pressure → encounter → combat terminal → aftermath |
| DnD | 5–8 | Keep objective → check/hazard → clue → hostility terminal → keep advance |
| Story RPG | 5–8 | Vigil → demand/exposure → leverage → boundary/consequence → aftermath |
| PYOA | 5–8 | Crisis → pressure → fork → branch consequence → ending/reset |

## Relationship to shipped 27w modules

| Existing module | Backlog action |
|---|---|
| `forwardProgressGovernor` | **Replace** with ArcDirector pre-GM commits (B012) |
| `semanticLoopDetector` | **Extend** with edge exhaustion (B019, B022–B025) |
| `optionDiversityContract` | **Replace** pad generation with ChoiceCompiler (B018–B021) |
| `encounterResolution` | **Wire upstream** to ArcDirector (B012, B014–B017) |
| `discoveryXpLedger` | **Harden** evidence-id keys (B022) |
| `questCompletionSchema` | **Add executor** via BeatContract (B008) |
| `typedEntityValidator` | **Retain** |
| `inventoryConservation` | **Retain**; atomic with StateTx (B004) |
| `voiceCadenceSystem` | **Defer** to Wave 5 (B036) |
| `metaInputRecovery` | **Retain**; re-anchor to gist receipt (B028) |

## Milestone decisions

| Milestone | Question | Evidence |
|---|---|---|
| M0 | Can state replay? | B001–B007 |
| M1 | Can each mode commit defining event before prose? | B008–B017 traces |
| M2 | Do adversarial policies exhaust vs loop? | B018–B025 suite |
| M3 | Does GM failure preserve progress? | B026–B028 chaos |
| M4 | Clean batch in T6 band? | B029–B039 |
| M5 | Which T7 options to fund next? | B040 + T7 menu |

## PR gates (every event/contract/rules PR)

Schema fixtures, deterministic replay tests, idempotency tests, migration/upcasting notes, telemetry updates, at least one failure-path test.

## References

- T5 architectural deep dive — schemas and algorithms  
- T8 eval harness JSON — telemetry fields and fault suites  
- T2 intervention matrix — I01–I15 ranked interventions  
- T7 extra options menu — John's path selection

## Appendix — LitRPG pacing / Free hook (2026-08-27)

Research: `docs/research/litrpg-level-pacing-and-free-hook-2026-08-27.md`. 27w telemetry: Summoned Pact maxlevel **L1 @ T300**; storyfollower **L2 @ T265**; inspect drip ~90%; **zero combat receipts**. Proposed backlog add-ons when John authorizes (not in CSV yet):

| ID | Story | Owner | Wave | Notes |
|---|---|---|---|---|
| B041 | LitRPG opening curve + chunk quest stage XP | `characterXp`, BeatContract executor | 1–2 | Pairs B008/B012; targets L2 T15–25 |
| B042 | Social milestone XP ledger (talk/negotiate path) | `discoveryXpLedger` or `SocialMilestoneLedger` | 1–2 | Listen/overhear/deal once-awards |
| B043 | Receipt liveness — LitRPG combat by T8/T15 | `ArcDirector`, `encounterResolution` | 1 | Extends I04 / T4 LitRPG 2/6/8 gate |
| B044 | Inspect evidence-id exhaustion (Manus opt 4) | `discoveryXpLedger` | 2 | Fast anti-farm; does not replace B041 |
| B045 | Free daily milestone XP (+quest tick bonus) | `capacityLedger` + sandbox | 2 | Retention; low complexity |

**John INPUT:** pacing targets + pick from doc §9 options menu before implementing B041–B045.
