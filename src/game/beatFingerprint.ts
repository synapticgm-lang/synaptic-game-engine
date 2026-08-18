/**
 * beatFingerprint — content hash of accepted prose so retries cannot resample the same beat.
 */

export function beatFingerprint(prose: string): string {
  const norm = prose
    .replace(/<[^>]+>/g, ' ')
    .replace(/["“”']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Token sketch for Jaccard
  const tokens = norm.match(/[a-z]{4,}/g) ?? [];
  const sketch = tokens.filter((_, i) => i % 3 === 0).slice(0, 24).join(',');
  return `${(h >>> 0).toString(16)}:${sketch}`;
}

function sketchSet(fp: string): Set<string> {
  const sketch = fp.split(':')[1] ?? '';
  return new Set(sketch.split(',').filter(Boolean));
}

/** Jaccard similarity of token sketches (0–1). */
export function beatSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a.split(':')[0] === b.split(':')[0]) return 1;
  const A = sketchSet(a);
  const B = sketchSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

/** True when draft is too close to a recent accepted beat or discarded speculative take. */
export function isSameBeat(
  draftProse: string,
  recentFingerprints: string[],
  threshold = 0.72
): boolean {
  const fp = beatFingerprint(draftProse);
  return recentFingerprints.some((r) => beatSimilarity(fp, r) >= threshold);
}

export function buildBeatNoveltyRetryBlock(recentFingerprints: string[]): string {
  return `=== BEAT NOVELTY RETRY (BINDING) ===
Your prior draft resampled a beat already used this session (same sensory collage / dialogue stub).
Write NEW concrete details — different sensory focus, different spoken content, different local result.
Do not reuse prior sentences. Do not soft-reset the scene.
Recent beat ids (do not echo): ${recentFingerprints.slice(-3).join(' | ') || 'none'}
================================================`;
}
