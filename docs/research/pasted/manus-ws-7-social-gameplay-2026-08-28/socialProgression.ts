/** WS-7 social progression: advancement rewards durable social outcomes, not repeated dialogue. */

export type SocialSkill = "persuade" | "intimidate" | "deceive" | "insight";
export type XpSource =
  | "social_check_success"
  | "social_check_partial"
  | "leverage_win"
  | "crisis_resolution"
  | "favor_granted"
  | "promise_kept"
  | "relationship_milestone"
  | "faction_milestone"
  | "nonviolent_quest_completion"
  | "new_information";

export interface SocialXpEvent {
  eventId: string;
  actorId: string;
  source: XpSource;
  sourceObjectId: string;
  turn: number;
  noveltyKey: string;
  baseXp: number;
  stakesMultiplier: number;
  difficultyMultiplier: number;
  parityAdjustment: number;
  finalXp: number;
  notes: string[];
}

export interface SocialProgressionState {
  actorId: string;
  socialXp: number;
  level: number;
  skillRanks: Record<SocialSkill, number>;
  unlockedNodes: string[];
  awardedNoveltyKeys: string[];
  titles: string[];
  revision: number;
}

export interface SkillTreeNode {
  nodeId: string;
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  cost: number;
  prerequisites: string[];
  grants: string[];
  modeNotes: Partial<Record<"dnd" | "rpg" | "pyoa" | "litrpg", string>>;
}

export const SOCIAL_SKILL_TREE: SkillTreeNode[] = [
  {
    nodeId: "social.t1.persuade",
    tier: 1,
    name: "Persuasive Appeal",
    description: "Frame a bounded request around shared interest, value, or reciprocal benefit.",
    cost: 1,
    prerequisites: [],
    grants: ["persuade_rank_1", "show_primary_stake_category"],
    modeNotes: { dnd: "Persuasion proficiency", pyoa: "inner framing of what the NPC values" },
  },
  {
    nodeId: "social.t1.insight",
    tier: 1,
    name: "Reading the Room",
    description: "Identify one visible motive, pressure point, or audience effect without revealing a correct answer.",
    cost: 1,
    prerequisites: [],
    grants: ["insight_rank_1", "reveal_one_pressure_tag"],
    modeNotes: { pyoa: "inner voice may reveal its own bias", litrpg: "System reveals a qualitative pressure tag" },
  },
  {
    nodeId: "social.t2.intimidate",
    tier: 2,
    name: "Credible Threat",
    description: "Convert demonstrated capacity into compliance while making trust and faction risk explicit.",
    cost: 2,
    prerequisites: ["social.t1.persuade"],
    grants: ["intimidate_rank_1", "preview_threat_backlash"],
    modeNotes: { dnd: "Intimidation proficiency", rpg: "fear and backlash are separate outputs" },
  },
  {
    nodeId: "social.t2.deceive",
    tier: 2,
    name: "Plausible Deception",
    description: "Use known facts to construct a bounded false belief and create a discovery event.",
    cost: 2,
    prerequisites: ["social.t1.insight"],
    grants: ["deceive_rank_1", "preview_discovery_channel"],
    modeNotes: { pyoa: "store lie fingerprint for later self- and NPC callbacks", rpg: "show corroboration prerequisites" },
  },
  {
    nodeId: "social.t3.leverage",
    tier: 3,
    name: "Leverage Appraisal",
    description: "Estimate evidence strength, target fit, and whether the requested concession is proportionate.",
    cost: 3,
    prerequisites: ["social.t1.insight", "social.t2.intimidate"],
    grants: ["inspect_leverage_fit", "reveal_reopen_evidence_floor"],
    modeNotes: { litrpg: "display contribution bands, not hidden resolve", dnd: "credible leverage may grant advantage or a DC shift" },
  },
  {
    nodeId: "social.t3.repair",
    tier: 3,
    name: "Restorative Practice",
    description: "Unlock explicit restitution proposals after a broken promise, humiliation, or betrayal.",
    cost: 3,
    prerequisites: ["social.t1.persuade", "social.t1.insight"],
    grants: ["relationship_repair_actions", "show_unrepaired_milestone"],
    modeNotes: { pyoa: "supports apology without guaranteeing forgiveness", rpg: "opens repair quest templates" },
  },
  {
    nodeId: "social.t4.network",
    tier: 4,
    name: "Network Sense",
    description: "Predict which witnesses, confidants, and faction channels will propagate a social act.",
    cost: 4,
    prerequisites: ["social.t3.leverage"],
    grants: ["preview_propagation_channels", "reduce_rumor_uncertainty"],
    modeNotes: { litrpg: "display likely factions and delay bands", rpg: "map connected NPC clusters" },
  },
  {
    nodeId: "social.t4.mediator",
    tier: 4,
    name: "Face-Saving Settlement",
    description: "Propose a partial resolution that preserves each side's minimum public status.",
    cost: 4,
    prerequisites: ["social.t3.repair"],
    grants: ["standoff_partial_upgrade", "coalition_terms_template"],
    modeNotes: { dnd: "may reduce a hostile attitude ceiling after a meaningful concession", rpg: "adds coalition branch" },
  },
  {
    nodeId: "social.t5.master_diplomat",
    tier: 5,
    name: "Master Diplomat",
    description: "Resolve multi-party crises while preserving distinct motives, obligations, and consequences.",
    cost: 5,
    prerequisites: ["social.t4.network", "social.t4.mediator"],
    grants: ["multi_party_resolution", "one_partial_cost_reallocation_per_crisis", "title_master_diplomat"],
    modeNotes: { litrpg: "awards a title after demonstrated success", pyoa: "adds multi-voice inner synthesis without certainty" },
  },
];

