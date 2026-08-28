import type { GameState, Settings, LoreCard } from './types';
import { logger } from './logger';
import {
  type GmResult,
  processGmCompletion,
} from './aiServiceShared';
import {
  invokeGmProxy,
  isClientGmAllowed,
  isGmProxyAvailable,
  isGmProxyRequired,
} from './gmProxy';
import { gmProxyTimeoutMsForState } from './errorRepairWarden';
import { effectiveWriterTier } from './testLab';
import { logApiLatency } from '../services/telemetryService';

export type { GmResult } from './aiServiceShared';
export { RateLimitError, withRetry } from './aiServiceShared';

/**
 * Resolve narrative generation.
 * Prefer the Supabase `gm-turn` edge proxy (prompts stay server-side).
 * Client-side assembly is DEV / explicit VITE_ALLOW_CLIENT_GM only (tree-shaken from prod otherwise).
 */
export async function callGm(
  state: GameState,
  playerInput: string,
  settings: Settings,
  activeLoreCards: LoreCard[] = [],
  onRetry?: (attempt: number, delayMs: number) => void,
  signal?: AbortSignal,
  timeoutMs?: number
): Promise<GmResult> {
  const preferProxy = isGmProxyRequired() || isGmProxyAvailable();

  if (preferProxy && isGmProxyAvailable()) {
    try {
      const text = await invokeGmProxy({
        mode: 'turn',
        state,
        playerInput,
        settings,
        activeLoreCards,
        onRetry,
        signal,
        timeoutMs,
      });
      return processGmCompletion(text, state.engineMode);
    } catch (err) {
      if (isGmProxyRequired() || !isClientGmAllowed()) {
        logger.error('ai-proxy', 'GM proxy failed and client GM path is disabled', {
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
      logger.warn('ai-proxy', 'GM proxy failed — falling back to client GM (dev/allowlist)', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Build-time constants so Vite can drop aiService.direct + systemPrompt from prod bundles.
  if (import.meta.env.DEV || import.meta.env.VITE_ALLOW_CLIENT_GM === 'true') {
    const direct = await import('./aiService.direct');
    return direct.callGmDirect(state, playerInput, settings, activeLoreCards, onRetry);
  }

  throw new Error(
    'GM proxy required. Deploy supabase function gm-turn and set VITE_SUPABASE_URL / VITE_REQUIRE_GM_PROXY=true.'
  );
}

/** Opening page / cover-continue — real `callGm` args (never a phantom 5th callback). */
export async function callOpeningGm(
  state: GameState,
  playerInput: string,
  settings: Settings,
  signal?: AbortSignal,
): Promise<string> {
  const timeoutMs = gmProxyTimeoutMsForState(state, {
    writerTier: effectiveWriterTier(settings.subscriptionTier ?? 'free'),
  });
  const started = Date.now();
  try {
    const result = await callGm(state, playerInput, settings, [], undefined, signal, timeoutMs);
    const text = (result.text ?? '').trim();
    logApiLatency({
      label: 'callOpeningGm',
      latencyMs: Date.now() - started,
      provider: settings.aiProvider,
      engineMode: state.engineMode,
      playerInput: playerInput || '(opening)',
      aiResponse: text || undefined,
      failed: !text,
      extra: { saveId: state.saveId, turn: state.turn },
    });
    return text;
  } catch (err) {
    logApiLatency({
      label: 'callOpeningGm',
      latencyMs: Date.now() - started,
      provider: settings.aiProvider,
      engineMode: state.engineMode,
      playerInput: playerInput || '(opening)',
      failed: true,
      stack: err instanceof Error ? err.stack : undefined,
      extra: {
        saveId: state.saveId,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

export async function callGmAutoFight(
  state: GameState,
  autoFightPrompt: string,
  settings: Settings,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<string> {
  const started = Date.now();
  try {
    const preferProxy = isGmProxyRequired() || isGmProxyAvailable();

    if (preferProxy && isGmProxyAvailable()) {
      try {
        const text = (await invokeGmProxy({
          mode: 'auto-fight',
          state,
          playerInput: autoFightPrompt,
          settings,
          onRetry,
        })).trim();
        logApiLatency({
          label: 'callGmAutoFight',
          latencyMs: Date.now() - started,
          provider: settings.aiProvider,
          engineMode: state.engineMode,
          playerInput: autoFightPrompt.slice(0, 4000),
          aiResponse: text,
          extra: { saveId: state.saveId },
        });
        return text;
      } catch (err) {
        if (isGmProxyRequired() || !isClientGmAllowed()) throw err;
        logger.warn('ai-proxy', 'GM auto-fight proxy failed — client fallback', {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (import.meta.env.DEV || import.meta.env.VITE_ALLOW_CLIENT_GM === 'true') {
      const direct = await import('./aiService.direct');
      const text = await direct.callGmAutoFightDirect(state, autoFightPrompt, settings, onRetry);
      logApiLatency({
        label: 'callGmAutoFight',
        latencyMs: Date.now() - started,
        provider: settings.aiProvider,
        engineMode: state.engineMode,
        playerInput: autoFightPrompt.slice(0, 4000),
        aiResponse: text,
        extra: { saveId: state.saveId },
      });
      return text;
    }

    throw new Error('GM proxy required for auto-fight. Deploy supabase function gm-turn.');
  } catch (err) {
    logApiLatency({
      label: 'callGmAutoFight',
      latencyMs: Date.now() - started,
      provider: settings.aiProvider,
      engineMode: state.engineMode,
      playerInput: autoFightPrompt.slice(0, 4000),
      failed: true,
      stack: err instanceof Error ? err.stack : undefined,
      extra: {
        saveId: state.saveId,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}
