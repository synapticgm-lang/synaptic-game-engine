/**
 * 08f confirm: 4 flagship T50 08f exhaust+gate+stall (threshold DeepSeek + receipts),
 * two modes at a time, then local Gemini paste packs. No OpenRouter Gemini critic.
 *
 * Retry: keep a finished 50-turn tape even with recovered empty-GM.
 * Full-retry only if the cell did not finish 50 or crashed.
 */
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { disableAutoplayTestLab, runFateAutoplay } from '../../src/game/fateAutoplay';
import { loadDotEnv } from './loadDotEnv';

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

const CELLS = [
  { label: '01-LITRPG', engineMode: 'litrpg' as const, bibleId: 'summoned-pact', personality: 'cold-system' },
  { label: '02-DND', engineMode: 'dnd' as const, bibleId: 'summoned-pact', personality: 'chilled-gm' },
  { label: '03-RPG', engineMode: 'rpg' as const, bibleId: 'summoned-pact', personality: 'chilled-gm' },
  { label: '04-PYOA', engineMode: 'pyoa' as const, bibleId: 'thornferry-road', personality: 'army-brief' },
];

type Cell = (typeof CELLS)[number];

type CellResult = {
  outDir: string;
  completedTurns: number;
  errorCount: number;
  timeoutCount: number;
  authFail: boolean;
  keptTape: boolean;
  needsFullRetry: boolean;
};

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Keep a finished T50 even with recovered empty-GM. Retry only if short or crashed. */
function classifyCell(summary: {
  outDir: string;
  completedTurns: number;
  errorCount: number;
  timeoutCount: number;
  authFail: boolean;
}): CellResult {
  const keptTape = summary.completedTurns >= 50 && Boolean(summary.outDir);
  return {
    ...summary,
    keptTape,
    needsFullRetry: !keptTape && !summary.authFail,
  };
}

async function runCell(c: Cell, outRoot: string, log: (msg: string) => void): Promise<CellResult> {
  const summary = await runFateAutoplay({
    turns: 50,
    seed: 42,
    bibleId: c.bibleId,
    personality: c.personality,
    engineMode: c.engineMode,
    writer: 'default',
    aiTier: 'free',
    outRoot,
    characterName: 'Jax',
  });
  const result = classifyCell({
    outDir: summary.outDir,
    completedTurns: summary.completedTurns,
    errorCount: summary.errorCount,
    timeoutCount: summary.timeoutCount,
    authFail: Boolean(summary.errorCount && summary.issueTurns.some((t) => t.failKind === 'auth')),
  });
  log(
    `  done ${c.label} turns=${result.completedTurns} errors=${result.errorCount} timeouts=${result.timeoutCount} kept=${result.keptTape} dir=${result.outDir}`
  );
  if (result.keptTape && result.errorCount > 0) {
    log(`  KEEP ${c.label} finished T50 with ${result.errorCount} recovered empty/error(s) — no full retry`);
  }
  return result;
}

function spawnCell(c: Cell, resultPath: string): Promise<number> {
  const viteNode = join(process.cwd(), 'node_modules', 'vite-node', 'vite-node.mjs');
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        viteNode,
        '--config',
        'vite.config.ts',
        'scripts/fate-autoplay/run08fFourModeT50.ts',
        '--cell',
        c.label,
        '--result',
        resultPath,
      ],
      { cwd: process.cwd(), stdio: 'inherit' }
    );
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function readResult(path: string): CellResult | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as CellResult;
  } catch {
    return null;
  }
}

async function runCellIsolated(
  c: Cell,
  outRoot: string,
  log: (msg: string) => void
): Promise<CellResult> {
  const resultPath = join(outRoot, `_08f-${c.label}-result.json`);
  log(`  spawn ${c.label}`);
  const code = await spawnCell(c, resultPath);
  const result = readResult(resultPath);
  if (!result) {
    throw new Error(`${c.label} child exit=${code} and no result file`);
  }
  if (result.authFail) return result;
  if (result.keptTape) {
    return result;
  }
  if (result.needsFullRetry || code !== 0) {
    log(`  retry ${c.label} once (turns=${result.completedTurns} errors=${result.errorCount} exit=${code})`);
    const retryCode = await spawnCell(c, resultPath);
    const retry = readResult(resultPath);
    if (!retry) {
      throw new Error(`${c.label} retry exit=${retryCode} and no result file`);
    }
    return retry;
  }
  return result;
}

