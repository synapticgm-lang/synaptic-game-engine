/**
 * Process-local GM writer override for Fate autoplay / QA scripts.
 * Default: OpenRouter Flash Lite via OPENROUTER_API_KEY. Mid writer OFF.
 */

/** CLI token; flash-lite|openrouter → OpenRouter path. Resolved meta.writer.kind is always `openrouter`. */
export type AutoplayWriterKind = 'default' | 'flash-lite' | 'openrouter' | 'gateway';

export type AutoplayWriterOverride = {
  kind: AutoplayWriterKind;
  model: string;
  baseUrl: string;
  apiKey: string;
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

export const FLASH_LITE_OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite';
export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
export const AUTOPLAY_HARNESS_DEFAULT_WRITER: AutoplayWriterKind = 'flash-lite';
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

export function isClientAutoplayWriter(kind?: AutoplayWriterKind | null): boolean {
  return kind === 'flash-lite' || kind === 'openrouter' || kind === 'gateway';
}

export function parseAutoplayWriterKind(raw: string | undefined | null): AutoplayWriterKind {
  const w = (raw ?? '').toLowerCase().trim();
  if (!w || w === 'flash-lite' || w === 'flashlite' || w === 'openrouter' || w === 'gemini' || w === 'gemini-flash-lite') {
    return 'flash-lite';
  }
  if (w === 'default' || w === 'hosted' || w === 'edge') return 'default';
  if (w === 'gateway' || w === 'ai-gateway') return 'gateway';
  return 'flash-lite';
}

/** Seat identity = resolved model id; kind names the route (fallback kind only for `default`). */
export function datasetWriterId(meta: {
  writer?: { kind?: string | null; model?: string | null } | null;
}): string {
  const w = meta.writer;
  if (!w || w.kind === 'default') return 'default';
  const model = (w.model ?? '').trim();
  return model || (w.kind ?? 'default');
}

export function resolveOpenRouterApiKey(): string {
  return firstEnv('OPENROUTER_API_KEY', 'VITE_OPENROUTER_API_KEY', 'AUTOPLAY_OPENROUTER_API_KEY');
}

/** OpenRouter harness writer. kind is always the route `openrouter`; seat identity is `model`. */
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
    kind: 'openrouter',
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
  const resolved = resolveFlashLiteAutoplayWriter(model);
  if (kind === 'gateway') return { ...resolved, kind: 'gateway' };
  return resolved;
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

/** Dual-review / patcher critic — always Flash Lite (harness default). */
export function resolveAutoplayCritic(kind?: AutoplayWriterKind | string | null): AutoplayCriticConfig {
  void kind;
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
