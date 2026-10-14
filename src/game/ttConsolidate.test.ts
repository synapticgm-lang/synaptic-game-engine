/**
 * tt-consolidate — one block per root cause from mode-tt-lap-9, each tested through its shared mechanism.
 */
import { describe, expect, it } from 'vitest';
import { newGameState } from './newGameTestState';
import type { GameState, Quest } from './types';
import { applyTabletopQuestTurn, tabletopStepAnchor } from './tabletopQuestProgress';
import { lineHasUnhandedOwnThing, handedProperNames } from './tokenProse';
import { compileNounAllowlist } from './completedEventPacket';
import { playerActionSentenceCheck } from './writerTurn';
import { placeFirstSight } from './outdoorHubs';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { brokenProse, checkActionFollowed } from './turnCheck';
import { actedOnWords } from './chipRules';
import { ignoresTerminalFight, missingFightFacts } from './beatCommitGate';
// @ts-expect-error plain .mjs script
import { checkTurn } from '../../scripts/factCheck.mjs';

const tabletop = (over: Partial<GameState> = {}): GameState => {
  const s = newGameState('cursed-keep', { engineMode: 'dnd' });
  return { ...s, turn: 7, character: { ...s.character!, name: 'Jax' }, ...over } as GameState;
};

describe('root 1 — a quest step with no known place never ticks on arrival elsewhere', () => {
  const quest = {
    id: 'q-tracks',
    title: 'Quiet the Dead',
    status: 'active',
    revealed: true,
    location: 'Keep Gate',
    objectives: [{ id: 'o1', description: 'Follow the cart tracks toward the lower bailey.', completed: false }],
  } as unknown as Quest;

  it('the move with nowhere known to arrive is taken at the quest place', () => {
    const anchor = tabletopStepAnchor(tabletop(), quest, 0);
    expect(anchor.kind).toBe('look');
    expect(anchor.place).toBe('Keep Gate');
  });

  it('arriving at the inn does not tick it', () => {
    const s = tabletop({ quests: [quest], currentLocation: 'Greyhollow Inn' });
    const out = applyTabletopQuestTurn(s, 'Travel to Greyhollow Inn', 'Greyhollow Church');
    expect(out.state.quests![0]!.objectives![0]!.completed).toBe(false);
  });
});

describe('root 2 — the gate keeps the line that tells the player’s own action', () => {
  it('"set their feet apart / square" is the body, not an unhanded thing', () => {
    expect(lineHasUnhandedOwnThing("Jax set their feet apart on the inn's worn floorboards and traced the shape of the armor spell in the air.", 'Greyhollow Inn', 'Jax')).toBe(false);
    expect(lineHasUnhandedOwnThing('Jax set their feet square and watched the treeline.', 'the churchyard', 'Jax')).toBe(false);
    expect(lineHasUnhandedOwnThing('Jax set down their lantern.', 'the churchyard', 'Jax')).toBe(true);
  });

  it('a route stop is one handed name for every gate', () => {
    const s = tabletop({ routeStops: { 'greyhollow inn|keep gate': [{ name: 'Old Well', leg: 1, find: 'none' }] } } as unknown as Partial<GameState>);
    expect(compileNounAllowlist(s)).toContain('Old Well');
    expect(handedProperNames(s)).toContain('Old Well');
  });

  it('the sentence that does the chosen action is this turn’s event', () => {
    const isAction = playerActionSentenceCheck('Ask the two militia what they want', 'Jax');
    expect(isAction('Jax asked the two militia what they wanted.')).toBe(true);
    expect(isAction('The militia shifted on their feet.')).toBe(false);
    expect(playerActionSentenceCheck('Keep lookout', 'Jax')('Jax kept lookout on the forest path.')).toBe(true);
  });
});

