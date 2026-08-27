# SynapticGM — Ads, Growth, and Pre-Release Readiness Brief

## 0. Executive recommendation

**Launch strategy:** launch **web adult Free first** with optional rewarded ads only after AppLixir gives written approval for the exact AI-content, maturity, geography, and traffic profile. Keep Kid Mode **ad-free at launch** unless a separate child-safe, contextual ad path has passed privacy, Family/Children’s Code, creative, and vendor review. Do not launch a Play build until server entitlements, Play Billing, moderation/reporting, target-age/data-safety forms, age-mode separation, and ad verification are production-tested. A Play release can be valuable later, but it is not the shortest route to trustworthy monetization for an open-ended AI GM. AppLixir’s web material supports rewarded flows but explicitly flags adult/misleading content as publisher risk; its published CPM/fill claims are vendor estimates, so only a controlled pilot can validate yield. [1]

**First 90-day acquisition strategy:** build owned proof first—landing page, playable web demo, 30-second consequence clips, creator seeding, community listening, and an email/waitlist loop. Spend paid acquisition only after the product demonstrates a completed HookArc, D1 retention, non-spiteful offer timing, low invalid-output/correction rate, and a measured contribution margin. The first paid channel should be a small creator/whitelisted-community experiment, not broad install campaigns. Never buy fake installs, reviews, bots, incentivized clicks, or traffic that makes the ad account look fraudulent.

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
| 1 | Server-authoritative purchase/ad entitlements with signature verification, nonce/idempotency, reversal handling, and audit trail. | P0 | No client-only credit grants. |
| 2 | Output/prompt moderation, report, block, takedown, and human escalation paths for AI/mature content. | P0 | Test abuse cases resolved under defined SLA. |
| 3 | A real adult-versus-Kid Mode boundary, data separation, age policy, and no mature leakage into child saves/assets. | P0 | Policy and automated tests pass. |
| 4 | Clear digital-content/subscription pricing, cancellation, renewal, refund, and order-confirmation UX. | P0 | Checkout passes UK consumer disclosure review. |
| 5 | Capacity refund/no-spend behavior for empty, timeout, cancel, parse fail, and policy-blocked turns. | P0 | Automated reconciliation passes. |
| 6 | Verified AppLixir eligibility and written content policy confirmation for web adult flow. | P0 | Contract/support confirmation plus staging test. |
| 7 | Rewarded-ad opt-in, skip, exact reward disclosure, caps, no-ad fallback, and fraud controls. | P0 | Server callback and replay tests pass. |
| 8 | Stripe webhook processing, signature checks, retry-safe state machine, and entitlement reconciliation. | P0 | Test subscription/refund/chargeback lifecycle passes. |
| 9 | Privacy policy, terms, account deletion, data inventory, vendor/subprocessor map, cookie/consent design, and DPIA decision. | P0 | Legal/privacy sign-off. |
| 10 | Store readiness only if shipping store build: billing, age ratings, data safety/privacy, review account/demo, moderation declarations. | P0 | Store preflight complete. |
| 11 | Reliable first-session HookArc and no interrupted-action offers. | P1 | 95% simulated paths reach a consequence before any gate. |
| 12 | Production observability for turn, payment, ad, provider, moderation, and support failures. | P1 | On-call dashboard and runbook exist. |
| 13 | Asset/content rights register, brand/trademark search, creator agreement, sponsorship disclosure templates. | P1 | All launch assets have owner/license. |
| 14 | Accessibility and quality floor: keyboard/mobile, reduced motion, readable typography, timeout recovery. | P1 | Acceptance checklist passes. |
| 15 | Support/reputation operations: FAQ, billing help, report workflow, incident status page, rollback procedure. | P2 | Test ticket exercise completed. |

### Ship when X is true

Ship public web adult Free only when **every P0 passes**, 95%+ of test sessions complete a HookArc before capacity messaging, no payment/ad reward can be granted from the client alone, every user-facing failure preserves the campaign state and capacity correctly, mature/kid-mode reports route to a staffed process, and the launch team can identify a failed turn, failed payment, failed ad callback, or unsafe output from logs within 15 minutes. Ship Play only after the mobile-specific review/billing/privacy/age requirement set is also complete.

## 1. How we treat ads today → economics model

### State policy

