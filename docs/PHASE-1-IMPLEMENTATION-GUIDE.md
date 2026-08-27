# Phase 1 Quick Wins - Implementation Guide

**Date:** 2026-08-25  
**Target:** Reduce invented object issues by 70%, consistency breaks by 50%

This document provides step-by-step instructions for integrating the Phase 1 quick wins into SynapticGM.

---

## Files Created

1. **`src/game/actionValidation.ts`** - Hard validation gate
2. **`src/game/bindingConstraints.ts`** - Binding constraints builder
3. **`src/game/proseWarden.ts`** - Extended with `scrubInventedContainers()`

---

## Integration Steps

### Step 1: Update Type Imports

**File:** `src/game/proseWarden.ts`

Add import at top of file:

```typescript
import type { Item } from './types';
```

### Step 2: Integrate Hard Gate in useGame

**File:** `src/game/useGame.ts`

Find the `handleSend` function (around line ~1500) and add validation before `invokeGmProxy`:

```typescript
import { validateActionHard, type ValidationResult } from './actionValidation';

// Inside handleSend, before the GM call:
const lastGmStory = state.log
  .filter((e) => e.role === 'gm')
  .slice(-1)[0]?.content ?? '';

// PHASE 1: Hard gate validation
const validation = validateActionHard(trimmedInput, state, lastGmStory);

if (!validation.valid) {
  // Show inline error, don't call GM
  const errorMessage = validation.violations.join(' ');
  
  setMessages((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      role: 'player',
      content: trimmedInput,
      timestamp: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      role: 'system',
      content: `⚠️ **Action Blocked**\n\n${errorMessage}\n\nPlease clarify your action or check your inventory.`,
      timestamp: Date.now(),
    },
  ]);
  
  setIsGenerating(false);
  setCurrentInput('');
  return;
}

// Use rewritten action if validation soft-rewrote it
const actionToSend = validation.rewritten ?? trimmedInput;

// Continue with normal GM call using actionToSend
const response = await invokeGmProxy({
  mode: 'turn',
  playerInput: actionToSend,
  state,
  settings,
  // ...
});
```

### Step 3: Add Binding Constraints to Prompt

**File:** `supabase/functions/_shared/gm/situationPacket.ts`

Import the builder:

```typescript
import { buildBindingConstraints, formatBindingConstraintsForPrompt } from './bindingConstraints.ts';
```

In the `buildSituationPacket` function, add constraints section:

```typescript
export function buildSituationPacket(state: GameState, intent?: string): string {
  // ... existing code ...
  
  // PHASE 1: Add binding constraints
  const constraints = buildBindingConstraints(state);
  const constraintsSection = formatBindingConstraintsForPrompt(constraints);
  
  return `
${sceneFactsSection}

${constraintsSection}

${inventorySection}

${questSection}

${intentSection}
  `.trim();
}
```

### Step 4: Update Prose Warden Context in Turn Flow

**File:** `src/game/useGame.ts` (or wherever prose warden is called)

Find where `applyProseWarden` is called and add inventory to context:

```typescript
const wardenContext: ProseWardenContext = {
  currentLocation: state.currentLocation,
  aloneArrival: state.openingEstablishment?.aloneArrival,
  crowdSize: calculateCrowdSize(state),
  crowdPresent: state.sceneFacts?.crowd === 'present',
  currentTimeOfDay: state.sceneFacts?.timeOfDay,
  previousTimeOfDay: previousSceneFacts?.timeOfDay,
  isIndoor: state.sceneFacts?.indoor,
  wasIndoor: previousSceneFacts?.indoor,
  currentTension: state.sceneFacts?.tension,
  previousTension: previousSceneFacts?.tension,
  inventory: state.inventory, // PHASE 1: Add inventory
  hasMappedDoorExits: !!state.activeDungeon?.currentRoomId,
  adjacentRoomNames: getAdjacentRoomNames(state),
};

const cleaned = applyProseWarden(rawProse, wardenContext);
```

### Step 5: Copy Files to Edge Function

**Files to sync:** Phase 1 changes need to be mirrored in edge function

```bash
# Copy binding constraints to edge
cp src/game/bindingConstraints.ts supabase/functions/_shared/gm/bindingConstraints.ts

# If actionValidation uses server-side logic, copy it too
# (Currently it's client-side only, so skip this)
```

