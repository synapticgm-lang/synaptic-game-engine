# Gemini Score 9–10 Research Roadmap

**Date:** 2026-08-27  
**Audience:** John (engineering + product planning)  
**Status:** Research/planning only — no ship mandate  
**Inputs:** Manus calibrated review pack, 4×300 Gemini autoplay, `2026-08-27w` quality governance ship, existing `docs/research/` library

---

## Executive summary

Gemini’s ~1–3/10 scores are **directionally fair** for the reviewed runs: entity mush, passive GM, semantic pad loops, inspect-XP farming, weak quest spine, and inaudible voice are real. Gemini’s **forensic reliability is poor** (impossible turn cites, cross-run bleed, mislabeled runs) — use it as a defect detector, not an auditor.

**`2026-08-27w` (P0+P1 quality governance)** should move the product from *catastrophically broken* to **rough but playable (~4–5/10 overall)**, with **6–7/10 on visible mush** if typed entity validation works in production. That is the honest ceiling for the current batch.

**9–10 is not achievable from P0+P1 alone.** Manus explicitly caps the present plan at ~4–5/10 on most axes and ~3–4/10 on durability/retention. Reaching 9–10 requires **proven causal play over 300+ turns**: durable NPC memory, mode-specific fantasy fulfillment, resolved encounters with failure economy, quest/branch closure with payoff, content density that survives exhaustion, and evaluation infrastructure that scores **completed arcs** — not banned-string counts.

This document maps **what research is missing**, what we can **reuse**, **prioritized workstreams**, and a **phased path** (A → B → C) where research precedes implementation.

---

## 1. Honest score ceiling: where we are vs where 9–10 lives

| Milestone | Realistic cross-mode band | What it means | What it does *not* mean |
|---|---|---|---|
| **Pre-27w (Gemini baseline)** | ~1–3/10 | Unplayable long sessions; mush + passivity dominate | “Fix prompts” would suffice |
| **Post-27w (P0+P1 wired)** | **~4–5/10** overall; **6–7/10 mush** | Readable, moving, occasionally dangerous; one arc *possible* in 50t | Stable 6/10; genre parity; retention at 300t |
| **Phase A target** | **5–6/10** | Gates pass on clean 12×300; one complete arc per mode in acceptance suite | Beating Hidden Door / CoG on branching |
| **Phase B target** | **6–7/10** | NPC memory + encounter depth + content density proven at 100–300t | FO3 outdoor density; full MMO zones |
| **Phase C target** | **8–9/10** on flagship vertical slices | Human playtest + competitor benchmark parity on *causal arcs* | Universal 9/10 every mode/agent/seed |
| **10/10** | Aspirational on slice, not batch mean | “Would pay / would recommend” on E4-style human sessions | Autoplay critic alone ever saying 10 |

### Why 27w stops at ~4–5/10

Manus score model + calibrated review agree:

| Axis | Post-27w honest band | Hard cap reason |
|---|---:|---|
| Pace | 4–5/10 | Interrupts ≠ flow; whiplash risk without content spine |
| Option quality | 3–5/10 | Dedupe ≠ tactically/causally distinct choices |
| Combat / danger | 3–5/10 | Spawn ≠ resolution; rolls/tactics/failure shallow |
| Voice | 4–5/10 | Perceptible cadence ≠ sustained character; catchphrase risk |
| Mush | 6–7/10 | Typed validation helps surface; identity/continuity gaps remain |
| Long-session durability | **3–4/10** | **NPC memory, branch persistence, content exhaustion unproven** |
| Keep playing? | 3–5/10 | No guaranteed complete objective→payoff arc at 300t |

**Central gap:** 27w optimizes *“something different happened”* → still short of *“the player caused a persistent, legible, genre-appropriate consequence.”*

### What 9–10 actually requires

From Manus blind spots + score model + BIG-UPDATE mode gaps:

