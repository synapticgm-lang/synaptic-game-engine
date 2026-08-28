# WS-7: Social Gameplay and Non-Combat Systems

**Author:** Manus AI  
**Status:** Final research and implementation specification  
**Version:** 1.0  
**Scope:** Social stakes, non-combat crises, social skills, leverage, relationships, outcomes, progression, competitor lessons, implementation backlog, and evaluation gates

## Executive decision

WS-7 should adopt a **hybrid, deterministic-first social resolution architecture**. The engine commits the scene's stakes, feasible outcomes, evidence, relationship snapshot, leverage freshness, DC, result band, and state mutations before the GM writes prose. A d20 roll is used only when a proposition is plausible, uncertain, high stakes, and able to change durable state. Routine, impossible, consent-sensitive, already-earned, and exact-repeat outcomes are narrated without a roll. The LLM classifies and dramatizes within the committed envelope; it does not decide whether the player succeeded.

This architecture directly addresses the commission evidence. Walk Away padding ends because every resolved attempt must change state, consume a resource, advance a clock, reveal actionable information, or close/reopen a path under a named condition. Repeated leverage ends because one leverage instance can influence one NPC only once. Relationship amnesia ends because disposition, trust, respect, fear, milestones, promises, boundaries, and knowledge are stored in a campaign ledger rather than only in prompt context. Social progression becomes viable because a completed talk route receives at least **80% of the XP** and at least **90% of the quest progress** of its matched combat route.

| Design question | Final decision | Operational rule |
|---|---|---|
| Social checks | **Hybrid** | Roll only for plausible, uncertain, high-stakes propositions; otherwise resolve deterministically. |
| Leverage | **Conditional and exhaustible** | Evidence, target fit, authority, relationship, resistance, and concession size determine force; one use per NPC. |
| Relationships | **Six states plus continuous dimensions** | Hostile, wary, neutral, friendly, allied, loyal; track trust, respect, fear, intimacy, and familiarity separately. |
| XP parity | **80% floor; 100% possible** | Match objective coverage and risk; top up once at route completion, never for idle dialogue. |
| Crisis cadence | **Thirty-turn target** | Suppress during unresolved high-salience crises and prevent same-pattern repetition for sixty turns. |
| Persistence | **Permanent milestones** | Betrayals, promises, alliances, boundaries, and witnessed acts persist; only low-salience familiarity and rumor confidence decay. |

---

## D1. Social Gameplay Constitution

> **Social gameplay begins when a declared intent can change persistent state and exposes the player to a named cost.**

A valid social crisis identifies the asset at risk, its owner, what success gains, what failure loses, and how the aftermath persists. The ArcDirector must commit these fields before prose generation. This follows the useful tabletop separation between starting attitude, roleplayed approach, and the final ability check: attitude determines feasibility, fiction determines the appropriate method, and a roll resolves genuine uncertainty rather than rewriting the NPC's motives.[1]

### Constitutional principles

| Principle | Normative requirement |
|---|---|
| **Specific stakes** | Name the asset, owner, gain, loss, and deadline or trigger. “Learn more” is not a stake unless the information changes available action. |
| **NPC agency** | Every target has wants, fears, duties, taboos, capability, and red lines. Persuasion is not mind control. |
| **Persistent consequence** | Every resolution writes at least one quest, path, faction, relationship, leverage, knowledge, resource, or clock mutation. |
| **No pad loops** | Exact-repeat attempts against unchanged state do not reroll and do not award XP. The response names the reopen condition. |
| **Fail forward** | Failure escalates, redirects, closes a route, reveals an actionable alternative, or transfers initiative. It does not preserve the entire scene unchanged. |
| **Proportionality** | A small check cannot compel an identity-level concession. Requested cost is part of the DC and feasibility decision. |
| **Witnessed propagation** | Cross-NPC and faction memory requires a witness, confidant, public record, faction channel, or rumor path with confidence and delay. |
| **Outcome parity** | A talk solution replaces the matched fight and receives comparable progress; it is not merely dialogue before the same combat. |
| **Consent invariant** | No roll, relationship score, skill rank, or romance flag can override an NPC's boundary or consent. |
| **Committed causality** | The GM may embellish the committed result but cannot erase its cost, reopen a closed route, or reverse state. |

### Stakes categories

