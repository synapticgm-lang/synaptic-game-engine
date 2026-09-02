/**
 * narrativeTranslator.ts
 * 
 * Translates raw GameState JSON into natural language prose for LLM context.
 * Prevents UI labels and state variables from leaking as canonical lore.
 * 
 * Part of Flash Lite Input Sanitization Architecture (2026-09-02)
 * P0: Pre-LLM State Translation
 */

import type { GameState, NpcMemory, Exit, Encounter, LocationSheet, Place } from './types.ts';

// UI labels that should never appear as entity names
const UI_LABELS = [
  'Consul', 'Heat', 'Target', 'Objective',
  'a nearby street', 'the Consul', 'toward the Consul',
  'Just', // Context: often a variable label, not always a name
] as const;

const DIALOGUE_VERBS = [
  'says', 'asks', 'replies', 'mutters', 'whispers', 'shouts',
  'states', 'declares', 'announces', 'comments', 'notes',
] as const;

/**
 * Main translation function - converts raw state to natural language
 */
export function translateStateToNarrative(state: GameState): string {
  const sections: string[] = [];

  // Location context
  const locationText = translateLocation(
    state.locationSheet?.name ?? state.location ?? 'unknown location',
    state.locationSheet,
    state.places
  );
  if (locationText) sections.push(locationText);

  // Entity presence
  const presenceText = translatePresence(
    state.sceneFacts?.present,
    state.npcMemories,
    state.activeEncounter,
    state.companion
  );
  if (presenceText) sections.push(presenceText);

  // Tension/heat state
  const tensionText = translateTension(
    state.sceneFacts?.tension,
    state.worldLedger?.heat
  );
  if (tensionText) sections.push(tensionText);

  // Exits
  const exitsText = translateExits(
    state.locationSheet?.exits,
    state.activeDungeon,
    state.places
  );
  if (exitsText) sections.push(exitsText);

  // Objectives
  const objectivesText = translateObjectives(state.quests, state.questFocus);
  if (objectivesText) sections.push(objectivesText);

  // Inventory summary
  const inventoryText = translateInventory(state.inventory);
  if (inventoryText) sections.push(inventoryText);

  return sections.join(' ');
}

/**
 * Translate location to natural description
 */
function translateLocation(
  name: string,
  sheet: LocationSheet | undefined,
  places: Place[] | undefined
): string {
  const place = places?.find(p => p.name === name);
  
  if (place?.description) {
    return `The player is at ${name} — ${place.description}.`;
  }
  
  if (sheet?.biome) {
    return `The player is at ${name}, a ${sheet.biome} area.`;
  }
  
  return `The player is at ${name}.`;
}

/**
 * Translate entity presence to natural language
 * Distinguishes named NPCs from anonymous entities
 */
function translatePresence(
  present: string[] | undefined,
  memories: NpcMemory[] | undefined,
  encounter: Encounter | undefined,
  companion: string | undefined
): string {
  const named: string[] = [];
  const anonymous: string[] = [];
  
  // Process present tokens
  for (const token of present ?? []) {
    if (isUiLabel(token)) {
      // UI label - translate to appropriate background entity
      const translated = translateUiToken(token);
      if (translated) anonymous.push(translated);
    } else if (isNamedNpc(token, memories)) {
      // Named NPC - keep with context
      const memory = memories?.find(m => m.npcName === token);
      const role = memory?.role ?? 'character';
      const disposition = memory?.disposition ?? 'neutral';
      named.push(`${token} (${role}, ${disposition})`);
    } else if (isProperName(token)) {
      // Looks like a name but no memory - still treat as named
      named.push(`${token} (character, neutral)`);
    } else {
      // Generic crowd token
      anonymous.push(token);
    }
  }
  
  // Add active encounter
  if (encounter) {
    named.push(`${encounter.name} (hostile threat, ${encounter.hp}/${encounter.maxHp} HP)`);
  }
  
  // Add companion
  if (companion && !named.some(n => n.startsWith(companion))) {
    const memory = memories?.find(m => m.npcName === companion);
    const disposition = memory?.disposition ?? 'friendly';
    named.push(`${companion} (companion, ${disposition})`);
  }
  
  // Compose result
  const parts: string[] = [];
  
  if (named.length > 0) {
    parts.push(`Named individuals present: ${named.join(', ')}.`);
  }
  
  if (anonymous.length > 0) {
    const count = anonymous.length;
    parts.push(`Approximately ${count} other people in the area (${anonymous[0]}).`);
  }
  
  if (named.length === 0 && anonymous.length === 0) {
    parts.push('The area is empty. No other people are present.');
  }
  
  return parts.join(' ');
}

/**
 * Translate tension/heat state to natural language
 */
function translateTension(
  tension: string | undefined,
  heat: number | undefined
): string {
  if (tension === 'high' || (heat != null && heat > 60)) {
    return 'The atmosphere is tense. Guards are on high alert.';
  }
  
  if (tension === 'medium' || (heat != null && heat > 30)) {
    return 'There is mild tension in the air.';
  }
  
  return '';
}

/**
 * Translate exits to natural language
 */
function translateExits(
  exits: Exit[] | undefined,
  dungeon: unknown | undefined,
  places: Place[] | undefined
): string {
  if (dungeon) {
    // Dungeon navigation handled separately
    return '';
  }
  
  const exitDescriptions = (exits ?? [])
    .filter(e => !isUiLabel(e.label))
    .map(e => naturalizeExitLabel(e.label, e.destination, places));
  
  if (exitDescriptions.length === 0) {
    return 'No obvious exits are visible.';
  }
  
  return `Obvious exits: ${exitDescriptions.join('; ')}.`;
}

