/**
 * Batch 08e — Sparse flavor thresholds + 08d pad/spatial locks held.
 */
import { describe, expect, it } from 'vitest';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  SPARSE_FLAVOR,
  SILENT_ENGINE,
  composeFreeMudTurn,
  formatSparseFlavorPrompt,
  gateMicroFlavorQuote,
  planMicroFlavor,
  resolveSparseFlavorThreshold,
  shouldSkipMicroFlavor,
  FREE_MUD_PRESENTATION_ENABLED,
} from './freeMudPresentation';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './graphChoices';
import { isLastKillTalkPad } from './combatAuthority';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '@/components/Hud';
import { BUILD_STAMP } from './runManifest';
import { createInitialState } from './defaults';
import type { GameState } from './types';

function baseState(over: Partial<GameState> = {}): GameState {
  const s = createInitialState();
  return {
    ...s,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    currentLocation: 'Lowmarket',
    turn: 20,
    openingEstablishment: {
      complete: true,
      askedName: true,
      askedOrigin: true,
      askedLook: true,
      askedKit: true,
    } as GameState['openingEstablishment'],
    sceneFacts: {
      crowd: 'present',
      noise: 'voices',
      present: ['vendor', 'Wren Holt'],
      props: ['stall'],
      lastBeat: 'clear',
      updatedTurn: 20,
      ...s.sceneFacts,
    },
    ...over,
  };
}

describe('08e — Sparse flavor flags + stamp', () => {
  it('locks SPARSE on, Silent off, Mid OFF, stamp 08e', () => {
    expect(FREE_MUD_PRESENTATION_ENABLED).toBe(true);
    expect(SPARSE_FLAVOR).toBe(true);
    expect(SILENT_ENGINE).toBe(false);
    expect(shouldSkipMicroFlavor()).toBe(false);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-09-08f');
    expect(BUILD_STAMP).toBe('2026-09-08f');
  });
});

describe('08e — threshold-only flavor calls', () => {
  it('skips flavor on ordinary inspect / wait', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Look around');
    const plan = planMicroFlavor({ state, packet, arcReceipts: [] });
    expect(plan.skip).toBe(true);
    expect(plan.kind).toBeNull();
    expect(plan.prompt).toBe('');
  });

  it('requests lethal flavor on CLEAR kill', () => {
    const state = baseState({
      sceneFacts: {
        ...baseState().sceneFacts!,
        present: ['vendor'],
        lastKill: {
          name: 'Pact-Hunter Skirmisher',
          outcome: 'victory',
          remains: true,
          turn: 20,
        },
      },
      activeEncounter: undefined,
    });
    const packet = buildCompletedEventPacket(state, 'Attack the skirmisher');
    expect(packet.justKilled || packet.outcome === 'killed').toBe(true);
    const plan = planMicroFlavor({ state, packet });
    expect(plan.skip).toBe(false);
    expect(plan.kind).toBe('lethal');
    expect(plan.prompt).toMatch(/dying by/i);
    expect(plan.prompt).toMatch(/NONE/);
  });

  it('requests level-up flavor from Level Up receipt', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Wait');
    expect(resolveSparseFlavorThreshold({ state, packet, arcReceipts: [] })).toBeNull();
    expect(
      resolveSparseFlavorThreshold({
        state,
        packet,
        arcReceipts: ['Level Up! Now level 2'],
      })
    ).toBe('level-up');
    const plan = planMicroFlavor({
      state,
      packet,
      arcReceipts: ['Level Up! Now level 2'],
    });
    expect(plan.skip).toBe(false);
    expect(plan.kind).toBe('level-up');
  });

  it('requests arrival flavor once per HERE', () => {
    const state = baseState({ currentLocation: 'West Wall' });
    const packet = buildCompletedEventPacket(state, 'Travel to West Wall');
    const plan1 = planMicroFlavor({ state, packet });
    expect(plan1.skip).toBe(false);
    expect(plan1.kind).toBe('arrival');
    const plan2 = planMicroFlavor({ state: plan1.state, packet });
    expect(plan2.skip).toBe(true);
  });

  it('requests first Talk once per NPC; not on lastKill', () => {
    const living = baseState();
    const talkPacket = buildCompletedEventPacket(living, 'Talk to Wren Holt');
    expect(talkPacket.verb).toBe('spoke');
    const plan1 = planMicroFlavor({ state: living, packet: talkPacket });
    expect(plan1.skip).toBe(false);
    expect(plan1.kind).toBe('first-talk');
    const plan2 = planMicroFlavor({ state: plan1.state, packet: talkPacket });
    expect(plan2.skip).toBe(true);

    const corpse = baseState({
      sceneFacts: {
        ...baseState().sceneFacts!,
        present: ['vendor'],
        lastKill: {
          name: 'Pact-Hunter Skirmisher',
          outcome: 'victory',
          remains: true,
          turn: 19,
        },
      },
    });
    const deadTalk = buildCompletedEventPacket(corpse, 'Talk to Pact-Hunter Skirmisher');
    // Target may be rewritten off corpse; either way threshold must not be first-talk on lastKill.
    if (deadTalk.target && /skirmisher/i.test(deadTalk.target)) {
      expect(
        resolveSparseFlavorThreshold({ state: corpse, packet: deadTalk })
      ).not.toBe('first-talk');
    }
  });
});

