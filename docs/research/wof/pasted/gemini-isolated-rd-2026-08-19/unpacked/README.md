# WOF Research Register

This directory is the authoritative research record for **World of Fantasy**. It contains only WOF-owned concepts, test plans, observations, decisions, and archived rejections. It must not become a mirror of operational documentation, a deployment checklist, or a migration staging area.

> **Research rule:** A WOF finding may inform future independent ideation, but it must never be copied, merged, or wired into a live system from this directory.

| Area | Purpose | Required when |
| --- | --- | --- |
| [`ENGINE_BLUEPRINT.md`](ENGINE_BLUEPRINT.md) | Defines the isolated kernel, state model, and extension boundaries. | Changing a core event, invariant, schema, or module boundary. |
| [`LORE_BIBLE.md`](LORE_BIBLE.md) | Defines canon for the Tidelock Chronicle baseline. | Adding a region, faction, resonance rule, or progression assumption. |
| [`VISUAL_RND.md`](VISUAL_RND.md) | Defines aesthetic identity, prompt families, and experimental interface hypotheses. | Making art prompts, concept art, or UI mockups. |
| [`ROADMAP.md`](ROADMAP.md) | Defines phase gates and no-merge strategic review rules. | Beginning or closing a road map phase. |
| `decisions/` | Holds numbered design-decision records. | Selecting, reversing, or deferring a material design choice. |
| `playtests/` | Holds planned and completed test records. | Running any play, replay, usability, or stress experiment. |
| `discarded/` | Holds closed concepts and why they were retired. | Rejecting an idea after meaningful evaluation. |
| `templates/` | Holds reusable research-record structures. | Starting a new record. |

## Record lifecycle

Every material WOF idea follows a short, traceable lifecycle. It begins as a hypothesis with an explicit falsification condition. If it becomes a fixture or prototype, the corresponding playtest record names the artifact path, seed, and expected observation. A decision record then states whether to continue, revise, archive, or discard it. Rejected ideas are preserved as context in `discarded/` only when their rationale could prevent repeated work.

| Status | Meaning | Minimum evidence |
| --- | --- | --- |
| **Proposed** | A question is articulated but no artifact exists. | Hypothesis and expected signal. |
| **Active** | A WOF-local fixture, prompt set, or prototype is being tested. | Artifact path and test method. |
| **Concluded** | Evidence supports a decision for the experiment’s stated scope. | Results, limitations, and decision link. |
| **Archived** | The artifact remains useful only as historical reference. | Reason for archival and retrieval terms. |
| **Discarded** | The concept should not be resumed without a materially new hypothesis. | Failure mode and disconfirming evidence. |

## Naming convention

Use an ISO date, a two-digit sequence, and a short kebab-case subject. For example: `2026-08-19-01-oath-pressure.md`. Files must remain descriptive, locally referential, and free of claims that a WOF decision changes any external roadmap or production system.

```text
YYYY-MM-DD-NN-subject.md
```

## Baseline research questions

The initial WOF program tracks five questions. These are research questions, not commitments to ship a product.

| ID | Question | First measurement |
| --- | --- | --- |
| WOF-RQ-01 | Do immutable chronicle events make campaign consequences easier to explain? | Successful replay plus reviewer reconstruction of a state change. |
| WOF-RQ-02 | Do oaths and debt create more legible choice pressure than a single reputation value? | Player explanation of a trade-off before and after selection. |
| WOF-RQ-03 | Do Tidelock phases create urgency without making players feel arbitrarily blocked? | Route-choice satisfaction and perceived fairness notes. |
| WOF-RQ-04 | Do memories create continuity without requiring large character-sheet complexity? | Recalled event frequency and perceived relevance. |
| WOF-RQ-05 | Does the visual language distinguish WOF at first contact? | Blind comparison of silhouettes, palette, and UI hierarchy. |

The templates in this directory should be completed in prose and compact tables. Notes may link to WOF files by relative path, but they should never link to non-WOF source, save, schema, or deployment artifacts.
