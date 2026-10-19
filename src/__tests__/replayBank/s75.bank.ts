import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, xpTotal } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-07T12-26-56-650Z_summoned-pact_cold-system_s75';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const CARAVAN = 'sp-spine-hollow-transit-glitch';
const FIGHT_PADS = /^(Press the attack|Try to flee|Parley|Attack from hiding)/;
const NON_TALK = /^(Search|Inspect|Look around|Travel toward|Turn back toward|Return to|Walk on|Check the exits|Wait|Scout|Ready yourself)/;

type Arc = { npcTopics?: Record<string, string[]>; topicCommits?: Record<string, string> };
const arc = (n: number, side: 'before' | 'after') => (R[side](n).arcDirector ?? {}) as Arc;
const pending = (n: number, side: 'before' | 'after') => R[side](n).sceneFacts?.pendingEncounter;
const active = (n: number, side: 'before' | 'after') => R[side](n).activeEncounter;
const moved = (n: number) => {
  const b = R.before(n);
  const a = R.after(n);
  return (
    b.currentLocation !== a.currentLocation ||
    (b.journey?.to ?? '') !== (a.journey?.to ?? '') ||
    (b.journey?.legsDone ?? -1) !== (a.journey?.legsDone ?? -1)
  );
};
const doneSteps = (n: number, side: 'before' | 'after') =>
  R[side](n).quests.flatMap((q) => (q.objectives ?? []).filter((o) => o.completed).map((o) => o.description));
const newlyDone = (n: number) => doneSteps(n, 'after').filter((d) => !doneSteps(n, 'before').includes(d));
const onlyPendingTurns = () => R.turns().filter((n) => !!pending(n, 'after') && !active(n, 'after'));
const caravanQuest = () => R.after(2).quests.find((q) => q.id === CARAVAN);

