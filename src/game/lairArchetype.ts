/**
 * Site archetype bounds for a generated dungeon card.
 * Initial tuning, not a measured balance result and not a guide ratio.
 * The picker links boss, ordinary foes, and where the better chest sits.
 * It does not roll those axes independently, and it does not simulate a lair.
 */
export type LairKind =
  | 'crypt'
  | 'mine'
  | 'sewer'
  | 'warehouse'
  | 'engine'
  | 'keep'
  | 'cave'
  | 'camp'
  | 'any'
  | 'hoard';

export type LairBounds = {
  boss: [0 | 1, 0 | 1];
  miniboss: [0 | 1, 0 | 1];
  /** Inclusive share of ordinary rooms that hold one foe. */
  mobFraction: [number, number];
  bossGrade: 1 | 2 | 3;
  sideGrade: 1 | 2 | 3;
  sideChests: [number, number];
};

/** Chosen defaults. A hoard piles the rich chest on the boss and keeps the rooms sparse. */
export const LAIR_BOUNDS: Record<LairKind, LairBounds> = {
  hoard: { boss: [1, 1], miniboss: [0, 0], mobFraction: [0, 0.25], bossGrade: 3, sideGrade: 1, sideChests: [0, 1] },
  mine: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0.35, 0.8], bossGrade: 2, sideGrade: 2, sideChests: [0, 2] },
  sewer: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0.35, 0.8], bossGrade: 2, sideGrade: 2, sideChests: [0, 2] },
  cave: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0.1, 0.45], bossGrade: 2, sideGrade: 2, sideChests: [1, 2] },
  crypt: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0.1, 0.45], bossGrade: 2, sideGrade: 2, sideChests: [1, 2] },
  warehouse: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0, 0.4], bossGrade: 2, sideGrade: 1, sideChests: [1, 2] },
  engine: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0, 0.4], bossGrade: 2, sideGrade: 1, sideChests: [1, 2] },
  keep: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0, 0.4], bossGrade: 2, sideGrade: 1, sideChests: [1, 2] },
  any: { boss: [0, 1], miniboss: [0, 1], mobFraction: [0, 0.4], bossGrade: 2, sideGrade: 1, sideChests: [1, 2] },
  camp: { boss: [1, 1], miniboss: [0, 0], mobFraction: [1, 1], bossGrade: 2, sideGrade: 2, sideChests: [1, 1] },
};

export type LairShape = {
  kind: LairKind;
  boss: boolean;
  miniboss: number;
  mobFraction: number;
  bossGrade: 1 | 2 | 3;
  sideGrade: 1 | 2 | 3;
  sideChests: number;
  /** Site danger tier, not the visitor's level. */
  foeLevel: number;
};

function rollInt(rng: () => number, low: number, high: number): number {
  if (high <= low) return low;
  return low + Math.floor(rng() * (high - low + 1));
}

export function rollLairShape(opts: {
  kind: LairKind;
  rng: () => number;
  danger: number;
  forceBoss?: boolean;
  camp?: boolean;
}): LairShape {
  const kind = opts.camp ? 'camp' : opts.kind;
  const bounds = LAIR_BOUNDS[kind] ?? LAIR_BOUNDS.any;
  const danger = Math.max(1, Math.min(4, Math.floor(opts.danger || 1)));
  let boss = rollInt(opts.rng, bounds.boss[0], bounds.boss[1]) === 1;
  if (opts.forceBoss || opts.camp) boss = true;
  const miniboss = rollInt(opts.rng, bounds.miniboss[0], bounds.miniboss[1]);
  const span = bounds.mobFraction[1] - bounds.mobFraction[0];
  const mobFraction = bounds.mobFraction[0] + opts.rng() * span;
  let sideChests = rollInt(opts.rng, bounds.sideChests[0], bounds.sideChests[1]);
  // A lieutenant is not the site boss, so a delve with no boss room still needs a chest.
  if (!boss && sideChests < 1) sideChests = 1;
  return {
    kind,
    boss,
    miniboss,
    mobFraction,
    bossGrade: bounds.bossGrade,
    sideGrade: bounds.sideGrade,
    sideChests,
    foeLevel: danger,
  };
}

/**
 * How many ordinary rooms hold a foe.
 * The count stays inside the row's fraction when a whole foe would pass the top.
 * A room count too small to meet the bottom without passing the top stays at the top.
 */
export function ordinaryMobCount(fraction: number, rooms: number, bounds?: [number, number]): number {
  if (rooms <= 0) return 0;
  const raw = Math.round(fraction * rooms);
  if (!bounds) return Math.max(0, Math.min(rooms, raw));
  const low = Math.ceil(bounds[0] * rooms - 1e-9);
  const high = Math.floor(bounds[1] * rooms + 1e-9);
  if (low > high) return Math.max(0, Math.min(rooms, high));
  return Math.max(low, Math.min(high, raw, rooms));
}

/** Lieutenant and trash counts that fit in `rooms`. The lieutenant uses one of those slots. */
export function ordinaryPlacement(shape: LairShape, rooms: number): { lieutenant: 0 | 1; trash: number } {
  const bounds = (LAIR_BOUNDS[shape.kind] ?? LAIR_BOUNDS.any).mobFraction;
  const cap = ordinaryMobCount(shape.mobFraction, rooms, bounds);
  const lieutenant: 0 | 1 = shape.miniboss > 0 && cap > 0 ? 1 : 0;
  return { lieutenant, trash: Math.max(0, cap - lieutenant) };
}

/** True when a rolled shape obeys its row, including the no-boss chest rule. */
export function shapeWithinBounds(shape: LairShape): boolean {
  const bounds = LAIR_BOUNDS[shape.kind] ?? LAIR_BOUNDS.any;
  const boss = shape.boss ? 1 : 0;
  if (boss < bounds.boss[0] || boss > bounds.boss[1]) return false;
  if (shape.miniboss < bounds.miniboss[0] || shape.miniboss > bounds.miniboss[1]) return false;
  if (shape.mobFraction < bounds.mobFraction[0] - 1e-9 || shape.mobFraction > bounds.mobFraction[1] + 1e-9) return false;
  if (shape.bossGrade !== bounds.bossGrade || shape.sideGrade !== bounds.sideGrade) return false;
  if (shape.sideChests < bounds.sideChests[0] && !(!shape.boss && shape.miniboss === 0)) return false;
  if (shape.sideChests > bounds.sideChests[1]) return false;
  if (!shape.boss && shape.sideChests < 1) return false;
  return true;
}
