/**
 * M5 — offline deterministic persona tests.
 * SRD 5.2.1 Ability Check DC shift −5..+5 from relationship (see socialShift / checkMath).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket } from './completedEventPacket';
import { buildTurnLog, sliceState } from './turnLog';
import { runPlayerCheck } from './checkMath';
import type { PlayerIntent } from './intentParser';
import type { GameState, NpcMemory } from './types';
import {
  ensurePersona,
  nudgePersona,
  personaMannerLine,
  socialShift,
  socialShiftForRel,
  decayPlaceMoods,
  recoverPersonaFloors,
} from './npcPersona';

function person(
  id: string,
  name: string,
  role: string,
  over: Partial<NpcMemory> = {},
): NpcMemory {
  return {
    npcId: id,
    npcName: name,
    disposition: 'neutral',
    facts: [],
    roleHint: role,
    sheet: { job: role, motive: '', fear: '', speech: '', secret: '', place: '' },
    ...over,
  };
}

function withPeople(people: NpcMemory[], place = 'Greyhollow Inn'): GameState {
  const s = createInitialState('Jax', 'dnd');
  return {
    ...s,
    currentLocation: place,
    sceneFacts: { ...(s.sceneFacts ?? {}), present: people.map((p) => p.npcName) },
    npcMemories: people,
    arcDirector: {
      ...(s.arcDirector ?? {}),
      npcRelationships: people.map((p) => ({ npcName: p.npcName, disposition: 'neutral' as const })),
    },
  } as GameState;
}

describe('M5 npcPersona', () => {
  it('same event, two different people → different relationship deltas', () => {
    const state = withPeople([person('a', 'Proud Guard', 'guard'), person('b', 'Warm Host', 'innkeeper')]);
    // Force trait poles so the same insult lands differently (pride vs agreeableness multipliers).
    let a0 = ensurePersona(state, state.npcMemories![0]);
    let b0 = ensurePersona(state, state.npcMemories![1]);
    a0 = {
      ...a0,
      persona: {
        ...a0.persona!,
        traits: { ...a0.persona!.traits, pride: 90, agreeableness: 20, extraversion: 40 },
      },
    };
    b0 = {
      ...b0,
      persona: {
        ...b0.persona!,
        traits: { ...b0.persona!.traits, pride: 20, agreeableness: 90, extraversion: 70 },
      },
    };

    const insultA = nudgePersona(state, a0, 'insulted', 'player insulted them');
    const insultB = nudgePersona(state, b0, 'insulted', 'player insulted them');
    expect(insultA.nudge).toBeTruthy();
    expect(insultB.nudge).toBeTruthy();
    // Pride amplifies negative fondness; agreeableness softens it — results differ.
    expect(insultA.nudge!.after.fondness).toBeLessThan(insultB.nudge!.after.fondness);
    expect(insultA.memory.persona!.history).toHaveLength(1);
    expect(insultA.memory.persona!.history[0].tag).toBe('insulted');
  });

  it('clamps relationship floors and recovers extreme negatives', () => {
    let state = withPeople([person('c', 'Mara', 'merchant')]);
    let m = ensurePersona(state, state.npcMemories![0]);
    // Drive fondness to the floor with repeated insults.
    for (let i = 0; i < 20; i++) {
      const r = nudgePersona(state, m, 'insulted', `insult ${i}`);
      state = r.state;
      m = r.memory;
    }
    expect(m.persona!.rel.fondness).toBeGreaterThanOrEqual(-100);
    expect(m.persona!.rel.trust).toBeGreaterThanOrEqual(-100);
    const recovered = recoverPersonaFloors(m);
    expect(recovered.persona!.rel.fondness).toBeGreaterThan(m.persona!.rel.fondness);
    // Mood decays toward zero.
    state = { ...state, personaMood: { 'Greyhollow Inn': -40 } };
    const decayed = decayPlaceMoods(state);
    expect(Math.abs(decayed.personaMood!['Greyhollow Inn']!)).toBeLessThan(40);
  });

  it('stance manner reaches the FactSheet (replaces old 5-word stance)', () => {
    const mira = person('n1', 'Mira the Apothecary', 'apothecary');
    let state = withPeople([mira]);
    const helped = nudgePersona(state, ensurePersona(state, mira), 'helped', 'Jax helped with herbs');
    state = { ...helped.state, npcMemories: [helped.memory] };
    const packet = buildCompletedEventPacket(state, 'Ask Mira about the herbs', {
      engineResult: 'Check success.',
    });
    expect(packet.factSheet).toBeTruthy();
    const row = packet.factSheet!.present.find((p) => p.name === 'Mira the Apothecary');
    expect(row?.manner).toBeTruthy();
    expect(row!.manner!.length).toBeGreaterThan(5);
    // Not the old single-token stance word alone.
    expect(row!.manner).toMatch(/warm|civil|wary|cold|open|curt|hostile|plain|talk|terse/i);
    expect(row!.mannerCause).toMatch(/helped/i);
    // No engine ids on the sheet.
    expect(JSON.stringify(row)).not.toMatch(/n1|npcId/i);
  });

  it('socialShift stays in −5..+5 and adjusts the SRD Ability Check DC', () => {
    expect(socialShiftForRel({ trust: 100, fondness: 100, fear: 0 })).toBe(-5);
    expect(socialShiftForRel({ trust: -100, fondness: -100, fear: 0 })).toBe(5);
    expect(socialShiftForRel({ trust: 0, fondness: 0, fear: 80 }) || 0).toBe(0);

    const mira = person('n1', 'Mara', 'merchant');
    let state = withPeople([mira]);
    let m = ensurePersona(state, mira);
    for (let i = 0; i < 8; i++) {
      const r = nudgePersona(state, m, 'helped', `help ${i}`);
      state = r.state;
      m = r.memory;
    }
    state = {
      ...state,
      npcMemories: [m],
      arcDirector: {
        ...(state.arcDirector ?? {}),
        npcRelationships: [{ npcName: 'Mara', disposition: 'friendly', trust: m.persona!.rel.trust }],
      },
    } as GameState;
    const shift = socialShift(state, m);
    expect(shift).toBeGreaterThanOrEqual(-5);
    expect(shift).toBeLessThanOrEqual(5);
    expect(shift).toBeLessThan(0); // trusted → easier (lower DC)

    const talk = { kind: 'talk' } as unknown as PlayerIntent;
    const action = 'Persuade Mara to share the rumour';
    const neutralPeople = [person('n1', 'Mara', 'merchant')];
    const neutral = withPeople(neutralPeople);
    // Seed persona on the neutral Mara without relationship history so base DC is known.
    neutral.npcMemories = [ensurePersona(neutral, neutralPeople[0])];
    const base = runPlayerCheck(neutral, talk, action, 12);
    const check = runPlayerCheck(state, talk, action, 12);
    // Relationship DC shift applied on the SRD Ability Check path.
    expect(check.dc).toBe(Math.max(1, base.dc + shift));
    expect(check.dc).not.toBe(base.dc);
  });

  it('records every nudge on the M1 TurnLog', () => {
    const mira = person('n1', 'Mira', 'apothecary');
    let state = withPeople([mira]);
    const r = nudgePersona(state, ensurePersona(state, mira), 'threatened', 'Jax threatened Mira');
    state = { ...r.state, npcMemories: [r.memory], personaNudges: r.nudge ? [r.nudge] : [] };
    const packet = buildCompletedEventPacket(state, 'Threaten Mira', { engineResult: 'ok' });
    const log = buildTurnLog({
      turn: 4,
      input: 'Threaten Mira',
      stateBefore: sliceState(state),
      stateAfter: sliceState(state),
      factSheet: packet.factSheet!,
      nudges: state.personaNudges,
      finalProse: 'Mira flinches.',
      chipsOffered: [],
      latencyMs: 1,
    });
    expect(log.nudges).toHaveLength(1);
    expect(log.nudges![0].tag).toBe('threatened');
    expect(log.nudges![0].npcName).toBe('Mira');
    expect(log.nudges![0].socialShift).toBeGreaterThanOrEqual(-5);
    expect(log.nudges![0].socialShift).toBeLessThanOrEqual(5);
  });

  it('manner line never mentions self-harm or permanent death', () => {
    const m = ensurePersona(
      withPeople([person('x', 'Ash', 'priest')]),
      person('x', 'Ash', 'priest'),
    );
    const { manner } = personaMannerLine(withPeople([m]), m);
    expect(manner.toLowerCase()).not.toMatch(/suicid|kill yourself|end your life|permanent death/);
  });
});
