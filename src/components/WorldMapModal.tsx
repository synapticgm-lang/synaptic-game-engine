import React, { useRef, useState } from 'react';
import type { WorldMapLayout } from '@/game/worldMapLayout';

/** WM-b: biome tint for a settlement glyph (our own palette; no outside art). */
const BIOME_TINT: Record<string, string> = {
  forest: '#4ade80', farm: '#facc15', coast: '#38bdf8', shore: '#38bdf8', desert: '#fb923c', mountain: '#a8a29e',
  swamp: '#84cc16', tundra: '#e0f2fe', city: '#e2e8f0', ruin: '#c084fc', plains: '#bef264', hills: '#d6d3d1',
};
const tint = (biome: string) => BIOME_TINT[biome?.toLowerCase()] ?? '#cbd5e1';

/** Glyph shape by settlement kind: a city is a square, a town a diamond, the rest a circle. */
function Glyph({ kind, x, y, fill, faded }: { kind: string; x: number; y: number; fill: string; faded: boolean }) {
  const op = faded ? 0.45 : 1;
  if (kind === 'city' || kind === 'fort' || kind === 'district') return <rect x={x - 9} y={y - 9} width={18} height={18} rx={3} fill={fill} opacity={op} stroke="#0f172a" strokeWidth={2} />;
  if (kind === 'town') return <polygon points={`${x},${y - 11} ${x + 11},${y} ${x},${y + 11} ${x - 11},${y}`} fill={fill} opacity={op} stroke="#0f172a" strokeWidth={2} />;
  return <circle cx={x} cy={y} r={8} fill={fill} opacity={op} stroke="#0f172a" strokeWidth={2} />;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  layout: WorldMapLayout | null;
  title?: string;
}

/** World map: our own SVG. Pan with a drag, zoom with the wheel or two fingers; full-screen sheet on phones. Read-only (no fast travel in v1). */
export const WorldMapModal: React.FC<Props> = ({ isOpen, onClose, layout, title }) => {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [picked, setPicked] = useState<string | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  if (!isOpen) return null;
  const regionName = (id: string) => layout?.regions.find((r) => r.id === id);
  const zoom = (f: number) => setView((v) => ({ ...v, k: Math.min(4, Math.max(0.5, v.k * f)) }));
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinch.current) zoom(d / pinch.current);
      pinch.current = d;
      return;
    }
    setView((v) => ({ ...v, x: v.x + (e.clientX - prev.x) / v.k, y: v.y + (e.clientY - prev.y) / v.k }));
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const pickedNode = layout?.settlements.find((s) => s.id === picked) ?? layout?.regions.find((r) => r.id === picked);
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" data-testid="world-map">
      <div className="sgm-turn-frame sgm-info-panel relative flex h-[100dvh] w-full flex-col overflow-hidden shadow-2xl sm:h-[min(85vh,100dvh)] sm:max-w-4xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-black/20 px-4 py-3">
          <h2 className="sgm-info-heading text-lg font-bold uppercase tracking-wide">{title ?? 'World Map'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => zoom(1.25)} aria-label="Zoom in" className="h-11 w-11 rounded border border-slate-700 text-slate-200">+</button>
            <button onClick={() => zoom(0.8)} aria-label="Zoom out" className="h-11 w-11 rounded border border-slate-700 text-slate-200">-</button>
            <button onClick={onClose} aria-label="Close map" className="h-11 w-11 rounded text-slate-400 hover:text-white">X</button>
          </div>
        </div>
        {!layout ? (
          <p className="p-6 text-sm text-slate-400">This story has no world map.</p>
        ) : (
          <svg
            className="flex-1 touch-none select-none bg-slate-950"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onWheel={(e) => zoom(e.deltaY < 0 ? 1.1 : 0.9)}
            role="img"
            aria-label="World map"
          >
            <g transform={`translate(${layout.width / 2} ${layout.height / 2}) scale(${view.k}) translate(${-layout.width / 2 + view.x} ${-layout.height / 2 + view.y})`}>
              {layout.roads.map((r) => {
                const a = regionName(r.from)!;
                const b = regionName(r.to)!;
                return <line key={`${r.from}-${r.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#64748b" strokeWidth={3} strokeDasharray={r.known ? undefined : '10 8'} />;
              })}
              {layout.regions.filter((r) => r.revealed).map((r) => (
                <g key={r.id} onClick={() => setPicked(r.id)}>
                  <circle cx={r.x} cy={r.y} r={95} fill={r.current ? '#1e293b' : '#0f172a'} stroke={r.current ? '#38bdf8' : '#334155'} strokeWidth={2} opacity={0.8} />
                  <text x={r.x} y={r.y - 100} textAnchor="middle" fill="#cbd5e1" fontSize={22}>{r.name}</text>
                </g>
              ))}
              {layout.settlements.map((s) => (
                <g key={s.id} onClick={() => setPicked(s.id)} data-fog={s.fog}>
                  {/* 44px tap target */}
                  <circle cx={s.x} cy={s.y} r={22} fill="transparent" />
                  <Glyph kind={s.kind} x={s.x} y={s.y} fill={s.fog === 'visited' ? tint(s.biome) : '#64748b'} faded={s.fog !== 'visited'} />
                  <text x={s.x} y={s.y + 26} textAnchor="middle" fill={s.fog === 'visited' ? '#e2e8f0' : '#94a3b8'} fontSize={16}>{s.name}</text>
                </g>
              ))}
              {layout.marker && (
                <g data-testid="world-map-marker">
                  <circle cx={layout.marker.x} cy={layout.marker.y} r={13} fill="none" stroke="#f43f5e" strokeWidth={4} />
                  <circle cx={layout.marker.x} cy={layout.marker.y} r={5} fill="#f43f5e" />
                </g>
              )}
            </g>
          </svg>
        )}
        {pickedNode && (
          <div className="border-t border-slate-800 bg-black/30 px-4 py-2 text-sm text-slate-200">{pickedNode.name}</div>
        )}
      </div>
    </div>
  );
};
