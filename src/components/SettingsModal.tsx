import { useState, useRef, useEffect } from 'react';
import { X, Save, BookText, Volume2, Mic, Dice5, Shield, Lock, Baby, Gauge, Download, Upload, KeyRound, Eye, EyeOff, RefreshCw, Check, Loader2, ChevronDown, Image as ImageIcon, Trash2, ZoomIn, Scale, Home, Zap, CircleSlash, Sparkles, Grid3x3, MessageSquareMore, Palette, Layers, Dot, MessageCircle, Map, Eye as EyeIcon, BarChart3, Clock, ScrollText, BookOpen, Swords } from 'lucide-react';
import type { Settings, DiceAnimationMode, ContentMode, GmStrictness, AiProvider, KeyStatus, PostLoginBehavior, BgMode, ColorVariant, PanelFrequency, PanelBorderIntensity, MapTriggerMode, FogRevealThreshold, StatVerbosity, StatFrequency, GameState, NarrativePerspective, ViolenceLevel, CursingLevel, ComicLayoutMode, ComicReadingDirection } from '@/game/types';
import { ART_STYLE_PRESETS } from '@/game/types';
import { validateApiKey, fetchModelsForProvider, getDefaultModels } from '@/game/apiValidation';
import { CampaignSettings } from './CampaignSettings';
import { bgList, bgDelete, type BgEntry } from '@/game/bgCache';
import { SETTINGS_EVENT_NAME } from '@/game/useGame';
import { exportSessionToPdf, downloadPdf } from '@/services/pdfExportService';
import { exportSessionToCbz, downloadCbz } from '@/services/cbzExportService';

interface Props {
  settings: Settings;
  storyName: string;
  engineMode: 'litrpg' | 'dnd' | 'rpg';
  gameState?: GameState | null; // Added to check if story has started
  onSave: (s: Settings) => void;
  onStoryNameChange: (name: string) => void;
  onSetContentMode: (mode: ContentMode, pin?: string) => void;
  onVerifyPin: (pin: string) => boolean;
  onExport?: () => void;
  onImport?: (file: File) => void;
  onClose: () => void;
  currentBgUrl?: string | null;
}

type SettingsTab = 'general' | 'narrative' | 'mechanics' | 'visuals';

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General / Core' },
  { id: 'narrative', label: 'Narrative & Tone' },
  { id: 'mechanics', label: 'Mechanics & Stats' },
  { id: 'visuals', label: 'Visuals' },
];

