/**
 * G-AIP fix (John 18:58): thumbs read-back by user_id + save_id + log_entry_id
 * and the run verdict that drives the harness exit code.
 */
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
 * Vote at most once per GM reply. feedbacks = thumbs blocks on screen now (one per GM reply);
 * votedFeedbacks = the count when we last voted. No new reply since the last vote = no vote
 * (clicking the same thumb again toggles the vote off).
 */
export function shouldThumb({ feedbacks, votedFeedbacks = -1, noNewReply = false } = {}) {
  if (noNewReply) return { vote: false, reason: 'no_reply' };
  const n = Number(feedbacks);
  if (Number.isFinite(n) && n <= Number(votedFeedbacks)) return { vote: false, reason: 'already_voted' };
  return { vote: true, reason: null };
}

/** A new GM reply whose thumb was skipped, and not carried from the press on that reply. */
export function skippedVoteOnNewReply(row) {
  if (!row || row.newGmBubble !== true) return false;
  if (row.voteCarried === true) return false;
  const skipped = row.thumbSkipped;
  // The vote in a row is on the PREVIOUS reply; 'no_reply' means that turn produced none, so the skip is correct (23:54 smoke misread).
  return skipped != null && skipped !== false && skipped !== '' && skipped !== 'no_reply';
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
