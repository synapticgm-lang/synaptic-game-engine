import { useState, useMemo } from 'react';
import type { Combatant, ActiveDungeonState, Location3D } from '@/types';
import { mockEnemies } from '@/data/mockGameData';
import { isExplorableDungeon } from '@/game/placeAuthority';
import {
  Sword, Shield, Heart, Skull, Crown, User, Plus, ChevronUp,
  ChevronDown, Trash2, Map as MapIcon,
} from 'lucide-react';

interface Props {
  activeDungeon?: ActiveDungeonState | null;
  currentCoordinates?: Location3D;
  onMoveNode?: (nodeId: string) => void;
  onExitDungeon?: () => void;
}

const TYPE_META: Record<Combatant['type'], { label: string; color: string; icon: typeof User }> = {
  player: { label: 'Player', color: 'text-cyan-300', icon: User },
  ally: { label: 'Ally', color: 'text-emerald-300', icon: Shield },
  enemy: { label: 'Enemy', color: 'text-rose-300', icon: Skull },
  boss: { label: 'Boss', color: 'text-amber-300', icon: Crown },
};

const INITIAL_COMBATANTS: Combatant[] = [
  { id: 'c1', name: 'Therion', initiative: 18, hp: 42, maxHp: 42, ac: 16, type: 'player', conditions: [], active: true },
  { id: 'c2', name: 'Lyra', initiative: 14, hp: 28, maxHp: 28, ac: 14, type: 'ally', conditions: ['Blessed'], active: false },
  { id: 'c3', name: 'Goblin Scout', initiative: 12, hp: 7, maxHp: 7, ac: 15, type: 'enemy', conditions: [], active: false },
  { id: 'c4', name: 'Goblin Scout', initiative: 10, hp: 6, maxHp: 7, ac: 15, type: 'enemy', conditions: ['Poisoned'], active: false },
  { id: 'c5', name: 'Ogre Brute', initiative: 8, hp: 30, maxHp: 30, ac: 11, type: 'enemy', conditions: [], active: false },
];

