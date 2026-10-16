import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest, WorldDeal } from './types';
import { storedRelationshipFor } from './npcRelationships';
import { presentSystemNotices } from './systemNotice';
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

describe('Order K2: the engine settles a commitment', () => {
  it('keeps Joe Bloggs\'s promise after travel, then the quest is completed', () => {
    const before = base();
    const taken = commitTurnRecord(before, { ...before, turn: 1, quests: [quest()] }, []).state;
    const traveled = commitTurnRecord(taken, { ...taken, turn: 2, currentLocation: 'Ashford' }, []);
    expect(traveled.state.commitments?.[0]?.status).toBe('open');
    expect(traveled.lines.join('\n')).not.toMatch(/Promise kept/);
    const done = commitTurnRecord(
      traveled.state,
      { ...traveled.state, turn: 3, quests: [quest({ status: 'completed' })] },
      [],
    );
    expect(done.state.commitments?.[0]?.status).toBe('kept');
    expect(done.lines).toContain('Promise kept: You have fulfilled your promise to Joe Bloggs.');
    expect(storedRelationshipFor(done.state, 'Joe Bloggs')?.trust).toBe(5);
    expect(presentSystemNotices(done.lines, 'litrpg')).toContain(
      'Promise kept — You have fulfilled your promise to Joe Bloggs.',
    );
    expect(presentSystemNotices(done.lines, 'dnd')).toContain(
      'Promise kept: You have fulfilled your promise to Joe Bloggs.',
    );
  });

  it('a failed quest breaks the promise', () => {
    const before = base();
    const taken = commitTurnRecord(before, { ...before, turn: 1, quests: [quest()] }, []).state;
    const failed = commitTurnRecord(taken, { ...taken, turn: 2, quests: [quest({ status: 'failed' })] }, []);
    expect(failed.state.commitments?.[0]?.status).toBe('broken');
    expect(failed.lines).toContain('Promise broken: You have broken your promise to Joe Bloggs.');
    expect(storedRelationshipFor(failed.state, 'Joe Bloggs')?.trust).toBe(-8);
  });

  it('a passed due turn expires the promise on the three-turn check', () => {
    const before = base();
    const taken = commitTurnRecord(before, { ...before, turn: 1, quests: [quest()] }, []).state;
    const owed = {
      ...taken,
      commitments: [{ ...taken.commitments![0]!, dueTurn: 1 }],
    };
    const quiet = commitTurnRecord(owed, { ...owed, turn: 2 }, []);
    expect(quiet.state.commitments?.[0]?.status).toBe('open');
    const later = commitTurnRecord(quiet.state, { ...quiet.state, turn: 3 }, []);
    expect(later.state.commitments?.[0]?.status).toBe('expired');
    expect(later.lines).toContain('Promise expired: Your promise to Joe Bloggs has expired.');
    expect(storedRelationshipFor(later.state, 'Joe Bloggs')?.trust).toBe(-8);
  });

  it('writer prose that says the word was kept changes nothing', () => {
    const before = base();
    const taken = commitTurnRecord(before, { ...before, turn: 1, quests: [quest()] }, []).state;
    const claimed = commitTurnRecord(taken, {
      ...taken,
      turn: 3,
      log: [{ id: 'g', turn: 3, role: 'gm', content: 'You kept your word to Joe Bloggs.', timestamp: 0 }],
    } as GameState, []);
    expect(claimed.state.commitments?.[0]?.status).toBe('open');
    expect(claimed.lines.join('\n')).not.toMatch(/Promise kept/);
  });

  it('a quiet turn that is not a third turn and has no event leaves the promise open', () => {
    const before = base();
    const taken = commitTurnRecord(before, { ...before, turn: 1, quests: [quest()] }, []).state;
    const doneAlready = { ...taken, quests: [quest({ status: 'completed' })] };
    const quiet = commitTurnRecord(doneAlready, { ...doneAlready, turn: 2 }, []);
    expect(quiet.state.commitments?.[0]?.status).toBe('open');
    const checked = commitTurnRecord(quiet.state, { ...quiet.state, turn: 3 }, []);
    expect(checked.state.commitments?.[0]?.status).toBe('kept');
  });

  it('formats Deal and Agreement the same way', () => {
    expect(presentSystemNotices(['Deal broken: You have broken your deal to Mara.'], 'litrpg')).toEqual([
      'Deal broken — You have broken your deal to Mara.',
    ]);
    expect(presentSystemNotices(['Agreement expired: Your agreement to Mara has expired.'], 'litrpg')).toEqual([
      'Agreement expired — Your agreement to Mara has expired.',
    ]);
  });
});
