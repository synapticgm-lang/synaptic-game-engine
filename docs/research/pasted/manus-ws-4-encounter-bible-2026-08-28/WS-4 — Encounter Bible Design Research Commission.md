# WS-4 — Encounter Bible Design Research Commission

**Status:** Complete  
**Author:** Manus AI  
**Package version:** 1.0.0  
**Validation:** 462/462 checks passed; TypeScript strict compilation passed

## Executive Summary

WS-4 defines an implementation-ready encounter system built around a single non-negotiable lifecycle: **telegraph → stakes → resolution → aftermath**. The mechanical core commits state before the generative GM narrates, which prevents combat purgatory, decorative flee/parley options, generic cross-bible spawns, social pad loops, and PYOA branches that forget player choices.

The package contains **48 authored templates**: eight LitRPG, eight DnD, eight RPG, and twenty-four PYOA crises across four bibles. Every template has a bounded turn window, forced terminal, legal alternatives, typed receipts, hard biome filters, version/hash metadata, and a full prose example.

## Commission Decisions

| Design question | Adopted decision | Operational consequence |
| --- | --- | --- |
| Template depth | **5–8 standard** | D2–D4 contain 8 each; D5 contains 6 per PYOA bible. |
| Telegraph strictness | **Most: ≥80% warning; ≤20% fair surprise** | Authored package coverage is 100%; surprise still requires suspicion or reaction and moderate-or-lower opening severity. |
| Resolution complexity | **Hybrid: deterministic core, GM flavor** | Code owns rolls, HP, clocks, facts, terminals, and receipts; prose cannot revise them. |
| Loot granularity | **Typed elite/boss; procedural trash** | Bosses guarantee build/campaign relevance; trash rewards remain contextual and light. |
| Biome filter | **Hard filter** | Drought cannot override mode, bible, biome, site, faction, tier, prerequisite, exclusion, or cooldown. |
| Density enforcement | **Turn- and location-based** | Quotas prevent empty play; drought prevents passivity; saturation/recovery guards prevent MMO cadence. |

## Deliverable Map

| ID | Deliverable | Primary artifacts |
| --- | --- | --- |
| **D1** | Encounter Bible Constitution | [`D1_encounter_bible_constitution.md`](./D1_encounter_bible_constitution.md) |
| **D2** | LitRPG Encounter Library — 8 templates | [`D2_litrpg_encounter_library.json`](./D2_litrpg_encounter_library.json), [`D2_litrpg_encounter_library.md`](./D2_litrpg_encounter_library.md) |
| **D3** | DnD Encounter Library — 8 templates | [`D3_dnd_encounter_library.json`](./D3_dnd_encounter_library.json), [`D3_dnd_encounter_library.md`](./D3_dnd_encounter_library.md) |
| **D4** | RPG Encounter Library — 8 templates | [`D4_rpg_encounter_library.json`](./D4_rpg_encounter_library.json), [`D4_rpg_encounter_library.md`](./D4_rpg_encounter_library.md) |
| **D5** | PYOA Crisis Library — 4 bibles × 6 crises | [`D5_pyoa_crisis_library.json`](./D5_pyoa_crisis_library.json), [`D5_pyoa_crisis_library.md`](./D5_pyoa_crisis_library.md) |
| **D6** | Telegraph Pattern Catalog | [`D6_telegraph_catalog.json`](./D6_telegraph_catalog.json), [`D6_telegraph_catalog.md`](./D6_telegraph_catalog.md) |
| **D7** | Stakes Clarity Templates | [`D7_stakes_templates.json`](./D7_stakes_templates.json), [`D7_stakes_templates.md`](./D7_stakes_templates.md) |
| **D8** | Resolution Mechanics | [`D8_resolution_mechanics.ts`](./D8_resolution_mechanics.ts), [`D8_resolution_mechanics.md`](./D8_resolution_mechanics.md) |
| **D9** | Loot Table Design | [`D9_loot_tables.json`](./D9_loot_tables.json), [`D9_loot_tables.md`](./D9_loot_tables.md) |
| **D10** | Biome-Appropriate Spawn Matrix | [`D10_biome_spawn_matrix.csv`](./D10_biome_spawn_matrix.csv), [`D10_biome_spawn_matrix.md`](./D10_biome_spawn_matrix.md) |
| **D11** | Density Targets and Enforcement | [`D11_encounter_density.ts`](./D11_encounter_density.ts), [`D11_density_targets.md`](./D11_density_targets.md) |
| **D12** | Backlog and Eval Harness | [`D12_implementation_backlog.csv`](./D12_implementation_backlog.csv), [`D12_eval_gates.json`](./D12_eval_gates.json), [`D12_implementation_and_eval.md`](./D12_implementation_and_eval.md) |

