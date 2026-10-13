/**
 * tt-build-6a — exploration rules (varied DCs, light and vision, travel pace), from the real cursed-keep ds151 tape.
 *
 * T4 "Search the area" and T7 "Travel toward Greyhollow Inn" are at Keep Gate at night; T10 "Face the thugs" is on the
 * back streets at dawn with the trip underway; T13 "Face the dead" is three zombies on the graveyard road; T18 is
 * Mira's Apothecary, a lit room. Each case uses a step 1 ready-made sheet and stamps the table rules from Settings the
 * way a turn does. Dice are pinned with a fixed Math.random.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { commitOfferedPad } from '../../game/playTranscript';
import { beginTabletopCreation, creationChips, stepTabletopCreation, tabletopCreationPending } from '../../game/tabletop/creationFlow';
import { resolveCheckContext, runPlayerCheck } from '../../game/checkMath';
import { parsePlayerIntent } from '../../game/intentParser';
import { advanceClock, commitTravel } from '../../game/travelJourney';
import { withHouseRules, tableRulesLine } from '../../game/rules/houseRules';
import { ladderDc, sceneLight } from '../../game/rules/exploration';
import { hoursAtPace, travelPaceOf } from '../../game/rules/travelPace';
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
/** A built character: the named picks, then the first offered chip at each later step (the default answer). */
function built(n: number, picks: string[]): GameState {
  let s = walk(beginTabletopCreation(ruled(T.before(n))), picks);
  for (let i = 0; i < 12 && tabletopCreationPending(s); i++) s = stepTabletopCreation(s, creationChips(s)[0]);
  return ruled(s);
}
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);
/** The same character with no light in the pack (a coin start, or the pack left behind). */
const unlit = (s: GameState): GameState => ({ ...s, inventory: (s.inventory ?? []).filter((i) => !/\bpack\b|torch|lamp|lantern|candle/i.test(i.name)) });
const check = (s: GameState, input: string) => runPlayerCheck(s, parsePlayerIntent(input, s), input);
const ctx = (s: GameState, input: string) => resolveCheckContext(s, parsePlayerIntent(input, s), input);

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { state: commitOfferedPad(arc.state), status: formatArcStatusReceipts(arc) };
}
const round = (status: string[], n: number) => status.find((l) => l.startsWith(`Round ${n} — `)) ?? '';

