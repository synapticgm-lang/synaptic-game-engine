# SynapticGM Counsel Outline

**Draft — for qualified solicitor and tax adviser review before reliance.**  
**Prepared:** 2026-08-25  
**Product context:** Live commercial hosted AI text RPG; founder-specified OpenRouter writers, Supabase, Stripe, Google, and a possible future ad SDK.

> **Legal disclaimer:** I’m an AI, not a lawyer. This is a working issue list and data-mapping draft, not formal legal advice. A qualified solicitor should confirm scope, lawful bases, contract terms, notices, consumer rights, and launch territories.

## 1. Decisions Counsel Should Resolve First

| Priority | Decision | Why it blocks downstream work | Evidence to bring |
| ---: | --- | --- | --- |
| 1 | Identify the contracting entity, establishment, launch territories, supplier of record, and governing-law position. | Determines privacy, consumer, tax, age, advertising, and dispute obligations. | Incorporation record; trading names; domains; app-store or marketplace plans; target-country list. |
| 2 | Decide the intended and likely audience, including whether children are likely to access the service. | The ICO says the Children’s Code applies to information society services likely to be accessed by children and explicitly includes online games.[1] | Audience research; marketing plan; art/copy; age analytics if lawful; Kid Mode design; app-store ratings. |
| 3 | Confirm the service model: private single-player only, or any sharing, galleries, comments, multiplayer, direct messages, matchmaking, or livestreaming. | Ofcom identifies user-to-user and connected gaming features as potential Online Safety Act scope triggers.[3] | Current feature inventory; twelve-month roadmap; sharing/export mock-ups; moderation flows. |
| 4 | Approve the data-flow map and retention schedule by purpose. | Narrative text can contain identifiers, special-category data, or child data even when the product does not ask for it. | Database schema; logging config; backups; provider settings; support tooling; analytics events. |
| 5 | Approve paid-tier terms, renewal, cancellation, refund, price display, and VAT treatment. | £14.99/£29.99 must be legally and operationally coherent across territories, taxes, and subscription law. | Checkout; Stripe configuration; invoices; cancellation path; refund policy; price displays. |
| 6 | Approve public claims and substantiation files. | CAP rules require evidence for objective claims and prohibit misleading omissions and capability exaggeration.[5] | Claim register; QA results; screenshots; incident metrics; cap configuration; deletion tests. |

## 2. Audience, Age, and the Kid Mode Gate

The Kid Mode rule is a public safety promise, but it does not itself answer whether the wider service is likely to be accessed by children. The ICO describes most for-profit online services—including online games—as information society services and says likely child access can bring the Children’s Code into scope.[1]

| Question for counsel | Founder/product evidence required | Desired written conclusion |
| --- | --- | --- |
| Is SynapticGM “likely to be accessed by children” in the UK, regardless of stated target audience? | Marketing channels, visual language, themes, onboarding, app-store category, actual audience evidence. | Scope conclusion and review cadence. |
| What age bands matter for privacy notices, consent, contracts, purchases, and content design in each launch territory? | Territory list and proposed minimum age. | Country/age matrix. |
| Can standard mode and Kid Mode lawfully rely on a self-declared age, or is stronger age assurance proportionate? | Data risks, content risks, purchase flows, sharing features, false-declaration risk. | Approved age-assurance method and fallback treatment. |
| If reliable age is unknown, should high-privacy defaults and Kid-safe restrictions apply to all users? | Current default settings and content gates. | Default policy and exception test. |
| Is parental consent or a parent/guardian account required for any feature or territory? | Account, purchase, profiling, email, analytics, and sharing flows. | Consent and verification procedure. |
| Does the service use nudges that encourage children to disclose more data, play longer, upgrade, watch ads, or generate media? | Full onboarding, cap, upgrade, streak, notification, and ad copy. | Prohibited and permitted design-pattern list. |
| Does optional ad overflow create profiling, identifier, or child-directed advertising risk? | Proposed SDK and integration design. | Written “no Kid Mode SDK load/call” requirement and adult consent rules. |
| What child-friendly privacy and safety explanations must be shown, and at what reading level? | Draft notices and in-product copy. | Approved layered notice set. |
| Is a DPIA required before launch, and must it cover model routing, generated content, age assurance, and optional ads? | Data-flow map, risk register, processors, safety design. | DPIA decision and scope. |

