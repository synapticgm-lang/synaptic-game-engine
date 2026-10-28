/**
 * TT-T1 — engine open-thread list and scene planner (all modes; never PYOA).
 *
 * Idea: Mythic-style open-thread lists (Tana Pigeon; pattern only — no Mythic code).
 * Threads are engine records. A thread closes only when its resolution condition is met.
 * Declaring a quest done, a villain dead, or a mystery solved in prose without that
 * condition is rejected by the existing fact gate (`factClosedViolationReason`).
 *
 * OPT-5 (q39-T1b): when turnsSinceProgress > N, the pressure clock deadline has passed,
 * or circling.stale has held for N turns, this planner brings forward — in order — an open
 * thread, an NPC agenda step (OPT-3), or a new OPT-2 situation as a real chip and engine
 * event. Generic sensory nudges are not used (pool deleted; see tt-cut-log).
 *
 * Idea for sifting the log for unresolved threads: Kreminski, Dickinson and Wardrip-Fruin,
 * "Felt: A Simple Story Sifter" (ICIDS 2019). Cite as the idea only — no Felt code (no licence).
 */

import type {
  GameState,
  NpcMemory,
  OpenThread,
  PlaceEngineEvent,
  PlaceRecord,
  Quest,
  TimelineFact,
} from './types';
import { mentionsName, peopleHere } from './chipLegality';
import { isCrowdFillerToken } from './chromeAuthority';
import { presentNpcRecords } from './npcRecords';
import { applyPressureAgendaAdvance, tickPressureClock } from './pressureClock';
import { ensureQuestFloor } from './questGenerator';
import { commitTravel, isJourneyUnderway } from './travelJourney';

/**
 * Bible hooks are GM notes shaped `Label: essay` (Secret / Moral anchor / Obstacle…).
 * Structural colon-label — not a deny-list of words. Never a player chip topic.
 */
