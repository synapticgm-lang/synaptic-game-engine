# Manus mega-prompt — Free cohort cost plan, no forced ads (2026-08-19)

**Why this exists:** John cannot guarantee Free players will pay or watch ads. Hosted AI (writer + Klein pictures + paper-doll/item icons) can insolvent him at even a few hundred daily-cap users. He needs a **cost plan that stays playable with $0 revenue and 0% ad fill**.

**Run as a NEW Manus project.** Do not continue WOF, hybrid-climate, or contaminated branches.  
**Bigger is better** — downloadable markdown + CSV/JSON workbook > chat summary. Empty sections = failure.

**Already done (extend, do not reinvent):**
- Pack 12 tiers + 2026-08-19u catalog (`src/game/subscriptionTiers.ts`, `src/game/hostedImageModel.ts`)
- Own-AI vs paid APIs cashflow 2026-08-18 (`docs/research/pasted/own-ai-cashflow-manus-2026-08-18/`)
- E5 monetization + cost stress (`docs/research/pasted/everything-audit-manus-2026-08-18/E5_monetization_and_cost_stress_test.md`)
- Memory/inference cost maxextract 2026-08-18 (`docs/research/memory-cost-maxextract-brief-2026-08-18.md`)
- Memorable beats + schnell extras (`docs/research/memorable-illustration-beats-2026-08-16.md`)
- Decision memo: keep paid narrator; no warm GPU for cost (`docs/research/own-ai-decision-memo-2026-08-18.md`)

**This prompt’s job:** a founder-usable **Free cost envelope** (100 / 1,000 / 10,000 active Free users) under **zero conversion and zero ads**, plus ranked levers (model, caps, cache, image policy, prompt size) that do **not** force ads or sell basic trust.

**Attach (safe):**
1. This prompt  
2. `src/game/subscriptionTiers.ts` (catalog) + `src/game/hostedImageModel.ts`  
3. `docs/research/pack-12-subscription-tiers-models-2026-08-16.md`  
4. Cashflow gap-fill + Fresh Pricing Research Log (18 Aug)  
5. E5 stress test + `E5_unit_economics_inputs_and_formulas.csv`  
6. Optional: memory-cost brief Parts on inference/cache/art skip  

**Do NOT attach:** `.env`, keys, player PII, Kid PINs, WOF, hybrid-climate, Stripe live secrets.

---

## COPY FROM HERE INTO A NEW MANUS PROJECT

