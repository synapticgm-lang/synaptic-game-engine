# E6 — Launch / Trust / Legal-Shaped Checklist

**Important scope:** This is an operating checklist, not legal advice and not a determination of legal obligations. The company/entity, jurisdictions, target age, data flows, vendors/SDKs, advertising plan, payment flow, and public claims are not provided. Items marked **COUNSEL** require qualified legal review before a public commitment or launch decision. The FTC’s COPPA materials are included as an example of why children’s privacy analysis depends on audience, knowledge, collection, disclosure, consent, retention, and third parties—not merely a content filter. [1]

## Launch Readiness Board

| Area | Required launch artifact | Owner | Status from supplied Snapshot | Counsel flag | Done when |
|---|---|---|---|---|---|
| Product scope | Plain-language description: single-player AI GM; engines actually live; geographic/service scope. | Founder/Product | ENGINES LIVE field blank. | **COUNSEL** for public description/age language. | Landing page matches product behavior and current availability. |
| Claims substantiation | Claim-to-evidence register for “remembers,” “hears you,” “fair,” “safe,” “private,” “ad-free,” “unlimited,” and any age claim. | Founder/Product | UNVERIFIED. | **COUNSEL** for legal review of published claims. | Each claim links to reproducible test, clip, policy, or trace; claims are narrowed where evidence is absent. |
| Privacy notice | Data inventory, purposes, retention/deletion, processors, rights/contact, account/delete flow. | Founder/Ops | UNVERIFIED. | **COUNSEL**. | Notice accurately matches deployed data paths and vendor terms. |
| Save/canon data | Classification of save states, messages, StateTx, manifests, corrections, safety events, images, and exports. | Engineering | Ledger data implied by Snapshot. | **COUNSEL** for privacy/retention/rights. | Each field has purpose, access control, retention/deletion, export, and incident treatment. |
| Authentication | Google login data map; account-linking/deletion path; access recovery. | Engineering | Google noted but live status blank. | **COUNSEL** and security review. | Tested creation, logout, deletion, recovery, and minimal data collection. |
| Payment/entitlement | Stripe terms, billing descriptors, renewal/receipt/cancel/refund flows, server-side entitlement authority. | Founder/Engineering | Stripe foundation; live status unknown. | **COUNSEL** for terms/refund/promo. | Webhook idempotency, customer support script, and RT37/54/55 green. |
| Adult Free / ads | Exact ad provider, placements, targeting/data flows, content adjacency, frequency caps, age restrictions. | Founder/Ops | AppLixir only with written approval; Free adult web first. | **COUNSEL** before any ad/SDK launch. | Written approval, vendor DPA/terms review, consent/notice design, test ads off in Kid Mode. |
| Kid Mode | Product audience decision, age/knowledge handling, parental/guardian design if relevant, data/ad/retention restrictions, escalation protocol. | Founder/Safety | Kid filters claimed; no public gate confirmed. | **COUNSEL—blocking before child-directed positioning.** | Legal/product decision documented; child/teen/adult surfaces behave as designed; no Kid ads. |
| Content/safety | Policy, age/mode taxonomy, safe redirect templates, human escalation threshold, appeals/feedback path. | Safety/Product | Filters + kill switches claimed. | **COUNSEL** for policy/presentation. | RT43–RT46 pass; policy matches UI and support language. |
| Incident response | Kill-switch list, owner/on-call, alert thresholds, rollback, external communication templates, postmortem process. | Ops/Engineering | Ops kill switches claimed. | **COUNSEL** for material notification obligations. | RT60 drill performed; no image call/credit loss when disabled. |
| Accessibility | Keyboard, zoom/reflow, names, contrast, motion, error recovery test evidence. | Product/Engineering | UNVERIFIED. | Counsel optional; accessibility review recommended. | E2 acceptance checks pass on planned supported browsers. |
| IP/content | Original opening/vibe bank; user content/licensing/moderation policy; image-source/rights workflow. | Founder/Content | Original-only requirement stated. | **COUNSEL**. | No copyrighted title/character imitation in default content; takedown/contact process exists. |

## 1. Privacy and Player-Truth Data

SynapticGM’s continuity advantage creates a particular trust responsibility: the system stores statements that may feel more intimate than a generic game save because they include player corrections, relationships, choices, and potentially sensitive freeform text. Do not casually describe this as “just gameplay data.” Build a record of what is collected, why, who receives it, how long it persists, and how a player can inspect, delete, or export it.

