import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, Item, Rarity, Settings, AttributeKey } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import { CharacterSheetView } from './CharacterSheetView';
import { UploadImport } from './UploadImport';
import { CharacterProgression } from './CharacterProgression';
import { CombatEncounter } from './CombatEncounter';
import {
  X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  HardHat, Shield, Shirt, Sword, Footprints,
  Sparkles, Hammer, Cat, Trophy, ScrollText, Camera, TrendingUp,
  Heart, Droplet, Zap, Users, Backpack, Loader2, UserRound,
} from 'lucide-react';
import { getItemsInContainer } from '@/game/inventory';
import { findEquippedInSlot, type DisplayEquipSlot } from '@/game/wornGear';
import { itemIconPrompt, paperDollPrompt, portraitCacheKey, type InventoryArtPatch } from '@/game/inventoryArt';
import type { ImagePromptKind } from '@/game/comicImagePrompt';

type BottomTab = 'character' | 'inventory' | 'spells' | 'professions' | 'pets' | 'titles' | 'dnd' | 'sheet' | 'portrait' | 'progression' | 'combat';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  settings: Settings;
  initialTab?: BottomTab;
  onGenerateArt?: (prompt: string, kind: Extract<ImagePromptKind, 'item-icon' | 'character-portrait'>) => Promise<string | null>;
  onCommitArt?: (patch: InventoryArtPatch) => void;
}

function LegsIcon({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 3h8l1 7-3 11h-4L7 10 8 3z" />
      <path d="M12 10v11" />
    </svg>
  );
}

type EquipSlotKey = 'Head' | 'Shoulders' | 'Chest' | 'Main Hand' | 'Off Hand' | 'Legs' | 'Feet';

const SLOT_META: Record<EquipSlotKey, { icon: React.ReactNode; label: string }> = {
  Head: { icon: <HardHat size={22} />, label: 'Head' },
  Shoulders: { icon: <Shield size={22} />, label: 'Shoulders' },
  Chest: { icon: <Shirt size={22} />, label: 'Chest' },
  'Main Hand': { icon: <Sword size={22} />, label: 'Main Hand' },
  'Off Hand': { icon: <Shield size={22} />, label: 'Off Hand' },
  Legs: { icon: <LegsIcon />, label: 'Legs' },
  Feet: { icon: <Footprints size={22} />, label: 'Feet' },
};

const SLOT_ORDER: EquipSlotKey[] = ['Head', 'Shoulders', 'Chest', 'Main Hand', 'Off Hand', 'Legs', 'Feet'];
const LEFT_SLOTS: EquipSlotKey[] = ['Head', 'Chest', 'Legs', 'Feet'];
const RIGHT_SLOTS: EquipSlotKey[] = ['Shoulders', 'Main Hand', 'Off Hand'];

const RARITY_GLOW: Record<Rarity, string> = {
  Common: 'border-slate-600',
  Uncommon: 'border-emerald-600',
  Rare: 'border-blue-600',
  Epic: 'border-purple-600',
  Legendary: 'border-amber-600',
};

const RARITY_BG: Record<Rarity, string> = {
  Common: 'bg-slate-800/60',
  Uncommon: 'bg-emerald-950/40',
  Rare: 'bg-blue-950/40',
  Epic: 'bg-purple-950/40',
  Legendary: 'bg-amber-950/40',
};

function getEquippedItem(state: GameState, slot: EquipSlotKey): Item | undefined {
  return findEquippedInSlot(state.inventory, slot as DisplayEquipSlot);
}

