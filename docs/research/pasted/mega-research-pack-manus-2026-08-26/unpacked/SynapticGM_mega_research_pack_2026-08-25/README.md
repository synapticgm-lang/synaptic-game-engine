# SynapticGM Mega Research Pack

**Prepared:** 2026-08-25  
**Author:** Manus AI  
**Purpose:** Cursor-ready research, prompt banks, trust copy, cost modeling, counsel questions, and screenshot-audit fuel for the already-shipped SynapticGM product.

> **Boundary:** This pack does **not** redesign the application, propose a second LLM critic, replace the shipped `GameState → snapshot → writer → regex/hard gates → private repair ledger → commit` path, or introduce canned genre cards. It provides production fuel for the existing product.

## 1. What Is Complete

| Workstream | Delivered | Count / scope |
| --- | --- | ---: |
| Licence-first assets | `asset_index.csv`, `intake_checklist.md`, `DO_NOT_USE.md`, `share_alike_counsel_risk.csv` | 31 strict commercial-use rows; one isolated share-alike risk record. |
| Theme prompt packs | `theme_prompts.csv` | 22 themes × 3 assets = 66 generator-ready rows. |
| Inventory icons | `item_icon_prompts.csv` | 40 transparent 128×128 icon briefs. |
| Memorable plates | `memorable_plate_style_guide.md` | Original ink-and-watercolour rules plus 20 scene templates. |
| Map chrome | `map_chrome_prompts.md` | 24 original prompts: parchment, topo grain, compass ornaments, and floor-plan fills. |
| Claim hardening | `claim_pattern_bank.csv`, `adversarial_almost_false.csv` | 12 protected claim types plus 40 regex near-misses. |
| Visible trust copy | `visible_moat_copy.csv` | 120 exact player-facing strings, including Kid variants and forbidden negative tests. |
| Cap copy | `player_facing_cap_copy.csv` | 33 honest Free-cap, refund, bonus, image, and optional-ad variants. |
| Opener training | `opener_pointer_examples.md` | 72 page-one GM examples across nine requested family shapes. |
| Skill growth | `skill_growth_patterns.md` | Three original engines, minimum state fields, UI affordances, guardrails, Kid rules, and 30 skill names. |
| Cost envelope | `free_cost_envelope.csv`, `cost_methodology.md`, `cost_levers.csv`, `hook_plus_8_sensitivity.csv`, `model_price_reference.csv` | 27 Free scenarios plus +8 sensitivity and 13 ranked levers. |
| Trust protection | `p0_trust_list.md` | P0 promises and incident response order. |
| Counsel packet | `counsel_outline.md`, `public_claim_register.csv` | Product-specific legal question list, 27-row data-class table, and 35 public claims. |
| Screenshot audit | `screenshot_audit_playbook.md`, `audit_tracker.csv` | 36 cases at both `1440×900` and `390×844` = 72 tracker rows. |
| Package integrity | `qa_report.md`, `file_manifest.csv`, `validate_pack.py` | End-to-end validation plus classified SHA-256 manifest for delivery files. |

## 2. Recommended Cursor Import Order

| Order | Files | Use |
| ---: | --- | --- |
| 1 | `research_manifest.md`, this README, `p0_trust_list.md` | Establish non-negotiables and evidence labels before implementation. |
| 2 | `DO_NOT_USE.md`, `intake_checklist.md`, `asset_index.csv`, `share_alike_counsel_risk.csv` | Build the asset intake gate before adding third-party files. |
| 3 | `claim_pattern_bank.csv`, `adversarial_almost_false.csv` | Extend only the already-shipped regex/hard-gate path; preserve near-miss prose. |
| 4 | `visible_moat_copy.csv`, `player_facing_cap_copy.csv` | Wire exact player-facing trust, repair, provenance, and cap copy. |
| 5 | `theme_prompts.csv`, `item_icon_prompts.csv`, `memorable_plate_style_guide.md`, `map_chrome_prompts.md` | Generate or commission original visual assets, then review outputs before shipping. |
| 6 | `opener_pointer_examples.md` | Train or prompt the existing writer; do not turn examples into player-facing genre cards. |
| 7 | `skill_growth_patterns.md` | Implement product shapes without replacing the current architecture. |
| 8 | `cost_methodology.md`, `free_cost_envelope.csv`, `cost_levers.csv`, `p0_trust_list.md` | Add telemetry, budgets, and cost controls without cutting trust guarantees. |
| 9 | `counsel_outline.md`, `public_claim_register.csv` | Resolve legal, privacy, child, consumer, tax, processor, and marketing-claim decisions. |
| 10 | `screenshot_audit_playbook.md`, `audit_tracker.csv` | Seed the staging environment and collect reproducible release evidence. |

