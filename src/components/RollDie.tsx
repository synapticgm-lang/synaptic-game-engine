import { createContext, useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { DiceAnimationMode } from '@/game/types';
import { emitDiceRoll, rollAnimationMs, rollAnimationScale, splitRollLine, type ShownD20 } from '@/game/rules/rollView';
import { DicePreview, liveDiceItem } from './DicePreview';

/** The player's roll animation setting and the newest GM entry (only its rolls animate; history does not re-roll). */
export const RollDisplayContext = createContext<{ mode: DiceAnimationMode; newestEntryId: string | null }>({
  mode: 'normal',
  newestEntryId: null,
});

/** One shown STATUS line with the player's die in front of every d20 the engine printed. The text is unchanged. */
export function RollLine({ line, entryId }: { line: string; entryId: string }) {
  const parts = splitRollLine(line);
  if (!parts.some((p) => p.roll)) return <>{line}</>;
  return (
    <>
      {parts.map((p, i) => (p.roll ? (
        <span key={i} className="whitespace-nowrap">
          <RollDie roll={p.roll} entryId={entryId} />
          {p.text}
        </span>
      ) : (
        <span key={i}>{p.text}</span>
      )))}
    </>
  );
}

/**
 * The engine's d20 in the player's dice skin and roll animation. The number is the one the engine printed;
 * nothing is rolled here. Crit and fumble glow after it lands.
 */
export function RollDie({ roll, entryId }: { roll: ShownD20; entryId: string }) {
  const { mode, newestEntryId } = useContext(RollDisplayContext);
  const animate = entryId === newestEntryId;
  const { kept } = roll;
  const ms = animate ? rollAnimationMs(mode, kept) : 0;
  const [rolling, setRolling] = useState(ms > 0);
  const fired = useRef(false);

  useEffect(() => {
    if (!animate) {
      setRolling(false);
      return;
    }
    if (!fired.current) {
      fired.current = true;
      emitDiceRoll({ kept, crit: kept === 20, fumble: kept === 1, mode, material: liveDiceItem().diceSkin?.material ?? null, source: 'engine' });
    }
    if (ms <= 0) return;
    const t = window.setTimeout(() => setRolling(false), ms);
    return () => window.clearTimeout(t);
  }, [kept, animate, mode, ms]);

  const material = liveDiceItem().diceSkin?.material;
  const fx = mode === 'excited' ? `sgm-dice-roll-excited sgm-dice-fx-${material ?? 'default'}` : 'sgm-dice-roll-normal';
  const style = { '--sgm-roll-ms': `${ms}ms`, '--sgm-roll-scale': rollAnimationScale(mode, kept) } as CSSProperties;
  const result = roll.crit ? 'crit' : roll.fumble ? 'fumble' : 'plain';
  return (
    <span
      className="sgm-roll-die mr-1 inline-flex align-middle"
      data-roll-result={result}
      data-roll-kept={kept}
      data-testid="roll-die"
      title={roll.dice.length > 1 ? `d20 ${roll.dice.join(' and ')}, kept ${kept}` : `d20 ${kept}`}
    >
      <span className={`inline-flex ${rolling ? fx : result === 'plain' ? '' : `sgm-roll-${result}`}`} style={style}>
        <DicePreview die={20} size={16} />
      </span>
    </span>
  );
}
