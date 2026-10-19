/**
 * Local setup steps (tabletop inn-book creation) never call the GM.
 * The page already shows the builder button; a step answers with a system
 * row or a new chip pad. Smoke keeps going until two real GM replies.
 */

export const SETUP_CLICK_CAP = 12;
export const SMOKE_GM_REPLIES = 2;

/** DOM signal readGameSnapshot already collected. */
export function isSetupStep(snap) {
  return Boolean(snap && snap.setupSignal);
}

/** Model's chip if it is one of the offered chips; otherwise the first chip. Never a typed line. */
export function planSetupAction({ action, chips } = {}) {
  const offered = (chips || []).map((c) => String(c || '').trim()).filter(Boolean);
  const named = String(action || '').trim();
  const hit = offered.find((c) => c === named);
  return { kind: 'chip', action: hit || offered[0] || '', typed: false };
}

/** A setup answer: new system row, chip pad changed, or the builder button left. */
export function setupAdvanced(prev, next) {
  if (!prev || !next) return false;
  if (Number(next.systemRowCount || 0) > Number(prev.systemRowCount || 0)) return true;
  const before = (prev.chips || []).join('\n');
  const after = (next.chips || []).join('\n');
  if (before !== after) return true;
  if (prev.setupSignal && !next.setupSignal) return true;
  return false;
}

/** Still on the builder after the click cap: stop. Smoke uses smoke_setup_stuck. */
export function setupStuck({ smoke = false, setup = false, setupClicks = 0, cap = SETUP_CLICK_CAP } = {}) {
  if (setup && setupClicks >= cap) {
    return {
      stop: true,
      ok: false,
      exitCode: 1,
      reason: smoke ? 'smoke_setup_stuck' : 'setup_stuck',
    };
  }
  return { stop: false, ok: true, exitCode: 0, reason: null };
}

/**
 * One harness turn.
 * Setup clicks do not count as GM replies and do not feed the repeat stop.
 * A smoke turn with no new GM reply fails the run.
 */
export function settleHarnessTurn({
  smoke = false,
  setupTurn = false,
  newGmReply = false,
  turn = 0,
  gmReplies = 0,
  setupClicks = 0,
  playedSlots = 0,
} = {}) {
  if (setupTurn) {
    return {
      ok: true,
      exitCode: 0,
      reason: null,
      stop: false,
      gmReplies,
      setupClicks: setupClicks + 1,
      playedSlots,
      countsAsGm: false,
      countRepeat: false,
    };
  }
  if (smoke && !newGmReply) {
    return {
      ok: false,
      exitCode: 1,
      reason: `smoke_no_gm_reply T${turn}`,
      stop: true,
      gmReplies,
      setupClicks,
      playedSlots,
      countsAsGm: false,
      countRepeat: false,
    };
  }
  const replies = newGmReply ? gmReplies + 1 : gmReplies;
  return {
    ok: true,
    exitCode: 0,
    reason: null,
    stop: smoke && replies >= SMOKE_GM_REPLIES,
    gmReplies: replies,
    setupClicks,
    playedSlots: playedSlots + 1,
    countsAsGm: Boolean(newGmReply),
    countRepeat: true,
  };
}

/** Same GM sitting under a setup step is not a repeat strike. */
export function noteRepeat(consecutive, { setupTurn = false, repeatHit = false } = {}) {
  if (setupTurn) return consecutive;
  if (repeatHit) return consecutive + 1;
  return 0;
}
