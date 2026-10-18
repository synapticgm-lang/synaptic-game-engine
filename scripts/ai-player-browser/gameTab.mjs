/**
 * Drive a visible game tab. Clicks React controls so sendAction runs.
 * Never close Chrome.
 */
import { clearInputCover, coverAtInput } from './overlay.mjs';
import { setupAdvanced } from './setupStep.mjs';

const BIBLES = {
  'summoned-pact': { mode: 'LitRPG', title: 'The Summoned Pact', chipsOnly: false },
  'cursed-keep': { mode: 'Tabletop Fantasy', title: 'Cursed Keep', chipsOnly: false },
  'salt-road-heist': { mode: 'Story RPG', title: 'Salt Road Heist', chipsOnly: false },
  'thornferry-road': { mode: 'Pick Your Own Adventure', title: 'Thornferry Road', chipsOnly: true },
};

export { BIBLES };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastCoverClear = null;

/** Last clearInputCover result, for the run log. One read. */
export function consumeCoverClear() {
  const v = lastCoverClear;
  lastCoverClear = null;
  return v;
}

async function clickText(page, text, { timeoutMs = 8000, exact = false, root = '' } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const hit = await page.evaluate((needle, exactMatch, rootSel) => {
      const scope = rootSel ? document.querySelector(rootSel) : document;
      if (!scope) return false;
      const nodes = [...scope.querySelectorAll('button, a, [role="button"]')];
      const visible = nodes.filter((n) => {
        if (n.disabled) return false;
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (exactMatch ? t !== needle : !(t === needle || t.includes(needle))) return false;
        const r = n.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const st = getComputedStyle(n);
        if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) === 0) return false;
        return true;
      });
      const exactHit = visible.find((n) => ((n.textContent || '').replace(/\s+/g, ' ').trim()) === needle);
      const el = exactHit || visible[0];
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    }, text, exact, root);
    if (hit) return true;
    await sleep(250);
  }
  return false;
}

