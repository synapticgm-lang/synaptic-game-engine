/**
 * Off-spine XP banks — modest code awards (discover / clear / quest / non-lethal).
 * Free-economy safe. STATUS shows real XP when awarded.
 */

import type { GameEvent } from './parser';
import type { GameState, Quest } from './types';
import { detectStanceTreatment } from './factionStandings';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { placeIdFromName } from './places';

export const SANDBOX_XP = {
  discoverHub: 8,
  clearIncidental: 12,
  questTick: 10,
  questCompleteSide: 25,
  questCompleteMain: 40,
  nonLethalResolve: 15,
} as const;

export interface SandboxXpResult {
  xp: number;
  notes: string[];
  awardKeys: string[];
  places: GameState['places'];
}

function hasAward(keys: string[] | undefined, key: string): boolean {
  return (keys ?? []).includes(key);
}

function questTypeXp(q: Quest): number {
  return q.type === 'main' ? SANDBOX_XP.questCompleteMain : SANDBOX_XP.questCompleteSide;
}

/**
 * Apply one turn of off-spine XP. Idempotent via sandboxAwardKeys.
 */
export function applySandboxXpAwards(
  state: GameState,
  opts: {
    playerAction: string;
    locationName?: string;
    questsBefore: Quest[];
    questsAfter: Quest[];
    events: GameEvent[];
    encounterCleared?: boolean;
    enemyKilled?: boolean;
    turn: number;
  }
): SandboxXpResult {
  const notes: string[] = [];
  const awardKeys = [...(state.sandboxAwardKeys ?? [])];
  let xp = 0;
  let places = [...(state.places ?? [])];

  const loc = opts.locationName ?? state.currentLocation;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(hubs, loc);
  if (hub) {
    const key = `discover-hub:${hub.id}`;
    const placeId = placeIdFromName(hub.name);
    const existing = places.find(
      (p) => p.id === placeId || p.name.toLowerCase() === hub.name.toLowerCase()
    );
    const firstVisit = !existing || existing.lastVisitedTurn == null;
    if (firstVisit && !hasAward(awardKeys, key)) {
      xp += SANDBOX_XP.discoverHub;
      notes.push(`XP Gained: ${SANDBOX_XP.discoverHub} (discovered ${hub.name})`);
      awardKeys.push(key);
    }
    if (existing) {
      places = places.map((p) =>
        p.id === existing.id ? { ...p, lastVisitedTurn: opts.turn, arcStatus: p.arcStatus ?? 'visited' } : p
      );
    } else {
      places.push({
        id: placeId,
        name: hub.name,
        aliases: hub.aliases,
        threatTier: hub.threatTier,
        mapScale: 'street',
        arcStatus: 'visited',
        lastVisitedTurn: opts.turn,
      });
    }
  }

  if (opts.encounterCleared && !opts.enemyKilled) {
    const key = `nonlethal:${opts.turn}`;
    if (!hasAward(awardKeys, key) && detectStanceTreatment(opts.playerAction)) {
      xp += SANDBOX_XP.nonLethalResolve;
      notes.push(`XP Gained: ${SANDBOX_XP.nonLethalResolve} (non-lethal resolve)`);
      awardKeys.push(key);
    }
  } else if (opts.encounterCleared && opts.enemyKilled) {
    // Incidental (non-dungeon) clear bonus beyond ledger kill XP — once per encounter name/turn.
    const encName = state.activeEncounter?.name ?? 'threat';
    const key = `incidental-clear:${encName}:${opts.turn}`;
    if (!state.activeDungeon && !hasAward(awardKeys, key)) {
      xp += SANDBOX_XP.clearIncidental;
      notes.push(`XP Gained: ${SANDBOX_XP.clearIncidental} (cleared incidental threat)`);
      awardKeys.push(key);
    }
  }

  const beforeById = new Map(opts.questsBefore.map((q) => [q.id, q]));
  for (const after of opts.questsAfter) {
    const before = beforeById.get(after.id);
    if (!before) continue;

    const beforeDone = new Set((before.objectives ?? []).filter((o) => o.completed).map((o) => o.id));
    for (const obj of after.objectives ?? []) {
      if (!obj.completed || beforeDone.has(obj.id)) continue;
      const key = `quest-tick:${after.id}:${obj.id}`;
      if (hasAward(awardKeys, key)) continue;
      xp += SANDBOX_XP.questTick;
      notes.push(`XP Gained: ${SANDBOX_XP.questTick} (quest objective)`);
      awardKeys.push(key);
    }

    if (after.status === 'completed' && before.status !== 'completed') {
      const key = `quest-complete:${after.id}`;
      if (!hasAward(awardKeys, key)) {
        const amt = questTypeXp(after);
        xp += amt;
        notes.push(`XP Gained: ${amt} (quest complete: ${after.name})`);
        awardKeys.push(key);
      }
    }
  }

  // Soft accept: newly revealed+active from hidden counts as accept for XP floor (tiny).
  for (const after of opts.questsAfter) {
    const before = beforeById.get(after.id);
    if (!before) continue;
    if (
      after.revealed === true
      && after.status === 'active'
      && (before.revealed !== true || before.status === 'hidden')
      && (after.recommendedLevel ?? 1) >= 2
    ) {
      const key = `quest-accept:${after.id}`;
      if (!hasAward(awardKeys, key)) {
        // Accept itself is not XP — faction handles that. Skip.
        awardKeys.push(key);
      }
    }
  }

  void opts.events;
  return { xp, notes, awardKeys, places };
}
