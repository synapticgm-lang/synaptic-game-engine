/**
 * SEARCH/REPLACE apply helpers for fate auto-improve.
 * CRLF-safe on Windows; rejects truncated Flash Lite dumps.
 */

export type SearchReplaceBlock = { path: string; old: string; next: string };

export function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function detectNewline(s: string): '\r\n' | '\n' {
  return /\r\n/.test(s) ? '\r\n' : '\n';
}

export function toFileNewlines(s: string, nl: '\r\n' | '\n'): string {
  const lf = normalizeNewlines(s);
  return nl === '\r\n' ? lf.replace(/\n/g, '\r\n') : lf;
}

/** True when the model opened SEARCH but never closed REPLACE (truncate). */
export function isIncompleteSearchReplace(text: string): boolean {
  if (/^\s*NO_PATCH\s*$/m.test(text)) return false;
  const opens = (text.match(/<<<<<<<\s*SEARCH/g) ?? []).length;
  const closes = (text.match(/>>>>>>>\s*REPLACE/g) ?? []).length;
  if (opens === 0 && closes === 0) return false;
  if (opens > 0 && closes === 0) return true;
  return opens > closes;
}

export function parseSearchReplaceBlocks(text: string): SearchReplaceBlock[] {
  const blocks: SearchReplaceBlock[] = [];
  // Accept LF or CRLF between fence lines
  const re =
    /<<<<<<<\s*SEARCH\s+path=([^\r\n]+)\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>>\s*REPLACE/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const path = m[1]!.trim().replace(/\\/g, '/');
    blocks.push({ path, old: m[2]!, next: m[3]! });
  }
  return blocks;
}

/**
 * Apply first occurrence of old→next, treating CRLF/LF as equivalent for match.
 * Preserves the file's dominant newline style on write-back.
 */
export function applySearchReplaceOnce(
  before: string,
  old: string,
  next: string
): { after: string; matched: boolean } {
  const nl = detectNewline(before);
  const beforeLF = normalizeNewlines(before);
  const oldLF = normalizeNewlines(old);
  const nextLF = normalizeNewlines(next);
  if (!oldLF || !beforeLF.includes(oldLF)) {
    return { after: before, matched: false };
  }
  const afterLF = beforeLF.replace(oldLF, nextLF);
  if (afterLF === beforeLF) {
    return { after: before, matched: false };
  }
  return { after: toFileNewlines(afterLF, nl), matched: true };
}

/** Critic / example JSON placeholder tickets — never count as real P0. */
export function isPlaceholderTicket(t: {
  title?: string;
  quote?: string;
}): boolean {
  const title = (t.title ?? '').trim();
  if (!title) return true;
  if (/^(?:\.{3}|…|EXAMPLE[_A-Z0-9]*|replace_with_real[_a-z]*)$/i.test(title)) return true;
  if (/^EXAMPLE_ONLY/i.test(title)) return true;
  if (/^[.…\s]+$/.test(title)) return true;
  const quote = (t.quote ?? '').trim();
  if (quote === '…' || quote === '...' || /^[.…\s]+$/.test(quote)) {
    // title alone may be real; only drop if title is also placeholder-ish short
    if (title.length <= 3 || /^(?:\.{3}|…)$/.test(title)) return true;
  }
  return false;
}

export function filterRealTickets<T extends { title?: string; quote?: string }>(
  tickets: T[]
): T[] {
  return tickets.filter((t) => !isPlaceholderTicket(t));
}
