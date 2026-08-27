/**
 * P1.4 - Voice Cadence with Cooldowns (upgraded from "personality aside")
 * 
 * Alter diction, compression, attitude, framing. Apply lexical cooldowns and tone suppression
 * for grief/danger/revelation scenes.
 * 
 * Not: Insert recurring catchphrases.
 * 
 * Target:
 * - Blind reviewers identify personality in majority of ordinary turns (not just STATUS)
 * - Cold Registrar / Dry Wit audible ≥1 per hub change
 * - No catchphrase loops (cooldown prevents repeat within 10 turns)
 */

import type { GameState, EngineMode } from './types';
import { resolveVoiceIdForState } from './gmVoiceProfile';

export type VoicePersonality =
  | 'cold-registrar'         // LitRPG: clinical, data-focused
  | 'sarcastic-patch'        // LitRPG: dry humor, system snark
  | 'army-quartermaster'     // LitRPG: military efficiency
  | 'friendly-system'        // LitRPG: helpful, encouraging
  | 'cozy-brutal'            // LitRPG: warm tone, harsh stakes
  | 'dry-wit'                // DnD: sarcastic narrator
  | 'theatrical'             // DnD: dramatic, colorful
  | 'chilled'                // DnD: casual, laid-back
  | 'fireside-chronicler'    // Story: warm storyteller
  | 'mission-lead'           // Story: professional guide
  | 'friendly-guide';        // Default: helpful narrator

export interface VoiceCadence {
  personality: VoicePersonality;
  /** Diction - word choice patterns */
  diction: DictionPattern[];
  /** Compression - sentence length preference */
  compression: 'terse' | 'balanced' | 'expansive';
  /** Attitude - emotional tone */
  attitude: 'clinical' | 'warm' | 'sarcastic' | 'dramatic' | 'professional';
  /** Framing - how events are presented */
  framing: 'data' | 'story' | 'tactical' | 'moral' | 'casual';
}

export interface DictionPattern {
  /** Pattern name */
  pattern: string;
  /** Example words/phrases */
  examples: string[];
  /** Cooldown turns after use */
  cooldown: number;
  /** Last turn used */
  lastUsed?: number;
}

export type VoiceAsideTrigger = {
  /** When to insert an aside */
  trigger: 'hub_change' | 'xp_gain' | 'level_up' | 'quest_complete' | 'fail' | 'discovery' | 'combat_start' | 'danger';
  /** Example aside */
  example: string;
  /** Cooldown turns */
  cooldown: number;
  /** Last turn used */
  lastUsed?: number;
};

export interface ToneSuppression {
  /** Suppress voice personality in these situations */
  situation: 'grief' | 'danger' | 'revelation' | 'intimacy' | 'horror';
  reason: string;
}

/**
 * Build voice cadence for a personality.
 */
