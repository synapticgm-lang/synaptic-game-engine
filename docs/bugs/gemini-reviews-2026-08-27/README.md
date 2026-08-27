# Gemini Reviews 2026-08-27 + Manus Calibration

**Date:** 2026-08-27  
**Baseline:** 2026-08-26v (Free writer)  
**Batch:** `scripts/fate-autoplay/runs/modes-agents-300t-2026-08-27T07-02-01-789Z`  
**Status:** Waiting — do **not** ship until John asks for the next update.

## Summary

Gemini reviews of 12 automated runs (4 modes × 3 agents × 300 turns) scored SynapticGM at **~1–3/10** across all axes. Manus AI provided an expert calibration review that:

1. **Confirms** Gemini's core diagnosis is directionally right
2. **Corrects** Gemini's poor forensic reliability (impossible turn citations, cross-run contamination)
3. **Calibrates** honest score uplift expectations (4–5/10, not 8/10)
4. **Identifies** the #1 missing piece: Forward-Progress Governor
5. **Warns** against superficial implementations that won't earn projected scores

## Core Validated Failures (P0)

From Manus evidence classification:

1. **Entity-reference corruption** (`the stranger`, `them`, `this place`) — destroys readability, grounding, trust
2. **No effective escalation** — zero combat/crisis across 300 turns in all modes
3. **Semantic option recycling** — high exposure of repeated option families (not just identical strings)
4. **Reward misalignment** — repeatable 5 XP inspect rewards farm inspection over play
5. **No deterministic recovery path** — meta complaints ignored, no re-grounding
6. **Weak quest/narrative pressure** — numeric XP movement without meaningful objective arcs
7. **Voice not perceptible** — wired but weak in delivered prose

## Gemini Overstatements (Discard)

From Manus evidence classification:

- Turn citations beyond 300 (R1:424, R1:494, R2:486 do not exist)
- "100+ identical-action loops" (max streak is 2–4)
- Cross-genre map bleed (Lowmarket/Cathedral in Cape = 0 hits; Earth junk in PYOA = 0 hits)
- Mask Scarf as invented item (actually legit RPG kit)
- Mislabeled run (gemini-06 titled DnD but actually LitRPG s117)

## Honest Score Uplift Projections

From Manus score model:

| Axis | Pre-fix | Post P0+P1 | Confidence |
|---|---:|---:|---|
| Pace | 1/10 | **4–5/10** | Medium-high |
| Option quality | 1/10 | **3–5/10** | Medium |
| Combat / danger | 1/10 | **3–5/10** | Medium-low |
| Voice consistency | 1/10 | **4–5/10** | Medium |
| Hallucinations / mush | 1/10 | **6–7/10** | Medium-high (if typed validation, not string scrub) |
| Long-session durability | 1/10 | **3–4/10** | Medium-low |
| Keep playing? | 1/10 | **3–5/10** | Medium-low |

**Headline:** P0/P1 can credibly move from "catastrophically broken to rough but playable" with most axes reaching 4–5/10. Cannot honestly claim 6/10 overall without Forward-Progress Governor, NPC memory, branch persistence, quest closure, and content novelty.

## The #1 Missing Piece: Forward-Progress Governor

From Manus priorities:

> **If only one additional P1 item can ship beyond the P0 board, ship a deterministic "meaningful state delta" contract.**

### What it is

After each turn, compare authoritative pre-turn and post-turn state. During an active objective, permit no more than **3–5 turns without a meaningful persistent delta**.

**Meaningful delta** = change to at least one of:
- Quest stage, obstacle, deadline, failure, or next objective
- New actionable fact discovered (not repeated inspection)
- Route opened/closed, position changed, travel cost paid
- NPC relationship, commitment, suspicion, condition changed
- Threat escalated, avoided at cost, resolved, or complication created
- Item consumed/acquired/lost, health/time changed, debt/leverage changed
- Character condition, ability, reputation, injury, progression changed

### Why it's the highest value

Lifts multiple axes simultaneously: **pace, agency, quest progression, option quality, long-session durability, keep-playing propensity**. Closes the gap that hard interrupts alone don't: changing the scene without changing the campaign.

## Implementation Warnings

From Manus priorities — how to avoid superficial implementations that will fail:

| Fix | ❌ Superficial (will fail) | ✅ Deep (earns uplift) |
|---|---|---|
| Mush scrub | Delete banned strings | Typed entity validation → regenerate → fallback |
| Hard interrupt | Spawn combat after 5 identical strings | Semantic non-progress → escalation ladder → persistent consequence |
| Pad dedupe | Compare exact text | Canonicalize semantic role → require distinct outcomes |
| XP retarget | Lower inspect XP globally | One-time discovery ledger → reward novelty/risk/quest |
| Threat decay | Random ambush timer | Telegraph pressure → genre-appropriate crisis → resolve consequences |
| Voice rails | Insert catchphrases | Alter diction/compression/attitude → apply cooldowns |
| Quest pressure | Reprint objective in STATUS | World actors/deadlines move objective forward or toward failure |
| Bag lock | Maintain item name list | Track ownership/quantity/state transitions/provenance/conservation |

