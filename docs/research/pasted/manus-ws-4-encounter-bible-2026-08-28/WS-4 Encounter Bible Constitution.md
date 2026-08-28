# WS-4 Encounter Bible Constitution

**Author:** Manus AI  
**Status:** Implementation-ready design specification  
**Normative language:** **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are requirement levels.

## 1. Purpose

This constitution defines the shared contract for every combat, hazard, social confrontation, and branching crisis produced by the encounter system. Its primary objective is to eliminate two failure classes: **purgatory**, in which an encounter can consume turns without reaching a state transition; and **theater choice**, in which a displayed choice produces no durable difference.

> **Encounter:** A bounded state machine that converts a telegraphed situation and declared stakes into exactly one terminal outcome, followed by an auditable aftermath receipt.

The core loop is **telegraph → stakes → resolution → aftermath**. The director commits the mechanical contract before the generative GM writes prose. The GM may elaborate sensory detail, tactics, emotion, and dialogue, but it may not revise the committed legality, probability, terminal outcome, or receipt.

## 2. Research Basis and Design Translation

The official D&D rules resolve uncertain, narratively meaningful actions by rolling a d20, adding relevant modifiers, and comparing the total with a target number. They distinguish ability-check DCs from attack-roll ACs and provide typical DCs from 5 to 30.[1] The DnD bible adopts that procedure without requiring a roll when the outcome is certain or failure would not matter.

*Blades in the Dark* separates **position** (risk) from **effect** (expected impact), giving the player intelligible stakes before a roll.[2] Its consequence model includes reduced effect, complication, lost opportunity, worse position, and recorded harm, while cautioning that a complication should not erase a successful result.[3] WS-4 generalizes those ideas into typed outcomes and monotonic state transitions.

Progress clocks provide visible bounds for complex obstacles, with 4-, 6-, and 8-segment clocks for increasing complexity; racing, danger, linked, mission, and faction clocks represent different kinds of progress and escalation.[4] The RPG and PYOA bibles use bounded clocks but require a terminal event whenever a clock fills.

Interactive-fiction practice supports branch-and-bottleneck and hub-and-spoke structures when persistent state, delayed callbacks, and accumulated choice variables preserve the consequences of choices after paths merge.[5] The PYOA bible therefore allows convergence but forbids state erasure.

Level-design guidance emphasizes clear cause and effect, opportunities to survey danger and plan an escape, restrained enemy-role palettes, and caution with difficult forced ambushes.[6] WS-4 makes telegraphs actionable and limits untelegraphed ambush severity.

## 3. Constitutional Invariants

| ID | Invariant | Enforced rule | Failure prevented |
| --- | --- | --- | --- |
| C-01 | **Bounded duration** | Every encounter declares `maxTurns` and a forced terminal fallback. | 290-turn combat purgatory |
| C-02 | **Single terminality** | Exactly one of `victory`, `defeat`, `fled`, `negotiated`, `partial`, or `crisisEnding` is committed once. | Reopening resolved conflicts |
| C-03 | **Action honesty** | Every displayed action has prerequisites, a resolver, and at least one state-changing result. | Decorative flee/parley choices |
| C-04 | **Monotonic progress** | A repeated action must advance success, advance danger, consume a resource, change position, or become illegal. | Pad loops and leverage spam |
| C-05 | **Declared stakes** | Before commitment, the player sees material win/lose/flee/negotiate or branch consequences. | Invisible or arbitrary fallout |
| C-06 | **Receipt completeness** | A terminal outcome emits a receipt with at least two material receipt types. | Combat that “just ends” |
| C-07 | **Ledger authority** | HP, clocks, resources, flags, faction, quests, NPCs, and dungeon state mutate in code before prose. | Narrated but unpersisted progress |
| C-08 | **Biome hard filter** | Candidate templates and actors must pass bible, biome, site, faction, tier, and exclusion checks. | Wrong-bible spawns |
| C-09 | **No success erasure** | Partial success preserves its promised effect; costs are separate mutations. | “Success, but nothing happens” |
| C-10 | **No unchanged retry** | The same approach cannot be offered from an identical state after a failed or partial attempt. | Infinite negotiation/check loops |
| C-11 | **Branch memory** | PYOA forks write exclusive facts and ending eligibility before convergence. | Theater branching |
| C-12 | **Idempotent aftermath** | A receipt carries a unique commit key and cannot be applied twice. | Duplicate XP, loot, or quest ticks |

