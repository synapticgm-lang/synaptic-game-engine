/**
 * T10DIR — sole owner of "what happens next" (story progression).
 * Pure / deterministic: seeded by turn + save seed. No AI, Date.now, or Math.random.
 *
 * SRD 5.2.1 (Basic Rules / Playing the Game — The Order of Combat / Actions):
 * "On your turn, you can move a distance up to your speed and take one action."
 * Free text is never rejected; only the engine rolls dice. Director injects engine facts
 * and chip specs — never rolls and never invents combat outcomes.
 */

import type {
  ActiveEncounter,
  DirectorChipSpec,
  DirectorDevelopment,
  DirectorNeed,
  DirectorPlan,
  GameState,
  NpcMemory,
  OpenThread,
  Quest,
  SceneThreadPlan,
  TimelineFact,
} from './types';
import { chipAddressee, mentionsName, peopleHere } from './chipLegality';
import { isCrowdFillerToken } from './chromeAuthority';
import { markPendingSpawnPreface } from './combatAuthority';
import { STALL_N } from './directorConstants';
import { selectCatalogEncounter } from './encounterBible';
import { initEncounterTerminal, parkPendingEncounter } from './encounterTerminalFsm';
import { hubsForBibleId, matchHub, placeFirstSight } from './outdoorHubs';
import { applyPlaceEngineEvent, bindPlanDirector, collectOpenThreads } from './openThreads';
import { npcChipWant, npcGoalPersonHere } from './openThreadUtils';
import { parkedThreatHere } from './placeThreats';
import { exitNpc, seat } from './presentAuthority';
import { applyPressureAgendaAdvance, tickPressureClock } from './pressureClock';
import { ensureQuestFloor } from './questGenerator';
import { isMetNpc, presentNpcRecords } from './npcRecords';
import { commitTravel, isJourneyUnderway, roadMeetingOver } from './travelJourney';
import { fuzzyTypedName } from './typedNameMatch';

export { STALL_N };

function turnsWithoutProgressLocal(state: GameState): number {
  const mem = state.circling;
  if (!mem) return 0;
  return Math.max(0, (state.turn ?? 0) - mem.lastProgressTurn);
}

const STALE_TURNS = 10;
const BRING_WINDOW = 5;
const MAX_FIGHT_CHIPS = 4;

export type DirectorInput = {
  playerInput?: string;
  /** Recent chip labels picked (newest last). */
  recentChips?: string[];
  /** Chip that was no-op twice — replace with next plan chip. */
  noOpChip?: string | null;
};

/** OPT-5 / T10DIR: true when progress stall, pressure deadline, or circling.stale ≥ STALL_N. */
export function stallPressureActive(state: GameState): boolean {
  if (state.engineMode === 'pyoa') return false;
  if (turnsWithoutProgressLocal(state) >= STALL_N) return true;
  // Same predicate as openThreads.stallPressureActive (shared STALL_N).
  const turn = state.turn ?? 0;
  const tsp = state.progressGovernor?.turnsSinceProgress ?? 0;
  if (tsp >= STALL_N) return true;
  const lastProgress = state.circling?.lastProgressTurn;
  if (typeof lastProgress === 'number' && turn - lastProgress >= STALL_N) return true;
  const deadline = state.arcDirector?.pressureClock?.deadlineTurn;
  if (deadline != null && turn >= deadline) return true;
  const stale = state.circling?.stale;
  if (!stale) return false;
  const places = Object.keys(stale);
  for (let i = 0; i < places.length; i++) {
    const fams = stale[places[i]!]!;
    const keys = Object.keys(fams);
    for (let j = 0; j < keys.length; j++) {
      if (turn - (fams[keys[j]!] ?? turn) >= STALL_N) return true;
    }
  }
  return false;
}

function placeIdOf(state: GameState): string {
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  if (!here) return '';
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), here);
  if (hub?.id) return hub.id;
  const places = state.places ?? [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    const n = (p.name ?? '').trim().toLowerCase();
    if (n === here.toLowerCase() || (p.id ?? '').toLowerCase() === here.toLowerCase()) {
      return p.id || p.name;
    }
  }
  return here;
}

