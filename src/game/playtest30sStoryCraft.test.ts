import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import {
  formatFluidProseRailsForPrompt,
  formatModeStoryAuthorityLine,
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

  it('each mode sentence appears in SNAPSHOT and fluid rails for that mode only', () => {
    for (const mode of MODES) {
      const state = createInitialState('Craft', mode);
      state.turn = 4;
      state.openingEstablishment = { complete: true, aloneArrival: false } as never;
      const snap = formatSceneSnapshotForPrompt(state);
      const rails = formatFluidProseRailsForPrompt(mode);
      const line = formatModeStoryAuthorityLine(mode);

      expect(MODE_STORY_AUTHORITY[mode].length).toBeLessThanOrEqual(240);
      expect(snap).toContain(line);
      expect(rails).toContain(line);
      expect(snap).toContain(UNIQUE[mode]);
      expect(rails).toContain(UNIQUE[mode]);

      for (const other of MODES.filter((m) => m !== mode)) {
        expect(snap).not.toContain(UNIQUE[other]);
        expect(rails).not.toContain(UNIQUE[other]);
      }
    }
  });

  it('does not restack the shared recycle rule', () => {
    const recycle =
      'Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate';
    const snap = formatSceneSnapshotForPrompt(createInitialState(undefined, 'litrpg'));
    const authorityHits = snap.match(/Do not recycle a prior beat/g) ?? [];
    expect(authorityHits).toHaveLength(1);
    expect(snap).toContain(recycle);
    expect(formatFluidProseRailsForPrompt('pyoa')).toMatch(/NO RECYCLE/);
  });
});
