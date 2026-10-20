/**
 * q75-ROUNDTYPED / q75r-ROUNDTYPED — typed input in round combat as SRD 5.2.1 actions.
 * SRD 5.2.1 (Wizards of the Coast, CC BY 4.0): Communicating (free speech);
 * Influence (Persuasion/Intimidation/Deception); Improvising an Action; action economy.
 * Evidence shape: mega T7 record T164–T165 (Blind Crawler typed parley / speech).
 * q75r: mid-fight travel pad (seed 20632 T9); LitRPG typed pick-up accepted (L6 T19).
 */
import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createInitialState } from './defaults';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { resolveEngineFight } from './engineFight';
import { playRound, type PcProfile } from './rules/roundCombat';
import { SRD_MONSTERS, type StatBlock } from './rules/srdMonsters';
import { applyTabletopSheet, resolveSheet } from './tabletop/characterBuild';
import { interpretRoundTyped } from './tabletop/roundTyped';
import type { GameState, RoundCombatState } from './types';
import { applyOptionCooldown } from './sceneAffordances';
import { travelPadBlocked } from './padUniverse';
import { chipProblem } from './chipLegality';
import { groundPlayerAction } from './intentParser';
import { findUnsupportedItemClaims } from './suggestionValidation';
import { validateActionHard } from './actionValidation';

const block = (id: string): StatBlock => {
  const { match: _m, ...b } = SRD_MONSTERS.find((m) => m.id === id)!;
  return b;
};
const d20 = (n: number) => () => (n - 0.5) / 20;

const pc = (over: Partial<PcProfile> = {}): PcProfile => ({
  name: 'Jax',
  ac: 16,
  hp: 20,
  maxHp: 20,
  speed: 30,
  initiativeMod: 1,
  saves: { STR: 5, DEX: 1, CON: 4, INT: -1, WIS: 1, CHA: 2 },
  stealth: 1,
  species: 'human',
  weapon: { name: 'Dagger', toHit: 5, dice: '1d4', mod: 3, type: 'piercing', ranged: false },
  conditions: [],
  ally: { name: 'Rook', toHit: 4, dice: '1d6', type: 'slashing' },
  ...over,
});

function fightState(over: Partial<GameState> = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  const sheet = resolveSheet({
    classId: 'fighter',
    speciesId: 'human',
    backgroundId: 'soldier',
    method: 'point-buy',
    baseScores: { STR: 15, DEX: 13, CON: 14, INT: 8, WIS: 12, CHA: 14 },
    kitId: 'A',
    source: 'build',
  });
  const base = applyTabletopSheet({ ...s0, engineMode: 'dnd' }, sheet);
  const enc = initEncounterTerminal(
    {
      name: 'Blind Crawler',
      level: 2,
      hp: 30,
      maxHp: 30,
      armorClass: 13,
      strength: 12,
      dexterity: 10,
      constitution: 14,
      xpReward: 50,
      goldReward: 0,
    },
    { ...base, engineMode: 'dnd' },
  );
  const b = block('zombie');
  const roundCombat: RoundCombatState = {
    encounterName: 'Blind Crawler',
    round: 2,
    pcInitiative: 18,
    foes: [{ id: 'f1', name: 'Blind Crawler', blockId: b.id, hp: 30, maxHp: 30, initiative: 8, conditions: [] }],
    pcConditions: [],
  };
  return {
    ...base,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 164,
    seed: 'q75-roundtyped',
    character: { ...base.character, name: 'Jax', hp: 20, maxHp: 20, level: 1 },
    companions: [{ id: 'ally-rook', name: 'Rook', hp: 12, maxHp: 12 }],
    activeEncounter: enc,
    roundCombat,
    sceneFacts: {
      ...(base.sceneFacts ?? {}),
      present: ['Rook'],
      props: ['cart'],
      crowd: 'none',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 164,
    },
    openingEstablishment: {
      ...(base.openingEstablishment ?? {}),
      complete: true,
      pending: [],
      answers: {},
    },
    ...over,
  } as GameState;
}

