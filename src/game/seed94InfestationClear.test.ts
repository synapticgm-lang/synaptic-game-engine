/**
 * Seed 94: "Clear the infestation in the cathedral's lower crypts" must not complete,
 * and must not pay quest-step XP, when a street thug fight exhausts an NPC topic.
 * It completes only when that infestation is beaten in the cathedral lower level.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { advanceNpcTopicExhaustion } from './npcTopicFsm';
import { applySiteClearObjectives } from './questHooks';
import { applySandboxXpAwards } from './sandboxXp';

const STEP = "Clear the infestation in the cathedral's lower crypts to prove your baseline stats.";

function quest(): Quest {
  return {
    id: 'sp-spine-cathedral-royal-vanguard',
    name: "The Crown's Meat Shield",
    description: 'Front line for the Crown.',
    status: 'active',
    type: 'main',
    revealed: true,
    location: 'Cathedral Undercroft',
    objectives: [{ id: 'sp-spine-cathedral-royal-vanguard-obj-1', description: STEP, completed: false }],
  };
}

function pact(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 's94',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Back streets',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    quests: [quest()],
    turn: 20,
    character: { ...s.character!, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    arcDirector: {
      npcTopics: { orth: ['generic:environment', 'search:area', 'generic:thugs'] },
    },
    ...over,
    sceneFacts: {
      ...s.sceneFacts!,
      crowd: 'present',
      present: ['Orth'],
      crowdCount: 1,
      ...(over.sceneFacts ?? {}),
    },
  } as GameState;
}

describe('seed 94 — infestation step is not a street fight', () => {
  it('a repeated thug topic on Back streets does not complete the step or pay its XP', () => {
    const before = pact();
    const advanced = advanceNpcTopicExhaustion(before, 'Orth');
    expect(advanced.state.quests?.[0].objectives?.[0].completed).toBe(false);
    const paid = applySandboxXpAwards(before, {
      playerAction: 'Face the thugs',
      locationName: 'Back streets',
      previousLocationName: 'Back streets',
      questsBefore: before.quests ?? [],
      questsAfter: advanced.state.quests ?? [],
      events: [],
      turn: 21,
    });
    expect(paid.notes.some((n) => /quest step: Clear the infestation/i.test(n))).toBe(false);
  });

  it('beating the thugs, even in the undercroft, does not clear the infestation', () => {
    const next = applySiteClearObjectives([quest()], 'Cathedral Undercroft', 'the thugs', true);
    expect(next[0].objectives?.[0].completed).toBe(false);
  });

  it('beating the infestation in the cathedral undercroft completes the step and pays 50 XP', () => {
    const before = pact({ currentLocation: 'Cathedral Undercroft' });
    const after = applySiteClearObjectives(before.quests ?? [], 'Cathedral Undercroft', 'Crypt Rats', true);
    expect(after[0].objectives?.[0].completed).toBe(true);
    const lost = applySiteClearObjectives(before.quests ?? [], 'Cathedral Undercroft', 'Crypt Rats', false);
    expect(lost[0].objectives?.[0].completed).toBe(false);
    const paid = applySandboxXpAwards(before, {
      playerAction: 'Press the attack',
      locationName: 'Cathedral Undercroft',
      previousLocationName: 'Cathedral Undercroft',
      questsBefore: before.quests ?? [],
      questsAfter: after,
      events: [],
      turn: 21,
    });
    expect(paid.notes).toContain(`XP Gained: 50 (quest step: ${STEP.slice(0, 48)})`);
  });
});
