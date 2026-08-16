import type { BeautyMomentOffer } from '@/game/types';
import { memorableRemaining, memorableWeeklyCapLabel } from '@/game/capacityLedger';
import { canOfferRewardedMemorable } from '@/game/rewardedAds';

interface Props {
  offer?: BeautyMomentOffer;
  contentMode?: string | null;
  onAccept?: () => void;
  onDismiss?: () => void;
  onWatchMemorableAd?: () => void;
}

/** Quiet text-link under a turn — never a blocking modal. */
export function BeautyMomentOfferLink({ offer, contentMode, onAccept, onDismiss, onWatchMemorableAd }: Props) {
  if (!offer || offer.status !== 'pending' || !onAccept || !onDismiss) return null;
  const remaining = memorableRemaining();
  const showAd = remaining <= 0 && canOfferRewardedMemorable(contentMode);
  return (
    <p className="px-1 pt-1 text-xs text-slate-500">
      {showAd ? (
        <button
          type="button"
          onClick={() => (onWatchMemorableAd ?? onAccept)()}
          className="text-amber-300/90 underline-offset-2 hover:text-amber-200 hover:underline"
        >
          Watch an ad for +1 memorable picture
        </button>
      ) : (
        <button
          type="button"
          onClick={onAccept}
          className="text-amber-300/90 underline-offset-2 hover:text-amber-200 hover:underline"
        >
          Generate a picture of this moment?
        </button>
      )}
      <span className="mx-1.5 text-slate-600">·</span>
      <span className="text-slate-500">
        {memorableWeeklyCapLabel()}
      </span>
      <span className="mx-1.5 text-slate-600">·</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300"
      >
        No thanks
      </button>
    </p>
  );
}