## 4. Four-Phase Lifecycle

| Phase | Required inputs | Required output | Hard gate |
| --- | --- | --- | --- |
| **Telegraph** | World state, location authority, candidate template, threat source | One or more warning cues plus approach window | At least 80% of encounters warn before engagement; ambushes follow the surprise exception |
| **Stakes** | Legal player approaches, opposition intent, difficulty/tier | Explicit outcomes for supported approaches | No action is displayed without a resolver and state delta |
| **Resolution** | Immutable situation packet, player choice, authoritative ledgers, seeded RNG where used | One progress mutation or one terminal outcome per resolution step | `turnsInEncounter <= maxTurns`; terminal fallback fires at bound |
| **Aftermath** | Terminal outcome, pre/post ledger snapshots, reward policy | Idempotent receipt and hooks for subsequent beats | At least two nonempty receipt types; all deltas reconcile |

### 4.1 Telegraph

A telegraph is not merely atmosphere. It must communicate enough information to alter a rational decision. Every telegraph contains a **channel**, a **signal**, an **inference**, a **response window**, and an **action hook**.

| Channel | Typical signal | Actionable inference | Example action hook |
| --- | --- | --- | --- |
| `STATUS` | Threat meter, countdown, combat banner, faction alert | Severity, timing, or rules | Inspect, prepare, spend resource, retreat |
| `NPC` | Warning, rumor, plea, boast, ultimatum | Intent, weakness, demand, or route | Question, recruit, bargain, confront |
| `SCENE` | Tracks, bodies, scorch marks, silence, geometry | Actor class, direction, arena risk | Scout, hide, take high ground, detour |
| `ITEM` | Broken seal, keyed ward, spent casing, poisoned ration | Countermeasure or provenance | Equip, cleanse, decode, present proof |
| `FACTION` | Patrol schedule, wanted notice, intercepted orders | Affiliation, reinforcement, political cost | Bribe, disguise, expose, call ally |

**Standard strictness is “most”:** at least 80% of encounters must receive a pre-engagement cue. A deliberate ambush may occupy the remaining share only when the template is marked `surpriseEligible`, opening harm is capped, and the player receives either a suspicion cue or a reaction window immediately after reveal.

### 4.2 Stakes

The situation packet exposes only outcomes the engine can honor. Each supported approach declares:

| Field | Requirement |
| --- | --- |
| `label` | Player-facing verb and target, such as “Break the ward” rather than “Try something” |
| `requirements` | Items, skills, leverage, position, or flags required for legality |
| `method` | `deterministic`, `d20`, `combat`, `clock`, or `fork` |
| `chance` | Exact target and modifier source when random; omitted for deterministic outcomes |
| `onSuccess` | Concrete terminal or progress state changes |
| `onPartial` | Preserved success component plus explicit cost |
| `onFailure` | Concrete cost, escalation, or lost opportunity |
| `lockout` | State change preventing an identical unchanged retry |

Combat-capable templates SHOULD expose **win**, **lose**, **flee**, and **negotiate** if fictionally plausible. If flee or negotiation is impossible, the UI must state why rather than hide the rule behind prose.

### 4.3 Resolution

The resolver owns truth. Randomness is deterministic under a stored seed so a run is replayable. Every resolution step consumes an `actionId`, validates its requirements against current state, performs one atomic mutation, appends an event, and then evaluates terminal conditions.

The resolver follows these principles:

1. **Ledger first:** compute and commit HP, clocks, resources, faction, quest, NPC, and dungeon deltas before narration.
2. **One step, one proof:** each player action produces a persisted event with before/after values.
3. **Bounded retries:** a failed approach changes position, consumes leverage, advances danger, or locks itself.
4. **Terminal priority:** if terminal conditions and ordinary progress occur together, terminal resolution wins and no subsequent encounter action is accepted.
5. **Forced closure:** at `maxTurns`, the template’s declared fallback resolves. Combat may become defeat, costly escape, or enemy withdrawal; a crisis may become a deadline ending. It may never remain active.
6. **GM flavor boundary:** narration can explain the outcome but cannot add damage, revoke rewards, resurrect defeated actors, or invent incompatible biome/faction facts.

