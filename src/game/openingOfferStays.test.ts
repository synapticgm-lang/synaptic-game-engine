/**
 * Live check 13 Nov (PR37 v398): LitRPG summoned-pact page 1 showed both offer chips; after
 * "Ask Hale Brack what they want" the accept chip vanished and a Travel filler took its slot.
 * Cause: after the opening page, the accept chip had to be re-grounded in the prose by its noun
 * ("kit"); the page said "outfitted", so accept dropped while refuse (never checked) stayed.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import { assembleFourSlotPads } from './fourSlotPads';
import { isFreeInputChip } from './sceneAffordances';
import type { GameState, LogEntry } from './types';

const ACCEPT = "Take Hale's offer of kit";
const REFUSE = 'Keep your own kit';
const PAGE1 =
  'Chalk lines glow on the planks. Hale Brack, a quartermaster with ink-stained cuffs, stands over you. "Keep quiet about the circle and I will see you outfitted — knife, oilskin, a bunk," he says.';

function opened(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 7, personality: 'default', engineMode: 'litrpg' });
  const s = stampOpening(state);
  const page1: LogEntry = { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0, offeredChoices: ['Look around', 'Wait and listen', REFUSE, ACCEPT] };
  return {
    ...s,
    log: [page1],
    choices: ['Look around', 'Wait and listen', REFUSE, ACCEPT],
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      sceneWritten: true,
      instance: {
        placeName: s.currentLocation ?? 'Here',
        placeKind: 'summoning circle',
        situation: 'A chalk circle on ship planks.',
        cast: [{ name: 'Hale Brack', role: 'a quartermaster', gender: 'm' }],
        offerSummary: 'Keep quiet about the circle and Hale kits you out.',
        offerChips: [
          { kind: 'accept', label: ACCEPT, note: 'knife, oilskin, a bunk' },
          { kind: 'refuse', label: REFUSE, note: '' },
        ],
        alone: false,
        retiredNames: [],
      },
    } as unknown as GameState['openingEstablishment'],
  } as GameState;
}

function turn(s: GameState, said: string, prose: string): GameState {
  const t = (s.turn ?? 1) + 1;
  const next = {
    ...s,
    turn: t,
    log: [
      ...(s.log ?? []),
      { id: `p${t}`, turn: t - 1, role: 'player', content: said, timestamp: t * 2 },
      { id: `g${t}`, turn: t - 1, role: 'gm', content: prose, timestamp: t * 2 + 1 },
    ],
  } as GameState;
  const committed = commitOfferedPad(next);
  return { ...committed, choices: committed.offeredPad?.choices ?? [] };
}

const engine = (pads: string[]) => pads.filter((c) => !isFreeInputChip(c));

describe('opening offer chips stay until the player decides', () => {
  it('ask turn, then another non-deciding turn: accept + refuse both in exactly 4 pads', () => {
    let s = opened();
    s = turn(s, 'Ask Hale Brack what they want', 'Hale Brack rubs his jaw. "A quiet tongue and a strong back. The tide turns at dusk."');
    let pads = engine(s.offeredPad?.choices ?? []);
    expect(pads).toHaveLength(4);
    expect(pads).toEqual(expect.arrayContaining([ACCEPT, REFUSE]));

    s = turn(s, 'Look around', 'The lamps sway with the hull. Rope coils, a shut hatch, salt on everything.');
    pads = engine(s.offeredPad?.choices ?? []);
    expect(pads).toHaveLength(4);
    expect(pads).toEqual(expect.arrayContaining([ACCEPT, REFUSE]));
  });

  it('not during a live fight: the fight pads keep their slots', () => {
    const s = turn(opened(), 'Ask Hale Brack what they want', 'Hale Brack shrugs.');
    const fight = {
      ...s,
      activeEncounter: { id: 'e1', name: 'Test Foe', hp: 5, maxHp: 5, phase: 'active' } as unknown as GameState['activeEncounter'],
    } as GameState;
    const pads = engine(assembleFourSlotPads(fight, ['Attack', 'Defend', 'Use something', 'Disengage']));
    expect(pads).not.toContain(ACCEPT);
    expect(pads).not.toContain(REFUSE);
  });
});
