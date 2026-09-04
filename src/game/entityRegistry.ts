/**
 * Batch Y Milestone 1 — Entity Registry Lockdown
 * 
 * Immutable registries for NPCs and locations.
 * Only names in these registries can enter present[] or be harvested.
 * 
 * Root cause fix: Title-Case heuristic in narrativeHarvest sees capitalized
 * words in LLM garbage ("Lowmarket Fence", "Rasped", "Scattered Scale") and
 * flags them as present[] entities. Next turn, engine injects them as valid NPCs.
 * 
 * This registry is the single source of truth for what entities can exist.
 */

import type { CampaignBible } from '@/data/campaigns/types';
import { isPolityFactionOrPlaceToken } from './chromeAuthority';

// ============================================================================
// LOCATION REGISTRY — All valid location names from hubs, quests, and opening cards
// ============================================================================

/** Summoned Pact locations */
const SUMMONED_PACT_LOCATIONS = [
  'Lowmarket', 'the Lowmarket',
  'West Wall', 'the west wall', 'Valespire west wall',
  'The Weighing Cup', 'Weighing Cup',
  'Contract Hall', 'the Contract Hall',
  'Cathedral Close', 'the close',
  'Cathedral Undercroft', 'Undercroft',
  'Palace Approach', 'the palace', 'Valespire Palace',
  'Cinderflow Road', 'the Cinderflow',
  'Harbor Quay', 'the quay', 'Valespire harbor',
  'Pellane War Camp', 'war camp', 'the war camp',
  'Kitchen Saint Alley', 'Kitchen Saint', 'kitchen alley',
  'Sevenfold Circle', 'the Circle', 'Pellane\'s court', 'Ash Court',
  'Valespire Cathedral', 'the cathedral',
];

/** Hero Awakening locations */
const HERO_AWAKENING_LOCATIONS = [
  'Ashline Yard', 'the Yard', 'Ashline',
  'The Low Watt', 'Low Watt',
  'Ward Rest', 'Ward Rest infirmary',
  'MCA Field Desk', 'Meridian desk', 'MCA desk',
  'First Threshold Gate', 'the Threshold', 'Threshold gate',
  'Scrap Fence Alley', 'scrap alley', 'fence alley',
  'Lampmere Market', 'the market', 'Lampmere',
  'Meridian Wall', 'the wall', 'city wall',
  'Quiet Archive', 'the archive',
  'Vesper Backroom', 'vesper room', 'cartel backroom',
];

/** System Integration locations */
const SYSTEM_INTEGRATION_LOCATIONS = [
  'Cracked Street', 'cracked city street', 'the street',
  'Convenience Store Dungeon', 'the store', 'convenience store',
  'Riverside Stronghold', 'Riverside', 'the stronghold',
  'Contested Corridor', 'the corridor',
  'Wave Wall', 'the wall', 'hub wall',
  'Dead Zone Border', 'dead zone', 'the border',
  'Broker Alley', 'the Broker', 'broker alley',
  'Okafor\'s Probe Lab', 'Yusuf lab', 'probe lab',
  'Mana Crystal Exchange', 'crystal exchange', 'mana market',
];

/** Gatebreak Ward locations */
const GATEBREAK_WARD_LOCATIONS = [
  'Ward 9 Shelter', 'the shelter', 'Ward 9',
  'Militia Post', 'militia desk', 'Rill\'s post',
  'Subway Gate', 'the subway', 'subway B-gate',
  'Guild Desk', 'hunter guild', 'Vex\'s desk',
  'Scrap Market', 'the scrap market',
  'Evacuation Yard', 'evac yard',
  'Armband Depot', 'armband locker', 'depot',
  'Night Watch Roof', 'watch roof', 'roof post',
];

/** Ascending Spire locations */
const ASCENDING_SPIRE_LOCATIONS = [
  'Spire Gate Plaza', 'Spire Gate', 'the plaza',
  'Ranking Board', 'the board', 'climber board',
  'Climber Camp', 'the camp',
  'Floor 1 Antechamber', 'Floor 1', 'antechamber',
  'Map Broker Stall', 'map broker', 'broker stall',
  'Rival Guild Tent', 'rival tent', 'guild tent',
  'Wind Scaffold', 'scaffold', 'wind deck',
  'Spire Coin Exchange', 'coin exchange', 'spire coin',
];

