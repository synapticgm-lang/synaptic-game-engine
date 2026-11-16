/**
 * Training-capture row builder (pure; no network, no env). gm-turn's edge capture module
 * (supabase/functions/_shared/trainingCapture.ts) decides consent and inserts; this builds the row.
 * Synced to supabase/functions/_shared/gm by scripts/sync-gm-edge-shared.mjs.
 */
import { PREFERRED_TRAINING_PROVIDER_ORDER } from './openRouterChat';
import { isFallbackHost, trainingRightsFor } from './trainingRights';
import type {
  CaptureBasis,
  CaptureCallKind,
  CaptureCompletionStatus,
  CaptureKeySource,
  CaptureStatus,
  TrainingRights,
} from './trainingCaptureVocab';

export const CAPTURE_SCHEMA_VERSION = 1;

/** Largest row we store (JSON chars). Engine facts are dropped first; a row still over is skipped. */
const MAX_ROW_CHARS = 3_000_000;
const MAX_ENGINE_FACTS_CHARS = 400_000;


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

export type ClientCapture = {
  callId: string;
  callKind: CaptureCallKind;
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
  const kind: CaptureCallKind = r.callKind === 'rewrite' && mode === 'turn' ? 'rewrite' : mode === 'turn' ? 'writer' : mode;
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
  completionStatus: CaptureCompletionStatus;
  requestedModel: string | null;
  keySource: CaptureKeySource;
  usage: unknown;
}): Record<string, unknown> | null {
  const { client, state, attempts } = args;
  const answered = [...attempts].reverse().find((a) => !a.failed && (a.servedProvider || a.text)) ?? attempts[attempts.length - 1];
  const servedProvider = answered?.servedProvider ?? null;
  const servedModel = answered?.servedModel ?? null;
  // Rights of the call = the weakest rights of any attempt that produced text the row stores.
  // Weakest first (excluded < unknown < conditional < allowed).
  const order: readonly TrainingRights[] = ['excluded', 'unknown', 'conditional', 'allowed'];
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
    status: 'candidate' satisfies CaptureStatus,
  };
  if (jsonSize(row) > MAX_ROW_CHARS) {
    row.engine_facts = { omitted: 'row-over-size' };
    if (jsonSize(row) > MAX_ROW_CHARS) return null;
  }
  return row;
}
