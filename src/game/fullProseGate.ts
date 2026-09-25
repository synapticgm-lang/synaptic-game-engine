/**
 * Day-1 full-prose gate — shared by NarratorProvider and edge gm-turn policy.
 * Never treat two-line / truncated stubs as a successful narration.
 */

export const MIN_PROSE_WORDS = 55;
export const MIN_PROSE_SENTENCES = 3;
export const MIN_TOKEN_PROSE_LINES = 4;

export function countProseWords(raw: string): number {
  return (raw ?? '').trim().split(/\s+/).filter(Boolean).length;
}

export function countProseSentences(raw: string): number {
  const parts = (raw ?? '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
  return parts.length;
}

/** Accept freeform prose or Token Prose JSON that expands to a full spoken beat. */
export function isFullProseNarration(raw: string): boolean {
  const text = (raw ?? '').trim();
  if (!text) return false;
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as { lines?: unknown; candidates?: unknown };
      if (Array.isArray(parsed.lines)) {
        const lines = parsed.lines
          .map((l) => {
            if (typeof l === 'string') return l.trim();
            if (l && typeof l === 'object' && 'text' in (l as object)) {
              return String((l as { text?: string }).text ?? '').trim();
            }
            return '';
          })
          .filter((l) => l.length >= 8);
        if (lines.length >= MIN_TOKEN_PROSE_LINES) return true;
        return countProseWords(lines.join(' ')) >= MIN_PROSE_WORDS;
      }
      if (Array.isArray(parsed.candidates)) {
        return parsed.candidates.some((c) => isFullProseNarration(String(c ?? '')));
      }
    } catch {
      /* fall through */
    }
  }
  return (
    countProseWords(text) >= MIN_PROSE_WORDS
    || countProseSentences(text) >= MIN_PROSE_SENTENCES
  );
}