describe('replay bank s75', () => {
  it('[s75 T2 | s75 Root N] the grain-ship opening does not get the caravan spine (Elara, wagon, highwaymen)', () => {
    expect(R.before(2).currentLocation, 'replay opens in the grain-ship hold').toMatch(/grain-ship/);
    expect(R.after(2).quests.map((q) => q.id)).not.toContain(CARAVAN);
    for (const q of R.after(2).quests) {
      const text = [q.name, q.description, ...(q.objectives ?? []).map((o) => o.description)].join('\n');
      expect(text, q.id).not.toMatch(/Elara|wagon|caravan|highwaymen/i);
    }
  });

  it('[s75 T6 | s75 Root N] travel, search and inspect lines are not filed as talk topics and never tick a quest step', () => {
    expect(R.input(6), 'replay travels on T6').toMatch(/^Travel toward/);
    expect((R.before(6).sceneFacts?.present ?? []).length, 'someone is present in the hold before T6').toBeGreaterThan(0);
    const open = R.before(6).quests.some((q) => q.type === 'main' && (q.objectives ?? []).some((o) => !o.completed));
    expect(open, 'the main quest has an open step before T6').toBe(true);
    for (const n of R.turns()) {
      expect(Object.values(arc(n, 'after').topicCommits ?? {}), `T${n} topicCommits`).not.toContain('questStageAdvanced');
      if (!NON_TALK.test(R.input(n))) continue;
      expect(arc(n, 'after').npcTopics ?? {}, `T${n} "${R.input(n)}" topics`).toEqual(arc(n, 'before').npcTopics ?? {});
      expect(newlyDone(n).filter((d) => !/^Get your bearings/i.test(d)), `T${n} "${R.input(n)}" ticked steps`).toEqual([]);
      expect(R.receiptText(n), `T${n}`).not.toMatch(/quest step/i);
    }
  });

  // Retired multi lap 29: the replay no longer reaches the recorded state (see docs/orders/multi-result-29.md).
  it.skip('[s75 T6 | s75 Root N] a quest-step XP label is the whole objective or its clean head clause, never a fixed cut', () => {
    const paid = R.turns().filter((n) => /quest step: /i.test(R.receiptText(n)));
    expect(
      paid.length,
      'replay pays a quest step (on main the caravan spine no longer starts and no false tick happens, so this run never reaches the label)'
    ).toBeGreaterThan(0);
    for (const n of paid) {
      const descs = R.after(n).quests.flatMap((q) => (q.objectives ?? []).map((o) => o.description));
      for (const m of R.receiptText(n).matchAll(/quest step: ([^)]*)\)/gi)) {
        const label = m[1];
        expect(label, `T${n}`).not.toMatch(/\s$/);
        expect(
          descs.some((d) => d === label || (d.startsWith(label) && /^[,;:.]/.test(d.slice(label.length)))),
          `T${n} label "${label}"`
        ).toBe(true);
      }
    }
  });

  // Retired multi lap 29: the replay no longer reaches the recorded state (see docs/orders/multi-result-29.md).
  it.skip('[s75 T15 | s75 Root N] a quest pin that is not a town is never swapped for an unrelated settlement ("Transit Hub")', () => {
    expect(
      caravanQuest(),
      'replay starts the caravan spine with its "Moving Caravan Wagon" pin (on main the grain-ship card no longer matches it)'
    ).toBeTruthy();
    for (const n of R.turns()) {
      expect(R.after(n).quests.map((q) => q.location), `T${n}`).not.toContain('Transit Hub');
    }
    expect(R.receiptText(15)).not.toMatch(/Transit Hub/);
    expect(R.packet(15)).not.toMatch(/Transit Hub/);
  });

  // Retired multi lap 29: the replay no longer reaches the recorded state (see docs/orders/multi-result-29.md).
  it.skip('[s75 T15 | s75 Root N] the stuck nudge never announces the place of a quest with no open step', () => {
    const allDone = R.turns().filter((n) =>
      R.before(n).quests.some((q) => q.status === 'active' && (q.objectives ?? []).length > 0 && q.objectives!.every((o) => o.completed))
    );
    expect(
      allDone.length,
      'replay has an active quest with every step done (on main the false T6 tick no longer happens, so no such quest exists)'
    ).toBeGreaterThan(0);
    for (const n of allDone) expect(R.receiptText(n), `T${n}`).not.toMatch(/Nudge: word reaches you that .* leads to/);
  });

  it('[s75 T4,T16 | s75 Root N] the "Experience parameter incremented" voice line only shows when XP was actually paid', () => {
    const beats = (R.after(R.turns()[R.turns().length - 1]).stateTxLog ?? []).filter((x) => x.kind === 'beat_commit').map((x) => x.turn);
    expect(beats, 'replay commits the orient beat on T4').toContain(4);
    expect(beats, 'replay commits the skirmish beat on T16').toContain(16);
    for (const n of R.turns()) {
      if (!/Experience parameter incremented/i.test(R.receiptText(n))) continue;
      expect(xpTotal(R.after(n)), `T${n} voice line with no XP paid`).toBeGreaterThan(xpTotal(R.before(n)));
    }
  });

  it('[s75 T16-T21 | s75 Root O] a parked foe arrives in the engine within a short clock, on a non-move turn, with an Encounter receipt', () => {
    const parked = R.turns().find((n) => !pending(n, 'before') && !!pending(n, 'after'));
    expect(parked, 'replay parks the Integration Rat Pack (T16)').toBeTruthy();
    const name = pending(parked!, 'after')!.name;
    const live = R.turns().find((n) => n > parked! && active(n, 'after')?.name === name);
    expect(live, `${name} goes live`).toBeTruthy();
    expect(moved(live!), `T${live} arrival is not on a move turn`).toBe(false);
    expect(R.receiptText(live!)).toMatch(new RegExp(`^Encounter: ${name}`, 'm'));
    const waited = R.turns().filter((n) => n > parked! && n < live! && !moved(n)).length;
    expect(waited, 'non-move turns spent waiting').toBeLessThanOrEqual(3);
  });

  it('[s75 T16 | s75 Root O] a pending foe is saved at a pending phase, in sceneFacts and in placeThreats', () => {
    const turns = onlyPendingTurns();
    expect(turns.length, 'replay holds a pending foe (T16, T17)').toBeGreaterThan(0);
    for (const n of turns) {
      const p = pending(n, 'after')!;
      expect(p.phase, `T${n} pendingEncounter`).toBe('pending');
      const stored = Object.values(R.after(n).placeThreats ?? {}).filter((t) => t.encounter?.name === p.name);
      for (const t of stored) {
        expect(t.encounter.phase, `T${n} placeThreats`).not.toBe('engaged');
        expect(t.lastOutcome, `T${n} placeThreats`).not.toBe('live');
      }
    }
  });

  it('[s75 T17 | s75 Root O] a pending foe is not present, not under HERE and not a person ref', () => {
    const turns = onlyPendingTurns();
    expect(turns.length, 'replay holds a pending foe (T16, T17)').toBeGreaterThan(0);
    for (const n of turns) {
      const name = pending(n, 'after')!.name;
      expect(R.after(n).sceneFacts?.present ?? [], `T${n} present`).not.toContain(name);
      expect(R.turnCheck(n)?.presentNames ?? [], `T${n} turnCheck presence`).not.toContain(name);
      const pkt = R.packet(n);
      expect(pkt, `T${n} writer called`).not.toBe('');
      const here = pkt.match(/\nHERE:\n([\s\S]*?)\n[A-Z][A-Z ]+:/)?.[1] ?? '';
      expect(here, `T${n} HERE`).not.toContain(name);
      expect(pkt, `T${n} REF ENUM`).not.toMatch(/encounter:[^\n]*\bperson\b/);
      const mention = pkt.match(/YOU MAY ONLY MENTION:[^\n]*/)?.[0] ?? '';
      expect(mention, `T${n} mention list`).not.toContain(name);
    }
  });

  it('[s75 T17,T19 | s75 Root O] no encounter lock or fight-opener chips while the foe is only pending', () => {
    const turns = onlyPendingTurns();
    expect(turns.length, 'replay holds a pending foe (T16, T17)').toBeGreaterThan(0);
    for (const n of turns) {
      expect(R.noteText(n), `T${n}`).not.toMatch(/Encounter lock/);
      expect(R.chipsAfter(n).filter((c) => FIGHT_PADS.test(c)), `T${n} chips after`).toEqual([]);
    }
  });
});
