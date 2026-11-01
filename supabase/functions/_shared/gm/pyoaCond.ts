/**
 * PYOA flag conditions (pure, no imports so scripts can import it directly).
 *
 * A condition is a plain JSON object used by authored books:
 *   { "cover": "tailor" }                      flag equals value
 *   { "cover": ["tailor", "livery"] }          flag equals any listed value
 *   { "faceKnown": "_" }                       flag is unset
 *   { "cabal": true }                          flag is set to anything
 *   { "cover": "tailor", "cabal": "known" }    every key must match (AND)
 *   { "not": { "faceKnown": "yes" } }          negation
 *   { "any": [ { ... }, { ... } ] }            at least one branch matches (OR)
 * `not` and `any` are reserved words and may be mixed with flag keys (all parts must hold).
 * An empty or missing condition is always true.
 */
export type PyoaFlagValue = string | boolean;
export type PyoaFlagMap = Record<string, PyoaFlagValue | undefined>;
export type PyoaCondValue = PyoaFlagValue | PyoaFlagValue[];
export interface PyoaCond {
  not?: PyoaCond;
  any?: PyoaCond[];
  [flag: string]: PyoaCondValue | PyoaCond | PyoaCond[] | undefined;
}

const RESERVED = new Set(['not', 'any']);

function flagMatches(actual: PyoaFlagValue | undefined, want: PyoaCondValue): boolean {
  const wants = Array.isArray(want) ? want : [want];
  return wants.some((w) => {
    if (w === true) return actual !== undefined && actual !== false && actual !== '';
    if (w === '_') return actual === undefined || actual === false || actual === '';
    return actual !== undefined && String(actual) === String(w);
  });
}

export function pyoaCondHolds(cond: PyoaCond | null | undefined, flags: PyoaFlagMap | null | undefined): boolean {
  if (!cond || typeof cond !== 'object') return true;
  const f = flags ?? {};
  for (const [key, want] of Object.entries(cond)) {
    if (want === undefined) continue;
    if (key === 'not') {
      if (pyoaCondHolds(want as PyoaCond, f)) return false;
    } else if (key === 'any') {
      const branches = want as PyoaCond[];
      if (Array.isArray(branches) && branches.length && !branches.some((b) => pyoaCondHolds(b, f))) return false;
    } else if (!flagMatches(f[key], want as PyoaCondValue)) {
      return false;
    }
  }
  return true;
}

/** Every flag name a condition reads (for linters). */
export function pyoaCondFlags(cond: PyoaCond | null | undefined, out: Set<string> = new Set()): Set<string> {
  if (!cond || typeof cond !== 'object') return out;
  for (const [key, want] of Object.entries(cond)) {
    if (key === 'not') pyoaCondFlags(want as PyoaCond, out);
    else if (key === 'any') for (const b of (want as PyoaCond[]) ?? []) pyoaCondFlags(b, out);
    else if (!RESERVED.has(key)) out.add(key);
  }
  return out;
}

/** Every [flag, value] pair a condition tests for equality (for payoff coverage). */
export function pyoaCondReads(cond: PyoaCond | null | undefined, out: Array<[string, string]> = []): Array<[string, string]> {
  if (!cond || typeof cond !== 'object') return out;
  for (const [key, want] of Object.entries(cond)) {
    if (key === 'not') pyoaCondReads(want as PyoaCond, out);
    else if (key === 'any') for (const b of (want as PyoaCond[]) ?? []) pyoaCondReads(b, out);
    else if (!RESERVED.has(key)) {
      for (const w of Array.isArray(want) ? (want as PyoaFlagValue[]) : [want as PyoaFlagValue]) out.push([key, String(w)]);
    }
  }
  return out;
}

/** One authored text variant. All matching variants apply in order. */
export interface PyoaPageVariant {
  when: PyoaCond;
  /** Replaces the whole page text (rare; last matching replace wins before before/after are added). */
  replace?: string;
  /** Paragraph(s) placed before the base page text. */
  before?: string;
  /** Paragraph(s) placed after the base page text. */
  after?: string;
}

/** Resolve a page's text for the player's flags. Pure; never throws on bad variants. */
export function resolvePyoaPage(
  page: string | undefined,
  variants: PyoaPageVariant[] | undefined,
  flags: PyoaFlagMap | null | undefined
): string {
  let text = (page ?? '').trim();
  if (!variants?.length) return text;
  const hits = variants.filter((v) => v && pyoaCondHolds(v.when, flags));
  for (const v of hits) if (typeof v.replace === 'string' && v.replace.trim()) text = v.replace.trim();
  const before = hits.map((v) => (v.before ?? '').trim()).filter(Boolean);
  const after = hits.map((v) => (v.after ?? '').trim()).filter(Boolean);
  return [...before, text, ...after].filter(Boolean).join('\n\n');
}
