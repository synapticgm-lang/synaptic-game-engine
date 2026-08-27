# OpenRouter Pricing Research Notes

**Lookup date:** 2026-08-25  
**Currency shown by source:** USD per one million tokens.

| Tier | Exact model identifier | Official page | Standard listed input | Standard listed output | Cache read | Context | Evidence status |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Free-writer model specified by founder | `deepseek/deepseek-v4-flash-0731` | https://openrouter.ai/deepseek/deepseek-v4-flash-0731 | $0.035/M | $0.10/M | Provider table begins at $0.008/M; routing-dependent | 1M | **PUBLICLY EVIDENCED.** Page card observed on 2026-08-25. This is not a zero-price endpoint; the product's £0 player tier is a retail decision, not a provider-price claim. |
| Mid writer | `anthropic/claude-haiku-4.5` | https://openrouter.ai/anthropic/claude-haiku-4.5 | $1.00/M | $5.00/M | $0.10/M for standard listed providers | 200K | **PUBLICLY EVIDENCED.** Page card and provider rows observed on 2026-08-25. |

## Important Basis Distinction

OpenRouter displays both a top-level in/out price card and provider-specific tables. The cost envelope will use the **standard listed top-level input/output prices**, not volatile weighted averages, promotional discounts, or batch variants. Provider routing, cache-hit rates, taxes, currency conversion, tool/image calls, retries, and failed requests can change realized spend; these are separate sensitivities rather than silently embedded in the base case.
