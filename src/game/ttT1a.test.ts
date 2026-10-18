/**
 * q39-T1a — TT-T1 open threads (acceptance from acceptance-tests-new-orders.md).
 * OPT-5 stall / place state = q39-T1b. Never PYOA.
 */
import { describe, expect, it } from 'vitest';
import { factClosedViolationReason } from './beatCommitGate';
import { createInitialState } from './defaults';
import {
  collectOpenThreads,
  forwardThreadAffordance,
  planSceneThreads,
  threadResolutionMet,
} from './openThreads';
import type { ActiveEncounter, GameState, Quest } from './types';

function base(mode: 'dnd' | 'litrpg' | 'rpg' = 'dnd'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    turn: 20,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    currentLocation: 'Roadside camp',
    activeEncounter: null,
    quests: [],
    npcMemories: [],
    commitments: [],
  } as unknown as GameState;
}

function openQuest(id = 'q-bandit', name = 'Hunt the bandit leader'): Quest {
  return {
    id,
    name,
    description: name,
    status: 'active',
    revealed: true,
    type: 'side',
    activatedTurn: 5,
    revealedTurn: 5,
    location: 'Roadside camp',
    objectives: [{ id: 'o1', description: 'Find the leader', completed: false }],
  } as Quest;
}

function livingBandit(): ActiveEncounter {
  return {
    name: 'Bandit Leader',
    level: 1,
    hp: 12,
    maxHp: 12,
    armorClass: 12,
    strength: 12,
    dexterity: 12,
    constitution: 12,
    xpReward: 50,
    goldReward: 0,
    startedTurn: 8,
  };
}

describe('q39-T1a TT-T1 threads', () => {
  it('T1-1: a thread untouched for 10 turns appears within the next 5 (all modes)', () => {
    for (const mode of ['dnd', 'litrpg', 'rpg'] as const) {
      let s = base(mode);
      s = {
        ...s,
        quests: [openQuest()],
        openThreads: [
          {
            id: 'quest:q-bandit',
            kind: 'quest',
            label: 'Hunt the bandit leader',
            entityId: 'quest:q-bandit',
            placeId: 'Roadside camp',
            lastSeenTurn: 10,
            resolution: { type: 'quest-complete', questId: 'q-bandit' },
          },
        ],
        turn: 20,
      };

      let appeared = false;
      for (let t = 20; t <= 24; t++) {
        s = planSceneThreads({ ...s, turn: t, sceneThreadPlan: undefined });
        const ids = s.sceneThreadPlan?.forwardIds ?? [];
        if (ids.includes('quest:q-bandit')) {
          appeared = true;
          const chip = forwardThreadAffordance(s);
          expect(chip?.actionId).toBe('thread:quest:q-bandit:forward');
          expect(chip?.label.toLowerCase()).toContain('hunt the bandit leader');
          break;
        }
      }
      expect(appeared, `mode ${mode}`).toBe(true);
    }
  });

  it('T1-2: a draft saying the bandit leader is dead while the engine has them alive is gated', () => {
    const s = planSceneThreads({
      ...base('dnd'),
      activeEncounter: livingBandit(),
    });
    const threads = collectOpenThreads(s);
    const foe = threads.find((t) => t.kind === 'foe');
    expect(foe).toBeTruthy();
    expect(threadResolutionMet(s, foe!)).toBe(false);

    const reason = factClosedViolationReason(s, 'The Bandit Leader is dead in the ditch.');
    expect(reason).toMatch(/open thread|still living/i);

    // Engine resolution met → same line is not an early close.
    const dead: GameState = {
      ...s,
      activeEncounter: null,
      sceneFacts: {
        ...(s.sceneFacts ?? {
          crowd: 'unknown',
          noise: 'unknown',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: s.turn,
        }),
        lastKill: { name: 'Bandit Leader', outcome: 'victory', turn: s.turn, remains: true },
      },
      openThreads: undefined,
      sceneThreadPlan: undefined,
    };
    const after = planSceneThreads(dead);
    expect(factClosedViolationReason(after, 'The Bandit Leader is dead in the ditch.')).toBeNull();
  });

  it('planner brings at least one open thread; closing only on engine resolution', () => {
    const s0 = planSceneThreads({
      ...base('rpg'),
      quests: [openQuest('q-road', 'Case the caravan')],
    });
    expect((s0.openThreads ?? []).length).toBeGreaterThan(0);
    expect((s0.sceneThreadPlan?.forwardIds ?? []).length).toBeGreaterThanOrEqual(1);

    const open = s0.openThreads![0]!;
    expect(threadResolutionMet(s0, open)).toBe(false);
    const done = planSceneThreads({
      ...s0,
      quests: [{ ...openQuest('q-road', 'Case the caravan'), status: 'completed', completedTurn: s0.turn }],
      sceneThreadPlan: undefined,
      openThreads: undefined,
    });
    const still = (done.openThreads ?? []).some((t) => t.id === open.id);
    expect(still).toBe(false);
  });
});
