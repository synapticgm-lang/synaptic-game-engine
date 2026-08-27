# Source Inventory and Evidence Boundary

**Project:** SynapticGM post-28c score boost research  
**Date:** 2026-08-27  
**Author:** Manus AI

## Available source

The only supplied artifact is `pasted_content.txt`, which contains the 29a mission, the 28c accepted-ground-truth summary, four worst-cell observations, required deliverables, constraints, and success criteria.

| Source ID | File | Status | Permitted use |
|---|---|---:|---|
| S1 | `pasted_content.txt` | Available | Primary internal evidence and binding requirements |
| S2 | LitRPG s18 worst-cell transcript | Not supplied | Must not invent turn-level quotations or counts beyond S1 |
| S3 | DnD s69 worst-cell transcript | Not supplied | Must not invent turn-level quotations or counts beyond S1 |
| S4 | RPG s137 worst-cell transcript | Not supplied | Must not invent turn-level quotations or counts beyond S1 |
| S5 | PYOA s188 worst-cell transcript | Not supplied | Must not invent turn-level quotations or counts beyond S1 |
| S6 | `score-boost-plan-post-28c-2026-08-27.md` | Not supplied | Sufficiency cannot be assessed directly |

## Accepted evidence from S1

| Cell | Accepted telemetry/evaluator evidence | Architectural implication |
|---|---|---|
| LitRPG s18 | `them` 28→9; combat receipt; arc XP T5; combat purgatory T9–300; `the mark` scrub about 173 hits | Spawn liveness and early progress did not confer encounter finality; entity repair caused severe collateral substitution |
| DnD s69 | L2, 235 XP; combat receipt; `STATUS×110`; Wraith flee/parley loop; `nearby building` scrub | Encounter transitions and UI/status sanitization require deterministic authority outside GM prose |
| RPG s137 | L3; crisis receipt; `them` 26→52 regression; leverage dialogue loop; prompt leaks | Broad scrub rules regressed referential coherence; NPC topic exhaustion did not commit world state |
| PYOA s188 | Crisis×3; XP 5→35; branch not locked; Buy time / Call for help loop | Crisis occurrence is not equivalent to a mutually exclusive branch commitment |

## Evidence restrictions

This research treats S1 as ground truth but does not claim direct transcript inspection. Every transcript-dependent assertion is labeled either **S1-grounded** or **requires transcript validation**. The reported Gemini outcome may contain **cross-run bleed** because the detailed evaluator outputs, run IDs, context windows, and per-seed judgments were not supplied. The implementation proposal therefore relies on deterministic receipts and harness invariants that are independently testable, not on assuming the evaluator diagnosis is perfectly isolated.

## Parallel synthesis input list

The architecture synthesis will cover six independent drafting packets before integration: (1) Encounter Terminal FSM and fallback authority, (2) entity allowlist and STATUS leak firewall, (3) encounter-aware ChoiceCompiler, (4) NPC topic and PYOA branch commitment, (5) Free T12 hook and score-ceiling model, and (6) implementation backlog plus eval-gate schema. These are all grounded in S1 and share the evidence restrictions above.

## References

[1]: ./pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