## Critical Blind Spots

From Manus blind spots table — what can still cause 1–2/10 scores even after P0/P1:

- **Threat spawn without playable resolution** — "Combat happened" is meaningless without choices, rolls, danger, loss, aftermath
- **Interruption without progress** — Ambush breaks loop but returns to same unchanged hub/quest
- **Semantic loops evade exact matching** — "Leave" / "walk away" / "go elsewhere" feel identical
- **PYOA branch reconvergence** — Choices feel fake when paths rejoin with no cost/unlock
- **Mode-specific fantasy missing** — DnD needs dice/challenge; RPG needs relationships; PYOA needs irreversible branching
- **Static NPC memory** — Repeated introductions, forgotten promises, emotional resets
- **Quest movement without closure** — Counters rise but objectives never resolve or pay off
- **Action–outcome mismatch** — Player chooses negotiation, gets unrelated travel or combat
- **No failure economy** — Danger cannot consume health, resources, relationships, time, access
- **Inventory without state transitions** — Items don't materialize but consumed/equipped/dropped still wrong

## File Map

| Doc | Purpose |
|---|---|
| **`README.md`** | This overview |
| **`UPDATED-FIX-PLAN-WITH-MANUS.md`** | Complete P0/P1/P2 plan with Manus specs |
| **`MANUS-CALIBRATED-REVIEW.md`** | Full Manus review (validation, overstatements, uplift matrix, maximization, blind spots) |
| **`MANUS-PRIORITIES-AND-BLIND-SPOTS.md`** | Forward-Progress Governor contract + implementation specs + release gates |
| **`MANUS-EVIDENCE-CLASSIFICATION.md`** | What's confirmed vs plausible vs contradicted |
| **`MANUS-SCORE-MODEL.md`** | Honest score projections by mode and axis |
| **`BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md`** | Original cross-mode fix plan (pre-Manus) |
| **`NEXT-UPDATE-FROM-3x500.md`** | Prior 500t Cold Registrar board |
| **`gemini-05-dnd-modes-agents-300t.md`** | DnD cursed-keep review |
| **`gemini-06-mislabeled-dnd-actually-litrpg-storyfollower-300t.md`** | Mislabeled LitRPG review |
| **`gemini-07-rpg-storyfollower-modes-agents-300t.md`** | Story RPG cape-district review |
| **`gemini-08-pyoa-modes-agents-300t.md`** | PYOA thornferry review |
| **`gemini-04-cold-completionist-500t.md`** | 500t completionist (pre-26u/26t) |
| **`gemini-03-cold-storyfollower-500t.md`** | 500t storyfollower (pre-26u/26t) |
| **`gemini-02-cold-maxlevel-500t.md`** | 500t maxlevel (pre-26u/26t) |

## Next Steps

**Waiting on John's approval to ship.**

When approved:

1. Implement P0.0 Forward-Progress Governor
2. Implement upgraded P0.1–P0.4 (typed entity validator, semantic loop detector, option diversity, inventory state transitions)
3. Implement P1.1–P1.5 (one-time XP ledger, encounter resolution, quest completion, voice cooldowns, meta-input recovery)
4. Re-run 12×300 with immutable manifests (mode/run/seed/build/turn/checksum)
5. File new Gemini packs with proper evidence hygiene
6. Verify score uplift against Manus projections
7. Only then consider P2 bible densify if scores still spine-starved

## Key Manus Quotes

### On what the plan can achieve

> "If implemented robustly, the plan can credibly move SynapticGM from **catastrophically broken to rough but playable**, with most reviewed axes landing in the **4–5/10 range** and surface mush reaching **6–7/10**."

### On what it cannot yet claim

> "The present plan does **not** justify an across-the-board 6/10 because it does not yet guarantee meaningful state change, encounter resolution, quest closure, durable NPC memory, or genuine PYOA branch divergence."

### On the decisive shift needed

> "The decisive shift is from 'something different happened' to **'the player caused a persistent, legible, genre-appropriate consequence.'**"

### On avoiding false optimism

> "The largest risk is confusing **loop interruption** with **meaningful progression**. A forced ambush changes the turn; it does not automatically advance a quest, alter the world, consume a resource, reveal information, or create a lasting consequence."

### On evaluation standards

> "Post-fix evaluation must therefore score completed causal arcs, not just lower repetition counts."
