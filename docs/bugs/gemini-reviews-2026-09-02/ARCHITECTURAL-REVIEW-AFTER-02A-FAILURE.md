# PASTE INTO GEMINI PRO — Architectural Review After Batch 02a Failure

## Context

You are a Principal Engineer reviewing a catastrophic quality failure in an AI-driven RPG story engine (SynapticGM). The team has completed multiple repair batches (A-X, Y+Z, 02a) targeting specific P0 failures identified by you in prior reviews, yet the latest validation run scored **1/10** (down from 2/10), indicating fundamental architectural failure.

Your task: provide architectural-level solutions that go beyond symptom scrubbing.

---

## The Quality Crisis

### Baseline Progression

1. **Pre-Batch S (2026-08-27):** Initial runs scored ~1-2/10
2. **Batches S-X (2026-08-31):** Targeted P0s (UI labels as NPCs, entity shapeshifting, token corruption, infinite loops, choice leaks, false arrivals)
3. **Batches Y+Z (2026-09-01):** Architectural pivot (entity registry, intent enums, FSM pad filtering, ledger-first combat, location authority)
4. **Batch 02a (2026-09-02):** Residual fixes (Tavern mad-libs, possessive pronouns, loiter interrupt)

**Result:** RPG T50 validation scored **1/10** with NEW P0s that previous batches didn't address.

---

## Latest Run Evidence (Seed 43, Build 2026-09-02a)

### P0-1: Catastrophic Template Injection ("Consul")

The LLM uses system variables/location names as physical objects, characters, and directions, rendering prose incomprehensible.

**Examples:**
- Turn 3: "...lanterns casting pools of flickering light that barely push **the Consul**."
- Turn 5: "...notice the faint, rhythmic drip of water from a leaky pipe somewhere **Consul**..."
- Turn 22: "...and the vast, indifferent silence of the open **the Consul**. **the Consul** lies an unknown distance **Consul**, a point of reference in the encroaching night."
- Turn 24: "...uniforms of **the Consul's a nearby street**, pace opposite sides..."

**Note:** This is identical to the "Tavern" P0 from the 2/10 run, but with a different token. Batch 02a added "Tavern" to the entity scrubber, but "Consul" immediately replaced it.

### P0-2: Adverbs Hallucinated as NPCs ("Just", "Heat")

Abstract words or narrative framing are promoted to physical characters occupying the scene.

**Examples:**
- Turn 7: "...leave only the low, guttural sigh that seems to emanate from the shadows where **Just** lingers."
- Turn 12: "The figures you observed earlier—**the Consul** and **Heat**—maintain their impassive stillness..."
- Turn 48: "...the Consul detaches himself from the shadows near the lead cart. the **It's Just**, Vessa's burly associate..."

### P0-3: Pronoun Corruption (Still Present Despite Fix)

NPCs described with player pronouns ("your eyes" when describing Vessa).

**Examples:**
- Turn 7: "Vessa shifts her weight... a flicker of something unreadable in **your eyes**."
- Turn 9: "Even the Consul... **your eyes** tracking **your movements** with a new intensity..."

**Note:** Batch 02a added `scrubPossessiveDeterminerSlips()` to fix "you stool" → "your stool", but this pattern (NPC + "your eyes") wasn't caught.

### P0-4: UI/Choice Leaks (Still Present Despite Fixes)

Choice options bleeding into narration-only export.

**Examples:**
- Turn 6: "The Consul remains silent... **1. the Press Vessa for more details on this "debt."**"
- Turn 48: "...whatever plan Vessa has in mind. **1. the Ask Just what he means by "the real deal."**"

**Note:** Batch X hardened `stripChoiceList()` with quoted chip stripping, but leaks persist.

### P0-5: Idle String Spam (Still Present Despite Tightening)

Identical atmospheric strings repeated verbatim with zero narrative delta.

**Examples:**
- Turns 11, 19, 27: "A vendor under a patched tarp meets your glance in Consul Caravan Camp, then looks away — the moment is yours to break." (Exact copy 3 times)
- Turns 14, 26, 38: "Grit stings your eyes on [Location]. The road toward [Location] lies open..."

**Note:** Batch 02a tightened loiter interrupt from ≥3 turns → ≥2 turns, but idle spam persists.

---

## What Has Been Tried (And Failed)

### Batch S-X: Scrub-Focused Repairs

**Approach:** Detect and scrub specific bad patterns after the LLM generates text.

