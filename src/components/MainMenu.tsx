import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Swords,
  Settings as SettingsIcon,
  Cloud,
  UserRound,
  BookOpen,
  Library,
  Store,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import type { SaveSlotInfo, Settings } from '@/game/types';
import {
  SHOP_CATALOG,
  SLOT_LABELS,
  RACE_THEME_ITEMS,
  OTHER_THEME_ITEMS,
  type CosmeticSlot,
  type ShopItem,
  shopItemById,
  themeKitItems,
  isRaceKitPart,
  themeTextureOf,
} from '@/game/cosmeticCatalog';
import { ensureTestCosmeticUnlock, isOwned } from '@/game/cosmeticEntitlements';
import { LegalLinks } from './LegalLinks';
import { PlayerProfilePanel } from './PlayerProfilePanel';
import {
  applySettingsCosmetics,
  applyUiThemeToDocument,
  ensureCatalogPreviewFonts,
  themeBySettingsId,
  themePanelTextureUrl,
} from '@/game/uiTheme';
import { previewVoiceLine } from '@/game/useVoice';
import { DicePreview } from './DicePreview';
import { CapacityPackShop } from './CapacityPackShop';
import { ParentPurchaseGate, requestParentPurchaseApproval } from './ParentPurchaseGate';

type HubTab = 'play' | 'profile' | 'themes' | 'shop';

interface MainMenuProps {
  hasSave: boolean;
  localSlot: SaveSlotInfo | null;
  cloudSlot: SaveSlotInfo | null;
  googleSignedIn: boolean;
  googleEmail?: string;
  isGuest: boolean;
  settings: Settings;
  onContinue: () => void;
  onNewGame: () => void;
  onSettings: () => void;
  onOpenLibrary?: () => void;
  onSaveCosmetics: (patch: Partial<Settings>) => void;
}

