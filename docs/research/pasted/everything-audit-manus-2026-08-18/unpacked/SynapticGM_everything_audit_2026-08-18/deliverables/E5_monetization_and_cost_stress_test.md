# E5 — Monetization + Cost Stress Test

**Basis:** This is a parameterized operating model, not a forecast. No SynapticGM provider contract, token distribution, cache rate, image cost, conversion, retention, refund, payment-fee, or support-cost export was provided. All inputs must therefore remain `INPUT REQUIRED` until populated from real CostEvents and billing. The companion worksheet is [`../fixtures/E5_unit_economics_inputs_and_formulas.csv`](../fixtures/E5_unit_economics_inputs_and_formulas.csv).

The supplied business constraint governs this file: **keep the API narrator; defer Warden GPU purchase until explicit operational gates are met.** The proper immediate investment is CostEvent observability and guardrails, not another infrastructure bet.

## 1. Unit-Economics Structure

A valid monthly free-cohort calculation must distinguish accepted turns from retries, input from output, cached from uncached input, text from images, successful from failed work, and variable inference from allocated platform/support cost. Public provider pricing confirms that costs can vary by model, token direction, caching, processing mode, and media/tool class; public price cards are not a substitute for the contracted effective rates or actual SynapticGM workload. [1] [2] [3]

| Formula | Definition | Why it is required |
|---|---|---|
| `Monthly accepted turns = active users × active days × accepted turns/day` | Counts completed gameplay, not page views. | Establishes narrating/adjudication volume. |
| `Text cost/turn = (input tokens × input rate + cached tokens × cached rate + output tokens × output rate) / 1,000,000` | Uses provider-accounted usage. | Output-heavy story turns can dominate even if input is optimized. |
| `Variable turn cost = text + adjudication + retrieval/storage + failed-work allocation` | Treats retrieval as a cost component, not authority. | Prevents false savings claims from hidden helpers. |
| `Free variable cost = accepted turns × variable turn cost + retries × failed cost + images × image cost` | Separates abuse-sensitive action types. | Prevents “average user” masking costly tail behavior. |
| `Fully loaded free cost = free variable cost + active users × allocated platform/support cost` | Uses documented allocation. | Stops comparison of revenue to inference only. |
| `Contribution before fixed costs = net paid revenue attributable to cohort − fully loaded free cost` | Net revenue means post-fee/refund/tax treatment defined by finance. | A usable gate for free-to-paid economics. |

## 2. Cohort Stress Table: 100 / 1,000 / 10,000 Active Free Users

Use the worksheet inputs: `D` active days/player/month, `T` accepted turns/active day, `V` variable turn cost, `R` retry attempts per accepted turn, `F` billable failed/canceled cost, `I` image requests/player/month, `M` effective image cost, `S` allocated platform/support cost/player/month, `C` free-to-paid conversion, `N` net paid revenue/payer/month, and `Q` refund rate. All are `INPUT REQUIRED` except scenario user count.

| Scenario | Accepted turns/month | Monthly free variable cost | Monthly fully loaded free cost | New paid payers/month | Net paid revenue proxy | Break-even conversion |
|---|---:|---:|---:|---:|---:|---:|
| **100 active free users** | `100 × D × T` | `(100×D×T×V) + (100×D×T×R×F) + (100×I×M)` | `previous + 100×S` | `100×C` | `100×C×N×(1−Q)` | `fully loaded cost / [100×N×(1−Q)]` |
| **1,000 active free users** | `1,000 × D × T` | `(1,000×D×T×V) + (1,000×D×T×R×F) + (1,000×I×M)` | `previous + 1,000×S` | `1,000×C` | `1,000×C×N×(1−Q)` | `fully loaded cost / [1,000×N×(1−Q)]` |
| **10,000 active free users** | `10,000 × D × T` | `(10,000×D×T×V) + (10,000×D×T×R×F) + (10,000×I×M)` | `previous + 10,000×S` | `10,000×C` | `10,000×C×N×(1−Q)` | `fully loaded cost / [10,000×N×(1−Q)]` |

The table is intentionally algebraic. Populating it with “typical” token counts or industry conversion rates would imply factual knowledge the project does not possess and would falsely convert a product-design exercise into a forecast. Scale is not automatically linear: cache hit rate, tail abuse, support, incident frequency, and infrastructure step costs may change at each cohort. Report medians, P95, P99, and total spend separately.

