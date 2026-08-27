# Free Cost Envelope — Methodology and Interpretation

**Author:** Manus AI  
**Price lookup date:** 2026-08-25  
**Reference currency:** OpenRouter model prices in USD; planning translation to GBP uses the ECB information reference-rate cross on 2026-08-25.  
**Scope:** Model inference for the founder-specified Free writer plus a planning allocation of OpenRouter’s credit-purchase fee. This is **not** a full profit-and-loss forecast.

> **Finance disclaimer:** This is operating-cost analysis, not guaranteed financial advice. Provider prices, routing, taxes, exchange rates, token use, and failure rates can change; reconcile the model to invoices and production telemetry before committing spend.

## Verdict

At the specified 25 August 2026 list price, **Free text inference is inexpensive in the planning cases; context growth, retries, image calls, and unmeasured non-model costs are the larger uncertainty**. The planning-base result for 10,000 Free MAU is **£50.38 / £97.51 / £191.78 per month** at 20 / 40 / 80 player turns per MAU, including one opening call per MAU, a speculative 5% billed-attempt overhead, the 5.5% credit-purchase fee, and the $0.80 fee minimum where it dominates. These totals exclude tax and all non-model operating costs.

The unusually low figures are a consequence of the official model card’s list price—$0.035 per million input tokens and $0.10 per million output tokens—not an assumption that infrastructure is free.[1]

## Dated Price Inputs

| Player tier | Founder retail price | Exact model ID | Input price | Output price | Cache-read reference | Context | Status |
| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| Free | £0 | `deepseek/deepseek-v4-flash-0731` | $0.035/M | $0.10/M | Provider table observed from $0.008/M; route-dependent | 1M | Model price **PUBLICLY EVIDENCED**; retail price **EVIDENCED** from founder input. |
| Mid | £14.99 | `anthropic/claude-haiku-4.5` | $1.00/M | $5.00/M | $0.10/M on standard listed provider rows | 200K | Model price **PUBLICLY EVIDENCED**; retail price **EVIDENCED** from founder input. |
| High | £29.99 | `anthropic/claude-sonnet-4.6` | $3.00/M | $15.00/M | $0.30/M on standard listed provider rows | 1M | Model price **PUBLICLY EVIDENCED**; retail price **EVIDENCED** from founder input. |

OpenRouter’s official FAQ states that credit purchases carry a **5.5% fee with a $0.80 minimum**, while underlying provider model prices are passed through without markup.[4] The pricing page also lists a 5.5% Pay-as-you-go platform fee and current BYOK allowances.[5]

## Currency Translation

The ECB’s 25 August 2026 information reference rates quote EUR 1 = USD 1.1662 and EUR 1 = GBP 0.85550.[6]

`GBP per USD = 0.85550 ÷ 1.1662 = 0.733703…`

The ECB explicitly says its reference rates are for information and discourages transaction use.[6] Therefore, the model uses the cross-rate only for planning. Actual card, bank, processor, or accounting conversion will differ.

## Token Scenarios

No production token telemetry was supplied, so all per-turn token sizes and the billed-attempt overhead are **SPECULATIVE**. The CSV keeps these assumptions in every row so they cannot be mistaken for measured data.

| Scenario | Input tokens per normal turn | Output tokens per normal turn | Opening input | Opening output | Purpose |
| --- | ---: | ---: | ---: | ---: | --- |
| `lean_context` | 2,000 | 500 | 4,000 | 800 | Shows a compact prompt and concise output sensitivity. |
| `planning_base` | 6,000 | 800 | 8,000 | 1,200 | Recommended planning placeholder until p50/p90 telemetry exists. |
| `long_context` | 20,000 | 1,200 | 24,000 | 1,600 | Exposes cost if history and instructions grow materially. |

One opening call is included per MAU. The founder-supplied one-time **+8 text turns after New Game** are not silently assumed in the main 20/40/80 turn count. `hook_plus_8_sensitivity.csv` models full use separately under one new game per MAU.

## Formula Lineage

For each scenario:

`normal_turn_cost_usd = (input_tokens × input_rate + output_tokens × output_rate) ÷ 1,000,000`

`opening_cost_usd = (opening_input × input_rate + opening_output × output_rate) ÷ 1,000,000`

`inference_cost_usd = 1.05 × [(MAU × turns × normal_turn_cost) + (MAU × 1 opening × opening_cost)]`

`prorata_fee_usd = inference_cost_usd × 5.5%`

`one_purchase_fee_usd = max(prorata_fee_usd, $0.80)`

`total_gbp = (inference_cost_usd + one_purchase_fee_usd) × 0.733703…`

The `1.05` billed-attempt multiplier is a **SPECULATIVE planning sensitivity**, not a claim about OpenRouter reliability. The founder specified that failed turns refund the player cap but may still incur API cost. Replace `1.05` with measured billed attempts divided by successful player turns.

## Planning-Base Results

