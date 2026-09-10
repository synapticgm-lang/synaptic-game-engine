/**
 * Craft book → pad progression (Manus P0, no new GM prompt).
 * Repeat inspect / PYOA wait-no-fork starve that family and refill a moving pad.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { compileChoices } from './choiceCompiler';
import { craftProgressionPolicy } from './craftBookCompiler';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import type { EngineMode, GameState, LogEntry } from './types';

function playing(mode: EngineMode): GameState {
  const state = createInitialState('CraftPad', mode);
  state.turn = 8;
  state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
  return state;
}

function withLog(state: GameState, lines: Array<[LogEntry['role'], string]>): GameState {
  const log: LogEntry[] = lines.map((row, i) => ({
    id: `e-${i}`,
    turn: i,
    role: row[0],
    content: row[1],
    timestamp: i,
  }));
  return { ...state, log };
}

describe('playtest10c — craft progression pads', () => {
  it('Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('first look does not starve inspect', () => {
    const state = withLog(playing('litrpg'), [['player', 'Look around']]);
    const policy = craftProgressionPolicy(state, 'Look around');
    expect(policy.starveInspect).toBe(false);
    const compiled = compileChoices(state, ['Look around', 'Wait', 'Ask a direct question'], undefined, 'Look around');
    expect(compiled.choices.some((c) => /look around/i.test(c))).toBe(true);
  });

  it('repeat look around starves inspect and offers Scout the exit', () => {
    const state = withLog(playing('litrpg'), [
      ['player', 'Look around'],
      ['gm', 'Dust hangs in the gloom.'],
      ['player', 'Inspect the room'],
    ]);
    state.sceneFacts = {
      ...state.sceneFacts,
      lastPlayerIntent: { family: 'inspect', text: 'Look around', turn: 6 },
    };
    const policy = craftProgressionPolicy(state, 'Inspect the room');
    expect(policy.starveInspect).toBe(true);
    const compiled = compileChoices(
      state,
      ['Look around', 'Inspect the surroundings', 'Wait'],
      undefined,
      'Inspect the room'
    );
    expect(compiled.choices.some((c) => /^look around$/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /scout the exit|ask a direct question|press for leverage/i.test(c))).toBe(
      true
    );
    expect(compiled.notes.some((n) => /craft starve inspect/i.test(n))).toBe(true);
  });

  it('PYOA Wait starves wait and offers Face the crisis now', () => {
    const state = withLog(playing('pyoa'), [['player', 'Wait']]);
    const policy = craftProgressionPolicy(state, 'Wait');
    expect(policy.starveWait).toBe(true);
    const compiled = compileChoices(state, ['Wait', 'Wait and watch', 'Look around'], undefined, 'Wait');
    expect(compiled.choices.some((c) => /^(wait|wait and watch)$/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /face the crisis now|choose the risky fork/i.test(c))).toBe(true);
  });

  it('live encounter does not craft-starve combat pads', () => {
    const state = playing('litrpg');
    state.activeEncounter = {
      name: 'Pact-Hunter Skirmisher',
      level: 1,
      hp: 8,
      maxHp: 8,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 25,
      goldReward: 0,
      phase: 'engaged',
    };
    const policy = craftProgressionPolicy(state, 'Look around');
    expect(policy.starveInspect).toBe(false);
    const compiled = compileChoices(
      state,
      ['Press the attack', 'Try to flee'],
      undefined,
      'Look around'
    );
    expect(compiled.choices.some((c) => /press the attack/i.test(c))).toBe(true);
  });
});
