## 0. Executive — top 15 outsider/hybrid ideas ranked by Impact × Fit for SynapticGM

| Rank | Outsider / hybrid mechanism | Impact × fit | Why it beats “more summary” |
|---:|---|---:|---|
| 1 | **Expected-revision append** | P0 | A turn may commit only against the ledger revision it planned from; concurrent retry/sync work cannot silently overwrite newer truth. |
| 2 | **Projection rebuild contract** | P0 | Scene, relationship, quest, and HUD views are disposable projections with an offset/hash, so any inconsistency can be rebuilt from events. |
| 3 | **Provenance derivation DAG** | P0 | Each asserted fact records observation, speaker, rules result, inference, or player correction; “why?” and “what breaks if changed?” become queries. |
| 4 | **Contradiction quarantine** | P0 | Preserve competing claims and scope/witness rather than silently choosing one; only an explicit event, correction, or revealed deception resolves them. |
| 5 | **Continuity control accounts** | P0 | Reconcile conservation-style invariants—one item owner, one actor location, opened/closed obligations, known/unknown secrets—after every commit. |
| 6 | **Speculative branch journal** | P0 | A retry/swipe is a provisional take; it cannot create damage, loot, NPCs, or facts until the player accepts it. |
| 7 | **Evidence packets with epistemic class** | P1 | Rumor, witness claim, direct observation, code result, and narrator inference remain different objects; the world does not treat all prose as equally true. |
| 8 | **Continuity Pager** | P1 | Page structured episode slices into a fixed working set via deterministic faults/prefetch; raw history remains archived instead of bloating the active turn. |
| 9 | **Forward/backward continuity queries** | P1 | Each scene checks prerequisites from the past and payoff ownership in the future; introduced promises, injuries, clues, and props cannot simply vanish. |
| 10 | **Identity-resolution hold queue** | P1 | Similar names/titles/aliases are not auto-merged; a high-impact ambiguity is held for adjudication or an in-world clarification. |
| 11 | **Anchor events** | P1 | Player-pinned exact moments point to canonical event IDs and source spans rather than a mutable paraphrase. |
| 12 | **Residency/protection budget ledger** | P1 | The system logs why a fact was resident, retrieved, compacted, excluded, or protected; omissions are explainable and correctable. |
| 13 | **Validated GM playbook** | P1 | Reusable procedural tactics are versioned only after ledger-verified successful outcomes; failed strategies deprecate instead of becoming hidden habits. |
| 14 | **End-of-scene consolidation candidates** | P2 | Async work produces aliases, evidence indexes, and contradiction reports behind a commit barrier; it never mutates current truth during play. |
| 15 | **Continuity release / take labels** | P2 | Scene snapshots carry a semantic release ID and alternate-take status, allowing safe replay, retcon, branch, and export without transcript confusion. |

> **Core adaptation:** use outside systems to sharpen *causality, provenance, concurrency, uncertainty, and verification*. They do not replace SynapticGM’s authority order, SceneManifest, StateTx, IntentContract, IntroductionPermit, CampaignContract, claim gate, leak scanner, or beatFingerprint; those are the substrate.

## 1. Non-game long-memory dossiers

