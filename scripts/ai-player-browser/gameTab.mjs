/**
 * Drive a visible game tab. Clicks React controls so sendAction runs.
 * Never close Chrome.
 */

const BIBLES = {
  'summoned-pact': { mode: 'LitRPG', title: 'The Summoned Pact', chipsOnly: false },
  'cursed-keep': { mode: 'Tabletop Fantasy', title: 'Cursed Keep', chipsOnly: false },
  'salt-road-heist': { mode: 'Story RPG', title: 'Salt Road Heist', chipsOnly: false },
  'thornferry-road': { mode: 'Pick Your Own Adventure', title: 'Thornferry Road', chipsOnly: true },
};

export { BIBLES };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const gmBlocks = [...document.querySelectorAll('.sgm-prose-face')].filter((el) => {
      return !el.closest('.justify-end') && visible(el);
    });
    let lastGm = (gmBlocks.at(-1)?.innerText || '').trim();
    if (lastGm.length < 8) {
      const panel = document.querySelector('.sgm-play-story-panel');
      if (panel && visible(panel)) lastGm = (panel.innerText || '').trim();
    }
    const feedbacks = document.querySelectorAll('[data-sgm-feedback="1"]').length;
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
    const inNewGame = Boolean(document.querySelector('.sgm-modal-shell'));
    const hasWelcome = /Press any key or tap/i.test(body);
    const hideOptions = /Show options/i.test(body);
    const hideText = /Show text/i.test(body);
    const signedHint = (body.match(/Cloud save \(Supabase\):\s*(\S+)/) || [])[1] || '';
    const playReady = Boolean(
      document.querySelector('.sgm-play-center')
      && ((lastGm && lastGm.length >= 8) || chips.length > 0),
    );
    const proseCount = document.querySelectorAll('.sgm-prose-face').length;
    return {
      chips,
      lastGm,
      feedbacks,
      proseCount,
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

async function revealPlayChrome(page) {
  const snap = await readGameSnapshot(page);
  if (snap.hideOptions) await clickText(page, 'Show options', { timeoutMs: 800, exact: true });
  if (snap.hideText) await clickText(page, 'Show text', { timeoutMs: 800, exact: true });
}

/** Page 1 is local stitch — wait for prose and/or cover chips, not merely !busy. */
export async function waitOpeningReady(page, { timeoutMs = 90000 } = {}) {
  const start = Date.now();
  let last = await readGameSnapshot(page);
  while (Date.now() - start < timeoutMs) {
    await dismissWelcome(page);
    await revealPlayChrome(page);
    last = await readGameSnapshot(page);
    const story = (last.lastGm || '').trim();
    const hasStory = story.length >= 8;
    const hasChips = last.chips.length > 0;
    if (!last.busy && !last.hasMenu && !last.inNewGame && (hasStory || hasChips) && last.playReady) {
      return last;
    }
    await sleep(400);
  }
  return last;
}

export async function waitNewGmBeat(page, prev, { timeoutMs = 180000 } = {}) {
  const start = Date.now();
  const prevStory = (prev.lastGm || '').trim();
  const prevChips = (prev.chips || []).join('\n');
  const prevProse = Number(prev.proseCount || 0);
  const prevThumbs = Number(prev.feedbacks || 0);
  while (Date.now() - start < timeoutMs) {
    const snap = await readGameSnapshot(page);
    const story = (snap.lastGm || '').trim();
    const storyGrew = story.length >= 8 && story !== prevStory;
    const chipsChanged = (snap.chips || []).join('\n') !== prevChips;
    const proseGrew = Number(snap.proseCount || 0) > prevProse;
    const thumbsGrew = Number(snap.feedbacks || 0) > prevThumbs;
    if (!snap.busy && (storyGrew || chipsChanged || proseGrew || thumbsGrew)) return snap;
    await sleep(500);
  }
  throw new Error('Timed out waiting for a real GM bubble (not STATUS-only)');
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
  const snap = await readGameSnapshot(page);
  if (!snap.hasWelcome) return;
  await page.keyboard.press('Enter');
  await sleep(400);
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
      message: `Game tab is signed in as ${snap.signedHint}. Open a fresh localhost tab or sign out, then rerun.`,
    };
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

export async function clickChip(page, label) {
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

export async function typePlayerAction(page, text) {
  const input = await page.$('[aria-label="Player action input"]');
  if (!input) throw new Error('Player action input missing (chips-only books hide it)');
  await insertInto(page, '[aria-label="Player action input"]', text);
  await sleep(150);
  const sent = await page.evaluate(() => {
    const box = document.querySelector('[aria-label="Player action input"]');
    const btn = box?.parentElement?.querySelector('button:last-of-type');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!sent) {
    await page.keyboard.press('Enter');
  }
}

export async function submitThumb(page, { thumb, comment }) {
  const aria = thumb === 'down' ? 'Poor response' : 'Good response';
  const clicked = await page.evaluate((label) => {
    const blocks = [...document.querySelectorAll('[data-sgm-feedback="1"]')];
    const last = blocks.at(-1);
    if (!last) return false;
    const btn = last.querySelector(`button[aria-label="${label}"]`);
    if (!btn) return false;
    btn.click();
    return true;
  }, aria);
  if (!clicked) return { ok: false, reason: 'thumb_missing' };
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
  return { ok: true };
}
