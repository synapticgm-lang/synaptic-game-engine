/**
 * Batch Y Milestone 1 — Intent Enums
 * 
 * Root cause fix: ChoiceCompiler passes literal button labels into situation packet:
 * "1. Plunge into the thick of the Lowmarket crowd". Flash Lite regurgitates these
 * exact strings in narration.
 * 
 * Solution: Use semantic intent enums for LLM context, display labels only in ActionBar.
 */

// ============================================================================
// INTENT ENUMS — Semantic actions passed to LLM (not UI strings)
// ============================================================================

export enum PlayerIntent {
  // Combat intents
  INTENT_ATTACK = 'INTENT_ATTACK',
  INTENT_FLEE = 'INTENT_FLEE',
  INTENT_PARLEY = 'INTENT_PARLEY',
  INTENT_PLEAD = 'INTENT_PLEAD',
  INTENT_STRUGGLE = 'INTENT_STRUGGLE',
  INTENT_SURRENDER = 'INTENT_SURRENDER',
  
  // Movement intents
  INTENT_TRAVEL_NORTH = 'INTENT_TRAVEL_NORTH',
  INTENT_TRAVEL_SOUTH = 'INTENT_TRAVEL_SOUTH',
  INTENT_TRAVEL_EAST = 'INTENT_TRAVEL_EAST',
  INTENT_TRAVEL_WEST = 'INTENT_TRAVEL_WEST',
  INTENT_TRAVEL_UP = 'INTENT_TRAVEL_UP',
  INTENT_TRAVEL_DOWN = 'INTENT_TRAVEL_DOWN',
  INTENT_TRAVEL_HUB = 'INTENT_TRAVEL_HUB', // Generic hub travel
  INTENT_ENTER = 'INTENT_ENTER',
  INTENT_LEAVE = 'INTENT_LEAVE',
  INTENT_EXIT = 'INTENT_EXIT',
  
  // Inspection intents
  INTENT_INSPECT = 'INTENT_INSPECT',
  INTENT_LOOK_AROUND = 'INTENT_LOOK_AROUND',
  INTENT_EXAMINE_ROOM = 'INTENT_EXAMINE_ROOM',
  INTENT_SCOUT = 'INTENT_SCOUT',
  INTENT_SEARCH = 'INTENT_SEARCH',
  INTENT_INSPECT_CHEST = 'INTENT_INSPECT_CHEST',
  INTENT_INSPECT_CRATE = 'INTENT_INSPECT_CRATE',
  INTENT_INSPECT_DOOR = 'INTENT_INSPECT_DOOR',
  INTENT_INSPECT_PANEL = 'INTENT_INSPECT_PANEL',
  
  // Social intents
  INTENT_TALK = 'INTENT_TALK',
  INTENT_ASK = 'INTENT_ASK',
  INTENT_LISTEN = 'INTENT_LISTEN',
  INTENT_PRESS = 'INTENT_PRESS',
  INTENT_DEMAND = 'INTENT_DEMAND',
  INTENT_GREET = 'INTENT_GREET',
  INTENT_INTRODUCE = 'INTENT_INTRODUCE',
  
  // Utility intents
  INTENT_WAIT = 'INTENT_WAIT',
  INTENT_REST = 'INTENT_REST',
  INTENT_SHOP = 'INTENT_SHOP',
  INTENT_MERCHANT = 'INTENT_MERCHANT',
  INTENT_STATUS = 'INTENT_STATUS',
  
  // Opening/establishment intents
  INTENT_GIVE_NAME = 'INTENT_GIVE_NAME',
  INTENT_ASK_WHERE = 'INTENT_ASK_WHERE',
  INTENT_ASK_WHO = 'INTENT_ASK_WHO',
  INTENT_PROTEST = 'INTENT_PROTEST',
  
  // Crowd intents
  INTENT_CROWD_ENTER = 'INTENT_CROWD_ENTER',
  INTENT_CROWD_WATCH = 'INTENT_CROWD_WATCH',
  INTENT_CROWD_AVOID = 'INTENT_CROWD_AVOID',
  
  // Generic
  INTENT_CONTINUE = 'INTENT_CONTINUE',
  INTENT_OTHER = 'INTENT_OTHER',
}

