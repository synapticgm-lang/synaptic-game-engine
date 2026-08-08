import { useMemo, useState } from 'react';
import type { GameState, AttributeKey, Item } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import {
  Dices, Heart, Droplet, Zap, Star, Shield, Sword,
  Backpack, Sparkles, ChevronLeft, ChevronRight, Users,
  TrendingUp, Gauge,
} from 'lucide-react';

type LayoutMode = 'dnd' | 'litrpg' | 'cards';

interface Props {
  state: GameState;
}

const ATTR_META: Record<AttributeKey, { label: string; icon: string }> = {
  STR: { label: 'Strength', icon: '💪' },
  DEX: { label: 'Dexterity', icon: '🎯' },
  CON: { label: 'Constitution', icon: '🛡️' },
  INT: { label: 'Intelligence', icon: '📖' },
  WIS: { label: 'Wisdom', icon: '🦉' },
  CHA: { label: 'Charisma', icon: '💬' },
};

const MODIFIER = (val: number) => Math.floor((val - 10) / 2);
const FMT_MOD = (m: number) => (m >= 0 ? `+${m}` : `${m}`);

export function CharacterSheetView({ state }: Props) {
  const [layout, setLayout] = useState<LayoutMode>('dnd');

  return (
    <div className="flex h-full flex-col">
      <LayoutToggle layout={layout} onChange={setLayout} />
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {layout === 'dnd' && <DndDashboard state={state} />}
        {layout === 'litrpg' && <LitRpgStatus state={state} />}
        {layout === 'cards' && <PreMadeCards state={state} />}
      </div>
    </div>
  );
}

