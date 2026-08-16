/**
 * Parent / adult gate for real-money purchases while Kid Mode is on.
 * Ads stay kid-accessible; packs, themes, subs need the Kid Mode PIN.
 */

const SESSION_KEY = 'synapticgm-parent-purchase-ok-until';
/** After a correct PIN, skip re-prompt for a short window (multi-buy). */
const GRACE_MS = 15 * 60 * 1000;

/** Shown when a parent sets the Kid Mode PIN — keep wording plain. */
export const KID_MODE_PIN_DISCLAIMER =
  'This PIN protects Kid Mode settings and in-game purchases (packs, themes, subscriptions). Keep it private and do not share it with children. SynapticGM is not responsible if a child learns or guesses the PIN and makes purchases, changes settings, or exits Kid Mode. By setting a PIN you accept that you are responsible for keeping it secure.';

export function needsParentPurchaseGate(contentMode: string | null | undefined): boolean {
  return contentMode === 'kid';
}

export function hasParentPurchaseGrace(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until) || Date.now() > until) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function grantParentPurchaseGrace(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now() + GRACE_MS));
  } catch {
    /* ignore */
  }
}

export function clearParentPurchaseGrace(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * True if purchase may proceed without showing the PIN dialog.
 * Still requires a PIN to exist when in Kid Mode (grace only after unlock).
 */
export function canSkipParentPurchasePrompt(contentMode: string | null | undefined): boolean {
  if (!needsParentPurchaseGate(contentMode)) return true;
  return hasParentPurchaseGrace();
}
