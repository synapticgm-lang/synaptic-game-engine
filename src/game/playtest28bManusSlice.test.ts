import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  runArcDirectorBeforeGm,
  formatArcStatusReceipts,
} from './arcDirector';
import { pushBeatStateTx } from './stateTx';
import { applyDailyQuestMilestone } from './dailyMilestoneLedger';
import { STAGNATION_MID_WRITER_ENABLED, resolveWriterTierForTurn } from './writerPolicy';
import { isDiscoveryExhausted } from './discoveryXpLedger';
import { compileChoices } from './choiceCompiler';
import { countTurnReceipts } from './receiptTelemetry';

describe('playtest28b — Manus slice + T12 hook wiring', () => {
  it('T12 talk path: stage-2 commits with STATUS receipts by T10', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 10;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'test',
        status: 'active',
        type: 'main',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'bearings', completed: true },
          { id: 'o2', description: 'hear reason', completed: false },
          { id: 'o3', description: 'choose', completed: false },
        ],
      },
    ];
    state.arcDirector = { committedBeatIds: ['sp-beat-orient'] };
    const arc = runArcDirectorBeforeGm(state, 'Ask who summoned me and why');
    expect(arc.beatCommitted).toBe(true);
    expect(arc.beatId).toBe('sp-beat-hear-reason');
    const status = formatArcStatusReceipts(arc);
    expect(status.some((l) => /Circle's Price/i.test(l))).toBe(true);
    expect(status.some((l) => /XP Gained: 45/i.test(l))).toBe(true);
    const nextTurn = state.turn + 1;
    const receipts = countTurnReceipts(arc.state, nextTurn);
    expect(receipts.questStage).toBeGreaterThanOrEqual(1);
    expect(receipts.beatCommit).toBeGreaterThanOrEqual(1);
  });

  it('beat StateTx uses GM response turn (state.turn + 1)', () => {
    const state = createInitialState();
    state.turn = 5;
    const next = pushBeatStateTx(state, 'Circle\'s Price: reason heard', {
      beatId: 'sp-beat-hear-reason',
      eventSeq: 1,
      why: 'test',
      questStage: 'Circle\'s Price: reason heard (stage 2)',
    });
    const tx = next.stateTxLog?.filter((t) => t.kind === 'quest_stage') ?? [];
    expect(tx[tx.length - 1]?.turn).toBe(6);
  });

  it('B045 daily quest milestone awards once per UTC day', () => {
    const state = createInitialState(undefined, 'litrpg');
    const questsBefore = [
      {
        id: 'q1',
        name: 'Test',
        description: '',
        status: 'active' as const,
        type: 'main' as const,
        revealed: true,
        objectives: [{ id: 'o1', description: 'step', completed: false }],
      },
    ];
    const questsAfter = [
      {
        ...questsBefore[0],
        objectives: [{ id: 'o1', description: 'step', completed: true }],
      },
    ];
    const first = applyDailyQuestMilestone(state, { questsBefore, questsAfter });
    expect(first?.xp).toBe(20);
    const second = applyDailyQuestMilestone(
      { ...state, sandboxAwardKeys: [first!.awardKey] },
      { questsBefore, questsAfter }
    );
    expect(second).toBeNull();
  });

  it('stagnation Mid writer is explicitly disabled', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(resolveWriterTierForTurn('free', { stagnationLevel: 5, loopCount: 10 })).toBe('free');
  });

  it('I07 discovery exhaustion blocks repeat object awards', () => {
    const ledger = new Map([
      [
        'object:wall@ruin',
        {
          key: 'object:wall@ruin',
          target: 'wall',
          type: 'object' as const,
          context: 'ruin',
          turn: 1,
          xpAwarded: 5,
          inspectionCount: 1,
        },
      ],
    ]);
    expect(isDiscoveryExhausted('wall', 'object', 'ruin', ledger)).toBe(true);
  });

  it('I10 hub beat exhaustion drops gate-queue pads after 2 hub beats', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.currentLocation = 'Lowmarket';
    state.turn = 12;
    state.sandboxAwardKeys = [
      'hub-beat:sp-hub-lowmarket:v0:12',
      'hub-beat:sp-hub-lowmarket:v1:14',
    ];
    const { choices, notes } = compileChoices(state, [
      'Travel toward the gate queue',
      'Ask what they want',
      'Scout the exit',
    ]);
    expect(choices.some((c) => /gate|queue/i.test(c))).toBe(false);
    expect(notes.some((n) => /Hub beat exhausted/i.test(n))).toBe(true);
  });
});
