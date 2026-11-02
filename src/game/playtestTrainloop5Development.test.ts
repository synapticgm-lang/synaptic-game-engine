/**
 * TRAINLOOP5 — tabletop broken-crown-keep s8114 LOOP STOP:
 * Director "no development available" + unbound Answer / Change the subject
 * while Search / Follow-up re-offered with no forward exit.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { compileChoices } from './choiceCompiler';
import { isLegalEnginePad } from './choicePipeline';
import {
  applyDirectorChipPolicy,
  directorNudgeIfStuck,
  planDirector,
  STALL_N,
} from './director';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { collectOpenThreads } from './openThreads';
import { seat } from './presentAuthority';
import { peopleHere } from './scenePresence';
import { collectSceneAffordances } from './sceneAffordances';
import { commitOfferedPad } from './playTranscript';
import type { GameState, Quest } from './types';

function ernostStall(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  const quest: Quest = {
    id: 'gen-lgm-skeleton-crypt-33',
    name: "Elara Locke's charge",
    description: 'Skeletons stir in a crypt',
    status: 'active',
    type: 'side',
    giver: 'Elara Locke',
    location: 'Ernost gatehouse',
    leadsTo: 'Ernost gatehouse',
    revealed: true,
    objectives: [
      {
        id: 'gen-lgm-skeleton-crypt-33-obj-1',
        description: 'Learn where the Skeleton threatens Ernost gatehouse',
        completed: true,
        placeId: 'Ernost gatehouse',
      },
      {
        id: 'gen-lgm-skeleton-crypt-33-obj-2',
        description: 'Confront the Skeleton',
        completed: true,
        placeId: 'Ernost gatehouse',
      },
      {
        id: 'gen-lgm-skeleton-crypt-33-obj-3',
        description: 'Report back to Elara Locke',
        completed: false,
        placeId: 'Ernost gatehouse',
        routes: [
          {
            id: 'gen-lgm-skeleton-crypt-33-s3-place',
            kind: 'place',
            label: 'Search Ernost gatehouse for signs',
            entityId: 'place:Ernost gatehouse',
            placeId: 'Ernost gatehouse',
          },
          {
            id: 'gen-lgm-skeleton-crypt-33-s3-study',
            kind: 'study',
            label: 'Study the report',
            entityId: 'study:gen-lgm-skeleton-crypt-33-s3',
          },
        ],
      },
    ],
  };
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'broken-crown-keep',
    seed: '8114',
    turn: 40,
    currentLocation: 'Ernost gatehouse',
    discoveredLocations: ['place_where-this-tale-opens', 'Gatehouse Steps', 'Ernost gatehouse'],
    places: [
      {
        id: 'place_gatehouse-steps',
        name: 'Gatehouse Steps',
        regionId: 'bc',
        arcStatus: 'open',
        exits: ['Ernost gatehouse'],
      },
      {
        id: 'place_ernost-gatehouse',
        name: 'Ernost gatehouse',
        regionId: 'bc',
        arcStatus: 'closed',
        closed: true,
        exits: [],
        lastVisitedTurn: 40,
      },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    character: { ...s.character, name: 'Jax', hp: 1, maxHp: 9 },
    quests: [quest],
    npcMemories: [
      {
        npcId: 'giver-elara-locke',
        npcName: 'Elara Locke',
        disposition: 'neutral',
        facts: ['Quest accepted — left T23'],
        lastSeenTurn: 23,
        present: false,
        shouldExit: true,
        exitReason: 'quest-accepted',
        location: 'Ernost gatehouse',
        goal: { motivation: 'Protection', target: 'the job they need done' },
        need: 'someone to take the job',
        offer: 'a paid job',
      },
      {
        npcId: 'town-the-innkeep',
        npcName: 'the innkeep',
        disposition: 'unknown',
        facts: [],
        lastSeenTurn: 39,
        present: false,
        shouldExit: true,
        exitReason: 'stall-pressure',
        location: 'Ernost gatehouse',
        goal: { motivation: 'Comfort', target: 'their house and guests' },
        need: 'order under their roof',
        offer: 'lodging and a hearing',
      },
    ],
    sceneFacts: {
      ...emptySceneFacts(40),
      present: [],
      crowd: 'none',
      crowdCount: 0,
      searchedEmpty: ['loc:ernost gatehouse'],
    },
    circling: {
      stale: { 'ernost gatehouse': { search: 30, other: 30 } },
      lastProgressTurn: 35,
      visits: { 'ernost gatehouse': 1 },
      tried: {
        'ernost gatehouse': {
          'follow up with the innkeep their house and guests': 40,
          'search ernost gatehouse for signs': 39,
        },
      },
      recentPlaces: ['ernost gatehouse'],
      recentFamilies: ['other', 'search', 'other'],
      lastLocation: 'Ernost gatehouse',
      openingPlace: 'Ernost gatehouse',
      firedNudges: [
        "Nudge: word reaches you about Elara Locke's charge: Report back to Elara Locke.",
        'Must narrate: the innkeep presses their agenda: their house and guests.',
        "Must narrate: Elara Locke arrives and presses their agenda: Elara Locke's charge.",
      ],
      lastNudge: "Must narrate: Elara Locke arrives and presses their agenda: Elara Locke's charge.",
      nudgeCursor: 2,
      nudgedTurn: 36,
    },
    progressGovernor: {
      lastProgressTurn: 35,
      recentDeltas: [],
      turnsSinceProgress: STALL_N + 1,
    },
    directorStall: {
      last: { kind: 'npc-acting', target: 'giver-elara-locke' },
      history: [
        {
          kind: 'npc-acting',
          target: 'giver-elara-locke',
          fact: "Elara Locke arrives and presses their agenda: Elara Locke's charge.",
          turn: 38,
        },
        {
          kind: 'npc-acting',
          target: 'town-the-innkeep',
          fact: 'the innkeep presses their agenda: their house and guests.',
          turn: 39,
        },
        {
          kind: 'npc-acting',
          target: 'giver-elara-locke',
          fact: "Elara Locke arrives and presses their agenda: Elara Locke's charge.",
          turn: 40,
        },
      ],
      jobAsks: {},
    },
    ...over,
  } as GameState;
}

function openPlay(bibleId: string, seed = 8114): GameState {
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: ALL_CAMPAIGN_BIBLES.find((b) => b.id === bibleId)?.engineMode,
  });
  const stamped = stampOpening(state);
  return {
    ...stamped,
    openingEstablishment: {
      ...(stamped.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
      pending: [],
      complete: true,
      sceneWritten: true,
    },
  };
}

function hasForwardChip(labels: string[]): boolean {
  return labels.some(
    (c) =>
      /^Leave(?:\s+the\s+scene)?\b/i.test(c)
      || /^Travel\b/i.test(c)
      || /^Walk\b/i.test(c)
      || /^Pursue\b/i.test(c)
      || /^Face the threat$/i.test(c)
      || /^Answer\s+/i.test(c),
  );
}

describe('TRAINLOOP5 — Director development + unbound social (broken-crown s8114)', () => {
  it('seat clears shouldExit so Answer can bind to a present speakable NPC', () => {
    let state = ernostStall();
    expect(peopleHere(state).some((n) => /elara/i.test(n))).toBe(false);
    state = seat(state, 'Elara Locke');
    const mem = state.npcMemories?.find((m) => m.npcId === 'giver-elara-locke');
    expect(mem?.shouldExit, 'seat must clear exit flags').toBeFalsy();
    expect(peopleHere(state).some((n) => /elara/i.test(n))).toBe(true);
    const policy = applyDirectorChipPolicy(state, ['Answer Elara Locke', 'Leave the scene']);
    expect(policy.some((c) => /^Answer Elara Locke$/i.test(c))).toBe(true);
  });

  it('forced development never yields "no development available"; offers Travel/Leave', () => {
    const state = ernostStall({ turn: 42, circling: { ...ernostStall().circling!, nudgedTurn: 36 } });
    const nudged = directorNudgeIfStuck(state);
    expect(
      nudged.notes.some((n) => /no development available/i.test(n)),
      `notes=${nudged.notes.join(' | ')}`,
    ).toBe(false);
    expect(nudged.receipts.length, `receipts empty notes=${nudged.notes.join(' | ')}`).toBeGreaterThan(0);
    const planned = planDirector(nudged.state);
    const chips = (planned.plan.chips ?? []).map((c) => c.label);
    const policy = applyDirectorChipPolicy(planned.state, [
      ...chips,
      'Search Ernost gatehouse for signs',
      'Follow up with the innkeep: their house and guests',
      'Change the subject',
      'Answer Elara Locke',
      'Say something…',
      'Do something else…',
    ]);
    expect(
      hasForwardChip(policy),
      `broken-crown-keep:Ernost gatehouse: no forward chip pad=[${policy.join(' | ')}] plan=${chips.join(' | ')}`,
    ).toBe(true);
    expect(policy.some((c) => /^Change the subject$/i.test(c))).toBe(false);
    expect(
      policy.some((c) => /^Answer Elara Locke$/i.test(c)) && !peopleHere(planned.state).some((n) => /elara/i.test(n)),
      `Answer offered while Elara absent pad=[${policy.join(' | ')}]`,
    ).toBe(false);
  });

  it('planner and filter agree: unbound social chips are replaced, not offered-then-dropped', () => {
    const state = ernostStall();
    const planned = planDirector({
      ...state,
      progressGovernor: {
        ...(state.progressGovernor ?? { lastProgressTurn: 0, recentDeltas: [], turnsSinceProgress: STALL_N }),
        turnsSinceProgress: STALL_N,
      },
      sceneThreadPlan: undefined,
      directorPlan: undefined,
    });
    const planLabels = (planned.plan.chips ?? []).map((c) => c.label);
    for (const label of planLabels) {
      if (/^Answer\s+/i.test(label)) {
        const who = label.replace(/^Answer\s+/i, '').trim();
        expect(
          peopleHere(planned.state).some((n) => n.toLowerCase().includes(who.toLowerCase().slice(0, 5))),
          `plan Answer unbound: ${label} present=[${peopleHere(planned.state).join(',')}]`,
        ).toBe(true);
      }
      expect(/^Change the subject$/i.test(label), `plan injected Change the subject`).toBe(false);
    }
    const compiled = compileChoices(
      planned.state,
      ['Change the subject', 'Answer Elara Locke', 'Inspect the immediate surroundings'],
      undefined,
      'Look around',
    );
    expect(compiled.choices.some((c) => /^Change the subject$/i.test(c))).toBe(false);
    for (const label of compiled.choices) {
      if (/^Answer\s+/i.test(label) || /^Follow up with\b/i.test(label) || /^Press your standing\b/i.test(label)) {
        expect(
          isLegalEnginePad(label, planned.state) || peopleHere(planned.state).length > 0,
          `unbound social stayed: ${label}`,
        ).toBe(true);
      }
    }
    expect(hasForwardChip(compiled.choices), `compiled=[${compiled.choices.join(' | ')}]`).toBe(true);
  });

  it('exhausted Search HERE is not re-offered as a quest-route chip', () => {
    const state = ernostStall();
    const labels = collectSceneAffordances(state).map((a) => a.label);
    expect(
      labels.some((l) => /Search Ernost gatehouse for signs/i.test(l)),
      `searchedEmpty must starve Search; got=[${labels.join(' | ')}]`,
    ).toBe(false);
  });

  it('shouldExit NPCs do not keep open npc-goal Follow-up threads', () => {
    const state = ernostStall();
    const threads = collectOpenThreads(state);
    expect(threads.some((t) => t.id === 'npc-goal:town-the-innkeep')).toBe(false);
    expect(threads.some((t) => t.id === 'npc-goal:giver-elara-locke')).toBe(false);
  });

  it('SWEEP: premade openings keep development/exit and no unbound social after stall', () => {
    const holes: string[] = [];
    let worlds = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (!bible.engineMode || bible.engineMode === 'pyoa') continue;
      if (bible.id.startsWith('blank-canvas')) continue;
      worlds += 1;
      let opened: GameState;
      try {
        opened = openPlay(bible.id, 8114);
      } catch (err) {
        holes.push(`${bible.id}:open-failed:${(err as Error).message ?? err}`);
        continue;
      }
      const here = (opened.currentLocation ?? '').trim() || 'unknown';
      // Opening pad
      const pad0 = commitOfferedPad({ ...opened, offeredPad: null });
      const labels0 = pad0.offeredPad?.choices ?? [];
      for (const label of labels0) {
        if (/^Change the subject$/i.test(label)) {
          holes.push(`${bible.id}:${here}:unbound-social:${label}`);
        }
        if (/^Answer\s+/i.test(label) && !isLegalEnginePad(label, pad0)) {
          holes.push(`${bible.id}:${here}:unbound-offered:${label}`);
        }
      }
      // Simulated stall: spent leads / no progress
      let stalled: GameState = {
        ...opened,
        turn: (opened.turn ?? 0) + STALL_N + 2,
        progressGovernor: {
          lastProgressTurn: opened.turn ?? 0,
          recentDeltas: [],
          turnsSinceProgress: STALL_N + 2,
        },
        circling: {
          ...(opened.circling ?? {
            stale: {},
            lastProgressTurn: opened.turn ?? 0,
            visits: {},
            tried: {},
            recentPlaces: [],
            recentFamilies: [],
          }),
          lastProgressTurn: opened.turn ?? 0,
          nudgedTurn: undefined,
          firedNudges: [...(opened.circling?.firedNudges ?? [])],
        },
        sceneThreadPlan: undefined,
        directorPlan: undefined,
      };
      const nudged = directorNudgeIfStuck(stalled);
      if (nudged.notes.some((n) => /no development available/i.test(n))) {
        holes.push(`${bible.id}:${here}:no-development`);
      }
      stalled = nudged.state;
      const planned = planDirector(stalled);
      stalled = planned.state;
      if (!planned.plan.development?.fact && !nudged.receipts.length) {
        holes.push(`${bible.id}:${here}:empty-forced-dev`);
      }
      const policy = applyDirectorChipPolicy(stalled, [
        ...(planned.plan.chips ?? []).map((c) => c.label),
        'Change the subject',
        'Answer Nobody',
        'Say something…',
        'Do something else…',
      ]);
      if (policy.some((c) => /^Change the subject$/i.test(c))) {
        holes.push(`${bible.id}:${here}:change-subject-survived`);
      }
      if (policy.some((c) => /^Answer Nobody$/i.test(c))) {
        holes.push(`${bible.id}:${here}:answer-nobody`);
      }
      if (!hasForwardChip(policy) && !(planned.plan.chips ?? []).some((c) => hasForwardChip([c.label]))) {
        holes.push(
          `${bible.id}:${here}:no-forward chips=[${policy.join(' | ')}] plan=[${(planned.plan.chips ?? []).map((c) => c.label).join(' | ')}]`,
        );
      }
    }
    expect(worlds, 'expected premade worlds').toBeGreaterThan(8);
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });
});
