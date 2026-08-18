import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock('@/game/capacityLedger', () => ({
  canSpend: () => true,
  spendCapacity: () => {},
}));

import { generateComicImage } from './openRouterService';
import { createDefaultSettings } from '@/game/defaults';

describe('hosted memorable art — Free without browser keys', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('still POSTs generate-image when OpenRouter/Flux client keys are empty', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toMatch(/\/functions\/v1\/generate-image$/);
      return new Response(JSON.stringify({ url: 'https://img.test/chapter-one.png' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.map(String).join(' '));
    });

    const settings = {
      ...createDefaultSettings(),
      subscriptionTier: 'free' as const,
      visualMode: 'classic' as const,
      classicMemorableImages: true,
      openrouterApiKey: '',
      fluxApiKey: '',
      imageApiKey: '',
      geminiApiKey: '',
      imageProvider: 'flux' as const,
    };

    const url = await generateComicImage('Sevenfold Circle under a cathedral vault', 'adult', settings, {
      memorableMoment: true,
      useRawPrompt: true,
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(url).toBe('https://img.test/chapter-one.png');
    expect(logs.join('\n')).not.toMatch(/no OpenRouter API key available/i);
  });

  it('still POSTs generate-image when leftover gemini imageProvider has empty keys', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toMatch(/\/functions\/v1\/generate-image$/);
      return new Response(JSON.stringify({ url: 'https://img.test/gemini-legacy.png' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const settings = {
      ...createDefaultSettings(),
      subscriptionTier: 'free' as const,
      visualMode: 'classic' as const,
      classicMemorableImages: true,
      byokModeEnabled: false,
      openrouterApiKey: '',
      fluxApiKey: '',
      imageApiKey: '',
      geminiApiKey: '',
      aiProvider: 'gemini' as const,
      imageProvider: 'gemini' as const,
    };

    const url = await generateComicImage('Sevenfold Circle under a cathedral vault', 'adult', settings, {
      memorableMoment: true,
      useRawPrompt: true,
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(url).toBe('https://img.test/gemini-legacy.png');
  });
});