/** Fabled Legacy locations */
const FABLED_LEGACY_LOCATIONS = [
  'Mossford Square', 'the square', 'Mossford',
  'The Crooked Beam', 'Crooked Beam', 'the inn',
  'Chapel Menhir', 'the menhir', 'chapel stone',
  'Marta\'s Smithy', 'the smithy', 'blacksmith',
  'Greentooth Trailhead', 'trailhead', 'lower hills',
  'River Tess Mill', 'the mill',
  'Fen\'s Bakery', 'the bakery', 'Fen bakery',
  'Hollow Cairn Approach', 'Hollow Cairn', 'the cairn',
];

/** Inkbound Academy locations */
const INKBOUND_ACADEMY_LOCATIONS = [
  'Quill Dormitory', 'the dorm', 'Quill dorm',
  'Lecture Courtyard', 'the courtyard', 'duel yard',
  'House Ledger Hall', 'ledger hall', 'house board',
  'Living Ink Atelier', 'the atelier', 'ink atelier',
  'Restricted Stack', 'the stack', 'restricted stack',
  'Dean\'s Discipline Office', 'discipline office', 'dean office',
  'Rival House Quad', 'house quad', 'the quad',
  'Campus Refectory', 'the refectory', 'campus mess',
];

/** Void Audience locations */
const VOID_AUDIENCE_LOCATIONS = [
  'Auditor\'s Desk', 'the Auditor', 'void desk',
  'Threshold Inn', 'the inn', 'Pellara\'s inn',
  'Threshold Node Plaza', 'the Node', 'Threshold Node',
  'Resonance Stage', 'the stage', 'resonance stage',
  'Gallery Viewing Tier', 'gallery tier', 'viewing tier',
  'Reborn Meeting Ground', 'reborn ground', 'trial meet',
  'Academy Scout Camp', 'scout camp', 'academy camp',
  'Wild Mana Field Edge', 'mana field', 'wild field',
];

/** Hollow Core locations */
const HOLLOW_CORE_LOCATIONS = [
  'Core Chamber', 'the core', 'crystal chamber',
  'First Tunnel Spur', 'tunnel spur', 'first spur',
  'Spawn Nursery', 'the nursery', 'spawn bay',
  'Bargain Antechamber', 'bargain hall', 'antechamber',
  'Excavation Face', 'dig face', 'excavation',
  'Rival Core Border', 'core border', 'rival border',
  'Hunter Staging Shelf', 'hunter shelf', 'bren shelf',
  'Hollow Heart Vault', 'hollow heart', 'heart vault',
];

/** Dungeon Transport locations */
const DUNGEON_TRANSPORT_LOCATIONS = [
  'Floor 1 Stone Corridor', 'Floor 1', 'stone corridor',
  'Gatekeeper Boss Door', 'Gatekeeper door', 'boss door',
  'Floor 2 Flooded Platform', 'Floor 2', 'flooded platform',
  'Scratch\'s Nest Overlook', 'Scratch nest', 'imp overlook',
  'Safe Room Rest Shrine', 'safe room', 'rest shrine',
  'Wandering Merchant Stall', 'merchant stall', 'wandering merchant',
  'Descent Log Alcove', 'log alcove', 'descent log',
  'Abyssal Transit Shaft', 'transit shaft', 'descent shaft',
  'Seam Crawlspace', 'the seam', 'crawlspace',
];

/** Cursed Keep locations */
const CURSED_KEEP_LOCATIONS = [
  'Greyhollow Inn', 'the inn', 'Greyhollow Tavern', 'the tavern',
  'Greyhollow Church', 'the church', 'the chapel',
  'Keep Gate', 'the keep gate', 'Greymark gate',
  'Greyhollow Graveyard', 'the graveyard',
  'Mira\'s Apothecary', 'the apothecary', 'apothecary shop',
  'Blackspine Treeline', 'the treeline', 'Blackspine edge',
];

