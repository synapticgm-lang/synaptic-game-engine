import type { CampaignBible } from './types';
import { makeBible } from './makeBible';
import { listPyoaAuthoredBooks } from '@/game/pyoaBookCatalog';

/**
 * Thin CampaignBible stubs for the five authored gamebooks beyond Umbra
 * (Umbra keeps its rich umbraProtocol bible). genreTag encodes pick|dice for the picker.
 */
function stub(opts: {
  id: string;
  title: string;
  type: 'pick' | 'dice';
  tagline: string;
  shortDescription: string;
  premise: string;
  startingLocation: string;
}): CampaignBible {
  return makeBible({
    id: opts.id,
    title: opts.title,
    archetype: 'custom_world',
    engineMode: 'pyoa',
    difficulty: 'Standard',
    genreTag: opts.type === 'dice' ? 'Gamebook · dice' : 'Gamebook · pick',
    tagline: opts.tagline,
    shortDescription: opts.shortDescription,
    premise: opts.premise,
    licenseNote:
      'Original SynapticGM authored gamebook. Offline chips-only play — no live AI writer.',
    lore: [],
    npcs: [],
    quests: [],
    items: [],
    startingLocation: opts.startingLocation,
    replaceDefaultLoadout: true,
  });
}

export const saltglassBook: CampaignBible = stub({
  id: 'saltglass',
  title: 'The Last Lamp Across the Saltglass',
  type: 'pick',
  tagline: 'Carry the ember-lamp across the salt flats before the glass tide returns.',
  shortDescription:
    'A pick-your-path gamebook across the Saltglass. Offline authored pages — chips only.',
  premise: 'The last lamp must cross the flats. Every fork is written.',
  startingLocation: 'the Saltglass verge',
});

export const vesperholdBook: CampaignBible = stub({
  id: 'vesperhold',
  title: 'The Bell That Must Come Down',
  type: 'pick',
  tagline: 'Lower the bronze tongue before the hold seals at dusk.',
  shortDescription:
    'A pick-your-path gamebook in Vesperhold. Offline authored pages — chips only.',
  premise: 'The bell must come down. The hold is listening.',
  startingLocation: 'the Vesperhold bell-walk',
});

export const tideThatDidNotReturnBook: CampaignBible = stub({
  id: 'tide-that-did-not-return',
  title: 'The Tide That Did Not Return',
  type: 'dice',
  tagline: 'Walk the crusted flats — 2d6 tests of Might, Wit, Nerve, and Craft.',
  shortDescription:
    'A 2d6 dice gamebook. The engine rolls; the book never decides a result.',
  premise: 'The tide that did not return left a path of checks and keepsakes.',
  startingLocation: 'the Gullmouth desk',
});

export const cinderfallBook: CampaignBible = stub({
  id: 'cinderfall',
  title: 'The Last Train to Cinderfall',
  type: 'dice',
  tagline: 'Ride the steampunk rail before the boilers fail.',
  shortDescription:
    'A 2d6 dice gamebook on the Cinderfall line — Brawn, Cunning, Composure, Mechanics.',
  premise: 'The last train will not wait. Tests decide the carriages you keep.',
  startingLocation: 'the Cinderfall platform',
});

export const underlibraryBook: CampaignBible = stub({
  id: 'underlibrary',
  title: 'The Hundredth Door of the Underlibrary',
  type: 'dice',
  tagline: 'Find the door that should not open — Study, Will, Guile, Grace.',
  shortDescription:
    'A 2d6 dice gamebook beneath the stacks. Offline authored pages — chips only.',
  premise: 'One hundred doors. One should stay shut.',
  startingLocation: 'the Underlibrary porter desk',
});

export const PYOA_AUTHORED_BOOK_BIBLES: CampaignBible[] = [
  saltglassBook,
  vesperholdBook,
  tideThatDidNotReturnBook,
  cinderfallBook,
  underlibraryBook,
];

export function assertPyoaAuthoredBibleCoverage(): void {
  const stubIds = new Set(PYOA_AUTHORED_BOOK_BIBLES.map((b) => b.id));
  for (const e of listPyoaAuthoredBooks()) {
    if (e.id === 'umbra-protocol') continue;
    if (!stubIds.has(e.id)) {
      throw new Error('Missing CampaignBible stub for authored PYOA book ' + e.id);
    }
  }
}
