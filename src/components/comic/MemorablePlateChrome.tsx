import type { ReactNode } from 'react';
import { useZoomGesture } from './useZoomGesture';

export type MemorablePlateStatus = 'pending' | 'ready' | 'error' | 'failed';

export interface MemorablePlateChromeProps {
  /** Plate title / receipt (Chapter One, First Blood, …). */
  title: string;
  imageUrl?: string | null;
  status: MemorablePlateStatus;
  failMessage?: string;
  caption?: ReactNode;
  /** Optional HTML lettering overlay (bubble/caption) — never baked into pixels. */
  overlay?: ReactNode;
  onRetry?: () => void;
  /** Enable pinch/ctrl-wheel zoom on the plate art. */
  enableZoom?: boolean;
  className?: string;
  /** data-panel-kind for tests / a11y. */
  panelKind?: string;
  entryId?: string;
  turn?: number;
}

/**
 * Shared comic chrome for Memorable plates — border, gutter, caption, zoom, receipt.
 * Classic Text mounts this WITHOUT ComicGrid. Comic mode may reuse it for milestones.
 */
export function MemorablePlateChrome({
  title,
  imageUrl,
  status,
  failMessage,
  caption,
  overlay,
  onRetry,
  enableZoom = true,
  className = '',
  panelKind = 'memorable',
  entryId,
  turn,
}: MemorablePlateChromeProps) {
  const zoom = useZoomGesture();
  const failed = !imageUrl && (status === 'error' || status === 'failed');
  const pending = !imageUrl && !failed;

  return (
    <article
      data-entry-id={entryId}
      data-turn={turn}
      data-panel-kind={panelKind}
      data-comic-grid="false"
      className={`memorable-plate-chrome space-y-2 ${className}`}
    >
      <div className="flex justify-center">
        <span className="px-2 text-[11px] font-medium tracking-wide text-slate-400">
          {title}
        </span>
      </div>

      {imageUrl ? (
        <div
          ref={enableZoom ? zoom.containerRef : undefined}
          className="relative overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 shadow-2xl shadow-black/60"
          style={enableZoom ? { touchAction: 'pan-y' } : undefined}
        >
          <div
            className="origin-center transition-transform duration-150"
            style={enableZoom ? { transform: `scale(${zoom.scale})` } : undefined}
          >
            <img
              src={imageUrl}
              alt={title}
              className="block max-h-[70vh] w-full object-contain"
              draggable={false}
            />
          </div>
          {overlay ? (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center">
              <div className="pointer-events-auto max-w-[92%]">{overlay}</div>
            </div>
          ) : null}
          {enableZoom && zoom.scale !== 1 ? (
            <div className="absolute right-2 top-2 z-20 flex gap-1">
              <button
                type="button"
                onClick={zoom.reset}
                className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-slate-200"
              >
                Reset zoom
              </button>
            </div>
          ) : null}
        </div>
      ) : failed ? (
        <div className="space-y-2 px-1 text-center">
          <p className="text-xs text-slate-500">{failMessage || 'Hosted image service is unavailable.'}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-slate-200"
            >
              Try picture again
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 text-xs text-slate-500 shadow-2xl shadow-black/60">
          {pending ? 'Painting this moment…' : '…'}
        </div>
      )}

      {caption ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          {caption}
        </div>
      ) : null}
    </article>
  );
}