| State | When ads may show | Max/day | Reward | Fair offer rules | Fill/eCPM assumption | Illustrative gross revenue per active state DAU | Cannibalisation risk / recommendation |
|---|---|---:|---|---|---|---:|---|
| **Kid Free** | **No ads at launch.** Later only a separately approved contextual family-safe path. | 0 launch. | None. | Never show an ad as a condition of progress. | Do not forecast; compliance first. | £0 launch. | Keep ad-free; family trust outweighs speculative yield. |
| **Adult Free (web)** | Explicit “Earn a turn” in shop or after an accepted scene boundary and only if an ad is available. | Start 1 completed reward/day; test 2 only after retention review. | +1 accepted text turn, or one optional memorable entitlement after weekly image cap. | Never during unresolved action; never immediately after error/correction; show exact reward before opt-in. | Vendor web rewarded claims: $4–15 CPM and high fill; **Uncertain**. Planning model uses $6–8 eCPM, 60–70% fill, 8–15% opt-in. [1] | **$0.000230–$0.000856** under conservative/base model; use as directional only. | Moderate if reward substitutes packs; cap at one/day and exclude users with active paid entitlement. |
| **Adult Free (future Play)** | User-initiated rewarded placement only, after Google policy/store review. | Start 1/day; hard daily rate limit. | Non-transferable in-app extra turn only. | Must be opt-in, dismissible, disclosed, and delivered; no monetary/transferable reward. [2] | No official universal eCPM; planning $15 mobile base, **Uncertain**. | **$0.002237** base model; not a forecast. | Higher, so use only after testing pack/sub conversion holdout. |
| **Mid (£14.99)** | No ads. | 0. | None. | Show only relevant house offer at natural boundary; no reward prompts. | n/a | £0 ad revenue. | Preserve paid value and trust; do not use ads. |
| **High (£29.99)** | No ads. | 0. | None. | No capacity anxiety/hard sell. | n/a | £0 ad revenue. | Preserve premium promise. |
| **Admin BYOK (web adult)** | No network ads by default. | 0. | None. | Separate adult merchant and processor policy applies. | n/a | £0 ad revenue. | Keep clear of ad eligibility/mature-content conflict. |

**Illustrative formula:** `eCPM × ad-eligible share × completed ads per eligible user × fill × completion / 1,000`. The web conservative and base values use `$6×0.08×1×0.60×0.80/1,000` and `$8×0.15×1.2×0.70×0.85/1,000`; the mobile base uses `$15×0.18×1.3×0.75×0.85/1,000`. These are planning math, not yield promises. AppLixir’s public CPM/fill claims are marketing estimates; Google/Apple do not publish a universal rewarded-ad eCPM for this use case. [1] [2] [3]

### Keep / tweak / never

| Policy | Verdict | Reason |
|---|---|---|
| Optional rewarded extra text for adult web Free | **Keep, but cap at one completed reward/day initially.** | It is legible and optional; low expected revenue means protect retention rather than chase volume. |
| +1 memorable after weekly cap | **Tweak.** | Reward a clearly optional plate moment, never a key story reveal; offer only if an approved ad is actually available. |
| Harder adult daily cap after weekly limit | **Tweak carefully.** | Offer pack/sub first at a scene boundary; ad bridge only as a fallback, never as punishment. |
| Mid/High no ads | **Keep.** | Prevents direct paid-value erosion. |
| Kid family-safe ads at launch | **Do not launch.** | Mixed-audience/child data, creative, SDK, and product-output risk exceed likely early revenue. |
| Interstitials | **Never for core story.** | A full-screen interruption between choice and consequence destroys the GM contract. If ever tested, restrict to an opt-in non-story hub and treat as likely negative. |

### HookArc and honeymoon interaction

The first offer may occur only when `(HookArc.complete === true) AND (currentAction.resolved === true) AND (not after error/correction)`. Honeymoon turns are the guaranteed floor; HookArc is the fairness test. The player must first see identity acknowledged, make a meaningful choice, observe a durable consequence, and receive a voluntary next direction. An offer before that says “pay to find out whether we remember you”; an offer after that can honestly say “continue this campaign on your terms.”

## 2. Ad service / mediation plan by level & channel

