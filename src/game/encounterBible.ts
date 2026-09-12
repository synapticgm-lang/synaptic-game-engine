/**
 * Encounter bible (Manus WS-4 / Phase 2).
 * Catalog pick for ArcDirector drought — existing encounterTerminalFsm stays the FSM.
 * No SNAPSHOT pile. No stitch-as-writer. No novel foe tokens at the director layer.
 */

import {
  allCatalogEncounters,
  catalogFoeNames,
  encountersForMode,
  isCatalogFoeName,
  type EncounterSeed,
} from '@/data/encounters';
import { matchesLastKillName } from './combatAuthority';
import { isEncounterOnCooldown } from './encounterTerminalFsm';
import type { EngineMode, GameState } from './types';

export type { EncounterSeed } from '@/data/encounters';
export {
  allCatalogEncounters,
  catalogFoeNames,
  encountersForMode,
  findCatalogEncounter,
  isCatalogFoeName,
} from '@/data/encounters';

function inferCatalogTier(state: GameState): EncounterSeed['tier'] {
  const turn = state.turn ?? 0;
  const threat =
    (state as GameState & { currentLocation?: { threatTier?: string | number } }).currentLocation &&
    typeof state.currentLocation === 'object'
      ? (state.currentLocation as { threatTier?: string | number }).threatTier
      : undefined;
  const here = String(state.currentLocation ?? '');
  const dungeon = !!state.activeDungeon;
  if (dungeon && (threat === 'high' || threat === 3 || /boss|keep|undercroft|engine|scar|reliquary/i.test(here))) {
    return turn >= 20 ? 'boss' : 'elite';
  }
  if (turn > 18) return 'elite';
  return 'trash';
}

function hereHubId(state: GameState): string | undefined {
  const here = String(state.currentLocation ?? '').toLowerCase();
  if (!here) return undefined;
  const hits = allCatalogEncounters().filter((s) => s.hubId && here.includes(s.hubId.replace(/^sp-hub-/, '').replace(/-/g, ' ')));
  if (hits[0]?.hubId) return hits[0].hubId;
  if (/mireglass/.test(here)) return 'sp-hub-mireglass';
  if (/cinderwake/.test(here)) return 'sp-hub-cinderwake';
  if (/sump/.test(here)) return 'sp-hub-sump-court';
  if (/hollow engine/.test(here)) return 'sp-hub-hollow-engine';
  if (/argent/.test(here)) return 'sp-hub-argent';
  if (/vhal|reliquary/.test(here)) return 'sp-hub-reliquary';
  if (/integration scar/.test(here)) return 'sp-hub-integration-scar';
  return undefined;
}

function seedLegal(state: GameState, seed: EncounterSeed): boolean {
  if (seed.tier === 'crisis') return false;
  if (isEncounterOnCooldown(state, seed.foeName)) return false;
  if (matchesLastKillName(seed.foeName, state.sceneFacts?.lastKill)) return false;
  return true;
}

function scoreSeed(state: GameState, seed: EncounterSeed, want: EncounterSeed['tier'], hubId?: string): number {
  let score = 0;
  if (seed.tier === want) score += 4;
  else if (want === 'boss' && seed.tier === 'elite') score += 2;
  else if (want === 'elite' && seed.tier === 'trash') score += 1;
  if (hubId && seed.hubId === hubId) score += 3;
  return score;
}

/**
 * Director pick: a named catalog row. Never invents a foe token.
 * PYOA drought stays off (caller); catalog still lists crisis seeds for tests.
 */
export function selectCatalogEncounter(state: GameState): EncounterSeed | null {
  const mode: EngineMode = state.engineMode ?? 'litrpg';
  if (mode === 'pyoa') return null;
  const pool = encountersForMode(mode).filter((s) => seedLegal(state, s));
  const want = inferCatalogTier(state);
  const hubId = hereHubId(state);
  const ranked = [...pool].sort((a, b) => scoreSeed(state, b, want, hubId) - scoreSeed(state, a, want, hubId));
  const top = ranked.filter((s) => scoreSeed(state, s, want, hubId) === scoreSeed(state, ranked[0]!, want, hubId));
  if (!top.length) {
    return encountersForMode(mode).find((s) => s.tier === 'trash') ?? null;
  }
  const clearCount = (state.stateTxLog ?? []).filter((t) => /Encounter cleared|Encounter:/i.test(t.summary)).length;
  return top[(clearCount + state.turn) % top.length] ?? top[0]!;
}

/** Catalog display names the drought table may rotate — never a novel token. */
export function catalogDroughtNames(state: GameState): string[] {
  const mode = state.engineMode ?? 'litrpg';
  const names = catalogFoeNames(mode).filter((n) => {
    const seed = encountersForMode(mode).find((s) => s.foeName === n);
    return seed && seed.tier !== 'crisis';
  });
  return names.length ? names : catalogFoeNames(mode);
}

/** True when lastKill is a catalog foe — living Talk for that noun is illegal. */
export function isCatalogFoeTalkForbidden(state: GameState, name: string): boolean {
  const kill = state.sceneFacts?.lastKill;
  if (!kill?.name || kill.outcome !== 'victory') return false;
  if (!isCatalogFoeName(kill.name, state.engineMode) && !isCatalogFoeName(kill.name)) return false;
  return matchesLastKillName(name, kill);
}

/** Living catalog foe names that may still be talked to (not lastKill). */
export function livingCatalogTalkTargets(state: GameState): string[] {
  const mode = state.engineMode ?? 'litrpg';
  return catalogFoeNames(mode).filter((n) => !isCatalogFoeTalkForbidden(state, n));
}
