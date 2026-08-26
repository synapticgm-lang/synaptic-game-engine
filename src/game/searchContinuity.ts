/**
 * Deterministic empty-search + weapon grounding (Class D).
 * Track places/containers established empty; block re-search loot invent
 * unless the player brings a new circumstance. Scrub ungrounded weapons.
 */

import type { GameState, Item, SceneFacts } from './types';
import { equippedWeaponName } from './ledgerCombat';

const SEARCH_ACTION =
  /\b(search|searches|searching|rummage|rummaging|scavenge|scavenging|look(?:ing)? (?:around|for|through)|dig(?:ging)?|sift(?:ing)?|check(?:ing)? (?:the )?(?:ash|rubble|debris|ruin|area|floor|ground)|inspect(?:ing)? (?:the )?(?:ruin|debris|rubble|ash))\b/i;

const EMPTY_CLAIM =
  /\b(?:(?:find(?:s|ing)?|found|yield(?:s|ed)?|offers?|reveals?)\s+(?:nothing|no(?:thing)?(?:\s+\w+){0,4})|nothing\s+(?:here|there|useful|of\s+use|left)|no\s+(?:immediate\s+)?(?:treasures?|loot|items?|gear|weapons?|tools?|hidden\s+compartments?)|picked\s+clean|fruitless|comes?\s+up\s+empty|empty[- ]handed|no\s+hidden|yields?\s+only\s+more)\b/i;

const NEW_CIRCUMSTANCE =
  /\b(?:torch|lantern|flashlight|bring(?:ing)?\s+(?:a\s+)?light|light\s+(?:the|a)|break(?:ing)?\s+(?:the\s+)?(?:floor|boards?|planks?|wall)|smash(?:ing)?|pry(?:ing)?|crowbar|different\s+room|next\s+room|basement|under\s+(?:the\s+)?floor|secret\s+(?:door|panel|compartment)|cut(?:ting)?\s+(?:open|through)|force\s+(?:open|apart))\b/i;

const LOOT_FIND =
  /\b(?:(?:find(?:s|ing)?|found|discover(?:s|ed|ing)?|uncover(?:s|ed|ing)?|pull(?:s|ed|ing)?\s+(?:out|free)|spot(?:s|ted)?)\s+(?:a|an|the|some)\s+[\w\s-]{0,40}(?:dagger|knife|sword|blade|axe|coin(?:s)?|gold|pouch|gem|ring|amulet|key|potion|vial|scroll|weapon|blade)|(?:glint(?:s|ing)?|gleam(?:s|ing)?)\s+(?:of|from)\s+(?:metal|steel|silver|a\s+blade))\b/i;

/** Normalize a search target key for this location / action. */
export function normalizeSearchTarget(
  playerInput: string,
  locationHint?: string
): string {
  const text = `${playerInput} ${locationHint ?? ''}`.toLowerCase();
  if (/\b(bag|backpack|pockets?|kit)\b/.test(text)) return 'bag';
  if (/\b(exterior|outside|out\s+of)\b/.test(text)) return 'exterior';
  if (/\b(basement|cellar)\b/.test(text)) return 'basement';
  if (/\b(debris|rubble|ash|dirt)\b/.test(text)) return 'debris';
  if (/\b(ruin|husk|building|store(?:front)?|interior|inside|room)\b/.test(text)) {
    return 'here';
  }
  const loc = (locationHint ?? '').trim().toLowerCase();
  if (loc) return `loc:${loc.slice(0, 48)}`;
  return 'here';
}

export function isSearchAction(playerInput: string): boolean {
  return SEARCH_ACTION.test(playerInput ?? '');
}

export function claimsSearchEmpty(narrative: string): boolean {
  return EMPTY_CLAIM.test(narrative ?? '');
}

export function hasNewSearchCircumstance(playerInput: string): boolean {
  return NEW_CIRCUMSTANCE.test(playerInput ?? '');
}

export function listEmptySearchTargets(facts?: SceneFacts | null): string[] {
  return [...(facts?.searchedEmpty ?? []), ...(facts?.emptyContainers ?? [])];
}

export function isSearchTargetEmpty(
  facts: SceneFacts | undefined | null,
  target: string
): boolean {
  const keys = listEmptySearchTargets(facts);
  if (!keys.length) return false;
  const t = target.toLowerCase();
  return keys.some((k) => k === t || (t === 'here' && (k === 'debris' || k === 'exterior')));
}

