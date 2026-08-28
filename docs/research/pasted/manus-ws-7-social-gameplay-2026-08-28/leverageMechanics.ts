/** WS-7 leverage mechanics: leverage is target-specific evidence, not a repeatable dialogue verb. */

export type LeverageType =
  | "physical_threat"
  | "exposure"
  | "moral_appeal"
  | "faction_authority"
  | "debt_owed"
  | "blackmail";

export type LeverageStatus = "fresh" | "offered" | "consumed" | "failed" | "expired" | "compromised";
export type LeverageResult = "success" | "partial" | "failure" | "blocked";
export type PropagationChannel = "witness" | "confidant" | "faction_network" | "public_record" | "rumor";

export interface LeverageAsset {
  leverageId: string;
  type: LeverageType;
  sourceEventId: string;
  ownerActorId: string;
  subjectActorIds: string[];
  targetNpcIds: string[];
  targetFactionIds: string[];
  claim: string;
  evidenceStrength: 0 | 1 | 2 | 3 | 4 | 5;
  credibility: 0 | 1 | 2 | 3 | 4 | 5;
  relevance: 0 | 1 | 2 | 3 | 4 | 5;
  legality: "lawful" | "ambiguous" | "illegal";
  status: LeverageStatus;
  acquiredTurn: number;
  expiresTurn?: number;
  copies: number;
  tags: string[];
}

export interface TargetPressureProfile {
  npcId: string;
  fears: string[];
  wants: string[];
  duties: string[];
  taboos: string[];
  resolve: number; // 0..100
  riskTolerance: number; // 0..100
  disposition: "hostile" | "wary" | "neutral" | "friendly" | "allied" | "loyal";
  trust: number; // -100..100
  factionWeight: Record<string, number>; // -100..100
  proofResistance: number; // 0..5; institutional ability to dispute proof
}

export interface LeverageUse {
  useId: string;
  leverageId: string;
  targetNpcId: string;
  propositionId: string;
  requestedConcession: string;
  approach: "threaten" | "trade" | "appeal" | "invoke_authority" | "collect_debt";
  offeredTurn: number;
  public: boolean;
  witnesses: string[];
}

export interface LeverageLedgerEntry {
  leverageId: string;
  targetNpcId: string;
  firstUseTurn: number;
  lastUseTurn: number;
  useCount: number;
  lastResult: LeverageResult;
  exhausted: boolean;
  reopenEvidenceStrengthFloor?: number;
  notes: string[];
}

export interface LeverageResolutionContext {
  asset: LeverageAsset;
  use: LeverageUse;
  target: TargetPressureProfile;
  ledger?: LeverageLedgerEntry;
  propositionScale: 1 | 2 | 3 | 4 | 5; // favor -> identity/leadership sacrifice
  matchingPressureTags: string[];
  opposingDutyTags: string[];
  issuerFactionId?: string;
  currentTurn: number;
}

export interface LeverageResolution {
  result: LeverageResult;
  score: number;
  threshold: number;
  socialCheckModifier: number; // -6..+6, consumed by socialSkills.ts
  consumeAsset: boolean;
  ledgerEntry: LeverageLedgerEntry;
  consequences: Array<{
    path: string;
    operation: "add" | "set" | "append" | "schedule";
    value: unknown;
    reason: string;
  }>;
  propagation: KnowledgePropagation[];
  reasons: string[];
}

export interface KnowledgePropagation {
  factId: string;
  sourceNpcId: string;
  recipientSelector: { npcIds?: string[]; factionIds?: string[] };
  channel: PropagationChannel;
  confidence: number; // 0..100
  salience: number; // 0..100
  availableTurn: number;
  expiryTurn?: number;
}

export interface LeverageRule {
  type: LeverageType;
  worksWhen: string[];
  failsWhen: string[];
  defaultTrustDeltaOnSuccess: number;
  defaultTrustDeltaOnFailure: number;
  defaultFearDeltaOnSuccess: number;
  factionRisk: "low" | "medium" | "high";
}

