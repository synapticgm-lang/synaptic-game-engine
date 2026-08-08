import { useCallback, useMemo, useState } from 'react';
import {
  X, Plus, Minus, Dices, Trash2, Sparkles, ChevronRight, Zap,
} from 'lucide-react';

type DieType = 4 | 6 | 8 | 10 | 12 | 20;

interface DiceToken {
  id: string;
  type: 'dice';
  count: number;
  die: DieType;
  sign: '+' | '-';
}

interface ModifierToken {
  id: string;
  type: 'modifier';
  value: number;
  sign: '+' | '-';
}

type FormulaToken = DiceToken | ModifierToken;

interface RollComponent {
  token: FormulaToken;
  rolls: number[];
  subtotal: number;
}

interface RollResult {
  total: number;
  components: RollComponent[];
  advantage: boolean;
  disadvantage: boolean;
  breakdown: string;
}

const DICE: { die: DieType; label: string; color: string; glow: string }[] = [
  { die: 4,  label: 'd4',  color: 'text-rose-300',     glow: 'hover:shadow-rose-500/30' },
  { die: 6,  label: 'd6',  color: 'text-amber-300',    glow: 'hover:shadow-amber-500/30' },
  { die: 8,  label: 'd8',  color: 'text-emerald-300',  glow: 'hover:shadow-emerald-500/30' },
  { die: 10, label: 'd10', color: 'text-sky-300',      glow: 'hover:shadow-sky-500/30' },
  { die: 12, label: 'd12', color: 'text-violet-300',   glow: 'hover:shadow-violet-500/30' },
  { die: 20, label: 'd20', color: 'text-crimson-300',  glow: 'hover:shadow-crimson-500/40' },
];

function dieShape(die: DieType): string {
  switch (die) {
    case 4:  return 'M12 3 L21 19 L3 19 Z';
    case 6:  return 'M5 5 H19 V19 H5 Z';
    case 8:  return 'M12 3 L21 12 L12 21 L3 12 Z';
    case 10: return 'M12 3 L20 9 L17 19 L7 19 L4 9 Z';
    case 12: return 'M12 3 L19 7 L19 17 L12 21 L5 17 L5 7 Z';
    case 20: return 'M12 2 L21 8 L18 19 L6 19 L3 8 Z';
  }
}

function rollDie(sides: DieType): number {
  return Math.floor(Math.random() * sides) + 1;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onRollComplete?: (result: RollResult) => void;
}

export type { RollResult };

