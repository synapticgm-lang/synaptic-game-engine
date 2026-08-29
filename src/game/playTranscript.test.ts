import { describe, expect, it } from 'vitest';
import type { LogEntry } from './types';
import { createInitialState } from './defaults';
import {
  buildPlayDump,
  buildPlayTranscript,
  playTranscriptFilename,
  resolveOfferedChoices,
  withOfferedChoices,
} from './playTranscript';
import { filterInventedContextChoices } from './choiceWarden';

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

  it('falls back to last GM offeredChoices when opening pending and cover chips are empty', () => {
    const base = createInitialState('Test Tale', 'litrpg');
    const offered = [
      'Examine the damaged building more closely',
      'Check the contents of your bag',
      'Inspect the immediate surroundings',
      'Approach the doorway to Corridor',
    ];
    const state = {
      ...base,
      choices: [],
      log: [
        {
          id: 'g1',
          turn: 1,
          role: 'gm' as const,
          content:
            'The damaged building leans over a doorway to a corridor. Your bag sits at your feet. The immediate surroundings are ash.',
          timestamp: 1,
          offeredChoices: offered,
        },
      ],
      openingEstablishment: {
        complete: false,
        pending: [{ id: 'appearance', kind: 'appearance' as const, question: 'What do you look like?' }],
        answers: { name: 'Jax' },
        sceneWritten: true,
      },
    };
    expect(resolveOfferedChoices(state)).toEqual(offered);
  });

  it('after inspect surroundings drops name-cover chips while the name cover is still pending', () => {
    const base = createInitialState('Test Tale', 'litrpg');
    const state = {
      ...base,
      character: { ...base.character, name: 'Unknown Survivor' },
      choices: [
        'Give them your name',
        'Tell them who you are',
        'Approach the doorway',
        'Wait and listen carefully',
      ],
      log: [
        {
          id: 'g1',
          turn: 0,
          role: 'gm' as const,
          content:
            'The ceremonial circle is rubble and weeds. Silence, damp earth, crumbling stone.',
          timestamp: 1,
          offeredChoices: ['Inspect the immediate surroundings', 'Wait and listen carefully'],
        },
        {
          id: 'p1',
          turn: 0,
          role: 'player' as const,
          content: 'Inspect the immediate surroundings',
          timestamp: 2,
        },
        {
          id: 'g2',
          turn: 0,
          role: 'gm' as const,
          content: 'Weeds cling to the broken stones. A gap opens toward a corridor of ash.',
          timestamp: 3,
        },
      ],
      sceneFacts: {
        crowd: 'none' as const,
        noise: 'quiet',
        present: [],
        props: ['weeds', 'rubble', 'stones'],
        lastBeat: 'inspect',
        updatedTurn: 0,
        indoor: false,
      },
      openingEstablishment: {
        complete: false,
        pending: [{ id: 'name', kind: 'name' as const, question: 'A name. What do we call you?' }],
        answers: {},
        sceneWritten: true,
      },
    };
    const filtered = filterInventedContextChoices(
      ['Give them your name', 'Tell them who you are', 'Waiting for a name you will own', 'Approach the doorway'],
      state
    );
    expect(filtered.join(' ')).not.toMatch(/give them your name|tell them who you are|waiting for a name you will own/i);
    expect(resolveOfferedChoices({ ...state, choices: filtered }).join(' ')).not.toMatch(
      /give them your name|tell them who you are|waiting for a name you will own/i
    );
  });

  it('falls back to last GM offeredChoices when opening is complete and state.choices is empty', () => {
    const base = createInitialState('Test Tale', 'litrpg');
    const offered = [
      'Examine the damaged building more closely',
      'Check the contents of your bag',
      'Inspect the immediate surroundings',
    ];
    const state = {
      ...base,
      choices: [],
      log: [
        {
          id: 'g1',
          turn: 1,
          role: 'gm' as const,
          content:
            'The damaged building leans over a doorway to a corridor. Your bag sits at your feet. The immediate surroundings are ash.',
          timestamp: 1,
          offeredChoices: offered,
        },
      ],
      openingEstablishment: {
        complete: true,
        pending: [],
        answers: { name: 'Jax' },
        sceneWritten: true,
      },
    };
    expect(resolveOfferedChoices(state).slice(0, 3)).toEqual(offered);
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
    const dump = buildPlayDump(state);
    expect(dump).toContain('## Loop review');
    expect(dump).toContain('## Turns (JSONL)');
    expect(dump).toContain('Bible:');
    expect(dump).not.toMatch(/eval harness|test mode/i);
  });
});