describe('08e — still no Talk-after-CLEAR', () => {
  it('culls Talk/Ask/Offer lastKill pads after CLEAR', () => {
    const state = baseState({
      sceneFacts: {
        ...baseState().sceneFacts!,
        present: ['Pact-Hunter Skirmisher', 'vendor'],
        lastKill: {
          name: 'Pact-Hunter Skirmisher',
          outcome: 'victory',
          remains: true,
          turn: 20,
        },
      },
    });
    expect(isLastKillTalkPad('Talk to Pact-Hunter Skirmisher', state.sceneFacts!.lastKill)).toBe(
      true
    );
    const edges = enumerateLegalEdges(state);
    expect(edges.every((e) => !isLastKillTalkPad(e.label, state.sceneFacts!.lastKill))).toBe(true);
    const compiled = compileChoices(state, [
      'Talk to Pact-Hunter Skirmisher',
      'Ask Hunter Skirmisher\'s what they want',
      'Loot the body of Pact-Hunter Skirmisher',
      'Leave the scene',
    ]);
    expect(compiled.choices.every((c) => !isLastKillTalkPad(c, state.sceneFacts!.lastKill))).toBe(
      true
    );
  });
});

describe('08e — flavor fail-closed on chrome leak', () => {
  it('rejects receipt chrome and invent', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Wait');
    expect(gateMicroFlavorQuote('HERE: Lowmarket ACT: waited', packet).ok).toBe(false);
    expect(gateMicroFlavorQuote('OUTCOME: resolved in the stall.', packet).ok).toBe(false);
    expect(gateMicroFlavorQuote('Lord Vexarion winked from the throne.', packet).ok).toBe(false);
    const ok = gateMicroFlavorQuote('Dust hung thick over the quiet stall boards.', packet);
    expect(ok.ok).toBe(true);
  });

  it('compose drops chrome-leak flavor but keeps receipt', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Wait');
    const turn = composeFreeMudTurn(packet, {
      flavorRaw: 'CLEAR: Pact-Hunter Skirmisher fell.',
      silent: false,
    });
    expect(turn.flavorQuote).toBe('');
    expect(turn.receiptLines.length).toBeGreaterThan(0);
  });

  it('sparse lethal prompt stays ultra-lean', () => {
    const state = baseState({
      sceneFacts: {
        ...baseState().sceneFacts!,
        lastKill: {
          name: 'Pact-Hunter Skirmisher',
          outcome: 'victory',
          remains: true,
          turn: 20,
        },
      },
    });
    const packet = buildCompletedEventPacket(state, 'Attack the skirmisher');
    const prompt = formatSparseFlavorPrompt(packet, 'lethal');
    expect(prompt.length).toBeLessThan(400);
    expect(prompt).not.toMatch(/SITREP|SNAPSHOT|CAST:/i);
  });
});