export function isGmFacingNote(text: string): boolean {
  return /^[A-Za-z][A-Za-z0-9 /&'-]{0,40}:\s+\S/.test((text ?? '').trim());
}

/**
 * Spoken motive line → short chip topic (action phrase, never a quoted speech fragment).
 * "I only want the town calm" → "the town calm"; "I need someone steady watching that keep gate"
 * → "someone steady watching that keep gate" (T10O — chip labels are acts, not NPC lines).
 */
export function chipWantFromMotiveLine(line: string): string {
  const t = (line ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const m = t.match(/^I (?:only )?(?:want|need)\s+(.+)$/i);
  let body = (m?.[1] ?? t).trim();
  // Strip wrapping quotes so a motive stored as dialogue never becomes a chip speech fragment.
  body = body.replace(/^["'“‘]|["'”’]$/g, '').trim();
  const cut = body.search(/[,.]/);
  if (cut > 8) body = body.slice(0, cut).trim();
  return body.slice(0, 80);
}

/**
 * SheetPlace enum keys accidentally bound as goal.target (pre-T10Q). One-word place types are not
 * conversational threads — fall through to motive / need.
 */
function isSheetPlaceKey(text: string): boolean {
  const t = (text ?? '').trim().toLowerCase();
  return t === 'inn' || t === 'town' || t === 'road' || t === 'camp' || t === 'cell' || t === 'dungeon';
}

/**
 * Want used on Follow-up / Ask-about chips: player-facing topic only.
 * Bound goal target when it is not a GM hook note; else motive line; never Secret:/Moral-anchor essays
 * and never the shared informant need "a buyer who pays" when a real want exists.
 */
export function npcChipWant(m: NpcMemory): string {
  const target = (m.goal?.target ?? '').trim();
  if (target && !isGmFacingNote(target) && !isSheetPlaceKey(target)) {
    // T10O — goal targets may be stored as first-person speech; chip labels stay action phrases.
    return chipWantFromMotiveLine(target) || target;
  }
  const motive = chipWantFromMotiveLine(m.motiveLines?.[0] ?? '');
  if (motive && !isSheetPlaceKey(motive)) return motive;
  const need = (m.need ?? '').trim();
  if (need && !isGmFacingNote(need) && !isSheetPlaceKey(need)) {
    return chipWantFromMotiveLine(need) || need;
  }
  return '';
}

/** Whether the NPC for an agenda / npc-goal thread is in the current scene (chip compiler gate). */
export function npcGoalPersonHere(state: GameState, npcId: string, npcName?: string): boolean {
  const name = (npcName ?? (npcId.startsWith('npc:') ? npcId.slice(4) : npcId)).trim();
  if (!name && !npcId) return false;
  const present = presentNpcRecords(state);
  for (let i = 0; i < present.length; i++) {
    const m = present[i]!;
    if ((m.npcId || `npc:${m.npcName}`) === npcId) return true;
    if (name && (mentionsName(m.npcName, name) || mentionsName(name, m.npcName))) return true;
  }
  const here = peopleHere(state);
  for (let i = 0; i < here.length; i++) {
    const h = here[i]!;
    if (name && (mentionsName(h, name) || mentionsName(name, h))) return true;
  }
  return false;
}

export type { OpenThread, SceneThreadPlan, ThreadKind, ThreadResolution } from './types';

const STALE_TURNS = 10;
const BRING_WINDOW = 5;
/**
 * OPT-5 stall threshold (turnsSinceProgress, circling.stale hold, pressure deadline).
 * T10Z — must fire before fate LOOP STOP (5 no-progress turns) so the planner can move the world.
 */
export const STALL_N = 3;

/** Whether the engine record already satisfies this thread's close condition. */
export function threadResolutionMet(state: GameState, thread: OpenThread): boolean {
  const r = thread.resolution;
  if (r.type === 'quest-complete') {
    const quests = state.quests ?? [];
    for (let i = 0; i < quests.length; i++) {
      if (quests[i]!.id === r.questId) return quests[i]!.status === 'completed';
    }
    return false;
  }
  if (r.type === 'commitment-kept') {
    const list = state.commitments ?? [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i]!;
      if (c.promiseId === r.promiseId) return c.status === 'kept' || c.status === 'waived';
    }
    return false;
  }
  if (r.type === 'lead-resolved') {
    const quests = state.quests ?? [];
    for (let i = 0; i < quests.length; i++) {
      const q = quests[i]!;
      if (q.id !== r.questId) continue;
      if (q.status === 'completed') return true;
      const leads = q.openLeads ?? [];
      for (let L = 0; L < leads.length; L++) {
        if ((leads[L] ?? '').trim() === r.lead) return false;
      }
      return true;
    }
    return false;
  }
  if (r.type === 'npc-goal-met') {
    const mems = state.npcMemories ?? [];
    for (let i = 0; i < mems.length; i++) {
      const m = mems[i]!;
      if ((m.npcId || `npc:${m.npcName}`) !== r.npcId) continue;
      return !m.goal?.motivation;
    }
    return true;
  }
  if (r.type === 'foe-defeated') {
    const enc = state.activeEncounter;
    if (enc && enc.hp > 0 && (enc.name ?? '').trim().toLowerCase() === r.foeName.toLowerCase()) {
      return false;
    }
    const kill = state.sceneFacts?.lastKill;
    if (
      kill?.name
      && kill.outcome === 'victory'
      && kill.name.trim().toLowerCase() === r.foeName.toLowerCase()
    ) {
      return true;
    }
    const threats = state.placeThreats;
    if (threats) {
      const keys = Object.keys(threats);
      for (let i = 0; i < keys.length; i++) {
        const encThreat = threats[keys[i]!]!.encounter;
        if (
          (encThreat?.name ?? '').trim().toLowerCase() === r.foeName.toLowerCase()
          && (encThreat?.hp ?? 1) > 0
        ) {
          return false;
        }
      }
    }
    return false;
  }
  return false;
}

/** Build the open-thread list from the engine record (all modes). */
export function collectOpenThreads(state: GameState): OpenThread[] {
  const out: OpenThread[] = [];
  const prev = state.openThreads ?? [];
  const prevById: Record<string, OpenThread> = {};
  for (let i = 0; i < prev.length; i++) prevById[prev[i]!.id] = prev[i]!;
  const turn = state.turn ?? 0;

  const quests = state.quests ?? [];
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    if (q.status !== 'active' && q.status !== 'hidden') continue;
    if (q.revealed === false) continue;
    const id = `quest:${q.id}`;
    const old = prevById[id];
    out.push({
      id,
      kind: 'quest',
      label: q.name || q.description || q.id,
      entityId: id,
      placeId: q.location ?? q.leadsTo ?? null,
      lastSeenTurn: old?.lastSeenTurn ?? q.activatedTurn ?? q.revealedTurn ?? turn,
      resolution: { type: 'quest-complete', questId: q.id },
    });
    const leads = q.openLeads ?? [];
    for (let L = 0; L < leads.length; L++) {
      const lead = (leads[L] ?? '').trim();
      if (!lead) continue;
      const lid = `lead:${q.id}:${lead}`;
      const oldL = prevById[lid];
      out.push({
        id: lid,
        kind: 'lead',
        label: lead,
        entityId: `quest:${q.id}`,
        placeId: q.location ?? null,
        lastSeenTurn: oldL?.lastSeenTurn ?? turn,
        resolution: { type: 'lead-resolved', questId: q.id, lead },
      });
    }
  }

  const mems = state.npcMemories ?? [];
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]!;
    if (!m.goal?.motivation) continue;
    const about = npcChipWant(m);
    if (!about) continue;
    const npcId = m.npcId || `npc:${m.npcName}`;
    const id = `npc-goal:${npcId}`;
    const old = prevById[id];
    // T10Q — thread label is a plain topic; never the spoken motive fragment (Ask chips still use about).
    const motiveFrag = chipWantFromMotiveLine(m.motiveLines?.[0] ?? '');
    const threadTopic = motiveFrag && about === motiveFrag ? '' : about;
    out.push({
      id,
      kind: 'npc-goal',
      label: threadTopic ? `${m.npcName}: ${threadTopic}` : m.npcName,
      entityId: npcId,
      placeId: m.location ?? null,
      lastSeenTurn: old?.lastSeenTurn ?? m.lastSeenTurn ?? turn,
      resolution: { type: 'npc-goal-met', npcId },
    });
  }

  const commits = state.commitments ?? [];
  for (let i = 0; i < commits.length; i++) {
    const c = commits[i]!;
    if (c.status !== 'open') continue;
    const id = `promise:${c.promiseId}`;
    const old = prevById[id];
    out.push({
      id,
      kind: 'promise',
      label: c.description || c.promiseId,
      entityId: id,
      placeId: null,
      lastSeenTurn: old?.lastSeenTurn ?? c.madeTurn ?? turn,
      resolution: { type: 'commitment-kept', promiseId: c.promiseId },
    });
  }

  const enc = state.activeEncounter;
  if (enc && enc.hp > 0) {
    const name = (enc.name ?? '').trim();
    if (name) {
      const id = `foe:${name}`;
      const old = prevById[id];
      out.push({
        id,
        kind: 'foe',
        label: name,
        entityId: id,
        placeId: state.currentLocation ?? null,
        lastSeenTurn: old?.lastSeenTurn ?? enc.startedTurn ?? turn,
        resolution: { type: 'foe-defeated', foeName: name },
      });
    }
  }

  const kept: OpenThread[] = [];
  for (let i = 0; i < out.length; i++) {
    if (!threadResolutionMet(state, out[i]!)) kept.push(out[i]!);
  }
  return kept;
}

