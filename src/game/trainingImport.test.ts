import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { OPENROUTER_DEEPSEEK_V41_FLASH, WELLBEING_NOTE } from './modelIds';
import { PLAYER_CAPTURE_ENABLED, VERIFIED_TRAINING_MODEL_IDS, type ConsentRecord } from './playerTurnAdmission';
import {
  trainingAuditRecord,
  trainingImportDecision,
  trainingImportFields,
  trainingImportSink,
  type TrainingImportRow,
  type TrainingRightsFixture,
} from './trainingImport';

const FLASH = OPENROUTER_DEEPSEEK_V41_FLASH;
const FIXTURE_IDS = new Set([FLASH]);

function consent(): ConsentRecord {
  return {
    ref: 'consent-1',
    subject: 'this-player',
    commercialTraining: true,
    retentionExplained: true,
    deleteExplained: true,
    accessExplained: true,
  };
}

function ready(over: Partial<TrainingImportRow> = {}): TrainingImportRow {
  return {
    example_source: 'test',
    teacherModel: FLASH,
    storedTrainingOk: true,
    buildStamp: '2026-11-03e',
    mode: 'litrpg',
    hasFacts: true,
    factcheckRow: true,
    factFlags: 0,
    turnP0: 0,
    prose: 'The hall is quiet.',
    callLinkMissing: false,
    callMessagesMissing: false,
    callId: 'call-1',
    ...over,
  };
}

function writerCall(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'call-1',
    job: 'writer',
    parent_id: null,
    turn_no: 1,
    messages: [
      { role: 'system', content: 'SYSTEM' },
      { role: 'user', content: 'Look around' },
      { role: 'assistant', content: 'The hall is quiet.' },
    ],
    teacher_model: FLASH,
    build_stamp: '2026-11-03e',
    engine_facts: { location: 'Hall', inventory: ['map'] },
    example_source: 'test',
    truncated: false,
    finish_reason: 'stop',
    ...over,
  };
}

