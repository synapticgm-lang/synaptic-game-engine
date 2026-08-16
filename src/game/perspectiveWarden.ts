import type { Settings } from './types';

const PLAYER_BODY_KIT =
  'hand|hands|fingers|finger|phone|pockets|pocket|shoulders|shoulder|eyes|eye|grip|back|spine|boots|wallet|bag|backpack|clothes|outfit|arm|arms|wrist|chest|face|head|neck|knee|knees|leg|legs|foot|feet|palm|palms|thumb|thumbs|keys|leatherman';

const POV_VERBS =
  'steps|walks|runs|grabs|looks|turns|says|feels|thinks|reaches|crouches|freezes|edges|scans|grips|pauses|instinctively|watches|brushes|carries|holds|checks|pulls|opens|closes|stands|sits|kneels|answers|asks|speaks|waits|nods|lifts|drops|keeps|starts|stops|tries|searches|places|puts|draws|stares|listens|hears|knows|finds|takes|gives|shakes|raises|lowers';

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
  next = next.replace(new RegExp(`\\b[Hh]is (${PLAYER_BODY_KIT})\\b`, 'g'), 'your $1');
  next = next.replace(new RegExp(`\\b[Hh]er (${PLAYER_BODY_KIT})\\b`, 'g'), 'your $1');
  next = next.replace(/\bwatches him\b/gi, 'watches you');
  next = next.replace(/\bwatches her\b/gi, 'watches you');
  next = next.replace(/\bwatching him\b/gi, 'watching you');
  next = next.replace(/\bwatching her\b/gi, 'watching you');
  next = next.replace(/\b(on|at|toward|towards|behind|beside)\s+him\b/gi, '$1 you');
  next = next.replace(/\b(on|at|toward|towards|behind|beside)\s+her\b/gi, '$1 you');
  return next;
}
