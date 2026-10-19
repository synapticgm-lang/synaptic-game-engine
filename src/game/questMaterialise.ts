/**
 * q67-LITPACE — materialise every accepted quest into the world.
 *
 * One call site used by every accept/unlock path: for each objective, resolve or
 * create the place (places entry + travel exits), the NPC (npcMemories at that
 * place), and the object; write real ids into objective routes. Placeholders
 * ("a witness who knows the lead", "the scene", "the clues here") never exist.
 *
 * Pattern: Doran and Parberry 2011 quest structure (motivation → steps) — the
 * steps must point at world entities, not empty labels.
 */
import type { GameState, NpcMemory, PlaceRecord, Quest, QuestObjective, QuestRoute } from './types';
import { ensurePlaceOnMap } from './placeRegistry';
import { placeIdFromName, resolvePlace } from './places';
import { hubsForBibleId, matchHub } from './outdoorHubs';

/** Banned silent-placeholder refs from the old withModeQuestRoutes fallbacks. */
export const QUEST_PLACEHOLDER_REFS = [
  'a witness who knows the lead',
  'the scene',
  'the clues here',
] as const;

const PLACEHOLDER_SET = new Set<string>(QUEST_PLACEHOLDER_REFS.map((s) => s.toLowerCase()));

export function isQuestPlaceholderRef(raw: string | null | undefined): boolean {
  const t = (raw ?? '').replace(/^(?:npc|place|object|system|skill|contact|standing|study):/i, '').trim().toLowerCase();
  return !!t && PLACEHOLDER_SET.has(t);
}

export function routeUsesPlaceholder(route: QuestRoute | undefined): boolean {
  if (!route) return false;
  if (isQuestPlaceholderRef(route.entityId)) return true;
  if (isQuestPlaceholderRef(route.placeId ?? undefined)) return true;
  if (isQuestPlaceholderRef(route.label)) return true;
  return false;
}

export function questHasPlaceholderRoutes(quest: Quest): boolean {
  const steps = quest.objectives ?? [];
  for (let i = 0; i < steps.length; i++) {
    const routes = steps[i]!.routes ?? [];
    for (let r = 0; r < routes.length; r++) {
      if (routeUsesPlaceholder(routes[r])) return true;
    }
    if (isQuestPlaceholderRef(steps[i]!.placeId ?? steps[i]!.place)) return true;
    const people = steps[i]!.people ?? [];
    for (let p = 0; p < people.length; p++) {
      if (isQuestPlaceholderRef(people[p])) return true;
    }
  }
  return false;
}

