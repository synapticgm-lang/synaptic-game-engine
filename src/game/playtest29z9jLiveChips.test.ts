import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { chipProblem, liveChips } from './chipLegality';
import { resolveOfferedChoices } from './playTranscript';
import type { GameState, LogEntry } from './types';

vi.mock('./openingEstablishment', async (orig) => ({
  ...(await orig<typeof import('./openingEstablishment')>()),
  openingCastNames: (s: GameState & { __cast?: string[] }) => s.__cast ?? [],
}));

const HERE = 'a ruined bathhouse off the Valespire roads';
const EMPTY_BEAT = 'Rain ran down the cracked dome. The bathhouse was empty; nobody had stayed after the summoning.';
const BUSY_BEAT = 'Rain ran down the cracked dome while the handler watched you from the doorway.';

function state(over: Partial<GameState> & { __cast?: string[] } = {}, gm = EMPTY_BEAT, player = 'Search the alcoves'): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  const log: LogEntry[] = [
    { id: 'g0', turn: 4, role: 'gm', content: 'Earlier beat.', timestamp: 1 },
    { id: 'p5', turn: 5, role: 'player', content: player, timestamp: 2 },
    { id: 'g5', turn: 5, role: 'gm', content: gm, timestamp: 3 },
  ];
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    turn: 6,
    currentLocation: HERE,
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: { pending: [], answers: { where: HERE, name: 'Jax' }, complete: true, sceneWritten: true, mode: 'weave' },
    sceneFacts: { ...emptySceneFacts(5), props: ['blue panel', 'rubble', 'alcoves'] },
    log,
    __cast: ['the handler'],
    ...over,
  } as GameState;
}

describe('29z9j live chips — empty-room text', () => {
  it('no talk, social or who-are-you chip when the text says the room is empty; the opening cast is not a listener', () => {
    const s = state();
    expect(chipProblem(s, 'Talk to the handler')?.kind).toBe('ghost-chip');
    expect(chipProblem(s, 'Ask who they are')?.kind).toBe('ghost-chip');
    expect(chipProblem(s, 'Who are you?')?.kind).toBe('ghost-chip');
    expect(chipProblem(s, 'Bargain for a way out')?.kind).toBe('ghost-chip');
    expect(chipProblem(s, 'Look around')).toBeNull();
  });

  it('the opening cast still answers while the text does not say empty', () => {
    expect(chipProblem(state({}, BUSY_BEAT), 'Talk to the handler')).toBeNull();
  });

  it('someone the ledger really placed here still hears on empty-room text', () => {
    const s = state({ companions: [{ id: 'm', name: 'Mira', type: 'party', role: 'archer', hp: 8, maxHp: 8, maintenanceCost: '', assignment: 'with you', notes: '' }] });
    expect(chipProblem(s, 'Talk to Mira')).toBeNull();
  });
});

describe('29z9j live chips — no repeat of the action just taken', () => {
  it('inspect after a typed investigate of the same thing is dropped; other moves stay', () => {
    const s = state({}, EMPTY_BEAT, 'Investigate the rubble by the deep pool');
    const out = liveChips(s, ['Inspect the rubble', 'Search the alcoves', 'Look around']);
    expect(out).not.toContain('Inspect the rubble');
    expect(out).toContain('Search the alcoves');
  });

  it('the same chip tapped again is dropped from the real chip list', () => {
    const s = state({ choices: ['Search the alcoves', 'Inspect the rubble', 'Look around', 'Talk to the handler'] });
    const chips = resolveOfferedChoices(s);
    expect(chips).not.toContain('Search the alcoves');
    expect(chips.some((c) => /handler/i.test(c))).toBe(false);
  });
});

describe('29z9j live chips — the System window is not a thing', () => {
  it('a chip that touches or takes the panel is dropped; reading it stays', () => {
    const s = state();
    expect(chipProblem(s, 'Touch the blue panel')?.kind).toBe('impossible-chip');
    expect(chipProblem(s, 'Take the blue panel')?.kind).toBe('impossible-chip');
    expect(chipProblem(s, 'Read the blue panel')).toBeNull();
  });

  it('outside LitRPG a panel is an ordinary object', () => {
    const s = state({ engineMode: 'dnd' });
    expect(chipProblem(s, 'Touch the blue panel')?.kind).not.toBe('impossible-chip');
  });
});

describe('29z9j live chips — alone start', () => {
  it('page 1 alone offers search, look around and the panel, never talk', () => {
    const page1 =
      'You wake on wet tiles in a ruined bathhouse off the Valespire roads. A blue panel hangs in the draft. Nobody stayed. If anything useful is left in the alcoves, you will have to find it.';
    const s = state({
      turn: 0,
      openingEstablishment: { pending: [], answers: { where: HERE, name: 'Jax' }, complete: true, sceneWritten: true, mode: 'weave', aloneArrival: true, pickedHookFallback: page1 },
      log: [{ id: 't0', turn: 0, role: 'gm', content: page1, timestamp: 1 }],
      __cast: [],
    });
    const chips = resolveOfferedChoices(s);
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.some((c) => /^(?:talk|ask|who|greet|speak)\b/i.test(c))).toBe(false);
    expect(chips.every((c) => /\b(?:search|look around|panel)\b/i.test(c))).toBe(true);
  });
});