/** Record empty after a search beat that found nothing. */
export function recordEmptySearch(
  facts: SceneFacts | undefined,
  target: string,
  turn: number
): SceneFacts {
  const base = facts ?? {
    crowd: 'unknown' as const,
    noise: 'unknown' as const,
    present: [] as string[],
    props: [] as string[],
    lastBeat: '',
    updatedTurn: turn,
  };
  const key = target.toLowerCase().trim() || 'here';
  const searchedEmpty = Array.from(new Set([...(base.searchedEmpty ?? []), key]));
  const emptyContainers =
    key === 'bag' || /box|crate|chest|barrel|trunk|pouch|sack/.test(key)
      ? Array.from(new Set([...(base.emptyContainers ?? []), key]))
      : [...(base.emptyContainers ?? [])];
  return {
    ...base,
    searchedEmpty,
    emptyContainers,
    updatedTurn: turn,
    lastBeat: base.lastBeat
      ? `${base.lastBeat}; searched ${key} — empty`
      : `searched ${key} — empty`,
  };
}

/** Clear empty flag when player brings a real new circumstance for that target. */
export function clearEmptySearchOnCircumstance(
  facts: SceneFacts | undefined,
  playerInput: string,
  target: string
): SceneFacts | undefined {
  if (!facts || !hasNewSearchCircumstance(playerInput)) return facts;
  const key = target.toLowerCase();
  const searchedEmpty = (facts.searchedEmpty ?? []).filter((k) => k !== key);
  const emptyContainers = (facts.emptyContainers ?? []).filter((k) => k !== key);
  return { ...facts, searchedEmpty, emptyContainers };
}

/**
 * After a committed GM beat: if player searched and prose says empty, stamp the target.
 * If player searches an already-empty target without new circumstance, keep the stamp.
 */
export function applySearchContinuityToFacts(
  facts: SceneFacts | undefined,
  playerInput: string,
  narrative: string,
  turn: number,
  locationHint?: string
): SceneFacts | undefined {
  if (!isSearchAction(playerInput)) return facts;
  const target = normalizeSearchTarget(playerInput, locationHint);
  let next = clearEmptySearchOnCircumstance(facts, playerInput, target) ?? facts;
  if (claimsSearchEmpty(narrative)) {
    next = recordEmptySearch(next, target, turn);
  }
  return next;
}

/** Strip invent-loot sentences when re-searching an established-empty target. */
export function scrubInventedEmptySearchLoot(
  text: string,
  emptyTargets: string[],
  playerInput?: string
): string {
  if (!text || !emptyTargets.length) return text;
  const targetingEmpty =
    !playerInput
    || !isSearchAction(playerInput)
    || isSearchTargetEmpty(
      { searchedEmpty: emptyTargets, emptyContainers: [], crowd: 'unknown', noise: 'unknown', present: [], props: [], lastBeat: '', updatedTurn: 0 },
      normalizeSearchTarget(playerInput)
    );
  if (!targetingEmpty && playerInput && hasNewSearchCircumstance(playerInput)) return text;
  if (!LOOT_FIND.test(text)) return text;

  return text
    .replace(
      /([^.!?\n]{0,120}\b(?:find(?:s|ing)?|found|discover(?:s|ed|ing)?|uncover(?:s|ed|ing)?)\s+(?:a|an|the|some)\s+[^.!?\n]{0,80}(?:dagger|knife|sword|blade|axe|coin|gold|pouch|gem|ring|key|potion|vial|scroll|weapon)[^.!?\n]*[.!?])/gi,
      ' The area is still empty — nothing new turns up under the ash. '
    )
    .replace(
      /([^.!?\n]{0,80}\b(?:glint(?:s|ing)?|gleam(?:s|ing)?)\s+(?:of|from)\s+(?:metal|steel|silver|a\s+blade)[^.!?\n]*[.!?])/gi,
      ' Ash and splintered wood are all that remain. '
    )
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Names that may legally appear as weapons in prose. */
export function groundedWeaponNames(state: Pick<GameState, 'inventory' | 'sceneFacts' | 'locationSheet' | 'containers'>): string[] {
  const names: string[] = [];
  const push = (n?: string) => {
    const t = (n ?? '').trim();
    if (t) names.push(t);
  };
  for (const item of state.inventory ?? []) {
    if (/\b(knife|blade|sword|dagger|axe|club|bat|spear|staff|pistol|gun|bow|mace|weapon)\b/i.test(item.name)) {
      push(item.name);
    }
  }
  for (const p of state.sceneFacts?.props ?? []) {
    if (/\b(knife|blade|sword|dagger|axe|club|spear|staff|weapon)\b/i.test(p)) push(p);
  }
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name && /\b(knife|blade|sword|dagger|axe|club|spear|staff|weapon)\b/i.test(it.name)) {
      push(it.name);
    }
  }
  // Sealed bag: contents undeclared — do not treat Bag as a weapon source.
  return Array.from(new Set(names));
}

