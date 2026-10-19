/**
 * q51e-AIPOVL2: overlay dismiss never presses a commit button, a reset stops
 * the bible, and a skipped vote on a new reply fails the run.
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
};

function matches(n: Node, sel: string) {
  if (sel === 'button') return n.tagName === 'BUTTON';
  if (sel === 'button.sgm-choice-btn') {
    return n.tagName === 'BUTTON' && n.className.split(/\s+/).includes('sgm-choice-btn');
  }
  return false;
}

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
    getAttribute(name: string) { return this.attrs[name] ?? null; },
    append(child: Node) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    querySelectorAll(sel: string) {
      const out: Node[] = [];
      const walk = (n: Node) => {
        if (matches(n, sel)) out.push(n);
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
  querySelectorAll: (sel: string) => unknown;
  elementFromPoint: (x: number, y: number) => unknown;
}) {
  let escapes = 0;
  return {
    escapes: () => escapes,
    async evaluate(fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
      const prev = globalThis.document;
      (globalThis as { document: unknown }).document = doc;
      try { return await fn(...args); }
      finally { (globalThis as { document: unknown }).document = prev; }
    },
    keyboard: { press: async (key: string) => { if (key === 'Escape') escapes += 1; } },
  };
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
    elementFromPoint() {
      return hit();
    },
  };
  return { doc, ta, body };
}

describe('q51e-AIPOVL2 overlay dismiss', () => {
  it('main-quest dialog: no text button is clicked, cover stays, chip fallback runs', async () => {
    const { clearInputCover, bindCoverLog } = await load('scripts/ai-player-browser/overlay.mjs');
    const { clickChip } = await load('scripts/ai-player-browser/gameTab.mjs');
    const events: { event: string; caller: string }[] = [];
    bindCoverLog((row: { event: string; caller: string }) => events.push(row));
    let open = true;
    const { doc, ta, body } = boxDoc(() => (open ? dialog : ta));
    const dialog = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'The quest is complete',
    });
    const keep = el('button', { attrs: { type: 'button' }, text: 'Continue' });
    const finish = el('button', { attrs: { type: 'button' }, text: 'Finish', onClick: () => { open = false; } });
    const row = el('div');
    row.append(keep);
    row.append(finish);
    dialog.append(row);
    body.append(dialog);
    const chip = el('button', { className: 'sgm-choice-btn', text: 'Look around' });
    body.append(chip);
    const page = pageFor(doc);
    const result = await clearInputCover(page, 'dismissAutoFightTip');
    expect(result.cleared).toBe(false);
    expect(keep.clicks).toBe(0);
    expect(finish.clicks).toBe(0);
    expect(events[0]).toMatchObject({ event: 'overlay_blocked', caller: 'dismissAutoFightTip' });
    const acted = await clickChip(page, 'Look around');
    expect(acted).toBe('Look around');
    expect(chip.clicks).toBe(1);
    expect(finish.clicks).toBe(0);
    bindCoverLog(null);
  });

  it('new-game dialog submit control is never clicked', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    const { doc, body } = boxDoc(() => panel);
    const shell = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
    });
    const panel = el('div', { className: 'sgm-modal-shell', text: 'Quick Start' });
    const start = el('button', { attrs: { type: 'submit' }, text: 'Begin Journey' });
    panel.append(start);
    shell.append(panel);
    body.append(shell);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(false);
    expect(start.clicks).toBe(0);
    expect(shell.clicks).toBe(0);
  });

  it('an icon-only control with an svg child clears the cover', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta, body } = boxDoc(() => (open ? shell : ta));
    const shell = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
    });
    const icon = el('button', {
      attrs: { 'aria-label': 'Dismiss' },
      onClick: () => { open = false; },
    });
    icon.append(el('svg'));
    shell.append(icon);
    body.append(shell);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(true);
    expect(icon.clicks).toBe(1);
    expect(result.steps).toContain('control');
  });

  it('a backdrop-closing quest unlock dialog clears on the root click', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta, body } = boxDoc(() => (open ? backdrop : ta));
    const backdrop = el('div', {
      className: 'fixed inset-0 z-[60]',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Quest unlocked',
      onClick: () => { open = false; },
    });
    const cont = el('button', { text: 'Continue' });
    backdrop.append(cont);
    body.append(backdrop);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(true);
    expect(result.steps).toEqual(['escape', 'backdrop']);
    expect(cont.clicks).toBe(0);
    expect(backdrop.clicks).toBe(1);
  });

  it('a submit control and a control inside a form are never clicked', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    const { doc, body } = boxDoc(() => shell);
    const shell = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
    });
    const submit = el('button', { attrs: { type: 'submit', 'aria-label': 'Dismiss' } });
    const form = el('form');
    const inner = el('button', { attrs: { 'aria-label': 'Dismiss', 'data-close': '' } });
    inner.append(el('svg'));
    form.append(inner);
    shell.append(submit);
    shell.append(form);
    body.append(shell);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(false);
    expect(submit.clicks).toBe(0);
    expect(inner.clicks).toBe(0);
  });

  it('dismissAutoFightTip and clickChip log overlay events with the caller', async () => {
    const { bindCoverLog } = await load('scripts/ai-player-browser/overlay.mjs');
    const { dismissAutoFightTip, clickChip } = await load('scripts/ai-player-browser/gameTab.mjs');
    const events: { event: string; caller: string }[] = [];
    bindCoverLog((row: { event: string; caller: string }) => events.push(row));
    const { doc, body } = boxDoc(() => shell);
    const shell = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Still here',
    });
    shell.append(el('button', { text: 'Finish' }));
    body.append(shell);
    body.append(el('button', { className: 'sgm-choice-btn', text: 'Look around' }));
    const page = pageFor(doc);
    await dismissAutoFightTip(page);
    await clickChip(page, 'Look around');
    expect(events.map((e) => e.caller)).toEqual(['dismissAutoFightTip', 'clickChip']);
    expect(events.every((e) => e.event === 'overlay_blocked' || e.event === 'overlay_cleared')).toBe(true);
    bindCoverLog(null);
  });
});

describe('q51e-AIPOVL2 reset guard and verdict', () => {
  it('a save id change stops the bible before another vote', async () => {
    const { stepResetGuard } = await load('scripts/ai-player-browser/run.mjs');
    const votes: number[] = [];
    const vote = (turn: number) => votes.push(turn);
    const first = stepResetGuard({
      baseline: null,
      snap: { saveId: '69597d0a', gmStoryCount: 4, nameStep: false },
      turn: 1,
      vote,
    });
    expect(first.stop).toBeNull();
    expect(first.voted).toBe(true);
    const stopped = stepResetGuard({
      baseline: first.baseline,
      snap: { saveId: 'new-save', gmStoryCount: 4, nameStep: true, inNewGame: true },
      turn: 5,
      vote,
    });
    expect(stopped.voted).toBe(false);
    expect(stopped.stop.ok).toBe(false);
    expect(stopped.stop.harnessError).toBe('game_reset');
    expect(stopped.reset.event).toBe('game_reset');
    expect(stopped.reset.evidence).toContain('save_id');
    expect(votes).toEqual([1]);
  });

  it('a story count drop is a game reset and is not voted', async () => {
    const { stepResetGuard } = await load('scripts/ai-player-browser/run.mjs');
    const votes: number[] = [];
    const first = stepResetGuard({
      baseline: null,
      snap: { saveId: '69597d0a', gmStoryCount: 4 },
      turn: 1,
      vote: (turn: number) => votes.push(turn),
    });
    const stopped = stepResetGuard({
      baseline: first.baseline,
      snap: { saveId: '69597d0a', gmStoryCount: 1 },
      turn: 5,
      vote: (turn: number) => votes.push(turn),
    });
    expect(stopped.reset.evidence).toContain('story_count');
    expect(stopped.stop.harnessError).toBe('game_reset');
    expect(stopped.voted).toBe(false);
    expect(votes).toEqual([1]);
  });

  it('a skipped vote on a new reply fails; a carried vote stays ok', async () => {
    const { runVerdict } = await load('scripts/ai-player-browser/runVerdict.mjs');
    const skipped = runVerdict([{
      bibleId: 'summoned-pact',
      ok: true,
      harnessErrors: 0,
      unverified: 0,
      softWarnings: 2,
      turnLog: [{ newGmBubble: true, thumbSkipped: 'already_voted', voteCarried: false }],
    }]);
    expect(skipped.ok).toBe(false);
    expect(skipped.problems).toContain('skipped_vote_on_new_reply');
    const carried = runVerdict([{
      bibleId: 'summoned-pact',
      ok: true,
      harnessErrors: 0,
      unverified: 0,
      softWarnings: 2,
      turnLog: [{ newGmBubble: true, thumbSkipped: 'already_voted', voteCarried: true }],
    }]);
    expect(carried.ok).toBe(true);
    const reset = runVerdict([{ bibleId: 'summoned-pact', ok: false, harnessError: 'game_reset' }]);
    expect(reset.ok).toBe(false);
    expect(reset.problems).toContain('game_reset');
  });

  it('(j) only the text button marked data-dismiss is clicked', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta, body } = boxDoc(() => (open ? dialog : ta));
    const dialog = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      text: 'Two choices',
    });
    const dismiss = el('button', {
      attrs: { type: 'button', 'data-dismiss': '' },
      text: 'Continue',
      onClick: () => { open = false; },
    });
    const other = el('button', { attrs: { type: 'button' }, text: 'Open journal' });
    const row = el('div');
    row.append(dismiss);
    row.append(other);
    dialog.append(row);
    body.append(dialog);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(true);
    expect(dismiss.clicks).toBe(1);
    expect(other.clicks).toBe(0);
  });

  it('(k) main-quest Continue is dismissed; Finish is never clicked', async () => {
    const { clearInputCover } = await load('scripts/ai-player-browser/overlay.mjs');
    let open = true;
    const { doc, ta, body } = boxDoc(() => (open ? dialog : ta));
    const dialog = el('div', {
      className: 'fixed inset-0 z-50',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'data-testid': 'main-quest-complete' },
      text: 'You have completed the main quest.',
    });
    const keep = el('button', {
      attrs: { type: 'button', 'data-dismiss': '' },
      text: 'Continue',
      onClick: () => { open = false; },
    });
    const finish = el('button', { attrs: { type: 'button' }, text: 'Finish', onClick: () => { open = false; } });
    const row = el('div');
    row.append(keep);
    row.append(finish);
    dialog.append(row);
    body.append(dialog);
    const page = pageFor(doc);
    const result = await clearInputCover(page);
    expect(result.cleared).toBe(true);
    expect(keep.clicks).toBe(1);
    expect(finish.clicks).toBe(0);
  });

  it('overlay source does not match button label text', () => {
    const src = readFileSync(resolve('scripts/ai-player-browser/overlay.mjs'), 'utf8');
    const body = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/data-dismiss/g, '')
      .replace(/data-close/g, '');
    expect(body).not.toMatch(/\/[^/\n]*\/[gimsuy]*/);
    expect(body).not.toMatch(/['"`](?:close|continue|finish|got it|open journal)['"`]/i);
    expect(body).not.toMatch(/textContent[\s\S]{0,60}(?:===|includes|\.match)\s*\(/);
  });
});
