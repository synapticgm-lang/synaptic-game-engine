# E10 — What Manus Still Cannot Know

This file is a deliberate stop-research boundary. Public competitor documentation and the supplied brief can inform a test plan; they cannot prove SynapticGM’s actual behavior, economics, user response, legal posture, or operational readiness. Treat the questions below as **instrumentation, playtest, build-review, or counsel work**—not prompts for further generic architecture research.

## 1. Questions Requiring Live Product Access or Trace Evidence

| Unknown | Why research cannot settle it | Required evidence | Decision it unblocks |
|---|---|---|---|
| Are StateTx, SceneManifest, IntentContract, CampaignContract, HookArc, beatFingerprint, Why?, receipt, leak scanner, revision, and voice profiles actually live? | Supplied Snapshot fields were blank; names are not behavior. | Current build/commit, feature flags, walkthrough, representative traces. | Accurate “current vs planned” scorecard. |
| Does a player correction win against stale summary/retrieval after save/reload? | Needs real revision/replay path. | RT11–RT18 results plus a 100-turn correction trace. | Public “corrections stick” claim. |
| Can a stale draft ever render or commit after another tab/correction wins? | Requires concurrency behavior. | RT35–RT38 logs with base revision/idempotency. | Launch integrity. |
| Does HUD Now/Changed/Why? match ledger truth and remain understandable? | No screenshots/build were provided. | Mobile/desktop screenshots, screen-reader/zoom pass, five novice sessions. | E2 visual audit and camera-proof clips. |
| Are all engines live, and do they preserve the same product law? | Engine availability fields were blank. | Feature matrix + per-engine CI output. | Beta scope and content plan. |
| What exactly happens when a player proposes a novel NPC/item/backstory? | Implementation may differ from product intent. | IntroductionPermit traces and UI. | Invention-control claim. |
| Is personality truly diction-only? | Requires same fixture/seed under each style. | Fact-hash/receipt diff and RT47–RT50 results. | Safe personality marketing. |
| Does Kid Mode filter current and historical renders, and is it fail-closed? | Requires UI/data path and policy wiring. | RT43–RT46, network capture, screenshot evidence. | Mode release decision. |
| Are ops kill switches present and practiced? | A listed switch can be nonfunctional. | RT60 drill, owner, last-test timestamp. | Incident readiness. |

## 2. Questions Requiring Telemetry and Real Cost Data

| Unknown | Required telemetry | Minimum observation window | Do not decide until |
|---|---|---:|---|
| Actual cost per accepted turn by engine/model/tier | CostEvent tokens, cache, output, tools, retries, provider rate, outcome. | 30 days of representative beta use. | P50/P95/P99 and tail costs are known. |
| How much free use converts vs consumes cost | Cohort activation, turns, offer exposure, conversion, net revenue, refunds. | At least one defined monthly cohort. | Free contribution formula is populated with real inputs. |
| Retry spam / outcome farming | Retry lineage, result class, cost, account age, correction vs reroll classification. | 30 days + P95/P99 analysis. | Retry policy is tuned to observed harm. |
| Image abuse / value | Image request/prevented/success/cost, later engagement, entitlement, prompt length. | 30 days; segmented by Free/Mid/High. | Image allowance is tied to user value and cost. |
| Honeymoon farming | New-account entitlement, device/risk signals subject to privacy review, starter cost. | 30 days. | Starter policy/anti-abuse control is justified. |
| Caching benefit | Cache reads/writes, prompt structure/version, latency/cost. | 1–2 model/prompt iterations. | Cache work is prioritized or dropped. |
| Warden GPU economics | Workload share, quality errors, latency, throughput, hardware/ops/fallback cost. | ≥30 days plus fully loaded benchmark. | GPU gate in E5 passes. |
| Entitlement defects / refund rage | Webhook replay/failures, support tickets, refund reason, gate timing. | First paid cohort. | Commercial flow is safe to scale. |

## 3. Questions Requiring Human Playtest

