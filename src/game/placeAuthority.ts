import type { ActiveDungeonState } from './mapEngine';
import type { GameState, LocationSheet, MapScale, MapTier } from './types';

/** Resolve danger tier from place authority — never invent from map scale. */
export function resolveDangerTier(state: GameState): MapTier | null {
  const dungeon = state.activeDungeon;
  if (dungeon && dungeon.blueprintId !== 'local-area') {
    return (dungeon.dangerTier ?? dungeon.tier ?? null) as MapTier | null;
  }
  if (state.locationSheet?.dangerTier) return state.locationSheet.dangerTier;
  const active = (state.quests ?? []).find((q) => q.status === 'active' && q.revealed && q.dangerTier);
  if (active?.dangerTier) return active.dangerTier;
  return null;
}

export function resolveMapScale(state: GameState): MapScale {
  if (state.locationSheet?.mapScale) return state.locationSheet.mapScale;
  const dungeon = state.activeDungeon;
  if (!dungeon) return 'street';
  if (dungeon.blueprintId === 'local-area') return 'street';
  return 'dungeon';
}

export function mapScaleLabel(scale: MapScale): string {
  switch (scale) {
    case 'district':
      return 'District overview';
    case 'street':
      return 'Local streets · ~1 km scale';
    case 'interior':
      return 'Interior';
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
  if (dungeon?.blueprintId === 'local-area') {
    return { ...sheet, mapScale: 'street', dangerTier: undefined };
  }
  if (dungeon && dungeon.blueprintId !== 'local-area') {
    return {
      ...sheet,
      mapScale: 'dungeon',
      dangerTier: dungeon.dangerTier ?? dungeon.tier,
    };
  }
  return sheet;
}
