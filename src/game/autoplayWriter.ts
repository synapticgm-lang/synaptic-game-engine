/**
 * Process-local GM writer override for Fate autoplay / QA scripts.
 *
 * Default harness writer (curriculum / auto-improve / dual-review):
 *   OpenRouter `google/gemini-2.5-flash-lite` via OPENROUTER_API_KEY
 *
 * Optional $0 path (keep Gateway code):
 *   `--writer minimax` → Vercel AI Gateway free MiniMax (m3 ↔ m2.7 on 429)
 *
 * Mid writer stays OFF (writerPolicy). Live Free player path is unchanged.
 */

export type AutoplayWriterKind = 'default' | 'minimax' | 'flash-lite';

export type AutoplayWriterOverride = {
  kind: AutoplayWriterKind;
  /** OpenAI-compatible chat model id. */
  model: string;
  /** OpenAI-compatible base URL (…/v1). */
  baseUrl: string;
  apiKey: string;
  /** Where credentials came from (for meta / logs — never the key). */
  route: 'vercel-gateway-free' | 'openrouter-paid' | 'custom';
  note: string;
};

export type FreeWriterRotationEvent = {
  at: string;
  from: string;
  to: string;
  reason: string;
};

export type FreeWriterRotationState = {
  primary: string;
  secondary: string;
  active: string;
  switchCount: number;
  events: FreeWriterRotationEvent[];
};

export type AutoplayCriticConfig = {
  model: string;
  baseUrl: string;
  apiKey: string;
  route: string;
  alternateModels: string[];
  reviewer: 'flash-lite' | 'minimax';
};

let override: AutoplayWriterOverride | null = null;

/** OpenRouter Flash Lite — Fate/curriculum repair default (same id as live Free writer). */
export const FLASH_LITE_OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite';

/** Primary free Gateway writer (Vercel changelog 2026-08-25). */
export const MINIMAX_GATEWAY_FREE_MODEL = 'minimax/minimax-m3-free';
/** Secondary free Gateway writer — rotate here on 429 (same promo window). */
export const MINIMAX_GATEWAY_FREE_MODEL_ALT = 'minimax/minimax-m2.7-free';
/** Ordered free pool — never includes paid / OpenRouter ids. */
export const MINIMAX_GATEWAY_FREE_MODELS = [
  MINIMAX_GATEWAY_FREE_MODEL,
  MINIMAX_GATEWAY_FREE_MODEL_ALT,
] as const;

export const MINIMAX_OPENROUTER_MODEL = 'minimax/minimax-m3';
export const VERCEL_AI_GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1';
export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

/** Curriculum / auto-improve CLI default when `--writer` omitted. */
export const AUTOPLAY_HARNESS_DEFAULT_WRITER: AutoplayWriterKind = 'flash-lite';

/**
 * Optimal T50 feedback set: one flagship per mode (4).
 * Optional breadth add-ons: hero-awakening, system-integration (up to 6).
 */
export const CURRICULUM_FLAGSHIP_PREMADES =
  'summoned-pact,cursed-keep,salt-road-heist,thornferry-road';

let rotationEvents: FreeWriterRotationEvent[] = [];

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

function gatewayNote(model: string): string {
  return (
    `Vercel AI Gateway MiniMax free (${model}). ` +
    `Rotate pair: ${MINIMAX_GATEWAY_FREE_MODEL} ↔ ${MINIMAX_GATEWAY_FREE_MODEL_ALT}. ` +
    `Promo ends ~2026-09-06. $0.`
  );
}

export function getAutoplayWriterOverride(): AutoplayWriterOverride | null {
  return override;
}

export function clearAutoplayWriterOverride(): void {
  override = null;
  rotationEvents = [];
}

export function setAutoplayWriterOverride(next: AutoplayWriterOverride | null): void {
  override = next;
}

export function getFreeWriterRotationState(): FreeWriterRotationState {
  const active = override?.model ?? MINIMAX_GATEWAY_FREE_MODEL;
  return {
    primary: MINIMAX_GATEWAY_FREE_MODEL,
    secondary: MINIMAX_GATEWAY_FREE_MODEL_ALT,
    active,
    switchCount: rotationEvents.length,
    events: [...rotationEvents],
  };
}