describe('replay bank tt-build-6a (exploration rules)', () => {
  it('[tabletop ds151 T4 | tt-build-6a] varied DCs: each task sits on the SRD ladder, and GM Strictness shifts it', () => {
    const s = pregen(4, 'Human Fighter (Soldier)');
    expect(T.input(4)).toBe('Search the area');
    expect(ctx(s, T.input(4))).toMatchObject({ label: 'Investigation', dc: 15, rung: 'medium' });
    expect(ctx(s, 'Look around')).toMatchObject({ label: 'Perception', dc: 10, rung: 'easy' });
    expect(ctx(s, 'Pick the lock on the gate')).toMatchObject({ dc: 15, rung: 'medium' });
    expect(ctx(s, 'Climb the gate')).toMatchObject({ label: 'Athletics', dc: 15, rung: 'medium' });
    expect(ctx(s, 'Persuade the guard to let me pass')).toMatchObject({ dc: 10, rung: 'easy' });
    expect(ctx(s, 'Persuade the guard to lend me gold')).toMatchObject({ dc: 15, rung: 'medium' });
    // GM Strictness moves the whole ladder by the shared difficulty table's shift.
    expect(ctx({ ...s, gmStrictness: 'hardcore' }, T.input(4)).dc).toBe(17);
    expect(ctx({ ...s, gmStrictness: 'forgiving' }, 'Look around').dc).toBe(8);
    // The rung is on the roll the player sees.
    dice(0.5);
    expect(check(s, T.input(4)).displayLine).toMatch(/^Investigation \(medium\) d20 \(11\) .* vs DC 15 — (success|failure)$/);
    // tt-build-7: a tabletop save with no sheet sits on the same ladder.
    expect(ctx(T.before(4), T.input(4))).toMatchObject({ dc: 15, rung: 'medium' });
  });

  it('[tabletop ds151 T13 | tt-build-6a] dangerous ground makes a physical task one rung harder', () => {
    const s = pregen(13, 'Human Fighter (Soldier)');
    expect(s.journey!.areaTier).toBe(2);
    expect(ctx(s, 'Climb the graveyard wall')).toMatchObject({ dc: 15, rung: 'medium' });
    const wild: GameState = { ...s, journey: { ...s.journey!, areaTier: 3 } };
    expect(ctx(wild, 'Climb the graveyard wall')).toMatchObject({ dc: 20, rung: 'hard' });
    expect(ctx(wild, 'Sneak past the dead')).toMatchObject({ dc: 20, rung: 'hard' });
    // Looking is not a physical task: the ground leaves it alone.
    expect(ctx(wild, 'Search the graves')).toMatchObject({ dc: 15, rung: 'medium' });
  });

  it('[tabletop ds151 T4 | tt-build-6a] light at Keep Gate at night: a torch from the pack, Darkvision, or no roll at all', () => {
    const fighter = pregen(4, 'Human Fighter (Soldier)');
    expect(fighter.sceneFacts!.timeOfDay).toBe('night');
    expect(sceneLight(fighter)).toMatchObject({ ambient: 'dark', lit: 'torch', seen: 'bright' });
    dice(0.5);
    expect(check(fighter, 'Look around').displayLine).toMatch(/^Perception \(easy\) d20 \(11\) /);
    // The same soldier with no light: darkness, Blinded for sight, no roll.
    const dark = check(unlit(fighter), 'Look around');
    expect(dark.displayLine).toBe("Perception (easy; darkness at night, you can't see): no roll — failure");
    expect(dark.isSuccess).toBe(false);
    // Searching by hand still rolls.
    expect(check(unlit(fighter), T.input(4)).displayLine).toMatch(/^Investigation \(medium\) d20 \(11\)/);
    // The Cleric's Light cantrip lights the gate with no torch.
    expect(sceneLight(unlit(pregen(4, 'Dwarf Cleric (Acolyte)')))).toMatchObject({ ambient: 'dark', lit: 'Light cantrip', seen: 'bright' });
    // A Dwarf Fighter sees darkness as dim light: Disadvantage, not a blind fail.
    const dwarf = unlit(built(4, ['Build my own', 'Fighter', 'Dwarf', 'Soldier']));
    expect(dwarf.character.srd!.speciesId).toBe('dwarf');
    expect(sceneLight(dwarf)).toMatchObject({ ambient: 'dark', lit: null, seen: 'dim', darkvision: 120 });
    expect(check(dwarf, 'Look around').displayLine).toMatch(/^Perception \(easy; darkness at night, dim by Darkvision\) d20 \(dis: 11, 11\) /);
  });

  it('[tabletop ds151 T10 + T9 | tt-build-6a] dawn is dim light; a lit room is bright at any hour', () => {
    const road = unlit(pregen(10, 'Human Fighter (Soldier)'));
    expect(road.sceneFacts!.timeOfDay).toBe('dawn');
    dice(0.5);
    expect(check(road, 'Look around').displayLine).toMatch(/^Perception \(easy; dim light at dawn\) d20 \(dis: 11, 11\) /);
    const inn = unlit(pregen(9, 'Human Fighter (Soldier)'));
    expect(inn.currentLocation).toBe('Greyhollow Inn');
    expect(sceneLight(inn)).toMatchObject({ ambient: 'bright', why: 'in a lit room' });
    const night = advanceClock(inn, 17).state;
    expect(night.sceneFacts!.timeOfDay).toBe('night');
    expect(sceneLight(night)).toMatchObject({ ambient: 'bright', why: 'in a lit room' });
    expect(check(night, 'Look around').displayLine).toMatch(/^Perception \(easy\) d20 \(11\) /);
  });

  it('[tabletop ds151 T13 | tt-build-6a] a fight in the dark: with no light you are Blinded and the zombies see by Darkvision; a torch lights the fight', () => {
    const s = pregen(13, 'Human Fighter (Soldier)');
    const night = (x: GameState) => advanceClock(x, 15).state;
    dice(0.5);
    const blind = turn(night(unlit(s)), T.input(13));
    expect(blind.status).toContain('Light: darkness at night — you are Blinded (your attacks Disadvantage, attacks on you Advantage); the restless dead see by Darkvision');
    const r1 = round(blind.status, 1);
    expect(r1).toMatch(/you Greatsword d20 \(dis: 11, 11\) 11 /);
    expect(r1).toMatch(/Zombie \d Slam d20 \(adv: 11, 11\) 11 /);
    vi.restoreAllMocks();
    dice(0.5);
    const torch = turn(night(s), T.input(13));
    expect(torch.status).toContain('Light: darkness at night — your torch lights the fight');
    expect(round(torch.status, 1)).toMatch(/you Greatsword d20 11 /);
    // In daylight (the recorded morning) there is no light line.
    vi.restoreAllMocks();
    dice(0.5);
    expect(turn(unlit(s), T.input(13)).status.some((l) => l.startsWith('Light:'))).toBe(false);
  });

  it('[tabletop ds151 T10 | tt-build-6a] bandits in the dark with no light: both sides are Blinded, so the rolls cancel to normal', () => {
    const s = unlit(pregen(10, 'Human Fighter (Soldier)'));
    dice(0.5);
    const r = turn(advanceClock(s, 16).state, T.input(10));
    expect(r.status).toContain('Light: darkness at night — you are Blinded (your attacks Disadvantage, attacks on you Advantage); the thugs are Blinded');
    expect(round(r.status, 1)).toMatch(/you Greatsword d20 11 /);
    expect(round(r.status, 1)).toMatch(/Bandit \d Scimitar d20 11 /);
  });

  it('[tabletop ds151 T7 | tt-build-6a] travel pace: Fast is 4 miles an hour, Slow is 2; the receipt names the pace', () => {
    expect(T.input(7)).toBe('Travel toward Greyhollow Inn');
    const s = pregen(7, 'Human Fighter (Soldier)');
    const go = (over: Partial<Settings>) => {
      vi.restoreAllMocks();
      dice(0.99); // a quiet stretch
      return commitTravel(ruled(s, over), T.input(7));
    };
    const normal = go({});
    expect(normal.receipt).toMatch(/^Travel: open road between Keep Gate and Greyhollow Inn — leg 1 of 2 — \+2h, now night/);
    const fast = go({ ttTravelPace: 'fast' });
    expect(fast.receipt).toMatch(/^Travel: open road between Keep Gate and Greyhollow Inn at a fast pace — leg 1 of 2 — \+1\.5h, now night/);
    expect(fast.state.journey!.hoursPerLeg).toBe(1.5);
    const slow = go({ ttTravelPace: 'slow' });
    expect(slow.receipt).toMatch(/at a slow pace — leg 1 of 2 — \+3h, now dawn/);
    expect(tableRulesLine(ruled(s, { ttTravelPace: 'slow' }))).toContain('Travel pace: slow');
  });

  it('[tabletop ds151 T10 + T18 | tt-build-6a] pace on the road: Normal hampers Stealth, Slow helps Perception, Fast hampers both; off the road it does nothing', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    expect(s.journey!.legsDone).toBeLessThan(s.journey!.legsTotal);
    dice(0.5);
    expect(check(ruled(s), 'Sneak past them').displayLine).toMatch(/^Stealth \(medium; normal pace\) d20 \(dis: 11, 11\) /);
    expect(check(ruled(s, { ttTravelPace: 'slow' }), 'Look around').displayLine).toMatch(/^Perception \(easy; slow pace\) d20 \(adv: 11, 11\) /);
    expect(check(ruled(s, { ttTravelPace: 'fast' }), 'Look around').displayLine).toMatch(/^Perception \(easy; fast pace\) d20 \(dis: 11, 11\) /);
    const shop = pregen(18, 'Human Fighter (Soldier)');
    expect(check(ruled(shop, { ttTravelPace: 'fast' }), 'Sneak past them').displayLine).toMatch(/^Stealth \(medium\) d20 \(11\) /);
  });

  it('[tt-build-6a guard] LitRPG and story RPG use the shared DC ladder with no rung, light or pace notes, and map travel times', () => {
    const loud = settings({ ttTravelPace: 'fast' });
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      const stamped = withHouseRules(st, loud);
      expect(stamped).toBe(st);
      expect(travelPaceOf(stamped)).toBe('normal');
      expect(hoursAtPace({ ...stamped, houseRules: { ...(stamped.houseRules ?? {}), travelPace: 'fast' } as never }, 2)).toBe(2);
      const atNight = advanceClock(stamped, 14).state;
      // tt-build-7: the same ladder as tabletop (Strictness shift included); the rung stays off the roll line.
      expect(ctx(atNight, 'Search the area')).toMatchObject({ dc: ladderDc('medium', atNight.gmStrictness), rung: 'medium' });
      expect(ctx(atNight, 'Look around')).toMatchObject({ dc: ladderDc('easy', atNight.gmStrictness), rung: 'easy' });
      dice(0.5);
      const line = check(atNight, 'Look around').displayLine ?? '';
      expect(line).not.toMatch(/darkness|dim light|pace|easy|medium/);
      vi.restoreAllMocks();
    }
  });
});
