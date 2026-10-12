/**
 * Multi lap 30 — a housing with the quest list off prints no "Quest:" receipt (stage commits and talk-stage
 * hearings alike); an indefinite pronoun ("Greet whoever is coming") addresses no one in particular, so a road
 * meeting's stranger hears it; the fact checker reads a handed name in another written form ("Earth-born",
 * "Summons' Price" against "Summons’ Price") as handed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { chipAddressee } from '../../game/chipLegality';
import { checkEmptyRoomTalk } from '../../game/turnCheck';
import { formatArcStatusReceipts, type ArcDirectorResult } from '../../game/arcDirector';
import { clampSystemHousing } from '../../game/systemHousing';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');

async function factFlags(run: string, turn: number): Promise<{ prose: string; flags: Flag[] }> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string) => Flag[];
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number; gmText: string });
  const row = rows.find((r) => r.turn === turn)!;
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return { prose: row.gmText, flags: mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '') };
}

const D150 = '2026-10-12T12-09-38-157Z_summoned-pact_cold-system_s150';
const D151 = '2026-10-12T12-09-36-400Z_summoned-pact_cold-system_s151';
const D179 = '2026-10-12T12-09-40-429Z_summoned-pact_cold-system_s179';

let D: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(D150));
}, 1_800_000);

const withQuestList = (s: GameState, on: boolean): GameState => ({
  ...s,
  systemHousing: clampSystemHousing({ housing: 'worn_device', parts: { health: true, level: true, experience: true, quest_list: on } } as never),
});

describe('replay bank multi lap 30', () => {
  it('[m30 ds150 | lap 30 quest list off] a stage commit prints "Quest:" only when the housing has a quest list', () => {
    const state = D.after(2);
    const stage = 'Quest stage: The Summons’ Price: reason heard (stage 2)';
    const arc = (s: GameState) => ({ state: s, systemReceipts: [stage] }) as unknown as ArcDirectorResult;
    expect(formatArcStatusReceipts(arc(withQuestList(state, true)))).toEqual(['Quest: The Summons’ Price: reason heard (stage 2)']);
    expect(formatArcStatusReceipts(arc(withQuestList(state, false)))).toEqual([]);
    const noHousing = { ...state, systemHousing: undefined } as GameState;
    expect(formatArcStatusReceipts(arc(noHousing)), 'no housing hides nothing').toHaveLength(1);
  });

  it('[m30 ds150 T10 | lap 30 whoever addresses no one in particular] the road stranger hears "Greet whoever is coming"', () => {
    expect(D.input(10)).toBe('Travel toward Lowmarket');
    expect(D.after(10).journey?.encounter?.kind, 'replay meets someone on the T10 leg').toBe('meeting');
    expect(D.chipsAfter(10)).toContain('Greet whoever is coming');
    expect(D.prose(10), 'the beat says nobody else is around').toMatch(/no one else around/);
    expect((D.turnCheck(10)?.p0 ?? []).map((f) => f.kind)).not.toContain('ghost-chip');

    expect(chipAddressee('Greet whoever is coming')).toEqual({ kind: 'none', who: '' });
    expect(chipAddressee('Greet the guard')).toEqual({ kind: 'role', who: 'guard' });
    const empty = { ...D.after(10), journey: undefined, sceneFacts: { ...D.after(10).sceneFacts, present: [] } } as GameState;
    expect(checkEmptyRoomTalk(empty, ['Greet whoever is coming'], D.prose(10)).map((f) => f.kind), 'with no stranger it still flags').toEqual(['ghost-chip']);
  });

  it('[m30 ds179 T4,T5 ds151 T21 | lap 30 a handed name in another written form] "Earth-born" and "Summons\' Price" are handed', async () => {
    for (const [run, turn] of [[D179, 4], [D179, 5], [D151, 21]] as const) {
      const { prose, flags } = await factFlags(run, turn);
      expect(prose, `${run.slice(-4)} T${turn}`).toMatch(/Earth-born|Summons' Price/);
      expect(flags.filter((f) => f.kind === 'name'), `${run.slice(-4)} T${turn}`).toEqual([]);
    }
    const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
      checkTurn: (row: unknown, packet: string) => Flag[];
    };
    const packet = 'YOU MAY ONLY MENTION: Jax, Earth\n';
    const flagged = mod.checkTurn({ turn: 2, gmText: 'Jax said the Mars-born never come back.', location: 'Lowmarket' }, packet);
    expect(flagged.map((f) => f.missing).join('\n'), 'an unhanded stem still flags').toMatch(/"Mars"/);
  });
});
