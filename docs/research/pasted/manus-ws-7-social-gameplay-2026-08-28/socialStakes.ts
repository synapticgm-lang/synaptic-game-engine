/** WS-7 per-mode social stakes templates and non-combat outcome catalog. */

export type Mode = "dnd" | "rpg" | "pyoa" | "litrpg";
export type SocialSkill = "persuade" | "intimidate" | "deceive" | "insight";
export type OutcomeBand = "critical_success" | "success" | "partial" | "failure" | "critical_failure";
export type OutcomeKind =
  | "unlock_path"
  | "close_path"
  | "faction_shift"
  | "npc_transform"
  | "quest_tick"
  | "relationship_milestone"
  | "combat_avoided"
  | "obligation_created"
  | "deadline_advanced"
  | "evidence_changed";

export interface StakesTemplate {
  templateId: string;
  mode: Mode;
  label: string;
  situation: string;
  skill: SocialSkill;
  defaultDc?: number;
  prerequisites: string[];
  telegraph: string[];
  success: string[];
  partial: string[];
  failure: string[];
  delayedConsequence?: { dueTurns: number; effect: string };
  xpBudget: number;
}

export interface OutcomeMutation {
  path: string;
  operation: "add" | "set" | "append" | "open" | "close" | "schedule";
  value: unknown;
}

export interface ResolutionOutcome {
  outcomeId: string;
  kind: OutcomeKind;
  band: OutcomeBand;
  summary: string;
  requiredMutations: OutcomeMutation[];
  playerFeedback: string[];
  followUp: string;
}

