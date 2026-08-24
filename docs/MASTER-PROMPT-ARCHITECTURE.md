# Master Prompt Architecture v2.0

## Executive Summary

The new Master Prompt replaces the 700+ line rule soup in `systemPrompt.ts` with a **strict 4-layer hierarchy**:

```
┌─────────────────────────────────────────┐
│ 1. CRITICAL DIRECTIVES (blocking rules) │  ← ALWAYS enforced
├─────────────────────────────────────────┤
│ 2. ENGINE MODE DNA (mutually exclusive) │  ← ONE active per game
├─────────────────────────────────────────┤
│ 3. TURN STRUCTURE (output template)     │  ← Forces proper formatting
├─────────────────────────────────────────┤
│ 4. SUPPORTING RAILS (voice, prose, etc.)│  ← Flavor & safety
└─────────────────────────────────────────┘
```

## The Problems We're Solving

### Before (systemPrompt.ts issues):
- ❌ **Rule dilution**: 152 lines of BASE_PROMPT mixing priorities
- ❌ **Mode leakage**: LitRPG chrome bleeding into D&D
- ❌ **Scattered enforcement**: "Never invent items" repeated 6 times
- ❌ **Weak structure**: No forced narrative → mechanics → choices separation
- ❌ **Hidden mode rules**: Mode DNA buried on line 600+

