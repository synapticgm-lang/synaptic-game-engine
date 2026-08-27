## 6. Pre-release checklist — anything and everything

### Product / UX

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| New Game: premade path | Code | Must | A new user can choose a premade, confirm identity/setup, receive first prose, and start a valid campaign on desktop and mobile web. |
| New Game: Simple custom path | Code | Must | Simple fields produce a valid campaign contract without exposing Expert-only controls or creating contradictory initial facts. |
| New Game: Expert custom path | Code | Should | Hard canon, soft preference, blank-space, safety, and opening-hook settings compile and show a preflight summary. |
| HookArc state machine | Code | Must | Identity, meaningful choice, observed consequence, and next threat are stored per campaign; an offer cannot pass the guard before completion. |
| Honeymoon floor | Code | Must | Free +8, Mid +5, High +3 start-turn grants are applied once, visible in entitlement audit, and cannot be consumed by failed turns. |
| Soft-offer scheduler | Code | Must | Every offer test confirms action resolved, HookArc complete, not error/correction, user not Mid/High, and local frequency cap passes. |
| Offer suppression | Code | Must | Tests prove no offer can appear during combat, dialogue, image failure, timeout, cancel, correction, safety block, or first unresolved action. |
| Out-of-turns screen | Code | Must | User sees exact remaining choices—wait, pack, eligible optional reward—and can leave with campaign saved. |
| Cancel path | Code | Must | Canceling a generation results in no accepted state mutation, no capacity spend, and a visible safe retry path. |
| Timeout path | Code | Must | Timeout records provider/request class, preserves input, does not spend capacity, and offers retry/cancel with plain copy. |
| Empty/invalid GM response | Code | Must | Empty, parse-fail, or claim-gate-fail output never appears as story and never spends capacity; target retry behavior is tested. |
| Refund ledger | Code | Must | Every spend/refund maps to one immutable turn ID and reconciliation produces zero unexplained net debits. |
| Cloud save / Continue | Code | Must | Reload after refresh, device switch, timeout, and network loss restores the latest accepted turn and no duplicate mutation. |
| Save conflict policy | Code | Must | Concurrent device test either merges safe nonconflicting state or asks user to choose a version; it never silently overwrites newer StateTx. |
| Themes / cosmetics entitlement | Code | Must | A purchased theme/font/dice/voice cosmetic activates on correct account, restores after login, and never changes rules or safety mode. |
| Shop readability | Founder + Code | Should | Price, capacity, recurring terms, pack count, and cosmetics are comprehensible in a five-user test without verbal explanation. |
| Feedback inbox | Ops + Code | Must | In-app feedback includes campaign/turn ID, consented diagnostics, category, reply email opt-in, and acknowledgement receipt. |
| Accessibility baseline | Code | Must | Keyboard navigation, visible focus, readable contrast, text scaling, reduced motion, and no-color-only status indicators pass internal checklist. |
| Mobile-web baseline | Code | Must | New Game, generation, Shop, cancel, map, journal, and checkout work on current small-screen iOS/Android browsers. |

### AI / cost / data

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| Hosted provider keys | Founder + Ops | Must | Production keys are stored in a secret manager, not code/client bundles/logs, have environment separation, rotation owner, and revocation drill. |
| Model routing by tier | Code | Must | Free/Mid/High/Admin routing is declarative, observable, rate-limited, and preserves the same safety/claim gate across all routes. |
| Provider fallback | Code | Must | One provider/model outage can route eligible text traffic to a tested fallback or produce a no-spend recovery state. |
| Per-user and global rate limits | Code | Must | Limits cover turns, retries, image jobs, login, password reset, ad intents, and webhook endpoints; abuse test receives 429/hold behavior. |
| Prompt/output abuse controls | Code | Must | Known injection, harassment, sexual/minor exploitation, self-harm, threat, illegal-content, and PII-exfiltration tests route to block/rewrite/escalation policy. |
| Content safety taxonomy | Founder + Legal-verify | Must | Policy maps every restricted class to pre-block, rewrite-confirm, post-filter, report, escalation, and retention behavior. |
| Model cost ledger | Code | Must | Each accepted turn/image has provider, model, input/output tokens, estimated cost, user/tier/campaign, and no raw sensitive prompt retained by default. |
| Spend alarms | Ops + Code | Must | Alerts fire at 50/75/90/100% daily provider budget and auto-apply a documented fallback/queue policy at critical threshold. |
| PII/logging policy | Legal-verify + Code | Must | A data map states exactly which prompts, transcripts, IP/device signals, purchase records, and safety reports are retained, redacted, access-controlled, and deleted. |
| Data minimisation | Code | Must | Analytics payload excludes raw prompt/prose by default; support diagnostics are opt-in or policy-based and retention-expire. |
| Memorable image isolation | Code | Must | Text turn commits before image job begins; failed, canceled, late, or unsafe image never alters story, entitlement, or capacity. |
| Image moderation | Code + Ops | Must | Input visual manifest, generated result, metadata, and upload route pass safety/age checks; unsafe result is skipped with no player penalty. |
| TTS source filtering | Code | Should | Only post-approval prose is sent to TTS; Kid/adult voice/profile boundaries are tested. |
| AI incident runbook | Ops | Must | On-call can identify provider failure, bad output spike, unsafe image spike, or cost surge and use a kill switch in under 15 minutes. |

