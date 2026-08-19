# SynapticGM Folk Voice Expectations Package

**Release date:** 2026-08-19  
**Product scope:** SynapticGM only  
**Prepared by:** Manus AI  
**License/content boundary:** Public-domain folklore umbrellas and original SynapticGM material only; no licensed race/place/character/catchphrase content.

## Package purpose

This package operationalizes **player-recognizable folk flavor without folk determinism**. The material provides optional voice defaults for fantasy and science-fiction peoples so that an NPC can feel socially legible on first contact, while remaining a specific person with a history, role, preference, and right to contradict the default.

> **Product law:** Folk flavor is diction plus social instinct only. It never changes ledger facts, stats, permits, kit, inventory, prices, access permissions, quest eligibility, or transaction outcomes. Named NPC memory and CampaignContract override folk defaults.

All expectation profiles are either **SPECULATIVE** original SynapticGM design or narrow **FOLKLORE-CITED** motif boundaries. They are never claims that a folk actually has a fixed personality. The matrix covers 12 requested umbrella folk plus six original LitRPG-ready SynapticGM folk, for **18 total profiles**.

## Deliverable inventory

| Priority | Deliverable | File type | Contents |
|---:|---|---|---|
| 1 | P1 expectation matrix | Markdown | 18 profiles; each has cadence, metaphor palette, social defaults, cross-folk register, Kid Mode handling, never-lines, and exactly three individual overrides. |
| 2 | P2 cross-folk interaction | Markdown | Earned elf↔dwarf friction, orc↔human procedure, campaign-defined vampire etiquette, goblin bargain patterns, beastfolk sensory etiquette, and repair ladder. |
| 3 | P3 implementation schema | JSON Schema | Strict `FolkVoiceProfile` schema with 18 accepted folk IDs, precedence, detection hints, Kid Mode fields, and state firewall. |
| 4 | P3 programming contract | Markdown | Injection template, routing hints, linter rules, state-firewall details, memory behavior, and integration requirements. |
| 5 | P3 evaluation fixtures | JSON | Exactly 20 pass/fail fixtures, including “Elf merchant refuses haste.” |
| 6 | P4 dialogue bank | CSV | Exactly 80 short dialogue beats tagged `folk × act` across ask/refuse/bargain/insult/thank. |
| 7 | P4 rewrite bank | Markdown | Exactly 40 stereotype→individual rewrite pairs. |
| 8 | P5 anti-list | Markdown | Release-blocking bans, safer transformations, Kid Mode guardrails, IP blocks, and state-integrity rules. |
| 9 | Research record | Markdown | Research findings, access dates, source boundaries, and citation keys. |
| 10 | Validation scripts | Python | Local structural count/coverage checks for P3 and P4 artifacts. |

## Recommended integration sequence

| Step | Implementation action | Required result |
|---:|---|---|
| 1 | Validate a profile against `P3_folk_voice_profile.schema.json`. | Unexpected keys and unsupported folk IDs are rejected. |
| 2 | Resolve CampaignContract, named NPC memory, scene/safety facts, role, and individual override before consulting the folk default. | The default never overrides a known individual. |
| 3 | Inject only the resolved presentation layer using the prompt block in `P3_programming_contract.md`. | The model sees concise stylistic cues and hard blocks. |
| 4 | Run output through the linter rules and authoritative-state firewall. | Voice cannot alter game truth or produce prohibited content. |
| 5 | Run all P3 fixtures and P4 structural tests before release. | Regression coverage confirms consent, Kid Mode, IP, override, and state safety. |

## Source basis and access dates

The cited sources are used conservatively. They demonstrate variation and a limited number of motifs; they do **not** authorize fixed traits or real-world cultural analogies. Source access date for every item below is **2026-08-19**.

