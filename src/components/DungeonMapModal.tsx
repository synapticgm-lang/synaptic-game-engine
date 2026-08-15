import React, { useEffect, useMemo } from 'react';
import type { ActiveDungeonState, MapNode } from '../game/mapEngine';
import { buildLocalAreaMap, presentLocalAreaMap } from '../game/mapEngine';
import { isGenericMapPlace } from '../game/questPlay';
import type { Location3D } from '../game/types';

interface DungeonMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDungeon: ActiveDungeonState | null;
  currentCoordinates?: Location3D;
  currentLocation?: string;
  onMoveNode: (nodeId: string) => void;
  onExitDungeon: () => void;
  onEnsureLocalMap?: () => void;
  onLoadDungeon?: (
    blueprintId: string,
    dungeonName: string,
    isProcedural: boolean,
    tier: number,
    nodeCount: number
  ) => void;
}

export const DungeonMapModal: React.FC<DungeonMapModalProps> = ({
  isOpen,
  onClose,
  activeDungeon,
  currentCoordinates,
  currentLocation,
  onMoveNode,
  onExitDungeon,
  onEnsureLocalMap,
  onLoadDungeon,
}) => {
  useEffect(() => {
    if (isOpen) onEnsureLocalMap?.();
  }, [isOpen, activeDungeon, onEnsureLocalMap]);

  const displayDungeon = useMemo(() => {
    const raw = (() => {
      if (activeDungeon) return activeDungeon;
      const place = currentLocation?.trim();
      if (!place || isGenericMapPlace(place)) return null;
      return buildLocalAreaMap(place, [], currentCoordinates);
    })();
    if (!raw) return null;
    if (raw.blueprintId === 'local-area') return presentLocalAreaMap(raw, currentLocation);
    return raw;
  }, [activeDungeon, currentLocation, currentCoordinates]);

  if (!isOpen) return null;

  if (!displayDungeon) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-lg rounded-xl border border-blue-500/40 bg-slate-950 shadow-2xl shadow-blue-950/40 p-6 text-slate-100">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-blue-500/30">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-300 mb-1">System</p>
              <h2 className="text-xl font-bold text-blue-100">Local map pending</h2>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-200 border border-blue-800/50 text-sm transition"
            >
              ✕ Close
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            You are in <span className="font-medium text-blue-100">{currentLocation?.trim() || 'an unmapped place'}</span>.
            The System builds a street map from wherever you said you are — a Tesco Extra in England, a Kyoto alley, anywhere in the world.
          </p>
          <p className="mt-3 text-xs text-blue-400/70 font-mono uppercase tracking-wider">
            Name the street or store in play if this is still empty.
          </p>
        </div>
      </div>
    );
  }

  const currentNode = displayDungeon.nodes.find((n) => n.id === displayDungeon.currentNodeId);
  const isStreet = displayDungeon.blueprintId === 'local-area';

  const mapScaleStreet = 'Local streets · ~1 km scale';
  const mapScaleInterior = 'Interior floor plan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl rounded-xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Navigation Breadcrumbs & Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <span>🗺️ {isStreet ? mapScaleStreet : mapScaleInterior}</span>
              {!isStreet && displayDungeon.dangerTier != null && (
                <span className="rounded bg-rose-950/60 px-2 py-0.5 text-rose-200 border border-rose-800/40">
                  Danger Tier {displayDungeon.dangerTier}
                </span>
              )}
              {currentCoordinates && !isStreet && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                  q: {currentCoordinates.q}, r: {currentCoordinates.r} | Floor: {displayDungeon.currentZLevel}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {displayDungeon.dungeonName}
            </h2>
            <p className="text-xs text-slate-400">
              {isStreet ? 'You are here: ' : 'Current room: '}
              <span className="text-amber-300 font-semibold">{currentNode?.name || 'Unknown'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-sm transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Map Visualizer Canvas */}
        <div className="relative flex-1 my-4 min-h-[360px] overflow-auto rounded-lg bg-slate-950 border border-slate-800 p-4">
          {isStreet ? (
            <StreetMapCanvas
              dungeon={displayDungeon}
              currentNodeId={displayDungeon.currentNodeId}
              onMoveNode={onMoveNode}
              onEnterSite={
                onLoadDungeon
                  ? (siteName) => {
                      onLoadDungeon('grid', siteName, true, 1, 6);
                      onClose();
                    }
                  : undefined
              }
            />
          ) : (
            <InteriorFloorPlan
              dungeon={displayDungeon}
              currentNodeId={displayDungeon.currentNodeId}
              onMoveNode={onMoveNode}
            />
          )}
        </div>

        {/* Selected Node Details & Action Toolbar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="font-semibold text-cyan-300">{currentNode?.name}</p>
            {currentNode?.features?.primary && !isStreet && (
              <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300">
                Primary: {currentNode.features.primary}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-xs mb-3">{currentNode?.description}</p>

          <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
            <span className="text-xs text-slate-400">
              {isStreet
                ? `Places: ${displayDungeon.nodes.length}`
                : `Rooms: ${displayDungeon.visitedNodeIds.length} mapped / ${displayDungeon.nodes.length} on this floor`}
            </span>
            <button
              onClick={onExitDungeon}
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 text-xs transition"
            >
              {isStreet ? 'Close Map' : 'Exit Map Mode'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

function InteriorFloorPlan({
  dungeon,
  currentNodeId,
  onMoveNode,
}: {
  dungeon: ActiveDungeonState;
  currentNodeId: string;
  onMoveNode: (nodeId: string) => void;
}) {
  const nodes = dungeon.nodes;
  const xs = nodes.map((n) => n.coordinates?.x ?? 0);
  const ys = nodes.map((n) => n.coordinates?.y ?? 0);
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxX = Math.max(...xs, 1);
  const maxY = Math.max(...ys, 1);
  const cell = 108;
  const gap = 10;
  const pad = 28;
  const width = (maxX - minX + 1) * cell + pad * 2;
  const height = (maxY - minY + 1) * cell + pad * 2;
  const current = nodes.find((n) => n.id === currentNodeId);

  const roomBox = (node: MapNode) => {
    const gx = node.coordinates?.x ?? 0;
    const gy = node.coordinates?.y ?? 0;
    return {
      x: pad + (gx - minX) * cell,
      y: pad + (gy - minY) * cell,
      w: cell - gap,
      h: cell - gap,
    };
  };

  return (
    <div className="relative" style={{ minWidth: width, minHeight: height }}>
      <svg className="absolute inset-0" width={width} height={height} aria-hidden>
        <rect width={width} height={height} fill="#0b1220" />
        {nodes.map((node) =>
          node.connections.map((targetId) => {
            if (node.id >= targetId) return null;
            const target = nodes.find((n) => n.id === targetId);
            if (!target) return null;
            const a = roomBox(node);
            const b = roomBox(target);
            const visited = dungeon.visitedNodeIds.includes(node.id) || dungeon.visitedNodeIds.includes(targetId);
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={a.x + a.w / 2}
                y1={a.y + a.h / 2}
                x2={b.x + b.w / 2}
                y2={b.y + b.h / 2}
                stroke={visited ? '#334155' : '#1e293b'}
                strokeWidth={14}
                opacity={visited ? 0.7 : 0.35}
              />
            );
          })
        )}
        {nodes.map((node) => {
          const box = roomBox(node);
          const isVisited = dungeon.visitedNodeIds.includes(node.id);
          const isCurrent = node.id === currentNodeId;
          return (
            <rect
              key={`floor-${node.id}`}
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx={8}
              fill={isCurrent ? '#0e7490' : isVisited ? '#1e293b' : '#0f172a'}
              stroke={isCurrent ? '#a5f3fc' : isVisited ? '#64748b' : '#334155'}
              strokeWidth={isCurrent ? 2.5 : 1.5}
              strokeDasharray={isVisited ? undefined : '5 4'}
              opacity={isVisited ? 1 : 0.55}
            />
          );
        })}
      </svg>
      {nodes.map((node) => {
        const box = roomBox(node);
        const isVisited = dungeon.visitedNodeIds.includes(node.id);
        const isCurrent = node.id === currentNodeId;
        const isReachable = !!current?.connections.includes(node.id);
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => isReachable && onMoveNode(node.id)}
            disabled={!isReachable && !isCurrent}
            title={isVisited ? node.name : 'Unmapped room'}
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
            className="absolute z-10 flex flex-col items-center justify-center px-1 text-center"
          >
            {isVisited ? (
              <>
                <span className={`text-[11px] font-medium leading-tight ${isCurrent ? 'text-white' : 'text-slate-100'}`}>
                  {node.name}
                </span>
                {isCurrent && <span className="mt-0.5 text-[8px] uppercase tracking-wide text-cyan-100">You are here</span>}
              </>
            ) : (
              <span className="text-[10px] text-slate-600"> </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function streetPx(node: MapNode) {
  const gx = node.coordinates?.x ?? 2;
  const gy = node.coordinates?.y ?? 2;
  return { x: 40 + gx * 120, y: 40 + gy * 120 };
}

function StreetMapCanvas({
  dungeon,
  currentNodeId,
  onMoveNode,
  onEnterSite,
}: {
  dungeon: ActiveDungeonState;
  currentNodeId: string;
  onMoveNode: (nodeId: string) => void;
  onEnterSite?: (siteName: string) => void;
}) {
  const roads = [40, 160, 280, 400, 520];
  const size = 560;
  const current = dungeon.nodes.find((n) => n.id === currentNodeId);

  return (
    <div className="relative min-w-[560px] min-h-[560px]">
      <svg className="absolute inset-0 h-[560px] w-[560px]" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <rect width={size} height={size} fill="#0b1220" />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={roads[col]! + 18}
              y={roads[row]! + 18}
              width={roads[col + 1]! - roads[col]! - 36}
              height={roads[row + 1]! - roads[row]! - 36}
              rx={10}
              fill={(row + col) % 2 === 0 ? '#1e293b' : '#172033'}
              stroke="#334155"
              strokeWidth={1}
            />
          ))
        )}
        {roads.map((p) => (
          <g key={`road-${p}`}>
            <rect x={p - 13} y={28} width={26} height={size - 56} fill="#475569" />
            <rect x={28} y={p - 13} width={size - 56} height={26} fill="#475569" />
            <line
              x1={p}
              y1={36}
              x2={p}
              y2={size - 36}
              stroke="#eab308"
              strokeWidth={1.2}
              strokeDasharray="7 11"
              opacity={0.4}
            />
            <line
              x1={36}
              y1={p}
              x2={size - 36}
              y2={p}
              stroke="#eab308"
              strokeWidth={1.2}
              strokeDasharray="7 11"
              opacity={0.4}
            />
          </g>
        ))}
        <text x={size - 52} y={22} fill="#64748b" fontSize="11" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">
          N
        </text>
        <polygon points={`${size - 52},6 ${size - 58},16 ${size - 46},16`} fill="#94a3b8" />
        <rect x={36} y={size - 22} width={72} height={3} fill="#94a3b8" />
        <text x={36} y={size - 8} fill="#64748b" fontSize="9" fontFamily="ui-sans-serif, system-ui">
          ≈ 1 km
        </text>
      </svg>

      {dungeon.nodes.map((node) => {
        const { x, y } = streetPx(node);
        const isCurrent = node.id === currentNodeId;
        const canMove = !!current?.connections.includes(node.id);
        const isEntrance = (node.tags ?? []).some(
          (t) => t === 'entrance' || t === 'micro_dungeon'
        );
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => {
              if (isEntrance && isCurrent && onEnterSite) {
                onEnterSite(node.name);
                return;
              }
              if (canMove) onMoveNode(node.id);
            }}
            disabled={!canMove && !isCurrent}
            title={isEntrance ? `${node.name} (enter site)` : node.name}
            style={{ left: `${x - 70}px`, top: `${y - 18}px` }}
            className={`absolute z-10 w-[140px] rounded-md border px-2 py-1.5 text-center shadow-md ${
              isCurrent
                ? 'border-cyan-200 bg-cyan-700/95 text-white'
                : isEntrance
                  ? 'border-amber-500/80 bg-slate-900/95 text-amber-50 hover:border-amber-300'
                  : 'border-slate-500/80 bg-slate-900/90 text-slate-100 hover:border-cyan-400'
            } ${canMove || (isEntrance && isCurrent) ? 'cursor-pointer' : ''}`}
          >
            <span className="block text-[11px] font-medium leading-tight break-words">
              {isEntrance ? '🚪 ' : ''}
              {node.name}
            </span>
            {isEntrance && (
              <span className="mt-0.5 block text-[8px] uppercase tracking-wide text-amber-200/90">
                {isCurrent ? 'Tap to enter' : 'Site entrance'}
              </span>
            )}
            {isCurrent && !isEntrance && (
              <span className="mt-0.5 block text-[8px] uppercase tracking-wide text-cyan-100">You are here</span>
            )}
          </button>
        );
      })}
    </div>
  );
}