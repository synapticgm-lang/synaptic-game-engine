/**
 * Post-filter GM output to the player's maturity / Kid Mode settings (Pack 7).
 * Kid Mode casual swear swap remains in filterLogic.sanitizeInput.
 */

import type { Settings } from './types';
import { resolveMaturity } from './maturity';

const STRONG_SWEARS =
  /\b(fuck(?:ing|ed|er)?|motherfuck(?:er|ing)?|shit(?:ty|ting)?|cunt|cock|dick|asshole|bastard)\b/gi;

const MILD_SWEARS = /\b(damn|hell|crap|piss)\b/gi;

const GORE =
  /\b(guts\s+spill|blood\s+sprays|eviscerat\w*|dismember\w*|brain\s+matter|severed\s+limb)\b/gi;

const EXPLICIT_SEX =
  /\b(penis|vagina|clitoris|ejaculat\w*|orgasm\w*|thrust(?:ing|s)?\s+(?:into|deep))\b/gi;

export function postFilterGmOutput(text: string, settings: Settings): string {
  if (!text) return text;
  const m = resolveMaturity(settings);
  let out = text;

  if (m.kid || m.cursingLevel === 'none') {
    out = out.replace(STRONG_SWEARS, '—').replace(MILD_SWEARS, '—');
  } else if (m.cursingLevel === 'mild') {
    out = out.replace(STRONG_SWEARS, '—');
  }

  if (m.kid || m.violenceLevel === 'none') {
    out = out.replace(GORE, 'the fight ends');
  } else if (m.violenceLevel === 'mild') {
    out = out.replace(GORE, 'a harsh impact');
  }

  if (!m.sexualContent) {
    out = out.replace(EXPLICIT_SEX, '…');
  }

  if (m.darkThemes === 'none') {
    out = out.replace(/\b(genocide|ethnic\s+cleansing|hate\s+crime)\b/gi, 'catastrophe');
  }

  return out;
}
