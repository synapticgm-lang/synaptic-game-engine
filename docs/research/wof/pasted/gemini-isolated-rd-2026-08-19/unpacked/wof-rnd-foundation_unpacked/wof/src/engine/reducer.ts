import type {
  Character,
  ChronicleEntry,
  EventId,
  FactionRelation,
  Oath,
  ReplayResult,
  Route,
  StoryThread,
  WorldEvent,
  WorldState,
} from "../models.js";

export class WofInvariantError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "WofInvariantError";
  }
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function toChronicleEntry(event: WorldEvent, turn: number): ChronicleEntry {
  return {
    id: event.id,
    turn,
    kind: event.kind,
    summary: event.summary,
    causedBy: event.causedBy,
    payload: event.payload as Record<string, unknown>,
  };
}

function replaceCharacter(state: WorldState, character: Character): WorldState {
  return { ...state, characters: { ...state.characters, [character.id]: character } };
}

function replaceOath(state: WorldState, oath: Oath): WorldState {
  return { ...state, oaths: { ...state.oaths, [oath.id]: oath } };
}

function replaceRoute(state: WorldState, route: Route): WorldState {
  return { ...state, routes: { ...state.routes, [route.id]: route } };
}

function replaceThread(state: WorldState, thread: StoryThread): WorldState {
  return { ...state, threads: { ...state.threads, [thread.id]: thread } };
}

function replaceRelation(state: WorldState, relation: FactionRelation): WorldState {
  return { ...state, factionRelations: { ...state.factionRelations, [relation.factionId]: relation } };
}

/** Applies one local world event. It never performs I/O or reaches an external namespace. */
export function applyEvent(state: WorldState, event: WorldEvent): WorldState {
  if (state.chronicle.some((entry) => entry.id === event.id)) {
    throw new WofInvariantError(`Duplicate chronicle event: ${event.id}`);
  }

  let next = state;

  switch (event.kind) {
    case "tidelock-advanced": {
      next = {
        ...state,
        tidelock: {
          turn: state.tidelock.turn + 1,
          phase: event.payload.phase,
          intensity: event.payload.intensity,
          season: event.payload.season ?? state.tidelock.season,
        },
      };
      break;
    }
    case "route-discovered": {
      const route = event.payload.route;
      if (!state.regions[route.fromRegionId] || !state.regions[route.toRegionId]) {
        throw new WofInvariantError(`Route ${route.id} points outside the local world map.`);
      }
      next = replaceRoute(state, route);
      break;
    }
    case "route-sealed": {
      const route = state.routes[event.payload.routeId];
      if (!route) throw new WofInvariantError(`Unknown route: ${event.payload.routeId}`);
      next = replaceRoute(state, { ...route, state: "sealed" });
      break;
    }
    case "faction-accord-changed": {
      const relation = state.factionRelations[event.payload.factionId];
      if (!relation) throw new WofInvariantError(`Unknown faction relation: ${event.payload.factionId}`);
      next = replaceRelation(state, {
        ...relation,
        disposition: event.payload.disposition,
        esteem: clamp(relation.esteem + event.payload.esteemDelta, -10, 10),
        debt: clamp(relation.debt + event.payload.debtDelta, -10, 10),
        lastChangedAt: state.tidelock.turn,
      });
      break;
    }
    case "memory-forged": {
      const character = state.characters[event.payload.characterId];
      if (!character) throw new WofInvariantError(`Unknown memory bearer: ${event.payload.characterId}`);
      if (character.memories.some((memory) => memory.id === event.payload.memory.id)) {
        throw new WofInvariantError(`Duplicate memory: ${event.payload.memory.id}`);
      }
      next = replaceCharacter(state, { ...character, memories: [...character.memories, event.payload.memory] });
      break;
    }
    case "oath-sworn": {
      const oath = event.payload.oath;
      const bearer = state.characters[oath.bearerId];
      if (!bearer) throw new WofInvariantError(`Unknown oath bearer: ${oath.bearerId}`);
      if (state.oaths[oath.id]) throw new WofInvariantError(`Duplicate oath: ${oath.id}`);
      next = replaceCharacter(replaceOath(state, oath), { ...bearer, oathIds: [...bearer.oathIds, oath.id] });
      break;
    }
    case "oath-fulfilled":
    case "oath-broken": {
      const oath = state.oaths[event.payload.oathId];
      if (!oath) throw new WofInvariantError(`Unknown oath: ${event.payload.oathId}`);
      if (oath.state !== "open") throw new WofInvariantError(`Oath is already closed: ${event.payload.oathId}`);
      next = replaceOath(state, { ...oath, state: event.kind === "oath-fulfilled" ? "kept" : "forfeit" });
      break;
    }
    case "thread-advanced": {
      const thread = state.threads[event.payload.threadId];
      if (!thread) throw new WofInvariantError(`Unknown story thread: ${event.payload.threadId}`);
      const stage = event.payload.advanceStage ? Math.min(thread.maxStage, thread.stage + 1) : thread.stage;
      next = replaceThread(state, {
        ...thread,
        pressure: clamp(thread.pressure + event.payload.pressureDelta, 0, 10),
        stage,
        status: stage >= thread.maxStage ? "resolved" : "active",
      });
      break;
    }
    case "supply-changed": {
      next = { ...state, ledger: { ...state.ledger, supplies: state.ledger.supplies + event.payload.delta } };
      break;
    }
    case "expedition-returned": {
      next = {
        ...state,
        ledger: {
          ...state.ledger,
          discoveries: [...state.ledger.discoveries, ...event.payload.discoveries],
        },
      };
      break;
    }
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }

  const withEntry = { ...next, chronicle: [...next.chronicle, toChronicleEntry(event, next.tidelock.turn)] };
  assertWorldInvariants(withEntry);
  return withEntry;
}

