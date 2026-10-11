import { beforeAll, describe, expect, it, vi } from 'vitest';
import { canonicalizeOption } from '../../game/optionDiversityContract';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-11T00-12-42-020Z_summoned-pact_cold-system_s81';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

type Cooldown = { lastOfferedTurn: number; offerCount: number };
const cooldowns = (n: number, side: 'before' | 'after'): Record<string, Cooldown> =>
  ((R[side](n) as unknown as { qualityGovernance?: { optionCooldowns?: Record<string, Cooldown> } }).qualityGovernance
    ?.optionCooldowns ?? {}) as Record<string, Cooldown>;
const invNames = (n: number) => (R.after(n).inventory ?? []).map((i) => i.name.toLowerCase());

describe('replay bank s81', () => {
  it('[s81 T21 | s81 Root A] cooldowns are written only for the chips actually offered, so a new pad does not cool itself', () => {
    expect(R.after(21).currentLocation, 'replay arrives at Lowmarket on T21').toBe('Lowmarket');
    expect(R.after(21).sceneFacts?.present ?? []).toEqual(expect.arrayContaining(['Osric Coyne', 'Maud Pike']));
    expect(R.chipsAfter(21)).toEqual(expect.arrayContaining(['Talk to Osric Coyne', 'Talk to Maud Pike']));
    for (const n of R.turns()) {
      const b = cooldowns(n, 'before');
      const offered = new Set(R.chipsAfter(n).map(canonicalizeOption));
      const written = Object.entries(cooldowns(n, 'after'))
        .filter(([k, v]) => !b[k] || b[k].offerCount !== v.offerCount || b[k].lastOfferedTurn !== v.lastOfferedTurn)
        .map(([k]) => k);
      expect(written.filter((k) => !offered.has(k)), `T${n} cooldown keys written for chips never offered (offered: ${R.chipsAfter(n).join(' / ')})`).toEqual([]);
    }
  });

  it('[s81 T5-T7 | s81 Root A] on arrival at Cathedral Close a named person here gets a talk chip', () => {
    expect(R.after(5).currentLocation, 'replay arrives at Cathedral Close on T5').toBe('Cathedral Close');
    const here = (R.after(5).sceneFacts?.present ?? []).filter((p) => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(p));
    expect(here, 'Nell Rudd and Col Thatch are here').toEqual(expect.arrayContaining(['Nell Rudd', 'Col Thatch']));
    expect(R.chipsAfter(5).some((c) => /^(Talk to|Ask) /.test(c) && here.some((p) => c.includes(p))), R.chipsAfter(5).join(' / ')).toBe(true);
  });

  it('[s81 T11,T12 | s81 Root B] a lost road fight closes the meeting: no live meeting receipt and no chip aimed at it', () => {
    const lost = R.turns().filter((n) => R.before(n).journey && /^Fight: DEFEAT/m.test(R.receiptText(n)));
    expect(lost.length, 'replay loses a road fight (recorded T11 DEFEAT; on main the T11 fight is a VICTORY in 2 rounds)').toBeGreaterThan(0);
    for (const n of lost) {
      const kind = R.before(n).journey?.encounter?.kind ?? '';
      for (const t of [n, n + 1].filter((x) => R.turns().includes(x))) {
        expect(R.receiptText(t), `T${t}`).not.toMatch(/chance meeting: .*working this stretch/);
      }
      expect(R.chipsAfter(n).filter((c) => kind && c.includes(kind)), `after T${n}`).toEqual([]);
    }
  });

  it('[s81 T14,T17 | s81 failure 3 (s80 Root G)] chest and search turns commit their find before the writer, and a find is granted', () => {
    expect(R.input(14)).toBe('Check the chest');
    expect(R.input(17)).toBe('Search the area');
    for (const n of [14, 17]) {
      expect(R.receiptText(n), `T${n} engine result`).toMatch(/^Search: /m);
      const found = R.receiptText(n).match(/^Search: .*found (?!nothing)([^.\n]+)\./m)?.[1];
      if (found) expect(invNames(n), `T${n} found ${found}`).toContain(found.toLowerCase());
    }
  });

  it('[s81 T4,T5 | s81 failure 4] no "Return to" chip for a place never visited', () => {
    expect(R.visitedBefore(5).has('Cathedral Close'), 'Cathedral Close is first reached on T5').toBe(false);
    for (const n of R.turns()) {
      const visited = R.visitedBefore(n);
      for (const c of R.chips(n)) {
        const m = c.match(/^(?:Return to|Go back to) (.+)$/);
        if (m) expect(visited.has(m[1]), `T${n} chip "${c}"`).toBe(true);
      }
    }
  });

  it('[s81 T4,T18,T20 | s81 failure 5] the painted clothes (or a person) are never worn on the wrist, as a hood or "on the body" in the device\'s place', () => {
    expect(R.after(4).journey?.to, 'replay sets out for Cathedral Close on T4').toBe('Cathedral Close');
    expect(R.prose(4)).not.toMatch(/clothes stayed on their wrist/i);
    expect(R.prose(18)).not.toMatch(/\b(clothes|traveler) hood\b/i);
    expect(R.prose(20)).not.toMatch(/\b(clothes|someone on the way) still on their body\b/i);
  });

  it('[s81 T19 | s81 failure 9 (s80 Root D family)] "Talk to someone in the street" is only offered on the road, never in a place', () => {
    expect(R.after(19).currentLocation, 'replay arrives at Cathedral Undercroft on T19').toBe('Cathedral Undercroft');
    for (const n of R.turns().filter((t) => !R.after(t).journey)) {
      expect(R.chipsAfter(n), `after T${n} at ${R.after(n).currentLocation}`).not.toContain('Talk to someone in the street');
    }
  });
});