function StatBar({ label, current, max, color, icon }: { label: string; current: number; max: number; color: string; icon: React.ReactNode }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1 text-slate-300 font-medium">
          {icon}
          {label}
        </span>
        <span className="font-mono text-slate-200">{current}/{max}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EquipSlot({
  slotKey,
  item,
  selected,
  onSelect,
}: {
  slotKey: EquipSlotKey;
  item?: Item;
  selected: boolean;
  onSelect: (item: Item | undefined, slotKey: EquipSlotKey) => void;
}) {
  const meta = SLOT_META[slotKey];
  const rarity: Rarity = item?.rarity ?? 'Common';
  const borderClass = selected ? 'sgm-info-slot-on border-2' : RARITY_GLOW[rarity];
  const bgClass = RARITY_BG[rarity];
  const rarityColor = RARITY_COLORS[rarity];

  return (
    <button
      type="button"
      onClick={() => onSelect(item, slotKey)}
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 ${borderClass} ${bgClass} h-14 w-14 shrink-0 sm:h-16 sm:w-16 md:h-20 md:w-20 transition-all hover:scale-105 overflow-hidden`}
      title={item ? `${item.name} (${rarity})` : meta.label}
      aria-label={item ? `${meta.label}: ${item.name}` : `Empty ${meta.label}`}
      aria-pressed={selected}
    >
      {item?.iconUrl ? (
        <img src={item.iconUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className={item ? '' : 'text-slate-600'} style={item ? { color: rarityColor } : undefined}>
          {meta.icon}
        </span>
      )}
      <span className="absolute bottom-0 left-0 right-0 text-[9px] text-slate-200 bg-black/55 text-center hidden sm:block">{meta.label}</span>
      {item?.itemLevel != null && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-slate-200 bg-black/70 px-0.5 rounded">
          {item.itemLevel}
        </span>
      )}
    </button>
  );
}

function ItemInspectCard({ item, slotLabel, onClose }: { item: Item; slotLabel: string; onClose: () => void }) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const mods = Object.entries(item.modifiers ?? {}).filter(([, v]) => typeof v === 'number' && v !== 0) as [AttributeKey, number][];

  return (
    <div
      className="sgm-turn-frame sgm-info-panel w-full max-w-sm rounded-lg border p-3 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-serif text-sm font-bold leading-tight" style={{ color: rarityColor }}>{item.name}</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {item.rarity}
            {item.itemType ? ` · ${item.itemType}` : ''}
            {` · ${slotLabel}`}
            {item.itemLevel != null ? ` · iLvl ${item.itemLevel}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200" title="Close">
          <X size={14} />
        </button>
      </div>
      {item.diceNotation && (
        <p className="mt-2 text-xs font-mono text-amber-300">{item.diceNotation}</p>
      )}
      {mods.length > 0 && (
        <ul className="mt-2 grid grid-cols-3 gap-1">
          {mods.map(([key, val]) => (
            <li key={key} className="rounded bg-slate-800/80 px-1.5 py-1 text-center">
              <div className="text-[9px] text-slate-500">{key}</div>
              <div className={`text-xs font-mono font-bold ${val > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {val > 0 ? `+${val}` : val}
              </div>
            </li>
          ))}
        </ul>
      )}
      {item.description && (
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{item.description}</p>
      )}
      {item.provenance && (
        <p className="mt-1 text-[10px] text-slate-500">{item.provenance}</p>
      )}
      {!item.description && mods.length === 0 && !item.diceNotation && (
        <p className="mt-2 text-xs italic text-slate-500">No listed stats.</p>
      )}
    </div>
  );
}

function AttributeGrid({ state }: { state: GameState }) {
  const reveal = state.statusReveal ?? (state.tutorialProgress?.fullStatusUnlocked ? 'full' : 'minimal');
  if (reveal === 'minimal') {
    return (
      <p className="text-[11px] text-slate-500 italic">
        Full attributes unlock after your first rest, level-up, or tutorial boss.
      </p>
    );
  }
  const attrs = state.character.attributes ?? {} as Record<AttributeKey, number>;
  const entries: [AttributeKey, number][] = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AttributeKey[]).map((k) => [k, attrs[k] ?? 0]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {entries.map(([key, val]) => (
        <div key={key} className="rounded-md bg-slate-800/60 border border-slate-700 px-2 py-1.5 text-center">
          <div className="text-[10px] text-slate-500 font-medium">{key}</div>
          <div className="text-sm font-mono font-bold text-slate-100">{reveal === 'full' ? val : '—'}</div>
        </div>
      ))}
    </div>
  );
}

function SidePanel({ state }: { state: GameState }) {
  const c = state.character;
  const reveal = state.statusReveal ?? (state.tutorialProgress?.fullStatusUnlocked ? 'full' : 'minimal');
  return (
    <div className="h-full w-64 space-y-4 overflow-y-auto bg-slate-950/95 p-3 sm:w-56">
      <div>
        <h3 className="sgm-info-heading mb-2 text-sm uppercase tracking-wider">Vitals</h3>
        <div className="space-y-2">
          <StatBar label="Health" current={c.hp} max={c.maxHp} color="bg-gradient-to-r from-rose-700 to-rose-500" icon={<Heart size={12} className="text-rose-400" />} />
          {(reveal !== 'minimal') && (
            <StatBar label="Mana" current={c.mp} max={c.maxMp} color="bg-gradient-to-r from-sky-600 to-sky-400" icon={<Droplet size={12} className="text-sky-400" />} />
          )}
          {reveal === 'full' && c.sp !== undefined && c.maxSp !== undefined && c.maxSp > 0 && (
            <StatBar label="Stamina" current={c.sp} max={c.maxSp} color="bg-gradient-to-r from-emerald-600 to-emerald-400" icon={<Zap size={12} className="text-emerald-400" />} />
          )}
        </div>
      </div>
      <div>
        <h3 className="sgm-info-heading mb-2 text-sm uppercase tracking-wider">Attributes</h3>
        <AttributeGrid state={state} />
      </div>
      <div>
        <h3 className="sgm-info-heading mb-2 text-sm uppercase tracking-wider">Progress</h3>
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex justify-between"><span>Level</span><span className="font-mono font-bold text-amber-400">{c.level}</span></div>
          {reveal !== 'minimal' && (
            <div className="flex justify-between"><span>XP</span><span className="font-mono">{c.xp}/{c.xpToNext}</span></div>
          )}
          {reveal === 'full' && c.armorClass != null && <div className="flex justify-between"><span>Armor Class</span><span className="font-mono font-bold">{c.armorClass}</span></div>}
          <div className="flex justify-between"><span>Gold</span><span className="font-mono text-amber-400">{state.gold ?? 0}</span></div>
        </div>
      </div>
      {c.conditions.length > 0 && (
        <div>
          <h3 className="sgm-info-heading mb-2 text-sm uppercase tracking-wider">Conditions</h3>
          <div className="flex flex-wrap gap-1">
            {c.conditions.map((cond) => (
              <span key={cond} className="rounded border border-rose-500/30 bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-300">{cond}</span>
            ))}
          </div>
        </div>
      )}
      {reveal === 'full' && c.bio && (
        <div>
          <h3 className="sgm-info-heading mb-2 text-sm uppercase tracking-wider">Biography</h3>
          <p className="text-xs leading-relaxed text-slate-300">{c.bio}</p>
        </div>
      )}
    </div>
  );
}

function EmptyTabContent({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">{message}</div>
  );
}

function StoryPlatesTab({ state }: { state: GameState }) {
  const plates = state.memorableMoments?.storyPlates ?? [];
  if (plates.length === 0) {
    return (
      <EmptyTabContent message="No moments unlocked in this story yet. Lifetime tallies live on your Profile." />
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">This story only</p>
      <p className="text-[11px] text-slate-500">
        Moments from this save. Counts across every campaign are on your Profile.
      </p>
      {plates.map((plate) => (
        <div
          key={plate.id}
          className="rounded-lg border border-amber-900/40 bg-slate-900/60 px-3 py-2"
        >
          <p className="text-sm font-medium text-amber-200">{plate.title}</p>
          <p className="text-[11px] text-slate-500">Turn {plate.turn}</p>
        </div>
      ))}
    </div>
  );
}

function DndSheet({ state }: { state: GameState }) {
  const c = state.character;
  const attrs = c.attributes ?? ({} as Record<AttributeKey, number>);
  const attrRows: [AttributeKey, number][] = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AttributeKey[]).map((k) => [k, attrs[k] ?? 0]);

  const modifier = (val: number) => Math.floor((val - 10) / 2);
  const fmtMod = (m: number) => (m >= 0 ? `+${m}` : `${m}`);

  return (
    <div className="space-y-3 text-slate-200">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attrRows.map(([key, val]) => {
          const mod = modifier(val);
          return (
            <div key={key} className="flex items-center justify-between rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2">
              <span className="text-xs text-slate-400 font-medium">{key}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-mono font-bold text-slate-100">{val}</span>
                <span className="text-xs font-mono text-emerald-400">{fmtMod(mod)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2 flex justify-between"><span className="text-slate-400">AC</span><span className="font-mono font-bold">{c.armorClass ?? 10}</span></div>
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2 flex justify-between"><span className="text-slate-400">HP</span><span className="font-mono font-bold">{c.hp}/{c.maxHp}</span></div>
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2 flex justify-between"><span className="text-slate-400">Speed</span><span className="font-mono font-bold">30 ft</span></div>
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2 flex justify-between"><span className="text-slate-400">Level</span><span className="font-mono font-bold">{c.level}</span></div>
      </div>
      {c.conditions.length > 0 && (
        <div>
          <h4 className="text-xs text-slate-500 mb-1">Conditions</h4>
          <div className="flex flex-wrap gap-1">
            {c.conditions.map((cond) => (
              <span key={cond} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">{cond}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryPanel({ state }: { state: GameState }) {
  const bags = state.containers ?? [];
  const items = state.inventory ?? [];
  const [expandedBagId, setExpandedBagId] = useState<string | null>(bags[0]?.id ?? null);
  return (
    <div className="space-y-3 text-left">
      {bags.length > 0 && (
        <div>
          <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Containers</h4>
          <ul className="space-y-1">
            {bags.map((bag) => {
              const contents = getItemsInContainer(state, bag.id);
              const used = contents.length;
              const expanded = expandedBagId === bag.id;
              return (
                <li key={bag.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedBagId(expanded ? null : bag.id)}
                    className="w-full rounded border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-left text-xs text-slate-200 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        <span className="font-medium">{bag.name}</span>
                        <span className="ml-2 text-slate-500">{used}/{bag.capacity} slots · {bag.kind ?? 'physical'}</span>
                      </span>
                      {expanded ? <ChevronUp size={12} className="shrink-0 text-slate-500" /> : <ChevronDown size={12} className="shrink-0 text-slate-500" />}
                    </div>
                    {expanded && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 font-medium">Contents:</div>
                        {contents.length > 0 ? (
                          contents.map((item) => (
                            <div key={item.id} className="flex justify-between gap-2 text-[11px] text-slate-300">
                              <span className="truncate">• {item.name}</span>
                              <span className="shrink-0 text-slate-500">
                                {item.equipped
                                  ? <span className="text-emerald-400">equipped{item.slot ? ` · ${item.slot}` : ''}</span>
                                  : item.quantity > 1 ? `x${item.quantity}` : null}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] italic text-slate-500">Bag is empty</div>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Carried</h4>
        {items.length === 0 ? (
          <p className="text-xs italic text-slate-500">Nothing carried.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.id} className="rounded border border-slate-700 bg-slate-900/60 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  {it.iconUrl ? (
                    <img src={it.iconUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover border border-slate-700" />
                  ) : null}
                  <span className="text-xs font-medium text-slate-100 flex-1 truncate">{it.name}</span>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {it.equipped ? `Equipped${it.slot ? ` · ${it.slot}` : ''}` : `x${it.quantity}`}
                  </span>
                </div>
                {typeof it.description === 'string' && it.description && (
                  <p className="mt-0.5 text-[11px] text-slate-400">{it.description}</p>
                )}
                {it.provenance && <p className="text-[10px] text-slate-600">{it.provenance}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PaperDoll({
  state,
  equipped,
  artBusy,
  lookKey,
  inspect,
  onSelect,
}: {
  state: GameState;
  equipped: Record<EquipSlotKey, Item | undefined>;
  artBusy: boolean;
  lookKey: string;
  inspect: { item: Item; slotKey: EquipSlotKey } | null;
  onSelect: (item: Item | undefined, slotKey: EquipSlotKey) => void;
}) {
  const c = state.character;
  const portraitReady = Boolean(c.portraitUrl);
  const drawing = artBusy && (!c.portraitUrl || c.portraitKey !== lookKey);

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center gap-2 px-2 py-3 sm:gap-3 sm:px-4">
      <div className="flex h-full flex-col justify-center gap-2">
        {LEFT_SLOTS.map((slotKey) => (
          <EquipSlot
            key={slotKey}
            slotKey={slotKey}
            item={equipped[slotKey]}
            selected={inspect?.slotKey === slotKey}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="relative flex h-full min-h-0 min-w-0 flex-1 items-center justify-center">
        <div className="sgm-turn-frame relative h-full w-auto max-w-[min(100%,16rem)] overflow-hidden rounded-lg border-2 bg-slate-800/40 aspect-[3/5] sm:max-w-[min(100%,20rem)]">
          {drawing ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/70">
              <Loader2 size={22} className="sgm-info-accent animate-spin" />
              <span className="text-[10px] text-slate-400">Drawing you…</span>
            </div>
          ) : null}
          {portraitReady ? (
            <img src={c.portraitUrl!} alt={c.name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3">
              <Users size={40} className="text-slate-600" />
              {!drawing && <p className="text-[10px] text-slate-500 text-center">Portrait pending</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-full flex-col justify-center gap-2">
        {RIGHT_SLOTS.map((slotKey) => (
          <EquipSlot
            key={slotKey}
            slotKey={slotKey}
            item={equipped[slotKey]}
            selected={inspect?.slotKey === slotKey}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function CharacterWindow({ isOpen, onClose, state, settings, initialTab, onGenerateArt, onCommitArt }: Props) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab ?? 'character');
  const [artBusy, setArtBusy] = useState(false);
  const [inspect, setInspect] = useState<{ item: Item; slotKey: EquipSlotKey } | null>(null);

  const equipped = useMemo(() => {
    const map = {} as Record<EquipSlotKey, Item | undefined>;
    for (const slot of SLOT_ORDER) {
      map[slot] = getEquippedItem(state, slot);
    }
    return map;
  }, [state.inventory]);

  const lookKey = portraitCacheKey(state);
  const stateRef = useRef(state);
  stateRef.current = state;
  const onCharacter = activeTab === 'character';

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !onGenerateArt || !onCommitArt) return;
    let cancelled = false;
    setArtBusy(true);
    void (async () => {
      try {
        const live = stateRef.current;
        const missing = (live.inventory ?? [])
          .filter((item) => !item.iconUrl)
          .sort((a, b) => Number(!!b.equipped) - Number(!!a.equipped))
          .slice(0, 8);
        for (const item of missing) {
          if (cancelled) return;
          const url = await onGenerateArt(itemIconPrompt(item), 'item-icon');
          if (url && !cancelled) onCommitArt({ itemIcons: { [item.id]: url } });
        }
        const after = stateRef.current;
        const needPortrait = after.character.portraitKey !== lookKey || !after.character.portraitUrl;
        if (!cancelled && needPortrait) {
          const url = await onGenerateArt(paperDollPrompt(after), 'character-portrait');
          if (url && !cancelled) onCommitArt({ portraitUrl: url, portraitKey: portraitCacheKey(stateRef.current) });
        }
      } finally {
        if (!cancelled) setArtBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, onGenerateArt, onCommitArt, lookKey]);

  if (!isOpen) return null;

  const c = state.character;
  const tabs: { key: BottomTab; label: string; icon: React.ReactNode }[] = [
    { key: 'character', label: 'Character', icon: <UserRound size={14} /> },
    { key: 'inventory', label: 'Bags', icon: <Backpack size={14} /> },
    { key: 'sheet', label: 'Sheet', icon: <ScrollText size={14} /> },
    { key: 'progression', label: 'Progress', icon: <TrendingUp size={14} /> },
    { key: 'combat', label: 'Combat', icon: <Sword size={14} /> },
    { key: 'spells', label: 'Spells', icon: <Sparkles size={14} /> },
    { key: 'professions', label: 'Professions', icon: <Hammer size={14} /> },
    { key: 'pets', label: 'Pets', icon: <Cat size={14} /> },
    { key: 'titles', label: 'Titles', icon: <Trophy size={14} /> },
    { key: 'portrait', label: 'Portrait', icon: <Camera size={14} /> },
  ];

  if (settings.dndMode || state.engineMode === 'dnd') {
    tabs.push({ key: 'dnd', label: 'Tabletop Sheet', icon: <ScrollText size={14} /> });
  }

  const handleSelect = (item: Item | undefined, slotKey: EquipSlotKey) => {
    if (!item) {
      setInspect(null);
      return;
    }
    setInspect((prev) => (prev?.slotKey === slotKey ? null : { item, slotKey }));
  };

  const handleTab = (key: BottomTab) => {
    setInspect(null);
    setActiveTab(key);
    if (key !== 'character') setSidePanelOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="sgm-turn-frame sgm-info-panel relative flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden text-slate-100 shadow-2xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-xl sm:border">
        <div className="sgm-turn-frame-bar h-1 w-full shrink-0" />

        <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="sgm-info-heading text-lg font-bold">{c.name}</h2>
            <span className="text-xs text-slate-500">Level {c.level}</span>
          </div>
          <div className="flex items-center gap-2">
            {onCharacter && (
              <button
                type="button"
                onClick={() => setSidePanelOpen((o) => !o)}
                aria-pressed={sidePanelOpen}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                  sidePanelOpen
                    ? 'sgm-info-tab-on'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {sidePanelOpen ? 'Hide stats' : 'Show stats'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {onCharacter ? (
            <div className="relative min-h-0 min-w-0 flex-1">
              <PaperDoll
                state={state}
                equipped={equipped}
                artBusy={artBusy}
                lookKey={lookKey}
                inspect={inspect}
                onSelect={handleSelect}
              />
              {onCharacter && (
                <button
                  type="button"
                  onClick={() => setSidePanelOpen((o) => !o)}
                  className="absolute right-0 top-1/2 z-[5] -translate-y-1/2 rounded-l-md border border-r-0 border-slate-700 bg-slate-900/90 p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  title={sidePanelOpen ? 'Hide stats' : 'Show stats'}
                  aria-label={sidePanelOpen ? 'Hide stats' : 'Show stats'}
                >
                  {sidePanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {activeTab === 'inventory' && <InventoryPanel state={state} />}
              {activeTab === 'spells' && <EmptyTabContent message="No spells learned yet." />}
              {activeTab === 'professions' && <EmptyTabContent message="No professions acquired." />}
              {activeTab === 'pets' && <EmptyTabContent message="No pets or summons bonded." />}
              {activeTab === 'titles' && <StoryPlatesTab state={state} />}
              {activeTab === 'dnd' && <DndSheet state={state} />}
              {activeTab === 'sheet' && <CharacterSheetView state={state} />}
              {activeTab === 'portrait' && <UploadImport />}
              {activeTab === 'progression' && <CharacterProgression state={state} />}
              {activeTab === 'combat' && <CombatEncounter activeDungeon={state.activeDungeon} currentCoordinates={state.currentCoordinates} />}
            </div>
          )}

          {onCharacter && sidePanelOpen && (
            <>
              <button
                type="button"
                className="absolute inset-0 z-10 bg-black/50 sm:hidden"
                aria-label="Hide stats"
                onClick={() => setSidePanelOpen(false)}
              />
              <div className="absolute inset-y-0 right-0 z-20 border-l border-slate-800 sm:relative sm:z-0">
                <SidePanel state={state} />
              </div>
            </>
          )}

          {inspect && (
            <div
              className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 p-3 sm:items-center"
              onClick={() => setInspect(null)}
            >
              <ItemInspectCard
                item={inspect.item}
                slotLabel={SLOT_META[inspect.slotKey].label}
                onClose={() => setInspect(null)}
              />
            </div>
          )}
        </div>

        <div className="z-20 flex shrink-0 overflow-x-auto border-t border-slate-800 bg-slate-950 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTab(tab.key)}
              className={`flex min-w-[3.25rem] flex-1 flex-col items-center gap-1 border-t-2 px-1 py-2.5 text-xs transition-colors ${
                activeTab === tab.key
                  ? 'sgm-info-tab-on'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              {tab.icon}
              <span className="text-[9px] sm:text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
