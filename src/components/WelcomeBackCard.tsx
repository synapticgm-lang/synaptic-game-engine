/**
 * T10RECAP — dismissible welcome-back card. Lines come from buildAwayRecap (pure); this only paints.
 */
interface Props {
  lines: string[];
  onDismiss: () => void;
}

export function WelcomeBackCard({ lines, onDismiss }: Props) {
  if (!lines.length) return null;
  return (
    <div
      className="sgm-welcome-back mb-3 rounded border border-amber-900/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-50/95 shadow-sm"
      role="status"
      data-testid="welcome-back-recap"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-serif text-xs uppercase tracking-wide text-amber-200/80">Welcome back</p>
        <button
          type="button"
          className="shrink-0 rounded px-1.5 py-0.5 text-xs text-amber-100/80 hover:bg-amber-900/50 hover:text-amber-50"
          onClick={onDismiss}
          aria-label="Dismiss welcome back"
          data-testid="welcome-back-dismiss"
        >
          Dismiss
        </button>
      </div>
      <ul className="sgm-prose-face space-y-0.5 text-[0.95rem] leading-snug">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
