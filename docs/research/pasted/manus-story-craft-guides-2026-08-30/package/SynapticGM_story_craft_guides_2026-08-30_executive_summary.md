# SynapticGM Story-Craft Guides — Executive Summary

**Author:** Manus AI  
**Date:** 2026-08-30  
**Scope:** `litrpg`, `dnd`, `rpg`, and `pyoa`; research and implementation guidance only

## Decision

SynapticGM does not need another mandate pile or LLM critic. It needs **one short craft discriminator per mode**, backed by deterministic state for the three failures prose alone cannot reliably remember: **PYOA branch/crisis state, inspection exhaustion, and NPC topic/tactic progression**.

> **Shared rule:** Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.

| Mode | Recommended AUTHORITY sentence |
|---|---|
| `litrpg` | Resolve the story beat first; then report only earned, ledger-backed System changes, and make repeat inspection yield a new fact, a brief reminder, or honest exhaustion—never the same essay. |
| `dnd` | Portray the changed situation, honor the declared action and fair ruling, let success stand with fiction-led consequences, share spotlight, then ask what the player does. |
| `rpg` | Advance one relationship through leverage, loyalty, or moral cost; change the NPC’s tactic, preserve the player’s interiority, and leave at least two socially distinct futures. |
| `pyoa` | Resolve the chosen fork, lock what it closed, change the page-local crisis, then offer 2–4 choices that lead to distinct futures—never four phrasings of the same delay. |

## What to Wire This Week

| Priority | Change | Acceptance signal |
|---:|---|---|
| P0 | Inject exactly one new sentence for each saved mode key. | Four total additions; no WOF or Mid-writer changes. |
| P0 | Persist PYOA branch locks and one crisis delta per active-crisis turn. | A closed route does not silently return; no unchanged Wait-Wait-Wait pad. |
| P0 | Give known inspections one of three dispositions: new supported fact, concise reminder, or honest exhaustion. | A second inspection never reproduces the original essay. |
| P0 | Persist each continuing NPC topic’s current goal, tactic, and threshold. | The NPC advances from explaining to bargaining, warning, exposing, conceding, or leaving. |
| P0 | Add a fixed 20–50-turn regression set using the twelve yes/no gates in the full guide. | Failures cite turn IDs and route to prompt, ledger, or evaluation ownership. |

## What Remains Research-Only

The full do/don’t lists, writing examples, branching terminology, source commentary, and ranked anti-patterns belong in human documentation and evaluation. `ChoiceCompiler`, existing clone detection, inventory/kit/presence authority, and quality-governance rails should remain authoritative for the facts they already own. Do not add a Continuity-Warden critic, enable the Mid writer, touch WOF, or duplicate the T1 constitution.

## Expected Ceiling

This is a design estimate rather than a measured benchmark. The four thin AUTHORITY sentences alone should improve mode separation but cannot guarantee memory of branch locks, exhausted inspections, or evolving NPC tactics; the likely craft ceiling is approximately **6–7/10**. Adding the three small ledger families raises the plausible ceiling to **8–9/10**, because the prompt defines the mode while code prevents the most common state regressions.

## Core Editorial Test

> If deleting the player’s last input would leave the reply substantially unchanged, reject the turn unless the player explicitly requested a recap or status-only response.

The validated full guide supplies all ten requested deliverables: four source inventories, four do/don’t constitutions with original examples, choice grammar, five-line turn shapes, anti-repetition craft, fifteen ranked anti-patterns, an eighty-rule thinning map, CSV and Markdown backlog, twelve transcript gates, and citations.
