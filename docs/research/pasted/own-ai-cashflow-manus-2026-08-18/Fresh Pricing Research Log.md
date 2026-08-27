# Fresh Pricing Research Log

**Reference date:** 18 August 2026 GMT+1.  
**Research rule:** Values below are source-observed list prices or policy terms; final model assumptions will be kept separate and cited.

## 1. OpenRouter pricing and route economics

**Source:** [OpenRouter Pricing](https://openrouter.ai/pricing) — accessed 18 August 2026.

| Observed item | Current published term | Modelling implication |
|---|---:|---|
| Pay-as-you-go platform fee | **5.5%** | Add as a loading to provider inference/list-price cost in the OpenRouter-only scenario, unless a model-specific rate or billing exception is explicitly documented. |
| Paid catalog / providers | 500+ models / 80+ providers | Supports ladder design but does not erase per-request provider variability. |
| Prompt caching | Included in paid plan | Cache economics require reference to the specific provider/model route. |
| Failed/fallback billing | Pricing page surfaces a dedicated FAQ but initial extracted answer was not exposed | Treat retries/fallbacks as paid attempts pending direct FAQ/doc verification; do not assume failed work is free. |
| BYOK allowance | $25,000 list-price inference/month without fees, then 5% fee (per page table) | Not used in primary scenario; relevant only if central routing with direct keys is selected. |

## 2. OpenAI direct API published pricing

**Source:** [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing) — accessed 18 August 2026.

The live page was dynamically extracted. The visible flagship table reports prices per **1M tokens** and showed these selected standard short-context values:

| Model | Input | Cached input | Cache write | Output |
|---|---:|---:|---:|---:|
| gpt-5.6-sol | $5.00 | $0.50 | $6.25 | $30.00 |
| gpt-5.6-terra | $2.00 | $0.20 | $2.50 | $12.00 |
| gpt-5.6-luna | $0.20 | $0.02 | $0.25 | $1.20 |

The relevant cache-read relationship in this table is a **90% discount relative to standard input** for the selected listed models. The pricing page also presented separate long-context rates, Batch/Flex/Fast modes, and model-specific rate tables; these are not conflated with the initial workload model.

> Decision-use note: These are public list prices captured on the reference date. The final model will use one named representative *mid narrator*, one named *low-cost gate*, and one named fallback. It will not blend these values indiscriminately.

## Pending verification in this research log

1. Anthropic current direct pricing and cache write/read multipliers.
2. DeepSeek and Fireworks current direct/hosted pricing and suitable low-cost tier.
3. Current GPU-hour quotes for RunPod, Lambda, Vast.ai, and an equivalent source.
4. Image pricing and moderation/filter controls across OpenRouter, BFL, Replicate, fal, and local ComfyUI.
5. Exact OpenRouter failed/fallback billing documentation, and cache mechanics.

## 3. Directly verified text/API evidence

**Primary-page validation:** [Anthropic Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing), [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/), [Fireworks Serverless Pricing](https://docs.fireworks.ai/serverless/pricing), and [OpenRouter Prompt Caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching) — all accessed 18 August 2026.

| Provider | Selected visible published data | Cache / routing fact retained in model |
|---|---|---|
| Anthropic | Claude Sonnet 5: $2.00 input / $10.00 output per MTok; 5-minute write $2.50, 1-hour write $4.00, cache hit $0.20 per MTok. Claude Haiku 4.5: $1.00 / $5.00, $1.25, $2.00, and $0.10 respectively. | A 5-minute write costs 1.25× input and a cache read 0.1× input. The final model must charge first-turn cache writes separately from cache hits, rather than applying a flat cache discount to all input. |
| DeepSeek | V4 Flash: off-peak $0.007 cache hit / $0.22 cache miss / $0.66 output per MTok; peak $0.014 / $0.44 / $1.32. V4 Pro: off-peak $0.022 / $0.66 / $1.98; peak $0.044 / $1.32 / $3.96. | Published peak hours are 01:00–04:00 and 06:00–10:00 UTC; off-peak is half price. Planning model uses peak price as the conservative live-rate base unless a scheduled batch exists. |
| Fireworks | NVIDIA Nemotron 3.5 Lightning 30B A3B: $0.05 input / $0.01 cached input / $0.20 output per MTok. GPT OSS 120B: $0.15 / $0.015 / $0.60. | Serverless bills input, cached-input and output tokens; cache discount is model-specific. Batch runs at 50% of serverless input/output rates but is asynchronous, so it is **not** assumed for live turns. |
| OpenRouter | Provider-sticky routing keeps an eligible cached conversation on the same provider; sticky sessions expire after 10 minutes of inactivity. The docs show cache read multipliers of 0.1× for Anthropic/DeepSeek and 0.25× or 0.5× for listed OpenAI routes. | Scenario A uses direct observed provider list price × **1.055** platform loading as a conservative paid-credit proxy, while Scenario B uses first-party direct list price. `session_id` / exact stable prefix is an explicit cache-enablement requirement. |

> Important modelling decision: the cashflow comparison will model a **mid narrator with a conservative direct provider list price**, a named **low-cost gate**, and an explicit **API fallback**. It will not treat a vendor's catalogue-average cost, a batch discount, or cache reads as the ordinary live-turn price.

## 4. Research-source caveat on the date

The live pages obtained during this fresh run use future-looking model names and price tables relative to older public documentation. The final output will preserve the stated access date, URLs, price basis, and model names verbatim, and will label vendor prices as **observed list prices on 18 August 2026**, not as commitments. Every listed provider reserves the ability to change pricing and availability.

## 5. Directly verified GPU and BFL image evidence

**Primary-page validation:** [RunPod Pricing](https://www.runpod.io/pricing), [Lambda Pricing](https://lambda.ai/pricing), [Vast RTX 4090 product page](https://vast.ai/pricing/gpu/RTX-4090), and [BFL Pricing](https://docs.bfl.ai/quick_start/pricing) — all accessed 18 August 2026.

| Provider | Selected visible published data | Modelling treatment |
|---|---|---|
| RunPod Pods | 24 GB Community Cloud: RTX A5000 **$0.27/GPU-h**, L4 $0.49, RTX 3090 $0.50, RTX 4090 $0.74. 48 GB RTX A6000 $0.53, A40 $0.44, RTX 6000 Ada $0.84. | Warden planning quote uses A5000 $0.27/h as a low public dedicated benchmark and 4090 $0.74/h as a performance/reference quote. Full narrator uses 48 GB+ values only where its memory/performance requirement supports it; 7B–70B must not inherit Warden hardware economics. |
| RunPod Serverless | 24 GB flex group (L4/A5000/3090/MIG) **$0.69/GPU-h**; RTX 4090 **$1.10/GPU-h**. 48 GB A6000/A40 $1.22 and L40/L40S/6000 Ada/MIG $1.75. | Separate from a pod quote. The short-lived Warden can use scale-to-zero where cold-start latency is acceptable; full narrator does not receive an artificial zero-idle credit in the low-latency scenario. |
| Lambda | Public on-demand page showed only 16–180 GB instances: Tesla V100 16 GB $0.79/h, A100 40 GB $1.99/h, A100 80 GB $2.79/h, H100 80 GB $3.99/h. It did **not** show a current 24/48 GB self-service row. | Use as an evidence-backed higher-class comparison, not as a fabricated 24 GB quote. A current 24/48 GB rate requires authenticated instance-list API or vendor quote. |
| Vast.ai | The direct public GPU product page confirms RTX 4090 has 24 GB VRAM but its dynamic extracted page did not expose the live offer price. The dedicated research sweep captured contemporaneous official marketplace examples of RTX 3090 24 GB $0.07/h and RTX 4090 24 GB $0.13/h, expressly as variable offers. | Present as **marketplace snapshot**, not a quoted committed rate. Add host/reliability/storage/bandwidth and variability caveat; do not assume in a production baseline without deployment validation. |
| BFL direct | FLUX.2 Klein 4B from **$0.014/image/first MP**, Klein 9B from $0.015, Pro from $0.03 (T2I), Max $0.07, Flex $0.05; BFL credits are $0.01 each. FLUX1.1 Pro remains $0.04/image. | The image ladder will price a first-MP memorable image and retain a separate quality/policy column. These are public per-image list prices, excluding any failed/blocked work not documented as free. |

> GPU coverage note: RunPod offers a transparent named hardware quote. Lambda has a transparent public high-VRAM rate but no current 24/48 GB row. Vast.ai is a live offer marketplace, so its best value is a **dated lower-bound snapshot**, not a stable operating commitment. The model will therefore show a low / planning / production-baseline range rather than implying a single guaranteed GPU cost.

## 6. Directly verified OpenRouter and Replicate image evidence

**Primary-page validation:** [OpenRouter FLUX.2 Pro](https://openrouter.ai/black-forest-labs/flux.2-pro) and [Replicate FLUX collection](https://replicate.com/collections/flux) — accessed 18 August 2026.

| Provider | Selected visible published data | Modelling treatment |
|---|---|---|
| OpenRouter / BFL FLUX.2 Pro | Public model page listed **$0.03/MP** output. It stated **$0.015/MP input** for reference images and output costs $0.03 for first MP plus $0.015 per subsequent MP. The page’s provider performance table showed Black Forest Labs output at $0.03/MP. | A 1 MP memorable image is modeled at $0.03 before any separately documented OpenRouter paid-credit fee. The direct BFL equivalent base rate is the same published starting price, so OpenRouter is not assumed cheaper. It earns its place only when its operational routing/logging value is worth the platform/credit loading. |
| Replicate | The collection establishes model suitability but does not itself print price rows. Official specific model pages from the fresh source sweep reported FLUX1.1 Pro $0.04/output image, FLUX.1 dev $0.025/output image, FLUX.1 schnell $0.003/output image, and FLUX.2 Pro $0.015/run plus $0.015 input MP and $0.015 output MP. | Replicate’s 1 MP FLUX.2 Pro cost is $0.03 with no input reference image, equal to BFL/OpenRouter Pro at that resolution; a first-generation Pro comparison is $0.04. Safety needs to be handled as a separate policy-control dimension, not inferred from price. |

> Image-ladder integrity rule: all **cost per memorable** figures will be explicitly calculated as `successful paid images ÷ retained memorable images`, rather than labelling raw generation price as the cost of a usable moment. The default soft-skip policy will reduce demand first; it will not silently assume unrequested images or raw failure rates away.

## 7. Directly verified Replicate, fal, and local Comfy evidence

**Primary-page validation:** [Replicate FLUX.2 Pro](https://replicate.com/black-forest-labs/flux-2-pro), [Replicate Safety Checking](https://replicate.com/docs/topics/predictions/safety-checking), [fal FLUX.2 Pro](https://fal.ai/models/fal-ai/flux-2-pro), and [Comfy Desktop Overview](https://docs.comfy.org/installation/desktop/overview) — accessed 18 August 2026.

| Option | Cost observation | Kid/adult filterability fact | Model use |
|---|---|---|---|
| Replicate official FLUX | The model page supports up to 8 reference images / 9 MP input but the dynamically exposed page did not print its price; the provider’s price evidence is kept from its official model pricing page in the source sweep: FLUX.2 Pro $0.015/run + $0.015/MP output + $0.015/MP input. | Replicate says Flux base and derivative fine-tunes include a safety checker for nudity, violence and other unsafe content; it can be disabled for API runs so a custom/third-party checker can be used. Thus **filterable, but not a purpose-built kid policy by default**. | Apply a 1 MP $0.03 no-reference baseline; score it “configurable, external policy required.” |
| fal FLUX.2 Pro | The page directly states $0.03 for first output MP and $0.015 for each additional input/output MP, rounded up. A 1024×1024 output costs $0.03; 1920×1080 costs $0.045. | Source sweep verified `enable_safety_checker` default true; it detects NSFW nudity/sexual content, returns black output when flagged, and disabling requires authorization. Therefore **configurable NSFW guard, not a complete children’s policy**. | Apply $0.03 at 1 MP; mark default-on safety but require own policy gate and rejected-art soft-skip. |
| Local ComfyUI | The Desktop documentation describes a manager/launcher, with 4.85 GB disk minimum and 8 GB RAM minimum (16 recommended), and no public cloud-inference per-image charge. Core local compute cost is therefore GPU time, model licence and operations. | Core does not provide universal content moderation. The user/operator controls nodes and model selection, so **maximal filterability but maximal responsibility and operations burden**. | Price from GPU amortised/active hour + operator/eval cost, not zero. Retain an external or local safety classifier in all child-safe paths. |

> Policy conclusion to carry into G4: no hosted FLUX provider’s NSFW setting is sufficient evidence of a complete **kid/adult suitability policy**. In a live SynapticGM path, the image request and image result must be governed by SynapticGM policy before display; provider filters are defense-in-depth, not the policy owner.

## 8. Final image-policy and local-operation verification

**Primary-page validation:** [BFL Image Generation](https://docs.bfl.ai/quick_start/generating_images), [BFL Usage Policy](https://bfl.ai/legal/usage-policy), [fal FLUX.2 API](https://fal.ai/models/fal-ai/flux-2/api), and [ComfyUI repository](https://github.com/Comfy-Org/ComfyUI) — accessed 18 August 2026.

| Provider / runtime | Decision-relevant verified control |
|---|---|
| BFL | BFL exposes global, EU and US endpoints, uses asynchronous requests, has 24 active-task limit (six for Kontext Max), and returns signed output URLs valid 10 minutes. Its 4 Aug 2026 Usage Policy prohibits child sexual abuse material, sexual/violent/obscene/harmful depictions of minors and other listed harmful uses, but says the customer must evaluate suitability case-by-case. **Conclusion: contract/policy guard plus operating limits; not evidence of a SynapticGM-specific children’s classifier.** |
| fal | `enable_safety_checker` defaults **true**; unauthorized attempts to disable are still checked; unsafe images are returned as black images; response carries `has_nsfw_concepts`. **Conclusion: strongest directly exposed provider knob of the compared hosted options, but a nudity/sexual-content classifier does not equal a full age-context policy.** |
| Local ComfyUI | The official repository states ComfyUI runs fully offline and that `--disable-api-nodes` can disable optional paid nodes. It supports FLUX.1 / FLUX.2 workflows and custom nodes. **Conclusion: local is controllable and auditable only if SynapticGM deliberately selects, tests, versions and operates every model/node/filter; otherwise it offers no platform safety guarantee.** |

## 9. Fresh-research conclusion for model construction

1. The **GPU-economics claim is strongest for a small Warden**, because a 24 GB-class worker has transparent, low on-demand quotes and can scale to zero. The claim is deliberately weaker for a full narrator because the relevant model/hardware, throughput, context-length and SLO inputs are materially uncertain.
2. Prompt caching is a first-order operating lever: direct Anthropic and DeepSeek evidence show cache reads at **10% of base input**; Fireworks and named OpenRouter routes display similarly material discounts. The cashflow model will calculate cache hits and cache writes instead of baking cache optimism into every API turn.
3. BFL, OpenRouter, Replicate and fal converge around **$0.03 for a 1 MP FLUX.2 Pro output with no reference input**. The decision is therefore driven by policy controls, route ownership, logging, operational burden, and successful-memorable rate—not superficial list-price differences.
4. All providers should be rechecked before a production commitment. The report will cite the access date and classify marketplace/price-table values by confidence and billing basis.

## 10. Currency Translation Basis

**Source:** [Bank of England daily spot exchange rates](https://www.bankofengland.co.uk/boeapps/database/Rates.asp), accessed 18 August 2026. The latest row available on the page was **17 August 2026: £1 = $1.3553**, yielding **$1 = £0.73784** (`1 ÷ 1.3553`). The Bank of England explicitly notes that these are not official rates and no more authoritative than commercial London FX market rates.

The workbook therefore uses **£0.73784 per $1.00** as an editable *planning translation* for all USD vendor list prices. It is not a purchase FX guarantee, card settlement rate, VAT treatment, or tax rate. A 10% FX sensitivity row is included in the workbook’s break-even logic.
