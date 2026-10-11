import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, npc, present } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-06T20-00-22-470Z_summoned-pact_cold-system_s73';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const saidBy = (n: number, name: string) => (npc(R.after(n), name)?.said ?? []).map((s) => s.line);

describe('replay bank s73', () => {
  it('[s73 T12 | s73 Root H] Osric\'s speech is not filed under Maud Pike', () => {
    const maudBefore = (npc(R.before(12), 'Maud Pike')?.said ?? []).length;
    expect(saidBy(12, 'Maud Pike').length).toBe(maudBefore);
    for (const line of [...saidBy(12, 'Maud Pike'), ...saidBy(12, 'Osric Coyne')]) {
      expect(line).not.toMatch(/wiped his hands|\\/);
    }
  });

  it('[s73 T12 | s73 Root H] harvest adds neither a bare first name nor the player to present', () => {
    const here = present(R.after(12));
    expect(here).not.toContain('Jax');
    if (here.includes('Osric Coyne')) expect(here).not.toContain('Osric');
  });

  it('[s73 T2 | s73 Root I] a first sighting is not counted as a prior meeting', () => {
    const t = R.turns().find((n) => /Yara Quill/.test(R.packet(n)));
    expect(t, 'replay hands Yara Quill to the writer').toBeTruthy();
    expect(R.packet(t!)).not.toMatch(/Yara Quill has met Jax before/);
  });

  it('[s73 T2 | s73 Root I] NPCs who were never told the name do not know it', () => {
    expect(R.input(2)).not.toMatch(/\bJax\b/);
    expect(npc(R.after(2), 'Yara Quill')?.knownPlayerName).toBeFalsy();
    expect(R.packet(3)).not.toMatch(/knows them as Jax/);
  });

  it('[s73 T12 | s73 Root J] a speech line ships with one quote pair, tag outside, no backslash', () => {
    expect(R.prose(12)).not.toMatch(/\\/);
    expect(R.prose(12)).not.toMatch(/"(?:Osric|Osric Coyne) said,/);
  });

  it('[s73 T17 | s73 Root K] Check Status lines are not dropped as invented capitals', () => {
    expect(R.input(17)).toBe('Check Status');
    expect(R.verdicts(17).filter((v) => /react:capital/.test(v))).toEqual([]);
  });

  it('[s73 T17 | s73 Root K] Check Status attaches the System window', () => {
    const gm = R.lastGm(17) as { systemWindow?: unknown } | undefined;
    expect(gm?.systemWindow, 'System window on the Check Status beat').toBeTruthy();
    expect(JSON.stringify(gm?.systemWindow)).toMatch(/Level/);
  });
});
