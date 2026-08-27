# Recommended ship bundle — research synthesis (2026-08-27)

**Status:** Planning only — no game code until John authorizes ship.  
**Sources:** Manus BIG CHANGES T7/T12, LitRPG pacing research, Gemini 09–12 calibrated reviews, Manus calibrated review, UPDATED-FIX-PLAN-WITH-MANUS, playtest-notes open board.

---

## 1. One recommended primary bundle

**Ship Manus Path A (T7 Options 1 + 2 + 3)** — authoritative pre-GM commits, Beat/Encounter Contract Registry, graph-derived Choice Compiler — as **one coordinated architectural batch**, not another scrub or prompt-rail pass.

**LitRPG pacing (bundles B + F from pacing doc, wired to BeatContract):**

- **B — Opening arc chunk XP:** Circle’s Price (and analogs) award **+40–50 XP on coded stage commits**, not inspect drip.
- **F — First Blood by T15:** ArcDirector schedules a hub skirmish / contract-hall fight if `turnsSinceEncounter > N` (extends LitRPG T4 gate: encounter by T6–8, combat round committed).
- **A (gentle curve):** L1→L2 **200 XP** (not 300) so mixed-path Free day-1+2 can see a level tick when receipts land.
- **E (inspect once-per-evidence-id):** Wave-2 fast relief — repeat inspect of unchanged state earns **0 XP**; primary pad drops exhausted evidence edges.

**P1 items in the same batch (mode slices, not deferred):**

| P1 | Manus / T7 | Mode | Why in primary bundle |
|---|---|---|---|
| Receipt liveness gates (I04) | Wave 0–1 eval | All | Fail missing combat/crisis/leverage receipts at T4–12, not T300 |
| Hub beat exhaustion + gate disposition (Opt 7) | Wave 2 | LitRPG | Fixes gateQueue **65–100** regression; every rejected gate gets typed disposition |
| NPC topic FSM (Opt 5) | Wave 2 | DnD / RPG | Aldous/Oskar recycle (~142–154×), relationship stagnation |
| Pressure clock (Opt 6) | Wave 1–2 | All | Director spine; anchor deadlines for Free 12–20t hook |
| PYOA crisis deck + branch ledger (Opt 8 + 9) | Wave 1 slice | PYOA | Millstone Charter **288×**, zero forks/endings — crisis by T4, branch lock by T8 |
| Social milestone ledger (Opt C) | Wave 1–2 | LitRPG talk | Listen/overhear/negotiate → **15–25 XP once** + visible System ping at T12 |
| Retain from 27w | — | All | `typedEntityValidator`, `inventoryConservation`, hardened `discoveryXpLedger`, `metaInputRecovery` under new authority layer |

**Why this bundle (2–3 sentences):** Critics and telemetry agree the product fails because **nothing authoritative commits world change before the GM narrates** — pads recycle (180–260×), combat/crisis receipts are **zero in 300t all modes**, and inspect drip (~90% of XP) rewards the exact anti-play loops Gemini flags. Path A inverts authority so quest stages, encounters, leverage deltas, and PYOA branch locks **cannot be declined**; ChoiceCompiler and exhaustion rules break semantic pad basins; LitRPG B+F+A align rewards with **receipts** so Free T1–12 shows stakes, progress chrome, and a fight path without another inspect grind or Free model cost blowup.

---

## 2. Phased ship plan

Score bands from Manus T6/T12 (honest, not additive). Pre-fix baseline ≈ **1–3/10** playable; 27w partial wins (them ↓31%, 7/12 L2) did **not** break the failure cluster.

### Wave 0 — Trust the ledger

**Build:** Immutable run manifest (I06), event envelope, atomic/idempotent `StateTx`, deterministic replay, eval quarantine for critic cells.

**Expected uplift:** **~2–3/10** — no player-facing change yet; stops contaminated Gemini cycles and proves state hash replay.

**Exit:** Every quote/score binds to mode/run/seed/build; replay reproduces final state.

### Wave 1 — Authority + one vertical slice per mode

**Build:** `BeatContract` registry (3–5 contracts/mode), shadow then active `ArcDirector`, mode resolvers (I05), LitRPG B+F+A on Summoned Pact slice, PYOA 8+9 starter crisis/branch, pressure-clock skeleton.

