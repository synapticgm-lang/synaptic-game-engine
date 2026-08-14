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

  const getNodePos = (node: MapNode) => {
    const x = (node.coordinates?.x ?? 0) * 120 + 80;
    const y = (node.coordinates?.y ?? 0) * 120 + 80;
    return { x, y };
  };

  /** Map scale only — never dungeon danger. */
  const scaleNames: Record<number, string> = {
    1: 'World map · 100 km scale',
    2: 'Region map · 10 km scale',
    3: 'Local streets · 1 km scale',
    4: 'Tactical interior',
  };
  const mapScaleStreet = 'Local streets · ~1 km scale';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl rounded-xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Navigation Breadcrumbs & Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <span>🗺️ {isStreet ? mapScaleStreet : (scaleNames[displayDungeon.tier] ?? 'Map')}</span>
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
              {isStreet ? 'You are here: ' : 'Active Node: '}
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
            <>
              <svg className="absolute inset-0 w-full h-full min-w-[500px] min-h-[500px] pointer-events-none">
                {displayDungeon.nodes.map((node) => {
                  const start = getNodePos(node);
                  const isVisited = displayDungeon.visitedNodeIds.includes(node.id);

                  return node.connections.map((targetId) => {
                    const targetNode = displayDungeon.nodes.find((n) => n.id === targetId);
                    if (!targetNode) return null;
                    const end = getNodePos(targetNode);
                    const isTargetVisited = displayDungeon.visitedNodeIds.includes(targetId);
                    const lineVisible = isVisited || isTargetVisited;

                    return (
                      <line
                        key={`${node.id}-${targetId}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={lineVisible ? (isVisited && isTargetVisited ? '#38bdf8' : '#475569') : '#0f172a'}
                        strokeWidth={lineVisible ? '3' : '1'}
                        strokeDasharray={!isVisited || !isTargetVisited ? '4 4' : undefined}
                        opacity={lineVisible ? 0.8 : 0.2}
                      />
                    );
                  });
                })}
              </svg>

              <div className="relative min-w-[500px] min-h-[500px]">
                {displayDungeon.nodes.map((node) => {
                  const { x, y } = getNodePos(node);
                  const isCurrent = node.id === displayDungeon.currentNodeId;
                  const isVisited = displayDungeon.visitedNodeIds.includes(node.id);
                  const isReachable = currentNode?.connections.includes(node.id);

                  if (!isVisited && !isReachable) {
                    return (
                      <div
                        key={node.id}
                        style={{ left: `${x - 20}px`, top: `${y - 20}px` }}
                        className="absolute w-10 h-10 rounded-full bg-slate-900/40 border border-slate-800 flex items-center justify-center text-xs text-slate-700"
                        title="Unexplored Fog"
                      >
                        ?
                      </div>
                    );
                  }

                  return (
                    <button
                      key={node.id}
                      onClick={() => isReachable && onMoveNode(node.id)}
                      disabled={!isReachable && !isCurrent}
                      style={{ left: `${x - 48}px`, top: `${y - 22}px` }}
                      className={`absolute w-24 min-h-[44px] rounded-md border px-1.5 py-1 transition-colors flex flex-col items-center justify-center text-center ${
                        isCurrent
                          ? 'bg-cyan-700/90 border-cyan-200 text-white z-20'
                          : isVisited
                          ? 'bg-slate-800 border-slate-500 text-slate-200 hover:border-cyan-400 z-10'
                          : 'bg-slate-800/90 border-amber-600/70 text-amber-100 z-10 cursor-pointer'
                      }`}
                    >
                      <span className="text-[10px] leading-tight font-medium line-clamp-2 max-w-full">
                        {node.name}
                      </span>
                      {isCurrent && <span className="text-[8px] text-cyan-200">You are here</span>}
                    </button>
                  );
                })}
              </div>
            </>
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
                : `Discovered: ${displayDungeon.visitedNodeIds.length} / ${displayDungeon.nodes.length} sectors`}
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