# Batch 02a: RPG T50 Residual Fixes
**Date:** 2026-09-02  
**HUD Stamp:** `2026-09-02a`  
**BUILD Stamp:** `2026-09-02a`  
**Class:** D (Continuity Prose)  
**Writer Tier:** Mid writer OFF (unchanged)

## Context

RPG T50 run (`gemini-paste-2026-09-01-t50-complete-yz-rpg`, Salt Road Heist) scored **2/10** with Gemini. The diagnostic revealed:

1. **Run used OLD CODE** (baseline `2026-08-31n`) before Batch X deployment
2. Many P0 failures already fixed in Batch X (hub-role mad-libs, quest UI bleed, entity scrubbing)
3. **3 new P0s identified** that require targeted fixes

Full debug report: `docs/bugs/rpg-t50-gemini-2-of-10-debug-2026-09-02.md`

---

## Implemented Fixes

### Fix 1: "Tavern" Mad-Lib Scrubbing (P0-1)

**Problem:** Flash Lite uses "Tavern" as character/verb/direction when no tavern location exists in Salt Road Heist bible.

**Evidence:**
- T9: "Rain drums the awning while **Tavern watches you** from the stall"
- T25: "You take a **Tavern dim glow** of the waystation's entrance"
- T34: "the path to the **Tavern**" (no such location in Salt Road)

**Implementation:**
Extended `scrubEntityMadLibs()` in `src/game/proseWarden.ts` (lines 591-625):

```typescript
// Batch 02a — "Tavern" mad-lib scrubbing (generic building type used as character/direction)
next = next.replace(
  /\b(?:the\s+)?Tavern\s+(?:watches|looks|waits|stands|sits|remains)\b/gi,
  'the vendor watches'
);
next = next.replace(
  /\btoward(?:s)?\s+(?:the\s+)?Tavern(?!\s+(?:door|window|entrance|keeper))\b/gi,
  'toward the waystation'
);
// ... 8 additional patterns for direction/adjective/clause separator
```

**Coverage:**
- Character: "Tavern watches/waits/stands" → "vendor watches"
- Direction: "toward the Tavern" → "toward the waystation"
- Preposition: "from/at/near the Tavern" → "from/at/near the waystation"
- Adjective: "a Tavern dim glow" → "a dim"
- Clause separator: "Tavern, the passage" → "Further along, the passage"
- Preserves legitimate compounds: "Tavern door/keeper" stays

---

### Fix 2: Possessive Pronoun Repair (P0-2)

**Problem:** Flash Lite drops possessive determiners, writing "you stool" instead of "your stool".

**Evidence:**
- T2: "perched on **you stool**"
- T4: "**you eyes** momentarily drawn"
- T6: "crosses **you face**"

**Implementation:**
New function `scrubPossessiveDeterminerSlips()` in `src/game/proseWarden.ts` (lines 971-1002):

```typescript
export function scrubPossessiveDeterminerSlips(text: string): string {
  // Preposition + you + furniture/object/body → preposition + your + noun
  next = next.replace(
    /\b(on|at|in|near|beside|from|over|across|through|...)\s+you\s+(stool|chair|bench|table|face|eyes|...)\b/gi,
    '$1 your $2'
  );
  // Verb participle + on you + furniture
  next = next.replace(
    /\b(perched|sitting|seated|standing|...)\s+on\s+you\s+(stool|chair|bench|...)\b/gi,
    '$1 on your $2'
  );
  // Verb + you + body part (catches "crosses you face")
  next = next.replace(
    /\b(crosses?|draws?|touches?|brushes?|...)\s+you\s+(face|eyes|head|...)\b/gi,
    '$1 your $2'
  );
  // ... additional patterns
}
```

**Coverage:**
- Prepositions: on/at/in/near/beside/from/over/across/through/behind/before/under/around/along/past/toward/into/onto/upon
- Furniture: stool/chair/bench/table/mug/bag/pack/pouch/sack
- Objects: knife/sword/dagger/weapon/blade/axe/staff/shield/armor/cloak/hood
- Body parts: face/eyes/head/hand/hands/shoulder/chest/back/arm/leg/side/belt/boots/gloves/wrist/ankle/neck/throat/brow/cheek/jaw
- Verbs: crosses/draws/touches/brushes/covers/shadows/lights/strikes/hits/passes

Wired into `applyProseWarden()` at line 1449 (after `scrubPronounSubjectSlips()`).

---

### Fix 3: Tighten Loiter Interrupt (P0-4)

**Problem:** Fate picked loiter 4 turns in a row (T7-10) with zero narrative delta. Current threshold (≥3) is too high.

**Evidence:**
- T7: "Wait and observe"
- T8: "Inspect the room"
- T9: "Scout the area"
- T10: "Look around" (all dead air)

**Implementation:**
Changed loiter streak threshold in `src/game/choiceCompiler.ts` line 710:

```typescript
// Before (Batch E):
const inspectTreadmill = loiter.count >= 3 && loiter.key === 'loiter';

// After (Batch 02a):
const inspectTreadmill = loiter.count >= 2 && loiter.key === 'loiter';
```

**Effect:**
- After **2** consecutive loiter actions (Wait/Inspect/Scout family), force exit/travel pads
- Drops generic loiter pads when `stallInterrupt` is true
- Preserves opening turn (turn 1 still allows inspect)

---

## Files Modified

### Core Changes
1. **`src/game/proseWarden.ts`**
   - Extended `scrubEntityMadLibs()` with Tavern patterns (lines 591-625)
   - Added `scrubPossessiveDeterminerSlips()` function (lines 971-1002)
   - Wired possessive scrubber into `applyProseWarden()` (line 1449)

