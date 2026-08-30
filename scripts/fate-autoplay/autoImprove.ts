/**
 * Auto-improve loop (no human approval gate):
 *   Fate run (MiniMax) → dual review → allowlisted patch → vitest → re-run
 *
 * Safety rails (hard):
 * - Only patch files in PATCH_ALLOWLIST
 * - Max iterations (default 3)
 * - Vitest gate before accepting a patch
 * - Never commits / pushes / touches WOF / auth / billing / edge secrets
 * - Stops when no P0 tickets or patcher returns no edits
 *
 *   npm run fate-auto-improve -- --turns 8 --max-iters 2 --writer minimax
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { AUTO_IMPROVE_PATCH_ALLOWLIST } from '../../src/game/autoImproveAllowlist';
import { resolveMinimaxFreeCritic, resolveMinimaxAutoplayWriter } from '../../src/game/autoplayWriter';
import { chatCompletion } from './chatCompletion';
import { loadDotEnv } from './loadDotEnv';

const ROOT = resolve(process.cwd());

/** Only these owners may be auto-edited. Keep tight. */
export const PATCH_ALLOWLIST = AUTO_IMPROVE_PATCH_ALLOWLIST;

const VITEST_GATES = [
  'src/game/playtest30zCollagePrefix.test.ts',
  'src/game/playtest30yChromePerson.test.ts',
  'src/game/playtest30xCrowdAuthority.test.ts',
  'src/game/playtest31aHookLock.test.ts',
  'src/game/playtest31eNameAtmosphere.test.ts',
  'src/game/playtest31gCraftBook.test.ts',
];

type Ticket = {
  title: string;
  turns?: number[];
  quote?: string;
  owner?: string;
  severity?: string;
  source?: string;
};

function parseArgs(argv: string[]) {
  const out = {
    turns: 8,
    seed: 42,
    bible: 'summoned-pact',
    personality: 'cold-system',
    writer: 'minimax' as 'minimax' | 'default',
    maxIters: 3,
    agent: 'default',
    outRoot: join(ROOT, 'scripts', 'fate-autoplay', 'runs'),
    dryRun: false,
    skipPatch: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? '';
    if (a === '--turns') out.turns = Math.max(2, Number(next()) || 8);
    else if (a === '--seed') out.seed = Number(next()) || 42;
    else if (a === '--bible') out.bible = next();
    else if (a === '--personality') out.personality = next();
    else if (a === '--writer') out.writer = next() === 'default' ? 'default' : 'minimax';
    else if (a === '--max-iters') out.maxIters = Math.max(1, Math.min(8, Number(next()) || 3));
    else if (a === '--ai-agent-mode') out.agent = next() || 'default';
    else if (a === '--out') out.outRoot = next();
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--skip-patch') out.skipPatch = true;
  }
  return out;
}

