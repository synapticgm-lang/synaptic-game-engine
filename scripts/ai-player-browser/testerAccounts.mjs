/**
 * q51b-AIP2 — one shared tester-accounts source.
 * Used by player-stats / thumbs-export exclusion and by G-ADM (import only).
 * No Node-only APIs — safe to import from browser or Vitest.
 * Browser list/CSV path: src/services/gmFeedbackService.ts mirrors TESTER_ACCOUNTS
 * (tsconfig.app.json cannot type a static scripts/*.mjs import); aipExclusion locks parity.
 */

/** Meta / turn-row source prefix stamped by the AI-player harness. */
export const AI_TESTER_SOURCE_PREFIX = 'ai-tester:';

/** Save ids for AI-tester runs always start with this prefix. */
export const AI_TESTER_SAVE_PREFIX = 'aitest-';

/**
 * Known tester accounts (email + optional user_id).
 * Add rows here only — do not scatter a second list.
 */
export const TESTER_ACCOUNTS = Object.freeze([
  {
    email: 'ai-player@synapticgm.com',
    user_id: null,
    label: 'ai-player',
  },
  {
    email: 'synapticgm@gmail.com',
    user_id: 'a0e79445-461a-4e52-9d5d-fbc03db3214a',
    label: 'founder-tester',
  },
]);

/** Lowercased emails from TESTER_ACCOUNTS. */
export function testerEmails() {
  return TESTER_ACCOUNTS.map((a) => String(a.email || '').trim().toLowerCase()).filter(Boolean);
}

/** Known user_ids from TESTER_ACCOUNTS (nulls omitted). */
export function testerUserIds() {
  return TESTER_ACCOUNTS.map((a) => a.user_id).filter((id) => typeof id === 'string' && id.length > 0);
}

export function isTesterEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  return testerEmails().includes(e);
}

export function isTesterUserId(userId) {
  const id = String(userId || '').trim();
  if (!id) return false;
  return testerUserIds().includes(id);
}

export function isTesterSource(source) {
  return String(source || '').trim().toLowerCase().startsWith(AI_TESTER_SOURCE_PREFIX);
}

export function isTesterSaveId(saveId) {
  return String(saveId || '')
    .trim()
    .toLowerCase()
    .startsWith(AI_TESTER_SAVE_PREFIX);
}

/**
 * True when a stats / feedback / training-export row belongs to a tester.
 * Keys: user_id, email, source / meta.source, save_id.
 * @param {Record<string, unknown> | null | undefined} row
 */
export function isTesterRow(row) {
  if (!row || typeof row !== 'object') return false;
  const r = /** @type {Record<string, unknown>} */ (row);
  const meta = r.meta && typeof r.meta === 'object' ? /** @type {Record<string, unknown>} */ (r.meta) : null;
  if (isTesterUserId(r.user_id ?? r.userId)) return true;
  if (isTesterEmail(r.email)) return true;
  if (isTesterSaveId(r.save_id ?? r.saveId)) return true;
  if (isTesterSource(r.source)) return true;
  if (meta && isTesterSource(meta.source)) return true;
  return false;
}

/**
 * Drop tester rows from a sample (player stats or thumbs/training export).
 * @template {Record<string, unknown>} T
 * @param {T[]} rows
 * @returns {T[]}
 */
export function excludeTesterRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => !isTesterRow(row));
}

/** Alias for player-stats aggregation samples. */
export function filterStatsSample(rows) {
  return excludeTesterRows(rows);
}

/** Alias for thumbs / gm_response_feedback training-export samples. */
export function filterTrainingExportSample(rows) {
  return excludeTesterRows(rows);
}