function placeNameOf(state: GameState): string {
  return (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
}

/** Genre tags from mode + bible id (no hard-coded bible prose). */
function genreTags(state: GameState): string[] {
  const mode = state.engineMode;
  const bible = (state.campaignBibleId ?? '').toLowerCase();
  const tags: string[] = [];
  if (mode === 'dnd') tags.push('tabletop', 'fantasy');
  else if (mode === 'rpg') tags.push('story-rpg', 'heist');
  else if (mode === 'litrpg') tags.push('litrpg', 'system');
  if (bible.includes('keep') || bible.includes('cursed')) tags.push('keep', 'undead');
  if (bible.includes('salt') || bible.includes('road')) tags.push('road', 'caravan');
  if (bible.includes('summon') || bible.includes('pact')) tags.push('summon', 'pact');
  if (bible.includes('coast') || bible.includes('shatter')) tags.push('coast');
  return tags;
}

function lastDevelopment(state: GameState): { kind: string; target: string } | null {
  const d = state.directorStall?.last;
  if (!d) return null;
  return { kind: d.kind, target: d.target ?? '' };
}

function recordDevelopment(
  state: GameState,
  kind: DirectorDevelopment['kind'],
  target: string,
  fact: string,
): GameState {
  const turn = state.turn ?? 0;
  const entry = { kind, target, fact, turn };
  const hist = [...(state.directorStall?.history ?? []), entry].slice(-16);
  return {
    ...state,
    directorStall: {
      last: { kind, target },
      history: hist,
      jobAsks: state.directorStall?.jobAsks ?? {},
    },
  };
}

/**
 * T10DIR2 — stall / director facts enter the same Must-narrate ledger path as other
 * engine acts (writerInfoLayer / factSheet / cue convert). No stock prose: clause is
 * built only from engine nouns (NPC name, place, quest objective).
 */
function asMustNarrateFact(clause: string): string {
  const raw = (clause ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return raw;
  if (/^Must narrate:/i.test(raw)) return raw;
  // Strip prior soft labels so the writer cue is one Must-narrate clause.
  const plain = raw
    .replace(/^Stall pressure:\s*(?:open thread brought forward\s*[—\-]\s*)?/i, '')
    .replace(/^(?:Nudge|NPC act|Threat(?:\s+at[^:]*)?|Quest offer(?:\s+from[^:]*)?):\s*/i, '')
    .trim();
  return `Must narrate: ${plain || raw}`;
}

function appendDirectorFact(state: GameState, eventId: string, text: string): GameState {
  const turn = state.turn ?? 0;
  const body = asMustNarrateFact(text);
  // Deterministic timeline stamp (no Date.now) — turn-stable for replay.
  const fact: TimelineFact = {
    id: eventId,
    turn,
    kind: 'world',
    text: body,
    at: turn * 1000,
  };
  return {
    ...state,
    timeline: [...(state.timeline ?? []), fact].slice(-80),
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, stallWorldFact: body }
      : {
          crowd: 'unknown',
          noise: 'unknown',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: turn,
          stallWorldFact: body,
        },
  };
}

/**
 * T10RC3 — live or parked engine foe the spine can resolve (Face the threat).
 * Director stall must open one of these before offering that chip.
 */
function engineThreatHere(state: GameState): ActiveEncounter | null {
  return (
    state.activeEncounter
    ?? state.sceneFacts?.pendingEncounter
    ?? parkedThreatHere(state)?.encounter
    ?? null
  );
}

/**
 * Park a catalog foe through the existing encounter owner so "Face the threat" can resolve.
 * No novel foe name: catalog seed only. Does not count as player progress by itself.
 */
function parkStallThreat(state: GameState): { state: GameState; foe: ActiveEncounter | null } {
  const existing = engineThreatHere(state);
  if (existing) return { state, foe: existing };
  if (state.engineMode === 'pyoa') return { state, foe: null };
  const seed = selectCatalogEncounter(state);
  const name = (seed?.foeName ?? '').trim();
  if (!name) return { state, foe: null };
  const lvl = state.character?.level ?? 1;
  const hp = 12 + lvl * 4;
  const foe = initEncounterTerminal(
    {
      name,
      level: lvl,
      hp,
      maxHp: hp,
      armorClass: 11 + lvl,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: seed?.xpReward ?? 25 + lvl * 5,
      goldReward: seed?.goldReward ?? 5 + lvl * 2,
    },
    state,
    { forcedSpawnKey: name, source: seed?.id ?? 'director-stall' },
  );
  const parked = parkPendingEncounter(foe, state.turn ?? 0);
  const base = state.sceneFacts ?? {
    crowd: 'unknown' as const,
    noise: 'unknown' as const,
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn ?? 0,
  };
  let next: GameState = {
    ...state,
    sceneFacts: { ...base, pendingEncounter: parked },
  };
  next = markPendingSpawnPreface(next, parked.name);
  return { state: next, foe: parked };
}

function questFromThread(state: GameState, thread: OpenThread): Quest | null {
  const raw =
    thread.kind === 'quest' || thread.kind === 'lead'
      ? (thread.entityId ?? '').replace(/^quest:/, '')
      : thread.resolution && 'questId' in thread.resolution
        ? String((thread.resolution as { questId?: string }).questId ?? '')
        : '';
  const id = (raw || '').trim();
  if (!id) return null;
  return (state.quests ?? []).find((q) => q.id === id) ?? null;
}

function threadActorName(state: GameState, thread: OpenThread): string | null {
  if (thread.kind === 'npc-goal') {
    const id = (thread.entityId ?? '').replace(/^npc:/, '');
    const mem = (state.npcMemories ?? []).find(
      (m) => (m.npcId || `npc:${m.npcName}`) === thread.entityId || m.npcName === id,
    );
    return mem?.npcName ?? (id || null);
  }
  const q = questFromThread(state, thread);
  if (q?.giver?.trim()) return q.giver.trim();
  // Label "Name: topic" / "Name's charge"
  const label = (thread.label ?? '').trim();
  const m = label.match(/^([^:—\-]+?)(?:'s|\s*[:—\-])/);
  if (m?.[1] && /[A-Za-z]/.test(m[1]) && m[1].trim().split(/\s+/).length <= 4) {
    return m[1].trim();
  }
  return null;
}

function threadGoalText(state: GameState, thread: OpenThread): string {
  const q = questFromThread(state, thread);
  if (q) {
    const obj = (q.objectives ?? []).find((o) => !o.completed && !o.optional);
    const desc = (obj?.description ?? q.description ?? q.name ?? '').replace(/\s+/g, ' ').trim();
    if (desc) return desc;
  }
  if (thread.kind === 'npc-goal') {
    const name = threadActorName(state, thread);
    const mem = (state.npcMemories ?? []).find((m) => name && mentionsName(m.npcName, name));
    const want = mem ? npcChipWant(mem) : '';
    if (want) return want;
  }
  return (thread.label ?? 'the open thread').replace(/\s+/g, ' ').trim();
}

function threadPlaceLabel(state: GameState, thread: OpenThread): string | null {
  const raw = (thread.placeId ?? questFromThread(state, thread)?.location ?? questFromThread(state, thread)?.leadsTo ?? '')
    .toString()
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return null;
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), raw);
  return hub?.name ?? raw;
}

function personIsHere(state: GameState, name: string): boolean {
  const here = peopleHere(state);
  if (here.some((n) => mentionsName(n, name) || mentionsName(name, n))) return true;
  return (state.sceneFacts?.present ?? []).some(
    (n) => mentionsName(n, name) || mentionsName(name, n),
  );
}

/**
 * T10DIR2 — pick development kind from genre tags + thread payload; honor developmentAllowed.
 */
function stallTargetForKind(
  state: GameState,
  thread: OpenThread | null,
  kind: DirectorDevelopment['kind'],
): string {
  if (kind === 'npc-acting') {
    const name =
      (thread ? threadActorName(state, thread) : null)
      || peopleHere(state)[0]
      || 'npc';
    const mem = (state.npcMemories ?? []).find((m) => mentionsName(m.npcName, name));
    return mem?.npcId || `npc:${name}`;
  }
  if (kind === 'lead') {
    return (
      (thread ? threadPlaceLabel(state, thread) : null)
      || thread?.placeId
      || thread?.id
      || pickLeadFact(state)?.placeId
      || 'lead'
    );
  }
  return placeIdOf(state) || placeNameOf(state) || 'here';
}

function pickStallKind(
  state: GameState,
  thread: OpenThread | null,
): DirectorDevelopment['kind'] {
  const tags = genreTags(state);
  const preference: DirectorDevelopment['kind'][] =
    tags.includes('tabletop') || tags.includes('fantasy') || state.engineMode === 'dnd'
      ? ['npc-acting', 'threat', 'lead']
      : tags.includes('litrpg') || state.engineMode === 'litrpg'
        ? ['lead', 'threat', 'npc-acting']
        : ['lead', 'npc-acting', 'threat'];
  for (let i = 0; i < preference.length; i++) {
    const kind = preference[i]!;
    const target = stallTargetForKind(state, thread, kind);
    if (developmentAllowed(state, kind, target)) return kind;
  }
  // All blocked (same kind+target as last): rotate to a different kind than last.
  const last = lastDevelopment(state);
  const rotated = preference.find((k) => !last || k !== last.kind) ?? preference[1] ?? preference[0]!;
  return rotated;
}

/**
 * T10DIR2 — COMMITTED stall development (quest / seat / place), not a label-only fact.
 * Owners: presentAuthority.seat, quest row mutate (reveal/active), director facts.
 */
function commitStallDevelopment(
  state: GameState,
  thread: OpenThread | null,
  playerInput: string,
): {
  state: GameState;
  development?: DirectorDevelopment;
  need: DirectorNeed;
  forwardIds: string[];
  stallKind?: SceneThreadPlan['stallKind'];
  stallEventId?: string;
} {
  const turn = state.turn ?? 0;
  let working = state;
  const forwardIds: string[] = thread ? [thread.id] : [];
  const kind = pickStallKind(working, thread);
  const actor = thread ? threadActorName(working, thread) : null;
  const goal = thread ? threadGoalText(working, thread) : 'the scene moves on';
  const placeLabel = thread ? threadPlaceLabel(working, thread) : pickLeadFact(working)?.placeId ?? null;
  const hereName = placeNameOf(working);
  const hereId = placeIdOf(working);

  if (kind === 'npc-acting') {
    const name =
      actor
      ?? peopleHere(working)[0]
      ?? presentNpcRecords(working)[0]?.npcName
      ?? null;
    if (name) {
      const wasHere = personIsHere(working, name);
      if (!wasHere) working = seat(working, name);
      const where = placeLabel && placeLabel.toLowerCase() !== hereName.toLowerCase()
        ? placeLabel
        : (pickLeadFact(working)?.placeId ?? placeLabel);
      const destHub = where ? matchHub(hubsForBibleId(working.campaignBibleId), where) : null;
      const destName = destHub?.name ?? where ?? null;
      const arriveBit = wasHere ? 'presses' : 'arrives and presses';
      const whereBit = destName && destName.toLowerCase() !== hereName.toLowerCase()
        ? ` — go to ${destName}`
        : '';
      const fact =
        `${name} ${arriveBit} their agenda: ${goal}${whereBit}.`;
      const stallEventId = `stall-npc-${turn}-${name.replace(/\s+/g, '-').toLowerCase()}`;
      // T10RC3 — do not appendNpcAgendaFact (false social progress). Seat + Must-narrate only.
      working = appendDirectorFact(working, stallEventId, fact);
      if (hereName && !isJourneyUnderway(working) && !working.activeEncounter) {
        working = stallDepartPresentNpc(working, turn, playerInput);
      }
      const npcId =
        (working.npcMemories ?? []).find((m) => mentionsName(m.npcName, name))?.npcId
        || `npc:${name}`;
      working = recordDevelopment(working, 'npc-acting', npcId, fact);
      const development: DirectorDevelopment = {
        kind: 'npc-acting',
        fact: asMustNarrateFact(fact),
        npcId,
        placeId: destName ?? undefined,
        questId: thread ? questFromThread(state, thread)?.id : undefined,
      };
      return {
        state: working,
        development,
        need: 'npc-act',
        forwardIds,
        stallKind: thread ? 'thread' : 'agenda',
        stallEventId,
      };
    }
  }

  if (kind === 'lead') {
    const beforeLead = working;
    const destRaw = placeLabel || pickLeadFact(working)?.placeId || null;
    const destHub = destRaw ? matchHub(hubsForBibleId(working.campaignBibleId), destRaw) : null;
    // Prefer hub display name over raw id (never Travel toward sp-hub-…).
    const destName = destHub?.name ?? destRaw;
    // Never a lead chip to HERE — pick another hub when thread place is current.
    let travelName = destName;
    let travelHub = destHub;
    if (
      travelName
      && (travelName.toLowerCase() === hereName.toLowerCase()
        || (destHub && hereId && destHub.id === hereId))
    ) {
      const alt = pickLeadFact(working);
      travelHub = alt?.placeId ? matchHub(hubsForBibleId(working.campaignBibleId), alt.placeId) : null;
      travelName = travelHub?.name ?? alt?.placeId ?? null;
    }
    // Quest commit: reveal/activate so questSignature changes when possible.
    const q = thread ? questFromThread(working, thread) : null;
    if (q) {
      working = {
        ...working,
        quests: (working.quests ?? []).map((row) => {
          if (row.id !== q.id) return row;
          const next = { ...row };
          if (next.revealed === false) next.revealed = true;
          if (next.status === 'hidden') next.status = 'active';
          if (travelName && !next.location) next.location = travelName;
          if (next.revealed !== true) next.revealed = true;
          return next;
        }),
      };
    }
    // Unlock destination on the place ledger (discoveredLocations).
    if (travelName) {
      const disc = new Set(working.discoveredLocations ?? []);
      const placeKey = travelHub?.id ?? travelName;
      if (!disc.has(placeKey) && !disc.has(travelName)) {
        working = {
          ...working,
          discoveredLocations: [...(working.discoveredLocations ?? []), placeKey],
        };
      }
      const places = [...(working.places ?? [])];
      if (!places.some((p) => (p.name ?? '').toLowerCase() === travelName.toLowerCase() || p.id === placeKey)) {
        places.push({ id: placeKey, name: travelName, mapCanonical: true });
        working = { ...working, places };
      }
    }
    // Move social via an engine-known person only (giver / present / memory) — never invent a courier.
    const messenger =
      actor
      || peopleHere(working)[0]
      || presentNpcRecords(working)[0]?.npcName
      || null;
    if (messenger && !personIsHere(working, messenger)) {
      working = seat(working, messenger);
    }
    const whoBit = messenger ? `${messenger} points you to` : 'A lead opens toward';
    const fact = travelName
      ? `${whoBit} ${travelName} for: ${goal}.`
      : `${whoBit} the next step: ${goal}.`;
    const stallEventId = `stall-lead-${turn}-${(travelName || thread?.id || 'lead').replace(/\s+/g, '-').toLowerCase()}`;
    working = appendDirectorFact(working, stallEventId, fact);
    if (hereName && !isJourneyUnderway(working) && !working.activeEncounter) {
      working = stallDepartPresentNpc(working, turn, playerInput);
    }
    // If this lead could not change quest/place/social, fall through to threat (never a no-op label).
    const leadMoved =
      JSON.stringify(beforeLead.quests ?? []) !== JSON.stringify(working.quests ?? [])
      || JSON.stringify(beforeLead.discoveredLocations ?? []) !== JSON.stringify(working.discoveredLocations ?? [])
      || JSON.stringify(beforeLead.places ?? []) !== JSON.stringify(working.places ?? [])
      || JSON.stringify(beforeLead.npcMemories ?? []) !== JSON.stringify(working.npcMemories ?? [])
      || JSON.stringify(beforeLead.sceneFacts?.present ?? []) !== JSON.stringify(working.sceneFacts?.present ?? []);
    if (!leadMoved) {
      // Fall through to threat commit below with working restored to pre-lead + keep forwardIds.
      working = beforeLead;
    } else {
      const target = travelName || thread?.id || 'lead';
      working = recordDevelopment(working, 'lead', target, fact);
      const development: DirectorDevelopment = {
        kind: 'lead',
        fact: asMustNarrateFact(fact),
        placeId: travelName ?? undefined,
        npcId: messenger ? `npc:${messenger}` : undefined,
        questId: q?.id,
      };
      return {
        state: working,
        development,
        need: travelName ? 'travel' : 'lead',
        forwardIds,
        stallKind: thread ? 'thread' : 'situation',
        stallEventId,
      };
    }
  }

  // threat — park a real engine foe + seat a visible person; never empty the room this turn.
  {
    const threatWhere = hereName || 'this place';
    const detail = thread
      ? `${goal} will not wait at ${threatWhere}`
      : pickThreatFact(working, threatWhere).replace(/^Threat(?:\s+at[^:]*)?:\s*/i, '');
    working = applyPlaceEngineEvent(working, {
      placeId: threatWhere,
      kind: 'new-threat',
      detail,
    });
    const parked = parkStallThreat(working);
    working = parked.state;
    const who =
      actor
      || peopleHere(working)[0]
      || presentNpcRecords(working)[0]?.npcName
      || (working.npcMemories ?? []).find((m) => (m.npcName ?? '').trim())?.npcName
      || null;
    if (who && !personIsHere(working, who)) working = seat(working, who);
    // Target includes turn so developmentAllowed cannot soft-lock on the same HERE forever
    // when lead falls through to threat repeatedly (rpg dry-run Camp stall).
    const target = `${hereId || hereName || 'here'}:t${turn}`;
    const foeBit = parked.foe?.name ? ` — ${parked.foe.name} closes in` : '';
    const fact = who
      ? `${who} warns that ${detail}${foeBit}.`
      : `Danger closes at ${threatWhere}: ${detail}${foeBit}.`;
    const stallEventId = `stall-threat-${turn}`;
    working = appendDirectorFact(working, stallEventId, fact);
    // T10RC3 — never stallDepartPresentNpc on threat inject (empty Waystation at T290–T300).
    working = recordDevelopment(working, 'threat', target, fact);
    // No engine foe → do not claim need=threat (Face chip would be a dead Must-narrate).
    const need: DirectorNeed = parked.foe ? 'threat' : who ? 'npc-act' : 'threat';
    const development: DirectorDevelopment = {
      kind: parked.foe ? 'threat' : who ? 'npc-acting' : 'threat',
      fact: asMustNarrateFact(fact),
      placeId: hereId || hereName || undefined,
      npcId: who ? `npc:${who}` : undefined,
      questId: thread ? questFromThread(state, thread)?.id : undefined,
    };
    return {
      state: working,
      development,
      need,
      forwardIds,
      stallKind: thread ? 'thread' : 'situation',
      stallEventId,
    };
  }
}

function addressedPresentName(state: GameState, playerInput: string): string | null {
  const act = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (!act) return null;
  const present = (state.sceneFacts?.present ?? []).filter((n) => n && !isCrowdFillerToken(n));
  if (!present.length) return null;
  const chip = chipAddressee(act);
  if (chip?.who) {
    const hit = present.find(
      (n) => mentionsName(n, chip.who) || mentionsName(chip.who, n) || n.toLowerCase() === chip.who.toLowerCase(),
    );
    if (hit) return hit;
  }
  const fuzzy = fuzzyTypedName(act, present);
  if (fuzzy) return fuzzy;
  const low = act.toLowerCase();
  for (const n of present) {
    if (mentionsName(low, n)) return n;
  }
  return null;
}

function stallDepartPresentNpc(state: GameState, turn: number, playerInput = ''): GameState {
  const present = (state.sceneFacts?.present ?? []).filter((n) => n && !isCrowdFillerToken(n));
  // T10RC3 — never leave the room empty on a stall depart (threat inject used to clear the last face).
  if (present.length <= 1) return state;
  const keep = addressedPresentName(state, playerInput);
  const candidates = keep
    ? present.filter(
        (n) =>
          n.trim().toLowerCase() !== keep.trim().toLowerCase()
          && !mentionsName(n, keep)
          && !mentionsName(keep, n),
      )
    : present.slice(0, -1); // leave the last face when no addressee lock
  if (!candidates.length) return state;
  const name = candidates[candidates.length - 1]!;
  // T10RC3 — exit only; do not append "Left under stall…" into npc facts (false social progress).
  void turn;
  return exitNpc(state, name, 'stall-pressure');
}

function pickThreatFact(state: GameState, hereName: string): string {
  const tags = genreTags(state);
  if (tags.includes('undead') || tags.includes('keep')) {
    return `Threat at ${hereName}: something stirs beyond the next door — the keep will not wait.`;
  }
  if (tags.includes('road') || tags.includes('caravan')) {
    return `Threat on the road at ${hereName}: riders or a rival crew closes distance.`;
  }
  if (tags.includes('litrpg') || tags.includes('system')) {
    return `Threat at ${hereName}: a System ping marks hostile contact nearby.`;
  }
  return `Threat at ${hereName}: a patrol or visitor interrupts the stall — the scene moves on.`;
}

/**
 * Exhausted-source lead: same engine-fact wording as the hub nudge
 * (`Nudge: <speaker> mentions <place>`), never a stock "word points you toward" line.
 */
function pickLeadFact(state: GameState): { fact: string; placeId?: string; npcId?: string } | null {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hereId = placeIdOf(state);
  const hereName = placeNameOf(state).toLowerCase();
  const visited = new Set(
    (state.places ?? []).filter((p) => p.lastVisitedTurn != null).map((p) => (p.name ?? '').toLowerCase()),
  );
  const speaker =
    presentNpcRecords(state)[0]?.npcName
    ?? peopleHere(state)[0]
    ?? null;
  for (let i = 0; i < hubs.length; i++) {
    const h = hubs[i]!;
    if (h.id === hereId || h.name.toLowerCase() === hereName) continue;
    if (visited.has(h.name.toLowerCase())) continue;
    if (speaker) {
      const sight = placeFirstSight(state, h.name);
      let sightClean = sight;
      while (sightClean.endsWith('.') || sightClean.endsWith('!') || sightClean.endsWith('?')) {
        sightClean = sightClean.slice(0, -1);
      }
      return {
        fact: `Nudge: ${speaker} mentions ${h.name}${sightClean ? `: ${sightClean}` : ''}.`,
        // Prefer display name so Travel chips never say sp-hub-… / ck-hub-….
        placeId: h.name || h.id,
      };
    }
    // No person here: same engine-fact wording as the old quest/hub soft nudge (not "word points you toward").
    return {
      fact: `Nudge: word reaches you about ${h.name}.`,
      placeId: h.name || h.id,
    };
  }
  const present = presentNpcRecords(state).filter(
    (m) => m.present === true || peopleHere(state).some((n) => mentionsName(n, m.npcName)),
  );
  for (let i = 0; i < present.length; i++) {
    const m = present[i]!;
    const want = npcChipWant(m);
    if (!want) continue;
    return {
      fact: `Nudge: ${m.npcName} mentions ${want}.`,
      npcId: m.npcId || `npc:${m.npcName}`,
    };
  }
  const quests = (state.quests ?? []).filter((q) => q.revealed && q.status === 'active');
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    const obj = (q.objectives ?? []).find((o) => !o.completed && !o.optional);
    if (!obj) continue;
    let desc = obj.description;
    while (desc.endsWith('.') || desc.endsWith('!') || desc.endsWith('?')) desc = desc.slice(0, -1);
    return {
      fact: `Nudge: word reaches you about ${q.name}: ${desc}.`,
      placeId: q.location ?? q.leadsTo ?? undefined,
    };
  }
  return null;
}