| Source domain | Pattern | Evidence quality | What it solves | SynapticGM adaptation | Do not copy |
|---|---|---|---|---|---|
| Event sourcing | Append immutable domain events; replay projects from a stream. | Official architecture practice. [1] [2] | Current state can be rebuilt and historical cause is preserved. | Add a canonical turn envelope with `expectedRevision`, accepted effects, source intent, and deterministic event IDs below StateTx. | Event-source every line of prose or call external providers during replay. |
| Accounting | Prime records, subledgers, control accounts, reconciliation, compensation. | Official operational practice. [3] | Detects imbalance between detailed entries and whole-system view. | Reconcile unique ownership, location occupancy, quest obligation lifecycle, resource totals, and payoff debt after commits. | Pretend every emotional fact has a debit/credit or equate balance with truth. |
| Version control | Branch, merge base, protected checks, stale review invalidation, revert. | Official engineering practice. [4] [5] | Retries, retcons, and alternate endings remain isolated and reviewable. | Canonical/proposed/what-if branch heads; re-run validation if ledger head changes; merge only typed compatible facts. | Force-push/squash player history or merge two incompatible story worlds automatically. |
| Code review / CI | Change-set validation at exact revision; required tests; fail logs. | Widely used practice. | A plausible change is not promoted merely because it reads well. | Treat candidate state effects as a change-set; run claim, gate, replay, invariant, leak, and obligation tests before promotion. | Make every player wait for a verbose technical approval screen. |
| Legal case file | Custody chain, evidence class, competing interpretations, disposition phase. | Official/standards practice. [6] [7] | Separates observed fact from testimony/inference and retains alternative accounts. | `EvidencePacket` records source span, witness, scope, admissibility, counterclaim, derivation, and lifecycle. | Legal bureaucracy or persistent storage of every raw read. |
| Records provenance | Typed entities, activities, agents, derivation, revision, invalidation. | W3C standard. [8] | Explains why a fact exists and what depends on it. | Provenance DAG on high-impact canon/quest/relationship facts; query support and dependency before correction. | A universal graph for every decorative sentence. |
| CRM/case management | Time-bounded relationships, interaction history, goals, outcomes, handoffs. | Established practice; domain transfer. | Stops NPC relationship and customer-like thread state from becoming one timeless adjective. | Store relationship episodes/intervals, public/private visibility, debt, knowledge, next action, and resolution. | Profile people as permanent psychological labels. |
| Longitudinal record linkage | Candidate matching, confidence, collision handling, clerical review. | Academic/operational practice. [9] | Prevents similar title/name records from becoming one entity. | Alias candidate set with `same_as` confidence; block high-impact auto-join. | Merge by embedding/name alone. |
| PKM / Zettelkasten | Atomic notes, explicit titles, typed links, structure notes. | Community practice; useful heuristic. [10] | A campaign memory is not a giant blob; it has claim-sized pieces and hubs. | `MemoryCard` plus typed support/contradict/foreshadow/depend edges and auto-generated quest/location hubs. | Flat tag soup, link density as truth, or pasting cards into prose. |
| Wikis / citation grades | Claim citation, revision history, citation-needed, scoped uncertainty. | Mature public practice. | Marks a fact as established, disputed, rumor, or missing support. | Add `support_grade: direct|derived|rumor|unverified`; high-impact claim gate needs direct/derived source. | Treat frequency of edits or popularity as evidence. |
| Screen continuity supervision | Breakdown sheets, props/wardrobe/day/time/entrance tracking, take identity, progress reports. | Industry practice. [11] | Scenes created out of order stay coherent. | Add a scene breakdown before generation and accepted-take record after turn; compare planned vs actual entry/exit/prop/time state. | Manual paperwork exposed to players. |
| Customer support systems | Durable account state, ticket status, SLA, escalation, exact prior resolution. | Established practice. | Prevents unresolved player correction or complaint from disappearing. | Player correction becomes a compact issue with status: proposed, applied, needs clarification, rejected-with-reason. | Treat player feedback as canon automatically. |
| Human cue-dependent recall | Cue→retrieval, rehearsal of high-value facts, context-bound recall. | Cognitive concept; software fit is hypothesis. | Supports better retrieval cues without treating relevance as truth. | Entity/action/place/time cues and “rehearsal” increase retrieval rank only; never decay state. | Pop-psych retention scores or an Ebbinghaus curve for canon. |
| Tamper-evident logs | Hash chain, verification, external digest. | Official systems practice. [12] | Detects missing/reordered/altered audit records. | Hash accepted event envelopes and checkpoint roots for support/admin integrity. | Blockchain as a feature or hash as semantic validation. |
| Release engineering | Schema version, migration, manifest, rollback, compatibility tests. | Widely used practice. | A revised memory schema does not silently reinterpret old campaigns. | `schemaVersion`, `projectionVersion`, migration tests, read-old/write-new policy. | Migration that rewrites player history without version record. |

### New mechanisms worth taking from these dossiers

1. **Expected revision is a turn-integrity lock.** The writer plans from revision 812; if an accepted correction advances the campaign to 813, a pending candidate can only be discarded/replanned, never applied over it.
2. **Control accounts add system-wide checks not provided by individual claim grounding.** For example, `item_ownership[itemId]` must have exactly zero/one current owner except where `shared` is explicit; `presence[entityId]` must resolve to one place/absent/travel state.
3. **Compensation is cleaner than delete.** “The poison was an illusion” creates a new event that invalidates its effect from a defined point; it does not hide what the party believed when they acted.
4. **Case phase gates prevent abandonment.** A mystery/quest case can be `intake → active → waiting_on_player → resolution → archived`; each transition has due evidence/obligation rules.
5. **Take identity isolates noncanonical prose.** A regenerate produces `take: proposed`; only a player-accepted take can create a canonical event envelope.

## 2. Character-chat / companion memory dossier

### What works

