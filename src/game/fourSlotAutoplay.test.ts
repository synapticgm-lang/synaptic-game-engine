/**
 * FOURSLOT autoplay — picks only from the four slots; rests at HP ≤ 50% with no fight;
 * fixture chip streams from the known loop shapes (Travel-to-HERE, Answer for leaving NPC,
 * Search/Open repeats) reshape to 4 valid distinct slots with family repeat ≤ 2.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  assembleFourSlotPads,
  fourSlotEngineLabels,
  isFourSlotLegal,
  pickFromFourSlots,
} from './fourSlotPads';
import { actionFamily } from './choiceRanking';
import { FREE_INPUT_SAY, isFreeInputChip } from './sceneAffordances';
import { OUTDOOR_REST_CHIP } from './rules/wildlifeConfig';
import { preferHurtRecoveryPick } from './fateAutoplay';
import type { GameState } from './types';

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'inkbound-academy',
    turn: 20,
    currentLocation: 'Living Ink Atelier',
    character: { ...s.character!, name: 'Jax', hp: 20, maxHp: 31 },
    sceneFacts: { ...emptySceneFacts(20), indoor: false, present: ['Professor Lin'] },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

/** Chip streams shaped like the OPEN8 / train-loop stuck pads (no live turns.jsonl needed). */
const FIXTURE_STREAMS: Array<{ name: string; here: string; offered: string[] }> = [
  {
    name: 'open8-chapel-travel-here',
    here: 'a Cape District chapel watch',
    offered: [
      'Travel toward a Cape District chapel watch',
      'Search a Cape District chapel watch for signs',
      'Talk to the people here',
      'Open the silver reward box',
      'Look around',
    ],
  },
  {
    name: 'open8-atelier-open-streak',
    here: 'Living Ink Atelier',
    offered: [
      'Open the bronze reward box',
      'Open the silver reward box',
      'Search Living Ink Atelier for signs',
      'Walk on',
      'Travel toward Quill Dormitory',
    ],
  },
  {
    name: 'train-answer-leaving',
    here: 'Lowmarket',
    offered: [
      'Answer the leaving courier',
      'Talk to the people here',
      'Search Lowmarket for signs',
      'Wait',
    ],
  },
];

describe('FOURSLOT autoplay', () => {
  it('picks only from the four engine slots (never free-input label)', () => {
    const state = lit();
    const offered = assembleFourSlotPads(state, [
      'Talk to Professor Lin',
      'Travel toward Quill Dormitory',
      'Check System',
      'Look around',
    ]);
    const engine = new Set(fourSlotEngineLabels(offered).map((c) => c.toLowerCase()));
    for (let i = 0; i < 20; i++) {
      const pick = pickFromFourSlots(state, offered, () => (i + 0.5) / 20);
      expect(isFreeInputChip(pick)).toBe(false);
      expect(engine.has(pick.toLowerCase())).toBe(true);
    }
  });

  it('at HP ≤ 50% with no fight picks the rest chip from Step back', () => {
    const state = lit({
      character: { ...lit().character!, hp: 9, maxHp: 31 },
    });
    const offered = [
      'Hunt the wildlife nearby',
      'Talk to Professor Lin',
      'Check System',
      OUTDOOR_REST_CHIP,
      FREE_INPUT_SAY,
    ];
    const pick = pickFromFourSlots(state, offered, () => 0.1);
    expect(/rest/i.test(pick)).toBe(true);
    // preferHurtRecoveryPick still honors Leave when present.
    const withLeave = preferHurtRecoveryPick(
      [...offered, 'Leave the scene'],
      pick,
      state
    );
    expect(withLeave).toBe('Leave the scene');
  });

  it('fixture loop streams reshape to 4 valid distinct slots; filler family ≤ 2', () => {
    for (const fix of FIXTURE_STREAMS) {
      const chapel = fix.name.startsWith('open8-chapel');
      const state = lit({
        engineMode: chapel ? 'rpg' : 'litrpg',
        campaignBibleId: chapel ? 'cape-district-vigil' : 'inkbound-academy',
        // Story RPG origin must be settled — four-slot starts after that exclusive step.
        character: {
          ...lit().character!,
          ...(chapel ? { origin: 'sage' as const } : {}),
        },
        currentLocation: fix.here,
        sceneFacts: {
          ...emptySceneFacts(20),
          indoor: /chapel|atelier/i.test(fix.here),
          present: fix.name.includes('leaving') ? [] : ['Professor Lin'],
        },
      });
      const pads = assembleFourSlotPads(state, fix.offered);
      const engine = fourSlotEngineLabels(pads);
      expect(engine, fix.name).toHaveLength(4);
      expect(new Set(engine.map((c) => c.toLowerCase())).size, fix.name).toBe(4);
      for (const c of engine) {
        expect(isFourSlotLegal(state, c), `${fix.name}:${c}`).toBe(true);
      }
      expect(pads.some((c) => /travel toward a cape district chapel watch/i.test(c))).toBe(false);
      expect(pads.some((c) => /answer the leaving courier/i.test(c))).toBe(false);
      const famCounts: Record<string, number> = {};
      for (const c of engine) {
        const fam = actionFamily(c);
        if (fam === 'search' || fam === 'look' || fam === 'inspect' || fam === 'use') {
          famCounts[fam] = (famCounts[fam] ?? 0) + 1;
        }
      }
      for (const [fam, n] of Object.entries(famCounts)) {
        expect(n, `${fix.name} fam:${fam}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('free text remains accepted (free-input chips stay on every fixture pad)', () => {
    for (const fix of FIXTURE_STREAMS) {
      const state = lit({ currentLocation: fix.here });
      const pads = assembleFourSlotPads(state, fix.offered);
      expect(pads.some((c) => isFreeInputChip(c)), fix.name).toBe(true);
    }
  });
});
