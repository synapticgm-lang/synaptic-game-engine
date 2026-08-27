# FX and Permissive Icon Licence Notes

**Retrieved:** 2026-08-25

| Topic | Primary source | Verified fact | Treatment |
| --- | --- | --- | --- |
| USD→GBP conversion | https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html | ECB’s 25 August 2026 information reference rates quote EUR 1 = USD 1.1662 and EUR 1 = GBP 0.85550. The reproducible cross-rate is GBP per USD = 0.85550 ÷ 1.1662 = 0.733703… . ECB discourages using reference rates for transaction execution. | **PUBLICLY EVIDENCED.** Use 0.733703 GBP/USD only for planning conversion, then apply a separate FX/processor contingency rather than pretending it is an executable rate. |
| Phosphor Icons | https://github.com/phosphor-icons/core/blob/main/LICENSE | Official repository licence is MIT, copyright 2023 Phosphor Icons; commercial use, modification, distribution, and sublicensing are permitted, conditioned on preserving the copyright and permission notice in copies or substantial portions. | **PUBLICLY EVIDENCED — commercial use YES, attribution/notice YES.** Existing Lucide is already shipped, so Phosphor is a redundant fallback rather than a migration recommendation. |

## Formula

`USD cost × (0.85550 GBP per EUR ÷ 1.1662 USD per EUR) = GBP planning cost`.

The exact unrounded cross-rate will be used in calculations; display values will be rounded only at the presentation layer.
