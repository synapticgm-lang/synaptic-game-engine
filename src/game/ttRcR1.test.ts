/**
 * Order RC-R1 — fight-close once: engine combat-log line outside prose (John 15 Oct 23:44).
 * Acceptance: docs/orders/acceptance-tests-new-orders.md § RC-R1.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { buildCompletedEventPacket } from './completedEventPacket';
import { engineResultFact, terminalFightOutcome, terminalOutcomeSentence } from './engineResult';
import { withMissingFightFacts } from './beatCommitGate';
import { runWriterTurnWithFightRetry } from './writerTurn';
import { parsePlayerIntent } from './intentParser';

const FOE = 'Cave Spider';
const FACT = engineResultFact([
  `Fight: VICTORY vs ${FOE} in 2 rounds. The fight is over: ${FOE} is down and cannot fight on.`,
]);

function settled(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  const base = {
    ...s,
    engineMode: 'dnd' as const,
    campaignBibleId: 'cursed-keep',
    turn: 18,
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    sceneFacts: { ...(s.sceneFacts ?? {}), lastKill: { name: FOE, outcome: 'victory' as const, turn: 18, remains: true } },
  } as GameState;
  const withPacket = {
    ...base,
    completedEvent: buildCompletedEventPacket(base, 'Attack the Cave Spider', { engineResult: FACT }),
    ...over,
  } as GameState;
  return withPacket;
}

const pov = { who: 'Jax', him: 'them' as const };

describe('RC-R1 fight-close once (engine combat log)', () => {
  it('R1-a: writer told the kill — outcome exactly once on the combat log, not in prose', async () => {
    const state = settled();
    const told =
      'Jax drove the shortsword through the Cave Spider. It crumpled on the flagstones and did not rise.';
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: told,
      packet: state.completedEvent!,
      check: {
        state,
        playerInput: 'Attack the Cave Spider',
        intent: parsePlayerIntent('Attack the Cave Spider', state),
        engineFact: FACT,
        previousGm: '',
      },
      rewrite: async () => '',
    });
    expect(turn.prose).toBe(told);
    expect(turn.prose).not.toMatch(/went down and did not get up, and the fight was over/);
    expect(turn.outcomeShown).toBe('engine');
    expect(turn.combatLog).toBe(`The ${FOE} went down and did not get up, and the fight was over.`);
    expect(withMissingFightFacts(state, told, pov)).toBe(told);
  });

  it('R1-b: writer omits the kill — outcome still shown once by the engine', async () => {
    const state = settled();
    const quiet = 'Jax swung hard by the gate and the corridor went still.';
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: quiet,
      packet: state.completedEvent!,
      check: {
        state,
        playerInput: 'Attack the Cave Spider',
        intent: parsePlayerIntent('Attack the Cave Spider', state),
        engineFact: FACT,
        previousGm: '',
      },
      rewrite: async () => '',
    });
    expect(turn.prose).toBe(quiet);
    expect(turn.outcomeShown).toBe('engine');
    expect(turn.combatLog).toMatch(/^The Cave Spider went down/);
  });

  it('R1-c: forced attempt and foe hit are still added into prose', () => {
    const fact =
      `Parley check: d20 3 −1 = 2 vs DC 12 — failure. Fight: ${FOE} forces the fight. ` +
      `Fight: You attack the ${FOE} and miss. The ${FOE} attacks you and hits you for 4. ` +
      `Fight: VICTORY vs ${FOE} in 1 rounds. The fight is over: ${FOE} is down and cannot fight on.`;
    const state = settled({
      completedEvent: { engineResult: fact } as GameState['completedEvent'],
    });
    const prose = 'Jax stood by the gate and waited.';
    const out = withMissingFightFacts(state, prose, pov);
    expect(out).toMatch(/tried to talk/);
    expect(out).toMatch(/hit them/);
    expect(out).not.toMatch(/went down and did not get up, and the fight was over/);
    expect(terminalOutcomeSentence(terminalFightOutcome(fact)!, pov)).toMatch(/^The Cave Spider went down/);
  });

  it('R1-d: foe name keeps its article', () => {
    const fight = terminalFightOutcome(FACT)!;
    expect(fight.foeDisplay).toBe(`The ${FOE}`);
    expect(terminalFightOutcome('Fight: VICTORY vs the Cave Spider in 1 rounds')!.foeDisplay).toBe(
      'The Cave Spider'
    );
    expect(terminalOutcomeSentence(fight, pov)).toBe(
      `The ${FOE} went down and did not get up, and the fight was over.`
    );
    expect(terminalOutcomeSentence(fight, pov)).not.toMatch(/^Cave Spider went down/);
  });
});