| Candidate | Channel fit | Kid / adult suitability | Rewarded support and yield caveat | AI/mature-content policy risk | Effort / fraud risk | Verdict |
|---|---|---|---|---|---|---|
| **AppLixir** | Web-first HTML5/React; also lists mobile/Unity paths. | Adult web potentially; **Kid suitability unconfirmed—do not use.** | JS rewarded SDK, completion callback, S2S callback; vendor claims $4–15 or $8–15 CPM and high fill, **Uncertain**. [1] | Adult/misleading content appears in publisher eligibility risk; obtain written approval for controlled adult AI GM. | M; ad blockers, VPNs, replayed callbacks, bot traffic. | **Primary web adult pilot only.** |
| **House ads** | Web and app. | Safe if own content is age-mode aware. | No eCPM; measures conversion/education. | Low if claims are accurate and age-appropriate. | S; no external callback fraud but avoid deceptive UI. | **Primary complement.** |
| **Direct sponsor / themed partner** | Web/owned channels. | Adults; kid only with legal/creative review. | Fixed-price/affiliate, not fill dependent. | Sponsor brand-safety and disclosure risk. | M; contract and creative approval. | **Later, not launch-critical.** |
| **Offerwall vendor** | Future adult web/mobile only. | Unsuitable for Kid Mode; likely poor fit for immersive campaign. | Can pay more per completion but creates task walls. | High trust/policy/fraud risk. | M/L; identity/device farming. | **Avoid at launch.** |
| **Google AdMob** | Native Android rewarded; verify any web product separately. | Families path exists but requires child-safe SDK/data/creative and accurate target-age handling; adult is easier with moderation. [2] | Opt-in rewarded, SSV, test IDs; no official yield promise. | AI apps must prevent restricted content and provide reporting/flagging. [4] | M; invalid traffic responsibility remains publisher’s. | **Primary future Play adult path; child path only after full compliance.** |
| **AppLovin MAX / LevelPlay** | Native mobile mediation, not web-first. | AppLovin policy excludes child/child-directed use; Unity has child/age settings but still requires compliance. [5] [6] | Mediation and rewarded placements; no universal eCPM forecast. | Strong restrictions on sexual/suggestive, unsafe, and certain AI-generated sexual content. | L; SDK consent, mediation, app-ads.txt, callback abuse. | **Avoid launch; evaluate only after stable native adult app.** |
| **Unity Ads / LevelPlay** | Native Unity/mobile path. | Adult first; child requires distinct compliant configuration/creative. | User-initiated rewarded, pacing/caps/mediation. [6] | Broad content discretion; no uncontrolled mature AI. | L; SDK/mobility and fraud controls. | **Backup future mobile option.** |
| **Apple-network choice** | iOS later. | Kids category effectively needs no third-party ads except limited contextual routes; adult app still needs age-appropriate ads. [3] | No native default recommendation. | Apple remains responsible for ads/AI/UGC content. | L. | **No iOS ads at initial Apple launch.** |

### Concrete stack

* **Launch web adult Free:** AppLixir pilot on production-approved domains only, with an adult-safe/mature-content exclusion rule for ad-supported sessions until written approval says otherwise; house ads as zero-risk fallback; no offerwall.
* **Launch Kid Mode:** no third-party ads. Use no monetization prompt during play; parental gate for any purchase, high privacy defaults, and optional non-promotional “continue later” archive UX.
* **Launch Play:** only after Play Billing, AdMob SSV, target age/data-safety forms, full AI moderation/reporting, and strict adult/Kid product separation. Do not assume AppLixir web approval transfers.
* **Later mediation:** MAX/LevelPlay only if a native adult product has material rewarded volume, at least two approved demand sources, privacy/CMP maturity, and an incremental revenue test that proves it does not hurt session completion or payer conversion.

### Server-side reward grant design

```text
client requests placement → server creates RewardIntent{id,user,placement,capWindow,nonce}
→ client opens provider placement with nonce/PPID
→ provider callback reaches server → verify signature/provider event/user binding
→ validate completion, expiry, placement policy, frequency cap, device/account risk
→ atomic CapacityLedger grant {rewardIntentId, +1 turn or +1 memorable}
→ return receipt; duplicate callback is idempotent; suspicious event is held/reversed
```

Do not trust client completion flags. Add per-account/device/IP velocity checks, nonce expiry, callback signature validation, duplicate event storage, manual reversal ability, provider reconciliation job, and a graceful “No sponsor message is available—your story can continue tomorrow or with a pack” state. AppLixir documents a server callback pattern; Google documents rewarded server-side verification. [1] [2]

## 3. Placement & creative rules (maximize return, minimise churn)

### Exact moments

