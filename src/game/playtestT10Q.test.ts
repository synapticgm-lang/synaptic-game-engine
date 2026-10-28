/**
 * T10Q — chip quality (fragments, absent objects, alias dupes) + stub travel/talk lines.
 * Evidence: Fate s5001 / s5002 / s5003 (2026-10-28).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory, Quest, TravelJourney } from './types';
import { collectSceneAffordances } from './sceneAffordances';
import { npcChipWant, forwardThreadAffordance, collectOpenThreads } from './openThreads';
import { resolveNpcRecord } from './npcRecords';
import { pickNpcSheet } from './npcSheet';
import { withMoveDestination } from './writerTurn';
import { buildCompletedEventPacket, classifyVerb, lastResortStoryBody } from './completedEventPacket';

function base(over: Partial<GameState> = {}): GameState {
  return {
    ...(createInitialState(undefined, over.engineMode ?? 'dnd') as GameState),
    character: { name: 'Jax', hp: 10, maxHp: 10, level: 1, xp: 0 },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    turn: 8,
    ...over,
  } as GameState;
}

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${over.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 0,
    aliases: [],
    ...over,
  } as NpcMemory;
}

describe('T10Q follow-up chips', () => {
  it('SheetPlace key is never a chip want (inn/town/…)', () => {
    const sheet = pickNpcSheet('Tilde Fenwick', 'inn', { campaignId: 'cursed-keep' });
    expect(sheet.goal?.target).not.toMatch(/^(?:inn|town|road|camp|cell|dungeon)$/i);
    const m = mem({
      npcName: 'Tilde Fenwick',
      goal: { motivation: 'Knowledge', target: 'inn' },
      need: 'a buyer who pays',
      motiveLines: ['I only want the common room quiet tonight'],
    });
    expect(npcChipWant(m)).toBe('the common room quiet tonight');
    expect(npcChipWant(m)).not.toBe('inn');
  });

  it('Follow-up is not offered beside Ask-about for the same person', () => {
    const venn = mem({
      npcName: 'Venn Scale',
      npcId: 'sp-npc-venn-scale',
      location: 'a Scale counting-house on Ledger Row',
      goal: { motivation: 'Knowledge', target: 'a secret worth selling' },
      need: 'a buyer who pays',
      roleHint: 'informant',
    });
    let state = base({
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'a Scale counting-house on Ledger Row',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Venn Scale'],
        props: [],
        lastBeat: '',
        updatedTurn: 8,
      },
      npcMemories: [venn],
    });
    const threads = collectOpenThreads(state);
    state = {
      ...state,
      openThreads: threads.map((t) =>
        t.kind === 'npc-goal' ? { ...t, lastSeenTurn: 0 } : t,
      ),
      sceneThreadPlan: {
        plannedTurn: 8,
        forwardIds: ['npc-goal:sp-npc-venn-scale'],
      },
    };
    const labels = collectSceneAffordances(state).map((a) => a.label);
    expect(labels.some((l) => /Ask Venn Scale about a secret worth selling/i.test(l))).toBe(true);
    expect(labels.some((l) => /Follow up with Venn Scale/i.test(l))).toBe(false);
  });

  it('Follow-up does not paste a spoken motive fragment', () => {
    const aldous = mem({
      npcName: 'Father Aldous',
      npcId: 'npc:Father Aldous',
      location: 'Midnight Well',
      goal: { motivation: 'Protection', target: 'this town to sleep easy again' },
      motiveLines: ['I only want this town to sleep easy again, myself included'],
    });
    const state = base({
      currentLocation: 'Midnight Well',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Father Aldous'],
        props: [],
        lastBeat: '',
        updatedTurn: 2,
      },
      npcMemories: [aldous],
      openThreads: collectOpenThreads(
        base({ npcMemories: [aldous], currentLocation: 'Midnight Well' }),
      ).map((t) => (t.kind === 'npc-goal' ? { ...t, lastSeenTurn: 0 } : t)),
      sceneThreadPlan: {
        plannedTurn: 2,
        forwardIds: ['agenda:npc:Father Aldous'],
      },
    });
    const follow = forwardThreadAffordance(state);
    expect(follow?.label).toBe('Follow up with Father Aldous');
    expect(follow?.label ?? '').not.toMatch(/sleep easy/i);
  });
});

describe('T10Q absent object + alias chips', () => {
  it('Examine the heavy bucket is not offered away from Midnight Well', () => {
    const quest = {
      id: 'ck-spine-midnight-well',
      name: 'The Tainted Waters',
      status: 'active',
      revealed: true,
      type: 'main',
      objectives: [
        {
          id: 'ck-spine-midnight-well-obj-1',
          description: 'Haul up the ruined, heavy bucket to examine the black sludge and severed rope.',
          completed: false,
          placeId: 'Midnight Well',
          object: 'the heavy bucket',
          routes: [
            {
              id: 'ck-spine-midnight-well-s1-place',
              kind: 'object',
              label: 'Examine the heavy bucket',
              entityId: 'object:the heavy bucket',
              placeId: 'Midnight Well',
            },
            {
              id: 'ck-spine-midnight-well-s1-study',
              kind: 'study',
              label: 'Study the clues',
              entityId: 'study:clues',
            },
          ],
        },
      ],
    } as Quest;
    const atInn = base({
      currentLocation: 'Greyhollow Inn',
      campaignBibleId: 'cursed-keep',
      quests: [quest],
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Edda Merrow'],
        props: [],
        lastBeat: '',
        updatedTurn: 6,
      },
      npcMemories: [
        mem({ npcName: 'Edda Merrow', location: 'Greyhollow Inn', npcId: 'town-edda-merrow' }),
      ],
    });
    const labels = collectSceneAffordances(atInn).map((a) => a.label);
    expect(labels.some((l) => /heavy bucket/i.test(l))).toBe(false);

    const atWell = {
      ...atInn,
      currentLocation: 'Midnight Well',
      npcMemories: [
        mem({ npcName: 'Father Aldous', location: 'Midnight Well', npcId: 'npc:Father Aldous' }),
      ],
      sceneFacts: { ...atInn.sceneFacts!, present: ['Father Aldous'] },
    };
    expect(collectSceneAffordances(atWell).some((a) => /heavy bucket/i.test(a.label))).toBe(true);
  });

  it('Look around this arrival is not offered when placeId is not HERE', () => {
    const quest = {
      id: 'sp-quest-1',
      name: "The Circle's Price",
      status: 'active',
      revealed: true,
      type: 'main',
      objectives: [
        {
          id: 'sp-quest-1-obj-1',
          description: 'Get your bearings in this arrival (floor, cell, camp, or vault)',
          completed: false,
          placeId: 'Sevenfold Circle',
          routes: [
            {
              id: 'sp1-bear-place',
              kind: 'place',
              label: 'Look around this arrival',
              entityId: 'place:arrival',
              placeId: 'Sevenfold Circle',
            },
            {
              id: 'sp1-bear-system',
              kind: 'system',
              label: 'Ping the System for bearings',
              entityId: 'system:bearings',
            },
          ],
        },
      ],
    } as Quest;
    const state = base({
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'a Scale counting-house on Ledger Row',
      quests: [quest],
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Venn Scale'],
        props: [],
        lastBeat: '',
        updatedTurn: 8,
      },
      npcMemories: [
        mem({
          npcName: 'Venn Scale',
          npcId: 'sp-npc-venn-scale',
          location: 'a Scale counting-house on Ledger Row',
          aliases: ['Auditor Venn Scale'],
        }),
      ],
    });
    const labels = collectSceneAffordances(state).map((a) => a.label);
    expect(labels.some((l) => /Look around this arrival/i.test(l))).toBe(false);
  });

  it('Read/Analyze chips dedupe Venn Scale vs Auditor Venn to one entity', () => {
    const state = base({
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'a Scale counting-house on Ledger Row',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Venn Scale', 'Auditor Venn'],
        props: [],
        lastBeat: '',
        updatedTurn: 4,
      },
      npcMemories: [
        mem({
          npcName: 'Venn Scale',
          npcId: 'sp-npc-venn-scale',
          location: 'a Scale counting-house on Ledger Row',
          aliases: ['Auditor Venn Scale'],
        }),
      ],
    });
    expect(resolveNpcRecord(state, 'Auditor Venn')?.npcName).toBe('Venn Scale');
    const reads = collectSceneAffordances(state)
      .map((a) => a.label)
      .filter((l) => /^(?:Read|Analyze)\b/i.test(l));
    expect(reads.filter((l) => /Venn/i.test(l))).toEqual(['Read Venn Scale', 'Analyze Venn Scale']);
  });
});

describe('T10Q stub scene lines', () => {
  it('streets travel prepend is through the town, not back streets', () => {
    const journey = {
      from: 'Midnight Well',
      to: 'Greyhollow Inn',
      ground: 'Back streets',
      terrain: 'streets',
      legsDone: 1,
      legsTotal: 2,
    } as TravelJourney;
    const state = {
      ...base({
        turn: 5,
        journey,
        currentLocation: 'On the road between places',
      }),
      circling: { movedTurn: 5, stale: 0, lastProgressTurn: 5 },
    } as unknown as GameState;
    const prose = 'Night settled over the streets.';
    const out = withMoveDestination(state, prose);
    expect(out).toBe(`Jax headed toward Greyhollow Inn through the town. ${prose}`);
    expect(out).not.toMatch(/back streets/i);
  });

  it('Analyze last-resort is not answers-you want stub', () => {
    expect(classifyVerb('Analyze Venn Scale')).toBe('inspected');
    const state = base({
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'a Scale counting-house on Ledger Row',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Venn Scale'],
        props: [],
        lastBeat: '',
        updatedTurn: 9,
      },
      npcMemories: [
        mem({
          npcName: 'Venn Scale',
          npcId: 'sp-npc-venn-scale',
          location: 'a Scale counting-house on Ledger Row',
        }),
      ],
    });
    const packet = buildCompletedEventPacket(state, 'Analyze Venn Scale');
    const page = lastResortStoryBody(state, packet, 'Analyze Venn Scale');
    expect(page.prose).not.toMatch(/answers you/i);
    expect(page.prose).not.toMatch(/Venn Scale answers/i);
  });
});
