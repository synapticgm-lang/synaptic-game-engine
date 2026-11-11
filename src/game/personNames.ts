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


export type PersonGender = 'male' | 'female';

/** Given-name genders for engine name banks. Unlisted names get a stable fallback. */
const GIVEN_GENDER: Record<string, PersonGender> = {
  wat: 'male', hobb: 'male', piers: 'male', osric: 'male', bertil: 'male', col: 'male',
  garth: 'male', dunn: 'male', merrit: 'male', brannoc: 'male', cutha: 'male', hale: 'male',
  edda: 'female', maud: 'female', tilde: 'female', nell: 'female', agna: 'female', ysolde: 'female',
  rosel: 'female', idra: 'female', sefa: 'female', oda: 'female', lisle: 'female', wenna: 'female',
  jonas: 'male', theo: 'male', luc: 'male', kenan: 'male', rafi: 'male', marc: 'male',
  priya: 'female', mara: 'female', nina: 'female', asha: 'female', ivy: 'female', sofi: 'female',
  kade: 'male', jori: 'male', torin: 'male', pax: 'male',
  rin: 'female', nyx: 'female', vela: 'female', tamsin: 'female', yara: 'female',
  sable: 'female', ilex: 'male', nim: 'female',
};

function hashGender(given: string): PersonGender {
  let h = 0;
  for (let i = 0; i < given.length; i++) h = (h + given.charCodeAt(i) * (i + 1)) % 2;
  return h === 0 ? 'male' : 'female';
}

/** Gender for a given or full minted name. Stable for unlisted names. */
export function genderForPersonName(name: string): PersonGender {
  const given = (name ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  if (!given) return 'male';
  return GIVEN_GENDER[given] ?? hashGender(given);
}

export function genderNoun(gender: PersonGender | undefined): 'man' | 'woman' {
  return gender === 'female' ? 'woman' : 'man';
}

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
