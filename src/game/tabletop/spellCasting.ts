/**
 * Tabletop spellcasting glue: what a built Cleric or Wizard can cast now, the cast chips, and casting outside a
 * fight (healing, Mage Armor, utility cantrips). Rules live in rules/spells (SRD 5.2.1, CC-BY-4.0); the fight
 * itself casts through rules/roundCombat. Chips and the engine read the same lists, so a chip never offers a
 * spell the engine would refuse.
 */
import type { GameState } from '../types';
import { rollDice, formatDice, type Rng } from '../rules/dice';
import { pickSlot, slotLevelInInput, spellDice, spellInInput, SPELLS, spendSlot, type SpellDef } from '../rules/spells';
import { abilityMod, ARMOR_TABLE, deriveTabletopSheet, hasClassFeature, sheetSpellcasting, tabletopArmorClass } from './characterBuild';

export interface CasterKit {
  cantrips: string[];
  prepared: string[];
  left: number[];
  mod: number;
  dc: number;
  attack: number;
}

/** The caster's spells, slots left and numbers; null for a non-caster or a sheetless character. */
export function casterKit(state: Pick<GameState, 'engineMode' | 'character'>): CasterKit | null {
  if (state.engineMode !== 'dnd') return null;
  const sc = sheetSpellcasting(state.character);
  if (!sc) return null;
  return {
    cantrips: sc.cantrips,
    prepared: sc.prepared,
    left: sc.slots.map((s) => s.left),
    mod: abilityMod(state.character.attributes[sc.ability]),
    dc: sc.dc,
    attack: sc.attack,
  };
}

/** SRD: a Wizard has no armor training, and nobody casts in armor they are not trained with. */
function armorBlocksCasting(state: Pick<GameState, 'character' | 'inventory'>): boolean {
  if (state.character.srd?.classId !== 'wizard') return false;
  return (state.inventory ?? []).some((i) => i.equipped && ARMOR_TABLE[i.name]);
}

export type CastRequest =
  | { ok: true; def: SpellDef; slot: number | null }
  | { ok: false; def: SpellDef; problem: string };

/** The spell a line asks for and the slot it spends, or why it cannot be cast. Null when no spell is named. */
export function resolveCastRequest(
  state: Pick<GameState, 'engineMode' | 'character' | 'inventory'>,
  input: string,
  where: 'fight' | 'outside'
): CastRequest | null {
  const kit = casterKit(state);
  const name = spellInInput(input);
  if (!kit || !name) return null;
  const def = SPELLS[name]!;
  if (!kit.cantrips.includes(name) && !kit.prepared.includes(name)) {
    return { ok: false, def, problem: `${name} is not one of your ${def.level ? 'prepared spells' : 'cantrips'}` };
  }
  if (armorBlocksCasting(state)) return { ok: false, def, problem: 'you cannot cast while wearing armor you are not trained with' };
  if (where === 'fight' && !def.combat) return { ok: false, def, problem: `${name} is no use in a fight` };
  if (where === 'outside' && !def.outside) return { ok: false, def, problem: `${name} needs a foe to aim at` };
  if (def.effect === 'mageArmor' && state.character.casting?.mageArmor) return { ok: false, def, problem: 'Mage Armor is already on you' };
  if (def.effect === 'mageArmor' && (state.inventory ?? []).some((i) => i.equipped && ARMOR_TABLE[i.name])) {
    return { ok: false, def, problem: 'Mage Armor needs you to wear no armor' };
  }
  if (def.level === 0) return { ok: true, def, slot: null };
  const want = slotLevelInInput(input);
  const slot = pickSlot(kit.left, def.level, want);
  if (slot == null) return { ok: false, def, problem: want ? `no level ${want} spell slot left` : `no spell slot left for ${name}` };
  return { ok: true, def, slot };
}

/** A line that casts an attack or curse spell at a foe (starts or continues a fight). */
export function isFightCast(state: Pick<GameState, 'engineMode' | 'character'>, input: string): boolean {
  if (!casterKit(state)) return false;
  const name = spellInInput(input);
  if (!name) return /\bcast\b.*\b(?:at|on)\b/i.test(input ?? '');
  const def = SPELLS[name]!;
  return def.combat && !def.outside;
}

export function slotsLine(state: Pick<GameState, 'engineMode' | 'character'>): string | null {
  const sc = sheetSpellcasting(state.character);
  if (!sc) return null;
  return `Spell slots: ${sc.slots.map((s) => `level ${s.level} ${s.left}/${s.total}`).join(', ')} left`;
}

const isHurt = (state: Pick<GameState, 'character'>) => state.character.hp * 2 <= (state.character.maxHp || state.character.hp);

