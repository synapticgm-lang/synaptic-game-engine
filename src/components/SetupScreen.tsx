import { useState } from 'react';
import { Baby, Shield, ChevronRight } from 'lucide-react';
import type { ContentMode, AiProvider } from '@/game/types';
import { isStoreDistribution } from '@/game/distributionChannel';
import { LegalLinks } from './LegalLinks';
import { TERMS_DOC, PRIVACY_DOC } from '@/legal/legalDocs';

interface Props {
  initialContentMode: ContentMode;
  /** Kept for call-site compatibility; keys are not collected here anymore. */
  initialApiKey?: string;
  onComplete: (contentMode: ContentMode, apiKey: string, provider: AiProvider, model: string, baseUrl: string) => void;
}

/**
 * First-run content profile only.
 * Player AI keys are Admin (BYOK) website tier only — never on store builds or Free/Mid/High.
 */
export function SetupScreen({ initialContentMode, onComplete }: Props) {
  const [contentMode, setContentMode] = useState<ContentMode>(initialContentMode);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const store = isStoreDistribution();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <BackgroundFx />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src="/game-logo.jpg" alt="Game logo" className="w-24 h-24 object-cover mix-blend-screen rounded-full drop-shadow-lg mb-4" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100">Prepare Your Adventure</h1>
          <p className="text-sm text-slate-500">
            {store
              ? 'Choose your content profile. AI is provided by SynapticGM — no API keys in the store app.'
              : 'Choose your content profile. Hosted AI is included; Admin (BYOK) keys are set later in Settings if you have that tier.'}
          </p>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Shield size={16} className="text-crimson-400" />
              Content Profile
            </label>
            <div className="grid grid-cols-1 gap-2">
              <ProfileCard
                icon={<Baby size={18} />}
                title="Kid / Safe Mode"
                description="Family-friendly. Meets store child-safety expectations — no swearing, gore, or mature themes. A parent must set a PIN in Settings to lock exits and purchases; keep that PIN private."
                selected={contentMode === 'kid'}
                onClick={() => setContentMode('kid')}
              />
              <ProfileCard
                icon={<Shield size={18} />}
                title="Standard / Adult Mode"
                description={
                  store
                    ? 'Mature fantasy OK. No pornography — intimacy fades to black (Google Play & App Store rules).'
                    : 'Mature themes enabled. Website NSFW/Admin options unlock later where allowed.'
                }
                selected={contentMode === 'adult'}
                onClick={() => setContentMode('adult')}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2.5 text-[11px] leading-snug text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
              className="mt-0.5 rounded border-slate-600"
            />
            <span>
              I agree to the{' '}
              <a href={TERMS_DOC.path} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href={PRIVACY_DOC.path} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            type="button"
            disabled={!acceptedLegal}
            onClick={() => onComplete(contentMode, '', 'openrouter', '', '')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-crimson-600 px-4 py-3 text-sm font-semibold text-white hover:bg-crimson-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight size={16} />
          </button>

          <LegalLinks />
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? 'border-crimson-500 bg-crimson-950/40'
          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
      }`}
    >
      <span className={selected ? 'text-crimson-400' : 'text-slate-500'}>{icon}</span>
      <span>
        <span className="block text-sm font-medium text-slate-100">{title}</span>
        <span className="mt-0.5 block text-[11px] text-slate-400">{description}</span>
      </span>
    </button>
  );
}

function BackgroundFx() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-crimson-900/20 blur-3xl" />
      <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-slate-700/20 blur-3xl" />
    </div>
  );
}
