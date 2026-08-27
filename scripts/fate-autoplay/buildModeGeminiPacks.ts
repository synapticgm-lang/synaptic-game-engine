/**
 * Build per-mode Gemini critic packs from a modes-agents batch.
 * Primary output: 4 mode files (litrpg / dnd / rpg / pyoa) + GEMINI-FEED-INDEX.md.
 * Combined 12-run file is optional (default off).
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EngineMode } from '../../src/game/types';
import { buildGeminiCriticPrompt } from '../../src/game/geminiCriticPrompt';

/** HUD / quality-governance stamp at batch export time. */
export const MODES_AGENTS_BUILD_STAMP = '2026-08-27w';

export const MODE_ORDER: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];

export const MODE_LABEL: Record<EngineMode, string> = {
  litrpg: 'LitRPG',
  dnd: 'Tabletop Fantasy',
  rpg: 'Story RPG',
  pyoa: 'Pick Your Own Adventure',
};

export type TelRow = {
  index: number;
  engineMode: EngineMode;
  bibleId: string;
  personality: string;
  agent: string;
  seed: number;
  outDir?: string;
  errorCount?: number;
  completedTurns?: number;
  timeoutCount?: number;
  transportRetryCount?: number;
  telemetry?: Record<string, unknown>;
  fatal?: string;
};

export type GridCell = {
  engineMode: EngineMode;
  bibleId: string;
  personality: string;
  agent: string;
  seed: number;
};

