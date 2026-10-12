/**
 * Multi lap 21 — "the Undercroft steps" are the place's stairs, not a place stepping; a common-noun token pasted into a
 * hyphen word ("a @t11-old mace" → "a crates-old mace") is no mention of that thing; a handed place description that names
 * its work ("Crowded stalls… junk buyers") hands the people who work there.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import type { LedgerRef } from '../../game/completedEventPacket';
import { classifyTokenLine, normalizeBeatRefs, parseTokenBeat } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string; writerRaw?: string };
type Flag = { kind: string; quote: string; missing: string };
type Repair = { sentence: string; flag: string; bug?: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const D150 = '2026-10-12T05-43-29-080Z_summoned-pact_cold-system_s150';
const F151 = '2026-10-12T05-43-39-286Z_summoned-pact_cold-system_s151';

const repairs = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? []);

function recorded(run: string, turn: number): { row: Row; packet: string; enumRefs: LedgerRef[] } {
  const dir = join(RUNS, run);
  const row = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row).find((r) => r.turn === turn)!;
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  const packet = existsSync(pf) ? readFileSync(pf, 'utf8') : '';
  const enumRefs: LedgerRef[] = [...packet.matchAll(/^(t\d+)\s+(\S+)\s+(\w+)\s+"([^"]+)"$/gm)].map((m) => ({
    tok: m[1]!, id: m[2]!, klass: m[3] as LedgerRef['klass'], display: m[4]!,
  }));
  return { row, packet, enumRefs };
}

async function factFlags(run: string, turn: number, gmText?: string): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  return mod.checkTurn(gmText ? { ...row, gmText } : row, recorded(run, turn).packet, page);
}

let D: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(D150));
}, 1_800_000);

describe('replay bank multi lap 21', () => {
  it('[m21 ds150 T19 | lap 21 place steps] "toward the Undercroft steps" is the place\'s stairs, not the Undercroft acting', () => {
    expect(D.input(19)).toBe('Travel toward Cathedral Undercroft');
    expect(repairs(D, 19).filter((r) => /name or place title/.test(r.flag))).toEqual([]);
    const s = D.before(19);
    expect(sentenceGateProblem(s, 'The lane bent ahead toward the Undercroft steps, and the afternoon light was already going long.')).toBeNull();
    expect(sentenceGateProblem(s, 'Cathedral Close watches Jax go down the lane.'), 'a place acting still fails').toMatch(
      /name or place title/,
    );
  });

  it('[m21 ds150 T18 | lap 21 glued token] "a @t11-old mace" is not painted as "a crates-old mace"', () => {
    expect(D.input(18)).toBe('Open the crate');
    expect(D.prose(18)).not.toMatch(/crates-old/);
    const { row, enumRefs } = recorded(D150, 18);
    const beat = normalizeBeatRefs(parseTokenBeat(row.writerRaw ?? '')!, enumRefs, { thingsOnly: true });
    const glued = beat.lines.find((l) => /@t11-old/.test(l.text))!;
    expect(classifyTokenLine(glued, beat, enumRefs, ['Jax'])).toEqual({ ok: false, reason: 'glued-tok' });
    const place = { fn: 'action' as const, text: 'Jax took the @t3-bound lane past the crates.' };
    const withPlace = { ...beat, refs: [...beat.refs, { tok: 't3', id: 'place:lowmarket', use: 'place' as const }] };
    expect(classifyTokenLine(place, withPlace, enumRefs, ['Jax']), 'a proper name may lead a hyphen word').toEqual({ ok: true });
  });

  it('[m21 fl151 T10 | lap 21 checker] "Crowded stalls… junk buyers" hands the vendors; a stall-less place still flags them', async () => {
    expect((await factFlags(F151, 10)).filter((f) => f.kind === 'person' && /vendors/.test(f.missing))).toEqual([]);
    const wrong = await factFlags(F151, 9, 'Vendors shouted from the side of the lane.');
    expect(wrong.filter((f) => f.kind === 'person' && /vendors/.test(f.missing)).length).toBeGreaterThan(0);
  });
});
