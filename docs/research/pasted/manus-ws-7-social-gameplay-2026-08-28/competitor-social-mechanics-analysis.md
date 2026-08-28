# WS-7 Competitor Social Mechanics Analysis

**Author:** Manus AI  
**Purpose:** Derive implementable lessons for a text-based AI GM rather than imitate surface presentation.

## Comparative analysis

| Benchmark | Social skill system | Dialogue stakes | Reputation and relationship mechanics | Non-combat depth | Transferable lesson | Failure mode to avoid |
|---|---|---|---|---|---|---|
| **Disco Elysium** | A broad skill set contributes active and passive dialogue interventions; personified skills speak as competing internal perspectives. White Checks can be retried after explicit state changes, whereas one-shot checks establish higher commitment.[1] [2] | Checks can alter investigative access, self-concept, character reactions, and the route through a conversation. Failure frequently produces authored content rather than an empty denial. | Thoughts and skill voices reshape the protagonist's interpretive frame; the design makes internal state playable even when no external NPC attitude meter is foregrounded. | Extremely high because investigation, interpretation, self-presentation, and conversation carry much of the game's action. | Make **Insight an authored inner actor** that reveals a perspective, bias, temptation, or clue. Lock failed attempts until a named new fact, investment, or condition appears. | Retry design can still softlock progression if required checks lack sufficient reopening resources or alternate routes.[1] |
| **Planescape: Torment** | Dialogue checks use multiple attributes, especially Intelligence, Charisma, and Wisdom. A file-level analysis counted 489 unique greater-than checks; Intelligence represented 188, Charisma 108, and Wisdom 102.[3] | Dialogue opens memories, rewards, identity revelations, companion material, and alternative quest outcomes. | Alignment and companion relationships respond to choices, while the protagonist's identity and history create long-horizon stakes. | High because mental attributes are integrated repeatedly rather than appearing only in isolated “speech” scenes. | Distribute social and mental checks across the full campaign. Tie them to distinctive verbs and outcomes, not merely more lines. | Raw check volume is not enough; checks that only increase reward or exposition still leave the talk path shallower than combat. |
| **Fallout: New Vegas** | Speech, Barter, knowledge skills, attributes, perks, and contextual facts can unlock dialogue routes. | Negotiation can avert fights, redirect quests, expose hypocrisy, recruit allies, and change faction outcomes. | Faction **Fame and Infamy are tracked separately**; their combination changes treatment, prices, access, and hostility. Reputation follows deeds such as aid, murder, theft, lies, rudeness, and aid to enemies.[4] | High because social choices operate on quests, services, identities, and multiple factions. | Preserve positive and negative history separately or in an event ledger. Connect standing to concrete world services and danger. | Global “hive mind” propagation feels artificial. Knowledge must travel through witnesses, records, and networks rather than instantly updating every member. |
| **Mass Effect** | ME1 buys Charm/Intimidate ranks; ME2 uses the proportion of available morality points collected; ME3 combines Paragon, Renegade, and neutral reputation into a total threshold that unlocks both persuasive tones.[5] [6] | Persuasion can keep characters alive, preserve alliances, and resolve critical confrontations favorably. Interrupts add timing and commitment pressure. | Reputation gates dialogue. Companion loyalty is earned through personal missions and materially changes survival, abilities, and later-game outcomes.[7] | High at authored critical nodes, but many optimal social options are deterministic once gated. | Reward social participation without demanding ideological purity. Let relationships unlock future crisis support and delayed survival consequences. | Blue/red options that are always superior compress roleplay into a solved binary. A persuasion choice should not be automatically correct, costless, and guaranteed. |

## Cross-benchmark findings

The strongest systems make social play operate on the same kinds of state that combat changes. A conversation can remove an encounter, open a location, change a faction's services, create a companion obligation, preserve a life, expose an identity, or advance an investigation. The relevant comparison is therefore not the number of dialogue lines but the number, severity, and persistence of **state transitions**.

A second shared lesson is that preparation should change the possible outcome. Disco Elysium can reopen a recoverable check after skill investment, conversation, or a special item.[1] Fallout: New Vegas frequently recognizes contextual knowledge and reputation in addition to a general speech skill.[4] Mass Effect gates high-impact options behind accumulated reputation.[5] For WS-7, preparation should enter through evidence, relationship history, faction authority, and a target-specific leverage asset; a single Charisma scalar must not dominate every social crisis.

