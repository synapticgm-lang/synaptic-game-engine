/**
 * q71-TRAINLOG — one recorder for every completed model call (logging only).
 * Sinks: autoplay `<run>/calls.jsonl` (Node append), optional ai_traffic (tester/autoplay only).
 * Never throws into the game turn. Never stores keys/headers. Real-player message storage stays OFF.
 */

/** Same cut-off finish reasons as openRouterChat.isCutOffFinish (kept local to avoid import cycles). */
function isCutOffFinish(reason: unknown): boolean {
  return /^(?:length|max_tokens|MAX_TOKENS)$/.test(String(reason ?? ''));
}

/** Avoid importing runManifest (edge graph); session / caller may override. */
const FALLBACK_BUILD_STAMP = 'trainlog';

export type TrainLogJob =
  | 'writer'
  | 'repair'
  | 'rewrite'
  | 'interpret'
  | 'chip_gapfill'
  | 'judge'
  /** Clause-check (`callGmCheck` / gm-turn `mode:check`) — audits prose vs FACTS. */
  | 'check'
  | 'untagged';

export type TrainLogMessage = { role: string; content: string };

/** Where a train row's engine_facts came from. request_state is not the packet freeze. */
export type EngineFactsProvenance = 'packet' | 'request_state' | 'absent';

export type TrainLogEngineFacts = {
  location: string | null;
  npcs: Array<{ id: string | null; name: string }>;
  hp: { current: number | null; max: number | null };
  inventory: string[];
  options: string[];
  dice: {
    check: string | null;
    roll: number | null;
    dc: number | null;
    result: string | null;
  } | null;
  quest_flags: string[];
};

export type TrainLogJudgeScores = Record<string, number> & { overall?: number };

export type TrainLogRow = {
  id: string;
  created_at: string;
  job: TrainLogJob;
  messages: TrainLogMessage[];
  teacher_model: string | null;
  provider: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  tokens_cached: number | null;
  cost: number | null;
  latency_ms: number | null;
  finish_reason: string | null;
  truncated: boolean;
  lap_id: string | null;
  run_id: string | null;
  save_id: string | null;
  turn_no: number | null;
  mode: string | null;
  genre: string | null;
  build_stamp: string | null;
  engine_facts?: TrainLogEngineFacts | null;
  /** packet: frozen with the turn. request_state: read from the call. absent: payload was not facts. */
  engine_facts_provenance?: EngineFactsProvenance | null;
  judge_scores?: TrainLogJudgeScores | null;
  parent_id?: string | null;
  draft?: string | null;
  flagged_error?: string | null;
  correct_fact?: string | null;
  repaired_reply?: string | null;
  repair_pass?: number | null;
  /** player: a consenting gameplay turn. test: harness. Absent on older rows. */
  example_source?: 'player' | 'test' | null;
};

export type TrainLogRecordInput = {
  job?: TrainLogJob | null;
  system?: string | null;
  user?: string | null;
  messages?: TrainLogMessage[] | null;
  assistant: string;
  teacher_model?: string | null;
  provider?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  tokens_cached?: number | null;
  cost?: number | null;
  latency_ms?: number | null;
  finish_reason?: string | null;
  truncated?: boolean | null;
  engine_facts?: TrainLogEngineFacts | null;
  engine_facts_provenance?: EngineFactsProvenance | null;
  judge_scores?: TrainLogJudgeScores | null;
  parent_id?: string | null;
  draft?: string | null;
  flagged_error?: string | null;
  correct_fact?: string | null;
  repaired_reply?: string | null;
  repair_pass?: number | null;
  /** Optional overrides (else session context). */
  lap_id?: string | null;
  run_id?: string | null;
  save_id?: string | null;
  turn_no?: number | null;
  mode?: string | null;
  genre?: string | null;
  build_stamp?: string | null;
  example_source?: 'player' | 'test' | null;
};

export type TrainLogSession = {
  lap_id?: string | null;
  run_id?: string | null;
  save_id?: string | null;
  turn_no?: number | null;
  mode?: string | null;
  genre?: string | null;
  build_stamp?: string | null;
  /**
   * ONE on/off for browser/server ai_traffic payload.label='model_call'.
   * Default OFF — real players' messages are personal data (John has not approved storing them).
   * Autoplay / tester harness sets this true for that session only.
   */
  aiTrafficEnabled?: boolean;
  /** Absolute path to `<run>/calls.jsonl` (Node autoplay only). */
  callsPath?: string | null;
};

type FileAppendFn = (path: string, line: string) => void;
type AiTrafficFn = (row: TrainLogRow) => void;

