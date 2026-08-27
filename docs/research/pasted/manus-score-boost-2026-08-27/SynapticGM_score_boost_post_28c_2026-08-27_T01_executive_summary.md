# T1 — Executive Summary: Why 28c Did Not Move Gemini

**Project:** SynapticGM consumer application  
**Batch proposed:** 29a  
**Date:** 2026-08-27  
**Author:** Manus AI

## Decision

Ship **one minimum architectural batch centered on terminal authority**. Batch 29a should add an Encounter Terminal FSM and make the existing ChoiceCompiler, NPC topic FSM, PYOA branch ledger, entity scrubber, STATUS renderer, and evaluation harness obey deterministic terminal and branch receipts. This is not a prose-quality batch. It converts events that currently *begin* into state changes that must *finish*.

> **29a thesis:** the GM may narrate a result, but only code may decide, commit, and prove that an encounter cleared or a branch locked.

The supplied worst-cell summary shows that 28c improved telemetry without improving the reader-visible failure mode. LitRPG s18 gained combat and arc-XP signals but remained in combat from approximately T9 through T300. DnD s69 gained L2 and 235 XP but looped on Wraith flee/parley and emitted repeated STATUS output. RPG s137 reached L3 and produced a crisis receipt but regressed in `them` usage and remained in a leverage dialogue loop. PYOA s188 produced three crises and more XP but never locked a branch.[1] These are not missing-spawn defects. They are missing-terminal, missing-commit, and unsafe-render defects.

| 28c mechanism | What it proved | What it did not prove | 29a authority added |
|---|---|---|---|
| ArcDirector forced spawn | A required threat appeared | The threat ended | `EncounterTerminalFsm` plus `encounterCleared` |
| BeatContract / beat commits | A beat was selected or recorded | The beat changed durable world state | Receipt-coupled state delta and replay hash |
| ChoiceCompiler | Choices could be emitted | Choices were legal for the active state | Encounter lock, exhaustion, terminal synchronization |
| `npcTopicFsm` | A topic could progress | Exhaustion committed a consequential branch | `committedBranch` terminal stage |
| `pyoaBranchLedger` | Crisis activity was visible | Mutually exclusive alternatives were disabled | Atomic `branchLocked` receipt |
| Entity/prose cleanup | Some unwanted wording decreased | Bound nouns and references survived safely | Typed protected-entity spans and no generic substitution |
| Liveness eval gates | A combat receipt existed | Spawned combat cleared | Paired spawn/clear deadline gate |

## Minimum 29a scope

The minimum batch has **seven coupled changes**. The first four are P0 because they establish terminal authority; the remaining three are required to prevent the same worst cells from continuing to score near 1/10 for presentation or early-hook failures.

| Order | Change | Binding outcome |
|---:|---|---|
| 1 | Encounter Terminal FSM | Every spawned combat encounter reaches exactly one of `escape`, `victory`, `defeat`, `capture`, or `parleyResolved`, committed before narration |
| 2 | Encounter-aware ChoiceCompiler | No travel, merchant, Earth-junk, or generic-inspect pads while engaged; flee/parley disappear after thresholds |
| 3 | NPC topic and PYOA branch commitment | Exhausted topics and crises commit a durable branch instead of reopening dialogue |
| 4 | Eval gates | Combat spawn without clear by T50 fails; crisis without branch lock by T30 fails; same-seed replay must reproduce receipts |
| 5 | Entity scrub constitution | Protected mobs, items, props, named NPCs, and location titles are never replaced with generic nouns |
| 6 | STATUS leak firewall | Prompt/control tags remain debug-only; player output is rebuilt from structured state or safe fallback copy |
| 7 | Free T12 hook contract | By T12, at least one durable progress receipt exists; spawn-only purgatory by T15 is an explicit failure |

The components must ship together. An Encounter Terminal FSM without an encounter-aware ChoiceCompiler can still present illegal, repetitive choices. A branch ledger without a crisis gate can silently fail. A scrub or prompt-only patch can make output cleaner while leaving the state machine stuck. Conversely, adding a mid-session writer before terminal authority would improve prose around an unresolved loop rather than eliminate the loop.[1]

## Why this can move the score

The proposed batch targets the **dominant structural reason** each supplied worst cell remains near 1/10: lack of finality or state commitment. If the same seeded reruns produce timely clear/lock receipts, preserve bound nouns, and suppress player-facing control tags, an external evaluator should see completed scenes, consequential choices, and coherent references rather than extended loops. The expected 29a range is therefore **4.5–6.5/10 on the targeted worst cells**, not because the prose model becomes stronger, but because the run stops violating basic playability and coherence invariants.[1]

A **6/10 portfolio average is plausible but not guaranteed in one batch**. It requires all P0 gates to pass across modes and the collateral scrub/leak regressions to reach zero on the supplied worst-cell seeds. An **8/10 average is not a credible 29a promise** because 29a does not address sustained pacing, richer scene composition, long-horizon memory, stylistic variety, or broad portfolio generalization. Those are 29b and later concerns.

## Evidence boundary and cross-run bleed

Only the research brief was attached. The four raw worst-cell transcripts, evaluator judgments, run identifiers, `turns.jsonl`, replay hashes, and the referenced `score-boost-plan-post-28c-2026-08-27.md` were not supplied. This bundle therefore cites the brief as the source of reported counts and loop descriptions and does not invent quotations or unseen turn evidence.

The instruction to flag **Gemini cross-run bleed** is treated as a live confounder, not a settled root cause. A low score can be contaminated if an evaluator context or artifact contains entities, prompts, receipts, or commentary from another seed or mode. Batch 29a should add run-scoped identity fields and a contamination gate, but the architectural defects remain independently demonstrable from the reported absence of `encounterCleared` and `branchLocked` outcomes.[1]

## Engineering handoff status

T2 and T8 in this bundle are designed to be directly handed to engineering. They define state transitions, precedence, receipt payloads, defaults, dependencies, owner surfaces, acceptance tests, rollout controls, and rollback conditions. The existing engineering draft’s sufficiency **cannot be assessed** because that file was not attached. If it already includes the invariants and P0 acceptance criteria in T2 and T8, the only remaining gaps are repository-path assignment, current event-shape mapping, save-version migration, and worst-cell transcript confirmation.

## Release recommendation

Release 29a behind mode-level flags and run the same worst-cell seeds first. Promote only when the paired receipt, branch lock, replay determinism, entity-collateral, STATUS leak, and T12 hook gates all pass. Do not use a score increase alone as the release criterion, because cross-run bleed and evaluator variance can mask deterministic regressions.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
