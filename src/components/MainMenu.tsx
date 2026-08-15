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
} from '@/game/cosmeticCatalog';
import { ensureTestCosmeticUnlock, isOwned } from '@/game/cosmeticEntitlements';
import { applySettingsCosmetics, applyUiThemeToDocument, themeBySettingsId } from '@/game/uiTheme';

type HubTab = 'play' | 'themes' | 'shop';

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

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-8"
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

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-6 pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/assets/images/1785421156244~2 copy.png"
            alt="SYNAPTIC DUNGEON MASTER"
            className="w-full max-w-[220px] h-auto object-contain drop-shadow-[0_0_20px_rgba(220,38,38,0.35)] filter brightness-110"
          />
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--sgm-text, #f1f5f9)' }}>
            SYNAPTIC DUNGEON MASTER
          </h1>
          <p className="text-sm" style={{ color: 'var(--sgm-muted, #64748b)' }}>
            A dark fantasy world awaits your decisions.
          </p>
        </div>

        <div className="flex w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/70 p-1">
          {(
            [
              ['play', 'Play', Play],
              ['themes', 'Themes', Palette],
              ['shop', 'Shop', Store],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
        {tab === 'themes' && (
          <ThemesTab settings={settings} onSave={onSaveCosmetics} />
        )}
        {tab === 'shop' && <ShopTab settings={settings} />}
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

  const selectedTheme = useMemo(() => themeBySettingsId(draftTheme), [draftTheme]);

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

  const fonts = SHOP_CATALOG.filter((i) => i.slot === 'font' && !isRaceKitPart(i.id));
  const dice = SHOP_CATALOG.filter((i) => i.slot === 'dice' && !isRaceKitPart(i.id));
  const voices = SHOP_CATALOG.filter((i) => i.slot === 'voice' && !isRaceKitPart(i.id));
  const frames = SHOP_CATALOG.filter((i) => i.slot === 'frame' && !isRaceKitPart(i.id));

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
      <p className="text-center text-xs text-slate-500">
        Race themes include a matching font, dice skin, narrator voice, and turn frame. Preview updates as you select — tap Save to keep. You can still override font, dice, voice, or frame after.
      </p>

      <ThemePreviewCard theme={selectedTheme} frameId={draftFrame} diceId={draftDice} voiceId={draftVoice} fontId={draftFont} />

      <Section title="Race style sets">
        <div className="grid gap-3">
          {RACE_THEME_ITEMS.map((item) => (
            <SetCard
              key={item.id}
              theme={item}
              selected={draftTheme === item.id}
              owned={isOwned(item.id)}
              onClick={() => {
                setDraftTheme(item.id);
                if (item.kit) {
                  setDraftFont(item.kit.fontId);
                  setDraftDice(item.kit.diceId);
                  setDraftVoice(item.kit.voiceId);
                  setDraftFrame(item.kit.frameId);
                }
              }}
            />
          ))}
        </div>
      </Section>

      {OTHER_THEME_ITEMS.length > 0 && (
        <Section title="Other UI themes">
          <div className="grid gap-2 sm:grid-cols-2">
            {OTHER_THEME_ITEMS.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftTheme === item.id}
                title={item.name}
                subtitle={item.blurb}
                swatch={item.preview?.accent}
                owned={isOwned(item.id)}
                onClick={() => setDraftTheme(item.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {fonts.length > 0 && (
        <Section title="Extra font packs">
          <div className="grid gap-2 sm:grid-cols-2">
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
          </div>
        </Section>
      )}

      {dice.length > 0 && (
        <Section title="Extra dice skins">
          <div className="grid gap-2 sm:grid-cols-2">
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
          </div>
        </Section>
      )}

      {voices.length > 0 && (
        <Section title="Extra narrator voices">
          <div className="grid gap-2 sm:grid-cols-2">
            {voices.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftVoice === item.id}
                title={item.name}
                subtitle={item.blurb}
                owned={isOwned(item.id)}
                onClick={() => setDraftVoice(item.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {frames.length > 0 && (
        <Section title="Extra turn frames">
          <div className="grid gap-2 sm:grid-cols-2">
            {frames.map((item) => (
              <SelectCard
                key={item.id}
                selected={draftFrame === item.id}
                title={item.name}
                subtitle={item.blurb}
                owned={isOwned(item.id)}
                onClick={() => setDraftFrame(item.id)}
              />
            ))}
          </div>
        </Section>
      )}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-800 bg-slate-950/95 px-1 py-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-600/50 bg-cyan-950/50 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-900/50 transition"
        >
          <Check size={16} />
          {savedFlash ? 'Saved' : 'Save theme settings'}
        </button>
      </div>
    </div>
  );
}

function ThemePreviewCard({
  theme,
  frameId,
  diceId,
  voiceId,
  fontId,
}: {
  theme: ShopItem;
  frameId: string;
  diceId: string;
  voiceId: string;
  fontId: string;
}) {
  const p = theme.preview;
  const frame = shopItemById(frameId);
  const dice = shopItemById(diceId);
  const voice = shopItemById(voiceId);
  const font = shopItemById(fontId);
  return (
    <div
      className="sgm-turn-frame overflow-hidden rounded-xl border shadow-lg"
      style={{
        borderColor: p?.accent ?? '#334155',
        background: p?.bg ?? '#020617',
        color: p?.text ?? '#e2e8f0',
        fontFamily: p?.fontStory ?? 'Georgia, serif',
      }}
    >
      <div
        className="border-b px-4 py-2 text-[10px] font-sans uppercase tracking-[0.2em]"
        style={{
          borderColor: `${p?.accent ?? '#22d3ee'}55`,
          background: p?.panel ?? '#0f172a',
          color: p?.accent ?? '#22d3ee',
          fontFamily: p?.fontUi ?? 'system-ui',
        }}
      >
        System · Preview
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed">
          Rain needles the Integration street. The registrar pane hangs in the air — cold, blue, waiting for your next input.
        </p>
        <div
          className="rounded-lg border px-3 py-2 text-xs font-sans"
          style={{
            borderColor: `${p?.accent ?? '#22d3ee'}66`,
            background: p?.panel ?? '#0f172a',
            color: p?.muted ?? '#94a3b8',
            fontFamily: p?.fontUi,
          }}
        >
          <div style={{ color: p?.accent }}>SYSTEM NOTICE</div>
          <div className="mt-1">Registration complete. Theme: {theme.name}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-sans uppercase tracking-wide" style={{ color: p?.muted }}>
          <span className="rounded border px-2 py-1" style={{ borderColor: `${p?.accent}44` }}>
            Frame: {frame?.name ?? '—'}
          </span>
          <span className="rounded border px-2 py-1" style={{ borderColor: `${p?.accent}44` }}>
            Font: {font?.name ?? 'Theme default'}
          </span>
          <span className="rounded border px-2 py-1" style={{ borderColor: `${p?.accent}44` }}>
            Dice: {dice?.name ?? '—'}
          </span>
          <span className="rounded border px-2 py-1" style={{ borderColor: `${p?.accent}44` }}>
            Voice: {voice?.name ?? '—'}
          </span>
        </div>
        <div className="flex gap-2">
          {['Look around', 'Ask the System', 'Move on'].map((c) => (
            <span
              key={c}
              className="rounded-md border px-2 py-1 text-[11px] font-sans"
              style={{ borderColor: `${p?.accent}55`, color: p?.text }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShopTab({ settings }: { settings: Settings }) {
  const extras = useMemo(() => {
    const order: CosmeticSlot[] = [
      'bundle',
      'theme',
      'font',
      'dice',
      'voice',
      'frame',
      'systemWindow',
      'sfx',
      'badge',
    ];
    return order.map((slot) => ({
      slot,
      items: SHOP_CATALOG.filter((item) => {
        if (item.slot !== slot) return false;
        if (item.kit) return false;
        if (isRaceKitPart(item.id)) return false;
        return true;
      }),
    }));
  }, []);

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-center text-xs text-amber-200/90">
        Merchant preview — payments not live. All items unlocked for this test account.
        Active theme: {themeBySettingsId(settings.uiThemeId).name}
      </div>

      <Section title="Race style sets">
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Each set is one theme plus its matching font, dice, voice, and turn frame. Buy the set as a bundle.
        </p>
        <div className="grid gap-3">
          {RACE_THEME_ITEMS.map((item) => (
            <SetCard key={item.id} theme={item} selected={false} owned={isOwned(item.id)} shop />
          ))}
        </div>
      </Section>

      {extras.map(({ slot, items }) =>
        items.length ? (
          <Section key={slot} title={SLOT_LABELS[slot]}>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <ShopCard key={item.id} item={item} />
              ))}
            </div>
          </Section>
        ) : null
      )}
    </div>
  );
}

function ShopCard({ item }: { item: ShopItem }) {
  const owned = isOwned(item.id);
  return (
    <div
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
      style={
        item.preview
          ? {
              borderColor: `${item.preview.accent}55`,
              background: `linear-gradient(145deg, ${item.preview.panel}cc, #020617aa)`,
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-100">{item.name}</div>
          <div className="mt-1 text-[11px] leading-snug text-slate-400">{item.blurb}</div>
          {item.slot === 'font' && <FontSample item={item} />}
        </div>
        {item.slot === 'dice' ? (
          <DicePreview item={item} />
        ) : item.preview?.accent ? (
          <span
            className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-white/10"
            style={{ background: item.preview.accent }}
            title="Accent"
          />
        ) : null}
      </div>
      {item.includes && (
        <div className="mt-2 text-[10px] text-slate-500">
          Includes: {item.includes.map((id) => shopItemById(id)?.name ?? id).join(' · ')}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-cyan-300">
          {item.free ? 'Free' : `${item.priceGbp} · ${item.priceUsd}`}
        </div>
        <button
          type="button"
          disabled={owned}
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

function FontSample({ item }: { item: ShopItem }) {
  const family = item.preview?.fontStory ?? item.preview?.fontUi;
  if (!family) return null;
  return (
    <p className="mt-1.5 text-[13px] leading-snug text-slate-200" style={{ fontFamily: family }}>
      The tale opens here.
    </p>
  );
}

function DicePreview({ item, size = 36 }: { item: ShopItem; size?: number }) {
  const accent = item.diceSkin?.accent ?? item.preview?.accent ?? '#94a3b8';
  const face = item.diceSkin?.face ?? item.preview?.panel ?? '#1e293b';
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden
    >
      <polygon
        points="16,2 28,10 28,22 16,30 4,22 4,10"
        fill={face}
        stroke={accent}
        strokeWidth="1.6"
      />
      <circle cx="16" cy="15" r="3.2" fill={accent} />
      <text x="16" y="25" textAnchor="middle" fill={accent} fontSize="6" fontWeight="700">
        d20
      </text>
    </svg>
  );
}

function SetCard({
  theme,
  selected,
  owned,
  onClick,
  shop,
}: {
  theme: ShopItem;
  selected: boolean;
  owned: boolean;
  onClick?: () => void;
  shop?: boolean;
}) {
  const parts = themeKitItems(theme);
  const p = theme.preview;
  const inner = (
    <>
      <div className="flex items-start gap-3">
        {p?.accent && (
          <span
            className="mt-0.5 h-8 w-8 shrink-0 rounded-md border border-white/10"
            style={{ background: p.accent }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-100">{theme.name}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{theme.blurb}</div>
        </div>
        {selected && <Check size={16} className="mt-0.5 shrink-0 text-cyan-400" />}
      </div>
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
              {item.slot === 'font' && <FontSample item={item} />}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-white/5 pt-2 text-xs text-cyan-300">
        {theme.free ? 'Free set' : `Set bundle ${theme.priceGbp} · ${theme.priceUsd}`}
        <span className="ml-1 text-slate-500">— theme, font, dice, voice, and frame</span>
      </div>
      {shop && (
        <div className="mt-2 text-right">
          <span className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300">
            {owned ? (theme.free ? 'Included' : 'Owned') : 'Buy (soon)'}
          </span>
        </div>
      )}
    </>
  );

  const style = p
    ? {
        borderColor: selected ? `${p.accent}99` : `${p.accent}44`,
        background: `linear-gradient(145deg, ${p.panel}cc, #020617aa)`,
      }
    : undefined;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!owned}
        className={`w-full rounded-xl border p-3 text-left transition ${
          selected ? 'ring-1 ring-cyan-400/40' : ''
        } ${!owned ? 'cursor-not-allowed opacity-40' : 'hover:border-slate-500'}`}
        style={style}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="rounded-xl border p-3" style={style}>
      {inner}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h2>
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
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  swatch?: string;
  owned: boolean;
  onClick: () => void;
  fontSample?: ShopItem;
  diceItem?: ShopItem;
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
      ) : swatch ? (
        <span className="mt-0.5 h-7 w-7 shrink-0 rounded-md border border-white/10" style={{ background: swatch }} />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-100">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{subtitle}</span>
        {fontSample && <FontSample item={fontSample} />}
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
