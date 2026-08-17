import type { ComicOverlayEdit, GameState, Rarity } from './types';
import type { ComicTextAnchor } from '@/types/comicScript';

export type BookPageKind = 'panel' | 'milestone' | 'loot-video' | 'prose' | 'player-action';

export interface BookPage {
  id: string;
  turn: number;
  kind: BookPageKind;
  /** Narrative text for this page — tags already stripped, ready to lay out as-is. */
  text: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  /** Milestones/loot-videos always start a fresh page in the printed book. */
  forcedBreakBefore?: boolean;
  textAnchor?: ComicTextAnchor;
  overlayEdits?: ComicOverlayEdit[];
  meta?: { panelIndex?: number; lootItemName?: string; lootItemRarity?: Rarity; splashTitle?: string };
}

/**
 * Pure, React-independent projection of `GameState.log` into a flat, JSON-serializable
 * page list. This is the actual contract the future Node.js/Puppeteer PDF compiler consumes
 * — it can walk this array directly (or a server can regenerate the identical shape from the
 * saved JSON) without needing the live app's component tree or any DOM scraping heuristics.
 *
 * Kept deliberately dependency-free (no React, no browser APIs) so it can run in Node as-is.
 */
export function buildBookManifest(state: GameState): BookPage[] {
  const pages: BookPage[] = [];

  for (const entry of state.log) {
    if (entry.role === 'player') {
      pages.push({ id: `${entry.id}-action`, turn: entry.turn, kind: 'player-action', text: entry.content });
      continue;
    }

    if (entry.entryKind === 'milestone') {
      pages.push({
        id: entry.id,
        turn: entry.turn,
        kind: 'milestone',
        text: entry.content,
        imageUrl: entry.imageUrls?.[0] ?? null,
        forcedBreakBefore: true,
        meta: { splashTitle: entry.splashTitle },
      });
      continue;
    }

    if (entry.mediaKind === 'video') {
      pages.push({
        id: entry.id,
        turn: entry.turn,
        kind: 'loot-video',
        text: entry.content,
        videoUrl: entry.videoUrl ?? null,
        forcedBreakBefore: true,
        meta: { lootItemName: entry.lootItemName, lootItemRarity: entry.lootItemRarity },
      });
      continue;
    }

    if (entry.panels && entry.panels.length > 0) {
      entry.panels.forEach((panel, idx) => {
        pages.push({
          id: `${entry.id}-panel-${idx}`,
          turn: entry.turn,
          kind: 'panel',
          text: panel.narrative,
          imageUrl: panel.imageUrl ?? null,
          textAnchor: panel.textAnchor,
          overlayEdits: panel.overlayEdits,
          meta: { panelIndex: idx },
        });
      });
      continue;
    }

    if (entry.imageUrls && entry.imageUrls.length > 0) {
      pages.push({ id: entry.id, turn: entry.turn, kind: 'panel', text: entry.content, imageUrl: entry.imageUrls[0] });
      continue;
    }

    if (entry.role === 'gm') {
      pages.push({ id: entry.id, turn: entry.turn, kind: 'prose', text: entry.content });
    }
  }

  return pages;
}
