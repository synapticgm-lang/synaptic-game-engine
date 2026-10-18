/**
 * q49-MAP — every place the player can be in is on the world map with exits.
 * Opening + writer places register through upsertPlaceFromSheet / ensurePlaceCard / atlas.
 * MOVE fills from sheet/edge/place-name; no ranker/story-chip MOVE special case.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { findSettlement } from './worldMapAuthority';
import { resolvePlace } from './places';
import { placeCardFor, registerPlayablePlace } from './outdoorHubs';
import { commitOfferedPad } from './playTranscript';
import { wayOutMovesPlayer } from './sceneAffordances';
import { checkRegisteredPlace } from './turnCheck';
import type { GameState } from './types';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'map');

function loadFix(name: string): { before: GameState; turn: number } {
  return JSON.parse(readFileSync(join(FIX, name), 'utf8')) as { before: GameState; turn: number };
}

describe('q49-MAP seed 19054 opening registers HERE and fills MOVE', () => {
  it('summoned-pact LitRPG seed 19054 opening place has card, exits, atlas; T2 MOVE moves the player', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 19054,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const opened = stampOpening(state);
    const here = (opened.currentLocation ?? '').trim();
    expect(here.length).toBeGreaterThan(3);
    const place = resolvePlace(opened.places, here);
    expect(place, `place card for ${here}`).toBeTruthy();
    expect((place!.exits?.length ?? 0) > 0 || (placeCardFor(opened, here)?.exits?.length ?? 0) > 0).toBe(true);
    expect(findSettlement(opened.worldAtlas, here) || findSettlement(opened.worldAtlas, place!.name)).toBeTruthy();

    const t2 = loadFix('mega19054-t2.json');
    const registered = registerPlayablePlace({ ...t2.before, offeredPad: null } as GameState);
    const next = commitOfferedPad(registered);
    const chips = next.offeredPad?.chips ?? [];
    const move = chips.find((c) => c.slotCategory === 'move' && wayOutMovesPlayer(registered, c.label));
    expect(move, `MOVE on T2 @ ${registered.currentLocation}`).toBeTruthy();
    expect(wayOutMovesPlayer(registered, move!.label)).toBe(true);
  });

  it('writer-introduced place registers with exits through the same path', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 19054,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const opened = stampOpening(state);
    const writerPlace = 'a side lane off the west wall';
    const next = registerPlayablePlace(
      { ...opened, currentLocation: writerPlace },
      writerPlace,
      opened.currentLocation
    );
    const place = resolvePlace(next.places, writerPlace);
    expect(place).toBeTruthy();
    expect((place!.exits?.length ?? 0)).toBeGreaterThan(0);
    expect(findSettlement(next.worldAtlas, writerPlace)).toBeTruthy();
    expect(checkRegisteredPlace(next)).toEqual([]);
  });

  it('unregistered location is a P0; existing hubs and dungeon rooms stay clear', () => {
    const t1 = loadFix('mega19054-t1.json');
    const bare = {
      ...t1.before,
      places: (t1.before.places ?? []).filter(
        (p) => !/ruined empty circle/i.test(p.name)
      ),
      worldAtlas: t1.before.worldAtlas
        ? {
            ...t1.before.worldAtlas,
            settlements: (t1.before.worldAtlas.settlements ?? []).filter(
              (s) => !/ruined empty circle/i.test(s.name)
            ),
          }
        : t1.before.worldAtlas,
      locationSheet: null,
    } as GameState;
    const flags = checkRegisteredPlace(bare);
    expect(flags.some((f) => f.kind === 'unregistered-place')).toBe(true);

    const hub = {
      ...t1.before,
      currentLocation: 'West Wall',
      places: t1.before.places,
    } as GameState;
    const withCard = registerPlayablePlace(hub, 'West Wall');
    expect(checkRegisteredPlace(withCard).every((f) => f.kind !== 'unregistered-place')).toBe(true);

    const dungeonRoom = {
      ...withCard,
      currentLocation: 'Cathedral Undercroft — Stair Descent',
      activeDungeon: {
        blueprintId: 'cathedral-undercroft',
        dungeonName: 'Cathedral Undercroft — Stair Descent',
        currentNodeId: 'n1',
        nodes: [{ id: 'n1', name: 'Stair Descent' }],
      },
    } as GameState;
    expect(checkRegisteredPlace(dungeonRoom)).toEqual([]);
  });

  it('tabletop opening also registers HERE with exits (mode-agnostic)', () => {
    const { state } = buildNewGameState({
      bibleId: 'cursed-keep',
      characterName: 'Ada',
      seed: 19054,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = stampOpening(state);
    const here = (opened.currentLocation ?? '').trim();
    expect(resolvePlace(opened.places, here) || placeCardFor(opened, here)).toBeTruthy();
    const card = placeCardFor(opened, here);
    expect((card?.exits?.length ?? 0) > 0 || (resolvePlace(opened.places, here)?.exits?.length ?? 0) > 0).toBe(
      true
    );
  });
});
