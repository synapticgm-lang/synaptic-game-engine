/**
 * Drive the existing Gemini web tab on Chrome CDP :9222.
 * Clipboard-style insertText (keeps spaces). Never close the browser.
 */

export function findGeminiPage(pages) {
  return pages.find((p) => /gemini\.google\.com/i.test(p.url()));
}

async function composerBox(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[aria-label="Enter a prompt for Gemini"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + 24, y: r.y + 16 };
  });
}

export async function geminiIsGenerating(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || '';
    if (/stop generating|stop response/i.test(text)) return true;
    return [...document.querySelectorAll('button')].some((b) => {
      const aria = (b.getAttribute('aria-label') || '').trim();
      return /stop generating|stop response|^stop$/i.test(aria);
    });
  });
}

export async function waitGeminiIdle(page, { timeoutMs = 180000, pollMs = 2000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!(await geminiIsGenerating(page))) return true;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return false;
}

async function startFreshGeminiChat(page) {
  const clicked = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('button, a, [role="button"]')];
    const el = nodes.find((n) => /^(new chat|new conversation)$/i.test((n.getAttribute('aria-label') || n.textContent || '').replace(/\s+/g, ' ').trim()));
    if (!el) return false;
    el.click();
    return true;
  });
  if (clicked) await new Promise((r) => setTimeout(r, 1200));
  return clicked;
}

export async function pasteGeminiPrompt(page, prompt, { retried = false } = {}) {
  await page.bringToFront();
  const box = await composerBox(page);
  if (!box) throw new Error('Gemini composer missing — open gemini.google.com in this Chrome');
  await page.mouse.click(box.x, box.y);
  await new Promise((r) => setTimeout(r, 200));
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await new Promise((r) => setTimeout(r, 150));

  const client = await page.createCDPSession();
  await client.send('Input.insertText', { text: prompt });
  await new Promise((r) => setTimeout(r, 400));
  await page.keyboard.press('Space');
  await page.keyboard.press('Backspace');
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Enter a prompt for Gemini"]');
    if (!el) return;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
  });
  await new Promise((r) => setTimeout(r, 250));

  const spaces = (prompt.match(/ /g) || []).length;
  const pasted = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Enter a prompt for Gemini"]');
    const t = (el?.innerText || '').trim();
    return { chars: t.length, spaces: (t.match(/ /g) || []).length };
  });
  if (spaces > 8 && pasted.spaces < spaces * 0.85) {
    throw new Error(`Gemini paste smashed spaces: expected ~${spaces} got ${pasted.spaces}`);
  }

  const clickSend = () => page.evaluate(() => {
    const walk = (root) => {
      const here = [...root.querySelectorAll('button')];
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) here.push(...walk(el.shadowRoot));
      }
      return here;
    };
    const sends = walk(document).filter((b) => {
      const aria = (b.getAttribute('aria-label') || '').trim();
      return /send message/i.test(aria);
    });
    const live = sends.find((b) => !b.disabled && b.getAttribute('aria-disabled') !== 'true');
    const el = live || sends.at(-1);
    if (!el) return { ok: false, sendCount: 0, usedDisabled: false };
    el.click();
    return { ok: true, sendCount: sends.length, usedDisabled: !live };
  });

  const start = Date.now();
  let sent = false;
  while (Date.now() - start < 12000) {
    const hit = await clickSend();
    if (hit.ok && !hit.usedDisabled) {
      sent = true;
      break;
    }
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 500));
    if (await geminiIsGenerating(page)) {
      sent = true;
      break;
    }
  }
  if (!sent) {
    const diag = await page.evaluate(() => {
      const sends = [...document.querySelectorAll('button')].filter((b) => /send message/i.test(b.getAttribute('aria-label') || ''));
      const el = document.querySelector('[aria-label="Enter a prompt for Gemini"]');
      return {
        sendCount: sends.length,
        disabled: sends.map((b) => ({ disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled') })),
        composerChars: (el?.innerText || '').trim().length,
      };
    });
    if (!retried && (await startFreshGeminiChat(page))) {
      return pasteGeminiPrompt(page, prompt, { retried: true });
    }
    throw new Error(`Gemini Send message button missing or disabled ${JSON.stringify(diag)}`);
  }
}

export async function readGeminiReplyTail(page) {
  return page.evaluate(() => {
    const sels = [
      'model-response',
      '[data-message-author-role="model"]',
      'message-content',
      '.model-response-text',
      '[class*="model-response"]',
    ];
    const texts = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const t = (el.innerText || '').trim();
        if (t.length > 8) texts.push(t);
      }
    }
    if (texts.length) return texts.at(-1).slice(-8000);
    return (document.body?.innerText || '').slice(-8000);
  });
}