/** OPT-5: true when progress stall, pressure deadline, or circling.stale has held ≥ STALL_N. */
export function stallPressureActive(state: GameState): boolean {
  if (state.engineMode === 'pyoa') return false;
  const turn = state.turn ?? 0;
  const tsp = state.progressGovernor?.turnsSinceProgress ?? 0;
  if (tsp >= STALL_N) return true;
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

/** Closed places are not travel exits until an event reopens them. */
export function isPlaceOpenForExit(state: GameState, placeName: string): boolean {
  const want = (placeName ?? '').trim().toLowerCase();
  if (!want) return false;
  const places = state.places ?? [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    const n = (p.name ?? '').trim().toLowerCase();
    if (n === want || (p.id ?? '').toLowerCase() === want) {
      return p.arcStatus !== 'closed';
    }
  }
  return true;
}

/** Apply a place arc event (cleared / closed / reopened / new threat / new trader). */
export function applyPlaceEngineEvent(state: GameState, event: PlaceEngineEvent): GameState {
  if (state.engineMode === 'pyoa') return state;
  const want = event.placeId.trim().toLowerCase();
  if (!want) return state;
  const places = state.places ?? [];
  let found = false;
  const next: PlaceRecord[] = [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    const n = (p.name ?? '').trim().toLowerCase();
    const id = (p.id ?? '').toLowerCase();
    if (n !== want && id !== want) {
      next.push(p);
      continue;
    }
    found = true;
    let arcStatus = p.arcStatus;
    if (event.kind === 'cleared') arcStatus = 'cleared';
    else if (event.kind === 'closed') arcStatus = 'closed';
    else if (event.kind === 'reopened') arcStatus = 'open';
    else if (event.kind === 'new-threat' || event.kind === 'new-trader') {
      arcStatus = arcStatus === 'closed' ? 'open' : arcStatus ?? 'open';
    }
    const summary =
      event.detail
      ?? (event.kind === 'cleared'
        ? 'Site cleared'
        : event.kind === 'closed'
          ? 'Place closed'
          : event.kind === 'reopened'
            ? 'Place reopened'
            : event.kind === 'new-threat'
              ? 'New threat'
              : 'New trader');
    next.push({ ...p, arcStatus, arcSummary: summary, lastVisitedTurn: p.lastVisitedTurn ?? state.turn });
  }
  if (!found) {
    let slug = 'place_';
    const raw = event.placeId.trim();
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i]!;
      const code = ch.charCodeAt(0);
      const lower =
        code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : ch;
      if (
        (lower >= 'a' && lower <= 'z')
        || (lower >= '0' && lower <= '9')
      ) {
        slug += lower;
      } else if (lower === ' ' || lower === '-' || lower === '_') {
        slug += '-';
      }
    }
    next.push({
      id: slug,
      name: raw,
      arcStatus:
        event.kind === 'cleared'
          ? 'cleared'
          : event.kind === 'closed'
            ? 'closed'
            : 'open',
      arcSummary: event.detail,
      lastVisitedTurn: state.turn,
    });
  }
  const factText = `Place ${event.placeId.trim()}: ${event.kind}${event.detail ? ` — ${event.detail}` : ''}.`;
  const fact: TimelineFact = {
    id: `place-${event.kind}-${state.turn}-${want}`,
    turn: state.turn ?? 0,
    kind: 'world',
    text: factText,
    at: Date.now(),
  };
  return {
    ...state,
    places: next,
    timeline: [...(state.timeline ?? []), fact].slice(-80),
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, placeWorldFact: factText }
      : {
          crowd: 'unknown',
          noise: 'unknown',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: state.turn ?? 0,
          placeWorldFact: factText,
        },
  };
}

