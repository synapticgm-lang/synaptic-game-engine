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
  consent?: unknown;
  consentRef?: unknown;
  historical?: unknown;
  /** Served id recorded on this turn. Not the run's requested model. */
  teacherModel?: string | null;
  servedIdDisagrees?: boolean;
  /** Licence flag already stored on the row. Never admission. */
  storedTrainingOk?: boolean | 'pending' | null;
  buildStamp?: string | null;
  mode?: string | null;
  excludedSourceId?: string | null;
  wellbeingFlagged?: boolean;
  hasFacts?: boolean;
  /** False when this turn has no fact-check row. */
  factcheckRow?: boolean;
  factFlags?: number;
  turnP0?: number;
  prose?: string | null;
  truncated?: boolean;
  finishReason?: string | null;
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
 * Eligible rows are candidates only. Approved is never returned.
 * The default allowlist is VERIFIED_TRAINING_MODEL_IDS, which is empty.
 * Pass a set only from an isolated test fixture.
 */
export function trainingImportDecision(
  row: TrainingImportRow,
  verifiedIds: ReadonlySet<string> = VERIFIED_TRAINING_MODEL_IDS,
): AdmissionDecision {
  const excluded = excludedSourceReason(
    typeof row.excludedSourceId === 'string' ? row.excludedSourceId : null,
  );
  if (excluded) return { status: 'rejected', reasons: [excluded], gameplay: false };
  if (row.wellbeingFlagged) return { status: 'rejected', reasons: [WELLBEING_NOTE], gameplay: false };

  const source = row.example_source;
  if (source !== 'player' && source !== 'test') {
    const reasons = ['missing source'];
    if (row.storedTrainingOk === true) reasons.push('stored training_ok is not consent');
    return { status: 'audit', reasons, gameplay: false };
  }
  if (row.historical === true) {
    return { status: 'audit', reasons: ['historical row kept for review, not admitted'], gameplay: true };
  }
  if (row.mode === 'pyoa') return { status: 'rejected', reasons: ['PYOA is not a training mode'], gameplay: false };
  if (source === 'player' && !consentMatches(row.consent, row.consentRef)) {
    return { status: 'rejected', reasons: ['player turn has no matching consent'], gameplay: false };
  }
  if (!realBuildStamp(row.buildStamp)) {
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
  return { status: 'candidate', reasons: [], gameplay: true };
}

/** Candidate rows may be exported for a later human review. Nothing else is eligible, including approved. */
export function trainingImportSink(status: AdmissionStatus): 'eligible' | 'audit' {
  return status === 'candidate' ? 'eligible' : 'audit';
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Read one autoplay or call-log shaped turn. Does not invent a source, a consent, or a served id. */
export function trainingImportFields(input: {
  turn: Record<string, unknown>;
  buildStamp?: unknown;
  mode?: unknown;
  excludedSourceId?: unknown;
  factcheckRow?: unknown;
}): TrainingImportRow {
  const turn = input.turn;
  const usage = turn.writerUsage;
  const usageModel = usage && typeof usage === 'object'
    ? text((usage as { modelId?: unknown }).modelId)
    : '';
  const teacher = text(turn.teacher_model);
  const checks = turn.turnCheck;
  const p0 = checks && typeof checks === 'object' && Array.isArray((checks as { p0?: unknown }).p0)
    ? (checks as { p0: unknown[] }).p0.length
    : 0;
  const flags = input.factcheckRow && typeof input.factcheckRow === 'object' && Array.isArray((input.factcheckRow as { flags?: unknown }).flags)
    ? (input.factcheckRow as { flags: unknown[] }).flags.length
    : 0;
  const facts = turn.engine_facts;
  const engineFact = text(turn.engineFact);
  const stored = turn.training_ok;
  return {
    example_source: turn.example_source,
    consent: turn.consent,
    consentRef: turn.consentRef,
    historical: turn.historical === true,
    teacherModel: teacher && usageModel && teacher !== usageModel ? null : (teacher || usageModel || null),
    servedIdDisagrees: !!(teacher && usageModel && teacher !== usageModel),
    storedTrainingOk: stored === true || stored === false || stored === 'pending' ? stored : null,
    buildStamp: text(input.buildStamp) || text(turn.build_stamp) || text(turn.buildStamp) || null,
    mode: text(input.mode) || text(turn.mode) || text(turn.engineMode) || null,
    excludedSourceId: text(input.excludedSourceId) || null,
    wellbeingFlagged: turn.training_note === WELLBEING_NOTE,
    hasFacts: (!!facts && typeof facts === 'object') || engineFact.length > 0,
    factcheckRow: input.factcheckRow != null,
    factFlags: flags,
    turnP0: p0,
    prose: typeof turn.gmText === 'string' ? turn.gmText : typeof turn.prose === 'string' ? turn.prose : '',
    truncated: turn.truncated === true,
    finishReason: text(turn.finish_reason) || null,
  };
}