export function SettingsModal({ settings, storyName, engineMode, gameState, onSave, onStoryNameChange, onSetContentMode, onVerifyPin, onExport, onImport, onClose, currentBgUrl }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [storyNameDraft, setStoryNameDraft] = useState(storyName);
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('untested');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>(getDefaultModels(settings.aiProvider ?? 'gemini'));
  const [selectedModel, setSelectedModel] = useState(settings.customModelId ?? getDefaultModels(settings.aiProvider ?? 'gemini')[0] ?? '');
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [cbzExporting, setCbzExporting] = useState(false);
  const [cbzError, setCbzError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDnd = engineMode === 'dnd';
  const isKidMode = draft.contentMode === 'kid';
  const canToggleKidMode = !draft.kidModeLocked;

  // Check if a story/campaign is actively underway (turns > 0 or log exists)
  const isStoryActive = !!gameState && (gameState.turn > 0 || (gameState.log && gameState.log.length > 1));

  // Filter out 'classic-book' from style presets when Comic Mode is active
  const availableArtPresets = draft.visualMode === 'comic'
    ? ART_STYLE_PRESETS.filter(p => p.value !== 'classic-book')
    : ART_STYLE_PRESETS;

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [pinUnlock, setPinUnlock] = useState('');
  const [pinError, setPinError] = useState('');

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const runValidation = async (key: string) => {
    if (!key || key.trim().length < 5) { setKeyStatus('untested'); setValidationError(null); return; }
    setKeyStatus('validating');
    const result = await validateApiKey(draft.aiProvider, key.trim(), draft.baseUrl.trim() || undefined);
    if (result.ok) { setKeyStatus('valid'); setValidationError(null); }
    else { setKeyStatus('invalid'); setValidationError(result.error ?? 'Unknown error'); }
  };

  const handleFetchModels = async () => {
    if (!draft.geminiApiKey || draft.geminiApiKey.trim().length < 5) return;
    setFetchingModels(true);
    try {
      const models = await fetchModelsForProvider(draft.aiProvider, draft.geminiApiKey.trim(), draft.baseUrl.trim() || undefined);
      setFetchedModels(models);
      if (models.length > 0 && !draft.customModelId) setSelectedModel(models[0]);
    } catch {
      setFetchedModels(getDefaultModels(draft.aiProvider));
    } finally {
      setFetchingModels(false);
    }
  };

  const handleToggleKidMode = () => {
    if (draft.kidModeLocked) return;
    if (draft.contentMode === 'adult') {
      setShowPinSetup(true);
    } else {
      if (settings.contentPin) { setShowPinUnlock(true); }
      else { update('contentMode', 'adult'); onSetContentMode('adult'); }
    }
  };

  const handlePinSetupConfirm = () => {
    if (pinDraft.length < 4) { setPinError('PIN must be at least 4 digits.'); return; }
    update('contentMode', 'kid');
    onSetContentMode('kid', pinDraft);
    setShowPinSetup(false); setPinDraft(''); setPinError('');
  };

  const handlePinUnlockConfirm = () => {
    if (onVerifyPin(pinUnlock)) {
      update('contentMode', 'adult');
      onSetContentMode('adult');
      setShowPinUnlock(false); setPinUnlock(''); setPinError('');
    } else { setPinError('Incorrect PIN.'); }
  };

  const handleSave = () => {
    if (storyNameDraft.trim() && storyNameDraft.trim() !== storyName) onStoryNameChange(storyNameDraft.trim());
    onSave(draft);
    window.dispatchEvent(
      new CustomEvent(SETTINGS_EVENT_NAME, { detail: draft })
    );
    onClose();
  };

  // Phase 3 — PDF Exporter Engine wiring. Reads the live `gameState`/`settings` already
  // available to this modal — no new plumbing needed through App.tsx/useGame.ts.
  const handleExportPdf = async () => {
    if (!gameState || pdfExporting) return;
    setPdfExporting(true);
    setPdfError(null);
    try {
      const blob = await exportSessionToPdf(gameState, {
        format: 'us_trade',
        title: storyName || gameState.character.name || 'My Adventure',
        author: gameState.character.name || 'Anonymous Hero',
        artStylePreset: settings.artStylePreset,
        // Section 8 — bake speech/caption overlays into high-res canvas snapshots (Editor Mode placements included).
        bakeOverlays: true,
      });
      const safeName = (storyName || gameState.character.name || 'graphic-novel')
        .replace(/[^a-z0-9-_]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'graphic-novel';
      downloadPdf(blob, `${safeName}.pdf`);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Failed to generate PDF.');
    } finally {
      setPdfExporting(false);
    }
  };

  const handleExportCbz = async () => {
    if (!gameState || cbzExporting) return;
    setCbzExporting(true);
    setCbzError(null);
    try {
      const blob = await exportSessionToCbz(gameState);
      const safeName = (storyName || gameState.character.name || 'comic')
        .replace(/[^a-z0-9-_]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'comic';
      downloadCbz(blob, `${safeName}.cbz`);
    } catch (err) {
      setCbzError(err instanceof Error ? err.message : 'Failed to generate CBZ.');
    } finally {
      setCbzExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-crimson-700/50 bg-slate-900 shadow-2xl shadow-crimson-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-5 py-4">
          <h2 className="font-serif text-lg text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav
          aria-label="Settings categories"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-700 bg-slate-950/60 px-3 py-2"
          role="tablist"
        >
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-crimson-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* General: Post-Login Destination */}
          <Section icon={<Home size={16} />} title="General" visible={activeTab === 'general'}>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Post-Login Destination</label>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  icon={<Home size={15} />}
                  label="Title Menu"
                  selected={draft.postLoginBehavior === 'MAIN_MENU'}
                  onClick={() => update('postLoginBehavior', 'MAIN_MENU' as PostLoginBehavior)}
                />
                <ChoiceCard
                  icon={<Zap size={15} />}
                  label="Auto-Resume Game"
                  selected={draft.postLoginBehavior === 'AUTO_RESUME'}
                  onClick={() => update('postLoginBehavior', 'AUTO_RESUME' as PostLoginBehavior)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <BookText size={16} className="text-crimson-400" />
                Story / Save Name
              </label>
              <input
                value={storyNameDraft}
                onChange={(e) => setStoryNameDraft(e.target.value)}
                placeholder="Campaign name..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
              />
            </div>
          </Section>

          <Section icon={<BookText size={16} />} title="Narrative Perspective" visible={activeTab === 'narrative'}>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard
                label="First Person"
                sublabel="I / me / my"
                selected={draft.perspective === 'first-person'}
                onClick={() => update('perspective', 'first-person' as NarrativePerspective)}
              />
              <ChoiceCard
                label="Third Person"
                sublabel="Name / they"
                selected={draft.perspective === 'third-person'}
                onClick={() => update('perspective', 'third-person' as NarrativePerspective)}
              />
            </div>
          </Section>

          <Section icon={<Shield size={16} />} title="Language & Violence" visible={activeTab === 'narrative'}>
            {isKidMode && (
              <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-2 text-[11px] text-amber-300">
                Kid Mode overrides these controls with non-violent, profanity-free output.
              </p>
            )}
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Violence Detail</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['none', 'None', 'Non-violent'],
                  ['mild', 'Mild', 'Non-graphic'],
                  ['graphic', 'Graphic', 'Visceral'],
                ] as const).map(([value, label, sublabel]) => (
                  <ChoiceCard
                    key={value}
                    label={label}
                    sublabel={sublabel}
                    selected={draft.violenceLevel === value}
                    onClick={() => update('violenceLevel', value as ViolenceLevel)}
                    disabled={isKidMode}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Cursing</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['none', 'None', 'Clean'],
                  ['mild', 'Mild', 'Occasional'],
                  ['strong', 'Strong', 'Unrestricted'],
                ] as const).map(([value, label, sublabel]) => (
                  <ChoiceCard
                    key={value}
                    label={label}
                    sublabel={sublabel}
                    selected={draft.cursingLevel === value}
                    onClick={() => update('cursingLevel', value as CursingLevel)}
                    disabled={isKidMode}
                  />
                ))}
              </div>
            </div>
          </Section>

          <Section icon={<MessageCircle size={16} />} title="Relationship Subplots" visible={activeTab === 'narrative'}>
            <ToggleRow
              icon={<MessageCircle size={15} />}
              label="Romance Subplots"
              description="Allow optional, player-directed romantic storylines"
              checked={draft.romanceSubplots}
              onChange={(value) => setDraft((prev) => ({
                ...prev,
                romanceSubplots: value,
                haremContent: value ? prev.haremContent : false,
              }))}
              disabled={isKidMode}
            />
            <ToggleRow
              icon={<Sparkles size={15} />}
              label="Multiple Romance / Harem Content"
              description="Allow multiple independently established romance interests"
              checked={draft.haremContent}
              onChange={(value) => update('haremContent', value)}
              disabled={isKidMode || !draft.romanceSubplots}
            />
          </Section>

          {/* Spatial & Map Engine Options */}
          <Section icon={<Map size={16} />} title="Spatial & Map Engine Options" visible={activeTab === 'mechanics'}>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Map Tag Execution Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  icon={<Grid3x3 size={15} />}
                  label="Tactical Grid"
                  sublabel="Tags on all movement"
                  selected={draft.mapTriggerMode === 'tactical'}
                  onClick={() => update('mapTriggerMode', 'tactical' as MapTriggerMode)}
                />
                <ChoiceCard
                  icon={<Sparkles size={15} />}
                  label="Immersive"
                  sublabel="Major transitions only"
                  selected={draft.mapTriggerMode === 'immersive'}
                  onClick={() => update('mapTriggerMode', 'immersive' as MapTriggerMode)}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Fog of War Reveal Radius</label>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  icon={<EyeIcon size={14} />}
                  label="Adjacent"
                  sublabel="Surrounding hexes"
                  selected={draft.fogRevealThreshold === 'adjacent'}
                  onClick={() => update('fogRevealThreshold', 'adjacent' as FogRevealThreshold)}
                />
                <ChoiceCard
                  icon={<Dot size={14} />}
                  label="Current"
                  sublabel="Occupied node"
                  selected={draft.fogRevealThreshold === 'current'}
                  onClick={() => update('fogRevealThreshold', 'current' as FogRevealThreshold)}
                />
                <ChoiceCard
                  icon={<Layers size={14} />}
                  label="Full Map"
                  sublabel="Unfog completely"
                  selected={draft.fogRevealThreshold === 'full'}
                  onClick={() => update('fogRevealThreshold', 'full' as FogRevealThreshold)}
                />
              </div>
            </div>
          </Section>

          {/* Visual Mode: Comic / Classic (Locked mid-story) */}
          <Section icon={<Palette size={16} />} title="Visual Mode" visible={activeTab === 'visuals'}>
            {isStoryActive && (
              <p className="text-[11px] text-amber-400 mb-2">Visual mode is locked during an active story campaign.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard
                icon={<Grid3x3 size={15} />}
                label="Comic / Illustrated"
                sublabel="Multi-panel pages with speech bubbles"
                selected={draft.visualMode === 'comic'}
                onClick={() => { if (!isStoryActive) update('visualMode', 'comic' as 'comic' | 'classic'); }}
                disabled={isStoryActive}
              />
              <ChoiceCard
                icon={<MessageSquareMore size={15} />}
                label="Classic Text"
                sublabel="Prose-first log; optional rare splash art"
                selected={draft.visualMode === 'classic'}
                onClick={() => { if (!isStoryActive) update('visualMode', 'classic' as 'comic' | 'classic'); }}
                disabled={isStoryActive}
              />
            </div>
            {draft.visualMode === 'classic' && (
              <ToggleRow
                icon={<Sparkles size={14} />}
                label="Memorable Moment Images"
                description="Generate clean splash art (no text/bubbles) for milestones, first kills, and legendary drops. Routine panels stay off."
                checked={draft.classicMemorableImages}
                onChange={(v) => update('classicMemorableImages', v)}
              />
            )}
            {draft.visualMode === 'comic' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Comic layout{isStoryActive ? ' (locked)' : ''}
                  </label>
                  <select
                    disabled={isStoryActive}
                    value={draft.comicLayout ?? 'paged'}
                    onChange={(e) => update('comicLayout', e.target.value as ComicLayoutMode)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-xs text-slate-100 disabled:opacity-60"
                  >
                    <option value="paged">Paged (multi-panel)</option>
                    <option value="webtoon">Webtoon (vertical)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Reading direction{isStoryActive ? ' (locked)' : ''}
                  </label>
                  <select
                    disabled={isStoryActive}
                    value={draft.comicReadingDirection ?? 'ltr'}
                    onChange={(e) => update('comicReadingDirection', e.target.value as ComicReadingDirection)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-xs text-slate-100 disabled:opacity-60"
                  >
                    <option value="ltr">LTR (left → right)</option>
                    <option value="rtl">RTL (manga)</option>
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Art Style Preset (image generation only)
                {isStoryActive ? ' — locked for this session' : ''}
              </label>
              {isStoryActive && (
                <p className="mb-2 text-[11px] text-amber-400">
                  Art style is locked for the active campaign. Start a New Game to choose a different style.
                </p>
              )}
              <div className="space-y-1.5">
                {availableArtPresets.map((preset) => (
                  <button
                    key={preset.value}
                    disabled={isStoryActive}
                    onClick={() => {
                      if (!isStoryActive) update('artStylePreset', preset.value);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                      draft.artStylePreset === preset.value
                        ? 'border-crimson-500 bg-crimson-950/30'
                        : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'
                    } ${isStoryActive ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <Palette size={14} className={draft.artStylePreset === preset.value ? 'text-crimson-400' : 'text-slate-500'} />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-200">{preset.label}</div>
                      <div className="text-[10px] text-slate-500">{preset.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="color-variant" className="mb-2 block text-xs font-medium text-slate-300">
                Color Variant
              </label>
              <select
                id="color-variant"
                value={draft.colorVariant ?? 'default'}
                onChange={(event) => update('colorVariant', event.target.value as ColorVariant)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 shadow-inner outline-none transition-colors focus:border-crimson-500"
              >
                <option value="default">Style Default</option>
                <option value="monochrome">Force Black &amp; White</option>
                <option value="color">Force Full Color</option>
              </select>
              <p className="mt-1.5 text-[10px] text-slate-500">
                Overrides only the generated artwork palette; UI text remains readable.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Inline Panel Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard icon={<CircleSlash size={14} />} label="Minimal" sublabel="Scene shifts only" selected={draft.panelFrequency === 'minimal'} onClick={() => update('panelFrequency', 'minimal' as PanelFrequency)} />
                <ChoiceCard icon={<Sparkles size={14} />} label="Balanced" sublabel="Major beats" selected={draft.panelFrequency === 'balanced'} onClick={() => update('panelFrequency', 'balanced' as PanelFrequency)} />
                <ChoiceCard icon={<Layers size={14} />} label="High" sublabel="Frequent panels" selected={draft.panelFrequency === 'high'} onClick={() => update('panelFrequency', 'high' as PanelFrequency)} />
              </div>
            </div>
          </Section>

          {/* Background Settings */}
          <Section icon={<ImageIcon size={16} />} title="Backgrounds" visible={activeTab === 'visuals'}>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Background Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard icon={<ImageIcon size={14} />} label="Static" sublabel="Landscapes" selected={draft.bgMode === 'static'} onClick={() => update('bgMode', 'static' as BgMode)} />
                <ChoiceCard icon={<Sparkles size={14} />} label="Adaptive AI" sublabel="Auto-gen" selected={draft.bgMode === 'adaptive'} onClick={() => update('bgMode', 'adaptive' as BgMode)} />
                <ChoiceCard icon={<CircleSlash size={14} />} label="Off" selected={draft.bgMode === 'off'} onClick={() => update('bgMode', 'off' as BgMode)} />
              </div>
            </div>
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Background Opacity</span>
                <span className="text-slate-300">{draft.bgOpacity}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.bgOpacity}
                onChange={(e) => update('bgOpacity', parseInt(e.target.value, 10))}
                className="w-full accent-crimson-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">Default 25% for text legibility.</p>
            </div>
            <BackgroundsSection currentBgUrl={currentBgUrl} />
          </Section>

          {/* Comic Engine UI Overlays */}
          <Section icon={<Dot size={16} />} title="Comic Engine Overlays" visible={activeTab === 'visuals'}>
            <ToggleRow icon={<Grid3x3 size={15} />} label="Halftone Dot Overlay" description="CSS halftone texture layer" checked={draft.halftoneOverlay} onChange={(v) => update('halftoneOverlay', v)} />
            <ToggleRow icon={<Zap size={15} />} label="Dynamic SFX Popups" description="BAM!, CRITICAL!, SPLAT! on events" checked={draft.sfxPopups} onChange={(v) => update('sfxPopups', v)} />
            <ToggleRow icon={<MessageCircle size={15} />} label="Speech Bubble Extraction" description="Formats dialogue into comic tails" checked={draft.speechBubbles} onChange={(v) => update('speechBubbles', v)} />
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Panel Border Intensity</label>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard icon={<Layers size={14} />} label="Subtle Fine Line" selected={draft.panelBorderIntensity === 'subtle'} onClick={() => update('panelBorderIntensity', 'subtle' as PanelBorderIntensity)} />
                <ChoiceCard icon={<Grid3x3 size={14} />} label="Bold Ink" selected={draft.panelBorderIntensity === 'bold'} onClick={() => update('panelBorderIntensity', 'bold' as PanelBorderIntensity)} />
              </div>
            </div>
          </Section>

          {/* Voice & Audio */}
          <Section icon={<Volume2 size={16} />} title="Voice & Audio" visible={activeTab === 'general'}>
            <ToggleRow icon={<Volume2 size={15} />} label="GM Narration (TTS)" description="The GM reads responses aloud" checked={draft.ttsEnabled} onChange={(v) => update('ttsEnabled', v)} />
            <ToggleRow icon={<Mic size={15} />} label="Voice Input (STT)" description="Speak your actions" checked={draft.sttEnabled} onChange={(v) => update('sttEnabled', v)} />
          </Section>

          {/* Dice Display (DnD only) */}
          {isDnd && (
            <Section icon={<Dice5 size={16} />} title="5e Dice Display" visible={activeTab === 'mechanics'}>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard icon={<Dice5 size={15} />} label="3D / Visual" sublabel="Animated" selected={draft.diceAnimation === 'visual'} onClick={() => update('diceAnimation', 'visual' as DiceAnimationMode)} />
                <ChoiceCard icon={<BookText size={15} />} label="Text Only" sublabel="Instant" selected={draft.diceAnimation === 'text'} onClick={() => update('diceAnimation', 'text' as DiceAnimationMode)} />
              </div>
            </Section>
          )}

          {/* GM Strictness */}
          <Section icon={<Gauge size={16} />} title="GM Strictness" visible={activeTab === 'mechanics'}>
            <div className="grid grid-cols-3 gap-2">
              <ChoiceCard label="Forgiving" sublabel="Story-first" selected={draft.gmStrictness === 'forgiving'} onClick={() => update('gmStrictness', 'forgiving' as GmStrictness)} />
              <ChoiceCard label="Standard" sublabel="Balanced" selected={draft.gmStrictness === 'standard'} onClick={() => update('gmStrictness', 'standard' as GmStrictness)} />
              <ChoiceCard label="Hardcore" sublabel="Lethal" selected={draft.gmStrictness === 'hardcore'} onClick={() => update('gmStrictness', 'hardcore' as GmStrictness)} />
            </div>
          </Section>

          {/* Campaign Settings: Pillars & House Rules */}
          <Section icon={<Swords size={16} />} title="Campaign Settings" visible={activeTab === 'mechanics'}>
            <CampaignSettings settings={draft} onChange={update} />
          </Section>

          {/* Stat Block Verbosity */}
          <Section icon={<BarChart3 size={16} />} title="Stat Block Verbosity" visible={activeTab === 'mechanics'}>
            <ToggleRow
              icon={<BarChart3 size={15} />}
              label="Reading Stat Screens"
              description="Allow the GM to render LitRPG character-stat readouts"
              checked={draft.statScreensEnabled}
              onChange={(value) => update('statScreensEnabled', value)}
            />
            <div className="text-xs text-slate-500 mb-2">Controls how much detail is shown when the AI prints your character stats.</div>
            <div className="grid grid-cols-3 gap-2">
              <ChoiceCard label="Detailed" sublabel="Full stat block" selected={draft.statVerbosity === 'detailed'} onClick={() => update('statVerbosity', 'detailed' as StatVerbosity)} disabled={!draft.statScreensEnabled} />
              <ChoiceCard label="Core Only" sublabel="HP/MP/Level" selected={draft.statVerbosity === 'core'} onClick={() => update('statVerbosity', 'core' as StatVerbosity)} disabled={!draft.statScreensEnabled} />
              <ChoiceCard label="Minimal" sublabel="HP/MP inline" selected={draft.statVerbosity === 'minimal'} onClick={() => update('statVerbosity', 'minimal' as StatVerbosity)} disabled={!draft.statScreensEnabled} />
            </div>
          </Section>

          {/* Stat Block Frequency */}
          <Section icon={<Clock size={16} />} title="Stat Block Frequency" visible={activeTab === 'mechanics'}>
            <div className="text-xs text-slate-500 mb-2">Controls how often the AI appends a stat block to the chat.</div>
            <div className="grid grid-cols-3 gap-2">
              <ChoiceCard label="Every Turn" sublabel="Always shown" selected={draft.statFrequency === 'every-turn'} onClick={() => update('statFrequency', 'every-turn' as StatFrequency)} disabled={!draft.statScreensEnabled} />
              <ChoiceCard label="Every 5 Turns" sublabel="Periodic" selected={draft.statFrequency === 'every-5-turns'} onClick={() => update('statFrequency', 'every-5-turns' as StatFrequency)} disabled={!draft.statScreensEnabled} />
              <ChoiceCard label="End of Combat" sublabel="Encounter end" selected={draft.statFrequency === 'end-of-combat'} onClick={() => update('statFrequency', 'end-of-combat' as StatFrequency)} disabled={!draft.statScreensEnabled} />
            </div>
          </Section>

          {/* DnD Mode Formatting */}
          <Section icon={<ScrollText size={16} />} title="DnD Mode Formatting" visible={activeTab === 'mechanics'}>
            <ToggleRow
              icon={<BookOpen size={16} />}
              label="DnD Chat Formatting"
              description="Formats the chat log in classic tabletop style — boxed read-aloud text, inline dice notation, and immersive second-person narration."
              checked={draft.dndMode}
              onChange={(v) => update('dndMode', v)}
            />
          </Section>

          {/* API Key */}
          <Section icon={<KeyRound size={16} />} title={draft.aiProvider === 'gemini' ? 'Gemini API Key' : `${draft.aiProvider.charAt(0).toUpperCase() + draft.aiProvider.slice(1)} API Key`} visible={activeTab === 'general'}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">API Key</span>
              <KeyStatusBadge status={keyStatus} error={validationError} onTest={() => runValidation(draft.geminiApiKey)} />
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={draft.geminiApiKey}
                onChange={(e) => update('geminiApiKey', e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
              />
              <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Stored locally on this device.</p>
            <button onClick={() => setShowAdvancedApi(!showAdvancedApi)} className="mt-3 flex w-full items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
              <span>Advanced / Custom Provider</span>
              <ChevronDown size={14} className={`transition-transform ${showAdvancedApi ? 'rotate-180' : ''}`} />
            </button>
            {showAdvancedApi && (
              <div className="mt-2 space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Provider</label>
                  <select value={draft.aiProvider} onChange={(e) => { const p = e.target.value as AiProvider; update('aiProvider', p); setFetchedModels(getDefaultModels(p)); setSelectedModel(getDefaultModels(p)[0] ?? ''); }} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none">
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="groq">Groq</option>
                    <option value="ollama">Ollama</option>
                  </select>
                </div>
                {draft.aiProvider !== 'gemini' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Base URL</label>
                    <input value={draft.baseUrl} onChange={(e) => update('baseUrl', e.target.value)} placeholder="https://api.openai.com/v1" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none" />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Model</label>
                  <div className="flex gap-1.5">
                    <select value={selectedModel} onChange={(e) => { setSelectedModel(e.target.value); update('customModelId', e.target.value); }} className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none">
                      {fetchedModels.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <button type="button" onClick={handleFetchModels} disabled={fetchingModels} className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] text-crimson-300 hover:bg-slate-700 disabled:opacity-40">
                      {fetchingModels ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Fetch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Image Generation Provider */}
          <Section icon={<ImageIcon size={16} />} title="Image Generation" visible={activeTab === 'visuals'}>
            <button onClick={() => setShowImageSettings(!showImageSettings)} className="flex w-full items-center justify-between text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
              <span>Provider Settings</span>
              <ChevronDown size={14} className={`transition-transform ${showImageSettings ? 'rotate-180' : ''}`} />
            </button>
            {showImageSettings && (
              <div className="mt-3 space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Image Provider</label>
                  <select value={draft.imageProvider} onChange={(e) => update('imageProvider', e.target.value as 'gemini' | 'custom')} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none">
                    <option value="gemini">Google Gemini (Imagen)</option>
                    <option value="custom">Custom / Local Endpoint</option>
                  </select>
                </div>
                {draft.imageProvider === 'custom' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Endpoint Type</label>
                      <select value={draft.imageEndpointType} onChange={(e) => update('imageEndpointType', e.target.value as 'openai' | 'automatic1111' | 'comfyui')} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none">
                        <option value="openai">OpenAI-compatible</option>
                        <option value="automatic1111">Automatic1111</option>
                        <option value="comfyui">ComfyUI</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Base URL</label>
                      <input value={draft.imageBaseUrl} onChange={(e) => update('imageBaseUrl', e.target.value)} placeholder="http://localhost:7860" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none" />
                    </div>
                    {draft.imageEndpointType === 'openai' && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">API Key (optional)</label>
                          <input type="password" value={draft.imageApiKey} onChange={(e) => update('imageApiKey', e.target.value)} placeholder="sk-..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">Model</label>
                          <input value={draft.imageModel} onChange={(e) => update('imageModel', e.target.value)} placeholder="dall-e-3, sdxl, etc." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none" />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </Section>

          {/* Save File Management */}
          {(onExport || onImport) && (
            <Section icon={<Save size={16} />} title="Save File Management" visible={activeTab === 'general'}>
              <p className="mb-2 text-xs text-slate-500">
                Import and export live here — same as most games putting Load/Save in the pause or title menu, not on the action bar.
              </p>
              <div className="flex gap-2">
                {onExport && (
                  <button onClick={onExport} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70 transition-colors">
                    <Download size={15} /> Export Save
                  </button>
                )}
                {onImport && (
                  <>
                    <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70 transition-colors">
                      <Upload size={15} /> Import Save
                    </button>
                  </>
                )}
              </div>
            </Section>
          )}

          {/* Illustrated Book Export (Phase 3 — PDF Exporter Engine) */}
          <Section icon={<BookOpen size={16} />} title="Illustrated Book Export" visible={activeTab === 'visuals'}>
            <p className="mb-1 text-xs text-slate-500">
              Compile this session's panels into a print-ready PDF or a CBZ comic archive for readers.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!gameState || pdfExporting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pdfExporting ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
                {pdfExporting ? 'Generating PDF…' : 'Download Graphic Novel (PDF)'}
              </button>
              <button
                type="button"
                onClick={handleExportCbz}
                disabled={!gameState || cbzExporting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cbzExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {cbzExporting ? 'Packing CBZ…' : 'Download Comic Archive (CBZ)'}
              </button>
            </div>
            {pdfError && <p className="mt-1.5 text-[11px] text-red-400">{pdfError}</p>}
            {cbzError && <p className="mt-1.5 text-[11px] text-red-400">{cbzError}</p>}
            {!gameState && <p className="mt-1.5 text-[11px] text-slate-600">Start a story to enable export.</p>}
          </Section>

          {/* Content Mode */}
          <Section icon={<Shield size={16} />} title="Content Mode" visible={activeTab === 'general'}>
            <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${draft.kidModeLocked ? 'border-amber-700/50 bg-amber-950/20' : 'border-slate-700 bg-slate-800/40'}`}>
              <span className={isKidMode ? 'text-amber-400' : 'text-slate-400'}>{isKidMode ? <Baby size={16} /> : <Shield size={16} />}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">Kid Mode {draft.kidModeLocked && <span className="text-amber-400">(locked)</span>}</div>
                <div className="text-xs text-slate-500">{isKidMode ? 'Family-friendly content.' : 'Mature themes enabled.'}</div>
              </div>
              {canToggleKidMode ? (
                <button type="button" onClick={handleToggleKidMode} className={`relative h-5 w-9 rounded-full transition-colors ${isKidMode ? 'bg-amber-600' : 'bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isKidMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              ) : (<Lock size={14} className="text-amber-500" />)}
            </div>
          </Section>

          {/* Legal */}
          <Section icon={<Scale size={16} />} title="Legal & Licensing" visible={activeTab === 'general'}>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-[11px] leading-relaxed text-slate-400">
              <p>This work includes material from the SRD 5.1 by Wizards of the Coast LLC, licensed under CC BY 4.0.</p>
            </div>
          </Section>
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-700 bg-slate-900 px-5 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-crimson-600 px-4 py-2 text-sm font-medium text-white hover:bg-crimson-500 transition-colors">
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {showPinSetup && (
        <PinDialog title="Set PIN for Kid Mode" subtitle="Enter a PIN to protect the switch back." value={pinDraft} onChange={setPinDraft} onConfirm={handlePinSetupConfirm} onCancel={() => { setShowPinSetup(false); setPinDraft(''); setPinError(''); }} error={pinError} />
      )}
      {showPinUnlock && (
        <PinDialog title="Enter PIN to Exit Kid Mode" subtitle="Enter your PIN to switch to Adult Mode." value={pinUnlock} onChange={setPinUnlock} onConfirm={handlePinUnlockConfirm} onCancel={() => { setShowPinUnlock(false); setPinUnlock(''); setPinError(''); }} error={pinError} />
      )}
    </div>
  );
}

function Section({ icon, title, children, visible = true }: { icon: React.ReactNode; title: string; children: React.ReactNode; visible?: boolean }) {
  if (!visible) return null;
  return (
    <div className="border-t border-slate-700 pt-5 first:border-t-0 first:pt-0">
      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
        <span className="text-crimson-400">{icon}</span>
        {title}
      </label>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ChoiceCard({ icon, label, sublabel, selected, onClick, disabled }: { icon?: React.ReactNode; label: string; sublabel?: string; selected: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${selected ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}>
      {icon && <span className={selected ? 'text-crimson-400' : 'text-slate-500'}>{icon}</span>}
      <div className="flex-1">
        <div className={`text-xs font-medium ${selected ? 'text-crimson-200' : 'text-slate-200'}`}>{label}</div>
        {sublabel && <div className="text-[10px] text-slate-500">{sublabel}</div>}
      </div>
    </button>
  );
}

function PinDialog({ title, subtitle, value, onChange, onConfirm, onCancel, error }: { title: string; subtitle: string; value: string; onChange: (v: string) => void; onConfirm: () => void; onCancel: () => void; error: string }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl">
      <div className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-200"><Lock size={14} className="text-crimson-400" />{title}</div>
        <p className="mb-3 text-xs text-slate-500">{subtitle}</p>
        <input type="password" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter PIN..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-lg tracking-widest text-slate-100 placeholder-slate-600 focus:border-crimson-500 focus:outline-none" autoFocus />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-crimson-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-crimson-500 transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function KeyStatusBadge({ status, error, onTest }: { status: KeyStatus; error: string | null; onTest: () => void }) {
  if (status === 'validating') return <span className="flex items-center gap-1.5 rounded-full bg-sky-950/50 px-2.5 py-1 text-xs text-sky-300"><Loader2 size={12} className="animate-spin" />Testing...</span>;
  if (status === 'valid') return <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/50 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300"><Check size={12} />Connected</span>;
  if (status === 'invalid') return <span className="flex items-center gap-1.5 rounded-full border border-rose-600/50 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-300" title={error ?? 'Failed'}><X size={12} />Failed</span>;
  return <button type="button" onClick={onTest} className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"><RefreshCw size={12} />Test Key</button>;
}

function ToggleRow({ icon, label, description, checked, onChange, disabled = false }: { icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-800/70'}`}>
      <span className="text-slate-400">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-crimson-600' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

function BackgroundsSection({ currentBgUrl }: { currentBgUrl?: string | null }) {
  const [gallery, setGallery] = useState<BgEntry[]>([]);
  const [selected, setSelected] = useState<BgEntry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { bgList().then(setGallery).catch(() => setGallery([])); }, [refreshKey]);

  const handleDownload = (entry: BgEntry) => { const a = document.createElement('a'); a.href = entry.dataUrl; a.download = `bg_${entry.key}.png`; a.click(); };
  const handleDelete = async (key: string) => { await bgDelete(key); setRefreshKey(k => k + 1); if (selected?.key === key) setSelected(null); };

  return (
    <div className="space-y-3">
      {currentBgUrl && <p className="text-[10px] text-emerald-400">A cached background is currently active.</p>}
      <div>
        <div className="mb-2 text-xs text-slate-500">Cached Art Gallery ({gallery.length})</div>
        {gallery.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-600">No cached backgrounds yet.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((entry) => (
              <div key={entry.key} className="group relative overflow-hidden rounded-lg border border-slate-700 bg-slate-800/40">
                <img src={entry.dataUrl} alt={entry.genre} className="aspect-video w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex w-full items-center justify-between p-1.5">
                    <button onClick={() => setSelected(entry)} className="rounded bg-slate-800/80 p-1 text-slate-300 hover:text-white" title="View"><ZoomIn size={12} /></button>
                    <button onClick={() => handleDownload(entry)} className="rounded bg-slate-800/80 p-1 text-slate-300 hover:text-white" title="Download"><Download size={12} /></button>
                    <button onClick={() => handleDelete(entry.key)} className="rounded bg-slate-800/80 p-1 text-rose-400 hover:text-rose-300" title="Delete"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="relative max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"><X size={18} /></button>
            <img src={selected.dataUrl} alt={selected.genre} className="mb-3 w-full rounded-lg" />
            <button onClick={() => handleDownload(selected)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-crimson-600 px-3 py-2 text-xs font-medium text-white hover:bg-crimson-500"><Download size={14} /> Download</button>
          </div>
        </div>
      )}
    </div>
  );
}