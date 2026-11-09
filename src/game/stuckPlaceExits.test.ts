/**
 * Stuck-player holes from the 9 Nov 2026 offline reproduction on 210e3da1.
 * Port Crescent is an atlas town with no registered exits. Static House seed 8202
 * opens in the kitchen and seals it closed. A starting place must have a way on.
 */
import { describe, expect, it } from 'vitest';
import { WORLD_OUTLINES } from '@/data/worldOutlines';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { hubsForBibleId } from './outdoorHubs';
import { placeNameFromStoryLabel } from './storyDataBoundary';
import { resolvePlace } from './places';
import { ensurePlaceOnMap, placeExits } from './placeRegistry';
import { instantiateWorldAtlas } from './worldAtlas';
import { seedWorldMapPlaces } from './worldMapAuthority';
import type { GameState } from './types';

function openBible(bibleId: string, seed: number): GameState {
  const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === bibleId);
  const mode = bible?.engineMode === 'litrpg' || bible?.engineMode === 'dnd' || bible?.engineMode === 'rpg' || bible?.engineMode === 'pyoa'
    ? bible.engineMode
    : 'rpg';
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: mode === 'litrpg' ? 'cold-system' : 'friendly-guide',
    engineMode: mode,
  });
  return stampOpening(state);
}

describe('stuck starting places keep a way on', () => {
  it('Port Crescent registers neighbor settlements and never itself', () => {
    const outline = WORLD_OUTLINES.find((o) => o.id === 'crescent-isles');
    expect(outline, 'crescent-isles outline').toBeTruthy();
    const opened = openBible('summoned-pact', 42);
    const atlas = instantiateWorldAtlas(outline!);
    const seeded: GameState = {
      ...opened,
      worldAtlas: atlas,
      places: seedWorldMapPlaces(opened.places, atlas),
      currentLocation: 'Port Crescent',
    };
    const registered = ensurePlaceOnMap(seeded, 'Port Crescent');
    const place = resolvePlace(registered.places, 'Port Crescent');
    expect(place?.closed || place?.arcStatus === 'closed', 'Port Crescent stays open').toBeFalsy();
    const exits = placeExits(registered, 'Port Crescent');
    expect(exits, 'a travel option exists').not.toEqual([]);
    expect(exits.map((e) => e.toLowerCase())).not.toContain('port crescent');
    expect(exits).toEqual(expect.arrayContaining(['Ferry Pier', 'Spice Quay']));
  });

  it('Static House seed 8202 kitchen opening is open and has an exit', () => {
    expect(hubsForBibleId('static-house')).toHaveLength(0);
    const opened = openBible('static-house', 8202);
    expect(opened.currentLocation).toMatch(/kitchen/i);
    const place = resolvePlace(opened.places, opened.currentLocation!);
    expect(place, 'kitchen place record').toBeTruthy();
    expect(place?.closed, 'opening is not sealed').not.toBe(true);
    expect(place?.arcStatus).not.toBe('closed');
    const exits = placeExits(opened, opened.currentLocation);
    expect(exits.length, exits.join(', ') || 'no exits').toBeGreaterThan(0);
    expect(exits.map((e) => e.toLowerCase())).not.toContain((opened.currentLocation ?? '').toLowerCase());
  });

  it('every authored Static House starting place has an exit after registration', () => {
    const opened = openBible('static-house', 8202);
    const holes: string[] = [];
    for (const raw of OPENING_HOOK_DECKS['static-house'] ?? []) {
      if (typeof raw === 'string') continue;
      const name = placeNameFromStoryLabel(raw.location);
      if (!name) continue;
      const registered = ensurePlaceOnMap(opened, name, opened.currentLocation);
      const after = resolvePlace(registered.places, name);
      if (after?.closed || after?.arcStatus === 'closed') {
        holes.push(`${name}:closed`);
        continue;
      }
      if (placeExits(registered, name).length === 0) holes.push(`${name}:no-exits`);
    }
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });
});