| Character-chat pattern | Long-range value | SynapticGM translation |
|---|---|---|
| Pinned / Story Memory | Lets the user protect a high-salience moment from ordinary context eviction. | **AnchorEvent:** immutable reference to event ID + quoted evidence span + player-selected reason; not a new authority tier above correction/canon/ledger. |
| Editable extracted facts | Gives users a way to repair a misremembered trait. | **Player correction UI:** edit a concrete field/claim, choose campaign/branch scope, create superseding StateTx and stale dependent records. |
| Persona / character / side-character tabs | Scopes facts to the relevant owner and limits contamination. | **Owner namespaces:** player/NPC/faction/place/quest/branch; persona card is not a campaign ledger. |
| Memory usage view | Shows why history was lost and which records are protected. | **Expert residency ledger:** hard floors, included/excluded cards, token cost, retrieval reason, stale state. |
| Lorebooks / World Info | Compact conditional reference by key/regex/scope. | **Continuity lexicon:** aliases and predicates help page in evidence, but StateTx/manifest bypass keyword dependence. |
| Swipe/retry culture | Lets users seek a different narration. | **Speculative branch journal:** retries cannot mutate campaign state until accepted. |
| Long-term companion retrieval | Retrieves distant shared events for warmth/callbacks. | **Evidence playback:** a dated, source-linked callback can enrich a scene after deterministic truth loads. |

### What fails at long range

| Failure | Why it happens | SynapticGM response |
|---|---|---|
| Pin pile becomes a second ungoverned prompt. | Users protect too much, pins conflict, context silently fills. | Protection quotas by class; pin must reference existing fact/event; reveal conflict and retention cost. |
| Auto-facts misattribute trait or speaker. | Extraction turns conversational phrasing into permanent fact. | Facts require evidence span/owner/scope and are `proposed` until claim validation or player confirmation. |
| Keyword lore misses paraphrase or triggers on incidental mentions. | Retrieval is lexical and context depth limited. | Use entity IDs and scene predicates first; lexical/semantic retrieval supports evidence only. |
| Starting a fresh chat carries stale history. | Copy-forward is a blunt operation. | Branch/campaign scope and explicit `copyPolicy`; clean campaign start has a new Contract, not inherited pins. |
| Repeated swipes pollute history or duplicate consequences. | Multiple drafts are treated as turns. | Only accepted take commits; rejected takes retain bounded debug trace only. |
| Memory decay deletes decisive old fact. | Importance/recency are applied to truth. | Decay retrieval rank of flavor only; contracts, StateTx, anchors, injuries, debts, and revealed facts do not decay. |
| User edits without provenance. | A correction overwrites history and breaks causal explanation. | Supersession record carries actor, reason, scope, and dependent-record revalidation. |

### Steal list

1. User-controlled protection, but every protected item is an event/field reference with scope and source.
2. Memory usage visibility, but in plain narrative terms in Simple mode and full residency accounting in Expert.
3. Entity-scoped fact tabs, but map them to real campaign aggregates and actor knowledge rather than free text persona blobs.
4. Exact event anchoring, but preserve it as evidence rather than stuffing raw messages into every turn.
5. Dynamic retention priority, but only for supporting recollection and flavor.
6. Branch-aware retry, never generation-as-history.
7. Typed fact lifecycle: proposed → confirmed → superseded/invalidated → archived.

### Never-copy list

1. Persona card ≠ campaign ledger. A persona is a voice/identity artifact; it cannot adjudicate room roster, injury, item owner, or quest completion.
2. User-editable memory ≈ player correction UI, not a broad editable lore prompt that lets any old paraphrase become truth.
3. Do not make player repair a normal long-campaign continuity failure by hand-editing summaries.
4. Do not use flat pins, keyword-only memory, user-visible token micromanagement, or humanlike attachment/dating strategy as a substitute for campaign mechanics.
5. Do not transfer companion memory across campaigns without explicit scope, consent, and contract compatibility.

## 3. Research & practitioner pattern catalog

