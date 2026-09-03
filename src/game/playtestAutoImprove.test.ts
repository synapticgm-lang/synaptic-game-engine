import { describe, expect, it } from 'vitest';
import { AUTO_IMPROVE_PATCH_ALLOWLIST } from './autoImproveAllowlist';
import {
  AUTOPLAY_HARNESS_DEFAULT_WRITER,
  CURRICULUM_FLAGSHIP_PREMADES,
  FLASH_LITE_OPENROUTER_MODEL,
  clearAutoplayWriterOverride,
  enableAutoplayWriter,
  getAutoplayWriterOverride,
  isClientAutoplayWriter,
  parseAutoplayWriterKind,
  resolveAutoplayCritic,
  resolveFlashLiteAutoplayWriter,
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
    expect(parseAutoplayWriterKind('default')).toBe('default');
    expect(isClientAutoplayWriter('flash-lite')).toBe(true);
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
    expect(story).toMatch(/Free hook bar/);
    expect(story).toMatch(/8–12/);
    expect(vibe).toMatch(/Game vibe/);
    expect(vibe).toMatch(/Free hook/);
    expect(vibe).toMatch(/PLAYER CAPACITY CONTEXT/);
    expect(vibe).toMatch(/\*\*12\*\*/);
    expect(vibe).toMatch(/\+8/);
    expect(vibe).toMatch(/YES\/MAYBE\/NO/);
    expect(vibe).toMatch(/T12/);
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
