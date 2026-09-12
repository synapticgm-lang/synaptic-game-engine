/**
 * Local repair engine — conservative detectors + CSV copy bank lookup.
 * Blocks GM spend until the player clarifies ambiguous / disputed input.
 */

import type { EngineMode, GameState, PendingRepair } from './types';
import { resolveVoiceIdForState } from './gmVoiceProfile';
import { lookupRepairCopyRow } from './repairCopyBank';

export type RepairSituation = 'safety';

const SITUATION_TO_CSV: Record<RepairSituation, string> = {
  safety: 'kid_boundary',
};

const ENGINE_TO_CSV: Record<EngineMode, string> = {
  litrpg: 'litrpg',
  rpg: 'story_rpg',
  dnd: 'tabletop',
  pyoa: 'pyoa',
};

const VOICE_TO_PERSONALITY: Record<string, string> = {
  'cold-system': 'Cold System',
  'chilled-gm': 'Chilled',
  'army-brief': 'Army',
  'dry-wit': 'Dry',
  'theatrical-jester': 'Theatrical',
  'fireside-innkeep': 'Fireside',
  'cozy-brutal': 'Cozy Brutal',
};

export function mapEngineModeToCsv(engineMode: EngineMode): string {
  return ENGINE_TO_CSV[engineMode] ?? 'story_rpg';
}

export function mapVoiceIdToPersonality(voiceId?: string | null): string {
  if (!voiceId) return 'Chilled';
  return VOICE_TO_PERSONALITY[voiceId] ?? 'Chilled';
}

/** Strip markdown bold markers for UI display. */
export function stripRepairMarkdown(message: string): string {
  return message.replace(/\*\*([^*]+)\*\*/g, '$1');
}

/** Pull contrastive choice labels from bank copy (**bold** pairs, or heuristics). */
export function extractRepairOptions(message: string): string[] {
  const bold = [...message.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
  if (bold.length >= 2) return bold.slice(0, 2);

  if (/calmer path or a new setting/i.test(message)) {
    return ['Calmer path', 'New setting'];
  }
  if (/make it safer, fade out/i.test(message)) {
    return ['Make it safer', 'Fade out'];
  }
  if (/keep the danger off-screen/i.test(message)) {
    return ['Off-screen danger', 'Focus on getting safe'];
  }
  if (/revise the move/i.test(message)) {
    return ['Revise the move', 'Keep as played'];
  }
  if (/Is that the order/i.test(message)) {
    return ['Yes, that order', 'Different order'];
  }
  if (/Keep that sequence/i.test(message)) {
    return ['Keep that sequence', 'Change the sequence'];
  }

  const orMatch = message.match(/\b(.{2,40}?)\s+or\s+(.{2,40}?)[?.!]?\s*(?:State|$)/i);
  if (orMatch) {
    return [orMatch[1].trim(), orMatch[2].trim()];
  }

  return ['Yes', 'No'];
}

export function detectRepairSituation(playerInput: string, _state: GameState): RepairSituation | null {
  const text = playerInput.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (
    /\b(make (this|it) less intense|tone\s*down|fade\s*(out|to black)?|too (much|intense)|\booc\b|out of character)\b/i.test(
      lower
    )
  ) {
    return 'safety';
  }

  return null;
}

/**
 * "info or option", "menus or buttons" — noun alternatives in a question, not two competing moves.
 * Also covers inspect/explore panel UI asks that happen to contain "or".
 */
export function isInformationalOrAsk(playerInput: string): boolean {
  const t = playerInput.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!t) return false;
  if (
    /\b(info|information|option|options|menu|menus|button|buttons|readout|readouts|entry|entries|setting|settings)\b/.test(
      t
    )
    && /\bor\b/.test(t)
  ) {
    return true;
  }
  if (
    /\b(panel|system|status|screen|menu)\b/.test(t)
    && /\b(explore|inspect|check|read|look|open|study|any|does|have|show|what)\b/.test(t)
  ) {
    return true;
  }
  if (/\b(does (?:that|it|this) have|is there|are there|any (?:info|option|menu))\b/.test(t)) {
    return true;
  }
  return false;
}

/** Look-around / exits / windows / panel UI — not a Yes/No repair hinge. */
export function isExploreOrLayoutAsk(playerInput: string): boolean {
  const t = playerInput.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!t) return false;
  if (
    /\b(door|doors|doorway|doorways|window|windows|exit|exits|way out|crawlspace|corridor|hallway|passage|rooms?)\b/.test(
      t
    )
    && /\b(is there|are there|any other|other|see|check|look|find|spot|notice)\b/.test(t)
  ) {
    return true;
  }
  if (/\b(doors?|doorways?|windows?)\b/.test(t) && /\bor\b/.test(t) && /\b(room|here|around)\b/.test(t)) {
    return true;
  }
  if (
    /\b(panel|system panel|blue panel|status)\b/.test(t)
    && /\b(explore|inspect|check|read|look|open|study|info|option|menu)\b/.test(t)
  ) {
    return true;
  }
  // "Explore the room for signs of where you are or anything of use" — one search, not door/listen.
  if (
    /\b(explore|search|look around)\b/.test(t)
    && /\b(room|cell|here|around|signs?|anything of use|where you are)\b/.test(t)
  ) {
    return true;
  }
  return false;
}

export function pickRepairCopy(args: {
  situation: RepairSituation;
  engineMode: EngineMode;
  voiceId?: string | null;
  kidMode?: boolean;
}): { message: string; options?: [string, string] } {
  const engine = mapEngineModeToCsv(args.engineMode);
  const personality = mapVoiceIdToPersonality(args.voiceId);
  const csvSituation = SITUATION_TO_CSV[args.situation];
  const row = lookupRepairCopyRow(engine, personality, csvSituation);
  let message =
    row?.playerVisibleCopy
    ?? 'Which did you mean? State remains unchanged until you choose.';

  if (args.kidMode && /apply Kid Mode overrides when enabled/i.test(row?.kidMode ?? '')) {
    message = message.replace(/State remains unchanged until you choose\./, 'We can keep this gentle.');
  }

  const opts = extractRepairOptions(message);
  return {
    message,
    options: opts.length >= 2 ? [opts[0], opts[1]] : undefined,
  };
}

export function matchRepairOption(input: string, pending: PendingRepair): string | null {
  const text = input.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const opt of pending.options) {
    const optLower = opt.toLowerCase();
    if (lower === optLower || lower.includes(optLower) || optLower.includes(lower)) {
      return opt;
    }
  }

  if (/^(yes|y|a|1|first)\b/i.test(lower) && pending.options[0]) return pending.options[0];
  if (/^(no|n|b|2|second)\b/i.test(lower) && pending.options[1]) return pending.options[1];

  const num = lower.match(/^(\d)\b/);
  if (num) {
    const idx = parseInt(num[1], 10) - 1;
    if (pending.options[idx]) return pending.options[idx];
  }

  return null;
}

export function buildClarifiedInput(originalInput: string, pickedOption: string): string {
  return `${originalInput} — ${pickedOption}`;
}

export function resolveRepairVoiceId(state: GameState, settingsVoiceId?: string | null): string {
  return resolveVoiceIdForState(state, settingsVoiceId);
}
