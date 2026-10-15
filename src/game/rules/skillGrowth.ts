/**
 * LitRPG / Story RPG named skills grow by skill XP (SK-5). Stakes-bearing success awards XP by
 * task difficulty; failure awards 0. Same-scene line repeats and tabletop (SRD) are unchanged.
 * Character-level XP is separate (`characterXp.ts`). One notice per turn at most.
 */
import { resolveCheckContext, runPlayerCheck, type SkillTierName } from '../checkMath';
import { isLedgerReadAction } from '../completedEventPacket';
import { parsePlayerIntent } from '../intentParser';
import { isTravelPad } from '../padUniverse';
import { hidesPart } from '../systemHousing';
import { isJourneyStepLine } from '../travelJourney';
import type { GameState, NamedSkillState } from '../types';
import {
  cooldownOf,
  costOf,
  dayOf,
  evolutionOf,
  libraryEntry,
  matchBaseSkill,
  namedSkillsOf,
  sceneKey,
  techniqueReady,
} from './librarySkills';

export interface SkillSettle {
  state: GameState;
  receipts: string[];
  fact?: string;
}

export const SKILL_LEVEL_CAP = 50;
/** Old rank 0..3 → matching new level (untrained / Novice 1 / Apprentice 1 / Journeyman 1). */
export const OLD_RANK_TO_LEVEL = [0, 1, 11, 21] as const;

const TIER_FIRST: Record<SkillTierName, number> = {
  Novice: 1,
  Apprentice: 11,
  Journeyman: 21,
  Expert: 31,
  Master: 41,
};

export interface SkillUseOpts {
  rested?: boolean;
  success?: boolean;
  longShot?: boolean;
  taskLevel?: number;
  skillTier?: SkillTierName;
  d20?: number;
  longShotRoll?: number;
  craftAttempt?: { name: string; qty: number };
}

export function xpForLevel(L: number): number {
  return L < 1 ? 0 : Math.round(100 * Math.pow(1.1, L - 1));
}

export function greyCutoff(skillLevel: number): number {
  const L = Math.max(0, skillLevel);
  if (L <= 5) return 0;
  if (L <= 39) return L - 5 - Math.floor(L / 10);
  return L - 1 - Math.floor(L / 5);
}

export function useXpFor(skillLevel: number, taskLevel: number): number {
  const grey = greyCutoff(skillLevel);
  if (taskLevel <= grey) return 0;
  const diff = taskLevel - skillLevel;
  let band = 1;
  if (diff >= 3) band = 1.5;
  else if (diff < -2) {
    const span = skillLevel - 2 - grey;
    band = span <= 0 ? 0 : Math.max(0, (taskLevel - grey) / span);
  }
  return band <= 0 ? 0 : Math.round(10 * Math.pow(1.1, taskLevel - 1) * band);
}

export function longShotBoost(tier: SkillTierName): number {
  const odds = tier === 'Journeyman' ? 1000 : tier === 'Expert' ? 5000 : tier === 'Master' ? 10000 : 0;
  return odds ? Math.round((Math.log10(odds) / 4) * xpForLevel(TIER_FIRST[tier])) : 0;
}

export function levelLabel(level: number): string {
  if (level < 1) return 'untrained';
  if (level > SKILL_LEVEL_CAP) return 'Master 10';
  const i = Math.floor((level - 1) / 10);
  const tier = i === 0 ? 'Novice' : i === 1 ? 'Apprentice' : i === 2 ? 'Journeyman' : i === 3 ? 'Expert' : 'Master';
  return `${tier} ${((level - 1) % 10) + 1}`;
}

export function rankFromLevel(level: number): number {
  return level <= 0 ? 0 : Math.min(3, Math.ceil(level / 10));
}

