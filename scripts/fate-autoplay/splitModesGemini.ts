/**
 * Rebuild 4 mode-specific Gemini critic packs from an existing modes-agents batch.
 *
 *   npx vite-node --config vite.config.ts scripts/fate-autoplay/splitModesGemini.ts -- --batch-dir <path>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EngineMode } from '../../src/game/types';
import { buildGeminiCriticPrompt } from '../../src/game/geminiCriticPrompt';

type TelRow = {
  index: number;
  engineMode: EngineMode;
  bibleId: string;
  personality: string;
  agent: string;
  seed: number;
  outDir?: string;
  errorCount?: number;
  telemetry?: Record<string, unknown>;
};

const MODE_ORDER: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];

const MODE_LABEL: Record<EngineMode, string> = {
  litrpg: 'LitRPG',
  dnd: 'Tabletop Fantasy',
  rpg: 'Story RPG',
  pyoa: 'Pick Your Own Adventure',
};

function extractTranscriptBody(storyPath: string): string {
  const raw = readFileSync(storyPath, 'utf8');
  const idx = raw.search(/^## Transcript\s*$/m);
  if (idx < 0) return raw;
  return raw.slice(idx).replace(/^## Transcript\s*\n+/, '');
}

function buildModePack(opts: {
  batchId: string;
  batchDir: string;
  outRoot: string;
  turns: number;
  mode: EngineMode;
  rows: TelRow[];
}): { path: string; feedCopy: string; bytes: number } {
  const rows = opts.rows.filter((r) => r.engineMode === opts.mode).sort((a, b) => a.index - b.index);
  if (!rows.length) throw new Error(`No rows for mode ${opts.mode}`);

  const first = rows[0]!;
  const parts: string[] = [];
  parts.push(
    `# SynapticGM critic pack — ${MODE_LABEL[opts.mode]} only (${rows.length} agents × ${opts.turns} turns)`
  );
  parts.push('');
  parts.push('## Batch meta');
  parts.push('');
  parts.push(`- Batch id: ${opts.batchId}`);
  parts.push(`- **This file = one engine mode only:** **${MODE_LABEL[opts.mode]}** (\`${opts.mode}\`)`);
  parts.push(`- Agents in this file: ${rows.map((r) => r.agent).join(', ')}`);
  parts.push(`- Flagship bible: ${first.bibleId}`);
  parts.push(`- Personality: ${first.personality}`);
  parts.push(`- Code baseline: 2026-08-26v+ (client at batch start)`);
  parts.push(`- Exported: ${new Date().toISOString()}`);
  parts.push(
    `- Sibling packs: litrpg / dnd / rpg / pyoa (score THIS mode only — do not grade LitRPG bars on non-LitRPG files)`
  );
  parts.push('');
  parts.push('## Critic prompt (apply to EVERY run below)');
  parts.push('');
  parts.push(
    buildGeminiCriticPrompt({
      bibleTitle: `${MODE_LABEL[opts.mode]} — ${first.bibleId} (3-agent mode pack)`,
      engineMode: opts.mode,
      personalityId: first.personality,
      aiAgentMode: 'storyfollower',
      turns: opts.turns,
      seed: 'see each run Meta',
      level: 'see each run Meta',
      xpLine: 'see each run Meta',
      codeBaseline: `2026-08-26v+; THIS FILE IS ${opts.mode} ONLY — compare the 3 agents, not other engine modes`,
      errorNote: 'Per-run errors in each section Meta',
    })
  );
  parts.push('');
  parts.push(
    [
      `### Extra instructions for this **${MODE_LABEL[opts.mode]}-only** file`,
      '',
      `1. Score **each of the ${rows.length} agent runs separately** (short scorecard table per run), then one within-mode synthesis.`,
      `2. Always name **Game mode = ${MODE_LABEL[opts.mode]}** + **agent mode** in each run verdict.`,
      '3. Compare agents: maxlevel vs storyfollower vs completionist — what fails for all agents is engine; what differs is agent.',
      `4. Judge against **${MODE_LABEL[opts.mode]}** expectations only (wrong-genre bar is a critic error).`,
      '5. Cite only turn numbers that exist in THIS file (each run is 300 turns — do not invent T400+).',
      '6. End with: top 8 fixes for this mode, tagged by which agents they hit.',
      '7. End with `REVIEW_COMPLETE`.',
      '',
    ].join('\n')
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const dir = row.outDir;
    const storyPath = dir ? join(dir, 'story-for-gemini.md') : '';
    const body =
      dir && existsSync(storyPath) ? extractTranscriptBody(storyPath) : '_(missing story-for-gemini.md)_';
    const tel = (row.telemetry ?? {}) as Record<string, unknown>;
    parts.push('---');
    parts.push('');
    parts.push(
      `## Run ${String(i + 1).padStart(2, '0')} of ${rows.length} — ${row.engineMode} / ${row.bibleId} / ${row.agent}`
    );
    parts.push('');
    parts.push('### Run meta');
    parts.push('');
    parts.push(`- Game mode: **${row.engineMode}** (${MODE_LABEL[row.engineMode]})`);
    parts.push(`- Bible: ${row.bibleId}`);
    parts.push(`- Personality: ${row.personality}`);
    parts.push(`- AI agent mode: **${row.agent}**`);
    parts.push(`- Seed: ${row.seed}`);
    parts.push(`- Turns: ${opts.turns}`);
    parts.push(`- Batch cell index: ${row.index}/12`);
    parts.push(`- End Level/XP: ${tel.levelEnd ?? '?'} / ${tel.xpEnd ?? '?'}`);
    parts.push(
      `- Telemetry: STATUS blocks=${tel.statusBlocks ?? 0}, them≈${tel.themWordHits ?? 0}, this-place≈${tel.thisPlaceHits ?? 0}, [Uncommon] them=${tel.uncommonThemHits ?? 0}, gate-queue opts≈${tel.gateQueueOptionHits ?? 0}, Earth-junk opts≈${tel.earthJunkOptionHits ?? 0}, max intent streak=${tel.maxPlayerIntentStreak ?? 0}, errors=${row.errorCount ?? '?'}`
    );
    parts.push(`- Source dir: \`${dir ?? '?'}\``);
    parts.push('');
    parts.push('### Transcript');
    parts.push('');
    parts.push(body.trimEnd());
    parts.push('');
  }

  const text = parts.join('\n').trimEnd() + '\n';
  const fileName = `gemini-${opts.mode}-3x${opts.turns}t.md`;
  const path = join(opts.batchDir, fileName);
  writeFileSync(path, text);
  const feedCopy = join(opts.outRoot, `gemini-${opts.mode}-modes-agents-${opts.turns}t-LATEST.md`);
  writeFileSync(feedCopy, text);
  return { path, feedCopy, bytes: text.length };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf('--batch-dir');
  const batchDir =
    idx >= 0
      ? argv[idx + 1]
      : join(
          process.cwd(),
          'scripts',
          'fate-autoplay',
          'runs',
          'modes-agents-300t-2026-08-27T07-02-01-789Z'
        );
  if (!batchDir || !existsSync(batchDir)) {
    throw new Error(`batch dir missing: ${batchDir}`);
  }

  const telPath = join(batchDir, 'improvement-telemetry.json');
  const partialPath = join(batchDir, 'telemetry-partial.json');
  const telRaw = existsSync(telPath)
    ? JSON.parse(readFileSync(telPath, 'utf8'))
    : JSON.parse(readFileSync(partialPath, 'utf8'));
  const rows: TelRow[] = (telRaw.runs ?? telRaw) as TelRow[];
  const turns = Number(telRaw.turnsPerRun ?? 300);
  const batchId = String(telRaw.batchId ?? batchDir.split(/[/\\]/).pop());
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');

  const written: Array<{ mode: string; path: string; feedCopy: string; bytes: number }> = [];
  for (const mode of MODE_ORDER) {
    const r = buildModePack({ batchId, batchDir, outRoot, turns, mode, rows });
    written.push({ mode, ...r });
    console.log(`[${mode}] ${(r.bytes / 1024 / 1024).toFixed(2)} MB → ${r.feedCopy}`);
  }

  const index = [
    '# Gemini feed queue — mode-split packs',
    '',
    `Batch: \`${batchId}\` · ${turns} turns × 3 agents per mode`,
    '',
    '| Mode | Feed file |',
    '|---|---|',
    ...written.map((w) => `| **${w.mode}** | \`${w.feedCopy.split(/[/\\]/).pop()}\` |`),
    '',
    'Also: full 12-run combined remains at `gemini-COMBINED-modes-agents-300t-LATEST.md`',
    '',
    'Prompt tip: upload **one mode file per Gemini chat** so the critic scores that mode only.',
    '',
  ].join('\n');
  writeFileSync(join(outRoot, 'GEMINI-FEED-INDEX.md'), index);
  writeFileSync(join(batchDir, 'GEMINI-MODE-PACKS.md'), index);
  console.log('Index →', join(outRoot, 'GEMINI-FEED-INDEX.md'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
