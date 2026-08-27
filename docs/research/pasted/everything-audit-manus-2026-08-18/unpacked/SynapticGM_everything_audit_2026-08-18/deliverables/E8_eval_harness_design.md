# E8 — Eval Harness Design

**Machine-readable release-gate pack:** [`../fixtures/E8_eval_harness_release_gates.json`](../fixtures/E8_eval_harness_release_gates.json).  
**Scenario pack:** [`../fixtures/E3_continuity_red_team_scenarios.csv`](../fixtures/E3_continuity_red_team_scenarios.csv).

## Objective

The eval harness must test the **causal system**, not just prose quality. An eloquent response that commits an invalid StateTx, forgets a correction, forces a hook, leaks a prompt term, or bills a disabled image call is a failure. Every run begins from known canonical state and evaluates: authority resolution, accepted/rejected/provisional StateTx, manifest composition, obligation coverage, receipt/state reconciliation, render safety, entitlement, and CostEvent trace.

## 1. CI Architecture

| Layer | Artifact | Primary assertion | Failure owner |
|---|---|---|---|
| Fixture state | Pinned CampaignContract, opening invariant, accepted StateTx chain, deterministic seed. | Initial state hash is exactly expected. | Engine/state owner. |
| Input/intent | Player input plus action ID/idempotency key. | All meaningful clauses are recognized or explicitly classified. | Intent/GM orchestration owner. |
| Authority resolver | Authority trace and conflict result. | Player correction > invariant > accepted StateTx > manifest > evidence > invention. | State/policy owner. |
| Adjudicator | Proposed outcome, receipt, StateTx draft. | Rules/kit/status constraints resolve before narration. | Rules/combat owner. |
| Commit layer | Accepted StateTx/revision/entitlement. | One commit only; current revision only; all deltas legal. | Persistence/commerce owner. |
| Manifest layer | Bounded SceneManifest with sources and obligations. | Required fields present; budget honored; retrieval is evidence only. | Context/orchestration owner. |
| Render layer | Player-visible scene/HUD/repair copy. | No internal leaks; plain language; state/receipt agrees. | UX/narrative owner. |
| Shadow safety | Warden labels and policy decision. | Unsafe/incorrect output is blocked, redirected, or escalated by policy. | Safety owner. |
| Cost/ops | CostEvent and kill-switch record. | Attempt/outcome/billing/entitlement are attributable. | Platform/ops owner. |

## 2. Golden StateTx Trace Contract

The golden traces are intentionally small, causal, and versioned. Each trace should comprise:

| Field | Contract |
|---|---|
| `fixture_id` | Stable test ID such as `GT01_correction_persists`; maps to red-team scenario. |
| `campaign_contract_hash` | Proves run against the intended opening/invariants. |
| `initial_state_hash` | Makes unintentional baseline drift detectable. |
| `input_sequence` | Exact player actions plus voice/mode/session/reload events. |
| `expected_authority_trace` | Winner and every lower-authority conflicting source. |
| `expected_state_deltas` | Allowed/rejected/provisional fact changes; do not assert exact prose. |
| `expected_revision_lineage` | Base revision, accepted revision, superseded StateTx, stale conflict if applicable. |
| `expected_obligation_coverage` | Every sub-intent has a terminal disposition. |
| `expected_receipt` | Math/rule items that must reconcile to state. |
| `expected_render_constraints` | Required player meaning and forbidden internal/leak patterns. |
| `expected_cost_event_shape` | Work class, provider/model, tokens/media, outcome, entitlement, retry lineage. |

A golden trace must **not** snapshot raw full prose as the only acceptance mechanism. Exact text tests are brittle and reward imitation. Instead, assert structured truth, source, human-readable coverage, safety boundaries, semantic diversity for allowed retries, and limited required player-language features.

## 3. Prompt and Manifest Budgets

A prompt budget is a product policy. It describes what the narrator may consult, not what becomes true. The release-gate JSON establishes default maximum SceneManifest budgets by engine, required fields, and a deterministic overflow rule: discard low-authority decoration before canonical correction, invariant, accepted state delta, immediate safety restriction, or unresolved player obligation.

