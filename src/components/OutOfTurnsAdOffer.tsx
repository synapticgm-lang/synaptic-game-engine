import { useState } from 'react';
import { Loader2, Tv, X } from 'lucide-react';
import {
  canOfferRewardedTurns,
  canWatchRewardedAdNow,
  rewardedAdsRemainingToday,
  rewardedTurnsPerAd,
  watchRewardedAdForTurns,
  ADULT_MAX_REWARDED_ADS_PER_DAY,
} from '@/game/rewardedAds';

interface Props {
  contentMode?: string | null;
  open: boolean;
  onClose: () => void;
  onGranted: (turns: number) => void;
}

/** Soft prompt when the player runs out of text turns. */
export function OutOfTurnsAdOffer({ contentMode, open, onClose, onGranted }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open || !canOfferRewardedTurns(contentMode)) return null;

  const turns = rewardedTurnsPerAd(contentMode);
  const canWatch = canWatchRewardedAdNow(contentMode);
  const adsLeft = rewardedAdsRemainingToday(contentMode);
  const isKid = contentMode === 'kid';

  const watch = async () => {
    setBusy(true);
    setError(null);
    const result = await watchRewardedAdForTurns({ contentMode });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Ad failed');
      return;
    }
    onGranted(result.turnsGranted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-100">Out of turns</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-300">
            Today’s allowance is used up.
            {canWatch ? (
              <>
                {' '}
                Watch an ad for{' '}
                <span className="text-cyan-300 font-medium">+{turns} turns</span> today, buy a pack in the
                Shop, or come back tomorrow.
              </>
            ) : (
              <> Buy a turn pack or upgrade — or come back tomorrow.</>
            )}
          </p>
          <p className="text-[11px] text-slate-500">
            {isKid
              ? 'Kid Mode: watch as many completed ads as you like from Shop → Earn turns.'
              : `Adult Free: ${adsLeft ?? 0} of ${ADULT_MAX_REWARDED_ADS_PER_DAY} ads left today. Then packs or a sub.`}
          </p>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {canWatch && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void watch()}
                className="flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Tv size={16} />}
                Watch for +{turns} turns
              </button>
            )}
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
