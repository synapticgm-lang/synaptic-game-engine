/**
 * T10W — origin is its own session-zero step before turn 1: origin chips only while open;
 * scene chips only after; free text never rejected (match → pick; else Quick start + turn-1 action).
 * Modes: Story RPG has the origin step; LitRPG / tabletop / PYOA do not (unchanged).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveOfferedChoices, commitOfferedPad } from './playTranscript';
import { engineChips } from './choicePipeline';
import {
  ORIGIN_QUICK_START_CHIP,
  isOriginOpen,
  originChip,
  originPad,
  quickStartOrigin,
  settleOrigin,
} from './rules/rpgOrigin';
import { applyStoryRpgTurn, stepOriginCreation } from './storyRpgProgress';
import { BACKGROUNDS } from './tabletop/characterBuild';
import { tabletopCreationPending } from './tabletop/creationFlow';
import type { EngineMode, GameState } from './types';

function saltOriginOpen(turn = 0): GameState {
  const state = createInitialState(undefined, 'rpg') as GameState;
  state.campaignBibleId = 'salt-road-heist';
  state.engineMode = 'rpg';
  state.seed = '8003';
  state.turn = turn;
  state.currentLocation = 'Overhang on the Cliff Path';
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
    answers: { ...(state.openingEstablishment?.answers ?? {}), name: 'Jax' },
  };
  state.character = { ...state.character, name: 'Jax', origin: undefined };
  state.activeEncounter = null;
  state.roundCombat = null;
  state.choices = ['Look around', 'Travel toward Harbor Fence', 'Wait'];
  state.sceneFacts = {
    crowd: 'sparse',
    noise: 'quiet',
    present: ['the scout'],
    props: ['loose boulders', 'ledge'],
    lastBeat: 'cliff',
    updatedTurn: turn,
  };
  return state;
}

describe('T10W origin session-zero (Story RPG)', () => {
  it('origin-only offer before pick; no scene chips coexist', () => {
    const open = saltOriginOpen(0);
    expect(isOriginOpen(open)).toBe(true);
    const offered = resolveOfferedChoices(open);
    expect(offered).toEqual([
      ...BACKGROUNDS.map((b) => originChip(b.id)),
      ORIGIN_QUICK_START_CHIP,
    ]);
    expect(offered.some((c) => /travel|look around|wait|greet/i.test(c))).toBe(false);
    expect(engineChips(open).every((c) => /^Origin:/i.test(c.label) || c.label === ORIGIN_QUICK_START_CHIP)).toBe(
      true,
    );

    const committed = commitOfferedPad({ ...open, offeredPad: null });
    expect(committed.offeredPad?.choices).toEqual([
      ...BACKGROUNDS.map((b) => originChip(b.id)),
      ORIGIN_QUICK_START_CHIP,
    ]);
  });

  it('chip pick holds the clock and next offer is scene-only', () => {
    const open = saltOriginOpen(0);
    const turnBefore = open.turn;
    const step = stepOriginCreation(open, 'Origin: Sage');
    expect(step).not.toBeNull();
    expect(step!.holdTurn).toBe(true);
    expect(step!.state.turn).toBe(turnBefore);
    expect(step!.state.character.origin).toBe('sage');
    expect(isOriginOpen(step!.state)).toBe(false);

    const after = resolveOfferedChoices({
      ...step!.state,
      choices: ['Look around', 'Wait and listen', 'Ask what they want'],
      offeredPad: null,
    });
    expect(after.some((c) => /^Origin:/i.test(c) || c === ORIGIN_QUICK_START_CHIP)).toBe(false);
    expect(after.some((c) => /look around|wait|ask/i.test(c))).toBe(true);
  });

  it('typed origin name picks it (creationOnly); turn does not advance via settle', () => {
    const open = saltOriginOpen(0);
    const settled = settleOrigin(open, 'I choose Sage');
    expect(settled.creationOnly).toBe(true);
    expect(settled.continueScene).toBeFalsy();
    expect(settled.state.character.origin).toBe('sage');
    expect(settled.state.turn).toBe(open.turn);

    const viaApply = applyStoryRpgTurn(open, 'Sage');
    expect(viaApply.holdTurn).toBe(true);
    expect(viaApply.state.character.origin).toBe('sage');
    expect(viaApply.state.turn).toBe(open.turn);
  });

  it('arbitrary free text Quick-starts and continues as the scene action (never rejected)', () => {
    const open = saltOriginOpen(0);
    const expected = quickStartOrigin(open);
    const out = applyStoryRpgTurn(open, 'I glance at the scout and shift my weight.');
    expect(out.holdTurn).toBeFalsy();
    expect(out.state.character.origin).toBe(expected);
    expect(out.receipts.some((r) => /^Origin:/i.test(r))).toBe(true);
    // Same free-text path left origin closed so the next pad is scene-only.
    expect(originPad(out.state)).toBeNull();
    expect(stepOriginCreation(open, 'I glance at the scout and shift my weight.')).toBeNull();
  });

  it('Quick start chip is creationOnly (no scene continue)', () => {
    const open = saltOriginOpen(0);
    const step = stepOriginCreation(open, ORIGIN_QUICK_START_CHIP);
    expect(step?.holdTurn).toBe(true);
    expect(step?.state.character.origin).toBe(quickStartOrigin(open));
  });

  it('no state where origin and scene chips coexist after pick or while open', () => {
    const open = saltOriginOpen(3);
    const whileOpen = resolveOfferedChoices(open);
    expect(whileOpen.every((c) => /^Origin:/i.test(c) || c === ORIGIN_QUICK_START_CHIP)).toBe(true);

    const settled = settleOrigin(open, 'Origin: Soldier').state;
    const after = resolveOfferedChoices({
      ...settled,
      choices: ['Travel toward Harbor Fence', 'Look around', 'Origin: Criminal'],
      offeredPad: null,
    });
    expect(after.some((c) => /^Origin:/i.test(c) || c === ORIGIN_QUICK_START_CHIP)).toBe(false);
  });
});

describe('T10W modes without an origin step stay unchanged', () => {
  it.each([
    ['litrpg', 'litrpg'],
    ['dnd', 'dnd'],
    ['pyoa', 'pyoa'],
  ] as const)('%s: originPad null; settleOrigin / stepOriginCreation are no-ops', (label, mode) => {
    void label;
    const s = createInitialState(undefined, mode) as GameState;
    s.engineMode = mode as EngineMode;
    s.openingEstablishment = {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
    };
    s.character = { ...s.character, name: 'Jax', origin: undefined };
    expect(originPad(s)).toBeNull();
    expect(isOriginOpen(s)).toBe(false);
    expect(settleOrigin(s, 'Origin: Sage')).toEqual({ state: s, receipts: [] });
    expect(stepOriginCreation(s, 'Origin: Sage')).toBeNull();
    expect(applyStoryRpgTurn(s, 'Origin: Sage')).toEqual({ state: s, receipts: [] });
  });

  it('tabletop creation remains its own pending path (not rpgOrigin)', () => {
    const s = createInitialState(undefined, 'dnd') as GameState;
    s.engineMode = 'dnd';
    // Without beginTabletopCreation the pending flag is false — origin still closed.
    expect(tabletopCreationPending(s)).toBe(false);
    expect(originPad(s)).toBeNull();
  });
});
