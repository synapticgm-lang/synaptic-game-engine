# Strategic Plan: 02w Post-Mortem Analysis & Fix Roadmap

**Date**: 2026-09-06  
**Context**: Lock A (02w) shipped — fixed pad universe loops. All 4 Gemini modes scored **2/10**. This document analyzes the remaining failure patterns and proposes a concrete implementation plan.

---

## Executive Summary

Lock A successfully eliminated pad-level travel/leave loops by starving them at enumeration rather than post-filter. However, the 02w Gemini results reveal **three deeper architectural gaps** that pad-level fixes cannot address:

1. **Camera Lock Failure** — mid-scene spatial teleportation
2. **Engine Leak Catastrophe** — SNAPSHOT/template markers bleeding into prose
3. **Scene State Amnesia** — action loops, fact resets, content recycling

**Core Finding**: The failures cluster into **structural continuity breaks**, not surface-level prompt issues. We need architectural enforcement, not more deny-lists.

---

## Pattern Analysis

### Pattern 1: Engine Leak Catastrophe (P0 — ALL MODES)

**Symptoms**:
- LitRPG T3: Raw `<system>` tags, STATUS values in prose
- D&D: Leaked prompt instructions verbatim, HP values
- RPG T0: Template markers `[the sign]`, class names in story
- PYOA: SNAPSHOT tokens, formatting chrome

**Examples**:
```
LitRPG T3: "**<system>** Scattered Scale: Scattered Scale: [UNASSIGNED]"
D&D T12: "Dust kicks up under Pact-Hunter Skirmisher's boots in The Weighing Cup. Pact-Hunter Skirmisher still stands (13/16 HP)."
RPG T50: "Pact-Hunter Skirmisher — RECORD 114 Pact-Hunter Skirmisher: Pact-Hunter Skirmisher (EARTH)"
PYOA T18: "**SNAPSHOT** Location: Thornferry mill landing"
```

**Root Cause**:
- `proseWarden` is failing to strip engine chrome
- Commit gate is not catching template leaks
- Writer is seeing internal tokens and treating them as story content

**Owner**: `proseWarden` + commit gate

---

### Pattern 2: Spatial Teleportation (P0 — LitRPG, PYOA; P1 — RPG)

**Symptoms**:
- LitRPG: Character leaves upstairs → enemy materializes → character back downstairs
- PYOA: Chapel → mill hearth unexplained teleportation  
- RPG: Character walks away, NPC still talks (rubber-banding)

**Examples**:
```
LitRPG (Gemini): "Spatial teleportation (character leaves upstairs, enemy materializes, character back downstairs)"
PYOA (Gemini): "Unprompted teleportation (chapel→mill hearth)"
```

**Root Cause**:
- `travelAuthority` only locks **travel arrival**, not mid-scene camera
- Writer can teleport characters or reset locations mid-beat
- No enforcement of spatial continuity within a scene

**Owner**: NEW mechanism needed — `cameraLock` continuity enforcer

**NOT a pad issue**: These are mid-scene spatial breaks, not travel-pad loops.

---

### Pattern 3: Scene Looping/Reset (P0 — LitRPG; P1 — D&D, PYOA)

**Symptoms**:
- LitRPG: Cathedral scene resets to starting conditions after battle
- D&D: Search/examine loops 10+ times (T22-T51)
- PYOA: Vendor scene repeated 4x identically

**Examples**:
```
LitRPG (Gemini): "Scene looping/reset (resets to starting conditions after cathedral)"
D&D (Gemini): "Agonizing loops (searches for keep/examines scale 10+ times, T22-T51)"
PYOA (Gemini): "Exact turn duplication (vendor scene repeated 4x)"
```

**Root Cause**:
- `arcDirector` not tracking completed actions
- No "action exhaustion" ledger (combat moves, search, examine)
- Content recycling instead of forward progress

**Owner**: `arcDirector` + new action completion ledger

---

### Pattern 4: Causality Violations (P0 — PYOA)

**Symptoms**:
- Charter burned 3 separate times in different turns
- Scene facts resetting (destroyed objects reappearing)

**Examples**:
```
PYOA (Gemini): "Causality loop (charter burned 3 separate times)"
```

**Root Cause**:
- Lock C (fact-close) is not enforcing destroyed/resolved facts
- No "permanent change" ledger
- Writer can resurrect dead facts

**Owner**: Lock C (fact-close) hardening

---

### Pattern 5: Entity Morphing (P0 — LitRPG; P1 — RPG)

**Symptoms**:
- Skirmisher changes gender mid-scene (female→male)
- Character identity shifting
- Pronoun/perspective breaks

**Examples**:
```
LitRPG (Gemini): "Pronoun/entity morphing (Skirmisher female→male, perspective breaks)"
RPG (Gemini): "Character identity morphing"
```

