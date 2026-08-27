# Validated source notes — SynapticGM memory/cost report

Access date: 2026-08-18.

## OpenAI API pricing

Primary URL: https://developers.openai.com/api/docs/pricing

The current pricing page presents Standard, Batch, Flex, and Fast-mode price views. It states prices are per 1M tokens and presents cached-input pricing. It also states that eligible regional-processing/data-residency endpoints have a 10% uplift for qualifying models released on or after 2026-03-05, and that Priority processing was renamed Fast mode on 2026-07-30. Exact model-price cells are volatile and retained in the live route table only.

## Anthropic prompt caching

Primary URL: https://platform.claude.com/docs/en/build-with-claude/prompt-caching

The primary documentation confirms automatic and explicit cache breakpoints; caches apply to the complete prefix across tools, system, and messages up to the breakpoint. Default cache lifetime is 5 minutes and a 1-hour duration is available at an additional cost. The source lists current per-million-token pricing, including cache writes and cache hits. The report treats all rate references as a dated price-sheet snapshot rather than durable fact.

## Research discipline

All sources are support for routing decisions only. No model, cache, RAG result, or generated artifact is treated as an authority for mutable game state; committed StateTx remains the truth source.

## Black Forest Labs pricing

Primary URL: https://bfl.ai/pricing

The live page confirms pay-as-you-go positioning and exposes a calculator. At access time, the visible calculator defaults to video at $0.17 per second; it also lists commercial open-weight licensing tiers for FLUX.2 klein and FLUX.2 dev. The page did not expose stable image-rate cells in its text extraction, so the final table will not cite a fixed BFL image price from this page. Image cost must be reserved from the provider quote/price endpoint at request time and retained with the model/version, dimensions, megapixels, and workflow configuration.

## Microsoft GraphRAG

Primary URL: https://microsoft.github.io/graphrag/

The documentation defines GraphRAG as a structured, hierarchical RAG approach. It constructs a graph from raw text, clusters communities, generates community summaries, and uses those structures as query-time context material. Therefore, it is suitable only for supporting evidence, scene recall, causal-link candidates, and lore flavor. It is not a transaction system and must not be a source of truth for mutable SynapticGM state.

## DeepSeek API pricing

Primary URL: https://api-docs.deepseek.com/quick_start/pricing/

The current docs specify DeepSeek V4 Flash and V4 Pro, both with 1M context, JSON output, tool calls, and cache-hit/cache-miss pricing. The docs report peak/off-peak price distinctions and state that product prices may vary. Consequently, the route table records the observed rates and a price-sheet revision date, not a contractual forward price.

## Fireworks serverless pricing

Primary URL: https://docs.fireworks.ai/serverless/pricing

The current docs state that serverless requests bill input, cached-input, and output tokens per 1M tokens, with batch inference at 50% of serverless prices. The published table includes a wide range of hosted open-weight and proprietary models. The page notes US-only endpoints have a 10% premium (except a named exception); the report therefore treats deployment geography and data residency as an allow-list decision, not an incidental model choice.

## Replicate pricing

Primary URL: https://replicate.com/pricing

Replicate states that usage is pay-as-you-go, with some models billed by hardware time and others by input/output. At access time, its public examples listed FLUX 1.1 Pro at $0.04/output image and FLUX Dev at $0.025/output image. These are provider-published examples at the named model route, not a quality equivalence claim or a permanent tariff.

## BFL API pricing documentation

Primary URL: https://docs.bfl.ai/quick_start/pricing

The primary API pricing documentation confirms credit-based pricing with 1 credit approximately $0.01 USD and describes image and batch pricing in the published pricing table. The source page is dynamic; before production, obtain the image-route price programmatically or from the live table and store it in the request quote. This report will use the verified credit mechanism and avoid unsupported static rates where live extraction is incomplete.
