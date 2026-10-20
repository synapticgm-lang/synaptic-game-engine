/**
 * Shared round-action classifier (chips + typed). Kept in its own file so roundTyped
 * and roundFight can both import without a cycle.
 */
import type { RoundAction } from '../rules/roundCombat';
import { spellInInput } from '../rules/spells';

const FLEE = /\b(flee|run(?: away| for it)?|escape|retreat|withdraw|bolt)\b/i;
const ATTACK = /\b(attack|fight|strike|engage|slash|stab|shoot|punch|swing|hit|thrust|cut|charge|lash out|loose an arrow)\b/i;

/** The round action a chip or typed line asks for. */
export function classifyRoundAction(input: string): RoundAction {
  const s = (input ?? '').toLowerCase();
  if (/\b(drink|quaff|potion)\b|\buse (?:an? |the |my )?(?:item|potion)\b/.test(s)) return 'item';
  if (/\bdisengage\b|\bstep (?:back|away) (?:carefully|out of reach)\b/.test(s)) return 'disengage';
  if (/\bdodge\b|\bfight defensively\b|\bdefensive\b/.test(s)) return 'dodge';
  if (/\bhide\b|\bslip out of sight\b|\bstealth\b/.test(s)) return 'hide';
  if (/\bhelp\b|\bdistract\b|\bassist\b/.test(s)) return 'help';
  if (/\bcast\b|\bfire bolt\b|\bsacred flame\b|\bspell\b/.test(s) || /\s/.test(spellInInput(s) ?? '')) return 'cast';
  if (FLEE.test(s)) return 'flee';
  if (ATTACK.test(s)) return 'attack';
  return 'other';
}
