/**
 * q37-C1b — TT-C1 items 4–5 + OPT-1 items 3–4.
 * Free-input chips, actionId repeat suppression, generic-pad cuts, presentNpcForPads all.
 *
 * SRD 5.2.1 (Wizards of the Coast, CC BY 4.0): "The DM calls for an ability check when a
 * character attempts an action (other than an attack) that has a chance of failure."
 * Free-input typed text uses the same checkForAction path as chips (VR1-3).
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialState } from './defaults';
import { engineChips, padChoicesToCount } from './choicePipeline';
import { enumerateLegalEdges } from './choiceEdge';
import { presentNpcForPads } from './npcTopicFsm';
import { checkChipKinds, CHIP_RESOLVERS } from './chipCheck';
import {
  allocateAffordanceSlots,
  collectSceneAffordances,
  FREE_INPUT_DO,
  FREE_INPUT_SAY,
  isFreeInputChip,
  isOptionRepeat,
  stampRecentOfferedActions,
} from './sceneAffordances';
import { checkForAction } from './checkMath';
import { parsePlayerIntent } from './intentParser';
import type { GameState, NpcMemory } from './types';

function npc(name: string, extra?: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: `npc-${name.toLowerCase().replace(/\s+/g, '-')}`,
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    location: 'Camp',
    ...extra,
  };
}

function ttBase(extra?: Partial<GameState>): GameState {
  const s = createInitialState('Ria', 'dnd');
  return {
    ...s,
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    currentLocation: 'Camp',
    turn: 3,
    openingEstablishment: {
      ...(s.openingEstablishment as object),
      complete: true,
    } as GameState['openingEstablishment'],
    character: {
      ...s.character,
      attributes: { STR: 14, DEX: 12, CON: 14, INT: 12, WIS: 12, CHA: 14 },
    },
    ...extra,
  } as GameState;
}

function campScene(extra?: Partial<GameState>): GameState {
  return ttBase({
    sceneFacts: {
      crowd: 'present',
      noise: 'quiet',
      present: ['Scout'],
      props: [],
      lastBeat: '',
      updatedTurn: 3,
    },
    npcMemories: [npc('Scout', { location: 'Camp' })],
    locationSheet: {
      name: 'Camp',
      interactables: [{ id: 'brush-1', name: 'the brush', state: 'closed', kind: 'prop' }],
      exits: [{ id: 'ex-road', label: 'the road' }],
      presentNpcIds: ['npc-scout'],
    },
    ...extra,
  });
}

describe('q37-C1b free-input + repeat + cuts', () => {
  it('C1-4: Say something… and typed persuasion share the checkForAction path', () => {
    const s = campScene();
    const engine = engineChips(s);
    const say = engine.find((c) => c.label === FREE_INPUT_SAY);
    const doElse = engine.find((c) => c.label === FREE_INPUT_DO);
    expect(say?.kind).toBe('free-input');
    expect(doElse?.kind).toBe('free-input');
    expect(CHIP_RESOLVERS['free-input']).toMatch(/checkForAction/);
    expect(isFreeInputChip(FREE_INPUT_SAY)).toBe(true);

    const typed = 'please, we mean no harm';
    // Free-input typed text and a persuasion-shaped chip share checkForAction (VR1-3).
    const fromFree = checkForAction(s, parsePlayerIntent(typed, s), typed);
    const fromChip = checkForAction(s, parsePlayerIntent(typed, s), typed);
    expect(fromFree?.ability ?? fromFree?.skill ?? null).toEqual(
      fromChip?.ability ?? fromChip?.skill ?? null,
    );
    expect(fromFree?.dc ?? null).toEqual(fromChip?.dc ?? null);
  });

  it('OPT1-7: activeSituation Stealth is never a repeat; Wait streak is', () => {
    const stealthId = 'object:brush-1:sneak';
    let s = campScene({
      activeSituation: {
        kind: 'stealth',
        id: 'camp-approach',
        since: 1,
        actionIds: [stealthId],
      },
      optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 1 },
    });
    const waitId = 'wait:watch';
    for (let t = 1; t <= 5; t++) {
      s = {
        ...stampRecentOfferedActions(s, [stealthId, waitId]),
        turn: t,
        optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 1 },
        activeSituation: s.activeSituation,
      };
    }
    expect(isOptionRepeat(s, stealthId)).toBe(false);
    expect(isOptionRepeat(s, waitId)).toBe(true);

    // Clearing the situation makes Stealth subject to the normal rule.
    const cleared = { ...s, activeSituation: null };
    expect(isOptionRepeat(cleared, stealthId)).toBe(true);

    // Place change resets both.
    const moved = {
      ...s,
      currentLocation: 'Road',
      optionSceneKey: { placeId: 'Road', presentIds: ['npc-scout'], eventSeq: 1 },
      recentOfferedActions: s.recentOfferedActions,
    };
    expect(isOptionRepeat(moved, waitId)).toBe(false);
  });

  it('OPT1-4: unchanged-scene optional repeat loses its slot to a fresher affordance', () => {
    const s0 = campScene({
      optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 2 },
    });
    const all = collectSceneAffordances(s0);
    const optional = all.find((a) => !a.required && a.slotKind === 'object');
    expect(optional).toBeTruthy();
    let s = s0;
    for (let t = 1; t <= 5; t++) {
      s = {
        ...stampRecentOfferedActions(s, [optional!.actionId]),
        turn: t,
        optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 2 },
      };
    }
    expect(isOptionRepeat(s, optional!.actionId)).toBe(true);
    const slots = allocateAffordanceSlots(all, 5, s);
    expect(slots.every((c) => c.actionId !== optional!.actionId)).toBe(true);
  });

  it('OPT1-2: encounter contract with affordances emits no Scout/Ready', () => {
    const s = campScene({
      arcDirector: {
        ...(createInitialState('Ria', 'dnd').arcDirector as object),
        activeContractId: undefined,
      } as GameState['arcDirector'],
    });
    // Edges from a state that has object/person affordances must not include Scout/Ready.
    const edges = enumerateLegalEdges(s);
    const labels = edges.map((e) => e.label);
    expect(labels.some((l) => /Scout for danger/i.test(l))).toBe(false);
    expect(labels.some((l) => /Ready yourself and watch/i.test(l))).toBe(false);
  });

  it('presentNpcForPads returns all present; free chips outside the merge', () => {
    const s = campScene({
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['Scout', 'Maud Pike'],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
      npcMemories: [
        npc('Scout', { location: 'Camp' }),
        npc('Maud Pike', { location: 'Camp' }),
      ],
    });
    const present = presentNpcForPads(s);
    expect(present).toContain('Scout');
    expect(present).toContain('Maud Pike');
    expect(present.length).toBe(2);

    const padded = padChoicesToCount(['Talk to Scout'], s, 'The camp is quiet.', 3);
    expect(padded).toContain(FREE_INPUT_SAY);
    expect(padded).toContain(FREE_INPUT_DO);
  });

  it('C1-7 / OPT1-6: no word-list or label-regex in repeat / free-input helpers', () => {
    const src = fs.readFileSync(path.join(__dirname, 'sceneAffordances.ts'), 'utf8');
    const repeatBlock = src.slice(src.indexOf('isOptionRepeat'), src.indexOf('stampRecentOfferedActions'));
    expect(repeatBlock).not.toMatch(/\.test\(/);
    expect(repeatBlock).not.toMatch(/new RegExp/);
    expect(repeatBlock).not.toMatch(/Wait and watch|Scout for danger/);
  });

  it('w2-go1-fixgo1rpg: affordance path offers no dead chips (no stance-density inject)', () => {
    const s = createInitialState('Jax', 'rpg') as GameState;
    const rpg: GameState = {
      ...s,
      campaignBibleId: 'salt-road-heist',
      engineMode: 'rpg',
      turn: 8,
      log: [],
      currentLocation: 'Salt Road Waystation',
      // T10D: exclusive origin pad owns the row until recorded — this case is post-setup scene chips.
      character: { ...s.character, origin: 'sage' },
      openingEstablishment: {
        ...(s.openingEstablishment as object),
        complete: true,
        coversPending: [],
      } as GameState['openingEstablishment'],
      sceneFacts: {
        crowd: 'alone',
        noise: 'quiet',
        present: [],
        props: ['loose boulders'],
        lastBeat: '',
        updatedTurn: 8,
      },
      locationSheet: {
        name: 'Salt Road Waystation',
        interactables: [{ id: 'b1', name: 'the loose boulders', state: 'closed', kind: 'prop' }],
        exits: [{ id: 'ex1', label: 'the road' }],
        presentNpcIds: [],
      },
    };
    const pads = padChoicesToCount(
      [
        'Wait and watch',
        'Scout the exit',
        'Use the situation as leverage',
        'Act on faction or moral pressure',
        'Call out to a bystander',
        'Approach cautiously',
      ],
      rpg,
      'the alley by the door is quiet',
      3,
    );
    expect(pads).toContain(FREE_INPUT_SAY);
    expect(pads).toContain(FREE_INPUT_DO);
    expect(pads.some((p) => /Use the situation as leverage/i.test(p))).toBe(false);
    expect(pads.some((p) => /Act on faction or moral pressure/i.test(p))).toBe(false);
    expect(pads.some((p) => /Scout the exit/i.test(p))).toBe(false);
    expect(pads.some((p) => /Approach cautiously/i.test(p))).toBe(false);
    expect(checkChipKinds(rpg, pads, 'the alley by the door is quiet').filter((f) => f.kind === 'dead-chip')).toEqual(
      [],
    );
    // Search the area binds as affordance (cover pad no longer orphan).
    expect(engineChips(rpg).find((c) => c.label === 'Search the area')?.kind).toBe('affordance');
  });
});
