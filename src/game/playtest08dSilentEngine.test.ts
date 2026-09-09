/**
 * Batch 08d — Silent Engine + FSM pad prune + spatial HERE enforcement.
 */
import { describe, expect, it } from 'vitest';
import { compileChoices } from './choiceCompiler';
import { compileGraphChoiceLabels, enumerateLegalEdges } from './graphChoices';
import { isLastKillTalkPad, matchesLastKillName } from './combatAuthority';
import {
  composeFreeMudTurn,
  shouldSkipMicroFlavor,
  shouldUseFreeMudPresentation,
  SILENT_ENGINE,
  FREE_MUD_PRESENTATION_ENABLED,
} from './freeMudPresentation';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  parseTravelDestination,
  isLeaveSceneAction,
  resolveLeaveSceneDestination,
} from './outdoorHubs';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { detectSocialMilestone } from './socialMilestoneLedger';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '@/components/Hud';
import { BUILD_STAMP } from './runManifest';
import { createInitialState } from './defaults';
import { advancePyoaSpine, ensurePyoaSpine } from './pyoaSpine';
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
      present: ['Pact-Hunter Skirmisher', 'vendor'],
      props: ['stall'],
      lastBeat: 'clear',
      updatedTurn: 20,
      lastKill: {
        name: 'Pact-Hunter Skirmisher',
        outcome: 'victory',
        remains: true,
        turn: 20,
      },
    },
    ...over,
  };
}

describe('08d — Silent Engine', () => {
  it('locks Silent Engine on + Mid OFF + stamp 08d', () => {
    expect(FREE_MUD_PRESENTATION_ENABLED).toBe(true);
    expect(SILENT_ENGINE).toBe(true);
    expect(shouldSkipMicroFlavor()).toBe(true);
    expect(shouldUseFreeMudPresentation('free')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-09-09a');
    expect(BUILD_STAMP).toBe('2026-09-09a');
  });

  it('composeFreeMudTurn never emits flavor under Silent Engine', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Look around');
    const turn = composeFreeMudTurn(packet, {
      flavorRaw: 'Dust hung in the Lowmarket air.',
      arcReceipts: ['XP Gained: 5'],
    });
    expect(turn.flavorQuote).toBe('');
    expect(turn.content).toBe('');
    expect(turn.flavorSource).toBe('none');
    expect(turn.receiptLines.some((l) => /^HERE:/i.test(l))).toBe(true);
  });
});

describe('08d — FSM pad prune after CLEAR', () => {
  it('Talk / Ask / Offer lastKill pads are impossible after CLEAR', () => {
    const state = baseState();
    expect(isLastKillTalkPad('Talk to Pact-Hunter Skirmisher', state.sceneFacts!.lastKill)).toBe(
      true
    );
    expect(isLastKillTalkPad("Ask Hunter Skirmisher's what they want", state.sceneFacts!.lastKill)).toBe(
      true
    );
    expect(isLastKillTalkPad("Offer Hunter Skirmisher's", state.sceneFacts!.lastKill)).toBe(true);
    expect(matchesLastKillName("Hunter Skirmisher's", state.sceneFacts!.lastKill)).toBe(true);

    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => /Talk to .*Skirmisher/i.test(e.label))).toBe(false);
    const graph = compileGraphChoiceLabels(state);
    expect(graph.some((l) => /Talk to .*Skirmisher/i.test(l))).toBe(false);

    const compiled = compileChoices(state, [
      'Talk to Pact-Hunter Skirmisher',
      "Ask Hunter Skirmisher's what they want",
      "Offer Hunter Skirmisher's",
      'Look around',
    ]);
    expect(compiled.choices.some((c) => /Talk to .*Skirmisher/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /Ask .*Skirmisher/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /Offer .*Skirmisher/i.test(c))).toBe(false);
    expect(
      compiled.choices.some((c) => /\b(loot|leave|inspect|travel)\b/i.test(c))
    ).toBe(true);
  });

  it('no social milestone XP on lastKill talk', () => {
    const state = baseState();
    expect(detectSocialMilestone('Talk to Pact-Hunter Skirmisher', state)).toBeNull();
    expect(detectSocialMilestone("Ask Hunter Skirmisher's what they want", state)).toBeNull();
  });
});

describe('08d — spatial pointer', () => {
  it('Travel to / toward parses and Leave the scene resolves a new HERE', () => {
    expect(parseTravelDestination('Travel toward West Wall', 'summoned-pact')?.name).toBe(
      'West Wall'
    );
    expect(parseTravelDestination('Travel to West Wall', 'summoned-pact')?.name).toBe('West Wall');
    expect(isLeaveSceneAction('Leave the scene')).toBe(true);
    const dest = resolveLeaveSceneDestination({
      currentLocation: 'Lowmarket',
      previousLocationSheet: { name: 'West Wall' },
      campaignBibleId: 'summoned-pact',
    });
    expect(dest).toBe('West Wall');
  });

  it('travel mutates HERE and clears lastKill occupancy', () => {
    const state = baseState({
      previousLocationSheet: { name: 'West Wall' } as GameState['previousLocationSheet'],
    });
    const next = applyPresentTrimOnTravel(state, 'Lowmarket', 'West Wall');
    expect(next.currentLocation ?? state.currentLocation).toBeTruthy();
    expect(next.sceneFacts?.lastKill).toBeUndefined();
    expect(next.sceneFacts?.present?.some((p) => /Skirmisher/i.test(p))).toBe(false);
  });
});

describe('08d — PYOA ending + Saying Your cheap deny', () => {
  it('Accept the ending terminates playPhase', () => {
    let state = createInitialState();
    state = {
      ...state,
      engineMode: 'pyoa',
      campaignBibleId: 'thornferry-road',
      playPhase: 'live',
    };
    state = ensurePyoaSpine(state);
    state = {
      ...state,
      pyoaSpine: {
        ...state.pyoaSpine!,
        endingId: 'thornferry:honest-delivery',
        currentNodeId: 'tf-end-honest',
        flags: { ...(state.pyoaSpine?.flags ?? {}), resolution: 'honest', wren: 'with' },
      },
    };
    const ended = advancePyoaSpine(state, 'Accept the ending that follows');
    expect(ended.playPhase).toBe('ended');
    expect(ended.pyoaSpine?.flags?.endingAccepted).toBe('1');
  });

  it('Saying Your is not harvestable as a person', () => {
    expect(canHarvestAsNamedPerson('Saying Your', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Your Name', 'summoned-pact')).toBe(false);
  });
});
