# Updated Fix Plan — Incorporating Manus Calibration

**Date:** 2026-08-27  
**Base plan:** `BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md`  
**Manus docs:** `MANUS-CALIBRATED-REVIEW.md` + `MANUS-PRIORITIES-AND-BLIND-SPOTS.md` + evidence + score model  
**Status:** Waiting — do **not** ship until John asks for the next update.

## Executive Summary

Manus's calibrated review confirms Gemini's **core diagnosis is directionally right** but **forensic reliability is poor**. The P0/P1 plan will move from "catastrophically broken to rough but playable" with scores reaching **4–5/10** (isolated 6–7 for mush if done right). Cannot honestly claim 6/10 overall without the **Forward-Progress Governor** and deeper implementation.

### Manus's Key Addition: Forward-Progress Governor (P0+)

> **If only one additional P1 item can ship beyond the P0 board, ship a deterministic "meaningful state delta" contract.**

This is the **highest bang-for-buck** because it lifts multiple axes simultaneously: pace, agency, quest progression, option quality, long-session durability, and keep-playing propensity. It closes the gap that hard interrupts and ambushes don't: **changing the scene without changing the campaign**.

## Manus's Implementation Warnings

| Existing fix | Superficial version (will fail) | Version that earns projected uplift |
|---|---|---|
| Mush scrub | Delete or substitute banned strings after generation. | Generate from typed entities, validate referents, regenerate once, and use explicit-noun fallback with telemetry. |
| Hard interrupt | Spawn combat after five identical text strings. | Detect semantic non-progress, use proportional escalation ladder, commit persistent consequence. |
| Pad dedupe | Compare exact option text. | Canonicalize semantic role and require replacement choices with distinct likely outcomes. |
| XP retarget | Lower inspect XP globally. | Use one-time discovery ledger; reward novelty, risk, quest movement, and resolution. |
| Threat decay | Add random ambush timer. | Telegraph pressure, choose genre-appropriate crises, preserve causality, resolve consequences. |
| Voice rails | Insert recurring catchphrases or style labels. | Alter diction, compression, attitude, framing while applying cooldowns and scene-tone suppression. |
| Quest pressure | Reprint objective in every STATUS block. | Make world actors, deadlines, access, consequences move the objective forward or toward failure. |
| Bag lock | Maintain a list of item names. | Track ownership, quantity, equipped/consumed/dropped/loaned state, provenance, conservation. |

---

## Updated P0 Board (Critical - Honest 4/10 floor)

### P0.0 — Forward-Progress Governor (NEW - Manus #1 priority)

**What:** After each turn, compare authoritative pre-turn and post-turn state. During an active objective, permit no more than **3–5 turns without a meaningful persistent delta**.

**Meaningful delta** = change to at least one of:
- Quest stage, obstacle resolved, deadline worsened, objective failed, or next objective unlocked
- New actionable fact discovered and recorded (not repeated inspection)
- Route opened, area closed, position materially changed, or travel cost paid
- NPC relationship, commitment, suspicion, availability, faction position, or condition changed
- Threat escalated, avoided at cost, resolved, or created persistent complication
- Item consumed/acquired/lost, health/time changed, debt incurred, leverage gained
- Character condition, ability state, reputation, injury, or meaningful progression changed

**Contract requirements:**
1. **Bounded progress:** ≥1 delta every 3–5 turns during active objective (excluding deliberate recovery scenes)
2. **Causal linkage:** Delta must be attributable to player action, telegraphed threat, or established NPC agenda
3. **Persistence:** Written to authoritative ledger **before** prose rendering
4. **Visibility:** Narration and STATUS expose the change without dumping implementation detail
5. **Closure:** Completed objective produces reward, cost, unlock, relationship change, or new objective

**Owner:** Turn orchestration layer + ledger-diff comparator  
**Acceptance:** Telemetry shows ≥1 meaningful delta per 3–5 active turns; state persists 5 turns later

---

### P0.1 — Typed Entity Validator (upgraded from string scrub)

**What:** Generate from typed scene entities → validate referents → regenerate once → explicit noun fallback with telemetry flag.

**Not:** Delete `them`, `this place`, `the stranger` after generation.

**Owner:** `proseWarden` + `choicePad` + entity authority  
**Acceptance:** 
- themWordHits ≤10 on DnD 300t
- stranger body ≤20 on RPG/PYOA
- 0 broken-stranger options
- Track invalid references per 100 turns + regeneration rate

---

### P0.2 — Semantic Loop Detector + Context-Sensitive Escalation (upgraded from identical-string counter)

**What:** Canonicalize intent as action type + target + purpose over last 8–12 turns. Use proportional escalation ladder: warning → time/resource cost → NPC/world response → complication → crisis → combat when appropriate.

**Not:** Spawn combat after ≥5 identical text strings only.

**Owner:** Turn pipeline + escalation governor  
**Acceptance:** 
- No semantic option family >25% of options in 50-turn window
- No non-progress window >5 turns during active objective
- Escalation is telegraphed, causally linked, and genre-appropriate

