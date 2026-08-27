/**
 * 29a STATUS prompt-leak firewall — strip control tags from player chrome.
 * Debug retains raw text in turns.jsonl / debug export only.
 */

const DENIED_TAG_PATTERNS: RegExp[] = [
  /\[\s*gm[\s_-]*voice(?:[\s_-]*profile)?[^\]]*\]/gi,
  /\[\s*pyoa\s*\]/gi,
  /\[\s*render[\s_-]*fallback[\s_-]*used[^\]]*\]/gi,
  /\[\s*campaign[\s_-]*contract[^\]]*\]/gi,
  /\[\s*(system|developer|assistant|tool)\s*\]/gi,
  /<\s*\/?\s*(system|developer|assistant|tool(?:_call)?)\b[^>]*>/gi,
  /^\s*(?:begin|end)?\s*(?:system|developer|internal)?\s*prompt\s*[:\-]?\s*$/gim,
  /^\s*(?:system_prompt|campaign_contract|render_fallback_used|renderFallbackUsed)\s*[:=].*$/gim,
  /RenderFallbackUsed\s*[:=]\s*\w+/gi,
  /\[Campaign Contract[^\]]*\]/gi,
];

const SAFE_FALLBACK_LINE = 'Beat resolved — continuing from committed state.';

export interface StatusFirewallResult {
  lines: string[];
  stripped: number;
  usedFallback: boolean;
}

/** Strip denied control tags from a single STATUS / systemLog line. */
export function scrubStatusLeakLine(line: string): { line: string; stripped: boolean } {
  if (!line) return { line, stripped: false };
  let out = line;
  let stripped = false;
  for (const re of DENIED_TAG_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) {
      stripped = true;
      re.lastIndex = 0;
      out = out.replace(re, '').replace(/\s{2,}/g, ' ').trim();
    }
  }
  // Bracketed internal keys that survived
  if (/\[\s*[A-Z][A-Z0-9_]*\s*(?:PROFILE|USED|CONTRACT)?[^\]]*\]/.test(out) &&
      /GM_VOICE|PYOA|RenderFallback|Campaign\s*Contract|SYSTEM|DEVELOPER/i.test(out)) {
    stripped = true;
    out = out.replace(/\[[^\]]*\]/g, '').replace(/\s{2,}/g, ' ').trim();
  }
  if (!out && stripped) {
    return { line: SAFE_FALLBACK_LINE, stripped: true };
  }
  return { line: out, stripped };
}

/** Firewall an array of player-facing STATUS / systemLog lines. */
export function applyStatusFirewall(lines: string[]): StatusFirewallResult {
  let stripped = 0;
  const out: string[] = [];
  for (const raw of lines) {
    const r = scrubStatusLeakLine(raw);
    if (r.stripped) stripped += 1;
    if (r.line) out.push(r.line);
  }
  if (stripped > 0 && out.length === 0) {
    return { lines: [SAFE_FALLBACK_LINE], stripped, usedFallback: true };
  }
  return { lines: out, stripped, usedFallback: false };
}

/** Firewall free-form prose that may carry sealed-manifest debug tags. */
export function scrubProseControlTags(prose: string): string {
  if (!prose) return prose;
  let out = prose;
  for (const re of DENIED_TAG_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, '').replace(/\s{2,}/g, ' ');
  }
  // Common sealed fallback suffix
  out = out.replace(/\s*\[RenderFallbackUsed:[^\]]*\]/gi, '');
  return out.replace(/\s{2,}/g, ' ').trim();
}

export function hasStatusLeak(text: string): boolean {
  if (!text) return false;
  for (const re of DENIED_TAG_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(text)) return true;
  }
  return false;
}
