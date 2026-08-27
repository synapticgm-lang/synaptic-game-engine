/**
 * Regenerate 4 mode-specific Gemini critic packs from an existing modes-agents batch.
 * Use when a batch completed before pack export, or to refresh rails/manifest.
 *
 *   npm run fate-autoplay -- --split-modes-gemini --batch-dir scripts/fate-autoplay/runs/modes-agents-300t-...
 *   npm run fate-autoplay -- --split-modes-gemini --batch-dir <path> --combined-gemini
 *
 * Or directly:
 *   npx vite-node --config vite.config.ts scripts/fate-autoplay/splitModesGemini.ts -- --batch-dir <path>
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadBatchTelemetry,
  MODES_AGENTS_BUILD_STAMP,
  writeModeGeminiPacks,
} from './buildModeGeminiPacks';

export async function regenerateModeGeminiPacks(opts: {
  batchDir: string;
  outRoot?: string;
  includeCombined?: boolean;
  buildStamp?: string;
}): Promise<void> {
  const batchDir = opts.batchDir;
  if (!existsSync(batchDir)) {
    throw new Error(`batch dir missing: ${batchDir}`);
  }
  const outRoot = opts.outRoot ?? join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
  const { rows, turns, batchId, grid, baseSeed } = loadBatchTelemetry(batchDir);

  const { modeFiles, indexPath, combinedGemini } = writeModeGeminiPacks({
    batchId,
    batchDir,
    outRoot,
    turns,
    rows,
    grid,
    buildStamp: opts.buildStamp ?? MODES_AGENTS_BUILD_STAMP,
    baseSeed,
    includeCombined: opts.includeCombined === true,
    log: (msg) => console.log(msg),
  });

  console.log('\nRegenerated mode packs:');
  for (const f of modeFiles) {
    console.log(`  [${f.mode}] ${f.feedCopy} (${(f.bytes / 1024 / 1024).toFixed(2)} MB)`);
  }
  console.log(`Index: ${indexPath}`);
  if (combinedGemini) console.log(`Combined (optional): ${combinedGemini}`);
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
          'modes-agents-300t-2026-08-27T12-07-17-166Z'
        );
  const includeCombined = argv.includes('--combined-gemini');
  await regenerateModeGeminiPacks({ batchDir: batchDir!, includeCombined });
}

const invokedDirectly = process.argv.some((a) => /splitModesGemini/i.test(a.replace(/\\/g, '/')));
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