function firstL2Turn(outDir: string): number | null {
  const turnsPath = join(outDir, 'turns.jsonl');
  if (!existsSync(turnsPath)) return null;
  for (const line of readFileSync(turnsPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { turn?: number; level?: number };
      if ((row.level ?? 1) >= 2) return Number(row.turn ?? 0) || null;
    } catch {
      /* skip */
    }
  }
  return null;
}

function countMudVsNovel(outDir: string): { total: number; mud: number; flavor: number; emptyFlavor: number } {
  const turnsPath = join(outDir, 'turns.jsonl');
  let total = 0;
  let mud = 0;
  let flavor = 0;
  let emptyFlavor = 0;
  if (!existsSync(turnsPath)) return { total: 0, mud: 0, flavor: 0, emptyFlavor: 0 };
  for (const line of readFileSync(turnsPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as {
        presentation?: string;
        flavorQuote?: string;
        gmText?: string;
        systemLog?: string[];
      };
      total += 1;
      if (row.presentation === 'mud-receipt' || (row.systemLog ?? []).some((s) => /^HERE:/i.test(s))) {
        mud += 1;
        if (String(row.flavorQuote ?? row.gmText ?? '').trim()) flavor += 1;
        else emptyFlavor += 1;
      }
    } catch {
      /* skip */
    }
  }
  return { total, mud, flavor, emptyFlavor };
}

function score08fGates(outDir: string): {
  corpseTalkPads: number;
  hereMoves: number;
  travelPicks: number;
  travelNoMove: number;
  acceptEndingRepeats: number;
  flavorQuotes: number;
  inventInRendered: number;
  rejectRatePct: number;
  zeroDeltaLoops4: number;
} {
  const turnsPath = join(outDir, 'turns.jsonl');
  const summaryPath = join(outDir, 'summary.json');
  let corpseTalkPads = 0;
  let hereMoves = 0;
  let travelPicks = 0;
  let travelNoMove = 0;
  let acceptEndingRepeats = 0;
  let flavorQuotes = 0;
  let inventInRendered = 0;
  let rejectRatePct = 0;
  let zeroDeltaLoops4 = 0;
  let prevHere = '';
  let clearSeen = false;
  let streak = 0;
  let prevSig = '';
  if (existsSync(summaryPath)) {
    try {
      const s = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
        flavorMetrics?: { rejectRate?: number };
      };
      if (s.flavorMetrics?.rejectRate != null) {
        rejectRatePct = Math.round(s.flavorMetrics.rejectRate * 100);
      }
    } catch {
      /* skip */
    }
  }
  if (!existsSync(turnsPath)) {
    return {
      corpseTalkPads,
      hereMoves,
      travelPicks,
      travelNoMove,
      acceptEndingRepeats,
      flavorQuotes,
      inventInRendered,
      rejectRatePct,
      zeroDeltaLoops4,
    };
  }
  for (const line of readFileSync(turnsPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as {
        playerInput?: string;
        location?: string;
        currentLocation?: string;
        flavorQuote?: string;
        gmText?: string;
        systemLog?: string[];
        offeredChoices?: string[];
        xpGained?: number;
      };
      const logs = (row.systemLog ?? []).join('\n');
      const hereFromReceipt = logs.match(/^HERE:\s*(.+)$/im)?.[1]?.trim() ?? '';
      const here = String(row.location ?? row.currentLocation ?? hereFromReceipt).trim();
      if (/^CLEAR:/im.test(logs) || /\bOUTCOME:\s*killed\b/i.test(logs)) clearSeen = true;
      if (clearSeen) {
        for (const pad of row.offeredChoices ?? []) {
          if (/\b(talk|ask|offer|speak|listen|press)\b/i.test(pad) && /skirmisher|lastkill|corpse|hunter/i.test(pad)) {
            corpseTalkPads += 1;
          }
        }
      }
      const input = String(row.playerInput ?? '');
      const isTravel =
        /^(?:travel\s+(?:toward|to)|return\s+to|leave(?:\s+the\s+scene)?|walk\s+away)\b/i.test(input.trim());
      if (isTravel) {
        travelPicks += 1;
        if (prevHere && here && prevHere.toLowerCase() !== here.toLowerCase()) {
          hereMoves += 1;
        } else if (prevHere && here && prevHere.toLowerCase() === here.toLowerCase()) {
          travelNoMove += 1;
        }
      } else if (prevHere && here && prevHere.toLowerCase() !== here.toLowerCase()) {
        hereMoves += 1;
      }
      if (/\baccept the ending\b/i.test(input)) acceptEndingRepeats += 1;
      const fq = String(row.flavorQuote ?? '').trim();
      if (fq) {
        flavorQuotes += 1;
        // Invent leak in *rendered* quote: PC name or obvious novel Title-Case person
        if (/\bJax\b/i.test(fq) || /\b(Lord|Lady|Sir)\s+[A-Z][a-z]+/.test(fq)) {
          inventInRendered += 1;
        }
      }
      const combatish = /\bENCOUNTER:\s*live\b|\bDMG:|\bCLEAR:/i.test(logs);
      const xp = Number(row.xpGained ?? 0) > 0;
      const sig = `${here.toLowerCase()}|${combatish}|${xp}`;
      if (sig === prevSig && !isTravel && !combatish && !xp) {
        streak += 1;
        // Count each ≥4 zero-delta loop once (when it first hits 4), not every later turn.
        if (streak === 4) zeroDeltaLoops4 += 1;
      } else {
        streak = 1;
      }
      prevSig = sig;
      if (here) prevHere = here;
    } catch {
      /* skip */
    }
  }
  return {
    corpseTalkPads,
    hereMoves,
    travelPicks,
    travelNoMove,
    acceptEndingRepeats,
    flavorQuotes,
    inventInRendered,
    rejectRatePct,
    zeroDeltaLoops4,
  };
}

