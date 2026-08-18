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
        `${m.npcName} [${m.disposition}] — ${(m.facts.slice(-3).join('; ') || 'no notes')}${
          m.relationshipSummary ? ` | ${m.relationshipSummary}` : ''
        }`
    )
    .join('\n');
}

const KIND_ACT =
  /\b(help|heal|spare|thank|apologiz|give|share|comfort|protect|honest|kind|offer)\b/i;
const HARD_ACT =
  /\b(threaten|refuse|insult|steal|demand|lie|attack|intimidate|shove|rob)\b/i;
const CURIOUS_ACT =
  /\b(ask|talk|speak|bargain|negotiat|listen|chat|hang out)\b/i;
const WALK_ACT =
  /\b(walk away|leave|go another|another direction|ignore)\b/i;

function treatmentLabel(action: string): 'kind' | 'hard' | 'curious' | 'walkaway' | null {
  if (HARD_ACT.test(action) && !KIND_ACT.test(action)) return 'hard';
  if (KIND_ACT.test(action)) return 'kind';
  if (WALK_ACT.test(action)) return 'walkaway';
  if (CURIOUS_ACT.test(action)) return 'curious';
  return null;
}

function findTargetNpc(memories: NpcMemory[], action: string, presentNames: string[]): NpcMemory | undefined {
  const hay = action.toLowerCase();
  const pool = memories.length
    ? memories
    : presentNames.map((name) => ({
        npcId: name.toLowerCase(),
        npcName: name,
        disposition: 'unknown' as const,
        facts: [] as string[],
        lastSeenTurn: 0,
      }));
  const named = pool.find((m) => hay.includes(m.npcName.toLowerCase()));
  if (named) return named;
  const present = presentNames[0]?.toLowerCase();
  if (present) return pool.find((m) => m.npcName.toLowerCase() === present);
  return pool[0];
}

/**
 * Pin how the player treated a named person this turn. Local disposition only — not a karma meter.
 */
export function recordNpcTreatmentFromAction(
  memories: NpcMemory[],
  playerAction: string,
  turn: number,
  presentNames: string[] = []
): NpcMemory[] {
  const treatment = treatmentLabel(playerAction);
  if (!treatment) return memories;
  const target = findTargetNpc(memories, playerAction, presentNames);
  if (!target) return memories;

  const note =
    treatment === 'kind'
      ? `Treated kindly (T${turn})`
      : treatment === 'hard'
        ? `Treated harshly / refused (T${turn})`
        : treatment === 'walkaway'
          ? `Player walked away (T${turn})`
          : `Talked / asked (T${turn})`;

  const nextDisp: NpcMemory['disposition'] =
    treatment === 'kind'
      ? target.disposition === 'hostile'
        ? 'neutral'
        : target.disposition === 'unknown'
          ? 'friendly'
          : target.disposition
      : treatment === 'hard'
        ? target.disposition === 'allied' || target.disposition === 'romanced'
          ? target.disposition
          : 'hostile'
        : target.disposition;

  const map = new Map(memories.map((m) => [normalizeName(m.npcName), { ...m, facts: [...m.facts] }]));
  const key = normalizeName(target.npcName);
  const existing = map.get(key) ?? { ...target, facts: [...target.facts] };
  if (!existing.facts.some((f) => f.startsWith(note.slice(0, 18)))) {
    existing.facts = [...existing.facts, note].slice(-MAX_FACTS_PER_NPC);
  }
  existing.disposition = nextDisp;
  existing.lastSeenTurn = turn;
  map.set(key, existing);
  return Array.from(map.values())
    .sort((a, b) => b.lastSeenTurn - a.lastSeenTurn)
    .slice(0, MAX_NPC_MEMORIES);
}