describe('q75-ROUNDTYPED', () => {
  it('T164-shape: plain speech to the foe is free (no Action) and never rejected', () => {
    const s = fightState();
    const line = 'Blind Crawler, what happens if I try to open the Broken Gate?';
    const plan = interpretRoundTyped(s, line);
    expect(plan.accepted).toBe(true);
    expect(plan.freeSpeechOnly).toBe(true);
    expect(plan.clauses[0]).toMatchObject({ kind: 'speech', role: 'foe', reaction: 'foe-may-react' });
    expect(plan.facts.join(' ')).toMatch(/no Action/i);
    expect(plan.receipts.some((r) => /Speech: free/i.test(r))).toBe(true);

    const res = playRound({
      pc: pc(),
      combat: s.roundCombat!,
      blocks: { f1: block('zombie') },
      action: 'speech',
      rng: d20(10),
    });
    const spoke = res.events.find((e) => e.k === 'act' && e.pc && /speaks freely/i.test(e.detail));
    expect(spoke).toBeTruthy();
    expect(res.combat.pcEconomy?.actionAvailable).toBe(true);
  });

  it('trash-talk to a foe is free; foe may react; not rejected', () => {
    const s = fightState();
    const plan = interpretRoundTyped(s, 'Blind Crawler, you are a joke — stand aside.');
    expect(plan.accepted).toBe(true);
    expect(plan.clauses.every((c) => c.kind === 'speech')).toBe(true);
    expect(plan.facts.join(' ')).toMatch(/react in character|freely/i);
  });

  it('instruction shouted to an ally costs no Action; ally may act on its turn', () => {
    const s = fightState();
    const plan = interpretRoundTyped(s, 'Rook, flank left and hold the cart!');
    expect(plan.accepted).toBe(true);
    expect(plan.freeSpeechOnly).toBe(true);
    expect(plan.clauses[0]).toMatchObject({ kind: 'speech', role: 'ally', reaction: 'ally-may-act' });
    expect(plan.facts.join(' ')).toMatch(/may act on that instruction/i);
  });

  it('typed parley resolves as an Influence check (Persuasion)', () => {
    const s = fightState();
    // Contested social via existing isContestedSocialAction (persuade/negotiate) — no new word list.
    const line = 'Negotiate with the Blind Crawler: stand down and let me pass to the Lord\'s Chamber.';
    const plan = interpretRoundTyped(s, line);
    expect(plan.accepted).toBe(true);
    expect(plan.clauses.some((c) => c.kind === 'influence')).toBe(true);
    const inf = plan.clauses.find((c) => c.kind === 'influence')!;
    if (inf.kind !== 'influence') throw new Error('expected influence');
    expect(inf.check.skill).toBe('persuasion');
    expect(inf.check.label).toMatch(/Influence|Social|Persuasion/i);
    expect(plan.receipts.length).toBeGreaterThan(0);

    const fight = resolveEngineFight(s, line);
    expect(fight).toBeTruthy();
    expect(fight!.receipts.join('\n') + fight!.facts).toMatch(/Influence|Social|Persuasion|SUCCESS|FAILURE|check/i);
  });

  it('T165-shape: "reason with the Blind Crawler" is still accepted (free speech, never dropped)', () => {
    const s = fightState();
    const line = 'Try to reason with the Blind Crawler one more time, asking about the Lord\'s Chamber instead.';
    const plan = interpretRoundTyped(s, line);
    expect(plan.accepted).toBe(true);
    expect(plan.clauses.length).toBeGreaterThan(0);
    expect(plan.clauses.every((c) => c.kind !== 'illegal')).toBe(true);
    const fight = resolveEngineFight(s, line);
    expect(fight).toBeTruthy();
    expect(fight!.facts.length).toBeGreaterThan(5);
  });

  it('typed Attack maps to the SRD Attack action', () => {
    const s = fightState();
    const plan = interpretRoundTyped(s, 'Attack with the Dagger');
    expect(plan.clauses[0]).toMatchObject({ kind: 'srd', action: 'attack' });
    const fight = resolveEngineFight(s, 'Attack with the Dagger');
    expect(fight).toBeTruthy();
    expect(fight!.facts.length).toBeGreaterThan(10);
  });

  it("'kick sand in his eyes then dive behind the cart' → improvised check + movement; foe responds", () => {
    const s = fightState();
    const line = 'kick sand in his eyes then dive behind the cart';
    const plan = interpretRoundTyped(s, line);
    expect(plan.accepted).toBe(true);
    expect(plan.clauses.length).toBeGreaterThanOrEqual(2);
    expect(plan.clauses.some((c) => c.kind === 'improvise')).toBe(true);
    expect(plan.facts.join(' ')).toMatch(/Improvised|sand|cover|movement/i);
    const fight = resolveEngineFight(s, line);
    expect(fight).toBeTruthy();
    expect(fight!.facts + fight!.receipts.join('\n')).toMatch(/Improvised|sand|cover|Movement|check|SUCCESS|FAILURE/i);
  });

  it('an illegal typed line gets an engine reason instead of being dropped', () => {
    const s = fightState();
    const plan = interpretRoundTyped(s, 'xyzzy');
    expect(plan.accepted).toBe(true);
    expect(plan.clauses.some((c) => c.kind === 'illegal')).toBe(true);
    expect(plan.facts.join(' ')).toMatch(/not a legal combat action/i);
    const fight = resolveEngineFight(s, 'xyzzy');
    expect(fight).toBeTruthy();
    expect(fight!.facts).toMatch(/not a legal combat action/i);
  });
});

