/**
 * q51c-AIPLOG: per-turn time and place on the AI-player log.
 * No model, no browser, no network — fake clock and a mocked page.
 */
import { describe, expect, it, afterEach, vi } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

class FakeEl {
  tag: string;
  classes: Set<string>;
  text: string;
  kids: FakeEl[];

  constructor(tag: string, classes: string[], text: string, kids: FakeEl[] = []) {
    this.tag = tag;
    this.classes = new Set(classes);
    this.text = text;
    this.kids = kids;
  }

  get textContent(): string {
    const parts: string[] = [this.text];
    for (const kid of this.kids) parts.push(kid.textContent);
    return parts.join('');
  }

  querySelector(sel: string) {
    return this.querySelectorAll(sel)[0] ?? null;
  }

  querySelectorAll(sel: string) {
    const out: FakeEl[] = [];
    const walk = (el: FakeEl) => {
      if (selMatches(el, sel)) out.push(el);
      for (const kid of el.kids) walk(kid);
    };
    for (const kid of this.kids) walk(kid);
    return out;
  }
}

function selMatches(el: FakeEl, sel: string) {
  const bits = sel.split('.');
  const tag = sel.startsWith('.') ? '' : bits[0];
  const classes = sel.startsWith('.') ? bits.slice(1) : bits.slice(1);
  if (tag && el.tag !== tag) return false;
  return classes.every((c) => c && el.classes.has(c));
}

function fakeIdb(save: unknown) {
  return {
    open() {
      const req: {
        result?: unknown;
        onsuccess?: () => void;
        onerror?: () => void;
      } = {};
      queueMicrotask(() => {
        req.result = {
          objectStoreNames: { contains: (name: string) => name === 'game' },
          transaction() {
            return {
              objectStore() {
                return {
                  get() {
                    const getReq: { result?: unknown; onsuccess?: () => void; onerror?: () => void } = {};
                    queueMicrotask(() => {
                      getReq.result = save;
                      getReq.onsuccess?.();
                    });
                    return getReq;
                  },
                };
              },
            };
          },
        };
        req.onsuccess?.();
      });
      return req;
    },
  };
}

function mockPage(doc: FakeEl, save: unknown) {
  return {
    async evaluate(fn: () => Promise<unknown>) {
      const prevDoc = (globalThis as { document?: unknown }).document;
      const prevIdb = (globalThis as { indexedDB?: unknown }).indexedDB;
      (globalThis as { document?: unknown }).document = doc;
      (globalThis as { indexedDB?: unknown }).indexedDB = fakeIdb(save);
      try {
        return await fn();
      } finally {
        (globalThis as { document?: unknown }).document = prevDoc;
        (globalThis as { indexedDB?: unknown }).indexedDB = prevIdb;
      }
    },
  };
}