| Data class | Product purpose | Minimum technical guardrail | Player-facing question to answer | Counsel question |
|---|---|---|---|---|
| Account identifiers | Login, recovery, entitlement. | Separate identity from campaign content; least-privilege access. | “What account data do you keep?” | What disclosures/rights apply by launch jurisdiction? |
| Campaign messages | Generate/continue scenes. | Encrypt in transit/at rest as appropriate; environment isolation; access logging. | “Who can read my game?” | Vendor/processor and training/use disclosures. |
| StateTx / revisions | Preserve fact truth and correction history. | Immutable/auditable revision semantics; deletion/tombstone strategy. | “Can I correct or delete something?” | Retention, deletion, legal hold, export implications. |
| Scene manifests / retrieval | Context selection and explainability. | Never grant truth authority; tenant filter; prompt-injection hardening. | “Why did it use that detail?” | Are automated decisions/records subject to particular disclosure duties? |
| Safety signals | Enforce mode/policy and investigate incidents. | Minimize payload; role-restricted access; retention limits. | “What happens when content is blocked?” | Sensitive-data and escalation rules. |
| CostEvents | Abuse prevention and cost control. | Pseudonymous IDs; avoid unnecessary content payload. | “How do you limit usage?” | Analytics/cookie/telemetry consent requirements. |
| Images | Memorable moments / optional generation. | Keep noncanonical; source/consent/moderation controls. | “Are images part of my save?” | Biometric/rights/deletion considerations if real people may be uploaded. |

## 2. Kid Mode: Public Gate, Not a Label

The FTC describes COPPA as applying in certain circumstances to child-directed commercial online services and general-audience services with actual knowledge, and lists obligations around notice, parental consent (subject to exceptions), security, retention, and unnecessary collection. The exact applicability of any regime to SynapticGM is **not determined here**. [1]

A public “Kid Mode” label should not ship until the following decision tree has counsel-approved answers.

| Decision | Product question | Why it cannot be hand-waved |
|---|---|---|
| Intended audience | Is this mode for children, teens, families, or adults who prefer lower-intensity content? | Audience affects product, marketing, age, and privacy analysis. |
| Age/knowledge gate | Will the service collect age, rely on a neutral screen, prohibit specified ages, or have parental account tools? | The answer changes data collection and error handling. |
| Ads | Are any ads, tracking SDKs, affiliate prompts, or behavioral signals present? | Kid ads are explicitly disallowed by business rule; third parties must be mapped. |
| Data minimization | What inputs are necessary to play? Can free text reveal personal information? | Freeform game content may inadvertently include personal data. |
| Content filters | What is blocked, transformed, or escalated? How are false positives handled? | A filter does not solve collection, retention, or notice. |
| History and exports | Does switching to Kid Mode filter prior adult history? Can a child export it? | Safety applies to rendered backlog as well as next-turn output. |
| Human escalation | Which reports require response, preservation, or external escalation? | Needs lawful, documented procedure. |

## 3. Ads and Commercial Prompts

The supplied business law is clear: adult web first; Mid/High no ads; Kid ads off; AppLixir only with written approval. The operational consequence is a hard configuration rule, not a marketing promise.

| Control | Required behavior | Release test |
|---|---|---|
| Mode gate | `kid_mode=true` makes ad provider calls, ad rendering, and ad-targeting events impossible. | Network inspection and configuration test prove zero calls. |
| Tier gate | Mid/High entitlement suppresses all ad slots and related tracking. | Entitlement downgrade/upgrade test at page reload and session resume. |
| Scene adjacency | No ad appears during correction, safety redirect, combat outcome, emotional beat, or after user taps a costly in-world action. | Screenshot/video regression tests. |
| Consent/data | Advertising and analytics configuration match actual notice/consent requirements by jurisdiction. | **COUNSEL** sign-off and vendor inventory. |
| AppLixir | No integration, SDK, or placeholder traffic until written approval is logged. | Configuration default is disabled; audit log retains approval reference. |

## 4. Refunds, Subscriptions, and Entitlements

Competitors use a range of free limits, subscriptions, credits, trials, and usage terms. [2] [3] [4] SynapticGM should not copy any competitor’s exact policy; its own policy must be understandable, testable, and accurate.