/**
 * Naturalize exit labels to remove UI tokens
 */
function naturalizeExitLabel(
  label: string,
  destination: string | undefined,
  places: Place[] | undefined
): string {
  // "road toward Consul" → "a road leading to [destination]"
  if (/toward (?:the )?Consul/i.test(label)) {
    if (destination) {
      const place = places?.find(p => p.name === destination);
      return place
        ? `a road leading to ${destination}`
        : 'a road leading away';
    }
    return 'a road leading away';
  }
  
  // "path to nearby street" → "a path toward town"
  if (/nearby street/i.test(label)) {
    return 'a path toward town';
  }
  
  // "toward Heat" → naturalize
  if (/toward Heat/i.test(label)) {
    return destination
      ? `a path to ${destination}`
      : 'a path leading away';
  }
  
  return label;
}

/**
 * Translate quest objectives to natural language
 */
function translateObjectives(
  quests: unknown[] | undefined,
  questFocus: string | undefined
): string {
  if (!quests || quests.length === 0) return '';
  
  // Find active quest
  const activeQuest = quests.find((q: any) => 
    q.id === questFocus || q.state === 'active'
  ) as any;
  
  if (!activeQuest) return '';
  
  const objective = activeQuest.objectiveText ?? activeQuest.title ?? 'unknown objective';
  return `The player's current objective is: ${objective}.`;
}

/**
 * Translate inventory to natural summary
 */
function translateInventory(inventory: any[] | undefined): string {
  if (!inventory || inventory.length === 0) {
    return 'The player has no items.';
  }
  
  const items = inventory
    .filter((item: any) => item?.name && item.name !== 'Bag' && !item.sealed)
    .map((item: any) => item.name);
  
  if (items.length === 0) {
    return 'The player has basic street clothes and a sealed bag.';
  }
  
  const itemList = items.slice(0, 5).join(', ');
  const more = items.length > 5 ? ` and ${items.length - 5} more items` : '';
  return `The player has: ${itemList}${more}.`;
}

/**
 * Check if token is a UI label that should not appear as entity
 */
export function isUiLabel(token: string): boolean {
  const lower = token.toLowerCase();
  
  // Check against known UI labels
  for (const label of UI_LABELS) {
    if (lower.includes(label.toLowerCase())) {
      return true;
    }
  }
  
  // Check for state variable patterns
  if (/^(heat|tension|target|objective|consul|registry|system)$/i.test(token)) {
    return true;
  }
  
  return false;
}

/**
 * Check if token is a named NPC
 */
function isNamedNpc(token: string, memories: NpcMemory[] | undefined): boolean {
  if (!memories) return false;
  return memories.some(m => m.npcName === token);
}

/**
 * Check if token looks like a proper name
 */
function isProperName(token: string): boolean {
  // Pattern: Capital letter, lowercase letters, optional apostrophe/hyphen
  return /^[A-Z][a-z'-]{1,20}$/.test(token);
}

/**
 * Translate UI token to appropriate background entity
 */
function translateUiToken(token: string): string | null {
  const lower = token.toLowerCase();
  
  if (lower.includes('consul')) {
    return 'faction guards';
  }
  
  if (lower.includes('heat')) {
    return ''; // Heat is a state variable, not an entity
  }
  
  if (lower.includes('target') || lower.includes('objective')) {
    return ''; // Not entities
  }
  
  return 'background figures';
}

/**
 * Check if a choice label contains ungrounded references
 */
export function choiceContainsUngroundedReferences(
  choice: string,
  lastGmStory: string,
  sceneFacts: any,
  inventory: any[]
): boolean {
  // Extract noun phrases from choice
  const nounMatches = choice.match(/\b(?:the|a|an)\s+([a-z]+(?:\s+[a-z]+){0,2})/gi);
  if (!nounMatches) return false;
  
  for (const match of nounMatches) {
    const noun = match.replace(/^(?:the|a|an)\s+/i, '').toLowerCase();
    
    // Skip generic terms
    if (isGenericTerm(noun)) continue;
    
    // Check if grounded in last GM story
    if (lastGmStory.toLowerCase().includes(noun)) continue;
    
    // Check if in scene props
    if (sceneFacts?.props?.some((p: string) => p.toLowerCase().includes(noun))) continue;
    
    // Check if in inventory
    if (inventory.some((item: any) => item.name?.toLowerCase().includes(noun))) continue;
    
    // Check if in location
    if (sceneFacts?.location?.toLowerCase().includes(noun)) continue;
    
    // Ungrounded reference found
    return true;
  }
  
  return false;
}

/**
 * Check if term is generic and doesn't need grounding
 */
function isGenericTerm(term: string): boolean {
  const genericTerms = [
    'area', 'room', 'place', 'space', 'ground', 'floor', 'wall', 'ceiling',
    'door', 'entrance', 'exit', 'path', 'way', 'street', 'road',
    'person', 'people', 'someone', 'anyone', 'figure', 'shadow',
    'thing', 'something', 'anything', 'object', 'item',
    'moment', 'time', 'situation', 'scene',
  ];
  
  return genericTerms.some(generic => term.includes(generic));
}