function writeSystemsSummary(cells: Cell[], dirs: string[], pasteRoot: string, log: (msg: string) => void): void {
  const lines = [
    '# 08f 4×T50 08f exhaust+gate+stall systems summary',
    '',
    'Stamp `2026-09-08f`. 08f exhaust+gate+stall ON (DeepSeek only on lethal / level-up / new HERE / first Talk). Seed 42. No Gemini critic API.',
    '',
    'Pass gates: 0 corpse-talk pads after CLEAR · HERE moves on travel picks · L2 by ~T25 (LitRPG/D&D/RPG) · report flavor invent rate (accepted quotes / mud turns) · document PYOA Accept-ending repeats.',
    '',
  ];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    const dir = dirs[i] ?? '';
    if (!dir || !existsSync(join(dir, 'summary.json'))) {
      lines.push(`## ${cell.label}`, '', `NO TAPE (${dir || 'missing dir'})`, '');
      continue;
    }
    const summary = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) as {
      completedTurns?: number;
      errorCount?: number;
      timeoutCount?: number;
      receiptTotals?: { combat?: number };
      issueTurns?: Array<{ turn?: number; failKind?: string; error?: string }>;
      evalHarness?: { livenessGates?: { combatByT8?: boolean } };
    };
    const l2 = firstL2Turn(dir);
    const emptyKinds = (summary.issueTurns ?? []).filter((t) =>
      /empty|no content|blank/i.test(`${t.failKind ?? ''} ${t.error ?? ''}`)
    );
    const combat = summary.receiptTotals?.combat ?? 0;
    const mud = countMudVsNovel(dir);
    const gates = score08fGates(dir);
    const mudPct = mud.total ? Math.round((mud.mud / mud.total) * 100) : 0;
    const inventRatePct = mud.mud ? Math.round((gates.flavorQuotes / mud.mud) * 100) : 0;
    const inventLeakPct = gates.flavorQuotes
      ? Math.round((gates.inventInRendered / gates.flavorQuotes) * 100)
      : 0;
    const l2Ok = cell.engineMode === 'pyoa' ? true : l2 != null && l2 <= 25;
    const corpseOk = gates.corpseTalkPads === 0;
    const spatialOk = gates.travelPicks === 0 || gates.hereMoves > 0;
    const systemsOk =
      corpseOk
      && (cell.engineMode === 'pyoa' || (spatialOk && l2Ok))
      && gates.zeroDeltaLoops4 === 0
      && gates.inventInRendered === 0;
    const fallbackTrigger = gates.rejectRatePct >= 50 || gates.inventInRendered > 0;
    const pass = systemsOk;
    const l2Note = l2 == null ? 'no L2' : l2 <= 25 ? `L2 at T${l2} (by T25)` : `L2 at T${l2} (after T25)`;
    const oneLiner = `${cell.label}: ${pass ? 'PASS' : 'FAIL'} · ${summary.completedTurns ?? 0}/50 · empties=${emptyKinds.length} · combat=${combat} · mud ${mud.mud}/${mud.total} flavor=${gates.flavorQuotes} inventRate=${inventRatePct}% inventLeak=${inventLeakPct}% reject=${gates.rejectRatePct}% zeroDelta4=${gates.zeroDeltaLoops4} · corpseTalkPads=${gates.corpseTalkPads} · travelPicks=${gates.travelPicks} travelNoMove=${gates.travelNoMove} hereMoves=${gates.hereMoves} · acceptEnding=${gates.acceptEndingRepeats} · ${l2Note}${fallbackTrigger ? ' · FALLBACK_TRIGGER' : ''}`;
    log(oneLiner);
    lines.push(
      `## ${cell.label}`,
      '',
      `- **gate: ${pass ? 'PASS' : 'FAIL'}**${fallbackTrigger ? ' · **FALLBACK TRIGGER** (reject≥50% or invent leak)' : ''}`,
      `- run: \`${dir}\``,
      `- turns: ${summary.completedTurns ?? 0}/50`,
      `- errors: ${summary.errorCount ?? 0}`,
      `- timeouts: ${summary.timeoutCount ?? 0}`,
      `- empty GM (issueTurns empty/blank): ${emptyKinds.length}`,
      `- combat receipts: ${combat} (aspirational ≥3)`,
      `- mud-receipt turns: ${mud.mud}/${mud.total} (${mudPct}%) · accepted flavor quotes ${gates.flavorQuotes} · invent rate ${inventRatePct}% (quotes/mud)`,
      `- reject rate: ${gates.rejectRatePct}% · invent in rendered quotes: ${gates.inventInRendered} (${inventLeakPct}%) · zero-delta loops≥4: ${gates.zeroDeltaLoops4}`,
      `- corpse-talk pads after CLEAR: ${gates.corpseTalkPads} (want 0)`,
      `- travel picks: ${gates.travelPicks} · travel no-move: ${gates.travelNoMove} · HERE moves: ${gates.hereMoves}`,
      `- PYOA Accept-ending picks: ${gates.acceptEndingRepeats}`,
      `- L2: ${l2 == null ? 'none' : `T${l2}`}${l2 != null && l2 <= 25 ? ' (by T25)' : l2 != null ? ' (after T25)' : ''}`,
      `- combatByT8: ${summary.evalHarness?.livenessGates?.combatByT8 ?? 'n/a'}`,
      ''
    );
  }
  writeFileSync(join(pasteRoot, 'SYSTEMS-SUMMARY.md'), lines.join('\n'), 'utf8');
}

