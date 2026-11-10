/**
 * Path lint for the six offline PYOA books.
 * Fails when a new structural issue appears (skippable dice spine, ungated
 * failure ending, unread or misnamed flag, unreachable section, dead end).
 * Known issues are the baseline; prose gaps live in content/pyoa/PROSE-TODO.json.
 */
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('pyoa path lint', () => {
  it('matches the structural baseline and the prose TODO', () => {
    const out = execFileSync('python3', ['scripts/pyoa/pyoa-path-lint.py', '--check'], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(out).toContain('OK hard=');
    expect(out).toContain('OK todo=');
  }, 60_000);
});