### Payments / entitlement / tax

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| Stripe Checkout products | Code + Founder | Must | Mid, High, text packs, image packs, and cosmetics have canonical SKUs, currency, tax behavior, and test/live separation. |
| Idempotent Stripe webhooks | Code | Must | HTTPS endpoint verifies signature, stores event ID before work, returns fast 2xx, and passes duplicate/out-of-order replay tests. [1] |
| Subscription state machine | Code | Must | `active`, `past_due`, `unpaid`, `cancel_at_period_end`, `canceled`, `refunded`, `disputed`, and grace behavior map to entitlements without manual database edits. |
| Pack / cosmetic truth | Code | Must | Packs and cosmetics are server-granted and restored from purchase/entitlement history; the client cannot mint balance. |
| Stripe Customer Portal | Code | Must | Subscriber can cancel, update payment method, view invoices, and return to product with entitlement state refreshed. |
| Web-to-account linkage | Code | Must | Purchase is bound to authenticated account with an explicit restore/recovery path and no account-takeover shortcut. |
| Refund / chargeback runbook | Ops + Code | Must | Staff can refund, revoke/retain benefits by documented policy, respond to dispute evidence, and reconcile ledger/Stripe state. |
| Adult BYOK processor | Founder + Legal-verify | Must before BYOK public launch | Separate processor, web-only routing, age gate, content policy, merchant approval, and account partition are verified in writing. |
| Creator comps | Founder + Ops | Should | Complimentary capacity/plan grants have duration, disclosure, tax/accounting record, revocation policy, and cannot be resold. |
| UK VAT / tax | Legal-verify + Founder | Must | Business has confirmed VAT/tax registration, location evidence, invoice/receipt, tax-inclusive pricing, and digital-service handling with accountant/counsel. |
| UK pre-contract disclosures | Legal-verify + Code | Must | Price, billing interval, cancellation, digital functionality, business identity/contact, withdrawal position, and durable confirmation appear before/after order. [2] |
| Recurring-price copy | Founder + Code | Must | Checkout and product pages state renewal amount/frequency and cancellation path in plain language; no surprise annualisation. |

