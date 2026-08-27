# SynapticGM: Entity Card and Fresh-Research Plan

## Entity Card

| Field | Recorded basis |
|---|---|
| Operating name | **SynapticGM** |
| Legal / common name | SynapticGM; legal entity not provided and not required for this internal operating-cost model |
| Listing status | Private / internal operating project (assumed; no valuation or securities analysis performed) |
| Reporting currency | **GBP (£)** for cashflow presentation; vendor list prices captured in USD and translated by an explicit, editable GBP/USD assumption |
| Fiscal year end | Not provided; analysis is a **rolling 12-month operating-cost** model beginning at the stated reference date rather than a statutory forecast |
| Industry / activity | Live, turn-based game-master service with API-routed narration, image generation, a ledger as system of record, and a proposed Continuity Warden classifier |
| Scope exclusions | **No WOF, no hybrid-climate analysis, no patent analysis.** The analysis covers only live SynapticGM and the stated “own AI vs paid APIs” money decision. |

## Reference-Date Protocol

The pricing research is anchored to **18 August 2026, GMT+1**. Each vendor price will be reported as the current published list price found during this run, with a URL and access date. Where a live price is region-, hardware-, model-, spot-, commitment-, or tier-dependent, the model will retain that basis explicitly rather than treating it as a universal constant.

## Cashflow-Modelling Basis

This is a **direct operating cash-cost** comparison, not a valuation and not personalized financial advice. The principal cash drivers are inference, image calls, reserved/idle GPU capacity, observability/evaluation, human operator time, and paid-API fallback. Revenue, taxes, depreciation, financing, and allocation of pre-existing staff overhead are intentionally excluded, because the requested question is the incremental cost of routing and deployment architecture.

## Confirmed Independent Research Tracks

| Track | Research inputs required | Primary-source target set | Output use |
|---|---|---|---|
| 1. Text/API routing | Per-token input/output pricing; prompt-cache read/write rules; retry/fallback mechanics; hosted gate economics | OpenRouter, OpenAI, Anthropic, DeepSeek, Fireworks, relevant hosted inference suppliers | Scenarios A–C, retry sensitivity, cache formula |
| 2. GPU/self-host economics | On-demand and, where visible, reserved/spot GPU prices; minimum billing; hardware availability; operational implications | RunPod, Lambda, Vast.ai and one additional equivalent if needed | Scenarios D–E, idle capacity, GPU break-even |
| 3. Image generation ladder | Flux/OpenRouter price; BFL direct price; Replicate and fal price; local-Comfy hardware/operation cost; moderation/filter controls | OpenRouter, Black Forest Labs, Replicate, fal, ComfyUI documentation | G4 and art-skip sensitivity |

The three tracks are independent in evidence collection and will be cross-checked against their official pricing or documentation pages. The consolidated model will use common workload, FX, operator-hour, and safety-policy assumptions only after evidence collection.

## Required Deliverables

1. A build-ready Continuity Warden MVP specification, including JSON contracts, labels, stage gates, data-retention design, evaluation suites, and pipeline placement.
2. A 12-month cashflow comparison for **100 / 1,000 / 10,000 free MAU** under five stated architectures.
3. An auditable, spreadsheet-friendly break-even calculator with cache, retry, and art-skip sensitivities.
4. An image cost ladder tied to SynapticGM's weekly caps and a soft-skip policy.
5. A one-page decision memo defining when paid APIs remain the correct choice and when the first Warden-only GPU hour becomes rational.

## Research Integrity Rules

All decision-relevant external values will be either (a) traced to a cited primary price or documentation page with an access date, or (b) marked as an explicit SynapticGM planning assumption. The final spreadsheet will include a source note for each hard-coded value and keep all downstream output formula-driven.
