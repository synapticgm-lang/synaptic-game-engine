import { useState, useRef, useEffect } from 'react';
import { X, Save, BookText, Volume2, Mic, Dice5, Shield, Lock, Baby, Gauge, Download, Upload, KeyRound, Eye, EyeOff, RefreshCw, Check, Loader2, Image as ImageIcon, Trash2, ZoomIn, Scale, Home, Zap, CircleSlash, Sparkles, Grid3x3, MessageSquareMore, Palette, Layers, Dot, MessageCircle, Map as MapIcon, Eye as EyeIcon, BarChart3, Clock, ScrollText, BookOpen, Swords, Mail, UserRound, FlaskConical } from 'lucide-react';
import type { Settings, DiceAnimationMode, ContentMode, GmStrictness, KeyStatus, PostLoginBehavior, BgMode, ColorVariant, PanelFrequency, PanelBorderIntensity, MapTriggerMode, FogRevealThreshold, StatVerbosity, StatFrequency, GameState, NarrativePerspective, ViolenceLevel, CursingLevel, ComicLayoutMode, ComicReadingDirection, SaveSlotInfo, EngineMode } from '@/game/types';
import { ART_STYLE_PRESETS } from '@/game/types';
import { validateApiKey } from '@/game/apiValidation';
import { CampaignSettings } from './CampaignSettings';
import { OpenRouterModelPicker } from './OpenRouterModelPicker';
import { bgList, bgDelete, type BgEntry } from '@/game/bgCache';
import { SETTINGS_EVENT_NAME } from '@/game/useGame';
import { exportSessionToPdf, downloadPdf } from '@/services/pdfExportService';
import { exportSessionToCbz, downloadCbz } from '@/services/cbzExportService';
import { distributionLabel, isStoreDistribution, canConfigurePlayerAiKeys } from '@/game/distributionChannel';
import {
  BYOK_DISCLAIMER_TEXT,
  hasByokKeysConfigured,
  resolveContentFilterProfile,
} from '@/game/contentFilterProfile';
import { KID_MODE_PIN_DISCLAIMER } from '@/game/parentPurchaseGate';
import { TERMS_DOC, PRIVACY_DOC } from '@/legal/legalDocs';
import { CREDITS_PATH } from '@/legal/credits';
import { FeedbackPanel } from './FeedbackPanel';
import { SupportAccountPanel } from './SupportAccountPanel';
import { PlayerProfilePanel } from './PlayerProfilePanel';
import { memorableWeeklyCapLabel } from '@/game/capacityLedger';
import { GM_VOICE_PROFILES } from '@/game/gmVoiceProfile';
import {
  canShowTestLabUi,
  getTestLabAiTier,
  isTestLabEnabled,
  loadTestLab,
  markTestAccountEmail,
  setTestLabAiTier,
  setTestLabEnabled,
  type HostedAiTier,
} from '@/game/testLab';
import { setActiveSubscriptionTier } from '@/game/subscriptionTiers';

interface Props {
  settings: Settings;
  storyName: string;
  engineMode: EngineMode;
  gameState?: GameState | null; // Added to check if story has started
  onSave: (s: Settings) => void;
  onSaveCustomTabletopRules?: (text: string) => void;
  onMemorableEnabledMidCampaign?: () => void;
  onStoryNameChange: (name: string) => void;
  onSetContentMode: (mode: ContentMode, pin?: string) => void;
  onVerifyPin: (pin: string) => boolean;
  onExport?: () => void;
  onImport?: (file: File) => void;
  localSlot?: SaveSlotInfo | null;
  cloudSlots?: SaveSlotInfo[];
  currentSaveId?: string | null;
  onDeleteSave?: (saveId: string) => Promise<void>;
  onDeleteExtraSaves?: () => Promise<void>;
  onDeleteAllSaves?: () => Promise<void>;
  onClose: () => void;
  currentBgUrl?: string | null;
  /** Auth UUID for support tickets + in-game mail. */
  supportUserId?: string | null;
  googleSignedIn?: boolean;
  /** Signed-in account email — used to mark Test Lab accounts. */
  accountEmail?: string | null;
}

