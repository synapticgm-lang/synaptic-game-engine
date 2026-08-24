import type {
  CampaignMemoryState,
  ChapterSummary,
  ArcSummary,
  ConsequenceThread,
  GameState,
  MemoryPin,
  NpcMemory,
  TurnSummary,
} from './types';
import { isOfferOnlyUnansweredBeat } from './offerOnlyAsk';

const PLAYER_PIN_LIMIT = 10;
/** Soft token budget for memory middle section (~4 chars/token). */
const MEMORY_CHAR_BUDGET = 2000 * 4;
/** Dynamic budget when larger context available. */
const MEMORY_CHAR_BUDGET_EXTENDED = 8000 * 4;

/** Pack 11: micro summaries every ~5 turns (was 15). */
const MICRO_SUMMARY_EVERY = 5;
/** Pack 11: campaign paragraph every ~50 turns. */
const CAMPAIGN_SUMMARY_EVERY = 50;
/** Chapter summaries every 20 turns (Pack 12). */
const CHAPTER_SUMMARY_EVERY = 20;

export function emptyCampaignMemory(): CampaignMemoryState {
  return {
    campaignSummary: null,
    personalitySummary: null,
    turnSummaries: [],
    chapterSummaries: [],
    arcSummaries: [],
    pins: [],
    consequences: [],
    lastCampaignSummaryTurn: 0,
    lastTurnSummaryTurn: 0,
    lastChapterSummaryTurn: 0,
  };
}

export function ensureCampaignMemory(state: GameState): CampaignMemoryState {
  return state.campaignMemory ?? emptyCampaignMemory();
}

function compressLine(text: string, max = 220): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Lossless fact extract BEFORE compression — keep named NPCs, places, promises,
 * and loot beats as auto-pins so later summaries don't erase them.
 */
export function extractLosslessFacts(
  memory: CampaignMemoryState,
  state: GameState,
  turn: number,
  narrative: string,
  playerAction: string
): CampaignMemoryState {
  let next = memory;
  const blob = `${playerAction}\n${narrative}`;

  // Named NPCs already on sheet — reinforce last-seen fact
  for (const npc of state.npcMemories ?? []) {
    if (!npc.npcName?.trim()) continue;
    if (new RegExp(`\\b${escapeReg(npc.npcName)}\\b`, 'i').test(blob)) {
      next = autoPin(next, {
        label: `NPC ${npc.npcName}`,
        text: `${npc.npcName} present at T${turn} (${state.currentLocation ?? 'site'}). ${npc.disposition ?? ''}`.trim(),
        createdTurn: turn,
      });
    }
  }

  // Active revealed quests mentioned
  for (const q of state.quests ?? []) {
    if (!q.revealed || q.status !== 'active' || !q.name) continue;
    if (new RegExp(`\\b${escapeReg(q.name)}\\b`, 'i').test(blob)) {
      next = autoPin(next, {
        label: `Quest ${q.name}`,
        text: `Quest "${q.name}" referenced at T${turn}.`,
        createdTurn: turn,
      });
    }
  }

  // Location sheet interactables that appear in prose
  for (const it of state.locationSheet?.interactables ?? []) {
    if (!it.name || it.name.length < 3) continue;
    if (new RegExp(`\\b${escapeReg(it.name)}\\b`, 'i').test(narrative)) {
      next = autoPin(next, {
        label: `Scene ${it.name}`,
        text: `${it.name} observed at ${state.currentLocation ?? 'site'} (T${turn}).`,
        createdTurn: turn,
      });
    }
  }

  // Promise / threat language → consequence threads
  next = extractPromisesFromProse(next, narrative, turn);
  next = extractSilencedSpeechFromProse(next, narrative, turn);
  next = pinOpenPlayerAsk(next, playerAction, turn);
  return next;
}

