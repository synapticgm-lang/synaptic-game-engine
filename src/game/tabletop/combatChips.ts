/**
 * Tabletop fight chips: one choice per round (Attack, Cast, Dodge, Disengage, Help, Hide, Use item, Flee),
 * and "Fight for breath" while making death saves. The round engine (roundFight) reads the same weapon,
 * cantrip, potion and ally helpers, so a chip never offers what the engine cannot do.
 */
import type { GameState } from '../types';
import { WEAPON_DICE } from './characterBuild';

const POTION = /\bpotion\b.*\bheal|\bheal\w*\b.*\bpotion\b/i;

export function healingPotion(state: Pick<GameState, 'inventory'>): { id: string; name: string } | null {
  const it = (state.inventory ?? []).find((i) => POTION.test(i.name) && (i.quantity ?? 1) > 0);
  return it ? { id: it.id, name: it.name } : null;
}

/** The weapon a tabletop PC fights with: the one in hand, else the best SRD weapon carried, else an Unarmed Strike. */
export function pcWeaponName(state: Pick<GameState, 'inventory'>): string {
  const inv = state.inventory ?? [];
  const held = inv.find((i) => i.equipped && WEAPON_DICE[i.name] && /main|hand/i.test(i.slot ?? ''));
  if (held) return held.name;
  return inv.find((i) => WEAPON_DICE[i.name] && !WEAPON_DICE[i.name].ranged)?.name ?? inv.find((i) => WEAPON_DICE[i.name])?.name ?? 'Unarmed Strike';
}

/** A Wizard knows Fire Bolt, a Cleric Sacred Flame (SRD cantrips). Others cast nothing. */
export function pcCantripName(state: Pick<GameState, 'character'>): string | null {
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
    'Dodge',
    'Disengage',
    ...(ally ? [`Help ${ally.name}`] : []),
    'Hide',
    ...(potion ? [`Drink the ${potion.name}`] : []),
    'Flee',
  ];
}
