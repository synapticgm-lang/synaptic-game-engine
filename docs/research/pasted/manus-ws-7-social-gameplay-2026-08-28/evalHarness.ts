/** WS-7 social gameplay evaluation harness contract. */

export type Mode = "dnd" | "rpg" | "pyoa" | "litrpg";
export type GateId = "G1" | "G2" | "G3" | "G4" | "G5";

export interface TraceEvent {
  runId: string;
  seed: string;
  mode: Mode;
  turn: number;
  type:
    | "crisis_eligible"
    | "crisis_spawned"
    | "crisis_committed"
    | "social_check_tier"
    | "social_check_commit"
    | "leverage_resolved"
    | "leverage_ledger_written"
    | "relationship_event"
    | "relationship_saved"
    | "relationship_loaded"
    | "relationship_gate_checked"
    | "knowledge_propagated"
    | "state_mutation_applied"
    | "prose_warden_verdict"
    | "xp_awarded"
    | "objective_completed";
  payload: Record<string, unknown>;
}

export interface RunFixture {
  runId: string;
  seed: string;
  mode: Mode;
  maxTurns: 100;
  forcedObjectives: string[];
  initialStateFile?: string;
}

export interface GateFailure {
  gateId: GateId;
  runId: string;
  seed: string;
  turn?: number;
  reason: string;
  evidence: Record<string, unknown>;
  replayPacketPath: string;
}

export interface GateResult {
  gateId: GateId;
  pass: boolean;
  measured: Record<string, number | boolean | string | string[]>;
  threshold: Record<string, unknown>;
  failures: GateFailure[];
}

export interface EvalReport {
  suiteId: "ws7-social-gameplay-v1";
  createdAt: string;
  fixtures: number;
  gates: GateResult[];
  pass: boolean;
  criticalInvariantViolations: GateFailure[];
}

export interface SimulationAdapter {
  run(fixture: RunFixture): Promise<TraceEvent[]>;
  saveReplayPacket(fixture: RunFixture, events: TraceEvent[], focusTurn?: number): Promise<string>;
}

function byType(events: TraceEvent[], type: TraceEvent["type"]): TraceEvent[] {
  return events.filter((event) => event.type === type);
}