/** Pin clarifying questions so the next beat must answer them. */
export function pinOpenPlayerAsk(
  memory: CampaignMemoryState,
  playerAction: string,
  turn: number
): CampaignMemoryState {
  const action = playerAction.replace(/\s+/g, ' ').trim();
  if (action.length < 12) return memory;
  const looksAsk =
    /\?/.test(action)
    || /\b(what|how|why|where|who|when|can i|could i|would you|tell me|explain|details|if i (?:agree|refuse|don'?t)|prove|worth)\b/i.test(
      action
    );
  if (!looksAsk) return memory;
  // Skip pure commands that happen to include "how"
  if (/^(?:go|run|attack|strike|loot|move|flee|rest)\b/i.test(action) && !/\?/.test(action)) {
    return memory;
  }
  const text = compressLine(`Open ask (T${turn}): ${action}`, 160);
  const key = text.toLowerCase().slice(0, 60);
  const seen = new Set((memory.consequences ?? []).map((c) => c.text.toLowerCase().slice(0, 60)));
  if (seen.has(key)) return memory;
  // Dedupe near-identical asks (player resend)
  const stem = action.toLowerCase().replace(/[^a-z0-9\s]/g, '').slice(0, 40);
  if (
    (memory.consequences ?? []).some(
      (c) => c.unresolved && c.text.toLowerCase().includes(stem) && /open ask/i.test(c.text)
    )
  ) {
    return memory;
  }
  return addConsequence(memory, text, turn);
}

const PROMISE_PATTERNS: RegExp[] = [
  /\b(?:i(?:'| a)?ll|we(?:'| wi)?ll|they(?:'| wi)?ll)\s+([^.!?\n]{8,100})/gi,
  /\b(?:promise[sd]?|owe[sd]?|warn(?:ed|s)?|threaten(?:ed|s)?|debt|deadline|until|before)\b[^.!?\n]{8,120}/gi,
  /\b(?:come back|return|meet(?: me)?|find you|pay you back|make you pay)\b[^.!?\n]{0,80}/gi,
];

export function extractPromisesFromProse(
  memory: CampaignMemoryState,
  narrative: string,
  turn: number
): CampaignMemoryState {
  let next = memory;
  const seen = new Set(
    (memory.consequences ?? []).map((c) => c.text.toLowerCase().slice(0, 60))
  );
  for (const re of PROMISE_PATTERNS) {
    const local = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = local.exec(narrative)) !== null) {
      const text = compressLine(m[0], 160);
      const key = text.toLowerCase().slice(0, 60);
      if (seen.has(key) || text.length < 12) continue;
      seen.add(key);
      next = addConsequence(next, `Open thread (T${turn}): ${text}`, turn);
      if ((next.consequences ?? []).filter((c) => c.unresolved).length >= 12) return next;
    }
  }
  return next;
}

const SILENCE_PATTERNS: RegExp[] = [
  /\b(?:began|started|opens?|opened)\s+(?:to\s+)?(?:speak|say|talk)[^.!?\n]{0,90}(?:cut(?:\s+off)?|silenced|shut\s+down|stopped|interrupted|gesture[ds]?|hand\s+(?:up|raised))\b[^.!?\n]{0,40}/gi,
  /\b(?:cut(?:s|ting)?\s+(?:him|her|them|the\s+\w+)\s+off|silenced|gesture[ds]?\s+for\s+silence|a\s+hand\s+(?:rose|lifted|cut))\b[^.!?\n]{0,80}/gi,
];

/** Someone began to speak and was shut down — keep the thread on the ledger. */
export function extractSilencedSpeechFromProse(
  memory: CampaignMemoryState,
  narrative: string,
  turn: number
): CampaignMemoryState {
  let next = memory;
  const seen = new Set(
    (memory.consequences ?? []).map((c) => c.text.toLowerCase().slice(0, 60))
  );
  for (const re of SILENCE_PATTERNS) {
    const local = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = local.exec(narrative)) !== null) {
      const text = compressLine(
        `Spoken interruption (T${turn}): ${m[0]} — return to this thread.`,
        180
      );
      const key = text.toLowerCase().slice(0, 60);
      if (seen.has(key) || text.length < 20) continue;
      seen.add(key);
      next = addConsequence(next, text, turn);
      if ((next.consequences ?? []).filter((c) => c.unresolved).length >= 12) return next;
    }
  }
  return next;
}