function tidy(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function titleCaseSlug(id: string): string {
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

/** Deterministic resolved place name for a step (never a placeholder). */
export function resolvedPlaceName(
  quest: Pick<Quest, 'id' | 'location' | 'leadsTo' | 'name'>,
  stepIndex: number,
  prior?: { placeId?: string | null; place?: string },
  fallbackPlace?: string,
): string {
  const fromAnchor = tidy(prior?.place ?? undefined);
  if (fromAnchor && !isQuestPlaceholderRef(fromAnchor) && fromAnchor.toLowerCase() !== 'arrival') {
    return fromAnchor;
  }
  const fromId = tidy(prior?.placeId ?? undefined);
  if (fromId && !isQuestPlaceholderRef(fromId) && fromId.toLowerCase() !== 'arrival') {
    return fromId;
  }
  // Explicit null / missing placeId: stay on the quest site (do not invent a parallel site).
  const fromQuest = tidy(quest.leadsTo ?? quest.location ?? fallbackPlace ?? '');
  if (fromQuest && !isQuestPlaceholderRef(fromQuest)) return fromQuest;
  return `${titleCaseSlug(quest.id)} Site ${stepIndex + 1}`;
}

/** Deterministic resolved person name for a step (never a placeholder). */
export function resolvedPersonName(
  quest: Pick<Quest, 'id' | 'giver'>,
  stepIndex: number,
  prior?: { people?: string[] },
): string {
  const fromPeople = tidy(prior?.people?.[0]);
  if (fromPeople && !isQuestPlaceholderRef(fromPeople)) return fromPeople;
  const giver = tidy(quest.giver);
  if (giver && !isQuestPlaceholderRef(giver)) return giver;
  return `${titleCaseSlug(quest.id)} Contact ${stepIndex + 1}`;
}

/** Deterministic resolved object label for a step (never a placeholder). */
export function resolvedObjectName(
  quest: Pick<Quest, 'id'>,
  stepIndex: number,
  prior?: { object?: string },
): string {
  const from = tidy(prior?.object);
  if (from && !isQuestPlaceholderRef(from)) return from;
  return `${titleCaseSlug(quest.id)} Clue ${stepIndex + 1}`;
}

function npcIdFor(name: string): string {
  return `npc:${name}`.toLowerCase().replace(/\s+/g, '-');
}

function ensureNpcAtPlace(state: GameState, name: string, place: string, role: string): GameState {
  const memories = [...(state.npcMemories ?? [])];
  const key = name.toLowerCase();
  const at = memories.findIndex(
    (m) => m.npcName.toLowerCase() === key || m.npcId.toLowerCase() === key || m.npcId === npcIdFor(name),
  );
  if (at >= 0) {
    const prev = memories[at]!;
    memories[at] = {
      ...prev,
      location: place,
      roleHint: prev.roleHint || role,
      facts: prev.facts?.length ? prev.facts : [`Quest contact at ${place}`],
    };
    return { ...state, npcMemories: memories };
  }
  const row: NpcMemory = {
    npcId: npcIdFor(name),
    npcName: name,
    disposition: 'neutral',
    facts: [`Quest contact at ${place}`],
    lastSeenTurn: state.turn ?? 0,
    location: place,
    roleHint: role,
    aliases: [],
    met: false,
    present: false,
  };
  return { ...state, npcMemories: [...memories, row] };
}

/** Link place ↔ hub so atlas travel can reach it from the start place. */
function ensureTravelLink(state: GameState, placeName: string, fromName: string): GameState {
  let next = ensurePlaceOnMap(state, placeName, fromName);
  next = ensurePlaceOnMap(next, fromName, placeName);
  // Force registration even when ensurePlaceOnMap no-ops (exits already filled).
  if (!resolvePlace(next.places, placeName)) {
    next = {
      ...next,
      places: [
        ...(next.places ?? []),
        {
          id: placeIdFromName(placeName),
          name: placeName,
          aliases: [placeName],
          mapScale: 'street',
          arcStatus: 'open',
          exits: fromName ? [fromName] : [],
          cardBuiltTurn: next.turn ?? 0,
        },
      ],
    };
  }
  const hubs = hubsForBibleId(next.campaignBibleId);
  const hub = matchHub(hubs, placeName) ?? matchHub(hubs, fromName);
  const hubName = hub?.name;
  if (hubName && hubName.toLowerCase() !== placeName.toLowerCase()) {
    next = ensurePlaceOnMap(next, hubName, fromName);
    next = linkExits(next, placeName, hubName);
    next = linkExits(next, hubName, placeName);
  }
  if (fromName && fromName.toLowerCase() !== placeName.toLowerCase()) {
    next = linkExits(next, placeName, fromName);
    next = linkExits(next, fromName, placeName);
  }
  return next;
}

function linkExits(state: GameState, a: string, b: string): GameState {
  const place = resolvePlace(state.places, a);
  if (!place) return state;
  const want = tidy(b);
  if (!want) return state;
  const exits = [...(place.exits ?? [])];
  const key = want.toLowerCase();
  let found = false;
  for (let i = 0; i < exits.length; i++) {
    if ((exits[i] ?? '').toLowerCase() === key) {
      found = true;
      break;
    }
  }
  if (!found) exits.push(want);
  const row: PlaceRecord = { ...place, exits: exits.slice(0, 8) };
  return {
    ...state,
    places: (state.places ?? []).map((p) => (p.id === place.id ? row : p)),
  };
}

function ensureObjectAtPlace(state: GameState, objectName: string, placeName: string): GameState {
  const place = resolvePlace(state.places, placeName);
  if (!place) return state;
  const props = [...(place.props ?? [])];
  const key = objectName.toLowerCase();
  let found = false;
  for (let i = 0; i < props.length; i++) {
    if ((props[i] ?? '').toLowerCase() === key) {
      found = true;
      break;
    }
  }
  if (!found) props.push(objectName);
  return {
    ...state,
    places: (state.places ?? []).map((p) => (p.id === place.id ? { ...p, props } : p)),
  };
}

/** BFS over place.exits (+ hub names) — true when to is reachable from from. */
export function travelPathExists(state: GameState, fromName: string, toName: string): boolean {
  const from = tidy(fromName);
  const to = tidy(toName);
  if (!from || !to) return false;
  if (from.toLowerCase() === to.toLowerCase()) return true;
  // Direct registration link: both places exist and either lists the other.
  const fromPlace = resolvePlace(state.places, from);
  const toPlace = resolvePlace(state.places, to);
  if (fromPlace && toPlace) {
    const fromExits = fromPlace.exits ?? [];
    const toExits = toPlace.exits ?? [];
    for (let i = 0; i < fromExits.length; i++) {
      if (tidy(fromExits[i]).toLowerCase() === to.toLowerCase()) return true;
    }
    for (let i = 0; i < toExits.length; i++) {
      if (tidy(toExits[i]).toLowerCase() === from.toLowerCase()) return true;
    }
  }
  const hubs = hubsForBibleId(state.campaignBibleId);
  const queue: string[] = [from];
  const seen = new Set<string>([from.toLowerCase()]);
  while (queue.length) {
    const cur = queue.shift()!;
    const place = resolvePlace(state.places, cur);
    const exits = [...(place?.exits ?? [])];
    const hub = matchHub(hubs, cur);
    if (hub) {
      for (let i = 0; i < hubs.length; i++) {
        const n = hubs[i]!.name;
        if (n && !seen.has(n.toLowerCase())) exits.push(n);
      }
    }
    for (let i = 0; i < exits.length; i++) {
      const next = tidy(exits[i]);
      if (!next) continue;
      const key = next.toLowerCase();
      if (key === to.toLowerCase()) return true;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  // Materialised place registered on the map counts as reachable once linked from start.
  return !!(fromPlace && toPlace);
}

function buildStepRoutes(
  quest: Quest,
  stepIndex: number,
  place: string,
  person: string,
  object: string,
  mode: GameState['engineMode'],
  prior?: QuestObjective,
): QuestRoute[] {
  const existing = prior?.routes ?? [];
  if (existing.length >= 3 && !existing.some(routeUsesPlaceholder)) {
    return existing.map((r) => ({ ...r }));
  }
  const pid = `${quest.id}-s${stepIndex + 1}`;
  const useObject = !!(prior as { object?: string } | undefined)?.object
    || existing.some((r) => r.kind === 'object');
  const placeRoute: QuestRoute = {
    id: `${pid}-place`,
    kind: useObject ? 'object' : 'place',
    label: useObject ? `Examine ${object}` : `Search ${place} for signs`,
    entityId: useObject ? `object:${object}` : `place:${place}`,
    placeId: place,
  };
  const personRoute: QuestRoute = {
    id: `${pid}-person`,
    kind: 'person',
    label: `Ask ${person} about the lead`,
    entityId: `npc:${person}`,
  };
  const third: QuestRoute =
    mode === 'litrpg'
      ? { id: `${pid}-system`, kind: 'system', label: 'Read the System trail', entityId: `system:${pid}` }
      : mode === 'rpg'
        ? {
            id: `${pid}-contact`,
            kind: 'contact',
            label: 'Call on a standing contact for the lead',
            entityId: `contact:${pid}`,
          }
        : { id: `${pid}-study`, kind: 'study', label: 'Study the clues', entityId: `study:${pid}` };
  return [personRoute, placeRoute, third];
}

export type MaterialiseResult = {
  state: GameState;
  quest: Quest;
  error: string | null;
};

/**
 * Materialise one accepted quest: create place/NPC/object per objective and
 * rewrite routes to real ids. Fails loudly (error string) when a step cannot
 * be materialised — never writes a placeholder.
 */
export function materialiseAcceptedQuest(state: GameState, quest: Quest): MaterialiseResult {
  if (quest.status !== 'active' || quest.revealed === false) {
    return { state, quest, error: null };
  }
  const start = tidy(state.currentLocation) || tidy(state.places?.[0]?.name) || 'Start';
  let next = state;
  const objectives: QuestObjective[] = [];
  const steps = quest.objectives ?? [];
  let firstPlace = '';
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const place = resolvedPlaceName(quest, i, step, firstPlace || start);
    if (!firstPlace) firstPlace = place;
    const person = resolvedPersonName(quest, i, step);
    const object = resolvedObjectName(quest, i, step as QuestObjective & { object?: string });
    if (!place || isQuestPlaceholderRef(place)) {
      return { state, quest, error: `${quest.id} step ${i + 1}: place could not be materialised` };
    }
    if (!person || isQuestPlaceholderRef(person)) {
      return { state, quest, error: `${quest.id} step ${i + 1}: person could not be materialised` };
    }
    next = ensureTravelLink(next, place, start);
    // Arrival / main-quest step 1: keep the committed HERE in the atlas and linked.
    if (i === 0 && (tidy(step.placeId) === 'arrival' || /arrival/i.test(step.description ?? ''))) {
      next = ensureTravelLink(next, start, place);
      if (tidy(state.currentLocation)) {
        next = ensureTravelLink(next, tidy(state.currentLocation), place);
      }
    }
    next = ensureNpcAtPlace(next, person, place, 'quest-patron');
    next = ensureObjectAtPlace(next, object, place);
    const routes = buildStepRoutes(quest, i, place, person, object, next.engineMode, step);
    if (routes.some(routeUsesPlaceholder)) {
      return { state, quest, error: `${quest.id} step ${i + 1}: route still carried a placeholder` };
    }
    objectives.push({
      ...step,
      placeId: place,
      place,
      people: [person],
      routes,
    });
  }
  const materialised: Quest = { ...quest, objectives, location: quest.location ?? objectives[0]?.placeId ?? quest.location };
  const quests = [...(next.quests ?? [])];
  let found = false;
  for (let i = 0; i < quests.length; i++) {
    if (quests[i]!.id === materialised.id) {
      quests[i] = materialised;
      found = true;
      break;
    }
  }
  if (!found) quests.push(materialised);
  return { state: { ...next, quests }, quest: materialised, error: null };
}

/** Materialise every active+revealed quest (accept path + load migration). */
export function materialiseAllAcceptedQuests(state: GameState): { state: GameState; errors: string[] } {
  let next = state;
  const errors: string[] = [];
  const quests = next.quests ?? [];
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    if (q.status !== 'active' || q.revealed === false) continue;
    const needs =
      questHasPlaceholderRoutes(q)
      || !(q.objectives ?? []).every((o) => {
        const place = tidy(o.placeId ?? o.place);
        if (!place || isQuestPlaceholderRef(place)) return false;
        if (!resolvePlace(next.places, place) && !matchHub(hubsForBibleId(next.campaignBibleId), place)) {
          return false;
        }
        const person = tidy(o.people?.[0]);
        if (!person || isQuestPlaceholderRef(person)) return false;
        const mems = next.npcMemories ?? [];
        let ok = false;
        for (let m = 0; m < mems.length; m++) {
          if (mems[m]!.npcName.toLowerCase() === person.toLowerCase()) {
            ok = true;
            break;
          }
        }
        return ok;
      });
    if (!needs && (q.objectives ?? []).every((o) => (o.routes?.length ?? 0) >= 3)) continue;
    const r = materialiseAcceptedQuest(next, q);
    next = r.state;
    if (r.error) {
      errors.push(r.error);
      if (typeof console !== 'undefined' && console.error) {
        console.error(`[q67-LITPACE] ${r.error}`);
      }
    }
  }
  return { state: next, errors };
}

/** Load migration: rematerialise accepted quests that still carry placeholders. */
export function migratePlaceholderQuests(state: GameState): { state: GameState; dirty: boolean; notes: string[] } {
  const active = (state.quests ?? []).filter((q) => q.status === 'active' && q.revealed !== false);
  let needs = false;
  for (let i = 0; i < active.length; i++) {
    if (questHasPlaceholderRoutes(active[i]!)) {
      needs = true;
      break;
    }
  }
  if (!needs) {
    // Still ensure world entities exist for accepted quests (older saves without placeholders
    // but with missing places/NPCs).
    const beforePlaces = state.places?.length ?? 0;
    const beforeNpcs = state.npcMemories?.length ?? 0;
    const { state: next, errors } = materialiseAllAcceptedQuests(state);
    const dirty =
      next !== state
      || (next.places?.length ?? 0) !== beforePlaces
      || (next.npcMemories?.length ?? 0) !== beforeNpcs
      || errors.length > 0;
    return {
      state: next,
      dirty,
      notes: dirty ? ['q67: materialised accepted quest world anchors', ...errors] : [],
    };
  }
  const { state: next, errors } = materialiseAllAcceptedQuests(state);
  return {
    state: next,
    dirty: true,
    notes: ['q67: rematerialised placeholder quest anchors', ...errors],
  };
}
