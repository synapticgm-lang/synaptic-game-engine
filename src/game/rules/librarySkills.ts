/**
 * The skill library (docs/library/skills) as engine data, and LitRPG named skills built on it.
 * The library is the one source for skill names, keywords, evolution lines, costs, cooldowns and System notice text.
 * Batch 1 is attributes, traits and resources (the engine already owns ability scores), so the engine loads
 * Batches 2–5, the families with usable skills. Named skills sit on top of the generic CHECK_SKILLS check.
 */
import batch2 from '../../../docs/library/skills/data/batch2-entries.json';
import batch3 from '../../../docs/library/skills/data/batch3-entries.json';
import batch4 from '../../../docs/library/skills/data/batch4-entries.json';
import batch5 from '../../../docs/library/skills/data/batch5-entries.json';
import { hidesPart } from '../systemHousing';
import { parseSkillEntries } from '../schemas';
import type { GameState, NamedSkillState } from '../types';

export interface LibraryEntry {
  identity: { id: string; name: string; other_names: string[]; kind: string };
  balance: { tier: number };
  getting: { prerequisites: string };
  using: {
    resource_cost?: { word?: string; engine?: number };
    cooldown?: { word?: string; engine?: number };
  };
  showing: { system_message?: string };
  paths_and_matching: { keywords: { verbs: string[]; nouns: string[]; phrases: string[] } };
  bookkeeping: { allowed_modes: string[] };
}

export const LIBRARY_ENTRIES: LibraryEntry[] = parseSkillEntries([batch2, batch3, batch4, batch5].flat()) as unknown as LibraryEntry[];

const BY_ID = new Map(LIBRARY_ENTRIES.map((e) => [e.identity.id, e]));

export function libraryEntry(id: string | undefined): LibraryEntry | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Use-grown ranks stop here; the skill then evolves (few levels, each adds its rank to the check). */
export const NAMED_SKILL_RANK_CAP = 3;
/** Total real uses that reach rank 1, 2 and 3. */
export const USES_FOR_RANK = [0, 2, 5, 9] as const;

export function rankForUses(uses: number): number {
  let rank = 0;
  for (let r = 1; r < USES_FOR_RANK.length; r++) if (uses >= USES_FOR_RANK[r]!) rank = r;
  return Math.min(rank, NAMED_SKILL_RANK_CAP);
}

const isLitrpg = (e: LibraryEntry) => (e.bookkeeping.allowed_modes ?? []).includes('litrpg');

/** The base skills that grow with use: tier-1 library skills allowed in LitRPG. */
export const BASE_SKILLS: LibraryEntry[] = LIBRARY_ENTRIES.filter(
  (e) => e.identity.kind === 'skill' && e.balance.tier === 1 && isLitrpg(e)
);

const RANK_WORD: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
const EVOLVES_INTO_KINDS = ['technique', 'skill', 'perk_or_feat'];

function namesOf(e: LibraryEntry): string[] {
  return [e.identity.name, ...(e.identity.other_names ?? [])].map((n) => n.toLowerCase());
}

/**
 * The rank of `base` a library entry asks for when that is its whole requirement (one alternative of an "or"
 * list, no "and", no gear, no breakthrough, no setting gate). "Meditation or Composure at rank two" counts for both.
 */
function soleRequirementRank(entry: LibraryEntry, base: LibraryEntry): number | null {
  const pre = (entry.getting.prerequisites ?? '').trim();
  if (/setting-gated/i.test(pre)) return null;
  const first = pre.split(/\.\s/)[0]!.replace(/\.$/, '').toLowerCase();
  const alts = first.split(/\s+or\s+/);
  const names = namesOf(base);
  for (let i = 0; i < alts.length; i++) {
    const m = alts[i]!.match(/^(.+?) at rank (\w+)$/);
    const subject = m ? m[1]! : alts[i]!;
    let rank = m ? RANK_WORD[m[2]!] : undefined;
    if (!m) {
      const later = alts.slice(i + 1).map((a) => a.match(/ at rank (\w+)$/)?.[1]).find(Boolean);
      rank = later ? RANK_WORD[later] : undefined;
    }
    if (rank && names.includes(subject.trim())) return rank;
  }
  return null;
}