function pickNpcAct(state: GameState): { fact: string; npcId: string; name: string } | null {
  const here = peopleHere(state);
  const mems = state.npcMemories ?? [];
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]!;
    // Same gate as old OPT-5 agenda path: a Doran motivation, not bare need/offer alone
    // (need-only must fall through to hub stallDepart so a second present person can leave).
    if (!m.goal?.motivation) continue;
    if (!here.some((n) => mentionsName(n, m.npcName) || mentionsName(m.npcName, n))) continue;
    if (m.present === false) continue;
    const want = npcChipWant(m) || m.need || m.offer || m.goal?.target || 'their next move';
    const npcId = m.npcId || `npc:${m.npcName}`;
    return {
      npcId,
      name: m.npcName,
      fact: `NPC act: ${m.npcName} presses their agenda — ${want} — and waits for your answer.`,
    };
  }
  return null;
}

function developmentAllowed(state: GameState, kind: DirectorDevelopment['kind'], target: string): boolean {
  const last = lastDevelopment(state);
  if (!last) return true;
  // No repeating the same kind+target twice in a row.
  return !(last.kind === kind && last.target === target);
}

/**
 * Build a stall world development. T10DIR2/T10RC3: COMMITTED engine change
 * (seat / quest / discovered place / parked threat). Director self-writes are
 * not player progress; the player resolving Face/Answer/Travel is.
 */
