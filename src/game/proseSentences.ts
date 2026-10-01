/**
 * Sentences of story prose. A stop inside an open quote does not end the sentence, nor does a stop
 * followed by a lowercase dialogue tag ("What now?" they asked). Closing quotes stay with their sentence.
 * When straight quotes do not pair up, quote state is ignored rather than swallowing the rest of the beat.
 */
export function splitProseSentences(text: string): string[] {
  const src = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!src) return [];
  const straight = (src.match(/"/g) ?? []).length;
  const trackQuotes = straight % 2 === 0;
  const out: string[] = [];
  let start = 0;
  let inQuote = false;
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (trackQuotes && ch === '"') inQuote = !inQuote;
    else if (trackQuotes && ch === '\u201c') inQuote = true;
    else if (trackQuotes && ch === '\u201d') inQuote = false;
    if (!/[.!?\u2026]/.test(ch)) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < src.length && /[.!?\u2026]/.test(src[j]!)) j += 1;
    while (j < src.length && /["'\u201d\u2019)\]]/.test(src[j]!)) {
      if (trackQuotes && src[j] === '"') inQuote = !inQuote;
      if (src[j] === '\u201d') inQuote = false;
      j += 1;
    }
    const next = src.slice(j).match(/^\s*(\S)/)?.[1];
    const ends = j >= src.length || (src[j] === ' ' && !inQuote && !!next && !/[a-z]/.test(next));
    if (ends) {
      const s = src.slice(start, j).trim();
      if (s) out.push(s);
      start = j;
    }
    i = j;
  }
  const tail = src.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}
