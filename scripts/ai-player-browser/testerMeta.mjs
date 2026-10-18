/**
 * Tags every AI-tester turn / feedback row for exclusion and dataset filters.
 */
import { randomUUID } from 'crypto';
import { playerLicenceForModel } from './playerLicence.mjs';

export const AI_TESTER_INPUT_AUTHOR = 'ai-player';

/** Save ids for AI-tester runs always start with this prefix. */
export function makeAiTestSaveId(seed) {
  const tail = String(seed || randomUUID()).replace(/^aitest-/i, '');
  return `aitest-${tail}`;
}

export function isAiTestSaveId(saveId) {
  return /^aitest-/i.test(String(saveId || '').trim());
}

/**
 * Meta stamped on turns.jsonl rows and feedback verification payloads.
 * @param {{ model: string, licence?: string }} opts
 */
export function buildTesterMeta(opts = {}) {
  const model = String(opts.model || '').trim();
  const licence = opts.licence || playerLicenceForModel(model);
  return {
    source: `ai-tester:${model}`,
    input_author: AI_TESTER_INPUT_AUTHOR,
    player_model: model,
    player_licence: licence,
  };
}
