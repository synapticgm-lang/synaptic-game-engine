import type { ArtStylePreset } from '@/game/types';

/**
 * Phase 3 — PDF Exporter Engine.
 *
 * Print-on-demand format presets. Dimensions are TRIM size (the final cut size of the book) —
 * bleed is added on top of these via `PdfExportOptions.bleedMarginInches` when composing pages,
 * per standard POD conventions (Lulu / Mixam both expect trim size + bleed, not trim-inclusive-bleed).
 */
export type PrintFormat = 'a5_manga' | 'us_trade';

export interface PrintFormatSpec {
  id: PrintFormat;
  label: string;
  /** Trim width, inches. */
  widthIn: number;
  /** Trim height, inches. */
  heightIn: number;
}

export const PRINT_FORMATS: Record<PrintFormat, PrintFormatSpec> = {
  a5_manga: { id: 'a5_manga', label: 'A5 Manga', widthIn: 5.8, heightIn: 8.3 },
  us_trade: { id: 'us_trade', label: 'US Trade Comic', widthIn: 6.625, heightIn: 10.25 },
};

/** How many panels to pack onto each story-page grid. `'auto'` picks 2-4 per page based on
 *  how many consecutive panels are available, preferring 4 and only using fewer for the tail. */
export type PanelsPerPageMode = 2 | 3 | 4 | 'auto';

export interface PdfExportOptions {
  format: PrintFormat;
  title: string;
  author: string;
  /** Render a title cover page. Default true. */
  includeCover?: boolean;
  /** When true (ended runs), append epilogue back matter instead of front stats. */
  includeEpilogue?: boolean;
  /** Render a character sheet / lore recap page after the cover. Default true. */
  includeStatsPage?: boolean;
  /** Target raster resolution for embedded panel artwork, in pixels-per-inch. Default 300
   *  (standard print quality). Vector content — speech bubbles, captions, SFX, page text — is
   *  unaffected by this value; it is always drawn at native PDF vector resolution. */
  dpi?: number;
  /** Bleed extended past the trim edge on all four sides, inches. Default 0.125 (standard POD bleed). */
  bleedMarginInches?: number;
  /** Safe area inset from the trim edge that panel grids/text are kept within, inches. Default 0.25. */
  safeMarginInches?: number;
  /** Panels per story-page grid. Default `'auto'`. */
  panelsPerPage?: PanelsPerPageMode;
  /** Active illustration style — used to theme speech-bubble/caption/panel-border vector
   *  rendering to match the in-app `StyleSpec.ui_overlay_theme` for the given preset. Defaults
   *  to `'classic-book'` if omitted. */
  artStylePreset?: ArtStylePreset;
  /** Optional progress callback for long sessions (image loading/compositing is async). */
  onProgress?: (info: { stage: string; current: number; total: number }) => void;
  /**
   * When true (default), bake each panel's artwork + speech/caption overlays into a single
   * high-resolution canvas snapshot before embedding in the PDF. Matches on-screen Editor Mode
   * placement. When false, falls back to vector bubble chips drawn by jsPDF.
   */
  bakeOverlays?: boolean;
}

/** A single comic panel as laid out on a printed page: artwork + its narrative text, already
 *  positioned as one cell within a `BookPage`'s grid. */
export interface BookPagePanel {
  imageUrl: string | null;
  /** Narrative text for this panel, tags (`<dialogue>`, `<thought>`, etc.) intact — the PDF
   *  compositor parses these itself (via `parseNarrativeSegments`) to draw the matching vector
   *  speech-bubble/caption/SFX overlay, mirroring how `ComicGrid.tsx` renders them on screen. */
  narrativeText: string;
  /** Director-planned negative space for baked canvas overlays. */
  textAnchor?: import('@/types/comicScript').ComicTextAnchor;
  /** Pre-export editor overrides (drag offsets + edited bubble text). */
  overlayEdits?: import('@/game/types').ComicOverlayEdit[];
  lootItemName?: string;
  lootItemRarity?: import('@/game/types').Rarity;
  splashTitle?: string;
}

/**
 * One physical printed page/spread, containing 1 to 4 comic panels arranged in a grid. This is
 * distinct from (and built from) `game/bookManifest.ts`'s `BookPage` — that one is a flat,
 * one-entry-per-manifest-item projection of the game log; this one is the *packed*, print-ready
 * page produced by `pdfExportService.ts` after grouping manifest entries into page grids.
 */
export interface BookPage {
  pageNumber: number;
  turn: number;
  /** 1-4 panels for a normal story-page grid. Cover/milestone/loot-video pages use a single
   *  full-bleed "panel" entry instead of a grid. */
  panels: BookPagePanel[];
  /** Milestone and legendary loot-video pages render full-bleed rather than in a multi-panel grid. */
  isFullBleedFeature?: boolean;
  /** Pages with no artwork at all (pure prose / player-action recap) flow as body text instead
   *  of an image grid. */
  isTextOnly?: boolean;
}
