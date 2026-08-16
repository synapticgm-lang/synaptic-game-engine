import { useState } from 'react';
import { Loader2, Tv, X } from 'lucide-react';
import {
  canOfferRewardedMemorable,
  watchRewardedAdForMemorable,
} from '@/game/rewardedAds';
import { MAX_MEMORABLE_ADS_PER_DAY, MAX_MEMORABLE_ADS_PER_WEEK } from '@/game/capacityLedger';

interface Props {
  contentMode?: string | null;
  open: boolean;
  onClose: () => void;
  onGranted: () => void;
}

/** Opt-in when Free hits the weekly memorable cap. Cheap schnell splash only. */
export function OutOfMemorableAdOffer({ contentMode, open, onClose, onGranted }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open || !canOfferRewardedMemorable(contentMode)) return null;

  const watch = async () => {
    setBusy(true);
    setError(null);
    const result = await watchRewardedAdForMemorable({ contentMode });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Ad failed');
      return;
    }
    onGranted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-100">Weekly pictures used</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-300">
            You’ve used this week’s memorable pictures. Watch an ad for{' '}
            <span className="font-medium text-amber-300">+1 memorable picture</span> on the fast model.
            Optional — the story continues either way.
          </p>
          <p className="text-[11px] text-slate-500">
            Extra pictures: {MAX_MEMORABLE_ADS_PER_DAY}/day, {MAX_MEMORABLE_ADS_PER_WEEK}/week. Does not reset your weekly count.
          </p>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void watch()}
              className="flex items-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Tv size={16} />}
              Watch an ad for +1 memorable picture
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
