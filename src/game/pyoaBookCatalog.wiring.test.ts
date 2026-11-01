import { describe, expect, it } from 'vitest';
import { getCampaignBibleById, getCampaignBiblesByEngineMode } from '@/data/campaigns';
import { listPyoaAuthoredBooks } from '@/game/pyoaBookCatalog';
import { loadPyoaBook } from '@/game/pyoaBookLoader';
import { initAuthoredPyoaGameState } from '@/game/pyoaAuthoredRuntime';
import { createInitialState } from '@/game/defaults';

describe('PI2 catalog wiring', () => {
  it('New Game picker lists all six authored books with pick/dice tags', () => {
    const pyoa = getCampaignBiblesByEngineMode('pyoa', 'adult');
    for (const e of listPyoaAuthoredBooks()) {
      expect(pyoa.some((b) => b.id === e.id), e.id).toBe(true);
      const bible = getCampaignBibleById(e.id);
      expect(bible?.genreTag?.toLowerCase()).toContain(e.type);
    }
  });

  it('boots each authored book offline with chips', () => {
    for (const e of listPyoaAuthoredBooks()) {
      const book = loadPyoaBook(e.id, { fresh: true });
      let state = createInitialState(undefined, 'pyoa') as any;
      state = initAuthoredPyoaGameState({ ...state, campaignBibleId: e.id }, e.id, { seed: 1 });
      expect(state.pyoaBookPlay?.currentNodeId).toBe(book.startId);
      expect(state.openingEstablishment?.page1?.length ?? 0).toBeGreaterThan(20);
    }
  });
});
