# T11 — Unknowns and Evidence Requests

**Author:** Manus AI

## Evidence boundary

Only the post-28c research brief was supplied. The referenced worst-cell transcripts and prior engineering draft were not attached. The architecture decisions in this bundle do not depend on inventing their contents, but implementation mapping, baseline counts, and direct transcript citations remain incomplete until the artifacts below are provided.[1]

## P0 evidence requests

| ID | Evidence requested | Why it matters | Decision it can change | Owner candidate |
|---|---|---|---|---|
| EV-001 | LitRPG s18 full transcript, `turns.jsonl`, receipts, initial state, seed/action stream, replay hash, evaluator input/output | Confirms T9–T300 encounter loop and approximately 173 `the mark` events; identifies exact scrub rule and spawn/clear absence | Rule-id disablement, protected aliases, cap tuning; not the need for terminal authority | Eval/telemetry owner |
| EV-002 | DnD s69 full artifacts including STATUS source and Wraith/Aldous/Oskar state | Confirms flee/parley recurrence, `STATUS×110`, `nearby building`, and dialogue handoff | Status field allowlist, topic handoff mapping, DnD caps | Eval plus DnD content owner |
| EV-003 | RPG s137 full artifacts with pre/post scrub text and prompt leak samples | Distinguishes model pronoun use from scrub-generated `them` and identifies leak boundary | Pronoun resolver, firewall patterns, Cape topic edge mapping | RPG plus render pipeline owner |
| EV-004 | PYOA s188 full artifacts with all crisis receipts, branch ledger snapshots, inventory/item-use events | Shows why three crises did not lock and whether Millstone Charter action reached the ledger | Crisis group mapping, item-use transaction, escalation thresholds | PYOA owner |
| EV-005 | `score-boost-plan-post-28c-2026-08-27.md` | Required to decide whether the existing engineering draft is already sufficient | May reduce the work to explicit gaps rather than replace the plan | John / plan author |
| EV-006 | Current receipt schemas and examples for `encounterSpawn`, crisis, XP/level, quest stage, item use, and beat commits | Prevents parallel incompatible v1 event families | Exact field names, migration adapters, outbox placement | Platform/state owner |
| EV-007 | Current save schema and three representative 28c saves with active encounter/topic/crisis | Required for safe migration and rollback | Migration defaults and versioning | Persistence owner |
| EV-008 | Current BeatContract entries for Pact-Hunter, Keep Wraith, Cape leverage/feeds, Aldous/Oskar, Thornferry, and Millstone Charter | Ensures fallback/choice/terminal paths are registry-backed | Legal edges, outcome restrictions, branch ids | Content registry owner |

## Repository-mapping requests

| ID | Question | Required artifact | Output expected |
|---|---|---|---|
| RM-001 | Where is active encounter state currently written? | Symbol/call-site search for `activeEncounter`, combat receipt, encounter id | One authoritative owner path and mutation call graph |
| RM-002 | Where does ChoiceCompiler source and pad choices? | Compiler source plus family/registry definitions | Mapping from T4 family names to real ids |
| RM-003 | In what exact order do `typedEntityValidator`, GM generation, `proseWarden`, STATUS formatting, and fallback rendering run? | Pipeline trace with one turn example | Confirmed insertion points for T3/T5 |
| RM-004 | Is receipt persistence transactional or outbox-based? | Persistence implementation and retry behavior | Atomic terminal/branch write strategy |
| RM-005 | How does `npcTopicFsm` identify exhaustion today? | State enum, transition code, topic registry | Migration from exhausted to committed branch |
| RM-006 | How does `pyoaBranchLedger` encode mutually exclusive groups? | Schema and Thornferry record | One-lock/sibling-disable implementation mapping |
| RM-007 | Where are eval quarantine and replay hashes computed? | Harness source and normalized hash input definition | New gate placement and replay comparison contract |

## Tuning unknowns

The following values are supplied as initial 29a defaults, not established product facts.

| Parameter | Proposed initial value | Evidence needed for final tuning | Safety bound |
|---|---:|---|---|
| LitRPG max failed flee | 2 | s18 action sequence and other combat distributions | Cannot increase during active encounter |
| LitRPG max failed parley | 1 | Whether current LitRPG encounters register meaningful negotiation | Missing parley registry means option is absent |
| LitRPG max engaged turns | 8 | Natural combat-length distribution | Must remain well below T50 |
| DnD max failed flee | 2 | s69 Wraith sequence and encounter templates | Remove at cap |
| DnD max failed parley | 2 | Terms/disposition changes per attempt | Rephrasing with no delta consumes budget |
| DnD max engaged turns | 10 | Natural encounter distribution | Must remain well below T50 |
| PYOA Buy time / Call for help attempts | 2 each | s188 crisis clock/resource effects | Both exhausted forces fork/escalation |
| NPC topic substantive-turn budget | 4 | Cape and Aldous/Oskar topic graphs | Exhausted cannot remain player-loopable |
| Minimum encounter choices | Target 3, at least 2 consequence families | Registry coverage and UX tests | Never pad with forbidden family |

## Gemini cross-run bleed investigation

Cross-run bleed is flagged in the brief but not evidenced with raw artifacts.[1] Treat it as a contamination hypothesis requiring a formal check.

| Check | Evidence |
|---|---|
| Run isolation | Each transcript, receipt, entity registry, STATUS block, and evaluator input carries the same `runId`, seed, mode, runtime version, and registry version |
| Evaluator context isolation | Unique `evaluatorContextId` per judged transcript; no conversational carryover between seeds |
| Foreign entity detection | Every named entity in evaluator input resolves to the current run’s registry or is explicitly player-authored in that run |
| Receipt isolation | Receipt ids and predecessor hashes form one run-scoped chain |
| Prompt/control isolation | No prompt, campaign contract, or debug tag from another mode/run is present |
| Reproduction | Rerunning identical transcript in a fresh evaluator context tests whether judgment or comments change materially |

If a foreign artifact is found, the score is invalid and excluded from aggregate. The run is quarantined with hashes and artifact type. Do not “clean” the evaluator output and retain its score.

## Sufficiency test for the unavailable engineering draft

The referenced plan is sufficient only if it already contains all of the following:

| Required element | Minimum sufficient content |
|---|---|
| Encounter lifecycle | Four states, hard caps, deterministic resolver, monotonic terminal state |
| Authority | Code commits outcome/delta before GM narration |
| Receipts | Linked, idempotent `encounterSpawn` and `encounterCleared` |
| Choice integration | Forbidden encounter pads, attempt exhaustion, BeatContract legal edges |
| Topic/PYOA commitment | Exhausted-to-commit, terminal handoff, atomic crisis branch lock, item-use semantics |
| Text integrity | Protected entity roles, pre/post ordering, no generic substitution, STATUS structured projection |
| Harness | T50 resolution, T30 branch, T12 hook/T15 purgatory, replay and cross-run contamination |
| Delivery | Ranked owner surfaces, dependencies, test names, rollout and rollback |

Because the draft is absent, this research **cannot say it is sufficient**. If it meets the table above, the remaining gaps are limited to evidence ingestion, repository-path mapping, real event-shape adaptation, configured thresholds, and save migration.

## Non-blocking unknowns for 29b

Long-horizon memory design, narrative style scoring, multi-actor scene richness, broader portfolio sampling, and exact Gemini variance estimation are important but do not block 29a terminal authority. They should not be used to reopen the P0 architecture debate.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
