import { describe, expect, it } from 'vitest';
import type { LogEntry } from './types';
import { createInitialState } from './defaults';
import {
  buildPlayTranscript,
  playTranscriptFilename,
  resolveOfferedChoices,
  withOfferedChoices,
} from './playTranscript';

describe('playTranscript', () => {
  it('preserves offeredChoices on LogEntry via withOfferedChoices', () => {
    const base = createInitialState('Test Tale', 'litrpg');
    const gm: LogEntry = {
      id: 'g1',
      turn: 1,
      role: 'gm',
      content: 'You stand in a quiet hall of barrels and flagstones.',
      timestamp: 1,
    };
    const state = {
      ...base,
      saveId: 'save-abc-123',
      storyName: 'Test Tale',
      log: [gm],
      choices: ['Wait and listen', 'Ask about the hall', 'Search the barrels'],
      openingEstablishment: {
        complete: true,
        pending: [],
        answers: {},
        sceneWritten: true,
      },
    };
    const withPad = withOfferedChoices(gm, state);
    expect(withPad.offeredChoices?.length).toBeGreaterThan(0);
    expect(withPad.offeredChoices).toEqual(resolveOfferedChoices(state));
  });

  it('formats transcript with options and omits missing offeredChoices', () => {
    const base = createInitialState('Test Tale', 'litrpg');
    const log: LogEntry[] = [
      {
        id: 'g1',
        turn: 1,
        role: 'gm',
        content: 'The hall is quiet.',
        timestamp: 1,
        offeredChoices: ['Wait', 'Look around'],
        systemLog: ['Quest Unlocked: Circle'],
      },
      {
        id: 'p1',
        turn: 1,
        role: 'player',
        content: 'Wait',
        timestamp: 2,
      },
      {
        id: 'g2',
        turn: 2,
        role: 'gm',
        content: 'Nothing stirs.',
        timestamp: 3,
      },
      {
        id: 'p2',
        turn: 2,
        role: 'player',
        content: 'Look around',
        timestamp: 4,
      },
    ];
    const state = { ...base, saveId: 'save-abc-123', storyName: 'Test Tale', log };
    const md = buildPlayTranscript(state);
    expect(md).toContain('# Test Tale');
    expect(md).toContain('## Turn 1 — GM');
    expect(md).toContain('The hall is quiet.');
    expect(md).toContain('### Options offered');
    expect(md).toContain('- Wait');
    expect(md).toContain('- Look around');
    expect(md).toContain('### System');
    expect(md).toContain('Quest Unlocked: Circle');
    expect(md).toContain('### Player');
    expect(md).toContain('Wait');
    expect(md).toContain('## Turn 2 — GM');
    expect(md).toContain('Nothing stirs.');
    const turn2 = md.slice(md.indexOf('## Turn 2 — GM'));
    expect(turn2).not.toMatch(/## Turn 2 — GM[\s\S]*?### Options offered/);
    expect(playTranscriptFilename(state)).toBe('synaptic-transcript-save-abc-123.md');
  });
});