describe('training import gate', () => {
  it('keeps capture off and the verified licence allowlist empty', () => {
    expect(PLAYER_CAPTURE_ENABLED).toBe(false);
    expect(VERIFIED_TRAINING_MODEL_IDS.size).toBe(0);
  });

  it('keeps a stored licence flag with no source in audit', () => {
    const decision = trainingImportDecision(ready({
      example_source: undefined,
      teacherModel: 'accounts/fireworks/models/deepseek-v4p1-flash',
      storedTrainingOk: true,
    }));
    expect(decision.status).toBe('audit');
    expect(decision.reasons).toContain('missing source');
    expect(decision.reasons).toContain('stored training_ok is not consent');
    expect(trainingImportSink(decision.status)).toBe('audit');
  });

  it('does not treat a missing player tag as a test row or as consent', () => {
    const decision = trainingImportDecision(ready({ example_source: undefined }));
    expect(decision.status).toBe('audit');
    expect(decision.status).not.toBe('candidate');
  });

  it('quarantines a proven test row while the allowlist is empty', () => {
    const decision = trainingImportDecision(ready());
    expect(decision.status).toBe('quarantine');
    expect(decision.reasons).toEqual(['served model has no verified training licence']);
    expect(VERIFIED_TRAINING_MODEL_IDS.size).toBe(0);
  });

  it('does not treat an isolated model allowlist as output-use proof', () => {
    const decision = trainingImportDecision(ready(), FIXTURE_IDS);
    expect(decision.status).toBe('rejected');
    expect(decision.reasons).toContain('provider unknown');
    expect(trainingImportSink(decision.status)).toBe('audit');
    expect(trainingImportSink('approved')).toBe('eligible');
    expect(VERIFIED_TRAINING_MODEL_IDS.size).toBe(0);
    expect(FIXTURE_IDS.has('accounts/fireworks/models/deepseek-v4p1-flash')).toBe(false);
  });

  it('rejects a player row without consent and accepts one only when the fixture licence also passes', () => {
    expect(trainingImportDecision(ready({
      example_source: 'player',
      consentRef: 'consent-1',
    }), FIXTURE_IDS).reasons).toContain('player turn has no matching consent');
    expect(trainingImportDecision(ready({
      example_source: 'player',
      consent: { optedIn: true, consentRef: 'consent-1', explainedFullPayload: true },
      consentRef: 'consent-1',
    }), FIXTURE_IDS).status).toBe('rejected');
    const consented = trainingImportDecision(ready({
      example_source: 'player',
      consent: consent(),
      consentRef: 'consent-1',
    }), FIXTURE_IDS);
    expect(consented.status).not.toBe('candidate');
    expect(consented.reasons).toContain('provider unknown');
    expect(trainingImportDecision(ready({
      example_source: 'player',
      consent: consent(),
      consentRef: 'consent-1',
    })).status).toBe('quarantine');
  });

  it('does not let the licence table or an alias through the empty allowlist', () => {
    expect(trainingImportDecision(ready({
      teacherModel: 'DS4.1Flash',
    }), new Set(['DS4.1Flash'])).status).toBe('quarantine');
    expect(trainingImportDecision(ready({
      teacherModel: 'openai/gpt-5-mini',
      storedTrainingOk: false,
    }), new Set(['openai/gpt-5-mini'])).status).toBe('quarantine');
  });

  it('keeps historical, excluded, wellbeing, and quality failures out of the eligible file', () => {
    expect(trainingImportDecision(ready({ historical: true }), FIXTURE_IDS).status).toBe('audit');
    expect(trainingImportDecision(ready({ mode: 'pyoa' }), FIXTURE_IDS).reasons).toContain('PYOA is not a training mode');
    expect(trainingImportDecision(ready({ excludedSourceId: 'community_mega' }), FIXTURE_IDS).reasons).toContain('copyrighted novel chapters');
    expect(trainingImportDecision(ready({ wellbeingFlagged: true }), FIXTURE_IDS).reasons).toEqual([WELLBEING_NOTE]);
    expect(trainingImportDecision(ready({ factFlags: 1 }), FIXTURE_IDS).reasons).toContain('factCheck flag');
    expect(trainingImportDecision(ready({ factcheckRow: false }), FIXTURE_IDS).reasons).toContain('no factcheck row');
    expect(trainingImportDecision(ready({ turnP0: 1 }), FIXTURE_IDS).reasons).toContain('turnCheck P0');
    expect(trainingImportDecision(ready({ prose: '  ' }), FIXTURE_IDS).reasons).toContain('empty prose');
    expect(trainingImportDecision(ready({ hasFacts: false }), FIXTURE_IDS).reasons).toContain('missing facts');
    expect(trainingImportDecision(ready({ buildStamp: 'trainlog' }), FIXTURE_IDS).reasons).toContain('missing time or build');
    expect(trainingImportDecision(ready({ truncated: true }), FIXTURE_IDS).reasons).toContain('truncated reply');
    expect(trainingImportDecision(ready({ servedIdDisagrees: true, teacherModel: null }), FIXTURE_IDS).reasons).toContain('served id disagrees');
  });

  it('rejects tampered consent, an unknown source, a missing call, and a turn that only claims its own stamp', () => {
    expect(trainingImportDecision(ready({
      example_source: 'player',
      consent: { ...consent(), ref: 'other-ref' },
      consentRef: 'consent-1',
    }), FIXTURE_IDS).status).toBe('rejected');
    expect(trainingImportDecision(ready({
      example_source: 'player',
      consent: { ...consent(), commercialTraining: false },
      consentRef: 'consent-1',
    }), FIXTURE_IDS).reasons).toContain('player turn has no matching consent');
    expect(trainingImportDecision(ready({ example_source: 'automated' })).status).toBe('rejected');
    expect(trainingImportDecision(ready({ callLinkMissing: true, callId: null }), FIXTURE_IDS).reasons).toContain('call ? missing link');
    expect(trainingImportDecision(ready({ callMessagesMissing: true }), FIXTURE_IDS).reasons).toContain('call call-1 missing messages');
    expect(trainingImportDecision(ready({ duplicateWriter: true }), FIXTURE_IDS).reasons).toContain('duplicate root');
    expect(trainingImportDecision(ready({ buildDisagrees: true }), FIXTURE_IDS).reasons).toContain('missing time or build');

    const claimed = trainingImportFields({
      turn: {
        example_source: 'test',
        teacher_model: FLASH,
        training_ok: true,
        gmText: 'The hall is quiet.',
        engineFact: 'Place: Hall.',
        build_stamp: '2026-11-03e',
      },
      buildStamp: '2026-11-03e',
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
    expect(claimed.teacherModel).toBeNull();
    expect(claimed.hasFacts).toBe(false);
    expect(claimed.callLinkMissing).toBe(true);
    expect(trainingImportDecision(claimed, FIXTURE_IDS).status).not.toBe('candidate');

    const mismatched = trainingImportFields({
      turn: { example_source: 'test', teacher_model: 'accounts/fireworks/models/deepseek-v4p1-flash', gmText: 'The hall is quiet.' },
      calls: [writerCall()],
      buildStamp: '2026-10-16d',
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
    expect(mismatched.servedIdDisagrees).toBe(true);
    expect(mismatched.buildDisagrees).toBe(true);
    expect(trainingImportDecision(mismatched, FIXTURE_IDS).status).toBe('rejected');

    const sourced = trainingImportFields({
      turn: { example_source: 'player', gmText: 'The hall is quiet.', consent: consent(), consentRef: 'consent-1' },
      calls: [writerCall({ example_source: 'test' })],
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
    expect(sourced.sourceDisagrees).toBe(true);
    expect(trainingImportDecision(sourced, FIXTURE_IDS).status).toBe('rejected');
  });

  it('reads a linked writer call and does not copy private text into an audit record', () => {
    const fields = trainingImportFields({
      turn: {
        gmText: 'The hall is quiet.',
        playerInput: 'Look around',
        training_ok: true,
        historical: false,
      },
      calls: [writerCall()],
      buildStamp: '2026-11-03e',
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
    expect(fields.example_source).toBe('test');
    expect(fields.teacherModel).toBe(FLASH);
    expect(fields.buildStamp).toBe('2026-11-03e');
    expect(fields.hasFacts).toBe(true);
    expect(fields.contextStatus).toBe('unknown');
    const decision = trainingImportDecision(fields, FIXTURE_IDS);
    expect(decision.status).not.toBe('candidate');
    const audit = trainingAuditRecord({
      ...decision,
      admission_status: decision.status,
      admission_reasons: decision.reasons,
      admitted: false,
      training_ok: true,
      teacher_model: FLASH,
      playerInput: 'Look around',
      prose: 'The hall is quiet.',
      writerPacket: 'SYSTEM',
      location: 'Hall',
      factCheck: { flags: ['The hall is quiet.'], turnScore: 100 },
    });
    expect(audit.playerInput).toBeUndefined();
    expect(audit.prose).toBeUndefined();
    expect(audit.writerPacket).toBeUndefined();
    expect(audit.location).toBeUndefined();
    expect(JSON.stringify(audit)).not.toContain('Look around');
    expect(JSON.stringify(audit)).not.toContain('The hall is quiet.');
    expect(audit.factFlagCount).toBe(1);
    expect(audit.admitted).toBe(false);
  });

  it('reads a turn without inventing a source or a served id', () => {
    const fields = trainingImportFields({
      turn: {
        teacher_model: 'accounts/fireworks/models/deepseek-v4p1-flash',
        training_ok: true,
        gmText: 'A sentence.',
        engineFact: 'Place: Hall.',
        writerUsage: { modelId: 'accounts/fireworks/models/deepseek-v4p1-flash' },
      },
      buildStamp: '2026-11-03e',
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
    expect(fields.example_source).toBeUndefined();
    expect(fields.storedTrainingOk).toBe(true);
    expect(fields.hasFacts).toBe(false);
    expect(fields.teacherModel).toBeNull();
    expect(trainingImportDecision(fields).status).toBe('audit');
    const split = trainingImportFields({
      turn: { gmText: 'A sentence.' },
      calls: [writerCall({ teacher_model: FLASH }), writerCall({ id: 'call-2', teacher_model: 'openai/gpt-5-mini' })],
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
    expect(split.duplicateWriter).toBe(true);
    expect(split.servedIdDisagrees).toBe(true);
    expect(split.teacherModel).toBeNull();
    expect(trainingImportDecision(split, FIXTURE_IDS).reasons).toContain('duplicate root');
  });
});

describe('served route and context proof', () => {
  const rights: TrainingRightsFixture = {
    servedModelId: FLASH,
    provider: 'fixture-host',
    route: 'fixture-route',
    outputUse: 'verified',
    contextSources: ['player_action', 'engine_fact', 'test_prompt'],
  };

  function provenCall(over: Record<string, unknown> = {}): Record<string, unknown> {
    return writerCall({
      provider: 'fixture-host',
      route: 'fixture-route',
      engine_facts_provenance: 'request_state',
      messages: [
        { role: 'system', content: 'SYSTEM', provenance: 'test_prompt' },
        { role: 'user', content: 'Look around', provenance: 'player_action' },
        { role: 'assistant', content: 'The hall is quiet.', provenance: 'engine_fact' },
      ],
      ...over,
    });
  }

  function provenFields(over: Record<string, unknown> = {}): TrainingImportRow {
    return trainingImportFields({
      turn: { gmText: 'The hall is quiet.' },
      calls: [provenCall(over)],
      buildStamp: '2026-11-03e',
      mode: 'litrpg',
      factcheckRow: { flags: [] },
    });
  }

  it('does not accept an allowlisted MIT id without provider, route, and output-use proof', () => {
    const decision = trainingImportDecision(ready(), FIXTURE_IDS);
    expect(decision.status).not.toBe('candidate');
    expect(decision.reasons.join(' ')).toMatch(/provider unknown|output terms unverified/);
    expect(VERIFIED_TRAINING_MODEL_IDS.size).toBe(0);
  });

  it('rejects a missing or contradictory provider and an unknown route', () => {
    expect(trainingImportDecision(provenFields({ provider: undefined }), FIXTURE_IDS, rights).reasons)
      .toContain('provider unknown');
    expect(trainingImportDecision(provenFields({ provider: 'other-host' }), FIXTURE_IDS, rights).reasons)
      .toContain('provider disagrees');
    expect(trainingImportDecision(provenFields({ route: undefined }), FIXTURE_IDS, rights).reasons)
      .toContain('route unknown');
    expect(trainingImportDecision(provenFields(), FIXTURE_IDS).status).not.toBe('candidate');
  });

  it('rejects Gemini Apps or PYOA context copied into a later turn, including an engine-fact relabel', () => {
    const copied = trainingImportDecision(provenFields({
      messages: [
        { role: 'user', content: 'Recap follows', provenance: 'pyoa' },
        { role: 'assistant', content: 'The hall is quiet.', provenance: 'engine_fact' },
      ],
    }), FIXTURE_IDS, rights);
    expect(copied.status).toBe('rejected');
    expect(copied.reasons).toContain('restricted context');

    const relabelled = trainingImportDecision(provenFields({
      engine_facts: { location: 'Hall', origin: 'gemini-apps' },
    }), FIXTURE_IDS, rights);
    expect(relabelled.status).toBe('rejected');
    expect(relabelled.reasons).toContain('restricted context');

    const untagged = trainingImportDecision(provenFields({
      messages: [
        { role: 'user', content: 'Look around' },
        { role: 'assistant', content: 'The hall is quiet.', provenance: 'engine_fact' },
      ],
    }), FIXTURE_IDS, rights);
    expect(untagged.reasons).toContain('context provenance unknown');
  });

  it('accepts one synthetic candidate only when the fixture rights match and writes no training file', () => {
    const decision = trainingImportDecision(provenFields(), FIXTURE_IDS, rights);
    expect(decision.status).toBe('candidate');
    expect(trainingImportSink(decision.status)).toBe('audit');
    expect(VERIFIED_TRAINING_MODEL_IDS.size).toBe(0);
    expect(PLAYER_CAPTURE_ENABLED).toBe(false);
  });
});

describe('writerDataset script on a synthetic fixture', () => {
  it('writes a source-less MIT row to audit and not to the eligible file', () => {
    const res = spawnSync(process.execPath, ['scripts/check-writer-dataset-row.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(res.status, res.stderr || res.stdout).toBe(0);
    expect(res.stdout).toContain('source-less row stayed in audit');
  });
});
