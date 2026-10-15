/**
 * tt-fix-17 — playability roots from lap 21:
 * 1. an engine chip is never read as a claim of gear the PC lacks ("Cast Fire Bolt" is not "fire a bolt") (lap 21 E1);
 * 2. a long rest removes a march Exhaustion level unless Malnutrition is on (SRD 5.2.1; the engine's STARVE_DAYS) (E2);
 * 3. the day's food is the day's, not the trip's: a forage on one trip feeds that night's camp on the next (E3);
 * 4. the wildlife chip settles the meeting and hands the writer what happened (E5);
 * 5. a hit that deals no damage is told as no harm, not "wounded" (E4).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, journeyPads, travelBeatFact, worldClock } from './travelJourney';
import { groundPlayerAction } from './intentParser';
import { combatFacts } from './rules/combatPresenter';
import type { GameState, RoadEncounter } from './types';

function keepState(seed: string, over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    turn: 9,
    inventory: [],
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
    ...over,
  } as GameState;
}

/** A started trip with no meeting live and `roadHours` already walked today. */
function quietTrip(seed: string, roadHours: number, over: Partial<GameState> = {}): GameState {
  for (let i = 0; i < 200; i++) {
    const t = commitTravel(keepState(`${seed}-${i}`, over), 'Travel toward Blackspine Treeline');
    const j = t.state.journey;
    if (!j || j.encounter || j.legsDone >= j.legsTotal - 1) continue;
    return { ...t.state, roadDay: { since: worldClock(t.state), hours: roadHours } };
  }
  throw new Error('no quiet trip');
}

function campUnbroken(seed: string, over: Partial<GameState>) {
  for (let i = 0; i < 80; i++) {
    const s = { ...quietTrip(`${seed}-${i}`, 10), ...over };
    const c = commitTravel(s, 'Make camp');
    if (c.event === 'camp') return c;
  }
  throw new Error('every camp broken');
}

describe('1 — an engine chip is not a missing-item claim', () => {
  const s = keepState('bolt', { turn: 20, inventory: [{ id: 'q', name: 'Quarterstaff', rarity: 'Common', quantity: 1, equipped: true }] });

  it('"Cast Fire Bolt" off this turn\'s pad reaches the round as cast (lap 21 A T20)', () => {
    const offered = { ...s, offeredPad: { turn: 20, choices: ['Attack with the Quarterstaff', 'Cast Fire Bolt', 'Flee'] } };
    const g = groundPlayerAction('Cast Fire Bolt', offered);
    expect(g.rewritten).toBe(false);
    expect(g.text).toBe('Cast Fire Bolt');
  });

  it('a stale pad from another turn does not vouch for the line', () => {
    const stale = { ...s, offeredPad: { turn: 19, choices: ['Cast Fire Bolt'] } };
    expect(groundPlayerAction('Cast Fire Bolt', stale).rewritten).toBe(true);
  });
});

describe('2 — a long rest and march exhaustion', () => {
  it('one hungry day does not keep march exhaustion (lap 21 A T13, B T19, C T13, F T13)', () => {
    const c = campUnbroken('hungry', { character: { ...keepState('x').character, exhaustion: 2 }, daysWithoutFood: 0 });
    expect(c.state.daysWithoutFood).toBe(1);
    expect(c.state.character.exhaustion).toBe(1);
    expect((c.extra ?? []).some((l) => /Exhaustion: level 2 → 1/.test(l))).toBe(true);
  });

  // q31-N (SRD 5.2.1 p.185, p.181): Malnutrition holds only the levels it caused; a march level still comes off.
  it('1 march level + 1 Malnutrition level (the fifth day): a Long Rest leaves 1', () => {
    const c = campUnbroken('starving', { character: { ...keepState('x').character, exhaustion: 1 }, daysWithoutFood: 4 });
    expect(c.state.daysWithoutFood).toBe(5);
    expect(c.state.character.malnutritionExhaustion).toBe(1);
    expect(c.state.character.exhaustion).toBe(1);
    expect((c.extra ?? []).some((l) => /Exhaustion: level 2 → 1/.test(l))).toBe(true);
  });

  it('only Malnutrition levels left: the Long Rest keeps them', () => {
    const c = campUnbroken('starved', { character: { ...keepState('x').character, exhaustion: 1, malnutritionExhaustion: 1 }, daysWithoutFood: 5 });
    expect(c.state.character.malnutritionExhaustion).toBe(2);
    expect(c.state.character.exhaustion).toBe(2);
    expect((c.extra ?? []).some((l) => /stays \(malnutrition\)/.test(l))).toBe(true);
  });

  it('after a full day\'s food the next Long Rest removes the Malnutrition level', () => {
    const rations = [{ id: 'r', name: 'Rations (2 days)', rarity: 'Common' as const, quantity: 1 }];
    const c = campUnbroken('fed', { character: { ...keepState('x').character, exhaustion: 1, malnutritionExhaustion: 1 }, daysWithoutFood: 5, inventory: rations });
    expect(c.state.daysWithoutFood).toBe(0);
    expect(c.state.character.malnutritionExhaustion ?? 0).toBe(0);
    expect(c.state.character.exhaustion).toBe(0);
  });
});

