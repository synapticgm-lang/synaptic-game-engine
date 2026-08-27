# T8 — Ranked Implementation Backlog and Shipping Plan

**Batch:** 29a  
**Author:** Manus AI  
**Companion file:** `SynapticGM_score_boost_post_28c_2026-08-27_T08_ranked_implementation_backlog.csv`

## Shipping decision

The critical path begins with encounter state and receipt authority, then constrains choice generation, commits NPC/PYOA branches, secures entity and STATUS surfaces, and finally promotes the new evaluation gates. This order avoids building tests around narrative signals that the runtime cannot yet guarantee.[1]

The CSV is the authoritative row-level backlog. Its `logical_owner_surface` values name responsibilities, not assumed repository paths. The SynapticGM repository was not attached, so engineering must complete the owner-file mapping before sprint assignment rather than infer filenames from this research.

## Critical path

| Sequence | Backlog IDs | Deliverable | Exit condition |
|---:|---|---|---|
| 1 | SGM29A-001–003 | Encounter lifecycle, paired clear receipt, deterministic terminal resolver | Unit fixtures prove monotonic terminal state, idempotency, one clear per spawn, and forced resolution |
| 2 | SGM29A-004–006 | ArcDirector and ChoiceCompiler integration | Pact-Hunter/Keep Wraith do not duplicate; forbidden pads are absent; flee/parley exhaust |
| 3 | SGM29A-007–009 | NPC topic and PYOA branch commitment | Cape topic commits; Aldous/Oskar do not revert; Thornferry locks one branch; Millstone Charter is stateful |
| 4 | SGM29A-010–012 | Entity and STATUS output integrity | Protected entity coverage is complete; generic replacements and denied tags are zero on player surfaces |
| 5 | SGM29A-013–015 | Resolution, branch, contamination, replay, and T12 hook gates | Negative fixtures fail for the correct reason; positive same-seed reruns pass deterministically |
| 6 | SGM29A-016–017 | Migration and staged rollout | Golden 28c saves migrate; shadow metrics are stable; mode canary meets all gates |

The work may proceed concurrently inside a sequence where dependencies allow. For example, the STATUS projector and branch-ledger core can be implemented while the terminal resolver is underway. Promotion remains ordered: do not enforce a gate until the receipt it validates is authoritative.

## P0 scope

| Area | P0 outcome | Why P0 |
|---|---|---|
| Encounter terminal authority | Spawned combat reaches and proves one terminal result | Directly fixes LitRPG/DnD purgatory |
| Choice lock and exhaustion | Active encounters cannot emit irrelevant or exhausted loops | Prevents the UI from reopening invalid paths |
| NPC topic commitment | Exhaustion commits consequence and terminal handoff | Fixes RPG/DnD dialogue purgatory |
| PYOA ledger enforcement | Crisis/item/action flow locks one branch | Fixes PYOA non-commit |
| Entity protection | Bound nouns survive all cleanup passes | Fixes severe collateral coherence loss |
| STATUS firewall | Debug/control material is absent from player output | Fixes visible prompt leaks and repeated internal status artifacts |
| Core eval gates | Spawn/clear, crisis/lock, replay, and contamination become release blockers | Prevents telemetry-only “wins” from passing |

P1 in this backlog does not mean optional to the release decision. It marks work that can follow the P0 runtime core within the same batch: T12 product/eval integration, migration hardening, and staged rollout instrumentation.

## Owner-file assignment worksheet

Engineering should map each logical owner surface to the current repository using symbol search and runtime call graphs. Do not create duplicate subsystems merely to match specification names.

| Logical owner surface | Required repository mapping evidence |
|---|---|
| `EncounterTerminalFsm` | Existing active encounter state type, transition reducer/service, persistence boundary |
| Encounter receipt writer/outbox | Existing receipt schema, append path, transaction/outbox implementation |
| Rules/terminal outcome reducer | Combat resolution and state-delta application boundary |
| `ArcDirector` | Forced spawn call site and idempotency behavior |
| `ChoiceCompiler` | Choice family registry, pad source, filter/ranking pipeline |
| `npcTopicFsm` | Topic states, visited edges, persistence, encounter handoff |
| `pyoaBranchLedger` | Crisis receipt consumer, branch group/lock persistence, save serialization |
| `typedEntityValidator` / `proseWarden` | Prompt context builder, post-GM transform order, render rejection/fallback path |
| STATUS projector/firewall | Player STATUS schema, formatter, debug channel separation |
| Eval harness | Turn/receipt parser, gates, quarantine, replay comparison, score aggregation |

