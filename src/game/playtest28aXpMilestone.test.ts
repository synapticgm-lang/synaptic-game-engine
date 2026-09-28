/**
 * 28a — milestone XP only (XP-PLAN.md). D&D tables from SRD 5.1 / SRD 5.2.1 (CC-BY-4.0).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applySandboxXpAwards } from './sandboxXp';
import { applyCharacterXpGain } from './characterXp';
import { hubsForBibleId } from './outdoorHubs';
import { crToXp, dndXpToNext, milestoneXp } from './xpRules';
import type { ActiveEncounter, GameState, Quest } from './types';

const quest = (done: boolean): Quest[] => [
  {
    id: 'sp-quest-side-junk',
    name: 'Otherworld Junk',
    description: 'Fence',
    status: 'active',
    type: 'side',
    revealed: true,
    objectives: [
      { id: 'a', description: 'Find a fence', completed: done },
      { id: 'b', description: 'Sell', completed: false },
    ],
  } as Quest,
];

describe('28a xpRules — verified 5e tables', () => {
  it('CR to XP and level thresholds', () => {
    expect(crToXp('1/4')).toBe(50);
    expect(crToXp(5)).toBe(1800);
    expect(crToXp(30)).toBe(155000);
    expect(dndXpToNext(1)).toBe(300);
    expect(dndXpToNext(4)).toBe(3800);
  });

  it('D&D shows the maths; LitRPG shows the result only', () => {
    const d = milestoneXp('dnd', 'encounter', { cr: 2, partySize: 2 });
    expect(d.amount).toBe(225);
    expect(d.detail).toMatch(/450/);
    const l = milestoneXp('litrpg', 'encounter');
    expect(l.amount).toBe(40);
    expect(l.detail).toBe('');
  });

  it('D&D level curve uses the 5e gap', () => {
    const c = createInitialState('Ria', 'dnd').character;
    const up = applyCharacterXpGain({ ...c, level: 1, xp: 0 }, 300, 'dnd');
    expect(up.character.level).toBe(2);
    expect(up.character.xpToNext).toBe(600);
  });
});

describe('28a milestone XP — no drip', () => {
  it('talk / look / inspect / browse at a non-hub pay nothing', () => {
    const state = {
      ...createInitialState('Jax', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      currentLocation: 'iron-bar cell',
      sandboxAwardKeys: [] as string[],
      places: [],
      quests: [],
    };
    for (const a of ['Talk to the guard', 'Look around', 'Examine the notice slate', 'Browse the nearest stall']) {
      const r = applySandboxXpAwards(state, {
        playerAction: a,
        locationName: 'iron-bar cell',
        previousLocationName: 'iron-bar cell',
        questsBefore: [],
        questsAfter: [],
        events: [],
        turn: 2,
      });
      expect(r.xp).toBe(0);
    }
  });

  it('D&D encounter victory pays CR XP with the maths', () => {
    const state = {
      ...createInitialState('Ria', 'dnd'),
      campaignBibleId: 'cursed-keep',
      currentLocation: 'iron-bar cell',
      sandboxAwardKeys: [] as string[],
      places: [],
      activeEncounter: null,
    };
    const r = applySandboxXpAwards(state, {
      playerAction: 'Attack',
      locationName: 'iron-bar cell',
      previousLocationName: 'iron-bar cell',
      questsBefore: [],
      questsAfter: [],
      events: [],
      encounterCleared: true,
      enemyKilled: true,
      endedEncounter: { name: 'Goblin', cr: '1/4', hp: 0, maxHp: 7 } as unknown as ActiveEncounter,
      turn: 4,
    });
    expect(r.xp).toBe(50);
    expect(r.notes.some((n) => /CR 1\/4 = 50 XP/.test(n))).toBe(true);
  });

  it('LitRPG opening reaches level 2 within 5 turns', () => {
    const hubs = hubsForBibleId('summoned-pact');
    expect(hubs.length).toBeGreaterThan(1);
    let state: GameState = {
      ...createInitialState('Jax', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      currentLocation: hubs[0]!.name,
      sandboxAwardKeys: [] as string[],
      places: [],
      quests: [],
    };
    let character = state.character;
    const turns: Array<[string, string, string, Quest[], Quest[]]> = [
      ['Look around', hubs[0]!.name, hubs[0]!.name, [], []],
      ['Look around', hubs[0]!.name, hubs[0]!.name, [], []],
      ['Talk to the fence', hubs[0]!.name, hubs[0]!.name, quest(false), quest(true)],
      [`Travel toward ${hubs[1]!.name}`, hubs[1]!.name, hubs[0]!.name, [], []],
      ['Look around', hubs[1]!.name, hubs[1]!.name, [], []],
    ];
    const gained: number[] = [];
    turns.forEach(([action, loc, prev, qb, qa], i) => {
      const r = applySandboxXpAwards(state, {
        playerAction: action,
        locationName: loc,
        previousLocationName: prev,
        questsBefore: qb,
        questsAfter: qa,
        events: [],
        turn: i + 1,
      });
      gained.push(r.xp);
      character = applyCharacterXpGain(character, r.xp, 'litrpg').character;
      state = { ...state, sandboxAwardKeys: r.awardKeys, places: r.places, currentLocation: loc, character };
    });
    // Turn 2 (a plain look) pays nothing; XP arrives only at milestones.
    expect(gained[1]).toBe(0);
    expect(character.level).toBeGreaterThanOrEqual(2);
  });
});
