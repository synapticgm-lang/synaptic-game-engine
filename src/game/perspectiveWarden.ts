import type { Settings } from './types';

const PLAYER_BODY_KIT =
  'hand|hands|fingers|finger|phone|pockets|pocket|shoulders|shoulder|eyes|eye|grip|back|spine|boots|wallet|bag|backpack|clothes|outfit|hood|cloak|arm|arms|wrist|chest|face|head|neck|knee|knees|leg|legs|foot|feet|palm|palms|thumb|thumbs|keys|leatherman';

const POV_VERBS =
  'steps|walks|runs|grabs|looks|turns|says|feels|thinks|reaches|crouches|freezes|edges|scans|grips|pauses|instinctively|watches|brushes|carries|holds|checks|pulls|opens|closes|stands|sits|kneels|answers|asks|speaks|waits|nods|lifts|drops|keeps|starts|stops|tries|searches|places|puts|draws|stares|listens|hears|knows|finds|takes|gives|shakes|raises|lowers';

const BODY_KIT_RE = new RegExp(`\\b([Hh]is|[Hh]er) (${PLAYER_BODY_KIT})\\b`, 'g');

/**
 * True when the clause before a his/her body part is clearly about a third-person NPC,
 * not the player. Prevents "He shrugs… his shoulders" → "your shoulders".
 */
const NPC_BODY_VERBS =
  'shrugs?|wipes?|tilts?|tilted|raises?|raised|moves?|moved|nods?|nodded|says?|said|asks?|asked|looks?|looked|stands?|stood|sits?|sat|gestures?|gestured|reaches?|reached|holds?|held|picks?|takes?|took|puts?|brushes?|brushed|keeps?|kept|turns?|turned|watches?|watched|speaks?|spoke|replies?|replied|answers?|answered|squints?|squinted|leans?|leaned|pauses?|paused|inclines?|inclined|furrows?|furrowed|shakes?|shook|bows?|bowed';

function clauseIsNpcSubject(clauseBefore: string, characterName?: string): boolean {
  const clause = clauseBefore.trim();
  if (!clause) return false;
  const name = (characterName ?? '').trim();
  if (name.length >= 2) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // PC name as subject → player body.
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(clause) && !/\b(?:he|she|they)\b/i.test(clause)) {
      return false;
    }
  }
  // Player handling kit: "…watches you pick up his phone" → player body, not NPC.
  if (
    /\byou\s+(?:\w+\s+){0,3}(?:pick(?:s|ed)?\s+up|grab(?:s|bed)?|hold(?:s|ing)?|take(?:s|n)?|put(?:s|ting)?|open(?:s|ing)?|check(?:s|ing)?|reach(?:es|ed|ing)?)\s*$/i.test(
      clause
    )
  ) {
    return false;
  }
  // He/She/They (or role noun) as subject — even when "you" is the object ("looks at you, his eyes").
  if (
    /(?:^|[;,:]\s*|\b(?:as|while|when|and|but)\s+)(?:he|she|they)\b/i.test(clause)
    || new RegExp(
      String.raw`\b(?:he|she|they)\s+(?:\w+['’]?\w*\s+){0,4}(?:${NPC_BODY_VERBS})\b`,
      'i'
    ).test(clause)
    || /\bthe\s+(?:\w+\s+){0,3}(?:handler|registrar|man|woman|guard|sleeper|chirurgeon|official|figure|attendant|clerk|nurse|priest|soldier|stranger|voice|merchant|vendor|innkeeper)\b/i.test(
      clause
    )
  ) {
    return true;
  }
  // Player already in frame as actor — his/her body is likely a POV slip
  // when no NPC subject above.
  if (/\byou\b|\byour\b/i.test(clause)) return false;
  return false;
}

/**
 * Rewrite his/her body kit → your only in player-referent clauses.
 * NPC "his hands / his shoulders" stay third-person.
 */
export function rewritePlayerBodyPossessives(text: string, characterName?: string): string {
  return text.replace(BODY_KIT_RE, (match, _poss: string, body: string, offset: number, full: string) => {
    const before = full.slice(0, offset);
    const breakAt = Math.max(
      before.lastIndexOf('.'),
      before.lastIndexOf('!'),
      before.lastIndexOf('?'),
      before.lastIndexOf('\n')
    );
    const clause = before.slice(breakAt + 1);
    if (clauseIsNpcSubject(clause, characterName)) return match;
    return `your ${body}`;
  });
}

/** Code-owned perspective pass. Cheap regex — not a second writer. */
export function enforcePerspective(
  text: string,
  settings: Pick<Settings, 'perspective'>,
  characterName?: string
): string {
  if (settings.perspective !== 'second-person') return text;
  let next = text;
  const name = (characterName ?? '').trim();
  if (name && name.length >= 2) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const subject = new RegExp(`\\b${escaped}\\s+(${POV_VERBS})\\b`, 'gi');
    next = next.replace(subject, (_m, verb: string) => `You ${String(verb).toLowerCase()}`);
    next = next.replace(new RegExp(`\\b${escaped}'s\\b`, 'g'), 'Your');
  }
  // Convert player-as-him slips first so scoped body rewrite sees "you" in the clause.
  next = next.replace(/\bwatches him\b/gi, 'watches you');
  next = next.replace(/\bwatches her\b/gi, 'watches you');
  next = next.replace(/\bwatching him\b/gi, 'watching you');
  next = next.replace(/\bwatching her\b/gi, 'watching you');
  next = next.replace(/\b(on|at|toward|towards|behind|beside)\s+him\b/gi, '$1 you');
  next = next.replace(/\b(on|at|toward|towards|behind|beside)\s+her\b/gi, '$1 you');
  next = rewritePlayerBodyPossessives(next, name || undefined);
  return next;
}
