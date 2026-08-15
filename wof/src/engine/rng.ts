/** Seeded 0–1 rolls. Isolated WOF copy — do not import live game RNG. */
export function createHashRng(...parts: Array<string | number>): () => number {
  let h = 2166136261;
  const src = parts.map(String).join('|');
  for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

export function d20(rng: () => number): number {
  return 1 + Math.floor(rng() * 20);
}