/** Salt Road Heist locations */
const SALT_ROAD_HEIST_LOCATIONS = [
  'Salt Road Waystation', 'the waystation', 'Salt Road',
  'Consul Caravan Camp', 'caravan camp', 'the caravan',
  'Safehouse Alley', 'the safehouse', 'Vessa\'s alley',
  'Harbor Fence', 'the fence', 'harbor buyer',
  'Bribe Market', 'the bribe market',
  'Checkpoint Rise', 'the checkpoint',
];

/** Shattered Coast locations */
const SHATTERED_COAST_LOCATIONS = [
  'Saltmar', 'Saltmar City', 'the harborside streets of Saltmar',
  'Lower Ward', 'Saltmar Lower Ward', 'the harbor',
  'Middle Ward', 'Saltmar Middle Ward',
  'Upper Ward', 'Saltmar Upper Ward',
  'Great Lift', 'the Great Lift',
  'Brinewatch', 'Brinewatch Town', 'the fishing town',
  'Salt-Stained Keep', 'the keep', 'salt keep',
  'Stonevein Quarry', 'Stonevein', 'the quarry',
];

/** Thornferry Road locations — bible title is a place, never a person. */
const THORNFERRY_ROAD_LOCATIONS = [
  'Thornferry', 'Thornferry Road', 'the Thornferry Road',
  'Mill landing', 'the mill landing', 'Thornferry mill',
  'Quiet Bell', 'the chapel',
  'Highmark', 'Highmark gate',
];

const LOCATION_REGISTRY_BY_BIBLE: Record<string, string[]> = {
  'thornferry-road': THORNFERRY_ROAD_LOCATIONS,
  'summoned-pact': SUMMONED_PACT_LOCATIONS,
  'hero-awakening': HERO_AWAKENING_LOCATIONS,
  'system-integration': SYSTEM_INTEGRATION_LOCATIONS,
  'gatebreak-ward': GATEBREAK_WARD_LOCATIONS,
  'ascending-spire': ASCENDING_SPIRE_LOCATIONS,
  'fabled-legacy': FABLED_LEGACY_LOCATIONS,
  'inkbound-academy': INKBOUND_ACADEMY_LOCATIONS,
  'void-audience': VOID_AUDIENCE_LOCATIONS,
  'hollow-core': HOLLOW_CORE_LOCATIONS,
  'dungeon-transport': DUNGEON_TRANSPORT_LOCATIONS,
  'cursed-keep': CURSED_KEEP_LOCATIONS,
  'salt-road-heist': SALT_ROAD_HEIST_LOCATIONS,
  'shattered-coast': SHATTERED_COAST_LOCATIONS,
};

// ============================================================================
// NPC REGISTRY — All valid NPC names from quests, opening cards, and encounters
// ============================================================================

/** Summoned Pact NPCs */
const SUMMONED_PACT_NPCS = [
  'Pellane', 'King Pellane', 'the Ash King',
  'Registrar', 'the registrar', 'the official',
  'Handler', 'the handler',
  'Sergeant', 'Watch Sergeant', 'Sergeant Dren',
  'Corporal', 'Corporal Vess',
  'Fence', 'Lowmarket fence', 'Tomas',
  'Priest', 'Father Karel',
  'lost child', 'Jory',
  'Merchant', 'Contract Hall clerk',
  'Innkeeper', 'Weighing Cup innkeeper', 'Marren',
  'Guardian', 'cathedral guardian',
  'Cook', 'kitchen worker', 'Essa',
  'Quartermaster', 'war camp quartermaster',
  'Sentry', 'palace sentry',
  'Runner', 'courier', 'message runner',
];

/** Hero Awakening NPCs */
const HERO_AWAKENING_NPCS = [
  'Auditor', 'MCA auditor', 'Auditor Lin',
  'Pax Orr', 'fence', 'Pax',
  'Crew Lead', 'crew leader', 'Ashline lead',
  'Healer', 'Ward Rest healer', 'Mira',
  'Delver', 'fellow delver', 'Kael',
  'Cartel Agent', 'Vesper agent', 'Senna',
  'Merchant', 'market vendor',
  'Scout', 'guild scout', 'Renn',
  'Watch Captain', 'wall captain', 'Tovar',
  'Researcher', 'archive researcher', 'Solenne',
  'Handler', 'the handler',
];

