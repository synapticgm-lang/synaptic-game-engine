import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifyTurnFailure } from './errorRepairWarden';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');

describe('playtest29h — opening GM call + turn-fail class', () => {
  it('stamp is 2026-08-30a and Mid writer stays OFF', () => {
    expect(BUILD_STAMP).toBe('2026-08-30a');
    expect(HUD_BUILD_STAMP).toBe('2026-08-30a');
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
});
