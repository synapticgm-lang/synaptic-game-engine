/**
 * Wave 3 (B026–B028) — sealed SceneManifest + deterministic fallback prose.
 * Committed beat/effects hash is sealed before GM; GM fail uses local templates.
 */

import { scrubProseControlTags } from './statusFirewall';
import type { GameState } from './types';
import type { ArcDirectorResult } from './arcDirector';
import { contractById } from './beatContract';

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

/** Build sealed manifest from post-ArcDirector state (B026). */
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
  ];
  if (state.activeEncounter) {
    requiredFacts.push(`Encounter: ${state.activeEncounter.name}`);
  }
  for (const r of arc?.systemReceipts ?? []) {
    requiredFacts.push(r);
  }
  if (contract) {
    requiredFacts.push(`Beat: ${contract.summary}`);
  }
  const gist =
    arc?.mandate?.split('\n').find((l) => l.trim())?.trim() ??
    `Player action: ${playerInput}`;

  return {
    turn: state.turn,
    eventSeq: state.runManifest?.eventSeq ?? 0,
    beatId,
    beatEffectsHash: hashBeatEffects(state, arc),
    gist,
    requiredFacts,
    forbiddenReversals: [
      'Do not undo committed quest stages or encounters',
      'Do not reroll ArcDirector commits',
      'Do not invent items or XP not in receipts',
    ],
    allowedUncertainty: ['Ambient detail', 'NPC diction', 'Sensory color'],
    playerAction: playerInput,
    sealedAt: Date.now(),
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

/** One-repair policy terminal: fallback preserves receipts (B028). */
export function applyRenderFallback(
  manifest: SceneManifest,
  state: GameState,
  reason: RenderFallbackReason
): { prose: string; systemLog: string[] } {
  const prose = renderDeterministicFallback(manifest, state);
  return {
    prose: scrubProseControlTags(`${prose} (beat recovered; ${reason})`),
    systemLog: [`Deterministic fallback applied (${reason}) — ledger preserved`],
  };
}
