/**
 * FOURSLOT — unit rules per situation (fight / town / wilds / interior / social /
 * after death / journey / quest-less). Free text chips stay; dead chips stay out.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  assembleFourSlotPads,
  classifyFourSlot,
  fourSlotEngineLabels,
  isFourSlotLegal,
  isFourSlotRepeat,
  pickFromFourSlots,
  shouldSkipFourSlot,
} from './fourSlotPads';
import { FREE_INPUT_DO, FREE_INPUT_SAY, isFreeInputChip } from './sceneAffordances';
import { OUTDOOR_REST_CHIP, isHurtHp } from './rules/wildlifeConfig';
import { ORIGIN_QUICK_START_CHIP } from './rules/rpgOrigin';
import type { GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'inkbound-academy',
    turn: 12,
    currentLocation: 'Living Ink Atelier',
    character: {
      ...s.character!,
      name: 'Jax',
      level: 2,
      hp: 20,
      maxHp: 31,
    },
    sceneFacts: { ...emptySceneFacts(12), indoor: false, present: ['Professor Lin'] },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

function assertFour(state: GameState, pads: string[]) {
  const engine = fourSlotEngineLabels(pads);
  expect(engine, pads.join(' | ')).toHaveLength(4);
  expect(new Set(engine.map((c) => c.toLowerCase())).size).toBe(4);
  for (const c of engine) {
    expect(isFourSlotLegal(state, c), `illegal: ${c}`).toBe(true);
  }
  expect(pads.some((c) => isFreeInputChip(c))).toBe(true);
}

describe('FOURSLOT unit slots', () => {
  it('wilds / quest-less: four distinct legal slots + free text', () => {
    const state = base({
      quests: [],
      sceneFacts: { ...emptySceneFacts(12), indoor: false, present: [] },
    });
    const pads = assembleFourSlotPads(state, [
      'Search the atelier for signs',
      'Open the bronze reward box',
      'Travel toward Living Ink Atelier',
      'Look around',
      'Wait',
    ]);
    assertFour(state, pads);
    expect(pads.some((c) => /travel toward living ink atelier/i.test(c))).toBe(false);
  });

  it('social: Talk only when the NPC is present; absent Answer is dropped', () => {
    const present = base({
      sceneFacts: { ...emptySceneFacts(12), indoor: true, present: ['Mara'] },
    });
    const pads = assembleFourSlotPads(present, [
      'Talk to Mara',
      'Answer the leaving courier',
      'Look around',
      'Wait',
    ]);
    assertFour(present, pads);
    expect(pads.some((c) => /answer the leaving courier/i.test(c))).toBe(false);
    expect(pads.some((c) => /talk to mara/i.test(c))).toBe(true);

    const empty = base({
      sceneFacts: { ...emptySceneFacts(12), indoor: true, present: [] },
    });
    expect(isFourSlotLegal(empty, 'Talk to Mara')).toBe(false);
  });

  it('fight: strongest attack / defend / class trick / flee', () => {
    const state = base({
      activeEncounter: { name: 'Gull Swarm', hp: 8, maxHp: 8, level: 2 } as any,
      sceneFacts: { ...emptySceneFacts(12), indoor: false, present: ['Gull Swarm'] },
    });
    const pads = assembleFourSlotPads(state, [
      'Press the attack',
      'Defend',
      'Use something',
      'Try to flee',
      'Search the beach',
    ]);
    assertFour(state, pads);
    const engine = fourSlotEngineLabels(pads);
    expect(classifyFourSlot(state, engine[0]!)).toBe('push');
    expect(engine.some((c) => /flee|disengage|withdraw/i.test(c))).toBe(true);
  });

  it('town: next lead / talk / shop-or-own / rest-or-travel', () => {
    const state = base({
      currentLocation: 'Quill Dormitory',
      sceneFacts: { ...emptySceneFacts(12), indoor: true, present: ['Mara'] },
    });
    const pads = assembleFourSlotPads(state, [
      'Talk to Mara',
      'Browse the nearest stall',
      'Travel toward Living Ink Atelier',
      'Search the dorm',
    ]);
    assertFour(state, pads);
  });

  it('interior closed-room stall: still four valid distinct slots', () => {
    const state = base({
      currentLocation: 'Sealed Vault',
      sceneFacts: { ...emptySceneFacts(12), indoor: true, present: [] },
    });
    const pads = assembleFourSlotPads(state, [
      'Search Sealed Vault for signs',
      'Open the silver reward box',
      'Look around',
      'Wait',
    ]);
    assertFour(state, pads);
  });

  it('after a death: no Attack with no creature; Rest when hurt', () => {
    const state = base({
      character: {
        ...base().character!,
        hp: 9,
        maxHp: 31,
      },
      sceneFacts: {
        ...emptySceneFacts(12),
        indoor: false,
        present: [],
        lastKill: { name: 'Gull Swarm', turn: 11, outcome: 'kill', remains: 'corpse' } as any,
      },
      activeEncounter: undefined,
    });
    expect(isHurtHp(9, 31)).toBe(true);
    expect(isFourSlotLegal(state, 'Attack')).toBe(false);
    const pads = assembleFourSlotPads(state, [
      'Attack',
      'Hunt the wildlife nearby',
      'Travel toward Quill Dormitory',
      OUTDOOR_REST_CHIP,
    ]);
    assertFour(state, pads);
    expect(pads.some((c) => isFourSlotLegal(state, c) && /rest/i.test(c))).toBe(true);
  });

  it('journey underway: four-slot owns the road pad (Walk on kept; Rest when hurt)', () => {
    // FOURSLOT2 — journey is no longer exclusive; hurt Rest must land on road pads.
    const state = base({
      character: { ...base().character!, hp: 9, maxHp: 31 },
      journey: {
        from: 'Living Ink Atelier',
        to: 'Quill Dormitory',
        legsDone: 1,
        legsTotal: 3,
        hoursPerLeg: 2,
        terrain: 'road',
        ground: 'road',
        encounter: null,
        quietStretches: 0,
      } as GameState['journey'],
      currentLocation: 'On the road between Living Ink Atelier and Quill Dormitory',
      sceneFacts: { ...emptySceneFacts(12), indoor: false, present: [] },
    });
    expect(shouldSkipFourSlot(state)).toBe(false);
    const raw = ['Walk on', 'Turn back toward Living Ink Atelier', 'Hunt the wildlife nearby'];
    const pads = assembleFourSlotPads(state, raw);
    assertFour(state, pads);
    expect(pads).toContain('Walk on');
    expect(pads.some((c) => /rest|make camp/i.test(c))).toBe(true);
  });

  it('no repeat same family+target+state as previous turn', () => {
    const state = base();
    expect(
      isFourSlotRepeat(state, 'Search the atelier for signs', 'Search the atelier for signs')
    ).toBe(true);
    const pads = assembleFourSlotPads(
      state,
      ['Search the atelier for signs', 'Look around', 'Wait', 'Talk to Professor Lin'],
      { previousPlayerAction: 'Search the atelier for signs' }
    );
    assertFour(state, pads);
    expect(pads.filter((c) => /^search\b/i.test(c))).toHaveLength(0);
  });

  it('origin exclusive pad is skipped (no four-slot mix)', () => {
    const state = base({
      engineMode: 'rpg',
      campaignBibleId: 'cape-district-vigil',
      character: { ...base().character!, origin: undefined },
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
    });
    expect(shouldSkipFourSlot(state)).toBe(true);
    const originish = [ORIGIN_QUICK_START_CHIP, 'Origin: Sage', 'Origin: Soldier'];
    const pads = assembleFourSlotPads(state, originish);
    expect(pads).toEqual(originish);
  });

  it('free text chips always present; free text is never a rejected slot', () => {
    const state = base();
    const pads = assembleFourSlotPads(state, ['Look around']);
    expect(pads).toContain(FREE_INPUT_SAY);
    expect(pads).toContain(FREE_INPUT_DO);
  });

  it('autoplay pickFromFourSlots rests when HP ≤ 50% and no fight', () => {
    const state = base({
      character: { ...base().character!, hp: 9, maxHp: 31 },
    });
    const offered = [
      'Hunt the wildlife nearby',
      'Talk to Professor Lin',
      'Check System',
      OUTDOOR_REST_CHIP,
      FREE_INPUT_SAY,
    ];
    const pick = pickFromFourSlots(state, offered, () => 0.99);
    expect(/rest/i.test(pick)).toBe(true);
  });
});
