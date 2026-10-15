/** q31 P-1 — run pacing (same place / XP stall) is a run-level circling note, never a turn's down flag. */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
// @ts-expect-error — plain .mjs script module, no declaration file
import { flagKind, isWriterFlag } from '../../scripts/fate-autoplay/judgeNotes.mjs';

describe('q31 P-1 run pacing', () => {
  it('15 turns without XP mark no turn down and put the stall in circling', () => {
    const dir = mkdtempSync(join(tmpdir(), 'q31p1-'));
    const rows = Array.from({ length: 16 }, (_, i) => ({
      turn: i + 1,
      playerInput: 'Wait',
      gmText: `Beat ${i + 1}.`,
      location: 'Lowmarket',
      progress: i === 0,
    }));
    writeFileSync(join(dir, 'turns.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
    const res = spawnSync(process.execPath, [join('scripts', 'fate-autoplay', 'autoThumbs.mjs'), dir], { encoding: 'utf8' });
    expect(res.status).toBe(0);
    const thumbs = JSON.parse(readFileSync(join(dir, 'thumbs.json'), 'utf8'));
    expect(thumbs.turns.filter((t: { verdict: string }) => t.verdict === 'down')).toEqual([]);
    const flags = thumbs.circling.pacing.map((p: { turn: number; flag: string }) => `T${p.turn} ${p.flag}`);
    expect(flags).toContain('T16 XP stall 15 turns');
    expect(flags).toContain('T5 same place 5 turns, no progress');
    expect(readFileSync(join(dir, 'report.md'), 'utf8')).toMatch(/Pacing: .*T16 XP stall 15 turns/);
  });

  it('distill reads only writer kinds as a local down', () => {
    expect(isWriterFlag('XP stall 15 turns')).toBe(false);
    expect(isWriterFlag('same place 10 turns, no progress')).toBe(false);
    expect(isWriterFlag('P0 bad-floor-plan: Cellar: stair with no floor')).toBe(false);
    expect(isWriterFlag('unrelated-chip: "Hail the rider" meets someone')).toBe(false);
    expect(isWriterFlag('repeated-habit: "the lamp hissed" comes back')).toBe(true);
    expect(isWriterFlag('P0 stiff-line (judge, abstract): "x"')).toBe(true);
    expect(isWriterFlag('P0 ignored-action (judge): nobody answers')).toBe(true);
    expect(isWriterFlag('judge: repeats the smell')).toBe(true);
    expect(isWriterFlag('fallback / stitch')).toBe(true);
    expect(isWriterFlag('repeated line: "the gate stood open"')).toBe(true);
    expect(flagKind('junk: unrendered token or placeholder')).toBe('junk');
    expect(flagKind('prose: contradicts a defeat')).toBe('prose');
  });
});