export interface RelationshipGate {
  gateId: string;
  minimumDisposition: "friendly" | "allied" | "loyal";
  minimumTrust: number;
  requiredMilestones: string[];
  forbiddenOpenBreaches: string[];
  unlock: string;
}

export const RELATIONSHIP_GATES: RelationshipGate[] = [
  {
    gateId: "relationship.optional_quest",
    minimumDisposition: "friendly",
    minimumTrust: 20,
    requiredMilestones: ["favor_granted"],
    forbiddenOpenBreaches: [],
    unlock: "NPC offers a personal quest or vulnerability.",
  },
  {
    gateId: "relationship.crisis_support",
    minimumDisposition: "allied",
    minimumTrust: 50,
    requiredMilestones: ["alliance"],
    forbiddenOpenBreaches: ["betrayal"],
    unlock: "NPC provides active aid during a crisis.",
  },
  {
    gateId: "relationship.deep_secret",
    minimumDisposition: "loyal",
    minimumTrust: 75,
    requiredMilestones: ["loyalty"],
    forbiddenOpenBreaches: ["betrayal", "promise_broken", "abandoned"],
    unlock: "NPC reveals a defining secret or accepts a high-cost obligation.",
  },
];

export interface FactionGate {
  gateId: string;
  factionTag: string;
  minimumStanding: number;
  maximumInfamy: number;
  additionalRequirements: string[];
  unlock: string;
}

export const FACTION_GATES: FactionGate[] = [
  { gateId: "faction.guild.membership", factionTag: "guild", minimumStanding: 50, maximumInfamy: 20, additionalRequirements: ["one sponsor"], unlock: "Guild membership and archive access" },
  { gateId: "faction.court.access", factionTag: "court", minimumStanding: 40, maximumInfamy: 25, additionalRequirements: ["recognized title or invitation"], unlock: "Private court audience" },
  { gateId: "faction.underground.trust", factionTag: "underground", minimumStanding: 35, maximumInfamy: 15, additionalRequirements: ["kept one secret", "no active informer tag"], unlock: "Black-market services and safehouse" },
];

const XP_BASE: Record<XpSource, number> = {
  social_check_success: 15,
  social_check_partial: 10,
  leverage_win: 20,
  crisis_resolution: 35,
  favor_granted: 15,
  promise_kept: 20,
  relationship_milestone: 25,
  faction_milestone: 30,
  nonviolent_quest_completion: 50,
  new_information: 10,
};

