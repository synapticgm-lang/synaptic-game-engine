import { describe, expect, it } from 'vitest';
import {
  applySearchContinuityToFacts,
  groundedWeaponNames,
  isSearchTargetEmpty,
  recordEmptySearch,
  scrubInventedEmptySearchLoot,
  scrubInventedWeapons,
} from './searchContinuity';
import { applyProseWarden } from './proseWarden';
import type { GameState, SceneFacts } from './types';

function baseFacts(over: Partial<SceneFacts> = {}): SceneFacts {
  return {
    crowd: 'none',
    noise: 'quiet',
    present: [],
    props: ['blue panel'],
    lastBeat: 'alone in husk',
    updatedTurn: 8,
    ...over,
  };
}

describe('playtest26p search continuity + dagger ground', () => {
  it('records empty search and keeps re-search of same target empty', () => {
    const after = applySearchContinuityToFacts(
      baseFacts(),
      'Search the ruin again. Inside and out — move the dirt and ash',
      'Digging deeper proves fruitless; the ruin has been picked clean. No immediate treasures.',
      8,
      'Burnt husk'
    );
    expect(after?.searchedEmpty?.length).toBeGreaterThan(0);
    expect(isSearchTargetEmpty(after, 'here') || isSearchTargetEmpty(after, 'debris')).toBe(true);

    const invent = scrubInventedEmptySearchLoot(
      'You dig again and find a crude dagger under the ash.',
      after!.searchedEmpty ?? [],
      'Search the ruin carefully again'
    );
    expect(invent.toLowerCase()).not.toMatch(/dagger/);
    expect(invent.toLowerCase()).toMatch(/empty|ash|splintered|nothing/);
  });

  it('rejects invented dagger when kit has only clothes + sealed bag', () => {
    const state = {
      inventory: [
        { id: '1', name: 'The clothes you had on when the light took you', equipped: true },
        { id: '2', name: 'Bag', description: 'sealed' },
      ],
      sceneFacts: baseFacts(),
      locationSheet: undefined,
      containers: [],
    } as Pick<GameState, 'inventory' | 'sceneFacts' | 'locationSheet' | 'containers'>;

    expect(groundedWeaponNames(state)).toEqual([]);

    const raw =
      "Jax's crude dagger flashed, a silver blur that punched through the Ravager Hatchling. With a roar, Jax spun, the dagger plunging deep again.";
    const cleaned = scrubInventedWeapons(raw, groundedWeaponNames(state), 'bare hands', 'Jax');
    expect(cleaned.toLowerCase()).not.toMatch(/dagger/);
    expect(cleaned.toLowerCase()).toMatch(/fist|bare hands|strike/);
  });

  it('keeps a grounded knife when inventory declares it', () => {
    const allowed = ['pocket knife'];
    const raw = "Jax's pocket knife flashed in the ash-light.";
    const cleaned = scrubInventedWeapons(raw, allowed, 'bare hands', 'Jax');
    expect(cleaned).toMatch(/pocket knife/i);
  });

  it('prose warden wires empty-search + weapon scrub', () => {
    const facts = recordEmptySearch(baseFacts(), 'here', 8);
    const out = applyProseWarden(
      "You search again and find a dagger. Jax's crude dagger gleams.",
      {
        searchedEmpty: facts.searchedEmpty,
        playerInput: 'Search the ruin carefully',
        groundedWeapons: [],
        playerName: 'Jax',
        inventory: [],
        sceneProps: [],
      }
    );
    expect(out.toLowerCase()).not.toMatch(/dagger/);
  });
});