| Moment | Eligibility | UX | Never |
|---|---|---|---|
| Out of text turns | Adult Free; action resolved; HookArc complete; not error/correction. | First show pack/sub; secondary optional earn-turn if available; preserve one clear continue-later choice. | Mid-combat, mid-dialogue, first 10 turns before consequence. |
| Shop → Earn turns | Adult Free only; user intentionally enters shop. | Explain exact reward/cap before opt-in; show availability state. | Auto-play or fake scarcity. |
| Weekly memorable cap bridge | Adult Free only; player explicitly requests an optional image; scene text already accepted. | “Watch one optional sponsor message to create this extra plate.” | Gating the only visual representation of a required event. |
| Between chapters / after HookArc | Adult Free, once per 7 days maximum at launch. | House ad for plan/pack/branch vault, dismissible. | Offer after error, safety block, loss, or a player correction. |

### Ten diegetic soft-offer lines

1. “The campfire is low. If you want one more scene tonight, a patron can keep it burning.”
2. “A noticeboard offers a brief sponsor message in exchange for one extra turn on the road.”
3. “Your chronicle can continue now with a text pack, or wait for tomorrow’s free turns.”
4. “This is a clean chapter break. Save the trail, continue later, or choose an extra turn.”
5. “The archive keeper can preserve this alternate path with your branch space.”
6. “This moment is complete. If you want a second illustrated plate, an optional sponsor message is available.”
7. “Your choice has landed. The next scene is ready when you are.”
8. “A quiet supporter offer can add one journey step; it is entirely optional.”
9. “No pressure: your campaign is saved. Continue with a pack, an optional bridge, or tomorrow.”
10. “The guide marks a safe stopping place before any offer appears.”

### Ten banned pushy lines

1. “Watch now or lose your story.”
2. “Your companion needs you to pay.”
3. “Only one chance left—act now.”
4. “You ran out because you chose wrong.”
5. “Unlock your memories.”
6. “Keep your character alive by subscribing.”
7. “The GM will forget this if you leave.”
8. “Pay to see what happens to your party.”
9. “Ads are required to continue this fight.”
10. “Your free story is over.”

### First 60-day A/B tests

| Test | Hypothesis | Primary metric | Stop rule |
|---|---|---|---|
| 1: one vs two daily reward caps | Two increases net revenue without reducing D1/pack conversion. | Fraud-adjusted ARPDAU and D1. | Stop if D1 or pack conversion drops >10% relative. |
| 2: shop-only vs natural-boundary entry | Natural-boundary offer has higher opt-in without rage exits. | Completion and next-session return. | Stop if exit-after-offer rises >5pp. |
| 3: text-turn vs memorable bridge | Text bridge yields better session continuation; image bridge has lower cannibalisation. | Incremental accepted turns / pack conversion. | Stop if image bridge causes support complaints or no incrementality. |
| 4: no offer until HookArc vs fixed turn | HookArc produces more trust and conversion. | Complaint rate, HookArc completion, purchase. | Stop if free-cost rises beyond planned envelope without retention benefit. |
| 5: one-line versus three-option offer | Clear one-line option reduces confusion. | Offer dismiss rate and support tickets. | Stop if explicit comprehension test fails. |
| 6: house ad placement | House ads teach tiers without harming story cadence. | Upgrade click and next-turn continuation. | Stop if post-ad abandonment rises. |

House ads are ethical when they appear in the shop, chapter close, campaign management, or post-completion screen; they are not ethical when they use loss, fear, safety, or unresolved consequences as pressure.

## 4. Go-to-market — get the game out there

### Organic priority order

1. **Landing page and web demo.** Lead with a real, short playable scene and a verified “what changed” example; pages for AI GM, LitRPG campaign, isekai story game, tabletop solo GM, and family-safe story mode should show product mechanics, not generic generated art.
2. **Store/listing foundation.** Use accurate age, AI-content, pricing, privacy, cancellation, and ad language; screenshots should show a named action causing a quest/map/inventory change.
3. **Short-form proof.** 15–30 second clips: “I refused the opening quest; the world kept track,” “same dungeon, different return state,” “the GM remembers who is in the room.” Avoid glossy montage with no interaction.
4. **Rules-respecting community presence.** Read subreddit/Discord rules; post build notes, playable playtests, and lessons, not repetitive links. Answer criticism with fixes and receipts.
5. **Creator seeding.** Send a private test link, a one-page fact sheet, disclosure requirement, genre starter codes, and an explanation of what to test: continuity, free flow, safety, and choice consequence. Pay for work; never condition payment on positive coverage.
6. **Press/newsletters/indie listings.** Pitch the ledger-first campaign angle, a playable build, accurate launch date, accessibility/safety stance, and original examples. Use Product Hunt/itch/IndieDB only when the build is stable enough for public feedback.