export function extractTranscriptBody(storyPath: string): string {
  const raw = readFileSync(storyPath, 'utf8');
  const idx = raw.search(/^## Transcript\s*$/m);
  if (idx < 0) return raw;
  return raw.slice(idx).replace(/^## Transcript\s*\n+/, '');
}

/** Manus-calibrated rails — mode-specific bleed warnings included. */
export function buildBatchAntiFalsePositiveRails(mode: EngineMode, turns: number): string {
  const label = MODE_LABEL[mode];
  const lines = [
    '## Anti-false-positive rails (Manus calibration — read before scoring)',
    '',
    'These rules prevent critic bleed that invalidated prior Gemini reviews:',
    '',
    '1. **Turn numbers:** Each run is exactly **' + turns + ' turns**. Cite only `Turn N` where **1 ≤ N ≤ ' + turns + '**. Do not invent T400+ or cross-run turn refs.',
    '2. **Body quotes required:** Every P0/P1 finding needs a **verbatim quote** from THIS file\'s transcript + turn #.',
    '3. **STATUS search required:** Before claiming "no System/XP", search for `STATUS / System:` and `XP Gained` in the transcript. Meta Level/XP is ground truth.',
    '4. **No cross-mode bleed:** Score **' + label + ' (`' + mode + '`) only**. Do not cite content from LitRPG/DnD/RPG/PYOA runs not in this file.',
    '5. **Semantic vs consecutive loops:** Max *exact* player-intent streak is in telemetry (`maxPlayerIntentStreak`). High option *exposure* ≠ 100+ consecutive identical actions.',
    '6. **Cross-genre pad contamination (prior false positives):**',
  ];

  if (mode === 'dnd') {
    lines.push(
      '   - **Gate queue / battlement pads** are LitRPG bank bleed — verify with transcript search before blaming DnD.',
      '   - **Lowmarket / Cathedral / Earth junk** are often Summoned Pact bleed — search THIS transcript first.'
    );
  } else if (mode === 'rpg') {
    lines.push(
      '   - **Mask Scarf** may be legitimate equipped kit — check Meta/STATUS before calling invent.',
      '   - **Lowmarket / Cathedral Undercroft** at 0 hits in prior calibrations when critic claimed cross-genre map bleed.'
    );
  } else if (mode === 'pyoa') {
    lines.push(
      '   - **Millstone Charter** over-exposure is a real PYOA pad loop — but **Mask Scarf / Earth junk / Cape District** were 0-hit critic bleed in prior reviews.',
      '   - Do not fail PYOA for missing LitRPG XP panels.'
    );
  } else {
    lines.push(
      '   - **STATUS/XP chrome** should exist on LitRPG — search before "zero System".',
      '   - `[Uncommon] them` is inventory-string corruption, not a UI template token.'
    );
  }

  lines.push(
    '7. **Voice:** Cold Registrar / Dry Wit / Army Brief are often STATUS diction + rails — score perceptibility, not `[SYSTEM]` tag count.',
    '8. **Run identity:** Bind every verdict to the manifest row (agent + seed + bible). Mislabeled runs invalidate the review.',
    '9. **Owner hints:** Prefer `proseWarden` | `choicePad` | `xpCode` | `situationSnapshot` | `qualityGovernance` — not "frontend template parser" unless literal `{{...}}` tokens appear.',
    ''
  );
  return lines.join('\n');
}

function buildRunGameModeTable(row: TelRow, turns: number): string {
  const label = MODE_LABEL[row.engineMode];
  return [
    '| Field | Value |',
    '|---|---|',
    `| **Game / engine mode** | **${label}** (\`${row.engineMode}\`) |`,
    `| **Premade / bible** | **${row.bibleId}** |`,
    `| **Personality** | **${row.personality}** |`,
    `| **Autoplay agent** | **${row.agent}** |`,
    `| **Seed** | **${row.seed}** |`,
    `| **Turns (requested)** | **${turns}** |`,
    `| **Batch cell** | **${row.index}/12** |`,
    '',
  ].join('\n');
}

function readSummaryJson(dir: string): Record<string, unknown> | null {
  const path = join(dir, 'summary.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatSummaryBlock(summary: Record<string, unknown> | null): string {
  if (!summary) return '_summary.json missing_';
  const pick = {
    runId: summary.runId,
    bibleId: summary.bibleId,
    bibleTitle: summary.bibleTitle,
    engineMode: summary.engineMode,
    personalityId: summary.personalityId,
    seed: summary.seed,
    requestedTurns: summary.requestedTurns,
    completedTurns: summary.completedTurns,
    errorCount: summary.errorCount,
    timeoutCount: summary.timeoutCount,
    transportRetryCount: summary.transportRetryCount,
    latencyMs: summary.latencyMs,
    issueTurns: summary.issueTurns,
  };
  return '```json\n' + JSON.stringify(pick, null, 2) + '\n```';
}

function formatTelemetryRow(row: TelRow): string {
  const tel = row.telemetry ?? {};
  const slice = {
    index: row.index,
    engineMode: row.engineMode,
    bibleId: row.bibleId,
    personality: row.personality,
    agent: row.agent,
    seed: row.seed,
    completedTurns: row.completedTurns,
    errorCount: row.errorCount,
    telemetry: tel,
  };
  return '```json\n' + JSON.stringify(slice, null, 2) + '\n```';
}

export function buildModeGeminiPack(opts: {
  batchId: string;
  batchDir: string;
  outRoot: string;
  turns: number;
  mode: EngineMode;
  rows: TelRow[];
  buildStamp?: string;
  baseSeed?: number;
}): { path: string; feedCopy: string; bytes: number; fileName: string } {
  const buildStamp = opts.buildStamp ?? MODES_AGENTS_BUILD_STAMP;
  const rows = opts.rows.filter((r) => r.engineMode === opts.mode).sort((a, b) => a.index - b.index);
  if (!rows.length) throw new Error(`No telemetry rows for mode ${opts.mode}`);

  const first = rows[0]!;
  const parts: string[] = [];

  parts.push(`# SynapticGM critic pack — ${MODE_LABEL[opts.mode]} (${rows.length} agents × ${opts.turns} turns)`);
  parts.push('');
  parts.push('<!-- IMMUTABLE MANIFEST — do not re-score without verifying these fields -->');
  parts.push('');
  parts.push('## Immutable manifest');
  parts.push('');
  parts.push('| Field | Value |');
  parts.push('|---|---|');
  parts.push(`| **Build stamp** | **${buildStamp}** |`);
  parts.push(`| **Batch id** | \`${opts.batchId}\` |`);
  parts.push(`| **Engine mode (this file)** | **${MODE_LABEL[opts.mode]}** (\`${opts.mode}\`) |`);
  parts.push(`| **Run count (this file)** | **${rows.length}** |`);
  parts.push(`| **Turns per run** | **${opts.turns}** |`);
  parts.push(`| **Base seed** | **${opts.baseSeed ?? 'see rows'}** |`);
  parts.push(`| **Flagship bible** | **${first.bibleId}** |`);
  parts.push(`| **Personality** | **${first.personality}** |`);
  parts.push(`| **Agents in file** | ${rows.map((r) => `\`${r.agent}\``).join(', ')} |`);
  parts.push(`| **Seeds in file** | ${rows.map((r) => `\`${r.seed}\``).join(', ')} |`);
  parts.push(`| **Exported** | ${new Date().toISOString()} |`);
  parts.push('');
  parts.push('### Run roster (ground truth)');
  parts.push('');
  parts.push('| # | Agent | Seed | Bible | Personality | Cell |');
  parts.push('|---:|---|---:|---|---|---:|');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    parts.push(
      `| ${i + 1} | **${r.agent}** | ${r.seed} | ${r.bibleId} | ${r.personality} | ${r.index}/12 |`
    );
  }
  parts.push('');

  parts.push(buildBatchAntiFalsePositiveRails(opts.mode, opts.turns));

  parts.push('## Critic prompt (apply to EVERY run below)');
  parts.push('');
  parts.push(
    buildGeminiCriticPrompt({
      bibleTitle: `${MODE_LABEL[opts.mode]} — ${first.bibleId} (${rows.length}-agent mode pack)`,
      engineMode: opts.mode,
      personalityId: first.personality,
      aiAgentMode: 'storyfollower',
      turns: opts.turns,
      seed: 'see each run manifest',
      level: 'see each run Meta / summary.json',
      xpLine: 'see each run Meta / summary.json',
      codeBaseline: `${buildStamp}; THIS FILE IS ${opts.mode} ONLY`,
      errorNote: 'Per-run errors in summary.json / telemetry row',
    })
  );
  parts.push('');
  parts.push(
    [
      `### Extra instructions for this **${MODE_LABEL[opts.mode]}-only** file`,
      '',
      `1. Score **each of the ${rows.length} agent runs separately** (scorecard table per run), then one within-mode synthesis.`,
      `2. Always name **Game mode = ${MODE_LABEL[opts.mode]}** + **agent mode** in each run verdict.`,
      '3. Compare agents: maxlevel vs storyfollower vs completionist.',
      `4. Judge **${MODE_LABEL[opts.mode]}** expectations only — wrong-genre bar is a critic error.`,
      `5. Cite only turn numbers ≤ **${opts.turns}** with verbatim quotes.`,
      '6. Search `STATUS / System:` before claiming absent chrome.',
      '7. End with: top 8 fixes for this mode (tag which agents), then `REVIEW_COMPLETE`.',
      '',
    ].join('\n')
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const dir = row.outDir ?? '';
    const storyPath = dir ? join(dir, 'story-for-gemini.md') : '';
    const body =
      dir && existsSync(storyPath) ? extractTranscriptBody(storyPath) : '_(missing story-for-gemini.md)_';
    const summary = dir ? readSummaryJson(dir) : null;
    const tel = (row.telemetry ?? {}) as Record<string, unknown>;

    parts.push('---');
    parts.push('');
    parts.push(
      `## Run ${String(i + 1).padStart(2, '0')} of ${rows.length} — ${row.engineMode} / ${row.bibleId} / ${row.agent}`
    );
    parts.push('');
    parts.push('### Game mode table');
    parts.push('');
    parts.push(buildRunGameModeTable(row, opts.turns));
    parts.push('### Run metrics (summary.json)');
    parts.push('');
    parts.push(formatSummaryBlock(summary));
    parts.push('');
    parts.push('### Improvement telemetry row');
    parts.push('');
    parts.push(formatTelemetryRow(row));
    parts.push('');
    parts.push('### Quick telemetry digest');
    parts.push('');
    parts.push(`- End Level/XP: ${tel.levelEnd ?? '?'} / ${tel.xpEnd ?? '?'}`);
    parts.push(
      `- STATUS blocks=${tel.statusBlocks ?? 0}, them≈${tel.themWordHits ?? 0}, this-place≈${tel.thisPlaceHits ?? 0}, [Uncommon] them=${tel.uncommonThemHits ?? 0}`
    );
    parts.push(
      `- gate-queue opts≈${tel.gateQueueOptionHits ?? 0}, Earth-junk opts≈${tel.earthJunkOptionHits ?? 0}, max intent streak=${tel.maxPlayerIntentStreak ?? 0}`
    );
    parts.push(`- errors=${row.errorCount ?? summary?.errorCount ?? '?'}, completedTurns=${row.completedTurns ?? summary?.completedTurns ?? '?'}`);
    parts.push(`- Source dir: \`${dir || '?'}\``);
    parts.push('');
    parts.push('### Transcript (GM → Options → Player → STATUS)');
    parts.push('');
    parts.push('_Full export includes offered choices per turn where committed._');
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
  return { path, feedCopy, bytes: text.length, fileName };
}

export function loadBatchTelemetry(batchDir: string): {
  rows: TelRow[];
  turns: number;
  batchId: string;
  grid?: GridCell[];
  baseSeed?: number;
} {
  const telPath = join(batchDir, 'improvement-telemetry.json');
  const partialPath = join(batchDir, 'telemetry-partial.json');
  const manifestPath = join(batchDir, 'batch-manifest.json');
  if (!existsSync(telPath) && !existsSync(partialPath)) {
    throw new Error(`No telemetry in ${batchDir} (need improvement-telemetry.json or telemetry-partial.json)`);
  }
  const telRaw = existsSync(telPath)
    ? (JSON.parse(readFileSync(telPath, 'utf8')) as Record<string, unknown>)
    : (JSON.parse(readFileSync(partialPath, 'utf8')) as Record<string, unknown>);
  const manifestRaw = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>)
    : null;
  let rows = (telRaw.runs ?? telRaw) as TelRow[];
  rows = backfillOutDirs(batchDir, rows);
  const turns = Number(telRaw.turnsPerRun ?? 300);
  const batchId = String(
    telRaw.batchId ?? batchDir.replace(/\\/g, '/').split('/').pop()?.replace(/^modes-agents-\d+t-/, '') ?? batchDir
  );
  let grid = (telRaw.grid ?? manifestRaw?.grid) as GridCell[] | undefined;
  if (!grid?.length && rows.length) {
    grid = rows.map((r) => ({
      engineMode: r.engineMode,
      bibleId: r.bibleId,
      personality: r.personality,
      agent: r.agent,
      seed: r.seed,
    }));
  }
  const baseSeed =
    Number(manifestRaw?.baseSeed) ||
    grid?.[0]?.seed ||
    (rows.length ? Math.min(...rows.map((r) => r.seed)) : undefined);
  return { rows, turns, batchId, grid, baseSeed };
}