export function isWeaponGrounded(weaponPhrase: string, allowed: string[]): boolean {
  const w = weaponPhrase.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!w) return false;
  if (/^(bare hands|fists?|hands?|unarmed)$/i.test(w)) return true;
  return allowed.some((a) => {
    const al = a.toLowerCase();
    return w.includes(al) || al.includes(w) || w.split(/\s+/).some((tok) => tok.length > 3 && al.includes(tok));
  });
}

/**
 * Rewrite invented player-wielded weapons to the ledger weapon (or fists).
 * Only touches PC-attributed weapons (Name's dagger / your knife / you draw a sword).
 * NPC / scene weapons stay unless they match an empty-search loot scrub.
 */
export function scrubInventedWeapons(
  text: string,
  allowedWeapons: string[],
  fallbackLabel = 'bare hands',
  playerName?: string
): string {
  if (!text) return text;
  const allowed = allowedWeapons.filter(Boolean);
  const fistLabel = fallbackLabel === 'bare hands' ? 'fists' : fallbackLabel;
  const name = (playerName ?? '').trim();
  const nameAlt = name ? name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

  let next = text;

  if (nameAlt) {
    next = next.replace(
      new RegExp(
        `\\b(${nameAlt})'s\\s+(?:crude|rusty|makeshift|improvised|small|short|long|iron|steel|silver|bone)?\\s*(daggers?|shortswords?|longswords?|swords?|knives|knife|blades?|axes?|maces?|clubs?|spears?|staves|staff|pistols?|guns?|bows?|crossbows?)\\b`,
        'gi'
      ),
      (match, who: string, noun: string) => {
        if (isWeaponGrounded(match, allowed) || isWeaponGrounded(noun, allowed)) return match;
        return `${who}'s ${fistLabel}`;
      }
    );
  }

  next = next.replace(
    /\byour\s+(?:crude|rusty|makeshift|improvised|small|short|long|iron|steel|silver|bone)?\s*(daggers?|shortswords?|longswords?|swords?|knives|knife|blades?|axes?|maces?|clubs?|spears?|staves|staff|pistols?|guns?|bows?|crossbows?)\b/gi,
    (match, noun: string) => {
      if (isWeaponGrounded(match, allowed) || isWeaponGrounded(noun, allowed)) return match;
      return `your ${fistLabel}`;
    }
  );

  next = next.replace(
    /\b(you|You)\s+(draw|drew|drawing|swing|swung|swinging|plunge|plunged|plunging|flash|flashed|flashing|raise|raised|raising)\s+(?:a|an|the|your)\s+(?:crude|rusty|makeshift|improvised|small|short|long|iron|steel|silver|bone)?\s*(daggers?|shortswords?|longswords?|swords?|knives|knife|blades?|axes?|maces?|clubs?|spears?|staves|staff)\b/gi,
    (match, you: string, verb: string, noun: string) => {
      if (isWeaponGrounded(noun, allowed)) return match;
      return `${you} ${verb} with ${fistLabel === 'fists' ? 'bare hands' : fistLabel}`;
    }
  );

  next = next.replace(
    /\b(?:the|a|an|his|her|their)\s+(?:crude|rusty|makeshift|improvised)?\s*dagger\s+(plunging|plunges|flashing|flashed|striking)\b/gi,
    (_m, verb: string) => `a strike ${verb === 'plunging' || verb === 'plunges' ? 'landing' : verb}`
  );

  next = next.replace(/\b(?:a|an|the)\s+fists\b/gi, 'fists');
  next = next.replace(/\bwith\s+fists\b/gi, 'with bare hands');
  return next;
}

export function weaponAuthorityLine(state: GameState): string {
  const grounded = groundedWeaponNames(state);
  const equipped = equippedWeaponName(state);
  if (grounded.length === 0 || equipped === 'bare hands') {
    return 'WEAPON AUTHORITY: Player has no declared weapon (sealed bag contents undeclared). Narrate unarmed / fists / improvised debris only — never invent a dagger, sword, or knife.';
  }
  return `WEAPON AUTHORITY: Only these weapons exist for the player: ${grounded.join(', ')}. Preferred: ${equipped}. Do not invent another weapon.`;
}

export function emptySearchAuthorityLine(facts?: SceneFacts | null): string {
  const keys = listEmptySearchTargets(facts);
  if (!keys.length) return '';
  return `EMPTY SEARCHED (AUTHORITY): ${keys.join(', ')} — already searched and empty. Re-searching the same target must stay empty unless the player brings a new circumstance (light, break floor, different room). Do not invent loot, glints, or hidden gear.`;
}
