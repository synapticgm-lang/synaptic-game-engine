/**
 * 28g — shared recovery and early-fight rules (every mode).
 * HP comes back on rest at a safe hub and partly after a won fight; a defeat never leaves the
 * character stuck at 1 HP. Early enemies (player level 1–3) hit softer, scaled by the difficulty table.
 */
import type { EngineMode, GameState } from './types';
import { difficultyFromStrictness } from './difficultyRules';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { advanceClock } from './travelJourney';
import { deriveTabletopSheet, sheetSpellcasting, tabletopHitDie } from './tabletop/characterBuild';
import { arcaneRecovery } from './rules/spells';

export interface RecoveryRow {
  /** Share of max HP restored by rest / wait at a safe hub. */
  restFraction: number;
  /** Share of max HP recovered after a won fight. */
  victoryFraction: number;
  /** A defeat leaves at least this share of max HP (you come to). */
  defeatFraction: number;
}

export const RECOVERY_TABLE: Readonly<Record<EngineMode, RecoveryRow>> = {
  litrpg: { restFraction: 0.5, victoryFraction: 0.25, defeatFraction: 0.25 },
  // Tabletop: a won fight gives no HP back; damage stays until a rest (5e).
  dnd: { restFraction: 0.5, victoryFraction: 0, defeatFraction: 0.25 },
  rpg: { restFraction: 0.5, victoryFraction: 0.2, defeatFraction: 0.25 },
  pyoa: { restFraction: 0.5, victoryFraction: 0.25, defeatFraction: 0.25 },
};

export function recoveryRow(mode: EngineMode | undefined): RecoveryRow {
  return RECOVERY_TABLE[mode ?? 'litrpg'] ?? RECOVERY_TABLE.litrpg;
}

const REST_RE = /\b(rest|wait|sleep|catch (?:your|my) breath|take a breather|recover|ready yourself)\b/i;

/** Rest / wait at a named hub with no live or pending fight and no open dungeon. */
export function isSafeHubRest(state: GameState, input: string): boolean {
  if (!REST_RE.test(input ?? '')) return false;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter || state.activeDungeon) return false;
  return !!matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
}

/**
 * Tabletop rests follow the 5e rest rules. Waiting, watching or readying is not a rest.
 * Short rest: 1 hour, spend one Hit Die (the class die, d8 with no sheet, + CON modifier). Long rest:
 * 8 hours, all HP back and half the spent Hit Dice (at least 1). A character holds as many Hit Dice as their level.
 */
const TABLETOP_LONG_REST = /\b(?:sleep|long rest|bed down|make camp|overnight|for the night|take a room|turn in)\b/i;
const TABLETOP_SHORT_REST = /^rest\b|\b(?:short rest|take a rest|rest (?:a while|an hour|up)|catch (?:your|my) breath|take a breather|bind (?:your|my) wounds)\b/i;

export const TABLETOP_SHORT_REST_CHIP = 'Take a short rest';
export const TABLETOP_LONG_REST_CHIP = 'Rest for the night';

function hitDiceLeft(state: GameState): number {
  return Math.max(0, (state.character.level ?? 1) - (state.hitDiceSpent ?? 0));
}

function tabletopRestKind(input: string): 'long' | 'short' | null {
  const text = (input ?? '').trim();
  if (TABLETOP_LONG_REST.test(text)) return 'long';
  if (TABLETOP_SHORT_REST.test(text)) return 'short';
  return null;
}

const slotsSpent = (state: GameState) => (state.character.casting?.slotsUsed ?? []).some((n) => n > 0);

/** A Wizard's Arcane Recovery would bring a slot back on this short rest. */
function arcaneRecoveryDue(state: GameState): boolean {
  return state.character.srd?.classId === 'wizard' && !!arcaneRecovery(state.character.level || 1, state.character.casting);
}

/** Tabletop: the rest chip at a safe hub when hurt or out of spell slots (null when nothing to recover or not safe). */
export function tabletopRestChip(state: GameState): string | null {
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  if (state.engineMode !== 'dnd' || !isSafeHubRest(state, TABLETOP_LONG_REST_CHIP)) return null;
  if (ch.hp >= max) {
    if (!slotsSpent(state)) return null;
    return arcaneRecoveryDue(state) ? TABLETOP_SHORT_REST_CHIP : TABLETOP_LONG_REST_CHIP;
  }
  return hitDiceLeft(state) > 0 && ch.hp * 2 > max ? TABLETOP_SHORT_REST_CHIP : TABLETOP_LONG_REST_CHIP;
}

/** `after`: extra STATUS lines below the rest receipt (spell slots back). */
export type RestHeal = { state: GameState; receipt: string | null; dieLine?: string; after?: string[]; fact?: string };

function slotsLeftLine(state: GameState): string | null {
  const sc = sheetSpellcasting(state.character);
  return sc ? `Spell slots: ${sc.slots.map((s) => `level ${s.level} ${s.left}/${s.total}`).join(', ')} left` : null;
}

