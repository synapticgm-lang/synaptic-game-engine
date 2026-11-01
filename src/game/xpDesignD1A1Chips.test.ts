/**
 * XP-D1 A1 — starter-quest first XP step is offered early (bearings do not starve the chip).
 * LitRPG / Story RPG only; tabletop chip set untouched.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { storyChip } from './choiceRanking';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState, NpcMemory, Quest } from './types';

const HEAR = 'Hear their reason (or demand it)';
const FESTIVAL = 'Valespire peace-festival square';
type Card = { location: string; page1?: string; fallback?: string };
const festivalCard = ((summonedPact.openingHooks ?? []) as unknown as Card[]).find(
  (h) => h.location === FESTIVAL
)!;

const person = (npcName: string, location: string): NpcMemory =>
  ({
    npcId: npcName.toLowerCase().replace(/\s+/g, '-'),
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 2,
    met: true,
    introSpoken: true,
    location,
    present: true,
  }) as NpcMemory;

function stateWithBearingsStillOpen(): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  const quest: Quest = {
    id: 'sp-quest-1',
    name: "The Circle's Price",
    description: 'Hear why they pulled you here.',
    status: 'active',
    type: 'main',
    revealed: true,
    location: FESTIVAL,
    objectives: [
      {
        id: 'sp-quest-1-obj-1',
        description: 'Get your bearings in this arrival (floor, cell, camp, or vault)',
        completed: false,
      },
      { id: 'sp-quest-1-obj-2', description: HEAR, completed: false },
      { id: 'sp-quest-1-obj-3', description: 'Choose: swear, refuse, or delay', completed: false },
    ],
  } as Quest;
  return {
    ...s,
    seed: 'xp-d1-a1-chips',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Jax', level: 1 },
    currentLocation: FESTIVAL,
    activeEncounter: null,
    turn: 3,
    quests: [quest],
    npcMemories: [person('Ila Pellane', FESTIVAL)],
    arcDirector: { committedBeatIds: [], turnsSinceCombatReceipt: 0 },
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      aloneArrival: false,
      castNpcIds: [],
      pickedHook: festivalCard.page1,
      pickedHookFallback: festivalCard.fallback,
      answers: { ...(s.openingEstablishment?.answers ?? {}), name: 'Jax', where: FESTIVAL },
    } as GameState['openingEstablishment'],
    sceneFacts: {
      ...s.sceneFacts!,
      crowd: 'present',
      present: ['Ila Pellane', 'the handler'],
    },
  } as GameState;
}

describe('XP-D1 A1 starter quest chip', () => {
  it('skips unfinished bearings so Hear their reason can be the story chip when the giver is here', () => {
    const chip = storyChip(stateWithBearingsStillOpen());
    expect(chip).toBeTruthy();
    expect(chip).not.toMatch(/bearings/i);
    expect(chip!.toLowerCase()).toMatch(/hear their reason|ask what they want/);
  });
});
