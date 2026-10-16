import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { commitTurnRecord } from './stateTx';
import { promiseViews, questTargetViews } from './questView';

const QUEST = {
  id: 'q1', name: 'The Lost Ledger', description: 'Find the ledger.', status: 'active', type: 'side', revealed: true, giver: 'Edda Marl',
  objectives: [
    { id: 'o0', description: 'Speak with Edda', completed: true },
    { id: 'o1', description: 'Find the grain ledger', completed: false, target: { kind: 'item', name: 'grain ledger', place: 'Millbrook' } },
  ],
} as Quest;

function base(loc: string): GameState {
  return { ...createInitialState('QV', 'dnd'), currentLocation: loc, quests: [], log: [] } as GameState;
}

describe('QV-a: quest targets and "here"', () => {
  it('shows the open step, its target and place, and "here" when the player stands there', () => {
    const v = questTargetViews({ ...base('Millbrook'), quests: [QUEST] } as GameState);
    expect(v.q1).toMatchObject({ step: 'Find the grain ledger', target: 'grain ledger', targetKind: 'item', place: 'Millbrook', here: true, found: false });
  });
  it('away from the place it is not here', () => {
    expect(questTargetViews({ ...base('Brinewatch'), quests: [QUEST] } as GameState).q1?.here).toBe(false);
  });
  it('finished and inactive quests show no target', () => {
    const done = { ...QUEST, status: 'completed' } as Quest;
    expect(questTargetViews({ ...base('Millbrook'), quests: [done] } as GameState)).toEqual({});
  });
});

describe('QV-b: promises', () => {
  it('a quest taken from a giver shows as an open promise, then kept when the quest completes', () => {
    const b = base('Millbrook');
    let s = commitTurnRecord(b, { ...b, turn: (b.turn ?? 0) + 1, quests: [QUEST] } as GameState, []).state;
    expect(promiseViews(s)).toEqual([{ id: 'quest:q1', kind: 'Promise', to: 'Edda Marl', what: 'The Lost Ledger', status: 'open' }]);
    s = commitTurnRecord(s, { ...s, turn: (s.turn ?? 0) + 1, quests: [{ ...QUEST, status: 'completed' }] } as GameState, []).state;
    expect(promiseViews(s)[0]?.status).toBe('kept');
  });
  it('no commitments, no promises', () => {
    expect(promiseViews(base('Millbrook'))).toEqual([]);
  });
});