function injectStallDevelopment(
  state: GameState,
  playerInput: string,
  thread: OpenThread | null = null,
): { state: GameState; development?: DirectorDevelopment; need: DirectorNeed; forwardIds: string[]; stallKind?: SceneThreadPlan['stallKind']; stallEventId?: string } {
  const turn = state.turn ?? 0;
  let working = state;

  const roadEnc = working.journey?.encounter;
  const roadOpen = !!roadEnc && !roadMeetingOver(roadEnc);
  if (
    isJourneyUnderway(working)
    && !working.activeEncounter
    && !working.sceneFacts?.pendingEncounter
    && !roadOpen
  ) {
    // Advance the road, then commit a real development so Camp↔Waystation ping-pong
    // cannot burn the LOOP STOP window (leg advance alone is often not movedOn).
    const advanced = commitTravel(working, 'Walk on');
    if (advanced.handled) working = advanced.state;
    const committed = commitStallDevelopment(working, thread, playerInput);
    if (committed.development) {
      return {
        ...committed,
        forwardIds: [`stall-road:${turn}`, ...committed.forwardIds],
        stallKind: committed.stallKind ?? 'situation',
      };
    }
  }

  // Old OPT-5 agenda tick first when no open thread to bring forward.
  if (!thread) {
    const prevClock = working.arcDirector?.pressureClock;
    const nextClock = tickPressureClock(prevClock, false, turn);
    working = applyPressureAgendaAdvance(
      working,
      prevClock,
      { ...nextClock, deadlineTurn: turn },
      false,
    );
    const agendaFired = working.arcDirector?.pressureClock?.lastAgendaAdvanceTurn === turn;
    const npcAct = agendaFired ? pickNpcAct(working) : null;
    if (npcAct && developmentAllowed(working, 'npc-acting', npcAct.npcId)) {
      // Seat + Must-narrate; do not write npc agenda facts (T10RC3 — not player social progress).
      let s = working;
      if (!personIsHere(s, npcAct.name)) s = seat(s, npcAct.name);
      const stallEventId = `stall-npc-${turn}-${npcAct.npcId}`;
      s = appendDirectorFact(s, stallEventId, npcAct.fact);
      s = recordDevelopment(s, 'npc-acting', npcAct.npcId, npcAct.fact);
      if (placeNameOf(s) && !isJourneyUnderway(s) && !s.activeEncounter) {
        s = stallDepartPresentNpc(s, turn, playerInput);
      }
      return {
        state: s,
        development: { kind: 'npc-acting', fact: asMustNarrateFact(npcAct.fact), npcId: npcAct.npcId },
        need: 'npc-act',
        forwardIds: [`agenda:${npcAct.npcId}`],
        stallKind: 'agenda',
        stallEventId,
      };
    }

    const floor = ensureQuestFloor(working);
    working = floor.state;
    if (floor.quest) {
      // ensureQuestFloor already mutated quests — fact must name the real quest.
      const stallEventId = `stall-situation-${turn}-${floor.quest.id}`;
      const fact = `New situation opens: ${floor.quest.name}.`;
      working = appendDirectorFact(working, stallEventId, fact);
      return {
        state: working,
        development: {
          kind: 'lead',
          fact: asMustNarrateFact(fact),
          questId: floor.quest.id,
          placeId: floor.quest.location ?? floor.quest.leadsTo,
        },
        need: 'quest-offer',
        forwardIds: [`situation:${floor.quest.id}`],
        stallKind: 'situation',
        stallEventId,
      };
    }
  }

  return commitStallDevelopment(working, thread, playerInput);
}

