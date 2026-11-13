import { describe, expect, it } from 'vitest';
import { interiorFloorName, listInteriorZLevels, resolvePlayAreaMap } from './mapEngine';
import { placeVessel, stampPlaceVessel, vesselInSetting } from './vesselPlace';
import type { GameState, PlaceRecord } from './types';

const PAGE1 =
  'The lamps in Yarrowholt Circle threw a low orange wash across the plank walls, and beyond them the hull timbers of the Valespire grain-ship creaked against the harbor swell.';

function johnState(over: Partial<GameState> = {}): GameState {
  const place: PlaceRecord = { id: 'p-yarrow', name: 'Yarrowholt Circle' };
  return {
    seed: 'john-seed',
    currentLocation: 'Yarrowholt Circle',
    places: [place],
    openingEstablishment: {
      instance: {
        placeName: 'Yarrowholt Circle',
        placeKind: 'summoning circle',
        situation: 'A chalk circle scrawled on the planks below decks of a grain ship riding at anchor.',
        cast: [],
        offerChips: [],
        alone: false,
        retiredNames: [],
      },
    },
    ...over,
  } as unknown as GameState;
}

describe('aboard a ship with no ship word in the place name (John, Yarrowholt Circle)', () => {
  it('the opening setting establishes the vessel, and the map draws ship decks', () => {
    const s = johnState();
    const vessel = placeVessel(s, 'Yarrowholt Circle');
    expect(vessel).toBe('veh-boat-cargo');
    const map = resolvePlayAreaMap(null, 'Yarrowholt Circle', [], undefined, s.seed, { vessel })!;
    expect(listInteriorZLevels(map).map((z) => interiorFloorName(map, z))).toEqual(['Hold', 'Lower deck', 'Main deck']);
    expect(map.nodes.find((n) => n.id === map.currentNodeId)?.name).toBe('Main deck');
  });

  it('scene prose alone (no opening facts) establishes it, then it is sticky on the place record', () => {
    const s = johnState({ openingEstablishment: undefined });
    expect(placeVessel(s, 'Yarrowholt Circle')).toBeUndefined();
    const v = placeVessel(s, 'Yarrowholt Circle', PAGE1);
    expect(v).toBe('veh-boat-cargo');
    const stamped = stampPlaceVessel(s, 'Yarrowholt Circle', v);
    expect(stamped.places![0]!.vessel).toBe('veh-boat-cargo');
    // Later turns with no ship talk keep the ship.
    expect(placeVessel(stamped, 'Yarrowholt Circle', 'Brannoc waits by the circle.')).toBe('veh-boat-cargo');
  });

  it('a drawn ship map stays a ship on revisits, and an old hall plan is redrawn once as the ship', () => {
    const hall = resolvePlayAreaMap(null, 'Yarrowholt Circle', [], undefined, 'john-seed')!;
    expect(hall.nodes.some((n) => n.name === 'Narthex' || (n.tags ?? []).includes('entry'))).toBe(true);
    expect(hall.nodes.some((n) => (n.tags ?? []).some((t) => t.startsWith('deck:')))).toBe(false);
    const ship = resolvePlayAreaMap(hall, 'Yarrowholt Circle', [], undefined, 'john-seed', { vessel: 'veh-boat-cargo' })!;
    expect(interiorFloorName(ship, 0)).toBe('Main deck');
    const again = resolvePlayAreaMap(ship, 'Yarrowholt Circle', [], undefined, 'john-seed')!;
    expect(again.nodes.map((n) => n.id)).toEqual(ship.nodes.map((n) => n.id));
    expect(interiorFloorName(again, -2)).toBe('Hold');
  });

  it('a harbour view of ships does not make a tavern a ship', () => {
    expect(vesselInSetting('From the tavern window you watch a ship ease into the harbour.')).toBeUndefined();
    expect(vesselInSetting('You stand on deck of the sloop as it heels.')).toBe('veh-ship-sloop');
  });
});
