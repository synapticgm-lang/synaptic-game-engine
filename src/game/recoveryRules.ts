/**
 * 28g — shared recovery and early-fight rules (every mode).
 * Every mode rests by the SRD 5.2.1 rest rules at a safe hub (short rest: Hit Dice; long rest: all HP), and a won
 * fight gives no HP back; the mode profile decides how a rest is shown. A defeat never leaves the character stuck
 * at 1 HP. Early enemies (player level 1–3) hit softer, scaled by the difficulty table.
 */
import type { EngineMode, GameState } from './types';
import { difficultyFromStrictness } from './difficultyRules';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { advanceClock, wakeToNewDay, worldClock } from './travelJourney';
import { deriveTabletopSheet, sheetSpellcasting, tabletopHitDie } from './tabletop/characterBuild';
import { arcaneRecovery, isPactCaster } from './rules/spells';
import { restoreFeatures } from './rules/classFeatures';
import { houseRulesOf, REST_HOURS } from './rules/houseRules';
import { sidekickOf } from './rules/sidekick';
import { modeProfile } from './rules/modeProfile';
import { turnRng } from './seededRng';
import {
  OUTDOOR_SHORT_REST_COOLDOWN_TURNS,
  OUTDOOR_SHORT_REST_HEAL_FRACTION,
  OUTDOOR_SHORT_REST_HOURS,
} from './rules/wildlifeConfig';

export interface RecoveryRow {
  /** Share of max HP recovered after a won fight. */
  victoryFraction: number;
  /** A defeat leaves at least this share of max HP (you come to). */
  defeatFraction: number;
}

/** A won fight gives no HP back; damage stays until a rest (SRD 5.2.1). One row for every mode. */
const SHARED_RECOVERY: RecoveryRow = { victoryFraction: 0, defeatFraction: 0.25 };

export const RECOVERY_TABLE: Readonly<Record<EngineMode, RecoveryRow>> = {
  litrpg: SHARED_RECOVERY,
  dnd: SHARED_RECOVERY,
  rpg: SHARED_RECOVERY,
  pyoa: SHARED_RECOVERY,
};

export function recoveryRow(mode: EngineMode | undefined): RecoveryRow {
  return RECOVERY_TABLE[mode ?? 'litrpg'] ?? RECOVERY_TABLE.litrpg;
}

const REST_RE = /\b(rest|wait|sleep|catch (?:your|my) breath|take a breather|recover|ready yourself|make camp|bind (?:your|my) wounds)\b/i;
const OUTDOOR_SHORT_REST_RE =
  /\b(?:rest and bind your wounds|make camp|i bind my wounds|bind (?:your|my) wounds|catch (?:your|my) breath|take a breather|short rest|take a short rest)\b/i;

/**
 * Hubless tabletop bibles (Verdant Blight / Stillroot Veil / …) have no hub bank, but SRD
 * short rest still needs a quiet settlement. Inn / moot / camp / shrine / etc. count when
 * there is no fight or open dungeon — never graveyard / crypt / road alone.
 */
const HUBLESS_SETTLEMENT_RE =
  /\b(?:inn|tavern|moot|waystation|station|village|town|camp|palisade|hall|keep|temple|chapel|shrine|market|plaza|square|cafe|harbour|harbor)\b/i;
const HUBLESS_UNSAFE_RE = /\b(?:graveyard|crypt|catacomb|ruin|wilds|road|lane|path|ford|bridge)\b/i;

export function isHublessSettlementRestPlace(state: GameState): boolean {
  if (state.engineMode !== 'dnd') return false;
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (hubs.length > 0) return false;
  const here = (state.currentLocation ?? '').trim();
  if (!here || !HUBLESS_SETTLEMENT_RE.test(here)) return false;
  if (HUBLESS_UNSAFE_RE.test(here)) return false;
  return true;
}

/** Rest / wait at a named hub with no live or pending fight and no open dungeon. */
export function isSafeHubRest(state: GameState, input: string): boolean {
  if (!REST_RE.test(input ?? '')) return false;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter || state.activeDungeon) return false;
  if (matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation)) return true;
  // FOURSLOT4 — hubless tabletop settlements still allow SRD short rest (Rest never offered → Travel loop).
  return isHublessSettlementRestPlace(state);
}

