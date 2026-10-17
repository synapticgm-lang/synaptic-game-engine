import type { AttributeKey, GameState, ProfessionSkill } from './types';
import { turnRng } from './seededRng';
import type { PlayerIntent } from './intentParser';
import { evaluateRoll, type RollOutcome } from './gameEngine';
import { currentDungeonNode } from './dungeonSeed';
import { difficultyRow } from './difficultyRules';
import { equippedWeaponName } from './ledgerCombat';
import {
  combineAdv,
  conditionCheckAdv,
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
} from './checkRules';
import { calculateSocialModifiers, getOutcomeDescription, socialOutcomeBand } from './socialSkills';
import type { OutcomeBand } from './socialCrisisTypes';
import { leverageCue, socialLeverageMods, type LeverageMod } from './socialLeverage';
import { skillRankOf, type CheckSkillName } from './skillRanks';
import { ladderDc, lightNote, sceneLight, sheetBurden, sightCheck, taskRung, type TaskKind, type TaskRung } from './rules/exploration';
import { paceCheckAdv, travelPaceOf } from './rules/travelPace';
import { exhaustionD20, exhaustionLevel, travelEngineChip, weatherRuleOf } from './rules/travelDay';
import { modeProfile } from './rules/modeProfile';
import { namedSkillCheckMod } from './rules/librarySkills';
import { titleCheckMod } from './rules/titles';
import { toolProficiencies } from './tabletop/characterBuild';

/** SK-4 named tiers. Targets = DC_LADDER easy/medium/hard (Expert/Master capped at hard until SK-5). */
export type SkillTierName = 'Novice' | 'Apprentice' | 'Journeyman' | 'Expert' | 'Master';
export const TIER_TARGET: Record<SkillTierName, number> = {
  Novice: 10,
  Apprentice: 15,
  Journeyman: 20,
  Expert: 20,
  Master: 20,
};
/** Untrained Journeyman+ long-shot odds after a natural 20. Null = no long-shot (use target+5 instead). */
export const LONG_SHOT_ODDS: Record<SkillTierName, number | null> = {
  Novice: null,
  Apprentice: null,
  Journeyman: 1000,
  Expert: 5000,
  Master: 10000,
};
const UNTRAINED_RAISE = 5;

export type CheckSkill = CheckSkillName;

/** VR1 CheckSpec — SRD 5.2.1 (WotC CC BY 4.0): roll only when outcome is uncertain; dcShown false by default. */
export type CheckKind = 'ability' | 'skill' | 'save' | 'contest' | 'attack';
export interface CheckSpec {
  kind: CheckKind;
  ability: AttributeKey;
  skill?: CheckSkill;
  dc: number;
  dcShown: boolean;
  adv: AdvState;
}

export interface CheckContext {
  label: string;
  attr: AttributeKey;
  skill?: CheckSkill;
  profession?: string;
  tool?: string;
  dc: number;
  rung?: TaskRung;
  skillTier?: SkillTierName;
  critFailHpRisk: number;
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
  skippedRoll?: boolean;
  record?: CheckResultRecord;
  displayLine?: string;
  socialBand?: OutcomeBand;
}

const CONTESTED_SOCIAL =
  /\b(persuade|negotiate|intimidate|convince|bargain|bribe|lie|deceive|bluff|threaten|coerce|demand|force\s+(?:them|him|her|it)|bend\s+the\s+knee|swear|oath|pact|contract|bind)\b/i;

const MATERIAL_AID_ASK =
  /\b(currency|gold|coin|coins|money|pay|lend|hire|guide|escort|gear|weapon|supplies|ration|rations)\b/i;

export function isContestedSocialAction(intent: PlayerIntent, actionText: string): boolean {
  if (intent.kind === 'refuse') return true;
  const t = actionText.toLowerCase();
  if (CONTESTED_SOCIAL.test(t)) return true;
  return MATERIAL_AID_ASK.test(t) && /\b(give|can you|could you|would you|please|ask|request|need|want)\b/i.test(t);
}