export function DiceFormulaBuilder({ open, onClose, onRollComplete }: Props) {
  const [tokens, setTokens] = useState<FormulaToken[]>([]);
  const [pendingSign, setPendingSign] = useState<'+' | '-'>('+');
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [result, setResult] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState(false);

  const addDie = useCallback((die: DieType) => {
    setTokens((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === 'dice' && last.die === die && last.sign === pendingSign) {
        return [...prev.slice(0, -1), { ...last, count: last.count + 1 }];
      }
      return [...prev, { id: uid(), type: 'dice', count: 1, die, sign: pendingSign }];
    });
    setResult(null);
  }, [pendingSign]);

  const addModifier = useCallback((value: number) => {
    if (value <= 0) return;
    setTokens((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === 'modifier' && last.sign === pendingSign) {
        return [...prev.slice(0, -1), { ...last, value: last.value + value }];
      }
      return [...prev, { id: uid(), type: 'modifier', value, sign: pendingSign }];
    });
    setResult(null);
  }, [pendingSign]);

  const removeLast = useCallback(() => {
    setTokens((prev) => prev.slice(0, -1));
    setResult(null);
  }, []);

  const clearAll = useCallback(() => {
    setTokens([]);
    setResult(null);
    setAdvantage(false);
    setDisadvantage(false);
  }, []);

  const toggleAdvantage = useCallback(() => {
    setAdvantage((v) => !v);
    if (disadvantage) setDisadvantage(false);
  }, [disadvantage]);

  const toggleDisadvantage = useCallback(() => {
    setDisadvantage((v) => !v);
    if (advantage) setAdvantage(false);
  }, [advantage]);

  const formulaString = useMemo(() => {
    if (tokens.length === 0) return 'Empty';
    return tokens.map((t, i) => {
      const prefix = i === 0 ? (t.sign === '-' ? '-' : '') : ` ${t.sign} `;
      if (t.type === 'dice') return `${prefix}${t.count}d${t.die}`;
      return `${prefix}${t.value}`;
    }).join('');
  }, [tokens]);

  const hasDice = useMemo(() => tokens.some((t) => t.type === 'dice'), [tokens]);

  const executeRoll = useCallback(() => {
    if (!hasDice || rolling) return;
    setRolling(true);
    setTimeout(() => {
      const components: RollComponent[] = tokens.map((token) => {
        if (token.type === 'dice') {
          let rolls: number[] = [];
          if (token.die === 20 && (advantage || disadvantage)) {
            const r1 = rollDie(20);
            const r2 = rollDie(20);
            const chosen = advantage ? Math.max(r1, r2) : Math.min(r1, r2);
            rolls = [r1, r2];
            return { token, rolls, subtotal: (token.sign === '-' ? -1 : 1) * chosen * token.count };
          }
          rolls = Array.from({ length: token.count }, () => rollDie(token.die));
          const sum = rolls.reduce((a, b) => a + b, 0);
          return { token, rolls, subtotal: (token.sign === '-' ? -1 : 1) * sum };
        }
        return { token, rolls: [], subtotal: (token.sign === '-' ? -1 : 1) * token.value };
      });

      const total = components.reduce((a, c) => a + c.subtotal, 0);
      const breakdown = components.map((c) => {
        if (c.token.type === 'dice') {
          const rollStr = c.rolls.length > 1 ? `[${c.rolls.join(', ')}]` : c.rolls[0]?.toString() ?? '';
          return `${c.token.count}d${c.token.die}: ${rollStr} = ${Math.abs(c.subtotal)}`;
        }
        return `${c.token.sign}${c.token.value}`;
      }).join(' | ');

      const res: RollResult = { total, components, advantage, disadvantage, breakdown };
      setResult(res);
      setRolling(false);
      onRollComplete?.(res);
    }, 500);
  }, [hasDice, rolling, tokens, advantage, disadvantage, onRollComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-slate-700/60 bg-slate-950/90 shadow-2xl shadow-black/60 backdrop-blur-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="flex items-center gap-2 font-serif text-sm font-bold uppercase tracking-wider text-crimson-300">
            <Dices size={16} />
            Formula Builder
          </span>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-4">
          {/* Formula display */}
          <div className="mb-3 rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-600">Current Formula</div>
            <div className="font-mono text-lg font-bold text-slate-100">
              {formulaString}
              {advantage && <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">ADV</span>}
              {disadvantage && <span className="ml-2 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">DIS</span>}
            </div>
          </div>

          {/* Result Panel */}
          {result && <ResultPanel result={result} />}

          {/* Dice buttons */}
          <div className="mb-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-600">Tap dice to add</div>
            <div className="grid grid-cols-6 gap-1.5">
              {DICE.map((d) => (
                <button
                  key={d.die}
                  onClick={() => addDie(d.die)}
                  disabled={rolling}
                  className={`group flex flex-col items-center gap-0.5 rounded-lg border border-slate-700/50 bg-slate-800/40 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700/40 hover:shadow-lg ${d.glow} disabled:opacity-50`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-6 w-6 transition-transform group-hover:scale-110 ${d.color} ${rolling ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                  >
                    <path d={dieShape(d.die)} />
                  </svg>
                  <span className={`text-[10px] font-bold ${d.color}`}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Operators + modifiers */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setPendingSign('+')}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-bold transition-all ${
                  pendingSign === '+' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setPendingSign('-')}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-bold transition-all ${
                  pendingSign === '-' ? 'border-rose-500/50 bg-rose-500/15 text-rose-300' : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Minus size={18} />
              </button>
            </div>

            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => addModifier(n)}
                  className="flex-1 rounded-lg border border-slate-700/50 bg-slate-800/40 py-2 text-sm font-bold text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-700/40"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Advantage / Disadvantage — prominent toggles */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={toggleAdvantage}
              className={`relative flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                advantage
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-900/40'
                  : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400'
              }`}
            >
              {advantage && <span className="absolute inset-0 animate-pulse rounded-xl bg-emerald-500/5" />}
              <Sparkles size={16} className="relative" />
              Advantage
            </button>
            <button
              onClick={toggleDisadvantage}
              className={`relative flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                disadvantage
                  ? 'border-rose-400 bg-rose-500/20 text-rose-200 shadow-lg shadow-rose-900/40'
                  : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:border-rose-500/30 hover:text-rose-400'
              }`}
            >
              {disadvantage && <span className="absolute inset-0 animate-pulse rounded-xl bg-rose-500/5" />}
              <Zap size={16} className="relative" />
              Disadvantage
            </button>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2">
            <button
              onClick={removeLast}
              disabled={tokens.length === 0}
              className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-xs font-medium text-slate-400 transition-all hover:text-slate-200 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              onClick={clearAll}
              disabled={tokens.length === 0}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-xs font-medium text-slate-400 transition-all hover:text-rose-400 disabled:opacity-40"
            >
              <Trash2 size={12} />
              Clear
            </button>
            <button
              onClick={executeRoll}
              disabled={!hasDice || rolling}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-crimson-500/40 bg-crimson-500/15 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-crimson-200 transition-all hover:bg-crimson-500/25 hover:shadow-lg hover:shadow-crimson-900/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {rolling ? (
                <>
                  <Dices size={16} className="animate-spin" />
                  Rolling...
                </>
              ) : (
                <>
                  <Dices size={16} />
                  Roll Formula
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ RESULT PANEL ============ */

function ResultPanel({ result }: { result: RollResult }) {
  const isCrit = result.components.some((c) => c.token.type === 'dice' && c.token.die === 20 && c.rolls.includes(20));
  const isFumble = result.components.some((c) => c.token.type === 'dice' && c.token.die === 20 && c.rolls.includes(1));

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-md">
      {/* Total header */}
      <div className={`flex items-center justify-between border-b border-slate-800 px-4 py-3 ${
        isCrit ? 'bg-emerald-950/30' : isFumble ? 'bg-rose-950/30' : 'bg-slate-950/40'
      }`}>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-600">Total</div>
          <div className={`font-mono text-3xl font-black ${
            isCrit ? 'text-emerald-300' : isFumble ? 'text-rose-300' : 'text-slate-100'
          }`}>
            {result.total}
            {isCrit && <span className="ml-2 text-lg text-emerald-400">CRIT!</span>}
            {isFumble && <span className="ml-2 text-lg text-rose-400">FUMBLE</span>}
          </div>
        </div>
        {result.advantage && <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">ADV</span>}
        {result.disadvantage && <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">DIS</span>}
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 p-3">
        {result.components.map((comp, i) => {
          if (comp.token.type === 'dice') {
            const sign = comp.token.sign === '-' ? '-' : '+';
            const isD20Adv = comp.token.die === 20 && (result.advantage || result.disadvantage);
            const chosen = isD20Adv ? (result.advantage ? Math.max(...comp.rolls) : Math.min(...comp.rolls)) : null;
            return (
              <div key={comp.token.id} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
                <span className="font-mono text-xs font-bold text-slate-300">
                  {sign}{comp.token.count}d{comp.token.die}
                </span>
                <div className="flex flex-wrap gap-1">
                  {comp.rolls.map((r, ri) => (
                    <span
                      key={ri}
                      className={`flex h-6 min-w-6 items-center justify-center rounded border px-1 font-mono text-xs font-bold ${
                        r === 20 ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                        : r === 1 ? 'border-rose-500/50 bg-rose-950/40 text-rose-300'
                        : chosen !== null && r === chosen ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
                        : chosen !== null && r !== chosen ? 'border-slate-700 bg-slate-900/40 text-slate-600 line-through'
                        : 'border-slate-700 bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <span className="ml-auto font-mono text-xs font-bold text-slate-200">
                  = {comp.subtotal > 0 ? '+' : ''}{comp.subtotal}
                </span>
              </div>
            );
          }
          return (
            <div key={comp.token.id} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
              <span className="font-mono text-xs font-bold text-slate-400">
                {comp.token.sign}{comp.token.value}
              </span>
              <span className="ml-auto font-mono text-xs font-bold text-slate-300">
                = {comp.subtotal > 0 ? '+' : ''}{comp.subtotal}
              </span>
            </div>
          );
        })}
      </div>

      {/* Breakdown string */}
      <div className="border-t border-slate-800 bg-slate-950/50 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ChevronRight size={12} className="shrink-0 text-slate-600" />
          <span className="font-mono text-[11px] leading-snug text-slate-500">
            {result.breakdown}
          </span>
        </div>
      </div>
    </div>
  );
}