function uniqueStrings(events: TraceEvent[], key: string): string[] {
  return [...new Set(events.map((event) => String(event.payload[key] ?? "")).filter(Boolean))];
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function evaluateG1(events: TraceEvent[]): GateResult {
  const requiredModes: Mode[] = ["rpg", "pyoa"];
  const eligibleCounts = Object.fromEntries(requiredModes.map((mode) => [mode, uniqueStrings(events.filter((e) => e.mode === mode && e.type === "crisis_eligible"), "patternId").length]));
  const spawnedCounts = Object.fromEntries(requiredModes.map((mode) => [mode, uniqueStrings(events.filter((e) => e.mode === mode && e.type === "crisis_spawned"), "patternId").length]));
  const resolved = byType(events, "state_mutation_applied").filter((e) => e.payload.domain === "social_crisis");
  const committed = byType(events, "crisis_committed");
  const terminalResolutionRate = committed.length === 0 ? 0 : resolved.length / committed.length;
  const repeatViolations = byType(events, "crisis_spawned").filter((e) => e.payload.repeatSuppressionViolation === true).length;
  const unchanged = resolved.filter((e) => e.payload.beforeHash === e.payload.afterHash).length;
  const pass = requiredModes.every((mode) => eligibleCounts[mode] >= 10 && spawnedCounts[mode] >= 10) && terminalResolutionRate >= 0.95 && repeatViolations === 0 && unchanged === 0;
  return {
    gateId: "G1",
    pass,
    measured: { eligibleRpg: eligibleCounts.rpg, eligiblePyoa: eligibleCounts.pyoa, spawnedRpg: spawnedCounts.rpg, spawnedPyoa: spawnedCounts.pyoa, terminalResolutionRate, repeatViolations, unchanged },
    threshold: { distinctPerMode: 10, terminalResolutionRate: 0.95, repeatViolations: 0, unchanged: 0 },
    failures: [],
  };
}

export function evaluateG2(events: TraceEvent[]): GateResult {
  const commits = byType(events, "social_check_commit");
  const skills = uniqueStrings(commits, "skill");
  const bands = uniqueStrings(commits, "band");
  const impossibleRolls = commits.filter((e) => e.payload.impossible === true && e.payload.roll !== null).length;
  const repeatRerolls = commits.filter((e) => e.payload.repeat === true && e.payload.roll !== null).length;
  const contradictions = byType(events, "prose_warden_verdict").filter((e) => e.payload.commitContradiction === true).length;
  const missingMutations = commits.filter((e) => !Array.isArray(e.payload.mutations) || e.payload.mutations.length === 0).length;
  const pass = skills.length === 4 && ["success", "partial", "failure"].every((band) => bands.includes(band)) && impossibleRolls === 0 && repeatRerolls === 0 && contradictions === 0 && missingMutations === 0;
  return {
    gateId: "G2",
    pass,
    measured: { skills, bands, impossibleRolls, repeatRerolls, contradictions, missingMutations },
    threshold: { skills: 4, bands: ["success", "partial", "failure"], violations: 0 },
    failures: [],
  };
}

export function evaluateG3(events: TraceEvent[]): GateResult {
  const leverage = byType(events, "leverage_resolved");
  const types = uniqueStrings(leverage, "leverageType");
  const successes = leverage.filter((e) => e.payload.result === "success").length;
  const failures = leverage.filter((e) => e.payload.result === "failure").length;
  const repeatAttempts = leverage.filter((e) => e.payload.repeat === true);
  const blockedRepeatRate = repeatAttempts.length === 0 ? 1 : repeatAttempts.filter((e) => e.payload.result === "blocked").length / repeatAttempts.length;
  const excessiveSuccess = Object.values(leverage.reduce<Record<string, number>>((acc, event) => {
    if (event.payload.result !== "success") return acc;
    const key = `${event.payload.leverageId}:${event.payload.targetNpcId}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).some((count) => count > 1);
  const unearnedKnowledge = byType(events, "knowledge_propagated").filter((e) => !e.payload.channel).length;
  const pass = types.length === 6 && successes >= 6 && failures >= 6 && blockedRepeatRate === 1 && !excessiveSuccess && unearnedKnowledge === 0;
  return {
    gateId: "G3",
    pass,
    measured: { types, successes, failures, blockedRepeatRate, excessiveSuccess, unearnedKnowledge },
    threshold: { types: 6, successes: 6, failures: 6, blockedRepeatRate: 1, excessiveSuccess: false, unearnedKnowledge: 0 },
    failures: [],
  };
}

export function evaluateG4(events: TraceEvent[]): GateResult {
  const loaded = byType(events, "relationship_loaded");
  const t100 = loaded.find((e) => e.turn >= 100);
  const betrayalPresent = Boolean(t100?.payload.milestones && Array.isArray(t100.payload.milestones) && t100.payload.milestones.includes("betrayal"));
  const gateChecks = byType(events, "relationship_gate_checked");
  const blockedBeforeRepair = gateChecks.some((e) => e.payload.gate === "allied_request" && e.payload.repaired !== true && e.payload.allowed === false);
  const boundaryViolations = gateChecks.filter((e) => e.payload.boundaryActive === true && e.payload.allowed === true).length;
  const saveEvents = byType(events, "relationship_saved");
  const saveLoadEquality = saveEvents.length > 0 && loaded.length > 0 && saveEvents.at(-1)?.payload.hash === loaded.at(-1)?.payload.hash;
  const pass = betrayalPresent && blockedBeforeRepair && boundaryViolations === 0 && saveLoadEquality;
  return {
    gateId: "G4",
    pass,
    measured: { betrayalPresent, blockedBeforeRepair, boundaryViolations, saveLoadEquality },
    threshold: { betrayalPresent: true, blockedBeforeRepair: true, boundaryViolations: 0, saveLoadEquality: true },
    failures: [],
  };
}

export function evaluateG5(events: TraceEvent[]): GateResult {
  const completed = byType(events, "objective_completed");
  const talk = completed.filter((e) => e.payload.route === "talk").map((e) => asNumber(e.payload.xp));
  const fight = completed.filter((e) => e.payload.route === "fight").map((e) => asNumber(e.payload.xp));
  const talkProgress = completed.filter((e) => e.payload.route === "talk").map((e) => asNumber(e.payload.questProgress));
  const fightProgress = completed.filter((e) => e.payload.route === "fight").map((e) => asNumber(e.payload.questProgress));
  const talkMedianXp = median(talk);
  const fightMedianXp = median(fight);
  const xpRatio = fightMedianXp === 0 ? 1 : talkMedianXp / fightMedianXp;
  const questRatio = median(fightProgress) === 0 ? 1 : median(talkProgress) / median(fightProgress);
  const awards = byType(events, "xp_awarded");
  const duplicateNovelty = awards.filter((e) => e.payload.duplicateNovelty === true && asNumber(e.payload.xp) > 0).length;
  const idleXp = awards.filter((e) => e.payload.idleDialogue === true && asNumber(e.payload.xp) > 0).length;
  const pass = talk.length >= 20 && fight.length >= 20 && xpRatio >= 0.8 && questRatio >= 0.9 && duplicateNovelty === 0 && idleXp === 0;
  return {
    gateId: "G5",
    pass,
    measured: { talkSamples: talk.length, fightSamples: fight.length, talkMedianXp, fightMedianXp, xpRatio, questRatio, duplicateNovelty, idleXp },
    threshold: { samplesPerRoute: 20, xpRatio: 0.8, questRatio: 0.9, duplicateNovelty: 0, idleXp: 0 },
    failures: [],
  };
}

export function evaluateAll(events: TraceEvent[]): EvalReport {
  const gates = [evaluateG1(events), evaluateG2(events), evaluateG3(events), evaluateG4(events), evaluateG5(events)];
  const criticalInvariantViolations: GateFailure[] = [];
  return {
    suiteId: "ws7-social-gameplay-v1",
    createdAt: new Date().toISOString(),
    fixtures: new Set(events.map((event) => event.runId)).size,
    gates,
    pass: gates.every((gate) => gate.pass) && criticalInvariantViolations.length === 0,
    criticalInvariantViolations,
  };
}
