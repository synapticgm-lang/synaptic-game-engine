/**
 * q51d-AIPOVL: the AI-player harness clears whatever covers the action box.
 * No model, no browser, no network.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

type Node = {
  tagName: string;
  id: string;
  className: string;
  style: { position?: string };
  textContent: string;
  innerText: string;
  disabled: boolean;
  parentElement: Node | null;
  children: Node[];
  clicks: number;
  attrs: Record<string, string>;
  getAttribute: (name: string) => string | null;
  append: (child: Node) => Node;
  querySelectorAll: (sel: string) => Node[];
  click: () => void;
  contains: (other: Node) => boolean;
  getBoundingClientRect: () => { x: number; y: number; width: number; height: number };
  __coverClick?: { x: number; y: number };
};

function el(tag: string, opts: {
  id?: string;
  className?: string;
  text?: string;
  attrs?: Record<string, string>;
  rect?: { x: number; y: number; width: number; height: number };
  onClick?: () => void;
} = {}): Node {
  const node = {
    tagName: tag.toUpperCase(),
    id: opts.id || '',
    className: opts.className || '',
    style: {},
    textContent: opts.text || '',
    innerText: opts.text || '',
    disabled: false,
    parentElement: null as Node | null,
    children: [] as Node[],
    clicks: 0,
    attrs: { ...(opts.attrs || {}) },
    getAttribute(name: string) { return this.attrs[name] || null; },
    append(child: Node) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    querySelectorAll(sel: string) {
      const out: Node[] = [];
      const walk = (n: Node) => {
        if (sel === 'button' && n.tagName === 'BUTTON') out.push(n);
        for (const c of n.children) walk(c);
      };
      for (const c of this.children) walk(c);
      return out;
    },
    click() {
      this.clicks += 1;
      opts.onClick?.();
    },
    contains(other: Node) {
      let n: Node | null = other;
      while (n) {
        if (n === this) return true;
        n = n.parentElement;
      }
      return false;
    },
    getBoundingClientRect() {
      return opts.rect || { x: 0, y: 0, width: 0, height: 0 };
    },
  };
  return node;
}

function pageFor(doc: {
  querySelector: (sel: string) => unknown;
  elementFromPoint: (x: number, y: number) => unknown;
}) {
  let escapes = 0;
  const page = {
    escapes: () => escapes,
    async evaluate(fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
      const prev = globalThis.document;
      (globalThis as { document: unknown }).document = doc;
      try { return await fn(...args); }
      finally { (globalThis as { document: unknown }).document = prev; }
    },
    keyboard: {
      press: async (key: string) => { if (key === 'Escape') escapes += 1; },
      down: async () => {},
      up: async () => {},
    },
    mouse: { click: async () => {} },
    $: async () => doc.querySelector('[aria-label="Player action input"]'),
    async createCDPSession() {
      return { send: async () => {} };
    },
  };
  return page;
}

function boxDoc(hit: () => unknown) {
  const ta = el('textarea', {
    attrs: { 'aria-label': 'Player action input' },
    rect: { x: 0, y: 400, width: 200, height: 40 },
  });
  const body = el('body');
  body.append(ta);
  const doc = {
    documentElement: el('html'),
    body,
    querySelector(sel: string) {
      if (sel === '[aria-label="Player action input"]') return ta;
      return null;
    },
    querySelectorAll(sel: string) {
      return body.querySelectorAll(sel);
    },
    elementFromPoint(_x: number, _y: number) {
      return hit();
    },
  };
  return { doc, ta, body };
}

describe('q51d-AIPOVL overlay dismiss', () => {
  it('box on top: coverAtInput is null and nothing is clicked', async () => {
    const { coverAtInput, clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    const { doc, ta } = boxDoc(() => ta);
    const page = pageFor(doc);
    expect(await coverAtInput(page)).toBeNull();
    const cleared = await clearInputCover(page);
    expect(cleared).toMatchObject({ cleared: true, steps: [], cover: null });
    expect(page.escapes()).toBe(0);
    expect(ta.clicks).toBe(0);
  });

  it('quest-unlock dialog: Escape, then a backdrop click at the box centre', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta } = boxDoc(() => (open ? backdrop : ta));
    const backdrop = el('div', {
      className: 'fixed inset-0 z-[60]',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Quest unlocked Echoes of a Dead Summoner Open journal Continue',
      onClick: () => { open = false; },
    });
    const panel = el('div', { className: 'sgm-modal-shell' });
    const footer = el('div');
    const journal = el('button', { text: 'Open journal' });
    const cont = el('button', { text: 'Continue', onClick: () => { open = false; } });
    footer.append(journal);
    footer.append(cont);
    panel.append(footer);
    backdrop.append(panel);
    doc.body.append(backdrop);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(page.escapes()).toBe(1);
    expect(result.cleared).toBe(true);
    expect(result.steps).toEqual(['escape', 'backdrop']);
    expect(result.cover.selector).toBe('div.fixed.inset-0.z-[60]');
    expect(result.cover.text).toContain('Quest unlocked');
    expect(backdrop.__coverClick).toEqual({ x: 100, y: 420 });
    expect(journal.clicks).toBe(0);
    expect(cont.clicks).toBe(0);
    expect(open).toBe(false);
  });

  it('dialog that ignores Escape and the backdrop does not press a text button', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta } = boxDoc(() => (open ? backdrop : ta));
    const backdrop = el('div', {
      className: 'fixed inset-0 z-[60]',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Still here',
    });
    const footer = el('div');
    const first = el('button', { text: 'Open journal' });
    const last = el('button', { text: 'Continue', onClick: () => { open = false; } });
    footer.append(first);
    footer.append(last);
    backdrop.append(footer);
    doc.body.append(backdrop);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(false);
    expect(result.steps).toEqual(['escape', 'backdrop']);
    expect(first.clicks).toBe(0);
    expect(last.clicks).toBe(0);
    expect(open).toBe(true);
  });

  it('an icon-only close button is preferred over footer buttons', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta } = boxDoc(() => (open ? backdrop : ta));
    const backdrop = el('div', {
      className: 'fixed inset-0 z-[60]',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Panel',
    });
    const icon = el('button', {
      attrs: { 'aria-label': 'Close' },
      onClick: () => { open = false; },
    });
    const footer = el('div');
    const first = el('button', { text: 'Open journal' });
    const last = el('button', { text: 'Continue' });
    footer.append(first);
    footer.append(last);
    backdrop.append(icon);
    backdrop.append(footer);
    doc.body.append(backdrop);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(true);
    expect(icon.clicks).toBe(1);
    expect(first.clicks).toBe(0);
    expect(last.clicks).toBe(0);
    expect(result.steps).toContain('control');
  });

  it('Auto Fight tip uses the same route and gameTab has no Got it text match', async () => {
    const { dismissAutoFightTip } = await load('scripts/ai-player-browser/gameTab.mjs');
    let open = true;
    const { doc, ta } = boxDoc(() => (open ? backdrop : ta));
    const backdrop = el('div', {
      className: 'fixed inset-0 z-[55]',
      text: 'Tip Save turns with Auto Fight',
    });
    const footer = el('div');
    const got = el('button', { text: 'Got it' });
    const enable = el('button', { text: 'Turn on Auto Fight', onClick: () => { open = false; } });
    footer.append(got);
    footer.append(enable);
    backdrop.append(footer);
    doc.body.append(backdrop);
    const page = pageFor(doc);
    expect(await dismissAutoFightTip(page)).toBe(false);
    expect(open).toBe(true);
    expect(got.clicks).toBe(0);
    expect(enable.clicks).toBe(0);
    const src = readFileSync(resolve('scripts/ai-player-browser/gameTab.mjs'), 'utf8');
    expect(src).not.toMatch(/Got it/);
  });

  it('a cover that survives is cleared false after exactly one attempt', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    const { doc } = boxDoc(() => backdrop);
    const backdrop = el('div', {
      className: 'fixed inset-0 z-[60]',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Stuck',
    });
    const footer = el('div');
    const last = el('button', { text: 'Continue' });
    footer.append(last);
    backdrop.append(footer);
    doc.body.append(backdrop);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(false);
    expect(result.steps).toEqual(['escape', 'backdrop']);
    expect(page.escapes()).toBe(1);
    expect(last.clicks).toBe(0);
    expect(result.cover.selector).toContain('fixed');
    expect(result.cover.text).toContain('Stuck');
  });
});

describe('q51d-AIPOVL run rows', () => {
  it('overlay_blocked plus a completed chip is a soft warning; no chip is a harness error', async () => {
    const { classifyOverlayTurn, withSoftWarningTotal } = await load('scripts/ai-player-browser/run.mjs');
    const { runVerdict } = await load('scripts/ai-player-browser/runVerdict.mjs');
    const soft = classifyOverlayTurn({ overlayBlocked: true, chipCompleted: true, newGm: true });
    expect(soft).toEqual({ softWarnings: 1, harnessErrors: 0 });
    const softVerdict = runVerdict([{
      bibleId: 'summoned-pact', ok: true, harnessErrors: soft.harnessErrors, unverified: 0, softWarnings: soft.softWarnings,
    }]);
    expect(softVerdict.ok).toBe(true);
    expect(softVerdict.problems.join(' ')).not.toMatch(/soft/);
    const printed = withSoftWarningTotal({ results: [{ softWarnings: soft.softWarnings }] });
    expect(printed.softWarnings).toBe(1);

    const stuck = classifyOverlayTurn({ overlayBlocked: true, chipCompleted: false, newGm: false });
    expect(stuck).toEqual({ softWarnings: 0, harnessErrors: 1 });
    expect(runVerdict([{
      bibleId: 'summoned-pact', ok: true, harnessErrors: stuck.harnessErrors, unverified: 0,
    }]).ok).toBe(false);
    expect(runVerdict([{ bibleId: 'summoned-pact', ok: false, error: 'boom', softWarnings: 3 }]).ok).toBe(false);
    expect(runVerdict([{ bibleId: 'summoned-pact', ok: true, unverified: 1, softWarnings: 4 }]).ok).toBe(false);
  });

  it('a re-asked turn carries the first vote and the thumb is pressed once', async () => {
    const { nextVoteAction } = await load('scripts/ai-player-browser/run.mjs');
    const { shouldThumb } = await load('scripts/ai-player-browser/runVerdict.mjs');
    const presses: string[] = [];
    const firstPlan = nextVoteAction(null);
    expect(firstPlan.press).toBe(true);
    presses.push('thumb');
    const firstVote = {
      verified: true,
      verifyReason: 'matched',
      feedbackKey: { logEntryId: 'log-1' },
      thumb: { thumb: 'up', ok: true, reason: 'fine' },
      thumbOk: true,
      thumbReason: 'fine',
    };
    const again = nextVoteAction(firstVote);
    expect(again.press).toBe(false);
    expect(again.voteCarried).toBe(true);
    expect(again.verified).toBe(true);
    expect(again.verifyReason).toBe('matched');
    expect(again.feedbackKey).toEqual({ logEntryId: 'log-1' });
    expect(presses).toEqual(['thumb']);
    expect(shouldThumb({ feedbacks: 1, votedFeedbacks: 1 })).toEqual({ vote: false, reason: 'already_voted' });
  });
});
