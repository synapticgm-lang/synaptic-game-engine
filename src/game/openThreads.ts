/**
 * TT-T1 — engine open-thread list and scene planner (all modes; never PYOA).
 *
 * Idea: Mythic-style open-thread lists (Tana Pigeon; pattern only — no Mythic code).
 * Threads are engine records. A thread closes only when its resolution condition is met.
 * Declaring a quest done, a villain dead, or a mystery solved in prose without that
 * condition is rejected by the existing fact gate (`factClosedViolationReason`).
 *
 * OPT-5 stall pressure and quest spacing move into this planner in q39-T1b.
 */

import type { GameState, OpenThread, Quest } from './types';

export type { OpenThread, SceneThreadPlan, ThreadKind, ThreadResolution } from './types';

const STALE_TURNS = 10;
const BRING_WINDOW = 5;

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
    const about = (m.need ?? m.goal.target ?? '').trim();
    if (!about) continue;
    const npcId = m.npcId || `npc:${m.npcName}`;
    const id = `npc-goal:${npcId}`;
    const old = prevById[id];
    out.push({
      id,
      kind: 'npc-goal',
      label: `${m.npcName}: ${about}`,
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

/**
 * Scene planner: refresh the open-thread list, drop resolved rows, and bring
 * forward at least one open thread (weighted by turns since last seen + place proximity).
 * A stale thread (untouched ≥ STALE_TURNS) is preferred so it reappears within BRING_WINDOW.
 */
export function planSceneThreads(state: GameState): GameState {
  if (state.engineMode === 'pyoa') return state;
  const threads = collectOpenThreads(state);
  if (!threads.length) {
    return {
      ...state,
      openThreads: [],
      sceneThreadPlan: { plannedTurn: state.turn ?? 0, forwardIds: [] },
    };
  }

  const turn = state.turn ?? 0;
  const plan = state.sceneThreadPlan;
  if (plan && plan.plannedTurn === turn && plan.forwardIds.length) {
    return { ...state, openThreads: threads, sceneThreadPlan: plan };
  }

  const here = (state.currentLocation ?? '').trim().toLowerCase();
  let best: OpenThread | null = null;
  let bestScore = -1;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
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
    const untouched = turn - (t.lastSeenTurn ?? 0);
    if (untouched >= STALE_TURNS) {
      const deadline = (t.lastSeenTurn ?? 0) + STALE_TURNS + BRING_WINDOW;
      if (turn <= deadline) {
        best = t;
        break;
      }
    }
  }

  const forwardIds: string[] = [];
  if (best) forwardIds.push(best.id);

  const nextThreads: OpenThread[] = [];
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    let lastSeen = t.lastSeenTurn;
    for (let f = 0; f < forwardIds.length; f++) {
      if (forwardIds[f] === t.id) lastSeen = turn;
    }
    nextThreads.push({ ...t, lastSeenTurn: lastSeen });
  }

  return {
    ...state,
    openThreads: nextThreads,
    sceneThreadPlan: { plannedTurn: turn, forwardIds },
  };
}

/** Chip label + ids for the brought-forward thread (plain action; tags live on EngineChip). */
export function forwardThreadAffordance(state: GameState): {
  label: string;
  actionId: string;
  entityId: string;
} | null {
  const plan = state.sceneThreadPlan;
  if (!plan?.forwardIds?.length) return null;
  const threads = state.openThreads ?? [];
  const id = plan.forwardIds[0]!;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (t.id !== id) continue;
    if (threadResolutionMet(state, t)) return null;
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