function applyTabletopRest(state: GameState, input: string): RestHeal {
  const kind = tabletopRestKind(input);
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  const hurt = ch.hp < max;
  const recovers = kind === 'long' ? hurt || slotsSpent(state) || !!ch.casting?.mageArmor : hurt || arcaneRecoveryDue(state);
  if (!kind || !recovers || !isSafeHubRest(state, kind === 'long' ? TABLETOP_LONG_REST_CHIP : 'rest')) {
    return { state, receipt: null };
  }
  if (kind === 'long') {
    const clock = advanceClock(state, 8);
    const spent = Math.max(0, (state.hitDiceSpent ?? 0) - Math.max(1, Math.floor((ch.level ?? 1) / 2)));
    const caster = !!sheetSpellcasting(ch);
    // A long rest restores every spell slot, resets Arcane Recovery and ends Mage Armor (it lasts 8 hours).
    let character = { ...ch, hp: max, ...(caster ? { casting: { slotsUsed: [] } } : {}) };
    if (ch.casting?.mageArmor) {
      const ac = deriveTabletopSheet({ character, inventory: state.inventory ?? [] })?.ac;
      if (ac != null) character = { ...character, armorClass: ac };
    }
    const next = { ...clock.state, hitDiceSpent: spent, character };
    const slotLine = caster ? slotsLeftLine(next) : null;
    return {
      state: next,
      receipt: `Rest: long rest, 8 hours — ${hurt ? `HP ${ch.hp} → ${max}` : `HP stays ${max}`} (${clock.note})`,
      ...(slotLine ? { after: [slotLine] } : {}),
      fact: `You slept through a long rest of about eight hours and woke with your strength back${caster ? ' and your spells ready again' : ''}.`,
    };
  }
  const clock = advanceClock(state, 1);
  const recovery = state.character.srd?.classId === 'wizard' ? arcaneRecovery(ch.level || 1, ch.casting) : null;
  const withRecovery = (s: GameState): { state: GameState; after?: string[] } => {
    if (!recovery) return { state: s };
    const next = { ...s, character: { ...s.character, casting: recovery.casting } };
    return { state: next, after: [`Arcane Recovery: ${recovery.recovered.map((l) => `level ${l}`).join(', ')} slot back`, slotsLeftLine(next)!] };
  };
  const recoveryFact = recovery ? ' You also recovered some spell power through study.' : '';
  if (!hurt || hitDiceLeft(state) <= 0) {
    const r = withRecovery(clock.state);
    return {
      state: r.state,
      receipt: `Rest: short rest, 1 hour — ${hurt ? 'no Hit Dice left, ' : ''}HP stays ${ch.hp} (${clock.note})`,
      ...(r.after ? { after: r.after } : {}),
      fact: hurt
        ? `You rested for about an hour, but it did not ease your hurts; you need a night’s sleep.${recoveryFact}`
        : `You took a short rest of about an hour.${recoveryFact}`,
    };
  }
  const die = tabletopHitDie(ch);
  const roll = Math.floor(Math.random() * die) + 1;
  const con = Math.floor(((ch.attributes?.CON ?? 10) - 10) / 2);
  const gain = Math.max(1, roll + con);
  const hp = Math.min(max, ch.hp + gain);
  const r = withRecovery({ ...clock.state, hitDiceSpent: (state.hitDiceSpent ?? 0) + 1, character: { ...ch, hp } });
  return {
    state: r.state,
    receipt: `Rest: short rest, 1 hour — HP ${ch.hp} → ${hp} (${clock.note})`,
    dieLine: `Hit Die: d${die} ${roll} ${con >= 0 ? '+' : '−'} ${Math.abs(con)} = ${gain}`,
    ...(r.after ? { after: r.after } : {}),
    fact: `You took a short rest of about an hour and bound your hurts${hp < max ? '; you are not fully healed' : ''}.${recoveryFact}`,
  };
}

/** Heal on a safe-hub rest. Receipt for STATUS, or null when nothing changed. */
export function applyRestHeal(state: GameState, input: string): RestHeal {
  if (state.engineMode === 'dnd') return applyTabletopRest(state, input);
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  if (!isSafeHubRest(state, input) || ch.hp >= max) return { state, receipt: null };
  const gain = Math.max(1, Math.ceil(max * recoveryRow(state.engineMode).restFraction));
  const hp = Math.min(max, ch.hp + gain);
  return { state: { ...state, character: { ...ch, hp } }, receipt: `Rest: HP ${ch.hp} → ${hp}` };
}

/** HP after an engine-resolved fight: some recovery on a win, a floor on a defeat. */
export function hpAfterFight(state: GameState, victory: boolean, finalHp: number): number {
  const max = state.character.maxHp || state.character.hp;
  const row = recoveryRow(state.engineMode);
  const base = Math.max(1, finalHp);
  if (victory) return Math.min(max, base + Math.ceil(max * row.victoryFraction));
  return Math.min(max, Math.max(base, Math.ceil(max * row.defeatFraction)));
}

/** Early fights: for player level 1–3 an enemy's attack is capped at 1 + level (Easy −1, Hard +1). */
export function earlyEnemyAttack(state: GameState, baseAttack: number): number {
  const level = state.character.level ?? 1;
  if (level > 3) return baseAttack;
  const d = difficultyFromStrictness(state.gmStrictness);
  const shift = d === 'easy' ? -1 : d === 'hard' ? 1 : 0;
  return Math.max(1, Math.min(baseAttack, 1 + level + shift));
}
