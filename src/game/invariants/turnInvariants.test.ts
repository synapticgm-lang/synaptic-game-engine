/**
 * q76a-INVARIANTS — pass + fail fixture per invariant.
 * Shapes: 20632 T9 (mid-fight travel), mega9 T52-54 (absent speaker / ledger),
 * L6 T19 (typed refusal answered), L6 T36-39 (dying options / label tags).
 * No OpenRouter. Vitest only (MIT).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../defaults';
import { initEncounterTerminal } from '../encounterTerminalFsm';
import type { GameState } from '../types';
import type { CheckSpec } from '../checkMath';
import { checkTurnInvariants, type TurnInvariantInput } from './turnInvariants';
import { travelPadBlocked } from '../padUniverse';
import { isDying } from '../tabletop/roundFight';

function base(over: Partial<GameState> = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 9,
    seed: 'q76a-invariants',
    character: { ...s0.character, name: 'Jax', hp: 20, maxHp: 20 },
    openingEstablishment: {
      ...(s0.openingEstablishment ?? {}),
      complete: true,
      pending: [],
      answers: {},
    },
    sceneFacts: {
      ...(s0.sceneFacts ?? {}),
      present: [],
      props: [],
      crowd: 'none',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 9,
    },
    ...over,
  } as GameState;
}

function fightState(over: Partial<GameState> = {}): GameState {
  const s0 = base();
  const enc = initEncounterTerminal(
    {
      name: 'the thugs',
      level: 1,
      hp: 20,
      maxHp: 20,
      armorClass: 12,
      strength: 12,
      dexterity: 10,
      constitution: 12,
      xpReward: 10,
      goldReward: 0,
    },
    s0,
  );
  return {
    ...s0,
    currentLocation: 'On the road between places',
    activeEncounter: enc,
    ...over,
  } as GameState;
}

function dyingState(over: Partial<GameState> = {}): GameState {
  return base({
    turn: 36,
    character: {
      ...base().character,
      name: 'Jax',
      hp: 0,
      maxHp: 12,
      conditions: ['Unconscious'],
      srd: {
        ...(base().character.srd ?? {}),
        classId: 'fighter',
        skillProfs: [],
        expertise: [],
      } as GameState['character']['srd'],
    },
    deathSaves: { successes: 0, failures: 0 },
    currentLocation: 'On the road between places',
    ...over,
  });
}

function turn(partial: Partial<TurnInvariantInput> = {}): TurnInvariantInput {
  return {
    offeredOptions: [],
    playerInput: '',
    typed: false,
    prose: 'Dust hung in the lane.',
    ...partial,
  };
}

describe('q76a invariant (1) travel-blocked — 20632 T9', () => {
  it('pass: no travel offered or honoured while travelPadBlocked', () => {
    const before = fightState();
    expect(travelPadBlocked(before)).toBe(true);
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: ['Attack the thugs', 'Take cover behind the cart'],
      playerInput: 'Attack the thugs',
      prose: 'Jax struck at the thugs.',
    }));
    expect(v.filter((x) => x.code === 'travel-blocked')).toEqual([]);
  });

  it('fail: Travel toward offered while fight blocks travel', () => {
    const before = fightState();
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: ['Attack the thugs', 'Travel toward Greyhollow Inn'],
      playerInput: 'Attack the thugs',
    }));
    expect(v.some((x) => x.code === 'travel-blocked' && /Travel toward/i.test(x.detail))).toBe(true);
  });
});

describe('q76a invariant (2) dying-options — L6 T36-39', () => {
  it('pass: only dying chips while isDying', () => {
    const before = dyingState();
    expect(isDying(before)).toBe(true);
    const after = { ...before, turn: 37 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [
        { label: 'Fight for breath', kind: 'dying' },
      ],
      playerInput: 'Fight for breath',
      prose: 'Jax fought for breath on the road.',
    }));
    expect(v.filter((x) => x.code === 'dying-options')).toEqual([]);
  });

  it('fail: travel chip while dying', () => {
    const before = dyingState();
    const after = { ...before, turn: 37 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [
        { label: 'Fight for breath', kind: 'dying' },
        { label: 'Travel toward Greyhollow Inn', kind: 'exit' },
      ],
      playerInput: 'Fight for breath',
    }));
    expect(v.some((x) => x.code === 'dying-options')).toBe(true);
  });
});

describe('q76a invariant (3) typed-unanswered — L6 T19', () => {
  it('pass: refused typed line has a visible refusal body', () => {
    const before = base({ engineMode: 'litrpg', turn: 19 });
    const after = { ...before, turn: 20 };
    const v = checkTurnInvariants(before, after, turn({
      typed: true,
      playerInput: 'I pry it open with my crowbar',
      visibleAnswer: "You don't have: crowbar",
      prose: "You don't have: crowbar",
    }));
    expect(v.filter((x) => x.code === 'typed-unanswered')).toEqual([]);
  });

  it('fail: typed line with no visible answer', () => {
    const before = base({ turn: 19 });
    const after = { ...before, turn: 20 };
    const v = checkTurnInvariants(before, after, turn({
      typed: true,
      playerInput: 'I pick up the book with the palace seal',
      prose: '',
      answered: false,
      visibleAnswer: '',
    }));
    expect(v.some((x) => x.code === 'typed-unanswered')).toBe(true);
  });
});

describe('q76a invariant (4) absent-speaker — mega9 T52-54', () => {
  it('pass: speaker is in peopleHere / present record', () => {
    const before = base({
      turn: 52,
      sceneFacts: {
        present: ['Rook'],
        props: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 52,
      },
      npcMemories: [{
        npcId: 'person:rook',
        npcName: 'Rook',
        disposition: 'friendly',
        facts: [],
        lastSeenTurn: 51,
        present: true,
        location: base().currentLocation,
      }],
    });
    const after = { ...before, turn: 53 };
    const v = checkTurnInvariants(before, after, turn({
      speakers: ['Rook'],
      prose: 'Rook said, "Hold."',
    }));
    expect(v.filter((x) => x.code === 'absent-speaker')).toEqual([]);
  });

  it('fail: speaker not engine-present', () => {
    const before = base({
      turn: 52,
      sceneFacts: {
        present: [],
        props: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 52,
      },
    });
    const after = { ...before, turn: 53 };
    const v = checkTurnInvariants(before, after, turn({
      speakers: ['Mira Voss'],
      prose: 'Mira Voss said, "Wait."',
    }));
    expect(v.some((x) => x.code === 'absent-speaker' && /Mira Voss/.test(x.detail))).toBe(true);
  });
});

describe('q76a invariant (5) label-outcome — structure vs CheckSpec', () => {
  const check: CheckSpec = {
    kind: 'skill',
    ability: 'CHA',
    skill: 'persuasion',
    dc: 15,
    dcShown: false,
    adv: 'normal',
  };

  it('pass: plain action label with CheckSpec on the record', () => {
    const before = base();
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [{ label: 'Talk the guard down', check }],
    }));
    expect(v.filter((x) => x.code === 'label-outcome')).toEqual([]);
  });

  it('fail: label embeds CheckSpec tag text', () => {
    const before = base();
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [{
        label: 'Talk the guard down - Charisma (Persuasion) roll',
        check,
      }],
    }));
    expect(v.some((x) => x.code === 'label-outcome')).toBe(true);
  });
});

describe('q76a invariant (6) system-ledger — mega9 T52-54 / wrong-voice', () => {
  it('pass: tabletop prose without ledger terms', () => {
    const before = base({ turn: 54 });
    const after = { ...before, turn: 55 };
    const v = checkTurnInvariants(before, after, turn({
      prose: 'The thugs staggered back into the ditch.',
    }));
    expect(v.filter((x) => x.code === 'system-ledger')).toEqual([]);
  });

  it('fail: HP ledger term in tabletop prose', () => {
    const before = base({ turn: 54 });
    const after = { ...before, turn: 55 };
    const v = checkTurnInvariants(before, after, turn({
      prose: 'Jax lost 4 HP from the blow.',
    }));
    expect(v.some((x) => x.code === 'system-ledger')).toBe(true);
  });
});
