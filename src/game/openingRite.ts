/**
 * XP-D1 OPEN — LitRPG Opening Rite engine.
 * Deterministic accept/refuse/backstop; engine-owned XP fill to Level 2.
 * Never runs for tabletop / RPG / PYOA.
 */
import { applyCharacterXpGain } from './characterXp';
import { levelBar } from './rules/xpPace';
import {
  openingRiteIsOpen,
  openingRiteRefuseWriterFact,
  openingRiteWriterOffer,
  riteEntryForState,
} from './openingRiteFacts';
import {
  type OpeningRiteEntry,
} from './openingRiteTable';
import type { GameState, Quest } from './types';

export {
  openingRiteIsOpen,
  openingRiteRefuseWriterFact,
  openingRiteWriterOffer,
  riteEntryForState,
} from './openingRiteFacts';

/** Persist on the save — one rite per save; never pays twice. */
export interface OpeningRiteState {
  id: string;
  done: boolean;
  /** Player turns counted while the rite was open (1-based after each apply). */
  turn: number;
  forced?: boolean;
  /** Scenario / quest title for System chrome. */
  title?: string;
  /** XP paid when completed (for System window). */
  xpPaid?: number;
  /** Turn number on the save when completed. */
  completedAtTurn?: number;
}

export type OpeningRiteClass = 'accept' | 'refuse' | 'none';

const RITE_QUEST_PREFIX = 'opening-rite:';

export function openingRiteQuestId(scenarioId: string): string {
  return `${RITE_QUEST_PREFIX}${scenarioId}`;
}

export function isOpeningRiteQuestId(id: string | undefined): boolean {
  return !!id && id.startsWith(RITE_QUEST_PREFIX);
}

/** Fill remaining L1 bar so the player lands on Level 2 exactly (never Level 3 via this award). */
export function openingRiteXpFill(state: Pick<GameState, 'character' | 'engineMode'>): number {
  if (state.engineMode !== 'litrpg') return 0;
  const level = state.character?.level ?? 1;
  if (level !== 1) return 0;
  const bar = levelBar('litrpg', 1);
  const have = Math.max(0, state.character?.xp ?? 0);
  return Math.max(0, bar - have);
}

function fillName(line: string, name: string): string {
  const n = (name || 'Adventurer').trim() || 'Adventurer';
  return line.replace(/<name>/gi, n);
}

function makeRiteQuest(entry: OpeningRiteEntry): Quest {
  return {
    id: openingRiteQuestId(entry.scenarioId),
    name: entry.title,
    description: entry.offerSentence,
    status: 'active',
    type: 'main',
    revealed: true,
    giver: entry.giver,
    objectives: [
      {
        id: `${openingRiteQuestId(entry.scenarioId)}-step`,
        description: entry.acceptChip,
        completed: false,
      },
    ],
  } as Quest;
}

/** Seed flag + one-step quest on LitRPG New Game / stamp. No-op for other modes. */
export function ensureOpeningRite(state: GameState): GameState {
  if (state.engineMode !== 'litrpg') return state;
  if (state.openingRite?.done) return state;
  const entry = riteEntryForState(state);
  if (!entry) return state;
  const id = openingRiteQuestId(entry.scenarioId);
  let quests = state.quests ?? [];
  if (!quests.some((q) => q.id === id)) {
    quests = [makeRiteQuest(entry), ...quests];
  }
  if (state.openingRite?.id === id && !state.openingRite.done) {
    return { ...state, quests };
  }
  return {
    ...state,
    quests,
    openingRite: state.openingRite?.done
      ? state.openingRite
      : { id, done: false, turn: 0, title: entry.title },
  };
}

export function openingRiteAcceptChip(state: GameState): string | null {
  if (!openingRiteIsOpen(state)) return null;
  return riteEntryForState(state)?.acceptChip ?? null;
}

