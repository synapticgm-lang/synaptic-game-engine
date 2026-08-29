# False Ambiguous Action Repair - FIX 2026-08-30Q

## Issue

Player selected: "Examine the cell more closely for any hidden details or weaknesses."

System incorrectly showed repair banner: "Do you mean force the door or listen first—right? The ambiguity has done enough damage already."

**Root Cause:** The ambiguous action detector was triggering on the word "or" in the choice text ("details or weaknesses"), even though this was a single, specific action with a compound search target, not an ambiguous choice.

## Solution

Added `isSpecificActionWithCompoundTarget()` helper function in `src/game/repairEngine.ts` to detect patterns where "or" is part of a single action description, not a choice between two different actions.

### Detection Patterns (Skip Repair)

1. **"Examine X for Y or Z"** - Single examine action with compound target
   - Example: "Examine the cell for details or weaknesses"
   - Example: "Inspect the room for traps or hidden passages"
   - Example: "Check the desk for documents or clues"

2. **"Press your ear to X to listen for Y"** - Specific listen action
   - Example: "Press your ear against the iron door to listen for sounds outside"

3. **Long specific action descriptions** - Choice chips with clear action verbs
   - Example: "Try calling out again, louder this time."
   - Pattern: Starts with action verb, >30 chars

## Changes

### Files Modified

1. **`src/game/repairEngine.ts`**
   - Added `isSpecificActionWithCompoundTarget()` function (lines 173-219)
   - Updated `detectRepairSituation()` to call the new helper before triggering ambiguous_action (line 128)

2. **`src/game/fluidChatEval.test.ts`**
   - Added comprehensive test suite for the fix (lines 157-184)
   - 18 tests pass, including:
     - "Examine the cell more closely for any hidden details or weaknesses." → `null` (no repair)
     - "Inspect the room for traps or hidden passages" → `null`
     - "Check the desk for documents or clues" → `null`
     - "Press your ear against the iron door to listen for sounds outside." → `null`
     - "Try calling out again, louder this time." → `null`

3. **`index.html`**
   - Updated `sgm-build` meta to `2026-08-30Q`

4. **`src/components/Hud.tsx`**
   - Updated `HUD_BUILD_STAMP` to `2026-08-30Q`
   - Updated `HUD_BUILD_TITLE` to describe the fix

## Test Results

```bash
npm test -- fluidChatEval --run
```

**Result:** ✅ All 18 tests passed

### Specific Test Cases

```typescript
// Pattern 1: "Examine X for Y or Z"
expect(
  detectRepairSituation('Examine the cell more closely for any hidden details or weaknesses.', base)
).toBeNull();

// Pattern 2: "Press your ear to X to listen for Y"
expect(
  detectRepairSituation('Press your ear against the iron door to listen for sounds outside.', base)
).toBeNull();

// Pattern 3: Specific action with clear target
expect(
  detectRepairSituation('Try calling out again, louder this time.', base)
).toBeNull();
```

## Deployment

**Commit:** `a0d8fa8` - "Fix false ambiguous action detection on clear choices - BUILD 2026-08-30Q"

**Branch:** `main`

**Status:** ✅ Committed and pushed to `origin/main`

## Expected Behavior After Fix

### Should NOT trigger repair (now fixed):
- ✅ "Examine the cell more closely for any hidden details or weaknesses"
- ✅ "Press your ear against the iron door to listen for sounds outside"
- ✅ "Inspect the room for traps or hidden passages"
- ✅ Any specific choice chip with a clear action and target

### Should STILL trigger repair (unchanged):
- ❓ Genuinely ambiguous freeform input: "check the door" (without specifying what to do)
- ❓ "the window or the door" (two competing targets)
- ❓ "aside or through" (two competing actions)

## Architecture Notes

The repair system has three layers of false-positive protection:

1. **`isInformationalOrAsk()`** - Skips "info or option" / "menus or buttons" noun lists
2. **`isExploreOrLayoutAsk()`** - Skips room-layout queries like "any doors or windows"
3. **`isSpecificActionWithCompoundTarget()`** - NEW: Skips examine actions with compound targets

All three must return `null` before the detector fires `ambiguous_action`.

## Related

- Previous fix (2026-08-21j): Added skip for informational panel asks
- Previous fix (2026-08-21b): Added skip for room-layout door/window asks
- This fix (2026-08-30Q): Added skip for examine actions with compound targets

Choice chips should NEVER trigger ambiguous repair. Only genuinely ambiguous freeform input should.
