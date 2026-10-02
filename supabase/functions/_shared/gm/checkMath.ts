import type { AttributeKey, GameState, GmStrictness, ProfessionSkill } from './types.ts';
import type { PlayerIntent } from './intentParser.ts';
import { evaluateRoll, type RollOutcome } from './gameEngine.ts';
import { currentDungeonNode } from './dungeonSeed.ts';
import { difficultyRow } from './difficultyRules.ts';
import { equippedWeaponName } from './ledgerCombat.ts';
import {
  DISPOSITION_SOCIAL,
  dispositionCue,
  familiarityCue,
  familiarityTier,
  familiarityToHit,
  formatCheckRecord,
  proficiencyBonus,
  requestSize,
  resolveCheckRecord,
  socialTarget,
  weaponCategory,
  weaponFamiliarityScore,
  type AdvState,
  type CheckMod,
  type CheckResultRecord,
} from './checkRules.ts';
import { calculateSocialModifiers, getOutcomeDescription, socialOutcomeBand } from './socialSkills.ts';
import type { OutcomeBand } from './socialCrisisTypes.ts';
import { leverageCue, socialLeverageMods, type LeverageMod } from './socialLeverage.ts';
import { skillRankOf, type CheckSkillName } from './skillRanks.ts';

export type CheckSkill = CheckSkillName;

export interface CheckContext {
  label: string;
  attr: AttributeKey;
  skill?: CheckSkill;
  profession?: string;
  dc: number;
  /** Optional sticky cost on crit fail when fiction warrants (trap room, combat). */
  critFailHpRisk: number;
  /** Informational dialogue — no contested stake; do not roll. */
  autoSucceed?: boolean;
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
  /** True when casual talk skipped the Social d20. */
  skippedRoll?: boolean;
  /** 28c — the one engine result record (dice, named mods, adv state, outcome). */
  record?: CheckResultRecord;
  /** 28c — player-facing line: D&D full maths, LitRPG outcome only. */
  displayLine?: string;
  /** 28q — five-band social outcome (partial = achieved with a cost). */
  socialBand?: OutcomeBand;
}

const CONTESTED_SOCIAL =
  /\b(persuade|negotiate|intimidate|convince|bargain|bribe|lie|deceive|bluff|threaten|coerce|demand|force\s+(?:them|him|her|it)|bend\s+the\s+knee|swear|oath|pact|contract|bind)\b/i;

const MATERIAL_AID_ASK =
  /\b(currency|gold|coin|coins|money|pay|lend|hire|guide|escort|gear|weapon|supplies|ration|rations)\b/i;