export function CombatEncounter({ activeDungeon, currentCoordinates, onMoveNode, onExitDungeon }: Props) {
  const [combatants, setCombatants] = useState<Combatant[]>(INITIAL_COMBATANTS);

  const sortedCombatants = useMemo(
    () => [...combatants].sort((a, b) => b.initiative - a.initiative),
    [combatants],
  );

  const adjustHp = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) } : c,
      ),
    );
  };

  const setHpSlider = (id: string, value: number) => {
    setCombatants((prev) => prev.map((c) => (c.id === id ? { ...c, hp: value } : c)));
  };

  const removeCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const advanceTurn = () => {
    setCombatants((prev) => {
      if (prev.length === 0) return prev;
      const sorted = [...prev].sort((a, b) => b.initiative - a.initiative);
      const currentIdx = sorted.findIndex((c) => c.active);
      const nextIdx = (currentIdx + 1) % sorted.length;
      return prev.map((c) => ({ ...c, active: sorted.findIndex((s) => s.id === c.id) === nextIdx }));
    });
  };

  const addEnemy = () => {
    const template = mockEnemies[Math.floor(Math.random() * mockEnemies.length)];
    const newCombatant: Combatant = {
      id: `c${Date.now()}`,
      name: template.name,
      initiative: Math.floor(Math.random() * 20) + 1,
      hp: template.hp,
      maxHp: template.hp,
      ac: template.ac,
      type: template.cr === '10' ? 'boss' : 'enemy',
      conditions: [],
      active: false,
    };
    setCombatants((prev) => [...prev, newCombatant]);
  };

  return (
    <div className="flex h-full flex-col gap-3 lg:flex-row">
      {/* Left: Tactical Map Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <span className="flex items-center gap-1.5 font-serif text-xs font-semibold text-cyan-300">
            <MapIcon size={14} />
            Tactical Map
          </span>
          {activeDungeon && (
            <span className="text-[10px] text-slate-500">
              {isExplorableDungeon(activeDungeon)
                ? `${activeDungeon.dungeonName} · Floor ${activeDungeon.currentZLevel}`
                : activeDungeon.dungeonName}
            </span>
          )}
        </div>
        <div className="relative flex-1 overflow-auto bg-slate-950 p-2">
          {!isExplorableDungeon(activeDungeon) && activeDungeon ? (
            <div className="flex h-full min-h-[200px] items-center justify-center p-4 text-center">
              <div>
                <MapIcon size={32} className="mx-auto mb-2 text-slate-700" />
                <p className="text-sm text-slate-300">{activeDungeon.dungeonName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {activeDungeon.blueprintId === 'interior-plan'
                    ? 'Interior floor plan — open Map for the hall. This panel is for dungeon interiors.'
                    : 'Street map — open Map for the local streets. This panel is for dungeon interiors.'}
                </p>
              </div>
            </div>
          ) : activeDungeon ? (
            <DungeonViewport activeDungeon={activeDungeon} currentCoordinates={currentCoordinates} onMoveNode={onMoveNode} onExitDungeon={onExitDungeon} />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-center">
              <div>
                <MapIcon size={32} className="mx-auto mb-2 text-slate-700" />
                <p className="text-xs text-slate-600">No active dungeon map. Fog of war will appear here when a map is loaded.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Initiative Tracker */}
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60 lg:w-72">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <span className="flex items-center gap-1.5 font-serif text-xs font-semibold text-crimson-300">
            <Sword size={14} />
            Initiative Tracker
          </span>
          <div className="flex gap-1">
            <button onClick={advanceTurn} title="Next turn" className="rounded border border-slate-700 bg-slate-800/60 p-1 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40">
              <ChevronDown size={14} />
            </button>
            <button onClick={addEnemy} title="Add enemy" className="rounded border border-slate-700 bg-slate-800/60 p-1 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {sortedCombatants.map((combatant, idx) => (
              <InitiativeCard
                key={combatant.id}
                combatant={combatant}
                isTop={idx === 0}
                onAdjustHp={adjustHp}
                onSetHp={setHpSlider}
                onRemove={removeCombatant}
              />
            ))}
            {sortedCombatants.length === 0 && (
              <p className="py-4 text-center text-xs italic text-slate-600">No combatants. Add an enemy to begin.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ DUNGEON VIEWPORT (fog of war preserved) ============ */

function DungeonViewport({
  activeDungeon,
  currentCoordinates,
  onMoveNode,
  onExitDungeon,
}: {
  activeDungeon: ActiveDungeonState;
  currentCoordinates?: Location3D;
  onMoveNode?: (nodeId: string) => void;
  onExitDungeon?: () => void;
}) {
  const currentNode = activeDungeon.nodes.find((n) => n.id === activeDungeon.currentNodeId);

  const getNodePos = (x: number, y: number) => ({
    x: x * 100 + 60,
    y: y * 100 + 60,
  });

  return (
    <div className="relative min-w-[400px] min-h-[300px]">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {activeDungeon.nodes.map((node) => {
          const start = getNodePos(node.coordinates?.x ?? 0, node.coordinates?.y ?? 0);
          const isVisited = activeDungeon.visitedNodeIds.includes(node.id);
          return node.connections.map((targetId) => {
            const target = activeDungeon.nodes.find((n) => n.id === targetId);
            if (!target) return null;
            const end = getNodePos(target.coordinates?.x ?? 0, target.coordinates?.y ?? 0);
            const targetVisited = activeDungeon.visitedNodeIds.includes(targetId);
            const visible = isVisited || targetVisited;
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                stroke={visible ? (isVisited && targetVisited ? '#38bdf8' : '#475569') : '#0f172a'}
                strokeWidth={visible ? 2.5 : 1}
                strokeDasharray={!isVisited || !targetVisited ? '4 4' : undefined}
                opacity={visible ? 0.7 : 0.15}
              />
            );
          });
        })}
      </svg>

      {/* Hex nodes buttons with fog of war */}
      {activeDungeon.nodes.map((node) => {
        const { x, y } = getNodePos(node.coordinates?.x ?? 0, node.coordinates?.y ?? 0);
        const isCurrent = node.id === activeDungeon.currentNodeId;
        const isVisited = activeDungeon.visitedNodeIds.includes(node.id);
        const isReachable = currentNode?.connections.includes(node.id);

        if (!isVisited && !isReachable) {
          return (
            <div
              key={node.id}
              style={{ left: `${x - 16}px`, top: `${y - 16}px` }}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-900/40 text-[10px] text-slate-700"
            >
              ?
            </div>
          );
        }

        return (
          <button
            key={node.id}
            onClick={() => isReachable && onMoveNode?.(node.id)}
            disabled={!isReachable && !isCurrent}
            style={{ left: `${x - 22}px`, top: `${y - 22}px` }}
            className={`absolute flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 p-1 text-center transition-all ${
              isCurrent
                ? 'scale-110 border-cyan-400 bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30'
                : isVisited
                  ? 'border-cyan-500/50 bg-slate-800 text-slate-200 hover:border-cyan-400'
                  : 'border-amber-500/70 bg-amber-950/80 text-amber-100'
            }`}
          >
            <span className="truncate text-[8px] font-medium leading-tight">{node.name}</span>
            {isCurrent && <span className="text-[6px] font-bold text-slate-900">YOU</span>}
          </button>
        );
      })}

      {/* Footer with discovery count and exit */}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-500">
        <span>Discovered: {activeDungeon.visitedNodeIds.length} / {activeDungeon.nodes.length}</span>
        {currentCoordinates && <span>q:{currentCoordinates.q} r:{currentCoordinates.r}</span>}
        {onExitDungeon && (
          <button onClick={onExitDungeon} className="text-rose-400 hover:text-rose-300">Exit</button>
        )}
      </div>
    </div>
  );
}

/* ============ INITIATIVE CARD ============ */

function InitiativeCard({
  combatant, isTop, onAdjustHp, onSetHp, onRemove,
}: {
  combatant: Combatant;
  isTop: boolean;
  onAdjustHp: (id: string, delta: number) => void;
  onSetHp: (id: string, value: number) => void;
  onRemove: (id: string) => void;
}) {
  const meta = TYPE_META[combatant.type];
  const Icon = meta.icon;
  const hpPct = Math.max(0, (combatant.hp / combatant.maxHp) * 100);
  const isDead = combatant.hp === 0;

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        combatant.active
          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-md shadow-cyan-900/20'
          : isTop
            ? 'border-slate-600 bg-slate-800/50'
            : 'border-slate-700/50 bg-slate-800/30'
      } ${isDead ? 'opacity-50' : ''}`}
    >
      {/* Header row */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${
          combatant.active ? 'border-cyan-400 bg-cyan-500/15' : 'border-slate-600 bg-slate-900'
        }`}>
          <Icon size={14} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-slate-200">{combatant.name}</span>
            {combatant.active && <span className="rounded bg-cyan-500/20 px-1 text-[8px] font-bold text-cyan-300">TURN</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Init {combatant.initiative}</span>
            <span>AC {combatant.ac}</span>
            {combatant.conditions.length > 0 && (
              <span className="text-amber-400">{combatant.conditions.join(', ')}</span>
            )}
          </div>
        </div>
        <button onClick={() => onRemove(combatant.id)} className="text-slate-600 hover:text-rose-400">
          <Trash2 size={12} />
        </button>
      </div>

      {/* HP slider + controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => onAdjustHp(combatant.id, -1)} className="rounded border border-slate-700 bg-slate-900 p-1 text-slate-400 hover:text-rose-300 hover:border-rose-500/40">
          <ChevronDown size={12} />
        </button>
        <div className="flex-1">
          <div className="mb-0.5 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-0.5 text-slate-400"><Heart size={9} className="text-rose-400" />HP</span>
            <span className="font-mono text-slate-300">{combatant.hp}/{combatant.maxHp}</span>
          </div>
          <input
            type="range"
            min={0}
            max={combatant.maxHp}
            value={combatant.hp}
            onChange={(e) => onSetHp(combatant.id, Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full border border-slate-700 bg-slate-950 accent-cyan-500"
            style={{
              background: `linear-gradient(to right, ${hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444'} ${hpPct}%, #0f172a ${hpPct}%)`,
            }}
          />
        </div>
        <button onClick={() => onAdjustHp(combatant.id, 1)} className="rounded border border-slate-700 bg-slate-900 p-1 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40">
          <ChevronUp size={12} />
        </button>
      </div>
    </div>
  );
}
