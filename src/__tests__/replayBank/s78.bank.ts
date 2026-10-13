import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const ROAD = 'On the road between places';
const outcome = (n: number) => R.packet(n).match(/Outcome: ([^.\n]+)/)?.[1] ?? '';
const refRows = (n: number) => R.packet(n).split('\n').filter((l) => /^t\d+\s{2}/.test(l));
const tel = (n: number) =>
  R.at(n).telemetry as typeof R.steps[number]['telemetry'] & {
    draftProblems?: string[];
    rejectedReason?: string;
    rejectedWriterText?: string;
    snapshotGist?: { lastBeat?: string };
  };
const arrivals = () =>
  R.turns().filter((n) => !!R.before(n).journey && !R.after(n).journey && R.after(n).currentLocation !== ROAD);

describe('replay bank s78', () => {
  it('[s78 T20 | s78 #1 unbound-tok] a token used without a refs entry is painted without a stray article ("a crate of the scrap")', () => {
    expect(R.verdicts(20), 'replay T20 still has the unbound-tok lines').toContain('react:unbound-tok');
    expect(R.prose(20)).not.toMatch(/a crate of the scrap/i);
  });

  it('[s78 T7,T9,T10,T11 | s78 #2] no "Reopens a closed fact" when nothing in the run is closed', () => {
    for (const n of R.turns().filter((t) => t <= 11)) {
      expect(R.after(n).activeEncounter, `T${n} no fight so far`).toBeFalsy();
      expect(R.after(n).sceneFacts?.lastKill, `T${n} no kill so far`).toBeFalsy();
    }
    for (const n of [7, 9, 10, 11]) {
      expect((tel(n).draftProblems ?? []).join('\n'), `T${n}`).not.toMatch(/Reopens a closed fact/);
    }
  });

  it('[s78 T7,T9,T11 | s78 #3] a draft the commit gate rejected does not reach the reader as written (whole run)', () => {
    expect(R.input(11), 'replay reaches the T11 "Press the contact" turn').toBe('Press the contact on the dispute');
    for (const n of R.turns()) {
      const t = tel(n);
      if (!t.rejectedReason || !t.rejectedWriterText) continue;
      const first = t.rejectedWriterText.split(/(?<=[.!?])\s/)[0];
      expect(R.prose(n), `T${n} rejected for "${t.rejectedReason}"`).not.toContain(first);
    }
  });

  it('[s78 T2-T4 | s78 #4] the "Nobody here — the summoners are gone, delayed, or never came" slot makes no person', () => {
    expect(JSON.stringify(R.before(2)), 'replay opens on the alone barn card').toContain('Nobody here — the summoners are gone');
    const junk = /summoners|delayed|never came/i;
    for (const n of [2, 3, 4]) {
      expect(refRows(n).filter((l) => /\bperson\b/.test(l) && junk.test(l)), `T${n} REF ENUM`).toEqual([]);
      expect((R.turnCheck(n)?.presentNames ?? []).filter((p) => junk.test(p)), `T${n} present names`).toEqual([]);
    }
  });

  it('[s78 T2 | s78 #5] a worn-device save names no panel: not in the quest step, not on the REF ENUM', () => {
    expect(R.before(2).systemHousing?.housing, 'replay housing is the worn device').toBe('worn_device');
    for (const q of R.after(2).quests) {
      for (const o of q.objectives ?? []) expect(o.description, q.id).not.toMatch(/panel/i);
    }
    expect(refRows(2).filter((l) => /panel/i.test(l))).toEqual([]);
  });

  it('[s78 T2 | s78 #6] quest rewards hold item names, not a sentence', () => {
    const q = R.after(2).quests.find((x) => x.id === 'sp-quest-1');
    expect(q, 'replay has the starter quest').toBeTruthy();
    for (const item of q?.rewards?.items ?? []) {
      expect(item).not.toMatch(/;/);
      expect(item.split(/\s+/).length, item).toBeLessThanOrEqual(5);
    }
  });

  it('[s78 T2,T4 | s78 #8] the alone card\'s place name does not carry "alone in"', () => {
    expect(R.before(2).currentLocation ?? '', 'replay opens in the barn').toMatch(/abandoned barn in Pellane country/);
    expect(R.before(2).currentLocation).not.toMatch(/^alone in\b/i);
    for (const n of R.turns()) {
      for (const p of R.after(n).places ?? []) expect(p.name, `T${n} place`).not.toMatch(/^alone in\b/i);
      for (const c of R.chips(n)) expect(c, `T${n} chip`).not.toMatch(/\balone in an\b/i);
      expect(R.packet(n), `T${n} packet`).not.toMatch(/from alone in /);
    }
  });

  it('[s78 T5 | s78 #9] no "Return to X" chip for a place never visited (whole run)', () => {
    expect(R.visitedBefore(5).has('Cathedral Close'), 'Cathedral Close is unvisited before T5').toBe(false);
    for (const t of R.turns()) {
      const visited = R.visitedBefore(t);
      for (const c of R.chips(t)) {
        const m = c.match(/^Return to (.+)$/);
        if (m) expect(visited.has(m[1]), `T${t} chip "${c}"`).toBe(true);
      }
    }
  });

  // Retired multi lap 52: the replay no longer reaches the recorded state (see docs/orders/multi-result-52.md).
  it.skip('[s78 T5 | s78 #10] the first arrival at Cathedral Close is not told as a return through Lowmarket', () => {
    expect(R.after(5).currentLocation, 'replay arrives at Cathedral Close on T5').toBe('Cathedral Close');
    expect(R.visitedBefore(5).has('Cathedral Close'), 'first visit').toBe(false);
    expect(R.prose(5)).not.toMatch(/came back to Cathedral Close/i);
    expect(R.prose(5)).not.toMatch(/back streets of Lowmarket/i);
  });

  it('[s78 T1 | s78 #11] the opening page shows the device, not the housing rules text', () => {
    const page1 = R.steps[0].before.log.find((e) => e.role === 'gm')?.content ?? '';
    expect(page1, 'replay has an opening page').toMatch(/abandoned barn/);
    expect(page1).not.toMatch(/Others can see the object, but only the wearer reads the screen/);
  });

  it('[s78 T21 | s78 #13] "Open the crate" hands the writer the search result, not "Outcome: spawned"', () => {
    expect(R.input(21), 'replay opens the crate on T21').toBe('Open the crate');
    expect(outcome(21)).not.toMatch(/^spawned/);
    const found = R.packet(21).match(/Search: you opened the crate and found ([^.]+)\./)?.[1];
    expect(found, 'packet carries the search result').toBeTruthy();
    expect((R.after(21).inventory ?? []).map((i) => i.name)).toContain(found);
  });

  it('[s78 T18 | s78 #14] a kindness to a stall-hand is not "Outcome: spawned"', () => {
    expect(R.input(18)).toBe('Offer a kindness to a stall-hand');
    expect(R.after(18).sceneFacts?.pendingEncounter, 'replay parks the rat pack on T18').toBeTruthy();
    expect(outcome(18)).not.toMatch(/^spawned/);
  });

  it('[s78 T18,T21 | s78 #15] the threat block never hands the writer catalog text', () => {
    const parked = R.turns().filter((n) => !!R.after(n).sceneFacts?.pendingEncounter);
    expect(parked.length, 'replay parks a foe').toBeGreaterThan(0);
    for (const n of R.turns()) expect(R.packet(n), `T${n}`).not.toMatch(/\[SCENE\]|Creates a suspicion cue/);
  });

  it('[s78 T18 | s78 #16] LAST lists engine receipts, never warden chrome (whole run)', () => {
    expect(R.packetBlock(18, 'LAST:'), 'T18 packet has a LAST block').not.toBe('');
    for (const n of R.turns()) {
      expect(R.packetBlock(n, 'LAST:'), `T${n}`).not.toMatch(/Warden|Cooldown|Sealed-beat|pad\(s\)/);
    }
  });

  it('[s78 T17 | s78 #17] no skill rank prints while skills are off', () => {
    expect(R.before(2).systemHousing?.parts?.skills, 'skills are off in this housing').toBe(false);
    const last = R.turns()[R.turns().length - 1];
    expect(R.after(last).character.level, 'replay reaches level 2').toBeGreaterThanOrEqual(2);
    for (const n of R.turns()) expect(R.receiptText(n), `T${n}`).not.toMatch(/\brank \d/i);
  });

  it('[s78 T9 | s78 #18] a no-words talk chip gives Jax no spoken line', () => {
    expect(R.input(9)).toBe('Talk to someone in the street');
    expect(R.before(9).journey?.encounter, 'replay meets the traveler on the road').toBeTruthy();
    expect(R.prose(9)).not.toMatch(/Jax said/);
  });

  // Writer-quality set (John 13 Oct): checks recorded writer prose; kept out of the bank pass score (npm run writer-quality).
  it('[writer-quality] [s78 T9 | s78 #19] on leg 1 toward the Undercroft Jax does not walk toward Cathedral Close or reach the doorway', () => {
    const j = R.before(9).journey;
    expect(j?.to, 'replay is on the road to the Undercroft').toBe('Cathedral Undercroft');
    expect(j?.from).toBe('Cathedral Close');
    expect(R.after(9).journey?.to, 'still on the road after T9').toBe('Cathedral Undercroft');
    expect(R.prose(9)).not.toMatch(/Jax walked[^.]*toward Cathedral Close/);
    expect(R.prose(9)).not.toMatch(/doorway to the Undercroft waited ahead/);
  });

  it('[s78 T17 | s78 #20] the Walk-on arrival keeps its action line when "Earth" is a mentionable word', () => {
    expect(R.input(17)).toBe('Walk on');
    expect(R.after(17).currentLocation, 'replay arrives at Lowmarket on T17').toBe('Lowmarket');
    expect(R.packet(17).match(/YOU MAY ONLY MENTION:[^\n]*/)?.[0] ?? '', 'Earth is on the mention list').toMatch(/\bEarth\b/);
    expect(R.verdicts(17)).not.toContain('action:capital');
    expect((R.turnCheck(17)?.down ?? []).filter((f) => f.kind === 'action-object-missing')).toEqual([]);
  });

  // John 13 Oct: leaving and coming back in the same turn reads "Turned back this turn: back to <place>".
  it('[s78 T10,T15,T20 | s78 #21] every turn-back arrival packet carries "Turned back this turn: back to <place>"', () => {
    const arr = arrivals();
    expect(arr, 'replay has the turn-back arrivals T10, T15, T20').toEqual(expect.arrayContaining([10, 15, 20]));
    for (const n of arr) {
      const place = R.after(n).currentLocation ?? '';
      const line = [10, 15, 20].includes(n) ? `Turned back this turn: back to ${place}` : 'Moved this turn';
      expect(R.packet(n), `T${n} arrival at ${place}`).toContain(line);
    }
  });

  it('[s78 T15 | s78 #22] standing in the Undercroft, the way out is not "up the stairs to Cathedral Undercroft"', () => {
    expect(R.after(15).currentLocation, 'replay is back in the Undercroft on T15').toBe('Cathedral Undercroft');
    expect(R.prose(15)).not.toMatch(/stairs to Cathedral Undercroft/);
  });

  it('[s78 T11 | s78 #26] no "contact" or "dispute" chip where neither was ever shown (whole run)', () => {
    expect(R.before(11).currentLocation, 'replay stands in Cathedral Close before T11').toBe('Cathedral Close');
    for (const n of R.turns()) {
      const shown = R.turns()
        .filter((t) => t < n)
        .some((t) => /\b(contact|dispute)\b/i.test(R.prose(t)));
      if (shown) continue;
      for (const c of R.chips(n)) expect(c, `T${n}`).not.toMatch(/\b(contact|dispute)\b/i);
    }
  });

  it('[s78 T11,T21 | s78 #28] nobody sits on presence or the writer\'s people list without being shown', () => {
    expect(R.before(11).currentLocation, 'replay is at Cathedral Close on T11').toBe('Cathedral Close');
    for (const n of [11, 12]) expect(R.packet(n), `T${n}`).not.toMatch(/Brother Tam/);
    for (const n of R.turns()) {
      const shownSoFar = R.turns()
        .filter((t) => t <= n)
        .map((t) => R.prose(t))
        .join('\n');
      for (const p of R.after(n).sceneFacts?.present ?? []) {
        if (p === 'bystanders') continue;
        expect(shownSoFar, `T${n} present "${p}"`).toContain(p);
      }
    }
  });

  it('[s78 T18 | s78 #29] setting a bag down to help is not giving anything away', () => {
    expect(R.prose(18), 'replay T18 prose has the bag line').toMatch(/set their own bag down/);
    expect((R.after(18).inventory ?? []).some((i) => i.name === 'Bag'), 'the Bag is still carried').toBe(true);
    expect(R.after(18).sceneFacts?.givenAway ?? []).toEqual([]);
  });

  it('[s78 T4,T9,T13,T14,T16 | s78 #30] the indoor/outdoor tag follows the place, not a flip', () => {
    const roads = R.turns().filter((n) => R.after(n).currentLocation === ROAD);
    const under = R.turns().filter((n) => R.after(n).currentLocation === 'Cathedral Undercroft');
    expect(roads.length, 'replay has road turns').toBeGreaterThan(0);
    expect(under.length, 'replay stands in the Undercroft').toBeGreaterThan(0);
    for (const n of roads) {
      expect(tel(n).snapshotGist?.lastBeat ?? '', `T${n} road`).not.toMatch(/\bindoors\b/);
      expect(R.after(n).sceneFacts?.indoor, `T${n} road`).not.toBe(true);
    }
    for (const n of under) {
      expect(tel(n).snapshotGist?.lastBeat ?? '', `T${n} Undercroft`).not.toMatch(/\boutdoors\b/);
      expect(R.after(n).sceneFacts?.indoor, `T${n} Undercroft`).not.toBe(false);
    }
  });
});
