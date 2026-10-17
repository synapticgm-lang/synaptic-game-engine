/**
 * q37-OPT3 — Datasworn CC BY seed tables + agenda advance on pressure clock.
 * OPT3-1 → ttOpt3f; OPT3-2 → q38-OPT2; OPT3-3 → ttC2a.
 * OPT3-4 / OPT3-5 here.
 */
import { describe, expect, it } from 'vitest';
import { CREDIT_SECTIONS } from '../legal/credits';
import {
  DATASWORN_CC_BY_40,
  DATASWORN_CREDIT,
  dataswornCharacterOracleRows,
  pickDataswornCharacterSeed,
} from './dataswornCharacterSeeds';
import { formatWriterInfoLayer } from './writerInfoLayer';
import {
  applyPressureAgendaAdvance,
  tickPressureClock,
  type PressureClockState,
} from './pressureClock';
import { agendaFromRole } from './npcMemory';
import type { GameState, NpcMemory } from './types';
import { createInitialState } from './defaults';

describe('OPT-3 Datasworn seeds + agenda advance (q37-OPT3)', () => {
  it('OPT3-5: every imported row is CC BY 4.0; no NC; credits name Tomkin, rsek, XenotropicDev', () => {
    const rows = dataswornCharacterOracleRows();
    expect(rows.length).toBeGreaterThan(50);
    for (const row of rows) {
      expect(row.source.license).toBe(DATASWORN_CC_BY_40);
      expect(/nc|non-?commercial/i.test(row.source.license)).toBe(false);
      expect(row.table === 'role' || row.table === 'goal' || row.table === 'descriptor').toBe(true);
      expect(row.text.trim().length).toBeGreaterThan(0);
    }

    expect(DATASWORN_CREDIT).toMatch(/Shawn Tomkin/);
    expect(DATASWORN_CREDIT).toMatch(/rsek/);
    expect(DATASWORN_CREDIT).toMatch(/XenotropicDev/);
    expect(DATASWORN_CREDIT).toMatch(/CC BY 4\.0/);
    expect(DATASWORN_CREDIT).toMatch(/MIT/);

    const rules = CREDIT_SECTIONS.find((s) => s.id === 'rules');
    const row = rules?.rows.find((r) => /Datasworn/i.test(r.work));
    expect(row, 'credits page Datasworn line').toBeTruthy();
    expect(row!.source).toMatch(/Shawn Tomkin/);
    expect(row!.source).toMatch(/rsek/);
    expect(row!.source).toMatch(/XenotropicDev/);
    expect(row!.license).toMatch(/MIT/);
    expect(row!.license).toMatch(/CC BY 4\.0/);
    expect(row!.notice ?? '').toMatch(/Shawn Tomkin/);
    expect(row!.notice ?? '').toMatch(/rsek/);
    expect(row!.notice ?? '').toMatch(/XenotropicDev/);

    // Tabletop flavour pick (descriptor only path in seed wiring); LitRPG/RPG also use role/goal tables.
    expect(pickDataswornCharacterSeed('descriptor', 42).length).toBeGreaterThan(0);
    expect(pickDataswornCharacterSeed('role', 42).length).toBeGreaterThan(0);
    expect(pickDataswornCharacterSeed('goal', 42).length).toBeGreaterThan(0);
  });

  it('OPT3-4: after the pressure clock fires, one agenda advances one step as a world fact', () => {
    const agenda = agendaFromRole({
      role: 'quest-patron',
      disposition: 'friendly',
      bindTarget: 'the keep gate',
    });
    const npc: NpcMemory = {
      npcId: 'maud',
      npcName: 'Maud Pike',
      disposition: 'friendly',
      facts: [],
      lastSeenTurn: 0,
      roleHint: 'quest-patron',
      goal: agenda.goal,
      need: agenda.need,
      offer: agenda.offer,
      attitude: agenda.attitude,
      traits: agenda.traits,
      speechRegister: agenda.speechRegister,
      agendaStep: 0,
    };

    let state = {
      ...createInitialState(undefined, 'dnd'),
      turn: 12,
      engineMode: 'dnd' as const,
      npcMemories: [npc],
      timeline: [],
      sceneFacts: {
        crowd: 'sparse' as const,
        noise: 'quiet' as const,
        present: ['Maud Pike'],
        props: [],
        lastBeat: '',
        updatedTurn: 12,
      },
      arcDirector: {
        pressureClock: { turnsSinceBeat: 4, deadlineTurn: 20, label: 'arc deadline' } satisfies PressureClockState,
      },
    } as GameState;

    const prev = state.arcDirector!.pressureClock;
    const next = tickPressureClock(prev, false, state.turn);
    expect(next.turnsSinceBeat).toBe(5);

    state = applyPressureAgendaAdvance(state, prev, next, false);
    expect(state.npcMemories?.[0]?.agendaStep).toBe(1);
    expect(state.sceneFacts?.agendaWorldFact ?? '').toMatch(/Maud Pike's agenda advanced \(step 1\)/);
    expect(state.timeline?.some((f) => /Maud Pike's agenda advanced/.test(f.text))).toBe(true);

    const layer = formatWriterInfoLayer(state);
    expect(layer).toContain('WORLD FACTS (this turn):');
    expect(layer).toMatch(/Maud Pike's agenda advanced/);

    const prev2 = state.arcDirector!.pressureClock;
    const next2 = tickPressureClock(prev2, false, state.turn + 1);
    const state2 = applyPressureAgendaAdvance(
      { ...state, turn: state.turn + 1 },
      prev2,
      next2,
      false,
    );
    expect(state2.npcMemories?.[0]?.agendaStep).toBe(1);
  });
});