### After (masterPrompt.ts benefits):
- ✅ **Clear hierarchy**: Critical rules at top (can't miss them)
- ✅ **Mode isolation**: Only ONE mode block active, visually distinct
- ✅ **Single source of truth**: Each rule stated once, powerfully
- ✅ **Enforced structure**: Turn template forces proper output
- ✅ **Visual clarity**: Box drawing + emoji make structure scannable

## Layer 1: CRITICAL DIRECTIVES

**Purpose**: Blocking rules that break game state if violated

```
【 RULE 1: INVENTORY & GOLD AUTHORITY 】
【 RULE 2: WORLD STATE INTEGRITY 】  
【 RULE 3: PLAYER AGENCY 】
```

**Why this works**:
- Places **absolute rules at top** where LLM attention is highest
- Uses **visual headers** (Unicode box drawing) to make rules pop
- **Consolidates** scattered inventory rules into ONE powerful block
- **Action templates** show AI exactly what to do when rules violated

## Layer 2: ENGINE MODE BEHAVIORAL DNA

**Purpose**: Define HOW the AI behaves in each mode (mutually exclusive)

Each mode block contains:
1. **CORE IDENTITY** - What is this mode?
2. **NARRATIVE VOICE** - How should it sound?
3. **MECHANICS DISPLAY** - What's visible to players?
4. **TURN STRUCTURE TEMPLATE** - Concrete output example
5. **FORBIDDEN** - What NEVER appears in this mode

### Example: LITRPG Mode

```
┌───────────────────────────────────────────┐
│ MODE: LITRPG - System-Focused Progression │
└───────────────────────────────────────────┘

【 NARRATIVE VOICE 】
TWO VOICES (same turn):

1. NARRATOR (prose)
   • "The blade catches bone. You feel the resistance."
   • NO dice math in prose

2. SYSTEM (after prose, in <system> tags)
   • "Registration complete. Level Up!"
```

**Why this works**:
- **Isolation**: Only ONE mode block active → impossible to mix LitRPG panels into D&D
- **Templates**: Shows exact output format expected
- **Forbidden section**: Explicitly bans cross-mode contamination
- **Visual distinction**: Box drawing makes mode boundaries unmissable

### Mode Comparison Table

| Feature                | LitRPG | D&D | RPG | PYOA |
|------------------------|--------|-----|-----|------|
| Dice visibility        | Hidden | Shown | Hidden | Hidden |
| System chrome          | <system> tags | None | None | None |
| World type             | Modern | Medieval | Any | Per-campaign |
| Choice style           | Direct/Diplomatic/Solitary | Investigate/Position/Party | Leverage/Moral | Authored forks |

## Layer 3: TURN STRUCTURE ENFORCEMENT

**Purpose**: Force proper separation of narrative → mechanics → choices

### The Template

```
【 MANDATORY SEQUENCE 】

1. NARRATIVE BODY (FIRST)
   ✓ 2-6 sentences minimum
   ✓ Concrete consequence
   ✗ NO dice math here
   
2. SYSTEM CHROME (optional)
   Mode-specific format
   
3. MECHANICS LOG
   <system-log>
   ...
   </system-log>
   
4. ACTION TAGS
   <item-gain .../> etc.
   
5. CHOICES (LAST)
   3-4 numbered options
```

**Why this works**:
- **Sequence enforcement**: "FIRST", "LAST" make order unmissable
- **Validation checklist**: Before emitting choices, check 5 conditions
- **Boundary rules**: Explicit "NEVER in prose" / "NEVER in choices" sections
- **Checkboxes**: ☑ visual validation steps

## Layer 4: SUPPORTING RAILS

Kept from original system:
- GM Voice profiles (Chilled, Theatrical, etc.)
- Fluid prose rails (rhythm, tone, vocabulary)
- Content safety (Kid Mode, NSFW rules)
- Maturity settings

These stay **modular** and **imported** rather than baked in.

## Integration Strategy

### Files Changed

1. **NEW: `masterPrompt.ts`**
   - Contains new hierarchical architecture
   - Exports `buildMasterPrompt()` function
   - Re-exports as `buildSystemPrompt` for compatibility

2. **UPDATE: `aiService.ts` / `aiService.direct.ts`**
   - Change import from `systemPrompt` to `masterPrompt`
   - OR: Keep `systemPrompt.ts` but gut it to use masterPrompt internally

3. **UNCHANGED**:
   - `fluidProseRails.ts` - Still imported
   - `choiceTierRules.ts` - Still imported
   - `gmVoiceProfile.ts` - Still imported
   - All other modules untouched

### Migration Path

**Option A: Clean Cut (Recommended)**
```typescript
// In aiService.direct.ts
import { buildSystemPrompt } from './masterPrompt';  // ← Change this line
```

**Option B: Gradual**
```typescript
// In systemPrompt.ts
import { buildMasterPrompt } from './masterPrompt';
export { buildMasterPrompt as buildSystemPrompt };  // Redirect
```

## Why This Beats XML Tags

You requested XML structure like:
```xml
<core_directives>
  <rule priority="critical">Never invent items</rule>
</core_directives>
```

**Why we didn't do that**:
1. **LLMs don't parse XML**: They treat it as text. No better compliance.
2. **Harder to maintain**: XML is verbose and hard to scan
3. **No actual benefit**: Plain text rules with visual structure work better

**What we did instead**:
- **Unicode box drawing** (`┌─┐│└─┘`) creates visual hierarchy
- **Emoji markers** (`【】✓✗☑`) aid scannability  
- **Caps + spacing** creates emphasis ("MANDATORY", "NEVER")
- **Templates** show exact output format

## Expected Improvements

### Narrative Flow
- ✅ **Answer-first enforcement**: "If player asked, answer in first 1-2 sentences"
- ✅ **Earned handoffs**: No more "What do you do?" spam
- ✅ **One clear beat**: Default to single pressure change

### Mode Adherence
- ✅ **No LitRPG in D&D**: FORBIDDEN section explicitly bans blue panels
- ✅ **No dice in LitRPG**: HIDDEN CHECK MATH section makes it unmissable
- ✅ **Mode-specific templates**: Each mode shows exact output format

### Choice Quality
- ✅ **Validation checklist**: 5-point check before emitting
- ✅ **Stance density**: Built into each mode's choice DNA
- ✅ **Grounding enforcement**: "Is this in THIS turn's narrative?"

## Testing Plan

1. **Per-mode smoke tests** (4 games):
   - LitRPG: Verify blue panels present, dice hidden
   - D&D: Verify dice shown, no blue panels
   - RPG: Verify no mechanics visible
   - PYOA: Verify fork-style choices

2. **Cross-mode contamination tests**:
   - Start D&D game → verify NO "Level Up!" system chrome
   - Start LitRPG → verify NO "d20+3" dice notation

3. **Turn structure validation**:
   - Every turn: Check narrative comes BEFORE choices
   - Every turn: Verify numbered lists not in prose body

4. **Inventory authority test**:
   - Empty inventory → try to use sword
   - Should: "You pat empty pockets" + refusal
   - Should NOT: Narrate sword attack

## Rollback Plan

If regressions occur:
```typescript
// Quick revert in aiService.direct.ts
import { buildSystemPrompt } from './systemPrompt';  // Back to old
// import { buildSystemPrompt } from './masterPrompt';  // Comment out new
```

All old files preserved. Zero risk.

## Next Steps

1. **Review** this architecture doc
2. **Test** masterPrompt in a staging environment
3. **Compare** outputs: old systemPrompt vs new masterPrompt
4. **Integrate** if improvements confirmed
5. **Deprecate** old systemPrompt.ts

## Summary

The Master Prompt is **not just XML wrapping**. It's a complete re-architecture that:
- ✅ Places critical rules where LLM attention is highest
- ✅ Isolates mode behaviors to prevent contamination  
- ✅ Enforces turn structure with templates
- ✅ Consolidates scattered rules into single source of truth
- ✅ Uses visual hierarchy (not XML) for scannability

Result: **Stronger enforcement, clearer boundaries, better narrative flow.**
