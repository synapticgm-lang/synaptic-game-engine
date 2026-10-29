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
import { STALL_N } from './directorConstants';
import {
  chipWantFromMotiveLine,
  isGmFacingNote,
  npcChipWant,
  npcGoalPersonHere,
} from './openThreadUtils';

export { chipWantFromMotiveLine, isGmFacingNote, npcChipWant, npcGoalPersonHere };
export { STALL_N };

/**
 * T10DIR — late-bound planDirector (director imports collectOpenThreads from this file;
 * bind runs when director.ts loads via choiceRanking / useGame / fateAutoplay).
 */
type PlanDirectorFn = (
  state: GameState,
  input?: { playerInput?: string },
) => { state: GameState };
let _planDirector: PlanDirectorFn | null = null;
export function bindPlanDirector(fn: PlanDirectorFn): void {
  _planDirector = fn;
}

/**
 * OPT-5 / T10DIR stall gate. Decision ownership is director.ts; this predicate is the shared
 * read used by pads / compiler (same meaning as director.stallPressureActive).
 */
export function stallPressureActive(state: GameState): boolean {
  if (state.engineMode === 'pyoa') return false;
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

function ensureDirector(): void {
  if (_planDirector) return;
  // Sync side-effect bind (circular import is safe: bindPlanDirector is already defined).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./director');
  if (!_planDirector) {
    throw new Error('T10DIR: director bind failed before planSceneThreads');
  }
}

export type { OpenThread, SceneThreadPlan, ThreadKind, ThreadResolution } from './types';

/** Whether the engine record already satisfies this thread's close condition. */
export function threadResolutionMet(state: GameState, thread: OpenThread): boolean {
  const r = thread.resolution;
  if (r.type === 'quest-complete') {
    const quests = state.quests ?? [];
    for (let i = 0; i < quests.length; i++) {
      if (quests[i]!.id !== r.questId) continue;
      const q = quests[i]!;
      if (q.status === 'completed') return true;
      // Same resolved-thread check the old planner / nudge used: every required step done.
      const objs = q.objectives ?? [];
      if (objs.length && objs.every((o) => o.completed || o.optional)) return true;
      return false;
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
    // No open step → not an open thread (director must not bring a finished quest forward).
    const objs = q.objectives ?? [];
    if (objs.length && objs.every((o) => o.completed || o.optional)) continue;
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

/**
 * T10DIR — thread data store refresh + director progression plan.
 * Stall / bring-forward decisions live only in director.ts (bound via bindPlanDirector).
 */
export function planSceneThreads(state: GameState, playerInput = ''): GameState {
  if (state.engineMode === 'pyoa') return state;
  ensureDirector();
  return _planDirector!(state, { playerInput }).state;
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
    // T10AI — departed crowd/role: presence record is the chip gate (not a stale open-thread).
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
