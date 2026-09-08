/**
 * Batch 08b — shrink Title-Case gate, authored stitch, ledger-noun slots, no Talk lastKill.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { runArcDirectorBeforeGm } from './arcDirector';
import { classifyBeatCommit } from './beatCommitGate';
import { compileChoices } from './choiceCompiler';
import { compileGraphChoiceLabels, enumerateLegalEdges } from './graphChoices';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  proseViolatesEventPacket,
} from './completedEventPacket';
import { initEncounterTerminal } from './encounterTerminalFsm';
import type { GameState } from './types';

function litrpgState(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 12,
    currentLocation: 'West Wall',
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    },
    sceneFacts: emptySceneFacts(12),
    ...partial,
  };
}

function liveSkirmish(hp = 3): GameState {
  const base = litrpgState();
  const enc = initEncounterTerminal(
    {
      name: 'Pact-Hunter Skirmisher',
      level: 1,
      hp,
      maxHp: 16,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 25,
      goldReward: 5,
    },
    base
  );
  return {
    ...base,
    activeEncounter: enc,
    sceneFacts: {
      ...emptySceneFacts(12),
      present: ['Pact-Hunter Skirmisher'],
      tension: 'combat',
    },
  };
}

describe('08b stamps + Free writer + Mid OFF', () => {
  it('HUD/BUILD are 2026-09-08b, Mid writer OFF, Free is DeepSeek', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-08b');
    expect(BUILD_STAMP).toBe('2026-09-08b');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe('deepseek/deepseek-v4-flash-0731');
  });
});

describe('08b — gate shrink', () => {
  it('living lastKill is still rejected', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    expect(
      proseViolatesEventPacket(
        'The Pact-Hunter Skirmisher looks up and nods in greeting.',
        packet
      )
    ).toBe(true);
    expect(
      classifyBeatCommit(
        { ...after.state, completedEvent: packet },
        'The Pact-Hunter Skirmisher looks up and nods in greeting.',
        'Attack the Pact-Hunter Skirmisher'
      ).reasons
    ).toContain('event-packet');
  });

  it('invented Title-Case in otherwise legal combat prose is not enough to force stitch', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    const prose =
      'The skirmisher staggered at West Wall. Standing stones caught the light. Your strike landed. The body stayed on the stones.';
    expect(proseViolatesEventPacket(prose, packet)).toBe(false);
    const gate = classifyBeatCommit(
      { ...after.state, completedEvent: packet },
      prose,
      'Attack the Pact-Hunter Skirmisher'
    );
    expect(gate.reasons).not.toContain('event-packet');
    expect(gate.accept).toBe(true);
  });
});

describe('08b — authored stitch slots', () => {
  it('stitch has no pad-intent nouns', () => {
    const askGoing = buildCompletedEventPacket(litrpgState(), 'Ask what is going on');
    expect(askGoing.target ?? '').not.toMatch(/what is going on/i);
    const s1 = assemblePacketStitch(askGoing);
    expect(s1).not.toMatch(/what is going on/i);
    expect(s1).not.toMatch(/You acted at landing/i);
    expect(s1).not.toMatch(/That beat closed/i);

    const askDirect = buildCompletedEventPacket(litrpgState(), 'Ask a direct question');
    expect(askDirect.target ?? '').not.toMatch(/direct question/i);
    expect(assemblePacketStitch(askDirect)).not.toMatch(/direct question/i);

    const attackHold = buildCompletedEventPacket(liveSkirmish(10), 'Attack with what you are holding');
    expect(attackHold.target ?? '').not.toMatch(/what you are holding/i);
    const s3 = assemblePacketStitch(attackHold);
    expect(s3).not.toMatch(/what you are holding/i);
    expect(s3).not.toMatch(/The blow landed/i);
  });

  it('inspect during a fight is not The blow landed', () => {
    const packet = buildCompletedEventPacket(liveSkirmish(10), 'Look around');
    expect(packet.outcome).toBe('inspected');
    const stitch = assemblePacketStitch(packet);
    expect(stitch).not.toMatch(/The blow landed/i);
    expect(stitch).toMatch(/fight|lane|eyes|reading/i);
  });

  it('same stitch template is starved in last 10', () => {
    const packet = buildCompletedEventPacket(liveSkirmish(10), 'Look around');
    const a = assemblePacketStitch(packet, []);
    const b = assemblePacketStitch(packet, [a]);
    const c = assemblePacketStitch(packet, [a, b]);
    expect(b).not.toBe(a);
    expect(c).not.toBe(a);
    expect(c).not.toBe(b);
    const again = assemblePacketStitch(packet, [a, b, c]);
    expect([a, b, c]).toContain(again);
  });
});

describe('08b — no Talk lastKill pads', () => {
  it('graph + compiler never offer Talk lastKill after a kill', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const withCorpsePresent = {
      ...after.state,
      sceneFacts: {
        ...after.state.sceneFacts!,
        present: ['Pact-Hunter Skirmisher', ...(after.state.sceneFacts?.present ?? [])],
      },
    };
    const edges = enumerateLegalEdges(withCorpsePresent);
    expect(edges.some((e) => /Talk to .*Skirmisher/i.test(e.label))).toBe(false);
    const graph = compileGraphChoiceLabels(withCorpsePresent);
    expect(graph.some((l) => /Talk to .*Skirmisher/i.test(l))).toBe(false);
    const compiled = compileChoices(withCorpsePresent, [
      'Talk to Pact-Hunter Skirmisher',
      'Ask Pact-Hunter Skirmisher what they want',
      'Look around',
    ]);
    expect(compiled.choices.some((c) => /Talk to .*Skirmisher/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /Ask .*Skirmisher/i.test(c))).toBe(false);

    const spoke = buildCompletedEventPacket(withCorpsePresent, 'Talk to Pact-Hunter Skirmisher');
    const stitch = assemblePacketStitch(spoke);
    expect(stitch).not.toMatch(/You spoke Pact-Hunter/i);
    expect(stitch).not.toMatch(/Skirmisher answered/i);
  });
});
