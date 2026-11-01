import puppeteer from 'puppeteer-core';
import { findGeminiPage } from '../../scripts/ai-player-browser/geminiTab.mjs';
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const p = findGeminiPage(await b.pages());
const t = await p.evaluate(() => document.body.innerText);
console.log(t.slice(-1800));
b.disconnect();
