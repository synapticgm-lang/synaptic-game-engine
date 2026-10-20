/**
 * q45-OCD3 — way-out guarantee: shared isWayOut, moving route on the final pad, checker agrees.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, LogEntry } from './types';
import { commitOfferedPad } from './playTranscript';
import {
  applyOptionCooldown,
  computeOptionSceneKey,
  isWayOut,
  stampRecentOfferedActions,
  wayOutMovesPlayer,
  type OptionCooldownChip,
} from './sceneAffordances';
import { checkChipKinds } from './chipCheck';
import { brokenProse } from './turnCheck';
import { exitPlaceNames } from './placeNames';

function base(mode: 'dnd' | 'litrpg' | 'rpg'): GameState {
  return {
    engineMode: mode,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Trail Camp',
    turn: 5,
    seed: 'ocd3',
    log: [],
    rolls: [],
    places: [
      {
        id: 'camp',
        name: 'Trail Camp',
        cardBuiltTurn: 1,
        exits: ['the road', 'Lowmarket'],
      },
    ],
    locationSheet: {
      name: 'Trail Camp',
      interactables: [],
      exits: [
        { id: 'ex-road', label: 'the road' },
        { id: 'ex-low', label: 'Lowmarket' },
      ],
      presentNpcIds: [],
    },
    sceneFacts: {
      crowd: 'few',
      noise: 'quiet',
      present: ['Scout'],
      props: [],
      lastBeat: '',
      updatedTurn: 1,
      indoor: false,
    },
    openingEstablishment: { complete: true },
  } as unknown as GameState;
}

const FIXTURES = [
  'mega19053-t19',
  'mega19053-t20',
  'mega19053-t23',
  'mega19053-t24',
  'mega19053-t140',
  'mega19053-t251',
  'mega19053-t256',
  'mega19053-t261',
  'mega19052-t100',
  'mega19051-t85',
  'mega19051-t94',
] as const;

describe('q45-OCD3 shared isWayOut', () => {
  it('treats affordance exit actionIds as way-outs (same as kind exit|hub|journey)', () => {
    expect(isWayOut({ kind: 'affordance', actionId: 'exit:exit:Lowmarket:travel', slotKind: 'exit' })).toBe(true);
    expect(isWayOut({ kind: 'exit', actionId: 'exit:ex-road:travel' })).toBe(true);
    expect(isWayOut({ kind: 'hub', actionId: 'label:travel toward lowmarket' })).toBe(true);
    expect(isWayOut({ kind: 'journey', actionId: 'label:walk on' })).toBe(true);
    expect(isWayOut({ kind: 'affordance', actionId: 'person:npc:talk' })).toBe(false);
  });

  it('exits and travel stay exempt from the cooldown', () => {
    const bare = base('litrpg');
    const sk = computeOptionSceneKey(bare);
    const s = {
      ...bare,
      turn: 5,
      recentOfferedActions: [
        {
          turn: 4,
          sceneKey: `${sk.placeId}\0${sk.presentIds.join('\0')}\0${sk.eventSeq}`,
          actionIds: ['exit:ex-road:travel', 'npc:Scout:talk'],
        },
      ],
    } as GameState;
    const pad: OptionCooldownChip[] = [
      { label: 'Talk to Scout', actionId: 'npc:Scout:talk', kind: 'affordance', slotKind: 'person', rank: 80 },
      {
        label: 'Travel toward Lowmarket',
        actionId: 'exit:ex-low:travel',
        kind: 'affordance',
        slotKind: 'exit',
        rank: 70,
      },
      { label: 'Inspect a crate', actionId: 'object:crate-1:inspect', kind: 'affordance', slotKind: 'object', rank: 40 },
    ];
    const cooled = applyOptionCooldown(s, pad);
    expect(cooled.some((c) => isWayOut(c))).toBe(true);
    expect(cooled.some((c) => c.actionId === 'exit:ex-low:travel')).toBe(true);
    expect(cooled.some((c) => c.actionId === 'npc:Scout:talk' && c.cooldownReturn !== true)).toBe(false);
  });
});

describe('q45-OCD3 mega19053 fixtures through final-pad', () => {
  for (const name of FIXTURES) {
    it(`${name}: commitOfferedPad keeps a moving way out when a route exists`, async () => {
      const fix = (await import(`./__fixtures__/${name}.json`)).default as {
        before: GameState;
        offeredPad?: { choices: string[]; chips?: Array<{ label: string; actionId: string; kind: string }> };
      };
      const before = { ...fix.before, offeredPad: null } as GameState;
      const next = commitOfferedPad(before);
      const chips = next.offeredPad?.chips ?? [];
      const labels = next.offeredPad?.choices ?? [];

      const hasRoute =
        (before.locationSheet?.exits?.length ?? 0) > 0 ||
        exitPlaceNames(before).length > 0 ||
        wayOutMovesPlayer(before, 'Walk on');

      if (!hasRoute && (before.currentLocation ?? '').toLowerCase().includes('road between')) {
        // Journey pads: Walk on / Turn back are way-outs by kind journey.
        expect(chips.some(isWayOut)).toBe(true);
        return;
      }

      const way = chips.find((c) => c.slotCategory === 'move' && wayOutMovesPlayer(before, c.label));
      expect(way, `${name} @ ${before.currentLocation}`).toBeTruthy();
      const talkN = chips.filter((c) => c.slotCategory === 'talk').length;
      expect(talkN).toBeLessThanOrEqual(1);
      const nonFree = chips.filter((c) => c.kind !== 'free-input');
      expect(nonFree.length).toBeLessThanOrEqual(5);
      expect(chips.some((c) => isWayOut(c) && !wayOutMovesPlayer(before, c.label))).toBe(false);
      expect(labels.some((l) => l === way!.label)).toBe(true);
      expect(wayOutMovesPlayer(before, way!.label)).toBe(true);

      const flags = checkChipKinds(before, labels);
      expect(
        flags.some((f) => f.detail === 'this place has exits and no exit chip is offered'),
        `${name} checker vs pad`,
      ).toBe(false);
    }, 30000);
  }

  it('T251–T261: Travel toward Cathedral Undercroft is replaced if it does not move', async () => {
    const names = ['mega19053-t251', 'mega19053-t256', 'mega19053-t261'] as const;
    for (const name of names) {
      const fix = (await import(`./__fixtures__/${name}.json`)).default as { before: GameState };
      const before = { ...fix.before, offeredPad: null } as GameState;
      const dead = 'Travel toward Cathedral Undercroft';
      const next = commitOfferedPad(before);
      const labels = next.offeredPad?.choices ?? [];
      const chips = next.offeredPad?.chips ?? [];
      const way = chips.find((c) => isWayOut(c) && wayOutMovesPlayer(before, c.label));
      expect(way, name).toBeTruthy();
      expect(wayOutMovesPlayer(before, way!.label)).toBe(true);
      if (!wayOutMovesPlayer(before, dead)) {
        expect(labels.includes(dead) && !wayOutMovesPlayer(before, dead)).toBe(false);
        // Dead label must not be the only way-out; a moving route must be present.
        expect(way!.label === dead).toBe(false);
      }
    }
  }, 30000);
});

describe('q45b-SLOT one chip per slot', () => {
  it('a crowded pad keeps one moving MOVE and drops dead travel', () => {
    const modes = ['dnd', 'litrpg', 'rpg'] as const;
    for (let m = 0; m < modes.length; m++) {
      const s = base(modes[m]!);
      const pad: OptionCooldownChip[] = [];
      for (let i = 0; i < 12; i++) {
        pad.push({
          label: `Talk ${i}`,
          actionId: `person:npc-${i}:talk`,
          kind: 'affordance',
          slotKind: 'person',
          slotCategory: 'talk',
          rank: 12 - i,
        });
      }
      pad[0] = {
        label: 'Travel toward Nowhere Particular',
        actionId: 'exit:exit:Nowhere Particular:travel',
        kind: 'affordance',
        slotKind: 'exit',
        slotCategory: 'move',
        rank: 99,
      };
      const cooled = applyOptionCooldown(s, pad);
      const way = cooled.find((c) => c.slotCategory === 'move' && wayOutMovesPlayer(s, c.label));
      expect(way, modes[m]).toBeTruthy();
      expect(way!.label).not.toBe('Travel toward Nowhere Particular');
      expect(cooled.filter((c) => c.slotCategory === 'talk').length).toBeLessThanOrEqual(1);
      expect(cooled.filter((c) => c.kind !== 'free-input').length).toBeLessThanOrEqual(5);
    }
  });

  it('6 unchanged turns: ACT rotates, then the least recent returns with cooldownReturn', () => {
    const bare = {
      ...base('litrpg'),
      places: [{ id: 'camp', name: 'Trail Camp', cardBuiltTurn: 1, exits: [] }],
      locationSheet: {
        name: 'Trail Camp',
        interactables: [],
        exits: [],
        presentNpcIds: [],
      },
      sceneFacts: {
        crowd: 'alone',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
        indoor: true,
      },
    } as unknown as GameState;
    const pad: OptionCooldownChip[] = [
      { label: 'Inspect A', actionId: 'object:a:inspect', kind: 'affordance', slotKind: 'object', slotCategory: 'act', rank: 30 },
      { label: 'Inspect B', actionId: 'object:b:inspect', kind: 'affordance', slotKind: 'object', slotCategory: 'act', rank: 20 },
      { label: 'Inspect C', actionId: 'object:c:inspect', kind: 'affordance', slotKind: 'object', slotCategory: 'act', rank: 10 },
    ];
    let s = bare;
    const actSlot: string[] = [];
    const actBack: boolean[] = [];
    for (let t = 1; t <= 6; t++) {
      s = { ...s, turn: t };
      const cooled = applyOptionCooldown(s, pad);
      const acts = cooled.filter((c) => c.slotCategory === 'act');
      expect(acts.length).toBeGreaterThan(0);
      expect(acts.length).toBeLessThanOrEqual(2);
      actSlot.push(acts[0]!.actionId);
      actBack.push(acts[0]!.cooldownReturn === true);
      const ids = cooled.filter((c) => c.kind !== 'free-input').map((c) => c.actionId);
      s = stampRecentOfferedActions(s, ids);
    }
    expect(actSlot[0]).toBe('object:a:inspect');
    expect(actBack[0]).toBe(false);
    expect(actSlot[1]).toBe('object:c:inspect');
    expect(actBack[1]).toBe(false);
    // Turn 3: A was the FREE return on turn 2, so B is the least recent.
    expect(actBack[2]).toBe(true);
    expect(actSlot[2]).toBe('object:b:inspect');
  });

  it('tabletop cooldown 0 still offers a situation chip again', () => {
    const s = base('dnd');
    s.activeSituation = {
      kind: 'fight',
      id: 'f',
      since: 1,
      actionIds: ['fight:foe:wolf:attack'],
    };
    const pad: OptionCooldownChip[] = [
      {
        label: 'Press the attack',
        actionId: 'fight:foe:wolf:attack',
        kind: 'affordance',
        slotKind: 'fight',
        slotCategory: 'scene',
        rank: 100,
      },
    ];
    const sk = computeOptionSceneKey(s);
    const once = applyOptionCooldown({ ...s, turn: 2 }, pad);
    expect(once.some((c) => c.actionId === 'fight:foe:wolf:attack' && c.cooldownReturn !== true)).toBe(true);
    const stamped = stampRecentOfferedActions(
      { ...s, turn: 2 },
      ['fight:foe:wolf:attack'],
    );
    stamped.optionSceneKey = sk;
    const twice = applyOptionCooldown({ ...stamped, turn: 3, activeSituation: s.activeSituation }, pad);
    const hit = twice.find((c) => c.actionId === 'fight:foe:wolf:attack');
    expect(hit).toBeTruthy();
    expect(hit!.cooldownReturn).not.toBe(true);
  });

  it('opening interior with a hub route fills MOVE (lap T4-T5 shape)', () => {
    const start = createInitialState('Ria', 'litrpg');
    const state = {
      ...start,
      campaignBibleId: 'summoned-pact',
      engineMode: 'litrpg' as const,
      currentLocation: 'Trail Camp',
      turn: 4,
      openingEstablishment: { ...(start.openingEstablishment as object), complete: true },
      places: [{ id: 'camp', name: 'Trail Camp', cardBuiltTurn: 1, exits: ['Lowmarket'] }],
      locationSheet: {
        name: 'Trail Camp',
        interactables: [],
        exits: [{ id: 'ex-low', label: 'Lowmarket' }],
        presentNpcIds: [],
      },
      sceneFacts: {
        crowd: 'alone',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
        indoor: true,
      },
    } as unknown as GameState;
    expect(wayOutMovesPlayer(state, 'Travel toward Lowmarket')).toBe(true);
    const next = commitOfferedPad({ ...state, offeredPad: null });
    const chips = next.offeredPad?.chips ?? [];
    const moves = chips.filter((c) => c.slotCategory === 'move');
    expect(moves.length).toBeGreaterThanOrEqual(1);
    expect(wayOutMovesPlayer(state, moves[0]!.label)).toBe(true);
    expect(chips.filter((c) => c.slotCategory === 'talk').length).toBeLessThanOrEqual(1);
    expect(chips.filter((c) => c.kind !== 'free-input').length).toBeLessThanOrEqual(5);
  });
});

describe('q45-OCD3 record describes the pad seen this turn', () => {
  it('commitOfferedPad leaves offeredPad chips matching the choices the player would see', () => {
    const s = base('litrpg');
    const next = commitOfferedPad({
      ...s,
      log: [{ id: 'gm-1', role: 'gm', content: 'The camp holds.', timestamp: 1 } as LogEntry],
    }, 'gm-1');
    const pad = next.offeredPad;
    expect(pad?.choices?.length).toBeGreaterThan(0);
    expect(pad?.chips?.length).toBe(pad?.choices?.length);
    for (let i = 0; i < (pad?.choices?.length ?? 0); i++) {
      expect(pad!.chips![i]!.label).toBe(pad!.choices![i]);
    }
    expect(pad!.chips!.some((c) => isWayOut(c) && wayOutMovesPlayer(s, c.label))).toBe(true);
  });
});

describe('w4d-gocd3-fixg journey meeting stays on the pad', () => {
  it('engine-placed thugs keep Face the thugs as the scene slot when the prose says three rough men', () => {
    const s = {
      ...base('litrpg'),
      currentLocation: 'the lane between Cathedral Close and Contract Hall',
      choices: [
        'Walk on',
        'Face the thugs',
        'Talk your way past the thugs',
        'Turn back toward Cathedral Close',
      ],
      journey: {
        from: 'Cathedral Close',
        to: 'Contract Hall',
        ground: 'lane',
        terrain: 'streets',
        legsTotal: 3,
        legsDone: 1,
        hoursPerLeg: 1,
        startedTurn: 1,
        encounter: { kind: 'thugs', level: 1, stretch: 1, dangerous: false },
      },
      log: [{
        id: 'gm-road',
        role: 'gm',
        turn: 5,
        content: 'Three rough men stepped off a doorstep and spread across the lane.',
        timestamp: 1,
      } as LogEntry],
    } as GameState;
    const next = commitOfferedPad(s, 'gm-road');
    const chips = next.offeredPad?.chips ?? [];
    const face = chips.find((c) => c.label === 'Face the thugs');
    expect(face?.slotCategory).toBe('scene');
    expect(chips.some((c) => c.slotCategory === 'move' && wayOutMovesPlayer(s, c.label))).toBe(true);
    expect(chips.filter((c) => c.kind !== 'free-input').length).toBeLessThanOrEqual(5);
  });
});

describe('w4d-gocd3-fixgocd3litrpg object pronoun is not a stacked determiner', () => {
  it('seed 20331 T10 "read her the way" is grammatical; a real stack still flags', () => {
    const line =
      'Jax looked at Nell Rudd and read her the way they would read a locked door before touching it. Nell let them look, hands loose at her sides, and did not once turn her eyes away.';
    expect(brokenProse(line, 'Jax').some((f) => f.detail.includes('stacked determiners'))).toBe(false);
    expect(brokenProse('They lifted their your hands.', 'Jax').some((f) => f.detail.includes('stacked determiners'))).toBe(true);
    expect(brokenProse('He opened the the door.', 'Jax').some((f) => f.detail.includes('stacked determiners'))).toBe(true);
  });
});
