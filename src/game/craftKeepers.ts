/**
 * Thumbs-up keepers — session ring of liked GM beats.
 * Long-term store is gm_response_feedback (positive). This ring teaches the next turn.
 */

import type { EngineMode } from './types';

export type CraftKeeper = {
  mode: EngineMode;
  story: string;
  playerAction?: string;
  turn: number;
};

const MAX_KEEPERS = 4;
const EXCERPT = 420;
const MODES: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];

let keepers: CraftKeeper[] = [];

function asMode(raw: string | null | undefined): EngineMode | null {
  const m = (raw ?? '').toLowerCase();
  return (MODES as string[]).includes(m) ? (m as EngineMode) : null;
}

function excerpt(story: string): string {
  const clean = story.replace(/\s+/g, ' ').trim();
  if (clean.length <= EXCERPT) return clean;
  const slice = clean.slice(0, EXCERPT);
  const lastStop = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  return (lastStop > 120 ? slice.slice(0, lastStop + 1) : slice).trim();
}

export function resetCraftKeepers(): void {
  keepers = [];
}

export function listCraftKeepers(): CraftKeeper[] {
  return keepers.slice();
}

/** Record a thumbs-up beat. Newest first. Dedupes near-identical openings. */
export function noteThumbsUpKeeper(input: {
  mode?: string | null;
  story: string;
  playerAction?: string | null;
  turn: number;
}): CraftKeeper | null {
  const mode = asMode(input.mode);
  const story = excerpt(input.story ?? '');
  if (!mode || story.length < 40) return null;
  const next: CraftKeeper = {
    mode,
    story,
    playerAction: (input.playerAction ?? '').trim() || undefined,
    turn: input.turn,
  };
  keepers = [
    next,
    ...keepers.filter((k) => k.mode !== mode || k.story.slice(0, 80) !== next.story.slice(0, 80)),
  ].slice(0, MAX_KEEPERS);
  return next;
}

/** One liked beat for this mode — shape only, never a second gold essay. */
export function formatLikedKeeperForPrompt(
  engineMode: EngineMode,
  fromState?: CraftKeeper[] | null
): string {
  const pool = fromState?.length ? fromState : keepers;
  const hit = pool.find((k) => k.mode === engineMode);
  if (!hit) return '';
  return `LIKED SHAPE (player thumbs-up, this mode): Copy density and verbs only. Do not copy this room or these names. Honor configured PERSPECTIVE.\n${hit.story}`;
}
