import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../game/defaults';
import { applyGovernanceToProse, commitHeldGmReply } from '../game/qualityGovernance';
import { applySaveRepair } from '../game/saveMigration';
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

function otherShapeState(): GameState {
  const state = createInitialState('Cursed Keep', 'dnd');
  state.turn = 3;
  state.campaignBibleId = 'cursed-keep';
  state.sceneFacts = {
    props: [],
    present: ['Sera Quill'],
    crowd: 'present',
    noise: 'quiet',
    lastBeat: '',
    updatedTurn: 3,
  };
  state.arcDirector = {
    ...(state.arcDirector ?? {}),
    npcMemories: [
      {
        npcId: 'Sera Quill',
        npcName: 'Sera Quill',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 3,
      } as never,
    ],
  };
  return state;
}

describe('q63-MEMGROUND', () => {
  it('other-shape ledger does not throw, and load normalises it', () => {
    const state = otherShapeState();
    expect(() => applyGovernanceToProse(state, 'Sera Quill keeps the gate.', 'Talk to Sera Quill')).not.toThrow();
    const loaded = applySaveRepair(state).state;
    const entry = loaded.arcDirector?.npcMemories?.[0];
    expect(Array.isArray(entry?.memories)).toBe(true);
    expect(Array.isArray(entry?.keyMoments)).toBe(true);
    expect(entry?.npcId).toBe('Sera Quill');
    const again = applySaveRepair(loaded).state.arcDirector?.npcMemories?.[0];
    expect(again?.memories).toEqual(entry?.memories);
    expect(again?.keyMoments).toEqual(entry?.keyMoments);
  });

  it('a successful callGm commits one reply, advances one turn, and logs no 500', async () => {
    const state = otherShapeState();
    const callGm = vi.fn(async () => ({ text: 'Sera Quill answers you at the gate.' }));
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
    applyGovernanceToProse(state, text, 'Talk to Sera Quill');
    logWriterTurn({
      turn: state.turn,
      playerInput: 'Talk to Sera Quill',
      finalText: text,
      firstDraft: text,
      writerPacket: 'Talk to Sera Quill',
      engineMode: 'dnd',
      state,
    });
    const committed = commitHeldGmReply(state, text);
    const gm = committed.log.filter((e) => e.role === 'gm' && e.content === text);
    expect(callGm).toHaveBeenCalledTimes(1);
    expect(gm).toHaveLength(1);
    expect(committed.turn).toBe(state.turn + 1);
    expect(logApiLatency).not.toHaveBeenCalled();
    const traffic = (await import('../services/telemetryService')).logAiTraffic as ReturnType<typeof vi.fn>;
    const writerRows = traffic.mock.calls.filter((c) => c[0]?.payload?.label === 'writer_turn');
    expect(writerRows).toHaveLength(1);
  });
});
