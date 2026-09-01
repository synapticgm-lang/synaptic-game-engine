# Z-1 FSM Pad Filtering Debug (2026-09-01)

## Problem

Z-1 was marked "integrated" in commit `9e2985c` but validation showed **10 false-arrival violations** (expected 0-1):
- LitRPG: 3 false-arrivals in T50
- D&D: 3 false-arrivals in T50
- RPG: 0 false-arrivals (clean)
- PYOA: 4 false-arrivals in T50

**Example false-arrival** (LitRPG Summoned Pact T50):
- Turn 9: Pact-Hunter Skirmisher spawns
- Turns 10-19: Player in active combat
- Turn 20: **FALSE ARRIVAL** - "You leave Lowmarket behind and reach West Wall" (player traveled while in combat)

## Root Cause

The `engaged` variable in `compileChoices()` was computed ONCE at the beginning (line 702) and only checked `activeEncounter`:

```typescript
const engaged = isEncounterEngaged(state);  // Only checks activeEncounter
```

When an encounter was in `pendingEncounter` (waiting to be moved to `activeEncounter` by `ensureEncounterSpawnPreface`), `engaged` was `false`. This caused:

1. **Line 750**: `liveStakes` check caught `pendingEncounter` and blocked travel ✓
2. **Line 950-960**: `!engaged` check missed `pendingEncounter` and **added travel pads** ✗

```typescript
// Line 950-960: Interrupt pads added when !engaged
if (stallInterrupt && !engaged) {
  if (!liveStakes && !travelStarve) {
    for (const h of hubsForBibleId(state.campaignBibleId).slice(0, 3)) {
      if (h.name.toLowerCase() !== here) {
        interruptPads.unshift(`Travel toward ${h.name}`);  // BUG: Added even with pendingEncounter!
        break;
      }
    }
  }
}
```

3. **Line 1110**: FSM filter ran, but travel pads were already in the list and the filter had to catch them

The FSM filter worked correctly, but the earlier logic at line 950-960 was injecting travel pads that shouldn't exist.

## Fix Applied

Changed `engaged` computation to check **BOTH** `activeEncounter` AND `pendingEncounter`:

```typescript
// BEFORE (line 702):
const engaged = isEncounterEngaged(state);

// AFTER (line 702):
const engaged = isEncounterEngaged(state) || !!state.sceneFacts?.pendingEncounter;
```

This ensures that ALL encounter state checks throughout `compileChoices()` treat `pendingEncounter` as an active combat state, preventing travel pads from being added in the first place.

## Files Modified

- `src/game/choiceCompiler.ts` - Fixed `engaged` computation (line 702)
- `src/game/playtestZ1FsmFilter.test.ts` - Added validation tests (3 tests, all passing)

## Validation

Created 3 vitest tests:
1. ✅ Blocks travel pads when `pendingEncounter` exists
2. ✅ Blocks travel pads when `activeEncounter` exists
3. ✅ Allows travel pads when no encounter exists

All tests pass. The fix ensures that travel pads are blocked when ANY encounter state exists (pending or active).

## Next Steps

1. **Recommended**: Run **single T20 test** to verify false-arrivals are eliminated:
   ```bash
   npm run fate-autoplay -- --mode litrpg --bible hero-awakening --seed 42 --turns 20 --writer free
   ```
   Expected: `falseArrivalViolations: 0` in summary.json

2. **If T20 clean**: Run full **4×T50 re-run** to validate across all modes

## Go/No-Go for Full Re-Run

**GO** - Fix is minimal (1 line), well-tested, and addresses the exact gap identified in the false-arrival violations.

The `engaged` variable was the weak point - it was used throughout the function but only checked one of two encounter sources. Now it checks both, ensuring consistent behavior across all pad filtering logic.