export async function readGameSnapshot(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const st = getComputedStyle(el);
      return st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0;
    };
    const chips = [...document.querySelectorAll('button.sgm-choice-btn')]
      .filter((b) => visible(b) && !b.disabled)
      .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim())
      .filter((t) => t && !/^Fate'?s Pick$/i.test(t));
    const combatChips = chips.some((t) =>
      /\b(press the attack|try to flee|parley|attack|flee|strike|engage|fight)\b/i.test(t)
    );
    const autoBtn = document.querySelector('button[title="Auto-resolve combat"]');
    const autoFightReady = Boolean(autoBtn && visible(autoBtn) && !autoBtn.disabled);
    // Real GM book rows only (hasRealGmStory). Never: player bubbles, HUD
    // adventurer cards (.sgm-turn-frame is also used there), or quest chrome.
    // NEVER treat SYSTEM / STATUS / Quest Unlocked as the beat — classic LogRow
    // puts LitrpgSystemWindow (also `.px-4.py-3`) inside the same card as the
    // festival paragraph. querySelector('.px-4.py-3') used to steal that plate.
    const storyRoot = document.querySelector('.sgm-play-story-panel');
    const scope = storyRoot || document.querySelector('.sgm-play-center') || document;
    const isChromeNode = (el) => Boolean(
      el?.closest('[data-sgm-system-window]')
      || el?.closest('[data-sgm-feedback="1"]')
      || el?.closest('.sgm-modal-shell')
    );
    const storyFromCard = (card) => {
      if (!card) return '';
      const paras = [...card.querySelectorAll('.sgm-prose-face')].filter((el) => {
        if (el === card) return false;
        if (isChromeNode(el)) return false;
        if (el.closest('.justify-end')) return false;
        return true;
      });
      if (paras.length) {
        return paras.map((p) => (p.innerText || '').trim()).filter(Boolean).join('\n\n');
      }
      const clone = card.cloneNode(true);
      clone.querySelectorAll('[data-sgm-system-window], [data-sgm-feedback="1"], button').forEach((n) => n.remove());
      return (clone.innerText || '').trim();
    };
    const chromeFromCard = (card) => {
      if (!card) return '';
      return [...card.querySelectorAll('[data-sgm-system-window]')]
        .map((n) => (n.innerText || '').trim())
        .filter(Boolean)
        .join('\n');
    };
    const isRealBook = (text) => {
      const t = String(text || '').replace(/\s+/g, ' ').trim();
      if (t.length < 8 || !/[a-z]/i.test(t)) return false;
      if (/equipped set:|Show Profile/i.test(t) && t.length < 240) return false;
      if (/^(?:_>\s*)?SYSTEM\b/i.test(t) && /\b(?:Name|Level|HP|Registration)\b/i.test(t) && t.length < 400) {
        return false;
      }
      if (/^(?:quest unlocked|xp gained|status:|level up)\b/i.test(t) && t.length < 80) return false;
      return true;
    };
    const gmNarrative = [...scope.querySelectorAll('.sgm-turn-frame')].filter((el) => {
      if (!visible(el)) return false;
      return /\bGame Master\b/i.test(el.innerText || '');
    });
    const gmClassic = [...scope.querySelectorAll('.sgm-prose-face')].filter((el) => {
      if (!visible(el)) return false;
      if (el.closest('.justify-end')) return false;
      if (el.closest('.sgm-turn-frame')) return false;
      if (el.closest('.sgm-modal-shell')) return false;
      if (el.closest('[data-sgm-system-window]')) return false;
      if (el.parentElement?.closest('.sgm-prose-face')) return false;
      return true;
    });
    const gmBlocks = gmNarrative.length ? gmNarrative : gmClassic;
    const storyCards = gmBlocks.map((card) => ({
      story: storyFromCard(card),
      chrome: chromeFromCard(card),
    })).filter((row) => isRealBook(row.story));
    const lastStory = storyCards.at(-1);
    const lastGm = lastStory?.story || '';
    const lastGmChrome = lastStory?.chrome || '';
    const playerLines = [...scope.querySelectorAll('.justify-end .sgm-prose-face')]
      .filter((el) => visible(el) && !el.closest('.sgm-modal-shell'))
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const feedbacks = [...document.querySelectorAll('[data-sgm-feedback="1"]')].filter((el) => {
      return visible(el) && !el.closest('.sgm-modal-shell');
    }).length;
    const gmStoryCount = Math.max(storyCards.length, feedbacks);
    const input = document.querySelector('[aria-label="Player action input"]');
    const body = document.body.innerText || '';
    const busy = Boolean(
      body.includes('Reading your move')
      || body.includes('Resolving the scene')
      || body.includes('The world responds')
      || (input && input.disabled)
    );
    const hasAuth = /Enter the Realm|Sign in with Google|Email sign-in/i.test(body);
    const hasMenu = /Start New Game/i.test(body) && !document.querySelector('.sgm-play-center');
    const modalText = (document.querySelector('.sgm-modal-shell')?.innerText || '');
    const inNewGame = Boolean(
      document.querySelector('.sgm-modal-shell')
      && /Quick Start|Pre-Made|Begin Journey|Someone new this time/i.test(modalText)
    );
    const hasWelcome = /Press any key or tap/i.test(body);
    const hideOptions = /Show options/i.test(body);
    const hideText = /Show text/i.test(body);
    const signedHint = (body.match(/Cloud save \(Supabase\):\s*(\S+)/) || [])[1] || '';
    const playReady = Boolean(
      document.querySelector('.sgm-play-center')
      && ((lastGm && lastGm.length >= 8) || chips.length > 0),
    );
    // Tabletop creation paints this button for the whole chips-only inn-book step.
    const builderBtn = document.querySelector('[data-testid="open-character-builder"]');
    const setupSignal = Boolean(builderBtn && visible(builderBtn));
    const isSystemRow = (el) => {
      if (!visible(el)) return false;
      if (el.closest('.justify-end')) return false;
      if (el.closest('.sgm-turn-frame')) return false;
      if (el.closest('[data-sgm-system-window]')) return false;
      if (el.closest('.sgm-modal-shell')) return false;
      if (el.closest('[data-sgm-feedback="1"]')) return false;
      return (el.innerText || '').trim().length > 0;
    };
    const systemRowCount = [...scope.querySelectorAll('.whitespace-pre-line, .text-center.text-xs')]
      .filter(isSystemRow).length;
    return {
      chips,
      lastGm,
      lastGmChrome,
      playerLines,
      feedbacks,
      gmStoryCount,
      busy,
      hasAuth,
      hasMenu,
      inNewGame,
      hasWelcome,
      hideOptions,
      hideText,
      signedHint,
      inputPresent: Boolean(input),
      playReady,
      combatChips,
      autoFightReady,
      setupSignal,
      systemRowCount,
    };
  });
}