async function runChildCell(): Promise<void> {
  loadDotEnv();
  installNodeShims();
  const label = argValue('--cell');
  const resultPath = argValue('--result');
  const cell = CELLS.find((c) => c.label === label);
  if (!cell || !resultPath) {
    process.exit(2);
  }
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
  const statusPath = join(outRoot, 'rrr-4x-t50-08f-status.md');
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    appendFileSync(statusPath, line + '\n');
  };
  try {
    const result = await runCell(cell, outRoot, log);
    mkdirSync(dirname(resultPath), { recursive: true });
    writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8');
    process.exit(result.keptTape && !result.authFail ? 0 : 1);
  } finally {
    disableAutoplayTestLab();
  }
}

async function main(): Promise<void> {
  if (argValue('--cell')) {
    await runChildCell();
    return;
  }

  loadDotEnv();
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
  const pasteRoot = join(outRoot, 'gemini-paste-2026-09-08f-t50');
  const statusPath = join(outRoot, 'rrr-4x-t50-08f-status.md');
  mkdirSync(outRoot, { recursive: true });
  mkdirSync(pasteRoot, { recursive: true });

  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    appendFileSync(statusPath, line + '\n');
  };

  writeFileSync(statusPath, '# 08f 4xT50 08f exhaust+gate+stall (threshold DeepSeek + receipts)\n\n');
  log('start stamp=2026-09-08f seed=42 turns=50 08f exhaust+gate+stall ON waves=LitRPG+D&D then RPG+PYOA');
  log('retry=keep finished T50 even with recovered empty-GM; full-retry only if <50 or crash');

  const dirs: string[] = [];
  try {
    const waves: Cell[][] = [CELLS.slice(0, 2), CELLS.slice(2, 4)];
    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w]!;
      log(`wave ${w + 1}/2 ${wave.map((c) => c.label).join(' + ')}`);
      const results = await Promise.all(
        wave.map(async (c) => {
          try {
            return await runCellIsolated(c, outRoot, log);
          } catch (err) {
            log(`  FAIL ${c.label}: ${err instanceof Error ? err.message : String(err)}`);
            return {
              outDir: '',
              completedTurns: 0,
              errorCount: 1,
              timeoutCount: 0,
              authFail: false,
              keptTape: false,
              needsFullRetry: true,
            } satisfies CellResult;
          }
        })
      );
      if (results.some((r) => r.authFail)) {
        log('AUTH failure — stopping early.');
        process.exit(2);
      }
      for (const r of results) dirs.push(r.outDir);
      log(`wave ${w + 1}/2 kept ${results.filter((r) => r.keptTape).length}/${results.length} — starting next as soon as both have a tape`);
    }

    const pasteDirs = dirs.filter(Boolean);
    if (!pasteDirs.length) {
      log('FAIL no completed run dirs — skip paste packs');
      process.exit(1);
    }

    log('building Gemini paste packs (local files only; story + game/options)');
    const paste = spawnSync(
      process.execPath,
      [
        join(process.cwd(), 'node_modules', 'vite-node', 'vite-node.mjs'),
        '--config',
        'vite.config.ts',
        'scripts/fate-autoplay/writeGeminiPastes.ts',
        '--',
        ...pasteDirs.flatMap((d) => ['--run-dir', d]),
        '--out',
        pasteRoot,
      ],
      { cwd: process.cwd(), stdio: 'inherit' }
    );
    if (paste.status !== 0) {
      log(`FAIL paste packs exit=${paste.status ?? 'null'}`);
      process.exit(paste.status ?? 1);
    }

    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i]!;
      if (!dir) {
        log(`WARN skip paste copy for ${CELLS[i]!.label} (no run dir)`);
        continue;
      }
      const storySrc = join(dir, 'dual-review', 'story-standalone__gemini-pro-PASTE.md');
      const gameSrc = join(dir, 'dual-review', 'game-vibe-pace__gemini-pro-PASTE.md');
      const storyDst = join(pasteRoot, `${CELLS[i]!.label}__story-standalone__gemini-pro-PASTE.md`);
      const gameDst = join(pasteRoot, `${CELLS[i]!.label}__game-vibe-pace__gemini-pro-PASTE.md`);
      if (existsSync(storySrc)) {
        copyFileSync(storySrc, storyDst);
        log(`paste ${CELLS[i]!.label} story -> ${storyDst}`);
      } else {
        log(`WARN missing ${storySrc}`);
      }
      if (existsSync(gameSrc)) {
        copyFileSync(gameSrc, gameDst);
        log(`paste ${CELLS[i]!.label} game/options -> ${gameDst}`);
      } else {
        log(`WARN missing ${gameSrc}`);
      }
    }

    writeSystemsSummary(CELLS, dirs, pasteRoot, log);

    writeFileSync(
      join(pasteRoot, 'README-JOHN.md'),
      [
        '# Paste these into Gemini (one chat per file)',
        '',
        'Story lens first. Game packs include every offered option. Do not use OpenRouter. Feed each file to Gemini yourself and send the reply back.',
        '',
        'Story:',
        '1. 01-LITRPG__story-standalone__gemini-pro-PASTE.md',
        '2. 02-DND__story-standalone__gemini-pro-PASTE.md',
        '3. 03-RPG__story-standalone__gemini-pro-PASTE.md',
        '4. 04-PYOA__story-standalone__gemini-pro-PASTE.md',
        '',
        'Game (full transcript + offered options):',
        '1. 01-LITRPG__game-vibe-pace__gemini-pro-PASTE.md',
        '2. 02-DND__game-vibe-pace__gemini-pro-PASTE.md',
        '3. 03-RPG__game-vibe-pace__gemini-pro-PASTE.md',
        '4. 04-PYOA__game-vibe-pace__gemini-pro-PASTE.md',
        '',
        'Stamp: 2026-09-08f seed 42, 50 turns, 08f exhaust+gate+stall (threshold DeepSeek), Option 2 MUD rubric — see SCORE-08f-OPTION2-RUBRIC.md. No Gemini critic API.',
        '',
      ].join('\n'),
      'utf8'
    );
    log(`ALL DONE pastes=${pasteRoot}`);
  } finally {
    disableAutoplayTestLab();
  }
}

main().catch((err) => {
  console.error('[08f-4xt50] fatal', err);
  disableAutoplayTestLab();
  process.exit(1);
});