export const LEVERAGE_CATALOG: Record<LeverageType, LeverageRule> = {
  physical_threat: {
    type: "physical_threat",
    worksWhen: ["threat is credible", "target values immediate safety", "target lacks a better protector"],
    failsWhen: ["target prefers death or martyrdom", "target can call superior force", "threat contradicts established player behavior"],
    defaultTrustDeltaOnSuccess: -18,
    defaultTrustDeltaOnFailure: -12,
    defaultFearDeltaOnSuccess: 20,
    factionRisk: "high",
  },
  exposure: {
    type: "exposure",
    worksWhen: ["evidence is credible", "audience matters to target", "player controls a publication path"],
    failsWhen: ["secret is already known", "target can survive disclosure", "evidence is compromised"],
    defaultTrustDeltaOnSuccess: -12,
    defaultTrustDeltaOnFailure: -10,
    defaultFearDeltaOnSuccess: 10,
    factionRisk: "medium",
  },
  moral_appeal: {
    type: "moral_appeal",
    worksWhen: ["appeal matches a demonstrated value or duty", "requested cost is proportionate", "speaker has moral credibility"],
    failsWhen: ["target rejects the invoked value", "speaker is visibly hypocritical", "appeal conceals a self-serving demand"],
    defaultTrustDeltaOnSuccess: 10,
    defaultTrustDeltaOnFailure: -4,
    defaultFearDeltaOnSuccess: 0,
    factionRisk: "low",
  },
  faction_authority: {
    type: "faction_authority",
    worksWhen: ["authority is recognized", "order falls within jurisdiction", "standing has not been revoked"],
    failsWhen: ["target serves a rival authority", "order is ultra vires", "credential is false or expired"],
    defaultTrustDeltaOnSuccess: -2,
    defaultTrustDeltaOnFailure: -8,
    defaultFearDeltaOnSuccess: 4,
    factionRisk: "medium",
  },
  debt_owed: {
    type: "debt_owed",
    worksWhen: ["debt is acknowledged or witnessed", "requested repayment is proportionate", "target retains capacity to pay"],
    failsWhen: ["debt was discharged", "request exceeds the debt", "target disputes the underlying favor"],
    defaultTrustDeltaOnSuccess: 2,
    defaultTrustDeltaOnFailure: -6,
    defaultFearDeltaOnSuccess: 0,
    factionRisk: "low",
  },
  blackmail: {
    type: "blackmail",
    worksWhen: ["evidence is damaging and controlled", "demand is bounded", "target cannot preempt publication"],
    failsWhen: ["target confesses first", "copies are unsecured", "demand is worse than exposure"],
    defaultTrustDeltaOnSuccess: -25,
    defaultTrustDeltaOnFailure: -20,
    defaultFearDeltaOnSuccess: 15,
    factionRisk: "high",
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const DISPOSITION_SCORE = {
  hostile: -3,
  wary: -1,
  neutral: 0,
  friendly: 1,
  allied: 2,
  loyal: 3,
} as const;

function authorityScore(ctx: LeverageResolutionContext): number {
  if (ctx.asset.type !== "faction_authority" || !ctx.issuerFactionId) return 0;
  return clamp(Math.trunc((ctx.target.factionWeight[ctx.issuerFactionId] ?? 0) / 20), -5, 5);
}

function pressureFit(ctx: LeverageResolutionContext): number {
  const matching = clamp(ctx.matchingPressureTags.length * 2, 0, 6);
  const opposing = clamp(ctx.opposingDutyTags.length * 2, 0, 6);
  return matching - opposing;
}

function targetResistance(target: TargetPressureProfile): number {
  return Math.trunc(target.resolve / 20) + Math.trunc(target.riskTolerance / 25) + target.proofResistance;
}

function requestedCost(scale: LeverageResolutionContext["propositionScale"]): number {
  return { 1: 1, 2: 3, 3: 5, 4: 8, 5: 11 }[scale];
}

function isExpired(asset: LeverageAsset, turn: number): boolean {
  return asset.status === "expired" || (asset.expiresTurn !== undefined && asset.expiresTurn < turn);
}

function blockedReason(ctx: LeverageResolutionContext): string | undefined {
  const { asset, use, ledger, currentTurn } = ctx;
  if (asset.status === "consumed" || asset.status === "failed") return "asset is already exhausted";
  if (asset.status === "compromised") return "asset is compromised";
  if (isExpired(asset, currentTurn)) return "asset has expired";
  if (!asset.targetNpcIds.includes(use.targetNpcId) && asset.targetNpcIds.length > 0) return "asset is not valid for this target";
  if (ledger?.exhausted) return "same leverage cannot influence the same NPC twice";
  if (ledger && ledger.useCount >= 1) return "target-specific cooldown is permanent until stronger new evidence is registered";
  return undefined;
}

function buildLedger(
  ctx: LeverageResolutionContext,
  result: LeverageResult,
  exhausted: boolean,
): LeverageLedgerEntry {
  const old = ctx.ledger;
  return {
    leverageId: ctx.asset.leverageId,
    targetNpcId: ctx.target.npcId,
    firstUseTurn: old?.firstUseTurn ?? ctx.currentTurn,
    lastUseTurn: ctx.currentTurn,
    useCount: (old?.useCount ?? 0) + 1,
    lastResult: result,
    exhausted,
    reopenEvidenceStrengthFloor: exhausted ? Math.min(5, ctx.asset.evidenceStrength + 1) : undefined,
    notes: [...(old?.notes ?? []), `${ctx.use.approach}:${result}`],
  };
}

function propagationFor(ctx: LeverageResolutionContext, result: LeverageResult): KnowledgePropagation[] {
  const { asset, use, target, currentTurn } = ctx;
  const salience = asset.type === "blackmail" || asset.type === "physical_threat" ? 90 : 65;
  const rows: KnowledgePropagation[] = [];

  if (use.public || use.witnesses.length > 0) {
    rows.push({
      factId: `leverage-use:${use.useId}`,
      sourceNpcId: target.npcId,
      recipientSelector: { npcIds: use.witnesses },
      channel: "witness",
      confidence: 100,
      salience,
      availableTurn: currentTurn,
    });
  }

  if (asset.targetFactionIds.length > 0 || target.factionWeight) {
    rows.push({
      factId: `leverage-use:${use.useId}:${result}`,
      sourceNpcId: target.npcId,
      recipientSelector: { factionIds: asset.targetFactionIds },
      channel: use.public ? "public_record" : "faction_network",
      confidence: use.public ? 100 : 75,
      salience,
      availableTurn: currentTurn + (use.public ? 0 : 3),
      expiryTurn: currentTurn + 100,
    });
  }
  return rows;
}

/**
 * Resolve whether leverage creates a modifier and what it costs.
 * The subsequent social check still determines execution unless the proposition is automatic.
 */
export function resolveLeverage(ctx: LeverageResolutionContext): LeverageResolution {
  const blocked = blockedReason(ctx);
  if (blocked) {
    return {
      result: "blocked",
      score: -99,
      threshold: 0,
      socialCheckModifier: -6,
      consumeAsset: false,
      ledgerEntry: ctx.ledger ?? buildLedger(ctx, "blocked", true),
      consequences: [],
      propagation: [],
      reasons: [blocked],
    };
  }

  const assetPower = ctx.asset.evidenceStrength + ctx.asset.credibility + ctx.asset.relevance;
  const fit = pressureFit(ctx);
  const authority = authorityScore(ctx);
  const relationship = DISPOSITION_SCORE[ctx.target.disposition] + Math.trunc(ctx.target.trust / 40);
  const resistance = targetResistance(ctx.target);
  const cost = requestedCost(ctx.propositionScale);
  const score = assetPower + fit + authority + relationship - resistance - cost;
  const threshold = 0;
  const result: LeverageResult = score >= 5 ? "success" : score >= 0 ? "partial" : "failure";
  const socialCheckModifier = clamp(score, -6, 6);
  const rule = LEVERAGE_CATALOG[ctx.asset.type];
  const consumeAsset = true;
  const ledgerEntry = buildLedger(ctx, result, true);
  const trustDelta = result === "success"
    ? rule.defaultTrustDeltaOnSuccess
    : result === "partial"
      ? Math.trunc(rule.defaultTrustDeltaOnSuccess / 2)
      : rule.defaultTrustDeltaOnFailure;

  const consequences: LeverageResolution["consequences"] = [
    { path: `leverage.${ctx.asset.leverageId}.status`, operation: "set", value: result === "failure" ? "failed" : "consumed", reason: "one-use leverage rule" },
    { path: `relationships.${ctx.target.npcId}.trust`, operation: "add", value: trustDelta, reason: `${ctx.asset.type} ${result}` },
    { path: `relationships.${ctx.target.npcId}.milestones`, operation: "append", value: `leverage_${result}:${ctx.asset.leverageId}`, reason: "durable coercion/deal memory" },
  ];

  if (result !== "failure" && rule.defaultFearDeltaOnSuccess !== 0) {
    consequences.push({ path: `relationships.${ctx.target.npcId}.fear`, operation: "add", value: rule.defaultFearDeltaOnSuccess, reason: `${ctx.asset.type} compliance` });
  }
  if (rule.factionRisk === "high") {
    consequences.push({ path: "events.scheduled", operation: "schedule", value: { kind: "leverage_reputation_reaction", dueTurn: ctx.currentTurn + 5, useId: ctx.use.useId }, reason: "connected NPCs may react" });
  }

  return {
    result,
    score,
    threshold,
    socialCheckModifier,
    consumeAsset,
    ledgerEntry,
    consequences,
    propagation: propagationFor(ctx, result),
    reasons: [
      `asset power ${assetPower}`,
      `pressure fit ${fit}`,
      `authority ${authority}`,
      `relationship ${relationship}`,
      `target resistance -${resistance}`,
      `requested cost -${cost}`,
    ],
  };
}

/** Stronger evidence is a new leverage instance, never a reset of the old instance. */
export function mayRegisterEscalatedLeverage(
  previous: LeverageLedgerEntry,
  candidate: LeverageAsset,
): boolean {
  return (
    previous.exhausted &&
    candidate.leverageId !== previous.leverageId &&
    candidate.evidenceStrength >= (previous.reopenEvidenceStrengthFloor ?? 6)
  );
}
