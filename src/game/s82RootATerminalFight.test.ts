/**
 * Root A (seed 82) — the engine settled a fight this turn: the commit gate rejects a beat that never
 * states that outcome; one rewrite, then the last-resort paint from the engine result.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { attachCompletedEvent } from './completedEventPacket';
import { classifyBeatCommit } from './beatCommitGate';
import { engineResultFact } from './engineResult';
import { runWriterTurnWithFightRetry } from './writerTurn';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './graphChoices';
import { parsePlayerIntent } from './intentParser';
import type { GameState } from './types';

const DESK = 'the wagon desk of the Argent Ledger';
const FOE = 'Void-Touched Scavenger';

const T13_RECEIPTS = [
  `Fight: ${FOE} forces the fight`,
  `Fight: VICTORY vs ${FOE} in 3 rounds. The fight is over: ${FOE} is down and cannot fight on.`,
  `Encounter cleared: ${FOE} (victory)`,
  `XP Gained: 40 (defeated ${FOE})`,
  'Gold Gained: 5',
  'Loot: [Common] Worn Hand Axe — found after the blow; not in hand before it; not the weapon that won. In hand before the blow: bare hands.',
];

/** The accepted s82 T13 beat: Jax running, the scavenger still gripping his collar. */
const T13_PROSE =
  "Jax turned from the wagon desk of the Argent Ledger and ran for the gap between the wagons, boots slapping the hard-packed Lowmarket dirt. Yara Quill did not shout after them; she only watched the run with her arms folded and her jaw set. Something came out of the dark behind the last wagon and slammed Jax sideways into a wheel hub. The Void-Touched Scavenger had no face left to read, but its grip on Jax's collar was honest and heavy. Jax's Mark still sat on the desk, and Kade Voss was already reaching for it.";

const DOWN_PROSE =
  "Jax broke for the gap between the wagons, but the Void-Touched Scavenger came out of the dark and dragged them back by the collar. Three hard exchanges later the scavenger went down in the dirt by the wheel hub and did not get up. Yara Quill watched from behind the wagon desk of the Argent Ledger with her arms folded. Kade Voss let out a breath and took his hand off the desk.";

function t13(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 82, personality: 'cold-system' });
  const s: GameState = {
    ...stampOpening(state),
    turn: 13,
    currentLocation: DESK,
    journey: null,
    activeEncounter: undefined,
    activeDungeon: undefined,
  };
  const killed: GameState = {
    ...s,
    sceneFacts: { ...s.sceneFacts!, lastKill: { name: FOE, outcome: 'victory', turn: 13, remains: true } },
  };
  return attachCompletedEvent(killed, 'Try to flee', { engineResult: engineResultFact(T13_RECEIPTS) });
}

function check(state: GameState) {
  return {
    state,
    playerInput: 'Try to flee',
    intent: parsePlayerIntent('Try to flee', state),
    engineFact: engineResultFact(T13_RECEIPTS),
    previousGm: '',
  };
}

describe('s82 Root A — a settled fight must be on the page', () => {
  it('the gate rejects the T13 beat and accepts one that writes the scavenger down', () => {
    const state = t13();
    const bad = classifyBeatCommit(state, T13_PROSE, 'Try to flee');
    expect(bad.accept).toBe(false);
    expect(bad.details?.join(' ')).toMatch(/settled the fight/);
    const good = classifyBeatCommit(state, DOWN_PROSE, 'Try to flee');
    expect(good.details?.join(' ') ?? '').not.toMatch(/settled the fight/);
  });

  it('one rewrite: a beat that states the outcome commits', async () => {
    const state = t13();
    const asked: string[] = [];
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: T13_PROSE,
      packet: state.completedEvent!,
      check: check(state),
      rewrite: async (problem) => {
        asked.push(problem);
        return DOWN_PROSE;
      },
    });
    expect(asked).toHaveLength(1);
    expect(turn.fightRetry).toBe('retried');
    expect(turn.prose).toMatch(/went down/);
  });

  it('a second miss paints the engine result instead', async () => {
    const state = t13();
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: T13_PROSE,
      packet: state.completedEvent!,
      check: check(state),
      rewrite: async () => T13_PROSE,
    });
    expect(turn.fightRetry).toBe('painted');
    expect(turn.prose).toMatch(new RegExp(`${FOE} went down and did not get up`));
    expect(turn.prose).not.toMatch(/grip on Jax's collar/);
  });

  it('the next list holds no flee chips', () => {
    const after: GameState = {
      ...t13(),
      turn: 14,
      log: [
        { id: 'p13', turn: 13, role: 'player', content: 'Try to flee', timestamp: 0 },
        { id: 'g14', turn: 14, role: 'gm', content: DOWN_PROSE, timestamp: 0 },
      ],
    };
    const raw = enumerateLegalEdges(after).map((e) => e.label);
    const { choices } = compileChoices(after, raw, undefined, 'Try to flee');
    expect(choices.join(' | ')).not.toMatch(/\b(keep running|try to flee|find cover|look for an exit)\b/i);
  });
});