function runNpm(args: string[], label: string): { ok: boolean; out: string } {
  const r = spawnSync('npm', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  if (r.status !== 0) {
    console.error(`[auto-improve] ${label} failed (exit ${r.status})`);
  }
  return { ok: r.status === 0, out };
}

function latestRunDir(outRoot: string, afterMs: number): string | null {
  if (!existsSync(outRoot)) return null;
  const dirs = readdirSync(outRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const p = join(outRoot, d.name);
      try {
        const meta = join(p, 'summary.json');
        if (!existsSync(meta)) return null;
        const st = readFileSync(meta, 'utf8');
        // prefer dirs whose name / mtime is recent enough
        return { p, name: d.name, raw: st };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ p: string; name: string; raw: string }>;

  // Prefer newest by name (ISO timestamp prefix)
  dirs.sort((a, b) => b.name.localeCompare(a.name));
  for (const d of dirs) {
    // Ignore dirs that clearly predate this loop start if we can parse startedAt
    try {
      const j = JSON.parse(d.raw) as { startedAt?: string };
      if (j.startedAt && Date.parse(j.startedAt) >= afterMs - 5_000) return d.p;
    } catch {
      /* fall through */
    }
  }
  return dirs[0]?.p ?? null;
}

function extractJsonBlocks(text: string): unknown[] {
  const out: unknown[] = [];
  const re = /```json\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    try {
      out.push(JSON.parse(m[1]!));
    } catch {
      /* ignore */
    }
  }
  if (!out.length) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        out.push(JSON.parse(text.slice(start, end + 1)));
      } catch {
        /* ignore */
      }
    }
  }
  return out;
}

function collectTickets(runDir: string): Ticket[] {
  const reviewDir = join(runDir, 'dual-review');
  if (!existsSync(reviewDir)) return [];
  const tickets: Ticket[] = [];
  for (const name of readdirSync(reviewDir)) {
    if (!name.endsWith('.md')) continue;
    const text = readFileSync(join(reviewDir, name), 'utf8');
    for (const block of extractJsonBlocks(text)) {
      const b = block as { p0?: Ticket[]; p1?: Ticket[]; findings?: Ticket[] };
      for (const t of [...(b.p0 ?? []), ...(b.p1 ?? []), ...(b.findings ?? [])]) {
        if (!t?.title) continue;
        tickets.push({
          ...t,
          severity: t.severity ?? (b.p0?.includes(t) ? 'P0' : 'P1'),
          source: name,
        });
      }
    }
  }
  // Dedupe by title
  const seen = new Set<string>();
  return tickets.filter((t) => {
    const k = t.title.toLowerCase().trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseSearchReplaceBlocks(text: string): Array<{ path: string; old: string; next: string }> {
  const blocks: Array<{ path: string; old: string; next: string }> = [];
  const re =
    /<<<<<<<\s*SEARCH\s+path=([^\n]+)\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>\s*REPLACE/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const path = m[1]!.trim().replace(/\\/g, '/');
    blocks.push({ path, old: m[2]!, next: m[3]! });
  }
  return blocks;
}

function applyAllowlistedEdits(
  blocks: Array<{ path: string; old: string; next: string }>,
  logDir: string
): { applied: number; skipped: string[] } {
  const skipped: string[] = [];
  let applied = 0;
  const manifest: unknown[] = [];

  for (const b of blocks) {
    const rel = b.path.replace(/^\.\//, '');
    if (!(PATCH_ALLOWLIST as readonly string[]).includes(rel)) {
      skipped.push(`not-allowlisted:${rel}`);
      continue;
    }
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) {
      skipped.push(`missing:${rel}`);
      continue;
    }
    const before = readFileSync(abs, 'utf8');
    if (!before.includes(b.old)) {
      skipped.push(`no-match:${rel}`);
      continue;
    }
    // Only first occurrence — safer
    const after = before.replace(b.old, b.next);
    if (after === before) {
      skipped.push(`unchanged:${rel}`);
      continue;
    }
    writeFileSync(abs, after, 'utf8');
    applied++;
    manifest.push({ path: rel, oldChars: b.old.length, newChars: b.next.length });
  }

  writeFileSync(
    join(logDir, 'patch-manifest.json'),
    JSON.stringify({ applied, skipped, manifest, at: new Date().toISOString() }, null, 2) + '\n'
  );
  return { applied, skipped };
}

async function proposePatches(tickets: Ticket[], logDir: string): Promise<string> {
  const patcher = resolveMinimaxFreeCritic();

  const fileBundles = PATCH_ALLOWLIST.map((rel) => {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) return null;
    let body = readFileSync(abs, 'utf8');
    if (body.length > 40_000) body = body.slice(0, 40_000) + '\n/* …truncated… */\n';
    return `### FILE ${rel}\n\`\`\`ts\n${body}\n\`\`\``;
  })
    .filter(Boolean)
    .join('\n\n');

  const system = [
    'You are SynapticGM auto-patcher. You fix continuity/craft bugs found by critics.',
    'Output ONLY search/replace blocks in this exact format (no prose outside blocks):',
    '',
    '<<<<<<< SEARCH path=src/game/proseWarden.ts',
    'exact old snippet',
    '=======',
    'exact new snippet',
    '>>>>>>> REPLACE',
    '',
    'Rules:',
    '- Only edit allowlisted files listed below.',
    '- Prefer smallest deterministic fix (regex scrub, deny-list, craft flag) — no new LLM critic paths.',
    '- Do not touch WOF, auth, billing, supabase secrets, or HUD stamps.',
    '- If nothing safe to fix, output exactly: NO_PATCH',
    '- Mid writer must stay OFF; do not enable STAGNATION_MID_WRITER.',
  ].join('\n');

  const user = [
    '## P0/P1 tickets from dual review',
    JSON.stringify(tickets.slice(0, 12), null, 2),
    '',
    '## Allowlisted file contents',
    fileBundles,
  ].join('\n');

  const text = await chatCompletion({
    baseUrl: patcher.baseUrl,
    apiKey: patcher.apiKey,
    model: patcher.model,
    system,
    user,
    temperature: 0.1,
    maxTokens: 8192,
    timeoutMs: 240_000,
  });
  writeFileSync(join(logDir, 'patcher-raw.md'), text + '\n');
  return text;
}

