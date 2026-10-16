import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { commitTurnRecord } from './stateTx';
import { checkCommitments, COMMITMENT_CHECK_EVERY } from './commitments';
import { presentSystemNotices, systemNotice } from './systemNotice';

const QUEST = {
  id: 'q-wrong', name: 'Hunt down Black Tam', description: 'Tam wronged Joe.', status: 'active', type: 'side',
  revealed: true, giver: 'Joe Bloggs', objectives: [{ id: 'o1', description: 'Defeat Black Tam', completed: false }],
} as Quest;

function start(): GameState {
  const b = { ...createInitialState('K2 test', 'dnd'), currentLocation: 'Millbrook', quests: [], log: [] } as GameState;
  const after = { ...b, turn: (b.turn ?? 0) + 1, quests: [QUEST] } as GameState;
  return commitTurnRecord(b, after, []).state;
}

function nextTurn(prev: GameState, patch: Partial<GameState>): { state: GameState; lines: string[] } {
  return commitTurnRecord(prev, { ...prev, ...patch, turn: (prev.turn ?? 0) + 1 } as GameState, []);
}

describe('Order K2: the engine settles commitments', () => {
  it('Joe Bloggs: travel away keeps it open; finishing the quest keeps the promise, says so, and raises trust', () => {
    let s = start();
    expect(s.commitments?.[0]?.status).toBe('open');
    s = nextTurn(s, { currentLocation: 'Brinewatch' }).state;
    expect(s.commitments?.[0]?.status).toBe('open');
    const done = nextTurn(s, { quests: [{ ...QUEST, status: 'completed', objectives: [{ ...QUEST.objectives![0]!, completed: true }] }] });
    expect(done.state.commitments?.[0]?.status).toBe('kept');
    expect(done.lines).toContain('Promise kept: You have fulfilled your promise to Joe Bloggs.');
    const rel = done.state.arcDirector?.npcRelationships?.find((r) => r.npcName === 'Joe Bloggs');
    if (done.state.arcDirector) expect(Number(rel?.trust ?? 0)).toBeGreaterThan(0);
  });
  it('the quest failing (the target killed by another hand) breaks it', () => {
    const s = start();
    const r = nextTurn(s, { quests: [{ ...QUEST, status: 'failed' }] });
    expect(r.state.commitments?.[0]?.status).toBe('broken');
    expect(r.lines).toContain('Promise broken: You have broken your promise to Joe Bloggs.');
  });
  it('a due turn that passes expires it', () => {
    const s0 = start();
    const s = { ...s0, commitments: s0.commitments!.map((c) => ({ ...c, dueTurn: (s0.turn ?? 0) + 1 })) } as GameState;
    let cur = s;
    let lines: string[] = [];
    for (let i = 0; i < COMMITMENT_CHECK_EVERY + 2 && !lines.length; i++) ({ state: cur, lines } = nextTurn(cur, {}));
    expect(cur.commitments?.[0]?.status).toBe('expired');
    expect(lines[0]).toBe('Promise expired: Your promise to Joe Bloggs ran out of time.');
  });
  it('the writer saying "you kept your word" changes nothing', () => {
    const s = start();
    const r = nextTurn(s, { log: [...(s.log ?? []), { id: 'g', turn: 2, role: 'gm', content: 'Joe nods. "You kept your word."', timestamp: 0 }] });
    expect(r.state.commitments?.[0]?.status).toBe('open');
    expect(r.lines.some((l) => /promise/i.test(l))).toBe(false);
  });
  it('quiet turns are checked only every few turns', () => {
    const s = start();
    expect(checkCommitments({ ...s, turn: (s.turn ?? 0) + 1 }).state.commitments?.[0]?.checkedTurn).toBeUndefined();
  });
});

describe('Order K2: systemNotice rules', () => {
  it('LitRPG formats kept, broken and expired', () => {
    expect(systemNotice('Promise kept: You have fulfilled your promise to Joe Bloggs.')).toBe('Promise kept \u2014 You have fulfilled your promise to Joe Bloggs.');
    expect(systemNotice('Deal broken: You have broken your deal to Mara.')).toBe('Deal broken \u2014 You have broken your deal to Mara.');
    expect(systemNotice('Agreement expired: Your agreement to Hale ran out of time.')).toBe('Agreement expired \u2014 Your agreement to Hale ran out of time.');
  });
  it('tabletop shows the plain line', () => {
    const line = 'Promise kept: You have fulfilled your promise to Joe Bloggs.';
    expect(presentSystemNotices([line], 'dnd')).toEqual([line]);
  });
});
