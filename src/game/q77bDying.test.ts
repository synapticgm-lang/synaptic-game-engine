/**
 * q77b-DYINGTYPED — death saves every dying turn (incl. outside roundCombat),
 * typed free-text outcomes, dying-stall invariant.
 * SRD 5.2.1 Death Saving Throws (Wizards of the Coast, CC BY 4.0):
 * "Whenever you start your turn with 0 Hit Points, you must make a Special Death Saving Throw…
 * Roll a d20. If the roll is 10 or higher, you succeed. Otherwise, you fail.
 * A success or failure has no effect by itself… On your third success, you become Stable…
 * On your third failure, you die. A Natural 1 counts as two failures. A Natural 20…
 * you regain 1 Hit Point."
 */
import { describe, expect, it, afterEach } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { resolveEngineFight } from './engineFight';
import { resolveDeathSaveTurn, isDying } from './tabletop/roundFight';
import { resolveTypedFreeText } from './typedFreeText';
import { checkTurnInvariants } from './invariants/turnInvariants';
import { pinDice } from './seededRng';
import { applyPlayPhaseAfterHp } from './playPhase';
import { runArcDirectorBeforeGm } from './arcDirector';

function dying(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 40,
    seed: 'q77b-dying',
    currentLocation: 'On the road between places',
    character: {
      ...s.character,
      name: 'Jax',
      hp: 0,
      maxHp: 12,
      conditions: ['Unconscious'],
      heroicInspiration: false,
      srd: {
        ...(s.character.srd ?? {}),
        classId: 'fighter',
        skillProfs: s.character.srd?.skillProfs ?? [],
        expertise: s.character.srd?.expertise ?? [],
      } as GameState['character']['srd'],
    },
    deathSaves: { successes: 0, failures: 0 },
    roundCombat: null,
    activeEncounter: null,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: ['Wenna Brack'],
      props: [],
      crowd: 'none',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 40,
    },
    ...over,
  } as GameState;
}

describe('q77b-DYINGTYPED', () => {
  afterEach(() => pinDice(() => Math.random()));

  it('saves advance outside round combat (no activeEncounter / roundCombat)', () => {
    pinDice(() => 0.5);
    const s = dying();
    expect(s.roundCombat).toBeNull();
    expect(s.activeEncounter).toBeNull();
    const r = resolveEngineFight(s, 'Look around');
    expect(r).toBeTruthy();
    expect(r!.receipts.some((x) => x.startsWith('Death save:'))).toBe(true);
    expect(isDying(r!.state)).toBe(true);
    const ds = r!.state.deathSaves!;
    expect(ds.successes + ds.failures).toBeGreaterThan(0);
  });

  it('3 failures = dead and playPhase ended', () => {
    pinDice(() => 0);
    const s = dying({ deathSaves: { successes: 0, failures: 2 } });
    const r = resolveDeathSaveTurn(s, () => 0, 'Fight for breath')!;
    expect(r.state.deathSaves?.dead).toBe(true);
    const ended = applyPlayPhaseAfterHp(r.state, 0, 41);
    expect(ended.playPhase).toBe('ended');
  });

  it('3 successes = stable', () => {
    pinDice(() => 0.55);
    const s = dying({ deathSaves: { successes: 2, failures: 0 } });
    const r = resolveDeathSaveTurn(s, () => 0.55, 'Fight for breath')!;
    expect(r.facts).toMatch(/stable/i);
    expect(r.state.deathSaves ?? null).toBeNull();
    expect(r.state.character.hp).toBe(1);
  });

  it('nat 20 regains 1 HP', () => {
    const s = dying({ deathSaves: { successes: 0, failures: 1 } });
    const r = resolveDeathSaveTurn(s, () => 0.999, 'Fight for breath')!;
    expect(r.state.character.hp).toBe(1);
    expect(r.state.deathSaves ?? null).toBeNull();
  });

  it('typed input while dying is a death-save turn (arc director, no move)', () => {
    pinDice(() => 0.5);
    const s = dying();
    const arc = runArcDirectorBeforeGm(s, 'blorple the dorplok');
    expect(arc.systemReceipts.some((x) => x.startsWith('Death save:'))).toBe(true);
    expect(arc.state.currentLocation).toBe(s.currentLocation);
    expect(isDying(arc.state) || arc.state.deathSaves?.dead || (arc.state.character.hp ?? 0) > 0).toBe(true);
  });

  it('typed free text: speech records an engine speech event; nonsense is refused', () => {
    const s = dying({ character: { ...dying().character, hp: 12, conditions: [] }, deathSaves: null });
    const speech = resolveTypedFreeText(s, 'I say to Wenna Brack: what do you want?');
    expect(speech.engineResult).toMatch(/Speech event:.*Wenna Brack/i);
    expect(speech.receipts.some((r) => r.startsWith('Speech:'))).toBe(true);
    const nonsense = resolveTypedFreeText(s, 'xyzzy');
    expect(nonsense.engineResult).toMatch(/Refused:/i);
  });

  it('dying-stall invariant fires when saves do not change', () => {
    const before = dying();
    const after = { ...before, turn: 41, deathSaves: { successes: 0, failures: 0 } };
    const v = checkTurnInvariants(before, after, {
      offeredOptions: [{ label: 'Fight for breath', kind: 'dying' }],
      playerInput: 'Fight for breath',
      typed: false,
      prose: 'Nothing moved.',
    });
    expect(v.some((x) => x.code === 'dying-stall')).toBe(true);
  });

  it('dying-stall passes when a save advances', () => {
    const before = dying();
    const after = { ...before, turn: 41, deathSaves: { successes: 1, failures: 0 } };
    const v = checkTurnInvariants(before, after, {
      offeredOptions: [{ label: 'Fight for breath', kind: 'dying' }],
      playerInput: 'Fight for breath',
      typed: false,
      prose: 'You cling to life.',
    });
    expect(v.filter((x) => x.code === 'dying-stall')).toEqual([]);
  });
});
