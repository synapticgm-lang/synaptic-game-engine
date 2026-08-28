# WS-7 Social Gameplay Constitution

**Author:** Manus AI  
**Status:** Normative design specification  
**Version:** 1.0

## Purpose

Social gameplay is a first-class conflict system. It must let the player alter access, information, alliances, obligations, identities, institutions, and moral outcomes with the same durability and progression value that combat applies to health, position, equipment, and victory state. Dialogue that only explains lore is conversation; **social gameplay begins when a declared intent can change persistent state and exposes the player to a named cost**.

> **Constitutional rule:** Every social crisis must state what can be gained, what can be lost, who bears each consequence, and which state mutations will make the result persist.

## I. Social stakes philosophy

A social scene is valid gameplay only if the player faces an informed tradeoff. Stakes must be telegraphed before commitment unless concealment is itself the tested uncertainty. The ArcDirector commits the stakes and feasible outcome envelope before the GM generates prose; the GM may dramatize but may not erase, reverse, or invent the committed result.

| Stake category | Player question | Durable state examples | Invalid substitute |
|---|---|---|---|
| **Access** | Who or what becomes reachable? | gate opened, audience granted, district barred, service unlocked | NPC says “maybe later” with no condition |
| **Information** | Which truth, proof, or interpretation changes hands? | clue revealed, secret exposed, evidence consumed, rumor propagated | repeated exposition without quest effect |
| **Alliance** | Who will act with the player, and under what obligations? | ally joins, favor owed, faction service unlocked, coalition formed | approval line with no later support |
| **Betrayal** | Which prior promise or relationship is sacrificed? | trust loss, alliance severed, rival empowered, reconciliation path opened | consequence-free side switching |
| **Moral weight** | Which value is protected, violated, or deferred? | value milestone, companion reaction, restitution obligation | color-coded “good” answer with no sacrifice |
| **Status and identity** | How will an audience classify the player? | title, infamy, role, disguise credibility, leadership claim | cosmetic reputation number only |
| **Safety and time** | Who is endangered, and when does the window close? | threat clock, hostage state, combat avoided, deadline expired | endless parley that freezes the world |
| **Resources** | What is spent, promised, or transferred? | coin, evidence, access token, political capital, future service | free leverage reused forever |

The system follows five stake laws. First, **specificity** requires a named asset and owner. Second, **reciprocity** means the NPC has motives and red lines rather than existing as a lock. Third, **persistence** requires a ledger mutation. Fourth, **proportionality** prevents a trivial check from producing an identity-level concession. Fifth, **visibility** reveals the likely category of consequence even when exact numeric values remain hidden.

## II. Non-combat resolution principles

Non-combat success must be a replacement route, not a prelude that still requires the same fight. A successful social resolution may unlock a path, close an opposing path, transform an NPC, shift a faction, advance a quest, create an obligation, or avert combat. A partial resolution grants the core objective with a material cost or denies the core objective while giving actionable information. Failure changes the world and creates a new situation; it must not merely replay the prompt.

| Principle | Normative requirement |
|---|---|
| **State change per attempt** | Every resolved attempt mutates durable state, consumes a resource, advances a clock, reveals actionable information, or closes/reopens a path under a named condition. |
| **No pad loops** | Exact-repeat attempts against unchanged state are blocked. The response identifies the missing reopen condition instead of rerolling. |
| **Fail forward, not fail soft** | Failure preserves momentum by escalating, redirecting, imposing cost, or revealing a different route. It does not guarantee the original objective. |
| **Outcome parity** | A complete talk route grants at least 80% of the progression value of the matched combat route and can reach 100% when risk and objective coverage are equivalent. |
| **Bounded influence** | Persuasion changes choices within motives; it does not rewrite identity, override consent, or create absent capability. |
| **Witnessed consequence** | Faction and cross-NPC effects propagate only through witnesses, records, confidants, or networks, with confidence and delay. |
| **Committed causality** | Outcome and state mutations are committed before prose; prose is rejected if it contradicts the commit. |

## III. Social skill design

The default resolution model is **hybrid, deterministic-first**. The engine narrates without a roll when the result is routine, already earned, impossible, consent-sensitive, or an exact repetition. It rolls only when the proposition is plausible, uncertain, high stakes, and capable of changing persistent state. This adapts the tabletop principle that NPC attitude and roleplay establish the check context before a Charisma roll.[1]

| Condition | Resolution | Reason |
|---|---|---|
| Requested action is routine and the NPC is willing | Automatic success | Rolling adds noise without agency. |
| Evidence or authority definitively establishes the result | Automatic success | Preparation should matter. |
| Request violates an active boundary or asks the NPC to do the impossible | Automatic failure with explanation | Social skills are not mind control. |
| Exact proposition has already resolved and no reopen condition changed | Automatic failure; no new roll | Prevents leverage and dialogue loops. |
| Plausible, uncertain, high-stakes proposition | d20 + committed modifier versus DC | A visible risk deserves mechanical tension. |
| Ambiguous prose or motive interpretation | LLM may classify intent within schema, then engine resolves | The model parses fiction but does not choose consequences. |

The four core skills have distinct verbs. **Persuade** aligns the request with values, interests, or reciprocal benefit. **Intimidate** establishes credible consequences and often trades trust for compliance. **Deceive** induces action through a false or selectively framed belief and schedules discovery risk. **Insight** identifies motives, pressure points, contradictions, and likely costs; it reveals affordances rather than the universally correct answer.

Outcomes use five bands: critical success, success, partial, failure, and critical failure. A partial result occupies a narrow miss band and must attach a predeclared cost. Natural rolls never authorize an impossible outcome. The LLM receives a signed resolution envelope containing the outcome band, mutations, bounded concession, and prose constraints.