---

### P0.3 — Option-Set Diversity Contract (upgraded from pad filter)

**What:** Require distinct action–target–consequence profiles. Default: one objective-forward option, one risky/high-upside, one social/world, one disengage/reposition when legal. Dedupe operates on **semantic role**, not only wording.

**Not:** Just compare exact option text.

**Owner:** `choicePad` + option assembly  
**Acceptance:**
- LitRPG gateQueueOptionHits ≤5 alone
- PYOA charter-option ≤1 per 5 turns once examined
- Replacement options grounded in legal scene entities with distinct outcomes

---

### P0.4 — Inventory State Transitions (upgraded from name-list bag lock)

**What:** Track ownership, quantity, equipped/consumed/dropped/loaned state, provenance, and conservation. Assert conservation across turns.

**Not:** Just maintain a list of item names.

**Owner:** Item authority + state ledger  
**Acceptance:**
- 0 `[Uncommon] them`
- Bag stable across 50 bag-check turns
- Consumed/dropped/equipped state transitions validated

---

## P1 Board (High Impact - Push toward 5/10)

### P1.1 — One-Time Discovery + XP Ledger (upgraded from "lower inspect XP")

**What:** Record inspection rewards by scene/object/fact. First discovery/risk/resolution earn XP; repeated inspection of unchanged state earns zero.

**Not:** Just lower inspect XP globally.

**Owner:** `xpCode` + discovery ledger  
**Acceptance:**
- maxlevel LitRPG ≥Level 2 by T300
- Study-only XP share ≤30% of STATUS XP lines
- Repeat empty-search earns 0 XP

---

### P1.2 — Encounter Resolution Contract (upgraded from "threat spawn")

**What:** Every spawned threat needs stakes, legal player responses, success/failure resolution, resource or relationship effects, and aftermath.

**Not:** Just spawn an ambush.

**Owner:** Combat/crisis resolution system  
**Acceptance:**
- ≥1 forced encounter by T50 (LitRPG/DnD maxlevel)
- Encounters include: initiation → 3 decision points → resolution → resource change → aftermath
- Genre-appropriate (not just combat for RPG/PYOA)

---

### P1.3 — Quest Completion Schema

**What:** Every quest gets entry condition, active obstacle, progress signal, terminal success/failure, reward/cost, and follow-on hook.

**Not:** Just add quest-tied options.

**Owner:** `questPlay` + quest ledger  
**Acceptance:**
- ≥1 completed or failed objective arc within 50 turns
- LitRPG: quest-tied option ≤10t after registration
- PYOA: ≥1 mutually exclusive crisis fork by T30

---

### P1.4 — Voice Cadence with Cooldowns (upgraded from "personality aside")

**What:** Alter diction, compression, attitude, framing. Apply lexical cooldowns and tone suppression for grief/danger/revelation scenes.

**Not:** Insert recurring catchphrases.

**Owner:** `gmVoiceProfile` + cooldown tracker  
**Acceptance:**
- Blind reviewers identify personality in majority of ordinary turns (not just STATUS)
- Cold Registrar / Dry Wit audible ≥1 per hub change
- No catchphrase loops (cooldown prevents repeat within 10 turns)

---

### P1.5 — Meta-Input Recovery + Narrative Novelty Budget

**What:** On complaints like "none of these are valid," re-ground scene, acknowledge mismatch, regenerate from authoritative state. Track recent sentence/beat fingerprints to ban repeated exposition.

**Owner:** `useGame` repair + novelty tracker  
**Acceptance:**
- Meta complaint clears bad pad once
- Paragraph clones (≥0.85 similarity) do not appear within 20 turns

---

## P2 Board (Mode Depth - After P0/P1 Proven)

Keep existing P2.1–P2.4 from original plan.

---

## Honest Score Projections (Manus Calibrated)

| Axis | Pre-fix | Post P0 | Post P0+P1 | Confidence | Key dependency |
|---|---:|---:|---:|---|---|
| Pace | 1/10 | **3–4/10** | **4–5/10** | Medium-high | Escalation deterministic, bounded, context-sensitive + Forward-Progress Governor |
| Option quality | 1/10 | **3–4/10** | **4–5/10** | Medium | Dedupe semantic; options grounded in scene/goal/legal targets + diversity contract |
| Combat / danger | 1/10 | **3/10** | **4–5/10** LitRPG/DnD; **3–4/10** RPG/PYOA | Medium-low | Encounters include resolution and consequences, not just spawn |
| Voice consistency | 1/10 | **3/10** | **4–5/10** | Medium | Voice in normal prose, tested for perceptibility, no catchphrase loops |
| Hallucinations / mush | 1/10 | **6–7/10** | **6–7/10** | Medium-high | Typed validation + safe fallback; regex-only earns 3–4/10 |
| Long-session durability | 1/10 | **3/10** | **3–4/10** | Medium-low | Recent-window loops, ledgers, quest closure survive 300t |
| Keep playing? | 1/10 | **3/10** | **4–5/10** | Medium-low | ≥1 complete objective–obstacle–consequence–reward arc occurs |

