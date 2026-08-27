# Maximization Opportunities and Blind Spots

## Highest-value addition

> **If only one additional P1 item can ship beyond the P0 board, ship a deterministic "meaningful state delta" contract.**

The engine should not merely interrupt a loop; it should guarantee that play produces a durable, causally related change within a bounded number of turns. After each turn, compare authoritative pre-turn and post-turn state. A meaningful delta is a change to at least one of: **quest stage, discovered information, location access, NPC relationship/status, threat state, resource/inventory state, or player condition**. If the session has produced no meaningful delta for a short window, the next response must commit an action-related consequence rather than offer another neutral description.

This is the largest bang-for-buck because it lifts multiple axes simultaneously: **pace, agency and consequence, quest progression, option quality, long-session durability, and keep-playing propensity**. It also closes the central gap in the existing board: hard interrupts and ambushes can change the scene without changing the campaign.

### Minimal acceptance contract

| Requirement | Practical rule | Failure prevented |
|---|---|---|
| Bounded progress | At least one meaningful state delta every **3–5 turns** during an active objective, excluding deliberate recovery scenes. | Endless examination, travel ping-pong, and consequence-free talk. |
| Causal linkage | The delta must be attributable to the player's action, an already telegraphed threat, or an established NPC agenda. | Arbitrary "GM punishment" and incoherent crisis spawning. |
| Persistence | The delta is written to the authoritative ledger before prose is rendered. | Events that occur in narration but vanish on the next turn. |
| Visibility | Narration and STATUS explicitly expose the changed state without dumping internal implementation detail. | Progress that technically occurs but is imperceptible to the player. |
| Closure | A completed objective produces a reward, cost, unlock, relationship change, or new objective. | Quests that advance numerically but never pay off. |

## Low-cost, high-impact additions

| Priority | Addition | Estimated effort | Expected score impact | Implementation note |
|---:|---|---|---|---|
| 1 | **Meaningful state delta contract** | Low–medium | Very high | Enforce with ledger diffs in the orchestration layer; do not rely on the prose model to self-report progress. |
| 2 | **Semantic recent-window loop detector** | Low–medium | High | Canonicalize intent as action type + target + purpose and detect repetition over the last 8–12 turns; exact streak telemetry is insufficient. |
| 3 | **Option-set diversity contract** | Low | High | Require distinct action–target–consequence profiles. A useful default is one objective-forward option, one risky/high-upside option, one social/world option, and one disengage/reposition option when legal. |
| 4 | **Root-cause entity validator** | Medium | High | Validate references against typed scene entities, regenerate once, then use an explicit noun fallback. Do not merely delete `them`, `this place`, or `the stranger`. |
| 5 | **One-time discovery and XP ledger** | Low | High | Record inspection rewards by scene/object/fact. Repeated inspection gives clarification but zero XP unless world state changed. |
| 6 | **Encounter resolution contract** | Medium | High | Every spawned threat needs stakes, legal player responses, success/failure resolution, resource or relationship effects, and aftermath. |
| 7 | **Quest completion schema** | Low–medium | High | Define entry condition, active obstacle, progress signal, terminal success/failure, reward/cost, and follow-on hook for every quest. |
| 8 | **Meta-input recovery route** | Low | Medium-high | On complaints such as "none of these are valid," re-ground the scene, acknowledge the mismatch briefly, and regenerate options from authoritative state. |
| 9 | **Narrative novelty budget** | Low | Medium | Track recent sentence/beat fingerprints and ban repeated exposition, not just repeated option strings. |
| 10 | **Clean-run evaluation manifest** | Low | High for decision quality | Bind every score and quote to mode, run ID, agent, seed, turn range, build hash, and transcript checksum to prevent cross-run contamination. |

## Fix specifications that prevent superficial implementation

### Mush scrub

A hard phrase filter will improve the visible hit count but can create ungrammatical sentences or conceal deeper identity errors. The robust sequence is: **typed entity selection → reference validation → one regeneration attempt → explicit noun fallback → telemetry flag**. Track invalid references per 100 turns, unresolved pronouns, and regeneration rate; do not measure success only by banned-string counts.

### Hard interrupt and threat decay

Do not define repeated action solely as five identical strings. Normalize intent across paraphrases and count scene-level non-progress. The interrupt should be chosen from a context-sensitive escalation ladder: warning, time/resource cost, NPC/world response, complication, crisis, then combat when appropriate. An automatic ambush on every loop would be predictable, punitive, and genre-inappropriate.

### Pad deduplication

Dedupe should operate on **semantic role**, not only wording. "Leave," "walk away," "go elsewhere," and "take another road" are the same option family. More importantly, replacement options must be grounded in legal scene entities and must predict different likely consequences; otherwise the system will generate cosmetically different copies.

### Voice rails

Measure whether blind evaluators can identify the intended voice above chance across ordinary turns, not only STATUS blocks. Limit signature phrases, allow solemn scenes to suppress jokes, and test for consistency over 50+ turns. Voice should modify diction, compression, and attitude—not overwrite factual grounding or scene emotion.