function attrScore(state: GameState, key: AttributeKey): number {
  if (key === 'STR' && state.character.strength != null) return state.character.strength;
  return state.character.attributes?.[key] ?? 10;
}
function attrMod(score: number): number { return Math.floor((score - 10) / 2); }
function gearMod(state: GameState, key: AttributeKey): number {
  let bonus = 0;
  for (const item of state.inventory) {
    if (item.equipped && item.modifiers) bonus += item.modifiers[key] ?? 0;
  }
  return bonus;
}

const SRD_CHECK_SKILL: Record<string, string> = {
  athletics: 'Athletics', perception: 'Perception', investigation: 'Investigation', stealth: 'Stealth',
  thievery: 'Sleight of Hand', persuasion: 'Persuasion', arcana: 'Arcana', survival: 'Survival',
};

/** Pure check preview (no roll). Null when SRD says no roll. */
export function checkForAction(state: GameState, intent: PlayerIntent, actionText: string): CheckSpec | null {
  const ctx = resolveCheckContext(state, intent, actionText);
  if (ctx.autoSucceed || ctx.dc <= 0) return null;
  return {
    kind: intent.kind === 'attack' ? 'attack' : intent.kind === 'flee' ? 'contest' : ctx.skill ? 'skill' : 'ability',
    ability: ctx.attr, skill: ctx.skill, dc: ctx.dc, dcShown: false, adv: 'normal',
  };
}

export function sheetSkillBonus(character: GameState['character'], skill: string): number {
  const s = character.srd;
  if (!s || !s.skillProfs.includes(skill)) return 0;
  const pb = proficiencyBonus(character.level);
  return s.expertise.includes(skill) ? pb * 2 : pb;
}