The ICO’s child-specific minimisation standard says to collect and retain only what is needed for the element a child actively and knowingly uses, and to give separate choices over optional elements.[2] Counsel should convert that principle into concrete settings for narrative history, personalization, analytics, images, support, and advertising.

## 3. Retention, Deletion, Export, and Incident Evidence

| Question for counsel | Product decision needed |
| --- | --- |
| Which data is necessary to deliver the live story, and which data exists only for optional personalization, analytics, improvement, safety, billing, or dispute purposes? | Split processing purposes rather than using one broad “service improvement” purpose. |
| What is the lawful basis for each purpose and age band? | Populate the placeholder column in the data-class table. |
| How long may raw player prompts and raw writer completions be retained, if at all? | Prefer structured state and minimal event evidence where the full prose is unnecessary. |
| Is the private repair ledger personal data, and how long is it needed for correction, safety, support, and claim substantiation? | Separate live correction evidence from permanent player history. |
| Which logs are strictly necessary for security and abuse prevention, and which are convenience analytics? | Disable or shorten nonessential logs. |
| How should deletion propagate through primary storage, search indexes, caches, observability, support tools, processors, and backups? | Produce a timed deletion runbook and test evidence. |
| What data may be retained after account deletion for tax, payment, fraud, legal claims, safety incidents, or regulator duties? | Create narrow legal-hold and statutory-retention exceptions. |
| What export format must be provided, and how will narrative state, inventory, choices, and media be presented? | Create a machine-readable and understandable export. |
| How should free anonymous sessions be linked for access/deletion rights without collecting unnecessary identity? | Decide session token, account upgrade, and verification design. |
| What breach notification, processor-notification, and player communication clocks apply? | Align incident plan to contracts and law. |

## 4. Processor and Recipient Diligence

The provider name alone is insufficient. Counsel needs the exact product, contracted entity, terms version, settings, region, subprocessors, data categories, and role for every flow.

| Provider / recipient | Known or founder-supplied role | Questions to resolve | Current evidence status |
| --- | --- | --- | --- |
| **Supabase** | Authentication, database, storage, or backend are plausible; exact use is **INPUT REQUIRED**. | Which entity and DPA version apply? Which region is selected? What enters logs/backups/support? What is the deletion and export path? Are subprocessor notices enabled? Do raw prompts/completions leave the selected region? | Official DPA reviewed. It describes processor/service-provider treatment, subprocessor notices, rights assistance, security, incident terms, deletion/return, and transfer mechanisms.[7] Product mapping is missing. |
| **Stripe** | Payments, subscriptions, fraud, tax, receipts, or identity may be used; exact products are **INPUT REQUIRED**. | For each Stripe product, when is Stripe processor, controller, or independent recipient? Which identifiers and fraud signals are collected? How are minors handled? What retention and transfer terms apply? Who is merchant/supplier of record? | Official DPA reviewed; it describes both processor and controller roles and broad payment/fraud/compliance data categories.[8] Account mapping is missing. |
| **OpenRouter** | Routes Free/Mid/High writer calls. | Obtain operative terms, privacy notice, DPA if available, data-retention/logging settings, provider recipients, zero-data-retention options, training terms, transfers, incident commitments, deletion route, and prohibited-data rules. Decide whether sensitive or child narrative data may be sent. | Pricing/model pages are verified; public privacy extraction did not yield usable contract text. **INPUT REQUIRED.** |
| **Underlying model providers via OpenRouter** | May receive prompts and return completions depending on selected route. | Is the provider fixed or variable? What are each provider’s data terms and geography? Can routing enforce required policies? Is failover allowed to a provider with different terms? | **INPUT REQUIRED** route and provider-policy evidence. |
| **Google** | Product unspecified: cloud, analytics, email, identity, ads, or another service. | Identify exact Google product and account. For each, determine role, region, log retention, ad/personalization use, support access, deletion, subprocessors, transfer terms, and child treatment. | General Google Cloud DPA reviewed; it cannot substitute for exact product mapping.[9] |
| **Optional ad SDK** | Standard-mode overflow only; never Kid and never mid-action by founder policy. | Select vendor only after child, consent, profiling, identifier, cross-context advertising, geolocation, sharing, retention, transfer, and subprocessor review. Can the app prove the SDK never loads or calls in Kid Mode? | No vendor selected. **INPUT REQUIRED before any integration.** |
| **Klein / image-generation provider** | Founder says icon calls may still bill; exact provider/data path is **INPUT REQUIRED**. | Are prompts, player data, generated images, safety flags, and metadata retained or used for training? What licence and commercial-output terms apply? Is the call design-time only or live? | **INPUT REQUIRED.** |
| **Hosting, monitoring, support, email, analytics, CDN, backups** | Not fully named. | Complete the vendor inventory and attach terms, DPA, subprocessors, regions, retention, security, and deletion evidence. | **INPUT REQUIRED.** |