| Category | What is at risk | Representative durable outcomes |
|---|---|---|
| **Access** | entry, audience, service, route, institutional participation | gate opens, shop closes, court audience unlocks, archive access becomes conditional |
| **Information** | clue, secret, proof, interpretation, identity | clue added, evidence consumed, false belief scheduled for discovery, secret propagated |
| **Alliance** | support, shared capability, reciprocal duty | companion joins, faction service unlocks, coalition forms, obligation created |
| **Betrayal** | promise, confidence, loyalty, prior alignment | alliance severed, trust capped, rival strengthened, restitution path opened |
| **Moral weight** | principle, complicity, sacrifice, responsibility | value milestone, regret callback, victim reaction, reparative obligation |
| **Status and identity** | title, legitimacy, public face, disguise, role | leadership recognized, infamy rises, persona exposed, witness support changes |
| **Safety and time** | life, freedom, escalation, intervention window | combat avoided, hostage survives, deadline expires, pursuit begins |
| **Resources** | coin, evidence, political capital, favor, future service | payment transferred, leverage exhausted, debt incurred, sponsor review scheduled |

### When to roll and when to narrate

| Situation | Engine action | GM action |
|---|---|---|
| NPC is willing and request is routine | Automatic success | Narrate cooperation and apply state change. |
| Preparation definitively earns the outcome | Automatic success | Acknowledge evidence, authority, or fulfilled obligation. |
| Request is impossible or outside target capability | Automatic failure | Explain the hard constraint and expose alternatives if known. |
| Request violates consent or an active boundary | Automatic failure | Preserve agency; do not convert intimacy or persuasion into coercive success. |
| Proposition exactly repeats a resolved attempt | Block; no roll | Name the consumed approach and the specific reopen conditions. |
| Proposition is plausible, uncertain, high stakes | Commit and roll | Realize the committed success, partial, or failure band. |
| Fiction is ambiguous | LLM may classify intent into a schema | Engine validates the classification and resolves mechanically. |

---

## D2. Non-Combat Crisis Catalog

The deliverable includes **fifteen machine-readable patterns** in `social-crisis-catalog.json`, validated by `social-crisis-catalog.schema.json`. Each pattern contains telegraphs, at least two stakes, required context, primary skills, success/partial/failure paths, aftermath, reopen conditions, an anti-loop rule, four genre filters, and a prose example.

| ID | Pattern | Core tension | Success | Partial | Failure becomes |
|---|---|---|---|---|---|
| SC-01 | Social Standoff | Both sides need to preserve face before escalation | face-saving settlement | stand-down with debt or deadline | violence or institutional rupture |
| SC-02 | Betrayal Reveal | Truth versus alliance and control of exposure | confession or controlled separation | truth gained but ally escapes or retaliates | proof lost; betrayer gains initiative |
| SC-03 | Deadline Pressure | Negotiation consumes a visible window | commitment before expiry | incomplete terms or sacrificed objective | world advances; replacement crisis spawns |
| SC-04 | Faction Confrontation | Rival groups demand a public position | alliance or narrow coalition | conditional temporary cooperation | withdrawal, hostility, or lost services |
| SC-05 | Moral Dilemma | Two valid values cannot both be preserved | chosen value protected with acknowledged cost | harm reduced through debt or delay | another actor chooses; player loses control |
| SC-06 | Exposure Threat | A secret may become public | prevent or reframe disclosure | partial leak; choose who absorbs damage | public identity and faction reevaluation |
| SC-07 | Leverage Negotiation | Evidence-backed pressure versus resistance | bounded concession | compliance with trust loss or obligation | target counters; leverage exhausted |
| SC-08 | Trust Test | Words are insufficient; proof must cost something | trust milestone and deeper access | probation or monitored access | suspicion confirmed; opportunity closes |
| SC-09 | Alliance Proposal | Benefits conflict with duties or existing loyalties | explicit reciprocal alliance | limited alliance with exit cost | offer withdrawn or made to a rival |
| SC-10 | Hostage Situation | Safety, time, and bargaining assets interact | release without combat | life saved but payment, escape, or loss | threat executed or pursuit begins |
| SC-11 | Public Humiliation | Status is attacked before a meaningful audience | attack reframed or answered | dignity preserved through debt or test | reduced authority, access, or prices |
| SC-12 | Blackmail | Damaging evidence compels an action | coercion neutralized or bounded | demand reduced; one concession occurs | publication or resentful compliance |
| SC-13 | Inheritance Dispute | Law, promise, custom, and family legitimacy conflict | recognized heir or settlement | stewardship or divided rights | feud; asset seized, hidden, or destroyed |
| SC-14 | Succession Crisis | Leadership vacancy destabilizes an institution | recognized successor or council | regency with coup risk | schism, coup, or civil conflict |
| SC-15 | Romantic Entanglement | Affection conflicts with boundaries, power, or duty | reciprocal milestone under explicit boundaries | feelings acknowledged but delayed | trust loss; romance closes or becomes estrangement |

