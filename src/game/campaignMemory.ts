import type {
  CampaignMemoryState,
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

/** Pack 11: micro summaries every ~5 turns (was 15). */
const MICRO_SUMMARY_EVERY = 5;
/** Pack 11: campaign paragraph every ~50 turns. */
const CAMPAIGN_SUMMARY_EVERY = 50;

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
=== UNRESOLVED CONSEQUENCES (MUST NOT FORGET) ===
Spoken interruptions stay live: if someone was shut down, return to them or say why they stay silent.
${consequences || '(none)'}
=== NPC RELATIONSHIP SUMMARIES ===
${npcLines || '(none)'}
`;

  // Prune retrieved memory only. Pins and unresolved consequences stay — they are lossless.
  if (body.length > MEMORY_CHAR_BUDGET) {
    body = body.replace(/=== RETRIEVED MEMORY[\s\S]*?(?==== )/m, '=== RETRIEVED MEMORY ===\n(pruned)\n');
  }
  if (body.length > MEMORY_CHAR_BUDGET) {
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