```text
NEW PROJECT. Unlimited run. Bigger is better. Prefer many complete downloadable markdown + CSV/JSON files over a chat summary. Empty sections = failure.
Filename prefix: SynapticGM_free_cost_no_forced_ads_2026-08-19

LIVE SynapticGM ONLY. No WOF. No hybrid climate. No patent. No MMO. No self-hosted narrator recommendation.
This is operating-cost engineering, not personalized financial advice. Label every number EVIDENCED / PUBLICLY EVIDENCED / SPECULATIVE / INPUT REQUIRED / COUNSEL.

You are a senior game economist + inference-cost engineer. Mission: design a Free-tier cost plan John can survive if NOBODY ever pays and NOBODY ever watches an ad — without making Free feel broken, and without forcing ads.

# PRODUCT LAW (do not contradict)

- Ledger/corrections/Why?/combat receipt/save integrity stay FREE. Do not recommend paywalling continuity, kit truth, or fairness.
- Ads: OPTIONAL overflow after a completed scene / at a known cap / from Shop. NEVER mid-action, NEVER as the only way to finish a beat, NEVER in Kid Mode. Mid/High remain ad-free.
- Do NOT assume IAP conversion, ad eCPM, or “whales will cover Free.” One required scenario is C=0 and ad_watch=0 forever.
- Memorable pictures default OFF. Images are not canon.
- Hosted path: players do not paste OpenRouter keys. John pays OpenRouter via `generate-image` + `gm-turn` secrets.
- Keep the API narrator. Do not buy a warm GPU or train a custom full writer to “save money.”
- OpenRouter is the one-key router (Gemini + Claude + Flux). Direct Google/Anthropic/BFL is a later ops option, not a new product.
- Player-facing copy: never name D&D / WotC / SRD. No licensed series in content banks.

# REAL CATALOG (2026-08-19u) — use these exact OpenRouter ids unless you prove a cheaper VALID live slug

| Tier | Price | Writer | Art (memorable plates) | Inventory art | Text/day | Memorable/week | New Game hook |
| Free | £0 | google/gemini-3.5-flash-lite ($0.30/$2.50 per MTok PUBLICLY listed Aug 2026) | black-forest-labs/flux.2-klein-4b (~$0.014/first MP) | Klein 4B even when Memorable is off | 12 | 5 | +8 text once |
| Mid | £14.99 | anthropic/claude-haiku-4.5 ($1/$5) | Klein 4B (OpenRouter has no Klein 9B) | Klein | 20 | 20 | +5 |
| High | £29.99 | anthropic/claude-sonnet-4.6 ($3/$15) | black-forest-labs/flux.2-pro (~$0.03/MP) | Klein | 24 | 40 | +3 |

Retired/invalid: black-forest-labs/flux-schnell (OpenRouter “not a valid model ID”). Do NOT send Free art to flux.2-flex (~$0.05). Do NOT put Opus or Flux.2 Max on Free.

Also live:
- Choices/button regen: cheap Free writer (do not burn Haiku/Sonnet on chips).
- Paper-doll + item icons: hosted Klein, do not spend the weekly memorable cap.
- Memorable default: OFF (`classicMemorableImages: false`).
- Optional rewarded ads exist in code (Free +text / +1 memorable) but MUST NOT be required in the plan.
- Opening setup answers are free to the player but still cost John if they hit the writer.
- Failed/empty/abort text turns are supposed to refund the player cap — still may bill the API. Model that.

Prior catalog (16 Aug Pack 12, cheaper Free writer): google/gemini-2.5-flash-lite at ~$0.10/$0.40 per MTok. 3.5 Flash Lite is ~3× input and ~6× output vs that. Treat reverting Free writer as a first-class option, not a quality failure, if the math requires it. Beat AID/F&F on ledger/continuity, not by putting Claude on Free.

# WORKLOAD ANCHORS (SPECULATIVE until CostEvent exists — keep editable)

From 18 Aug cashflow (use as DEFAULTS, not facts):
- 5,000 input + 500 output tokens per accepted writer turn
- 5% retry
- OpenRouter credit loading 5.5%
- 40 accepted turns / Free MAU / month as the PLANNING case
- FX: state USD primary; GBP secondary; cite a dated FX or leave GBP as INPUT

Also model:
- HARD CAP case: 12 text/day × 30 days + one +8 honeymoon + Memorable ON at 5 Klein/week + 1 opener + N inventory icons
- DAU/MAU mix: not all “100 Free players” play every day
- Choice-regen extra call rate (INPUT; default 10–20% of turns)
- Inventory art: 1 portrait + several item icons per new campaign even if Memorable is off

E5 already forbids filling conversion with industry folklore. Keep C and ad_fill as explicit inputs defaulting to 0.

# REQUIRED DELIVERABLES

## D0 — One-page founder memo (read first)
- Can John survive 100 / 1,000 / 10,000 ACTIVE Free users at C=0, ads=0 on the 19u catalog?
- Which single lever saves the most cash with the least player pain?
- What he should ship THIS WEEK vs after telemetry.
- Explicit “do not do” list (forced ads, unlimited, GPU narrator, Flex on Free, selling corrections).

## D1 — Workbook (CSV + formulas in markdown)
Tabs or CSV files:
1. `inputs` — every rate, token, cap, skip, FX, labeled EVIDENCED vs SPECULATIVE vs INPUT REQUIRED
2. `per_turn` — Free/Mid/High writer $ and Klein/Pro $
3. `cohort_100_1k_10k` — planning (40 turns/MAU), engaged (~6 turns/day), hard-cap (12/day)
4. `zero_revenue` — C=0, ad_watch=0; monthly $ and £; $ per MAU
5. `lever_sensitivity` — one-at-a-time: revert Free to 2.5-flash-lite; cut Free to 8 or 6 turns/day; Memorable never auto on Free; no inventory art unless Memorable on; 30%/70% prompt-cache hit; trim input 5k→3k; kill choice-LLM on Free
6. `insolvency_envelope` — max active Free users John can carry at a stated monthly budget. Leave budget as INPUT with examples $50 / $150 / $400 / $1,000

Refresh OpenRouter/BFL list prices with access date. If a slug is invalid, say so — do not invent ids.

## D2 — Ranked lever board (P0 this week / P1 / later)
For each lever: $ saved at 100 and 1,000 active Free (planning + hard-cap), player-visible change, fairness vs AID/F&F/Hidden Door/NovelAI PUBLIC docs, risk to “heard me” / first hour, implementation note (catalog vs cap vs image policy vs prompt assembler vs cache).

Must evaluate at least:
A. Revert Free writer to gemini-2.5-flash-lite (keep 3.5-lite or Haiku as Mid if cost-safe)
B. Leave Free writer on 3.5-lite but cut daily cap 12→8 or 6; keep +8 honeymoon
C. Freeze all Free Klein except when Memorable is explicitly ON (no paper-doll/item-icon surprise spend)
D. Memorable stays off; never auto Chapter One splash on Free until toggle
E. Prompt-cache / stable prefix (cite OpenRouter + Gemini cache public docs)
F. Smaller Free situation packet (ledger facts, not chat dump) — SPECULATIVE token save, need a measurement gate
G. Deterministic choice chips on Free (no second LLM)
H. Optional-only ads after cap (already in product law) — show $ IF fill>0 as upside, never as the plan
I. Direct Google for Free writer only (second key, 5.5% save) — ops cost vs $
J. DeepSeek/Flash-class alternate Free writer — quality/continuity risk, not a silent swap

Do NOT recommend: forced interstitial ads, “watch to send” on every turn, paywalling the current beat, unlimited Free, Flux.2 Flex/Pro on Free, Claude on Free, self-host 7B/70B narrator.

## D3 — Player-facing fairness (no forced ads)
Write exact cap / reset / come-back-tomorrow copy that does not mention ads as required.
Soft-offer rules from E5: upgrade or optional ad only at scene boundary or known empty meter — never after “Open the letter.”
Hidden Door-style “unlimited” is not copyable if unit cost is real; say how to beat them on honesty instead.

## D4 — Competitive posture
Using PUBLIC pages only (AID, Friends & Fables, Hidden Door, NovelAI): what Free model/cap/image they actually advertise. Where SynapticGM should win without a frontier Free writer (ledger, receipts, Kid Mode, Memorable opt-in). Mark UNVERIFIED if you cannot cite.

## D5 — Telemetry gate
Minimum CostEvent fields so the next plan uses measured P50/P95 tokens, image attempts, retries — not 5k/500. This unblocks a second pass. No GPU purchase.

## D6 — Recommended 19v catalog (one table)
Proposed Free/Mid/High writer + image + daily/weekly caps after the math. If you keep 19u, say why the envelope still holds at John’s example budgets.

# QUALITY BAR
- Cite vendor URLs with access date for every price.
- Show formulas, not only totals.
- Separate accepted turn vs billed API call vs player-visible cap.
- Tail users (hard-cap every day) must be visible; averages must not hide them.
- If data is missing, INPUT REQUIRED + what to log — do not invent a conversion rate.

# OUT OF SCOPE
WOF, comic-mode full illustrated launch, Stripe live, counsel legal opinions as settled law, theme cosmetics, GPU narrator.
```