function runVitestGate(): boolean {
  const existing = VITEST_GATES.filter((p) => existsSync(join(ROOT, p)));
  if (!existing.length) {
    console.warn('[auto-improve] no vitest gates found — skipping test gate');
    return true;
  }
  const { ok, out } = runNpm(['run', 'test', '--', ...existing], 'vitest-gate');
  writeFileSync(join(ROOT, 'scripts/fate-autoplay/runs/_last-vitest-gate.log'), out);
  return ok;
}

async function main(): Promise<void> {
  loadDotEnv();
  const opts = parseArgs(process.argv.slice(2));
  const loopRoot = join(opts.outRoot, `auto-improve-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  mkdirSync(loopRoot, { recursive: true });

  console.log('[auto-improve] loop dir', relative(ROOT, loopRoot));
  console.log('[auto-improve] rails: allowlist', PATCH_ALLOWLIST.length, 'files; maxIters', opts.maxIters);
  console.log('[auto-improve] NO human approval — stops on NO_PATCH / no P0 / vitest fail / max iters');

  // Prove credentials early
  if (!opts.dryRun && opts.writer === 'minimax') {
    const w = resolveMinimaxAutoplayWriter();
    console.log(`[auto-improve] writer ${w.route} ${w.model}`);
  }

  let lastRunDir: string | null = null;
  const history: unknown[] = [];

  for (let iter = 1; iter <= opts.maxIters; iter++) {
    const iterDir = join(loopRoot, `iter-${iter}`);
    mkdirSync(iterDir, { recursive: true });
    const started = Date.now();
    console.log(`\n=== ITER ${iter}/${opts.maxIters} ===`);

    const fateArgs = [
      'run',
      'fate-autoplay',
      '--',
      '--turns',
      String(opts.turns),
      '--seed',
      String(opts.seed + iter - 1),
      '--bible',
      opts.bible,
      '--personality',
      opts.personality,
      '--writer',
      opts.writer,
      '--ai-agent-mode',
      opts.agent,
      '--out',
      opts.outRoot,
    ];
    if (opts.dryRun) fateArgs.push('--dry-run');

    const fate = runNpm(fateArgs, `fate-iter-${iter}`);
    writeFileSync(join(iterDir, 'fate.log'), fate.out);
    if (!fate.ok && !opts.dryRun) {
      history.push({ iter, stop: 'fate-failed' });
      break;
    }

    lastRunDir = latestRunDir(opts.outRoot, started);
    if (!lastRunDir) {
      history.push({ iter, stop: 'no-run-dir' });
      break;
    }
    writeFileSync(join(iterDir, 'run-dir.txt'), lastRunDir + '\n');

    if (opts.dryRun) {
      history.push({ iter, runDir: lastRunDir, stop: 'dry-run' });
      console.log('[auto-improve] dry-run — skip review/patch');
      break;
    }

    const review = runNpm(
      ['run', 'fate-dual-review', '--', '--run-dir', lastRunDir],
      `dual-review-iter-${iter}`
    );
    writeFileSync(join(iterDir, 'review.log'), review.out);
    const deferred =
      existsSync(join(lastRunDir, 'dual-review', 'REVIEW_DEFERRED')) ||
      (() => {
        try {
          const idx = JSON.parse(
            readFileSync(join(lastRunDir, 'dual-review', 'INDEX.json'), 'utf8')
          ) as { status?: string };
          return idx.status === 'review-deferred';
        } catch {
          return false;
        }
      })();
    if (!review.ok || deferred) {
      // Batch D — do not zero patches / poison; queue morning Gemini paste
      history.push({
        iter,
        runDir: lastRunDir,
        stop: 'review-deferred',
        note: 'Critic 429/DNS — pastes written; skip patch this iter',
      });
      console.warn('[auto-improve] review deferred — keeping prior patches; morning Gemini paste ready');
      break;
    }

    const tickets = collectTickets(lastRunDir);
    writeFileSync(join(iterDir, 'tickets.json'), JSON.stringify(tickets, null, 2) + '\n');
    const p0 = tickets.filter((t) => (t.severity ?? 'P0').toUpperCase().startsWith('P0'));
    console.log(`[auto-improve] tickets=${tickets.length} p0=${p0.length}`);

    if (p0.length === 0) {
      history.push({ iter, runDir: lastRunDir, tickets: tickets.length, stop: 'no-p0-pass' });
      console.log('[auto-improve] no P0 tickets — treating as pass, stopping.');
      break;
    }

    if (opts.skipPatch) {
      history.push({ iter, runDir: lastRunDir, tickets: tickets.length, stop: 'skip-patch' });
      break;
    }

    const patchRaw = await proposePatches(p0.length ? p0 : tickets, iterDir);
    if (/^\s*NO_PATCH\s*$/m.test(patchRaw) || !patchRaw.includes('<<<<<<< SEARCH')) {
      history.push({ iter, runDir: lastRunDir, tickets: tickets.length, stop: 'no-patch' });
      console.log('[auto-improve] patcher returned NO_PATCH — stopping.');
      break;
    }

    const blocks = parseSearchReplaceBlocks(patchRaw);
    const { applied, skipped } = applyAllowlistedEdits(blocks, iterDir);
    console.log(`[auto-improve] applied=${applied} skipped=${skipped.length}`);
    if (applied === 0) {
      history.push({ iter, runDir: lastRunDir, stop: 'nothing-applied', skipped });
      break;
    }

    if (!runVitestGate()) {
      // revert this iter's files from git if possible
      console.error('[auto-improve] vitest gate failed — reverting allowlisted files via git checkout');
      spawnSync('git', ['checkout', '--', ...PATCH_ALLOWLIST], { cwd: ROOT, shell: true });
      history.push({ iter, runDir: lastRunDir, stop: 'vitest-failed-reverted' });
      break;
    }

    history.push({ iter, runDir: lastRunDir, tickets: tickets.length, p0: p0.length, applied, continue: true });
  }

  writeFileSync(
    join(loopRoot, 'loop-summary.json'),
    JSON.stringify(
      {
        history,
        lastRunDir,
        allowlist: PATCH_ALLOWLIST,
        at: new Date().toISOString(),
        note: 'Auto-improve does not commit or deploy. Review loop-summary + dual-review before shipping.',
      },
      null,
      2
    ) + '\n'
  );
  console.log('\n[auto-improve] done →', relative(ROOT, loopRoot));
  console.log('[auto-improve] last run', lastRunDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