## 3. Evidence Labels

| Label | Meaning |
| --- | --- |
| **EVIDENCED** | Supplied by the founder brief, already-shipped product facts, or directly verified primary material. |
| **PUBLICLY EVIDENCED** | Verified on an official current public source, with URL/date preserved. |
| **ORIGINAL SynapticGM** | Newly authored text or prompt material created for this pack, not copied from a named series, creator, studio, or world. |
| **SPECULATIVE** | Planning assumption or example that requires production measurement or founder decision. |
| **INPUT REQUIRED** | Cannot be concluded without the live product, contract, telemetry, configuration, or counsel/accountant input. |
| **FOUNDER-ONLY** | Comparative or risk material that must remain outside GM-ready and player-facing banks. |

## 4. Product Laws Preserved

| Law | Pack treatment |
| --- | --- |
| No licensed-series shortcuts in live text | Generation, opener, copy, and skill files were scanned for the named forbidden series and retired world vocabulary. |
| Original over derivative | Visual prompts use material, composition, atmosphere, and function—not named styles or franchises. |
| Kid Mode is public and strict | Adult rows are excluded or softened; ads never appear; media requires separate safe review. |
| Ads are optional overflow | Cap copy and cost levers preserve the base Free allowance and prohibit ads in Kid Mode or mid-action. |
| Memorable generation OFF | Cost, copy, trust, and audit files preserve default OFF and Free `0/week`. |
| Failed turns refund player cap | Cost model distinguishes player-cap fairness from provider cost; audit cases require before/after evidence. |
| Provenance is visible | Quest, relic, readable, deed, and skill-offer material records how state became true. |
| Share-alike is not default | Isolated in `share_alike_counsel_risk.csv`; counsel review required. |
| CC0/MIT are not “zero diligence” | Intake requires exact source, licence, retrieval date, provenance, notices, and non-copyright rights review. |
| “Remembers everything” is forbidden | `public_claim_register.csv` marks it `NO`. |

## 5. Asset Use

`asset_index.csv` is an index, not a bundle of third-party binaries. It prioritizes official pack pages, direct official downloads, licence names, provenance, and obligations. Kenney and ambientCG/Poly Haven rows were selected from official CC0 materials; Phosphor is an MIT fallback with notice obligations. Share-alike material stays outside the default list.[1] [2] [3] [4]

Before shipping any file, follow `intake_checklist.md`. Save the exact downloaded file, hash it, preserve the licence text and retrieval date, scan for embedded marks or executable content, and verify trademark, privacy/publicity, model-release, and provider terms separately.

## 6. Visual Generation

The prompt files are **instructions**, not accepted assets. Every generated output still needs review for accidental logos, readable signatures, copied characters, unsafe content, continuity mismatch, and provider-specific commercial terms.

| File | Output target |
| --- | --- |
| `theme_prompts.csv` | `ui_chrome`, `background`, and `texture` for each shipped theme. |
| `item_icon_prompts.csv` | Transparent inventory icons with readable silhouette at small size. |
| `memorable_plate_style_guide.md` | Occasional book plates grounded in the current snapshot. |
| `map_chrome_prompts.md` | Decorative material and ornament; never authoritative exits, labels, or measured terrain. |

## 7. Continuity and Copy

`claim_pattern_bank.csv` is implementation fuel for the current hard-gate path. It separates unsupported factual claims from vivid prose that must survive. `adversarial_almost_false.csv` supplies 40 sentences where naïve replacement would damage negation, quotation, uncertainty, memory, comparison, or metaphor.

`visible_moat_copy.csv` contains exact player-facing strings and a small set of `allowed=NO` negative fixtures. Filter on `allowed=YES` before importing a production bank. Kid and standard variants are explicitly marked.

## 8. Cost Model

The dated OpenRouter model prices, 5.5% credit-purchase fee, and ECB information reference-rate cross are documented in `cost_methodology.md`.[5] [6] [7] [8] [9]

