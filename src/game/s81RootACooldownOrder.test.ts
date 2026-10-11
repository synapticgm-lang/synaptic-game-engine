/**
 * Root A (seed 81) — cooldowns are written from the list actually offered, after it is compiled.
 * The turn's compile reads the map as it stood before this turn, so no raw chip cools itself on the
 * turn it is first offered.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { applyGovernanceCommit } from './qualityGovernance';
import { commitOfferedPad } from './playTranscript';
import { enumerateLegalEdges } from './graphChoices';
import type { OptionCooldown } from './optionDiversityContract';
import type { GameState, LogEntry } from './types';

const LOWMARKET_BEAT =
  'Jax came out of the narrow back streets and stepped into Lowmarket, where the market noise hit them all at once. Osric Coyne said, "You made it off the close, then. Good. Few do." Maud Pike stood behind a table of old parts and said nothing, but her eyes followed Jax the whole way in. The afternoon light was already going long, and Jax had no coin and no clear next step.';

/** The seed-81 player lines, turns 1..20. */
const S81_PLAYER_LINES = [
  'Ask what they want', 'Accept the offer', 'Travel toward Cathedral Close', 'Return to Cathedral Close', 'Wait and watch',
  'Check the exits', 'Ask Nell Rudd what they want', 'Search the area', 'Travel toward Lowmarket', 'Face the thugs',
  'Talk your way past the thugs', 'Turn back toward Cathedral Close', 'Check the chest', 'Check the kitchen door',
  'Ask Col Thatch what they want', 'Search the area', 'Travel toward Cathedral Undercroft', 'Walk on', 'Travel toward Lowmarket',
  'Walk on',
];

const cd = (canonical: string, lastOfferedTurn: number, offerCount: number, cooldownTurns: number): [string, OptionCooldown] => [
  canonical,
  { canonical, lastOfferedTurn, offerCount, cooldownTurns },
];

/** The seed-81 save's cooldown map before the turn-21 commit (turn-21 entries taken out). */
const PRE_TURN_COOLDOWNS: Record<string, OptionCooldown> = Object.fromEntries([
  cd('travel:cathedral undercroft:explore', 19, 7, 10),
  cd('travel:lowmarket:explore', 19, 2, 2),
  cd('travel:west wall:explore', 19, 2, 2),
  cd('generic:walk on:act', 20, 3, 2),
  cd('generic:greet whoever is coming:act', 20, 1, 2),
  cd('generic:turn back toward cathedral undercroft:act', 20, 1, 2),
  cd('ask:col thatch:gather_info', 15, 2, 2),
  cd('ask:nell rudd:gather_info', 15, 2, 2),
  cd('generic:look around:act', 16, 2, 2),
  cd('ask:someone in the street:gather_info', 18, 1, 2),
]);

const PEOPLE = ['Osric Coyne', 'Maud Pike'];

/** Seed 81 before the turn-21 commit, and the harness's turn-21 state with the raw pad as `choices`. */
function lowmarketTurn21(): { previous: GameState; next: GameState } {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 81, personality: 'cold-system' });
  const base = stampOpening(state);
  const playerLog: LogEntry[] = S81_PLAYER_LINES.map((content, i) => ({
    id: `p${i + 1}`,
    turn: i + 1,
    role: 'player',
    content,
    timestamp: 0,
  }));
  const previous: GameState = {
    ...base,
    turn: 20,
    journey: undefined,
    activeEncounter: undefined,
    log: playerLog,
    qualityGovernance: { ...(base.qualityGovernance ?? {}), optionCooldowns: PRE_TURN_COOLDOWNS } as GameState['qualityGovernance'],
  };
  const here: GameState = {
    ...previous,
    turn: 21,
    currentLocation: 'Lowmarket',
    sceneFacts: {
      ...(previous.sceneFacts ?? {}),
      present: PEOPLE,
      crowdCount: 2,
      indoor: false,
      propsPlace: 'Lowmarket',
      cameraLock: { scale: 'outdoor', label: 'Lowmarket', lockedTurn: 21 },
    } as GameState['sceneFacts'],
    npcMemories: [
      ...(previous.npcMemories ?? []),
      ...PEOPLE.map((name) => ({
        npcId: `town-${name.toLowerCase().replace(/\s+/g, '-')}`,
        npcName: name,
        disposition: 'unknown',
        facts: ['Introduced in play T21'],
        lastSeenTurn: 21,
        met: true,
        location: 'Lowmarket',
        meetCount: 0,
        introSpoken: true,
        completedTopics: ['intro'],
        relationshipStatus: 'stranger',
      })),
    ] as GameState['npcMemories'],
    log: [...playerLog, { id: 'g21', turn: 21, role: 'gm', content: LOWMARKET_BEAT, timestamp: 0 }],
  };
  return { previous, next: { ...here, choices: enumerateLegalEdges(here).map((e) => e.label) } };
}

/** The harness commit order: governance first, then the one compile of the turn's list. */
function commitInOrder(previous: GameState, next: GameState, input: string, gmId: string): GameState {
  const gov = applyGovernanceCommit(previous, next, input);
  return commitOfferedPad({ ...next, ...gov.patches, choices: next.choices }, gmId);
}

describe('s81 Root A — cooldowns written from the offered list, after the compile', () => {
  it('Lowmarket T21: the raw talk chips are offered, and the map then holds them at turn 21', () => {
    const { previous, next } = lowmarketTurn21();
    expect(next.choices).toEqual(expect.arrayContaining(['Talk to Osric Coyne', 'Talk to Maud Pike']));
    const committed = commitInOrder(previous, next, 'Walk on', 'g21');
    expect(committed.choices).toEqual(expect.arrayContaining(['Talk to Osric Coyne', 'Talk to Maud Pike']));
    const map = committed.qualityGovernance?.optionCooldowns ?? {};
    expect(map['ask:osric coyne:gather_info']?.lastOfferedTurn).toBe(21);
    expect(map['ask:maud pike:gather_info']?.lastOfferedTurn).toBe(21);
  });

  it('governance alone no longer writes this turn into the cooldown map', () => {
    const { previous, next } = lowmarketTurn21();
    const gov = applyGovernanceCommit(previous, next, 'Walk on');
    expect(gov.patches.qualityGovernance?.optionCooldowns?.['ask:osric coyne:gather_info']).toBeUndefined();
  });

  it('the cooldown still works: a chip offered on turn N is dropped on turn N+1', () => {
    const { previous, next } = lowmarketTurn21();
    const t21 = commitInOrder(previous, next, 'Walk on', 'g21');
    const t22raw: GameState = {
      ...t21,
      turn: 22,
      log: [
        ...(t21.log ?? []),
        { id: 'p22', turn: 21, role: 'player', content: 'Wait and watch', timestamp: 0 },
        { id: 'g22', turn: 22, role: 'gm', content: 'Osric Coyne went on sorting nails. Maud Pike counted coins under the table.', timestamp: 0 },
      ],
      choices: enumerateLegalEdges(t21).map((e) => e.label),
    };
    const t22 = commitInOrder(t21, t22raw, 'Wait and watch', 'g22');
    expect(t22.choices).not.toContain('Talk to Osric Coyne');
    expect(t22.choices).not.toContain('Talk to Maud Pike');
  });
});
