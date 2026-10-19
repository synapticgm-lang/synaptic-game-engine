/** q72-TIMELINETAGS — one engine-tagged event log. Text rendered from {verb,kind,id,name,detail?}. */
import type { GameEvent } from './parser';
import type { GameState, TimelineEntityRecord, TimelineFact, TimelineFactKind, TimelineTagKind, TimelineVerb } from './types';
import { appendVisitEvent, ensurePlaceVisit } from './sceneBlock';
import { renderTagText } from './timelineFormat';
export { formatTimelineForPrompt, renderTagText } from './timelineFormat';
export {
  formatSceneBlock, formatSceneBlockTokens, appendVisitEvent, compressVisitLog, leavePlaceVisit,
  ensurePlaceVisit, mergeVisitEvents, scenePartTokens, formatRefRecords, mentionFromScene, tokensOf,
} from './sceneBlock';

const MAX = 40;
const WS = /\s+/g;
function uid(): string { return crypto.randomUUID(); }

function pushTagged(facts: TimelineFact[], fact: TimelineFact): void {
  const cleaned = fact.text.replace(WS, ' ').trim();
  if (!cleaned) return;
  for (let i = 0; i < facts.length; i++) {
    const f = facts[i]!;
    if (f.turn === fact.turn && f.verb === fact.verb && f.kind === fact.kind && f.id === fact.id && (f.detail ?? '') === (fact.detail ?? '')) return;
  }
  facts.push({ ...fact, text: cleaned });
}
function pushFact(facts: TimelineFact[], turn: number, kind: TimelineFactKind, text: string): void {
  const cleaned = text.replace(WS, ' ').trim();
  if (!cleaned) return;
  for (let i = 0; i < facts.length; i++) if (facts[i]!.turn === turn && facts[i]!.text === cleaned) return;
  facts.push({ id: uid(), turn, kind, text: cleaned, at: Date.now() });
}

function touchEntity(state: GameState, kind: TimelineTagKind, ref: { id: string; name: string }, detail?: string): GameState {
  const turn = state.turn ?? 0;
  const place = (state.currentLocation ?? '').replace(WS, ' ').trim();
  if (kind === 'person' || kind === 'said') {
    const memories = [...(state.npcMemories ?? [])];
    const at = memories.findIndex((m) => m.npcId === ref.id || m.npcName.toLowerCase() === ref.name.toLowerCase());
    if (at >= 0) {
      const m = memories[at]!;
      const facts = [...(m.facts ?? [])];
      if (detail && !facts.includes(detail)) facts.push(detail);
      memories[at] = {
        ...m, location: place || m.location, lastSeenTurn: turn, facts: facts.slice(-12),
        ...(kind === 'said' && detail ? { said: [...(m.said ?? []), { topic: 'said', turn, line: detail }].slice(-8) } : {}),
      };
      return { ...state, npcMemories: memories };
    }
    if (kind === 'person') {
      memories.push({ npcId: ref.id, npcName: ref.name, disposition: 'neutral', facts: detail ? [detail] : [], lastSeenTurn: turn, location: place || undefined });
      return { ...state, npcMemories: memories };
    }
    return state;
  }
  if (kind === 'creature' || kind === 'item' || kind === 'exit' || kind === 'place' || kind === 'quest' || kind === 'combat') {
    const records = { ...(state.entityRecords ?? {}) };
    const prev = records[ref.id];
    const notes = [...(prev?.notes ?? [])];
    if (detail && !notes.includes(detail)) notes.push(detail);
    const row: TimelineEntityRecord = { kind: kind === 'combat' ? 'combat' : kind, name: ref.name, firstTurn: prev?.firstTurn ?? turn, lastTurn: turn, place: place || prev?.place, notes: notes.slice(-8) };
    records[ref.id] = row;
    return { ...state, entityRecords: records };
  }
  return state;
}