/** Resolve outDir when older telemetry rows omitted it. */
function backfillOutDirs(batchDir: string, rows: TelRow[]): TelRow[] {
  const candidates: string[] = [];
  try {
    for (const name of readdirSync(batchDir)) {
      const full = join(batchDir, name);
      if (!statSync(full).isDirectory()) continue;
      if (existsSync(join(full, 'summary.json'))) candidates.push(full);
    }
  } catch {
    return rows;
  }

  return rows.map((row) => {
    if (row.outDir && existsSync(join(row.outDir, 'summary.json'))) return row;
    const hit = candidates.find((dir) => {
      try {
        const s = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) as Record<string, unknown>;
        return (
          s.bibleId === row.bibleId &&
          Number(s.seed) === row.seed &&
          (s.engineMode === row.engineMode || !row.engineMode)
        );
      } catch {
        return false;
      }
    });
    return hit ? { ...row, outDir: hit } : row;
  });
}

export function buildGeminiFeedIndex(opts: {
  batchId: string;
  batchDir: string;
  outRoot: string;
  turns: number;
  buildStamp: string;
  modeFiles: Array<{ mode: EngineMode; fileName: string; feedCopy: string; bytes: number }>;
  grid?: GridCell[];
  includeCombinedNote?: boolean;
}): string {
  const lines = [
    '# GEMINI-FEED-INDEX — modes×agents batch',
    '',
    'Upload **one mode file per Gemini chat** for accurate per-genre reviews.',
    '',
    '## Manifest',
    '',
    '| Field | Value |',
    '|---|---|',
    `| **Build stamp** | **${opts.buildStamp}** |`,
    `| **Batch id** | \`${opts.batchId}\` |`,
    `| **Batch dir** | \`${opts.batchDir.replace(/\\/g, '/')}\` |`,
    `| **Turns per run** | **${opts.turns}** |`,
    `| **Grid** | 4 modes × 3 agents = 12 runs |`,
    `| **Exported** | ${new Date().toISOString()} |`,
    '',
  ];

  if (opts.grid?.length) {
    lines.push('### Full grid (seeds / bibles / personalities)');
    lines.push('');
    lines.push('| Cell | Mode | Bible | Personality | Agent | Seed |');
    lines.push('|---:|---|---|---|---|---:|');
    for (let i = 0; i < opts.grid.length; i++) {
      const c = opts.grid[i]!;
      lines.push(
        `| ${i + 1} | ${c.engineMode} | ${c.bibleId} | ${c.personality} | ${c.agent} | ${c.seed} |`
      );
    }
    lines.push('');
  }

  lines.push('## Primary feed files (use these)');
  lines.push('');
  lines.push('| Mode | Batch file | LATEST symlink | Size |');
  lines.push('|---|---|---|---:|');
  for (const f of opts.modeFiles) {
    const latestName = f.feedCopy.replace(/\\/g, '/').split('/').pop() ?? f.fileName;
    lines.push(
      `| **${f.mode}** (${MODE_LABEL[f.mode]}) | \`${f.fileName}\` | \`${latestName}\` | ${(f.bytes / 1024 / 1024).toFixed(2)} MB |`
    );
  }
  lines.push('');
  lines.push('## Regenerate from existing batch');
  lines.push('');
  lines.push('If the batch finished before pack export or you need fresh rails:');
  lines.push('');
  lines.push('```bash');
  lines.push(
    `npm run fate-autoplay -- --split-modes-gemini --batch-dir "${opts.batchDir.replace(/\\/g, '/')}"`
  );
  lines.push('```');
  lines.push('');
  lines.push('Or directly:');
  lines.push('');
  lines.push('```bash');
  lines.push(
    `npx vite-node --config vite.config.ts scripts/fate-autoplay/splitModesGemini.ts -- --batch-dir "${opts.batchDir.replace(/\\/g, '/')}"`
  );
  lines.push('```');
  lines.push('');
  if (opts.includeCombinedNote) {
    lines.push(
      `Optional combined 12-run: \`gemini-COMBINED-modes-agents-${opts.turns}t-LATEST.md\` (pass \`--combined-gemini\` to generate).`
    );
    lines.push('');
  }
  lines.push('## Calibration reference');
  lines.push('');
  lines.push('- `docs/bugs/gemini-reviews-2026-08-27/MANUS-CALIBRATED-REVIEW.md`');
  lines.push('- `docs/bugs/gemini-reviews-2026-08-27/MANUS-EVIDENCE-CLASSIFICATION.md`');
  lines.push('');

  return lines.join('\n');
}

