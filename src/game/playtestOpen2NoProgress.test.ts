/**
 * XP-D1 OPEN2 — no-progress loop: useless Use chips, search/read rest, Director stall, quest pick.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { collectSceneAffordances } from './sceneAffordances';
import { rankChoices, recordCirclingTurn, turnsWithoutProgress } from './choiceRanking';
import { STALL_N } from './directorConstants';
import {
  isRewardBoxOpenLine,
  openBoxChip,
  rewardBoxItem,
  settleRewardBox,
  ACHIEVEMENTS,
} from './rules/achievements';
import { pickQuestProfileChoice } from './openingRite';
import type { GameState, Item } from './types';

const firstKill = ACHIEVEMENTS.find((a) => a.key === 'achv:first-kill')!;

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('Open2', 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'system-integration',
    character: { ...s.character!, name: 'Jax', level: 2, xp: 0, xpToNext: 187, hp: 20, maxHp: 20 },
    turn: 10,
    circling: { stale: {}, lastProgressTurn: 10 },
    ...over,
  } as GameState;
}

describe('XP-D1 OPEN2 no-progress chips', () => {
  it('reward box is not offered as Use; Open consumes once', () => {
    const box = rewardBoxItem(firstKill);
    const state = lit({ inventory: [box] });
    const labels = collectSceneAffordances(state).map((a) => a.label);
    expect(labels.some((l) => /^Use\b.*Reward Box/i.test(l))).toBe(false);
    const chip = openBoxChip('Bronze');
    const first = settleRewardBox(state, chip);
    expect(first.settled).toBe(true);
    expect((first.state.inventory ?? []).some((i) => /Reward Box/i.test(i.name))).toBe(false);
    const second = settleRewardBox(first.state, chip);
    expect(second.settled).toBe(false);
    expect(isRewardBoxOpenLine('Use Bronze Reward Box')).toBe(true);
    const viaUse = settleRewardBox(state, 'Use Bronze Reward Box');
    expect(viaUse.settled).toBe(true);
  });

  it('Minor Health Vial Use chip is omitted at full HP', () => {
    const vial: Item = {
      id: 'vial-1',
      name: 'Minor Health Vial',
      rarity: 'Common',
      quantity: 1,
      itemType: 'consumable',
    };
    const full = lit({ inventory: [vial], character: { ...lit().character!, hp: 20, maxHp: 20 } });
    expect(collectSceneAffordances(full).some((a) => /Health Vial/i.test(a.label))).toBe(false);
    const hurt = lit({
      inventory: [vial],
      character: { ...lit().character!, hp: 5, maxHp: 20 },
    });
    expect(collectSceneAffordances(hurt).some((a) => a.label === 'Use Minor Health Vial')).toBe(true);
  });

  it('search/read repeats rest after a no-progress take; stall drops Use spam', () => {
    let state = lit({
      currentLocation: 'Metro Platform',
      circling: { stale: {}, lastProgressTurn: 8 },
      turn: 12,
    });
    state = recordCirclingTurn(state, 'Search the scene for signs', [], {
      ...state,
      turn: 11,
      circling: { stale: {}, lastProgressTurn: 8 },
    });
    expect(turnsWithoutProgress(state)).toBeGreaterThanOrEqual(STALL_N);
    const ranked = rankChoices(state, [
      'Use Silver Reward Box',
      'Search the scene for signs',
      'Read the System trail',
      'Travel toward Riverside Stronghold',
      'Ask the officer about the lead',
    ]);
    expect(ranked.choices.some((c) => /^Use\b/i.test(c))).toBe(false);
    expect(ranked.choices[0]?.toLowerCase()).not.toMatch(/^use\b/);
    expect(
      ranked.choices.some((c) => /travel toward|ask the officer/i.test(c))
    ).toBe(true);
  });

  it('quest profile prefers progress over repeating the last dead Use', () => {
    const state = lit({
      log: [{ id: '1', turn: 9, role: 'player', content: 'Use Silver Reward Box', timestamp: 1 }],
    });
    const pick = pickQuestProfileChoice(
      ['Use Silver Reward Box', 'Travel toward Cracked Street', 'Wait'],
      state,
      () => 'Use Silver Reward Box',
      null
    );
    expect(pick).toBe('Travel toward Cracked Street');
  });

  it('simulated inventory-chip spam ends with a progress chip on offer', () => {
    let state = lit({
      currentLocation: 'Metro Platform',
      circling: { stale: {}, lastProgressTurn: 5 },
      turn: 8,
      inventory: [rewardBoxItem(firstKill)],
    });
    for (const act of [
      'Use Bronze Reward Box',
      'Use Bronze Reward Box',
      'Search the scene for signs',
    ]) {
      state = recordCirclingTurn(
        { ...state, turn: (state.turn ?? 0) + 1 },
        act,
        [],
        state
      );
    }
    expect(turnsWithoutProgress(state)).toBeGreaterThanOrEqual(STALL_N);
    const offered = rankChoices(state, [
      'Use Bronze Reward Box',
      'Use Minor Health Vial',
      'Search the scene for signs',
      'Read the System trail',
      'Travel toward Convenience Store Dungeon',
    ]).choices;
    expect(offered.some((c) => /travel toward|ask |face the|fight |look for a fight/i.test(c))).toBe(true);
    expect(offered[0]).toMatch(/travel toward|ask |face the|fight |look for a fight/i);
  });
});