**Expected uplift:** **4.5–5.5/10** on enabled slices — first-session gates pass: LitRPG objective→encounter→combat round by T8; DnD check by T5; RPG leverage delta by T6; PYOA crisis by T4 / branch lock by T8.

**Exit:** Forced GM timeout leaves committed ledger unchanged; ≥1 durable meaningful delta every 3–5 active turns in slice runs.

### Wave 2 — Choice authority + exhaustion

**Build:** `ChoiceCompiler` primary pads (Opt 3), semantic fingerprint cooldown, hub/gate disposition (Opt 7), NPC topic FSM (Opt 5), evidence-id inspect exhaustion (Opt E/4), social milestone ledger (Opt C), daily milestone bonus (Opt D — low cost).

**Expected uplift:** **5–6.5/10** portfolio — pad families drop below 25% in 50-turn window; gateQueue ≤5 alone; inspect XP share ≤40%; mush stays **6–7/10** if entity validation retained.

**Exit:** Adversarial inspect/wait/walk-away policies **terminate** (exhaust edges) rather than loop 300t.

### Wave 3+ (separate batches — not in primary bundle)

| Wave | Focus | Expected band |
|---|---|---|
| 3 | Sealed manifest, one repair max, deterministic fallback prose | Stability under GM fail; no rollback |
| 4 | Clean 12×300 + Free 20-turn hook study (T8 liveness) | Validates **4.5–6.5** claim under manifest |
| 5 | Voice cadence (P1.4), optional stagnation-only Mid writer (Opt 10) | +0.2–0.7 voice; **only if** Waves 0–4 pass |

**Three-batch horizon (Waves 0–4 + content depth):** **7.0–8.5/10** — not schedulable in one sprint.

---

## 3. What we defer (and why)

