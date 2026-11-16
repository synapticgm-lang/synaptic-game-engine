/**
 * Training rights by SERVING HOST — one table, computed server-side for every captured row.
 *
 * Source: notes/synapticgm-ai-training-reference.md (terms researched 8 Nov 2026) and John's 16 Nov 2026
 * routing decision. This is a working assessment, not a legal guarantee; re-check terms before changing.
 *  - allowed     DeepSeek's own service — terms 4.2 permit training other models (distillation included).
 *  - conditional Wafer — user keeps completion ownership; outputs may not build a competing inference /
 *                hosting service; upstream terms apply. Fine for a specialised game writer, with conditions.
 *  - excluded    InferenceNet (ToS 2.2(c) forbids ML/AI training on service content); Z.ai API terms restrict
 *                training external models. Rows are kept for audit, never admitted.
 *  - unknown     every other host, Venice included (commercial scope unresolved = quarantined), and any row
 *                whose served host is missing. Missing metadata is never "allowed".
 * Only the researched writer model family is rated; any other served model is `unknown`.
 */

import type { TrainingRights } from './trainingCaptureVocab.ts';

export type { TrainingRights };

/** Served-host key (lower-case letters/digits only, e.g. "InferenceNet" → "inferencenet") → rights. */
export const HOST_TRAINING_RIGHTS: Readonly<Record<string, TrainingRights>> = {
  deepseek: 'allowed',
  wafer: 'conditional',
  inferencenet: 'excluded',
  zai: 'excluded',
  venice: 'unknown',
};

/** Served model ids the host assessment above was made for (OpenRouter may append a dated suffix). */
export const RATED_TRAINING_MODEL = 'deepseek/deepseek-v4.1-flash';

export function hostKey(servedProvider: string | null | undefined): string {
  return String(servedProvider ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isRatedModel(servedModel: string | null | undefined): boolean {
  const m = String(servedModel ?? '').trim().toLowerCase();
  return m === RATED_TRAINING_MODEL || m.startsWith(`${RATED_TRAINING_MODEL}-`);
}

/** Rights for one served call: from the host that actually served it, never from the request. */
export function trainingRightsFor(servedProvider: string | null | undefined, servedModel: string | null | undefined): TrainingRights {
  const key = hostKey(servedProvider);
  if (!key || !isRatedModel(servedModel)) return 'unknown';
  return HOST_TRAINING_RIGHTS[key] ?? 'unknown';
}

/** True when the served host is not one of the preferred training hosts (OpenRouter fell back). */
export function isFallbackHost(servedProvider: string | null | undefined, preferred: readonly string[]): boolean {
  const key = hostKey(servedProvider);
  return !key || !preferred.some((slug) => hostKey(slug) === key);
}
