import type { GameState } from './types';

const COMPANION_REFERENCE =
  /\b(?:my|our|the|your)?\s*(?:companion|party member|party members|party group|teammate|sidekick|familiar|mount)\b/i;
const COMPANION_ACQUISITION =
  /\b(?:find|seek|search for|look for|recruit|hire|summon|tame|befriend)\b/i;
const NAMED_INTERACTION =
  /\b(?:ask|tell|consult|command|order|heal|speak (?:to|with)|talk (?:to|with))\s+(?:the\s+)?([A-Z][\p{L}\p{N}'-]{1,40})\b/u;
const GENERIC_SCENE_ROLES = new Set([
  'around', 'locals', 'guard', 'guards', 'merchant', 'innkeeper', 'bartender', 'villager',
  'villagers', 'stranger', 'prisoner', 'enemy',
]);

const ITEM_USE_CLAIM =
  /\b(?:use|throw|lob|toss|drink|eat|equip|wield|draw|deploy|detonate|fire|load|pull(?:\s+out)?|unsheathe|brandish)\s+(?:(?:a|an|the|my|your)\s+)?([a-z][\w'\-]+(?:\s+[a-z][\w'\-]+){0,3})/i;

const GOLD_SPEND_CLAIM =
  /\b(?:pay|bribe|spend|offer|buy|purchase|tip|donate|bet)\b[^.]{0,48}?\b(\d{1,7})\s*(?:gold|gp|coins?|crowns?)\b/i;

const NON_ITEM_TOKENS = new Set([
  'breath', 'lever', 'door', 'curtain', 'attention', 'cover', 'aim', 'time', 'distance',
  'sword arm', 'hand', 'hands', 'fist', 'fists', 'voice', 'gaze', 'look', 'step', 'stance',
]);

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function knownEntityNames(state: GameState): Set<string> {
  const names = new Set<string>();
  const addName = (name: string) => {
    const normalized = normalize(name);
    names.add(normalized);
    const firstName = normalized.split(/\s+/)[0];
    if (firstName) names.add(firstName);
  };
  for (const companion of state.companions ?? []) addName(companion.name);
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc') addName(card.name);
  }
  if (state.activeEncounter?.name) addName(state.activeEncounter.name);
  return names;
}

function inventoryCatalog(state: GameState): string[] {
  return [
    ...state.inventory.map((i) => normalize(i.name)),
    ...state.materials.map((m) => normalize(m.name)),
  ];
}

export function inventoryHasItem(state: GameState, claimed: string): boolean {
  const needle = normalize(claimed);
  if (!needle || NON_ITEM_TOKENS.has(needle)) return true;

  // Generic "weapon" / "blade" allowed if any equipped/weapon-like item exists.
  if (/^(weapon|blade|sword|gun|bow|staff|wand)$/i.test(needle)) {
    return state.inventory.some(
      (i) =>
        i.equipped ||
        /weapon|sword|blade|bow|gun|axe|mace|dagger|staff|wand|crossbow/i.test(i.name)
    );
  }

  const catalog = inventoryCatalog(state);
  return catalog.some(
    (name) => name === needle || name.includes(needle) || needle.includes(name)
  );
}

/**
 * Detect player-input claims that use items not present in structured inventory.
 * Used to inject an inventory gate into the GM context prompt.
 */
export function findUnsupportedItemClaims(input: string, state: GameState): string[] {
  const claims: string[] = [];
  const re = new RegExp(ITEM_USE_CLAIM.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const claimed = (m[1] ?? '').trim();
    if (!claimed || NON_ITEM_TOKENS.has(normalize(claimed))) continue;
    if (!inventoryHasItem(state, claimed)) claims.push(claimed);
  }
  return Array.from(new Set(claims));
}

/**
 * Suggestions are untrusted model output. Reject actions whose premise requires a companion,
 * named actor, inventory item, or gold amount that is absent from structured state.
 */
export function isSuggestionValidForState(suggestion: string, state: GameState): boolean {
  const companions = state.companions ?? [];
  const referencesCompanion = COMPANION_REFERENCE.test(suggestion);

  if (referencesCompanion && companions.length === 0 && !COMPANION_ACQUISITION.test(suggestion)) {
    return false;
  }

  const namedTarget = suggestion.match(NAMED_INTERACTION)?.[1];
  if (
    namedTarget
    && !GENERIC_SCENE_ROLES.has(normalize(namedTarget))
    && !knownEntityNames(state).has(normalize(namedTarget))
  ) {
    return false;
  }

  const itemClaim = suggestion.match(ITEM_USE_CLAIM)?.[1];
  if (itemClaim && !inventoryHasItem(state, itemClaim)) {
    return false;
  }

  const goldMatch = suggestion.match(GOLD_SPEND_CLAIM);
  if (goldMatch) {
    const amount = Number(goldMatch[1]);
    if (Number.isFinite(amount) && amount > (state.gold ?? 0)) {
      return false;
    }
  }

  return true;
}

export function fallbackSuggestionForState(state: GameState): string {
  if (state.activeEncounter) return 'Assess the enemy and surroundings';
  if (state.activeDungeon || state.currentLocation) return 'Inspect the immediate surroundings';
  return 'Observe the environment carefully';
}
