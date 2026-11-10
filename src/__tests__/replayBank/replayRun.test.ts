import { describe, expect, it } from 'vitest';
import { stepAt, type ReplayStep } from './replayRun';

/** A saved row whose harness turn is 2. The opening page sits on `before` (state.turn 1). */
function firstPlayerRow(): ReplayStep {
  return {
    before: {
      turn: 1,
      currentLocation: 'the ledger stair',
      log: [{ id: 'gm-0', turn: 0, role: 'gm', content: 'The stair held.', timestamp: 0 }],
      choices: ['Look around'],
    } as ReplayStep['before'],
    after: { turn: 2, currentLocation: 'West Wall' } as ReplayStep['after'],
    recorded: { turn: 2, playerInput: 'Walk on', fatePick: 'Walk on' } as ReplayStep['recorded'],
    telemetry: {
      turn: 2,
      playerInput: 'Walk on',
      fatePick: 'Walk on',
      gmText: 'You walked.',
      offeredChoices: ['Walk on'],
    } as ReplayStep['telemetry'],
    writerPackets: ['TURN 2 PACKET'],
  };
}

describe('replay stepAt', () => {
  it('turn 1 is the opening page when the saved rows start at turn 2', () => {
    const row = firstPlayerRow();
    const open = stepAt([row], 1);
    expect(open.recorded.turn).toBe(1);
    expect(open.after.currentLocation).toBe('the ledger stair');
    expect(open.before.currentLocation).toBe('the ledger stair');
    expect(open.telemetry.playerInput).toBe('');
    expect(open.telemetry.gmText).toBe('The stair held.');
    expect(open.writerPackets).toEqual([]);
    expect(stepAt([row], 2).recorded.turn).toBe(2);
    expect(stepAt([row], 2).telemetry.playerInput).toBe('Walk on');
  });
});
