import type { GameState, LoreCard, Settings } from './types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { RateLimitError, withRetry } from './aiServiceShared';
import { logger } from './logger';
import { resolveWriterModel, getTierDefinition } from './subscriptionTiers';
import { resolveHostedImageModel } from './hostedImageModel';
import { effectiveWriterTier, isTestLabEnabled } from './testLab';
import {
  BYOK_TEXT_KEY_REQUIRED,
  canConfigurePlayerAiKeys,
  isByokTierWithoutHostedKeys,
  resolveClientTextApiKey,
} from './distributionChannel';
import { forceFreeModel } from './opsKillSwitches';
import { GM_PROXY_TIMEOUT_DEFAULT_MS } from './errorRepairWarden';
import {
  hasHanScript,
  hostedWriterProvider,
  sumWriterUsage,
  type TurnWriterUsage,
  type WriterRawIssue,
} from './openRouterChat';
import { assertNoLiveAiTurnForUmbra } from './umbraOffline';

export type GmProxyMode = 'turn' | 'auto-fight';

/** Production should set VITE_REQUIRE_GM_PROXY=true so prompts never assemble in the browser. */
export function isGmProxyRequired(): boolean {
  return import.meta.env.VITE_REQUIRE_GM_PROXY === 'true';
}

/** Explicit opt-in to ship/use client-side prompt assembly (local DIY / emergency only). */
export function isClientGmAllowed(): boolean {
  return import.meta.env.VITE_ALLOW_CLIENT_GM === 'true' || import.meta.env.DEV;
}

export function isGmProxyAvailable(): boolean {
  return isSupabaseConfigured && !!import.meta.env.VITE_SUPABASE_URL;
}

function gmProxyUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '');
  return `${base}/functions/v1/gm-turn`;
}

/** Hostname for debug exports — no secrets. */
export function gmProxyHost(): string | null {
  if (!isGmProxyAvailable()) return null;
  try {
    return new URL(gmProxyUrl()).hostname;
  } catch {
    return null;
  }
}

export function hostedBackendDiagnostics(): {
  gmProxyConfigured: boolean;
  gmProxyRequired: boolean;
  gmProxyHost: string | null;
  gmTurnPath: string;
} {
  return {
    gmProxyConfigured: isGmProxyAvailable(),
    gmProxyRequired: isGmProxyRequired(),
    gmProxyHost: gmProxyHost(),
    gmTurnPath: '/functions/v1/gm-turn',
  };
}

/** Raw writer-reply problems seen since the last drain (one turn); logged with thumbs for training. */
const writerRawIssues: WriterRawIssue[] = [];

export function noteWriterRawIssue(issue: unknown): void {
  if (issue === 'empty' || issue === 'reasoning-only' || issue === 'cut-off') writerRawIssues.push(issue);
}

export function drainWriterRawIssues(): WriterRawIssue[] {
  return writerRawIssues.splice(0, writerRawIssues.length);
}

/** 28w — token use of every gm-turn reply since the last drain (one turn, re-asks included). */
const writerUsageCalls: Array<Partial<TurnWriterUsage>> = [];

/** A gm-turn reply without a usage block is unknown usage: the turn's sums become null. */
export function noteWriterUsage(usage: unknown): void {
  const u = usage && typeof usage === 'object' ? (usage as Record<string, unknown>) : {};
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  writerUsageCalls.push({
    tokensIn: num(u.tokensIn),
    tokensOut: num(u.tokensOut),
    tokensCached: num(u.tokensCached),
    modelCalls: num(u.modelCalls),
    modelId: typeof u.modelId === 'string' ? u.modelId : null,
  });
}

export function drainWriterUsage(): TurnWriterUsage | null {
  return sumWriterUsage(writerUsageCalls.splice(0, writerUsageCalls.length));
}

function pickClientApiKey(settings: Settings): string | undefined {
  if (!canConfigurePlayerAiKeys(settings)) return undefined;
  const key = resolveClientTextApiKey(settings);
  return key || undefined;
}

