/**
 * Local admission check for a player-turn training set.
 * Other players stay opted out. John's request is not their consent.
 * Recording uses the existing trainLog. A stored row is not an approved example.
 */
import {
  OPENROUTER_DEEPSEEK_V41_FLASH,
  OPENROUTER_GLM_53_FLASH,
} from './modelIds';
import {
  peekTrainLogRows,
  recordModelCall,
  type TrainLogRecordInput,
  type TrainLogRow,
} from './trainLog';
export const PLAYER_TURN_SCHEMA = 'player-turn-admission/1';

/** Live capture of other players. Stays false until a separate enable decision. */
export const PLAYER_CAPTURE_ENABLED = false;

export const GOAL_APPROVED_TURNS_PER_MODE = 2500;
export const TEST_SELECTION_CAP = 0.15;
export const MIN_WORLDS_FOR_STRICT_CAP = 7;

/** Display names are not served model ids and are not a licence. */
export const UNVERIFIED_MODEL_ALIASES = ['DS4.1Flash', 'GLM5.3Flash'] as const;

/**
 * Actual served ids whose training licence has been checked.
 * Empty on purpose: nothing here has been verified, so nothing is admitted on the model gate.
 */
export const VERIFIED_TRAINING_MODEL_IDS: ReadonlySet<string> = new Set();

export const ADMISSION_NOT_WIRED = [
  'No settings control is mounted, so a normal session stays opted out.',
  'There is no other-player consent screen. A feature request is not that consent.',
  'DS4.1Flash and GLM5.3Flash have no verified served id or training licence here, so they stay in quarantine.',
  'Deleting a local row does not untrain a weight that was already trained.',
  'The 2500-turn goal is not filled by generating turns.',
  'Historical Cursed Keep, Salt Road Heist, and legacy rows are kept for audit and are not admitted until a review marks them.',
] as const;

export type TurnSource = 'player' | 'test';
export type TurnResolution = 'action' | 'intention' | 'rejection' | 'noop';
export type AdmissionStatus = 'audit' | 'candidate' | 'quarantine' | 'rejected' | 'approved';

export type ConsentRecord = {
  ref: string;
  subject: 'this-player';
  commercialTraining: true;
  retentionExplained: true;
  deleteExplained: true;
  accessExplained: true;
};

export type LinkedCall = {
  id: string;
  parentId: string | null;
  job: string;
  messages: Array<{ role: string; content: string }>;
  provider: string | null;
  model: string | null;
  settings: string | null;
  response: string | null;
  finish: string | null;
  error: string | null;
  truncated: boolean;
  /** Present only when the provider actually returned the figure. */
  usage?: { tokensIn?: number; tokensOut?: number; cost?: number } | null;
};

export type PlayerTurnCapture = {
  rootId: string;
  source: TurnSource;
  mode: string;
  world: string;
  timestamp: string;
  buildStamp: string;
  promptVersion: string;
  schemaVersion: string;
  consentRef: string | null;
  inputText: string;
  buttonId?: string | null;
  resolution: TurnResolution;
  facts: string;
  before: string;
  after: string;
  delivered: string;
  calls: LinkedCall[];
  draft: boolean;
  /** Repair, check, rewrite, judge, or any non-root helper. */
  helper: boolean;
  simulator: boolean;
  /** Older campaign row kept for provenance. Not admitted by age alone. */
  historical: boolean;
};

export type AdmissionDecision = {
  status: AdmissionStatus;
  reasons: string[];
  /** Gameplay root, not a helper and not a draft. */
  gameplay: boolean;
};

export type Redaction = {
  text: string;
  transforms: Array<{ field: string; fromHash: string; token: string }>;
};

const SECRET = /\b(?:sk-[A-Za-z0-9]{8,}|Bearer\s+\S+|api[_-]?key\s*[:=]\s*\S+)\b/i;
const PRIVATE_THOUGHT = /<\s*think\b|chain of thought/i;

function fnv(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}

export function featureRequestIsNotConsent(_note: string): ConsentRecord | null {
  return null;
}

/** Served ids the 2 Nov corpus already treats as the two allowed writers. Aliases are not ids. */
export const CORPUS_WRITER_IDS: ReadonlySet<string> = new Set([
  OPENROUTER_DEEPSEEK_V41_FLASH,
  OPENROUTER_GLM_53_FLASH,
]);