export function MainMenu({
  hasSave,
  localSlot,
  cloudSlot,
  googleSignedIn,
  googleEmail,
  isGuest,
  settings,
  onContinue,
  onNewGame,
  onSettings,
  onOpenLibrary,
  onSaveCosmetics,
}: MainMenuProps) {
  const [tab, setTab] = useState<HubTab>('play');

  useEffect(() => {
    ensureTestCosmeticUnlock();
  }, []);

  useEffect(() => {
    applySettingsCosmetics(settings);
  }, [settings.uiThemeId, settings.fontPackId, settings.diceCosmeticId, settings.turnFrameCosmeticId]);

  useEffect(() => {
    if (tab === 'themes' || tab === 'shop') ensureCatalogPreviewFonts();
  }, [tab]);

  return (
    <div
      className="sgm-home sgm-scroll-page relative flex h-full min-h-0 w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto px-4 pt-8"
      style={{
        backgroundColor: 'var(--sgm-bg, #020617)',
        color: 'var(--sgm-text, #e2e8f0)',
        fontFamily: 'var(--sgm-font-ui, ui-sans-serif, system-ui, sans-serif)',
      }}
    >
      <BackgroundFx />

      <button
        type="button"
        onClick={onSettings}
        className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 backdrop-blur-sm hover:bg-slate-800 transition-colors"
      >
        <SettingsIcon size={18} />
        Settings
      </button>

      <div className="relative z-10 flex w-full min-h-0 max-w-3xl flex-col items-center gap-6 pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="aspect-square w-full max-w-[140px] overflow-hidden sm:max-w-[220px]">
            <img
              src="/assets/images/1785421156244~2 copy.png"
              alt="SYNAPTIC GM"
              className="w-full h-auto object-cover object-top drop-shadow-[0_0_20px_rgba(220,38,38,0.35)] filter brightness-110"
            />
          </div>
          <div className="sgm-home-title-panel flex flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-center">
            <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--sgm-text, #f1f5f9)' }}>
              SYNAPTIC GM
            </h1>
            <p className="text-sm" style={{ color: 'var(--sgm-muted, #94a3b8)' }}>
              A dark fantasy world awaits your decisions.
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/70 p-1">
          {(
            [
              ['play', 'Play', Play],
              ['profile', 'Profile', UserRound],
              ['themes', 'Themes', Palette],
              ['shop', 'Shop', Store],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium sm:gap-2 sm:px-3 sm:text-sm transition ${
                tab === id
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'play' && (
          <PlayTab
            hasSave={hasSave}
            localSlot={localSlot}
            cloudSlot={cloudSlot}
            googleSignedIn={googleSignedIn}
            googleEmail={googleEmail}
            isGuest={isGuest}
            onContinue={onContinue}
            onNewGame={onNewGame}
            onOpenLibrary={onOpenLibrary}
          />
        )}
        {tab === 'profile' && <PlayerProfilePanel />}
        {tab === 'themes' && (
          <ThemesTab settings={settings} onSave={onSaveCosmetics} />
        )}
        {tab === 'shop' && <ShopTab settings={settings} />}

        <LegalLinks className="mt-2 pb-2" />
      </div>
    </div>
  );
}

function PlayTab({
  hasSave,
  localSlot,
  cloudSlot,
  googleSignedIn,
  googleEmail,
  isGuest,
  onContinue,
  onNewGame,
  onOpenLibrary,
}: {
  hasSave: boolean;
  localSlot: SaveSlotInfo | null;
  cloudSlot: SaveSlotInfo | null;
  googleSignedIn: boolean;
  googleEmail?: string;
  isGuest: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenLibrary?: () => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <MenuButton
        icon={<Play size={18} />}
        label="Continue Journey"
        onClick={onContinue}
        disabled={!hasSave}
        sublabel={!hasSave ? 'No save found' : undefined}
        primary
      />
      <MenuButton icon={<Swords size={18} />} label="Start New Game" onClick={onNewGame} />
      {onOpenLibrary && (
        <MenuButton icon={<Library size={18} />} label="GM Library" onClick={onOpenLibrary} />
      )}

      {hasSave && (localSlot || cloudSlot) && (
        <div className="sgm-home-active-save w-full rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
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

      <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
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
  );
}

function jumpToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useSectionSpy(ids: readonly string[]) {
  const [activeId, setActiveId] = useState(ids[0] ?? '');
  const key = ids.join('|');
  useEffect(() => {
    const list = key.split('|').filter(Boolean);
    const nodes = list
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => !!n);
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit?.target.id) setActiveId(hit.target.id);
      },
      { rootMargin: '-22% 0px -58% 0px', threshold: [0.12, 0.35, 0.6] },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [key]);
  return activeId;
}

function HubJumpNav({
  items,
  activeId,
  onJump,
}: {
  items: readonly { id: string; label: string }[];
  activeId: string;
  onJump: (id: string) => void;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map(({ id, label }) => {
        const on = activeId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onJump(id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
              on
                ? 'border-cyan-500/70 bg-cyan-950/60 text-cyan-100'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-700 hover:text-cyan-100'
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function ThemesTab({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => void;
}) {
  const [draftTheme, setDraftTheme] = useState(settings.uiThemeId || 'theme.integration-blue');
  const [draftFont, setDraftFont] = useState(settings.fontPackId || 'font.cold-registrar');
  const [draftDice, setDraftDice] = useState(settings.diceCosmeticId || 'dice.system-holo');
  const [draftVoice, setDraftVoice] = useState(settings.voicePackId || 'voice.cold-registrar');
  const [draftFrame, setDraftFrame] = useState(settings.turnFrameCosmeticId || 'frame.glitch-static');
  const [savedFlash, setSavedFlash] = useState(false);
  const [moreLooks, setMoreLooks] = useState(false);
  const [openSlot, setOpenSlot] = useState<'font' | 'dice' | 'voice' | 'frame' | null>(null);

  const selectedTheme = useMemo(() => themeBySettingsId(draftTheme), [draftTheme]);
  const fonts = useMemo(() => SHOP_CATALOG.filter((i) => i.slot === 'font'), []);
  const dice = useMemo(() => SHOP_CATALOG.filter((i) => i.slot === 'dice'), []);
  const voices = useMemo(() => SHOP_CATALOG.filter((i) => i.slot === 'voice'), []);
  const frames = useMemo(() => SHOP_CATALOG.filter((i) => i.slot === 'frame'), []);

  useEffect(() => {
    applyUiThemeToDocument(selectedTheme, {
      font: shopItemById(draftFont),
      dice: shopItemById(draftDice),
      frame: shopItemById(draftFrame),
    });
    return () => {
      applySettingsCosmetics(settings);
    };
  }, [selectedTheme, draftFont, draftDice, draftFrame, settings]);

  const applySet = (item: ShopItem) => {
    setDraftTheme(item.id);
    if (item.kit) {
      setDraftFont(item.kit.fontId);
      setDraftDice(item.kit.diceId);
      setDraftVoice(item.kit.voiceId);
      setDraftFrame(item.kit.frameId);
    }
  };

  const themeJumps = useMemo(() => {
    const items = [
      { id: 'themes-sets', label: 'Sets' },
      { id: 'themes-customize', label: 'Customize' },
    ];
    if (OTHER_THEME_ITEMS.length > 0) items.splice(1, 0, { id: 'themes-more', label: 'More' });
    return items;
  }, []);
  const themeJumpIds = useMemo(() => themeJumps.map((j) => j.id), [themeJumps]);
  const activeThemeJump = useSectionSpy(themeJumpIds);

  const handleSave = () => {
    onSave({
      uiThemeId: draftTheme,
      fontPackId: draftFont,
      diceCosmeticId: draftDice,
      voicePackId: draftVoice,
      turnFrameCosmeticId: draftFrame,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-8">
      <div className="sticky top-0 z-20 -mx-1 space-y-2 border-b border-slate-800 bg-slate-950/95 px-1 pb-2 backdrop-blur">
        <ThemePreviewBar
          theme={selectedTheme}
          fontId={draftFont}
          diceId={draftDice}
          voiceId={draftVoice}
          frameId={draftFrame}
        />
        <HubJumpNav items={themeJumps} activeId={activeThemeJump} onJump={jumpToSection} />
      </div>

      <Section id="themes-sets" title="Sets" blurb="Tap a tile. Only the equipped set opens." tallSticky>
        <div className="grid grid-cols-2 gap-2">
          {RACE_THEME_ITEMS.map((item) => {
            const selected = draftTheme === item.id;
            return (
              <div
                key={item.id}
                id={`theme-set-${item.id}`}
                className={`scroll-mt-40 ${selected ? 'col-span-2' : ''}`}
              >
                <SetCard
                  theme={item}
                  selected={selected}
                  owned={isOwned(item.id)}
                  compact
                  onClick={() => applySet(item)}
                />
              </div>
            );
          })}
        </div>
      </Section>

      {OTHER_THEME_ITEMS.length > 0 && (
        <div id="themes-more" className="scroll-mt-40">
          <button
            type="button"
            onClick={() => setMoreLooks((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            More looks
            {moreLooks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {moreLooks && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {OTHER_THEME_ITEMS.map((item) => (
                <SelectCard
                  key={item.id}
                  selected={draftTheme === item.id}
                  title={item.name}
                  subtitle={item.blurb}
                  owned={isOwned(item.id)}
                  onClick={() => setDraftTheme(item.id)}
                  themeItem={item}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Section id="themes-customize" title="Customize" blurb="Optional. Mix one slot after you pick a set." tallSticky>
        <div className="space-y-2">
          <CustomizeSlot
            label="Font"
            current={shopItemById(draftFont)?.name}
            open={openSlot === 'font'}
            onToggle={() => setOpenSlot(openSlot === 'font' ? null : 'font')}
          >
            {fonts.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftFont === item.id}
                title={item.name}
                subtitle={item.blurb}
                owned={isOwned(item.id)}
                onClick={() => setDraftFont(item.id)}
                fontSample={item}
              />
            ))}
          </CustomizeSlot>
          <CustomizeSlot
            label="Dice"
            current={shopItemById(draftDice)?.name}
            open={openSlot === 'dice'}
            onToggle={() => setOpenSlot(openSlot === 'dice' ? null : 'dice')}
          >
            {dice.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftDice === item.id}
                title={item.name}
                subtitle={item.blurb}
                owned={isOwned(item.id)}
                onClick={() => setDraftDice(item.id)}
                diceItem={item}
              />
            ))}
          </CustomizeSlot>
          <CustomizeSlot
            label="Voice"
            current={shopItemById(draftVoice)?.name}
            open={openSlot === 'voice'}
            onToggle={() => setOpenSlot(openSlot === 'voice' ? null : 'voice')}
          >
            {voices.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftVoice === item.id}
                title={item.name}
                subtitle={item.flavour ?? item.blurb}
                owned={isOwned(item.id)}
                onClick={() => {
                  setDraftVoice(item.id);
                  previewVoiceLine(item);
                }}
                voiceItem={item}
              />
            ))}
          </CustomizeSlot>
          <CustomizeSlot
            label="Turn frame"
            current={shopItemById(draftFrame)?.name}
            open={openSlot === 'frame'}
            onToggle={() => setOpenSlot(openSlot === 'frame' ? null : 'frame')}
          >
            {frames.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftFrame === item.id}
                title={item.name}
                subtitle={item.blurb}
                owned={isOwned(item.id)}
                onClick={() => setDraftFrame(item.id)}
                frameItem={item}
              />
            ))}
          </CustomizeSlot>
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-800 bg-slate-950/95 px-1 py-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-600/50 bg-cyan-950/50 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-900/50 transition"
        >
          <Check size={16} />
          {savedFlash ? 'Saved' : 'Save look'}
        </button>
      </div>
    </div>
  );
}

function ThemePreviewBar({
  theme,
  fontId,
  diceId,
  voiceId,
  frameId,
}: {
  theme: ShopItem;
  fontId: string;
  diceId: string;
  voiceId: string;
  frameId: string;
}) {
  const p = theme.preview;
  const font = shopItemById(fontId);
  const dice = shopItemById(diceId);
  const voice = shopItemById(voiceId);
  const frame = shopItemById(frameId);
  const texture = themeTextureOf(theme);
  const panelUrl = themePanelTextureUrl(theme.themeKey);
  return (
    <div
      className={`sgm-set-card sgm-theme-preview sgm-tex-${texture} overflow-hidden rounded-xl border shadow-lg${
        theme.free ? ' sgm-set-card-free' : ' sgm-set-card-active'
      }`}
      data-sgm-frame={frame?.frameSkin?.style ?? 'plain'}
      style={{
        borderColor: p?.accent ?? '#334155',
        color: p?.text ?? '#e2e8f0',
        ['--sgm-chip-accent' as string]: p?.accent ?? '#22d3ee',
        ['--sgm-chip-bg' as string]: p?.bg ?? '#020617',
        ['--sgm-chip-panel' as string]: p?.panel ?? '#0f172a',
        ...(panelUrl ? { ['--sgm-panel-texture' as string]: `url('${panelUrl}')` } : {}),
      }}
    >
      <div className="h-1.5 w-full" style={{ background: p?.accent ?? '#22d3ee' }} />
      <div className="flex items-center gap-3 px-3 py-2.5">
        <ThemeChip item={theme} size={36} />
        {dice ? <DicePreview item={dice} size={32} /> : null}
        {frame ? <FrameChip item={frame} /> : null}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {theme.name}
          </div>
          <p
            className="truncate text-sm leading-snug"
            style={{ fontFamily: font?.preview?.fontStory ?? p?.fontStory ?? 'Georgia, serif' }}
          >
            The tale opens here.
          </p>
          <div className="mt-0.5 truncate text-[10px] text-slate-500">
            {[font?.name, dice?.name, voice?.name, frame?.name].filter(Boolean).join(' · ')}
          </div>
        </div>
        {voice ? (
          <button
            type="button"
            onClick={() => previewVoiceLine(voice)}
            className="shrink-0 rounded-md border border-white/10 bg-black/30 p-1.5 text-slate-300 hover:text-white"
            title="Hear voice"
          >
            <Volume2 size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

const SHOP_JUMPS = [
  { id: 'shop-packs', label: 'Packs' },
  { id: 'shop-sets', label: 'Sets' },
  { id: 'shop-bundles', label: 'Bundles' },
  { id: 'shop-extras', label: 'Extras' },
] as const;

function ShopTab({ settings }: { settings: Settings }) {
  const [packNote, setPackNote] = useState<string | null>(null);
  const [openSetId, setOpenSetId] = useState<string | null>(null);
  const [openExtra, setOpenExtra] = useState<CosmeticSlot | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingBuy, setPendingBuy] = useState<null | (() => void)>(null);
  const activeShopJump = useSectionSpy(SHOP_JUMPS.map((j) => j.id));

  const requestBuy = (label: string) => {
    requestParentPurchaseApproval({
      contentMode: settings.contentMode,
      contentPin: settings.contentPin,
      openGate: () => {
        setPendingBuy(() => () => {
          setPackNote(`${label} — parent approved (payments not live yet).`);
          window.setTimeout(() => setPackNote(null), 4000);
        });
        setGateOpen(true);
      },
      action: () => {
        setPackNote(`${label} — parent approved (payments not live yet).`);
        window.setTimeout(() => setPackNote(null), 4000);
      },
    });
  };

  const featuredSet = useMemo(
    () => RACE_THEME_ITEMS.find((item) => !item.free) ?? RACE_THEME_ITEMS[0],
    [],
  );

  const bundles = useMemo(
    () => SHOP_CATALOG.filter((item) => item.slot === 'bundle'),
    [],
  );

  const extras = useMemo(() => {
    const order: CosmeticSlot[] = [
      'theme',
      'font',
      'dice',
      'voice',
      'frame',
      'systemWindow',
      'sfx',
      'badge',
    ];
    return order
      .map((slot) => ({
        slot,
        items: SHOP_CATALOG.filter((item) => {
          if (item.slot !== slot) return false;
          if (item.kit) return false;
          if (isRaceKitPart(item.id)) return false;
          return true;
        }),
      }))
      .filter((row) => row.items.length > 0);
  }, []);

  const openFeatured = () => {
    if (!featuredSet) return;
    setOpenSetId(featuredSet.id);
    window.requestAnimationFrame(() => jumpToSection(`shop-set-${featuredSet.id}`));
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <ParentPurchaseGate
        contentMode={settings.contentMode}
        contentPin={settings.contentPin}
        verifyPin={(pin) => !!settings.contentPin && pin === settings.contentPin}
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setPendingBuy(null);
        }}
        onApproved={() => {
          pendingBuy?.();
          setPendingBuy(null);
        }}
      />

      <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-center text-xs text-amber-200/90">
        Merchant preview — payments not live. All items unlocked for this test account.
        Active theme: {themeBySettingsId(settings.uiThemeId).name}
        {settings.contentMode === 'kid' ? ' · Purchases need parent PIN' : ''}
      </div>

      {packNote && (
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-center text-xs text-emerald-200">
          {packNote}
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-1 border-b border-slate-800 bg-slate-950/95 px-1 py-2 backdrop-blur">
        <HubJumpNav
          items={SHOP_JUMPS}
          activeId={activeShopJump}
          onJump={jumpToSection}
        />
      </div>

      {featuredSet && (
        <FeaturedSetBanner
          theme={featuredSet}
          owned={isOwned(featuredSet.id)}
          onOpen={openFeatured}
        />
      )}

      <div id="shop-packs" className="scroll-mt-14">
        <CapacityPackShop
          onGranted={setPackNote}
          contentMode={settings.contentMode}
          contentPin={settings.contentPin}
          verifyPin={(pin) => !!settings.contentPin && pin === settings.contentPin}
        />
      </div>

      <Section
        id="shop-sets"
        title="Theme sets"
        blurb="Race and archetype kits. Tap a tile — only one kit opens."
      >
        <div className="grid grid-cols-2 gap-2">
          {RACE_THEME_ITEMS.map((item) => {
            const expanded = openSetId === item.id;
            return (
              <div
                key={item.id}
                id={`shop-set-${item.id}`}
                className={`scroll-mt-16 ${expanded ? 'col-span-2' : ''}`}
              >
                <SetCard
                  theme={item}
                  selected={false}
                  owned={isOwned(item.id)}
                  shop
                  compact
                  expanded={expanded}
                  onClick={() => setOpenSetId((id) => (id === item.id ? null : item.id))}
                  onBuy={() => requestBuy(item.name)}
                />
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="shop-bundles"
        title="Bundles"
        blurb="Multi-theme packs at a set price — Ancestry Sampler, Integration Starter, Ledger Scholar."
      >
        <div className="grid grid-cols-2 gap-2">
          {bundles.map((item) => (
            <ShopCard key={item.id} item={item} onBuy={() => requestBuy(item.name)} />
          ))}
        </div>
      </Section>

      <Section
        id="shop-extras"
        title="Mix extras"
        blurb="Leftover fonts, dice, voices, frames, and other slots that are not inside a race kit."
      >
        <div className="space-y-2">
          {extras.map(({ slot, items }) => (
            <CustomizeSlot
              key={slot}
              label={SLOT_LABELS[slot]}
              current={`${items.length}`}
              open={openExtra === slot}
              onToggle={() => setOpenExtra(openExtra === slot ? null : slot)}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((item) => (
                  <ShopCard key={item.id} item={item} onBuy={() => requestBuy(item.name)} />
                ))}
              </div>
            </CustomizeSlot>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SetStatusPill({
  owned,
  selected,
  shop,
  free,
}: {
  owned: boolean;
  selected?: boolean;
  shop?: boolean;
  free?: boolean;
}) {
  const label = shop
    ? owned
      ? free
        ? 'Included'
        : 'Owned'
      : 'Shop'
    : selected
      ? 'Equipped'
      : owned
        ? 'Owned'
        : 'Locked';
  const tone = shop
    ? owned
      ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-300'
      : 'border-slate-600 bg-slate-800 text-slate-300'
    : selected
      ? 'border-cyan-700/50 bg-cyan-950/50 text-cyan-200'
      : owned
        ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-300'
        : 'border-slate-700 bg-slate-900 text-slate-500';
  return (
    <span className={`sgm-set-badge shrink-0 border px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function FeaturedSetBanner({
  theme,
  owned,
  onOpen,
}: {
  theme: ShopItem;
  owned: boolean;
  onOpen: () => void;
}) {
  const p = theme.preview;
  const texture = themeTextureOf(theme);
  const panelUrl = themePanelTextureUrl(theme.themeKey);
  const dice = themeKitItems(theme).find((row) => row.item.slot === 'dice')?.item;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`sgm-set-card sgm-theme-preview sgm-tex-${texture} w-full overflow-hidden rounded-xl border text-left${
        theme.free ? ' sgm-set-card-free' : ' sgm-set-card-active'
      }`}
      style={
        p
          ? {
              borderColor: `${p.accent}88`,
              ['--sgm-chip-accent' as string]: p.accent,
              ['--sgm-chip-bg' as string]: p.bg,
              ['--sgm-chip-panel' as string]: p.panel,
              ...(panelUrl ? { ['--sgm-panel-texture' as string]: `url('${panelUrl}')` } : {}),
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90">
        <span>Featured set</span>
        <span>{owned ? (theme.free ? 'Included' : 'Owned') : `${theme.priceGbp} · ${theme.priceUsd}`}</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {p && <ThemeChip item={theme} size={40} />}
        {dice && <DicePreview item={dice} size={32} />}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-100">{theme.name}</div>
          <p className="truncate text-[11px] text-slate-400">{theme.blurb}</p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-cyan-200">
          {owned ? 'View kit' : 'See kit'}
        </span>
      </div>
    </button>
  );
}

function ShopCard({ item, onBuy }: { item: ShopItem; onBuy?: () => void }) {
  const owned = isOwned(item.id);
  const texture = themeTextureOf(item);
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-3${
        item.preview ? ` sgm-theme-preview sgm-tex-${texture}` : ''
      }`}
      style={
        item.preview
          ? {
              borderColor: `${item.preview.accent}55`,
              ['--sgm-chip-accent' as string]: item.preview.accent,
              ['--sgm-chip-bg' as string]: item.preview.bg,
              ['--sgm-chip-panel' as string]: item.preview.panel,
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-100">{item.name}</div>
          {item.slot === 'font' ? (
            <FontDescriptionBox item={item} blurb={item.blurb} />
          ) : item.slot === 'voice' ? (
            <VoiceFlavour item={item} />
          ) : (
            <div className="mt-1 text-[11px] leading-snug text-slate-400">{item.blurb}</div>
          )}
        </div>
        {item.slot === 'dice' ? (
          <DicePreview item={item} />
        ) : item.slot === 'frame' ? (
          <FrameChip item={item} />
        ) : item.slot === 'theme' && item.preview ? (
          <ThemeChip item={item} size={32} />
        ) : item.preview?.accent ? (
          <ThemeChip item={item} size={32} />
        ) : null}
      </div>
      {item.includes && (
        <div className="mt-2 text-[10px] text-slate-500">
          Includes: {item.includes.map((id) => shopItemById(id)?.name ?? id).join(' · ')}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-cyan-300">
            {item.free ? 'Free' : `${item.priceGbp} · ${item.priceUsd}`}
          </div>
          {item.slot === 'voice' && <HearButton item={item} />}
        </div>
        <button
          type="button"
          disabled={owned}
          onClick={() => {
            if (owned || item.free) return;
            onBuy?.();
          }}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            owned
              ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-300 cursor-default'
              : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-cyan-600'
          }`}
        >
          {owned ? (item.free ? 'Included' : 'Owned') : 'Buy (soon)'}
        </button>
      </div>
    </div>
  );
}

function storyFontFamily(item: ShopItem): string | undefined {
  return item.preview?.fontStory ?? item.preview?.fontUi;
}

function FontDescriptionBox({ item, blurb }: { item: ShopItem; blurb: string }) {
  const family = storyFontFamily(item);
  return (
    <div
      className="mt-1.5 rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-[14px] leading-snug text-slate-200"
      style={family ? { fontFamily: family } : undefined}
    >
      <p>{blurb}</p>
      <p className="mt-1 text-[13px] text-slate-300">The tale opens here.</p>
    </div>
  );
}

function ThemeChip({ item, size = 32 }: { item: ShopItem; size?: number }) {
  const p = item.preview;
  const texture = themeTextureOf(item);
  const panelUrl = themePanelTextureUrl(item.themeKey);
  return (
    <span
      className={`sgm-theme-chip sgm-tex-${texture}${item.free ? ' sgm-theme-chip-free' : ''}${
        panelUrl ? ' sgm-theme-chip-material' : ''
      }`}
      style={{
        width: size,
        height: size,
        ['--sgm-chip-accent' as string]: p?.accent ?? '#22d3ee',
        ['--sgm-chip-bg' as string]: p?.bg ?? '#020617',
        ['--sgm-chip-panel' as string]: p?.panel ?? '#0f172a',
        ...(panelUrl ? { ['--sgm-panel-texture' as string]: `url('${panelUrl}')` } : {}),
      }}
      aria-hidden
    />
  );
}

function FrameChip({ item }: { item: ShopItem }) {
  return (
    <span
      className="sgm-frame-chip"
      data-sgm-frame={item.frameSkin?.style ?? 'plain'}
      title={item.name}
      aria-hidden
    />
  );
}

function VoiceFlavour({ item }: { item: ShopItem }) {
  return (
    <div className="mt-1 text-[11px] leading-snug text-slate-400">
      <p>{item.blurb}</p>
      {item.flavour && (
        <p className="mt-1 italic text-slate-300">“{item.flavour}”</p>
      )}
    </div>
  );
}

function HearButton({ item }: { item: ShopItem }) {
  return (
    <button
      type="button"
      onClick={() => previewVoiceLine(item)}
      className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-cyan-600"
    >
      <Volume2 size={12} />
      Hear
    </button>
  );
}

function CustomizeSlot({
  label,
  current,
  open,
  onToggle,
  children,
}: {
  label: string;
  current?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{current ?? '—'}</span>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      {open && <div className="grid gap-2 border-t border-slate-800 p-2">{children}</div>}
    </div>
  );
}

function SetCard({
  theme,
  selected,
  owned,
  onClick,
  onBuy,
  shop,
  compact,
  expanded,
}: {
  theme: ShopItem;
  selected: boolean;
  owned: boolean;
  onClick?: () => void;
  onBuy?: () => void;
  shop?: boolean;
  compact?: boolean;
  expanded?: boolean;
}) {
  const parts = themeKitItems(theme);
  const p = theme.preview;
  const dicePart = parts.find((row) => row.item.slot === 'dice')?.item;
  const showParts = shop ? !!expanded : !compact || selected;
  const highlight = shop ? !!expanded : selected;
  const tile = compact && !showParts;

  const header = (
    <div className={`flex items-center ${tile ? 'gap-2' : 'gap-3'}`}>
      {p && <ThemeChip item={theme} size={tile ? 28 : 32} />}
      {dicePart && <DicePreview item={dicePart} size={tile ? 24 : 28} />}
      <div className="min-w-0 flex-1">
        <div className={`font-semibold text-slate-100 ${tile ? 'truncate text-[13px]' : 'text-sm'}`}>
          {theme.name}
        </div>
        {tile ? (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {shop && !theme.free && (
              <span className="text-[10px] text-cyan-300">{theme.priceGbp}</span>
            )}
            <SetStatusPill owned={owned} selected={selected} shop={shop} free={theme.free} />
          </div>
        ) : (
          (shop ? showParts : !compact) && (
            <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{theme.blurb}</div>
          )
        )}
      </div>
      {selected && !shop && !tile && <Check size={16} className="shrink-0 text-cyan-400" />}
      {shop &&
        (expanded ? (
          <ChevronUp size={16} className="shrink-0 text-slate-500" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-500" />
        ))}
    </div>
  );

  const kitParts = showParts ? (
    <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
      {parts.map(({ label, item }) => (
        <div key={item.id} className="flex items-start gap-2">
          {item.slot === 'dice' ? (
            <DicePreview item={item} size={28} />
          ) : (
            <span className="w-10 shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {item.slot !== 'dice' && (
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            )}
            <div className="text-xs font-medium text-slate-200">
              {item.slot === 'dice' ? `${label} · ${item.name}` : item.name}
            </div>
            {item.slot === 'font' && <FontDescriptionBox item={item} blurb={item.blurb} />}
            {item.slot === 'voice' && (
              <div>
                <VoiceFlavour item={item} />
                {shop && (
                  <div className="mt-1">
                    <HearButton item={item} />
                  </div>
                )}
              </div>
            )}
            {item.slot === 'frame' && (
              <div className="mt-1">
                <FrameChip item={item} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const priceRow = shop || showParts ? (
    <div className={`flex items-center justify-between gap-2 ${showParts ? 'mt-3 border-t border-white/5 pt-2' : 'mt-2'}`}>
      <div className="text-xs text-cyan-300">
        {theme.free
          ? 'Free set'
          : showParts
            ? `Set bundle ${theme.priceGbp} · ${theme.priceUsd}`
            : `${theme.priceGbp} · ${theme.priceUsd}`}
        {showParts && (
          <span className="ml-1 text-slate-500">— theme, font, dice, voice, and frame</span>
        )}
      </div>
      {shop && (
        owned || theme.free ? (
          <span className="shrink-0 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300">
            {theme.free ? 'Included' : 'Owned'}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuy?.();
            }}
            className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-600"
          >
            Buy (soon)
          </button>
        )
      )}
    </div>
  ) : null;

  const texture = themeTextureOf(theme);
  const panelUrl = themePanelTextureUrl(theme.themeKey);
  const style = p
    ? {
        borderColor: highlight ? `${p.accent}99` : `${p.accent}44`,
        ['--sgm-chip-accent' as string]: p.accent,
        ['--sgm-chip-bg' as string]: p.bg,
        ['--sgm-chip-panel' as string]: p.panel,
        ...(panelUrl ? { ['--sgm-panel-texture' as string]: `url('${panelUrl}')` } : {}),
      }
    : undefined;
  const cardClass = `sgm-set-card sgm-theme-preview sgm-tex-${texture} rounded-xl border ${
    tile ? 'p-2.5' : 'p-3'
  }${theme.free ? ' sgm-set-card-free' : ''}${highlight ? ' sgm-set-card-active' : ''}`;

  if (shop) {
    return (
      <div className={cardClass} style={style}>
        <button type="button" onClick={onClick} className="w-full text-left">
          {header}
          {priceRow}
        </button>
        {kitParts}
      </div>
    );
  }

  const inner = (
    <>
      {header}
      {kitParts}
      {priceRow}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!owned}
        className={`sgm-set-card sgm-theme-preview sgm-tex-${texture} w-full rounded-xl border ${
          tile ? 'p-2.5' : 'p-3'
        } text-left transition ${theme.free ? ' sgm-set-card-free' : ''}${
          selected ? ' sgm-set-card-active' : ''
        } ${!owned ? 'cursor-not-allowed opacity-40' : 'hover:border-slate-500'}`}
        style={style}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={`sgm-set-card sgm-theme-preview sgm-tex-${texture} rounded-xl border p-3${theme.free ? ' sgm-set-card-free' : ''}`} style={style}>
      {inner}
    </div>
  );
}

function Section({
  id,
  title,
  blurb,
  children,
  tallSticky,
}: {
  id?: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
  tallSticky?: boolean;
}) {
  return (
    <section id={id} className={`w-full ${tallSticky ? 'scroll-mt-40' : 'scroll-mt-14'}`}>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h2>
      {blurb && <p className="mb-3 text-[11px] leading-snug text-slate-500">{blurb}</p>}
      {children}
    </section>
  );
}

function SelectCard({
  selected,
  title,
  subtitle,
  swatch,
  owned,
  onClick,
  fontSample,
  diceItem,
  themeItem,
  frameItem,
  voiceItem,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  swatch?: string;
  owned: boolean;
  onClick: () => void;
  fontSample?: ShopItem;
  diceItem?: ShopItem;
  themeItem?: ShopItem;
  frameItem?: ShopItem;
  voiceItem?: ShopItem;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!owned}
      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? 'border-cyan-500/60 bg-cyan-950/30'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
      } ${!owned ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {diceItem ? (
        <DicePreview item={diceItem} />
      ) : themeItem ? (
        <ThemeChip item={themeItem} size={28} />
      ) : frameItem ? (
        <FrameChip item={frameItem} />
      ) : swatch ? (
        <span className="mt-0.5 h-7 w-7 shrink-0 rounded-md border border-white/10" style={{ background: swatch }} />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-100">{title}</span>
        {fontSample ? (
          <FontDescriptionBox item={fontSample} blurb={subtitle} />
        ) : (
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{subtitle}</span>
        )}
      </span>
      {selected && <Check size={16} className="mt-0.5 shrink-0 text-cyan-400" />}
    </button>
  );
}

function BackgroundFx() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <img
        src="/backgrounds/bg-landscape.png"
        alt=""
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0)_0%,_rgba(2,6,23,0.8)_70%)]" />
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  primary,
  disabled,
  sublabel,
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
      type="button"
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
      {sublabel ? <span className="text-xs text-slate-600">{sublabel}</span> : null}
    </button>
  );
}