export async function waitPlayIdle(page, { timeoutMs = 120000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await readGameSnapshot(page);
    if (!snap.busy) return snap;
    await sleep(800);
  }
  return readGameSnapshot(page);
}

export async function revealPlayChrome(page) {
  const snap = await readGameSnapshot(page);
  if (snap.hideOptions) await clickText(page, 'Show options', { timeoutMs: 800, exact: true });
  if (snap.hideText) await clickText(page, 'Show text', { timeoutMs: 800, exact: true });
}

/** Attach to an already-open play tab. Never goto / never New Game. */
export async function prepareLivePlay(page) {
  await dismissWelcome(page);
  await dismissQuestUnlock(page);
  await dismissAutoFightTip(page);
  await revealPlayChrome(page);
  return waitPlayIdle(page, { timeoutMs: 20000 });
}

async function dismissQuestUnlock(page) {
  await page.evaluate(() => {
    const modal = document.querySelector('.sgm-modal-shell');
    if (!modal) return;
    const text = (modal.innerText || '');
    if (!/Quest unlocked|Quests unlocked/i.test(text)) return;
    const btn = [...modal.querySelectorAll('button')].find((b) =>
      /^(Continue|Open journal)$/i.test((b.textContent || '').replace(/\s+/g, ' ').trim())
    );
    if (btn && /Continue/i.test(btn.textContent || '')) btn.click();
  });
}

/** Page 1 is local stitch — wait for prose and/or cover chips, not merely !busy. */
export async function waitOpeningReady(page, { timeoutMs = 90000 } = {}) {
  const start = Date.now();
  let last = await readGameSnapshot(page);
  while (Date.now() - start < timeoutMs) {
    await dismissWelcome(page);
    await dismissQuestUnlock(page);
    await dismissAutoFightTip(page);
    await revealPlayChrome(page);
    last = await readGameSnapshot(page);
    const story = (last.lastGm || '').trim();
    const hasStory = story.length >= 8 && !/^(?:_>\s*)?SYSTEM\b/i.test(story);
    const hasChips = last.chips.length > 0;
    if (!last.busy && !last.hasMenu && !last.inNewGame && (hasStory || hasChips) && last.playReady) {
      return last;
    }
    await sleep(400);
  }
  return last;
}

/** A turn is not done until a new GM story bubble lands (hasRealGmStory). Player lines do not count. */
export async function waitNewGmBeat(page, prev, { timeoutMs = 180000 } = {}) {
  const start = Date.now();
  const prevGmCount = Number(prev.gmStoryCount || 0);
  const prevFeedbacks = Number(prev.feedbacks || 0);
  const prevStory = (prev.lastGm || '').trim();
  while (Date.now() - start < timeoutMs) {
    await dismissQuestUnlock(page);
    const snap = await readGameSnapshot(page);
    const story = (snap.lastGm || '').trim();
    const countGrew = Number(snap.gmStoryCount || 0) > prevGmCount
      || Number(snap.feedbacks || 0) > prevFeedbacks;
    const storyChanged = Boolean(story && story !== prevStory);
    const newGmBubble = countGrew || storyChanged;
    const hudNotBook = /equipped set:|Show Profile/i.test(story) && story.length < 240;
    const plateOnly = /^(?:_>\s*)?SYSTEM\b/i.test(story)
      && /\b(?:Name|Level|HP|Registration)\b/i.test(story)
      && story.length < 400;
    const realBook = story.length >= 8 && /[a-z]/i.test(story) && !hudNotBook && !plateOnly;
    if (!snap.busy && newGmBubble && realBook) {
      snap.newGmBubble = true;
      snap.prevGmStoryCount = prevGmCount;
      snap.waitTimedOut = false;
      return snap;
    }
    await sleep(500);
  }
  const last = await readGameSnapshot(page);
  const lastStory = (last.lastGm || '').trim();
  last.newGmBubble = Number(last.gmStoryCount || 0) > prevGmCount
    || Number(last.feedbacks || 0) > prevFeedbacks
    || Boolean(lastStory && lastStory !== prevStory);
  last.prevGmStoryCount = prevGmCount;
  last.waitTimedOut = !last.newGmBubble;
  return last;
}

