/**
 * q45-OCD3 — way-out guarantee: shared isWayOut, moving route on the final pad, checker agrees.
 */
import { describe, expect, it } from 'vitest';
import type { GameState, LogEntry } from './types';
import { commitOfferedPad } from './playTranscript';
import {
  applyOptionCooldown,
  computeOptionSceneKey,
  isWayOut,
  wayOutMovesPlayer,
  WAY_OUT_PAD_CAP,
  type OptionCooldownChip,
} from './sceneAffordances';
import { checkChipKinds } from './chipCheck';
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

      const way = chips.find((c) => isWayOut(c) && wayOutMovesPlayer(before, c.label));
      expect(way, `${name} @ ${before.currentLocation}`).toBeTruthy();
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

describe('q45-OCD3 cooled-then-truncated pad still keeps a moving way out', () => {
  it('tabletop, litrpg and rpg', () => {
    const modes = ['dnd', 'litrpg', 'rpg'] as const;
    for (let m = 0; m < modes.length; m++) {
      const s = base(modes[m]!);
      const pad: OptionCooldownChip[] = [];
      for (let i = 0; i < WAY_OUT_PAD_CAP; i++) {
        pad.push({
          label: `Talk ${i}`,
          actionId: `person:npc-${i}:talk`,
          kind: 'affordance',
          slotKind: 'person',
          rank: WAY_OUT_PAD_CAP - i,
        });
      }
      // Seed a dead way-out that looks like travel but will be replaced if it does not move.
      pad[0] = {
        label: 'Travel toward Cathedral Undercroft',
        actionId: 'exit:exit:Cathedral Undercroft:travel',
        kind: 'affordance',
        slotKind: 'exit',
        rank: 99,
      };
      const cooled = applyOptionCooldown(s, pad);
      const way = cooled.find((c) => isWayOut(c) && wayOutMovesPlayer(s, c.label));
      expect(way, modes[m]).toBeTruthy();
      expect(wayOutMovesPlayer(s, way!.label)).toBe(true);
      expect(cooled.length).toBeLessThanOrEqual(WAY_OUT_PAD_CAP);
    }
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
