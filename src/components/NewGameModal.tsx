import { useMemo, useState } from 'react';
import { X, Sparkles, Wand2, BookOpen, Palette, ChevronRight, ChevronLeft, Dices, ScrollText, Cpu, GitFork } from 'lucide-react';
import type { ContentMode, EngineMode, GmStrictness, ArtStylePreset, ComicLayoutMode, ComicReadingDirection } from '@/game/types';
import { ART_STYLE_PRESETS } from '@/game/types';
import { getArchetypeOptions, getDefaultArchetype, type CampaignArchetype } from '@/game/archetypes';
import {
  formatCampaignStoryName,
  getCampaignBiblesByEngineMode,
  getCampaignBlurb,
  type CampaignBible,
} from '@/data/campaigns';

interface Props {
  contentMode?: ContentMode;
  onStart: (
    character: Record<string, any>,
    storyName?: string,
    engineMode?: EngineMode,
    gmStrictness?: GmStrictness,
    archetype?: CampaignArchetype,
    visualMode?: 'comic' | 'classic',
    artStylePreset?: ArtStylePreset,
    classicMemorableImages?: boolean,
    comicLayout?: ComicLayoutMode,
    comicReadingDirection?: ComicReadingDirection,
    bibleId?: string,
  ) => void;
  onClose: () => void;
}

type PathKind = 'premade' | 'custom';
type WizardStep = 'path' | 'system' | 'presentation' | 'character';

const ENGINE_MODE_CARDS: Array<{
  value: EngineMode;
  label: string;
  description: string;
  icon: typeof Cpu;
}> = [
  {
    value: 'litrpg',
    label: 'LitRPG',
    description: 'System notifications, attribute growth, and progression gates with hidden check math.',
    icon: Cpu,
  },
  {
    value: 'dnd',
    label: 'Tabletop Fantasy',
    description: 'Classic d20 fantasy with transparent checks and combat. Original SynapticGM rules — dice, armor class, spell slots.',
    icon: Dices,
  },
  {
    value: 'rpg',
    label: 'Story RPG',
    description: 'Fiction-first narrative — relationships, mysteries, heists. No LitRPG HUDs, no tabletop dice math.',
    icon: ScrollText,
  },
  {
    value: 'pyoa',
    label: 'Pick Your Own Adventure',
    description: 'A main story with forks: ally or betray, party or solo, inner comments, several endings.',
    icon: GitFork,
  },
];

const STEP_LABELS: Record<WizardStep, string> = {
  path: 'Begin New Journey',
  system: '1 · Game System',
  presentation: '2 · Presentation',
  character: '3 · Character',
};

