/**
 * s74 M — a talk-stage objective pays only when its giver is here and the giver's own committed speech
 * is on the turn. Player words alone never complete it; the chip waits for the giver; the starter quest
 * fits the opening card.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTalkStageAfterTurn, runArcDirectorBeforeGm } from './arcDirector';
import { storyChip } from './choiceRanking';
import { applySandboxXpAwards } from './sandboxXp';
import { revealLocalStarterQuest, seedLocalStarterQuest } from './questPlay';
import { hookCtxFromState, withMatchedLitRpgSpine } from '@/data/quests/litrpgMainSpines';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { SpokenLine } from './tokenProse';
import type { GameState, NpcMemory, Quest } from './types';

const PICK = 'Hear their reason (or demand it)';
const FESTIVAL = 'Valespire peace-festival square';
type Card = { location: string; page1?: string; fallback?: string };
const cards = (summonedPact.openingHooks ?? []) as unknown as Card[];
const festivalCard = cards.find((h) => h.location === FESTIVAL)!;
const circleCard = cards.find((h) => h.location === 'The Sevenfold Circle under bombardment')!;

const person = (npcName: string, location: string): NpcMemory =>
  ({
    npcId: npcName.toLowerCase().replace(/\s+/g, '-'),
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 17,
    met: true,
    introSpoken: true,
    location,
  }) as NpcMemory;

const quest = (): Quest => ({
  id: 'sp-quest-1',
  name: 'The Summons’ Price',
  description: 'You have just been summoned. Hear why they pulled you here.',
  status: 'active',
  type: 'main',
  revealed: true,
  location: 'Cathedral Close',
  objectives: [
    { id: 'sp-quest-1-obj-1', description: 'Get your bearings in this arrival (floor, cell, camp, or vault)', completed: true },
    { id: 'sp-quest-1-obj-2', description: PICK, completed: false },
    { id: 'sp-quest-1-obj-3', description: 'Choose: swear, refuse, or delay', completed: false },
  ],
});

function jax(at: string, present: string[]): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed74',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Jax', level: 1 },
    currentLocation: at,
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    companions: [],
    log: [],
    turn: 18,
    quests: [quest()],
    npcMemories: [person('Nell Rudd', 'Cathedral Close'), person('Col Thatch', 'Cathedral Close')],
    arcDirector: { committedBeatIds: ['sp-beat-orient'], turnsSinceCombatReceipt: 0 },
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      aloneArrival: false,
      castNpcIds: [],
      pickedHook: festivalCard.page1,
      pickedHookFallback: festivalCard.fallback,
      answers: { ...(s.openingEstablishment?.answers ?? {}), name: 'Jax', where: FESTIVAL },
    } as GameState['openingEstablishment'],
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present },
  } as GameState;
}

const stageTx = (s: GameState) => (s.stateTxLog ?? []).filter((t) => t.kind === 'quest_stage');
const questStepNotes = (notes: string[]) => notes.filter((n) => /quest step: Hear their reason/.test(n));

function xpFor(before: GameState, after: GameState) {
  return applySandboxXpAwards(after, {
    playerAction: PICK,
    locationName: after.currentLocation,
    previousLocationName: before.currentLocation,
    questsBefore: before.quests ?? [],
    questsAfter: after.quests ?? [],
    events: [],
    turn: 19,
  });
}

describe('s74 M — talk stage needs its giver', () => {
  it('Cathedral Close with Nell Rudd and Col Thatch, no handler: the pick pays nothing and no chip offers it', () => {
    const state = jax('Cathedral Close', ['Nell Rudd', 'Col Thatch']);
    expect(storyChip(state)).not.toBe(PICK);

    const arc = runArcDirectorBeforeGm(state, PICK);
    const nellSpoke: SpokenLine[] = [
      { speakerId: 'extra:nell-rudd', speaker: 'Nell Rudd', words: 'The church stopped paying our bread. That is my reason.' },
    ];
    const after = commitTalkStageAfterTurn(arc.state, nellSpoke, 19);

    expect(after.receipts).toEqual([]);
    expect(after.state.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(stageTx(after.state)).toEqual([]);
    const xp = xpFor(state, after.state);
    expect(questStepNotes(xp.notes)).toEqual([]);
    expect(xp.xp).toBe(xpFor(state, state).xp);
    expect(storyChip(after.state)).not.toBe(PICK);
  });

  it('with the handler here and a committed handler line, the same pick completes the stage once with quest-step XP', () => {
    const state = jax(FESTIVAL, []);
    const arc = runArcDirectorBeforeGm(state, PICK);
    expect(arc.state.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(stageTx(arc.state)).toEqual([]);

    const handlerSpoke: SpokenLine[] = [
      { speakerId: 'role:handler', speaker: 'the handler', words: 'We called for a named savior and the rite caught you instead.' },
    ];
    const heard = commitTalkStageAfterTurn(arc.state, handlerSpoke, 19);
    expect(heard.receipts).toEqual(['Quest: The Summons’ Price: reason heard (stage 2)']);
    expect(heard.state.quests![0]!.objectives![1]!.completed).toBe(true);
    expect(stageTx(heard.state)).toHaveLength(1);
    expect(stageTx(heard.state)[0]!.turn).toBe(19);

    const xp = xpFor(state, heard.state);
    expect(questStepNotes(xp.notes)).toHaveLength(1);
    expect(questStepNotes(xp.notes)[0]).toMatch(/^XP Gained: 50 \(quest step: Hear their reason/);

    const again = commitTalkStageAfterTurn({ ...heard.state, turn: 19 }, handlerSpoke, 20);
    expect(again.receipts).toEqual([]);
    expect(stageTx(again.state)).toHaveLength(1);
  });

  it('player words alone never complete it, even with the handler here', () => {
    const state = jax(FESTIVAL, []);
    const arc = runArcDirectorBeforeGm(state, PICK);
    const after = commitTalkStageAfterTurn(arc.state, [], 19);
    expect(after.state.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(stageTx(after.state)).toEqual([]);
  });

  it('the hear-reason chip shows once the handler is here', () => {
    expect(storyChip(jax('Cathedral Close', ['Nell Rudd', 'the handler']))).toBe(PICK);
  });
});

describe('s74 M — starter quest fits the opening card', () => {
  const starter = (card: Card) => {
    const st = {
      campaignBibleId: 'summoned-pact',
      seed: 'seed74',
      currentLocation: card.location,
      openingEstablishment: { pickedHook: card.page1, pickedHookFallback: card.fallback },
    };
    const seeds = withMatchedLitRpgSpine(summonedPact.starterQuests ?? [], hookCtxFromState(st));
    return {
      seeded: seedLocalStarterQuest([], seeds).find((q) => q.id === 'sp-quest-1')!,
      revealed: revealLocalStarterQuest([], seeds).find((q) => q.revealed)!,
    };
  };

  it("a festival-square opening's starter is not 'The Circle's Price'", () => {
    const { seeded, revealed } = starter(festivalCard);
    expect(seeded.name).not.toMatch(/Circle.s Price/);
    expect(seeded.description).not.toMatch(/Pellane|circle/i);
    expect(revealed.name).not.toMatch(/Circle.s Price/);
  });

  it('a circle opening keeps it', () => {
    expect(starter(circleCard).seeded.name).toBe('The Circle’s Price');
  });
});
