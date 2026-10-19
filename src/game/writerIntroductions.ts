import { matchesRegisteredLocationNeedle } from './neverCast';
import { resolveNpcRecord } from './npcRecords';
import { resolvePlace } from './places';
import { premiseOrigin } from './settingVocabulary';
import { recordPersonSeen } from './timeline';
import type { GameState, Item, NpcMemory } from './types';

const SLUG = /[^a-z0-9]+/g;
const ARTICLE = /^(?:the|a|an)\s+/i;

/** Registered place / HERE — never a person (q46-PAP / q48-ROLE). */
export function isPresencePlaceName(state: GameState, name: string): boolean {
  const t = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  const bare = t.replace(ARTICLE, '').trim();
  const here = (state.currentLocation ?? '').trim();
  if (t.toLowerCase() === here.toLowerCase() || bare.toLowerCase() === here.replace(ARTICLE, '').trim().toLowerCase()) return true;
  if (resolvePlace(state.places, t) || resolvePlace(state.places, bare)) return true;
  const b = state.campaignBibleId;
  return matchesRegisteredLocationNeedle(t, b) || matchesRegisteredLocationNeedle(bare, b);
}

/** q48-ROLE — presence at HERE (+ fight2d person tag). Refuses registered places. Engine-only. */
export function admitPersonHere(state: GameState, name: string, note?: string): GameState {
  const raw = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || isPresencePlaceName(state, raw)) return state;
  const place = (state.currentLocation ?? '').trim();
  if (!place) return state;
  const bare = raw.replace(ARTICLE, '').trim();
  const display = ARTICLE.test(raw) || (raw.charCodeAt(0) >= 65 && raw.charCodeAt(0) <= 90) ? raw : `the ${raw}`;
  const hit = resolveNpcRecord(state, raw) ?? resolveNpcRecord(state, display) ?? resolveNpcRecord(state, bare);
  const memories = [...(state.npcMemories ?? [])];
  const turn = state.turn ?? 0;
  const tagged = recordPersonSeen(state, display, note ?? 'seen here');
  if (hit) {
    for (let i = 0; i < memories.length; i++) {
      if (memories[i]!.npcId === hit.npcId) memories[i] = { ...memories[i]!, location: place, lastSeenTurn: turn };
    }
    return { ...tagged, npcMemories: memories };
  }
  const npcId = `writer:${place.toLowerCase().replace(SLUG, '-')}:${bare.toLowerCase().replace(SLUG, '-')}`;
  const at = memories.findIndex((m) => m.npcId === npcId);
  if (at >= 0) {
    memories[at] = { ...memories[at]!, location: place, lastSeenTurn: turn };
    return { ...tagged, npcMemories: memories };
  }
  memories.push({
    npcId,
    npcName: display,
    disposition: 'neutral',
    facts: [note ?? `Present at ${place} on turn ${turn}.`],
    lastSeenTurn: turn,
    location: place,
  } as NpcMemory);
  return { ...tagged, npcMemories: memories };
}

/** Prose admits nothing. Origin is an engine tag written at creation (`stampCrossedOrigin`). */
export function registerWriterIntroductions(state: GameState, _narrative: string): GameState {
  return state;
}

/** Item provenance + entity record: `crossed over from <origin>`. Not read from prose. */
export function stampCrossedOrigin(state: GameState, itemName: string, origin: string): GameState {
  const who = (itemName ?? '').replace(/\s+/g, ' ').trim();
  const from = (origin ?? '').replace(/\s+/g, ' ').trim();
  if (!who || !from) return state;
  const provenance = `crossed over from ${from}`;
  const inventory = [...(state.inventory ?? [])];
  const at = inventory.findIndex((i) => (i.name ?? '').toLowerCase() === who.toLowerCase());
  if (at >= 0) inventory[at] = { ...inventory[at]!, provenance };
  else {
    inventory.push({
      id: `crossed-${who.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: who,
      provenance,
      rarity: 'Common',
      quantity: 1,
    } as Item);
  }
  const id = `item:${who.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const turn = state.turn ?? 0;
  const place = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const prev = state.entityRecords?.[id];
  const notes = [...(prev?.notes ?? [])];
  if (!notes.some((n) => n.toLowerCase() === provenance.toLowerCase())) notes.push(provenance);
  return {
    ...state,
    inventory,
    entityRecords: {
      ...(state.entityRecords ?? {}),
      [id]: {
        kind: 'item',
        name: who,
        firstTurn: prev?.firstTurn ?? turn,
        lastTurn: turn,
        ...(place ? { place } : {}),
        notes,
      },
    },
  };
}

/** Character creation: every starting item carries the premise origin, when the premise has one. */
export function stampPremiseOrigin(state: GameState): GameState {
  const origin = premiseOrigin(state);
  if (!origin) return state;
  let next = state;
  for (const item of next.inventory ?? []) {
    if (/^crossed over from /i.test(item.provenance ?? '')) continue;
    next = stampCrossedOrigin(next, item.name, origin);
  }
  return next;
}