### Processor Contract Packet to Assemble

For each provider, counsel should receive the accepted terms and DPA, privacy notice, security summary, subprocessor list, transfer mechanism, data-region settings, retention/deletion documentation, incident SLA, audit evidence, account entity, product configuration screenshots, and a one-page data-flow diagram. Do not rely on a generic vendor marketing page where the account is governed by a different product agreement.

## 5. Payments, Refunds, Subscriptions, and VAT

HMRC says digital services supplied to UK consumers are liable to UK VAT and that cross-border place of supply generally follows where the consumer usually lives.[4] The government’s 2026 subscription-regime response describes initial and renewal cooling-off periods and proportionate refund treatment for certain digital-content renewals.[6] Counsel and the accountant must determine what is in force on the actual launch and renewal dates.

| Question | Required answer before paid launch |
| --- | --- |
| Are £14.99 and £29.99 VAT-inclusive consumer prices in every displayed context? | Approved price-display rule by territory and channel. |
| Is SynapticGM or a marketplace the supplier/merchant of record? | Contract and tax responsibility matrix. |
| Which countries are served, and what VAT/GST/sales-tax registrations or marketplace rules apply? | Territory tax matrix. |
| What evidence of consumer location is necessary and proportionate? | Approved evidence hierarchy and retention period. |
| Is the paid tier a recurring subscription, fixed term, prepaid credit, or another contract? | Clear legal characterization matched to checkout copy. |
| When does access begin, and does a consumer request immediate digital performance? | Approved consent/waiver wording where legally permitted. |
| What initial, renewal, trial, reminder, cancellation, and refund rights apply on each date? | Calendar and operational runbook. |
| Must cancellation be available through the same channel and with comparable ease as sign-up? | Approved UX requirement. |
| How are failed turns, outages, degraded service, mistaken charges, and model unavailability handled? | Refund/service-credit policy tied to evidence. |
| What happens to saved adventures after cancellation, chargeback, refund, or failed renewal? | Retention, export, grace-period, and deletion rule. |
| Are caps, image allowances, models, and one-time bonuses material terms that must appear before purchase? | Approved checkout disclosure. |
| What receipts, invoices, transaction records, and tax records must be retained? | Accountant-approved retention schedule. |

## 6. User-Generated Content, Generated Content, and Moderation