describe('3 — the day\'s food belongs to the day', () => {
  it('a forage on one trip feeds the camp of a later trip the same day (lap 21 A T8 → T13)', () => {
    let fed: GameState | null = null;
    for (let i = 0; i < 80 && !fed; i++) {
      const s = quietTrip(`forage-${i}`, 2);
      const out = commitTravel(s, 'Forage as you go');
      if (out.state.roadDay?.fed) fed = out.state;
    }
    expect(fed).not.toBeNull();
    let camp: ReturnType<typeof commitTravel> | null = null;
    for (let i = 0; i < 80 && !camp; i++) {
      const next = commitTravel({ ...fed!, seed: `next-${i}`, journey: null, currentLocation: 'Keep Gate' }, 'Travel toward Blackspine Treeline');
      if (!next.state.journey || next.state.journey.encounter) continue;
      expect(next.state.roadDay?.fed).toBe(true);
      expect(journeyPads(next.state)).not.toContain('Forage as you go');
      const c = commitTravel(next.state, 'Make camp');
      if (c.event === 'camp') camp = c;
    }
    expect(camp).not.toBeNull();
    expect(camp!.extra ?? []).toContain('Rations: none eaten (foraged food)');
    expect(camp!.state.daysWithoutFood).toBe(0);
  });
});

describe('4 — the wildlife chip settles the meeting', () => {
  it('"Deal with the animal in the trees" closes the meeting with a fact (lap 21 A T14)', () => {
    const s = quietTrip('animal', 2);
    const encounter: RoadEncounter = { kind: 'wildlife', level: 2, stretch: s.journey!.legsDone, dangerous: false, want: 'food and nothing more' };
    const at = { ...s, journey: { ...s.journey!, encounter } };
    const chip = journeyPads(at).find((p) => /^Deal with/.test(p))!;
    expect(chip).toBeTruthy();
    const out = commitTravel(at, chip);
    expect(out.outcome).toBe('slipped away');
    expect(out.state.journey!.encounter!.escaped).toBe(true);
    expect(travelBeatFact(out.state)).toBe('You gave the animal room, and it went its own way.');
    expect(journeyPads(out.state)).not.toContain(chip);
  });
});

describe('5 — a hit for no damage', () => {
  const hit = { round: 1, k: 'attack' as const, attacker: 'Jax', target: 'Cave Spider', with: 'Spear', d20s: [15], kept: 15, adv: 'normal' as const, mod: 3, total: 18, ac: 14, hit: true, crit: false, nat1: false, pc: true, maxHp: 13 };

  it('is no harm, not "wounded" (lap 21 E T8)', () => {
    expect(combatFacts([{ ...hit, dealt: 0, hpBefore: 13, hpAfter: 13 }], 'Jax')[0]).toBe('You hit Cave Spider with your spear; it takes no harm.');
    expect(combatFacts([{ ...hit, dealt: 3, hpBefore: 13, hpAfter: 10 }], 'Jax')[0]).toBe('You hit Cave Spider with your spear; it is wounded.');
  });
});
