/**
 * 28c — reaction (disposition) and weapon-familiarity modifiers, MODIFIERS-RESEARCH.md §3.
 * The engine resolves every check and returns one record; the writer only narrates the outcome.
 * D&D shows the full maths, LitRPG shows the outcome (and a short cue) only.
 *
 * Proficiency bonus by level, advantage/disadvantage, and Friendly = advantage / Hostile = disadvantage
 * on influence checks come from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the
 * Coast LLC, available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode).
 * The flat ±2, the Willing/Unwilling gates per disposition and the familiarity tiers are SynapticGM design.
 */
import type { EngineMode, GameState } from './types';
import { deriveDisposition, type Disposition, type NpcRelationship } from './npcRelationships';

export type AdvState = 'advantage' | 'disadvantage' | 'normal';

export interface CheckMod {
  label: string;
  value: number;
}

/** The one engine result record for a d20 check. */
export interface CheckResultRecord {
  label: string;
  d20s: number[];
  kept: number;
  advState: AdvState;
  mods: CheckMod[];
  total: number;
  dc: number;
  outcome: 'success' | 'failure';
  /** Set when a gate decided the check with no roll. */
  auto?: 'willing' | 'unwilling';
  /** LitRPG-only qualitative cue ("Mara seems inclined to help"). */
  cue?: string;
}

/** SRD 5.2.1 proficiency bonus: +2 (1–4) … +6 (17–20). */
export function proficiencyBonus(level: number | undefined): number {
  const l = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return 2 + Math.floor((l - 1) / 4);
}

export interface DispositionSocialRow {
  adv: AdvState;
  flat: number;
  /** Requests the NPC grants with no roll. */
  willing: Array<'minor' | 'risky'>;
  /** Requests the NPC refuses with no roll. */
  unwilling: Array<'minor' | 'risky'>;
}

/** MODIFIERS-RESEARCH §3A table. */
export const DISPOSITION_SOCIAL: Readonly<Record<Disposition, DispositionSocialRow>> = {
  hostile: { adv: 'disadvantage', flat: -2, willing: [], unwilling: ['risky'] },
  wary: { adv: 'disadvantage', flat: 0, willing: [], unwilling: [] },
  neutral: { adv: 'normal', flat: 0, willing: [], unwilling: [] },
  friendly: { adv: 'advantage', flat: 0, willing: [], unwilling: [] },
  allied: { adv: 'advantage', flat: 2, willing: ['minor'], unwilling: [] },
  loyal: { adv: 'advantage', flat: 2, willing: ['minor', 'risky'], unwilling: [] },
};

type StoredRelationship = {
  npcName?: string;
  disposition?: Disposition;
  trust?: number;
  affinity?: number;
  respect?: number;
  fear?: number;
  familiarity?: number;
  milestones?: Array<{ type: string; turn?: number; summary?: string; tags?: string[] }>;
};

/** Disposition of a stored relationship record (the arcDirector keeps a slim shape). */
export function storedDisposition(rec: StoredRelationship): Disposition {
  if (rec.disposition) return rec.disposition;
  const full = {
    trust: Number(rec.trust ?? rec.affinity ?? 0),
    respect: Number(rec.respect ?? 0),
    fear: Number(rec.fear ?? 0),
    familiarity: Number(rec.familiarity ?? 0),
    intimacy: 0,
    milestones: (rec.milestones ?? []).map((m) => ({ ...m, turn: m.turn ?? 0, tags: m.tags ?? [] })),
    boundaries: [],
  } as unknown as NpcRelationship;
  return deriveDisposition(full);
}