### Required lifecycle

The lifecycle is `eligible → telegraphed → committed → attempted → resolved | transformed → aftermath`. Eligibility requires mode fit, context, no unresolved higher-salience crisis, and repeat suppression. Commitment stores stakes and outcome envelopes. Attempt resolution consumes its fingerprint. A crisis is valid only when it reaches a terminal result or transforms into another named crisis with changed state. “Walk away” may be a meaningful choice only if it advances a deadline, transfers initiative, sacrifices an opportunity, or records avoidance; it cannot pause the world indefinitely.

---

## D3. Social Skill System

The TypeScript specification in `socialSkills.ts` defines Persuade, Intimidate, Deceive, and Insight; the proposition and stakes contracts; actor, relationship, evidence, faction, and leverage modifiers; roll policy; five result bands; state mutations; genre adapters; and the pre-prose resolution envelope.

### Skill identities

| Skill | Player verb | Strong inputs | Characteristic success | Characteristic cost |
|---|---|---|---|---|
| **Persuade** | align the request with values, interest, or exchange | trust, positive disposition, kept promises, shared goals, credible benefit | voluntary agreement, alliance, concession, de-escalation | reciprocal obligation, compromise, time |
| **Intimidate** | make a consequence credible | fear, demonstrated capacity, authority, target vulnerability | compliance, retreat, immediate disclosure | trust loss, resentment, faction backlash, escalation |
| **Deceive** | induce action through a false or framed belief | plausible detail, corroboration, information control, low contradiction | access, delay, misdirection, concealed identity | discovery clock, betrayal milestone, evidence risk |
| **Insight** | identify motives, contradictions, pressure, and likely cost | Wisdom, familiarity, observation, knowledge, prior behavior | new affordance, motive category, tell, contradiction | false confidence or biased interpretation on failure |

### Resolution algorithm

1. The ArcDirector defines the target, intent, requested concession, stakes, base DC, evidence, leverage reference, attempt cost, outcomes, and reopen conditions.
2. Feasibility validation rejects impossible, boundary-violating, and exact-repeat propositions before rolling.
3. The engine calculates `skill + relationship + evidence + leverage + faction + circumstance` with bounded modifiers.
4. If the proposition is plausible, uncertain, and high stakes, roll `d20 + total modifier` against the committed DC. Otherwise apply the deterministic result.
5. Margin determines critical success, success, partial, failure, or critical failure. Natural rolls cannot authorize impossible outcomes.
6. Attempt costs and outcome mutations apply atomically before prose.
7. The GM receives the bounded concession, outcome band, reasons, mutations, and prose constraints. ProseWarden rejects contradictions.

| Margin | Band | Required structure |
|---:|---|---|
| +5 or more | Critical success | core objective plus predeclared advantage; never exceed feasibility |
| 0 to +4 | Success | core objective; cost only if declared by the proposition |
| -1 to -4 | Partial | objective with material cost, or denial with actionable benefit |
| -5 to -9 | Failure | objective denied; escalation, closure, or transferred initiative |
| -10 or less | Critical failure | serious predeclared consequence; still no arbitrary character assassination |

Mode adapters preserve mechanics while changing presentation. D&D shows the d20, modifier, and DC. General RPG mode exposes leverage and prerequisites. PYOA can hide numbers and renders Insight as a named internal perspective. LitRPG shows skill, faction, and relationship threshold contributions, but reserves System notices for durable milestones.

---

## D4. Leverage Mechanics