/** System Integration NPCs */
const SYSTEM_INTEGRATION_NPCS = [
  'System', 'the System',
  'Handler', 'the handler',
  'Yusuf Okafor', 'Yusuf', 'Okafor',
  'Broker', 'intel broker',
  'Wave Survivor', 'survivor', 'Mara',
  'Guard Captain', 'stronghold captain', 'Jin',
  'Researcher', 'System researcher',
  'Merchant', 'crystal trader',
  'Scout', 'corridor scout', 'Dren',
];

/** Gatebreak Ward NPCs */
const GATEBREAK_WARD_NPCS = [
  'Sergeant Rill', 'Rill', 'militia sergeant',
  'Vex', 'guild hunter', 'Hunter Vex',
  'Shelter Clerk', 'Ward 9 clerk',
  'Scrap Merchant', 'scrap dealer',
  'Night Watch', 'watch sentry', 'Torin',
  'Armband Officer', 'depot officer',
  'Evacuee', 'shelter evacuee', 'Mara',
  'Guild Scout', 'hunter scout',
];

/** Ascending Spire NPCs */
const ASCENDING_SPIRE_NPCS = [
  'Gatekeeper', 'Spire gatekeeper',
  'Board Officer', 'ranking officer',
  'Map Broker', 'intel broker', 'Venn',
  'Rival Climber', 'guild rival', 'Kael',
  'Floor Warden', 'Floor 1 warden',
  'Merchant', 'Spire merchant',
  'Camp Leader', 'climber leader', 'Senna',
  'Coin Trader', 'exchange trader',
];

/** Fabled Legacy NPCs */
const FABLED_LEGACY_NPCS = [
  'Marta', 'blacksmith Marta', 'the smith',
  'Father Aldous', 'Aldous', 'village priest',
  'Fen', 'baker Fen',
  'Innkeeper', 'Crooked Beam keeper', 'Torin',
  'Miller', 'mill worker', 'Vess',
  'Stranger', 'wounded stranger', 'Kael',
  'Elder', 'village elder', 'Mira',
  'Chapel Keeper', 'menhir keeper',
];

/** Inkbound Academy NPCs */
const INKBOUND_ACADEMY_NPCS = [
  'Dean Solenne', 'Solenne', 'the dean',
  'House Rival', 'rival student', 'Venn',
  'Atelier Master', 'ink master', 'Professor Lin',
  'Librarian', 'stack librarian', 'Oren',
  'Duel Partner', 'courtyard rival', 'Kael',
  'Roommate', 'dorm roommate', 'Mara',
  'Discipline Officer', 'dean officer',
];

/** Void Audience NPCs */
const VOID_AUDIENCE_NPCS = [
  'The Auditor', 'Auditor', 'void negotiator',
  'Pellara', 'innkeeper Pellara',
  'Caster Drenn', 'Drenn', 'Node caster',
  'Kael', 'Reborn Kael', 'trial peer',
  'Scout Solenne', 'Solenne', 'academy scout',
  'The Gallery', 'Gallery entity',
  'Spectator', 'Audience spectator',
  'Resonance Judge', 'stage judge',
];

/** Hollow Core NPCs */
const HOLLOW_CORE_NPCS = [
  'Whisper-Mite', 'spawn advisor', 'the Mite',
  'Bren', 'guild hunter', 'Hunter Bren',
  'Adventurer', 'visiting adventurer', 'Kael',
  'Rival Core', 'neighboring core', 'Core Vex',
  'Bargain Delegate', 'delegation speaker',
  'Spawn', 'defender spawn',
];

/** Dungeon Transport NPCs */
const DUNGEON_TRANSPORT_NPCS = [
  'Scratch', 'Cave Imp Scratch', 'imp guide',
  'Kira', 'delver Kira', 'log writer',
  'Wandering Merchant', 'dungeon merchant',
  'Gatekeeper Boss', 'boss entity',
  'Fellow Delver', 'party delver', 'Venn',
  'Rest Shrine Keeper', 'shrine keeper',
];

