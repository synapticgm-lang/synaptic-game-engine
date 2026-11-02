/**
 * XP-D1 OPEN9 FIX 5–6 — Opening Rite L2 by ~T2; simple Your-upperclassman prose scrub.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyOpeningRiteTurn, ensureOpeningRite, openingRiteAcceptChip } from './openingRite';
import { applyProseWarden } from './proseWarden';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { levelBar } from './rules/xpPace';
import type { GameState } from './types';

function inkbound(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return ensureOpeningRite({
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'inkbound-academy',
    turn: 1,
    character: { ...s.character!, name: 'Jax', level: 1, xp: 0, xpToNext: 150, hp: 24, maxHp: 24 },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState);
}

describe('XP-D1 OPEN9 Opening Rite pace', () => {
  it('accept on first chip lands L2; backstop on second non-accept also lands L2', () => {
    const chip = openingRiteAcceptChip(inkbound());
    expect(chip).toMatch(/enroll/i);
    const accepted = applyOpeningRiteTurn(inkbound({ turn: 1 }), chip!);
    expect(accepted.state.character.level).toBe(2);
    expect(accepted.state.character.xpToNext).toBe(levelBar('litrpg', 2));

    let s = inkbound({ turn: 0 });
    s = applyOpeningRiteTurn(s, 'Ask what they want').state;
    expect(s.openingRite?.done).toBe(false);
    s = { ...s, turn: 1 };
    s = applyOpeningRiteTurn(s, 'Look around').state;
    expect(s.openingRite?.done).toBe(true);
    expect(s.character.level).toBe(2);
  });

  it('bars stay rising (L1 < L2 < L3 < L4) — xpPace pin unchanged', () => {
    expect(levelBar('litrpg', 1)).toBe(150);
    expect(levelBar('litrpg', 2)).toBe(187);
    expect(levelBar('litrpg', 3)).toBe(233);
    expect(levelBar('litrpg', 4)).toBe(291);
    expect(levelBar('litrpg', 2)).toBeGreaterThan(levelBar('litrpg', 1));
    expect(levelBar('litrpg', 3)).toBeGreaterThan(levelBar('litrpg', 2));
  });
});

describe('XP-D1 OPEN9 Your upperclassman prose', () => {
  it('rejects Your-role harvest and scrubs Your upperclassman in third-person prose', () => {
    expect(canHarvestAsNamedPerson('Your upperclassman mentor', 'inkbound-academy')).toBe(false);
    const raw =
      'Jax walked the yard. Dunn Fenwick leaned on the rail, and Your upperclassman mentor waited off to one side.';
    const out = applyProseWarden(raw, {
      presentNames: ['Dunn Fenwick'],
      currentLocation: 'Lecture Courtyard',
    });
    expect(out).not.toMatch(/Your upperclassman/);
    expect(out).toMatch(/the upperclassman mentor/i);
  });
});
