# Direct Source Notes 03 — Cost-Service Benchmarks

**Access date:** 2026-08-18 (GMT+1)

## Publicly Evidenced Facts

First-party API pricing pages show that inference costs vary by model, input, cached input, output, processing mode, and sometimes region. OpenAI’s public pricing distinguishes standard, batch, Flex, and faster processing, and separately lists text, image, tool, storage, and container cost structures. Anthropic’s public pricing and caching documents distinguish base input, cache writes, cache reads, output, region, and batch modifiers. [1] [2] [3]

Both vendors’ public material supports a design conclusion, not a SynapticGM price conclusion: a long-running game must measure **actual per-turn usage shape**, including input/output tokens, cache behavior, retries, images, tool calls, latency, and failed/canceled work. A published price table cannot substitute for a product CostEvent ledger because the workload mix, model selection, cache hit rate, provider contract, and user behavior are unknown.

## Audit-Safe Cost Principles

| Principle | Evidence basis | SynapticGM use |
|---|---|---|
| Separate costs by operation class. | Public price pages distinguish text, image, search/tool, and compute categories. | Capture narrator, adjudicator, summary, embedding/retrieval, image, moderation, retry, and storage independently. |
| Model cost is input/output/caching sensitive. | Both providers publish differentiated token/caching rates. | Track `input_tokens`, `cached_input_tokens`, `cache_write_tokens`, `output_tokens`, and effective model/version per generated result. |
| Caching is an optimization, not truth. | Prompt caching reuses a prompt prefix; it does not adjudicate game fact. | Cache stable policy/voice/engine text only; never cache a stale state as canonical truth. |
| Free access needs hard guardrails. | Competitors use turns, credits, worlds, context, or feature caps. | Apply clear action-class limits and feedback, not mid-action bait-and-switch. |

## Explicit Non-Conclusion

No SynapticGM provider, contract discount, prompt length, model mix, cache hit rate, image setting, hosting cost, payment fee, or observed usage cohort was supplied. Hence this audit does **not** estimate a real dollar cost per SynapticGM turn or recommend a tier price. The E5 model intentionally uses editable inputs and break-even formulas.

## Sources

[1]: https://developers.openai.com/api/docs/pricing "OpenAI Developer Documentation — Pricing (accessed 2026-08-18)"
[2]: https://openai.com/api/pricing/ "OpenAI — API Pricing (accessed 2026-08-18)"
[3]: https://docs.anthropic.com/en/docs/about-claude/pricing "Anthropic — Pricing (accessed 2026-08-18)"
[4]: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching "Anthropic — Prompt caching (accessed 2026-08-18)"