| Free MAU | Player turns per MAU | Monthly player turns | Total GBP, one-purchase fee, ex tax | GBP per MAU |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 20 | 2,000 | £1.06 | £0.0106 |
| 100 | 40 | 4,000 | £1.51 | £0.0151 |
| 100 | 80 | 8,000 | £2.40 | £0.0240 |
| 1,000 | 20 | 20,000 | £5.36 | £0.0054 |
| 1,000 | 40 | 40,000 | £9.83 | £0.0098 |
| 1,000 | 80 | 80,000 | £19.18 | £0.0192 |
| 10,000 | 20 | 200,000 | £50.38 | £0.0050 |
| 10,000 | 40 | 400,000 | £97.51 | £0.0098 |
| 10,000 | 80 | 800,000 | £191.78 | £0.0192 |

The low-MAU rows show the effect of OpenRouter’s $0.80 minimum fee: cost per MAU falls as that fixed minimum spreads across more usage. The complete 27-row matrix in `free_cost_envelope.csv` includes lean, planning-base, and long-context sensitivities for every requested MAU/turn combination.

## One-Time +8 Hook Sensitivity

Assuming one new game per MAU and full use of all eight extra text turns, the planning-base incremental cost is:

| Free MAU | Extra turns attempted before 5% overhead | Incremental GBP, prorata 5.5% fee, ex tax |
| ---: | ---: | ---: |
| 100 | 800 | £0.19 |
| 1,000 | 8,000 | £1.89 |
| 10,000 | 80,000 | £18.85 |

This does not add a second $0.80 minimum because the sensitivity assumes the main monthly credit purchase already occurs. Uptake is **INPUT REQUIRED** from new-game and bonus-turn telemetry.

## Founder-Supplied Free Product Facts

| Fact | Treatment |
| --- | --- |
| Free retail price is £0. | **EVIDENCED** from founder input. |
| Free writer is `deepseek/deepseek-v4-flash-0731`. | **EVIDENCED** product input; current price separately verified. |
| Free text allowance is about 12 per day. | **EVIDENCED** product input; reset time and exact enforcement are **INPUT REQUIRED**. |
| Memorable image allowance is zero per week and default OFF. | **EVIDENCED** product input; image cost excluded from the text envelope. |
| Klein icon calls may still bill. | **EVIDENCED** founder warning; actual price and frequency are **INPUT REQUIRED**. |
| Opening setup is free to the player. | **EVIDENCED** cap treatment; it is still modeled as a provider call. |
| Failed turns refund player cap but may bill API. | **EVIDENCED** product rule; actual billed-failure rate is **INPUT REQUIRED**. |
| New Game adds eight text turns once. | **EVIDENCED** product input; full-use sensitivity is separate. |
| Ads are optional overflow only, never Kid, never mid-action. | **EVIDENCED** founder policy and preserved in copy/lever files. |

## Exclusions

The envelope excludes hosting, database, storage, logs, observability, authentication, payment processing, refunds, customer support, moderation, email, analytics, CDN, backups, security, development, QA, legal, accounting, VAT/GST, ad-SDK costs, ad revenue, OpenRouter price changes, exchange execution spread, memorable-image calls, Klein generation, and paid-tier inference. These are not zero; they are outside the requested Free text-inference envelope.

## Ranked Actions

Use `cost_levers.csv` as the operating sequence. The top priorities are to measure production tokens and billed failures, control context without dropping protected facts, use cache only where invoices prove it, pin exact model IDs, and eliminate duplicate submissions. Memorable generation remains OFF by default. Ads remain optional overflow only, never Kid Mode, and never inside an action.

## Finance Delivery Disclosure

**Basis:** Standard listed input/output token prices, one opening call per MAU, 5% billed-attempt sensitivity, and OpenRouter credit-purchase fees. Cache discounts are not assumed.  
**Time:** Prices and FX inputs are dated 2026-08-25.  
**Assumptions:** Token sizes, one new game per MAU for the hook sensitivity, and 5% billed-attempt overhead are explicit placeholders.  
**Sources and confidence:** High confidence in dated official list prices, fee terms, and ECB information rates; low confidence in realized monthly spend until production telemetry and invoices are supplied.  
**Compliance:** This is research and analysis only, not personalized financial advice.

## References

[1]: https://openrouter.ai/deepseek/deepseek-v4-flash-0731 "OpenRouter — DeepSeek V4 Flash 0731 price card"
[2]: https://openrouter.ai/anthropic/claude-haiku-4.5 "OpenRouter — Claude Haiku 4.5 price card"
[3]: https://openrouter.ai/anthropic/claude-sonnet-4.6 "OpenRouter — Claude Sonnet 4.6 price card"
[4]: https://openrouter.ai/docs/faq "OpenRouter FAQ — pricing and fees"
[5]: https://openrouter.ai/pricing "OpenRouter pricing"
[6]: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html "ECB — Euro foreign exchange reference rates, 25 August 2026"
