/**
 * FORDCAMP — registered places must never trap the player with zero exits.
 * Hubless worlds (Millstone Road Ford Camp) use the story-place / spine-pin graph.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { spinesForBible } from '@/data/quests/litrpgMainSpines';
import { spinesForTabletopBible } from '@/data/quests/tabletopMainSpines';
import { spinesForStoryRpgBible } from '@/data/quests/storyRpgMainSpines';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { hubsForBibleId } from './outdoorHubs';
import { resolvePlace } from './places';
import { ensurePlaceOnMap, placeExits } from './placeRegistry';
import { checkRegisteredPlace } from './turnCheck';
import type { GameState } from './types';

function modeFor(bible: { engineMode?: string }): GameState['engineMode'] {
  const m = bible.engineMode;
  if (m === 'litrpg' || m === 'dnd' || m === 'rpg' || m === 'pyoa') return m;
  return 'dnd';
}

function personalityFor(mode: GameState['engineMode']): string {
  if (mode === 'litrpg') return 'cold-system';
  if (mode === 'dnd') return 'chilled-gm';
  return 'friendly-guide';
}

function openBible(bibleId: string, seed = 8100): GameState {
  const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === bibleId);
  const mode = modeFor(bible ?? {});
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: personalityFor(mode),
    engineMode: mode,
  });
  return stampOpening(state);
}

function spineMapPins(bibleId: string): string[] {
  const pins = [
    ...spinesForBible(bibleId),
    ...spinesForTabletopBible(bibleId),
    ...spinesForStoryRpgBible(bibleId),
  ].map((s) => (s.mapPin ?? '').trim()).filter((p) => p.length >= 3);
  return Array.from(new Set(pins));
}

describe('FORDCAMP registered places always have a way on', () => {
  it('every premade bible: opening HERE and every registered open place has exits; spine mapPins link', () => {
    const holes: string[] = [];
    let worlds = 0;
    let placesChecked = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.id.startsWith('blank-canvas')) continue;
      worlds += 1;
      let opened: GameState;
      try {
        opened = openBible(bible.id);
      } catch (err) {
        holes.push(`${bible.id}:open-failed:${(err as Error).message ?? err}`);
        continue;
      }
      const here = (opened.currentLocation ?? '').trim();
      if (here) {
        placesChecked += 1;
        const exits = placeExits(opened, here);
        if (exits.length === 0 && checkRegisteredPlace(opened).some((f) => f.kind === 'no-registered-place')) {
          holes.push(`${bible.id}:${here}:opening-HERE-no-exits`);
        }
      }
      for (const p of opened.places ?? []) {
        if (p.closed || p.arcStatus === 'closed') continue;
        // Atlas settlement rows without exits are not playable HERE until ensurePlaceOnMap.
        if (p.settlementKind && p.settlementKind !== 'story-place' && (p.exits == null || p.cardBuiltTurn == null)) {
          continue;
        }
        placesChecked += 1;
        const registered = ensurePlaceOnMap(opened, p.name, opened.currentLocation);
        const after = resolvePlace(registered.places, p.name);
        if (after?.closed || after?.arcStatus === 'closed') continue;
        const exits = placeExits(registered, p.name);
        if (exits.length === 0) {
          holes.push(`${bible.id}:${p.id || p.name}:registered-no-exits`);
        }
      }
      for (const pin of spineMapPins(bible.id)) {
        placesChecked += 1;
        const linked = ensurePlaceOnMap(opened, pin, opened.currentLocation);
        const after = resolvePlace(linked.places, pin);
        if (after?.closed || after?.arcStatus === 'closed') continue;
        const exits = placeExits(linked, pin);
        if (exits.length === 0) {
          holes.push(`${bible.id}:${pin}:spine-mapPin-no-exits`);
        }
      }
    }
    expect(worlds, 'expected premade worlds to check').toBeGreaterThan(10);
    expect(placesChecked, 'expected places checked').toBeGreaterThan(20);
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });

  it('Millstone Road seed 8100 Ford Camp: exact registration path never leaves zero exits', () => {
    expect(hubsForBibleId('millstone-road')).toHaveLength(0);
    const opened = openBible('millstone-road', 8100);
    expect(opened.currentLocation).toBe('Ford Camp');
    const place = resolvePlace(opened.places, 'Ford Camp');
    expect(place, 'Ford Camp place record').toBeTruthy();
    expect(placeExits(opened, 'Ford Camp').length).toBeGreaterThan(0);
    expect(checkRegisteredPlace(opened)).toEqual([]);

    // Snapshot-shaped hole from train-run 00: empty exits + cardBuiltTurn heals via ensurePlaceOnMap
    // (the one registration owner) — placeExitRows keeps the built-card contract until then.
    const broken: GameState = {
      ...opened,
      places: (opened.places ?? []).map((p) =>
        p.name === 'Ford Camp' ? { ...p, exits: [], cardBuiltTurn: 0, parentHub: undefined } : p
      ),
    };
    expect(placeExits(broken, 'Ford Camp')).toEqual([]);
    const healed = ensurePlaceOnMap(broken, 'Ford Camp', 'Millstone Ford');
    const healedPlace = resolvePlace(healed.places, 'Ford Camp');
    expect((healedPlace?.exits ?? []).length).toBeGreaterThan(0);
    expect(placeExits(healed, 'Ford Camp')).toContain('Millstone Ford');
    expect(checkRegisteredPlace(healed)).toEqual([]);
  });
});
