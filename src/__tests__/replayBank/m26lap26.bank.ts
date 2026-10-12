/**
 * Multi lap 26 — a place title right after a preposition ("The way toward Cathedral Close waits") is that
 * preposition's object, not the place acting; an offered thing fixed to a place ("a seat at the table") is a
 * standing, not loot; the checker reads a move in a "before" clause ("before they reached Cathedral Close") as
 * a move that had not happened.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { factClosedViolationReason } from '../../game/beatCommitGate';
import { compileOpeningOffer, openingOfferRecord } from '../../game/openingEstablishment';
import { isPlaceTitleAsPersonSubject, ledgerPlaceTitles } from '../../game/slotGlue';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const G150 = '2026-10-12T10-32-00-126Z_summoned-pact_cold-system_s150';
const F151 = '2026-10-12T10-32-03-202Z_summoned-pact_cold-system_s151';
const G175 = '2026-10-12T10-31-57-401Z_summoned-pact_cold-system_s175';
const SLOT_GLUE = 'Uses a name or place title as an object or as a person.';

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

let G: Replay;
let F: Replay;
beforeAll(async () => {
  G = new Replay(await replayWhole(G150));
  F = new Replay(await replayWhole(F151));
}, 1_800_000);

describe('replay bank multi lap 26', () => {
  it('[m26 g5-150 T7 | lap 26 place after a preposition] "The way toward Cathedral Close waits" is not the place acting', () => {
    expect(G.input(7)).toBe('Talk your way past the thugs');
    const s = G.before(7);
    const titles = ledgerPlaceTitles(s);
    const original = 'The way toward Cathedral Close waits past bodies and a dropped clothes on the ground.';
    const repaired = 'The way toward Cathedral Close waits past the downed thug and the fine jerkin lying where it fell.';
    for (const line of [original, repaired, 'The door to Cathedral Close waits at the end of the lane.']) {
      expect(isPlaceTitleAsPersonSubject(line, titles), line).toBe(false);
      expect(factClosedViolationReason(s, line), line).not.toBe(SLOT_GLUE);
    }
    expect(isPlaceTitleAsPersonSubject('Cathedral Close watches Jax from the gate.', titles), 'the place acting still fails').toBe(true);
    expect(factClosedViolationReason(s, 'Cathedral Close watches Jax from the gate.')).toBe(SLOT_GLUE);
  });

  it('[m26 fl151 T2 | lap 26 a seat at the table] accepting the treaty offer grants the kit, not a "seat"', () => {
    expect(F.input(2)).toBe('Accept the offer');
    expect(openingOfferRecord(F.before(2))?.items).toEqual(['kit']);
    expect(F.receiptText(2)).toMatch(/Offer accepted: the offer from the Pellane and Ash Court envoys/);
    expect(F.receiptText(2)).toMatch(/Loot granted: \[\w+\] kit/);
    expect(F.receiptText(2)).not.toMatch(/\bseat\b/);
    expect((F.after(2).inventory ?? []).map((i) => i.name)).not.toContain('seat');
    expect(F.packet(2)).not.toMatch(/ENGINE RESULT[^\n]*\bseat\b/);
    const job = compileOpeningOffer('Opening offer: Take the posted job and they will issue a contractor\'s chit and a short blade.');
    expect(job?.items, 'things handed over still count').toEqual(["contractor's chit", 'short blade']);
  });

  it('[m26 g5-175 T2 | lap 26 checker move not yet] "before they reached Cathedral Close" is no move', async () => {
    expect(await factFlags(G175, 2)).toEqual([]);
    const bad = await factFlags(G175, 2, 'Jax left the hall and reached Cathedral Close.');
    expect(bad.map((f) => f.kind), 'a narrated move is still flagged').toContain('move');
  });
});
