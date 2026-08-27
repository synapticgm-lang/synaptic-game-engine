/**
 * 4 engine modes × 3 AI agent modes × N turns.
 * Writes progress log + combined Gemini critic pack + improvement telemetry.
 *
 *   npm run fate-autoplay -- --modes-agents-300
 *   (or invoke this file via vite-node)
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  disableAutoplayTestLab,
  runFateAutoplay,
  type AiAgentMode,
  type EngineMode,
} from '../../src/game/fateAutoplay';
import { buildGeminiCriticPrompt } from '../../src/game/geminiCriticPrompt';

type Cell = {
  engineMode: EngineMode;
  bibleId: string;
  personality: string;
  agent: AiAgentMode;
  seed: number;
};

const FLAGSHIPS: Array<{ engineMode: EngineMode; bibleId: string; personality: string }> = [
  { engineMode: 'litrpg', bibleId: 'summoned-pact', personality: 'cold-system' },
  { engineMode: 'dnd', bibleId: 'cursed-keep', personality: 'dry-wit' },
  { engineMode: 'rpg', bibleId: 'cape-district-vigil', personality: 'chilled-gm' },
  { engineMode: 'pyoa', bibleId: 'thornferry-road', personality: 'army-brief' },
];

const AGENTS: AiAgentMode[] = ['maxlevel', 'storyfollower', 'completionist'];

function installNodeShims(): void {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  const g = globalThis as typeof globalThis & {
    localStorage?: typeof localStorage;
    window?: { localStorage: typeof localStorage };
  };
  if (!g.localStorage) g.localStorage = localStorage;
  if (!g.window) g.window = { localStorage };
}

function buildGrid(baseSeed: number): Cell[] {
  const cells: Cell[] = [];
  let i = 0;
  for (const f of FLAGSHIPS) {
    for (const agent of AGENTS) {
      cells.push({
        ...f,
        agent,
        seed: baseSeed + i * 17,
      });
      i += 1;
    }
  }
  return cells;
}

function extractTranscriptBody(storyPath: string): string {
  const raw = readFileSync(storyPath, 'utf8');
  const idx = raw.search(/^## Transcript\s*$/m);
  if (idx < 0) return raw;
  return raw.slice(idx).replace(/^## Transcript\s*\n+/, '');
}

function summarizeRun(outDir: string, summaryPath: string): Record<string, unknown> {
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>;
  const transcript = join(outDir, 'transcript.md');
  const story = join(outDir, 'story-for-gemini.md');
  const turnsPath = join(outDir, 'turns.jsonl');
  let xpLines = 0;
  let themHits = 0;
  let thisPlaceHits = 0;
  let uncommonThem = 0;
  let gateQueueOpts = 0;
  let earthJunkOpts = 0;
  let levelEnd: unknown = null;
  let xpEnd: unknown = null;
  if (existsSync(story)) {
    const s = readFileSync(story, 'utf8');
    xpLines = (s.match(/\*\*STATUS \/ System:\*\*/g) || []).length;
    themHits = (s.match(/\bthem\b/gi) || []).length;
    thisPlaceHits = (s.match(/\bthis place\b/gi) || []).length;
    uncommonThem = (s.match(/\[Uncommon\]\s+them/gi) || []).length;
    gateQueueOpts = (s.match(/Watch the gate queue/gi) || []).length;
    earthJunkOpts = (s.match(/Ask about Earth junk prices/gi) || []).length;
    const m = s.match(/Level\s+(\d+)\s*·\s*XP\s+(\d+\/\d+)/i);
    if (m) {
      levelEnd = Number(m[1]);
      xpEnd = m[2];
    }
  }
  let intentStreakMax = 0;
  if (existsSync(turnsPath)) {
    const lines = readFileSync(turnsPath, 'utf8').trim().split(/\n+/).filter(Boolean);
    let prev = '';
    let streak = 0;
    for (const line of lines) {
      try {
        const t = JSON.parse(line) as { playerInput?: string };
        const key = (t.playerInput || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 48);
        if (key && key === prev) {
          streak += 1;
          if (streak > intentStreakMax) intentStreakMax = streak;
        } else {
          prev = key;
          streak = 1;
        }
      } catch {
        /* skip */
      }
    }
  }
  return {
    ...summary,
    telemetry: {
      statusBlocks: xpLines,
      themWordHits: themHits,
      thisPlaceHits,
      uncommonThemHits: uncommonThem,
      gateQueueOptionHits: gateQueueOpts,
      earthJunkOptionHits: earthJunkOpts,
      maxPlayerIntentStreak: intentStreakMax,
      levelEnd,
      xpEnd,
      transcriptBytes: existsSync(transcript) ? readFileSync(transcript).length : 0,
    },
  };
}

