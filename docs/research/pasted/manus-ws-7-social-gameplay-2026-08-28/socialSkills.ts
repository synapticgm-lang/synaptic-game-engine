/**
 * WS-7 Social Skill System specification.
 *
 * Design contract:
 * 1. The engine commits feasibility, DC, stakes, costs, and consequences before prose generation.
 * 2. Routine, impossible, consent-sensitive, and already-earned outcomes never roll.
 * 3. A d20 is used only when an uncertain high-stakes proposition can change durable state.
 * 4. The LLM may realize the committed result in prose but may not invent a different result.
 */

export type SocialSkill = "persuade" | "intimidate" | "deceive" | "insight";
export type GameMode = "dnd" | "rpg" | "pyoa" | "litrpg";
export type CheckTier = "automatic_success" | "roll" | "automatic_failure";
export type OutcomeBand = "critical_success" | "success" | "partial" | "failure" | "critical_failure";
export type Disposition = "hostile" | "wary" | "neutral" | "friendly" | "allied" | "loyal";
export type StakesCategory =
  | "access"
  | "information"
  | "alliance"
  | "betrayal"
  | "moral_weight"
  | "status"
  | "safety"
  | "time"
  | "resources"
  | "identity";

export interface SocialActorStats {
  actorId: string;
  level: number;
  proficiencyBonus: number;
  charismaModifier: number;
  wisdomModifier: number;
  skillRanks: Record<SocialSkill, number>;
  tags: string[];
  factionStanding: Record<string, number>;
}

export interface RelationshipContext {
  npcId: string;
  disposition: Disposition;
  trust: number; // -100..100
  fear: number; // 0..100; not a substitute for trust
  respect: number; // 0..100
  promisesKept: number;
  promisesBroken: number;
  milestones: string[];
}

export interface EvidenceRef {
  evidenceId: string;
  strength: 0 | 1 | 2 | 3 | 4 | 5;
  verified: boolean;
  relevantToProposition: boolean;
  compromised: boolean;
}

export interface SocialStakes {
  category: StakesCategory;
  playerGain: string;
  playerLoss: string;
  npcGain: string;
  npcLoss: string;
  irreversible: boolean;
}

export interface SocialProposition {
  propositionId: string;
  crisisId: string;
  skill: SocialSkill;
  mode: GameMode;
  intent: string;
  requestedConcession: string;
  stakes: SocialStakes[];
  baseDc: number; // Usually 8..24.
  highStakes: boolean;
  uncertain: boolean;
  plausible: boolean;
  violatesConsentOrAgency: boolean;
  repeatsResolvedProposition: boolean;
  exactAttemptFingerprint: string;
  evidence: EvidenceRef[];
  leverageInstanceId?: string;
  costOnAttempt: StateMutation[];
  outcomeTemplates: Record<OutcomeBand, StateMutation[]>;
  reopenConditions: string[];
}

export interface StateMutation {
  path: string;
  operation: "add" | "set" | "append" | "remove" | "open" | "close" | "schedule";
  value: unknown;
  reason: string;
}

export interface CheckModifiers {
  skill: number;
  relationship: number;
  evidence: number;
  leverage: number;
  faction: number;
  circumstance: number;
  total: number;
  explanations: string[];
}

export interface SocialCheckCommit {
  commitId: string;
  propositionId: string;
  tier: CheckTier;
  skill: SocialSkill;
  dc: number | null;
  modifiers: CheckModifiers;
  roll: number | null;
  total: number | null;
  margin: number | null;
  band: OutcomeBand;
  mutations: StateMutation[];
  consumedAttemptFingerprint: string;
  reopenConditions: string[];
  proseConstraints: string[];
  audit: {
    rngSeed?: string;
    createdTurn: number;
    ruleVersion: "ws7-social-v1";
  };
}

export interface ResolutionContext {
  actor: SocialActorStats;
  relationship: RelationshipContext;
  targetFactionId?: string;
  relevantFactionAuthority: boolean;
  leverageModifier: number; // -6..+6, supplied by leverageMechanics.ts
  circumstanceModifier: number; // -5..+5
  priorAttemptFingerprints: ReadonlySet<string>;
  turn: number;
  rng: () => number; // Deterministic seeded value in [0, 1).
}