export interface XpAwardInput {
  eventId: string;
  actorId: string;
  source: XpSource;
  sourceObjectId: string;
  noveltyKey: string;
  turn: number;
  stakesTier: 1 | 2 | 3 | 4 | 5;
  difficultyTier: 1 | 2 | 3 | 4 | 5;
  alreadyAwardedNoveltyKeys: ReadonlySet<string>;
  matchedCombatXp?: number;
  accumulatedTalkXpForObjective?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateSocialXp(input: XpAwardInput): SocialXpEvent {
  if (input.alreadyAwardedNoveltyKeys.has(input.noveltyKey)) {
    return {
      eventId: input.eventId,
      actorId: input.actorId,
      source: input.source,
      sourceObjectId: input.sourceObjectId,
      turn: input.turn,
      noveltyKey: input.noveltyKey,
      baseXp: 0,
      stakesMultiplier: 0,
      difficultyMultiplier: 0,
      parityAdjustment: 0,
      finalXp: 0,
      notes: ["No XP for repeated dialogue, repeated leverage, or replayed milestone."],
    };
  }

  const baseXp = XP_BASE[input.source];
  const stakesMultiplier = 0.75 + input.stakesTier * 0.15; // 0.90..1.50
  const difficultyMultiplier = 0.80 + input.difficultyTier * 0.10; // 0.90..1.30
  const unadjusted = Math.round(baseXp * stakesMultiplier * difficultyMultiplier);
  const matchedCombatXp = input.matchedCombatXp ?? 0;
  const accumulated = input.accumulatedTalkXpForObjective ?? 0;
  const parityFloor = Math.ceil(matchedCombatXp * 0.8);
  const parityAdjustment = matchedCombatXp > 0 ? clamp(parityFloor - accumulated - unadjusted, 0, matchedCombatXp) : 0;
  const finalXp = unadjusted + parityAdjustment;

  return {
    eventId: input.eventId,
    actorId: input.actorId,
    source: input.source,
    sourceObjectId: input.sourceObjectId,
    turn: input.turn,
    noveltyKey: input.noveltyKey,
    baseXp,
    stakesMultiplier,
    difficultyMultiplier,
    parityAdjustment,
    finalXp,
    notes: [
      `Novel social event: ${input.noveltyKey}.`,
      matchedCombatXp > 0
        ? `Objective parity floor is 80% of matched combat XP (${parityFloor}).`
        : "No matched combat route was registered for this event.",
    ],
  };
}

export interface RouteParitySample {
  runId: string;
  objectiveId: string;
  route: "talk" | "fight";
  completed: boolean;
  xp: number;
  questProgress: number; // normalized 0..1
  durableStateChanges: number;
  turns: number;
}

export interface ParityReport {
  talkMedianXp: number;
  fightMedianXp: number;
  ratio: number;
  questProgressRatio: number;
  pass: boolean;
  reasons: string[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Evaluated over matched 100-turn runs; threshold is talk XP >= 80% of fight XP. */
export function evaluateParity(samples: RouteParitySample[]): ParityReport {
  const talk = samples.filter((s) => s.route === "talk" && s.completed);
  const fight = samples.filter((s) => s.route === "fight" && s.completed);
  const talkMedianXp = median(talk.map((s) => s.xp));
  const fightMedianXp = median(fight.map((s) => s.xp));
  const ratio = fightMedianXp === 0 ? 1 : talkMedianXp / fightMedianXp;
  const talkProgress = median(talk.map((s) => s.questProgress));
  const fightProgress = median(fight.map((s) => s.questProgress));
  const questProgressRatio = fightProgress === 0 ? 1 : talkProgress / fightProgress;
  const enoughSamples = talk.length >= 20 && fight.length >= 20;
  const pass = enoughSamples && ratio >= 0.8 && questProgressRatio >= 0.9;
  return {
    talkMedianXp,
    fightMedianXp,
    ratio,
    questProgressRatio,
    pass,
    reasons: [
      `talk samples ${talk.length}, fight samples ${fight.length}`,
      `XP ratio ${ratio.toFixed(3)}; required >= 0.800`,
      `quest progress ratio ${questProgressRatio.toFixed(3)}; required >= 0.900`,
    ],
  };
}

/** Anti-farming rules are normative, not tuning suggestions. */
export const SOCIAL_XP_INVARIANTS = [
  "Award an NPC-node discovery milestone at most once.",
  "Award a leverage instance against a target at most once.",
  "Award relationship milestone XP only on first entry or first meaningful repair.",
  "Award crisis completion XP only when the crisis reaches a terminal or transformed state.",
  "Award partial-outcome XP for earned information/cost, not repeated failure text.",
  "Apply objective-level parity adjustment once, at route completion.",
] as const;
