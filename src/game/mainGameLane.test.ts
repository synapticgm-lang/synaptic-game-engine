/**
 * Main-game lane. PYOA is left out. Offline, no model call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyQuestAddProposals } from './questGenerator';
import { evaluateMidVisitProposal } from './midVisitProposal';
import { fastForwardTurnCost, runFastForward, stretchEncounter } from './fastForward';
import { LOAD_LOSES_LATER, loadStorySavePoint, markStorySavePoint } from './storySave';
import type { GameState } from './types';

function visited(name: string, regionId: string, turn = 1) {
  return { id: name.toLowerCase(), name, regionId, lastVisitedTurn: turn, arcStatus: 'open' as const, mapScale: 'street' as const };
}

function travelState(mode: GameState['engineMode'] = 'dnd'): GameState {
  const base = createInitialState('Lane', mode);
  return {
    ...base,
    engineMode: mode,
    currentLocation: 'Lowgate',
    places: [visited('Lowgate', 'low'), visited('Wayfort', 'high')],
    worldAtlas: {
      outlineId: 't',
      outlineName: 'T',
      description: '',
      currentRegionId: 'low',
      regions: [
        { id: 'low', name: 'Lowgate', blurb: 'A valley town.', connections: ['high'], tags: ['town'] },
        { id: 'high', name: 'High', blurb: 'A highland pass.', connections: ['low'], tags: ['mountain'] },
      ],
      settlements: [],
    },
  } as GameState;
}

describe('main game lane', () => {
  it('accepts a new visit quest and rejects a repeat, a resolved job, a genre mismatch, and PYOA', () => {
    const base = createInitialState('Lane', 'dnd');
    const added = applyQuestAddProposals(
      [{ type: 'quest-add', name: 'Ask about the cellar mark', description: 'Read the mark in the cellar.' }],
      base,
    );
    expect(added.state.quests?.some((q) => q.id.startsWith('mid-') && q.type === 'side')).toBe(true);
    expect(added.events.some((e) => e.type === 'quest-add')).toBe(false);
    const again = applyQuestAddProposals(
      [{ type: 'quest-add', name: 'Ask about the cellar mark', description: 'Read it again.' }],
      added.state,
    );
    expect(again.state.quests?.filter((q) => q.name === 'Ask about the cellar mark')).toHaveLength(1);

    const done = evaluateMidVisitProposal(
      { ...added.state, quests: (added.state.quests ?? []).map((q) => ({ ...q, status: 'completed' as const })) },
      { kind: 'side', title: 'Ask about the cellar mark', summary: 'Do it again.' },
    );
    expect(done.ok).toBe(false);

    const radio = evaluateMidVisitProposal(base, {
      kind: 'side',
      title: 'Learn the radio',
      summary: 'Learn how the radio works.',
      genreTags: ['medieval'],
    });
    expect(radio.ok).toBe(false);
    if (!radio.ok) expect(radio.reason).toBe('genre');

    const pyoa = evaluateMidVisitProposal({ ...base, engineMode: 'pyoa' }, {
      kind: 'side',
      title: 'A side path',
      summary: 'Leave the book.',
    });
    expect(pyoa.ok).toBe(false);
    const pyoaAdd = applyQuestAddProposals(
      [{ type: 'quest-add', name: 'A side path', description: 'Leave the book.' }],
      { ...base, engineMode: 'pyoa' },
    );
    expect(pyoaAdd.state.quests?.some((q) => q.id.startsWith('mid-'))).toBe(false);
  });

  it('fast-travels only to a visited place, adds a mountain turn, and stops inside the allowance', () => {
    const state = travelState();
    expect(fastForwardTurnCost(state, 'Wayfort')).toBe(2);
    expect(fastForwardTurnCost({ ...state, currentLocation: 'Wayfort' }, 'Lowgate')).toBe(2);
    const unseen = runFastForward(state, { destination: 'Mistwood', maxTurns: 4 });
    expect(unseen.refused).toBe(true);
    expect(unseen.charged).toBe(0);
    const pyoa = runFastForward(travelState('pyoa'), { destination: 'Wayfort', maxTurns: 4 });
    expect(pyoa.refused).toBe(true);

    const walked = runFastForward(state, { destination: 'Wayfort', maxTurns: 2 });
    expect(walked.charged).toBeLessThanOrEqual(2);
    expect(walked.receipts.every((line) => line.length <= 240)).toBe(true);
    const short = runFastForward(state, { destination: 'Wayfort', maxTurns: 1 });
    expect(short.charged).toBe(0);
    expect(short.stopped).toBe('allowance');

    const road = { terrain: 'mountain' as const, haunted: false, areaTier: 1, stretch: 1, legsTotal: 2, quietStretches: 0 };
    expect(stretchEncounter(road, 1, 0, 0.2)).toBeTruthy();
    expect(stretchEncounter(road, 1, 0.99, 0.2)).toBeNull();
  });

  it('an encounter stops the skip after the stretches already taken', () => {
    const state = travelState();
    const first = runFastForward(state, { destination: 'Wayfort', maxTurns: 8 });
    if (first.stopped === 'encounter') {
      expect(first.charged).toBe(first.turnCost);
      expect(first.charged).toBeLessThan(8);
      return;
    }
    const held = {
      ...first.state,
      journey: first.state.journey
        ? { ...first.state.journey, encounter: { kind: 'thugs' as const, level: 1, stretch: 1, dangerous: false } }
        : first.state.journey,
    };
    const next = runFastForward(held, { destination: 'Wayfort', maxTurns: 8 });
    if (held.journey?.encounter) expect(next.charged).toBe(0);
  });

  it('a story save can be loaded, and the load says later progress is lost', () => {
    let state = travelState();
    state = markStorySavePoint({ ...state, turn: 3, log: [{ id: 'a', turn: 3, role: 'gm', content: 'The gate.', timestamp: 1 }] }, 'the gate');
    const later = {
      ...state,
      turn: 9,
      log: [
        ...(state.log ?? []),
        { id: 'b', turn: 9, role: 'gm', content: 'Later.', timestamp: 2 },
      ],
    };
    const loaded = loadStorySavePoint(later, state.storySavePoints![0]!.id);
    expect(loaded.warning).toBe(LOAD_LOSES_LATER);
    expect(loaded.state.turn).toBe(3);
    expect(loaded.state.log?.some((row) => row.turn === 9)).toBe(false);
    expect(markStorySavePoint({ ...state, engineMode: 'pyoa' }, 'book')).toEqual({ ...state, engineMode: 'pyoa' });
  });
});
