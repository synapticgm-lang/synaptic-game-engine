/**
 * q31-P3 — fact-checker person/name reads on distill-1 turns: the recorded prose against the packet the writer was handed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs/distill-1');

async function factFlags(run: string, turn: number): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string) => Flag[];
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number });
  const row = rows.find((r) => r.turn === turn)!;
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '');
}

const SALT = '2026-10-15T09-29-02-001Z_salt-road-heist_chilled-gm_s5003';
const GATE = '2026-10-15T09-33-18-609Z_gatebreak-ward_chilled-gm_s5106';
const PACT = '2026-10-15T10-34-03-781Z_summoned-pact_cold-system_s5144';
const kinds = (flags: Flag[], kind: string) => flags.filter((f) => f.kind === kind).map((f) => f.missing);

describe('replay bank q31-P3 fact checker people and names', () => {
  it('[q31-P3 s5003 T12] "every stranger who passed" brings nobody new onto the scene', async () => {
    expect(kinds(await factFlags(SALT, 12), 'person')).toEqual([]);
  });

  it('[q31-P3 s5106 T5] "a man in a stained apron, Piers Dunmore," names the handed person in apposition', async () => {
    expect(kinds(await factFlags(GATE, 5), 'person')).toEqual([]);
  });

  it('[q31-P3 s5106 T12] the road meeting\'s handed label ("a hurt traveler") is someone here', async () => {
    expect(kinds(await factFlags(GATE, 12), 'person')).toEqual([]);
  });

  it('[q31-P3 s5144 T15] a quoted sign names the handed place, not its closing quote mark', async () => {
    expect(kinds(await factFlags(PACT, 15), 'name')).toEqual([]);
  });

  it('[q31-P3 s5003 T9 | open] an unhanded "sailor" still flags', async () => {
    expect(kinds(await factFlags(SALT, 9), 'person').some((m) => m.includes('"sailor"'))).toBe(true);
  });
});
