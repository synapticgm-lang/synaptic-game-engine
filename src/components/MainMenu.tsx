import { Play, Swords, Settings as SettingsIcon, Cloud, UserRound, BookOpen, Library } from 'lucide-react';
import type { SaveSlotInfo } from '@/game/types';

interface MainMenuProps {
  hasSave: boolean;
  localSlot: SaveSlotInfo | null;
  cloudSlot: SaveSlotInfo | null;
  googleSignedIn: boolean;
  googleEmail?: string;
  isGuest: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onSettings: () => void;
  onOpenLibrary?: () => void;
}

export function MainMenu({
  hasSave, localSlot, cloudSlot, googleSignedIn, googleEmail, isGuest,
  onContinue, onNewGame, onSettings, onOpenLibrary,
}: MainMenuProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <BackgroundFx />

      <button
        onClick={onSettings}
        className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 backdrop-blur-sm hover:bg-slate-800 transition-colors"
      >
        <SettingsIcon size={18} />
        Settings
      </button>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/assets/images/1785421156244~2 copy.png"
            alt="SYNAPTIC DUNGEON MASTER"
            className="w-full max-w-[260px] h-auto object-contain drop-shadow-[0_0_20px_rgba(220,38,38,0.35)] filter brightness-110"
          />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            SYNAPTIC DUNGEON MASTER
          </h1>
          <p className="text-sm text-slate-500">A dark fantasy world awaits your decisions.</p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <MenuButton
            icon={<Play size={18} />}
            label="Continue Journey"
            onClick={onContinue}
            disabled={!hasSave}
            sublabel={!hasSave ? 'No save found' : undefined}
            primary
          />
          <MenuButton
            icon={<Swords size={18} />}
            label="Start New Game"
            onClick={onNewGame}
          />
          {onOpenLibrary && (
            <MenuButton
              icon={<Library size={18} />}
              label="GM Library"
              onClick={onOpenLibrary}
            />
          )}
        </div>

        {hasSave && (localSlot || cloudSlot) && (
          <div className="w-full rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BookOpen size={12} />
              <span className="font-medium text-slate-400">Active Save:</span>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-600">
                {(cloudSlot?.lastUpdated ?? 0) > (localSlot?.lastUpdated ?? 0) ? 'cloud' : 'local'}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {((cloudSlot?.lastUpdated ?? 0) > (localSlot?.lastUpdated ?? 0) ? cloudSlot : localSlot)?.storyName
                ?? localSlot?.storyName
                ?? cloudSlot?.storyName
                ?? 'Unknown'}
            </div>
            <div className="text-xs text-slate-500">
              {((cloudSlot?.lastUpdated ?? 0) > (localSlot?.lastUpdated ?? 0) ? cloudSlot : localSlot)?.characterName
                ?? localSlot?.characterName
                ?? cloudSlot?.characterName}
              {' · Lv.'}
              {((cloudSlot?.lastUpdated ?? 0) > (localSlot?.lastUpdated ?? 0) ? cloudSlot : localSlot)?.level
                ?? localSlot?.level
                ?? cloudSlot?.level}
              {' · Turn '}
              {((cloudSlot?.lastUpdated ?? 0) > (localSlot?.lastUpdated ?? 0) ? cloudSlot : localSlot)?.turn
                ?? localSlot?.turn
                ?? cloudSlot?.turn}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-600">
          {isGuest ? (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-950/20 px-2.5 py-1 text-amber-400/90">
              <UserRound size={12} /> Guest Mode (Local Storage)
            </span>
          ) : googleSignedIn ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-2.5 py-1 text-emerald-400/90">
              <Cloud size={12} /> Cloud save (Supabase){googleEmail ? `: ${googleEmail}` : ''}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BackgroundFx() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <img
        src="/backgrounds/bg-landscape.png"
        alt=""
        className="h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0)_0%,_rgba(2,6,23,0.8)_70%)]" />
    </div>
  );
}

function MenuButton({
  icon, label, onClick, primary, disabled, sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  sublabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left transition-all duration-200 ${
        primary
          ? 'border-crimson-700/50 bg-crimson-950/40 text-slate-100 hover:border-crimson-500 hover:bg-crimson-900/40'
          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
      } ${disabled ? 'cursor-not-allowed opacity-40 hover:border-slate-800 hover:bg-slate-900/60' : ''}`}
    >
      <span className={primary ? 'text-crimson-400' : 'text-slate-500'}>{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {sublabel ? (
        <span className="text-xs text-slate-600">{sublabel}</span>
      ) : null}
    </button>
  );
}
