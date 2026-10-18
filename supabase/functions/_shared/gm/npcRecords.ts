import type { GameState, NpcMemory } from './types.ts';
import { isOutOfTalkingRange } from './hereSpot.ts';
import { UNDERWAY_HERE, underwayHereLabel } from './locationName.ts';
import { resolvePlace } from './places.ts';
const SHEET_BOOKKEEPING = /^(?:Bible roster|Introduced in play|Seen in play|Knows the player as|Authored line|Speech:)/i;
const VOICE_NOTE = /^Speech:/i;
export function sheetMemoryLine(m: NpcMemory, pcName?: string | null): string {
  if (!isMetNpc(m)) return '';
  const pc = (m.knownPlayerName || pcName || '').trim() || 'the player';
  const times = m.meetCount ?? 0;
  const bits: string[] = [];
  if (times > 0) bits.push(`has met ${pc} before (${times === 1 ? 'once' : `${times} times`})`);
  if (m.knownPlayerName) bits.push(`knows them as ${m.knownPlayerName}`);
  const history = m.facts.filter((f) => !SHEET_BOOKKEEPING.test(f)).slice(-2);
  if (history.length) bits.push(`remembers: ${history.join('; ')}`);
  if (!bits.length) return '';
  const head = `${m.npcName} ${bits.join(', ')}.`;
  if (times > 0) return `${head} They greet ${pc} as someone they know: no introducing themselves again, no asking the name again.`;
  return m.knownPlayerName ? `${head} No asking the name again.` : head;
}
export function formatNpcMemoriesForPrompt(
  memories: NpcMemory[] | undefined,
  limit = 6,
  pcName?: string | null
): string {
  const list = (memories ?? []).slice(0, limit);
  if (!list.length) return '(none)';
  return list
    .map((m) => {
      const notes = m.facts.filter((f) => !VOICE_NOTE.test(f)).slice(-3);
      const line = `${m.npcName} [${m.disposition}] — ${(notes.join('; ') || 'no notes')}${
        m.relationshipSummary ? ` | ${m.relationshipSummary}` : ''
      }`;
      const sheet = sheetMemoryLine(m, pcName);
      return sheet ? `${line}\n  ${sheet}` : line;
    })
    .join('\n');
}
export function sheetMemoryLinesHere(state: GameState): string[] {
  return presentNpcRecords(state)
    .map((m) => sheetMemoryLine(m, state.character?.name))
    .filter(Boolean);
}
const SLUG_GAP = /[^a-z0-9]+/g;
const COMPOUND_SPLIT = /\s*(?:,|\band\b|&)\s*/i;
const LEADING_ROLE_WORD = /^(?:the|a|an|tracker|quay-master|auditor|court clerk)\s+/i;
function namesOf(m: NpcMemory): string[] {
  return [m.npcName, ...(m.aliases ?? [])].filter(Boolean);
}
function exactRecord(memories: NpcMemory[], name: string): NpcMemory | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  return memories.find((m) => namesOf(m).some((n) => n.trim().toLowerCase() === key));
}
export function resolveNpcRecord(state: GameState, name: string): NpcMemory | undefined {
  const memories = state.npcMemories ?? [];
  const t = (name ?? '').trim();
  if (!t) return undefined;
  const hit = exactRecord(memories, t);
  if (hit) return hit;
  const space = t.indexOf(' ');
  if (space <= 0) return undefined;
  const rest = t.slice(space + 1).trim();
  if (!rest) return undefined;
  const restHit = exactRecord(memories, rest);
  if (restHit) return restHit;
  return undefined;
}
export function splitCompoundCastEntry(raw: string, state?: GameState): string[] {
  return (raw ?? '')
    .split(COMPOUND_SPLIT)
    .map((p) => p.trim())
    .map((p) => {
      if (!state) return p;
      const stripped = p.replace(LEADING_ROLE_WORD, '').trim();
      if (stripped !== p && stripped && resolveNpcRecord(state, stripped)) return stripped;
      return p;
    })
    .filter(Boolean);
}
export function canonicalNpcName(state: GameState, name: string): string | undefined {
  return resolveNpcRecord(state, name)?.npcName;
}
export function npcRecordNames(state: GameState): string[] {
  return (state.npcMemories ?? []).flatMap(namesOf);
}
export function recordsForEntries(state: GameState, entries: string[]): NpcMemory[] {
  const out: NpcMemory[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const part of splitCompoundCastEntry(entry, state)) {
      const m = resolveNpcRecord(state, part);
      if (!m || seen.has(m.npcId)) continue;
      seen.add(m.npcId);
      out.push(m);
    }
  }
  return out;
}
function samePlace(a: string | undefined, b: string | undefined): boolean {
  const x = (a ?? '').trim().toLowerCase();
  const y = (b ?? '').trim().toLowerCase();
  return !!x && x === y;
}
export function npcPlacedElsewhere(state: GameState, name: string): boolean {
  const m = resolveNpcRecord(state, name);
  return !!m?.location && !samePlace(m.location, state.currentLocation);
}
function companionRecords(state: GameState): NpcMemory[] {
  const names = [state.companion, ...(state.companions ?? []).map((c) => c?.name)].filter((n): n is string => !!n);
  const out: NpcMemory[] = [];
  for (const n of names) {
    const m = resolveNpcRecord(state, n);
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}
export function presentNpcRecords(state: GameState): NpcMemory[] {
  const out: NpcMemory[] = [];
  const seen = new Set<string>();
  const push = (m: NpcMemory) => {
    if (seen.has(m.npcId)) return;
    seen.add(m.npcId);
    out.push(m);
  };
  const journey = state.journey;
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  const hereSlug = here.replace(SLUG_GAP, '-');
  const tripHere = underwayHereLabel(state).trim().toLowerCase();
  const onRoad = !!journey && journey.legsDone < journey.legsTotal && (here === UNDERWAY_HERE.toLowerCase() || (!!tripHere && here === tripHere));
  for (const m of state.npcMemories ?? []) {
    if (m.location && samePlace(m.location, state.currentLocation)) push(m);
    else if (!onRoad && !m.location && hereSlug && m.npcId.startsWith(`writer:${hereSlug}:`)) push({ ...m, location: state.currentLocation });
  }
  if (!onRoad) {
    for (const m of recordsForEntries(state, state.sceneFacts?.present ?? [])) {
      if (!m.location) push(m);
    }
    const roleLabels = [...(resolvePlace(state.places, state.currentLocation)?.sceneLedger?.present ?? []), ...(state.sceneFacts?.anonymousRoles ?? [])];
    for (let i = 0; i < roleLabels.length; i++) {
      const raw = (roleLabels[i] ?? '').replace(/\s+/g, ' ').trim();
      if (!raw || resolvePlace(state.places, raw)) continue;
      const bare = raw.replace(LEADING_ROLE_WORD, '').trim() || raw;
      const display = bare === raw && raw.charCodeAt(0) >= 97 ? `the ${raw}` : raw;
      const hit = resolveNpcRecord(state, raw) ?? resolveNpcRecord(state, display) ?? resolveNpcRecord(state, bare);
      if (hit) { push(hit.location ? hit : { ...hit, location: state.currentLocation }); continue; }
      push({ npcId: `role:${hereSlug}:${bare.toLowerCase().replace(SLUG_GAP, '-')}`.slice(0, 80), npcName: display, disposition: 'neutral', facts: [], lastSeenTurn: state.turn ?? 0, location: state.currentLocation });
    }
  }
  for (const m of companionRecords(state)) push(m);
  const enc = onRoad ? journey?.encounter : undefined;
  if (enc && !enc.engaged && !enc.escaped && !enc.lost && enc.kind !== 'signs' && enc.kind !== 'lair' && enc.kind !== 'wildlife' && enc.kind !== 'monster') {
    const party: string[] = [];
    if (enc.name) party.push(enc.name);
    const placeId = enc.camp?.placeId;
    if (placeId) {
      const places = state.places ?? [];
      for (let i = 0; i < places.length; i++) {
        if (places[i]!.id !== placeId) continue;
        const folks = places[i]!.roadCamp?.people ?? [];
        for (let k = 0; k < folks.length; k++) party.push(folks[k]!);
      }
    }
    for (let i = 0; i < party.length; i++) {
      const name = party[i]!.trim();
      if (!name) continue;
      const hit = resolveNpcRecord(state, name);
      const id = `road:${name.toLowerCase().replace(SLUG_GAP, '-').slice(0, 40)}`;
      push(hit ? { ...hit, location: state.currentLocation } : { npcId: id, npcName: name, disposition: 'neutral', facts: [], lastSeenTurn: state.turn ?? 0, location: state.currentLocation });
    }
  }
  return out.filter((m) => !m.shouldExit && !isOutOfTalkingRange(state, m.npcName));
}
export function npcNamesAt(state: GameState, place: string): string[] {
  return (state.npcMemories ?? []).filter((m) => samePlace(m.location, place)).map((m) => m.npcName);
}
export function seedOpeningCastLocations(state: GameState): GameState {
  const ids = new Set(state.openingEstablishment?.castNpcIds ?? []);
  const here = state.currentLocation;
  if (!ids.size || !here) return state;
  return { ...state, npcMemories: (state.npcMemories ?? []).map((m) => (ids.has(m.npcId) && !m.location ? { ...m, location: here } : m)) };
}
export function placeQuestGivers(state: GameState): GameState {
  let memories = state.npcMemories ?? [];
  let changed = false;
  for (const q of state.quests ?? []) {
    const giver = (q.giver ?? '').replace(/\s+/g, ' ').trim();
    const place = (q.location ?? '').trim();
    const giverWords = giver.split(/\s+/);
    const last = giverWords[giverWords.length - 1] ?? '';
    if (!q.revealed || !giver || !place || (giverWords[0] ?? '').toLowerCase() === 'the' || last.charCodeAt(0) < 65 || last.charCodeAt(0) > 90) continue;
    const hit = resolveNpcRecord({ ...state, npcMemories: memories }, giver);
    if (hit) {
      if (!hit.location) {
        memories = memories.map((m) => (m.npcId === hit.npcId ? { ...m, location: place } : m));
        changed = true;
      }
      continue;
    }
    memories = [{ npcId: `giver-${giver.toLowerCase().replace(SLUG_GAP, '-').slice(0, 32)}`, npcName: giver, disposition: 'neutral', facts: [`Quest giver: ${q.name}`], lastSeenTurn: 0, roleHint: 'quest-patron', aliases: [], met: false, present: false, location: place }, ...memories];
    changed = true;
  }
  return changed ? { ...state, npcMemories: memories } : state;
}
export function stampNpcLocationsOnMove(state: GameState, fromLocation: string, toLocation: string): GameState {
  const companions = new Set(companionRecords(state).map((m) => m.npcId));
  const hereBefore = new Set(presentNpcRecords({ ...state, currentLocation: fromLocation }).map((m) => m.npcId));
  const memories = state.npcMemories ?? [];
  const next = memories.map((m) => {
    if (companions.has(m.npcId)) return m.location === toLocation ? m : { ...m, location: toLocation };
    if (!m.location && hereBefore.has(m.npcId)) return { ...m, location: fromLocation };
    return m;
  });
  return next.every((m, i) => m === memories[i]) ? state : { ...state, npcMemories: next };
}
export function openingCastRecords(state: GameState): NpcMemory[] {
  const ids = state.openingEstablishment?.castNpcIds ?? [];
  const memories = state.npcMemories ?? [];
  return ids
    .map((id) => memories.find((m) => m.npcId === id))
    .filter((m): m is NpcMemory => !!m);
}
export function isMetNpc(m: NpcMemory): boolean {
  return m.met === true || !!m.introSpoken || (m.meetCount ?? 0) > 0;
}
export function syncNpcPresence(memories: NpcMemory[], state: GameState): NpcMemory[] {
  const here = new Set(presentNpcRecords({ ...state, npcMemories: memories }).map((m) => m.npcId));
  return memories.map((m) => ({ ...m, present: here.has(m.npcId) }));
}
