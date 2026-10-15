/**
 * The one place model ids are pinned, plus the licence of every model whose output can become a training row.
 * Every chat call that is not handed an explicit model reads its default from here, so no call can go out on an
 * unpinned id (OpenRouter `deepseek/deepseek-chat` is the Dec-2024 DeepSeek V3 under the restricted Model Agreement).
 * Erasable TypeScript only: Node scripts (writerDataset.mjs, autoThumbs.mjs) import this file directly.
 */

/** DeepSeek V4.1 Flash on Fireworks (MIT). The live Free hosted writer. */
export const FIREWORKS_DEEPSEEK_V41_FLASH = 'accounts/fireworks/models/deepseek-v4p1-flash';
/** DeepSeek V4.1 Flash on OpenRouter (MIT, hf deepseek-ai/DeepSeek-V4.1-Flash). */
export const OPENROUTER_DEEPSEEK_V41_FLASH = 'deepseek/deepseek-v4.1-flash';
/** Qwen3-235B-A22B-Instruct-2507 on OpenRouter (Apache-2.0). */
export const OPENROUTER_QWEN3_235B = 'qwen/qwen3-235b-a22b-2507';
/** GLM-5.3-Flash on OpenRouter (MIT, hf zai-org/GLM-5.3-Flash). */
export const OPENROUTER_GLM_53_FLASH = 'z-ai/glm-5.3-flash';

/** Default for an OpenAI-compatible call to OpenRouter / Fireworks with no model given. */
export const PINNED_DEFAULT_MODEL = {
  openrouter: OPENROUTER_DEEPSEEK_V41_FLASH,
  fireworks: FIREWORKS_DEEPSEEK_V41_FLASH,
} as const;

/** The model a call will use: the explicit one, else the pinned default for that provider. */
export function pinnedModel(provider: 'openrouter' | 'fireworks', model?: string | null): string {
  const m = (model ?? '').trim();
  return m || PINNED_DEFAULT_MODEL[provider];
}

/** Build-time lap seats: open-licence writers only (John, 15 Oct). `--seat <key>` in fate-autoplay. */
export const TRAINING_SEATS = {
  deepseek: OPENROUTER_DEEPSEEK_V41_FLASH,
  qwen: OPENROUTER_QWEN3_235B,
  glm: OPENROUTER_GLM_53_FLASH,
} as const;
export type TrainingSeat = keyof typeof TRAINING_SEATS;

/** Judge for training-data filtering (autoThumbs --notes). SGM_THUMBS_MODEL still overrides for a one-off. */
export const TRAINING_JUDGE_MODEL = OPENROUTER_QWEN3_235B;

export type TrainingOk = boolean | 'pending';

