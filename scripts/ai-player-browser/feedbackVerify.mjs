/**
 * After submitThumb in the real UI, read gm_response_feedback back with the
 * tester account session (anon key + email/password). Never use the service
 * role at runtime.
 */
import { createClient } from '@supabase/supabase-js';

/**
 * Reason text passed into submitThumb as the comment.
 * Keeps a one-line player reason (falls back to note / hard-floor comment).
 */
export function thumbReasonFromDecision(decision = {}) {
  const reason = String(
    decision.reason
    || decision.thumb_reason
    || decision.comment
    || decision.note
    || '',
  ).replace(/\s+/g, ' ').trim();
  return reason.slice(0, 500);
}

/**
 * Args for gameTab.submitThumb — reason is always the comment.
 * @param {{ thumb?: string, reason?: string, comment?: string, note?: string }} decision
 */
export function submitThumbArgs(decision = {}) {
  const thumb = decision.thumb === 'down' || decision.thumb === 'negative'
    ? 'down'
    : 'up';
  return {
    thumb,
    comment: thumbReasonFromDecision(decision),
  };
}

/**
 * Press the thumb in the real UI with the player's reason as the comment.
 * @param {unknown} page
 * @param {object} decision
 * @param {(page: unknown, opts: { thumb: string, comment: string }) => Promise<{ ok: boolean }>} submitThumbFn
 */
export async function pressThumbWithReason(page, decision, submitThumbFn) {
  if (typeof submitThumbFn !== 'function') {
    throw new Error('pressThumbWithReason requires submitThumbFn');
  }
  const args = submitThumbArgs(decision);
  const result = await submitThumbFn(page, args);
  return { ...result, ...args, reason: args.comment };
}

/**
 * @param {{ url: string, anonKey: string, email: string, password: string, createClientFn?: typeof createClient }} opts
 */
export async function createTesterSessionClient(opts) {
  const url = String(opts.url || '').replace(/\/$/, '');
  const anonKey = String(opts.anonKey || '').trim();
  const email = String(opts.email || '').trim();
  const password = String(opts.password || '');
  const make = opts.createClientFn || createClient;
  if (!url || !anonKey) {
    return { ok: false, error: 'missing_anon_config', client: null };
  }
  if (!email || !password) {
    return { ok: false, error: 'missing_tester_login', client: null };
  }
  const client = make(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    return {
      ok: false,
      error: error?.message || 'sign_in_failed',
      client: null,
    };
  }
  return { ok: true, client, userId: data.user?.id || null };
}

/**
 * Verify a feedback row exists for this save + turn (tester's own RLS row).
 * @param {*} client Supabase client (or test double with from().select().eq()…)
 * @param {{ saveId: string, turn: number, feedbackType?: 'positive'|'negative' }} query
 */
/** The UI's own upsert response (PostgREST body) -> the exact key of that reply's feedback row. */
export function feedbackKeyFromUpsert(body) {
  const row = Array.isArray(body) ? body[0] : body;
  if (!row || typeof row !== 'object') return null;
  const userId = String(row.user_id || '').trim();
  const saveId = String(row.save_id || '').trim();
  const logEntryId = String(row.log_entry_id || '').trim();
  if (!userId || !saveId || !logEntryId) return null;
  return { userId, saveId, logEntryId, id: row.id || null, feedbackType: row.feedback_type || null };
}

/**
 * Read back ONE reply's row by user_id + save_id + log_entry_id (addendum 15:55).
 * Every miss carries a reason and the key that was looked up.
 */
export async function verifyFeedbackByKey(client, key = {}) {
  const userId = String(key.userId || '').trim();
  const saveId = String(key.saveId || '').trim();
  const logEntryId = String(key.logEntryId || '').trim();
  const lookup = { userId, saveId, logEntryId };
  if (!client || typeof client.from !== 'function') {
    return { verified: false, reason: 'no_client', lookup };
  }
  if (!userId || !saveId || !logEntryId) {
    return { verified: false, reason: key.missingReason || 'no_feedback_key', lookup };
  }
  let q = client
    .from('gm_response_feedback')
    .select('id, user_id, save_id, log_entry_id, turn_number, feedback_type, comment')
    .eq('user_id', userId)
    .eq('save_id', saveId)
    .eq('log_entry_id', logEntryId)
    .limit(1);
  let data;
  let error;
  if (typeof q.maybeSingle === 'function') {
    ({ data, error } = await q.maybeSingle());
  } else {
    ({ data, error } = await q);
  }
  if (error) {
    return { verified: false, reason: `query_error: ${error.message || 'unknown'}`, lookup };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    return { verified: false, reason: 'not_found', lookup };
  }
  if (key.feedbackType && row.feedback_type !== key.feedbackType) {
    return { verified: false, reason: `type_mismatch: wanted ${key.feedbackType} got ${row.feedback_type}`, lookup, row };
  }
  return { verified: true, reason: 'ok', lookup, row };
}

/** Legacy save+turn lookup (kept for old callers; the harness uses verifyFeedbackByKey). */
export async function verifyFeedbackRow(client, query = {}) {
  const saveId = String(query.saveId || '').trim();
  const turn = Number(query.turn);
  if (!client) {
    return { verified: false, reason: 'no_client' };
  }
  if (!saveId || !Number.isFinite(turn)) {
    return { verified: false, reason: 'bad_query' };
  }
  if (typeof client.from !== 'function') {
    return { verified: false, reason: 'no_client' };
  }

  let q = client
    .from('gm_response_feedback')
    .select('id, save_id, turn_number, feedback_type, comment')
    .eq('save_id', saveId)
    .eq('turn_number', turn)
    .limit(1);
  if (query.feedbackType) {
    q = q.eq('feedback_type', query.feedbackType);
  }

  let data;
  let error;
  if (typeof q.maybeSingle === 'function') {
    ({ data, error } = await q.maybeSingle());
  } else {
    ({ data, error } = await q);
  }
  if (error) {
    return { verified: false, reason: error.message || 'query_error', error };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    return { verified: false, reason: 'not_found' };
  }
  return {
    verified: true,
    row: {
      id: row.id,
      save_id: row.save_id,
      turn_number: row.turn_number,
      feedback_type: row.feedback_type,
      comment: row.comment,
    },
  };
}
