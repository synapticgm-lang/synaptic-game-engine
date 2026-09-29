/**
 * 28a — Milestone XP only (XP-PLAN.md). One engine function, amounts from xpRules.
 * Pays: encounter end (victory or neutralised), dungeon cleared, quest step, quest complete,
 * first meeting with a story-significant person, first time at a named hub,
 * and the LitRPG "First Steps" achievement. No drip (talk / look / inspect / vendor).
 * Callers run this once per turn, after the turn's text is chosen.
 */

import type { GameEvent } from './parser';
import type { ActiveEncounter, GameState, Item, NpcMemory, Quest } from './types';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { milestoneAreaOpts } from './placeAuthority';
import { finishSettlementQuestCard, settlementCardForChip } from './settlementQuestCards';
import { placeIdFromName } from './places';
import { getSpineNode } from './pyoaSpine';
import { LITRPG_MILESTONE_XP, milestoneXp, type MilestoneKind } from './xpRules';

/** Reference LitRPG milestone amounts under the old key names (drip keys are 0). */
export const SANDBOX_XP = {
  discoverHub: LITRPG_MILESTONE_XP.significantPlace,
  clearIncidental: LITRPG_MILESTONE_XP.encounter,
  questTick: LITRPG_MILESTONE_XP.questStep,
  questCompleteSide: LITRPG_MILESTONE_XP.questComplete,
  questCompleteMain: LITRPG_MILESTONE_XP.questComplete,
  nonLethalResolve: LITRPG_MILESTONE_XP.encounter,
  npcMeet: LITRPG_MILESTONE_XP.significantPerson,
  vendorBrowse: 0,
  landmarkInspect: 0,
} as const;

export interface SandboxXpResult {
  xp: number;
  notes: string[];
  awardKeys: string[];
  places: GameState['places'];
  /** 29r — items granted this turn (settlement card finish). */
  items: Item[];
  lootNotes: string[];
}

