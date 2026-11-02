/**
 * XP-D1 OPEN7 addendum — autoplay test-player avoids Hunt while hurt.
 */
import { describe, expect, it } from 'vitest';
import { preferHurtRecoveryPick } from './fateAutoplay';
import { createInitialState } from './defaults';
import type { GameState } from './types';

function st(hp: number, maxHp = 20): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    character: { ...s.character, hp, maxHp, level: 2 },
  };
}

describe('OPEN7 addendum — autoplay hurt picks', () => {
  it('under 50% with a rest chip picks rest', () => {
    const pick = preferHurtRecoveryPick(
      ['Hunt the wildlife nearby', 'Rest and bind your wounds', 'Travel toward Hub'],
      'Hunt the wildlife nearby',
      st(8)
    );
    expect(pick).toMatch(/rest|camp|bind/i);
  });

  it('under 50% with only Hunt / Travel picks Travel', () => {
    const pick = preferHurtRecoveryPick(
      ['Hunt the wildlife nearby', 'Travel toward Lowgate'],
      'Hunt the wildlife nearby',
      st(9)
    );
    expect(pick).toMatch(/^travel/i);
  });

  it('under 50% with only Hunt picks the least dangerous non-attack or waits', () => {
    const pick = preferHurtRecoveryPick(
      ['Hunt the wildlife nearby', 'Wait', 'Look around'],
      'Hunt the wildlife nearby',
      st(5)
    );
    expect(pick).not.toMatch(/hunt the wildlife/i);
  });

  it('at 50%+ the pick is unchanged for the existing fixtures', () => {
    const offered = ['Hunt the wildlife nearby', 'Gather herbs and resources nearby', 'Travel toward Hub'];
    const pick = preferHurtRecoveryPick(offered, 'Hunt the wildlife nearby', st(11));
    expect(pick).toBe('Hunt the wildlife nearby');
  });
});
