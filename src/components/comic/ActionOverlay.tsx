import { useEffect, useState } from 'react';

export interface ActionEffect {
  text: string;
  color: string;
  rotation: number;
  x: number;
  y: number;
}

export function ActionOverlay({ effect }: { effect: ActionEffect | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (effect) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(t);
    }
  }, [effect]);

  if (!effect || !visible) return null;

  return (
    <div
      className="comic-action-burst comic-burst-anim text-2xl sm:text-3xl"
      style={{
        color: effect.color,
        left: `${effect.x}%`,
        top: `${effect.y}%`,
        transform: `rotate(${effect.rotation}deg)`,
        zIndex: 40,
      }}
    >
      <span className="comic-zap px-4 py-1">{effect.text}</span>
    </div>
  );
}

export function DiceRollOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="comic-dice-overlay">
      <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-crimson-500 bg-slate-900/90 shadow-[0_0_24px_rgba(220,38,38,0.4)]">
        <span className="text-3xl font-bold text-crimson-400 comic-dice-anim">d20</span>
      </div>
    </div>
  );
}