/** The NPC a social line is aimed at: named in the line, else the first one present. */
export function socialTarget(
  state: GameState,
  actionText: string
): { name: string; disposition: Disposition } | null {
  const rels = ((state.arcDirector as { npcRelationships?: StoredRelationship[] } | undefined)?.npcRelationships ?? [])
    .filter((r) => (r.npcName ?? '').trim());
  if (!rels.length) return null;
  const low = (actionText ?? '').toLowerCase();
  const present = (state.sceneFacts?.present ?? []).map((n) => String(n).toLowerCase());
  const named = rels.find((r) => low.includes(r.npcName!.toLowerCase()));
  const here = named ?? rels.find((r) => present.includes(r.npcName!.toLowerCase()));
  if (!here) return null;
  return { name: here.npcName!, disposition: storedDisposition(here) };
}

/** Request size for the Willing/Unwilling gate. */
export function requestSize(actionText: string): 'minor' | 'risky' {
  return /\b(risk|danger|dangerous|betray|fight|swear|oath|pact|bind|steal|kill|lend|gold|coin|money|weapon|escort|hire)\b/i.test(
    actionText ?? ''
  )
    ? 'risky'
    : 'minor';
}

export type WeaponCategory = 'blade' | 'axe' | 'blunt' | 'polearm' | 'bow' | 'firearm' | 'unarmed';

export function weaponCategory(weaponName: string): WeaponCategory {
  const w = (weaponName ?? '').toLowerCase();
  if (!w || /\b(bare hands?|fists?|unarmed)\b/.test(w)) return 'unarmed';
  if (/\b(pistol|gun|rifle|revolver)\b/.test(w)) return 'firearm';
  if (/\b(bow|crossbow)\b/.test(w)) return 'bow';
  if (/\b(spear|staff|pike|halberd|glaive|polearm)\b/.test(w)) return 'polearm';
  if (/\b(axe|hatchet)\b/.test(w)) return 'axe';
  if (/\b(club|bat|mace|hammer|cudgel|maul)\b/.test(w)) return 'blunt';
  return 'blade';
}

export type FamiliarityTier = 'untrained' | 'familiar' | 'proficient';

/** 0–29 untrained (+0), 30–69 familiar (+half PB), 70–100 proficient (+PB). */
export function familiarityTier(score: number): FamiliarityTier {
  if (score >= 70) return 'proficient';
  if (score >= 30) return 'familiar';
  return 'untrained';
}

export function familiarityToHit(score: number, pb: number): number {
  const tier = familiarityTier(score);
  if (tier === 'proficient') return pb;
  if (tier === 'familiar') return Math.floor(pb / 2);
  return 0;
}

/**
 * Familiarity for a weapon category. A class/background proficiency sets the floor at 70.
 * D&D characters with no proficiency list count as proficient with simple-style weapons
 * (blade/blunt/polearm/unarmed) — every 5e class has simple weapons (design approximation).
 */
export function weaponFamiliarityScore(state: GameState, cat: WeaponCategory): number {
  const ch = state.character as {
    weaponFamiliarity?: Partial<Record<WeaponCategory, number>>;
    weaponProficiencies?: WeaponCategory[];
  };
  const raw = Math.max(0, Math.min(100, Math.floor(ch.weaponFamiliarity?.[cat] ?? 0)));
  const listed = ch.weaponProficiencies;
  const proficient = listed
    ? listed.includes(cat)
    : state.engineMode === 'dnd' && ['blade', 'blunt', 'polearm', 'unarmed'].includes(cat);
  return proficient ? Math.max(70, raw) : raw;
}

/** +1 per scene the weapon is used, capped at 69 unless trained (proficient floor handled at read). */
export function growWeaponFamiliarity(state: GameState, cat: WeaponCategory): GameState {
  const ch = state.character as typeof state.character & { weaponFamiliarity?: Partial<Record<WeaponCategory, number>> };
  const cur = Math.floor(ch.weaponFamiliarity?.[cat] ?? 0);
  if (cur >= 69) return state;
  return {
    ...state,
    character: { ...ch, weaponFamiliarity: { ...(ch.weaponFamiliarity ?? {}), [cat]: cur + 1 } },
  };
}

