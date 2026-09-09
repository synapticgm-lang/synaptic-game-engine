/**
 * Ask Gemini Pro how it would write four flagship page-1 openings (craft lesson).
 * Standalone — do not import geminiReview.ts (its CLI entry fires under vite-node).
 *
 *   npm run opening-stitch-teach
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { extractChatCompletionText, openRouterChatHeaders } from '../../src/game/openRouterChat';
import { loadDotEnv } from './loadDotEnv';

const PACK = join(
  process.cwd(),
  'scripts/fate-autoplay/runs/gemini-paste-2026-09-09b-openings/TEACH-GOLD-INTRO__gemini-pro-PASTE.md'
);

const MODEL = 'google/gemini-2.5-pro';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const TEACH_SYSTEM = [
  'You are a craft teacher for playable RPG first pages.',
  'Ignore T50, Free-hook, book-score, and STOP-early rubrics.',
  'Write gold intros the team can learn from. Explain the sentence jobs.',
  'Keep HERE / CAST / WHY. No System chrome, no HP bars, no numbered lists, no granted kit.',
  'End with REVIEW_COMPLETE.',
].join(' ');

async function main(): Promise<void> {
  loadDotEnv();
  const apiKey = (
    process.env.OPENROUTER_API_KEY
    ?? process.env.VITE_OPENROUTER_API_KEY
    ?? process.env.AUTOPLAY_OPENROUTER_API_KEY
    ?? ''
  ).trim();
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is missing. Add it to local .env, or paste TEACH-GOLD-INTRO__gemini-pro-PASTE.md into Gemini Pro yourself.'
    );
  }
  const user = readFileSync(PACK, 'utf8');
  console.log(`[opening-teach] model=${MODEL}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: openRouterChatHeaders(apiKey),
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: TEACH_SYSTEM },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
        max_tokens: 8192,
        reasoning: { effort: 'low', exclude: true },
      }),
    });
  } finally {
    clearTimeout(timer);
  }
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OpenRouter HTTP ${res.status}: ${raw.slice(0, 280)}`);
  }
  const payload = JSON.parse(raw) as unknown;
  const body = extractChatCompletionText(payload);
  if (!body) throw new Error('OpenRouter returned empty text');
  const out = join(dirname(PACK), 'TEACH-GOLD-INTRO__gemini-pro-REPLY.md');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    [
      '# Gemini Pro — opening masterclass',
      '',
      `**Model:** ${MODEL} | **Pack:** \`TEACH-GOLD-INTRO__gemini-pro-PASTE.md\``,
      '',
      'Craft lesson only — this file does not change game code.',
      '',
      '---',
      '',
      body.trim(),
      '',
    ].join('\n'),
    'utf8'
  );
  console.log(`[opening-teach] wrote ${out}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
