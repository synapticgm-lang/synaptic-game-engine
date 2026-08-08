import type { ComicOverlayEdit } from '@/game/types';
import type { ComicTextAnchor } from '@/types/comicScript';
import { normalizeTextAnchor } from '@/types/comicScript';
import { parseNarrativeSegments, type NarrativeSegment } from '@/components/comic/NarrativeText';
import type { UiOverlayTheme } from '@/styles/styleSpecs';

export interface BakePanelSnapshotOptions {
  imageUrl: string | null;
  narrativeText: string;
  theme: UiOverlayTheme;
  /** Output canvas width in CSS pixels (scaled by devicePixelRatio internally for sharpness). */
  widthPx: number;
  /** Output canvas height in CSS pixels. */
  heightPx: number;
  textAnchor?: ComicTextAnchor | null;
  overlayEdits?: ComicOverlayEdit[];
  /** JPEG quality 0–1. Default 0.92. */
  quality?: number;
  /** Extra pixel density multiplier. Default 2 for print-friendly baking. */
  pixelRatio?: number;
}

interface ChipLayout {
  segment: NarrativeSegment;
  segmentIndex: number;
  x: number;
  y: number;
  maxWidth: number;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load panel image: ${url.slice(0, 80)}`));
    img.src = url;
  });
}

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
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }
  if (hex.length >= 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

function colorCss(c: { r: number; g: number; b: number; a: number }): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

/** Maps an LLM/UI text_anchor onto a starting pixel origin inside the panel. */
export function anchorOriginPx(
  anchor: ComicTextAnchor,
  width: number,
  height: number,
  pad = 12
): { x: number; y: number; align: 'start' | 'end' | 'center' } {
  switch (normalizeTextAnchor(anchor)) {
    case 'top-left':
      return { x: pad, y: pad, align: 'start' };
    case 'top-right':
      return { x: width - pad, y: pad, align: 'end' };
    case 'bottom-left':
      return { x: pad, y: height - pad, align: 'start' };
    case 'bottom-right':
      return { x: width - pad, y: height - pad, align: 'end' };
    case 'bottom-center':
    default:
      return { x: width / 2, y: height - pad, align: 'center' };
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const trial = `${current} ${words[i]}`;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawCoverArt(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
): void {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const srcRatio = srcW / Math.max(1, srcH);
  const boxRatio = width / Math.max(1, height);
  let sx = 0;
  let sy = 0;
  let sW = srcW;
  let sH = srcH;
  if (srcRatio > boxRatio) {
    sW = srcH * boxRatio;
    sx = (srcW - sW) / 2;
  } else {
    sH = srcW / boxRatio;
    sy = (srcH - sH) / 2;
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, sx, sy, sW, sH, 0, 0, width, height);
}

function applyEdits(
  segments: NarrativeSegment[],
  edits?: ComicOverlayEdit[]
): Array<{ segment: NarrativeSegment; segmentIndex: number; edit?: ComicOverlayEdit }> {
  return segments.map((segment, segmentIndex) => {
    const edit = edits?.find((item) => item.segmentIndex === segmentIndex);
    if (!edit?.text?.trim()) return { segment, segmentIndex, edit };
    return {
      segment: { ...segment, text: edit.text.trim() } as NarrativeSegment,
      segmentIndex,
      edit,
    };
  });
}

function layoutChips(
  items: Array<{ segment: NarrativeSegment; segmentIndex: number; edit?: ComicOverlayEdit }>,
  width: number,
  height: number,
  textAnchor?: ComicTextAnchor | null
): ChipLayout[] {
  const pad = Math.max(10, Math.round(width * 0.03));
  const maxWidth = Math.min(width * 0.72, width - pad * 2);
  const anchor = normalizeTextAnchor(textAnchor ?? 'bottom-center');
  const origin = anchorOriginPx(anchor, width, height, pad);
  const layouts: ChipLayout[] = [];

  // Stack chips from the anchor origin. Bottom anchors grow upward; top anchors grow down.
  const growUp = anchor.startsWith('bottom');
  let cursorY = origin.y;

  for (const item of items) {
    const chipHEstimate = 56;
    let x = origin.x;
    let y = growUp ? cursorY - chipHEstimate : cursorY;

    if (typeof item.edit?.x === 'number' && typeof item.edit?.y === 'number') {
      x = item.edit.x * width;
      y = item.edit.y * height;
    } else if (origin.align === 'end') {
      x = origin.x - maxWidth;
    } else if (origin.align === 'center') {
      x = origin.x - maxWidth / 2;
    }

    x = Math.max(pad, Math.min(width - maxWidth - pad, x));
    y = Math.max(pad, Math.min(height - chipHEstimate - pad, y));

    layouts.push({
      segment: item.segment,
      segmentIndex: item.segmentIndex,
      x,
      y,
      maxWidth,
    });

    if (typeof item.edit?.x !== 'number') {
      cursorY = growUp ? y - 8 : y + chipHEstimate + 8;
    }
  }

  return layouts;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  layout: ChipLayout,
  theme: UiOverlayTheme
): number {
  const { segment, x, y, maxWidth } = layout;
  const paddingX = 12;
  const paddingY = 10;
  const fontSize = segment.type === 'system' ? 12 : 14;
  const fontFamily =
    segment.type === 'system'
      ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
      : segment.type === 'scene'
        ? theme.captionFontFamily
        : theme.bubbleFontFamily;

  ctx.font = `${segment.type === 'thought' ? 'italic ' : ''}${fontSize}px ${fontFamily}`;
  const label = 'speaker' in segment && segment.speaker ? `${segment.speaker}: ` : '';
  const lines = wrapText(ctx, `${label}${segment.text}`, maxWidth - paddingX * 2);
  const lineHeight = fontSize * 1.35;
  const chipH = lines.length * lineHeight + paddingY * 2;
  const chipW = Math.min(
    maxWidth,
    Math.max(...lines.map((line) => ctx.measureText(line).width)) + paddingX * 2
  );

  let fill = parseCssColor(theme.bubbleBackground);
  let textColor = parseCssColor(theme.bubbleTextColor);
  let border = parseCssColor(theme.bubbleBorderColor);
  let radius = parseFloat(theme.bubbleBorderRadius) || 12;

  if (segment.type === 'scene') {
    fill = parseCssColor(theme.captionBackground);
    textColor = parseCssColor(theme.captionTextColor);
    border = { r: 0, g: 0, b: 0, a: 0.35 };
    radius = 4;
  } else if (segment.type === 'system') {
    fill = { r: 15, g: 23, b: 42, a: 0.95 };
    textColor = { r: 191, g: 219, b: 254, a: 1 };
    border = { r: 59, g: 130, b: 246, a: 0.7 };
    radius = 8;
  } else if (segment.type === 'effect') {
    fill = { r: 255, g: 255, b: 255, a: 1 };
    textColor = parseCssColor(theme.accentColor);
    border = parseCssColor(theme.accentColor);
    radius = 6;
  }

  ctx.save();
  if (segment.type === 'effect') {
    ctx.translate(x + chipW / 2, y + chipH / 2);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.translate(-(x + chipW / 2), -(y + chipH / 2));
  }

  ctx.fillStyle = colorCss(fill);
  ctx.strokeStyle = colorCss(border);
  ctx.lineWidth = Math.max(1, parseFloat(theme.bubbleBorderWidth) || 2);
  drawRoundedRect(ctx, x, y, chipW, chipH, radius);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colorCss(textColor);
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + paddingX, y + paddingY + i * lineHeight);
  });
  ctx.restore();

  return chipH;
}

/**
 * Bakes a comic panel into a flat high-resolution snapshot: artwork + speech bubbles / captions
 * composited at their relative coordinates (Director anchor and/or Editor Mode overrides).
 *
 * Uses the native Canvas 2D API (no html2canvas dependency) so baking works for both the live
 * editor preview path and the jsPDF export pipeline.
 */
export async function bakeComicPanelSnapshot(options: BakePanelSnapshotOptions): Promise<string> {
  const {
    imageUrl,
    narrativeText,
    theme,
    widthPx,
    heightPx,
    textAnchor,
    overlayEdits,
    quality = 0.92,
    pixelRatio = 2,
  } = options;

  const scale = Math.max(1, pixelRatio);
  const width = Math.max(1, Math.round(widthPx));
  const height = Math.max(1, Math.round(heightPx));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable for comic page baking.');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, width, height);

  if (imageUrl) {
    try {
      const img = await loadHtmlImage(imageUrl);
      drawCoverArt(ctx, img, width, height);
    } catch {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#71717a';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Image unavailable', width / 2, height / 2);
      ctx.textAlign = 'start';
    }
  }

  const borderColor = parseCssColor(theme.panelBorderColor);
  ctx.strokeStyle = colorCss(borderColor);
  ctx.lineWidth = Math.max(2, parseFloat(theme.panelBorderWidth) || 3);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  const segments = parseNarrativeSegments(narrativeText);
  const edited = applyEdits(segments, overlayEdits);
  const layouts = layoutChips(edited, width, height, textAnchor);
  for (const layout of layouts) {
    drawChip(ctx, layout, theme);
  }

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Convenience helper: bake a full print page of 1–4 panels into one canvas snapshot using the
 * same grid packing ratios as `pdfExportService.layoutGrid` (relative gutters).
 */
export async function bakeComicPageSnapshot(options: {
  panels: Array<{
    imageUrl: string | null;
    narrativeText: string;
    textAnchor?: ComicTextAnchor | null;
    overlayEdits?: ComicOverlayEdit[];
  }>;
  theme: UiOverlayTheme;
  pageWidthPx: number;
  pageHeightPx: number;
  quality?: number;
}): Promise<string> {
  const { panels, theme, pageWidthPx, pageHeightPx, quality = 0.92 } = options;
  const gutter = Math.round(Math.min(pageWidthPx, pageHeightPx) * 0.02);
  const count = Math.max(1, Math.min(4, panels.length));

  const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];
  if (count === 1) {
    boxes.push({ x: 0, y: 0, w: pageWidthPx, h: pageHeightPx });
  } else if (count === 2) {
    const h = Math.floor((pageHeightPx - gutter) / 2);
    boxes.push(
      { x: 0, y: 0, w: pageWidthPx, h },
      { x: 0, y: h + gutter, w: pageWidthPx, h: pageHeightPx - h - gutter }
    );
  } else if (count === 3) {
    const topH = Math.floor(pageHeightPx * 0.58);
    const bottomH = pageHeightPx - topH - gutter;
    const halfW = Math.floor((pageWidthPx - gutter) / 2);
    boxes.push(
      { x: 0, y: 0, w: pageWidthPx, h: topH },
      { x: 0, y: topH + gutter, w: halfW, h: bottomH },
      { x: halfW + gutter, y: topH + gutter, w: pageWidthPx - halfW - gutter, h: bottomH }
    );
  } else {
    const halfW = Math.floor((pageWidthPx - gutter) / 2);
    const halfH = Math.floor((pageHeightPx - gutter) / 2);
    boxes.push(
      { x: 0, y: 0, w: halfW, h: halfH },
      { x: halfW + gutter, y: 0, w: pageWidthPx - halfW - gutter, h: halfH },
      { x: 0, y: halfH + gutter, w: halfW, h: pageHeightPx - halfH - gutter },
      { x: halfW + gutter, y: halfH + gutter, w: pageWidthPx - halfW - gutter, h: pageHeightPx - halfH - gutter }
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = pageWidthPx;
  canvas.height = pageHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable for page baking.');
  ctx.fillStyle = '#f4f4f5';
  ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

  for (let i = 0; i < count; i += 1) {
    const box = boxes[i];
    const panel = panels[i];
    const baked = await bakeComicPanelSnapshot({
      imageUrl: panel.imageUrl,
      narrativeText: panel.narrativeText,
      theme,
      widthPx: box.w,
      heightPx: box.h,
      textAnchor: panel.textAnchor,
      overlayEdits: panel.overlayEdits,
      quality,
      pixelRatio: 1,
    });
    const img = await loadHtmlImage(baked);
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
  }

  return canvas.toDataURL('image/jpeg', quality);
}
