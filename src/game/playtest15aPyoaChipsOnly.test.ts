import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { isPyoaChipsOnly, pyoaRejectsFreeText } from './pyoaChoiceLock';
import { resolveOfferedChoices } from './playTranscript';
import type { GameState } from './types';

const panel = readFileSync(resolve(__dirname, '../components/CenterPanel.tsx'), 'utf8');

function pyoaState(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('Thornferry Road', 'pyoa') as GameState;
  return {
    ...base,
    engineMode: 'pyoa',
    choices: ['Stay on the road', 'Take the ferry'],
    ...over,
  };
}

describe('playtest15a — PYOA chips only', () => {
  it('HUD/BUILD are 15a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-17c');
    expect(BUILD_STAMP).toBe('2026-09-17c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('CenterPanel hides the typed action box in PYOA', () => {
    expect(panel).toContain('isPyoaChipsOnly');
    expect(panel).toContain('{!hideText && !isPyoaChipsOnly && (');
    expect(panel).toContain('{isPyoaChipsOnly ? null : (');
    expect(panel).toContain('if (isPyoaChipsOnly) return;');
  });

  it('rejects typed free text and keeps listed chips', () => {
    const state = pyoaState();
    const chips = resolveOfferedChoices(state);
    expect(isPyoaChipsOnly(state)).toBe(true);
    expect(chips.length).toBeGreaterThan(0);
    expect(pyoaRejectsFreeText(state, chips[0])).toBe(false);
    expect(pyoaRejectsFreeText(state, 'I invent a side quest')).toBe(true);
  });

  it('does not lock LitRPG typed input', () => {
    const state = { ...createInitialState(), engineMode: 'litrpg' as const, choices: ['Wait'] };
    expect(isPyoaChipsOnly(state)).toBe(false);
    expect(pyoaRejectsFreeText(state, 'My name is Jax')).toBe(false);
  });
});
