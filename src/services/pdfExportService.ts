import { jsPDF, GState } from 'jspdf';
import type { GameState, Rarity } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import { buildBookManifest, type BookPage as ManifestPage } from '@/game/bookManifest';
import { parseNarrativeSegments, type NarrativeSegment } from '@/components/comic/NarrativeText';
import { getStyleSpec } from '@/styles/styleSpecs';
import type { UiOverlayTheme } from '@/styles/styleSpecs';
import { debugLogger } from '@/game/debugLogger';
import { bakeComicPanelSnapshot } from '@/utils/comicPageCompositor';
import {
  PRINT_FORMATS,
  type PdfExportOptions,
  type BookPage,
  type BookPagePanel,
  type PanelsPerPageMode,
} from '@/types/pdfExport';

/**
 * Phase 3 — PDF Exporter Engine.
 *
 * Standalone module: reads `GameState` and produces a print-ready PDF `Blob`. Does not modify
 * the math engine, the LLM Director (Phase 2), or the image generator pipeline (Phase 1) — it
 * only consumes their already-generated output (`game/bookManifest.ts`'s flat page list, and
 * whatever `imageUrl`s already exist on log entries/panels).
 *
 * Rendering strategy:
 * - Raster artwork is composited through an offscreen <canvas> sized to the panel's physical
 *   box at the target DPI (default 300), then embedded as a JPEG — true 300 DPI-equivalent
 *   print resolution for the art itself.
 * - Everything else (speech bubbles, captions, SFX chips, panel borders, body text, the cover,
 *   the stats page) is drawn with jsPDF's native vector primitives (rect/roundedRect/text), so
 *   it stays perfectly crisp at any print size — never rasterized.
 */

const DEFAULT_SAFE_MARGIN_IN = 0.25;
const GRID_GUTTER_IN = 0.09;
const DEFAULT_DPI = 300;
const DEFAULT_BLEED_IN = 0.125;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// Color / font helpers — map CSS-ish theme tokens (from styleSpecs.ts, authored for the web
// overlay layer) onto jsPDF's primitive color/font APIs.
// ---------------------------------------------------------------------------

