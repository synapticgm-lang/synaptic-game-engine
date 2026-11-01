/**
 * T10RECAP — welcome-back recap pure function: threshold, modes, missing data, no junk labels.
 */
import { describe, expect, it } from 'vitest';
import {
  awayRecapBlock,
  buildAwayRecap,
  clampRecapAfterHours,
  RECAP_AFTER_HOURS,
  recapAfterHoursOf,
} from './awayRecap';
import { DEFAULT_HOUSE_RULES, houseRulesFromSettings } from './rules/houseRules';
import type { EngineMode, GameState, Quest } from './types';

const HOUR = 3_600_000;

function baseSave(over: Partial<GameState> & { engineMode: EngineMode }): GameState {
  return {
    saveId: 't10recap-test',
    storyName: 'Recap Test',
    turn: 12,
    seed: '42',
    currentLocation: 'Greyhollow Inn',
    character: { name: 'Jax', hp: 10, maxHp: 10 } as GameState['character'],
    log: [],
    rolls: [],
    quests: [],
    lorebook: [],
    shrines: [],
    bestiary: [],
    relationships: [],
    inventory: [],
    openingEstablishment: { complete: true } as GameState['openingEstablishment'],
    sceneFacts: {
      crowd: 'sparse',
      noise: 'quiet',
      present: ['Vessa'],
      props: [],
      lastBeat: 'Vessa set a mug down and waited.',
      updatedTurn: 12,
    },
    houseRules: { ...DEFAULT_HOUSE_RULES },
    lastUpdated: Date.now() - 7 * HOUR,
    ...over,
  } as GameState;
}

const mainQuest = (name: string, next: string): Quest =>
  ({
    id: 'q-main',
    name,
    type: 'main',
    status: 'active',
    revealed: true,
    objectives: [
      { id: 'o1', description: next, completed: false },
    ],
  }) as Quest;

describe('T10RECAP welcome-back recap', () => {
  it('owns a 6-hour default on the constant and houseRules', () => {
    expect(RECAP_AFTER_HOURS).toBe(6);
    expect(DEFAULT_HOUSE_RULES.recapAfterHours).toBe(6);
    expect(clampRecapAfterHours(undefined)).toBe(6);
    expect(clampRecapAfterHours(0)).toBe(1);
    expect(clampRecapAfterHours(200)).toBe(168);
    expect(houseRulesFromSettings({}).recapAfterHours).toBe(6);
    expect(houseRulesFromSettings({ recapAfterHours: 12 }).recapAfterHours).toBe(12);
    expect(recapAfterHoursOf({ houseRules: { ...DEFAULT_HOUSE_RULES, recapAfterHours: 9 } })).toBe(9);
  });

  it('threshold boundary: under 6 hours is null; at/over 6 hours returns lines', () => {
    const s = baseSave({ engineMode: 'rpg' });
    expect(buildAwayRecap(s, 5 * HOUR + (HOUR - 1))).toBeNull();
    expect(buildAwayRecap(s, 6 * HOUR)).not.toBeNull();
    expect(buildAwayRecap(s, 30 * 60_000)).toBeNull();
  });

  it('builds where / who / quest / last for story RPG without numbers or markup', () => {
    const s = baseSave({
      engineMode: 'rpg',
      quests: [mainQuest('Case the Caravan', 'Pick an approach')],
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Vessa'],
        props: [],
        lastBeat: 'Vessa nodded. <i>Trust +1</i> HP 12/20.',
        updatedTurn: 12,
      },
    });
    const lines = buildAwayRecap(s, 7 * HOUR)!;
    expect(lines[0]).toBe('You are at Greyhollow Inn.');
    expect(lines).toContain('Vessa is here.');
    expect(lines).toContain('Case the Caravan: next, pick an approach.');
    expect(lines.some((l) => l.startsWith('Last:'))).toBe(true);
    expect(lines.join('\n')).not.toMatch(/\bHP\b|\b12\/20\b|<i>|<\/i>/);
    expect(lines.join('\n')).not.toMatch(/undefined|Nobody|no one/i);
  });

  it('LitRPG and tabletop may keep fight HP; PYOA is blocked', () => {
    const fight = {
      name: 'Pact-Hunter',
      level: 1,
      hp: 8,
      maxHp: 12,
      armorClass: 12,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      xpReward: 0,
      goldReward: 0,
    };
    const lit = buildAwayRecap(baseSave({ engineMode: 'litrpg', activeEncounter: fight }), 8 * HOUR)!;
    expect(lit.some((l) => /fight with Pact-Hunter \(8 HP\)/.test(l))).toBe(true);

    const tt = buildAwayRecap(baseSave({ engineMode: 'dnd', activeEncounter: fight }), 8 * HOUR)!;
    expect(tt.some((l) => /Pact-Hunter \(8 HP\)/.test(l))).toBe(true);

    const rpg = buildAwayRecap(baseSave({ engineMode: 'rpg', activeEncounter: fight }), 8 * HOUR)!;
    expect(rpg.some((l) => /fight with Pact-Hunter\./.test(l))).toBe(true);
    expect(rpg.join('\n')).not.toMatch(/\d+\s*HP/);

    expect(awayRecapBlock(baseSave({ engineMode: 'pyoa' }))).toBe('pyoa');
    expect(buildAwayRecap(baseSave({ engineMode: 'pyoa' }), 48 * HOUR)).toBeNull();
  });

  it('omits missing slots and never prints empty / Nobody / undefined', () => {
    const s = baseSave({
      engineMode: 'litrpg',
      currentLocation: '   ',
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: ['Nobody', '', 'undefined', '  '],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
      },
      quests: [],
      companions: [],
      log: [
        {
          id: 'g1',
          turn: 1,
          role: 'gm',
          content: 'Dust hung.',
          timestamp: 1,
          systemLog: ['undefined', 'AUTHORITY: skip', 'Found a copper nail.'],
        },
      ],
    });
    const lines = buildAwayRecap(s, 10 * HOUR)!;
    expect(lines.every((l) => l.trim().length > 0)).toBe(true);
    expect(lines.join('\n')).not.toMatch(/undefined|Nobody|no one|^You are at\s*\./i);
    expect(lines.some((l) => l === 'Last: Found a copper nail.')).toBe(true);
    expect(lines.some((l) => l.startsWith('You are at'))).toBe(false);
    expect(lines.some((l) => /is here|are here|with you/.test(l))).toBe(false);
  });

  it('play-over and incomplete opening get no card; free for everyone (no tier gate in builder)', () => {
    expect(buildAwayRecap({ ...baseSave({ engineMode: 'rpg' }), playPhase: 'ended' }, 10 * HOUR)).toBeNull();
    expect(
      buildAwayRecap(
        {
          ...baseSave({ engineMode: 'rpg' }),
          openingEstablishment: { complete: false } as GameState['openingEstablishment'],
        },
        10 * HOUR,
      ),
    ).toBeNull();
    // Pure function has no subscription / plan argument — carrot rule: free for everyone.
    expect(buildAwayRecap.length).toBe(2);
  });
});