function appendStallFact(state: GameState, eventId: string, text: string): GameState {
  const turn = state.turn ?? 0;
  const fact: TimelineFact = {
    id: eventId,
    turn,
    kind: 'world',
    text,
    at: Date.now(),
  };
  return {
    ...state,
    timeline: [...(state.timeline ?? []), fact].slice(-80),
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, stallWorldFact: text }
      : {
          crowd: 'unknown',
          noise: 'unknown',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: turn,
          stallWorldFact: text,
        },
  };
}

/**
 * Scene planner: refresh the open-thread list, drop resolved rows, and bring
 * forward at least one open thread (weighted by turns since last seen + place proximity).
 * A stale thread (untouched ≥ STALE_TURNS) is preferred so it reappears within BRING_WINDOW.
 * Under OPT-5 stall pressure, also bring an agenda step or OPT-2 situation when no thread.
 */
export function planSceneThreads(state: GameState): GameState {
  if (state.engineMode === 'pyoa') return state;
  const turn = state.turn ?? 0;
  const threads = collectOpenThreads(state);
  const stall = stallPressureActive(state);
  const plan = state.sceneThreadPlan;
  if (plan && plan.plannedTurn === turn && plan.forwardIds.length && !(stall && !plan.stallKind)) {
    return { ...state, openThreads: threads, sceneThreadPlan: plan };
  }
  if (!threads.length && !stall) {
    return {
      ...state,
      openThreads: [],
      sceneThreadPlan: { plannedTurn: turn, forwardIds: [] },
    };
  }

  const here = (state.currentLocation ?? '').trim().toLowerCase();
  let best: OpenThread | null = null;
  let bestScore = -1;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    // Follow-up chips only for people in the scene — skip absent npc-goal rows at pick time.
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
      if (turn <= deadline) {
        best = t;
        break;
      }
    }
  }

  let working: GameState = { ...state, openThreads: threads };
  const forwardIds: string[] = [];
  let stallKind: 'thread' | 'agenda' | 'situation' | undefined;
  let stallEventId: string | undefined;

  if (best) {
    forwardIds.push(best.id);
    if (stall) {
      stallKind = 'thread';
      stallEventId = `stall-thread-${turn}-${best.id}`;
      working = appendStallFact(
        working,
        stallEventId,
        `Stall pressure: open thread brought forward — ${best.label}.`,
      );
    }
  } else if (stall) {
    // Order: open thread (none) → NPC agenda step → OPT-2 situation.
    const prevClock = working.arcDirector?.pressureClock;
    const nextClock = tickPressureClock(prevClock, false, turn);
    working = applyPressureAgendaAdvance(
      working,
      prevClock,
      { ...nextClock, deadlineTurn: turn },
      false,
    );
    const agendaFired = working.arcDirector?.pressureClock?.lastAgendaAdvanceTurn === turn;
    let memWithGoal: NpcMemory | null = null;
    const mems = working.npcMemories ?? [];
    for (let i = 0; i < mems.length; i++) {
      const m = mems[i]!;
      if (!m.goal?.motivation) continue;
      const npcId = m.npcId || `npc:${m.npcName}`;
      if (!npcGoalPersonHere(working, npcId, m.npcName)) continue;
      memWithGoal = m;
      break;
    }
    if (agendaFired && memWithGoal) {
      const npcId = memWithGoal.npcId || `npc:${memWithGoal.npcName}`;
      forwardIds.push(`agenda:${npcId}`);
      stallKind = 'agenda';
      stallEventId = `stall-agenda-${turn}-${npcId}`;
      if (!working.sceneFacts?.agendaWorldFact) {
        working = appendStallFact(
          working,
          stallEventId,
          `Stall pressure: agenda step for ${memWithGoal.npcName}.`,
        );
      }
    } else {
      const floor = ensureQuestFloor(working);
      working = floor.state;
      if (floor.quest) {
        forwardIds.push(`situation:${floor.quest.id}`);
        stallKind = 'situation';
        stallEventId = `stall-situation-${turn}-${floor.quest.id}`;
        working = appendStallFact(
          working,
          stallEventId,
          `Stall pressure: new situation — ${floor.quest.name}.`,
        );
      } else if (
        isJourneyUnderway(working)
        && peopleHere(working).filter((n) => !isCrowdFillerToken(n)).length === 0
        && !working.activeEncounter
      ) {
        // T10Z — empty road stall: the world moves on (one Walk on leg). Do not wait for the
        // typed player to pick Push on while grabbing absent companions (s9301 T123–T127).
        const advanced = commitTravel(working, 'Walk on');
        if (advanced.handled) {
          working = advanced.state;
          forwardIds.push(`stall-road:${turn}`);
          stallKind = 'situation';
          stallEventId = `stall-road-${turn}`;
          working = appendStallFact(
            working,
            stallEventId,
            advanced.receipt || 'Stall pressure: the road pressed you onward.',
          );
        } else if (agendaFired || (working.arcDirector?.pressureClock?.deadlineTurn != null
          && turn >= (working.arcDirector.pressureClock.deadlineTurn ?? turn + 1))) {
          stallEventId = `stall-pressure-${turn}`;
          working = appendStallFact(
            working,
            stallEventId,
            `Stall pressure: pressure clock fired at T${turn}.`,
          );
        }
      } else if (agendaFired || (working.arcDirector?.pressureClock?.deadlineTurn != null
        && turn >= (working.arcDirector.pressureClock.deadlineTurn ?? turn + 1))) {
        stallEventId = `stall-pressure-${turn}`;
        working = appendStallFact(
          working,
          stallEventId,
          `Stall pressure: pressure clock fired at T${turn}.`,
        );
      }
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

  // Pressure deadline still needs an engine event when a thread was already forward (OPT5-2).
  if (stall && !stallEventId) {
    const deadline = working.arcDirector?.pressureClock?.deadlineTurn;
    if (deadline != null && turn >= deadline) {
      stallEventId = `stall-pressure-${turn}`;
      if (!stallKind && best) stallKind = 'thread';
      working = appendStallFact(
        working,
        stallEventId,
        `Stall pressure: pressure clock deadline passed at T${deadline}.`,
      );
    }
  }

  return {
    ...working,
    openThreads: nextThreads,
    sceneThreadPlan: {
      plannedTurn: turn,
      forwardIds,
      stallKind,
      stallEventId,
    },
  };
}

/** Chip label + ids for the brought-forward thread / stall agenda / OPT-2 situation. */
export function forwardThreadAffordance(state: GameState): {
  label: string;
  actionId: string;
  entityId: string;
} | null {
  const plan = state.sceneThreadPlan;
  if (!plan?.forwardIds?.length) return null;
  const id = plan.forwardIds[0]!;

  if (id.startsWith('agenda:')) {
    const npcId = id.slice('agenda:'.length);
    const mems = state.npcMemories ?? [];
    let name = npcId.startsWith('npc:') ? npcId.slice(4) : npcId;
    let want = '';
    for (let i = 0; i < mems.length; i++) {
      const m = mems[i]!;
      if ((m.npcId || `npc:${m.npcName}`) === npcId) {
        name = m.npcName;
        want = npcChipWant(m);
        break;
      }
    }
    if (!npcGoalPersonHere(state, npcId, name)) return null;
    // T10Q — do not paste a spoken motive fragment onto the Follow-up chip (queues replay).
    let mem: NpcMemory | undefined;
    for (let i = 0; i < mems.length; i++) {
      if ((mems[i]!.npcId || `npc:${mems[i]!.npcName}`) === npcId) {
        mem = mems[i];
        break;
      }
    }
    const motiveFrag = chipWantFromMotiveLine(mem?.motiveLines?.[0] ?? '');
    const topic = want && want !== motiveFrag ? want : '';
    return {
      label: topic ? `Follow up with ${name}: ${topic}` : `Follow up with ${name}`,
      actionId: `stall:${id}:forward`,
      entityId: npcId,
    };
  }
  if (id.startsWith('situation:')) {
    const questId = id.slice('situation:'.length);
    const quests = state.quests ?? [];
    let label = 'Take on the new situation';
    for (let i = 0; i < quests.length; i++) {
      if (quests[i]!.id === questId) {
        label = `Take on: ${quests[i]!.name}`;
        break;
      }
    }
    return {
      label,
      actionId: `stall:${id}:forward`,
      entityId: `quest:${questId}`,
    };
  }

  const threads = state.openThreads ?? [];
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (t.id !== id) continue;
    if (threadResolutionMet(state, t)) return null;
    if (t.kind === 'npc-goal' && !npcGoalPersonHere(state, t.entityId || '', t.label.split(':')[0])) {
      return null;
    }
    let label = t.label;
    if (t.kind === 'quest') label = `Pursue ${t.label}`;
    else if (t.kind === 'lead') label = `Follow up: ${t.label}`;
    else if (t.kind === 'promise') label = `Honour the promise: ${t.label}`;
    else if (t.kind === 'npc-goal') label = `Follow up with ${t.label}`;
    else if (t.kind === 'foe') label = `Face ${t.label}`;
    return {
      label,
      actionId: `thread:${t.id}:forward`,
      entityId: t.entityId || t.id,
    };
  }
  return null;
}

