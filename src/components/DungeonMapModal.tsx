import React from 'react';
import type { ActiveDungeonState, MapNode } from '../game/mapEngine';
import type { Location3D } from '../game/types';

interface DungeonMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDungeon: ActiveDungeonState | null;
  currentCoordinates?: Location3D;
  onMoveNode: (nodeId: string) => void;
  onExitDungeon: () => void;
}

export const DungeonMapModal: React.FC<DungeonMapModalProps> = ({
  isOpen,
  onClose,
  activeDungeon,
  currentCoordinates,
  onMoveNode,
  onExitDungeon,
}) => {
  if (!isOpen || !activeDungeon) return null;

  const currentNode = activeDungeon.nodes.find((n) => n.id === activeDungeon.currentNodeId);

  const getNodePos = (node: MapNode) => {
    const x = (node.coordinates?.x ?? 0) * 120 + 80;
    const y = (node.coordinates?.y ?? 0) * 120 + 80;
    return { x, y };
  };

  const tierNames: Record<number, string> = {
    1: 'Tier 1: World Map (100 km)',
    2: 'Tier 2: Region Map (10 km)',
    3: 'Tier 3: Local Exploration (1 km)',
    4: 'Tier 4: Tactical Interior',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl rounded-xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Navigation Breadcrumbs & Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <span>🗺️ {tierNames[activeDungeon.tier]}</span>
              {currentCoordinates && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                  q: {currentCoordinates.q}, r: {currentCoordinates.r} | Floor: {activeDungeon.currentZLevel}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {activeDungeon.dungeonName}
            </h2>
            <p className="text-xs text-slate-400">
              Active Node: <span className="text-amber-300 font-semibold">{currentNode?.name || 'Unknown'}</span>
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
          <svg className="absolute inset-0 w-full h-full min-w-[500px] min-h-[500px] pointer-events-none">
            {activeDungeon.nodes.map((node) => {
              const start = getNodePos(node);
              const isVisited = activeDungeon.visitedNodeIds.includes(node.id);

              return node.connections.map((targetId) => {
                const targetNode = activeDungeon.nodes.find((n) => n.id === targetId);
                if (!targetNode) return null;
                const end = getNodePos(targetNode);
                const isTargetVisited = activeDungeon.visitedNodeIds.includes(targetId);
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

          {/* Render Hex Nodes */}
          <div className="relative min-w-[500px] min-h-[500px]">
            {activeDungeon.nodes.map((node) => {
              const { x, y } = getNodePos(node);
              const isCurrent = node.id === activeDungeon.currentNodeId;
              const isVisited = activeDungeon.visitedNodeIds.includes(node.id);
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
                  style={{ left: `${x - 28}px`, top: `${y - 28}px` }}
                  className={`absolute w-14 h-14 rounded-full border-2 transition-all flex flex-col items-center justify-center p-1 text-center ${
                    isCurrent
                      ? 'bg-cyan-500 border-white ring-4 ring-cyan-500/40 text-slate-950 font-bold z-20 scale-110 animate-pulse'
                      : isVisited
                      ? 'bg-slate-800 border-cyan-500/60 text-slate-200 hover:border-cyan-400 z-10'
                      : 'bg-amber-950/80 border-amber-500 text-amber-200 animate-bounce z-10 cursor-pointer'
                  }`}
                >
                  <span className="text-[10px] leading-tight font-medium truncate max-w-full">
                    {node.name}
                  </span>
                  {isCurrent && <span className="text-[8px] bg-slate-950 text-cyan-300 px-1 rounded">YOU</span>}
                  {!isVisited && isReachable && <span className="text-[8px] text-amber-300 font-bold">MOVE</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details & Action Toolbar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="font-semibold text-cyan-300">{currentNode?.name}</p>
            {currentNode?.features?.primary && (
              <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300">
                Primary: {currentNode.features.primary}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-xs mb-3">{currentNode?.description}</p>

          <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
            <span className="text-xs text-slate-400">
              Discovered: {activeDungeon.visitedNodeIds.length} / {activeDungeon.nodes.length} sectors
            </span>
            <button
              onClick={onExitDungeon}
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 text-xs transition"
            >
              Exit Map Mode
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};