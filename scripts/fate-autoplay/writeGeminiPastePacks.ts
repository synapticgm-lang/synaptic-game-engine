/**
 * Write Gemini Pro morning paste packs only (no API calls).
 * Usage: vite-node scripts/fate-autoplay/writeGeminiPastePacks.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildGameVibePaceCriticPrompt,
  buildStoryStandaloneCriticPrompt,
} from '../../src/game/criticDualReview';

const ROOT = process.cwd();
const OUT = join(ROOT, 'scripts/fate-autoplay/runs/morning-review-2026-08-30/gemini-prompts');

const RUNS = [
  {
    id: 'system-integration',
    dir: 'scripts/fate-autoplay/runs/2026-08-29T22-00-25-590Z_system-integration_cold-system_s100',
  },
  {
    id: 'summoned-pact',
    dir: 'scripts/fate-autoplay/runs/2026-08-29T23-16-30-015Z_summoned-pact_cold-system_s101',
  },
  {
    id: 'hero-awakening',
    dir: 'scripts/fate-autoplay/runs/2026-08-30T00-32-21-001Z_hero-awakening_cold-system_s102',
  },
];

function extractTranscript(storyPath: string): string {
  const raw = readFileSync(storyPath, 'utf8');
  const idx = raw.search(/^## Transcript\s*$/m);
  return idx < 0 ? raw : raw.slice(idx);
}

function truncate(body: string, maxChars = 120_000): string {
  if (body.length <= maxChars) return body;
  return (
    body.slice(0, Math.floor(maxChars * 0.55)) +
    '\n\n…[truncated middle]…\n\n' +
    body.slice(-Math.floor(maxChars * 0.4))
  );
}

const jsonTail =
  '\n\n---\nAfter the prose review, also emit a JSON block:\n' +
  '```json\n{"p0":[{"title":"…","turns":[1],"quote":"…","owner":"proseWarden|choicePad|arcDirector|craft|opening|other"}],"pass":false}\n```\n';

mkdirSync(OUT, { recursive: true });

for (const r of RUNS) {
  const runDir = join(ROOT, r.dir);
  const storyPath = existsSync(join(runDir, 'story-for-gemini.md'))
    ? join(runDir, 'story-for-gemini.md')
    : join(runDir, 'transcript.md');
  const meta = existsSync(join(runDir, 'meta.json'))
    ? (JSON.parse(readFileSync(join(runDir, 'meta.json'), 'utf8')) as Record<string, unknown>)
    : {};
  const summary = existsSync(join(runDir, 'summary.json'))
    ? (JSON.parse(readFileSync(join(runDir, 'summary.json'), 'utf8')) as Record<string, unknown>)
    : {};

  const bibleTitle = String(meta.bibleTitle ?? summary.bibleTitle ?? r.id);
  const engineMode = String(meta.engineMode ?? summary.engineMode ?? 'litrpg');
  const turns = Number(meta.completedTurns ?? summary.completedTurns ?? 50);
  const writerModel =
    typeof meta.writer === 'object' && meta.writer && 'model' in (meta.writer as object)
      ? String((meta.writer as { model?: string }).model ?? 'google/gemini-2.5-flash-lite')
      : 'google/gemini-2.5-flash-lite';
  const agent = String(meta.aiAgentMode ?? summary.aiAgentMode ?? 'default');
  const body = truncate(extractTranscript(storyPath));

  const lenses = [
    {
      key: 'story-standalone',
      brief: buildStoryStandaloneCriticPrompt({ bibleTitle, engineMode, turns, writerModel, agent }),
    },
    {
      key: 'game-vibe-pace',
      brief: buildGameVibePaceCriticPrompt({ bibleTitle, engineMode, turns, writerModel, agent }),
    },
  ] as const;

  for (const lens of lenses) {
    const name = `${r.id}__${lens.key}__GEMINI-PRO-PASTE.md`;
    const text = [
      `# PASTE INTO GEMINI PRO — ${bibleTitle} — ${lens.key}`,
      '',
      'Manual morning review. Do **not** use OpenRouter. Paste this entire file into Gemini Pro.',
      '',
      'Judge both as requested: this pack is one lens — run **both** packs for this premade (story + game vibe/pace).',
      '',
      lens.brief,
      '',
      '---',
      '',
      `## Run folder`,
      '',
      `\`${r.dir}\``,
      '',
      body,
      jsonTail,
    ].join('\n');
    writeFileSync(join(OUT, name), text, 'utf8');

    // Also refresh dual-review paste beside the run
    const dr = join(runDir, 'dual-review');
    mkdirSync(dr, { recursive: true });
    writeFileSync(join(dr, `${lens.key}__gemini-pro-PASTE.md`), text, 'utf8');
    console.log('wrote', name);
  }
}

writeFileSync(
  join(OUT, 'README.md'),
  [
    '# Gemini Pro morning paste packs',
    '',
    'For each of the **3 real Fate tapes**, paste **both** files into Gemini Pro (two chats or two turns):',
    '',
    '1. `*__story-standalone__GEMINI-PRO-PASTE.md` — book / story quality',
    '2. `*__game-vibe-pace__GEMINI-PRO-PASTE.md` — game vibe, pace, Free hook',
    '',
    'Premades: `system-integration`, `summoned-pact`, `hero-awakening`.',
    '',
    'No OpenRouter. No auto API. Save Gemini replies next to these files if you want.',
    '',
  ].join('\n'),
  'utf8'
);
console.log('done →', OUT);
