/**
 * T10SOC — use-based social skills (LitRPG + RPG only).
 *
 * Classifies a real social skill attempt from the same intent reader chips/free text
 * already use (parsePlayerSteps). Engine-only d20 vs a resistance DC; odds-scaled skill XP
 * feeds per-skill levels only (never character / sandboxXp).
 *
 * Intentional vs Skyrim/KCD: payout scales with success unlikelihood (odds-scaled), not flat
 * per use; failures still earn a small sliver.
 */

import type { GameState, NpcMemory } from './types';
import {
  parsePlayerSteps,
  sheetContextFromState,
  type IntentStep,
} from './intentParser';
import { peopleHere, mentionsName } from './scenePresence';
import { resolveCheckRecord, type CheckMod, type CheckResultRecord } from './checkRules';
import { turnRng } from './seededRng';
import { socialLeverageMods } from './socialLeverage';
import { ensurePersona, nudgePersona, socialShift, type PersonaEventTag } from './npcPersona';
import type { SocialProgressionState } from './socialProgression';

/** The four use-based skills (Barter is distinct from Persuasion). */
export type UseSocialSkill = 'deception' | 'persuasion' | 'barter' | 'intimidation';

export const USE_SOCIAL_SKILLS: readonly UseSocialSkill[] = [
  'deception',
  'persuasion',
  'barter',
  'intimidation',
] as const;

export interface UseSkillProgress {
  level: number;
  xp: number;
}

export type UseSkillProgressMap = Record<UseSocialSkill, UseSkillProgress>;

/** One table for XP / level / bonus / odds payout. */
export const SOCIAL_USE_TABLE = {
  /** Base used in successXp = round(BASE * (1 - p)). */
  BASE: 12,
  SUCCESS_FLOOR: 2,
  SUCCESS_CAP: 18,
  /** Failure sliver ≈ this fraction of a coin-flip (p=0.5) success payout. */
  FAILURE_SLIVER_RATIO: 0.2,
  LEVEL_CAP: 20,
  /** +1 roll bonus per this many levels. */
  LEVELS_PER_BONUS: 2,
  BONUS_CAP: 10,
  /** Starting level on fresh / migrated saves. */
  START_LEVEL: 0,
  /** XP needed to advance from `level` → level+1. */
  xpToNext(level: number): number {
    return 40 + Math.max(0, level) * 25;
  },
} as const;

export interface SocialSkillAttempt {
  skill: UseSocialSkill;
  target: string;
  clause: string;
  step: IntentStep;
}

export interface SocialSkillResolveOpts {
  /** Force the d20 face (tests). */
  d20?: number;
  rng?: () => number;
}

export interface SocialSkillResolveResult {
  skill: UseSocialSkill;
  target: string;
  record: CheckResultRecord;
  bonus: number;
  /** Engine success probability for this roll (bonus vs DC, normal d20). */
  p: number;
  success: boolean;
  longShot: boolean;
  xpGained: number;
  skillAfter: UseSkillProgress;
  leveledUp: boolean;
  /** Writer-facing consequence (already-shown convention). */
  fact: string;
  receipt: string;
  state: GameState;
}

function emptySkills(): UseSkillProgressMap {
  const start = SOCIAL_USE_TABLE.START_LEVEL;
  return {
    deception: { level: start, xp: 0 },
    persuasion: { level: start, xp: 0 },
    barter: { level: start, xp: 0 },
    intimidation: { level: start, xp: 0 },
  };
}

/** Migrate old SocialProgressionState → four use-skill tracks (defaults; never break 28q ledger). */
export function ensureUseSkillProgress(
  progression: SocialProgressionState | null | undefined,
): UseSkillProgressMap {
  const base = emptySkills();
  const raw = progression?.useSkills;
  if (!raw || typeof raw !== 'object') return base;
  for (const skill of USE_SOCIAL_SKILLS) {
    const row = raw[skill];
    if (!row) continue;
    const level = Math.max(0, Math.min(SOCIAL_USE_TABLE.LEVEL_CAP, Math.floor(Number(row.level) || 0)));
    const xp = Math.max(0, Math.floor(Number(row.xp) || 0));
    base[skill] = { level, xp };
  }
  return base;
}

