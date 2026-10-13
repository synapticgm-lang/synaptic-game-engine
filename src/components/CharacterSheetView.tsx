import { useMemo, useState } from 'react';
import type { GameState } from '@/game/types';
import { equippedSetLabel } from '@/game/uiTheme';
import { deriveTabletopSheet } from '@/game/tabletop/characterBuild';
import { listSheets, sheetLabel } from '@/game/tabletop/sheetLibrary';
import { pregenSheets, previewSavedSheet } from '@/game/tabletop/sheetPreview';
import { TabletopSheetLayout } from './TabletopSheetLayout';
import { Heart, Droplet, Zap, Shield, Sword, Gauge } from 'lucide-react';

/** Tabletop: ready-made and saved sheets (the full sheet is the Tabletop Sheet tab). Other modes: the Status window. */
interface Props {
  state: GameState;
  uiThemeId?: string;
}

export function CharacterSheetView({ state, uiThemeId }: Props) {
  return (
    <div className="sgm-modal-body h-full p-3 sm:p-4">
      {state.engineMode === 'dnd' ? <TabletopCards state={state} /> : <LitRpgStatus state={state} uiThemeId={uiThemeId} />}
    </div>
  );
}

function LitRpgStatus({ state, uiThemeId }: { state: GameState; uiThemeId?: string }) {
  const c = state.character;
  const hpPct = c.maxHp > 0 ? Math.min(100, (c.hp / c.maxHp) * 100) : 0;
  const mpPct = c.maxMp > 0 ? Math.min(100, (c.mp / c.maxMp) * 100) : 0;
  const xpPct = c.xpToNext > 0 ? Math.min(100, (c.xp / c.xpToNext) * 100) : 0;

  const buffs = c.conditions.filter((cond) => /buff|bless|inspire|haste|shield|protect/i.test(cond));
  const displayBuffs = buffs.length > 0 ? buffs : ['No Active Buffs'];
  const miniStats = [
    { label: 'AC', value: c.armorClass, icon: <Shield size={14} className="text-slate-400" /> },
    { label: 'STR', value: c.attributes?.STR, icon: <Sword size={14} className="text-slate-400" /> },
    { label: 'DEX', value: c.attributes?.DEX, icon: <Gauge size={14} className="text-slate-400" /> },
  ].filter((s) => typeof s.value === 'number');

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* Level / XP Header */}
      <div className="sgm-turn-frame sgm-info-panel rounded-xl border px-9 py-4 text-center shadow-lg">
        <div className="sgm-info-accent relative z-[3] mb-1 text-[10px] uppercase tracking-[0.2em] opacity-80">Adventurer</div>
        <div className="relative z-[3] font-serif text-2xl font-bold">{c.name}</div>
        <div className="sgm-equipped-set relative z-[3] mt-1 truncate">{equippedSetLabel(uiThemeId)}</div>
        <div className="my-2 flex items-center justify-center gap-2">
          <span className="sgm-info-tab-on rounded-full border px-3 py-0.5 text-xs font-bold">
            LV {c.level}
          </span>
        </div>
        {/* XP Bar */}
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] opacity-80">
            <span className="sgm-info-accent">EXP</span>
            <span className="font-mono">{c.xp} / {c.xpToNext}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
            <div
              className="sgm-info-fill h-full rounded-full transition-all duration-500"
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
        {c.maxMp > 0 && <HoloBar
          label="MP"
          current={c.mp}
          max={c.maxMp}
          pct={mpPct}
          icon={<Droplet size={14} className="text-sky-400" />}
          gradient="from-sky-600 via-sky-500 to-sky-400"
          glow="shadow-sky-500/20"
          border="border-sky-700/40"
        />}
      </div>

      {/* Active Buffs */}
      <div className="sgm-sheet-inset rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <Zap size={13} className="sgm-info-accent" />
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
      {miniStats.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {miniStats.map((s) => <MiniStat key={s.label} icon={s.icon} label={s.label} value={s.value as number} />)}
        </div>
      )}
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
    <div className={`sgm-sheet-inset rounded-lg border ${border} bg-slate-900/60 p-3 shadow-inner ${glow}`}>
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


/** Tabletop: your character, the inn book's ready-made characters and your saved sheets, each opening its real sheet. */
function TabletopCards({ state }: { state: GameState }) {
  const sheets = useMemo(() => [...pregenSheets(), ...listSheets()], []);
  const [open, setOpen] = useState<string | null>(null);
  const yours = deriveTabletopSheet(state);
  const shown = open === 'current' || !open ? null : sheets.find((s) => s.id === open) ?? null;
  const preview = useMemo(() => (shown ? previewSavedSheet(shown) : null), [shown]);
  const card = (id: string, name: string, line: string, tag: string) => (
    <div key={id} className={`sgm-sheet-box flex w-48 shrink-0 flex-col gap-1 px-3 py-2 ${open === id ? 'sgm-info-slot-on' : ''}`}>
      <span className="sgm-sheet-label text-[10px] uppercase tracking-wider">{tag}</span>
      <span className="sgm-info-heading text-sm font-bold">{name}</span>
      <span className="sgm-sheet-label text-xs">{line}</span>
      <button type="button" onClick={() => setOpen(open === id ? null : id)} className="sgm-sheet-btn mt-1 py-1 text-xs" data-testid={`card-view-${id}`}>
        {open === id ? 'Hide sheet' : 'View sheet'}
      </button>
    </div>
  );
  return (
    <div className="space-y-3" data-testid="tabletop-cards">
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {card('current', state.character.name || 'Hero', yours?.title ?? `Level ${state.character.level}`, 'You')}
        {sheets.map((s) => card(s.id, s.name, sheetLabel(s).split(' — ')[1] ?? '', s.id.startsWith('pregen-') ? 'Ready-made' : 'Saved sheet'))}
      </div>
      {open === 'current' && yours && <TabletopSheetLayout name={state.character.name} sheet={yours} hp={state.character.hp} />}
      {preview && shown && <TabletopSheetLayout name={shown.name} sheet={preview.sheet} hpMethod={shown.hpMethod ?? 'fixed'} />}
    </div>
  );
}