/** Cursed Keep NPCs */
const CURSED_KEEP_NPCS = [
  'Father Aldous', 'Aldous', 'village priest',
  'Mira', 'apothecary Mira', 'the apothecary',
  'Innkeeper', 'Greyhollow keeper', 'Torin',
  'Gravedigger', 'village gravedigger', 'Vess',
  'Keep Guardian', 'cursed guardian',
  'Traveler', 'fellow traveler', 'Kael',
];

/** Salt Road Heist NPCs */
const SALT_ROAD_HEIST_NPCS = [
  'Vessa', 'safehouse Vessa', 'bolt-hole keeper',
  'Consul Guard', 'caravan guard', 'Captain Torin',
  'Harbor Fence', 'fence', 'coast buyer',
  'Bribe Dealer', 'market dealer',
  'Checkpoint Officer', 'gate officer',
  'Caravan Driver', 'wagon driver',
  'Fellow Thief', 'heist partner', 'Senna',
];

/** Shattered Coast NPCs */
const SHATTERED_COAST_NPCS = [
  'Sentinel', 'Compact sentinel', 'Captain Vess',
  'Harbor Master', 'Lower Ward master', 'Torin',
  'Merchant', 'Middle Ward merchant',
  'Guild Officer', 'Upper Ward officer', 'Mira',
  'Lift Operator', 'Great Lift operator',
  'Fisher', 'Brinewatch fisher', 'Kael',
  'Keep Warden', 'salt keep warden',
  'Quarry Foreman', 'Stonevein foreman', 'Dren',
];

const NPC_REGISTRY_BY_BIBLE: Record<string, string[]> = {
  'summoned-pact': SUMMONED_PACT_NPCS,
  'hero-awakening': HERO_AWAKENING_NPCS,
  'system-integration': SYSTEM_INTEGRATION_NPCS,
  'gatebreak-ward': GATEBREAK_WARD_NPCS,
  'ascending-spire': ASCENDING_SPIRE_NPCS,
  'fabled-legacy': FABLED_LEGACY_NPCS,
  'inkbound-academy': INKBOUND_ACADEMY_NPCS,
  'void-audience': VOID_AUDIENCE_NPCS,
  'hollow-core': HOLLOW_CORE_NPCS,
  'dungeon-transport': DUNGEON_TRANSPORT_NPCS,
  'cursed-keep': CURSED_KEEP_NPCS,
  'salt-road-heist': SALT_ROAD_HEIST_NPCS,
  'shattered-coast': SHATTERED_COAST_NPCS,
};

// ============================================================================
// COMMON ENTITIES — Roles and generic NPCs that appear across all campaigns
// ============================================================================

const COMMON_NPCS = [
  'guard', 'merchant', 'innkeeper', 'clerk', 'vendor', 'trader',
  'soldier', 'scout', 'runner', 'messenger', 'courier',
  'shopkeeper', 'barkeeper', 'tavernkeeper', 'stall keeper',
  'child', 'elder', 'stranger', 'traveler', 'visitor',
  'priest', 'healer', 'cook', 'smith', 'blacksmith',
  'captain', 'sergeant', 'corporal', 'lieutenant',
  'official', 'officer', 'clerk', 'scribe',
];

// ============================================================================
// REGISTRY API
// ============================================================================

const COMMON_ROLE_SET = new Set(COMMON_NPCS.map((n) => n.toLowerCase()));

/** Generic role nouns (clerk, trader, …) — occupancy only, never CAST named[]. */
export function isCommonRoleNpc(name: string): boolean {
  const t = (name ?? '').trim();
  if (!t) return false;
  const bare = t.replace(/^(the|a|an)\s+/i, '').toLowerCase();
  return COMMON_ROLE_SET.has(bare) || COMMON_ROLE_SET.has(t.toLowerCase());
}

/**
 * Hub contacts and multi-word proper names (Brother Tam, Lowmarket Fence, Wren Holt).
 * Inverse of 02b: these stay named; bare role nouns do not.
 */
