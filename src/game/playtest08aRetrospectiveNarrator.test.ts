/**
 * Batch 08a — Architecture 1 Retrospective Narrator prototype.
 * Packet after mechanics, past-tense writer leaf, packet stitch, no live GM / T50.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { runArcDirectorBeforeGm } from './arcDirector';
import { classifyBeatCommit, repairRejectedBeat, codedSceneMove } from './beatCommitGate';
import { formatWriterFacingPacket } from './beatContract';
import { formatFullMemoryBlock } from './situationPacket';
import { buildContextPrompt } from './systemPrompt';
import { enumerateLegalEdges } from './graphChoices';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  formatWriterFacingEvent,
  prepareRetrospectiveWriterInput,
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

describe('08a stamps + Free writer + Mid OFF', () => {
  it('HUD/BUILD are 2026-09-08a or later, Mid writer OFF, Free is DeepSeek', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-08a').toBe(true);
    expect(BUILD_STAMP >= '2026-09-08a').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe(
      'accounts/fireworks/models/deepseek-v4-flash-0731'
    );
  });
});

describe('08a — packet includes kill + lastKill when HP hits 0', () => {
  it('attack that zeros HP attaches lastKill before the writer packet', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    expect(after.state.activeEncounter).toBeNull();
    expect(after.state.sceneFacts?.lastKill?.name).toMatch(/Skirmisher/i);
    expect(after.state.sceneFacts?.lastKill?.remains).toBe(true);
    expect(after.state.sceneFacts?.lastKill?.outcome).toBe('victory');
    expect(after.state.sceneFacts?.lastKill?.turn).toBe(12);

    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    expect(packet.justKilled).toBe(true);
    expect(packet.outcome).toBe('killed');
    expect(packet.lastKill?.name).toMatch(/Skirmisher/i);
    expect(packet.allowlist.some((n) => /skirmisher/i.test(n))).toBe(true);
    expect(packet.combatLive).toBe(false);
  });

  it('pads after lastKill are corpse/leave/loot, never Talk lastKill', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const edges = enumerateLegalEdges(after.state);
    expect(edges.some((e) => /Talk to .*Skirmisher/i.test(e.label))).toBe(false);
    expect(edges.some((e) => /Loot the body/i.test(e.label))).toBe(true);
    expect(edges.some((e) => /Leave the scene/i.test(e.label))).toBe(true);
  });
});

describe('08a — writer format is past-tense / allowlist', () => {
  it('format has past tense + allowlist, no SNAPSHOT/CRAFT/instruction lecture', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    const facing = formatWriterFacingEvent(packet);
    const memory = formatFullMemoryBlock(after.state);
    const context = buildContextPrompt(after.state, 'Attack the Pact-Hunter Skirmisher');
    const live = formatWriterFacingPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    for (const text of [facing, memory, context, live]) {
      expect(text).toMatch(/past tense/i);
      expect(text).toMatch(/YOU MAY ONLY MENTION/);
      expect(text).toMatch(/COMPLETED EVENT:/);
      expect(text).not.toMatch(/### SNAPSHOT/);
      expect(text).not.toMatch(/SNAPSHOT Location/);
      expect(text).not.toMatch(/^CRAFT:/m);
      expect(text).not.toMatch(/do not resurrect/i);
      expect(text).not.toMatch(/Honor the committed ledger beat/);
    }
  });
});

describe('08a — proseViolatesEventPacket', () => {
  it('flags living lastKill and My instruction says', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    expect(
      proseViolatesEventPacket(
        'The Pact-Hunter Skirmisher looks up and nods in greeting.',
        packet
      )
    ).toBe(true);
    expect(proseViolatesEventPacket('My instruction says narrate the kill.', packet)).toBe(true);
    expect(
      classifyBeatCommit(
        { ...after.state, completedEvent: packet },
        'Brother Tam waited by the grain sacks.',
        'Attack the Pact-Hunter Skirmisher'
      ).accept
    ).toBe(false);
  });

  it('allows legal allowlisted nouns', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    const ok = 'The skirmisher staggered. Your strike landed.';
    expect(proseViolatesEventPacket(ok, packet)).toBe(false);
    const richer =
      'The skirmisher staggered at West Wall. Your strike landed. The body stayed on the stones.';
    expect(proseViolatesEventPacket(richer, packet)).toBe(false);
    expect(
      classifyBeatCommit(
        { ...after.state, completedEvent: packet },
        richer,
        'Attack the Pact-Hunter Skirmisher'
      ).accept
    ).toBe(true);
  });
});

describe('08a — packet stitch vs vendor bank', () => {
  it('packet stitch contains location + outcome, not copper/wet-stone vendor bank', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const packet = buildCompletedEventPacket(after.state, 'Attack the Pact-Hunter Skirmisher');
    const stitch = assemblePacketStitch(packet);
    expect(stitch).toMatch(/West Wall/i);
    expect(stitch).toMatch(/kill|down|body|stones/i);
    expect(stitch).not.toMatch(/copper and wet stone/i);
    expect(stitch).not.toMatch(/vendor under a patched tarp/i);
    expect(stitch).not.toMatch(/shifts, expecting you to act/i);
    const vendor = codedSceneMove(after.state);
    expect(vendor).not.toBe(stitch);
    const repaired = repairRejectedBeat(
      { ...after.state, completedEvent: packet },
      'Brother Tam waited by the grain sacks.',
      ['event-packet']
    );
    expect(repaired.prose).toMatch(/West Wall/i);
    expect(repaired.prose).not.toMatch(/copper and wet stone/i);
  });
});

describe('08a — Fate/useGame: GM is called after packet exists', () => {
  it('prepareRetrospectiveWriterInput builds the packet before any GM payload', () => {
    const after = runArcDirectorBeforeGm(liveSkirmish(3), 'Attack the Pact-Hunter Skirmisher');
    const prepared = prepareRetrospectiveWriterInput(after.state, 'Attack the Pact-Hunter Skirmisher', {
      xp: after.xpAwards.reduce((n, a) => n + a.amount, 0),
    });
    expect(prepared.packet).toBeTruthy();
    expect(prepared.state.completedEvent).toBe(prepared.packet);
    expect(prepared.writerFacing).toMatch(/COMPLETED EVENT:/);
    expect(prepared.packet.outcome).toBe('killed');
    expect(prepared.writerFacing).toBe(formatWriterFacingEvent(prepared.packet));
  });
});
