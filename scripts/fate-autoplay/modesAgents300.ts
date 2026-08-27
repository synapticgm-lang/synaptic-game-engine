/**
 * 4 engine modes × 3 AI agent modes × N turns.
 * Writes progress log + **4 mode-specific Gemini packs** (primary) + improvement telemetry.
 * Combined 12-run file is optional (--combined-gemini, default off).
 *
 *   npm run fate-autoplay -- --modes-agents-300
 *   npm run fate-autoplay -- --split-modes-gemini --batch-dir scripts/fate-autoplay/runs/modes-agents-300t-...
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  disableAutoplayTestLab,
  runFateAutoplay,
  type AiAgentMode,
  type EngineMode,
} from '../../src/game/fateAutoplay';
import { MODES_AGENTS_BUILD_STAMP, writeModeGeminiPacks } from './buildModeGeminiPacks';

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

/** Worst cell per mode from 27w batch (modes-agents-300t-2026-08-27T12-07-17-166Z). */
export const WORST_CELLS_27W: Cell[] = [
  {
    engineMode: 'litrpg',
    bibleId: 'summoned-pact',
    personality: 'cold-system',
    agent: 'storyfollower',
    seed: 18,
  },
  {
    engineMode: 'dnd',
    bibleId: 'cursed-keep',
    personality: 'dry-wit',
    agent: 'storyfollower',
    seed: 69,
  },
  {
    engineMode: 'rpg',
    bibleId: 'cape-district-vigil',
    personality: 'chilled-gm',
    agent: 'completionist',
    seed: 137,
  },
  {
    engineMode: 'pyoa',
    bibleId: 'thornferry-road',
    personality: 'army-brief',
    agent: 'completionist',
    seed: 188,
  },
];

/**
 * Alternate flagship premades (≠ worst-cells bibles) for cross-premade coverage on 29b.
 * Agent: storyfollower consistently (cleaner cross-mode premade compare vs mixed worst-cells).
 */
export const ALT_CELLS_29B: Cell[] = [
  {
    engineMode: 'litrpg',
    bibleId: 'hero-awakening',
    personality: 'cold-system',
    agent: 'storyfollower',
    seed: 401,
  },
  {
    engineMode: 'dnd',
    bibleId: 'shattered-coast',
    personality: 'dry-wit',
    agent: 'storyfollower',
    seed: 418,
  },
  {
    engineMode: 'rpg',
    bibleId: 'salt-road-heist',
    personality: 'chilled-gm',
    agent: 'storyfollower',
    seed: 435,
  },
  {
    engineMode: 'pyoa',
    bibleId: 'vesper-glass-cipher',
    personality: 'army-brief',
    agent: 'storyfollower',
    seed: 452,
  },
];

function resolveGrid(opts: { worstCellsOnly?: boolean; altCellsOnly?: boolean; seed: number }): Cell[] {
  if (opts.altCellsOnly) return ALT_CELLS_29B;
  if (opts.worstCellsOnly) return WORST_CELLS_27W;
  return buildGrid(opts.seed);
}