let session: TrainLogSession = {};
let fileAppend: FileAppendFn | null = null;
let aiTrafficSink: AiTrafficFn | null = null;
/** In-memory ring for tests + crash-safe merge of judge scores. */
const rows: TrainLogRow[] = [];
/** Last writer row id keyed by `${run_id ?? ''}:${turn_no ?? ''}` for repair parent_id / judge merge. */
const lastWriterByTurn = new Map<string, string>();

/** Call-site job stack (single-threaded; withTrainLogJob push/pop). Untagged when empty. */
type PendingCallMeta = {
  job: TrainLogJob;
  engine_facts?: TrainLogEngineFacts | null;
  engine_facts_provenance?: EngineFactsProvenance | null;
  parent_id?: string | null;
  draft?: string | null;
  flagged_error?: string | null;
  correct_fact?: string | null;
  repaired_reply?: string | null;
  repair_pass?: number | null;
};
const jobStack: PendingCallMeta[] = [];

export function pushTrainLogJob(job: TrainLogJob, extra?: Omit<PendingCallMeta, 'job'>): void {
  jobStack.push({ job: normalizeJob(job), ...extra });
}

export function popTrainLogJob(): void {
  jobStack.pop();
}

export function currentTrainLogJob(): TrainLogJob {
  return jobStack.length ? jobStack[jobStack.length - 1]!.job : 'untagged';
}

export function currentTrainLogMeta(): PendingCallMeta | null {
  return jobStack.length ? jobStack[jobStack.length - 1]! : null;
}

/** Run `fn` with a required job tag so the chat-body recorder never emits untagged for that call. */
export async function withTrainLogJob<T>(
  job: TrainLogJob,
  fn: () => Promise<T>,
  extra?: Omit<PendingCallMeta, 'job'>
): Promise<T> {
  pushTrainLogJob(job, extra);
  try {
    return await fn();
  } finally {
    popTrainLogJob();
  }
}

const JOBS: ReadonlySet<string> = new Set([
  'writer',
  'repair',
  'rewrite',
  'interpret',
  'chip_gapfill',
  'judge',
  'check',
  'untagged',
]);

