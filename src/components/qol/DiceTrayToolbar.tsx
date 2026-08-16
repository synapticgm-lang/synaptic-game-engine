import { useCallback, useMemo, useState } from 'react';
import {
  ChevronUp, ChevronDown, Trash2, Sparkles, Dices, Zap,
} from 'lucide-react';
import type { DiceAnimationMode } from '@/game/types';
import type { DiceMaterial } from '@/game/cosmeticCatalog';
import { DiceFormulaBuilder, type RollResult } from './DiceFormulaBuilder';
import { DicePreview, liveDiceItem } from '../DicePreview';

type DieType = 4 | 6 | 8 | 10 | 12 | 20;
type Modifier = 'none' | '+1' | '+2' | 'adv' | 'dis';

interface RollEntry {
  id: string;
  die: DieType;
  raw: number;
  modifier: Modifier;
  total: number;
  outcome: 'Success' | 'Failure' | 'Crit!' | 'Fumble' | '—';
  timestamp: number;
}

const DICE: { die: DieType; label: string; color: string; glow: string }[] = [
  { die: 4,  label: 'd4',  color: 'text-rose-300',    glow: 'hover:shadow-rose-500/30' },
  { die: 6,  label: 'd6',  color: 'text-amber-300',  glow: 'hover:shadow-amber-500/30' },
  { die: 8,  label: 'd8',  color: 'text-emerald-300',glow: 'hover:shadow-emerald-500/30' },
  { die: 10, label: 'd10', color: 'text-sky-300',    glow: 'hover:shadow-sky-500/30' },
  { die: 12, label: 'd12', color: 'text-violet-300', glow: 'hover:shadow-violet-500/30' },
  { die: 20, label: 'd20', color: 'text-crimson-300',glow: 'hover:shadow-crimson-500/40' },
];

const MOD_LABELS: Record<Modifier, string> = {
  none: 'None',
  '+1': '+1',
  '+2': '+2',
  adv: 'Adv',
  dis: 'Dis',
};

const ROLL_MS: Record<DiceAnimationMode, number> = {
  static: 0,
  normal: 450,
  excited: 1100,
};

function rollDie(sides: DieType): number {
  return Math.floor(Math.random() * sides) + 1;
}

function computeOutcome(die: DieType, raw: number, mod: Modifier): { total: number; outcome: RollEntry['outcome'] } {
  let total = raw;
  if (mod === '+1') total += 1;
  if (mod === '+2') total += 2;
  if (mod === 'adv' || mod === 'dis') {
    const second = rollDie(die);
    total = mod === 'adv' ? Math.max(raw, second) : Math.min(raw, second);
  }
  let outcome: RollEntry['outcome'] = '—';
  if (die === 20) {
    if (raw === 20) outcome = 'Crit!';
    else if (raw === 1) outcome = 'Fumble';
    else outcome = total >= 10 ? 'Success' : 'Failure';
  } else {
    outcome = total >= Math.ceil(die * 0.7) ? 'Success' : 'Failure';
  }
  return { total, outcome };
}

function activeDiceMaterial(): DiceMaterial | undefined {
  try {
    return liveDiceItem().diceSkin?.material;
  } catch {
    return undefined;
  }
}

function excitedFxClass(material: DiceMaterial | undefined): string {
  if (!material) return 'sgm-dice-fx-default';
  return `sgm-dice-fx-${material}`;
}