### Ads

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| AppLixir account / domain review | Founder + Ops | Must before live ad flag | Approved production account/domain exists and the publisher agreement is stored. |
| Written AI-GM approval | Founder + Legal-verify | Must before live ad flag | AppLixir confirms in writing that the exact adult web AI-GM, maturity policy, geo mix, and rewarded use are eligible; ambiguity keeps flag off. |
| Staging integration | Code | Must | Sandbox/test integration works on HTTPS staging, has no production grant, and documents no-ad/error behavior. |
| Live feature flag | Code + Ops | Must | Ads can be enabled per country/cohort and disabled globally without deployment. |
| RewardIntent / S2S verification | Code | Must | Signed callback, nonce, user binding, expiry, idempotency, completion validation, replay test, and audit event pass. |
| Frequency/cap enforcement | Code | Must | Adult Free initial cap is one completed reward/day across devices; boundary condition and timezone policy are tested. |
| Fraud controls | Code + Ops | Must | Velocity/anomaly thresholds, IP/device/account signals, manual hold/reversal, provider reconciliation, and appeal/support process exist. |
| Exact reward disclosure | Code | Must | Pre-opt-in surface says the action, exact reward, cap, and skip path; no reward is cash-like, transferable, or ambiguous. [3] |
| No-ad fallback | Code | Must | When no creative/ad blocker/error occurs, user sees non-pushy continue-later/pack copy and retains campaign state. |
| Kid ad-free verification | Code + QA | Must | Kid profile/campaign tests never request, preload, render, or log third-party ad calls. |
| Mid/High ad-free verification | Code + QA | Must | Active Mid/High entitlement suppresses all rewarded, house, and fallback ad prompts other than account notifications. |
| Consent/cookies | Legal-verify + Code | Must | Applicable UK/EEA consent/CMP/cookie and provider settings are implemented before ad SDK/player initialization; decision is documented. |
| ads.txt | Ops + Code | Should | Required authorised-seller file is published and verified if provider contract requires it. |
| Revenue/fraud dashboard | Ops | Should | Requests, availability, opt-in, completion, S2S grant, reversal, fill, eCPM, support complaints, retention, and pack conversion are visible. |

### Safety / compliance / privacy

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| Kid/adult separation tests | Code + QA | Must | Child profile cannot open adult campaign, preview adult image, inherit adult evidence, or receive adult marketing/ad SDK calls. |
| Hard safety blocks | Code + Ops | Must | CSAM, sexual exploitation of minors, credible threats, and self-harm crisis policy cases block/escalate according to written playbook; no unsafe generation succeeds. |
| Moderation queue | Ops + Code | Must | Reports have severity, timestamp, reporter, campaign/asset ID, evidence access control, status, owner, SLA, and appeal/removal decision. |
| Escalation SLA | Ops | Must | P0 safety incidents have named owner/on-call and published internal response targets; table-top exercise completed. |
| Age / parental gates | Legal-verify + Code | Must | Product decision for adult-only/mixed audience is documented; age assurance/neutral screen/parent gate behave as designed. |
| Privacy policy | Legal-verify | Must | Policy accurately covers AI providers, payment, analytics, ads, safety, retention, account deletion, and contact. |
| Terms / content / refund / cookie policy | Legal-verify | Must | Each is published, versioned, linked in product and checkout, and support staff know the operative version. |
| Account deletion / export | Code + Ops | Must | User can request export/deletion; process deletes/anonymises applicable data or explains lawful retention with verification log. |
| AI disclosure language | Founder + Legal-verify | Must | Product/store/checkout language accurately describes AI-generated narrative/image limitations, moderation, and user responsibility without overclaiming. |
| DPIA decision note | Legal-verify | Must | Written DPIA/assessment records child-access likelihood, AI, profiling/ads, safety, vendors, high-risk processing, mitigations, and review date. [4] |
| Vendor DPAs / transfers | Legal-verify + Ops | Must | Processor list, DPA/terms, data locations/transfers, deletion commitments, breach contacts, and subprocessor review are recorded. |
| IP/report policy | Legal-verify + Ops | Should | Copyright/trademark complaint route, takedown workflow, repeat-abuse policy, and creator terms exist. |

### Store / build / operations

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| Production domain / HTTPS | Code + Ops | Must | Canonical domain, valid TLS, HSTS policy decision, redirects, security headers, and uptime monitor pass. |
| Backups / restore | Ops + Code | Must | Encrypted backup schedule, retention, restore owner, and successful restore drill are documented. |
| Error monitoring | Code + Ops | Must | Frontend, API, provider, webhook, image, sync, and moderation errors carry request/campaign IDs without raw sensitive text by default. |
| Minimal analytics | Code + Legal-verify | Must | Consent-aware events for install/start, HookArc, out-of-turns, ad completion, purchase, D1/D7, support, and safety report are verified. |
| Support email / SLA | Ops | Must | Public address, auto-acknowledgment, billing/safety routing, response targets, and escalation owner are live. |
| Status / known issues | Ops | Should | Public status/known-issues page and incident template exist. |
| Rollback | Code + Ops | Must | Feature flags, previous deploy artifact, migration rollback policy, and named decision maker are tested. |
| Cost/load smoke test | Code + Ops | Must | Test simulates expected launch concurrency, provider throttling, retry burst, payment/ad callback burst, and cost alarm response. |
| Admin tools | Code | Must | Authorized staff can search account/turn/payment/ad reward by ID, issue safe refund/hold, review report, and audit every action. |
| Ads-off kill switch | Code + Ops | Must | Global and regional switch takes effect without deployment and suppresses client requests. |
| Images-off kill switch | Code + Ops | Must | New image jobs stop; pending jobs reconcile safely. |
| Force-Free-model switch | Code + Ops | Must | Eligible text traffic routes to tested low-cost model without bypassing safety/claim checks. |
| Disable-signups switch | Code + Ops | Must | New account creation stops while existing users retain access according to incident policy. |
| Security review | Legal-verify + Code | Must | Threat model covers auth, secrets, payment/ad callbacks, account takeover, prompt injection, exports, admin access, and logs. |