| Deferred | Why |
|---|---|
| **Option 10 — stagnation-only Mid writer** | Manus T10/T12: cost + variance; **produces eloquent mush** if authority unfixed. Wave 5 only, capped, after liveness gates pass. |
| **Full 9–10 / three-year roadmap** | Requires human retention, rich content, trusted manifests — **not a commit** (T6). |
| **Scrub-only or prompt-only batch** | 27w proved mandates without commits underperform; explicit reject (T10). |
| **Second LLM critic / Continuity-Warden planner** | Cost, latency, non-authoritative; workspace rule + Manus reject. |
| **Default stronger Free model** | Cost blowup; no authority fix (T10 #5). |
| **Random ambush timers** | Arbitrary receipts; genre-inappropriate for RPG/PYOA (Manus blind spot: combat ≠ consequence). |
| **Premium themes / five-rater shop parity** | Waiting on playtest of 19t Vampire rescue; **not on critical path** for mush/pads/passive GM (playtest-notes Waiting). |
| **Full skill tree / MMO zone depth** | Presentation without spine; after Path A proves receipts. |
| **Daily milestone D alone without B+F** | Retention quick win insufficient — **does not fix combat path** (pacing doc §9). |
| **Path C (Fast loop relief: 1+3+4 only)** | Acceptable emergency subset but **thin mode arc depth**; use only if Wave 1 slips — not primary recommendation. |

---

## 4. John decision table (2–3 choices only)

| # | Decision | Recommended default | If you choose differently |
|---:|---|---|---|
| **1** | **Authorize Path A structural batch** (Options 1+2+3 + Wave 0–2 scope above) | **Yes — ship as next update** | Pick Path C (1+3+4) only for faster pad/inspect relief with weaker arc depth; or delay until live playtest paste merged. |
| **2** | **Free T12 hook success metric for talk-heavy players** | **Quest stage-2 + STATUS receipt** (Circle’s Price stage commit, faction Δ, or System perk ping) — level bar ≥25% is secondary | If you require **literal L2 tick by T20** on talk-only, confirm **200 XP curve (A)** + social milestones (C) — fight path still needs F/ArcDirector. |
| **3** | **Stagnation Mid writer (Opt 10) after Wave 4** | **No / defer** — revisit only if Flash Lite fails voice on committed scenes | Yes only with **per-session cap + token ceiling**; never as substitute for 1+2+3. |

Everything else in the T7 menu (15 options) is **pre-decided by engineering** inside the recommended bundle or deferred per §3. No need to pick A vs B vs C vs D paths individually — **Path A (Structural reset) subsumes the cross-mode evidence.**

---

## 5. Evidence citations

### Cross-mode (what people wanted)

| Want | Evidence | Bundle answer |
|---|---|---|
| Meaningful consequence every few turns | Manus calibrated review §4 Forward-Progress Governor; 27w zero combat/crisis receipts | ArcDirector pre-GM commits (Opt 1) + pressure clock (Opt 6) |
| Stop mush | Gemini 09–12: them/stranger/this-place; Manus: entity validation not scrub | Retain 27w `typedEntityValidator`; render from sealed manifest |
| Stop passive GM | All four Gemini 09–12: zero combat, no forced stakes | BeatContract + mode resolvers (Opt 2, I05) |
| Stop pad loops | Telemetry: 180–260× Walk away/Inspect/Charter; streakMax 2–4 | ChoiceCompiler (Opt 3) + exhaustion (7, 5, E) |
| Free hook: return tomorrow **YES** | Gemini 09–12 unanimous **NO** — T1–12 no momentum, pad traps | T4 liveness + LitRPG B+F+C + PYOA 8+9 early receipts |
| NOT scrub-only / NOT inspect grind / NOT cost blowup | 27w underperformed 4–5 projection; Manus T10 rejects | Path A; Opt E anti-farm; defer Opt 10 |

### By mode

| Mode | Calibrated failure | Source | Primary bundle lever |
|---|---|---|---|
| **LitRPG** | 5 XP @ T12; L2 @ T265; gateQueue 65–100; zero combat | `gemini-09`, pacing doc §2–3, ingest §27w audit | ArcDirector + hub disposition (7) + B+F+A + social C |
| **DnD** | Aldous/Oskar recycle; zero dice/combat; Dry Wit absent | `gemini-10`, ingest alignment table | BeatContract keep spine + check resolver (I05) + NPC FSM (5) |
| **RPG** | Walk away/Inspect 240–260×; no leverage | `gemini-11`, ingest | ChoiceCompiler + leverage commits + NPC FSM (5) |
| **PYOA** | Millstone Charter 288×; no crisis forks/endings | `gemini-12`, ingest | Crisis deck (8) + branch ledger (9) on ArcDirector |

### Telemetry anchors

- Batch: `scripts/fate-autoplay/runs/modes-agents-300t-2026-08-27T12-07-17-166Z/`
- LitRPG s18: T12 **5/300 XP**; L2 **T265**; inspect ~93% STATUS XP
- LitRPG maxlevel s1: **L1 282/300 @ T300**; gateQueue **100**
- Score ceiling one batch: **4.5–6.5/10** (Manus T6/T12); three batches **7.0–8.5/10**

### Explicit rejects (aligned with player/critic “not wanted”)

- Prompt-only interrupt, scrub-only, random ambush, second LLM critic, default stronger Free — Manus T10/T12, playtest-notes 27w residual risks.

---

## Summary for John

**Best single bet:** Manus **Path A (1+2+3)** with **LitRPG genre-honest pacing (B+F+A+E)** and **mode P1 slices (5, 6, 7, 8, 9, C)** in Waves 0–2 — authority inversion first, not another governance tweak.

**You still choose:** (1) authorize that structural batch, (2) whether Free T12 hook is **quest stage-2** vs **must level**, (3) whether to ever fund stagnation Mid writer after Wave 4 (default **no**).

**Do not choose:** 15-way T7 menu, premium themes, or Mid writer now — research already ranked them.

---

## File map

| Doc | Role |
|---|---|
| `docs/research/manus-big-changes-ingest-2026-08-27.md` | BIG CHANGES executive summary |
| `docs/research/litrpg-level-pacing-and-free-hook-2026-08-27.md` | Pacing bundles A–G |
| `docs/research/pasted/manus-big-changes-2026-08-27/T7*.md` | Ten architectural options |
| `docs/bugs/gemini-reviews-2026-08-27/gemini-09` … `gemini-12` | Mode-calibrated failures + Free hook NO |
| `docs/bugs/gemini-reviews-2026-08-27/MANUS-CALIBRATED-REVIEW.md` | Honest uplift + Forward-Progress Governor |
| `docs/bugs/gemini-reviews-2026-08-27/UPDATED-FIX-PLAN-WITH-MANUS.md` | Supersession of 27w incremental plan |
| `docs/research/manus-big-changes-implementation-backlog-2026-08-27.md` | B001–B045 waves |
