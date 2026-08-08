import { useState } from 'react';
import { AlertTriangle, Swords, Shield } from 'lucide-react';

const STORAGE_KEY = 'tactical-litrpg-autofight-warning-dismissed';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isAutoFightWarningDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    return Date.now() - dismissedAt < ONE_DAY_MS;
  } catch {
    return false;
  }
}

export function setAutoFightWarningDismissed() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

interface Props {
  enemyName: string;
  enemyLevel: number;
  playerLevel: number;
  onProceed: () => void;
  onCancel: () => void;
}

export function AutoFightWarningModal({ enemyName, enemyLevel, playerLevel, onProceed, onCancel }: Props) {
  const [dontShow, setDontShow] = useState(false);

  const handleProceed = () => {
    if (dontShow) setAutoFightWarningDismissed();
    onProceed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-amber-800/60 bg-slate-950 shadow-2xl shadow-amber-900/20">
        <div className="flex items-center gap-3 border-b border-amber-900/40 bg-amber-950/30 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/30">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-200">System Warning</h2>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-300">
            Target threat level exceeds your current stats. The System calculates a high probability of failure in an Auto-Resolve.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {enemyName} (Level {enemyLevel}) vs You (Level {playerLevel})
          </p>
          <p className="mt-3 text-xs font-medium text-amber-300/80">
            Proceed at your own risk.
          </p>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 accent-amber-500"
            />
            Don't show this warning again today
          </label>
        </div>

        <div className="flex gap-2 border-t border-slate-800 px-5 py-4">
          <button
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
          >
            <Shield size={15} />
            Fight Manually
          </button>
          <button
            onClick={handleProceed}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-700/50 bg-amber-900/40 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-800/50"
          >
            <Swords size={15} />
            Risk It
          </button>
        </div>
      </div>
    </div>
  );
}
