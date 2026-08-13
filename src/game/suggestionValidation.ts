import type { GameState } from './types';

const COMPANION_REFERENCE =
  /\b(?:my|our|the|your)?\s*(?:companion|party member|party members|party group|teammate|sidekick|familiar|mount)\b/i;
const COMPANION_ACQUISITION =
  /\b(?:find|seek|search for|look for|recruit|hire|summon|tame|befriend)\b/i;
const NAMED_INTERACTION =
  /\b(?:ask|tell|consult|command|order|heal|speak (?:to|with)|talk (?:to|with))\s+(?:the\s+)?([A-Z][\p{L}\p{N}'-]{1,40})\b/u;
const GENERIC_SCENE_ROLES = new Set([
  'around', 'locals', 'guard', 'guards', 'merchant', 'innkeeper', 'bartender', 'villager',
  'villagers', 'stranger', 'prisoner', 'enemy', 'enemies', 'figure', 'silhouette', 'crowd',
]);

/** Soft interactable / invented object claims in choices or free text. */
const NAMED_INTERACTABLE_CLAIM =
  /\b(?:inspect|examine|open|search|check|test|heft|take|grab|pick\s+up|approach|activate|pull|push|read|unlock|loot|rummage(?:\s+through)?)\s+(?:(?:the\s+heft\s+of\s+)?(?:a|an|the|my|your)\s+)?([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,3})\b/gi;

/** Named creature / foe targeted by combat or stealth reactions. */
const NAMED_THREAT_CLAIM =
  /\b(?:attack|fight|strike|kill|slay|ambush|stalk|engage|charge|hide\s+from|sneak\s+(?:past|around|away\s+from)|flee\s+(?:from|the)|retreat\s+from|watch|study|scan|assess)\s+(?:(?:a|an|the)\s+)?([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,3})\b/gi;

/** Verbs that imply using a specific inventory item. */
const ITEM_USE_CLAIM =
  /\b(?:use|throw|lob|toss|drink|eat|equip|wield|draw|deploy|detonate|fire|load|pull(?:\s+out)?|unsheathe|brandish)\s+(?:(?:a|an|the|my|your)\s+)?([a-z][\w'\-]+(?:\s+[a-z][\w'\-]+){0,3})/i;

/** Combat verbs that only count when a named weapon follows (swing/slash your shortsword). */
const WEAPON_USE_CLAIM =
  /\b(?:swing|slash|stab|strike|cleave|thrust|parry|block|attack|hit|shoot)\s+(?:(?:with|using)\s+)?(?:(?:a|an|the|my|your)\s+)?((?:short|long|great|bastard)\s*swords?|shortswords?|longswords?|greatswords?|daggers?|handaxes?|battleaxes?|warhammers?|maces?|scimitars?|rapiers?|katanas?|cutlasses?|crossbows?|longbows?|shortbows?|spears?|halberds?|quarterstaffs?|staves|staffs?|wands?|clubs?|pistols?|rifles?)\b/i;

/** "I had a sword" / "realize I have a dagger" — only weapon/consumable-like nouns. */
const ITEM_POSSESSION_CLAIM =
  /\b(?:(?:i\s+)?(?:had|have|got|possess)|(?:realiz(?:e|ed)|remember(?:ed)?)\s+(?:i\s+)?(?:had|have|got))\s+(?:a|an|the|my)\s+((?:short|long|great|bastard)\s*swords?|shortswords?|longswords?|greatswords?|daggers?|axes?|bows?|crossbows?|staves|staffs?|wands?|maces?|spears?|pistols?|rifles?|grenades?|potions?|draughts?|elixirs?|swords?|blades?|guns?)\b/i;

/** Named weapons that must exist in inventory when mentioned as gear. */
const NAMED_WEAPON =
  /\b((?:short|long|great|bastard)\s*swords?|shortswords?|longswords?|greatswords?|daggers?|handaxes?|battleaxes?|warhammers?|maces?|morningstars?|scimitars?|rapiers?|katanas?|cutlasses?|sabers?|sabres?|crossbows?|longbows?|shortbows?|spears?|halberds?|quarterstaffs?|quarterstaves|staves|staffs?|wands?|clubs?|flails?|glaives?|tridents?|pistols?|rifles?|shotguns?|grenades?)\b/gi;

const GOLD_SPEND_CLAIM =
  /\b(?:pay|bribe|spend|offer|buy|purchase|tip|donate|bet)\b[^.]{0,48}?\b(\d{1,7})\s*(?:gold|gp|coins?|crowns?)\b/i;

const NON_ITEM_TOKENS = new Set([
  'breath', 'lever', 'door', 'curtain', 'attention', 'cover', 'aim', 'time', 'distance',
  'sword arm', 'hand', 'hands', 'fist', 'fists', 'voice', 'gaze', 'look', 'step', 'stance',
  'creature', 'enemy', 'ground', 'position', 'surroundings', 'area', 'threat', 'threats',
  'immediate surroundings', 'environment', 'room', 'scene', 'path', 'corridor', 'alley',
  'gate', 'window', 'wall', 'floor', 'ceiling', 'shadows', 'darkness', 'light', 'air',
]);

/** Scene nouns that are allowed without an explicit location-sheet entry. */
const GENERIC_SCENE_NOUNS = new Set([
  ...NON_ITEM_TOKENS,
  ...GENERIC_SCENE_ROLES,
  'surroundings', 'environment', 'room', 'chamber', 'hall', 'hallway', 'street', 'road',
  'path', 'trail', 'exit', 'entrance', 'stairs', 'ladder', 'bridge', 'table', 'chair',
  'bed', 'chest', 'box', 'crate', 'barrel', 'sign', 'poster',
  'note', 'letter', 'book', 'shelf', 'counter', 'bar', 'hearth', 'fire', 'torch',
  'lantern', 'keyhole', 'lock', 'rubble', 'debris', 'blood', 'tracks', 'footprints',
  'noise', 'sound', 'voice', 'voices', 'crowd', 'people', 'body', 'corpse', 'remains',
  'weapon', 'gear', 'equipment', 'armor', 'shield', 'cloak', 'boots', 'gloves',
  'companion', 'party', 'ally', 'allies', 'self', 'myself', 'yourself', 'horizon',
  'sky', 'trees', 'forest', 'water', 'river', 'lake', 'sea', 'cave', 'tunnel',
  'nearest enemy', 'active threat', 'immediate threat',
]);

const SWORD_LIKE = /sword|scimitar|rapier|katana|cutlass|saber|sabre|blade/i;
const BOW_LIKE = /\bbow|crossbow/i;
const STAFF_LIKE = /\bstaff|stave|quarterstaff|wand\b/i;
const GUN_LIKE = /pistol|rifle|shotgun|gun|firearm/i;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function addNameTokens(names: Set<string>, name: string) {
  const normalized = normalize(name);
  if (!normalized) return;
  names.add(normalized);
  for (const part of normalized.split(/\s+/)) {
    if (part.length >= 3) names.add(part);
  }
}

/**
 * Tokens considered "established" for choice / free-text grounding:
 * inventory, companions, encounter, lore, location sheet, timeline, NPC memory, turn prose.
 */
export function buildGroundingCorpus(state: GameState, storyProse = ''): Set<string> {
  const names = new Set<string>();
  for (const item of state.inventory ?? []) addNameTokens(names, item.name);
  for (const mat of state.materials ?? []) addNameTokens(names, mat.name);
  for (const bag of state.containers ?? []) addNameTokens(names, bag.name);
  for (const companion of state.companions ?? []) addNameTokens(names, companion.name);
  for (const card of state.lorebook ?? []) {
    if (card.revealed === true || (card.lastSeenTurn ?? 0) > 0) addNameTokens(names, card.name);
  }
  if (state.activeEncounter?.name) addNameTokens(names, state.activeEncounter.name);
  if (state.currentLocation) addNameTokens(names, state.currentLocation);
  if (state.locationSheet?.name) addNameTokens(names, state.locationSheet.name);
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name) addNameTokens(names, it.name);
  }
  for (const exit of state.locationSheet?.exits ?? []) {
    if (exit.label) addNameTokens(names, exit.label);
  }
  for (const fact of state.timeline ?? []) addNameTokens(names, fact.text);
  for (const mem of state.npcMemories ?? []) addNameTokens(names, mem.npcName);
  if (storyProse) {
    // Index significant words from turn prose (length >= 4) so "the rusted lever" grounds.
    for (const token of storyProse.toLowerCase().match(/[a-z][\w'-]{3,}/g) ?? []) {
      names.add(token);
    }
  }
  return names;
}

function knownEntityNames(state: GameState, storyProse = ''): Set<string> {
  const names = buildGroundingCorpus(state, storyProse);
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc') addNameTokens(names, card.name);
  }
  return names;
}

