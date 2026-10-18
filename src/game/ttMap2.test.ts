/**
 * q50-MAP2 — one source of truth for exits: place record via ensurePlaceOnMap / placeExits.
 * Opening + structured writer newPlaces register; prose alone does not. No atlas / discovered write.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { resolvePlace } from './places';
import {
  applyWriterNewPlaces,
  ensurePlaceOnMap,
  newPlacesFromWriterPayload,
  placeExits,
} from './placeRegistry';
import { commitOfferedPad } from './playTranscript';
import { wayOutMovesPlayer } from './sceneAffordances';
import { checkRegisteredPlace } from './turnCheck';
import type { GameState } from './types';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'map2');

function loadFix(name: string): { before: GameState; turn: number } {
  return JSON.parse(readFileSync(join(FIX, name), 'utf8')) as { before: GameState; turn: number };
}

describe('q50-MAP2 seed 19054 opening registers HERE and fills MOVE', () => {
  it('(a)(b) summoned-pact LitRPG seed 19054: place record with exits; T2 MOVE moves; atlas/discovered unchanged', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 19054,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const atlasBefore = state.worldAtlas?.settlements?.length ?? 0;
    const discoveredBefore = [...(state.discoveredLocations ?? [])];
    const opened = stampOpening(state);
    const here = (opened.currentLocation ?? '').trim();
    expect(here.length).toBeGreaterThan(3);
    const place = resolvePlace(opened.places, here);
    expect(place, `place record for ${here}`).toBeTruthy();
    expect(placeExits(opened, here).length).toBeGreaterThan(0);
    expect(opened.worldAtlas?.settlements?.length ?? 0).toBe(atlasBefore);
    expect(opened.discoveredLocations ?? []).toEqual(discoveredBefore);

    const t2 = loadFix('mega19054-t2.json');
    const registered = ensurePlaceOnMap(
      { ...t2.before, offeredPad: null } as GameState,
      t2.before.currentLocation
    );
    const next = commitOfferedPad(registered);
    const chips = next.offeredPad?.chips ?? [];
    const move = chips.find((c) => c.slotCategory === 'move' && wayOutMovesPlayer(registered, c.label));
    expect(move, `MOVE on T2 @ ${registered.currentLocation}`).toBeTruthy();
    expect(wayOutMovesPlayer(registered, move!.label)).toBe(true);
  });

  it('(c) ensurePlaceOnMap on an existing place returns the same state (toBe)', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 19054,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const opened = stampOpening(state);
    expect(ensurePlaceOnMap(opened, opened.currentLocation)).toBe(opened);
  });

  it('(d) writer newPlaces registers with validated exits; prose-only name registers nothing', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 19054,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const opened = stampOpening(state);
    const writerPlace = 'a side lane off Lowmarket';
    const withPlaces = applyWriterNewPlaces(opened, [
      { name: writerPlace, kind: 'street', exitsTo: ['Lowmarket', 'West Wall'] },
    ]);
    const place = resolvePlace(withPlaces.places, writerPlace);
    expect(place).toBeTruthy();
    expect(placeExits(withPlaces, writerPlace).length).toBeGreaterThan(0);
    expect(placeExits(withPlaces, writerPlace)).toContain('Lowmarket');

    const proseOnly = applyWriterNewPlaces(
      opened,
      newPlacesFromWriterPayload(`Jax walked into ${writerPlace} and smelled brine.`)
    );
    expect(resolvePlace(proseOnly.places, writerPlace)).toBeNull();
    expect(proseOnly.places?.length ?? 0).toBe(opened.places?.length ?? 0);
  });

  it('(e) unregistered currentLocation gives turnCheck no-registered-place', () => {
    const t1 = loadFix('mega19054-t1.json');
    const bare = {
      ...t1.before,
      places: (t1.before.places ?? []).filter((p) => !/ruined empty circle/i.test(p.name)),
      locationSheet: null,
    } as GameState;
    const flags = checkRegisteredPlace(bare);
    expect(flags.some((f) => f.kind === 'no-registered-place')).toBe(true);
  });

  it('(f) a closed record keeps no way out', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 19054,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const opened = stampOpening(state);
    const cell = 'a barred holding cell';
    const closed = applyWriterNewPlaces(opened, [{ name: cell, kind: 'closed', exitsTo: ['West Wall'] }]);
    expect(placeExits(closed, cell)).toEqual([]);
    expect(checkRegisteredPlace({ ...closed, currentLocation: cell } as GameState)).toEqual([]);
    const receiptWays = placeExits(closed, cell);
    expect(receiptWays.length).toBe(0);
  });
});
