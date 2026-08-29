/**
 * Site-wide art lock: plates and BeatSpec follow committed prose + sceneFacts.
 * Never default to a fallen body on plain slabs (the old Chapter One splash).
 */

import { isChromePersonToken } from './chromeAuthority';

export type SceneArtStance = 'standing' | 'down';

export interface SceneArtFactsInput {
  props?: string[];
  present?: string[];
  lastBeat?: string;
}

const STANCE_STANDING =
  /\b(you stand|you are standing|standing(?:\s+(?:on|in|at|among|before|under|beside))|on your feet|beneath your feet|under (?:your|their) feet)\b/i;

const STANCE_DOWN =
  /\b(on (?:your|their) back|lying (?:on|in|there)|collapsed|fallen|prone|you are (?:alone )?on the floor)\b/i;

const FLOOR_PATTERNS: Array<[RegExp, string]> = [
  [/\bcircular mosaic\b/i, 'circular mosaic of cracked tiles'],
  [/\bmosaic\b/i, 'mosaic floor'],
  [/\b(?:cracked|ancient)\s+tiles\b/i, 'cracked ancient tiles'],
  [/\btiles?\b/i, 'tiled floor'],
  [/\bflagstones?\b/i, 'flagstones'],
  [/\brectangular\s+(?:stone\s+)?slabs?\b/i, 'rectangular stone slabs'],
  [/\bstone slabs?\b/i, 'stone slabs'],
  [/\bcobbl(?:e|estones?)\b/i, 'cobblestones'],
  [/\bsand\b/i, 'sand'],
  [/\bmud\b/i, 'mud'],
  [/\bdirt\b/i, 'dirt'],
  [/\bwood(?:en)?\s+(?:floor|planks|boards)\b/i, 'wooden floor'],
];

function stripTags(text?: string): string {
  return (text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferSceneStance(body: string): SceneArtStance | undefined {
  if (!body.trim()) return undefined;
  if (STANCE_STANDING.test(body)) return 'standing';
  if (STANCE_DOWN.test(body)) return 'down';
  return undefined;
}

export function inferSceneFloor(body: string): string | undefined {
  if (!body.trim()) return undefined;
  for (const [re, label] of FLOOR_PATTERNS) {
    if (re.test(body)) return label;
  }
  return undefined;
}

/** Compact lock injected into memorable, generate-image, and BeatSpec prompts. */
export function formatSceneArtLock(opts: {
  storyText?: string;
  pickedHook?: string;
  location?: string;
  sceneFacts?: SceneArtFactsInput | null;
}): string {
  const committed = stripTags(opts.storyText);
  const hook = opts.pickedHook?.trim() ?? '';
  const body = committed || hook;
  const blob = [body, opts.sceneFacts?.lastBeat, ...(opts.sceneFacts?.props ?? [])]
    .filter(Boolean)
    .join(' ');
  const stance = inferSceneStance(blob);
  const floor = inferSceneFloor(blob);
  const place = opts.location?.trim();
  const present = (opts.sceneFacts?.present ?? [])
    .map((p) => p.trim())
    .filter((p) => p && !isChromePersonToken(p))
    .slice(0, 6);

  const bits: string[] = [
    'SCENE AUTHORITY (committed prose + sceneFacts — match pose, floor, presence, and place; do not invent a different splash):',
  ];
  if (place) bits.push(`PLACE: ${place}.`);
  if (stance === 'standing') {
    bits.push(
      'STANCE: the viewpoint character is standing on their feet — not collapsed, not lying on their back, not fallen.'
    );
  } else if (stance === 'down') {
    bits.push(
      'STANCE: the viewpoint character is lying on the floor / on their back as the beat states, looking up.'
    );
  }
  if (floor) {
    bits.push(`FLOOR: ${floor} — draw this surface, not a generic unused floor type.`);
  }
  if (present.length) {
    bits.push(`PRESENCE: ${present.join(', ')} — do not add unnamed extras.`);
  }
  bits.push(
    'Do not default to a fallen body on plain rectangular stone slabs unless STANCE and FLOOR say so.'
  );
  return bits.join(' ');
}