| Product question | Counsel/moderation question |
| --- | --- |
| Are player prompts private and visible only to the player and processors? | Confirm whether the current service is provider-published/private interaction rather than user-to-user content for Online Safety Act purposes. |
| Can players publish, share, link, export publicly, comment, follow, direct-message, collaborate, match, or livestream? | Determine whether any feature creates a regulated user-to-user surface, and trigger a legal review before launch. |
| Can shared screenshots or exports contain third-party personal data, harassment, illegal material, or infringing content? | Define reporting, removal, evidence preservation, appeals, repeat-abuse, and law-enforcement procedures. |
| Does the model generate illegal or harmful content in response to private prompts? | Determine applicable safety, consumer, negligence, contractual, and product-risk duties even if Online Safety Act user-to-user scope is absent. |
| Are there sexual, self-harm, extremist, hate, fraud, exploitation, or child-safety classifiers or escalation routes? | Approve a risk-based moderation policy and test coverage for standard and Kid modes. |
| Are prompts used to improve or evaluate models? | Confirm lawful basis, disclosure, opt-out/consent, processor terms, and child-data treatment. |
| Does the product allow real-person roleplay, public-figure likenesses, or defamatory allegations? | Create restrictions, complaint handling, and rapid-removal procedures. |

Ofcom’s gaming guidance says connected features such as matchmaking and livestreaming can bring online games into scope and distinguishes user-generated content from provider-published game content.[3] Counsel should document the current private-service conclusion and create a mandatory re-review gate before any social feature ships.

## 7. Marketing, Memory, Continuity, and Safety Claims

The CAP Code says marketing must not materially mislead, omit material information, or exaggerate capability, and marketers should hold documentary substantiation before publishing objective claims.[5]

| Claim family | Questions for counsel and marketing | Evidence needed |
| --- | --- | --- |
| “Remembers your choices” | What time horizon, game scope, account condition, model limit, and failure condition must be stated? | Snapshot tests; restore tests; retention design; incident rate; scope qualifier. |
| “Never loses your place” | Is any absolute wording supportable through outages, cancellation, deletion, corruption, provider failures, or free anonymous sessions? | Backup/restore evidence; RPO/RTO; persistence tests; exclusions. |
| “Continuity-checked” | Does the phrase imply human review or broader accuracy than the shipped hard gates provide? | Claim-pattern coverage; QA corpus; false-positive/negative results. |
| “Safe” or “Kid-safe” | Is the claim too absolute? Which age, mode, content, ads, data, and supervision limits must be disclosed? | Safety policy; red-team results; age gate; ad-SDK proof; moderation metrics. |
| “Private” | Are prompts logged by SynapticGM, OpenRouter, underlying providers, support, analytics, or model training? | Complete data-flow map and contracts. |
| “Free” | Are ads, payment details, data exchange, or paid overflow conditions material? | Cap terms; ad design; no-charge proof; price disclosures. |
| Tier model names | May the product name exact third-party models, and what happens when providers deprecate or change them? | Provider terms; trademark review; change policy. |
| “Original” | What process supports non-infringement and avoids copying player-supplied prompts? | Prompt policy; asset provenance; similarity review; complaint process. |

The phrase **“remembers everything” should remain `NO`** unless counsel and evidence owners approve a tightly defined, non-absolute replacement. No qualification should contradict a sweeping headline.

## 8. Asset, Prompt, and Generated-Output Rights

| Question | Why it matters |
| --- | --- |
| Are CC0 assets independently verified at the exact source/version, with URL, licence page, retrieval date, file hash, and no separate trademark/privacy issue? | CC0 status does not answer provenance, embedded marks, model releases, or site-specific terms. |
| Are MIT assets shipped with the required licence/notice text? | Permissive does not mean notice-free. |
| Are share-alike assets excluded by default and separately approved? | Avoid accidental source/distribution obligations. |
| Do AI image and text providers grant commercial-output rights and disclaim uniqueness? | Provider terms can change; generated output may resemble third-party material. |
| Does the product prohibit prompts that ask for a named creator, studio, franchise, living person, logo, or copied character? | Reduces intentional imitation and trademark/likeness risk. |
| What process handles infringement notices, disputed similarity, or a rights-holder complaint? | Commercial release needs a documented intake, takedown, evidence, and repeat-issue process. |
| Can players upload copyrighted text, characters, or images, and who bears what responsibility under the terms? | User input can create separate rights and moderation issues. |

## 9. Terms, Policies, and Operational Documents Counsel Should Produce or Review

