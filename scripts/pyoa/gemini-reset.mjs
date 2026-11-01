// Opens a fresh Gemini chat on the laptop Chrome (CDP :9222) and reports its state as one JSON line: {state: ok|signedout|quota|nochrome|nopage, model, detail}
import puppeteer from 'puppeteer-core';
const out = (o) => { console.log(JSON.stringify(o)); process.exit(0); };
let b;
try { b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null }); } catch (e) { out({ state: 'nochrome', detail: String(e.message).slice(0, 120) }); }
const pages = await b.pages();
const p = pages.find((x) => /gemini\.google\.com/.test(x.url())) || null;
if (!p) { b.disconnect(); out({ state: 'nopage', detail: 'no Gemini tab' }); }
try { await p.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) { b.disconnect(); out({ state: 'nopage', detail: 'goto failed ' + String(e.message).slice(0, 80) }); }
await new Promise((r) => setTimeout(r, 5000));
const st = await p.evaluate(() => {
  const t = document.body.innerText || '';
  return {
    url: location.href,
    signedOut: /accounts\.google\.com/.test(location.href) || (/sign in/i.test(t) && !document.querySelector('[aria-label="Enter a prompt for Gemini"]')),
    quota: /(reached|hit) (your|the) (daily |usage )?limit|usage limit|too many requests|come back (later|tomorrow)|limit (resets|will reset)/i.test(t),
    model: [...document.querySelectorAll('button')].map((x) => x.getAttribute('aria-label') || '').find((s) => /mode picker/i.test(s)) || '',
    hasPrompt: !!document.querySelector('[aria-label="Enter a prompt for Gemini"]'),
  };
});
b.disconnect();
if (st.signedOut) out({ state: 'signedout', detail: st.url });
if (st.quota) out({ state: 'quota', detail: 'quota/usage-limit text on page' });
out({ state: st.hasPrompt ? 'ok' : 'nopage', model: st.model, detail: st.url });