/**
 * Draft claims an open thread closed without its engine resolution.
 * Name comes from the open-thread / living-foe record — not a word list of villains.
 */
export function earlyThreadCloseReason(state: GameState, text: string): string | null {
  const body = (text ?? '').trim();
  if (!body || state.engineMode === 'pyoa') return null;
  const low = body.toLowerCase();

  // Name from the engine record + a close claim in the same short window (no novel deny-list).
  const threads = state.openThreads?.length ? state.openThreads : collectOpenThreads(state);
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (threadResolutionMet(state, t)) continue;
    const r = t.resolution;

    if (r.type === 'foe-defeated') {
      const name = r.foeName.trim().toLowerCase();
      if (name.length < 2) continue;
      let from = 0;
      while (from < low.length) {
        const idx = low.indexOf(name, from);
        if (idx < 0) break;
        const win = low.slice(idx, idx + name.length + 48);
        if (
          win.includes('is dead')
          || win.includes('are dead')
          || win.includes('lies dead')
          || win.includes('has died')
          || win.includes('was slain')
          || win.includes('was killed')
          || win.includes('fell dead')
        ) {
          return 'Closes an open thread before its engine resolution (foe still living).';
        }
        from = idx + name.length;
      }
    }

    if (r.type === 'quest-complete') {
      const quests = state.quests ?? [];
      let q: Quest | null = null;
      for (let j = 0; j < quests.length; j++) {
        if (quests[j]!.id === r.questId) {
          q = quests[j]!;
          break;
        }
      }
      const title = (q?.name ?? t.label).trim().toLowerCase();
      if (title.length < 3) continue;
      let from = 0;
      while (from < low.length) {
        const idx = low.indexOf(title, from);
        if (idx < 0) break;
        const win = low.slice(idx, idx + title.length + 56);
        if (
          win.includes('is done')
          || win.includes('is complete')
          || win.includes('is finished')
          || win.includes('is over')
          || win.includes('has been completed')
          || win.includes('has been finished')
          || win.includes('has been solved')
          || win.includes('quest is done')
          || win.includes('quest is complete')
        ) {
          return 'Closes an open thread before its engine resolution (quest still open).';
        }
        from = idx + title.length;
      }
    }

    if (r.type === 'lead-resolved') {
      const lead = r.lead.trim().toLowerCase();
      if (lead.length < 3) continue;
      let from = 0;
      while (from < low.length) {
        const idx = low.indexOf(lead, from);
        if (idx < 0) break;
        const win = low.slice(idx, idx + lead.length + 48);
        if (
          win.includes('is solved')
          || win.includes('mystery is solved')
          || win.includes('case is closed')
        ) {
          return 'Closes an open thread before its engine resolution (lead still open).';
        }
        from = idx + lead.length;
      }
    }
  }

  const enc = state.activeEncounter;
  if (enc && enc.hp > 0) {
    const name = (enc.name ?? '').trim().toLowerCase();
    if (name.length >= 2) {
      let from = 0;
      while (from < low.length) {
        const idx = low.indexOf(name, from);
        if (idx < 0) break;
        const win = low.slice(idx, idx + name.length + 48);
        if (
          win.includes('is dead')
          || win.includes('are dead')
          || win.includes('lies dead')
          || win.includes('has died')
          || win.includes('was slain')
          || win.includes('was killed')
          || win.includes('fell dead')
        ) {
          return 'Closes an open thread before its engine resolution (foe still living).';
        }
        from = idx + name.length;
      }
    }
  }

  return null;
}