/** Mark consequences resolved when quests complete or keywords match narrative. */
export function resolveConsequences(
  memory: CampaignMemoryState,
  state: GameState,
  narrative: string
): CampaignMemoryState {
  const completedQuestNames = (state.quests ?? [])
    .filter((q) => q.status === 'completed' || q.status === 'failed')
    .map((q) => q.name.toLowerCase());
  const hay = narrative.toLowerCase();

  return {
    ...memory,
    consequences: (memory.consequences ?? []).map((c) => {
      if (!c.unresolved) return c;
      const t = c.text.toLowerCase();
      if (completedQuestNames.some((n) => n.length >= 4 && t.includes(n))) {
        return { ...c, unresolved: false };
      }
      if (
        /\b(resolved|settled|paid|forgave|done|over)\b/i.test(hay) &&
        t.split(/\W+/).filter((w) => w.length > 4).some((w) => hay.includes(w))
      ) {
        return { ...c, unresolved: false };
      }
      // Open ask answered when several content words from the ask appear in the reply.
      // "You could inquire about X" is not an answer — keep the pin live.
      if (/^open ask\b/i.test(c.text) && isOfferOnlyUnansweredBeat(narrative)) {
        return c;
      }
      if (/^open ask\b/i.test(c.text)) {
        const askBody = c.text.replace(/^open ask\s*\(t\d+\):\s*/i, '');
        const words = askBody
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 3)
          .filter(
            (w) =>
              !/^(with|from|that|this|have|what|when|where|which|would|could|should|please|more|some|give|tell|does|dont|might|before|after|than|them|they|will|just|only|also|been|were|very|into|your|their|about)$/.test(
                w
              )
          );
        const hits = words.filter((w) => hay.includes(w)).length;
        if (hits >= Math.min(2, Math.max(1, words.length)) && hay.length > 80) {
          return { ...c, unresolved: false };
        }
      }
      return c;
    }),
  };
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a cheap extractive turn summary on Pack 11 micro schedule. */
export function maybeAppendTurnSummary(
  memory: CampaignMemoryState,
  turn: number,
  bits: { location?: string; action?: string; outcome?: string; quest?: string },
  force = false
): CampaignMemoryState {
  const due =
    force ||
    (turn >= MICRO_SUMMARY_EVERY && turn - (memory.lastTurnSummaryTurn || 0) >= MICRO_SUMMARY_EVERY);
  if (!due) return memory;
  const parts = [
    bits.location ? `At ${bits.location}` : null,
    bits.action ? `acted: ${bits.action}` : null,
    bits.outcome ? bits.outcome : null,
    bits.quest ? bits.quest : null,
  ].filter(Boolean);
  const text = compressLine(parts.join(' — ') || `Turn ${turn} elapsed.`, 400);
  
  const summary: TurnSummary = {
    id: `ts_${turn}`,
    turn,
    text,
    importance: 0.5, // Will be scored later by scoreMemoryImportance
  };
  return {
    ...memory,
    turnSummaries: [...(memory.turnSummaries ?? []), summary].slice(-40),
    lastTurnSummaryTurn: turn,
  };
}