The shared JSON Schema is [`schemas/encounter-template.schema.json`](./schemas/encounter-template.schema.json). Validation evidence is in [`VALIDATION_REPORT.md`](./VALIDATION_REPORT.md) and [`validation_results.json`](./validation_results.json).

## Template Inventory

| Mode/bible | Count | Coverage |
| --- | ---: | --- |
| LitRPG — Summoned Pact | 8 | Hub ambush, dungeon trash, miniboss, boss, arena duel, faction raid, patrol, wandering elite |
| DnD — Cursed Keep | 8 | Combat, trap, skill check, environmental hazard, NPC duel, puzzle, boss, random encounter |
| RPG — Cape District | 8 | Social standoff, betrayal, deadline, faction confrontation, moral dilemma, exposure, leverage, political ambush |
| PYOA — Thornferry | 6 | Charter, trust, bandits/villagers, floodgate, witness bell, ferryman ending |
| PYOA — Vesper Glass | 6 | Census, reflection, opera pact, true name, lantern heir, faceless city |
| PYOA — Erebus-9 | 6 | Oxygen, navigator, quarantine, reactor, signal, last shuttle |
| PYOA — Ashwinter Court | 6 | White Hart, warmth tax, frozen heir, midwinter mask, prisoner, ember crown |

## Integration Architecture

```text
world map + active ledgers + density state
    → encounterBiomeMatrix.ts (hard legal candidates)
    → encounterBible.ts (template snapshot/version/hash)
    → encounterTelegraph.ts + encounterStakes.ts
    → arcDirector.ts pre-GM commit
    → situationPacket.ts immutable contract
    → encounterResolution.ts authoritative mutation
    → encounterAftermath.ts idempotent receipt
    → proseWarden.ts contradiction check
    → evalHarness.ts G1–G5 evidence
```

The implementation backlog’s critical path begins with schema/library loading, hard biome selection, telegraph/stakes materialization, and mode resolvers. Forced terminal closure and aftermath must land before content expansion. The 48 templates should enter the BeatContract registry only after those interfaces freeze.

## Quality Gates

| Gate | Stable-release requirement |
| --- | --- |
| **G1** | 100% of spawned encounters reach one terminal within `maxTurns` and apply one receipt. |
| **G2** | At least 80% warn before engagement; every cue is actionable; surprise fairness has zero violations. |
| **G3** | Zero wrong-bible spawns and zero hard-filter overrides. |
| **G4** | 100% of closed scopes meet density bands before stable release; exact boss counts. |
| **G5** | 100% of terminals emit at least two reconciled receipt types; zero duplicate applications. |

## Validation Results

| Check | Result |
| --- | ---: |
| Schema and semantic checks | **462/462 passed** |
| JSON Schema errors | **0** |
| JSON/CSV parse failures | **0** |
| Unique template IDs | **48/48** |
| Authored telegraph coverage | **100%** |
| PYOA depth | **6 crises per bible** |
| Biome matrix | **23 rows; all four modes; every row has fallback and exclusions** |
| Backlog | **40 tasks: 28 P0, 10 P1, 2 P2** |
| Evaluation gates | **G1–G5 complete** |
| TypeScript | **Strict `tsc --noEmit` passed for D8 and D11** |

## Research Basis

The DnD mechanics use the official d20 procedure and typical DC framework.[1] Stakes expose risk and expected effect separately, while partial outcomes preserve success and add distinct consequences.[2] [3] Bounded progress and danger clocks support multi-turn obstacles without leaving filled clocks unresolved.[4] PYOA convergence retains persistent facts and delayed callbacks.[5] Telegraphs emphasize actionable cause-and-effect, planning footholds, and fair limits on surprise.[6]

## References

[1]: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game "D&D Beyond Basic Rules: Playing the Game"
[2]: https://bladesinthedark.com/setting-position-effect "Blades in the Dark SRD: Setting Position & Effect"
[3]: https://bladesinthedark.com/consequences-harm "Blades in the Dark SRD: Consequences & Harm"
[4]: https://bladesinthedark.com/progress-clocks "Blades in the Dark SRD: Progress Clocks"
[5]: https://sub-q.com/making-interactive-fiction-the-branch-and-the-merge/ "Making Interactive Fiction: The Branch and the Merge"
[6]: https://book.leveldesignbook.com/process/combat/encounter "The Level Design Book: Encounter"