| # | Technique | Evidence | Fit | SynapticGM landing layer | Surgical implementation |
|---:|---|---|---:|---|---|
| 1 | Event sourcing / replay | Official systems practice. [1] | L | campaignMemory | Canonical event envelope and deterministic projections. |
| 2 | Optimistic concurrency | Official systems practice. [1] | L | campaignMemory / cloud sync | `expectedRevision` append and replan on conflict. |
| 3 | Checkpoint/snapshot plus suffix replay | Official systems practice. [2] | L | sceneFacts / campaignMemory | Snapshot offset/hash/version; rebuild any projection. |
| 4 | Compensation events | Established systems practice. | L | claimGrounding | Correction/retcon as append-only compensating event. |
| 5 | Control-account reconciliation | Accounting practice. [3] | L | campaignMemory | Conservation rules for ownership, presence, obligations. |
| 6 | Hash-linked audit envelopes | Official/industry practice. [12] | M | campaignMemory | Integrity proof for accepted records and support exports. |
| 7 | W3C-style provenance DAG | Standards practice. [8] | L | claimGrounding | Typed derivation/support/invalidation edges. |
| 8 | Evidence packet + counterclaim | Legal/case practice. [6] | L | campaignMemory | Rumor/observation/inference separated with scope. |
| 9 | Ambiguous record-link review | Research/operations. [9] | M | intentParser / entity registry | Hold ambiguous alias joins; seek clarification if scene-critical. |
| 10 | Atomic linked memory cards | PKM practice. [10] | M | campaignMemory | Claim-sized cards/hubs; not another summary blob. |
| 11 | Citation grade / citation-needed | Wiki practice. | L | claimGrounding | `supportGrade` gates high-impact assertions. |
| 12 | Scene breakdown / continuity sheet | Film practice. [11] | L | sceneFacts | Before/after scene requirements; alternate take identity. |
| 13 | Backward / forward continuity queries | Screenwriting/system design transfer. | L | questPlay / campaignMemory | Prerequisite/payoff/orphan graph checks. |
| 14 | Memory tiering / virtual paging | MemGPT paper. [13] | M | systemPrompt / campaignMemory | Typed working set and query-only archives. |
| 15 | Interrupt-driven memory fault | MemGPT paper. [13] | M | systemPrompt / wardens | Bounded fact lookup before candidate completion. |
| 16 | Page residency and fault budget | OS/agent practice. [13] [14] | M | systemPrompt | Deterministic max retrieval/page operations per turn. |
| 17 | Async consolidation with barrier | Agent practice. [15] | M | campaignMemory | Candidate index/alias work after scene; no direct truth write. |
| 18 | Memory stream + importance/retrieval/reflection | Generative Agents paper. [16] | M | evidence index | Importance influences supporting recall only; reflection is candidate hypothesis. |
| 19 | Episodic / semantic / procedural split | Cognitive/agent architecture. | L | campaignMemory / GM playbook | Events, world laws, validated resolution procedures separate. |
| 20 | Entity-centric graph memory | Research/practice. [17] | L | campaignMemory | Typed edges and causal neighborhoods around scene entities. |
| 21 | Procedural memory build–retrieve–update | Mem^p preprint. [18] | M | wardens / GM playbook | Promote tested GM tactics; version/deprecate. |
| 22 | Significance + time decay | MemoryBank paper. [19] | M | evidence index | Decay flavor retrieval priority; preserve truth and anchors. |
| 23 | Critique / constitutional checks | Agent practice. | M | wardens | Candidate critique emits structured failure reasons, not free-form self-correction. |
| 24 | Memory as CRUD | Practitioner pattern. | L | campaignMemory | Explicit create/read/update-by-supersession/delete-by-tombstone APIs. |
| 25 | Memory as tests | Software practice. | L | evaluation harness | Invariants, replay tests, adversarial claims, differential regression. |
| 26 | Retrieval learning/reranking | Research; model-specific. [20] | S | evidence index | Later: learn rank only after deterministic authority filters. |
| 27 | Graph-based global synthesis | GraphRAG research. [17] | S | arc recap | Later: campaign-wide question answering, not runtime truth. |

**Research conclusion.** The strong pattern is not “remember more.” It is **separate write authority from retrieval, give each record a lifecycle and provenance, rebuild projections, and test continuity as an invariant.** Generative Agents and companion-memory research validate useful reflection/tiering/retrieval patterns, but both warn implicitly or explicitly through failure modes that retrieval can miss relevant facts and fabricated elaboration can leak into derived memory. [16] [19]

## 4. Unified “borrowed stack” for SynapticGM

