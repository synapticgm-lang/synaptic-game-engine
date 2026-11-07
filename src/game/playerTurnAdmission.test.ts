import { beforeEach, describe, expect, it } from 'vitest';
import {
  ADMISSION_NOT_WIRED,
  DEFAULT_PLAYER_TRAINING_PREFERENCE,
  FULL_PAYLOAD_EXPLANATION,
  PLAYER_CAPTURE_ENABLED,
  PLAYER_TURN_SCHEMA,
  UNVERIFIED_MODEL_ALIASES,
  admitTurn,
  approveBatch,
  featureRequestIsNotConsent,
  grantPlayerTrainingOptIn,
  modelGate,
  pseudonymise,
  recordConsentingPlayerCall,
  revokePlayerTrainingOptIn,
  selectTrainingRows,
  sessionSplit,
  setPlayerTrainingPreference,
  shouldRequestTrainLog,
  tally,
  type ConsentRecord,
  type PlayerTurnCapture,
  type SelectionRow,
} from './playerTurnAdmission';
import { OPENROUTER_DEEPSEEK_V41_FLASH, OPENROUTER_GLM_53_FLASH } from './modelIds';
import { clearTrainLogSession, engineFactsFromState, peekTrainLogRows, setTrainLogFileAppend, setTrainLogSession } from './trainLog';
import { appendConsentingCallLog } from './playerTurnAdmission';

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

function turn(over: Partial<PlayerTurnCapture> = {}): PlayerTurnCapture {
  return {
    rootId: 'root-1',
    source: 'test',
    mode: 'litrpg',
    world: 'summoned-pact',
    timestamp: '2026-11-07T12:00:00Z',
    buildStamp: '2026-11-03e',
    promptVersion: 'fact-leaf-1',
    schemaVersion: PLAYER_TURN_SCHEMA,
    consentRef: null,
    inputText: 'Look around',
    resolution: 'action',
    facts: 'Place: Hall.',
    before: 'hp 10',
    after: 'hp 10',
    delivered: 'The hall is empty.',
    calls: [{
      id: 'call-1',
      parentId: null,
      job: 'writer',
      messages: [{ role: 'user', content: 'Look around' }],
      provider: 'openrouter',
      model: 'verified-model',
      settings: 'temp 0',
      response: 'The hall is empty.',
      finish: 'stop',
      error: null,
      truncated: false,
    }],
    draft: false,
    helper: false,
    simulator: false,
    historical: false,
    ...over,
  };
}