type SettingsTab = 'general' | 'narrative' | 'mechanics' | 'visuals';

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General / Core' },
  { id: 'narrative', label: 'Narrative & Tone' },
  { id: 'mechanics', label: 'Mechanics & Stats' },
  { id: 'visuals', label: 'Visuals' },
];

export function SettingsModal({ settings, storyName, engineMode, gameState, onSave, onSaveCustomTabletopRules, onMemorableEnabledMidCampaign, onStoryNameChange, onSetContentMode, onVerifyPin, onExport, onImport, localSlot, cloudSlots, currentSaveId, onDeleteSave, onDeleteExtraSaves, onDeleteAllSaves, onClose, currentBgUrl, supportUserId = null, googleSignedIn = false, accountEmail = null }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [customRulesDraft, setCustomRulesDraft] = useState(gameState?.customTabletopRules ?? '');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [storyNameDraft, setStoryNameDraft] = useState(storyName);
  const [showTextKey, setShowTextKey] = useState(false);
  const [showImageKey, setShowImageKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('untested');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [cbzExporting, setCbzExporting] = useState(false);
  const [cbzError, setCbzError] = useState<string | null>(null);
  const [testLabOn, setTestLabOn] = useState(() => isTestLabEnabled());
  const [testLabAi, setTestLabAi] = useState<HostedAiTier>(() => getTestLabAiTier());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDnd = engineMode === 'dnd';
  const isKidMode = draft.contentMode === 'kid';
  const canToggleKidMode = !draft.kidModeLocked;
  const showTestLab = canShowTestLabUi({
    email: accountEmail,
    subscriptionTier: draft.subscriptionTier,
  });

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
  const [pinDisclaimerAccepted, setPinDisclaimerAccepted] = useState(false);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'contentMode' && value === 'kid') {
        next.byokModeEnabled = false;
      }
      return next;
    });
  };

  const runValidation = async (key: string) => {
    if (!key || key.trim().length < 5) { setKeyStatus('untested'); setValidationError(null); return; }
    setKeyStatus('validating');
    const result = await validateApiKey('openrouter', key.trim());
    if (result.ok) { setKeyStatus('valid'); setValidationError(null); }
    else { setKeyStatus('invalid'); setValidationError(result.error ?? 'Unknown error'); }
  };

  const handleToggleKidMode = () => {
    if (draft.kidModeLocked) return;
    if (draft.contentMode === 'adult') {
      setPinDisclaimerAccepted(false);
      setPinDraft('');
      setPinError('');
      setShowPinSetup(true);
    } else {
      if (settings.contentPin) { setShowPinUnlock(true); }
      else { update('contentMode', 'adult'); onSetContentMode('adult'); }
    }
  };

  const handlePinSetupConfirm = () => {
    if (!pinDisclaimerAccepted) {
      setPinError('Please read and accept the parent PIN notice.');
      return;
    }
    if (pinDraft.length < 4) { setPinError('PIN must be at least 4 digits.'); return; }
    update('contentMode', 'kid');
    onSetContentMode('kid', pinDraft);
    setShowPinSetup(false); setPinDraft(''); setPinError(''); setPinDisclaimerAccepted(false);
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
    const toSave: Settings = {
      ...draft,
      aiProvider: 'openrouter',
      geminiApiKey: '',
      imageApiKey: draft.fluxApiKey,
    };
    if (!toSave.fluxApiKey.trim() && toSave.imageProvider === 'flux-direct') {
      toSave.imageProvider = 'flux';
    }
    onSave(toSave);
    if (engineMode === 'dnd') {
      onSaveCustomTabletopRules?.(customRulesDraft);
    }
    if (
      isStoryActive
      && !settings.classicMemorableImages
      && toSave.classicMemorableImages
    ) {
      onMemorableEnabledMidCampaign?.();
    }
    window.dispatchEvent(
      new CustomEvent(SETTINGS_EVENT_NAME, { detail: toSave })
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
            <div className="grid grid-cols-3 gap-2">
              <ChoiceCard
                label="First Person"
                sublabel="I / me / my"
                selected={draft.perspective === 'first-person'}
                onClick={() => update('perspective', 'first-person' as NarrativePerspective)}
              />
              <ChoiceCard
                label="Second Person"
                sublabel="You / your"
                selected={draft.perspective === 'second-person'}
                onClick={() => update('perspective', 'second-person' as NarrativePerspective)}
              />
              <ChoiceCard
                label="Third Person"
                sublabel="Name / they"
                selected={draft.perspective === 'third-person'}
                onClick={() => update('perspective', 'third-person' as NarrativePerspective)}
              />
            </div>
          </Section>

          <Section icon={<BookText size={16} />} title="GM / System voice" visible={activeTab === 'narrative'}>
            <p className="mb-2 text-[11px] text-slate-500">
              Prompt tone for LitRPG, Story RPG, and Pick Your Own Adventure — separate from Shop TTS voice kits.
              Tabletop Fantasy uses the GM personality you pick at New Game (saved with that campaign).
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GM_VOICE_PROFILES.map((p) => (
                <ChoiceCard
                  key={p.id}
                  label={p.label}
                  sublabel={p.blurb}
                  selected={(draft.gmVoiceProfileId ?? 'cold-system') === p.id}
                  onClick={() => update('gmVoiceProfileId', p.id)}
                />
              ))}
            </div>
            <div className="mt-3">
              <ToggleRow
                icon={<MessageSquareMore size={15} />}
                label="Show full GM reply at once"
                description="Skip sentence-by-sentence reveal after the turn commits"
                checked={!!draft.preferFullResponse}
                onChange={(v) => update('preferFullResponse', v)}
              />
            </div>
          </Section>

          <Section icon={<Shield size={16} />} title="Language & Violence" visible={activeTab === 'narrative'}>
            {isKidMode && (
              <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-2 text-[11px] text-amber-300">
                Kid Mode overrides these controls with non-violent, profanity-free output.
              </p>
            )}
            <p className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-2 text-[11px] text-slate-400">
              Active filter:{' '}
              <span className="text-slate-200">{resolveContentFilterProfile(draft).label}</span>
              {' Â· '}
              {distributionLabel()}
              <span className="mt-1 block text-slate-500">{resolveContentFilterProfile(draft).summary}</span>
            </p>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Maturity Tier</label>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  label="PG-13"
                  sublabel="Default"
                  selected={(draft.maturityTier ?? 'pg13') === 'pg13'}
                  onClick={() => update('maturityTier', 'pg13')}
                  disabled={isKidMode || isStoreDistribution()}
                />
                <ChoiceCard
                  label="Mature"
                  sublabel="Opt-in 18+"
                  selected={draft.maturityTier === 'mature'}
                  onClick={() => update('maturityTier', 'mature')}
                  disabled={isKidMode || isStoreDistribution()}
                />
              </div>
            </div>
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
            <ToggleRow
              icon={<Shield size={15} />}
              label="Sexual content (fade-to-black)"
              description={
                isStoreDistribution()
                  ? 'Locked on store builds — intimacy stays fade-to-black / implication only'
                  : 'Allow implied intimacy; still fades to black unless on an NSFW website campaign'
              }
              checked={!!draft.sexualContent && !isStoreDistribution()}
              onChange={(value) => update('sexualContent', value)}
              disabled={isKidMode || isStoreDistribution() || draft.maturityTier !== 'mature'}
            />
            <ToggleRow
              icon={<Shield size={15} />}
              label="Substance use"
              description="Alcohol / drugs may appear in fiction"
              checked={draft.substanceUse !== false}
              onChange={(value) => update('substanceUse', value)}
              disabled={isKidMode}
            />
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Dark themes</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['none', 'None'],
                  ['implied', 'Implied'],
                  ['explored', 'Explored'],
                ] as const).map(([value, label]) => (
                  <ChoiceCard
                    key={value}
                    label={label}
                    selected={(draft.darkThemes ?? 'implied') === value}
                    onClick={() => update('darkThemes', value)}
                    disabled={isKidMode}
                  />
                ))}
              </div>
            </div>
            <ToggleRow
              icon={<Shield size={15} />}
              label="Confirm content rewrites"
              description='Pause on "System interprets…" before applying rating rewrites'
              checked={draft.confirmContentRewrites !== false}
              onChange={(value) => update('confirmContentRewrites', value)}
              disabled={isKidMode}
            />
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
          <Section icon={<MapIcon size={16} />} title="Spatial & Map Engine Options" visible={activeTab === 'mechanics'}>
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
                label={`Memorable Moment Images · ${memorableWeeklyCapLabel()}`}
                description="When on, the opening scene (nicer model) and character death get splash art. The first dungeon’s final boss (First Blood) also auto-splashes on the fast model — later dungeon bosses do not. A royal audience, a striking first look, or a writer-flagged beat is offered — tap to generate on the fast model. First fights do not. Not every turn. The toggle is consent — autos fire without a second Yes."
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
                    <option value="ltr">LTR (left â†’ right)</option>
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

          {/* Dice display (tabletop fantasy only — LitRPG / story RPG don't use the dice tray) */}
          {isDnd && (
            <Section icon={<Dice5 size={16} />} title="Dice display" visible={activeTab === 'mechanics'}>
              <p className="mb-2 text-xs text-slate-500">
                Static = instant. Normal = short roll. Excited = longer roll with theme FX from your equipped dice skin.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard icon={<BookText size={15} />} label="Static" sublabel="Instant" selected={draft.diceAnimation === 'static'} onClick={() => update('diceAnimation', 'static' as DiceAnimationMode)} />
                <ChoiceCard icon={<Dice5 size={15} />} label="Normal" sublabel="Short roll" selected={draft.diceAnimation === 'normal'} onClick={() => update('diceAnimation', 'normal' as DiceAnimationMode)} />
                <ChoiceCard icon={<Zap size={15} />} label="Excited" sublabel="Theme FX" selected={draft.diceAnimation === 'excited'} onClick={() => update('diceAnimation', 'excited' as DiceAnimationMode)} />
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
            <CampaignSettings
              settings={draft}
              onChange={update}
              engineMode={engineMode}
              customTabletopRules={customRulesDraft}
              onCustomTabletopRulesChange={setCustomRulesDraft}
              kidMode={isKidMode}
            />
          </Section>

          <Section icon={<Swords size={16} />} title="Combat pacing" visible={activeTab === 'mechanics'}>
            <p className="mb-2 text-xs text-slate-500">
              Auto Fight resolves most encounters in about 1â€“2 turns (same dice and loot). Full control spends a turn per round — use it when you want every move.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard
                icon={<Swords size={15} />}
                label="Full control"
                sublabel="Round-by-round (more turns)"
                selected={draft.combatResolveMode === 'full'}
                onClick={() => update('combatResolveMode', 'full')}
              />
              <ChoiceCard
                icon={<Zap size={15} />}
                label="Auto Fight"
                sublabel="~1â€“2 turns per fight"
                selected={draft.combatResolveMode === 'auto'}
                onClick={() => update('combatResolveMode', 'auto')}
              />
            </div>
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

          {/* Tabletop chat formatting */}
          <Section icon={<ScrollText size={16} />} title="Tabletop Formatting" visible={activeTab === 'mechanics'}>
            <ToggleRow
              icon={<BookOpen size={16} />}
              label="Tabletop Chat Formatting"
              description="Formats the chat log in classic tabletop style — boxed read-aloud text, inline dice notation, and immersive narration."
              checked={draft.dndMode}
              onChange={(v) => update('dndMode', v)}
            />
          </Section>

          {/* Player AI keys — Admin (BYOK) website tier only */}
          <Section icon={<KeyRound size={16} />} title="AI Keys (Admin BYOK)" visible={activeTab === 'general'}>
            {!canConfigurePlayerAiKeys(draft) ? (
              <p className="text-[11px] leading-relaxed text-slate-400">
                {isStoreDistribution()
                  ? 'This store build uses SynapticGM-hosted AI only. Player API keys are not available (Google Play & App Store policy).'
                  : isKidMode
                    ? 'Kid Mode uses hosted family-safe AI. Admin keys are disabled.'
                    : draft.subscriptionTier !== 'admin'
                      ? 'Text and image AI are hosted by SynapticGM on Free / Mid / High. Only the Admin (BYOK) website tier can add personal keys.'
                      : 'Admin BYOK is website-only.'}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap">
                  {BYOK_DISCLAIMER_TEXT}
                </p>
                <label className="flex items-start gap-2 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!draft.byokDisclaimerAccepted}
                    onChange={(e) => {
                      const accepted = e.target.checked;
                      update('byokDisclaimerAccepted', accepted);
                      if (!accepted) update('byokModeEnabled', false);
                    }}
                  />
                  <span>
                    I am an adult and I accept this disclaimer. SynapticGM owners/makers take no
                    responsibility for content generated with my keys.
                  </span>
                </label>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-200">Text key (OpenRouter)</label>
                    <KeyStatusBadge status={keyStatus} error={validationError} onTest={() => runValidation(draft.openrouterApiKey)} />
                  </div>
                  <p className="mb-1 text-[10px] text-slate-500">Required. Admin BYOK does not include a hosted text key — you pay OpenRouter.</p>
                  <div className="relative">
                    <input
                      type={showTextKey ? 'text' : 'password'}
                      value={draft.openrouterApiKey}
                      onChange={(e) => {
                        update('openrouterApiKey', e.target.value);
                        update('aiProvider', 'openrouter');
                        setKeyStatus('untested');
                      }}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Paste OpenRouter (or compatible) key"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
                    />
                    <button type="button" onClick={() => setShowTextKey(!showTextKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showTextKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <OpenRouterModelPicker
                  selectedId={draft.customModelId}
                  onSelect={(id) => update('customModelId', id)}
                />

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-200">Image key (Flux)</label>
                  <p className="mb-1 text-[10px] text-slate-500">
                    Optional until you want BFL Direct. Pictures use your OpenRouter text key until you paste a Flux key and turn Direct on. No hosted art on this tier.
                  </p>
                  <div className="relative">
                    <input
                      type={showImageKey ? 'text' : 'password'}
                      value={draft.fluxApiKey}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          fluxApiKey: value,
                          imageApiKey: value,
                          imageProvider: value.trim() ? prev.imageProvider : 'flux',
                        }));
                      }}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Paste Flux / BFL key (optional)"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
                    />
                    <button type="button" onClick={() => setShowImageKey(!showImageKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showImageKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <label className={`mt-2 flex items-start gap-2 text-[11px] ${draft.fluxApiKey.trim() ? 'text-slate-300' : 'text-slate-500'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={draft.imageProvider === 'flux-direct'}
                      disabled={!draft.fluxApiKey.trim()}
                      onChange={(e) => update('imageProvider', e.target.checked ? 'flux-direct' : 'flux')}
                    />
                    <span>Use Flux Direct (BFL) with this image key. Off = OpenRouter Flux on your text key.</span>
                  </label>
                </div>

                <ToggleRow
                  icon={<KeyRound size={15} />}
                  label="Enable Admin BYOK mode"
                  description={
                    hasByokKeysConfigured(draft)
                      ? 'Route story + art through your keys; CORE rails still apply'
                      : 'Accept the disclaimer and enter Text + Image keys first'
                  }
                  checked={!!draft.byokModeEnabled && !!draft.byokDisclaimerAccepted}
                  onChange={(value) => {
                    if (value && !draft.byokDisclaimerAccepted) return;
                    update('byokModeEnabled', value);
                  }}
                  disabled={!draft.byokDisclaimerAccepted || !hasByokKeysConfigured(draft)}
                />
                <p className="text-[10px] text-slate-500">Keys stay on this device only. Never logged or committed.</p>
              </div>
            )}
          </Section>
          {/* Image Generation Provider */}
          <Section icon={<ImageIcon size={16} />} title="Image Generation" visible={activeTab === 'visuals'}>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {canConfigurePlayerAiKeys(draft)
                ? 'Admin BYOK: pictures use your OpenRouter text key, or Flux Direct if you pasted an image key. No hosted art.'
                : 'Memorable and comic art use SynapticGM-hosted image AI. Custom image keys are only on the Admin (BYOK) website tier (see General → AI Keys).'}
            </p>
          </Section>
          {/* Save File Management */}
          {(onExport || onImport || onDeleteSave) && (
            <Section icon={<Save size={16} />} title="Save File Management" visible={activeTab === 'general'}>
              <p className="mb-2 text-xs text-slate-500">
                Import, export, and delete saved games here — leftover cloud campaigns stay until you remove them.
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
              {onDeleteSave && (
                <SaveSlotsManager
                  localSlot={localSlot ?? null}
                  cloudSlots={cloudSlots ?? []}
                  currentSaveId={currentSaveId ?? gameState?.saveId ?? null}
                  onDeleteSave={onDeleteSave}
                  onDeleteExtraSaves={onDeleteExtraSaves}
                  onDeleteAllSaves={onDeleteAllSaves}
                />
              )}
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

          {/* Test Lab — QA unlock + Free/Mid/High AI switch */}
          {showTestLab && (
            <Section icon={<FlaskConical size={16} />} title="Test Lab" visible={activeTab === 'general'}>
              <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                Marks this device{accountEmail ? ` / ${accountEmail}` : ''} as a test account: unlimited
                text + memorable capacity, all shop cosmetics already unlocked, and hosted Free / Mid / High
                AI quality you can switch live.
              </p>
              <ToggleRow
                icon={<FlaskConical size={15} />}
                label="Enable test account"
                description={
                  testLabOn
                    ? `Unlimited capacity · AI catalog ${testLabAi.toUpperCase()}`
                    : 'Off — normal subscription caps apply'
                }
                checked={testLabOn}
                onChange={(on) => {
                  setTestLabEnabled(on);
                  setTestLabOn(on);
                  if (on) {
                    markTestAccountEmail(accountEmail);
                    const tier = getTestLabAiTier();
                    setTestLabAi(tier);
                    setActiveSubscriptionTier(tier);
                    const next: Settings = {
                      ...draft,
                      subscriptionTier: tier,
                      classicMemorableImages: true,
                      aiProvider: 'openrouter',
                    };
                    setDraft(next);
                    onSave(next);
                    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: next }));
                    if (isStoryActive && !settings.classicMemorableImages) {
                      onMemorableEnabledMidCampaign?.();
                    }
                  }
                }}
              />
              {testLabOn && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] text-slate-400">Hosted AI quality (Free / Mid / High)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['free', 'mid', 'high'] as HostedAiTier[]).map((tier) => (
                      <ChoiceCard
                        key={tier}
                        label={tier === 'free' ? 'Free' : tier === 'mid' ? 'Mid' : 'High'}
                        sublabel={
                          tier === 'free'
                            ? 'Gemini 2.5 Flash Lite'
                            : tier === 'mid'
                              ? 'Claude Haiku 4.5'
                              : 'Claude Sonnet 4.6'
                        }
                        selected={testLabAi === tier}
                        onClick={() => {
                          setTestLabAiTier(tier);
                          setTestLabAi(tier);
                          setActiveSubscriptionTier(tier);
                          const next: Settings = {
                            ...draft,
                            subscriptionTier: tier,
                            aiProvider: 'openrouter',
                          };
                          setDraft(next);
                          onSave(next);
                          window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: next }));
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-600">
                    Marked emails on this device: {loadTestLab().markedEmails.join(', ') || 'none yet'}.
                    Production allowlist: set VITE_TEST_ACCOUNT_EMAILS.
                  </p>
                </div>
              )}
            </Section>
          )}

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

          <Section icon={<UserRound size={16} />} title="Player profile" visible={activeTab === 'general'}>
            <PlayerProfilePanel compact />
          </Section>

          <Section icon={<Mail size={16} />} title="Support & messages" visible={activeTab === 'general'}>
            <SupportAccountPanel supportUserId={supportUserId} signedIn={googleSignedIn} />
          </Section>

          <Section icon={<MessageSquareMore size={16} />} title="Send feedback" visible={activeTab === 'general'}>
            <FeedbackPanel
              playerId={supportUserId}
              characterName={gameState?.character?.name ?? null}
              campaign={storyNameDraft || storyName || gameState?.storyName || null}
              engineMode={engineMode}
              turn={gameState?.turn ?? null}
            />
          </Section>

          {/* Legal */}
          <Section icon={<Scale size={16} />} title="Legal & Licensing" visible={activeTab === 'general'}>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-[11px] leading-relaxed text-slate-400 space-y-2">
              <p>SynapticGM is original tabletop and LitRPG play. We are not affiliated with other companies’ tabletop RPGs. Generic words (dungeon, dragon, dice, d20) are used in their ordinary sense.</p>
              <p>
                Kid Mode PIN: parents are responsible for PIN security and any purchases made with that PIN.
              </p>
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                <a href={TERMS_DOC.path} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Terms of Service
                </a>
                <a href={PRIVACY_DOC.path} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Privacy Policy
                </a>
                <a href={CREDITS_PATH} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Credits
                </a>
              </p>
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
        <PinDialog
          title="Set PIN for Kid Mode"
          subtitle="Enter a PIN only a parent or guardian should know. It locks exiting Kid Mode and approves purchases."
          value={pinDraft}
          onChange={setPinDraft}
          onConfirm={handlePinSetupConfirm}
          onCancel={() => {
            setShowPinSetup(false);
            setPinDraft('');
            setPinError('');
            setPinDisclaimerAccepted(false);
          }}
          error={pinError}
          showParentDisclaimer
          disclaimerAccepted={pinDisclaimerAccepted}
          onDisclaimerAcceptedChange={setPinDisclaimerAccepted}
        />
      )}
      {showPinUnlock && (
        <PinDialog title="Enter PIN to Exit Kid Mode" subtitle="Enter your PIN to switch to Adult Mode." value={pinUnlock} onChange={setPinUnlock} onConfirm={handlePinUnlockConfirm} onCancel={() => { setShowPinUnlock(false); setPinUnlock(''); setPinError(''); }} error={pinError} />
      )}
    </div>
  );
}

type ManagedSave = SaveSlotInfo & { sources: Array<'local' | 'cloud'> };

function mergeSaveSlots(localSlot: SaveSlotInfo | null, cloudSlots: SaveSlotInfo[]): ManagedSave[] {
  const map = new Map<string, ManagedSave>();
  for (const slot of cloudSlots) {
    if (!slot.saveId) continue;
    map.set(slot.saveId, { ...slot, sources: ['cloud'] });
  }
  if (localSlot?.saveId) {
    const existing = map.get(localSlot.saveId);
    if (existing) {
      const newer = localSlot.lastUpdated > existing.lastUpdated ? localSlot : existing;
      map.set(localSlot.saveId, { ...newer, sources: ['local', 'cloud'] });
    } else {
      map.set(localSlot.saveId, { ...localSlot, sources: ['local'] });
    }
  }
  return [...map.values()].sort((a, b) => b.lastUpdated - a.lastUpdated);
}

function SaveSlotsManager({
  localSlot,
  cloudSlots,
  currentSaveId,
  onDeleteSave,
  onDeleteExtraSaves,
  onDeleteAllSaves,
}: {
  localSlot: SaveSlotInfo | null;
  cloudSlots: SaveSlotInfo[];
  currentSaveId: string | null;
  onDeleteSave: (saveId: string) => Promise<void>;
  onDeleteExtraSaves?: () => Promise<void>;
  onDeleteAllSaves?: () => Promise<void>;
}) {
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slots = mergeSaveSlots(localSlot, cloudSlots);
  const extraCount = Math.max(0, cloudSlots.filter((slot) => slot.saveId !== currentSaveId && slot.saveId !== localSlot?.saveId).length);
  const keepId = currentSaveId ?? localSlot?.saveId ?? cloudSlots[0]?.saveId ?? null;
  const leftoverCount = keepId ? slots.filter((slot) => slot.saveId !== keepId).length : slots.length;

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      setConfirmKey(null);
    } finally {
      setBusy(false);
    }
  };

  if (slots.length === 0) {
    return <p className="text-[11px] text-slate-600">No saved games on this device or in the cloud.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500">Saved games ({slots.length})</div>
      {slots.map((slot) => {
        const isCurrent = slot.saveId === currentSaveId || slot.saveId === localSlot?.saveId;
        const confirming = confirmKey === slot.saveId;
        return (
          <div key={slot.saveId} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-200">
                  {slot.storyName}
                  {isCurrent && <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-emerald-400">current</span>}
                </div>
                <div className="text-[11px] text-slate-500">
                  {slot.characterName} Â· Lv.{slot.level} Â· Turn {slot.turn}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {slot.sources.map((source) => (
                    <span key={source} className="rounded border border-slate-700 px-1.5 py-0 text-[10px] uppercase tracking-wide text-slate-500">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              {!confirming ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmKey(slot.saveId)}
                  className="shrink-0 rounded-lg border border-rose-900/60 bg-rose-950/30 p-1.5 text-rose-400 transition-colors hover:bg-rose-950/60 hover:text-rose-300 disabled:opacity-50"
                  title="Delete save"
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(slot.saveId, () => onDeleteSave(slot.saveId))}
                    className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {busy ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmKey(null)}
                    className="rounded-lg px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {leftoverCount > 0 && onDeleteExtraSaves && (
        confirmKey === 'extras' ? (
          <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2">
            <p className="mb-2 text-[11px] text-rose-300">Delete {leftoverCount} leftover save{leftoverCount === 1 ? '' : 's'}? Your current campaign is kept.</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => run('extras', () => onDeleteExtraSaves())} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50">
                {busy ? 'Clearing…' : 'Confirm'}
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmKey(null)} className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmKey('extras')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/70 disabled:opacity-50"
          >
            <Trash2 size={14} /> Clear leftover saves{extraCount > 0 ? ` (${leftoverCount})` : ''}
          </button>
        )
      )}
      {onDeleteAllSaves && (
        confirmKey === 'all' ? (
          <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2">
            <p className="mb-2 text-[11px] text-rose-300">Delete every saved game on this device and in the cloud? This cannot be undone.</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => run('all', () => onDeleteAllSaves())} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50">
                {busy ? 'Deleting…' : 'Delete all'}
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmKey(null)} className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmKey('all')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-950/40 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete all saved games
          </button>
        )
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

function PinDialog({
  title,
  subtitle,
  value,
  onChange,
  onConfirm,
  onCancel,
  error,
  showParentDisclaimer = false,
  disclaimerAccepted = false,
  onDisclaimerAcceptedChange,
}: {
  title: string;
  subtitle: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  error: string;
  showParentDisclaimer?: boolean;
  disclaimerAccepted?: boolean;
  onDisclaimerAcceptedChange?: (v: boolean) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl p-3">
      <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-200"><Lock size={14} className="text-crimson-400" />{title}</div>
        <p className="mb-3 text-xs text-slate-500">{subtitle}</p>
        {showParentDisclaimer && (
          <div className="mb-3 space-y-2 rounded-lg border border-amber-800/40 bg-amber-950/20 p-3">
            <p className="text-[11px] leading-relaxed text-amber-100/90">
              {KID_MODE_PIN_DISCLAIMER}
            </p>
            <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => onDisclaimerAcceptedChange?.(e.target.checked)}
                className="mt-0.5 rounded border-slate-600"
              />
              <span>I am a parent/guardian and I understand I am responsible for this PIN and any purchases made with it.</span>
            </label>
          </div>
        )}
        <input type="password" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter PIN..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-lg tracking-widest text-slate-100 placeholder-slate-600 focus:border-crimson-500 focus:outline-none" autoFocus={!showParentDisclaimer} />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={showParentDisclaimer && !disclaimerAccepted}
            className="rounded-lg bg-crimson-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-crimson-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
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