### Step 6: Redeploy Edge Function

```bash
npx supabase functions deploy gm-turn
```

### Step 7: Update HUD Stamp

**File:** `src/components/Hud.tsx`

Update the stamp to `2026-08-25a` (Phase 1 Quick Wins).

---

## Testing

### Test 1: Invented Container

**Scenario:** Player claims an item that doesn't exist

1. Start new game
2. Send: "I open the last box"
3. **Expected:** Validation blocks action, shows error: "You don't have: box. Check your inventory or rephrase your action."
4. **Success:** No LLM call made, player sees inline error

### Test 2: Missing Companion

**Scenario:** Player references absent companion

1. Start new game (ensure no companions)
2. Send: "I ask my companion what they think"
3. **Expected:** Validation blocks action, shows error: "No companion is with you right now."
4. **Success:** No LLM call made

### Test 3: Binding Constraints - Crowd

**Scenario:** LLM contradicts crowd presence

1. Start Integration opening (crowd present)
2. Wait for crowd to be established
3. Send: "I look around"
4. **Expected:** Prose includes people/crowd, not empty street
5. **Success:** Prose mentions "people still gathered" or similar

### Test 4: Binding Constraints - Time

**Scenario:** LLM skips time inappropriately

1. Play until sceneFacts.timeOfDay is set (e.g., morning)
2. Send: "I walk down the street"
3. **Expected:** Prose doesn't say "hours later" or "by evening"
4. **Success:** Time stays consistent

### Test 5: Prose Warden - Invented Container

**Scenario:** LLM invents container despite constraints

1. Start game, don't acquire any boxes
2. Manually trigger GM call that might invent box
3. **Expected:** If LLM writes "last box", prose warden rewrites to "the area"
4. **Success:** No "last box" in final prose

---

## Rollback Plan

If Phase 1 causes issues:

1. **Comment out validation in `useGame.ts`:**
   ```typescript
   // const validation = validateActionHard(...);
   // if (!validation.valid) { ... }
   ```

2. **Remove constraints from prompt:**
   ```typescript
   // const constraintsSection = formatBindingConstraintsForPrompt(constraints);
   ```

3. **Keep prose warden changes** (they're non-breaking)

4. **Redeploy edge function:**
   ```bash
   npx supabase functions deploy gm-turn
   ```

---

## Metrics to Track

**Before Phase 1 (baseline):**
- Count of "invented object" support tickets
- Count of "crowd disappeared" consistency errors
- Average player satisfaction (if surveyed)

**After Phase 1 (Week 1):**
- Reduction in invented object tickets (target: 70%)
- Reduction in consistency errors (target: 50%)
- False positive rate (target: <5%)

**Measurement:**
- Add logging in `validateActionHard` to count blocks
- Add logging in `scrubInventedContainers` to count fixes
- Track validation block reasons in telemetry

---

## Next Steps

After Phase 1 is stable and metrics show improvement:

1. **Phase 2 (Week 2-5):** Structured response envelope + claim validation
2. **Phase 3 (Week 6-12):** Engine orchestration + observability

See `DETERMINISTIC-STATE-ARCHITECTURE-ANALYSIS.md` for full roadmap.

---

## Troubleshooting

### Issue: Validation blocks valid actions

**Symptom:** Player can't perform action that should be allowed

**Fix:**
1. Check validation logic in `actionValidation.ts`
2. Add exception for specific pattern
3. Log false positive for review

### Issue: Constraints too strict

**Symptom:** LLM writes valid prose but violates constraint

**Fix:**
1. Review constraint rules in `bindingConstraints.ts`
2. Soften overly strict rules (e.g., time skips allowed if >5 turns)
3. Add "unless" clauses to constraints

### Issue: Performance regression

**Symptom:** Validation adds noticeable latency

**Fix:**
1. Profile validation functions
2. Cache grounding corpus if expensive
3. Move heavy validation to async path

---

## Support

Questions or issues? Check:
- `docs/DETERMINISTIC-STATE-ARCHITECTURE-ANALYSIS.md` for full context
- `src/game/actionValidation.ts` for validation logic
- `src/game/bindingConstraints.ts` for constraint rules