/** Setup step answer: a new system row or a new chip pad. Not a GM wait. */
export async function waitSetupAdvance(page, prev, { timeoutMs = 8000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await readGameSnapshot(page);
    if (!snap.busy && setupAdvanced(prev, snap)) {
      snap.setupAdvanced = true;
      snap.newGmBubble = false;
      snap.waitTimedOut = false;
      return snap;
    }
    await sleep(200);
  }
  const last = await readGameSnapshot(page);
  last.setupAdvanced = setupAdvanced(prev, last);
  last.newGmBubble = false;
  last.waitTimedOut = !last.setupAdvanced;
  return last;
}

async function insertInto(page, selector, text) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    el.focus();
    const r = el.getBoundingClientRect();
    return { x: r.x + 16, y: r.y + 10 };
  }, selector);
  if (!box) throw new Error(`missing ${selector}`);
  await page.mouse.click(box.x, box.y);
  await sleep(80);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  const client = await page.createCDPSession();
  await client.send('Input.insertText', { text });
}

export async function dismissWelcome(page) {
  for (let i = 0; i < 6; i++) {
    const snap = await readGameSnapshot(page);
    if (!snap.hasWelcome) return;
    const clicked = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('button')];
      const splash = nodes.find((n) => /Press any key or tap/i.test(n.innerText || ''));
      if (!splash) return false;
      splash.click();
      return true;
    });
    if (!clicked) {
      await page.keyboard.press('Enter');
    }
    await sleep(350);
  }
}

export async function loginFounderEmail(page, email, password) {
  await dismissWelcome(page);
  await sleep(400);
  const snap = await readGameSnapshot(page);
  if (snap.hasMenu && /ai-player@/i.test(snap.signedHint)) return { ok: true, already: true };
  if (snap.hasMenu && snap.signedHint && !/ai-player@/i.test(snap.signedHint)) {
    return {
      ok: false,
      blocked: 'wrong_session',
      message: `Game tab is signed in as ${snap.signedHint}. Stay on the tester tab or sign out, then rerun.`,
    };
  }
  if (snap.hasMenu && !snap.hasAuth) {
    return { ok: true, already: true };
  }
  if (!snap.hasAuth) {
    return { ok: false, blocked: 'no_auth_overlay', message: 'Email sign-in overlay not visible.' };
  }

  const opened = await clickText(page, 'Email sign-in', { timeoutMs: 4000 });
  if (!opened) {
    return {
      ok: false,
      blocked: 'founder_login_hidden',
      message: 'Email sign-in control missing. Start Vite with VITE_ENABLE_FOUNDER_EMAIL_LOGIN=true and this email on VITE_FOUNDER_LOGIN_EMAILS.',
    };
  }
  await sleep(300);
  const emailEl = await page.$('#founder-email');
  if (!emailEl) {
    return { ok: false, blocked: 'founder_fields_missing', message: 'Founder email fields did not expand.' };
  }
  await insertInto(page, '#founder-email', email);
  await insertInto(page, '#founder-password', password);
  await clickText(page, 'Sign in with email', { timeoutMs: 4000 });
  const start = Date.now();
  while (Date.now() - start < 20000) {
    const now = await readGameSnapshot(page);
    if (now.hasMenu || /Start New Game/i.test(await page.evaluate(() => document.body.innerText))) {
      return { ok: true, already: false };
    }
    const denied = await page.evaluate(() => {
      const t = document.body.innerText || '';
      if (/Email sign-in is not available/i.test(t)) return 'allowlist';
      if (/Invalid login credentials/i.test(t)) return 'bad_credentials';
      if (/Email logins are disabled/i.test(t)) return 'email_provider_off';
      return '';
    });
    if (denied) {
      return { ok: false, blocked: denied, message: `Login failed: ${denied}` };
    }
    await sleep(400);
  }
  return { ok: false, blocked: 'login_timeout', message: 'Signed in form submitted but menu never appeared.' };
}

