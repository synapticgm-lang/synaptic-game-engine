/**
 * q57-AIPSRV — writer_turn ai_traffic logging (mock Supabase; no network).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInitialState } from '@/game/defaults';
import type { GameState } from '@/game/types';
import { POSES_CHOICE } from '@/game/engineFactGate';

const { inserts, insertError, mockSupabase } = vi.hoisted(() => {
  const inserts: Array<Record<string, unknown>> = [];
  const insertError: { current: { message: string } | null } = { current: null };
  const mockSupabase = {
    from: vi.fn((table: string) => ({
      insert: vi.fn((row: Record<string, unknown>) => {
        if (table === 'ai_traffic') {
          if (insertError.current) {
            return Promise.resolve({ error: insertError.current });
          }
          inserts.push(row);
        }
        return Promise.resolve({ error: null });
      }),
    })),
  };
  return { inserts, insertError, mockSupabase };
});

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: mockSupabase,
}));

import { logWriterTurn, buildWriterTurnFactCheck } from '@/services/writerTurnLog';
import { logApiLatency, setTelemetryContext } from '@/services/telemetryService';

function dndState(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    saveId: 'save-q57',
    turn: 3,
    character: { ...s.character, name: 'Jax' } as GameState['character'],
    ...over,
  } as GameState;
}

describe('q57-AIPSRV writerTurnLog', () => {
  beforeEach(() => {
    inserts.length = 0;
    insertError.current = null;
    vi.clearAllMocks();
    setTelemetryContext({ playerId: 'tester', saveId: 'save-q57', engineMode: 'dnd' });
  });

  it('(a) one writer_turn row shares turnRequestId with the callGm row', async () => {
    const turnRequestId = 'req-shared-q57';
    const state = dndState();
    logApiLatency({
      label: 'callGm',
      latencyMs: 10,
      engineMode: 'dnd',
      playerInput: 'Look around',
      aiResponse: 'Rain on the slate.',
      extra: { turnRequestId, snapshotGist: { turn: 3 } },
    });
    logWriterTurn({
      saveId: state.saveId,
      turnRequestId,
      turn: state.turn,
      playerInput: 'Look around',
      finalText: 'Rain on the slate.',
      firstDraft: 'Rain on the slate.',
      writerPacket: 'packet-body',
      bibleId: state.campaignBibleId,
      engineMode: state.engineMode,
      buildStamp: '2026-10-18z4',
      gate: { outcome: 'accepted', problems: [], remaining: [], repairs: 0, draftRetry: false, fightRetry: false },
      state,
      model: { id: null, tokensIn: null, tokensOut: null, tokensCached: null, modelCalls: null },
    });
    await Promise.resolve();
    await Promise.resolve();

    const callGm = inserts.find((r) => (r.payload as { label?: string })?.label === 'callGm');
    const writer = inserts.find((r) => (r.payload as { label?: string })?.label === 'writer_turn');
    expect(callGm).toBeTruthy();
    expect(writer).toBeTruthy();
    const callExtra = callGm!.payload as { turnRequestId: string; label: string };
    const writerPayload = writer!.payload as {
      label: string;
      turn: number;
      saveId: string;
      turnRequestId: string;
    };
    expect(writerPayload.label).toBe('writer_turn');
    expect(writerPayload.turn).toBe(3);
    expect(writerPayload.saveId).toBe('save-q57');
    expect(writerPayload.turnRequestId).toBe(turnRequestId);
    expect(callExtra.turnRequestId).toBe(turnRequestId);
  });

  it('(b) gate is present with empty arrays on a clean turn', async () => {
    const state = dndState();
    logWriterTurn({
      saveId: state.saveId,
      turnRequestId: 'req-clean',
      turn: state.turn,
      playerInput: 'Wait',
      finalText: 'Rain ran off the church roof.',
      firstDraft: 'Rain ran off the church roof.',
      writerPacket: 'p',
      state,
      model: null,
    });
    await Promise.resolve();
    const writer = inserts.find((r) => (r.payload as { label?: string })?.label === 'writer_turn');
    const gate = (writer!.payload as { gate: { problems: string[]; remaining: string[]; repairs: number } }).gate;
    expect(gate.problems).toEqual([]);
    expect(gate.remaining).toEqual([]);
    expect(gate.repairs).toBe(0);
  });

  it('(c) factCheck.pass false when engineFactProblems flags a sentence; true otherwise', () => {
    const state = dndState();
    const bad = buildWriterTurnFactCheck(
      state,
      'Now Jax had to decide whether to press about the Keep Gate or wait.',
      'Look',
    );
    expect(bad.pass).toBe(false);
    expect(bad.checker).toBe('engineFactProblems');
    expect(bad.errors.some((e) => e.msg === POSES_CHOICE)).toBe(true);
    expect(bad.errors[0]?.sentence).toMatch(/decide whether/i);

    const good = buildWriterTurnFactCheck(state, 'Rain ran off the church roof.', 'Look');
    expect(good.pass).toBe(true);
    expect(good.errors).toEqual([]);
  });

  it('(d) a 30000-char packet is capped at 24000 with packetTruncated true', async () => {
    const state = dndState();
    const big = 'x'.repeat(30_000);
    logWriterTurn({
      saveId: state.saveId,
      turnRequestId: 'req-cap',
      turn: state.turn,
      playerInput: 'Wait',
      finalText: 'Ok.',
      firstDraft: 'Ok.',
      writerPacket: big,
      state,
      model: null,
    });
    await Promise.resolve();
    const writer = inserts.find((r) => (r.payload as { label?: string })?.label === 'writer_turn');
    const payload = writer!.payload as { writerPacket: string; packetTruncated: boolean };
    expect(payload.writerPacket.length).toBe(24_000);
    expect(payload.packetTruncated).toBe(true);
  });

  it('(e) an insert error does not throw and the turn text is unchanged', async () => {
    insertError.current = { message: 'insert denied' };
    const state = dndState();
    const finalText = 'The door stays shut.';
    expect(() =>
      logWriterTurn({
        saveId: state.saveId,
        turnRequestId: 'req-err',
        turn: state.turn,
        playerInput: 'Push the door',
        finalText,
        firstDraft: finalText,
        writerPacket: 'p',
        state,
        model: null,
      }),
    ).not.toThrow();
    await Promise.resolve();
    expect(finalText).toBe('The door stays shut.');
    expect(inserts.length).toBe(0);
  });

  it('(f) no writer_turn row on a Free MUD turn', async () => {
    const state = dndState();
    logWriterTurn({
      skip: true,
      saveId: state.saveId,
      turnRequestId: 'req-mud',
      turn: state.turn,
      playerInput: 'Look around',
      finalText: 'Receipt only.',
      firstDraft: '',
      writerPacket: '',
      state,
      model: null,
    });
    await Promise.resolve();
    expect(inserts.filter((r) => (r.payload as { label?: string })?.label === 'writer_turn')).toHaveLength(0);
  });
});
