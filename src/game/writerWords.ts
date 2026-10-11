import { splitProseSentences } from './proseSentences';

/**
 * On a writer turn the writer's words are the book. Post-writer stages may add an engine line
 * around them; a stage that would drop or change the writer's words logs why and leaves them.
 * Lap 13 — the exception is a sentence the commit gate rejects (`rejected`): it never stays on the
 * page as written, so a stage that changes or drops only such sentences goes through.
 * The player's own content settings (`postFilterGmOutput`) are not a stage here.
 */
export interface WriterWordsGuard {
  step(stage: string, before: string, after: string): string;
  notes: string[];
}

export function writerWordsGuard(
  writerOwns: boolean,
  rejected?: (sentence: string, draft: string) => boolean
): WriterWordsGuard {
  const notes: string[] = [];
  return {
    notes,
    step(stage, before, after) {
      if (!writerOwns || after === before) return after;
      const kept = before.trim();
      if (kept && after.includes(kept)) return after;
      const afterSentences = new Set(splitProseSentences(after).map((s) => s.trim()));
      const touched = splitProseSentences(before)
        .map((s) => s.trim())
        .filter((s) => s && !afterSentences.has(s));
      if (rejected && touched.length && touched.every((s) => rejected(s, before))) {
        notes.push(`Writer words changed: ${stage} on gate-rejected ${touched.map((s) => `"${s.slice(0, 80)}"`).join(' ')}`);
        return after;
      }
      notes.push(
        `Writer words kept: ${stage} would ${after.trim() ? 'change' : 'drop'} ${
          touched.length ? touched.map((s) => `"${s.slice(0, 80)}"`).join(' ') : 'the beat'
        }`
      );
      return before;
    },
  };
}
