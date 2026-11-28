/**
 * Wave 3 (B026–B028) — sealed SceneManifest.
 * Committed beat/effects hash is sealed before GM.
 * B026: Manifest builder and hash
 * B028: One-repair policy (fallbackUsed). Brief 06 deleted deterministic fallback prose —
 * writer miss uses liveOpening.buildFailedStorytellerPage instead.
 */

import type { GameState } from './types';
import type { ArcDirectorResult } from './arcDirector';
import { contractForState } from './beatContract';
import { hookForbiddenReversal, hookManifestFact, resolveHookLock } from './hookLock';

export interface SceneManifest {
  turn: number;
  eventSeq: number;
  beatId?: string;
  beatEffectsHash: string;
  gist: string;
  requiredFacts: string[];
  forbiddenReversals: string[];
  allowedUncertainty: string[];
  playerAction: string;
  sealedAt: number;
  /** B028 — track if this was already used for a fallback (max 1 retry) */
  fallbackUsed?: boolean;
}

/** Hash committed beat effects before GM call (B026). */
export function hashBeatEffects(state: GameState, arc?: ArcDirectorResult): string {
  const parts = [
    String(state.turn),
    String(state.runManifest?.eventSeq ?? 0),
    arc?.beatId ?? '',
    arc?.beatCommitted ? '1' : '0',
    ...(arc?.systemReceipts ?? []),
    state.activeEncounter?.name ?? '',
    JSON.stringify(
      (state.quests ?? []).map((q) => [
        q.id,
        q.status,
        (q.objectives ?? []).map((o) => o.completed),
      ])
    ),
  ];
  const input = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Build sealed manifest from post-ArcDirector state (B026 Wave 3 enhanced). */
export function buildSealedManifest(
  state: GameState,
  playerInput: string,
  arc?: ArcDirectorResult
): SceneManifest {
  const beatId = arc?.beatId;
  const contract = beatId ? contractForState(state, beatId.replace(/-repeat$/, '')) : undefined;
  const requiredFacts: string[] = [
    `Location: ${state.currentLocation ?? 'unknown'}`,
    `PC: ${state.character.name} L${state.character.level}`,
    `HP: ${state.character.hp}/${state.character.maxHp}`,
    `XP: ${state.character.xp}`,
  ];
  
  // Active encounter state
  if (state.activeEncounter) {
    requiredFacts.push(
      `Encounter: ${state.activeEncounter.name} HP ${state.activeEncounter.hp}/${state.activeEncounter.maxHp}`
    );
  }
  
  // Quest states
  for (const q of state.quests ?? []) {
    if (q.status === 'active' || q.status === 'completed') {
      const objStatus = (q.objectives ?? []).map((o, i) => `${i}:${o.completed}`).join(',');
      requiredFacts.push(`Quest ${q.title}: ${q.status} [${objStatus}]`);
    }
  }
  
  // ArcDirector receipts
  for (const r of arc?.systemReceipts ?? []) {
    requiredFacts.push(r);
  }
  
  // Beat contract
  if (contract) {
    requiredFacts.push(`Beat: ${contract.summary}`);
  }

  const hookLock = resolveHookLock(state);
  if (hookLock) {
    requiredFacts.push(hookManifestFact(hookLock));
  }
  
  const gist =
    arc?.mandate?.split('\n').find((l) => l.trim())?.trim() ??
    `Player action: ${playerInput}`;

  // Build forbidden reversals list
  const forbiddenReversals: string[] = [
    'Do not undo committed quest stages or encounters',
    'Do not reroll ArcDirector commits',
    'Do not invent items or XP not in receipts',
    'Do not resurrect defeated enemies',
    'Do not reverse locked branches or consequences',
  ];
  
  // Add specific quest locks
  for (const q of state.quests ?? []) {
    if (q.status === 'completed' || q.status === 'failed') {
      forbiddenReversals.push(`Quest ${q.title} is ${q.status} and cannot revert`);
    }
  }
  
  // Add encounter terminal locks
  if (state.activeEncounter?.hp === 0) {
    forbiddenReversals.push(`${state.activeEncounter.name} is defeated and cannot heal`);
  }

  if (hookLock) {
    forbiddenReversals.push(hookForbiddenReversal(hookLock));
  }

  return {
    turn: state.turn,
    eventSeq: state.runManifest?.eventSeq ?? 0,
    beatId,
    beatEffectsHash: hashBeatEffects(state, arc),
    gist,
    requiredFacts,
    forbiddenReversals,
    allowedUncertainty: ['Ambient detail', 'NPC diction', 'Sensory color'],
    playerAction: playerInput,
    sealedAt: Date.now(),
    fallbackUsed: false,
  };
}

export function attachSealedManifest(
  state: GameState,
  manifest: SceneManifest
): GameState {
  return { ...state, sealedManifest: manifest };
}

export function formatSealedManifestBlock(manifest: SceneManifest): string {
  return `\n--- SEALED MANIFEST (hash=${manifest.beatEffectsHash}) ---\nGist: ${manifest.gist}\nRequired facts:\n${manifest.requiredFacts.map((f) => `- ${f}`).join('\n')}\nForbidden: ${manifest.forbiddenReversals.join('; ')}\n-------------------------------------------------\n`;
}


/** HUD fact bleed that used to append into fallback prose. */
const HUD_FACT_BLEED = /\bPC:\s*\S+.*\bHP:\s*\d|\bXP:\s*\d{1,4}\b(?!\s*(?:Gained|from|for))/i;

/**
 * Detect HUD fact bleed in prose (PC/HP/XP chrome).
 * Brief 06: BANNED_FALLBACK_STUB and leftover stub-phrase regexes deleted — do not reintroduce them.
 */
export function isBannedFallbackStub(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return HUD_FACT_BLEED.test(text);
}

/** Hard stop after one recovery commit — next empty GM must FAIL (Class A). */
export function consecutiveRecoveryExceeded(state: GameState): boolean {
  return (state.sceneFacts?.engineRecoveryStreak ?? 0) >= 1;
}

export function markEngineRecoveryCommit(state: GameState): GameState {
  const streak = (state.sceneFacts?.engineRecoveryStreak ?? 0) + 1;
  return {
    ...state,
    sceneFacts: {
      ...(state.sceneFacts ?? {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: state.turn,
      }),
      engineRecoveryStreak: streak,
    },
  };
}

export function clearEngineRecoveryStreak(state: GameState): GameState {
  if (!state.sceneFacts?.engineRecoveryStreak) return state;
  return {
    ...state,
    sceneFacts: { ...state.sceneFacts, engineRecoveryStreak: 0 },
  };
}

/**
 * B028 — Check if manifest can still be used for fallback (max 1 retry policy).
 * Brief 06: deterministic fallback prose deleted; flag remains for legacy saves.
 */
export function canUseFallback(manifest: SceneManifest): boolean {
  return !manifest.fallbackUsed;
}
