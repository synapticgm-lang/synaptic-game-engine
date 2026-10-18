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

/** Run verdict: every bible ok, no harness errors, and (verify on) every thumb read back. */
export function runVerdict(results = []) {
  const list = Array.isArray(results) ? results : [];
  const problems = [];
  if (!list.length) problems.push('no_results');
  for (const r of list) {
    if (r.blocked) problems.push(`${r.bibleId}:blocked`);
    else if (!r.ok) problems.push(`${r.bibleId}:not_ok${r.error ? `(${r.error})` : ''}`);
    if (r.harnessErrors) problems.push(`${r.bibleId}:harness_errors=${r.harnessErrors}`);
    if (r.unverified) problems.push(`${r.bibleId}:unverified=${r.unverified}`);
  }
  return { ok: problems.length === 0, problems };
}
