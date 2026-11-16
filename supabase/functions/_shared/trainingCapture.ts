/**
 * gm-turn training capture (hand-authored edge code).
 *
 * - Who: verified founder / staff / listed test accounts by default; another signed-in player only with
 *   profiles.training_capture_opt_in = true AND PLAYER_CAPTURE_ENABLED=true. Anonymous calls: never.
 * - Switch PLAYER_CAPTURE_ENABLED (edge env):
 *     unset or "founders" → founder / staff / test accounts only (the default)
 *     "true" / "players"  → also players who opted in
 *     "false" / "off"     → no capture at all
 * - What: one row per model call (writer / rewrite / repair / check), exact ordered messages of every attempt,
 *   inference settings, the SERVED host + model from the OpenRouter completion, rights from trainingRights.ts.
 *   No keys, auth headers, emails, or provider reasoning are stored.
 * - How: after the response is built, in the background (EdgeRuntime.waitUntil). A failure is logged with a
 *   status code only and never touches the turn.
 */
import { verifiedAuthUser } from './authUser.ts';
import { privilegeBasis } from './playPrivileges.ts';
import { PREFERRED_TRAINING_PROVIDER_ORDER } from './gm/openRouterChat.ts';
import { isFallbackHost, trainingRightsFor, type TrainingRights } from './gm/trainingRights.ts';

export const CAPTURE_SCHEMA_VERSION = 1;

/** Largest row we store (JSON chars). Engine facts are dropped first; a row still over is skipped. */
const MAX_ROW_CHARS = 3_000_000;
const MAX_ENGINE_FACTS_CHARS = 400_000;

export type CaptureBasis = 'founder' | 'staff' | 'test' | 'opt_in';
export type CallKind = 'writer' | 'rewrite' | 'repair' | 'check';

export type CaptureAttempt = {
  messages: Array<{ role: string; content: string }>;
  /** The request body minus messages (model, provider routing, schema, sampling). Never headers. */
  settings: Record<string, unknown>;
  text: string;
  issue: string | null;
  servedProvider?: string;
  servedModel?: string;
  generationId?: string;
  finishReason?: string;
  usage?: unknown;
  failed?: boolean;
};

type ClientCapture = {
  callId: string;
  callKind: CallKind;
  rootTurnId: string | null;
  parentCallId: string | null;
  turnNo: number | null;
  input: unknown;
  resolvedAction: string | null;
  buildStamp: string | null;
  gitSha: string | null;
  sessionId: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const s = (v: unknown, max = 200): string | null => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null);

/** The client's capture ids, validated (shape + size only). Unknown / bad fields become null. */
export function readClientCapture(raw: unknown, mode: 'turn' | 'repair' | 'check'): ClientCapture {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const callId = s(r.callId, 64);
  const parent = s(r.parentCallId, 64);
  const kind = r.callKind === 'rewrite' && mode === 'turn' ? 'rewrite' : mode === 'turn' ? 'writer' : mode;
  let input: unknown = null;
  if (r.input && typeof r.input === 'object' && !Array.isArray(r.input) && JSON.stringify(r.input).length <= 8_000) input = r.input;
  return {
    callId: callId && UUID.test(callId) ? callId : crypto.randomUUID(),
    callKind: kind,
    rootTurnId: s(r.rootTurnId, 100),
    parentCallId: parent && UUID.test(parent) ? parent : null,
    turnNo: Number.isInteger(r.turnNo) ? (r.turnNo as number) : null,
    input,
    resolvedAction: s(r.resolvedAction, 4_000),
    buildStamp: s(r.buildStamp, 64),
    gitSha: s(r.gitSha, 64),
    sessionId: s(r.sessionId, 100),
  };
}

function switchMode(): 'off' | 'founders' | 'players' {
  const v = (Deno.env.get('PLAYER_CAPTURE_ENABLED') ?? '').trim().toLowerCase();
  if (['false', 'off', '0', 'no', 'none'].includes(v)) return 'off';
  if (['true', 'on', '1', 'yes', 'players'].includes(v)) return 'players';
  return 'founders';
}

