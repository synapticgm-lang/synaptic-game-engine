import { useEffect, useState } from 'react';
import { RefreshCw, Settings as SettingsIcon, AlertTriangle, WifiOff, Clock, X, Download } from 'lucide-react';
import type { ErrorKind, TurnFrameTheme } from '@/game/types';
import { DEFAULT_TURN_FRAME } from '@/game/types';
import { logger } from '@/game/logger';

const ACCENT_RGB: Record<string, string> = {
  'cyan-400': '34,211,238',
  'cyan-500': '6,182,212',
  'red-600': '220,38,38',
  'crimson-600': '220,38,38',
  'crimson-500': '244,63,94',
  'emerald-500': '16,185,129',
  'amber-500': '245,158,11',
  'amber-400': '251,191,36',
  'purple-500': '168,85,247',
  'sky-400': '56,189,248',
  'rose-500': '244,63,94',
  'blue-500': '59,130,246',
};

function accentRgb(color: string): string {
  return ACCENT_RGB[color] ?? '120,200,255';
}

const GENRE_LOADING_PRESETS: Record<string, { short: string; long: string; sub: string }> = {
  'neon-glitch': { short: 'Processing sensor data...', long: 'Synthesizing next event...', sub: 'Compiling neural pathways...' },
  'steel-chassis': { short: 'Processing sensor data...', long: 'Synthesizing next event...', sub: 'Calculating trajectory...' },
  'dark-runic': { short: 'The Storyteller contemplates your fate...', long: 'Weaving narrative threads...', sub: 'The runes hum with ancient power...' },
  'minimal-holo': { short: 'The Engine is computing reality...', long: 'Synthesizing next event...', sub: 'Weaving narrative threads...' },
  'blood-ritual': { short: 'The Storyteller contemplates your fate...', long: 'Weaving narrative threads...', sub: 'The shadows stir restlessly...' },
  'wasteland-rust': { short: 'The Engine is computing reality...', long: 'Synthesizing next event...', sub: 'Dust settles on forgotten paths...' },
  'noir-shadow': { short: 'The Engine is computing reality...', long: 'Weaving narrative threads...', sub: 'The city holds its breath...' },
};

interface LoadingOverlayProps {
  visible: boolean;
  elapsed: number;
  theme?: TurnFrameTheme | null;
  retryStatus?: string | null;
  onCancel?: () => void;
}

export function LoadingOverlay({ visible, elapsed, theme, retryStatus, onCancel }: LoadingOverlayProps) {
  if (!visible) return null;

  const activeTheme = theme ?? DEFAULT_TURN_FRAME;
  const preset = GENRE_LOADING_PRESETS[activeTheme.frameStyle] ?? GENRE_LOADING_PRESETS['minimal-holo'];

  const message = elapsed > 15000
    ? 'The GM is still thinking…'
    : elapsed > 10000
      ? preset.long
      : elapsed > 3500
        ? preset.short
        : null;

  if (!message) return null;

  const rgb = accentRgb(activeTheme.accentColor);
  const glow = `shadow-[0_0_40px_rgba(${rgb},0.18)]`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
      <div className={`relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 ${glow}`}>
        <div className="relative">
          <div className="absolute -inset-3 animate-pulse rounded-full opacity-30" style={{ background: `radial-gradient(circle, rgba(${rgb},0.4) 0%, transparent 70%)` }} />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 bg-slate-800/80" style={{ borderColor: `rgba(${rgb},0.5)` }}>
            <RefreshCw size={28} className="animate-spin" style={{ animationDuration: '1.2s', color: `rgb(${rgb})` }} />
          </div>
        </div>
        <div className="text-center">
          <p className="font-serif text-lg text-slate-100">{message}</p>
          <p className="mt-1 text-xs text-slate-500">{preset.sub}</p>
        </div>
        {retryStatus && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-700/40 bg-amber-950/20 px-4 py-2.5">
            <Clock size={14} className="animate-pulse text-amber-400" />
            <span className="text-xs text-amber-200/90">{retryStatus}</span>
          </div>
        )}
        {elapsed > 15000 && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Cancel and keep last scene
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorModalProps {
  visible: boolean;
  errorKind: ErrorKind | null;
  errorMessage: string;
  onRetry: () => void;
  onOpenApiSettings: () => void;
  onDismiss: () => void;
  theme?: TurnFrameTheme | null;
}

const GENRE_ERROR_PRESETS: Record<string, { rateLimit: string; rateLimitBody: string; network: string }> = {
  'neon-glitch': { rateLimit: 'System Overload', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
  'steel-chassis': { rateLimit: 'System Overload', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
  'dark-runic': { rateLimit: 'Mana Drained!', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
  'minimal-holo': { rateLimit: 'Engine Cooldown', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
  'blood-ritual': { rateLimit: 'Mana Drained!', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
  'wasteland-rust': { rateLimit: 'Engine Cooldown', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
  'noir-shadow': { rateLimit: 'Engine Cooldown', rateLimitBody: 'The narrative engine needs a moment to recharge. Please wait before taking your next turn.', network: 'Connection Disrupted' },
};

export function ErrorModal({ visible, errorKind, errorMessage, onRetry, onOpenApiSettings, onDismiss, theme }: ErrorModalProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!visible || errorKind !== 'rate-limit') return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, errorKind]);

  if (!visible || !errorKind) return null;

  const activeTheme = theme ?? DEFAULT_TURN_FRAME;
  const preset = GENRE_ERROR_PRESETS[activeTheme.frameStyle] ?? GENRE_ERROR_PRESETS['minimal-holo'];
  const rgb = accentRgb(activeTheme.accentColor);

  const isRateLimit = errorKind === 'rate-limit';
  const isNetwork = errorKind === 'network';

  const title = isRateLimit
    ? preset.rateLimit
    : isNetwork
      ? preset.network
      : 'Engine Error';

  const body = isRateLimit
    ? preset.rateLimitBody
    : isNetwork
      ? 'Unable to reach the narrative engine. Check your network connection or verify your API configuration.'
      : errorMessage || 'An unexpected error occurred.';

  const Icon = isRateLimit ? Clock : isNetwork ? WifiOff : AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-slate-900/90 shadow-2xl" style={{ borderColor: `rgba(${rgb},0.4)`, boxShadow: `0 0 40px rgba(${rgb},0.15)` }}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-slate-950/90" />

        <div className="relative z-10 flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h2 className="flex items-center gap-2 font-serif text-lg text-slate-100">
            <Icon size={20} style={{ color: `rgb(${rgb})` }} />
            {title}
          </h2>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative z-10 space-y-4 p-5">
          <p className="text-sm text-slate-300">{body}</p>

          {isRateLimit && countdown > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-700/40 bg-amber-950/20 px-4 py-3">
              <Clock size={18} className="text-amber-400" />
              <span className="text-sm text-amber-200/90">
                Retry available in <span className="font-bold text-amber-100">{countdown}s</span>
              </span>
            </div>
          )}

          {errorMessage && !isRateLimit && !isNetwork && (
            <div className="rounded-lg border border-rose-800/40 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onRetry}
              disabled={isRateLimit && countdown > 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              style={{ backgroundColor: `rgb(${rgb})` }}
            >
              <RefreshCw size={16} />
              Retry Action
            </button>
            <button
              onClick={onOpenApiSettings}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <SettingsIcon size={16} />
              API Settings
            </button>
          </div>

          <button
            onClick={() => logger.downloadLog()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/50 transition-colors"
          >
            <Download size={14} />
            Download Error Log
          </button>
        </div>
      </div>
    </div>
  );
}