export function openingRiteRefuseChip(state: GameState): string | null {
  if (!openingRiteIsOpen(state)) return null;
  return riteEntryForState(state)?.refuseChip ?? null;
}

/**
 * Small classifier: accept / refuse / neither.
 * Free text is never rejected by the game — this only decides whether the rite completes.
 */
export function classifyOpeningRiteInput(raw: string, entry?: OpeningRiteEntry | null): OpeningRiteClass {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return 'none';
  const lower = t.toLowerCase();

  // Exact chip labels first.
  if (entry?.acceptChip && lower === entry.acceptChip.toLowerCase()) return 'accept';
  if (entry?.refuseChip && lower === entry.refuseChip.toLowerCase()) return 'refuse';

  // Negatives that must not complete (before broad accept patterns).
  if (
    /^(?:who are you|what is this|where am i|what(?:'s| is) going on|look around|wait|inspect)\b/i.test(lower)
    || /\bwho are you\b|\bwhat is this\b/.test(lower)
  ) {
    return 'none';
  }

  // Attack the summoner / giver → refuse path.
  if (
    /\b(?:attack|strike|hit|kill|stab|punch|slash)\b/i.test(lower)
    && /\b(?:summoner|handler|chanter|auditor|system|him|her|them|you)\b/i.test(lower)
  ) {
    return 'refuse';
  }

  // Bare refuse / no.
  if (
    /^(?:no|nope|nah)[.!]?$/i.test(lower)
    || /^(?:i\s+)?(?:refuse|decline|reject)\b/i.test(lower)
    || /\bi (?:won't|will not|dont|don't) (?:sign|accept|agree|register|take)\b/i.test(lower)
  ) {
    return 'refuse';
  }

  // Accept patterns (incl. name registration).
  if (
    /^(?:yes|yep|yeah|yup|ok|okay|sure)[.!]?$/i.test(lower)
    || /\b(?:i(?:'| wi)?ll |i will )?(?:sign|accept|agree|register|enroll|claim)\b/i.test(lower)
    || /\b(?:sign|take) the (?:pact|oath|mark|trial|deal)\b/i.test(lower)
    || /\bi(?:'| a)?m (?:in|ready)\b/i.test(lower)
    || /\bhere is my name\b|\bmy name is\s+[a-z]/i.test(lower)
    || /\bgive (?:you )?my name\b|\bregister\b/i.test(lower)
    || /\bi(?:'| wi)?ll do it\b|\blet'?s do (?:it|this)\b/i.test(lower)
  ) {
    return 'accept';
  }

  return 'none';
}

function completeRite(
  state: GameState,
  entry: OpeningRiteEntry,
  opts: { forced: boolean; turnCount: number }
): { state: GameState; receipts: string[]; xpPaid: number } {
  const name =
    state.openingEstablishment?.answers?.name?.trim()
    || state.character?.name?.trim()
    || 'Adventurer';
  const line = fillName(opts.forced ? entry.forcedLine : entry.completionLine, name);
  const xpPaid = openingRiteXpFill(state);
  const leveled = applyCharacterXpGain(
    state.character,
    xpPaid,
    'litrpg',
    state.systemHousing
  );
  const questId = openingRiteQuestId(entry.scenarioId);
  const quests = (state.quests ?? []).map((q) => {
    if (q.id !== questId) return q;
    return {
      ...q,
      status: 'completed' as const,
      objectives: (q.objectives ?? []).map((o) => ({ ...o, completed: true })),
    };
  });
  const receipts: string[] = [
    `Quest complete: ${entry.title}`,
    ...(xpPaid > 0 ? [`XP Gained: ${xpPaid} (opening rite: ${entry.title})`] : []),
    ...leveled.notes,
    line,
  ];
  // Guard key — excluded from repeat ladder logic; flag is the pay gate.
  const awardKeys = [...(state.sandboxAwardKeys ?? [])];
  const guard = `opening-rite-done:${questId}`;
  if (!awardKeys.includes(guard)) awardKeys.push(guard);

  return {
    state: {
      ...state,
      character: leveled.character,
      quests,
      sandboxAwardKeys: awardKeys,
      openingRite: {
        id: questId,
        done: true,
        turn: opts.turnCount,
        forced: opts.forced || undefined,
        title: entry.title,
        xpPaid,
        // Commit lands on the upcoming turn number (apply runs before turn++).
        completedAtTurn: (state.turn ?? 0) + 1,
      },
      sceneFacts: {
        ...state.sceneFacts,
        openingRiteOffer: undefined,
        openingRiteRefusePersist: opts.forced
          ? 'The System/summoner persists with no punishment and registers them anyway.'
          : state.sceneFacts?.openingRiteRefusePersist,
      },
    },
    receipts,
    xpPaid,
  };
}

/**
 * Apply one player turn against the open rite.
 * Accept → complete now. Refuse → forced complete now (same XP).
 * Neither → count the turn; at turn ≥ 4 force-complete (backstop).
 */
export function applyOpeningRiteTurn(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[] } {
  if (state.engineMode !== 'litrpg') return { state, receipts: [] };
  let next = ensureOpeningRite(state);
  if (!openingRiteIsOpen(next)) return { state: next, receipts: [] };
  const entry = riteEntryForState(next);
  if (!entry) return { state: next, receipts: [] };

  const turnCount = (next.openingRite?.turn ?? 0) + 1;
  next = {
    ...next,
    openingRite: { ...next.openingRite!, turn: turnCount },
    sceneFacts: {
      ...next.sceneFacts,
      openingRiteOffer: entry.offerSentence,
    },
  };

  const kind = classifyOpeningRiteInput(playerInput, entry);
  if (kind === 'accept') {
    return completeRite(next, entry, { forced: false, turnCount });
  }
  if (kind === 'refuse') {
    return completeRite(next, entry, { forced: true, turnCount });
  }
  // Backstop: end of player turn 4.
  if (turnCount >= 4) {
    return completeRite(next, entry, { forced: true, turnCount });
  }
  return { state: next, receipts: [] };
}

/**
 * Pin the accept chip first while the rite is open (turns 1–3).
 * Does not count against the pad cap — unshift without dropping another chip.
 */
export function pinOpeningRiteChip(state: GameState, choices: string[]): string[] {
  if (!openingRiteIsOpen(state)) return choices;
  if ((state.openingRite?.turn ?? 0) >= 4) return choices;
  const chip = openingRiteAcceptChip(state);
  if (!chip) return choices;
  const list = [...choices];
  const want = chip.toLowerCase();
  const idx = list.findIndex((c) => c.toLowerCase() === want);
  if (idx === 0) return list;
  if (idx > 0) list.splice(idx, 1);
  list.unshift(chip);
  const refuse = openingRiteRefuseChip(state);
  if (refuse && !list.some((c) => c.toLowerCase() === refuse.toLowerCase())) {
    // Refuse stays available but does not displace the accept pin.
    const insertAt = Math.min(1, list.length);
    list.splice(insertAt, 0, refuse);
  }
  return list;
}

/**
 * Quest-seeking autoplay: take the pinned rite chip, else the A2 story chip when offered.
 * `pinnedStory` is the A2 `storyChip(state)` from the caller (avoids a circular import).
 */
export function pickQuestProfileChoice(
  offered: string[],
  state: GameState,
  fallback: () => string,
  pinnedStory?: string | null
): string {
  if (!offered.length) return fallback();
  const rite = openingRiteAcceptChip(state);
  if (rite) {
    const hit = offered.find((c) => c.toLowerCase() === rite.toLowerCase());
    if (hit) return hit;
  }
  if (pinnedStory) {
    const hit = offered.find((c) => c.toLowerCase() === pinnedStory.toLowerCase());
    if (hit) return hit;
  }
  return fallback();
}