function testEmails(): string[] {
  return (Deno.env.get('TRAINING_CAPTURE_TEST_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function serviceKey(): string {
  return (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
}

function restUrl(path: string): string {
  return `${(Deno.env.get('SUPABASE_URL') ?? '').trim().replace(/\/$/, '')}/rest/v1/${path}`;
}

async function playerOptedIn(userId: string): Promise<boolean> {
  const key = serviceKey();
  if (!key) return false;
  try {
    const res = await fetch(restUrl(`profiles?id=eq.${encodeURIComponent(userId)}&select=training_capture_opt_in`), {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      await res.body?.cancel();
      return false;
    }
    const rows = (await res.json().catch(() => [])) as Array<{ training_capture_opt_in?: unknown }>;
    return rows[0]?.training_capture_opt_in === true;
  } catch {
    return false;
  }
}

/** Why this call may be captured, or null. Anonymous / unverified callers are never captured. */
export async function captureBasis(req: Request, userId: string | null): Promise<CaptureBasis | null> {
  const mode = switchMode();
  if (mode === 'off' || !userId) return null;
  const privileged = await privilegeBasis(req);
  if (privileged) return privileged;
  const user = await verifiedAuthUser(req);
  if (user?.email && testEmails().includes(user.email)) return 'test';
  if (mode === 'players' && (await playerOptedIn(userId))) return 'opt_in';
  return null;
}

function jsonSize(v: unknown): number {
  try {
    return JSON.stringify(v ?? null).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function buildCaptureRow(args: {
  basis: CaptureBasis;
  userId: string;
  client: ClientCapture;
  state: Record<string, unknown>;
  attempts: CaptureAttempt[];
  finalText: string;
  completionStatus: 'ok' | 'empty' | 'error' | 'rate_limited';
  requestedModel: string | null;
  keySource: 'server' | 'player';
  usage: unknown;
}): Record<string, unknown> | null {
  const { client, state, attempts } = args;
  const answered = [...attempts].reverse().find((a) => !a.failed && (a.servedProvider || a.text)) ?? attempts[attempts.length - 1];
  const servedProvider = answered?.servedProvider ?? null;
  const servedModel = answered?.servedModel ?? null;
  // Rights of the call = the weakest rights of any attempt that produced text the row stores.
  const order: TrainingRights[] = ['excluded', 'unknown', 'conditional', 'allowed'];
  const rights = attempts
    .filter((a) => !a.failed)
    .map((a) => trainingRightsFor(a.servedProvider, a.servedModel))
    .reduce<TrainingRights>((worst, r) => (order.indexOf(r) < order.indexOf(worst) ? r : worst), attempts.some((a) => !a.failed) ? 'allowed' : 'unknown');
  const packet = (state as { completedEvent?: unknown }).completedEvent ?? null;
  const row: Record<string, unknown> = {
    schema_version: CAPTURE_SCHEMA_VERSION,
    call_id: client.callId,
    call_kind: client.callKind,
    parent_call_id: client.parentCallId,
    root_turn_id: client.rootTurnId ?? client.callId,
    attempt_count: attempts.length,
    user_id: args.userId,
    capture_basis: args.basis,
    session_id: client.sessionId,
    save_id: s((state as { saveId?: unknown }).saveId),
    campaign_id: s((state as { storyName?: unknown }).storyName),
    world_id: s((state as { campaignBibleId?: unknown }).campaignBibleId),
    engine_mode: s((state as { engineMode?: unknown }).engineMode, 40),
    turn_no: client.turnNo ?? (Number.isInteger((state as { turn?: unknown }).turn) ? (state as { turn: number }).turn : null),
    build_stamp: client.buildStamp,
    git_sha: client.gitSha,
    request_messages: attempts.map((a) => a.messages),
    inference_settings: attempts.map((a) => a.settings),
    key_source: args.keySource,
    requested_model: args.requestedModel,
    served_provider: servedProvider,
    served_model: servedModel,
    generation_ids: attempts.map((a) => a.generationId).filter((g): g is string => !!g),
    route_fallback: attempts.some((a) => !a.failed && isFallbackHost(a.servedProvider, PREFERRED_TRAINING_PROVIDER_ORDER))
      || !attempts.some((a) => !a.failed),
    rights,
    finish_reason: answered?.finishReason ?? null,
    completion_status: args.completionStatus,
    usage: args.usage ?? null,
    output_initial: attempts[0]?.text || null,
    output_reask: attempts.length > 1 ? attempts[attempts.length - 1]?.text || null : null,
    output_final: args.finalText || null,
    player_input: client.input,
    resolved_action: client.resolvedAction,
    engine_facts: jsonSize(packet) <= MAX_ENGINE_FACTS_CHARS ? packet : { omitted: 'over-size', chars: jsonSize(packet) },
    status: 'candidate',
  };
  if (jsonSize(row) > MAX_ROW_CHARS) {
    row.engine_facts = { omitted: 'row-over-size' };
    if (jsonSize(row) > MAX_ROW_CHARS) return null;
  }
  return row;
}

async function insertRow(row: Record<string, unknown>): Promise<void> {
  const key = serviceKey();
  if (!key) {
    console.warn('[gm-turn] capture skipped: no service role key');
    return;
  }
  try {
    const res = await fetch(restUrl('gm_turn_captures'), {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.warn(`[gm-turn] capture insert failed: HTTP ${res.status}`);
    await res.body?.cancel();
  } catch {
    console.warn('[gm-turn] capture insert failed: network');
  }
}

/**
 * Decide + build + insert in the background. Never throws, never delays the response.
 * `build` runs only when the call may be captured.
 */
export function scheduleCapture(
  req: Request,
  userId: string | null,
  build: (basis: CaptureBasis, userId: string) => Record<string, unknown> | null
): void {
  const work = (async () => {
    try {
      const basis = await captureBasis(req, userId);
      if (!basis || !userId) return;
      const row = build(basis, userId);
      if (!row) {
        console.warn('[gm-turn] capture skipped: row over size cap');
        return;
      }
      await insertRow(row);
    } catch {
      console.warn('[gm-turn] capture failed');
    }
  })();
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') rt.waitUntil(work);
}