describe('q75 harness consecutive typed_action_not_sent', () => {
  it('counts consecutive fails, forces chip after 3, and stops with a clear verdict', async () => {
    const mod = await import(
      /* @vite-ignore */ pathToFileURL(resolve('scripts/ai-player-browser/typedSend.mjs')).href
    );
    let n = 0;
    n = mod.noteTypedNotSent(n, { failed: true });
    expect(n).toBe(1);
    // Brain success must not reset this counter (that was the mega T7 hang).
    n = mod.noteTypedNotSent(n, { failed: true });
    n = mod.noteTypedNotSent(n, { failed: true });
    expect(n).toBe(3);
    expect(mod.shouldForceChipAfterTypedFail(n)).toBe(true);
    expect(mod.shouldForceChipAfterTypedFail(2)).toBe(false);
    expect(mod.typedStuckVerdict(165)).toBe('stuck: input not accepted at T165');
    n = mod.noteTypedNotSent(n, { failed: false });
    expect(n).toBe(0);
  });
});

describe('q75r-ROUNDTYPED replay + availability', () => {
  /** Seed 20632 T9: Travel toward … must not be offered or legal while the fight blocks travel. */
  it('20632-T9: applyOptionCooldown does not refill Travel toward while travelPadBlocked', () => {
    const s0 = createInitialState(undefined, 'dnd') as GameState;
    const enc = initEncounterTerminal(
      {
        name: 'the thugs',
        level: 1,
        hp: 20,
        maxHp: 20,
        armorClass: 12,
        strength: 12,
        dexterity: 10,
        constitution: 12,
        xpReward: 10,
        goldReward: 0,
      },
      { ...s0, engineMode: 'dnd' },
    );
    const s = {
      ...s0,
      engineMode: 'dnd' as const,
      turn: 9,
      currentLocation: 'On the road between places',
      activeEncounter: enc,
      openingEstablishment: {
        ...(s0.openingEstablishment ?? {}),
        complete: true,
        pending: [],
        answers: {},
      },
    } as GameState;
    expect(travelPadBlocked(s)).toBe(true);
    expect(chipProblem(s, 'Travel toward Greyhollow Inn')?.kind).toBe('impossible-chip');
    const cooled = applyOptionCooldown(s, [
      {
        label: 'Attack the thugs',
        actionId: 'fight:foe:the thugs:attack',
        kind: 'affordance',
        slotKind: 'fight',
        slotCategory: 'scene',
        required: true,
        rank: 100,
      },
      {
        label: 'Travel toward Greyhollow Inn',
        actionId: 'exit:Greyhollow Inn:travel',
        kind: 'exit',
        slotKind: 'exit',
        slotCategory: 'move',
        required: true,
        rank: 70,
      },
    ]);
    expect(cooled.every((c) => !/travel toward/i.test(c.label))).toBe(true);
  });

  /** LitRPG mega L6 seed 19061 T19: pick up scene book — accepted, not rewritten to missing-item. */
  it('L6-T19: typed pick-up of a scene book is grounded and hard-gate valid', () => {
    const s0 = createInitialState(undefined, 'litrpg') as GameState;
    const s = {
      ...s0,
      engineMode: 'litrpg' as const,
      turn: 19,
      openingEstablishment: {
        ...(s0.openingEstablishment ?? {}),
        complete: true,
        pending: [],
        answers: {},
      },
      sceneFacts: {
        ...(s0.sceneFacts ?? {}),
        props: ['a book with the palace seal'],
        present: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 19,
      },
    } as GameState;
    const line = 'I pick up the book with the palace seal and open it to see what\'s inside.';
    const story = 'A lone book with the palace seal rests on the crate.';
    expect(findUnsupportedItemClaims(line, s)).toEqual([]);
    const grounded = groundPlayerAction(line, s, story);
    expect(grounded.rewritten).toBe(false);
    expect(grounded.text).toBe(line);
    expect(validateActionHard(line, s, story).valid).toBe(true);
  });
});
