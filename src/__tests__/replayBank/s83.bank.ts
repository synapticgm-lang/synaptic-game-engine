import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, present } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-11T07-32-23-189Z_summoned-pact_cold-system_s83';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const named = (n: number) => present(R.before(n)).filter((p) => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(p));
const placeNames = (n: number) => (R.after(n).places ?? []).map((p) => p.name);

describe('replay bank s83', () => {
  it('[s83 T20 | s83 Root A] the road meeting\'s own talk chip runs a parley check and settles the meeting', () => {
    expect(R.before(20).journey?.encounter?.kind, 'thugs meeting is open before T20').toBe('thugs');
    expect(R.input(20)).toBe('Talk your way past the thugs');
    expect(R.receiptText(20)).toMatch(/^Parley check:/m);
    if (/Parley check:.*success/.test(R.receiptText(20))) {
      const enc = R.after(20).journey?.encounter as { engaged?: boolean; escaped?: boolean } | null | undefined;
      expect(!enc || enc.engaged === true || enc.escaped === true, 'meeting is over (cleared, engaged or escaped)').toBe(true);
      const next = R.chipsAfter(20);
      expect(next).toContain('Walk on');
      for (const c of next) expect(c).not.toMatch(/thugs/i);
    } else {
      expect(R.after(20).activeEncounter, 'failed parley forces a live fight').toBeTruthy();
    }
  });

  it('[s83 T14 | s83 Root B] "Check the exits" commits an exits receipt naming the mapped ways out', () => {
    expect(R.input(14)).toBe('Check the exits');
    expect(R.before(14).currentLocation, 'player is at Cathedral Close').toBe('Cathedral Close');
    const exits = R.receipts(14).find((l) => /^Exits:/.test(l)) ?? '';
    expect(exits).toMatch(/Contract Hall/);
    expect(exits).toMatch(/Cathedral Undercroft/);
    const known = placeNames(14);
    const listed = exits.replace(/^Exits:.*?lead to /, '').replace(/\.$/, '').split(/,\s*|\s+and\s+/).filter(Boolean);
    for (const p of listed) expect(known, `exit "${p}" is a mapped place`).toContain(p);
  });

  it('[s83 T13 | s83 Root C (s82 Root E)] a named person here keeps a talk chip; no role chip stands in for them', () => {
    const turns = R.turns().filter((n) => !R.before(n).journey && named(n).length > 0);
    expect(turns.length, 'replay has turns with named people here (Cathedral Close, Lowmarket)').toBeGreaterThan(0);
    for (const t of turns) {
      const chips = R.chips(t);
      const people = named(t);
      expect(
        chips.some((c) => people.some((p) => new RegExp(`^(Talk to|Talk with|Ask) ${p}\\b`).test(c))),
        `T${t}: talk chip for one of ${people.join(', ')} in ${JSON.stringify(chips)}`,
      ).toBe(true);
      for (const c of chips) expect(c, `T${t}`).not.toMatch(/^(Talk to the |Offer a kindness to a |Call out to a bystander)/);
    }
  });

  it('[s83 T5 | s83 Root D] turning toward a new place mid-trip does not restart leg 1 from the origin', () => {
    expect(R.before(5).journey?.to, 'trip toward Lowmarket is underway before T5').toBe('Lowmarket');
    expect(R.input(5)).toBe('Return to Cathedral Close');
    expect(R.receiptText(5)).not.toMatch(/back streets between Contract Hall and Cathedral Close\W+leg 1 of 2/);
  });

  it('[s83 T8 | s83 Root G] a travel beat is not a near copy of an earlier one and keeps the receipt\'s time of day', () => {
    expect(R.receiptText(8), 'T8 receipt says midday').toMatch(/now midday/);
    expect(R.packet(8), 'the writer is handed midday').toMatch(/now midday/);
    expect(R.prose(8)).not.toMatch(/morning/i);
    expect(R.prose(8)).not.toMatch(/the morning light sat pale on the high stone walls/);
  });

  it('[s83 T2 | s83 Root E] "Ask what they want" is answered with the card\'s want', () => {
    expect(R.input(2)).toBe('Ask what they want');
    expect(R.packet(2), 'packet carries the want').toMatch(/What they want[^\n]*Calamity Mark/);
    expect(R.prose(2)).toMatch(/Calamity Mark/);
  });

  it('[s83 T18 | s83 failure 8] no broken sentence after a closing quote ("…already?" While …)', () => {
    expect(R.after(18).currentLocation, 'replay is back at Lowmarket on T18').toBe('Lowmarket');
    expect(R.prose(18)).not.toMatch(/[?!.]"\s+While\b/);
  });

  // Retired multi lap 52: checks recorded writer prose that no packet change can alter (see docs/orders/multi-result-52.md).
  it.skip('[s83 T9,T11,T18 | s83 failure 8] "Back already?" and "looked up from a crate" are not reused across beats', () => {
    expect(R.after(11).currentLocation, 'replay returns to Cathedral Close on T11').toBe('Cathedral Close');
    const crate = R.turns().filter((n) => /looked up from (a|the) crate/i.test(R.prose(n)));
    const back = R.turns().filter((n) => /Back (again )?already\?/i.test(R.prose(n)));
    expect(crate.length, `crate beat on ${crate.map((n) => 'T' + n).join(', ')}`).toBeLessThanOrEqual(1);
    expect(back.length, `"Back already?" on ${back.map((n) => 'T' + n).join(', ')}`).toBeLessThanOrEqual(1);
  });

  it('[s83 T19 | s83 failure 8] a back-streets road meeting is not rolled two levels above the player', () => {
    const t = R.turns().find((n) => R.after(n).journey?.encounter?.kind === 'thugs');
    expect(t, 'replay rolls a thugs meeting (recorded T19)').toBeTruthy();
    const enc = R.after(t!).journey!.encounter!;
    const level = (R.after(t!).character as unknown as { level?: number }).level ?? 1;
    expect(enc.level, `thugs level ${enc.level} vs player level ${level}`).toBeLessThanOrEqual(level + 1);
  });

  it('[s83 T6,T9,T11 | s83 failure 8] the opening "Approach the doorway cautiously" chip is not offered on the road', () => {
    const road = R.turns().filter((n) => R.before(n).journey);
    expect(road.length, 'replay has road turns').toBeGreaterThan(0);
    for (const t of road) expect(R.chips(t), `T${t}`).not.toContain('Approach the doorway cautiously');
  });

  // Retired multi lap 52: checks recorded writer prose that no packet change can alter (see docs/orders/multi-result-52.md).
  it.skip('[s83 T15 | s83 failure 8, writer] the road beat does not give Jax boots he does not have', () => {
    expect(R.input(15)).toBe('Travel toward Lowmarket');
    expect(R.before(15).inventory.some((i) => /boot/i.test(i.name)), 'Jax owns no boots').toBe(false);
    expect(R.prose(15)).not.toMatch(/\bboots?\b/i);
  });

  // Retired multi lap 52: checks recorded writer prose that no packet change can alter (see docs/orders/multi-result-52.md).
  it.skip('[s83 T16 | s83 failure 8, writer] Contract Hall is not placed past the Lowmarket stalls', () => {
    expect(R.after(16).currentLocation, 'replay arrives at Lowmarket on T16').toBe('Lowmarket');
    expect(R.prose(16)).not.toMatch(/Contract Hall stood|past the last stall,? the Contract Hall/i);
  });

  it('[s83 T2 | s83 failure 8] "Ash Court" is never painted lowercased as "ash Court"', () => {
    expect(R.packet(2), 'replay reaches the T2 writer call').not.toBe('');
    for (const t of R.turns()) {
      expect(R.prose(t), `T${t} prose`).not.toMatch(/\bash Court\b/);
      expect(R.packet(t), `T${t} packet`).not.toMatch(/\bash Court\b/);
    }
  });
});
