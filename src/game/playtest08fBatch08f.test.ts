/**
 * Batch 08f — exhaustion pads, encounter 3-slot economy, fail-closed flavor,
 * hub stall escalation, PYOA single-use ambient. Keeps 08d/08e Silent + sparse.
 */
import { describe, expect, it } from 'vitest';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  SPARSE_FLAVOR,
  SILENT_ENGINE,
  composeFreeMudTurn,
  flavorRejectRate,
  gateMicroFlavorQuote,
  jaccardSimilarity,
  planMicroFlavor,
  FREE_MUD_PRESENTATION_ENABLED,
} from './freeMudPresentation';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './graphChoices';
import { tickEncounterTerminal } from './encounterTerminalFsm';
import {
  isAmbientPadExhausted,
  recordAmbientPadUse,
  isAmbientStylePad,
} from './padExhaustion';
import {
  hubStallHash,
  readHubStall,
  tickHubStall,
  shouldForceHubAmbush,
} from './hubStallEscalation';
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
    character: { ...s.character, name: 'Jax', level: 1, xp: 0 },
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

describe('08f — flags + stamp', () => {
  it('keeps sparse ON, Silent OFF, Mid OFF, stamp 08f', () => {
    expect(FREE_MUD_PRESENTATION_ENABLED).toBe(true);
    expect(SPARSE_FLAVOR).toBe(true);
    expect(SILENT_ENGINE).toBe(false);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-09-08f');
    expect(BUILD_STAMP).toBe('2026-09-08f');
  });
});

describe('08f — ambient pad single-use', () => {
  it('drops ambient pad after one use at node', () => {
    let state = baseState();
    const pad = 'Inspect the stall';
    expect(isAmbientStylePad(pad)).toBe(true);
    expect(isAmbientPadExhausted(state, pad)).toBe(false);
    state = recordAmbientPadUse(state, pad);
    expect(isAmbientPadExhausted(state, pad)).toBe(true);
    const compiled = compileChoices(state, [
      'Inspect the stall',
      'Travel toward West Wall',
      'Talk to Wren Holt',
    ]);
    expect(compiled.choices.every((c) => c.toLowerCase() !== pad.toLowerCase())).toBe(true);
    expect(compiled.choices.some((c) => /travel|talk/i.test(c))).toBe(true);
  });
});

describe('08f — live encounter 3-slot', () => {
  it('offers only offense / mitigation / tactical — no ambient hub pads', () => {
    const state = baseState({
      activeEncounter: {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 12,
        maxHp: 16,
        armorClass: 12,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        xpReward: 25,
        goldReward: 0,
        phase: 'engaged',
        failedFleeCount: 0,
        maxFailedFlee: 2,
        failedParleyCount: 0,
        maxFailedParley: 1,
      },
    });
    const edges = enumerateLegalEdges(state);
    expect(edges.length).toBeLessThanOrEqual(3);
    expect(edges.some((e) => /attack/i.test(e.label))).toBe(true);
    expect(edges.every((e) => !/stake|inspect fence|browse/i.test(e.label))).toBe(true);
    const compiled = compileChoices(state, [
      'Take a stake in what is unfolding',
      'Inspect the Fence',
      'Press for leverage',
      'Press the attack',
    ]);
    expect(compiled.choices.length).toBeLessThanOrEqual(3);
    expect(compiled.choices.every((c) => !/stake|fence|leverage/i.test(c))).toBe(true);
  });

  it('tactical non-attack round moves FOE HP / status', () => {
    const state = baseState({
      activeEncounter: {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 16,
        maxHp: 16,
        armorClass: 12,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        xpReward: 25,
        goldReward: 0,
        phase: 'engaged',
      },
    });
    const tick = tickEncounterTerminal(state, 'Change position');
    expect(tick.state.activeEncounter?.hp).toBeLessThan(16);
    expect(tick.state.activeEncounter?.combatStatus || tick.state.activeEncounter?.distanceBand).toBeTruthy();
    expect(tick.receipts.some((r) => /HP:|STATUS|distance/i.test(r))).toBe(true);
  });
});

describe('08f — fail-closed flavor gate', () => {
  it('rejects first-person, PC name, invent, length, Jaccard', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Travel to West Wall');
    expect(gateMicroFlavorQuote('I walked into the quiet lane slowly.', packet, { state }).ok).toBe(
      false
    );
    expect(gateMicroFlavorQuote('Jax felt the quiet dust settle hard.', packet, { state }).ok).toBe(
      false
    );
    expect(
      gateMicroFlavorQuote('Lord Vexarion winked from the distant throne.', packet, { state }).ok
    ).toBe(false);
    expect(gateMicroFlavorQuote('Dust.', packet, { state }).ok).toBe(false);
    const long =
      'Dust hung thick over every quiet stall board while distant bells rang across the whole market square again and again without any pause.';
    expect(gateMicroFlavorQuote(long, packet, { state }).ok).toBe(false);
    const a = 'Dust hung thick over the quiet stall boards.';
    const b = 'Dust hung thick over the quiet stall boards again.';
    expect(jaccardSimilarity(a, b)).toBeGreaterThan(0.35);
    const recycled = gateMicroFlavorQuote(a, packet, {
      state,
      recentQuotes: [b],
    });
    expect(recycled.ok).toBe(false);
    const ok = gateMicroFlavorQuote(a, packet, { state });
    expect(ok.ok).toBe(true);
  });

  it('tracks reject rate on compose', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Travel to West Wall');
    const t1 = composeFreeMudTurn(packet, {
      flavorRaw: 'I walked into the quiet lane slowly.',
      silent: false,
      state,
      trackAttempt: true,
    });
    expect(t1.flavorQuote).toBe('');
    expect(t1.state).toBeTruthy();
    expect(flavorRejectRate(t1.state!)).toBeGreaterThan(0);
  });
});

describe('08f — hub stall escalation', () => {
  it('prunes ambient at T3 and prefers progress over ambush without peril drought', () => {
    let state = baseState({ turn: 5, arcDirector: { turnsSinceCombatReceipt: 2 } });
    const h = hubStallHash(state);
    expect(h).toContain('lowmarket');
    state = tickHubStall(state, { hadDelta: false });
    state = tickHubStall(state, { hadDelta: false });
    state = tickHubStall(state, { hadDelta: false });
    const snap3 = readHubStall(state);
    expect(snap3.consecutiveNoDelta).toBeGreaterThanOrEqual(3);
    expect(snap3.phase === 'prune' || snap3.phase === 'progress' || snap3.phase === 'ambush').toBe(
      true
    );
    // Early turn with low combat drought → not ambush
    expect(shouldForceHubAmbush(state)).toBe(false);
  });
});

describe('08f — sparse thresholds still hold', () => {
  it('skips ordinary inspect flavor', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Look around');
    const plan = planMicroFlavor({ state, packet });
    expect(plan.skip).toBe(true);
  });
});
