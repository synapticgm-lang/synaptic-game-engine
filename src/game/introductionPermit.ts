/**
 * Introduction Permit — new named entities only via player / bible / manifest / seed.
 */

export type IntroductionPermitSource =
  | 'player_named'
  | 'bible_seed'
  | 'scene_seed'
  | 'manifest'
  | 'none';

export interface IntroductionPermit {
  allowed: boolean;
  source: IntroductionPermitSource;
  reason: string;
}

export function introductionPermitForName(
  name: string,
  args: { playerText: string; manifestRoster: string[]; bibleBlob?: string }
): IntroductionPermit {
  const n = name.trim();
  if (!n) return { allowed: false, source: 'none', reason: 'empty' };
  const lower = n.toLowerCase();
  if (args.manifestRoster.some((r) => r.toLowerCase().includes(lower) || lower.includes(r.toLowerCase()))) {
    return { allowed: true, source: 'manifest', reason: 'Already on Scene Manifest' };
  }
  if (new RegExp(`\\b${escapeRe(n)}\\b`, 'i').test(args.playerText)) {
    return { allowed: true, source: 'player_named', reason: 'Player named this entity' };
  }
  if (args.bibleBlob && new RegExp(`\\b${escapeRe(n)}\\b`, 'i').test(args.bibleBlob)) {
    return { allowed: true, source: 'bible_seed', reason: 'Present in campaign bible/seed' };
  }
  return {
    allowed: false,
    source: 'none',
    reason: 'Not on manifest, not player-named, not in bible — Introduction Permit denied',
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
