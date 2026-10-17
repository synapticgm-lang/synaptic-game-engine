/**
 * q38-OPT2 — situation/quest generator core + OPT3-2 agenda affordance.
 * OPT2-5 (LitRPG/RPG adapters) → q42-OPT2m.
 */
import { describe, expect, it } from 'vitest';
import { CREDIT_SECTIONS } from '../legal/credits';
import { createInitialState } from './defaults';
import { agendaFromRole } from './npcMemory';
import {
  applyQuestAddProposals,
  ensureQuestFloor,
  lazyGmHookRows,
  LAZY_GM_LICENSE,
  QUEST_FLOOR,
  QUEST_SPACING_TURNS,
} from './questGenerator';
import { validateQuestStepRoutes } from './questRoutes';
import { collectSceneAffordances } from './sceneAffordances';
import { DC_LADDER } from './rules/exploration';
import { DND_XP_BY_CR } from './xpRules';
import { SRD_MONSTERS } from './rules/srdMonsters';
import type { GameState, NpcMemory } from './types';
import type { GameEvent } from './parser';

function patronState(turn = 4): GameState {
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
    lastSeenTurn: turn,
    roleHint: 'quest-patron',
    location: 'Keep Gate',
    goal: agenda.goal,
    need: agenda.need,
    offer: agenda.offer,
    attitude: agenda.attitude,
    traits: agenda.traits,
    speechRegister: agenda.speechRegister,
  };
  return {
    ...createInitialState(undefined, 'dnd'),
    turn,
    engineMode: 'dnd',
    currentLocation: 'Keep Gate',
    quests: [],
    npcMemories: [npc],
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

describe('OPT-2 quest generator (q38-OPT2)', () => {
  it('OPT2-1: 0 open quests + patron with goal → quest with 2–4 steps, 3 routes each, G1 pass', () => {
    const base = patronState(4);
    expect((base.quests ?? []).length).toBe(0);
    const { state, quest } = ensureQuestFloor(base);
    expect(quest).toBeTruthy();
    expect(quest!.id.startsWith('gen-')).toBe(true);
    const steps = quest!.objectives ?? [];
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.length).toBeLessThanOrEqual(4);
    for (let i = 0; i < steps.length; i++) {
      expect((steps[i]!.routes ?? []).length).toBe(3);
    }
    expect(validateQuestStepRoutes(quest!, 'dnd')).toEqual([]);
    const open = (state.quests ?? []).filter((q) => q.status === 'active' && q.revealed !== false);
    expect(open.length).toBeGreaterThanOrEqual(QUEST_FLOOR);
  });

  it('OPT2-2: tabletop seeds use SRD blocks/DCs/rewards; each row has source + license (Lazy GM CC BY 4.0)', () => {
    const rows = lazyGmHookRows;
    expect(rows.length).toBeGreaterThan(0);
    const srdIds = new Set<string>();
    for (let i = 0; i < SRD_MONSTERS.length; i++) srdIds.add(SRD_MONSTERS[i]!.id);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      expect(row.source.license).toBe(LAZY_GM_LICENSE);
      expect(row.source.author).toMatch(/Shea/);
      expect(row.source.work).toMatch(/Lazy GM/i);
      expect(srdIds.has(row.srdFoeId)).toBe(true);
      expect(DC_LADDER[row.dcRung]).toBeGreaterThan(0);
      expect(DND_XP_BY_CR[row.rewardCr]).toBeGreaterThan(0);
    }
    const { quest } = ensureQuestFloor(patronState(5));
    expect(quest!.provenance ?? '').toMatch(/Lazy GM/);
    expect(quest!.provenance ?? '').toMatch(/CC BY 4\.0/);
    expect(quest!.provenance ?? '').toMatch(/SRD/);
    expect((quest!.rewards?.xp ?? 0)).toBeGreaterThan(0);

    const rules = CREDIT_SECTIONS.find((s) => s.id === 'rules');
    const credit = rules?.rows.find((r) => /Lazy GM/i.test(r.work));
    expect(credit, 'credits page Lazy GM line').toBeTruthy();
    expect(credit!.license).toMatch(/CC BY 4\.0/);
    expect(credit!.source).toMatch(/Shea/);
  });

  it('OPT2-3: writer quest-add binds to generated quest or is dropped as unbound quest', () => {
    const filled = ensureQuestFloor(patronState(6)).state;
    const gen = (filled.quests ?? []).find((q) => q.id.startsWith('gen-'))!;
    expect(gen).toBeTruthy();

    const boundEv: GameEvent[] = [
      {
        type: 'quest-add',
        id: 'writer-q1',
        name: `${gen.giver} needs help`,
        questType: 'side',
        description: `Help ${gen.giver} with ${gen.leadsTo}`,
      },
    ];
    const bound = applyQuestAddProposals(boundEv, filled);
    expect(bound.events.length).toBe(1);
    expect(bound.events[0]!.id).toBe(gen.id);
    expect(bound.notes.some((n) => n.startsWith('quest-add bound'))).toBe(true);

    const unboundEv: GameEvent[] = [
      {
        type: 'quest-add',
        id: 'stray',
        name: 'Invented Side Job',
        questType: 'side',
        description: 'A quest nobody asked for',
      },
    ];
    const unbound = applyQuestAddProposals(unboundEv, filled);
    expect(unbound.events.length).toBe(0);
    expect(unbound.notes).toContain('unbound quest');
    expect((unbound.state.questGen?.unboundLog ?? []).length).toBeGreaterThan(0);
  });

  it('OPT2-4: spacing window ≤1 new quest; open quests ≥1 on ≥90% of turns', () => {
    let state = patronState(0);
    let generated = 0;
    let openOk = 0;
    for (let t = 0; t < 100; t++) {
      state = { ...state, turn: t };
      const before = (state.quests ?? []).filter((q) => q.id.startsWith('gen-')).length;
      const out = ensureQuestFloor(state);
      state = out.state;
      const after = (state.quests ?? []).filter((q) => q.id.startsWith('gen-')).length;
      if (after > before) generated++;
      let open = 0;
      const quests = state.quests ?? [];
      for (let i = 0; i < quests.length; i++) {
        if (quests[i]!.status === 'active' && quests[i]!.revealed !== false) open++;
      }
      if (open >= 1) openOk++;
    }
    // At most one new quest per spacing window over 100 turns.
    expect(generated).toBeLessThanOrEqual(Math.ceil(100 / QUEST_SPACING_TURNS) + 1);
    expect(openOk / 100).toBeGreaterThanOrEqual(0.9);
  });

  it('OPT3-2: present NPC goal yields at least one OPT-1 affordance', () => {
    const state = patronState(3);
    const rows = collectSceneAffordances(state);
    const agenda = rows.filter((r) => r.actionId.endsWith(':agenda'));
    expect(agenda.length).toBeGreaterThanOrEqual(1);
    expect(agenda[0]!.label).toMatch(/Ask Maud Pike about/i);
    expect(agenda[0]!.slotKind).toBe('person');
    expect(agenda[0]!.required).toBe(true);
  });
});