const DISPOSITION_MODIFIER: Record<Disposition, number> = {
  hostile: -6,
  wary: -3,
  neutral: 0,
  friendly: 2,
  allied: 4,
  loyal: 6,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function modifierForSkill(actor: SocialActorStats, skill: SocialSkill): number {
  const ability = skill === "insight" ? actor.wisdomModifier : actor.charismaModifier;
  const ranks = clamp(actor.skillRanks[skill], 0, 5);
  const proficiency = ranks === 0 ? 0 : actor.proficiencyBonus;
  const expertise = ranks >= 4 ? actor.proficiencyBonus : 0;
  return ability + proficiency + expertise + ranks;
}

function modifierForRelationship(r: RelationshipContext, skill: SocialSkill): number {
  const disposition = DISPOSITION_MODIFIER[r.disposition];
  const trust = Math.trunc(r.trust / 25); // -4..+4
  const history = clamp(r.promisesKept - r.promisesBroken * 2, -3, 3);

  if (skill === "intimidate") {
    // Fear may induce compliance, but respect and trust moderate backlash elsewhere.
    return clamp(Math.trunc(r.fear / 25) + Math.trunc(r.respect / 50), -2, 5);
  }
  if (skill === "deceive") {
    // High trust makes a plausible lie easier now, while betrayal consequences are larger later.
    return clamp(Math.trunc(r.trust / 35), -3, 3);
  }
  if (skill === "insight") {
    return clamp(Math.trunc(r.trust / 50) + Math.trunc(r.respect / 50), -2, 3);
  }
  return clamp(disposition + trust + history, -8, 8);
}

function modifierForEvidence(evidence: readonly EvidenceRef[], skill: SocialSkill): number {
  const relevant = evidence.filter((e) => e.relevantToProposition && !e.compromised);
  if (relevant.length === 0) return skill === "deceive" ? 0 : -2;
  const best = Math.max(...relevant.map((e) => e.strength + (e.verified ? 1 : 0)));
  if (skill === "deceive") {
    // Real corroborating details can support a lie, but verified contradictory evidence is handled as circumstance.
    return clamp(best - 3, -1, 3);
  }
  return clamp(best - 2, -2, 4);
}

function modifierForFaction(ctx: ResolutionContext): number {
  if (!ctx.targetFactionId || !ctx.relevantFactionAuthority) return 0;
  return clamp(Math.trunc((ctx.actor.factionStanding[ctx.targetFactionId] ?? 0) / 20), -5, 5);
}

export function calculateModifiers(
  proposition: SocialProposition,
  ctx: ResolutionContext,
): CheckModifiers {
  const skill = modifierForSkill(ctx.actor, proposition.skill);
  const relationship = modifierForRelationship(ctx.relationship, proposition.skill);
  const evidence = modifierForEvidence(proposition.evidence, proposition.skill);
  const leverage = clamp(ctx.leverageModifier, -6, 6);
  const faction = modifierForFaction(ctx);
  const circumstance = clamp(ctx.circumstanceModifier, -5, 5);
  const total = skill + relationship + evidence + leverage + faction + circumstance;

  return {
    skill,
    relationship,
    evidence,
    leverage,
    faction,
    circumstance,
    total,
    explanations: [
      `skill ${skill >= 0 ? "+" : ""}${skill}`,
      `relationship ${relationship >= 0 ? "+" : ""}${relationship}`,
      `evidence ${evidence >= 0 ? "+" : ""}${evidence}`,
      `leverage ${leverage >= 0 ? "+" : ""}${leverage}`,
      `faction ${faction >= 0 ? "+" : ""}${faction}`,
      `circumstance ${circumstance >= 0 ? "+" : ""}${circumstance}`,
    ],
  };
}

/**
 * Determine whether to roll.
 *
 * GM narration is mandatory when an outcome is already earned, impossible, consent-sensitive,
 * or repeated. A roll is reserved for uncertain, plausible, high-stakes propositions.
 */
export function determineCheckTier(
  proposition: SocialProposition,
  ctx: ResolutionContext,
): CheckTier {
  if (proposition.violatesConsentOrAgency) return "automatic_failure";
  if (!proposition.plausible) return "automatic_failure";
  if (
    proposition.repeatsResolvedProposition ||
    ctx.priorAttemptFingerprints.has(proposition.exactAttemptFingerprint)
  ) {
    return "automatic_failure";
  }
  if (!proposition.uncertain || !proposition.highStakes) return "automatic_success";
  return "roll";
}

export function bandFromMargin(margin: number, naturalRoll: number): OutcomeBand {
  if (naturalRoll === 20 && margin >= 0) return "critical_success";
  if (naturalRoll === 1 && margin < 0) return "critical_failure";
  if (margin >= 5) return "critical_success";
  if (margin >= 0) return "success";
  if (margin >= -4) return "partial";
  if (margin >= -9) return "failure";
  return "critical_failure";
}

function automaticBand(tier: CheckTier): OutcomeBand {
  return tier === "automatic_success" ? "success" : "failure";
}

function outcomeProseConstraints(
  proposition: SocialProposition,
  band: OutcomeBand,
  modifiers: CheckModifiers,
): string[] {
  return [
    `Honor committed outcome band: ${band}.`,
    `Honor the bounded concession: ${proposition.requestedConcession}.`,
    `Mention at least one visible stake or cost.`,
    `Do not silently reopen closed paths.`,
    `Do not reverse or omit committed state mutations.`,
    `Treat modifier explanations as context, not dialogue the NPC must recite: ${modifiers.explanations.join(", ")}.`,
  ];
}

export function resolveSocialCheck(
  proposition: SocialProposition,
  ctx: ResolutionContext,
  ids: { commitId: string; rngSeed?: string },
): SocialCheckCommit {
  const tier = determineCheckTier(proposition, ctx);
  const modifiers = calculateModifiers(proposition, ctx);
  const dc = tier === "roll" ? clamp(proposition.baseDc, 5, 30) : null;
  const roll = tier === "roll" ? Math.floor(ctx.rng() * 20) + 1 : null;
  const total = roll === null ? null : roll + modifiers.total;
  const margin = total === null || dc === null ? null : total - dc;
  const band = margin === null ? automaticBand(tier) : bandFromMargin(margin, roll!);

  return {
    commitId: ids.commitId,
    propositionId: proposition.propositionId,
    tier,
    skill: proposition.skill,
    dc,
    modifiers,
    roll,
    total,
    margin,
    band,
    mutations: [
      ...proposition.costOnAttempt,
      ...proposition.outcomeTemplates[band],
    ],
    consumedAttemptFingerprint: proposition.exactAttemptFingerprint,
    reopenConditions: proposition.reopenConditions,
    proseConstraints: outcomeProseConstraints(proposition, band, modifiers),
    audit: {
      rngSeed: ids.rngSeed,
      createdTurn: ctx.turn,
      ruleVersion: "ws7-social-v1",
    },
  };
}

/** Genre adapters alter presentation, not the committed result. */
export const GENRE_ADAPTERS: Record<GameMode, string[]> = {
  dnd: [
    "Display d20, modifier, and DC for high-stakes rolls.",
    "Let NPC attitude cap what a check can obtain; Persuasion is not mind control.",
  ],
  rpg: [
    "Expose leverage, evidence, and relationship prerequisites as inspectable dialogue affordances.",
    "Apply quest, path, and faction mutations immediately after the commit.",
  ],
  pyoa: [
    "Render Insight as an attributed inner comment that may be perceptive, biased, or incomplete.",
    "Hide numeric DC unless the fiction supports explicit system knowledge.",
  ],
  litrpg: [
    "Display skill, faction, and relationship threshold contributions.",
    "Issue System notices only for durable milestones, not every conversational beat.",
  ],
};

/** Integration sequence: ArcDirector -> resolver -> state stores -> proseWarden -> GM prose. */
export interface SocialResolutionEnvelope {
  crisisCommitId: string;
  proposition: SocialProposition;
  relationshipSnapshotVersion: number;
  leverageSnapshotVersion: number;
  result: SocialCheckCommit;
  applyBeforeProse: true;
}
