/**
 * 29x — rare spawns, camp mini-boss, auto-player stall rules. No live GM call. Mid writer OFF.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { compileChoices } from './choiceCompiler';
import { resolveEngineFight } from './engineFight';
import { profileForEncounter, rollLoot } from './lootTableRegistry';
import { mulberry32 } from './fatePick';
import { applyAutoPlayerStallRules } from './choiceRanking';
import {
  RARE_SPAWN_CHANCE,
  commitTravel,
  journeyPads,
  roadEncounterLevel,
  roadFoe,
  rollRoadEncounter,
  type StretchContext,
} from './travelJourney';
import type { EngineMode, GameState, RoadEncounter } from './types';

function keepState(seed: string, level = 1, mode: EngineMode = 'dnd'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    seed,
    engineMode: mode,
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    quests: [],
    character: { ...s.character, level },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

function ctx(over: Partial<StretchContext>): StretchContext {
  return { terrain: 'road', haunted: false, areaTier: 1, stretch: 1, legsTotal: 2, quietStretches: 0, ...over };
}

/** A state on the ground between two places, with this stretch's meeting forced. */
function onGround(enc: Partial<RoadEncounter>, mode: EngineMode = 'dnd', seed = 'ground'): GameState {
  const trip = commitTravel(keepState(seed, 1, mode), 'Travel toward Blackspine Treeline').state;
  const j = trip.journey!;
  const level = roadEncounterLevel(trip, j.areaTier ?? 1);
  return {
    ...trip,
    journey: { ...j, encounter: { kind: 'thugs', level, stretch: j.legsDone, dangerous: false, ...enc } },
  };
}

