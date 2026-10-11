/**
 * Root A (seed 80) — a chip's cooldown key is its named target. Offering one person or place never
 * cools a chip for another, and a status chip with nobody addressed never cools a person.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { canonicalizeOption, filterCooldownChoices, updateCooldowns, type OptionCooldown } from './optionDiversityContract';
import { commitOfferedPad, resolveOfferedChoices } from './playTranscript';
import { enumerateLegalEdges } from './graphChoices';
import type { GameState } from './types';

function seed80(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 80, personality: 'cold-system' });
  return stampOpening(state);
}

/** The lists the seed-80 run offered on harness turns 2..11, in order. */
const S80_OFFERS: string[][] = [
  ['Ask what they want', 'Ask the world', 'Look around'],
  ['Ask what they want', 'Look around', 'Search the area'],
  ['Travel toward Cathedral Close', 'Check the exits', 'Wait and watch', 'Inspect the immediate surroundings'],
  ['Travel toward Cathedral Close', 'Wait and watch', 'Inspect the immediate surroundings'],
  ['Walk on', 'Turn back toward a harbor circle in the hold of a Valespire grain-ship', 'Return to Cathedral Close', 'Travel toward Contract Hall'],
  ['Walk on', 'Talk to someone in the street', 'Turn back toward a harbor circle in the hold of a Valespire grain-ship'],
  ['Travel toward Cathedral Close', 'Check Status', 'Wait and watch', 'Inspect the immediate surroundings'],
  ['Travel toward Cathedral Close', 'Wait and watch', 'Inspect the immediate surroundings'],
  ['Walk on', 'Greet whoever is coming', 'Turn back toward a harbor circle in the hold of a Valespire grain-ship'],
  ['Wait and watch', 'Refuse Nell Rudd and keep your own counsel'],
];

/**
 * The saved key every named talk chip collapsed into before this fix (offerCount 5, cooldown 6 in the
 * seed-80 save). It stays in old saves; a named talk chip must not read it.
 */
const SAVED_COLLAPSED_TALK: OptionCooldown = {
  canonical: 'ask:environment:gather_info',
  lastOfferedTurn: 9,
  offerCount: 4,
  cooldownTurns: 6,
};

function cooldownsThrough(lastTurn: number): Record<string, OptionCooldown> {
  let map = new Map<string, OptionCooldown>([[SAVED_COLLAPSED_TALK.canonical, SAVED_COLLAPSED_TALK]]);
  S80_OFFERS.forEach((offer, i) => {
    const turn = i + 2;
    if (turn <= lastTurn) map = updateCooldowns(offer, turn, map);
  });
  return Object.fromEntries(map);
}

/** Commit one turn the way the harness does: player line + GM beat, turn + 1, raw pad as `choices`. */
function commitTurn(state: GameState, input: string, prose: string, raw: string[]): GameState {
  const turn = (state.turn ?? 0) + 1;
  const next: GameState = {
    ...state,
    turn,
    log: [
      ...(state.log ?? []),
      { id: `p${turn}`, turn: state.turn, role: 'player', content: input, timestamp: 0 },
      { id: `g${turn}`, turn, role: 'gm', content: prose, timestamp: 0 },
    ],
    choices: raw,
    qualityGovernance: { ...(state.qualityGovernance ?? {}), optionCooldowns: cooldownsThrough(turn - 1) } as GameState['qualityGovernance'],
  };
  return commitOfferedPad(next, `g${turn}`);
}

const CLOSE_BEAT =
  'Nell Rudd leaned on the cathedral railing beside Col Thatch. "You came back," Col Thatch said to Jax. "Who sent you up the Close this time?"';

/** Cathedral Close before the T10 commit: Nell Rudd and Col Thatch met and here. */
function atTheClose(): GameState {
  const s = seed80();
  const people = ['Nell Rudd', 'Col Thatch'];
  return {
    ...s,
    turn: 10,
    currentLocation: 'Cathedral Close',
    journey: undefined,
    sceneFacts: { ...(s.sceneFacts ?? {}), present: people } as GameState['sceneFacts'],
    npcMemories: [
      ...(s.npcMemories ?? []),
      ...people.map((name) => ({
        npcId: `town-${name.toLowerCase().replace(/\s+/g, '-')}`,
        npcName: name,
        disposition: 'unknown',
        facts: ['Introduced in play T10'],
        lastSeenTurn: 10,
        met: true,
        location: 'Cathedral Close',
        meetCount: 1,
        introSpoken: true,
        completedTopics: ['intro'],
        relationshipStatus: 'acquaintance',
      })),
    ] as GameState['npcMemories'],
  };
}

describe('s80 Root A — cooldown keys by named target', () => {
  it('different people and places get different keys', () => {
    const nell = canonicalizeOption('Talk to Nell Rudd');
    const col = canonicalizeOption('Talk to Col Thatch');
    const world = canonicalizeOption('Ask the world');
    expect(new Set([nell, col, world]).size).toBe(3);
    expect(canonicalizeOption('Ask Col Thatch what they want')).toBe(col);
    expect(canonicalizeOption('Talk to someone in the street')).not.toBe(canonicalizeOption('Ask what they want'));
    expect(canonicalizeOption('Travel toward Contract Hall')).not.toBe(canonicalizeOption('Travel toward West Wall'));
    expect(canonicalizeOption('Walk on')).not.toBe(canonicalizeOption('Scout for danger'));
    expect(canonicalizeOption('Enter Cathedral Undercroft')).not.toBe(canonicalizeOption('Travel toward Lowmarket'));
  });

  it('T10 close replay: a named person here is offered a talk chip', () => {
    const close = atTheClose();
    const raw = [...enumerateLegalEdges(close).map((e) => e.label), 'Ask the world', 'Talk to someone in the street'];
    expect(raw).toEqual(expect.arrayContaining(['Talk to Nell Rudd', 'Talk to Col Thatch']));
    const committed = commitTurn(close, 'Walk on', CLOSE_BEAT, raw);
    expect(resolveOfferedChoices(committed).some((c) => /^Talk to (?:Nell Rudd|Col Thatch)$/.test(c))).toBe(true);
  });

  it('back at the card place, "Talk to someone in the street" on the road does not cool "Ask what they want"', () => {
    // Harness turn 8 in the seed-80 run: the cooldown no longer removes the talk-step chip. (Talk at the
    // hold is also starved while no person record is here � that is the card-cast presence owner.)
    const cooldowns = new Map(Object.entries(cooldownsThrough(7)));
    expect(filterCooldownChoices(['Ask what they want', 'Look around', 'Search the area'], 8, cooldowns).filtered).toContain(
      'Ask what they want',
    );
  });
  it('the cooldown itself still works: a chip offered on turn N with cooldown 2 is off on N+1', () => {
    const map = updateCooldowns(['Talk to Nell Rudd'], 10, new Map());
    expect(filterCooldownChoices(['Talk to Nell Rudd', 'Talk to Col Thatch'], 11, map).filtered).toEqual(['Talk to Col Thatch']);
    expect(filterCooldownChoices(['Talk to Nell Rudd'], 12, map).filtered).toEqual(['Talk to Nell Rudd']);
  });
});
