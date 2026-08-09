import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { debugLogger } from '@/game/debugLogger';

/** Row shape written to `public.telemetry_logs` (Game Ops Console / Telemetry page). */
export interface TelemetryLogInsert {
  player_id: string;
  event_type: string;
  component?: string;
  action_target?: string;
  latency?: number | null;
  message?: string | null;
  stack?: string | null;
  session_id?: string | null;
  device_id?: string | null;
  payload?: Record<string, unknown> | null;
}

/** Row shape written to `public.ai_traffic` (Game Ops Console / AI Traffic page). */
export interface AiTrafficInsert {
  player_id: string;
  engine_mode?: string | null;
  provider?: string | null;
  latency?: number | null;
  token_count?: number | null;
  status?: string | null;
  system_prompt?: string | null;
  player_input?: string | null;
  ai_response?: string | null;
  error_stack?: string | null;
  save_id?: string | null;
  payload?: Record<string, unknown> | null;
}

let playerId = 'guest';
let engineMode = 'litrpg';
let aiProvider = 'unknown';
let saveId: string | null = null;
let bridgeInstalled = false;

/** High-signal debug types only — avoid flooding Ops with every click/state write. */
const TELEMETRY_TYPES = new Set(['TURN_START', 'ERROR', 'CRITICAL']);

/** Bridge only retries/errors from debugLogger — successful callGm paths use `logApiLatency` directly. */
const AI_TYPES = new Set(['API_RETRY']);

export function setTelemetryContext( partial: {
  playerId?: string | null;
  engineMode?: string | null;
  aiProvider?: string | null;
  saveId?: string | null;
}): void {
  if (partial.playerId !== undefined) playerId = partial.playerId?.trim() || 'guest';
  if (partial.engineMode !== undefined) engineMode = partial.engineMode?.trim() || 'litrpg';
  if (partial.aiProvider !== undefined) aiProvider = partial.aiProvider?.trim() || 'unknown';
  if (partial.saveId !== undefined) saveId = partial.saveId;
}

function baseMeta(): Pick<TelemetryLogInsert, 'session_id' | 'device_id'> {
  const tel = debugLogger.getTelemetry();
  return {
    session_id: typeof tel.sessionId === 'string' ? tel.sessionId : null,
    device_id: typeof tel.deviceId === 'string' ? tel.deviceId : null,
  };
}

function mapStatus(data?: Record<string, unknown>, failed = false): string {
  if (failed) {
    if (typeof data?.status === 'number' && data.status === 429) return '429 Rate Limit';
    if (typeof data?.timedOut === 'boolean' && data.timedOut) return '500 API Error';
    return '500 API Error';
  }
  if (typeof data?.status === 'string') return data.status;
  if (typeof data?.status === 'number') {
    if (data.status === 429) return '429 Rate Limit';
    if (data.status >= 500) return '500 API Error';
    if (data.status >= 400) return 'Bad Format JSON';
    return '200 OK';
  }
  return '200 OK';
}

function mapProvider(raw?: string | null): string {
  const p = (raw || aiProvider || 'unknown').toLowerCase();
  if (p.includes('anthropic') || p.includes('claude')) return 'Anthropic';
  if (p.includes('openai') || p.includes('gpt')) return 'OpenAI';
  if (p.includes('gemini') || p.includes('google')) return 'Gemini';
  if (p.includes('openrouter')) return 'OpenAI';
  return 'Gemini';
}

function mapEngineMode(raw?: string | null): string {
  const m = (raw || engineMode || 'litrpg').toLowerCase();
  if (m === 'dnd' || m === '5e') return '5e';
  if (m === 'rpg') return 'RPG';
  return 'LitRPG';
}

/** Fire-and-forget insert into `telemetry_logs`. Safe no-op when Supabase is unset. */
export async function logTelemetryEvent(
  event: Omit<TelemetryLogInsert, 'player_id'> & { player_id?: string }
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const row: TelemetryLogInsert = {
    player_id: event.player_id ?? playerId,
    event_type: event.event_type,
    component: event.component ?? 'NarrativeStream',
    action_target: event.action_target ?? event.event_type,
    latency: event.latency ?? null,
    message: event.message ?? null,
    stack: event.stack ?? null,
    payload: event.payload ?? null,
    ...baseMeta(),
    ...(event.session_id !== undefined ? { session_id: event.session_id } : {}),
    ...(event.device_id !== undefined ? { device_id: event.device_id } : {}),
  };

  const { error } = await supabase.from('telemetry_logs').insert(row);
  if (error) {
    // Avoid recursive debugLogger → telemetry loops; console only.
    console.warn('[telemetry] telemetry_logs insert failed', error.message);
  }
}

/** Fire-and-forget insert into `ai_traffic`. */
export async function logAiTraffic(
  event: Omit<AiTrafficInsert, 'player_id'> & { player_id?: string }
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const row: AiTrafficInsert = {
    player_id: event.player_id ?? playerId,
    engine_mode: event.engine_mode ?? mapEngineMode(),
    provider: event.provider ?? mapProvider(),
    latency: event.latency ?? null,
    token_count: event.token_count ?? null,
    status: event.status ?? '200 OK',
    system_prompt: event.system_prompt ?? null,
    player_input: event.player_input ?? null,
    ai_response: event.ai_response ?? null,
    error_stack: event.error_stack ?? null,
    save_id: event.save_id ?? saveId,
    payload: event.payload ?? null,
  };

  const { data: inserted, error } = await supabase.from('ai_traffic').insert(row).select('id').maybeSingle();
  if (error) {
    console.warn('[telemetry] ai_traffic insert failed', error.message);
  }

  // Auto-queue moderation review for failed AI calls (Ops Flagged Narrative Review).
  const status = String(row.status ?? '');
  if (status && status !== '200 OK') {
    void supabase.from('moderation_reports').insert({
      status: 'Pending',
      source: 'auto_error',
      reason: `Client auto-flag: ${status}`,
      excerpt: String(row.ai_response ?? row.player_input ?? '').slice(0, 500),
      reporter: 'game-client',
      player_id: row.player_id,
      campaign: row.save_id ?? null,
      engine_mode: row.engine_mode ?? null,
      ai_traffic_id: inserted?.id ? String(inserted.id) : null,
      payload: {
        provider: row.provider,
        latency: row.latency,
        status,
      },
    }).then(({ error: modErr }) => {
      if (modErr) console.warn('[telemetry] moderation_reports insert failed', modErr.message);
    });
  }
}

