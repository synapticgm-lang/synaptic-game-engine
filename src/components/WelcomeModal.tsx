import { useState } from 'react';
import { ShieldCheck, RefreshCw, Cloud } from 'lucide-react';

interface Props {
  onSignIn: () => void;
}

export function WelcomeModal({ onSignIn }: Props) {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = () => {
    setSigningIn(true);
    onSignIn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex flex-col items-center gap-5 px-6 py-10 text-center">
          <div className="relative">
            <img src="/game-logo.jpg" alt="Game logo" className="w-20 h-20 object-cover mix-blend-screen rounded-full mx-auto mb-2" />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1.5">
              <Cloud size={18} className="text-sky-400" />
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl text-slate-100">Welcome back, Adventurer!</h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with Google to sync your save files across devices and never lose your progress.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {signingIn ? <RefreshCw size={18} className="animate-spin" /> : <GoogleG size={18} />}
              {signingIn ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck size={12} />
            <span>Saves stored in your private app data folder on Drive</span>
          </div>
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
