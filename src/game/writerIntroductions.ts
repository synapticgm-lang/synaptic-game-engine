import { matchesRegisteredLocationNeedle } from './neverCast';
import { resolveNpcRecord } from './npcRecords';
import { resolvePlace } from './places';
import { isOffSetting, worldOffSettingWords } from './settingVocabulary';
import { introducedThings } from './tokenProse';
import { recordPersonSeen } from './timeline';
import type { GameState, NpcMemory } from './types';

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

export function registerWriterIntroductions(state: GameState, narrative: string): GameState {
  const things = introducedThings(narrative);
  if (!things.length) return state;
  const foreign = worldOffSettingWords(state);
  const list = [...(state.crossedOver ?? [])];
  for (const t of things) {
    const head = t.trim().slice(t.trim().lastIndexOf(' ') + 1);
    if (!head || !isOffSetting(foreign, head)) continue;
    if (!list.some((x) => x.toLowerCase() === t.toLowerCase())) list.push(t);
  }
  if (list.length === (state.crossedOver ?? []).length) return state;
  return { ...state, crossedOver: list };
}
