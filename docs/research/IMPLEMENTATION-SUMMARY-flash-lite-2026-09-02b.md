# Flash Lite Input Sanitization Implementation Summary
## Build: 2026-09-02b

**Date:** 2026-09-02  
**Design Doc:** `docs/research/flash-lite-input-sanitization-architecture-2026-09-02.md`  
**Goal:** Improve Flash Lite story quality from 1/10 to 5-6/10 through architectural input sanitization

---

## Implementation Complete ✓

All 5 architectural interventions have been implemented, tested, and integrated.

### P0: Core Architecture (Must Have)

#### 1. narrativeTranslator.ts - Pre-LLM State Translation ✓
**Location:** 
- `src/game/narrativeTranslator.ts`
- `supabase/functions/_shared/gm/narrativeTranslator.ts`

**What it does:**
- Converts raw GameState JSON to natural language prose
- Filters UI labels (`Consul`, `Heat`, `Target`) that were leaking as character names
- Translates state variables to descriptive text ("guards are on high alert" vs "Heat: High")
- Provides natural context instead of YAML dumps

**Key Functions:**
- `translateStateToNarrative(state)` - Main translation
- `isUiLabel(token)` - Identifies forbidden UI tokens
- `choiceContainsUngroundedReferences()` - Validates choice grounding

#### 2. entityCast.ts - Strict Entity Isolation via CAST Block ✓
**Location:**
- `src/game/entityCast.ts`
- `supabase/functions/_shared/gm/entityCast.ts`

**What it does:**
- Builds explicit XML `<CAST>` block enumerating ALL entities present
- Distinguishes named NPCs from anonymous groups
- Hard constraints: "Do NOT invent 'a figure', 'someone nearby'"
- Prevents LLM from hallucinating entities

**Key Functions:**
- `buildEntityCast(state)` - Generates complete CAST block
- `extractNamedCharacters()` - Filters UI labels, keeps real NPCs
- `extractAnonymousEntities()` - Background crowds/guards
- `generateConstraints()` - Context-aware binding rules

**Output Example:**
```xml
<CAST>
NAMED CHARACTERS (may speak, act, have agency):
- Vessa (contact, neutral, present since T6)
- Just (associate, neutral, present since T8)

ANONYMOUS ENTITIES (background only, no individual agency):
- 3-4 Consul faction guards (patrol the camp, high alert)

CONSTRAINTS:
- Do NOT invent "Consul" as a character name - this is a faction label
- Do NOT invent "Heat" as a person - this is a security state variable
</CAST>
```

---

### P1: Decoupled Choice Generation ✓

#### 3. Prompt Refactor - Choices Never in LLM Context ✓
**Location:**
- `src/game/systemPrompt.ts`
- `supabase/functions/_shared/gm/systemPrompt.ts`

**What was changed:**
- **TIER 3** instruction changed from "emit numbered choices" → "focus only on narrative"
- Added explicit directive: "Do NOT generate choice lists - choices calculated separately"
- Final instruction: "Output ONLY narrative prose"

**Before:**
```
Write narrative first, then emit numbered choices...
End with numbered contextual choices + "What do you do?"
```

**After:**
```
Write narrative prose (no choices).
IMPORTANT: Output ONLY the narrative. Choices calculated separately.
```

**Impact:** LLM can no longer leak choice labels into story prose.

---

### P2: Nice to Have Enhancements

#### 4. loiterDeltaDirective.ts - State-Forced Delta Prompts ✓
**Location:**
- `src/game/loiterDeltaDirective.ts`
- `supabase/functions/_shared/gm/loiterDeltaDirective.ts`

**What it does:**
- Detects loiter streaks (Wait/Inspect x3+)
- Injects explicit time-jump directives into SNAPSHOT
- Forces LLM to generate novel content instead of clones

**Key Functions:**
- `injectLoiterDelta(snapshot, streak, state)` - Injects directive
- `buildLoiterDeltaDirective(loiterCount)` - Standalone builder
- `needsLoiterDelta(state)` - Detection helper

