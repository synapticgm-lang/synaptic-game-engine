import { TERMS_DOC, PRIVACY_DOC } from '@/legal/legalDocs';
import { CREDITS_PATH } from '@/legal/credits';

/** Compact footer links — same pattern as most consumer sites. */
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 ${className}`}
      aria-label="Legal"
    >
      <a href={TERMS_DOC.path} className="hover:text-slate-300 underline-offset-2 hover:underline">
        Terms of Service
      </a>
      <span className="text-slate-700" aria-hidden>
        ·
      </span>
      <a href={PRIVACY_DOC.path} className="hover:text-slate-300 underline-offset-2 hover:underline">
        Privacy Policy
      </a>
      <span className="text-slate-700" aria-hidden>
        ·
      </span>
      <a href={CREDITS_PATH} className="hover:text-slate-300 underline-offset-2 hover:underline">
        Credits
      </a>
    </nav>
  );
}
