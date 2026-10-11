import { beforeAll, describe, expect, it, vi } from 'vitest';
import { filterInventedContextChoices } from '../../game/choiceWarden';
import { Replay, npc } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-10T23-51-52-084Z_summoned-pact_cold-system_s80';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const HOLD = 'a harbor circle in the hold of a Valespire grain-ship';
const HEAR = 'Hear their reason (or demand it)';
const CITY_HUBS = ['Lowmarket', 'West Wall', 'The Weighing Cup'];
const NAMED = /^[A-Z][a-z]+ [A-Z][a-z]+$/;

const named = (names: string[] = []) => names.filter((p) => NAMED.test(p));
const hearOpen = (n: number) =>
  R.before(n)
    .quests.find((q) => q.id === 'sp-quest-1')
    ?.objectives?.find((o) => o.description === HEAR)?.completed === false;
const quietLegs = () => R.turns().filter((n) => R.after(n).journey && !R.after(n).journey!.encounter);
const undercroftTurns = () => R.turns().filter((n) => (R.after(n).currentLocation ?? '').startsWith('Cathedral Undercroft'));
const presenceLines = (n: number) =>
  R.packet(n)
    .split('\n')
    .filter((l) => /^t\d+\s|may be about|Unnamed local/.test(l))
    .join('\n');