**Headline:** P0 alone reaches **3–4/10** rough floor. P0+P1 with deep implementation reaches **4–5/10** (isolated 6–7 for mush). Cannot honestly claim 6/10 overall without NPC memory, branch persistence, quest closure, content novelty proven.

---

## Critical Blind Spots (Can Still Sink Post-Fix Scores)

From Manus priority table:

| Blind spot | Severity | Required mitigation |
|---|---|---|
| Threat spawn without playable resolution | Critical | Test complete encounters: initiation → 3 decisions → resolution → cost/gain → aftermath |
| Interruption without progress | Critical | Enforce Forward-Progress Governor; verify delta persists 5 turns later |
| Semantic loops evade exact matching | Critical | Use canonical intent + recent-window similarity; report exposure + selection patterns |
| Branch reconvergence (PYOA) | Critical | Track branch-specific state; test paired divergent replays |
| Mode-specific fantasy missing | Critical | Separate mode acceptance suites (not just shared anti-loop metrics) |
| Static NPC memory | High | Store goals, knowledge, disposition, commitments, relationship deltas, last interaction |
| Quest movement without closure | High | Require success/failure terminals + rewards/costs + follow-on hook |
| Action–outcome mismatch | High | Assert next response addresses selected verb/target/purpose before complications |
| No failure economy | High | Define reversible setbacks, bounded losses, recovery paths, difficulty limits |

---

## Release Gates (Manus Standards)

| Gate | Threshold for 300-turn run |
|---|---|
| Rendering integrity | Zero unresolved placeholders; <1 invalid entity reference per 100 turns (manual verification) |
| Loop control | No semantic intent family >25% options in 50-turn window; no non-progress window >5 turns during active objective |
| Progress | ≥1 durable meaningful state delta every 3–5 active turns; ≥1 completed/failed objective arc within 50 turns |
| Danger/consequence | ≥1 fully resolved high-stakes encounter or equivalent non-combat crisis within pacing window |
| Reward integrity | Zero repeat XP for unchanged inspection state; rewards map to discovery/risk/quest/resolution |
| State consistency | Zero invented scene participants, impossible location transitions, inventory conservation violations |
| Voice | Blind reviewers identify personality in majority of ordinary turns (without labels/STATUS) |
| Evaluation hygiene | Every quote resolves to existing turn in correct mode/run/build; no cross-genre leakage |

These measure **causal play quality**, not just surface defect counts.

---

## Ship Sequence (When John Says Go)

1. **P0.0** Forward-Progress Governor (biggest multi-axis lift)
2. **P0.1** Typed entity validator (not string scrub)
3. **P0.2** Semantic loop detector + context-sensitive escalation
4. **P0.3** Option-set diversity contract
5. **P0.4** Inventory state transitions
6. **P1.1** One-time discovery + XP ledger
7. **P1.2** Encounter resolution contract
8. **P1.3** Quest completion schema
9. **P1.4** Voice cadence with cooldowns
10. **P1.5** Meta-input recovery + narrative novelty budget

Then: Re-run 12×300 → file new Gemini packs with immutable manifests (mode/run/seed/build/turn/checksum) → verify uplift → only then P2 bible densify if scores still spine-starved.

---

## What Manus Says We're Underestimating

1. **Combat ≠ consequence:** Social betrayal, expiring opportunity, faction move, resource loss, environmental hazard, or branch closure may be better genre-appropriate pressure. Shared primitive is **consequence**, combat is one implementation.

2. **Surface cleaning can conceal state corruption:** Fluent sentence can still refer to wrong NPC/location/object. Success metric is **zero invalid entity references and zero impossible state transitions**, not "zero banned strings."

3. **Progress metrics can be gamed:** Engine can satisfy event count/XP count/quest-stage count while remaining unsatisfying. Must ask: did player action cause understandable change? Did it persist? Did it produce payoff?

---

## File Map

| Doc | Role |
|---|---|
| `BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md` | Original cross-mode ship plan |
| `UPDATED-FIX-PLAN-WITH-MANUS.md` | **This doc** — plan + Manus calibration |
| `MANUS-CALIBRATED-REVIEW.md` | Full Manus analysis (real failures, overstatements, uplift matrix, maximization, blind spots) |
| `MANUS-PRIORITIES-AND-BLIND-SPOTS.md` | Forward-Progress Governor contract + implementation specs + release gates |
| `MANUS-EVIDENCE-CLASSIFICATION.md` | What's confirmed vs plausible vs contradicted |
| `MANUS-SCORE-MODEL.md` | Honest score projections by mode and axis |
| `NEXT-UPDATE-FROM-3x500.md` | Seed-42 Cold Registrar board (pre-26u context) |
| Gemini pastes | `gemini-05` … `gemini-08` calibrated mode reviews |

**Reminder:** John is still playtesting live. Merge any new issues he pastes before implementing. Wait for explicit "ship the next update."
