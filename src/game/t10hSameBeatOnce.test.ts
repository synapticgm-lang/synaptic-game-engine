/**
 * T10H — one beat narrates each event once; player's quoted words stay on the PC.
 * Replays the three live failing shapes from rerun 3 (Story RPG / LitRPG / tabletop).
 */
import { describe, expect, it } from 'vitest';
import { givePcTheirQuote, npcHoldsPcQuote } from './intentParser';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { parsePlayerIntent } from './intentParser';
import { checkPlayCrimes } from './turnCheck';

function base(mode: GameState['engineMode'], over: Partial<GameState> = {}): GameState {
  const s = createInitialState('t10h', mode) as GameState;
  return {
    ...s,
    ...over,
    character: { ...s.character, name: 'Jax', ...(over.character ?? {}) },
    openingEstablishment: { complete: true, sceneWritten: true, ...(over.openingEstablishment as object) },
  } as GameState;
}

function checkOf(state: GameState, playerInput: string): DraftCheck {
  return {
    state,
    playerInput,
    intent: parsePlayerIntent(playerInput, state),
    engineFact: '',
    previousGm: '',
  };
}

describe('T10H same-beat once + PC owns their quote', () => {
  it('Story RPG T2: NPC-stolen Pocket line becomes Jax said (not Vessa)', () => {
    const line =
      "I tip an imaginary hat to the watchmen, slide into the booth and tell Vessa, 'Call me Pocket, and I charge extra for ducking the law.'";
    const stolen =
      'Jax tipped an imaginary hat to the watchmen by the door, then slid into the booth across from Vessa and set both hands flat on the table. Vessa said, "Call me Pocket, and I charge extra for ducking the law." Vessa looked Jax over slowly and left one hand resting near the cup on the table between them.';
    expect(npcHoldsPcQuote(stolen, line, 'Jax')).toBe(true);
    const fixed = givePcTheirQuote(stolen, line, 'Jax');
    expect(fixed).toMatch(/Jax said,\s*"Call me Pocket, and I charge extra for ducking the law\."/);
    expect(fixed).not.toMatch(/Vessa said,\s*"Call me Pocket/);
    expect(npcHoldsPcQuote(fixed, line, 'Jax')).toBe(false);

    const s = base('rpg');
    const out = normalizeCommittedProse(stolen, checkOf(s, line));
    expect(out).toMatch(/Jax said,\s*"Call me Pocket/);
    expect(out).not.toMatch(/Vessa said,\s*"Call me Pocket/);
    expect(checkPlayCrimes(s, s, line, out).p0.some((f) => /NPC speaks the player's quoted words/i.test(f.detail))).toBe(
      false,
    );
  });

  it('Story RPG T3: ask is narrated once (repair restatement dropped)', () => {
    const line = "I lean in, ask Vessa what the pouch is really for, and quietly pocket the cup's coaster.";
    const doubled =
      'Jax leaned in close across the scarred table and asked Vessa what the little pouch was really for. While Vessa thought about the question, Jax slid the cup\'s coaster off the table and tucked it quietly into their pocket. Jax leaned in and asked Vessa what the pouch was really for. Vessa watched Jax\'s hands the whole time and said nothing about the coaster, but her eyes stayed on Jax\'s pocket for one long second.';
    const s = base('rpg');
    const out = normalizeCommittedProse(doubled, checkOf(s, line));
    const asks = out.match(/asked Vessa what the (?:little )?pouch was really for/gi) ?? [];
    expect(asks.length).toBe(1);
    expect(out).toMatch(/coaster|pocket/i);
  });

  it('LitRPG T3: arrival toward Cathedral Close is narrated once', () => {
    const line = 'Travel toward Cathedral Close';
    const doubled =
      'Jax stood on the back streets toward Cathedral Close, where the festival noise had faded behind them and the morning streets ahead ran quiet. Jax turned onto the back streets and walked on toward Cathedral Close, still wearing their clothes and carrying the bag and cloak they had been given. The narrow street answered only with the sound of their own steps on the stones.';
    const s = base('litrpg', {
      currentLocation: 'the back streets',
      journey: {
        from: 'Valespire peace-festival square',
        to: 'Cathedral Close',
        ground: 'back streets',
        legsDone: 1,
        legsTotal: 2,
      } as GameState['journey'],
    });
    const out = normalizeCommittedProse(doubled, checkOf(s, line));
    const toward = out.match(/toward Cathedral Close/gi) ?? [];
    expect(toward.length).toBe(1);
  });

  it('tabletop T5: leave + walk toward Greyhollow Inn collapses to one travel telling', () => {
    const line = 'Travel toward Greyhollow Inn';
    const doubled =
      'Jax left Greyhollow Graveyard and started down the back streets that run toward Greyhollow Inn. Jax walked the dark path toward Greyhollow Inn, and the night came down around them as they went. Nobody else was on the road, and only the wind moved through the hedges beside it. Twenty feet off the path, a campfire still glowed warm in a ring of stones.';
    const s = base('dnd', {
      currentLocation: 'the back streets',
      journey: {
        from: 'Greyhollow Graveyard',
        to: 'Greyhollow Inn',
        ground: 'back streets',
        legsDone: 1,
        legsTotal: 2,
      } as GameState['journey'],
    });
    const out = normalizeCommittedProse(doubled, checkOf(s, line));
    const toward = out.match(/toward Greyhollow Inn/gi) ?? [];
    expect(toward.length).toBe(1);
    expect(out).toMatch(/campfire/i);
  });
});
