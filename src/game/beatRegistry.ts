/**
 * Beat Registry — versioned combat / quest / travel templates (02ac Phase 2).
 * ArcDirector picks from here; GM only fills 50–100 word atmosphere.
 */

import type { GameState } from './types';
import type { BeatContract, BeatKind } from './beatContract';
import { PlayerIntent } from './intentEnums';
import { FAST_XP_AWARDS } from './xpPolicy';

export type RegistryBeatKind = 'combat' | 'quest_stage' | 'travel' | 'dialogue' | 'loot';

export interface BeatTemplate {
  id: string;
  kind: RegistryBeatKind;
  version: string;
  requiredFacts: string[];
  forbiddenReversals: string[];
  xpRange: { min: number; max: number };
  proseDirective: string;
  wordCountTarget: number;
  proseHints: string[];
  nextLegalEdges: Array<{
    label: string;
    intent: PlayerIntent;
    cooldown: number;
  }>;
  once: boolean;
  minTurn: number;
  cooldownTurns: number;
  spawnEncounter?: boolean;
  biblePrefix?: string;
}

export const COMBAT_BEATS: Record<string, BeatTemplate> = {
  'sp-beat-skirmish': {
    id: 'sp-beat-skirmish',
    kind: 'combat',
    version: '1.0.0',
    biblePrefix: 'summoned-pact',
    requiredFacts: ['PC.hp', 'currentLocation'],
    forbiddenReversals: ['defeated enemy rez'],
    xpRange: { min: FAST_XP_AWARDS.combatTrash, max: FAST_XP_AWARDS.combatTrash },
    proseDirective: 'Describe a quick skirmish. The ledger already committed the fight. Tight, visceral combat in 50-80 words.',
    wordCountTarget: 65,
    proseHints: ['The threat is here', 'Steel answers', 'The beat is live'],
    nextLegalEdges: [
      { label: 'Press the attack', intent: PlayerIntent.INTENT_ATTACK, cooldown: 0 },
      { label: 'Try to flee', intent: PlayerIntent.INTENT_FLEE, cooldown: 0 },
      { label: 'Parley', intent: PlayerIntent.INTENT_PARLEY, cooldown: 1 },
    ],
    once: false,
    minTurn: 8,
    cooldownTurns: 8,
    spawnEncounter: true,
  },
  'ck-beat-hostility': {
    id: 'ck-beat-hostility',
    kind: 'combat',
    version: '1.0.0',
    biblePrefix: 'cursed-keep',
    requiredFacts: ['PC.hp', 'currentLocation'],
    forbiddenReversals: ['defeated enemy rez'],
    xpRange: { min: FAST_XP_AWARDS.combatTrash, max: FAST_XP_AWARDS.combatElite },
    proseDirective: 'Keep hostility is live. Narrate the hazard or fight in 50-80 words. Do not invent a new curse.',
    wordCountTarget: 70,
    proseHints: ['The keep answers', 'Steel or hazard', 'A clue shifts'],
    nextLegalEdges: [
      { label: 'Press the attack', intent: PlayerIntent.INTENT_ATTACK, cooldown: 0 },
      { label: 'Try to flee', intent: PlayerIntent.INTENT_FLEE, cooldown: 0 },
    ],
    once: false,
    minTurn: 8,
    cooldownTurns: 12,
    spawnEncounter: true,
  },
  'generic-beat-trash': {
    id: 'generic-beat-trash',
    kind: 'combat',
    version: '1.0.0',
    requiredFacts: ['PC.hp', 'currentLocation'],
    forbiddenReversals: ['defeated enemy rez'],
    xpRange: { min: FAST_XP_AWARDS.combatTrash, max: FAST_XP_AWARDS.combatTrash },
    proseDirective: 'A street-level threat is live. Narrate the opening clash in 50-80 words.',
    wordCountTarget: 60,
    proseHints: ['A foe steps in', 'The fight is on'],
    nextLegalEdges: [
      { label: 'Press the attack', intent: PlayerIntent.INTENT_ATTACK, cooldown: 0 },
      { label: 'Try to flee', intent: PlayerIntent.INTENT_FLEE, cooldown: 0 },
    ],
    once: false,
    minTurn: 8,
    cooldownTurns: 12,
    spawnEncounter: true,
  },
  'sp-beat-boss': {
    id: 'sp-beat-boss',
    kind: 'combat',
    version: '1.0.0',
    biblePrefix: 'summoned-pact',
    requiredFacts: ['PC.hp', 'currentLocation'],
    forbiddenReversals: ['defeated boss rez'],
    xpRange: { min: FAST_XP_AWARDS.combatBoss, max: FAST_XP_AWARDS.combatBoss },
    proseDirective: 'Boss fight is committed. Climactic strike in 80-100 words. Do not rez a cleared lastKill.',
    wordCountTarget: 90,
    proseHints: ['Final strike', 'The boss falls'],
    nextLegalEdges: [
      { label: 'Press the attack', intent: PlayerIntent.INTENT_ATTACK, cooldown: 0 },
      { label: 'Search the body', intent: PlayerIntent.INTENT_SEARCH, cooldown: 0 },
    ],
    once: true,
    minTurn: 20,
    cooldownTurns: 999,
    spawnEncounter: true,
  },
};