| Document | Minimum product-specific content |
| --- | --- |
| Consumer Terms | Eligibility, account, acceptable use, generated-content limitations, paid tiers, caps, models, renewals, cancellation, refunds, availability, suspension, IP, user content, complaints, liability, governing law. |
| Privacy Notice | Every data class and purpose, lawful basis, recipients/processors, transfers, retention, rights, children, automated processing, support, safety, payments, ads, contact details. |
| Kid/Child Notice | Short, age-appropriate explanation of data, choices, safety, purchases, ads prohibition, deletion/help, and parent/guardian role. |
| Cookie/SDK Notice | Essential vs optional storage/access, analytics, advertising, consent, settings, and region-specific treatment. |
| Acceptable Use / Safety Policy | Illegal content, exploitation, harassment, hate, self-harm, sexual content, real persons, fraud, privacy, circumvention, consequences, reporting. |
| Subscription and Refund Policy | Exact plan, price, tax display, allowance, renewals, reminders, cancellation, cooling-off, refunds, outages, tier changes, saved-data treatment. |
| Moderation and Incident Runbook | Detection, report intake, triage, escalation, evidence retention, law enforcement, child safety, appeals, communication, post-incident review. |
| DPIA and Legitimate-Interests Assessments | Model routing, narrative data, children, safety, analytics, fraud, ads, age assurance, international transfers. |
| Processor Register | Exact entity/product, purpose, data, role, region, terms/DPA version, subprocessors, transfer, retention, deletion, incident contact, review date. |
| Claim Substantiation Register | Exact claim, surface, owner, evidence, qualifier, exclusions, approval, date, expiry, incident trigger. |

## 10. Data-Class Working Table

All retention periods and lawful bases below are intentionally placeholders until counsel approves them. “Potential sensitivity” reflects what users could type, not what the product should solicit.