// ============================================================================
// INTENT DISPLAY LABELS — What the player sees (ActionBar only, never LLM)
// ============================================================================

export const INTENT_DISPLAY_LABELS: Record<PlayerIntent, string> = {
  // Combat
  [PlayerIntent.INTENT_ATTACK]: 'Attack',
  [PlayerIntent.INTENT_FLEE]: 'Flee',
  [PlayerIntent.INTENT_PARLEY]: 'Parley',
  [PlayerIntent.INTENT_PLEAD]: 'Plead',
  [PlayerIntent.INTENT_STRUGGLE]: 'Struggle',
  [PlayerIntent.INTENT_SURRENDER]: 'Surrender',
  
  // Movement
  [PlayerIntent.INTENT_TRAVEL_NORTH]: 'Travel north',
  [PlayerIntent.INTENT_TRAVEL_SOUTH]: 'Travel south',
  [PlayerIntent.INTENT_TRAVEL_EAST]: 'Travel east',
  [PlayerIntent.INTENT_TRAVEL_WEST]: 'Travel west',
  [PlayerIntent.INTENT_TRAVEL_UP]: 'Go up',
  [PlayerIntent.INTENT_TRAVEL_DOWN]: 'Go down',
  [PlayerIntent.INTENT_TRAVEL_HUB]: 'Travel',
  [PlayerIntent.INTENT_ENTER]: 'Enter',
  [PlayerIntent.INTENT_LEAVE]: 'Leave',
  [PlayerIntent.INTENT_EXIT]: 'Exit',
  
  // Inspection
  [PlayerIntent.INTENT_INSPECT]: 'Inspect',
  [PlayerIntent.INTENT_LOOK_AROUND]: 'Look around',
  [PlayerIntent.INTENT_EXAMINE_ROOM]: 'Examine the room',
  [PlayerIntent.INTENT_SCOUT]: 'Scout the area',
  [PlayerIntent.INTENT_SEARCH]: 'Search',
  [PlayerIntent.INTENT_INSPECT_CHEST]: 'Check the chest',
  [PlayerIntent.INTENT_INSPECT_CRATE]: 'Open the crate',
  [PlayerIntent.INTENT_INSPECT_DOOR]: 'Try the door',
  [PlayerIntent.INTENT_INSPECT_PANEL]: 'Inspect the panel',
  
  // Social
  [PlayerIntent.INTENT_TALK]: 'Talk',
  [PlayerIntent.INTENT_ASK]: 'Ask',
  [PlayerIntent.INTENT_LISTEN]: 'Listen',
  [PlayerIntent.INTENT_PRESS]: 'Press for information',
  [PlayerIntent.INTENT_DEMAND]: 'Demand answers',
  [PlayerIntent.INTENT_GREET]: 'Greet them',
  [PlayerIntent.INTENT_INTRODUCE]: 'Introduce yourself',
  
  // Utility
  [PlayerIntent.INTENT_WAIT]: 'Wait',
  [PlayerIntent.INTENT_REST]: 'Rest',
  [PlayerIntent.INTENT_SHOP]: 'Shop',
  [PlayerIntent.INTENT_MERCHANT]: 'Visit merchant',
  [PlayerIntent.INTENT_STATUS]: 'Check status',
  
  // Opening
  [PlayerIntent.INTENT_GIVE_NAME]: 'Give your name',
  [PlayerIntent.INTENT_ASK_WHERE]: 'Ask where you are',
  [PlayerIntent.INTENT_ASK_WHO]: 'Ask who they are',
  [PlayerIntent.INTENT_PROTEST]: 'Protest',
  
  // Crowd
  [PlayerIntent.INTENT_CROWD_ENTER]: 'Enter the crowd',
  [PlayerIntent.INTENT_CROWD_WATCH]: 'Watch the crowd',
  [PlayerIntent.INTENT_CROWD_AVOID]: 'Avoid the crowd',
  
  // Generic
  [PlayerIntent.INTENT_CONTINUE]: 'Continue',
  [PlayerIntent.INTENT_OTHER]: 'Other',
};

// ============================================================================
// INTENT INFERENCE — Convert user input or choice label to intent enum
// ============================================================================

/**
 * Infer semantic intent from a choice label or user input.
 * Used to convert legacy string-based pads to intent enums.
 */