## 3. Recommended Free-to-Paid Shape

The product should make Free a complete trust sample and make paid tiers **capacity/presentation upgrades**, never repairs for continuity. Basic correction durability, authoritative kit truth, fair receipt, safety boundary, save integrity, and a readable Why? must be free; withholding them makes paid feel like an apology for a broken core.

| Surface | Free adult web | Mid | High | Rationale |
|---|---|---|---|---|
| Core play | A clear daily/session turn allowance with visible reset and fair retry policy. | Higher allowance or more sustained play budget. | Highest sustained budget / priority capacity. | Do not interrupt after the player has committed an action. |
| Ledger/corrections | Full. | Full. | Full. | Truth integrity is not a luxury. |
| “Why?” and combat receipt | Full. | Full. | Full. | Fairness must remain universal. |
| Campaign depth | A transparent active-campaign/turn/context budget—validated by real cost. | More simultaneous campaigns/longer standard capacity. | Longest sustained capacity and premium convenience. | Avoid a vague “unlimited forever” claim before cost data. |
| Images | Default off or tight pre-announced allowance; Classic only. | Higher but visible allowance. | Highest bounded allowance/credit pool. | Images are an abuse vector and should never define canon. |
| Ads | Adult web only if approved and compatible with tone/data policy. | None. | None. | Supplied business rule: Mid/High no ads; Kid ads off. |
| Kid Mode | Separate counsel-approved posture; no ads. | Same safety baseline. | Same safety baseline. | Do not incentivize minors’ exposure or data collection. |

**Soft-offer fairness:** a commercial prompt may appear at a safe boundary—before starting a high-cost action, after a completed scene, at a known daily cap, or from a settings/account screen. It must never hijack a player’s in-world action, cover a correction, imply that a failed check can be bought away, or cause a hook to become a paywall. If a user sees “Upgrade” after pressing “Open the letter,” the text scene should still resolve or the preflight must occur before the intent commits.

## 4. Abuse Vectors and Controls

| Vector | How it burns cost or trust | Detect in CostEvent | Control | Customer-facing stance |
|---|---|---|---|---|
| Retry spam | Repeated inference against the same state, possibly seeking a better outcome. | `retry_of_intent_id`, commit/no-commit, response class, cumulative cost. | Idempotency, short retry cooldown, immutable receipt policy unless explicit reroll resource. | “Retry the wording” is okay; “rewrite the roll for free” is not. |
| Image spam | High unit cost, prompt experimentation, generated-art storage. | `image_requested`, `image_prevented`, cost, entitlement, success/fail, asset size. | Preflight allowance, per-period cap, queue/rate limit, kill switch; images only after committed moments. | Show remaining allowance before send; explain reset. |
| Honeymoon farming | Account creation/reset to repeatedly claim expensive starter turns. | Account age, device/IP risk signals subject to privacy review, starter entitlement event, total free cost. | One durable starter entitlement, abuse review thresholds, non-punitive alternative starter mode. | Do not accuse normal players; show clear policy. |
| Context inflation | Huge pasted lore or prompt attacks increase tokens and reduce relevance. | Input tokens, manifest budget, source class, truncation/rejection reason. | Hard manifest budgets, upload limits, summarization as supporting evidence only, prompt caching where safe. | Explain what will be used and what was left out. |
| Tool/safety loop | Repeated moderation, repair, or retrieval calls multiply a failed turn. | Tool-call chain, latency, termination reason, final render status. | Circuit breakers, one safe redirect, deduped moderation/retrieval, no automatic retry storm. | Preserve one clear playable alternative. |
| Entitlement replay | Duplicate webhook/client replay creates credits/features. | External event ID, entitlement revision, idempotency result. | Server-side source, unique event IDs, reconciliation ledger. | Resolve calmly; never blame user for a system duplicate. |

## 5. CostEvent: Minimum Fields Before Any GPU Purchase

The decision question is not “Could a Warden GPU be cheaper?” It is “Which observed workload, at which latency/reliability/quality threshold, has a durable cost problem that a GPU improves after operational burden?” That question cannot be answered by aggregate API spend.