**Root Cause**:
- Harvest not locking entity attributes (gender, identity)
- proseWarden not catching pronoun contradictions
- No entity continuity ledger

**Owner**: `proseWarden` + harvest entity lock

---

### Pattern 6: Combat Action Loops (P0 — RPG)

**Symptoms**:
- Same rock strike 4 times in 4 consecutive turns

**Examples**:
```
RPG (Gemini): "Combat action loop (same rock strike 4 times, T14-17)"
```

**Root Cause**:
- `arcDirector` not tracking action completion
- No "move exhaustion" after successful strikes
- Writer can repeat identical actions indefinitely

**Owner**: `arcDirector` action completion ledger (same as Pattern 3)

---

### Pattern 7: "the stranger" Text Replacement (P0 — PYOA)

**Symptoms**:
- Blind text substitution breaking prose structure
- Common nouns replaced incorrectly

**Examples**:
```
PYOA (Gemini): "'the stranger' text replacement glitch (blindly replacing nouns)"
```

**Root Cause**:
- `proseWarden` scrub logic using naive string replacement
- No semantic awareness of noun context

**Owner**: `proseWarden` scrub refinement

---

## Architectural Gap Identification

The patterns reveal **THREE core architectural gaps**:

### Gap 1: Camera Lock Failure (NEW)
**What's Missing**: Mid-scene spatial continuity enforcement  
**Current State**: `travelAuthority` only locks travel arrival  
**Needed**: `cameraLock` mechanism that prevents:
- Character teleportation mid-scene
- Location resets without travel
- Spatial contradictions (character "here" and "there" in same beat)

### Gap 2: Engine Leak Firewall (EXISTING — proseWarden)
**What's Missing**: Hardened template/chrome stripping  
**Current State**: `proseWarden` catches some leaks but not all  
**Needed**: Commit gate rejection + stronger proseWarden rules for:
- SNAPSHOT tokens
- Template markers (`<system>`, `[the sign]`)
- HP/XP values in prose
- Prompt instruction leaks

### Gap 3: Scene State Amnesia (EXISTING — arcDirector + Lock C)
**What's Missing**: Action completion and fact permanence ledgers  
**Current State**: No tracking of completed actions or destroyed facts  
**Needed**:
- **Action Completion Ledger**: Track exhausted moves (search, examine, strike)
- **Fact-Close Enforcement** (Lock C): Destroyed objects stay destroyed
- **Scene Reset Prevention**: No content recycling without state change

---

## Proposed Implementation Plan

### **Phase 1: Engine Leak Firewall (P0 — HIGHEST PRIORITY)**
**Goal**: Stop SNAPSHOT/template leaks into prose  
**Impact**: Addresses P0 failures in ALL 4 modes  
**Complexity**: Medium  

**Implementation**:
1. **Harden `proseWarden`** (`src/game/proseWarden.ts`):
   - Add `stripEngineTokens()` function
   - Regex patterns for: `<system>`, `<quest-`, `SNAPSHOT`, `[the sign]`, `Pact-Hunter Skirmisher`, HP/XP values, template markers
   - Run BEFORE commit, log violations

2. **Strengthen Commit Gate** (`src/game/gmProxy.ts` / `useGame.tsx`):
   - Add `detectEngineLeaks()` check
   - If detected: reject turn, log to telemetry, retry with stronger prompt
   - Toast: "Engine chrome leaked into story — retrying"

3. **Edge Sync**:
   - Sync `proseWarden` to `supabase/functions/_shared/proseWarden.ts`
   - Deploy `gm-turn`

**Files**:
- `src/game/proseWarden.ts` (extend)
- `src/game/gmProxy.ts` (extend commit gate)
- `supabase/functions/_shared/proseWarden.ts` (sync)

**Expected Impact**: Should eliminate 40-50% of P0 failures across all modes

---

### **Phase 2: Camera Lock Mechanism (P0 — NEW ARCHITECTURE)**
**Goal**: Prevent mid-scene spatial teleportation  
**Impact**: Addresses spatial continuity breaks in LitRPG, PYOA, RPG  
**Complexity**: Medium-High  

**Implementation**:
1. **Create `cameraLock.ts`** (new file):
   - `cameraLock` object on `GameState`: `{ location: string, locked: boolean, lockedAt: number }`
   - `lockCamera(location)` — called on scene establishment
   - `validateCameraConsistency(prose, cameraLock)` — check prose doesn't contradict locked location
   - `scrubCameraTeleport(prose, cameraLock)` — rewrite teleportation if detected

