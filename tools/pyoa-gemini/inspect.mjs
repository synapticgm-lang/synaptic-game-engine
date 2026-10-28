import puppeteer from 'puppeteer-core';
import { findGeminiPage } from '../../scripts/ai-player-browser/geminiTab.mjs';
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const p = findGeminiPage(await b.pages());
const info = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].map(x => (x.getAttribute('aria-label')||'') + '|' + (x.innerText||'').replace(/\s+/g,' ').slice(0,40)).filter(s => /mode|model|fast|pro|think|flash|2\.|3\./i.test(s));
  return { url: location.href, btns };
});
console.log(JSON.stringify(info, null, 1));
b.disconnect();
