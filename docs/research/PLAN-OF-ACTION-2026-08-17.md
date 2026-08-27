# SynapticGM — Plan of Action (2026-08-17)

**Sources merged:** Product Operating Manual · Outsider/hybrid memory · Ads/Growth/Pre-release (+ §§6–8) · Remaining Launch Ops Omnibus  
**Status:** Planning only. Implement when John opens an update wave.  
**North star:** One visible causal chain — intent → adjudicated outcome → StateTx → scene projection → prose/HUD → save/entitlement — then make that chain safe, solvent, and shippable on **web adult Free**.

---

## First coding slice — SHIPPED (2026-08-17 evening → night)

| Item | Status |
|---|---|
| Expected-revision + speculative retry journal | Shipped |
| SceneManifest + IntroductionPermit | Shipped |
| Ops kill switches | Shipped |
| Stripe Checkout + webhook foundation | Edge stub (needs secrets + deploy) |
| IntentContract + obligation coverage retry | Shipped |
| StateTx adapter (inventory/presence/quest/combat) | Shipped |
| CampaignContract + divergence log | Shipped |
| beatFingerprint retry novelty | Shipped |
| HookArc soft-offer guard | Shipped |
| Quest what-next / Why provenance + HUD Why? | Shipped |
| Combat receipt + leak scanner + GM voice profiles | Shipped |

**Still not code-complete (founder/ops/legal, not “game feel” gaps):** server-authoritative capacity, live Stripe Shop wiring, counsel policy pack, Kid Mode public gate, AppLixir written OK, full a11y release gate, Expert author tools, full comic (No-Go).

**Next optional code:** CI continuity fixtures · contradiction quarantine pager · New Game simplify polish · Memorable hardening only.

**Gameplay-feel research (2026-08-17):** `remaining-gameplay-systems-2026-08-17.md` — research-complete for live feel systems. Parallel-safe after continuity week 2+: a11y Musts, combat telegraph/receipt, quest what-next, inventory readability, VoiceProfile picker, genre tutorial beats. Audio lite / Expert v2 / full mystery board = spike or later.

**Layout + Settings research (2026-08-17):** `layout-settings-screen-inventory-2026-08-17.md` — screens, layout system, settings matrix, theme application, copy bank. **Live-game research stack is complete** for coding. Next research = content generation (campaigns/themes), not more architecture.

**Manus branch (3) complete archive (2026-08-17 night):** `manus-branch3-ingest-2026-08-17.md` + structured copy `pasted/manus-complete-archive-2026-08-17/`. New supporting JSON under `pasted/manus-supporting-json-2026-08-17/`. WOF/MP → `wof/pack-25-…` + `wof/pasted/manus-branch3-mmo-2026-08-17/` (not live). Hybrid-climate files ignored under `pasted/_IGNORE_hybrid-climate-contamination-from-manus-branch/`.

---

## Verdict in one page

| Track | What “best” means | Current gap |
|---|---|---|
| **Game feel** | Ledger and prose never disagree; first hour hooks; long campaigns stay true | Continuity still too soft (manifest/intent/StateTx not hard enough) |
| **Money** | Fair Free → Mid/packs without rage; ads optional and rare | Client-side capacity/tiers; Stripe/webhooks not live; ads stubbed |
| **Trust** | Kid/adult walls, refunds, cancel, no silent loss | Mode isolation + server entitlements + legal pack still open |
| **Ops** | Know within 15 min if turn/pay/ad/safety broke | Analytics + kill switches + support drills incomplete |

**Business:** Yes, conditionally — treat delivery as a **budgeted session**, not unbounded chat (Omnibus §0B).

**Do not build yet:** WOF/MMO, housing, auction, offerwalls, Kid ads, full comic mode, full auto TTS, public BYOK day-one, Play day-one, behavioural analytics/session replay, more generic “memory research.”

---

## Locked product decisions (stop re-deciding)

1. **Authority order:** player correction > pinned canon > StateTx > SceneManifest > evidence > invention  
2. **Launch:** web adult Free first; Play later; Adult BYOK later (isolated)  
3. **Kid Mode:** ad-free; public only after counsel/DPIA/mode tests  
4. **Ads:** Mid/High none; adult Free max **1/day** at start; AppLixir only after **written** approval; house ads fallback; never mid-action  
5. **Offers:** honeymoon = floor; HookArc = guard before soft offer  
6. **Images:** harden Classic + Memorable; **No-Go** full comic for 90 days  
7. **TTS:** selective/accessibility later; not a launch dependency  
8. **Login:** Google now; Discord when demand + link policy ready  

