/**
 * Watched browser AI-player (4 flagships × T10).
 * Real React sendAction in a visible Chrome tab. Player-brain is OpenRouter
 * (google/gemini-2.5-flash). Never closes Chrome / never kills chrome.exe.
 *
 * ONE Synaptic tab for the whole run. Login, all four bibles, and any
 * retry reuse that same page. New Game is Start New Game / reload in
 * this tab — never browser.newPage() per bible. Extra 5173 tabs from
 * older sequential leftovers get closed; Gemini tabs stay.
 *
 *   npm run ai-player-smoke
 *   npm run ai-player-t10
 *
 * Env (.env / .env.local, gitignored):
 *   AI_PLAYER_EMAIL / AI_PLAYER_PASSWORD
 *   OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY
 *   AI_PLAYER_HOST=http://127.0.0.1:5173
 *   AI_PLAYER_CDP=http://127.0.0.1:9222
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { loadProjectEnv, ROOT } from './loadEnv.mjs';
import {
  BIBLES,
  clickChip,
  loginFounderEmail,
  readGameSnapshot,
  startPremade,
  submitThumb,
  typePlayerAction,
  waitNewGmBeat,
  waitOpeningReady,
} from './gameTab.mjs';
import { askOpenRouterPlayer, openRouterKey, openRouterPlayerModel } from './openRouterPlayer.mjs';

loadProjectEnv();

const FLAGSHIPS = ['summoned-pact', 'cursed-keep', 'salt-road-heist', 'thornferry-road'];
const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const loginCheck = args.includes('--login-check');
const turns = Number(process.env.AI_PLAYER_TURNS || (smoke ? 1 : 10));
const host = (process.env.AI_PLAYER_HOST || 'http://127.0.0.1:5173').replace(/\/$/, '');
const cdp = process.env.AI_PLAYER_CDP || 'http://127.0.0.1:9222';
const email = (process.env.AI_PLAYER_EMAIL || '').trim();
const password = process.env.AI_PLAYER_PASSWORD || '';
const onlyBible = args.find((a) => a.startsWith('--bible='))?.slice('--bible='.length);
const bibles = smoke
  ? [onlyBible || 'summoned-pact']
  : onlyBible
    ? [onlyBible]
    : FLAGSHIPS;

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const runDir = path.join(ROOT, 'scripts', 'ai-player-browser', 'runs', stamp);
fs.mkdirSync(runDir, { recursive: true });

function appendJsonl(file, obj) {
  fs.appendFileSync(file, `${JSON.stringify(obj)}\n`, 'utf8');
}

function appendMd(file, text) {
  fs.appendFileSync(file, text, 'utf8');
}

function isGameUrl(url) {
  const u = String(url || '');
  if (/127\.0\.0\.1:5173|localhost:5173/i.test(u)) return true;
  if (/synapticgm\.com/i.test(u)) return true;
  try {
    return u.startsWith(new URL(host).origin);
  } catch {
    return false;
  }
}

/**
 * Attach to the existing Synaptic tab (or open one if Chrome has none).
 * Sequential bibles used to call browser.newPage() and leave the old tab
 * open — leftover 5173 tabs were not parallel stories. Close extras only.
 */
async function attachGameTab(browser) {
  const gamePages = [];
  for (const target of browser.targets()) {
    if (target.type() !== 'page' || !isGameUrl(target.url())) continue;
    try {
      const page = await Promise.race([
        target.page(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('game_page_timeout')), 12000)),
      ]);
      if (page) gamePages.push(page);
    } catch {
      continue;
    }
  }
  const keep = gamePages[0];
  for (const extra of gamePages.slice(1)) {
    try {
      await extra.close();
    } catch {
      /* tab close only — never browser.close / never kill chrome.exe */
    }
  }
  if (keep) {
    await keep.bringToFront();
    return keep;
  }
  return browser.newPage();
}