### Content / IP / brand

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| Original bible audit | Founder + Legal-verify | Must | Every launch premade, NPC/place name, visual asset, and sample is checked against an original-content rule and logged. |
| Asset / music / font rights | Founder + Ops | Must | Rights/licences, attribution, expiry, territory, and source file are recorded for every external asset. |
| Credits | Founder + Code | Should | In-product credits list required licences, contributors, and feedback/support path. |
| Store / trailer screenshots | Founder + Ops | Must | Assets show actual product, true current UI, correct age mode, captions, no fake gameplay, and no unsupported claims. |
| Press kit | Founder + Ops | Should | Contains logo, screenshots, factual one-pager, founder bio, contact, launch date/status, policies, and disclosure language. |
| Creator disclosure templates | Founder + Legal-verify | Must | Paid/gifted creator brief requires clear #ad/#sponsored disclosure where applicable, factual claims only, no guaranteed-positive review, and age/content boundaries. [5] [6] |
| Community rules | Ops | Should | Official channels state content, spoiler, safety, support, and harassment rules with moderation ownership. |

### Beta → launch

| Item | Owner | Priority | Done-when |
|---|---|---:|---|
| Closed beta cohort | Founder + Ops | Must | Diverse 25–100 person cohort across target devices/genres has agreed feedback/support expectations. |
| Beta entry criteria | Founder | Must | Core text loop, safety, save, refund, and support P0 items are complete before invites. |
| Beta exit criteria | Founder + Code | Must | HookArc completion, turn validity, correction/refund, critical safety, and support metrics meet thresholds for two consecutive weeks. |
| Soft-launch geography/channel | Founder + Legal-verify | Must | Countries/channels match payment, privacy, age, ad-vendor, language, and support coverage; no global blast by default. |
| Go-live sign-off | Founder + Legal-verify + Ops | Must | Named sign-off confirms P0 checklist, incident contacts, vendor status, rollback, and public copy. |
| Launch-day runbook | Ops | Must | Hour-by-hour owner roster, dashboard links, approval rules, creator/community response plan, and pause criteria are ready. |

## 7. 30 / 60 / 90 day post-release ops plan

### Operating cadence