export function inferIntent(text: string): PlayerIntent {
  const lower = text.toLowerCase().trim();
  
  // Combat - BATCH YZ: Added lunge, charge, rush to catch more attack patterns
  if (/\b(attack|strike|fight|engage|press the attack|swing|slash|stab|lunge|charge|rush)\b/.test(lower)) {
    return PlayerIntent.INTENT_ATTACK;
  }
  if (/\b(flee|run|escape|retreat|withdraw)\b/.test(lower)) {
    return PlayerIntent.INTENT_FLEE;
  }
  if (/\b(parley|negotiate|bargain|truce)\b/.test(lower)) {
    return PlayerIntent.INTENT_PARLEY;
  }
  if (/\b(plead|beg|surrender)\b/.test(lower)) {
    return PlayerIntent.INTENT_PLEAD;
  }
  if (/\bstruggle\b/.test(lower)) {
    return PlayerIntent.INTENT_STRUGGLE;
  }
  
  // Movement
  if (/\b(travel|go|head|move)\s+(north|n)\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_NORTH;
  }
  if (/\b(travel|go|head|move)\s+(south|s)\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_SOUTH;
  }
  if (/\b(travel|go|head|move)\s+(east|e)\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_EAST;
  }
  if (/\b(travel|go|head|move)\s+(west|w)\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_WEST;
  }
  if (/\b(go|travel|head)\s+(up|upstairs)\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_UP;
  }
  if (/\b(go|travel|head)\s+(down|downstairs)\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_DOWN;
  }
  if (/\b(enter|step into|go through)\b/.test(lower)) {
    return PlayerIntent.INTENT_ENTER;
  }
  if (/\b(leave|exit|depart)\b/.test(lower)) {
    return PlayerIntent.INTENT_LEAVE;
  }
  if (/\btravel\b/.test(lower)) {
    return PlayerIntent.INTENT_TRAVEL_HUB;
  }
  
  // Inspection
  if (/\b(check|open|search)\s+(the\s+)?(chest|trunk|box)\b/.test(lower)) {
    return PlayerIntent.INTENT_INSPECT_CHEST;
  }
  if (/\b(check|open|search)\s+(the\s+)?crate\b/.test(lower)) {
    return PlayerIntent.INTENT_INSPECT_CRATE;
  }
  if (/\b(try|check|examine|inspect)\s+(the\s+)?door\b/.test(lower)) {
    return PlayerIntent.INTENT_INSPECT_DOOR;
  }
  if (/\b(inspect|examine|check)\s+(the\s+)?panel\b/.test(lower)) {
    return PlayerIntent.INTENT_INSPECT_PANEL;
  }
  if (/\b(look around|examine the room|inspect the room|get bearings)\b/.test(lower)) {
    return PlayerIntent.INTENT_LOOK_AROUND;
  }
  if (/\b(scout|survey)\b/.test(lower)) {
    return PlayerIntent.INTENT_SCOUT;
  }
  if (/\b(inspect|examine|check|search)\b/.test(lower)) {
    return PlayerIntent.INTENT_INSPECT;
  }
  
  // Social - BATCH YZ: Strengthened to catch "press for X" and "leverage" patterns
  if (/\b(press(?:\s+for)?|pressure|insist|push|leverage)\b/.test(lower)) {
    return PlayerIntent.INTENT_PRESS;
  }
  if (/\b(demand|insist|require|confront)\b/.test(lower)) {
    return PlayerIntent.INTENT_DEMAND;
  }
  if (/\b(ask|question|inquire)\b/.test(lower)) {
    return PlayerIntent.INTENT_ASK;
  }
  if (/\b(listen|hear|eavesdrop)\b/.test(lower)) {
    return PlayerIntent.INTENT_LISTEN;
  }
  if (/\b(talk|speak|converse|chat)\b/.test(lower)) {
    return PlayerIntent.INTENT_TALK;
  }
  if (/\b(greet|hello|wave)\b/.test(lower)) {
    return PlayerIntent.INTENT_GREET;
  }
  if (/\bintroduce\b/.test(lower)) {
    return PlayerIntent.INTENT_INTRODUCE;
  }
  
  // Utility
  if (/\b(wait|pause|hold|stand still)\b/.test(lower)) {
    return PlayerIntent.INTENT_WAIT;
  }
  if (/\b(rest|sleep|recover)\b/.test(lower)) {
    return PlayerIntent.INTENT_REST;
  }
  if (/\b(shop|buy|purchase|trade|merchant)\b/.test(lower)) {
    return PlayerIntent.INTENT_SHOP;
  }
  if (/\b(status|check status)\b/.test(lower)) {
    return PlayerIntent.INTENT_STATUS;
  }
  
  // Opening
  if (/\b(give|tell|say).*(name|who you are)\b/.test(lower)) {
    return PlayerIntent.INTENT_GIVE_NAME;
  }
  if (/\b(where am i|where is this|what is this place)\b/.test(lower)) {
    return PlayerIntent.INTENT_ASK_WHERE;
  }
  if (/\b(who are you|who is|what are you)\b/.test(lower)) {
    return PlayerIntent.INTENT_ASK_WHO;
  }
  if (/\b(protest|object|refuse|no|stop)\b/.test(lower)) {
    return PlayerIntent.INTENT_PROTEST;
  }
  
  // Crowd
  if (/\b(plunge|enter|join|push into).*crowd\b/.test(lower)) {
    return PlayerIntent.INTENT_CROWD_ENTER;
  }
  if (/\b(watch|observe|study).*crowd\b/.test(lower)) {
    return PlayerIntent.INTENT_CROWD_WATCH;
  }
  if (/\b(avoid|skirt|bypass).*crowd\b/.test(lower)) {
    return PlayerIntent.INTENT_CROWD_AVOID;
  }
  
  // Default
  return PlayerIntent.INTENT_OTHER;
}