function skillBonus(state: GameState, skill?: CheckSkill, tool?: string): number {
  if (state.character.srd && tool) {
    const want = tool.toLowerCase();
    const tools = toolProficiencies(state.character);
    let have = false;
    for (let i = 0; i < tools.length; i++) {
      if (tools[i]!.toLowerCase() === want) { have = true; break; }
    }
    return have ? proficiencyBonus(state.character.level) : 0;
  }
  if (!skill) return 0;
  if (state.character.srd) return SRD_CHECK_SKILL[skill] ? sheetSkillBonus(state.character, SRD_CHECK_SKILL[skill]) : 0;
  const rank = skillRankOf(state.character, skill);
  if (rank <= 0) return 0;
  const pb = proficiencyBonus(state.character.level);
  return rank >= 2 ? pb * 2 : pb;
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

function sheetExtras(state: GameState): boolean {
  return state.engineMode === 'dnd' && !!state.character.srd;
}

export function skillCheckMods(
  state: GameState,
  attr: AttributeKey,
  skill?: CheckSkill,
  tool?: string,
): CheckMod[] {
  const prof = skillBonus(state, skill, tool);
  const mods: CheckMod[] = [
    { label: attr, value: attrMod(attrScore(state, attr)) },
    { label: 'gear', value: gearMod(state, attr) },
    { label: tool ?? skill ?? 'skill', value: prof },
  ];
  const tired = exhaustionLevel(state.character);
  if (tired) mods.push({ label: `exhaustion ${tired}`, value: exhaustionD20(state.character) });
  return mods;
}

function taskDc(
  state: GameState,
  kind: TaskKind,
): { dc: number; rung: TaskRung; skillTier?: SkillTierName } {
  const rung = taskRung(state, kind);
  if (state.engineMode === 'dnd') return { dc: ladderDc(rung, state.gmStrictness), rung };
  const skillTier: SkillTierName =
    rung === 'nearly impossible' ? 'Master'
      : rung === 'very hard' ? 'Expert'
        : rung === 'hard' ? 'Journeyman'
          : rung === 'medium' ? 'Apprentice'
            : 'Novice';
  return { dc: TIER_TARGET[skillTier], rung, skillTier };
}

export function resolveCheckContext(
  state: GameState,
  intent: PlayerIntent,
  actionText: string
): CheckContext {
  const t = actionText.toLowerCase();
  const j = state.journey;
  if (j && j.legsDone < j.legsTotal && travelEngineChip(actionText)) {
    return { label: 'Travel', attr: 'WIS', skill: 'survival', dc: 0, critFailHpRisk: 0, autoSucceed: true };
  }
  const node = currentDungeonNode(state.activeDungeon);
  const trap = node?.hidden?.traps.find((tr) => !tr.disarmed);
  if (/\b(pick\s+lock|lockpick|disarm|disable\s+trap|jimmy)\b/i.test(t) || intent.kind === 'search' && /\block|trap|chest|cache\b/i.test(t)) {
    // LK-1: lootable / door lock stamps dc + tier when present (shared SkillGate fields).
    const lootables = node?.hidden?.lootables ?? [];
    const closed: typeof lootables = [];
    let namedLoot: (typeof lootables)[0] | undefined;
    for (let i = 0; i < lootables.length; i++) {
      const l = lootables[i]!;
      if (l.opened || !l.lock) continue;
      closed.push(l);
      if (!namedLoot && t.includes(l.label.toLowerCase())) namedLoot = l;
    }
    const gate = namedLoot?.lock ?? closed[0]?.lock ?? node?.hidden?.doorLock;
    const fromGate = gate
      ? {
          dc: gate.dc ?? (state.engineMode === 'dnd' ? 15 : TIER_TARGET[(gate.tier as SkillTierName) || 'Apprentice']),
          rung: 'medium' as TaskRung,
          ...(state.engineMode !== 'dnd'
            ? { skillTier: ((gate.tier as SkillTierName) || 'Apprentice') as SkillTierName }
            : {}),
        }
      : null;
    const lock = fromGate
      ?? (trap?.dc != null
        ? { dc: trap.dc, rung: 'medium' as TaskRung, ...(state.engineMode !== 'dnd' ? { skillTier: 'Apprentice' as SkillTierName } : {}) }
        : taskDc(state, 'lock'));
    return {
      label: 'Thievery / lock',
      attr: 'DEX',
      skill: 'thievery',
      tool: state.engineMode === 'dnd' ? "Thieves' Tools" : undefined,
      profession: 'Engineering',
      ...lock,
      critFailHpRisk: trap?.damage ?? 0,
    };
  }

  if (intent.kind === 'talk' || intent.kind === 'refuse' || CONTESTED_SOCIAL.test(t)) {
    if (!isContestedSocialAction(intent, actionText)) {
      return { label: 'Dialogue', attr: 'CHA', skill: 'persuasion', dc: 0, critFailHpRisk: 0, autoSucceed: true };
    }
    return {
      label: intent.kind === 'refuse' ? 'Refuse / protest' : 'Social', attr: 'CHA', skill: 'persuasion',
      ...(intent.kind === 'refuse' ? taskDc(state, 'refuse') : taskDc(state, requestSize(actionText) === 'risky' ? 'social-risky' : 'social-minor')),
      critFailHpRisk: 0,
    };
  }
  if (intent.kind === 'cast' || /\b(spell|arcana|channel)\b/i.test(t)) {
    return { label: 'Arcana', attr: 'INT', skill: 'arcana', ...taskDc(state, 'arcana'), critFailHpRisk: 0 };
  }
  if (intent.kind === 'flee' || /\b(sneak|stealth|hide|creep)\b/i.test(t)) {
    return { label: 'Stealth', attr: 'DEX', skill: 'stealth', ...taskDc(state, 'stealth'), critFailHpRisk: 0 };
  }
  if (intent.kind === 'attack') {
    return { label: 'Athletics / strike', attr: 'STR', skill: 'athletics', ...taskDc(state, 'strike'), critFailHpRisk: state.activeEncounter ? 2 : 0 };
  }
  if (intent.kind === 'search' || intent.kind === 'observe') {
    const lookHard = /\b(search|inspect|examine|rummage|scout)\b/i.test(t);
    // Tabletop casual look: no uncertainty (SRD 5.2.1). LitRPG/RPG keep the roll.
    if (state.engineMode === 'dnd' && intent.kind === 'observe' && !lookHard) {
      return { label: 'Perception', attr: 'WIS', skill: 'perception', dc: 0, critFailHpRisk: 0, autoSucceed: true };
    }
    return {
      label: lookHard ? 'Investigation' : 'Perception', attr: lookHard ? 'INT' : 'WIS',
      skill: lookHard ? 'investigation' : 'perception', ...taskDc(state, lookHard ? 'search' : 'notice'),
      critFailHpRisk: trap && !trap.revealed ? Math.min(trap.damage ?? 0, 2) : 0,
    };
  }
  const athletic = /\b(climb|jump|force|bash|lift)\b/i;
  if (intent.kind === 'move' || athletic.test(t)) {
    if (state.engineMode === 'dnd' && intent.kind === 'move' && !athletic.test(t)) {
      return { label: 'Travel', attr: 'STR', skill: 'athletics', dc: 0, critFailHpRisk: 0, autoSucceed: true };
    }
    return { label: 'Athletics', attr: 'STR', skill: 'athletics', ...taskDc(state, 'athletics'), critFailHpRisk: 0 };
  }
  if (intent.kind === 'rest') {
    return { label: 'Survival', attr: 'CON', skill: 'survival', ...taskDc(state, 'survival'), critFailHpRisk: 0 };
  }
  return { label: 'General check', attr: 'STR', skill: 'athletics', ...taskDc(state, 'general'), critFailHpRisk: 0 };
}

export function runPlayerCheck(
  state: GameState,
  intent: PlayerIntent,
  actionText: string,
  d20Roll?: number,
  /** When the SK-4 long-shot fires: a 1-based roll from 1..odds (1 = success). */
  longShotRoll?: number,
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
      codeResolutionText: `SUCCESS (${ctx.label} — no contested check)`,
      narrativeOutcomeLabel: 'SUCCESS',
      skippedRoll: true,
    };
  }
  // SK-4: LitRPG / Story RPG retarget from skill level (trained / untrained+5 / long-shot).
  let longShotOdds: number | null = null;
  if (state.engineMode !== 'dnd' && ctx.skillTier && ctx.skill) {
    const trained = skillRankOf(state.character, ctx.skill) >= 1;
    const odds = LONG_SHOT_ODDS[ctx.skillTier];
    if (trained) {
      ctx.dc = TIER_TARGET[ctx.skillTier];
    } else if (odds != null) {
      ctx.dc = TIER_TARGET[ctx.skillTier];
      longShotOdds = odds;
    } else {
      ctx.dc = TIER_TARGET[ctx.skillTier] + UNTRAINED_RAISE;
    }
  }
  // 28c — named modifiers, disposition (social) and weapon familiarity (attack), one result record.
  const mods: CheckMod[] = [
    ...skillCheckMods(state, ctx.attr, ctx.skill, ctx.tool),
    { label: 'profession', value: professionBonus(state, ctx.profession) },
  ];
  const row = difficultyRow(state.gmStrictness);
  let adv: AdvState = 'normal';
  const named = namedSkillCheckMod(state, actionText, intent.kind);
  if (named) {
    mods.push({ label: named.label, value: named.value });
    if (named.advantage) adv = 'advantage';
  }
  const title = titleCheckMod(state, ctx.skill, named ? named.value : 0, intent.kind);
  if (title) mods.push(title);
  let auto: 'willing' | 'unwilling' | undefined;
  let cue: string | undefined;
  const social = ctx.attr === 'CHA' && ctx.skill === 'persuasion';
  let leverage: LeverageMod[] = [];
  if (social) {
    const target = socialTarget(state, actionText);
    if (target) {
      const s = DISPOSITION_SOCIAL[target.disposition];
      const size = requestSize(actionText);
      adv = combineAdv(adv, s.adv);
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
  // Conditions change checks in every mode (SRD 5.2.1 condition table).
  adv = combineAdv(adv, conditionCheckAdv(state.character.conditions));
  // The task's rung, plus (tabletop sheet) what light, load and the travel pace did to the roll.
  const notes: string[] = ctx.rung && modeProfile(state.engineMode).numbers === 'open' ? [ctx.rung] : [];
  // Weather on the road (SRD 5.2.1 Heavy Precipitation / fog: Lightly Obscured, Disadvantage on Perception).
  const weather = state.journey && state.journey.legsDone < state.journey.legsTotal ? state.journey.weather : undefined;
  if (ctx.skill === 'perception' && weatherRuleOf(weather).perception) {
    adv = combineAdv(adv, weatherRuleOf(weather).perception!);
    notes.push(weather!);
  }
  if (sheetExtras(state)) {
    const burden = sheetBurden(state, ctx.attr);
    if (burden) {
      adv = combineAdv(adv, 'disadvantage');
      notes.push(burden);
    }
    const pace = paceCheckAdv(state, ctx.skill);
    if (pace !== 'normal') {
      adv = combineAdv(adv, pace);
      notes.push(`${travelPaceOf(state, state.journey?.terrain)} pace`);
    }
    if (ctx.skill === 'perception') {
      const light = sceneLight(state);
      const sight = sightCheck(light);
      if (sight !== 'normal') notes.push(lightNote(light));
      if (sight === 'disadvantage') adv = combineAdv(adv, 'disadvantage');
      if (sight === 'blind') {
        const label = `${ctx.label} (${notes.join('; ')})`;
        return {
          totalScore: 0,
          margin: 0,
          isSuccess: false,
          isCriticalSuccess: false,
          isCriticalFailure: false,
          d20: 0,
          modifier: 0,
          dc: ctx.dc,
          label: ctx.label,
          attr: ctx.attr,
          skill: ctx.skill,
          codeResolutionText: `FAILURE (${ctx.label}: no roll, the PC cannot see)`,
          narrativeOutcomeLabel: 'FAILURE',
          skippedRoll: false,
          displayLine: `${label}: no roll — failure`,
        };
      }
    }
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
    label: notes.length ? `${ctx.label} (${notes.join('; ')})` : ctx.label,
    mods,
    dc: ctx.dc,
    adv,
    auto,
    cue,
    d20s: d20Roll != null ? [d20Roll] : undefined,
    rng: turnRng(state, 'check', ctx.label),
  });
  record.spec = {
    kind: intent.kind === 'attack' ? 'attack' : intent.kind === 'flee' ? 'contest' : ctx.skill ? 'skill' : 'ability',
    ability: ctx.attr, skill: ctx.skill, dc: ctx.dc, dcShown: false, adv,
  };
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
  let outcome = evaluateRoll(d20, modifier, ctx.dc);
  let longShotNote = '';
  // SK-4 untrained Journeyman+: only a natural 20, then 1-in-odds, succeeds (mods do not bypass).
  if (longShotOdds != null) {
    if (d20 !== 20) {
      outcome = { ...outcome, isSuccess: false, isCriticalSuccess: false, isCriticalFailure: d20 === 1, totalScore: d20 + modifier, margin: d20 + modifier - ctx.dc };
      longShotNote = `; long-shot needs natural 20`;
    } else {
      const rng = turnRng(state, 'check', ctx.label, 'long-shot');
      const roll = longShotRoll != null ? longShotRoll : Math.floor(rng() * longShotOdds) + 1;
      const ok = roll === 1;
      outcome = { ...outcome, isSuccess: ok, isCriticalSuccess: ok, isCriticalFailure: false, totalScore: 20 + modifier, margin: ok ? 1 : -1 };
      longShotNote = ok
        ? `; long-shot 1 in ${longShotOdds} — success`
        : `; long-shot 1 in ${longShotOdds} — failure`;
      record.outcome = ok ? 'success' : 'failure';
    }
  }
  const narrativeOutcomeLabel = outcome.isSuccess ? 'SUCCESS' : 'FAILURE';
  const socialBand = social ? socialOutcomeBand(d20, outcome.totalScore - ctx.dc) : undefined;
  const bandTail = socialBand ? ` — ${getOutcomeDescription(socialBand)}` : '';
  const leverageTail = leverage.length ? ` — leverage: ${leverage.map((m) => m.note).join(' ')}` : '';
  const codeResolutionText = outcome.isSuccess
    ? `SUCCESS (${ctx.label}: d20 ${d20} + ${modifier} = ${outcome.totalScore} vs DC ${ctx.dc}${longShotNote})${bandTail}${leverageTail}`
    : `FAILURE (${ctx.label}: d20 ${d20} + ${modifier} = ${outcome.totalScore} vs DC ${ctx.dc}${longShotNote})${bandTail}${leverageTail}`;

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
    displayLine: longShotNote ? `${formatCheckRecord(record, state.engineMode)}${longShotNote}` : displayLine,
  };
}
