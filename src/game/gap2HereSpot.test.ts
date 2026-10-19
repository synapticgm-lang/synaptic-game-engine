/**
 * Gap 2 — position inside a place: a typed move that stays at Mireglass March writes a here-spot
 * and who is out of talking range, without changing the hub; the writer reads it from the ledger.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { formatInfoSheet } from './infoSheet';
import { movementFact } from './completedEventPacket';
import { commitTravel } from './travelJourney';
import { applyNamedHubTravel, isLeaveSceneAction } from './outdoorHubs';
import { applyCommittedNarrative } from './sceneFacts';
import { presentNpcNames } from './npcRelationships';
import { presentNpcRecords } from './npcRecords';
import type { GameState, NpcMemory } from './types';

const person = (name: string): NpcMemory =>
  ({
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 5,
    met: true,
    introSpoken: true,
    location: 'Mireglass March',
  }) as NpcMemory;

function inTheWater(): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Mireglass March',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [{ id: 'mireglass-march', name: 'Mireglass March' }],
    npcMemories: [person('Ilyra Fen'), person('Tekk Reed')],
    companions: [],
    log: [],
    turn: 6,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: {
      ...s.sceneFacts!,
      present: ['Ilyra Fen', 'Tekk Reed'],
      lastBeat: 'You stand knee-deep in the cold water of the march.',
    },
  } as GameState;
}

const MOVE = 'The water is strange I wish to move away.is that ok?';

describe('Gap 2 — a move inside the place writes a here-spot', () => {
  it('moving away from the water puts the player on dry ground at the same hub, without Ilyra and Tekk beside him', () => {
    const before = inTheWater();
    const commit = commitTravel(before, MOVE);
    expect(commit.handled).toBe(true);
    const after = commit.state;
    expect(after.currentLocation).toBe('Mireglass March');
    expect(after.sceneFacts?.hereSpot?.spot).toBe('dry ground');
    expect(after.sceneFacts?.hereSpot?.awayFrom).toEqual(['Ilyra Fen', 'Tekk Reed']);
    expect(after.sceneFacts?.present).toEqual([]);
    expect(presentNpcNames(after)).toEqual([]);
    expect(presentNpcRecords(after)).toEqual([]);
    expect(commit.receipt).toMatch(/Moved within Mireglass March: now on dry ground; out of talking range: Ilyra Fen, Tekk Reed/);

    // Writer narrates; the harvest re-reads names but the spot keeps them out of range.
    const narrated: GameState = {
      ...after,
      sceneFacts: applyCommittedNarrative(
        after,
        'You wade out onto dry ground. Behind you, Ilyra Fen and Tekk Reed stay in the shallows, watching.',
        6,
        MOVE
      ),
    };
    expect(narrated.sceneFacts?.hereSpot?.spot).toBe('dry ground');
    expect(presentNpcNames(narrated)).toEqual([]);

    // Next turn: the writer facts still put him on dry ground with the two out of talking range.
    const next: GameState = { ...narrated, turn: 7 };
    const move = movementFact(next, 'Look around');
    expect(move).toMatch(/still on dry ground at Mireglass March/);
    expect(move).toMatch(/Ilyra Fen and Tekk Reed stayed where they were, out of talking range/);
    const sheet = formatInfoSheet(next);
    expect(sheet).toMatch(/player stands on dry ground \(moved T6\); out of talking range: Ilyra Fen, Tekk Reed/);
    expect(sheet).toMatch(/· alone ·/);
    expect(sheet).toMatch(/Ilyra Fen · .*Mireglass March, out of talking range/);
  });

  it('the move turn itself tells the writer the player moved within the place, not left it', () => {
    const after = commitTravel(inTheWater(), MOVE).state;
    expect(movementFact(after, MOVE)).toMatch(/^Moved this turn within Mireglass March: now on dry ground\. Still at Mireglass March; do not narrate leaving it\./);
  });

  it('a person the prose shows following is beside the player again', () => {
    const after = commitTravel(inTheWater(), 'I walk away from them to dry ground').state;
    expect(after.sceneFacts?.hereSpot?.spot).toBe('dry ground');
    const facts = applyCommittedNarrative(after, 'Ilyra Fen follows you up the bank, dripping.', 6, 'I walk away from them to dry ground');
    const narrated = { ...after, sceneFacts: facts };
    expect(presentNpcNames(narrated)).toEqual(['Ilyra Fen']);
  });

  it('a plain question with no move does not move him', () => {
    for (const q of ['Can i ever get back?', 'What is this water?', 'Should I move away from them?']) {
      const before = inTheWater();
      const commit = commitTravel(before, q);
      expect(commit.handled).toBe(false);
      expect(commit.state.sceneFacts?.hereSpot).toBeUndefined();
      expect(presentNpcNames(commit.state)).toEqual(['Ilyra Fen', 'Tekk Reed']);
    }
  });

  it('leave matches anywhere in the line, not a question about leaving', () => {
    expect(isLeaveSceneAction('Leave the scene')).toBe(true);
    expect(isLeaveSceneAction('The water is strange I wish to move away. is that ok?')).toBe(true);
    expect(isLeaveSceneAction('I walk away from them to dry ground')).toBe(true);
    expect(isLeaveSceneAction('Fine. I leave.')).toBe(true);
    expect(isLeaveSceneAction('Can I leave?')).toBe(false);
    expect(isLeaveSceneAction('I leave the sword on the table')).toBe(false);
    expect(isLeaveSceneAction('Look for the exit')).toBe(false);
  });

  it('leaving for another hub by a hub travel chip (not commitTravel) clears the spot; coming back, Ilyra and Tekk are in range again', () => {
    const spotted = commitTravel(inTheWater(), MOVE).state;
    expect(spotted.sceneFacts?.hereSpot?.place).toBe('Mireglass March');

    const away = applyNamedHubTravel(spotted, 'Travel toward Lowmarket');
    expect(away.currentLocation).toBe('Lowmarket');
    const atLowmarket: GameState = {
      ...away,
      turn: 7,
      sceneFacts: applyCommittedNarrative(away, 'You reach Lowmarket under the tarps.', 7, 'Travel toward Lowmarket'),
    };
    expect(atLowmarket.sceneFacts?.hereSpot).toBeUndefined();

    const back = applyNamedHubTravel(atLowmarket, 'Travel toward Mireglass March');
    expect(back.currentLocation).toBe('Mireglass March');
    const home: GameState = {
      ...back,
      turn: 8,
      sceneFacts: applyCommittedNarrative(back, 'You walk back into Mireglass March.', 8, 'Travel toward Mireglass March'),
    };
    expect(home.sceneFacts?.hereSpot).toBeUndefined();
    expect(presentNpcRecords(home).map((m) => m.npcName)).toEqual(['Ilyra Fen', 'Tekk Reed']);
    expect(movementFact(home, 'Look around')).not.toMatch(/dry ground|out of talking range/);
  });

  it('"Can i ever get back" is a return-home question, not other', () => {
    const facts = applyCommittedNarrative(inTheWater(), 'Ilyra Fen looks away.', 6, 'Can i ever get back');
    expect(facts.lastPlayerIntent?.family).toBe('demand');
  });
});
