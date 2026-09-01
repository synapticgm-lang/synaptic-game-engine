/**
 * Off-spine XP banks — modest code awards (discover / clear / quest / meet / non-lethal).
 * Free-economy safe. STATUS shows real XP when awarded — always with a reason.
 * FO3/Fable spirit: travel, NPC meets, side progress, and clears all drip XP.
 */

import type { GameEvent } from './parser';
import type { GameState, Quest } from './types';
import { detectStanceTreatment } from './factionStandings';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { placeIdFromName } from './places';

export const SANDBOX_XP = {
  discoverHub: 12,
  clearIncidental: 15,
  questTick: 12,
  questCompleteSide: 30,
  questCompleteMain: 45,
  nonLethalResolve: 18,
  /** First real talk/ask with a named present NPC. */
  npcMeet: 8,
  /** First vendor / fence browse at a hub. */
  vendorBrowse: 6,
  /** First examine of a named landmark / prop (not generic look-around). */
  landmarkInspect: 5,
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

/** Room/cell/floor scout nouns — looking at these is bearings, not a named landmark. */
const GENERIC_SCOUT_TARGET =
  /^(?:area|room|ruin|cell|floor|surroundings|vicinity|place|scene|immediate(?:\s+surroundings)?|bars|iron\s+bars|cage|chamber|vault|camp|arrival|environment|here|inside|building|outside)$/i;

/**
 * Normalize chip labels (`explore-the-cell`) and typed lines to comparable text.
 */
function normalizeActionText(action: string): string {
  return (action ?? '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Circle's Price "get your bearings" / orient steps — journal may tick, but no quest-tick XP.
 */
export function isBearingsStyleObjective(description: string): boolean {
  const d = (description ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!d) return false;
  return /\bbearings?\b/.test(d) || /\borient(?:ation|ing)?\b/.test(d);
}

/**
 * True look-around / same-place re-scout — no explore/discover/quest-tick XP.
 * Specific examine/inspect/listen of a named target is NOT look-around (FO3 inspect reward).
 */
export function isLookAroundAction(action: string): boolean {
  const a = normalizeActionText(action);
  if (!a) return false;
  if (/^(?:travel\s+toward|return\s+to)\b/.test(a)) return false;
  if (/\b(?:get|take)(?:\s+(?:your|my|our))?\s+bearings\b/.test(a)) return true;
  if (
    /\b(?:look\s+around|have\s+a\s+look|looking\s+around|whats?\s+near|what'?s\s+nearby|inspect\s+the\s+immediate|scout\s+the\s+(?:area|room|ruin|cell|chamber)|examine\s+the\s+(?:area|room|surroundings)|search\s+the\s+ruin\s+carefully|wait\s+and\s+listen)\b/.test(
      a
    )
    || /^(?:look|wait|observe)\b/.test(a)
    || /^(?:explore|scout)(?:\s+(?:here|inside|around))?$/.test(a)
  ) {
    return true;
  }
  const scout = a.match(
    /\b(?:explore|scout|search|inspect|examine|check|study|look(?:\s+at)?)\s+(?:the\s+|my\s+|this\s+|a\s+)?([\w\s'’.]{2,48}?)(?:\s+more\s+closely)?[.?!]?$/
  );
  const target = (scout?.[1] ?? '').replace(/\s+/g, ' ').trim();
  if (target && GENERIC_SCOUT_TARGET.test(target)) return true;
  // Named-target inspect/examine/search/listen → not a generic re-scout.
  if (
    /\b(?:inspect|examine|search|check|study|listen(?:\s+(?:at|to|from))?|ask|talk|speak|tell|browse|buy|sell|fight|attack|engage|map|travel|walk\s+the|watch\s+the)\b/.test(
      a
    )
  ) {
    return false;
  }
  return false;
}

function normalizeNpcKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

/**
 * Apply one turn of off-spine XP. Idempotent via sandboxAwardKeys.
 */
export function applySandboxXpAwards(
  state: GameState,
  opts: {
    playerAction: string;
    locationName?: string;
    previousLocationName?: string;
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
  const prevLoc = (opts.previousLocationName ?? '').trim().toLowerCase();
  const locKey = (loc ?? '').trim().toLowerCase();
  const locationChanged = !!locKey && !!prevLoc && locKey !== prevLoc;
  const lookAround = isLookAroundAction(opts.playerAction);
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(hubs, loc);
  const action = (opts.playerAction ?? '').trim();

  // Hub discover: once per hub id, only when arriving at / traveling to that hub — not re-look in a ruin.
  if (hub && !lookAround) {
    const key = `discover-hub:${hub.id}`;
    const placeId = placeIdFromName(hub.name);
    const existing = places.find(
      (p) => p.id === placeId || p.name.toLowerCase() === hub.name.toLowerCase()
    );
    const firstVisit = !existing || existing.lastVisitedTurn == null;
    const arrived =
      locationChanged
      || /^(?:travel\s+toward|return\s+to)\b/i.test(action);
    if (firstVisit && arrived && !hasAward(awardKeys, key)) {
      xp += SANDBOX_XP.discoverHub;
      notes.push(`XP Gained: ${SANDBOX_XP.discoverHub} (discovered ${hub.name})`);
      awardKeys.push(key);
    }
    if (existing) {
      places = places.map((p) =>
        p.id === existing.id ? { ...p, lastVisitedTurn: opts.turn, arcStatus: p.arcStatus ?? 'visited' } : p
      );
    } else if (arrived) {
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
  } else if (hub && lookAround) {
    // Re-look at a known hub: stamp visit without XP.
    const placeId = placeIdFromName(hub.name);
    const existing = places.find(
      (p) => p.id === placeId || p.name.toLowerCase() === hub.name.toLowerCase()
    );
    if (existing && existing.lastVisitedTurn != null) {
      places = places.map((p) =>
        p.id === existing.id ? { ...p, lastVisitedTurn: opts.turn } : p
      );
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

  // NPC meet — first talk/ask with a named present person (FO3/Fable social XP drip).
  if (/\b(?:ask|talk|speak|tell|greet|approach|inquire)\b/i.test(action)) {
    const present = [
      ...(state.sceneFacts?.present ?? []),
      ...(state.companions ?? []).map((c) => c.name).filter(Boolean),
    ];
    for (const raw of present) {
      const name = (raw ?? '').trim();
      if (name.length < 2) continue;
      if (/^(?:you|your|panel|system|status|crowd|people|someone|stranger|figure)$/i.test(name)) continue;
      const key = `npc-meet:${normalizeNpcKey(name)}`;
      if (hasAward(awardKeys, key)) continue;
      // Prefer names that appear in the action, else first unmet present.
      const namedInAction = action.toLowerCase().includes(name.toLowerCase());
      if (!namedInAction && present.length > 1) continue;
      xp += SANDBOX_XP.npcMeet;
      notes.push(`XP Gained: ${SANDBOX_XP.npcMeet} (met ${name})`);
      awardKeys.push(key);
      break;
    }
  }

  // Vendor / fence browse at a hub.
  if (
    hub
    && /\b(?:browse|ask about.*(?:price|junk|wares|goods)|fence|buy|sell|vendor|stall|merchant)\b/i.test(action)
  ) {
    const key = `vendor-browse:${hub.id}`;
    if (!hasAward(awardKeys, key)) {
      xp += SANDBOX_XP.vendorBrowse;
      notes.push(`XP Gained: ${SANDBOX_XP.vendorBrowse} (checked ${hub.name} wares)`);
      awardKeys.push(key);
    }
  }

  // Landmark / named prop inspect (once per place+target).
  if (!lookAround) {
    const m = action.match(
      /\b(?:inspect|examine|check|study|map|search)\s+(?:the\s+)?([\w\s'’\-.]{3,48}?)(?:\s+more\s+closely)?[.?!]?$/i
    );
    const target = (m?.[1] ?? '').replace(/\s+/g, ' ').trim();
    if (target && !GENERIC_SCOUT_TARGET.test(target)) {
      const placeSlug = normalizeNpcKey(locKey || 'here');
      const key = `landmark:${placeSlug}:${normalizeNpcKey(target)}`;
      if (!hasAward(awardKeys, key)) {
        xp += SANDBOX_XP.landmarkInspect;
        notes.push(`XP Gained: ${SANDBOX_XP.landmarkInspect} (studied ${target.slice(0, 40)})`);
        awardKeys.push(key);
      }
    }
  }

  const beforeById = new Map(opts.questsBefore.map((q) => [q.id, q]));
  for (const after of opts.questsAfter) {
    const before = beforeById.get(after.id);
    if (!before) continue;

    // Look-around / generic bearings must not farm quest-tick XP (ArcDirector may still journal-tick).
    if (!lookAround) {
      const beforeDone = new Set((before.objectives ?? []).filter((o) => o.completed).map((o) => o.id));
      for (const obj of after.objectives ?? []) {
        if (!obj.completed || beforeDone.has(obj.id)) continue;
        if (isBearingsStyleObjective(obj.description)) continue;
        const key = `quest-tick:${after.id}:${obj.id}`;
        if (hasAward(awardKeys, key)) continue;
        xp += SANDBOX_XP.questTick;
        notes.push(
          `XP Gained: ${SANDBOX_XP.questTick} (quest progress: ${obj.description.slice(0, 48)})`
        );
        awardKeys.push(key);
      }
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