function parseCssColor(css: string): { r: number; g: number; b: number; a: number } {
  const rgbaMatch = css.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    };
  }
  const hex = css.trim().replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b, a: 1 };
  }
  if (hex.length >= 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

/** jsPDF's built-in fonts (helvetica/times/courier) are still real vector fonts — crisp at any
 *  print size — but there's no custom-font-embedding pipeline yet, so we approximate each
 *  style's web font stack with the closest built-in family. */
function mapFontFamily(cssFontStack: string): 'helvetica' | 'times' | 'courier' {
  const s = cssFontStack.toLowerCase();
  if (s.includes('mono') || s.includes('courier') || s.includes('orbitron')) return 'courier';
  if (s.includes('serif') || s.includes('garamond') || s.includes('georgia') || s.includes('fell')) return 'times';
  return 'helvetica';
}

/** Rough CSS px -> inches conversion (96px/in) clamped to a sane vector line-weight range for print. */
function pxToInClamped(pxValue: string, min = 0.008, max = 0.045): number {
  const n = parseFloat(pxValue) || 1;
  return Math.min(max, Math.max(min, n / 96));
}

// ---------------------------------------------------------------------------
// Panel-grid layout
// ---------------------------------------------------------------------------

function layoutGrid(count: number, area: Rect): Rect[] {
  const g = GRID_GUTTER_IN;
  if (count <= 1) return [area];

  if (count === 2) {
    const h = (area.h - g) / 2;
    return [
      { x: area.x, y: area.y, w: area.w, h },
      { x: area.x, y: area.y + h + g, w: area.w, h },
    ];
  }

  if (count === 3) {
    const topH = area.h * 0.58;
    const bottomH = area.h - topH - g;
    const halfW = (area.w - g) / 2;
    return [
      { x: area.x, y: area.y, w: area.w, h: topH },
      { x: area.x, y: area.y + topH + g, w: halfW, h: bottomH },
      { x: area.x + halfW + g, y: area.y + topH + g, w: halfW, h: bottomH },
    ];
  }

  // 4-panel classic 2x2 grid.
  const halfW = (area.w - g) / 2;
  const halfH = (area.h - g) / 2;
  return [
    { x: area.x, y: area.y, w: halfW, h: halfH },
    { x: area.x + halfW + g, y: area.y, w: halfW, h: halfH },
    { x: area.x, y: area.y + halfH + g, w: halfW, h: halfH },
    { x: area.x + halfW + g, y: area.y + halfH + g, w: halfW, h: halfH },
  ];
}

// ---------------------------------------------------------------------------
// Image loading + high-DPI canvas compositing
// ---------------------------------------------------------------------------

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url.slice(0, 80)}`));
    img.src = url;
  });
}

/** Draws `img` into a `boxWidthIn` x `boxHeightIn` canvas at `dpi` pixels-per-inch using
 *  object-fit: cover semantics (fills the box, crops overflow, never stretches/distorts —
 *  matches the on-screen ComicPanelCell behavior), then returns a JPEG data URL. */
function compositeImageAtDpi(img: HTMLImageElement, boxWidthIn: number, boxHeightIn: number, dpi: number): string {
  const pxW = Math.max(1, Math.round(boxWidthIn * dpi));
  const pxH = Math.max(1, Math.round(boxHeightIn * dpi));
  const canvas = document.createElement('canvas');
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable for PDF image compositing.');

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const srcRatio = srcW / srcH;
  const boxRatio = pxW / pxH;

  const drawW = pxW;
  const drawH = pxH;
  let sx = 0;
  let sy = 0;
  let sW = srcW;
  let sH = srcH;

  if (srcRatio > boxRatio) {
    // Source is wider than the box — crop left/right.
    sW = srcH * boxRatio;
    sx = (srcW - sW) / 2;
  } else {
    // Source is taller than the box — crop top/bottom.
    sH = srcW / boxRatio;
    sy = (srcH - sH) / 2;
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, pxW, pxH);
  ctx.drawImage(img, sx, sy, sW, sH, 0, 0, drawW, drawH);

  if (srcW < boxWidthIn * dpi || srcH < boxHeightIn * dpi) {
    debugLogger.record('WARN', 'PDF export: source image is below target print DPI (will be upscaled)', {
      srcW,
      srcH,
      requiredPx: `${Math.round(boxWidthIn * dpi)}x${Math.round(boxHeightIn * dpi)}`,
      dpi,
    });
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Loads + composites a panel's artwork for its final print box. Returns null (rather than
 *  throwing) on any failure so a single broken image can never abort the whole export — the
 *  caller draws a placeholder frame instead, mirroring the app's existing error-placeholder
 *  behavior for failed image generation. */
async function resolvePanelArtwork(imageUrl: string | null, box: Rect, dpi: number): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const img = await loadHtmlImage(imageUrl);
    return compositeImageAtDpi(img, box.w, box.h, dpi);
  } catch (err) {
    debugLogger.record('ERROR', 'PDF export: failed to load/composite panel artwork', {
      imageUrl: imageUrl.slice(0, 100),
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Manifest -> print-page packing
// ---------------------------------------------------------------------------

function resolvePanelsPerPage(mode: PanelsPerPageMode | undefined, remaining: number): number {
  if (mode === 2 || mode === 3 || mode === 4) return Math.min(mode, remaining);
  // 'auto' (default): prefer full grids of 4, but don't strand a single trailing panel alone
  // on an otherwise-empty page when 2 or 3 would pack it in evenly instead.
  if (remaining >= 4) return 4;
  return remaining;
}

/**
 * Groups the flat manifest (one entry per log item, from `game/bookManifest.ts`) into
 * print-ready `BookPage`s: consecutive illustrated panels are packed into grids of up to 4,
 * milestone/loot-video entries each get a dedicated full-bleed page, and prose/player-action
 * runs (no artwork) are bundled into text-only pages.
 */
function packPagesForPrint(manifest: ManifestPage[], panelsPerPage: PanelsPerPageMode | undefined): BookPage[] {
  const pages: BookPage[] = [];
  let pendingPanelGroup: ManifestPage[] = [];
  let pendingTextGroup: ManifestPage[] = [];

  const flushPanelGroup = () => {
    let i = 0;
    while (i < pendingPanelGroup.length) {
      const remaining = pendingPanelGroup.length - i;
      const take = resolvePanelsPerPage(panelsPerPage, remaining);
      const chunk = pendingPanelGroup.slice(i, i + take);
      pages.push({
        pageNumber: 0, // finalized after all pages are known
        turn: chunk[0].turn,
        panels: chunk.map((c) => ({
          imageUrl: c.imageUrl ?? null,
          narrativeText: c.text,
          textAnchor: c.textAnchor,
          overlayEdits: c.overlayEdits,
        })),
      });
      i += take;
    }
    pendingPanelGroup = [];
  };

  const flushTextGroup = () => {
    if (pendingTextGroup.length === 0) return;
    pages.push({
      pageNumber: 0,
      turn: pendingTextGroup[0].turn,
      panels: [{ imageUrl: null, narrativeText: pendingTextGroup.map((p) => p.text).join('\n\n') }],
      isTextOnly: true,
    });
    pendingTextGroup = [];
  };

  for (const entry of manifest) {
    if (entry.forcedBreakBefore) {
      flushPanelGroup();
      flushTextGroup();
    }

    if (entry.kind === 'milestone' || entry.kind === 'loot-video') {
      flushPanelGroup();
      flushTextGroup();
      pages.push({
        pageNumber: 0,
        turn: entry.turn,
        isFullBleedFeature: true,
        panels: [
          {
            imageUrl: entry.imageUrl ?? null,
            narrativeText: entry.text,
            lootItemName: entry.meta?.lootItemName,
            lootItemRarity: entry.meta?.lootItemRarity,
          },
        ],
      });
      continue;
    }

    if (entry.kind === 'panel' && entry.imageUrl) {
      flushTextGroup();
      pendingPanelGroup.push(entry);
      continue;
    }

    // 'prose' / 'player-action', or a 'panel' entry that never got an image — no artwork to
    // grid, so it flows as body text instead.
    flushPanelGroup();
    pendingTextGroup.push(entry);
  }

  flushPanelGroup();
  flushTextGroup();

  pages.forEach((p, i) => { p.pageNumber = i + 1; });
  return pages;
}

// ---------------------------------------------------------------------------
// Vector narrative overlay (speech bubbles / thought / system / SFX / captions)
// ---------------------------------------------------------------------------

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' = 'left'
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, i) => {
    const lineX = align === 'center' ? x + maxWidth / 2 : x;
    doc.text(line, lineX, y + i * lineHeight, { align });
  });
  return lines.length * lineHeight;
}

/** Renders one narrative segment (dialogue/thought/system/effect) as a vector chip anchored to
 *  the bottom of `box`, growing upward, closely mirroring `SpeechBubble.tsx` / `OverlayChip`'s
 *  on-screen styling. Returns the vertical space consumed so callers can stack multiple chips. */
function drawSegmentChip(doc: jsPDF, segment: Exclude<NarrativeSegment, { type: 'scene' }>, box: Rect, bottomY: number, theme: UiOverlayTheme): number {
  const paddingX = 0.08;
  const paddingY = 0.06;
  const maxWidth = box.w - paddingX * 2 - 0.1;
  const fontSize = segment.type === 'system' ? 8 : 9;
  const font = segment.type === 'system' ? 'courier' : mapFontFamily(theme.bubbleFontFamily);

  doc.setFont(font, segment.type === 'thought' ? 'italic' : 'normal');
  doc.setFontSize(fontSize);
  const label = segment.speaker ? `${segment.speaker}: ` : '';
  const lines = doc.splitTextToSize(`${label}${segment.text}`, maxWidth) as string[];
  const lineHeight = fontSize / 72 * 1.35;
  const chipHeight = lines.length * lineHeight + paddingY * 2;
  const chipY = bottomY - chipHeight;

  let fill = parseCssColor(theme.bubbleBackground);
  let textColor = parseCssColor(theme.bubbleTextColor);
  let borderColor = parseCssColor(theme.bubbleBorderColor);
  if (segment.type === 'system') {
    fill = { r: 15, g: 30, b: 60, a: 0.92 };
    textColor = { r: 191, g: 219, b: 254, a: 1 };
    borderColor = { r: 59, g: 130, b: 246, a: 0.7 };
  } else if (segment.type === 'effect') {
    fill = { r: 251, g: 191, b: 36, a: 0.95 };
    textColor = { r: 69, g: 26, b: 3, a: 1 };
    borderColor = { r: 217, g: 119, b: 6, a: 1 };
  }

  doc.setFillColor(fill.r, fill.g, fill.b);
  doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
  doc.setLineWidth(pxToInClamped(theme.bubbleBorderWidth));
  doc.roundedRect(box.x + paddingX, chipY, box.w - paddingX * 2, chipHeight, 0.05, 0.05, 'FD');

  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  lines.forEach((line, i) => {
    doc.text(line, box.x + paddingX * 1.5, chipY + paddingY + (i + 1) * lineHeight - lineHeight * 0.3);
  });

  return chipHeight + 0.04;
}

/** Draws all non-scene segments for a panel's narrative as stacked chips along the bottom of
 *  the artwork box, and returns any leftover plain "scene" text (rendered by the caller as a
 *  caption strip, or flowed as body text on text-only pages). */
function drawPanelOverlay(doc: jsPDF, narrativeText: string, box: Rect, theme: UiOverlayTheme): string {
  const segments = parseNarrativeSegments(narrativeText);
  const chips = segments.filter((s): s is Exclude<NarrativeSegment, { type: 'scene' }> => s.type !== 'scene');
  const sceneText = segments.filter((s) => s.type === 'scene').map((s) => s.text).join(' ');

  let bottomY = box.y + box.h - 0.05;
  // Stack from the bottom up, most-recent-looking (last) segment closest to the bottom, same
  // reading order as the on-screen overlay zone.
  for (let i = chips.length - 1; i >= 0; i--) {
    bottomY -= drawSegmentChip(doc, chips[i], box, bottomY, theme);
  }

  return sceneText;
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function drawPanelBorder(doc: jsPDF, box: Rect, theme: UiOverlayTheme) {
  const border = parseCssColor(theme.panelBorderColor);
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(pxToInClamped(theme.panelBorderWidth));
  doc.rect(box.x, box.y, box.w, box.h, 'S');
}

function drawPlaceholderArt(doc: jsPDF, box: Rect, theme: UiOverlayTheme, label = 'Image unavailable') {
  const accent = parseCssColor(theme.accentColor);
  doc.setFillColor(24, 24, 27);
  doc.rect(box.x, box.y, box.w, box.h, 'F');
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.02);
  doc.rect(box.x + 0.08, box.y + 0.08, box.w - 0.16, box.h - 0.16, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 168);
  doc.text(label, box.x + box.w / 2, box.y + box.h / 2, { align: 'center' });
}

/** Section 8 — bake artwork + HTML/CSS-equivalent overlays into one flat high-res panel image. */
async function resolveBakedPanelArtwork(
  panel: BookPagePanel,
  box: Rect,
  theme: UiOverlayTheme,
  dpi: number
): Promise<string | null> {
  try {
    return await bakeComicPanelSnapshot({
      imageUrl: panel.imageUrl,
      narrativeText: panel.narrativeText,
      theme,
      widthPx: Math.max(1, Math.round(box.w * dpi)),
      heightPx: Math.max(1, Math.round(box.h * dpi)),
      textAnchor: panel.textAnchor,
      overlayEdits: panel.overlayEdits,
      pixelRatio: 1,
      quality: 0.92,
    });
  } catch (err) {
    debugLogger.record('ERROR', 'PDF export: canvas bake failed — falling back to art-only composite', {
      error: err instanceof Error ? err.message : String(err),
    });
    return resolvePanelArtwork(panel.imageUrl, box, dpi);
  }
}

async function renderStoryPageGrid(
  doc: jsPDF,
  page: BookPage,
  safeArea: Rect,
  theme: UiOverlayTheme,
  dpi: number,
  bakeOverlays: boolean
) {
  const boxes = layoutGrid(page.panels.length, safeArea);
  for (let i = 0; i < page.panels.length; i++) {
    const panel = page.panels[i];
    const box = boxes[i];

    if (bakeOverlays) {
      const baked = await resolveBakedPanelArtwork(panel, box, theme, dpi);
      if (baked) {
        doc.addImage(baked, 'JPEG', box.x, box.y, box.w, box.h);
      } else {
        drawPlaceholderArt(doc, box, theme);
        drawPanelBorder(doc, box, theme);
      }
      continue;
    }

    const artDataUrl = await resolvePanelArtwork(panel.imageUrl, box, dpi);
    if (artDataUrl) {
      doc.addImage(artDataUrl, 'JPEG', box.x, box.y, box.w, box.h);
    } else {
      drawPlaceholderArt(doc, box, theme);
    }
    drawPanelBorder(doc, box, theme);

    const sceneText = drawPanelOverlay(doc, panel.narrativeText, box, theme);
    if (sceneText) {
      // Plain scene text with no dialogue/thought/system/effect tags gets a light caption
      // strip along the very bottom, matching the on-screen "plain narrative" treatment.
      const caption = parseCssColor(theme.captionBackground);
      const captionH = Math.min(0.4, box.h * 0.22);
      doc.setFillColor(caption.r, caption.g, caption.b);
      doc.rect(box.x, box.y + box.h - captionH, box.w, captionH, 'F');
      const captionText = parseCssColor(theme.captionTextColor);
      doc.setTextColor(captionText.r, captionText.g, captionText.b);
      doc.setFont(mapFontFamily(theme.captionFontFamily), 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(sceneText, box.w - 0.16) as string[];
      const shown = lines.slice(0, 2);
      shown.forEach((line, li) => {
        doc.text(line, box.x + 0.08, box.y + box.h - captionH + 0.14 + li * 0.12);
      });
    }
  }
}

async function renderFullBleedFeaturePage(doc: jsPDF, page: BookPage, pageRect: Rect, safeArea: Rect, theme: UiOverlayTheme, dpi: number) {
  const panel = page.panels[0];
  const artDataUrl = await resolvePanelArtwork(panel.imageUrl, pageRect, dpi);
  if (artDataUrl) {
    doc.addImage(artDataUrl, 'JPEG', pageRect.x, pageRect.y, pageRect.w, pageRect.h);
  } else {
    drawPlaceholderArt(doc, pageRect, theme, panel.lootItemName ? 'Legendary Drop' : 'Milestone Illustration');
  }

  // Banner along the bottom of the safe area with the milestone/loot caption.
  const accent = parseCssColor(theme.accentColor);
  const bannerH = 0.6;
  const bannerY = safeArea.y + safeArea.h - bannerH;
  doc.setFillColor(10, 10, 12);
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.02);
  doc.roundedRect(safeArea.x, bannerY, safeArea.w, bannerH, 0.06, 0.06, 'FD');

  doc.setFont(mapFontFamily(theme.captionFontFamily), 'bold');
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.setFontSize(11);
  const title = panel.lootItemName
    ? `\u2726 LEGENDARY DROP: ${panel.lootItemName.toUpperCase()} \u2726`
    : '\u2726 MILESTONE \u2726';
  doc.text(title, safeArea.x + safeArea.w / 2, bannerY + 0.22, { align: 'center' });

  doc.setFont(mapFontFamily(theme.captionFontFamily), 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(230, 230, 235);
  const bodyText = parseNarrativeSegments(panel.narrativeText).map((s) => s.text).join(' ');
  const lines = (doc.splitTextToSize(bodyText, safeArea.w - 0.3) as string[]).slice(0, 2);
  lines.forEach((line, i) => doc.text(line, safeArea.x + safeArea.w / 2, bannerY + 0.4 + i * 0.14, { align: 'center' }));
}

function renderTextOnlyPage(doc: jsPDF, page: BookPage, safeArea: Rect, theme: UiOverlayTheme) {
  const segments = parseNarrativeSegments(page.panels[0].narrativeText);
  const bodyFont = mapFontFamily(theme.captionFontFamily);
  let cursorY = safeArea.y + 0.2;
  const lineHeight = 0.19;

  doc.setTextColor(20, 20, 24);
  for (const seg of segments) {
    if (cursorY > safeArea.y + safeArea.h - 0.3) break; // simple single-page clip; long runs are rare mid-turn
    if (seg.type === 'scene') {
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 24);
      cursorY += drawWrappedText(doc, seg.text, safeArea.x, cursorY, safeArea.w, lineHeight) + 0.08;
    } else {
      const box: Rect = { x: safeArea.x, y: cursorY, w: safeArea.w, h: 1 };
      // Chips are normally anchored to the bottom of an art box; here we just want them
      // top-down inline with body text, so draw at a synthetic bottom = cursorY + estimated height.
      doc.setFont(seg.type === 'thought' ? bodyFont : 'courier', seg.type === 'thought' ? 'italic' : 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(`${seg.speaker ? seg.speaker + ': ' : ''}${seg.text}`, safeArea.w - 0.2) as string[];
      const chipH = lines.length * 0.14 + 0.12;
      const chipBox = { ...box, y: cursorY, h: chipH };
      cursorY += drawSegmentChip(doc, seg, chipBox, cursorY + chipH, theme) + 0.08;
    }
  }
}

function renderCoverPage(doc: jsPDF, pageRect: Rect, safeArea: Rect, title: string, author: string, theme: UiOverlayTheme, coverArt: string | null) {
  if (coverArt) {
    doc.addImage(coverArt, 'JPEG', pageRect.x, pageRect.y, pageRect.w, pageRect.h);
    doc.setFillColor(0, 0, 0);
    doc.setGState(new GState({ opacity: 0.35 }));
    doc.rect(pageRect.x, pageRect.y + pageRect.h * 0.62, pageRect.w, pageRect.h * 0.38, 'F');
    doc.setGState(new GState({ opacity: 1 }));
  } else {
    const accent = parseCssColor(theme.accentColor);
    doc.setFillColor(12, 12, 16);
    doc.rect(pageRect.x, pageRect.y, pageRect.w, pageRect.h, 'F');
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.04);
    doc.rect(safeArea.x, safeArea.y, safeArea.w, safeArea.h, 'S');
  }

  doc.setFont(mapFontFamily(theme.captionFontFamily), 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(title, safeArea.w - 0.4) as string[];
  const titleY = pageRect.y + pageRect.h * 0.72;
  titleLines.forEach((line, i) => doc.text(line, pageRect.x + pageRect.w / 2, titleY + i * 0.36, { align: 'center' }));

  doc.setFont(mapFontFamily(theme.captionFontFamily), 'normal');
  doc.setFontSize(12);
  doc.setTextColor(210, 210, 215);
  doc.text(author, pageRect.x + pageRect.w / 2, titleY + titleLines.length * 0.36 + 0.28, { align: 'center' });
}

function renderStatsPage(doc: jsPDF, sessionData: GameState, safeArea: Rect, theme: UiOverlayTheme) {
  const font = mapFontFamily(theme.captionFontFamily);
  const c = sessionData.character;
  let y = safeArea.y + 0.1;

  doc.setTextColor(20, 20, 24);
  doc.setFont(font, 'bold');
  doc.setFontSize(18);
  doc.text(c.name || 'The Player', safeArea.x, y);
  y += 0.32;

  doc.setFont(font, 'normal');
  doc.setFontSize(10.5);
  doc.text(`Level ${c.level}  |  HP ${c.hp}/${c.maxHp}  |  MP ${c.mp}/${c.maxMp}`, safeArea.x, y);
  y += 0.3;

  if (c.appearance) {
    doc.setFont(font, 'italic');
    doc.setFontSize(9.5);
    y += drawWrappedText(doc, c.appearance, safeArea.x, y, safeArea.w, 0.17) + 0.18;
  }

  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text('Equipped Gear', safeArea.x, y);
  y += 0.2;
  doc.setFont(font, 'normal');
  doc.setFontSize(9.5);
  const gear = sessionData.inventory.filter((i) => i.equipped);
  if (gear.length === 0) {
    doc.text('None', safeArea.x, y);
    y += 0.16;
  } else {
    for (const item of gear) {
      const color = parseCssColor(RARITY_COLORS[item.rarity as Rarity] ?? '#9ca3af');
      doc.setTextColor(color.r, color.g, color.b);
      doc.text(`\u2022 ${item.name}`, safeArea.x, y);
      y += 0.16;
    }
  }

  y += 0.14;
  doc.setTextColor(20, 20, 24);
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text('Active Quests', safeArea.x, y);
  y += 0.2;
  doc.setFont(font, 'normal');
  doc.setFontSize(9.5);
  const quests = (sessionData.quests ?? []).filter((q) => q.status === 'active');
  if (quests.length === 0) {
    doc.text('None', safeArea.x, y);
  } else {
    for (const q of quests) {
      y += drawWrappedText(doc, `[${q.type.toUpperCase()}] ${q.name}`, safeArea.x, y, safeArea.w, 0.16) + 0.02;
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compiles a game session's log into a print-ready PDF at the given format/DPI.
 *
 * @param sessionData The game session to export (the live `GameState`, or an equivalent
 *                     deserialized save).
 * @param options      Layout/format/branding options — see `PdfExportOptions`.
 */
export async function exportSessionToPdf(sessionData: GameState, options: PdfExportOptions): Promise<Blob> {
  const fmt = PRINT_FORMATS[options.format];
  const dpi = options.dpi ?? DEFAULT_DPI;
  const bleed = options.bleedMarginInches ?? DEFAULT_BLEED_IN;
  const safeMargin = options.safeMarginInches ?? DEFAULT_SAFE_MARGIN_IN;
  const includeCover = options.includeCover ?? true;
  const includeStatsPage = options.includeStatsPage ?? true;
  const bakeOverlays = options.bakeOverlays ?? true;
  const theme = getStyleSpec(options.artStylePreset ?? 'classic-book').ui_overlay_theme;

  const pageW = fmt.widthIn + bleed * 2;
  const pageH = fmt.heightIn + bleed * 2;
  const pageRect: Rect = { x: 0, y: 0, w: pageW, h: pageH };
  const safeArea: Rect = {
    x: bleed + safeMargin,
    y: bleed + safeMargin,
    w: pageW - (bleed + safeMargin) * 2,
    h: pageH - (bleed + safeMargin) * 2,
  };

  const manifest = buildBookManifest(sessionData);
  const printPages = packPagesForPrint(manifest, options.panelsPerPage);

  const totalSteps = (includeCover ? 1 : 0) + (includeStatsPage ? 1 : 0) + printPages.length;
  let step = 0;
  const reportProgress = (stage: string) => {
    step += 1;
    options.onProgress?.({ stage, current: step, total: totalSteps });
  };

  const doc = new jsPDF({ unit: 'in', format: [pageW, pageH], compress: true });
  doc.setProperties({
    title: options.title,
    author: options.author,
    creator: 'Illustrated Publishing Engine',
    subject: `${fmt.label} print export`,
  });

  let usedFirstPage = false;
  const ensurePage = () => {
    if (usedFirstPage) {
      doc.addPage([pageW, pageH]);
    }
    usedFirstPage = true;
  };

  if (includeCover) {
    ensurePage();
    const coverManifestPage = manifest.find((p) => !!p.imageUrl);
    const coverArt = coverManifestPage ? await resolvePanelArtwork(coverManifestPage.imageUrl ?? null, pageRect, dpi) : null;
    renderCoverPage(doc, pageRect, safeArea, options.title, `by ${options.author}`, theme, coverArt);
    reportProgress('cover');
  }

  if (includeStatsPage) {
    ensurePage();
    renderStatsPage(doc, sessionData, safeArea, theme);
    reportProgress('stats-page');
  }

  for (const page of printPages) {
    ensurePage();
    if (page.isFullBleedFeature) {
      await renderFullBleedFeaturePage(doc, page, pageRect, safeArea, theme, dpi);
    } else if (page.isTextOnly) {
      renderTextOnlyPage(doc, page, safeArea, theme);
    } else {
      await renderStoryPageGrid(doc, page, safeArea, theme, dpi, bakeOverlays);
    }

    // Footer page number, inside the safe area.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 148);
    doc.text(String(page.pageNumber), pageRect.w / 2, pageH - bleed - 0.12, { align: 'center' });

    reportProgress(`page-${page.pageNumber}`);
  }

  return doc.output('blob');
}

/** Triggers a browser download of `blob` as `filename`. */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