Leverage is a registered, target-specific resource. Each asset records its source event, type, claim, evidence strength, credibility, relevance, owners, subjects, valid targets, faction scope, copies, legality, expiry, and status. A leverage instance may influence the same NPC **at most once**. Stronger evidence creates a new instance; it never refreshes the old ID.

| Type | Works when | Fails when | Typical aftermath |
|---|---|---|---|
| **Physical threat** | capacity is credible; target values immediate safety; protection is absent | martyrdom is preferable; superior force is available; player lacks credibility | fear rises, trust falls sharply, violence or faction reaction may follow |
| **Exposure** | evidence is strong; audience matters; publication channel is controlled | secret is known; target can survive it; evidence is compromised | target may comply, confess first, or counterexpose |
| **Moral appeal** | invoked value is demonstrated; request is proportionate; speaker is credible | target rejects the value; speaker is hypocritical; demand is self-serving | trust can rise on success; failure reveals value mismatch |
| **Faction authority** | jurisdiction, credential, and standing are valid | target serves rival authority; order exceeds jurisdiction; credential expired | compliance creates record; misuse creates institutional consequences |
| **Debt owed** | debt is acknowledged; repayment is proportionate; target can perform | debt was discharged; demand exceeds favor; underlying event disputed | obligation resolves or becomes a relationship grievance |
| **Blackmail** | evidence is damaging and controlled; demand is bounded; target cannot preempt | confession is cheaper; copies are unsecured; demand is worse than exposure | trust collapses, retaliation schedules, network knowledge spreads |

The resolver computes `asset power + pressure fit + authority + relationship - target resistance - requested concession cost`. The result becomes a bounded modifier for the social check and immediately writes a target cooldown entry. Success, partial, and failure all exhaust the attempt. A blocked repeat neither rolls nor grants XP.

Cross-NPC sync is knowledge propagation rather than omniscience. A merchant threatened in public creates an immediate witness event and a delayed merchant-network report. A private threat may travel only through a confidant. Each propagated fact has a channel, confidence, salience, availability turn, and optional expiry. This preserves Fallout: New Vegas's useful connection between reputation and concrete treatment while avoiding instantaneous faction hive mind; New Vegas itself tracks positive Fame and negative Infamy separately and uses their combination to affect prices, hostility, and treatment.[4]

---

## D5. Relationship Tracking

The canonical `NpcRelationship` in `npcRelationships.ts` combines a six-state disposition FSM with continuous trust, respect, fear, intimacy, and familiarity. It also stores milestones, promises, knowledge, boundaries, role obligations, faction membership, unlocks, closed paths, and an optimistic revision number. The JSON representation is defined by `npc-relationship.schema.json`; a turn-100 example with a turn-50 betrayal appears in `npc-relationship.example.json`.

| Disposition | Trust guide | Promotion gate | Representative effect |
|---|---:|---|---|
| **Hostile** | -100 to -50 | restitution or overriding shared threat | attack, sabotage, refusal, surrender demand |
| **Wary** | -49 to -10 | safe contact or specific repair | verification, probation, limited exchange |
| **Neutral** | -9 to +19 | first-meet memory and ordinary familiarity | public information and baseline services |
| **Friendly** | +20 to +49 | favor milestone and familiarity | optional quest and modest personal risk |
| **Allied** | +50 to +74 | explicit alliance; no unrepaired betrayal | crisis support, private access, strategic aid |
| **Loyal** | +75 to +100 | loyalty milestone and deep familiarity | deepest secret, sacrifice option, resilient disagreement |

Trust is not affinity. Respect can remain high after disagreement. Fear can induce compliance while trust collapses. Intimacy cannot override a boundary. Familiarity controls how much context an NPC can credibly recall. Promotions require score thresholds **and milestones**; betrayal, broken promises, abandonment, and boundary breaches cap the relationship until explicit repair. This prevents a handful of small favors from erasing a defining betrayal.

The character sheet shows disposition, bounded dimensions, salient milestones, and earned unlocks. The NPC journal shows open promises, known boundaries, recent history, and closed paths with reopen conditions. The WS-2 bridge uses role IDs and faction knowledge: an office successor may inherit public records and obligations but not private intimacy or confidential memories by default.

