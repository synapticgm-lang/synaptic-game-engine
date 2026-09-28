/**
 * 28o — circling: tried-with-no-progress actions rest at that place, recent places rank below fresh ones,
 * a stuck player with no way on gets one hub exit chip, and the autoplay picker follows the chip scores.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { chipProgressScore, chipProgressWeights, rankChoices, recordCirclingTurn } from './choiceRanking';
import { pickWeightedChoice, mulberry32 } from './fatePick';
import type { GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState('Ria', 'dnd'),
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow gate after dark',
    turn: 4,
    ...over,
  } as GameState;
}

describe('28o circling', () => {
  it('rests an exact action tried here with no progress, whatever its family', () => {
    let s = recordCirclingTurn(base(), 'Look around', []);
    s = recordCirclingTurn({ ...s, turn: 5 }, 'Force a path forward', []);
    s = { ...s, turn: 6 };
    const r = rankChoices(s, ['Force a path forward', 'Offer help, honestly', 'Refuse and keep your own counsel', 'Walk the wall']);
    expect(r.choices).not.toContain('Force a path forward');
    expect(chipProgressScore(s, 'Force a path forward')).toBeGreaterThan(chipProgressScore(s, 'Offer help, honestly'));
  });

  it('progress clears the tried mark', () => {
    let s = recordCirclingTurn(base(), 'Look around', []);
    s = recordCirclingTurn({ ...s, turn: 5 }, 'Force a path forward', []);
    s = recordCirclingTurn({ ...s, turn: 6 }, 'Force a path forward', ['XP Gained: 25 (quest step)']);
    expect(chipProgressScore({ ...s, turn: 7 }, 'Force a path forward')).toBe(3);
  });

  it('stuck in place with no way on offered gets one hub exit chip first', () => {
    let s = recordCirclingTurn(base(), 'Look around', []);
    s = recordCirclingTurn({ ...s, turn: 5 }, 'Examine the gouge marks', []);
    s = recordCirclingTurn({ ...s, turn: 6 }, 'Wait and watch', []);
    s = { ...s, turn: 7, openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as never };
    const r = rankChoices(s, ['Investigate the keep', 'Offer help, honestly', 'Refuse and keep your own counsel']);
    expect(r.choices[0]).toMatch(/^Travel toward /);
    expect(r.notes.some((n) => n.startsWith('Stuck exit chip'))).toBe(true);
  });

  it('no exit chip right after a move', () => {
    let s = recordCirclingTurn(base({ currentLocation: 'Keep Gate' }), 'Travel toward Keep Gate', []);
    s = { ...s, turn: 8, circling: { ...s.circling!, lastProgressTurn: 2 } };
    const r = rankChoices(s, ['Investigate the keep', 'Offer help, honestly', 'Refuse and keep your own counsel']);
    expect(r.choices.some((c) => /^Travel toward /.test(c))).toBe(false);
  });

  it('recent places rank below fresh ones; the previous place is Go back and last', () => {
    let s = recordCirclingTurn(base({ currentLocation: 'Greyhollow Inn' }), 'Look around', []);
    s = recordCirclingTurn({ ...s, turn: 5, currentLocation: 'Greyhollow Church' }, 'Travel toward Greyhollow Church', []);
    s = recordCirclingTurn({ ...s, turn: 6, currentLocation: 'Keep Gate' }, 'Travel toward Keep Gate', []);
    s = { ...s, turn: 7 };
    const r = rankChoices(s, ['Travel toward Greyhollow Church', 'Travel toward Greyhollow Inn', 'Travel toward Blackspine Treeline']);
    expect(r.choices[0]).toBe('Travel toward Blackspine Treeline');
    expect(r.choices[r.choices.length - 1]).toBe('Go back to Greyhollow Church');
  });

  it('weighted picker prefers the progress chip', () => {
    let s = recordCirclingTurn(base({ currentLocation: 'Greyhollow Inn' }), 'Look around', []);
    s = recordCirclingTurn({ ...s, turn: 5, currentLocation: 'Keep Gate' }, 'Travel toward Keep Gate', []);
    s = { ...s, turn: 6 };
    const offered = ['Travel toward Blackspine Treeline', 'Look around', 'Go back to Greyhollow Inn'];
    const w = chipProgressWeights(s, offered);
    expect(w[0]).toBeGreaterThan(w[1]!);
    expect(w[1]).toBeGreaterThan(w[2]!);
    const rng = mulberry32(54);
    const picks = Array.from({ length: 200 }, () => pickWeightedChoice(offered, w, rng));
    const fresh = picks.filter((p) => p === offered[0]).length;
    expect(fresh).toBeGreaterThan(120);
    expect(picks.filter((p) => p === offered[2]).length).toBeGreaterThan(0);
  });
});