### 4.4 Aftermath

An aftermath receipt is both player feedback and a machine-verifiable transaction. It contains the terminal outcome, a compact narrative summary, ledger deltas, provenance, follow-up hooks, and a unique idempotency key.

| Receipt type | Examples | Persistence target |
| --- | --- | --- |
| `XP` | Character XP, skill advancement, reputation XP | Character/progression ledger |
| `LOOT` | Currency, typed item, consumable, quest item, favor, intel | Inventory/economy ledger |
| `FACTION` | Standing delta, heat, access, hostility, debt | Faction ledger |
| `QUEST` | Objective tick, branch, fail-forward state, completion | Quest ledger |
| `NPC` | Alive/dead, recruited, trust, injury, availability | NPC ledger |
| `DUNGEON` | Mob decrement, node cleared, hazard disarmed, boss gate | Dungeon/location ledger |

The global quality gate requires **at least two nonempty receipt types**. Templates specify stricter minima where appropriate: bosses normally produce XP, loot, dungeon, and quest receipts; social confrontations normally produce faction/NPC plus intel, favor, access, or quest progress.

## 5. Genre Alignment

| Mode | Primary fantasy | Authoritative mechanic | Required encounter texture | Prohibited degeneration |
| --- | --- | --- | --- | --- |
| **LitRPG** | Visible progression and systemic mastery | HP/resources, tier, cooldowns, typed loot | Status telegraphs, tier-readable enemies, build counters, measurable rewards | Endless HP narration without ledger changes |
| **DnD** | Adjudicated risk and creative problem solving | d20 + modifier vs DC/AC; advantage/disadvantage | Combat, traps, hazards, checks, puzzles, NPC interaction | Passive exploration with no uncertain tests |
| **RPG** | Relationships, factions, pressure, and consequence | Leverage tokens plus progress/danger clocks | Demands, deadlines, betrayals, exposure, moral costs | Repeating the same leverage with no consumption |
| **PYOA** | Authored forks and earned endings | Exclusive facts, delayed callbacks, ending eligibility | Clear fork labels, branch memory, convergence with variation | Branches that merge by deleting choice state |

## 6. Biome and Bible Authority

Spawning uses a hard-filtered candidate set. A candidate is legal only if all positive constraints match and no exclusion matches:

```text
legal = bibleMatch
     && modeMatch
     && biomeAllowed
     && siteTagAllowed
     && tierWithinRange
     && factionPresentOrGeneric
     && prerequisiteFlagsSatisfied
     && exclusionTagsDisjoint
     && cooldownExpired
     && densityRoleAvailable
```

If the filtered set is empty, the director must not substitute a wrong-bible actor. It instead selects, in order, a generic environmental encounter valid for the current bible, a non-hostile discovery, or a no-spawn receipt that records the content gap for authoring telemetry.

## 7. Density Constitution

Density is enforced by **both location and turns**. Location quotas create authored texture; drought timers prevent empty play; cooldowns and role budgets prevent MMO-like saturation. These values are product defaults to tune through telemetry rather than universal design laws.[7]

| Context | Default target | Drought trigger | Saturation guard |
| --- | --- | --- | --- |
| LitRPG 10-room dungeon | 4–6 trash groups, 1–2 minibosses, 1 boss | Eligible hostile by 15 turns without combat | No more than 2 hostile encounters in 5 turns; recovery beat after elite/boss |
| DnD 10-area keep | 3–5 combat encounters, 2–4 traps/hazards, 2–4 checks/puzzles, 1 boss | Interactive challenge by 8 exploration turns; combat/hazard by 15 | No more than 3 same-type challenges consecutively |
| RPG hub, 100 turns | 3–5 social pressures, 1–2 major confrontations, 1 optional ambush | Pressure escalation by 12 turns without material conflict | Major confrontation cooldown 15 turns |
| PYOA chapter, 60 turns | 2–4 consequential crises, 1 commitment fork, 1 payoff or ending gate | Consequential fork by 12 turns | No crisis repeats after terminal resolution |