| Window | Measure weekly | Tune only if evidence supports it | Channel / support action | Kill / scale rule |
|---|---|---|---|---|
| **Days 0–7: protect trust** | Accepted-turn success, p50/p95 latency, refund/no-spend correctness, safety reports, account/signup failure, HookArc completion, first consequence latency, support backlog. | Fix reliability, onboarding confusion, unsafe outputs, broken saves, entitlement faults; do **not** tune price/ad caps for yield yet. | Invite-only/soft channel; reply to every beta-critical report; publish known issues. | Pause signups if P0 turn/purchase/safety fault breaches threshold; do not buy UA. |
| **Days 8–14: validate the first session** | D1, session completion, HookArc progression, correction rate, retry rate, out-of-turns reaction, campaign resume, creator feedback quality. | Opening variants, copy, tutorial timing, free capacity guard, no-ad fallback copy. | Add second small community/creator cohort only if support SLA holds. | Scale beta only if first-session integrity meets gate for 7 days. |
| **Days 15–30: instrument web adult reward pilot** | Ad availability, opt-in, completion, S2S grant match, reversals, fill/eCPM, fraud signals, pack conversion, D1/D7 cohort comparison, support complaints. | AppLixir eligibility cohorts, placement language, one/day cap enforcement, reward type—not cap increase. | Keep ad pilot geographically/cohort limited; no public claim about revenue. | Pause ads immediately for invalid traffic, callback mismatch, unsafe-vendor/content issue, or material retention decline. |
| **Days 31–45: find repeatable acquisition** | Organic demo→start, creator referral→HookArc, creator cohort D1/D7, waitlist conversion, search intent, social clip completion, support load per 100 entrants. | Landing-page proof, creator brief, onboarding, one winning genre page; not six paid channels. | Repeat only creators/channels producing qualified play, not views. | Paid test max £500 cumulative unless retention-qualified activation beats control. |
| **Days 46–60: monetisation fairness experiment** | Offer impression, accept/dismiss, purchase, pack spend, reward use, churn after offer, rage-quit reason, Mid/High downgrade/cancel, fraud-adjusted net revenue. | Price-page clarity, offer timing, pack presentation, capacity explanation; run holdout with no offer. | Consider small paid search/social only with proven creative and support headroom. | Never raise rewards/caps if it harms pack conversion or D7 without clear net benefit. |
| **Days 61–75: controlled scale or consolidation** | D7/D30 cohorts, contribution after model/ad/payment cost, abuse rate, moderation SLA, creator saturation, incident frequency. | Model routing/cost, channel spend, country availability, support automation, content editorial calendar. | Expand one channel/country at a time; recruit part-time moderation/support before volume jump. | Pause scale if on-call cannot meet safety/billing SLA. |
| **Days 76–90: decide next platform/feature gate** | Web retention/revenue stability, support load, policy readiness, mobile demand signal, store checklist completion, user requests by impact. | Play roadmap only if web has stable quality and store-specific P0s are ready; otherwise deepen web. | Public post-launch changelog, creator refresh, waitlist segmentation. | Commit to Play only after explicit sign-off; do not let channel pressure force a half-ready build. |

### Two-week operating checklist

| Cadence | Founder | Code | Ops / Legal-verify |
|---|---|---|---|
| Daily | Review top user complaints and conversion context. | Review error, cost, provider, and fraud dashboards; test kill switches. | Triage safety/payment escalations and status page. |
| Twice weekly | Decide one product hypothesis; reject vanity requests. | Ship small flagged fix with rollback. | Update known issues and support macros. |
| Weekly | Approve creator/community activity and spend caps. | Reconcile capacity, purchase, refund, ad, and save integrity. | Review SLA, abuse trends, policy/vendor changes. |
| Biweekly | Decide scale/hold/pause with cohort data. | Run 30/100-turn regression and load/cost smoke test. | Review privacy/safety/consumer-risk changes and records. |

### Red alert — pause ads, pause signups, or rollback

| Trigger | Immediate action | Owner | Resume only when |
|---|---|---|---|
| Any credible CSAM/exploitation generation or systemic child/adult boundary leak | Disable affected generation/image/profile, preserve evidence securely, escalate under safety playbook, pause relevant signups if systemic. | Founder + Ops | Root cause fixed, regression suite passes, escalation closure documented. |
| Credible self-harm/threat handling failure with immediate-risk route broken | Pause affected feature/model, activate escalation playbook, fix support routing. | Ops + Founder | Crisis routing and tests pass. |
| Purchase grants wrong entitlement, duplicate packs, or revokes paying users | Pause checkout/affected SKU; enable safe manual support path; reconcile all events. | Code + Ops | Ledger/Stripe reconciliation zeroes and replay tests pass. |
| Rewarded callback mismatch, repeated grants, or material invalid-traffic warning | Disable ad flag globally; stop creators driving questionable traffic; preserve logs. | Code + Founder | S2S verification/reconciliation and provider review pass. |
| Provider cost exceeds 120% daily guardrail or runaway retry/image loop | Force fallback/free model, images off, throttle or pause new signups. | Code + Founder | Cost normalises and root cause is fixed. |
| Accepted-turn failure/timeout rate exceeds 5% for 30 minutes or p95 exceeds 30 seconds for one hour | Pause paid traffic; force fallback; show recovery copy/status. | Code + Ops | Error/latency remains within threshold for 60 minutes. |
| Cloud-save/data-loss or cross-account access defect | Disable risky sync/action, pause signups if scope unknown, notify affected users. | Code + Legal-verify | Restore/audit complete and security review signs off. |
| Material moderation queue backlog beyond SLA | Pause high-risk channel/feature and new adult content intake; add coverage. | Ops | Queue and audit quality recover for 7 days. |
| Store/vendor policy warning or written content eligibility uncertainty | Disable affected monetization/distribution path; do not “test through” a warning. | Founder + Legal-verify | Written clarification or compliant remediation exists. |
| Support backlog exceeds published SLA for three days | Pause scale, reduce campaigns, add support coverage and self-service. | Founder + Ops | Backlog returns to target with quality review. |