Mass Effect 2 provides a useful delayed-payoff precedent: companion loyalty is acquired through personal missions, affects survival during the finale, can affect other squadmates, unlocks powers, and has consequences in the following game.[7] WS-7 applies this principle by making relationship milestones affect future crisis support, secrets, survival, and role turnover rather than functioning as decorative approval.

---

## D6. Social Stakes Templates by Mode

Twelve templates in `socialStakes.ts` cover the four requested modes. They share the same state contract but differ in feedback, visibility, and dramatic focus.

| Mode | Template | Preconditions | Stakes and outcome |
|---|---|---|---|
| D&D | Persuade guard, DC 15 | credible purpose; lawful discretion | success opens dungeon access and removes matched combat; failure alerts watch and closes this guard's discretion |
| D&D | Intimidate merchant, DC 12 | credible threat; no immediate protector | success reveals buyer but costs trust; failure closes shop and applies guild infamy |
| D&D | Deceive leader, DC 18 | plausible military detail; no verified contradiction | success buys time; discovery event is scheduled; failure causes detention or disadvantage |
| RPG | Leverage informant | registered unused evidence and pressure profile | expose for speed and infamy risk, or protect for a favor and trust |
| RPG | Moral rescue | mutually exclusive resources and named beneficiaries | Insight clarifies consequences but cannot invent a perfect option |
| RPG | Betrayal choice | two incompatible faction demands before witnesses | one alliance opens and another closes, or a costly limited coalition forms |
| PYOA | Trust or doubt the miller | contradiction, prior kindness, and a night deadline | Insight becomes an internal comment with confidence and possible bias |
| PYOA | Lie now, answer at T+50 | trusted companion and a propagation channel | immediate access opens; lie fingerprint and discovery event persist |
| PYOA | Confess before exposure | exposure threat and private window | confession may preserve trust while altering identity and obligation |
| LitRPG | Guild access at +50 | reputation 50, sponsor, no betrayal | archive unlock and title; partial grants supervised access with a debt |
| LitRPG | Invoke court authority | valid writ, jurisdiction, standing 20 | explicit authority modifiers; writ's surprise value is consumed |
| LitRPG | Master Diplomat | tier-five skill and three factions | title and capstone for preserving multiple alliances without violence |

D&D's attitude-first framing is retained so a roll cannot force a hostile NPC past their red line.[1] PYOA adopts Disco Elysium's useful idea that skills can speak as internal perspectives, adding interpretation and temptation rather than only numeric bonuses.[2] LitRPG exposes thresholds while avoiding a System notification for every line.

---

## D7. Non-Combat Resolution Outcomes

A social result is complete only when the fiction and state agree. The outcome catalog includes path, service, quest, faction, NPC, relationship, combat, obligation, deadline, and evidence mutations.

| Outcome | Required mutation | Example | Aftermath |
|---|---|---|---|
| **Unlock path** | path opens; incompatible encounter closes | persuade guard → dungeon access; gate combat removed | guard may audit conduct on exit |
| **Close path** | service or route closes with named reopen conditions | intimidate merchant → shop closed; merchant guild infamy +10 | restitution or new proprietor may reopen |
| **Faction shift** | positive and negative faction events recorded separately | betray lord → rebels fame +20; loyalists infamy +30 | witnesses update connected NPCs over time |
| **NPC transform** | disposition, intent, role, or availability changes | revealed deception → ally becomes hostile; turnover evaluation starts | repair may reach rivalry or wary neutrality, not instant friendship |
| **Quest tick** | stage and actionable evidence update | leverage informant → warehouse clue; quest advances | informant response depends on method |
| **Relationship milestone** | trust plus milestone; tier derived, not assigned freely | keep major favor → trust +15; friendly may become allied | crisis-support or private quest unlocks |
| **Combat avoided** | matched combat closes and equivalent objective completes | settle standoff → bridge remains peaceful | parties remember which face-saving terms were accepted |
| **Obligation created** | promise or debt enters journal with due turn | conditional access → sponsor review at T+20 | failure to repay becomes betrayal |
| **Deadline advanced** | clock changes and exact-repeat option closes | failed hostage exchange → threat clock +1 | maximum transitions to harm, relocation, or combat |
| **Evidence changed** | proof gained, spent, compromised, copied, or exposed | reveal ledger → clue gained, leverage consumed | copies determine future blackmail and knowledge paths |

