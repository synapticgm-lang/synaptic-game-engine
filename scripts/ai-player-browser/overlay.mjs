/**
 * q51d-AIPOVL: one structural route that clears whatever covers the action box.
 * No labels, no word lists. Puppeteer serializes overlayInPage, so every DOM
 * helper lives inside that function.
 */

export function overlayInPage(op) {
  function classesOf(el) {
    const raw = typeof el?.className === 'string' ? el.className : '';
    const out = [];
    let cur = '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        if (cur) { out.push(cur); cur = ''; }
      } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  function collapse(s) {
    let out = '';
    let sp = false;
    const raw = String(s || '');
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
        if (!sp && out) { out += ' '; sp = true; }
      } else {
        out += ch;
        sp = false;
      }
    }
    if (out.endsWith(' ')) out = out.slice(0, -1);
    return out;
  }

  function attr(el, name) {
    if (!el || typeof el.getAttribute !== 'function') return '';
    return el.getAttribute(name) || '';
  }

  function describe(el) {
    const tag = String(el.tagName || 'div').toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = classesOf(el).slice(0, 3);
    return tag + id + (cls.length ? `.${cls.join('.')}` : '');
  }

  function isCoverNode(el) {
    if (!el || el === document || el === document.documentElement || el === document.body) return false;
    if (attr(el, 'role') === 'dialog') return true;
    if (attr(el, 'aria-modal') === 'true') return true;
    if (el.style && el.style.position === 'fixed') return true;
    try {
      if (typeof getComputedStyle === 'function') {
        const cs = getComputedStyle(el);
        if (cs && cs.position === 'fixed') return true;
      }
    } catch { /* fake DOM has no layout */ }
    return classesOf(el).includes('fixed');
  }

  function insideInput(hit, ta) {
    if (!hit || !ta) return false;
    if (hit === ta) return true;
    if (typeof ta.contains === 'function' && ta.contains(hit)) return true;
    let el = hit;
    while (el) {
      if (el === ta) return true;
      el = el.parentElement;
    }
    return false;
  }

  function locate() {
    const ta = document.querySelector('[aria-label="Player action input"]');
    if (!ta) return { missing: true };
    const r = ta.getBoundingClientRect ? ta.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 };
    const cx = r.x + (r.width || 0) / 2;
    const cy = r.y + (r.height || 0) / 2;
    const hit = document.elementFromPoint ? document.elementFromPoint(cx, cy) : null;
    if (!hit || insideInput(hit, ta)) return null;
    let root = hit;
    let el = hit;
    while (el) {
      if (isCoverNode(el)) { root = el; break; }
      el = el.parentElement;
    }
    const text = collapse(root.innerText || root.textContent || '').slice(0, 160);
    return {
      missing: false,
      selector: describe(root),
      text,
      rootSelector: describe(root),
      hitIsRoot: hit === root,
      cx,
      cy,
      root,
      hit,
    };
  }

  function buttonsUnder(root) {
    let list = [];
    if (root && typeof root.querySelectorAll === 'function') list = [...root.querySelectorAll('button')];
    else if (typeof document.querySelectorAll === 'function') list = [...document.querySelectorAll('button')];
    const enabled = [];
    for (const b of list) if (b && !b.disabled) enabled.push(b);
    return enabled;
  }

  function isIconClose(b) {
    const label = attr(b, 'aria-label') || attr(b, 'title');
    if (!label) return false;
    return collapse(b.textContent || '').length === 0;
  }

  function lastRowButton(buttons) {
    if (!buttons.length) return null;
    const last = buttons[buttons.length - 1];
    const row = last.parentElement;
    let pick = last;
    for (const b of buttons) if (b.parentElement === row) pick = b;
    return pick;
  }

  if (op === 'cover') {
    const found = locate();
    if (!found || found.missing) return found || null;
    return {
      selector: found.selector,
      text: found.text,
      rootSelector: found.rootSelector,
      hitIsRoot: found.hitIsRoot,
      cx: found.cx,
      cy: found.cy,
    };
  }

  if (op === 'backdrop') {
    const found = locate();
    if (!found || found.missing || !found.hitIsRoot) return false;
    found.hit.__coverClick = { x: found.cx, y: found.cy };
    if (typeof found.hit.click === 'function') found.hit.click();
    return true;
  }

  if (op === 'control') {
    const found = locate();
    if (!found || found.missing) return false;
    const buttons = buttonsUnder(found.root);
    let btn = null;
    for (const b of buttons) {
      if (isIconClose(b)) { btn = b; break; }
    }
    if (!btn) btn = lastRowButton(buttons);
    if (!btn || typeof btn.click !== 'function') return false;
    btn.__coverClick = { x: found.cx, y: found.cy };
    btn.click();
    return true;
  }

  return null;
}

function isPage(target) {
  return Boolean(target && typeof target.evaluate === 'function');
}

async function inPage(target, op) {
  if (isPage(target)) return target.evaluate(overlayInPage, op);
  const prev = globalThis.document;
  try {
    if (target && target !== prev) globalThis.document = target;
    return overlayInPage(op);
  } finally {
    globalThis.document = prev;
  }
}

/** Cover at the centre of the action box, or null when the box itself is hit. */
export async function coverAtInput(target) {
  const found = await inPage(target, 'cover');
  if (!found || found.missing) return found && found.missing ? { missing: true } : null;
  return {
    selector: found.selector,
    text: found.text,
    rootSelector: found.rootSelector,
  };
}

/**
 * One dismiss attempt, in the game's own UI order. Stops as soon as the box is clear.
 * Returns { cleared, steps, cover }.
 */
export async function dismissCover(target) {
  const before = await coverAtInput(target);
  if (!before || before.missing) {
    return { cleared: !before, steps: [], cover: null };
  }
  const cover = { selector: before.selector, text: before.text };
  const steps = [];

  steps.push('escape');
  if (isPage(target) && target.keyboard && typeof target.keyboard.press === 'function') {
    try { await target.keyboard.press('Escape'); } catch { /* overlay still there */ }
  }
  if (!(await coverAtInput(target))) return { cleared: true, steps, cover };

  const backdrop = await inPage(target, 'backdrop');
  if (backdrop) {
    steps.push('backdrop');
    if (!(await coverAtInput(target))) return { cleared: true, steps, cover };
  }

  const control = await inPage(target, 'control');
  if (control) steps.push('control');
  const after = await coverAtInput(target);
  return { cleared: !after, steps, cover };
}

/** coverAtInput, then dismissCover once, then coverAtInput. */
export async function clearInputCover(target) {
  const before = await coverAtInput(target);
  if (!before || before.missing) return { cleared: !before, steps: [], cover: null };
  const dismissed = await dismissCover(target);
  const after = await coverAtInput(target);
  return {
    cleared: !after,
    steps: dismissed.steps,
    cover: dismissed.cover || { selector: before.selector, text: before.text },
  };
}
