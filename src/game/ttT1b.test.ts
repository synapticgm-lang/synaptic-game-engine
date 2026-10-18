/**
 * q39-T1b — OPT-5 stalls bring content back (folded into TT-T1).
 * Acceptance from acceptance-tests-new-orders.md. Never PYOA.
 *
 * Idea: Kreminski, Dickinson and Wardrip-Fruin, Felt (ICIDS 2019) — cite only, no Felt code.
 */
import { describe, expect, it } from 'vitest';
import { nudgeIfStuck } from './choiceRanking';
import { createInitialState } from './defaults';
import { hubTravelTargets } from './outdoorHubs';
import {
  applyPlaceEngineEvent,
  forwardThreadAffordance,
  isPlaceOpenForExit,
  planSceneThreads,
  STALL_N,
  stallPressureActive,
} from './openThreads';
import { collectSceneAffordances } from './sceneAffordances';
import type { GameState, NpcMemory, Quest } from './types';

function base(mode: 'dnd' | 'litrpg' | 'rpg' = 'dnd'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    turn: 30,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    currentLocation: 'Roadside camp',
    activeEncounter: null,
    quests: [],
    npcMemories: [],
    commitments: [],
    places: [
      {
        id: 'place_roadside-camp',
        name: 'Roadside camp',
        arcStatus: 'open',
        lastVisitedTurn: 1,
      },
      {
        id: 'place_millstone-ford',
        name: 'Millstone Ford',
        arcStatus: 'open',
        lastVisitedTurn: 2,
      },
    ],
    progressGovernor: {
      turnsSinceProgress: STALL_N + 1,
      lastProgressTurn: 0,
      recentDeltas: [],
    },
    circling: { stale: {}, lastProgressTurn: 0 },
  } as unknown as GameState;
}

function openQuest(): Quest {
  return {
    id: 'q-bandit',
    name: 'Hunt the bandit leader',
    description: 'Hunt the bandit leader',
    status: 'active',
    revealed: true,
    type: 'side',
    activatedTurn: 5,
    revealedTurn: 5,
    location: 'Roadside camp',
    objectives: [{ id: 'o1', description: 'Find the leader', completed: false }],
  } as Quest;
}

function patron(): NpcMemory {
  return {
    npcId: 'npc:maud',
    npcName: 'Maud Pike',
    introSpoken: true,
    disposition: 'friendly',
    goal: { motivation: 'Wealth', target: 'a safe payout' },
    need: 'a courier for the pouch',
    offer: 'coin on delivery',
    attitude: 'wary',
    roleHint: 'quest-patron',
    location: 'Roadside camp',
    lastSeenTurn: 10,
  } as unknown as NpcMemory;
}

describe('q39-T1b OPT-5 stalls', () => {
  it('OPT5-1: turnsSinceProgress over N offers a thread/agenda/situation chip; no generic sensory nudge', () => {
    for (const mode of ['dnd', 'litrpg', 'rpg'] as const) {
      let s: GameState = {
        ...base(mode),
        quests: [openQuest()],
        openThreads: undefined,
        sceneThreadPlan: undefined,
      };
      expect(stallPressureActive(s)).toBe(true);
      s = planSceneThreads(s);
      expect(s.sceneThreadPlan?.stallKind).toBe('thread');
      expect(s.sceneThreadPlan?.stallEventId).toBeTruthy();
      const chip = forwardThreadAffordance(s);
      expect(chip?.actionId).toMatch(/^thread:/);
      expect(chip?.label.toLowerCase()).toContain('hunt the bandit leader');

      const pads = collectSceneAffordances(s).map((a) => a.label);
      expect(pads.some((p) => p.toLowerCase().includes('hunt the bandit leader'))).toBe(true);

      const nudge = nudgeIfStuck({
        ...s,
        circling: {
          stale: {},
          lastProgressTurn: 0,
          nudgeCursor: 0,
          firedNudges: [],
        },
        progressGovernor: s.progressGovernor,
      });
      const joined = nudge.receipts.join(' ');
      expect(joined).not.toMatch(/noise close by|edge of your sight|new smell/i);
      expect(joined).not.toMatch(/^Nudge: a (noise|draft|something)/i);
    }
  });

  it('OPT5-2: expired pressure clock fires an engine event within one turn', () => {
    let s = {
      ...base('rpg'),
      quests: [],
      npcMemories: [patron()],
      arcDirector: {
        pressureClock: {
          turnsSinceBeat: 6,
          deadlineTurn: 28,
          label: 'arc deadline',
        },
      },
      progressGovernor: {
        turnsSinceProgress: 0,
        lastProgressTurn: 29,
        recentDeltas: [],
      },
      circling: { stale: {}, lastProgressTurn: 29 },
      sceneThreadPlan: undefined,
    } as unknown as GameState;
    expect(stallPressureActive(s)).toBe(true);
    s = planSceneThreads(s);
    expect(s.sceneThreadPlan?.stallEventId || s.sceneFacts?.agendaWorldFact || s.sceneFacts?.stallWorldFact).toBeTruthy();
    const texts = (s.timeline ?? []).map((f) => f.text).join(' ');
    expect(
      texts.includes('agenda')
        || texts.includes('Stall pressure')
        || (s.sceneFacts?.agendaWorldFact ?? '').length > 0
        || (s.sceneFacts?.stallWorldFact ?? '').length > 0,
    ).toBe(true);
    if (s.sceneThreadPlan?.stallKind === 'agenda' || s.sceneThreadPlan?.stallKind === 'situation') {
      expect(forwardThreadAffordance(s)?.actionId).toMatch(/^stall:/);
    }
  });

  it('OPT5-3: clearing sets place cleared; closed place is not an exit until reopened', () => {
    let s = base('dnd');
    s = applyPlaceEngineEvent(s, { kind: 'cleared', placeId: 'Millstone Ford', detail: 'Site cleared' });
    const cleared = (s.places ?? []).find((p) => p.name === 'Millstone Ford');
    expect(cleared?.arcStatus).toBe('cleared');
    expect(isPlaceOpenForExit(s, 'Millstone Ford')).toBe(true);

    s = applyPlaceEngineEvent(s, { kind: 'closed', placeId: 'Millstone Ford' });
    expect(isPlaceOpenForExit(s, 'Millstone Ford')).toBe(false);
    const targets = hubTravelTargets({
      ...s,
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Roadside camp',
      sceneFacts: {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: s.turn,
        outdoor: true,
      },
      places: [
        ...(s.places ?? []),
        { id: 'place_greyhollow', name: 'Greyhollow Inn', arcStatus: 'open', lastVisitedTurn: 1 },
      ],
    } as GameState);
    expect(targets.map((t) => t.toLowerCase())).not.toContain('millstone ford');

    s = applyPlaceEngineEvent(s, { kind: 'reopened', placeId: 'Millstone Ford' });
    expect(isPlaceOpenForExit(s, 'Millstone Ford')).toBe(true);
  });
});