1. **Causal arc completion** — objective → obstacle → player choice → persistent delta → reward/cost → follow-on hook, verifiable at T50–100 and still true at T300.
2. **Mode fantasy fulfillment** — separate acceptance bars (LitRPG System+levels+fights; DnD transparent checks; RPG leverage/relationships; PYOA irreversible branches).
3. **Durable actor memory** — goals, knowledge, disposition, commitments, last-interaction summary; no re-introduction loops.
4. **Failure economy** — danger consumes health, time, access, reputation, relationships, or branch state; recovery paths exist.
5. **Content density** — authored beats + procedural injectors so 300t does not exhaust hubs/pads.
6. **Evaluation hygiene** — immutable run manifests; score **arcs**, not vibes; human E4 corroboration for retention claims.

**10/10** additionally requires human playtest proof (E4 green thresholds, proof clips) and competitor-relative “would choose this” on flagship slices — not achievable from Gemini autoplay alone.

---

## 2. Gemini axis map: HAVE vs MISSING

Axes match Gemini executive scorecard (pace, mush/options, combat/danger, quests, voice, durability, keep playing). “HAVE” = spec or code exists; “MISSING” = research/spec gap before next implementation tranche.

### Pace

| | Status | Evidence |
|---|---|---|
| **HAVE** | Forward-Progress Governor (`forwardProgressGovernor.ts`); semantic loop detector + escalation ladder; quest pressure mandates; threat/encounter triggers | `UPDATED-FIX-PLAN-WITH-MANUS.md`, 27w ship |
| **MISSING** | **Pacing rubric per mode** (turns-to-crisis, rest/scene exceptions, hub vs dungeon clocks) | No authored doc |
| **MISSING** | **Anti-whiplash research** — when interrupt is worse than stagnation | Manus warns; no playtest protocol |
| **MISSING** | **Content-backed pacing** — injectors need beat banks, not timers alone | P2 bible densify listed; no density spec |

**Score jump unlock:** Phase A gates + Phase B content density spec (biggest lift: **PYOA**, then **RPG** travel ping-pong).

---

### Mush / hallucinations / option quality

| | Status | Evidence |
|---|---|---|
| **HAVE** | Typed entity validator; inventory conservation; option diversity contract; prose warden + snapshot eval pack (100 scenarios, subset wired) | `typedEntityValidator.ts`, `manus-snapshot-eval-ingest-2026-08-25.md` |
| **HAVE** | Truth stack / SceneManifest / hard gates (Pack 11, competitive continuity brief) | `pack-11-long-memory…`, `SynapticGM_competitive_continuity_brief.md` |
| **MISSING** | **Identity-correctness audit protocol** — wrong noun confidently substituted | Manus: success ≠ zero banned strings |
| **MISSING** | **Action→outcome alignment spec** — next beat must address verb/target/purpose | Blind spot table; no test CSV |
| **MISSING** | **Spatial graph validation research** — roster/exits/ownership vs location sheet | Mentioned; not spec'd |
| **MISSING** | **Immutable eval manifest** — mode/run/seed/build/turn/checksum | Manus #9; not built |

**Score jump unlock:** Phase A manifest + post-27w 12×300 re-run (mush can hit **6–7** quickly); Phase B spatial/action-outcome specs for **DnD** (worst them) and **RPG** (stranger mush).

---

### Combat / danger

| | Status | Evidence |
|---|---|---|
| **HAVE** | Encounter resolution contract (lifecycle, stakes, 3 decisions, aftermath) | `encounterResolution.ts` |
| **HAVE** | Ledger-first combat path; dungeon mob ledger; flee/trap slices | playtest-notes Done (19af–ag) |
| **MISSING** | **Encounter design bible** — genre templates, telegraph→stakes→resolution→aftermath examples | Contract exists; content doesn't |
| **MISSING** | **Failure economy spec** — reversible vs irreversible losses, recovery, difficulty bounds | Manus blind spot |
| **MISSING** | **DnD skill-check choreography research** — investigate/position/party beats at T100 | P2.1 listed; no Manus pack |
| **MISSING** | **Non-combat crisis catalog** for RPG/PYOA (betrayal, deadline, faction move, branch lock) | Manus: combat ≠ consequence |

