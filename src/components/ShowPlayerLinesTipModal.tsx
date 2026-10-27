import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

const STORAGE_KEY = 'synapticgm-show-player-lines-tip-dismissed';

export function isShowPlayerLinesTipDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setShowPlayerLinesTipDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

interface Props {
  /** Current preference from settings (default off = hidden). */
  showPlayerLines: boolean;
  onEnableShow: () => void;
  onDismiss: () => void;
}

/**
 * One-time tip on the first turn: player lines are hidden by default;
 * Settings → Narrative toggles them back into the story feed.
 */
export function ShowPlayerLinesTipModal({ showPlayerLines, onEnableShow, onDismiss }: Props) {
  const [dontShow, setDontShow] = useState(true);
  const alreadyOn = showPlayerLines;

  const finish = (enable: boolean) => {
    if (dontShow) setShowPlayerLinesTipDismissed();
    if (enable) onEnableShow();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-crimson-800/50 bg-slate-950 shadow-2xl shadow-crimson-950/40">
        <div className="flex items-center gap-3 border-b border-crimson-900/40 bg-crimson-950/30 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-crimson-700/50 bg-crimson-900/30">
            <MessageCircle size={20} className="text-crimson-300" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson-400">Tip</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-crimson-100">Your lines stay off the feed</h2>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-slate-300">
          <p>
            Your typed lines are{' '}
            <span className="font-medium text-crimson-200">hidden in the story feed</span> by default
            so the book reads as narration only.
          </p>
          <p className="text-xs text-slate-500">
            Turn on <span className="font-medium text-slate-300">Show my typed lines</span> anytime in
            Settings → Narrative &amp; Tone if you want your bubbles back.
          </p>
          {alreadyOn && (
            <p className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
              Show my typed lines is already on for this device.
            </p>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 accent-crimson-500"
            />
            Don&apos;t show this tip again
          </label>
        </div>

        <div className="flex gap-2 border-t border-slate-800 px-5 py-4">
          <button
            type="button"
            data-dismiss=""
            onClick={() => finish(false)}
            className="flex flex-1 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
          >
            Got it
          </button>
          {!alreadyOn && (
            <button
              type="button"
              onClick={() => finish(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-crimson-700/50 bg-crimson-900/40 px-4 py-2.5 text-sm font-medium text-crimson-100 transition-colors hover:bg-crimson-800/50"
            >
              <MessageCircle size={15} />
              Show my lines
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