| Ref. | Source | Limited use in this package |
|---:|---|---|
| [1] | [World History Encyclopedia — “Elves & Dwarves in Norse Mythology”](https://www.worldhistory.org/article/1695/elves--dwarves-in-norse-mythology/) | Craft, precious-object, ambiguity, and classification complexity; used to reject one-note noble/gruff portrayals. |
| [2] | [Encyclopedia.com — “Trolls”](https://www.encyclopedia.com/history/encyclopedias-almanacs-transcripts-and-maps/trolls) | Scandinavian nature/landscape, trickster, and bargain motifs; used to reject stupid-brute coding. |
| [3] | [Encyclopedia.com — “Vampire”](https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/vampires) | Regional variation and varied prevention traditions; used to label invitation/threshold etiquette as campaign-defined, not universal folklore. |
| [4] | [Encyclopedia.com — “Mermaid”](https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/mermaids) | Variation in sea-being/siren imagery; used to prohibit universal seduction coding. |
| [5] | [Encyclopedia.com — “Mermaids and Mermen”](https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/mermaids-and-mermen) | Sea danger, weather, and human–sea-being story variation; used as a motif boundary only. |
| [6] | [The Angry Noodle — “Creating a Fictional Culture for Your World”](https://theangrynoodle.com/creating-fictional-cultures-and-races-for-your-world-while-avoiding-stereotypes-and-caricatures/) | Public fiction-design perspective against monolithic racial traits and exaggerated joke dialogue. |

## Evidence labels

| Label | Meaning |
|---|---|
| **FOLKLORE-CITED** | A specific, source-linked motif with regional/historical limits stated. |
| **SPECULATIVE** | Original SynapticGM play guidance designed to meet player expectations safely. |
| **CONTRACTUAL** | Required product behavior, independent of folklore. |
| **INDIVIDUAL OVERRIDE** | Named-NPC or CampaignContract fact that defeats folk defaults. |

## Non-negotiable release rules

| Rule | Required behavior |
|---|---|
| Individuality | Never state or imply that every member of a folk has a moral, cognitive, sexual, or social trait. |
| Consent | Ask or respect boundaries around touch, private space, body commentary, feeding, and adult flirtation. |
| Kid Mode | Block sexualized predation, adult/child ambiguity, coercive flirting, graphic feeding, body horror, and gore. |
| IP safety | Exclude Tolkien product lines, D&D product race names/content, anime-series names, and all recognizable licensed lore/catchphrases. |
| State isolation | Prohibit changes to ledger facts, stats, permits, kit, inventory, prices, access, quest state, and transactions. |
| Precedence | Enforce CampaignContract → named NPC memory → scene/safety → role → individual override → folk default. |

## Validation record

| Check | Result |
|---|---|
| P3 schema and fixture structural validation | Passed: 18 folk IDs, 20 unique fixtures, required firewall/precedence fields present. |
| P4 dialogue bank validation | Passed: 80 unique beats across 18 folk; all five required acts represented. |
| P4 rewrite bank validation | Passed: 40 rewrite pairs. |
| Manual review target | Confirm no content asserts a universal folk trait, uses comic accents, imports licensed content, or modifies protected state. |

## Suggested filenames

All released copies should use the prefix `SynapticGM_folk_voice_expectations_2026-08-19_`. This package’s final archive and contained source files follow that prefix so it can coexist with later releases.

## Primary references

[1]: https://www.worldhistory.org/article/1695/elves--dwarves-in-norse-mythology/ "Manea, ‘Elves & Dwarves in Norse Mythology,’ World History Encyclopedia, accessed 2026-08-19"
[2]: https://www.encyclopedia.com/history/encyclopedias-almanacs-transcripts-and-maps/trolls "‘Trolls,’ Encyclopedia.com, accessed 2026-08-19"
[3]: https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/vampires "‘Vampire,’ Encyclopedia.com, accessed 2026-08-19"
[4]: https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/mermaids "Canadé Sautman, ‘Mermaid,’ Encyclopedia.com, accessed 2026-08-19"
[5]: https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/mermaids-and-mermen "‘Mermaids and Mermen,’ Encyclopedia.com, accessed 2026-08-19"
[6]: https://theangrynoodle.com/creating-fictional-cultures-and-races-for-your-world-while-avoiding-stereotypes-and-caricatures/ "The Angry Noodle, ‘Creating a Fictional Culture for Your World,’ accessed 2026-08-19"