| Budget component | May be included | Must never be sole authority | Measurement |
|---|---|---|---|
| Sealed engine/style policy | Engine rules, formatting, permitted voice packet. | Any player/world fact. | Token count, version/hash, style leak scan. |
| Campaign contract | Pinned canon, opening invariant, safety/age posture. | Player correction if no conflict; proposed invention. | Contract hash and authority position. |
| Current canonical state | Relevant accepted facts, kit, conditions, relationships, location, entitlement state. | N/A—this is canonical only through StateTx/revision provenance. | Field coverage, source StateTx IDs. |
| Intent/obligations | Parsed player aims, clarification needs, soft-hook boundaries. | A GM preference. | Coverage percentage and unresolved count. |
| Supporting evidence | Retrieval, summary, lore, prior prose, optional world detail. | State status, inventory, identity, correction. | Source class, conflict rate, poison test result. |
| Presentation | Mood/world sensory texture, optional suggestions. | Check result, safety decision, payment entitlement. | Omission reason, tone test. |

## 4. Warden Shadow Labels

A Warden need not be a GPU deployment to improve quality. Start as an offline/shadow scorer or deterministic policy suite aligned to the fixture pack. The required labels are in the JSON pack: `truth_conflict`, `kit_conflict`, `agency_override`, `correction_loss`, `unfair_adjudication`, `style_fact_mutation`, `kid_mode_escape`, `internal_leak`, `stale_write`, and `entitlement_mismatch`.

| Label class | Required evaluation | Promotion criterion |
|---|---|---|
| State and authority | Compare accepted StateTx and authority trace against fixture ground truth. | Near-zero false negatives on P0 fixture cases; all errors triaged. |
| Player agency | Inspect intent/obligation coverage and hook status. | No forced acceptance or silently omitted sub-intent in golden cases. |
| Render safety | Scan rendered scene/HUD/repair copy, not just hidden prompt. | No leak or Kid Mode escapes in release candidate suite. |
| Fairness | Reconcile receipt to StateTx and current state. | Exact math/HP/inventory agreement. |
| Cost/entitlement | Validate CostEvent lineage and server source. | No unattributed billable attempts; no client-only grants. |

Shadow labels must not silently edit canon. They can block a commit, block a render, force a correction/clarification path, record a review case, or trigger an ops switch. Their own outputs are supporting evidence, not a new authority above accepted StateTx.

## 5. Screenshot Release Gate

A scenario can pass structurally while the product still looks like chat. Before each release candidate, capture desktop and mobile-width screenshots/recordings of the ten checks in the JSON pack. A human reviewer confirms that a player can see the first action, current state, recent change, Why?, correction control, optional-vs-accepted lead status, readable receipt, safety transformation, allowance/entitlement state, and error/kill-switch continuation.

| Screenshot condition | Block if |
|---|---|
| First turn | Composer/action is unclear; opening reads as configuration. |
| After accepted action | No visible changed state or change contradicts narrative. |
| “Why?” | Causes are generic, absent, or use internal terms. |
| Correction | User cannot tell scope/durability of correction. |
| Hook decline | Quest appears accepted despite decline/ignore. |
| Combat | Receipt cannot be reconciled at normal or 200% zoom. |
| Voice change | UI implies voice changes facts or hides it. |
| Kid Mode | Adult/unsafe history/ads remain visible or redirect dead-ends. |
| Entitlement | Costly action denial comes after an irrevocable intent or uses vague error. |
| Incident | Image/model/retrieval kill switch makes entire game unusable. |

## 6. Required CI Outputs

Every CI/full eval run should archive the following, retaining only test-safe data: `golden_trace_results.json`, `manifest_budget_report.json`, `warden_shadow_confusion_matrix.csv`, screenshot/review evidence, `costevent_schema_validation.json`, a versioned `known_exceptions.md`, and an owner-triaged defect list. A green unit suite without artifacts is insufficient for a trust claim.

## 7. Change-Control Rules

| Change | Required re-run | Approval condition |
|---|---|---|
| Prompt/voice wording | Voice invariance traces, leak scan, screenshot gate. | Same fact/receipt output for fixed fixture. |
| State schema/revision | Correction/stale/reload/full trace suite. | Migration preserves provenance and passes replay. |
| Model/provider | Full golden traces, latency/cost comparison, safety shadow review. | No P0 regression; economics recorded. |
| Retrieval/summarization | Poison/cross-tenant/authority suite. | Retrieval cannot win a fact conflict. |
| Rules/combat | Receipt reconciliation and deterministic seed suite. | State delta matches documented rule. |
| Commerce/images | Entitlement/webhook/kill switch/C​ostEvent suite. | Server authority and prevent-call behavior proved. |
| Kid/safety policy | Kid-mode scenario suite plus counsel/product sign-off as applicable. | No unsafe render/history/ad leakage. |

## Definition of an Eval Win

An eval win is not “the model sounded better.” It is: **the same player action, from the same authorized state, yields a state-valid, fairly explained, safely rendered result; changes stay true after correction/reload; and every expensive or blocked operation has a trace.**

[Back to project index](../README.md)