/**
 * Get display label for an intent enum.
 */
export function getIntentLabel(intent: PlayerIntent): string {
  return INTENT_DISPLAY_LABELS[intent] ?? 'Continue';
}

/**
 * Check if an intent is a combat action.
 */
export function isCombatIntent(intent: PlayerIntent): boolean {
  return [
    PlayerIntent.INTENT_ATTACK,
    PlayerIntent.INTENT_FLEE,
    PlayerIntent.INTENT_PARLEY,
    PlayerIntent.INTENT_PLEAD,
    PlayerIntent.INTENT_STRUGGLE,
    PlayerIntent.INTENT_SURRENDER,
  ].includes(intent);
}

/**
 * Check if an intent is a movement action.
 */
export function isTravelIntent(intent: PlayerIntent): boolean {
  return [
    PlayerIntent.INTENT_TRAVEL_NORTH,
    PlayerIntent.INTENT_TRAVEL_SOUTH,
    PlayerIntent.INTENT_TRAVEL_EAST,
    PlayerIntent.INTENT_TRAVEL_WEST,
    PlayerIntent.INTENT_TRAVEL_UP,
    PlayerIntent.INTENT_TRAVEL_DOWN,
    PlayerIntent.INTENT_TRAVEL_HUB,
    PlayerIntent.INTENT_ENTER,
    PlayerIntent.INTENT_LEAVE,
    PlayerIntent.INTENT_EXIT,
  ].includes(intent);
}

/**
 * Check if an intent is an inspection action.
 */
export function isInspectIntent(intent: PlayerIntent): boolean {
  return [
    PlayerIntent.INTENT_INSPECT,
    PlayerIntent.INTENT_LOOK_AROUND,
    PlayerIntent.INTENT_EXAMINE_ROOM,
    PlayerIntent.INTENT_SCOUT,
    PlayerIntent.INTENT_SEARCH,
    PlayerIntent.INTENT_INSPECT_CHEST,
    PlayerIntent.INTENT_INSPECT_CRATE,
    PlayerIntent.INTENT_INSPECT_DOOR,
    PlayerIntent.INTENT_INSPECT_PANEL,
  ].includes(intent);
}

/**
 * Check if an intent is a social action.
 */
export function isSocialIntent(intent: PlayerIntent): boolean {
  return [
    PlayerIntent.INTENT_TALK,
    PlayerIntent.INTENT_ASK,
    PlayerIntent.INTENT_LISTEN,
    PlayerIntent.INTENT_PRESS,
    PlayerIntent.INTENT_DEMAND,
    PlayerIntent.INTENT_GREET,
    PlayerIntent.INTENT_INTRODUCE,
  ].includes(intent);
}
