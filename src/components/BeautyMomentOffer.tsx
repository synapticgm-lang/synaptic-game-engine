import type { BeautyMomentOffer } from '@/game/types';
import { loadCapacityLedger, memorableRemaining } from '@/game/capacityLedger';
import { getTierDefinition } from '@/game/subscriptionTiers';

interface Props {
  offer?: BeautyMomentOffer;
  onAccept?: () => void;
  onDismiss?: () => void;
}

/** Quiet text-link under a turn — never a blocking modal. */
export function BeautyMomentOfferLink({ offer, onAccept, onDismiss }: Props) {
  if (!offer || offer.status !== 'pending' || !onAccept || !onDismiss) return null;
  const remaining = memorableRemaining();
  const weeklyCap = getTierDefinition(loadCapacityLedger().tier).memorableImagesPerWeek;
  return (
    <p className="px-1 pt-1 text-xs text-slate-500">
      <button
        type="button"
        onClick={onAccept}
        className="text-amber-300/90 underline-offset-2 hover:text-amber-200 hover:underline"
      >
        Generate a picture of this moment?
      </button>
      <span className="mx-1.5 text-slate-600">·</span>
      <span className="text-slate-500">
        {remaining} of {weeklyCap} left this week
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
