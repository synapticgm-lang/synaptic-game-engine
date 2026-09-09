/**
 * Batch 09a — Free hosted writer via Fireworks (transport swap only).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';
import { STAGNATION_MID_WRITER_ENABLED, resolveFreeWriterFailover } from './writerPolicy';
import { FREE_WRITER_FIREWORKS_MODEL, hostedWriterProvider } from './openRouterChat';

const playPrivileges = readFileSync(
  resolve(__dirname, '../../supabase/functions/_shared/playPrivileges.ts'),
  'utf8'
);
const gmTurn = readFileSync(resolve(__dirname, '../../supabase/functions/gm-turn/index.ts'), 'utf8');

describe('09a — Free hosted Fireworks routing (no network)', () => {
  it('HUD/BUILD are 2026-09-09a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-09a');
    expect(BUILD_STAMP).toBe('2026-09-09a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('default Free catalog id is Fireworks V4 Flash', () => {
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe(FREE_WRITER_FIREWORKS_MODEL);
    expect(hostedWriterProvider(SUBSCRIPTION_TIERS.free.writerOpenRouterId)).toBe('fireworks');
    expect(SUBSCRIPTION_TIERS.mid.writerOpenRouterId).toBe('anthropic/claude-haiku-4.5');
    expect(SUBSCRIPTION_TIERS.high.writerOpenRouterId).toBe('anthropic/claude-sonnet-4.6');
    expect(hostedWriterProvider(SUBSCRIPTION_TIERS.mid.writerOpenRouterId)).toBe('openrouter');
    expect(hostedWriterProvider(SUBSCRIPTION_TIERS.high.writerOpenRouterId)).toBe('openrouter');
  });

  it('edge Free clamp and gm-turn use Fireworks, not OpenRouter DeepSeek', () => {
    expect(playPrivileges).toContain('FREE_WRITER_FIREWORKS_MODEL');
    expect(playPrivileges).not.toContain("const FREE_WRITER_OPENROUTER = 'deepseek/deepseek-v4-flash-0731'");
    expect(gmTurn).toContain('FIREWORKS_API_KEY');
    expect(gmTurn).toContain('FIREWORKS_INFERENCE_BASE');
    expect(gmTurn).toContain('fireworksChatBody');
    expect(gmTurn).not.toMatch(/provider === 'openrouter'\s*\n\s*\? 'deepseek\/deepseek-v4-flash-0731'/);
  });

  it('empty-GM failover stays Llama on OpenRouter (no Mid writer)', () => {
    expect(resolveFreeWriterFailover(FREE_WRITER_FIREWORKS_MODEL)).toBe(
      'meta-llama/llama-3.1-8b-instruct'
    );
    expect(gmTurn).toContain('meta-llama/llama-3.1-8b-instruct');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});