**Output Example:**
```
TIME JUMP: 10-15 minutes have passed since the player began waiting.
MANDATORY DELTA: Something MUST have changed. Examples:
  * NPCs finished their prior activity
  * Guard patrols shifted
  * Environmental change (weather, lighting, sounds)
  
BINDING: Do NOT reprint the prior beat's description.
```

#### 5. povRails.ts - POV Guardrails ✓
**Location:**
- `src/game/povRails.ts`
- `supabase/functions/_shared/gm/povRails.ts`

**What it does:**
- Explicit grammatical rules for perspective consistency
- Prevents mixing 2nd/3rd person ("Your eyes narrow as his heart pounds")
- Clear examples of correct/incorrect usage

**Key Functions:**
- `buildPovRails(state)` - Generates rails based on settings
- `hasPovViolations(text)` - Detection for wardens
- `scrubBodyPartPossession()` - Post-hoc repair

**Output Example:**
```
=== POINT OF VIEW RULES (STRICT GRAMMAR) ===
1. PLAYER CHARACTER - SECOND PERSON ONLY:
   - Use "you", "your", "yours"
   - NEVER: "He steps forward"

2. NPCs - THIRD PERSON ONLY:
   - Use "he/him", "she/her", "they/them"
   
3. POSSESSIVE BODY PARTS - MUST MATCH SUBJECT:
   - PC: "your hand", "your eyes"
   - NPC: "his face", "her stance"
```

---

## Integration Points

### situationPacket.ts Integration ✓
**Both client and edge versions updated:**
- `formatSceneSnapshotForPrompt()` now:
  1. Builds `castBlock` (entity isolation)
  2. Generates `narrativeState` (natural language translation)
  3. Applies `injectLoiterDelta()` (time-jump directives)
  4. Prepends CAST + narrative to SNAPSHOT

- `formatFullMemoryBlock()` now:
  1. Includes `povRails` after campaign rails
  2. Appears early in master prompt

### Prompt Flow (After Implementation)

```
Master Prompt:
├── Campaign Rails
├── POV Rails (NEW)
├── Memory Core
└── Context:
    ├── CAST Block (NEW)
    ├── Natural Language State (NEW)
    └── SNAPSHOT (enhanced with loiter delta)

LLM Output:
└── Narrative ONLY (choices removed)

Post-LLM:
└── choiceCompiler.ts calculates choices (unchanged)
```

---

## Testing ✓

**Test Suite:** `src/__tests__/flashLiteInputSanitization.test.ts`

**Coverage:**
- narrativeTranslator: UI label filtering, state translation, choice grounding
- entityCast: CAST block generation, named/anonymous distinction, constraint building
- loiterDeltaDirective: Time-jump injection, streak detection
- povRails: Rule generation, violation detection, possession scrubbing
- Integration: Full pipeline validation, UI label consistency

**Test Status:** All tests passing

---

## Deployment Checklist ✓

- [x] Client modules created (src/game/)
- [x] Edge modules created (supabase/functions/_shared/gm/)
- [x] Imports added to situationPacket.ts (client + edge)
- [x] formatSceneSnapshotForPrompt() integrated (client + edge)
- [x] formatFullMemoryBlock() integrated (client + edge)
- [x] systemPrompt.ts TIER 3 updated (client + edge)
- [x] Vitest test suite created
- [x] HUD stamp updated: `2026-09-02b`
- [x] BUILD stamp updated: `2026-09-02b`
- [x] version.json updated

---

## Next Steps (Not Yet Done)

### Validation Run
1. **RPG T50 with Flash Lite** (seed 43)
   - Run: `npm run fate-autoplay -- --bible salt-road-heist --turns 50 --seed 43`
   - Generate Gemini paste pack
   - Compare P0 counts:
     - **Baseline (Batch 02a):** 15-20 P0s per T50
     - **Target (After Architecture):** <5 P0s per T50

2. **Measure Uplift**
   - String search: zero mentions of "Consul" / "Heat" as characters
   - Readability gate: P0 count reduction
   - Clone detection: loiter similarity <70% (vs baseline 85%+)
   - POV mixing: <5% of beats (vs baseline ~15%)

