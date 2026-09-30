/**
 * 28l — one writer turn: one pass, code-found problems logged, never a stitched / canned line; relaxed checks; rotating no-progress nudge.
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

describe('28l writer turn (29z8: one pass)', () => {
  it('a clean first draft commits as-is', () => {
    const { state, packet, input } = setup();
    const r = runWriterTurn({
      firstRaw: GOOD,
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
    });
    expect(r.outcome).toBe('accepted');
    expect(r.prose).toContain('undercroft');
  });

  it('a thin draft is logged and committed, never sent back to the writer', () => {
    const { state, packet, input } = setup();
    const r = runWriterTurn({
      firstRaw: 'You looked around the hall and saw only dust on the old floor',
      packet,
      check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
    });
    expect(r.outcome).toBe('accepted');
    expect(r.problems.length).toBeGreaterThan(0);
    expect(r.prose).toMatch(/dust/);
  });

  it('an empty draft or outage returns empty prose instead of canned lines', () => {
    const { state, packet, input } = setup();
    for (const firstRaw of ['', '{"refs":[],"lines":[]}']) {
      const r = runWriterTurn({
        firstRaw,
        packet,
        check: { state, playerInput: input, intent: LOOK, engineFact: '', previousGm: '' },
      });
      expect(r.outcome).toBe('empty');
      expect(r.prose).toBe('');
    }
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
      expect(r.receipts.length).toBeLessThanOrEqual(1);
      lines.push(...r.receipts);
      s = { ...r.state, turn: (s.turn ?? 0) + 3, circling: { ...r.state.circling!, lastProgressTurn: s.turn ?? 0 } };
    }
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(new Set(lines).size).toBe(lines.length);
  });
});