export function migrateNamedSkill(rec: NamedSkillState): NamedSkillState {
  if (typeof rec.level === 'number' && rec.level >= 0) {
    const level = Math.min(SKILL_LEVEL_CAP, Math.floor(rec.level));
    return { ...rec, level, xp: Math.max(0, Math.floor(rec.xp ?? 0)), rank: rankFromLevel(level) };
  }
  const rank = Math.max(0, Math.min(3, Math.floor(rec.rank ?? 0)));
  const level = OLD_RANK_TO_LEVEL[rank] ?? 0;
  return { ...rec, level, xp: 0, rank: rankFromLevel(level), uses: rec.uses ?? 0 };
}

/** Apply skill XP with overflow through as many levels as it covers (cap Master 10). */
export function applySkillXp(level: number, xp: number, gain: number): { level: number; xp: number; leveled: boolean } {
  let L = Math.max(0, Math.min(SKILL_LEVEL_CAP, Math.floor(level)));
  let X = Math.max(0, Math.floor(xp)) + Math.max(0, Math.floor(gain));
  let leveled = false;
  if (L === 0 && X > 0) {
    L = 1;
    leveled = true;
  }
  while (L < SKILL_LEVEL_CAP) {
    const need = xpForLevel(L);
    if (X < need) break;
    X -= need;
    L += 1;
    leveled = true;
  }
  return L >= SKILL_LEVEL_CAP ? { level: SKILL_LEVEL_CAP, xp: 0, leveled } : { level: L, xp: X, leveled };
}

export function craftMaterialsLost(attempted: number): number {
  return Math.floor(Math.max(0, attempted) / 2);
}

export function applyFailedCraftMaterials(state: GameState, materialName: string, attempted: number): GameState {
  const lost = craftMaterialsLost(attempted);
  if (lost <= 0 || state.engineMode === 'dnd') return state;
  const want = materialName.trim().toLowerCase();
  return {
    ...state,
    materials: (state.materials ?? [])
      .map((m) =>
        m.name.toLowerCase() === want || m.id.toLowerCase() === want
          ? { ...m, quantity: Math.max(0, (m.quantity ?? 0) - lost) }
          : m,
      )
      .filter((m) => (m.quantity ?? 0) > 0),
  };
}

/**
 * Settle one turn of named-skill use before the writer. `rested`: a rest happened this turn, which refreshes
 * once-per-day techniques.
 */
