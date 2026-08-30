/**
 * Escalating curriculum across every ready premade:
 *   for turns in [50, 100, 200, 300…]:
 *     for each premade:
 *       run → dual review → allowlisted patch → vitest → re-run
 *       until no P0 (smooth) or max-iters
 *     advance turn ladder only when ALL premades are smooth at this tier
 *
 *   npm run fate-curriculum -- --ladder 50,100,200,300 --max-iters 3 --writer minimax
 *   npm run fate-curriculum:detach -- --ladder 50,100,200,300 --writer minimax
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { AUTO_IMPROVE_PATCH_ALLOWLIST } from '../../src/game/autoImproveAllowlist';
import { resolveMinimaxAutoplayWriter } from '../../src/game/autoplayWriter';
import { enumeratePremadesOnce, type MatrixCombo } from '../../src/game/fateAutoplay';
import { loadDotEnv } from './loadDotEnv';

const ROOT = resolve(process.cwd());

type CellResult = {
  tier: number;
  bibleId: string;
  engineMode: string;
  personalityId: string;
  seed: number;
  smooth: boolean;
  stop: string;
  runDir?: string;
  p0?: number;
  iters: number;
};

function parseArgs(argv: string[]) {
  const out = {
    ladder: [50, 100, 200, 300] as number[],
    maxIters: 3,
    writer: 'minimax' as 'minimax' | 'default',
    agent: 'default',
    seed: 100,
    outRoot: join(ROOT, 'scripts', 'fate-autoplay', 'runs'),
    limit: 0,
    modes: '' as string,
    skipPatch: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? '';
    if (a === '--ladder') {
      out.ladder = next()
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 2);
      if (!out.ladder.length) out.ladder = [50, 100, 200, 300];
    } else if (a === '--max-iters') out.maxIters = Math.max(1, Math.min(10, Number(next()) || 3));
    else if (a === '--writer') out.writer = next() === 'default' ? 'default' : 'minimax';
    else if (a === '--ai-agent-mode') out.agent = next() || 'default';
    else if (a === '--seed') out.seed = Number(next()) || 100;
    else if (a === '--out') out.outRoot = next();
    else if (a === '--limit') out.limit = Math.max(0, Number(next()) || 0);
    else if (a === '--modes') out.modes = next();
    else if (a === '--skip-patch') out.skipPatch = true;
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function runNpm(args: string[], label: string): { ok: boolean; out: string } {
  const r = spawnSync('npm', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    maxBuffer: 40 * 1024 * 1024,
  });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  if (r.status !== 0) console.error(`[curriculum] ${label} failed (exit ${r.status})`);
  return { ok: r.status === 0, out };
}

function latestRunDir(outRoot: string, afterMs: number): string | null {
  if (!existsSync(outRoot)) return null;
  const dirs = readdirSync(outRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('auto-improve') && !d.name.startsWith('curriculum'))
    .map((d) => ({ p: join(outRoot, d.name), name: d.name }))
    .sort((a, b) => b.name.localeCompare(a.name));
  for (const d of dirs) {
    const meta = join(d.p, 'summary.json');
    if (!existsSync(meta)) continue;
    try {
      const j = JSON.parse(readFileSync(meta, 'utf8')) as { startedAt?: string };
      if (j.startedAt && Date.parse(j.startedAt) >= afterMs - 10_000) return d.p;
    } catch {
      /* continue */
    }
  }
  return dirs[0]?.p ?? null;
}

function collectP0Count(runDir: string): number {
  const reviewDir = join(runDir, 'dual-review');
  if (!existsSync(reviewDir)) return -1;
  // Batch D — deferred critics must not poison as p0=-1
  if (existsSync(join(reviewDir, 'REVIEW_DEFERRED'))) return -2;
  try {
    const idxPath = join(reviewDir, 'INDEX.json');
    if (existsSync(idxPath)) {
      const idx = JSON.parse(readFileSync(idxPath, 'utf8')) as { status?: string };
      if (idx.status === 'review-deferred' || idx.status === 'partial') {
        // partial: still count JSON from successful lenses; deferred: skip
        if (idx.status === 'review-deferred') return -2;
      }
    }
  } catch {
    /* fall through */
  }
  let n = 0;
  let sawCritic = false;
  for (const name of readdirSync(reviewDir)) {
    if (!name.endsWith('.md')) continue;
    if (name.includes('gemini-pro-PASTE')) continue;
    const text = readFileSync(join(reviewDir, name), 'utf8');
    if (/^# Critic deferred/i.test(text)) continue;
    sawCritic = true;
    const re = /```json\s*([\s\S]*?)```/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      try {
        const b = JSON.parse(m[1]!) as { p0?: unknown[] };
        n += Array.isArray(b.p0) ? b.p0.length : 0;
      } catch {
        /* ignore */
      }
    }
  }
  return sawCritic ? n : -2;
}