async function showGameMenu(page) {
  await page.bringToFront();
  await page.goto(host, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
}

async function playBible(gamePage, bibleId) {
  const spec = BIBLES[bibleId];
  const folder = path.join(runDir, bibleId);
  fs.mkdirSync(folder, { recursive: true });
  const jsonl = path.join(folder, 'turns.jsonl');
  const transcript = path.join(folder, 'transcript.md');
  appendMd(transcript, `# ${spec.title} (${bibleId})\n\nHost: ${host}\n\n`);

  await showGameMenu(gamePage);

  const login = await loginFounderEmail(gamePage, email, password);
  if (!login.ok) {
    appendJsonl(jsonl, { event: 'login_blocked', ...login });
    return { bibleId, blocked: login };
  }

  await startPremade(gamePage, bibleId);
  let snap = await waitOpeningReady(gamePage, { timeoutMs: 90000 });
  if (!snap.playReady) {
    appendJsonl(jsonl, {
      event: 'opening_blocked',
      bibleId,
      gmStory: snap.lastGm,
      chips: snap.chips,
      hasMenu: snap.hasMenu,
      inNewGame: snap.inNewGame,
      inputPresent: snap.inputPresent,
    });
    throw new Error(
      `Opening never painted (${bibleId}): story=${(snap.lastGm || '').length} chips=${snap.chips.length} menu=${snap.hasMenu} modal=${snap.inNewGame}`,
    );
  }

  appendJsonl(jsonl, {
    event: 'opening',
    bibleId,
    gmStory: snap.lastGm,
    chips: snap.chips,
    feedbacks: snap.feedbacks,
  });
  appendMd(transcript, `## Opening\n\n${snap.lastGm}\n\nChips: ${snap.chips.join(' | ') || '(none)'}\n\n`);

  let lastPlayer = '';
  let nameTyped = false;
  let completed = 0;
  for (let turn = 1; turn <= turns; turn++) {
    const decision = await askOpenRouterPlayer({
      bibleId,
      modeLabel: spec.mode,
      turn,
      chipsOnly: spec.chipsOnly || !snap.inputPresent,
      chips: snap.chips,
      lastPlayer,
      gmStory: snap.lastGm,
    });

    const comment = [
      decision.comment,
      decision.note && `note: ${decision.note}`,
      decision.nonsense_options ? 'flag:nonsense_options' : '',
      decision.future_leak ? 'flag:future_leak' : '',
    ].filter(Boolean).join(' · ').slice(0, 500);

    await gamePage.bringToFront();
    const thumb = await submitThumb(gamePage, { thumb: decision.thumb, comment });
    const afterThumb = await readGameSnapshot(gamePage);

    const chipsOnly = spec.chipsOnly || !snap.inputPresent;
    const nameChip = snap.chips.some((c) => /give (your |them your )?name/i.test(c));
    const alreadyGaveNameChip = /give (your |them your )?name/i.test(lastPlayer);
    let acted = '';
    let kind = decision.action_kind;
    if (chipsOnly) kind = 'chip';

    const pickingNameChip = /give (your |them your )?name/i.test(decision.action || '');
    if (!chipsOnly && nameChip && !nameTyped && (alreadyGaveNameChip || pickingNameChip || turn === 1)) {
      await typePlayerAction(gamePage, 'Jax');
      acted = 'Jax';
      kind = 'type';
      nameTyped = true;
    } else if (!chipsOnly && nameChip && (alreadyGaveNameChip || nameTyped)) {
      await typePlayerAction(gamePage, 'Jax');
      acted = 'Jax';
      kind = 'type';
      nameTyped = true;
    }
    if (!acted && kind === 'chip' && decision.action) {
      acted = await clickChip(gamePage, decision.action);
    }
    if (!acted && kind === 'chip' && snap.chips[0]) {
      acted = await clickChip(gamePage, snap.chips[0]);
      kind = 'chip_fallback';
    }
    if (!acted && !chipsOnly && (kind === 'type' || !snap.chips.length)) {
      const line = decision.action || (nameChip && !nameTyped ? 'Jax' : 'Look around.');
      await typePlayerAction(gamePage, line);
      acted = line;
      kind = 'type';
      if (/^jax$/i.test(line)) nameTyped = true;
    }
    if (!acted) throw new Error(`No legal action on ${bibleId} T${turn}`);

    let next;
    let waitTimedOut = false;
    try {
      next = await waitNewGmBeat(gamePage, afterThumb, { timeoutMs: 90000 });
    } catch {
      next = await readGameSnapshot(gamePage);
      waitTimedOut = true;
    }
    appendJsonl(jsonl, {
      event: waitTimedOut ? 'turn_timeout' : 'turn',
      turn,
      bibleId,
      actionKind: kind,
      playerAction: acted,
      chipsSeen: snap.chips,
      gmStory: next.lastGm,
      thumb: decision.thumb,
      thumbOk: thumb.ok,
      waitTimedOut,
      gemini: {
        note: decision.note,
        nonsense_options: decision.nonsense_options,
        future_leak: decision.future_leak,
        raw_ok: decision.raw_ok,
        model: decision.model || openRouterPlayerModel(),
      },
    });
    appendMd(
      transcript,
      `## T${turn}\n\n**You:** ${acted} (${kind})\n\n**GM:** ${next.lastGm}\n\n`
      + `Thumb: ${decision.thumb} · ${comment}\n\n`,
    );
    lastPlayer = acted;
    snap = next;
    completed = turn;
  }

  return { bibleId, ok: true, turns: completed };
}

async function main() {
  if (!email || !password) {
    console.log(JSON.stringify({
      ok: false,
      blocked: 'missing_login_env',
      message: 'Run node scripts/ai-player-browser/ensure-tester.mjs then set AI_PLAYER_EMAIL / AI_PLAYER_PASSWORD in .env.local',
    }, null, 2));
    process.exit(2);
  }

  if (!loginCheck && !openRouterKey()) {
    console.log(JSON.stringify({
      ok: false,
      blocked: 'missing_openrouter_key',
      message: 'OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY) is missing. Add it to .env — do not invent a key.',
    }, null, 2));
    process.exit(2);
  }

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: cdp,
      defaultViewport: null,
      protocolTimeout: 120000,
    });
  } catch (err) {
    console.log(JSON.stringify({
      ok: false,
      blocked: 'cdp_down',
      message: `Chrome CDP ${cdp} is down. Leave the existing debug Chrome up — do not kill chrome.exe.`,
      detail: String(err?.message || err),
    }, null, 2));
    process.exit(2);
  }

  const summary = {
    host,
    cdp,
    smoke,
    turns,
    bibles,
    runDir,
    playerBrain: 'openrouter',
    playerModel: openRouterPlayerModel(),
    results: [],
    chromeLeftOpen: true,
  };

  try {
    const gamePage = await attachGameTab(browser);
    if (loginCheck) {
      await showGameMenu(gamePage);
      const login = await loginFounderEmail(gamePage, email, password);
      summary.results.push({ event: 'login_check', ...login });
    } else {
      for (const bibleId of bibles) {
        console.log(`AI_PLAYER start ${bibleId}`);
        try {
          const result = await playBible(gamePage, bibleId);
          summary.results.push(result);
          if (result.blocked) continue;
        } catch (err) {
          console.error(`AI_PLAYER fail ${bibleId}: ${err?.message || err}`);
          summary.results.push({ bibleId, ok: false, error: String(err?.message || err) });
        }
      }
    }
  } finally {
    await browser.disconnect();
  }

  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ok: summary.results.every((r) => r.ok), ...summary }, null, 2));
  if (summary.results.some((r) => r.blocked)) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