describe('player turn admission defaults', () => {
  it('capture is off and a feature request is not consent', () => {
    expect(PLAYER_CAPTURE_ENABLED).toBe(false);
    expect(featureRequestIsNotConsent('include player turns')).toBeNull();
    expect(ADMISSION_NOT_WIRED.some((line) => /opted out/.test(line))).toBe(true);
  });

  it('quarantines aliases and unknown ids, and accepts the two named corpus writers', () => {
    for (const alias of UNVERIFIED_MODEL_ALIASES) expect(modelGate(alias)).toBe('quarantine');
    expect(modelGate('deepseek/deepseek-chat')).toBe('quarantine');
    expect(modelGate('')).toBe('quarantine');
    expect(modelGate(OPENROUTER_DEEPSEEK_V41_FLASH)).toBe('ok');
    expect(modelGate(OPENROUTER_GLM_53_FLASH)).toBe('ok');
  });

  it('rejects a player turn without consent and a secret, and keeps a candidate only after the gates', () => {
    const player = turn({
      source: 'player',
      consentRef: 'consent-1',
      calls: turn().calls.map((c) => ({ ...c, model: OPENROUTER_DEEPSEEK_V41_FLASH })),
    });
    expect(admitTurn(player, null).status).toBe('rejected');
    expect(admitTurn({ ...player, inputText: 'sk-abcdefghij look' }, consent()).status).toBe('rejected');
    const candidate = admitTurn(player, consent());
    expect(candidate.status).toBe('candidate');
    expect(candidate.gameplay).toBe(true);
    expect(tally([{ rootId: player.rootId, source: 'player', mode: 'litrpg', world: 'summoned-pact', status: 'candidate', gameplay: true }], new Set()).approved).toBe(0);
  });

  it('does not approve by itself, and auto is not a reviewer', () => {
    expect(approveBatch(['root-1'], 'auto')).toEqual({ approved: [], refused: 'a person must approve; auto is not approval' });
    expect(approveBatch(['root-1', 'root-1'], 'Ada').approved).toEqual(['root-1']);
  });

  it('keeps historical and PYOA rows out of admission, and drops a duplicate root', () => {
    expect(admitTurn(turn({ historical: true }), null).status).toBe('audit');
    expect(admitTurn(turn({ mode: 'pyoa' }), null).reasons).toContain('PYOA is not a training mode');
    expect(admitTurn(turn(), null, new Set(['root-1'])).reasons).toContain('duplicate root');
  });

  it('pseudonymises the same name in the input, the facts, and the linked call', () => {
    const named = turn({
      inputText: 'Ask Mira',
      facts: 'Mira is here.',
      delivered: 'Mira nods.',
      calls: [{ ...turn().calls[0]!, response: 'Mira nods.', messages: [{ role: 'user', content: 'Ask Mira' }] }],
    });
    const { turn: red, redaction } = pseudonymise(named, ['Mira']);
    expect(red.inputText).not.toContain('Mira');
    expect(red.facts).not.toContain('Mira');
    expect(red.delivered).toBe(red.calls[0]!.response);
    expect(redaction.transforms.every((t) => t.token.startsWith('person_') && !t.fromHash.includes('Mira'))).toBe(true);
    expect(JSON.stringify(redaction)).not.toContain('Mira');
  });

  it('counts a draft and a helper outside the gameplay total', () => {
    expect(admitTurn(turn({ draft: true }), null).gameplay).toBe(false);
    expect(admitTurn(turn({ helper: true }), null).reasons).toContain('not a gameplay total');
    const rows: SelectionRow[] = [
      { rootId: 'p', source: 'player', mode: 'litrpg', world: 'a', status: 'candidate', gameplay: true },
      { rootId: 'd', source: 'test', mode: 'litrpg', world: 'a', status: 'candidate', gameplay: false },
    ];
    expect(tally(rows, new Set()).candidate).toBe(1);
    expect(tally(rows, new Set(['p'])).approved).toBe(1);
  });

  it('does not apply the 15% test cap until seven worlds, and then keeps every player row', () => {
    const worlds = ['a', 'b', 'c', 'd', 'e', 'f'];
    const few: SelectionRow[] = worlds.flatMap((world, i) => [
      { rootId: `p${i}`, source: 'player', mode: 'litrpg', world, status: 'candidate', gameplay: true },
      { rootId: `t${i}`, source: 'test', mode: 'litrpg', world, status: 'candidate', gameplay: true },
    ]);
    const held = selectTrainingRows(few);
    expect(held.strict).toBe(false);
    expect(held.selected).toEqual([]);
    expect(held.retained).toHaveLength(few.length);

    const seven = [...few, { rootId: 'p6', source: 'player' as const, mode: 'litrpg', world: 'g', status: 'candidate' as const, gameplay: true }];
    const picked = selectTrainingRows(seven);
    expect(picked.strict).toBe(true);
    expect(picked.selected.filter((r) => r.source === 'player')).toHaveLength(7);
    const tests = picked.selected.filter((r) => r.source === 'test').length;
    expect(tests / picked.selected.length).toBeLessThanOrEqual(0.15);
    expect(picked.retained.some((r) => r.source === 'test')).toBe(true);
  });

  it('splits sessions without creating turns', () => {
    const a = sessionSplit('session-a');
    expect(sessionSplit('session-a')).toBe(a);
    expect(['train', 'eval']).toContain(a);
  });
});

