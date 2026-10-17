/** Voice cadence: diction / compression / attitude / framing with cooldowns (no catchphrase loops). */

import type { GameState, EngineMode } from './types';
import { resolveVoiceIdForState } from './gmVoiceProfile';

export type VoicePersonality =
  | 'cold-registrar' | 'sarcastic-patch' | 'army-quartermaster' | 'friendly-system' | 'cozy-brutal'
  | 'dry-wit' | 'theatrical' | 'chilled' | 'fireside-chronicler' | 'mission-lead' | 'friendly-guide';

export interface VoiceCadence {
  personality: VoicePersonality;
  diction: DictionPattern[];
  compression: 'terse' | 'balanced' | 'expansive';
  attitude: 'clinical' | 'warm' | 'sarcastic' | 'dramatic' | 'professional';
  framing: 'data' | 'story' | 'tactical' | 'moral' | 'casual';
}

export interface DictionPattern {
  pattern: string;
  examples: string[];
  cooldown: number;
  lastUsed?: number;
}

export type VoiceAsideTrigger = {
  trigger: 'hub_change' | 'xp_gain' | 'level_up' | 'quest_complete' | 'fail' | 'discovery' | 'combat_start' | 'danger';
  example: string;
  cooldown: number;
  lastUsed?: number;
};

export interface ToneSuppression {
  situation: 'grief' | 'danger' | 'revelation' | 'intimacy' | 'horror';
  reason: string;
}

/** Build voice cadence for a personality (examples capped at 2 — directive only reads two). */
export function buildVoiceCadence(personality: VoicePersonality): VoiceCadence {
  const patterns: Record<VoicePersonality, Omit<VoiceCadence, 'personality'>> = {
    'cold-registrar': {
      diction: [{ pattern: 'clinical_verbs', examples: ['logged', 'registered'], cooldown: 10 }, { pattern: 'data_nouns', examples: ['parameter', 'metric'], cooldown: 10 }, { pattern: 'system_refs', examples: ['protocol', 'routine'], cooldown: 8 }],
      compression: 'terse', attitude: 'clinical', framing: 'data',
    },
    'sarcastic-patch': {
      diction: [{ pattern: 'dry_comments', examples: ['Naturally', 'Predictably'], cooldown: 10 }, { pattern: 'understatement', examples: ['somewhat concerning', 'mildly unfortunate'], cooldown: 10 }, { pattern: 'mock_praise', examples: ['Brilliant strategy', 'Well done'], cooldown: 8 }],
      compression: 'balanced', attitude: 'sarcastic', framing: 'casual',
    },
    'army-quartermaster': {
      diction: [{ pattern: 'military_verbs', examples: ['secured', 'deployed'], cooldown: 10 }, { pattern: 'efficiency', examples: ['optimal', 'tactical'], cooldown: 10 }, { pattern: 'rank_refs', examples: ['soldier', 'mission'], cooldown: 8 }],
      compression: 'terse', attitude: 'professional', framing: 'tactical',
    },
    'friendly-system': {
      diction: [{ pattern: 'encouraging', examples: ['Great work', 'Well done'], cooldown: 10 }, { pattern: 'supportive', examples: ['Keep going', 'Almost there'], cooldown: 10 }, { pattern: 'helpful', examples: ['Tip', 'Remember'], cooldown: 8 }],
      compression: 'balanced', attitude: 'warm', framing: 'story',
    },
    'cozy-brutal': {
      diction: [{ pattern: 'warm_contrast', examples: ['Unfortunately', 'Regrettably'], cooldown: 10 }, { pattern: 'gentle_warning', examples: ['mind you', 'be aware'], cooldown: 10 }, { pattern: 'stark_facts', examples: ['lethal', 'permanent'], cooldown: 8 }],
      compression: 'balanced', attitude: 'warm', framing: 'story',
    },
    'dry-wit': {
      diction: [{ pattern: 'sardonic', examples: ['Marvelous', 'Splendid'], cooldown: 10 }, { pattern: 'observational', examples: ['One notes', 'Apparently'], cooldown: 10 }, { pattern: 'restrained', examples: ['perhaps', 'rather'], cooldown: 8 }],
      compression: 'balanced', attitude: 'sarcastic', framing: 'story',
    },
    'theatrical': {
      diction: [{ pattern: 'dramatic_verbs', examples: ['surges', 'erupts'], cooldown: 10 }, { pattern: 'grand_nouns', examples: ['spectacle', 'triumph'], cooldown: 10 }, { pattern: 'exclamation', examples: ['Behold', 'Mark this'], cooldown: 8 }],
      compression: 'expansive', attitude: 'dramatic', framing: 'story',
    },
    'chilled': {
      diction: [{ pattern: 'casual_verbs', examples: ['happens', 'plays out'], cooldown: 10 }, { pattern: 'conversational', examples: ['anyway', 'basically'], cooldown: 10 }, { pattern: 'understated', examples: ['kinda', 'probably'], cooldown: 8 }],
      compression: 'balanced', attitude: 'warm', framing: 'casual',
    },
    'fireside-chronicler': {
      diction: [{ pattern: 'storyteller', examples: ['And so', 'In time'], cooldown: 10 }, { pattern: 'warm_detail', examples: ['gentle', 'quiet'], cooldown: 10 }, { pattern: 'reflection', examples: ['perhaps', 'who can say'], cooldown: 8 }],
      compression: 'expansive', attitude: 'warm', framing: 'story',
    },
    'mission-lead': {
      diction: [{ pattern: 'professional', examples: ['proceed', 'confirm'], cooldown: 10 }, { pattern: 'directive', examples: ['objective', 'priority'], cooldown: 10 }, { pattern: 'clear_framing', examples: ['first', 'next'], cooldown: 8 }],
      compression: 'balanced', attitude: 'professional', framing: 'tactical',
    },
    'friendly-guide': {
      diction: [{ pattern: 'guide_verbs', examples: ['notice', 'discover'], cooldown: 10 }, { pattern: 'inviting', examples: ['you might', 'consider'], cooldown: 10 }, { pattern: 'supportive', examples: ['here', 'ahead'], cooldown: 8 }],
      compression: 'balanced', attitude: 'warm', framing: 'story',
    },
  };
  const config = patterns[personality];
  return { personality, diction: config.diction, compression: config.compression, attitude: config.attitude, framing: config.framing };
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
  const lastUsed = state.arcDirector?.voiceAsideLastUsed ?? {};
  const turn = state.turn;
  for (const a of buildVoiceAsides(personality)) {
    if (a.trigger !== trigger) continue;
    const used = lastUsed[`${personality}:${a.trigger}`];
    if (used == null || turn - used >= a.cooldown) {
      return { line: a.example, trigger: `${personality}:${trigger}` };
    }
  }
  return null;
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
    'cold-registrar': 'Clinical story diction — not STATUS-only.',
    'dry-wit': 'One dry aside in story prose per hub change when not suppressed.',
    'sarcastic-patch': 'System snark in story beats, not new facts.',
    'army-quartermaster': 'Tactical brevity on encounter beats.',
    'friendly-guide': 'Warm diction; stakes stay honest — no auto-win.',
  };
  if (modeHint[personality]) parts.push(modeHint[personality]!);
  return parts.length ? `AUTHORITY VOICE: ${parts.join(' ')}` : '';
}

