/**
 * Batch 09a — historically Free-via-Fireworks. T10K moved Free to OpenRouter DeepSeek;
 * this file keeps the Mid-writer / re-ask locks and asserts the new Free path.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from './modelIds';
import { FREE_WRITER_OPENROUTER_MODEL } from './openRouterChat';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';

const playPrivileges = readFileSync(
  resolve(__dirname, '../../supabase/functions/_shared/playPrivileges.ts'),
  'utf8'
);
const gmTurn = readFileSync(resolve(__dirname, '../../supabase/functions/gm-turn/index.ts'), 'utf8');

describe('09a — Free hosted OpenRouter routing (no network; was Fireworks)', () => {
  it('HUD/BUILD at or after 09a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-09a').toBe(true);
    expect(BUILD_STAMP >= '2026-09-09a').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('default Free catalog id is OpenRouter DeepSeek V4.1 Flash', () => {
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe(FREE_WRITER_OPENROUTER_MODEL);
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    expect(SUBSCRIPTION_TIERS.mid.writerOpenRouterId).toBe('anthropic/claude-haiku-4.5');
    expect(SUBSCRIPTION_TIERS.high.writerOpenRouterId).toBe('anthropic/claude-sonnet-4.6');
  });

  it('edge Free clamp and gm-turn use OpenRouter, not Fireworks', () => {
    expect(playPrivileges).toContain('FREE_WRITER_OPENROUTER_MODEL');
    expect(gmTurn).not.toContain('FIREWORKS_API_KEY');
    expect(gmTurn).not.toContain('FIREWORKS_INFERENCE_BASE');
    expect(gmTurn).not.toContain('fireworksChatBody');
    expect(gmTurn).toContain('OPENROUTER_API_KEY');
  });

  it('empty-GM re-asks the same model once (28l: never a model switch, no Mid writer)', () => {
    expect(gmTurn).not.toContain('meta-llama/llama-3.1-8b-instruct');
    expect(gmTurn).toContain('NO_REASONING_HINT');
    expect(gmTurn).toContain('WRITER_REASK_MAX_TOKENS');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});