2. **`src/game/choiceCompiler.ts`**
   - Changed loiter interrupt threshold from ≥3 to ≥2 (line 710)

### Edge Sync
3. **`supabase/functions/_shared/gm/proseWarden.ts`**
   - Synced from client proseWarden.ts

### Housekeeping
4. **`src/game/runManifest.ts`**
   - Updated BUILD_STAMP to `2026-09-02a`

5. **`src/components/Hud.tsx`**
   - Updated HUD_BUILD_STAMP to `2026-09-02a`
   - Updated title to "Debug 2026-09-02a - RPG T50 residuals (Tavern/you-stool/loiter)"

6. **`src/game/playtest02aResidualFixes.test.ts`** (NEW)
   - 18 vitest cases covering all 3 fixes
   - Tavern mad-lib patterns (7 tests)
   - Possessive pronoun repair (7 tests)
   - Loiter interrupt (2 tests)
   - Integration test (1 test)

7. **`.cursor/rules/playtest-notes.mdc`**
   - Added ship entry for Batch 02a at top of Open section

---

## Test Results

All 18 tests passing:

```bash
✓ stamps are 2026-09-02a and Mid writer stays OFF
✓ Fix 1: Tavern mad-lib scrubbing (7 tests)
  ✓ scrubs Tavern as character (watches/waits/stands)
  ✓ scrubs Tavern as direction (toward the Tavern)
  ✓ scrubs Tavern from direction (from the Tavern)
  ✓ scrubs Tavern as clause separator
  ✓ scrubs Tavern as adjective (a Tavern dim glow)
  ✓ preserves Tavern when part of legitimate location name
  ✓ scrubs at/near Tavern prepositions
✓ Fix 2: Possessive pronoun repair (7 tests)
  ✓ fixes "on you stool" → "on your stool"
  ✓ fixes "you eyes" → "your eyes"
  ✓ fixes "you face" → "your face"
  ✓ fixes "perched on you chair"
  ✓ fixes multiple prepositions (at/in/near/beside)
  ✓ fixes body parts (head/hand/shoulder/chest)
  ✓ preserves "you" as subject pronoun
✓ Fix 3: Tighter loiter interrupt (2 tests)
  ✓ forces exit pads after 2 loiter actions (not 3)
  ✓ still allows loiter on turn 1 (no streak yet)
✓ all three fixes work together in prose warden
```

---

## Residual Risk

**Next Gate:** Re-run **RPG T50 ×1** with current code (post-Batch X + Batch 02a) to validate uplift.

**Expected Outcome:**
- Tavern mad-libs eliminated (P0-1 closed)
- Possessive pronoun slips eliminated (P0-2 closed)
- Loiter spam reduced by 33% (tighter interrupt)
- Batch X fixes (hub-role compounds, quest tracker leaks, spawn logs) already live
- Target score: **5+/10** (up from 2/10)

**Known Gaps:**
- Flash Lite may still invent **novel hub compounds** not in the scrubber
- Flash Lite may ignore **CRAFT lines** (existing issue from 31h/31w)
- If T50 still scores <5/10, escalate to **Mid/High tier strategy** discussion

---

## Deployment Notes

**Client-only changes** (no edge functions redeploy required):
- Edge proseWarden already synced via `cp` command
- No `gm-turn` function changes
- No SQL migrations

**Redeploy checklist:**
- ✅ Client build (Vite)
- ✅ Edge proseWarden synced
- ❌ Edge functions (no changes)
- ❌ SQL (no migrations)

**Validation Plan:**
1. Confirm all 3 fixes wired and tested (vitest 18/18 passing)
2. Document next gate in playtest-notes.mdc
3. **DO NOT run T50 yet** - wait for John authorization
4. After authorization: run `npm run fate-autoplay -- --bible salt-road-heist --turns 50 --seed 43`

---

## Technical Notes

### Why These Patterns?

**Tavern Mad-Lib:**
- "Tavern" appears in entity registry as legitimate location type (Greyhollow Tavern in Cursed Keep)
- Salt Road Heist bible has **no tavern location** (Waystation/Camp/Safehouse/Fence/Market/Checkpoint)
- Flash Lite template-fills "Tavern" into character/verb/direction slots
- Context-aware replacement: "waystation" for direction, "vendor" for character

**Possessive Pronoun:**
- Flash Lite grammar error (not perspective error)
- Drops possessive determiners in preposition + you + noun constructions
- Extended to catch verb + you + body patterns ("crosses you face")
- Regex repair is cheap (~1ms); LanguageTool full grammar adds ~50-100ms

**Loiter Interrupt:**
- Existing logic already counts loiter family (Wait/Inspect/Scout)
- Threshold was set conservatively at ≥3 in Batch E
- RPG T50 evidence shows 4 consecutive loiter turns with zero delta
- Tightening to ≥2 forces exit pads earlier, preserving opening inspect

### Edge Sync Verification

```bash
# Confirmed synced at 2026-09-02 07:19:38
diff src/game/proseWarden.ts supabase/functions/_shared/gm/proseWarden.ts
# No differences
```

---

## Related Documentation

- Full debug report: `docs/bugs/rpg-t50-gemini-2-of-10-debug-2026-09-02.md`
- Batch X synthesis (closed many issues): `docs/bugs/gemini-reviews-2026-09-01/SYNTHESIS-BATCH-X-FROM-W.md`
- Vitest: `src/game/playtest02aResidualFixes.test.ts`
- Playtest notes: `.cursor/rules/playtest-notes.mdc`