function hasAward(keys: string[] | undefined, key: string): boolean {
  return (keys ?? []).includes(key);
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
 * Circle's Price "get your bearings" / orient steps.
 */
export function isBearingsStyleObjective(description: string): boolean {
  const d = (description ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!d) return false;
  return /\bbearings?\b/.test(d) || /\borient(?:ation|ing)?\b/.test(d);
}

/**
 * True look-around / same-place re-scout.
 * Specific examine/inspect/listen of a named target is NOT look-around.
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
  return false;
}

function normalizeNpcKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

/** Story-significant person: on the bible roster, or on the opening card. */
function isSignificantNpc(state: GameState, m: NpcMemory): boolean {
  if ((state.openingEstablishment?.castNpcIds ?? []).includes(m.npcId)) return true;
  return (m.facts ?? []).some((f) => /\bBible roster:/i.test(String(f)));
}

function encounterKind(enc: ActiveEncounter): MilestoneKind {
  const src = `${enc.source ?? ''} ${enc.name ?? ''}`;
  if (/mini[- ]?boss|\belite\b/i.test(src)) return 'miniBoss';
  if (/\bboss\b/i.test(src)) return 'boss';
  return 'encounter';
}

/**
 * Apply one turn of milestone XP. Idempotent via sandboxAwardKeys.
 * Also stamps hub visits on the places ledger (unchanged behaviour).
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
    /** 28a — the encounter that was live at the start of this turn (for CR / boss). */
    endedEncounter?: ActiveEncounter | null;
    turn: number;
  }
): SandboxXpResult {
  const notes: string[] = [];
  const awardKeys = [...(state.sandboxAwardKeys ?? [])];
  let xp = 0;
  let places = [...(state.places ?? [])];
  const mode = state.engineMode;
  const level = state.character?.level ?? 1;
  const partySize = 1 + (state.companions ?? []).filter((c) => c.type === 'party').length;
  const areaOpts = milestoneAreaOpts(state);

  const pay = (key: string, kind: MilestoneKind, label: string, cr?: string | number | null) => {
    if (hasAward(awardKeys, key)) return;
    awardKeys.push(key);
    const r = milestoneXp(mode, kind, { level, partySize, cr, strictness: state.gmStrictness, ...areaOpts });
    if (r.amount <= 0) return;
    xp += r.amount;
    notes.push(`XP Gained: ${r.amount} (${label}${r.detail ? ` — ${r.detail}` : ''})`);
  };

  const loc = opts.locationName ?? state.currentLocation;
  const prevLoc = (opts.previousLocationName ?? '').trim().toLowerCase();
  const locKey = (loc ?? '').trim().toLowerCase();
  const locationChanged = !!locKey && !!prevLoc && locKey !== prevLoc;
  const lookAround = isLookAroundAction(opts.playerAction);
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), loc);
  const action = (opts.playerAction ?? '').trim();

  // Significant place: first time at a named hub (the start hub counts).
  if (hub) {
    pay(`discover-hub:${hub.id}`, 'significantPlace', `reached ${hub.name}`);
    const placeId = placeIdFromName(hub.name);
    const existing = places.find(
      (p) => p.id === placeId || p.name.toLowerCase() === hub.name.toLowerCase()
    );
    const arrived = locationChanged || /^(?:travel\s+toward|return\s+to)\b/i.test(action);
    if (!lookAround) {
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
    } else if (existing && existing.lastVisitedTurn != null) {
      places = places.map((p) => (p.id === existing.id ? { ...p, lastVisitedTurn: opts.turn } : p));
    }
  }

  // Encounter end: victory or neutralised (parley). Escape / defeat / capture pay nothing.
  const ended = opts.endedEncounter ?? null;
  if (ended && opts.encounterCleared !== false && !state.activeEncounter) {
    const receipts = state.arcDirector?.encounterClearedReceipts ?? [];
    const rec = [...receipts].reverse().find((r) => r.name === ended.name && r.turn >= opts.turn - 2);
    const outcome = rec?.outcome ?? (opts.enemyKilled ? 'victory' : ended.terminalOutcome);
    if (outcome === 'victory' || outcome === 'parleyResolved') {
      pay(
        `encounter:${ended.encounterId ?? normalizeNpcKey(ended.name)}:${rec?.turn ?? opts.turn}`,
        encounterKind(ended),
        `${outcome === 'victory' ? 'defeated' : 'resolved'} ${ended.name}`,
        ended.cr
      );
    }
  }

  // Dungeon cleared (closeDungeon marks the site place 'cleared').
  for (const p of places) {
    if (p.arcStatus === 'cleared') pay(`dungeon-clear:${p.id}`, 'dungeonCleared', `cleared ${p.name}`);
  }

  // Significant person: the opening cast, and anyone on the bible roster the player talks to here.
  const memories = state.npcMemories ?? [];
  for (const m of memories) {
    if ((state.openingEstablishment?.castNpcIds ?? []).includes(m.npcId)) {
      pay(`npc-meet:${normalizeNpcKey(m.npcName)}`, 'significantPerson', `met ${m.npcName}`);
    }
  }
  if (/\b(?:ask|talk|speak|tell|greet|approach|inquire|press|offer)\b/i.test(action)) {
    const low = action.toLowerCase();
    const present = new Set((state.sceneFacts?.present ?? []).map((n) => String(n).trim().toLowerCase()));
    for (const m of memories) {
      if (!isSignificantNpc(state, m)) continue;
      const names = [m.npcName, ...(m.aliases ?? [])].map((n) => (n ?? '').trim().toLowerCase()).filter(Boolean);
      const here = m.present === true || names.some((n) => present.has(n));
      if (!here || !names.some((n) => low.includes(n))) continue;
      pay(`npc-meet:${normalizeNpcKey(m.npcName)}`, 'significantPerson', `met ${m.npcName}`);
    }
  }

  // Quest steps and quest completion.
  const beforeById = new Map(opts.questsBefore.map((q) => [q.id, q]));
  for (const after of opts.questsAfter) {
    const before = beforeById.get(after.id);
    if (!before) continue;
    const beforeDone = new Set((before.objectives ?? []).filter((o) => o.completed).map((o) => o.id));
    for (const obj of after.objectives ?? []) {
      if (!obj.completed || beforeDone.has(obj.id)) continue;
      // Bearings / look-around ticks are orientation, not a milestone.
      if (lookAround || isBearingsStyleObjective(obj.description)) continue;
      pay(`quest-tick:${after.id}:${obj.id}`, 'questStep', `quest step: ${obj.description.slice(0, 48)}`);
    }
    if (after.status === 'completed' && before.status !== 'completed') {
      pay(`quest-complete:${after.id}`, 'questComplete', `quest complete: ${after.name}`);
    }
  }

  // 29r — settlement card finished: its chip picked at its place, paid once.
  const lootNotes: string[] = [];
  const items: Item[] = [];
  const chipCard = settlementCardForChip({ ...state, places }, action, [opts.previousLocationName, loc]);
  if (chipCard) {
    const fin = finishSettlementQuestCard({ ...state, places, sandboxAwardKeys: awardKeys }, chipCard.id);
    if (fin.card && fin.awardKey) {
      places = fin.places;
      awardKeys.push(fin.awardKey);
      xp += fin.xp;
      notes.push(...fin.notes);
      lootNotes.push(...fin.lootNotes);
      if (fin.item) items.push(fin.item);
    }
  }

  // Main-path spine: the node walk is the main quest even when no journal objective ticks.
  const spine = state.pyoaSpine;
  if (spine?.visited?.length) {
    const walked = spine.visited.slice(1);
    for (const id of walked) {
      const place = getSpineNode(id)?.place?.replace(/\s+/g, ' ').trim();
      if (place) pay(`spine-place:${place.toLowerCase()}`, 'significantPlace', `reached ${place}`);
    }
    spine.visited.forEach((id, i) => {
      if (i < spine.visited.length - 1 && getSpineNode(id)?.majorFork) {
        pay(`spine-fork:${id}`, 'questStep', 'main path: a road chosen');
      }
    });
    if (spine.endingId) pay(`spine-ending:${spine.endingId}`, 'questComplete', 'main path: an ending reached');
  }

  // LitRPG achievement (engine event, no AI): first quest step, or turn 5 reached.
  if (mode === 'litrpg') {
    const firstStep = awardKeys.some((k) => k.startsWith('quest-tick:') || k.startsWith('quest-complete:'));
    if (firstStep || opts.turn >= 5) pay('achv:first-steps', 'achievement', 'Achievement: First Steps');
  }

  void opts.events;
  return { xp, notes, awardKeys, places, items, lootNotes };
}