export function modelGate(model: string | null | undefined): 'ok' | 'quarantine' {
  const id = (model ?? '').trim();
  if (CORPUS_WRITER_IDS.has(id) || VERIFIED_TRAINING_MODEL_IDS.has(id)) return 'ok';
  return 'quarantine';
}

export const FULL_PAYLOAD_EXPLANATION =
  'Opting in stores this device\'s gameplay turns: the system prompt, what you typed or which button you pressed, the model reply, the served model id, and the engine facts. Those rows can be used as commercial training examples. You can turn this off, and later rows stop. Emails, account ids, and API keys are not kept. This does not delete a row already stored, and it does not untrain a weight.';

export type PlayerTrainingPreference = {
  optedIn: boolean;
  consentRef: string | null;
  explainedFullPayload: boolean;
  revokedAt: string | null;
};

export const DEFAULT_PLAYER_TRAINING_PREFERENCE: PlayerTrainingPreference = {
  optedIn: false,
  consentRef: null,
  explainedFullPayload: false,
  revokedAt: null,
};

let activePreference: PlayerTrainingPreference = { ...DEFAULT_PLAYER_TRAINING_PREFERENCE };

export function getPlayerTrainingPreference(): PlayerTrainingPreference {
  return { ...activePreference };
}

export function setPlayerTrainingPreference(next: PlayerTrainingPreference | null): void {
  activePreference = next ? { ...next } : { ...DEFAULT_PLAYER_TRAINING_PREFERENCE };
}

export function grantPlayerTrainingOptIn(
  now: string,
  ack: { commercial: boolean; retention: boolean; withdraw: boolean; fullPayload: boolean }
): PlayerTrainingPreference | null {
  if (!ack.commercial || !ack.retention || !ack.withdraw || !ack.fullPayload) return null;
  const pref: PlayerTrainingPreference = {
    optedIn: true,
    consentRef: `consent_${fnv(now)}`,
    explainedFullPayload: true,
    revokedAt: null,
  };
  return pref;
}

export function revokePlayerTrainingOptIn(prev: PlayerTrainingPreference, now: string): PlayerTrainingPreference {
  return { ...prev, optedIn: false, revokedAt: now };
}

export function playerTrainingCaptureAllowed(pref: PlayerTrainingPreference | null | undefined): boolean {
  if (!pref?.optedIn || !pref.explainedFullPayload || !pref.consentRef) return false;
  if (pref.revokedAt) return false;
  return true;
}

/** Lab sessions keep their existing flag. A real player is included only by their own opt-in. */
export function shouldRequestTrainLog(args: {
  labSession: boolean;
  preference?: PlayerTrainingPreference | null;
}): boolean {
  if (args.labSession) return true;
  return playerTrainingCaptureAllowed(args.preference);
}

function blob(turn: PlayerTurnCapture): string {
  const calls = turn.calls.map((c) => `${c.id}\n${c.response ?? ''}\n${c.messages.map((m) => m.content).join('\n')}`).join('\n');
  return [turn.inputText, turn.facts, turn.before, turn.after, turn.delivered, calls].join('\n');
}

export function pseudonymise(turn: PlayerTurnCapture, names: readonly string[]): { turn: PlayerTurnCapture; redaction: Redaction } {
  const transforms: Redaction['transforms'] = [];
  const apply = (field: string, text: string): string => {
    let next = text;
    for (const name of names) {
      const raw = name.trim();
      if (raw.length < 2 || !next.includes(raw)) continue;
      const token = `person_${fnv(raw)}`;
      if (!transforms.some((t) => t.field === field && t.fromHash === fnv(raw))) {
        transforms.push({ field, fromHash: fnv(raw), token });
      }
      next = next.split(raw).join(token);
    }
    return next;
  };
  const calls = turn.calls.map((call) => ({
    ...call,
    response: call.response == null ? null : apply(`call:${call.id}:response`, call.response),
    messages: call.messages.map((m, i) => ({ ...m, content: apply(`call:${call.id}:m${i}`, m.content) })),
  }));
  const next: PlayerTurnCapture = {
    ...turn,
    inputText: apply('input', turn.inputText),
    facts: apply('facts', turn.facts),
    before: apply('before', turn.before),
    after: apply('after', turn.after),
    delivered: apply('delivered', turn.delivered),
    calls,
  };
  return { turn: next, redaction: { text: blob(next), transforms } };
}

