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
import { pathToFileURL } from 'node:url';
import { loadProjectEnv, ROOT } from './loadEnv.mjs';
import {
  AUTO_FIGHT_SELECTOR,
  BIBLES,
  clickAutoFight,
  clickChip,
  consumeCoverClear,
  dismissAutoFightTip,
  loginFounderEmail,
  prepareLivePlay,
  readGameSnapshot,
  readPlace,
  readUiSaveId,
  startPremade,
  submitThumb,
  typePlayerAction,
  waitNewGmBeat,
  waitOpeningReady,
  waitSetupAdvance,
} from './gameTab.mjs';
import { startTurnClock, turnTimeFields } from './turnTiming.mjs';
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
  noteTypedNotSent,
  shouldForceChipAfterTypedFail,
  typedStuckVerdict,
} from './typedSend.mjs';
import { classifyChipClick, modelLineIfDistinct } from './inputChip.mjs';
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
  feedbackKeyFromUpsert,
  pressThumbWithReason,
  thumbReasonFromDecision,
} from './feedbackVerify.mjs';
import { bindCoverLog } from './overlay.mjs';
import { verifyThumb, runVerdict, runEndedResult, shouldThumb, replyKey, voteSkipWrong } from './runVerdict.mjs';

import { licenceFor } from './playerLicence.mjs';
import {
  SMOKE_GM_REPLIES,
  isSetupStep,
  noteRepeat,
  planSetupAction,
  settleHarnessTurn,
  setupStuck,
} from './setupStep.mjs';

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

/** turns.jsonl row for event turn / turn_timeout. Existing field names stay. */
export function buildTurnLogRow(row) {
  const waitTimedOut = Boolean(row.waitTimedOut);
  return {
    event: row.event || (waitTimedOut ? 'turn_timeout' : 'turn'),
    turn: row.turn,
    bibleId: row.bibleId,
    saveId: row.saveId,
    actionKind: row.actionKind,
    kind: row.kind,
    autoFightSelector: row.autoFightSelector,
    autoFightFired: row.autoFightFired,
    playerAction: row.playerAction,
    chipsSeen: row.chipsSeen,
    gmStory: row.gmStory,
    lastGmChrome: row.lastGmChrome,
    gmStoryCount: row.gmStoryCount,
    prevGmStoryCount: row.prevGmStoryCount,
    feedbacks: row.feedbacks,
    prevFeedbacks: row.prevFeedbacks,
    newGmBubble: row.newGmBubble,
    thumb: row.thumb,
    thumbOk: row.thumbOk,
    thumbReason: row.thumbReason,
    verified: row.verified,
    verifyReason: row.verifyReason,
    feedbackKey: row.feedbackKey ?? null,
    thumbSkipped: row.thumbSkipped ?? null,
    noReply: row.noReply,
    repaired: Boolean(row.repaired),
    waitTimedOut,
    continuedAfterTimeout: row.continuedAfterTimeout,
    meta: row.meta,
    gemini: row.gemini,
    ts: row.ts,
    replyMs: row.replyMs,
    place: row.place ?? null,
    placeId: row.placeId ?? null,
    placeSource: row.placeSource || 'none',
    voteCarried: row.voteCarried === true,
    voteTarget: row.voteTarget ?? null,
    voteSkipWrong: row.voteSkipWrong === true,
  };
}