export function writeModeGeminiPacks(opts: {
  batchId: string;
  batchDir: string;
  outRoot: string;
  turns: number;
  rows: TelRow[];
  grid?: GridCell[];
  buildStamp?: string;
  baseSeed?: number;
  includeCombined?: boolean;
  log?: (msg: string) => void;
}): {
  modeFiles: Array<{ mode: EngineMode; path: string; feedCopy: string; bytes: number; fileName: string }>;
  indexPath: string;
  combinedGemini?: string;
} {
  const buildStamp = opts.buildStamp ?? MODES_AGENTS_BUILD_STAMP;
  const log = opts.log ?? ((m: string) => console.log(m));
  const modeFiles: Array<{
    mode: EngineMode;
    path: string;
    feedCopy: string;
    bytes: number;
    fileName: string;
  }> = [];

  for (const mode of MODE_ORDER) {
    const hasRows = opts.rows.some((r) => r.engineMode === mode);
    if (!hasRows) continue;
    const pack = buildModeGeminiPack({
      batchId: opts.batchId,
      batchDir: opts.batchDir,
      outRoot: opts.outRoot,
      turns: opts.turns,
      mode,
      rows: opts.rows,
      buildStamp,
      baseSeed: opts.baseSeed,
    });
    modeFiles.push({ mode, ...pack });
    log(`Mode Gemini (${mode}): ${pack.feedCopy} (${(pack.bytes / 1024 / 1024).toFixed(2)} MB)`);
  }

  const indexText = buildGeminiFeedIndex({
    batchId: opts.batchId,
    batchDir: opts.batchDir,
    outRoot: opts.outRoot,
    turns: opts.turns,
    buildStamp,
    modeFiles,
    grid: opts.grid,
    includeCombinedNote: opts.includeCombined,
  });
  const indexPath = join(opts.outRoot, 'GEMINI-FEED-INDEX.md');
  writeFileSync(indexPath, indexText);
  writeFileSync(join(opts.batchDir, 'GEMINI-FEED-INDEX.md'), indexText);
  log(`Feed index: ${indexPath}`);

  let combinedGemini: string | undefined;
  if (opts.includeCombined) {
    combinedGemini = writeCombinedGeminiPack({
      batchId: opts.batchId,
      batchDir: opts.batchDir,
      outRoot: opts.outRoot,
      turns: opts.turns,
      rows: opts.rows,
      grid: opts.grid,
      buildStamp,
      baseSeed: opts.baseSeed,
      runDirs: opts.rows.map((r) => r.outDir).filter(Boolean) as string[],
    });
    log(`Combined Gemini (optional): ${combinedGemini}`);
  }

  return { modeFiles, indexPath, combinedGemini };
}

