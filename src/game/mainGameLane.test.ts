/**
 * Main-game lane. PYOA is left out. Offline, no model call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyQuestAddProposals } from './questGenerator';
import { evaluateMidVisitProposal } from './midVisitProposal';
import { fastForwardTurnCost, runFastForward, stretchEncounter } from './fastForward';
import { LOAD_LOSES_LATER, loadStorySavePoint, markStorySavePoint, storySnapshot } from './storySave';
import { saveFileProblem } from './schemas';
import type { GameState, RoadEncounter } from './types';

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
    expect(fastForwardTurnCost(state, 'Wayfort')).toEqual([1, 2]);
    expect(fastForwardTurnCost({ ...state, currentLocation: 'Wayfort' }, 'Lowgate')).toEqual([2, 1]);
    const unseen = runFastForward(state, { destination: 'Mistwood', maxTurns: 4 });
    expect(unseen.refused).toBe(true);
    expect(unseen.charged).toBe(0);
    const pyoa = runFastForward(travelState('pyoa'), { destination: 'Wayfort', maxTurns: 4 });
    expect(pyoa.refused).toBe(true);

    const walked = runFastForward(state, { destination: 'Wayfort', maxTurns: 3 });
    expect(walked.stretchCosts.every((n, i) => n === [1, 2][i])).toBe(true);
    expect(walked.charged).toBe(walked.stretchCosts.reduce((sum, n) => sum + n, 0));
    expect(walked.charged).toBeLessThanOrEqual(3);
    expect(walked.receipts.every((line) => line.length <= 240)).toBe(true);
    const short = runFastForward(state, { destination: 'Wayfort', maxTurns: 1 });
    expect(short.charged).toBe(1);
    expect(short.stretchCosts).toEqual([1]);

    const road = { terrain: 'mountain' as const, haunted: false, areaTier: 1, stretch: 1, legsTotal: 2, quietStretches: 0 };
    expect(stretchEncounter(road, 1, 0, 0.2)).toBeTruthy();
    expect(stretchEncounter(road, 1, 0.99, 0.2)).toBeNull();
  });

  it('fights a lone mugger or ordinary wildlife as its own charge, and stops for choice, group, elite, and rare meetings', () => {
    const partial = runFastForward(travelState(), { destination: 'Wayfort', maxTurns: 1 });
    const journey = partial.state.journey;
    expect(journey).toBeTruthy();
    const hold = (enc: Partial<RoadEncounter>) => ({
      ...partial.state,
      journey: {
        ...journey!,
        encounter: { kind: 'thugs' as const, level: 1, stretch: 1, dangerous: false, ...enc },
      },
    });

    const mugger = runFastForward(hold({ kind: 'thugs' }), { destination: 'Wayfort', maxTurns: 8 });
    expect(mugger.stretchCosts[0]).toBe(1);
    expect(mugger.receipts.some((line) => /lone mugger/i.test(line))).toBe(true);
    expect(mugger.stopped).not.toBe('encounter');
    expect(mugger.charged).toBeGreaterThan(1);

    const animal = runFastForward(hold({ kind: 'wildlife', dangerous: false }), { destination: 'Wayfort', maxTurns: 8 });
    expect(animal.receipts.some((line) => /ordinary wildlife/i.test(line))).toBe(true);
    expect(animal.stopped).not.toBe('encounter');

    const group = runFastForward(hold({ kind: 'thugs', count: 3 }), { destination: 'Wayfort', maxTurns: 8 });
    expect(group.charged).toBe(0);
    expect(group.stopped).toBe('encounter');

    const choice = runFastForward(hold({ kind: 'plea' }), { destination: 'Wayfort', maxTurns: 8 });
    expect(choice.charged).toBe(0);
    expect(choice.stopped).toBe('encounter');

    const elite = runFastForward(hold({ kind: 'monster' }), { destination: 'Wayfort', maxTurns: 8 });
    expect(elite.charged).toBe(0);
    expect(elite.stopped).toBe('encounter');

    const rare = runFastForward(hold({ kind: 'wildlife', rare: true }), { destination: 'Wayfort', maxTurns: 8 });
    expect(rare.charged).toBe(0);
    expect(rare.stopped).toBe('encounter');

    const dangerous = runFastForward(hold({ kind: 'wildlife', dangerous: true }), { destination: 'Wayfort', maxTurns: 8 });
    expect(dangerous.charged).toBe(0);
    expect(dangerous.stopped).toBe('encounter');

    expect(runFastForward(travelState('pyoa'), { destination: 'Wayfort', maxTurns: 4 }).refused).toBe(true);
  });

  it('one endurance-stride offset never prices a stretch below 1', () => {
    const state = travelState();
    expect(fastForwardTurnCost(state, 'Wayfort')).toEqual([1, 2]);
    const skilled = {
      ...state,
      character: {
        ...state.character,
        namedSkills: [{ id: 'endurance_stride', rank: 1, uses: 0, level: 1 }],
      },
    };
    expect(fastForwardTurnCost(skilled, 'Wayfort')).toEqual([1, 1]);
    const walked = runFastForward(skilled, { destination: 'Wayfort', maxTurns: 2 });
    expect(walked.stretchCosts.every((n) => n >= 1)).toBe(true);
    expect(walked.charged).toBeLessThanOrEqual(2);
  });

  it('a story save restores the whole game, and the load says later progress is lost', () => {
    let state = travelState();
    state = {
      ...state,
      turn: 3,
      gold: 12,
      currentLocation: 'Lowgate',
      quests: [{ id: 'q', name: 'The gate', description: 'Hold it.', status: 'active', type: 'side', objectives: [] }],
      inventory: [{ id: 'rope', name: 'Rope', rarity: 'Common', quantity: 1 }],
      log: [{ id: 'a', turn: 3, role: 'gm', content: 'The gate.', timestamp: 1 }],
    };
    state = markStorySavePoint(state, 'the gate');
    const snap = state.storySavePoints![0]!.snapshot;
    expect(saveFileProblem(JSON.parse(snap))).toBeNull();
    expect(snap.length).toBeLessThanOrEqual(48_000);
    const later = {
      ...state,
      turn: 9,
      gold: 99,
      currentLocation: 'Wayfort',
      quests: [],
      inventory: [],
      log: [
        ...(state.log ?? []),
        { id: 'b', turn: 9, role: 'gm', content: 'Later.', timestamp: 2 },
      ],
    };
    const loaded = loadStorySavePoint(later, state.storySavePoints![0]!.id);
    expect(loaded.warning).toBe(LOAD_LOSES_LATER);
    expect(loaded.state.turn).toBe(3);
    expect(loaded.state.gold).toBe(12);
    expect(loaded.state.currentLocation).toBe('Lowgate');
    expect(loaded.state.quests?.map((q) => q.id)).toEqual(['q']);
    expect(loaded.state.inventory?.map((i) => i.id)).toEqual(['rope']);
    expect(loaded.state.log?.some((row) => row.turn === 9)).toBe(false);
    expect(saveFileProblem(later)).toBeNull();
    const huge = markStorySavePoint({
      ...state,
      log: Array.from({ length: 400 }, (_, i) => ({ id: `x${i}`, turn: 3, role: 'gm' as const, content: 'word '.repeat(80), timestamp: i })),
    }, 'long');
    expect(huge.storySavePoints!.at(-1)!.snapshot.length).toBeLessThanOrEqual(48_000);
    expect(markStorySavePoint({ ...state, engineMode: 'pyoa' }, 'book')).toEqual({ ...state, engineMode: 'pyoa' });
    expect(storySnapshot({ ...state, engineMode: 'pyoa' }).length).toBeGreaterThan(0);
  });
});
