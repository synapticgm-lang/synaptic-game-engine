import { describe, expect, it } from 'vitest';
import type { GameState } from './types';
import { extractNamedPlaces, isGenericMapPlace } from './questPlay';
import { INTERIOR_MAP_BLUEPRINT, STREET_MAP_BLUEPRINT, isInteriorPlace, resolveMapScale } from './placeAuthority';
import { buildLocalAreaMap, resolvePlayAreaMap } from './mapEngine';

const CATHEDRAL = 'The Sevenfold Circle under Valespire Cathedral';

const FRAGMENTS = [
  'Save Anyone Yet',
  'Any Physical Object',
  'Our Desperate Struggle Against',
  'Our Desperate War Against',
  'Engulf Our Lands',
  'Home You Look Down',
  'Perpetual Twilight',
];

const SUMMONED_OPENING =
  'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault. Robed figures freeze mid-chant. A blue panel hangs at eye level — private, yours. Nobody hands you a sword. The System has not asked you to save anyone yet. They are losing a grinding war against the Ash Court. In our desperate struggle against the calamity they would engulf our lands. At any physical object, from home you look down, in perpetual twilight.';

function scaleState(location: string, dungeon: GameState['activeDungeon'] = null): GameState {
  return {
    currentLocation: location,
    locationSheet: { name: location, interactables: [], exits: [], presentNpcIds: [] },
    activeDungeon: dungeon,
    quests: [],
  } as GameState;
}

describe('map pin deny — sentence fragments are not places', () => {
  it.each(FRAGMENTS)('rejects %s', (fragment) => {
    expect(isGenericMapPlace(fragment)).toBe(true);
  });

  it('does not harvest fragments from Summoned Pact–style prose', () => {
    const pins = extractNamedPlaces(SUMMONED_OPENING);
    for (const fragment of FRAGMENTS) {
      expect(pins.some((p) => p.toLowerCase() === fragment.toLowerCase())).toBe(false);
    }
    expect(pins.join(' | ')).not.toMatch(/save anyone yet/i);
    expect(pins.join(' | ')).not.toMatch(/physical object/i);
    expect(pins.join(' | ')).not.toMatch(/desperate (?:struggle|war)/i);
  });

  it('still allows a named room when the scene actually names it', () => {
    const pins = extractNamedPlaces('You step into the cathedral vault. You walk to the vestry.');
    expect(pins.some((p) => /vault/i.test(p))).toBe(true);
    expect(pins.some((p) => /vestry/i.test(p))).toBe(true);
  });

  it('rejects atmosphere-clause room titles from hanging-heavy prose', () => {
    const pins = extractNamedPlaces(
      'The air in this chamber hangs heavy, thick with the scent of dust. Approach the doorway to This Chamber Hangs Heavy.'
    );
    expect(pins.some((p) => /hangs heavy/i.test(p))).toBe(false);
    expect(isGenericMapPlace('This Chamber Hangs Heavy')).toBe(true);
  });
});

describe('indoor vs street — cathedral currentLocation', () => {
  it('classifies the Sevenfold Circle as indoor', () => {
    expect(isInteriorPlace(CATHEDRAL)).toBe(true);
    expect(isInteriorPlace('Valespire Cathedral')).toBe(true);
    expect(isInteriorPlace('the court')).toBe(true);
    expect(isInteriorPlace('a cracked city street')).toBe(false);
    expect(isInteriorPlace('Lowmarket')).toBe(false);
  });

  it('resolves mapScale to interior for the cathedral with no dungeon yet', () => {
    expect(resolveMapScale(scaleState(CATHEDRAL))).toBe('interior');
  });

  it('builds an interior floor plan, not the local-streets 1 km grid', () => {
    const map = resolvePlayAreaMap(null, CATHEDRAL, FRAGMENTS);
    expect(map?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    expect(map?.blueprintId).not.toBe(STREET_MAP_BLUEPRINT);
    expect(map?.dungeonName).toMatch(/sevenfold|cathedral/i);
    const names = (map?.nodes ?? []).map((n) => n.name);
    for (const fragment of FRAGMENTS) {
      expect(names).not.toContain(fragment);
    }
  });

  it('converts a wrongly built street grid when the camera is inside the hall', () => {
    const street = buildLocalAreaMap(CATHEDRAL, FRAGMENTS);
    expect(street.blueprintId).toBe(STREET_MAP_BLUEPRINT);
    const fixed = resolvePlayAreaMap(street, CATHEDRAL, FRAGMENTS);
    expect(fixed?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    const names = (fixed?.nodes ?? []).map((n) => n.name);
    for (const fragment of FRAGMENTS) {
      expect(names).not.toContain(fragment);
    }
  });
});
