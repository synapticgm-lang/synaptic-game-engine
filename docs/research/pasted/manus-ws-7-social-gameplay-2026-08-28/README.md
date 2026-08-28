# WS-7 Delivery Package

This package completes the ten requested deliverables for **Social Gameplay and Non-Combat Systems**. Start with `WS-7-Social-Gameplay-Non-Combat-Systems.md`, which synthesizes the research, resolves the six design questions, and maps every recommendation to implementation and evaluation artifacts.

| Deliverable | Artifact |
|---|---|
| D1 Social Gameplay Constitution | `social-gameplay-constitution.md` |
| D2 Crisis Catalog | `social-crisis-catalog.json`, `social-crisis-catalog.schema.json` |
| D3 Social Skills | `socialSkills.ts` |
| D4 Leverage | `leverageMechanics.ts` |
| D5 Relationships | `npcRelationships.ts`, `npc-relationship.schema.json`, `npc-relationship.example.json` |
| D6 Stakes Templates | `socialStakes.ts` |
| D7 Resolution Outcomes | `socialStakes.ts` |
| D8 Social Progression | `socialProgression.ts` |
| D9 Competitor Analysis | `competitor-social-mechanics-analysis.md` |
| D10 Backlog and Evaluation | `implementation-backlog.csv`, `validation-gates.json`, `evalHarness.ts` |

## Final decisions

The recommended model is hybrid and deterministic-first. A d20 roll is used only for plausible, uncertain, high-stakes propositions. Leverage is conditional and exhaustible. Relationships use six disposition states plus trust, respect, fear, intimacy, familiarity, milestones, promises, boundaries, and knowledge. Talk routes receive an 80% XP floor relative to matched fight routes. Social crises target a thirty-turn cadence, and durable relationship milestones persist permanently by default.

## Validation

`validation-report.json` records **PASS** with no warnings. The package includes fifteen crisis patterns, thirty-six backlog tasks, five machine-readable gates, full JSON Schema validation, citation checks, and strict TypeScript type checking.
