/**
 * Engine-made people's names (original, not from any licensed setting): townsfolk and road meetings both draw
 * from these, with a seeded rng, and never reuse a word of a name the save already holds.
 */
import type { Rng } from './seededRng';

const GIVEN = [
  'Wat', 'Hobb', 'Edda', 'Maud', 'Piers', 'Tilde', 'Osric', 'Nell', 'Bertil', 'Agna', 'Col', 'Ysolde',
  'Garth', 'Rosel', 'Dunn', 'Idra', 'Hale', 'Merrit', 'Sefa', 'Brannoc', 'Oda', 'Lisle', 'Wenna', 'Cutha',
];
const FAMILY = [
  'Pike', 'Thatch', 'Crane', 'Barrow', 'Dunmore', 'Hask', 'Wyle', 'Fenwick', 'Marl', 'Sallow', 'Cotter',
  'Rudd', 'Brack', 'Hollin', 'Tew', 'Aske', 'Merrow', 'Coyne',
];

/** Every name and every word of it, lowercased: the words a new name must not share. */
export function nameWords(names: ReadonlyArray<string | null | undefined>): Set<string> {
  const out = new Set<string>();
  for (const n of names) {
    const name = (n ?? '').trim().toLowerCase();
    if (!name) continue;
    out.add(name);
    for (const w of name.split(/\s+/)) out.add(w);
  }
  return out;
}

/** A given + family name sharing no word with `taken` (and added to it), or '' after 12 tries. */
export function pickPersonName(rng: Rng, taken: Set<string>): string {
  for (let tries = 0; tries < 12; tries++) {
    const given = GIVEN[Math.floor(rng() * GIVEN.length)]!;
    const family = FAMILY[Math.floor(rng() * FAMILY.length)]!;
    if (taken.has(given.toLowerCase()) || taken.has(family.toLowerCase())) continue;
    taken.add(given.toLowerCase());
    taken.add(family.toLowerCase());
    return `${given} ${family}`;
  }
  return '';
}
