/** Deterministic 0–1 rolls from a save seed + salt parts (replay-stable). */
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
