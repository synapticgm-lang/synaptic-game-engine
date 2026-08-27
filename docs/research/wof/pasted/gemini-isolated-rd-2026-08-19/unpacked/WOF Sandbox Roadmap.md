# WOF Sandbox Roadmap

**Status:** Baseline research plan  
**Scope:** WOF research artifacts only  
**Non-negotiable rule:** WOF never merges into, imports from, or writes into a live system.

## Roadmap intent

This roadmap structures WOF as an **isolated learning program**, not a shadow production branch. Each phase has a distinct question, finite artifacts, evidence gates, and a defined archive path. Progress occurs when WOF can answer its own research questions with credible local evidence; progress does not imply integration, deployment, migration, or compatibility work.

> **Strategic review means interpretation, not transfer.** A conclusion may describe an abstract design principle for future independent concepts, but no WOF implementation, content, data, save, prompt, schema, or pipeline may cross the sandbox boundary.

| Phase | Purpose | Primary output | Exit decision |
| --- | --- | --- | --- |
| 1. Research & Prototyping | Test narrow mechanics and content hypotheses. | Local fixtures, experiments, lore records, visual briefs. | Continue, revise, archive, or discard each experiment. |
| 2. Internal Stress Testing | Test the kernel’s limits without production coupling. | Replay suites, property-style scenarios, performance notes, UX test records. | Confirm bounded reliability or reduce scope. |
| 3. Strategic Review | Synthesize learning while preserving isolation. | Research synthesis and independent concept principles. | Archive WOF, continue isolated R&D, or begin a wholly separate ideation brief. |

## Phase 1: Research & Prototyping

Phase 1 turns hypotheses into compact WOF artifacts. Work remains small enough to understand in one sitting: one event family, one state surface, one regional tension, one UI information task, or one visual asset family per experiment. The goal is not completeness. The goal is to find which mechanisms create legible, emotionally consequential decisions.

| Workstream | Initial experiment | WOF-local artifacts | Evidence gate |
| --- | --- | --- | --- |
| Chronicle kernel | Replay a Tidelock advance, thread change, and resource cost. | `src/engine/reducer.ts`, fixture, test. | Deterministic replay; invalid states rejected. |
| Oath pressure | Compare a visible due-turn oath with a generic task prompt. | Fixture events, playtest record. | Participants can state the cost of deferral. |
| Faction debt | Evaluate esteem and debt as separate relation signals. | Accord events and scenario notes. | Participants distinguish permission from obligation. |
| Regional progression | Test Hushmere-to-Cinder-Spine access through a phase-gated route. | Lore package, route fixture. | Gate feels foreshadowed rather than arbitrary. |
| Visual language | Evaluate the Weathered Instrument against generic fantasy affordances. | Prompt outputs or mockups, visual test record. | Viewers identify map, risk, and consequence hierarchy. |
| Tide Cache | Test physical placement and consequence adjacency. | Static mockup or WOF prototype. | Viewers locate stable supplies, volatile discoveries, and open oath. |

### Phase 1 operating rhythm

Each experiment begins with a named research question and a falsification condition. The contributor creates or forks a disposable fixture, uses a deterministic seed if uncertainty is involved, runs a compact replay or review, completes a playtest record, and writes a decision. Concepts with unclear results remain proposed or active; they should not accumulate undocumented assumptions.

| Weekly checkpoint | Required review question | Artifact |
| --- | --- | --- |
| Scope | Is the experiment still testing one question? | Updated playtest scope. |
| State | Can a reviewer reconstruct each change from the chronicle? | Replay output and event list. |
| Isolation | Did every new artifact remain in the WOF namespace? | Passing isolation check. |
| Fiction | Does the outcome create a consequence rather than a cosmetic change? | Lore or scenario note. |
| Decision | Is there enough evidence to continue, revise, archive, or discard? | Decision record. |

### Phase 1 exit gate

Phase 1 is complete only when the kernel has at least three deterministic replay fixtures, the central state surfaces have one test each, the lore package covers a complete tier-1-to-tier-2 route, and visual/interface hypotheses have evidence records. A desirable result is not required; clear negative findings are valid outputs.

## Phase 2: Internal Stress Testing

Phase 2 tests whether the research kernel remains comprehensible under intentionally difficult but still local conditions. It does not introduce external services, shared schemas, user data, production deployment, or live persistence. The stress test is about failure boundaries: large chronicle histories, conflicting obligations, repeated route changes, schema evolution, unusual seeds, and crowded information states.