| Topic | Product requirement | Counsel / operations requirement |
|---|---|---|
| Price display | Show price, currency, cadence, included capacity, renewal behavior, and material limitations before purchase. | **COUNSEL** review for target markets and promotions. |
| Trials / starter turns | State whether conversion is automatic and how/when user is reminded. | Define support/refund exception process. |
| Cancellation | Make cancellation route easy to find; preserve/limit access according to written policy. | **COUNSEL** review; test Stripe/customer path. |
| Refunds | State refund eligibility, timing, who handles it, and where to ask. | **COUNSEL** sets policy; support uses a consistent decision log. |
| Credits/allowances | Explain expiry, reset, successful-vs-failed attempt handling, and what happens on provider outage. | Prevent deceptive forfeiture; test external event idempotency. |
| Entitlement truth | Server-side records decide capability; client display is a cache only. | Audit webhook errors/replay and customer-repair process. |

## 5. Substantiation Checklist for Marketing Claims

Do not use a category claim because it sounds differentiated. Use it only if the evidence field is filled and a named owner can reproduce it.

| Proposed claim | Minimum evidence before public use | Current audit status |
|---|---|---|
| “It remembers what matters.” | 100-turn trace with recalled facts, adverse retrieval case, and correction/reload clip. | **UNVERIFIED**. |
| “It hears you.” | Off-hook freeform action clips plus obligation-coverage test results. | **UNVERIFIED**. |
| “Fair consequences.” | Deterministic combat/check receipts reconciled to StateTx, plus human playtest comprehension. | **UNVERIFIED**. |
| “Your corrections stick.” | Correction → save → new session → recap evidence across engines. | **UNVERIFIED**. |
| “Kid-safe” / “for kids.” | Audience/privacy/safety/ad/parental analysis and counsel-approved policy. | **COUNSEL / UNVERIFIED**. |
| “No ads” | Tier/mode network assertions and product config tests. | **UNVERIFIED**. |
| “Unlimited” | Explicit service definition and budget/reasonable-use enforcement that match reality. | **COUNSEL / UNVERIFIED**. |
| “Private” | Data map, vendor use/training/retention disclosures, access controls, and counsel review. | **COUNSEL / UNVERIFIED**. |

## 6. Incident Kill-Switch Drills

| Kill switch | Trigger | Immediate safe behavior | Evidence to retain | Recovery criterion |
|---|---|---|---|---|
| Image generation | Provider outage, unsafe image issue, cost spike. | No provider call; text game continues; no allowance consumed. | Event IDs, user-facing state, provider logs. | RT60 pass; owner approves re-enable. |
| Voice/profile feature | Fact-mutation regression or unsafe style. | Fall back to Classic Guide; no state change. | Fixture diff and affected sessions. | Fact-hash regression green. |
| Model/provider route | Hallucination/safety/latency incident. | Route to approved fallback or pause generation with clear no-commit state. | Base revision, uncommitted draft status, errors. | Golden traces and incident review pass. |
| Retrieval | Poison/cross-tenant signal. | Disable retrieval; StateTx/canonical state still functions; warn internally. | Retrieval IDs, tenant check, shadow labels. | Tenant/poison tests pass. |
| Commerce/ads | Configuration/consent/SDK defect. | Disable placements/prompts; preserve gameplay and paid rights. | Config revision, entitlement state, traffic evidence. | Counsel/ops re-approval. |

## 7. Required Counsel Questions

1. What legal entity, governing law, and launch jurisdictions will be named in the service terms and privacy notice?
2. Is the product general audience, teen-oriented, child-directed, or age-gated, and what evidence/controls support that decision?
3. Which data in messages, StateTx, safety logs, images, analytics, and Google/Stripe integrations is personal/sensitive data under relevant law?
4. What retention, deletion, export, correction, and account-closure behavior is promised and technically feasible for immutable/auditable revisions?
5. What terms govern user-generated content, public sharing, AI inputs/outputs, moderation, takedowns, and alleged IP infringement?
6. May ads/analytics run on adult Free, under which consent/data/adjacency limits, and how is Kid Mode technically isolated?
7. What subscription, trial, cancellation, refund, credit/allowance, and promotional disclosures are required in each launch market?
8. Which security/incident response events trigger notification, user support, regulator contact, or vendor escalation?
9. Which claims are supportable now, and which must be modified to “designed to,” “helps,” or removed until tests exist?

## References

[1]: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions "FTC — Complying with COPPA: Frequently Asked Questions (accessed 2026-08-18)"
[2]: https://help.aidungeon.com/memberships-benefits "AI Dungeon — Memberships & Benefits (accessed 2026-08-18)"
[3]: https://fables.gg/pricing "Friends & Fables — Pricing (accessed 2026-08-18)"
[4]: https://www.questportal.com/pricing "Quest Portal — Pricing (accessed 2026-08-18)"

[Back to project index](../README.md)