/** Poll the page after a chip click. A real turn wins; an opened box is kept until the window ends. */
export async function readChipClickEffect(page, before, { timeoutMs = 1500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let opened = false;
  while (Date.now() <= deadline) {
    const after = await readGameSnapshot(page);
    const effect = classifyChipClick({ before, after });
    if (effect === 'turn_sent') return 'turn_sent';
    if (effect === 'input_opened') opened = true;
    if (Date.now() >= deadline) break;
    await new Promise((r) => setTimeout(r, 80));
  }
  return opened ? 'input_opened' : 'nothing';
}

/**
 * Overlay still covering the box after one dismiss: a finished chip turn with a
 * new GM reply is a soft warning. No completed chip stays a harness error.
 */
export function classifyOverlayTurn({ overlayBlocked, chipCompleted, newGm, voteVerified } = {}) {
  if (!overlayBlocked) return { softWarnings: 0, harnessErrors: 0 };
  const voteOk = voteVerified === undefined ? true : voteVerified === true;
  if (chipCompleted && newGm && voteOk) return { softWarnings: 1, harnessErrors: 0 };
  return { softWarnings: 0, harnessErrors: 1 };
}

/** Identity locked after the first completed turn. Later snaps that leave it are a reset. */
export function lockGameIdentity(prev, snap) {
  const seen = snap?.saveId ? String(snap.saveId) : '';
  const count = Number(snap?.gmStoryCount || 0);
  const nameStep = Boolean(snap?.nameStep);
  if (!prev?.locked) {
    return {
      locked: true,
      saveId: seen,
      gmStoryCount: count,
      // A local setup step (tabletop creation) comes before the name step: not past the opening yet.
      pastOpening: !nameStep && !snap?.setup,
    };
  }
  return {
    locked: true,
    saveId: prev.saveId || seen,
    gmStoryCount: Math.max(Number(prev.gmStoryCount || 0), count),
    pastOpening: Boolean(prev.pastOpening) || (!nameStep && !snap?.setup),
  };
}

/**
 * Save id changed, story count fell, the name step came back, or a new-game
 * modal / the main menu is up. Null when this is still the same game.
 */
export function assessGameReset(baseline, snap, turn) {
  if (!baseline?.locked) return null;
  const afterSave = snap?.saveId ? String(snap.saveId) : '';
  const afterCount = Number(snap?.gmStoryCount || 0);
  const evidence = [];
  if (baseline.saveId && afterSave && afterSave !== baseline.saveId) evidence.push('save_id');
  if (Number.isFinite(Number(baseline.gmStoryCount)) && afterCount < Number(baseline.gmStoryCount)) {
    evidence.push('story_count');
  }
  if (baseline.pastOpening && snap?.nameStep) evidence.push('name_step');
  if (snap?.inNewGame) evidence.push('new_game_modal');
  if (snap?.hasMenu) evidence.push('main_menu');
  if (!evidence.length) return null;
  return {
    event: 'game_reset',
    turn,
    before: { saveId: baseline.saveId || null, gmStoryCount: baseline.gmStoryCount },
    after: {
      saveId: afterSave || null,
      gmStoryCount: afterCount,
      inNewGame: Boolean(snap?.inNewGame),
      hasMenu: Boolean(snap?.hasMenu),
      nameStep: Boolean(snap?.nameStep),
    },
    evidence,
  };
}

/** One guard step: a reset stops the bible before vote. Shared by the turn loop. */
export function stepResetGuard({ baseline, snap, turn, vote } = {}) {
  const reset = assessGameReset(baseline, snap, turn);
  if (reset) {
    return {
      baseline,
      reset,
      voted: false,
      stop: { ok: false, harnessError: 'game_reset', gameReset: reset },
    };
  }
  let voted = false;
  if (typeof vote === 'function') {
    vote(turn);
    voted = true;
  }
  return {
    baseline: lockGameIdentity(baseline, snap),
    reset: null,
    voted,
    stop: null,
  };
}

/** Re-asked turn carries the vote already pressed. press is false the second time. */
export function nextVoteAction(priorVote) {
  if (!priorVote) return { press: true, voteCarried: false };
  return {
    press: false,
    voteCarried: true,
    verified: priorVote.verified,
    verifyReason: priorVote.verifyReason,
    feedbackKey: priorVote.feedbackKey ?? null,
    thumb: priorVote.thumb,
    thumbOk: priorVote.thumbOk,
    thumbReason: priorVote.thumbReason,
  };
}

export function withSoftWarningTotal(summary) {
  const results = summary?.results || [];
  let softWarnings = 0;
  for (const r of results) softWarnings += Number(r?.softWarnings || 0);
  return { ...summary, softWarnings };
}

/** transcript.md turn heading: T<n> (<place>, <replyMs/1000>s). */
export function turnTranscriptHeading(turn, place, replyMs) {
  const label = place ? String(place) : 'unknown';
  const secs = Number(replyMs) / 1000;
  return `## T${turn} (${label}, ${secs}s)`;
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
  let unverified = 0;
  let harnessErrors = 0;
  let softWarnings = 0;
  let consecutiveHarnessErrors = 0;
  /** q75: typed_action_not_sent only — must not reset on a successful brain reply. */
  let consecutiveTypedNotSent = 0;
  let votedFeedbacks = -1;
  let carriedVote = null;
  let coverTurn = 0;
  let gameIdentity = null;
  // Every counter a stop summary reads is declared here, before any summary helper (00:33 decision).
  let overlayBlockedThisTurn = false;
  let thumbsSkipped = 0;
  const ratedKeys = new Set(); // GM replies already rated, by replyKey (00:40 decision)
  let voteTarget = null;
  let skippedNewReply = false;
  const turnRows = [];
  bindCoverLog((row) => {
    appendJsonl(jsonl, { turn: coverTurn, ...row });
  });
  const nameStepOf = (row) => (row?.chips || []).some((c) => /give (your |them your )?name/i.test(c));
  const probeIdentity = async (row) => ({
    saveId: await readUiSaveId(gamePage),
    gmStoryCount: Number(row?.gmStoryCount || 0),
    inNewGame: Boolean(row?.inNewGame),
    hasMenu: Boolean(row?.hasMenu),
    nameStep: nameStepOf(row),
    setup: Boolean(row?.setupSignal),
  });
  const stopReset = (reset) => {
    appendJsonl(jsonl, reset);
    return {
      bibleId,
      ok: false,
      harnessError: 'game_reset',
      gameReset: reset,
      turns: completed,
      turnLog: turnRows,
      startTurn,
      resumed: resumeThis,
      autoFightSelector: AUTO_FIGHT_SELECTOR,
      autoFightFired,
      stoppedNoGm: false,
      stoppedRepeat: false,
      unverified,
      harnessErrors,
      softWarnings,
      thumbsSkipped,
      verifyOn: Boolean(feedbackClient),
    };
  };
  try {
  const noteOverlay = (turnNo) => {
    coverTurn = turnNo;
    const cleared = consumeCoverClear();
    if (cleared?.cover && cleared.cleared === false) overlayBlockedThisTurn = true;
    return cleared;
  };
  // One vote per GM reply; a turn with no new reply is logged as no_reply, never a vote.
  const voteOnce = async (turnNo, thumbDecision) => {
    voteTarget = replyKey(snap);
    const gate = shouldThumb({ targetKey: voteTarget, ratedKeys });
    if (!gate.vote) {
      thumbsSkipped += 1;
      console.log(`[ai-player] T${turnNo} thumb skipped (${gate.reason})`);
      return {
        thumb: { ok: true, skipped: gate.reason, thumb: null, reason: '' },
        verified: { verified: null, reason: gate.reason, lookup: null },
      };
    }
    const thumb = await pressThumbWithReason(gamePage, thumbDecision, submitThumb);
    if (thumb.ok) { votedFeedbacks = Number(snap.feedbacks); if (voteTarget) ratedKeys.add(voteTarget); }
    let verified = { verified: false, reason: 'no_client', lookup: null };
    if (feedbackClient) verified = await verifyThumb(feedbackClient, thumb, opts.userId);
    console.log(`[ai-player] T${turnNo} feedback verified=${verified.verified}${verified.verified ? '' : ` reason=${verified.reason}`}`);
    if (feedbackClient && verified.verified === false) unverified += 1;
    return { thumb, verified };
  };

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

  let gmReplies = 0;
  let setupClicks = 0;
  let playedSlots = 0;
  const slotTarget = smoke ? SMOKE_GM_REPLIES : Math.max(0, turns - startTurn + 1);
  const stopSetup = (reason, exitCode) => ({
    bibleId,
    ok: false,
    error: reason,
    reason,
    exitCode,
    turns: completed,
    turnLog: turnRows,
    startTurn,
    resumed: resumeThis,
    autoFightSelector: AUTO_FIGHT_SELECTOR,
    autoFightFired,
    stoppedNoGm: String(reason || '').startsWith('smoke_no_gm_reply'),
    stoppedRepeat: false,
    unverified,
    harnessErrors,
    softWarnings,
    thumbsSkipped,
    verifyOn: Boolean(feedbackClient),
  });
  for (let turn = startTurn; smoke ? gmReplies < SMOKE_GM_REPLIES : playedSlots < slotTarget; turn++) {
    const endedNow = runEndedResult(snap);
    if (endedNow) {
      appendJsonl(jsonl, { event: 'run_ended', turn, bibleId, result: endedNow });
      return {
        bibleId, ok: true, ended: true, result: endedNow, turns: completed, startTurn,
        resumed: resumeThis, stoppedRepeat: false, stoppedNoGm: false, harnessErrors, unverified,
      };
    }
    overlayBlockedThisTurn = false;
    coverTurn = turn;
    const resetNow = assessGameReset(gameIdentity, await probeIdentity(snap), turn);
    if (resetNow) return stopReset(resetNow);
    const setup = isSetupStep(snap);
    const stuck = setupStuck({ smoke, setup, setupClicks });
    if (stuck.stop) return stopSetup(stuck.reason, stuck.exitCode);
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
    if (decision.harnessError) {
      // Harness error, not a game verdict: no thumb, no action; re-ask this turn (max 3 in a row).
      harnessErrors += 1;
      consecutiveHarnessErrors += 1;
      console.log(`[ai-player] T${turn} harness_error ${decision.harnessError} finish=${JSON.stringify(decision.harnessDetail?.finish || [])}`);
      appendJsonl(jsonl, {
        event: 'harness_error',
        turn,
        bibleId,
        saveId,
        harnessError: decision.harnessError,
        harnessDetail: decision.harnessDetail || null,
        consecutive: consecutiveHarnessErrors,
        chipsSeen: snap.chips,
        meta: testerMeta,
      });
      if (consecutiveHarnessErrors >= 3) {
        console.log(`AI_PLAYER fail ${bibleId}: 3 harness errors in a row at T${turn}`);
        return {
          bibleId,
          ok: false,
          harnessError: decision.harnessError,
          harnessErrors,
          unverified,
          turns: completed,
          startTurn,
          resumed: resumeThis,
          autoFightSelector: AUTO_FIGHT_SELECTOR,
          autoFightFired,
          stoppedNoGm: false,
          stoppedRepeat: false,
        };
      }
      turn -= 1;
      continue;
    }
    consecutiveHarnessErrors = 0;
    // q75: after 3 consecutive typed_action_not_sent, force an on-screen chip (do not keep typing).
    if (!setup && !chipsOnly && shouldForceChipAfterTypedFail(consecutiveTypedNotSent) && liveChips.length) {
      const forced = pickNonHallChip(liveChips, hallAnswered, recentActions) || liveChips[0];
      if (forced) {
        decision.kind = 'chip';
        decision.action_kind = 'chip';
        decision.action = forced;
        console.log(`[ai-player] T${turn} typed_not_sent×${consecutiveTypedNotSent} → force chip: ${forced}`);
      }
    } else if (setup) {
      const planned = planSetupAction({ action: decision.action, chips: snap.chips });
      decision.kind = 'chip';
      decision.action_kind = 'chip';
      decision.action = planned.action;
    } else if (shouldForceTypedHumanMove(liveChips, recentActions, chipsOnly) && !shouldForceChipAfterTypedFail(consecutiveTypedNotSent)) {
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
    if (!setup && decision.action && !liveChips.includes(decision.action)
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

    if (!setup && !liveChips.length && !spec.chipsOnly) {
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
    if (prevGm && !skipSelfCompare && !setup) {
      const nextRepeats = noteRepeat(consecutiveRepeats, { setupTurn: false, repeatHit: repeat.hit });
      if (repeat.hit) {
        repeatTurns.push(completed || turn);
      } else {
        repeatTurns.length = 0;
      }
      consecutiveRepeats = nextRepeats;
    }

    if (consecutiveRepeats >= 2) {
      await gamePage.bringToFront();
      const { thumb, verified } = await voteOnce(turn, { thumb: 'down', reason: comment });
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
        verifyReason: verified.reason,
        feedbackKey: verified.lookup || null,
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
        unverified,
        harnessErrors,
      };
    }

    await gamePage.bringToFront();
    await dismissAutoFightTip(gamePage);
    noteOverlay(turn);

    // Thumb the judged GM beat once (reason as comment), verify the row, then act in the real UI.
    // A re-asked turn carries the vote already pressed on this reply. Never press twice.
    const votePlan = nextVoteAction(carriedVote);
    let thumb;
    let verified;
    let voteCarried = false;
    if (!votePlan.press) {
      carriedVote = null;
      voteCarried = true;
      thumb = votePlan.thumb;
      verified = {
        verified: votePlan.verified,
        reason: votePlan.verifyReason,
        lookup: votePlan.feedbackKey,
      };
    } else {
      const voted = await voteOnce(turn, { thumb: decision.thumb, reason: comment });
      thumb = voted.thumb;
      verified = voted.verified;
    }
    const afterThumb = await readGameSnapshot(gamePage);

    const nameChip = snap.chips.some((c) => /give (your |them your )?name/i.test(c));
    const alreadyGaveNameChip = /give (your |them your )?name/i.test(lastPlayer);
    let acted = '';
    let typeFail = '';
    let typeOverlay = null;
    let kind = decision.action_kind || (decision.kind === 'free' ? 'type' : 'chip');
    if (chipsOnly) kind = 'chip';
    const fightLive = afterThumb.autoFightReady || snap.autoFightReady
      || afterThumb.combatChips || snap.combatChips;
    let submitStamp = null;
    if (!setup && !chipsOnly && fightLive && !nameChip) {
      let stamp = startTurnClock();
      let auto = await clickAutoFight(gamePage);
      if (auto) submitStamp = stamp;
      if (!auto) {
        await new Promise((r) => setTimeout(r, 800));
        stamp = startTurnClock();
        auto = await clickAutoFight(gamePage);
        if (auto) submitStamp = stamp;
      }
      if (auto) {
        acted = auto;
        kind = 'auto_fight';
      }
      noteOverlay(turn);
    }

    const pickingNameChip = /give (your |them your )?name/i.test(decision.action || '');
    if (!setup && !chipsOnly && nameChip && !nameTyped && (alreadyGaveNameChip || pickingNameChip || turn === 1)) {
      const stamp = startTurnClock();
      const sentName = await typePlayerAction(gamePage, 'Jax');
      noteOverlay(turn);
      if (sentName.sent) {
        acted = 'Jax';
        kind = 'type';
        nameTyped = true;
        submitStamp = stamp;
      } else {
        typeFail = sentName.reason;
        typeOverlay = sentName.overlay || null;
      }
    } else if (!setup && !chipsOnly && nameChip && (alreadyGaveNameChip || nameTyped)) {
      const stamp = startTurnClock();
      const sentName = await typePlayerAction(gamePage, 'Jax');
      noteOverlay(turn);
      if (sentName.sent) {
        submitStamp = stamp;
        acted = 'Jax';
        kind = 'type';
        nameTyped = true;
      } else {
        typeFail = sentName.reason;
        typeOverlay = sentName.overlay || null;
      }
    }
    if (!acted && kind === 'chip' && decision.action && !/\b(press the attack|try to flee|parley|attack|flee)\b/i.test(decision.action)) {
      submitStamp = startTurnClock();
      acted = await clickChip(gamePage, decision.action);
      noteOverlay(turn);
    }
    if (!acted && kind === 'chip') {
      const safe = pickNonHallChip(snap.chips, hallAnswered, recentActions);
      if (safe && !shouldForceTypedHumanMove([safe], recentActions, chipsOnly)) {
        submitStamp = startTurnClock();
        acted = await clickChip(gamePage, safe);
        noteOverlay(turn);
        kind = 'chip_fallback';
      }
    }
    if (!acted && !setup && !chipsOnly && !typeFail && !shouldForceChipAfterTypedFail(consecutiveTypedNotSent)) {
      const line = decision.action || (nameChip && !nameTyped ? 'Jax' : naturalTypedFallback(recentActions));
      submitStamp = startTurnClock();
      const sentLine = await typePlayerAction(gamePage, line);
      noteOverlay(turn);
      if (sentLine.sent) {
        acted = line;
        kind = 'type';
        if (/^jax$/i.test(line)) nameTyped = true;
      } else {
        typeFail = sentLine.reason;
        typeOverlay = sentLine.overlay || null;
      }
    }
    // q75: threshold already reached earlier this run — chip was forced above; if it missed, stop.
    if (!acted && !typeFail && shouldForceChipAfterTypedFail(consecutiveTypedNotSent)) {
      const verdict = typedStuckVerdict(turn);
      console.log(`AI_PLAYER fail ${bibleId}: ${verdict}`);
      return {
        bibleId, ok: false, harnessError: 'typed_action_not_sent', harnessDetail: verdict,
        harnessErrors, unverified, thumbsSkipped,
        turns: completed, startTurn, resumed: resumeThis, autoFightSelector: AUTO_FIGHT_SELECTOR,
        autoFightFired, stoppedNoGm: false, stoppedRepeat: false,
      };
    }
    if (acted && (kind === 'chip' || kind === 'chip_fallback') && !setup && !chipsOnly) {
      const chipEffect = await readChipClickEffect(gamePage, afterThumb);
      if (chipEffect === 'input_opened') {
        const line = modelLineIfDistinct(decision, acted) || naturalTypedFallback(recentActions);
        if (!submitStamp) submitStamp = startTurnClock();
        let sentLine;
        try {
          sentLine = await typePlayerAction(gamePage, line);
        } catch (err) {
          sentLine = { sent: false, reason: String(err?.message || err) };
        }
        noteOverlay(turn);
        if (sentLine.sent) {
          acted = line;
          kind = 'chip_then_type';
        } else {
          typeFail = sentLine.reason;
          typeOverlay = sentLine.overlay || null;
          acted = '';
        }
      }
    }
    if (!acted && typeFail && String(typeFail).startsWith('input_covered:')) {
      const safe = pickNonHallChip(snap.chips, hallAnswered, recentActions);
      if (safe && !/\b(press the attack|try to flee|parley|attack|flee)\b/i.test(safe)) {
        submitStamp = startTurnClock();
        acted = await clickChip(gamePage, safe);
        noteOverlay(turn);
        if (acted) kind = 'chip_fallback';
      }
      if (acted) {
        typeFail = '';
      }
    }
    if (!acted && typeFail) {
      // The typed line never reached the game: harness error (not a no-reply turn); re-ask this turn.
      harnessErrors += 1;
      consecutiveTypedNotSent = noteTypedNotSent(consecutiveTypedNotSent, { failed: true });
      consecutiveHarnessErrors += 1;
      console.log(`[ai-player] T${turn} harness_error typed_action_not_sent ${typeFail} consecutive=${consecutiveTypedNotSent}`);
      appendJsonl(jsonl, {
        event: 'harness_error',
        turn,
        bibleId,
        saveId,
        harnessError: 'typed_action_not_sent',
        harnessDetail: { reason: typeFail, line: decision.action || '' },
        consecutive: consecutiveTypedNotSent,
        chipsSeen: snap.chips,
        meta: testerMeta,
      });
      // After 3 typed fails: one chip attempt this same turn; if that also fails, stop with a clear verdict.
      if (shouldForceChipAfterTypedFail(consecutiveTypedNotSent)) {
        const safe = pickNonHallChip(snap.chips, hallAnswered, recentActions) || (snap.chips || [])[0];
        if (safe) {
          submitStamp = startTurnClock();
          acted = await clickChip(gamePage, safe);
          noteOverlay(turn);
          if (acted) {
            kind = 'chip_fallback';
            typeFail = '';
            consecutiveTypedNotSent = noteTypedNotSent(consecutiveTypedNotSent, { failed: false });
            consecutiveHarnessErrors = 0;
          }
        }
        if (!acted) {
          const verdict = typedStuckVerdict(turn);
          console.log(`AI_PLAYER fail ${bibleId}: ${verdict}`);
          return {
            bibleId, ok: false, harnessError: 'typed_action_not_sent', harnessDetail: verdict,
            harnessErrors, unverified, thumbsSkipped,
            turns: completed, startTurn, resumed: resumeThis, autoFightSelector: AUTO_FIGHT_SELECTOR,
            autoFightFired, stoppedNoGm: false, stoppedRepeat: false,
          };
        }
      } else {
        carriedVote = {
          verified: verified.verified,
          verifyReason: verified.reason,
          feedbackKey: verified.lookup ?? null,
          thumb,
          thumbOk: thumb.ok,
          thumbReason: thumb.reason || comment,
        };
        turn -= 1;
        continue;
      }
    }
    if (acted) {
      consecutiveTypedNotSent = noteTypedNotSent(consecutiveTypedNotSent, { failed: false });
    }
    if (!acted) throw new Error(`No legal action on ${bibleId} T${turn}`);
    if (!submitStamp) submitStamp = startTurnClock();

    let next;
    try {
      next = setup
        ? await waitSetupAdvance(gamePage, afterThumb, { timeoutMs: 8000 })
        : await waitNewGmBeat(gamePage, afterThumb, { timeoutMs: kind === 'auto_fight' ? 180000 : 90000 });
    } catch (err) {
      next = err?.snapshot || await readGameSnapshot(gamePage);
      next.waitTimedOut = true;
    }
    const endedNext = runEndedResult(next);
    if (endedNext) {
      appendJsonl(jsonl, { event: 'run_ended', turn, bibleId, result: endedNext });
      return {
        bibleId, ok: true, ended: true, result: endedNext, turns: completed, startTurn,
        resumed: resumeThis, stoppedRepeat: false, stoppedNoGm: false, harnessErrors, unverified,
      };
    }
    const setupProgress = Boolean(setup && next.setupAdvanced);
    const waitTimedOut = Boolean(next.waitTimedOut) && !next.newGmBubble && !setupProgress;
    const newGmBubble = !setup && (
      Boolean(next.newGmBubble)
      || Number(next.gmStoryCount || 0) > Number(afterThumb.gmStoryCount || 0)
    );
    const nextStory = storyForBrain(next);
    if (overlayBlockedThisTurn) {
      const outcome = classifyOverlayTurn({
        overlayBlocked: true,
        chipCompleted: Boolean(acted) && (kind === 'chip' || kind === 'chip_fallback'),
        newGm: newGmBubble,
        voteVerified: verified.verified === true && !thumb.skipped,
      });
      softWarnings += outcome.softWarnings;
      if (outcome.harnessErrors) {
        harnessErrors += outcome.harnessErrors;
        appendJsonl(jsonl, {
          event: 'harness_error',
          turn,
          bibleId,
          saveId,
          harnessError: 'overlay_blocked',
          harnessDetail: { steps: typeOverlay?.steps || [], selector: typeOverlay?.cover?.selector || '' },
          chipsSeen: snap.chips,
          meta: testerMeta,
        });
      }
    }
    // The vote above was on the previous reply (or carried from the first attempt). A timeout is logged as no_reply, never as a second vote.
    const finalThumb = voteCarried ? (thumb?.thumb ?? null) : (thumb.skipped ? null : decision.thumb);
    const finalReason = voteCarried
      ? (thumb?.reason || comment)
      : (thumb.skipped ? `(no vote: ${thumb.skipped})` : (thumb.reason || comment));
    const timing = turnTimeFields(submitStamp);
    const where = await readPlace(gamePage);

    const voteSkipWrongNow = voteCarried !== true && voteSkipWrong({ skipped: thumb?.skipped, targetKey: voteTarget, ratedKeys });
    if (voteSkipWrongNow) skippedNewReply = true;
    const turnRow = buildTurnLogRow({
      event: waitTimedOut ? 'turn_timeout' : 'turn',
      turn,
      bibleId,
      saveId,
      actionKind: kind,
      kind: kind === 'chip_then_type' ? 'chip_then_type' : (decision.kind || (kind === 'type' ? 'free' : 'chip')),
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
      verifyReason: verified.reason,
      feedbackKey: verified.lookup || null,
      voteCarried,
      thumbSkipped: thumb.skipped || null,
      voteTarget: voteCarried ? null : voteTarget,
      voteSkipWrong: voteSkipWrongNow,
      noReply: waitTimedOut,
      repaired: Boolean(decision.repaired),
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
      ts: timing.ts,
      replyMs: timing.replyMs,
      place: where.place,
      placeId: where.placeId,
      placeSource: where.placeSource,
    });
    turnRows.push(turnRow);
    appendJsonl(jsonl, turnRow);
    const afterProbe = await probeIdentity(next);
    const upsertSave = feedbackKeyFromUpsert(thumb?.upsert)?.saveId || '';
    if (!afterProbe.saveId && upsertSave) afterProbe.saveId = upsertSave;
    const resetAfter = assessGameReset(gameIdentity, afterProbe, turn);
    if (resetAfter) return stopReset(resetAfter);
    gameIdentity = lockGameIdentity(gameIdentity, afterProbe);
    appendMd(
      transcript,
      `${turnTranscriptHeading(turn, where.place, timing.replyMs)}\n\n**You:** ${acted} (${kind})\n\n**GM:** ${nextStory || '(no new story — not faked)'}\n\n`
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
    lastJudgedGm = setup ? lastJudgedGm : gmStory;
    snap = next;
    if (waitTimedOut) snap.waitTimedOut = true;
    completed = turn;
    if (kind === 'auto_fight') autoFightFired += 1;
    const settled = settleHarnessTurn({
      smoke,
      setupTurn: setup,
      newGmReply: newGmBubble,
      turn,
      gmReplies,
      setupClicks,
      playedSlots,
    });
    gmReplies = settled.gmReplies;
    setupClicks = settled.setupClicks;
    playedSlots = settled.playedSlots;
    if (settled.stop && !settled.ok) return stopSetup(settled.reason, settled.exitCode);
  }

  return {
    bibleId,
    ok: !skippedNewReply,
    harnessError: skippedNewReply ? 'skipped_vote_on_new_reply' : undefined,
    turns: completed,
    turnLog: turnRows,
    startTurn,
    resumed: resumeThis,
    autoFightSelector: AUTO_FIGHT_SELECTOR,
    autoFightFired,
    stoppedNoGm: false,
    stoppedRepeat: false,
    unverified,
    harnessErrors,
    softWarnings,
    thumbsSkipped,
    verifyOn: Boolean(feedbackClient),
  };
  } finally {
    bindCoverLog(null);
  }
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
  let feedbackUserId = null;
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
      feedbackUserId = session.userId || null;
    } else {
      console.log(`[ai-player] feedback verify session skipped: ${session.error}`);
    }
  }

  let browser;
  try {
    const puppeteerName = 'puppeteer-core';
    const { default: puppeteer } = await import(puppeteerName);
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
            userId: feedbackUserId,
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
  const verdict = loginCheck
    ? { ok: summary.results.every((r) => r.ok), problems: [] }
    : runVerdict(summary.results);
  summary.problems = verdict.problems;
  const printed = withSoftWarningTotal({ ok: verdict.ok, ...summary });
  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(printed, null, 2));
  console.log(JSON.stringify(printed, null, 2));
  if (summary.results.some((r) => r.blocked)) process.exit(2);
  if (!verdict.ok) {
    console.log(`AI_PLAYER fail run: ${verdict.problems.join('; ')}`);
    process.exit(1);
  }
}

function ranAsScript() {
  const argvPath = process.argv[1];
  if (!argvPath) return false;
  try {
    return import.meta.url === pathToFileURL(argvPath).href;
  } catch {
    return false;
  }
}

if (ranAsScript()) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
