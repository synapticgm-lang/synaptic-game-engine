/**
 * Wave 3 (B026–B028) — sealed SceneManifest + deterministic fallback prose.
 * Committed beat/effects hash is sealed before GM; GM fail uses local templates.
 * B026: Manifest builder and hash
 * B028: One-repair policy and deterministic fallback
 */

import { scrubProseControlTags, applyStatusFirewall } from './statusFirewall';
import { getDiegeticFallback } from './diegeticFallbacks';
import type { GameState } from './types';
import type { ArcDirectorResult } from './arcDirector';
import { contractForState } from './beatContract';
import { hookForbiddenReversal, hookManifestFact, resolveHookLock } from './hookLock';
import { cleanPlaceLabel, playerFacingLocation } from './locationName';
import { shortRoomLabel } from './mapEngine';

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

export type RenderFallbackReason = 'empty' | 'timeout' | 'fail' | 'malformed';

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


/** Old HUD stubs that must never appear as player-facing GM narration (critic Batch A + E stall). */
const BANNED_FALLBACK_STUB =
  /something shifts\s*[—-]\s*a footstep|forcing the moment forward|closes in\s*[—-]\s*steel and breath|You act while the ledger still counts|the crisis will not wait\.|the arc moves anyway\.|the moment has not moved on|figure\s+\d+\s+is still here|holds the beat|a glance,\s*a breath|a cost still unpaid|telegraph first|no prior cast|Do not invent|here is the narrative of the completed event|you can still look,\s*speak,\s*or move|At alone in\b/i;

/** HUD fact bleed that used to append into fallback prose. */
const HUD_FACT_BLEED = /\bPC:\s*\S+.*\bHP:\s*\d|\bXP:\s*\d{1,4}\b(?!\s*(?:Gained|from|for))/i;

/** Detect banned sealed-manifest stubs (incl. legacy tapes). */
export function isBannedFallbackStub(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return BANNED_FALLBACK_STUB.test(text) || HUD_FACT_BLEED.test(text)
    || /\bthe beat does not freeze\b|\bis still engaged\s*[—–-]/i.test(text);
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
 * Diegetic local stitch when GM is empty — narrative only, never HUD PC/HP/XP lines.
 * Encounter branch narrates live ledger foe; never the closes-in template.
 */
export function renderDeterministicFallback(
  manifest: SceneManifest,
  state: GameState
): string {
  const rawPlace = cleanPlaceLabel(playerFacingLocation(state) || state.currentLocation?.trim() || 'here');
  const loc =
    !rawPlace || /^alone\b/i.test(rawPlace) || /,/.test(rawPlace) || rawPlace.length > 48
      ? shortRoomLabel(rawPlace, 'this room')
      : rawPlace;
  const enc = state.activeEncounter;
  const lastBeat = (state.sceneFacts?.lastBeat ?? '').replace(/\s+/g, ' ').trim();
  const storyBeat =
    lastBeat.length >= 24 &&
    !/;/.test(lastBeat) &&
    !/\b(?:street empty|it is quiet|System panel is visible|people are present|people are shouting)\b/i.test(
      lastBeat,
    );
  const beatHint = storyBeat ? `${lastBeat.slice(0, 140).replace(/[.!?]?$/, '')}.` : '';
  const action = (manifest.playerAction ?? '').toLowerCase();
  const inspectish = /\b(inspect|examine|search|look|panel)\b/i.test(action);

  if (enc) {
    const hp = typeof enc.hp === 'number' ? enc.hp : null;
    const max = typeof enc.maxHp === 'number' ? enc.maxHp : null;
    const hpBit = hp != null && max != null ? ` — ${hp}/${max} HP` : '';
    return `At ${loc}, ${enc.name} is still engaged${hpBit}. Dust and breath hang between you; the next blow, flight, or word is yours.`;
  }
  if (manifest.beatId?.includes('crisis') || manifest.beatId?.includes('branch')) {
    return `At ${loc}, the crisis has not left the room. A choice still sits in front of you — delay will cost.`;
  }
  if (inspectish) {
    return getDiegeticFallback(state, 'inspect exhaust');
  }
  if (/quest stage|arc xp|encounter:/i.test(manifest.requiredFacts.join(' '))) {
    const arcHint = beatHint || 'What the ledger already committed still stands.';
    return `At ${loc}, ${arcHint}`;
  }
  const ambient = beatHint
    ? `What you last held onto still matters: ${beatHint}`
    : 'Sound and light keep moving around you.';
  return `At ${loc}, the beat does not freeze. ${ambient}`;
}

/** 
 * B028 — One-repair policy terminal: fallback preserves receipts in systemLog only.
 * Max 1 fallback per manifest; subsequent failures must use a new manifest.
 * 31i — never emit banned HUD stubs; prose is diegetic stitch only.
 */
export function applyRenderFallback(
  manifest: SceneManifest,
  state: GameState,
  reason: RenderFallbackReason
): { prose: string; systemLog: string[]; manifestUpdated: SceneManifest } {
  // Check if fallback already used
  if (manifest.fallbackUsed) {
    throw new Error(
      `Wave 3 B028 violation: manifest hash=${manifest.beatEffectsHash} already used fallback; max 1 retry exceeded`
    );
  }
  
  let prose = scrubProseControlTags(renderDeterministicFallback(manifest, state));
  // Belt-and-braces: strip any accidental HUD fact bleed
  prose = prose
    .replace(/\bPC:\s*[^.]*\.?/gi, '')
    .replace(/\bHP:\s*\d+\s*\/\s*\d+\.?/gi, '')
    .replace(/\bXP:\s*\d+\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (isBannedFallbackStub(prose)) {
    prose = getDiegeticFallback(state, 'inspect exhaust');
  }
  const manifestUpdated: SceneManifest = {
    ...manifest,
    fallbackUsed: true,
  };
  
  // 29c — no player-facing "(beat recovered; fail)" chrome
  // Ledger receipts stay in systemLog — never append PC/HP/XP into narration
  return {
    prose,
    systemLog: applyStatusFirewall([
      `Deterministic fallback applied (${reason}) — ledger preserved`,
    ]).lines,
    manifestUpdated,
  };
}

/**
 * B028 — Check if manifest can still be used for fallback (max 1 retry policy).
 */
export function canUseFallback(manifest: SceneManifest): boolean {
  return !manifest.fallbackUsed;
}