/** Contested Social stakes only — not every spoken line. */
export function isContestedSocialAction(intent: PlayerIntent, actionText: string): boolean {
  if (intent.kind === 'refuse') return true;
  const t = actionText.toLowerCase();
  if (CONTESTED_SOCIAL.test(t)) return true;
  // Asking for material aid / personnel is contested; clarifying questions are not.
  if (MATERIAL_AID_ASK.test(t) && /\b(give|can you|could you|would you|please|ask|request|need|want)\b/i.test(t)) {
    return true;
  }
  return false;
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
  return skillRankOf(state.character, skill);
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
  // 28c — the shared difficulty table (difficultyRules) owns the DC shift (Easy −2, min 8; Hard +2).
  const shift = difficultyRow(strictness).checkDcShift;
  return shift < 0 ? Math.max(8, base + shift) : base + shift;
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

  if (intent.kind === 'talk' || intent.kind === 'refuse' || CONTESTED_SOCIAL.test(t)) {
    if (!isContestedSocialAction(intent, actionText)) {
      return {
        label: 'Dialogue',
        attr: 'CHA',
        skill: 'persuasion',
        dc: 0,
        critFailHpRisk: 0,
        autoSucceed: true,
      };
    }
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
  if (ctx.autoSucceed || ctx.dc <= 0) {
    return {
      d20: 20,
      modifier: 0,
      totalScore: 20,
      margin: 20,
      dc: 0,
      isSuccess: true,
      isCriticalSuccess: false,
      isCriticalFailure: false,
      label: ctx.label,
      attr: ctx.attr,
      skill: ctx.skill,
      codeResolutionText: 'SUCCESS (Dialogue — no contested check)',
      narrativeOutcomeLabel: 'SUCCESS',
      skippedRoll: true,
    };
  }
  // 28c — named modifiers, disposition (social) and weapon familiarity (attack), one result record.
  const mods: CheckMod[] = [
    { label: ctx.attr, value: attrMod(attrScore(state, ctx.attr)) },
    { label: 'gear', value: gearMod(state, ctx.attr) },
    { label: ctx.skill ?? 'skill', value: skillBonus(state, ctx.skill) },
    { label: 'profession', value: professionBonus(state, ctx.profession) },
  ];
  const row = difficultyRow(state.gmStrictness);
  let adv: AdvState = 'normal';
  let auto: 'willing' | 'unwilling' | undefined;
  let cue: string | undefined;
  const social = ctx.attr === 'CHA' && ctx.skill === 'persuasion';
  let leverage: LeverageMod[] = [];
  if (social) {
    const target = socialTarget(state, actionText);
    if (target) {
      const s = DISPOSITION_SOCIAL[target.disposition];
      const size = requestSize(actionText);
      adv = s.adv;
      const flat = s.flat < 0 && row.socialRemoveHostilePenalty ? 0 : s.flat;
      mods.push({ label: `${target.disposition} (${target.name})`, value: flat });
      // Skill + relationship already come from skillBonus + disposition.
      const sm = calculateSocialModifiers('persuasion', target.name, state, {});
      if (sm.faction) mods.push({ label: 'faction standing', value: sm.faction });
      if (sm.leverage) mods.push({ label: 'leverage', value: sm.leverage });
      if (s.willing.includes(size)) auto = 'willing';
      else if (s.unwilling.includes(size)) auto = 'unwilling';
      cue = dispositionCue(target.name, target.disposition);
    }
    // 28r — knowledge, shown items, worn gear vs the target's role, stat/skill leverage.
    leverage = socialLeverageMods(state, actionText, target?.name);
    for (const m of leverage) mods.push({ label: m.label, value: m.value });
    cue = cue ?? leverageCue(leverage);
    // Strong leverage reopens a flat refusal to a roll; strong offence takes a free yes back to a roll.
    const leverageSum = leverage.reduce((s, m) => s + m.value, 0);
    if (auto === 'unwilling' && leverageSum >= 3) auto = undefined;
    else if (auto === 'willing' && leverageSum <= -3) auto = undefined;
  }
  if (intent.kind === 'attack' && state.activeEncounter) {
    const cat = weaponCategory(equippedWeaponName(state));
    const score = weaponFamiliarityScore(state, cat);
    const tier = familiarityTier(score);
    mods.push({ label: `${tier} ${cat}`, value: familiarityToHit(score, proficiencyBonus(state.character.level)) });
    mods.push({ label: `${row.label} difficulty`, value: row.playerToHitBonus });
    cue = familiarityCue(tier);
  }
  const record = resolveCheckRecord({
    label: ctx.label,
    mods,
    dc: ctx.dc,
    adv,
    auto,
    cue,
    d20s: d20Roll != null ? [d20Roll] : undefined,
  });
  const displayLine = formatCheckRecord(record, state.engineMode);
  if (record.auto) {
    const ok = record.outcome === 'success';
    return {
      totalScore: 0,
      margin: 0,
      isSuccess: ok,
      isCriticalSuccess: false,
      isCriticalFailure: false,
      d20: 0,
      modifier: 0,
      dc: ctx.dc,
      label: ctx.label,
      attr: ctx.attr,
      skill: ctx.skill,
      codeResolutionText: `${ok ? 'SUCCESS' : 'FAILURE'} (${ctx.label}: ${record.auto}, no roll)`,
      narrativeOutcomeLabel: ok ? 'SUCCESS' : 'FAILURE',
      skippedRoll: false,
      record,
      displayLine,
    };
  }
  const d20 = record.kept;
  const modifier = record.total - record.kept;
  const outcome = evaluateRoll(d20, modifier, ctx.dc);
  const narrativeOutcomeLabel = outcome.isSuccess ? 'SUCCESS' : 'FAILURE';
  const socialBand = social ? socialOutcomeBand(d20, outcome.totalScore - ctx.dc) : undefined;
  const bandTail = socialBand ? ` — ${getOutcomeDescription(socialBand)}` : '';
  const leverageTail = leverage.length ? ` — leverage: ${leverage.map((m) => m.note).join(' ')}` : '';
  const codeResolutionText = outcome.isSuccess
    ? `SUCCESS (${ctx.label}: d20 ${d20} + mod ${modifier} = ${outcome.totalScore} vs DC ${ctx.dc})${bandTail}${leverageTail}`
    : `FAILURE (${ctx.label}: d20 ${d20} + mod ${modifier} = ${outcome.totalScore} vs DC ${ctx.dc})${bandTail}${leverageTail}`;

  return {
    ...outcome,
    socialBand,
    d20,
    modifier,
    dc: ctx.dc,
    label: ctx.label,
    attr: ctx.attr,
    skill: ctx.skill,
    codeResolutionText,
    narrativeOutcomeLabel,
    skippedRoll: false,
    record,
    displayLine,
  };
}
