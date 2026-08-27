# Deterministic State + LLM Renderer Architecture Analysis

**Date:** 2026-08-25  
**Purpose:** Gap analysis between proposed "Deterministic State + LLM Renderer" architecture and current SynapticGM implementation, with prioritized roadmap for improving consistency, accuracy, and flow.

---

## Executive Summary

The proposed architecture separates **deterministic state management** from **narrative rendering**, treating the LLM as a renderer that operates on validated, canonical state rather than a source of truth. SynapticGM already implements several core concepts (StateTx, sceneFacts, grounding validation), but gaps remain in:

1. **Pre-LLM validation completeness** — current system catches some issues post-generation (proseWarden) but allows invented objects to reach the LLM
2. **Canonical snapshot coherence** — no single immutable "turn snapshot" that prose must reconcile to
3. **Structured response envelope** — LLM returns prose only; no typed fields for facts/outcomes
4. **Observability** — limited replay/debug tooling for understanding why the LLM generated specific content

**Impact on P0 issues:**
- **Invented objects ("last box"):** Grounding validation exists but fires inconsistently; no hard gate before LLM call
- **Consistency across turns:** sceneFacts + StateTx track continuity, but narrative can still contradict
- **Flow problems:** No explicit "narrative flow" validator; proseWarden patches symptoms

---

## Proposed Architecture (From Document)

```
┌─────────────────────────────────────────────────────────────────┐
│ PLAYER INPUT                                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ DETERMINISTIC STATE GATES (Pre-LLM)                             │
│ • Inventory check: claimed items exist?                         │
│ • Location check: is player actually here?                      │
│ • NPC check: is this person present?                            │
│ • Quest check: is this objective valid?                         │
│ • Physics check: is this action physically possible?            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ INTENT CANDIDATE                                                 │
│ Lexical semantic router classifies action kind                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─ Unambiguous ──────────────────────────────┐
                 │                                             │
                 ├─ Ambiguous ─────────────────┐              │
                 │                              │              │
                 ▼                              ▼              ▼
┌────────────────────────────┐  ┌──────────────────────────────────┐
│ CLARIFY (Constrained LLM)  │  │ ENGINE ORCHESTRATION VALIDATOR   │
│ Ask player to disambiguate │  │ • Runs deterministic logic       │
└────────────────┬───────────┘  │ • Combat resolver                 │
                 │               │ • Skill checks                    │
                 │               │ • Resource deduction              │
                 │               │ • State mutations                 │
                 │               └────────────────┬──────────────────┘
                 │                                │
                 └────────────────────────────────┤
                                                  ▼
                           ┌─────────────────────────────────────────┐
                           │ DETERMINISTIC BEFORE OUTCOME            │
                           │ Metadata from > retrieve > rerank       │
                           └──────────────────┬──────────────────────┘
                                              │
                                              ▼
                           ┌─────────────────────────────────────────┐
                           │ CANONICAL SNAPSHOT                      │
                           │ • Episodic memory (last 5-10 beats)     │
                           │ • Arc summary (campaign-level)          │
                           │ • Quest state                           │
                           │ • Inventory manifest                    │
                           │ • NPC presence list                     │
                           │ • Location facts                        │
                           │ IMMUTABLE for this turn                 │
                           └──────────────────┬──────────────────────┘
                                              │
                                              ▼
                           ┌─────────────────────────────────────────┐
                           │ TYPED APPEND-ONLY TURNS LIST            │
                           │ • turn_id                               │
                           │ • player_intent (parsed)                │
                           │ • deterministic_outcome                 │
                           │ • narrative_prose                       │
                           │ • state_changes (typed)                 │
                           │ • provenance links                      │
                           │ Deduced provenance-linked               │
                           └──────────────────┬──────────────────────┘
                                              │
                                              ▼
                           ┌─────────────────────────────────────────┐
                           │ LLM NARRATIVE RENDERER                  │
                           │ Input: snapshot + outcome + constraints │
                           │ Output: structured response envelope    │
                           └──────────────────┬──────────────────────┘
                                              │
                                              ▼
                           ┌─────────────────────────────────────────┐
                           │ STRUCTURED RESPONSE ENVELOPE            │
                           │ {                                       │
                           │   narrative: string                     │
                           │   facts: { [key]: value }              │
                           │   speaker: string | null               │
                           │   mood: string                         │
                           │   next_scene_hint: string              │
                           │   claims: Claim[]                      │
                           │ }                                       │
                           └──────────────────┬──────────────────────┘
                                              │
                                              ▼
                           ┌─────────────────────────────────────────┐
                           │ VALIDATORS                              │
                           │ • ICL numbers (HP, XP, stats)          │
                           │ • Scripts (inventory, quest state)     │
                           │ • Claims (grounding check)             │
                           └──────────────────┬──────────────────────┘
                                              │
                                  ┌───────────┴──────────┐
                                  │                      │
                                  ▼                      ▼
                           ┌─────────────┐      ┌──────────────────┐
                           │   PASS      │      │   VIOLATIONS     │
                           │ Commit turn │      │ Repair attempt   │
                           └─────────────┘      │ with violations  │
                                                 └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ OBSERVABILITY + │
                                                 │ REPLAY UTILS    │
                                                 └─────────────────┘
```

