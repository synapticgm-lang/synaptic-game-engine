/**
 * T10I — Cursed Keep seed 1027: chip labels, ask≠mud, mixed-clause juggle, nudge not a writer fact.
 * Evidence: scripts/fate-autoplay/runs/2026-10-28T00-56-52-540Z_cursed-keep_chilled-gm_s1027
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { engineResultFact } from './engineResult';
import { seedBibleNpcRoster } from './npcMemory';
import {
  collectOpenThreads,
  forwardThreadAffordance,
  isGmFacingNote,
  npcChipWant,
} from './openThreads';
import { collectSceneAffordances } from './sceneAffordances';
import { actionMatchesObjective, findQuestTargets } from './questTargets';
import { applyTabletopQuestTurn, placeTabletopQuestTargets } from './tabletopQuestProgress';
import { withModeQuestRoutes } from './questRoutes';
import { resolveTypedFreeText } from './typedFreeText';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';
import { getCampaignBibleById } from '@/data/campaigns';
import type { GameState, NpcMemory, Quest } from './types';

function memory(partial: Partial<NpcMemory> & Pick<NpcMemory, 'npcName'>): NpcMemory {
  return {
    npcId: partial.npcId ?? `npc:${partial.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...partial,
  } as NpcMemory;
}

function mayorQuest(): Quest {
  const spine = TABLETOP_MAIN_SPINES.find((x) => x.spineId === 'ck-spine-mayor-problem')!;
  const seed = withModeQuestRoutes(tabletopSpineToStarterQuest(spine), 'dnd');
  return {
    id: seed.id,
    name: seed.title,
    status: 'active',
    revealed: true,
    type: 'main',
    location: seed.location,
    giver: seed.giver,
    objectives: seed.objectives.map((d, i) => {
      const { people, ...rest } = seed.objectiveAnchors?.[i] ?? {};
      return {
        id: `${seed.id}-obj-${i + 1}`,
        description: d,
        completed: false,
        ...rest,
        ...(people?.length ? { people } : {}),
      };
    }),
  } as Quest;
}

function graveyard(over: Partial<GameState> = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  const base: GameState = {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 3,
    seed: '1027',
    currentLocation: 'Greyhollow Graveyard',
    character: { ...s0.character, name: 'Jax' },
    openingEstablishment: {
      ...(s0.openingEstablishment ?? { pending: [], answers: {} }),
      complete: true,
      answers: { name: 'Jax' },
    },
    quests: [mayorQuest()],
    sceneFacts: {
      crowd: 'sparse',
      noise: 'quiet',
      present: ['Father Aldous', 'Mayor Helga Brask'],
      props: [],
      lastBeat: '',
      updatedTurn: 3,
    },
    npcMemories: [
      memory({
        npcName: 'Father Aldous',
        npcId: 'npc:Father Aldous',
        present: true,
        location: 'Greyhollow Graveyard',
        met: true,
        roleHint: 'informant',
        goal: {
          motivation: 'Knowledge',
          target: 'Moral anchor: Aldous will oppose reckless or evil actions, providing ethical cou',
        },
        need: 'a buyer who pays',
        motiveLines: ['I only want this town to sleep easy again, myself included'],
      }),
      memory({
        npcName: 'Mayor Helga Brask',
        npcId: 'npc:Mayor Helga Brask',
        present: true,
        location: 'Greyhollow Graveyard',
        met: true,
        roleHint: 'informant',
        goal: {
          motivation: 'Knowledge',
          target: "Secret: Helga's grandmother was in the keep the night of the Vanishing — she was",
        },
        need: 'a buyer who pays',
        motiveLines: ['I want this town calm, and I mean to keep it that way'],
      }),
    ],
    ...over,
  };
  return placeTabletopQuestTargets(base);
}

describe('T10I chip labels never leak GM notes', () => {
  it('isGmFacingNote catches Secret / Moral-anchor hook shape', () => {
    expect(isGmFacingNote('Secret: Helga\'s grandmother was in the keep')).toBe(true);
    expect(isGmFacingNote('Moral anchor: Aldous will oppose reckless actions')).toBe(true);
    expect(isGmFacingNote('this town to sleep easy again')).toBe(false);
  });

  it('npcChipWant prefers motive over poisoned Secret/Moral goal.target', () => {
    const state = graveyard();
    const aldous = state.npcMemories!.find((m) => m.npcName === 'Father Aldous')!;
    const helga = state.npcMemories!.find((m) => m.npcName === 'Mayor Helga Brask')!;
    expect(npcChipWant(aldous)).toBe('this town to sleep easy again');
    expect(npcChipWant(aldous)).not.toMatch(/Moral anchor|Secret:/i);
    expect(npcChipWant(helga)).toBe('this town calm');
    expect(npcChipWant(helga)).not.toMatch(/Secret:|grandmother/i);
  });

  it('Follow-up / Ask-about chips use motive wants; bible seed never binds hooks', () => {
    const bible = getCampaignBibleById('cursed-keep');
    let state = createInitialState(undefined, 'dnd') as GameState;
    state = {
      ...state,
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      turn: 8,
      currentLocation: 'Greyhollow Graveyard',
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true },
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Father Aldous', 'Mayor Helga Brask'],
        props: [],
        lastBeat: '',
        updatedTurn: 8,
      },
    };
    state = seedBibleNpcRoster(state, bible);
    const aldous = state.npcMemories!.find((m) => /Aldous/i.test(m.npcName))!;
    const helga = state.npcMemories!.find((m) => /Helga/i.test(m.npcName))!;
    expect(aldous).toBeTruthy();
    expect(helga).toBeTruthy();
    expect(aldous.goal?.target ?? '').not.toMatch(/Moral anchor|Secret:|Confidant:|Obstacle:/i);
    expect(helga.goal?.target ?? '').not.toMatch(/Moral anchor|Secret:|Confidant:|Obstacle:/i);
    expect(isGmFacingNote(npcChipWant(aldous))).toBe(false);
    expect(isGmFacingNote(npcChipWant(helga))).toBe(false);

    state = {
      ...state,
      npcMemories: state.npcMemories!.map((m) =>
        /Aldous|Helga/i.test(m.npcName) ? { ...m, present: true, location: 'Greyhollow Graveyard' } : m
      ),
      openThreads: collectOpenThreads(state).map((t) =>
        t.kind === 'npc-goal' ? { ...t, lastSeenTurn: 0 } : t
      ),
      sceneThreadPlan: {
        plannedTurn: 8,
        forwardIds: [`npc-goal:${aldous.npcId}`],
      },
    };
    const follow = forwardThreadAffordance(state);
    expect(follow?.label ?? '').toMatch(/Follow up with Father Aldous/i);
    expect(follow?.label ?? '').not.toMatch(/Moral anchor|Secret:/i);

    const asks = collectSceneAffordances(state)
      .map((a) => a.label)
      .filter((l) => /Aldous|Helga/.test(l));
    expect(asks.every((l) => !/Moral anchor|Secret:/i.test(l))).toBe(true);
  });
});

describe('T10I Ask about the lead is not Check the mud', () => {
  it('actionMatchesObjective: Ask chip does not name the mud object', () => {
    const state = graveyard();
    const step = state.quests![0]!.objectives![0]!;
    expect(actionMatchesObjective(step, 'Ask Mayor Helga Brask about the lead')).toBe(false);
    expect(actionMatchesObjective(step, 'Examine the mud around the opened graves')).toBe(true);
  });

  it('Ask chip completes via person route without You-check-the-mud writer fact', () => {
    const state = graveyard();
    const ask = 'Ask Mayor Helga Brask about the lead';
    expect(findQuestTargets(state, ask).facts).toEqual([]);
    const turn = applyTabletopQuestTurn(state, ask, 'Greyhollow Graveyard');
    expect(turn.receipts.join(' ')).toMatch(/Quest stage: Quiet the Dead/);
    expect(turn.receipts.join(' ')).toMatch(/via Ask Mayor Helga Brask about the lead/);
    expect(turn.facts ?? []).toEqual([]);
    const fact = engineResultFact([...turn.receipts, ...(turn.facts ?? []), `Must narrate: ${ask}.`], 'dnd');
    expect(fact).not.toMatch(/You check the mud/i);
    expect(fact).toMatch(/Must narrate: Ask Mayor Helga Brask about the lead/);
  });
});

describe('T10I mixed free-text keeps every clause', () => {
  it('juggle clause is a separate step and reaches engineResult as Must narrate', () => {
    const state = graveyard({ turn: 8 });
    const line =
      "I solemnly salute the splintered coffins, tell Helga 'Your hand is shaking, shall I hold it?', and juggle three pebbles from the path.";
    const steps = parsePlayerSteps(line, sheetContextFromState(state));
    expect(steps.steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.steps.some((s) => /juggle/i.test(s.clause ?? ''))).toBe(true);

    const typed = resolveTypedFreeText(state, line);
    expect(typed.engineResult).toMatch(/Must narrate:.*juggle three pebbles/i);
    expect(typed.engineResult).toMatch(/Must narrate:.*salute|Must narrate:.*tell Helga/i);
  });
});

describe('T10I quest nudge is STATUS chrome, not a writer fact', () => {
  it('Nudge: Follow the cart tracks does not enter engineResultFact', () => {
    const nudge =
      "Nudge: word reaches you about Quiet the Dead: Follow the cart tracks toward the keep's lower bailey.";
    const ask = 'Must narrate: Ask Mayor Helga Brask about the lead. Speech event: you address Mayor Helga Brask.';
    const fact = engineResultFact([nudge, ask], 'dnd');
    expect(fact).not.toMatch(/^Nudge:|Follow the cart tracks/i);
    expect(fact).toMatch(/Must narrate: Ask Mayor Helga Brask about the lead/);
  });
});
