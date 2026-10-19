import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../game/defaults';
import { applyGovernanceToProse, commitHeldGmReply } from '../game/qualityGovernance';
import { classifyTurnFailure, shouldAutoRetryTurn } from '../game/errorRepairWarden';
import { logWriterTurn } from '../services/writerTurnLog';
import { logApiLatency } from '../services/telemetryService';
import type { GameState } from '../game/types';

vi.mock('../services/telemetryService', async () => {
  const actual = await vi.importActual<typeof import('../services/telemetryService')>('../services/telemetryService');
  return {
    ...actual,
    logApiLatency: vi.fn(),
    logAiTraffic: vi.fn(),
    logErrorStack: vi.fn(),
  };
});

function tabletopState(): GameState {
  const state = createInitialState('Cursed Keep', 'dnd');
  state.turn = 3;
  state.campaignBibleId = 'cursed-keep';
  state.log = [];
  return state;
}

describe('q61-LOSTREPLY', () => {
  it('a callGm that fails once then succeeds commits one reply and one writer_turn', async () => {
    const state = tabletopState();
    let calls = 0;
    const callGm = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('500 API Error');
      return { text: 'The gate captain points you through.' };
    });
    let text = '';
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        text = (await callGm()).text;
        break;
      } catch (err) {
        const kind = classifyTurnFailure(err);
        if (!shouldAutoRetryTurn(kind) || attempt >= 2) {
          logApiLatency({ label: 'callGm', latencyMs: 0, failed: true });
          throw err;
        }
      }
    }
    applyGovernanceToProse(state, text, 'Follow up with the captain');
    logWriterTurn({
      turn: state.turn,
      playerInput: 'Follow up with the captain',
      finalText: text,
      firstDraft: text,
      writerPacket: 'Follow up with the captain',
      engineMode: 'dnd',
      state,
    });
    const committed = commitHeldGmReply(state, text);
    const again = commitHeldGmReply(committed, text);
    expect(callGm).toHaveBeenCalledTimes(2);
    expect(committed.turn).toBe(state.turn + 1);
    expect(committed.log.filter((e) => e.role === 'gm' && e.content === text)).toHaveLength(1);
    expect(again.log.filter((e) => e.role === 'gm' && e.content === text)).toHaveLength(1);
    expect(again.turn).toBe(committed.turn);
    expect(logApiLatency).not.toHaveBeenCalled();
    const traffic = (await import('../services/telemetryService')).logAiTraffic as ReturnType<typeof vi.fn>;
    const writerRows = traffic.mock.calls.filter((c) => c[0]?.payload?.label === 'writer_turn');
    expect(writerRows).toHaveLength(1);
  });
});