**Score jump unlock:** Phase B encounter bible ( **LitRPG/DnD** +4–6 axis points); Phase C failure economy ( **RPG/PYOA** retention).

---

### Quests / progression / branches

| | Status | Evidence |
|---|---|---|
| **HAVE** | Quest completion schema; discovery XP ledger; questPlay + sandbox hubs (26k: 6–11 hubs on LitRPG premades) | `questCompletionSchema.ts`, 26k ship |
| **HAVE** | PYOA bibles with six endings; hidden killer (Giltwood); crisis fork builder in schema | bibles catalog |
| **MISSING** | **Quest closure acceptance suite** — full arc per flagship in 50t with terminal state | Gates defined; not automated |
| **MISSING** | **PYOA branch persistence model** — branch-specific facts, locks, delayed payoffs, reconvergence detection | Critical blind spot |
| **MISSING** | **Spine pressure spec** — CK / Thornferry / Cape mid-campaign forced beats | P2.2–P2.3; thin research |
| **MISSING** | **Progress that can't be gamed** — delta quality rubric (player-caused? persisted? payoff?) | Manus warning |

**Score jump unlock:** Phase B branch persistence research (**PYOA** highest ROI); Phase B quest closure suite (**LitRPG** registration→first quest complete).

---

### Voice consistency

| | Status | Evidence |
|---|---|---|
| **HAVE** | Story tones omnibus (18 tones); voice cadence system + cooldowns; folk voice expectations; fluid prose rails | `manus-story-tones-maximize-ingest-2026-08-26.md`, `voiceCadenceSystem.ts` |
| **HAVE** | Blind taste protocol in tones pack (not wired to CI) | `SynapticGM_story_tones…_tone_blind_taste_protocol.md` |
| **MISSING** | **Voice perceptibility rubric** — sampled ordinary turns, no STATUS; ≥70% blind ID | Manus release gate |
| **MISSING** | **Mode×personality matrix** — which voice for which flagship acceptance run | Gemini mislabels voice ids |
| **MISSING** | **Anti-gimmick longitudinal study** — 50t+ without catchphrase loops | Cooldowns shipped; not validated |

**Score jump unlock:** Phase A wire blind-taste protocol to autoplay exports (**all modes**, low cost); Phase B longitudinal voice study for **DnD Dry Wit** + **PYOA army-brief**.

---

### Long-session durability (300t)

| | Status | Evidence |
|---|---|---|
| **HAVE** | Semantic loop detector (8–12t window); novelty budget; meta recovery; progress governor | 27w modules |
| **HAVE** | Pack 11 compression layers (micro/macro summary — partial live) | truth stack in briefing |
| **MISSING** | **NPC memory model spec** — goals, knowledge, disposition, commitments, interaction summary | Named in blind spots; no schema doc |
| **MISSING** | **Content exhaustion metrics** — beat fingerprint saturation, hub revisit rate | Narrative novelty budget is start only |
| **MISSING** | **Relationship/evolution ledger** — static NPC = immersion break at T100+ | Story RPG cap |
| **MISSING** | **300t durability scorecard** — separate from 50t arc gates | Not defined |

**Score jump unlock:** Phase B NPC memory model (**RPG** first, then **LitRPG** factions); Phase C content exhaustion research (**all modes**).

---

### Keep playing? (retention / recommend)

| | Status | Evidence |
|---|---|---|
| **HAVE** | E4 90-minute human playtest protocol + failure taxonomy | `E4_playtest_protocol…` |
| **HAVE** | Fate autoplay 12×300 harness + telemetry JSONL | 26q ship |
| **MISSING** | **Human corroboration requirement** for any ≥7 retention claim | E10: Manus cannot know feel |
| **MISSING** | **Competitor session benchmarks** — same seed length, same rubric, flagship comparisons | `rival_continuity_benchmark.json` exists; not operationalized |
| **MISSING** | **“Complete arc per 50/100t” automated scorer** | Manus gate; manual today |
| **MISSING** | **Endpoint/chapter satisfaction research** — consequence summaries at boundaries | Blind spot |

