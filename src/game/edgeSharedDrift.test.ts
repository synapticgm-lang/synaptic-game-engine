/**
 * CI gate: edge _shared/gm copies must match the derived gm-turn import closure.
 * Spawns the sync script --check (offline, no network, no AI).
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = join('scripts', 'sync-gm-edge-shared.mjs');

function runCheck() {
  return spawnSync(process.execPath, [SCRIPT, '--check'], {
    encoding: 'utf8',
    cwd: join(__dirname, '..', '..'),
  });
}

describe('edgeSharedDrift', () => {
  it('edge copies match src closure (--check exit 0)', () => {
    const res = runCheck();
    const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
    expect(res.status, out).toBe(0);
    expect(out).toContain('edge copies match');
  });
});
