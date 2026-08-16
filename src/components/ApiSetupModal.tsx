import { useState } from 'react';
import { X, Baby, Shield } from 'lucide-react';
import type { Settings, ContentMode } from '@/game/types';
import { canConfigurePlayerAiKeys } from '@/game/distributionChannel';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onSetContentMode: (mode: ContentMode, pin?: string) => void;
  onClose: () => void;
}

/**
 * Content-mode helper from the game HUD.
 * Player API keys are never collected here — Admin BYOK keys live only in Settings.
 */
export function ApiSetupModal({ settings, onSave, onSetContentMode, onClose }: Props) {
  const [mode, setMode] = useState<ContentMode>(settings.contentMode);
  const adminKeys = canConfigurePlayerAiKeys(settings);

  const save = () => {
    onSetContentMode(mode);
    onSave({ ...settings, contentMode: mode });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Content profile</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-[11px] leading-relaxed text-slate-400">
          {adminKeys
            ? 'AI keys for Admin BYOK are under Settings → General → AI Keys (Text AI key and Image AI key). This panel only switches Kid / Adult mode.'
            : 'SynapticGM hosts the AI on this account. Player API keys are not available here (store builds and Free/Mid/High never collect keys).'}
        </p>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setMode('kid')}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left ${
              mode === 'kid' ? 'border-crimson-500 bg-crimson-950/40' : 'border-slate-700 bg-slate-800/40'
            }`}
          >
            <Baby size={18} className="text-crimson-400" />
            <span>
              <span className="block text-sm text-slate-100">Kid / Safe Mode</span>
              <span className="text-[11px] text-slate-400">Family-friendly — meets store child-safety expectations.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('adult')}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left ${
              mode === 'adult' ? 'border-crimson-500 bg-crimson-950/40' : 'border-slate-700 bg-slate-800/40'
            }`}
          >
            <Shield size={18} className="text-crimson-400" />
            <span>
              <span className="block text-sm text-slate-100">Standard / Adult Mode</span>
              <span className="text-[11px] text-slate-400">Mature fantasy; store builds stay fade-to-black / non-pornographic.</span>
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={save}
          className="mt-5 w-full rounded-lg bg-crimson-600 py-2.5 text-sm font-semibold text-white hover:bg-crimson-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}