/** Roll a d20 with advantage state (2d20 keep high/low). `d20s` lets tests and replays fix the dice. */
export function rollD20WithAdv(adv: AdvState, rng: () => number = Math.random, d20s?: number[]): { d20s: number[]; kept: number } {
  const one = () => Math.floor(rng() * 20) + 1;
  const dice = d20s?.length ? d20s : adv === 'normal' ? [one()] : [one(), one()];
  const kept = adv === 'advantage' ? Math.max(...dice) : adv === 'disadvantage' ? Math.min(...dice) : dice[0]!;
  return { d20s: dice, kept };
}

/** Combine advantage sources: any adv + any dis = normal (SRD 5.2.1, they never stack). */
export function combineAdv(...states: AdvState[]): AdvState {
  const a = states.includes('advantage');
  const d = states.includes('disadvantage');
  if (a && d) return 'normal';
  return a ? 'advantage' : d ? 'disadvantage' : 'normal';
}

export function resolveCheckRecord(input: {
  label: string;
  mods: CheckMod[];
  dc: number;
  adv?: AdvState;
  rng?: () => number;
  d20s?: number[];
  auto?: 'willing' | 'unwilling';
  cue?: string;
}): CheckResultRecord {
  const advState = input.adv ?? 'normal';
  const mods = input.mods.filter((m) => m.value !== 0);
  if (input.auto) {
    return {
      label: input.label,
      d20s: [],
      kept: 0,
      advState,
      mods,
      total: 0,
      dc: input.dc,
      outcome: input.auto === 'willing' ? 'success' : 'failure',
      auto: input.auto,
      cue: input.cue,
    };
  }
  const { d20s, kept } = rollD20WithAdv(advState, input.rng, input.d20s);
  const total = kept + mods.reduce((s, m) => s + m.value, 0);
  return {
    label: input.label,
    d20s,
    kept,
    advState,
    mods,
    total,
    dc: input.dc,
    outcome: total >= input.dc ? 'success' : 'failure',
    cue: input.cue,
  };
}

function signed(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`;
}

/** D&D: "Persuasion d20 (adv: 14, 7) + 3 CHA + 2 PB = 19 vs DC 15 — success". LitRPG: outcome + cue only. */
export function formatCheckRecord(rec: CheckResultRecord, mode: EngineMode | undefined): string {
  const word = rec.outcome === 'success' ? 'success' : 'failure';
  if (mode !== 'dnd') {
    const head = rec.outcome === 'success' ? `${rec.label}: success` : `${rec.label}: failure`;
    return rec.cue ? `${head}. ${rec.cue}` : head;
  }
  if (rec.auto) {
    return `${rec.label}: no roll (${rec.auto === 'willing' ? 'willing' : 'unwilling'}) — ${word}`;
  }
  const dice =
    rec.advState === 'normal'
      ? `d20 (${rec.kept})`
      : `d20 (${rec.advState === 'advantage' ? 'adv' : 'dis'}: ${rec.d20s.join(', ')})`;
  const mods = rec.mods.map((m) => `${signed(m.value)} ${m.label}`).join(' ');
  return `${rec.label} ${dice}${mods ? ` ${mods}` : ''} = ${rec.total} vs DC ${rec.dc} — ${word}`;
}

/** LitRPG cue for a disposition (never numbers). */
export function dispositionCue(name: string, d: Disposition): string | undefined {
  if (d === 'hostile' || d === 'wary') return `${name} seems set against you.`;
  if (d === 'friendly' || d === 'allied' || d === 'loyal') return `${name} seems inclined to help.`;
  return undefined;
}

/** LitRPG cue for weapon familiarity. */
export function familiarityCue(tier: FamiliarityTier): string | undefined {
  if (tier === 'untrained') return 'The grip feels foreign.';
  if (tier === 'proficient') return 'The weapon moves the way you want.';
  return undefined;
}