/** ONE helper for engine-tagged events (timeline + entity/npc + visit log). */
export function tag(state: GameState, verb: TimelineVerb, kind: TimelineTagKind, ref: { id: string; name: string }, detail?: string): GameState {
  const who = (ref.name ?? '').replace(WS, ' ').trim();
  const id = (ref.id ?? '').replace(WS, ' ').trim() || who.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!who || !id) return state;
  const note = (detail ?? '').replace(WS, ' ').trim() || undefined;
  const place = (state.currentLocation ?? '').replace(WS, ' ').trim();
  const turn = state.turn ?? 0;
  const text = renderTagText(verb, kind, who, note);
  const timeline = [...(state.timeline ?? [])];
  pushTagged(timeline, { id, turn, verb, kind, name: who, detail: note, ...(place ? { place } : {}), text, at: Date.now() });
  let next: GameState = { ...state, timeline: timeline.length <= MAX ? timeline : timeline.slice(timeline.length - MAX) };
  if ((kind === 'creature' || kind === 'combat' || kind === 'person') && (verb === 'died' || verb === 'left')) {
    const base = next.sceneFacts ?? { crowd: 'unknown' as const, noise: 'unknown' as const, present: [], props: [], lastBeat: '', updatedTurn: turn };
    const n = who.toLowerCase();
    const present: string[] = [];
    for (const p of base.present ?? []) {
      const t = p.toLowerCase();
      if (t !== n && t !== `the ${n}` && t !== `a ${n}` && t !== `an ${n}` && n !== `the ${t}`) present.push(p);
    }
    next = {
      ...next,
      sceneFacts: {
        ...base,
        present,
        ...(verb === 'died' ? { lastKill: { name: who, outcome: 'victory' as const, turn, remains: true }, tension: 'tense' as const } : {}),
      },
    };
  }
  next = touchEntity(next, kind, { id, name: who }, note);
  next = ensurePlaceVisit(next);
  next = appendVisitEvent(next, { id, turn, verb, kind, name: who, detail: note, ...(place ? { place } : {}), text, at: Date.now() });
  return next;
}

/** Thin wrapper over `tag` (met/appeared + person). */
export function recordPersonSeen(state: GameState, name: string, detail: string): GameState {
  const who = (name ?? '').replace(WS, ' ').trim();
  const note = (detail ?? '').replace(WS, ' ').trim();
  if (!who || !note) return state;
  const place = (state.currentLocation ?? '').replace(WS, ' ').trim();
  const whoKey = who.toLowerCase();
  const hereKey = place.toLowerCase();
  for (const f of state.timeline ?? []) {
    if (f.kind === 'person' && (f.name ?? '').toLowerCase() === whoKey && (f.place ?? '').replace(WS, ' ').trim().toLowerCase() === hereKey) return state;
  }
  return tag(state, /met on the road/i.test(note) ? 'met' : 'appeared', 'person', { id: `person:${whoKey.replace(/[^a-z0-9]+/g, '-')}`, name: who }, note);
}