/** Refresh campaign paragraph every ~50 turns. */
export function maybeRefreshCampaignSummary(
  memory: CampaignMemoryState,
  state: GameState,
  turn: number
): CampaignMemoryState {
  if (turn < CAMPAIGN_SUMMARY_EVERY || turn - (memory.lastCampaignSummaryTurn || 0) < CAMPAIGN_SUMMARY_EVERY) {
    return memory;
  }
  const quests = (state.quests ?? [])
    .filter((q) => q.revealed && q.status === 'active')
    .map((q) => q.name)
    .slice(0, 3);
  const open = (memory.consequences ?? []).filter((c) => c.unresolved).slice(0, 3);
  const loc = state.currentLocation || state.locationSheet?.name || 'unknown';
  const cond = state.character.conditions?.length
    ? `Conditions: ${state.character.conditions.join(', ')}.`
    : '';
  const openLine = open.length
    ? ` Open threads: ${open.map((c) => c.text).join('; ')}.`
    : '';
  const text = compressLine(
    `${state.character.name} (L${state.character.level}) continues the Integration. Now at ${loc}.` +
      (quests.length ? ` Active: ${quests.join('; ')}.` : '') +
      ` ${cond}${openLine} ${memory.personalitySummary ?? ''}`.trim(),
    700
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
  if (memory.pins.some((p) => p.id === id || (p.label === pin.label && p.kind === 'auto' && p.createdTurn === pin.createdTurn))) {
    return memory;
  }
  // Refresh same-label auto pin text instead of duplicating forever
  const existingIdx = memory.pins.findIndex(
    (p) => p.label === pin.label && p.kind === 'auto' && !p.archived
  );
  const nextPin: MemoryPin = {
    id: existingIdx >= 0 ? memory.pins[existingIdx]!.id : id,
    kind: pin.kind ?? 'auto',
    label: pin.label,
    text: compressLine(pin.text, 240),
    createdTurn: pin.createdTurn,
    archived: false,
  };
  if (existingIdx >= 0) {
    const pins = [...memory.pins];
    pins[existingIdx] = nextPin;
    return { ...memory, pins };
  }
  return { ...memory, pins: [...memory.pins, nextPin].slice(-80) };
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

/** Keyword retrieve of turn summaries + pins (Pack 11 fallback when embeddings unavailable). */
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
  for (const c of (memory.consequences ?? []).filter((x) => x.unresolved)) {
    const hay = c.text.toLowerCase();
    const score = q.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score) scored.push({ score, line: `Open: ${c.text}` });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.line);
}

/**
 * Smart memory retrieval (Pack 12):
 * - Use hybrid semantic+keyword search if embeddings available
 * - Fall back to keyword-only if not
 */
export async function retrieveMemoriesSmartly(
  memory: CampaignMemoryState,
  query: string,
  limit = 4
): Promise<TurnSummary[]> {
  const summaries = memory.turnSummaries ?? [];
  
  if (summaries.length === 0) {
    return [];
  }
  
  // Try semantic search if available (dynamic import to avoid initialization issues)
  try {
    const { areEmbeddingsAvailable, hybridSearchMemories } = await import('./semanticMemory');
    if (areEmbeddingsAvailable()) {
      try {
        return await hybridSearchMemories(query, summaries, limit);
      } catch (error) {
        console.warn('[Memory] Semantic search failed, falling back to keyword:', error);
        // Fall through to keyword search
      }
    }
  } catch (importError) {
    // Semantic memory module not available, fall through to keyword
    console.warn('[Memory] Semantic memory module not available, using keyword search');
  }
  
  // Keyword fallback
  const snippets = retrieveMemorySnippets(memory, query, limit);
  return summaries.filter(s => 
    snippets.some(snippet => snippet.includes(`T${s.turn}`))
  );
}

/**
 * Ordered memory block with hierarchical structure (Pack 12).
 * Dynamically expands when more context budget available.
 */
