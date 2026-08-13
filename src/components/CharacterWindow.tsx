import React, { useMemo, useState } from 'react';
import type { GameState, Item, Rarity, Settings, AttributeKey } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import { CharacterSheetView } from './CharacterSheetView';
import { UploadImport } from './UploadImport';
import { CharacterProgression } from './CharacterProgression';
import { CombatEncounter } from './CombatEncounter';
import {
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  HardHat, Shield, Shirt, Sword, Footprints,
  Sparkles, Hammer, Cat, Trophy, ScrollText, Camera, TrendingUp,
  Heart, Droplet, Zap, Users, Backpack,
} from 'lucide-react';
import { getItemsInContainer } from '@/game/inventory';

type BottomTab = 'inventory' | 'spells' | 'professions' | 'pets' | 'titles' | 'dnd' | 'sheet' | 'portrait' | 'progression' | 'combat';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  settings: Settings;
  initialTab?: BottomTab;
}

type EquipSlotKey = 'Head' | 'Shoulders' | 'Chest' | 'Main Hand' | 'Off Hand' | 'Legs' | 'Feet';

const SLOT_META: Record<EquipSlotKey, { icon: React.ReactNode; label: string }> = {
  Head: { icon: <HardHat size={22} />, label: 'Head' },
  Shoulders: { icon: <Shield size={22} />, label: 'Shoulders' },
  Chest: { icon: <Shirt size={22} />, label: 'Chest' },
  'Main Hand': { icon: <Sword size={22} />, label: 'Main Hand' },
  'Off Hand': { icon: <Shield size={22} />, label: 'Off Hand' },
  Legs: { icon: <Shirt size={22} />, label: 'Legs' },
  Feet: { icon: <Footprints size={22} />, label: 'Feet' },
};

const SLOT_ORDER: EquipSlotKey[] = ['Head', 'Shoulders', 'Chest', 'Main Hand', 'Off Hand', 'Legs', 'Feet'];

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
  return state.inventory.find((it) => it.equipped && it.slot === slot);
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