function structuralGaps(turn: PlayerTurnCapture): string[] {
  const gaps: string[] = [];
  if (!turn.rootId.trim()) gaps.push('missing root');
  if (turn.source !== 'player' && turn.source !== 'test') gaps.push('missing source');
  if (!turn.mode.trim() || !turn.world.trim()) gaps.push('missing mode or world');
  if (!turn.timestamp.trim() || !turn.buildStamp.trim()) gaps.push('missing time or build');
  if (turn.schemaVersion !== PLAYER_TURN_SCHEMA) gaps.push('schema mismatch');
  if (!turn.promptVersion.trim()) gaps.push('missing prompt version');
  if (!turn.inputText.trim() && !turn.buttonId?.trim()) gaps.push('missing player input');
  if (!turn.resolution) gaps.push('missing resolution');
  if (!turn.facts.trim()) gaps.push('missing facts');
  if (turn.resolution === 'action' && !turn.delivered.trim()) gaps.push('unfaithful empty delivery');
  for (const call of turn.calls) {
    if (!call.id.trim() || call.parentId === undefined) gaps.push(`call ${call.id || '?'} missing link`);
    if (!call.messages.length) gaps.push(`call ${call.id} missing messages`);
  }
  return gaps;
}

export function admitTurn(
  turn: PlayerTurnCapture,
  consent: ConsentRecord | null,
  seenRootIds: ReadonlySet<string> = new Set()
): AdmissionDecision {
  const reasons: string[] = [];
  const gameplay = !turn.helper && !turn.simulator && !turn.draft;
  if (SECRET.test(blob(turn)) || PRIVATE_THOUGHT.test(blob(turn))) {
    return { status: 'rejected', reasons: ['secret or private reasoning'], gameplay: false };
  }
  reasons.push(...structuralGaps(turn));
  if (reasons.length) return { status: 'rejected', reasons, gameplay: false };
  if (seenRootIds.has(turn.rootId)) return { status: 'rejected', reasons: ['duplicate root'], gameplay: false };
  if (turn.historical) return { status: 'audit', reasons: ['historical row kept for review, not admitted'], gameplay };
  if (turn.mode === 'pyoa') return { status: 'rejected', reasons: ['PYOA is not a training mode'], gameplay: false };
  if (turn.source === 'player') {
    const ok = !!consent
      && consent.subject === 'this-player'
      && consent.commercialTraining
      && consent.retentionExplained
      && consent.deleteExplained
      && consent.accessExplained
      && consent.ref === turn.consentRef;
    if (!ok) return { status: 'rejected', reasons: ['player turn has no matching consent'], gameplay: false };
  }
  const models = turn.calls.map((c) => c.model);
  if (models.some((m) => modelGate(m) === 'quarantine')) {
    return {
      status: 'quarantine',
      reasons: ['served model has no verified training licence', ...(!gameplay ? ['not a gameplay total'] : [])],
      gameplay,
    };
  }
  if (turn.draft || turn.helper || turn.simulator) {
    return { status: 'candidate', reasons: ['not a gameplay total'], gameplay: false };
  }
  return { status: 'candidate', reasons: [], gameplay: true };
}

export function approveBatch(rootIds: readonly string[], reviewer: string): { approved: string[]; refused: string } | { approved: []; refused: string } {
  const name = reviewer.trim();
  if (!name || name.toLowerCase() === 'auto') return { approved: [], refused: 'a person must approve; auto is not approval' };
  return { approved: [...new Set(rootIds.filter((id) => id.trim()))], refused: '' };
}

export type SelectionRow = { rootId: string; source: TurnSource; mode: string; world: string; status: AdmissionStatus; gameplay: boolean };