export const STAKES_TEMPLATES: StakesTemplate[] = [
  {
    templateId: "dnd.guard_access.dc15",
    mode: "dnd",
    label: "Persuade the guard",
    situation: "A neutral guard can lawfully grant conditional passage but risks discipline.",
    skill: "persuade",
    defaultDc: 15,
    prerequisites: ["credible purpose", "no active warrant", "request within guard discretion"],
    telegraph: ["Success opens the gate without combat.", "Failure alerts the watch and closes this guard's discretion."],
    success: ["gate path opens", "guard records escorted entry", "full encounter XP granted"],
    partial: ["entry granted under escort or after a fee", "time advances"],
    failure: ["gate remains closed", "watch suspicion +1", "new routes: obtain writ, find postern, accept arrest hearing"],
    xpBudget: 100,
  },
  {
    templateId: "dnd.merchant_pressure.dc12",
    mode: "dnd",
    label: "Intimidate the merchant",
    situation: "A wary merchant can reveal a buyer's name but belongs to a protective guild.",
    skill: "intimidate",
    defaultDc: 12,
    prerequisites: ["credible threat", "merchant lacks immediate protection"],
    telegraph: ["Compliance will cost trust.", "The merchant guild may hear of coercion."],
    success: ["buyer identity revealed", "merchant fear +20", "merchant trust -18"],
    partial: ["merchant reveals meeting place but not name", "shop prices +10%"],
    failure: ["shop closes", "merchant guild standing -10", "guards summoned after one exchange"],
    delayedConsequence: { dueTurns: 5, effect: "connected merchants update prices and dialogue" },
    xpBudget: 80,
  },
  {
    templateId: "dnd.leader_deception.dc18",
    mode: "dnd",
    label: "Deceive the faction leader",
    situation: "A hostile leader may delay an attack if convinced a rival army is near.",
    skill: "deceive",
    defaultDc: 18,
    prerequisites: ["plausible military detail", "no verified contradictory scout report"],
    telegraph: ["Success buys time, not loyalty.", "Discovery will create a betrayal milestone."],
    success: ["attack delayed 10 turns", "deception discovery scheduled"],
    partial: ["attack delayed 3 turns", "leader sends scout, increasing discovery chance"],
    failure: ["leader orders detention", "faction hostility increases", "combat may begin under disadvantage"],
    delayedConsequence: { dueTurns: 10, effect: "resolve lie discovery and trust/faction consequences" },
    xpBudget: 120,
  },
  {
    templateId: "rpg.informant_leverage",
    mode: "rpg",
    label: "Leverage the informant",
    situation: "The player can expose the informant's smuggling or promise protection in exchange for a clue.",
    skill: "persuade",
    prerequisites: ["registered evidence", "informant pressure profile", "unused leverage instance"],
    telegraph: ["Expose: faster clue, merchant infamy risk.", "Protect: costs a favor, preserves trust."],
    success: ["quest clue revealed", "selected leverage consumed", "quest stage advances"],
    partial: ["clue revealed with a false detail or future obligation", "verification task opens"],
    failure: ["informant flees or sells the clue to a rival", "pursuit/infiltration route opens"],
    xpBudget: 100,
  },
  {
    templateId: "rpg.moral_rescue",
    mode: "rpg",
    label: "Choose whom to save",
    situation: "One intervention can protect the witness or the trapped district, not both.",
    skill: "insight",
    prerequisites: ["mutually exclusive resources", "named beneficiaries", "deadline"],
    telegraph: ["No check creates a perfect outcome.", "Insight reveals downstream costs but does not choose."],
    success: ["chosen objective succeeds", "affected companions and factions record the choice"],
    partial: ["harm is reduced through sacrifice of wealth, access, or future aid"],
    failure: ["indecision advances the clock and an NPC chooses", "player loses control of interpretation"],
    xpBudget: 140,
  },
  {
    templateId: "rpg.betrayal_choice",
    mode: "rpg",
    label: "Choose faction A or B",
    situation: "Both factions demand exclusive proof of loyalty before a public vote.",
    skill: "persuade",
    prerequisites: ["standing with both factions", "public witness", "incompatible demands"],
    telegraph: ["Supporting A closes B's current alliance path.", "Neutrality strengthens the leading faction."],
    success: ["chosen alliance opens", "opposed path closes", "support resources unlock"],
    partial: ["short-term coalition with binding concession"],
    failure: ["both factions classify the player as unreliable", "independent path opens at higher cost"],
    xpBudget: 150,
  },
  {
    templateId: "pyoa.miller_trust",
    mode: "pyoa",
    label: "Trust or doubt the miller",
    situation: "The miller offers shelter after an inconsistency in her account.",
    skill: "insight",
    prerequisites: ["one contradiction", "prior kindness", "night deadline"],
    telegraph: ["Inner voice: her hands are steady, but she has prepared two beds.", "Trust risks betrayal; refusal loses shelter and intimacy."],
    success: ["Insight reveals motive category, not objective truth", "player makes informed trust choice"],
    partial: ["inner comment reveals bias and one overlooked clue"],
    failure: ["misread is narrated as a confident but flawed interpretation", "later reveal creates self-knowledge milestone"],
    xpBudget: 70,
  },
  {
    templateId: "pyoa.lie_delayed_t50",
    mode: "pyoa",
    label: "Lie now, answer later",
    situation: "A small lie protects the protagonist's identity now but reaches the companion fifty turns later.",
    skill: "deceive",
    prerequisites: ["companion trusts player", "fact has a propagation path"],
    telegraph: ["The narration identifies the relationship placed at risk.", "The exact discovery time remains uncertain."],
    success: ["immediate access opens", "discovery event scheduled at T+50", "lie fingerprint stored"],
    partial: ["access opens but companion notices a contradiction", "trust -5 now and discovery confidence rises"],
    failure: ["companion challenges the lie immediately", "truth, doubled-down deception, and separation paths open"],
    delayedConsequence: { dueTurns: 50, effect: "discover lie; apply betrayal milestone and relationship response" },
    xpBudget: 90,
  },
  {
    templateId: "pyoa.confession_identity",
    mode: "pyoa",
    label: "Confess before exposure",
    situation: "The protagonist can disclose a shameful truth privately before an enemy makes it public.",
    skill: "persuade",
    prerequisites: ["exposure threat", "trusted confidant", "remaining private window"],
    telegraph: ["Confession may preserve trust while changing how the confidant sees the protagonist.", "Silence preserves the persona until the deadline."],
    success: ["confession milestone", "confidant support option", "exposure impact reduced"],
    partial: ["confidant keeps the secret but withdraws from one obligation"],
    failure: ["confidant refuses complicity", "private relationship path closes while public truth remains unresolved"],
    xpBudget: 110,
  },
  {
    templateId: "litrpg.guild_gate.rep50",
    mode: "litrpg",
    label: "Guild access at +50 reputation",
    situation: "The guild archive requires recognized standing and one sponsor.",
    skill: "persuade",
    prerequisites: ["guild reputation >= 50", "sponsor milestone", "no active guild betrayal"],
    telegraph: ["System: Archive Access requires Guild Standing 50 and Sponsor 1.", "Failure conditions are shown before application."],
    success: ["archive service unlocks", "Guild Initiate title awarded", "social milestone XP"],
    partial: ["temporary supervised access", "favor debt created"],
    failure: ["application closes for 20 turns", "reopen conditions identify sponsor or restitution task"],
    xpBudget: 100,
  },
  {
    templateId: "litrpg.court_authority",
    mode: "litrpg",
    label: "Invoke court authority",
    situation: "A writ can compel a gate officer only if its jurisdiction and the player's standing are valid.",
    skill: "intimidate",
    prerequisites: ["authority leverage asset", "jurisdiction match", "standing >= 20"],
    telegraph: ["System shows Authority +3, Jurisdiction valid, Officer loyalty -2.", "Use consumes the writ's surprise value for this officer."],
    success: ["path opens", "authority leverage consumed", "officer compliance recorded"],
    partial: ["path opens after official log entry", "rival faction notified"],
    failure: ["writ challenged", "fraud hearing or sponsor verification quest opens"],
    xpBudget: 80,
  },
  {
    templateId: "litrpg.social_milestone",
    mode: "litrpg",
    label: "Master Diplomat milestone",
    situation: "The player resolves a three-faction crisis without violence while preserving at least two alliances.",
    skill: "persuade",
    prerequisites: ["social tree tier 5", "three factions present", "no coercion-only resolution"],
    telegraph: ["System lists optional mastery objectives and the XP parity target.", "Outcome remains contingent on actual faction concessions."],
    success: ["Master Diplomat title", "capstone perk unlock", "100% matched combat XP"],
    partial: ["Diplomatic Breakthrough milestone", "80% XP and one alliance obligation"],
    failure: ["no title", "crisis evolves; earned clue and relationship XP retained"],
    xpBudget: 200,
  }
];

