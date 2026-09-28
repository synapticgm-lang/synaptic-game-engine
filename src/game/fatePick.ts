/**
 * Fate's Pick — same semantics as ActionBar: uniform random among offered labels.
 * Seedable for headless autoplay reproducibility.
 */

export type Rng = () => number;

/** Mulberry32 — deterministic [0,1) from a 32-bit seed. */
export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one of `actions` (ActionBar Fate's Pick). Empty → fallback. */
export function pickFateChoice(
  actions: string[],
  rng: Rng = Math.random,
  fallback = 'Look around'
): string {
  if (!actions.length) return fallback;
  const i = Math.floor(rng() * actions.length);
  return actions[Math.min(i, actions.length - 1)] ?? fallback;
}

/** Weighted pick (autoplay): weight per label; non-positive / missing weights fall back to uniform. */
export function pickWeightedChoice(
  actions: string[],
  weights: number[],
  rng: Rng = Math.random,
  fallback = 'Look around'
): string {
  if (!actions.length) return fallback;
  const w = actions.map((_, i) => Math.max(0, weights[i] ?? 0));
  const total = w.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return pickFateChoice(actions, rng, fallback);
  let r = rng() * total;
  for (let i = 0; i < actions.length; i++) {
    r -= w[i]!;
    if (r < 0) return actions[i]!;
  }
  return actions[actions.length - 1]!;
}
