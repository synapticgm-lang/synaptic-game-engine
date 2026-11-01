import { describe, expect, it, beforeEach } from 'vitest';
import { clearPyoaBookCache, loadPyoaBook } from './pyoaBookLoader';
import { performPyoaCheck } from './pyoaDice2d6';
import {
  PYOA_CONTINUE_CHECK_CHIP,
  PYOA_LUCK_PUSH_CHIP,
  PYOA_PICKER_CHIP,
  PYOA_RESTART_CHIP,
  advancePyoaBookPlay,
  buildPyoaPlayView,
  clearPyoaBookProgress,
  initPyoaBookPlay,
  loadPyoaBookProgress,
  resumePyoaBookPlay,
  savePyoaBookProgress,
  serializePyoaBookPlay,
} from './pyoaBookPlay';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    key: (i: number) => [...map.keys()][i] ?? null,
  } as Storage;
}

describe('pyoaBookPlay save/resume', () => {
  beforeEach(() => clearPyoaBookCache());

  it('pick book: init, choose, serialize, resume at same section', () => {
    const book = loadPyoaBook('saltglass', { fresh: true });
    let state = initPyoaBookPlay('saltglass', { seed: 123, book });
    expect(state.currentNodeId).toBe(book.startId);
    const view0 = buildPyoaPlayView(state, { book });
    expect(view0.pageText.length).toBeGreaterThan(20);
    expect(view0.choices.length).toBeGreaterThan(0);
    expect(view0.terminal).toBe('live');

    const pick = view0.choices[0]!;
    state = advancePyoaBookPlay(state, pick.label, { book });
    expect(state.currentNodeId).not.toBe(book.startId);

    const blob = serializePyoaBookPlay(state);
    const resumed = resumePyoaBookPlay(blob, { book });
    expect(resumed.currentNodeId).toBe(state.currentNodeId);
    expect(resumed.seed).toBe(123);
    expect(resumed.flags).toEqual(state.flags);
  });

  it('localStorage progress round-trips per book', () => {
    const store = memoryStorage();
    const book = loadPyoaBook('vesperhold', { fresh: true });
    let state = initPyoaBookPlay('vesperhold', { seed: 5, book });
    const first = buildPyoaPlayView(state, { book }).choices[0];
    if (first) state = advancePyoaBookPlay(state, first.label, { book });
    savePyoaBookProgress(state, store);
    const loaded = loadPyoaBookProgress('vesperhold', store);
    expect(loaded?.currentNodeId).toBe(state.currentNodeId);
    clearPyoaBookProgress('vesperhold', store);
    expect(loadPyoaBookProgress('vesperhold', store)).toBeNull();
  });

  it('ending/death view offers restart and back to picker', () => {
    const book = loadPyoaBook('saltglass', { fresh: true });
    const doom = book.nodeList.find((n) => n.deathId);
    expect(doom).toBeTruthy();
    let state = initPyoaBookPlay('saltglass', { seed: 1, book });
    state = {
      ...state,
      currentNodeId: doom!.id,
      deathId: doom!.deathId || doom!.id,
      endingId: null,
    };
    const view = buildPyoaPlayView(state, { book });
    expect(view.terminal).toBe('death');
    expect(view.choices.map((c) => c.label)).toEqual([PYOA_RESTART_CHIP, PYOA_PICKER_CHIP]);

    const restarted = advancePyoaBookPlay(state, PYOA_RESTART_CHIP, { book });
    expect(restarted.currentNodeId).toBe(book.startId);
    expect(restarted.deathId == null || restarted.deathId === null).toBe(true);
  });

  it('dice book: check is engine-rolled, reload-stable, luck optional', () => {
    const book = loadPyoaBook('tide-that-did-not-return', { fresh: true });
    let state = initPyoaBookPlay('tide-that-did-not-return', { seed: 42, book });
    expect(state.dice?.stats.MIGHT).toBe(2);
    expect(state.dice?.stamina).toBe(10);
    // Start is often a bottleneck → first-arrival +1 LUCK (rules: 3 → 4).
    expect(state.dice?.luck).toBeGreaterThanOrEqual(3);
    expect(state.dice?.luck).toBeLessThanOrEqual(5);

    const check = book.nodeList.find((n) => n.kind === 'check' && n.check);
    expect(check).toBeTruthy();
    const visit = 1;
    const rollA = performPyoaCheck({
      seed: 42,
      sectionId: check!.id,
      visit,
      stat: check!.check!.stat,
      target: check!.check!.target,
      label: check!.check!.label,
      sheet: state.dice!,
    });
    const rollB = performPyoaCheck({
      seed: 42,
      sectionId: check!.id,
      visit,
      stat: check!.check!.stat,
      target: check!.check!.target,
      label: check!.check!.label,
      sheet: state.dice!,
    });
    expect(rollA.die1).toBe(rollB.die1);
    expect(rollA.die2).toBe(rollB.die2);

    state = {
      ...state,
      currentNodeId: check!.id,
      visitCount: { ...state.visitCount, [check!.id]: visit },
      pendingRoll: rollA,
    };

    expect(buildPyoaPlayView(state, { book }).diceLine).toMatch(/2d6/);

    if (rollA.outcome !== 'full' && (state.dice?.luck ?? 0) > 0) {
      const before = state.dice!.luck;
      state = advancePyoaBookPlay(state, PYOA_LUCK_PUSH_CHIP, { book });
      expect(state.pendingRoll?.usedLuck).toBe(true);
      expect(state.dice!.luck).toBe(before - 1);
    }
    const after = advancePyoaBookPlay(state, PYOA_CONTINUE_CHECK_CHIP, { book });
    expect(after.pendingRoll).toBeNull();
    expect(after.currentNodeId).not.toBe(check!.id);
  });

  it('Umbra loads through the shared play runtime', () => {
    const book = loadPyoaBook('umbra-protocol', { fresh: true });
    const state = initPyoaBookPlay('umbra-protocol', { seed: 9, book });
    const view = buildPyoaPlayView(state, { book });
    expect(view.pageText.toLowerCase()).toMatch(/archbishop|bell/);
    expect(view.choices.length).toBeGreaterThan(0);
  });
});
