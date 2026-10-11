/**
 * Process-local GM writer override for Fate autoplay / QA scripts.
 *
 * Default harness writer (curriculum / auto-improve / dual-review):
 *   OpenRouter `google/gemini-2.5-flash-lite` via OPENROUTER_API_KEY
 *
 * Mid writer stays OFF (writerPolicy). Live Free player path is unchanged.
 */

export type AutoplayWriterKind = 'default' | 'flash-lite' | 'gateway';

export type AutoplayWriterOverride = {
  kind: AutoplayWriterKind;
  /** OpenAI-compatible chat model id. */
  model: string;
  /** OpenAI-compatible base URL (…/v1). */
  baseUrl: string;
  apiKey: string;
  /** Where credentials came from (for meta / logs — never the key). */
  route: 'openrouter-paid' | 'custom';
  note: string;
};

export type AutoplayCriticConfig = {
  model: string;
  baseUrl: string;
  apiKey: string;
  route: string;
  alternateModels: string[];
  reviewer: 'flash-lite';
};

let override: AutoplayWriterOverride | null = null;

/** OpenRouter Flash Lite — Fate/curriculum repair default (same id as live Free writer). */
export const FLASH_LITE_OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite';

export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

/** Curriculum / auto-improve CLI default when `--writer` omitted. */
export const AUTOPLAY_HARNESS_DEFAULT_WRITER: AutoplayWriterKind = 'flash-lite';

/**
 * Optimal T50 feedback set: one flagship per mode (4).
 * Optional breadth add-ons: hero-awakening, system-integration (up to 6).
 */
export const CURRICULUM_FLAGSHIP_PREMADES =
  'summoned-pact,cursed-keep,salt-road-heist,thornferry-road';

function env(name: string): string {
  const fromProcess = (typeof process !== 'undefined' && process.env?.[name]?.trim()) || '';
  if (fromProcess) return fromProcess;
  try {
    const vite = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    return (vite?.[name] ?? '').trim();
  } catch {
    return '';
  }
}

function firstEnv(...names: string[]): string {
  for (const n of names) {
    const v = env(n);
    if (v) return v;
  }
  return '';
}

export function getAutoplayWriterOverride(): AutoplayWriterOverride | null {
  return override;
}

export function clearAutoplayWriterOverride(): void {
  override = null;
}

export function setAutoplayWriterOverride(next: AutoplayWriterOverride | null): void {
  override = next;
}

/** True when Fate uses client-direct GM (not edge gm-turn). */
export function isClientAutoplayWriter(kind?: AutoplayWriterKind | null): boolean {
  return kind === 'flash-lite' || kind === 'gateway';
}

/**
 * Parse CLI `--writer` tokens.
 * Aliases: openrouter / gemini / flashlite → flash-lite.
 */
export function parseAutoplayWriterKind(raw: string | undefined | null): AutoplayWriterKind {
  const w = (raw ?? '').toLowerCase().trim();
  if (!w || w === 'flash-lite' || w === 'flashlite' || w === 'openrouter' || w === 'gemini' || w === 'gemini-flash-lite') {
    return 'flash-lite';
  }
  if (w === 'default' || w === 'hosted' || w === 'edge') return 'default';
  if (w === 'gateway' || w === 'ai-gateway') return 'gateway';
  return 'flash-lite';
}

/** OpenRouter key names used by the game / harness (.env.example). */
export function resolveOpenRouterApiKey(): string {
  return firstEnv('OPENROUTER_API_KEY', 'VITE_OPENROUTER_API_KEY', 'AUTOPLAY_OPENROUTER_API_KEY');
}

/**
 * Resolve the OpenRouter harness writer for autoplay / dual-review / patcher.
 * `model` is any OpenRouter model id (`--writer-model`); default Flash Lite.
 * Requires OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY / AUTOPLAY_OPENROUTER_API_KEY).
 */
export function resolveFlashLiteAutoplayWriter(model?: string | null): AutoplayWriterOverride {
  const id = (model ?? '').trim() || FLASH_LITE_OPENROUTER_MODEL;
  if (!id.includes('/')) {
    throw new Error(`--writer-model needs an OpenRouter model id <provider/model>, got "${id}".`);
  }
  const openRouterKey = resolveOpenRouterApiKey();
  if (!openRouterKey) {
    throw new Error(
      'OpenRouter harness requires OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY) in .env. ' +
        `Model: ${id} via ${OPENROUTER_BASE}.`
    );
  }
  return {
    kind: 'flash-lite',
    model: id,
    baseUrl: OPENROUTER_BASE,
    apiKey: openRouterKey,
    route: 'openrouter-paid',
    note: `OpenRouter ${id} — harness writer (Mid writer OFF).`,
  };
}

export function resolveAutoplayWriter(
  kind: AutoplayWriterKind,
  model?: string | null
): AutoplayWriterOverride | null {
  if (kind === 'default') return null;
  return { ...resolveFlashLiteAutoplayWriter(model), kind };
}

export function enableAutoplayWriter(
  kind: AutoplayWriterKind,
  model?: string | null
): AutoplayWriterOverride | null {
  if (kind === 'default') {
    clearAutoplayWriterOverride();
    return null;
  }
  const next = resolveAutoplayWriter(kind, model);
  setAutoplayWriterOverride(next);
  return next;
}

/** Flash Lite critic / patcher (same model as harness writer — research-approved). */
export function resolveFlashLiteCritic(): AutoplayCriticConfig {
  const w =
    override?.route === 'openrouter-paid' && override.model === FLASH_LITE_OPENROUTER_MODEL
      ? override
      : resolveFlashLiteAutoplayWriter();
  return {
    model: w.model,
    baseUrl: w.baseUrl,
    apiKey: w.apiKey,
    route: w.route,
    alternateModels: [],
    reviewer: 'flash-lite',
  };
}

/**
 * Dual-review / patcher critic for a writer kind.
 * Always uses Flash Lite (harness default).
 */
export function resolveAutoplayCritic(kind?: AutoplayWriterKind | string | null): AutoplayCriticConfig {
  void kind;
  return resolveFlashLiteCritic();
}