function LayoutToggle({ layout, onChange }: { layout: LayoutMode; onChange: (m: LayoutMode) => void }) {
  const tabs: { key: LayoutMode; label: string }[] = [
    { key: 'dnd', label: 'D&D Dashboard' },
    { key: 'litrpg', label: 'LitRPG Status' },
    { key: 'cards', label: 'Pre-Made Cards' },
  ];
  return (
    <div className="flex gap-1 border-b border-slate-800 bg-slate-950/60 p-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-md px-2 py-2 text-center text-[11px] font-medium transition-all sm:text-xs ${
            layout === tab.key
              ? 'bg-crimson-500/15 text-crimson-300 border border-crimson-500/40 shadow-inner shadow-crimson-900/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ============ LAYOUT 1: D&D DASHBOARD ============ */

function DndDashboard({ state }: { state: GameState }) {
  const c = state.character;
  const attrs = c.attributes ?? ({} as Record<AttributeKey, number>);
  const attrRows: [AttributeKey, number][] = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AttributeKey[]).map((k) => [k, attrs[k] ?? 10]);

  const totalWeight = useMemo(() => state.inventory.reduce((sum, it) => sum + (it.quantity ?? 1), 0), [state.inventory]);
  const carryCap = 150;
  const weightPct = Math.min(100, Math.round((totalWeight / carryCap) * 100));

  const spells = state.inventory.filter((it) => it.itemType === 'accessory' || /spell|scroll|tome/i.test(it.name)).slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Core Attributes */}
      <section>
        <h3 className="mb-2 font-serif text-xs uppercase tracking-wider text-crimson-400">Core Attributes</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attrRows.map(([key, val]) => {
            const mod = MODIFIER(val);
            return (
              <div key={key} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{ATTR_META[key].icon}</span>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500">{ATTR_META[key].label}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-100">{val}</span>
                      <span className="font-mono text-[11px] text-emerald-400">{FMT_MOD(mod)}</span>
                    </div>
                  </div>
                </div>
                <Dices size={14} className="text-slate-600" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Inventory Weight Bar */}
      <section>
        <h3 className="mb-2 font-serif text-xs uppercase tracking-wider text-crimson-400">Inventory Weight</h3>
        <div className="rounded-md border border-slate-700 bg-slate-800/40 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Backpack size={13} className="text-slate-400" />
              Carrying Capacity
            </span>
            <span className="font-mono text-slate-200">{totalWeight} / {carryCap} lbs</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                weightPct > 85 ? 'bg-gradient-to-r from-rose-700 to-rose-500' : 'bg-gradient-to-r from-amber-600 to-amber-400'
              }`}
              style={{ width: `${weightPct}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {weightPct > 85 ? 'Encumbered — movement reduced' : 'Within safe load'}
          </div>
        </div>
      </section>

      {/* Spellbook List */}
      <section>
        <h3 className="mb-2 font-serif text-xs uppercase tracking-wider text-crimson-400">Spellbook</h3>
        <div className="rounded-md border border-slate-700 bg-slate-800/40 p-2">
          {spells.length === 0 ? (
            <div className="py-4 text-center text-xs italic text-slate-600">No spells learned yet.</div>
          ) : (
            <ul className="space-y-1">
              {spells.map((spell) => (
                <li key={spell.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-700/40">
                  <Sparkles size={12} style={{ color: RARITY_COLORS[spell.rarity] }} />
                  <span className="text-slate-200">{spell.name}</span>
                  <span className="ml-auto text-[10px] text-slate-500">{spell.rarity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* ============ LAYOUT 2: LITRPG STATUS ============ */

function LitRpgStatus({ state }: { state: GameState }) {
  const c = state.character;
  const hpPct = c.maxHp > 0 ? Math.min(100, (c.hp / c.maxHp) * 100) : 0;
  const mpPct = c.maxMp > 0 ? Math.min(100, (c.mp / c.maxMp) * 100) : 0;
  const xpPct = c.xpToNext > 0 ? Math.min(100, (c.xp / c.xpToNext) * 100) : 0;

  const buffs = c.conditions.filter((cond) => /buff|bless|inspire|haste|shield|protect/i.test(cond));
  const displayBuffs = buffs.length > 0 ? buffs : ['No Active Buffs'];

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* Level / XP Header */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-cyan-950/40 p-4 text-center shadow-lg shadow-cyan-900/20">
        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">Adventurer</div>
        <div className="font-serif text-2xl font-bold text-cyan-100">{c.name}</div>
        <div className="my-2 flex items-center justify-center gap-2">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-0.5 text-xs font-bold text-cyan-300">
            LV {c.level}
          </span>
        </div>
        {/* XP Bar */}
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-cyan-300/70">
            <span>EXP</span>
            <span className="font-mono">{c.xp} / {c.xpToNext}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-cyan-700/50 bg-slate-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Health / Mana Bars */}
      <div className="space-y-3">
        <HoloBar
          label="HP"
          current={c.hp}
          max={c.maxHp}
          pct={hpPct}
          icon={<Heart size={14} className="text-rose-400" />}
          gradient="from-rose-600 via-rose-500 to-rose-400"
          glow="shadow-rose-500/20"
          border="border-rose-700/40"
        />
        <HoloBar
          label="MP"
          current={c.mp}
          max={c.maxMp}
          pct={mpPct}
          icon={<Droplet size={14} className="text-sky-400" />}
          gradient="from-sky-600 via-sky-500 to-sky-400"
          glow="shadow-sky-500/20"
          border="border-sky-700/40"
        />
      </div>

      {/* Active Buffs */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <Zap size={13} className="text-amber-400" />
          Active Buffs
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displayBuffs.map((buff) => (
            <span
              key={buff}
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300"
            >
              {buff}
            </span>
          ))}
        </div>
      </div>

      {/* Minimal stat readout */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat icon={<Shield size={14} className="text-slate-400" />} label="AC" value={c.armorClass ?? 10} />
        <MiniStat icon={<Sword size={14} className="text-slate-400" />} label="STR" value={c.attributes?.STR ?? 10} />
        <MiniStat icon={<Gauge size={14} className="text-slate-400" />} label="DEX" value={c.attributes?.DEX ?? 10} />
      </div>
    </div>
  );
}

function HoloBar({
  label, current, max, pct, icon, gradient, glow, border,
}: {
  label: string; current: number; max: number; pct: number;
  icon: React.ReactNode; gradient: string; glow: string; border: string;
}) {
  return (
    <div className={`rounded-lg border ${border} bg-slate-900/60 p-3 shadow-inner ${glow}`}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-200">
          {icon}
          {label}
        </span>
        <span className="font-mono text-slate-300">{current} / {max}</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white/80 drop-shadow">
          {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-800/50 px-2 py-2">
      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">{icon}{label}</div>
      <div className="font-mono text-sm font-bold text-slate-200">{value}</div>
    </div>
  );
}

/* ============ LAYOUT 3: PRE-MADE CARDS ============ */

interface CardData {
  id: string;
  name: string;
  class: string;
  level: number;
  rarity: string;
  gradient: string;
}

function buildCards(state: GameState): CardData[] {
  const c = state.character;
  const base: CardData[] = [
    {
      id: 'current',
      name: c.name || 'Hero',
      class: state.campaignArchetype ?? 'Adventurer',
      level: c.level,
      rarity: 'You',
      gradient: 'from-crimson-900 via-slate-900 to-slate-800',
    },
  ];
  const presets: CardData[] = [
    { id: 'p1', name: 'Lyra Thornwood', class: 'Ranger', level: 5, rarity: 'Preset', gradient: 'from-emerald-900 via-slate-900 to-slate-800' },
    { id: 'p2', name: 'Drogath Forge', class: 'Barbarian', level: 5, rarity: 'Preset', gradient: 'from-amber-900 via-slate-900 to-slate-800' },
    { id: 'p3', name: 'Sister Velnor', class: 'Cleric', level: 5, rarity: 'Preset', gradient: 'from-sky-900 via-slate-900 to-slate-800' },
    { id: 'p4', name: 'Kael Ashbringer', class: 'Paladin', level: 5, rarity: 'Preset', gradient: 'from-rose-900 via-slate-900 to-slate-800' },
  ];
  return [...base, ...presets];
}

function PreMadeCards({ state }: { state: GameState }) {
  const cards = useMemo(() => buildCards(state), [state]);
  const [selected, setSelected] = useState<string | null>(null);
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  const scroll = (dir: number) => {
    if (scrollRef) scrollRef.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Scroll arrows */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={setScrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-6 pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {cards.map((card) => {
          const isSelected = selected === card.id;
          return (
            <div
              key={card.id}
              className={`flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-crimson-500 shadow-lg shadow-crimson-900/40 scale-[1.03]'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              {/* Image Placeholder */}
              <div className={`relative h-44 bg-gradient-to-b ${card.gradient} flex items-center justify-center`}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/60">
                  <Users size={36} className="text-slate-400" />
                </div>
                <span className="absolute top-2 right-2 rounded-full border border-slate-600 bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {card.rarity}
                </span>
                <span className="absolute bottom-2 left-2 rounded-md border border-amber-600/40 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  LV {card.level}
                </span>
              </div>
              {/* Info */}
              <div className="flex flex-col items-center gap-2 border-t border-slate-700 bg-slate-900 p-4">
                <div className="font-serif text-sm font-bold text-slate-100">{card.name}</div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Star size={11} className="text-amber-400" />
                  {card.class}
                </div>
                <button
                  onClick={() => setSelected(card.id)}
                  className={`mt-1 w-full rounded-md py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-crimson-500 text-white shadow-md shadow-crimson-900/50'
                      : 'border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-600">Swipe or use arrows to browse. First card is your current character.</p>
    </div>
  );
}
