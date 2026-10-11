import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-07T06-02-53-973Z_summoned-pact_cold-system_s74';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const HEAR = 'Hear their reason (or demand it)';
const OATH = 'Choose: swear, refuse, or delay';
const FIGHT_PADS = /^(Press the attack|Try to flee|Parley|Attack from hiding)/;

const pending = (n: number, side: 'before' | 'after') => R[side](n).sceneFacts?.pendingEncounter;
const active = (n: number, side: 'before' | 'after') => R[side](n).activeEncounter;
const txAt = (n: number) => (R.after(n).stateTxLog ?? []).filter((x) => x.turn === n);
const moved = (n: number) => {
  const b = R.before(n);
  const a = R.after(n);
  return (
    b.currentLocation !== a.currentLocation ||
    (b.journey?.to ?? '') !== (a.journey?.to ?? '') ||
    (b.journey?.legsDone ?? -1) !== (a.journey?.legsDone ?? -1)
  );
};
const newFoe = (n: number) =>
  (!active(n, 'before') && !!active(n, 'after')) ||
  (!!pending(n, 'after') && pending(n, 'after')?.name !== pending(n, 'before')?.name);
const mainQuest = (n: number, side: 'before' | 'after') => R[side](n).quests.find((q) => q.id === 'sp-quest-1');
const hearDone = (n: number, side: 'before' | 'after') =>
  mainQuest(n, side)?.objectives?.find((o) => o.description === HEAR)?.completed;

describe('replay bank s74', () => {
  it('[s74 T10 | s74 Root L] a turn-back off a road meeting writes no Encounter receipt, no combat log and parks no foe', () => {
    expect(R.input(10), 'replay picks the turn-back on T10').toMatch(/^Turn back toward Valespire peace-festival square/);
    expect(R.before(10).journey?.encounter?.kind, 'replay faces the thugs road meeting before T10').toBe('thugs');
    expect(R.receiptText(10)).not.toMatch(/^Encounter:/m);
    expect(txAt(10).filter((x) => x.kind === 'combat')).toEqual([]);
    expect(active(10, 'after')).toBeFalsy();
    expect(pending(10, 'after')).toBeFalsy();
  });

  it('[s74 T10 | s74 Root L] no new foe is spawned or parked on a move turn or on top of a live road meeting (whole run)', () => {
    const moves = R.turns().filter(moved);
    const meetings = R.turns().filter((n) => {
      const m = R.before(n).journey?.encounter as { engaged?: boolean; escaped?: boolean } | null | undefined;
      return !!m && !m.engaged && !m.escaped;
    });
    expect(moves, 'replay has move turns (T10 turn-back among them)').toContain(10);
    expect(meetings.length, 'replay has turns with a live road meeting').toBeGreaterThan(0);
    for (const n of new Set([...moves, ...meetings])) {
      expect(newFoe(n), `T${n} new foe`).toBe(false);
      expect(
        txAt(n).filter((x) => x.kind === 'combat' || /Threat building/.test(x.summary)),
        `T${n} combat/threat log`
      ).toEqual([]);
    }
  });

  it('[s74 T21 | s74 Root L] a foe parked this turn is not made live the same turn and gets no fight pads', () => {
    const parked = R.turns().filter((n) => !pending(n, 'before') && !!pending(n, 'after'));
    expect(parked.length, 'replay parks a foe (T11 Wardline Bandit, T18 Close Alley Cutter)').toBeGreaterThan(0);
    for (const n of parked) {
      expect(active(n, 'after'), `T${n}`).toBeFalsy();
      expect(R.receiptText(n), `T${n}`).not.toMatch(/^Encounter:/m);
      expect(R.noteText(n), `T${n}`).not.toMatch(/Encounter lock/);
      expect(R.chipsAfter(n).filter((c) => FIGHT_PADS.test(c)), `T${n} chips after`).toEqual([]);
    }
    for (const n of R.turns().filter((t) => !active(t, 'before') && !!active(t, 'after'))) {
      expect(pending(n, 'before'), `T${n} went live without being parked on an earlier turn`).toBeTruthy();
    }
  });

  it('[s74 T21 | s74 Root L] a foe\'s arrival line names the real ground, never the road placeholder or a "room" on a street', () => {
    const arrivals = R.turns().filter((n) => /^Encounter:/m.test(R.receiptText(n)));
    expect(
      arrivals.length,
      'replay takes a parked foe live (on main the Close Alley Cutter falls due on T20, a move turn, so no foe ever arrives in this run)'
    ).toBeGreaterThan(0);
    for (const n of arrivals) {
      const text = `${R.receiptText(n)}\n${R.noteText(n)}`;
      expect(text, `T${n}`).not.toMatch(/On the road between places/);
      if (R.after(n).journey) expect(text, `T${n}`).not.toMatch(/edge of the room/);
    }
  });

  it('[s74 T18 | s74 Root M] "Hear their reason" with only Nell and Col present does not pay the quest stage', () => {
    expect(R.input(18), 'replay plays the hear-reason line on T18').toBe(HEAR);
    expect(R.before(18).currentLocation, 'replay is at Cathedral Close').toBe('Cathedral Close');
    const here = R.before(18).sceneFacts?.present ?? [];
    expect(here, 'Nell Rudd is present').toContain('Nell Rudd');
    expect(here.some((p) => /handler/i.test(p)), 'no handler is present').toBe(false);
    expect(hearDone(18, 'before'), 'hear-reason is still open before T18').toBe(false);
    expect(hearDone(18, 'after')).toBe(false);
    expect(txAt(18).filter((x) => x.kind === 'quest_stage')).toEqual([]);
    expect(R.receiptText(18)).not.toMatch(/reason heard|quest step/i);
  });

  it('[s74 T18 | s74 Root M] the hear-reason chip is not offered at Cathedral Close where its giver is absent', () => {
    const atClose = R.turns().filter((n) => R.before(n).currentLocation === 'Cathedral Close' && hearDone(n, 'before') === false);
    expect(atClose, 'replay stands at Cathedral Close with hear-reason open (T18)').toContain(18);
    for (const n of atClose) {
      expect(R.before(n).sceneFacts?.present?.some((p) => /handler/i.test(p)), `T${n} no handler here`).toBeFalsy();
      expect(R.chips(n), `T${n}`).not.toContain(HEAR);
    }
  });

  it('[s74 T20 | s74 Root M] "Choose: swear, refuse, or delay" is never offered with no oath or offer in the scene', () => {
    const q = mainQuest(20, 'before');
    expect(q?.objectives?.some((o) => o.description === OATH && !o.completed), 'oath step is open in the replay').toBe(true);
    for (const n of R.turns()) {
      expect(R.chips(n), `T${n}`).not.toContain(OATH);
      expect(R.chipsAfter(n), `after T${n}`).not.toContain(OATH);
    }
  });

  it('[s74 T14 | s74 Root M] the festival-square start does not carry a circle-summoning quest into the writer packet', () => {
    expect(R.before(2).currentLocation, 'replay opens in the festival square').toBe('Valespire peace-festival square');
    expect(R.packet(14), 'writer is called on T14').not.toBe('');
    for (const q of R.after(2).quests) {
      const text = [q.name, q.description, ...(q.objectives ?? []).map((o) => o.description)].join('\n');
      expect(text, q.id).not.toMatch(/circle/i);
    }
    const questLines = R.packet(14)
      .split('\n')
      .filter((l) => /quest/i.test(l));
    expect(questLines.join('\n')).not.toMatch(/circle/i);
  });
});