export function DiceTrayToolbar({
  diceAnimation = 'normal',
}: {
  diceAnimation?: DiceAnimationMode;
}) {
  const [rolls, setRolls] = useState<RollEntry[]>([]);
  const [modifier, setModifier] = useState<Modifier>('none');
  const [logOpen, setLogOpen] = useState(false);
  const [rolling, setRolling] = useState<DieType | null>(null);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const material = activeDiceMaterial();

  const handleRoll = useCallback((die: DieType) => {
    const delay = ROLL_MS[diceAnimation] ?? 450;
    if (delay <= 0) {
      const raw = rollDie(die);
      const { total, outcome } = computeOutcome(die, raw, modifier);
      setRolls((prev) => [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        die, raw, modifier, total, outcome,
        timestamp: Date.now(),
      }, ...prev].slice(0, 30));
      return;
    }
    setRolling(die);
    setTimeout(() => {
      const raw = rollDie(die);
      const { total, outcome } = computeOutcome(die, raw, modifier);
      const entry: RollEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        die, raw, modifier, total, outcome,
        timestamp: Date.now(),
      };
      setRolls((prev) => [entry, ...prev].slice(0, 30));
      setRolling(null);
    }, delay);
  }, [modifier, diceAnimation]);

  const clearLog = useCallback(() => setRolls([]), []);

  const handleFormulaComplete = useCallback((result: RollResult) => {
    const entry: RollEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      die: 20,
      raw: result.total,
      modifier: result.advantage ? 'adv' : result.disadvantage ? 'dis' : 'none',
      total: result.total,
      outcome: result.total >= 10 ? 'Success' : 'Failure',
      timestamp: Date.now(),
    };
    setRolls((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const recentRolls = useMemo(() => rolls.slice(0, 6), [rolls]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-2 sm:pb-3">
      <div className="pointer-events-auto w-full max-w-3xl">
        {/* Recent Rolls Log */}
        <div className={`mx-auto mb-1.5 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ${
          logOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 border-transparent'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="flex items-center gap-1.5 font-serif text-xs font-semibold text-crimson-300">
              <Sparkles size={13} />
              Recent Rolls
            </span>
            <button
              onClick={clearLog}
              className="flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-rose-400"
            >
              <Trash2 size={11} />
              Clear
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-2">
            {recentRolls.length === 0 ? (
              <p className="py-4 text-center text-xs italic text-slate-600">No rolls yet. Tap a die to begin.</p>
            ) : (
              <ul className="space-y-1">
                {recentRolls.map((r) => (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs ${
                      r.outcome === 'Crit!' ? 'border-emerald-500/40 bg-emerald-950/30'
                      : r.outcome === 'Fumble' ? 'border-rose-500/40 bg-rose-950/30'
                      : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-300">d{r.die}</span>
                      <span className="text-slate-500">
                        {r.raw}
                        {r.modifier !== 'none' && (
                          <span className="text-slate-400">
                            {r.modifier === 'adv' ? ' (Adv)' : r.modifier === 'dis' ? ' (Dis)' : ` ${r.modifier}`}
                          </span>
                        )}
                        {' = '}
                      </span>
                      <span className="font-mono font-bold text-slate-100">{r.total}</span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      r.outcome === 'Crit!' ? 'text-emerald-400'
                      : r.outcome === 'Fumble' ? 'text-rose-400'
                      : r.outcome === 'Success' ? 'text-cyan-400'
                      : r.outcome === 'Failure' ? 'text-slate-500'
                      : 'text-slate-600'
                    }`}>
                      {r.outcome}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="relative rounded-2xl border px-2 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:px-3"
          style={{
            borderColor: 'color-mix(in srgb, var(--sgm-dice-accent, #64748b) 45%, transparent)',
            background: 'color-mix(in srgb, var(--sgm-dice-face, #020617) 72%, #020617)',
          }}
        >
          {/* Top row: toggle + modifiers */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              onClick={() => setLogOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-800/50 px-2 py-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-200"
            >
              {logOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {logOpen ? 'Hide' : 'Rolls'}
              {rolls.length > 0 && (
                <span className="ml-0.5 rounded-full bg-crimson-500/20 px-1.5 text-[9px] font-bold text-crimson-300">
                  {rolls.length}
                </span>
              )}
            </button>

            {/* Modifier selector */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="hidden text-[10px] uppercase tracking-wider text-slate-600 sm:inline">Mod</span>
              {(['none', '+1', '+2'] as Modifier[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModifier(m)}
                  className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                    modifier === m
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-500 border border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {MOD_LABELS[m]}
                </button>
              ))}
              {/* Advantage — prominent high-contrast glow */}
              <button
                onClick={() => setModifier(modifier === 'adv' ? 'none' : 'adv')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                  modifier === 'adv'
                    ? 'border border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-md shadow-emerald-900/40'
                    : 'border border-slate-700/60 bg-slate-800/40 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400'
                }`}
              >
                <Sparkles size={11} />
                Adv
              </button>
              {/* Disadvantage — prominent high-contrast glow */}
              <button
                onClick={() => setModifier(modifier === 'dis' ? 'none' : 'dis')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                  modifier === 'dis'
                    ? 'border border-rose-400 bg-rose-500/20 text-rose-200 shadow-md shadow-rose-900/40'
                    : 'border border-slate-700/60 bg-slate-800/40 text-slate-500 hover:border-rose-500/30 hover:text-rose-400'
                }`}
              >
                <Zap size={11} />
                Dis
              </button>
              {/* Formula builder launcher */}
              <button
                onClick={() => setFormulaOpen(true)}
                title="Open formula builder"
                className="flex items-center gap-1 rounded-md border border-crimson-500/30 bg-crimson-500/10 px-2 py-1 text-[10px] font-bold text-crimson-300 transition-all hover:bg-crimson-500/20 hover:shadow-md hover:shadow-crimson-900/30"
              >
                <Dices size={12} />
                Formula
              </button>
            </div>
          </div>

          {/* Dice buttons */}
          <div className="flex items-end justify-between gap-1 sm:gap-2">
            {DICE.map((d) => (
              <button
                key={d.die}
                onClick={() => handleRoll(d.die)}
                disabled={rolling !== null}
                className={`group relative flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-1.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${d.glow} disabled:opacity-50 sm:py-2`}
                style={{
                  borderColor: 'color-mix(in srgb, var(--sgm-dice-accent, #64748b) 40%, transparent)',
                  background: 'color-mix(in srgb, var(--sgm-dice-face, #1e293b) 55%, #0f172a)',
                  color: 'var(--sgm-dice-accent, #e2e8f0)',
                }}
              >
                <span
                  className={`relative transition-transform group-hover:scale-110 ${
                    rolling === d.die
                      ? diceAnimation === 'excited'
                        ? `sgm-dice-roll-excited ${excitedFxClass(material)}`
                        : 'animate-spin'
                      : ''
                  }`}
                >
                  <DicePreview die={d.die} size={26} />
                </span>
                <span className="text-[10px] font-bold tracking-wide sm:text-xs">{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formula Builder Overlay */}
      <DiceFormulaBuilder
        open={formulaOpen}
        onClose={() => setFormulaOpen(false)}
        onRollComplete={handleFormulaComplete}
      />
    </div>
  );
}