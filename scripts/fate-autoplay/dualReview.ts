/**
 * Dual critic packs:
 * - Auto: MiniMax free (Vercel AI Gateway only) × story + vibe/pace
 * - Manual: paste-ready Gemini Pro packs for morning (no API call, $0)
 *
 * Batch D: per-lens critic failures do not abort the whole review — pastes always
 * write; INDEX records review-deferred so curriculum does not poison the ladder.
 *
 *   npm run fate-dual-review -- --run-dir scripts/fate-autoplay/runs/<dir>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveMinimaxFreeCritic } from '../../src/game/autoplayWriter';
import {
  buildGameVibePaceCriticPrompt,
  buildStoryStandaloneCriticPrompt,
  type CriticLens,
} from '../../src/game/criticDualReview';
import { narrationOnlyFromTranscriptMarkdown } from '../../src/game/playTranscript';
import { chatCompletion } from './chatCompletion';
import { loadDotEnv } from './loadDotEnv';

function extractTranscript(storyPath: string): string {
  const raw = readFileSync(storyPath, 'utf8');
  const idx = raw.search(/^## Transcript\s*$/m);
  if (idx < 0) return raw;
  return raw.slice(idx);
}

function parseArgs(argv: string[]): { runDir: string; maxChars: number; minimaxOnly: boolean } {
  let runDir = '';
  let maxChars = 120_000;
  let minimaxOnly = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--run-dir' || a === '--dir') runDir = argv[++i] ?? '';
    else if (a === '--max-chars') maxChars = Math.max(20_000, Number(argv[++i]) || 120_000);
    else if (a === '--also-call-gemini') minimaxOnly = false;
  }
  return { runDir, maxChars, minimaxOnly };
}

async function main(): Promise<void> {
  loadDotEnv();
  const { runDir, maxChars, minimaxOnly } = parseArgs(process.argv.slice(2));
  if (!runDir || !existsSync(runDir)) {
    console.error('Usage: npm run fate-dual-review -- --run-dir <fate run folder>');
    process.exit(2);
  }
  if (!minimaxOnly) {
    console.error(
      '[dual-review] --also-call-gemini is disabled for $0 policy. Gemini packs are paste-only (morning).'
    );
    process.exit(2);
  }

  const storyPath = existsSync(join(runDir, 'story-for-gemini.md'))
    ? join(runDir, 'story-for-gemini.md')
    : join(runDir, 'transcript.md');
  if (!existsSync(storyPath)) {
    console.error(`No transcript in ${runDir}`);
    process.exit(2);
  }

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
  const turns = Number(meta.completedTurns ?? summary.completedTurns ?? meta.requestedTurns ?? 0);
  const writerModel =
    typeof meta.writer === 'object' && meta.writer && 'model' in (meta.writer as object)
      ? String((meta.writer as { model?: string }).model ?? '')
      : '';
  const agent = String(meta.aiAgentMode ?? summary.aiAgentMode ?? 'default');

  let fullBody = extractTranscript(storyPath);
  let storyBody = narrationPath
    ? extractTranscript(narrationPath)
    : narrationOnlyFromTranscriptMarkdown(fullBody);
  if (fullBody.length > maxChars) {
    fullBody =
      fullBody.slice(0, Math.floor(maxChars * 0.55)) +
      '\n\n…[truncated middle]…\n\n' +
      fullBody.slice(-Math.floor(maxChars * 0.4));
  }
  if (storyBody.length > maxChars) {
    storyBody =
      storyBody.slice(0, Math.floor(maxChars * 0.55)) +
      '\n\n…[truncated middle]…\n\n' +
      storyBody.slice(-Math.floor(maxChars * 0.4));
  }

  const critic = resolveMinimaxFreeCritic();
  const outDir = join(runDir, 'dual-review');
  mkdirSync(outDir, { recursive: true });

  const lenses: CriticLens[] = ['story-standalone', 'game-vibe-pace'];
  const index: Array<Record<string, string>> = [];
  let criticOk = 0;
  let criticFail = 0;

  const jsonTail =
    '\n\n---\nAfter the prose review, also emit a JSON block:\n' +
    '```json\n{"p0":[{"title":"…","turns":[1],"quote":"…","owner":"proseWarden|choicePad|arcDirector|craft|opening|other"}],"pass":false}\n```\n';

  for (const lens of lenses) {
    const isStory = lens === 'story-standalone';
    const body = isStory ? storyBody : fullBody;
    const brief = isStory
      ? buildStoryStandaloneCriticPrompt({ bibleTitle, engineMode, turns, writerModel, agent }) +
        '\n\nNOTE: Transcript is **Narration-only** (no Options chips, no STATUS). Do NOT judge choice pads as book prose. Treat `[engine fallback ×N]` as collapsed stubs, not chapters.'
      : buildGameVibePaceCriticPrompt({ bibleTitle, engineMode, turns, writerModel, agent });

    // Morning paste pack for Gemini Pro (no API call) — always written
    const pasteName = `${lens}__gemini-pro-PASTE.md`;
    writeFileSync(
      join(outDir, pasteName),
      [
        '# PASTE INTO GEMINI PRO (manual — morning review)',
        '',
        'Do not run this via OpenRouter. Paste the brief + transcript into Gemini Pro yourself.',
        '',
        brief,
        '',
        '---',
        '',
        body,
        jsonTail,
      ].join('\n'),
      'utf8'
    );
    index.push({ file: pasteName, reviewer: 'gemini-pro', route: 'manual-paste', lens });

    // Auto MiniMax free critic — per-lens try/catch (Batch D)
    const file = `${lens}__minimax.md`;
    console.log(`[dual-review] ${file} via ${critic.route} / ${critic.model} ($0)…`);
    try {
      const text = await chatCompletion({
        baseUrl: critic.baseUrl,
        apiKey: critic.apiKey,
        model: critic.model,
        alternateModels: critic.alternateModels,
        system: brief,
        user: body + jsonTail,
        temperature: 0.2,
        maxTokens: 6144,
        maxAttempts: 4,
      });
      writeFileSync(join(outDir, file), text + '\n', 'utf8');
      index.push({ file, reviewer: 'minimax', model: critic.model, route: critic.route, lens, status: 'ok' });
      criticOk += 1;
    } catch (err) {
      criticFail += 1;
      const msg = err instanceof Error ? err.message : String(err);
      writeFileSync(
        join(outDir, file),
        `# Critic deferred\n\n${msg}\n\nGemini paste is ready: ${pasteName}\n`,
        'utf8'
      );
      index.push({
        file,
        reviewer: 'minimax',
        model: critic.model,
        route: critic.route,
        lens,
        status: 'review-deferred',
        error: msg.slice(0, 400),
      });
      console.warn(`[dual-review] ${lens} critic failed — paste kept, continuing`);
    }
  }

  const status =
    criticFail === 0 ? 'ok' : criticOk > 0 ? 'partial' : 'review-deferred';

  writeFileSync(
    join(outDir, 'INDEX.json'),
    JSON.stringify(
      {
        runDir,
        index,
        status,
        criticOk,
        criticFail,
        policy: 'minimax-gateway-free-auto + gemini-pro-manual-paste; no OpenRouter',
        note:
          status === 'ok'
            ? undefined
            : 'Critic transport failed — do not treat as p0=-1 cell fail; queue morning Gemini paste.',
        at: new Date().toISOString(),
      },
      null,
      2
    ) + '\n'
  );
  console.log(`[dual-review] wrote ${index.length} files → ${outDir} (status=${status})`);

  // Exit 0 when pastes exist even if critics deferred — curriculum must not poison ladder.
  // Exit 1 only when both critics failed AND we want auto-improve to skip patch (still 0 for pastes).
  if (status === 'review-deferred') {
    writeFileSync(join(outDir, 'REVIEW_DEFERRED'), `${new Date().toISOString()}\n`, 'utf8');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