/** Strict 15% applies to selected test rows only. Player rows are not dropped to make the ratio. */
export function selectTrainingRows(rows: readonly SelectionRow[]): {
  selected: SelectionRow[];
  retained: SelectionRow[];
  strict: boolean;
  reason: string;
} {
  const pool = rows.filter((r) => r.status === 'candidate' && r.gameplay && r.mode !== 'pyoa');
  const worlds = new Set(pool.map((r) => r.world));
  if (worlds.size < MIN_WORLDS_FOR_STRICT_CAP) {
    return { selected: [], retained: [...rows], strict: false, reason: `need ${MIN_WORLDS_FOR_STRICT_CAP} worlds before the test cap` };
  }
  const players = pool.filter((r) => r.source === 'player');
  const tests = pool.filter((r) => r.source === 'test');
  const room = Math.floor((players.length * TEST_SELECTION_CAP) / (1 - TEST_SELECTION_CAP));
  const pickedTests = tests.slice(0, Math.max(0, room));
  const selected = [...players, ...pickedTests];
  const selectedIds = new Set(selected.map((r) => r.rootId));
  return {
    selected,
    retained: rows.filter((r) => !selectedIds.has(r.rootId)),
    strict: true,
    reason: players.length ? 'test contribution capped at 15% of the selection' : 'no player rows, so test rows are not used to fill the goal',
  };
}

export function tally(rows: readonly SelectionRow[], approvedIds: ReadonlySet<string>) {
  const byMode: Record<string, { candidate: number; approved: number }> = {};
  let candidate = 0;
  let approved = 0;
  let quarantine = 0;
  for (const row of rows) {
    if (row.status === 'quarantine') quarantine += 1;
    if (row.status === 'candidate' && row.gameplay) {
      candidate += 1;
      const slot = byMode[row.mode] ?? { candidate: 0, approved: 0 };
      slot.candidate += 1;
      if (approvedIds.has(row.rootId)) {
        approved += 1;
        slot.approved += 1;
      }
      byMode[row.mode] = slot;
    }
  }
  return { candidate, approved, quarantine, byMode, goal: GOAL_APPROVED_TURNS_PER_MODE };
}

/** Stable session holdout. Does not create turns. */
export function sessionSplit(sessionId: string): 'train' | 'eval' {
  const n = Number.parseInt(fnv(sessionId).slice(0, 2), 16);
  return n % 5 === 0 ? 'eval' : 'train';
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function scrubText(text: string, accountIds: readonly string[]): string | null {
  if (SECRET.test(text) || PRIVATE_THOUGHT.test(text)) return null;
  let next = text.replace(EMAIL, '[redacted-email]');
  for (const id of accountIds) {
    const raw = id.trim();
    if (raw.length >= 8) next = next.split(raw).join('[redacted-account]');
  }
  return next;
}

/** One consenting gameplay call through the existing logger. Off, or a bad row, stores nothing. */
export function recordConsentingPlayerCall(
  pref: PlayerTrainingPreference | null,
  input: TrainLogRecordInput & { accountIds?: string[] }
): TrainLogRow | null {
  if (!playerTrainingCaptureAllowed(pref)) return null;
  const model = (input.teacher_model ?? '').trim();
  if (!CORPUS_WRITER_IDS.has(model)) return null;
  if (!input.build_stamp?.trim() || !input.engine_facts) return null;
  if (input.truncated) return null;
  if (/^(?:length|max_tokens|error|content_filter)$/i.test(input.finish_reason ?? '')) return null;
  const job = input.job ?? 'writer';
  if (job === 'writer' && peekTrainLogRows().some((r) => r.job === 'writer' && r.run_id === (input.run_id ?? null) && r.turn_no === (input.turn_no ?? null))) {
    return null;
  }
  const accountIds = input.accountIds ?? [];
  const system = input.system == null ? null : scrubText(input.system, accountIds);
  const user = input.user == null ? null : scrubText(input.user, accountIds);
  const assistant = scrubText(input.assistant, accountIds);
  if (system === null || user === null || assistant === null) return null;
  let messages = input.messages;
  if (Array.isArray(messages)) {
    const next = [];
    for (const message of messages) {
      const content = scrubText(message.content, accountIds);
      if (content === null) return null;
      next.push({ ...message, content });
    }
    messages = next;
  }
  const { accountIds: _accountIds, judge_scores: _judge, ...rest } = input;
  return recordModelCall({
    ...rest,
    job,
    system: system ?? undefined,
    user: user ?? undefined,
    assistant,
    messages,
    example_source: 'player',
  });
}
