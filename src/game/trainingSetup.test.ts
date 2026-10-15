import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FIREWORKS_DEEPSEEK_V41_FLASH,
  OPENROUTER_DEEPSEEK_V41_FLASH,
  PENDING_DEEPSEEK_NOTE,
  TRAINING_JUDGE_MODEL,
  TRAINING_SEATS,
  excludedSourceReason,
  legacyRowProvenance,
  modelLicence,
  pinnedModel,
  rowProvenance,
} from './modelIds';
import { readChatCompletion } from './openRouterChat';
import { parseFateArgs, turnProvenance } from './fateAutoplay';

const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('training setup (15 Oct): pinned model ids', () => {
  it('a call with no model goes out on the pinned MIT DeepSeek, never deepseek-chat', () => {
    expect(pinnedModel('openrouter')).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    expect(pinnedModel('openrouter', '  ')).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    expect(pinnedModel('fireworks')).toBe(FIREWORKS_DEEPSEEK_V41_FLASH);
    expect(pinnedModel('openrouter', 'qwen/qwen3-235b-a22b-2507')).toBe('qwen/qwen3-235b-a22b-2507');
    expect(modelLicence(pinnedModel('openrouter')).licence).toBe('MIT');
  });

  it('none of the five old fallback sites names deepseek/deepseek-chat', () => {
    for (const f of [
      'supabase/functions/gm-turn/index.ts',
      'src/game/choicePipeline.ts',
      'src/game/aiService.direct.ts',
      'src/services/llmDirectorService.ts',
      'src/game/openRouterChat.ts',
    ]) {
      expect(src(f), f).not.toMatch(/deepseek\/deepseek-chat/);
    }
  });

  it('the reply records the model id the provider returned', () => {
    const read = readChatCompletion({ model: 'deepseek/deepseek-v4.1-flash-20261001', choices: [{ message: { content: 'Story.' } }] });
    expect(read.servedModel).toBe('deepseek/deepseek-v4.1-flash-20261001');
    expect(readChatCompletion({ choices: [{ message: { content: 'Story.' } }] }).servedModel).toBeUndefined();
  });
});

describe('training setup: seats and judge', () => {
  it('every lap seat and the judge are open-licence', () => {
    for (const id of [...Object.values(TRAINING_SEATS), TRAINING_JUDGE_MODEL]) {
      expect(modelLicence(id).trainable, id).toBe(true);
    }
    expect(src('scripts/fate-autoplay/autoThumbs.mjs')).not.toMatch(/gemini/i);
  });

  it('--seat picks the OpenRouter seat; an unknown seat is refused', () => {
    const qwen = parseFateArgs(['--seat', 'qwen']);
    expect(qwen.writerModel).toBe(TRAINING_SEATS.qwen);
    expect(qwen.writer).toBe('flash-lite');
    expect(parseFateArgs(['--seat', 'GLM']).writerModel).toBe(TRAINING_SEATS.glm);
    expect(() => parseFateArgs(['--seat', 'gemini'])).toThrow(/Unknown --seat/);
  });
});

describe('training setup: provenance on every row', () => {
  it('writes the five fields at the source from the served id', () => {
    const p = turnProvenance(
      { writerUsage: { modelId: FIREWORKS_DEEPSEEK_V41_FLASH, tokensIn: 1, tokensOut: 1, tokensCached: 0, modelCalls: 1 }, engineMode: 'dnd' },
      'ignored/model'
    );
    expect(p).toEqual({ training_ok: true, teacher_model: FIREWORKS_DEEPSEEK_V41_FLASH, provider: 'fireworks', judge_model: null, mode: 'dnd' });
    expect(turnProvenance({ engineMode: 'rpg' }, TRAINING_SEATS.glm)).toMatchObject({ training_ok: true, teacher_model: TRAINING_SEATS.glm, provider: 'openrouter' });
  });

  it('Claude, GPT, Gemini and the old V3 are never training data; an unknown teacher is not either', () => {
    for (const id of ['google/gemini-2.5-flash-lite', 'openai/gpt-5-mini', 'anthropic/claude-haiku-5.5', 'deepseek/deepseek-chat', 'z-ai/glm-5.3', null]) {
      expect(rowProvenance({ teacherModel: id }).training_ok, String(id)).toBe(false);
    }
  });

  it('backfill: old hosted / DeepSeek rows are pending OpenRouter; a Fireworks id stays true', () => {
    expect(legacyRowProvenance({ recordedModel: '(hosted Free via gm-turn)', mode: 'litrpg' })).toEqual({
      training_ok: 'pending',
      teacher_model: null,
      provider: 'openrouter',
      judge_model: null,
      mode: 'litrpg',
      training_note: PENDING_DEEPSEEK_NOTE,
    });
    expect(legacyRowProvenance({ recordedModel: null, hostedFree: true }).training_ok).toBe('pending');
    expect(legacyRowProvenance({ recordedModel: 'deepseek/deepseek-v4-flash-0731' })).toMatchObject({ training_ok: 'pending', teacher_model: 'deepseek/deepseek-v4-flash-0731' });
    expect(legacyRowProvenance({ recordedModel: FIREWORKS_DEEPSEEK_V41_FLASH })).toMatchObject({ training_ok: true, provider: 'fireworks' });
    expect(legacyRowProvenance({ recordedModel: 'openai/gpt-5-mini', judgeModel: 'google/gemini-2.5-pro' })).toMatchObject({
      training_ok: false,
      judge_model: 'google/gemini-2.5-pro',
    });
    expect(legacyRowProvenance({ recordedModel: 'stub/scan' })).toMatchObject({ training_ok: false, provider: 'none' });
  });

  it('HER (community_mega) is refused with its reason', () => {
    expect(excludedSourceReason('community_mega')).toBe('copyrighted novel chapters');
    expect(rowProvenance({ teacherModel: FIREWORKS_DEEPSEEK_V41_FLASH, sourceId: 'community_mega' })).toMatchObject({
      training_ok: false,
      training_note: 'copyrighted novel chapters',
    });
    expect(legacyRowProvenance({ recordedModel: null, sourceId: 'community_mega' }).training_ok).toBe(false);
  });
});
