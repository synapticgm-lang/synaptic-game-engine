/**
 * 29z9i — four tester gaps (harness only, no live change): talk on empty-room text, the System window
 * handled as an object, a chip that repeats the last action, and a body verb that differs from the typed one.
 * No live GM or judge call.
 */
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';

vi.mock('./openingEstablishment', async (orig) => ({
  ...(await orig<typeof import('./openingEstablishment')>()),
  openingCastNames: (s: GameState & { __cast?: string[] }) => s.__cast ?? [],
}));

const { checkActionFollowed, checkEmptyRoomTalk, checkPlayerTurn, checkRepeatChips, checkSystemWindow, chipRepeatsAction, placeSaysEmpty } =
  await import('./turnCheck');

function base(over: Partial<GameState> & { __cast?: string[] } = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'z9i',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'a ruined bathhouse',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    log: [],
    turn: 3,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, crowd: 'none', present: [], crowdCount: 0, ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const kinds = (r: { p0: { kind: string }[]; down: { kind: string }[] }) => [...r.p0, ...r.down].map((f) => f.kind);
const EMPTY = 'Cracked tiles ran to a dry plunge pool. Nobody else was in the bathhouse.';

describe('29z9i — gap 1: talk chip on empty-room text', () => {
  const cast = base({ __cast: ['the handler'], sceneFacts: { present: ['the handler'] } as GameState['sceneFacts'] });

  it('empty-room text is read from the beat, not from a spoken line', () => {
    expect(placeSaysEmpty(cast, EMPTY)).toBe(true);
    expect(placeSaysEmpty(cast, 'The handler said, "Nobody comes here."')).toBe(false);
    expect(placeSaysEmpty(cast, 'The handler waited by the pool.')).toBe(false);
  });

  it('the opening cast is not a listener when the place text says nobody is here', () => {
    const flags = checkEmptyRoomTalk(cast, ['Ask what they want', 'Talk to the handler', 'Search the area'], EMPTY);
    expect(flags.map((f) => f.detail)).toEqual([
      '"Ask what they want" talks to someone, but the place text says nobody is here',
      '"Talk to the handler" talks to someone, but the place text says nobody is here',
    ]);
  });

  it('a companion still hears a chip addressed to them', () => {
    const withMira = base({
      __cast: ['the handler'],
      companions: [{ name: 'Mira' } as never],
      sceneFacts: { present: ['the handler'] } as GameState['sceneFacts'],
    });
    expect(checkEmptyRoomTalk(withMira, ['Talk to Mira'], EMPTY)).toEqual([]);
    expect(checkEmptyRoomTalk(withMira, ['Talk to the handler'], EMPTY)).toHaveLength(1);
  });

  it('no empty-room text, no flag (the chip rule owns it)', () => {
    expect(checkEmptyRoomTalk(cast, ['Ask what they want'], 'The handler waited by the pool.')).toEqual([]);
  });
});

describe('29z9i — gap 4: "who are you" in the prose on empty-room text', () => {
  it('flags the prose prompt even while the people list is full', () => {
    const full = base({
      __cast: ['the handler'],
      companions: [{ name: 'Mira' } as never],
      sceneFacts: { present: ['the handler'], crowd: 'present', crowdCount: 4 } as GameState['sceneFacts'],
    });
    const flags = checkEmptyRoomTalk(full, [], `${EMPTY} "Who are you?" echoed off the tiles.`);
    expect(flags.map((f) => f.kind)).toEqual(['ghost-talk']);
  });

  it('the player typing it is not a game fault', () => {
    expect(checkEmptyRoomTalk(base(), [], `${EMPTY} "Who are you?" Only the drip answered.`, 'Who are you?')).toEqual([]);
  });
});

describe('29z9i — gap 2: the System window is not a physical object', () => {
  const s = base({ sceneFacts: { props: ['blue panel'] } as GameState['sceneFacts'] });

  it('a touch, surface or heat on the window is a P0', () => {
    const prose = 'You reached for the blue panel. Your finger touched it and the surface rippled, giving off no heat.';
    expect(checkSystemWindow(s, [], prose).map((f) => f.kind)).toEqual(['window-touched']);
  });

  it('a hand passing through it is not physical', () => {
    expect(checkSystemWindow(s, [], 'Your hand passed straight through the blue panel. The text did not move.')).toEqual([]);
  });

  it('a chip that handles the window is a P0; inspecting it is not', () => {
    expect(checkSystemWindow(s, ['Touch the panel', 'Inspect the panel'], 'The blue panel hung in the air.').map((f) => f.detail)).toEqual([
      '"Touch the panel" handles the System window like an object',
    ]);
  });

  it('not LitRPG, no window', () => {
    expect(checkSystemWindow({ ...s, engineMode: 'dnd' } as GameState, ['Touch the panel'], 'You touched the panel.')).toEqual([]);
  });

  it('any chip that repeats the last action is a down', () => {
    expect(chipRepeatsAction('Inspect the panel', 'Investigate the blue panel and what it says')).toBe(true);
    expect(chipRepeatsAction('Look around', 'look around.')).toBe(true);
    expect(chipRepeatsAction('Wait', 'I wait')).toBe(true);
    expect(chipRepeatsAction('Search the area', 'Inspect the panel')).toBe(false);
    expect(chipRepeatsAction('Inspect the pool', 'Inspect the panel')).toBe(false);
    expect(checkRepeatChips(['Inspect the panel', 'Search the area'], 'Inspect the panel').map((f) => f.kind)).toEqual(['repeat-chip']);
  });
});

describe('29z9i — gap 3: the body verb must match the typed verb', () => {
  const s = base();

  it('search told as a kick is a down even though the crate is named', () => {
    expect(kinds(checkActionFollowed(s, s, 'Search the crate', 'You kicked the crate and it slid aside.'))).toContain('verb-swapped');
  });

  it('search told as searching, or an honest empty, is fine', () => {
    expect(kinds(checkActionFollowed(s, s, 'Search the crate', 'You went through the crate and found only straw.'))).not.toContain('verb-swapped');
    expect(kinds(checkActionFollowed(s, s, 'I search the crate', 'You rummaged in the crate. Empty.'))).not.toContain('verb-swapped');
  });

  it('check / investigate told as a touch is a down', () => {
    expect(kinds(checkActionFollowed(s, s, 'Investigate the blue panel', 'Your finger touched the blue panel.'))).toContain('verb-swapped');
    expect(kinds(checkActionFollowed(s, s, 'Check the door', 'You shouldered the door.'))).toContain('verb-swapped');
    expect(kinds(checkActionFollowed(s, s, 'Check the door', 'You looked the door over; the hinges were rusted.'))).not.toContain('verb-swapped');
  });

  it('a missing noun stays action-object-missing, not verb-swapped', () => {
    const k = kinds(checkActionFollowed(s, s, 'Search the crate', 'You kicked the wall.'));
    expect(k).toContain('action-object-missing');
    expect(k).not.toContain('verb-swapped');
  });
});

describe('29z9i — wired into the row check', () => {
  it('checkPlayerTurn carries the new flags', () => {
    const before = base({ __cast: ['the handler'], sceneFacts: { present: ['the handler'], props: ['blue panel'] } as GameState['sceneFacts'] });
    const r = checkPlayerTurn(before, before, {
      playerInput: 'Inspect the panel',
      offeredChoices: ['Ask what they want', 'Inspect the panel'],
      gmText: `${EMPTY} You looked at the blue panel; your finger touched its surface.`,
    });
    const k = kinds(r);
    expect(k).toContain('ghost-chip');
    expect(k).toContain('window-touched');
    expect(k).toContain('repeat-chip');
  });
});
