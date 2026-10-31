/**
 * T10SOC2 — natural free-text / chip social attempts fire use-based skill rolls.
 * Entry = runArcDirectorBeforeGm (same typed path as harness / live play).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { runArcDirectorBeforeGm } from './arcDirector';
import { classifySocialSkillAttempt } from './socialSkillAttempt';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${over.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function rpgSeat(
  present: string[],
  over: Partial<GameState> = {},
): GameState {
  const memories = present.map((npcName, i) =>
    mem({
      npcName,
      npcId: `npc-${i}-${npcName.toLowerCase().replace(/\s+/g, '-')}`,
      location: 'Salt Road',
      roleHint: /guard/i.test(npcName) ? 'guard' : 'contact',
    }),
  );
  const base = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...base,
    engineMode: 'rpg',
    character: {
      ...(base.character ?? { name: 'Jax', hp: 10, maxHp: 10, level: 1, xp: 0 }),
      name: 'Jax',
      level: 1,
      xp: 40,
    },
    turn: 200,
    seed: 't10soc2-seed',
    currentLocation: 'Salt Road',
    sceneFacts: {
      crowd: present.length ? 'sparse' : 'none',
      noise: 'quiet',
      present: [...present],
      props: ['wooden post', 'fake mustache'],
      lastBeat: '',
      updatedTurn: 200,
      lastAddressee: present[0] ?? null,
    },
    npcMemories: memories,
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

const SKILL_RECEIPT = /^(Deception|Persuasion|Barter|Intimidation): rolled \d+[+-]\d+ vs DC \d+ — .+\. \1 \+\d+ XP \(level \d+\)$/;

function expectOneSkillRoll(state: GameState, line: string, skill: string, d20 = 14) {
  const attempt = classifySocialSkillAttempt(state, line);
  expect(attempt?.skill).toBe(skill);
  expect(attempt?.target).toBeTruthy();
  const arc = runArcDirectorBeforeGm(state, line, { d20 });
  const receipts = arc.systemReceipts.filter((r) =>
    /^(Deception|Persuasion|Barter|Intimidation): rolled /.test(r),
  );
  expect(receipts).toHaveLength(1);
  expect(receipts[0]).toMatch(new RegExp(`^${skill[0]!.toUpperCase()}${skill.slice(1)}: rolled`));
  expect(receipts[0]).toMatch(SKILL_RECEIPT);
  const key = skill as 'deception' | 'persuasion' | 'barter' | 'intimidation';
  const after = arc.state.arcDirector?.socialProgression?.useSkills?.[key];
  expect((after?.xp ?? 0) + (after?.level ?? 0) * 40).toBeGreaterThan(0);
  expect(arc.mandate).toMatch(/ENGINE RESULT/);
  return receipts[0]!;
}

function expectNoSkillRoll(state: GameState, line: string) {
  expect(classifySocialSkillAttempt(state, line)).toBeNull();
  const arc = runArcDirectorBeforeGm(state, line, { d20: 14 });
  expect(
    arc.systemReceipts.some((r) => /^(Deception|Persuasion|Barter|Intimidation): rolled|Social track:/.test(r)),
  ).toBe(false);
}

describe('T10SOC2 natural social attempts via typed path', () => {
  it('T202 threat at seated NPC → Intimidation roll + skill receipt', () => {
    const state = rpgSeat(['Piers Thatch']);
    const line =
      `I slam my palm against the wooden post to cut off Piers' whispering. `
      + `"Keep your voice down, Thatch, or I'll have you gagged before we even reach the camp."`;
    const receipt = expectOneSkillRoll(state, line, 'intimidation', 14);
    // Example real receipt string for the report.
    expect(receipt).toMatch(/^Intimidation: rolled 14/);
  });

  it('T177 veiled threat at seated group → Intimidation', () => {
    const state = rpgSeat(['the big guys']);
    const line =
      `I hold up a finger and shake my head at the big guys. `
      + `"Nice shirts, do they come in 'not about to die'?"`;
    expectOneSkillRoll(state, line, 'intimidation', 12);
  });

  it('T212 buy-silence with sole seated NPC → Barter', () => {
    const state = rpgSeat(['Hale']);
    const line =
      `I pull a fake mustache out of my pocket and stick it on. `
      + `"I'm here to buy some silence, or at least a really good hat."`;
    expectOneSkillRoll(state, line, 'barter', 11);
  });

  it('lie / persuade natural lines → Deception / Persuasion', () => {
    const state = rpgSeat(['guard', 'Hale']);
    expectOneSkillRoll(state, 'I tell the guard the captain sent me', 'deception', 16);
    expectOneSkillRoll(state, 'I try to convince Hale to let us through', 'persuasion', 15);
  });

  it('grip / haggle at seated NPC → Intimidation / Barter', () => {
    const state = rpgSeat(['Hale', 'Oda']);
    expectOneSkillRoll(state, `I grip Hale's shoulder, squeezing tight`, 'intimidation', 13);
    expectOneSkillRoll(state, `Hard days don't pay for passage, Oda`, 'barter', 10);
  });

  it('small talk / plain question / greeting → no roll, no receipt, 0 XP', () => {
    const state = rpgSeat(['Hale']);
    expectNoSkillRoll(state, `nice weather, isn't it`);
    expectNoSkillRoll(state, 'where is the well?');
    expectNoSkillRoll(state, 'hello there');
    expectNoSkillRoll(state, 'Talk to Hale');
    expectNoSkillRoll(state, 'Ask Hale about the road');
  });

  it('same attempt lines at absent NPC → none', () => {
    const empty = rpgSeat([]);
    expectNoSkillRoll(
      empty,
      `I slam my palm against the wooden post to cut off Piers' whispering. `
        + `"Keep your voice down, Thatch, or I'll have you gagged before we even reach the camp."`,
    );
    expectNoSkillRoll(empty, 'I tell the guard the captain sent me');
    expectNoSkillRoll(empty, 'I try to convince Hale to let us through');
    expectNoSkillRoll(empty, 'Press your standing with Hale');
  });

  it('dnd mode → none for the same lines', () => {
    const dnd = rpgSeat(['Piers Thatch', 'Hale', 'guard'], { engineMode: 'dnd' });
    expectNoSkillRoll(
      dnd,
      `I slam my palm against the wooden post to cut off Piers' whispering. `
        + `"Keep your voice down, Thatch, or I'll have you gagged before we even reach the camp."`,
    );
    expectNoSkillRoll(dnd, 'I tell the guard the captain sent me');
    expectNoSkillRoll(dnd, 'Press your standing with Hale');
  });

  it('chip Press your standing with seated NPC → Persuasion', () => {
    const state = rpgSeat(['Hale']);
    expectOneSkillRoll(state, 'Press your standing with Hale', 'persuasion', 14);
  });

  it('rpg/litrpg still mint no flat Social track: receipt', () => {
    const state = rpgSeat(['Hale']);
    const arc = runArcDirectorBeforeGm(state, 'Talk to Hale', { d20: 14 });
    expect(arc.systemReceipts.some((r) => r.startsWith('Social track:'))).toBe(false);
    const lit = rpgSeat(['Hale'], { engineMode: 'litrpg' });
    const litArc = runArcDirectorBeforeGm(lit, 'Ask Hale about the weather', { d20: 14 });
    expect(litArc.systemReceipts.some((r) => r.startsWith('Social track:'))).toBe(false);
  });
});
