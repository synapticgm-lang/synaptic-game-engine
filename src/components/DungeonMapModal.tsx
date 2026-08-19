import React, { useEffect, useMemo } from 'react';
import type { ActiveDungeonState, MapNode } from '../game/mapEngine';
import { presentLocalAreaMap, resolvePlayAreaMap } from '../game/mapEngine';
import { isGenericMapPlace } from '../game/questPlay';
import { isInteriorMap, isInteriorPlace, isStreetMap } from '../game/placeAuthority';
import type { Location3D } from '../game/types';

interface DungeonMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDungeon: ActiveDungeonState | null;
  currentCoordinates?: Location3D;
  currentLocation?: string;
  combatLocked?: boolean;
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
  combatLocked = false,
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
      return resolvePlayAreaMap(null, place, [], currentCoordinates);
    })();
    if (!raw) return null;
    if (isStreetMap(raw)) return presentLocalAreaMap(raw, currentLocation);
    return raw;
  }, [activeDungeon, currentLocation, currentCoordinates]);

  if (!isOpen) return null;

  if (!displayDungeon) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="sgm-turn-frame sgm-info-panel relative w-full max-w-lg rounded-xl border shadow-2xl p-6">
          <div className="sgm-turn-frame-bar h-1 w-full -mx-6 -mt-6 mb-4 rounded-t-xl" />
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <p className="sgm-info-accent font-mono text-[10px] uppercase tracking-[0.2em] mb-1">System</p>
              <h2 className="sgm-info-heading text-xl font-bold">Local map pending</h2>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm transition"
            >
              ✕ Close
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            You are in <span className="font-medium sgm-info-accent">{currentLocation?.trim() || 'an unmapped place'}</span>.
            {isInteriorPlace(currentLocation)
              ? ' The System sketches a floor plan of this interior from rooms named in play.'
              : ' The System builds a street map from wherever you said you are — a Tesco Extra in England, a Kyoto alley, anywhere in the world.'}
          </p>
          <p className="mt-3 text-xs sgm-info-accent font-mono uppercase tracking-wider opacity-80">
            {isInteriorPlace(currentLocation)
              ? 'Named rooms in the scene appear as you explore them.'
              : 'Name the street or store in play if this is still empty.'}
          </p>
        </div>
      </div>
    );
  }

  const currentNode = displayDungeon.nodes.find((n) => n.id === displayDungeon.currentNodeId);
  const isStreet = isStreetMap(displayDungeon);
  const isHallPlan = isInteriorMap(displayDungeon);

  const mapScaleStreet = 'Local streets · ~1 km scale';
  const mapScaleInterior = 'Interior floor plan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="sgm-turn-frame sgm-info-panel relative w-full max-w-4xl rounded-xl border p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="sgm-turn-frame-bar h-1 w-full -mx-6 -mt-6 mb-4 rounded-t-xl" />
        
        {/* Navigation Breadcrumbs & Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-700/80">
          <div>
            <div className="sgm-info-accent flex items-center gap-2 text-xs font-semibold mb-1">
              <span>🗺️ {isStreet ? mapScaleStreet : mapScaleInterior}</span>
              {!isStreet && !isHallPlan && displayDungeon.dangerTier != null && (
                <span className="rounded bg-rose-950/60 px-2 py-0.5 text-rose-200 border border-rose-800/40">
                  Danger Tier {displayDungeon.dangerTier}
                </span>
              )}
              {currentCoordinates && !isStreet && !isHallPlan && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                  q: {currentCoordinates.q}, r: {currentCoordinates.r} | Floor: {displayDungeon.currentZLevel}
                </span>
              )}
            </div>
            <h2 className="sgm-info-heading text-xl font-bold flex items-center gap-2">
              {displayDungeon.dungeonName}
            </h2>
            <p className="text-xs text-slate-400">
              {isStreet ? 'You are here: ' : 'Current room: '}
              <span className="text-amber-300 font-semibold">{currentNode?.name || 'Unknown'}</span>
            </p>
            {combatLocked && (
              <p className="mt-1 text-xs text-rose-300 font-medium">
                Combat in progress — resolve the fight or flee before moving.
              </p>
            )}
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
              combatLocked={combatLocked}
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
              organic={isHallPlan}
              combatLocked={combatLocked}
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
  organic = false,
  combatLocked = false,
}: {
  dungeon: ActiveDungeonState;
  currentNodeId: string;
  onMoveNode: (nodeId: string) => void;
  organic?: boolean;
  combatLocked?: boolean;
}) {
  const nodes = dungeon.nodes;
  const xs = nodes.map((n) => n.coordinates?.x ?? 0);
  const ys = nodes.map((n) => n.coordinates?.y ?? 0);
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxX = Math.max(...xs, 1);
  const maxY = Math.max(...ys, 1);
  const cell = organic ? 148 : 108;
  const gap = organic ? 28 : 10;
  const pad = organic ? 40 : 28;
  const width = (maxX - minX + 1) * cell + pad * 2;
  const height = (maxY - minY + 1) * cell + pad * 2;
  const current = nodes.find((n) => n.id === currentNodeId);

  const roomBox = (node: MapNode) => {
    const gx = node.coordinates?.x ?? 0;
    const gy = node.coordinates?.y ?? 0;
    const here = (node.tags ?? []).includes('here');
    return {
      x: pad + (gx - minX) * cell,
      y: pad + (gy - minY) * cell,
      w: cell - gap + (organic && here ? 36 : 0),
      h: cell - gap + (organic && here ? 24 : 0),
    };
  };

  return (
    <div className="relative" style={{ minWidth: width, minHeight: height }}>
      <svg className="absolute inset-0" width={width} height={height} aria-hidden>
        <rect width={width} height={height} fill={organic ? '#14110c' : '#0b1220'} />
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
              rx={organic ? 4 : 8}
              fill={
                isCurrent
                  ? organic ? '#5c4a32' : '#0e7490'
                  : isVisited
                    ? organic ? '#2c2822' : '#1e293b'
                    : organic ? '#161410' : '#0f172a'
              }
              stroke={
                isCurrent
                  ? organic ? '#e8d5a3' : '#a5f3fc'
                  : isVisited
                    ? organic ? '#8a7a5e' : '#64748b'
                    : organic ? '#3d382f' : '#334155'
              }
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
        const isReachable = !combatLocked && !!current?.connections.includes(node.id);
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => isReachable && onMoveNode(node.id)}
            disabled={(!isReachable && !isCurrent) || combatLocked}
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
              <span className="text-[10px] text-slate-600">?</span>
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
  combatLocked = false,
}: {
  dungeon: ActiveDungeonState;
  currentNodeId: string;
  onMoveNode: (nodeId: string) => void;
  onEnterSite?: (siteName: string) => void;
  combatLocked?: boolean;
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
        const canMove = !combatLocked && !!current?.connections.includes(node.id);
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