# SynapticGM Decision Memo — When to Pay APIs, When to Buy the First Warden GPU Hour

**To:** John  
**Date:** 18 August 2026  
**Decision:** Keep the narrator paid. Treat the first GPU hour as a **time-boxed Continuity Warden experiment only**, never as permission to self-host a narrator.

> **Recommendation:** For live SynapticGM, optimize direct/API routing, stable prompt prefixes, cache hit rate, retry visibility and image soft-skip first. Do not buy warm GPU capacity until the Warden can answer a measured continuity/control question that hosted gates cannot, and its value clears a named £365/month hurdle at the 24 GB warm-pod baseline.

## The Cash Fact

At 40 turns per Free MAU/month, 5,000 input and 500 output tokens/turn, 30% cache hit, and the stated operator/evaluation budgets, paid routing remains cash-cheaper through 10,000 Free MAU. Direct cached APIs (B) are **£160 / £522 / £4,143 per month** at 100 / 1,000 / 10,000 MAU. A warm self-hosted Warden only (D) is **£526 / £888 / £4,509**; the gap versus direct cached APIs is effectively fixed at **£365/month**. The reason is not Warden compute: at 1,000 MAU the Warden needs 6.67 active GPU-hours/month but a warm A5000 Pod consumes 730 paid hours, leaving 723.33 idle. RunPod’s observed 24 GB A5000 Pod rate was $0.27/GPU-hour; its 24 GB serverless group was $0.69 active GPU-hour. [1]

The immediate money lever is caching. Under the same 1,000-MAU workload, direct API cost moves from **£602/month at 0% cache hit**, to **£522 at 30%**, to **£411 at 70%**. Anthropic’s published cache hit price is 10% of base input and cache writes are separately charged, so the implementation work is real, measurable, and cheaper than warm idle capacity. [2]

| Decision test | **John should still only pay APIs** | **Buy the first GPU hour — Warden only** |
|---|---|---|
| Product scope | The job is narrator quality, flexible prose, and speed. | The job is narrowly evidence-bound continuity validation against the ledger. |
| Scale / cash | 100–1,000 MAU, or no demonstrated Warden value above **£365/month**. | At 10,000 MAU, measured Warden-driven routing/retry/incident savings can exceed **9.5% of narrator spend**; or a non-cash control benefit is explicitly budgeted. |
| Quality evidence | Shadow Warden has not met its label-level promotion gates. | The 50-invention, 20-retry novelty and 100-turn kit-recall suites pass; every finding cites ledger evidence; shadow review overturns are low. |
| Operations | No named owner for calibration, privacy-minimized logs, incident response, GPU health and rollback. | Six Warden operator hours/month and £100/month evaluation budget have an owner, a metric dashboard and a rollback flag. |
| Latency | Live-turn SLO requires proven low latency and cold-start behavior is unknown. | A paid serverless canary has measured cold-start/p95/queue behavior; promote to warm Pod only if that data shows it is needed. |
| Privacy / governance | Validator data flywheel is not yet implemented. | Redacted 90-day validator log, COUNSEL hold/exclusion, adjudication workflow and model-manifest deletion path are live. |

## The First GPU-Hour Rule

Buy a **single Warden-only GPU hour** when all of the following are true. First, run the Warden in shadow mode against the live signed ledger snapshot; it must validate, not narrate or mutate canon. Second, freeze the three evaluation suites and compare hosted-gate versus self-hosted Warden accuracy, calibration, p95 latency and fallback rate on the identical fixtures. Third, send no raw chat archive into training: collect only redacted validator evidence and adjudications. Fourth, define the success outcome in advance: either measured monthly savings/control value greater than the £365 warm-Warden premium, or a deliberate, separately approved product-quality spend.

Start with a **serverless or short Pod canary**, not a standing reservation. The cash cost of one A5000 Pod hour is only the published GPU-hour rate translated at planning FX; the meaningful expense is the human time and evaluation needed to decide whether the model belongs in the turn path. A warm GPU is the next step only when observed latency/SLO data makes scale-to-zero unsuitable. Do not generalize a successful Warden canary into a narrator program.

## Explicit “No” to Full Narrator Self-Hosting

A 7B narrator is not a cost win merely because it fits 24 GB. In the production-conservative model it retains an 85% paid-API fallback until it proves quality parity, producing **£648 / £944 / £4,487 per month** at the three cohorts. Even at 10,000 MAU it must reduce fallback to **75.6% or lower simply to tie** the direct cached API case. The 70B model is worse under the live peak/SLO assumption: it scales to 16 A100-class GPUs and costs **£13,378/month** at 10,000 MAU. Therefore, a narrator should remain paid until it independently passes the same continuity/evaluation gates, demonstrates comparable player outcomes, and carries a full capacity, fallback and operator budget—not a benchmark screenshot.

**Decision now:** Pay APIs; implement cache/session telemetry and hosted Warden shadow mode. The next capital decision is a Warden canary once its evidence/data flywheel exists. The next decision is **not** a full self-hosted narrator.

## References

[1]: [RunPod — GPU cloud pricing](https://www.runpod.io/pricing) (accessed 18 Aug 2026).

[2]: [Anthropic — Claude API pricing and prompt caching](https://docs.anthropic.com/en/docs/about-claude/pricing) (accessed 18 Aug 2026).

[3]: [OpenRouter — Prompt Caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching) (accessed 18 Aug 2026).

**Basis:** incremental operating cash cost, not revenue or valuation. **Time:** vendor pages accessed 18 Aug 2026; GBP translation based on the Bank of England page’s latest 17 Aug 2026 row. **Assumptions:** stated turn, token, cache, retry, image, capacity and operator inputs are editable in the workbook. **Sources & confidence:** primary price/documentation pages; dynamic marketplace rates remain illustrative only. **Compliance:** this is research and analysis only, not personalized financial advice.