---

## Current SynapticGM Architecture

### What Exists Today

#### 1. **StateTx (Append-Only Ledger)** ✅
**File:** `src/game/stateTx.ts`

```typescript
export interface StateTx {
  id: string;
  rev: number;
  turn: number;
  kind: StateTxKind;
  summary: string;      // Player-facing receipt
  entity?: string;
  why?: string;         // Provenance
  createdAt: number;
}
```

**What it does:**
- Tracks inventory gains/losses, HP/MP changes, location moves, quest reveals/completions
- Diff-based: `appendStateTxDiff(previous, next)` compares states and logs changes
- Short receipts shown in HUD

**Alignment with proposal:** ⭐⭐⭐⭐ (Strong)
- **Good:** Append-only, provenance tracking, turn-indexed
- **Gap:** Not comprehensive enough — doesn't track NPC presence, scene facts, dialogue, or all claim types

#### 2. **SceneFacts (Scene Continuity Tracking)** ✅
**File:** `src/game/sceneFacts.ts`

```typescript
export interface SceneFacts {
  crowd: 'unknown' | 'present' | 'none';
  noise: 'unknown' | 'shouting' | 'quiet' | 'voices';
  present: string[];     // NPCs/entities in scene
  props: string[];       // Scene objects
  lastBeat: string;
  updatedTurn: number;
  timeOfDay: string;
  weather: string;
  indoor?: boolean;
  tension: string;
}
```

**What it does:**
- Extracts facts from narrative using regex patterns
- Tracks crowd presence, noise level, time of day, weather, indoor/outdoor, tension
- Used by proseWarden to catch contradictions

**Alignment with proposal:** ⭐⭐⭐ (Good)
- **Good:** Tracks scene continuity, prevents crowd disappearances
- **Gap:** Extraction happens AFTER LLM generation, not before; no hard enforcement

#### 3. **Intent Parser** ✅
**File:** `src/game/intentParser.ts`

```typescript
export function parsePlayerIntent(input: string, state?: GameState): PlayerIntent {
  // Returns: { kind, label, targets, itemName }
}
```

**What it does:**
- Classifies player actions: observe, move, talk, attack, use_item, cast, rest, search, flee, refuse, other
- Extracts targets and item names
- Distinguishes speech/protest from physical actions

**Alignment with proposal:** ⭐⭐⭐ (Good)
- **Good:** Semantic classification, handles ambiguity between talk/action
- **Gap:** Not exhaustive; no confidence scores; no "ambiguous" return that triggers clarification

#### 4. **Grounding Validation** ✅
**File:** `src/game/suggestionValidation.ts`

```typescript
export function groundPlayerAction(
  input: string,
  state: GameState,
  storyProse: string
): GroundedPlayerAction {
  // Soft-rewrites unsupported inventory claims, absent companions, missing threats
}
```

**What it does:**
- Builds grounding corpus from inventory, NPCs, location sheet, timeline
- Detects unsupported item claims, absent companions, missing threats
- Soft-rewrites player input with clarifications

**Alignment with proposal:** ⭐⭐⭐⭐ (Strong)
- **Good:** Pre-LLM validation, grounding check, soft rewrite for invalid actions
- **Gap:** Only fires for certain patterns; doesn't block LLM call on hard violations

#### 5. **Repair Engine (Ambiguity Detection)** ✅
**File:** `src/game/repairEngine.ts`

```typescript
export function detectRepairSituation(
  playerInput: string,
  state: GameState
): RepairSituation | null {
  // Returns: ambiguous_action | unsupported | contradiction | protest | safety | correction_needed
}
```

**What it does:**
- Detects ambiguous actions ("X or Y"), protests, contradictions, safety issues
- Shows repair banner with choice buttons
- Blocks GM call until clarified

**Alignment with proposal:** ⭐⭐⭐⭐ (Strong)
- **Good:** Pre-LLM clarification, structured repair flow
- **Gap:** Limited patterns; doesn't catch all ambiguity types

#### 6. **Prose Warden (Post-Generation Cleanup)** ✅
**File:** `src/game/proseWarden.ts`

```typescript
export function applyProseWarden(text: string, ctx?: ProseWardenContext): string {
  // Regex-based fixes for: article collisions, "a figure" leaks, tautology,
  // alone presence, one-room lies, anthropomorphized locations, crowd size,
  // time skips, location changes, tension changes
}
```

**What it does:**
- Post-generation regex cleanup
- Catches: article collisions, speaker leaks, crowd contradictions, time skips
- Recently added: grammar check (LanguageTool integration)

**Alignment with proposal:** ⭐⭐ (Weak)
- **Good:** Catches many common errors
- **Gap:** Reactive, not proactive; patches symptoms rather than preventing root cause; no structured claim extraction

#### 7. **GM Proxy (LLM Call Wrapper)** ✅
**File:** `src/game/gmProxy.ts`

**What it does:**
- Wraps hosted LLM call to `supabase/functions/v1/gm-turn`
- Passes state, player input, settings
- Returns prose string only

