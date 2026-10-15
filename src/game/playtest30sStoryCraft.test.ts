import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  formatFluidProseRailsForPrompt,
  formatGoldShapeForPrompt,
  formatModeStoryAuthorityLine,
  MODE_GOLD_SHAPE,
  MODE_STORY_AUTHORITY,
} from './fluidProseRails';
import type { EngineMode } from './types';

const MODES: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];

const UNIQUE: Record<EngineMode, string> = {
  litrpg: 'ledger-backed System changes',
  dnd: 'share spotlight',
  rpg: 'socially distinct futures',
  pyoa: 'never four phrasings of the same delay',
};

describe('playtest30s — mode story AUTHORITY sentences', () => {
  it('Mid writer stays OFF; stamps advanced past 30R / 30k', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30l').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30S').toBe(true);
  });

  it('each mode sentence and gold shape appear in fluid rails for that mode only', () => {
    for (const mode of MODES) {
      const rails = formatFluidProseRailsForPrompt(mode);
      const line = formatModeStoryAuthorityLine(mode);
      const gold = formatGoldShapeForPrompt(mode);

      expect(MODE_STORY_AUTHORITY[mode].length).toBeLessThanOrEqual(240);
      expect(rails).toContain(line);
      expect(rails).toContain(UNIQUE[mode]);
      expect(rails).toContain(gold);
      expect(MODE_GOLD_SHAPE[mode].length).toBeGreaterThan(80);

      for (const other of MODES.filter((m) => m !== mode)) {
        expect(rails).not.toContain(UNIQUE[other]);
        expect(rails).not.toContain(MODE_GOLD_SHAPE[other].slice(0, 48));
      }
    }
  });

});
