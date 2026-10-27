/**
 * M4 — clause-check system prompt + JSON parse (edge-safe; no writerTurn import).
 * Idea only from docs/orders/merge/proto/engine.mjs CHECK_SYS (~441).
 */

/** One atomic claim from the checker model. */
export interface ClauseClaim {
  c: string;
  kind: 'colour' | 'fact';
  support: string;
  severity?: 'serious' | 'minor';
}

/** TurnLog / telemetry row for one clause. */
export interface ClauseCheckRecord {
  clause: string;
  kind: 'colour' | 'fact';
  support: string;
  severity?: 'serious' | 'minor';
  /** True when this clause was the target of the single repair this turn. */
  repaired: boolean;
}

/**
 * Proto CHECK_SYS idea (reference only).
 * SRD 5.2.1 is not the clause taxonomy; facts come from the engine FactSheet only.
 */
export const CLAUSE_CHECK_SYS = `You audit a narration against FACTS, clause by clause.
Step 1: split PROSE into atomic claims (one fact each).
Step 2: for each claim, set kind = "colour" for (weather, light, sound, smell, texture, small gesture or expression of a person listed in FACTS.present or the player) or "colour" also for silence, stillness, absence of action ("says nothing", "nothing else moves"), the player's own body and feelings, and the player's movement along a road the beat says they travelled; "fact" is anything else: names, who is present, who speaks or what they say, directions, distances, times, prices, items, possession, outcomes, injuries, numbers, history, reasons, knowledge, earlier events, objects or features of the place).
Step 3: for each fact, quote the FACTS text that supports it, or "" if none. A fact is supported only if FACTS states it or it follows directly (rephrasing and plain number words are fine). A clause saying the player TRIES something listed in PLAYER is colour; saying it SUCCEEDED or is TRUE needs FACTS. Telling the player that something they claimed does not exist or did not happen IS supported when the beat says so.
If beat.stance / present[].manner gives a person's manner, any clause where that person's tone or behaviour clearly contradicts it (friendly/joking when cold or wary; hostile when warm; chatty when terse) is kind "fact", support empty, c prefixed "OUT OF CHARACTER:", severity serious.
A beat.steps entry that is not done / failed must not be narrated as succeeding — that is kind "fact", support empty, severity serious.
PLAYER claims_not_true narrated as true, remembered, or confirmed is kind "fact", support empty, severity serious.
Reply JSON {"claims":[{"c":"claim","kind":"colour|fact","support":"quoted FACTS text or empty","severity":"serious|minor"}]}.
severity applies to unsupported facts: serious = changes what the player would believe about the world, people, quests, items, possessions or rules; minor = small specific with no later effect.`;

function normalizeClaim(raw: unknown): ClauseClaim | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const c = String(o.c ?? o.claim ?? '').trim();
  if (!c) return null;
  const kindRaw = String(o.kind ?? '').toLowerCase();
  const kind: ClauseClaim['kind'] = kindRaw === 'colour' || kindRaw === 'color' ? 'colour' : 'fact';
  const support = String(o.support ?? '').trim();
  const sevRaw = String(o.severity ?? '').toLowerCase();
  const severity: ClauseClaim['severity'] =
    sevRaw === 'minor' ? 'minor' : sevRaw === 'serious' ? 'serious' : undefined;
  return { c, kind, support, ...(severity ? { severity } : {}) };
}

/** Parse model JSON into claims (tolerant of {claims:[]} or a bare array). */
export function parseClauseClaims(out: unknown): ClauseClaim[] {
  if (!out) return [];
  let body = out;
  if (typeof body === 'string') {
    const trimmed = body.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      body = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(body)
    ? body
    : Array.isArray((body as { claims?: unknown }).claims)
      ? (body as { claims: unknown[] }).claims
      : [];
  return list.map(normalizeClaim).filter((x): x is ClauseClaim => !!x);
}
