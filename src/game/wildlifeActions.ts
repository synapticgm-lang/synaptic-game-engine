/**
 * XP-D1 OPEN5 — the play path for hunting (LitRPG / Story RPG only; never tabletop or PYOA).
 *
 * `startHuntFromInput` is called from `runArcDirectorBeforeGm` (live useGame + Fate share it). It reads the
 * Hunt pad / free text ("I go hunting"), has `wilds.pickHuntTarget` choose the creature, and opens an
 * ActiveEncounter sized like `roadFoe` but from the creature's OWN level (`levelSource: 'table'`). The
 * existing engine fight settles it that turn; `payEncounterXp` pays it (killScale + wilds budget) and
 * `applyWildsKillExtras` spends the stock unit and drops the hide. Free text is never rejected.
 */
import type { ActiveEncounter, CraftingMaterial, GameState } from './types';
import {
  ensureNodeStock,
  ensureWilds,
  gatheringIsSafe,
  guardAmbushChance,
  isOutdoorWildsPlace,
  pickHuntTarget,
  placeRegionId,
  takeNodeUnit,
  takeQuietNotice,
  takeWildsKill,
  wildsNowHour,
  wildsPlaceId,
  type ResourceNode,
  type WildsSlot,
  type WildsStock,
} from './wilds';
import {
  GATHER_BELOW_UNLOCK_CHANCE,
  HERB_BY_TIER,
  HIDE_BY_TIER,
  ORE_BY_TIER,
  gatherUnlockRankForTier,
  isGatherPad,
  isHuntPad,
  tierForLevel,
} from './rules/wildlifeConfig';
import { settleSkillUse } from './rules/skillGrowth';
import { createHashRng } from './seededRng';
import { modeUsesEquipLevel } from './rules/equipLevel';
import { canAddMaterials } from './inventory';

export interface HuntStart {
  state: GameState;
  receipts: string[];
  /** Hand this to resolveEngineFight so the opened hunt is fought this turn. Absent = no fight opened. */
  fightInput?: string;
  /** Writer fact when no fight opened (nothing to hunt here). */
  fact?: string;
}

/**
 * Hunting is LitRPG only (engineMode === 'litrpg'). Story RPG's engine blocks drought / Seek Fight combat
 * (beatContract.engineAllowsCombat), tabletop (dnd) is SRD-only and PYOA has no creature table. Gather is wider
 * (`gatherModeOk`: LitRPG + Story RPG).
 */
export function huntModeOk(state: Pick<GameState, 'engineMode'>): boolean {
  return state.engineMode === 'litrpg';
}

/** Gathering works in LitRPG and Story RPG (never tabletop or PYOA). */
export function gatherModeOk(state: Pick<GameState, 'engineMode'>): boolean {
  return modeUsesEquipLevel(state.engineMode);
}

const NOT_ANIMALS =
  /\bhunt(?:ing)?\s+(?:for\s+)?(?:the\s+|a\s+|an\s+|some\s+|any\s+)?(?:clues?|info|information|rumou?rs?|killer|thief|thieves|assassin|murderer|traitor|culprit|bandits?|man|woman|person|him|her|them|answers|truth|treasure|secrets?|demon|vampire|witch|heretic|enem(?:y|ies)|monster hunters?)\b/i;
const GO_HUNTING = /\b(?:go|going|went|goes|head(?:ing)?\s+out|set(?:ting)?\s+out)\s+(?:out\s+)?hunting\b/i;
const HUNT_VERB = /^(?:i\s+|we\s+|let'?s\s+|i'?ll\s+|i\s+will\s+)?hunt(?:ing)?\b/i;
const GENERIC_PREY =
  /^(?:wildlife|animals?|game|food|meat|something|anything|creatures?|beasts?|prey|local wildlife|the wildlife)$/i;

/** True when the line is a hunt: the Hunt pads, "I go hunting", "hunt a deer". Quest-style hunts ("hunt the thief") are not. */
export function isHuntRequest(input: string): boolean {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (isHuntPad(t)) return true;
  if (NOT_ANIMALS.test(t)) return false;
  return GO_HUNTING.test(t) || HUNT_VERB.test(t);
}