export function skillRollBonus(level: number): number {
  const raw = Math.floor(Math.max(0, level) / SOCIAL_USE_TABLE.LEVELS_PER_BONUS);
  return Math.min(SOCIAL_USE_TABLE.BONUS_CAP, raw);
}

/** p = chance total >= DC on a fair d20 with the given bonus (clamped). */
export function successProbability(bonus: number, dc: number): number {
  const need = dc - bonus;
  if (need <= 1) return 0.95;
  if (need > 20) return 0.05;
  return Math.max(0.05, Math.min(0.95, (21 - need) / 20));
}

export function successXpForOdds(p: number): number {
  const raw = Math.round(SOCIAL_USE_TABLE.BASE * (1 - p));
  return Math.max(SOCIAL_USE_TABLE.SUCCESS_FLOOR, Math.min(SOCIAL_USE_TABLE.SUCCESS_CAP, raw));
}

export function failureXpSliver(): number {
  const coinFlip = successXpForOdds(0.5);
  return Math.max(1, Math.round(coinFlip * SOCIAL_USE_TABLE.FAILURE_SLIVER_RATIO));
}

function applySkillXp(progress: UseSkillProgress, gained: number): { after: UseSkillProgress; leveledUp: boolean } {
  let level = progress.level;
  let xp = progress.xp + gained;
  let leveledUp = false;
  while (level < SOCIAL_USE_TABLE.LEVEL_CAP && xp >= SOCIAL_USE_TABLE.xpToNext(level)) {
    xp -= SOCIAL_USE_TABLE.xpToNext(level);
    level += 1;
    leveledUp = true;
  }
  if (level >= SOCIAL_USE_TABLE.LEVEL_CAP) {
    level = SOCIAL_USE_TABLE.LEVEL_CAP;
    xp = Math.min(xp, SOCIAL_USE_TABLE.xpToNext(level) - 1);
  }
  return { after: { level, xp }, leveledUp };
}

function findMemory(state: GameState, who: string): NpcMemory | undefined {
  const n = who.trim().toLowerCase();
  if (!n) return undefined;
  return (state.npcMemories ?? []).find(
    (m) => (m.npcName ?? '').toLowerCase().includes(n) || n.includes((m.npcName ?? '').toLowerCase()),
  );
}

function targetIsPresent(state: GameState, who: string | null | undefined): who is string {
  const name = (who ?? '').trim();
  if (!name) return false;
  return peopleHere(state).some((p) => mentionsName(p, name) || mentionsName(name, p));
}

/**
 * Map an intent step → use-skill. Reuses intent actions only (no GM-prose guess,
 * no per-NPC patches). Negotiate (already classified as persuade) + trade/buy → Barter.
 */
export function useSkillFromStep(step: IntentStep): UseSocialSkill | null {
  const clause = (step.clause ?? '').trim();
  if (step.action === 'deceive') return 'deception';
  if (step.action === 'intimidate') return 'intimidation';
  if (step.action === 'buy') return 'barter';
  if (step.action === 'deal' && (step.deal?.kind === 'trade' || step.deal?.kind === 'favour')) {
    return 'barter';
  }
  if (step.action === 'persuade') {
    // Same negotiate/parley gate the intent reader already uses for persuade.
    if (/\bparley\b|\btalk\s+(?:it|them)\s+down\b|\bnegotiate\b/i.test(clause)) return 'barter';
    return 'persuasion';
  }
  // Threatening tone with an addressee (knife/blade threats upgraded to intimidate in the parser).
  if (step.tone === 'threatening' && (step.addressee || step.target)) return 'intimidation';
  return null;
}

/**
 * One owner: classify a real social skill attempt from player input.
 * Small talk / plain ask / greetings / absent targets → null (xp 0, no roll, no receipt).
 */
