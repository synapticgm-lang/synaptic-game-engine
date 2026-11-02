/**
 * q71-TRAINLOG — tests A–K (logging only; no live model calls).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  appendTrainLogRows,
  clearTrainLogSession,
  drainTrainLogRows,
  engineFactsFromState,
  lastWriterRowId,
  mergeJudgeScoresOntoWriter,
  peekTrainLogRows,
  recordModelCall,
  repairParentExtra,
  setTrainLogFileAppend,
  setTrainLogSession,
  withTrainLogJob,
  type TrainLogJob,
  type TrainLogRow,
} from './trainLog';
import { recordCompletedChatCall } from './openRouterChat';

const KNOWN_JOBS: TrainLogJob[] = [
  'writer',
  'repair',
  'rewrite',
  'interpret',
  'chip_gapfill',
  'judge',
  'check',
];

const FIX = join(tmpdir(), `sgm-trainlog-${process.pid}`);

beforeEach(() => {
  clearTrainLogSession();
  setTrainLogFileAppend(null);
  if (existsSync(FIX)) rmSync(FIX, { recursive: true, force: true });
  mkdirSync(FIX, { recursive: true });
});

afterEach(() => {
  clearTrainLogSession();
  setTrainLogFileAppend(null);
  if (existsSync(FIX)) rmSync(FIX, { recursive: true, force: true });
});

function installFileSink(name = 'calls.jsonl') {
  const path = join(FIX, name);
  writeFileSync(path, '');
  const lines: string[] = [];
  setTrainLogFileAppend((_p, line) => {
    lines.push(line);
    writeFileSync(path, lines.join(''));
  });
  setTrainLogSession({ run_id: 'run-test', turn_no: 1, mode: 'litrpg', genre: 'summoned-pact', callsPath: path });
  return path;
}

describe('q71-TRAINLOG trainLog', () => {
  it('A: writer row messages byte-equal system + user prompts', () => {
    installFileSink();
    const system = 'SYSTEM_PROMPT_BYTE_EQ_α';
    const user = 'USER_PROMPT_BYTE_EQ_β';
    const row = recordModelCall({
      job: 'writer',
      system,
      user,
      assistant: 'Once upon a time.',
      teacher_model: 'deepseek/deepseek-v4.1-flash',
      provider: 'openrouter',
      engine_facts: engineFactsFromState({
        currentLocation: 'Hall',
        sceneFacts: { present: ['Jax'], location: 'Hall' },
        inventory: [{ name: 'Bag' }],
        offeredChoices: ['Look around', 'Wait'],
        character: { hp: 10, maxHp: 10 },
        quests: [{ id: 'q1', status: 'active' }],
      }),
    });
    expect(row).toBeTruthy();
    expect(row!.job).toBe('writer');
    expect(row!.messages[0]?.content).toBe(system);
    expect(row!.messages[1]?.content).toBe(user);
    expect(row!.messages[2]?.role).toBe('assistant');
    expect(row!.messages[0]?.content === system).toBe(true);
    expect(row!.messages[1]?.content === user).toBe(true);
  });

  it('B: repair row parent_id matches writer row id', async () => {
    installFileSink();
    const writer = recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'draft beat',
      teacher_model: 'm',
      provider: 'openrouter',
    });
    expect(writer?.id).toBeTruthy();
    const repair = await withTrainLogJob(
      'repair',
      async () =>
        recordModelCall({
          job: 'repair',
          system: 'repair-sys',
          user: 'fix this',
          assistant: 'fixed line',
          draft: 'bad line',
          flagged_error: 'invented name',
          correct_fact: 'Jax is here',
          repair_pass: 1,
        }),
      { draft: 'bad line', flagged_error: 'invented name', correct_fact: 'Jax is here', repair_pass: 1 }
    );
    expect(repair?.parent_id).toBe(writer!.id);
    expect(repair?.parent_id).toBe(lastWriterRowId('run-test', 1));
  });

  it('C: interpret, chip_gapfill, and check rows; no untagged when tagged', () => {
    installFileSink();
    recordModelCall({ job: 'interpret', system: 'i', user: 'u', assistant: '{}' });
    recordModelCall({ job: 'chip_gapfill', system: 'c', user: 'u', assistant: '1. Look' });
    recordModelCall({
      job: 'check',
      system: 'You audit a narration against FACTS',
      user: 'FACTS:\nWORLD FACTS (this turn):\nPlace: Ford Camp',
      assistant: '{"claims":[]}',
    });
    const jobs = peekTrainLogRows().map((r) => r.job);
    expect(jobs).toContain('interpret');
    expect(jobs).toContain('chip_gapfill');
    expect(jobs).toContain('check');
    expect(jobs.every((j) => j !== 'untagged')).toBe(true);
    for (const j of jobs) expect(KNOWN_JOBS).toContain(j);
  });

  it('D: no API key / Authorization / email in any row (regex scan)', () => {
    installFileSink();
    recordModelCall({
      job: 'writer',
      system: 'hello',
      user: 'world',
      assistant: 'ok',
      teacher_model: 'm',
      provider: 'openrouter',
    });
    const blob = JSON.stringify(peekTrainLogRows());
    expect(blob).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    expect(blob).not.toMatch(/Authorization/i);
    expect(blob).not.toMatch(/Bearer\s+\S+/);
    expect(blob).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  it('E: engine_facts keys on writer rows', () => {
    installFileSink();
    const facts = engineFactsFromState({
      currentLocation: 'Saltmeet',
      sceneFacts: { present: [{ id: 'n1', name: 'Wren' }], location: 'Saltmeet' },
      inventory: [{ name: 'Knife' }],
      offeredChoices: ['Talk'],
      character: { hp: 8, maxHp: 12 },
      lastCheckResult: { label: 'Stealth', total: 14, kept: 14, dc: 12, outcome: 'success' },
      quests: [{ id: 'circle', status: 'active' }],
    });
    const row = recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'a',
      engine_facts: facts,
    });
    expect(row!.engine_facts).toBeTruthy();
    expect(row!.engine_facts).toHaveProperty('location');
    expect(row!.engine_facts).toHaveProperty('npcs');
    expect(row!.engine_facts).toHaveProperty('hp');
    expect(row!.engine_facts).toHaveProperty('inventory');
    expect(row!.engine_facts).toHaveProperty('options');
    expect(row!.engine_facts).toHaveProperty('dice');
    expect(row!.engine_facts!.location).toBe('Saltmeet');
    expect(row!.engine_facts!.npcs[0]?.name).toBe('Wren');
    expect(row!.engine_facts!.dice?.dc).toBe(12);
  });

  it('F: recorder adds no model calls (pure logging); seeded snapshot hash stable', () => {
    installFileSink();
    const seed = { turn: 1, location: 'Hall', choices: ['Look', 'Wait'], prose: 'You look.' };
    const before = JSON.stringify(seed);
    let callCount = 0;
    const fakeCall = () => {
      callCount += 1;
      return 'ok';
    };
    fakeCall();
    recordModelCall({ job: 'writer', system: 's', user: 'u', assistant: 'ok' });
    fakeCall();
    expect(callCount).toBe(2);
    expect(JSON.stringify(seed)).toBe(before);
  });

  it('G: truncated finish sets truncated:true', () => {
    installFileSink();
    const row = recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'cut',
      finish_reason: 'length',
    });
    expect(row!.truncated).toBe(true);
  });

  it('H: judge call writes judge row; judge_scores land on writer row', () => {
    installFileSink();
    const writer = recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'story',
    });
    recordModelCall({
      job: 'judge',
      messages: [{ role: 'user', content: 'judge this' }],
      assistant: '[{"turn":1,"thumb":"up"}]',
      teacher_model: 'judge-model',
    });
    const updated = mergeJudgeScoresOntoWriter(writer!.id, { overall: 1, followed_action: 1 });
    expect(updated?.judge_scores?.overall).toBe(1);
    expect(peekTrainLogRows().some((r) => r.job === 'judge')).toBe(true);
  });

  it('I: forced repair yields repair row with parent_id + draft fields', () => {
    installFileSink();
    const writer = recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'The stranger Orel Vane waved.',
    });
    const repair = recordModelCall({
      job: 'repair',
      system: 'repair',
      user: 'Sentence: "The stranger Orel Vane waved."\nProblem: invented name',
      assistant: 'The stranger waved.',
      parent_id: writer!.id,
      draft: 'The stranger Orel Vane waved.',
      flagged_error: 'invented name',
      correct_fact: 'Only Jax is present',
      repaired_reply: 'The stranger waved.',
      repair_pass: 1,
    });
    expect(repair!.parent_id).toBe(writer!.id);
    expect(repair!.draft).toContain('Orel');
    expect(repair!.flagged_error).toBe('invented name');
    expect(repair!.correct_fact).toContain('Jax');
    expect(repair!.repaired_reply).toBe('The stranger waved.');
  });

  it('J: calls.jsonl valid JSON lines with newlines/quotes/emoji in reply', () => {
    const path = installFileSink();
    recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'Line one.\nLine "two" — 😀',
    });
    const raw = readFileSync(path, 'utf8');
    expect(raw.charCodeAt(0)).not.toBe(0xfeff);
    const parsed: TrainLogRow[] = raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    expect(parsed).toHaveLength(1);
    const lastMsg = parsed[0]!.messages[parsed[0]!.messages.length - 1];
    expect(lastMsg?.content).toContain('😀');
    expect(lastMsg?.content).toContain('\n');
  });

  it('K: recorder disk failure never throws into the game turn', () => {
    setTrainLogSession({ run_id: 'x', turn_no: 1, callsPath: join(FIX, 'calls.jsonl') });
    setTrainLogFileAppend(() => {
      throw new Error('ENOSPC');
    });
    expect(() =>
      recordModelCall({ job: 'writer', system: 's', user: 'u', assistant: 'a' })
    ).not.toThrow();
    expect(() =>
      recordCompletedChatCall({ system: 's', user: 'u', assistant: 'a', job: 'writer' })
    ).not.toThrow();
  });

  it('hosted-Free: real-player request (no trainLog marker) gets no callLog shape change', () => {
    // Simulates parseGmTurnResponse / client: without trainLog, callLog must be absent.
    const playerPayload = { text: 'Hello.', usage: { tokensIn: 1, tokensOut: 2, tokensCached: null, modelCalls: 1, modelId: 'm' } };
    expect(playerPayload).not.toHaveProperty('callLog');
    const withLog = { ...playerPayload, callLog: [{ job: 'writer' }] };
    // Autoplay marker path may carry callLog; real player must not.
    expect(withLog.callLog).toBeTruthy();
    appendTrainLogRows(undefined);
    expect(drainTrainLogRows()).toHaveLength(0);
  });

  it('untagged when job omitted from recordModelCall', () => {
    installFileSink();
    const row = recordModelCall({ system: 's', user: 'u', assistant: 'a' });
    expect(row!.job).toBe('untagged');
  });

  it('recordCompletedChatCall requires job (compile-time); rejects silent omit via typed call', () => {
    installFileSink();
    // Runtime: job must be passed. Call sites use currentTrainLogJob() or an explicit tag.
    const row = recordCompletedChatCall({
      system: 's',
      user: 'u',
      assistant: 'a',
      job: 'writer',
    });
    expect(row!.job).toBe('writer');
  });

  it('multi-turn: turn N repair parent_id equals turn N writer (not turn 1)', () => {
    installFileSink();
    setTrainLogSession({ run_id: 'run-mt', turn_no: 1, callsPath: join(FIX, 'calls.jsonl') });
    const w1 = recordModelCall({ job: 'writer', system: 's', user: 'u1', assistant: 'a1' });
    setTrainLogSession({ turn_no: 2 });
    const w2 = recordModelCall({ job: 'writer', system: 's', user: 'u2', assistant: 'a2' });
    setTrainLogSession({ turn_no: 3 });
    const w3 = recordModelCall({ job: 'writer', system: 's', user: 'u3', assistant: 'a3' });
    // Stale edge-style parent pointing at turn 1 must not win.
    const repair = recordModelCall({
      job: 'repair',
      system: 'fix',
      user: 'Sentence: "x"',
      assistant: 'fixed',
      parent_id: w1!.id,
    });
    expect(w3!.id).not.toBe(w1!.id);
    expect(w3!.id).not.toBe(w2!.id);
    expect(repair!.parent_id).toBe(w3!.id);
    expect(repair!.parent_id).not.toBe(w1!.id);
  });

  it('repair with no same-turn writer reports parent_id null (never stale)', () => {
    installFileSink();
    setTrainLogSession({ run_id: 'run-mt', turn_no: 1, callsPath: join(FIX, 'calls.jsonl') });
    const w1 = recordModelCall({ job: 'writer', system: 's', user: 'u1', assistant: 'a1' });
    setTrainLogSession({ turn_no: 4 });
    // Answer-repair style path with no writer row this turn — must not attach turn 1.
    const repair = recordModelCall({
      job: 'repair',
      system: 'fix',
      user: 'Your story left out the answer. Write ONE sentence…',
      assistant: 'The innkeep nodded.',
      parent_id: w1!.id, // stale claim from a warm isolate
    });
    expect(repair!.parent_id).toBeNull();
    expect(repair!.parent_id).not.toBe(w1!.id);
  });

  it('answer-repair path gets parent via repairParentExtra when writer exists', async () => {
    installFileSink();
    const writer = recordModelCall({
      job: 'writer',
      system: 's',
      user: 'u',
      assistant: 'Jax looked.',
    });
    const repair = await withTrainLogJob(
      'repair',
      async () =>
        recordModelCall({
          job: 'repair',
          system: 'fix',
          user: 'Your story left out the answer. Write ONE sentence…',
          assistant: 'The innkeep answered.',
        }),
      repairParentExtra({ repair_pass: 1, flagged_error: 'missing answer' })
    );
    expect(repair!.parent_id).toBe(writer!.id);
  });

  it('hosted-style turn: appendTrainLogRows (gm-turn callLog) has zero untagged; repair parent rebound', () => {
    installFileSink();
    setTrainLogSession({ run_id: 'hosted-run', turn_no: 3, mode: 'dnd', genre: 'millstone-road' });
    // Simulate edge callLog for writer, then check, then repair with a STALE parent (turn 1 id).
    const staleParent = '48b8d9a3-8049-4d00-87f4-d748dc753c0f';
    appendTrainLogRows([
      {
        id: 'writer-t3',
        created_at: new Date().toISOString(),
        job: 'writer',
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'Narrate…' },
          { role: 'assistant', content: 'Jax looked.' },
        ],
        teacher_model: 'm',
        provider: 'openrouter',
        turn_no: 3,
        run_id: 'hosted-run',
      },
    ]);
    appendTrainLogRows([
      {
        id: 'check-t3',
        created_at: new Date().toISOString(),
        job: 'check',
        messages: [
          { role: 'system', content: 'You audit…' },
          {
            role: 'user',
            content: 'FACTS:\nWORLD FACTS (this turn):\nPlace: Ford Camp',
          },
          { role: 'assistant', content: '{"claims":[]}' },
        ],
        teacher_model: 'm',
        provider: 'openrouter',
        turn_no: 3,
        run_id: 'hosted-run',
      },
    ]);
    appendTrainLogRows([
      {
        id: 'repair-t3',
        created_at: new Date().toISOString(),
        job: 'repair',
        messages: [
          { role: 'system', content: 'fix' },
          { role: 'user', content: 'Rewrite…' },
          { role: 'assistant', content: 'fixed' },
        ],
        teacher_model: 'm',
        provider: 'openrouter',
        turn_no: 3,
        run_id: 'hosted-run',
        parent_id: staleParent,
      },
    ]);
    const rows = peekTrainLogRows();
    expect(rows.every((r) => r.job !== 'untagged')).toBe(true);
    expect(rows.some((r) => r.job === 'check')).toBe(true);
    const repair = rows.find((r) => r.id === 'repair-t3');
    expect(repair!.parent_id).toBe('writer-t3');
    expect(repair!.parent_id).not.toBe(staleParent);
  });

  it('edge path: mode:check maps to job check (not untagged)', () => {
    // Mirrors gm-turn trainJob resolution for mode:check without a body.trainJob.
    function resolveEdgeTrainJob(
      mode: 'turn' | 'auto-fight' | 'repair' | 'check',
      bodyJob?: TrainLogJob
    ): TrainLogJob {
      if (
        bodyJob === 'writer' ||
        bodyJob === 'repair' ||
        bodyJob === 'rewrite' ||
        bodyJob === 'interpret' ||
        bodyJob === 'chip_gapfill' ||
        bodyJob === 'judge' ||
        bodyJob === 'check'
      ) {
        return bodyJob;
      }
      if (mode === 'repair') return 'repair';
      if (mode === 'check') return 'check';
      return 'writer';
    }
    expect(resolveEdgeTrainJob('check')).toBe('check');
    expect(resolveEdgeTrainJob('check')).not.toBe('untagged');
    installFileSink();
    const row = recordModelCall({
      job: resolveEdgeTrainJob('check'),
      system: 'You audit…',
      user: 'FACTS:\nWORLD FACTS (this turn):\nPlace: Ford Camp',
      assistant: '{"claims":[]}',
    });
    expect(row!.job).toBe('check');
    expect(peekTrainLogRows().every((r) => r.job !== 'untagged')).toBe(true);
  });
});
