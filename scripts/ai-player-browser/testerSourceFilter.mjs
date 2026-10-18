/**
 * q51b-AIP2 — dataset source filter for AI-tester runs.
 * Admit ONLY open-licence tester runs. Restricted and non-tester rows are false.
 *
 * Wire into .tmp-dataset/dataset-topup.mjs only when John says so
 * (see docs/orders/dataset-topup-filter.md). Do not run topup from this module.
 */

import { AI_TESTER_SOURCE_PREFIX } from './testerAccounts.mjs';

/**
 * @param {{ source?: string, player_licence?: string } | null | undefined} meta
 * @returns {boolean} true only when source starts with 'ai-tester:' and player_licence is 'open'
 */
export function admitTesterRun(meta) {
  if (!meta || typeof meta !== 'object') return false;
  const source = String(meta.source ?? '').trim();
  if (!source.toLowerCase().startsWith(AI_TESTER_SOURCE_PREFIX)) return false;
  return meta.player_licence === 'open';
}