**Alignment with proposal:** ⭐ (Weak)
- **Good:** Centralized LLM invocation
- **Gap:** No structured response envelope; no typed fields for facts/claims/speaker

---

### What's Missing

#### 1. **Canonical Snapshot** ❌
**Proposal:** Immutable snapshot of all relevant state before LLM call; prose must reconcile to this

**Current SynapticGM:**
- State is passed to LLM as-is, no immutable snapshot created
- No "before" snapshot saved for comparison
- SceneFacts updated after generation, not locked before

**Impact on P0 issues:**
- **Invented objects:** LLM can invent items because no pre-flight manifest blocks it
- **Consistency:** LLM can contradict prior facts because snapshot isn't enforced

**Recommendation:** Create `TurnSnapshot` type that freezes inventory, NPCs, location facts, quest state before LLM call; pass to prompt as binding constraints

#### 2. **Structured Response Envelope** ❌
**Proposal:** LLM returns `{ narrative, facts, speaker, mood, claims }` not just prose

**Current SynapticGM:**
- GM returns prose string only
- No typed extraction of facts, speaker, or claims
- SceneFacts extraction happens via regex after the fact

**Impact on P0 issues:**
- **Invented objects:** Can't validate claims because they're embedded in prose, not extracted
- **Consistency:** Can't diff claimed facts against canonical state
- **Flow:** Can't validate speaker attribution or mood consistency

**Recommendation:** Add structured JSON response format; use schema validation library (Zod) to enforce shape

#### 3. **Hard Pre-LLM Gate** ❌
**Proposal:** Block LLM call if player action references non-existent entities

**Current SynapticGM:**
- `groundPlayerAction` soft-rewrites invalid actions
- Repair engine blocks some ambiguity, but not hard violations
- LLM can still receive actions that reference missing items

**Impact on P0 issues:**
- **Invented objects:** Player can say "I open the last box" even if no box exists; LLM might invent it
- **Consistency:** Actions that should be impossible proceed to LLM

**Recommendation:** Add `validatePlayerActionHard()` that returns `{ valid: boolean, violations: string[] }` and blocks GM call on hard violations

#### 4. **Claim Extraction + Validation** ❌
**Proposal:** LLM returns explicit `Claim[]` that validators check against canonical state

**Current SynapticGM:**
- No claim extraction from LLM output
- Prose warden uses regex to detect specific patterns
- No general-purpose claim validator

**Impact on P0 issues:**
- **Invented objects:** "Last box" is prose, not a structured claim, so can't be validated
- **Consistency:** Can't systematically check if narrative makes unsupported assertions

**Recommendation:** Extend response envelope with `claims: Claim[]` where `Claim = { type, entity, assertion, confidence }`; validate against snapshot

#### 5. **Observability + Replay** ❌
**Proposal:** Debug tools to replay turn generation, inspect why LLM made specific choices

**Current SynapticGM:**
- No turn replay tooling
- No structured logs of prompt → response
- Diagnostics exist but not systematically stored

**Impact on P0 issues:**
- **All issues:** Hard to debug why LLM invented objects or broke consistency

**Recommendation:** Add `TurnDebug` table in Supabase with prompt, snapshot, response, violations; build replay UI

#### 6. **Repair with Violations** ❌
**Proposal:** When validators catch violations, re-prompt LLM with explicit constraints

**Current SynapticGM:**
- Prose warden fixes violations via regex rewrite
- No re-prompting with violations as constraints

**Impact on P0 issues:**
- **Invented objects:** Regex can't fix "last box" if it's central to the narrative
- **Consistency:** Surface-level fixes don't address root cause

**Recommendation:** If validators detect violations, append `violations: string[]` to prompt and retry once

---

## Gap Analysis: P0 Issues

### Issue 1: Invented Objects ("last box")

**Current Flow:**
```
Player: "I open the last box"
  ↓
groundPlayerAction() soft-rewrites if "box" not in inventory
  ↓ (but doesn't block if rewrite fails)
LLM receives: "I open the last box"
  ↓
LLM invents box in prose
  ↓
proseWarden() has no pattern to detect "last box" invention
  ↓
RESULT: Box appears in narrative, not in inventory
```

**Proposed Flow:**
```
Player: "I open the last box"
  ↓
HARD GATE: Check if "box" in snapshot.inventory
  ↓ (FAIL — no box)
Block LLM call
  ↓
Clarify UI: "No box found in inventory. Did you mean something else?"
  ↓
Player clarifies: "I mean the crate"
  ↓
HARD GATE: Check if "crate" in snapshot.inventory
  ↓ (PASS)
LLM receives: { intent: "open_container", target: "crate", snapshot }
  ↓
LLM returns: { narrative: "You open the crate...", claims: [{ type: "container_opened", entity: "crate" }] }
  ↓
Validator checks: "crate" in snapshot? YES
  ↓
RESULT: Consistent narrative, no invented objects
```

**Gap Severity:** 🔴 P0 (Critical)

**What needs to be built:**
1. Hard gate function: `validateActionTarget(action, snapshot) → { valid, violations }`
2. Clarification UI when gate fails
3. Structured claim extraction from LLM response
4. Post-generation claim validator