export function NewGameModal({ contentMode, onStart, onClose }: Props) {
  const [path, setPath] = useState<PathKind | null>(null);
  const [step, setStep] = useState<WizardStep>('path');

  const [storyName, setStoryName] = useState(formatCampaignStoryName('New Campaign'));
  const [archetype, setArchetype] = useState<CampaignArchetype>('ai_random');
  const [bibleId, setBibleId] = useState<string | undefined>(undefined);
  const [visualMode, setVisualMode] = useState<'comic' | 'classic'>('classic');
  const [artStylePreset, setArtStylePreset] = useState<ArtStylePreset>('manga-screentone');
  const [classicMemorableImages, setClassicMemorableImages] = useState(false);
  const [comicLayout, setComicLayout] = useState<ComicLayoutMode>('paged');
  const [comicReadingDirection, setComicReadingDirection] = useState<ComicReadingDirection>('ltr');

  const [charName, setCharName] = useState('Survivor');
  const [className, setClassName] = useState('Wanderer');
  const [backstory, setBackstory] = useState('');
  const [appearance, setAppearance] = useState('');
  const [engineMode, setEngineMode] = useState<EngineMode>('litrpg');
  const [gmStrictness, setGmStrictness] = useState<GmStrictness>('standard');
  const [customArchetype, setCustomArchetype] = useState<CampaignArchetype>(getDefaultArchetype('litrpg'));

  const archetypeOptions = getArchetypeOptions(engineMode);
  const selectedArchetype = archetypeOptions.find((o) =>
    o.value === (path === 'custom' ? customArchetype : archetype),
  );
  const premadeBibles = useMemo(
    () => getCampaignBiblesByEngineMode(engineMode, contentMode),
    [engineMode, contentMode],
  );

  const selectPremade = (bible: CampaignBible) => {
    setBibleId(bible.id);
    setArchetype(bible.archetype);
    setStoryName(formatCampaignStoryName(bible.title));
  };

  const selectEngineMode = (mode: EngineMode) => {
    setEngineMode(mode);
    const next = getDefaultArchetype(mode);
    setCustomArchetype(next);
    setArchetype(next);
    setBibleId(undefined);
    const first = getCampaignBiblesByEngineMode(mode, contentMode)[0];
    if (path === 'premade' && first) {
      selectPremade(first);
    } else {
      setStoryName(formatCampaignStoryName('New Campaign'));
    }
  };

  const choosePath = (kind: PathKind) => {
    setPath(kind);
    setStep('system');
    if (kind === 'premade') {
      const first = getCampaignBiblesByEngineMode(engineMode, contentMode)[0];
      if (first) selectPremade(first);
    } else {
      setBibleId(undefined);
      setStoryName(formatCampaignStoryName('Custom Campaign'));
    }
  };

  const goBack = () => {
    if (step === 'system') {
      setStep('path');
      setPath(null);
    } else if (step === 'presentation') {
      setStep('system');
    } else if (step === 'character') {
      setStep('presentation');
    }
  };

  const goNext = () => {
    if (step === 'system') setStep('presentation');
    else if (step === 'presentation') {
      if (path === 'custom') setStep('character');
      else beginPremade();
    } else if (step === 'character') {
      beginCustom();
    }
  };

  const beginPremade = () => {
    onStart(
      { name: 'Adventurer', classTitle: 'Hero' },
      storyName.trim() || undefined,
      engineMode,
      'standard',
      archetype,
      visualMode,
      artStylePreset,
      classicMemorableImages,
      comicLayout,
      comicReadingDirection,
      bibleId,
    );
  };

  const beginCustom = () => {
    onStart(
      { name: charName.trim() || 'Survivor', classTitle: className.trim() || 'Wanderer', bio: backstory, appearance },
      storyName.trim() || undefined,
      engineMode,
      gmStrictness,
      customArchetype,
      visualMode,
      artStylePreset,
      classicMemorableImages,
      comicLayout,
      comicReadingDirection,
      undefined,
    );
  };

  const nextLabel =
    step === 'presentation' && path === 'premade'
      ? 'Begin Journey'
      : step === 'character'
        ? 'Begin Journey'
        : 'Continue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-crimson-700/50 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-crimson-400" size={16} />
            <h2 className="font-serif text-sm text-slate-100">{STEP_LABELS[step]}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {step !== 'path' && (
          <div className="flex shrink-0 gap-1 border-b border-slate-800/80 bg-slate-950/80 px-4 py-2">
            {(['system', 'presentation', ...(path === 'custom' ? (['character'] as const) : [])] as WizardStep[]).map((s, i) => {
              const order: WizardStep[] = path === 'custom'
                ? ['system', 'presentation', 'character']
                : ['system', 'presentation'];
              const activeIdx = order.indexOf(step);
              const done = i < activeIdx;
              const current = s === step;
              return (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${current ? 'bg-crimson-500' : done ? 'bg-crimson-800' : 'bg-slate-800'}`}
                />
              );
            })}
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {step === 'path' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                Presentation and system are locked for the whole session after you begin — choose carefully.
              </p>

              <button
                type="button"
                onClick={() => choosePath('premade')}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-left transition-all hover:border-crimson-500 hover:bg-slate-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-crimson-500/30 bg-crimson-950/40 text-crimson-400">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-100 group-hover:text-crimson-300">Quick Start / Pre-Made</h3>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-crimson-400" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    System → Presentation, then jump in with a preset archetype.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => choosePath('custom')}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-left transition-all hover:border-sky-500 hover:bg-slate-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-950/40 text-sky-400">
                  <Wand2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-100 group-hover:text-sky-300">Full Custom Setup</h3>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-sky-400" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    System → Presentation → Character, with bio and GM strictness.
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === 'system' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-medium text-slate-300">Campaign Name</label>
                <input
                  type="text"
                  value={storyName}
                  onChange={(e) => setStoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-medium text-slate-300">Game Mode</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ENGINE_MODE_CARDS.map((card) => {
                    const Icon = card.icon;
                    const selected = engineMode === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => selectEngineMode(card.value)}
                        className={`flex flex-col rounded-lg border p-2.5 text-left transition-all ${
                          selected ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <Icon size={14} className={selected ? 'text-crimson-400' : 'text-slate-500'} />
                          <span className="font-semibold text-slate-200">{card.label}</span>
                        </div>
                        <p className="text-[10px] leading-snug text-slate-400">{card.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {path === 'premade' ? (
                <div>
                  <label className="mb-1.5 block font-medium text-slate-300">Premade Story</label>
                  <p className="mb-2 text-[10px] leading-snug text-slate-500">
                    Pick a world — campaign name updates to the title plus today’s date.
                  </p>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
                    {premadeBibles.map((bible) => {
                      const selected = bibleId === bible.id;
                      return (
                        <button
                          key={bible.id}
                          type="button"
                          onClick={() => selectPremade(bible)}
                          className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                            selected
                              ? 'border-crimson-500 bg-crimson-950/35'
                              : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap items-center gap-1">
                                {bible.nsfw ? (
                                  <span className="inline-block rounded-full border border-rose-500/80 bg-rose-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                                    NSFW
                                  </span>
                                ) : null}
                                {bible.genreTag ? (
                                  <span className="inline-block rounded-full border border-crimson-700/70 bg-crimson-950/55 px-2 py-0.5 text-[10px] font-medium text-crimson-200">
                                    {bible.genreTag}
                                  </span>
                                ) : null}
                              </div>
                              <span className="block font-semibold text-slate-100">{bible.title}</span>
                            </div>
                            <span className="shrink-0 rounded-full border border-slate-600 px-1.5 py-0.5 text-[9px] uppercase text-slate-400">
                              {bible.difficulty}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs italic text-slate-300">{bible.tagline}</p>
                          <p className="mt-1 text-[11px] leading-snug text-slate-400">
                            {getCampaignBlurb(bible)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block font-medium text-slate-300">Story Opening Archetype</label>
                  <select
                    value={customArchetype}
                    onChange={(e) => {
                      setCustomArchetype(e.target.value as CampaignArchetype);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none truncate"
                  >
                    {archetypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
                    {selectedArchetype?.description ?? 'Choose an opening seed that matches your preferred tone.'}
                  </p>
                </div>
              )}

              {path === 'custom' && (
                <div>
                  <label className="mb-1 block font-medium text-slate-300">GM Strictness</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { value: 'forgiving' as const, tip: 'Rule of cool; soft failure' },
                      { value: 'standard' as const, tip: 'Balanced consequences' },
                      { value: 'hardcore' as const, tip: 'High lethality & scarcity' },
                    ]).map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setGmStrictness(s.value)}
                        className={`rounded-lg border px-1 py-1.5 text-center transition-all ${
                          gmStrictness === s.value
                            ? 'border-crimson-500 bg-crimson-950/30 text-crimson-200 font-semibold'
                            : 'border-slate-700 bg-slate-800/40 text-slate-400'
                        }`}
                      >
                        <div className="text-xs capitalize">{s.value}</div>
                        <div className="text-[9px] font-normal text-slate-500 leading-tight">{s.tip}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'presentation' && (
            <div className="space-y-3">
              <p className="text-[11px] text-amber-400/90">
                Visual mode and art style lock for this campaign after you begin.
              </p>

              <div>
                <label className="mb-1.5 block font-medium text-slate-300">Story Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisualMode('classic')}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                      visualMode === 'classic' ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen size={16} className={visualMode === 'classic' ? 'text-crimson-400' : 'text-slate-500'} />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200">Classic Text</div>
                      <div className="text-[9px] text-slate-400">Prose-first log; type freely each turn</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualMode('comic')}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                      visualMode === 'comic' ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                    }`}
                  >
                    <Palette size={16} className={visualMode === 'comic' ? 'text-crimson-400' : 'text-slate-500'} />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200">Comic Book</div>
                      <div className="text-[9px] text-slate-400">Panels, bubbles, and page layouts</div>
                    </div>
                  </button>
                </div>
              </div>

              {visualMode === 'classic' && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={classicMemorableImages}
                    onChange={(e) => setClassicMemorableImages(e.target.checked)}
                    className="mt-0.5 accent-crimson-500"
                  />
                  <span>
                    <span className="block font-medium text-slate-200">Memorable moment images</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                      Optional. Opening, death, and the first dungeon’s final boss auto-illustrate; later dungeon bosses and other book-worthy beats are a tap-yes on the fast model. Off until you check this.
                    </span>
                  </span>
                </label>
              )}

              {visualMode === 'comic' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-400">Layout</label>
                      <div className="grid grid-cols-1 gap-1">
                        {([
                          { value: 'paged' as const, label: 'Paged', tip: 'Multi-panel pages' },
                          { value: 'webtoon' as const, label: 'Webtoon', tip: 'Vertical scroll' },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setComicLayout(opt.value)}
                            className={`rounded border px-2 py-1.5 text-left text-[11px] ${
                              comicLayout === opt.value
                                ? 'border-crimson-500 bg-crimson-900/20 text-crimson-200'
                                : 'border-slate-800 bg-slate-800/30 text-slate-400'
                            }`}
                          >
                            <span className="font-medium">{opt.label}</span>
                            <span className="mt-0.5 block text-[9px] text-slate-500">{opt.tip}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-400">Reading direction</label>
                      <div className="grid grid-cols-1 gap-1">
                        {([
                          { value: 'ltr' as const, label: 'LTR', tip: 'Left → right' },
                          { value: 'rtl' as const, label: 'RTL', tip: 'Right → left (manga)' },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setComicReadingDirection(opt.value)}
                            className={`rounded border px-2 py-1.5 text-left text-[11px] ${
                              comicReadingDirection === opt.value
                                ? 'border-crimson-500 bg-crimson-900/20 text-crimson-200'
                                : 'border-slate-800 bg-slate-800/30 text-slate-400'
                            }`}
                          >
                            <span className="font-medium">{opt.label}</span>
                            <span className="mt-0.5 block text-[9px] text-slate-500">{opt.tip}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-400">Comic Art Style Sub-Preset</label>
                    <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                      {ART_STYLE_PRESETS.filter((p) => p.value !== 'classic-book').map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setArtStylePreset(preset.value)}
                          className={`flex flex-col rounded border px-2 py-1.5 text-left text-[11px] transition-colors ${
                            artStylePreset === preset.value
                              ? 'border-crimson-500 bg-crimson-900/20 text-crimson-200'
                              : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="font-medium truncate">{preset.label}</span>
                          <span className="text-[9px] text-slate-500">{preset.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'character' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-medium text-slate-300">Character Name</label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-300">Class / Archetype</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">Appearance</label>
                <input
                  type="text"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  placeholder="Character look..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">Background / Backstory</label>
                <textarea
                  rows={3}
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="Short backstory..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3">
          {step !== 'path' ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            {step !== 'path' && (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-crimson-500 transition-colors shadow"
              >
                {(step === 'presentation' && path === 'premade') || step === 'character' ? (
                  <Sparkles size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
