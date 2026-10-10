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
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { isReasonedXpLine, reconcileXpStatusLines } from './systemLog';
import { clampSystemHousing, type SystemPartId } from './systemHousing';

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
    systemHousing: clampSystemHousing({ housing: 'private_window', parts: {} as Record<SystemPartId, boolean> }),
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
    const after = commitTalkStageAfterTurn(arc.state, nellSpoke, 19, PICK);

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
    const heard = commitTalkStageAfterTurn(arc.state, handlerSpoke, 19, PICK);
    expect(heard.receipts).toEqual(['Quest: The Summons’ Price: reason heard (stage 2)']);
    expect(heard.state.quests![0]!.objectives![1]!.completed).toBe(true);
    expect(stageTx(heard.state)).toHaveLength(1);
    expect(stageTx(heard.state)[0]!.turn).toBe(19);

    const xp = xpFor(state, heard.state);
    expect(questStepNotes(xp.notes)).toHaveLength(1);
    expect(questStepNotes(xp.notes)[0]).toMatch(/^XP Gained: 50 \(quest step: Hear their reason/);

    const again = commitTalkStageAfterTurn({ ...heard.state, turn: 19 }, handlerSpoke, 20, PICK);
    expect(again.receipts).toEqual([]);
    expect(stageTx(again.state)).toHaveLength(1);
  });

  it('player words alone never complete it, even with the handler here', () => {
    const state = jax(FESTIVAL, []);
    const arc = runArcDirectorBeforeGm(state, PICK);
    const after = commitTalkStageAfterTurn(arc.state, [], 19, PICK);
    expect(after.state.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(stageTx(after.state)).toEqual([]);
  });

  it('the hear-reason chip shows once the handler is here', () => {
    expect(storyChip(jax('Cathedral Close', ['Nell Rudd', 'the handler']))).toBe(PICK);
  });
});

describe('s79 Root B — a talk stage pays only when the turn is about it', () => {
  const housed = (s: GameState): GameState => ({
    ...s,
    systemHousing: clampSystemHousing({ housing: 'private_window', parts: {} as Record<SystemPartId, boolean> }),
  });
  /** Seed 79 at T5: bearings done at the ledger stair, Ila Pellane here, the reason not yet heard. */
  function seed79Stage(): { state: GameState; questId: string; idx: number } {
    const { state: built } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 79, personality: 'cold-system' });
    const s = housed(stampOpening(built));
    const q = (s.quests ?? []).find((x) => (x.objectives ?? []).some((o) => /Hear their reason/.test(o.description)))!;
    const idx = q.objectives!.findIndex((o) => /Hear their reason/.test(o.description));
    const quests = (s.quests ?? []).map((x) =>
      x.id !== q.id
        ? x
        : { ...x, revealed: true, status: 'active' as const, objectives: x.objectives!.map((o, i) => (i < idx ? { ...o, completed: true } : o)) }
    );
    return {
      state: { ...s, turn: 5, quests, arcDirector: { ...(s.arcDirector ?? {}), committedBeatIds: ['sp-beat-orient'] } },
      questId: q.id,
      idx,
    };
  }
  const ila = (words: string): SpokenLine[] => [{ speakerId: 'cast:ila-pellane', speaker: 'Ila Pellane', words }];
  const done = (s: GameState, id: string, idx: number) => s.quests!.find((x) => x.id === id)!.objectives![idx]!.completed;

  it('"Turn back toward the ledger stair" with Ila saying "You came back." completes nothing, no receipt, no XP', () => {
    const { state, questId, idx } = seed79Stage();
    const input = 'Turn back toward the ledger stair';
    const arc = runArcDirectorBeforeGm(state, input);
    const after = commitTalkStageAfterTurn(arc.state, ila('You came back.'), 6, input);
    expect(after.receipts).toEqual([]);
    expect(done(after.state, questId, idx)).toBe(false);
    expect(stageTx(after.state)).toEqual([]);
    const xp = applySandboxXpAwards(after.state, {
      playerAction: input,
      locationName: after.state.currentLocation,
      previousLocationName: state.currentLocation,
      questsBefore: state.quests ?? [],
      questsAfter: after.state.quests ?? [],
      events: [],
      turn: 6,
    });
    expect(questStepNotes(xp.notes)).toEqual([]);
  });

  it('"Ask what they want" with Ila giving the card\'s want completes the stage once, and its XP line prints', () => {
    const { state, questId, idx } = seed79Stage();
    const input = 'Ask what they want';
    const arc = runArcDirectorBeforeGm(state, input);
    const want = ila('The pikes need a name on the blank before they let a stranger through the Palace gate.');
    const heard = commitTalkStageAfterTurn(arc.state, want, 6, input);
    expect(heard.receipts).toHaveLength(1);
    expect(done(heard.state, questId, idx)).toBe(true);
    expect(commitTalkStageAfterTurn({ ...heard.state, turn: 6 }, want, 7, input).receipts).toEqual([]);
    const xp = applySandboxXpAwards(heard.state, {
      playerAction: input,
      locationName: heard.state.currentLocation,
      previousLocationName: state.currentLocation,
      questsBefore: state.quests ?? [],
      questsAfter: heard.state.quests ?? [],
      events: [],
      turn: 6,
    });
    const step = questStepNotes(xp.notes);
    expect(step).toHaveLength(1);
    expect(reconcileXpStatusLines([], step)).toEqual(step);
  });

  it('an XP line whose reason holds brackets is kept', () => {
    const line = 'XP Gained: 50 (quest step: Hear their reason (or demand it))';
    expect(isReasonedXpLine(line)).toBe(true);
    expect(reconcileXpStatusLines([], [line])).toEqual([line]);
    expect(isReasonedXpLine('XP Gained: 50')).toBe(false);
    expect(isReasonedXpLine('XP Gained: 50 ()')).toBe(false);
  });

  it('every XP note sandboxXp pays for a Summoned Pact starter step passes isReasonedXpLine', () => {
    const { state } = seed79Stage();
    const quests = state.quests ?? [];
    let checked = 0;
    for (const q of quests) {
      (q.objectives ?? []).forEach((_, i) => {
        const after = quests.map((x) =>
          x.id !== q.id ? x : { ...x, objectives: x.objectives!.map((o, j) => (j === i ? { ...o, completed: true } : o)) }
        );
        const xp = applySandboxXpAwards({ ...state, quests: after }, {
          playerAction: 'Ask what they want',
          locationName: state.currentLocation,
          previousLocationName: state.currentLocation,
          questsBefore: quests.map((x) =>
            x.id !== q.id ? x : { ...x, objectives: x.objectives!.map((o, j) => (j === i ? { ...o, completed: false } : o)) }
          ),
          questsAfter: after,
          events: [],
          turn: 6,
        });
        for (const note of xp.notes.filter((n) => /^XP Gained/i.test(n))) {
          checked += 1;
          expect(isReasonedXpLine(note), note).toBe(true);
        }
      });
    }
    expect(checked).toBeGreaterThan(0);
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
