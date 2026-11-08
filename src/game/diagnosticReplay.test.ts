/**
 * Diagnostic companion replay: hosted default writer, training request omitted.
 * Not a paid call. fetch is the network boundary.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));

import { PLAYER_CAPTURE_ENABLED, shouldRequestTrainLog, DEFAULT_PLAYER_TRAINING_PREFERENCE } from './playerTurnAdmission';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from './modelIds';
import { clearTrainLogSession, peekTrainLogRows } from './trainLog';
import { disableAutoplayTestLab } from './testLab';
import { parseFateArgs, runFateAutoplay } from './fateAutoplay';

const bodies: Array<Record<string, unknown>> = [];

beforeAll(() => {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.assign(globalThis, { localStorage });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  disableAutoplayTestLab();
  clearTrainLogSession();
  bodies.length = 0;
});

function installFetch() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon');
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ text: 'The lamp stayed on the table and nobody moved.' }),
    };
  }));
}

describe('diagnostic replay does not request training', () => {
  it('runFateAutoplay default writer omits trainLog and still writes the turn tape', async () => {
    installFetch();
    clearTrainLogSession();
    const before = peekTrainLogRows().length;
    const outRoot = mkdtempSync(join(tmpdir(), 'diag-replay-'));
    const summary = await runFateAutoplay({
      turns: 1,
      seed: 1,
      bibleId: 'summoned-pact',
      personality: 'cold-system',
      aiTier: 'free',
      mode: 'fate',
      dryRun: false,
      outRoot,
      characterName: 'Jax',
      writer: 'default',
      diagnosticReplay: true,
    });
    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body).not.toHaveProperty('trainLog');
      expect(body.trainJob).toBeUndefined();
      expect((body.settings as { customModelId?: string }).customModelId).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    }
    expect(peekTrainLogRows().length).toBe(before);
    expect(summary.completedTurns).toBeGreaterThan(0);
    const turns = await import('node:fs').then((fs) => fs.readFileSync(join(summary.outDir, 'turns.jsonl'), 'utf8'));
    expect(turns.trim().length).toBeGreaterThan(0);
    expect(await import('node:fs').then((fs) => fs.existsSync(join(summary.outDir, 'calls.jsonl')))).toBe(false);
  }, 120_000);

  it('a lab run without the diagnostic flag still requests trainLog', async () => {
    installFetch();
    const outRoot = mkdtempSync(join(tmpdir(), 'lab-replay-'));
    await runFateAutoplay({
      turns: 1,
      seed: 1,
      bibleId: 'summoned-pact',
      personality: 'cold-system',
      aiTier: 'free',
      mode: 'fate',
      dryRun: false,
      outRoot,
      characterName: 'Jax',
      writer: 'default',
    });
    expect(bodies.some((body) => body.trainLog === true)).toBe(true);
    expect(shouldRequestTrainLog({ labSession: true, preference: DEFAULT_PLAYER_TRAINING_PREFERENCE })).toBe(true);
    expect(PLAYER_CAPTURE_ENABLED).toBe(false);
  }, 120_000);

  it('parseFateArgs keeps the diagnostic flag off unless asked', () => {
    expect(parseFateArgs(['--turns', '1']).diagnosticReplay).toBe(false);
    expect(parseFateArgs(['--diagnostic-replay', '--writer', 'default']).diagnosticReplay).toBe(true);
    expect(parseFateArgs(['--diagnostic-replay']).writer).toBe('default');
  });
});
