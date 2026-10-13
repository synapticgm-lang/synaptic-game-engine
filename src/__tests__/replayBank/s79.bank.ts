import { beforeAll, describe, expect, it, vi } from 'vitest';
import { filterInventedContextChoices } from '../../game/choiceWarden';
import { reconcileXpStatusLines } from '../../game/systemLog';
import { MOJIBAKE, Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-10T23-30-22-109Z_summoned-pact_cold-system_s79';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const CARD_PLACE = 'the ledger stair on the Palace Approach';
const HEAR = 'Hear their reason (or demand it)';
const refRows = (n: number) => R.packet(n).split('\n').filter((l) => /^t\d+\s{2}/.test(l));
const mentions = (n: number) => R.packet(n).match(/YOU MAY ONLY MENTION:[^\n]*/)?.[0] ?? '';
const hearDone = (n: number, side: 'before' | 'after') =>
  R[side](n)
    .quests.find((q) => q.id === 'sp-quest-1')
    ?.objectives?.find((o) => o.description === HEAR)?.completed;
const printedXp = (n: number) =>
  [...new Set(R.receipts(n))]
    .map((l) => Number(l.match(/^XP Gained: (\d+)/)?.[1] ?? 0))
    .reduce((a, b) => a + b, 0);
const xpGain = (n: number) => {
  const b = R.before(n).character;
  const a = R.after(n).character;
  if (a.level === b.level) return a.xp - b.xp;
  return b.xpToNext - b.xp + a.xp;
};

describe('replay bank s79', () => {
  it('[s79 T14 | s79 Root A #1] the chips stored on the log are the chips the player picks from next turn', () => {
    expect(R.after(14).journey?.encounter?.kind, 'replay meets the thugs on T14').toBe('thugs');
    const turns = R.turns();
    for (const n of turns.slice(0, -1)) {
      const next = turns[turns.indexOf(n) + 1];
      expect(R.lastGm(n)?.offeredChoices ?? [], `log after T${n} vs pick list T${next}`).toEqual(R.chips(next));
    }
  });

  it('[s79 T14 | s79 Root A #2] engine-placed thugs keep their chips although the prose says "three rough men"', () => {
    expect(R.after(14).journey?.encounter?.kind, 'replay meets the thugs on T14').toBe('thugs');
    expect(R.prose(14), 'T14 prose shows the meeting without the word').toMatch(/three rough men/);
    const chips = ['Face the thugs', 'Talk your way past the thugs'];
    expect(filterInventedContextChoices(chips, R.after(14))).toEqual(chips);
  });

  it('[s79 T5 | s79 Root B #3] "You came back." on a turn-back pays no hear-reason stage', () => {
    expect(R.input(5), 'replay turns back to the stair on T5').toBe(`Turn back toward ${CARD_PLACE}`);
    expect(R.after(5).sceneFacts?.present ?? [], 'Ila is here').toContain('Ila Pellane');
    expect(R.prose(5), 'Ila only greets').toMatch(/"You came back\."/);
    expect(hearDone(5, 'before'), 'hear-reason open before T5').toBe(false);
    expect(hearDone(5, 'after')).toBe(false);
    expect(R.receiptText(5)).not.toMatch(/reason heard|quest step/i);
  });

  it('[s79 T5 | s79 Root B #4] every XP point the code pays has a printed XP line (whole run)', () => {
    const paid = R.turns().filter((n) => xpGain(n) > 0);
    expect(paid.length, 'replay pays XP').toBeGreaterThan(0);
    for (const n of paid) expect(printedXp(n), `T${n}`).toBe(xpGain(n));
    const line = 'XP Gained: 50 (quest step: Hear their reason (or demand it))';
    expect(reconcileXpStatusLines([], [line])).toContain(line);
  });

  it('[s79 T4 | s79 Root C #5] travel receipts and ENGINE RESULT carry no broken dash bytes (whole run)', () => {
    expect(R.after(4).journey, 'replay sets out on T4').toBeTruthy();
    for (const n of R.turns()) {
      expect(R.receiptText(n), `T${n} receipts`).not.toMatch(MOJIBAKE);
      expect(R.packet(n), `T${n} packet`).not.toMatch(MOJIBAKE);
    }
  });

  // Retired multi lap 52: the place line is no longer cut ("Crown" is handed), so the replay no longer reaches the
  // recorded state (see docs/orders/multi-result-52.md; m52lap52.bank.ts proves the arrival names Contract Hall).
  it.skip('[s79 T19 | s79 Root E #6] the arrival beat names Contract Hall after its place line is cut', () => {
    expect(R.after(19).currentLocation, 'replay arrives at Contract Hall on T19').toBe('Contract Hall');
    expect(R.verdicts(19), 'the place line is still cut').toContain('place:capital');
    expect(R.prose(19)).toMatch(/Contract Hall/);
  });

  it('[s79 T14 | s79 Root D #7] the thugs on the stretch are on the REF ENUM and the mention list', () => {
    expect(R.after(14).journey?.encounter?.kind, 'replay meets the thugs on T14').toBe('thugs');
    expect(refRows(14).some((l) => /thugs/.test(l))).toBe(true);
    expect(mentions(14)).toMatch(/\bthugs\b/);
  });

  it('[s79 T2,T3 | s79 Root D #8] the granted tabard is kit, not a scene prop, once accepted', () => {
    expect(R.input(2), 'replay accepts the offer on T2').toBe('Accept the offer');
    expect((R.after(2).inventory ?? []).map((i) => i.name), 'tabard granted').toContain('visitor’s tabard');
    expect(refRows(3).filter((l) => /tabard/.test(l) && /\bprop\b/.test(l)), 'T3 REF ENUM').toEqual([]);
    expect(R.verdicts(2).filter((v) => /use-class:prop:tabard/.test(v)), 'T2 verdicts').toEqual([]);
  });

  it('[s79 T15 | s79 Root D #9] the fight\'s own loot is not a "Scene Manifest invent"', () => {
    expect(R.receiptText(15), 'replay wins the Fine Longsword on T15').toMatch(/Loot: \[Uncommon\] Fine Longsword/);
    expect(R.noteText(15)).not.toMatch(/Scene Manifest invent: Fine Longsword/);
  });

  // Retired multi lap 52: checks recorded writer prose that no packet change can alter (see docs/orders/multi-result-52.md).
  it.skip('[s79 T8,T17 | s79 Root D #10] carried items are not narrated as worn', () => {
    const worn = (n: number) => (R.before(n).inventory ?? []).filter((i) => i.equipped).map((i) => i.name);
    expect(worn(8), 'tabard is carried, not worn, on T8').not.toContain('visitor’s tabard');
    expect(worn(17), 'longsword is carried, not worn, on T17').not.toContain('Fine Longsword');
    expect(R.prose(8)).not.toMatch(/tabard over their clothes/);
    expect(R.prose(17)).not.toMatch(/Longsword hanging at their hip/);
  });

  it('[s79 T4,T14,T15 | s79 Root F #11] ALREADY ON THE PAGE holds the opener of the last beat (whole run)', () => {
    expect(R.after(14).journey, 'replay is on the road at T14').toBeTruthy();
    const turns = R.turns();
    for (const n of turns.slice(1)) {
      const prev = turns[turns.indexOf(n) - 1];
      const block = R.packetBlock(n, 'ALREADY ON THE PAGE');
      expect(block, `T${n} has the block`).not.toBe('');
      expect(block, `T${n} holds T${prev}'s opener`).toContain(R.prose(prev).slice(0, 40));
    }
  });

  it('[s79 T11,T12 | s79 Root G #12] travel out of a dungeon room starts from the hub, and the room is no place', () => {
    expect(R.input(12), 'replay travels out of the Undercroft room on T12').toBe('Travel toward Cathedral Close');
    expect(R.before(12).currentLocation ?? '', 'replay is inside the Undercroft').toMatch(/^Cathedral Undercroft/);
    expect(R.after(12).journey?.from).toBe('Cathedral Undercroft');
    for (const n of R.turns()) {
      for (const c of R.chips(n)) expect(c, `T${n}`).not.toMatch(/Stair Descent/);
      for (const p of R.after(n).places ?? []) expect(p.name, `T${n} place`).not.toMatch(/ — /);
    }
  });

  it('[s79 T11 | s79 Root G #13] the dungeon room is not named twice in the prose', () => {
    expect(R.input(11)).toBe('Enter Cathedral Undercroft');
    expect(R.receiptText(11), 'replay enters Stair Descent').toMatch(/Dungeon room: Stair Descent/);
    expect(R.prose(11)).not.toMatch(/Stair Descent[^.]*Cathedral Undercroft — Stair Descent/);
  });

  it('[s79 T18 | s79 Root H #14] raising a hand to greet gives nothing away', () => {
    expect(R.input(18)).toBe('Greet whoever is coming');
    expect(R.prose(18), 'replay T18 prose has the hand line').toMatch(/raised one hand and called out/);
    expect(R.after(18).sceneFacts?.givenAway ?? []).toEqual([]);
  });

  it('[s79 T1 | s79 Root I #15] the world_status opening page shows a scene, not the housing rules', () => {
    expect(R.before(2).systemHousing?.housing, 'replay housing is world_status').toBe('world_status');
    const page1 = R.steps[0].before.log.find((e) => e.role === 'gm')?.content ?? '';
    expect(page1, 'replay has an opening page').toMatch(/ledger stair/);
    expect(page1).not.toMatch(/Levels exist in the world/);
    expect(page1).not.toMatch(/a normal group can tell name, health, and one power pool/);
  });

  it('[s79 T2 | s79 Root I #16] the info sheet HERE block lists no "System:" line (whole run)', () => {
    expect(R.packet(2), 'T2 has an info sheet').toMatch(/\nHERE:\n/);
    for (const n of R.turns()) {
      const here = R.packet(n).match(/\nHERE:\n((?:- [^\n]*\n)*)/)?.[1] ?? '';
      expect(here, `T${n}`).not.toMatch(/^- System:/m);
    }
  });

  it('[s79 T2 | s79 #10 paintDisplay #18] a token opening a quote paints a capital article', () => {
    expect(R.input(2)).toBe('Accept the offer');
    expect(R.prose(2), 'Ila speaks about the tabard').toMatch(/tabard for the street/);
    expect(R.prose(2)).not.toMatch(/"the tabard/);
  });

  it('[s79 T15 | s79 #10 engineFight #19] the fight receipt agrees with a plural foe ("the thugs are down")', () => {
    expect(R.input(15)).toBe('Face the thugs');
    expect(R.receiptText(15), 'replay wins the fight').toMatch(/Fight: VICTORY vs the thugs/);
    expect(R.receiptText(15)).not.toMatch(/the thugs is down/);
    expect(R.packet(15)).not.toMatch(/the thugs is down/);
  });

  it('[s79 T2-T6 | s79 #10 placeAuthority #20] the ledger stair on the Palace Approach reads outdoor', () => {
    expect(R.after(2).currentLocation, 'replay starts on the stair').toBe(CARD_PLACE);
    for (const n of [2, 3, 5, 6]) {
      expect(R.after(n).sceneFacts?.cameraLock?.scale, `T${n} camera`).toBe('outdoor');
      expect(R.packet(n).match(/NOW:[^\n]*/)?.[0] ?? '', `T${n} NOW`).not.toMatch(/· indoor ·/);
    }
  });

  it('[s79 T2 | s79 #10 questPlay #21] the starter quest sits at the card place where its talk-stage giver stands', () => {
    expect(R.after(2).sceneFacts?.present ?? [], 'Ila is at the card place').toContain('Ila Pellane');
    const q = R.after(2).quests.find((x) => x.id === 'sp-quest-1');
    expect(q?.objectives?.some((o) => o.description === HEAR), 'starter has the talk stage').toBe(true);
    expect(q?.location).toBe(CARD_PLACE);
  });

  it('[s79 T3,T4 | s79 #10 storyChip #22] no "Return to X" chip for a place never visited (whole run)', () => {
    expect(R.visitedBefore(4).has('Cathedral Close'), 'Cathedral Close is unvisited before T4').toBe(false);
    for (const t of R.turns()) {
      const visited = R.visitedBefore(t);
      for (const c of R.chips(t)) {
        const m = c.match(/^Return to (.+)$/);
        if (m) expect(visited.has(m[1]), `T${t} chip "${c}"`).toBe(true);
      }
    }
  });

  // Retired multi lap 52: checks recorded writer prose that no packet change can alter (see docs/orders/multi-result-52.md).
  it.skip('[s79 T19 | s79 #10 writerInfoLayer #23] voice notes do not become looks on a beat with no speech', () => {
    expect(R.packet(19), 'T19 packet prints the voice notes').toMatch(/speaks: grave, restrained, unexpectedly gentle/);
    expect(R.prose(19), 'no speech on T19').not.toMatch(/"/);
    expect(R.prose(19)).not.toMatch(/grave, gentle stare/);
    expect(R.prose(19)).not.toMatch(/agile, teasing eye/);
  });

  it('[s79 T3,T5 | s79 #10 quest list off #25] no quest receipt prints while the quest list is off (whole run)', () => {
    expect(R.before(2).systemHousing?.parts?.quest_list, 'quest list is off').toBe(false);
    for (const n of R.turns()) expect(R.receipts(n).filter((l) => /^Quest:/.test(l)), `T${n}`).toEqual([]);
  });

  it('[s79 T5,T11,T15 | s79 #10 tester view #26] telemetry xpGained is the turn\'s whole XP gain (whole run)', () => {
    const paid = R.turns().filter((n) => xpGain(n) > 0);
    expect(paid, 'replay pays XP on the fight turn').toContain(15);
    for (const n of R.turns()) expect(R.at(n).telemetry.xpGained ?? 0, `T${n}`).toBe(xpGain(n));
  });

  it('[s79 T3 | s79 live #29] a stage direction ("Behind Ila") is not a Scene Manifest invent', () => {
    expect(R.prose(3), 'replay T3 prose has the line').toMatch(/Behind Ila, past the pike-guards/);
    expect(R.noteText(3)).not.toMatch(/Scene Manifest invent: Behind Ila/);
  });
});
