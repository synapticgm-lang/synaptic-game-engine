/**
 * Fate autoplay CLI — headless Seedable Fate's Pick runs.
 *
 * Usage:
 *   npm run fate-autoplay -- --turns 20 --seed 1 --bible summoned-pact
 *   npm run fate-autoplay -- --matrix-40 --turns 20
 *   npm run fate-autoplay -- --night-storyforge
 *   npm run fate-autoplay -- --dry-run --turns 2
 */

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildBalancedMatrix40,
  disableAutoplayTestLab,
  enumerateLaunchMatrix,
  matrixBudgetLines,
  parseFateArgs,
  runFateAutoplay,
  type AiAgentMode,
  type FateAutoplayCliOpts,
} from '../../src/game/fateAutoplay';
import { runModesAgentsBatch } from './modesAgents300';
import { regenerateModeGeminiPacks } from './splitModesGemini';
import { loadDotEnv } from './loadDotEnv';

/** Minimal localStorage for Node (Test Lab / capacity / settings never touch John's browser). */
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

function printHelp(): void {
  console.log(`
Fate autoplay (headless)

  npm run fate-autoplay -- [options]

Options:
  --turns N            Turns per run (default 20)
  --seed N             RNG seed (default 1)
  --bible ID           Premade id (default summoned-pact)
  --personality ID     LitRPG systemPersonality or gmPersonality
  --engine MODE        litrpg | dnd | rpg | pyoa
  --ai-tier free|mid|high
  --writer default|flash-lite|openrouter|minimax
                       flash-lite/openrouter = OpenRouter google/gemini-2.5-flash-lite (needs OPENROUTER_API_KEY)
                       minimax = Vercel Gateway free MiniMax (needs AI_GATEWAY_API_KEY)
                       default = hosted Free via edge gm-turn
  --pick-mode fate|first-pad
  --ai-agent-mode MODE default|maxlevel|storyfollower|completionist (goal-oriented AI)
  --modes-agents-300   4 modes × 3 AI agents × 300 turns → 4 mode Gemini packs + telemetry
  --worst-cells-only   With --modes-agents-300: only 27w worst cell per mode (4 runs)
  --alt-cells-only     With --modes-agents-300: 4 alternate flagships (≠ worst-cells bibles)
  --split-modes-gemini Regenerate mode Gemini packs from --batch-dir (no re-run)
  --batch-dir PATH     Batch folder for --split-modes-gemini
  --combined-gemini    Also write optional combined 12-run file (default off)
  --resume-dir PATH    Resume modes-agents batch (skip completed cells)
  --night-storyforge   ~7h batch @ observed ~1.6s/turn: 3×500 AI spines + 3× matrix-40×100 (~13.5k turns)
  --matrix-40          John's 40 plan (10×4 modes; every premade once when ≤10)
  --matrix             Full Launch cartesian (mode × premade × narrator)
  --matrix-limit N     Cap matrix runs
  --dry-run            No GM calls (smoke harness)
  --out DIR            Output root (default scripts/fate-autoplay/runs)
  --name NAME          PC name (default Jax)
  --help

Capacity: process-local Test Lab unlimited (does not change production Free limits).
Outputs per run: transcript.md, turns.jsonl, summary.json, meta.json

Related:
  npm run fate-dual-review -- --run-dir <run>
  npm run fate-auto-improve -- --turns 8 --max-iters 2 --writer flash-lite
  npm run fate-curriculum -- --ladder 50 --writer flash-lite
  npm run fate-curriculum:detach -- --ladder 50 --max-iters 3
`);
  for (const line of matrixBudgetLines(20)) console.log(line);
}

