/**
 * Multi lap 14 — three gate misreads that dropped true sentences after the one-sentence repair:
 * on a leg, the place the trip set out from is part of the road, not the camera left behind;
 * "the Close" / "still in the close" is HERE (Cathedral Close) by HERE's own words, and the claimed
 * place ends where its clause goes on; a dungeon room handed as "Place — Room" is a place, not an
 * invented person.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const G150 = '2026-10-11T21-31-25-790Z_summoned-pact_cold-system_s150';
const D151 = '2026-10-11T21-31-31-830Z_summoned-pact_cold-system_s151';
let G: Replay;
let D: Replay;
beforeAll(async () => {
  G = new Replay(await replayWhole(G150));
  D = new Replay(await replayWhole(D151));
}, 1_200_000);

/** The state the gate checked a turn's prose against (the turn's own packet is on the after state). */
const gateState = (X: Replay, n: number) => ({ ...X.before(n), completedEvent: X.after(n).completedEvent ?? X.before(n).completedEvent });

describe('replay bank multi lap 14', () => {
  it('[m14 g5-150 T16 | lap 14 underway] on the leg from the Weighing Cup, naming it as a landmark is the road; standing in it is stale', () => {
    const state = gateState(G, 16);
    expect(state.journey?.from, 'replay is on leg 1 from the Weighing Cup').toBe('The Weighing Cup');
    expect(state.currentLocation).toBe('On the road between places');
    for (const s of [
      'Jax spoke once toward the Weighing Cup and gathered their courage to ask.',
      'The stretch around the Weighing Cup stayed quiet and gave them no reply or interruption.',
      'Jax was on the back streets from the Weighing Cup, moving in clear steps toward midday.',
    ]) {
      expect(sentenceGateProblem(state, s, G.input(16)), s).toBeNull();
    }
    expect(sentenceGateProblem(state, 'Jax sat back down at the Weighing Cup and waited.', G.input(16))).toMatch(/already left/);
  });

  it('[m14 ds151 T7, g5-150 T9 | lap 14 HERE short name] "still in the close" and "here in the Close and …" are Cathedral Close; another place is still wrong', () => {
    const d = gateState(D, 7);
    const g = gateState(G, 9);
    expect(d.currentLocation).toBe('Cathedral Close');
    expect(g.currentLocation).toBe('Cathedral Close');
    expect(
      sentenceGateProblem(d, "Nell Rudd and Col Thatch were still in the close, and one of them had surely seen Jax's hand vanish into nothing and come back full.", D.input(7))
    ).toBeNull();
    expect(sentenceGateProblem(g, 'More progress did not finish anything here in the Close and questions waited.', G.input(9))).toBeNull();
    expect(sentenceGateProblem(g, 'There was nothing left to finish here in the Close, and questions waited.', G.input(9))).toBeNull();
    expect(sentenceGateProblem(g, 'Jax was still in Lowmarket and the stalls were closing.', G.input(9))).toBeTruthy();
  });

  it('[m14 g5-150 T21 | lap 14 dungeon room] "Cathedral Undercroft — Stair Descent" is the room Jax entered, not an invented person; an unhanded name still fails', () => {
    const state = gateState(G, 21);
    expect(state.completedEvent?.allowlist).toContain('Cathedral Undercroft — Stair Descent');
    expect(
      sentenceGateProblem(state, 'Jax reached Cathedral Undercroft — Stair Descent and stood on the worn stone steps.', G.input(21))
    ).toBeNull();
    expect(sentenceGateProblem(state, 'Orla Venn waits at the foot of the stair and nods to Jax.', G.input(21))).toMatch(/Invents a person/);
  });
});
