# Browser-Verified Research Findings

**Access date:** 2026-08-19  
**Method:** Direct review of public, official pages. This log records only observations visible on the cited source pages.

| ID | Verified public observation | Dossier implication | Source |
|---|---|---|---|
| BV-01 | Epic labels purchases **self-refundable**, **refundable**, or **non-refundable**, and distinguishes the self-service route from player support. | SynapticGM may adopt an explicit purchase-status label and route; this is a **SPECULATIVE transfer**, not a claim about SynapticGM’s legal policy. | [Epic Games Store Refund Policy](https://legal.epicgames.com/store/refund-policy) — accessed 2026-08-19 |
| BV-02 | The policy states that subscriptions, in-app purchases, in-game items, consumable digital items, and virtual currency are generally non-refundable, subject to applicable law. It also describes 14-day/under-two-hour conditions for eligible PC/Mac purchases and a 2-hour mobile window. | Theme cards must not make a refund promise. They should instead show an accurate policy link, permanence/subscription status, and the product-specific purchase terms. **COUNSEL / payment-owner review required.** | [Epic Games Store Refund Policy](https://legal.epicgames.com/store/refund-policy) — accessed 2026-08-19 |
| BV-03 | W3C’s Contrast (Minimum) criterion requires **at least 4.5:1** contrast for normal text and images of text, with **at least 3:1** for large text. It says these are threshold values and must not be rounded. | T8 gates use 4.5:1 normal text and 3:1 large text as minimum acceptance checks, subject to the full criterion’s scope and exceptions. | [W3C WCAG 2.2 Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) — accessed 2026-08-19 |
| BV-04 | The same W3C page identifies approximately 18.5px regular or 24px as the CSS-pixel equivalents of 14pt and 18pt large text, respectively. | The QA sheet will require a declared text-size class before applying the 3:1 exception; decorative titles do not automatically qualify. | [W3C WCAG 2.2 Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) — accessed 2026-08-19 |

> **Boundary.** These observations validate transparency and accessibility patterns only. They do not establish a legal policy, market price, platform integration, or the current state of the SynapticGM build.

## References

[1]: https://legal.epicgames.com/store/refund-policy
[2]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum

| BV-05 | A public character-sheet customization page documents independently selectable portrait, frame, backdrop, theme, and digital dice; it also notes that a selected backdrop is not shown in mobile browsers while it is visible on desktop. | Treat kit components as independently testable cosmetic layers. A mobile surface must either render the same material treatment or disclose/fall back honestly; an impressive desktop-only preview is a fidelity failure. **SPECULATIVE transfer.** | [Public character-sheet customization article](https://www.dndbeyond.com/posts/1003-how-to-customize-your-character-sheet-on-d-d) — accessed 2026-08-19 |
| BV-06 | MDN documents that `background-image` supports one or more background images and that screen readers do not announce a background image; it also calls for sufficient text-to-background contrast. | CSS texture layers can create material but must never carry essential state or labels. Place the same information in semantic text/control states and retain a contrast-safe base color. **SPECULATIVE transfer.** | [MDN: `background-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image) — accessed 2026-08-19 |

[3]: https://www.dndbeyond.com/posts/1003-how-to-customize-your-character-sheet-on-d-d
[4]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image
