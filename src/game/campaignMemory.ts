import type {
  CampaignMemoryState,
  ConsequenceThread,
  GameState,
  MemoryPin,
  NpcMemory,
  TurnSummary,
} from './types';

const PLAYER_PIN_LIMIT = 10;
/** Soft token budget for memory middle section (~4 chars/token). */
const MEMORY_CHAR_BUDGET = 2000 * 4;

export function emptyCampaignMemory(): CampaignMemoryState {
  return {
    campaignSummary: null,
    personalitySummary: null,
    turnSummaries: [],
    pins: [],
    consequences: [],
    lastCampaignSummaryTurn: 0,
    lastTurnSummaryTurn: 0,
  };
}

export function ensureCampaignMemory(state: GameState): CampaignMemoryState {
  return state.campaignMemory ?? emptyCampaignMemory();
}

function compressLine(text: string, max = 220): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Build a cheap extractive turn summary every 15 turns. */
export function maybeAppendTurnSummary(
  memory: CampaignMemoryState,
  turn: number,
  bits: { location?: string; action?: string; outcome?: string; quest?: string }
): CampaignMemoryState {
  if (turn < 15 || turn - (memory.lastTurnSummaryTurn || 0) < 15) return memory;
  const parts = [
    bits.location ? `At ${bits.location}` : null,
    bits.action ? `acted: ${bits.action}` : null,
    bits.outcome ? bits.outcome : null,
    bits.quest ? bits.quest : null,
  ].filter(Boolean);
  const summary: TurnSummary = {
    id: `ts_${turn}`,
    turn,
    text: compressLine(parts.join(' — ') || `Turn ${turn} elapsed.`, 400),
  };
  return {
    ...memory,
    turnSummaries: [...(memory.turnSummaries ?? []), summary].slice(-40),
    lastTurnSummaryTurn: turn,
  };
}

/** Refresh campaign paragraph every 50 turns. */
export function maybeRefreshCampaignSummary(
  memory: CampaignMemoryState,
  state: GameState,
  turn: number
): CampaignMemoryState {
  if (turn < 50 || turn - (memory.lastCampaignSummaryTurn || 0) < 50) return memory;
  const quests = (state.quests ?? [])
    .filter((q) => q.revealed && q.status === 'active')
    .map((q) => q.name)
    .slice(0, 3);
  const loc = state.currentLocation || state.locationSheet?.name || 'unknown';
  const cond = state.character.conditions?.length
    ? `Conditions: ${state.character.conditions.join(', ')}.`
    : '';
  const text = compressLine(
    `${state.character.name} (L${state.character.level}) continues the Integration. Now at ${loc}.` +
      (quests.length ? ` Active: ${quests.join('; ')}.` : '') +
      ` ${cond} ${memory.personalitySummary ?? ''}`.trim(),
    600
  );
  return {
    ...memory,
    campaignSummary: text,
    lastCampaignSummaryTurn: turn,
  };
}

export function derivePersonalitySummary(state: GameState): string | null {
  const bio = state.character.bio?.trim();
  const name = state.character.name;
  if (!bio && !name) return null;
  return compressLine(
    `${name} — ${bio || 'Survivor adapting to the System.'} Prefers grounded local action over Guide Book teleporting.`,
    220
  );
}

export function upsertNpcRelationshipSummary(
  npcMemories: NpcMemory[] | undefined,
  turn: number
): NpcMemory[] {
  return (npcMemories ?? []).map((n) => {
    if (n.relationshipSummary && (n.lastSeenTurn ?? 0) > turn - 30) return n;
    const fact = n.facts?.[0];
    const summary = compressLine(
      `${n.npcName}: ${n.disposition}${fact ? ` — ${fact}` : ''}`,
      160
    );
    return { ...n, relationshipSummary: summary };
  });
}

export function autoPin(
  memory: CampaignMemoryState,
  pin: Omit<MemoryPin, 'id' | 'kind'> & { kind?: MemoryPin['kind'] }
): CampaignMemoryState {
  const id = `apin_${pin.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}_${pin.createdTurn}`;
  if (memory.pins.some((p) => p.id === id || (p.label === pin.label && p.kind === 'auto'))) {
    return memory;
  }
  const next: MemoryPin = {
    id,
    kind: pin.kind ?? 'auto',
    label: pin.label,
    text: compressLine(pin.text, 240),
    createdTurn: pin.createdTurn,
    archived: false,
  };
  return { ...memory, pins: [...memory.pins, next].slice(-80) };
}

export function addPlayerPin(
  memory: CampaignMemoryState,
  label: string,
  text: string,
  turn: number
): CampaignMemoryState {
  const active = memory.pins.filter((p) => p.kind === 'player' && !p.archived);
  let pins = [...memory.pins];
  if (active.length >= PLAYER_PIN_LIMIT) {
    const oldest = active.sort((a, b) => a.createdTurn - b.createdTurn)[0];
    if (oldest) {
      pins = pins.map((p) => (p.id === oldest.id ? { ...p, archived: true } : p));
    }
  }
  pins.push({
    id: `ppin_${crypto.randomUUID().slice(0, 8)}`,
    kind: 'player',
    label: label.slice(0, 64),
    text: compressLine(text, 240),
    createdTurn: turn,
    archived: false,
  });
  return { ...memory, pins };
}

export function addConsequence(
  memory: CampaignMemoryState,
  text: string,
  turn: number
): CampaignMemoryState {
  const thread: ConsequenceThread = {
    id: `cq_${turn}_${crypto.randomUUID().slice(0, 6)}`,
    text: compressLine(text, 200),
    createdTurn: turn,
    unresolved: true,
  };
  return {
    ...memory,
    consequences: [...(memory.consequences ?? []), thread].filter((c) => c.unresolved).slice(-20),
  };
}

