/**
 * XP-D1 A2 — quest step chip pin, bearings XP, one-level/turn + event cap, step ladder.
 * LitRPG / Story RPG only; tabletop / PYOA untouched.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { pinStoryChipInTop, storyChip } from './choiceRanking';
import { applySandboxXpAwards } from './sandboxXp';
import { applyCharacterXpGain } from './characterXp';
import { levelBar, XP_EVENT_BAR_CAP, XP_TURN_SURPLUS_CAP } from './rules/xpPace';
import { milestoneXp } from './xpRules';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState, NpcMemory, Quest } from './types';

const HEAR = 'Hear their reason (or demand it)';
const FESTIVAL = 'Valespire peace-festival square';
type Card = { location: string; page1?: string; fallback?: string };
const festivalCard = ((summonedPact.openingHooks ?? []) as unknown as Card[]).find(
  (h) => h.location === FESTIVAL
)!;

const person = (npcName: string, location: string): NpcMemory =>
  ({
    npcId: npcName.toLowerCase().replace(/\s+/g, '-'),
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 2,
    met: true,
    introSpoken: true,
    location,
    present: true,
  }) as NpcMemory;

function circleQuest(over: Partial<Quest> = {}): Quest {
  return {
    id: 'sp-quest-1',
    name: "The Circle's Price",
    description: 'Hear why they pulled you here.',
    status: 'active',
    type: 'main',
    revealed: true,
    location: FESTIVAL,
    objectives: [
      {
        id: 'sp-quest-1-obj-1',
        description: 'Get your bearings in this arrival (floor, cell, camp, or vault)',
        completed: false,
      },
      { id: 'sp-quest-1-obj-2', description: HEAR, completed: false },
      { id: 'sp-quest-1-obj-3', description: 'Choose: swear, refuse, or delay', completed: false },
    ],
    ...over,
  } as Quest;
}

function litrpgAtFestival(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'xp-d1-a2',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Jax', level: 1, xp: 0, xpToNext: 150 },
    currentLocation: FESTIVAL,
    activeEncounter: null,
    turn: 4,
    quests: [circleQuest()],
    npcMemories: [person('Ila Pellane', FESTIVAL)],
    arcDirector: { committedBeatIds: [], turnsSinceCombatReceipt: 0 },
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      aloneArrival: false,
      castNpcIds: [],
      pickedHook: festivalCard.page1,
      pickedHookFallback: festivalCard.fallback,
      answers: { ...(s.openingEstablishment?.answers ?? {}), name: 'Jax', where: FESTIVAL },
    } as GameState['openingEstablishment'],
    sceneFacts: {
      ...s.sceneFacts!,
      crowd: 'present',
      present: ['Ila Pellane', 'the handler'],
    },
    log: [],
    ...over,
  } as GameState;
}

describe('XP-D1 A2 chip pin (A)', () => {
  it('offers the XP-paying step chip in the top 3 when the giver is here', () => {
    const state = litrpgAtFestival();
    const chip = storyChip(state);
    expect(chip).toBeTruthy();
    expect(chip!.toLowerCase()).toMatch(/hear their reason|ask what they want/);
    const offered = pinStoryChipInTop(
      state,
      ['Travel toward Lowmarket', 'Ping the System for bearings', 'Read Ila Pellane', 'Wait'],
      3
    );
    expect(offered.slice(0, 3).some((c) => c.toLowerCase() === chip!.toLowerCase())).toBe(true);
  });

  it('after Ask-what-they-want was played, falls through to Hear their reason', () => {
    const state = litrpgAtFestival({
      log: [{ id: 'p1', role: 'player', content: 'Ask what they want', turn: 3 }] as GameState['log'],
    });
    const chip = storyChip(state);
    expect(chip).toBe(HEAR);
  });

  it('offers Travel toward opener when the talk-stage giver is elsewhere', () => {
    const state = litrpgAtFestival({
      currentLocation: 'Lowmarket',
      sceneFacts: { crowd: 'present', present: ['a vendor'] } as GameState['sceneFacts'],
      npcMemories: [person('a vendor', 'Lowmarket')],
    });
    const chip = storyChip(state);
    expect(chip).toMatch(/^Travel toward /i);
    expect(chip!.toLowerCase()).toMatch(/valespire|festival|peace/);
    const offered = pinStoryChipInTop(
      state,
      ['Travel toward West Wall', 'Ping the System for bearings', 'Look around', 'Wait'],
      3
    );
    expect(offered[0]!.toLowerCase()).toBe(chip!.toLowerCase());
  });

  it('does not pin a LitRPG story chip onto tabletop (dnd) pads', () => {
    const state = {
      ...litrpgAtFestival(),
      engineMode: 'dnd' as const,
    };
    const pads = ['Investigate the door', 'Listen at the wall', 'Wait'];
    expect(pinStoryChipInTop(state, pads, 3)).toEqual(pads);
  });
});

describe('XP-D1 A2 bearings pay (B)', () => {
  it('bearings objective pays 1 unit once through the quest-step path', () => {
    const before = [circleQuest()];
    const after = [
      circleQuest({
        objectives: [
          {
            id: 'sp-quest-1-obj-1',
            description: 'Get your bearings in this arrival (floor, cell, camp, or vault)',
            completed: true,
          },
          { id: 'sp-quest-1-obj-2', description: HEAR, completed: false },
          { id: 'sp-quest-1-obj-3', description: 'Choose: swear, refuse, or delay', completed: false },
        ],
      }),
    ];
    const r = applySandboxXpAwards(litrpgAtFestival({ sandboxAwardKeys: ['achv:first-steps'] }), {
      playerAction: 'Ping the System for bearings',
      questsBefore: before,
      questsAfter: after,
      events: [],
      turn: 5,
    });
    const step = milestoneXp('litrpg', 'questStep', { level: 1, playerLevel: 1, contentLevel: 1 }).amount;
    expect(step).toBe(50);
    expect(r.xp).toBe(step);
    expect(r.awardKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/quest-tick:sp-quest-1:sp-quest-1-obj-1/)])
    );

    // Same objective again: idempotent (quest-tick key).
    const again = applySandboxXpAwards(
      { ...litrpgAtFestival(), sandboxAwardKeys: r.awardKeys },
      {
        playerAction: 'Ping the System for bearings',
        questsBefore: after,
        questsAfter: after,
        events: [],
        turn: 6,
      }
    );
    expect(again.xp).toBe(0);
  });
});

describe('XP-D1 A2 level caps (C)', () => {
  it('a single XP event cannot exceed 60% of the current bar', () => {
    const bar = levelBar('litrpg', 1);
    const raw = milestoneXp('litrpg', 'questComplete', { level: 1, playerLevel: 1, contentLevel: 1 }).amount;
    expect(raw).toBeLessThanOrEqual(Math.floor(bar * XP_EVENT_BAR_CAP));
    expect(raw).toBe(Math.floor(bar * XP_EVENT_BAR_CAP));
  });

  it('one apply raises at most one level; surplus capped at 50% of the next bar', () => {
    const start = {
      name: 'Jax',
      level: 1,
      xp: 0,
      xpToNext: 150,
      hp: 20,
      maxHp: 20,
    };
    const huge = applyCharacterXpGain(start as GameState['character'], 500, 'litrpg');
    expect(huge.levelsGained).toBe(1);
    expect(huge.character.level).toBe(2);
    const nextBar = levelBar('litrpg', 2);
    expect(huge.character.xp).toBeLessThanOrEqual(Math.floor(nextBar * XP_TURN_SURPLUS_CAP));
  });

  it('tabletop (dnd) path is not one-level capped', () => {
    const start = {
      name: 'Ada',
      level: 1,
      xp: 0,
      xpToNext: 300,
      hp: 10,
      maxHp: 10,
      attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    };
    // No srd sheet → still mode===dnd uses SRD thresholds and may cascade multiple levels.
    const up = applyCharacterXpGain(start as GameState['character'], 1000, 'dnd');
    expect(up.levelsGained).toBeGreaterThan(1);
  });
});

describe('XP-D1 A2 step repeat ladder (E)', () => {
  it('same giver+quest steps ladder 100/50/25/10 across repeats; different giver pays full', () => {
    const make = (id: string, giver: string, done: boolean): Quest =>
      ({
        id,
        name: "Vessa's favour",
        description: 'do Vessa a favour',
        status: done ? 'active' : 'active',
        type: 'side',
        giver,
        objectives: [{ id: `${id}-o1`, description: 'Scout the caravan camp from cover', completed: done }],
      }) as Quest;

    const step = milestoneXp('litrpg', 'questStep', { level: 1, playerLevel: 1, contentLevel: 1 }).amount;
    const first = applySandboxXpAwards(litrpgAtFestival({ sandboxAwardKeys: ['achv:first-steps'] }), {
      playerAction: 'Scout the caravan camp from cover',
      questsBefore: [make('fav-1', 'Vessa', false)],
      questsAfter: [make('fav-1', 'Vessa', true)],
      events: [],
      turn: 10,
    });
    expect(first.xp).toBe(step);

    const second = applySandboxXpAwards(
      { ...litrpgAtFestival(), sandboxAwardKeys: first.awardKeys },
      {
        playerAction: 'Scout the caravan camp from cover again',
        questsBefore: [make('fav-2', 'Vessa', false)],
        questsAfter: [make('fav-2', 'Vessa', true)],
        events: [],
        turn: 12,
      }
    );
    expect(second.xp).toBe(Math.max(1, Math.round(step * 0.5)));

    const other = applySandboxXpAwards(
      { ...litrpgAtFestival(), sandboxAwardKeys: second.awardKeys },
      {
        playerAction: 'Scout for Mira',
        questsBefore: [make('fav-3', 'Mira', false)],
        questsAfter: [make('fav-3', 'Mira', true)],
        events: [],
        turn: 14,
      }
    );
    expect(other.xp).toBe(step);
  });
});
