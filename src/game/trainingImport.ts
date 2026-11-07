/**
 * Fail-closed gate for a training export or import.
 * A stored training_ok flag and the MIT licence table are not consent.
 * A missing example_source is not a test row and not a player row.
 * This does not delete an operational call log and does not approve a corpus.
 */
import { excludedSourceReason, modelLicence, WELLBEING_NOTE } from './modelIds.ts';
import {
  VERIFIED_TRAINING_MODEL_IDS,
  type AdmissionDecision,
  type AdmissionStatus,
  type ConsentRecord,
} from './playerTurnAdmission.ts';

export type TrainingImportRow = {
  example_source?: unknown;
  /** Turn and writer call both name a source and they are not the same. */
  sourceDisagrees?: boolean;
  consent?: unknown;
  consentRef?: unknown;
  historical?: unknown;
  /** Served id on the writer call. A turn field is not this. */
  teacherModel?: string | null;
  servedIdDisagrees?: boolean;
  /** Licence flag already stored on the row. Never admission. */
  storedTrainingOk?: boolean | 'pending' | null;
  /** build_stamp on the writer call. A run manifest is not this. */
  buildStamp?: string | null;
  buildDisagrees?: boolean;
  mode?: string | null;
  excludedSourceId?: string | null;
  wellbeingFlagged?: boolean;
  /** engine_facts object on the writer call. A prose fact string is not this. */
  hasFacts?: boolean;
  /** No writer call with an id. */
  callLinkMissing?: boolean;
  /** Writer call id present but messages are missing. */
  callMessagesMissing?: boolean;
  callId?: string | null;
  /** More than one writer call for the turn. */
  duplicateWriter?: boolean;
  /** False when this turn has no fact-check row. */
  factcheckRow?: boolean;
  factFlags?: number;
  turnP0?: number;
  prose?: string | null;
  truncated?: boolean;
  finishReason?: string | null;
  /** Provider recorded on the writer call. An id shape is not this. */
  provider?: string | null;
  /** Route recorded on the writer call. */
  route?: string | null;
  /** Restricted label seen on a message or fact. A clean tag is not a clear status. */
  contextStatus?: 'restricted' | 'unknown';
  /** Role and content only. Provenance tags are not copied here. */
  contextMessages?: TrainingContextMessage[];
  /** Engine facts as stored. Not treated as a rights grant. */
  contextFacts?: unknown;
};

const FALLBACK_BUILD_STAMP = 'trainlog';

function realBuildStamp(stamp: unknown): boolean {
  const s = String(stamp ?? '').trim();
  return s.length > 0 && s !== FALLBACK_BUILD_STAMP;
}

function consentMatches(consent: unknown, consentRef: unknown): consent is ConsentRecord {
  if (!consent || typeof consent !== 'object') return false;
  const c = consent as Partial<ConsentRecord>;
  return c.subject === 'this-player'
    && c.commercialTraining === true
    && c.retentionExplained === true
    && c.deleteExplained === true
    && c.accessExplained === true
    && typeof c.ref === 'string'
    && c.ref.length > 0
    && c.ref === consentRef;
}

/**
 * Isolated test double for output-use and context-source proof.
 * Production callers omit it. A stored row cannot supply it.
 */
export type TrainingContextMessage = { role: string; content: string };

/**
 * Isolated test double. Production callers omit it.
 * `messages` and `facts` are the only context this fixture trusts.
 * A provenance tag on the call is not proof, and this does not detect reworded text.
 */
export type TrainingRightsFixture = {
  servedModelId: string;
  provider: string;
  route: string;
  outputUse: 'verified';
  messages: readonly TrainingContextMessage[];
  facts: unknown;
};

/**
 * Eligible rows are candidates only. Approved is never returned.
 * The default allowlist is VERIFIED_TRAINING_MODEL_IDS, which is empty.
 * Pass a set only from an isolated test fixture.
 */
