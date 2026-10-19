/** q48-ROLE / P-5: writer people enter presence at HERE; places refused. */
import { matchesRegisteredLocationNeedle } from './neverCast';
import { resolveNpcRecord } from './npcRecords';
import { resolvePlace } from './places';
import { recordPersonSeen } from './timeline';
import { introducedNamedPeople, introducedRolePeople, introducedThings } from './tokenProse';
import type { GameState, NpcMemory } from './types';
import { isOffSetting, worldOffSettingWords } from './settingVocabulary';

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

/** q48-ROLE — presence at HERE (+ fight2d person tag). Refuses registered places. */
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
  const tagged = recordPersonSeen(state, display, 'seen here');
  if (hit) {
    for (let i = 0; i < memories.length; i++) {
      if (memories[i]!.npcId === hit.npcId) memories[i] = { ...memories[i]!, location: place, lastSeenTurn: turn };
    }
    return { ...tagged, npcMemories: memories };
  }
  const npcId = `writer:${place.toLowerCase().replace(SLUG, '-')}:${bare.toLowerCase().replace(SLUG, '-')}`;
  const at = memories.findIndex((m) => m.npcId === npcId);
  if (at >= 0) { memories[at] = { ...memories[at]!, location: place, lastSeenTurn: turn }; return { ...tagged, npcMemories: memories }; }
  memories.push({ npcId, npcName: display, disposition: 'neutral', facts: [note ?? `Present at ${place} on turn ${turn}.`], lastSeenTurn: turn, location: place } as NpcMemory);
  return { ...tagged, npcMemories: memories };
}

export function registerWriterIntroductions(state: GameState, narrative: string): GameState {
  const known: string[] = [state.character?.name ?? '', state.currentLocation ?? ''];
  for (const m of state.npcMemories ?? []) known.push(m.npcName);
  for (const p of state.sceneFacts?.present ?? []) known.push(p);
  for (const pl of state.places ?? []) {
    if (pl.name) known.push(pl.name);
    if (pl.loreName) known.push(pl.loreName);
    for (const a of pl.aliases ?? []) known.push(a);
  }
  const named: string[] = [];
  for (const n of introducedNamedPeople(narrative, known.filter(Boolean))) {
    if (!isPresencePlaceName(state, n)) named.push(n);
  }
  const people = introducedRolePeople(narrative);
  const things = introducedThings(narrative);
  if (!people.length && !things.length && !named.length) return state;
  const place = state.currentLocation ?? 'here';
  let next = state;
  for (const role of people) next = admitPersonHere(next, `the ${role}`, `Introduced by the story at ${place} on turn ${state.turn}.`);
  for (const name of named) next = admitPersonHere(next, name, `Introduced by the story at ${place} on turn ${state.turn}.`);
  let crossedOver = next.crossedOver;
  if (things.length) {
    const foreign = worldOffSettingWords(next);
    const list = [...(crossedOver ?? [])];
    for (const t of things) {
      if (!isOffSetting(foreign, t.split(/\s+/).pop()!)) continue;
      if (!list.some((x) => x.toLowerCase() === t.toLowerCase())) list.push(t);
    }
    if (list.length !== (crossedOver ?? []).length) crossedOver = list;
  }
  let sceneFacts = next.sceneFacts;
  if (sceneFacts && things.length) {
    const props = [...sceneFacts.props];
    for (const t of things) if (!props.some((p) => p.toLowerCase() === t.toLowerCase())) props.push(t);
    sceneFacts = { ...sceneFacts, props };
  }
  return { ...next, sceneFacts, ...(crossedOver ? { crossedOver } : {}) };
}