function inventoryCatalog(state: GameState): string[] {
  return [
    ...state.inventory.map((i) => normalize(i.name)),
    ...state.materials.map((m) => normalize(m.name)),
    ...(state.containers ?? []).map((c) => normalize(c.name)),
  ];
}

export function inventoryHasItem(state: GameState, claimed: string): boolean {
  const needle = normalize(claimed);
  if (!needle || NON_ITEM_TOKENS.has(needle)) return true;

  // Generic category words require a matching category in inventory — not "any weapon".
  if (/^(weapon|blade)$/i.test(needle)) {
    return state.inventory.some(
      (i) =>
        i.equipped ||
        /weapon|sword|blade|bow|gun|axe|mace|dagger|staff|wand|crossbow|spear/i.test(i.name)
    );
  }
  if (/^sword$/i.test(needle)) {
    return inventoryCatalog(state).some((name) => SWORD_LIKE.test(name));
  }
  if (/^bow$/i.test(needle)) {
    return inventoryCatalog(state).some((name) => BOW_LIKE.test(name));
  }
  if (/^(staff|wand)$/i.test(needle)) {
    return inventoryCatalog(state).some((name) => STAFF_LIKE.test(name));
  }
  if (/^gun$/i.test(needle)) {
    return inventoryCatalog(state).some((name) => GUN_LIKE.test(name));
  }

  const catalog = inventoryCatalog(state);
  return catalog.some(
    (name) => name === needle || name.includes(needle) || needle.includes(name)
  );
}

