export type EncounterMode = "litrpg" | "dnd" | "rpg" | "pyoa";
export type DensityRole =
  | "trash"
  | "elite"
  | "boss"
  | "combat"
  | "trap"
  | "hazard"
  | "skill"
  | "puzzle"
  | "social"
  | "crisis"
  | "ambush"
  | "discovery";

export interface RangeTarget {
  minimum: number;
  maximum: number;
}

export interface DensityProfile {
  id: string;
  mode: EncounterMode;
  scope: "location" | "turn-window" | "chapter";
  scopeSize: number;
  targets: Partial<Record<DensityRole, RangeTarget>>;
  interactiveDroughtTurns: number;
  hostileOrHazardDroughtTurns?: number;
  majorCooldownTurns: number;
  saturationWindowTurns: number;
  saturationMaximum: number;
  maximumSameRoleConsecutive: number;
  recoveryAfter: DensityRole[];
}

export const DENSITY_PROFILES: Record<string, DensityProfile> = {
  "litrpg.dungeon.10-room": {
    id: "litrpg.dungeon.10-room",
    mode: "litrpg",
    scope: "location",
    scopeSize: 10,
    targets: {
      trash: { minimum: 4, maximum: 6 },
      elite: { minimum: 1, maximum: 2 },
      boss: { minimum: 1, maximum: 1 },
      discovery: { minimum: 2, maximum: 4 },
    },
    interactiveDroughtTurns: 8,
    hostileOrHazardDroughtTurns: 15,
    majorCooldownTurns: 8,
    saturationWindowTurns: 5,
    saturationMaximum: 2,
    maximumSameRoleConsecutive: 2,
    recoveryAfter: ["elite", "boss"],
  },
  "dnd.keep.10-area": {
    id: "dnd.keep.10-area",
    mode: "dnd",
    scope: "location",
    scopeSize: 10,
    targets: {
      combat: { minimum: 3, maximum: 5 },
      trap: { minimum: 1, maximum: 2 },
      hazard: { minimum: 1, maximum: 2 },
      skill: { minimum: 2, maximum: 4 },
      puzzle: { minimum: 1, maximum: 2 },
      boss: { minimum: 1, maximum: 1 },
    },
    interactiveDroughtTurns: 8,
    hostileOrHazardDroughtTurns: 15,
    majorCooldownTurns: 8,
    saturationWindowTurns: 8,
    saturationMaximum: 3,
    maximumSameRoleConsecutive: 2,
    recoveryAfter: ["boss"],
  },
  "rpg.hub.100-turn": {
    id: "rpg.hub.100-turn",
    mode: "rpg",
    scope: "turn-window",
    scopeSize: 100,
    targets: {
      social: { minimum: 3, maximum: 5 },
      crisis: { minimum: 1, maximum: 2 },
      ambush: { minimum: 0, maximum: 1 },
      discovery: { minimum: 2, maximum: 5 },
    },
    interactiveDroughtTurns: 12,
    hostileOrHazardDroughtTurns: 30,
    majorCooldownTurns: 15,
    saturationWindowTurns: 15,
    saturationMaximum: 2,
    maximumSameRoleConsecutive: 2,
    recoveryAfter: ["crisis", "ambush"],
  },
  "pyoa.chapter.60-turn": {
    id: "pyoa.chapter.60-turn",
    mode: "pyoa",
    scope: "chapter",
    scopeSize: 60,
    targets: {
      crisis: { minimum: 2, maximum: 4 },
      discovery: { minimum: 1, maximum: 3 },
    },
    interactiveDroughtTurns: 12,
    majorCooldownTurns: 9999,
    saturationWindowTurns: 12,
    saturationMaximum: 1,
    maximumSameRoleConsecutive: 1,
    recoveryAfter: ["crisis"],
  },
};

export interface EncounterHistoryEntry {
  encounterId: string;
  templateId: string;
  role: DensityRole;
  turnStarted: number;
  turnEnded: number;
  terminal: boolean;
  biomeId: string;
  bibleId: string;
}

export interface DensityState {
  profileId: string;
  currentTurn: number;
  roomsVisited: number;
  chapterComplete: boolean;
  lastInteractiveTurn: number;
  lastHostileOrHazardTurn: number;
  counts: Partial<Record<DensityRole, number>>;
  history: EncounterHistoryEntry[];
}

export interface CandidateDensityView {
  role: DensityRole;
  templateId: string;
  legalByBiome: boolean;
  cooldownExpired: boolean;
  isInteractive: boolean;
  isHostileOrHazard: boolean;
}

export interface DensityDecision {
  allowed: boolean;
  forcePressure: boolean;
  preferredRoles: DensityRole[];
  reasons: string[];
}

