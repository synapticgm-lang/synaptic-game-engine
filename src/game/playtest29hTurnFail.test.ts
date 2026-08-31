import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifyTurnFailure } from './errorRepairWarden';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
const aiService = readFileSync(resolve(__dirname, './aiService.ts'), 'utf8');
const gmTurn = readFileSync(resolve(__dirname, '../../supabase/functions/gm-turn/index.ts'), 'utf8');

describe('playtest29h — opening GM call + turn-fail class', () => {
  it('stamp is 2026-08-30a and Mid writer stays OFF', () => {
    expect(BUILD_STAMP >= '2026-08-30a').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30a').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('opening GM no longer references freeCallRef or result.story', () => {
    expect(useGame).not.toContain('freeCallRef');
    expect(useGame).toContain('callOpeningGm');
    expect(useGame).not.toMatch(/result\.story/);
  });

  it('phantom callback name classifies as client_bug not unknown', () => {
    expect(classifyTurnFailure(new ReferenceError('freeCallRef is not defined'))).toBe('client_bug');
  });

  it('nextTurn TDZ classifies as client_bug', () => {
    expect(
      classifyTurnFailure(new ReferenceError("Cannot access 'nextTurn' before initialization"))
    ).toBe('client_bug');
  });

  it('sendAction declares nextTurn before prose-warden harvest (no TDZ)', () => {
    const harvestNeedle = 'harvestNarrativeIntoLedger(workingState, cleanText, nextTurn)';
    const perspectiveNeedle =
      'cleanText = enforcePerspective(cleanText, settingsRef.current, liveCurrent.character.name)';
    const harvestIdx = useGame.indexOf(harvestNeedle);
    const perspectiveIdx = useGame.indexOf(perspectiveNeedle);
    expect(harvestIdx).toBeGreaterThan(-1);
    expect(perspectiveIdx).toBeGreaterThan(-1);
    const wardenBlock = useGame.slice(perspectiveIdx, harvestIdx);
    expect(wardenBlock).toContain('const nextTurn = liveCurrent.turn + 1');
    expect(useGame).toContain("phase === 'reading' || phase === 'resolving'");
  });

  it('callOpeningGm sends a non-empty opening sentinel to callGm', () => {
    expect(aiService).toContain("|| '(opening)'");
    expect(aiService).toContain('buildOpeningGmPlayerInput');
    expect(aiService).toContain('openingInput');
    expect(gmTurn).not.toMatch(/error:\s*'playerInput is required'/);
    expect(gmTurn).toContain("|| '(opening)'");
  });
});
