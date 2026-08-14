import type { AttributeKey, GameState, GmStrictness, ProfessionSkill } from './types';
import type { PlayerIntent } from './intentParser';
import { evaluateRoll, type RollOutcome } from './gameEngine';
import { currentDungeonNode } from './dungeonSeed';

export type CheckSkill =
  | 'athletics'
  | 'perception'
  | 'investigation'
  | 'stealth'
  | 'thievery'
  | 'persuasion'
  | 'arcana'
  | 'survival';

export interface CheckContext {
  label: string;
  attr: AttributeKey;
  skill?: CheckSkill;
  profession?: string;
  dc: number;
  /** Optional sticky cost on crit fail when fiction warrants (trap room, combat). */
  critFailHpRisk: number;
}

export interface PlayerCheckResult extends RollOutcome {
  d20: number;
  modifier: number;
  dc: number;
  label: string;
  attr: AttributeKey;
  skill?: CheckSkill;
  codeResolutionText: string;
  narrativeOutcomeLabel: 'SUCCESS' | 'FAILURE';
}

function attrScore(state: GameState, key: AttributeKey): number {
  const attrs = state.character.attributes;
  if (key === 'STR' && state.character.strength != null) {
    return state.character.strength;
  }
  return attrs?.[key] ?? 10;
}

function attrMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function gearMod(state: GameState, key: AttributeKey): number {
  let bonus = 0;
  for (const item of state.inventory) {
    if (!item.equipped || !item.modifiers) continue;
    bonus += item.modifiers[key] ?? 0;
  }
  return bonus;
}

function skillBonus(state: GameState, skill?: CheckSkill): number {
  if (!skill) return 0;
  const skills = (state.character as { skills?: Partial<Record<CheckSkill, number>> }).skills;
  if (skills?.[skill] != null) return Math.floor(Number(skills[skill]) || 0);
  // Soft practice bonus from level for core exploration skills
  const lvl = state.character.level ?? 1;
  if (skill === 'perception' || skill === 'investigation' || skill === 'athletics') {
    return Math.floor(lvl / 4);
  }
  return Math.floor(lvl / 5);
}

function professionBonus(state: GameState, professionName?: string): number {
  if (!professionName) return 0;
  const list =
    ((state.character as { professions?: ProfessionSkill[] }).professions as ProfessionSkill[] | undefined) ??
    [];
  const hit = list.find(
    (p) => p.type.toLowerCase() === professionName.toLowerCase() || p.type.includes(professionName as never)
  );
  if (!hit) return 0;
  return Math.floor((hit.level ?? 1) / 2);
}

function dcForStrictness(base: number, strictness: GmStrictness | undefined): number {
  if (strictness === 'hardcore') return base + 2;
  if (strictness === 'forgiving') return Math.max(8, base - 2);
  return base;
}

/**
 * Map intent + action text → attribute / skill / profession / DC.
 * Trap DCs from the current room hidden ledger override defaults when relevant.
 */
export function resolveCheckContext(
  state: GameState,
  intent: PlayerIntent,
  actionText: string
): CheckContext {
  const t = actionText.toLowerCase();
  const node = currentDungeonNode(state.activeDungeon);
  const trap = node?.hidden?.traps.find((tr) => !tr.disarmed);
  const strict = state.gmStrictness;

  if (/\b(pick\s+lock|lockpick|disarm|disable\s+trap|jimmy)\b/i.test(t) || intent.kind === 'search' && /\block|trap|chest|cache\b/i.test(t)) {
    const dc = trap?.dc ?? dcForStrictness(13, strict);
    return {
      label: 'Thievery / lock',
      attr: 'DEX',
      skill: 'thievery',
      profession: 'Engineering',
      dc,
      critFailHpRisk: trap?.damage ?? 0,
    };
  }

  if (intent.kind === 'talk' || intent.kind === 'refuse' || /\b(persuade|negotiate|intimidate|convince)\b/i.test(t)) {
    return {
      label: intent.kind === 'refuse' ? 'Refuse / protest' : 'Social',
      attr: 'CHA',
      skill: 'persuasion',
      dc: dcForStrictness(intent.kind === 'refuse' ? 10 : 12, strict),
      critFailHpRisk: 0,
    };
  }

  if (intent.kind === 'cast' || /\b(spell|arcana|channel)\b/i.test(t)) {
    return {
      label: 'Arcana',
      attr: 'INT',
      skill: 'arcana',
      dc: dcForStrictness(13, strict),
      critFailHpRisk: 0,
    };
  }

  if (intent.kind === 'flee' || /\b(sneak|stealth|hide|creep)\b/i.test(t)) {
    return {
      label: 'Stealth',
      attr: 'DEX',
      skill: 'stealth',
      dc: dcForStrictness(12, strict),
      critFailHpRisk: 0,
    };
  }

  if (intent.kind === 'attack') {
    return {
      label: 'Athletics / strike',
      attr: 'STR',
      skill: 'athletics',
      dc: dcForStrictness(12, strict),
      critFailHpRisk: state.activeEncounter ? 2 : 0,
    };
  }

  if (intent.kind === 'search' || intent.kind === 'observe') {
    const lookHard = /\b(search|inspect|examine|rummage|scout)\b/i.test(t);
    return {
      label: lookHard ? 'Investigation' : 'Perception',
      attr: lookHard ? 'INT' : 'WIS',
      skill: lookHard ? 'investigation' : 'perception',
      dc: dcForStrictness(lookHard ? 13 : 12, strict),
      critFailHpRisk: trap && !trap.revealed ? Math.min(trap.damage ?? 0, 2) : 0,
    };
  }

  if (intent.kind === 'move' || /\b(climb|jump|force|bash|lift)\b/i.test(t)) {
    return {
      label: 'Athletics',
      attr: 'STR',
      skill: 'athletics',
      dc: dcForStrictness(12, strict),
      critFailHpRisk: 0,
    };
  }

  if (intent.kind === 'rest') {
    return {
      label: 'Survival',
      attr: 'CON',
      skill: 'survival',
      dc: dcForStrictness(10, strict),
      critFailHpRisk: 0,
    };
  }

  return {
    label: 'General check',
    attr: 'STR',
    skill: 'athletics',
    dc: dcForStrictness(12, strict),
    critFailHpRisk: 0,
  };
}

export function runPlayerCheck(
  state: GameState,
  intent: PlayerIntent,
  actionText: string,
  d20Roll?: number
): PlayerCheckResult {
  const ctx = resolveCheckContext(state, intent, actionText);
  const d20 = d20Roll ?? Math.floor(Math.random() * 20) + 1;
  const modifier =
    attrMod(attrScore(state, ctx.attr)) +
    gearMod(state, ctx.attr) +
    skillBonus(state, ctx.skill) +
    professionBonus(state, ctx.profession);
  const outcome = evaluateRoll(d20, modifier, ctx.dc);
  const narrativeOutcomeLabel = outcome.isSuccess ? 'SUCCESS' : 'FAILURE';
  const codeResolutionText = outcome.isSuccess
    ? `SUCCESS (${ctx.label}: d20 ${d20} + mod ${modifier} = ${outcome.totalScore} vs DC ${ctx.dc})`
    : `FAILURE (${ctx.label}: d20 ${d20} + mod ${modifier} = ${outcome.totalScore} vs DC ${ctx.dc})`;

  return {
    ...outcome,
    d20,
    modifier,
    dc: ctx.dc,
    label: ctx.label,
    attr: ctx.attr,
    skill: ctx.skill,
    codeResolutionText,
    narrativeOutcomeLabel,
  };
}
