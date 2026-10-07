/**
 * Alone start has no giver, so the hear-reason talk stage is not left open: the alone quest's own step
 * runs under the plain quest_stage rule. The orient receipt and the pending hear-reason fact take the live
 * quest's own name and step, not a fixed Circle's Price / Pellane string.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { runArcDirectorBeforeGm } from './arcDirector';
import { contractsForState } from './beatContract';
import { isTalkStageObjective, talkStageGiver } from './questGiver';
import { buildSealedManifest } from './sealedManifest';
import { seedLocalStarterQuest } from './questPlay';
import { hookCtxFromState, withMatchedLitRpgSpine } from '@/data/quests/litrpgMainSpines';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState, Quest } from './types';

type Card = { location: string; page1?: string; fallback?: string };
const cards = (summonedPact.openingHooks ?? []) as unknown as Card[];
const FESTIVAL = 'Valespire peace-festival square';
const festivalCard = cards.find((h) => h.location === FESTIVAL)!;
const circleCard = cards.find((h) => h.location === 'The Sevenfold Circle under bombardment')!;

function starterQuest(card: Card, alone: boolean): Quest {
  const st = {
    campaignBibleId: 'summoned-pact',
    seed: 'seed-alone',
    currentLocation: card.location,
    openingEstablishment: { pickedHook: card.page1, pickedHookFallback: card.fallback },
  };
  const seeds = withMatchedLitRpgSpine(summonedPact.starterQuests ?? [], hookCtxFromState(st));
  const q = seedLocalStarterQuest([], seeds, alone).find((x) => x.id === 'sp-quest-1')!;
  return { ...q, status: 'active', revealed: true };
}

function play(opts: {
  location: string;
  hook?: string;
  fallback?: string;
  alone: boolean;
  quest: Quest;
  turn: number;
  committed: string[];
}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed-alone',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Jax', level: 1 },
    currentLocation: opts.location,
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    companions: [],
    log: [],
    turn: opts.turn,
    quests: [opts.quest],
    npcMemories: [],
    arcDirector: { committedBeatIds: opts.committed, turnsSinceCombatReceipt: 0 },
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      aloneArrival: opts.alone,
      castNpcIds: [],
      pickedHook: opts.hook,
      pickedHookFallback: opts.fallback,
      answers: { ...(s.openingEstablishment?.answers ?? {}), name: 'Jax', where: opts.location },
    } as GameState['openingEstablishment'],
    sceneFacts: { ...s.sceneFacts!, crowd: opts.alone ? 'empty' : 'present', present: [] },
  } as GameState;
}

const ALONE_HOOK =
  'You come to alone on the cracked floor of a ruined bathhouse. No one is here. A blue panel hangs in the air.';

function aloneState(turn: number): GameState {
  const quest = starterQuest({ location: 'a ruined bathhouse' }, true);
  quest.objectives = (quest.objectives ?? []).map((o, i) => (i === 0 ? { ...o, completed: true } : o));
  return play({
    location: 'a ruined bathhouse',
    hook: ALONE_HOOK,
    alone: true,
    quest,
    turn,
    committed: ['sp-beat-orient'],
  });
}

describe('alone start: no giver, no blocking talk stage', () => {
  it('leaves no talk stage open when nobody can give it', () => {
    const state = aloneState(5);
    expect(state.quests![0]!.objectives![1]!.description).toMatch(/living trail/);
    expect(talkStageGiver(state, 'sp-quest-1', 1)).toBeNull();
    expect(isTalkStageObjective(state, 'sp-quest-1', 1)).toBe(false);
    expect(contractsForState(state).some((c) => c.talkStage)).toBe(false);
  });

  it("the alone quest's next step completes by its own quest_stage rule", () => {
    const state = aloneState(6);
    const arc = runArcDirectorBeforeGm(state, 'Follow the road toward the smoke');
    expect(arc.beatCommitted).toBe(true);
    expect(arc.state.quests![0]!.objectives![1]!.completed).toBe(true);
    expect(arc.systemReceipts.some((r) => /^Quest stage: .*Price: Find a living trail/.test(r))).toBe(true);
  });

  it('sends no hear-reason mandate to the writer', () => {
    const state = aloneState(4);
    const arc = runArcDirectorBeforeGm(state, 'Wait');
    expect(arc.mandate).not.toMatch(/hear-reason|Pellane|Hear their reason/i);
    const manifest = buildSealedManifest(arc.state, 'Wait', arc);
    expect(manifest.requiredFacts.join('\n')).not.toMatch(/reason heard|Pellane/i);
  });
});

describe('orient receipt and pending hear-reason fact use the live quest', () => {
  it("festival opening: 'The Summons’ Price', no Pellane or Circle", () => {
    const quest = starterQuest(festivalCard, false);
    expect(quest.name).toBe('The Summons’ Price');
    const base = { location: FESTIVAL, hook: festivalCard.page1, fallback: festivalCard.fallback, alone: false, quest };

    const orient = runArcDirectorBeforeGm(play({ ...base, turn: 3, committed: [] }), 'Look around');
    expect(orient.beatId).toBe('sp-beat-orient');
    const receipt = orient.systemReceipts.find((r) => r.startsWith('Quest stage:'))!;
    expect(receipt).toBe('Quest stage: The Summons’ Price: bearings established');
    expect(orient.mandate).not.toMatch(/Pellane|Circle/i);
    const orientFacts = buildSealedManifest(orient.state, 'Look around', orient).requiredFacts.join('\n');
    expect(orientFacts).toContain('Beat: The Summons’ Price: bearings established');
    expect(orientFacts).not.toMatch(/Pellane|Circle/i);

    const pending = runArcDirectorBeforeGm(play({ ...base, turn: 5, committed: ['sp-beat-orient'] }), 'Wait');
    const line = pending.mandate.split('\n').find((l) => l.startsWith('ARC PENDING (sp-beat-hear-reason)'))!;
    expect(line).toContain('The Summons’ Price');
    expect(line).not.toMatch(/Pellane|Circle/i);
  });

  it("circle opening keeps 'The Circle’s Price'", () => {
    const quest = starterQuest(circleCard, false);
    expect(quest.name).toBe('The Circle’s Price');
    const base = {
      location: circleCard.location,
      hook: circleCard.page1,
      fallback: circleCard.fallback,
      alone: false,
      quest,
    };
    const orient = runArcDirectorBeforeGm(play({ ...base, turn: 3, committed: [] }), 'Look around');
    expect(orient.systemReceipts).toContain('Quest stage: The Circle’s Price: bearings established');
    const pending = runArcDirectorBeforeGm(play({ ...base, turn: 5, committed: ['sp-beat-orient'] }), 'Wait');
    const line = pending.mandate.split('\n').find((l) => l.startsWith('ARC PENDING (sp-beat-hear-reason)'))!;
    expect(line).toContain('The Circle’s Price');
  });
});