export function trainingImportDecision(
  row: TrainingImportRow,
  verifiedIds: ReadonlySet<string> = VERIFIED_TRAINING_MODEL_IDS,
  rights?: TrainingRightsFixture,
): AdmissionDecision {
  const excluded = excludedSourceReason(
    typeof row.excludedSourceId === 'string' ? row.excludedSourceId : null,
  );
  if (excluded) return { status: 'rejected', reasons: [excluded], gameplay: false };
  if (row.wellbeingFlagged) return { status: 'rejected', reasons: [WELLBEING_NOTE], gameplay: false };

  const source = row.example_source;
  if (row.sourceDisagrees || (source != null && source !== '' && source !== 'player' && source !== 'test')) {
    return { status: 'rejected', reasons: ['missing source'], gameplay: false };
  }
  if (source !== 'player' && source !== 'test') {
    const reasons = ['missing source'];
    if (row.storedTrainingOk === true) reasons.push('stored training_ok is not consent');
    if (row.callLinkMissing) reasons.push('call ? missing link');
    return { status: 'audit', reasons, gameplay: false };
  }
  if (row.historical === true) {
    return { status: 'audit', reasons: ['historical row kept for review, not admitted'], gameplay: true };
  }
  if (row.mode === 'pyoa') return { status: 'rejected', reasons: ['PYOA is not a training mode'], gameplay: false };
  if (source === 'player' && !consentMatches(row.consent, row.consentRef)) {
    return { status: 'rejected', reasons: ['player turn has no matching consent'], gameplay: false };
  }
  if (row.duplicateWriter) return { status: 'rejected', reasons: ['duplicate root'], gameplay: false };
  if (row.callLinkMissing) return { status: 'rejected', reasons: ['call ? missing link'], gameplay: false };
  if (row.callMessagesMissing) {
    return { status: 'rejected', reasons: [`call ${row.callId || '?'} missing messages`], gameplay: false };
  }
  if (row.buildDisagrees || !realBuildStamp(row.buildStamp)) {
    return { status: 'rejected', reasons: ['missing time or build'], gameplay: false };
  }
  if (row.servedIdDisagrees) return { status: 'rejected', reasons: ['served id disagrees'], gameplay: false };

  const model = (row.teacherModel ?? '').trim();
  if (!model || !verifiedIds.has(model) || !modelLicence(model).trainable) {
    return {
      status: 'quarantine',
      reasons: ['served model has no verified training licence'],
      gameplay: true,
    };
  }
  if (!row.hasFacts) return { status: 'rejected', reasons: ['missing facts'], gameplay: false };
  if (row.factcheckRow === false) return { status: 'rejected', reasons: ['no factcheck row'], gameplay: false };
  if ((row.factFlags ?? 0) > 0) return { status: 'rejected', reasons: ['factCheck flag'], gameplay: false };
  if ((row.turnP0 ?? 0) > 0) return { status: 'rejected', reasons: ['turnCheck P0'], gameplay: false };
  if (!String(row.prose ?? '').trim()) return { status: 'rejected', reasons: ['empty prose'], gameplay: false };
  if (row.truncated || /^(?:length|max_tokens|error|content_filter)$/i.test(row.finishReason ?? '')) {
    return { status: 'rejected', reasons: ['truncated reply'], gameplay: false };
  }
  return contextAndRouteDecision(row, model, rights);
}

const RESTRICTED_LABEL = /^(?:pyoa|gemini|gemini-apps|gemini_app|gemini-app)$/i;
function isRestrictedLabel(value: unknown): boolean {
  return RESTRICTED_LABEL.test(text(value));
}

function objectRestricted(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(objectRestricted);
  const rec = value as Record<string, unknown>;
  for (const key of ['origin', 'provenance', 'source', 'mode', 'provider', 'route']) {
    if (isRestrictedLabel(rec[key])) return true;
  }
  return Object.values(rec).some(objectRestricted);
}