---

## Definition of done — public web adult Free

Ready only when all nine hold (Omnibus §4M):

1. Turns, saves, capacity, payments, ad rewards are **server-authoritative + exactly-once**  
2. No critical RLS / secret / admin / cross-account holes  
3. Adult/Kid boundaries, high-severity safety, reporting, kill switches pass drills  
4. Privacy / consumer / payment / ad / vendor evidence + counsel/policy verification  
5. Cost visible per session; caps; fallback; **15-minute stop-loss** tested  
6. First-session HookArc + no-spend failure paths pass  
7. Regression gates: integrity, safety, entitlements, ads, saves, modes  
8. Restore / rollback / status / support tabletop drill passes  
9. Public claims, pricing, policies, creator materials match the running product  

---

## Workstreams (run in parallel where marked)

### W1 — Continuity integrity (game quality moat)

**From:** Product Manual P0 + Outsider spikes  

| Order | Ship | Done-when |
|---:|---|---|
| 1 | **Expected-revision** commit + speculative retry journal (retry ≠ world change) | Concurrency suite 100% safe; retries never double loot/NPC |
| 2 | **SceneManifest** every accepted turn + hard claim gate | Zero roster/kit/place invents on fixture pack |
| 3 | **StateTx** adapter on inventory / presence / quest / combat outcomes | HUD and prose reconcile on 30 encounters |
| 4 | **IntentContract** obligations | ≥95% test coverage of act/answer/refuse/correct |
| 5 | **CampaignContract** + IntroductionPermit from opening | Premades keep invariants |
| 6 | Control accounts (one owner, one location, open obligations) | Seeded faults caught; <5% false positives |
| 7 | Provenance on high-impact facts + Simple “Why?” | Testers understand source in plain language |
| 8 | Contradiction quarantine + Continuity Pager + orphan/payoff auditor | 100-turn recall up; no silent overwrite |

**Owner:** Code  
**Flag:** `continuity_strict` — can log-only then hard-reject  

### W2 — Launch money & entitlements

| Order | Ship | Done-when |
|---:|---|---|
| 1 | Stripe Checkout + idempotent webhooks → `subscriptions` / packs / cosmetics | Full lifecycle test: buy, renew, cancel, refund, dispute |
| 2 | Server capacity ledger (spend/refund/honeymoon/packs) | No client-only grants; replay/duplicate safe |
| 3 | Cost dashboard + daily budget + kill switches (force Free model / images off / pause signups) | Stop-loss within 15 min in drill |
| 4 | Soft-offer scheduler (HookArc + scene boundary + Mid/High excluded) | Zero interrupted-action offers in tests |
| 5 | AppLixir written eligibility → S2S RewardIntent → **1/day** pilot | Or ship with **ads off** + house ads only |

**Owner:** Code + Founder (vendor/counsel)  

### W3 — Safety, modes, legal

| Order | Ship | Done-when |
|---:|---|---|
| 1 | Server-enforced Kid vs adult isolation (saves, cache, export, images, analytics) | Mode traversal red-team pass |
| 2 | High-severity safety policy + escalation + kill switches | S0 drill complete |
| 3 | Privacy / ToS / Content / Refund / Cookies outlines → counsel review | Evidence pack signed |
| 4 | Account deletion / export path | Rights request drill |
| 5 | Kid Mode **public** gate decision (default: hold) | Explicit Founder sign-off |

**Owner:** Code + Founder + Legal-verify  

### W4 — Reliability, QA, saves

| Order | Ship | Done-when |
|---:|---|---|
| 1 | Checkpoint / projection hash / restore path | Restore game-day drill |
| 2 | Schema version fields + expand/contract migration stub | Old fixture still loads |
| 3 | CI harness: fixtures, claim oracles, RLS negatives, capacity, mode | Release gate green |
| 4 | 30/100-turn regression pack (seeded) | Continuity error non-inferior week over week |
| 5 | Provider fallback / no-spend recovery | Outage playbook works |

**Owner:** Code + Ops  

### W5 — Retention, brand, measurement (after integrity baseline)

