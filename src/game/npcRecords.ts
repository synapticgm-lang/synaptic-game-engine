import type { GameState, NpcMemory } from './types';

export function formatNpcMemoriesForPrompt(memories: NpcMemory[] | undefined, limit = 6): string {
  const list = (memories ?? []).slice(0, limit);
  if (!list.length) return '(none)';
  return list
    .map(
      (m) =>
        `${m.npcName} [${m.disposition}] — ${(m.facts.slice(-3).join('; ') || 'no notes')}${
          m.relationshipSummary ? ` | ${m.relationshipSummary}` : ''
        }`
    )
    .join('\n');
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

export function presentNpcRecords(state: GameState): NpcMemory[] {
  const out: NpcMemory[] = [];
  const seen = new Set<string>();
  const push = (m: NpcMemory | undefined) => {
    if (!m || seen.has(m.npcId)) return;
    seen.add(m.npcId);
    out.push(m);
  };
  for (const entry of state.sceneFacts?.present ?? []) {
    for (const part of splitCompoundCastEntry(entry, state)) {
      push(resolveNpcRecord(state, part));
    }
  }
  for (const c of state.companions ?? []) {
    if (c?.name) push(resolveNpcRecord(state, c.name));
  }
  return out;
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