| Borrowed component beyond known P0s | Mechanism | Module verdict | Landing area | Player feels X because system did Y |
|---|---|---|---|---|
| Continuity Ledger Kernel | Event envelope + expected revision + projection offset/hash + compensation. | **HARDEN** | campaignMemory | “My correction did not erase the past; it changed the world cleanly from here.” |
| Continuity Control Accounts | Validate item ownership, actor presence, quest open/close counts, resource totals, and knowledge exposure after each commit. | **NEW FILE** | `continuityReconcile.ts` | “The map, HUD, and prose all agree because an impossible state cannot settle.” |
| Provenance / Evidence DAG | Typed supports, derivations, invalidations, counterclaims, witnesses, source spans. | **EXTEND** | claimGrounding + campaignMemory | “When the GM mentions an old clue, it knows who said it and whether I actually heard it.” |
| Contradiction Quarantine | Store conflicting scoped observations; raise reconciliation task rather than overwrite. | **NEW FILE** | `contradictionQueue.ts` | “A rumor can be wrong without the game pretending both versions are true.” |
| Identity Resolution Guard | Alias candidates/merge confidence/high-impact review threshold. | **HARDEN** | intentParser + openingEstablishment | “Two people with similar names do not collapse into one NPC.” |
| Scene Breakdown / Take Registry | Pre-turn backward requirements and post-turn accepted-take comparison. | **EXTEND** | sceneFacts + wardens | “Every entrance, prop, injury, and exit remains continuous across rewrites.” |
| Continuity Pager | Typed episode pages, page table, deterministic fault/prefetch budget, provenance-carrying retrieval. | **NEW FILE** | `continuityPager.ts` + systemPrompt | “The GM recalls relevant past scenes without drowning out this room.” |
| Anchor Event Store | Player-protected exact event references, scope/protection class/retention reason. | **EXTEND** | pins + NewGameModal | “The moment I care about stays available without me pasting it every turn.” |
| Forward-payoff / Orphan Auditor | Finds unowned promises, props, injuries, clues, or obligations and assigns/flags payoff horizon. | **NEW FILE** | `continuityAudit.ts` + questPlay | “Threads return naturally because nothing important quietly disappears.” |
| Validated GM Playbook | Versioned procedural tactics promoted only from ledger-verified success; deprecated on contradictory result. | **NEW FILE** | `gmPlaybook.ts` + wardens | “The GM handles recurring rules fairly instead of relearning them every scene.” |
| Async Consolidation Barrier | Candidate aliases/indexes/recap links post-scene; validator must approve any durable write. | **HARDEN** | micro-summaries + campaignMemory | “Long campaigns get easier to revisit, but a background task cannot rewrite my truth.” |
| Continuity Release Labels | Schema/projection/replay manifest and branch/take identity on every checkpoint. | **EXTEND** | cloud save + campaignMemory | “A saved branch resumes exactly as it was, even after an update.” |

### Core algorithms

**1. Commit protocol.** `IntentContract` and current revision enter planning; resolver/candidate yields effects; claim/consent/leak/authority checks run; control accounts reconcile; append only if revision still matches; rebuild manifest/HUD projections; then spend capacity and save. A revision conflict forces replan. This is a code path, not a writer instruction.

**2. Retrieval protocol.** Start with manifest/contract/intent; derive entity, action, temporal, and obligation cues; prefetch a small typed causal neighborhood; use lexical/alias/time filters; rank remaining evidence by support grade, causal proximity, recency, salience, and novelty; quarantine conflicts; inject evidence with source ID and scope. Evidence cannot write state.

**3. Consolidation protocol.** On scene close, create candidate episode page, atomic evidence cards, aliases, new typed links, and orphan/payoff warnings. Validate against event hashes and current contracts. Commit only index/provenance records automatically; a state/quest/canon mutation requires normal StateTx path.

## 5. Player-facing memory UX borrowed from outside

### Simple mode: show confidence without spreadsheets

| Need | Simple UX | Behind the interface |
|---|---|---|
| Correct a fact | **“That’s not right”** → choose name, place, kit, who is here, quest, or other → write one plain correction. | Superseding StateTx, provenance link, dependency invalidation, branch scope. |
| Protect a moment | **“Keep this moment”** from a message, quest result, or discovery. | AnchorEvent points to event ID/evidence span; quota and conflict detection apply. |
| Know present truth | **“Here now”** card: place, people, visible exits, carried/used items, active danger. | SceneManifest projection with version/hash. |
| Know story direction | **“Threads”** card: chosen goal, promise, new consequence, and what changed. | CampaignContract/quest/case phase projection. |
| Challenge a claim | **“Why did that happen?”** shows short source-language: “because you gave the seal to Mara,” “because the bridge fell last night,” or “because you chose the north route.” | Provenance DAG selects safe player-visible support source. |
| Resume a campaign | **“Since you left”** is a short, verified return receipt. | Replay-backed deltas after last accepted checkpoint, not a free-form recap. |
| Handle uncertainty | **“You have heard two versions.”** offers observe, ask, investigate, or pin a suspicion. | Contradiction packet with witness/scope, no false canonical merge. |

The player feels **the campaign knows them** when the interface repeats an acknowledged choice as a current consequence. They should not see memory pages, embeddings, context budgets, hashes, or “retrieval” unless they choose Expert mode.

### Expert mode: inspect, correct, and export

