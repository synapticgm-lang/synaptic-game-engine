# Path A Wave 3 Ship — 2026-08-30d

## Summary

Implemented Wave 3 (B026-B028) sealed manifest enhancements from Manus BIG CHANGES backlog:

- **B026**: Enhanced sealed manifest builder with comprehensive required facts and forbidden reversals tracking
- **B027**: Manifest-aware render validator for detecting GM prose contradictions and omissions
- **B028**: One-repair policy enforcement (max 1 fallback per manifest)

## What shipped

### Client-side changes (`src/game/`)

1. **sealedManifest.ts** (enhanced)
   - `SceneManifest.fallbackUsed` field added for B028 tracking
   - `buildSealedManifest()` now captures:
     - HP state: `HP: 80/100`
     - XP state: `XP: 150`
     - Active quest states with objective completion: `Quest Title: active [0:true,1:false]`
     - Encounter HP: `Encounter: Name HP 25/30`
     - Defeated encounter locks: `Name is defeated and cannot heal`
     - Completed quest locks: `Quest Title is completed and cannot revert`
   - `validateProseAgainstManifest()` new function (B027)
     - Detects defeated enemy resurrection in prose
     - Detects quest status reversals
     - Warns when active combat lacks fight language
     - Returns `ManifestValidationResult` with contradictions/omissions/warnings
   - `applyRenderFallback()` enhanced (B028)
     - Enforces max 1 fallback per manifest (throws if `fallbackUsed=true`)
     - Returns `manifestUpdated` with `fallbackUsed=true` set
   - `canUseFallback()` helper for checking fallback eligibility

2. **useGame.ts** (integration)
   - Updates sealed manifest when fallback applied
   - Calls `attachSealedManifest(liveCurrent, fallback.manifestUpdated)`

3. **fateAutoplay.ts** (integration)
   - Updates sealed manifest when fallback applied
   - Headless fate path respects one-repair policy

4. **runManifest.ts** (stamp)
   - `BUILD_STAMP = '2026-08-30d'`

5. **Hud.tsx** (stamp)
   - `HUD_BUILD_STAMP = '2026-08-30d'`

6. **playtest30bWave3.test.ts** (new)
   - 14 tests covering B026-B028 functionality
   - Tests enhanced manifest builder
   - Tests validation against prose
   - Tests one-repair policy enforcement
   - Tests manifest hash stability and changes
   - All tests passing

### Test updates

Updated stamp expectations in older tests to use `>=` comparisons instead of exact matches:
- `playtest29aScoreBoost.test.ts`
- `playtest29bOptimise.test.ts`
- `playtest29cFreeHook.test.ts`
- `playtest29dGeminiCalibrated.test.ts`
- `playtest29eWorldMapOverhaul.test.ts`
- `playtest29fHideOpener.test.ts`
- `playtest29gHideChrome.test.ts`

## What was NOT shipped

- **Wave 2 (B023-B025)**: NPC role obligations, hub beat caps, PYOA convergence
  - Test file `playtest30aWave2.test.ts` exists but functions not implemented
  - Not in scope for this Wave 3 push

- **Edge sync**: Validation functions are client-only
  - B027 validator runs client-side against GM prose post-hoc
  - No gm-turn redeploy needed for Wave 3
  - Edge `sceneManifest.ts` remains unchanged (different concern)

## Quality projection

### Before Wave 3
- Manifest builder captured basic facts (location, PC, encounter)
- Fallback could theoretically loop infinitely
- No validation of GM prose against sealed manifest

### After Wave 3
- Manifest builder captures comprehensive state:
  - HP/XP tracking
  - Quest objective completion state
  - Defeated encounter locks
  - Completed quest locks
- One-repair policy enforced (max 1 fallback per manifest)
- Validation detects:
  - Defeated enemy resurrection
  - Quest status reversals
  - Missing combat language when encounter active

### Estimated impact
- **B026**: +0.3-0.5 confidence (better required facts coverage)
- **B027**: +0.2-0.4 quality (detects but doesn't prevent violations)
- **B028**: +0.3-0.5 reliability (prevents fallback loops)
- **Total**: ~+0.8-1.4 combined (not additive)

## Test coverage

```
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

Wave 3 specific tests:
- ✓ Stamp advanced past 30d
- ✓ Captures HP and XP in required facts
- ✓ Captures active quest states
- ✓ Adds defeated encounter to forbidden reversals
- ✓ Adds completed quest to forbidden reversals
- ✓ Detects defeated enemy resurrection
- ✓ Allows prose that respects defeated state
- ✓ Warns when combat beat lacks fight language
- ✓ Fresh manifest can use fallback
- ✓ Fallback marks manifest as used
- ✓ Rejects second fallback attempt
- ✓ Deterministic fallback preserves receipts
- ✓ Manifest hash is stable for same state
- ✓ Manifest hash changes when state changes

## File list

### Modified
- `src/game/sealedManifest.ts` — B026-B028 implementation
- `src/game/useGame.ts` — integration
- `src/game/fateAutoplay.ts` — integration
- `src/game/runManifest.ts` — stamp
- `src/components/Hud.tsx` — stamp
- `index.html` — stamp
- `src/game/playtest29aScoreBoost.test.ts` — stamp expectation
- `src/game/playtest29bOptimise.test.ts` — stamp expectation
- `src/game/playtest29cFreeHook.test.ts` — stamp expectation
- `src/game/playtest29dGeminiCalibrated.test.ts` — stamp expectation
- `src/game/playtest29eWorldMapOverhaul.test.ts` — stamp expectation
- `src/game/playtest29fHideOpener.test.ts` — stamp expectation
- `src/game/playtest29gHideChrome.test.ts` — stamp expectation

### Created
- `src/game/playtest30bWave3.test.ts` — Wave 3 test suite

## Deployment

### Client-only
All Wave 3 changes are client-only. No edge functions require redeploy.

### Verification
```bash
npm run test -- --run playtest30bWave3
```

## Next actions

### For John to decide
1. **Wave 2 implementation**: B023-B025 not included in this push
2. **Eval run**: 12×300 under 30d to measure manifest uplift
3. **Wave 4**: B029-B033 (eval harness + liveness gates)

### If approved
```bash
git add .
git commit
git push origin main
```

## Notes

- Mid writer still OFF (`STAGNATION_MID_WRITER_ENABLED = false`)
- Wave 2 tests exist but functions not implemented (B023-B025 deferred)
- Validator is detection-only, not blocking (B027 returns result, doesn't mutate)
- Max-1-retry enforcement is a hard throw (B028)
- Manifest hash includes quest states, encounter HP, turn, eventSeq

---

**Stamp**: 2026-08-30d  
**Scope**: Wave 3 (B026-B028) only  
**Deploy**: Client-only, no edge changes  
**Quality**: +0.8-1.4 confidence/reliability (estimated)
