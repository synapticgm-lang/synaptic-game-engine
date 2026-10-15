/**
 * tt-travel — the travel day, from the real cursed-keep ds151 tape. T19 "Travel toward Blackspine Treeline" leaves
 * Mira's Apothecary on a forest path (2 stretches, no road: the guide must find the way); T7 "Travel toward Greyhollow
 * Inn" is the back streets, which are not a travel day. The day roll (weather, jobs), getting lost, the night camp
 * (watches, rations, SRD long rest), Extended Travel and the writer's beat facts come from the travel engine before
 * the writer.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { beginTabletopCreation, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import { commitTravel, dayIsSpent, journeyPads, travelBeatFact, worldClock } from '../../game/travelJourney';
import { movementFact } from '../../game/completedEventPacket';
import { withHouseRules } from '../../game/rules/houseRules';
import { createDefaultSettings } from '../../game/defaults';
import type { GameState, Settings } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const settings = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), ...over });
const ruled = (s: GameState, over: Partial<Settings> = {}) => withHouseRules(s, settings(over));
const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
const pregen = (n: number, pick: string, over: Partial<Settings> = {}) =>
  ruled(walk(beginTabletopCreation(ruled(T.before(n), over)), [`Ready-made: ${pick}`, 'Begin play']), over);
const JOB = /^(Keep lookout|Forage as you go|Lead the way)$/;

describe('replay bank tt-travel (the travel day)', () => {
  it('[tabletop ds151 T19 | tt-travel] setting out on the forest path rolls the day: weather, and the guide finds the way or loses it', () => {
    expect(T.input(19)).toBe('Travel toward Blackspine Treeline');
    const shown = T.receipts(19);
    expect(shown.some((l) => /^Travel: forest path between Mira's Apothecary and Blackspine Treeline — leg 1 of 3/.test(l))).toBe(true);
    expect(shown.some((l) => /^Weather: /.test(l))).toBe(true);
    expect(shown.some((l) => /^Navigation: Wisdom \(Survival\) d20 .* vs DC 15 /.test(l))).toBe(true);
    const out = commitTravel(pregen(19, 'Human Fighter (Soldier)'), T.input(19));
    const j = out.state.journey!;
    expect(j.terrain).toBe('forest');
    expect(j.day).toBe(1);
    expect(j.jobs?.guide).toBe('you');
    expect(j.jobResults?.guide).toBeTypeOf('boolean');
    if (j.jobResults?.guide === false) {
      expect(j.lost).toBe(true);
      // The forest path is 2 stretches; lost, it runs a third (the tape's "leg 1 of 3").
      expect(j.lostLegs).toBe(1);
      expect(j.legsTotal).toBe(3);
      expect(travelBeatFact(out.state)).toMatch(/lost the way/);
    }
    if (j.encounter) {
      expect(j.encounter.want).toBeTruthy();
      expect(j.encounter.distanceFt).toBeGreaterThan(0);
    }
    // The writer is told what happened on the road, never asked to call for a roll.
    const fact = movementFact(out.state);
    expect(fact).toMatch(/forest path between Mira's Apothecary and Blackspine Treeline/);
    expect(fact).not.toMatch(/what do you do|roll (a|for)/i);
  });

  it('[tabletop ds151 T19 | tt-travel] a night camp in the trees: the watches, a day of rations, the SRD long rest', () => {
    const s = pregen(19, 'Human Fighter (Soldier)');
    let camped = null as ReturnType<typeof commitTravel> | null;
    for (let i = 0; i < 40 && !camped; i++) {
      const out = commitTravel({ ...s, seed: `${s.seed ?? ''}-camp-${i}` }, T.input(19));
      const j = out.state.journey;
      if (!j || j.encounter) continue;
      const evening: GameState = { ...out.state, roadDay: { since: worldClock(out.state), hours: 8 } };
      expect(dayIsSpent(evening, evening.journey!)).toBe(true);
      expect(journeyPads(evening)[0]).toBe('Make camp');
      expect(journeyPads(evening)[1]).toMatch(/^Push on into the \w+, but each failed save wears you down more$/);
      const c = commitTravel(evening, 'Make camp');
      if (c.event === 'camp') camped = c;
    }
    expect(camped).not.toBeNull();
    const extra = camped!.extra ?? [];
    expect(extra[0]).toMatch(/^Camp: /);
    expect(extra.some((l) => /^Rations: /.test(l))).toBe(true);
    expect(extra.some((l) => /^Rest: long rest/.test(l))).toBe(true);
    expect(camped!.state.journey!.day).toBe(2);
    expect(travelBeatFact(camped!.state)).toMatch(/made camp/);
  });

  it('[tabletop ds151 T19 | tt-travel] pushing on past 8 hours is SRD Extended Travel: a Constitution save each hour', () => {
    const out = commitTravel(pregen(19, 'Human Fighter (Soldier)'), T.input(19));
    const j = out.state.journey!;
    const late: GameState = { ...out.state, roadDay: { since: worldClock(out.state), hours: 8 }, journey: { ...j, encounter: null } };
    const pushed = commitTravel(late, 'Push on through the night');
    expect((pushed.extra ?? []).some((l) => /^Extended Travel: Constitution save/.test(l))).toBe(true);
  });

  it('[tabletop ds151 T7 | tt-travel, q31-B] the replay reaches the tape\'s own T7 trip; back streets offer no road jobs and no camp', () => {
    expect(T.input(7)).toBe('Travel toward Greyhollow Inn');
    expect(T.receipts(7).some((l) => /^Travel: open road between Keep Gate and Greyhollow Inn/.test(l))).toBe(true);
    const s = T.after(7);
    const streets = { ...s.journey!, ground: 'Back streets', terrain: 'streets' as const, hoursPerLeg: 0.5, encounter: null };
    const pads = journeyPads({ ...s, currentLocation: 'Back streets', journey: streets });
    expect(pads.some((p) => JOB.test(p) || /^Make camp$/.test(p))).toBe(false);
  });
});