2. **Integrate into Turn Flow**:
   - Lock camera on: scene open, combat start, NPC encounter
   - Unlock camera on: explicit travel, scene exit
   - Run `validateCameraConsistency()` in commit gate

3. **Prompt Integration** (`situationPacket.ts`):
   - Add `CAMERA LOCK` to SNAPSHOT: "You are [LOCATION]. Camera is locked — do not teleport characters or change location mid-scene."

4. **Warden Integration** (`proseWarden.ts`):
   - `scrubCameraTeleport()` rewrites:
     - "You leave X and arrive at Y" → "You are still at X"
     - "The enemy appears upstairs" (when you're downstairs) → "The enemy is still [WHERE THEY WERE]"

**Files**:
- `src/game/cameraLock.ts` (new)
- `src/game/situationPacket.ts` (extend)
- `src/game/proseWarden.ts` (extend)
- `src/hooks/useGame.tsx` (integrate)
- `scripts/fate-autoplay/runAutoplay.ts` (parity)

**Expected Impact**: Should eliminate spatial teleportation failures (20-30% of P0s)

---

### **Phase 3: Action Completion Ledger (P0 — arcDirector)**
**Goal**: Prevent action loops (combat, search, examine)  
**Impact**: Addresses scene looping in D&D, RPG  
**Complexity**: Medium  

**Implementation**:
1. **Create `actionCompletionLedger.ts`** (new file):
   - `completedActions` array on `GameState`: `[{ action: string, target: string, turn: number }]`
   - `markActionComplete(action, target)` — called after successful action
   - `isActionExhausted(action, target, recentTurns)` — check if action repeated too recently

2. **Integrate into ArcDirector** (`arcDirector.ts`):
   - On commit, detect: combat move success, search/examine completion
   - Call `markActionComplete()`
   - On pad generation, starve actions if `isActionExhausted()` returns true

3. **Prompt Integration** (`situationPacket.ts`):
   - Add `RECENT ACTIONS` to SNAPSHOT: list of last 5 completed actions
   - Rail: "Do not repeat the same action against the same target consecutively"

4. **Choice Pad Starvation** (`choiceCompiler.ts`):
   - Filter pads if action exhausted (e.g., "Strike with rock" after 2 consecutive strikes)

**Files**:
- `src/game/actionCompletionLedger.ts` (new)
- `src/game/arcDirector.ts` (integrate)
- `src/game/situationPacket.ts` (extend)
- `src/game/choiceCompiler.ts` (extend pad filter)

**Expected Impact**: Should eliminate combat/action loops (15-20% of P0s)

---

### **Phase 4: Lock C Hardening (P0 — Fact-Close)**
**Goal**: Enforce permanent state changes (destroyed objects, burned items)  
**Impact**: Addresses causality violations in PYOA  
**Complexity**: Low-Medium  

**Implementation**:
1. **Extend `sceneFacts.ts`**:
   - Add `destroyedObjects` array: `[{ object: string, turn: number }]`
   - `markObjectDestroyed(object)` — called on explicit destruction
   - `isObjectDestroyed(object)` — check if object should be absent

2. **Integrate into Harvest** (`narrativeHarvest.ts`):
   - Skip harvesting destroyed objects into `props[]`

3. **Integrate into proseWarden** (`proseWarden.ts`):
   - `scrubDestroyedObjectReappearance()` — rewrite prose that mentions destroyed objects
   - Example: "The charter glows" → strip (charter was burned)

4. **Prompt Integration** (`situationPacket.ts`):
   - Add `DESTROYED` list to SNAPSHOT: "These objects are gone: [list]. Do not mention them."

**Files**:
- `src/game/sceneFacts.ts` (extend)
- `src/game/narrativeHarvest.ts` (integrate)
- `src/game/proseWarden.ts` (extend)
- `src/game/situationPacket.ts` (extend)

**Expected Impact**: Should eliminate causality violations (10-15% of P0s)

---

### **Phase 5: Entity Morphing Prevention (P1)**
**Goal**: Lock entity attributes (gender, identity)  
**Impact**: Addresses entity continuity in LitRPG, RPG  
**Complexity**: Low  

**Implementation**:
1. **Extend `narrativeHarvest.ts`**:
   - When harvesting a named person, lock: `gender`, `appearance`, `role`
   - Store in `sceneFacts.entityAttributes`: `{ [name]: { gender, appearance, role } }`

2. **Integrate into proseWarden** (`proseWarden.ts`):
   - `scrubEntityMorphing()` — check prose against locked attributes
   - Example: "Vessa (female) → he" → rewrite to "she"

3. **Prompt Integration** (`situationPacket.ts`):
   - Add `ENTITIES` to SNAPSHOT with locked attributes: "Vessa (female, priest)"

**Files**:
- `src/game/narrativeHarvest.ts` (extend)
- `src/game/sceneFacts.ts` (extend)
- `src/game/proseWarden.ts` (extend)
- `src/game/situationPacket.ts` (extend)

**Expected Impact**: Should eliminate entity morphing (5-10% of P1s)

---

## Implementation Priority & Sequencing

### **Batch 02x: Phase 1 + Phase 4**
**Rationale**: Highest-impact, lowest-complexity combination
- Phase 1 (Engine Leak) addresses P0 in ALL modes
- Phase 4 (Lock C) is low-complexity and closes PYOA causality issues
- Both extend existing systems (proseWarden, sceneFacts)

**Estimated Impact**: 50-65% reduction in P0 failures  
**Complexity**: Medium  
**Files**: 5-6 files (all extending existing)  
**Expected Score**: 4-5/10 (from 2/10)

### **Batch 02y: Phase 2**
**Rationale**: New architecture, needs careful implementation
- Phase 2 (Camera Lock) is structural but high-impact
- Requires new file + integration across turn flow
- Addresses spatial teleportation (20-30% of remaining P0s)

**Estimated Impact**: 20-30% additional reduction  
**Complexity**: Medium-High  
**Files**: 1 new + 4 extending  
**Expected Score**: 6-7/10 (from 4-5/10)

### **Batch 02z: Phase 3 + Phase 5**
**Rationale**: Action loops + entity morphing
- Phase 3 (Action Completion) closes D&D/RPG loops
- Phase 5 (Entity Morphing) is low-complexity polish
- Combined: remaining structural issues

**Estimated Impact**: 15-25% additional reduction  
**Complexity**: Medium  
**Files**: 1 new + 5 extending  
**Expected Score**: 7-9/10 (from 6-7/10)

---

## Anti-Pattern: What NOT To Do

**DO NOT**:
1. ❌ Add more deny-lists to `proseWarden` without commit gate enforcement
2. ❌ Rely on prompt rails alone — writers ignore them under pressure
3. ❌ Try to fix spatial teleportation with pad starvation — it's mid-scene
4. ❌ Add LLM "coherence critic" — that's slow and unreliable
5. ❌ Patch symptoms one-by-one — we need structural enforcement

**DO**:
1. ✅ Build architectural mechanisms (camera lock, action ledger)
2. ✅ Harden commit gates to reject leaks/contradictions
3. ✅ Make ledgers the source of truth, not the writer
4. ✅ Starve pads when state prohibits actions
5. ✅ Scrub contradictions deterministically in proseWarden

---

## Expected Trajectory

### Current State (02w)
- Gemini: 2/10 across all modes
- Lock A closed pad loops
- Core issues: engine leak, teleportation, action loops

### After Batch 02x (Phase 1 + 4)
- Gemini: **4-5/10** (estimated)
- Engine leaks eliminated
- Causality violations closed
- Remaining: teleportation, action loops, entity morphing

### After Batch 02y (Phase 2)
- Gemini: **6-7/10** (estimated)
- Spatial teleportation eliminated
- Camera continuity enforced
- Remaining: action loops, entity morphing

### After Batch 02z (Phase 3 + 5)
- Gemini: **7-9/10** (estimated)
- Action loops closed
- Entity morphing prevented
- Remaining: edge cases, polish

---

## Vitest Strategy

### Batch 02x Tests (`playtest02xBatch02x.test.ts`)
- Engine leak detection: SNAPSHOT/template in prose → reject
- Fact-close: destroyed object reappears → scrub
- Commit gate: HP values in prose → retry

### Batch 02y Tests (`playtest02yBatch02y.test.ts`)
- Camera lock: teleportation mid-scene → scrub
- Camera unlock: travel arrival → allow location change
- Spatial consistency: character location contradictions → reject

### Batch 02z Tests (`playtest02zBatch02z.test.ts`)
- Action exhaustion: same combat move 3x → starve pad
- Entity morphing: gender flip → scrub
- Search loops: examine same object 5x → starve pad

---

## Conclusion

Lock A was necessary but insufficient. The 02w failures reveal **structural gaps** in:
1. Engine leak containment (proseWarden + commit gate)
2. Spatial continuity (NEW: camera lock mechanism)
3. Scene state tracking (arcDirector + Lock C)

**Recommended Approach**:
- **Ship 02x first** (Phase 1 + 4) — highest impact, lowest risk
- **Validate with 4×T50** under `2026-09-02x`
- **If 4-5/10**: ship 02y (Phase 2)
- **If 6-7/10**: ship 02z (Phase 3 + 5)
- **If 7-9/10**: STOP and reassess remaining issues

This is a **3-batch trajectory** to honest 7-9/10 quality, assuming no regressions.

---

**END OF STRATEGIC PLAN**