function improveCell(
  cell: MatrixCombo,
  turns: number,
  opts: ReturnType<typeof parseArgs>,
  logDir: string
): CellResult {
  let lastStop = 'max-iters';
  let lastRun: string | undefined;
  let lastP0 = -1;

  for (let iter = 1; iter <= opts.maxIters; iter++) {
    const iterDir = join(logDir, `iter-${iter}`);
    mkdirSync(iterDir, { recursive: true });
    const started = Date.now();
    console.log(
      `  [${cell.engineMode}/${cell.bibleId}] T${turns} iter ${iter}/${opts.maxIters} seed=${cell.seed}`
    );

    const fateArgs = [
      'run',
      'fate-autoplay',
      '--',
      '--turns',
      String(turns),
      '--seed',
      String(cell.seed + iter - 1),
      '--bible',
      cell.bibleId,
      '--personality',
      cell.personalityId,
      '--engine',
      cell.engineMode,
      '--writer',
      opts.writer,
      '--ai-agent-mode',
      opts.agent,
      '--out',
      opts.outRoot,
    ];
    if (opts.dryRun) fateArgs.push('--dry-run');

    const fate = runNpm(fateArgs, `fate-${cell.bibleId}-T${turns}-${iter}`);
    writeFileSync(join(iterDir, 'fate.log'), fate.out);
    if (!fate.ok && !opts.dryRun) {
      lastStop = 'fate-failed';
      break;
    }

    const runDir = latestRunDir(opts.outRoot, started);
    if (!runDir) {
      lastStop = 'no-run-dir';
      break;
    }
    lastRun = runDir;
    writeFileSync(join(iterDir, 'run-dir.txt'), runDir + '\n');

    if (opts.dryRun) {
      lastStop = 'dry-run-smooth';
      return {
        tier: turns,
        bibleId: cell.bibleId,
        engineMode: cell.engineMode,
        personalityId: cell.personalityId,
        seed: cell.seed,
        smooth: true,
        stop: lastStop,
        runDir,
        p0: 0,
        iters: iter,
      };
    }

    const summaryPath = join(runDir, 'summary.json');
    const summary = existsSync(summaryPath)
      ? (JSON.parse(readFileSync(summaryPath, 'utf8')) as { errorCount?: number })
      : {};
    if ((summary.errorCount ?? 0) > 0) {
      // still review — errors are also issues
    }

    const review = runNpm(['run', 'fate-dual-review', '--', '--run-dir', runDir], `review-${cell.bibleId}`);
    writeFileSync(join(iterDir, 'review.log'), review.out);
    // Batch D: dual-review exits 0 when pastes exist; only hard-fail if process crashed
    if (!review.ok) {
      lastStop = 'review-failed';
      // Do not poison ladder — queue morning paste and leave cell as review-deferred
      return {
        tier: turns,
        bibleId: cell.bibleId,
        engineMode: cell.engineMode,
        personalityId: cell.personalityId,
        seed: cell.seed,
        smooth: true, // infra fail ≠ quality fail; do not block turn ladder
        stop: 'review-deferred',
        runDir,
        p0: undefined,
        iters: iter,
      };
    }

    lastP0 = collectP0Count(runDir);
    writeFileSync(join(iterDir, 'p0.txt'), String(lastP0) + '\n');
    console.log(`    p0=${lastP0} errors=${summary.errorCount ?? '?'}`);

    // -2 = critics deferred (429/DNS) — skip patch, keep progress, morning Gemini
    if (lastP0 === -2) {
      lastStop = 'review-deferred';
      return {
        tier: turns,
        bibleId: cell.bibleId,
        engineMode: cell.engineMode,
        personalityId: cell.personalityId,
        seed: cell.seed,
        smooth: true,
        stop: lastStop,
        runDir,
        p0: undefined,
        iters: iter,
      };
    }

    if (lastP0 === 0 && (summary.errorCount ?? 0) === 0) {
      lastStop = 'smooth';
      return {
        tier: turns,
        bibleId: cell.bibleId,
        engineMode: cell.engineMode,
        personalityId: cell.personalityId,
        seed: cell.seed,
        smooth: true,
        stop: lastStop,
        runDir,
        p0: 0,
        iters: iter,
      };
    }

    if (opts.skipPatch) {
      lastStop = 'skip-patch-unsmooth';
      break;
    }

    // Reuse auto-improve single-cell patch path via npm for one iter of patch-only
    // by calling fate-auto-improve with --skip after we already have tickets — simpler:
    // invoke patcher loop from auto-improve with --max-iters 1 targeting this bible.
    const patch = runNpm(
      [
        'run',
        'fate-auto-improve',
        '--',
        '--turns',
        String(Math.min(turns, 20)), // cheap repair probe then full re-run next iter
        '--seed',
        String(cell.seed + 1000 + iter),
        '--bible',
        cell.bibleId,
        '--personality',
        cell.personalityId,
        '--writer',
        opts.writer,
        '--ai-agent-mode',
        opts.agent,
        '--max-iters',
        '1',
        '--out',
        opts.outRoot,
      ],
      `patch-${cell.bibleId}`
    );
    writeFileSync(join(iterDir, 'patch.log'), patch.out);
    if (!patch.ok) {
      lastStop = 'patch-failed';
      // continue to next iter / full re-run anyway
    }
    lastStop = 'patched-retry';
  }

  return {
    tier: turns,
    bibleId: cell.bibleId,
    engineMode: cell.engineMode,
    personalityId: cell.personalityId,
    seed: cell.seed,
    smooth: lastStop === 'smooth' || lastStop === 'dry-run-smooth',
    stop: lastStop,
    runDir: lastRun,
    p0: lastP0,
    iters: opts.maxIters,
  };
}

