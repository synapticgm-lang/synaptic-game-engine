/**
 * Tabletop fight chips: legal actions this round from the SRD action economy (merge M3),
 * capped at 4 non-idle picks in one place. Typed free text always remains available beside them.
 * The round engine (roundFight) reads the same weapon, cantrip, potion and ally helpers, so a chip
 * never offers what the engine cannot do.
 *
 * SRD 5.2.1 — Combat / Your Turn (Wizards of the Coast LLC, CC BY 4.0): one Action, optional Bonus
 * Action when a feature grants one, Movement, one free object interaction; speech is free (not a chip).
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

/** One place for the fight-button cap (gap-cap-4). */
export const FIGHT_CHIP_CAP = 4;

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

/**
 * Priority for the 4-chip fight pad: Attack → Cast/feature → Dodge/Disengage-and-move → rest.
 * M6: Flee folds into Disengage plus move (SRD 5.2.1 — Disengage then use your Speed).
 * All candidates are engine-legal for this round (economy still available at round start).
 */
function fightChipPriority(label: string): number {
  const l = label.toLowerCase();
  if (l.startsWith('attack')) return 0;
  if (l.startsWith('cast') || l.startsWith('use innate')) return 1;
  if (l.startsWith('rage') || l.startsWith('reckless') || l === 'lay on hands') return 2;
  if (l === 'dodge' || l.startsWith('disengage')) return 3;
  if (l.startsWith('drink')) return 4;
  if (l.startsWith('help') || l === 'hide') return 5;
  return 6;
}

/** Cap non-idle fight picks at FIGHT_CHIP_CAP (one place — gap-cap-4). */
export function capFightChips(candidates: string[], cap = FIGHT_CHIP_CAP): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of candidates) {
    const t = (raw ?? '').trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(t);
  }
  return unique.sort((a, b) => fightChipPriority(a) - fightChipPriority(b)).slice(0, Math.max(0, cap));
}

/**
 * Engine-legal fight actions available at the start of this round (economy fresh).
 * Does not include idle Wait — typed free text stays beside these buttons.
 */
export function legalFightActionsThisRound(state: GameState): string[] {
  const weapon = pcWeaponName(state);
  const cantrip = pcCantripName(state);
  const ally = fightAlly(state);
  const potion = healingPotion(state);
  const weaponChip = weapon === 'Unarmed Strike' ? 'Attack with an Unarmed Strike' : `Attack with the ${weapon}`;
  const eco = state.roundCombat?.pcEconomy;
  // At round start (or when economy unset) every Action is legal; when Action already spent, drop Action chips.
  const actionOk = eco?.actionAvailable !== false;
  const bonusOk = eco?.bonusAvailable !== false;
  const out: string[] = [];
  if (actionOk) {
    out.push(weaponChip);
    if (cantrip) out.push(`Cast ${cantrip}`);
    out.push(...spellRoundChips(state));
    // M6 — Flee folds into Disengage plus move (SRD: Disengage Action, then move your Speed).
    out.push('Dodge', 'Disengage and move');
    if (ally) out.push(`Help ${ally.name}`);
    out.push('Hide');
  }
  if (bonusOk || actionOk) {
    for (const f of featureRoundChips(state, weaponChip, cantrip)) {
      // Rage / Innate are bonus-flavoured; Reckless rides with Attack.
      if (!bonusOk && /^(Rage |Use Innate)/i.test(f) && !/^Reckless /i.test(f)) continue;
      out.push(f);
    }
  }
  if (potion && (bonusOk || actionOk)) out.push(`Drink the ${potion.name}`);
  return out;
}

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
    return capFightChips(out, FIGHT_CHIP_CAP);
  }
  const enc = state.activeEncounter;
  if (!enc || enc.hp <= 0 || enc.phase === 'pending') return null;
  return capFightChips(legalFightActionsThisRound(state), FIGHT_CHIP_CAP);
}