function seededRandom(seed: number) {
  const rng = mulberry32(seed);
  return vi.spyOn(Math, 'random').mockImplementation(rng);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('29x stamps', () => {
  it('HUD and BUILD are 2026-09-29z9f and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-29z9f');
    expect(BUILD_STAMP).toBe('2026-09-29z9f');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29x — rare spawn', () => {
  it('is uncommon: only hostile meetings, only under the rare roll', () => {
    const thugs = ctx({ terrain: 'streets' });
    const kindRoll = 2 / 3 + 0.01; // streets pool: traveler, meeting, thugs
    expect(rollRoadEncounter(thugs, 2, 0, kindRoll, RARE_SPAWN_CHANCE / 2)?.rare).toBe(true);
    expect(rollRoadEncounter(thugs, 2, 0, kindRoll, 0.5)?.rare).toBeUndefined();
    expect(rollRoadEncounter(thugs, 2, 0, 0, 0)?.kind).toBe('traveler');
    expect(rollRoadEncounter(thugs, 2, 0, 0, 0)?.rare).toBeUndefined();
    expect(rollRoadEncounter(ctx({ terrain: 'forest' }), 2, 0, 0, 0)?.rare).toBeUndefined();

    const trips = Array.from({ length: 400 }, (_, i) =>
      commitTravel(keepState(`rare-${i}`), 'Travel toward Greyhollow Graveyard')
    );
    const hostile = trips.map((t) => t.state.journey?.encounter).filter((e) => e && e.kind === 'undead');
    const rare = hostile.filter((e) => e!.rare).length;
    expect(hostile.length).toBeGreaterThan(40);
    expect(rare).toBeGreaterThan(0);
    expect(rare / hostile.length).toBeLessThan(0.3);
    const hit = trips.find((t) => t.state.journey?.encounter?.rare);
    expect(hit!.receipt).toMatch(/chance meeting: rare spawn, the restless dead \(level \d+\)/);
  });

  it('facing it opens a live fight, a little tougher than the ordinary foe, at the area level', () => {
    const s = onGround({ kind: 'thugs', rare: true });
    const enc = s.journey!.encounter!;
    expect(journeyPads(s)).toContain('Face the thugs');
    const faced = commitTravel(s, 'Face the thugs');
    const foe = faced.state.activeEncounter!;
    expect(foe).toBeTruthy();
    expect(foe.level).toBe(enc.level);
    expect(foe.maxHp).toBeGreaterThan(roadFoe({ ...enc, rare: false }).maxHp);
    expect(profileForEncounter(foe)).toBe('rareSpawn');
    expect(faced.receipt).toMatch(/fight: the thugs, rare spawn \(level \d+, \d+ HP\)/);
    expect(faced.state.currentLocation).toBe(s.journey!.ground);
  });

  it('loot is slightly better than a normal drop and a low path never drops endgame loot', () => {
    const low = { ...keepState('loot'), engineMode: 'litrpg' as EngineMode, threatTier: 1, journey: null };
    const rank = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    let mobEmpty = 0;
    for (let i = 0; i < 300; i++) {
      const rare = rollLoot({ profile: 'rareSpawn', state: low, seed: `r${i}` });
      expect(rare.noDrop).toBe(false);
      expect(rare.items.length).toBeGreaterThan(0);
      for (const it of rare.items) {
        expect(rank.indexOf(it.rarity)).toBeGreaterThanOrEqual(1);
        expect(rank.indexOf(it.rarity)).toBeLessThanOrEqual(2);
      }
      if (rollLoot({ profile: 'mob', state: low, seed: `r${i}` }).items.length === 0) mobEmpty++;
    }
    expect(mobEmpty).toBeGreaterThan(0);

    const dnd = { ...keepState('dnd-loot'), threatTier: 1, journey: null };
    const purse = rollLoot({ profile: 'rareSpawn', state: dnd, seed: 'p1' });
    expect(purse.gold).toBeGreaterThan(0);
    expect(purse.items).toHaveLength(1);
    expect(rank.indexOf(purse.items[0]!.rarity)).toBeGreaterThanOrEqual(1);
  });
});

describe('29x — camp mini-boss', () => {
  it('a camp can hold a mini-boss and offers a chip to face it', () => {
    expect(rollRoadEncounter(ctx({ terrain: 'road' }), 2, 0, 0.99, 0.1)).toMatchObject({ kind: 'camp', miniBoss: true });
    expect(rollRoadEncounter(ctx({ terrain: 'road' }), 2, 0, 0.99, 0.9)?.miniBoss).toBeUndefined();
    const s = onGround({ kind: 'camp', miniBoss: true });
    expect(journeyPads(s)).toEqual([
      'Walk on',
      'Approach the camp',
      "Face the camp's champion",
      'Skirt around the camp',
      'Turn back toward Greyhollow Inn',
    ]);
    const quietCamp = onGround({ kind: 'camp' });
    expect(journeyPads(quietCamp)).not.toContain("Face the camp's champion");
    expect(commitTravel(quietCamp, 'Approach the camp').state.activeEncounter).toBeFalsy();
  });

  it('is harder than the ordinary foe on that ground, still scaled to the area', () => {
    const at = (level: number): RoadEncounter => ({ kind: 'thugs', level, stretch: 1, dangerous: false });
    const ordinary = roadFoe(at(2));
    const boss = roadFoe({ ...at(2), kind: 'camp', miniBoss: true });
    expect(boss.level).toBe(ordinary.level + 1);
    expect(boss.maxHp).toBeGreaterThanOrEqual(ordinary.maxHp * 2);
    expect(boss.armorClass).toBeGreaterThan(ordinary.armorClass);
    expect(boss.xpReward).toBeGreaterThan(ordinary.xpReward);
    expect(profileForEncounter(boss)).toBe('miniBoss');
    const s = keepState('scale', 1);
    const villageBoss = roadFoe({ ...at(roadEncounterLevel(s, 1)), kind: 'camp', miniBoss: true });
    const highOrdinary = roadFoe(at(roadEncounterLevel(s, 3)));
    expect(villageBoss.level).toBeLessThan(highOrdinary.level);
  });

  it('is a real fight through the combat engine, not a one-line win', () => {
    const s = onGround({ kind: 'camp', miniBoss: true });
    const faced = commitTravel(s, "Face the camp's champion");
    expect(faced.receipt).toMatch(/fight: the camp's champion, mini-boss/);
    const live = faced.state;
    expect(live.activeEncounter?.source).toBe('road-camp-elite');
    const pads = compileChoices(live, ['Look around']).choices;
    expect(pads).toContain('Press the attack');
    expect(pads).not.toContain('Walk on');
    expect(commitTravel(live, 'Walk on').handled).toBe(false);

    seededRandom(7);
    const bossFight = resolveEngineFight(live, 'Press the attack')!;
    const bossRounds = Number(bossFight.receipts.join(' ').match(/in (\d+) rounds?/)![1]);
    vi.restoreAllMocks();
    const ordinary = commitTravel(onGround({ kind: 'thugs' }), 'Face the thugs').state;
    seededRandom(7);
    const plainFight = resolveEngineFight(ordinary, 'Press the attack')!;
    const plainRounds = Number(plainFight.receipts.join(' ').match(/in (\d+) rounds?/)![1]);
    expect(bossRounds).toBeGreaterThanOrEqual(2);
    expect(bossRounds).toBeGreaterThan(plainRounds);
    expect(bossFight.receipts.some((r) => /^Encounter cleared: the camp's champion/.test(r))).toBe(true);

    const after = bossFight.state;
    expect(after.activeEncounter).toBeFalsy();
    expect(journeyPads(after)).toEqual(['Walk on', 'Turn back toward Greyhollow Inn']);
    expect(commitTravel(after, 'Look around').receipt).toMatch(/a camp dealt with/);
  });

  it('a mode without combat keeps the meeting in prose', () => {
    const s = onGround({ kind: 'thugs' }, 'rpg');
    expect(commitTravel(s, 'Face the thugs').state.activeEncounter).toBeFalsy();
  });
});

describe('29x — auto-player stall rules', () => {
  const EXIT = 'Travel toward Blackspine Treeline';

  function withMira(extra: Partial<GameState> = {}): GameState {
    return {
      ...keepState('stall'),
      npcMemories: [
        { npcId: 'mira', npcName: 'Mira', disposition: 'neutral', facts: [], lastSeenTurn: 1, met: true, location: 'Greyhollow Inn' },
      ],
      ...extra,
    };
  }

  // 29z1 — "already heard" is this same ask tried here with nothing new, not "the person is met".
  const heard = (): GameState =>
    withMira({ turn: 6, circling: { stale: {}, lastProgressTurn: 0, tried: { 'greyhollow inn': { 'talk to mira': 5 } } } });

  it('asking again what was already answered is not progress: take the job, else the unused exit', () => {
    const offered = ['Talk to Mira', EXIT, 'Look around'];
    expect(applyAutoPlayerStallRules(heard(), offered, 'Talk to Mira')).toEqual({ pick: EXIT, rule: 'heard-talk' });
    const withJob = ['Talk to Mira', EXIT, 'Accept the job'];
    expect(applyAutoPlayerStallRules(heard(), withJob, 'Talk to Mira').pick).toBe('Accept the job');
    expect(offered).toContain('Talk to Mira');
  });

  it('talk stays when there is no way on, or the person has not answered yet', () => {
    expect(applyAutoPlayerStallRules(heard(), ['Talk to Mira', 'Look around'], 'Talk to Mira').pick).toBe('Talk to Mira');
    const unmet = withMira({
      npcMemories: [{ npcId: 'mira', npcName: 'Mira', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Greyhollow Inn' }],
    });
    expect(applyAutoPlayerStallRules(unmet, ['Talk to Mira', EXIT], 'Talk to Mira').pick).toBe('Talk to Mira');
  });

  it('after only look / wait / inspect picks, an unused exit or untried quest step is taken', () => {
    const loiter = withMira({
      circling: { stale: {}, lastProgressTurn: 0, recentFamilies: ['look', 'wait', 'inspect'] },
    });
    const offered = ['Inspect the hearth', EXIT, 'Wait'];
    expect(applyAutoPlayerStallRules(loiter, offered, 'Inspect the hearth')).toEqual({ pick: EXIT, rule: 'loiter' });
    const mixed = withMira({ circling: { stale: {}, lastProgressTurn: 0, recentFamilies: ['look', 'talk', 'wait'] } });
    expect(applyAutoPlayerStallRules(mixed, offered, 'Inspect the hearth').pick).toBe('Inspect the hearth');

    const quest = {
      ...loiter,
      quests: [
        {
          id: 'q1',
          name: 'Road Warden',
          description: 'Clear the road.',
          status: 'active',
          revealed: true,
          objectives: [{ description: 'Find the missing wagon', completed: false }],
        },
      ],
    } as unknown as GameState;
    const withStep = ['Inspect the hearth', EXIT, 'Find the missing wagon'];
    expect(applyAutoPlayerStallRules(quest, withStep, 'Inspect the hearth').pick).toBe('Find the missing wagon');
  });
});