/** Keyword retrieve of turn summaries + pins (no embedding vendor yet). */
export function retrieveMemorySnippets(
  memory: CampaignMemoryState,
  query: string,
  limit = 4
): string[] {
  const q = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (!q.length) {
    return (memory.turnSummaries ?? [])
      .slice(-3)
      .map((t) => `T${t.turn}: ${t.text}`);
  }
  const scored: Array<{ score: number; line: string }> = [];
  for (const t of memory.turnSummaries ?? []) {
    const hay = t.text.toLowerCase();
    const score = q.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score) scored.push({ score, line: `T${t.turn}: ${t.text}` });
  }
  for (const p of memory.pins.filter((x) => !x.archived)) {
    const hay = `${p.label} ${p.text}`.toLowerCase();
    const score = q.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score) scored.push({ score, line: `Pin[${p.kind}]: ${p.label} — ${p.text}` });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.line);
}

/**
 * Ordered ~2k context memory block (Pack 6 primacy/recency).
 * Caller still prepends system rules separately.
 */
export function formatCampaignMemoryForPrompt(
  state: GameState,
  situationBlock: string,
  queryForRetrieve: string
): string {
  const memory = ensureCampaignMemory(state);
  const personality =
    memory.personalitySummary || derivePersonalitySummary(state) || `${state.character.name}`;
  const campaign = memory.campaignSummary || '(Campaign summary pending — early run.)';
  const pins = memory.pins
    .filter((p) => !p.archived && (p.kind === 'player' || p.kind === 'auto'))
    .slice(-8)
    .map((p) => `- ${p.label}: ${p.text}`)
    .join('\n');
  const consequences = (memory.consequences ?? [])
    .filter((c) => c.unresolved)
    .slice(0, 5)
    .map((c) => `- ${c.text}`)
    .join('\n');
  const retrieved = retrieveMemorySnippets(memory, queryForRetrieve, 4).join('\n');

  const npcLines = (state.npcMemories ?? [])
    .filter((n) => n.relationshipSummary)
    .slice(0, 5)
    .map((n) => `- ${n.relationshipSummary}`)
    .join('\n');

  let body = `=== CAMPAIGN SUMMARY (ALWAYS) ===
${campaign}
=== PC PERSONALITY ===
${personality}
=== SITUATION (CURRENT + PREVIOUS) ===
${situationBlock}
=== ACTIVE CONDITIONS ===
${state.character.conditions?.length ? state.character.conditions.join(', ') : 'none'}
=== RETRIEVED MEMORY (MIDDLE — KEEP TIGHT) ===
${retrieved || '(none)'}
=== PLAYER / AUTO PINS ===
${pins || '(none)'}
=== UNRESOLVED CONSEQUENCES ===
${consequences || '(none)'}
=== NPC RELATIONSHIP SUMMARIES ===
${npcLines || '(none)'}
`;

  // Prune order if over budget: retrieved → pins → npc → previous already inside situation
  if (body.length > MEMORY_CHAR_BUDGET) {
    body = body
      .replace(/=== RETRIEVED MEMORY[\s\S]*?(?==== )/m, '=== RETRIEVED MEMORY ===\n(pruned)\n')
      .replace(/=== PLAYER \/ AUTO PINS[\s\S]*?(?==== )/m, '=== PLAYER / AUTO PINS ===\n(pruned)\n');
  }
  if (body.length > MEMORY_CHAR_BUDGET) {
    body = body.replace(
      /=== NPC RELATIONSHIP SUMMARIES[\s\S]*$/m,
      '=== NPC RELATIONSHIP SUMMARIES ===\n(pruned)\n'
    );
  }

  return body.trim();
}

/** End-of-turn memory maintenance. */
export function advanceCampaignMemory(
  state: GameState,
  turn: number,
  opts: {
    playerAction: string;
    narrative: string;
    gainedLootRarity?: string | null;
    questNote?: string | null;
    significantChoice?: boolean;
  }
): CampaignMemoryState {
  let memory = ensureCampaignMemory(state);
  memory = {
    ...memory,
    personalitySummary: memory.personalitySummary || derivePersonalitySummary(state),
  };
  memory = maybeAppendTurnSummary(memory, turn, {
    location: state.currentLocation,
    action: opts.playerAction.slice(0, 80),
    outcome: opts.narrative.slice(0, 120),
    quest: opts.questNote ?? undefined,
  });
  memory = maybeRefreshCampaignSummary(memory, state, turn);

  if (opts.gainedLootRarity && /uncommon|rare|epic|legendary/i.test(opts.gainedLootRarity)) {
    memory = autoPin(memory, {
      label: `Loot ${opts.gainedLootRarity}`,
      text: `Acquired ${opts.gainedLootRarity} gear around turn ${turn} at ${state.currentLocation ?? 'site'}.`,
      createdTurn: turn,
    });
  }
  if (opts.questNote) {
    memory = autoPin(memory, {
      label: 'Quest beat',
      text: opts.questNote,
      createdTurn: turn,
    });
  }
  if (opts.significantChoice) {
    memory = addConsequence(
      memory,
      `Choice at T${turn}: ${opts.playerAction.slice(0, 100)}`,
      turn
    );
  }
  if (state.character.conditions?.length) {
    memory = autoPin(memory, {
      label: 'Conditions',
      text: state.character.conditions.join(', '),
      createdTurn: turn,
    });
  }
  return memory;
}