export function settleSkillUse(state: GameState, input: string, opts: SkillUseOpts = {}): SkillSettle {
  const mode = state.engineMode;
  if ((mode !== 'litrpg' && mode !== 'rpg') || !state.character) return { state, receipts: [] };
  let recs = namedSkillsOf(state).map(migrateNamedSkill);
  let next: GameState = { ...state, character: { ...state.character, namedSkills: recs } };
  if (opts.rested && recs.some((r) => r.usedAt && cooldownOf(libraryEntry(r.evolvedTo)) === 'day')) {
    recs = recs.map((r) => (r.usedAt && cooldownOf(libraryEntry(r.evolvedTo)) === 'day' ? { ...r, usedAt: undefined } : r));
    next = { ...next, character: { ...next.character, namedSkills: recs } };
  }
  const base = matchBaseSkill(next, input);
  const t = (input ?? '').trim();
  const intent = parsePlayerIntent(t, next);
  const ctx = base ? resolveCheckContext(next, intent, t) : null;
  if (
    !base
    || !t
    || isTravelPad(t)
    || isJourneyStepLine(t)
    || isLedgerReadAction(t)
    || intent.kind === 'attack'
    || !ctx
    || ctx.autoSucceed
    || ctx.dc <= 0
  ) {
    return { state: next, receipts: [] };
  }

  const id = base.identity.id;
  const scene = sceneKey(next);
  const line = t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const was = migrateNamedSkill(recs.find((r) => r.id === id) ?? { id, rank: 0, uses: 0, level: 0, xp: 0 });
  const rec: NamedSkillState = { ...was };
  const notices: { text: string; fact: string }[] = [];
  const charXpBefore = next.character.xp;

  const technique = libraryEntry(rec.evolvedTo);
  let character = next.character;
  if (technique && techniqueReady(next, rec)) {
    const cost = costOf(technique);
    if (cost) character = { ...character, [cost.pool]: Number(character[cost.pool] ?? 0) - cost.amount };
    if (cooldownOf(technique) !== 'none' || cost) rec.usedAt = { scene, day: dayOf(next), turn: next.turn ?? 0 };
    if (cost || cooldownOf(technique) !== 'none') {
      const spent = [cost ? `${cost.amount} ${cost.word}` : '', cooldownOf(technique) !== 'none' ? `once per ${cooldownOf(technique)}` : '']
        .filter(Boolean)
        .join(', ');
      notices.push({
        text: `Technique used: ${technique.identity.name} (${spent}).`,
        fact: `The player used the technique ${technique.identity.name}.`,
      });
    }
  }

  const repeat = was.lastUse?.line === line && was.lastUse?.scene === scene;
  if (!repeat) {
    rec.lastUse = { line, scene };
    const tier = (opts.skillTier ?? ctx.skillTier) as SkillTierName | undefined;
    const taskLevel =
      opts.taskLevel != null && opts.taskLevel > 0
        ? Math.min(SKILL_LEVEL_CAP, Math.floor(opts.taskLevel))
        : tier
          ? TIER_FIRST[tier]
          : 1;

    let success = opts.success;
    let longShot = opts.longShot === true;
    if (success === undefined) {
      const rolled = runPlayerCheck(next, intent, input, opts.d20, opts.longShotRoll);
      success = rolled.isSuccess;
      const note = rolled.codeResolutionText ?? '';
      longShot = note.includes('long-shot') && note.includes('success');
    }

    if (!success) {
      if (opts.craftAttempt) next = applyFailedCraftMaterials(next, opts.craftAttempt.name, opts.craftAttempt.qty);
    } else if ((rec.level ?? 0) < SKILL_LEVEL_CAP) {
      const gain =
        longShot && tier && (tier === 'Journeyman' || tier === 'Expert' || tier === 'Master')
          ? longShotBoost(tier)
          : useXpFor(rec.level ?? 0, taskLevel);
      if (gain > 0) {
        const before = rec.level ?? 0;
        const applied = applySkillXp(rec.level ?? 0, rec.xp ?? 0, gain);
        rec.level = applied.level;
        rec.xp = applied.xp;
        rec.rank = rankFromLevel(rec.level);
        rec.uses = (rec.uses ?? 0) + 1;
        if (applied.leveled && rec.level > before) {
          const label = levelLabel(rec.level);
          const libRaw = (libraryEntry(id)?.showing.system_message ?? '').trim();
          const lib = libRaw.endsWith('.') ? libRaw.slice(0, -1) : libRaw;
          const msg = lib || `Skill up: ${base.identity.name}, ${label}`;
          const msgBare = msg.endsWith('.') ? msg.slice(0, -1) : msg;
          notices.unshift({
            text: msgBare.toLowerCase().includes('skill up:') ? `${msgBare}.` : `Skill up: ${base.identity.name}, ${label}.`,
            fact: `The System raised the skill ${base.identity.name} to ${label}.`,
          });
          const evolved = rec.level >= SKILL_LEVEL_CAP && !rec.evolvedTo ? evolutionOf(id) : null;
          if (evolved) {
            rec.evolvedTo = evolved.identity.id;
            const learnedRaw = (evolved.showing.system_message ?? `Technique learned: ${evolved.identity.name}`).trim();
            const learned = learnedRaw.endsWith('.') ? learnedRaw.slice(0, -1) : learnedRaw;
            notices.unshift({
              text: `${learned} (${base.identity.name} evolved).`,
              fact: `The System evolved the skill ${base.identity.name} into ${evolved.identity.name}.`,
            });
          }
        }
      }
    }
  }

  const updated = recs.some((r) => r.id === id) ? recs.map((r) => (r.id === id ? rec : r)) : [...recs, rec];
  next = { ...next, character: { ...character, namedSkills: updated, xp: charXpBefore } };
  const top = notices[0];
  if (!top || hidesPart(next.systemHousing, 'skills')) return { state: next, receipts: [] };
  return { state: next, receipts: [top.text], fact: top.fact };
}