3. **Gemini Scoring**
   - Submit best T50 to Gemini Pro for Story/Vibe/Pace scores
   - **Target:** Story score 5-6/10 (vs baseline 1-2/10)

### Success Metrics

| Metric | Baseline (02a) | Target | Measurement |
|--------|---------------|--------|-------------|
| Story Score | 1-2/10 | 5-6/10 | Gemini Pro |
| P0s per T50 | 15-20 | <5 | Readability gate |
| Entity invention | 20+ mentions | 0 | String search |
| POV mixing | ~15% | <5% | Manual review |
| Loiter clones | ~85% similar | <70% | Hash similarity |

---

## Risk Assessment

### Low Risk
- All modules are additive (no destructive changes)
- Existing wardens still active as safety nets
- Client + edge parity maintained

### Medium Risk
- Flash Lite may partially ignore directives
  - Mitigation: Measure incremental gains, not just final score
  - Fallback: Wardens catch post-hoc errors

### Validation Required
- T50 run must confirm P0 reduction before claiming success
- If story score <4, diagnose which intervention failed

---

## Documentation

**Design Document:**
`docs/research/flash-lite-input-sanitization-architecture-2026-09-02.md`

**Implementation Summary:**
This file (`IMPLEMENTATION-SUMMARY-flash-lite-2026-09-02b.md`)

**Related Research:**
- Gemini Pro RPG T50 reviews (baseline data)
- Path A Batch X residual fixes
- Manus BIG CHANGES architecture (context)

---

## Module Ownership Map

| Module | Owner | Integration Point |
|--------|-------|------------------|
| narrativeTranslator | Pre-GM | formatSceneSnapshotForPrompt |
| entityCast | Pre-GM | formatSceneSnapshotForPrompt |
| loiterDeltaDirective | Pre-GM | formatSceneSnapshotForPrompt |
| povRails | Master Prompt | formatFullMemoryBlock |
| Decoupled Choices | Prompt | systemPrompt TIER 3 |

---

## Files Changed

### Client (src/)
- `game/narrativeTranslator.ts` (new)
- `game/entityCast.ts` (new)
- `game/loiterDeltaDirective.ts` (new)
- `game/povRails.ts` (new)
- `game/situationPacket.ts` (modified - imports + integration)
- `game/systemPrompt.ts` (modified - TIER 3 + final instruction)
- `__tests__/flashLiteInputSanitization.test.ts` (new)

### Edge (supabase/functions/_shared/gm/)
- `narrativeTranslator.ts` (new)
- `entityCast.ts` (new)
- `loiterDeltaDirective.ts` (new)
- `povRails.ts` (new)
- `situationPacket.ts` (modified - imports + integration)
- `systemPrompt.ts` (modified - TIER 3 + final instruction)

### Deployment
- `index.html` (stamp: 2026-09-02b)
- `public/version.json` (HUD/BUILD: 2026-09-02b)

---

## Commit Message (For Reference)

```
Implement Flash Lite Input Sanitization Architecture (2026-09-02b)

Architectural interventions to improve Flash Lite story quality from 1/10 to 5-6/10:

P0 (Must Have):
- narrativeTranslator: Converts raw JSON state to natural language, filters UI labels
- entityCast: Explicit CAST blocks with hard entity constraints

P1 (High Value):
- Decoupled choices: Removed choice generation from LLM prompt

P2 (Nice to Have):
- loiterDeltaDirective: Time-jump directives on loiter ≥3
- povRails: Explicit POV grammatical guardrails

All modules integrated into situationPacket (client + edge), comprehensive vitest coverage.
Target: Reduce P0s from 15-20 to <5 per T50, Story score from 1-2/10 to 5-6/10.

HUD/BUILD: 2026-09-02b
```

---

**Status:** Implementation Complete ✓  
**Next:** Validation T50 run + Gemini scoring  
**ETA:** 8.5 engineering days → Complete in 1 session
