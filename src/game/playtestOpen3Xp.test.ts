/**
 * XP-D1 OPEN3 — fight XP floor, Check System inbox, no-progress Search/Read/Open suppress.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { milestoneXp } from './xpRules';
import { levelBar, unitMilestoneAmount } from './rules/xpPace';
import {
  appendSystemNotices,
  checkSystemOffered,
  openSystemNotices,
  unopenedSystemNotices,
} from './systemNoticeInbox';
import {
  actionFamily,
  fillerSceneKey,
  rankChoices,
  recordCirclingTurn,
} from './choiceRanking';
import type { GameState } from './types';

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('Open3', 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
    character: { ...s.character!, name: 'Jax', level: 2, xp: 0, xpToNext: levelBar('litrpg', 2), hp: 20, maxHp: 20 },
    turn: 10,
    circling: { stale: {}, lastProgressTurn: 10 },
    ...over,
  } as GameState;
}

describe('XP-D1 OPEN3 fight XP', () => {
  it('same-level L2 fight pays a real chunk of the bar (about 4–8%)', () => {
    const bar = levelBar('litrpg', 2);
    const amt = unitMilestoneAmount('litrpg', 'encounter', { playerLevel: 2, foeLevel: 2 });
    const share = amt / bar;
    expect(amt).toBeGreaterThanOrEqual(1);
    expect(share).toBeGreaterThanOrEqual(0.04);
    expect(share).toBeLessThanOrEqual(0.12);
  });

  it('L2 quest complete is smaller than the OPEN2 3-unit lump', () => {
    const complete = milestoneXp('litrpg', 'questComplete', {
      level: 2,
      playerLevel: 2,
      contentLevel: 2,
    }).amount;
    const step = milestoneXp('litrpg', 'questStep', { level: 2, playerLevel: 2, contentLevel: 2 }).amount;
    const fight = milestoneXp('litrpg', 'encounter', { level: 2, playerLevel: 2, foeLevel: 2 }).amount;
    expect(complete).toBeLessThan(60);
    expect(step + complete).toBeLessThan(levelBar('litrpg', 2));
    expect(fight).toBeGreaterThanOrEqual(1);
  });

  it('L1 rite path amounts unchanged (step 50 / fight 50 / complete 150 snapshot)', () => {
    expect(milestoneXp('litrpg', 'questStep', { level: 1, playerLevel: 1 }).amount).toBe(50);
    expect(milestoneXp('litrpg', 'encounter', { level: 1, playerLevel: 1, foeLevel: 1 }).amount).toBe(50);
  });
});

describe('XP-D1 OPEN3 Check System inbox', () => {
  it('level-up and rite XP each raise the Check System stack', () => {
    let state = lit({ character: { ...lit().character!, level: 1, xp: 0, xpToNext: 150 } });
    expect(checkSystemOffered(state)).toBe(false);
    state = appendSystemNotices(state, [
      'XP Gained: 150 (opening rite: Opening Rite: The Pact)',
      'Level Up! Now level 2.',
      'Quest complete: Opening Rite: The Pact',
    ]);
    expect(unopenedSystemNotices(state)).toBeGreaterThanOrEqual(2);
    expect(checkSystemOffered(state)).toBe(true);
    const opened = openSystemNotices(state);
    expect(unopenedSystemNotices(opened)).toBe(0);
    expect(opened.systemNoticeInbox?.lines.length).toBeGreaterThanOrEqual(2);
  });

  it('opening notices does not change XP', () => {
    let state = appendSystemNotices(lit(), ['XP Gained: 21 (defeated the thugs)']);
    const xp = state.character?.xp ?? 0;
    state = openSystemNotices(state);
    expect(state.character?.xp).toBe(xp);
  });
});

describe('XP-D1 OPEN3 no-progress filler chips', () => {
  it('Read / Analyze / Search / Open share the search filler family', () => {
    expect(actionFamily('Search the area')).toBe('search');
    expect(actionFamily('Read Warden Elise Cho')).toBe('search');
    expect(actionFamily('Analyze High Chanter Orel Vane')).toBe('search');
    expect(actionFamily('Open the bronze reward box')).toBe('search');
  });

  it('a dead Search is not re-offered until the scene changes', () => {
    let state = lit({
      currentLocation: 'Metro Platform',
      turn: 12,
      circling: { stale: {}, lastProgressTurn: 10 },
    });
    state = recordCirclingTurn(state, 'Search the area', [], {
      ...state,
      turn: 11,
      circling: { stale: {}, lastProgressTurn: 10 },
    });
    const ranked = rankChoices(state, [
      'Search the area',
      'Read Warden Elise Cho',
      'Analyze Warden Elise Cho',
      'Open the bronze reward box',
      'Travel toward Riverside Stronghold',
      'Ask the officer about the lead',
    ]);
    expect(ranked.choices.some((c) => /^Search|^Read |^Analyze |^Open /i.test(c))).toBe(false);
    expect(ranked.choices.some((c) => /travel toward|ask /i.test(c))).toBe(true);
  });

  it('simulated 50-turn chip stream: no filler label repeats more than twice without a scene change', () => {
    let state = lit({
      currentLocation: 'Cathedral Close',
      turn: 2,
      circling: { stale: {}, lastProgressTurn: 2 },
    });
    const offerCounts = new Map<string, number>();
    let scene = fillerSceneKey(state);
    for (let t = 3; t <= 52; t++) {
      state = { ...state, turn: t };
      const pool = [
        'Search the area',
        'Read Orel Vane',
        'Analyze Orel Vane',
        'Open the bronze reward box',
        'Travel toward Lowmarket',
        'Ask what they want',
        'Look for a fight',
      ];
      const offered = rankChoices(state, pool).choices;
      for (const c of offered) {
        if (!/^(Search|Read |Analyze|Open )/i.test(c)) continue;
        const key = `${scene}::${c}`;
        offerCounts.set(key, (offerCounts.get(key) ?? 0) + 1);
      }
      // Take a filler once with no progress, then a progress travel every few turns.
      const filler = offered.find((c) => /^(Search|Read |Analyze|Open )/i.test(c));
      if (filler && t % 3 !== 0) {
        state = recordCirclingTurn({ ...state, turn: t }, filler, [], state);
      } else {
        state = recordCirclingTurn(
          {
            ...state,
            turn: t,
            currentLocation: t % 7 === 0 ? 'Lowmarket' : state.currentLocation,
            character: {
              ...state.character!,
              xp: (state.character?.xp ?? 0) + (t % 5 === 0 ? 5 : 0),
            },
          },
          'Travel toward Lowmarket',
          t % 5 === 0 ? ['XP Gained: 5 (quest step: bearings)'] : [],
          state
        );
        scene = fillerSceneKey(state);
      }
    }
    for (const [key, n] of offerCounts) {
      expect(n, key).toBeLessThanOrEqual(2);
    }
  });
});