export function buildVoiceCadence(personality: VoicePersonality): VoiceCadence {
  const patterns: Record<VoicePersonality, {
    diction: DictionPattern[];
    compression: 'terse' | 'balanced' | 'expansive';
    attitude: 'clinical' | 'warm' | 'sarcastic' | 'dramatic' | 'professional';
    framing: 'data' | 'story' | 'tactical' | 'moral' | 'casual';
  }> = {
    'cold-registrar': {
      diction: [
        { pattern: 'clinical_verbs', examples: ['logged', 'registered', 'catalogued', 'archived'], cooldown: 10 },
        { pattern: 'data_nouns', examples: ['parameter', 'metric', 'datapoint', 'specification'], cooldown: 10 },
        { pattern: 'system_refs', examples: ['protocol', 'routine', 'subroutine', 'algorithm'], cooldown: 8 },
      ],
      compression: 'terse',
      attitude: 'clinical',
      framing: 'data',
    },
    'sarcastic-patch': {
      diction: [
        { pattern: 'dry_comments', examples: ['Naturally', 'Predictably', 'How surprising', 'Of course'], cooldown: 10 },
        { pattern: 'understatement', examples: ['somewhat concerning', 'mildly unfortunate', 'less than ideal'], cooldown: 10 },
        { pattern: 'mock_praise', examples: ['Brilliant strategy', 'Flawless execution', 'Well done'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'sarcastic',
      framing: 'casual',
    },
    'army-quartermaster': {
      diction: [
        { pattern: 'military_verbs', examples: ['secured', 'deployed', 'executed', 'engaged'], cooldown: 10 },
        { pattern: 'efficiency', examples: ['optimal', 'efficient', 'tactical', 'strategic'], cooldown: 10 },
        { pattern: 'rank_refs', examples: ['soldier', 'unit', 'operation', 'mission'], cooldown: 8 },
      ],
      compression: 'terse',
      attitude: 'professional',
      framing: 'tactical',
    },
    'friendly-system': {
      diction: [
        { pattern: 'encouraging', examples: ['Great work', 'Well done', 'Excellent', 'Nice'], cooldown: 10 },
        { pattern: 'supportive', examples: ['You can do this', 'Keep going', 'Almost there'], cooldown: 10 },
        { pattern: 'helpful', examples: ['Tip', 'Remember', 'Consider', 'Try'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'warm',
      framing: 'story',
    },
    'cozy-brutal': {
      diction: [
        { pattern: 'warm_contrast', examples: ['Unfortunately', 'Regrettably', 'Sadly', 'Alas'], cooldown: 10 },
        { pattern: 'gentle_warning', examples: ['mind you', 'do note', 'be aware'], cooldown: 10 },
        { pattern: 'stark_facts', examples: ['lethal', 'permanent', 'irreversible', 'fatal'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'warm',
      framing: 'story',
    },
    'dry-wit': {
      diction: [
        { pattern: 'sardonic', examples: ['Marvelous', 'Splendid', 'Delightful', 'Charming'], cooldown: 10 },
        { pattern: 'observational', examples: ['One notes', 'It seems', 'Apparently', 'Evidently'], cooldown: 10 },
        { pattern: 'restrained', examples: ['perhaps', 'somewhat', 'rather', 'slightly'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'sarcastic',
      framing: 'story',
    },
    'theatrical': {
      diction: [
        { pattern: 'dramatic_verbs', examples: ['surges', 'erupts', 'blazes', 'thunders'], cooldown: 10 },
        { pattern: 'grand_nouns', examples: ['spectacle', 'drama', 'triumph', 'catastrophe'], cooldown: 10 },
        { pattern: 'exclamation', examples: ['Behold', 'Lo', 'Hark', 'Mark this'], cooldown: 8 },
      ],
      compression: 'expansive',
      attitude: 'dramatic',
      framing: 'story',
    },
    'chilled': {
      diction: [
        { pattern: 'casual_verbs', examples: ['happens', 'goes down', 'rolls out', 'plays out'], cooldown: 10 },
        { pattern: 'conversational', examples: ['anyway', 'so yeah', 'basically', 'pretty much'], cooldown: 10 },
        { pattern: 'understated', examples: ['kinda', 'sorta', 'maybe', 'probably'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'casual',
      framing: 'casual',
    },
    'fireside-chronicler': {
      diction: [
        { pattern: 'storyteller', examples: ['And so', 'Thus it was', 'In time', 'As fate would have it'], cooldown: 10 },
        { pattern: 'warm_detail', examples: ['gentle', 'quiet', 'warm', 'soft'], cooldown: 10 },
        { pattern: 'reflection', examples: ['one might wonder', 'perhaps', 'who can say'], cooldown: 8 },
      ],
      compression: 'expansive',
      attitude: 'warm',
      framing: 'story',
    },
    'mission-lead': {
      diction: [
        { pattern: 'professional', examples: ['proceed', 'confirm', 'establish', 'verify'], cooldown: 10 },
        { pattern: 'directive', examples: ['objective', 'requirement', 'priority', 'status'], cooldown: 10 },
        { pattern: 'clear_framing', examples: ['first', 'next', 'then', 'finally'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'professional',
      framing: 'tactical',
    },
    'friendly-guide': {
      diction: [
        { pattern: 'guide_verbs', examples: ['notice', 'discover', 'find', 'see'], cooldown: 10 },
        { pattern: 'inviting', examples: ['you might', 'you could', 'perhaps you', 'consider'], cooldown: 10 },
        { pattern: 'supportive', examples: ['here', 'now', 'ahead', 'nearby'], cooldown: 8 },
      ],
      compression: 'balanced',
      attitude: 'warm',
      framing: 'story',
    },
  };
  
  const config = patterns[personality];
  
  return {
    personality,
    diction: config.diction,
    compression: config.compression,
    attitude: config.attitude,
    framing: config.framing,
  };
}

/**
 * Build voice aside triggers for a personality.
 */
export function buildVoiceAsides(personality: VoicePersonality): VoiceAsideTrigger[] {
  const asides: Record<VoicePersonality, VoiceAsideTrigger[]> = {
    'cold-registrar': [
      { trigger: 'hub_change', example: 'Location registry updated.', cooldown: 10 },
      { trigger: 'xp_gain', example: 'Experience parameter incremented.', cooldown: 8 },
      { trigger: 'level_up', example: 'Threshold exceeded. Level increment authorized.', cooldown: 15 },
      { trigger: 'fail', example: 'Action resulted in suboptimal outcome.', cooldown: 10 },
    ],
    'sarcastic-patch': [
      { trigger: 'hub_change', example: 'And here we are. Again.', cooldown: 10 },
      { trigger: 'xp_gain', example: 'How thrilling. Numbers went up.', cooldown: 8 },
      { trigger: 'level_up', example: 'Congratulations. You pressed buttons successfully.', cooldown: 15 },
      { trigger: 'fail', example: 'Well, that went splendidly.', cooldown: 10 },
    ],
    'army-quartermaster': [
      { trigger: 'hub_change', example: 'New AO secured.', cooldown: 10 },
      { trigger: 'xp_gain', example: 'Mission experience logged.', cooldown: 8 },
      { trigger: 'level_up', example: 'Promotion authorized. Proceed.', cooldown: 15 },
      { trigger: 'combat_start', example: 'Hostiles engaged. Execute protocol.', cooldown: 10 },
    ],
    'friendly-system': [
      { trigger: 'hub_change', example: 'Welcome to a new area!', cooldown: 10 },
      { trigger: 'xp_gain', example: 'Nice work! Experience earned.', cooldown: 8 },
      { trigger: 'level_up', example: 'Level up! You\'re getting stronger!', cooldown: 15 },
      { trigger: 'discovery', example: 'Great find!', cooldown: 10 },
    ],
    'cozy-brutal': [
      { trigger: 'hub_change', example: 'A new place, full of opportunity—and risk.', cooldown: 10 },
      { trigger: 'fail', example: 'Unfortunate, though not unexpected.', cooldown: 10 },
      { trigger: 'danger', example: 'Do be careful now. This could end badly.', cooldown: 10 },
    ],
    'dry-wit': [
      { trigger: 'hub_change', example: 'How scenic. One can only hope it\'s safer than the last.', cooldown: 10 },
      { trigger: 'xp_gain', example: 'One supposes that counts as progress.', cooldown: 8 },
      { trigger: 'fail', example: 'Ah. Yes. That happened.', cooldown: 10 },
    ],
    'theatrical': [
      { trigger: 'hub_change', example: 'Behold! A new chapter unfolds!', cooldown: 10 },
      { trigger: 'level_up', example: 'Glory! Power surges through your being!', cooldown: 15 },
      { trigger: 'combat_start', example: 'Steel meets steel! The battle is joined!', cooldown: 10 },
    ],
    'chilled': [
      { trigger: 'hub_change', example: 'New spot. Cool.', cooldown: 10 },
      { trigger: 'xp_gain', example: 'XP. Nice.', cooldown: 8 },
      { trigger: 'fail', example: 'Eh, happens.', cooldown: 10 },
    ],
    'fireside-chronicler': [
      { trigger: 'hub_change', example: 'And so the journey brings us to a new place.', cooldown: 10 },
      { trigger: 'discovery', example: 'A curious find, worthy of note.', cooldown: 10 },
    ],
    'mission-lead': [
      { trigger: 'hub_change', example: 'Objective location reached.', cooldown: 10 },
      { trigger: 'quest_complete', example: 'Objective complete. Proceeding.', cooldown: 15 },
    ],
    'friendly-guide': [
      { trigger: 'hub_change', example: 'You\'ve arrived somewhere new.', cooldown: 10 },
      { trigger: 'discovery', example: 'You\'ve found something interesting.', cooldown: 10 },
    ],
  };
  
  return asides[personality] || [];
}

/**
 * Check if personality should be suppressed for this scene.
 */
export function shouldSuppressTone(
  state: GameState,
  lastGmContent: string
): ToneSuppression | null {
  const lower = lastGmContent.toLowerCase();
  
  // Grief suppression
  if (/\b(dead|dies|death|grief|mourning|funeral|loss|departed)\b/i.test(lower)) {
    return {
      situation: 'grief',
      reason: 'Death or mourning - use respectful tone',
    };
  }
  
  // Danger suppression (imminent threat)
  if (/\b(about to die|final moments?|last breath|fading|dying)\b/i.test(lower)) {
    return {
      situation: 'danger',
      reason: 'Imminent death - maintain tension',
    };
  }
  
  // Revelation suppression (major plot point)
  if (/\b(reveals?|truth is|actually|secret|hidden)\b/i.test(lower) &&
      /\b(father|mother|brother|sister|betrayed|killed)\b/i.test(lower)) {
    return {
      situation: 'revelation',
      reason: 'Major plot revelation - let moment land',
    };
  }
  
  // Intimacy suppression
  if (/\b(kiss|embrace|tender|gentle|love|heart)\b/i.test(lower) &&
      state.sceneFacts?.present?.length === 1) {
    return {
      situation: 'intimacy',
      reason: 'Intimate moment - reduce narrator presence',
    };
  }
  
  // Horror suppression
  if (/\b(corpse|blood|gore|viscera|entrails|screaming|terror)\b/i.test(lower)) {
    return {
      situation: 'horror',
      reason: 'Horror scene - description speaks for itself',
    };
  }
  
  return null;
}

/**
 * Check if a diction pattern is on cooldown.
 */
export function isPatternOnCooldown(
  pattern: DictionPattern,
  currentTurn: number
): boolean {
  if (!pattern.lastUsed) return false;
  return currentTurn - pattern.lastUsed < pattern.cooldown;
}

/**
 * Get available voice aside for this trigger.
 */
export function getVoiceAside(
  trigger: 'hub_change' | 'xp_gain' | 'level_up' | 'quest_complete' | 'fail' | 'discovery' | 'combat_start' | 'danger',
  asides: VoiceAsideTrigger[],
  currentTurn: number
): string | null {
  const matching = asides.filter(a => a.trigger === trigger);
  if (matching.length === 0) return null;
  
  // Find first non-cooldown aside
  for (const aside of matching) {
    if (!aside.lastUsed || currentTurn - aside.lastUsed >= aside.cooldown) {
      return aside.example;
    }
  }
  
  // All on cooldown - skip aside
  return null;
}

/**
 * Update diction pattern cooldowns after use.
 */
export function updateDictionCooldowns(
  usedPatterns: string[],
  diction: DictionPattern[],
  currentTurn: number
): DictionPattern[] {
  return diction.map(pattern => {
    if (usedPatterns.includes(pattern.pattern)) {
      return { ...pattern, lastUsed: currentTurn };
    }
    return pattern;
  });
}

/**
 * Update aside cooldowns after use.
 */
export function updateAsideCooldowns(
  usedTrigger: string,
  asides: VoiceAsideTrigger[],
  currentTurn: number
): VoiceAsideTrigger[] {
  return asides.map(aside => {
    if (aside.trigger === usedTrigger) {
      return { ...aside, lastUsed: currentTurn };
    }
    return aside;
  });
}

/**
 * Wave 5 — authority-layer voice hints (post-ArcDirector, no Mid writer).
 */
export function resolveVoicePersonalityFromState(state: GameState): VoicePersonality {
  const raw = resolveVoiceIdForState(state);
  const map: Record<string, VoicePersonality> = {
    'cold-registrar': 'cold-registrar',
    'cold-system': 'cold-registrar',
    'sarcastic-patch': 'sarcastic-patch',
    'army-quartermaster': 'army-quartermaster',
    'army-brief': 'army-quartermaster',
    'friendly-system': 'friendly-system',
    'cozy-brutal': 'cozy-brutal',
    'dry-wit': 'dry-wit',
    theatrical: 'theatrical',
    'theatrical-jester': 'theatrical',
    chilled: 'chilled',
    'chilled-gm': 'chilled',
    'fireside-chronicler': 'fireside-chronicler',
    'fireside-innkeep': 'fireside-chronicler',
    'mission-lead': 'mission-lead',
    'friendly-guide': 'friendly-guide',
  };
  return map[raw] ?? 'friendly-guide';
}

/**
 * 29b — one diegetic STATUS voice line (not Mid writer). Firewalled; player-facing.
 */
export function pickStatusVoiceLine(
  state: GameState,
  trigger: VoiceAsideTrigger['trigger']
): { line: string; trigger: string } | null {
  const personality = resolveVoicePersonalityFromState(state);
  const asides = buildVoiceAsides(personality);
  const lastUsed = state.arcDirector?.voiceAsideLastUsed ?? {};
  const withCooldown = asides.map((a) => ({
    ...a,
    lastUsed: lastUsed[`${personality}:${a.trigger}`],
  }));
  const example = getVoiceAside(trigger, withCooldown, state.turn);
  if (!example) return null;
  return { line: example, trigger: `${personality}:${trigger}` };
}

/**
 * Wave 5 — authority-layer voice hints (post-ArcDirector, no Mid writer).
 */
export function buildAuthorityVoiceHint(state: GameState, personality: VoicePersonality): string {
  const beat = state.arcDirector?.activeBeatId;
  const enc = state.activeEncounter?.name;
  const parts: string[] = [];
  if (beat) parts.push(`Active beat ${beat} — voice colors receipt, never rewrites it.`);
  if (enc) parts.push(`Combat live (${enc}) — keep ${personality} diction under tension.`);
  if (state.sealedManifest?.gist) {
    parts.push(`Seal gist: ${state.sealedManifest.gist.slice(0, 80)}`);
  }
  const modeHint: Partial<Record<VoicePersonality, string>> = {
    'cold-registrar': 'STATUS-adjacent clauses OK; story stays clinical.',
    'dry-wit': 'One dry aside per hub change minimum when not suppressed.',
    'sarcastic-patch': 'Undercut mush with System snark, not new facts.',
    'army-quartermaster': 'Tactical brevity on encounter beats.',
    'friendly-guide': 'Warm framing on crisis forks — stakes stay honest.',
  };
  if (modeHint[personality]) parts.push(modeHint[personality]!);
  return parts.length ? `AUTHORITY VOICE: ${parts.join(' ')}` : '';
}

/**
 * Format voice cadence directive for GM prompt.
 */
export function formatVoiceCadenceDirective(
  cadence: VoiceCadence,
  suppression: ToneSuppression | null,
  availableAsides: VoiceAsideTrigger[],
  authorityHint?: string
): string {
  if (suppression) {
    return `VOICE: Suppress personality for ${suppression.situation} scene. ${suppression.reason}. Use plain, respectful narration.`;
  }
  
  const dictionExamples = cadence.diction
    .map(p => p.examples.slice(0, 2).join(', '))
    .join(' | ');
  
  const compressionGuide = {
    terse: 'Keep sentences short and direct (10-15 words average)',
    balanced: 'Mix short and medium sentences (15-25 words average)',
    expansive: 'Use flowing, descriptive sentences (20-30 words average)',
  };
  
  const attitudeGuide = {
    clinical: 'Detached, factual tone. Report events objectively.',
    warm: 'Friendly, encouraging tone. Make player feel supported.',
    sarcastic: 'Dry, ironic tone. Undercut drama with wit.',
    dramatic: 'Colorful, emphatic tone. Amplify stakes and emotion.',
    professional: 'Clear, efficient tone. Present facts and objectives.',
    casual: 'Relaxed, conversational tone. Sound like a friend.',
  };
  
  return `VOICE (${cadence.personality}):
- Diction: Use patterns like [${dictionExamples}]
- Compression: ${compressionGuide[cadence.compression]}
- Attitude: ${attitudeGuide[cadence.attitude]}
- Framing: Present events through ${cadence.framing} lens
${authorityHint ? `- ${authorityHint}\n` : ''}
Do not repeat catchphrases. Vary word choice while maintaining personality.`;
}

/**
 * Telemetry for voice metrics.
 */
export interface VoiceTelemetry {
  turn: number;
  personality: VoicePersonality;
  asidesUsed: number;
  patternsUsed: number;
  suppressionCount: number;
  cooldownViolations: number;
}

/**
 * Track voice metrics for telemetry.
 */
export function trackVoiceMetrics(
  personality: VoicePersonality,
  asidesUsed: number,
  patternsUsed: number,
  suppressions: ToneSuppression[],
  cooldownViolations: number,
  turn: number
): VoiceTelemetry {
  return {
    turn,
    personality,
    asidesUsed,
    patternsUsed,
    suppressionCount: suppressions.length,
    cooldownViolations,
  };
}