export const QUEST_BEATS: Record<string, BeatTemplate> = {
  'quest-stage-accept': {
    id: 'quest-stage-accept',
    kind: 'quest_stage',
    version: '1.0.0',
    requiredFacts: ['PC.name', 'currentLocation'],
    forbiddenReversals: [],
    xpRange: { min: FAST_XP_AWARDS.questAccept, max: FAST_XP_AWARDS.questAccept },
    proseDirective: 'Quest is accepted on the ledger. Brief exchange in 50-70 words.',
    wordCountTarget: 60,
    proseHints: ['The task is accepted', 'The next step is clear'],
    nextLegalEdges: [
      { label: 'Ask for details', intent: PlayerIntent.INTENT_TALK, cooldown: 0 },
      { label: 'Leave to begin', intent: PlayerIntent.INTENT_LEAVE, cooldown: 0 },
    ],
    once: true,
    minTurn: 5,
    cooldownTurns: 999,
  },
  'quest-stage-complete': {
    id: 'quest-stage-complete',
    kind: 'quest_stage',
    version: '1.0.0',
    requiredFacts: ['PC.name', 'currentLocation'],
    forbiddenReversals: ['completed quest revert'],
    xpRange: { min: FAST_XP_AWARDS.questComplete, max: FAST_XP_AWARDS.questComplete },
    proseDirective: 'Quest completed on the ledger. Brief close in 60-80 words.',
    wordCountTarget: 70,
    proseHints: ['The task is done', 'A reward lands'],
    nextLegalEdges: [
      { label: 'Ask about next steps', intent: PlayerIntent.INTENT_TALK, cooldown: 0 },
    ],
    once: true,
    minTurn: 15,
    cooldownTurns: 999,
  },
};

export const TRAVEL_BEATS: Record<string, BeatTemplate> = {
  'travel-hub-arrival': {
    id: 'travel-hub-arrival',
    kind: 'travel',
    version: '1.0.0',
    requiredFacts: ['PC.name', 'currentLocation'],
    forbiddenReversals: [],
    xpRange: { min: FAST_XP_AWARDS.discoverHub, max: FAST_XP_AWARDS.discoverHub },
    proseDirective: 'Arrival is committed. Sensory hub beat in 40-60 words. Camera stays HERE.',
    wordCountTarget: 50,
    proseHints: ['New ground underfoot', 'The hub is live'],
    nextLegalEdges: [
      { label: 'Look around', intent: PlayerIntent.INTENT_LOOK_AROUND, cooldown: 5 },
      { label: 'Ask a direct question', intent: PlayerIntent.INTENT_TALK, cooldown: 0 },
    ],
    once: false,
    minTurn: 4,
    cooldownTurns: 5,
  },
};

const ALL_BEATS: Record<string, BeatTemplate> = {
  ...COMBAT_BEATS,
  ...QUEST_BEATS,
  ...TRAVEL_BEATS,
};

export function getBeatTemplate(id: string): BeatTemplate | null {
  const raw = (id ?? '').replace(/-repeat$/, '');
  return ALL_BEATS[raw] ?? null;
}

function mapKind(kind: RegistryBeatKind): BeatKind {
  if (kind === 'combat') return 'encounter';
  if (kind === 'travel') return 'pressure';
  if (kind === 'dialogue' || kind === 'loot') return 'check';
  return 'quest_stage';
}

/** Deterministic XP inside the template range (no Math.random in the live path). */
export function xpFromTemplate(template: BeatTemplate, turn = 0): number {
  if (template.xpRange.min === template.xpRange.max) return template.xpRange.min;
  const span = template.xpRange.max - template.xpRange.min;
  return template.xpRange.min + (Math.abs(turn) % (span + 1));
}

export function buildBeatContractFromTemplate(
  template: BeatTemplate,
  state: GameState
): BeatContract {
  const id =
    template.once === false && (state.arcDirector?.committedBeatIds ?? []).includes(template.id)
      ? `${template.id}-repeat`
      : template.id;
  return {
    id,
    biblePrefix: template.biblePrefix ?? '',
    kind: mapKind(template.kind),
    minTurn: template.minTurn,
    once: template.once,
    summary: `${template.kind}: ${template.id}`,
    mandate: template.proseDirective,
    xpChunk: xpFromTemplate(template, state.turn),
    spawnEncounter: template.spawnEncounter === true,
    version: template.version,
    proseHints: template.proseHints,
    wordCountTarget: template.wordCountTarget,
  };
}
