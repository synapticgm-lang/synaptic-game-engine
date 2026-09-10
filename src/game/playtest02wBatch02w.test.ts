/**
 * Batch 02w — Lock A leftover: starve at emission, not after refill.
 * 02i filtered Travel/Leave; stallInterrupt / padChoicesToCount / spine still
 * could birth the family. Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './choiceEdge';
import { padChoicesToCount } from './choicePipeline';
import { outdoorHubTravelChoices } from './outdoorHubs';
import { excludedPadFamilies, isLeaveFamilyPad, isTravelPad } from './padUniverse';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

function travelYoYoState(): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
    currentLocation: 'West Wall',
    campaignBibleId: 'summoned-pact',
    turn: 43,
    log: [
      { id: 'a', role: 'player', content: 'Travel toward Lowmarket', timestamp: 1 },
      { id: 'b', role: 'gm', content: 'You reach Lowmarket.', timestamp: 2 },
      { id: 'c', role: 'player', content: 'Talk to Lowmarket Fence', timestamp: 3 },
      { id: 'd', role: 'gm', content: 'The fence waits.', timestamp: 4 },
      { id: 'e', role: 'player', content: 'Travel toward West Wall', timestamp: 5 },
      { id: 'f', role: 'gm', content: 'You reach West Wall.', timestamp: 6 },
    ],
    sceneFacts: { ...emptySceneFacts(43), present: ['Wall Sergeant'] },
    discoveredLocations: ['sp-hub-lowmarket', 'sp-hub-west-wall'],
  } as GameState;
}

function leaveLoopState(): GameState {
  const state = createInitialState(undefined, 'pyoa');
  return {
    ...state,
    engineMode: 'pyoa',
    openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
    currentLocation: 'mill landing at Thornferry',
    campaignBibleId: 'thornferry-road',
    turn: 22,
    log: [
      { id: 'a', role: 'player', content: 'Leave through the nearest exit', timestamp: 1 },
      { id: 'b', role: 'gm', content: 'You step off the landing.', timestamp: 2 },
      { id: 'c', role: 'player', content: 'Walk away with consequence', timestamp: 3 },
      { id: 'd', role: 'gm', content: 'The mill stands behind you.', timestamp: 4 },
    ],
    sceneFacts: { ...emptySceneFacts(22), present: [] },
  } as GameState;
}

function firstDepartureState(): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
    currentLocation: 'West Wall',
    campaignBibleId: 'summoned-pact',
    turn: 4,
    log: [{ id: 'a', role: 'gm', content: 'You stand on the West Wall in the rain.', timestamp: 1 }],
    sceneFacts: { ...emptySceneFacts(4), present: ['Wall Sergeant'] },
  } as GameState;
}

function talkRecycleStarvedState(): GameState {
  const base = travelYoYoState();
  return {
    ...base,
    arcDirector: {
      ...(base.arcDirector ?? {}),
      npcTopics: { 'wall-sergeant': ['ask:general', 'press:general'] },
    },
  } as GameState;
}

function assertClosedPad(pads: string[]) {
  expect(pads.length).toBeGreaterThan(0);
  expect(pads.filter((c) => isTravelPad(c)).length).toBe(0);
  expect(pads.filter((c) => isLeaveFamilyPad(c)).length).toBe(0);
}

describe('Batch 02w stamps', () => {
  it('HUD and BUILD are 2026-09-02w and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP.startsWith('2026-09')).toBe(true);
    expect(BUILD_STAMP.startsWith('2026-09')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02w — closed pad universe leftover', () => {
  it('enumerateLegalEdges does not birth travel/leave after West Wall ↔ Lowmarket', () => {
    const state = travelYoYoState();
    expect(excludedPadFamilies(state).has('travel')).toBe(true);
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.kind === 'travel' || isTravelPad(e.label))).toBe(false);
    expect(edges.some((e) => isLeaveFamilyPad(e.label))).toBe(false);
  });

  it('compileChoices does not refill Travel/Leave after starve', () => {
    const state = travelYoYoState();
    const compiled = compileChoices(
      state,
      [
        'Travel toward Lowmarket',
        'Leave through the nearest exit',
        'Walk away with consequence',
        'Talk to Wall Sergeant',
      ],
      undefined,
      'Travel toward West Wall'
    );
    assertClosedPad(compiled.choices);
  });

  it('padChoicesToCount does not re-add Travel when starved', () => {
    const state = travelYoYoState();
    const padded = padChoicesToCount(
      ['Ask about the rain', 'Inspect the battlement'],
      state,
      'The sergeant waits on the battlement.',
      3,
      'Travel toward West Wall'
    );
    assertClosedPad(padded);
  });

  it('empty pad uses scene-grounded fallbacks, never Travel/Leave', () => {
    const state = travelYoYoState();
    const padded = padChoicesToCount([], state, 'The wall looms in the rain.', 3, '');
    assertClosedPad(padded);
  });

  it('talk-recycle interrupt does not unshift Leave/Travel after starve', () => {
    const state = talkRecycleStarvedState();
    const compiled = compileChoices(
      state,
      [
        'Travel toward Lowmarket',
        'Leave through the nearest exit',
        'Walk away with consequence',
        'Press for leverage',
        'Ask a direct question',
      ],
      undefined,
      'Ask Wall Sergeant what they want'
    );
    assertClosedPad(compiled.choices);
  });

  it('PYOA leave-loop does not re-birth Leave/Travel on edges or compile', () => {
    const state = leaveLoopState();
    expect(excludedPadFamilies(state).has('leave')).toBe(true);
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => isLeaveFamilyPad(e.label) || isTravelPad(e.label))).toBe(false);
    const compiled = compileChoices(
      state,
      [
        'Leave through the nearest exit',
        'Walk away with consequence',
        'Accept the ending that follows',
        'Ask a direct question',
      ],
      undefined,
      'Walk away with consequence'
    );
    assertClosedPad(compiled.choices);
  });

  it('first departure from a hub still offers Travel', () => {
    const state = firstDepartureState();
    expect(excludedPadFamilies(state).has('travel')).toBe(false);
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.kind === 'travel' || isTravelPad(e.label))).toBe(true);
  });

  it('outdoorHubTravelChoices returns empty when travel is starved', () => {
    const starved = travelYoYoState();
    expect(excludedPadFamilies(starved).has('travel')).toBe(true);
    expect(outdoorHubTravelChoices(starved, 2)).toEqual([]);

    const first = {
      ...firstDepartureState(),
      discoveredLocations: ['sp-hub-lowmarket', 'sp-hub-west-wall'],
    };
    expect(excludedPadFamilies(first).has('travel')).toBe(false);
    expect(outdoorHubTravelChoices(first, 2).some((c) => isTravelPad(c))).toBe(true);
  });
});