A density intervention must still pass biome, cooldown, and eligibility filters. **Drought pressure never overrides world authority.**

## 8. Anti-Purgatory Terminal Rules

| Encounter family | Normal terminal test | Forced terminal at bound |
| --- | --- | --- |
| HP combat | One side’s aggregate active HP reaches zero; accepted surrender; successful flee | Costly escape if route exists; otherwise defeat with survivable consequence unless template is explicitly lethal |
| Trap/hazard | Disarmed, bypassed, triggered, or abandoned with route change | Trigger partial consequence and close hazard, or seal route and create a detour quest |
| Skill challenge | Success clock fills, danger clock fills, or opportunity is abandoned | Resolve against whichever clock is ahead; ties produce success with cost |
| Social/leverage | Concession clock fills, opponent exits, violence begins, or player withdraws | Opponent commits to stated fallback demand; consumed leverage remains spent |
| PYOA crisis | Fork committed and ending/callback state written | Deadline ending corresponding to current flags and dominant choice history |

## 9. Integration Contract

| Integration point | Responsibility |
| --- | --- |
| `encounterBible.ts` | Load and index immutable per-bible templates; expose legal candidates only |
| `encounterTelegraph.ts` | Select cue channels and construct the telegraph section of the situation packet |
| `encounterStakes.ts` | Materialize legal approaches and exact outcomes from current state |
| `encounterResolution.ts` | Validate action, resolve deterministic/seeded mechanics, mutate ledgers atomically |
| `encounterAftermath.ts` | Reconcile deltas and emit an idempotent receipt |
| `lootTables.ts` | Resolve typed, tiered rewards under deterministic seed and pity/uniqueness rules |
| `encounterBiomeMatrix.ts` | Enforce allowed and excluded biome/site combinations |
| `encounterDensity.ts` | Maintain quotas, drought counters, cooldowns, and role budgets |
| `arcDirector.ts` | Commit template and situation packet before GM generation |
| `situationPacket.ts` | Deliver immutable telegraph, stakes, allowed actions, mechanics, and committed outcome context |
| `proseWarden.ts` | Reject prose that contradicts outcome, receipts, actor identity, or location authority |
| `evalHarness.ts` | Measure resolution, warning, biome, density, and aftermath gates per run and in aggregate |

## 10. Governance and Versioning

Each template carries `schemaVersion`, `templateVersion`, `bibleId`, and `contentHash`. A balance change increments the template version; a contract-shape change increments the schema version. Active encounters retain the exact template snapshot and seed with which they began. New versions affect only new encounters.

Promotion follows four stages: **draft → shadow → canary → stable**. Shadow templates can be selected and evaluated but are not shown. Canary templates are exposed to a bounded run share with gate-specific telemetry. A template reaches stable only after zero unresolved terminals, zero wrong-bible spawns, complete receipts, and acceptable warning coverage over the agreed sample.

Deprecation requires a replacement or an explicit content-gap fallback. Deleting a template while an active encounter references it is forbidden; archived snapshots remain replayable.

## 11. Acceptance Checklist

An implementation conforms only if every spawned encounter can answer, before prose generation: **What warned the player? What can the player do? What will each result change? What ends the encounter? What receipt proves it ended?** If any answer is absent, the director must reject the candidate and select another.

## References

[1]: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game "D&D Beyond Basic Rules: Playing the Game"
[2]: https://bladesinthedark.com/setting-position-effect "Blades in the Dark SRD: Setting Position & Effect"
[3]: https://bladesinthedark.com/consequences-harm "Blades in the Dark SRD: Consequences & Harm"
[4]: https://bladesinthedark.com/progress-clocks "Blades in the Dark SRD: Progress Clocks"
[5]: https://sub-q.com/making-interactive-fiction-the-branch-and-the-merge/ "Making Interactive Fiction: The Branch and the Merge"
[6]: https://book.leveldesignbook.com/process/combat/encounter "The Level Design Book: Encounter"
[7]: https://www.gamedeveloper.com/design/the-art-and-science-of-pacing-and-sequencing-combat-encounters "The Art and Science of Pacing and Sequencing Combat Encounters"
