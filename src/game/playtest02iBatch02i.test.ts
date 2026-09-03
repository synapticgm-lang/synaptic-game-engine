/**
 * Batch 02i — closed pad universe (Lock A only).
 * Starve at enumeration: choiceEdge / legalEdges / padChoicesToCount
 * must not re-birth Travel / Leave after treadmill.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './choiceEdge';
import { padChoicesToCount } from './choicePipeline';
import { excludedPadFamilies, isLeaveFamilyPad, isTravelPad } from './padUniverse';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

function travelYoYoState(): GameState {
  let state = createInitialState(undefined, 'litrpg');
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
  } as GameState;
}

function leaveLoopState(): GameState {
  let state = createInitialState(undefined, 'pyoa');
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

function stubEncounter() {
  return {
    name: 'Pact-Hunter Skirmisher',
    level: 1,
    hp: 16,
    maxHp: 16,
    armorClass: 12,
    strength: 12,
    dexterity: 12,
    constitution: 12,
    xpReward: 30,
    goldReward: 5,
  };
}

function assertClosedPad(pads: string[]) {
  expect(pads.length).toBeGreaterThan(0);
  expect(pads.filter((c) => isTravelPad(c)).length).toBe(0);
  expect(pads.filter((c) => isLeaveFamilyPad(c)).length).toBe(0);
}

describe('Batch 02i stamps', () => {
  it('HUD and BUILD are 2026-09-02i and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02i').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02i').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02i — closed pad universe', () => {
  it('starves travel: legalEdges do not add Leave/Travel', () => {
    const state = travelYoYoState();
    expect(excludedPadFamilies(state).has('travel')).toBe(true);
    expect(excludedPadFamilies(state).has('leave')).toBe(true);
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.kind === 'travel' || isTravelPad(e.label))).toBe(false);
    expect(edges.some((e) => isLeaveFamilyPad(e.label))).toBe(false);
  });

  it('compile + padChoicesToCount stay closed after West Wall ↔ Lowmarket', () => {
    const state = travelYoYoState();
    const compiled = compileChoices(
      state,
      [
        'Travel toward Lowmarket',
        'Leave through the nearest exit',
        'Walk away with consequence',
        'Talk to Wall Sergeant',
        'Ask a direct question',
      ],
      undefined,
      'Travel toward West Wall'
    );
    assertClosedPad(compiled.choices);
    expect(compiled.choices.some((c) => /sergeant|ask|stake|inspect|talk/i.test(c))).toBe(true);

    const padded = padChoicesToCount(
      compiled.choices,
      state,
      'The sergeant waits on the battlement.',
      3,
      'Travel toward West Wall'
    );
    assertClosedPad(padded);
  });

  it('empty-pad fallback is non-travel after starve', () => {
    const state = travelYoYoState();
    const compiled = compileChoices(
      state,
      ['Travel toward Lowmarket', 'Leave through the nearest exit', 'Walk away with consequence'],
      undefined,
      'Travel toward West Wall'
    );
    assertClosedPad(compiled.choices);

    const padded = padChoicesToCount(
      ['Travel toward Lowmarket', 'Travel toward West Wall', 'Leave through the nearest exit'],
      state,
      'Rain on the wall. The sergeant watches.',
      3,
      'Travel toward West Wall'
    );
    assertClosedPad(padded);
  });

  it('leave-loop: legalEdges and pad do not re-birth Leave/Travel', () => {
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

    const padded = padChoicesToCount(
      compiled.choices,
      state,
      'The mill stands behind you in the rain.',
      3,
      'Walk away with consequence'
    );
    assertClosedPad(padded);
  });

  it('combat still gets fight pads while travel is excluded', () => {
    const state = {
      ...travelYoYoState(),
      activeEncounter: stubEncounter(),
    } as GameState;
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => /Press the attack/i.test(e.label))).toBe(true);
    expect(edges.some((e) => isTravelPad(e.label) || isLeaveFamilyPad(e.label))).toBe(false);

    const compiled = compileChoices(
      state,
      ['Travel toward Lowmarket', 'Leave through the nearest exit', 'Inspect the wall'],
      undefined,
      'Travel toward West Wall'
    );
    expect(compiled.choices.length).toBeGreaterThan(0);
    expect(compiled.choices.some((c) => /press the attack|flee|parley/i.test(c))).toBe(true);
    expect(compiled.choices.some((c) => isTravelPad(c) || isLeaveFamilyPad(c))).toBe(false);
  });
});
