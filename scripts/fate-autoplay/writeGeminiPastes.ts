/**
 * Paste-only Gemini Pro packs (story + game) — no API calls.
 *   npm run fate-gemini-pastes -- --run-dir <path>
 *   or multiple via --morning (writes the three overnight real tapes)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  buildGameVibePaceCriticPrompt,
  buildStoryStandaloneCriticPrompt,
} from '../../src/game/criticDualReview';
import { narrationOnlyFromTranscriptMarkdown } from '../../src/game/playTranscript';
import { loadDotEnv } from './loadDotEnv';

function extractTranscript(storyPath: string): string {
  const raw = readFileSync(storyPath, 'utf8');
  const idx = raw.search(/^## Transcript\s*$/m);
  if (idx < 0) return raw;
  return raw.slice(idx);
}

function writePastesForRun(runDir: string, outRoot?: string, maxChars = 100_000): void {
  const storyPath = existsSync(join(runDir, 'story-for-gemini.md'))
    ? join(runDir, 'story-for-gemini.md')
    : join(runDir, 'transcript.md');
  if (!existsSync(storyPath)) throw new Error(`No transcript in ${runDir}`);

  const narrationPath = existsSync(join(runDir, 'story-narration-only.md'))
    ? join(runDir, 'story-narration-only.md')
    : null;

  const meta = existsSync(join(runDir, 'meta.json'))
    ? (JSON.parse(readFileSync(join(runDir, 'meta.json'), 'utf8')) as Record<string, unknown>)
    : {};
  const summary = existsSync(join(runDir, 'summary.json'))
    ? (JSON.parse(readFileSync(join(runDir, 'summary.json'), 'utf8')) as Record<string, unknown>)
    : {};

  const bibleTitle = String(meta.bibleTitle ?? summary.bibleTitle ?? '');
  const engineMode = String(meta.engineMode ?? summary.engineMode ?? '');
  const turns = Number(meta.completedTurns ?? summary.completedTurns ?? 0);
  const writerModel =
    typeof meta.writer === 'object' && meta.writer && 'model' in (meta.writer as object)
      ? String((meta.writer as { model?: string }).model ?? '')
      : 'minimax/minimax-m3-free';
  const agent = String(meta.aiAgentMode ?? summary.aiAgentMode ?? 'default');
  const bibleId = String(meta.bibleId ?? summary.bibleId ?? basename(runDir));

  let fullBody = extractTranscript(storyPath);
  let storyBody = narrationPath
    ? extractTranscript(narrationPath)
    : narrationOnlyFromTranscriptMarkdown(fullBody);
  if (fullBody.length > maxChars) {
    fullBody =
      fullBody.slice(0, Math.floor(maxChars * 0.55)) +
      '\n\n…[truncated middle for length]…\n\n' +
      fullBody.slice(-Math.floor(maxChars * 0.4));
  }
  if (storyBody.length > maxChars) {
    storyBody =
      storyBody.slice(0, Math.floor(maxChars * 0.55)) +
      '\n\n…[truncated middle for length]…\n\n' +
      storyBody.slice(-Math.floor(maxChars * 0.4));
  }

  const jsonTail =
    '\n\n---\nAfter your review, also emit:\n```json\n' +
    '{"p0":[{"title":"…","turns":[1],"quote":"…","owner":"proseWarden|choicePad|arcDirector|craft|opening|other"}],"pass":false}\n```\n';

  const storyBrief =
    buildStoryStandaloneCriticPrompt({
      bibleTitle,
      engineMode,
      turns,
      writerModel,
      agent,
    }) +
    '\n\nNOTE: Transcript is **Narration-only**. Ignore Options/STATUS/Craft chrome. Treat `[engine fallback ×N]` as collapsed stubs, not book prose.';
  const gameBrief = buildGameVibePaceCriticPrompt({
    bibleTitle,
    engineMode,
    turns,
    writerModel,
    agent,
  });

  const dualDir = join(runDir, 'dual-review');
  mkdirSync(dualDir, { recursive: true });

  const packs: Array<{ lens: string; brief: string; file: string; body: string }> = [
    {
      lens: 'STORY (standalone book quality — Narration-only)',
      brief: storyBrief,
      file: 'story-standalone__gemini-pro-PASTE.md',
      body: storyBody,
    },
    {
      lens: 'GAME (vibe, pace, agency, mode feel)',
      brief: gameBrief,
      file: 'game-vibe-pace__gemini-pro-PASTE.md',
      body: fullBody,
    },
  ];

  const header = (lens: string) =>
    [
      '# PASTE INTO GEMINI PRO',
      '',
      `**Lens:** ${lens}`,
      `**Premade:** ${bibleTitle} (\`${bibleId}\`)`,
      `**Mode:** ${engineMode}`,
      `**Turns:** ${turns}`,
      `**Writer:** ${writerModel} · Fate agent: ${agent}`,
      '',
      'Paste everything below this line into Gemini Pro. Do one lens per chat (or clearly separate A then B).',
      '',
      '---',
      '',
    ].join('\n');

  const destDirs = [dualDir];
  if (outRoot) {
    const g = join(outRoot, 'gemini-prompts', bibleId);
    mkdirSync(g, { recursive: true });
    destDirs.push(g);
  }

  for (const p of packs) {
    const text = header(p.lens) + p.brief + '\n\n---\n\n' + p.body + jsonTail;
    for (const d of destDirs) {
      writeFileSync(join(d, p.file), text, 'utf8');
    }
  }

  // Combined one-file option: story first, then game (clear separator)
  const combined =
    header('BOTH — do STORY first, then GAME') +
    '## PART A — STORY (Narration-only)\n\n' +
    storyBrief +
    '\n\n---\n\n' +
    storyBody +
    jsonTail +
    '\n\n========== END PART A — START PART B ==========\n\n' +
    '## PART B — GAME VIBE & PACE\n\n' +
    gameBrief +
    '\n\n---\n\n' +
    '(Full transcript with Options/STATUS — re-judge as a **game session**, not only as a book.)\n\n' +
    fullBody +
    jsonTail;

  for (const d of destDirs) {
    writeFileSync(join(d, 'BOTH-story-then-game__gemini-pro-PASTE.md'), combined, 'utf8');
  }

  console.log(`[gemini-pastes] ${bibleId} → story(narration-only) + game + BOTH (${destDirs.join(' | ')})`);
}

function main(): void {
  loadDotEnv();
  const argv = process.argv.slice(2);
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs', 'morning-review-2026-08-30');
  mkdirSync(outRoot, { recursive: true });

  if (argv.includes('--morning') || argv.length === 0) {
    const runs = [
      'scripts/fate-autoplay/runs/2026-08-29T22-00-25-590Z_system-integration_cold-system_s100',
      'scripts/fate-autoplay/runs/2026-08-29T23-16-30-015Z_summoned-pact_cold-system_s101',
      'scripts/fate-autoplay/runs/2026-08-30T00-32-21-001Z_hero-awakening_cold-system_s102',
    ];
    for (const r of runs) {
      if (!existsSync(r)) {
        console.error('missing', r);
        continue;
      }
      writePastesForRun(r, outRoot);
    }
    writeFileSync(
      join(outRoot, 'README-GEMINI.md'),
      [
        '# Morning Gemini Pro reviews',
        '',
        'For each premade, open Gemini Pro and paste **one** of:',
        '',
        '1. `story-standalone__gemini-pro-PASTE.md` — judge as a **book / story**',
        '2. `game-vibe-pace__gemini-pro-PASTE.md` — judge as a **game** (pace, agency, mode vibe)',
        '3. `BOTH-story-then-game__gemini-pro-PASTE.md` — do Part A (story) then Part B (game) in one paste',
        '',
        'Folders: `gemini-prompts/<bible-id>/`',
        '',
        'Also copied into each run’s `dual-review/` folder.',
        '',
      ].join('\n'),
      'utf8'
    );
    return;
  }

  let runDir = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run-dir') runDir = argv[++i] ?? '';
  }
  if (!runDir) {
    console.error('Usage: --morning   OR   --run-dir <path>');
    process.exit(2);
  }
  writePastesForRun(runDir, outRoot);
}

main();
