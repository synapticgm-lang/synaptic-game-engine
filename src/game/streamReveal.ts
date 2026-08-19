export type TurnPhase = 'idle' | 'reading' | 'resolving' | 'revealing';

export interface StreamingRevealState {
  entryId: string;
  fullText: string;
  visibleText: string;
  done: boolean;
}

/** Strip XML tags before display-only sentence splitting. */
export function stripXmlForReveal(text: string): string {
  return text.replace(/<[^>]+>/g, '');
}

const QUOTE_OPEN = /^["'\u201c\u2018]$/;
const QUOTE_CLOSE: Record<string, RegExp> = {
  '"': /^["\u201d]$/,
  '\u201c': /^[\u201d]$/,
  "'": /^['\u2019]$/,
  '\u2018': /^[\u2019]$/,
};

function isQuoteOpen(ch: string): boolean {
  return QUOTE_OPEN.test(ch);
}

function isQuoteClose(ch: string, open: string): boolean {
  return QUOTE_CLOSE[open]?.test(ch) ?? ch === open;
}

function splitSentences(paragraph: string): string[] {
  const sentences: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteOpen = '';

  for (let i = 0; i < paragraph.length; i++) {
    const ch = paragraph[i];
    current += ch;

    if (!inQuote && isQuoteOpen(ch)) {
      inQuote = true;
      quoteOpen = ch;
    } else if (inQuote && isQuoteClose(ch, quoteOpen)) {
      inQuote = false;
      quoteOpen = '';
    }

    if (!inQuote && /[.!?]/.test(ch)) {
      const rest = paragraph.slice(i + 1);
      if (rest.length === 0 || /^\s/.test(rest)) {
        const trimmed = current.trim();
        if (trimmed) sentences.push(trimmed);
        current = '';
      }
    }
  }

  const tail = current.trim();
  if (tail) sentences.push(tail);
  return sentences.length ? sentences : [paragraph.trim()];
}

/** Split prose on sentence boundaries and paragraph breaks; keep dialogue quotes intact. */
export function splitIntoRevealChunks(text: string): string[] {
  const cleaned = stripXmlForReveal(text).replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  const chunks: string[] = [];
  const paragraphs = cleaned.split(/\n{2,}/);

  for (let p = 0; p < paragraphs.length; p++) {
    const para = paragraphs[p].trim();
    if (!para) continue;
    const sentences = splitSentences(para);
    for (let s = 0; s < sentences.length; s++) {
      let chunk = sentences[s];
      if (s === 0 && p > 0) chunk = `\n\n${chunk}`;
      chunks.push(chunk);
    }
  }

  return chunks.length ? chunks : [cleaned];
}

/** ~40–90 ms per word, capped; first chunk reveals faster. */
export function revealDelayMs(chunkIndex: number, chunk: string): number {
  const words = chunk.trim().split(/\s+/).filter(Boolean).length || 1;
  const perWord = 55;
  let delay = Math.min(words * 90, Math.max(40, words * perWord));
  if (chunkIndex === 0) delay = Math.round(delay * 0.65);
  return delay;
}

export function buildRevealVisibleText(chunks: string[], throughIndex: number): string {
  return chunks
    .slice(0, throughIndex + 1)
    .reduce((acc, chunk, i) => (i === 0 ? chunk : `${acc}${chunk.startsWith('\n') ? '' : ' '}${chunk}`), '');
}

export function turnPhaseStatusMessage(phase: TurnPhase): string | null {
  if (phase === 'reading') return 'Reading your move…';
  if (phase === 'resolving') return 'Resolving the scene…';
  return null;
}

export function resolveRevealContent(
  entryId: string,
  content: string,
  reveal: StreamingRevealState | null | undefined,
): { text: string; isRevealing: boolean } {
  if (reveal && reveal.entryId === entryId && !reveal.done) {
    return { text: reveal.visibleText, isRevealing: true };
  }
  return { text: content, isRevealing: false };
}

export function isTurnUiBlocked(
  busy: boolean,
  turnPhase: TurnPhase,
  streamingReveal: StreamingRevealState | null,
): boolean {
  return (
    busy
    || turnPhase === 'reading'
    || turnPhase === 'resolving'
    || (turnPhase === 'revealing' && !!streamingReveal && !streamingReveal.done)
  );
}
