/**
 * q42-OPT2m — OPT-2 LitRPG / Story RPG adapters.
 * LitRPG: system quests/bounties with XP + loot.
 * RPG: personal favours with standing stakes.
 * Datasworn rows: source.license CC BY 4.0 only (Shawn Tomkin, rsek, XenotropicDev).
 */
import { describe, expect, it } from 'vitest';
import { CREDIT_SECTIONS } from '../legal/credits';
import { createInitialState } from './defaults';
import { agendaFromRole } from './npcMemory';
import {
  DATASWORN_CC_BY_40,
  DATASWORN_CREDIT,
  dataswornSituationOracleRows,
} from './dataswornCharacterSeeds';
import { ensureQuestFloor } from './questGenerator';
import { validateQuestStepRoutes } from './questRoutes';
import type { GameState, NpcMemory } from './types';

function patronState(mode: 'litrpg' | 'rpg', turn = 4): GameState {
  const agenda = agendaFromRole({
    role: 'quest-patron',
    disposition: 'friendly',
    bindTarget: mode === 'litrpg' ? 'the System board' : 'the salt road',
  });
  const npc: NpcMemory = {
    npcId: 'maud',
    npcName: 'Maud Pike',
    disposition: 'friendly',
    facts: [],
    lastSeenTurn: turn,
    roleHint: 'quest-patron',
    location: mode === 'litrpg' ? 'Lowmarket' : 'Salt Road',
    goal: agenda.goal,
    need: agenda.need,
    offer: agenda.offer,
    attitude: agenda.attitude,
    traits: agenda.traits,
    speechRegister: agenda.speechRegister,
  };
  const base = createInitialState(mode === 'litrpg' ? 'Jax' : 'Ria', mode);
  return {
    ...base,
    turn,
    engineMode: mode,
    campaignBibleId: mode === 'litrpg' ? 'summoned-pact' : 'salt-road-heist',
    currentLocation: npc.location,
    quests: [],
    npcMemories: [npc],
    worldLedger:
      mode === 'rpg'
        ? {
            ...(base.worldLedger as object),
            factionStandings: [{ id: 'salt-circle', name: 'Salt Circle', standing: 'neutral' }],
          }
        : base.worldLedger,
    sceneFacts: {
      crowd: 'sparse',
      noise: 'quiet',
      present: ['Maud Pike'],
      props: [],
      lastBeat: '',
      updatedTurn: turn,
    },
    openingEstablishment: { complete: true } as GameState['openingEstablishment'],
  } as GameState;
}

