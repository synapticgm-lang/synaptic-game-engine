// Thin Gemini web driver for PYOA content work. Attaches to the existing Chrome on CDP :9222
// (John's own Gemini subscription, no API/OpenRouter). NEVER closes the browser: only disconnects.
import puppeteer from 'puppeteer-core';
import { findGeminiPage, pasteGeminiPrompt, waitGeminiIdle } from '../../scripts/ai-player-browser/geminiTab.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class GeminiStop extends Error {
  constructor(kind, msg) { super(msg); this.kind = kind; }
}

async function lastResponse(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('model-response')];
    const el = els.at(-1);
    if (!el) return { n: 0, text: '' };
    return { n: els.length, text: (el.innerText || '').trim() };
  });
}

async function pageState(page) {
  return page.evaluate(() => {
    const t = (document.body?.innerText || '').slice(0, 6000);
    const signedOut = /sign in/i.test(t) && !document.querySelector('[aria-label="Enter a prompt for Gemini"]');
    const limit = /(reached|hit) (your|the) (daily |usage )?limit|try again later|too many requests|usage limit|can't (generate|help)|something went wrong/i.test(t);
    return { signedOut, limit, url: location.href };
  });
}

export async function connect() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = findGeminiPage(await browser.pages());
  if (!page) { browser.disconnect(); throw new GeminiStop('nopage', 'No Gemini tab found on :9222'); }
  return { browser, page };
}

export async function ask(prompt, { fresh = true, timeoutMs = 360000 } = {}) {
  const { browser, page } = await connect();
  try {
    await page.bringToFront();
    if (fresh) {
      await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
      await sleep(2500);
    }
    const st0 = await pageState(page);
    if (st0.signedOut || /accounts\.google\.com/.test(st0.url)) throw new GeminiStop('signedout', 'Gemini signed out');
    const before = (await lastResponse(page)).n;
    await pasteGeminiPrompt(page, prompt);
    await sleep(3000);
    const ok = await waitGeminiIdle(page, { timeoutMs, pollMs: 2500 });
    await sleep(2000);
    const st = await pageState(page);
    let r = await lastResponse(page);
    // Pro 'thinking' can look idle with an empty reply: keep polling until real text appears and is stable.
    const t0 = Date.now(); let lastLen = -1, stable = 0;
    while (ok && Date.now() - t0 < timeoutMs) {
      const body = r.text.replace(/^Gemini said\s*/i, '').trim();
      if (r.n > before && body.length > 20 && body.length === lastLen) { if (++stable >= 2) break; } else stable = 0;
      lastLen = body.length;
      await sleep(4000);
      r = await lastResponse(page);
    }
    if (!ok) throw new GeminiStop('timeout', 'Gemini still generating after timeout');
    if (r.n <= before || !r.text) {
      if (st.limit) throw new GeminiStop('limit', 'Gemini limit/error text on page');
      throw new GeminiStop('noreply', 'No new Gemini reply detected');
    }
    return r.text;
  } finally {
    browser.disconnect();
  }
}