/**
 * Flip active free Gateway model (m3-free ↔ m2.7-free). No-op if override is not Gateway free.
 * Returns the new model id, or null if rotation did not apply.
 */
export function rotateFreeGatewayWriterOnRateLimit(reason = '429'): string | null {
  if (!override || override.route !== 'vercel-gateway-free') return null;
  const from = override.model;
  const to =
    from === MINIMAX_GATEWAY_FREE_MODEL
      ? MINIMAX_GATEWAY_FREE_MODEL_ALT
      : MINIMAX_GATEWAY_FREE_MODEL;
  if (from === to) return null;
  override = {
    ...override,
    model: to,
    note: gatewayNote(to),
  };
  const ev: FreeWriterRotationEvent = {
    at: new Date().toISOString(),
    from,
    to,
    reason,
  };
  rotationEvents.push(ev);
  // eslint-disable-next-line no-console
  console.warn(`[autoplay-writer] 429 rotate ${from} → ${to} (${reason})`);
  return to;
}

/** Other free model id for critic / chatCompletion alternate list. */
export function otherFreeGatewayModel(current: string): string {
  return current === MINIMAX_GATEWAY_FREE_MODEL
    ? MINIMAX_GATEWAY_FREE_MODEL_ALT
    : MINIMAX_GATEWAY_FREE_MODEL;
}

/** True when Fate uses client-direct GM (not edge gm-turn). */
export function isClientAutoplayWriter(kind?: AutoplayWriterKind | null): boolean {
  return kind === 'minimax' || kind === 'flash-lite';
}

/**
 * Parse CLI `--writer` tokens.
 * Aliases: openrouter / gemini / flashlite → flash-lite; minimax-m3 → minimax.
 */
export function parseAutoplayWriterKind(raw: string | undefined | null): AutoplayWriterKind {
  const w = (raw ?? '').toLowerCase().trim();
  if (!w || w === 'flash-lite' || w === 'flashlite' || w === 'openrouter' || w === 'gemini' || w === 'gemini-flash-lite') {
    return 'flash-lite';
  }
  if (w === 'minimax' || w === 'minimax-m3') return 'minimax';
  if (w === 'default' || w === 'hosted' || w === 'edge') return 'default';
  return 'flash-lite';
}

/** OpenRouter key names used by the game / harness (.env.example). */
export function resolveOpenRouterApiKey(): string {
  return firstEnv('OPENROUTER_API_KEY', 'VITE_OPENROUTER_API_KEY', 'AUTOPLAY_OPENROUTER_API_KEY');
}

/**
 * Resolve Flash Lite for autoplay / dual-review / patcher.
 * Requires OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY / AUTOPLAY_OPENROUTER_API_KEY).
 */
export function resolveFlashLiteAutoplayWriter(): AutoplayWriterOverride {
  const openRouterKey = resolveOpenRouterApiKey();
  if (!openRouterKey) {
    throw new Error(
      'Flash Lite harness requires OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY) in .env. ' +
        `Model: ${FLASH_LITE_OPENROUTER_MODEL} via ${OPENROUTER_BASE}. ` +
        'Optional $0 path: --writer minimax with AI_GATEWAY_API_KEY.'
    );
  }
  return {
    kind: 'flash-lite',
    model: FLASH_LITE_OPENROUTER_MODEL,
    baseUrl: OPENROUTER_BASE,
    apiKey: openRouterKey,
    route: 'openrouter-paid',
    note:
      `OpenRouter ${FLASH_LITE_OPENROUTER_MODEL} — Fate/curriculum repair default ` +
      '(~$0.10/$0.40 per MTok; Mid writer OFF).',
  };
}

/**
 * Resolve MiniMax for autoplay.
 * Default: **Vercel free only** (`minimax/minimax-m3-free` via AI_GATEWAY_API_KEY).
 * OpenRouter is opt-in via `allowPaidOpenRouter: true`.
 */