function parseBalancedObject(blob, start) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < blob.length; i++) {
    const c = blob[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(blob.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractJsonObject(raw) {
  if (!raw) return null;
  const blobs = [];
  for (const m of raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) blobs.push(m[1]);
  blobs.push(raw);
  for (const blob of blobs) {
    let from = 0;
    while (from < blob.length) {
      const key = blob.indexOf('"action_kind"', from);
      const thumb = blob.indexOf('"thumb"', from);
      const hits = [key, thumb].filter((n) => n >= 0);
      if (!hits.length) break;
      const anchor = Math.min(...hits);
      const start = blob.lastIndexOf('{', anchor);
      if (start >= 0) {
        const obj = parseBalancedObject(blob, start);
        if (obj && typeof obj === 'object' && (obj.action_kind || obj.action || obj.thumb)) {
          if (!/chip\s*\|\s*type/.test(JSON.stringify(obj))) return obj;
        }
      }
      from = anchor + 1;
    }
  }
  return null;
}

function truthyFlag(v) {
  if (v === true || v === 1) return true;
  const s = String(v || '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'y' || s === '1';
}

function stripPromptEcho(raw) {
  return String(raw || '')
    .replace(/You are a human playtester[\s\S]*?KIND is chip or type[^\n]*/gi, '')
    .replace(/Reply with EXACTLY these 6 lines[\s\S]*?NOTE: one short sentence/gi, '')
    .trim();
}

function parseLabeledLines(raw) {
  if (!raw) return null;
  const text = stripPromptEcho(raw).replace(/\r/g, '');
  const grab = (...keys) => {
    let found = '';
    for (const k of keys) {
      const re = new RegExp(`(?:^|\\n)\\s*\\*{0,2}(?:${k})\\*{0,2}\\s*[:\\-]\\s*(.+)`, 'gi');
      let m;
      while ((m = re.exec(text))) {
        found = m[1].replace(/\s+/g, ' ').trim().replace(/\*+$/g, '');
      }
    }
    return found;
  };
  const action = grab('ACTION', 'CHIP', 'TYPE', 'PICK');
  const kindRaw = grab('KIND', 'ACTION_KIND');
  const thumbRaw = grab('THUMB');
  const note = grab('NOTE', 'COMMENT');
  const nonsense = grab('NONSENSE', 'NONSENSE_OPTIONS');
  const leak = grab('LEAK', 'FUTURE_LEAK');
  if (!action && !thumbRaw && !kindRaw) return null;
  return {
    action_kind: /type/i.test(kindRaw) ? 'type' : 'chip',
    action,
    thumb: /down|neg/i.test(thumbRaw) ? 'down' : 'up',
    comment: note,
    nonsense_options: truthyFlag(nonsense),
    future_leak: truthyFlag(leak),
    note,
  };
}

function resolveAction(action, chips = []) {
  const raw = String(action || '').trim();
  if (!raw) return '';
  const n = raw.match(/^(\d{1,2})[.)]?\s*$/);
  if (n) {
    const idx = Number(n[1]) - 1;
    if (chips[idx]) return chips[idx];
  }
  const numbered = raw.match(/^(\d{1,2})[.)]\s+(.+)$/);
  if (numbered) {
    const idx = Number(numbered[1]) - 1;
    if (chips[idx]) return chips[idx];
    return numbered[2].trim();
  }
  const want = raw.toLowerCase();
  const hit = chips.find((c) => {
    const t = c.toLowerCase();
    return t === want || t.includes(want) || want.includes(t);
  });
  return hit || raw;
}

export function parsePlaytesterDecision(raw, { chips = [] } = {}) {
  const cleaned = stripPromptEcho(raw);
  const parsed = extractJsonObject(cleaned) || parseLabeledLines(cleaned);
  if (!parsed || typeof parsed !== 'object') {
    return {
      action_kind: 'chip',
      action: chips[0] || '',
      thumb: 'down',
      comment: 'Gemini reply was not parseable.',
      nonsense_options: false,
      future_leak: false,
      note: 'unparseable Gemini reply',
      raw_ok: false,
    };
  }
  const kind = parsed.action_kind === 'type' || /type/i.test(String(parsed.action_kind || ''))
    ? 'type'
    : 'chip';
  const thumb = parsed.thumb === 'down' || parsed.thumb === 'negative' || /down|neg/i.test(String(parsed.thumb || ''))
    ? 'down'
    : 'up';
  const note = String(parsed.note || parsed.comment || '').trim();
  return {
    action_kind: kind,
    action: resolveAction(parsed.action || parsed.chip || parsed.type, chips),
    thumb,
    comment: String(parsed.comment || note).trim().slice(0, 500),
    nonsense_options: truthyFlag(parsed.nonsense_options),
    future_leak: truthyFlag(parsed.future_leak),
    note: note.slice(0, 240),
    raw_ok: true,
  };
}

export function buildPlaytesterPrompt({
  bibleId,
  modeLabel,
  turn,
  chipsOnly,
  chips,
  lastPlayer,
  gmStory,
}) {
  const chipList = chips.length
    ? chips.map((c, i) => `${i + 1}. ${c}`).join('\n')
    : '(no chips)';
  const typeRule = chipsOnly
    ? 'This book is chips-only. NEVER choose type. Pick a chip.'
    : 'Click a chip when it is a sane human move. Type free text when chips are empty or look wrong.';
  return [
    'You are a human playtester for a browser text RPG. You forget prior turns — use only this packet.',
    `Campaign: ${bibleId} (${modeLabel}). Player turn ${turn} (after this GM beat).`,
    typeRule,
    'Do not pick Fate\'s Pick unless every other chip is nonsense.',
    'Flag nonsense_options if chips invent people/places/items not in the GM beat or are unreadable.',
    'Flag future_leak if a chip or the prose spoils something that has not happened yet.',
    'Recommend a thumb on the GM beat: up if playable and coherent, down if broken, empty, recycled, or spoiling.',
    '',
    'LAST PLAYER ACTION:',
    lastPlayer || '(opening / none)',
    '',
    'GM STORY (ignore STATUS / XP chrome):',
    gmStory || '(none yet)',
    '',
    'CHIPS ON SCREEN:',
    chipList,
    '',
    'Reply with EXACTLY these 6 lines and nothing else (no markdown, no JSON):',
    'KIND: chip',
    'ACTION: 1',
    'THUMB: up',
    'NONSENSE: no',
    'LEAK: no',
    'NOTE: one short sentence',
    'KIND is chip or type. ACTION is a chip number, exact chip text, or a typed line.',
  ].join('\n');
}