**Score jump unlock:** Phase A arc scorer on autoplay; Phase C E4 + competitor benchmark study for **8–9** claims.

---

## 3. Concrete research workstreams (not code)

Prioritized by **expected Gemini axis lift per unit effort**. Each workstream ends in a **spec + acceptance fixtures** before implementation.

### WS-1 — Immutable evaluation manifest & critic hygiene (P0 research)

**Problem:** Gemini contamination wasted engineering attention (T424 in 300t runs, cross-bible bleed, mislabeled gemini-06).

**Deliverables:**
- Run manifest schema: `{mode, bible, agent, seed, buildHash, sessionId, transcriptSha256, turnRange}`
- Critic prompt addendum: every quote must resolve or be discarded
- Autoplay export embeds manifest in JSONL header
- **Gemini re-score template** with anti-false-positive rails from `BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md`

**Reuse:** Manus priorities #10; BIG-UPDATE §1B calibration table  
**New work:** Manifest tooling spec + one calibration run doc  
**Unlocks:** Trustworthy before/after for all other workstreams  
**Effort:** Small (1–2 days research + script spec)

---

### WS-2 — Autoplay acceptance gates & arc scorer (P0 research)

**Problem:** 27w acceptance criteria exist in Manus docs but are not one automated report.

**Deliverables:**
- Gate matrix (from Manus release gates) → telemetry field mapping
- **Arc scorer spec:** detect completed objective–obstacle–consequence–reward in transcript + ledger diff
- Mode-specific smoke: 4×1×200 before 12×300
- Scorecard CSV: axis × mode × pre/post

**Reuse:** `MANUS-CALIBRATED-REVIEW.md` §Recommended Ship Order; `fate-autoplay` harness  
**New work:** Arc detection heuristics doc; golden runs for false-positive tuning  
**Unlocks:** Phase A exit; prevents “loop interrupt = progress” self-deception  
**Effort:** Medium

---

### WS-3 — Voice perceptibility rubric & blind-taste CI (P1 research)

**Problem:** Voices wired but Gemini scores 1–2; Manus says “weak cadence,” not missing.

**Deliverables:**
- Sample protocol: N ordinary turns per personality, STATUS stripped
- Rubric: diction, compression, attitude, framing, suppression on grief/danger
- Pass: ≥70% blind ID vs chance
- Longitudinal: 50t catchphrase/loop rate

**Reuse:** `SynapticGM_story_tones…_tone_blind_taste_protocol.md`; `voiceCadenceSystem.ts` triggers  
**New work:** Fixture turns per flagship; adjudication sheet  
**Unlocks:** Voice axis 4→5+ with proof  
**Effort:** Small–medium

---

### WS-4 — Encounter design bible + failure economy (P1 research — highest combat/danger lift)

**Problem:** Encounter resolution contract without authored genre templates = decorative combat.

**Deliverables:**
- **Per-mode encounter templates** (5–8 each): telegraph, stakes, legal responses, roll/check hooks, success/failure, resource delta, aftermath
- **Non-combat crisis catalog** for RPG/PYOA (≥10 patterns)
- **Failure economy spec:** reversible setbacks, bounded irreversible loss, recovery paths, difficulty ceiling
- Scripted test scenarios: initiation → 3 decisions → resolution → persistent cost (Manus blind spot test)

**Reuse:** `encounterResolution.ts` types; 19af–ag combat slices; mode DNA (20s)  
**New work:** Manus commission or internal bible — **no existing doc**  
**Unlocks:** Combat/danger 3–4 → 5–6 on LitRPG/DnD; RPG/PYOA stakes without combat spam  
**Effort:** Medium–large (Manus pack recommended)

