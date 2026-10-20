/**
 * q76c-WIRE-AUDIT — call checkTurnInvariants from plain Node (ai-player run.mjs).
 * Spawns vite-node once per check (no OpenRouter). vite-node is MIT (devDependency).
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ROOT } from './loadEnv.mjs';

/**
 * @param {object|null} before
 * @param {object|null} after
 * @param {{ offeredOptions: unknown[]; playerInput: string; typed: boolean; prose: string; answered?: boolean; visibleAnswer?: string; speakers?: string[] }} turn
 * @returns {Array<{ code: string; severity: string; detail: string }>}
 */
export function checkTurnInvariantsSync(before, after, turn) {
  if (!before || !after) return [];
  const f = join(tmpdir(), `q76c-inv-${process.pid}-${Date.now()}.json`);
  writeFileSync(f, JSON.stringify({ before, after, turn }));
  try {
    const r = spawnSync(
      process.execPath,
      [
        join(ROOT, 'node_modules/vite-node/vite-node.mjs'),
        '--config',
        join(ROOT, 'vite.config.ts'),
        join(ROOT, 'scripts/ai-player-browser/invariantsCli.ts'),
        f,
      ],
      { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
    );
    if (r.status !== 0) {
      const err = String(r.stderr || r.stdout || '').slice(0, 240);
      console.warn(`[ai-player] invariantsCli exit ${r.status}: ${err}`);
      return [];
    }
    const line = String(r.stdout || '').trim();
    if (!line) return [];
    const parsed = JSON.parse(line);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`[ai-player] invariantsCli failed: ${String(e?.message || e).slice(0, 160)}`);
    return [];
  } finally {
    try { unlinkSync(f); } catch { /* ignore */ }
  }
}