function wantedSpecies(input: string): { name?: string; strongest?: boolean } {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (/\b(?:strongest|toughest|biggest|most dangerous|deadliest|rarest)\b/i.test(t)) return { strongest: true };
  const m = t.match(/\bhunt(?:ing)?\s+(?:for\s+)?(?:the\s+|a\s+|an\s+|some\s+)?([a-z][a-z' -]{2,28}?)(?:\s+(?:nearby|around|here|in|on|at|by|with|near)\b.*)?[.!?]*$/i);
  const raw = (m?.[1] ?? '').trim().toLowerCase();
  if (!raw || GENERIC_PREY.test(raw)) return {};
  return { name: raw.replace(/s$/, '') };
}

function foeName(slot: WildsSlot): string {
  return slot.name;
}

/** Same sizing as roadFoe, from the creature's own level. Rare ×1.25 (step 1); elite ×1.8 (step 2). */
export function huntFoe(slot: WildsSlot, placeLabel: string): ActiveEncounter {
  const level = Math.max(1, Math.round(slot.level));
  const boss = !!slot.elite && !slot.rare;
  const hp = 10 + level * 4;
  const ac = 10 + Math.min(5, Math.ceil(level / 2));
  const xp = 20 + level * 5;
  const mult = boss ? 1.8 : slot.rare ? 1.25 : 1;
  const step = boss ? 2 : slot.rare ? 1 : 0;
  const maxHp = Math.round(hp * mult);
  const carriesPurse = slot.kind === 'humanoid';
  return {
    name: foeName(slot),
    level,
    hp: maxHp,
    maxHp,
    armorClass: ac + step,
    strength: 10 + level + step,
    dexterity: 10,
    constitution: 10 + level + step,
    xpReward: Math.round(xp * mult),
    goldReward: carriesPurse ? Math.round((3 + level * 2) * mult) : 0,
    // Source never says "elite"/"boss": xpRules.encounterKind would turn it into a miniBoss and double the elite ×2.
    source: slot.rare ? 'wilds-rare-spawn' : 'wilds-hunt',
    // Loot profile only (profileForEncounter reads this key): rare → rareSpawn, elite → miniBoss.
    forcedSpawnKey: slot.rare ? 'wilds-rare-spawn' : slot.elite ? 'wilds-mini-boss' : 'wilds-hunt',
    levelSource: 'table',
    ...(slot.elite ? { elite: true } : {}),
    ...(slot.rare ? { rare: true } : {}),
    speciesId: slot.speciesId,
    creatureKind: slot.kind,
    skinnable: slot.skinnable,
    wildsPlace: placeLabel,
  };
}

/**
 * Open a hunt when the player asks for one. Null = not a hunt (or not this mode / a fight is already live), so
 * the normal path runs. Never rejects free text: indoors or with empty stock the turn still happens, with a fact.
 */
export function startHuntFromInput(state: GameState, input: string): HuntStart | null {
  if (!huntModeOk(state)) return null;
  if (!isHuntRequest(input)) return null;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return null;
  if (!state.openingEstablishment?.complete) return null;
  if (!isOutdoorWildsPlace(state)) {
    return {
      state,
      receipts: [],
      fact: 'There is nothing here to hunt; the wild country lies outside.',
    };
  }
  const want = wantedSpecies(input);
  return openHunt(state, want.strongest ? { strongest: true } : want.name ? { name: want.name } : undefined, want.name || want.strongest ? true : false);
}

/**
 * Engine-picked fight from this place's stock. `fallbackAny`: a named / "strongest" request that finds nothing
 * falls back to whatever is here (the player still gets a hunt). `guardOnly`: an ambush (guards only).
 */
function openHunt(
  state: GameState,
  pick: { strongest?: boolean; name?: string; guardOnly?: boolean } | undefined,
  fallbackAny: boolean
): HuntStart {
  const picked = pickHuntTarget(state, pick) ?? (fallbackAny ? pickHuntTarget(state) : null);
  if (!picked) {
    return {
      state,
      receipts: ['Wilds: nothing left to hunt here for now (the stock comes back with time)'],
      fact: 'You searched for game and found none: this ground has been hunted out for now.',
    };
  }
  const placeLabel = state.currentLocation ?? '';
  const foe = huntFoe(picked.target, placeLabel);
  const opened: GameState = { ...picked.state, activeEncounter: foe };
  return {
    state: opened,
    receipts: [],
    fightInput: `Attack ${foe.name}`,
  };
}

/** Add crafting materials, stacking by id. Never throws on a bare state; refuses when the pack is full. */
export function addMaterials(
  state: GameState,
  mats: CraftingMaterial[]
): { state: GameState; added: CraftingMaterial[]; refused?: string } {
  const have = Array.isArray(state.materials) ? state.materials : [];
  const count = mats.reduce((n, m) => n + m.quantity, 0);
  let room: { ok: boolean; reason?: string } = { ok: true };
  try {
    room = canAddMaterials({ ...state, materials: have }, count);
  } catch {
    room = { ok: true };
  }
  if (!room.ok) return { state, added: [], refused: room.reason };
  const next = [...have];
  for (const m of mats) {
    const i = next.findIndex((x) => x.id === m.id);
    if (i >= 0) next[i] = { ...next[i]!, quantity: next[i]!.quantity + m.quantity };
    else next.push({ ...m });
  }
  return { state: { ...state, materials: next }, added: mats };
}

/** The hide this creature level drops (HIDE_BY_TIER by tierForLevel). */
export function hideForLevel(level: number): CraftingMaterial {
  const tier = tierForLevel(level);
  const row = HIDE_BY_TIER[Math.max(0, Math.min(HIDE_BY_TIER.length - 1, tier - 1))]!;
  return { id: row.id, name: row.name, rarity: 'Common', quantity: 1, sourceType: 'material' };
}

/**
 * A table creature fell: spend its stock unit and drop its hide. Resources are never XP-gated — a gray or
 * budget-capped kill still drops. Humanoids (and anything not skinnable) drop no hide.
 */
export function applyWildsKillExtras(state: GameState, enc: ActiveEncounter): { state: GameState; receipts: string[] } {
  if (enc.levelSource !== 'table') return { state, receipts: [] };
  let next = state;
  const receipts: string[] = [];
  if (enc.speciesId) next = takeWildsKill(next, enc.speciesId, enc.wildsPlace);
  if (enc.skinnable && enc.creatureKind !== 'humanoid') {
    const hide = hideForLevel(enc.level);
    const put = addMaterials(next, [hide]);
    next = put.state;
    receipts.push(put.refused ? `Materials: no room for ${hide.name} (${put.refused})` : `Materials: ${hide.name} x1`);
  }
  return { state: next, receipts };
}

// ---------------------------------------------------------------------------
// Gather (herbs / ore) — XP-D1 OPEN5. Trade XP only; character XP is never touched.
// ---------------------------------------------------------------------------

export type GatherKind = 'ore' | 'herb';

/** Trade record ids (ride the named-skill record; never shown as a library skill). */
export const GATHER_TRADE: Readonly<Record<GatherKind, { id: string; name: string }>> = {
  herb: { id: 'trade-herbalism', name: 'Herbalism' },
  ore: { id: 'trade-mining', name: 'Mining' },
};

const GATHER_NOUN =
  /\b(?:herbs?|ore|ores|resources?|plants?|minerals?|copper|tin|iron|mithril|thorium|peacebloom|silverleaf|earthroot|mageroyal|briarthorn|kingsblood)\b/i;
const ORE_WORDS = /\b(?:ore|ores|mine|mining|miner|minerals?|copper|tin|iron|mithril|thorium)\b/i;
const HERB_WORDS = /\b(?:herbs?|herbalism|plants?|peacebloom|silverleaf|earthroot|mageroyal|briarthorn|kingsblood)\b/i;

/** True for the Gather pads and plain typed gathering ("I look for ore", "gather some herbs", "I go mining"). */
export function isGatherRequest(input: string): boolean {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (isGatherPad(t)) return true;
  if (/^(?:i\s+|we\s+|let'?s\s+|i'?ll\s+)?(?:go\s+|try\s+to\s+)?(?:gather|forage\s+for|harvest|pick|collect|dig\s+for|mine)\b/i.test(t) && GATHER_NOUN.test(t)) {
    return true;
  }
  if (/^(?:i\s+|we\s+)?(?:go\s+)?(?:look|search|hunt|forage|dig)\s+for\s+(?:some\s+|any\s+)?(?:ore|herbs?|resources?|minerals?|plants?)\b/i.test(t)) {
    return true;
  }
  return /^(?:i\s+)?(?:go\s+)?(?:mining|herb\s*gathering)\b/i.test(t);
}

function wantedKind(input: string): GatherKind | undefined {
  const t = (input ?? '').toLowerCase();
  if (/take up mining/.test(t)) return 'ore';
  if (/take up herbalism/.test(t)) return 'herb';
  const ore = ORE_WORDS.test(t);
  const herb = HERB_WORDS.test(t);
  if (ore && !herb) return 'ore';
  if (herb && !ore) return 'herb';
  return undefined;
}

function tradeRank(state: GameState, kind: GatherKind): number {
  const rec = (state.character?.namedSkills ?? []).find((r) => r.id === GATHER_TRADE[kind].id);
  return Math.max(0, Math.floor(rec?.level ?? 0));
}

/** The material a node yields: its own tier at/above the unlock rank, else the common tier-1 stuff. */
export function gatherMaterial(kind: GatherKind, tier: number, full: boolean): CraftingMaterial {
  const table = kind === 'ore' ? ORE_BY_TIER : HERB_BY_TIER;
  const t = full ? tier : 1;
  const row = table[Math.max(0, Math.min(table.length - 1, t - 1))]!;
  return { id: row.id, name: row.name, rarity: 'Common', quantity: 1, sourceType: 'material' };
}

/**
 * Resolve a Gather turn. Null = not a gather request (or not LitRPG / Story RPG, or a fight is live): the normal
 * path runs. Never rejects free text: indoors, with nothing growing, or with an empty node the turn still happens
 * and the writer gets one engine fact.
 *
 * Order: ambush check (guards alive and the grace window shut: GUARD_AMBUSH_BASE x share alive, from the guards
 * only; a hit opens a normal Hunt fight and nothing is gathered this turn) -> trade roll (at/above the node tier's
 * unlock rank always; below it, GATHER_BELOW_UNLOCK_CHANCE for a common yield) -> materials via addMaterials (a full
 * pouch is refused honestly, nothing spent) -> one node unit spent -> trade rank by use through settleSkillUse.
 */
export function startGatherFromInput(state: GameState, input: string): HuntStart | null {
  if (!gatherModeOk(state)) return null;
  if (!isGatherRequest(input)) return null;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return null;
  if (!state.openingEstablishment?.complete) return null;
  if (!isOutdoorWildsPlace(state)) {
    return { state, receipts: [], fact: 'There is nothing to gather here; herbs and ore grow out in the wild country.' };
  }
  let s = ensureNodeStock(ensureWilds(state));
  const placeId = wildsPlaceId(s);
  const stock = s.nodeStockByPlace?.[placeId];
  const kind = wantedKind(input);
  const kindWord = kind === 'ore' ? 'ore' : kind === 'herb' ? 'herbs' : 'herbs or ore';
  const nodes = stock?.nodes ?? [];
  if (!nodes.some((n) => !kind || n.kind === kind)) {
    return { state: s, receipts: [], fact: `You look for ${kindWord}, but none grows on this ground.` };
  }
  const live = nodes.filter((n) => n.stock > 0 && (!kind || n.kind === kind));
  if (!live.length) {
    return {
      state: s,
      receipts: [`Wilds: nothing left to gather here for now (it grows back with time)`],
      fact: `You look for ${kindWord}, but this ground has been picked clean for now.`,
    };
  }

  // Ambush: guards still about and the quiet window shut.
  const hour = wildsNowHour(s);
  if (!gatheringIsSafe(s)) {
    const wilds: WildsStock | undefined = s.wildsByPlace?.[placeId];
    const chance = guardAmbushChance(wilds);
    const roll = createHashRng(s.seed ?? 's', 'ambush', placeId, s.turn ?? 0, hour)();
    if (roll < chance) {
      const hunt = openHunt(s, { guardOnly: true }, false);
      if (hunt.fightInput) {
        return {
          ...hunt,
          receipts: ['Wilds: something guarding this ground comes at you while you gather', ...hunt.receipts],
          fact: 'While you were gathering, a creature that guards this ground came at you.',
        };
      }
    }
  }

  const rng = createHashRng(s.seed ?? 's', 'gather', placeId, s.turn ?? 0, hour);
  const node: ResourceNode = live[Math.min(live.length - 1, Math.floor(rng() * live.length))]!;
  const trade = GATHER_TRADE[node.kind];
  const rank = tradeRank(s, node.kind);
  const unlock = gatherUnlockRankForTier(node.tier);
  const full = rank >= unlock;
  const receipts: string[] = [];

  let quietLine: string | null = null;
  {
    const q = takeQuietNotice(s);
    s = q.state;
    if (q.show) quietLine = 'Wilds: the area is quiet';
  }
  if (quietLine) receipts.push(quietLine);

  if (!full && rng() >= GATHER_BELOW_UNLOCK_CHANCE) {
    receipts.push(`Wilds: you search the ground and find nothing worth taking (${trade.name} ${unlock} opens this)`);
    return { state: s, receipts, fact: `You searched for ${kindWord} but found nothing usable; this kind wants more practice.` };
  }

  const mat = gatherMaterial(node.kind, node.tier, full);
  const bonus = full && rng() < Math.min(0.5, 0.1 + (rank - unlock) * 0.02) ? 1 : 0;
  const put = addMaterials(s, [{ ...mat, quantity: 1 + bonus }]);
  if (put.refused) {
    receipts.push(`Materials: no room for ${mat.name} — free a slot first (${put.refused})`);
    return {
      state: s,
      receipts,
      fact: `You found ${mat.name} but your pack is full; free a material slot before gathering again.`,
    };
  }
  s = takeNodeUnit(put.state, node.id);
  receipts.push(`Materials: ${mat.name} x${1 + bonus}`);

  // Rank by use: the same growth path every named skill uses (soft cap 2L+3, WoW grey rule). Trade XP only.
  const charXp = s.character.xp;
  const settled = settleSkillUse(s, input, { trade, success: true, taskLevel: unlock });
  s = settled.state;
  if (s.character.xp !== charXp) s = { ...s, character: { ...s.character, xp: charXp } };
  receipts.push(...settled.receipts);

  return {
    state: s,
    receipts,
    fact: `You gathered ${mat.name} x${1 + bonus} from the ${node.kind === 'ore' ? 'ore seam' : 'herb patch'} here.`,
  };
}

const CRAFT_RE = /^craft at a workshop\b|^i craft\b|^make (?:a |some )?leather\b/i;
const BREW_RE = /^brew at camp or inn\b|^i brew\b|^brew (?:a |some )?(?:tonic|restorative|tea)\b/i;

export function isCraftRequest(input: string): boolean {
  return CRAFT_RE.test((input ?? '').replace(/\s+/g, ' ').trim());
}
export function isBrewRequest(input: string): boolean {
  return BREW_RE.test((input ?? '').replace(/\s+/g, ' ').trim());
}

function takeMaterials(
  state: GameState,
  id: string,
  qty: number
): { state: GameState; took: number } {
  const mats = [...(state.materials ?? [])];
  let need = qty;
  for (let i = 0; i < mats.length && need > 0; i++) {
    const m = mats[i]!;
    if (m.id !== id) continue;
    const use = Math.min(m.quantity, need);
    mats[i] = { ...m, quantity: m.quantity - use };
    need -= use;
  }
  return {
    state: { ...state, materials: mats.filter((m) => m.quantity > 0) },
    took: qty - need,
  };
}

function professionRank(state: GameState, type: string): number {
  const p = (state.character?.professions ?? []).find((x) => x.type === type);
  return Math.max(1, p?.level ?? 1);
}

/**
 * Leatherworking craft: consume one hide tier → a Common/Uncommon leather kit item of that tier's itemLevel.
 * Rank-gated; ranks by use (trade XP only). Settlement workshop / free text.
 */
export function startCraftFromInput(state: GameState, input: string): HuntStart | null {
  if (!gatherModeOk(state)) return null;
  if (!isCraftRequest(input)) return null;
  if (state.activeEncounter) return null;
  const hides = (state.materials ?? []).filter((m) => /leather/i.test(m.id) || /leather/i.test(m.name));
  if (!hides.length) {
    return { state, receipts: [], fact: 'You have no hides to work at a workshop.' };
  }
  const hide = hides.sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))[0]!;
  const tier =
    HIDE_BY_TIER.findIndex((h) => h.id === hide.id) >= 0
      ? HIDE_BY_TIER.findIndex((h) => h.id === hide.id) + 1
      : 1;
  const unlock = gatherUnlockRankForTier(tier);
  const rank = professionRank(state, 'Leatherworking');
  if (rank < unlock) {
    return {
      state,
      receipts: [`Wilds: Leatherworking ${unlock} opens this hide tier (you are ${rank})`],
      fact: `This hide needs more Leatherworking practice before you can shape it.`,
    };
  }
  const spent = takeMaterials(state, hide.id, 1);
  if (spent.took < 1) {
    return { state, receipts: [], fact: 'You have no hides to work at a workshop.' };
  }
  let s = spent.state;
  const itemLevel = Math.max(1, tier * 3);
  const rarity = rank >= unlock + 5 ? 'Uncommon' : 'Common';
  const id = `craft-leather-${tier}-${s.turn ?? 0}`;
  const item = {
    id,
    name: `Leather kit (tier ${tier})`,
    rarity: rarity as 'Common' | 'Uncommon',
    quantity: 1,
    itemType: 'armor' as const,
    itemLevel,
    baseValue: Math.round(5 * (1 + 0.15 * (itemLevel - 1))),
    provenance: 'Workshop craft',
  };
  s = { ...s, inventory: [...(s.inventory ?? []), item] };
  const charXp = s.character.xp;
  const settled = settleSkillUse(s, input, {
    trade: { id: 'trade-leatherworking', name: 'Leatherworking' },
    success: true,
    taskLevel: unlock,
  });
  s = settled.state;
  if (s.character.xp !== charXp) s = { ...s, character: { ...s.character, xp: charXp } };
  // Ensure profession row exists / rises with skill settle if the settle path wrote skills only.
  const professions = [...(s.character.professions ?? [])];
  const idx = professions.findIndex((p) => p.type === 'Leatherworking');
  if (idx < 0) {
    professions.push({ type: 'Leatherworking', level: Math.min(50, Math.max(rank, 1)), maxLevel: 50 });
  }
  s = { ...s, character: { ...s.character, professions } };
  return {
    state: s,
    receipts: [`Craft: ${item.name} (level ${itemLevel}, ${rarity})`, ...settled.receipts],
    fact: `At the workshop you worked ${hide.name} into ${item.name}.`,
  };
}

/** Brew a basic restorative from one herb unit (Herbalism rank-gated). Camp or inn. */
export function startBrewFromInput(state: GameState, input: string): HuntStart | null {
  if (!gatherModeOk(state)) return null;
  if (!isBrewRequest(input)) return null;
  if (state.activeEncounter) return null;
  const herbs = (state.materials ?? []).filter((m) =>
    HERB_BY_TIER.some((h) => h.id === m.id) || /bloom|leaf|root|thorn|blood|herb/i.test(m.name)
  );
  if (!herbs.length) {
    return { state, receipts: [], fact: 'You have no herbs to brew.' };
  }
  const herb = herbs[0]!;
  const tier =
    HERB_BY_TIER.findIndex((h) => h.id === herb.id) >= 0
      ? HERB_BY_TIER.findIndex((h) => h.id === herb.id) + 1
      : 1;
  const unlock = gatherUnlockRankForTier(Math.max(1, tier));
  const rank = professionRank(state, 'Herbalism');
  if (rank < Math.max(1, unlock - 5)) {
    return {
      state,
      receipts: [`Wilds: Herbalism practice opens brewing (you are ${rank})`],
      fact: 'You are not sure enough of these herbs to brew yet.',
    };
  }
  const spent = takeMaterials(state, herb.id, 1);
  if (spent.took < 1) return { state, receipts: [], fact: 'You have no herbs to brew.' };
  let s = spent.state;
  const item = {
    id: `brew-tonic-${s.turn ?? 0}`,
    name: 'Simple restorative',
    rarity: 'Common' as const,
    quantity: 1,
    itemType: 'consumable' as const,
    provenance: 'Camp brew',
  };
  s = { ...s, inventory: [...(s.inventory ?? []), item] };
  const charXp = s.character.xp;
  const settled = settleSkillUse(s, input, {
    trade: { id: 'trade-herbalism', name: 'Herbalism' },
    success: true,
    taskLevel: unlock,
  });
  s = settled.state;
  if (s.character.xp !== charXp) s = { ...s, character: { ...s.character, xp: charXp } };
  return {
    state: s,
    receipts: [`Brew: ${item.name} from ${herb.name}`, ...settled.receipts],
    fact: `You brewed a simple restorative from ${herb.name}.`,
  };
}

/**
 * Consume stored mats when a gather-quest objective names the material.
 * Same giver repeats: XP reduced via existing quest ladder; different giver pays full (caller).
 */
export function consumeGatherQuestMats(
  state: GameState,
  materialNameOrId: string,
  qty = 1
): { state: GameState; consumed: number; receipts: string[] } {
  const key = materialNameOrId.toLowerCase();
  const hit = (state.materials ?? []).find(
    (m) => m.id.toLowerCase() === key || m.name.toLowerCase() === key || m.name.toLowerCase().includes(key)
  );
  if (!hit) return { state, consumed: 0, receipts: [] };
  const spent = takeMaterials(state, hit.id, qty);
  return {
    state: spent.state,
    consumed: spent.took,
    receipts: spent.took > 0 ? [`Materials: turned in ${hit.name} x${spent.took}`] : [],
  };
}

const HAND_OVER_RE = /^hand over the materials\b/i;

/**
 * XP-D1 OPEN6 — "Hand over the materials" pad / typed line: spend mats for the matching gather-quest
 * objective and mark that objective complete. Quest XP stays on the normal quest path (caller / sandbox).
 */
export function startHandOverMaterialsFromInput(state: GameState, input: string): HuntStart | null {
  if (!gatherModeOk(state)) return null;
  if (!HAND_OVER_RE.test((input ?? '').trim())) return null;
  const mats = state.materials ?? [];
  if (!mats.length) {
    return { state, receipts: [], fact: 'You have no materials to hand over.' };
  }
  for (const q of state.quests ?? []) {
    if (!q.revealed || (q.status !== 'active' && q.status !== 'available')) continue;
    for (const o of q.objectives ?? []) {
      if (o.completed) continue;
      const targetName = typeof o.target === 'object' && o.target ? o.target.name : '';
      const text = `${o.description ?? ''} ${o.object ?? ''} ${targetName} ${o.id ?? ''}`.toLowerCase();
      if (!/\b(herb|ore|hide|leather|bloom|peacebloom|copper|iron|gather|collect|deliver|bring)\b/i.test(text)) {
        continue;
      }
      const qtyMatch = text.match(/\b(\d{1,3})\b/);
      const need = Math.max(1, qtyMatch ? parseInt(qtyMatch[1]!, 10) : 1);
      const hit = mats.find((m) => {
        const id = m.id.toLowerCase();
        const name = m.name.toLowerCase();
        return (
          text.includes(id)
          || text.includes(name)
          || (/\bherb/.test(text) && /bloom|leaf|herb|thorn|root|blood/.test(id + name))
          || (/\bore\b/.test(text) && /ore|copper|tin|iron|mithril|thorium/.test(id + name))
          || (/\b(hide|leather)\b/.test(text) && /leather|hide/.test(id + name))
        );
      });
      if (!hit || (hit.quantity ?? 0) < need) continue;
      const spent = consumeGatherQuestMats(state, hit.id, need);
      if (spent.consumed < need) {
        return { state, receipts: [], fact: `You still need more ${hit.name} before you can hand them over.` };
      }
      const quests = (spent.state.quests ?? []).map((qq) => {
        if (qq.id !== q.id) return qq;
        const objectives = (qq.objectives ?? []).map((oo) =>
          oo.id === o.id ? { ...oo, completed: true } : oo
        );
        const allDone = objectives.every((oo) => oo.completed || oo.optional);
        return {
          ...qq,
          objectives,
          status: allDone ? ('completed' as const) : qq.status,
        };
      });
      return {
        state: { ...spent.state, quests },
        receipts: [...spent.receipts, `Quest: handed over ${hit.name} x${spent.consumed}`],
        fact: `You handed over ${hit.name} (x${spent.consumed}) for the job.`,
      };
    }
  }
  return { state, receipts: [], fact: 'No open job is waiting for these materials right now.' };
}
