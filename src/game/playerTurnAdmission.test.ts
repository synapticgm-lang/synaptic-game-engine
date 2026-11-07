import { describe, expect, it } from 'vitest';
import {
  ADMISSION_NOT_WIRED,
  PLAYER_CAPTURE_ENABLED,
  PLAYER_TURN_SCHEMA,
  UNVERIFIED_MODEL_ALIASES,
  admitTurn,
  approveBatch,
  featureRequestIsNotConsent,
  modelGate,
  pseudonymise,
  selectTrainingRows,
  sessionSplit,
  tally,
  type ConsentRecord,
  type PlayerTurnCapture,
  type SelectionRow,
} from './playerTurnAdmission';

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
    expect(ADMISSION_NOT_WIRED.some((line) => /not connected/.test(line))).toBe(true);
  });

  it('quarantines aliases and any served id that is not on the verified list', () => {
    for (const alias of UNVERIFIED_MODEL_ALIASES) expect(modelGate(alias)).toBe('quarantine');
    expect(modelGate('deepseek/deepseek-v4.1-flash')).toBe('quarantine');
    expect(modelGate('')).toBe('quarantine');
  });

  it('rejects a player turn without consent and a secret, and keeps a candidate only after the gates', () => {
    const player = turn({ source: 'player', consentRef: 'consent-1', calls: turn().calls.map((c) => ({ ...c, model: 'verified-model' })) });
    expect(admitTurn(player, null).status).toBe('rejected');
    expect(admitTurn({ ...player, inputText: 'sk-abcdefghij look' }, consent()).status).toBe('rejected');
    const verified = new Set(['verified-model']);
    expect(verified.has('verified-model')).toBe(true);
    const candidate = admitTurn(player, consent());
    expect(candidate.status).toBe('quarantine');
    expect(candidate.gameplay).toBe(true);
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
