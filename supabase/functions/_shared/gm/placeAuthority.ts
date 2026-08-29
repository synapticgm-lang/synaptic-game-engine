import type { ActiveDungeonState } from './mapEngine.ts';
import type { GameState, LocationSheet, MapScale, MapTier } from './types.ts';

export const STREET_MAP_BLUEPRINT = 'local-area';
export const INTERIOR_MAP_BLUEPRINT = 'interior-plan';

/** Named interiors: cathedral, circle, vault, hall, court, building/ruin/husk — not outdoor streets. */
const INTERIOR_PLACE_CUES =
  /\b(?:cathedral|nave|vestry|undercroft|crypt|chapel|sanctuary|sanctum|vault|circle|court|hall|guildhall|chamber|keep|castle|palace|temple|inn|tavern|manor|wing|aisle|narthex|transept|choir|cloister|sacristy|apse|building|ruin|ruins|husk|shell|foundation|rubble|burnt|charred|collapsed|room|rooms|basement|attic|tower|warehouse|apartment|interior|floor[- ]?plan)\b/i;

const OUTDOOR_OVERRIDE =
  /\b(?:street|road|roads|lane|alley|square|market|plaza|yard|wall|gate|bridge|park|close|harbour|harbor|docks?)\b/i;

/** Interior cues that win even when the label also names roads/streets nearby (alone ruin dumps). */
const OUTDOOR_STILL_INSIDE =
  /\b(?:circle|nave|vault|vestry|chapel|undercroft|crypt|hall|court|chamber|aisle|sanctum|building|ruin|ruins|husk|shell|foundation|rubble|burnt|charred|collapsed|room|rooms|basement|attic|interior|inside)\b/i;

export function isStreetMap(dungeon: { blueprintId?: string } | null | undefined): boolean {
  return dungeon?.blueprintId === STREET_MAP_BLUEPRINT;
}

export function isInteriorMap(dungeon: { blueprintId?: string } | null | undefined): boolean {
  return dungeon?.blueprintId === INTERIOR_MAP_BLUEPRINT;
}

/** Seeded tactical dungeon (First Blood, caves) — not street grid or hall floor plan. */
export function isExplorableDungeon<T extends { blueprintId?: string }>(
  dungeon: T | null | undefined
): dungeon is T & { blueprintId: string } {
  return !!(dungeon?.blueprintId && !isStreetMap(dungeon) && !isInteriorMap(dungeon));
}

/** True when the current location is inside a hall / cathedral / circle / vault / court / building. */
export function isInteriorPlace(name: string | undefined): boolean {
  const n = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!n) return false;
  // Building / ruin / chamber beats outdoor "roads" in the same string (alone Summoned Pact dumps).
  if (OUTDOOR_STILL_INSIDE.test(n) && INTERIOR_PLACE_CUES.test(n)) return true;
  if (OUTDOOR_OVERRIDE.test(n) && !OUTDOOR_STILL_INSIDE.test(n)) return false;
  return INTERIOR_PLACE_CUES.test(n);
}

/** Resolve danger tier from place authority — never invent from map scale. */
export function resolveDangerTier(state: GameState): MapTier | null {
  const dungeon = state.activeDungeon;
  if (isExplorableDungeon(dungeon)) {
    return (dungeon.dangerTier ?? dungeon.tier ?? null) as MapTier | null;
  }
  if (state.locationSheet?.dangerTier) return state.locationSheet.dangerTier;
  const active = (state.quests ?? []).find((q) => q.status === 'active' && q.revealed && q.dangerTier);
  if (active?.dangerTier) return active.dangerTier;
  return null;
}

/**
 * Simulationist zone threat vs player level.
 * Prefer locationSheet.threatTier, then matching PlaceRecord.threatTier,
 * then GameState.threatTier, then dungeon/sheet dangerTier.
 */
export function resolveThreatTier(state: GameState): number | null {
  const sheetTier = state.locationSheet?.threatTier;
  if (typeof sheetTier === 'number' && Number.isFinite(sheetTier)) return sheetTier;

  const placeName = (state.locationSheet?.name ?? state.currentLocation ?? '').trim().toLowerCase();
  if (placeName && state.places?.length) {
    const match = state.places.find((p) => {
      const names = [p.name, p.loreName, ...(p.aliases ?? [])].filter(Boolean) as string[];
      return names.some((n) => n.trim().toLowerCase() === placeName) || p.id === placeName;
    });
    if (typeof match?.threatTier === 'number' && Number.isFinite(match.threatTier)) {
      return match.threatTier;
    }
  }

  if (typeof state.threatTier === 'number' && Number.isFinite(state.threatTier)) {
    return state.threatTier;
  }

  const danger = resolveDangerTier(state);
  return danger ?? null;
}

export function resolveMapScale(state: GameState): MapScale {
  const dungeon = state.activeDungeon;
  const camera = state.sceneFacts?.cameraLock;
  if (camera?.scale === 'outdoor' && !isExplorableDungeon(dungeon)) return 'street';
  if (isInteriorMap(dungeon)) return 'interior';
  if (isStreetMap(dungeon)) return 'street';
  if (isExplorableDungeon(dungeon)) return 'dungeon';
  if (state.locationSheet?.mapScale === 'interior' || isInteriorPlace(state.locationSheet?.name || state.currentLocation)) {
    return 'interior';
  }
  if (state.locationSheet?.mapScale) return state.locationSheet.mapScale;
  return 'street';
}

export function mapScaleLabel(scale: MapScale): string {
  switch (scale) {
    case 'district':
      return 'District overview';
    case 'street':
      return 'Local area · ~1 km';
    case 'interior':
      return 'Interior floor plan';
    case 'dungeon':
      return 'Tactical interior';
    default:
      return 'Map';
  }
}

export function dangerTierLabel(tier: MapTier | null | undefined): string | null {
  if (!tier) return null;
  return `Danger Tier ${tier}`;
}

/** Ensure street sheets don't carry dungeon danger labels. */
export function normalizeSheetAuthority(
  sheet: LocationSheet,
  dungeon: ActiveDungeonState | null | undefined
): LocationSheet {
  if (isStreetMap(dungeon)) {
    return { ...sheet, mapScale: 'street', dangerTier: undefined };
  }
  if (isInteriorMap(dungeon) || (!dungeon && isInteriorPlace(sheet.name))) {
    return { ...sheet, mapScale: 'interior', dangerTier: undefined };
  }
  if (isExplorableDungeon(dungeon)) {
    return {
      ...sheet,
      mapScale: 'dungeon',
      dangerTier: dungeon.dangerTier ?? dungeon.tier,
    };
  }
  return sheet;
}