## Blind spots that can preserve 1–2/10 scores

| Blind spot | Why a human player will notice | Severity after current P0/P1 | Required mitigation/test |
|---|---|---|---|
| **Encounter spawn without playable resolution** | "Combat happened" is meaningless if choices, rolls, danger, loss, and aftermath are absent. | Critical | Run scripted encounter tests through initiation, three decision points, resolution, resource change, and aftermath. |
| **Interruption without progress** | An ambush can break a loop yet return the player to the same unchanged hub and quest. | Critical | Enforce the meaningful state delta contract and verify persistence five turns later. |
| **Semantic loops that evade exact matching** | Rephrased travel, inspect, and NPC options still feel identical. | Critical | Use canonical intent and recent-window similarity; report both exposure frequency and selected-action patterns. |
| **Branch reconvergence in PYOA** | Choices feel fake when every path rejoins the same scene with no retained cost or unlock. | Critical | Track branch-specific facts, locks, resources, and delayed payoffs; test paired divergent replays. |
| **Mode-specific fantasy remains missing** | DnD needs transparent challenge/roll/consequence; Story RPG needs character and relationship change; PYOA needs irreversible branching. | Critical | Add separate mode acceptance suites rather than judging all modes by shared anti-loop metrics. |
| **Static NPC and relationship memory** | Repeated introductions, forgotten promises, and emotional resets immediately break immersion. | High | Maintain authoritative NPC goals, knowledge, disposition, commitments, and last interaction summaries. |
| **Quest start without quest closure** | Progress counters do not compensate for objectives that never resolve or pay off. | High | Require completion/failure states and test full objective arcs, not isolated turns. |
| **Spatial and scene continuity errors** | Players notice impossible presence, teleporting entities, doors that relock, and exits that change. | High | Validate every option and narrated action against location graph, exits, scene roster, and object ownership. |
| **Action–outcome mismatch** | The player chooses negotiation but receives travel or combat, making agency feel fake. | High | Store the chosen intent and assert that the next outcome addresses its verb, target, and purpose before adding complications. |
| **Punitive or arbitrary anti-loop behavior** | Forced combat after harmless reflection feels like the GM attacking the player for using the interface. | High | Escalate proportionally, telegraph pressure, preserve an opt-out, and tie consequences to established world causes. |
| **No real failure economy** | If danger cannot consume health, resources, relationships, time, access, or objectives, stakes remain cosmetic. | High | Define reversible setbacks, irreversible losses, recovery paths, and difficulty bounds. |
| **Inventory lock without ownership/state semantics** | A ledger can prevent invented items while still mishandling equipped, consumed, dropped, loaned, or quest-bound items. | Medium-high | Model item state transitions and provenance, then assert conservation across turns. |
| **Over-aggressive mush filtering** | Deleting suspect words can produce broken grammar or replace a wrong actor with a confident but incorrect noun. | Medium-high | Validate identity against state and audit false substitutions, not only residual phrase hits. |
| **Voice becomes a repetitive gimmick** | Catchphrase-heavy wit or quartermaster jargon becomes another form of paragraph cloning. | Medium | Apply lexical cooldowns and tone suppression for grief, danger, and revelation scenes. |
| **Evaluation contamination and weak metrics** | Invalid turn citations and mislabeled runs can direct engineering effort to defects that did not occur. | High for prioritization | Produce immutable run manifests and require every qualitative citation to resolve to a real turn. |
| **No satisfying endpoint** | A session can avoid loops yet still feel endless if objectives never culminate in payoff or a clear next chapter. | High | Measure completed arcs per 50/100 turns and require consequence summaries at chapter boundaries. |

## Recommended release gates

A build should not be called "4–6/10 playable" because banned phrases disappeared or because at least one combat spawned. The following release gates are more defensible:

| Gate | Suggested threshold for a 300-turn automated run |
|---|---|
| Rendering integrity | Zero unresolved placeholder phrases; fewer than 1 invalid entity reference per 100 turns after manual verification. |
| Loop control | No semantic intent family occupies more than 25% of offered options in a 50-turn window; no non-progress window longer than 5 turns during an active objective. |
| Progress | At least one durable meaningful state delta every 3–5 active turns and at least one completed or failed objective arc within 50 turns. |
| Danger | At least one fully resolved high-stakes encounter or equivalent non-combat crisis within the configured pacing window. |
| Reward integrity | Zero repeat XP for unchanged inspection state; rewards correspond to first discovery, risk, quest progress, or resolution. |
| State consistency | No invented scene participants; no inventory conservation violation; no impossible location transition. |
| Voice | Intended personality identifiable by blind review in a majority of sampled ordinary turns without relying on headers or STATUS text. |
| Evaluation hygiene | Every citation maps to an existing turn and the correct mode/run/build; no cross-genre artifact leakage. |

These thresholds should be tuned after clean baseline runs, but the principle is essential: evaluate **causal play quality**, not only surface defect counts.
