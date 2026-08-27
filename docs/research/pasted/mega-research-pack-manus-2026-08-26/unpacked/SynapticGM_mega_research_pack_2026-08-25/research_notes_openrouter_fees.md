# OpenRouter Fee Notes

**Retrieved:** 2026-08-25

| Topic | Official source | Verified fact | Cost-model treatment |
| --- | --- | --- | --- |
| Credit purchase / platform fee | https://openrouter.ai/docs/faq and https://openrouter.ai/pricing | Pay-as-you-go shows a 5.5% platform fee. FAQ states a 5.5% fee with a $0.80 minimum when purchasing credits and says underlying model-provider prices are passed through without markup. | Base cost includes `model token cost × 1.055`. At very low spend, the $0.80 minimum can dominate; this is disclosed rather than silently allocated. |
| BYOK allowance | Same sources | Pay-as-you-go includes $25,000 per month of list-price BYOK inference without a BYOK fee; usage above the allowance incurs 5% of normal OpenRouter model/provider cost. | Not used in the base case because the founder specified OpenRouter writer models, not a BYOK strategy. It is an optional lever, not assumed savings. |
| Failed or fallback attempts | Pricing FAQ heading confirms this is a billing issue, while the founder brief explicitly states failed turns refund the player cap but may still bill API. | Player-cap refund and provider cost are different concepts. | Apply a **SPECULATIVE** 5% billed-attempt overhead sensitivity; keep the exact rate as **INPUT REQUIRED** from production logs. |
| Taxes | Pricing page exposes a VAT/GST FAQ but static extraction did not reveal a substantive answer. | Tax treatment depends on account, jurisdiction, and invoice. | Exclude VAT/GST from the base inference envelope and flag it for the accountant/solicitor; do not assume tax is included. |

All model rates and fee terms are **PUBLICLY EVIDENCED** from official OpenRouter pages as of the retrieval date. The 5% billed-attempt overhead is **SPECULATIVE**, not a sourced OpenRouter failure rate.