| Expert surface | Show | Edit rule |
|---|---|---|
| Memory inspector | Resident contract/manifest, retrieved evidence, excluded entries, budget, source, scope, and protection class. | Evidence can be pin/unpin/annotated; truth edits route to correction flow. |
| Fact card | Current value, prior revisions, source event, support grade, witnesses, dependencies, branch, effective interval. | Player can propose a correction or retcon; no destructive overwrite. |
| Contradiction queue | Claim A vs claim B, source spans, witnesses, impact, recommended resolution choices. | Resolve as correction, unreliable witness, new evidence, revealed deception, or deliberate mystery. |
| Replay / checkpoint | Event range, projection hash, affected modules, branch/take labels. | Create what-if branch; canonical promotion needs explicit action. |
| Continuity audit | Orphan props/threads, unbalanced control account, stale projection, alias collision, missing payoff owner. | Mark false positive or assign owner/deadline. |
| Export | Canon, events, projections, evidence, branch map, and user-visible transcript separated. | Export is read-only; import runs schema/provenance validation. |

### Editing policy

Borrow the character-chat ability to edit memory, but not its broad free-text authority. **Pins are read-protection, not truth-promotion.** **Player correction is a transaction.** **Author canon edits are versioned releases.** **Evidence edits annotate the source or add a counterclaim; they do not rewrite observation.** This retains agency without turning the game into a spreadsheet or an unmanaged lorebook.

## 6. Anti-patterns

| Anti-pattern | Why it looks smart | Why it wrecks a ledger-first GM | Correct alternative |
|---|---|---|---|
| One giant live summary | Cheap, easy, apparently comprehensive. | Loses qualifier/provenance, creates a second truth, compounds error. | State/event truth + compact evidence cards/projections. |
| “Pinned everything” | User control feels safe. | Pin bag crowds out input and hides contradiction/staleness. | Anchors with class quotas, source ID, scope, and conflict display. |
| Vector similarity decides fact | Semantically flexible recall. | Negation, chronology, identity, and branch scope are weak; plausible wrong fact wins. | Authority/entity/time filter first; evidence only after. |
| Keyword-only lore | Deterministic and familiar. | Paraphrase misses and incidental mentions trigger wrong lore. | Entity/scene/obligation predicates with alias/lexical support. |
| Auto-extract every fact | Appears proactive. | Side comments, roleplay jokes, and false dialogue become permanent state. | Proposed evidence lifecycle plus validated transaction promotion. |
| LLM reflection writes canon | Elegant self-improvement narrative. | One bad retrieval self-reinforces into false history. | Reflection emits hypothesis/review item; validator decides. |
| Decay all memory | Mimics forgetting, saves space. | Removes debts, injuries, promises, and rare clues. | Decay flavor retrieval rank only; durable records remain. |
| Raw transcript dumping | “No information loss.” | Starves current scene/intent, increases repetition and privacy/cost. | Page episode slices with exact source links on demand. |
| Recursive recap of recaps | Scales cheaply. | Causal order and exact wording vanish through generational compression. | Reference source scene receipts and maintain hierarchy with provenance. |
| Delete bad history | Clean UI. | Destroys what the player knew/acted on and blocks explanation. | Compensation/supersession/tombstone with effective scope. |
| Automatic name merge | Removes duplicates. | Collapses two NPCs/factions and corrupts every relation. | Candidate links + high-impact review hold. |
| Snapshot as authority | Fast read path. | Stale manifest/HUD looks more real than event truth. | Snapshot stores offset/hash and is rebuildable. |
| Every read is forever logged | Great audit trail. | Privacy/storage noise and no player benefit. | Bounded audit sampling for sensitive/high-impact reads. |
| Blockchain theatre | “Immutable” marketing. | Does not prove semantic correctness and adds operational burden. | Internal hash chain and access/audit controls if integrity proof is needed. |
| Merge alternate endings automatically | Convenient replay UX. | Combines incompatible death, item, knowledge, and location states. | Preserve branches; typed merge or explicit canonicalization only. |
| Context score shown to all players | Transparency. | Makes story feel brittle/technical and teaches prompt gaming. | Simple player language; full inspector only in Expert. |

## 7. Evaluation borrowed from outside

### Continuity regression model

| Borrowed discipline | Test adaptation | Pass condition at 30 / 100 / 300 turns |
|---|---|---|
| IF regression testing | Script inputs and expected state/output assertions; run after model/prompt/schema changes. | Same canonical StateTx/projection result except approved stylistic variance. |
| Accounting reconciliation | Recompute control accounts from events and compare to materialized HUD/map/inventory/quest views. | Zero unexplained ownership, presence, resource, debt, or obligation imbalance. |
| Event-store replay | Rehydrate from checkpoint plus suffix and compare manifest/projection hashes. | Exact typed-state equivalence; permitted nondeterministic prose excluded. |
| Code-review change checks | Candidate effects validated at exact head revision; changed head invalidates prior approval. | No candidate commits across revision conflict. |
| Wiki citation checks | High-impact facts must have direct/derived support; missing support becomes citation-needed. | No unsourced roster, item, quest, relationship, place, or System claim. |
| Legal provenance audit | Trace a player-visible assertion back through derivation, witness, and source span. | 100% sampled assertions have valid, scope-compatible provenance. |
| Screen continuity check | Compare scene breakdown versus accepted take: cast, props, attire/condition, day/time, entry/exit, dialogue obligation. | No unapproved discontinuity in scripted scenes. |
| CRM case audit | Verify all active threads have owner/status/next action or intentional archive reason. | No orphaned critical promise beyond horizon. |
| Entity-resolution evaluation | Inject near-collision NPCs, aliases, titles, disguise, and mistaken identity. | No automatic high-impact false merge; uncertain cases surfaced/contained. |
| Agent reflection audit | Inspect async consolidation proposals against subsequent truth and contradiction rate. | Candidate writes never mutate truth; false proposal rate stays below defined review threshold. |