function batchPrefixFor(opts: { worstCellsOnly?: boolean; altCellsOnly?: boolean }): string {
  if (opts.altCellsOnly) return 'alt-cells';
  if (opts.worstCellsOnly) return 'worst-cells';
  return 'modes-agents';
}

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
  /** Optional combined 12-run Gemini file (default off — use per-mode packs). */
  includeCombined?: boolean;
  /** HUD / quality-governance stamp written into Gemini manifests. */
  buildStamp?: string;
  /** Run only the 27w worst cell per mode (4 runs total). */
  worstCellsOnly?: boolean;
  /** Run only the 29b alternate-flagship cell per mode (4 runs total). */
  altCellsOnly?: boolean;
}): Promise<{
  batchDir: string;
  telemetryPath: string;
  indexPath: string;
  modeFiles: Array<{ mode: string; feedCopy: string }>;
  combinedGemini?: string;
}> {
  installNodeShims();
  if (opts.worstCellsOnly && opts.altCellsOnly) {
    throw new Error('Pass only one of --worst-cells-only or --alt-cells-only');
  }
  const batchId = opts.resumeDir
    ? opts.resumeDir
        .replace(/\\/g, '/')
        .split('/')
        .pop()!
        .replace(/^(modes-agents|worst-cells|alt-cells)-\d+t-/, '')
    : new Date().toISOString().replace(/[:.]/g, '-');
  const batchPrefix = batchPrefixFor(opts);
  const batchDir = opts.resumeDir
    ? opts.resumeDir
    : join(opts.outRoot, `${batchPrefix}-${opts.turns}t-${batchId}`);
  mkdirSync(batchDir, { recursive: true });
  writeFileSync(join(batchDir, 'batch.pid'), String(process.pid) + '\n');
  const grid = resolveGrid(opts);
  if (!opts.resumeDir) {
    writeFileSync(
      join(batchDir, 'batch-manifest.json'),
      JSON.stringify(
        {
          batchId,
          buildStamp: opts.buildStamp ?? MODES_AGENTS_BUILD_STAMP,
          turns: opts.turns,
          baseSeed: opts.seed,
          grid,
          worstCellsOnly: opts.worstCellsOnly === true,
          altCellsOnly: opts.altCellsOnly === true,
          agentPolicy: opts.altCellsOnly ? 'storyfollower-consistent' : undefined,
          sourceBatch: opts.worstCellsOnly
            ? 'modes-agents-300t-2026-08-27T12-07-17-166Z'
            : opts.altCellsOnly
              ? 'alt-premades-29b (≠ worst-cells bibles)'
              : undefined,
          startedAt: new Date().toISOString(),
        },
        null,
        2
      ) + '\n'
    );
  }
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

  const batchKind = opts.altCellsOnly
    ? 'Alt-cells'
    : opts.worstCellsOnly
      ? 'Worst-cells'
      : 'Modes×agents';
  log(
    `${batchKind} batch ${opts.resumeDir ? 'RESUME' : 'start'}: ${grid.length} runs × ${opts.turns} turns (~${grid.length * opts.turns} total)`
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
          outDir: existing,
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
          outDir: summary.outDir,
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

  const denseTelemetry = telemetryRows.filter(Boolean);
  const buildStamp = opts.buildStamp ?? MODES_AGENTS_BUILD_STAMP;

  const telemetryPath = join(batchDir, 'improvement-telemetry.json');
  const improvementNotes = {
    batchId,
    buildStamp,
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

  // Primary: 4 mode-specific Gemini packs + GEMINI-FEED-INDEX.md
  const telRows = denseTelemetry.map((r) => ({
    ...r,
    outDir: (r.outDir as string | undefined) ?? runDirs[Number(r.index) - 1],
  })) as import('./buildModeGeminiPacks').TelRow[];

  const { modeFiles, indexPath, combinedGemini } = writeModeGeminiPacks({
    batchId,
    batchDir,
    outRoot: opts.outRoot,
    turns: opts.turns,
    rows: telRows,
    grid,
    buildStamp,
    baseSeed: opts.seed,
    includeCombined: opts.includeCombined === true,
    log,
  });

  log(`Telemetry: ${telemetryPath}`);
  log('Modes×agents batch complete — upload one mode file per Gemini chat (see GEMINI-FEED-INDEX.md)');

  return {
    batchDir,
    telemetryPath,
    indexPath,
    modeFiles: modeFiles.map((f) => ({ mode: f.mode, feedCopy: f.feedCopy })),
    combinedGemini,
  };
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
  const includeCombined = argv.includes('--combined-gemini');
  const worstCellsOnly = argv.includes('--worst-cells-only');
  const altCellsOnly = argv.includes('--alt-cells-only') || argv.includes('--alt-cells');
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
  await runModesAgentsBatch({
    turns,
    seed,
    outRoot,
    dryRun: dry,
    resumeDir,
    includeCombined,
    worstCellsOnly,
    altCellsOnly,
  });
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
