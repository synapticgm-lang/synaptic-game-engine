/**
 * Process-local GM writer override for Fate autoplay / QA scripts.
 * Default: **free Vercel AI Gateway MiniMax only** (no OpenRouter spend).
 *
 * Dual free rotation (promo through ~2026-09-06):
 *   Primary:   minimax/minimax-m3-free
 *   Secondary: minimax/minimax-m2.7-free
 * On Gateway 429 / rate_limit, switch to the other free id before failing the cell.
 */

export type AutoplayWriterKind = 'default' | 'minimax';

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

let override: AutoplayWriterOverride | null = null;

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

/**
 * Resolve MiniMax for autoplay.
 * Default: **Vercel free only** (`minimax/minimax-m3-free` via AI_GATEWAY_API_KEY).
 * OpenRouter is opt-in via `allowPaidOpenRouter: true` — never used by curriculum by default.
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
    const openRouterKey = firstEnv(
      'OPENROUTER_API_KEY',
      'VITE_OPENROUTER_API_KEY',
      'AUTOPLAY_OPENROUTER_API_KEY'
    );
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
      'OpenRouter fallback is disabled so this harness stays $0. ' +
      'Get a key at vercel.com → AI Gateway. Free model ids: ' +
      `${MINIMAX_GATEWAY_FREE_MODEL} / ${MINIMAX_GATEWAY_FREE_MODEL_ALT} (until ~2026-09-06).`
  );
}

export function enableAutoplayWriter(kind: AutoplayWriterKind): AutoplayWriterOverride | null {
  if (kind === 'default') {
    clearAutoplayWriterOverride();
    return null;
  }
  rotationEvents = [];
  const next = resolveMinimaxAutoplayWriter();
  setAutoplayWriterOverride(next);
  return next;
}

/**
 * MiniMax-only auto critic (free Gateway).
 * Gemini Pro is **not** called here — John pastes packs manually in the morning.
 * Uses the currently active free writer (may already be rotated).
 */
export function resolveMinimaxFreeCritic(): {
  model: string;
  baseUrl: string;
  apiKey: string;
  route: string;
  alternateModels: string[];
} {
  const w = override?.route === 'vercel-gateway-free' ? override : resolveMinimaxAutoplayWriter();
  return {
    model: w.model,
    baseUrl: w.baseUrl,
    apiKey: w.apiKey,
    route: w.route,
    alternateModels: [otherFreeGatewayModel(w.model)],
  };
}

/** @deprecated Use resolveMinimaxFreeCritic — Gemini is manual paste, not OpenRouter. */
export function resolveDualReviewCritics(): {
  minimax: { model: string; baseUrl: string; apiKey: string; route: string };
} {
  return { minimax: resolveMinimaxFreeCritic() };
}
