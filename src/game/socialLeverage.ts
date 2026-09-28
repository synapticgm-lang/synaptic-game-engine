/**
 * 28r — social leverage from what the character knows, carries, wears and is.
 * Named modifiers on the one engine social check (checkMath.runPlayerCheck):
 *  - knowledge: the line names a person, place or quest the player has actually learned in play;
 *  - item: the line shows / offers an item the character really carries (or coin they have);
 *  - worn gear: equipped gear that impresses or offends the target's role (holy symbol vs priest, …);
 *  - stat/skill: intimidation can lean on STR, and a trained intimidation/deception skill counts.
 * Game-wide: trait and role classes, never a per-story list.
 */
import type { GameState, Item, NpcMemory } from './types';
import type { CheckMod } from './checkRules';

export type LeverageKind = 'knowledge' | 'item' | 'worn' | 'stat';

export interface LeverageMod extends CheckMod {
  kind: LeverageKind;
  /** Plain line for the writer / LitRPG cue. */
  note: string;
}

export type GearTrait = 'holy' | 'unholy' | 'fine' | 'ragged' | 'official' | 'criminal' | 'martial';
export type TargetRole = 'clergy' | 'guard' | 'noble' | 'criminal' | 'merchant' | 'common';

const TRAIT_RE: Record<GearTrait, RegExp> = {
  holy: /\b(holy|blessed|sacred|consecrated|relic|saint(?:'s|ly)?|prayer|rosary|symbol of)\b/i,
  unholy: /\b(bone|skull|necro\w*|cursed|demon\w*|infernal|unholy|blood-soaked|flayed)\b/i,
  fine: /\b(silk|velvet|fine|noble|jewell?ed|gilded|embroidered|signet|ermine|brocade)\b/i,
  ragged: /\b(rags?|tattered|torn|filthy|threadbare|patched|stained|ragged)\b/i,
  official: /\b(badge|insignia|tabard|uniform|livery|warrant|writ|seal of|crest of)\b/i,
  criminal: /\b(thieves'?|stolen|masked|mask|bandit|smuggler'?s?)\b/i,
  martial: /\b(plate|chain ?mail|chainmail|mail|armou?r|helm|helmet|greatsword|warhammer|battleaxe|halberd|shield)\b/i,
};

const ROLE_RE: Array<[TargetRole, RegExp]> = [
  ['clergy', /\b(priest(?:ess)?|cleric|monk|nun|acolyte|chaplain|abbot|abbess|temple|shrine|friar|oracle)\b/i],
  ['guard', /\b(guard|watch(?:man)?|soldier|captain|sergeant|warden|militia|knight|officer|sentry|constable|gatekeeper)\b/i],
  ['noble', /\b(lord|lady|noble\w*|duke|duchess|baron(?:ess)?|count(?:ess)?|prince(?:ss)?|king|queen|courtier|steward|magistrate)\b/i],
  ['criminal', /\b(thief|smuggler|fence|bandit|cutpurse|thug|rogue|pirate|brigand|gang\w*|racketeer)\b/i],
  ['merchant', /\b(merchant|trader|vendor|shopkeep\w*|innkeep\w*|broker|clerk|peddler|quartermaster)\b/i],
];

/** How each role reacts to worn traits on persuasion / deception. */
const ROLE_REACTION: Record<TargetRole, Partial<Record<GearTrait, number>>> = {
  clergy: { holy: 2, unholy: -3 },
  guard: { official: 2, criminal: -2 },
  noble: { fine: 2, ragged: -2, unholy: -1 },
  criminal: { criminal: 2, official: -2 },
  merchant: { fine: 1, ragged: -1 },
  common: { unholy: -1 },
};

const INTIMIDATE_RE = /\b(intimidate|threaten|menace|coerce|loom|scare|glare)\b/i;
const DECEIVE_RE = /\b(lie|deceive|bluff|trick|pretend|feign)\b/i;
const SHOW_RE = /\b(show|offer|give|present|hand|flash|wave|hold up|produce|bribe|pay|slide)\b/i;
const COIN_RE = /\b(gold|coins?|silver|money|bribe|pay)\b/i;

const WORN_CAP = 4;
const TOTAL_CAP = 8;

function lower(s: string | undefined): string {
  return (s ?? '').toLowerCase();
}

function mentions(text: string, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (t.length < 4) return false;
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(text);
}

export function gearTraits(item: Item): GearTrait[] {
  const src = `${item.name} ${item.description ?? ''}`;
  return (Object.keys(TRAIT_RE) as GearTrait[]).filter((t) => TRAIT_RE[t].test(src));
}

function targetMemory(state: GameState, targetName: string | undefined): NpcMemory | undefined {
  if (!targetName) return undefined;
  const key = targetName.toLowerCase();
  return (state.npcMemories ?? []).find(
    (m) => m.npcName.toLowerCase() === key || (m.aliases ?? []).some((a) => a.toLowerCase() === key)
  );
}

/** The person a social line is aimed at: the given target, a name in the line, else the first one present. */
export function leverageTargetName(state: GameState, actionText: string, targetName?: string): string | undefined {
  if (targetName) return targetName;
  const text = lower(actionText);
  const named = (state.npcMemories ?? []).find((m) => m.npcName && text.includes(m.npcName.toLowerCase()));
  if (named) return named.npcName;
  return (state.sceneFacts?.present ?? []).find((n) => !!String(n).trim());
}

export function targetRole(state: GameState, targetName: string | undefined): TargetRole {
  const mem = targetMemory(state, targetName);
  const src = [targetName ?? '', mem?.roleHint ?? '', ...(mem?.facts ?? []).slice(0, 6)].join(' ');
  const anon = (state.sceneFacts?.anonymousRoles ?? []).join(' ');
  for (const [role, re] of ROLE_RE) if (re.test(src)) return role;
  if (!targetName) for (const [role, re] of ROLE_RE) if (re.test(anon)) return role;
  return 'common';
}

/** Terms the player has learned in play: other met people, visited places, revealed quests. */
export function knownTerms(state: GameState, targetName?: string): string[] {
  const skip = new Set([lower(targetName), lower(state.currentLocation), lower(state.character?.name)]);
  const terms: string[] = [];
  for (const m of state.npcMemories ?? []) {
    if (!m.met && !m.introSpoken) continue;
    terms.push(m.npcName);
  }
  for (const p of state.places ?? []) {
    if (p.lastVisitedTurn != null) terms.push(p.name);
  }
  for (const q of state.quests ?? []) {
    if (q.revealed) terms.push(q.name);
  }
  return [...new Set(terms.filter((t) => t && !skip.has(lower(t))))];
}

function itemMods(state: GameState, text: string): LeverageMod[] {
  if (!SHOW_RE.test(text)) return [];
  const out: LeverageMod[] = [];
  const carried = (state.inventory ?? []).filter((i) => (i.quantity ?? 1) > 0);
  const hit = carried.find((i) => {
    if (mentions(text, i.name)) return true;
    const head = i.name.trim().split(/\s+/).pop() ?? '';
    return head.length >= 4 && mentions(text, head);
  });
  if (hit) {
    const value = hit.itemType === 'quest' || hit.itemType === 'accessory' || hit.rarity !== 'Common' ? 2 : 1;
    out.push({ kind: 'item', label: `shows ${hit.name}`, value, note: `You back the words with the ${hit.name}.` });
  }
  if (COIN_RE.test(text) && (state.gold ?? 0) > 0) {
    const value = (state.gold ?? 0) >= 50 ? 2 : 1;
    out.push({ kind: 'item', label: 'coin', value, note: 'Coin in your hand gives the words weight.' });
  }
  return out;
}

function wornMods(state: GameState, text: string, role: TargetRole, targetName: string | undefined): LeverageMod[] {
  const intimidate = INTIMIDATE_RE.test(text);
  const worn = (state.inventory ?? []).filter((i) => i.equipped);
  const seen = new Set<GearTrait>();
  const out: LeverageMod[] = [];
  const who = targetName ?? 'They';
  for (const item of worn) {
    for (const trait of gearTraits(item)) {
      if (seen.has(trait)) continue;
      let value = 0;
      if (intimidate) {
        value = trait === 'martial' ? 2 : trait === 'unholy' ? 1 : 0;
      } else {
        value = ROLE_REACTION[role][trait] ?? 0;
      }
      if (!value) continue;
      seen.add(trait);
      out.push({
        kind: 'worn',
        label: `${item.name} (${trait})`,
        value,
        note:
          value > 0
            ? `${who} ${intimidate ? 'takes in' : 'is impressed by'} your ${item.name}.`
            : `${who} is put off by your ${item.name}.`,
      });
    }
  }
  // Clamp the worn total, keeping every named mod but trimming the last one.
  let sum = out.reduce((s, m) => s + m.value, 0);
  if (Math.abs(sum) > WORN_CAP && out.length) {
    const last = out[out.length - 1]!;
    last.value -= sum - Math.sign(sum) * WORN_CAP;
    sum = Math.sign(sum) * WORN_CAP;
  }
  return out.filter((m) => m.value !== 0);
}

function statMods(state: GameState, text: string): LeverageMod[] {
  const out: LeverageMod[] = [];
  const attrs = state.character.attributes;
  const skills = ((state.character as { skills?: Record<string, number> }).skills ?? {}) as Record<string, number>;
  if (INTIMIDATE_RE.test(text)) {
    const str = state.character.strength ?? attrs?.STR ?? 10;
    const strMod = Math.floor((str - 10) / 2);
    const chaMod = Math.floor(((attrs?.CHA ?? 10) - 10) / 2);
    if (strMod > chaMod) {
      out.push({ kind: 'stat', label: 'STR (intimidate)', value: strMod - chaMod, note: 'Your build does half the talking.' });
    }
    const trained = Math.floor(Number(skills.intimidation ?? 0) || 0);
    if (trained > 0) out.push({ kind: 'stat', label: 'intimidation', value: trained, note: 'You know how to lean on people.' });
  }
  if (DECEIVE_RE.test(text)) {
    const trained = Math.floor(Number(skills.deception ?? 0) || 0);
    if (trained > 0) out.push({ kind: 'stat', label: 'deception', value: trained, note: 'The lie comes easily.' });
  }
  return out;
}

/** All leverage modifiers for one contested social line. Total is clamped to ±8. */
export function socialLeverageMods(state: GameState, actionText: string, targetName?: string): LeverageMod[] {
  const text = actionText ?? '';
  if (!text.trim()) return [];
  const target = leverageTargetName(state, text, targetName);
  const role = targetRole(state, target);
  const mods: LeverageMod[] = [];
  const known = knownTerms(state, target).find((t) => mentions(text, t));
  if (known) {
    mods.push({ kind: 'knowledge', label: `knows ${known}`, value: 2, note: `Naming ${known} shows you know more than they thought.` });
  }
  mods.push(...itemMods(state, text), ...wornMods(state, text, role, target), ...statMods(state, text));
  const sum = mods.reduce((s, m) => s + m.value, 0);
  if (Math.abs(sum) > TOTAL_CAP && mods.length) {
    const last = mods[mods.length - 1]!;
    last.value -= sum - Math.sign(sum) * TOTAL_CAP;
  }
  return mods.filter((m) => m.value !== 0);
}

/** One cue line for the writer / LitRPG (strongest mod). */
export function leverageCue(mods: LeverageMod[]): string | undefined {
  if (!mods.length) return undefined;
  const top = [...mods].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]!;
  return top.note;
}
