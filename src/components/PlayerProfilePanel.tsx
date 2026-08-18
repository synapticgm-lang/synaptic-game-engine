import { useEffect, useMemo, useState } from 'react';
import { Trophy, UserRound } from 'lucide-react';
import {
  GENDER_PRESETS,
  PLAYER_PROFILE_EVENT,
  hasPersonaPrefs,
  loadPlayerProfile,
  savePlayerProfile,
  tallyPlateEvents,
  type PlayerProfile,
} from '@/game/playerProfile';

function formatWhen(ms: number): string {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function PlayerProfilePanel({ compact = false }: { compact?: boolean }) {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [name, setName] = useState(profile.preferredName);
  const [genderPreset, setGenderPreset] = useState(() => {
    if (!profile.preferredGender) return '';
    if (GENDER_PRESETS.some((g) => g.id && g.id === profile.preferredGender)) return profile.preferredGender;
    return 'custom';
  });
  const [genderCustom, setGenderCustom] = useState(() =>
    GENDER_PRESETS.some((g) => g.id && g.id === profile.preferredGender) ? '' : profile.preferredGender
  );
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const next = (event as CustomEvent<PlayerProfile>).detail;
      if (next) setProfile(next);
    };
    window.addEventListener(PLAYER_PROFILE_EVENT, onUpdate);
    return () => window.removeEventListener(PLAYER_PROFILE_EVENT, onUpdate);
  }, []);

  const tally = useMemo(() => tallyPlateEvents(profile.plateEvents), [profile.plateEvents]);
  const genderValue = genderPreset === 'custom' ? genderCustom.trim() : genderPreset;
  const dirty =
    name.trim() !== profile.preferredName || genderValue !== profile.preferredGender;

  const save = () => {
    const next = savePlayerProfile({
      preferredName: name,
      preferredGender: genderValue,
    });
    setProfile(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div className={compact ? 'space-y-3' : 'flex w-full max-w-md flex-col gap-4'}>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <UserRound size={16} className="text-crimson-400" />
          <h3 className="text-sm font-medium">Usual self</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Used across every New Game if you pick “use my usual self.” The story will skip asking your name
          {hasPersonaPrefs(profile) && profile.preferredGender ? ' and gender' : ''} when those are set.
        </p>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">My player name will always be</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave blank to be asked each story"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">My gender is</label>
          <div className="grid grid-cols-2 gap-1.5">
            {GENDER_PRESETS.map((opt) => (
              <button
                key={opt.id || 'ask'}
                type="button"
                onClick={() => setGenderPreset(opt.id)}
                className={`rounded-lg border px-2 py-1.5 text-[11px] transition ${
                  genderPreset === opt.id
                    ? 'border-crimson-500 bg-crimson-950/40 text-crimson-100'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {genderPreset === 'custom' && (
            <input
              type="text"
              value={genderCustom}
              onChange={(e) => setGenderCustom(e.target.value)}
              placeholder="e.g. agender, she/they…"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          {savedFlash && <span className="text-[11px] text-emerald-400">Saved</span>}
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="rounded-lg bg-crimson-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-crimson-500 disabled:opacity-40"
          >
            Save preferences
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <Trophy size={16} className="text-amber-400" />
          <h3 className="text-sm font-medium">Lifetime achievements</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Counts every memorable plate across all stories. This-campaign Titles stay on the character sheet.
        </p>
        <p className="text-[11px] text-slate-400">
          {profile.storiesStarted} {profile.storiesStarted === 1 ? 'story' : 'stories'} started
          {tally.length ? ` · ${profile.plateEvents.length} plates` : ''}
        </p>
        {tally.length === 0 ? (
          <p className="text-xs italic text-slate-600">No plates yet. Memorable pictures in a story add to this tally.</p>
        ) : (
          <ul className="space-y-1.5">
            {tally.map((row) => (
              <li
                key={row.beat}
                className="flex items-center justify-between rounded-lg border border-amber-900/30 bg-slate-950/50 px-3 py-1.5"
              >
                <span className="text-xs text-amber-100">{row.title}</span>
                <span className="font-mono text-[11px] text-amber-400">×{row.count}</span>
              </li>
            ))}
          </ul>
        )}
        {profile.metaBadges.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Account badges</p>
            {profile.metaBadges.map((badge) => (
              <div key={badge.id} className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5">
                <p className="text-xs font-medium text-slate-200">{badge.title}</p>
                <p className="text-[11px] text-slate-500">
                  {badge.blurb}
                  {badge.unlockedAt ? ` · ${formatWhen(badge.unlockedAt)}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
