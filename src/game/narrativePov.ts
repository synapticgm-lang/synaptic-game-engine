/**
 * 28n — narrative point of view for the writer prompt.
 * Default is hybrid: story prose in close third person on the player character (name + pronoun);
 * System voice (notifications, level-ups, stat/loot screens, engine prompts, choices) in second person.
 * Structural only: this shapes the prompt and its examples. No regex rewrites of writer output.
 */
import type { NarrativePerspective } from './types';
import { sanitizePcName } from './pcNameAuthority';

export const DEFAULT_PERSPECTIVE: NarrativePerspective = 'hybrid';

export function resolvePerspective(value?: unknown): NarrativePerspective {
  return value === 'first-person' || value === 'second-person' || value === 'third-person' || value === 'hybrid'
    ? value
    : DEFAULT_PERSPECTIVE;
}

export type PcPov = {
  perspective: NarrativePerspective;
  /** Locked PC name, or a role label before a name is locked. */
  name: string;
  named: boolean;
  he: string;
  him: string;
  his: string;
};

const UNNAMED_PC_LABEL = 'the newcomer';

function pronounsFor(gender?: string | null): Pick<PcPov, 'he' | 'him' | 'his'> {
  const g = (gender ?? '').toLowerCase();
  if (/\b(?:woman|female|girl|lady|she)\b/.test(g)) return { he: 'she', him: 'her', his: 'her' };
  if (/\b(?:man|male|boy|he)\b/.test(g)) return { he: 'he', him: 'him', his: 'his' };
  return { he: 'they', him: 'them', his: 'their' };
}

export function pcPov(
  pc: { name?: string | null; gender?: string | null } | null | undefined,
  perspective?: unknown
): PcPov {
  const locked = sanitizePcName(pc?.name);
  return {
    perspective: resolvePerspective(perspective),
    name: locked ?? UNNAMED_PC_LABEL,
    named: !!locked,
    ...pronounsFor(pc?.gender),
  };
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** True when story prose follows the PC in third person (hybrid or full third). */
export function narratesPcInThirdPerson(pov: PcPov): boolean {
  return pov.perspective === 'hybrid' || pov.perspective === 'third-person';
}

/** Subject used for the PC in a story sentence: "Jax" / "You" / "I". */
export function pcStorySubject(pov: PcPov): string {
  if (narratesPcInThirdPerson(pov)) return cap(pov.name);
  return pov.perspective === 'first-person' ? 'I' : 'You';
}

/**
 * Pick the example line for this POV. `third` may use {N} (PC name), {he}/{him}/{his}
 * and {He}/{His} placeholders.
 */
export function povExample(pov: PcPov, lines: { second: string; third: string; first?: string }): string {
  if (narratesPcInThirdPerson(pov)) {
    return lines.third
      .replace(/\{N\}/g, cap(pov.name))
      .replace(/\{He\}/g, cap(pov.he))
      .replace(/\{His\}/g, cap(pov.his))
      .replace(/\{he\}/g, pov.he)
      .replace(/\{him\}/g, pov.him)
      .replace(/\{his\}/g, pov.his);
  }
  if (pov.perspective === 'first-person' && lines.first) return lines.first;
  return lines.second;
}

/** The PERSPECTIVE rule for the writer system prompt. */
export function formatPerspectiveRule(pov: PcPov): string {
  const n = cap(pov.name);
  const pr = `${pov.he}/${pov.him}/${pov.his}`;
  const unnamed = pov.named
    ? ''
    : `\n  • No name is locked yet: call the player character "${pov.name}" (${pr}) until a name is given.`;
  if (pov.perspective === 'first-person') {
    return 'PERSPECTIVE: FIRST PERSON. Story prose follows the player character as I/me/my. System voice (<system>, <system-log>, level-ups, stat/loot screens, choices) stays second person ("You have gained a level").';
  }
  if (pov.perspective === 'second-person') {
    return 'PERSPECTIVE: SECOND PERSON (ENTIRE TURN). Address the player character as you/your in story prose and System voice alike. Do not flip to third person mid-paragraph.';
  }
  if (pov.perspective === 'third-person') {
    return `PERSPECTIVE: THIRD PERSON. Story prose follows ${n} by name and ${pr}. Never "you/your" or "I/me/my" for ${n} in story prose.${unnamed}`;
  }
  return [
    'PERSPECTIVE: HYBRID — two voices, two grammatical persons.',
    `  • STORY PROSE: close third person on the player character. Call them ${n} and ${pr}. Stay in ${n}'s senses and reactions; the camera follows ${pov.him}. Never "you/your" or "I/me/my" for ${n} in story prose. NPCs stay third person. Keep the tense the beat asks for.`,
    '  • SYSTEM VOICE stays second person: <system> notifications, level-ups, stat and loot screens, <system-log> lines, engine prompts, and numbered choices ("You have gained a level." / "1. Force the door").',
    `  • Quoted NPC speech may still say "you" to ${n}.`,
  ].join('\n') + unnamed;
}
