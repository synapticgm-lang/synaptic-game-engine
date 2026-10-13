/**
 * Tabletop fight chips: one choice per round (Attack, Cast, Dodge, Disengage, Help, Hide, Use item, Flee),
 * and "Fight for breath" while making death saves. The round engine (roundFight) reads the same weapon,
 * cantrip, potion and ally helpers, so a chip never offers what the engine cannot do.
 */
import type { GameState } from '../types';
import { untrainedArmor, WEAPON_DICE } from './characterBuild';
import { spellRoundChips } from './spellCasting';
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

/** The default attack cantrip: a Wizard's Fire Bolt, a Cleric's Sacred Flame (SRD). Others, or untrained armor, cast nothing. */
export function pcCantripName(state: Pick<GameState, 'character'> & Partial<Pick<GameState, 'inventory'>>): string | null {
  if (state.character && untrainedArmor(state.character, state.inventory ?? [])) return null;
  const cls = state.character?.srd?.classId;
  return cls === 'wizard' ? 'Fire Bolt' : cls === 'cleric' ? 'Sacred Flame' : null;
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
  if (ds && !ds.dead && !ds.stable) return [DEATH_SAVE_CHIP];
  const enc = state.activeEncounter;
  if (!enc || enc.hp <= 0 || enc.phase === 'pending') return null;
  const weapon = pcWeaponName(state);
  const cantrip = pcCantripName(state);
  const ally = fightAlly(state);
  const potion = healingPotion(state);
  return [
    weapon === 'Unarmed Strike' ? 'Attack with an Unarmed Strike' : `Attack with the ${weapon}`,
    ...(cantrip ? [`Cast ${cantrip}`] : []),
    ...spellRoundChips(state),
    'Dodge',
    'Disengage',
    ...(ally ? [`Help ${ally.name}`] : []),
    'Hide',
    ...(potion ? [`Drink the ${potion.name}`] : []),
    'Flee',
  ];
}