/** Licence by model family; the first match wins. `trainable` is whether its output may become training data. */
const LICENCES: ReadonlyArray<{ re: RegExp; licence: string; trainable: boolean }> = [
  { re: /deepseek-chat$|deepseek-v3$/i, licence: 'DeepSeek Model Agreement (V3, Dec 2024)', trainable: false },
  { re: /deepseek/i, licence: 'MIT', trainable: true },
  { re: /qwen/i, licence: 'Apache-2.0', trainable: true },
  { re: /glm-5\.3-flash|glm-4\.\d-flash|glm-4\.[5-7]\b/i, licence: 'MIT', trainable: true },
  { re: /mimo/i, licence: 'MIT', trainable: true },
  { re: /gpt-oss/i, licence: 'Apache-2.0', trainable: true },
  { re: /gemini|google\//i, licence: 'Gemini API terms', trainable: false },
  { re: /claude|anthropic/i, licence: 'Anthropic terms', trainable: false },
  { re: /gpt|openai\//i, licence: 'OpenAI terms', trainable: false },
  { re: /llama/i, licence: 'Llama licence', trainable: false },
];

export function modelLicence(modelId: string | null | undefined): { licence: string; trainable: boolean } {
  const id = (modelId ?? '').trim();
  const hit = id ? LICENCES.find((l) => l.re.test(id)) : undefined;
  return hit ? { licence: hit.licence, trainable: hit.trainable } : { licence: 'unknown', trainable: false };
}

/** Provider from the id shape: Fireworks ids are `accounts/fireworks/...`; vendor/model ids are OpenRouter. */
export function modelProvider(modelId: string | null | undefined): string | null {
  const id = (modelId ?? '').trim();
  if (!id) return null;
  if (/^accounts\/fireworks\/|^fireworks\//i.test(id)) return 'fireworks';
  if (/^stub\//i.test(id)) return 'none';
  if (id.includes('/')) return 'openrouter';
  if (/^gemini/i.test(id)) return 'google';
  if (/^claude/i.test(id)) return 'anthropic';
  return null;
}

/** Sources that never enter a dataset build, mix or export, with the reason. */
export const EXCLUDED_SOURCES: Readonly<Record<string, string>> = {
  community_mega: 'copyrighted novel chapters',
  'her-dataset': 'copyrighted novel chapters',
};

export function excludedSourceReason(sourceId: string | null | undefined): string | null {
  return EXCLUDED_SOURCES[(sourceId ?? '').trim().toLowerCase()] ?? null;
}

export type RowProvenance = {
  training_ok: TrainingOk;
  teacher_model: string | null;
  provider: string | null;
  judge_model: string | null;
  mode: string | null;
  training_note?: string;
};

/** Labels old rows used for the hosted Free writer when no model id came back. */
const HOSTED_FREE_LABEL = /^(?:default|\(hosted free via gm-turn\))$/i;

/** Why an old DeepSeek row waits: which slug served it is not proven yet. */
export const PENDING_DEEPSEEK_NOTE =
  'pre-15-Oct DeepSeek: served slug unconfirmed (check the OpenRouter activity export or edge logs)';

/**
 * Backfill for rows saved before provenance was written at the source (John, 15 Oct):
 * a recorded Fireworks id keeps it and is trainable; any other DeepSeek / hosted-Free row is OpenRouter DeepSeek
 * with training_ok "pending"; Claude / GPT / Gemini are false; an excluded source is false with its reason.
 */
export function legacyRowProvenance(input: {
  recordedModel: string | null | undefined;
  hostedFree?: boolean;
  judgeModel?: string | null;
  mode?: string | null;
  sourceId?: string | null;
}): RowProvenance {
  const raw = (input.recordedModel ?? '').trim();
  const label = HOSTED_FREE_LABEL.test(raw);
  const id = label ? '' : raw;
  const hosted = label || (!id && !!input.hostedFree);
  const base = { judge_model: input.judgeModel ?? null, mode: input.mode ?? null };
  if (excludedSourceReason(input.sourceId) || (id && modelProvider(id) === 'fireworks')) {
    return rowProvenance({ teacherModel: id, ...input });
  }
  if (hosted || /deepseek/i.test(id)) {
    return { training_ok: 'pending', teacher_model: id || null, provider: 'openrouter', ...base, training_note: PENDING_DEEPSEEK_NOTE };
  }
  return rowProvenance({ teacherModel: id, judgeModel: input.judgeModel, mode: input.mode });
}

/**
 * The provenance fields every saved writer row carries. `teacherModel` is the id the provider returned.
 * A teacher with no recorded id cannot be proven, so it is not trainable.
 */
export function rowProvenance(input: {
  teacherModel: string | null | undefined;
  provider?: string | null;
  judgeModel?: string | null;
  mode?: string | null;
  sourceId?: string | null;
}): RowProvenance {
  const teacher = (input.teacherModel ?? '').trim() || null;
  const excluded = excludedSourceReason(input.sourceId);
  const { trainable } = modelLicence(teacher);
  return {
    training_ok: excluded ? false : trainable,
    teacher_model: teacher,
    provider: input.provider ?? modelProvider(teacher),
    judge_model: input.judgeModel ?? null,
    mode: input.mode ?? null,
    ...(excluded ? { training_note: excluded } : {}),
  };
}
