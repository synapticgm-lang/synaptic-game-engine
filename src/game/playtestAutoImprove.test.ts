import { describe, expect, it } from 'vitest';
import { AUTO_IMPROVE_PATCH_ALLOWLIST } from './autoImproveAllowlist';
import {
  AUTOPLAY_HARNESS_DEFAULT_WRITER,
  CURRICULUM_FLAGSHIP_PREMADES,
  FLASH_LITE_OPENROUTER_MODEL,
  MINIMAX_GATEWAY_FREE_MODEL,
  MINIMAX_GATEWAY_FREE_MODEL_ALT,
  clearAutoplayWriterOverride,
  enableAutoplayWriter,
  getAutoplayWriterOverride,
  getFreeWriterRotationState,
  isClientAutoplayWriter,
  parseAutoplayWriterKind,
  resolveAutoplayCritic,
  resolveFlashLiteAutoplayWriter,
  resolveMinimaxAutoplayWriter,
  resolveMinimaxFreeCritic,
  rotateFreeGatewayWriterOnRateLimit,
} from './autoplayWriter';
import {
  buildGameVibePaceCriticPrompt,
  buildStoryStandaloneCriticPrompt,
} from './criticDualReview';

describe('autoplayWriter + dual critic + auto-improve rails', () => {
  it('defaults harness writer to flash-lite and four mode flagships', () => {
    expect(AUTOPLAY_HARNESS_DEFAULT_WRITER).toBe('flash-lite');
    expect(FLASH_LITE_OPENROUTER_MODEL).toBe('google/gemini-2.5-flash-lite');
    expect(CURRICULUM_FLAGSHIP_PREMADES.split(',')).toEqual([
      'summoned-pact',
      'cursed-keep',
      'salt-road-heist',
      'thornferry-road',
    ]);
    expect(parseAutoplayWriterKind('openrouter')).toBe('flash-lite');
    expect(parseAutoplayWriterKind('flash-lite')).toBe('flash-lite');
    expect(parseAutoplayWriterKind('minimax')).toBe('minimax');
    expect(parseAutoplayWriterKind('default')).toBe('default');
    expect(isClientAutoplayWriter('flash-lite')).toBe(true);
    expect(isClientAutoplayWriter('minimax')).toBe(true);
    expect(isClientAutoplayWriter('default')).toBe(false);
  });

  it('requires OPENROUTER_API_KEY for Flash Lite and never uses Gateway by default', () => {
    clearAutoplayWriterOverride();
    const prevGw = process.env.AI_GATEWAY_API_KEY;
    const prevOr = process.env.OPENROUTER_API_KEY;
    const prevVite = process.env.VITE_OPENROUTER_API_KEY;
    const prevAuto = process.env.AUTOPLAY_OPENROUTER_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_AI_GATEWAY_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.VITE_OPENROUTER_API_KEY;
    delete process.env.AUTOPLAY_OPENROUTER_API_KEY;
    try {
      // Vitest may still see VITE_* from import.meta.env (.env.local) — only assert throw when empty.
      let threw = false;
      try {
        resolveFlashLiteAutoplayWriter();
      } catch (e) {
        threw = /OPENROUTER_API_KEY/.test(e instanceof Error ? e.message : String(e));
      }
      if (!threw) {
        // Key present via Vite env — still prove Flash Lite shape.
        const existing = resolveFlashLiteAutoplayWriter();
        expect(existing.model).toBe(FLASH_LITE_OPENROUTER_MODEL);
        expect(existing.route).toBe('openrouter-paid');
      } else {
        expect(threw).toBe(true);
      }
      process.env.OPENROUTER_API_KEY = 'sk-or-test-key';
      const w = resolveFlashLiteAutoplayWriter();
      expect(w.model).toBe(FLASH_LITE_OPENROUTER_MODEL);
      expect(w.route).toBe('openrouter-paid');
      expect(w.baseUrl).toContain('openrouter.ai');
      enableAutoplayWriter('flash-lite');
      expect(getAutoplayWriterOverride()?.model).toBe(FLASH_LITE_OPENROUTER_MODEL);
      const c = resolveAutoplayCritic('flash-lite');
      expect(c.model).toBe(FLASH_LITE_OPENROUTER_MODEL);
      expect(c.reviewer).toBe('flash-lite');
      expect(c.alternateModels).toEqual([]);
    } finally {
      if (prevGw === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = prevGw;
      if (prevOr === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = prevOr;
      if (prevVite === undefined) delete process.env.VITE_OPENROUTER_API_KEY;
      else process.env.VITE_OPENROUTER_API_KEY = prevVite;
      if (prevAuto === undefined) delete process.env.AUTOPLAY_OPENROUTER_API_KEY;
      else process.env.AUTOPLAY_OPENROUTER_API_KEY = prevAuto;
      clearAutoplayWriterOverride();
    }
  });

  it('requires AI_GATEWAY_API_KEY for MiniMax and never falls back to OpenRouter by default', () => {
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

  it('uses Vercel free MiniMax when gateway key exists (--writer minimax)', () => {
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
      expect(c.reviewer).toBe('minimax');
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

  it('rotates between two free Gateway models on 429 (never OpenRouter)', () => {
    clearAutoplayWriterOverride();
    const prevGw = process.env.AI_GATEWAY_API_KEY;
    process.env.AI_GATEWAY_API_KEY = 'vercel-test-key';
    try {
      enableAutoplayWriter('minimax');
      expect(getAutoplayWriterOverride()?.model).toBe(MINIMAX_GATEWAY_FREE_MODEL);
      const next = rotateFreeGatewayWriterOnRateLimit('test');
      expect(next).toBe(MINIMAX_GATEWAY_FREE_MODEL_ALT);
      expect(getAutoplayWriterOverride()?.model).toBe(MINIMAX_GATEWAY_FREE_MODEL_ALT);
      expect(getAutoplayWriterOverride()?.route).toBe('vercel-gateway-free');
      const back = rotateFreeGatewayWriterOnRateLimit('test-2');
      expect(back).toBe(MINIMAX_GATEWAY_FREE_MODEL);
      const rot = getFreeWriterRotationState();
      expect(rot.primary).toBe(MINIMAX_GATEWAY_FREE_MODEL);
      expect(rot.secondary).toBe(MINIMAX_GATEWAY_FREE_MODEL_ALT);
      expect(rot.switchCount).toBe(2);
      const c = resolveMinimaxFreeCritic();
      expect(c.alternateModels).toContain(MINIMAX_GATEWAY_FREE_MODEL_ALT);
      expect(c.alternateModels.every((m) => m.includes('-free'))).toBe(true);
      // Flash Lite path does not rotate Gateway models
      clearAutoplayWriterOverride();
      process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-test-key';
      enableAutoplayWriter('flash-lite');
      expect(rotateFreeGatewayWriterOnRateLimit('noop')).toBeNull();
    } finally {
      if (prevGw === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = prevGw;
      clearAutoplayWriterOverride();
    }
  });
});