describe('root 3 — a place card text is a first sight, handed once', () => {
  const card = { id: 'greyhollow-inn', name: 'Greyhollow Inn', description: 'Last coach stop — warm ale, cold silence. A second line.', cardBuiltTurn: 7 };
  it('handed the turn the card is made, never after', () => {
    const first = tabletop({ currentLocation: 'Greyhollow Inn', places: [card] } as Partial<GameState>);
    expect(placeFirstSight(first, 'Greyhollow Inn')).toBe('Last coach stop — warm ale, cold silence.');
    expect(formatWriterInfoLayer(first, [], '')).toContain('What it is: Last coach stop');
    const later = { ...first, turn: 9 } as GameState;
    expect(placeFirstSight(later, 'Greyhollow Inn')).toBe('');
    expect(formatWriterInfoLayer(later, [], '')).not.toContain('What it is:');
  });
});

describe('root 4 — the turn check reads things, not manners; nouns ending in -ed are nouns', () => {
  const s = tabletop();
  const kinds = (act: string, prose: string) => {
    const r = checkActionFollowed(s, s, act, prose);
    return [...r.p0, ...r.down].map((f) => f.kind);
  };
  it('a manner, a stance or a spell names no thing to find', () => {
    expect(actedOnWords('Fight for breath')).toEqual([]);
    expect(actedOnWords('Ready yourself and watch')).toEqual([]);
    expect(actedOnWords('Cast Mage Armor')).toEqual([]);
    expect(actedOnWords('Inspect the crate')).toEqual(['crate']);
    expect(kinds('Fight for breath', 'Jax pushed up off the cold ground and stood on shaking legs.')).not.toContain('action-object-missing');
    expect(kinds('Ready yourself and watch', 'Jax held their spear ready and scanned the churchyard.')).not.toContain('action-object-missing');
    expect(kinds('Cast Mage Armor', 'A faint shimmer settled over Jax’s coat.')).not.toContain('action-object-missing');
    expect(kinds('Inspect the crate', 'The wind picked up. Somewhere a shutter banged.')).toContain('action-object-missing');
  });

  it('"a bed at the inn" is not a missing name', () => {
    expect(brokenProse('Jax took a bed at the inn for the night.', 'Jax')).toEqual([]);
    expect(brokenProse('Then the stepped from the shadow.', 'Jax').map((f) => f.kind)).toContain('broken-prose');
  });
});

describe('root 4 — the fact checker reads every handed fact', () => {
  const packet = 'The player character is Jax.';
  const engineFact = 'Travel: open road between Keep Gate and Greyhollow Inn — quiet stretch, nobody met on the road.';
  const kinds = (gmText: string, extra: Record<string, unknown> = {}) =>
    (checkTurn({ turn: 10, gmText, engineFact, ...extra }, packet, '') as Array<{ kind: string }>).map((f) => f.kind);

  it('a name in an open quest step is handed', () => {
    expect(kinds('Jax thought of Lina and walked on.', { openQuests: [{ title: "The Woodcutter's Plea", step: 'Find Lina past the keep gate' }] })).not.toContain('name');
  });

  it('a person word that does not act is no meeting', () => {
    expect(kinds('A dog barked somewhere behind a fence.')).not.toContain('meeting');
    expect(kinds('A man stood by the ditch and watched Jax pass.')).toContain('meeting');
  });

  it('a thing a handed person handles is theirs, not the PC’s', () => {
    const edda = 'Edda Merrow rested one gloved hand flat on a folded paper that lay beside her cup.';
    expect(kinds(edda, { turnCheck: { presentNames: ['Edda Merrow'] } })).not.toContain('item');
  });
});

describe('root 5 — a fight told in any words that it ended is told', () => {
  const fight = (prose: string) => {
    const s = tabletop({ completedEvent: { engineResult: 'Fight: VICTORY vs Rotting Feral Dog in 3 rounds.' } } as Partial<GameState>);
    return { gate: ignoresTerminalFight(s, prose), missing: missingFightFacts(s, prose) };
  };
  it('"knocked them flat … did not get up again" carries the victory', () => {
    expect(fight('Jax knocked the dog flat with the haft, and it did not get up again.')).toEqual({ gate: false, missing: 0 });
    expect(fight('Jax circled the dog, watching its teeth.').gate).toBe(true);
  });
});