export function classifySocialSkillAttempt(
  state: GameState,
  playerInput: string,
): SocialSkillAttempt | null {
  const mode = state.engineMode;
  if (mode !== 'litrpg' && mode !== 'rpg') return null;

  // Seat list = peopleHere (same owner writer/chips use). Build a fresh IntentSheetContext —
  // never assign `.present` (AST single-writer guards that name for sceneFacts only).
  const baseCtx = sheetContextFromState(state);
  const here = peopleHere(state);
  const ctx = {
    people: baseCtx.people,
    places: baseCtx.places,
    items: baseCtx.items,
    lastAddressee: baseCtx.lastAddressee,
    present: here,
  };
  const read = parsePlayerSteps(playerInput, ctx);
  for (const step of read.steps) {
    const skill = useSkillFromStep(step);
    if (!skill) continue;
    const target = (step.addressee ?? step.target ?? '').trim();
    if (!targetIsPresent(state, target)) continue;
    return {
      skill,
      target,
      clause: (step.clause ?? playerInput).trim(),
      step,
    };
  }
  return null;
}

/**
 * Resistance DC from existing NPC fields (disposition / role / persona socialShift).
 * Deception → insight-ish; Persuasion/Barter → stubbornness; Intimidation → resolve.
 */
export function resistanceDc(
  state: GameState,
  skill: UseSocialSkill,
  target: string,
): number {
  const mem = findMemory(state, target);
  const disp = (mem?.disposition ?? mem?.attitude ?? 'neutral') as string;
  let dc = 12;
  if (disp === 'hostile') dc += 3;
  else if (disp === 'unknown') dc += 1;
  else if (disp === 'friendly') dc -= 1;
  else if (disp === 'allied' || disp === 'romanced') dc -= 2;

  const role = `${mem?.roleHint ?? ''} ${mem?.sheet?.job ?? ''}`.toLowerCase();
  if (skill === 'deception') {
    // Insight / Perception style — honest / priest / guard harder to fool.
    if (/\b(priest|guard|watch|inspector|warden|clerk)\b/.test(role)) dc += 2;
    dc += 1; // slight insight floor
  } else if (skill === 'intimidation') {
    // Resolve / courage — guards / soldiers hold; fear already high is not stored as a score.
    if (/\b(guard|soldier|knight|captain|warden|militia)\b/.test(role)) dc += 2;
    if (/\b(merchant|clerk|innkeep|child)\b/.test(role)) dc -= 1;
  } else if (skill === 'barter') {
    if (/\b(merchant|vendor|broker|trader|shopkeep|quartermaster)\b/.test(role)) dc += 2;
  } else {
    // Persuasion — stubborn roles.
    if (/\b(elder|captain|magistrate|steward|priest)\b/.test(role)) dc += 1;
  }

  const shift = mem ? socialShift(state, ensurePersona(state, mem)) : 0;
  dc = Math.max(8, Math.min(20, dc + shift));
  return dc;
}