/** Dropped (q72): per-turn player-action echo; XP scrape from systemLog. */
export function collectTurnTimelineFacts(params: {
  turn: number; playerAction: string; stateBefore: GameState;
  stateAfter: Pick<GameState, 'currentLocation' | 'activeEncounter' | 'activeDungeon' | 'character' | 'quests'>;
  events: GameEvent[]; systemLog: string[]; newItemNames: string[]; wardenNotes?: string[]; sceneBeat?: string;
}): TimelineFact[] {
  const { turn, stateBefore, stateAfter, events, newItemNames, wardenNotes = [], sceneBeat } = params;
  const facts: TimelineFact[] = [];
  if (stateAfter.currentLocation && stateAfter.currentLocation !== stateBefore.currentLocation) {
    const place = stateAfter.currentLocation;
    pushTagged(facts, { id: `place:${place.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, turn, verb: 'arrived', kind: 'place', name: place, text: renderTagText('arrived', 'place', place), place, at: Date.now() });
  }
  for (const e of events) {
    if (e.type === 'enemy-appear' && e.enemyName) {
      pushTagged(facts, { id: `combat:${e.enemyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, turn, verb: 'appeared', kind: 'combat', name: e.enemyName, detail: `HP ${e.enemyHp ?? '?'}`, text: renderTagText('appeared', 'combat', e.enemyName, `HP ${e.enemyHp ?? '?'}`), at: Date.now() });
    }
    if (e.type === 'encounter-end') {
      const name = stateBefore.activeEncounter?.name ?? 'enemy';
      pushTagged(facts, { id: `combat:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, turn, verb: 'died', kind: 'combat', name, text: renderTagText('died', 'combat', name), at: Date.now() });
    }
    if (e.type === 'damage' && e.amount) pushFact(facts, turn, 'damage', `Player took ${e.amount} damage`);
    if (e.type === 'heal' && e.amount) pushFact(facts, turn, 'heal', `Player healed ${e.amount} HP`);
    if (e.type === 'quest-add' && e.name) {
      pushTagged(facts, { id: `quest:${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, turn, verb: 'accepted', kind: 'quest', name: e.name, text: renderTagText('accepted', 'quest', e.name), at: Date.now() });
    }
    if (e.type === 'quest-complete' && e.id) {
      let qName = e.id;
      for (let i = 0; i < stateBefore.quests.length; i++) if (stateBefore.quests[i]!.id === e.id) { qName = stateBefore.quests[i]!.name ?? e.id; break; }
      pushTagged(facts, { id: `quest:${e.id}`, turn, verb: 'done', kind: 'quest', name: qName, text: renderTagText('done', 'quest', qName), at: Date.now() });
    }
    if (e.type === 'dungeon-load' && e.dungeonName) {
      pushTagged(facts, { id: `place:${e.dungeonName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, turn, verb: 'arrived', kind: 'place', name: e.dungeonName, detail: 'dungeon', text: renderTagText('arrived', 'place', e.dungeonName, 'dungeon'), at: Date.now() });
    }
    if (e.type === 'dungeon-exit') pushFact(facts, turn, 'dungeon', 'Exited dungeon');
    if (e.type === 'dungeon-move' && e.nodeId) {
      pushTagged(facts, { id: `place:${e.nodeId}`, turn, verb: 'cleared', kind: 'place', name: e.nodeId, detail: 'room', text: renderTagText('cleared', 'place', e.nodeId, 'room'), at: Date.now() });
    }
    if (e.type === 'lore-card' && e.name) pushFact(facts, turn, 'discovery', `Lore noted: ${e.name}`);
    if (e.type === 'world-deal' && e.name) pushFact(facts, turn, 'world', `Deal sealed: ${e.name}`);
    if (e.type === 'world-holding' && e.name) pushFact(facts, turn, 'world', `Holding claimed: ${e.name}`);
    if (e.type === 'world-order' && (e.name || e.order)) pushFact(facts, turn, 'world', `Standing order: ${e.name ?? 'holding'} → ${e.order ?? 'profit'}`);
    if (e.type === 'world-clock' && e.name) pushFact(facts, turn, 'world', `Rival clock: ${e.name}`);
    if (e.type === 'world-actor' && e.name) pushFact(facts, turn, 'world', `Off-screen actor: ${e.name}`);
    if (e.type === 'time-pass' && e.amount) pushFact(facts, turn, 'world', `Time passed: ${e.amount} day${e.amount === 1 ? '' : 's'}`);
  }
  for (const name of newItemNames) {
    pushTagged(facts, { id: `item:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, turn, verb: 'gained', kind: 'item', name, text: renderTagText('gained', 'item', name), at: Date.now() });
  }
  for (const note of wardenNotes) pushFact(facts, turn, 'other', `Warden: ${note}`);
  if (sceneBeat) pushFact(facts, turn, 'scene', sceneBeat);
  return facts;
}

export function mergeTimeline(existing: TimelineFact[] | undefined, incoming: TimelineFact[]): TimelineFact[] {
  const merged = [...(existing ?? []), ...incoming];
  return merged.length <= MAX ? merged : merged.slice(merged.length - MAX);
}

export function applyCollectedFacts(state: GameState, facts: TimelineFact[]): GameState {
  let next = state;
  const legacy: TimelineFact[] = [];
  for (const f of facts) {
    if (f.verb && f.name && (f.kind === 'person' || f.kind === 'creature' || f.kind === 'item' || f.kind === 'place' || f.kind === 'exit' || f.kind === 'quest' || f.kind === 'combat' || f.kind === 'said')) {
      next = tag(next, f.verb, f.kind as TimelineTagKind, { id: f.id, name: f.name }, f.detail);
    } else legacy.push(f);
  }
  if (legacy.length) next = { ...next, timeline: mergeTimeline(next.timeline, legacy) };
  return next;
}
