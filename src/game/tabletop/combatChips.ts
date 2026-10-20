/**
 * Tabletop fight chips: one choice per round (Attack, Cast, Dodge, Disengage, Help, Hide, Use item, Flee),
 * and "Fight for breath" while making death saves. The round engine (roundFight) reads the same weapon,
 * cantrip, potion and ally helpers, so a chip never offers what the engine cannot do.
 */
import type { GameState } from '../types';
import { presentNpcNames } from '../npcRelationships';
import { ARMOR_TABLE, hasClassFeature, sheetSpellcasting, untrainedArmor, WEAPON_DICE } from './characterBuild';
import { spellRoundChips } from './spellCasting';
import { SPELLS } from '../rules/spells';
import { featureLeft } from '../rules/classFeatures';
import { houseRulesOf } from '../rules/houseRules';
import { ammoFor, ammoLeft } from '../rules/encumbrance';

const POTION = /\bpotion\b.*\bheal|\bheal\w*\b.*\bpotion\b/i;

export function healingPotion(state: Pick<GameState, 'inventory'>): { id: string; name: string } | null {
  const it = (state.inventory ?? []).find((i) => POTION.test(i.name) && (i.quantity ?? 1) > 0);
  return it ? { id: it.id, name: it.name } : null;
}

/** The weapon a tabletop PC fights with: the one in hand, else the best SRD weapon carried, else an Unarmed Strike. */
export function pcWeaponName(state: Pick<GameState, 'inventory' | 'houseRules'>): string {
  const inv = state.inventory ?? [];
  // Under Strict Encumbrance a bow or crossbow with no ammunition left cannot be the weapon.
  const usable = (name: string) => {
    if (!houseRulesOf(state).strictEncumbrance) return true;
    const ammo = ammoFor(name);
    return !ammo || ammoLeft(inv, ammo) > 0;
  };
  const held = inv.find((i) => i.equipped && WEAPON_DICE[i.name] && /main|hand/i.test(i.slot ?? '') && usable(i.name));
  if (held) return held.name;
  return (
    inv.find((i) => WEAPON_DICE[i.name] && !WEAPON_DICE[i.name].ranged)?.name ??
    inv.find((i) => WEAPON_DICE[i.name] && usable(i.name))?.name ??
    'Unarmed Strike'
  );
}

/**
 * The default attack cantrip: the first fighting cantrip the caster knows (a Wizard's Fire Bolt, a Cleric's
 * Sacred Flame, a Warlock's Eldritch Blast). Non-casters, untrained armor or a raging Barbarian cast nothing.
 */
export function pcCantripName(state: Pick<GameState, 'character'> & Partial<Pick<GameState, 'inventory' | 'roundCombat'>>): string | null {
  if (!state.character?.srd || untrainedArmor(state.character, state.inventory ?? [])) return null;
  if (state.roundCombat?.raging) return null;
  return sheetSpellcasting(state.character)?.cantrips.find((n) => SPELLS[n]?.combat) ?? null;
}

/** Class-feature chips for a fight round (Rage, Reckless Attack, Lay On Hands, Innate Sorcery). */
export function featureRoundChips(state: GameState, weaponChip: string, cantrip: string | null): string[] {
  const c = state.character;
  const rc = state.roundCombat;
  const out: string[] = [];
  const attack = weaponChip.replace(/^Attack/, 'attack');
  if (featureLeft(c, 'rage') > 0 && !rc?.raging && !wearsHeavyArmor(state)) out.push(`Rage and ${attack}`);
  if (hasClassFeature(c, /^Reckless Attack/)) out.push(`Reckless ${attack}`);
  if (featureLeft(c, 'layOnHands') > 0 && c.hp < c.maxHp) out.push('Lay On Hands');
  if (cantrip && featureLeft(c, 'innateSorcery') > 0 && !rc?.innateSorcery) out.push(`Use Innate Sorcery and cast ${cantrip}`);
  return out;
}

/** SRD: a Barbarian gains no Rage benefits in Heavy armor. */
export function wearsHeavyArmor(state: Pick<GameState, 'inventory'>): boolean {
  return (state.inventory ?? []).some((i) => i.equipped && ARMOR_TABLE[i.name]?.category === 'Heavy');
}

export function fightAlly(state: Pick<GameState, 'companions'>): { name: string } | null {
  const c = (state.companions ?? []).find((m) => (m.type === 'party' || m.type === 'beast') && m.hp > 0);
  return c ? { name: c.name } : null;
}

export const DEATH_SAVE_CHIP = 'Fight for breath';

/** The round's chips while a tabletop fight is live; null when no round choice is due. */
export function roundCombatChips(state: GameState): string[] | null {
  if (state.engineMode !== 'dnd' || !state.character?.srd) return null;
  const ds = state.deathSaves;
  // SRD 5.2.1 (WotC, CC BY 4.0): at 0 HP the only turns are a death save, a present ally's
  // DC 10 Wisdom (Medicine) stabilise, or drinking a healing potion you carry.
  if (ds && !ds.dead && !ds.stable) {
    const out = [DEATH_SAVE_CHIP];
    const potion = healingPotion(state);
    if (potion) out.push(`Drink the ${potion.name}`);
    const pc = (state.character?.name ?? '').trim().toLowerCase();
    const seen = new Set<string>();
    for (const name of presentNpcNames(state)) {
      const key = name.trim().toLowerCase();
      if (!key || key === pc || seen.has(key)) continue;
      seen.add(key);
      out.push(`Ask ${name.trim()} to stabilise you`);
    }
    for (const c of state.companions ?? []) {
      const key = (c.name ?? '').trim().toLowerCase();
      if (!key || key === pc || seen.has(key) || (c.hp ?? 0) <= 0) continue;
      seen.add(key);
      out.push(`Ask ${c.name.trim()} to stabilise you`);
    }
    return out;
  }
  const enc = state.activeEncounter;
  if (!enc || enc.hp <= 0 || enc.phase === 'pending') return null;
  const weapon = pcWeaponName(state);
  const cantrip = pcCantripName(state);
  const ally = fightAlly(state);
  const potion = healingPotion(state);
  const weaponChip = weapon === 'Unarmed Strike' ? 'Attack with an Unarmed Strike' : `Attack with the ${weapon}`;
  return [
    weaponChip,
    ...(cantrip ? [`Cast ${cantrip}`] : []),
    ...spellRoundChips(state),
    ...featureRoundChips(state, weaponChip, cantrip),
    'Dodge',
    'Disengage',
    ...(ally ? [`Help ${ally.name}`] : []),
    'Hide',
    ...(potion ? [`Drink the ${potion.name}`] : []),
    'Flee',
  ];
}