/** New Game for the next bible — same Synaptic tab, never a second 5173 page. */
export async function startPremade(page, bibleId) {
  const spec = BIBLES[bibleId];
  if (!spec) throw new Error(`unknown bible ${bibleId}`);
  await dismissWelcome(page);
  if (!(await clickText(page, 'Start New Game', { timeoutMs: 8000, exact: true }))) {
    throw new Error('Start New Game not found');
  }
  await sleep(600);
  if (!(await clickText(page, 'Quick Start / Pre-Made', { timeoutMs: 8000, root: '.sgm-modal-shell' }))) {
    throw new Error('Quick Start / Pre-Made not found');
  }
  await sleep(400);
  if (!(await clickText(page, spec.mode, { timeoutMs: 8000, root: '.sgm-modal-shell' }))) {
    throw new Error(`Mode card missing: ${spec.mode}`);
  }
  await sleep(300);
  const picked = await page.evaluate((title) => {
    const modal = document.querySelector('.sgm-modal-shell') || document;
    const btns = [...modal.querySelectorAll('button')];
    const el = btns.find((b) => {
      if (b.disabled) return false;
      return (b.textContent || '').includes(title);
    });
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, spec.title);
  if (!picked) throw new Error(`Premade card missing: ${spec.title}`);
  await sleep(350);
  const modal = '.sgm-modal-shell';
  const began = await clickText(page, 'Begin Journey', { timeoutMs: 1500, exact: true, root: modal })
    || await clickText(page, 'Continue', { timeoutMs: 4000, exact: true, root: modal });
  if (!began) throw new Error('Modal Continue / Begin Journey not found (refusing Continue Journey on the hub)');
  await sleep(400);
  await clickText(page, 'Someone new this time', { timeoutMs: 2500, root: modal });
}

/** CenterPanel toolbar — only mounted while `state.activeEncounter` is live. */
export const AUTO_FIGHT_SELECTOR = 'button[title="Auto-resolve combat"]';

/** Save id the UI has loaded (DOM marker, else the current IndexedDB game row). */
export async function readUiSaveId(page) {
  if (!page || typeof page.evaluate !== 'function') return null;
  try {
    const id = await page.evaluate(() => new Promise((resolve) => {
      const marked = document.querySelector('[data-sgm-save-id]');
      const fromDom = marked && marked.getAttribute('data-sgm-save-id');
      if (fromDom) { resolve(fromDom); return; }
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        resolve(value || null);
      };
      const timer = setTimeout(() => finish(null), 400);
      let req;
      try {
        req = indexedDB.open('tactical-litrpg');
      } catch {
        clearTimeout(timer);
        finish(null);
        return;
      }
      req.onerror = () => { clearTimeout(timer); finish(null); };
      req.onsuccess = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains('game')) {
            clearTimeout(timer);
            finish(null);
            return;
          }
          const getReq = db.transaction('game', 'readonly').objectStore('game').get('current');
          getReq.onerror = () => { clearTimeout(timer); finish(null); };
          getReq.onsuccess = () => {
            clearTimeout(timer);
            const row = getReq.result;
            finish(row && row.saveId ? String(row.saveId) : null);
          };
        } catch {
          clearTimeout(timer);
          finish(null);
        }
      };
    }));
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export async function dismissAutoFightTip(page) {
  lastCoverClear = await clearInputCover(page, 'dismissAutoFightTip');
  const cleared = Boolean(lastCoverClear?.cleared && lastCoverClear.steps?.length);
  if (cleared) await sleep(300);
  return cleared;
}

export async function confirmAutoFightWarning(page) {
  const hit = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('button')];
    const risk = nodes.find((b) => /Risk It/i.test((b.textContent || '').replace(/\s+/g, ' ').trim()));
    if (!risk) return false;
    risk.click();
    return true;
  });
  if (hit) await sleep(400);
  return hit;
}

/** Click the existing Auto Fight control. Never Attack/Flee/Parley mash. */
export async function clickAutoFight(page) {
  await dismissAutoFightTip(page);
  const clicked = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el || el.disabled) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    el.click();
    return true;
  }, AUTO_FIGHT_SELECTOR);
  if (!clicked) return '';
  await sleep(250);
  await confirmAutoFightWarning(page);
  return 'Auto-Fight';
}

