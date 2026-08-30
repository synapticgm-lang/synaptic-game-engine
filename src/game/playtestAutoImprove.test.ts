import { describe, expect, it } from 'vitest';
import { AUTO_IMPROVE_PATCH_ALLOWLIST } from './autoImproveAllowlist';
import {
  MINIMAX_GATEWAY_FREE_MODEL,
  clearAutoplayWriterOverride,
  enableAutoplayWriter,
  getAutoplayWriterOverride,
  resolveMinimaxAutoplayWriter,
  resolveMinimaxFreeCritic,
} from './autoplayWriter';
import {
  buildGameVibePaceCriticPrompt,
  buildStoryStandaloneCriticPrompt,
} from './criticDualReview';

describe('autoplayWriter + dual critic + auto-improve rails', () => {
  it('requires AI_GATEWAY_API_KEY and never falls back to OpenRouter by default', () => {
    clearAutoplayWriterOverride();
    const prevGw = process.env.AI_GATEWAY_API_KEY;
    const prevOr = process.env.OPENROUTER_API_KEY;
    const prevVite = process.env.VITE_OPENROUTER_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_AI_GATEWAY_API_KEY;
    process.env.OPENROUTER_API_KEY = 'sk-or-test-key';
    try {
      expect(() => resolveMinimaxAutoplayWriter()).toThrow(/AI_GATEWAY_API_KEY/);
    } finally {
      if (prevGw === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = prevGw;
      if (prevOr === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = prevOr;
      if (prevVite === undefined) delete process.env.VITE_OPENROUTER_API_KEY;
      else process.env.VITE_OPENROUTER_API_KEY = prevVite;
      clearAutoplayWriterOverride();
    }
  });

  it('uses Vercel free MiniMax when gateway key exists', () => {
    clearAutoplayWriterOverride();
    const prevGw = process.env.AI_GATEWAY_API_KEY;
    process.env.AI_GATEWAY_API_KEY = 'vercel-test-key';
    try {
      const w = resolveMinimaxAutoplayWriter();
      expect(w.model).toBe(MINIMAX_GATEWAY_FREE_MODEL);
      expect(w.route).toBe('vercel-gateway-free');
      expect(w.baseUrl).toContain('ai-gateway.vercel.sh');
      enableAutoplayWriter('minimax');
      expect(getAutoplayWriterOverride()?.model).toBe(MINIMAX_GATEWAY_FREE_MODEL);
      const c = resolveMinimaxFreeCritic();
      expect(c.model).toBe(MINIMAX_GATEWAY_FREE_MODEL);
      enableAutoplayWriter('default');
      expect(getAutoplayWriterOverride()).toBeNull();
    } finally {
      if (prevGw === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = prevGw;
      clearAutoplayWriterOverride();
    }
  });

  it('builds distinct story vs vibe critic briefs', () => {
    const story = buildStoryStandaloneCriticPrompt({
      bibleTitle: 'The Summoned Pact',
      engineMode: 'litrpg',
      turns: 20,
    });
    const vibe = buildGameVibePaceCriticPrompt({
      bibleTitle: 'The Summoned Pact',
      engineMode: 'litrpg',
      turns: 20,
    });
    expect(story).toMatch(/Standalone story/);
    expect(vibe).toMatch(/Game vibe/);
    expect(vibe).toMatch(/Free hook/);
    expect(story).not.toEqual(vibe);
  });

  it('keeps auto-improve patch allowlist under src/game only', () => {
    expect(AUTO_IMPROVE_PATCH_ALLOWLIST.length).toBeGreaterThan(5);
    for (const p of AUTO_IMPROVE_PATCH_ALLOWLIST) {
      expect(p.startsWith('src/game/')).toBe(true);
      expect(p.includes('wof')).toBe(false);
      expect(p.includes('supabase')).toBe(false);
    }
  });
});
