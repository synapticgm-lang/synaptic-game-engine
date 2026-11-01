import { describe, expect, it, beforeEach } from 'vitest';
import { listPyoaAuthoredBooks, isAuthoredPyoaBookId } from './pyoaBookCatalog';
import { clearPyoaBookCache, loadPyoaBook } from './pyoaBookLoader';
import { validatePyoaBook } from './pyoaBookValidate';

describe('pyoaBookLoader', () => {
  beforeEach(() => clearPyoaBookCache());

  it('catalog lists exactly six authored books with pick/dice types', () => {
    const books = listPyoaAuthoredBooks();
    expect(books).toHaveLength(6);
    expect(books.filter((b) => b.type === 'pick').map((b) => b.id).sort()).toEqual(
      ['saltglass', 'umbra-protocol', 'vesperhold'].sort()
    );
    expect(books.filter((b) => b.type === 'dice').map((b) => b.id).sort()).toEqual(
      ['cinderfall', 'tide-that-did-not-return', 'underlibrary'].sort()
    );
    for (const b of books) {
      expect(isAuthoredPyoaBookId(b.id)).toBe(true);
      expect(isAuthoredPyoaBookId(b.bibleId)).toBe(true);
    }
  });

  it('loads and validates every authored book (unknown links / endings)', () => {
    for (const entry of listPyoaAuthoredBooks()) {
      const book = loadPyoaBook(entry.id, { strict: true, fresh: true });
      expect(book.id).toBe(entry.id);
      expect(book.type).toBe(entry.type);
      expect(book.startId).toBeTruthy();
      expect(book.nodes.has(book.startId)).toBe(true);
      expect(book.nodeList.length).toBeGreaterThanOrEqual(999);
      const v = validatePyoaBook(book);
      expect(v.ok, `${entry.id}: ${v.issues.slice(0, 5).map((i) => i.message).join(' | ')}`).toBe(
        true
      );
      expect(v.endingCount).toBeGreaterThan(0);
      if (entry.type === 'dice') {
        expect(book.diceRules?.system).toBe('2d6');
        expect(book.diceRules?.stats.length).toBe(4);
      }
    }
  });

  it('fails loudly on unknown link targets', () => {
    expect(() =>
      loadPyoaBook('saltglass', {
        strict: true,
        fresh: true,
        raw: {
          title: 'Broken',
          start: 'a',
          nodes: [
            {
              id: 'a',
              kind: 'wide',
              page: 'hi',
              exits: [{ id: 'x', label: 'go', to: 'missing-z' }],
            },
          ],
        },
      })
    ).toThrow(/failed validation|missing/i);
  });

  it('Umbra adapter preserves start and ending leaves', () => {
    const book = loadPyoaBook('umbra-protocol', { fresh: true });
    expect(book.startId).toBe('up-bell-tower');
    expect(book.endings.length).toBe(8);
    expect(book.deaths.length).toBe(0);
  });
});
