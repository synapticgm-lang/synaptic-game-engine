/**
 * 28c — disposition + weapon familiarity modifiers, one engine check record (MODIFIERS-RESEARCH.md).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { runPlayerCheck } from './checkMath';
import type { PlayerIntent } from './intentParser';
import type { ActiveEncounter, GameState } from './types';
import {
  combineAdv,
  familiarityToHit,
  formatCheckRecord,
  growWeaponFamiliarity,
  proficiencyBonus,
  resolveCheckRecord,
  weaponFamiliarityScore,
} from './checkRules';
import { DIFFICULTY_TABLE, difficultyFromStrictness } from './difficultyRules';

const talk = { kind: 'talk' } as unknown as PlayerIntent;
const attack = { kind: 'attack' } as unknown as PlayerIntent;

function withNpc(mode: 'dnd' | 'litrpg', disposition: string, strict: GameState['gmStrictness'] = 'standard'): GameState {
  const s = createInitialState('Ria', mode);
  return {
    ...s,
    gmStrictness: strict,
    arcDirector: { ...(s.arcDirector ?? {}), npcRelationships: [{ npcName: 'Mara', disposition }] },
  } as unknown as GameState;
}

describe('28c checkRules', () => {
  it('SRD proficiency bonus and familiarity tiers', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(17)).toBe(6);
    expect(familiarityToHit(29, 2)).toBe(0);
    expect(familiarityToHit(30, 2)).toBe(1);
    expect(familiarityToHit(70, 2)).toBe(2);
  });

  it('class proficiency floors familiarity at 70; use grows it to 69 max', () => {
    const dnd = createInitialState('Ria', 'dnd');
    expect(weaponFamiliarityScore(dnd, 'blade')).toBeGreaterThanOrEqual(70);
    const lit = createInitialState('Jax', 'litrpg');
    expect(weaponFamiliarityScore(lit, 'blade')).toBe(0);
    const trained = { ...lit, character: { ...lit.character, weaponProficiencies: ['bow'] } } as GameState;
    expect(weaponFamiliarityScore(trained, 'bow')).toBe(70);
    let g = { ...lit, character: { ...lit.character, weaponFamiliarity: { blade: 68 } } } as GameState;
    g = growWeaponFamiliarity(growWeaponFamiliarity(g, 'blade'), 'blade');
    expect(weaponFamiliarityScore(g, 'blade')).toBe(69);
  });

  it('advantage and disadvantage cancel', () => {
    expect(combineAdv('advantage', 'disadvantage')).toBe('normal');
    expect(combineAdv('advantage', 'normal')).toBe('advantage');
  });

  it('D&D shows the maths; LitRPG shows the outcome only', () => {
    const rec = resolveCheckRecord({
      label: 'Persuasion',
      mods: [{ label: 'CHA', value: 3 }, { label: 'PB', value: 2 }],
      dc: 15,
      adv: 'advantage',
      d20s: [14, 7],
    });
    expect(formatCheckRecord(rec, 'dnd')).toBe('Persuasion d20 (adv: 14, 7) + 3 CHA + 2 PB = 19 vs DC 15 — success');
    expect(formatCheckRecord(rec, 'litrpg')).not.toMatch(/\d/);
  });
});

describe('28c runPlayerCheck — disposition', () => {
  it('friendly NPC gives advantage on a contested social check', () => {
    const r = runPlayerCheck(withNpc('dnd', 'friendly'), talk, 'Persuade Mara to share the rumour', 12);
    expect(r.record?.advState).toBe('advantage');
    expect(r.displayLine).toMatch(/adv/);
  });

  it('hostile NPC refuses a risky request with no roll', () => {
    const r = runPlayerCheck(withNpc('dnd', 'hostile'), talk, 'Persuade Mara to lend me gold', 20);
    expect(r.record?.auto).toBe('unwilling');
    expect(r.isSuccess).toBe(false);
  });

  it('loyal NPC grants a risky request with no roll', () => {
    const r = runPlayerCheck(withNpc('litrpg', 'loyal'), talk, 'Persuade Mara to lend me gold', 1);
    expect(r.record?.auto).toBe('willing');
    expect(r.isSuccess).toBe(true);
  });

  it('Easy removes the hostile −2; Standard keeps it', () => {
    const std = runPlayerCheck(withNpc('dnd', 'hostile'), talk, 'Persuade Mara to talk', 10);
    expect(std.record?.mods.some((m) => m.value === -2)).toBe(true);
    const easy = runPlayerCheck(withNpc('dnd', 'hostile', 'forgiving'), talk, 'Persuade Mara to talk', 10);
    expect(easy.record?.mods.some((m) => m.value === -2)).toBe(false);
  });
});

describe('28c runPlayerCheck — weapon familiarity', () => {
  it('D&D proficient blade adds the proficiency bonus to the strike', () => {
    const s = createInitialState('Ria', 'dnd');
    const state = {
      ...s,
      inventory: [{ id: 'w1', name: 'Short sword', equipped: true, slot: 'main hand' }],
      activeEncounter: { name: 'Goblin', hp: 7, maxHp: 7, level: 1 } as unknown as ActiveEncounter,
    } as unknown as GameState;
    const r = runPlayerCheck(state, attack, 'Attack the goblin', 10);
    expect(r.record?.mods.some((m) => /proficient blade/.test(m.label) && m.value === 2)).toBe(true);
  });
});

describe('28c difficulty table', () => {
  it('maps strictness to one shared row', () => {
    expect(difficultyFromStrictness('forgiving')).toBe('easy');
    expect(difficultyFromStrictness('hardcore')).toBe('hard');
    expect(DIFFICULTY_TABLE.hard.xpScale).toBe(1.25);
    expect(DIFFICULTY_TABLE.easy.pityThresholdScale).toBe(0.8);
  });
});
