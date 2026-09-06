/**
 * 02w Lock A confirm: 4 flagship T50 writer-only, then local Gemini paste packs.
 * Does not call OpenRouter Gemini critic.
 */
import { appendFileSync, copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
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

async function main(): Promise<void> {
  loadDotEnv();
  installNodeShims();
  const outRoot = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
  const pasteRoot = join(outRoot, 'gemini-paste-2026-09-02w-t50');
  const statusPath = join(outRoot, 'rrr-4x-t50-02w-status.md');
  mkdirSync(outRoot, { recursive: true });
  mkdirSync(pasteRoot, { recursive: true });

  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    appendFileSync(statusPath, line + '\n');
  };

  writeFileSync(statusPath, '# 02w 4xT50 writer-only (no OpenRouter Gemini critic)\n\n');
  log('start stamp=2026-09-02w seed=42 turns=50 writer=default');

  const dirs: string[] = [];
  try {
    for (let i = 0; i < CELLS.length; i++) {
      const c = CELLS[i]!;
      log(`[${i + 1}/4] ${c.label} ${c.engineMode} ${c.bibleId} ${c.personality}`);
      const summary = await runFateAutoplay({
        turns: 50,
        seed: 42,
        bibleId: c.bibleId,
        personality: c.personality,
        engineMode: c.engineMode,
        writer: 'default',
        outRoot,
        characterName: 'Jax',
      });
      dirs.push(summary.outDir);
      log(
        `  done turns=${summary.completedTurns} errors=${summary.errorCount} timeouts=${summary.timeoutCount} dir=${summary.outDir}`
      );
      if (summary.errorCount && summary.issueTurns.some((t) => t.failKind === 'auth')) {
        log('AUTH failure — stopping early.');
        process.exit(2);
      }
    }

    log('building Gemini paste packs (local files only)');
    const paste = spawnSync(
      process.execPath,
      [
        join(process.cwd(), 'node_modules', 'vite-node', 'vite-node.mjs'),
        '--config',
        'vite.config.ts',
        'scripts/fate-autoplay/writeGeminiPastes.ts',
        '--',
        ...dirs.flatMap((d) => ['--run-dir', d]),
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
      const src = join(dirs[i]!, 'dual-review', 'story-standalone__gemini-pro-PASTE.md');
      const dst = join(pasteRoot, `${CELLS[i]!.label}__story-standalone__gemini-pro-PASTE.md`);
      if (existsSync(src)) {
        copyFileSync(src, dst);
        log(`paste ${CELLS[i]!.label} -> ${dst}`);
      } else {
        log(`WARN missing ${src}`);
      }
    }

    writeFileSync(
      join(pasteRoot, 'README-JOHN.md'),
      [
        '# Paste these into Gemini (one chat per file)',
        '',
        'Story lens only. Do not use OpenRouter. Feed each file to Gemini yourself and send the reply back.',
        '',
        '1. 01-LITRPG__story-standalone__gemini-pro-PASTE.md',
        '2. 02-DND__story-standalone__gemini-pro-PASTE.md',
        '3. 03-RPG__story-standalone__gemini-pro-PASTE.md',
        '4. 04-PYOA__story-standalone__gemini-pro-PASTE.md',
        '',
        'Stamp: 2026-09-02w seed 42, 50 turns, writer default, no Gemini critic API.',
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
  console.error('[02w-4xt50] fatal', err);
  disableAutoplayTestLab();
  process.exit(1);
});
