/**
 * Visibility leak scanner — engine notes must not reach player prose.
 */

const ENGINE_LEAK =
  /\b(?:the sheet|not a place you traveled to|not a list of what you are carrying|this is still [A-Z]|CODE ENFORCED|Action Resolved|XP:\s*\d+\s*\/\s*\d+|warden'?s?\s+expectation|engine reading|intent contract|scene manifest|introduction permit|state\s*tx|hookarc)\b/i;

const META_UI =
  /\b(?:click (?:the )?(?:button|choice)|tap (?:here|the)|open (?:your )?(?:inventory|journal|settings) menu|press enter to)\b/i;

export interface LeakScanResult {
  clean: string;
  notes: string[];
}

/** Strip or soften engine/meta leaks from player-facing narrative. */
export function scanAndScrubLeaks(narrative: string): LeakScanResult {
  const notes: string[] = [];
  let text = narrative;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  for (const s of sentences) {
    if (ENGINE_LEAK.test(s) || META_UI.test(s)) {
      notes.push(`Leak scrub: ${s.slice(0, 60)}`);
      continue;
    }
    kept.push(s);
  }
  if (notes.length) {
    text = kept.join(' ').replace(/\s+/g, ' ').trim();
  }
  // Residual phrase scrub
  const before = text;
  text = text
    .replace(/\b(?:the sheet|CODE ENFORCED|Action Resolved)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (text !== before && !notes.length) notes.push('Leak phrase scrub');
  return { clean: text || narrative, notes };
}