function pickForwardThread(state: GameState, threads: OpenThread[]): OpenThread | null {
  const turn = state.turn ?? 0;
  const here = placeNameOf(state).toLowerCase();
  let best: OpenThread | null = null;
  let bestScore = -1;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (t.kind === 'npc-goal' && !npcGoalPersonHere(state, t.entityId || '', t.label.split(':')[0])) {
      continue;
    }
    const stale = Math.max(0, turn - (t.lastSeenTurn ?? 0));
    let prox = 0;
    if (here && t.placeId) {
      const place = t.placeId.trim().toLowerCase();
      if (place === here) prox = 50;
      else if (here.includes(place) || place.includes(here)) prox = 25;
    }
    const score = stale * 10 + prox;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (t.kind === 'npc-goal' && !npcGoalPersonHere(state, t.entityId || '', t.label.split(':')[0])) {
      continue;
    }
    const untouched = turn - (t.lastSeenTurn ?? 0);
    if (untouched >= STALE_TURNS) {
      const deadline = (t.lastSeenTurn ?? 0) + STALE_TURNS + BRING_WINDOW;
      if (turn <= deadline) return t;
    }
  }
  return best;
}

/** Travel chip label → destination name (includes Turn back toward — road ping-pong). */
export function travelDestFromChip(chip: string): string | null {
  const m = chip.match(
    /^(?:travel\s+(?:toward|to)|go\s+to|head\s+(?:to|toward)|walk\s+to|return\s+to|go\s+back\s+to|turn\s+back\s+toward)\s+(.+)$/i,
  );
  return m ? m[1]!.replace(/[.!?]+$/, '').trim() : null;
}

/**
 * T10DIR2 — record a no-effect engine receipt against the chip that was picked.
 * Keyed on receipts (found nothing / no state change / failed check with no effect), never chip wording.
 */
export function noteDirectorNoOpFromReceipts(
  state: GameState,
  chip: string,
  receipts: string[],
  progressed: boolean,
): GameState {
  const label = (chip ?? '').replace(/\s+/g, ' ').trim();
  if (!label || state.engineMode === 'pyoa') return state;
  const key = label.toLowerCase();
  const stall = state.directorStall ?? { history: [] };
  const counts = { ...(stall.noOpCounts ?? {}) };
  if (progressed) {
    if (!counts[key] && !stall.noOpChip) return state;
    const next = { ...counts };
    delete next[key];
    const noOpChip = stall.noOpChip && stall.noOpChip.toLowerCase() === key ? null : stall.noOpChip;
    return {
      ...state,
      directorStall: { ...stall, noOpCounts: next, noOpChip },
    };
  }
  const blob = (receipts ?? []).join('\n');
  // Engine-result shapes only (search empty, item no-effect, failed check with no ledger delta).
  const noEffect =
    /\bfound nothing(?:\s+new)?\b/i.test(blob)
    || /\bnothing new\b/i.test(blob)
    || /\bno effect\b/i.test(blob)
    || /\bnothing answered\b/i.test(blob)
    || /\bwater ran off\b/i.test(blob)
    || /\bCheck failure\b/i.test(blob)
    || /\bFAILURE\s*\(/i.test(blob);
  if (!noEffect) return state;
  const n = (counts[key] ?? 0) + 1;
  counts[key] = n;
  return {
    ...state,
    directorStall: {
      ...stall,
      noOpCounts: counts,
      noOpChip: n >= 2 ? label : stall.noOpChip ?? null,
    },
  };
}

export function directorNoOpChip(state: GameState): string | null {
  return state.directorStall?.noOpChip ?? null;
}

/**
 * Never a travel chip to the current place (compare by place id, then name).
 * Never ping-pong between two places more than once without a new reason.
 */
export function filterDirectorTravelChips(
  state: GameState,
  chips: string[],
  recentChips: string[] = [],
): string[] {
  const hereId = placeIdOf(state).toLowerCase();
  const hereName = placeNameOf(state).toLowerCase();
  const hubs = hubsForBibleId(state.campaignBibleId);
  const out: string[] = [];
  const recentTravel: string[] = [];
  for (let i = recentChips.length - 1; i >= 0 && recentTravel.length < 4; i--) {
    const d = travelDestFromChip(recentChips[i]!);
    if (d) recentTravel.push(d.toLowerCase());
  }
  for (let i = 0; i < chips.length; i++) {
    const chip = chips[i]!;
    const dest = travelDestFromChip(chip);
    if (!dest) {
      out.push(chip);
      continue;
    }
    const destLow = dest.toLowerCase();
    const hub = matchHub(hubs, dest);
    const destId = (hub?.id ?? '').toLowerCase();
    // Current place by id or name.
    if ((hereId && (destId === hereId || destLow === hereId)) || (hereName && destLow === hereName)) {
      continue;
    }
    // Hub id match against current hub.
    const hereHub = matchHub(hubs, state.currentLocation);
    if (hereHub && hub && hereHub.id === hub.id) continue;

    // Ping-pong: recent travel was to HERE from dest (A→B), now offering B→A again.
    if (recentTravel.length >= 1) {
      const lastDest = recentTravel[0]!;
      const hereLow = hereName;
      // Last chip went to current place; offering travel back to the place before that.
      if (lastDest === hereLow && recentTravel.length >= 2) {
        const prevDest = recentTravel[1]!;
        if (destLow === prevDest) {
          const plan = state.directorPlan;
          const newReason = plan?.need === 'travel' && plan.development?.placeId
            && (plan.development.placeId.toLowerCase() === destId
              || plan.development.placeId.toLowerCase() === destLow
              || (hub && plan.development.placeId.toLowerCase() === hub.id.toLowerCase()));
          if (!newReason) continue;
        }
      }
    }
    out.push(chip);
  }
  return out;
}

/**
 * A chip picked twice with no progress is replaced by the next plan chip.
 */
export function replaceNoOpChip(
  plan: DirectorPlan | undefined,
  chips: string[],
  noOpChip: string | null | undefined,
): string[] {
  if (!noOpChip || !chips.length) return chips;
  const key = noOpChip.replace(/\s+/g, ' ').trim().toLowerCase();
  const filtered = chips.filter((c) => c.replace(/\s+/g, ' ').trim().toLowerCase() !== key);
  const next = plan?.chips?.find((c) => c.label.replace(/\s+/g, ' ').trim().toLowerCase() !== key);
  if (next && !filtered.some((c) => c === next.label)) {
    return [next.label, ...filtered].slice(0, 6);
  }
  return filtered.length ? filtered : chips;
}

const JOB_ASK =
  /\b(?:ask|ask(?:ing)?\s+(?:\w+\s+){0,4}about)\s+(?:the\s+)?(?:job|work|task|contract|gig|errand)\b|\bwhat\s+(?:job|work|task)\b|\b(?:need|got|have)\s+(?:a\s+)?(?:job|work|task)\b/i;

export function isJobAsk(playerInput: string): boolean {
  return JOB_ASK.test((playerInput ?? '').replace(/\s+/g, ' ').trim());
}

function jobAskNpc(state: GameState, playerInput: string): NpcMemory | null {
  const who = addressedPresentName(state, playerInput) ?? chipAddressee(playerInput)?.who;
  const here = peopleHere(state);
  const mems = state.npcMemories ?? [];
  if (who) {
    for (let i = 0; i < mems.length; i++) {
      const m = mems[i]!;
      if (mentionsName(m.npcName, who) || mentionsName(who, m.npcName)) {
        if (here.some((n) => mentionsName(n, m.npcName))) return m;
      }
    }
  }
  // Fallback: first present with offer / quest-patron role.
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]!;
    if (!here.some((n) => mentionsName(n, m.npcName))) continue;
    if (m.offer || m.roleHint === 'quest-patron' || m.goal?.motivation) return m;
  }
  return null;
}