/** Extra meta for a repair/rewrite so parent_id is THIS turn's writer (never a stale cross-turn id). */
export function repairParentExtra(
  extra?: Omit<PendingCallMeta, 'job' | 'parent_id'>
): Omit<PendingCallMeta, 'job'> {
  return {
    ...extra,
    parent_id: lastWriterRowId() ?? null,
  };
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `tl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function turnKey(runId: string | null | undefined, turnNo: number | null | undefined): string {
  return `${runId ?? ''}:${turnNo ?? ''}`;
}

function normalizeJob(job: TrainLogJob | null | undefined): TrainLogJob {
  if (job && JOBS.has(job) && job !== 'untagged') return job;
  if (job === 'untagged') return 'untagged';
  return 'untagged';
}

function buildMessages(input: TrainLogRecordInput): TrainLogMessage[] {
  if (Array.isArray(input.messages) && input.messages.length) {
    const base = input.messages
      .filter((m) => m && typeof m.content === 'string')
      .map((m) => ({ role: String(m.role || 'user'), content: String(m.content ?? '') }));
    const last = base[base.length - 1];
    if (last?.role === 'assistant') return base;
    return [...base, { role: 'assistant', content: String(input.assistant ?? '') }];
  }
  const out: TrainLogMessage[] = [];
  if (typeof input.system === 'string') out.push({ role: 'system', content: input.system });
  if (typeof input.user === 'string') out.push({ role: 'user', content: input.user });
  out.push({ role: 'assistant', content: String(input.assistant ?? '') });
  return out;
}

/**
 * Build engine_facts from state already in hand (no new game-rule computation).
 * Missing values are null / empty — never invented. Loose state shape so edge sync
 * does not need the full GameState module graph.
 */
export function engineFactsFromState(state: unknown): TrainLogEngineFacts | null {
  if (!state || typeof state !== 'object') return null;
  const s = state as {
    sceneFacts?: { present?: unknown[]; location?: string };
    inventory?: Array<{ name?: string; id?: string }>;
    offeredChoices?: unknown[];
    lastCheckResult?: {
      label?: string;
      total?: number;
      kept?: number;
      dc?: number;
      outcome?: string;
      spec?: { skill?: string; ability?: string };
    };
    quests?: Array<{ id?: string; status?: string }>;
    character?: { hp?: number; maxHp?: number; stats?: { hp?: number; maxHp?: number } };
    currentLocation?: string;
  };
  const present = Array.isArray(s.sceneFacts?.present) ? s.sceneFacts!.present! : [];
  const npcs = present
    .map((p) => {
      if (typeof p === 'string') return { id: null, name: p };
      if (p && typeof p === 'object') {
        const rec = p as { id?: unknown; name?: unknown; label?: unknown };
        const name = String(rec.name ?? rec.label ?? '').trim();
        if (!name) return null;
        return { id: typeof rec.id === 'string' ? rec.id : null, name };
      }
      return null;
    })
    .filter((x): x is { id: string | null; name: string } => !!x);

  const inventory = (s.inventory ?? [])
    .map((it) => (typeof it?.name === 'string' ? it.name : typeof it?.id === 'string' ? it.id : ''))
    .filter(Boolean);

  const options = Array.isArray(s.offeredChoices)
    ? s.offeredChoices.map((c) => String(c ?? '').trim()).filter(Boolean)
    : [];

  const check = s.lastCheckResult;
  const dice = check
    ? {
        check: check.label || check.spec?.skill || check.spec?.ability || null,
        roll: typeof check.total === 'number' ? check.total : typeof check.kept === 'number' ? check.kept : null,
        dc: typeof check.dc === 'number' ? check.dc : null,
        result: check.outcome ?? null,
      }
    : null;

  const quest_flags = (s.quests ?? [])
    .map((q) => {
      const id = typeof q?.id === 'string' ? q.id : '';
      const status = typeof q?.status === 'string' ? q.status : '';
      return id ? `${id}:${status || 'unknown'}` : '';
    })
    .filter(Boolean);

  const ch = s.character;
  const hpCur =
    typeof ch?.hp === 'number' ? ch.hp : typeof ch?.stats?.hp === 'number' ? ch.stats.hp : null;
  const hpMax =
    typeof ch?.maxHp === 'number' ? ch.maxHp : typeof ch?.stats?.maxHp === 'number' ? ch.stats.maxHp : null;

  const loc =
    (typeof s.currentLocation === 'string' && s.currentLocation.trim()) ||
    (typeof s.sceneFacts?.location === 'string' && s.sceneFacts.location.trim()) ||
    null;

  return {
    location: loc,
    npcs,
    hp: { current: hpCur, max: hpMax },
    inventory,
    options,
    dice,
    quest_flags,
  };
}

/**
 * The engine facts for this turn's writer, repair, and train row.
 * Taken once, when the packet is frozen. Later HP, XP, or present changes do not rewrite it.
 */
export function captureTurnEngineFacts(state: unknown): TrainLogEngineFacts | null {
  const facts = engineFactsFromState(state);
  if (!facts) return null;
  return structuredClone(facts);
}

/**
 * Packet facts win when the caller sent them.
 * A missing payload is the state on this request, labeled request_state — not a packet freeze.
 * A payload that is not facts is absent. Mutable state is not copied in to fill the gap.
 */
export function engineFactsForTrainRow(
  sent: unknown,
  state: unknown
): { engine_facts: TrainLogEngineFacts | null; engine_facts_provenance: EngineFactsProvenance } {
  if (sent == null) {
    return { engine_facts: engineFactsFromState(state), engine_facts_provenance: 'request_state' };
  }
  if (typeof sent === 'object' && !Array.isArray(sent)) {
    const facts = sent as TrainLogEngineFacts;
    if (
      facts.hp &&
      typeof facts.hp === 'object' &&
      !Array.isArray(facts.hp) &&
      Array.isArray(facts.npcs)
    ) {
      return { engine_facts: facts, engine_facts_provenance: 'packet' };
    }
  }
  return { engine_facts: null, engine_facts_provenance: 'absent' };
}

export function setTrainLogSession(next: Partial<TrainLogSession>): void {
  session = { ...session, ...next };
}

export function getTrainLogSession(): TrainLogSession {
  return { ...session };
}

export function clearTrainLogSession(): void {
  session = {};
  rows.length = 0;
  lastWriterByTurn.clear();
}

/** Node autoplay installs `fs.appendFileSync` (or equivalent). Browser leaves this null. */
export function setTrainLogFileAppend(fn: FileAppendFn | null): void {
  fileAppend = fn;
}

/** Optional ai_traffic bridge (only when session.aiTrafficEnabled). */
export function setTrainLogAiTrafficSink(fn: AiTrafficFn | null): void {
  aiTrafficSink = fn;
}

export function peekTrainLogRows(): readonly TrainLogRow[] {
  return rows;
}

export function drainTrainLogRows(): TrainLogRow[] {
  return rows.splice(0, rows.length);
}

/** Find the writer row id for a turn (repair parent_id / judge merge). */
export function lastWriterRowId(runId?: string | null, turnNo?: number | null): string | null {
  return lastWriterByTurn.get(turnKey(runId ?? session.run_id, turnNo ?? session.turn_no)) ?? null;
}

function appendLine(row: TrainLogRow): void {
  const path = session.callsPath;
  if (!path || !fileAppend) return;
  fileAppend(path, `${JSON.stringify(row)}\n`);
}

function maybeAiTraffic(row: TrainLogRow): void {
  // ONE setting: session.aiTrafficEnabled (default false). Real players stay OFF.
  // Caller installs the sink via setTrainLogAiTrafficSink (browser/tester only).
  if (!session.aiTrafficEnabled || !aiTrafficSink) return;
  aiTrafficSink(row);
}

/**
 * Emit one training row for a completed model call.
 * Never throws — disk / traffic failures are swallowed (test K).
 */
export function recordModelCall(input: TrainLogRecordInput): TrainLogRow | null {
  try {
    const job = normalizeJob(input.job);
    const run_id = input.run_id ?? session.run_id ?? null;
    const turn_no = input.turn_no ?? session.turn_no ?? null;
    const finish = input.finish_reason ?? null;
    const truncated =
      typeof input.truncated === 'boolean' ? input.truncated : isCutOffFinish(finish);

    const row: TrainLogRow = {
      id: newId(),
      created_at: new Date().toISOString(),
      job,
      messages: buildMessages(input),
      teacher_model: input.teacher_model ?? null,
      provider: input.provider ?? null,
      tokens_in: input.tokens_in ?? null,
      tokens_out: input.tokens_out ?? null,
      tokens_cached: input.tokens_cached ?? null,
      cost: input.cost ?? null,
      latency_ms: input.latency_ms ?? null,
      finish_reason: finish,
      truncated,
      lap_id: input.lap_id ?? session.lap_id ?? null,
      run_id,
      save_id: input.save_id ?? session.save_id ?? null,
      turn_no,
      mode: input.mode ?? session.mode ?? null,
      genre: input.genre ?? session.genre ?? null,
      build_stamp: input.build_stamp ?? session.build_stamp ?? FALLBACK_BUILD_STAMP,
    };

    if (job === 'writer' || job === 'repair' || job === 'rewrite') {
      row.engine_facts = input.engine_facts ?? null;
      if (input.engine_facts_provenance) row.engine_facts_provenance = input.engine_facts_provenance;
    }
    if (input.judge_scores) row.judge_scores = input.judge_scores;
    if (input.parent_id) row.parent_id = input.parent_id;
    if (input.draft != null) row.draft = input.draft;
    if (input.flagged_error != null) row.flagged_error = input.flagged_error;
    if (input.correct_fact != null) row.correct_fact = input.correct_fact;
    if (input.repaired_reply != null) row.repaired_reply = input.repaired_reply;
    if (typeof input.repair_pass === 'number') row.repair_pass = input.repair_pass;
    if (input.example_source === 'player' || input.example_source === 'test') row.example_source = input.example_source;

    if (job === 'repair' || job === 'rewrite') {
      // Prefer the same-turn writer already recorded in THIS process.
      // Explicit parent_id: if that id is already in `rows`, it must be THIS turn's writer
      // (drop stale cross-turn ids). If not in `rows` (hosted edge isolate — writer lives on the
      // client), trust trainParentId from the client. Never invent a parent.
      const sameTurnWriter = lastWriterRowId(run_id, turn_no);
      if (sameTurnWriter) {
        row.parent_id = sameTurnWriter;
      } else if (input.parent_id) {
        const parent = rows.find((r) => r.id === input.parent_id);
        if (!parent) {
          row.parent_id = input.parent_id; // edge: writer not local
        } else if (
          parent.job === 'writer' &&
          parent.run_id === run_id &&
          parent.turn_no === turn_no
        ) {
          row.parent_id = input.parent_id;
        } else {
          row.parent_id = null; // reported missing — stale parent rejected
        }
      } else {
        row.parent_id = null;
      }
    }
    if (job === 'repair') {
      // Assistant content is the repaired reply when the caller did not set it explicitly.
      if (row.repaired_reply == null) row.repaired_reply = String(input.assistant ?? '');
    }

    rows.push(row);
    if (job === 'writer') lastWriterByTurn.set(turnKey(run_id, turn_no), row.id);

    appendLine(row);
    maybeAiTraffic(row);
    return row;
  } catch {
    return null;
  }
}

/** Append rows returned by gm-turn `callLog` (hosted Free path). Same file owner as client rows. */
export function appendTrainLogRows(incoming: unknown): TrainLogRow[] {
  const out: TrainLogRow[] = [];
  if (!Array.isArray(incoming)) return out;
  for (const raw of incoming) {
    if (!raw || typeof raw !== 'object') continue;
    try {
      const r = raw as Partial<TrainLogRow>;
      const row: TrainLogRow = {
        id: typeof r.id === 'string' ? r.id : newId(),
        created_at: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
        job: normalizeJob(r.job as TrainLogJob),
        messages: Array.isArray(r.messages)
          ? r.messages.map((m) => ({
              role: String((m as TrainLogMessage)?.role ?? 'user'),
              content: String((m as TrainLogMessage)?.content ?? ''),
            }))
          : [],
        teacher_model: r.teacher_model ?? null,
        provider: r.provider ?? null,
        tokens_in: typeof r.tokens_in === 'number' ? r.tokens_in : null,
        tokens_out: typeof r.tokens_out === 'number' ? r.tokens_out : null,
        tokens_cached: typeof r.tokens_cached === 'number' ? r.tokens_cached : null,
        cost: typeof r.cost === 'number' ? r.cost : null,
        latency_ms: typeof r.latency_ms === 'number' ? r.latency_ms : null,
        finish_reason: r.finish_reason ?? null,
        truncated: !!r.truncated,
        lap_id: r.lap_id ?? session.lap_id ?? null,
        run_id: r.run_id ?? session.run_id ?? null,
        save_id: r.save_id ?? session.save_id ?? null,
        turn_no: typeof r.turn_no === 'number' ? r.turn_no : session.turn_no ?? null,
        mode: r.mode ?? session.mode ?? null,
        genre: r.genre ?? session.genre ?? null,
        build_stamp: r.build_stamp ?? session.build_stamp ?? FALLBACK_BUILD_STAMP,
        ...(r.engine_facts ? { engine_facts: r.engine_facts } : {}),
        ...(r.engine_facts_provenance === 'packet' ||
        r.engine_facts_provenance === 'request_state' ||
        r.engine_facts_provenance === 'absent'
          ? { engine_facts_provenance: r.engine_facts_provenance }
          : {}),
        ...(r.judge_scores ? { judge_scores: r.judge_scores } : {}),
        ...(r.parent_id ? { parent_id: r.parent_id } : {}),
        ...(r.draft != null ? { draft: r.draft } : {}),
        ...(r.flagged_error != null ? { flagged_error: r.flagged_error } : {}),
        ...(r.correct_fact != null ? { correct_fact: r.correct_fact } : {}),
        ...(r.repaired_reply != null ? { repaired_reply: r.repaired_reply } : {}),
        ...(typeof r.repair_pass === 'number' ? { repair_pass: r.repair_pass } : {}),
      };
      // Hosted callLog: repair/rewrite parent must be THIS turn's writer already on the client
      // (edge isolates do not share lastWriterByTurn across HTTP requests).
      if (row.job === 'writer') lastWriterByTurn.set(turnKey(row.run_id, row.turn_no), row.id);
      if (row.job === 'repair' || row.job === 'rewrite') {
        const sameTurnWriter = lastWriterRowId(row.run_id, row.turn_no);
        row.parent_id = sameTurnWriter; // null when no same-turn writer — never keep a stale edge id
      }
      rows.push(row);
      appendLine(row);
      maybeAiTraffic(row);
      out.push(row);
    } catch {
      /* keep going */
    }
  }
  return out;
}

/**
 * Merge judge_scores onto the judged writer row (same calls.jsonl).
 * Also used when autoThumbs finishes a batch — owner: autoThumbs after the judge call row.
 */
export function mergeJudgeScoresOntoWriter(
  writerRowId: string | null | undefined,
  scores: TrainLogJudgeScores
): TrainLogRow | null {
  try {
    if (!writerRowId || !scores || typeof scores !== 'object') return null;
    const idx = [...rows].map((r, i) => (r.id === writerRowId ? i : -1)).filter((i) => i >= 0).pop();
    if (idx == null || idx < 0) return null;
    const updated: TrainLogRow = {
      ...rows[idx]!,
      judge_scores: { ...(rows[idx]!.judge_scores ?? {}), ...scores },
    };
    rows[idx] = updated;
    // Append an updated snapshot line so the file alone reconstructs scores (last writer id wins for readers).
    appendLine({ ...updated, id: updated.id });
    return updated;
  } catch {
    return null;
  }
}

/** Truncation helper shared with openRouterChat finish reasons. */
export function trainLogTruncated(finishReason: unknown): boolean {
  return isCutOffFinish(finishReason);
}