### Automated checks

1. **Ledger replay equivalence:** event log → clean projections equals stored projections at every checkpoint.
2. **Expected-revision race:** create correction/retry/sync collisions; only one valid append succeeds; other candidate replans.
3. **Control-account tests:** item unique owner, actor unique presence/travel state, container acyclicity, quest transition validity, debt creation/resolution balance, knowledge source requirement.
4. **Provenance path tests:** each durable claim has source event/actor/scope and no dependency cycle that hides a correction.
5. **Contradiction quarantine tests:** inject two valid but conflicting witness reports; output must preserve uncertainty or use an explicit resolution event.
6. **Page determinism:** same ledger head + same intent produces same resident memory set/order before writer sampling; retrieval budget remains bounded.
7. **Branch isolation:** rejected retry, alternate ending, and what-if StateTx never appear in canonical branch/HUD/evidence retrieval.
8. **Take promotion:** only accepted take grants reward/injury/quest/intro; rejected take retains no world mutation.
9. **Orphan/payoff audit:** all high-salience clue/injury/debt/promise cards have owner, horizon, and disposition.
10. **Leak/knowledge audit:** player-visible prose cannot cite GM-only evidence or actor knowledge absent from graph.

### Human playtest scripts

| Campaign length | Scenario | Human questions |
|---:|---|---|
| 30 turns | One opening identity, one check, one correction, one named object transfer, one rumor. | Did the campaign acknowledge the opening? Did correction visibly take hold? Were rumor and fact distinct? |
| 100 turns | Three locations, six recurring NPCs, two quests, one time skip, one retry, one branch, one relationship change. | Does return state feel caused? Were retries noncanonical until accepted? Could player answer where/with whom/what they carry? |
| 300 turns | Multi-arc campaign with map travel, dungeon, city, faction conflict, changed alias, retcon, long gap, and ending. | Does old truth remain findable? Do unresolved promises pay/close? Does evidence recall add texture without overturning state? |

Score four independent dimensions: **state accuracy, causal continuity, player-agency coverage, and explanation quality**. A high prose rating cannot compensate for a failed state/causality assertion.

## 8. 60-day spike plan

| Spike | Hypothesis | Build slice | Success metric | Kill criteria |
|---:|---|---|---|---|
| 1. Expected-revision commits | Race-safe turn acceptance prevents silent contradiction with low latency cost. | Add `expectedRevision` to StateTx append and forced replan flow. | 100% conflict safety in concurrency suite; p95 append impact <100ms. | More than 2% normal turns hit false conflicts or UX cannot explain retry. |
| 2. Projection rebuild | Manifest/HUD divergences can be automatically detected/rebuilt. | Checkpoint offset/hash plus scene/inventory/quest projection replay. | Zero mismatch in 100-turn replay fixture. | Rebuild exceeds operational budget or exposes schema debt requiring rewrite. |
| 3. Control accounts | Reconciliation catches errors existing claim gates miss. | Ownership/presence/quest/debt control account library. | Finds seeded faults with <5% false-positive rate. | Rules create noisy alarms developers ignore. |
| 4. Provenance DAG | Source-traced facts improve correction and “why” explanations. | High-impact fact edges only; UI trace prototype. | ≥90% sampled answers trace to valid source; five testers understand Simple explanation. | Graph capture adds unacceptable write latency/storage or no user value. |
| 5. Contradiction quarantine | Keeping scoped alternatives prevents false canon. | Contradiction record + player-visible rumor/uncertainty render. | All 20 conflicting-evidence tests avoid silent overwrite. | Too many ordinary ambiguities block play. |
| 6. Continuity Pager | Typed paging improves 100-turn recall without bloating context. | Episode page table, causal-neighborhood prefetch, fixed fault budget. | ≥20% reduction in irrelevant injected evidence; no decline in scene claim accuracy. | Page faults add >1s p95 or retrieval nondeterminism rises. |
| 7. Anchor + retry journal | Player pins and retries become safe, explainable operations. | AnchorEvent UI, proposed-take log, accept-only commit. | Zero duplicate consequences in 100 retry test; ≥80% tester comprehension. | Pin usage becomes conflict-heavy or UI distracts from play. |
| 8. Payoff/orphan auditor | Forward obligations reduce abandoned threads. | Graph scan at scene close and author debug output. | Detects ≥80% seeded orphan promises with ≤20% false positives. | It pressures writers into formulaic callbacks or adds too much work. |

