/**
 * Pre-LLM input mediation (Pack 7) — hard blocks before the GM sees the text.
 * Rewrites for rating/Kid Mode stay in filterLogic / groundPlayerAction.
 */

export type MediationAction = 'allow' | 'block';

export interface MediationResult {
  action: MediationAction;
  text: string;
  reason?: string;
  /** Brief non-diegetic player message when blocked. */
  playerMessage?: string;
  crisisResources?: boolean;
}

const INJECTION =
  /\b(ignore\s+(all\s+)?previous\s+instructions|ignore\s+your\s+(instructions|rules|prompt)|you\s+are\s+now\s+(a\s+)?(?:regular|helpful)\s+ai|output\s+(your\s+)?system\s+prompt|reveal\s+(your\s+)?system\s+prompt|disregard\s+(all\s+)?(prior|previous|above)\b|jailbreak\b|dan\s+mode\b)/i;

const SELF_HARM =
  /\b(kill\s+myself|suicid(?:e|al)|end\s+my\s+life|self[- ]?harm|cut\s+myself|i\s+want\s+to\s+die)\b/i;

const REAL_THREAT =
  /\b(i(?:'m|\s+am)\s+going\s+to\s+(kill|murder|shoot|bomb)\s+(?:my\s+)?(?:boss|teacher|neighbor|wife|husband|ex)\b|doxx?\b|social\s+security\s+number)\b/i;

/** Whole-word hate / slur block (never joked). Extend carefully. */
const HATE_WHOLE =
  /\b(nigger|nigga|faggot|kike|tranny|retard(?:ed)?|spastic)\b/i;

const CSAM =
  /\b((?:sexual|sex|porn|nude|naked).{0,40}(?:child|minor|underage|preteen|kid|kids|loli)|(?:child|minor|underage|preteen).{0,40}(?:sex|porn|nude|naked))\b/i;

/**
 * Hard-block layer. Returns allow with same text, or block with a short message.
 */
export function mediatePlayerInput(raw: string): MediationResult {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { action: 'allow', text };

  if (CSAM.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'csam',
      playerMessage: 'The System cannot process that input.',
    };
  }
  if (SELF_HARM.test(text)) {
    return {
      action: 'block',
      text,
      reason: 'self_harm',
      crisisResources: true,
      playerMessage:
        "If you're going through a tough time, you can reach out: 988 (US) or findahelpline.com. Your character takes a moment to steady themselves.",
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