| Stress lens | Method | Failure signal | Corrective action |
| --- | --- | --- | --- |
| Replay determinism | Re-run identical fixture and event sequence across multiple local executions. | Final snapshots or chronicle orders differ. | Fix hidden mutation or unseeded randomness. |
| State integrity | Generate invalid event attempts and crossed references. | Invariants permit impossible routes, oaths, or negative resources. | Add a narrow invariant and a regression test. |
| Chronicle scale | Replay increasing event counts using local synthetic histories. | Reviewers cannot identify causal changes or runtime becomes disproportionate. | Add projections, summaries, or scope limits. |
| Narrative pressure | Run overlapping oath, faction debt, and thread scenarios. | Players cannot articulate a meaningful choice. | Reduce concurrent pressure or improve consequence previews. |
| UI density | Test route map, Tide Cache, and ledger under full state. | Critical timing or cost information is missed. | Reorder hierarchy; do not add decorative panels. |
| Schema change | Load versioned local fixtures against revised contracts. | Migration ambiguity or data loss inside WOF. | Write a WOF-only translator or freeze the experiment. |

### Phase 2 evidence standards

Stress-testing results must distinguish **technical validity** from **design validity**. A system may replay perfectly while producing an unreadable decision surface; conversely, a compelling scenario may expose a technical invariant gap. Records should name the observed layer and avoid treating either layer as proof of the other.

| Review dimension | Minimum record | Pass condition |
| --- | --- | --- |
| Technical | Command, fixture path, seed, expected and actual result. | Reproducible local outcome with no prohibited dependency. |
| Narrative | Scenario, observed interpretation, stated stakes. | Participants can explain what is at risk and why. |
| UX | Screen state, task, completion signal, hesitation point. | Information hierarchy supports the declared task. |
| Isolation | Artifact list and namespace check. | No code, data, or pipeline crosses WOF boundaries. |

### Phase 2 exit gate

Phase 2 is complete when the chronicle reducer passes its local replay suite, stress scenarios document explicit limits, and at least one failure has produced a narrow corrective decision or a documented scope reduction. The phase does not require an endlessly scalable engine; it requires a known and evidence-backed operating envelope.

## Phase 3: Strategic Review

Phase 3 is a documentation and governance phase. It asks what WOF learned, what remained uncertain, and whether the sandbox should continue as a research program. It explicitly forbids code transfer or implementation reuse. Any future work informed by WOF must begin from a **new, standalone concept brief** written without importing WOF assets, schemas, code, prompts, saves, or configuration.

| Review question | Required evidence | Valid conclusion form | Invalid conclusion form |
| --- | --- | --- | --- |
| What mechanics showed promise? | Linked playtest and decision records. | “Visible obligation improved trade-off explanation in this local scenario.” | “Move the WOF oath system into a live engine.” |
| What architecture was robust? | Replay, invariant, and stress records. | “Event logs supported local causal review under tested conditions.” | “Adopt WOF reducer code elsewhere.” |
| What visual patterns were distinct? | Blind tests or mockup findings. | “Weathered instrumentation helped viewers identify route risk.” | “Port WOF’s UI components or prompt library.” |
| What should stop? | Discard records and limits. | “Avoid more than two concurrent obligation clocks in future studies.” | “Delete evidence because the concept was not selected.” |
| Should WOF continue? | Remaining unanswered questions and resource rationale. | “Continue WOF isolation with a revised hypothesis.” | “Integrate WOF to justify continued investment.” |

### Phase 3 deliverables

The phase produces a synthesis document within `docs/research/wof/`, a current inventory of retained and retired artifacts, and a recommendation to continue, pause, or archive WOF as a self-contained program. If a separate concept brief is desired, it must state only abstract principles and create new material from scratch in its own independent namespace.

### Phase 3 exit gate

Strategic review is complete when findings are traceable to WOF evidence, limitations are plainly stated, retained artifacts have an owner and purpose, and the final review confirms that no transfer plan exists. The program may then be archived intact or scheduled for another isolated research cycle.

## Governance controls across all phases

| Control | Practice | Verification |
| --- | --- | --- |
| Namespace isolation | Write code and data only under `wof/`; write research records only under `docs/research/wof/`. | Run `pnpm run verify:isolation` from `wof/`. |
| No live coupling | Do not add shared imports, database migrations, deployment configuration, external saves, or production prompts. | Review changed files and dependency manifests. |
| Disposable experiments | Each experiment uses a local fixture, seed, and record. | Artifact can be removed without migration or cleanup outside WOF. |
| Evidence before canon | Lore, interface, and rules changes require a linked test or decision record. | Review record links before accepting a baseline. |
| Archive integrity | Rejected concepts retain a concise reason for rejection. | Use the discarded-concept template. |

The roadmap is deliberately conservative about scope and deliberately ambitious about learning. WOF succeeds when it can generate clear, original, reversible insights without imposing risk or maintenance burden beyond its own sandbox.
