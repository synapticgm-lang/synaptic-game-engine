/**
 * Pack 12 Fog-of-War — Location Discovery Tracking
 * 
 * Locations are only visible in WORLD panel / travel options after discovery.
 * Discovery happens via:
 * - GM story mentions location name
 * - Travel/arrival at location
 * - NPC dialogue mentions location
 * - Quest reveals location
 * - Map exploration
 */

import type { GameState, WorldAtlasSettlement } from './types';
import { placeIdFromName } from './placeUtils';
import { normalizeLocationName } from './worldMapAuthority';

/**
 * Check if a location has been discovered.
 */
export function isLocationDiscovered(
  state: GameState,
  locationNameOrId: string
): boolean {
  const discovered = state.discoveredLocations ?? [];
  const normalized = normalizeLocationName(locationNameOrId);
  
  // Check direct match
  if (discovered.includes(locationNameOrId)) return true;
  if (discovered.includes(normalized)) return true;
  
  // Check place ID match
  const placeId = placeIdFromName(locationNameOrId);
  if (discovered.includes(placeId)) return true;
  
  // Check settlement ID match from world atlas
  const settlement = state.worldAtlas?.settlements?.find(
    (s) =>
      s.id === locationNameOrId ||
      s.name.toLowerCase() === normalized ||
      s.aliases?.some((a) => a.toLowerCase() === normalized)
  );
  if (settlement && discovered.includes(settlement.id)) return true;
  
  // Check place registry aliases
  const place = state.places?.find(
    (p) =>
      p.id === locationNameOrId ||
      p.name.toLowerCase() === normalized ||
      p.aliases?.some((a) => a.toLowerCase() === normalized)
  );
  if (place && discovered.includes(place.id)) return true;
  
  return false;
}

/**
 * Mark a location as discovered.
 */
export function discoverLocation(
  state: GameState,
  locationNameOrId: string
): GameState {
  if (!locationNameOrId?.trim()) return state;
  
  const discovered = state.discoveredLocations ?? [];
  const normalized = normalizeLocationName(locationNameOrId);
  
  // Check if already discovered
  if (isLocationDiscovered(state, locationNameOrId)) return state;
  
  // Determine canonical ID to store
  let canonicalId: string;
  
  // Check settlement
  const settlement = state.worldAtlas?.settlements?.find(
    (s) =>
      s.name.toLowerCase() === normalized ||
      s.aliases?.some((a) => a.toLowerCase() === normalized)
  );
  if (settlement) {
    canonicalId = settlement.id;
  } else {
    // Check place registry
    const place = state.places?.find(
      (p) =>
        p.name.toLowerCase() === normalized ||
        p.aliases?.some((a) => a.toLowerCase() === normalized)
    );
    if (place) {
      canonicalId = place.id;
    } else {
      // Use place ID generation for consistency
      canonicalId = placeIdFromName(locationNameOrId);
    }
  }
  
  return {
    ...state,
    discoveredLocations: [...discovered, canonicalId],
  };
}

/**
 * Mark multiple locations as discovered (e.g., from opening or quest reveal).
 */
export function discoverLocations(
  state: GameState,
  locationNames: string[]
): GameState {
  let next = state;
  for (const name of locationNames) {
    next = discoverLocation(next, name);
  }
  return next;
}

/**
 * Detect location mentions in narrative text and mark them as discovered.
 */
export function detectAndDiscoverLocations(
  state: GameState,
  narrative: string
): GameState {
  if (!narrative?.trim()) return state;
  
  let next = state;
  
  // Check settlements from world atlas
  if (state.worldAtlas?.settlements?.length) {
    for (const settlement of state.worldAtlas.settlements) {
      // Check settlement name
      const namePattern = new RegExp(
        `\\b${escapeRegex(settlement.name)}\\b`,
        'i'
      );
      if (namePattern.test(narrative)) {
        next = discoverLocation(next, settlement.id);
        continue;
      }
      
      // Check aliases
      if (settlement.aliases?.length) {
        for (const alias of settlement.aliases) {
          const aliasPattern = new RegExp(
            `\\b${escapeRegex(alias)}\\b`,
            'i'
          );
          if (aliasPattern.test(narrative)) {
            next = discoverLocation(next, settlement.id);
            break;
          }
        }
      }
    }
  }
  
  // Check place registry
  if (state.places?.length) {
    for (const place of state.places) {
      const namePattern = new RegExp(
        `\\b${escapeRegex(place.name)}\\b`,
        'i'
      );
      if (namePattern.test(narrative)) {
        next = discoverLocation(next, place.id);
        continue;
      }
      
      // Check aliases
      if (place.aliases?.length) {
        for (const alias of place.aliases) {
          const aliasPattern = new RegExp(
            `\\b${escapeRegex(alias)}\\b`,
            'i'
          );
          if (aliasPattern.test(narrative)) {
            next = discoverLocation(next, place.id);
            break;
          }
        }
      }
    }
  }
  
  return next;
}

/**
 * Get discovered settlements from world atlas.
 */
export function getDiscoveredSettlements(
  state: GameState
): WorldAtlasSettlement[] {
  if (!state.worldAtlas?.settlements?.length) return [];
  
  return state.worldAtlas.settlements.filter((s) =>
    isLocationDiscovered(state, s.id)
  );
}

/**
 * Filter faction standings to only show those from discovered locations.
 */
export function filterDiscoveredFactions(
  state: GameState
): typeof state.worldLedger.factionStandings {
  const factions = state.worldLedger?.factionStandings ?? [];
  if (!factions.length) return factions;
  
  // For now, show all factions if they have notes (implies interaction)
  // This is a simple heuristic - could be refined based on faction-location mapping
  return factions.filter((f) => {
    // Always show factions with notes (player has interacted)
    if (f.notes?.trim()) return true;
    
    // Check if faction name appears in discovered locations
    const factionKey = normalizeLocationName(f.name);
    return state.discoveredLocations?.some((locId) => {
      const locKey = normalizeLocationName(locId);
      return (
        locKey.includes(factionKey) ||
        factionKey.includes(locKey)
      );
    }) ?? false;
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
