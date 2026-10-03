/**
 * Seed 94 repair: a destination chip must really move mid-journey, Inspect the panel is a ledger read,
 * the quest objective at its own site opens the dungeon, and the tester does not demand words an
 * offer, an attack, a turn-away or a scout never act on. No live GM or judge call.
 */
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';

vi.mock('./openingEstablishment', async (orig) => ({
  ...(await orig<typeof import('./openingEstablishment')>()),
  openingCastNames: (s: GameState & { __cast?: string[] }) => s.__cast ?? [],
}));

const { checkActionFollowed } = await import('./turnCheck');
const { travelChipMoves } = await import('./chipLegality');
const { commitTravel } = await import('./travelJourney');
const { buildCompletedEventPacket, formatWriterFacingEvent } = await import('./completedEventPacket');
const { maybeEnterInteriorDungeon } = await import('./enterInterior');

function pact(over: Partial<GameState> & { __cast?: string[] } = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 's94',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Back streets',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    log: [],
    turn: 20,
    character: { ...s.character!, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, crowd: 'none', present: [], crowdCount: 0, pendingEncounter: undefined, ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const kinds = (r: { p0: { kind: string }[]; down: { kind: string }[] }) => [...r.p0, ...r.down].map((f) => f.kind);

describe('seed 94 — a destination chip mid-journey must move', () => {
  const keep = () => {
    const s = createInitialState(undefined, 'dnd') as GameState;
    const start = { ...s, seed: 's94', campaignBibleId: 'cursed-keep', currentLocation: 'Greyhollow Inn', worldAtlas: null, activeEncounter: null, journey: null } as GameState;
    const trip = commitTravel(start, 'Travel toward Blackspine Treeline').state;
    return { ...trip, journey: { ...trip.journey!, encounter: null } } as GameState;
  };

  it('a destination the engine cannot reach is not a legal move while on the ground', () => {
    const s = keep();
    expect(s.journey).toBeTruthy();
    expect(commitTravel(s, 'Return to Consecrated Sanctuary').handled).toBe(true);
    expect(travelChipMoves(s, 'Return to Consecrated Sanctuary')).toBe(false);
  });

  it('walking toward the journey destination still moves', () => {
    expect(travelChipMoves(keep(), 'Travel toward Blackspine Treeline')).toBe(true);
  });
});

describe('seed 94 — Inspect the panel is sent as a ledger read', () => {
  const withPanel = () => pact({ systemHousing: undefined, sceneFacts: { props: ['blue panel'] } as GameState['sceneFacts'] });

  it('the writer is told the player read the System window, with the ledger lines', () => {
    const s = withPanel();
    const text = formatWriterFacingEvent(buildCompletedEventPacket(s, 'Inspect the panel'));
    expect(text).toContain('Jax read the System window.');
    expect(text).toMatch(/PANEL \(game chrome[^\n]*The panel read:/);
    expect(text).not.toMatch(/Jax inspected/);
  });

  it('an ordinary inspect is still an inspect', () => {
    const text = formatWriterFacingEvent(buildCompletedEventPacket(withPanel(), 'Search the area'));
    expect(text).toMatch(/Jax inspected/);
    expect(text).not.toContain('read the System window');
  });
});

describe('seed 94 — the quest objective at its own site opens the dungeon', () => {
  const quest = {
    id: 'sp-spine-test',
    name: 'The Crown’s Meat Shield',
    status: 'active',
    revealed: true,
    location: 'Cathedral Undercroft',
    objectives: [{ id: 'o1', description: 'Clear the infestation in the cathedral’s lower crypts to prove your baseline stats.', completed: false }],
  } as unknown as Quest;

  it('Clear the infestation at Cathedral Undercroft enters a dungeon', () => {
    const s = pact({ currentLocation: 'Cathedral Undercroft', quests: [quest] });
    expect(maybeEnterInteriorDungeon(s, 'Clear the infestation').activeDungeon).toBeTruthy();
  });

  it('another action at the site does not', () => {
    const s = pact({ currentLocation: 'Cathedral Undercroft', quests: [quest] });
    expect(maybeEnterInteriorDungeon(s, 'Wait and watch').activeDungeon).toBeFalsy();
  });
});

describe('seed 94 — tester asks for what the action acted on, not its wording', () => {
  it('an offer answered by someone here is followed; an offer nobody answers is ignored', () => {
    const s = pact({ __cast: ['Orth'], sceneFacts: { present: ['Orth'] } as GameState['sceneFacts'] });
    const answered = 'Orth went quiet for a moment and studied Jax, then nodded once and pointed off toward the bell-tower.';
    expect(kinds(checkActionFollowed(s, s, 'Offer help, honestly', answered))).toEqual([]);
    const k = kinds(checkActionFollowed(s, s, 'Offer help, honestly', 'Jax looked at the blue panel and said out loud that they would help.'));
    expect(k).toContain('ignored-action');
  });

  it('pressing the attack is owned by the blow check, not the word attack', () => {
    const foe = { name: 'the thugs', hp: 10, maxHp: 26 } as GameState['activeEncounter'];
    const s = pact({ activeEncounter: foe });
    expect(kinds(checkActionFollowed(s, s, 'Press the attack', 'Jax swung at the last thug and the punch grazed his jaw.'))).toEqual([]);
    expect(kinds(checkActionFollowed(s, s, 'Press the attack', 'Jax stood in the lane and breathed hard.'))).toContain('ignored-action');
  });

  it('turning another direction needs the walk, not the words another direction', () => {
    const s = pact();
    expect(kinds(checkActionFollowed(s, s, 'Walk away / go another direction', 'Jax turned from the steps and walked the other way.'))).toEqual([]);
    expect(kinds(checkActionFollowed(s, s, 'Walk away / go another direction', 'Jax stayed by the stairs and thought.'))).toContain('action-object-missing');
  });

  it('scouting for danger is a look, so danger is not demanded', () => {
    const s = pact();
    expect(kinds(checkActionFollowed(s, s, 'Scout for danger', 'Jax scanned the wall walk in both directions, counting torch posts.'))).toEqual([]);
  });

  it('a real missing object still flags', () => {
    const s = pact();
    expect(kinds(checkActionFollowed(s, s, 'Clear the infestation', 'Jax walked down the stone steps and stopped in a cold room.'))).toContain('action-object-missing');
  });
});