describe('q51c-AIPLOG aipLog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ts is ISO and replyMs is the fake-clock gap from submit to reply-finished', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T16:29:00.000Z'));
    const { startTurnClock, replyMsSince, turnTimeFields } = await load(
      'scripts/ai-player-browser/turnTiming.mjs',
    ) as {
      startTurnClock: () => { ms: number; iso: string };
      replyMsSince: (stamp: { ms: number }) => number;
      turnTimeFields: (stamp: { ms: number; iso: string }, now?: number) => { ts: string; replyMs: number };
    };
    const stamp = startTurnClock();
    vi.setSystemTime(new Date('2026-10-18T16:29:02.500Z'));
    expect(replyMsSince(stamp)).toBe(2500);
    const fields = turnTimeFields(stamp, Date.now());
    expect(fields.replyMs).toBe(2500);
    expect(fields.ts).toBe('2026-10-18T16:29:00.000Z');
    expect(Number.isNaN(Date.parse(fields.ts))).toBe(false);
  });

  it('readPlace uses the UI label, then the save id, and none without throwing', async () => {
    const { readPlace } = await load('scripts/ai-player-browser/gameTab.mjs') as {
      readPlace: (page: unknown) => Promise<{ place: string | null; placeId: string | null; placeSource: string }>;
    };
    const room = new FakeEl('span', ['text-amber-300', 'font-semibold'], 'Warm plunge');
    const title = new FakeEl('h2', ['sgm-adventure-map-title'], 'Bathhouse');
    const header = new FakeEl('div', ['sgm-adventure-map-header'], '', [title, room]);
    const ui = await readPlace(mockPage(new FakeEl('doc', [], '', [header]), null));
    expect(ui.place).toBe('Warm plunge');
    expect(ui.placeSource).toBe('ui');

    const save = await readPlace(mockPage(new FakeEl('doc', [], '', []), {
      currentLocation: 'keep-hall',
      places: [{ id: 'keep-hall', name: 'The Keep Hall' }],
      locationSheet: { name: 'The Keep Hall' },
    }));
    expect(save.placeSource).toBe('save');
    expect(save.placeId).toBe('keep-hall');
    expect(save.place).toBe('The Keep Hall');

    const missing = await readPlace(mockPage(new FakeEl('doc', [], '', []), null));
    expect(missing).toEqual({ place: null, placeId: null, placeSource: 'none' });

    const thrown = await readPlace({
      evaluate: async () => {
        throw new Error('page gone');
      },
    });
    expect(thrown).toEqual({ place: null, placeId: null, placeSource: 'none' });
    expect(await readPlace(null)).toEqual({ place: null, placeId: null, placeSource: 'none' });
  });

  it('turn row helper keeps q51 fields and adds time and place', async () => {
    const { buildTurnLogRow, turnTranscriptHeading } = await load(
      'scripts/ai-player-browser/run.mjs',
    ) as {
      buildTurnLogRow: (row: Record<string, unknown>) => Record<string, unknown>;
      turnTranscriptHeading: (turn: number, place: string, replyMs: number) => string;
    };
    const row = buildTurnLogRow({
      turn: 4,
      bibleId: 'cursed-keep',
      saveId: 'aitest-run',
      playerAction: 'Look around',
      chipsSeen: ['Look around', 'Wait'],
      gmStory: 'The hall stayed still.',
      thumb: 'up',
      verified: true,
      waitTimedOut: false,
      ts: '2026-10-18T16:29:00.000Z',
      replyMs: 2500,
      place: 'The Keep Hall',
      placeId: 'keep-hall',
      placeSource: 'ui',
    });
    expect(row.event).toBe('turn');
    expect(row.turn).toBe(4);
    expect(row.bibleId).toBe('cursed-keep');
    expect(row.saveId).toBe('aitest-run');
    expect(row.playerAction).toBe('Look around');
    expect(row.chipsSeen).toEqual(['Look around', 'Wait']);
    expect(row.gmStory).toBe('The hall stayed still.');
    expect(row.thumb).toBe('up');
    expect(row.verified).toBe(true);
    expect(row.ts).toBe('2026-10-18T16:29:00.000Z');
    expect(row.replyMs).toBe(2500);
    expect(row.place).toBe('The Keep Hall');
    expect(row.placeId).toBe('keep-hall');
    expect(row.placeSource).toBe('ui');
    expect(row.waitTimedOut).toBe(false);

    const timedOut = buildTurnLogRow({
      waitTimedOut: true,
      turn: 5,
      bibleId: 'cursed-keep',
      saveId: 'aitest-run',
      playerAction: 'Wait',
      chipsSeen: [],
      gmStory: '',
      thumb: null,
      verified: false,
      ts: '2026-10-18T16:30:00.000Z',
      replyMs: 90000,
      place: null,
      placeId: null,
      placeSource: 'none',
    });
    expect(timedOut.event).toBe('turn_timeout');
    expect(timedOut.waitTimedOut).toBe(true);
    expect(timedOut.replyMs).toBe(90000);
    expect(turnTranscriptHeading(4, 'The Keep Hall', 2500)).toBe('## T4 (The Keep Hall, 2.5s)');
  });
});