describe('q42-OPT2m LitRPG / RPG quest adapters', () => {
  it('OPT2-5 LitRPG: generated quest carries XP and loot; G1 routes pass', () => {
    const { quest } = ensureQuestFloor(patronState('litrpg', 5));
    expect(quest).toBeTruthy();
    expect(quest!.id.startsWith('gen-')).toBe(true);
    expect(quest!.name).toMatch(/System bounty/i);
    expect((quest!.rewards?.xp ?? 0)).toBeGreaterThan(0);
    expect((quest!.rewards?.items ?? []).length).toBeGreaterThan(0);
    expect(quest!.provenance ?? '').toMatch(/Datasworn/);
    expect(quest!.provenance ?? '').toMatch(/Shawn Tomkin|rsek|XenotropicDev/);
    expect(validateQuestStepRoutes(quest!, 'litrpg')).toEqual([]);
    const steps = quest!.objectives ?? [];
    expect(steps.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < steps.length; i++) {
      const kinds = (steps[i]!.routes ?? []).map((r) => r.kind);
      expect(kinds.some((k) => k === 'skill' || k === 'system')).toBe(true);
    }
  });

  it('OPT2-5 RPG: generated quest carries a standing stake; G1 routes pass', () => {
    const { quest } = ensureQuestFloor(patronState('rpg', 6));
    expect(quest).toBeTruthy();
    expect(quest!.name).toMatch(/favour/i);
    const stake = quest!.rewards?.standingStake;
    expect(stake).toBeTruthy();
    expect((stake!.faction ?? '').trim().length).toBeGreaterThan(0);
    expect(typeof stake!.delta).toBe('number');
    expect(stake!.delta).not.toBe(0);
    expect(quest!.provenance ?? '').toMatch(/standing stake/i);
    expect(quest!.provenance ?? '').toMatch(/Datasworn/);
    expect(validateQuestStepRoutes(quest!, 'rpg')).toEqual([]);
    const steps = quest!.objectives ?? [];
    for (let i = 0; i < steps.length; i++) {
      const kinds = (steps[i]!.routes ?? []).map((r) => r.kind);
      expect(kinds.some((k) => k === 'contact' || k === 'standing')).toBe(true);
    }
  });

  it('OPT2-5: Datasworn situation rows are CC BY 4.0 only; credits name Tomkin, rsek, XenotropicDev', () => {
    const rows = dataswornSituationOracleRows();
    expect(rows.length).toBeGreaterThanOrEqual(10);
    let trouble = 0;
    let turning = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      expect(row.source.license).toBe(DATASWORN_CC_BY_40);
      expect(/nc|non-?commercial/i.test(row.source.license)).toBe(false);
      expect(row.text).not.toMatch(/NC-only decoy|NC turning-point decoy/i);
      expect(row.text.trim().length).toBeGreaterThan(0);
      if (row.table === 'trouble') trouble++;
      if (row.table === 'turningPoint') turning++;
    }
    expect(trouble).toBeGreaterThan(0);
    expect(turning).toBeGreaterThan(0);

    expect(DATASWORN_CREDIT).toMatch(/Shawn Tomkin/);
    expect(DATASWORN_CREDIT).toMatch(/rsek/);
    expect(DATASWORN_CREDIT).toMatch(/XenotropicDev/);

    const rules = CREDIT_SECTIONS.find((s) => s.id === 'rules');
    const credit = rules?.rows.find((r) => /Datasworn/i.test(r.work));
    expect(credit, 'credits page Datasworn line').toBeTruthy();
    expect(credit!.source).toMatch(/Shawn Tomkin/);
    expect(credit!.source).toMatch(/rsek/);
    expect(credit!.source).toMatch(/XenotropicDev/);
    expect(credit!.usedFor ?? '').toMatch(/trouble|turning/i);
  });

  it('w4-gh2-fixgh2litrpg: LitRPG bounty leadsTo/placeId stay on established places, not goal-topic hooks', () => {
    const agenda = agendaFromRole({
      role: 'quest-patron',
      disposition: 'friendly',
      bindTarget: 'Explain the Pact',
    });
    const base = patronState('litrpg', 8);
    const { quest } = ensureQuestFloor({
      ...base,
      currentLocation: 'Cathedral Close',
      places: [{ name: 'Cathedral Close' }, { name: 'Lowmarket' }],
      npcMemories: [
        {
          ...base.npcMemories![0]!,
          npcName: 'High Chanter Orel Vane',
          location: 'Cathedral Close',
          goal: agenda.goal,
          need: agenda.need,
          offer: agenda.offer,
          attitude: agenda.attitude,
        },
      ],
    } as GameState);
    expect(quest).toBeTruthy();
    expect(quest!.leadsTo).toBe('Cathedral Close');
    expect(quest!.location).toBe('Cathedral Close');
    expect(quest!.leadsTo).not.toMatch(/Explain the Pact/i);
    const objs = quest!.objectives ?? [];
    for (let i = 0; i < objs.length; i++) {
      expect(objs[i]!.placeId).toBe('Cathedral Close');
      expect(String(objs[i]!.placeId)).not.toMatch(/Explain the Pact/i);
    }
    const blob = [quest!.name, quest!.description, quest!.leadsTo, ...(objs.map((o) => o.description))]
      .join('\n');
    // Goal topic may appear as concern text; it must never be a place field.
    expect(blob.toLowerCase()).toContain('explain the pact');
    expect(quest!.leadsTo).toBe(quest!.location);
  });
});
