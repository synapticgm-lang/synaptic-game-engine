/** The one home for seeds and engine randomness. Game logic never calls Math.random (replays must reproduce every roll). */

export type Rng = () => number;

/** FNV-1a 32-bit hash of a string: the seed hash every module shares. */
export function hashSeed(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** One 0–1 value from a key (no stream). */
export function hashUnit(key: string): number {
  return hashSeed(key) / 0x100000000;
}

/** A stream of 0–1 rolls from a key: roll i is hashUnit(`${key}|r${i}`). */
export function keyedRng(key: string): Rng {
  let i = 0;
  return () => hashUnit(`${key}|r${i++}`);
}

/** mulberry32 stream from a 32-bit seed. */
export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 0–1 rolls from a save seed + salt parts (replay-stable). */
export function createHashRng(...parts: Array<string | number>): Rng {
  let h = hashSeed(parts.map(String).join('|'));
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

let pinnedDice: Rng | null = null;

/** Tests and replays pin every dice roll to one source (their seeded stream). Play never sets it. */
export function pinDice(rng: Rng | null): void {
  pinnedDice = rng;
}

/** Engine rolls for one turn of a save: the same save, turn and salt always roll the same dice. */
export function turnRng(
  state: { seed?: string | null; saveId?: string | null; turn?: number | null },
  ...salt: Array<string | number>
): Rng {
  if (pinnedDice) return pinnedDice;
  return mulberry32(hashSeed(['turn', state.seed ?? state.saveId ?? '0', state.turn ?? 0, ...salt].join('|')));
}

/** Dice rolls with no turn in hand (loot chance, level-up Hit Die), keyed so they repeat. */
export function diceRng(...parts: Array<string | number>): Rng {
  return pinnedDice ?? keyedRng(parts.map(String).join('|'));
}

/** The loot table's original sine hash, kept so pinned loot rolls do not move. */
export function sinHashUnit(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const x = Math.sin(Math.abs(hash)) * 10000;
  return x - Math.floor(x);
}
