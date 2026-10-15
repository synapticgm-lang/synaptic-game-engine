/**
 * Batch 02n — writer packet diet. Ledger / compiler stay; SNAPSHOT loses lectures.
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { buildEntityCast } from './entityCast';
import { compileCraftRules, formatCraftSnapshotLines } from './craftBookCompiler';
import { lastOfferedChoiceSets } from './semanticLoopDetector';
import type { GameState, LogEntry } from './types';

function dietState(): GameState {
  const state = createInitialState('Diet', 'litrpg') as GameState;
  state.turn = 8;
  state.openingEstablishment = {
    pending: [],
    answers: {},
    complete: true,
    aloneArrival: false,
    pinnedNpcNames: ['Vessa'],
  } as GameState['openingEstablishment'];
  state.sceneFacts = {
    ...(state.sceneFacts ?? { props: [], present: [], crowd: 'present', noise: 'quiet', lastBeat: '', updatedTurn: 8 }),
    present: ['Vessa'],
  };
  // Lock B: CAST names come from the bible registry or a harvested NPC record.
  state.npcMemories = [{ npcId: 'vessa', npcName: 'Vessa', disposition: 'neutral', facts: [], lastSeenTurn: 7 }];
  const gm: LogEntry = {
    id: 'gm-7',
    turn: 7,
    role: 'gm',
    content: 'Vessa waits by the stall and watches the lane.',
    timestamp: 7,
    offeredChoices: [
      'Plunge into the thick of the Lowmarket crowd',
      'Press the handler',
      'Ask Vessa what she heard',
    ],
  };
  const player: LogEntry = {
    id: 'p-8',
    turn: 8,
    role: 'player',
    content: 'Inspect the room',
    timestamp: 8,
  };
  state.log = [...(state.log ?? []), gm, player];
  return state;
}

describe('Batch 02n stamps', () => {
  it('HUD and BUILD are 2026-09-02n and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP.startsWith('2026-09')).toBe(true);
    expect(BUILD_STAMP.startsWith('2026-09')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02n — writer packet diet', () => {
  it('the craft compiler still picks but hands the writer no CRAFT lines', () => {
    const state = dietState();
    expect(lastOfferedChoiceSets(state, 1)[0]?.length).toBeGreaterThan(0);
    expect(compileCraftRules(state).replacedModeLine).toBe(true);
    expect(formatCraftSnapshotLines(state)).toEqual([]);
  });

  it('CAST keeps the named list and drops the CONSTRAINTS lecture', () => {
    const state = dietState();
    const cast = buildEntityCast(state);
    expect(cast).toContain('<CAST>');
    expect(cast).toContain('NAMED CHARACTERS');
    expect(cast).toContain('Vessa');
    expect(cast).toContain('Only listed entities');
    expect(cast).not.toContain('CONSTRAINTS:');
    expect(cast).not.toMatch(/Do NOT invent "a figure"/);
    expect(cast).not.toMatch(/Do NOT use "Consul"/);
    expect(cast).not.toMatch(/Do NOT use "Heat"/);
  });
});