---

### WS-5 — NPC memory model (P1 research — highest durability lift for RPG/LitRPG)

**Problem:** Static NPCs reset at T100+; relationship/leverage fantasy fails.

**Deliverables:**
- Authoritative fields: `{goals[], knowledge[], disposition, commitments[], lastInteractionSummary, relationshipDelta[]}`
- Update rules: when GM may mutate vs code-only
- Retrieval: inject on talk/target mention, not full dump
- Acceptance: no re-introduction of named NPC after T20; promise recall test

**Reuse:** Pack 11 Layer 4–5; competitive continuity brief §1; folk voice “named NPC memory wins”  
**New work:** Schema + update contract + 20 scenario CSV (extend E3 continuity red team)  
**Unlocks:** Story RPG durability 3–4 → 6+; LitRPG faction contact depth  
**Effort:** Medium–large

---

### WS-6 — PYOA branch persistence & reconvergence detection (P1 research — highest PYOA lift)

**Problem:** Millstone Charter loops are symptom; root is fake branching.

**Deliverables:**
- Branch state machine spec: `{branchId, exclusiveFacts[], locks[], costs[], delayedPayoffs[]}`
- **Paired replay protocol:** same seed, divergent choice at node K, diff at T+10/T+30
- Reconvergence detector metrics
- Crisis fork catalog tied to Thornferry + 2 PYOA bibles

**Reuse:** `questCompletionSchema.buildCrisisFork`; PYOA bibles; story tones `pyoa_branching_crisis` gates  
**New work:** Full branch persistence model — **critical gap**  
**Unlocks:** PYOA option quality + keep playing (currently weakest mode)  
**Effort:** Large (Manus + paired autoplay)

---

### WS-7 — Content density & spine pressure spec (P1 research — pace + keep playing)

**Problem:** 26k floored hubs (~6–11) but CK/Cape/Thornferry thin; 300t exhausts pads.

**Deliverables:**
- **Density targets per mode:** hubs, contacts, beats, reveals, encounter slots per 100t
- Flagship spine maps: Summoned Pact, Cursed Keep, Salt Road, Thornferry (turn bands T0–30, T30–100, T100–300)
- Injector beat banks: what code may force vs what GM freely narrates
- Honest FO3/CoG **not parity** notes — wedge targets only

**Reuse:** 26k/26j sandbox tables; P2.1–P2.3 in BIG-UPDATE; `opener_pointer_examples.md` (mega pack)  
**New work:** Turn-band beat maps; exhaustion metrics  
**Unlocks:** Pace + keep playing post-27w; prevents hub simulator at T150  
**Effort:** Medium (much is curation + Manus densify commission)

---

### WS-8 — Mode acceptance suites (P1 research)

**Problem:** Shared anti-loop metrics judge PYOA like LitRPG.

**Deliverables:**
- Four suite specs with **mode fantasy checklist** and minimum arc narrative
- LitRPG: registration → quest step → fight → level tick → hub discover
- DnD: ≥3 skill-check moments + 1 resolved encounter by T100
- RPG: ≥5 named contact/leverage beats by T100
- PYOA: ≥1 exclusive crisis fork by T30; labeled branch node by T150 (50% runs)

**Reuse:** BIG-UPDATE P2 table; UPDATED-FIX-PLAN acceptance; E4 tasks  
**New work:** Suite JSON + expected ledger snapshots  
**Unlocks:** Honest mode comparisons; stops optimizing wrong mode  
**Effort:** Medium

---

### WS-9 — Competitor benchmarks (P2 research — required for 8–9 claims)

**Problem:** No operational “same rubric, same length” comparison.

**Deliverables:**
- Benchmark protocol: 100t and 300t on comparable prompts (isekai registration, keep exploration, mystery leverage, CYOA crisis)
- Rivals: AI Dungeon, Hidden Door, CoG-style branching (manual or recorded baselines)
- Rubric: causal arc count, mush rate, loop rate, memory failure, would-continue (human subset)
- Output: `competitor-benchmark-2026-XX.md` + redacted transcripts

