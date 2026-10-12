import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, chipNamesPerson, present } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-11T07-19-29-838Z_summoned-pact_cold-system_s82';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const DESK = 'the wagon desk of the Argent Ledger';
const ROAD = 'On the road between places';
const lastKill = (n: number) => (R.before(n).sceneFacts as { lastKill?: unknown } | undefined)?.lastKill;
const invNames = (n: number, when: 'before' | 'after') =>
  ((when === 'before' ? R.before(n) : R.after(n)).inventory ?? []).map((i) => i.name).sort();

describe('replay bank s82', () => {
  // Retired multi lap 29: the replay no longer reaches the recorded state (see docs/orders/multi-result-29.md).
  it.skip('[s82 T13 | s82 Root A] a won fight is written as won, and the next list holds no flee chips', () => {
    const won = R.turns().filter((n) => /^Fight: VICTORY/m.test(R.receiptText(n)));
    expect(won.length, 'replay has a won fight (recorded T13 flee failed into a forced fight; on main the T13 flee roll succeeds)').toBeGreaterThan(0);
    for (const t of won) {
      expect(R.prose(t), `T${t}`).not.toMatch(/still (gripp|holding|clutch)|kept running|ran (for|toward)/i);
      for (const c of R.chipsAfter(t)) expect(c, `after T${t}`).not.toMatch(/^(Find cover|Keep running|Try to flee)$/);
    }
  });

  // Retired multi lap 29: the replay no longer reaches the recorded state (see docs/orders/multi-result-29.md).
  it.skip('[s82 T15 | s82 Root B] looting a body already paid out commits a found-nothing-more outcome and rests the chip', () => {
    const t = R.turns().find((n) => /^Loot the body of /.test(R.input(n)) && lastKill(n));
    expect(t, 'replay loots a lastKill body (recorded T15; on main the T13 flee succeeds so there is no body)').toBeTruthy();
    expect(R.receiptText(t!)).not.toBe('');
    expect(invNames(t!, 'after')).toEqual(invNames(t!, 'before'));
    for (const c of R.chipsAfter(t!)) expect(c).not.toMatch(/^Loot the body of /);
  });

  it('[s82 T16 | s82 Root C] "Leave the scene" never commits the road label as a place with no journey', () => {
    expect(R.input(16), 'replay picks Leave the scene on T16').toBe('Leave the scene');
    expect(R.receiptText(16)).not.toMatch(/to On the road between places/);
    if (R.after(16).currentLocation === ROAD) expect(R.after(16).journey, 'on the road label with a trip underway').toBeTruthy();
    expect((R.after(16).places ?? []).map((p) => p.name)).not.toContain(ROAD);
  });

  it('[s82 T19 | s82 Root C] travel toward Lowmarket after leaving the desk does not restart leg 1 from the desk', () => {
    expect(R.input(19)).toBe('Travel toward Lowmarket');
    expect(R.before(19).currentLocation, 'player has already left the desk before T19').not.toBe(DESK);
    expect(R.receiptText(19)).not.toMatch(/between the wagon desk of the Argent Ledger and Lowmarket\W+leg 1 of 2/);
  });

  it('[s82 T3 | s82 Root D] "Look inward" does not empty the next list; a talk chip for Yara or Kade stays', () => {
    expect(R.input(3), 'replay picks Look inward on T3').toBe('Look inward');
    const next = R.chips(4);
    expect(next.length).toBeGreaterThan(0);
    expect(next.some((c) => /^Talk to (Yara Quill|Kade Voss)$/.test(c))).toBe(true);
  });

  it('[s82 T13 | s82 Root E] topic exhaust never removes the talk chip of someone the player has not talked to', () => {
    expect(R.turns().some((n) => present(R.before(n)).includes('Kade Voss')), 'Kade Voss is here in the replay').toBe(true);
    for (const t of R.turns()) {
      for (const m of R.noteText(t).matchAll(/Topic exhausted pad: Talk to ([A-Z][a-z]+ [A-Z][a-z]+)/g)) {
        const name = m[1];
        const talked = R.turns().some((p) => p < t && chipNamesPerson(R.input(p), name));
        expect(talked, `T${t}: topic exhausted for ${name} with no earlier talk to them`).toBe(true);
      }
    }
  });

  // Retired multi lap 41: the wagon desk no longer gets the moving-wagon spine, so the replay no longer reaches the
  // recorded quest (see docs/orders/multi-result-41.md; m41lap41.bank.ts proves the fix on this run).
  it.skip('[s82 T9 | s82 Root F] the quest nudge never prints highwaymen boarding a moving wagon at a static desk', () => {
    expect((R.after(9).quests ?? []).some((q) => q.name === 'The Accidental Passenger'), 'quest is The Accidental Passenger').toBe(true);
    expect(R.after(9).currentLocation, 'player stands at the static desk on T9').toBe(DESK);
    for (const t of R.turns()) expect(R.receiptText(t), `T${t}`).not.toMatch(/highwaymen|moving wagon/i);
  });

  it('[s82 T17 | s82 Root G] a body-part "chest" in prose does not become a "Check the chest" chip', () => {
    const t = R.turns().find((n) => /in their chest/.test(R.prose(n)));
    expect(t, 'replay commits the "sitting in their chest" beat (recorded T17)').toBeTruthy();
    expect(R.noteText(t!)).not.toMatch(/Prop pad: Check the chest/);
    for (const n of R.turns()) {
      const props = (R.after(n).sceneFacts as { props?: string[] } | undefined)?.props ?? [];
      if (props.some((p) => /chest/i.test(p))) continue;
      expect(R.chipsAfter(n), `after T${n}`).not.toContain('Check the chest');
    }
  });

  it('[s82 T16 | s82 failure 8, writer] nobody says "Lowmarket is behind us" before Jax has been to Lowmarket', () => {
    expect(R.visitedBefore(17).has('Lowmarket'), 'Jax has not reached Lowmarket by T16').toBe(false);
    expect(R.prose(16)).not.toMatch(/Lowmarket is behind us/i);
  });

  // Retired multi lap 29: the replay no longer reaches the recorded state (see docs/orders/multi-result-29.md).
  it.skip('[s82 T20 | s82 failure 8, stance chip] "Offer Col Fenwick honest help" gives Jax no spoken lines', () => {
    expect(R.input(20)).toBe('Offer Col Fenwick honest help');
    expect(present(R.before(20)), 'Col Fenwick is on the road before T20 (on main the road holds thugs instead)').toContain('Col Fenwick');
    expect(R.prose(20)).not.toMatch(/"[^"]*,"\s*Jax (told|said|asked)|Jax (told|said to) [^."]*[,:]\s*"/);
  });
});
