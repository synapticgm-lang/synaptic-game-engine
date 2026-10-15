/**
 * Order RC-K1 — only bound chips reach the offered list.
 * Acceptance: docs/orders/acceptance-tests-new-orders.md § RC-K1.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  boundEngineChip,
  engineChips,
  engineChipActionKey,
  isLegalEnginePad,
} from './choicePipeline';
import { filterInventedContextChoices } from './choiceWarden';
import { resolveOfferedChoices } from './playTranscript';
import { THORNFERRY_SPINE } from './pyoaSpine';
import type { GameState, LogEntry } from './types';

function litrpgHub(): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.currentLocation = 'Lowmarket';
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
  };
  state.sceneFacts = {
    crowd: 'present',
    noise: 'voices',
    present: ['Lowmarket Fence'],
    props: ['stall', 'awning'],
    lastBeat: 'fence signals',
    updatedTurn: 4,
    indoor: false,
  };
  state.turn = 4;
  const story = 'Stalls, scales, and Earth junk under awnings. A fence watches the alley.';
  state.log = [
    { id: 'g1', turn: 4, role: 'gm', content: story, timestamp: 1 },
  ] as LogEntry[];
  return state;
}

describe('RC-K1 only bound chips', () => {
  it('K1-a: lap-28 unbound writer labels are not offered', () => {
    const state = litrpgHub();
    const story = state.log[0]!.content;
    const unbound = [
      'Map the first undercroft door',
      'Lean on the forged line',
      'Rob the traveler',
      'Face the honest seal',
    ];
    for (const label of unbound) {
      expect(isLegalEnginePad(label, state, story)).toBe(false);
      expect(boundEngineChip(label, state, story)).toBeNull();
    }
    expect(filterInventedContextChoices(unbound, state)).toEqual([]);
    state.choices = [...unbound, 'Look around', 'Wait and watch'];
    const offered = resolveOfferedChoices(state);
    for (const label of unbound) {
      expect(offered).not.toContain(label);
    }
  });

  it('K1-b: writer wording that binds to a builder action+target is offered', () => {
    const state = litrpgHub();
    const story = state.log[0]!.content;
    const chips = engineChips(state, story);
    const waitBuilder = chips.find((c) => engineChipActionKey(c.label).startsWith('INTENT_WAIT'));
    expect(waitBuilder).toBeTruthy();
    // Same action + empty target as the builder Wait pad; writer wording is what the player sees.
    const writer = 'Wait quietly';
    expect(engineChipActionKey(writer)).toBe(waitBuilder!.action);
    const bound = boundEngineChip(writer, state, story);
    expect(bound).not.toBeNull();
    expect(bound!.action).toBe(waitBuilder!.action);
    state.choices = [writer, 'Inspect the crystals breaking the street'];
    const filtered = filterInventedContextChoices(state.choices, state);
    expect(filtered).toContain(writer);
    expect(filtered).not.toContain('Inspect the crystals breaking the street');
  });

  it('K1-c: isLegalEnginePad has no inferIntent-alone path', () => {
    expect(isLegalEnginePad('Inspect the area')).toBe(false);
    expect(isLegalEnginePad('Wait quietly and listen')).toBe(false);
    expect(isLegalEnginePad('Travel toward The Weighing Cup')).toBe(false);
    expect(isLegalEnginePad('Check Status')).toBe(false);
    const state = litrpgHub();
    expect(isLegalEnginePad('Inspect the area', state, state.log[0]!.content)).toBe(false);
  });

  it('K1-d: every PYOA spine step carries an action', () => {
    expect(THORNFERRY_SPINE.length).toBeGreaterThan(0);
    let steps = 0;
    for (const node of THORNFERRY_SPINE) {
      for (const exit of node.exits) {
        steps += 1;
        expect(exit.action, `${node.id}/${exit.id}`).toBeTruthy();
        expect(exit.action.startsWith('pyoa:') || exit.action.length > 0).toBe(true);
      }
    }
    expect(steps).toBeGreaterThan(0);
  });
});
