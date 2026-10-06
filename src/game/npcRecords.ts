import type { GameState, NpcMemory } from './types';
import { isOutOfTalkingRange } from './hereSpot';

const SHEET_BOOKKEEPING = /^(?:Bible roster|Introduced in play|Seen in play|Knows the player as|Authored line|Speech:)/i;
const VOICE_NOTE = /^Speech:/i;

/**
 * 29z3 — what this person's info sheet says about the main character, for the writer:
 * they have met, how many times, the name they know, and how the player treated them.
 * Empty for someone the player has not met.
 */
export function sheetMemoryLine(m: NpcMemory, pcName?: string | null): string {
  if (!isMetNpc(m)) return '';
  const pc = (m.knownPlayerName || pcName || '').trim() || 'the player';
  const times = Math.max(1, m.meetCount ?? 1);
  const bits = [`${m.npcName} has met ${pc} before (${times === 1 ? 'once' : `${times} times`})`];
  if (m.knownPlayerName) bits.push(`knows them as ${m.knownPlayerName}`);
  const history = m.facts.filter((f) => !SHEET_BOOKKEEPING.test(f)).slice(-2);
  if (history.length) bits.push(`remembers: ${history.join('; ')}`);
  return `${bits.join(', ')}. They greet ${pc} as someone they know: no introducing themselves again, no asking the name again.`;
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

/** 29z3 — sheet lines for everyone here who has met the player. */
export function sheetMemoryLinesHere(state: GameState): string[] {
  return presentNpcRecords(state)
    .map((m) => sheetMemoryLine(m, state.character?.name))
    .filter(Boolean);
}

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

/** The person's record puts them at a place that is not the player's place. */
export function npcPlacedElsewhere(state: GameState, name: string): boolean {
  const m = resolveNpcRecord(state, name);
  return !!m?.location && !samePlace(m.location, state.currentLocation);
}

function companionRecords(state: GameState): NpcMemory[] {
  const names = [state.companion, ...(state.companions ?? []).map((c) => c?.name)].filter(
    (n): n is string => !!n
  );
  const out: NpcMemory[] = [];
  for (const n of names) {
    const m = resolveNpcRecord(state, n);
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

/** 27f — NPCs at the player's place: the record location decides; records not placed yet fall back to sceneFacts.present; companions always. */
export function presentNpcRecords(state: GameState): NpcMemory[] {
  const out: NpcMemory[] = [];
  const seen = new Set<string>();
  const push = (m: NpcMemory) => {
    if (seen.has(m.npcId)) return;
    seen.add(m.npcId);
    out.push(m);
  };
  for (const m of state.npcMemories ?? []) {
    if (m.location && samePlace(m.location, state.currentLocation)) push(m);
  }
  for (const m of recordsForEntries(state, state.sceneFacts?.present ?? [])) {
    if (!m.location) push(m);
  }
  for (const m of companionRecords(state)) push(m);
  return out.filter((m) => !isOutOfTalkingRange(state, m.npcName));
}

/** 27f — names of NPC records located at a place. */
export function npcNamesAt(state: GameState, place: string): string[] {
  return (state.npcMemories ?? []).filter((m) => samePlace(m.location, place)).map((m) => m.npcName);
}

/** 27f — New Game: the opening card's NPCs are where the game starts. */
export function seedOpeningCastLocations(state: GameState): GameState {
  const ids = new Set(state.openingEstablishment?.castNpcIds ?? []);
  const here = state.currentLocation;
  if (!ids.size || !here) return state;
  return {
    ...state,
    npcMemories: (state.npcMemories ?? []).map((m) =>
      ids.has(m.npcId) && !m.location ? { ...m, location: here } : m
    ),
  };
}

/** 27f — a move: companions go with the player; everyone else present stays where they were. */
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