export async function invokeGmProxy(params: {
  mode: GmProxyMode;
  state: GameState;
  playerInput: string;
  settings: Settings;
  activeLoreCards?: LoreCard[];
  onRetry?: (attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
  /** Per-call budget; early / first-post-open turns pass a longer value (Class A). */
  timeoutMs?: number;
}): Promise<string> {
  assertNoLiveAiTurnForUmbra(params.state, 'invokeGmProxy');
  if (!isGmProxyAvailable()) {
    throw new Error('GM proxy unavailable — configure VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  }

  const run = async (attempt = 0): Promise<string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    };
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    }

    const tier = forceFreeModel()
      ? 'free'
      : effectiveWriterTier(params.settings.subscriptionTier);
    // 28l — one writer model per turn; retries never switch model.
    const modelId = forceFreeModel()
      ? getTierDefinition('free').writerOpenRouterId
      : resolveWriterModel({
          aiProvider: 'openrouter',
          customModelId: isTestLabEnabled() ? null : params.settings.customModelId,
          tier,
        });
    const writerProvider = hostedWriterProvider(modelId);

    const body = {
      mode: params.mode,
      playerInput: params.playerInput,
      state: params.state,
      loreCards: params.activeLoreCards ?? [],
      settings: {
        contentMode: params.settings.contentMode,
        mapTriggerMode: params.settings.mapTriggerMode,
        aiProvider: writerProvider,
        customModelId: modelId,
        subscriptionTier: tier,
        baseUrl: params.settings.baseUrl,
        diceAnimation: params.settings.diceAnimation,
        panelFrequency: params.settings.panelFrequency,
        statVerbosity: params.settings.statVerbosity,
        statFrequency: params.settings.statFrequency,
        dndMode: params.settings.dndMode,
        perspective: params.settings.perspective,
      },
      // BYOK passthrough — never logged server-side in responses
      clientApiKey: pickClientApiKey(params.settings) || undefined,
    };

    if (isByokTierWithoutHostedKeys(params.settings) && !body.clientApiKey) {
      throw new Error(BYOK_TEXT_KEY_REQUIRED);
    }

    logger.info('ai-proxy', `gm-turn ${params.mode}`, {
      turn: params.state.turn,
      provider: writerProvider,
      model: modelId,
      attempt,
      hasClientKey: !!body.clientApiKey,
    });

    const timeoutMs = Math.max(5_000, params.timeoutMs ?? GM_PROXY_TIMEOUT_DEFAULT_MS);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onExternalAbort = () => controller.abort();
    if (params.signal) {
      if (params.signal.aborted) controller.abort();
      else params.signal.addEventListener('abort', onExternalAbort);
    }
    let res: Response;
    try {
      res = await fetch(gmProxyUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      const externalAborted = !!params.signal?.aborted;
      if (externalAborted) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      if (timedOut || controller.signal.aborted) {
        throw new Error('The System is still compiling. Try again, or cancel and keep the last scene.');
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      if (/Failed to fetch|NetworkError|Load failed/i.test(errMsg)) {
        logger.error('ai-proxy', 'GM proxy network failure', {
          host: gmProxyHost(),
          path: '/functions/v1/gm-turn',
        });
        if (attempt === 0) return run(1);
      }
      throw err;
    } finally {
      clearTimeout(timer);
      params.signal?.removeEventListener('abort', onExternalAbort);
    }

    if (res.status === 429) {
      const retryAfterSec = Number(res.headers.get('Retry-After') ?? 0);
      throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
    }

    const payload = await res.json().catch(() => ({}));
    noteWriterRawIssue(payload?.rawIssue);
    if (res.ok || payload?.rawIssue) noteWriterUsage(payload?.usage);
    if (!res.ok) {
      // gm-turn already re-asked the same model once; the caller's plain-prose last resort takes over.
      if (payload?.rawIssue) {
        logger.warn('ai-proxy', 'Writer reply empty after the edge re-ask', { rawIssue: payload.rawIssue });
        return '';
      }
      const msg =
        typeof payload?.error === 'string'
          ? payload.error
          : `GM proxy error ${res.status}`;
      throw new Error(msg);
    }

    // Never accept prompt/diagnostics fields even if a buggy deploy returns them.
    if (payload?.systemPrompt || payload?.prompt || payload?.diagnostics) {
      logger.warn('ai-proxy', 'Scrubbed unexpected internal fields from GM proxy response');
    }

    const text = typeof payload?.text === 'string' ? payload.text : '';
    // P0-4 Batch 02f: Han in committed story is an empty reply.
    if (!text || hasHanScript(text)) {
      noteWriterRawIssue('empty');
      return '';
    }
    return text;
  };

  return withRetry(() => run(0), params.onRetry);
}

function imageProxyUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '');
  return `${base}/functions/v1/generate-image`;
}

/**
 * Hosted memorable art via edge proxy (server OpenRouter key).
 * Uses the same URL + JWT pattern as gm-turn (anon key for guests, session JWT when signed in).
 */
export async function invokeImageProxy(params: {
  prompt: string;
  model?: string;
  clientApiKey?: string;
  signal?: AbortSignal;
}): Promise<string> {
  if (!isGmProxyAvailable()) {
    logger.warn('ai-image', 'generate-image proxy unavailable — VITE_SUPABASE_URL / anon key missing');
    throw new Error('Hosted image service is unavailable.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  };
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

  const model = resolveHostedImageModel(params.model);
  const url = imageProxyUrl();
  logger.info('ai-image', 'generate-image proxy request', {
    url,
    model,
    hasSession: !!session?.access_token,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  const onExternalAbort = () => controller.abort();
  if (params.signal) {
    if (params.signal.aborted) controller.abort();
    else params.signal.addEventListener('abort', onExternalAbort);
  }

  const post = (authorization: string) =>
    fetch(url, {
      method: 'POST',
      headers: { ...headers, Authorization: authorization },
      body: JSON.stringify({
        prompt: params.prompt,
        model,
        clientApiKey: params.clientApiKey,
      }),
      signal: controller.signal,
    });

  try {
    const anonBearer = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    let res: Response;
    try {
      res = await post(headers.Authorization);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('ai-image', 'generate-image fetch failed', { error: msg });
      throw new Error(/failed to fetch|networkerror|load failed/i.test(msg)
        ? 'Hosted image service is unavailable.'
        : msg);
    }
    // Stale session JWT can 401 while the anon key still matches gm-turn. Retry once; do not drop JWT by default.
    if (res.status === 401 && session?.access_token) {
      logger.warn('ai-image', 'generate-image 401 with session JWT — retrying with anon key');
      try {
        res = await post(anonBearer);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(/failed to fetch|networkerror|load failed/i.test(msg)
          ? 'Hosted image service is unavailable.'
          : msg);
      }
    }
    const payload = await res.json().catch(() => ({}));
    logger.info('ai-image', 'generate-image proxy response', {
      status: res.status,
      hasUrl: typeof payload?.url === 'string',
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Image proxy error 401');
      if (res.status === 404) throw new Error('Image proxy error 404');
      const msg = typeof payload?.error === 'string' ? payload.error : `Image proxy error ${res.status}`;
      throw new Error(msg);
    }
    const imageUrl = typeof payload?.url === 'string' ? payload.url : '';
    if (!imageUrl) {
      throw new Error('Hosted image service is unavailable.');
    }
    return imageUrl;
  } finally {
    clearTimeout(timer);
    if (params.signal) params.signal.removeEventListener('abort', onExternalAbort);
  }
}