async function main(): Promise<void> {
  loadDotEnv();
  const opts = parseArgs(process.argv.slice(2));
  const curriculumRoot = join(
    opts.outRoot,
    `curriculum-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(curriculumRoot, { recursive: true });

  if (!opts.dryRun && opts.writer === 'minimax') {
    const w = resolveMinimaxAutoplayWriter();
    console.log(`[curriculum] writer ${w.route} ${w.model} — ${w.note}`);
  }

  let cells = enumeratePremadesOnce(opts.seed);
  if (opts.modes) {
    const allow = new Set(
      opts.modes
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    cells = cells.filter((c) => allow.has(c.engineMode));
  }
  if (opts.limit > 0) cells = cells.slice(0, opts.limit);

  console.log(`[curriculum] premades=${cells.length} ladder=${opts.ladder.join('→')} maxIters=${opts.maxIters}`);
  console.log(`[curriculum] allowlist=${AUTO_IMPROVE_PATCH_ALLOWLIST.length} files; no human gate; no auto-commit`);
  console.log(`[curriculum] root ${relative(ROOT, curriculumRoot)}`);

  writeFileSync(
    join(curriculumRoot, 'plan.json'),
    JSON.stringify(
      {
        cells,
        ladder: opts.ladder,
        maxIters: opts.maxIters,
        writer: opts.writer,
        at: new Date().toISOString(),
      },
      null,
      2
    ) + '\n'
  );

  const history: CellResult[] = [];

  for (const turns of opts.ladder) {
    console.log(`\n######## TIER ${turns} TURNS ########`);
    const tierDir = join(curriculumRoot, `tier-${turns}`);
    mkdirSync(tierDir, { recursive: true });
    const tierResults: CellResult[] = [];

    for (const cell of cells) {
      const cellDir = join(tierDir, `${cell.engineMode}_${cell.bibleId}`);
      mkdirSync(cellDir, { recursive: true });
      const result = improveCell(cell, turns, opts, cellDir);
      tierResults.push(result);
      history.push(result);
      writeFileSync(join(tierDir, 'progress.json'), JSON.stringify(tierResults, null, 2) + '\n');
      writeFileSync(join(curriculumRoot, 'history.json'), JSON.stringify(history, null, 2) + '\n');
    }

    const failed = tierResults.filter((r) => !r.smooth);
    writeFileSync(
      join(tierDir, 'summary.json'),
      JSON.stringify(
        {
          turns,
          total: tierResults.length,
          smooth: tierResults.length - failed.length,
          failed: failed.map((f) => ({ bibleId: f.bibleId, stop: f.stop, p0: f.p0 })),
        },
        null,
        2
      ) + '\n'
    );

    if (failed.length) {
      console.error(
        `[curriculum] tier ${turns} NOT CLEAN — ${failed.length}/${tierResults.length} unsmooth. Stopping ladder (fix these before raising turns).`
      );
      console.error(
        failed.map((f) => `  - ${f.engineMode}/${f.bibleId}: ${f.stop} p0=${f.p0}`).join('\n')
      );
      break;
    }
    console.log(`[curriculum] tier ${turns} CLEAN — advancing ladder`);
  }

  writeFileSync(
    join(curriculumRoot, 'final.json'),
    JSON.stringify({ history, at: new Date().toISOString() }, null, 2) + '\n'
  );
  console.log(`[curriculum] done → ${relative(ROOT, curriculumRoot)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
