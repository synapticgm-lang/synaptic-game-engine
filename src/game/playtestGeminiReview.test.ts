/**
 * Smoke for overnight fate-gemini-review (mocked fetch — no live API call).
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import {
  DEFAULT_GEMINI_REVIEW_MODEL,
  DEFAULT_REVIEW_PROVIDER,
  OPENROUTER_REVIEW_URL,
  STORY_QUALITY_REVIEW_PROMPT,
  collectPasteFiles,
  extractGeminiGenerateText,
  extractOpenRouterReviewText,
  generateGeminiReview,
  generateOpenRouterReview,
  generateReview,
  geminiGenerateUrl,
  inferModeFromName,
  inferReplyFilename,
  inferStampFromPath,
  isGeminiReviewEntry,
  isOpenRouterModelId,
  openRouterReviewBody,
  parseGeminiReviewArgs,
  requireGeminiApiKey,
  requireOpenRouterApiKey,
  resolveReviewModel,
  resolveReviewProvider,
  resolveReviewServiceTier,
  sanitizeForLog,
} from '../../scripts/fate-autoplay/geminiReview';

describe('playtestGeminiReview', () => {
  it('uses the Grok-guide story rubric and default OpenRouter Gemini 2.5 Pro', () => {
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/PLAYER CAPACITY CONTEXT/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/\*\*12\*\*/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/\+8/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/YES \/ MAYBE \/ NO/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/T12/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/Readability/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/Continuity/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/Engagement/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/P0 = stop-early blocker/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/Stop reading early/);
    expect(STORY_QUALITY_REVIEW_PROMPT).toMatch(/Turn number/);
    expect(DEFAULT_REVIEW_PROVIDER).toBe('openrouter');
    expect(DEFAULT_GEMINI_REVIEW_MODEL).toBe('google/gemini-2.5-pro');
    expect(OPENROUTER_REVIEW_URL).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(isOpenRouterModelId('google/gemini-2.5-pro')).toBe(true);
    expect(isOpenRouterModelId('gemini-2.5-pro')).toBe(false);
    expect(resolveReviewModel('')).toBe('google/gemini-2.5-pro');
    expect(resolveReviewModel('google/gemini-2.5-pro')).toBe('google/gemini-2.5-pro');
    expect(resolveReviewModel('gemini-2.5-pro')).toBe('google/gemini-2.5-pro');
    expect(resolveReviewModel('gemini-3.1-pro-preview')).toBe('google/gemini-2.5-pro');
    expect(resolveReviewModel('models/gemini-3.1-pro-preview')).toBe('google/gemini-2.5-pro');
    expect(resolveReviewModel('google/gemini-2.5-flash')).toBe('google/gemini-2.5-flash');
    expect(resolveReviewModel('google/gemini-2.5-pro', 'google')).toBe('gemini-2.5-pro');
    expect(resolveReviewProvider('')).toBe('openrouter');
    expect(resolveReviewProvider('google')).toBe('google');
    expect(resolveReviewServiceTier(true)).toBe('flex');
    expect(resolveReviewServiceTier(false)).toBeUndefined();
    expect(geminiGenerateUrl('')).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'
    );
    expect(geminiGenerateUrl('google/gemini-2.5-pro')).not.toMatch(/key=/);
    expect(parseGeminiReviewArgs(['--model', 'gemini-2.0-flash']).model).toBe('gemini-2.0-flash');
    expect(parseGeminiReviewArgs(['--provider', 'google', '--flex']).provider).toBe('google');
    expect(parseGeminiReviewArgs(['--provider', 'google', '--flex']).flex).toBe(true);
    expect(openRouterReviewBody({ model: '', system: 's', user: 'u', serviceTier: 'flex' })).toMatchObject({
      model: 'google/gemini-2.5-pro',
      service_tier: 'flex',
      temperature: 0.2,
    });
  });

  it('treats vite-node npm entry as direct invoke even when argv omits geminiReview', () => {
    const meta = pathToFileURL(join(process.cwd(), 'scripts/fate-autoplay/geminiReview.ts')).href;
    const viteNodeArgv = [
      'node',
      join(process.cwd(), 'node_modules/vite-node/vite-node.mjs'),
      '--config',
      'vite.config.ts',
      '--',
      '--dir',
      'packs',
    ];
    expect(viteNodeArgv.some((a) => /geminiReview/i.test(a))).toBe(false);
    expect(isGeminiReviewEntry(viteNodeArgv, meta)).toBe(true);

    expect(
      isGeminiReviewEntry(
        ['node', join(process.cwd(), 'scripts/fate-autoplay/geminiReview.ts'), '--dir', 'packs'],
        meta
      )
    ).toBe(true);

    expect(
      isGeminiReviewEntry(
        ['node', join(process.cwd(), 'node_modules/vitest/vitest.mjs'), 'run', 'src/game/playtestGeminiReview.test.ts'],
        meta
      )
    ).toBe(false);

    expect(isGeminiReviewEntry()).toBe(false);
  });

  it('infers reply names from 4×T50 paste packs', () => {
    expect(inferModeFromName('01-LITRPG__story-standalone__gemini-pro-PASTE.md')).toBe('litrpg');
    expect(inferModeFromName('02-DND__story-standalone__gemini-pro-PASTE.md')).toBe('dnd');
    expect(inferModeFromName('03-RPG__story-standalone__gemini-pro-PASTE.md')).toBe('rpg');
    expect(inferModeFromName('04-PYOA__story-standalone__gemini-pro-PASTE.md')).toBe('pyoa');
    expect(
      inferReplyFilename(
        'scripts/fate-autoplay/runs/gemini-paste-2026-09-02f-t50/01-LITRPG__story-standalone__gemini-pro-PASTE.md',
        '02f'
      )
    ).toBe('gemini-01-litrpg-story-02f-reply.md');
    expect(inferStampFromPath('scripts/fate-autoplay/runs/gemini-paste-2026-09-02f-t50', undefined, '')).toBe(
      '02f'
    );
    expect(parseGeminiReviewArgs(['--dir', 'packs', '--stamp', '02f']).stamp).toBe('02f');
  });

  it('collects story paste packs and skips HOW-TO / BOTH / game lens', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sgm-gemini-review-'));
    writeFileSync(join(dir, 'HOW-TO-PASTE.md'), '# how\n', 'utf8');
    writeFileSync(join(dir, '01-LITRPG__story-standalone__gemini-pro-PASTE.md'), '# litrpg\n', 'utf8');
    writeFileSync(join(dir, '02-DND__story-standalone__gemini-pro-PASTE.md'), '# dnd\n', 'utf8');
    writeFileSync(join(dir, 'BOTH-story-then-game__gemini-pro-PASTE.md'), '# both\n', 'utf8');
    writeFileSync(join(dir, 'game-vibe-pace__gemini-pro-PASTE.md'), '# game\n', 'utf8');
    const files = collectPasteFiles(dir, false).map((p) => p.replace(/\\/g, '/'));
    expect(files.some((p) => p.endsWith('01-LITRPG__story-standalone__gemini-pro-PASTE.md'))).toBe(true);
    expect(files.some((p) => p.endsWith('02-DND__story-standalone__gemini-pro-PASTE.md'))).toBe(true);
    expect(files.some((p) => /HOW-TO|BOTH|game-vibe/i.test(p))).toBe(false);
  });

  it('fails clearly when review keys are missing and never logs a secret', () => {
    const prevGemini = process.env.GEMINI_API_KEY;
    const prevOr = process.env.OPENROUTER_API_KEY;
    const prevVite = process.env.VITE_OPENROUTER_API_KEY;
    const prevAuto = process.env.AUTOPLAY_OPENROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.VITE_OPENROUTER_API_KEY;
    delete process.env.AUTOPLAY_OPENROUTER_API_KEY;
    try {
      expect(() => requireGeminiApiKey()).toThrow(/GEMINI_API_KEY is missing/);
      expect(() => requireGeminiApiKey()).toThrow(/Do not pass the key/);
      expect(() => requireOpenRouterApiKey()).toThrow(/OPENROUTER_API_KEY is missing/);
      expect(() => requireOpenRouterApiKey()).toThrow(/Do not pass the key/);
    } finally {
      if (prevGemini !== undefined) process.env.GEMINI_API_KEY = prevGemini;
      else delete process.env.GEMINI_API_KEY;
      if (prevOr !== undefined) process.env.OPENROUTER_API_KEY = prevOr;
      else delete process.env.OPENROUTER_API_KEY;
      if (prevVite !== undefined) process.env.VITE_OPENROUTER_API_KEY = prevVite;
      else delete process.env.VITE_OPENROUTER_API_KEY;
      if (prevAuto !== undefined) process.env.AUTOPLAY_OPENROUTER_API_KEY = prevAuto;
      else delete process.env.AUTOPLAY_OPENROUTER_API_KEY;
    }
    const leakedStudio = 'AIzaSyFakeTestTokenNotReal00';
    const leakedOr = 'sk-or-v1-FakeTestTokenNotReal000000';
    expect(sanitizeForLog(`url?key=${leakedStudio} x-goog-api-key: ${leakedStudio}`, leakedStudio)).not.toContain(
      leakedStudio
    );
    expect(sanitizeForLog(`Authorization: Bearer ${leakedOr}`, leakedOr)).not.toContain(leakedOr);
    expect(sanitizeForLog(`Authorization: Bearer ${leakedOr}`, leakedOr)).toMatch(/\[redacted\]/);
  });

  it('extracts generateContent text and calls a mocked AI Studio fetch (no live API)', async () => {
    expect(
      extractGeminiGenerateText({
        candidates: [
          {
            content: {
              parts: [{ thought: true, text: 'thinking' }, { text: 'Book score: 4/10\nREVIEW_COMPLETE' }],
            },
          },
        ],
      })
    ).toBe('Book score: 4/10\nREVIEW_COMPLETE');

    let sawKeyHeader = false;
    const text = await generateGeminiReview({
      apiKey: 'test-mock-key-not-real',
      model: 'gemini-3.1-pro-preview',
      system: STORY_QUALITY_REVIEW_PROMPT,
      user: '### Turn 0 — Narration\nA vault under fire.',
      fetchImpl: async (input, init) => {
        const url = String(input);
        expect(url).toContain('generativelanguage.googleapis.com');
        expect(url).toContain('gemini-3.1-pro-preview');
        expect(url).not.toMatch(/key=/);
        expect(url).not.toContain('test-mock-key-not-real');
        const headers = init?.headers as Record<string, string>;
        sawKeyHeader = headers['x-goog-api-key'] === 'test-mock-key-not-real';
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          systemInstruction?: { parts?: Array<{ text?: string }> };
        };
        expect(body.systemInstruction?.parts?.[0]?.text).toMatch(/Readability/);
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Verdict: keep reading.\nREVIEW_COMPLETE' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
    });
    expect(sawKeyHeader).toBe(true);
    expect(text).toMatch(/REVIEW_COMPLETE/);
  });

  it('calls mocked OpenRouter chat completions as the default critic (no live API)', async () => {
    expect(
      extractOpenRouterReviewText({
        choices: [{ message: { content: 'Book score: 3/10\nREVIEW_COMPLETE' } }],
      })
    ).toBe('Book score: 3/10\nREVIEW_COMPLETE');

    let sawAuth = false;
    let sawReferer = false;
    const text = await generateOpenRouterReview({
      apiKey: 'sk-or-v1-FakeTestTokenNotReal000000',
      model: 'gemini-2.5-pro',
      system: STORY_QUALITY_REVIEW_PROMPT,
      user: '### Turn 0 — Narration\nA vault under fire.',
      serviceTier: 'flex',
      fetchImpl: async (input, init) => {
        const url = String(input);
        expect(url).toBe(OPENROUTER_REVIEW_URL);
        expect(url).not.toContain('sk-or-v1-');
        const headers = init?.headers as Record<string, string>;
        sawAuth = headers.Authorization === 'Bearer sk-or-v1-FakeTestTokenNotReal000000';
        sawReferer = headers['HTTP-Referer'] === 'https://synapticgm.app';
        expect(headers['X-Title']).toBe('SynapticGM');
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          model?: string;
          service_tier?: string;
          messages?: Array<{ role?: string; content?: string }>;
        };
        expect(body.model).toBe('google/gemini-2.5-pro');
        expect(body.service_tier).toBe('flex');
        expect(body.messages?.[0]?.content).toMatch(/Readability/);
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Verdict: stop early.\nREVIEW_COMPLETE' } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
    });
    expect(sawAuth).toBe(true);
    expect(sawReferer).toBe(true);
    expect(text).toMatch(/REVIEW_COMPLETE/);

    const dispatched = await generateReview({
      provider: 'openrouter',
      apiKey: 'sk-or-v1-FakeTestTokenNotReal000000',
      model: DEFAULT_GEMINI_REVIEW_MODEL,
      system: 's',
      user: 'u',
      fetchImpl: async (input) => {
        expect(String(input)).toBe(OPENROUTER_REVIEW_URL);
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'REVIEW_COMPLETE' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
    });
    expect(dispatched).toBe('REVIEW_COMPLETE');
  });
});