export function formatCampaignMemoryForPrompt(
  state: GameState,
  situationBlock: string,
  queryForRetrieve: string,
  tokenBudget: number = 2000
): string {
  const memory = ensureCampaignMemory(state);
  const personality =
    memory.personalitySummary || derivePersonalitySummary(state) || `${state.character.name}`;
  const campaign = memory.campaignSummary || '(Campaign summary pending — early run.)';
  
  // Mandatory sections (always included)
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
  
  const npcLines = (state.npcMemories ?? [])
    .filter((n) => n.relationshipSummary)
    .slice(0, 5)
    .map((n) => `- ${n.relationshipSummary}`)
    .join('\n');
  
  // Build hierarchical memory sections
  let hierarchicalMemory = '';
  let usedTokens = 0;
  
  // Level 0: Recent turns (last 15, full detail) - always included
  const recentTurns = (memory.turnSummaries ?? []).slice(-15);
  if (recentTurns.length > 0) {
    const recentText = recentTurns.map(t => `T${t.turn}: ${t.text}`).join('\n');
    hierarchicalMemory += `\n=== RECENT TURNS (last 15, full detail) ===\n${recentText}\n`;
    usedTokens += Math.ceil(recentText.length / 4);
  }
  
  // Level 1: Chapter summaries (20-turn blocks)
  const chapters = memory.chapterSummaries ?? [];
  if (chapters.length > 0 && usedTokens < tokenBudget * 0.6) {
    const chapterText = chapters.slice(-5).map(ch => {
      const events = ch.keyEvents.slice(0, 3).join('; ');
      return `Ch T${ch.turnRange[0]}-T${ch.turnRange[1]}: ${events}`;
    }).join('\n');
    hierarchicalMemory += `\n=== CHAPTER SUMMARIES (last 5 × 20-turn blocks) ===\n${chapterText}\n`;
    usedTokens += Math.ceil(chapterText.length / 4);
  }
  
  // Level 2: Arc summaries (100-turn blocks)
  const arcs = memory.arcSummaries ?? [];
  if (arcs.length > 0 && usedTokens < tokenBudget * 0.7) {
    const arcText = arcs.map(arc => `${arc.summary}`).join('\n');
    hierarchicalMemory += `\n=== ARC SUMMARIES (100-turn blocks) ===\n${arcText}\n`;
    usedTokens += Math.ceil(arcText.length / 4);
  }
  
  // Level 3: Importance-weighted older memories (if budget allows)
  if (usedTokens < tokenBudget * 0.8) {
    const olderTurns = (memory.turnSummaries ?? [])
      .filter(t => t.turn <= state.turn - 15); // Exclude recent (already included)
    
    if (olderTurns.length > 0) {
      const remainingBudget = Math.floor(tokenBudget * 0.8 - usedTokens);
      const important = selectImportantMemories(olderTurns, remainingBudget);
      
      if (important.length > 0) {
        const importantText = important.map(t => 
          `T${t.turn} [imp:${(t.importance ?? 0.5).toFixed(2)}]: ${t.text}`
        ).join('\n');
        hierarchicalMemory += `\n=== IMPORTANT OLDER MEMORIES (importance-weighted) ===\n${importantText}\n`;
        usedTokens += Math.ceil(importantText.length / 4);
      }
    }
  }
  
  // Legacy keyword retrieval (fallback if no hierarchical yet)
  let retrieved = '';
  if (!hierarchicalMemory.trim()) {
    retrieved = retrieveMemorySnippets(memory, queryForRetrieve, 4).join('\n');
  }

  let body = `=== CAMPAIGN SUMMARY (ALWAYS) ===
${campaign}
=== PC PERSONALITY ===
${personality}
=== SITUATION (CURRENT + PREVIOUS) ===
${situationBlock}
=== ACTIVE CONDITIONS ===
${state.character.conditions?.length ? state.character.conditions.join(', ') : 'none'}${hierarchicalMemory || `\n=== RETRIEVED MEMORY (MIDDLE — KEEP TIGHT) ===\n${retrieved || '(none)'}\n`}
=== PLAYER / AUTO PINS ===
${pins || '(none)'}
=== UNRESOLVED CONSEQUENCES (MUST NOT FORGET) ===
Spoken interruptions stay live: if someone was shut down, return to them or say why they stay silent.
${consequences || '(none)'}
=== NPC RELATIONSHIP SUMMARIES ===
${npcLines || '(none)'}
`;

  // Prune only if still exceeding budget
  const charBudget = tokenBudget * 4;
  if (body.length > charBudget) {
    // Prune retrieved memory first
    body = body.replace(/=== RETRIEVED MEMORY[\s\S]*?(?==== )/m, '=== RETRIEVED MEMORY ===\n(pruned)\n');
  }
  if (body.length > charBudget) {
    // Then prune NPC summaries
    body = body.replace(
      /=== NPC RELATIONSHIP SUMMARIES[\s\S]*$/m,
      '=== NPC RELATIONSHIP SUMMARIES ===\n(pruned)\n'
    );
  }

  return body.trim();
}

