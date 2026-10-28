/**
 * T10D — Story RPG origin chips exclusive until recorded; Follow-up chips use the person's
 * own bound want and only for people present (seed 1027/1029 evidence).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveOfferedChoices } from './playTranscript';
import { originChip, ORIGIN_QUICK_START_CHIP, settleOrigin } from './rules/rpgOrigin';
import { BACKGROUNDS } from './tabletop/characterBuild';
import {
  collectOpenThreads,
  forwardThreadAffordance,
  npcChipWant,
} from './openThreads';
import { collectSceneAffordances } from './sceneAffordances';
import type { GameState, NpcMemory } from './types';

function rpgOpen(): GameState {
  const state = createInitialState(undefined, 'rpg') as GameState;
  state.campaignBibleId = 'salt-road-heist';
  state.engineMode = 'rpg';
  state.seed = '1029';
  state.turn = 5;
  state.currentLocation = 'back streets between Salt Road Waystation and Consul Caravan Camp';
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
  };
  state.character = { ...state.character, name: 'Jax', origin: undefined };
  state.activeEncounter = null;
  state.roundCombat = null;
  state.choices = ['Walk on', 'Travel toward Consul Caravan Camp', 'Greet whoever is coming'];
  return state;
}

function memory(partial: Partial<NpcMemory> & Pick<NpcMemory, 'npcName'>): NpcMemory {
  return {
    npcId: partial.npcId ?? `npc:${partial.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...partial,
  } as NpcMemory;
}

describe('T10D origin + follow-up chips', () => {
  it('origin chips own the pad until recorded; never beside travel/scene chips', () => {
    const open = rpgOpen();
    expect(open.character.origin).toBeUndefined();
    const offered = resolveOfferedChoices(open);
    expect(offered).toEqual([
      ...BACKGROUNDS.map((b) => originChip(b.id)),
      ORIGIN_QUICK_START_CHIP,
    ]);
    expect(offered.some((c) => /travel|walk on|greet/i.test(c))).toBe(false);

    const settled = settleOrigin(open, 'Origin: Sage');
    expect(settled.state.character.origin).toBe('sage');
    const after = resolveOfferedChoices({
      ...settled.state,
      choices: ['Look around', 'Wait and listen', 'Ask what they want'],
      offeredPad: null,
    });
    // Answered state is read: Origin chips are gone and scene chips can take the slots.
    expect(after.some((c) => /^Origin:/i.test(c) || c === ORIGIN_QUICK_START_CHIP)).toBe(false);
    expect(after.length).toBeGreaterThan(0);
    expect(after.some((c) => /look around|wait|ask/i.test(c))).toBe(true);
  });

  it('Follow up / Ask-about use the person bound want, not role-template need; absent people get no chip', () => {
    const priest = memory({
      npcName: 'Father Aldous',
      npcId: 'npc:Father Aldous',
      location: 'Greyhollow Graveyard',
      present: true,
      goal: { motivation: 'Knowledge', target: 'the town to sleep easy again' },
      need: 'a buyer who pays',
      roleHint: 'informant',
    });
    const hunter = memory({
      npcName: 'Greta the Hunter',
      npcId: 'npc:Greta the Hunter',
      location: 'Livestock Pens',
      present: false,
      goal: { motivation: 'Knowledge', target: 'what is getting at the livestock' },
      need: 'a buyer who pays',
      roleHint: 'informant',
    });
    expect(npcChipWant(priest)).toBe('the town to sleep easy again');
    expect(npcChipWant(priest)).not.toBe('a buyer who pays');

    let state: GameState = {
      ...(createInitialState(undefined, 'dnd') as GameState),
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      turn: 8,
      currentLocation: 'Greyhollow Graveyard',
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
      },
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Father Aldous'],
        props: [],
        lastBeat: '',
        updatedTurn: 8,
      },
      npcMemories: [priest, hunter],
      openThreads: undefined,
      sceneThreadPlan: undefined,
    };

    const threads = collectOpenThreads(state);
    const aldousThread = threads.find((t) => t.kind === 'npc-goal' && t.label.includes('Father Aldous'));
    expect(aldousThread?.label).toBe('Father Aldous: the town to sleep easy again');
    expect(aldousThread?.label).not.toMatch(/buyer who pays/);

    state = {
      ...state,
      openThreads: threads.map((t) =>
        t.kind === 'npc-goal' && t.label.startsWith('Father Aldous')
          ? { ...t, lastSeenTurn: 0 }
          : t,
      ),
      sceneThreadPlan: {
        plannedTurn: state.turn ?? 8,
        forwardIds: ['npc-goal:npc:Father Aldous'],
      },
    };
    const presentChip = forwardThreadAffordance(state);
    expect(presentChip?.label).toBe('Follow up with Father Aldous: the town to sleep easy again');
    expect(presentChip?.label).not.toMatch(/buyer who pays/);

    const absentPlan: GameState = {
      ...state,
      sceneThreadPlan: {
        plannedTurn: state.turn ?? 8,
        forwardIds: ['npc-goal:npc:Greta the Hunter'],
      },
    };
    expect(forwardThreadAffordance(absentPlan)).toBeNull();

    const asks = collectSceneAffordances(state)
      .map((a) => a.label)
      .filter((l) => /Father Aldous|Greta/.test(l));
    expect(asks.some((l) => /Ask Father Aldous about the town to sleep easy again/.test(l))).toBe(true);
    expect(asks.some((l) => /buyer who pays/.test(l))).toBe(false);
    expect(asks.some((l) => /Greta/.test(l))).toBe(false);
  });
});
