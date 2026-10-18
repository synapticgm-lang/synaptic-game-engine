/**
 * Watched browser AI-player (4 flagships × T10).
 * Real React sendAction in a visible Chrome tab. Player-brain is OpenRouter
 * (default deepseek/deepseek-v4-pro). Never closes Chrome / never kills chrome.exe.
 *
 * BANNER: Do not run a quality T10 on Flash. Flash is not the judge.
 * Default: deepseek/deepseek-v4-pro. Alternative: qwen/qwen3-235b-a22b-2507.
 * Override with AI_PLAYER_MODEL. Restricted providers set testerOnly.
 *
 * ONE Synaptic tab for the whole run. Login, all four bibles, and any
 * retry reuse that same page. New Game is Start New Game / reload in
 * this tab — never browser.newPage() per bible. Extra 5173 tabs from
 * older sequential leftovers get closed; Gemini tabs stay.
 *
 * Stop after 2 consecutive same GM / tester loop / last-resort reprint.
 * Writes REVIEW.md + play-log.md in the run folder. Does not start another T10. Chrome stays open.
 *
 *   npm run ai-player-smoke
 *   npm run ai-player-t10
 *   node scripts/ai-player-browser/run.mjs --persona dungeon-diver --goal 'max out dungeon levels'
 *
 * Env (.env / .env.local, gitignored):
 *   AI_PLAYER_EMAIL / AI_PLAYER_PASSWORD
 *   OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY
 *   AI_PLAYER_HOST=http://127.0.0.1:5173
 *   AI_PLAYER_CDP=http://127.0.0.1:9222
 *   AI_PLAYER_MODEL=deepseek/deepseek-v4-pro
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { loadProjectEnv, ROOT } from './loadEnv.mjs';
import {
  AUTO_FIGHT_SELECTOR,
  BIBLES,
  clickAutoFight,
  clickChip,
  dismissAutoFightTip,
  loginFounderEmail,
  prepareLivePlay,
  readGameSnapshot,
  startPremade,
  submitThumb,
  typePlayerAction,
  waitNewGmBeat,
  waitOpeningReady,
} from './gameTab.mjs';
import {
  askOpenRouterPlayer,
  openRouterKey,
  openRouterPlayerModel,
  testerOnlyForModel,
} from './openRouterPlayer.mjs';
import {
  detectRepeatSignal,
  filterAnsweredHallChips,
  isFlashJudgeModel,
  judgeGmBeat,
  markHallTopics,
  naturalTypedFallback,
  peelChromeFromBeat,
  pickNonHallChip,
  shouldForceTypedHumanMove,
} from './humanJudge.mjs';
import {
  buildPersonaPromptBlock,
  loadPersona,
  parsePersonaArgs,
} from './persona.mjs';
import { appendPlayLog, ensurePlayLog, formatPlayLogLine } from './playLog.mjs';
import {
  AI_TESTER_EMAIL,
  buildTesterMeta,
  makeAiTestSaveId,
} from './testerMeta.mjs';
import {
  createTesterSessionClient,
  pressThumbWithReason,
  thumbReasonFromDecision,
  verifyFeedbackRow,
} from './feedbackVerify.mjs';
import { licenceFor } from './playerLicence.mjs';

loadProjectEnv();

// PYOA is never tested (books unfinished); Thornferry Road plays as PYOA.
const FLAGSHIPS = ['summoned-pact', 'cursed-keep', 'salt-road-heist'];
const PYOA_EXCLUDED = new Set(['thornferry-road']);
const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const loginCheck = args.includes('--login-check');
const resume = args.includes('--resume');
const fromTurn = Number(args.find((a) => a.startsWith('--from='))?.slice('--from='.length) || 0);
const turns = Number(process.env.AI_PLAYER_TURNS || (smoke ? 1 : 10));
const host = (process.env.AI_PLAYER_HOST || 'http://127.0.0.1:5173').replace(/\/$/, '');
const cdp = process.env.AI_PLAYER_CDP || 'http://127.0.0.1:9222';
const email = (process.env.AI_PLAYER_EMAIL || AI_TESTER_EMAIL).trim();
const password = process.env.AI_PLAYER_PASSWORD || '';
const personaArgs = parsePersonaArgs(args);
const persona = loadPersona(personaArgs);
const personaBlock = buildPersonaPromptBlock(persona);
const onlyBible = args.find((a) => a.startsWith('--bible='))?.slice('--bible='.length);
if (onlyBible && PYOA_EXCLUDED.has(onlyBible)) {
  console.error(`[ai-player] ${onlyBible} plays as PYOA — PYOA is never tested.`);
  process.exit(2);
}
const bibles = smoke
  ? [onlyBible || 'summoned-pact']
  : onlyBible
    ? [onlyBible]
    : FLAGSHIPS;

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const runDir = path.join(ROOT, 'scripts', 'ai-player-browser', 'runs', stamp);
fs.mkdirSync(runDir, { recursive: true });
const runSaveId = makeAiTestSaveId(stamp);
const playerModelAtStart = openRouterPlayerModel();
const playerLicenceAtStart = licenceFor(playerModelAtStart);
const testerOnlyAtStart = testerOnlyForModel(playerModelAtStart);
const testerMeta = buildTesterMeta({ model: playerModelAtStart, licence: playerLicenceAtStart });
const playLogPath = path.join(runDir, 'play-log.md');
ensurePlayLog(playLogPath, [
  `Persona: ${persona.id}`,
  persona.goal ? `Goal: ${persona.goal}` : '',
  `Model: ${playerModelAtStart} (${playerLicenceAtStart})`,
  `Save id: ${runSaveId}`,
  testerOnlyAtStart ? 'testerOnly: true (restricted licence)' : '',
].filter(Boolean));

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

function storyForBrain(snap) {
  const peeled = peelChromeFromBeat(snap?.lastGm || '');
  return peeled.story || String(snap?.lastGm || '').trim();
}

function writeRepeatReview(runDir, payload) {
  const turns = (payload.turns || []).join(', ') || '(none)';
  const pads = (payload.pads || []).join(' | ') || '(none)';
  const body = [
    '# REVIEW — stopped after 2 consecutive repeats',
    '',
    'Do not start another T10 until this is reviewed. Chrome left open.',
    '',
    `- **bible:** ${payload.bibleId}`,
    `- **stopped before acting:** T${payload.stopBeforeTurn}`,
    `- **consecutive repeats:** ${payload.consecutiveRepeats}`,
    `- **what repeated:** ${payload.what || '(unspecified)'}`,
    `- **repeat turns:** ${turns}`,
    `- **pads (chips on screen):** ${pads}`,
    `- **last player:** ${payload.lastPlayer || '(none)'}`,
    `- **lastGm:** ${payload.lastGm || '(none)'}`,
    `- **prevGm:** ${payload.prevGm || '(none)'}`,
    `- **reasons:** ${(payload.reasons || []).join(', ') || '(none)'}`,
    '',
    'Harness abort: 2 consecutive same GM story, or tester/hard-floor loop / identical / last-resort reprint.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(runDir, 'REVIEW.md'), body, 'utf8');
  return body;
}

async function playBible(gamePage, bibleId, opts = {}) {
  const spec = BIBLES[bibleId];
  const folder = path.join(runDir, bibleId);
  fs.mkdirSync(folder, { recursive: true });
  const jsonl = path.join(folder, 'turns.jsonl');
  const transcript = path.join(folder, 'transcript.md');
  const resumeThis = Boolean(opts.resume);
  const feedbackClient = opts.feedbackClient || null;
  const saveId = opts.saveId || runSaveId;
  appendMd(transcript, `# ${spec.title} (${bibleId})\n\nHost: ${host}${resumeThis ? '\n\nResume: live tab (no New Game)\n' : '\n'}`);

  let snap;
  let startTurn = 1;
  let lastPlayer = '';
  const recentActions = [];
  let lastJudgedGm = '';
  let hallAnswered = { who: false, want: false, refuse: false };
  let nameTyped = false;
  let completed = 0;
  let autoFightFired = 0;
  let consecutiveRepeats = 0;
  const repeatTurns = [];

  if (resumeThis) {
    snap = await prepareLivePlay(gamePage);
    const live = snap.playReady && !snap.hasMenu && !snap.inNewGame;
    if (!live) {
      appendJsonl(jsonl, {
        event: 'resume_dead_tab',
        bibleId,
        hasMenu: snap.hasMenu,
        inNewGame: snap.inNewGame,
        playReady: snap.playReady,
        playerLines: snap.playerLines || [],
      });
      await showGameMenu(gamePage);
      const login = await loginFounderEmail(gamePage, email, password);
      if (!login.ok) {
        appendJsonl(jsonl, { event: 'login_blocked', ...login });
        return { bibleId, blocked: login };
      }
      await startPremade(gamePage, bibleId);
      snap = await waitOpeningReady(gamePage, { timeoutMs: 90000 });
      startTurn = 1;
    } else {
      const lines = snap.playerLines || [];
      startTurn = fromTurn > 0 ? fromTurn : Math.max(1, lines.length + 1);
      lastPlayer = lines.at(-1) || '';
      recentActions.push(...lines.filter(Boolean));
      lastJudgedGm = storyForBrain(snap);
      nameTyped = lines.some((l) => /^jax$/i.test(l) || /\bmy name is\b/i.test(l));
      for (const line of lines) hallAnswered = markHallTopics(hallAnswered, line);
      appendJsonl(jsonl, {
        event: 'resume',
        bibleId,
        startTurn,
        playerLines: lines,
        gmStory: lastJudgedGm,
        lastGmChrome: snap.lastGmChrome || '',
        chips: snap.chips,
        feedbacks: snap.feedbacks,
        gmStoryCount: snap.gmStoryCount,
        hallAnswered,
      });
      appendMd(
        transcript,
        `## Resume T${startTurn}–T${turns}\n\nPlayer lines already on tab: ${lines.join(' | ') || '(none)'}\n\n`
        + `**GM story:** ${lastJudgedGm || '(none)'}\n\n`
        + (snap.lastGmChrome ? `_Chrome (not the book): ${snap.lastGmChrome}_\n\n` : '')
        + `Chips: ${snap.chips.join(' | ') || '(none)'}\n\n`,
      );
    }
  } else {
    await showGameMenu(gamePage);

    const login = await loginFounderEmail(gamePage, email, password);
    if (!login.ok) {
      appendJsonl(jsonl, { event: 'login_blocked', ...login });
      return { bibleId, blocked: login };
    }

    await startPremade(gamePage, bibleId);
    snap = await waitOpeningReady(gamePage, { timeoutMs: 90000 });
  }

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

  if (!resumeThis || startTurn === 1) {
    appendJsonl(jsonl, {
      event: 'opening',
      bibleId,
      gmStory: storyForBrain(snap),
      lastGmChrome: snap.lastGmChrome || '',
      chips: snap.chips,
      feedbacks: snap.feedbacks,
      gmStoryCount: snap.gmStoryCount,
    });
    appendMd(
      transcript,
      `## Opening\n\n${storyForBrain(snap)}\n\n`
      + (snap.lastGmChrome ? `_Chrome (not the book): ${snap.lastGmChrome}_\n\n` : '')
      + `Chips: ${snap.chips.join(' | ') || '(none)'}\n\n`,
    );
  }

  for (let turn = startTurn; turn <= turns; turn++) {
    hallAnswered = markHallTopics(hallAnswered, lastPlayer);
    const liveChips = filterAnsweredHallChips(snap.chips, hallAnswered);
    const gmStory = storyForBrain(snap);
    const prevGm = lastJudgedGm;
    const skipSelfCompare = resumeThis && turn === startTurn && prevGm && prevGm === gmStory;
    const hardJudge = judgeGmBeat({
      gmStory,
      lastGm: skipSelfCompare ? '' : prevGm,
      lastPlayer,
      waitTimedOut: Boolean(snap.waitTimedOut),
    });
    const chipsOnly = spec.chipsOnly || !snap.inputPresent;
    const decision = await askOpenRouterPlayer({
      bibleId,
      modeLabel: spec.mode,
      turn,
      chipsOnly,
      chips: liveChips,
      lastPlayer,
      recentActions: recentActions.slice(-8),
      gmStory,
      lastGm: skipSelfCompare ? '' : prevGm,
      hallAnswered,
      personaBlock,
      goal: persona.goal,
    });
    if (shouldForceTypedHumanMove(liveChips, recentActions, chipsOnly)) {
      decision.kind = 'free';
      decision.action_kind = 'type';
      if (!decision.action || liveChips.includes(decision.action)
        || /inspect the panel|look around|who are you|ask what they want/i.test(decision.action)) {
        decision.action = naturalTypedFallback(recentActions);
      }
    }
    if (hardJudge.down) {
      decision.thumb = 'down';
      if (hardJudge.nonsense_options) decision.nonsense_options = true;
      const why = `human_floor:${hardJudge.reasons.join(',')}`;
      decision.reason = [decision.reason || decision.comment, why].filter(Boolean).join(' · ').slice(0, 500);
      decision.comment = decision.reason;
    }
    if (decision.action && !liveChips.includes(decision.action)
      && /who are you|ask what they want/i.test(decision.action)
      && (hallAnswered.who || hallAnswered.want)) {
      const nextChip = pickNonHallChip(snap.chips, hallAnswered, recentActions);
      if (nextChip && !shouldForceTypedHumanMove([nextChip], recentActions, chipsOnly)) {
        decision.kind = 'chip';
        decision.action_kind = 'chip';
        decision.action = nextChip;
      } else if (!spec.chipsOnly) {
        decision.kind = 'free';
        decision.action_kind = 'type';
        decision.action = naturalTypedFallback(recentActions);
      }
    }

    if (!liveChips.length && !spec.chipsOnly) {
      decision.kind = 'free';
      decision.action_kind = 'type';
      if (!decision.action || /who are you|ask what they want|what happens if i refuse|inspect the panel/i.test(decision.action)) {
        decision.action = naturalTypedFallback(recentActions);
      }
    }

    let comment = [
      thumbReasonFromDecision(decision),
      decision.note && decision.note !== thumbReasonFromDecision(decision) ? `note: ${decision.note}` : '',
      decision.nonsense_options ? 'flag:nonsense_options' : '',
      decision.future_leak ? 'flag:future_leak' : '',
    ].filter(Boolean).join(' · ').slice(0, 500);
    decision.reason = comment;
    decision.comment = comment;

    const repeat = skipSelfCompare
      ? { hit: false, reasons: [] }
      : detectRepeatSignal({
        gmStory,
        lastGm: prevGm,
        decision: { ...decision, comment },
        hardJudge,
      });
    if (prevGm && !skipSelfCompare) {
      if (repeat.hit) {
        consecutiveRepeats += 1;
        repeatTurns.push(completed || turn);
      } else {
        consecutiveRepeats = 0;
        repeatTurns.length = 0;
      }
    }

    if (consecutiveRepeats >= 2) {
      await gamePage.bringToFront();
      const thumb = await pressThumbWithReason(
        gamePage,
        { thumb: 'down', reason: comment },
        submitThumb,
      );
      let verified = { verified: false, reason: 'no_client' };
      if (feedbackClient) {
        verified = await verifyFeedbackRow(feedbackClient, { saveId, turn });
      }
      console.log(`[ai-player] T${turn} feedback verified=${verified.verified}`);
      appendJsonl(jsonl, {
        event: 'repeat_abort',
        turn,
        bibleId,
        saveId,
        consecutiveRepeats,
        reasons: repeat.reasons,
        gmStory,
        prevGm,
        chipsSeen: snap.chips,
        lastPlayer,
        thumb: 'down',
        thumbOk: thumb.ok,
        thumbReason: thumb.reason || comment,
        verified: verified.verified,
        meta: testerMeta,
      });
      appendMd(
        transcript,
        `## T${turn} (not acted)\n\n**GM:** ${gmStory || '(none)'}\n\n`
        + `Thumb: down · ${comment}\n\n`
        + `Verified: ${verified.verified}\n\n`
        + `_Stopped: 2 consecutive GM repeats at T${turn}. Did not click the next chip._\n\n`,
      );
      appendPlayLog(playLogPath, formatPlayLogLine({
        turn,
        wanted: persona.goal || 'stop the repeat',
        did: '(not acted — repeat abort)',
        happened: gmStory || '(none)',
        thumb: 'down',
        reason: comment,
      }));
      writeRepeatReview(runDir, {
        bibleId,
        stopBeforeTurn: turn,
        consecutiveRepeats,
        what: repeat.reasons.join(', ') || 'repeat',
        turns: repeatTurns,
        pads: snap.chips,
        lastPlayer,
        lastGm: gmStory,
        prevGm,
        reasons: repeat.reasons,
      });
      console.log(`AI_PLAYER abort ${bibleId}: 2 consecutive GM repeats — wrote REVIEW.md; Chrome left open.`);
      return {
        bibleId,
        ok: false,
        stoppedRepeat: true,
        turns: completed,
        startTurn,
        resumed: resumeThis,
        autoFightSelector: AUTO_FIGHT_SELECTOR,
        autoFightFired,
        stoppedNoGm: false,
        stopBeforeTurn: turn,
        consecutiveRepeats,
        review: path.join(runDir, 'REVIEW.md'),
      };
    }

    await gamePage.bringToFront();
    await dismissAutoFightTip(gamePage);

    // Thumb the judged GM beat (reason as comment), verify the row, then act in the real UI.
    const thumb = await pressThumbWithReason(
      gamePage,
      { thumb: decision.thumb, reason: comment },
      submitThumb,
    );
    let verified = { verified: false, reason: 'no_client' };
    if (feedbackClient) {
      verified = await verifyFeedbackRow(feedbackClient, { saveId, turn });
    }
    console.log(`[ai-player] T${turn} feedback verified=${verified.verified}`);
    const afterThumb = await readGameSnapshot(gamePage);

    const nameChip = snap.chips.some((c) => /give (your |them your )?name/i.test(c));
    const alreadyGaveNameChip = /give (your |them your )?name/i.test(lastPlayer);
    let acted = '';
    let kind = decision.action_kind || (decision.kind === 'free' ? 'type' : 'chip');
    if (chipsOnly) kind = 'chip';
    const fightLive = afterThumb.autoFightReady || snap.autoFightReady
      || afterThumb.combatChips || snap.combatChips;
    if (!chipsOnly && fightLive && !nameChip) {
      let auto = await clickAutoFight(gamePage);
      if (!auto) {
        await new Promise((r) => setTimeout(r, 800));
        auto = await clickAutoFight(gamePage);
      }
      if (auto) {
        acted = auto;
        kind = 'auto_fight';
      }
    }

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
    if (!acted && kind === 'chip' && decision.action && !/\b(press the attack|try to flee|parley|attack|flee)\b/i.test(decision.action)) {
      acted = await clickChip(gamePage, decision.action);
    }
    if (!acted && kind === 'chip') {
      const safe = pickNonHallChip(snap.chips, hallAnswered, recentActions);
      if (safe && !shouldForceTypedHumanMove([safe], recentActions, chipsOnly)) {
        acted = await clickChip(gamePage, safe);
        kind = 'chip_fallback';
      }
    }
    if (!acted && !chipsOnly) {
      const line = decision.action || (nameChip && !nameTyped ? 'Jax' : naturalTypedFallback(recentActions));
      await typePlayerAction(gamePage, line);
      acted = line;
      kind = 'type';
      if (/^jax$/i.test(line)) nameTyped = true;
    }
    if (!acted) throw new Error(`No legal action on ${bibleId} T${turn}`);

    let next;
    try {
      next = await waitNewGmBeat(gamePage, afterThumb, { timeoutMs: kind === 'auto_fight' ? 180000 : 90000 });
    } catch (err) {
      next = err?.snapshot || await readGameSnapshot(gamePage);
      next.waitTimedOut = true;
    }
    const waitTimedOut = Boolean(next.waitTimedOut) && !next.newGmBubble;
    const newGmBubble = Boolean(next.newGmBubble)
      || Number(next.gmStoryCount || 0) > Number(afterThumb.gmStoryCount || 0);
    const nextStory = storyForBrain(next);
    let finalThumb = decision.thumb;
    let finalReason = thumb.reason || comment;
    if (waitTimedOut) {
      finalThumb = 'down';
      finalReason = [comment, 'timeout: no new GM story'].filter(Boolean).join(' · ').slice(0, 500);
      await pressThumbWithReason(
        gamePage,
        { thumb: 'down', reason: 'timeout: no new GM story' },
        submitThumb,
      );
    }

    appendJsonl(jsonl, {
      event: waitTimedOut ? 'turn_timeout' : 'turn',
      turn,
      bibleId,
      saveId,
      actionKind: kind,
      kind: decision.kind || (kind === 'type' ? 'free' : 'chip'),
      autoFightSelector: AUTO_FIGHT_SELECTOR,
      autoFightFired: kind === 'auto_fight',
      playerAction: acted,
      chipsSeen: snap.chips,
      gmStory: nextStory,
      lastGmChrome: next.lastGmChrome || '',
      gmStoryCount: next.gmStoryCount,
      prevGmStoryCount: afterThumb.gmStoryCount,
      feedbacks: next.feedbacks,
      prevFeedbacks: afterThumb.feedbacks,
      newGmBubble,
      thumb: finalThumb,
      thumbOk: thumb.ok,
      thumbReason: finalReason,
      verified: verified.verified,
      waitTimedOut,
      continuedAfterTimeout: waitTimedOut,
      meta: testerMeta,
      gemini: {
        note: decision.note,
        nonsense_options: decision.nonsense_options,
        future_leak: decision.future_leak,
        raw_ok: decision.raw_ok,
        model: decision.model || openRouterPlayerModel(),
        reason: finalReason,
      },
    });
    appendMd(
      transcript,
      `## T${turn}\n\n**You:** ${acted} (${kind})\n\n**GM:** ${nextStory || '(no new story — not faked)'}\n\n`
      + `New GM bubble: ${newGmBubble ? 'yes' : 'NO'} · count ${afterThumb.gmStoryCount || 0}→${next.gmStoryCount || 0}`
      + `${waitTimedOut ? ' · WAIT TIMEOUT (continuing)' : ''}\n\n`
      + `Thumb: ${finalThumb} · ${finalReason}\n\n`
      + `Verified: ${verified.verified}\n\n`,
    );
    appendPlayLog(playLogPath, formatPlayLogLine({
      turn,
      wanted: persona.goal || decision.note || 'progress the scene',
      did: acted,
      happened: nextStory || gmStory || '(none)',
      thumb: finalThumb,
      reason: finalReason,
    }));
    lastPlayer = acted;
    recentActions.push(acted);
    lastJudgedGm = gmStory;
    snap = next;
    if (waitTimedOut) snap.waitTimedOut = true;
    completed = turn;
    if (kind === 'auto_fight') autoFightFired += 1;
  }

  return {
    bibleId,
    ok: true,
    turns: completed,
    startTurn,
    resumed: resumeThis,
    autoFightSelector: AUTO_FIGHT_SELECTOR,
    autoFightFired,
    stoppedNoGm: false,
    stoppedRepeat: false,
  };
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

  const playerModel = openRouterPlayerModel();
  const playerLicence = licenceFor(playerModel);
  const testerOnly = testerOnlyForModel(playerModel);
  console.log(
    `AI_PLAYER banner: model=${playerModel} licence=${playerLicence}`
    + `${testerOnly ? ' testerOnly=true' : ''} — never default to Flash; Flash is not the judge.`,
  );
  if (!loginCheck && isFlashJudgeModel(playerModel) && process.env.AI_PLAYER_ALLOW_FLASH !== '1') {
    console.log(JSON.stringify({
      ok: false,
      blocked: 'flash_is_not_the_judge',
      message: 'Never default to Flash. Default is deepseek/deepseek-v4-pro (alt qwen/qwen3-235b-a22b-2507). Set AI_PLAYER_ALLOW_FLASH=1 only for a throwaway smoke.',
      playerModel,
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

  let feedbackClient = null;
  if (!loginCheck) {
    const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const anonKey = (
      process.env.VITE_SUPABASE_ANON_KEY
      || process.env.SUPABASE_ANON_KEY
      || ''
    ).trim();
    const session = await createTesterSessionClient({
      url,
      anonKey,
      email,
      password,
    });
    if (session.ok) {
      feedbackClient = session.client;
    } else {
      console.log(`[ai-player] feedback verify session skipped: ${session.error}`);
    }
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
    resume,
    turns,
    bibles,
    runDir,
    saveId: runSaveId,
    persona: { id: persona.id, goal: persona.goal },
    playerBrain: 'openrouter',
    playerModel,
    playerLicence,
    testerOnly,
    meta: testerMeta,
    playLog: playLogPath,
    results: [],
    abortedRepeat: false,
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
          const result = await playBible(gamePage, bibleId, {
            resume,
            feedbackClient,
            saveId: runSaveId,
          });
          summary.results.push(result);
          if (result.stoppedRepeat) {
            summary.abortedRepeat = true;
            console.log('AI_PLAYER stopped the run after 2 consecutive repeats. No next T10.');
            break;
          }
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
