/**
 * T10SM1 Stage 0 — single-writer ratchet.
 * Allow-lists start at today's writers and may only shrink (Stages 1–2).
 * Fails both ways: unexpected writer, or allow-listed file that no longer writes.
 */
import { describe, expect, it } from 'vitest';
import { ALLOW_LISTS, GUARDED_FIELDS } from './singleWriterAllow';
import { scanWriters, writerFilesFor, type WriterHit } from './singleWriterScan';

function fmtHits(hits: WriterHit[]): string {
  return hits.map((h) => `${h.file}:${h.line} (${h.kind} ${h.field})`).join('\n');
}

describe('singleWriter ratchet (T10SM1)', () => {
  // One pass for all guarded fields; scanWriters caches per file (mtime/size).
  const hits = scanWriters([...GUARDED_FIELDS]);

  for (const field of GUARDED_FIELDS) {
    it(
      `${field}: writers ⊆ allow-list and allow-list ⊆ writers`,
      () => {
        const allowed = new Set(ALLOW_LISTS[field]);
        const actual = writerFilesFor(hits, field);
        const unexpected = hits.filter((h) => h.field === field && !allowed.has(h.file));
        const missing = [...allowed].filter((f) => !actual.includes(f)).sort();

        expect(
          unexpected,
          unexpected.length
            ? `unexpected writer(s) of ${field}:\n${fmtHits(unexpected)}`
            : undefined
        ).toEqual([]);
        expect(
          missing,
          missing.length
            ? `allow-listed file(s) no longer write ${field}:\n${missing.join('\n')}`
            : undefined
        ).toEqual([]);
      },
      60_000
    );
  }
});
