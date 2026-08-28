# D12 — Implementation Backlog and Evaluation Harness

The task backlog is in [`D12_implementation_backlog.csv`](./D12_implementation_backlog.csv), and the machine-readable gates are in [`D12_eval_gates.json`](./D12_eval_gates.json). The backlog contains **40 tasks**: 28 P0, 10 P1, and 2 P2.

## Delivery Strategy

Implementation should follow dependency order rather than template-count order. The system must make a single encounter mechanically true before expanding content breadth.

| Wave | Objective | Backlog range | Exit condition |
| --- | --- | --- | --- |
| **Wave 1 — Contracts and selection** | Load/version schemas, libraries, telegraphs, stakes, and hard biome authority. | B001–B007, B020–B022 | One legal template can be selected and rendered with no unresolvable action or wrong-bible substitution. |
| **Wave 2 — Resolution and receipts** | Complete combat, d20, flee, parley, clocks, crisis commits, forced terminal, and aftermath. | B008–B019 | Adversarial runs cannot keep an encounter active beyond its bound; every terminal has one receipt. |
| **Wave 3 — Director integration** | Add density governance, pre-GM commit, situation packets, prose validation, and telemetry. | B023–B028 | GM output cannot contradict committed mechanics; drought remains biome-safe. |
| **Wave 4 — Content and rewards** | Integrate loot and register all 48 templates/callbacks. | B029–B035 | All libraries load, all PYOA links resolve, and rewards reconcile. |
| **Wave 5 — Evaluation and operations** | Run historical regressions, property tests, linting, and promotion gates. | B036–B040 | G1–G5 pass at the required sample and stable-promotion standard. |

## Critical Dependency Chain

```text
schema/versioning
  → library loader
  → biome legality
  → telegraph + stakes materialization
  → mode resolver
  → forced terminal
  → aftermath transaction
  → pre-GM ArcDirector commit
  → situation packet
  → prose validation
  → telemetry
  → eval gates
```

Parallel work is safe only after the contracts on the left are stable. Loot-table implementation, content registration, and individual regression fixtures can proceed in parallel once resolver and receipt interfaces freeze.

## P0 Acceptance

| Area | Required proof |
| --- | --- |
| Selection | A candidate log shows every accepted and rejected predicate, including drought behavior. |
| Telegraph | Encounter, elite, and boss channel minima pass; every cue maps to a legal action. |
| Stakes | No displayed option lacks a resolver, delta, consequence, or lockout. |
| Resolution | Same snapshot plus seed reproduces rolls; every accepted action changes hash or terminality. |
| Closure | The forced terminal fires at the template bound and rejects later actions. |
| Aftermath | At least two receipt types apply atomically under one commit key. |
| GM boundary | Contradictory prose is rejected or regenerated without changing committed state. |

## Five Quality Gates

| Gate | Question | Threshold |
| --- | --- | --- |
| **G1 — Resolution** | Did every spawn reach exactly one terminal within `maxTurns` and receive exactly one applied receipt? | **100%**, zero violations |
| **G2 — Telegraph** | Was warning shown before engagement, and did every cue have real counterplay? | **≥80%** pre-engagement coverage; zero unactionable cues or unfair surprises |
| **G3 — Biome** | Did every encounter and actor pass mode, bible, biome, site, faction, tier, exclusion, cooldown, and density checks? | **100%**, zero wrong-bible spawns |
| **G4 — Density** | Did every closed location/chapter meet its role bands without saturation or repeats? | 95% in canary; **100% before stable**; exact boss count |
| **G5 — Aftermath** | Did every terminal produce at least two reconciled receipt types with no duplicate application? | **100%**, zero reconciliation or idempotency failures |

## Historical Regression Runs

The harness includes four named fixtures aligned to the supplied evidence.

| Fixture | Reproduced failure | Required new behavior |
| --- | --- | --- |
| `R1-summoned-pact-combat-purgatory` | 290-turn combat; decorative flee/parley | Terminal no later than template bound; state-changing flee/parley; one receipt |
| `R2-cursed-keep-passive-gm` | No combat, traps, or checks in 300 turns | Keep profile includes combat, hazard/trap, checks/puzzles, and boss |
| `R3-cape-district-pad-loop` | Walk Away and leverage repetition | Walk Away terminates; leverage is consumed/discredited; unchanged retry rejected |
| `R4-thornferry-theater-branching` | Crisis repeats and branch flags disappear | Exclusive facts, delayed callback, ending difference, and one-shot crisis lock persist |

## Evidence Retention

A gate result is not a bare Boolean. Failures retain encounter/template IDs, turns, clock and ledger snapshots, selected/rejected candidate reasons, receipt commit keys, before/after hashes, and minimal replay inputs. This permits deterministic reproduction instead of prose-only debugging.

## Promotion Policy

| Stage | Exposure | Required standard |
| --- | --- | --- |
| Draft | Author/test only | Schema and linter pass. |
| Shadow | Evaluated but not shown | G1, G3, and G5 pass on synthetic and historical fixtures. |
| Canary | Bounded production share | Minimum 20 runs per mode and 100 encounters overall; no G1/G3/G5 violation; G2 ≥80%; G4 ≥95%. |
| Stable | Full eligible traffic | All five gates pass; G4 reaches 100% on closed scopes; no open P0 defects. |
| Deprecated | No new spawns | Active snapshots remain replayable; replacement or content-gap fallback exists. |

## Definition of Done

WS-4 implementation is complete when the four historical regressions pass, the 48 templates load under the shared schema, every encounter action is mechanically honest, all terminal states emit reconciled receipts, the biome matrix blocks every known cross-bible case, and density produces forward progress without saturation. A higher narrative score is an outcome to observe; the release gate is the measurable lifecycle contract.