| Order | Ship | Done-when |
|---:|---|---|
| 1 | Minimal analytics events (HookArc, accepted turn, refund, purchase, ad, safety) | Consent + redaction tests |
| 2 | New Game / first-10-turns simplification from retention brief | HookArc completion on beta cohort |
| 3 | Landing + 12 proof clips / screenshots (ledger consequence, not AI sludge) | Claim review pass |
| 4 | Feedback inbox + support macros (top 30) | Tabletop ticket exercise |
| 5 | Closed beta 25–100 → soft cohort → expand | Two clean weeks on integrity metrics |

**Owner:** Founder + Code + Ops  

### W6 — Deliberate later (after web stable)

- Discord login  
- Selective TTS (accessibility wedge)  
- Memorable hardening only (not full comic)  
- Locale pack hardening (UK/US/AU)  
- Play store matrix  
- Adult BYOK public  
- Personality picker (Simple 4 profiles) — after HookArc solid  

---

## 90-day calendar (integrated)

| Days | Focus | Parallel OK | Do not |
|---:|---|---|---|
| **1–15** | Continuity: expected-revision + StateTx envelope; Security: RLS/secrets/admin; Capacity idempotency design; Cost event schema | Fixtures scaffold | Weaken claim/manifest for speed |
| **16–30** | SceneManifest + IntentContract; Mode isolation; HookArc events; Privacy data map; New Game simplify | Policy draft to counsel | Ads experiments |
| **31–45** | CampaignContract + IntroductionPermit; Stripe webhooks; Replay/checkpoint; Support tooling; Cost reservation | Landing draft | Client-only entitlements |
| **46–60** | Closed beta; 30/100-turn gates; Incident drills; Vendor written ads decision; Restore drill | Creator outreach (£0) | Paid UA |
| **61–75** | Soft launch small web adult Free cohort; daily cost/safety review; continuity non-inferior | House ads only if needed | Scale or raise ad caps |
| **76–90** | Controlled expansion; **ad pilot only if approved**; D1/D7 holdouts; locale harden | Selective TTS spike optional | Play / comic / BYOK public |

---

## Must-before-public-web (rank order)

1. RLS / auth / secrets / admin controls + negative tests  
2. AI boundary, high-severity safety, mode isolation, kill switches  
3. Ledger / capacity / payment / ad exactly-once reconciliation  
4. Cost ledger, budgets, routing, fallback, daily spend controls  
5. Privacy / DPIA / cookies / consumer / payments policy + counsel verification  
6. HookArc / offer guard, New Game proof, safe no-spend failures  
7. CI fixture / replay / RLS / mode / payment / ad regression harness  
8. Minimal consent-safe analytics + daily/weekly dashboard  
9. Save checkpoint / restore / version / export baseline  
10. Support S0–S3 ladder, status/incident, admin training  
11. Accurate landing / pricing / policy / creator assets  
12. Kid Mode public gating decision (no ads regardless)  

---

## First coding slice (when John says “build”)

**Week-1 vertical slice (recommended):**

1. `expectedRevision` on accept-turn path + retry as speculative take  
2. Compile **SceneManifest** into reserved prompt slot; log (then reject) invents  
3. Stripe entitlement writer stub → real webhook path behind flag  
4. Server-side capacity grant/spend API design (even if phased)  
5. Kill switches: ads off / images off / force Free model / pause signups  

Everything else queues behind that slice.

---

## Research library (don’t lose these)

| Doc | Path |
|---|---|
| Product OS / roadmap | `docs/research/product-operating-manual-best-in-class-2026-08-17.md` |
| Outsider memory | `docs/research/outsider-memory-hybrid-2026-08-17.md` |
| Ads + growth | `docs/research/ads-growth-pre-release-2026-08-17.md` |
| Ads §§6–8 | `docs/research/ads-prerelease-gapfill-6-8-2026-08-17.md` |
| Launch ops omnibus | `docs/research/remaining-launch-ops-omnibus-2026-08-17.md` |
| Continuity review | `docs/research/rivals-edge-memory-review-2026-08-17.md` |

**Stop new research** on generic memory until StateTx / manifest / claim gate / replay / control accounts are evaluated in code.

---

## How to use this plan

1. Founder confirms the locked decisions above (or marks overrides).  
2. When ready to ship code: start **First coding slice**.  
3. Track Must-before-public-web as a checklist; no marketing date until 12 are green.  
4. Beta → soft launch → ads only with written AppLixir OK.  