export async function clickChip(page, label) {
  lastCoverClear = await clearInputCover(page, 'clickChip');
  const clicked = await page.evaluate((needle) => {
    const buttons = [...document.querySelectorAll('button.sgm-choice-btn')];
    const want = (needle || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const el = buttons.find((b) => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return t === want || t.includes(want) || want.includes(t);
    });
    if (!el) return null;
    el.click();
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }, label);
  return clicked;
}

/** What sits on top of the action box at its centre (null when the box itself is hit). */
export async function inputCoveredBy(page) {
  const cover = await coverAtInput(page);
  if (!cover) return null;
  if (cover.missing) return 'no_input';
  return cover.selector;
}

/**
 * Type a player line and confirm the game took it (the box clears when the UI sends).
 * Returns { sent, reason }: a line that never reached the game is a harness error, not a no-reply turn.
 */
export async function typePlayerAction(page, text) {
  const sel = '[aria-label="Player action input"]';
  const input = await page.$(sel);
  if (!input) throw new Error('Player action input missing (chips-only books hide it)');
  lastCoverClear = await clearInputCover(page, 'typePlayerAction');
  const cover = await inputCoveredBy(page);
  if (cover) return { sent: false, reason: `input_covered:${cover}`, overlay: lastCoverClear };
  await insertInto(page, sel, text);
  await sleep(150);
  const typed = await page.evaluate((s) => document.querySelector(s)?.value || '', sel);
  if (typed.trim() !== String(text).trim()) return { sent: false, reason: 'text_not_entered' };
  const clicked = await page.evaluate((s) => {
    const box = document.querySelector(s);
    const btn = box?.parentElement?.querySelector('button:last-of-type');
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
    return false;
  }, sel);
  if (!clicked) await page.keyboard.press('Enter');
  for (let i = 0; i < 20; i++) {
    await sleep(150);
    const left = await page.evaluate((s) => document.querySelector(s)?.value ?? '', sel);
    if (!left.trim()) return { sent: true, reason: 'ok' };
  }
  return { sent: false, reason: 'send_not_accepted' };
}

/** Wait for the UI's own gm_response_feedback upsert (POST) and return its JSON body, or an error note. */
export function waitFeedbackUpsert(page, timeoutMs = 10000) {
  if (!page || typeof page.waitForResponse !== 'function') {
    return Promise.resolve({ body: null, error: 'no_waitForResponse' });
  }
  return page.waitForResponse(
    (res) => res.url().includes('/rest/v1/gm_response_feedback') && res.request().method() === 'POST',
    { timeout: timeoutMs },
  ).then(async (res) => {
    if (!res.ok()) return { body: null, error: `upsert_http_${res.status()}` };
    try {
      return { body: await res.json(), error: null };
    } catch {
      return { body: null, error: 'upsert_body_unreadable' };
    }
  }).catch(() => ({ body: null, error: 'no_upsert_seen' }));
}

export async function submitThumb(page, { thumb, comment }) {
  const aria = thumb === 'down' ? 'Poor response' : 'Good response';
  const upsertWait = waitFeedbackUpsert(page);
  const clicked = await page.evaluate((label) => {
    const blocks = [...document.querySelectorAll('[data-sgm-feedback="1"]')];
    const last = blocks.at(-1);
    if (!last) return false;
    const btn = last.querySelector(`button[aria-label="${label}"]`);
    if (!btn) return false;
    btn.click();
    return true;
  }, aria);
  if (!clicked) {
    upsertWait.catch(() => {});
    return { ok: false, reason: 'thumb_missing', upsert: null, upsertError: 'thumb_missing' };
  }
  const upsert = await upsertWait;
  await sleep(400);
  if (comment) {
    const hasBox = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('[data-sgm-feedback="1"]')];
      const last = blocks.at(-1);
      const ta = last?.querySelector('textarea');
      if (!ta) return false;
      ta.focus();
      return true;
    });
    if (hasBox) {
      const box = await page.evaluate(() => {
        const blocks = [...document.querySelectorAll('[data-sgm-feedback="1"]')];
        const ta = blocks.at(-1)?.querySelector('textarea');
        if (!ta) return null;
        const r = ta.getBoundingClientRect();
        return { x: r.x + 12, y: r.y + 10 };
      });
      if (box) {
        await page.mouse.click(box.x, box.y);
        await sleep(80);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        const client = await page.createCDPSession();
        await client.send('Input.insertText', { text: comment.slice(0, 500) });
        await page.evaluate(() => {
          const blocks = [...document.querySelectorAll('[data-sgm-feedback="1"]')];
          const ta = blocks.at(-1)?.querySelector('textarea');
          ta?.blur();
        });
      }
    }
  }
  await sleep(400);
  return { ok: true, upsert: upsert.body, upsertError: upsert.error };
}