/**
 * Format voice cadence directive for GM prompt.
 * 29d — short; personality must color STORY BODY (Gemini: not STATUS-only).
 */
export function formatVoiceCadenceDirective(
  cadence: VoiceCadence,
  suppression: ToneSuppression | null,
  availableAsides: VoiceAsideTrigger[],
  authorityHint?: string
): string {
  void availableAsides;
  if (suppression) {
    return `VOICE: Suppress personality for ${suppression.situation}. ${suppression.reason}. Plain narration.`;
  }

  const dictionExamples = cadence.diction
    .map((p) => p.examples.slice(0, 2).join(', '))
    .join(' | ');

  const compressionGuide = {
    terse: 'short sentences',
    balanced: 'mix short/medium',
    expansive: 'flowing descriptive',
  };

  const attitudeGuide = {
    clinical: 'detached factual',
    warm: 'warm diction; honest stakes (no plot armor)',
    sarcastic: 'dry irony',
    dramatic: 'emphatic stakes',
    professional: 'clear efficient',
    casual: 'conversational',
  };

  const hint = authorityHint?.replace(/^AUTHORITY VOICE:\s*/i, '').trim();
  return `VOICE (${cadence.personality}): Color the STORY BODY (not only STATUS). Diction [${dictionExamples}]; ${compressionGuide[cadence.compression]}; ${attitudeGuide[cadence.attitude]}; ${cadence.framing} framing.${hint ? ` ${hint}` : ''} No catchphrase loops.`;
}

