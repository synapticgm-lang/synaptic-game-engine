/**
 * Authored PYOA gamebook catalog — the six books that ship offline.
 * Menu picker shows title + type (pick | dice).
 */

import type { PyoaBookId, PyoaBookPlayType } from './pyoaBookTypes';

export interface PyoaBookCatalogEntry {
  id: PyoaBookId;
  /** Folder under content/pyoa/ (umbra uses book.built.json + bundled umbraBook.json). */
  folder: string;
  title: string;
  type: PyoaBookPlayType;
  /** Campaign bible id used in saves / New Game. */
  bibleId: PyoaBookId;
  blurb: string;
}

export const PYOA_AUTHORED_BOOKS: readonly PyoaBookCatalogEntry[] = [
  {
    id: 'umbra-protocol',
    folder: 'umbra',
    title: 'The Umbra Protocol',
    type: 'pick',
    bibleId: 'umbra-protocol',
    blurb: 'Blood on the bell-tower floor — blend, climb, or ring the ledger.',
  },
  {
    id: 'saltglass',
    folder: 'saltglass',
    title: 'The Last Lamp Across the Saltglass',
    type: 'pick',
    bibleId: 'saltglass',
    blurb: 'Carry the ember-lamp across the salt flats before the tide of glass returns.',
  },
  {
    id: 'vesperhold',
    folder: 'vesperhold',
    title: 'The Bell That Must Come Down',
    type: 'pick',
    bibleId: 'vesperhold',
    blurb: 'Lower the bronze tongue before the hold seals at dusk.',
  },
  {
    id: 'tide-that-did-not-return',
    folder: 'dice',
    title: 'The Tide That Did Not Return',
    type: 'dice',
    bibleId: 'tide-that-did-not-return',
    blurb: 'Walk the crusted flats — 2d6 tests of Might, Wit, Nerve, and Craft.',
  },
  {
    id: 'cinderfall',
    folder: 'cinderfall',
    title: 'The Last Train to Cinderfall',
    type: 'dice',
    bibleId: 'cinderfall',
    blurb: 'Ride the steampunk rail before the boilers fail — Brawn, Cunning, Composure, Mechanics.',
  },
  {
    id: 'underlibrary',
    folder: 'underlibrary',
    title: 'The Hundredth Door of the Underlibrary',
    type: 'dice',
    bibleId: 'underlibrary',
    blurb: 'Find the door that should not open — Study, Will, Guile, Grace.',
  },
] as const;

const BY_ID = new Map<string, PyoaBookCatalogEntry>(
  PYOA_AUTHORED_BOOKS.map((e) => [e.id, e]),
);
const BY_BIBLE = new Map<string, PyoaBookCatalogEntry>(
  PYOA_AUTHORED_BOOKS.map((e) => [e.bibleId, e]),
);

export function listPyoaAuthoredBooks(): readonly PyoaBookCatalogEntry[] {
  return PYOA_AUTHORED_BOOKS;
}

export function getPyoaBookCatalogEntry(
  id: string | null | undefined
): PyoaBookCatalogEntry | undefined {
  if (!id) return undefined;
  return BY_ID.get(id) ?? BY_BIBLE.get(id);
}

/** Narrows UI/state/JSON string ids to the authored six. */
export function isAuthoredPyoaBookId(id: string | null | undefined): id is PyoaBookId {
  return !!getPyoaBookCatalogEntry(id);
}

export function pyoaBookTypeLabel(type: PyoaBookPlayType): string {
  return type === 'dice' ? 'dice' : 'pick';
}