function EquipSlot({ slotKey, item }: { slotKey: EquipSlotKey; item?: Item }) {
  const meta = SLOT_META[slotKey];
  const rarity: Rarity = item?.rarity ?? 'Common';
  const borderClass = RARITY_GLOW[rarity];
  const bgClass = RARITY_BG[rarity];
  const rarityColor = RARITY_COLORS[rarity];

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 ${borderClass} ${bgClass} w-16 h-16 sm:w-20 sm:h-20 transition-all hover:scale-105 cursor-default group`}
      title={item ? `${item.name} (${rarity})` : meta.label}
    >
      <span className={item ? '' : 'text-slate-600'} style={item ? { color: rarityColor } : undefined}>
        {meta.icon}
      </span>
      <span className="text-[9px] text-slate-500 mt-0.5 hidden sm:block">{meta.label}</span>
      {item?.itemLevel != null && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-slate-200 bg-black/70 px-0.5 rounded">
          {item.itemLevel}
        </span>
      )}
      {item && (
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-900/95 flex items-center justify-center p-1 transition-opacity pointer-events-none">
          <span className="text-[10px] text-center text-slate-200 leading-tight line-clamp-3">{item.name}</span>
        </div>
      )}
    </div>
  );
}

function AttributeGrid({ state }: { state: GameState }) {
  const attrs = state.character.attributes ?? {} as Record<AttributeKey, number>;
  const entries: [AttributeKey, number][] = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AttributeKey[]).map((k) => [k, attrs[k] ?? 0]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {entries.map(([key, val]) => (
        <div key={key} className="rounded-md bg-slate-800/60 border border-slate-700 px-2 py-1.5 text-center">
          <div className="text-[10px] text-slate-500 font-medium">{key}</div>
          <div className="text-sm font-mono font-bold text-slate-100">{val}</div>
        </div>
      ))}
    </div>
  );
}

function SidePanel({ state, open, onToggle }: { state: GameState; open: boolean; onToggle: () => void }) {
  const c = state.character;
  return (
    <div className={`transition-all duration-300 overflow-hidden ${open ? 'w-56' : 'w-0'}`}>
      <div className="w-56 h-full border-l border-slate-800 bg-slate-950/60 p-3 space-y-4 overflow-y-auto">
        <div>
          <h3 className="font-serif text-sm uppercase tracking-wider text-crimson-400 mb-2">Vitals</h3>
          <div className="space-y-2">
            <StatBar label="Health" current={c.hp} max={c.maxHp} color="bg-gradient-to-r from-rose-700 to-rose-500" icon={<Heart size={12} className="text-rose-400" />} />
            <StatBar label="Mana" current={c.mp} max={c.maxMp} color="bg-gradient-to-r from-sky-600 to-sky-400" icon={<Droplet size={12} className="text-sky-400" />} />
            {c.sp !== undefined && c.maxSp !== undefined && c.maxSp > 0 && (
              <StatBar label="Stamina" current={c.sp} max={c.maxSp} color="bg-gradient-to-r from-emerald-600 to-emerald-400" icon={<Zap size={12} className="text-emerald-400" />} />
            )}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-sm uppercase tracking-wider text-crimson-400 mb-2">Attributes</h3>
          <AttributeGrid state={state} />
        </div>

        <div>
          <h3 className="font-serif text-sm uppercase tracking-wider text-crimson-400 mb-2">Progress</h3>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between"><span>Level</span><span className="font-mono font-bold text-amber-400">{c.level}</span></div>
            <div className="flex justify-between"><span>XP</span><span className="font-mono">{c.xp}/{c.xpToNext}</span></div>
            {c.armorClass != null && <div className="flex justify-between"><span>Armor Class</span><span className="font-mono font-bold">{c.armorClass}</span></div>}
            <div className="flex justify-between"><span>Gold</span><span className="font-mono text-amber-400">{state.gold ?? 0}</span></div>
          </div>
        </div>

        {c.conditions.length > 0 && (
          <div>
            <h3 className="font-serif text-sm uppercase tracking-wider text-crimson-400 mb-2">Conditions</h3>
            <div className="flex flex-wrap gap-1">
              {c.conditions.map((cond) => (
                <span key={cond} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">{cond}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 w-6 h-12 bg-slate-800 border border-slate-700 rounded-r flex items-center justify-center hover:bg-slate-700 transition-colors"
        title={open ? 'Collapse stats' : 'Expand stats'}
      >
        {open ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronLeft size={16} className="text-slate-400" />}
      </button>
    </div>
  );
}

function EmptyTabContent({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">{message}</div>
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
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-100">{it.name}</span>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {it.equipped ? `Equipped${it.slot ? ` · ${it.slot}` : ''}` : `x${it.quantity}`}
                  </span>
                </div>
                {it.description && <p className="mt-0.5 text-[11px] text-slate-400">{it.description}</p>}
                {it.provenance && <p className="text-[10px] text-slate-600">{it.provenance}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CharacterWindow({ isOpen, onClose, state, settings, initialTab }: Props) {
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab ?? 'inventory');

  const equipped = useMemo(() => {
    const map = {} as Record<EquipSlotKey, Item | undefined>;
    for (const slot of SLOT_ORDER) {
      map[slot] = getEquippedItem(state, slot);
    }
    return map;
  }, [state.inventory]);

  if (!isOpen) return null;

  const c = state.character;
  const tabs: { key: BottomTab; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Inventory', icon: <Backpack size={14} /> },
    { key: 'sheet', label: 'Sheet', icon: <ScrollText size={14} /> },
    { key: 'progression', label: 'Progress', icon: <TrendingUp size={14} /> },
    { key: 'combat', label: 'Combat', icon: <Sword size={14} /> },
    { key: 'spells', label: 'Spells', icon: <Sparkles size={14} /> },
    { key: 'professions', label: 'Professions', icon: <Hammer size={14} /> },
    { key: 'pets', label: 'Pets', icon: <Cat size={14} /> },
    { key: 'titles', label: 'Titles', icon: <Trophy size={14} /> },
    { key: 'portrait', label: 'Portrait', icon: <Camera size={14} /> },
  ];

  if (settings.dndMode) {
    tabs.push({ key: 'dnd', label: '5e Sheet', icon: <ScrollText size={14} /> });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-bold text-crimson-400">{c.name}</h2>
            <span className="text-xs text-slate-500">Level {c.level}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Main Content: Equipment + Portrait + Side Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Equipment & Portrait area */}
          <div className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
            {/* Top row: Head, Shoulders */}
            <div className="flex gap-2 mb-2">
              <EquipSlot slotKey="Head" item={equipped.Head} />
              <EquipSlot slotKey="Shoulders" item={equipped.Shoulders} />
            </div>

            {/* Middle row: Main Hand, Portrait, Off Hand */}
            <div className="flex items-center gap-2 mb-2">
              <EquipSlot slotKey="Main Hand" item={equipped['Main Hand']} />

              {/* Portrait */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg border-2 border-slate-600 bg-slate-800/40 flex items-center justify-center overflow-hidden">
                {c.appearance ? (
                  <div className="text-center p-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center mb-1">
                      <Users size={28} className="text-slate-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{c.appearance}</p>
                  </div>
                ) : (
                  <Users size={40} className="text-slate-600" />
                )}
              </div>

              <EquipSlot slotKey="Off Hand" item={equipped['Off Hand']} />
            </div>

            {/* Bottom row: Chest, Legs, Feet */}
            <div className="flex gap-2 mb-4">
              <EquipSlot slotKey="Chest" item={equipped.Chest} />
              <EquipSlot slotKey="Legs" item={equipped.Legs} />
              <EquipSlot slotKey="Feet" item={equipped.Feet} />
            </div>

            {/* Bio */}
            {c.bio && (
              <div className="w-full max-w-sm rounded-md bg-slate-800/40 border border-slate-700 p-3 mb-3">
                <h4 className="text-xs text-slate-500 mb-1 font-medium">Biography</h4>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{c.bio}</p>
              </div>
            )}

            {/* Tab Content */}
            <div className="w-full flex-1 min-h-[120px] rounded-md bg-slate-800/30 border border-slate-700 p-3 overflow-y-auto">
              {activeTab === 'inventory' && <InventoryPanel state={state} />}
              {activeTab === 'spells' && <EmptyTabContent message="No spells learned yet." />}
              {activeTab === 'professions' && <EmptyTabContent message="No professions acquired." />}
              {activeTab === 'pets' && <EmptyTabContent message="No pets or summons bonded." />}
              {activeTab === 'titles' && <EmptyTabContent message="No titles or achievements earned." />}
              {activeTab === 'dnd' && <DndSheet state={state} />}
              {activeTab === 'sheet' && <CharacterSheetView state={state} />}
              {activeTab === 'portrait' && <UploadImport />}
              {activeTab === 'progression' && <CharacterProgression state={state} />}
              {activeTab === 'combat' && <CombatEncounter activeDungeon={state.activeDungeon} currentCoordinates={state.currentCoordinates} />}
            </div>
          </div>

          {/* Collapsible Side Panel */}
          <div className="relative flex">
            <SidePanel state={state} open={sidePanelOpen} onToggle={() => setSidePanelOpen(!sidePanelOpen)} />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex overflow-x-auto border-t border-slate-800 bg-slate-950/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-w-[3.25rem] flex-1 flex-col items-center gap-1 px-1 py-2.5 text-xs transition-colors ${
                activeTab === tab.key
                  ? 'text-crimson-400 bg-slate-800/50 border-t-2 border-crimson-500'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
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