Failure must not become free information. It grants only what its envelope declares: perhaps the target's red line, an alternative route, or a changed scene. Partial success must expose its cost before acceptance when the player could reasonably perceive it.

---

## D8. Social Progression

`socialProgression.ts` defines a ten-node skill tree, relationship unlocks, faction gates, novelty-key XP accounting, and route-parity evaluation. Progression rewards **durable accomplishment**, not the number of dialogue selections.

### Skill tree

| Tier | Nodes | Capability |
|---:|---|---|
| 1 | Persuasive Appeal; Reading the Room | make bounded appeals; identify one motive or pressure tag |
| 2 | Credible Threat; Plausible Deception | preview backlash; construct a lie with a discovery channel |
| 3 | Leverage Appraisal; Restorative Practice | inspect leverage fit; propose restitution after breach |
| 4 | Network Sense; Face-Saving Settlement | preview propagation; construct multi-party partial agreements |
| 5 | Master Diplomat | resolve multi-party crises and reallocate one partial cost within constraints |

### XP sources and anti-farming

| Source | Typical base XP | Award condition |
|---|---:|---|
| Successful high-stakes check | 15 | first resolution of a novel proposition |
| Partial result | 10 | material cost or actionable state change occurs |
| Leverage win | 20 | first use of that leverage-target pair |
| Crisis resolution | 35 | crisis reaches terminal or transformed state |
| Favor granted | 15 | concrete benefit delivered, not merely promised |
| Promise kept | 20 | obligation fulfilled at or before its due state |
| Relationship milestone | 25 | first entry or first meaningful repair |
| Faction milestone | 30 | threshold unlock, recognized office, or public settlement |
| Nonviolent quest completion | 50 | matched objective completes without required combat |
| New information | 10 | clue is novel, specific, and actionable |

A novelty key prevents repeated NPC nodes, leverage attempts, or replayed milestones from granting XP. At objective completion, the engine compares accumulated talk XP with the registered combat route. If the talk route completed the objective and remains below 80%, it applies a one-time parity adjustment. Full parity is appropriate when the talk path faced comparable risk and completed all objective functions.

| Relationship/faction gate | Requirement | Unlock |
|---|---|---|
| Friendly personal content | trust 20 + favor milestone | optional quest or vulnerability |
| Allied support | trust 50 + alliance + no unrepaired betrayal | crisis support and private access |
| Loyal secret | trust 75 + loyalty + deep familiarity | deepest secret or sacrifice option |
| Guild membership | standing 50, infamy ≤20, sponsor | membership and archive |
| Court access | standing 40, infamy ≤25, title/invitation | private audience |
| Underground trust | standing 35, infamy ≤15, kept secret, no informer tag | safehouse and black-market services |

---

## D9. Competitor Analysis

| Game | What works | What WS-7 adopts | What WS-7 rejects |
|---|---|---|---|
| **Disco Elysium** | recoverable White Checks; personified skills; authored failure | explicit reopen conditions; Insight as a potentially biased inner voice; failure content | required progression depending on scarce reset resources without robust alternate routes |
| **Planescape: Torment** | mental attributes integrated throughout dialogue; identity and memory stakes | broad distribution of social checks and non-combat outcomes | treating check count as depth when consequences remain small |
| **Fallout: New Vegas** | contextual dialogue, faction-specific reputation, separate positive/negative history, non-combat quest solutions | event-ledger reputation; services, access, hostility, and faction routes tied to actions | instant faction omniscience and over-centralized Speech |
| **Mass Effect** | critical persuasion, loyalty missions, delayed companion survival consequences, clear presentation | relationship milestones that affect later crises; general reputation that does not demand one tone | always-superior blue/red choices, guaranteed optimal outcomes, ideological purity pressure |

The Planescape dialogue-file analysis is instructive because its 489 extracted checks were dominated by Intelligence, Charisma, and Wisdom, showing sustained integration of non-combat attributes.[3] The lesson is not to replicate its thresholds, but to ensure every social build sees recurring, consequential uses. Fallout: New Vegas provides the clearest precedent for connecting reputation to merchant prices, hired attacks, access, and treatment while retaining both positive and negative history.[4]

