import type { LogEntry, LoreCard, ArtStylePreset, ComicPanel, PanelImageStatus, ComicOverlayEdit, ComicLayoutMode, ComicReadingDirection } from '@/game/types';
import { normalizeTextAnchor, type ComicTextAnchor } from '@/types/comicScript';
import { getEffectiveComicPreset } from '@/game/comicImagePrompt';
import { getStyleSpec, type UiOverlayTheme } from '@/styles/styleSpecs';
import { FormattedText } from '../FormattedText';
import { ActionOverlay, DiceRollOverlay, type ActionEffect } from './ActionOverlay';
import { parseNarrativeSegments, type NarrativeSegment } from './NarrativeText';
import { SpeechBubble } from './SpeechBubble';
import { ImageOff, Loader2, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Pencil } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { debugLogger } from '@/game/debugLogger';
import { useZoomGesture } from './useZoomGesture';
import { findQuietQuadrant } from '@/utils/smartPlacement';
import { splashPlateLabel, splashUnavailableLine } from '@/game/memorableMoments';

interface ComicGridProps {
  log: LogEntry[];
  lorebook: LoreCard[];
  busy: boolean;
  diceAnimating: boolean;
  currentImage: string | string[] | null;
  bgImage: string | null;
  artStylePreset: ArtStylePreset;
  comicLayout?: ComicLayoutMode;
  comicReadingDirection?: ComicReadingDirection;
  imagesGenerating?: number;
  onRetryPanelImage?: (entryId: string, panelIndex: number) => void;
  onUpdatePanelOverlay?: (entryId: string, panelIndex: number, edit: ComicOverlayEdit) => void;
}