**Reuse:** `SynapticGM_competitive_continuity_brief.md`; pack-11 competitor table; E10 evidence rules  
**New work:** Run protocol + human subset — **cannot be desk research only**  
**Unlocks:** Credible 8–9 on slice vs “we fixed our bugs”  
**Effort:** Large

---

### WS-10 — Human playtest gate (P2 research — required for 9–10 retention)

**Problem:** Autoplay agents optimize inspect-XP; humans judge feel.

**Deliverables:**
- E4 runs post-Phase A on LitRPG + PYOA (minimum)
- Debrief + proof clip criteria unchanged
- Map E4 dimensions → Gemini axes
- Stop-line: any P0 (correction loss, forced quest, kit lie) blocks 7+ retention claim

**Reuse:** `E4_playtest_protocol_john_can_run_tonight.md`; failure taxonomy  
**New work:** Scheduled sessions after autoplay gates pass  
**Unlocks:** Keep playing? axis above autoplay ceiling (~5)  
**Effort:** Medium (John time)

---

## 4. Prioritization by mode (biggest score jumps)

Ranked by **Δaxis × mode pain** from 4×300 telemetry + Manus projections.

| Priority | Mode | Weakest axes today | Research first | Expected lift after Phase A+B |
|---:|---|---|---|---|
| 1 | **PYOA** | Options, keep playing, durability (3–4 ceiling) | WS-6 branch persistence + WS-7 Thornferry spine + WS-4 non-combat crises | **5–6** overall; branching axis **6–7** if reconvergence fixed |
| 2 | **Story RPG** | Mush (stranger), options (Walk-away), durability | WS-5 NPC memory + WS-7 Cape/Salt Road density + WS-4 leverage crises | **5–6**; mush **6–7** with entity work already shipped |
| 3 | **Tabletop (DnD)** | Mush (them 60–70), combat, voice | WS-4 encounter bible + WS-8 DnD suite + WS-3 Dry Wit rubric | **5–6**; combat **6** with resolved encounters |
| 4 | **LitRPG** | Combat, XP/levels, System voice | WS-7 density (already best hubs) + WS-4 + WS-2 arc scorer | **5–6**; systems **6** if level≥2 + fight by T50 proven |

**Cross-mode (do first):** WS-1 manifest, WS-2 gates — otherwise mode work is unmeasurable.

---

## 5. Phased path: research BEFORE implementation

### Phase A — Prove 27w floor (~5–6/10 credible)

**Goal:** Validate that P0+P1 is **deep implementation**, not prompt theater. Exit rough playability with measured uplift.

| Order | Research / verification | Implementation dependency | Exit criterion |
|---:|---|---|---|
| A1 | WS-1 immutable manifest | Autoplay export spec | 12×300 pack with zero invalid cites |
| A2 | WS-2 acceptance gates + arc scorer | Telemetry mapping doc | Gates pass on ≥8/12 runs |
| A3 | Re-run 12×300 + Gemini pack with manifest | None (verification) | Mush ≤ targets; ≥1 arc/50t on LitRPG/DnD maxlevel |
| A4 | WS-3 voice blind-taste (sample) | Rubric only | ≥70% ID on Cold Registrar / Dry Wit sample |

**Honest ceiling if A fails:** Stay at **3–4/10** — 27w superficial or miscalibrated.  
**Honest ceiling if A passes:** **5–6/10** on fixed axes; mush **6–7**.

**Reuse heavily:** All Manus 2026-08-27 docs; snapshot eval subset; fate-autoplay.  
**Do not start Phase B implementation until A3 complete.**

---

### Phase B — Depth layer (~6–7/10)

**Goal:** Fix blind spots that cap durability and genre fantasy.

