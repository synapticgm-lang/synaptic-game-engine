/**
 * 28v2 — a beat that repeats earlier text, with a revision that repeats it too, is never committed:
 * the same writer gets one fresh ask with the recycled sentences named as issues.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { prepareRetrospectiveWriterInput } from './completedEventPacket';
import { formatFreshReaskFacing, repeatsEarlierBeat, runWriterTurn } from './writerTurn';
import type { GameState } from './types';

const LOOK = { kind: 'observe', label: 'Look', targets: [] } as never;

const PRIOR =
  'You walked the length of the undercroft with slow steps. Dust lifted where your boots fell on the flagstones. '
  + 'A cracked font stood against the far wall, dry for years. Somewhere above, a bell rope creaked once and went still.';

const FRESH =
  'You knelt by the cracked font and traced the carving on its rim. The letters were a list of names, most worn smooth. '
  + 'One near the bottom had been cut recently, the stone still pale. A draft moved along the floor from a gap behind the font.';

function setup(input = 'Look around the hall') {
  const base = {
    ...createInitialState('Ria', 'litrpg'),
    currentLocation: 'Cathedral Undercroft',
    turn: 6,
    log: [
      { id: 'p1', role: 'player', content: 'Look around', timestamp: 1 },
      { id: 'g1', role: 'gm', content: PRIOR, timestamp: 2 },
    ],
  } as unknown as GameState;
  const prepared = prepareRetrospectiveWriterInput(base, input, { xp: 0, engineResult: '' });
  return { state: prepared.state, packet: prepared.packet, input };
}

describe('28v2 fresh re-ask on a repeated beat', () => {
  it('draft and revision both repeat: a fresh ask names the recycled lines and its beat commits', async () => {
    const { state, packet, input } = setup();
    const payloads: string[] = [];
    const replies = [PRIOR, FRESH];
    const r = await runWriterTurn({
      firstRaw: PRIOR,
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: PRIOR },
      callWriter: async (p) => { payloads.push(p); return replies.shift() ?? ''; },
    });
    expect(repeatsEarlierBeat(r.problems)).toBe(true);
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatch(/YOUR DRAFT:/);
    expect(payloads[1]).not.toMatch(/YOUR DRAFT:/);
    expect(payloads[1]).toMatch(/Already told, do not reuse: "A cracked font stood against the far wall/);
    expect(r.outcome).toBe('reasked');
    expect(r.prose).toContain('recently');
    expect(r.prose).not.toContain('bell rope creaked');
  });

  it('an empty fresh reply drops to the plain-prose ask, never the repeat', async () => {
    const { state, packet, input } = setup();
    const payloads: string[] = [];
    const replies = [PRIOR, '', FRESH];
    const r = await runWriterTurn({
      firstRaw: PRIOR,
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: PRIOR },
      callWriter: async (p) => { payloads.push(p); return replies.shift() ?? ''; },
    });
    expect(payloads).toHaveLength(3);
    expect(payloads[2]).toMatch(/Plain prose only/);
    expect(r.outcome).toBe('last-resort');
    expect(r.prose).not.toBe(PRIOR);
  });

  it('a total outage after a repeat commits nothing rather than the repeat', async () => {
    const { state, packet, input } = setup();
    const r = await runWriterTurn({
      firstRaw: PRIOR,
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: PRIOR },
      callWriter: async () => '',
    });
    expect(r.outcome).toBe('empty');
    expect(r.prose).toBe('');
  });

  it('a revision that fixes the repeat costs no fresh ask', async () => {
    const { state, packet, input } = setup();
    let calls = 0;
    const r = await runWriterTurn({
      firstRaw: PRIOR,
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: PRIOR },
      callWriter: async () => { calls += 1; return FRESH; },
    });
    expect(calls).toBe(1);
    expect(r.outcome).toBe('revised');
    expect(formatFreshReaskFacing(packet, state, ['Old line.'])).toMatch(/ISSUES/);
  });
});
