/**
 * Site-wide PC name authority — prose / map / chrome tokens are never a locked name.
 * Owner: OpeningContract harvest + Continue repair + Admin/slot display.
 */

export const UNNAMED_ADVENTURER = 'Unknown Survivor';

/** Exact labels (after collapse + lower) that must never lock as character.name. */
const DENIED_PC_NAMES = new Set([
  'here',
  'there',
  'place',
  'now',
  'wait',
  'look',
  'system',
  'panel',
  'registration',
  'circle',
  'you',
  'player',
  'unknown',
  'n/a',
  'na',
  'n.a.',
  'none',
  'adventurer',
  'survivor',
  'unknown survivor',
  'unnamed',
  'unnamed survivor',
  'hero',
  'wanderer',
  'earth',
  'home',
  'room',
  'door',
  'floor',
  'map',
  'entry',
  'official',
  'registrar',
  'handlers',
  'blue panel',
  // map-pin deny (questPlay PIN_DENY / JUNK_PLACE)
  'eye level',
  'your palm',
  'palm',
  'chaos',
  'disbelief',
  'designation',
  'protocol',
  'visual profile',
  'tutorial',
  'quest',
  'salvage',
  'foundation',
  'core',
  'first blood',
  'anyone yet',
  'physical object',
  'waist height',
  'ground level',
  'fear',
  'panic',
  'parse',
  'integration',
  'wave',
  'look down',
  'parse designation',
]);

function normalizeNameKey(raw: string | undefined | null): string {
  return (raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[“”"']/g, '');
}

/** True when this token/phrase must never be stored or shown as the adventurer name. */
export function isDeniedPcName(name?: string | null): boolean {
  const key = normalizeNameKey(name);
  if (!key) return true;
  if (DENIED_PC_NAMES.has(key)) return true;
  if (/^(n\/a|n\.a\.|unknown|player|you)$/i.test(key)) return true;
  return false;
}

/** A real given name the player actually gave (or a harvestable proper name). */
export function isLockablePcName(name?: string | null): boolean {
  const trimmed = (name ?? '').replace(/\s+/g, ' ').trim();
  if (trimmed.length < 2 || trimmed.length > 40) return false;
  if (isDeniedPcName(trimmed)) return false;
  if (!/^[A-Za-z][A-Za-z0-9' -]{0,38}$/.test(trimmed)) return false;
  return true;
}

export function sanitizePcName(name?: string | null): string | null {
  const trimmed = (name ?? '').replace(/\s+/g, ' ').trim();
  return isLockablePcName(trimmed) ? trimmed.slice(0, 40) : null;
}

/** Admin / slot / transcript — never echo a deny-list token as the adventurer. */
export function displayAdventurerName(name?: string | null): string {
  return sanitizePcName(name) ?? UNNAMED_ADVENTURER;
}
