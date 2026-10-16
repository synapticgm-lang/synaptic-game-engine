import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest, WorldDeal } from './types';
import { commitTurnRecord, commitmentLine, openCommitmentsFor, recordTurnCommitments } from './stateTx';

function quest(over: Partial<Quest> = {}): Quest {
  return {
    id: 'q-cellar',
    name: 'Clear the Cellar',
    description: 'Rats in the cellar.',
    status: 'active',
    type: 'side',
    revealed: true,
    giver: 'Joe Bloggs',
    objectives: [{ id: 'o1', description: 'Clear the rats', completed: false }],
    ...over,
  } as Quest;
}

function base(): GameState {
  return { ...createInitialState('K test', 'dnd'), currentLocation: 'Millbrook', quests: [], log: [] } as GameState;
}

describe('Order K1: commitments from the turn record', () => {
  it('a quest taken on from a named giver records a promise to that giver, with an engine condition', () => {
    const before = base();
    const after = { ...before, turn: (before.turn ?? 0) + 1, quests: [quest()] } as GameState;
    const { state } = commitTurnRecord(before, after, []);
    const c = state.commitments ?? [];
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({
      kind: 'promise',
      by: 'player',
      to: 'Joe Bloggs',
      status: 'open',
      condition: { type: 'quest-complete', questId: 'q-cellar' },
    });
  });

  it('a quest with no giver records nothing', () => {
    const before = base();
    const after = { ...before, turn: (before.turn ?? 0) + 1, quests: [quest({ giver: undefined })] } as GameState;
    expect(commitTurnRecord(before, after, []).state.commitments ?? []).toEqual([]);
  });

  it('the same quest is recorded once', () => {
    const before = base();
    const after = { ...before, turn: (before.turn ?? 0) + 1, quests: [quest()] } as GameState;
    const once = commitTurnRecord(before, after, []).state;
    expect(recordTurnCommitments(once).commitments).toHaveLength(1);
  });

  it('prose that says "I promise" records nothing when the turn record has no commitment', () => {
    const before = base();
    const after = {
      ...before,
      turn: (before.turn ?? 0) + 1,
      log: [{ id: 'g', turn: 1, role: 'gm', content: 'You say: "I promise I will come back for you."', timestamp: 0 }],
    } as GameState;
    expect(commitTurnRecord(before, after, []).state.commitments ?? []).toEqual([]);
  });

  it('an active world deal becomes a deal commitment and points at it by id', () => {
    const deal = {
      id: 'd1',
      name: 'Salt run',
      partnerName: 'Mara',
      playerShare: 0.5,
      risk: 'safe',
      runsPerWeek: 1,
      workEthic: 'steady',
      active: true,
      goldPaid: 0,
      lastResolvedWeek: 0,
    } as WorldDeal;
    const s = {
      ...base(),
      worldLedger: {
        clock: { day: 1, week: 1 },
        caravans: [],
        deals: [deal],
        holdings: [],
        hostiles: [],
        actors: [],
        pendingHiddenEvents: [],
      },
    } as GameState;
    const next = recordTurnCommitments(s);
    expect(next.commitments?.[0]).toMatchObject({ kind: 'deal', to: 'Mara', condition: { type: 'deal-runs', dealId: 'd1' } });
    expect(next.worldLedger?.deals[0]?.commitmentId).toBe(next.commitments?.[0]?.promiseId);
  });

  it('open commitments are listed for the people they are owed to', () => {
    const before = base();
    const after = { ...before, turn: (before.turn ?? 0) + 1, quests: [quest()] } as GameState;
    const s = commitTurnRecord(before, after, []).state;
    expect(openCommitmentsFor(s, ['joe bloggs']).map(commitmentLine)).toEqual(['Promise to Joe Bloggs: Clear the Cellar']);
    expect(openCommitmentsFor(s, ['Someone Else'])).toEqual([]);
  });
});
