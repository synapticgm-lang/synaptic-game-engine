/**
 * XP-D1 OPEN5 — wildlife species tables.
 * Engine data only: the dungeon biome families (BIOME_FAMILIES) are scaled across a region
 * level band so every level in the band has a killable species. Plain names, no prefixes.
 * The AI never picks species or levels; game/wilds.ts reads these rows.
 */
import { BIOME_FAMILIES, biomeKey } from './dungeonBiomes';

export type CreatureKind = 'beast' | 'humanoid' | 'undead' | 'monster';
export type BehaviourTag = 'passive' | 'skittish' | 'aggressive' | 'pack' | 'territorial';
export type PrimaryDrop = 'hide' | 'coin' | 'gear';

export interface CreatureSpeciesRow {
  id: string;
  name: string;
  kind: CreatureKind;
  /** Added to band.low (then clamped to the band) by creatureLevel. */
  levelOffset: number;
  behaviour: BehaviourTag;
  elite?: boolean;
  rare?: boolean;
  /** Relative pick weight when stocking a place. */
  weight: number;
  primaryDrop: PrimaryDrop;
  skinnable: boolean;
  /** BIOME_FAMILIES key this row belongs to. */
  biome: string;
}

export interface LevelBand {
  low: number;
  high: number;
}

export function creatureLevel(row: CreatureSpeciesRow, band: LevelBand): number {
  const lo = Math.max(1, Math.floor(band.low));
  const hi = Math.max(lo, Math.floor(band.high));
  const raw = lo + Math.floor(row.levelOffset);
  return Math.max(lo, Math.min(hi, raw));
}

const MONSTER = /\b(golem|drone|slime|horror|wyvern|basilisk|troll|stalker|alpha|mite|lurker)\b/i;
const NOT_SKINNABLE =
  /\b(swarm|beetle|spider|leech|midge|crawler|urchin|cluster|slime|crab|scorpion|mite|flock|eel|toad|lurker|queen|broodmother|matriarch|drone|golem|horror|stalker|hound|alpha)\b/i;
const PACK = /\b(swarm|flock|pack|cluster|wolf|jackal)\b/i;
const TERRITORIAL = /\b(crab|toad|goat|mole-rat|queen|matriarch|broodmother|alpha)\b/i;
const AGGRESSIVE =
  /\b(boar|bear|viper|snake|scorpion|stalker|horror|wyvern|basilisk|troll|crocodile|shark|squid|hound|eel|spider|lizard|beetle|crawler|leech|golem|drone|slime|lurker|mite|rat)\b/i;
const SKITTISH = /\b(hare|rabbit|squirrel|cat|deer)\b/i;

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function behaviourFor(name: string): BehaviourTag {
  if (PACK.test(name)) return 'pack';
  if (TERRITORIAL.test(name)) return 'territorial';
  if (AGGRESSIVE.test(name)) return 'aggressive';
  if (SKITTISH.test(name)) return 'skittish';
  return 'passive';
}

function dropFor(kind: CreatureKind, skinnable: boolean): PrimaryDrop {
  if (kind === 'monster' || kind === 'undead') return 'gear';
  if (kind === 'humanoid') return 'coin';
  return skinnable ? 'hide' : 'coin';
}

interface RowSeed {
  name: string;
  offset: number;
  weight: number;
  elite?: boolean;
  rare?: boolean;
  behaviour?: BehaviourTag;
  skinnable?: boolean;
}

function buildRow(biome: string, s: RowSeed): CreatureSpeciesRow {
  const kind: CreatureKind = MONSTER.test(s.name) ? 'monster' : 'beast';
  const skinnable = s.skinnable ?? (kind === 'beast' && !NOT_SKINNABLE.test(s.name));
  return {
    id: `${biome}:${slug(s.name)}:${s.offset}${s.rare ? ':rare' : s.elite ? ':elite' : ''}`,
    name: s.name,
    kind,
    levelOffset: s.offset,
    behaviour: s.behaviour ?? behaviourFor(s.name),
    elite: s.elite || undefined,
    rare: s.rare || undefined,
    weight: s.weight,
    primaryDrop: dropFor(kind, skinnable),
    skinnable,
    biome,
  };
}

/** Harmless level-1 animals so a fresh save always has something to hunt. */
const STARTER_ANIMALS: Record<string, RowSeed[]> = {
  plains: [
    { name: 'Field Mouse', offset: 0, weight: 14, behaviour: 'passive', skinnable: false },
    { name: 'Scrub Hare', offset: 0, weight: 12, behaviour: 'skittish', skinnable: true },
    { name: 'Wild Rabbit', offset: 1, weight: 8, behaviour: 'skittish', skinnable: true },
  ],
  forest: [
    { name: 'Red Squirrel', offset: 0, weight: 14, behaviour: 'skittish', skinnable: false },
    { name: 'Woodland Hare', offset: 0, weight: 12, behaviour: 'skittish', skinnable: true },
    { name: 'Roe Deer', offset: 1, weight: 8, behaviour: 'skittish', skinnable: true },
  ],
  urban: [
    { name: 'Street Pigeon', offset: 0, weight: 14, behaviour: 'passive', skinnable: false },
    { name: 'Alley Cat', offset: 0, weight: 10, behaviour: 'skittish', skinnable: true },
    { name: 'Stray Dog', offset: 1, weight: 8, behaviour: 'skittish', skinnable: true },
  ],
};

/**
 * Species rows for a biome across a level band.
 * - Every trash name gets a row spread over the band; any level still uncovered gets a row.
 * - Elite + rare rows sit in the upper band; start bands (high <= 3) still get one elite at spawn+2 (OPEN7 addendum).
 * - Start bands (low <= 1) on plains / forest / urban add starter animals at level 1.
 */
export function speciesForBiome(biome: string, band: LevelBand): CreatureSpeciesRow[] {
  const key = biomeKey(biome) ?? 'plains';
  const fam = BIOME_FAMILIES[key] ?? BIOME_FAMILIES.plains!;
  const lo = Math.max(1, Math.floor(band.low));
  const hi = Math.max(lo, Math.floor(band.high));
  const width = hi - lo + 1;
  const rows = new Map<string, CreatureSpeciesRow>();
  const add = (s: RowSeed) => {
    const row = buildRow(key, s);
    if (!rows.has(row.id)) rows.set(row.id, row);
  };

  if (lo <= 1) for (const s of STARTER_ANIMALS[key] ?? []) add(s);

  const trash = fam.trash;
  const covered = new Set<number>();
  trash.forEach((name, i) => {
    const offset = trash.length > 1 ? Math.round((i * (width - 1)) / (trash.length - 1)) : 0;
    covered.add(offset);
    add({ name, offset, weight: 10 });
  });
  for (let o = 0; o < width; o++) {
    if (covered.has(o)) continue;
    add({ name: trash[o % trash.length]!, offset: o, weight: 8 });
    covered.add(o);
  }

  // OPEN7 addendum — starter bands (1–3) still get one elite at spawn+2 (zone mini-boss).
  // Wider bands keep elite + rare in the upper half as before.
  {
    const [elite, rare] = fam.elite;
    if (hi <= 3 && lo <= 1) {
      if (elite) add({ name: elite, offset: Math.max(0, width - 1), weight: 2, elite: true });
    } else if (hi > 3) {
      if (elite) add({ name: elite, offset: Math.max(0, width - 2), weight: 3, elite: true });
      if (rare) add({ name: rare, offset: width - 1, weight: 1, elite: true, rare: true });
    }
  }

  return [...rows.values()];
}
