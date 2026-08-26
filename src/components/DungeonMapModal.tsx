import React, { useEffect, useMemo, useState } from 'react';
import type { ActiveDungeonState, MapNode } from '../game/mapEngine';
import {
  interiorDoorAnchor,
  interiorFloorLabel,
  interiorRoomFillKind,
  isInteriorSecretUnlocked,
  listInteriorZLevels,
  nodesOnInteriorFloor,
  presentLocalAreaMap,
  resolveInteriorEdgeKind,
  resolvePlayAreaMap,
  roomHasVerticalLink,
} from '../game/mapEngine';
import type { InteriorEdgeKind } from '../game/mapEngine';
import { isGenericMapPlace } from '../game/questPlay';
import { isInteriorMap, isInteriorPlace, isStreetMap, mapScaleLabel } from '../game/placeAuthority';
import type { Location3D } from '../game/types';

interface DungeonMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDungeon: ActiveDungeonState | null;
  currentCoordinates?: Location3D;
  currentLocation?: string;
  mapFocusPlace?: string | null;
  combatLocked?: boolean;
  /** Empty ruin / Summoned Pact alone arrival — pending copy must not invent crowds. */
  aloneArrival?: boolean;
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

/** Original player marker — not a licensed minimap icon. */
function YouAreHereMarker({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="sgm-map-you-pulse shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="rgba(217,119,6,0.25)" stroke="#fbbf24" strokeWidth="1.5" />
      <polygon points="12,4 18,18 12,15 6,18" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
    </svg>
  );
}

function MapCompass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} aria-hidden>
      <circle cx="0" cy="0" r="22" fill="rgba(20,16,12,0.55)" stroke="#c9a227" strokeWidth="1.2" />
      <circle cx="0" cy="0" r="16" fill="none" stroke="#8a7a5e" strokeWidth="0.6" opacity="0.7" />
      <polygon points="0,-14 4,-2 0,0 -4,-2" fill="#e8d5a3" />
      <polygon points="0,14 4,2 0,0 -4,2" fill="#5c4a32" />
      <text x="0" y="-26" textAnchor="middle" fill="#e8d5a3" fontSize="10" fontFamily="Cinzel, serif">
        N
      </text>
    </g>
  );
}

