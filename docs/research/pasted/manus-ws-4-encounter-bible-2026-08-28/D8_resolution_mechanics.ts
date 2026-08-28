/* WS-4 D8 — Encounter resolution mechanics.
 * The resolver owns state; the GM receives committed events and may narrate only.
 */

export type Mode = "litrpg" | "dnd" | "rpg" | "pyoa";
export type TerminalState =
  | "victory"
  | "defeat"
  | "fled"
  | "negotiated"
  | "partial"
  | "crisisEnding";
export type ReceiptType = "xp" | "loot" | "faction" | "quest" | "npc" | "dungeon";
export type Position = "controlled" | "risky" | "desperate";
export type Effect = "limited" | "standard" | "great";

export interface DeterministicRng {
  readonly seed: number;
  readonly cursor: number;
}

export interface HpEntry {
  current: number;
  maximum: number;
  defense: number;
  active: boolean;
}

export interface ClockEntry {
  filled: number;
  segments: number;
}

export interface EncounterLedger {
  encounterId: string;
  templateId: string;
  templateVersion: string;
  mode: Mode;
  turn: number;
  maxTurns: number;
  terminal: boolean;
  terminalState?: TerminalState;
  hp: Record<string, HpEntry>;
  resources: Record<string, number>;
  clocks: Record<string, ClockEntry>;
  facts: Record<string, boolean | string | number>;
  locks: Record<string, boolean>;
  faction: Record<string, number>;
  quests: Record<string, string | number | boolean>;
  npcs: Record<string, string | number | boolean>;
  dungeon: Record<string, string | number | boolean>;
  events: EncounterEvent[];
  appliedCommitKeys: Record<string, boolean>;
  rng: DeterministicRng;
}

export interface EncounterEvent {
  id: string;
  encounterId: string;
  turn: number;
  actionId: string;
  beforeHash: string;
  afterHash: string;
  deltas: StateDelta[];
  roll?: D20Result;
  terminalState?: TerminalState;
}

export interface StateDelta {
  domain: "hp" | "resource" | "clock" | "fact" | "lock" | "faction" | "quest" | "npc" | "dungeon";
  target: string;
  operation: "add" | "remove" | "set" | "increment" | "decrement" | "unlock" | "lock";
  value: unknown;
}

export interface OutcomeContract {
  terminal: boolean;
  terminalState?: TerminalState;
  deltas: StateDelta[];
  summary: string;
}

export interface ResolutionResult {
  accepted: boolean;
  reason?: string;
  event?: EncounterEvent;
  ledger: EncounterLedger;
  terminal: boolean;
  terminalState?: TerminalState;
}