const EVOLUTION = new Map<string, LibraryEntry | null>();

/**
 * What a base skill evolves into at the cap: the library entry whose sole requirement is this skill at the
 * highest rank up to the cap. Active entries (techniques, skills) beat passive perks; then library order.
 */
export function evolutionOf(baseId: string): LibraryEntry | null {
  if (EVOLUTION.has(baseId)) return EVOLUTION.get(baseId)!;
  const base = BY_ID.get(baseId);
  let best: { e: LibraryEntry; rank: number; active: boolean } | null = null;
  if (base) {
    for (const e of LIBRARY_ENTRIES) {
      if (e === base || !isLitrpg(e) || !EVOLVES_INTO_KINDS.includes(e.identity.kind)) continue;
      const rank = soleRequirementRank(e, base);
      if (!rank || rank > NAMED_SKILL_RANK_CAP) continue;
      const active = e.identity.kind !== 'perk_or_feat';
      if (!best || rank > best.rank || (rank === best.rank && active && !best.active)) best = { e, rank, active };
    }
  }
  EVOLUTION.set(baseId, best?.e ?? null);
  return best?.e ?? null;
}

export interface SkillCost {
  pool: 'sp' | 'mp';
  amount: number;
  word: string;
}

/** The library's resource cost: effort is stamina (SP), focus or mana is MP. */
export function costOf(e: LibraryEntry | undefined): SkillCost | null {
  const rc = e?.using.resource_cost;
  const amount = Number(rc?.engine ?? 0);
  if (!rc || !(amount > 0)) return null;
  const word = String(rc.word ?? '');
  return { pool: /focus|mana|mind/i.test(word) ? 'mp' : 'sp', amount, word: /focus|mana|mind/i.test(word) ? 'MP' : 'SP' };
}

export type CooldownKind = 'none' | 'scene' | 'day';

export function cooldownOf(e: LibraryEntry | undefined): CooldownKind {
  const w = String(e?.using.cooldown?.word ?? '').toLowerCase();
  if (/per day/.test(w)) return 'day';
  if (/per scene/.test(w)) return 'scene';
  return 'none';
}

/** One scene: this place (and this room of a dungeon). */
export function sceneKey(state: GameState): string {
  return `${state.currentLocation ?? ''}|${state.activeDungeon?.currentNodeId ?? ''}`;
}

export function dayOf(state: GameState): number {
  return Math.floor(Number(state.worldLedger?.clock?.day ?? 0));
}

export function namedSkillsOf(state: GameState): NamedSkillState[] {
  return state.character?.namedSkills ?? [];
}