function collectUnsupportedClaims(input: string, state: GameState, patterns: RegExp[]): string[] {
  const claims: string[] = [];
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      const claimed = (m[1] ?? '').trim();
      if (!claimed || NON_ITEM_TOKENS.has(normalize(claimed))) continue;
      if (!inventoryHasItem(state, claimed)) claims.push(claimed);
    }
  }
  return claims;
}

function collectNamedWeaponClaims(input: string, state: GameState): string[] {
  const claims: string[] = [];
  const re = new RegExp(NAMED_WEAPON.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const claimed = (m[1] ?? '').trim();
    if (!claimed) continue;
    if (!inventoryHasItem(state, claimed)) claims.push(claimed);
  }
  return claims;
}

/**
 * Detect player-input claims that use items not present in structured inventory.
 * Used to inject an inventory gate into the GM context prompt.
 */
export function findUnsupportedItemClaims(input: string, state: GameState): string[] {
  const claims = [
    ...collectUnsupportedClaims(input, state, [ITEM_USE_CLAIM, WEAPON_USE_CLAIM, ITEM_POSSESSION_CLAIM]),
    ...collectNamedWeaponClaims(input, state),
  ];
  return Array.from(new Set(claims.map(normalize)));
}

function isTokenGrounded(claimed: string, corpus: Set<string>): boolean {
  const needle = normalize(claimed);
  if (!needle) return true;
  if (GENERIC_SCENE_NOUNS.has(needle)) return true;
  if (corpus.has(needle)) return true;
  // Multi-word: require each meaningful token OR the full phrase in corpus.
  const parts = needle.split(/\s+/).filter((p) => p.length >= 3 && !GENERIC_SCENE_NOUNS.has(p));
  if (parts.length === 0) return true;
  if (parts.every((p) => corpus.has(p))) return true;
  for (const known of corpus) {
    if (known.includes(needle) || needle.includes(known)) return true;
  }
  return false;
}

/**
 * Named interactables / creatures referenced by a choice that are absent from
 * state, timeline, location sheet, and current turn prose.
 */
export function findUngroundedNamedClaims(
  text: string,
  state: GameState,
  storyProse = ''
): string[] {
  const corpus = buildGroundingCorpus(state, storyProse);
  const claims: string[] = [];
  for (const pattern of [NAMED_INTERACTABLE_CLAIM, NAMED_THREAT_CLAIM]) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const claimed = (m[1] ?? '').trim();
      if (!claimed) continue;
      if (!isTokenGrounded(claimed, corpus)) claims.push(claimed);
    }
  }
  return Array.from(new Set(claims.map(normalize)));
}

export function referencesAbsentCompanion(text: string, state: GameState): boolean {
  const companions = state.companions ?? [];
  return COMPANION_REFERENCE.test(text) && companions.length === 0 && !COMPANION_ACQUISITION.test(text);
}

/**
 * Suggestions are untrusted model output. Reject actions whose premise requires a companion,
 * named actor, inventory item, gold amount, or invented scene object absent from grounding.
 */
export function isSuggestionValidForState(
  suggestion: string,
  state: GameState,
  storyProse = ''
): boolean {
  if (referencesAbsentCompanion(suggestion, state)) return false;

  const namedTarget = suggestion.match(NAMED_INTERACTION)?.[1];
  if (
    namedTarget
    && !GENERIC_SCENE_ROLES.has(normalize(namedTarget))
    && !knownEntityNames(state, storyProse).has(normalize(namedTarget))
  ) {
    return false;
  }

  if (findUnsupportedItemClaims(suggestion, state).length > 0) return false;

  if (isLockedProgressionChoice(suggestion, state)) return false;

  if (findUngroundedNamedClaims(suggestion, state, storyProse).length > 0) return false;

  const goldMatch = suggestion.match(GOLD_SPEND_CLAIM);
  if (goldMatch) {
    const amount = Number(goldMatch[1]);
    if (Number.isFinite(amount) && amount > (state.gold ?? 0)) {
      return false;
    }
  }

  return true;
}

/** Reject choices that advertise locked / level-gated System features. */
export function isLockedProgressionChoice(choice: string, state: GameState): boolean {
  const text = choice.toLowerCase();
  if (/\block(?:ed)?\b/.test(text) && /\b(level|skill|class|menu|studies|profession|feature)\b/.test(text)) {
    return true;
  }
  const gated = text.match(/level\s*(\d+)\s*\+/) || text.match(/requires?\s+level\s*(\d+)/);
  if (gated) {
    const need = Number(gated[1]);
    if (Number.isFinite(need) && need > (state.character?.level ?? 1)) return true;
  }
  return false;
}

export function fallbackSuggestionForState(state: GameState): string {
  if (state.activeEncounter) return 'Assess the enemy and surroundings';
  if (state.activeDungeon || state.currentLocation) return 'Inspect the immediate surroundings';
  return 'Observe the environment carefully';
}
