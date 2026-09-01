/**
 * Auto-improve heal plumbing — CRLF match + truncated SEARCH/REPLACE reject.
 * Mid writer stays OFF (asserted).
 */
import { describe, expect, it } from 'vitest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  applySearchReplaceOnce,
  filterRealTickets,
  isIncompleteSearchReplace,
  isPlaceholderTicket,
  normalizeNewlines,
  parseSearchReplaceBlocks,
} from './autoImprovePatch';

describe('playtest31o — auto-improve patch apply', () => {
  it('keeps Mid writer OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('matches SEARCH across CRLF vs LF (Windows files)', () => {
    const file = 'line one\r\nline two\r\nline three\r\n';
    const search = 'line two\n'; // Flash Lite emits LF
    const next = 'line TWO\n';
    const { after, matched } = applySearchReplaceOnce(file, search, next);
    expect(matched).toBe(true);
    expect(after).toBe('line one\r\nline TWO\r\nline three\r\n');
    expect(after.includes('\r\n')).toBe(true);
  });

  it('rejects truncated patch (SEARCH without REPLACE fence)', () => {
    const raw = [
      '<<<<<<< SEARCH path=src/game/proseWarden.ts',
      'const x = 1;',
      '=======',
      'const x = 2;',
      // missing >>>>>>> REPLACE — Flash Lite truncate
    ].join('\n');
    expect(isIncompleteSearchReplace(raw)).toBe(true);
    expect(parseSearchReplaceBlocks(raw)).toEqual([]);
  });

  it('parses complete SEARCH/REPLACE and applies once', () => {
    const raw = [
      '<<<<<<< SEARCH path=src/game/proseWarden.ts',
      'foo()',
      '=======',
      'bar()',
      '>>>>>>> REPLACE',
    ].join('\n');
    expect(isIncompleteSearchReplace(raw)).toBe(false);
    const blocks = parseSearchReplaceBlocks(raw);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.path).toBe('src/game/proseWarden.ts');
    const { after, matched } = applySearchReplaceOnce('before foo() after', blocks[0]!.old, blocks[0]!.next);
    expect(matched).toBe(true);
    expect(normalizeNewlines(after)).toBe('before bar() after');
  });

  it('strips fake P0 ellipsis / EXAMPLE_ONLY tickets', () => {
    expect(isPlaceholderTicket({ title: '…', quote: '…' })).toBe(true);
    expect(isPlaceholderTicket({ title: 'EXAMPLE_ONLY_replace_with_real_finding' })).toBe(true);
    expect(
      filterRealTickets([
        { title: '…', quote: '…' },
        { title: 'Pad loops Wait forever', quote: 'Wait' },
      ])
    ).toEqual([{ title: 'Pad loops Wait forever', quote: 'Wait' }]);
  });
});
