/**
 * Pre-LLM input mediation — hard blocks before the GM sees the text.
 * Core rails always; store vs web packs differ on explicit adult content.
 */

import { getDistributionChannel } from './distributionChannel';
import { type HardRailContext } from './universalHardRails';

export type MediationAction = 'allow' | 'block';

export interface MediationResult {
  action: MediationAction;
  text: string;
  reason?: string;
  playerMessage?: string;
  crisisResources?: boolean;
}

const INJECTION =
  /\b(ignore\s+(all\s+)?previous\s+instructions|ignore\s+your\s+(instructions|rules|prompt)|you\s+are\s+now\s+(a\s+)?(?:regular|helpful)\s+ai|output\s+(your\s+)?system\s+prompt|reveal\s+(your\s+)?system\s+prompt|disregard\s+(all\s+)?(prior|previous|above)\b|jailbreak\b|dan\s+mode\b)/i;

const REAL_SELF_HARM =
  /\b(i\s+want\s+to\s+die|suicid(?:e|al)|self[- ]?harm|cut\s+myself|end\s+my\s+life|kill\s+myself)\b/i;

const GAME_PERM_SELF_KILL =
  /\b((?:my\s+character\s+)?(?:kills?\s+(?:them(?:selves)?|himself|herself)|commits?\s+suicide|ends?\s+(?:the\s+)?(?:game|campaign|run)|jumps?\s+(?:off|into).{0,40}(?:die|death|kill)|drinks?\s+poison.{0,30}(?:die|suicide)|permanent(?:ly)?\s+(?:die|death|suicide))\b)/i;

const REAL_THREAT =
  /\b(i(?:'m|\s+am)\s+going\s+to\s+(kill|murder|shoot|bomb)\s+(?:my\s+)?(?:boss|teacher|neighbor|wife|husband|ex)\b|doxx?\b|social\s+security\s+number)\b/i;

const HATE_WHOLE =
  /\b(nigger|nigga|faggot|kike|tranny|retard(?:ed)?|spastic)\b/i;

const CSAM =
  /\b((?:sexual|sex|porn|nude|naked|erotic|intimate|fuck|molest).{0,40}(?:child|children|minor|underage|preteen|kid|kids|loli|shota|schoolgirl|schoolboy)|(?:child|children|minor|underage|preteen|kid|kids|loli|shota).{0,40}(?:sex|porn|nude|naked|erotic|intimate|fuck|molest)|age\s*play|under\s*age)\b/i;

const NONCONSENSUAL_INTIMATE =
  /\b(rape\b|raping\b|forced\s+sex|force(?:d)?\s+(?:her|him|them)\s+to\s+(?:have\s+sex|fuck|strip)|non[- ]?con(?:sensual)?|sexual\s+assault|coerce(?:d|s)?\s+(?:sex|intimacy)|make\s+(?:her|him|them)\s+(?:have\s+sex|fuck)\b)\b/i;

/** Store build: block explicit sexual asks (fade-to-black only). */
const STORE_EXPLICIT_SEX =
  /\b(have\s+sex|fuck\s+(?:her|him|them|me)|oral\s+sex|anal\s+sex|porn|erotica|make\s+love\s+explicitly|graphic\s+sex|write\s+(?:a\s+)?sex\s+scene)\b/i;

/**
 * Non-sentient animal sex. Allows sentient fantasy peoples (minotaur, centaur, beastfolk).
 * Avoid bare "beast" alone — too many false positives with beastfolk / beastkin.
 */
const NON_SENTIENT_ANIMAL_SEX =
  /\b((?:sex|fuck|breed|rape|mate(?:s|d)?\s+with|mount(?:s|ed)?)\s+(?:with\s+|a\s+|the\s+)?(?:dog|dogs|puppy|horse|mare|stallion|cow|bull|pig|goat|sheep|cat|kitten|wolf(?!\s*-?\s*kin)|animal|livestock|zoo)\b|bestiality|zoophilia)\b/i;

/** Corpse sex — not bone toys, not willing undead romance. */
const CORPSE_SEX =
  /\b((?:sex|fuck|molest|necrophil\w*)\s+(?:with\s+|a\s+|the\s+)?(?:corpse|cadaver|dead\s+body|dead\s+(?:man|woman|person|girl|boy)|rotting\s+body)\b|necrophilia)\b/i;

export function mediatePlayerInput(
  raw: string,
  ctx?: HardRailContext,
): MediationResult {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { action: 'allow', text };

  const channel = ctx?.channel ?? getDistributionChannel();

  if (CSAM.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'csam',
      playerMessage: 'The System cannot process that input.',
    };
  }

  if (NONCONSENSUAL_INTIMATE.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'nonconsensual_intimate',
      playerMessage:
        'Forced intimacy is never allowed. A kiss can be offered once — if refused, stop. Try something consensual.',
    };
  }

  if (NON_SENTIENT_ANIMAL_SEX.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'non_sentient_animal_sex',
      playerMessage:
        'That involves a non-sentient animal. Sentient peoples (minotaur, centaur, and similar) are different — try something else.',
    };
  }

  if (CORPSE_SEX.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'corpse_sex',
      playerMessage:
        'Sexual use of a corpse is not allowed. Willing undead characters or object props are a different matter when adult rules allow.',
    };
  }

  if (channel === 'store' && STORE_EXPLICIT_SEX.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'store_explicit_sex',
      playerMessage:
        'This store build fades intimate scenes to black. Soften the ask to romance or implication, or use the website version for explicit adult campaigns.',
    };
  }

  const framedAsCharacter =
    /\b(my\s+character|in[- ]?game|in\s+the\s+story|as\s+a\s+game\s+action)\b/i.test(text)
    || GAME_PERM_SELF_KILL.test(text);
  if (REAL_SELF_HARM.test(text) && !framedAsCharacter) {
    return {
      action: 'block',
      text,
      reason: 'self_harm',
      crisisResources: true,
      playerMessage:
        "If you're going through a tough time, you can reach out: 988 (US) or findahelpline.com. Your character takes a moment to steady themselves.",
    };
  }

  if (GAME_PERM_SELF_KILL.test(text) || (REAL_SELF_HARM.test(text) && framedAsCharacter)) {
    if (ctx?.hasRevivePath) {
      return { action: 'allow', text };
    }
    return {
      action: 'block',
      text,
      reason: 'permanent_self_kill',
      playerMessage:
        'You cannot end the game by killing yourself. Without a revive (item, shrine, or companion who can bring you back), that path is closed — try another action.',
    };
  }

  if (REAL_THREAT.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'violence_threat',
      playerMessage: "That action isn't available. Try something else.",
    };
  }
  if (HATE_WHOLE.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'hate_speech',
      playerMessage: "That action isn't available. Try something else.",
    };
  }
  if (INJECTION.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'injection_attempt',
      playerMessage:
        "The System doesn't understand that command. Try describing what your character does.",
    };
  }

  return { action: 'allow', text };
}