const EMPTY_PLACE = { place: null, placeId: null, placeSource: 'none' };

function cleanPlaceText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * Place shown on the game screen, else the save the UI loaded (IndexedDB).
 * Never throws.
 * @returns {Promise<{ place: string | null, placeId: string | null, placeSource: 'ui' | 'save' | 'none' }>}
 */
export async function readPlace(page) {
  try {
    if (!page || typeof page.evaluate !== 'function') return { ...EMPTY_PLACE };
    const raw = await page.evaluate(async () => {
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const none = { ui: '', saveName: '', placeId: '' };
      try {
        let ui = '';
        const header = document.querySelector('.sgm-adventure-map-header');
        if (header) {
          const room = clean(header.querySelector('span.text-amber-300')?.textContent);
          if (room && room !== 'Unknown') ui = room;
          if (!ui) {
            const title = clean(header.querySelector('h2.sgm-adventure-map-title')?.textContent);
            if (title && title !== 'Local map pending') ui = title;
          }
        }
        if (!ui) {
          const accent = clean(document.querySelector('span.sgm-info-accent')?.textContent);
          if (accent && accent !== 'an unmapped place') ui = accent;
        }
        let save = null;
        try {
          save = await new Promise((resolve) => {
            let settled = false;
            const finish = (value) => {
              if (settled) return;
              settled = true;
              resolve(value);
            };
            const timer = setTimeout(() => finish(null), 2000);
            let req;
            try {
              req = indexedDB.open('tactical-litrpg');
            } catch {
              clearTimeout(timer);
              finish(null);
              return;
            }
            req.onerror = () => {
              clearTimeout(timer);
              finish(null);
            };
            req.onsuccess = () => {
              try {
                const db = req.result;
                if (!db.objectStoreNames.contains('game')) {
                  clearTimeout(timer);
                  finish(null);
                  return;
                }
                const tx = db.transaction('game', 'readonly');
                const getReq = tx.objectStore('game').get('current');
                getReq.onerror = () => {
                  clearTimeout(timer);
                  finish(null);
                };
                getReq.onsuccess = () => {
                  clearTimeout(timer);
                  finish(getReq.result || null);
                };
              } catch {
                clearTimeout(timer);
                finish(null);
              }
            };
          });
        } catch {
          save = null;
        }
        const saveName = clean(save?.locationSheet?.name || save?.currentLocation);
        let placeId = '';
        const places = Array.isArray(save?.places) ? save.places : [];
        for (let i = 0; i < places.length; i++) {
          const row = places[i];
          if (!row || !row.id) continue;
          const rowName = clean(row.name);
          const here = clean(save.currentLocation);
          if (row.id === here || (rowName && (rowName === saveName || rowName === here))) {
            placeId = String(row.id);
            break;
          }
        }
        if (!placeId && save?.currentLocation) placeId = clean(save.currentLocation);
        return { ui, saveName, placeId };
      } catch {
        return none;
      }
    });
    const ui = cleanPlaceText(raw?.ui);
    const saveName = cleanPlaceText(raw?.saveName);
    const placeId = cleanPlaceText(raw?.placeId);
    if (ui) {
      return { place: ui, placeId: placeId || null, placeSource: 'ui' };
    }
    if (placeId || saveName) {
      return {
        place: saveName || placeId,
        placeId: placeId || saveName,
        placeSource: 'save',
      };
    }
    return { ...EMPTY_PLACE };
  } catch {
    return { ...EMPTY_PLACE };
  }
}