The main 27-row envelope includes one opening call per MAU, a **SPECULATIVE** 5% billed-attempt overhead, three token scenarios, 100/1,000/10,000 Free MAU, and 20/40/80 player turns per MAU. The one-time New Game +8 allowance is modeled separately. VAT/GST, hosting, databases, observability, support, moderation, image generation, Klein calls, ads, and paid-tier inference are excluded.

> **Finance note:** These are planning estimates, not guaranteed financial advice. Replace token and failure assumptions with production telemetry and reconcile to invoices before spend decisions.

## 9. Counsel Packet

`counsel_outline.md` is a working solicitor question list, not legal advice. It covers audience/age, the Kid gate, retention/deletion, processors, VAT/refunds/subscriptions, user/generated content, moderation, public claims, and a detailed data-class table with lawful-basis and retention placeholders. Official UK sources are cited in that document.

`public_claim_register.csv` should gate every marketing statement. A row marked `NO` is prohibited; `CONDITIONAL` or `YES IF VERIFIED` still requires the named evidence, qualification, owner, and review trigger.

## 10. Screenshot Audit

No live screenshots were fabricated. Every master row in `audit_tracker.csv` is `NOT RUN`. Use the playbook against an immutable staging build with deterministic synthetic fixtures. Capture both required viewports, save exact filenames, link state/network evidence, and block release on unresolved P0 failures.

## 11. Supporting Research and Build Files

| Type | Files | Purpose |
| --- | --- | --- |
| Research notes | `research_notes_*.md`, `research_log_2026-08-25.md` | Primary-source findings and uncertainty trail. |
| Raw public metadata | `ambientcg_catalog.json`, `polyhaven_*.json`, `*.tsv` | Reproducibility for selected CC0 material candidates. |
| Reviewed source drafts | `source_drafts/*.json` | Portable inputs for the pack-authored deterministic builders. |
| Deterministic builders | `build_*.py`, `validate_pack.py` | Recreate generated CSVs from pack-relative sources and validate target counts and constraints. |
| Summaries | `cost_summary_base.csv` | Compact planning-base cost extract. |
| Delivery integrity | `qa_report.md`, `file_manifest.csv` | Final validation coverage and SHA-256 checksums for every listed file. |

The pack contains no downloaded third-party image binaries and no executable third-party artefacts. Builder scripts are pack-authored support files and should be code-reviewed before reuse.

## 12. Immediate Founder Actions

| Priority | Action | Output |
| ---: | --- | --- |
| P0 | Give counsel the outline, processor contracts/settings, territory list, and exact audience plan. | Scope memo, notices, terms, retention schedule, processor register. |
| P0 | Add production telemetry for tokens, exact model ID, retries, failures, cap refunds, and feature class. | Replace speculative cost assumptions. |
| P0 | Wire claim and copy banks through explicit filters for `allowed`, mode, and subtype. | No negative fixture or adult row reaches players. |
| P0 | Enforce ad SDK non-loading in Kid Mode and memorable generation OFF at network level. | Evidence beyond hidden UI. |
| P0 | Seed and run the 72-row screenshot tracker. | Current-build release evidence. |
| P1 | Download only selected assets through the intake checklist, preserve notices, and hash exact files. | Shippable asset folder with provenance. |
| P1 | Generate theme/icon/map/plate candidates, then review outputs for originality, safety, and continuity. | Approved static visual library. |

## References

[1]: https://kenney.nl/assets/ui-pack "Kenney — UI Pack"
[2]: https://docs.ambientcg.com/license/ "ambientCG — Licence"
[3]: https://polyhaven.com/license "Poly Haven — Licence"
[4]: https://github.com/phosphor-icons/core/blob/main/LICENSE "Phosphor Icons — MIT Licence"
[5]: https://openrouter.ai/deepseek/deepseek-v4-flash-0731 "OpenRouter — DeepSeek V4 Flash 0731"
[6]: https://openrouter.ai/anthropic/claude-haiku-4.5 "OpenRouter — Claude Haiku 4.5"
[7]: https://openrouter.ai/anthropic/claude-sonnet-4.6 "OpenRouter — Claude Sonnet 4.6"
[8]: https://openrouter.ai/docs/faq "OpenRouter — FAQ pricing and fees"
[9]: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html "ECB — Euro foreign exchange reference rates"
