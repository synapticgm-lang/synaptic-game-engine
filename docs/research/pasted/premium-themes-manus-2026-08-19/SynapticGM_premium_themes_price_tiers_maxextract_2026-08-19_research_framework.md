# SynapticGM Premium Themes Research Framework

**Prepared by:** Manus AI  
**Access date baseline:** 2026-08-19  
**Scope:** SynapticGM cosmetics only. This framework preserves the supplied product law: cosmetics do not change dice, loot, stats, permits, quests, or narrative outcomes.

> **Research rule.** A **verified public mechanism** is a statement supported by a linked public source and access date. A **speculative transfer** is an original SynapticGM recommendation inferred from verified patterns. The final dossier will label the two separately.

## Deliverable inventory

| Part | File / artifact | Primary inputs | Validation rule |
|---|---|---|---|
| T1 | Premium Theme Constitution | Product law + public patterns | ≤3-page equivalent; operational definitions; mandatory cosmetic-only line |
| T2 | Price ladder matrix | Cosmetic, subscription, VTT, client storefront evidence | Five requested price tiers and shelf mapping |
| T3 | Surface coverage map | Supplied surface list + existing-hook constraints | Markdown and CSV; every named surface has change/retain/hook-or-gap/criterion |
| T4 | Competitive teardown scorecard | At least 12 public product or domain sources | Every row has public citation, price signal where public, steal/refuse patterns |
| T5 | Trope deep dives | Public visual/product patterns + original transfer analysis | All 14 requested clusters; premium/cheap/gap/recipe/checklist per cluster |
| T6 | Vampire Nocturne rescue brief | Product law + T5 comparison | Concrete, original P0 brief and acceptance tests |
| T7 | Tabletop sheet pattern library | Public VTT/sheet/storefront sources | Transfer patterns and explicit IP fence |
| T8 | Recognition & acceptance suite | Accessibility and usability sources + original protocols | Printable score CSV plus testing thresholds |
| T9 | Implementation backlog | Existing `cosmeticCatalog.ts`, `index.css`, `uiTheme.ts` constraint | P0/P1/P2; file, test ID, effort, dependency for every item |
| T10 | Hard-refuse anti-list | Product law + evidence | All supplied bans plus rationale |
| T11 | Original content / design banks | Catalog names and enums | Per-kit rules, 20 texture recipes, type and dice notes |
| T12 | Monetization honesty brief | Storefront/refund and consumer-protection public sources | Explicit non-legal framing and COUNSEL flags |
| T13 | Evaluation harness | Catalog keys, token enums, T8 | Valid JSON with gates for all 15 race/archetype kits and standalone themes where applicable |
| T14 | Unknowns / evidence request list | Limits of public research | Screenshots, build, prices, counsel, and operational data separated |

## Public-research source families

| Source family | Questions it can verify | Planned examples | SynapticGM use |
|---|---|---|---|
| Official game / platform storefronts and help centers | Published price, bundle scope, previews, item descriptions, policy language | Fortnite, Roblox, Discord, Roll20, Fantasy Grounds, Demiplane, Foundry marketplace | Price-signal, preview-fidelity, and shop-copy patterns |
| Official tabletop / VTT documentation | Sheet, theme, module, and UI-customisation mechanisms disclosed publicly | D&D Beyond help/marketing, Roll20, Fantasy Grounds, Foundry, Demiplane | Transferable sheet and chrome patterns only; no layout copying |
| Accessibility standards and guidance | Contrast, resize, non-colour indicators, motion preferences | WCAG 2.2, W3C technique pages, MDN | T8 thresholds and hard gates |
| Design-system and web platform guidance | Font loading, reduced motion, CSS-safe material treatment constraints | MDN, web.dev, CSS specs | Implementation-safe recipes and fallbacks |
| Consumer protection / app storefront terms | Misleading product presentation, refunds, cancellation / pricing disclosures | UK CMA, UK consumer guidance, platform policies | T12 transparency and COUNSEL flags; not legal advice |
| Independent industry commentary (secondary only) | Consumer reaction patterns such as recolor fatigue | Reputable journalism and developer postmortems, triangulated | Context only; never a claim of competitor internals |

## Research workstreams and confirmed parallel input list

| Workstream ID | Research remit | Required evidence classes | Planned outputs |
|---|---|---|---|
| R1 | Price ladder and cosmetic-value expectations | Storefronts, plans, official help; one secondary article only if needed | T1, T2, T12 inputs |
| R2 | Tabletop / VTT themes, sheets, packs, and previews | Official marketplace/help/product pages for ≥6 domains | T4, T7 inputs |
| R3 | Trope and material-language competitive patterns | Public product pages and screenshots described in prose for requested clusters | T4, T5, T6 inputs |
| R4 | Accessibility and UI-state resilience | WCAG/W3C/MDN official guidance | T8, T10, T11 inputs |
| R5 | Visual material and interaction implementation patterns | Browser and design guidance, original analysis | T3, T6, T9, T11 inputs |

## Boundaries and non-negotiables

| Boundary | Required treatment in final artifacts |
|---|---|
| Existing system only | Recommendations extend `SHOP_CATALOG`, `RACE_THEME_KITS`, `--sgm-*`, `data-sgm-texture`, `data-sgm-frame`, and kit auto-heal in `uiTheme.ts`; no parallel theme engine is proposed. |
| Content safety / IP | SynapticGM banks use only original trope-level language. Competitors may be identified solely as cited research sources. No protected art, crests, UI lockups, slogans, or franchise terms appear as player-facing recommendations. |
| Semantic state language | A theme may alter presentation but never hide, remap, or decorate into ambiguity the player correction, pinned canon, StateTx, evidence, or invention semantics. |
| Accessibility and Kid Mode | All recommendations retain high-contrast, readable defaults; decorative effects are subordinate to text, state, and motion preferences. |
| Research limits | No public research can prove the live build's exact CSS coverage, telemetry, refund rate, Stripe setup, TTS quality, or installed-font behavior. Those appear in T14 rather than as invented facts. |

## Citation format

Each research-backed Markdown file will use inline citations and a local references section in this form:

`[1]` followed by `[Title](https://example.org) — accessed 2026-08-19`.

Where an entry is based on SynapticGM's supplied brief rather than an external source, it will be marked **Supplied product law**. Where it is an original transfer, it will be marked **SPECULATIVE transfer**.
