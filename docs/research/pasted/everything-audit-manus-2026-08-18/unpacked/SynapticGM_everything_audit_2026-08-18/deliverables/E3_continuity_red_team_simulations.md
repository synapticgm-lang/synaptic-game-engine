# E3 — Continuity Red-Team Simulations

The executable test matrix is attached as [`../fixtures/E3_continuity_red_team_scenarios.csv`](../fixtures/E3_continuity_red_team_scenarios.csv). It contains **60 structured scenarios**, each with a setup, player input, expected StateTx/SceneManifest/obligation outcome, failure symptoms, and automation assertions. The matrix is intentionally deterministic in its state claims and flexible only where the narrator may vary prose.

## Test Doctrine

Every scenario tests the supplied product law:

> **Player correction → pinned canon/opening invariant → accepted StateTx → SceneManifest → supporting evidence → draft invention.**

The harness must treat a model narration as a proposed render, not a source of state. A passing test does not require poetic output; it requires that a player action has a complete disposition, that state changes appear exactly once with authority and provenance, and that the rendered scene matches committed state.

## Coverage Map

| Cluster | Scenario IDs | Primary release risk | Minimum automated gate |
|---|---:|---|---|
| Invention gauntlet | RT01–RT10 | Draft invention creates equipment, status, backstory, geography, or prohibited content as fact. | No prohibited StateTx; all novel entities/assets require permitted transaction path. |
| Correction and return | RT11–RT18 | Player authority fails after summary, recalculation, recap, or session reload. | Revision supersedes source; current state/reload/recap agree. |
| Open ask / soft reset | RT19–RT23 | GM ignores player intent or turns an offer into a rail. | Current IntentContract resolves before any soft hook; decline persists. |
| Kit contradiction | RT24–RT29 | Prose, HUD, and combat differ on inventory/count/condition. | Ledger kit = HUD kit = receipt inputs; no count below zero. |
| Retry novelty | RT30–RT34 | Retry changes an immutable outcome, duplicates a commit, or repeats beats. | One commit per idempotency key; permitted state invariants stable; beat divergence measured. |
| Stale revision | RT35–RT38 | Concurrent tabs/webhooks/drafts silently overwrite or render old facts. | Monotonic revisions; stale write rejected; no old-draft render. |
| Retrieval poison | RT39–RT42 | Summary/RAG injection controls current facts or crosses campaigns. | Ledger wins; poison/audit event logged; tenant filter passes. |
| Kid Mode | RT43–RT46 | Restricted content reaches player, gets rewarded, or remains in history after mode shift. | Safety decision precedes render/state; playable redirect; filtered history. |
| Personality isolation | RT47–RT50 | Voice changes trust, rolls, state, safety, or player identity. | Style switches preserve fact hash/adjudication result. |
| Fairness and clarity | RT51–RT53 | Outcomes or quest markers lack causal explanation. | Receipt reconciles to state; Why? has provenance. |
| Entitlement / operations | RT54–RT60 | Costly capability over-serves, server entitlement is bypassed, leaks render, or kill switch breaks play. | Server authority, visible denial/preflight, no internal terms, no disabled-provider call. |

## Required Test Inputs

The fixture CSV is a **contract**, not a mock substitute for real behavior. Each test run must provide a fixture campaign with known pinned canon, an initial accepted state revision, declared RNG/reroll policy, selected engine/mode, and a trace collector. The runner should record the input, state revision before/after, accepted/rejected/provisional StateTx, SceneManifest, intended/actual obligation coverage, safety decision, receipt, rendered text, CostEvent references, and any retry/rebase metadata.

| Input field | Required purpose |
|---|---|
| `campaign_id` and `tenant_id` | Prevent cross-campaign retrieval/state leakage. |
| `base_revision` | Detect stale writers and invalid drafts. |
| `intent_id` and idempotency key | Guarantee no duplicate commit from click/network retry. |
| `authority_trace` | Explain winner when correction/canon/state/evidence conflict. |
| `state_delta` and `state_hash_after` | Reconcile committed truth to HUD/receipt/render. |
| `obligation_coverage` | Prove every part of a multi-part action was addressed, blocked, clarified, or deferred. |
| `safety_decision` | Verify that safety acts before narrative render and memory write. |
| `cost_event_ids` | Attribute attempted/successful/failed expensive work. |

## Execution Cadence

| Stage | What runs | Release rule |
|---|---|---|
| Pull request | RT01, RT11, RT19, RT24, RT30, RT35, RT39, RT43, RT47, RT51, RT56, RT60. | Any P0 failure blocks merge. |
| Nightly | All 60, across supported engines and voices. | Create diff/flake report; investigate a new mismatch before next release candidate. |
| Pre-beta | All 60 plus manual screenshot checklist and two human sessions. | Zero P0; known P1/P2 explicitly in beta notes. |
| Before model/prompt change | Golden traces and shadow labels. | No change in committed truth without intentional fixture/version update and owner sign-off. |
| Before entitlement/image change | RT54, RT55, RT60 plus CostEvent reconciliation. | No costly call without server-side entitlement/event trace. |

## Automation Rules

1. **Assert on committed structures before evaluating language.** Canonical results are `StateTx`, revision, entitlement, and safety structures. Narrative quality checks must not conceal a failed factual state.
2. **Permit prose variation only inside declared outcome bounds.** A retry may vary wording, sensory detail, or a non-state complication only when the reroll/retry policy allows it. It may not retroactively change a committed roll, item count, or accepted correction.
3. **Treat summaries and retrieval as hostile evidence in tests.** RT39–RT42 intentionally inject contradictions and instruction-like strings. Passing behavior is to preserve higher-authority truth and log the attempt.
4. **Render only from the current base revision.** Any draft whose base revision is stale is discarded or explicitly reconciled before it is shown.
5. **Test player-facing silence.** The engine can log internal label details, but `StateTx`, `SceneManifest`, `IntentContract`, “RAG,” and model/embedding explanations must never appear in rendered player copy.

## Test-Data Hygiene

The fixture names are invented test data. They must never be confused with licensed worlds, characters, or actual player records. Production red-team test data should use isolated tenants and deterministic seeded fixtures; real player saves must not be copied into CI. Failure samples must redact personal data before issue filing.

## Exit Criteria

A build is ready for a closed beta only if every P0 row in the fixture file passes on the intended engines and the following five camera proofs are reproduciable without moderator intervention: a correction survives reload; a soft hook is ignored; kit truth constrains action fairly; a combat/check receipt reconciles; and an internal/provider kill switch preserves text play. A broad scenario count is not a substitute for those visible trust moments.

[Back to project index](../README.md)
