/**
 * G-AIP fix (John 18:58): thumbs read-back by user_id + save_id + log_entry_id
 * and the run verdict that drives the harness exit code.
 */
import { createHash } from 'node:crypto';
import { feedbackKeyFromUpsert, verifyFeedbackByKey } from './feedbackVerify.mjs';

/** Read back the row the UI just upserted, by user_id + save_id + log_entry_id; always returns a reason. */
export async function verifyThumb(feedbackClient, thumb, userId) {
  if (!feedbackClient) return { verified: false, reason: 'no_client', lookup: null };
  const key = feedbackKeyFromUpsert(thumb?.upsert);
  if (!key) return { verified: false, reason: thumb?.upsertError || 'no_feedback_key', lookup: null };
  if (userId && key.userId !== userId) {
    return { verified: false, reason: 'user_mismatch', lookup: key };
  }
  const feedbackType = thumb?.thumb === 'down' ? 'negative' : 'positive';
  return verifyFeedbackByKey(feedbackClient, { ...key, userId: userId || key.userId, feedbackType });
}

/**
 * 00:40 decision: votes are tied to the IDENTITY of the GM reply they rate, not to turn types.
 * replyKey = ordinal of the GM reply on the page + hash of its text. Null when no GM reply is on the page.
 */
export function replyKey(snap) {
  const text = String(snap?.lastGm || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return `${Number(snap?.gmStoryCount || 0)}:${createHash('sha1').update(text).digest('hex').slice(0, 12)}`;
}

/** Vote iff the reply this vote rates is a GM reply not yet rated. Clicking a rated reply again would toggle it off. */
export function shouldThumb({ targetKey = null, ratedKeys = new Set() } = {}) {
  if (!targetKey) return { vote: false, reason: 'no_reply' };
  if (ratedKeys.has(targetKey)) return { vote: false, reason: 'already_voted' };
  return { vote: true, reason: null };
}

/** The one rule: a skip is wrong only when the reply it was meant to rate is a GM reply that has not been rated. */
export function voteSkipWrong({ skipped, targetKey = null, ratedKeys = new Set() } = {}) {
  if (!skipped) return false;
  if (!targetKey) return false;
  return !ratedKeys.has(targetKey);
}

/** Row form of the same rule (the row carries voteSkipWrong, computed when the turn was played). */
export function skippedVoteOnNewReply(row) {
  return Boolean(row && row.voteSkipWrong === true);
}
/** Run verdict: every bible ok, no harness errors, and (verify on) every thumb read back. softWarnings never fail the run. A skipped vote on a new reply, and game_reset, always fail. */
export function runVerdict(results = []) {
  const list = Array.isArray(results) ? results : [];
  const problems = [];
  if (!list.length) problems.push('no_results');
  for (const r of list) {
    const turnRow = r?.newGmBubble != null || r?.event === 'turn' || r?.event === 'turn_timeout' || r?.event === 'game_reset';
    if (!turnRow) {
      if (r.blocked) problems.push(`${r.bibleId}:blocked`);
      else if (!r.ok) problems.push(`${r.bibleId}:not_ok${r.error ? `(${r.error})` : ''}`);
      if (r.harnessErrors) problems.push(`${r.bibleId}:harness_errors=${r.harnessErrors}`);
      if (r.unverified) problems.push(`${r.bibleId}:unverified=${r.unverified}`);
    }
    if (r?.harnessError === 'game_reset' || r?.error === 'game_reset' || r?.event === 'game_reset') {
      problems.push('game_reset');
    }
    if (r?.harnessError === 'skipped_vote_on_new_reply') problems.push('skipped_vote_on_new_reply');
    const rows = turnRow ? [r] : (Array.isArray(r?.turnLog) ? r.turnLog : (Array.isArray(r?.turns) ? r.turns : []));
    for (const row of rows) {
      if (row?.event === 'game_reset' || row?.harnessError === 'game_reset') problems.push('game_reset');
      if (skippedVoteOnNewReply(row)) problems.push('skipped_vote_on_new_reply');
    }
  }
  return { ok: problems.length === 0, problems };
}