/** Up to two spell chips for a fight round (the default cantrip chip comes from combatChips). */
export function spellRoundChips(state: GameState): string[] {
  const kit = casterKit(state);
  if (!kit || armorBlocksCasting(state)) return [];
  const can = (n: string) => resolveCastRequest(state, `Cast ${n}`, 'fight')?.ok === true;
  const prepared = kit.prepared.filter(can).map((n) => SPELLS[n]!);
  const foes = (state.roundCombat?.foes ?? []).filter((f) => f.hp > 0).length || (state.activeEncounter?.count ?? 1);
  const concentrating = !!state.roundCombat?.concentration;
  const picks: string[] = [];
  const heal = prepared.find((d) => d.effect === 'heal');
  if (heal && isHurt(state)) picks.push(heal.name);
  const area = prepared.find((d) => d.area && d.dice && (d.effect === 'save'));
  const single = prepared.find((d) => d.effect === 'attack' || d.effect === 'missile' || (d.effect === 'save' && !d.area));
  const buff = prepared.find((d) => d.concentration && !concentrating);
  for (const d of [foes > 1 ? area : undefined, buff, single, area]) {
    if (d && !picks.includes(d.name)) picks.push(d.name);
  }
  return picks.slice(0, 2).map((n) => `Cast ${n}`);
}

/** Outside a fight: a heal when hurt, or Mage Armor when unarmored and not yet on. Null when neither fits. */
export function tabletopCastChip(state: GameState): string | null {
  const kit = casterKit(state);
  if (!kit || state.activeEncounter || state.deathSaves) return null;
  for (const name of kit.prepared) {
    const def = SPELLS[name]!;
    if (def.effect === 'heal' && state.character.hp < (state.character.maxHp || state.character.hp) && isHurt(state)
      && resolveCastRequest(state, `Cast ${name}`, 'outside')?.ok) return `Cast ${name}`;
  }
  if (kit.prepared.includes('Mage Armor') && resolveCastRequest(state, 'Cast Mage Armor', 'outside')?.ok) return 'Cast Mage Armor';
  return null;
}

export interface OutsideCastResult {
  state: GameState;
  receipts: string[];
  fact: string;
}

/** Cast a spell outside a fight. Null when the line casts nothing (or a fight is on: rounds own casting then). */
export function resolveOutOfCombatCast(state: GameState, input: string, rng: Rng = Math.random): OutsideCastResult | null {
  if (state.engineMode !== 'dnd' || state.activeEncounter || state.deathSaves && !state.deathSaves.stable && !state.deathSaves.dead) return null;
  if (!/\bcast\b/i.test(input ?? '') && !/^\s*(?:use )?(?:cure wounds|healing word|mage armor)\b/i.test(input ?? '')) return null;
  const req = resolveCastRequest(state, input, 'outside');
  if (!req) return null;
  const def = req.def;
  if (!req.ok) {
    return {
      state,
      receipts: [`Spell: ${def.name} — not cast (${req.problem}); no slot spent`],
      fact: `You reach for ${def.name}, but ${req.problem}. Nothing is spent.`,
    };
  }
  const ch = state.character;
  const slotTag = req.slot ? ` (level ${req.slot} slot)` : ' (cantrip)';
  let next: GameState = req.slot ? { ...state, character: { ...ch, casting: spendSlot(ch.casting, req.slot) } } : state;
  const receipts: string[] = [];
  if (def.effect === 'heal') {
    const kit = casterKit(state)!;
    const bonus = kit.mod + (hasClassFeature(ch, /Disciple of Life/) ? 2 + (req.slot ?? 1) : 0);
    const roll = rollDice(spellDice(def, req.slot ?? 1), rng, { extraBonus: bonus });
    const max = ch.maxHp || ch.hp;
    const hp = Math.min(max, ch.hp + roll.total);
    next = { ...next, character: { ...next.character, hp } };
    receipts.push(`Spell: ${def.name}${slotTag} — ${formatDice(roll)}; HP ${ch.hp} → ${hp}`);
  } else if (def.effect === 'mageArmor') {
    const before = deriveTabletopSheet(state)!.ac;
    next = { ...next, character: { ...next.character, casting: { ...(next.character.casting ?? { slotsUsed: [] }), mageArmor: true } } };
    const after = tabletopArmorClass(ch.attributes.DEX, next.inventory ?? [], true).ac;
    next = { ...next, character: { ...next.character, armorClass: after } };
    receipts.push(`Spell: ${def.name}${slotTag} — AC ${before} → ${after} until your next long rest`);
  } else {
    receipts.push(`Spell: ${def.name}${slotTag}`);
  }
  if (req.slot) receipts.push(slotsLine(next)!);
  return { state: next, receipts, fact: `You cast ${def.name}: ${def.fact}.` };
}
