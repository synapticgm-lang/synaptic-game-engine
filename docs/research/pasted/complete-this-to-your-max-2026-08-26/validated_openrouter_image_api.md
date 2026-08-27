# Validated Findings — OpenRouter Image API and FLUX.2 Klein 4B

## Dedicated Image API

Source: **OpenRouter Documentation — Image Generation**, https://openrouter.ai/docs/guides/overview/multimodal/image-generation, accessed 2026-08-26.

OpenRouter documents a dedicated Image API that supports text prompts and optional reference images. Model discovery is available through `/api/v1/images/models`; each model record reports input/output modalities, unioned supported parameters, streaming support, and a link to definitive per-endpoint capability and pricing records. The documentation explicitly advises checking the per-endpoint records because support can differ across providers.

The API documentation includes configuration fields for resolution/aspect ratio, quality, output format, number of images, image-to-image/reference inputs, provider routing, and provider-specific options, but individual models expose only a subset. Therefore, SynapticGM must discover or maintain an allowlist of supported fields per selected model rather than assuming one common superset.

**Product decision:** `generate-image` should validate a model capability snapshot at deployment/runtime and emit only supported parameters. Reference-image conditioning, seed, multiple outputs, quality, or specific format controls are feature flags, not baseline guarantees. Provider-specific syntax stays behind the edge adapter.

## FLUX.2 Klein 4B public model page

Source: **OpenRouter — Black Forest Labs: FLUX.2 Klein 4B**, https://openrouter.ai/black-forest-labs/flux.2-klein-4b, accessed 2026-08-26.

The page describes Klein 4B as the fastest and most cost-effective model in the FLUX.2 family. Current listed pricing is output-based: the first generated megapixel is **$0.014**, and each subsequent megapixel is **$0.001**. The page shows a single provider, Black Forest Labs. Its live performance section reports current telemetry, but those snapshots must not be used as a contractual latency promise.

**Cost implication:** A one-megapixel panel has a base raw-model planning cost of $0.014 before retries, OpenRouter/provider changes, taxes, storage/egress, moderation, or operational overhead. Additional megapixels in the same image are priced much more cheaply under the current listing, but most live comic panels should remain near 1 MP because player-perceived value comes from panel count, composition, and continuity rather than large print resolution.

## Provisional tier implications pending endpoint verification

| Tier role | Candidate use | Reason | Caveat |
|---|---|---|---|
| Free | Klein 4B, sparse one-panel comic-lite | Current listed 1 MP cost is low enough for selected beats, not every turn | Retry rate dominates COGS; hard caps and skips required |
| Mid | Klein 4B strips, occasional higher-quality fallback | Two or three panel jobs remain understandable in per-panel units | Reference-image and seed support must be verified per endpoint |
| High | Premium FLUX variant or Klein for low-salience panels | Spend quality where the beat merits it | Premium model price/latency requires a separate verified model page |

## Non-negotiable interpretation

The published model price is not the final product COGS. The final model must include eligible-turn frequency, panels per eligible turn, first-pass failure rate, paid retry rate, any premium fallback rate, storage/egress, and operational reserve. No story beat is gated on image success, and no reference-image feature is promised until the selected OpenRouter endpoint reports image input support.

## Definitive Klein endpoint record

Source: **OpenRouter Image Models API — FLUX.2 Klein 4B endpoints**, https://openrouter.ai/api/v1/images/models/black-forest-labs/flux.2-klein-4b/endpoints, accessed 2026-08-26.

The current endpoint JSON reports these supported parameters:

| Capability | Current Klein 4B endpoint record |
|---|---|
| Aspect ratios | `1:1`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, `21:9`, `auto` |
| Output format | PNG or JPEG |
| Images per call | Exactly one (`n` min 1, max 1) |
| Input references | Zero to four |
| Seed | Supported |
| Passthrough controls | `steps`, `guidance`, `safety_tolerance` |
| Streaming | Not supported |
| Price | $0.014 per output megapixel |

This resolves the reference question for the current endpoint: **Klein 4B can accept up to four input references today**. It still does not promise face identity. SynapticGM can test one character sheet or one portrait plus a place/kit reference, but multi-character panels remain collision-prone and require prompt locks and fixture testing. Because only one output is allowed per request, every panel and every retry is a distinct paid request and must receive a unique idempotency/capacity record.

## Premium-page inconsistency requiring endpoint authority

The FLUX.2 Pro page visually identifies `black-forest-labs/flux.2-pro` and shows a $0.03/MP headline, but the extracted text included a mismatched FLUX.2 Max pricing passage. The final report will use the per-endpoint JSON, not that mixed page extraction, as the authoritative premium cost/capability source.

## Definitive FLUX.2 Pro endpoint record

Source: **OpenRouter Image Models API — FLUX.2 Pro endpoints**, https://openrouter.ai/api/v1/images/models/black-forest-labs/flux.2-pro/endpoints, accessed 2026-08-26.

The Pro endpoint currently exposes the same aspect-ratio set, PNG/JPEG output, one image per request, seed support, and `steps`/`guidance`/`safety_tolerance` passthrough controls as Klein 4B. It accepts up to **eight** input references and is priced at **$0.03 per output megapixel**. That is about 2.14 times Klein's listed per-megapixel price.

**Tier decision:** Use Pro selectively, not as the High-tier default for every panel. A practical High path uses Klein for low-salience establishing or transition panels and Pro for player-triggered hero plates, reveals, or a single failed Klein repair where quality/adherence has measurable value. Because every request returns one image, multi-panel Pro pages scale linearly in spend.

## Official Klein model-card facts and limitations

Source: **Black Forest Labs — FLUX.2-klein-4B model card**, https://huggingface.co/black-forest-labs/FLUX.2-klein-4B, accessed 2026-08-26.

Black Forest Labs documents the 4B checkpoint as Apache-2.0-licensed, with text-to-image, image editing, and multi-reference support. The model card explicitly warns that it is not intended to provide factual information, can render inaccurate or distorted text, may fail to match prompts, and is sensitive to prompting style. It also urges deployers to use input/output safety filters; the hosted API applies C2PA provenance metadata to downloaded outputs.

These limitations directly support SynapticGM's existing product law: live art must contain no lettering; generated pixels cannot establish facts; prompt locks reduce but do not eliminate roster/kit/place errors; and Kid Mode must rewrite or skip before spend rather than relying only on output moderation. Apache licensing applies to the model weights, not to user reference images, generated content, or protected style inputs, so rights/provenance controls remain necessary.
