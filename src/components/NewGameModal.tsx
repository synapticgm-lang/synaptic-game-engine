import { useState } from 'react';
import { X, Sparkles, Wand2, BookOpen, Palette, ChevronRight } from 'lucide-react';
import type { EngineMode, GmStrictness, ArtStylePreset } from '@/game/types';
import { ART_STYLE_PRESETS } from '@/game/types';
import { getArchetypeOptions, getDefaultArchetype, type CampaignArchetype } from '@/game/archetypes';

interface Props {
  onStart: (
    character: Record<string, any>,
    storyName?: string,
    engineMode?: EngineMode,
    gmStrictness?: GmStrictness,
    archetype?: CampaignArchetype,
    visualMode?: 'comic' | 'classic',
    artStylePreset?: ArtStylePreset
  ) => void;
  onClose: () => void;
}

type WizardStep = 'type_select' | 'premade_setup' | 'custom_setup';

export function NewGameModal({ onStart, onClose }: Props) {
  const [step, setStep] = useState<WizardStep>('type_select');

  // Shared / Pre-made state - Defaulting visualMode to 'classic' as requested
  const [storyName, setStoryName] = useState(`Campaign - ${Date.now().toString().slice(-6)}`);
  const [archetype, setArchetype] = useState<CampaignArchetype>('ai_random');
  const [visualMode, setVisualMode] = useState<'comic' | 'classic'>('classic');
  const [artStylePreset, setArtStylePreset] = useState<ArtStylePreset>('manga_black_white');

  // Custom setup state
  const [charName, setCharName] = useState('Survivor');
  const [className, setClassName] = useState('Wanderer');
  const [backstory, setBackstory] = useState('');
  const [appearance, setAppearance] = useState('');
  const [engineMode, setEngineMode] = useState<EngineMode>('litrpg');
  const [gmStrictness, setGmStrictness] = useState<GmStrictness>('standard');
  const [customArchetype, setCustomArchetype] = useState<CampaignArchetype>(getDefaultArchetype('litrpg'));

  const archetypeOptions = getArchetypeOptions(engineMode);

  const handleStartPremade = () => {
    onStart(
      { name: 'Adventurer', classTitle: 'Hero' },
      storyName.trim() || undefined,
      'litrpg',
      'standard',
      archetype,
      visualMode,
      artStylePreset
    );
  };

  const handleStartCustom = () => {
    onStart(
      { name: charName.trim() || 'Survivor', classTitle: className.trim() || 'Wanderer', bio: backstory, appearance },
      storyName.trim() || undefined,
      engineMode,
      gmStrictness,
      customArchetype,
      visualMode,
      artStylePreset
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-crimson-700/50 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-crimson-400" size={16} />
            <h2 className="font-serif text-sm text-slate-100">
              {step === 'type_select' && 'Begin New Journey'}
              {step === 'premade_setup' && 'Quick Start / Pre-Made Campaign'}
              {step === 'custom_setup' && 'Full Custom Setup'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {step === 'type_select' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">Choose how you want to launch your adventure:</p>

              <button
                type="button"
                onClick={() => setStep('premade_setup')}
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
                  <p className="mt-0.5 text-[11px] text-slate-400">Pick an archetype preset, choose your visual style, and jump in.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('custom_setup')}
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
                  <p className="mt-0.5 text-[11px] text-slate-400">Deep customization: backstories, system rules, strictness, and stats.</p>
                </div>
              </button>
            </div>
          )}

          {step === 'premade_setup' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-medium text-slate-300">Campaign Name</label>
                <input
                  type="text"
                  value={storyName}
                  onChange={(e) => setStoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">Story Archetype Preset</label>
                <select
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value as CampaignArchetype)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none truncate"
                >
                  <option value="ai_random">✨ AI Random Generator</option>
                  {getArchetypeOptions('litrpg').map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

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
                      <div className="text-[9px] text-slate-400 truncate">Narrative prose</div>
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
                      <div className="text-[9px] text-slate-400 truncate">Panels & bubbles</div>
                    </div>
                  </button>
                </div>
              </div>

              {visualMode === 'comic' && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400">Comic Art Style Sub-Preset</label>
                  <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                    {ART_STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setArtStylePreset(preset.value)}
                        className={`flex items-center justify-between rounded border px-2 py-1 text-left text-[11px] transition-colors ${
                          artStylePreset === preset.value
                            ? 'border-crimson-500 bg-crimson-900/20 text-crimson-200'
                            : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="font-medium truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'custom_setup' && (
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
                  rows={2}
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="Short backstory..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-medium text-slate-300">System Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEngineMode('litrpg'); setCustomArchetype(getDefaultArchetype('litrpg')); }}
                    className={`flex flex-col rounded-lg border p-2 text-left transition-all min-w-0 ${
                      engineMode === 'litrpg' ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">LitRPG / System</div>
                    <div className="text-[9px] text-slate-400 truncate">Narrative immersion</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setEngineMode('dnd'); setCustomArchetype(getDefaultArchetype('dnd')); }}
                    className={`flex flex-col rounded-lg border p-2 text-left transition-all min-w-0 ${
                      engineMode === 'dnd' ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">5e TTRPG</div>
                    <div className="text-[9px] text-slate-400 truncate">Dice, HP, and stats</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">Story Opening Archetype</label>
                <select
                  value={customArchetype}
                  onChange={(e) => setCustomArchetype(e.target.value as CampaignArchetype)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none truncate"
                >
                  {archetypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">GM Strictness</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['forgiving', 'standard', 'hardcore'] as GmStrictness[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGmStrictness(s)}
                      className={`rounded-lg border py-1.5 text-center text-xs capitalize transition-all ${
                        gmStrictness === s ? 'border-crimson-500 bg-crimson-950/30 text-crimson-200 font-semibold' : 'border-slate-700 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3">
          {step !== 'type_select' ? (
            <button
              type="button"
              onClick={() => setStep('type_select')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back
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
            {step === 'premade_setup' && (
              <button
                type="button"
                onClick={handleStartPremade}
                className="flex items-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-crimson-500 transition-colors shadow"
              >
                <Sparkles size={14} /> Begin Journey
              </button>
            )}
            {step === 'custom_setup' && (
              <button
                type="button"
                onClick={handleStartCustom}
                className="flex items-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-crimson-500 transition-colors shadow"
              >
                <Sparkles size={14} /> Begin Journey
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}