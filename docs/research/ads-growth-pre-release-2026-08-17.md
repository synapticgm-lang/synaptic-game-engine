# SynapticGM — Ads, Growth, and Pre-Release Readiness Brief

> Saved from John’s Downloads (2026-08-17). **Note:** source deliverable truncated after §5 Channel strategy — missing requested §6 full pre-release checklist, §7 30/60/90 ops, §8 open decisions. P0 blockers in §0 still usable as the ship gate.

## 0. Executive recommendation

**Launch strategy:** launch **web adult Free first** with optional rewarded ads only after AppLixir gives written approval for the exact AI-content, maturity, geography, and traffic profile. Keep Kid Mode **ad-free at launch** unless a separate child-safe, contextual ad path has passed privacy, Family/Children’s Code, creative, and vendor review. Do not launch a Play build until server entitlements, Play Billing, moderation/reporting, target-age/data-safety forms, age-mode separation, and ad verification are production-tested.

**First 90-day acquisition:** owned proof first (landing, demo, consequence clips, creators, waitlist). Paid UA only after HookArc, D1, fair offers, low correction rate, and contribution margin exist.

### Budget ladder

| Budget | What to do | Do not do | Gate to move up |
|---:|---|---|---|
| **£0** | Landing page, waitlist, weekly devlog, 8-week short-video cadence, community listening, 20 creator outreach messages, press kit, product analytics. | Paid install networks, generic “AI story” ads, mass Discord posting. | 20+ organic playtesters; HookArc and first-session metrics instrumented. |
| **£500** | 5–10 micro-creator paid tests or keys, subtitle/caption editing, two landing-page variants, small Reddit/Meta/TikTok creative validation where rules permit. | Optimising to clicks/installs alone. | Find one creator/creative with engaged sessions and acceptable report/retention profile. |
| **£2k** | Repeat winning creator format, retarget site visitors with consent, test one paid social channel and one search/keyword campaign, produce a short trailer. | Scale to countries/languages without moderation/support coverage. | Cohort contribution trend is positive or a clear learning KPI is met. |
| **£10k** | 60% proven creator partnerships, 25% best paid channel, 10% ASO/creative production, 5% PR/contingency; staged by weekly holdouts. | Network mediation or broad mobile UA before mobile readiness. | 4 consecutive weeks of stable retention, payment/reward integrity, and support SLA. |

### Top 15 release blockers

| Rank | Blocker | Priority | Release condition |
|---:|---|---:|---|
| 1 | Server-authoritative purchase/ad entitlements | P0 | No client-only credit grants. |
| 2 | Output/prompt moderation + escalation | P0 | Abuse cases under SLA. |
| 3 | Adult vs Kid Mode boundary / no leakage | P0 | Policy + automated tests. |
| 4 | Pricing/cancel/refund UX (UK consumer) | P0 | Checkout disclosure review. |
| 5 | Capacity refund on empty/timeout/cancel/fail | P0 | Reconciliation passes. |
| 6 | AppLixir written eligibility for AI GM | P0 | Contract + staging. |
| 7 | Rewarded opt-in, caps, server fraud controls | P0 | Callback/replay tests. |
| 8 | Stripe webhooks + entitlement state machine | P0 | Sub/refund/chargeback lifecycle. |
| 9 | Privacy/ToS/deletion/consent/DPIA | P0 | Legal/privacy sign-off. |
| 10 | Store readiness (only if shipping store) | P0 | Preflight complete. |
| 11 | HookArc before any capacity gate | P1 | 95% paths hit consequence first. |
| 12 | Observability (turn/pay/ad/moderation) | P1 | Dashboard + runbook. |
| 13 | Rights register + creator disclosure templates | P1 | Launch assets licensed. |
| 14 | A11y / mobile / timeout recovery floor | P1 | Acceptance checklist. |
| 15 | Support ops / status / rollback | P2 | Test ticket exercise. |

### Ship when X is true

Every P0 passes; HookArc before capacity messaging; no client-only grants; failures preserve campaign + capacity; reports staffed; failed turn/payment/ad/unsafe output identifiable in ≤15 minutes.

## Stack verdict (summary)

- **Web adult Free:** AppLixir pilot + house ads; start **1 rewarded/day**; Mid/High **no ads**; Kid **ad-free at launch**.
- **Never:** interstitials in core story; offerwalls at launch; ads before HookArc / during unresolved action.
- **Server reward:** RewardIntent → provider S2S callback → idempotent CapacityLedger grant.
- **GTM:** proof clips of ledger consequence; creators before broad paid UA.

## Gap-fill status

§§6–8 delivered and saved as [`ads-prerelease-gapfill-6-8-2026-08-17.md`](./ads-prerelease-gapfill-6-8-2026-08-17.md) (2026-08-17).

## Source references

See original Downloads file for full tables (placement copy, A/B tests, GTM cadence) and citation links [1]–[11].