| Order | Research workstream | Spec output | Primary mode lift |
|---:|---|---|---|
| B1 | WS-5 NPC memory model | Schema + 20 scenario CSV | RPG, LitRPG |
| B2 | WS-4 Encounter bible + failure economy | Template pack + crisis catalog | LitRPG, DnD, RPG |
| B3 | WS-6 PYOA branch persistence | Branch FSM + paired replay protocol | PYOA |
| B4 | WS-7 Content density / spine maps | Turn-band beat maps for 4 flagships | All |
| B5 | WS-8 Mode acceptance suites | 4 suite JSON + ledger snapshots | All |
| B6 | WS-3 voice longitudinal (50t) | Extended blind-taste report | DnD, PYOA |

**Implementation follows specs** — not parallel.  
**Exit criterion:** 300t runs hit durability metrics; mode suites pass; PYOA paired replay shows divergent state at T+30.

**Honest ceiling:** **6–7/10** on flagships; cross-mode mean **6** if PYOA branch work lands.

---

### Phase C — Excellence slice (~8–9/10)

**Goal:** Competitor-credible flagship experiences; human-validated retention.

| Order | Research workstream | Notes |
|---:|---|---|
| C1 | WS-9 competitor benchmarks | Same rubric, 100–300t |
| C2 | WS-10 E4 human playtest (×2 modes min) | Required for keep playing >7 |
| C3 | Content commission — Manus densify CK/Cape/Thornferry to density spec | Authoring, not engine |
| C4 | Spatial + action-outcome alignment specs | Polish mush/ agency ceiling 7→8 |
| C5 | Chapter boundary / endpoint satisfaction study | “Satisfying endpoint” blind spot |

**9/10 claim scope:** Named flagship + agent + seed slice with human + benchmark corroboration.  
**10/10:** Exceptional human session + proof clip; not batch autoplay mean.

**Not in Phase C without new evidence:** Full FO3 zone density, MMO outdoor art, Expert author tools, full comic — remain Waiting per playtest-notes.

---

## 6. Reuse vs gaps (research library)

### Reuse now (ingested, on-point)

| Asset | Path | Use for |
|---|---|---|
| Manus calibrated review + score model | `docs/bugs/gemini-reviews-2026-08-27/MANUS-*.md` | Ceiling honesty, gates, blind spots |
| Updated fix plan | `UPDATED-FIX-PLAN-WITH-MANUS.md` | P0/P1 contract text |
| 4×300 ship plan + calibration | `BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md` | Mode pain table, anti-bleed |
| 27w implementation | `IMPLEMENTATION-COMPLETE-2026-08-27.md` + `qualityGovernance.ts` | Baseline for A3 verification |
| Snapshot eval pack | `manus-snapshot-eval-ingest-2026-08-25.md` | Entity/warden fixtures |
| Story tones + blind taste | `manus-story-tones-maximize-ingest-2026-08-26.md` | WS-3 voice rubric |
| Folk NPC dialogue | `manus-folk-npc-dialogue-ingest-2026-08-19.md` | NPC voice when memory lands |
| E4 playtest protocol | `E4_playtest_protocol…` | WS-10 human gate |
| E3 continuity red team | `E3_continuity_red_team_simulations.md` | Extend for WS-5 scenarios |
| Competitive continuity brief | `SynapticGM_competitive_continuity_brief.md` | Truth stack; WS-9 framing |
| Pack 11 memory architecture | `pack-11-long-memory-antihallucination-sp-mp-2026-08-gemini.md` | WS-5 layers (do not re-architect) |
| E10 boundaries | `E10_what_manus_still_cannot_know.md` | Stop over-research; require traces |
| Error fix classes | `ERROR-FIX-LOG.md` | Patch taxonomy |
| Sandbox floor 26k | playtest-notes Done | WS-7 starting counts |

### Gaps — need new Manus / Gemini / playtest cycles

