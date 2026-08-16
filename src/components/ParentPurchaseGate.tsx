import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import {
  canSkipParentPurchasePrompt,
  grantParentPurchaseGrace,
  needsParentPurchaseGate,
} from '@/game/parentPurchaseGate';

interface Props {
  contentMode?: string | null;
  /** Kid Mode PIN from settings (null if never set). */
  contentPin: string | null | undefined;
  verifyPin: (pin: string) => boolean;
  open: boolean;
  onClose: () => void;
  /** Called only after adult PIN succeeds (or gate not needed). */
  onApproved: () => void;
}

/**
 * “Ask a parent” dialog before packs / themes / subs in Kid Mode.
 */
export function ParentPurchaseGate({
  contentMode,
  contentPin,
  verifyPin,
  open,
  onClose,
  onApproved,
}: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const noPinConfigured = needsParentPurchaseGate(contentMode) && !contentPin;

  const confirm = () => {
    if (noPinConfigured) {
      setError('Ask a parent to set a Kid Mode PIN in Settings first.');
      return;
    }
    if (!verifyPin(pin)) {
      setError('Incorrect PIN.');
      return;
    }
    grantParentPurchaseGrace();
    setPin('');
    setError(null);
    onApproved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-amber-800/50 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <Lock size={16} className="text-amber-400" />
            Ask a parent
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-300">
            Purchases need a grown-up. Enter the Kid Mode PIN to continue. Ads do not need a PIN.
          </p>
          {noPinConfigured ? (
            <p className="text-xs text-amber-300/90">
              No PIN is set yet. A parent should open Settings → Kid Mode and set a PIN, then try again.
            </p>
          ) : (
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirm();
              }}
              placeholder="Parent PIN"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-lg tracking-widest text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            {!noPinConfigured && (
              <button
                type="button"
                onClick={confirm}
                className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                Unlock purchase
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Run `action` now, or after parent PIN if Kid Mode requires it. */
export function requestParentPurchaseApproval(args: {
  contentMode?: string | null;
  contentPin: string | null | undefined;
  openGate: () => void;
  action: () => void;
}): void {
  if (canSkipParentPurchasePrompt(args.contentMode)) {
    args.action();
    return;
  }
  if (needsParentPurchaseGate(args.contentMode) && !args.contentPin) {
    args.openGate();
    return;
  }
  args.openGate();
}