export function logPlayerAction(action: string, extra?: Record<string, unknown>): void {
  void logTelemetryEvent({
    event_type: 'PLAYER_ACTION',
    component: 'ChatInput',
    action_target: action.slice(0, 120),
    message: action.slice(0, 500),
    payload: extra ?? null,
  });
}

export function logRollResults(
  rolls: Array<{ label?: string; total?: number; detail?: string }>,
  latencyMs?: number
): void {
  if (!rolls.length) return;
  void logTelemetryEvent({
    event_type: 'ROLL_RESULT',
    component: 'DiceTray',
    action_target: rolls.map((r) => r.label || 'roll').join(', ').slice(0, 120),
    latency: latencyMs ?? null,
    message: rolls
      .map((r) => `${r.label ?? 'roll'}=${r.total ?? '?'}${r.detail ? ` (${r.detail})` : ''}`)
      .join('; ')
      .slice(0, 1000),
    payload: { rolls },
  });
}

export function logApiLatency(opts: {
  label: string;
  latencyMs: number;
  provider?: string;
  engineMode?: string;
  playerInput?: string;
  aiResponse?: string;
  tokenCount?: number;
  failed?: boolean;
  status?: string | number;
  stack?: string;
  extra?: Record<string, unknown>;
}): void {
  void logAiTraffic({
    engine_mode: mapEngineMode(opts.engineMode),
    provider: mapProvider(opts.provider),
    latency: opts.latencyMs,
    token_count: opts.tokenCount ?? null,
    status: typeof opts.status === 'string' ? opts.status : mapStatus({ status: opts.status }, opts.failed),
    player_input: opts.playerInput?.slice(0, 4000) ?? opts.label,
    ai_response: opts.aiResponse?.slice(0, 8000) ?? null,
    error_stack: opts.stack ?? null,
    payload: { label: opts.label, ...(opts.extra ?? {}) },
  });

  void logTelemetryEvent({
    event_type: opts.failed ? 'API_ERROR' : 'API_LATENCY',
    component: 'NarrativeStream',
    action_target: opts.label,
    latency: opts.latencyMs,
    message: `${opts.label} ${opts.failed ? 'failed' : 'ok'} in ${opts.latencyMs}ms`,
    stack: opts.stack ?? null,
    payload: opts.extra ?? null,
  });
}

export function logErrorStack(message: string, stack?: string, extra?: Record<string, unknown>): void {
  void logTelemetryEvent({
    event_type: 'ERROR',
    component: 'SettingsPanel',
    action_target: 'runtime_error',
    message: message.slice(0, 1000),
    stack: stack?.slice(0, 8000) ?? null,
    payload: extra ?? null,
  });
}

/**
 * Forward high-signal `debugLogger` entries to Supabase so the Vercel Ops Console
 * reflects live play without requiring a manual log export.
 */
export function installTelemetryDebugBridge(): void {
  if (bridgeInstalled || typeof window === 'undefined') return;
  bridgeInstalled = true;

  const originalRecord = debugLogger.record.bind(debugLogger);
  debugLogger.record = (type: string, message: string, data?: unknown) => {
    originalRecord(type, message, data);
    const upper = type.toUpperCase();
    const payload =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined;
    const latency =
      typeof payload?.latency === 'number'
        ? payload.latency
        : typeof payload?.latencyMs === 'number'
          ? payload.latencyMs
          : null;

    if (upper === 'ERROR' || upper === 'CRITICAL') {
      void logErrorStack(message, typeof payload?.stack === 'string' ? payload.stack : undefined, payload);
      return;
    }

    if (AI_TYPES.has(upper) && (latency != null || upper === 'API_RESPONSE')) {
      void logAiTraffic({
        latency,
        status: mapStatus(payload, upper !== 'API_RESPONSE' && Boolean(payload?.error)),
        provider: mapProvider(typeof payload?.aiProvider === 'string' ? payload.aiProvider : null),
        player_input: message.slice(0, 500),
        ai_response:
          typeof payload?.error === 'string'
            ? payload.error
            : typeof payload?.responseLength === 'number'
              ? `responseLength=${payload.responseLength}`
              : null,
        error_stack: typeof payload?.stack === 'string' ? payload.stack : null,
        payload: { type: upper, message, ...(payload ?? {}) },
      });
    }

    if (TELEMETRY_TYPES.has(upper) && upper !== 'ERROR' && upper !== 'CRITICAL') {
      void logTelemetryEvent({
        event_type: upper === 'USER_ACTION' ? 'BUTTON_CLICK' : upper,
        component: 'NarrativeStream',
        action_target: message.slice(0, 120),
        latency,
        message: message.slice(0, 500),
        payload: payload ?? null,
      });
    }
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';
    const stack = reason instanceof Error ? reason.stack : undefined;
    logErrorStack(message, stack, { kind: 'unhandledrejection' });
  });
}
