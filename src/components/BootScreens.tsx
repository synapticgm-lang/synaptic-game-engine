import { useEffect } from 'react';
import { RefreshCw, Cloud, ChevronRight, UserRound } from 'lucide-react';
import type { BootPhase } from '@/game/useGame';
import { LegalLinks } from './LegalLinks';

export function WelcomeSplash({ onTap }: { onTap: () => void }) {
  useEffect(() => {
    const handler = () => onTap();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTap]);

  return (
    <button
      onClick={onTap}
      className="group relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 transition-colors"
    >
      <img
        src="/backgrounds/bg-landscape.png"
        alt=""
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-[3000ms] ease-out group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(2,6,23,0.3)_0%,_rgba(2,6,23,0.85)_80%)]" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <div className="relative">
          <img src="/game-logo.jpg" alt="Game logo" className="w-24 h-24 object-cover mix-blend-screen rounded-full drop-shadow-lg mb-4" />
          <div className="absolute -inset-4 rounded-full bg-amber-500/5 blur-2xl" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-amber-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-5xl">
            Welcome, Adventurer
          </h1>
          <p className="text-sm text-amber-200/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] sm:text-base">
            Your story awaits beyond the threshold
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="flex items-center gap-2 rounded-full border border-amber-600/40 bg-slate-950/50 px-6 py-3 text-sm font-medium text-amber-100 backdrop-blur-sm transition-all duration-300 group-hover:border-amber-500/70 group-hover:text-amber-200 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.2)]">
            <span>Press any key or tap to continue</span>
            <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </div>
          <p className="text-[11px] text-amber-200/40">Press any key or tap anywhere to begin</p>
          <div
            className="pointer-events-auto pt-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-amber-200/35" aria-label="Legal">
              <a href="/terms" className="hover:text-amber-100/70 underline-offset-2 hover:underline">Terms</a>
              <span aria-hidden>·</span>
              <a href="/privacy" className="hover:text-amber-100/70 underline-offset-2 hover:underline">Privacy</a>
              <span aria-hidden>·</span>
              <a href="/credits" className="hover:text-amber-100/70 underline-offset-2 hover:underline">Credits</a>
            </nav>
          </div>
        </div>
      </div>
    </button>
  );
}

export function BootSplash({ phase }: { phase: BootPhase }) {
  const message = phase === 'syncing'
    ? 'Syncing with the Game Realm...'
    : 'Connecting to the Game Realm...';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0)_0%,_rgba(2,6,23,0.8)_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <img src="/game-logo.jpg" alt="Game logo" className="w-24 h-24 object-cover mix-blend-screen rounded-full drop-shadow-lg animate-pulse" />
        </div>
        <h1 className="font-serif text-xl font-bold tracking-tight text-slate-200">Tactical LitRPG</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw size={14} className="animate-spin text-crimson-500" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

interface AuthProps {
  onSignIn: () => void;
  onGuest?: () => void;
}

export function AuthOverlay({ onSignIn, onGuest }: AuthProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-sky-700/40 bg-slate-900 shadow-2xl shadow-sky-900/30">
        <img
          src="/backgrounds/bg-portrait.png"
          alt=""
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-slate-950/90" />

        <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 text-center">
          <div className="relative">
            <img src="/game-logo.jpg" alt="Game logo" className="w-20 h-20 object-cover mix-blend-screen rounded-full mx-auto mb-2" />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1.5">
              <Cloud size={18} className="text-sky-400" />
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl text-slate-100">Enter the Realm</h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with Google to play. Campaigns sync to your account so you never lose progress.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={onSignIn}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-100 backdrop-blur-sm hover:bg-slate-700 transition-colors"
            >
              <GoogleG size={18} />
              Sign in with Google
            </button>
            {onGuest && (
              <button
                onClick={onGuest}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-crimson-700/50 bg-crimson-950/30 px-4 py-3 text-sm font-medium text-crimson-200 hover:bg-crimson-900/40 transition-colors"
              >
                <UserRound size={16} />
                Play as Guest
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500">
            <span>Saves stay on your signed-in account</span>
          </div>

          <LegalLinks className="mt-1" />
        </div>
      </div>
    </div>
  );
}

function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
