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

/** Max Jaccard vs recent fingerprints (0–1). */
export function maxBeatSimilarity(draftProse: string, recentFingerprints: string[]): number {
  if (!draftProse || !recentFingerprints.length) return 0;
  const fp = beatFingerprint(draftProse);
  let max = 0;
  for (const r of recentFingerprints) {
    const s = beatSimilarity(fp, r);
    if (s > max) max = s;
  }
  return max;
}

/** Near-verbatim paragraph clone — always force novelty retry (even Free). */
export function isNearClone(
  draftProse: string,
  recentFingerprints: string[],
  threshold = 0.85
): boolean {
  return maxBeatSimilarity(draftProse, recentFingerprints) >= threshold;
}

export function buildBeatNoveltyRetryBlock(recentFingerprints: string[]): string {
  return `=== BEAT NOVELTY RETRY (BINDING) ===
Your prior draft resampled a beat already used this session (same sensory collage / dialogue stub).
Write NEW concrete details — different sensory focus, different spoken content, different local result.
Do not reuse prior sentences. Do not soft-reset the scene.
If the player is stalling (same ask / listen / browse), inject a concrete interrupt: new arrival, expired offer, distant danger, or quest-relevant beat.
Recent beat ids (do not echo): ${recentFingerprints.slice(-3).join(' | ') || 'none'}
================================================`;
}

/** Normalize a player line into a coarse intent key for stagnation tracking. */
export function normalizePlayerIntentKey(input: string): string {
  const s = (input ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!s) return 'empty';
  if (/\bearth junk\b/.test(s)) return 'ask_earth_junk';
  if (/\blisten\b.*\b(corner|table|bar)\b|\bcorner table\b/.test(s)) return 'listen_corner';
  if (/\bbrowse\b.*\bstall\b|\bnearest stall\b/.test(s)) return 'browse_stall';
  if (/\bwalk away\b|\bgo another direction\b/.test(s)) return 'walk_away';
  if (/\bcheck (?:the )?(?:contents of )?your (?:bag|pack|pockets?)\b|\bcheck your bag\b/.test(s)) {
    return 'check_bag';
  }
  if (/\btravel (?:to|toward|towards)\b/.test(s)) {
    const m = s.match(/\btravel (?:to|toward|towards)\s+(.+)$/);
    return `travel_${(m?.[1] ?? 'hub').slice(0, 24).replace(/\W+/g, '_')}`;
  }
  return s.slice(0, 48);
}

/** Count consecutive identical intent keys from the end of the player log. */
export function countPlayerIntentStreak(state: {
  log?: Array<{ role?: string; content?: string }>;
}): { key: string; count: number } {
  const log = state.log ?? [];
  let key = '';
  let count = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    const k = normalizePlayerIntentKey(e.content ?? '');
    if (!key) {
      key = k;
      count = 1;
      continue;
    }
    if (k === key) count += 1;
    else break;
  }
  return { key: key || 'empty', count };
}