/** Rejects contradictions that would damage a replayable research fixture. */
export function assertWorldInvariants(state: WorldState): void {
  if (state.ledger.supplies < 0) throw new WofInvariantError("Supplies cannot fall below zero.");
  if (state.tidelock.turn < 0) throw new WofInvariantError("Tidelock turn cannot be negative.");

  for (const character of Object.values(state.characters)) {
    if (character.wounds < 0 || character.focus < 0) {
      throw new WofInvariantError(`Character vitality cannot be negative: ${character.id}`);
    }
    for (const oathId of character.oathIds) {
      const oath = state.oaths[oathId];
      if (!oath || oath.bearerId !== character.id) {
        throw new WofInvariantError(`Character oath reference is inconsistent: ${character.id}`);
      }
    }
  }

  for (const oath of Object.values(state.oaths)) {
    if (!state.characters[oath.bearerId]) throw new WofInvariantError(`Oath points to unknown bearer: ${oath.id}`);
  }

  for (const route of Object.values(state.routes)) {
    if (!state.regions[route.fromRegionId] || !state.regions[route.toRegionId]) {
      throw new WofInvariantError(`Route points to unknown region: ${route.id}`);
    }
  }

  const eventIds = new Set<EventId>();
  for (const entry of state.chronicle) {
    if (eventIds.has(entry.id)) throw new WofInvariantError(`Chronicle contains duplicate event: ${entry.id}`);
    eventIds.add(entry.id);
  }
}

export function replay(initialState: WorldState, events: readonly WorldEvent[]): ReplayResult {
  let state = initialState;
  const appliedEventIds: EventId[] = [];
  const warnings: string[] = [];

  for (const event of events) {
    state = applyEvent(state, event);
    appliedEventIds.push(event.id);
  }

  for (const oath of Object.values(state.oaths)) {
    if (oath.state === "open" && oath.dueByTurn !== null && oath.dueByTurn < state.tidelock.turn) {
      warnings.push(`Overdue oath remains open: ${oath.id}`);
    }
  }

  return { finalState: state, appliedEventIds, warnings };
}
