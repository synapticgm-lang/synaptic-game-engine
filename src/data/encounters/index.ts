import type { EngineMode } from '@/game/types';
import type { EncounterSeed } from './types';
import { DND_ENCOUNTERS } from './dnd';
import { LITRPG_ENCOUNTERS } from './litrpg';
import { PYOA_ENCOUNTERS } from './pyoa';
import { RPG_ENCOUNTERS } from './rpg';

export type { EncounterSeed, EncounterTier } from './types';
export { LITRPG_ENCOUNTERS } from './litrpg';
export { DND_ENCOUNTERS } from './dnd';
export { RPG_ENCOUNTERS } from './rpg';
export { PYOA_ENCOUNTERS } from './pyoa';

const BY_MODE: Record<EngineMode, EncounterSeed[]> = {
  litrpg: LITRPG_ENCOUNTERS,
  dnd: DND_ENCOUNTERS,
  rpg: RPG_ENCOUNTERS,
  pyoa: PYOA_ENCOUNTERS,
};

export function encountersForMode(mode: EngineMode | undefined | null): EncounterSeed[] {
  if (!mode) return LITRPG_ENCOUNTERS;
  return BY_MODE[mode] ?? LITRPG_ENCOUNTERS;
}

export function allCatalogEncounters(): EncounterSeed[] {
  return [...LITRPG_ENCOUNTERS, ...DND_ENCOUNTERS, ...RPG_ENCOUNTERS, ...PYOA_ENCOUNTERS];
}

export function findCatalogEncounter(id: string): EncounterSeed | undefined {
  return allCatalogEncounters().find((s) => s.id === id);
}

export function catalogFoeNames(mode?: EngineMode | null): string[] {
  return encountersForMode(mode).map((s) => s.foeName);
}

export function isCatalogFoeName(name: string, mode?: EngineMode | null): boolean {
  const key = name.trim().toLowerCase();
  if (!key) return false;
  const pool = mode ? encountersForMode(mode) : allCatalogEncounters();
  return pool.some((s) => s.foeName.toLowerCase() === key);
}