| Field group | Minimum fields | Why it matters |
|---|---|---|
| Identity and causality | `cost_event_id`, `campaign_id`, `player_anonymous_id`, `intent_id`, `StateTx_id`, `base_revision`, `attempt_id`, `parent_attempt_id` | Attributes cost to an actual player action and prevents double counting. |
| Work class | `narration`, `adjudication`, `moderation`, `retrieval`, `summary`, `embedding`, `image`, `receipt`, `entitlement`, `ops` | Reveals what truly costs money; prevents “narrator” becoming a catch-all. |
| Provider/model | Provider, endpoint, model/version, region/service tier, price-card/version, contract rate basis. | Public list price can differ from the bill; model drift changes cost/quality. |
| Usage | Input, cached input, cache write, output, image units, tool calls, storage bytes, GPU seconds if later relevant. | Computes effective cost per accepted turn and cache value. |
| Outcome | `requested`, `started`, `completed`, `blocked`, `canceled`, `timed_out`, `discarded_stale`, `replayed`, `error`. | Measures waste, rather than only successful work. |
| Quality/safety | Warden shadow labels, leak scan result, policy mode, user retry, correction after turn, complaint flag. | Finds expensive low-quality/unsafe turns. |
| Commercial | Free/Mid/High/kid mode, entitlement decision, allowance before/after, offer shown, ad state, refund linkage. | Tests fair gate placement and true cohort economics. |
| Latency/reliability | Queue, first token, commit, render, total time, provider error, circuit-breaker state. | GPU discussion must include latency/availability, not only cost. |

## 6. GPU Deferral Gate

Do **not** purchase or commit to Warden GPU capacity until all conditions below are met with an explicit owner and observation period. This is a product-operating gate, not a ban on future GPU use.

| Gate | Required evidence | Decision if not met |
|---|---|---|
| Workload attribution | ≥30 consecutive days of complete CostEvents across accepted, failed, blocked, and retried work. | Instrument first. |
| Material concentration | A named Warden workload represents a measured, stable share of total variable cost or unacceptable latency—not a guess. | Optimize prompts/model routing/queue first. |
| Quality baseline | Shadow labels and human review show a measurable quality/safety target that current routing cannot meet economically. | Improve fixtures/routing first. |
| Throughput profile | P50/P95/P99 volume and latency are known by hour and cohort. | Do not size hardware on averages. |
| Build-vs-buy model | Fully loaded comparison includes hardware/hosting, utilization, ops/on-call, model upkeep, safety, outage risk, and opportunity cost. | Keep API narrator/Warden path. |
| Rollback | API fallback, kill switch, alerting, and incident owner are tested. | Do not introduce single-point infrastructure. |
| Commercial impact | Better unit cost or latency unlocks a concrete tier/policy improvement without degrading Free fairness. | No GPU purchase for architecture prestige. |

## 7. Measurement Cadence and Decision Board

| Cadence | Read | Decision |
|---|---|---|
| Daily during beta | Total variable cost, top 1% costly users, retries, images, errors, safety blocks, kill-switch calls. | Pause a feature/allowance if cost or safety spikes. |
| Weekly | Cost per accepted turn by mode/model/tier; cache hit; P95 latency; correction-after-turn rate; free gate complaints. | Tune routing, UI, and fair limits. |
| Monthly | Free cohort fully loaded cost, conversion, net revenue, refunds/chargebacks, paid churn, support load, abuse distribution. | Decide tier limits/offer placement; not GPU by default. |
| Quarterly after maturity | GPU gate evidence, vendor/contract changes, quality/latency tradeoff. | Consider a limited shadow or benchmark, never blind migration. |

## Sources and Scope Note

OpenAI and Anthropic public documentation shows differentiated token/caching and service pricing, including caching and mode effects. Those sources support the need for granular metering; they do **not** establish SynapticGM’s actual costs. [1] [2] [3]

**Financial analysis disclosure:** The basis is editable per-user unit-economics formulas; the reference date is 2026-08-18. No silent financial assumptions have been used—unknowns are labeled `INPUT REQUIRED`. Sources are first-party provider price documentation plus the supplied business constraints. Confidence in the framework is high; confidence in any numerical outcome is unavailable until real telemetry is loaded. This is research and analysis only, not personalized financial advice.

## References

[1]: https://developers.openai.com/api/docs/pricing "OpenAI Developer Documentation — Pricing (accessed 2026-08-18)"
[2]: https://openai.com/api/pricing/ "OpenAI — API Pricing (accessed 2026-08-18)"
[3]: https://docs.anthropic.com/en/docs/about-claude/pricing "Anthropic — Pricing and Prompt Caching (accessed 2026-08-18)"

[Back to project index](../README.md)