export function resolveMinimaxAutoplayWriter(opts?: {
  allowPaidOpenRouter?: boolean;
  /** Prefer secondary free id (m2.7) as starting writer. */
  preferAlt?: boolean;
}): AutoplayWriterOverride {
  const gatewayKey = firstEnv('AI_GATEWAY_API_KEY', 'VERCEL_AI_GATEWAY_API_KEY');

  if (gatewayKey) {
    const model = opts?.preferAlt
      ? MINIMAX_GATEWAY_FREE_MODEL_ALT
      : MINIMAX_GATEWAY_FREE_MODEL;
    return {
      kind: 'minimax',
      model,
      baseUrl: VERCEL_AI_GATEWAY_BASE,
      apiKey: gatewayKey,
      route: 'vercel-gateway-free',
      note: gatewayNote(model),
    };
  }

  if (opts?.allowPaidOpenRouter) {
    const openRouterKey = resolveOpenRouterApiKey();
    if (openRouterKey) {
      return {
        kind: 'minimax',
        model: MINIMAX_OPENROUTER_MODEL,
        baseUrl: OPENROUTER_BASE,
        apiKey: openRouterKey,
        route: 'openrouter-paid',
        note: 'PAID OpenRouter minimax/minimax-m3 — explicit allowPaidOpenRouter only.',
      };
    }
  }

  throw new Error(
    'Free MiniMax requires AI_GATEWAY_API_KEY (or VERCEL_AI_GATEWAY_API_KEY) in .env. ' +
      'OpenRouter fallback is disabled so this path stays $0. ' +
      'Get a key at vercel.com → AI Gateway. Free model ids: ' +
      `${MINIMAX_GATEWAY_FREE_MODEL} / ${MINIMAX_GATEWAY_FREE_MODEL_ALT} (until ~2026-09-06). ` +
      `Or use --writer flash-lite with OPENROUTER_API_KEY (${FLASH_LITE_OPENROUTER_MODEL}).`
  );
}

export function resolveAutoplayWriter(kind: AutoplayWriterKind): AutoplayWriterOverride | null {
  if (kind === 'default') return null;
  if (kind === 'minimax') return resolveMinimaxAutoplayWriter();
  return resolveFlashLiteAutoplayWriter();
}

export function enableAutoplayWriter(kind: AutoplayWriterKind): AutoplayWriterOverride | null {
  if (kind === 'default') {
    clearAutoplayWriterOverride();
    return null;
  }
  rotationEvents = [];
  const next = resolveAutoplayWriter(kind);
  setAutoplayWriterOverride(next);
  return next;
}

/**
 * MiniMax-only auto critic (free Gateway).
 * Gemini Pro is **not** called here — John pastes packs manually in the morning.
 * Uses the currently active free writer (may already be rotated).
 */
export function resolveMinimaxFreeCritic(): AutoplayCriticConfig {
  const w = override?.route === 'vercel-gateway-free' ? override : resolveMinimaxAutoplayWriter();
  return {
    model: w.model,
    baseUrl: w.baseUrl,
    apiKey: w.apiKey,
    route: w.route,
    alternateModels: [otherFreeGatewayModel(w.model)],
    reviewer: 'minimax',
  };
}

/** Flash Lite critic / patcher (same model as harness writer — research-approved). */
export function resolveFlashLiteCritic(): AutoplayCriticConfig {
  const w =
    override?.kind === 'flash-lite' ||
    (override?.route === 'openrouter-paid' && override.model === FLASH_LITE_OPENROUTER_MODEL)
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
 * Defaults to Flash Lite (harness default). MiniMax when `--writer minimax`.
 */
export function resolveAutoplayCritic(kind?: AutoplayWriterKind | string | null): AutoplayCriticConfig {
  const resolved =
    typeof kind === 'string' && (kind === 'default' || kind === 'minimax' || kind === 'flash-lite')
      ? kind
      : parseAutoplayWriterKind(kind == null ? 'flash-lite' : String(kind));
  if (resolved === 'minimax') return resolveMinimaxFreeCritic();
  return resolveFlashLiteCritic();
}

/** @deprecated Use resolveAutoplayCritic / resolveMinimaxFreeCritic. */
export function resolveDualReviewCritics(): {
  minimax: AutoplayCriticConfig;
} {
  return { minimax: resolveMinimaxFreeCritic() };
}