**Fixes Applied:**
- Entity mad-lib scrubbing (hub roles, stall contact, Scattered Scale, Lowmarket Fence, **Tavern**)
- Pronoun repair (possessive determiners, perspective slips)
- UI bleed protection (quest tracker, spawn logs, choice lists)
- Entity harvest denial (dialogue verbs, harvest, vignette, readability gate)

**Result:** Whack-a-mole. Fixed "Tavern" → "Consul" appeared. Fixed "you stool" → "your eyes" on NPCs persists.

### Batch Y+Z: Authority Inversion Architecture

**Approach:** Game engine dictates state; LLM only narrates.

**Fixes Applied:**
- Entity registry lockdown (only registered NPCs/locations enter `present[]`)
- Intent enums (LLM sees semantic intents, not UI strings)
- FSM pad filtering (state-action masking, only contextual choices)
- Ledger-first combat (HP/state updated before LLM narrates)
- Location authority binding (`LOCATION AUTHORITY` rail in SNAPSHOT)

**Result:** Flash Lite ignores the bindings. Still invents "Consul" as character/direction/object despite explicit `currentLocation` authority.

### Batch 02a: Residual Targeted Fixes

**Fixes Applied:**
- Extended entity scrubbing (8 "Tavern" patterns)
- Possessive pronoun repair (40+ "you noun" → "your noun" patterns)
- Tighter loiter interrupt (≥3 → ≥2 turns)

**Result:** 1/10. Worse than before. New tokens ("Consul", "Just", "Heat") immediately replaced the scrubbed ones.

---

## The Core Problem

**Observation:** Every batch fixes specific symptoms, but new symptoms with identical patterns immediately emerge.

**Hypothesis:** The underlying architecture allows Flash Lite (google/gemini-2.5-flash-lite) to:
1. Ignore explicit authority bindings (LOCATION AUTHORITY, entity registry)
2. Promote arbitrary tokens to narrative entities
3. Generate UI/meta strings as if they are story prose
4. Recycle content without checking ledger state

**Question:** Is Flash Lite fundamentally incapable of following structured narrative constraints at this quality bar, or is the architecture failing to enforce them correctly?

---

## Your Task

Provide architectural solutions that address the **root cause**, not symptoms. Specifically:

1. **Why does Flash Lite promote arbitrary tokens ("Consul", "Just", "Heat") to characters despite entity registry lockdown?**
   - Is the SNAPSHOT binding format wrong?
   - Should the entity registry be enforced pre-LLM (mask the context) rather than post-LLM (scrub the output)?
   - Should we use a different prompt structure entirely?

2. **Why does Flash Lite ignore LOCATION AUTHORITY and use location names as verbs/objects?**
   - Is the rail phrasing ineffective?
   - Should we pre-process the LLM input to remove ambiguous tokens entirely?
   - Would a two-pass system (planning LLM → narration LLM) help?

3. **Why do UI/choice leaks persist despite export filtering?**
   - Is the LLM embedding choice text in its "story" output because the prompt context includes choices?
   - Should choices be moved to a separate, post-generation injection point?

4. **Why does idle spam persist despite ArcDirector loiter interrupt?**
   - Is the choice pad filter failing to execute?
   - Is Fate picking from a stale pad before the interrupt logic runs?
   - Should idle strings be banned entirely from the story output?

5. **Is Flash Lite salvageable for story quality, or should we accept a 1-2/10 ceiling and use Mid/High tiers for readable prose?**

---

## Deliverables

1. **Root-cause analysis** for each P0 category
2. **Architectural recommendations** (not scrubbing patches) to prevent these failures
3. **Honest assessment**: Can Flash Lite reach 5+/10 with the right architecture, or is it a model limitation?

---

## Reference: What "Good" Looks Like

**Target:** 5-7/10 story quality on Fate autoplay (random pad picks).

**Acceptable issues:** Occasional pacing lulls, minor redundancy, predictable plot beats.

**Unacceptable issues:** Incomprehensible prose, hallucinated characters, UI bleed, location names as verbs.

**Current state:** 1/10. Unreadable as a standalone story.

---

After your analysis, emit a summary in this format:

```markdown
## Root Causes
1. [P0-1 Template Injection] — ...
2. [P0-2 Hallucinated NPCs] — ...
3. [P0-3 Pronoun Corruption] — ...
4. [P0-4 UI Leaks] — ...
5. [P0-5 Idle Spam] — ...

## Architectural Solutions
1. **Pre-LLM Context Masking** — ...
2. **Two-Pass System** — ...
3. **Stronger Binding Format** — ...
4. (etc.)

## Flash Lite Ceiling Assessment
- Can Flash Lite reach 5+/10? YES / NO
- If YES: with what changes?
- If NO: recommend Mid/High tier strategy
```
