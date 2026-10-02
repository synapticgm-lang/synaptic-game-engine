import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyGovernanceToProse,
  filterGovernanceChoices,
  processMetaInput,
  buildGovernanceSnapshotLines,
} from './qualityGovernance';
import { formatSceneSnapshotForPrompt } from './situationPacket';

describe('playtest27w — P0+P1 quality governance', () => {
  it('keeps them as written when one NPC is present (29c: pronouns are never rewritten)', () => {
    const state = createInitialState();
    state.sceneFacts = {
      props: [],
      present: ['Registrar Mira'],
      crowd: 'present',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 1,
    };
    const { prose } = applyGovernanceToProse(
      state,
      'You watch them shuffle papers without a word.'
    );
    expect(prose).toBe('You watch them shuffle papers without a word.');
  });

  it('rejects Check the stranger when alone', () => {
    const state = createInitialState();
    state.openingEstablishment = { pending: [], answers: {}, complete: true, aloneArrival: true };
    state.sceneFacts = {
      props: [],
      present: [],
      crowd: 'none',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 1,
    };
    const { choices } = filterGovernanceChoices(state, [
      'Check the stranger',
      'Inspect the cracked wall',
      'Wait and listen',
    ]);
    expect(choices.some((c) => /stranger/i.test(c))).toBe(false);
    expect(choices.length).toBeGreaterThan(0);
  });

  it('stores meta recovery mandate for invalid options complaint', () => {
    const state = createInitialState();
    const { state: patched, handled } = processMetaInput(
      state,
      'None of these options do not make sense for where I am.'
    );
    expect(handled).toBe(true);
    expect(patched.qualityGovernance?.recoveryMandate).toMatch(/META COMPLAINT/i);
  });

  it('includes governance mandates in scene snapshot', () => {
    const state = createInitialState();
    state.turn = 12;
    state.qualityGovernance = {
      recoveryMandate: 'TEST RECOVERY MANDATE',
    };
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/TEST RECOVERY MANDATE/);
    const lines = buildGovernanceSnapshotLines(state);
    expect(lines.some((l) => l.includes('TEST RECOVERY MANDATE'))).toBe(true);
  });
});
