/**
 * PI3: whole-book link integrity + seeded offline playthroughs to an ending
 * for each of the six authored PYOA books. No network / no paid AI.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { listPyoaAuthoredBooks } from './pyoaBookCatalog';
import { clearPyoaBookCache, loadPyoaBook } from './pyoaBookLoader';
import {
  advancePyoaBookPlay,
  buildPyoaPlayView,
  initPyoaBookPlay,
  type PyoaPlayView,
} from './pyoaBookPlay';
import type { CompiledPyoaBook, PyoaBookPlayState } from './pyoaBookTypes';
import { validatePyoaBook } from './pyoaBookValidate';

const PLAY_SEEDS = [1, 2, 3, 7, 11, 42, 99, 123, 256, 999, 2026, 4096] as const;
const MAX_STEPS = 8000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickChoice(view: PyoaPlayView, rng: () => number, visited: Set<string>): string | null {
  const choices = view.choices;
  if (!choices.length) return null;
  // Prefer Continue / luck on dice checks; otherwise prefer exits to unseen nodes.
  if (view.state.pendingRoll) {
    const cont = choices.find((c) => /^continue$/i.test(c.label));
    if (cont) return cont.label;
  }
  const scored = choices.map((c) => {
    const exit = view.node.exits.find(
      (e) => e.label === c.label || e.id === c.label || e.id === c.id
    );
    const to = exit?.to ?? '';
    const unseen = to && !visited.has(to) ? 1 : 0;
    const doomish = /die|death|doom|give up|surrender|jump|fall to/i.test(c.label) ? -1 : 0;
    return { label: c.label, score: unseen * 2 + doomish + rng() };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.label ?? null;
}

function playToTerminal(
  book: CompiledPyoaBook,
  seed: number
): { kind: 'ending' | 'death' | 'stuck'; nodeId: string; steps: number } {
  let state: PyoaBookPlayState = initPyoaBookPlay(book.id, { seed, book });
  const rng = mulberry32(seed);
  const visited = new Set<string>([state.currentNodeId]);

  for (let step = 0; step < MAX_STEPS; step++) {
    const view = buildPyoaPlayView(state, { book });
    if (view.terminal === 'ending') {
      return { kind: 'ending', nodeId: state.currentNodeId, steps: step };
    }
    if (view.terminal === 'death') {
      return { kind: 'death', nodeId: state.currentNodeId, steps: step };
    }
    const label = pickChoice(view, rng, visited);
    if (!label) return { kind: 'stuck', nodeId: state.currentNodeId, steps: step };
    const before = state.currentNodeId;
    const hadPending = !!state.pendingRoll;
    state = advancePyoaBookPlay(state, label, { book });
    const moved = state.currentNodeId !== before;
    const rolled = !hadPending && !!state.pendingRoll;
    const resolved = hadPending && !state.pendingRoll;
    if (!moved && !rolled && !resolved) {
      return { kind: 'stuck', nodeId: state.currentNodeId, steps: step };
    }
    visited.add(state.currentNodeId);
  }
  return { kind: 'stuck', nodeId: state.currentNodeId, steps: MAX_STEPS };
}

describe('pyoaBooks.playthrough', () => {
  beforeEach(() => clearPyoaBookCache());

  it('every authored book has no dead links (whole book)', () => {
    for (const entry of listPyoaAuthoredBooks()) {
      const book = loadPyoaBook(entry.id, { strict: true, fresh: true });
      const v = validatePyoaBook(book);
      const dead = v.issues.filter((i) => i.code === 'unknown_link' || i.code === 'missing_section');
      expect(dead, `${entry.id}: ${dead.map((d) => d.message).join(' | ')}`).toEqual([]);
      expect(v.ok, `${entry.id}: ${v.issues.slice(0, 5).map((i) => i.message).join(' | ')}`).toBe(
        true
      );
      // Every exit target exists
      for (const node of book.nodeList) {
        for (const e of node.exits) {
          expect(book.nodes.has(e.to), `${entry.id} ${node.id} → ${e.to}`).toBe(true);
        }
      }
    }
  });

  it('each book reaches at least one ending under seeded offline play', () => {
    const summary: Record<string, { endings: number; deaths: number; stuck: number; sample?: string }> =
      {};

    for (const entry of listPyoaAuthoredBooks()) {
      const book = loadPyoaBook(entry.id, { strict: true, fresh: true });
      let endings = 0;
      let deaths = 0;
      let stuck = 0;
      let sampleEnding: string | undefined;

      for (const seed of PLAY_SEEDS) {
        const result = playToTerminal(book, seed);
        if (result.kind === 'ending') {
          endings += 1;
          sampleEnding ??= `${result.nodeId}@seed${seed}`;
        } else if (result.kind === 'death') {
          deaths += 1;
        } else {
          stuck += 1;
        }
        if (endings >= 1 && endings + deaths >= 3) {
          // Enough evidence; still finish a few more seeds for dice variance
          if (entry.type === 'pick' || endings >= 2) break;
        }
      }

      summary[entry.id] = { endings, deaths, stuck, sample: sampleEnding };
      expect(
        endings,
        `${entry.id} never reached an ending (deaths=${deaths}, stuck=${stuck})`
      ).toBeGreaterThanOrEqual(1);
    }

    // Keep a readable failure breadcrumb in the runner log
    // eslint-disable-next-line no-console
    console.log('pyoaBooks.playthrough summary', summary);
  });
});
