/**
 * Multi lap 54 — the arrival that ends a road trip tells the writer Jax set out earlier, so the writer does not step
 * Jax straight out of the trip's origin (fl150 T11); the checker reads "a man called Col Thatch" as naming a handed
 * person (fl150 T11) and "the fallen beasts" as the handed animal foe (fl203 T20).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isRoadLabel } from '../../game/travelJourney';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL150 = '2026-10-13T07-04-02-860Z_summoned-pact_cold-system_s150';
const FL203 = '2026-10-13T07-04-27-260Z_summoned-pact_cold-system_s203';

async function factFlags(run: string, turn: number, gmText?: string): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(gmText ? { ...row, gmText } : row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
}

let F: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FL150));
}, 600_000);

const WALK = /Jax set out from (.+?) earlier and has been on the way since/;

describe('replay bank m54 (lap 54)', () => {
  it('[fl150 T11 | m54 fix 3] the arrival that ends a road trip says Jax set out earlier, not a step out of the origin', () => {
    expect(F.input(11)).toBe('Walk on');
    expect(isRoadLabel(F.before(11).currentLocation ?? ''), 'replay is on the road before T11').toBe(true);
    expect(F.after(11).currentLocation).toBe('Cathedral Close');
    const packet = F.packet(11);
    expect(packet).toMatch(/Moved this turn: from .+ to Cathedral Close/);
    expect(packet.match(WALK)?.[1]).toMatch(/grain-ship/);
    expect(packet).toMatch(/never a step straight out of/);
  });

  it('[fl150 | m54 fix 3] only an arrival off the road carries the walk line', () => {
    let arrivals = 0;
    for (const n of F.turns()) {
      const moved = F.after(n).currentLocation !== F.before(n).currentLocation;
      if (!moved || isRoadLabel(F.after(n).currentLocation ?? '')) continue;
      arrivals += 1;
      const offRoad = isRoadLabel(F.before(n).currentLocation ?? '');
      expect(WALK.test(F.packet(n)), `T${n} off road ${offRoad}`).toBe(offRoad);
    }
    expect(arrivals, 'replay has at least one arrival').toBeGreaterThan(0);
  });

  it('[fl150 T11 | m54 fix 1 checker] "a man called Col Thatch" names a handed person', async () => {
    expect((await factFlags(FL150, 11)).filter((f) => f.kind === 'person')).toEqual([]);
    const stranger = await factFlags(FL150, 11, 'A man called Bram Holt stood by the gate and watched Jax.');
    expect(stranger.map((f) => f.kind).join(' '), 'an unhanded name still flags').toMatch(/person|name/);
    const shout = await factFlags(FL150, 11, 'A man called out to Jax from across the courtyard stones.');
    expect(shout.map((f) => f.kind), 'a man who calls out is still a new person').toContain('person');
  });

  it('[fl203 T20 | m54 fix 2 checker] "the fallen beasts" after a handed dog pack is that foe', async () => {
    expect((await factFlags(FL203, 20)).filter((f) => f.kind === 'foe')).toEqual([]);
    const wrong = await factFlags(FL203, 18, 'A beast stood in the dark at the foot of the stair and watched Jax.');
    expect(wrong.map((f) => f.kind), 'a beast with no animal foe handed still flags').toContain('foe');
  });
});
