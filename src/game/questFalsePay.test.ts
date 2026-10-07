/**
 * s75 N — wrong main quest, paid for nothing. The grain-ship card keeps the generic starter; a bound
 * search / inspect / travel line is not a talk topic and never moves a quest step; the step label is a
 * whole clause; a pin that is not a settlement keeps its place; the xp_gain voice follows paid XP.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { formatArcStatusReceipts, runArcDirectorBeforeGm, xpGainVoiceAside } from './arcDirector';
import { nudgeIfStuck } from './choiceRanking';
import { applySandboxXpAwards } from './sandboxXp';
import { applyBiomeSaneQuestSites, revealLocalStarterQuest } from './questPlay';
import { instantiateWorldAtlas } from './worldAtlas';
import { pickStatusVoiceLine } from './voiceCadenceSystem';
import { getWorldOutlineById } from '@/data/worldOutlines';
import {
  LITRPG_MAIN_SPINES,
  hookCtxFromState,
  spineToStarterQuest,
  withMatchedLitRpgSpine,
} from '@/data/quests/litrpgMainSpines';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState, Quest } from './types';

type Card = { location: string; faction?: string; page1?: string; fallback?: string };
const cards = (summonedPact.openingHooks ?? []) as unknown as Card[];
const grainCard = cards.find((h) => /grain-ship/.test(h.location))!;
const SMUGGLERS = 'Smugglers who stole a Scale rite';

const caravanSpine = LITRPG_MAIN_SPINES.find((s) => s.spineId === 'hollow-transit-glitch')!;

function caravanQuest(): Quest {
  const seed = spineToStarterQuest(caravanSpine);
  return {
    id: seed.id,
    name: seed.title,
    description: seed.description,
    status: 'active',
    type: 'main',
    revealed: true,
    location: seed.location,
    objectives: seed.objectives.map((d, i) => ({ id: `${seed.id}-obj-${i + 1}`, description: d, completed: false })),
  };
}

function inTheHold(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 's75',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Jax', level: 1 },
    currentLocation: grainCard.location,
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    companions: [],
    log: [],
    turn: 3,
    quests: [caravanQuest()],
    arcDirector: { committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'], turnsSinceCombatReceipt: 0 },
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      aloneArrival: false,
      castNpcIds: [],
      pickedHook: grainCard.page1,
      pickedHookFallback: grainCard.fallback,
      answers: { ...(s.openingEstablishment?.answers ?? {}), name: 'Jax', where: grainCard.location },
    } as GameState['openingEstablishment'],
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present: [SMUGGLERS] },
    ...over,
  } as GameState;
}

const LINES = ['Who are you', 'Search the area', 'Inspect the immediate surroundings', 'Travel toward Lowmarket'];

function playLines(start: GameState) {
  let state = start;
  const xpNotes: string[] = [];
  for (const line of LINES) {
    const before = state;
    const arc = runArcDirectorBeforeGm(state, line);
    const paid = applySandboxXpAwards(arc.state, {
      playerAction: line,
      locationName: arc.state.currentLocation,
      previousLocationName: before.currentLocation,
      questsBefore: before.quests ?? [],
      questsAfter: arc.state.quests ?? [],
      events: [],
      turn: (before.turn ?? 0) + 1,
    });
    xpNotes.push(...paid.notes);
    state = { ...arc.state, turn: (arc.state.turn ?? 0) + 1 } as GameState;
  }
  return { state, xpNotes };
}

describe('s75 N — wrong quest and the free quest XP', () => {
  it('grain-ship card on summoned-pact keeps the generic starter, no caravan text', () => {
    const st = {
      campaignBibleId: 'summoned-pact',
      seed: 's75',
      currentLocation: grainCard.location,
      openingEstablishment: { pickedHook: grainCard.page1, pickedHookFallback: grainCard.fallback },
    };
    const seeds = withMatchedLitRpgSpine(summonedPact.starterQuests ?? [], hookCtxFromState(st));
    const quests = revealLocalStarterQuest([], seeds);
    const main = quests.find((q) => q.revealed && q.status === 'active' && q.type === 'main');
    expect(main?.id).not.toBe('sp-spine-hollow-transit-glitch');
    expect(quests.some((q) => q.id === 'sp-spine-hollow-transit-glitch')).toBe(false);
    for (const q of quests) {
      const text = [q.name, q.description, q.location, ...(q.objectives ?? []).map((o) => o.description)].join(' ');
      expect(text).not.toMatch(/Elara|wagon|caravan|highwaym[ae]n/i);
    }
  });

  it('only the smugglers here: who / search / inspect / travel never advance the caravan step or pay', () => {
    for (const start of [
      inTheHold(),
      inTheHold({
        arcDirector: {
          committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'],
          turnsSinceCombatReceipt: 0,
          npcTopics: { 'smugglers-who-stole-a-scale-rite': ['generic:environment', 'search:area', 'inspect:ground'] },
        },
      }),
    ]) {
      const { state, xpNotes } = playLines(start);
      const q = state.quests!.find((x) => x.id === 'sp-spine-hollow-transit-glitch')!;
      expect(q.objectives![0]!.completed).toBe(false);
      expect(Object.values(state.arcDirector?.topicCommits ?? {})).not.toContain('questStageAdvanced');
      expect(xpNotes.some((n) => /quest step/i.test(n))).toBe(false);
    }
  });

  it('a long objective is labelled whole, never cut mid-word', () => {
    const before = inTheHold();
    const done = before.quests!.map((q) => ({
      ...q,
      objectives: q.objectives!.map((o) => ({ ...o, completed: true })),
    }));
    const paid = applySandboxXpAwards(before, {
      playerAction: 'Press the attack',
      locationName: before.currentLocation,
      previousLocationName: before.currentLocation,
      questsBefore: before.quests ?? [],
      questsAfter: done,
      events: [],
      turn: 4,
    });
    const note = paid.notes.find((n) => /quest step:/.test(n))!;
    expect(note).toContain(`quest step: ${caravanSpine.firstObjective.replace(/\.$/, '')})`);
  });

  it('a quest pinned at Moving Caravan Wagon keeps its place; a quest with every step done gets no nudge', () => {
    const atlas = instantiateWorldAtlas(getWorldOutlineById('grid-metro')!);
    const state = { ...inTheHold(), worldAtlas: atlas } as GameState;
    const kept = applyBiomeSaneQuestSites(state, [caravanQuest()]);
    expect(kept[0]!.location).toBe('Moving Caravan Wagon');

    const doneQuest = { ...caravanQuest(), objectives: caravanQuest().objectives!.map((o) => ({ ...o, completed: true })) };
    const stuck = {
      ...inTheHold({ quests: [doneQuest], turn: 15 }),
      circling: { lastProgressTurn: 10, nudgeCursor: 2 },
    } as unknown as GameState;
    for (let cursor = 0; cursor < 5; cursor += 1) {
      const nudge = nudgeIfStuck({ ...stuck, circling: { ...stuck.circling!, nudgeCursor: cursor } } as GameState);
      expect(nudge.receipts.join(' ')).not.toMatch(/Accidental Passenger|Moving Caravan Wagon|word reaches you/i);
    }
  });

  it('orient on a bearings search and a skirmish that only parks a foe: no xp_gain voice when nothing was paid', () => {
    const cases: Array<{ state: GameState; input: string; beat: string }> = [
      {
        state: inTheHold({ turn: 3, arcDirector: { committedBeatIds: [], turnsSinceCombatReceipt: 0 } }),
        input: 'Search the area',
        beat: 'sp-beat-orient',
      },
      {
        state: inTheHold({
          turn: 21,
          sandboxAwardKeys: ['achv:first-steps', 'discover-hub:sp-hub-lowmarket'],
          currentLocation: 'Lowmarket',
          sceneFacts: { ...inTheHold().sceneFacts!, present: ['Osric Coyne'] },
          arcDirector: { committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'], turnsSinceCombatReceipt: 21 },
        }),
        input: 'Look around',
        beat: 'sp-beat-skirmish',
      },
    ];
    for (const { state, input, beat } of cases) {
      const xpLine = pickStatusVoiceLine(state, 'xp_gain')?.line;
      expect(xpLine).toBeTruthy();
      const arc = runArcDirectorBeforeGm(state, input);
      expect(arc.beatId).toBe(beat);
      const paid = applySandboxXpAwards(arc.state, {
        playerAction: input,
        locationName: arc.state.currentLocation,
        previousLocationName: state.currentLocation,
        questsBefore: state.quests ?? [],
        questsAfter: arc.state.quests ?? [],
        events: [],
        turn: (state.turn ?? 0) + 1,
      });
      expect(paid.xp).toBe(0);
      const voice = xpGainVoiceAside(arc.state, paid.xp);
      const status = [...formatArcStatusReceipts(arc), ...paid.notes, ...(voice.line ? [voice.line] : [])];
      expect(status).not.toContain(xpLine);
    }
  });
});