/**
 * NPC job talk → real quest offer in ≤2 asks.
 * Rewards = existing coin/item/reputation fields only (XP LOCKED).
 */
export function resolveJobTalk(
  state: GameState,
  playerInput: string,
): { state: GameState; plan: Partial<DirectorPlan>; chips: DirectorChipSpec[] } {
  if (state.engineMode === 'pyoa' || !isJobAsk(playerInput)) {
    return { state, plan: {}, chips: [] };
  }
  const npc = jobAskNpc(state, playerInput);
  if (!npc) {
    return {
      state,
      plan: { need: 'lead' },
      chips: [],
    };
  }
  const npcId = npc.npcId || `npc:${npc.npcName}`;
  const asks = { ...(state.directorStall?.jobAsks ?? {}) };
  const prior = asks[npcId] ?? 0;
  const nextAsk = prior + 1;
  asks[npcId] = nextAsk;

  const hasOffer = !!(npc.offer || npc.goal?.target || npc.need);
  // Already has a live quest from this giver?
  const existing = (state.quests ?? []).find(
    (q) => q.status === 'active' && q.giver && mentionsName(q.giver, npc.npcName),
  );

  if (existing) {
    const fact = `Quest offer: ${npc.npcName} already has you on "${existing.name}".`;
    let s: GameState = {
      ...state,
      directorStall: { ...(state.directorStall ?? { history: [] }), jobAsks: asks },
    };
    s = appendDirectorFact(s, `job-existing-${state.turn}-${npcId}`, fact);
    return {
      state: s,
      plan: {
        need: 'quest-offer',
        development: { kind: 'lead', fact, npcId, questId: existing.id },
      },
      chips: [
        { label: `Ask ${npc.npcName} about the next step`, reason: 'open-quest-step' },
        { label: `Travel toward the job site`, reason: 'quest-place' },
      ],
    };
  }

  if (hasOffer && nextAsk <= 2) {
    const goal = npcChipWant(npc) || npc.offer || npc.need || 'the job they named';
    const place =
      (npc.goal?.target && !/^(?:inn|town|road|camp)$/i.test(npc.goal.target) ? npc.goal.target : null)
      ?? placeNameOf(state);
    const reward = npc.offer?.includes('pay') || npc.offer?.includes('coin')
      ? 'coin'
      : npc.offer || 'standing';
    const questId = `dir-job-${npcId}`.slice(0, 48);
    const fact =
      `Quest offer from ${npc.npcName}: goal=${goal}; place=${place}; reward=${reward}.`;
    let s: GameState = {
      ...state,
      directorStall: { ...(state.directorStall ?? { history: [] }), jobAsks: asks },
    };
    s = appendDirectorFact(s, `job-offer-${state.turn}-${npcId}`, fact);
    return {
      state: s,
      plan: {
        need: 'quest-offer',
        development: { kind: 'lead', fact, npcId, questId, placeId: place },
      },
      chips: [
        { label: `Accept the job from ${npc.npcName}`, reason: 'quest-accept' },
        { label: `Decline the job from ${npc.npcName}`, reason: 'quest-decline' },
      ],
    };
  }

  // No offer, or second empty ask: say so once, then a concrete lead — never the same empty twice.
  const emptyKey = `empty:${npcId}`;
  const alreadyEmpty = (state.directorStall?.history ?? []).some((h) => h.target === emptyKey);
  let s: GameState = {
    ...state,
    directorStall: { ...(state.directorStall ?? { history: [] }), jobAsks: asks },
  };
  if (!alreadyEmpty && nextAsk <= 2) {
    const fact = `${npc.npcName} has no job to offer right now.`;
    s = appendDirectorFact(s, `job-empty-${state.turn}-${npcId}`, fact);
    s = recordDevelopment(s, 'lead', emptyKey, fact);
    const lead = pickLeadFact(s);
    const leadFact = lead?.fact ?? `Lead: leave ${placeNameOf(s)} and press the open quest.`;
    if (lead) s = appendDirectorFact(s, `job-lead-${state.turn}`, leadFact);
    return {
      state: s,
      plan: {
        need: 'lead',
        development: { kind: 'lead', fact: leadFact, placeId: lead?.placeId, npcId: lead?.npcId },
      },
      chips: lead?.placeId
        ? [{ label: `Travel toward ${lead.placeId}`, reason: 'job-empty-lead' }]
        : [{ label: 'Ask someone else about work', reason: 'job-empty-lead' }],
    };
  }

  // Third+ ask: only the lead chip, no second empty fact.
  const lead = pickLeadFact(s);
  return {
    state: s,
    plan: { need: 'lead' },
    chips: lead?.placeId
      ? [{ label: `Travel toward ${lead.placeId}`, reason: 'job-repeat-lead' }]
      : [{ label: 'Look for another contact', reason: 'job-repeat-lead' }],
  };
}

/** Accept chip → quest row (no XP fields touched). */
export function acceptDirectorQuestOffer(state: GameState): GameState {
  const plan = state.directorPlan;
  if (plan?.need !== 'quest-offer' || !plan.development) return state;
  const d = plan.development;
  const questId = d.questId || `dir-job-${d.npcId || 'unknown'}`.slice(0, 48);
  if ((state.quests ?? []).some((q) => q.id === questId)) return state;
  const giver =
    (state.npcMemories ?? []).find((m) => (m.npcId || `npc:${m.npcName}`) === d.npcId)?.npcName
    ?? d.npcId?.replace(/^npc:/, '')
    ?? 'Contact';
  const goal = d.fact.replace(/^Quest offer from [^:]+:\s*goal=/i, '').split(';')[0]?.trim() || 'Do the job';
  const quest: Quest = {
    id: questId,
    name: `${giver}'s job`,
    description: goal,
    status: 'active',
    type: 'side',
    revealed: true,
    giver,
    location: d.placeId,
    objectives: [{ id: `${questId}-1`, description: goal, completed: false }],
  };
  return { ...state, quests: [...(state.quests ?? []), quest] };
}

function chipSpecsFromNeed(
  state: GameState,
  need: DirectorNeed,
  development: DirectorDevelopment | undefined,
  forward: OpenThread | null,
): DirectorChipSpec[] {
  const chips: DirectorChipSpec[] = [];
  if (need === 'quest-offer' && development?.npcId) {
    const name =
      (state.npcMemories ?? []).find((m) => (m.npcId || `npc:${m.npcName}`) === development.npcId)?.npcName
      ?? 'them';
    chips.push(
      { label: `Accept the job from ${name}`, reason: 'director-quest-accept' },
      { label: `Decline the job from ${name}`, reason: 'director-quest-decline' },
    );
  }
  if (need === 'travel' || (development?.kind === 'lead' && development.placeId)) {
    const dest = development?.placeId;
    if (dest) {
      const hub = matchHub(hubsForBibleId(state.campaignBibleId), dest);
      const label = hub?.name ?? dest;
      const hereHub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
      if (!hereHub || hereHub.id !== hub?.id) {
        chips.push({ label: `Travel toward ${label}`, reason: 'director-lead-travel' });
      } else {
        // Thread/lead is already HERE — offer a different hub so first-pad can leave the stall
        // (travel-to-here is illegal; injection alone is not progress).
        const alt = pickLeadFact(state);
        if (alt?.placeId) {
          const altHub = matchHub(hubsForBibleId(state.campaignBibleId), alt.placeId);
          const altLabel = altHub?.name ?? alt.placeId;
          if (!hereHub || hereHub.id !== altHub?.id) {
            chips.push({ label: `Travel toward ${altLabel}`, reason: 'director-here-thread-lead' });
          }
        }
      }
    }
  }
  if (need === 'npc-act' && development?.npcId) {
    const name =
      (state.npcMemories ?? []).find((m) => (m.npcId || `npc:${m.npcName}`) === development.npcId)?.npcName
      ?? 'them';
    chips.push({ label: `Answer ${name}`, reason: 'director-npc-act' });
  }
  // T10RC3 — Face the threat only when an engine foe is parked/live to resolve.
  // Also offer a leave lead so first-pad dry-run is not forced into a Face→death loop.
  if (need === 'threat' && engineThreatHere(state)) {
    const hereLow = (state.currentLocation ?? '').trim().toLowerCase();
    const alt = pickLeadFact(state);
    if (alt?.placeId) {
      const altHub = matchHub(hubsForBibleId(state.campaignBibleId), alt.placeId);
      const altLabel = altHub?.name ?? alt.placeId;
      if (altLabel && altLabel.trim().toLowerCase() !== hereLow) {
        chips.push({ label: `Travel toward ${altLabel}`, reason: 'director-threat-lead' });
      }
    }
    chips.push({ label: 'Face the threat', reason: 'director-threat' });
    chips.push({ label: 'Look for an exit', reason: 'director-threat-exit' });
  }
  if (forward) {
    chips.push({ label: `Follow up: ${forward.label}`.slice(0, 80), reason: 'director-thread' });
  }
  return chips;
}