### Eight-week content cadence

| Week | Anchor | Supporting content |
|---:|---|---|
| 1 | “Your choice changes the world” 30s proof. | Devlog on StateTx/receipt in player language. |
| 2 | LitRPG first-consequence clip. | Opening deck poll and creator outreach. |
| 3 | Returning-location before/after. | FAQ on AI safety, privacy, and fair capacity. |
| 4 | Solo-tabletop fair check clip. | First small creator session. |
| 5 | Custom world compiler reveal. | Expert authoring walkthrough. |
| 6 | Kid Mode/comfort-mode clarity, only if fully ready. | Parent-facing factual page, not fear marketing. |
| 7 | PYOA ending provenance clip. | Newsletter playtest invitation. |
| 8 | Launch/soft-launch recap: what changed from feedback. | Changelog and creator highlights with disclosure. |

### Paid UA: channels, angles, and kill rules

| Channel | Fit | Creative angle | Avoid | Kill criterion |
|---|---|---|---|---|
| Micro/mid creators | Best early fit. | Their real decision has a remembered consequence. | Undisclosed sponsorship or pre-scripted praise. | No engaged sessions/creator-specific retention after two tests. |
| Reddit communities | Test cautiously where allowed. | Long-campaign continuity and solo tabletop proof. | Broad AI hype or vote manipulation. | Negative rule response or low-quality comments. |
| TikTok/Reels/Shorts | Good for first-30-second proof. | Split-screen input → visible world change. | AI-art montage, fake reactions, sexualised bait. | Hook view but low demo start rate. |
| Search | Later, intent-rich. | “Solo tabletop campaign,” “AI story game with inventory.” | Bidding misleading competitor trademarks. | CPA exceeds first-month contribution by predefined margin. |
| Meta/Google app campaigns | Later after funnel maturity. | Genre-specific landing page, not one generic ad. | Optimising only to install/click. | No retention-qualified activation after spend cap. |
| Install mills/offerwalls | Not fit. | None. | Fake installs, incentivised ratings, bot traffic. | Never run. |

### Positioning one-liners

* **LitRPG players:** “Build power in a campaign that records your class, kit, quests, and consequences.”
* **AI Dungeon refugees:** “A story GM where room roster, gear, and choices are backed by a campaign ledger—not only old chat.”
* **NovelAI / SillyTavern users:** “Keep author control, but let a game-state layer handle the facts you should not have to maintain by hand.”
* **Parents:** “A family-safe story mode with visible comfort rules, parent controls, and no surprise adult crossover.”
* **Tabletop fans:** “Solo or guided play with fair checks, persistent maps, and prose that follows the result.”

Do not claim “perfect memory,” “unlimited story,” “human GM replacement,” “fully uncensored,” “works for every age,” or competitor-specific superiority that cannot be demonstrated in product tests.

## 5. Channel strategy

The supplied task specification ends at this heading. The channel plan above is complete for the provided scope; before executing any paid or store action, confirm the intended launch countries, adult-content policy, legal entity/tax setup, age policy, and whether the first public release is web-only or includes Google Play.

## References

[1]: https://support.applixir.com/ "AppLixir support and publisher documentation"
[2]: https://support.google.com/admob/answer/7313578?hl=en ; https://developers.google.com/admob/android/rewarded "Google rewarded ads policy and Android documentation"
[3]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Review Guidelines"
[4]: https://support.google.com/googleplay/android-developer/answer/13985936?hl=en "Google Play AI-generated-content policy"
[5]: https://legal.applovin.com/policies-publishers/ ; https://support.applovin.com/en/max/unreal/overview/privacy "AppLovin publisher and privacy policy"
[6]: https://docs.unity.com/en-us/grow/levelplay/sdk/android/rewarded-ads-integration ; https://unity.com/legal/content-policy "Unity LevelPlay and content policy"
[7]: https://docs.stripe.com/billing/subscriptions/webhooks ; https://docs.stripe.com/webhooks "Stripe subscription webhooks"
[8]: https://www.gov.uk/online-and-distance-selling-for-businesses "UK distance-selling requirements"
[9]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "ICO Children’s Code"
[10]: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers "FTC endorsement disclosures"
[11]: https://www.asa.org.uk/advice-online/recognising-ads-social-media.html "UK ASA social-media advertising guidance"