export const DungeonMapModal: React.FC<DungeonMapModalProps> = ({
  isOpen,
  onClose,
  activeDungeon,
  currentCoordinates,
  currentLocation,
  mapFocusPlace,
  combatLocked = false,
  aloneArrival = false,
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

  const playerZ = displayDungeon?.currentZLevel ?? 0;
  const floorLevels = useMemo(
    () => (displayDungeon && isInteriorMap(displayDungeon) ? listInteriorZLevels(displayDungeon) : []),
    [displayDungeon]
  );
  const [viewZ, setViewZ] = useState(playerZ);

  useEffect(() => {
    if (!isOpen || !displayDungeon || !isInteriorMap(displayDungeon)) return;
    const z = displayDungeon.currentZLevel ?? 0;
    setViewZ(floorLevels.includes(z) ? z : floorLevels[0] ?? 0);
  }, [isOpen, displayDungeon?.currentNodeId, displayDungeon?.blueprintId, floorLevels.join(',')]);

  if (!isOpen) return null;

  if (!displayDungeon) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="sgm-turn-frame sgm-info-panel sgm-adventure-map-shell relative w-full max-w-lg rounded-xl border shadow-2xl p-6">
          <div className="sgm-turn-frame-bar h-1 w-full -mx-6 -mt-6 mb-4 rounded-t-xl" />
          <div className="sgm-adventure-map-header flex items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <p className="sgm-adventure-map-scale text-[10px] mb-1">Adventure map</p>
              <h2 className="sgm-info-heading sgm-adventure-map-title text-xl font-bold">Local map pending</h2>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm transition"
            >
              Close
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            You are in <span className="font-medium sgm-info-accent">{currentLocation?.trim() || 'an unmapped place'}</span>.
            {mapFocusPlace?.trim() ? (
              <> Main quest pin: <span className="font-medium text-amber-300">{mapFocusPlace.trim()}</span>.</>
            ) : null}
            {aloneArrival
              ? ' The System sketches this empty structure — no crowds, no people on the map until the ledger places someone here.'
              : isInteriorPlace(currentLocation)
              ? ' The System sketches a full floor plan for this interior. Visited rooms stay open; unvisited rooms stay shaded until you walk them.'
              : ' The System builds a local area map from wherever you said you are — a market square, a Kyoto alley, anywhere in the world.'}
          </p>
          <p className="mt-3 text-xs sgm-adventure-map-scale opacity-80">
            {aloneArrival
              ? ' Empty ruin: rooms and passages only. Names wait for you to walk them.'
              : isInteriorPlace(currentLocation)
              ? ' Doors mark normal room links; dashed/broken marks are damaged gaps or sealed secrets — you still have to find secrets in play.'
              : 'Name the street or store in play if this is still empty.'}
          </p>
        </div>
      </div>
    );
  }

  const currentNode = displayDungeon.nodes.find((n) => n.id === displayDungeon.currentNodeId);
  const isStreet = isStreetMap(displayDungeon);
  const isHallPlan = isInteriorMap(displayDungeon);

  const mapScaleStreet = mapScaleLabel('street');
  const mapScaleInterior = isHallPlan ? mapScaleLabel('interior') : mapScaleLabel('dungeon');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="sgm-turn-frame sgm-info-panel sgm-adventure-map-shell relative w-full max-w-4xl rounded-xl border p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="sgm-turn-frame-bar h-1 w-full -mx-6 -mt-6 mb-4 rounded-t-xl" />

        <div className="sgm-adventure-map-header flex justify-between items-center pb-4 border-b border-slate-700/80">
          <div>
            <div className="sgm-adventure-map-scale flex items-center gap-2 text-[10px] font-semibold mb-1">
              <span>{isStreet ? mapScaleStreet : mapScaleInterior}</span>
              {!isStreet && !isHallPlan && displayDungeon.dangerTier != null && (
                <span className="rounded bg-rose-950/60 px-2 py-0.5 text-rose-200 border border-rose-800/40 normal-case tracking-normal">
                  Danger Tier {displayDungeon.dangerTier}
                </span>
              )}
              {currentCoordinates && !isStreet && !isHallPlan && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 normal-case tracking-normal">
                  q: {currentCoordinates.q}, r: {currentCoordinates.r} | Floor: {displayDungeon.currentZLevel}
                </span>
              )}
            </div>
            <h2 className="sgm-info-heading sgm-adventure-map-title text-xl font-bold flex items-center gap-2">
              {displayDungeon.dungeonName}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <YouAreHereMarker size={14} />
              <span>
                {isStreet ? 'You are here: ' : 'Current room: '}
                <span className="text-amber-300 font-semibold">{currentNode?.name || 'Unknown'}</span>
                {mapFocusPlace?.trim() ? (
                  <span className="text-slate-400"> · Main pin: <span className="text-amber-200">{mapFocusPlace.trim()}</span></span>
                ) : null}
                {isHallPlan && floorLevels.length > 1 && (
                  <span className="text-slate-500"> · {interiorFloorLabel(playerZ)}</span>
                )}
              </span>
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
            Close
          </button>
        </div>

        {isHallPlan && floorLevels.length > 1 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Building floors"
          >
            <span className="text-[10px] uppercase tracking-wide text-slate-500 mr-1">Floor</span>
            {floorLevels.map((z) => {
              const onPlayer = z === playerZ;
              const selected = z === viewZ;
              return (
                <button
                  key={z}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setViewZ(z)}
                  className={`px-2.5 py-1 rounded border text-xs font-semibold transition ${
                    selected
                      ? 'border-amber-500/80 bg-amber-950/50 text-amber-100'
                      : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {interiorFloorLabel(z)}
                  {onPlayer ? ' · you' : ''}
                </button>
              );
            })}
            {viewZ !== playerZ && (
              <span className="text-[10px] text-slate-500">Inspecting — tap a connected stair to move</span>
            )}
          </div>
        )}

        <div
          className={`relative flex-1 my-4 min-h-[360px] overflow-auto rounded-lg p-4 sgm-adventure-map-canvas ${
            isStreet ? 'sgm-adventure-map-canvas--zone' : 'sgm-adventure-map-canvas--interior'
          }`}
        >
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
              viewZ={isHallPlan ? viewZ : displayDungeon.currentZLevel}
              onMoveNode={(nodeId) => {
                onMoveNode(nodeId);
                const dest = displayDungeon.nodes.find((n) => n.id === nodeId);
                if (dest && typeof dest.zLevel === 'number') setViewZ(dest.zLevel);
              }}
              organic={isHallPlan}
              combatLocked={combatLocked}
            />
          )}
        </div>

        <div className="sgm-adventure-map-footer border rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="font-semibold text-amber-200/95 sgm-map-poi">{currentNode?.name}</p>
            {currentNode?.features?.primary && !isStreet && (
              <span className="text-[10px] bg-slate-900 border border-amber-900/40 px-2 py-0.5 rounded text-amber-300">
                Primary: {currentNode.features.primary}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-xs mb-3">{currentNode?.description}</p>

          <div className="flex justify-between items-center pt-2 border-t border-amber-900/25">
            <span className="text-xs text-slate-400">
              {isStreet
                ? `Places: ${displayDungeon.nodes.length}`
                : (() => {
                    const floorNodes = isHallPlan
                      ? nodesOnInteriorFloor(displayDungeon, viewZ)
                      : displayDungeon.nodes.filter(
                          (n) => (n.zLevel ?? 0) === (displayDungeon.currentZLevel ?? 0)
                        );
                    const visitedOnFloor = floorNodes.filter((n) =>
                      displayDungeon.visitedNodeIds.includes(n.id)
                    ).length;
                    const floorTag = isHallPlan && floorLevels.length > 1
                      ? ` · ${interiorFloorLabel(viewZ)}`
                      : '';
                    return isHallPlan
                      ? `Explored: ${visitedOnFloor} / ${floorNodes.length} rooms${floorTag}`
                      : `Rooms: ${visitedOnFloor} mapped / ${floorNodes.length} on this floor`;
                  })()}
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
  viewZ,
  onMoveNode,
  organic = false,
  combatLocked = false,
}: {
  dungeon: ActiveDungeonState;
  currentNodeId: string;
  viewZ: number;
  onMoveNode: (nodeId: string) => void;
  organic?: boolean;
  combatLocked?: boolean;
}) {
  const nodes = nodesOnInteriorFloor(dungeon, viewZ);
  const unit = organic ? 92 : 84;
  const pad = organic ? 40 : 32;
  const roomBox = (node: MapNode) => {
    const gx = node.coordinates?.x ?? 0;
    const gy = node.coordinates?.y ?? 0;
    const fw = node.footprint?.w ?? 1;
    const fh = node.footprint?.h ?? 1;
    return {
      x: pad + gx * unit,
      y: pad + gy * unit,
      w: Math.max(44, fw * unit - 6),
      h: Math.max(40, fh * unit - 6),
    };
  };
  const boxes = nodes.map((n) => ({ id: n.id, box: roomBox(n) }));
  const maxRight = Math.max(...boxes.map((b) => b.box.x + b.box.w), pad + unit);
  const maxBottom = Math.max(...boxes.map((b) => b.box.y + b.box.h), pad + unit);
  const width = maxRight + pad;
  const height = maxBottom + pad;
  const current = dungeon.nodes.find((n) => n.id === currentNodeId);
  const playerOnThisFloor = (current?.zLevel ?? 0) === viewZ;

  const verticalHint = (node: MapNode) => {
    if (!roomHasVerticalLink(dungeon, node)) return null;
    const z = node.zLevel ?? 0;
    const targets = node.connections
      .map((id) => dungeon.nodes.find((n) => n.id === id))
      .filter((t): t is MapNode => !!t && (t.zLevel ?? 0) !== z);
    const up = targets.some((t) => (t.zLevel ?? 0) > z);
    const down = targets.some((t) => (t.zLevel ?? 0) < z);
    if (up && down) return '↕';
    if (up) return '↑';
    if (down) return '↓';
    return '↕';
  };

  const drawConnection = (node: MapNode, target: MapNode, kind: InteriorEdgeKind) => {
    const a = roomBox(node);
    const b = roomBox(target);
    const anchor = interiorDoorAnchor(a, b);
    const eitherVisited =
      dungeon.visitedNodeIds.includes(node.id) || dungeon.visitedNodeIds.includes(target.id);
    const key = `${node.id}-${target.id}`;

    if (kind === 'stairs') return null;

    if (kind === 'door') {
      const doorW = organic ? 14 : 12;
      const doorD = organic ? 7 : 6;
      const isV = anchor.orient === 'v';
      return (
        <g key={key} opacity={eitherVisited ? 1 : 0.7}>
          {/* Wall jambs — clear doorway mark, not a thin crack line */}
          {isV ? (
            <>
              <rect
                x={anchor.x - doorD / 2}
                y={anchor.y - doorW / 2}
                width={doorD}
                height={doorW}
                fill={eitherVisited ? '#3d3428' : '#2a241c'}
                stroke={eitherVisited ? '#c4b08a' : '#6b5a45'}
                strokeWidth={1.4}
                rx={1}
              />
              <line
                x1={anchor.x}
                y1={anchor.y - doorW / 2 + 2}
                x2={anchor.x}
                y2={anchor.y + doorW / 2 - 2}
                stroke={eitherVisited ? '#e8d5a3' : '#8a7a5e'}
                strokeWidth={1.2}
              />
            </>
          ) : (
            <>
              <rect
                x={anchor.x - doorW / 2}
                y={anchor.y - doorD / 2}
                width={doorW}
                height={doorD}
                fill={eitherVisited ? '#3d3428' : '#2a241c'}
                stroke={eitherVisited ? '#c4b08a' : '#6b5a45'}
                strokeWidth={1.4}
                rx={1}
              />
              <line
                x1={anchor.x - doorW / 2 + 2}
                y1={anchor.y}
                x2={anchor.x + doorW / 2 - 2}
                y2={anchor.y}
                stroke={eitherVisited ? '#e8d5a3' : '#8a7a5e'}
                strokeWidth={1.2}
              />
            </>
          )}
        </g>
      );
    }

    // Damaged gap or secret sealed edge — dashed / broken wall, never the default door look.
    const len = organic ? 22 : 18;
    const isV = anchor.orient === 'v';
    const secret = kind === 'secret';
    return (
      <g key={key} opacity={secret ? 0.4 : eitherVisited ? 0.85 : 0.55}>
        <line
          x1={isV ? anchor.x : anchor.x - len / 2}
          y1={isV ? anchor.y - len / 2 : anchor.y}
          x2={isV ? anchor.x : anchor.x + len / 2}
          y2={isV ? anchor.y + len / 2 : anchor.y}
          stroke={secret ? '#4a4034' : '#6b5340'}
          strokeWidth={secret ? 2.2 : 3}
          strokeDasharray={secret ? '3 5' : '5 4 2 4'}
          strokeLinecap="round"
        />
        {!secret && (
          <line
            x1={isV ? anchor.x - 3 : anchor.x - 2}
            y1={isV ? anchor.y - 4 : anchor.y - 3}
            x2={isV ? anchor.x + 3 : anchor.x + 2}
            y2={isV ? anchor.y + 4 : anchor.y + 3}
            stroke="#5c4a32"
            strokeWidth={1.2}
            strokeDasharray="2 3"
            opacity={0.7}
          />
        )}
      </g>
    );
  };

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-8 text-center">
        No rooms mapped on {interiorFloorLabel(viewZ)}.
      </p>
    );
  }

  return (
    <div className="relative" style={{ minWidth: width, minHeight: height }}>
      <svg className="absolute inset-0" width={width} height={height} aria-hidden>
        <defs>
          <pattern id="sgm-stone-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8 L8 0" stroke="#3d3428" strokeWidth="0.6" opacity="0.35" />
          </pattern>
          <pattern id="sgm-unvisited-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 6 L6 0" stroke="#1a1612" strokeWidth="1" opacity="0.55" />
          </pattern>
          <radialGradient id="sgm-room-fog" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0c0e12" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0c0e12" stopOpacity="0.82" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="#1a1510" opacity="0.35" />
        <rect width={width} height={height} fill="url(#sgm-stone-hatch)" opacity="0.5" />
        {nodes.map((node) =>
          node.connections.map((targetId) => {
            if (node.id >= targetId) return null;
            const target = nodes.find((n) => n.id === targetId);
            if (!target) return null;
            const kind = resolveInteriorEdgeKind(node, target);
            return drawConnection(node, target, kind);
          })
        )}
        {nodes.map((node) => {
          const box = roomBox(node);
          const fill = interiorRoomFillKind(dungeon, node);
          const isCurrent = playerOnThisFloor && node.id === currentNodeId;
          const isVisited = fill === 'visited';
          const isSecret = fill === 'secret';
          return (
            <g key={`floor-${node.id}`}>
              <rect
                x={box.x - 2}
                y={box.y - 2}
                width={box.w + 4}
                height={box.h + 4}
                rx={organic ? 3 : 4}
                fill="none"
                stroke={isCurrent ? '#c9a227' : isVisited ? '#8a7a5e' : isSecret ? '#3d352c' : '#4a4034'}
                strokeWidth={isCurrent ? 2 : 1}
                strokeDasharray={isSecret ? '4 5' : undefined}
                opacity={isVisited ? 0.95 : isSecret ? 0.4 : 0.7}
              />
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={organic ? 2 : 3}
                className={
                  isVisited
                    ? 'sgm-map-room--visited'
                    : isSecret
                      ? 'sgm-map-room--secret'
                      : 'sgm-map-room--unvisited'
                }
                fill={isCurrent ? '#6b5638' : isVisited ? '#3d3428' : isSecret ? '#12100e' : '#1a1612'}
                stroke={isCurrent ? '#e8d5a3' : isVisited ? '#c4b08a' : isSecret ? '#3d352c' : '#2a241c'}
                strokeWidth={isCurrent ? 2.2 : 1.4}
                strokeDasharray={isSecret ? '5 4' : isVisited ? undefined : '3 3'}
                opacity={isVisited ? 1 : isSecret ? 0.4 : 0.85}
              />
              {!isVisited && (
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={organic ? 2 : 3}
                  fill={isSecret ? 'url(#sgm-unvisited-hatch)' : 'url(#sgm-room-fog)'}
                />
              )}
            </g>
          );
        })}
        <MapCompass x={width - 36} y={36} />
      </svg>
      {nodes.map((node) => {
        const box = roomBox(node);
        const fill = interiorRoomFillKind(dungeon, node);
        const isVisited = fill === 'visited';
        const isSecret = fill === 'secret';
        const isCurrent = playerOnThisFloor && node.id === currentNodeId;
        const secretOpen = isInteriorSecretUnlocked(dungeon, node.id);
        const isReachable =
          !combatLocked &&
          !!current?.connections.includes(node.id) &&
          (secretOpen || !node.isSecret);
        const stair = verticalHint(node);
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => isReachable && onMoveNode(node.id)}
            disabled={(!isReachable && !isCurrent) || combatLocked}
            title={
              isSecret
                ? 'Sealed passage — discover it in play'
                : isVisited
                  ? stair
                    ? `${node.name} (${stair} stairs)`
                    : node.name
                  : 'Unexplored room'
            }
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
            className="absolute z-10 flex flex-col items-center justify-center px-1 text-center"
          >
            {isVisited ? (
              <>
                <span
                  className={`sgm-map-poi text-[11px] font-medium leading-tight ${
                    isCurrent ? 'text-amber-50' : 'text-stone-100'
                  }`}
                >
                  {node.name}
                </span>
                {stair && (
                  <span className="mt-0.5 text-[9px] text-amber-200/80" aria-hidden>
                    {stair}
                  </span>
                )}
                {isCurrent && (
                  <span className="mt-1 flex items-center gap-1 text-[8px] uppercase tracking-wide text-amber-200">
                    <YouAreHereMarker size={12} />
                    You are here
                  </span>
                )}
              </>
            ) : isSecret ? (
              <span className="text-[10px] text-stone-700 font-serif opacity-60">···</span>
            ) : (
              <span className="text-[12px] text-stone-500 font-serif">?</span>
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

/** Soft bezier between two points — region path, not CAD street centerline. */
function pathBetween(ax: number, ay: number, bx: number, by: number) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * Math.min(28, len * 0.18);
  const oy = (dx / len) * Math.min(28, len * 0.18);
  return `M ${ax} ${ay} Q ${mx + ox} ${my + oy} ${bx} ${by}`;
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
  const size = 560;
  const current = dungeon.nodes.find((n) => n.id === currentNodeId);
  const pathEdges: { key: string; d: string }[] = [];
  const seen = new Set<string>();
  for (const node of dungeon.nodes) {
    for (const targetId of node.connections) {
      const key = [node.id, targetId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const target = dungeon.nodes.find((n) => n.id === targetId);
      if (!target) continue;
      const a = streetPx(node);
      const b = streetPx(target);
      pathEdges.push({ key, d: pathBetween(a.x, a.y, b.x, b.y) });
    }
  }

  return (
    <div className="relative min-w-[560px] min-h-[560px]">
      <svg className="absolute inset-0 h-[560px] w-[560px]" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <radialGradient id="sgm-zone-vignette" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#243028" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0c100e" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <rect width={size} height={size} fill="#1a241c" opacity="0.25" />
        <ellipse cx="140" cy="160" rx="90" ry="70" fill="#243428" opacity="0.45" />
        <ellipse cx="400" cy="200" rx="110" ry="80" fill="#1e2c24" opacity="0.4" />
        <ellipse cx="280" cy="400" rx="130" ry="70" fill="#223028" opacity="0.35" />
        <ellipse cx="420" cy="420" rx="70" ry="55" fill="#2a3428" opacity="0.3" />
        <ellipse cx="280" cy="280" rx="200" ry="160" fill="none" stroke="#3d4a40" strokeWidth="1" opacity="0.35" />
        <ellipse cx="280" cy="280" rx="140" ry="110" fill="none" stroke="#3d4a40" strokeWidth="0.8" opacity="0.28" />
        <ellipse cx="280" cy="280" rx="80" ry="60" fill="none" stroke="#3d4a40" strokeWidth="0.7" opacity="0.22" />
        <rect width={size} height={size} fill="url(#sgm-zone-vignette)" />

        {pathEdges.map(({ key, d }) => (
          <g key={key}>
            <path d={d} fill="none" stroke="#3d4a40" strokeWidth={14} strokeLinecap="round" opacity={0.55} />
            <path d={d} fill="none" stroke="#6b7a68" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
          </g>
        ))}

        <MapCompass x={size - 40} y={40} />
        <g transform={`translate(36, ${size - 28})`}>
          <rect x="0" y="0" width="72" height="3" fill="#94a3b8" opacity="0.7" />
          <text x="0" y="16" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui">
            ~ 1 km
          </text>
        </g>
      </svg>

      {dungeon.nodes.map((node) => {
        const { x, y } = streetPx(node);
        const isCurrent = node.id === currentNodeId;
        const canMove = !combatLocked && !!current?.connections.includes(node.id);
        const isEntrance = (node.tags ?? []).some((t) => t === 'entrance' || t === 'micro_dungeon');
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
            style={{ left: `${x - 70}px`, top: `${y - 28}px` }}
            className={`sgm-map-poi absolute z-10 w-[140px] rounded border px-2 py-1.5 text-center transition ${
              isCurrent
                ? 'sgm-map-poi--here border-amber-400/90 bg-[#2a2118]/95 text-amber-50'
                : isEntrance
                  ? 'border-amber-600/70 bg-[#1a241c]/92 text-amber-50 hover:border-amber-400'
                  : 'border-stone-500/70 bg-[#152018]/90 text-stone-100 hover:border-amber-500/70'
            } ${canMove || (isEntrance && isCurrent) ? 'cursor-pointer' : ''}`}
          >
            <span className="flex items-center justify-center gap-1">
              {isCurrent && <YouAreHereMarker size={14} />}
              {isEntrance && !isCurrent && (
                <span className="inline-block h-2 w-2 rounded-sm bg-amber-500/90" aria-hidden />
              )}
              <span className="block text-[11px] font-medium leading-tight break-words">{node.name}</span>
            </span>
            {isEntrance && (
              <span className="mt-0.5 block text-[8px] uppercase tracking-wide text-amber-200/90">
                {isCurrent ? 'Tap to enter' : 'Site entrance'}
              </span>
            )}
            {isCurrent && !isEntrance && (
              <span className="mt-0.5 block text-[8px] uppercase tracking-wide text-amber-200/90">You are here</span>
            )}
          </button>
        );
      })}
    </div>
  );
}