import { useState, useMemo } from 'react';
import type {
  ProgressionMode, SkillNode, MockLoot, GameState,
} from '@/types';
import { RARITY_COLORS } from '@/game/types';
import { mockSkills, mockLoot } from '@/data/mockGameData';
import {
  Sword, Flame, Leaf, Hammer, Sparkles, Lock, ChevronRight,
  ScrollText, Shield, Zap, Star, Backpack,
} from 'lucide-react';

interface Props {
  state: GameState;
}

const BRANCH_META: Record<SkillNode['branch'], { label: string; color: string; icon: typeof Sword }> = {
  combat: { label: 'Combat', color: 'text-crimson-300', icon: Sword },
  magic: { label: 'Magic', color: 'text-cyan-300', icon: Flame },
  survival: { label: 'Survival', color: 'text-emerald-300', icon: Leaf },
  crafting: { label: 'Crafting', color: 'text-amber-300', icon: Hammer },
};

export function CharacterProgression({ state }: Props) {
  const [mode, setMode] = useState<ProgressionMode>('litrpg');

  return (
    <div className="flex h-full flex-col">
      {/* Mode toggle */}
      <div className="flex gap-1 border-b border-slate-800 bg-slate-950/60 p-2">
        {(['dnd', 'litrpg', 'rpg'] as ProgressionMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold transition-all ${
              mode === m
                ? 'sgm-info-tab-on border'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {m === 'dnd' ? 'Tabletop Fantasy' : m === 'rpg' ? 'Story RPG Mode' : 'LitRPG Mode'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {mode === 'dnd' ? <DndMode state={state} /> : <LitRpgMode state={state} />}
      </div>
    </div>
  );
}

/* ============ TABLETOP FANTASY ============ */

function DndMode({ state }: { state: GameState }) {
  const c = state.character;
  const [slots] = useState([
    { level: 1, total: 4, expended: 1 },
    { level: 2, total: 2, expended: 0 },
    { level: 3, total: 1, expended: 1 },
  ]);

  const attunedItems = useMemo(
    () => state.inventory.filter((it) => it.equipped && (it.rarity === 'Rare' || it.rarity === 'Epic' || it.rarity === 'Legendary')).slice(0, 3),
    [state.inventory],
  );

  return (
    <div className="space-y-5">
      {/* Spell Slots */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Sparkles size={13} />
          Spell Slots
        </h3>
        <div className="space-y-1.5">
          {slots.map((slot) => {
            const available = slot.total - slot.expended;
            return (
              <div key={slot.level} className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
                <span className="font-serif text-sm font-bold text-slate-200">L{slot.level}</span>
                <div className="flex gap-1">
                  {Array.from({ length: slot.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded-full border transition-all ${
                        i < available
                          ? 'border-cyan-400 bg-cyan-500/30 shadow-sm shadow-cyan-500/30'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-auto font-mono text-xs text-slate-400">{available}/{slot.total}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Attunement */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Shield size={13} />
          Attunement ({attunedItems.length}/3)
        </h3>
        <div className="space-y-1.5">
          {attunedItems.length === 0 ? (
            <div className="rounded-md border border-slate-700 bg-slate-800/30 py-3 text-center text-xs italic text-slate-600">
              No items attuned. Rare or higher items require attunement.
            </div>
          ) : (
            attunedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
                <Star size={13} style={{ color: RARITY_COLORS[item.rarity] }} />
                <span className="text-sm text-slate-200">{item.name}</span>
                <span className="ml-auto text-[10px] uppercase text-slate-500">{item.rarity}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Character Class Info */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <ScrollText size={13} />
          Class Features
        </h3>
        <div className="rounded-md border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-300">
          <div className="mb-1 flex justify-between">
            <span className="text-slate-500">Class</span>
            <span className="font-medium text-slate-200">{state.campaignArchetype ?? 'Adventurer'}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-500">Level</span>
            <span className="font-mono text-slate-200">{c.level}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-500">Armor Class</span>
            <span className="font-mono text-slate-200">{c.armorClass ?? 10}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Conditions</span>
            <span className="text-slate-200">{c.conditions.length > 0 ? c.conditions.join(', ') : 'None'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============ LITRPG MODE ============ */

function LitRpgMode({ state }: { state: GameState }) {
  const c = state.character;

  const stats: { label: string; value: number; max: number; color: string }[] = [
    { label: 'STR', value: c.attributes?.STR ?? 10, max: 20, color: 'from-crimson-600 to-crimson-400' },
    { label: 'DEX', value: c.attributes?.DEX ?? 10, max: 20, color: 'from-amber-600 to-amber-400' },
    { label: 'CON', value: c.attributes?.CON ?? 10, max: 20, color: 'from-emerald-600 to-emerald-400' },
    { label: 'INT', value: c.attributes?.INT ?? 10, max: 20, color: 'from-sky-600 to-sky-400' },
    { label: 'WIS', value: c.attributes?.WIS ?? 10, max: 20, color: 'from-violet-600 to-violet-400' },
    { label: 'CHA', value: c.attributes?.CHA ?? 10, max: 20, color: 'from-rose-600 to-rose-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Stat tracking */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Zap size={13} />
          Stat Tracking
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((s) => {
            const pct = Math.min(100, (s.value / s.max) * 100);
            return (
              <div key={s.label} className="rounded-md border border-slate-700 bg-slate-800/40 p-2.5">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[10px] uppercase text-slate-500">{s.label}</span>
                  <span className="font-mono text-sm font-bold text-slate-100">{s.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
                  <div className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skill Tree */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Sparkles size={13} />
          Skill Tree
        </h3>
        <div className="space-y-3">
          {(Object.keys(BRANCH_META) as SkillNode['branch'][]).map((branch) => {
            const meta = BRANCH_META[branch];
            const Icon = meta.icon;
            const branchSkills = mockSkills.filter((s) => s.branch === branch).sort((a, b) => a.tier - b.tier);
            return (
              <div key={branch} className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-3">
                <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${meta.color}`}>
                  <Icon size={14} />
                  {meta.label}
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {branchSkills.map((skill, idx) => (
                    <div key={skill.id} className="flex items-center">
                      <SkillNodeCard skill={skill} />
                      {idx < branchSkills.length - 1 && (
                        <ChevronRight size={14} className="mx-0.5 shrink-0 text-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rarity-coded Inventory Grid */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Backpack size={13} />
          Loot Inventory
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {mockLoot.map((item) => (
            <LootCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SkillNodeCard({ skill }: { skill: SkillNode }) {
  const Icon = BRANCH_META[skill.branch].icon;
  return (
    <div
      className={`relative flex w-20 shrink-0 flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all ${
        skill.unlocked
          ? 'border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10'
          : 'border-slate-700 bg-slate-800/30 opacity-60'
      }`}
      title={skill.description}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
        skill.unlocked ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-slate-600 bg-slate-900'
      }`}>
        {skill.unlocked ? <Icon size={16} className={BRANCH_META[skill.branch].color} /> : <Lock size={14} className="text-slate-600" />}
      </div>
      <span className="text-[10px] font-medium leading-tight text-slate-300">{skill.name}</span>
      <span className="text-[8px] uppercase text-slate-600">T{skill.tier}</span>
    </div>
  );
}

function LootCard({ item }: { item: MockLoot }) {
  const color = RARITY_COLORS[item.rarity];
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border bg-slate-800/40 p-2.5 transition-all hover:scale-[1.02]"
      style={{ borderColor: `${color}40` }}
    >
      <div className="flex items-center gap-1.5">
        <Star size={11} style={{ color }} />
        <span className="truncate text-xs font-medium text-slate-200">{item.name}</span>
      </div>
      <span className="text-[9px] uppercase tracking-wide" style={{ color }}>{item.rarity}</span>
      <span className="text-[10px] text-slate-500">Lv {item.itemLevel} · {item.itemType}</span>
      <p className="text-[10px] leading-snug text-slate-400 line-clamp-2">{item.description}</p>
    </div>
  );
}
