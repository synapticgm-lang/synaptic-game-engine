/**
 * 28l — one writer turn: at most one revision on code-found problems, same-writer plain prose as the
 * last resort, never a stitched / canned line; relaxed checks; rotating no-progress nudge.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { prepareRetrospectiveWriterInput } from './completedEventPacket';
import { runWriterTurn, renderWriterDraft, writerDraftProblems, writerTurnIssues } from './writerTurn';
import { readChatCompletion, stripReasoningBlocks } from './openRouterChat';
import { unresolvedActionReason } from './actionResolution';
import { nudgeIfStuck } from './choiceRanking';
import type { GameState } from './types';

const LOOK = { kind: 'observe', label: 'Look', targets: [] } as never;

function setup(input = 'Look around the hall') {
  const base = {
    ...createInitialState('Ria', 'litrpg'),
    currentLocation: 'Cathedral Undercroft',
    turn: 5,
  } as GameState;
  const prepared = prepareRetrospectiveWriterInput(base, input, { xp: 0, engineResult: '' });
  return { state: prepared.state, packet: prepared.packet, input };
}

const GOOD =
  'You walked the length of the undercroft with slow steps. Dust lifted where your boots fell on the flagstones. '
  + 'A cracked font stood against the far wall, dry for years. Somewhere above, a bell rope creaked once and went still.';

describe('28l writer turn', () => {
  it('a clean first draft costs no extra writer call', async () => {
    const { state, packet, input } = setup();
    let calls = 0;
    const r = await runWriterTurn({
      firstRaw: GOOD,
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
      callWriter: async () => { calls += 1; return ''; },
    });
    expect(calls).toBe(0);
    expect(r.outcome).toBe('accepted');
    expect(r.prose).toContain('undercroft');
  });

  it('a thin draft gets exactly one revision with the problem list', async () => {
    const { state, packet, input } = setup();
    const payloads: string[] = [];
    const r = await runWriterTurn({
      firstRaw: 'You looked around the hall and saw only dust on the old floor',
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
      callWriter: async (p) => { payloads.push(p); return GOOD; },
    });
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatch(/YOUR DRAFT:/);
    expect(payloads[0]).toMatch(/FIX ONLY THESE PROBLEMS/);
    expect(r.outcome).toBe('revised');
    expect(r.prose).toContain('cracked font');
  });

  it('an empty draft goes to the same writer with a plain-prose prompt, never a stitch', async () => {
    const { state, packet, input } = setup();
    const payloads: string[] = [];
    const r = await runWriterTurn({
      firstRaw: '{"refs":[],"lines":[]}',
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
      callWriter: async (p) => { payloads.push(p); return GOOD; },
    });
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatch(/Plain prose only/);
    expect(r.outcome).toBe('last-resort');
    expect(r.prose).toContain('bell rope');
  });

  it('total outage returns empty prose instead of canned lines', async () => {
    const { state, packet, input } = setup();
    const r = await runWriterTurn({
      firstRaw: '',
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
      callWriter: async () => '',
    });
    expect(r.outcome).toBe('empty');
    expect(r.prose).toBe('');
    expect(renderWriterDraft('{"refs":[],"lines":[]}', state, packet).prose).toBe('');
  });

  it('checks: a valid short line resolves; a room fact is not a required engine result', () => {
    const { state } = setup();
    expect(unresolvedActionReason('Wait', 'You waited by the door until the torch burned low.', LOOK)).toBeNull();
    expect(
      unresolvedActionReason('Look around', GOOD, LOOK, '', 'Dungeon: Crypt Hall — a low vault with three doors.')
    ).toBeNull();
    expect(
      unresolvedActionReason('Attack', 'You studied the carvings along the wall for a while.', LOOK, '', 'Fight: VICTORY over the Ghoul')
    ).toBe('engine result not stated');
    expect(writerDraftProblems(GOOD, { state, playerInput: 'Look around', intent: LOOK, engineFact: '', previousGm: '' })).toEqual([]);
  });
});

describe('28l model-agnostic writer replies', () => {
  it('strips thinking blocks from any provider; reasoning fields are never the story', () => {
    expect(stripReasoningBlocks('<think>plan the beat</think>You stepped in.')).toBe('You stepped in.');
    expect(stripReasoningBlocks('<thinking a="1">x</thinking> Rain fell.')).toBe('Rain fell.');
    expect(stripReasoningBlocks('<think>still planning when the tokens ran')).toBe('');
    expect(stripReasoningBlocks('planning leftovers</think>The door opened.')).toBe('The door opened.');
    expect(readChatCompletion({ choices: [{ message: { content: '', reasoning_content: 'hmm' } }] }))
      .toEqual({ text: '', issue: 'reasoning-only' });
    expect(readChatCompletion({ choices: [{ message: { content: '' } }] })).toEqual({ text: '', issue: 'empty' });
    expect(readChatCompletion({ choices: [{ finish_reason: 'length', message: { content: 'You walked' } }] }))
      .toEqual({ text: 'You walked', issue: 'cut-off' });
    expect(readChatCompletion({ choices: [{ finish_reason: 'stop', message: { content: '<think>a</think>Done.' } }] }))
      .toEqual({ text: 'Done.', issue: null });
  });

  it('plain prose and broken JSON both become story', () => {
    const { state, packet } = setup();
    expect(renderWriterDraft(GOOD, state, packet).prose).toContain('cracked font');
    const broken = '{"refs":[],"lines":[{"fn":"place","text":"You stood in the undercroft while dust drifted down."},'
      + '{"fn":"action","text":"You ran a hand along the cold wall and felt old carving';
    const prose = renderWriterDraft(broken, state, packet).prose;
    expect(prose).toMatch(/dust drifted down/);
    expect(prose).toMatch(/cold wall/);
  });

  it('issues are logged, never a failure: recycle / unresolved notes map to training labels', () => {
    expect(writerTurnIssues(['reasoning-only', 'bogus'], [
      'Commit gate: recycle-without-delta',
      'Narrative does not resolve the player action',
    ])).toEqual(['reasoning-only', 'recycled', 'unresolved']);
    expect(writerTurnIssues([], ['Cooldown removed 2 pad(s)'])).toEqual([]);
  });
});

describe('28l nudge rotation', () => {
  it('never repeats the same nudge twice in a row and rotates sources', () => {
    let s = {
      ...createInitialState('Ria', 'litrpg'),
      turn: 10,
      circling: { stale: {}, lastProgressTurn: 0 },
    } as GameState;
    const lines: string[] = [];
    for (let i = 0; i < 4; i++) {
      const r = nudgeIfStuck(s);
      expect(r.receipts).toHaveLength(1);
      lines.push(r.receipts[0]!);
      s = { ...r.state, turn: (r.state.turn ?? 0) + 3, circling: { ...r.state.circling!, lastProgressTurn: r.state.turn ?? 0 } };
    }
    for (let i = 1; i < lines.length; i++) expect(lines[i]).not.toBe(lines[i - 1]);
  });
});