## Integration definitions

The following definitions of done are cross-component release contracts. A work item is not complete when its local code passes while the linked receipt, choice, output, or harness invariant remains unproven.

### Encounter authority definition of done

A valid run demonstrates one `encounterSpawn`, bounded `engaged` progress, one atomic terminal outcome/delta, one linked `encounterCleared`, and ordinary choices only after the clear. Duplicate delivery and same-seed replay produce no divergent state.

### Branch authority definition of done

A crisis or exhausted topic produces a durable branch/consequence receipt. PYOA sibling branches are disabled atomically. GM prose, reload, duplicate item use, and later encounter narration cannot unlock or switch the branch.

### Output integrity definition of done

Every required world entity in the targeted run is registered and preserved. No scrub action emits the forbidden generic replacements. No denied STATUS tag or internal key reaches the player surface, including Unicode/case/spacing variants. Debug telemetry remains available and run-scoped.

### Evaluation definition of done

The harness proves causality, deadlines, run identity, delta existence, and replay stability. It does not pass based on a raw token match such as “combat,” “crisis,” or “victory.” A seeded negative fixture for each gate must fail, ensuring that the gate itself is live.

## Merge and flag strategy

| Flag | Initial state | Promotion condition | Emergency rollback |
|---|---|---|---|
| `encounterTerminalFsmV1` | Shadow in LitRPG/DnD | Receipt pairing and replay tests pass; no stuck state in target seeds | Stop new v1 encounters; finish/preserve active v1 ledger |
| `encounterChoiceLockV1` | Shadow comparison | Zero forbidden pads; no valid edge loss in fixtures | Roll back together with encounter FSM mode canary |
| `topicCommitV1` | RPG/DnD canary | Cape and Aldous/Oskar terminal tests pass | Use prior topic versions for new topics only |
| `pyoaBranchLockV1` | PYOA canary | s188 and negative fixtures prove one atomic lock | Stop new crisis starts; never unlock committed branch |
| `typedScrubPolicyV1` | Report-only | Protected registry coverage complete and collateral target zero | Disable faulty rules; use sealed structured fallback |
| `statusFirewallV1` | Enforce after unit tests | Zero denied final-surface patterns | Always fall back to safe structured STATUS |
| `evalTerminalGatesV1` | Report-only | Expected positive/negative fixtures classify correctly | Keep report output; pause release blocking until parser defect fixed |

No rollback may delete receipts, reverse branch locks, or reinterpret a terminal outcome already exposed to a player. State is versioned; flags choose behavior for new transitions.

## Observability dashboard

| Signal | Target for 29a worst-cell reruns |
|---|---:|
| Spawn-to-clear pairing | 100% for completed combat-mode runs |
| Clear by T50 | 100% when spawn occurs within evaluable window |
| Active encounter at T15 after early spawn | 0 |
| Crisis-to-lock by T30 | 100% |
| Forbidden encounter pad emissions | 0 |
| Flee/parley emission after threshold | 0 |
| Scrub-generated forbidden replacements | 0 |
| Player-facing denied STATUS patterns | 0 |
| Same-seed normalized receipt divergence | 0 |
| Cross-run evidence accepted into scoring | 0 |

These are engineering acceptance targets for the defined seeded suite, not predictions of all live traffic.

## 29a release checklist

| Gate | Required status |
|---|---|
| LitRPG s18 | Encounter clears; no combat purgatory; `the mark` scrub-generated hits = 0 |
| DnD s69 | Wraith clears; flee/parley exhaustion holds; STATUS denied patterns = 0; `nearby building` scrub-generated hits = 0 |
| RPG s137 | Cape topic commits; no leverage loop; no prompt leak; no scrub-generated pronoun regression |
| PYOA s188 | One mutually exclusive branch locks; Millstone Charter is stateful; Buy time/Call for help exhaust |
| Replay | Same inputs reproduce normalized receipts and deltas |
| Contamination | Injected cross-run artifact is detected and excluded/quarantined |
| Negative gate fixtures | Spawn-only T50 and crisis-without-lock T30 both fail |
| Migration | Representative 28c saves load without duplicate receipts or unlocked terminals |

## Engineering questions that do not block architecture

Repository paths, exact existing event field names, configured encounter caps, current save-schema version, and current BeatContract edge ids require mapping. They do not reopen the core decisions that terminal outcomes and branch locks are code commits, choices are state-filtered, and gates validate causal receipts.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
