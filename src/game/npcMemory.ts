import type { GameState, NpcMemory, TimelineFact } from './types';
import type { GameEvent } from './parser';

const MAX_FACTS_PER_NPC = 10;
const MAX_NPC_MEMORIES = 40;

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Upsert per-NPC memory from lore cards / timeline so knowledge doesn't bleed across NPCs.
 */
export function mergeNpcMemoriesFromTurn(
  state: GameState,
  events: GameEvent[],
  timelineFacts: TimelineFact[],
  turn: number
): NpcMemory[] {
  const map = new Map<string, NpcMemory>();
  for (const m of state.npcMemories ?? []) {
    map.set(normalizeName(m.npcName), { ...m, facts: [...m.facts] });
  }

  for (const e of events) {
    if (e.type === 'lore-card' && e.cardType === 'npc' && e.name) {
      const key = normalizeName(e.name);
      const existing = map.get(key) ?? {
        npcId: e.id || key,
        npcName: e.name,
        disposition: 'unknown' as const,
        facts: [] as string[],
        lastSeenTurn: turn,
      };
      const summary = (e.summary ?? '').trim();
      if (summary && !existing.facts.includes(summary.slice(0, 160))) {
        existing.facts = [...existing.facts, summary.slice(0, 160)].slice(-MAX_FACTS_PER_NPC);
      }
      const disp = summary.match(/disposition:\s*(hostile|neutral|friendly|allied|romanced|ambiguous)/i)?.[1];
      if (disp) {
        const d = disp.toLowerCase();
        existing.disposition =
          d === 'ambiguous' ? 'unknown' : (d as NpcMemory['disposition']);
      }
      existing.lastSeenTurn = turn;
      map.set(key, existing);
    }
  }

  for (const fact of timelineFacts) {
    if (fact.kind !== 'npc' && !/\b(met|spoke|told|asked)\b/i.test(fact.text)) continue;
    const nameMatch = fact.text.match(/(?:met|spoke with|told|asked)\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const key = normalizeName(name);
    const existing = map.get(key) ?? {
      npcId: key,
      npcName: name,
      disposition: 'unknown' as const,
      facts: [] as string[],
      lastSeenTurn: turn,
    };
    if (!existing.facts.includes(fact.text)) {
      existing.facts = [...existing.facts, fact.text].slice(-MAX_FACTS_PER_NPC);
    }
    existing.lastSeenTurn = turn;
    map.set(key, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.lastSeenTurn - a.lastSeenTurn)
    .slice(0, MAX_NPC_MEMORIES);
}

export function formatNpcMemoriesForPrompt(memories: NpcMemory[] | undefined, limit = 6): string {
  const list = (memories ?? []).slice(0, limit);
  if (!list.length) return '(none)';
  return list
    .map(
      (m) =>
        `${m.npcName} [${m.disposition}] — ${(m.facts.slice(-3).join('; ') || 'no notes')}`
    )
    .join('\n');
}