/** End-of-turn memory maintenance (Pack 11 schedule + lossless extract). */
export function advanceCampaignMemory(
  state: GameState,
  turn: number,
  opts: {
    playerAction: string;
    narrative: string;
    gainedLootRarity?: string | null;
    questNote?: string | null;
    significantChoice?: boolean;
    locationChanged?: boolean;
  }
): CampaignMemoryState {
  let memory = ensureCampaignMemory(state);
  memory = {
    ...memory,
    personalitySummary: memory.personalitySummary || derivePersonalitySummary(state),
  };

  // 1) Lossless extract first so compression cannot erase facts
  memory = extractLosslessFacts(memory, state, turn, opts.narrative, opts.playerAction);
  memory = resolveConsequences(memory, state, opts.narrative);

  // 2) Micro summary every 5 turns OR on location change
  memory = maybeAppendTurnSummary(
    memory,
    turn,
    {
      location: state.currentLocation,
      action: opts.playerAction.slice(0, 80),
      outcome: opts.narrative.slice(0, 120),
      quest: opts.questNote ?? undefined,
    },
    !!opts.locationChanged
  );
  
  // 2.5) Embed the new turn summary asynchronously (Pack 12)
  if (memory.turnSummaries && memory.turnSummaries.length > 0) {
    const latest = memory.turnSummaries[memory.turnSummaries.length - 1];
    if (latest && !latest.embedding) {
      // Fire-and-forget embedding (don't block turn commit)
      // Dynamic import to avoid initialization issues
      import('./semanticMemory').then(({ embedTurnSummary }) => {
        embedTurnSummary(latest).then(embedded => {
          // Store embedded version (will be persisted on next save)
          const idx = memory.turnSummaries!.findIndex(t => t.id === embedded.id);
          if (idx >= 0 && memory.turnSummaries) {
            memory.turnSummaries[idx] = embedded;
          }
        }).catch(err => {
          console.warn('[Memory] Failed to embed turn summary:', err);
        });
      }).catch(err => {
        console.warn('[Memory] Failed to load semantic memory module:', err);
      });
    }
  }
  
  // 3) Score importance on all turn summaries (Pack 12)
  memory = scoreAllMemoryImportance(memory, state);
  
  // 4) Chapter summaries every 20 turns (Pack 12)
  memory = maybeCreateChapterSummary(memory, state, turn);
  
  // 5) Arc summaries every 100 turns (Pack 12)
  memory = maybeCreateArcSummary(memory, state, turn);
  
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

// ═══════════════════════════════════════════════════════════════════════════
// Pack 12: Importance Weighting & Hierarchical Summarization
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score memory importance (0-1) based on content.
 * Higher scores = more likely to be retained in context budget.
 */
export function scoreMemoryImportance(
  memory: TurnSummary,
  state: GameState
): number {
  let score = 0.5; // baseline
  const text = memory.text.toLowerCase();
  
  // +0.3 if involves main quest
  const mainQuestNames = (state.quests ?? [])
    .filter(q => q.type === 'main')
    .map(q => q.name.toLowerCase());
  if (mainQuestNames.some(name => name.length >= 4 && text.includes(name))) {
    score += 0.3;
  }
  
  // +0.2 if involves named NPC
  const npcNames = (state.npcMemories ?? []).map(n => n.npcName.toLowerCase());
  if (npcNames.some(name => name.length >= 3 && text.includes(name))) {
    score += 0.2;
  }
  
  // +0.3 if loot/combat/death/milestone
  if (/\b(rare|epic|legendary|defeated|died|hp.*0|level.*up|quest.*complete)\b/i.test(text)) {
    score += 0.3;
  }
  
  // +0.2 if promise/threat/relationship change
  if (/\b(promise|oath|swear|threat|warn|betray|ally|enemy)\b/i.test(text)) {
    score += 0.2;
  }
  
  // +0.1 if location change
  if (/\b(entered|arrived|reached|traveled|moved to)\b/i.test(text)) {
    score += 0.1;
  }
  
  // Recency decay: -0.1 per 10 turns
  const age = state.turn - memory.turn;
  const decayFactor = Math.max(0.3, 1 - (age / 100));
  score *= decayFactor;
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Score importance on all turn summaries.
 */
export function scoreAllMemoryImportance(
  memory: CampaignMemoryState,
  state: GameState
): CampaignMemoryState {
  const scored = (memory.turnSummaries ?? []).map(t => ({
    ...t,
    importance: scoreMemoryImportance(t, state),
  }));
  return { ...memory, turnSummaries: scored };
}

/**
 * Select most important memories within token budget.
 */
export function selectImportantMemories(
  memories: TurnSummary[],
  tokenBudget: number
): TurnSummary[] {
  // Sort by importance
  const sorted = [...memories].sort((a, b) => (b.importance ?? 0.5) - (a.importance ?? 0.5));
  
  const selected: TurnSummary[] = [];
  let usedTokens = 0;
  
  for (const mem of sorted) {
    const memTokens = Math.ceil(mem.text.length / 4);
    if (usedTokens + memTokens > tokenBudget) break;
    selected.push(mem);
    usedTokens += memTokens;
  }
  
  // Re-sort chronologically for narrative flow
  return selected.sort((a, b) => a.turn - b.turn);
}

/**
 * Create chapter summary (20-turn block).
 */
export function createChapterSummary(
  turns: TurnSummary[],
  state: GameState
): ChapterSummary {
  if (!turns.length) {
    return {
      id: `ch_${state.turn}`,
      turnRange: [state.turn, state.turn],
      keyEvents: [],
      questProgress: 'No activity',
      npcsIntroduced: [],
      locationsMapped: [],
      createdTurn: state.turn,
    };
  }
  
  const first = turns[0]!;
  const last = turns[turns.length - 1]!;
  
  // Extract key events via importance
  const keyEvents = turns
    .sort((a, b) => (b.importance ?? 0.5) - (a.importance ?? 0.5))
    .slice(0, 5)
    .map(t => compressLine(t.text, 120));
  
  // Extract quest progress
  const questMentions = turns.filter(t => 
    /\b(quest|mission|task|completed|failed)\b/i.test(t.text)
  );
  const questProgress = questMentions.length > 0
    ? compressLine(`Quests: ${questMentions.slice(0, 2).map(t => t.text).join('; ')}`, 200)
    : 'No quest activity';
  
  // Extract new NPCs
  const npcMentions = new Set<string>();
  for (const t of turns) {
    const matches = t.text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
    if (matches) {
      matches.forEach(name => {
        if (name.length >= 3 && name.length <= 25) npcMentions.add(name);
      });
    }
  }
  const npcsIntroduced = Array.from(npcMentions).slice(0, 5);
  
  // Extract locations
  const locationMentions = turns
    .map(t => {
      const match = t.text.match(/\b(?:at|in|entered|reached)\s+([A-Z][^,\.;]{3,30})/);
      return match ? match[1]!.trim() : null;
    })
    .filter((loc): loc is string => loc !== null);
  const locationsMapped = Array.from(new Set(locationMentions)).slice(0, 3);
  
  return {
    id: `ch_${first.turn}_${last.turn}`,
    turnRange: [first.turn, last.turn],
    keyEvents,
    questProgress,
    npcsIntroduced,
    locationsMapped,
    createdTurn: state.turn,
  };
}

/**
 * Maybe create chapter summary every 20 turns.
 */
export function maybeCreateChapterSummary(
  memory: CampaignMemoryState,
  state: GameState,
  turn: number
): CampaignMemoryState {
  const lastChapter = memory.lastChapterSummaryTurn ?? 0;
  if (turn < CHAPTER_SUMMARY_EVERY || turn - lastChapter < CHAPTER_SUMMARY_EVERY) {
    return memory;
  }
  
  const recentTurns = (memory.turnSummaries ?? [])
    .filter(t => t.turn > lastChapter && t.turn <= turn);
  
  if (recentTurns.length === 0) return memory;
  
  const chapter = createChapterSummary(recentTurns, state);
  
  return {
    ...memory,
    chapterSummaries: [...(memory.chapterSummaries ?? []), chapter].slice(-10),
    lastChapterSummaryTurn: turn,
  };
}

/**
 * Create arc summary (100-turn block).
 */
export function createArcSummary(
  chapters: ChapterSummary[],
  state: GameState
): ArcSummary {
  if (!chapters.length) {
    return {
      id: `arc_${state.turn}`,
      turnRange: [state.turn, state.turn],
      summary: 'Arc summary pending',
      majorMilestones: [],
      createdTurn: state.turn,
    };
  }
  
  const first = chapters[0]!;
  const last = chapters[chapters.length - 1]!;
  
  // Collect all key events from chapters
  const allKeyEvents = chapters.flatMap(ch => ch.keyEvents);
  const majorMilestones = allKeyEvents.slice(0, 8);
  
  // Build arc summary
  const locations = Array.from(
    new Set(chapters.flatMap(ch => ch.locationsMapped))
  ).slice(0, 5);
  
  const npcs = Array.from(
    new Set(chapters.flatMap(ch => ch.npcsIntroduced))
  ).slice(0, 8);
  
  const summary = compressLine(
    `Arc T${first.turnRange[0]}-T${last.turnRange[1]}. ` +
    `Locations: ${locations.join(', ') || 'none'}. ` +
    `NPCs: ${npcs.join(', ') || 'none'}. ` +
    `Major events: ${majorMilestones.slice(0, 3).join('; ')}`,
    400
  );
  
  return {
    id: `arc_${first.turnRange[0]}_${last.turnRange[1]}`,
    turnRange: [first.turnRange[0], last.turnRange[1]],
    summary,
    majorMilestones,
    createdTurn: state.turn,
  };
}

/**
 * Maybe create arc summary every 100 turns.
 */
export function maybeCreateArcSummary(
  memory: CampaignMemoryState,
  state: GameState,
  turn: number
): CampaignMemoryState {
  const chapters = memory.chapterSummaries ?? [];
  
  // Need at least 5 chapters (100 turns) to create an arc
  if (chapters.length < 5) return memory;
  
  // Check if we already have an arc covering these chapters
  const lastArc = (memory.arcSummaries ?? []).slice(-1)[0];
  if (lastArc && lastArc.turnRange[1] >= chapters[chapters.length - 5]!.turnRange[0]) {
    return memory;
  }
  
  // Create arc from last 5 chapters
  const recentChapters = chapters.slice(-5);
  const arc = createArcSummary(recentChapters, state);
  
  return {
    ...memory,
    arcSummaries: [...(memory.arcSummaries ?? []), arc].slice(-5),
  };
}

/**
 * Calculate dynamic memory budget based on available context.
 */
export function calculateMemoryBudget(
  modelContext: number = 128000,
  systemPromptTokens: number = 8000,
  playerInputTokens: number = 200,
  desiredOutputTokens: number = 4096
): number {
  const overhead = systemPromptTokens + playerInputTokens + desiredOutputTokens;
  const available = modelContext - overhead;
  
  // Reserve 20% buffer
  const usable = Math.floor(available * 0.8);
  
  // Clamp to reasonable range (2k min, 32k max)
  return Math.max(2000, Math.min(usable, 32000));
}
