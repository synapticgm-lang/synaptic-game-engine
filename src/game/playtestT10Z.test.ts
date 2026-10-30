/**
 * T10Z — s9301 LitRPG: plain loot names, named asks answer, road meeting chips,
 * flee ≠ travel-blocked, stall empty-road Walk on.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { scrubEntityMadLibs } from './proseWarden';
import { scanReadabilityViolations } from './readabilityGate';
import { mustNarrateCue, buildClauseWriterFact } from './writerCueLines';
import { plainItemChromeInText, proseItemName } from './proseItemName';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { checkActionFollowed, checkChosenChip } from './turnCheck';
import { checkTurnInvariants } from './invariants/turnInvariants';
import { openBoxChip, settleRewardBox, rewardBoxItem } from './rules/achievements';
import { rollLoot } from './lootTableRegistry';
import { planSceneThreads, stallPressureActive, STALL_N } from './openThreads';
import { applyHostilePresentLeave } from './npcMemory';
import { initEncounterTerminal } from './encounterTerminalFsm';
import type { TravelJourney } from './types';

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  s.engineMode = 'litrpg';
  s.campaignBibleId = 'summoned-pact';
  s.character = { ...s.character, name: 'Jax' };
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
  };
  return { ...s, ...over };
}

describe('T10Z s9301 entity-madlib / ask / chips / flee / stall', () => {
  it('a: Fine/Bronze loot chrome is plain for writer; scrub does not mad-lib held Fine X', () => {
    expect(proseItemName('Fine Pistol')).toBe('pistol');
    expect(proseItemName('Bronze Reward Box')).toBe('reward box');
    expect(plainItemChromeInText('I spin the Fine Pistol on my finger')).toBe(
      'I spin the pistol on my finger',
    );
    expect(mustNarrateCue('Open the Bronze Reward Box')).toMatch(/reward box/i);
    expect(mustNarrateCue('Open the Bronze Reward Box')).not.toMatch(/Bronze Reward Box/);
    expect(scrubEntityMadLibs('Jax spun the Fine Pistol on their finger like a coin.')).toBe(
      'Jax spun the Fine Pistol on their finger like a coin.',
    );
    expect(scrubEntityMadLibs('open the Fine')).toMatch(/open your hands/i);
    const loot = rollLoot({
      profile: 'chestBronze',
      state: lit({ seed: 't10z-a' }),
      seed: 't10z-a-loot',
    });
    for (const item of loot.items) {
      expect(item.name).not.toMatch(/^(?:Worn|Fine|Runed|Masterwork)\s/);
    }
    expect(openBoxChip('Bronze')).toBe('Open the bronze reward box');
  });

  it('a: opening a reward box writer fact names a plain reward box + plain loot', () => {
    const def = {
      key: 'achv:first-kill',
      name: 'First Kill',
      tier: 'Bronze' as const,
      earned: () => true,
    };
    const state = lit({
      seed: 't10z-box',
      inventory: [rewardBoxItem(def)],
      sandboxAwardKeys: [],
    });
    const out = settleRewardBox(state, openBoxChip('Bronze'));
    expect(out.settled).toBe(true);
    expect(out.fact).toMatch(/reward box/i);
    expect(out.fact).not.toMatch(/Bronze Reward Box/);
  });

  it('b: tap the quill does not address Captain Sera Quill; stare at Osric opens his slot', () => {
    const state = lit({
      currentLocation: 'Contract Hall',
      turn: 23,
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['Osric Marl', 'Hobb Barrow', 'Captain Sera Quill'],
        props: ['quill'],
        lastBeat: 'hall',
        updatedTurn: 23,
      },
      npcMemories: [
        { npcId: 'osric', npcName: 'Osric Marl', disposition: 'neutral', facts: [], lastSeenTurn: 20 },
        { npcId: 'hobb', npcName: 'Hobb Barrow', disposition: 'neutral', facts: [], lastSeenTurn: 20 },
        { npcId: 'quill', npcName: 'Captain Sera Quill', disposition: 'neutral', facts: [], lastSeenTurn: 10 },
      ],
    });
    const ctx = sheetContextFromState(state);
    ctx.items = ['quill', ...(ctx.items ?? [])];
    const tap = parsePlayerSteps('I tap the quill against my teeth', ctx);
    expect(String(tap.steps[0]?.addressee ?? '')).not.toMatch(/Quill/i);
    const ask = parsePlayerSteps(
      'I tap the quill against my teeth and stare at Osric. "What\'s that secret worth, or do I have to guess?',
      ctx,
    );
    const osricStep = ask.steps.find((s) => /osric/i.test(s.addressee ?? '') || /osric/i.test(s.clause ?? ''));
    expect(osricStep?.addressee ?? ask.steps.map((s) => s.addressee).join(' ')).toMatch(/Osric/i);
    const fact = buildClauseWriterFact('stare at Osric', true, {
      said: "What's that secret worth, or do I have to guess?",
      addressee: 'Osric Marl',
      presentHere: ctx.present ?? [],
    });
    expect(fact).toMatch(/NPC reaction slot open for Osric Marl/);
    expect(fact).not.toMatch(/No one present to answer/);
  });

  it('b: shake/look with only bystanders is not an ignored-action ask', () => {
    const before = lit({
      currentLocation: 'the stone outline of a building that is gone',
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['bystanders'],
        props: [],
        lastBeat: '',
        updatedTurn: 2,
      },
    });
    const act =
      'I shake the heavy metal band off my wrist and toss it onto the grass, then look around for any sign of movement.';
    const prose =
      'Jax worked the heavy metal band back and forth until it slid off their wrist and dropped away. Jax looked around.';
    const check = checkActionFollowed(before, before, act, prose);
    expect(check.p0.map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('c: Approach the camp is related while journey.encounter camp is live (no timeline required)', () => {
    const before = lit({
      currentLocation: 'On the road between places',
      journey: {
        from: 'Palace Approach',
        to: 'Cinderflow Road',
        ground: 'open road',
        terrain: 'road',
        legsDone: 1,
        legsTotal: 3,
        hoursPerLeg: 2,
        startedTurn: 100,
        encounter: {
          kind: 'camp',
          level: 5,
          stretch: 1,
          dangerous: true,
          name: 'Wenna Fenwick',
          miniBoss: true,
          count: 5,
          want: 'news from where you came from',
        },
      } as TravelJourney,
      timeline: [],
    });
    expect(checkChosenChip(before, 'Approach the camp')).toEqual([]);
    expect(checkChosenChip(before, "Face the camp's champion")).toEqual([]);
  });

  it('d: Try to flee relocating while travelPadBlocked is not travel-blocked', () => {
    const enc = initEncounterTerminal(
      {
        name: 'Skeletal Carrion Crow Flock',
        hp: 12,
        maxHp: 20,
        count: 3,
      } as GameState['activeEncounter'] & object,
      lit({ turn: 81 }),
    );
    const before = lit({
      turn: 81,
      currentLocation: 'Cathedral Undercroft — Antechamber',
      activeEncounter: enc,
      engineMode: 'litrpg',
    });
    const after = {
      ...before,
      currentLocation: 'Cathedral Undercroft — Stair Descent',
      activeEncounter: undefined,
    };
    const v = checkTurnInvariants(before, after, {
      offeredOptions: ['Press the attack', 'Try to flee', 'Parley'],
      playerInput: 'Try to flee',
      typed: false,
      prose: 'Jax ran back down the passage into the Stair Descent.',
    });
    expect(v.filter((x) => x.code === 'travel-blocked')).toEqual([]);
  });

  it('e: stall on empty journey Walks on before LOOP STOP threshold', () => {
    expect(STALL_N).toBeLessThan(5);
    let s = lit({
      turn: 30,
      currentLocation: 'On the road between places',
      progressGovernor: { turnsSinceProgress: STALL_N, lastProgressTurn: 27 } as GameState['progressGovernor'],
      journey: {
        from: 'Palace Approach',
        to: 'Cinderflow Road',
        ground: 'open road',
        terrain: 'road',
        legsDone: 1,
        legsTotal: 4,
        hoursPerLeg: 2,
        startedTurn: 25,
        encounter: {
          kind: 'camp',
          level: 5,
          stretch: 1,
          dangerous: true,
          lost: true,
          name: 'Wenna Fenwick',
        },
      } as TravelJourney,
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 30,
      },
      quests: [],
      openThreads: [],
      sceneThreadPlan: undefined,
    });
    expect(stallPressureActive(s)).toBe(true);
    s = planSceneThreads(s);
    expect(s.sceneThreadPlan?.stallEventId).toMatch(/stall-road|stall-/);
    expect((s.journey?.legsDone ?? 1) > 1 || !!s.sceneFacts?.stallWorldFact).toBe(true);
  });

  it('e: grab present NPC makes them pull away', () => {
    const state = lit({
      turn: 50,
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['Sefa Aske'],
        props: [],
        lastBeat: '',
        updatedTurn: 50,
      },
      npcMemories: [
        { npcId: 'sefa', npcName: 'Sefa Aske', disposition: 'neutral', facts: [], lastSeenTurn: 49 },
      ],
    });
    const out = applyHostilePresentLeave(
      state,
      "I grab Sefa's arm and shake her hard while shouting that we need to move.",
    );
    expect(out.receipts.join(' ')).toMatch(/pulls away/i);
    expect(out.state.sceneFacts?.present ?? []).not.toContain('Sefa Aske');
  });

  it('a readability: Fine Pistol prose is not entity-madlib', () => {
    const state = lit({
      log: [
        {
          id: 'g1',
          turn: 63,
          role: 'gm',
          content: 'Jax spun the Fine Pistol on their finger like a coin, and the afternoon light caught its edge.',
          timestamp: 0,
        },
      ],
    });
    const hits = scanReadabilityViolations(state).filter((v) => v.kind === 'entity-madlib');
    expect(hits).toEqual([]);
  });
});
