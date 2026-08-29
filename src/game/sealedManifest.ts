/**
 * Wave 3 (B026–B028) — sealed SceneManifest + deterministic fallback prose.
 * Committed beat/effects hash is sealed before GM; GM fail uses local templates.
 * B026: Manifest builder and hash
 * B027: Manifest-aware render validator
 * B028: One-repair policy and deterministic fallback
 */

import { scrubProseControlTags, applyStatusFirewall } from './statusFirewall';
import type { GameState } from './types';
import type { ArcDirectorResult } from './arcDirector';
import { contractById } from './beatContract';
import { detectHookContradiction, hookForbiddenReversal, hookManifestFact, resolveHookLock } from './hookLock';

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

function fnv1a(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
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
  return fnv1a(parts.join('|'));
}

/** Build sealed manifest from post-ArcDirector state (B026 Wave 3 enhanced). */
export function buildSealedManifest(
  state: GameState,
  playerInput: string,
  arc?: ArcDirectorResult
): SceneManifest {
  const beatId = arc?.beatId;
  const contract = beatId ? contractById(beatId.replace(/-repeat$/, '')) : undefined;
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

/** B027 — Validation result from checking GM prose against sealed manifest. */
export interface ManifestValidationResult {
  valid: boolean;
  contradictions: string[];
  omissions: string[];
  warnings: string[];
}

/**
 * B027 — Validate GM prose against the sealed manifest.
 * Detects contradictions (prose violates forbidden reversals)
 * and omissions (required facts missing from prose).
 * Does NOT mutate the ledger — returns result only.
 */
export function validateProseAgainstManifest(
  prose: string,
  manifest: SceneManifest,
  state: GameState
): ManifestValidationResult {
  const contradictions: string[] = [];
  const omissions: string[] = [];
  const warnings: string[] = [];
  const lowerProse = prose.toLowerCase();
  
  // Check for forbidden reversals
  for (const forbidden of manifest.forbiddenReversals) {
    // Check for defeated enemy resurrection
    if (forbidden.includes('defeated and cannot heal')) {
      const nameMatch = forbidden.match(/^(.+?) is defeated/);
      if (nameMatch) {
        const enemyName = nameMatch[1].toLowerCase();
        // Look for healing/resurrection language
        if (
          lowerProse.includes(`${enemyName} recovers`) ||
          lowerProse.includes(`${enemyName} stands`) ||
          lowerProse.includes(`${enemyName} rises`) ||
          /heals?.*\b${enemyName}\b/i.test(prose)
        ) {
          contradictions.push(`Prose resurrects ${nameMatch[1]} despite ledger defeat`);
        }
      }
    }
    
    if (forbidden.includes('locked hook why')) {
      const hookLock = resolveHookLock(state);
      const hookHit = detectHookContradiction(prose, hookLock);
      if (hookHit) contradictions.push(hookHit);
    }

    // Check for quest reversal
    if (forbidden.includes('Quest') && forbidden.includes('cannot revert')) {
      const questMatch = forbidden.match(/Quest (.+?) is (completed|failed)/);
      if (questMatch) {
        const questTitle = questMatch[1].toLowerCase();
        const status = questMatch[2];
        if (lowerProse.includes(questTitle)) {
          if (
            (status === 'completed' && lowerProse.includes('incomplete')) ||
            (status === 'failed' && lowerProse.includes('succeed'))
          ) {
            contradictions.push(`Prose reverses ${questMatch[1]} ${status} status`);
          }
        }
      }
    }
  }
  
  // Check for active encounter without combat language
  if (state.activeEncounter && state.activeEncounter.hp > 0) {
    if (
      !lowerProse.includes('fight') &&
      !lowerProse.includes('combat') &&
      !lowerProse.includes('attack') &&
      !lowerProse.includes('battle') &&
      !lowerProse.includes('strike') &&
      !lowerProse.includes('blade') &&
      !lowerProse.includes('swing')
    ) {
      warnings.push('Combat beat mandate but prose lacks fight language');
    }
  }
  
  // Check for critical required facts presence
  for (const fact of manifest.requiredFacts) {
    // Beat mandates must be addressed
    if (fact.startsWith('Beat:')) {
      const beatDesc = fact.replace('Beat:', '').trim().toLowerCase();
      // Very loose check — if it's a combat beat, prose should mention combat
      if (beatDesc.includes('combat') || beatDesc.includes('encounter') || beatDesc.includes('skirmish')) {
        if (
          !lowerProse.includes('fight') &&
          !lowerProse.includes('combat') &&
          !lowerProse.includes('attack') &&
          !lowerProse.includes('battle')
        ) {
          warnings.push('Combat beat description but prose avoids combat terms');
        }
      }
    }
    
    // XP receipts should be acknowledged if significant
    if (fact.includes('XP Gained') && fact.includes('+')) {
      const xpMatch = fact.match(/\+(\d+)/);
      if (xpMatch && parseInt(xpMatch[1]) >= 20) {
        if (!lowerProse.includes('xp') && !lowerProse.includes('experience')) {
          omissions.push(`Major XP award (${xpMatch[1]}) not mentioned in prose`);
        }
      }
    }
  }
  
  const valid = contradictions.length === 0 && omissions.length === 0;
  return { valid, contradictions, omissions, warnings };
}

/** Deterministic fallback prose from beat contract + manifest (B028). */
export function renderDeterministicFallback(
  manifest: SceneManifest,
  state: GameState
): string {
  const loc = state.currentLocation?.trim() || 'here';
  const facts = manifest.requiredFacts
    .filter((f) => !/^Location:/.test(f))
    .slice(0, 3);
  const factLine = facts.length ? ` ${facts.join('. ')}.` : '';
  const enc = state.activeEncounter;

  if (enc) {
    return `At ${loc}, ${enc.name} closes in — steel and breath and no time for rehearsal.${factLine} You act while the ledger still counts.`;
  }
  if (manifest.beatId?.includes('crisis') || manifest.beatId?.includes('branch')) {
    return `At ${loc}, the crisis will not wait.${factLine} A fork demands a choice before the moment curdles.`;
  }
  if (/quest stage|arc xp|encounter:/i.test(manifest.requiredFacts.join(' '))) {
    return `At ${loc}, the arc moves anyway.${factLine} What was committed lands whether prose cooperates or not.`;
  }
  return `At ${loc}, something shifts — a footstep, a call, a door — forcing the moment forward.${factLine}`;
}

/** 
 * B028 — One-repair policy terminal: fallback preserves receipts.
 * Max 1 fallback per manifest; subsequent failures must use a new manifest.
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
  
  const prose = renderDeterministicFallback(manifest, state);
  const manifestUpdated: SceneManifest = {
    ...manifest,
    fallbackUsed: true,
  };
  
  // 29c — no player-facing "(beat recovered; fail)" chrome
  return {
    prose: scrubProseControlTags(prose),
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