export const OUTCOME_CATALOG: ResolutionOutcome[] = [
  {
    outcomeId: "outcome.unlock.guard_dungeon",
    kind: "unlock_path",
    band: "success",
    summary: "Persuade guard: dungeon access opens without combat.",
    requiredMutations: [
      { path: "paths.dungeon_gate", operation: "open", value: true },
      { path: "encounters.gate_combat", operation: "close", value: true },
      { path: "quests.dungeon_entry", operation: "set", value: "advanced" }
    ],
    playerFeedback: ["guard states the condition of entry", "journal records the open path", "combat option is visibly removed or changed"],
    followUp: "Guard may audit the player's conduct on exit."
  },
  {
    outcomeId: "outcome.close.merchant_shop",
    kind: "close_path",
    band: "failure",
    summary: "Failed or abusive intimidation closes the shop and harms guild standing.",
    requiredMutations: [
      { path: "services.merchant_shop", operation: "close", value: true },
      { path: "factions.merchant_guild.infamy", operation: "add", value: 10 },
      { path: "relationships.merchant.trust", operation: "add", value: -15 }
    ],
    playerFeedback: ["merchant ends the exchange", "reputation change is shown", "journal names restitution conditions"],
    followUp: "Restitution, a new proprietor, or faction leadership change may reopen service."
  },
  {
    outcomeId: "outcome.faction.betray_lord",
    kind: "faction_shift",
    band: "success",
    summary: "Betray the lord: rebels gain +20 fame and loyalists gain +30 infamy.",
    requiredMutations: [
      { path: "factions.rebels.fame", operation: "add", value: 20 },
      { path: "factions.loyalists.infamy", operation: "add", value: 30 },
      { path: "worldEvents", operation: "append", value: "lord_betrayed_publicly" }
    ],
    playerFeedback: ["both faction deltas are displayed", "representatives react differently", "services update"],
    followUp: "Witness propagation changes connected NPC attitudes over the next five turns."
  },
  {
    outcomeId: "outcome.transform.deceived_ally",
    kind: "npc_transform",
    band: "critical_failure",
    summary: "A revealed deception transforms an ally into an enemy and may trigger role turnover.",
    requiredMutations: [
      { path: "relationships.ally.trust", operation: "set", value: -60 },
      { path: "relationships.ally.disposition", operation: "set", value: "hostile" },
      { path: "relationships.ally.milestones", operation: "append", value: "betrayal" },
      { path: "npcRoles.ally.turnover", operation: "schedule", value: "evaluate" }
    ],
    playerFeedback: ["ally names the specific lie", "new hostile intent is apparent", "companion/faction consequences are recorded"],
    followUp: "A restitution arc may transform hostility into rivalry or wary neutrality, not instant friendship."
  },
  {
    outcomeId: "outcome.quest.informant_clue",
    kind: "quest_tick",
    band: "success",
    summary: "Leverage informant: reveal clue and advance the investigation.",
    requiredMutations: [
      { path: "quests.cape_investigation.stage", operation: "set", value: 4 },
      { path: "evidence.ledger_route", operation: "append", value: "warehouse_9" },
      { path: "leverage.informant_ledger.status", operation: "set", value: "consumed" }
    ],
    playerFeedback: ["new clue is specific and actionable", "leverage is marked used", "map/journal updates"],
    followUp: "Informant reaction depends on whether the deal protected or exposed them."
  },
  {
    outcomeId: "outcome.relationship.favor_to_alliance",
    kind: "relationship_milestone",
    band: "success",
    summary: "A completed favor grants trust and, if thresholds are met, promotes friendly to allied.",
    requiredMutations: [
      { path: "relationships.npc.trust", operation: "add", value: 15 },
      { path: "relationships.npc.milestones", operation: "append", value: "favor_granted" },
      { path: "relationships.npc.disposition", operation: "set", value: "allied_if_eligible" }
    ],
    playerFeedback: ["NPC acknowledges the actual favor", "new relationship unlock appears", "tier changes only if milestone and trust rules pass"],
    followUp: "Allied NPC offers a crisis-support option or private quest."
  },
  {
    outcomeId: "outcome.partial.access_with_cost",
    kind: "obligation_created",
    band: "partial",
    summary: "The immediate objective succeeds, but a debt and monitoring condition are created.",
    requiredMutations: [
      { path: "paths.conditional_access", operation: "open", value: true },
      { path: "obligations", operation: "append", value: "repay_sponsor" },
      { path: "events", operation: "schedule", value: { "kind": "sponsor_review", "dueTurns": 20 } }
    ],
    playerFeedback: ["cost is stated before acceptance", "obligation appears in journal", "expiry/review timer is visible"],
    followUp: "Failure to repay converts the partial success into a betrayal consequence."
  },
  {
    outcomeId: "outcome.failure.forward_clock",
    kind: "deadline_advanced",
    band: "failure",
    summary: "Failure advances the situation instead of resetting the exchange.",
    requiredMutations: [
      { path: "clocks.social_crisis", operation: "add", value: 1 },
      { path: "attemptFingerprints", operation: "append", value: "current_attempt" },
      { path: "options", operation: "close", value: "exact_repeat" }
    ],
    playerFeedback: ["NPC response reflects the failed approach", "clock visibly advances", "new or remaining approaches are named"],
    followUp: "At clock maximum, the crisis transitions to its aftermath state."
  }
];

export function templatesForMode(mode: Mode): StakesTemplate[] {
  return STAKES_TEMPLATES.filter((template) => template.mode === mode);
}

export function validateOutcome(outcome: ResolutionOutcome): string[] {
  const errors: string[] = [];
  if (outcome.requiredMutations.length === 0) errors.push("outcome must mutate persistent state");
  if (outcome.playerFeedback.length === 0) errors.push("outcome must provide player-visible feedback");
  if (!outcome.followUp.trim()) errors.push("outcome must define aftermath or follow-up");
  return errors;
}