A third lesson concerns failure. Social failure is rewarding when it produces distinctive authored content, new information, a changed relationship, a closed route, or escalation. It is frustrating when the scene remains unchanged and invites an identical attempt. The proposed anti-loop invariant therefore consumes the attempt fingerprint and requires a named reopen condition.

## Adaptation for a text-based AI GM

| Source pattern | AI-GM adaptation | Deterministic guardrail |
|---|---|---|
| Disco Elysium's internal voices | Generate an Insight comment with a named faculty, claim, confidence, and potential bias. | The comment may suggest but may not expose hidden truth beyond the committed knowledge envelope. |
| Disco Elysium's White Check reopening | Store failed proposition, required change, and unlock source in the journal. | Exact-repeat input cannot reroll; only state-delta validation reopens the check. |
| Planescape's broad check integration | Tag social opportunities throughout exploration, faction, companion, and quest content. | Eval requires four skills and at least ten crisis patterns to appear across matched runs. |
| New Vegas reputation | Store faction-specific positive and negative events plus propagation channels. | NPC knowledge is derived from witnesses, records, confidants, and faction reports with delay/confidence. |
| New Vegas contextual checks | Combine skill, evidence, relationship, leverage, faction authority, and circumstance. | ArcDirector commits modifiers and DC before prose generation. |
| Mass Effect loyalty missions | Unlock personal obligations after repeated interaction; feed completion into later crisis survival and support. | Milestones persist across turns and later chapters; no prompt-only memory. |
| Mass Effect interrupts | Offer short decision windows in hostage, exposure, and public confrontation scenes. | Deadline advances after each substantive exchange; silence and repeated text do not freeze time. |
| Mass Effect reputation reform | Let achievement/participation build general social credibility without forcing a single tone. | Persuade and Intimidate remain different in trust, fear, and aftermath even when both can reach the objective. |

## Design decisions resolved

| Commission question | Decision | Rationale |
|---|---|---|
| Always d20, LLM judgment, or hybrid | **Hybrid, deterministic-first** | Rolls add tension only when uncertainty and stakes are real. The LLM parses and realizes fiction but cannot choose the result. |
| Leverage strictness | **Conditional success** | Evidence strength, relevance, credibility, target pressure, relationship, authority, and request size determine effect. |
| Relationship granularity | **Six disposition states plus continuous sub-scores** | Six states are legible; trust, respect, fear, intimacy, and familiarity preserve nuance. |
| Social XP parity | **80% floor, up to 100%** | The floor protects build viability; full parity applies when risk and objective coverage match combat. |
| Crisis frequency | **Target every 30 turns, director-adjusted** | Frequent enough to prevent long exposition pads, but suppressed during unresolved high-salience crises. |
| Persistence | **Permanent milestones with selective decay** | Betrayal, promises, alliances, and boundaries persist. Only low-salience familiarity and rumor confidence decay. |

## References

[1]: https://www.ign.com/wikis/disco-elysium/Getting_Stuck "IGN — Disco Elysium: Getting Stuck"
[2]: https://www.pcgamer.com/your-skills-talk-to-you-in-disco-elysium-an-inventive-rpg-that-keeps-impressing/ "PC Gamer — Your skills talk to you in Disco Elysium"
[3]: https://forums.beamdog.com/discussion/64381/dialogs-stats-checks-analysis "Beamdog Forums — Planescape: Torment Dialogs Stats Checks Analysis"
[4]: https://fallout.wiki/wiki/Fallout:_New_Vegas_Reputation "The Fallout Wiki — Fallout: New Vegas Reputations"
[5]: https://blog.bioware.com/2012/03/01/reputation-in-mass-effect-3/ "BioWare Blog — Reputation in Mass Effect 3"
[6]: https://www.ign.com/wikis/mass-effect-legendary-edition/Paragon_vs._Renegade "IGN — Mass Effect: Paragon vs. Renegade"
[7]: https://www.ign.com/wikis/mass-effect-2/Loyalty_Missions "IGN — Mass Effect 2 Loyalty Missions"