| Gap | Suggested commission | Phase |
|---|---|---|
| NPC memory model (authoritative schema) | Manus: “NPC Memory Contract for SynapticGM SP” | B1 |
| Encounter design bible + failure economy | Manus: “Genre Encounter & Consequence Templates” | B2 |
| PYOA branch persistence FSM | Manus: “Branch State + Paired Replay Spec” | B3 |
| Content density turn-band maps (4 flagships) | Manus or John curation | B4 |
| Immutable eval manifest tooling | John/Cursor script spec | A1 |
| Arc scorer heuristics | Cursor research + golden transcripts | A2 |
| Competitor 300t benchmarks | Manual + recorded sessions | C1 |
| DnD skill-check choreography at T100 | Manus after B2 | B5 extension |
| Spatial graph validation spec | Manus or extend snapshot pack | C4 |
| Action→outcome alignment tests | New CSV fixture pack | C4 |

### Gemini cycles (when to re-run)

| When | Pack | Purpose |
|---|---|---|
| After A3 | 12×300 with manifest | Measure 27w uplift honestly |
| After B5 | 12×300 mode suites | Durability + genre axes |
| After C1 | 4×300 flagship + human notes | 8–9 slice claim only |

**Always:** Bind run identity; discard cross-genre quotes; separate numeric XP from narrative progression (Manus calibration).

---

## 7. What NOT to research (time sinks)

- **Full Continuity-Warden LLM critic** — classifier-only; extend `applyErrorRepairs` / deterministic gates (`ERROR-FIX-LOG`, playtest-notes).
- **Bible-isolation megaproject** from false Gemini cross-map claims (0 hits on RPG/PYOA pack).
- **Mustache / `[Location.Name]` frontend theory** — not evidenced.
- **WOF / MMO zone art** — isolated under `wof/`; does not lift live Gemini scores.
- **Re-architecting memory from Pack 11** — implement NPC contract as extension of existing truth stack.
- **Chasing Gemini 10/10 on autoplay alone** — agents farm inspect; humans required for retention.

---

## 8. Recommended next actions (John)

1. **Run Phase A3** — 12×300 on `2026-08-27w` with WS-1 manifest embedded (even if manifest is manual first pass).
2. **Commission Manus WS-6 + WS-4** in one brief if budget allows — highest PYOA + combat lift.
3. **Wire WS-3 blind-taste** on exported transcripts before next personality work.
4. **Hold Phase B implementation** until arc scorer (WS-2) shows ≥1 complete arc/50t on two modes — otherwise you will optimize telemetry, not play.

---

## 9. File map

| Doc | Role |
|---|---|
| `docs/bugs/gemini-reviews-2026-08-27/MANUS-CALIBRATED-REVIEW.md` | Honest uplift + blind spots |
| `docs/bugs/gemini-reviews-2026-08-27/MANUS-SCORE-MODEL.md` | Axis projections |
| `docs/bugs/gemini-reviews-2026-08-27/MANUS-PRIORITIES-AND-BLIND-SPOTS.md` | Forward-Progress Governor contract |
| `docs/bugs/gemini-reviews-2026-08-27/UPDATED-FIX-PLAN-WITH-MANUS.md` | P0/P1 board |
| `docs/bugs/gemini-reviews-2026-08-27/BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md` | Cross-mode failures |
| `docs/bugs/gemini-reviews-2026-08-27/IMPLEMENTATION-COMPLETE-2026-08-27.md` | 27w module list |
| **This doc** | Research roadmap to 9–10 |
| `docs/research/manus-snapshot-eval-ingest-2026-08-25.md` | Warden fixtures |
| `docs/research/manus-story-tones-maximize-ingest-2026-08-26.md` | Voice research |
| `docs/research/pasted/everything-audit-manus-2026-08-18/E4_playtest_protocol_john_can_run_tonight.md` | Human gate |

---

## One-line truth

**27w buys ~4–5/10 and stops the bleeding; 9–10 requires researched NPC memory, branch persistence, encounter/failure depth, content density, clean measurement, and human proof — in that order.**
