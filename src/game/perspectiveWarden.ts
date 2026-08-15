import type { Settings } from './types';

/** Code-owned perspective pass. Cheap regex — not a second writer. */
export function enforcePerspective(
  text: string,
  settings: Pick<Settings, 'perspective'>,
  characterName?: string
): string {
  if (settings.perspective !== 'second-person') return text;
  const name = (characterName ?? '').trim();
  if (!name || name.length < 2) return text;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const subject = new RegExp(`\\b${escaped}\\s+(steps|walks|runs|grabs|looks|turns|says|feels|thinks|reaches|crouches|freezes|edges|scans|grips|pauses|instinctively)\\b`, 'gi');
  let next = text.replace(subject, (_m, verb: string) => `You ${String(verb).toLowerCase()}`);
  next = next.replace(new RegExp(`\\b${escaped}'s\\b`, 'g'), 'Your');
  next = next.replace(/\btheir (hand|grip|spine|back|boots|fingers|pockets|eyes|knife)\b/gi, 'your $1');
  next = next.replace(/\bthey (pause|scan|edge|crouch|freeze|reach|grip|know)\b/gi, 'you $1');
  return next;
}
