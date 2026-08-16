import { useState } from 'react';
import { Swords, Zap } from 'lucide-react';

const STORAGE_KEY = 'synapticgm-autofight-tip-dismissed';

export function isAutoFightTipDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAutoFightTipDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

interface Props {
  /** Current preferred combat mode from settings. */
  combatResolveMode: 'full' | 'auto';
  onEnableAuto: () => void;
  onDismiss: () => void;
}

/**
 * One-time tip shown in every engine mode (LitRPG / D&D / story RPG)
 * once the player is in an active session.
 */
export function AutoFightTipModal({ combatResolveMode, onEnableAuto, onDismiss }: Props) {
  const [dontShow, setDontShow] = useState(true);
  const alreadyAuto = combatResolveMode === 'auto';

  const finish = (enable: boolean) => {
    if (dontShow) setAutoFightTipDismissed();
    if (enable) onEnableAuto();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-crimson-800/50 bg-slate-950 shadow-2xl shadow-crimson-950/40">
        <div className="flex items-center gap-3 border-b border-crimson-900/40 bg-crimson-950/30 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-crimson-700/50 bg-crimson-900/30">
            <Zap size={20} className="text-crimson-300" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson-400">Tip</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-crimson-100">Save turns with Auto Fight</h2>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-slate-300">
          <p>
            Fighting round-by-round can burn through many turns. Switch on{' '}
            <span className="font-medium text-crimson-200">Auto Fight</span> to resolve most encounters in about{' '}
            <span className="font-medium text-slate-100">1–2 turns</span> instead.
          </p>
          <p className="text-xs text-slate-500">
            Same dice, HP, and loot — you just spend fewer story turns. Works in LitRPG, D&amp;D, and story RPG.
            Change anytime in Settings → Mechanics.
          </p>
          {alreadyAuto && (
            <p className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
              Auto Fight is already on for this device.
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
            onClick={() => finish(false)}
            className="flex flex-1 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
          >
            Got it
          </button>
          {!alreadyAuto && (
            <button
              type="button"
              onClick={() => finish(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-crimson-700/50 bg-crimson-900/40 px-4 py-2.5 text-sm font-medium text-crimson-100 transition-colors hover:bg-crimson-800/50"
            >
              <Swords size={15} />
              Turn on Auto Fight
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
