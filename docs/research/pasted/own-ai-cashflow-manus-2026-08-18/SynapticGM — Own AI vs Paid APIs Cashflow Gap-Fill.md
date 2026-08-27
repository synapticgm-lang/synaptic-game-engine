# SynapticGM — Own AI vs Paid APIs Cashflow Gap-Fill

**Prepared by:** Manus AI  
**Reference / access date:** **18 August 2026, GMT+1**  
**Scope:** Live SynapticGM only. The ledger remains truth. This is a cashflow decision between paid routing/caching and a narrow self-hosted Continuity Warden—not a case for a custom full narrator. It contains **no WOF, hybrid-climate, or patent analysis**.

> **Bottom line:** at the stated workload, paid APIs remain the cash-minimum path through 10,000 Free MAU. A warm self-hosted Warden is **not** an inference-cost saving by itself; it becomes rational only as a deliberately purchased quality/control experiment when its operational value or routing savings exceed a **£366/month** premium. A full self-hosted narrator loses far more often because quality fallback, idle capacity, and operator/evaluation cost destroy the apparent GPU-hour advantage.

![12-month comparison](https://private-us-east-1.manuscdn.com/sessionFile/KV6sd6LZwu2Y5EXZCOlOOC/sandbox/Rdn0BfwKwjyzmooTeYpRS1-images_1787048704768_na1fn_L2hvbWUvdWJ1bnR1L1N5bmFwdGljR01fb3duX2FpX2Nhc2hmbG93X2dhcGZpbGxfMjAyNi0wOC0xOC9kZWxpdmVyYWJsZXMvU3luYXB0aWNHTV9vd25fYWlfY2FzaGZsb3dfZ2FwZmlsbF8yMDI2LTA4LTE4X2Nvc3RfY29tcGFyaXNvbl9jaGFydA.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvS1Y2c2Q2TFp3dTJZNUVYWkNPbE9PQy9zYW5kYm94L1JkbjBCZndLd2p5em1vb1RlWXBSUzEtaW1hZ2VzXzE3ODcwNDg3MDQ3NjhfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwxTjVibUZ3ZEdsalIwMWZiM2R1WDJGcFgyTmhjMmhtYkc5M1gyZGhjR1pwYkd4Zk1qQXlOaTB3T0MweE9DOWtaV3hwZG1WeVlXSnNaWE12VTNsdVlYQjBhV05IVFY5dmQyNWZZV2xmWTJGemFHWnNiM2RmWjJGd1ptbHNiRjh5TURJMkxUQTRMVEU0WDJOdmMzUmZZMjl0Y0dGeWFYTnZibDlqYUdGeWRBLnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4OTQzMDQwMH19fV19&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEUCIFCG5lYz2gB7m05svx2~1Qh5LHqXeTskyQSPsQ4b3GbaAiEA2dHXt~Aj9jZbGWkoxoY2wPuH0fhpGC3imfsrPGdRcpI_)

## 1. Decision Basis and Cost Definition

This is an **incremental, direct operating cash-cost** model. It includes text inference, image generation, warm GPU capacity, estimated operator time, evaluation budget, and explicit paid fallbacks. It excludes revenue, VAT/taxes, payment processing, existing ledger/platform costs, storage, egress, capital expenditure, pre-existing corporate overhead, and negotiated discounts. Those exclusions are deliberate: the question is the architecture’s incremental cash burden, not a company valuation or a forecast of SynapticGM revenue.

All list-price inputs were freshly captured from primary vendor pages on 18 August 2026. The model converts USD to GBP at **£0.73784 per $1**, calculated from the Bank of England page’s most recent displayed rate of **£1 = $1.3553 on 17 August 2026**. The Bank explicitly labels its displayed spot rates non-official, so this is an editable planning translation rather than a settlement-rate promise. [1]

### 1.1 Workload and Operating Assumptions

| Input | Base case | Why it is in the model |
|---|---:|---|
| Free MAU cohorts | **100 / 1,000 / 10,000** | Required comparison scale. |
| Turns per Free MAU per month | **40** | Explicit planning assumption; equal to 480 turns per annualized Free MAU. |
| Narrator input / output per turn | **5,000 / 500 tokens** | Includes ledger-aware stable prefix and final response. Change this first if observed telemetry differs. |
| Cache hit / cache-write share | **30% / 5%** | Cache hits price at the published read rate; cache writes retain their distinct published rate. The remaining 65% is ordinary input. |
| Standard API retry rate | **5%** | One retry expected across transient errors / failed generation; no free-failure assumption. |
| Peak factor | **10× average turn rate** | Capacity safety margin for a live service; it makes idle GPU cost visible. |
| Operator cost | **£40/hour** | Explicit planning assumption, not a wage benchmark. |
| Art soft-skip | **70%** | Only 30% of cap-eligible art moments receive a paid image request. |
| Art cap | **1 attempt / weekly active user / week**, 60% WAU/MAU | A deliberate scarcity policy, not turn-by-turn wallpaper. |
| Art success / memorable keep rate | **90% / 65%** | Converts raw image price to cost per usable memorable. |

### 1.2 Representative Vendor-Rate Inputs

The model uses a representative **mid narrator** rather than pretending that all catalogue models are comparable. Direct Anthropic Claude Sonnet 5 list pricing is **$2.00/MTok input, $0.20/MTok cache hit, $2.50/MTok 5-minute cache write, and $10.00/MTok output**. Anthropic’s published cache rules make a 5-minute write 1.25× base input and a read 0.1× base input. [2]

| Cost layer | Current published input used in base model | Model treatment |
|---|---|---|
| OpenRouter-only narrator | Underlying mid-narrator rate, then **5.5% planning loading**. | The OpenRouter pricing page shows a 5.5% pay-as-you-go platform fee. Its cache docs support sticky provider routing/session IDs. This is a conservative planning gross-up, not a claim that every billing path has identical economics. [3] |
| Direct narrator | Anthropic Sonnet 5 rate above. | Cache read/write and retry are calculated separately. [2] |
| Hosted low-cost gate | Fireworks NVIDIA Nemotron 3.5 Lightning 30B A3B: **$0.05 input / $0.01 cached input / $0.20 output per MTok**. | Two gate passes together use 2,200 input and 80 output tokens per live turn. This is intentionally a gate, not a substitute narrator. [4] |
| Low-cost direct-route cross-check | DeepSeek V4 Flash off-peak: **$0.007 cache hit / $0.22 miss / $0.66 output per MTok**. | Not used to overstate reliability/quality equivalence; it validates why routing/cache optimization should precede GPU purchase. Peak pricing is double the stated off-peak rate. [5] |
| Warm Warden GPU | RunPod 24 GB RTX A5000 Community Pod: **$0.27/GPU-hour**. | One always-warm 24 GB worker, 730 paid hours/month. [6] |
| Scale-to-zero Warden comparison | RunPod 24 GB serverless group: **$0.69/GPU-hour active**. | Used only as an active-compute comparison, not granted a zero-latency guarantee. [6] |
| 70B capacity proxy | RunPod A100 PCIe 80 GB Community Pod: **$1.39/GPU-hour**. | A capacity illustration; not proof that a chosen 70B quantization meets quality or latency requirements. [6] |
| Image baseline | BFL / FLUX.2 Pro first output MP: **$0.03**. | 1 MP list-price comparison and weekly-cap calculation. [9] [10] |

## 2. Architecture Definitions

| Scenario | What it means | What is deliberately not assumed |
|---|---|---|
| **A — OpenRouter-only** | One routing layer sends the mid narrator through OpenRouter; API retry included. | No self-hosted GPU, no bespoke gate, no claim that every provider/fallback attempt is free. |
| **B — Direct APIs + prompt cache** | Direct mid narrator, stable prefix/cache-aware request composition, direct retry. | No self-hosted gate/GPU. It carries more route/account operations than A at small scale. |
| **C — Hosted low-cost gates + mid narrator** | Hosted low-cost pre/post continuity gates, direct mid narrator, 1% narrator fallback. | No custom model and no GPU reservation. |
| **D — Self-host Continuity Warden only** | Direct mid narrator plus a narrow self-hosted Warden on a warm 24 GB Pod, 1% hosted-gate fallback. | No custom full narrator. The Warden validates; it does not generate story prose. |
| **E1 — Self-host full 7B narrator** | 7B self-hosted narrator capacity on 24 GB Pods, **85% paid-API quality/load fallback**, 160 output tokens/s/GPU planning throughput. | It is not granted quality parity merely because it can run. The 85% fallback assumption is intentionally production-conservative until immutable evaluation proves otherwise. |
| **E2 — Self-host full 70B narrator** | 70B self-hosted capacity on A100 80 GB, 10% paid API fallback, 50 output tokens/s/GPU planning throughput. | It is not assumed to be a cheap single-GPU service at 10,000 MAU. The model sizes 10× peak capacity. |

## 3. G2 — 12-Month Cashflow Tables

The values below are **monthly cash cost / annualized 12-month cash cost** in GBP. They include the per-scenario operator and evaluation budgets stated in §3.4 and baseline art. Do not interpret the lower raw inference price of a smaller model as comparable product quality: E1 and E2 include explicit fallback and operational consequences precisely to avoid that mistake.

### 3.1 100 Free MAU

| Scenario | £ / month | £ / 12 months | £ / MAU / month | GPU count | Paid idle GPU hours / month |
|---|---:|---:|---:|---:|---:|
| A — OpenRouter-only | £107.35 | £1,288.18 | £1.07 | 0 | 0.0 |
| B — Direct APIs + prompt cache | £160.23 | £1,922.77 | £1.60 | 0 | 0.0 |
| C — Hosted gates + mid narrator | £220.16 | £2,641.90 | £2.20 | 0 | 0.0 |
| D — Self-host Warden only | £525.66 | £6,307.96 | £5.26 | 1 | 729.3 |
| E1 — Self-host full 7B narrator | £648.33 | £7,779.91 | £6.48 | 1 | 726.5 |
| E2 — Self-host full 70B narrator | £1,614.08 | £19,369.01 | £16.14 | 1 | 718.9 |

At 100 MAU, operational fixed cost dominates. The cost case is unambiguous: **use paid APIs**. A warm Warden has only 0.67 active GPU-hours in a 730-hour paid month; buying a GPU is an engineering experiment, not a cost optimization.

### 3.2 1,000 Free MAU

| Scenario | £ / month | £ / 12 months | £ / MAU / month | GPU count | Paid idle GPU hours / month |
|---|---:|---:|---:|---:|---:|
| A — OpenRouter-only | £488.49 | £5,861.84 | £0.49 | 0 | 0.0 |
| B — Direct APIs + prompt cache | £522.31 | £6,267.71 | £0.52 | 0 | 0.0 |
| C — Hosted gates + mid narrator | £581.58 | £6,978.98 | £0.58 | 0 | 0.0 |
| D — Self-host Warden only | £887.77 | £10,653.21 | £0.89 | 1 | 723.3 |
| E1 — Self-host full 7B narrator | £944.40 | £11,332.76 | £0.94 | 1 | 695.3 |
| E2 — Self-host full 70B narrator | £2,411.32 | £28,935.80 | £2.41 | 2 | 1,348.9 |

At 1,000 MAU, the Warden’s **active** compute is only 6.67 GPU-hours/month. The £145.43 warm-GPU charge is small relative to total cost, but the added £160/month of Warden operator/evaluation budget is not. C is the lowest-risk way to test the pre/post-gate design; D buys operational control, not cash savings.

### 3.3 10,000 Free MAU

| Scenario | £ / month | £ / 12 months | £ / MAU / month | GPU count | Paid idle GPU hours / month |
|---|---:|---:|---:|---:|---:|
| A — OpenRouter-only | £4,299.87 | £51,598.42 | £0.43 | 0 | 0.0 |
| B — Direct APIs + prompt cache | £4,143.09 | £49,717.13 | £0.41 | 0 | 0.0 |
| C — Hosted gates + mid narrator | £4,195.82 | £50,349.83 | £0.42 | 0 | 0.0 |
| D — Self-host Warden only | £4,508.82 | £54,105.81 | £0.45 | 1 | 663.3 |
| E1 — Self-host full 7B narrator | £4,486.82 | £53,841.87 | £0.45 | 5 | 3,302.8 |
| E2 — Self-host full 70B narrator | £13,378.41 | £160,540.91 | £1.34 | 16 | 10,568.9 |

At 10,000 MAU, B becomes lower cash than A because the direct/cache variable-cost advantage finally exceeds the deliberately higher direct-route operator budget. The **Warden-only premium remains £365.72/month** versus B in this model, because one warm 24 GB service plus its evaluation/operations remains a fixed increment. E2 is decisively non-economic under the throughput/SLO assumption: capacity rises to 16 A100s while more than 10,000 paid GPU-hours sit idle each month.

### 3.4 Operator, Evaluation and Failure-Fallback Assumptions

| Scenario | Operator hours / month | Operator £ / month | Eval £ / month | Failure / quality fallback |
|---|---:|---:|---:|---|
| A | 1 | £40 | £25 | 5% retry included in narrator cost. |
| B | 2 | £80 | £40 | 5% retry included in narrator cost. |
| C | 3 | £120 | £60 | 3% narrator retry; **1%** direct narrator fallback. |
| D | 6 | £240 | £100 | **1%** hosted-gate fallback on Warden timeout/error. |
| E1 | 8 | £320 | £150 | **85%** direct narrator fallback until quality/load equivalence is demonstrated. |
| E2 | 14 | £560 | £300 | **10%** direct narrator fallback; capacity remains the major cost. |

These are editable planning values. They intentionally make the costs of evaluation, incident response, canarying, calibration, data hygiene and fallback visible. Treating self-hosting as “GPU price only” is precisely the modelling error this table prevents.

## 4. GPU Quote Refresh and Idle-Capacity Reality

| Provider | Fresh public quote (USD) | Billing / comparability note | Recommended use in this decision |
|---|---:|---|---|
| RunPod | RTX A5000 24 GB Pod **$0.27/h**; 24 GB serverless group **$0.69 active h**; RTX 4090 Pod $0.74/h; A100 PCIe 80 GB $1.39/h. [6] | Pod is warm paid capacity; serverless is active time and can add cold-start/queue behaviour. | Base Warden quote; A100 proxy for 70B capacity. |
| Lambda | Tesla V100 16 GB $0.79/h; A100 40 GB $1.99/h; A100 80 GB $2.79/h. [7] | The live public page did not expose a 24/48 GB self-service row on the access date. | Higher-class comparator; do not invent a 24 GB quote. |
| Vast.ai | Dated marketplace snapshot: RTX 3090 24 GB **$0.07/h**; RTX 4090 24 GB **$0.13/h**. [8] | Offer/host/reliability/storage/bandwidth dependent; public display is dynamic. | A low-bound market observation, **not** a production baseline or commitment. |

The Warden’s active GPU cost is almost irrelevant at early scale. At the stated two-pass 0.60 GPU-seconds/turn, active compute is 0.67 / 6.67 / 66.67 GPU-hours at 100 / 1,000 / 10,000 MAU. A warm A5000 costs £145.43/month at the planning FX, of which 729.33 / 723.33 / 663.33 hours are idle in the three cohorts. A scale-to-zero serverless estimate is only £0.34 / £3.39 / £33.94 of active GPU cost respectively, but it is **not** a substitute if measured cold-start or queue latency violates live turn expectations.

## 5. G3 — Break-Even Calculator

The workbook contains live formulas on the **Assumptions**, **Cashflow**, and **Sensitivity** tabs. Blue cells are editable hardcodes with source comments, black cells are same-sheet formulas, and green cells are cross-sheet links. The formulas below are spreadsheet-ready and make all assumptions reconstructable.

### 5.1 Core Formulas

| Output | Spreadsheet-friendly formula |
|---|---|
| Monthly turns | `=MAU * Turns_per_User_per_Month` |
| Effective input $/MTok | `=CacheHit*CacheRead + CacheWriteShare*CacheWrite + (1-CacheHit-CacheWriteShare)*BaseInput` |
| Narrator $/turn | `=(InputTokens/1000000)*EffectiveInputRate + (OutputTokens/1000000)*OutputRate` |
| Narrator £/month | `=MonthlyTurns*NarratorUSDperTurn*(1+RetryRate)*GBPperUSD` |
| Art £/month | `=MAU*WeeklyActiveShare*WeeklyCap*WeeksPerMonth*(1-ArtSkipRate)*ImageUSD*GBPperUSD` |
| Warm GPU £/month | `=GPUCount*WarmHoursPerMonth*GPUUSDperHour*GBPperUSD` |
| Warden GPU count | `=MAX(1,ROUNDUP((MonthlyTurns/(DaysPerMonth*24*3600))*PeakFactor*WardenGPUSecondsPerTurn,0))` |
| Full-narrator GPU count | `=MAX(1,ROUNDUP(((MonthlyTurns/(DaysPerMonth*24*3600))*PeakFactor*OutputTokensPerTurn)/OutputTokensPerSecondPerGPU,0))` |
| Self-host break-even MAU | `=(SelfHostFixedCost-PaidFixedCost)/(PaidVariableCostPerMAU-SelfHostVariableCostPerMAU)` |

For cache write share, set it to **zero when caching is disabled**. Do not apply a cheap cache-read rate to the first cache write; Anthropic’s published 5-minute write is 1.25× input, whereas reads are 0.1× input. [2]

### 5.2 Worked Cache-Hit Sensitivity — B at 1,000 MAU

| Cache hit rate | Narrator £ / month | Total £ / month | Total £ / 12 months |
|---:|---:|---:|---:|
| 0% | £464.84 | £602.11 | £7,225.29 |
| 30% base case | £385.04 | £522.31 | £6,267.71 |
| 70% | £273.48 | £410.75 | £4,928.97 |

Moving from zero to 70% cache hit saves **£191.36/month** at 1,000 MAU in the model—more than a warm A5000 Warden GPU but without the Warden’s additional operator/evaluation cost. This quantifies why routing, stable prefixes and cache observability should be completed before buying GPU hours.

### 5.3 Worked Retry Sensitivity — B at 1,000 MAU

| Retry rate | Narrator £ / month | Total £ / month | Total £ / 12 months |
|---:|---:|---:|---:|
| 0% | £366.71 | £503.97 | £6,047.69 |
| 5% base case | £385.04 | £522.31 | £6,267.71 |
| 15% | £421.71 | £558.98 | £6,707.76 |

Retries matter, but prompt-cache discipline is the larger controllable variable in this workload. The calculation assumes paid retry work; investigate a vendor-specific failure invoice only if logs can prove a different billing result.

### 5.4 Worked Art-Skip Sensitivity

| Art soft-skip rate | 100 MAU art £ / month | 1,000 MAU art £ / month | 10,000 MAU art £ / month | Image attempts at 10k / month |
|---:|---:|---:|---:|---:|
| 0% | £5.76 | £57.55 | £575.52 | 26,000 |
| 30% | £4.03 | £40.29 | £402.86 | 18,200 |
| 70% base case | £1.73 | £17.27 | £172.66 | 7,800 |

Soft-skip is an experience-quality control first and a cost control second. It prevents images from becoming expected wallpaper, keeps the weekly cap meaningful, and allows the content/safety pipeline to concentrate on moments that are genuinely player-visible and ledger-supported.

### 5.5 Warden Break-Even Rule

Relative to direct APIs plus cache (B), the warm Warden-only configuration (D) costs an incremental **£365.43 / £365.46 / £365.72 per month** at 100 / 1,000 / 10,000 MAU. The cost is nearly fixed because one warm 24 GB Pod and incremental Warden operations are carried across the range.

| MAU | Warden premium vs B / month | Required reduction in B narrator spend | Required saving / turn | Serverless active-only GPU comparator |
|---:|---:|---:|---:|---:|
| 100 | £365.43 | 949.1% | £0.09136 | £0.34/month |
| 1,000 | £365.46 | 94.9% | £0.00914 | £3.39/month |
| 10,000 | £365.72 | 9.5% | £0.00091 | £33.94/month |

A warm Warden **does not self-fund at 100 or 1,000 MAU** through API savings in this model. At 10,000 MAU, it needs to reduce paid narrator spend by at least **9.5%** (or create a credible equivalent operational value) before it breaks even. That can come from avoiding costly retries/escalations, enabling lower-cost safe routing, or preventing sufficiently costly continuity incidents—but those benefits must be measured, not presumed.

### 5.6 Why Full Narrator Self-Hosting Usually Loses

| Case | 100 MAU | 1,000 MAU | 10,000 MAU | What must be true before it competes with B |
|---|---:|---:|---:|---|
| 7B, 85% API fallback | £648/month vs B £160 | £944 vs £522 | £4,487 vs £4,143 | At 10k MAU it must keep fallback at or below **75.6%** merely to tie B; it is already impossible at 100/1k even with 0% fallback under this warm/ops model. |
| 70B, 10% API fallback | £1,614 vs £160 | £2,411 vs £522 | £13,378 vs £4,143 | Even 0% fallback cannot offset the modeled warm capacity/operations at these cohorts; the 10k case carries 16 A100s and 10,568.9 idle GPU-hours/month. |

The 7B row is deliberately conservative because it cannot be assumed to match paid narrator quality, tool reliability, long-context handling or refusal behavior. The 70B row illustrates the separate capacity trap: even if a large model can produce attractive results, latency/peak requirements force multiple warm high-VRAM GPUs long before token volume supports them. The model therefore gives full self-hosting the benefit of **explicit** fallback, rather than hiding quality loss inside a low GPU bill.

## 6. G4 — Image Cost Ladder Refresh

### 6.1 Cost per 1 MP and per Retained Memorable

The baseline retained-memorable denominator is `0.90 delivery success × 0.65 memorable keep = 58.5%`. At £0.73784/$, a $0.03 paid 1 MP image costs **£0.02214 per attempt** and **£0.03784 per retained memorable**. That is not the price of every image shown to a player; it is the cost of a paid attempt divided by the assumed share that survives delivery and product-quality selection.

| Route | 1 MP list cost | £ / paid 1 MP attempt | Kid/adult filterability assessment | £ / retained memorable (base) | Route decision |
|---|---:|---:|---|---:|---|
| **FLUX via OpenRouter — FLUX.2 Pro** | $0.030 | £0.022 | No complete kid/adult control evidenced on the model page; rely on SynapticGM policy plus upstream BFL/provider rules. [10] | £0.038 | No 1 MP price advantage over BFL direct. Use only if unified routing/logging is worth it. |
| **BFL direct — FLUX.2 Pro** | $0.030 | £0.022 | BFL has policy restrictions and moderation/safety controls, but its policy still requires user suitability evaluation. [9] [14] | £0.038 | Clean direct route; retrieve and re-serve results rather than exposing signed provider URLs. |
| **Replicate — FLUX.2 Pro** | $0.015 run + $0.015 output MP = $0.030 | £0.022 | Flux safety checker and custom/third-party safety option are documented. It is configurable, not a complete child-context policy. [11] | £0.038 | Reference images add $0.015/MP; require SynapticGM policy gate. |
| **fal — FLUX.2 Pro** | $0.030 first output MP | £0.022 | `enable_safety_checker` defaults true; unsafe results are black and `has_nsfw_concepts` is returned. Strong NSFW control, not full age/context policy. [12] | £0.038 | Best exposed provider safety knob of this set; still require own prompt/result policy. |
| **Local ComfyUI — FLUX/open model** | GPU/workflow dependent | Formula, not zero | Maximum controllability only if SynapticGM operates model/node/filter versions; core offers no universal platform safety filter. [13] | `=active GPU + operator + eval / retained memorable` | Defer unless local visual control itself is a proved product need. |

### 6.2 Soft-Skip Policy

A robust soft-skip policy is more important than a small difference among equal $0.03 routes. The system should generate an image only when the Warden/ledger confirms a player-visible, non-recycled, meaningful event; the weekly cap has not been used; prompt policy permits it; and the predicted image is expected to add a distinctive memory rather than duplicate a text beat. The result should then pass provider and SynapticGM result checks before display.

| Stage | Rule | Cash / policy effect |
|---|---|---|
| Eligibility | Require a ledger-supported, player-visible, distinctive moment. No auto-art just because a turn exists. | Makes “soft skip” a product choice, not a hidden cost cut. |
| Cap | Start at one paid attempt per weekly active user per week. | Limits uncapped exposure and protects memorable scarcity. |
| Prompt gate | Apply SynapticGM content/age policy before vendor submission. | Avoids paying to request disallowed work where possible. |
| Provider guard | Keep BFL/Replicate/fal filters enabled as appropriate; do not treat them as the policy owner. | Defense in depth, not a delegated kid/adult decision. |
| Result gate | Check delivered image before display; do not expose temporary provider delivery URLs. | Protects player experience and permits audit. |
| Measure | Track attempted, charged, delivered, skipped, blocked, shown, retained-memorable. | Converts “image quality” into observable unit economics. |

## 7. Decision Implications

The first money decision is not “own model or API?” It is **“which paid-route controls reduce cost and improve continuity before fixed capacity is purchased?”** The evidence supports this ordering:

1. Stabilize prompt prefixes, use session/provider affinity, and record cache tokens/cost. OpenRouter documents sticky routing and cache observability, while direct vendor pages make cache-read economics explicit. [2] [3]
2. Instrument retries, fallbacks, per-turn token mix, and image attempts/retained memorables. Without these, a GPU quote is a guess against a guess.
3. Put the Warden specification into shadow mode on a hosted low-cost gate. Build its deterministic ledger evidence and privacy-limited flywheel before buying inference capacity.
4. Buy a first Warden-only GPU hour only after the experiment can answer a quality/control question that paid gates cannot—without widening into an unproven custom narrator.
5. Do not buy full-narrator capacity from the hope that a small raw token bill equals product equivalence. Require the 50-invention, 20-retry novelty and 100-turn kit-recall gates to prove quality before changing fallback assumptions.

## References

[1]: [Bank of England — Daily spot exchange rates](https://www.bankofengland.co.uk/boeapps/database/Rates.asp) (accessed 18 Aug 2026).

[2]: [Anthropic — Claude API pricing and prompt caching](https://docs.anthropic.com/en/docs/about-claude/pricing) (accessed 18 Aug 2026).

[3]: [OpenRouter — Pricing](https://openrouter.ai/pricing) and [Prompt Caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching) (accessed 18 Aug 2026).

[4]: [Fireworks AI — Serverless pricing](https://docs.fireworks.ai/serverless/pricing) (accessed 18 Aug 2026).

[5]: [DeepSeek — Models and pricing](https://api-docs.deepseek.com/quick_start/pricing/) (accessed 18 Aug 2026).

[6]: [RunPod — GPU cloud pricing](https://www.runpod.io/pricing) (accessed 18 Aug 2026).

[7]: [Lambda — AI cloud pricing](https://lambda.ai/pricing) (accessed 18 Aug 2026).

[8]: [Vast.ai — Pricing](https://vast.ai/pricing) and [RTX 4090 GPU page](https://vast.ai/pricing/gpu/RTX-4090) (accessed 18 Aug 2026; dynamic marketplace offers).

[9]: [Black Forest Labs — Pricing](https://docs.bfl.ai/quick_start/pricing) (accessed 18 Aug 2026).

[10]: [OpenRouter — BFL FLUX.2 Pro](https://openrouter.ai/black-forest-labs/flux.2-pro) (accessed 18 Aug 2026).

[11]: [Replicate — FLUX.2 Pro](https://replicate.com/black-forest-labs/flux-2-pro) and [Safety checking](https://replicate.com/docs/topics/predictions/safety-checking) (accessed 18 Aug 2026).

[12]: [fal — FLUX.2 Pro](https://fal.ai/models/fal-ai/flux-2-pro) and [FLUX.2 API schema](https://fal.ai/models/fal-ai/flux-2/api) (accessed 18 Aug 2026).

[13]: [ComfyUI repository](https://github.com/Comfy-Org/ComfyUI) and [Comfy Desktop overview](https://docs.comfy.org/installation/desktop/overview) (accessed 18 Aug 2026).

[14]: [Black Forest Labs — Usage Policy](https://bfl.ai/legal/usage-policy) (accessed 18 Aug 2026).

---

**Delivery disclosure.** **Basis:** direct operating cash cost; cached-input, cache-write and output token prices are distinct; image cost is converted to cash per retained memorable using explicit success/keep assumptions. **Time:** vendor pages and FX reference accessed 18 August 2026; FX shown is the most recent Bank of England row displayed, dated 17 August 2026. **Assumptions:** 40 turns/MAU/month, stated token mix, cache/retry/fallback, operator, GPU-capacity and art policy inputs are editable in the workbook. **Sources & confidence:** primary vendor documentation and price pages are cited; dynamic marketplace and account-specific billing terms are lower confidence and flagged. **Compliance:** this is research and analysis only, not personalized financial advice.