| Data class | Examples | Purpose candidate | Potential sensitivity / child concern | Likely recipient or processor | Lawful basis placeholder | Retention placeholder | Deletion / rights placeholder |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Account identity | Email, user ID, login provider ID | Account access and recovery | Direct identifier; child account risk | Supabase/Auth provider; email provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Self-service delete plus verified rights workflow. |
| Age/eligibility signal | Birth year, age band, adult/Kid selection, parental status | Apply correct experience and legal rules | High child-safety significance; avoid unnecessary exact DOB | App/backend; age-assurance provider if used | `INPUT REQUIRED` | `INPUT REQUIRED` | Correctability; minimised proof; no reuse for ads. |
| Authentication/security | Password hash, MFA state, session token, login IP, device signal | Secure accounts and prevent abuse | Security data; IP/device can be personal data | Supabase; security tooling | `INPUT REQUIRED` | `INPUT REQUIRED` | Revoke sessions; security-log exception documented. |
| Player biography | Name, pronouns, appearance, backstory, preferences | Character continuity | May reveal real identity, health, religion, sexuality, or child data | Supabase; OpenRouter; underlying model provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Field-level edit/delete; warn against real sensitive data if appropriate. |
| Raw player prompt | Free-text action or story input | Generate next turn | Can contain any personal/special-category/illegal data | OpenRouter; underlying model provider; app logs if enabled | `INPUT REQUIRED` | `INPUT REQUIRED — consider shortest feasible` | Delete from live store, logs, processors, and backups per approved SLA. |
| Raw model completion | Generated GM prose | Deliver story and diagnose faults | May reproduce prompt data or unsafe content | OpenRouter; underlying provider; Supabase/logging | `INPUT REQUIRED` | `INPUT REQUIRED` | Player deletion; safety/legal-hold exception narrowly documented. |
| Structured GameState | Location, people, inventory, quests, skills, time, weather | Continuity and restore | Can embed player-chosen identifiers and sensitive narrative facts | Supabase; OpenRouter for each turn | `INPUT REQUIRED` | `INPUT REQUIRED` | Exportable and deletable by game/account. |
| Snapshot input | Pre-turn factual state sent to writer | Ground the next turn | Derived personal data if state contains user facts | OpenRouter; underlying provider | `INPUT REQUIRED` | `INPUT REQUIRED — transient preferred if feasible` | Confirm provider retention and deletion route. |
| Repair ledger | Detected mismatch, correction reason, before/after fact references | Narrow correction, QA, dispute evidence | Could expose narrative content and safety flags | Supabase; support/QA staff | `INPUT REQUIRED` | `INPUT REQUIRED` | Separate player-visible explanation from private technical evidence. |
| Turn/cap ledger | Turn ID, success/failure, refunded cap, daily count, one-time bonus | Allowance fairness and billing operations | Behavioural record; child play-pattern concern | Supabase; analytics if used | `INPUT REQUIRED` | `INPUT REQUIRED` | Correct count; delete/account-link policy; retain minimal dispute evidence. |
| Model telemetry | Model ID, token counts, latency, provider cost, retries, error codes | Cost/reliability operations | Usually pseudonymous; can become personal if joined to user/game | OpenRouter; observability provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Prefer event IDs over raw text; separate from marketing profiles. |
| Safety/moderation record | Classifier result, report, blocked output, escalation, reviewer note | Protect users and meet legal duties | Highly sensitive; may concern illegal content or children | Moderation provider; trained staff; legal authorities where required | `INPUT REQUIRED` | `INPUT REQUIRED by category` | Restricted access; appeal/correction; legal-hold and deletion rules. |
| Support ticket | Email, account details, narrative excerpt, screenshots | Resolve complaints and rights requests | May contain any volunteered sensitive data | Support platform; staff | `INPUT REQUIRED` | `INPUT REQUIRED` | Redaction, attachment deletion, verified rights process. |
| Payment/customer data | Stripe customer ID, billing email, payment status, charge/refund | Sell paid tiers and manage fraud/refunds | Financial and identity data; minor purchase risk | Stripe; banks/payment methods; tax tools | `INPUT REQUIRED` | `INPUT REQUIRED — statutory/contractual` | Stripe/customer portal plus SynapticGM record handling; legal exceptions. |
| Tax/location evidence | Billing country, IP-country, bank country, VAT ID, tax status | Place of supply and tax compliance | Location/financial data; collect no more than required | Stripe/Stripe Tax; accountant; tax authority | `INPUT REQUIRED` | `INPUT REQUIRED by tax advice` | Statutory retention may survive account deletion; disclose clearly. |
| Subscription events | Plan, price, trial, renewal, reminder, cancellation, refund | Consumer contract and access control | Purchase history; child eligibility | Stripe; Supabase; email provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Export/access; correct status; statutory retention exception. |
| Transactional communications | Verification, receipt, reset, renewal, safety notice | Service delivery and legal notices | Contact data; child readability concern | Email/SMS provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Unsubscribe only where appropriate; retain mandatory notice evidence narrowly. |
| Analytics | Page/screen events, funnels, feature use, device/browser | Product measurement | Tracking/profiling; heightened child concern | Google or other analytics provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Consent/settings by territory; Kid Mode default off unless approved. |
| Ad/overflow data | Ad ID, consent, view completion, reward, SDK device data | Optional standard-mode extra turns | High child/profiling/cross-context risk | `INPUT REQUIRED ad SDK` | `INPUT REQUIRED` | `INPUT REQUIRED` | SDK never loads/calls in Kid Mode; delete/opt-out flow. |
| Generated memorable image | Prompt, image, seed, safety metadata, generation ID | Optional visual moment | May encode likenesses, sensitive narrative, or unsafe imagery | Image provider; storage/CDN | `INPUT REQUIRED` | `INPUT REQUIRED` | Player delete; provider deletion; no automatic generation. |
| Design-time generated icon | Prompt, output, provider metadata | Produce shipped static asset | Lower player-data risk if strictly design-time | Klein/image provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Keep provenance and accepted asset; delete rejected outputs per policy. |
| Uploaded content, if any | Image, text, document, avatar | Optional customization/sharing | Copyright, personal data, illegal content, child safety | Storage/CDN; moderation provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Upload delete; report/takedown; hash/evidence policy. |
| Public/shared content, if any | Shared adventure, gallery image, comment, profile | Social/community feature | Online Safety Act, harassment, privacy, IP | Public web/CDN; moderation/search | `INPUT REQUIRED` | `INPUT REQUIRED` | Report, remove, appeal, block, export, and account deletion effects. |
| Accessibility/preferences | Font size, contrast, reduced motion, content preferences | Usability | May indirectly reveal disability or age | Local device/Supabase | `INPUT REQUIRED` | `INPUT REQUIRED` | Prefer local storage where feasible; field-level deletion. |
| Consent/notice proof | Terms version, privacy version, timestamp, jurisdiction, choice | Demonstrate disclosures and consent | Legal record linked to user | Supabase; consent platform | `INPUT REQUIRED` | `INPUT REQUIRED` | Withdrawal without erasing necessary historical proof; document distinction. |
| Incident evidence | Logs, affected IDs, notices, investigation notes | Security and breach response | Highly sensitive; may include broad data extracts | Security provider; counsel; regulator | `INPUT REQUIRED` | `INPUT REQUIRED by incident class` | Legal hold, restricted access, post-incident minimisation. |
| Backups and disaster recovery | Database/storage copies, recovery snapshots | Resilience and restoration | Contains every backed-up data class | Supabase/hosting/backup provider | `INPUT REQUIRED` | `INPUT REQUIRED` | Define deletion lag, restore re-deletion, encryption, and access controls. |