function writeCombinedGeminiPack(opts: {
  batchId: string;
  batchDir: string;
  outRoot: string;
  turns: number;
  rows: TelRow[];
  grid?: GridCell[];
  buildStamp: string;
  baseSeed?: number;
  runDirs: string[];
}): string {
  const parts: string[] = [];
  parts.push(`# SynapticGM combined critic pack — ${opts.rows.length} runs × ${opts.turns} turns (OPTIONAL)`);
  parts.push('');
  parts.push('_Prefer per-mode files in GEMINI-FEED-INDEX.md for accurate reviews._');
  parts.push('');
  parts.push(`- Build stamp: ${opts.buildStamp}`);
  parts.push(`- Batch id: ${opts.batchId}`);
  parts.push('');

  const sorted = [...opts.rows].sort((a, b) => a.index - b.index);
  for (const row of sorted) {
    const dir = row.outDir ?? '';
    const storyPath = dir ? join(dir, 'story-for-gemini.md') : '';
    const body =
      dir && existsSync(storyPath) ? extractTranscriptBody(storyPath) : '_(missing story-for-gemini.md)_';
    parts.push('---');
    parts.push(`## Run ${row.index}/12 — ${row.engineMode} / ${row.bibleId} / ${row.agent}`);
    parts.push('');
    parts.push(body.trimEnd());
    parts.push('');
  }

  const combinedGemini = join(opts.batchDir, 'gemini-COMBINED-12x' + opts.turns + 't.md');
  writeFileSync(combinedGemini, parts.join('\n').trimEnd() + '\n');
  const feedCopy = join(opts.outRoot, `gemini-COMBINED-modes-agents-${opts.turns}t-LATEST.md`);
  writeFileSync(feedCopy, readFileSync(combinedGemini));
  return combinedGemini;
}
