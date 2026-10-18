/**
 * q51-AIP acceptance: AI player tester part 1 (scripts only).
 * No model, no browser, no network — mock OpenRouter, page, and Supabase.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

describe('q51-AIP aipTester', () => {
  const prevModel = process.env.AI_PLAYER_MODEL;

  afterEach(() => {
    if (prevModel === undefined) delete process.env.AI_PLAYER_MODEL;
    else process.env.AI_PLAYER_MODEL = prevModel;
  });

  it('licenceFor: deepseek and qwen open; anthropic/openai/google/x-ai restricted', async () => {
    const { licenceFor, RESTRICTED_PROVIDER_PREFIXES } = await load(
      'scripts/ai-player-browser/playerLicence.mjs',
    ) as {
      licenceFor: (m: string) => 'open' | 'restricted';
      RESTRICTED_PROVIDER_PREFIXES: readonly string[];
    };
    expect(RESTRICTED_PROVIDER_PREFIXES).toEqual([
      'anthropic/',
      'openai/',
      'google/',
      'x-ai/',
    ]);
    expect(licenceFor('deepseek/deepseek-v4-pro')).toBe('open');
    expect(licenceFor('qwen/qwen3-235b-a22b-2507')).toBe('open');
    expect(licenceFor('anthropic/claude-sonnet-4.6')).toBe('restricted');
    expect(licenceFor('openai/gpt-4o')).toBe('restricted');
    expect(licenceFor('google/gemini-2.5-pro')).toBe('restricted');
    expect(licenceFor('x-ai/grok-2')).toBe('restricted');
  });

  it('default player model is deepseek; AI_PLAYER_MODEL overrides; never silent Flash default', async () => {
    delete process.env.AI_PLAYER_MODEL;
    const mod = await load('scripts/ai-player-browser/openRouterPlayer.mjs') as {
      DEFAULT_PLAYER_MODEL: string;
      ALT_PLAYER_MODEL: string;
      openRouterPlayerModel: () => string;
      testerOnlyForModel: (m?: string) => boolean;
    };
    expect(mod.DEFAULT_PLAYER_MODEL).toBe('deepseek/deepseek-v4-pro');
    expect(mod.ALT_PLAYER_MODEL).toBe('qwen/qwen3-235b-a22b-2507');
    expect(mod.openRouterPlayerModel()).toBe('deepseek/deepseek-v4-pro');
    expect(mod.openRouterPlayerModel()).not.toMatch(/flash/i);

    process.env.AI_PLAYER_MODEL = 'qwen/qwen3-235b-a22b-2507';
    expect(mod.openRouterPlayerModel()).toBe('qwen/qwen3-235b-a22b-2507');

    process.env.AI_PLAYER_MODEL = 'anthropic/claude-sonnet-4.6';
    expect(mod.testerOnlyForModel()).toBe(true);
    process.env.AI_PLAYER_MODEL = 'deepseek/deepseek-v4-pro';
    expect(mod.testerOnlyForModel()).toBe(false);
  });

  it('tester meta shape and aitest- save id', async () => {
    const { buildTesterMeta, makeAiTestSaveId, isAiTestSaveId, AI_TESTER_EMAIL, AI_TESTER_INPUT_AUTHOR } =
      await load('scripts/ai-player-browser/testerMeta.mjs') as {
        buildTesterMeta: (o: { model: string }) => Record<string, string>;
        makeAiTestSaveId: (s?: string) => string;
        isAiTestSaveId: (s: string) => boolean;
        AI_TESTER_EMAIL: string;
        AI_TESTER_INPUT_AUTHOR: string;
      };
    expect(AI_TESTER_EMAIL).toBe('ai-player@synapticgm.com');
    expect(AI_TESTER_INPUT_AUTHOR).toBe('ai-player');
    const id = makeAiTestSaveId('run-1');
    expect(id).toBe('aitest-run-1');
    expect(isAiTestSaveId(id)).toBe(true);
    const meta = buildTesterMeta({ model: 'deepseek/deepseek-v4-pro' });
    expect(meta).toEqual({
      source: 'ai-tester:deepseek/deepseek-v4-pro',
      input_author: 'ai-player',
      player_model: 'deepseek/deepseek-v4-pro',
      player_licence: 'open',
    });
    const restricted = buildTesterMeta({ model: 'google/gemini-2.5-pro' });
    expect(restricted.player_licence).toBe('restricted');
    expect(restricted.source).toBe('ai-tester:google/gemini-2.5-pro');
  });

  it('persona prompt contains the goal', async () => {
    const { loadPersona, buildPersonaPromptBlock, parsePersonaArgs } = await load(
      'scripts/ai-player-browser/persona.mjs',
    ) as {
      loadPersona: (o: { personaId?: string; goal?: string }) => { id: string; goal: string; name: string };
      buildPersonaPromptBlock: (p: { id?: string; name?: string; goal?: string; blurb?: string }) => string;
      parsePersonaArgs: (a: string[]) => { personaId: string; goal: string };
    };
    const args = parsePersonaArgs(['--persona', 'dungeon-diver', '--goal', 'max out dungeon levels']);
    expect(args).toEqual({ personaId: 'dungeon-diver', goal: 'max out dungeon levels' });
    const persona = loadPersona(args);
    const block = buildPersonaPromptBlock(persona);
    expect(block).toContain('LIFE-GOAL: max out dungeon levels');
    expect(block.toLowerCase()).toContain('dungeon');

    const trades = loadPersona({
      personaId: 'tradesman',
      goal: 'take up a trade and open a shop',
    });
    expect(buildPersonaPromptBlock(trades)).toContain('take up a trade and open a shop');
  });

  it('parse chip vs free action', async () => {
    const { parsePlaytesterDecision } = await load('scripts/ai-player-browser/geminiTab.mjs') as {
      parsePlaytesterDecision: (raw: string, opts?: { chips?: string[] }) => {
        kind: string;
        action_kind: string;
        action: string;
        thumb: string;
        reason: string;
      };
    };
    const chips = ['Look around', 'Ask what they want'];
    const chip = parsePlaytesterDecision(
      JSON.stringify({
        action: 'Look around',
        kind: 'chip',
        thumb: 'up',
        reason: 'clear beat',
      }),
      { chips },
    );
    expect(chip.kind).toBe('chip');
    expect(chip.action_kind).toBe('chip');
    expect(chip.action).toBe('Look around');
    expect(chip.thumb).toBe('up');
    expect(chip.reason).toBe('clear beat');

    const free = parsePlaytesterDecision(
      JSON.stringify({
        action: 'I walk toward the door.',
        kind: 'free',
        thumb: 'down',
        reason: 'telegram speak',
      }),
      { chips },
    );
    expect(free.kind).toBe('free');
    expect(free.action_kind).toBe('type');
    expect(free.action).toBe('I walk toward the door.');
    expect(free.thumb).toBe('down');
    expect(free.reason).toBe('telegram speak');
  });

  it('thumb reason passed to submitThumb', async () => {
    const { pressThumbWithReason, submitThumbArgs, thumbReasonFromDecision } = await load(
      'scripts/ai-player-browser/feedbackVerify.mjs',
    ) as {
      pressThumbWithReason: (
        page: unknown,
        decision: object,
        fn: (p: unknown, o: { thumb: string; comment: string }) => Promise<{ ok: boolean }>,
      ) => Promise<{ ok: boolean; thumb: string; comment: string; reason: string }>;
      submitThumbArgs: (d: object) => { thumb: string; comment: string };
      thumbReasonFromDecision: (d: object) => string;
    };
    const decision = { thumb: 'down', reason: 'looping stitch' };
    expect(thumbReasonFromDecision(decision)).toBe('looping stitch');
    expect(submitThumbArgs(decision)).toEqual({
      thumb: 'down',
      comment: 'looping stitch',
    });

    const submitThumb = vi.fn(async (_page: unknown, opts: { thumb: string; comment: string }) => {
      expect(opts.comment).toBe('looping stitch');
      expect(opts.thumb).toBe('down');
      return { ok: true };
    });
    const result = await pressThumbWithReason({}, decision, submitThumb);
    expect(submitThumb).toHaveBeenCalledTimes(1);
    expect(result.reason).toBe('looping stitch');
    expect(result.comment).toBe('looping stitch');
  });

  it('read-back verify true on matching row and false on missing', async () => {
    const { verifyFeedbackRow } = await load('scripts/ai-player-browser/feedbackVerify.mjs') as {
      verifyFeedbackRow: (
        client: unknown,
        q: { saveId: string; turn: number },
      ) => Promise<{ verified: boolean; reason?: string }>;
    };

    function mockClient(row: Record<string, unknown> | null) {
      const state = { saveId: '', turn: NaN as number };
      const q = {
        select() { return this; },
        eq(col: string, val: unknown) {
          if (col === 'save_id') state.saveId = String(val);
          if (col === 'turn_number') state.turn = Number(val);
          return this;
        },
        limit() { return this; },
        async maybeSingle() {
          if (
            row
            && state.saveId === row.save_id
            && state.turn === row.turn_number
          ) {
            return { data: row, error: null };
          }
          return { data: null, error: null };
        },
      };
      return {
        from(table: string) {
          expect(table).toBe('gm_response_feedback');
          return q;
        },
      };
    }

    const hit = await verifyFeedbackRow(
      mockClient({
        id: 'fb-1',
        save_id: 'aitest-run-1',
        turn_number: 3,
        feedback_type: 'negative',
        comment: 'loop',
      }),
      { saveId: 'aitest-run-1', turn: 3 },
    );
    expect(hit.verified).toBe(true);

    const miss = await verifyFeedbackRow(
      mockClient(null),
      { saveId: 'aitest-missing', turn: 99 },
    );
    expect(miss.verified).toBe(false);
  });

  it('play-log line format (wanted / did / happened + thumb + reason)', async () => {
    const { formatPlayLogLine } = await load('scripts/ai-player-browser/playLog.mjs') as {
      formatPlayLogLine: (e: {
        turn: number;
        wanted: string;
        did: string;
        happened: string;
        thumb: string;
        reason: string;
      }) => string;
    };
    const line = formatPlayLogLine({
      turn: 2,
      wanted: 'max out dungeon levels',
      did: 'Descend the stair',
      happened: 'The stair opened onto a colder hall.',
      thumb: 'up',
      reason: 'clear progress',
    });
    expect(line).toMatch(/^T2: /);
    expect(line).toContain('You wanted max out dungeon levels.');
    expect(line).toContain('You did Descend the stair.');
    expect(line).toContain('Then The stair opened onto a colder hall.');
    expect(line).toContain('Thumb: up — clear progress');
  });

  it('persona block is included in the player prompt builder', async () => {
    const { buildPlaytesterPrompt } = await load('scripts/ai-player-browser/geminiTab.mjs') as {
      buildPlaytesterPrompt: (p: Record<string, unknown>) => string;
    };
    const { buildPersonaPromptBlock } = await load('scripts/ai-player-browser/persona.mjs') as {
      buildPersonaPromptBlock: (p: { name: string; goal: string }) => string;
    };
    const personaBlock = buildPersonaPromptBlock({
      name: 'dungeon-diver',
      goal: 'max out dungeon levels',
    });
    const prompt = buildPlaytesterPrompt({
      bibleId: 'summoned-pact',
      modeLabel: 'LitRPG',
      turn: 1,
      chipsOnly: false,
      chips: ['Look around'],
      lastPlayer: '',
      recentActions: ['Look around'],
      gmStory: 'Dust hung in the hall.',
      lastGm: '',
      hallAnswered: {},
      personaBlock,
      goal: 'max out dungeon levels',
    });
    expect(prompt).toContain('max out dungeon levels');
    expect(prompt).toContain('Look around');
    expect(prompt).toContain('WHAT YOU ALREADY DID THIS SCENE');
  });
});