## 11. Launch Counsel Deliverables

| Deliverable | Owner | Evidence of completion |
| --- | --- | --- |
| Written territorial and audience scope opinion | Solicitor | Signed/advised memo with assumptions and re-review triggers. |
| Data-flow map and record of processing | Founder + engineer + solicitor | Versioned diagram and data-class register. |
| DPIA / child-risk assessment decision | DPO/solicitor | Approved document or reasoned no-DPIA record. |
| Processor due-diligence pack | Founder/operations | Contracts, DPA, regions, settings, subprocessors, transfer assessment. |
| Retention/deletion schedule and tested runbook | Engineer + solicitor | Table populated; deletion test evidence including backup restoration. |
| Consumer terms, privacy, Kid notice, cookies/SDK notice | Solicitor | Approved published versions tied to version IDs. |
| Subscription/refund/VAT implementation | Solicitor + accountant + engineer | Checkout/cancellation screenshots, tax configuration, reminder/refund tests. |
| Moderation and incident runbook | Safety owner + solicitor | Tabletop exercise and escalation contacts. |
| Claim substantiation register | Marketing + QA + solicitor | Every public claim has evidence, owner, qualifier, and review date. |
| Feature-change legal gate | Founder | Roadmap checklist requiring re-review before ads, social/sharing, uploads, age changes, or new providers. |

## References

[1]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/introduction-to-the-childrens-code/ "ICO — Introduction to the Children’s Code"
[2]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/8-data-minimisation/ "ICO — Children’s Code: Data minimisation"
[3]: https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/the-online-safety-act-and-gaming-know-the-risks-know-the-rules-know-how-to-comply "Ofcom — Online Safety Act and gaming"
[4]: https://www.gov.uk/guidance/the-vat-rules-if-you-supply-digital-services-to-private-consumers "HMRC — VAT rules for supplies of digital services to consumers"
[5]: https://www.asa.org.uk/type/non_broadcast/code_section/03.html "ASA/CAP — Misleading advertising"
[6]: https://www.gov.uk/government/consultations/consultation-on-the-implementation-of-the-new-subscription-contracts-regime/outcome/government-response-to-consultation-on-the-implementation-of-the-new-subscription-contracts-regime-web-accessible-version "UK Government — Subscription contracts regime response"
[7]: https://supabase.com/legal/dpa "Supabase — Data Processing Addendum"
[8]: https://stripe.com/legal/dpa "Stripe — Data Processing Agreement"
[9]: https://cloud.google.com/terms/data-processing-addendum "Google Cloud — Data Processing Addendum"