export interface D20Check {
  ability: string;
  skill?: string;
  dc: number;
  abilityModifier: number;
  proficiencyBonus?: number;
  proficient?: boolean;
  circumstantialModifier?: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface D20Result {
  dice: number[];
  kept: number;
  modifier: number;
  total: number;
  target: number;
  success: boolean;
}

export interface DamageInput {
  attackerPower: number;
  skillBonus: number;
  defenderDefense: number;
  variance: number;
  multiplier?: number;
  minimumDamage?: number;
}

export interface CombatAttack {
  actionId: string;
  actorId: string;
  targetId: string;
  attackCheck: D20Check;
  damage: Omit<DamageInput, "variance">;
  varianceMin: number;
  varianceMax: number;
  onMiss: StateDelta[];
  onVictory: StateDelta[];
}

export interface FleeContract {
  actionId: string;
  routeId: string;
  successClockId: string;
  dangerClockId: string;
  check: D20Check;
  progressOnSuccess: number;
  dangerOnFailure: number;
  costOnSuccess: StateDelta[];
  costOnFailure: StateDelta[];
  failureLocksCurrentRoute: boolean;
}

export interface ParleyContract {
  actionId: string;
  oppositionId: string;
  leverageId: string;
  leverageCost: number;
  thresholdFacts: string[];
  check?: D20Check;
  success: OutcomeContract;
  refusal: OutcomeContract;
}

export interface ClockActionContract {
  actionId: string;
  successClockId: string;
  dangerClockId: string;
  check?: D20Check;
  successTicks: number;
  partialTicks: number;
  dangerTicks: number;
  leverageId?: string;
  leverageCost?: number;
  onSuccess: OutcomeContract;
  onDanger: OutcomeContract;
  onPartialCost: StateDelta[];
}

export interface CrisisOption {
  id: string;
  exclusiveFactGroup: string;
  setFact: string;
  lockOpposedFact: string;
  callbackId: string;
  endingEligibility: string;
  convergenceId: string;
  deltas: StateDelta[];
}

export interface CrisisContract {
  actionId: string;
  crisisId: string;
  option: CrisisOption;
}

export interface ForcedTerminalContract {
  outcome: OutcomeContract & { terminal: true; terminalState: TerminalState };
}

export interface AftermathMutation {
  type: ReceiptType;
  target: string;
  operation: StateDelta["operation"];
  value: unknown;
}

export interface AftermathReceipt {
  receiptId: string;
  commitKey: string;
  encounterId: string;
  templateId: string;
  templateVersion: string;
  terminalState: TerminalState;
  turn: number;
  mutations: AftermathMutation[];
  eventIds: string[];
  beforeHash: string;
  afterHash: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cloneLedger(ledger: EncounterLedger): EncounterLedger {
  return JSON.parse(JSON.stringify(ledger)) as EncounterLedger;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function ledgerHash(ledger: EncounterLedger): string {
  const copy = cloneLedger(ledger);
  copy.events = [];
  return fnv1a(stableStringify(copy));
}

function nextRandom(rng: DeterministicRng): [number, DeterministicRng] {
  let x = (rng.seed ^ Math.imul(rng.cursor + 1, 0x9e3779b9)) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return [(x >>> 0) / 0x100000000, { seed: rng.seed, cursor: rng.cursor + 1 }];
}

function rollInclusive(ledger: EncounterLedger, minimum: number, maximum: number): number {
  assert(Number.isInteger(minimum) && Number.isInteger(maximum) && maximum >= minimum, "Invalid roll range");
  const [unit, next] = nextRandom(ledger.rng);
  ledger.rng = next;
  return minimum + Math.floor(unit * (maximum - minimum + 1));
}

export function resolveD20(ledger: EncounterLedger, check: D20Check): D20Result {
  assert(check.dc >= 5 && check.dc <= 30, "DC must be between 5 and 30");
  const advantageOnly = Boolean(check.advantage) && !check.disadvantage;
  const disadvantageOnly = Boolean(check.disadvantage) && !check.advantage;
  const dice = advantageOnly || disadvantageOnly
    ? [rollInclusive(ledger, 1, 20), rollInclusive(ledger, 1, 20)]
    : [rollInclusive(ledger, 1, 20)];
  const kept = advantageOnly ? Math.max(...dice) : disadvantageOnly ? Math.min(...dice) : dice[0];
  const modifier = check.abilityModifier
    + (check.proficient ? (check.proficiencyBonus ?? 0) : 0)
    + (check.circumstantialModifier ?? 0);
  const total = kept + modifier;
  return { dice, kept, modifier, total, target: check.dc, success: total >= check.dc };
}

export function calculateDamage(input: DamageInput): number {
  const raw = (input.attackerPower + input.skillBonus + input.variance - input.defenderDefense)
    * (input.multiplier ?? 1);
  return Math.max(input.minimumDamage ?? 1, Math.floor(raw));
}

function applyDelta(ledger: EncounterLedger, delta: StateDelta): void {
  const numericMutation = (record: Record<string, number>, target: string): void => {
    const current = record[target] ?? 0;
    const amount = Number(delta.value);
    if (delta.operation === "add" || delta.operation === "increment") record[target] = current + amount;
    else if (delta.operation === "remove" || delta.operation === "decrement") record[target] = current - amount;
    else if (delta.operation === "set") record[target] = amount;
    else throw new Error(`Unsupported numeric operation ${delta.operation}`);
  };

  if (delta.domain === "hp") {
    const entry = ledger.hp[delta.target];
    assert(entry, `Missing HP target ${delta.target}`);
    const amount = Number(delta.value);
    if (delta.operation === "decrement" || delta.operation === "remove") entry.current -= amount;
    else if (delta.operation === "increment" || delta.operation === "add") entry.current += amount;
    else if (delta.operation === "set") entry.current = amount;
    else throw new Error(`Unsupported HP operation ${delta.operation}`);
    entry.current = Math.max(0, Math.min(entry.maximum, entry.current));
    entry.active = entry.current > 0;
    return;
  }

  if (delta.domain === "resource") return numericMutation(ledger.resources, delta.target);
  if (delta.domain === "faction") return numericMutation(ledger.faction, delta.target);

  if (delta.domain === "clock") {
    const clock = ledger.clocks[delta.target];
    assert(clock, `Missing clock ${delta.target}`);
    const amount = Number(delta.value);
    if (delta.operation === "increment" || delta.operation === "add") clock.filled += amount;
    else if (delta.operation === "decrement" || delta.operation === "remove") clock.filled -= amount;
    else if (delta.operation === "set") clock.filled = amount;
    else throw new Error(`Unsupported clock operation ${delta.operation}`);
    clock.filled = Math.max(0, Math.min(clock.segments, clock.filled));
    return;
  }

  if (delta.domain === "lock") {
    ledger.locks[delta.target] = delta.operation === "unlock" ? false : Boolean(delta.value ?? true);
    return;
  }

  const record = delta.domain === "fact" ? ledger.facts
    : delta.domain === "quest" ? ledger.quests
    : delta.domain === "npc" ? ledger.npcs
    : ledger.dungeon;
  if (delta.operation === "lock") ledger.locks[delta.target] = true;
  else if (delta.operation === "unlock") record[delta.target] = true;
  else if (delta.operation === "remove") delete record[delta.target];
  else record[delta.target] = delta.value as never;
}

function terminalize(ledger: EncounterLedger, state: TerminalState): void {
  assert(!ledger.terminal, "Encounter is already terminal");
  ledger.terminal = true;
  ledger.terminalState = state;
}

function commit(
  original: EncounterLedger,
  actionId: string,
  deltas: StateDelta[],
  roll?: D20Result,
  terminalState?: TerminalState,
): ResolutionResult {
  if (original.terminal) return { accepted: false, reason: "encounter_already_terminal", ledger: original, terminal: true, terminalState: original.terminalState };
  if (original.locks[`approach:${actionId}`]) return { accepted: false, reason: "approach_locked", ledger: original, terminal: false };

  const ledger = cloneLedger(original);
  const beforeHash = ledgerHash(ledger);
  for (const delta of deltas) applyDelta(ledger, delta);
  ledger.turn += 1;
  if (terminalState) terminalize(ledger, terminalState);
  const afterHash = ledgerHash(ledger);
  assert(beforeHash !== afterHash || terminalState !== undefined, "Purgatory guard: accepted action produced no state change");
  const event: EncounterEvent = {
    id: `${ledger.encounterId}:${ledger.turn}:${actionId}`,
    encounterId: ledger.encounterId,
    turn: ledger.turn,
    actionId,
    beforeHash,
    afterHash,
    deltas,
    roll,
    terminalState,
  };
  ledger.events.push(event);
  return { accepted: true, event, ledger, terminal: ledger.terminal, terminalState: ledger.terminalState };
}

export function resolveCombatAttack(ledger: EncounterLedger, attack: CombatAttack): ResolutionResult {
  const target = ledger.hp[attack.targetId];
  assert(target?.active, "Target is absent or inactive");
  const roll = resolveD20(ledger, attack.attackCheck);
  if (!roll.success) return commit(ledger, attack.actionId, attack.onMiss, roll);

  const variance = rollInclusive(ledger, attack.varianceMin, attack.varianceMax);
  const damage = calculateDamage({ ...attack.damage, defenderDefense: target.defense, variance });
  const remaining = Math.max(0, target.current - damage);
  const deltas: StateDelta[] = [{ domain: "hp", target: attack.targetId, operation: "decrement", value: damage }];
  if (remaining === 0) deltas.push(...attack.onVictory);
  return commit(ledger, attack.actionId, deltas, roll, remaining === 0 ? "victory" : undefined);
}

export function resolveFlee(ledger: EncounterLedger, contract: FleeContract): ResolutionResult {
  if (ledger.locks[`route:${contract.routeId}`]) return { accepted: false, reason: "route_locked", ledger, terminal: false };
  const successClock = ledger.clocks[contract.successClockId];
  const dangerClock = ledger.clocks[contract.dangerClockId];
  assert(successClock && dangerClock, "Flee clocks must exist");
  const roll = resolveD20(ledger, contract.check);
  if (roll.success) {
    const newProgress = Math.min(successClock.segments, successClock.filled + contract.progressOnSuccess);
    const deltas: StateDelta[] = [
      { domain: "clock", target: contract.successClockId, operation: "increment", value: contract.progressOnSuccess },
      ...contract.costOnSuccess,
    ];
    return commit(ledger, contract.actionId, deltas, roll, newProgress >= successClock.segments ? "fled" : undefined);
  }

  const newDanger = Math.min(dangerClock.segments, dangerClock.filled + contract.dangerOnFailure);
  const deltas: StateDelta[] = [
    { domain: "clock", target: contract.dangerClockId, operation: "increment", value: contract.dangerOnFailure },
    ...contract.costOnFailure,
  ];
  if (contract.failureLocksCurrentRoute) deltas.push({ domain: "lock", target: `route:${contract.routeId}`, operation: "lock", value: true });
  return commit(ledger, contract.actionId, deltas, roll, newDanger >= dangerClock.segments ? "defeat" : undefined);
}

export function resolveParley(ledger: EncounterLedger, contract: ParleyContract): ResolutionResult {
  const current = ledger.resources[contract.leverageId] ?? 0;
  if (current < contract.leverageCost) return { accepted: false, reason: "insufficient_leverage", ledger, terminal: false };
  if (!contract.thresholdFacts.every((fact) => Boolean(ledger.facts[fact]))) {
    return { accepted: false, reason: "parley_threshold_not_met", ledger, terminal: false };
  }
  const roll = contract.check ? resolveD20(ledger, contract.check) : undefined;
  const accepted = roll ? roll.success : true;
  const selected = accepted ? contract.success : contract.refusal;
  const deltas: StateDelta[] = [
    { domain: "resource", target: contract.leverageId, operation: "decrement", value: contract.leverageCost },
    ...selected.deltas,
  ];
  if (!accepted) deltas.push({ domain: "lock", target: `approach:${contract.actionId}`, operation: "lock", value: true });
  return commit(ledger, contract.actionId, deltas, roll, selected.terminal ? selected.terminalState : undefined);
}

export function resolveSkillCheck(
  ledger: EncounterLedger,
  actionId: string,
  check: D20Check,
  success: OutcomeContract,
  failure: OutcomeContract,
): ResolutionResult {
  const roll = resolveD20(ledger, check);
  const selected = roll.success ? success : failure;
  return commit(ledger, actionId, selected.deltas, roll, selected.terminal ? selected.terminalState : undefined);
}

export function resolveClockAction(ledger: EncounterLedger, contract: ClockActionContract): ResolutionResult {
  const successClock = ledger.clocks[contract.successClockId];
  const dangerClock = ledger.clocks[contract.dangerClockId];
  assert(successClock && dangerClock, "Clock action requires success and danger clocks");
  if (contract.leverageId) {
    const current = ledger.resources[contract.leverageId] ?? 0;
    if (current < (contract.leverageCost ?? 0)) return { accepted: false, reason: "insufficient_leverage", ledger, terminal: false };
  }
  const roll = contract.check ? resolveD20(ledger, contract.check) : undefined;
  const succeeded = roll ? roll.success : true;
  const mixed = Boolean(roll && roll.success && roll.total === roll.target);
  const successTicks = mixed ? contract.partialTicks : succeeded ? contract.successTicks : 0;
  const dangerTicks = succeeded ? (mixed ? contract.dangerTicks : 0) : contract.dangerTicks;
  const deltas: StateDelta[] = [];
  if (contract.leverageId && contract.leverageCost) {
    deltas.push({ domain: "resource", target: contract.leverageId, operation: "decrement", value: contract.leverageCost });
    deltas.push({ domain: "lock", target: `leverage:${contract.leverageId}:used:${ledger.turn}`, operation: "lock", value: true });
  }
  if (successTicks) deltas.push({ domain: "clock", target: contract.successClockId, operation: "increment", value: successTicks });
  if (dangerTicks) deltas.push({ domain: "clock", target: contract.dangerClockId, operation: "increment", value: dangerTicks });
  if (mixed) deltas.push(...contract.onPartialCost);

  const nextSuccess = Math.min(successClock.segments, successClock.filled + successTicks);
  const nextDanger = Math.min(dangerClock.segments, dangerClock.filled + dangerTicks);
  if (nextSuccess >= successClock.segments && nextDanger >= dangerClock.segments) {
    const tieDeltas = [...deltas, ...contract.onSuccess.deltas, ...contract.onPartialCost];
    return commit(ledger, contract.actionId, tieDeltas, roll, "partial");
  }
  if (nextSuccess >= successClock.segments) {
    return commit(ledger, contract.actionId, [...deltas, ...contract.onSuccess.deltas], roll, contract.onSuccess.terminalState);
  }
  if (nextDanger >= dangerClock.segments) {
    return commit(ledger, contract.actionId, [...deltas, ...contract.onDanger.deltas], roll, contract.onDanger.terminalState);
  }
  return commit(ledger, contract.actionId, deltas, roll);
}

export function resolveCrisisChoice(ledger: EncounterLedger, contract: CrisisContract): ResolutionResult {
  if (ledger.facts[`crisis:${contract.crisisId}:committed`]) {
    return { accepted: false, reason: "crisis_already_committed", ledger, terminal: ledger.terminal, terminalState: ledger.terminalState };
  }
  const option = contract.option;
  const deltas: StateDelta[] = [
    { domain: "fact", target: `crisis:${contract.crisisId}:committed`, operation: "set", value: true },
    { domain: "fact", target: `choice-group:${option.exclusiveFactGroup}`, operation: "set", value: option.id },
    { domain: "fact", target: option.setFact, operation: "set", value: true },
    { domain: "lock", target: `fact:${option.lockOpposedFact}`, operation: "lock", value: true },
    { domain: "quest", target: option.callbackId, operation: "unlock", value: true },
    { domain: "fact", target: `ending:${option.endingEligibility}`, operation: "set", value: true },
    { domain: "fact", target: `convergence:${option.convergenceId}:preserve-flags`, operation: "set", value: true },
    ...option.deltas,
  ];
  return commit(ledger, contract.actionId, deltas, undefined, "crisisEnding");
}

export function enforceTurnBound(ledger: EncounterLedger, contract: ForcedTerminalContract): ResolutionResult {
  if (ledger.terminal) return { accepted: false, reason: "encounter_already_terminal", ledger, terminal: true, terminalState: ledger.terminalState };
  if (ledger.turn < ledger.maxTurns) return { accepted: false, reason: "turn_bound_not_reached", ledger, terminal: false };
  return commit(ledger, "forced-terminal", contract.outcome.deltas, undefined, contract.outcome.terminalState);
}

export function buildAftermathReceipt(
  ledgerBeforeAftermath: EncounterLedger,
  mutations: AftermathMutation[],
): { ledger: EncounterLedger; receipt: AftermathReceipt } {
  assert(ledgerBeforeAftermath.terminal && ledgerBeforeAftermath.terminalState, "Aftermath requires a terminal encounter");
  const nonemptyTypes = new Set(mutations.map((mutation) => mutation.type));
  assert(nonemptyTypes.size >= 2, "Aftermath requires at least two receipt types");
  const commitKey = `${ledgerBeforeAftermath.encounterId}:${ledgerBeforeAftermath.terminalState}:${ledgerBeforeAftermath.templateVersion}`;
  assert(!ledgerBeforeAftermath.appliedCommitKeys[commitKey], "Aftermath already applied");

  const ledger = cloneLedger(ledgerBeforeAftermath);
  const beforeHash = ledgerHash(ledger);
  for (const mutation of mutations) {
    const domain: StateDelta["domain"] = mutation.type === "xp" ? "resource"
      : mutation.type === "loot" ? "resource"
      : mutation.type;
    applyDelta(ledger, { domain, target: mutation.target, operation: mutation.operation, value: mutation.value });
  }
  ledger.appliedCommitKeys[commitKey] = true;
  const afterHash = ledgerHash(ledger);
  const receipt: AftermathReceipt = {
    receiptId: `receipt:${commitKey}`,
    commitKey,
    encounterId: ledger.encounterId,
    templateId: ledger.templateId,
    templateVersion: ledger.templateVersion,
    terminalState: ledger.terminalState!,
    turn: ledger.turn,
    mutations,
    eventIds: ledger.events.map((event) => event.id),
    beforeHash,
    afterHash,
  };
  return { ledger, receipt };
}

export function assertEncounterIntegrity(ledger: EncounterLedger): void {
  assert(ledger.maxTurns >= 1 && ledger.maxTurns <= 30, "Encounter bound invalid");
  assert(ledger.turn <= ledger.maxTurns + 1, "Encounter exceeded terminal bound");
  if (ledger.terminal) assert(Boolean(ledger.terminalState), "Terminal encounter lacks terminal state");
  for (const [id, hp] of Object.entries(ledger.hp)) {
    assert(hp.current >= 0 && hp.current <= hp.maximum, `HP invariant failed for ${id}`);
    assert(hp.active === (hp.current > 0), `Active/HP mismatch for ${id}`);
  }
  for (const [id, clock] of Object.entries(ledger.clocks)) {
    assert(clock.filled >= 0 && clock.filled <= clock.segments, `Clock invariant failed for ${id}`);
  }
  for (let index = 1; index < ledger.events.length; index += 1) {
    assert(ledger.events[index - 1].afterHash === ledger.events[index].beforeHash, "Event hash chain broken");
  }
}