## 9. Open questions for founder

| Question | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Should every accepted turn become an event envelope? | Yes for typed effects/intent/outcome; prose remains separately stored. | Envelope only consequential turns. | Full capture adds storage/schema work; partial capture leaves replay gaps. |
| How much provenance is worth retaining? | Full DAG for high-impact facts; compact source pointer for flavor. | Full provenance everywhere. | Too little blocks explanation; too much creates cost/privacy/noise. |
| When should ambiguity reach the player? | Ask only when it affects imminent action or a hard fact; otherwise quarantine internally. | Ask immediately for all ambiguity. | Too few asks feels arbitrary; too many breaks flow. |
| Should anchors affect retrieval priority forever? | Protect source existence; cap active retrieval priority and surface conflicts. | Permanent always-on pin. | Weak anchors feel ignored; permanent pins bloat working set. |
| Are what-if branches a launch feature? | Support internal speculative retry immediately; defer player-visible branch vault until core replay passes. | Full branch UI at launch. | Delay reduces replay appeal; early UI multiplies conflict/support scope. |
| Should control accounts include relationship values? | Start with discrete debt/trust threshold/knowledge/consent invariants, not nuanced emotion. | Quantify every relationship dimension. | Too narrow misses social bugs; too broad feels creepy/mechanical. |
| Does async consolidation run on every scene? | Run after meaningful scene closure with strict cost/budget; queue during load. | Every N turns. | Too frequent costs/creates churn; too rare harms retrieval. |
| How visible is Expert provenance? | Show source type, turn, change, scope, and stable explanation; keep raw chain behind developer export. | Full graph by default. | Too hidden reduces trust; too technical harms game feel. |
| Do we hash-chain user campaign logs? | Use internal hashes/checkpoint verification for support/export integrity; do not market it. | No hash chain. | Adds engineering without player value; absence makes tamper/debug diagnosis weaker. |
| How should GM playbook promotion work? | Start manual/curated promotion from passing regression fixtures, then cautiously automate candidate ranking. | Autonomous reflection promotion. | Manual slows scale; autonomous promotion fossilizes bad tactics. |

## References

[1]: https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing ; https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing-pattern.html "Event sourcing guidance"
[2]: https://martinfowler.com/eaaDev/EventSourcing.html "Event sourcing practice"
[3]: https://www.gov.uk/hmrc-internal-manuals/enquiry-manual/em2855 "Ledger and reconciliation practice"
[4]: https://git-scm.com/docs/git-merge ; https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History "Git branch and merge semantics"
[5]: https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches "Protected branches and checks"
[6]: https://www.nist.gov/forensic-science/interdisciplinary-topics/evidence-management ; https://csrc.nist.gov/glossary/term/chain_of_custody "Evidence management"
[7]: https://www.archives.gov/records-mgmt/policy/prod6b.html "Records audit guidance"
[8]: https://www.w3.org/TR/prov-dm/ ; https://www.w3.org/TR/prov-o/ "W3C provenance"
[9]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11636688/ "Longitudinal record linkage review"
[10]: https://zettelkasten.de/posts/field-report-4-what-i-learned-writing-thesis-with-zettelkasten/ "Zettelkasten field practice"
[11]: https://www.screenskills.com/job-profiles/browse/film-and-tv-drama/technical/script-supervisor-film-and-tv-drama/ "Script supervision"
[12]: https://learn.microsoft.com/en-us/sql/relational-databases/security/ledger/ledger-overview?view=sql-server-ver17 ; https://transparency.dev/ "Tamper-evident logs"
[13]: https://arxiv.org/abs/2310.08560 "MemGPT"
[14]: https://arxiv.org/abs/2403.16971 "AIOS"
[15]: https://www.letta.com/blog/agent-memory/ "Agent memory consolidation practice"
[16]: https://arxiv.org/abs/2304.03442 "Generative Agents"
[17]: https://arxiv.org/abs/2404.16130 "GraphRAG"
[18]: https://arxiv.org/html/2508.06433v2 "Mem^p procedural memory"
[19]: https://ojs.aaai.org/index.php/AAAI/article/view/29946 "MemoryBank"
[20]: https://aclanthology.org/2025.acl-long.1106/ "Long-horizon memory retrieval research"
