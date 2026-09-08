/**
 * Batch 08f — single-use ambient / inspect / stake pads per node.
 * Breaks hub/PYOA “same 3 pads forever.” Resets on location change.
 */

import type { GameState } from './types';

const AMBIENT_PAD =
  /\b(inspect|examine|look around|scout|get (?:your )?bearings|wait and watch|^wait$|study the|browse|take a stake|press for leverage|listen for the real answer|ask a direct question|smell|listen to the|check the (?:stall|fence|awning|sign|wall|floor|crate|chest)|watch the)\b/i;

const PROGRESSION_KEEP =
  /\b(travel|leave|exit|walk away|attack|flee|parley|press the attack|loot|quest|claim|talk to|ask .{0,24} about|accept the ending|turn the page|face the|walk the road|go alone|press on)\b/i;

export function isAmbientStylePad(label: string): boolean {
  const t = (label ?? '').trim();
  if (!t) return false;
  if (PROGRESSION_KEEP.test(t) && !/\b(inspect|examine|look around|wait|stake|leverage|listen for)\b/i.test(t)) {
    return false;
  }
  return AMBIENT_PAD.test(t);
}

function nodeKey(state: GameState): string {
  return String(state.currentLocation ?? 'unknown')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase() || 'unknown';
}

function padKey(label: string): string {
  return String(label ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 80);
}

export function usedAmbientPadsAtNode(state: GameState): string[] {
  const node = nodeKey(state);
  const bag = state.sceneFacts?.usedAmbientPads ?? {};
  const list = bag[node];
  return Array.isArray(list) ? list.map((x) => String(x).toLowerCase()) : [];
}

export function isAmbientPadExhausted(state: GameState, label: string): boolean {
  if (!isAmbientStylePad(label)) return false;
  const used = usedAmbientPadsAtNode(state);
  const key = padKey(label);
  return used.includes(key);
}

/** Stamp a used ambient pad at the current HERE. No-op for progression pads. */
export function recordAmbientPadUse(state: GameState, label: string): GameState {
  if (!isAmbientStylePad(label)) return state;
  const node = nodeKey(state);
  const key = padKey(label);
  if (!key) return state;
  const bag = { ...(state.sceneFacts?.usedAmbientPads ?? {}) };
  const prev = Array.isArray(bag[node]) ? [...bag[node]!] : [];
  if (prev.includes(key)) return state;
  bag[node] = [...prev, key].slice(-24);
  // Drop other nodes when HERE changes later — keep only recent 8 locations
  const keys = Object.keys(bag);
  if (keys.length > 8) {
    for (const k of keys.slice(0, keys.length - 8)) {
      if (k !== node) delete bag[k];
    }
  }
  return {
    ...state,
    sceneFacts: {
      crowd: state.sceneFacts?.crowd ?? 'unknown',
      noise: state.sceneFacts?.noise ?? 'unknown',
      present: state.sceneFacts?.present ?? [],
      props: state.sceneFacts?.props ?? [],
      lastBeat: state.sceneFacts?.lastBeat ?? '',
      updatedTurn: state.turn,
      ...state.sceneFacts,
      usedAmbientPads: bag,
    },
  };
}

/** Clear ambient exhaust for a node (travel arrival / state reset). */
export function clearAmbientPadsForNode(state: GameState, location?: string): GameState {
  const node = String(location ?? state.currentLocation ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!node || !state.sceneFacts?.usedAmbientPads?.[node]) return state;
  const bag = { ...state.sceneFacts.usedAmbientPads };
  delete bag[node];
  return {
    ...state,
    sceneFacts: {
      ...state.sceneFacts,
      usedAmbientPads: bag,
    },
  };
}
