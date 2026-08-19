import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock('@/game/capacityLedger', () => ({
  canSpend: vi.fn(() => true),
  spendCapacity: vi.fn(),
}));

import { generateComicImage } from './openRouterService';
import { createDefaultSettings } from '@/game/defaults';
import { canSpend } from '@/game/capacityLedger';

describe('hosted memorable art — Free without browser keys', () => {
  beforeEach(() => {
    vi.mocked(canSpend).mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('still POSTs generate-image for the opener when weekly cap is 0', async () => {
    vi.mocked(canSpend).mockReturnValue(false);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toMatch(/\/functions\/v1\/generate-image$/);
      const body = JSON.parse(String(init?.body ?? '{}')) as { model?: string };
      expect(body.model).toBe('black-forest-labs/flux-schnell');
      return new Response(JSON.stringify({ url: 'https://img.test/opener.png' }), {
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
      openrouterApiKey: '',
      fluxApiKey: '',
      imageApiKey: '',
      imageProvider: 'flux' as const,
    };

    const url = await generateComicImage('Sevenfold Circle under a cathedral vault', 'adult', settings, {
      memorableMoment: true,
      bypassCapacity: true,
      useRawPrompt: true,
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(url).toBe('https://img.test/opener.png');
  });

  it('throws a hosted error on generate-image 404 instead of returning null', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: 'Missing function' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const settings = {
      ...createDefaultSettings(),
      subscriptionTier: 'free' as const,
      visualMode: 'classic' as const,
      classicMemorableImages: true,
      openrouterApiKey: '',
      imageProvider: 'flux' as const,
    };

    await expect(
      generateComicImage('Sevenfold Circle under a cathedral vault', 'adult', settings, {
        memorableMoment: true,
        useRawPrompt: true,
      })
    ).rejects.toThrow(/image proxy error 404|hosted image service is unavailable/i);
  });
});