/** An evolved skill's technique can be used now: off cooldown and its cost can be paid. */
export function techniqueReady(state: GameState, rec: NamedSkillState): boolean {
  const t = libraryEntry(rec.evolvedTo);
  if (!t) return false;
  const cd = cooldownOf(t);
  if (cd === 'scene' && rec.usedAt?.scene === sceneKey(state)) return false;
  if (cd === 'day' && rec.usedAt && rec.usedAt.day === dayOf(state)) return false;
  const cost = costOf(t);
  if (cost && Number(state.character?.[cost.pool] ?? 0) < cost.amount) return false;
  return true;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWords = (line: string, text: string) => new RegExp(`\\b${escapeRe(text.toLowerCase())}\\b`).test(line);

interface Hit {
  base: LibraryEntry;
  longest: number;
  count: number;
  noun: boolean;
  owned: number;
  order: number;
}

function hitFor(line: string, base: LibraryEntry, entries: LibraryEntry[], owned: number, order: number): Hit | null {
  let longest = 0;
  let count = 0;
  let action = false;
  let noun = false;
  for (const e of entries) {
    const k = e.paths_and_matching.keywords;
    for (const t of [...k.phrases, ...k.verbs]) {
      if (!hasWords(line, t)) continue;
      action = true;
      count += 1;
      longest = Math.max(longest, t.trim().split(/\s+/).length);
    }
    for (const t of k.nouns) if (hasWords(line, t)) { noun = true; count += 1; }
  }
  return action ? { base, longest, count, noun, owned, order } : null;
}

/**
 * The base skill a typed line uses, by the library's keyword tie-break (Batch 0 Part 3): the longest matching
 * phrase, then more matched words; a skill the character has beats one they lack; a specific noun beats a bare
 * verb; then the cheaper skill, then library order. Only a verb or phrase makes a match; a noun alone does not.
 * An evolved skill also answers to its technique's keywords.
 */
export function matchBaseSkill(state: GameState, input: string): LibraryEntry | null {
  const line = (input ?? '').toLowerCase();
  if (!line.trim()) return null;
  const recs = new Map(namedSkillsOf(state).map((r) => [r.id, r]));
  const hits: Hit[] = [];
  BASE_SKILLS.forEach((base, order) => {
    const rec = recs.get(base.identity.id);
    const evolved = libraryEntry(rec?.evolvedTo);
    const owned = evolved ? NAMED_SKILL_RANK_CAP + 1 : rec?.rank ?? 0;
    const h = hitFor(line, base, evolved ? [base, evolved] : [base], owned, order);
    if (h) hits.push(h);
  });
  hits.sort(
    (a, b) =>
      b.longest - a.longest
      || b.count - a.count
      || b.owned - a.owned
      || Number(b.noun) - Number(a.noun)
      || (costOf(a.base)?.amount ?? 0) - (costOf(b.base)?.amount ?? 0)
      || a.order - b.order
  );
  return hits[0]?.base ?? null;
}

export interface NamedSkillCheckMod {
  label: string;
  value: number;
  advantage: boolean;
}

/**
 * LitRPG: the named skill a check uses adds its rank (1–3) to the d20 roll. An evolved skill keeps the rank-3
 * bonus, and its technique gives advantage when it is ready (off cooldown, cost payable). Attacks use weapon
 * familiarity, not a named skill.
 */
export function namedSkillCheckMod(state: GameState, actionText: string, intentKind?: string): NamedSkillCheckMod | null {
  if (state.engineMode !== 'litrpg' || intentKind === 'attack') return null;
  const base = matchBaseSkill(state, actionText);
  const rec = base && namedSkillsOf(state).find((r) => r.id === base.identity.id);
  if (!base || !rec || rec.rank <= 0) return null;
  const technique = libraryEntry(rec.evolvedTo);
  return {
    label: technique ? technique.identity.name : `${base.identity.name} ${rec.rank}`,
    value: rec.rank,
    advantage: !!technique && techniqueReady(state, rec),
  };
}

export interface NamedSkillView {
  key: string;
  label: string;
  /** Null where the housing shows the plain title only (world status), or for an evolved skill. */
  rank: number | null;
  /** Evolved: what it came from, and its cost and cooldown. */
  note: string | null;
}

function viewNote(base: LibraryEntry, technique: LibraryEntry): string {
  const parts = [`from ${base.identity.name}`];
  const cost = costOf(technique);
  if (cost) parts.push(`${cost.amount} ${cost.word}`);
  const cd = cooldownOf(technique);
  if (cd !== 'none') parts.push(`once per ${cd}`);
  return parts.join(', ');
}

/** The named skills the player sees, highest first; empty outside LitRPG or when the housing hides skills. */
export function namedSkillViews(state: GameState): NamedSkillView[] {
  if (state.engineMode !== 'litrpg' || hidesPart(state.systemHousing, 'skills')) return [];
  const plain = state.systemHousing?.housing === 'world_status';
  return namedSkillsOf(state)
    .filter((r) => r.rank > 0 && libraryEntry(r.id))
    .map((r) => ({ r, technique: libraryEntry(r.evolvedTo) }))
    .sort((a, b) => Number(!!b.technique) - Number(!!a.technique) || b.r.rank - a.r.rank || b.r.uses - a.r.uses)
    .map(({ r, technique }) => {
      const base = libraryEntry(r.id)!;
      return {
        key: r.id,
        label: technique ? technique.identity.name : base.identity.name,
        rank: technique || plain ? null : r.rank,
        note: technique && !plain ? viewNote(base, technique) : null,
      };
    });
}

/** Notices the engine prints for named skills (library System message text). */
export const SKILL_NOTICE = /^(?:Skill rank up|Technique learned|Technique used|Perk gained|Skill learned):/;