async function runNightStoryforge(
  opts: FateAutoplayCliOpts,
  log: (msg: string) => void,
  batchStarted: string,
  progressLog: string
): Promise<void> {
  /**
   * Timing calibrated from live matrix-40×100 (2026-08-26):
   * 4000 turns in ~1h56m, p50 ~1.6s/turn → ~2070 turns/hour.
   * 7h budget ≈ 14,500 turns. This plan ≈ 13,500 (~6.5h) with buffer.
   */
  const bibleId = opts.bibleId || 'summoned-pact';
  const seed = opts.seed || 42;
  const aiSpineTurns = 500;
  const matrixTurns = 100;
  const matrixRounds = 3;
  const spines: Array<{ mode: AiAgentMode; label: string }> = [
    { mode: 'maxlevel', label: 'maxlevel' },
    { mode: 'storyfollower', label: 'storyfollower' },
    { mode: 'completionist', label: 'completionist' },
  ];
  const totalTurns =
    spines.length * aiSpineTurns + matrixRounds * 40 * matrixTurns;

  const plan = {
    batchStarted,
    kind: 'night-storyforge',
    calibratedFrom: 'matrix-40×100 wall ~1h56m / 4000 turns / p50~1.6s (2026-08-26)',
    budgetNote: `~${totalTurns} turns · ETA ~6.5h @ observed pace · Flash Lite text-only (cost scales with turns, not wall clock — expect several $ not ≤$1)`,
    blockA: spines.map((s) => ({
      turns: aiSpineTurns,
      seed,
      bibleId,
      aiAgentMode: s.mode,
    })),
    blockB: Array.from({ length: matrixRounds }, (_, i) => ({
      matrix40: true,
      turns: matrixTurns,
      seed: 1 + i * 1000,
    })),
    progressLog,
  };
  writeFileSync(
    join(opts.outRoot, `night-storyforge-plan-${batchStarted.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(plan, null, 2) + '\n'
  );

  log(
    `Starting night-storyforge — Block A: 3×${aiSpineTurns} AI spines (${bibleId}, seed=${seed}) then Block B: ${matrixRounds}× matrix-40×${matrixTurns}`
  );
  log(
    `Calibrated ETA ≈ 6.5 h (~${totalTurns} turns @ ~1.6s p50 from earlier 40×100). Progress: ${progressLog}`
  );

  const summaries = [];

  for (let i = 0; i < spines.length; i++) {
    const s = spines[i]!;
    log(`[A ${i + 1}/3] ${bibleId} ai-agent=${s.label} turns=${aiSpineTurns} seed=${seed}`);
    const summary = await runFateAutoplay({
      turns: aiSpineTurns,
      seed,
      bibleId,
      personality: opts.personality,
      engineMode: opts.engineMode ?? 'litrpg',
      aiTier: opts.aiTier,
      mode: opts.mode,
      aiAgentMode: s.mode,
      dryRun: opts.dryRun,
      outRoot: opts.outRoot,
      characterName: opts.characterName,
      writer: opts.writer,
    });
    summaries.push({ block: 'A', aiAgentMode: s.mode, ...summary });
    log(
      `  → done turns=${summary.completedTurns} errors=${summary.errorCount} timeouts=${summary.timeoutCount} p50=${summary.latencyMs.p50}ms dir=${summary.outDir}`
    );
    if (summary.errorCount && summary.issueTurns.some((t) => t.failKind === 'auth')) {
      log('AUTH failure — stopping night-storyforge early. Check Supabase / session.');
      writeFileSync(
        join(opts.outRoot, `night-storyforge-batch-${batchStarted.replace(/[:.]/g, '-')}.json`),
        JSON.stringify({ batchStarted, endedAt: new Date().toISOString(), stopped: 'auth', summaries }, null, 2) +
          '\n'
      );
      return;
    }
  }

  for (let round = 0; round < matrixRounds; round++) {
    const roundSeed = 1 + round * 1000;
    log(`[B${round + 1}/${matrixRounds}] matrix-40 × ${matrixTurns} turns (seed base=${roundSeed})`);
    const { combos: balanced, deferred, notes } = buildBalancedMatrix40(roundSeed);
    const combos = balanced;
    for (const n of notes) log(`note: ${n}`);
    if (deferred.length) {
      log(`Deferred premades (RPG overflow): ${deferred.map((d) => d.bibleId).join(', ')}`);
    }

    for (let i = 0; i < combos.length; i++) {
      const c = combos[i]!;
      log(
        `[B${round + 1} ${i + 1}/${combos.length}] ${c.engineMode} ${c.bibleId} ${c.personalityId} seed=${c.seed}`
      );
      const summary = await runFateAutoplay({
        turns: matrixTurns,
        seed: c.seed,
        bibleId: c.bibleId,
        personality: c.personalityId,
        engineMode: c.engineMode,
        aiTier: opts.aiTier,
        mode: opts.mode,
        aiAgentMode: 'default',
        dryRun: opts.dryRun,
        outRoot: opts.outRoot,
        characterName: opts.characterName,
        writer: opts.writer,
      });
      summaries.push({ block: `B${round + 1}`, aiAgentMode: 'default', ...summary });
      log(
        `  → done turns=${summary.completedTurns} errors=${summary.errorCount} timeouts=${summary.timeoutCount} p50=${summary.latencyMs.p50}ms dir=${summary.outDir}`
      );
      if (summary.errorCount && summary.issueTurns.some((t) => t.failKind === 'auth')) {
        log('AUTH failure — stopping night-storyforge early. Check Supabase / session.');
        writeFileSync(
          join(opts.outRoot, `night-storyforge-batch-${batchStarted.replace(/[:.]/g, '-')}.json`),
          JSON.stringify({ batchStarted, endedAt: new Date().toISOString(), stopped: 'auth', summaries }, null, 2) +
            '\n'
        );
        return;
      }
    }
  }

  writeFileSync(
    join(opts.outRoot, `night-storyforge-batch-${batchStarted.replace(/[:.]/g, '-')}.json`),
    JSON.stringify({ batchStarted, endedAt: new Date().toISOString(), summaries }, null, 2) + '\n'
  );
  log(`Night-storyforge complete — ${summaries.length} runs logged (~${totalTurns} turns planned)`);
}

async function main(): Promise<void> {
  loadDotEnv();
  installNodeShims();
  const opts = parseFateArgs(process.argv.slice(2));
  if (opts.turns < 0) {
    printHelp();
    process.exit(0);
  }

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  const hasEnv = Boolean(supabaseUrl && supabaseKey);
  const usesClientWriter = opts.writer === 'minimax' || opts.writer === 'flash-lite';

  if (!opts.dryRun && !hasEnv && !usesClientWriter) {
    console.error(
      '[fate-autoplay] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — cannot call gm-turn.\n' +
        '  Put them in .env / .env.local, or run with --dry-run to smoke the harness.\n' +
        '  Or use --writer flash-lite with OPENROUTER_API_KEY (client GM path),\n' +
        '  or --writer minimax with AI_GATEWAY_API_KEY.\n' +
        '  Exact live command once secrets exist:\n' +
        '    npm run fate-autoplay -- --night-storyforge\n' +
        '  ETA (~420 turns @ 45–75s/turn): ~6–7.5 hours sequential. Cost ≤~$1 Free Flash Lite.\n'
    );
    for (const line of matrixBudgetLines(opts.turns)) console.error(line);
    process.exit(2);
  }

  const batchStarted = new Date().toISOString();
  const progressLog = join(
    opts.outRoot,
    opts.nightStoryforge
      ? `night-storyforge-progress-${batchStarted.replace(/[:.]/g, '-')}.log`
      : opts.modesAgents300
        ? `modes-agents-progress-${batchStarted.replace(/[:.]/g, '-')}.log`
        : `matrix-progress-${batchStarted.replace(/[:.]/g, '-')}.log`
  );
  mkdirSync(opts.outRoot, { recursive: true });

  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    try {
      appendFileSync(progressLog, line + '\n');
    } catch {
      /* ignore */
    }
  };

  try {
    if (opts.modesAgents300) {
      await runModesAgentsBatch({
        turns: opts.turns > 0 && opts.turns !== 20 ? opts.turns : 300,
        seed: opts.seed || 100,
        outRoot: opts.outRoot,
        dryRun: opts.dryRun,
        resumeDir: opts.resumeDir,
        includeCombined: opts.combinedGemini,
        worstCellsOnly: opts.worstCellsOnly,
        altCellsOnly: opts.altCellsOnly,
      });
    } else if (opts.splitModesGemini) {
      const batchDir =
        opts.batchDir ??
        opts.resumeDir ??
        join(opts.outRoot, 'modes-agents-300t-2026-08-27T12-07-17-166Z');
      await regenerateModeGeminiPacks({
        batchDir,
        outRoot: opts.outRoot,
        includeCombined: opts.combinedGemini,
      });
    } else if (opts.nightStoryforge) {
      await runNightStoryforge(opts, log, batchStarted, progressLog);
    } else if (opts.matrix40 || opts.matrix) {
      const { combos: balanced, deferred, notes } = buildBalancedMatrix40(opts.seed);
      let combos = opts.matrix40 ? balanced : enumerateLaunchMatrix(opts.seed);
      if (opts.matrixLimit > 0) combos = combos.slice(0, opts.matrixLimit);

      const etaMinLo = Math.round((combos.length * opts.turns * 45) / 60);
      const etaMinHi = Math.round((combos.length * opts.turns * 75) / 60);
      log(
        `Starting ${opts.matrix40 ? 'matrix-40' : 'matrix'} — ${combos.length} runs × ${opts.turns} turns` +
          (opts.dryRun ? ' (DRY RUN)' : '')
      );
      log(`ETA ≈ ${etaMinLo}–${etaMinHi} min (~${(etaMinLo / 60).toFixed(1)}–${(etaMinHi / 60).toFixed(1)} h)`);
      log(`Progress log: ${progressLog}`);
      for (const n of notes) log(`note: ${n}`);
      if (deferred.length) {
        log(`Deferred premades (RPG overflow): ${deferred.map((d) => d.bibleId).join(', ')}`);
      }
      writeFileSync(
        join(opts.outRoot, `matrix-plan-${batchStarted.replace(/[:.]/g, '-')}.json`),
        JSON.stringify({ batchStarted, opts, combos, deferred, notes, progressLog }, null, 2) + '\n'
      );

      const summaries = [];
      for (let i = 0; i < combos.length; i++) {
        const c = combos[i]!;
        log(`[${i + 1}/${combos.length}] ${c.engineMode} ${c.bibleId} ${c.personalityId} seed=${c.seed}`);
        const summary = await runFateAutoplay({
          turns: opts.turns,
          seed: c.seed,
          bibleId: c.bibleId,
          personality: c.personalityId,
          engineMode: c.engineMode,
          aiTier: opts.aiTier,
          mode: opts.mode,
          aiAgentMode: opts.aiAgentMode,
          dryRun: opts.dryRun,
          outRoot: opts.outRoot,
          characterName: opts.characterName,
          writer: opts.writer,
        });
        summaries.push(summary);
        log(
          `  → done turns=${summary.completedTurns} errors=${summary.errorCount} timeouts=${summary.timeoutCount} p50=${summary.latencyMs.p50}ms dir=${summary.outDir}`
        );
        if (summary.errorCount && summary.issueTurns.some((t) => t.failKind === 'auth')) {
          log('AUTH failure — stopping matrix early. Check Supabase / session.');
          break;
        }
      }
      writeFileSync(
        join(opts.outRoot, `matrix-batch-${batchStarted.replace(/[:.]/g, '-')}.json`),
        JSON.stringify({ batchStarted, endedAt: new Date().toISOString(), summaries }, null, 2) + '\n'
      );
      log(`Batch complete — ${summaries.length}/${combos.length} runs`);
    } else {
      log(
        `Single run bible=${opts.bibleId} personality=${opts.personality} turns=${opts.turns} seed=${opts.seed}` +
          (opts.aiAgentMode ? ` ai-agent=${opts.aiAgentMode}` : '') +
          (opts.dryRun ? ' (DRY RUN)' : '')
      );
      const summary = await runFateAutoplay({
        turns: opts.turns,
        seed: opts.seed,
        bibleId: opts.bibleId,
        personality: opts.personality,
        engineMode: opts.engineMode,
        aiTier: opts.aiTier,
        mode: opts.mode,
        aiAgentMode: opts.aiAgentMode,
        dryRun: opts.dryRun,
        outRoot: opts.outRoot,
        characterName: opts.characterName,
        writer: opts.writer,
      });
      log(`Done → ${summary.outDir}`);
      console.log(JSON.stringify(summary, null, 2));
    }
  } finally {
    disableAutoplayTestLab();
  }
}

main().catch((err) => {
  console.error('[fate-autoplay] fatal', err);
  disableAutoplayTestLab();
  process.exit(1);
});
