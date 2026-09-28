/**
 * 28r — fight approaches from gear/skills (auto + manual) and social leverage modifiers.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { simulateCombat, type EnemyStats } from './combat';
import { resolveEngineFight } from './engineFight';
import { runPlayerCheck } from './checkMath';
import { compileGraphChoiceLabels } from './graphChoices';
import {
  approachFromInput,
  availableFightApproaches,
  bestFightApproach,
  fightApproachChips,
} from './fightApproach';
import { socialLeverageMods, targetRole } from './socialLeverage';
import type { PlayerIntent } from './intentParser';
import type { ActiveEncounter, GameState, Item } from './types';

const talk = { kind: 'talk' } as unknown as PlayerIntent;

function item(name: string, patch: Partial<Item> = {}): Item {
  return { id: name.replace(/\W+/g, '-'), name, rarity: 'Common', quantity: 1, ...patch };
}

function base(mode: 'dnd' | 'litrpg' = 'dnd', patch: Partial<GameState> = {}): GameState {
  const s = createInitialState('Ria', mode);
  return { ...s, gmStrictness: 'standard', lootPity: { byTier: {} }, inventory: [], ...patch } as GameState;
}

function withChar(s: GameState, patch: Record<string, unknown>): GameState {
  return { ...s, character: { ...s.character, ...patch } } as GameState;
}

const foe: ActiveEncounter = {
  name: 'Ash Raider',
  level: 1,
  hp: 12,
  maxHp: 12,
  armorClass: 12,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  xpReward: 25,
  goldReward: 5,
};

const enemy: EnemyStats = {
  name: 'Ash Raider',
  level: 1,
  hp: 40,
  maxHp: 40,
  attack: 4,
  defense: 1,
  armorClass: 12,
  xpReward: 25,
  goldReward: 5,
};

/** Deterministic rng that cycles a fixed list. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('28r fight approaches — unlocks', () => {
  it('bare character has melee only', () => {
    const s = withChar(base(), { mp: 0, maxMp: 0, attributes: { STR: 12, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } });
    expect(availableFightApproaches(s).map((a) => a.id)).toEqual(['melee']);
    expect(fightApproachChips(s)).toEqual([]);
  });

  it('bow, focus, shield and stealth unlock their approaches', () => {
    let s = base('dnd', {
      inventory: [
        item('Shortbow', { itemType: 'weapon' }),
        item('Oak Staff', { itemType: 'weapon' }),
        item('Iron Shield', { equipped: true, slot: 'Off Hand', itemType: 'armor' }),
      ],
      sceneFacts: { ...base().sceneFacts!, pendingEncounter: foe } as GameState['sceneFacts'],
    });
    s = withChar(s, { mp: 10, maxMp: 10, skills: { stealth: 2 } });
    const ids = availableFightApproaches(s).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['melee', 'ranged', 'spell', 'ambush', 'guarded']));
    const shield = availableFightApproaches(s).find((a) => a.id === 'guarded')!;
    expect(shield.ac).toBe(3);
    expect(shield.label).toBe('Fight behind the Iron Shield');
  });

  it('spell needs enough MP; ambush needs an unaware foe', () => {
    const s = withChar(base('dnd', { inventory: [item('Oak Staff')], activeEncounter: { ...foe, phase: 'engaged', engagedTurnCount: 2 } }), {
      mp: 1,
      maxMp: 10,
      skills: { stealth: 3 },
    });
    const ids = availableFightApproaches(s).map((a) => a.id);
    expect(ids).not.toContain('spell');
    expect(ids).not.toContain('ambush');
  });

  it('typed lines and chips map to an unlocked approach, else melee', () => {
    const s = base('dnd', { inventory: [item('Longbow', { equipped: true, slot: 'Main Hand' })] });
    expect(approachFromInput(s, 'Attack from range with the Longbow').id).toBe('ranged');
    expect(approachFromInput(s, 'I shoot it').id).toBe('ranged');
    expect(approachFromInput(s, 'Attack with a spell').id).toBe('melee');
  });
});

describe('28r fight approaches — engine modifiers', () => {
  it('guarded adds AC: the same enemy roll that hits melee misses behind a shield', () => {
    const s = withChar(base('dnd', { inventory: [item('Tower Shield', { equipped: true })] }), { armorClass: 12, hp: 30, maxHp: 30 });
    const guarded = availableFightApproaches(s).find((a) => a.id === 'guarded')!;
    // player roll 0.0 → d20 1 (miss); enemy roll 0.3 → d20 7 (+4 attack = 11)... then 0.45 → 10 (+4 = 14)
    const rng = seq([0, 0.45, 0.5]);
    const melee = simulateCombat(s, { ...enemy, hp: 1 }, { rng });
    const shielded = simulateCombat(s, { ...enemy, hp: 1 }, { approach: guarded, rng: seq([0, 0.45, 0.5]) });
    const firstEnemy = (r: typeof melee) => r.roundsLog.find((x) => x.attacker === 'enemy')!;
    expect(firstEnemy(melee).hit).toBe(true); // 10 + 4 = 14 ≥ AC 12
    expect(firstEnemy(shielded).hit).toBe(false); // 14 < AC 15
  });

  it('ranged and ambush get free opening attacks the foe cannot answer', () => {
    const s = base('dnd', {
      inventory: [item('Shortbow', { itemType: 'weapon' })],
      sceneFacts: { ...base().sceneFacts!, pendingEncounter: foe } as GameState['sceneFacts'],
    });
    const ranged = availableFightApproaches(s).find((a) => a.id === 'ranged')!;
    const r = simulateCombat(s, enemy, { approach: ranged, rng: seq([0.99, 0.5]) });
    expect(r.roundsLog[0]).toMatchObject({ round: 0, attacker: 'player', hit: true });
    expect(r.approach?.id).toBe('ranged');
  });

  it('spell spends MP and uses INT', () => {
    const s = withChar(base('litrpg', { inventory: [item('Ember Wand')] }), {
      mp: 10,
      maxMp: 10,
      attributes: { STR: 8, DEX: 10, CON: 10, INT: 16, WIS: 10, CHA: 10 },
    });
    const spell = availableFightApproaches(s).find((a) => a.id === 'spell')!;
    expect(spell.attr).toBe('INT');
    const r = simulateCombat(s, enemy, { approach: spell, rng: seq([0.7, 0.2]) });
    expect(r.finalPlayerMp).toBe(7);
  });

  it('Auto Fight picks a better approach than melee for a weak-armed caster', () => {
    const s = withChar(base('litrpg', { inventory: [item('Ember Wand')] }), {
      mp: 10,
      maxMp: 10,
      strength: 8,
      attributes: { STR: 8, DEX: 10, CON: 10, INT: 18, WIS: 10, CHA: 10 },
    });
    expect(bestFightApproach(s, enemy).id).toBe('spell');
    const brute = withChar(base('litrpg'), { mp: 0, maxMp: 0, strength: 16 });
    expect(bestFightApproach(brute, enemy).id).toBe('melee');
  });

  it('manual fight (engineFight) uses the chosen approach and says so', () => {
    const s = base('dnd', {
      inventory: [item('Shortbow', { itemType: 'weapon' })],
      activeEncounter: { ...foe },
    });
    const r = resolveEngineFight(s, 'Attack from range with the Shortbow')!;
    expect(r).not.toBeNull();
    expect(r.receipts.some((x) => /^Approach: ranged \(Shortbow\)/.test(x))).toBe(true);
    expect(r.facts).toMatch(/from range with the Shortbow/);
  });

  it('live fight pads offer the unlocked approaches', () => {
    const s = base('dnd', {
      inventory: [item('Shortbow', { itemType: 'weapon' })],
      activeEncounter: { ...foe },
      openingEstablishment: { pending: [], complete: true } as unknown as GameState['openingEstablishment'],
    });
    const pads = compileGraphChoiceLabels(s);
    expect(pads).toContain('Press the attack');
    expect(pads).toContain('Attack from range with the Shortbow');
  });
});

describe('28r social leverage', () => {
  function priestScene(patch: Partial<GameState> = {}): GameState {
    const s = base('dnd', patch);
    return {
      ...s,
      sceneFacts: { ...s.sceneFacts!, present: ['Brother Aldo'] },
      npcMemories: [
        { npcId: 'aldo', npcName: 'Brother Aldo', disposition: 'neutral', facts: [], lastSeenTurn: 1, roleHint: 'priest' },
        { npcId: 'mara', npcName: 'Mara Quill', disposition: 'neutral', facts: [], lastSeenTurn: 1, met: true },
      ],
      ...patch,
    } as GameState;
  }

  it('reads the target role from the NPC record', () => {
    expect(targetRole(priestScene(), 'Brother Aldo')).toBe('clergy');
  });

  it('holy gear impresses a priest; unholy gear offends', () => {
    const holy = priestScene({ inventory: [item('Blessed Pendant', { equipped: true })] });
    const unholy = priestScene({ inventory: [item('Skull Mask', { equipped: true })] });
    const plus = socialLeverageMods(holy, 'Persuade Brother Aldo to open the crypt');
    const minus = socialLeverageMods(unholy, 'Persuade Brother Aldo to open the crypt');
    expect(plus).toEqual([expect.objectContaining({ kind: 'worn', value: 2 })]);
    expect(minus).toEqual([expect.objectContaining({ kind: 'worn', value: -3 })]);
  });

  it('unworn gear does not count', () => {
    const s = priestScene({ inventory: [item('Blessed Pendant')] });
    expect(socialLeverageMods(s, 'Persuade Brother Aldo to open the crypt')).toEqual([]);
  });

  it('knowledge: naming someone met in play is leverage; unknown names are not', () => {
    const s = priestScene();
    expect(socialLeverageMods(s, 'Convince Brother Aldo that Mara Quill sent me')).toEqual([
      expect.objectContaining({ kind: 'knowledge', value: 2 }),
    ]);
    expect(socialLeverageMods(s, 'Convince Brother Aldo that Zed Vorn sent me')).toEqual([]);
  });

  it('items: showing a carried item or offering coin', () => {
    const s = priestScene({ inventory: [item('Wax Seal', { itemType: 'quest' })], gold: 60 });
    const mods = socialLeverageMods(s, 'Show Brother Aldo the wax seal and offer gold');
    expect(mods).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'item', label: 'shows Wax Seal', value: 2 }),
        expect.objectContaining({ kind: 'item', label: 'coin', value: 2 }),
      ])
    );
    const broke = priestScene({ inventory: [], gold: 0 });
    expect(socialLeverageMods(broke, 'Show Brother Aldo the wax seal and offer gold')).toEqual([]);
  });

  it('stats: intimidation leans on STR and martial gear', () => {
    const s = withChar(priestScene({ inventory: [item('Chain Mail', { equipped: true })] }), {
      strength: 18,
      attributes: { STR: 18, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    });
    const mods = socialLeverageMods(s, 'Intimidate Brother Aldo into talking');
    expect(mods).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'stat', label: 'STR (intimidate)', value: 4 }),
        expect.objectContaining({ kind: 'worn', value: 2 }),
      ])
    );
  });

  it('leverage lands on the engine check and changes the outcome', () => {
    const plain = priestScene();
    const armed = priestScene({ inventory: [item('Blessed Pendant', { equipped: true }), item('Wax Seal', { itemType: 'quest' })] });
    const line = 'Persuade Brother Aldo to open the crypt, show him the wax seal';
    const a = runPlayerCheck(plain, talk, line, 8);
    const b = runPlayerCheck(armed, talk, line, 8);
    expect(a.isSuccess).toBe(false);
    expect(b.isSuccess).toBe(true);
    expect(b.record?.mods.map((m) => m.label)).toEqual(expect.arrayContaining(['Blessed Pendant (holy)', 'shows Wax Seal']));
    expect(b.codeResolutionText).toMatch(/leverage:/);
  });

  it('strong leverage reopens a hostile refusal to a roll', () => {
    const s = {
      ...priestScene({ inventory: [item('Blessed Pendant', { equipped: true }), item('Wax Seal', { itemType: 'quest' })] }),
      arcDirector: { npcRelationships: [{ npcName: 'Brother Aldo', disposition: 'hostile' }] },
    } as unknown as GameState;
    const bare = { ...s, inventory: [] } as GameState;
    expect(runPlayerCheck(bare, talk, 'Persuade Brother Aldo to lend me gold', 20).record?.auto).toBe('unwilling');
    const r = runPlayerCheck(s, talk, 'Persuade Brother Aldo to lend me gold, show him the wax seal', 20);
    expect(r.record?.auto).toBeUndefined();
  });
});