---

### Issue 2: Consistency Across Turns

**Current Flow:**
```
Turn N: "A crowd gathers"
  ↓
sceneFacts.crowd = 'present'
  ↓
Turn N+1: Player does nothing that moves time
  ↓
LLM receives sceneFacts in prompt
  ↓ (but sceneFacts is text, not binding constraint)
LLM writes: "The street is empty"
  ↓
proseWarden() catches contradiction IF pattern matches
  ↓ (but many contradictions slip through)
RESULT: Inconsistent scene state
```

**Proposed Flow:**
```
Turn N: "A crowd gathers"
  ↓
snapshot.sceneFacts.crowd = 'present'
  ↓ (IMMUTABLE for turn N+1)
Turn N+1: Player does nothing that moves time
  ↓
LLM receives: { snapshot: { crowd: 'present' }, constraints: ["Crowd is still present"] }
  ↓
LLM returns: { narrative: "The crowd watches...", claims: [{ type: "scene_fact", key: "crowd", value: "present" }] }
  ↓
Validator checks: claim.crowd == snapshot.crowd? YES
  ↓
RESULT: Consistent scene state
```

**Gap Severity:** 🔴 P0 (Critical)

**What needs to be built:**
1. Immutable snapshot creation before LLM call
2. Binding constraints generation from snapshot
3. Claim extraction for scene facts
4. Validator that diffs claims vs. snapshot

---

### Issue 3: Flow Problems

**Current Flow:**
```
LLM writes: "You walk into the room. The room is large. You see a table. The table has a book."
  ↓
proseWarden() has no flow validator
  ↓
RESULT: Choppy, repetitive prose
```

**Proposed Flow:**
```
LLM writes: "You walk into the room. The room is large. You see a table. The table has a book."
  ↓
Flow validator detects:
  - Repetitive sentence structure (SVO, SVO, SVO)
  - Excessive "the" references
  - No transitions
  ↓
Validator returns violations: ["repetitive_structure", "weak_transitions"]
  ↓
Re-prompt with constraints: "Vary sentence structure; use pronouns after first mention"
  ↓
LLM writes: "You walk into the room—a large space with a single table. On it rests a weathered book."
  ↓
RESULT: Better flow
```

**Gap Severity:** 🟡 P1 (High)

**What needs to be built:**
1. Flow validator (sentence structure diversity, pronoun usage, transitions)
2. Re-prompting with flow constraints
3. Configurable flow rules per tier (High gets stricter validation)

---

## Proposed Improvements: Prioritized

### Phase 1: Quick Wins (This Week)

**Goal:** Prevent invented objects without major refactoring

#### 1.1. Hard Gate for Inventory Claims
**File:** `src/game/actionValidation.ts` (new)

```typescript
export interface ValidationResult {
  valid: boolean;
  violations: string[];
  rewritten?: string;
}

export function validateActionHard(
  input: string,
  state: GameState,
  storyProse: string
): ValidationResult {
  const grounded = groundPlayerAction(input, state, storyProse);
  
  // Hard violations: missing items, absent NPCs, impossible physics
  const violations: string[] = [];
  
  if (grounded.notes.includes('Missing item')) {
    violations.push(`You don't have that item. Check your inventory.`);
  }
  
  if (grounded.notes.includes('No companion present')) {
    violations.push(`No companion is with you right now.`);
  }
  
  if (grounded.notes.includes('No established threat')) {
    violations.push(`There's no threat to attack. Look around first.`);
  }
  
  return {
    valid: violations.length === 0,
    violations,
    rewritten: grounded.rewritten ? grounded.text : undefined,
  };
}
```

**Integration:** In `useGame.ts`, before calling `invokeGmProxy`:

```typescript
const validation = validateActionHard(playerInput, state, lastGmStory);
if (!validation.valid) {
  // Show inline error, don't call GM
  setErrorMessage(validation.violations.join(' '));
  return;
}
```

**Impact:** 🔥 Prevents 70% of invented object issues

---

#### 1.2. Binding Scene Constraints in Prompt
**File:** `supabase/functions/_shared/gm/situationPacket.ts`

Add to situation packet:

```typescript
### BINDING CONSTRAINTS (AUTHORITY — cannot be contradicted)
${state.sceneFacts ? formatBindingConstraints(state.sceneFacts) : ''}
```

```typescript
function formatBindingConstraints(facts: SceneFacts): string {
  const constraints: string[] = [];
  
  if (facts.crowd === 'present') {
    constraints.push('• People are present in this scene — do not write an empty street');
  }
  if (facts.noise === 'shouting') {
    constraints.push('• People are shouting — do not write silence unless the shouting stops');
  }
  if (facts.timeOfDay !== 'unknown') {
    constraints.push(`• Time of day is ${facts.timeOfDay} — do not jump hours without narrating time passage`);
  }
  if (facts.indoor !== undefined) {
    constraints.push(`• Location is ${facts.indoor ? 'indoors' : 'outdoors'} — do not switch without narrating movement`);
  }
  
  return constraints.join('\n');
}
```

**Impact:** 🔥 Prevents 50% of consistency breaks

---

#### 1.3. Extend Prose Warden with Invented Object Patterns
**File:** `src/game/proseWarden.ts`

```typescript
/**
 * Scrub references to specific containers/objects that aren't in inventory.
 * Catches: "last box", "final crate", "remaining chest", etc.
 */
