/**
 * Edge stub — progress governor SNAPSHOT helpers.
 * Full governor logic stays client-side; edge only needs mandate lines for the packet.
 */

export type ProgressDeltaKind =
  | 'quest_progress'
  | 'discovery'
  | 'access'
  | 'relationship'
  | 'threat'
  | 'resources'
  | 'character'
  | 'none';

export interface ProgressDelta {
  kind: ProgressDeltaKind;
  turn: number;
  summary: string;
  entity?: string;
  authority?: string;
}

export interface ProgressGovernorState {
  lastProgressTurn: number;
  recentDeltas: ProgressDelta[];
  turnsSinceProgress: number;
}

export function initProgressGovernor(): ProgressGovernorState {
  return {
    lastProgressTurn: 0,
    recentDeltas: [],
    turnsSinceProgress: 0,
  };
}

export function hasActiveObjectives(state: {
  quests?: Array<{ status?: string; revealed?: boolean }>;
  activeEncounter?: unknown;
  activeDungeon?: unknown;
  campaignMemory?: { consequences?: Array<{ unresolved?: boolean }> };
}): boolean {
  const hasQuests = (state.quests ?? []).some(
    (q) => (q.status === 'active' || q.status === 'available') && q.revealed
  );
  if (hasQuests) return true;
  if (state.activeEncounter) return true;
  if (state.activeDungeon) return true;
  return (state.campaignMemory?.consequences ?? []).some((c) => c.unresolved);
}

export function checkProgressGovernor(
  state: { turn?: number },
  governorState: ProgressGovernorState,
  activeObjective: boolean = false
): {
  needsProgress: boolean;
  turnsSinceProgress: number;
  mandate?: string;
} {
  const turns = governorState.turnsSinceProgress;
  if (!activeObjective || (state.turn ?? 0) < 5) {
    return { needsProgress: false, turnsSinceProgress: turns };
  }
  if (turns >= 5) {
    return {
      needsProgress: true,
      turnsSinceProgress: turns,
      mandate:
        'Forward-Progress: force a durable delta this beat (quest tick, discovery, travel, threat, or relationship) — do not stall.',
    };
  }
  return { needsProgress: false, turnsSinceProgress: turns };
}