function contextOf(call: Record<string, unknown>): { status: 'restricted' | 'unknown'; messages: TrainingContextMessage[] } {
  const messages = Array.isArray(call.messages) ? call.messages : [];
  const view: TrainingContextMessage[] = [];
  if (call.context_restricted === true || objectRestricted(call.engine_facts)) {
    return { status: 'restricted', messages: view };
  }
  for (const message of messages) {
    if (!message || typeof message !== 'object') return { status: 'unknown', messages: view };
    const rec = message as Record<string, unknown>;
    if (isRestrictedLabel(rec.provenance) || isRestrictedLabel(rec.source) || isRestrictedLabel(rec.origin) || isRestrictedLabel(rec.mode)) {
      return { status: 'restricted', messages: view };
    }
    view.push({ role: text(rec.role), content: text(rec.content) });
  }
  return { status: 'unknown', messages: view };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    return `{${Object.keys(rec).sort().map((key) => `${JSON.stringify(key)}:${stable(rec[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function restrictedEndpoint(provider: string, route: string): boolean {
  const blob = `${provider} ${route}`.trim().toLowerCase();
  return blob.includes('fireworks') || blob.includes('gemini.google.com/app') || /\b(?:pyoa|gemini-apps|gemini_app|gemini-app)\b/.test(blob);
}

/**
 * MIT weight labels are not output-use proof. The rights argument is an
 * isolated fixture. Production calls omit it, so this never returns candidate.
 */
function contextAndRouteDecision(
  row: TrainingImportRow,
  model: string,
  rights?: TrainingRightsFixture,
): AdmissionDecision {
  const provider = text(row.provider);
  const route = text(row.route);
  if (!provider) return { status: 'rejected', reasons: ['provider unknown'], gameplay: false };
  if (!route) return { status: 'rejected', reasons: ['route unknown'], gameplay: false };
  if (restrictedEndpoint(provider, route)) {
    return { status: 'rejected', reasons: ['restricted output route'], gameplay: false };
  }
  if (row.contextStatus === 'restricted') return { status: 'rejected', reasons: ['restricted context'], gameplay: false };
  if (!rights || rights.outputUse !== 'verified' || !sameText(rights.servedModelId, model)) {
    return { status: 'quarantine', reasons: ['output terms unverified'], gameplay: true };
  }
  if (!sameText(rights.provider, provider)) return { status: 'rejected', reasons: ['provider disagrees'], gameplay: false };
  if (!sameText(rights.route, route)) return { status: 'rejected', reasons: ['route disagrees'], gameplay: false };
  const pinned = Array.isArray(rights.messages) && rights.messages.length > 0
    && stable(rights.messages) === stable(row.contextMessages ?? [])
    && stable(rights.facts) === stable(row.contextFacts);
  if (!pinned) return { status: 'rejected', reasons: ['context lineage unpinned'], gameplay: false };
  return { status: 'candidate', reasons: [], gameplay: true };
}

/**
 * The training file is only for a row approveBatch already marked approved.
 * This module does not approve. A candidate stays out of that file.
 */
export function trainingImportSink(status: AdmissionStatus): 'eligible' | 'audit' {
  return status === 'approved' ? 'eligible' : 'audit';
}

const AUDIT_KEYS = [
  'training_ok',
  'teacher_model',
  'provider',
  'judge_model',
  'mode',
  'training_note',
  'admitted',
  'admission_status',
  'admission_reasons',
  'pairKey',
  'lap',
  'runId',
  'buildStamp',
  'seed',
  'turn',
  'bible',
  'writerId',
  'writerModel',
  'good',
  'replyMs',
  'writerCalls',
  'inputTokens',
  'outputTokens',
  'cachedTokens',
  'costUsd',
  'costSource',
  'factFlagCount',
] as const;

/** Reasons and licence flags only. Player text, prompts, and packets stay in the original run. */
export function trainingAuditRecord(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of AUDIT_KEYS) {
    if (key in row) out[key] = row[key];
  }
  const fact = row.factCheck;
  if (fact && typeof fact === 'object' && !Array.isArray(fact)) {
    const flags = (fact as { flags?: unknown }).flags;
    out.factFlagCount = Array.isArray(flags) ? flags.length : 0;
  }
  return out;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function callModel(call: Record<string, unknown>): string {
  return text(call.teacher_model) || text(call.model);
}

function callBuild(call: Record<string, unknown>): string {
  return text(call.build_stamp) || text(call.buildStamp);
}

/**
 * Read one turn plus the writer calls for that turn.
 * Served id, build stamp, source, and engine_facts come from the writer call.
 * A turn field or a run manifest does not fill a missing call field.
 */
export function trainingImportFields(input: {
  turn: Record<string, unknown>;
  calls?: ReadonlyArray<Record<string, unknown>>;
  /** Run manifest stamp. Compared with the call. Never used as the call stamp. */
  buildStamp?: unknown;
  mode?: unknown;
  excludedSourceId?: unknown;
  factcheckRow?: unknown;
}): TrainingImportRow {
  const turn = input.turn;
  const checks = turn.turnCheck;
  const p0 = checks && typeof checks === 'object' && Array.isArray((checks as { p0?: unknown }).p0)
    ? (checks as { p0: unknown[] }).p0.length
    : 0;
  const flags = input.factcheckRow && typeof input.factcheckRow === 'object' && Array.isArray((input.factcheckRow as { flags?: unknown }).flags)
    ? (input.factcheckRow as { flags: unknown[] }).flags.length
    : 0;
  const stored = turn.training_ok;
  const writers = (input.calls ?? []).filter((call) => call.job === 'writer');
  const assertedModels = [text(turn.teacher_model), text(turn.writerUsage && typeof turn.writerUsage === 'object' ? (turn.writerUsage as { modelId?: unknown }).modelId : '')].filter(Boolean);
  const assertedBuilds = [text(input.buildStamp), text(turn.build_stamp), text(turn.buildStamp)].filter(Boolean);
  const base = {
    consent: turn.consent,
    consentRef: turn.consentRef,
    historical: turn.historical === true,
    storedTrainingOk: stored === true || stored === false || stored === 'pending' ? stored : null,
    mode: text(input.mode) || text(turn.mode) || text(turn.engineMode) || null,
    excludedSourceId: text(input.excludedSourceId) || null,
    wellbeingFlagged: turn.training_note === WELLBEING_NOTE,
    factcheckRow: input.factcheckRow != null,
    factFlags: flags,
    turnP0: p0,
    prose: typeof turn.gmText === 'string' ? turn.gmText : typeof turn.prose === 'string' ? turn.prose : '',
  } satisfies Partial<TrainingImportRow>;

  if (writers.length !== 1) {
    const models = new Set([...assertedModels, ...writers.map(callModel)].filter(Boolean));
    const callSources = writers
      .map((call) => call.example_source)
      .filter((source) => source != null && source !== '');
    const uniqueSources = new Set(callSources.map((source) => String(source)));
    const turnSource = turn.example_source;
    return {
      ...base,
      example_source: uniqueSources.size === 1 ? callSources[0] : undefined,
      sourceDisagrees: uniqueSources.size > 1
        || (uniqueSources.size === 1 && turnSource != null && turnSource !== '' && turnSource !== callSources[0]),
      teacherModel: null,
      servedIdDisagrees: models.size > 1,
      buildStamp: null,
      buildDisagrees: new Set(assertedBuilds).size > 1,
      hasFacts: false,
      callLinkMissing: writers.length === 0,
      duplicateWriter: writers.length > 1,
      provider: null,
      route: null,
      contextStatus: 'unknown',
      contextMessages: [],
      contextFacts: null,
    };
  }

  const call = writers[0]!;
  const model = callModel(call);
  const build = callBuild(call);
  const callSource = call.example_source;
  const turnSource = turn.example_source;
  const sourceDisagrees = turnSource != null && turnSource !== '' && callSource != null && callSource !== '' && turnSource !== callSource;
  const modelDisagrees = assertedModels.some((id) => id !== model) || (!model && assertedModels.length > 0);
  const buildDisagrees = assertedBuilds.some((stamp) => stamp !== build);
  const messages = Array.isArray(call.messages) ? call.messages : [];
  const facts = call.engine_facts;
  const context = contextOf(call);
  return {
    ...base,
    example_source: callSource != null && callSource !== '' ? callSource : undefined,
    sourceDisagrees,
    teacherModel: model || null,
    servedIdDisagrees: modelDisagrees && assertedModels.some((id) => !model || id !== model),
    buildStamp: build || null,
    buildDisagrees,
    hasFacts: !!facts && typeof facts === 'object',
    callLinkMissing: !text(call.id),
    callMessagesMissing: messages.length === 0,
    callId: text(call.id) || null,
    truncated: call.truncated === true,
    finishReason: text(call.finish_reason) || text(call.finish) || null,
    provider: text(call.provider) || null,
    route: text(call.route) || null,
    contextStatus: context.status,
    contextMessages: context.messages,
    contextFacts: facts && typeof facts === 'object' ? facts : null,
  };
}
