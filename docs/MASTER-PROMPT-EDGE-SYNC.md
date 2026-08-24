# Master Prompt v2.0 - Edge Sync Instructions

The Master Prompt architecture is now active in the client codebase at `src/game/masterPrompt.ts`.

## Edge Function Synchronization Required

The Supabase `gm-turn` edge function at `supabase/functions/_shared/gm/systemPrompt.ts` needs to be updated to match.

### Required Actions:

1. **Copy masterPrompt to edge**:
   ```bash
   cp src/game/masterPrompt.ts supabase/functions/_shared/gm/masterPrompt.ts
   ```

2. **Update edge import paths**:
   The edge copy needs to change imports to use relative `.ts` paths:
   ```typescript
   // Change these imports in the edge copy:
   import { formatFluidProseRailsForPrompt } from './fluidProseRails.ts';
   import { formatChoiceTierModeDna } from './choiceTierRules.ts';
   // etc.
   ```

3. **Update gm-turn/index.ts**:
   ```typescript
   // Change from:
   import { buildSystemPrompt, buildContextPrompt } from '../_shared/gm/systemPrompt.ts';
   
   // To:
   import { buildSystemPrompt, buildContextPrompt } from '../_shared/gm/masterPrompt.ts';
   ```

4. **Redeploy**:
   ```bash
   npx supabase functions deploy gm-turn
   ```

## Files to Sync

The edge `_shared/gm/` folder should have copies of:
- `masterPrompt.ts` (NEW - replaces systemPrompt.ts)
- `fluidProseRails.ts`
- `choiceTierRules.ts`
- `gmVoiceProfile.ts`
- `maturity.ts`
- `contentModeRules.ts`
- `campaignNsfw.ts`
- `situationPacket.ts`
- `claimGrounding.ts`
- `folkVoiceExpectations.ts`
- `speechActRails.ts`
- `inventory.ts`
- `locationName.ts`
- `timelineFormat.ts`
- `placeAuthority.ts`
- `mapEngine.ts`
- `panelBudget.ts`
- `archetypes.ts`
- `customTabletopRules.ts`
- `types.ts`

All with `.ts` extensions in import paths (Deno requirement).

## Verification

After sync, test edge function:
1. Create new game in each mode (LitRPG, D&D, RPG, PYOA)
2. Verify mode-specific behavior:
   - LitRPG: Blue panels present, NO dice math
   - D&D: Dice math shown, NO blue panels
   - RPG: NO mechanics visible
   - PYOA: Fork-style choices only
3. Check turn structure: narrative → mechanics → choices
4. Validate inventory authority: empty inventory should block phantom items

## Rollback Plan

If issues occur:
```typescript
// In gm-turn/index.ts
import { buildSystemPrompt, buildContextPrompt } from '../_shared/gm/systemPrompt.ts';
```

Old systemPrompt.ts preserved as fallback.