describe('consenting player turns through the existing logger', () => {
  const facts = engineFactsFromState({
    currentLocation: 'Hall',
    sceneFacts: { present: ['Mira'], location: 'Hall' },
    character: { hp: 10, maxHp: 10 },
    inventory: [{ name: 'Bag' }],
    offeredChoices: ['Look around'],
  })!;
  const ack = { commercial: true, retention: true, withdraw: true, fullPayload: true };

  beforeEach(() => {
    clearTrainLogSession();
    setTrainLogFileAppend(null);
    setPlayerTrainingPreference(null);
  });

  it('stores one opted-in turn that can be read back, and does not mark it good', () => {
    const pref = grantPlayerTrainingOptIn('2026-11-07T12:00:00Z', ack);
    expect(pref?.optedIn).toBe(true);
    expect(FULL_PAYLOAD_EXPLANATION).toMatch(/system prompt/);
    setTrainLogSession({ run_id: 'run-p', turn_no: 4, mode: 'litrpg', callsPath: null });
    const row = recordConsentingPlayerCall(pref, {
      job: 'writer',
      system: 'SYSTEM',
      user: 'Look around',
      assistant: 'The hall is quiet.',
      teacher_model: OPENROUTER_DEEPSEEK_V41_FLASH,
      provider: 'openrouter',
      build_stamp: '2026-11-03e',
      run_id: 'run-p',
      turn_no: 4,
      mode: 'litrpg',
      engine_facts: facts,
      finish_reason: 'stop',
      accountIds: ['user-12345678'],
    });
    expect(row?.example_source).toBe('player');
    expect(row?.judge_scores).toBeUndefined();
    expect(recordConsentingPlayerCall(pref, {
      job: 'writer',
      system: 'SYSTEM',
      user: 'Look around',
      assistant: 'The hall is quiet.',
      teacher_model: OPENROUTER_GLM_53_FLASH,
      build_stamp: '2026-11-03e',
      run_id: 'run-p',
      turn_no: 4,
      mode: 'rpg',
      engine_facts: facts,
      finish_reason: 'stop',
    })).toBeNull();
    expect(peekTrainLogRows().filter((r) => r.job === 'writer')).toHaveLength(1);
    const rpg = recordConsentingPlayerCall(pref, {
      job: 'writer',
      system: 'SYSTEM',
      user: 'Wait',
      assistant: 'You wait.',
      teacher_model: OPENROUTER_GLM_53_FLASH,
      build_stamp: '2026-11-03e',
      run_id: 'run-p',
      turn_no: 5,
      mode: 'rpg',
      engine_facts: facts,
      finish_reason: 'stop',
    });
    expect(rpg?.mode).toBe('rpg');
    expect(rpg?.example_source).toBe('player');
  });

  it('stores nothing when opted out, revoked, truncated, unknown, or secret', () => {
    expect(shouldRequestTrainLog({ labSession: false, preference: DEFAULT_PLAYER_TRAINING_PREFERENCE })).toBe(false);
    expect(shouldRequestTrainLog({ labSession: true, preference: DEFAULT_PLAYER_TRAINING_PREFERENCE })).toBe(true);
    const pref = grantPlayerTrainingOptIn('t', ack)!;
    expect(recordConsentingPlayerCall(DEFAULT_PLAYER_TRAINING_PREFERENCE, {
      assistant: 'no',
      teacher_model: OPENROUTER_DEEPSEEK_V41_FLASH,
      build_stamp: '2026-11-03e',
      engine_facts: facts,
      system: 'S',
      user: 'U',
    })).toBeNull();
    expect(peekTrainLogRows()).toHaveLength(0);
    const revoked = revokePlayerTrainingOptIn(pref, 'later');
    expect(shouldRequestTrainLog({ labSession: false, preference: revoked })).toBe(false);
    expect(recordConsentingPlayerCall(pref, {
      assistant: 'cut',
      teacher_model: OPENROUTER_DEEPSEEK_V41_FLASH,
      build_stamp: '2026-11-03e',
      engine_facts: facts,
      system: 'S',
      user: 'U',
      truncated: true,
      run_id: 'r',
      turn_no: 1,
    })).toBeNull();
    expect(recordConsentingPlayerCall(pref, {
      assistant: 'x',
      teacher_model: 'DS4.1Flash',
      build_stamp: '2026-11-03e',
      engine_facts: facts,
      system: 'S',
      user: 'U',
      run_id: 'r',
      turn_no: 2,
    })).toBeNull();
    expect(recordConsentingPlayerCall(pref, {
      assistant: 'key sk-abcdefghij',
      teacher_model: OPENROUTER_DEEPSEEK_V41_FLASH,
      build_stamp: '2026-11-03e',
      engine_facts: facts,
      system: 'S',
      user: 'player@example.com user-abcdef12',
      run_id: 'r',
      turn_no: 3,
      accountIds: ['user-abcdef12'],
    })).toBeNull();
    const clean = recordConsentingPlayerCall(pref, {
      assistant: 'Hello',
      teacher_model: OPENROUTER_DEEPSEEK_V41_FLASH,
      build_stamp: '2026-11-03e',
      engine_facts: facts,
      system: 'S',
      user: 'player@example.com said hello user-abcdef12',
      run_id: 'r',
      turn_no: 4,
      accountIds: ['user-abcdef12'],
    });
    const packed = JSON.stringify(clean);
    expect(packed).not.toContain('player@example.com');
    expect(packed).not.toContain('user-abcdef12');
    expect(packed).toContain('[redacted-email]');
    expect(featureRequestIsNotConsent('include player turns')).toBeNull();
  });

  it('imports one opted-in hosted call and drops a truncated or secret twin', () => {
    const pref = grantPlayerTrainingOptIn('t2', ack)!;
    setPlayerTrainingPreference(pref);
    const base = {
      id: 'hosted-1',
      job: 'writer',
      messages: [{ role: 'system', content: 'SYSTEM' }, { role: 'user', content: 'Press the Look button' }, { role: 'assistant', content: 'You look.' }],
      teacher_model: OPENROUTER_DEEPSEEK_V41_FLASH,
      provider: 'openrouter',
      finish_reason: 'stop',
      truncated: false,
      run_id: 'hosted',
      turn_no: 1,
      mode: 'dnd',
      build_stamp: '2026-11-03e',
      engine_facts: facts,
    };
    const stored = appendConsentingCallLog([
      base,
      { ...base, id: 'hosted-2', truncated: true, turn_no: 2 },
      { ...base, id: 'hosted-3', turn_no: 3, messages: [{ role: 'user', content: 'sk-abcdefghij' }] },
    ]);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.judge_scores).toBeUndefined();
    expect(stored[0]?.example_source).toBe('player');
    expect(JSON.stringify(stored[0]?.messages)).toContain('Look button');
    expect(appendConsentingCallLog([base])).toEqual([]);
    setPlayerTrainingPreference(null);
    expect(appendConsentingCallLog([{ ...base, id: 'hosted-4', turn_no: 9 }])).toEqual([]);
  });
});