export function isHubContactProperName(name: string): boolean {
  const t = (name ?? '').trim();
  if (!t || t.length < 3) return false;
  if (/^(?:Brother|Sister|Father|Captain|High Chanter|Envoy)\s+[A-Z]/i.test(t)) return true;
  if (
    /^[A-Z][\w'-]+\s+(?:Fence|Sergeant|Guard|Clerk|Registrar|Chirurgeon|Handler|Skirmisher|Thug|Priest|Contact|Hand|Owner|Vane|Quill|Tam|Ash|Holt)$/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^[A-Z][a-z'-]+\s+[A-Z][a-z'-]+$/.test(t)) return true;
  return false;
}

/**
 * Lock B — only proper names / hub contacts may enter present[] or CAST named[].
 * COMMON_NPCS and pad-harvested role tokens stay anonymous.
 */
export function canHarvestAsNamedPerson(name: string, bibleId?: string | null): boolean {
  const t = (name ?? '').trim();
  if (!t || t.length < 2) return false;
  if (/^(charter|millstone)$/i.test(t.replace(/^(the|a|an)\s+/i, ''))) return false;
  if (isPolityFactionOrPlaceToken(t) || isRegisteredLocation(t, bibleId)) return false;
  if (isCommonRoleNpc(t) && !isHubContactProperName(t)) return false;
  if (isHubContactProperName(t)) return true;
  if (bibleId) {
    const campaignNpcs = NPC_REGISTRY_BY_BIBLE[bibleId] ?? [];
    const match = campaignNpcs.find((n) => n.toLowerCase() === t.toLowerCase());
    if (match) {
      if (isCommonRoleNpc(match) && !isHubContactProperName(match)) return false;
      if (isHubContactProperName(match)) return true;
      if (/^[A-Z][a-z'-]+$/.test(match) && !isCommonRoleNpc(match)) return true;
    }
  }
  if (/^[A-Z][a-z'-]{1,24}$/.test(t) && !isCommonRoleNpc(t)) return true;
  return false;
}

/**
 * Check if a name is a registered NPC for the given campaign.
 * Includes common role nouns (for prose matching) — use canHarvestAsNamedPerson for CAST/harvest.
 */
export function isRegisteredNpc(name: string, bibleId?: string | null): boolean {
  if (!name || name.length < 2) return false;
  
  const normalized = name.trim().toLowerCase();
  
  // Check common NPCs first
  if (COMMON_NPCS.some(n => n.toLowerCase() === normalized)) {
    return true;
  }
  
  // Check campaign-specific NPCs
  if (bibleId) {
    const campaignNpcs = NPC_REGISTRY_BY_BIBLE[bibleId] ?? [];
    if (campaignNpcs.some(n => n.toLowerCase() === normalized)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a name is a registered location for the given campaign.
 * Only registered locations can be harvested as valid places.
 */
export function isRegisteredLocation(name: string, bibleId?: string | null): boolean {
  if (!name || name.length < 2) return false;
  
  const normalized = name.trim().toLowerCase();
  
  // Check campaign-specific locations
  if (bibleId) {
    const campaignLocations = LOCATION_REGISTRY_BY_BIBLE[bibleId] ?? [];
    if (campaignLocations.some(l => l.toLowerCase() === normalized)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a name is any registered entity (NPC or location).
 * Used for general entity validation.
 */
export function isRegisteredEntity(
  name: string,
  type: 'npc' | 'location',
  bibleId?: string | null
): boolean {
  if (type === 'npc') {
    return isRegisteredNpc(name, bibleId);
  } else {
    return isRegisteredLocation(name, bibleId);
  }
}

/**
 * Get all registered NPCs for a campaign (for debugging / testing).
 */
export function getRegisteredNpcs(bibleId?: string | null): string[] {
  const campaignNpcs = bibleId ? (NPC_REGISTRY_BY_BIBLE[bibleId] ?? []) : [];
  return [...COMMON_NPCS, ...campaignNpcs];
}

/**
 * Get all registered locations for a campaign (for debugging / testing).
 */
export function getRegisteredLocations(bibleId?: string | null): string[] {
  return bibleId ? (LOCATION_REGISTRY_BY_BIBLE[bibleId] ?? []) : [];
}