function currentCount(state: DensityState, role: DensityRole): number {
  return state.counts[role] ?? 0;
}

function recent(state: DensityState, turns: number): EncounterHistoryEntry[] {
  const floor = Math.max(0, state.currentTurn - turns);
  return state.history.filter((entry) => entry.turnStarted >= floor);
}

function sameRoleStreak(state: DensityState, role: DensityRole): number {
  let streak = 0;
  for (let index = state.history.length - 1; index >= 0; index -= 1) {
    if (state.history[index].role !== role) break;
    streak += 1;
  }
  return streak;
}

function underTargetRoles(profile: DensityProfile, state: DensityState): DensityRole[] {
  return Object.entries(profile.targets)
    .filter(([role, target]) => currentCount(state, role as DensityRole) < (target?.minimum ?? 0))
    .map(([role]) => role as DensityRole);
}

export function evaluateDensity(
  state: DensityState,
  candidate: CandidateDensityView,
): DensityDecision {
  const profile = DENSITY_PROFILES[state.profileId];
  if (!profile) return { allowed: false, forcePressure: false, preferredRoles: [], reasons: ["unknown_profile"] };
  const reasons: string[] = [];

  if (!candidate.legalByBiome) reasons.push("biome_filter_failed");
  if (!candidate.cooldownExpired) reasons.push("template_cooldown_active");

  const target = profile.targets[candidate.role];
  if (target && currentCount(state, candidate.role) >= target.maximum) reasons.push("role_maximum_reached");
  if (sameRoleStreak(state, candidate.role) >= profile.maximumSameRoleConsecutive) reasons.push("same_role_streak_exceeded");

  const activeInWindow = recent(state, profile.saturationWindowTurns).length;
  if (activeInWindow >= profile.saturationMaximum) reasons.push("saturation_guard");

  const previous = state.history[state.history.length - 1];
  if (previous && profile.recoveryAfter.includes(previous.role) && candidate.isHostileOrHazard) {
    reasons.push("recovery_beat_required");
  }

  const interactiveDrought = state.currentTurn - state.lastInteractiveTurn >= profile.interactiveDroughtTurns;
  const hostileDrought = profile.hostileOrHazardDroughtTurns !== undefined
    && state.currentTurn - state.lastHostileOrHazardTurn >= profile.hostileOrHazardDroughtTurns;
  const forcePressure = interactiveDrought || hostileDrought;
  const preferredRoles = underTargetRoles(profile, state);

  // Drought pressure affects preference only. It never cancels hard legality, cooldown, saturation, or recovery guards.
  if (forcePressure && !candidate.isInteractive) reasons.push("drought_requires_interactive_candidate");
  if (hostileDrought && !candidate.isHostileOrHazard) reasons.push("hostile_drought_prefers_hostile_or_hazard");

  return { allowed: reasons.length === 0, forcePressure, preferredRoles, reasons };
}

export interface LocationGateResult {
  complete: boolean;
  deficits: Partial<Record<DensityRole, number>>;
  violations: string[];
}

export function evaluateLocationCompletion(state: DensityState): LocationGateResult {
  const profile = DENSITY_PROFILES[state.profileId];
  if (!profile) return { complete: false, deficits: {}, violations: ["unknown_profile"] };
  const deficits: Partial<Record<DensityRole, number>> = {};
  const violations: string[] = [];

  for (const [rawRole, target] of Object.entries(profile.targets)) {
    const role = rawRole as DensityRole;
    const count = currentCount(state, role);
    if (count < target.minimum) deficits[role] = target.minimum - count;
    if (count > target.maximum) violations.push(`${role}_above_maximum`);
  }

  if (profile.scope === "location" && state.roomsVisited >= profile.scopeSize && Object.keys(deficits).length > 0) {
    violations.push("location_finished_below_minimum");
  }
  if (profile.scope === "chapter" && state.chapterComplete && Object.keys(deficits).length > 0) {
    violations.push("chapter_finished_below_minimum");
  }

  return { complete: Object.keys(deficits).length === 0 && violations.length === 0, deficits, violations };
}

export function recordEncounterEnd(state: DensityState, entry: EncounterHistoryEntry, interactive: boolean, hostileOrHazard: boolean): DensityState {
  if (!entry.terminal) throw new Error("Density cannot count an unresolved encounter");
  const next: DensityState = JSON.parse(JSON.stringify(state));
  next.history.push(entry);
  next.counts[entry.role] = currentCount(next, entry.role) + 1;
  if (interactive) next.lastInteractiveTurn = entry.turnEnded;
  if (hostileOrHazard) next.lastHostileOrHazardTurn = entry.turnEnded;
  return next;
}