/**
 * Sole progression planner. Writes directorPlan (+ sceneThreadPlan / stall records / nudge fields).
 */
export function planDirector(
  state: GameState,
  input: DirectorInput = {},
): { state: GameState; plan: DirectorPlan; receipts: string[]; notes: string[] } {
  if (state.engineMode === 'pyoa') {
    const plan: DirectorPlan = { need: 'none', chips: [], turn: state.turn ?? 0 };
    return {
      state: writeDirectorPlan(state, plan, { plannedTurn: plan.turn, forwardIds: [] }),
      plan,
      receipts: [],
      notes: [],
    };
  }

  const turn = state.turn ?? 0;
  const playerInput = input.playerInput ?? '';
  const notes: string[] = [];
  const receipts: string[] = [];
  let working = state;

  // Job talk resolves before stall (≤2 asks).
  let jobChips: DirectorChipSpec[] = [];
  if (isJobAsk(playerInput)) {
    const job = resolveJobTalk(working, playerInput);
    working = job.state;
    jobChips = job.chips;
    if (job.plan.need === 'quest-offer' || job.plan.need === 'lead') {
      const plan: DirectorPlan = {
        need: (job.plan.need as DirectorNeed) ?? 'quest-offer',
        development: job.plan.development,
        chips: jobChips,
        turn,
      };
      working = writeDirectorPlan(working, plan, {
        plannedTurn: turn,
        forwardIds: job.plan.development?.questId ? [`quest:${job.plan.development.questId}`] : [],
      });
      if (plan.development?.fact) receipts.push(plan.development.fact);
      return { state: working, plan, receipts, notes };
    }
  }

  const threads = collectOpenThreads(working);
  const stall = stallPressureActive(working);
  const existing = working.sceneThreadPlan;
  if (existing && existing.plannedTurn === turn && existing.forwardIds.length && !(stall && !existing.stallKind)) {
    const plan: DirectorPlan = working.directorPlan ?? { need: 'none', chips: jobChips, turn };
    return {
      state: { ...writeDirectorPlan(working, plan, existing), openThreads: threads },
      plan,
      receipts,
      notes,
    };
  }

  if (!threads.length && !stall) {
    const plan: DirectorPlan = { need: 'none', chips: jobChips, turn };
    working = writeDirectorPlan(working, plan, { plannedTurn: turn, forwardIds: [] });
    return { state: { ...working, openThreads: [] }, plan, receipts, notes };
  }

  const best = pickForwardThread(working, threads);
  let forwardIds: string[] = [];
  let stallKind: SceneThreadPlan['stallKind'];
  let stallEventId: string | undefined;
  let need: DirectorNeed = 'none';
  let development: DirectorDevelopment | undefined;

  // T10DIR2 — stall bring-forward COMMITS engine state (seat / quest / place), never a
  // label-only "open thread brought forward" fact. Stall depart stays inside commitStallDevelopment.
  if (stall && best) {
    const inj = injectStallDevelopment(working, playerInput, best);
    working = inj.state;
    forwardIds = inj.forwardIds.length ? inj.forwardIds : [best.id];
    stallKind = inj.stallKind ?? 'thread';
    stallEventId = inj.stallEventId ?? `stall-thread-${turn}-${best.id}`;
    need = inj.need;
    development = inj.development;
    if (development?.fact) receipts.push(development.fact);
  } else if (stall) {
    const inj = injectStallDevelopment(working, playerInput, null);
    working = inj.state;
    forwardIds = inj.forwardIds;
    stallKind = inj.stallKind;
    stallEventId = inj.stallEventId;
    need = inj.need;
    development = inj.development;
    if (development?.fact) receipts.push(development.fact);
  } else if (best) {
    forwardIds = [best.id];
  }

  // Pressure deadline engine event when a thread was already forward.
  if (stall && !stallEventId) {
    const deadline = working.arcDirector?.pressureClock?.deadlineTurn;
    if (deadline != null && turn >= deadline) {
      stallEventId = `stall-pressure-${turn}`;
      if (!stallKind && best) stallKind = 'thread';
      const fact = `Stall pressure: pressure clock deadline passed at T${deadline}.`;
      working = appendDirectorFact(working, stallEventId, fact);
      receipts.push(fact);
    }
  }

  const nextThreads: OpenThread[] = [];
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    let lastSeen = t.lastSeenTurn;
    for (let f = 0; f < forwardIds.length; f++) {
      if (forwardIds[f] === t.id) lastSeen = turn;
    }
    nextThreads.push({ ...t, lastSeenTurn: lastSeen });
  }

  const chips = [
    ...jobChips,
    ...chipSpecsFromNeed(working, need, development, best),
  ];
  const plan: DirectorPlan = { need, development, chips, turn };
  working = writeDirectorPlan(working, plan, {
    plannedTurn: turn,
    forwardIds,
    stallKind,
    stallEventId,
  });
  working = { ...working, openThreads: nextThreads };
  notes.push(`Director need=${need}; stall=${stall ? 1 : 0}; forward=${forwardIds.length}`);
  return { state: working, plan, receipts, notes };
}

/** Sole writer of directorPlan + sceneThreadPlan (single-writer ratchet). */
export function writeDirectorPlan(
  state: GameState,
  plan: DirectorPlan,
  scene: SceneThreadPlan,
): GameState {
  return {
    ...state,
    directorPlan: plan,
    sceneThreadPlan: scene,
  };
}

/**
 * Sole writer of circling nudge fields (anti-circling routes through director).
 * Soft engine-fact nudges match the old choiceRanking write (lastProgressTurn advances).
 * Stall developments pass countsAsProgress:false — injection alone is not progress.
 */
export function writeDirectorNudge(
  state: GameState,
  line: string,
  nudgeCursor: number,
  opts?: { countsAsProgress?: boolean },
): GameState {
  const mem = state.circling;
  if (!mem) return state;
  const turn = state.turn ?? 0;
  const fired = [...(mem.firedNudges ?? []), line].slice(-64);
  const countsAsProgress = opts?.countsAsProgress !== false;
  return {
    ...state,
    circling: {
      ...mem,
      nudgedTurn: turn,
      lastNudge: line,
      nudgeCursor,
      firedNudges: fired,
      ...(countsAsProgress ? { lastProgressTurn: turn } : {}),
    },
  };
}

/**
 * Anti-circling entry (moved byte-for-byte from choiceRanking.nudgeIfStuck).
 * Old sources first (dungeon → unmet person → open quest step → hub mention by a person here
 * with placeFirstSight / firedNudges / nudgeCursor rotation). Lead / director development
 * ONLY when every old source is exhausted — never replaces them. No "Nudge skipped … OPT-5" dead end.
 */