function skillLabel(skill: UseSocialSkill): string {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

function consequenceFact(skill: UseSocialSkill, target: string, success: boolean): string {
  const shown = '[already shown; do not restate — write the consequence]';
  if (skill === 'deception') {
    return success
      ? `${shown} ${target} believes you.`
      : `${shown} ${target} sees through you.`;
  }
  if (skill === 'persuasion') {
    return success
      ? `${shown} ${target} is swayed.`
      : `${shown} ${target} refuses.`;
  }
  if (skill === 'barter') {
    return success
      ? `${shown} ${target} drops the price.`
      : `${shown} ${target} holds or raises the price.`;
  }
  return success
    ? `${shown} ${target} yields under the threat.`
    : `${shown} ${target} does not yield; disposition worsens.`;
}

function personaTagFor(skill: UseSocialSkill, success: boolean): PersonaEventTag | null {
  if (skill === 'deception' && !success) return 'lied_caught';
  if (skill === 'intimidation') return 'threatened';
  if (skill === 'persuasion' && success) return 'helped';
  if (skill === 'barter' && success) return 'bought';
  if (skill === 'persuasion' && !success) return 'insulted';
  return null;
}

/**
 * Resolve one attempt: engine d20 + skill bonus + leverage/disposition vs resistance DC;
 * award per-skill XP; write consequence fact; nudge disposition via existing persona owner.
 */
export function resolveSocialSkillAttempt(
  state: GameState,
  attempt: SocialSkillAttempt,
  opts: SocialSkillResolveOpts = {},
): SocialSkillResolveResult {
  const progression = state.arcDirector?.socialProgression;
  const skills = ensureUseSkillProgress(progression);
  const before = skills[attempt.skill];
  const bonus = skillRollBonus(before.level);
  const dc = resistanceDc(state, attempt.skill, attempt.target);
  const p = successProbability(bonus, dc);

  const mods: CheckMod[] = [];
  if (bonus !== 0) mods.push({ label: skillLabel(attempt.skill), value: bonus });
  const leverage = socialLeverageMods(state, attempt.clause, attempt.target);
  for (const m of leverage) mods.push({ label: m.label, value: m.value });
  const mem = findMemory(state, attempt.target);
  const shift = mem ? socialShift(state, ensurePersona(state, mem)) : 0;
  // socialShift already folded into DC; do not double-count as a mod.

  const rng = opts.rng ?? turnRng(state, 'social-skill', attempt.skill, attempt.target);
  const d20s = opts.d20 != null ? [opts.d20] : undefined;
  const record = resolveCheckRecord({
    label: skillLabel(attempt.skill),
    mods,
    dc,
    rng,
    d20s,
  });
  // Keep DC stable in the record even when shift adjusted it (shift is in dc already).
  void shift;

  const success = record.outcome === 'success';
  const longShot = success && p <= 0.35;
  const xpGained = success ? successXpForOdds(p) : failureXpSliver();
  const { after, leveledUp } = applySkillXp(before, xpGained);
  skills[attempt.skill] = after;

  const label = skillLabel(attempt.skill);
  const modStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
  const outcomeWord = success ? (longShot ? 'success (long shot)' : 'success') : 'failed';
  const receipt =
    `${label}: rolled ${record.kept}${modStr} vs DC ${dc} — ${outcomeWord}. `
    + `${label} +${xpGained} XP (level ${after.level})`;

  const fact = consequenceFact(attempt.skill, attempt.target, success);

  let next: GameState = {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      socialProgression: {
        actorId: progression?.actorId ?? 'player',
        socialXp: progression?.socialXp ?? 0,
        level: progression?.level ?? 1,
        skillRanks: progression?.skillRanks ?? {
          persuasion: 0,
          intimidation: 0,
          deception: 0,
          insight: 0,
        },
        unlockedNodes: progression?.unlockedNodes ?? [],
        awardedNoveltyKeys: progression?.awardedNoveltyKeys ?? [],
        titles: progression?.titles ?? [],
        revision: (progression?.revision ?? 0) + 1,
        useSkills: skills,
      },
    },
  };

  const tag = personaTagFor(attempt.skill, success);
  const person = findMemory(next, attempt.target);
  if (tag && person) {
    const nudged = nudgePersona(next, ensurePersona(next, person), tag, `${label} ${success ? 'success' : 'failure'}`);
    next = {
      ...nudged.state,
      npcMemories: (nudged.state.npcMemories ?? []).map((m) =>
        (m.npcName ?? '') === (nudged.memory.npcName ?? '') ? nudged.memory : m,
      ),
      personaNudges: [...(nudged.state.personaNudges ?? []), ...(nudged.nudge ? [nudged.nudge] : [])],
    };
  }

  return {
    skill: attempt.skill,
    target: attempt.target,
    record,
    bonus,
    p,
    success,
    longShot,
    xpGained,
    skillAfter: after,
    leveledUp,
    fact,
    receipt,
    state: next,
  };
}

/** Modes that use the flat legacy social track (dnd unchanged; pyoa kept until a later cut). */
export function usesLegacySocialTrack(state: GameState): boolean {
  return state.engineMode === 'dnd' || state.engineMode === 'pyoa';
}

/** LitRPG / RPG use-based path. */
export function usesSkillSocialTrack(state: GameState): boolean {
  return state.engineMode === 'litrpg' || state.engineMode === 'rpg';
}