function findCompletedCellDir(batchDir: string, cell: Cell, turns: number): string | null {
  if (!existsSync(batchDir)) return null;
  // Prefer telemetry-partial match (stable), else scan run folders by bible+seed.
  const partialPath = join(batchDir, 'telemetry-partial.json');
  if (existsSync(partialPath)) {
    try {
      const rows = JSON.parse(readFileSync(partialPath, 'utf8')) as Array<Record<string, unknown>>;
      const hit = rows.find(
        (r) =>
          r.bibleId === cell.bibleId &&
          r.agent === cell.agent &&
          Number(r.seed) === cell.seed &&
          Number(r.completedTurns) >= turns
      );
      const dir = typeof hit?.outDir === 'string' ? hit.outDir : null;
      if (dir && existsSync(join(dir, 'summary.json')) && existsSync(join(dir, 'story-for-gemini.md'))) {
        return dir;
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}

export async function runModesAgentsBatch(opts: {
  turns: number;
  seed: number;
  outRoot: string;
  dryRun?: boolean;
  /** Resume into an existing batch folder (skip completed cells). */
  resumeDir?: string;
}): Promise<{ batchDir: string; combinedGemini: string; telemetryPath: string }> {
  installNodeShims();
  const batchId = opts.resumeDir
    ? opts.resumeDir.replace(/\\/g, '/').split('/').pop()!.replace(/^modes-agents-\d+t-/, '')
    : new Date().toISOString().replace(/[:.]/g, '-');
  const batchDir = opts.resumeDir
    ? opts.resumeDir
    : join(opts.outRoot, `modes-agents-${opts.turns}t-${batchId}`);
  mkdirSync(batchDir, { recursive: true });
  writeFileSync(join(batchDir, 'batch.pid'), String(process.pid) + '\n');
  const progressLog = join(batchDir, 'progress.log');
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    appendFileSync(progressLog, line + '\n');
  };

  const onFatal = (kind: string, err: unknown) => {
    const msg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack || ''}` : String(err);
    try {
      appendFileSync(join(batchDir, 'crash.log'), `[${new Date().toISOString()}] process ${kind}\n${msg}\n\n`);
      log(`PROCESS ${kind}: ${err instanceof Error ? err.message : String(err)}`);
    } catch {
      /* ignore */
    }
  };
  process.on('uncaughtException', (err) => onFatal('uncaughtException', err));
  process.on('unhandledRejection', (err) => onFatal('unhandledRejection', err));
  // Windows: Cursor agent shells often get reaped on chat compact — log signal if we get one.
  for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP'] as const) {
    try {
      process.on(sig, () => {
        onFatal(sig, new Error(`received ${sig}`));
      });
    } catch {
      /* platform may not support */
    }
  }

  const grid = buildGrid(opts.seed);
  log(
    `Modes×agents batch ${opts.resumeDir ? 'RESUME' : 'start'}: ${grid.length} runs × ${opts.turns} turns (~${grid.length * opts.turns} total)`
  );
  log(`ETA ~${Math.round((grid.length * opts.turns * 1.7) / 3600)}h at ~1.7s/turn`);
  if (opts.resumeDir) log(`Resume dir: ${batchDir}`);

  const runDirs: string[] = new Array(grid.length);
  const telemetryRows: Record<string, unknown>[] = [];
  // Seed rows from prior partial so skipped cells keep their telemetry.
  if (existsSync(join(batchDir, 'telemetry-partial.json'))) {
    try {
      const prior = JSON.parse(readFileSync(join(batchDir, 'telemetry-partial.json'), 'utf8')) as Array<
        Record<string, unknown>
      >;
      for (const row of prior) {
        const idx = Number(row.index) - 1;
        if (idx >= 0 && idx < grid.length && typeof row.outDir === 'string') {
          runDirs[idx] = row.outDir;
          telemetryRows[idx] = row;
        }
      }
    } catch {
      /* ignore */
    }
  }

  try {
    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i]!;
      const label = `${i + 1}/${grid.length} ${cell.engineMode} ${cell.bibleId} ${cell.agent}`;
      const existing = findCompletedCellDir(batchDir, cell, opts.turns);
      if (existing) {
        runDirs[i] = existing;
        if (!telemetryRows[i]) {
          telemetryRows[i] = {
            index: i + 1,
            engineMode: cell.engineMode,
            bibleId: cell.bibleId,
            personality: cell.personality,
            agent: cell.agent,
            seed: cell.seed,
            ...summarizeRun(existing, join(existing, 'summary.json')),
          };
        }
        log(`[${label}] SKIP completed → ${existing}`);
        continue;
      }
      log(`[${label}] seed=${cell.seed} personality=${cell.personality}`);
      writeFileSync(
        join(batchDir, 'heartbeat.json'),
        JSON.stringify(
          {
            pid: process.pid,
            cell: i + 1,
            of: grid.length,
            label,
            at: new Date().toISOString(),
          },
          null,
          2
        ) + '\n'
      );
      try {
        const summary = await runFateAutoplay({
          turns: opts.turns,
          seed: cell.seed,
          bibleId: cell.bibleId,
          personality: cell.personality,
          engineMode: cell.engineMode,
          aiTier: 'free',
          mode: 'fate',
          dryRun: opts.dryRun === true,
          outRoot: batchDir,
          characterName: 'Jax',
          aiAgentMode: cell.agent,
        });
        runDirs[i] = summary.outDir;
        const row = summarizeRun(summary.outDir, join(summary.outDir, 'summary.json'));
        telemetryRows[i] = {
          index: i + 1,
          engineMode: cell.engineMode,
          bibleId: cell.bibleId,
          personality: cell.personality,
          agent: cell.agent,
          seed: cell.seed,
          ...row,
        };
        const tel = row.telemetry as Record<string, unknown>;
        log(
          `  → done turns=${summary.completedTurns} err=${summary.errorCount} lvl=${tel.levelEnd} xp=${tel.xpEnd} them=${tel.themWordHits} streakMax=${tel.maxPlayerIntentStreak} dir=${summary.outDir}`
        );
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack || ''}` : String(err);
        appendFileSync(join(batchDir, 'crash.log'), `[${new Date().toISOString()}] cell ${label}\n${msg}\n\n`);
        log(`  → CELL FAILED (continuing): ${err instanceof Error ? err.message : String(err)}`);
        telemetryRows[i] = {
          index: i + 1,
          engineMode: cell.engineMode,
          bibleId: cell.bibleId,
          personality: cell.personality,
          agent: cell.agent,
          seed: cell.seed,
          completedTurns: 0,
          errorCount: 1,
          fatal: err instanceof Error ? err.message : String(err),
        };
      }
      writeFileSync(
        join(batchDir, 'telemetry-partial.json'),
        JSON.stringify(telemetryRows.filter(Boolean), null, 2) + '\n'
      );
    }
  } finally {
    disableAutoplayTestLab();
  }

  // Combined Gemini pack
  const combinedParts: string[] = [];
  combinedParts.push(`# SynapticGM combined critic pack — ${grid.length} runs × ${opts.turns} turns`);
  combinedParts.push('');
  combinedParts.push('## Batch meta');
  combinedParts.push('');
  combinedParts.push(`- Batch id: ${batchId}`);
  combinedParts.push(`- Grid: 4 engine modes × 3 AI agents × ${opts.turns} turns = ${grid.length} runs`);
  combinedParts.push(`- Code baseline: 2026-08-26v+ (client at batch start)`);
  combinedParts.push(`- Flagships: litrpg/summoned-pact, dnd/cursed-keep, rpg/cape-district-vigil, pyoa/thornferry-road`);
  combinedParts.push(`- Exported: ${new Date().toISOString()}`);
  combinedParts.push('');
  combinedParts.push('## Critic prompt (apply to EVERY run below)');
  combinedParts.push('');
  combinedParts.push(
    buildGeminiCriticPrompt({
      bibleTitle: 'Combined 12-run modes×agents matrix',
      engineMode: 'litrpg',
      personalityId: 'cold-system',
      aiAgentMode: 'storyfollower',
      turns: opts.turns,
      seed: opts.seed,
      level: 'see each run Meta',
      xpLine: 'see each run Meta',
      codeBaseline: '2026-08-26v+; compare across modes/agents in this file',
      errorNote: 'Per-run errors in each section Meta / telemetry JSON',
    })
  );
  combinedParts.push('');
  combinedParts.push(
    [
      '### Extra instructions for this COMBINED file',
      '',
      '1. Score **each of the 12 runs separately** (short scorecard table per run), then one cross-run synthesis.',
      '2. Always name **Game mode** + **agent mode** in each run verdict.',
      '3. Compare agents within the same engine mode (maxlevel vs storyfollower vs completionist).',
      '4. Compare engine modes on shared failure classes (them-mush, loops, XP chrome, combat pressure).',
      '5. End with: top 12 fixes ranked for the next engineering batch, tagged by which modes/agents they hit.',
      '6. End with `REVIEW_COMPLETE`.',
      '',
    ].join('\n')
  );

  const denseTelemetry = telemetryRows.filter(Boolean);
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i]!;
    const dir = runDirs[i];
    if (!dir) continue;
    const storyPath = join(dir, 'story-for-gemini.md');
    const body = existsSync(storyPath)
      ? extractTranscriptBody(storyPath)
      : '_(missing story-for-gemini.md)_';
    const row = (telemetryRows[i] ?? denseTelemetry.find((r) => Number(r.index) === i + 1)) as
      | Record<string, unknown>
      | undefined;
    const tel = (row?.telemetry ?? {}) as Record<string, unknown>;
    combinedParts.push('---');
    combinedParts.push('');
    combinedParts.push(
      `## Run ${String(i + 1).padStart(2, '0')} — ${cell.engineMode} / ${cell.bibleId} / ${cell.agent}`
    );
    combinedParts.push('');
    combinedParts.push('### Run meta');
    combinedParts.push('');
    combinedParts.push(`- Game mode: **${cell.engineMode}**`);
    combinedParts.push(`- Bible: ${cell.bibleId}`);
    combinedParts.push(`- Personality: ${cell.personality}`);
    combinedParts.push(`- AI agent mode: **${cell.agent}**`);
    combinedParts.push(`- Seed: ${cell.seed}`);
    combinedParts.push(`- Turns: ${opts.turns}`);
    combinedParts.push(`- End Level/XP: ${tel.levelEnd ?? '?'} / ${tel.xpEnd ?? '?'}`);
    combinedParts.push(
      `- Telemetry: STATUS blocks=${tel.statusBlocks ?? 0}, them≈${tel.themWordHits ?? 0}, this-place≈${tel.thisPlaceHits ?? 0}, [Uncommon] them=${tel.uncommonThemHits ?? 0}, gate-queue opts≈${tel.gateQueueOptionHits ?? 0}, Earth-junk opts≈${tel.earthJunkOptionHits ?? 0}, max intent streak=${tel.maxPlayerIntentStreak ?? 0}, errors=${row?.errorCount ?? '?'}`
    );
    combinedParts.push(`- Source dir: \`${dir}\``);
    combinedParts.push('');
    combinedParts.push('### Transcript');
    combinedParts.push('');
    combinedParts.push(body.trimEnd());
    combinedParts.push('');
  }

  const combinedGemini = join(batchDir, 'gemini-COMBINED-12x' + opts.turns + 't.md');
  writeFileSync(combinedGemini, combinedParts.join('\n').trimEnd() + '\n');

  const telemetryPath = join(batchDir, 'improvement-telemetry.json');
  const improvementNotes = {
    batchId,
    turnsPerRun: opts.turns,
    runCount: grid.length,
    generatedAt: new Date().toISOString(),
    grid,
    runs: denseTelemetry,
    aggregates: {
      totalErrors: denseTelemetry.reduce((n, r) => n + Number(r.errorCount ?? 0), 0),
      avgThemHits:
        denseTelemetry.reduce(
          (n, r) => n + Number((r.telemetry as Record<string, unknown>)?.themWordHits ?? 0),
          0
        ) / Math.max(1, denseTelemetry.length),
      maxIntentStreakSeen: Math.max(
        0,
        ...denseTelemetry.map((r) =>
          Number((r.telemetry as Record<string, unknown>)?.maxPlayerIntentStreak ?? 0)
        )
      ),
      runsWithUncommonThem: denseTelemetry.filter(
        (r) => Number((r.telemetry as Record<string, unknown>)?.uncommonThemHits ?? 0) > 0
      ).length,
      litrpgLevels: denseTelemetry
        .filter((r) => r.engineMode === 'litrpg')
        .map((r) => ({
          agent: r.agent,
          level: (r.telemetry as Record<string, unknown>)?.levelEnd,
          xp: (r.telemetry as Record<string, unknown>)?.xpEnd,
        })),
    },
    suggestedNextFixes: [
      'If maxIntentStreakSeen >= 10: harden same-action interrupt beyond SNAPSHOT rails',
      'If uncommonThemHits > 0: extend inventory authority / rarity-them scrub',
      'If LitRPG levels still ~1 after 300t on maxlevel: XP drip + combat force',
      'If gateQueueOptionHits high on alone openings: tighten presence pad filter',
      'Cross-mode: them/this-place rates by engineMode for scrub coverage gaps',
    ],
  };
  writeFileSync(telemetryPath, JSON.stringify(improvementNotes, null, 2) + '\n');

  // Convenience copy at runs root
  const feedCopy = join(opts.outRoot, `gemini-COMBINED-modes-agents-${opts.turns}t-LATEST.md`);
  writeFileSync(feedCopy, readFileSync(combinedGemini));

  // Also write 4 mode-only packs (smaller Gemini uploads; correct genre bar per file).
  const modePackLines: string[] = [
    '# Gemini feed queue — mode-split + combined',
    '',
    `Batch: \`${batchId}\` · ${opts.turns} turns × 3 agents per mode`,
    '',
    '| Mode | Feed file |',
    '|---|---|',
  ];
  for (const mode of ['litrpg', 'dnd', 'rpg', 'pyoa'] as EngineMode[]) {
    const modeRows = denseTelemetry.filter((r) => r.engineMode === mode) as Array<{
      index: number;
      engineMode: EngineMode;
      bibleId: string;
      personality: string;
      agent: string;
      seed: number;
      outDir?: string;
      errorCount?: number;
      telemetry?: Record<string, unknown>;
    }>;
    if (!modeRows.length) continue;
    const first = modeRows[0]!;
    const modeParts: string[] = [];
    const modeLabel =
      mode === 'litrpg'
        ? 'LitRPG'
        : mode === 'dnd'
          ? 'Tabletop Fantasy'
          : mode === 'rpg'
            ? 'Story RPG'
            : 'Pick Your Own Adventure';
    modeParts.push(
      `# SynapticGM critic pack — ${modeLabel} only (${modeRows.length} agents × ${opts.turns} turns)`
    );
    modeParts.push('');
    modeParts.push('## Batch meta');
    modeParts.push('');
    modeParts.push(`- Batch id: ${batchId}`);
    modeParts.push(`- **This file = one engine mode only:** **${modeLabel}** (\`${mode}\`)`);
    modeParts.push(`- Agents: ${modeRows.map((r) => r.agent).join(', ')}`);
    modeParts.push(`- Flagship bible: ${first.bibleId}`);
    modeParts.push(`- Personality: ${first.personality}`);
    modeParts.push(`- Code baseline: 2026-08-26v+`);
    modeParts.push(`- Exported: ${new Date().toISOString()}`);
    modeParts.push('');
    modeParts.push('## Critic prompt (apply to EVERY run below)');
    modeParts.push('');
    modeParts.push(
      buildGeminiCriticPrompt({
        bibleTitle: `${modeLabel} — ${first.bibleId} (3-agent mode pack)`,
        engineMode: mode,
        personalityId: first.personality,
        aiAgentMode: 'storyfollower',
        turns: opts.turns,
        seed: 'see each run Meta',
        level: 'see each run Meta',
        xpLine: 'see each run Meta',
        codeBaseline: `2026-08-26v+; THIS FILE IS ${mode} ONLY`,
        errorNote: 'Per-run errors in each section Meta',
      })
    );
    modeParts.push('');
    modeParts.push(
      [
        `### Extra instructions for this **${modeLabel}-only** file`,
        '',
        `1. Score each of the ${modeRows.length} agent runs separately, then one within-mode synthesis.`,
        `2. Always name Game mode = ${modeLabel} + agent mode.`,
        '3. Compare maxlevel vs storyfollower vs completionist.',
        `4. Judge ${modeLabel} expectations only.`,
        '5. Cite only turn numbers that exist (300 turns/run — no T400+).',
        '6. End with top 8 fixes for this mode + `REVIEW_COMPLETE`.',
        '',
      ].join('\n')
    );
    for (let mi = 0; mi < modeRows.length; mi++) {
      const row = modeRows[mi]!;
      const dir = (row.outDir as string) || runDirs[Number(row.index) - 1];
      const storyPath = dir ? join(dir, 'story-for-gemini.md') : '';
      const body =
        dir && existsSync(storyPath)
          ? extractTranscriptBody(storyPath)
          : '_(missing story-for-gemini.md)_';
      const tel = (row.telemetry ?? {}) as Record<string, unknown>;
      modeParts.push('---');
      modeParts.push('');
      modeParts.push(
        `## Run ${String(mi + 1).padStart(2, '0')} of ${modeRows.length} — ${row.engineMode} / ${row.bibleId} / ${row.agent}`
      );
      modeParts.push('');
      modeParts.push('### Run meta');
      modeParts.push('');
      modeParts.push(`- Game mode: **${row.engineMode}**`);
      modeParts.push(`- Bible: ${row.bibleId}`);
      modeParts.push(`- Personality: ${row.personality}`);
      modeParts.push(`- AI agent mode: **${row.agent}**`);
      modeParts.push(`- Seed: ${row.seed}`);
      modeParts.push(`- Turns: ${opts.turns}`);
      modeParts.push(`- End Level/XP: ${tel.levelEnd ?? '?'} / ${tel.xpEnd ?? '?'}`);
      modeParts.push(
        `- Telemetry: STATUS=${tel.statusBlocks ?? 0}, them≈${tel.themWordHits ?? 0}, this-place≈${tel.thisPlaceHits ?? 0}, streak=${tel.maxPlayerIntentStreak ?? 0}, errors=${row.errorCount ?? '?'}`
      );
      modeParts.push(`- Source dir: \`${dir ?? '?'}\``);
      modeParts.push('');
      modeParts.push('### Transcript');
      modeParts.push('');
      modeParts.push(body.trimEnd());
      modeParts.push('');
    }
    const modeFile = join(batchDir, `gemini-${mode}-3x${opts.turns}t.md`);
    const modeText = modeParts.join('\n').trimEnd() + '\n';
    writeFileSync(modeFile, modeText);
    const modeFeed = join(opts.outRoot, `gemini-${mode}-modes-agents-${opts.turns}t-LATEST.md`);
    writeFileSync(modeFeed, modeText);
    modePackLines.push(`| **${mode}** | \`gemini-${mode}-modes-agents-${opts.turns}t-LATEST.md\` |`);
    log(`Mode Gemini (${mode}): ${modeFeed}`);
  }
  modePackLines.push('');
  modePackLines.push(
    `**Combined 12-run:** \`gemini-COMBINED-modes-agents-${opts.turns}t-LATEST.md\``
  );
  modePackLines.push('');
  modePackLines.push('Upload **one mode file per Gemini chat**.');
  modePackLines.push('');
  writeFileSync(join(opts.outRoot, 'GEMINI-FEED-INDEX.md'), modePackLines.join('\n'));

  log(`Combined Gemini: ${combinedGemini}`);
  log(`Feed copy: ${feedCopy}`);
  log(`Telemetry: ${telemetryPath}`);
  log('Modes×agents batch complete');

  return { batchDir, combinedGemini, telemetryPath };
}

/** CLI entry when executed directly */
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const turnsIdx = argv.indexOf('--turns');
  const turns = turnsIdx >= 0 ? Math.max(1, Number(argv[turnsIdx + 1]) || 300) : 300;
  const seedIdx = argv.indexOf('--seed');
  const seed = seedIdx >= 0 ? Number(argv[seedIdx + 1]) || 100 : 100;
  const dry = argv.includes('--dry-run');
  const resumeIdx = argv.indexOf('--resume-dir');
  const resumeDir = resumeIdx >= 0 ? argv[resumeIdx + 1] : undefined;
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
  await runModesAgentsBatch({ turns, seed, outRoot, dryRun: dry, resumeDir });
}

const isDirect =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /modesAgents300|modes-agents/i.test(process.argv[1].replace(/\\/g, '/'));

if (isDirect) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