Mass Effect's evolution is especially relevant. BioWare explained that Mass Effect 3 uses total reputation to unlock both Paragon and Renegade options, eliminating the prior penalty for mixing tones while retaining the player's moral ratio.[5] IGN's comparison similarly notes that Mass Effect 2 pressured players to commit to one track, whereas Mass Effect 3 combined progress into one threshold.[6] WS-7 therefore separates **method consequences** from **social capability**: Intimidate may reach the same immediate objective as Persuade, but fear, trust, witnesses, and delayed retaliation differ.

---

## D10. Implementation Backlog and Evaluation Harness

The full backlog is provided in `implementation-backlog.csv` with **36 tasks** across P0, P1, and P2. P0 establishes deterministic correctness: crisis contracts, scheduling, pre-GM commits, proposition fingerprints, social checks, leverage exhaustion, relationship persistence, outcome mutations, audits, and gates. P1 adds four genre adapters, UI, skill tree, XP parity, and prose tests. P2 adds analytics and a balance/abuse-hardening wave.

### Implementation waves

| Wave | Scope | Exit condition |
|---|---|---|
| **Wave 1: crisis and leverage** | catalog loader, eligibility, scheduler, stakes commit, fingerprints, leverage registry/resolver/cooldown | G1 pattern eligibility and G3 one-use leverage pass in fixture tests |
| **Wave 2: skills and relationships** | hybrid checks, modifiers, outcome bands, persistent ledgers, FSM, promises, boundaries, WS-2 bridge | G2 skill matrix and G4 turn-50/turn-100 persistence pass |
| **Wave 3: modes and progression** | D&D/RPG/PYOA/LitRPG adapters, outcomes, journal UI, skill tree, faction gates, XP novelty/parity | all four modes resolve the same committed state correctly; preliminary G5 passes |
| **Wave 4: governance** | ProseWarden constraints, 15×4 prose fixtures, telemetry, replay packets, balance and abuse tests | G1-G5 pass with zero critical invariant violations |

### Integration sequence

```text
Player intent
  → ArcDirector selects eligible social crisis
  → pre-GM stakes + proposition commit
  → SituationPacket receives relationship, leverage, faction, evidence, and deadline snapshots
  → leverage resolver calculates fit and writes target cooldown
  → social skill resolver determines automatic/roll tier and commits outcome
  → atomic state transaction applies path, quest, faction, relationship, leverage, and clock mutations
  → GM generates prose inside the resolution envelope
  → ProseWarden validates prose against the commit
  → evalHarness records metrics and replay evidence
```

| Integration point | Required extension |
|---|---|
| `socialCrisis.ts` | load catalog; validate context and mode; enforce cadence and repetition suppression |
| `socialSkills.ts` | proposition schema, fingerprint, roll policy, modifiers, five result bands, envelope |
| `leverageMechanics.ts` | asset catalog, target profiles, conditional score, one-use ledger, propagation |
| `npcRelationships.ts` | persistent ledger, FSM, promises, knowledge, boundaries, UI view, repository |
| `socialStakes.ts` | per-mode templates and outcome mutation catalog |
| `socialProgression.ts` | skill tree, novelty XP, relationship/faction gates, parity evaluation |
| `arcDirector.ts` | select and commit crisis before GM; apply results atomically |
| `situationPacket.ts` | include versioned social snapshot and bounded hidden information |
| `proseWarden.ts` | reject contradicted outcomes, omitted costs, silent reopening, or invalid disposition |
| `evalHarness.ts` | trace events, G1-G5 aggregation, deterministic replay packets |

### Validation gates

The machine-readable specification is `validation-gates.json`; executable aggregation contracts are in `evalHarness.ts`.

| Gate | Measurement | Pass threshold |
|---|---|---|
| **G1: crisis patterns** | 100 deterministic 100-turn runs per required mode; track eligible, spawned, terminal, repeated, and unchanged-state crises | ≥10 distinct eligible and spawned patterns in both RPG and PYOA; terminal resolution ≥95%; zero suppression or unchanged-state violations |
| **G2: social skills** | cross-product of four skills, DC bands, dispositions, evidence bands, and fixed RNG boundaries | all four skills and success/partial/failure observed; 100% commits include mutations; zero impossible rolls, repeat rerolls, or prose contradictions |
| **G3: leverage** | all six leverage types against matching and mismatching pressure profiles, replayed once, then escalated with new evidence | six success and six failure cases minimum; same asset/NPC success maximum one; 100% repeats blocked; zero unearned global knowledge |
| **G4: relationships** | alliance, turn-50 betrayal, save/load, turn-100 allied request, then explicit repair | exact save/load; betrayal present at turn 100; allied request blocked before repair; boundaries never overridden |
| **G5: parity** | at least 20 completed talk and 20 completed fight samples for matched 100-turn objectives | talk/fight median XP ≥0.80; quest progress ratio ≥0.90; zero duplicate-novelty or idle-dialogue XP |