export function ComicGrid({
  log,
  lorebook,
  busy,
  diceAnimating,
  currentImage,
  artStylePreset,
  comicLayout = 'paged',
  comicReadingDirection = 'ltr',
  imagesGenerating = 0,
  onRetryPanelImage,
  onUpdatePanelOverlay,
}: ComicGridProps) {
  const [actionEffect, setActionEffect] = useState<ActionEffect | null>(null);
  const [editorMode, setEditorMode] = useState(false);

  const recentLog = log.slice(-6);
  const introImages = normalizeImages(currentImage);
  const effectivePreset = getEffectiveComicPreset(artStylePreset);
  // Style Spec Configuration: speech bubbles, caption fonts, and panel border widths all
  // dynamically follow the active illustration style instead of one hardcoded look.
  const theme = getStyleSpec(effectivePreset).ui_overlay_theme;

  useEffect(() => {
    if (introImages.length === 0 && log.length <= 1) {
      debugLogger.record('WARN', 'ComicGrid rendered in comic mode but intro image is null/empty', {
        logEntries: log.length,
        busy
      });
    }
  }, [introImages.length, log.length, busy]);

  useEffect(() => {
    if (busy) return;
    const lastEntry = log[log.length - 1];
    if (!lastEntry || lastEntry.role !== 'gm') return;

    const text = lastEntry.content.toLowerCase();
    let effect: ActionEffect | null = null;

    if (text.includes('critical hit') || text.includes('critical success')) {
      effect = { text: 'CRITICAL!', color: '#fbbf24', rotation: -8, x: 50, y: 40 };
    } else if (text.includes('critical fail') || text.includes('critical failure') || text.includes('fumble')) {
      effect = { text: 'FUMBLE!', color: '#ef4444', rotation: 8, x: 50, y: 40 };
    } else if (text.includes('bam') || text.includes('smash') || text.includes('slam')) {
      effect = { text: 'BAM!', color: '#f59e0b', rotation: -5, x: 45, y: 35 };
    } else if (text.includes('splat') || text.includes('blood')) {
      effect = { text: 'SPLAT!', color: '#dc2626', rotation: 5, x: 55, y: 35 };
    } else if (text.includes('crash') || text.includes('break') || text.includes('shatter')) {
      effect = { text: 'CRASH!', color: '#06b6d4', rotation: -3, x: 50, y: 30 };
    }

    if (effect) setActionEffect(effect);
    const t = setTimeout(() => setActionEffect(null), 1200);
    return () => clearTimeout(t);
  }, [log, busy]);

  const isScreentone = effectivePreset === 'manga-screentone';
  const containerClass = isScreentone ? 'manga-screentone-bg' : '';

  // Pinch-to-zoom (mobile/tablet) + Ctrl/Cmd+scroll-wheel zoom (desktop) over the panel
  // viewport, so readers can zoom in on fine art/text detail without a separate lightbox.
  const { scale, containerRef, zoomIn, zoomOut, reset, isZoomed } = useZoomGesture();

  const hasFinishedPanels = useMemo(
    () =>
      recentLog.some(
        (entry) =>
          entry.panels?.some((panel) => !!panel.imageUrl) ||
          (entry.imageUrls?.length ?? 0) > 0
      ),
    [recentLog]
  );

  const isWebtoon = comicLayout === 'webtoon';
  const isRtl = comicReadingDirection === 'rtl';

  return (
    <div
      ref={containerRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative h-full w-full flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-4 pb-32 flex flex-col ${containerClass} ${isWebtoon ? 'comic-webtoon' : 'comic-paged'}`}
    >
      {isScreentone && <div className="manga-screentone-overlay fixed inset-0 z-0 pointer-events-none" />}

      <div className="fixed bottom-24 right-3 z-40 flex flex-col gap-1.5 sm:right-6">
        {hasFinishedPanels && (
          <button
            type="button"
            onClick={() => setEditorMode((prev) => !prev)}
            title={editorMode ? 'Exit Editor Mode' : 'Editor Mode — adjust bubbles before PDF export'}
            className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm transition-colors ${
              editorMode
                ? 'border-amber-500/70 bg-amber-950/90 text-amber-200 hover:bg-amber-900'
                : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Pencil size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={zoomIn}
          title="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-800"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-800"
        >
          <ZoomOut size={16} />
        </button>
        {isZoomed && (
          <button
            type="button"
            onClick={reset}
            title="Reset zoom"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-800"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {editorMode && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-40 -translate-x-1/2 rounded-full border border-amber-500/40 bg-slate-950/90 px-3 py-1.5 text-[11px] text-amber-100 shadow-lg backdrop-blur-sm">
          Editor Mode — drag bubbles · double-click to edit text
        </div>
      )}

      <div
        className="mx-auto w-full max-w-3xl relative z-10 transition-transform duration-150 ease-out"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <div className={`flex flex-col ${isWebtoon ? 'gap-10 max-w-xl mx-auto' : 'gap-6'}`}>
          {recentLog.map((entry) => (
            <LogEntryRenderer
              key={entry.id}
              entry={entry}
              lorebook={lorebook}
              isScreentone={isScreentone}
              introImages={introImages}
              theme={theme}
              editorMode={editorMode}
              comicLayout={comicLayout}
              comicReadingDirection={comicReadingDirection}
              onRetryPanelImage={onRetryPanelImage}
              onUpdatePanelOverlay={onUpdatePanelOverlay}
            />
          ))}

          {imagesGenerating > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <Loader2 size={12} className="animate-spin" />
              Rendering {imagesGenerating} panel{imagesGenerating === 1 ? '' : 's'}…
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-crimson-500" />
              The world responds...
            </div>
          )}
        </div>

        <ActionOverlay effect={actionEffect} />
        <DiceRollOverlay visible={diceAnimating} />
      </div>
    </div>
  );
}

function normalizeImages(image: string | string[] | null): string[] {
  if (!image) return [];
  return Array.isArray(image) ? image.filter(Boolean) : [image];
}

function getPanelGridPlacement(index: number, total: number): { className: string; featured: boolean } {
  if (total <= 1) {
    return { className: 'sm:col-span-2 lg:col-span-3', featured: true };
  }
  if (total === 2) {
    return index === 0
      ? { className: 'sm:col-span-2 lg:col-span-2', featured: true }
      : { className: 'lg:col-span-1', featured: false };
  }
  if (total === 3) {
    return index === 0
      ? { className: 'sm:col-span-2 lg:col-span-3', featured: true }
      : { className: index === 1 ? 'lg:col-span-2' : 'lg:col-span-1', featured: false };
  }
  // Four-panel page: lead with a large establishing image, then stagger reaction/detail shots.
  if (index === 0) return { className: 'sm:col-span-2 lg:col-span-2 lg:row-span-2', featured: true };
  if (index === 3) return { className: 'sm:col-span-2 lg:col-span-3', featured: true };
  return { className: 'lg:col-span-1', featured: false };
}

function resolvePanelStatus(panel: ComicPanel): PanelImageStatus {
  if (panel.imageUrl) return 'ready';
  if (panel.imageStatus === 'error' || panel.imageStatus === 'failed') return 'error';
  return panel.imageStatus ?? 'pending';
}

function LogEntryRenderer({
  entry,
  lorebook,
  isScreentone,
  introImages,
  theme,
  editorMode,
  comicLayout = 'paged',
  comicReadingDirection = 'ltr',
  onRetryPanelImage,
  onUpdatePanelOverlay,
}: {
  entry: LogEntry;
  lorebook: LoreCard[];
  isScreentone: boolean;
  introImages: string[];
  theme: UiOverlayTheme;
  editorMode: boolean;
  comicLayout?: ComicLayoutMode;
  comicReadingDirection?: ComicReadingDirection;
  onRetryPanelImage?: (entryId: string, panelIndex: number) => void;
  onUpdatePanelOverlay?: (entryId: string, panelIndex: number, edit: ComicOverlayEdit) => void;
}) {
  const isWebtoon = comicLayout === 'webtoon';
  const panelGridClass = isWebtoon
    ? 'flex flex-col gap-8 py-2'
    : `grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 ${comicReadingDirection === 'rtl' ? 'direction-rtl' : ''}`;
  // Memorable/loot-video entries get a distinct full-page/cinematic treatment regardless of
  // whatever else the turn contains — checked first so they always win layout priority.
  if (entry.entryKind === 'milestone') {
    return <MilestonePanel entry={entry} lorebook={lorebook} isScreentone={isScreentone} />;
  }

  if (entry.mediaKind === 'video') {
    return <LootVideoPanel entry={entry} />;
  }

  if (entry.role === 'player') {
    // Keep the player's line readable even when art is pending or failed. Comic art still
    // depicts the beat; this caption is the comment/reaction they typed.
    return (
      <div className="my-1 flex justify-end">
        <div className="max-w-[85%] rounded-2xl border border-slate-700/70 bg-slate-900/90 px-3 py-1.5 text-sm leading-relaxed text-slate-200">
          {entry.content}
        </div>
      </div>
    );
  }

  if (entry.role === 'system') {
    return (
      <div className="comic-caption text-center text-slate-400 italic my-2">{entry.content}</div>
    );
  }

  if (entry.panels && entry.panels.length > 0) {
    const artReady = entry.panels.every(
      (panel) => resolvePanelStatus(panel) === 'ready' && !!panel.imageUrl
    );
    return (
      <div className="flex flex-col gap-3">
        <div className={panelGridClass}>
          {entry.panels.map((panel, idx) => {
            const placement = isWebtoon
              ? { className: 'w-full', featured: true }
              : getPanelGridPlacement(idx, entry.panels!.length);
            return (
              <div key={`${entry.id}-panel-${idx}`} className={placement.className}>
                <ComicPanelCell
                  panel={panel}
                  isScreentone={isScreentone}
                  index={idx}
                  entryId={entry.id}
                  turn={entry.turn}
                  theme={theme}
                  featured={placement.featured}
                  editorMode={editorMode}
                  tall={isWebtoon}
                  onRetry={
                    onRetryPanelImage
                      ? () => onRetryPanelImage(entry.id, idx)
                      : undefined
                  }
                  onUpdateOverlay={
                    onUpdatePanelOverlay
                      ? (edit) => onUpdatePanelOverlay(entry.id, idx, edit)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
        {!artReady && entry.content?.trim() ? (
          <TextPanel entry={entry} lorebook={lorebook} isScreentone={isScreentone} />
        ) : null}
      </div>
    );
  }

  const entryImages = entry.imageUrls ?? (entry.turn === 0 ? introImages : []);
  const entryImageStatus = entry.imageUrls?.length
    ? 'ready'
    : entry.imageStatus ?? (entryImages.length > 0 ? 'ready' : 'pending');

  // Turn-level images (no discrete <panel> blocks) render through the SAME ComicPanelCell
  // overlay treatment as multi-panel turns: dialogue/thought/effect/system tags become
  // absolutely-positioned bubbles bounded to the artwork, instead of flowing as plain text
  // below the image (which used to spill past the panel and inherit whatever background —
  // sometimes a bright one — sat behind it).
  if (entryImages.length > 0) {
    return (
      <div className={panelGridClass}>
        {entryImages.map((img, idx) => {
          const placement = isWebtoon
            ? { className: 'w-full', featured: true }
            : getPanelGridPlacement(idx, entryImages.length);
          return (
            <div key={`${entry.id}-img-${idx}`} className={placement.className}>
              <ComicPanelCell
                panel={{
                  imagePrompt: '',
                  narrative: idx === 0 ? entry.content : '',
                  imageUrl: img,
                  imageStatus: 'ready',
                }}
                isScreentone={isScreentone}
                index={idx}
                entryId={entry.id}
                turn={entry.turn}
                theme={theme}
                featured={placement.featured}
                editorMode={editorMode}
                tall={isWebtoon}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (entryImageStatus === 'pending' || entryImageStatus === 'error') {
    return (
      <div className="flex flex-col gap-3">
        <ComicPanelCell
          panel={{
            imagePrompt: '',
            narrative: entry.content,
            imageUrl: null,
            imageStatus: entryImageStatus,
          }}
          isScreentone={isScreentone}
          index={0}
          entryId={entry.id}
          turn={entry.turn}
          theme={theme}
          editorMode={editorMode}
        />
        {entry.content?.trim() ? (
          <TextPanel entry={entry} lorebook={lorebook} isScreentone={isScreentone} />
        ) : null}
      </div>
    );
  }

  return <TextPanel entry={entry} lorebook={lorebook} isScreentone={isScreentone} />;
}

function PanelImageSlot({
  src,
  alt,
  status,
  isScreentone,
  framed = false,
  onLoad,
  onRetry,
}: {
  src?: string | null;
  alt: string;
  status: PanelImageStatus;
  isScreentone: boolean;
  framed?: boolean;
  onLoad?: (image: HTMLImageElement) => void;
  onRetry?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBroken(false);
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (!src || loaded || broken) return;
    // A provider URL can resolve while the actual image asset stalls forever. End the local
    // loading state even when the browser never emits load/error for that URL.
    const timer = window.setTimeout(() => setBroken(true), 20_000);
    return () => window.clearTimeout(timer);
  }, [src, loaded, broken]);

  const panelClass = isScreentone ? 'manga-screentone-panel' : '';
  const ready = Boolean(src) && !broken;
  const effectiveStatus: PanelImageStatus =
    broken || (status === 'ready' && !src)
      ? 'failed'
      : ready
        ? 'ready'
        : status === 'error' || status === 'failed'
          ? 'error'
          : 'pending';

  if (!ready) {
    return (
      <PanelPlaceholder
        status={effectiveStatus}
        isScreentone={isScreentone}
        framed={framed}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${framed ? '' : `min-h-[240px] shrink-0 rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/50 ${panelClass}`}`}
    >
      {!loaded && (
        <div className="absolute inset-0 z-10">
          <PanelPlaceholder status="pending" isScreentone={isScreentone} framed />
        </div>
      )}
      <img
        src={src!}
        alt={alt}
        className={framed
          ? 'block h-full w-full object-cover object-center'
          : 'block h-full w-full max-h-[56vh] object-contain object-center'}
        onLoad={(event) => {
          // Mark artwork loaded synchronously. Smart canvas analysis runs afterward and is
          // never allowed to control or delay the image spinner lifecycle.
          setLoaded(true);
          onLoad?.(event.currentTarget);
        }}
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function PanelPlaceholder({
  status,
  isScreentone,
  framed = false,
  onRetry,
  message,
}: {
  status: PanelImageStatus;
  isScreentone: boolean;
  framed?: boolean;
  onRetry?: () => void;
  message?: string;
}) {
  const isError = status === 'error' || status === 'failed';
  const label = message
    ?? (isError ? 'Panel image unavailable' : 'Generating panel image...');

  return (
    <div
      className={`relative overflow-hidden ${framed ? 'h-full w-full' : `min-h-[240px] shrink-0 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 shadow-inner ${isScreentone ? 'manga-screentone-panel' : ''}`}`}
      aria-busy={!isError}
      aria-label={isError ? label : 'Panel image loading'}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/30 ${isError ? '' : 'animate-pulse'}`} />
      <div className={`relative flex flex-col items-center justify-center gap-3 px-4 ${framed ? 'h-full min-h-[120px]' : 'min-h-[240px] py-8'}`}>
        {isError ? (
          <ImageOff size={28} className="text-slate-500" />
        ) : (
          <Loader2 size={28} className="animate-spin text-slate-500" />
        )}
        <span className="text-center text-xs font-mono text-slate-500">
          {label}
        </span>
        {isError && onRetry && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRetry();
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-800"
          >
            <RefreshCw size={12} />
            Retry image
          </button>
        )}
      </div>
    </div>
  );
}

function TextPanel({
  entry,
  lorebook,
  isScreentone,
}: {
  entry: LogEntry;
  lorebook: LoreCard[];
  isScreentone: boolean;
}) {
  const panelClass = isScreentone ? 'manga-screentone-panel' : '';

  return (
    <div
      data-entry-id={entry.id}
      data-turn={entry.turn}
      data-panel-kind="text"
      className={`comic-panel comic-panel-in w-full shrink-0 rounded-lg border border-slate-800/60 bg-slate-950/85 backdrop-blur-sm ${panelClass}`}
    >
      <div className="px-3 py-3 text-base leading-relaxed text-slate-200">
        <FormattedText content={entry.content} lorebook={lorebook} />
      </div>
    </div>
  );
}

/**
 * Full-page milestone illustration. Distinct from routine panels/thumbnails — reserved for
 * the rare, GM-flagged story beats worth a two-page-spread treatment. Also the natural
 * page-break unit for the future PDF export pipeline (see `data-panel-kind`).
 */
function MilestonePanel({
  entry,
  lorebook,
  isScreentone,
}: {
  entry: LogEntry;
  lorebook: LoreCard[];
  isScreentone: boolean;
}) {
  const images = entry.imageUrls ?? [];
  const plate = splashPlateLabel(entry);
  const hasArt = Boolean(images[0]);
  const failed = !hasArt && (entry.imageStatus === 'error' || entry.imageStatus === 'failed');

  return (
    <article
      data-entry-id={entry.id}
      data-turn={entry.turn}
      data-panel-kind="memorable"
      className="comic-panel-cell milestone-panel w-full shrink-0"
    >
      {failed ? null : (
        <div className="mb-2 flex items-center justify-center">
          <span className="px-1 text-[11px] font-medium tracking-wide text-slate-400">
            {plate}
          </span>
        </div>
      )}
      {hasArt ? (
        <div
          className={`relative aspect-video w-full overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 shadow-2xl shadow-black/60 ${isScreentone ? 'manga-screentone-panel' : ''}`}
        >
          <PanelImageSlot src={images[0]} alt={plate} status="ready" isScreentone={isScreentone} framed />
        </div>
      ) : failed ? (
        <p className="mb-2 px-1 text-center text-xs text-slate-500">{splashUnavailableLine(entry)}</p>
      ) : (
        <div
          className={`relative aspect-video w-full overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 shadow-2xl shadow-black/60 ${isScreentone ? 'manga-screentone-panel' : ''}`}
        >
          <PanelPlaceholder status="pending" isScreentone={isScreentone} framed message="Painting this moment…" />
        </div>
      )}
      <div className="comic-panel-caption mt-3 px-1">
        <FormattedText content={entry.content} lorebook={lorebook} />
      </div>
    </article>
  );
}

/**
 * Legendary Loot Video callout. Renders a native <video> once the loot-video job resolves;
 * otherwise a distinct pending/error placeholder (never hangs indefinitely — the queue in
 * useGame.ts enforces its own timeout, including a fast fail when no provider is configured).
 */
function LootVideoPanel({ entry }: { entry: LogEntry }) {
  const status: PanelImageStatus = entry.videoUrl ? 'ready' : entry.imageStatus ?? 'pending';

  return (
    <article
      data-entry-id={entry.id}
      data-turn={entry.turn}
      data-panel-kind="loot-video"
      className="comic-panel-cell loot-video-panel w-full shrink-0"
    >
      <div className="mb-2 flex items-center justify-center">
        <span className="rounded-full border border-fuchsia-500/60 bg-fuchsia-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
          🎬 Legendary Drop{entry.lootItemName ? `: ${entry.lootItemName}` : ''}
        </span>
      </div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-fuchsia-600/50 bg-slate-950 shadow-xl shadow-black/50">
        {status === 'ready' && entry.videoUrl ? (
          <video
            src={entry.videoUrl}
            controls
            autoPlay
            loop
            muted
            className="absolute inset-0 block h-full w-full object-contain"
          />
        ) : (
          <PanelPlaceholder status={status} isScreentone={false} framed />
        )}
      </div>
    </article>
  );
}

/**
 * Maps Director `text_anchor` values onto absolutely positioned overlay clusters.
 * Classes handle flex alignment; inline coordinates pin the cluster to the panel edge
 * so bubbles bind to the LLM-planned negative space instead of flowing under the artwork.
 */
const ANCHORED_OVERLAY_GROUP_POSITIONS: Record<
  ComicTextAnchor,
  { className: string; style: CSSProperties }
> = {
  'top-left': {
    className: 'absolute items-start',
    style: { top: 8, left: 8, right: 'auto', bottom: 'auto', transform: 'none' },
  },
  'top-right': {
    className: 'absolute items-end',
    style: { top: 8, right: 8, left: 'auto', bottom: 'auto', transform: 'none' },
  },
  'bottom-left': {
    className: 'absolute items-start',
    style: { bottom: 8, left: 8, right: 'auto', top: 'auto', transform: 'none' },
  },
  'bottom-right': {
    className: 'absolute items-end',
    style: { bottom: 8, right: 8, left: 'auto', top: 'auto', transform: 'none' },
  },
  'bottom-center': {
    className: 'absolute items-center',
    style: { bottom: 8, left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' },
  },
};

function OverlayChip({
  segment,
  theme,
}: {
  segment: NarrativeSegment;
  theme: UiOverlayTheme;
}) {
  if (segment.type === 'dialogue' || segment.type === 'thought') {
    return (
      <SpeechBubble
        data={{
          speaker: segment.speaker ?? '',
          text: segment.text,
          type: segment.type === 'dialogue' ? 'speech' : 'thought',
        }}
        theme={theme}
        className="shadow-2xl"
      />
    );
  }
  if (segment.type === 'scene') {
    return (
      <SpeechBubble
        data={{ speaker: '', text: segment.text, type: 'narration' }}
        theme={theme}
        className="shadow-2xl"
      />
    );
  }
  if (segment.type === 'effect') {
    return (
      <div
        className="comic-overlay-scrollbar h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto rotate-[-6deg] whitespace-pre-wrap break-words rounded border-2 p-3 text-xs font-black uppercase tracking-wider shadow-2xl"
        style={{ borderColor: theme.accentColor, color: theme.accentColor, backgroundColor: '#ffffff' }}
      >
        {segment.text}
      </div>
    );
  }
  if (segment.type === 'system') {
    return (
      <div className="comic-overlay-scrollbar h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words rounded border border-sky-500/50 bg-sky-950/95 p-3 font-mono text-[10px] text-sky-100 shadow-2xl backdrop-blur-sm">
        <div className="mb-1 text-[8px] font-bold uppercase tracking-[0.2em] text-sky-400/90">
          In-world System
        </div>
        {segment.text}
      </div>
    );
  }
  return null;
}

/** Default normalized chip origin matching the canvas compositor's anchor stacking. */
function defaultChipNormPos(anchor: ComicTextAnchor, index: number): { x: number; y: number } {
  const a = normalizeTextAnchor(anchor);
  const stack = index * 0.14;
  switch (a) {
    case 'top-left':
      return { x: 0.03, y: 0.03 + stack };
    case 'top-right':
      return { x: 0.28, y: 0.03 + stack };
    case 'bottom-left':
      return { x: 0.03, y: Math.max(0.03, 0.72 - stack) };
    case 'bottom-right':
      return { x: 0.28, y: Math.max(0.03, 0.72 - stack) };
    case 'bottom-center':
    default:
      return { x: 0.14, y: Math.max(0.03, 0.72 - stack) };
  }
}

function applySegmentEdit(segment: NarrativeSegment, edit?: ComicOverlayEdit): NarrativeSegment {
  if (!edit?.text?.trim()) return segment;
  return { ...segment, text: edit.text.trim() } as NarrativeSegment;
}

function EditableOverlayChip({
  segment,
  segmentIndex,
  theme,
  editorMode,
  x,
  y,
  textOverride,
  onCommit,
}: {
  segment: NarrativeSegment;
  segmentIndex: number;
  theme: UiOverlayTheme;
  editorMode: boolean;
  x: number;
  y: number;
  textOverride?: string;
  onCommit?: (patch: Omit<ComicOverlayEdit, 'segmentIndex'>) => void;
}) {
  const [localPos, setLocalPos] = useState({ x, y });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(textOverride ?? segment.text);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    parentW: number;
    parentH: number;
  } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    setLocalPos({ x, y });
  }, [x, y]);

  useEffect(() => {
    setDraft(textOverride ?? segment.text);
  }, [textOverride, segment.text]);

  const displaySegment = applySegmentEdit(segment, draft !== segment.text ? { segmentIndex, text: draft } : undefined);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!editorMode || editing) return;
    const parent = e.currentTarget.offsetParent as HTMLElement | null;
    if (!parent) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    const rect = parent.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: localPos.x,
      origY: localPos.y,
      parentW: Math.max(1, rect.width),
      parentH: Math.max(1, rect.height),
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / dragRef.current.parentW;
    const dy = (e.clientY - dragRef.current.startY) / dragRef.current.parentH;
    if (Math.abs(dx) + Math.abs(dy) > 0.004) movedRef.current = true;
    setLocalPos({
      x: Math.max(0, Math.min(0.85, dragRef.current.origX + dx)),
      y: Math.max(0, Math.min(0.85, dragRef.current.origY + dy)),
    });
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (!movedRef.current) return;
    setLocalPos((pos) => {
      onCommit?.({
        x: pos.x,
        y: pos.y,
        ...(textOverride !== undefined ? { text: textOverride } : {}),
      });
      return pos;
    });
  };

  const commitText = () => {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === (textOverride ?? segment.text)) return;
    onCommit?.({ x: localPos.x, y: localPos.y, text: next });
  };

  return (
    <div
      className={`pointer-events-auto absolute z-40 max-w-[72%] touch-none ${
        editorMode ? 'cursor-grab active:cursor-grabbing ring-1 ring-amber-400/50 rounded-md' : ''
      }`}
      style={{ left: `${localPos.x * 100}%`, top: `${localPos.y * 100}%` }}
      data-segment-index={segmentIndex}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(e) => {
        if (!editorMode) return;
        e.preventDefault();
        setEditing(true);
      }}
    >
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitText();
            }
            if (e.key === 'Escape') {
              setDraft(textOverride ?? segment.text);
              setEditing(false);
            }
          }}
          className="min-h-[4.5rem] w-48 resize-y rounded border border-amber-400/60 bg-white p-2 text-xs text-slate-900 shadow-xl outline-none"
        />
      ) : (
        <OverlayChip segment={displaySegment} theme={theme} />
      )}
    </div>
  );
}

function ComicPanelCell({
  panel,
  isScreentone,
  index,
  entryId,
  turn,
  theme,
  featured = false,
  tall = false,
  editorMode = false,
  onRetry,
  onUpdateOverlay,
}: {
  panel: ComicPanel;
  isScreentone: boolean;
  index: number;
  entryId?: string;
  turn?: number;
  theme: UiOverlayTheme;
  featured?: boolean;
  /** Webtoon vertical scroll uses taller panel frames. */
  tall?: boolean;
  editorMode?: boolean;
  onRetry?: () => void;
  onUpdateOverlay?: (edit: ComicOverlayEdit) => void;
}) {
  const panelClass = isScreentone ? 'manga-screentone-panel' : '';
  const status = resolvePanelStatus(panel);
  const segments = useMemo(
    () => (panel.narrative ? parseNarrativeSegments(panel.narrative) : []),
    [panel.narrative]
  );
  const edits = panel.overlayEdits ?? [];
  const hasPositionEdits = edits.some(
    (edit) => typeof edit.x === 'number' && typeof edit.y === 'number'
  );
  const freeformLayout = editorMode || hasPositionEdits;
  // Prefer the Director/LLM text_anchor payload. Only fall back to a deterministic stagger
  // when the script omitted an anchor entirely.
  const directorAnchor = panel.textAnchor
    ? normalizeTextAnchor(panel.textAnchor)
    : null;
  const staggeredFallback: ComicTextAnchor = (
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
  )[index % 4];
  const initialAnchor = directorAnchor ?? staggeredFallback;
  const [autoAnchor, setAutoAnchor] = useState<ComicTextAnchor>(initialAnchor);
  const analysisVersionRef = useRef(0);
  const overlayPlacement = ANCHORED_OVERLAY_GROUP_POSITIONS[autoAnchor];
  // Webtoon = tall scroll frames; splash/featured = 16:9; otherwise square.
  const aspectClass = tall ? 'aspect-[3/4]' : featured ? 'aspect-video' : 'aspect-square';

  useEffect(() => {
    analysisVersionRef.current += 1;
    setAutoAnchor(initialAnchor);
  }, [panel.imageUrl, initialAnchor]);

  const handlePanelImageLoad = (image: HTMLImageElement) => {
    // When the LLM already planned negative space, keep that binding — do not let canvas
    // analysis override the scripted anchor.
    if (directorAnchor) {
      setAutoAnchor(directorAnchor);
      return;
    }

    const analysisVersion = ++analysisVersionRef.current;
    void findQuietQuadrant(image)
      .then((quietQuadrant) => {
        if (analysisVersion === analysisVersionRef.current) {
          setAutoAnchor(normalizeTextAnchor(quietQuadrant, staggeredFallback));
        }
      })
      .catch(() => {
        if (analysisVersion === analysisVersionRef.current) setAutoAnchor(staggeredFallback);
      });
  };

  return (
    <article
      data-entry-id={entryId}
      data-turn={turn}
      data-panel-index={index}
      data-panel-kind="comic-panel"
      data-text-anchor={autoAnchor}
      data-editor-mode={editorMode ? 'true' : 'false'}
      className={`comic-panel-cell relative h-full w-full overflow-visible ${panelClass}`}
    >
      <div
        className={`comic-panel-frame relative ${aspectClass} w-full overflow-visible rounded-xl bg-slate-950 shadow-xl shadow-black/50 ${panelClass}`}
        style={{ borderStyle: 'solid', borderWidth: theme.panelBorderWidth, borderColor: theme.panelBorderColor }}
      >
        <div className="comic-panel-art-zone absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <PanelImageSlot
            src={panel.imageUrl}
            alt={`Panel ${index + 1}`}
            status={status}
            isScreentone={isScreentone}
            framed
            onLoad={handlePanelImageLoad}
            onRetry={onRetry}
          />
        </div>

        {segments.length > 0 && !freeformLayout && (
          <div
            className={`${overlayPlacement.className} comic-overlay-scrollbar pointer-events-auto z-40 flex h-fit min-h-min w-fit max-h-[45%] max-w-[72%] shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain`}
            style={overlayPlacement.style}
            data-overlay-anchor={autoAnchor}
          >
            {segments.map((segment, segmentIndex) => {
              const edit = edits.find((item) => item.segmentIndex === segmentIndex);
              return (
                <OverlayChip
                  key={`${segment.type}-${segmentIndex}`}
                  segment={applySegmentEdit(segment, edit)}
                  theme={theme}
                />
              );
            })}
          </div>
        )}

        {segments.length > 0 && freeformLayout && (
          <div className="pointer-events-none absolute inset-0 z-40" data-overlay-layout="freeform">
            {segments.map((segment, segmentIndex) => {
              const edit = edits.find((item) => item.segmentIndex === segmentIndex);
              const pos =
                typeof edit?.x === 'number' && typeof edit?.y === 'number'
                  ? { x: edit.x, y: edit.y }
                  : defaultChipNormPos(autoAnchor, segmentIndex);
              return (
                <EditableOverlayChip
                  key={`${segment.type}-${segmentIndex}`}
                  segment={segment}
                  segmentIndex={segmentIndex}
                  theme={theme}
                  editorMode={editorMode}
                  x={pos.x}
                  y={pos.y}
                  textOverride={edit?.text}
                  onCommit={
                    onUpdateOverlay
                      ? (patch) => onUpdateOverlay({ segmentIndex, ...patch })
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

