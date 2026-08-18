import type { GameState, LoreCard, Settings } from './types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { RateLimitError, withRetry } from './aiServiceShared';
import { logger } from './logger';
import { resolveWriterModel, getTierDefinition } from './subscriptionTiers';
import { forceFreeModel } from './opsKillSwitches';
import { effectiveWriterTier, isTestLabEnabled } from './testLab';
import {
  BYOK_TEXT_KEY_REQUIRED,
  canConfigurePlayerAiKeys,
  isByokTierWithoutHostedKeys,
  resolveClientTextApiKey,
} from './distributionChannel';

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

function pickClientApiKey(settings: Settings): string | undefined {
  if (!canConfigurePlayerAiKeys(settings)) return undefined;
  const key = resolveClientTextApiKey(settings);
  return key || undefined;
}

const GM_PROXY_TIMEOUT_MS = 30_000;

export async function invokeGmProxy(params: {
  mode: GmProxyMode;
  state: GameState;
  playerInput: string;
  settings: Settings;
  activeLoreCards?: LoreCard[];
  onRetry?: (attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}): Promise<string> {
  if (!isGmProxyAvailable()) {
    throw new Error('GM proxy unavailable — configure VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  }

  const run = async (): Promise<string> => {
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

    const body = {
      mode: params.mode,
      playerInput: params.playerInput,
      state: params.state,
      loreCards: params.activeLoreCards ?? [],
      settings: {
        contentMode: params.settings.contentMode,
        mapTriggerMode: params.settings.mapTriggerMode,
        aiProvider: 'openrouter',
        customModelId: forceFreeModel()
          ? getTierDefinition('free').writerOpenRouterId
          : resolveWriterModel({
              aiProvider: 'openrouter',
              // Test Lab exercises hosted Free/Mid/High — ignore Admin custom model ids.
              customModelId: isTestLabEnabled() ? null : params.settings.customModelId,
              tier: effectiveWriterTier(params.settings.subscriptionTier),
            }),
        subscriptionTier: forceFreeModel()
          ? 'free'
          : effectiveWriterTier(params.settings.subscriptionTier),
        baseUrl: params.settings.baseUrl,
        diceAnimation: params.settings.diceAnimation,
        panelFrequency: params.settings.panelFrequency,
        statVerbosity: params.settings.statVerbosity,
        statFrequency: params.settings.statFrequency,
        dndMode: params.settings.dndMode,
      },
      // BYOK passthrough — never logged server-side in responses
      clientApiKey: pickClientApiKey(params.settings) || undefined,
    };

    if (isByokTierWithoutHostedKeys(params.settings) && !body.clientApiKey) {
      throw new Error(BYOK_TEXT_KEY_REQUIRED);
    }

    logger.info('ai-proxy', `gm-turn ${params.mode}`, {
      turn: params.state.turn,
      provider: 'openrouter',
      hasClientKey: !!body.clientApiKey,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GM_PROXY_TIMEOUT_MS);
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
      if (controller.signal.aborted) {
        throw new Error('The System is still compiling. Try again, or cancel and keep the last scene.');
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
    if (!res.ok) {
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
    if (!text) throw new Error('GM proxy returned empty content.');
    return text;
  };

  return withRetry(run, params.onRetry);
}

function imageProxyUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '');
  return `${base}/functions/v1/generate-image`;
}

/**
 * Hosted memorable art via edge proxy (server OpenRouter key).
 * Returns null when proxy is unavailable so callers can fall back / soft-skip.
 */
export async function invokeImageProxy(params: {
  prompt: string;
  model?: string;
  clientApiKey?: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  if (!isGmProxyAvailable()) return null;

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  const onExternalAbort = () => controller.abort();
  if (params.signal) {
    if (params.signal.aborted) controller.abort();
    else params.signal.addEventListener('abort', onExternalAbort);
  }

  try {
    const res = await fetch(imageProxyUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model,
        clientApiKey: params.clientApiKey,
      }),
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = typeof payload?.error === 'string' ? payload.error : `Image proxy error ${res.status}`;
      throw new Error(msg);
    }
    const url = typeof payload?.url === 'string' ? payload.url : '';
    return url || null;
  } finally {
    clearTimeout(timer);
    if (params.signal) params.signal.removeEventListener('abort', onExternalAbort);
  }
}