## IV. Relationship tracking philosophy

A relationship is not one approval number. The canonical state combines a six-step disposition FSM with continuous trust, respect, fear, intimacy, and familiarity. **Trust** records reliance and truthfulness. **Respect** records perceived competence or principled strength. **Fear** records coercive power and must never be displayed as friendship. **Intimacy** records reciprocal personal closeness but cannot override consent. **Familiarity** controls how much history and nuance an NPC can credibly know.

| Disposition | Default trust band | Promotion requirement | Typical gameplay effect |
|---|---:|---|---|
| **Hostile** | -100 to -50 | restitution or overriding common threat | attacks, refuses, sabotages, or demands surrender |
| **Wary** | -49 to -10 | sustained safe contact or concrete repair | limited exchanges, verification, probation |
| **Neutral** | -9 to +19 | first-meet memory plus fair interaction | ordinary services and public information |
| **Friendly** | +20 to +49 | favor milestone and familiarity | optional quest, small risk, personal context |
| **Allied** | +50 to +74 | explicit alliance and no unrepaired betrayal | crisis support, private access, strategic aid |
| **Loyal** | +75 to +100 | loyalty milestone and deep familiarity | sacrifice option, deepest secret, resilient disagreement |

Disposition promotion requires both score thresholds and milestones. Betrayal, broken promises, abandonment, and boundary breaches apply caps until explicitly repaired. Trivial favors cannot erase a salient betrayal because the event ledger remains authoritative. State is permanent by default; only low-salience familiarity and rumor confidence may decay. A betrayal at turn 50 must still influence behavior at turn 100.

The character sheet displays disposition, bounded meters, salient milestones, and earned unlocks. The journal displays open promises, known boundaries, recent relationship history, and closed paths with reopen conditions. Hidden motives remain hidden until learned through play.

## V. Genre alignment

Each mode changes presentation while preserving the same state contract. D&D foregrounds explicit DCs and d20 rolls. General RPG mode foregrounds leverage, quest state, and branching consequences. PYOA foregrounds inner interpretation, memory, and delayed emotional payoff. LitRPG foregrounds thresholds, System notices, titles, and faction gates.

| Mode | Check expression | Relationship expression | Stakes expression |
|---|---|---|---|
| **D&D** | Charisma or Wisdom-based d20 check against an explicit DC; attitude caps the feasible ask | NPC attitude plus campaign ledger | parley, audience, oath, hostage clock, faction council |
| **RPG** | inspectable skill, evidence, leverage, and reputation gates | companion/faction tabs and quest callbacks | routes opened or closed, services, alliance branches, reputation |
| **PYOA** | mechanics may be hidden; Insight appears as an attributed inner voice that can be biased | close-perspective memories, promises, doubt, and delayed reactions | trust versus self-protection, confession, identity, regret |
| **LitRPG** | explicit skill totals and threshold contributions | System-tracked milestones and affinity categories | reputation gates, titles, contracts, authority, social achievements |

Disco Elysium demonstrates the value of recoverable checks with explicit reopening conditions and personified internal skills that add playable perspective rather than only numeric bonuses.[2] [3] Planescape: Torment demonstrates that mental and social attributes become meaningful when integrated across many conversations; a file-level analysis found 489 greater-than dialogue checks, with Intelligence, Charisma, and Wisdom constituting most of them.[4] Fallout: New Vegas demonstrates that reputation should alter services, hostility, and treatment while preserving positive and negative history separately.[5] Mass Effect demonstrates both the power and the danger of reputation-gated dialogue: Mass Effect 3 reduced the ideological-purity penalty by allowing total reputation to unlock both tones, while earlier designs encouraged a dominant moral track.[6] [7]

## VI. Constitutional invariants

1. **No social attempt without declared intent, target, stakes, and bounded concession.**
2. **No exact-repeat roll against unchanged state.**
3. **No leverage instance may influence the same NPC more than once.**
4. **No relationship promotion from score alone; milestones and absence of unrepaired breaches are required.**
5. **No roll can override consent, hard capability, or established world fact.**
6. **No prose may contradict the pre-GM resolution commit.**
7. **No faction knowledge without a propagation channel.**
8. **No successful talk route may be systematically starved of XP or quest progress relative to combat.**
9. **No failure may leave the situation and all available actions unchanged.**
10. **No System notice or UI meter may substitute for dramatized consequence.**

## References

[1]: https://www.dndbeyond.com/posts/1282-how-to-make-social-encounters-more-than-a-charisma "D&D Beyond — How to Make Social Encounters More Than a Charisma Check"
[2]: https://www.ign.com/wikis/disco-elysium/Getting_Stuck "IGN — Disco Elysium: Getting Stuck"
[3]: https://www.pcgamer.com/your-skills-talk-to-you-in-disco-elysium-an-inventive-rpg-that-keeps-impressing/ "PC Gamer — Your skills talk to you in Disco Elysium"
[4]: https://forums.beamdog.com/discussion/64381/dialogs-stats-checks-analysis "Beamdog Forums — Planescape: Torment Dialogs Stats Checks Analysis"
[5]: https://fallout.wiki/wiki/Fallout:_New_Vegas_Reputation "The Fallout Wiki — Fallout: New Vegas Reputations"
[6]: https://blog.bioware.com/2012/03/01/reputation-in-mass-effect-3/ "BioWare Blog — Reputation in Mass Effect 3"
[7]: https://www.ign.com/wikis/mass-effect-legendary-edition/Paragon_vs._Renegade "IGN — Mass Effect: Paragon vs. Renegade"