## 8. Open decisions for founder

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Web-only versus Play timing | **Web adult Free first; do not set Play date until store checklist is independently green.** | Parallel Play prototype behind no-launch commitment. | Early Play can create store-policy, billing, moderation, and support debt; delayed Play may postpone organic discovery. |
| AppLixir versus backup if denied | **Keep ads disabled; use house ads and packs/subscription while pursuing written eligibility or a separate web-approved vendor.** | Offerwall or rapid mobile mediation. | Rushing a weak backup creates trust/fraud/policy risk that exceeds early ad yield. |
| Raise 1 → 2 rewarded ads/day | **Only after 28 days: completed reward users show no >5% relative D7 decline, pack conversion is non-inferior, fraud is low, and support complaints stay flat.** | Keep one/day permanently. | Higher cap may convert paid capacity into low-value ad behavior and increase fraud. |
| Turn on paid UA | **After two consecutive weeks of stable D1/D7, HookArc, entitlement correctness, support SLA, and a creator/organic creative with qualified activation.** | Remain organic until 90 days. | Too early buys churn, support debt, invalid ad traffic, and misleading data. |
| Discord or other login beside Google | **Use email/passkey or magic link first; add Discord only if target communities demonstrate real demand and account-link/age/support policies are ready.** | Google-only at launch. | Missing Discord can reduce enthusiast conversion; adding it early increases account recovery, moderation, and data-processing surface. |
| Memorable default | **One opener plate enabled where entitlement allows; later memorable images opt-in, with an obvious disable setting.** | All off by default. | Always-on raises cost/latency and safety exposure; all-off weakens perceived magic. |
| Adult BYOK timing | **After web core, adult-age gate, separate processor, moderation boundaries, and support runbook are proven; not at public launch.** | Launch simultaneous web-only adult BYOK. | Premature BYOK creates processor/policy/account separation and safety support complexity. |
| Kid Mode public availability | **Public only when fully ad-free, separation tests, parental gates, privacy/DPIA, content policies, support escalation, and age-appropriate UX are all green.** | Private waitlist/beta only. | Launching early risks child safety/privacy failure; delaying may reduce family demand but preserves trust. |
| Free capacity messaging | **State exact accepted-turn availability and a saved stopping point; do not display an aggressive countdown.** | Gamified meter. | A countdown can create anxiety and make the story feel metered rather than owned. |
| Mid/High pricing review | **Hold £14.99/£29.99 during first 60 days; test clarity/bundles before changing price.** | Immediate discount ladder. | Early discounting anchors low willingness-to-pay and obscures product-market signal. |
| Adult-content distribution scope | **Keep mature/Adult BYOK web-only with explicit account partition and age controls.** | Mixed-audience app toggle. | Mixed distribution sharply increases store/ad/child-mode policy risk. |

## References

[1]: https://docs.stripe.com/billing/subscriptions/webhooks ; https://docs.stripe.com/webhooks "Stripe subscription and webhook documentation"
[2]: https://www.gov.uk/online-and-distance-selling-for-businesses "UK online and distance-selling information requirements"
[3]: https://support.google.com/admob/answer/7313578?hl=en ; https://developers.google.com/admob/android/rewarded "Google rewarded-ad rules and server-side verification"
[4]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "ICO Age Appropriate Design Code"
[5]: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers "FTC creator-disclosure guidance"
[6]: https://www.asa.org.uk/advice-online/recognising-ads-social-media.html "UK ASA social-media advertising guidance"