### Critical invariants

A release fails if any of the following occurs: a social resolution changes no relevant state; an exact repeat rerolls; the same leverage instance influences the same NPC twice; a roll overrides consent or established fact; or the GM's prose reverses or omits the committed outcome. These are correctness failures, not balance warnings.

---

## Worked lifecycle example

At turn 44, the ArcDirector selects **SC-07 Leverage Negotiation**. The player wants merchant Mira to reveal the convoy buyer. The system identifies two approaches: protect Mira in exchange for testimony, or expose her private ledger. The expose asset has evidence strength 4, credibility 5, relevance 5, and a target match to Mira's fear of guild expulsion. The requested concession is bounded to one buyer's identity.

Before prose, the engine commits the information stake, alliance risk, quest outcome, failure escalation, and target-specific leverage ID. It calculates the leverage fit and records that any use will exhaust the asset against Mira. The social resolver sees a plausible, uncertain, high-stakes Persuade proposition and rolls against the committed DC. A partial result grants the meeting place but not the buyer's name, consumes the leverage, reduces trust, schedules a merchant-network reaction, opens a verification task, and awards novelty XP.

At turn 45, the player repeats the same threat. The fingerprint matches and the target cooldown is exhausted, so no roll occurs. Mira responds that the threat has already been made; the journal shows three reopen routes: obtain a stronger independent document, offer protection, or identify the buyer through the new meeting-place task. At turn 100, if the player exposed Mira, the betrayal milestone still caps allied access unless restitution was completed. This single lifecycle satisfies the anti-loop, leverage, relationship, forward-progress, and delayed-memory requirements.

---

## Package manifest

| Deliverable | Primary artifact |
|---|---|
| D1 Social Gameplay Constitution | `social-gameplay-constitution.md` |
| D2 Non-Combat Crisis Catalog | `social-crisis-catalog.json`, `social-crisis-catalog.schema.json` |
| D3 Social Skill System | `socialSkills.ts` |
| D4 Leverage Mechanics | `leverageMechanics.ts` |
| D5 Relationship Tracking | `npcRelationships.ts`, `npc-relationship.schema.json`, `npc-relationship.example.json` |
| D6 Stakes Templates | `socialStakes.ts` |
| D7 Resolution Outcomes | `socialStakes.ts` |
| D8 Social Progression | `socialProgression.ts` |
| D9 Competitor Analysis | `competitor-social-mechanics-analysis.md` |
| D10 Backlog and Evaluation | `implementation-backlog.csv`, `validation-gates.json`, `evalHarness.ts` |

## References

[1]: https://www.dndbeyond.com/posts/1282-how-to-make-social-encounters-more-than-a-charisma "D&D Beyond — How to Make Social Encounters More Than a Charisma Check"
[2]: https://www.pcgamer.com/your-skills-talk-to-you-in-disco-elysium-an-inventive-rpg-that-keeps-impressing/ "PC Gamer — Your skills talk to you in Disco Elysium"
[3]: https://forums.beamdog.com/discussion/64381/dialogs-stats-checks-analysis "Beamdog Forums — Planescape: Torment Dialogs Stats Checks Analysis"
[4]: https://fallout.wiki/wiki/Fallout:_New_Vegas_Reputation "The Fallout Wiki — Fallout: New Vegas Reputations"
[5]: https://blog.bioware.com/2012/03/01/reputation-in-mass-effect-3/ "BioWare Blog — Reputation in Mass Effect 3"
[6]: https://www.ign.com/wikis/mass-effect-legendary-edition/Paragon_vs._Renegade "IGN — Mass Effect: Paragon vs. Renegade"
[7]: https://www.ign.com/wikis/mass-effect-2/Loyalty_Missions "IGN — Mass Effect 2 Loyalty Missions"