/**
 * OPEN7 / OPEN9 — LitRPG / Story RPG may take a SHORT rest when not in a fight.
 * OPEN9: towns, hubs, roads, wilds, and quiet dungeons (no live/pending fight) — no fire needed.
 * Full / long rest still needs a safe hub via isSafeHubRest. Tabletop / dnd / PYOA never use this path.
 */
export function canOutdoorShortRest(state: GameState, input: string): boolean {
  if (state.engineMode !== 'litrpg' && state.engineMode !== 'rpg') return false;
  // Long-rest wording is SRD hub rest only (clears Weakened) — never this short path.
  if (tabletopRestKind(input ?? '') === 'long') return false;
  if (!OUTDOOR_SHORT_REST_RE.test(input ?? '') && !/^rest\b/i.test((input ?? '').trim())) return false;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return false;
  // Quiet dungeon rooms may rest; a live dungeon card with pending fight already blocked above.
  const until = state.outdoorShortRestCooldownUntilTurn;
  if (typeof until === 'number' && (state.turn ?? 0) < until) return false;
  const max = state.character?.maxHp || state.character?.hp || 0;
  const hp = state.character?.hp ?? 0;
  if (max <= 0 || hp >= max) return false;
  return true;
}

const MEAL_ITEM_RE = /\b(?:meal|ration|rations|bread|food|traveler'?s stew|dried meat|travel cake|hardtack)\b/i;

/** Prefer a held meal / ration for a short rest; returns the item name when one is spent. */
function takeRestMeal(state: GameState): { state: GameState; mealName: string | null } {
  const inv = state.inventory ?? [];
  const idx = inv.findIndex((it) => MEAL_ITEM_RE.test(it.name ?? '') && (it.quantity ?? 1) > 0);
  if (idx < 0) return { state, mealName: null };
  const item = inv[idx]!;
  const qty = item.quantity ?? 1;
  const nextInv =
    qty <= 1
      ? inv.filter((_, i) => i !== idx)
      : inv.map((it, i) => (i === idx ? { ...it, quantity: qty - 1 } : it));
  return { state: { ...state, inventory: nextInv }, mealName: item.name };
}

/** Outdoor / safe-spot short rest: heal a configured fraction, advance clock, eat a meal if owned, 0 XP, cooldown. */
export function applyOutdoorShortRest(state: GameState, input: string): RestHeal {
  if (!canOutdoorShortRest(state, input)) return { state, receipt: null };
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  const meal = takeRestMeal(state);
  const hours = meal.mealName ? OUTDOOR_SHORT_REST_HOURS : OUTDOOR_SHORT_REST_HOURS * 2;
  const gain = Math.max(1, Math.floor(max * OUTDOOR_SHORT_REST_HEAL_FRACTION));
  const hp = Math.min(max, ch.hp + gain);
  const clock = advanceClock(meal.state, hours);
  const turn = state.turn ?? 0;
  const next: GameState = {
    ...clock.state,
    character: { ...ch, hp },
    outdoorShortRestCooldownUntilTurn: turn + OUTDOOR_SHORT_REST_COOLDOWN_TURNS,
  };
  const mealBit = meal.mealName
    ? `; ate ${meal.mealName}`
    : '; no food — longer rest';
  const receipt = `Rest: short rest, ${hours} hour${hours === 1 ? '' : 's'}${mealBit} — HP ${ch.hp} → ${hp} (${clock.note})`;
  return {
    state: next,
    receipt,
    fact: meal.mealName
      ? `You rested for about an hour, ate ${meal.mealName}, and bound your wounds${hp < max ? '; you are not fully healed' : ''}.`
      : `You rested longer with no food on hand and bound your wounds${hp < max ? '; you are not fully healed' : ''}.`,
  };
}

/**
 * Rests follow the SRD 5.2.1 rest rules in every mode. Waiting, watching or readying is not a rest.
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

/** A Wizard's Arcane Recovery, a Warlock's Pact Magic slots or a spent Rage would come back on this short rest. */
function arcaneRecoveryDue(state: GameState): boolean {
  const ch = state.character;
  if (ch.srd?.classId === 'wizard') return !!arcaneRecovery(ch.level || 1, ch.casting);
  if (ch.srd && isPactCaster(ch.srd.classId) && slotsSpent(state)) return true;
  return (ch.featureUses?.rage ?? 0) > 0;
}

/** A limited-use class feature has been spent (a long rest brings it back). */
const featuresSpent = (state: GameState) => Object.values(state.character.featureUses ?? {}).some((n) => n > 0);

/**
 * One Short Rest hour for attunement (SRD 5.2.1): advance the clock 1 h and apply the same
 * Short Rest recovery the hub rest path uses (Arcane Recovery / Pact Magic / Rage). No Hit Die.
 */
export function takeShortRestHour(state: GameState): { state: GameState; note: string; after: string[] } {
  const clock = advanceClock(state, 1);
  const r = shortRestRecovery(clock.state);
  return { state: r.state, note: clock.note, after: r.after };
}

/** Short-rest recovery beyond Hit Dice: Arcane Recovery, Pact Magic slots, one Rage. */
function shortRestRecovery(s: GameState): { state: GameState; after: string[] } {
  const ch = s.character;
  const after: string[] = [];
  let character = ch;
  const recovery = ch.srd?.classId === 'wizard' ? arcaneRecovery(ch.level || 1, ch.casting) : null;
  if (recovery) {
    character = { ...character, casting: recovery.casting };
    after.push(`Arcane Recovery: ${recovery.recovered.map((l) => `level ${l}`).join(', ')} slot back`);
  }
  // SRD 5.2.1 Pact Magic: a Warlock regains all expended Pact Magic slots on a Short or Long Rest.
  const pact = !!ch.srd && isPactCaster(ch.srd.classId) && (ch.casting?.slotsUsed ?? []).some((n) => n > 0);
  if (pact) character = { ...character, casting: { ...(character.casting ?? {}), slotsUsed: [] } };
  const back = restoreFeatures(character, 'short');
  character = back.character;
  if (recovery || pact) after.push(slotsLeftLine({ ...s, character })!);
  if (back.regained.length) after.push(`Class feature: ${back.regained.join(', ')} back`);
  return { state: { ...s, character }, after };
}

/**
 * The rest chip at a safe hub when hurt or out of spell slots (null when nothing to recover or not safe).
 * Tabletop, LitRPG and story RPG rest by the same rules; Pick Your Own Adventure plays its spine chips.
 */
export function restChip(state: GameState): string | null {
  const ch = state.character;
  if (!ch || state.engineMode === 'pyoa' || !isSafeHubRest(state, TABLETOP_LONG_REST_CHIP)) return null;
  const max = ch.maxHp || ch.hp;
  if (ch.hp >= max) {
    if (!slotsSpent(state) && !featuresSpent(state)) return null;
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

/** A rest length for STATUS ("8 hours") and for the writer ("about eight hours"). */
function restSpan(hours: number): { status: string; prose: string } {
  if (hours < 1) {
    const m = Math.round(hours * 60);
    return { status: `${m} minutes`, prose: m === 5 ? 'about five minutes' : `about ${m} minutes` };
  }
  if (hours >= 24) {
    const d = Math.round(hours / 24);
    return { status: `${d} days`, prose: d === 7 ? 'about a week' : `about ${d} days` };
  }
  const words: Record<number, string> = { 1: 'an hour', 8: 'eight hours' };
  return { status: `${hours} hour${hours === 1 ? '' : 's'}`, prose: `about ${words[hours] ?? `${hours} hours`}` };
}

function applySrdRest(state: GameState, input: string): RestHeal {
  const kind = tabletopRestKind(input);
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  const hurt = ch.hp < max;
  const sidekick = sidekickOf(state);
  const sidekickHurt = !!sidekick && sidekick.hp < sidekick.maxHp;
  const recovers = kind === 'long'
    ? hurt || sidekickHurt || slotsSpent(state) || !!ch.casting?.mageArmor || featuresSpent(state) || (ch.exhaustion ?? 0) > 0
    : hurt || arcaneRecoveryDue(state);
  if (!kind || !recovers || !isSafeHubRest(state, kind === 'long' ? TABLETOP_LONG_REST_CHIP : 'rest')) {
    return { state, receipt: null };
  }
  return srdRest(state, kind);
}

/**
 * SRD 5.2.1 Exhaustion: a Long Rest removes 1 level. Levels gained from Malnutrition (`malnutritionExhaustion`)
 * can't be removed until the character eats a full day's food; other levels still come off.
 */
function exhaustionAfterLongRest(state: GameState): { exhaustion: number; line: string | null } {
  const level = state.character.exhaustion ?? 0;
  if (level <= 0) return { exhaustion: 0, line: null };
  if (level <= (state.character.malnutritionExhaustion ?? 0)) return { exhaustion: level, line: `Exhaustion: level ${level} stays (malnutrition)` };
  return { exhaustion: level - 1, line: `Exhaustion: level ${level} → ${level - 1}` };
}

function srdRest(state: GameState, kind: 'long' | 'short'): RestHeal {
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  const hurt = ch.hp < max;
  const sidekick = sidekickOf(state);
  const sidekickHurt = !!sidekick && sidekick.hp < sidekick.maxHp;
  const house = houseRulesOf(state);
  const hours = REST_HOURS[house.restVariant];
  const variant = house.restVariant === 'standard' ? '' : ` (${house.restVariant} rest)`;
  if (kind === 'long') {
    const span = restSpan(hours.long);
    // SRD 5.2.1: one Long Rest per 24 hours. Too soon after the last, the hours until it may begin pass awake.
    const now = worldClock(state);
    const wait = state.lastLongRestAt == null ? 0 : Math.max(0, Math.round((state.lastLongRestAt + 24 - now) * 10) / 10);
    const awake = wait ? restSpan(wait) : null;
    const clock = advanceClock(state, wait + hours.long);
    const spent = Math.max(0, (state.hitDiceSpent ?? 0) - Math.max(1, Math.floor((ch.level ?? 1) / 2)));
    const caster = !!sheetSpellcasting(ch);
    // Human Resourceful (SRD 5.2.1): Heroic Inspiration after each Long Rest.
    const inspired = house.heroicInspiration && house.rulesVersion === 'srd-5.2.1' && ch.srd?.speciesId === 'human' && !ch.heroicInspiration;
    // A long rest restores every spell slot, resets Arcane Recovery and ends Mage Armor (it lasts 8 hours).
    const features = restoreFeatures(ch, 'long');
    const tired = exhaustionAfterLongRest(state);
    let character = {
      ...features.character,
      hp: max,
      ...(caster ? { casting: { slotsUsed: [] } } : {}),
      ...(inspired ? { heroicInspiration: true } : {}),
      ...((ch.exhaustion ?? 0) > 0 ? { exhaustion: tired.exhaustion } : {}),
    };
    if (ch.casting?.mageArmor) {
      const ac = deriveTabletopSheet({ character, inventory: state.inventory ?? [] })?.ac;
      if (ac != null) character = { ...character, armorClass: ac };
    }
    const companions = sidekickHurt ? (clock.state.companions ?? []).map((c) => (c.sidekick ? { ...c, hp: c.maxHp } : c)) : clock.state.companions;
    let next = wakeToNewDay({ ...clock.state, companions, hitDiceSpent: spent, character, lastLongRestAt: now + wait });
    // q65 Package A: a long rest clears Weakened (turn window or rest, whichever first).
    if (next.weakenedUntilTurn != null || (next.character.conditions ?? []).some((c) => /^weakened$/i.test(c))) {
      next = {
        ...next,
        weakenedUntilTurn: null,
        character: {
          ...next.character,
          conditions: (next.character.conditions ?? []).filter((c) => !/^weakened$/i.test(c)),
        },
      };
    }
    const slotLine = caster ? slotsLeftLine(next) : null;
    const after = [
      ...(slotLine ? [slotLine] : []),
      ...(sidekickHurt ? [`${sidekick!.name}: HP ${sidekick!.hp} → ${sidekick!.maxHp}`] : []),
      ...(inspired ? ['Heroic Inspiration: yours (Human, Resourceful)'] : []),
      ...(features.regained.length ? [`Class feature: ${features.regained.join(', ')} back`] : []),
      ...(tired.line ? [tired.line] : []),
    ];
    return {
      state: next,
      receipt: `Rest: long rest${variant}, ${span.status}${awake ? ` after ${awake.status} awake (one long rest per 24 hours)` : ''} — ${hurt ? `HP ${ch.hp} → ${max}` : `HP stays ${max}`} (${clock.note})`,
      ...(after.length ? { after } : {}),
      fact: `${awake ? `You stayed awake ${awake.prose} before you could rest, then ` : 'You '}${hours.long >= 24 ? 'rested' : 'slept'} through a long rest of ${span.prose} and woke with your strength back${caster ? ' and your spells ready again' : ''}.`,
    };
  }
  const shortSpan = restSpan(hours.short);
  const clock = advanceClock(state, hours.short);
  const recovery = state.character.srd?.classId === 'wizard' ? arcaneRecovery(ch.level || 1, ch.casting) : null;
  const withRecovery = (s: GameState): { state: GameState; after?: string[] } => {
    const r = shortRestRecovery(s);
    return r.after.length ? r : { state: r.state };
  };
  const pactBack = !!ch.srd && isPactCaster(ch.srd.classId) && slotsSpent(state);
  const recoveryFact = recovery ? ' You also recovered some spell power through study.' : pactBack ? ' Your pact magic stirs back to full.' : '';
  if (!hurt || hitDiceLeft(state) <= 0) {
    const r = withRecovery(clock.state);
    return {
      state: r.state,
      receipt: `Rest: short rest${variant}, ${shortSpan.status} — ${hurt ? 'no Hit Dice left, ' : ''}HP stays ${ch.hp} (${clock.note})`,
      ...(r.after ? { after: r.after } : {}),
      fact: hurt
        ? `You rested for ${shortSpan.prose}, but it did not ease your hurts; you need ${hours.long >= 24 ? 'a long rest' : 'a night’s sleep'}.${recoveryFact}`
        : `You took a short rest of ${shortSpan.prose}.${recoveryFact}`,
    };
  }
  const die = tabletopHitDie(ch);
  const roll = Math.floor(turnRng(state, 'hit-die')() * die) + 1;
  const con = Math.floor(((ch.attributes?.CON ?? 10) - 10) / 2);
  const gain = Math.max(1, roll + con);
  const hp = Math.min(max, ch.hp + gain);
  const r = withRecovery({ ...clock.state, hitDiceSpent: (state.hitDiceSpent ?? 0) + 1, character: { ...ch, hp } });
  return {
    state: r.state,
    receipt: `Rest: short rest${variant}, ${shortSpan.status} — HP ${ch.hp} → ${hp} (${clock.note})`,
    dieLine: `Hit Die: d${die} ${roll} ${con >= 0 ? '+' : '−'} ${Math.abs(con)} = ${gain}`,
    ...(r.after ? { after: r.after } : {}),
    fact: `You took a short rest of ${shortSpan.prose} and bound your hurts${hp < max ? '; you are not fully healed' : ''}.${recoveryFact}`,
  };
}

/**
 * Heal on a safe-hub rest, by the SRD rest rules in every mode. Receipt for STATUS, or null when nothing changed.
 * Tabletop shows the rest kind, hours, clock and Hit Die; LitRPG and story RPG show the short HP line.
 * OPEN7 addendum: LitRPG / Story RPG also accept a short outdoor rest (fraction heal, never a hub long rest).
 */
export function applyRestHeal(state: GameState, input: string): RestHeal {
  // OPEN9 — LitRPG / Story RPG short Rest chip (meal + clock) wins over SRD hub short rest.
  // Long-rest wording ("Rest for the night", sleep, …) still takes SRD long rest so Weakened clears (q65).
  if (
    (state.engineMode === 'litrpg' || state.engineMode === 'rpg')
    && tabletopRestKind(input) !== 'long'
  ) {
    const outdoor = presentRest(state, applyOutdoorShortRest(state, input));
    if (outdoor.receipt) return outdoor;
  }
  const hub = presentRest(state, applySrdRest(state, input));
  if (hub.receipt) return hub;
  return presentRest(state, applyOutdoorShortRest(state, input));
}

/**
 * The night's sleep at a road camp: the same SRD rest as at a hub, with no safe-hub gate (the engine has already
 * settled the night's watches). Under the gritty rest variant a night's sleep is a short rest.
 */
export function applyCampRest(state: GameState): RestHeal {
  return presentRest(state, srdRest(state, houseRulesOf(state).restVariant === 'gritty' ? 'short' : 'long'));
}

function presentRest(state: GameState, rest: RestHeal): RestHeal {
  if (!rest.receipt || modeProfile(state.engineMode).restDetail) return rest;
  const before = state.character.hp;
  const after = rest.state.character.hp;
  // OPEN9 — keep meal / no-food note on the simplified LitRPG/RPG STATUS line.
  const ate = rest.receipt.match(/ate\s+([^;—]+)/i)?.[1]?.trim();
  const mealBit = ate
    ? `; ate ${ate}`
    : /no food/i.test(rest.receipt)
      ? '; no food — longer rest'
      : '';
  return {
    state: rest.state,
    receipt: after !== before ? `Rest: HP ${before} → ${after}${mealBit}` : `Rest: HP stays ${after}${mealBit}`,
    ...(rest.fact ? { fact: rest.fact } : {}),
  };
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