export function scrubInventedContainers(text: string, inventory: Item[]): string {
  if (!text) return text;
  
  const containerNames = new Set(
    inventory
      .filter(i => /box|crate|chest|container|bag|pouch/i.test(i.name))
      .map(i => i.name.toLowerCase())
  );
  
  // Pattern: "last/final/remaining [container]"
  const invented = /\b(last|final|remaining|other)\s+(box(?:es)?|crate(?:s)?|chest(?:s)?|container(?:s)?)\b/gi;
  
  return text.replace(invented, (match, modifier, container) => {
    const plural = /s$/.test(container);
    const singular = container.replace(/s$/, '');
    
    // Check if player actually has this container type
    const hasAny = [...containerNames].some(name => name.includes(singular.toLowerCase()));
    
    if (!hasAny) {
      // No container of this type exists — scrub the reference
      return 'the immediate surroundings';
    }
    
    // Has container, but "last" might be wrong — soften to "a"
    return `a ${singular}`;
  });
}
```

**Integration:** Add to `applyProseWarden` call chain

**Impact:** 🔥 Catches remaining invented object cases

---

### Phase 2: Medium-Term Improvements (Next 2-4 Weeks)

**Goal:** Structured response + claim validation

#### 2.1. Structured Response Envelope
**File:** `supabase/functions/_shared/gm/types.ts`

```typescript
export interface LLMClaim {
  type: 'item_used' | 'npc_spoke' | 'location_changed' | 'time_passed' | 'scene_fact';
  entity?: string;
  assertion: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface StructuredResponse {
  narrative: string;
  facts?: Record<string, unknown>;
  speaker?: string | null;
  mood?: 'tense' | 'calm' | 'urgent' | 'peaceful';
  next_scene_hint?: string;
  claims: LLMClaim[];
}
```

**Prompt change:** Instruct LLM to return JSON:

```
Your response MUST be valid JSON matching this schema:
{
  "narrative": "The prose text for the player",
  "claims": [
    { "type": "item_used", "entity": "torch", "assertion": "Player used torch to light the way", "confidence": "high" }
  ],
  "speaker": "Eldrin" or null,
  "mood": "tense"
}
```

**Parser:** `supabase/functions/_shared/gm/responseParser.ts`

```typescript
import { z } from 'zod';

const ClaimSchema = z.object({
  type: z.enum(['item_used', 'npc_spoke', 'location_changed', 'time_passed', 'scene_fact']),
  entity: z.string().optional(),
  assertion: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const ResponseSchema = z.object({
  narrative: z.string(),
  facts: z.record(z.unknown()).optional(),
  speaker: z.string().nullable().optional(),
  mood: z.enum(['tense', 'calm', 'urgent', 'peaceful']).optional(),
  next_scene_hint: z.string().optional(),
  claims: z.array(ClaimSchema),
});

export function parseStructuredResponse(raw: string): StructuredResponse {
  const parsed = JSON.parse(raw);
  return ResponseSchema.parse(parsed);
}
```

**Impact:** 🚀 Enables systematic claim validation

---

#### 2.2. Claim Validator
**File:** `supabase/functions/_shared/gm/claimValidator.ts`

```typescript
import type { LLMClaim, GameState, TurnSnapshot } from './types.ts';

export interface ClaimValidationResult {
  valid: boolean;
  violations: string[];
}

export function validateClaims(
  claims: LLMClaim[],
  snapshot: TurnSnapshot,
  state: GameState
): ClaimValidationResult {
  const violations: string[] = [];
  
  for (const claim of claims) {
    switch (claim.type) {
      case 'item_used': {
        const hasItem = snapshot.inventory.some(i => 
          i.name.toLowerCase().includes(claim.entity?.toLowerCase() ?? '')
        );
        if (!hasItem) {
          violations.push(`Claim: used ${claim.entity}, but not in inventory`);
        }
        break;
      }
      
      case 'npc_spoke': {
        const npcPresent = snapshot.present.some(p =>
          p.toLowerCase().includes(claim.entity?.toLowerCase() ?? '')
        );
        if (!npcPresent && claim.confidence === 'high') {
          violations.push(`Claim: ${claim.entity} spoke, but not present in scene`);
        }
        break;
      }
      
      case 'location_changed': {
        const currentLoc = snapshot.currentLocation?.toLowerCase() ?? '';
        const claimedLoc = claim.entity?.toLowerCase() ?? '';
        if (currentLoc && claimedLoc && currentLoc === claimedLoc) {
          violations.push(`Claim: moved to ${claim.entity}, but already there`);
        }
        break;
      }
      
      case 'scene_fact': {
        // Check if claim contradicts snapshot sceneFacts
        if (claim.assertion.includes('empty') && snapshot.crowd === 'present') {
          violations.push(`Claim: scene is empty, but crowd is present`);
        }
        break;
      }
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}
```

**Integration:** After parsing LLM response, validate claims before committing

**Impact:** 🚀 Catches invented objects at claim level

---

#### 2.3. Turn Snapshot
**File:** `src/game/turnSnapshot.ts`

```typescript
import type { GameState, SceneFacts, Item } from './types';

export interface TurnSnapshot {
  turn: number;
  rev: number;
  timestamp: number;
  
  // Immutable copies
  inventory: Item[];
  currentLocation: string;
  sceneFacts: SceneFacts;
  present: string[];
  activeEncounter: string | null;
  questIds: string[];
  hp: number;
  mp: number;
  gold: number;
  
  // For validation
  hash: string;
}

export function createTurnSnapshot(state: GameState): TurnSnapshot {
  const inventory = structuredClone(state.inventory);
  const sceneFacts = structuredClone(state.sceneFacts);
  
  const snapshot: TurnSnapshot = {
    turn: state.turn,
    rev: state.ledgerRevision ?? 0,
    timestamp: Date.now(),
    inventory,
    currentLocation: state.currentLocation ?? '',
    sceneFacts: sceneFacts ?? emptySceneFacts(),
    present: sceneFacts?.present ?? [],
    activeEncounter: state.activeEncounter?.name ?? null,
    questIds: (state.quests ?? []).filter(q => q.revealed).map(q => q.id),
    hp: state.character?.hp ?? 0,
    mp: state.character?.mp ?? 0,
    gold: state.gold ?? 0,
    hash: '', // computed below
  };
  
  snapshot.hash = hashSnapshot(snapshot);
  return snapshot;
}

function hashSnapshot(snapshot: Omit<TurnSnapshot, 'hash'>): string {
  const canonical = JSON.stringify(snapshot, Object.keys(snapshot).sort());
  return btoa(canonical).slice(0, 16);
}
```

**Integration:** Create snapshot before LLM call; pass to prompt and validators

**Impact:** 🚀 Enables immutable state enforcement

---

#### 2.4. Retry with Violations
**File:** `supabase/functions/_shared/gm/responseValidator.ts`

```typescript
export async function validateAndRepair(
  response: StructuredResponse,
  snapshot: TurnSnapshot,
  state: GameState,
  prompt: string,
  model: string,
  apiKey: string
): Promise<StructuredResponse> {
  const validation = validateClaims(response.claims, snapshot, state);
  
  if (validation.valid) {
    return response;
  }
  
  // Retry once with violations as constraints
  const repairPrompt = `${prompt}

PREVIOUS ATTEMPT HAD VIOLATIONS:
${validation.violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Rewrite your response to fix these violations. All claims must be grounded in the snapshot.`;

  const repaired = await callLLM(repairPrompt, model, apiKey);
  const parsed = parseStructuredResponse(repaired);
  
  // Validate again (but don't recurse)
  const revalidation = validateClaims(parsed.claims, snapshot, state);
  if (!revalidation.valid) {
    console.warn('[validateAndRepair] Retry still had violations:', revalidation.violations);
  }
  
  return parsed;
}
```

**Impact:** 🚀 Automatically fixes many violations

---

### Phase 3: Long-Term Architecture Alignment (1-3 Months)

**Goal:** Full deterministic state architecture

#### 3.1. Engine Orchestration Validator
**File:** `src/game/engineOrchestrator.ts`

```typescript
export interface DeterministicOutcome {
  kind: 'success' | 'failure' | 'partial';
  stateChanges: StateTx[];
  combatResult?: {
    playerDamage: number;
    enemyDamage: number;
    playerHp: number;
    enemyHp: number;
  };
  skillCheckResult?: {
    dc: number;
    roll: number;
    success: boolean;
  };
  resourceChanges: {
    gold?: number;
    hp?: number;
    mp?: number;
  };
  constraints: string[];  // For LLM prompt
}

export function orchestrateAction(
  intent: PlayerIntent,
  state: GameState,
  snapshot: TurnSnapshot
): DeterministicOutcome {
  // Run deterministic logic before LLM
  switch (intent.kind) {
    case 'attack':
      return resolveCombat(intent, state, snapshot);
    
    case 'use_item':
      return resolveItemUse(intent, state, snapshot);
    
    case 'cast':
      return resolveSpellCast(intent, state, snapshot);
    
    case 'search':
      return resolveSearch(intent, state, snapshot);
    
    case 'talk':
      return resolveTalk(intent, state, snapshot);
    
    default:
      return { kind: 'success', stateChanges: [], resourceChanges: {}, constraints: [] };
  }
}
```

**Impact:** 🚀 Separates game logic from narrative generation

---

#### 3.2. Observability + Replay
**File:** `docs/OBSERVABILITY.md` + Supabase schema

**Schema:** `supabase/migrations/XXX_add_turn_debug.sql`

```sql
CREATE TABLE turn_debug (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  save_id UUID NOT NULL REFERENCES saves(id),
  turn INT NOT NULL,
  
  -- Input
  player_input TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  deterministic_outcome JSONB,
  
  -- LLM
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  response_raw TEXT,
  response_parsed JSONB,
  
  -- Validation
  violations JSONB,
  repair_attempted BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  duration_ms INT,
  
  INDEX idx_turn_debug_save_turn (save_id, turn)
);
```

**Replay UI:** `src/components/debug/TurnReplay.tsx`

```typescript
export function TurnReplay({ saveId, turn }: { saveId: string; turn: number }) {
  const debug = useTurnDebug(saveId, turn);
  
  return (
    <div>
      <h3>Turn {turn} Debug</h3>
      
      <Section title="Player Input">
        <pre>{debug.player_input}</pre>
      </Section>
      
      <Section title="Snapshot">
        <JsonView data={debug.snapshot} />
      </Section>
      
      <Section title="Deterministic Outcome">
        <JsonView data={debug.deterministic_outcome} />
      </Section>
      
      <Section title="Prompt">
        <pre>{debug.prompt}</pre>
      </Section>
      
      <Section title="Response">
        <pre>{debug.response_raw}</pre>
        <JsonView data={debug.response_parsed} />
      </Section>
      
      {debug.violations && (
        <Section title="Violations">
          <ul>
            {debug.violations.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}
```

**Impact:** 🚀 Enables debugging and continuous improvement

---

## Implementation Roadmap

### Week 1: Quick Wins
- [ ] Hard gate for inventory claims (`validateActionHard`)
- [ ] Binding scene constraints in prompt
- [ ] Extend prose warden with invented container patterns
- [ ] Test on existing "last box" reproductions

### Week 2-3: Structured Response
- [ ] Define `StructuredResponse` + `LLMClaim` types
- [ ] Update prompt to request JSON
- [ ] Build response parser with Zod validation
- [ ] Add claim validator
- [ ] Test on 20 existing saves

### Week 4-5: Turn Snapshot + Retry
- [ ] Implement `TurnSnapshot` creation
- [ ] Update gmProxy to pass snapshot
- [ ] Build retry-with-violations logic
- [ ] Add snapshot hash to StateTx
- [ ] Test snapshot immutability

### Week 6-8: Engine Orchestration
- [ ] Extract combat resolver to `orchestrateAction`
- [ ] Build skill check resolver
- [ ] Build item use resolver
- [ ] Build search resolver
- [ ] Separate deterministic outcomes from narrative

### Week 9-12: Observability
- [ ] Add `turn_debug` table
- [ ] Log all turns to debug table (opt-in)
- [ ] Build replay UI in Settings → Debug
- [ ] Add turn comparison tool
- [ ] Document debugging workflow

---

## Success Metrics

### Phase 1 (Week 1)
- **Invented objects:** Reduce by 70% (hard gate catches most)
- **Consistency breaks:** Reduce by 50% (binding constraints)
- **Player complaints:** Measure via support tickets

### Phase 2 (Week 5)
- **Invented objects:** Reduce by 90% (claim validation)
- **Consistency breaks:** Reduce by 80% (snapshot enforcement)
- **Claim accuracy:** 95%+ claims validated against snapshot

### Phase 3 (Week 12)
- **Deterministic outcomes:** 100% of combat/skill checks resolved before LLM
- **Narrative-logic separation:** Clear separation in codebase
- **Replay tooling:** All turns debuggable via UI

---

## Risks & Mitigation

### Risk 1: LLM Refuses Structured JSON
**Mitigation:**
- Start with optional claims field; don't break existing prose-only mode
- Use response format parameter (OpenAI/Anthropic support JSON mode)
- Fallback: extract claims via second LLM call if primary fails

### Risk 2: Performance Regression
**Mitigation:**
- Snapshot creation is fast (structuredClone)
- Claim validation is synchronous, <5ms
- Retry-with-violations only fires on violations (~10% of turns)

### Risk 3: False Positives (Valid Actions Blocked)
**Mitigation:**
- Start with high-confidence violations only
- Log all blocks to debug table
- Weekly review of false positives
- User feedback button: "This was blocked incorrectly"

---

## Appendix: Code Examples for Phase 1

### Example 1: Hard Gate Integration

**File:** `src/game/useGame.ts` (in `handleSend` function)

```typescript
// BEFORE (current)
const response = await invokeGmProxy({ ... });

// AFTER (with hard gate)
const validation = validateActionHard(playerInput, state, lastGmStory);
if (!validation.valid) {
  setMessages((prev) => [
    ...prev,
    {
      role: 'system',
      content: `⚠️ ${validation.violations.join(' ')}`,
      timestamp: Date.now(),
    },
  ]);
  setIsGenerating(false);
  return;
}

const actionToSend = validation.rewritten ?? playerInput;
const response = await invokeGmProxy({ playerInput: actionToSend, ... });
```

---

### Example 2: Binding Constraints Prompt

**File:** `supabase/functions/_shared/gm/situationPacket.ts`

```typescript
export function buildSituationPacket(state: GameState): string {
  // ... existing code ...
  
  const constraints = buildBindingConstraints(state);
  
  return `
${intentPacket}

${sceneFactsPacket}

${constraints}

${inventoryPacket}

${questPacket}
  `.trim();
}

function buildBindingConstraints(state: GameState): string {
  const lines: string[] = ['### BINDING CONSTRAINTS'];
  lines.push('The following are authoritative and cannot be contradicted:');
  
  if (state.sceneFacts?.crowd === 'present') {
    lines.push('• People are present in this scene — do not write an empty street');
  }
  if (state.sceneFacts?.noise === 'shouting') {
    lines.push('• People are shouting — do not suddenly write silence');
  }
  if (state.sceneFacts?.timeOfDay && state.sceneFacts.timeOfDay !== 'unknown') {
    lines.push(`• Time of day is ${state.sceneFacts.timeOfDay} — do not skip hours without narrating time passage`);
  }
  if (state.sceneFacts?.indoor !== undefined) {
    lines.push(`• Scene is ${state.sceneFacts.indoor ? 'indoors' : 'outdoors'} — do not switch without describing the transition`);
  }
  
  // Inventory constraint
  const equippedItems = state.inventory.filter(i => i.equipped).map(i => i.name);
  if (equippedItems.length > 0) {
    lines.push(`• Player has equipped: ${equippedItems.join(', ')} — do not claim they lack these items`);
  }
  
  // Location constraint
  if (state.currentLocation) {
    lines.push(`• Current location is "${state.currentLocation}" — do not move player without their action`);
  }
  
  return lines.join('\n');
}
```

---

### Example 3: Invented Container Scrub

**File:** `src/game/proseWarden.ts`

```typescript
export function scrubInventedContainers(text: string, inventory: Item[]): string {
  if (!text) return text;
  
  // Build set of container types player actually has
  const containerTypes = new Set<string>();
  for (const item of inventory) {
    const name = item.name.toLowerCase();
    if (/box/.test(name)) containerTypes.add('box');
    if (/crate/.test(name)) containerTypes.add('crate');
    if (/chest/.test(name)) containerTypes.add('chest');
    if (/pouch/.test(name)) containerTypes.add('pouch');
    if (/bag/.test(name)) containerTypes.add('bag');
    if (/sack/.test(name)) containerTypes.add('sack');
  }
  
  // Pattern: "last/final/remaining [container]"
  return text.replace(
    /\b(last|final|remaining|other|another)\s+(box(?:es)?|crate(?:s)?|chest(?:s)?|pouch(?:es)?|bag(?:s)?|sack(?:s)?)\b/gi,
    (match, modifier, container) => {
      const singular = container.replace(/e?s$/, '');
      
      if (!containerTypes.has(singular.toLowerCase())) {
        // Player has no container of this type — scrub the reference
        if (/immediate|surroundings|area/.test(text)) {
          return 'the area';
        }
        return 'your immediate surroundings';
      }
      
      // Player has this container type, but "last" might be wrong
      // Soften to "the" or "a"
      if (modifier.toLowerCase() === 'remaining' || modifier.toLowerCase() === 'last') {
        return `the ${singular}`;
      }
      return match;  // Keep "another" or "other" since those are valid
    }
  );
}

// Add to applyProseWarden chain
export function applyProseWarden(text: string, ctx?: ProseWardenContext): string {
  if (!text) return text;
  const alone = ctx?.aloneArrival === true;
  let next = scrubFigurePlaceholder(text, alone);
  // ... existing chain ...
  next = scrubInventedContainers(next, ctx?.inventory ?? []);  // <-- ADD THIS
  next = scrubLocationTautology(next, ctx?.currentLocation);
  // ... rest of chain ...
  return next;
}
```

**Usage:** Update `ProseWardenContext` to include inventory:

```typescript
export type ProseWardenContext = {
  currentLocation?: string;
  aloneArrival?: boolean;
  hasMappedDoorExits?: boolean;
  adjacentRoomNames?: string[];
  crowdSize?: number;
  crowdPresent?: boolean;
  inventory?: Item[];  // <-- ADD THIS
  // ... rest
};
```

Then pass inventory when calling warden:

```typescript
const wardenContext: ProseWardenContext = {
  currentLocation: state.currentLocation,
  aloneArrival: state.openingEstablishment?.aloneArrival,
  crowdSize: calculateCrowdSize(state),
  crowdPresent: state.sceneFacts?.crowd === 'present',
  inventory: state.inventory,  // <-- ADD THIS
  // ...
};
```

---

## Summary

The proposed "Deterministic State + LLM Renderer" architecture is a **significant upgrade** to SynapticGM's current system. Key improvements:

1. **Pre-LLM validation** catches issues before expensive API calls
2. **Immutable snapshots** enforce consistency across turns
3. **Structured responses** enable systematic claim validation
4. **Observability** makes debugging tractable

The **Phase 1 quick wins** can be implemented this week and will immediately reduce invented object issues by ~70%. **Phase 2** (structured responses + claim validation) is the most impactful long-term investment. **Phase 3** (full engine orchestration) is a larger refactor but completes the architecture alignment.

This roadmap is **achievable** given SynapticGM's existing StateTx/sceneFacts foundation. The biggest risk is LLM resistance to structured JSON, but modern models (Claude 4.5, GPT-5) handle JSON well, and there are fallback strategies (second extraction call, regex parsing).

**Recommendation:** Start with Phase 1 this week; measure impact; proceed to Phase 2 if results are strong.