export function directorNudgeIfStuck(state: GameState): {
  state: GameState;
  receipts: string[];
  notes: string[];
} {
  const mem = state.circling;
  if (!mem || state.activeEncounter) return { state, receipts: [], notes: [] };
  // Nobody gets word to a PC lying unconscious at 0 HP.
  if (state.deathSaves || (state.character?.hp ?? 1) <= 0) return { state, receipts: [], notes: [] };
  if (state.engineMode === 'pyoa') return { state, receipts: [], notes: [] };

  const turn = state.turn ?? 0;
  if (turnsWithoutProgressLocal(state) < STALL_N) return { state, receipts: [], notes: [] };
  if (mem.nudgedTurn != null && turn - mem.nudgedTurn < STALL_N) {
    return { state, receipts: [], notes: [] };
  }

  const notes: string[] = [];
  const fired = new Set([...(mem.firedNudges ?? []), ...(mem.lastNudge ? [mem.lastNudge] : [])]);
  // 28l — sources rotate (room → person → quest → hub). Hub = person-present mention + first-sight.
  const sourceCount = 4;
  const start = (mem.nudgeCursor ?? 0) % sourceCount;
  let line = '';
  let used = start;
  for (let i = 0; i < sourceCount && !line; i++) {
    const idx = (start + i) % sourceCount;
    let candidate = '';
    if (idx === 0) {
      const d = state.activeDungeon;
      if (d) {
        let node: (typeof d.nodes)[number] | undefined;
        for (let n = 0; n < d.nodes.length; n++) {
          if (d.nodes[n]!.id === d.currentNodeId) {
            node = d.nodes[n];
            break;
          }
        }
        const conns = node?.connections ?? [];
        for (let c = 0; c < conns.length; c++) {
          let nextNode: (typeof d.nodes)[number] | undefined;
          for (let n = 0; n < d.nodes.length; n++) {
            if (d.nodes[n]!.id === conns[c]) {
              nextNode = d.nodes[n];
              break;
            }
          }
          if (nextNode && !d.visitedNodeIds.includes(nextNode.id)) {
            candidate = `Nudge: a sound carries from ${nextNode.name}.`;
            break;
          }
        }
      }
    } else if (idx === 1) {
      const people = presentNpcRecords(state);
      for (let p = 0; p < people.length; p++) {
        if (!isMetNpc(people[p]!)) {
          candidate = `Nudge: ${people[p]!.npcName} comes over to you.`;
          break;
        }
      }
    } else if (idx === 2) {
      const quests = state.quests ?? [];
      for (let q = 0; q < quests.length; q++) {
        const quest = quests[q]!;
        if (quest.status !== 'active' || !quest.revealed) continue;
        const objs = quest.objectives ?? [];
        for (let o = 0; o < objs.length; o++) {
          const obj = objs[o]!;
          if (obj.completed || obj.optional) continue;
          let desc = obj.description;
          while (desc.endsWith('.') || desc.endsWith('!') || desc.endsWith('?')) {
            desc = desc.slice(0, -1);
          }
          candidate = `Nudge: word reaches you about ${quest.name}: ${desc}.`;
          break;
        }
        if (candidate) break;
      }
    } else {
      const hubs = hubsForBibleId(state.campaignBibleId);
      const here = matchHub(hubs, state.currentLocation);
      const visited = new Set<string>();
      const placeRows = state.places ?? [];
      for (let p = 0; p < placeRows.length; p++) {
        if (placeRows[p]!.lastVisitedTurn != null) {
          visited.add(placeRows[p]!.name.toLowerCase());
        }
      }
      let pick: (typeof hubs)[number] | undefined;
      for (let h = 0; h < hubs.length; h++) {
        const hub = hubs[h]!;
        if (hub.id === here?.id || visited.has(hub.name.toLowerCase())) continue;
        let already = false;
        for (const f of fired) {
          if (f.includes(hub.name)) {
            already = true;
            break;
          }
        }
        if (!already) {
          pick = hub;
          break;
        }
        if (!pick) pick = hub;
      }
      const sight = pick ? placeFirstSight(state, pick.name) : '';
      let sightClean = sight;
      while (sightClean.endsWith('.') || sightClean.endsWith('!') || sightClean.endsWith('?')) {
        sightClean = sightClean.slice(0, -1);
      }
      const speaker = presentNpcRecords(state)[0]?.npcName;
      if (pick && speaker) {
        candidate = `Nudge: ${speaker} mentions ${pick.name}${sightClean ? `: ${sightClean}` : ''}.`;
      }
    }
    if (candidate && !fired.has(candidate)) {
      line = candidate;
      used = idx;
    }
  }

  if (!line) {
    // Former "Nudge skipped: no engine-fact nudge; OPT-5 stall uses the scene planner" dead end:
    // ONLY now may the director inject a lead/development (engine-fact wording, not stock Lead:).
    const lead = pickLeadFact(state);
    if (lead && !fired.has(lead.fact)) {
      const nextCursor = (used + 1) % sourceCount;
      return {
        state: writeDirectorNudge(state, lead.fact, nextCursor),
        receipts: [lead.fact],
        notes: [...notes, 'Director lead after old nudge sources exhausted'],
      };
    }
    const forced = planDirector({
      ...state,
      progressGovernor: {
        ...(state.progressGovernor ?? { lastProgressTurn: 0, recentDeltas: [], turnsSinceProgress: STALL_N }),
        turnsSinceProgress: STALL_N,
      },
    });
    if (forced.receipts.length || forced.plan.development?.fact) {
      const fact = forced.plan.development?.fact ?? forced.receipts[0]!;
      return {
        state: writeDirectorNudge(forced.state, fact, (used + 1) % sourceCount, { countsAsProgress: false }),
        receipts: forced.receipts.length ? forced.receipts : [fact],
        notes: [...notes, ...forced.notes, 'Director forced development (old nudge sources exhausted)'],
      };
    }
    return { state, receipts: [], notes: [...notes, 'Director: no development available this beat'] };
  }

  return {
    state: writeDirectorNudge(state, line, (used + 1) % sourceCount),
    receipts: [line],
    notes,
  };
}

/** Cap fight chips at 4 (SRD action economy — one action; pads stay small). */
export function capFightChips(chips: string[]): string[] {
  return chips.slice(0, MAX_FIGHT_CHIPS);
}

/** Apply director chip policy on a finished pad list. */
export function applyDirectorChipPolicy(
  state: GameState,
  chips: string[],
  opts: { recentChips?: string[]; noOpChip?: string | null; inFight?: boolean } = {},
): string[] {
  // Drop blank labels (empty-string chip bug) before policy.
  let next = chips.filter((c) => (c ?? '').replace(/\s+/g, ' ').trim().length > 0);
  const noOp = opts.noOpChip ?? directorNoOpChip(state);
  next = filterDirectorTravelChips(state, next, opts.recentChips ?? []);
  next = replaceNoOpChip(state.directorPlan, next, noOp);
  if (opts.inFight) next = capFightChips(next);
  // Prefer director plan chips first when stall need is active.
  const plan = state.directorPlan;
  if (plan && plan.need !== 'none' && plan.chips.length) {
    const prefer = plan.chips
      .map((c) => c.label)
      .filter((l) => (l ?? '').trim().length > 0)
      .filter((l) => next.includes(l) || travelDestFromChip(l));
    const merged = [...prefer];
    for (const c of next) {
      if (!merged.includes(c)) merged.push(c);
    }
    next = filterDirectorTravelChips(state, merged, opts.recentChips ?? []);
  }
  // Journey "Walk on" / bare continue is not a travelDest — under stall prefer a plan chip over it.
  if (plan && plan.need !== 'none' && plan.chips.length) {
    const planFirst = plan.chips.map((c) => c.label).find((l) => (l ?? '').trim());
    if (planFirst) {
      const withoutWalk = next.filter((c) => !/^walk on\b/i.test(c) && !/^turn back toward\b/i.test(c));
      // Keep turn-back only when director travel need names that dest.
      const turnBackOk = next.filter((c) => {
        if (!/^turn back toward\b/i.test(c)) return false;
        const dest = travelDestFromChip(c);
        if (!dest || !plan.development?.placeId) return false;
        return dest.toLowerCase() === plan.development.placeId.toLowerCase()
          || matchHub(hubsForBibleId(state.campaignBibleId), dest)?.id === plan.development.placeId;
      });
      if (plan.need === 'travel' || plan.need === 'lead' || plan.need === 'npc-act' || plan.need === 'threat') {
        next = [planFirst, ...turnBackOk, ...withoutWalk.filter((c) => c !== planFirst)];
        next = filterDirectorTravelChips(state, next, opts.recentChips ?? []);
      }
    }
  }
  return next;
}

// Bind after planDirector is defined so openThreads.planSceneThreads can delegate.
bindPlanDirector(planDirector);