| Unknown | Research proxy is inadequate because | Test method | Success definition |
|---|---|---|---|
| Does the player feel heard? | Intent architecture does not equal perceived agency. | E4 off-hook and compound-action tasks. | Tester says system followed their action without being prompted. |
| Does “Why?” feel useful rather than bureaucratic? | A provenance field can still be unreadable. | Hard-action task and think-aloud. | Tester explains outcome in own words. |
| Is correction emotionally reassuring? | A successful revision can still feel scary/opaque. | Correction/reload task. | Tester uses control voluntarily and trusts result on return. |
| Is first hour too complex? | Product team is habituated to its terms. | 60-second start with newcomers. | Majority starts/acts without explanation. |
| Which engine is the best opening wedge? | Content appeal cannot be derived from architecture. | Randomized/alternating LitRPG and PYOA/Story sessions. | Higher 10-turn comprehension, delight, and return intent. |
| Is voice style valuable, safe, and discoverable? | Profile design cannot predict emotional fit. | A/B fixed-state style comparison. | Tone noticed; no fact changes; no confusion. |
| Does Kid Mode feel playable? | A clean block can still feel like rejection. | Safe boundary task appropriate to test protocol. | Player sees a clear, non-shaming alternative. |
| What proof clip actually converts? | Founder preference is not audience evidence. | Show alternative raw clips after session. | Viewer can correctly name differentiated value. |

## 4. Questions Requiring Counsel

| Unknown | Why it is counsel work | Input needed before advice |
|---|---|---|
| Age audience, child-directed/teen/general-audience posture | Depends on product, marketing, knowledge, collection, jurisdiction, and policy. | Launch countries, target ages, age-gate UX, data/ads/SDK inventory. |
| Kid Mode claims, parental controls, consent, retention | Content filters alone do not resolve privacy/consumer law. | Mode specs, history behavior, reporting process, vendor contracts. |
| Privacy notice and player data rights | Depends on entity, jurisdiction, data categories, retention, processors, transfers, and security. | Data map including logs, StateTx, messages, images, Google/Stripe, analytics. |
| Advertising / AppLixir approval | Depends on SDK terms, targeting/data, age, consent, placement, and contract. | Written provider proposal, tech integration plan, audience/tier matrix. |
| Refund/subscription/cancellation policy | Consumer/payment duties vary by market and exact offer. | Prices, trial/renewal design, Stripe setup, support capacity. |
| IP/user-generated content/world names/images | Rights depend on content sources, licensing, user terms, moderation/takedown. | Content pipeline, default packs, upload/share policy. |
| Marketing substantiation | “Remembers,” “safe,” “private,” “unlimited,” “fair” are factual claims. | Claim inventory and reproducible evidence. |
| Incident response/notification | Legal triggers depend on information, security event, jurisdiction, contracts. | Security plan, vendors, data classifications, escalation map. |

## 5. Questions That Need a Founder Choice, Not Research

| Choice | Options to decide | Why more research will not choose for you |
|---|---|---|
| First beta engine | LitRPG only; LitRPG + PYOA; LitRPG + Story RPG. | It is a sequencing and content-resourcing choice. |
| Primary first-hour promise | “Correction sticks”; “fair combat”; “freeform agency”; “system progression.” | All may be true later; one needs a product lead now. |
| Free cap posture | Daily turns, session budget, campaign budget, optional ad support, or invitation-only. | Requires your margin/risk tolerance after telemetry. |
| Paid value | Capacity, images, convenience, premium voice/presentation, campaign slots. | Must align with honest cost/value and brand, not competitor mimicry. |
| Kid Mode scope | Not at web beta; comfort mode for adults; separate young-user mode with counsel. | Legal/product accountability cannot be outsourced to generic research. |
| Warden trigger | Stay API-first; shadow benchmark; limited workload pilot after gates. | Depends on your measured cost/quality/ops data. |

## Stop Rule

Do not open a new architecture-research sprint unless a newly observed failure cannot be explained by an existing fixture, metric, trace, playtest, or counsel question. First run E3/E4/E8, populate E5 with CostEvents, and resolve E6 decisions. The unknowns above are now **work items with owners**, not a reason to browse indefinitely.

[Back to project index](../README.md)
