# WS-7 Research Notes

## Scope and local evidence

The only uploaded source is `MANUS-PROMPT-WS-7.txt`. The supporting repository documents cited by that commission were not included in the upload, so local claims about the 240–260 turn Walk Away padding loop, repeated leverage, and missing NPC relationship memory are treated as commission-provided evidence rather than independently verified artifacts.

## Benchmark findings

### Disco Elysium

IGN's guide confirms that White Checks can be retried, while failed checks appear in the journal map. A failed White Check may reset when the player invests a skill point, speaks to the right person, or uses specific items. Design lesson: recoverable failure should create an explicit reopening condition rather than invite immediate repetition. Required progression checks need alternate routes or anti-softlock protection.

Source: https://www.ign.com/wikis/disco-elysium/Getting_Stuck

### Planescape: Torment

A Beamdog forum analysis extracted 489 unique greater-than dialogue checks from the game files. Intelligence represented 188 checks (about 38%), Charisma 108 (about 22%), and Wisdom 102 (about 21%). Around 90% of checks for each major mental attribute were satisfied at score 16. Design lesson: non-combat attributes need broad, repeated integration across conversations, not isolated showcase checks; however, encounter consequences matter more than raw check counts.

Source: https://forums.beamdog.com/discussion/64381/dialogs-stats-checks-analysis

### Fallout: New Vegas

The independent Fallout wiki describes reputation as a faction-specific perception system driven by positive and negative deeds. Fame and Infamy are tracked separately, and their combination determines reputation. Outcomes include merchant discounts, hired attacks, different treatment, access changes, and hostility. Actions such as quests, aid, killing, stealing, lying, rudeness, and helping opposing factions adjust the ledger. Design lesson: preserve mixed histories rather than collapse reputation to one scalar, and connect reputation to concrete services, danger, and dialogue.

Source: https://fallout.wiki/wiki/Fallout:_New_Vegas_Reputation

### Mass Effect

BioWare's Patrick Weekes explains that Mass Effect 3 reputation unlocks high-impact dialogue choices, that Paragon/Renegade actions arise from decisions, and that general reputation can accrue from achievements without moral flavor. ME3 combines Paragon and Renegade into one threshold score so mixed play is not penalized, while retaining the player's tonal ratio. IGN documents that Mass Effect 1 bought Charm/Intimidate ranks, Mass Effect 2 required a high share of available morality points and consequently pressured ideological purity, and Mass Effect 3 moved to aggregate reputation. Design lesson: social progression should reward participation and achievement without locking optimal outcomes behind a single repeated tone. Avoid deterministic color-coded options that are always superior and always succeed.

Sources:
- https://blog.bioware.com/2012/03/01/reputation-in-mass-effect-3/
- https://www.ign.com/wikis/mass-effect-legendary-edition/Paragon_vs._Renegade
- https://www.ign.com/wikis/mass-effect/How_the_Morality_System_Works

### Dungeons & Dragons social interaction

D&D Beyond summarizes the 2014 Dungeon Master's Guide procedure as: determine an NPC's starting attitude (friendly, indifferent, or hostile), roleplay the approach to determine the check, then compare a Charisma check against a conversation reaction table. Design lesson: attitude establishes feasibility, roleplay and leverage set context, and dice resolve genuine uncertainty rather than override an NPC's motives.

Source: https://www.dndbeyond.com/posts/1282-how-to-make-social-encounters-more-than-a-charisma

## Preliminary synthesis

The recommended WS-7 model is hybrid and deterministic-first. The engine should commit stakes, feasibility, evidence state, leverage freshness, and consequence bands before prose generation. High-stakes uncertainty may then use a d20 check; routine, impossible, or already-earned outcomes should be narrated without a roll. The LLM expresses and adjudicates only within the committed envelope.

Relationship state should combine a six-step disposition FSM with a continuous trust score and durable milestones. Faction reputation should preserve at least positive and negative evidence separately or through an event ledger, so betrayal cannot be erased by trivial favors. Leverage should be an evidence-backed, target-specific resource with salience, fit, credibility, risk, exposure, expiry, and one-use exhaustion rather than a reusable dialogue verb.

The core anti-loop rule should be: every social crisis attempt must change at least one durable state variable, consume a resource, advance time, reveal information, or close/reopen a path under a named condition. Exact-repeat attempts without new state must be rejected deterministically and must not produce fresh success rolls.

## Additional sources

### Disco Elysium internal-skill dialogue

PC Gamer's preview describes skills as personified parts of the protagonist's personality that interject with insights and desires. The article gives examples of Logic, Conceptualization, Visual Calculus, Empathy, persuasion-related abilities, and Inland Empire affecting investigations and conversations; a failed check produced a distinct character response rather than no content. Design lesson: in PYOA mode, Insight should not merely expose a correct answer. It should generate an attributed inner voice, possible bias, and a playable prompt, including bespoke failure content.

Source: https://www.pcgamer.com/your-skills-talk-to-you-in-disco-elysium-an-inventive-rpg-that-keeps-impressing/

### Expert choice-architecture source

The GDC Vault page identifies Josh Sawyer's talk, *Do (Say) The Right Thing: Choice Architecture, Player Expression, and Narrative Design in Fallout: New Vegas*. The page itself exposes little transcript content, so it is useful as a provenance reference for the benchmark but is not used for detailed factual claims.

Source: https://www.gdcvault.com/play/1015758/Do-(Say)-The-Right-Thing

### Mass Effect 2 loyalty and delayed relationship payoff

IGN documents that every squadmate has a Loyalty Mission, that most require several conversations before they unlock, and that loyalty materially affects survival during the finale, can affect another squadmate's survival, unlocks an extra power, and carries consequences into Mass Effect 3. Design lesson: relationship milestones should not be cosmetic affinity badges. They should unlock content and capabilities while changing delayed crisis outcomes; a betrayal or neglected obligation must remain relevant many turns later.

Source: https://www.ign.com/wikis/mass-effect-2/Loyalty_Missions