describe('replay bank s80', () => {
  it('[s80 T10 | s80 Root A] a named person who arrives in the scene is offered a talk chip on the next list', () => {
    const arrivals = R.turns().filter((n) => {
      const was = new Set(R.before(n).sceneFacts?.present ?? []);
      return !R.after(n).journey && named(R.after(n).sceneFacts?.present).some((p) => !was.has(p));
    });
    expect(arrivals, 'replay meets Nell Rudd and Col Thatch at Cathedral Close on T10').toContain(10);
    for (const n of arrivals) {
      const here = named(R.after(n).sceneFacts?.present);
      expect(
        R.chipsAfter(n).some((c) => /^(Talk to|Ask) /.test(c) && here.some((p) => c.includes(p))),
        `after T${n} (${here.join(', ')}): ${R.chipsAfter(n).join(' / ')}`
      ).toBe(true);
    }
  });

  it('[s80 T3-T8 | s80 Root A] at the card place with the talk step open, "Ask what they want" is offered', () => {
    const atHold = R.turns().filter((n) => n >= 4 && R.before(n).currentLocation === HOLD && !R.before(n).journey && hearOpen(n));
    expect(atHold.length, 'replay stands at the hold with "Hear their reason" open after T3').toBeGreaterThan(1);
    expect(
      atHold.some((n) => R.chips(n).includes('Ask what they want')),
      atHold.map((n) => `T${n}: ${R.chips(n).join(' / ')}`).join('\n')
    ).toBe(true);
  });

  it('[s80 T1 | s80 Root B] the card offer compiles (knife, oilskin, bunk) and page 1 offers Accept and Refuse', () => {
    const card = R.before(2).openingEstablishment?.card as { place?: string; offer?: { items?: string[]; accept?: string } } | undefined;
    expect(card?.place, 'replay opens on the grain-ship hold card').toBe(HOLD);
    expect(card?.offer?.items ?? []).toEqual(expect.arrayContaining(['knife', 'oilskin', 'bunk']));
    expect(card?.offer?.accept ?? '').toMatch(/kit you as crew/);
    expect(R.chips(2)).toEqual(expect.arrayContaining(['Accept the offer', 'Refuse the offer']));
  });

  it('[s80 T8 | s80 Root B] a verb clause from the card cast ("panicked when it worked") is never a person', () => {
    const card = R.before(2).openingEstablishment?.card as { place?: string; castNames?: string[] } | undefined;
    expect(card?.place, 'replay opens on the grain-ship hold card').toBe(HOLD);
    for (const name of card?.castNames ?? []) expect(name).not.toMatch(/^(panicked|already|or )\b/i);
    for (const n of R.turns()) expect(R.packet(n), `T${n}`).not.toMatch(/panicked when it worked/i);
  });

  it('[s80 T5 | s80 Root C] a quiet road list is only the journey chips, never padded with destination travel', () => {
    const quiet = quietLegs();
    expect(quiet, 'replay is on a quiet first leg after T5').toContain(5);
    for (const n of quiet) {
      expect(
        R.chipsAfter(n).filter((c) => /^(Travel toward|Return to|Go back to)\b/.test(c)),
        `after T${n}: ${R.chipsAfter(n).join(' / ')}`
      ).toEqual([]);
    }
  });

  it('[s80 T6 | s80 Root C] travelling toward a new place mid-road does not restart the trip from the ship', () => {
    expect(R.before(6).journey?.to, 'replay is on the road toward Cathedral Close before T6').toBe('Cathedral Close');
    expect(R.input(6)).toBe('Travel toward Contract Hall');
    expect(R.receiptText(6)).toMatch(/Contract Hall/);
    expect(R.receiptText(6)).not.toMatch(new RegExp(`(^|\\s)between ${HOLD} and Contract Hall`, 'm'));
  });

  it('[s80 T7 | s80 Root D] no "traveler" is handed to the writer in the hold or on a quiet stretch', () => {
    const turns = [...R.turns().filter((n) => R.after(n).currentLocation === HOLD && R.packet(n)), ...quietLegs().filter((n) => R.packet(n))];
    expect(turns, 'replay is back in the hold on T7').toContain(7);
    for (const n of turns) {
      expect(presenceLines(n), `T${n}`).not.toMatch(/traveler/i);
      expect(R.after(n).sceneFacts?.present ?? [], `T${n}`).not.toContain('a traveler');
    }
  });

  it('[s80 T14,T15 | s80 Root D] the crowd does not follow Jax onto quiet road legs or into the Undercroft', () => {
    const turns = [...quietLegs(), ...undercroftTurns()].filter((n) => R.packet(n));
    expect(quietLegs().length, 'replay has quiet road legs').toBeGreaterThan(0);
    expect(undercroftTurns().length, 'replay reaches Cathedral Undercroft').toBeGreaterThan(0);
    for (const n of turns) {
      expect(R.packet(n), `T${n} NOW line`).not.toMatch(/^NOW:.*crowd here/m);
      expect(R.packet(n), `T${n} HERE`).not.toMatch(/a crowd, nobody named/);
      expect(R.after(n).sceneFacts?.present ?? [], `T${n} present`).not.toContain('bystanders');
    }
  });

  it('[s80 T15,T16 | s80 Root E] the dungeon\'s own "Head back to the exit" chip is kept and offered inside Stair Descent', () => {
    expect(R.after(16).currentLocation ?? '', 'replay enters Stair Descent on T16').toMatch(/Stair Descent/);
    expect(filterInventedContextChoices(['Head back to the exit'], R.after(16))).toEqual(['Head back to the exit']);
    expect(R.chipsAfter(16)).toContain('Head back to the exit');
  });

  it('[s80 T4 | s80 Root F] the grain-ship hold does not take the city hubs as its exits', () => {
    expect(R.after(4).currentLocation, 'replay is in the hold on T4').toBe(HOLD);
    const card = (R.after(4).places ?? []).find((p) => p.name === HOLD) as { exits?: string[] } | undefined;
    for (const hub of CITY_HUBS) expect(card?.exits ?? [], 'hold place card exits').not.toContain(hub);
    const placesLine = R.packet(4).match(/^PLACES: .*$/m)?.[0] ?? '';
    for (const hub of CITY_HUBS) expect(placesLine).not.toContain(hub);
  });

  it('[s80 T3 | s80 Root G] a search outside a dungeon has an engine result before the writer', () => {
    expect(R.input(3)).toBe('Search the area');
    expect(R.before(3).currentLocation, 'replay searches the hold on T3').toBe(HOLD);
    expect(R.receiptText(3)).toMatch(/^Search: /m);
    expect(R.packet(3)).toMatch(/ENGINE RESULT[^\n]*\n?[^\n]*Search: /);
  });

  it('[s80 T15,T16 | s79 Root G (s80 failure 8)] the descent into the Undercroft is told once, not on arrival and again on Enter', () => {
    expect(R.after(15).currentLocation, 'replay arrives at Cathedral Undercroft on T15').toBe('Cathedral Undercroft');
    expect(R.input(16)).toBe('Enter Cathedral Undercroft');
    const descends = (n: number) => /took the steps|steps led down|bottom of the stair|counted each step down/i.test(R.prose(n));
    expect(descends(15) && descends(16), `T15: ${R.prose(15)}\nT16: ${R.prose(16)}`).toBe(false);
  });

  it('[s80 T5 | s80 small owner choiceRanking.storyChip] no "Return to" a place never visited, and no chip toward the trip\'s own destination', () => {
    for (const n of R.turns()) {
      const visited = R.visitedBefore(n);
      for (const c of R.chips(n)) {
        const m = c.match(/^(?:Return to|Go back to) (.+)$/);
        if (m) expect(visited.has(m[1]), `T${n} chip "${c}"`).toBe(true);
      }
      const to = R.before(n).journey?.to;
      if (to) expect(R.chips(n), `T${n} on the road toward ${to}`).not.toContain(`Return to ${to}`);
      if (to) expect(R.chips(n), `T${n} on the road toward ${to}`).not.toContain(`Travel toward ${to}`);
    }
  });

  it('[s80 T1 | s80 small owner sandboxXp] "Ask the world" (a status chip, nobody addressed) pays no social track', () => {
    expect(R.input(2), 'replay plays "Ask the world" on T2').toBe('Ask the world');
    expect(R.receiptText(2)).not.toMatch(/Social track/);
  });

  it('[s80 T10 | s80 AI output] Jax (name locked) is not "a stranger with no name"', () => {
    expect(R.after(10).currentLocation, 'replay arrives at Cathedral Close on T10').toBe('Cathedral Close');
    expect(R.prose(10)).not.toMatch(/no name/i);
  });

  it('[s80 T11 | s80 AI output] after Nell and Col both spoke to Jax, they are not "yet to notice" Jax', () => {
    expect(R.before(11).currentLocation, 'replay waits at Cathedral Close on T11').toBe('Cathedral Close');
    expect(R.prose(11)).not.toMatch(/(neither of them|had(n't| not)) (had )?noticed Jax/i);
  });

  it('[s80 T20 | s80 AI output] the road to Contract Hall is not "toward the west wall"', () => {
    expect(R.after(20).journey?.to, 'replay sets out for Contract Hall on T20').toBe('Contract Hall');
    expect(R.prose(20)).not.toMatch(/toward the west wall/i);
  });

  it('[s80 T16 | s80 small owner persona roll] Cutha Dunmore\'s persona agrees with the antagonist role', () => {
    const sheet = (npc(R.after(16), 'Cutha Dunmore') as { sheet?: { job?: string; speech?: string; motive?: string } } | undefined)?.sheet;
    expect(sheet, 'replay meets Cutha Dunmore in Stair Descent').toBeTruthy();
    if (sheet?.job === 'antagonist') {
      expect(sheet.motive ?? '').not.toMatch(/lift others' spirits/i);
      expect(sheet.speech ?? '').not.toMatch(/trusting/i);
    }
  });

  it('[s80 T3 | s80 no owner] no quest receipt prints while the quest list is off', () => {
    const parts = (R.before(2).systemHousing as { parts?: Record<string, boolean> } | undefined)?.parts;
    expect(parts?.quest_list, 'replay housing has the quest list off').toBe(false);
    for (const n of R.turns()) expect(R.receiptText(n), `T${n}`).not.toMatch(/^Quest: /m);
  });
});
