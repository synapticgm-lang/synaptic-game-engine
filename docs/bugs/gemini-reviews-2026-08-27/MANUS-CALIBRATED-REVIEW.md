# SynapticGM: Calibrated Review of Gemini's Findings and Fix-Plan Uplift

**Author:** Manus AI  
**Purpose:** Separate real product failures from critic overreach, estimate honest P0/P1 score uplift, and identify the smallest additions needed to reach a credible **4–6/10 playable** range.

## Executive conclusion

Gemini's **core product diagnosis is directionally right**: the evaluated runs exhibit severe entity-reference corruption, no effective escalation, repeated low-value options, reward incentives that favor inspection over play, weak goal pressure, ignored recovery requests, and personality settings that are not perceptible in ordinary prose. Those failures are sufficient to make the reviewed sessions feel broken even without accepting Gemini's most dramatic counts.[1]

Gemini's **forensic reliability is poor**, however. The packet documents impossible turn citations, a mislabeled run, cross-genre memory bleed, zero-hit examples presented as frequent, and claims of 100+ consecutive loops that conflict with maximum exact-intent streaks of only two or three turns.[1] Engineering should therefore retain the validated root causes while rejecting Gemini's quoted frequencies and contaminated examples.

If the proposed P0/P1 work is implemented as **deterministic engine behavior**, not merely stronger prompting, the honest outcome is a move from **catastrophically broken to rough but playable**. Pace, options, voice, danger, durability, and retention should mostly reach **3–5/10**; visible mush can reach **6–7/10** if it is repaired through typed entity validation rather than string deletion. The present plan does **not** justify an across-the-board 6/10 because it does not yet guarantee meaningful state change, encounter resolution, quest closure, durable NPC memory, or genuine PYOA branch divergence.

> **Best single additional P1:** Add a deterministic **Forward-Progress Governor** that guarantees a persistent, causally justified state change within a bounded turn window. This provides more multi-axis uplift than another prompt rail, personality pass, or content bank.

---

# 1. Real Failures – Validated from Gemini and the Calibration Notes

- **P0 – Entity-reference corruption is a genuine experience-killer.** The packet reports high counts for `the stranger`, `them`, and `this place`, including especially heavy contamination in Story RPG and PYOA.[1] These are not harmless prose defects: they obscure who exists, what an option targets, what the player owns, and where an action occurs. This one defect depresses English polish, option quality, agency, continuity, presence, and trust simultaneously.

- **P0 – The GM has no effective escalation governor.** The supplied calibration confirms zero combat encounters across 300 turns in all three modes.[1] Combat need not occur constantly, and Story RPG can use non-combat stakes, but a system that permits hundreds of turns without danger, irreversible cost, crisis, or forced consequence is functionally passive.

- **P0 – Repetition is real, although Gemini measured it incorrectly.** Exact selected-intent streaks peak at only two or three turns, contradicting the claimed 100+ consecutive identical-action loops. Nevertheless, option exposure is pathologically repetitive: the packet reports roughly 256–347 Millstone Charter option hits in PYOA and about 255 Walk away hits in Story RPG.[1] This is a **semantic and distributional loop**, not necessarily a consecutive-input loop, and it still makes the world feel static.

- **P0 – The XP economy rewards anti-play.** Repeated five-XP inspection rewards make examining objects a rational farming strategy while combat, quest resolution, and meaningful risk are absent or under-rewarded.[1] This is not merely stingy progression; it is **misaligned progression**. The system teaches the agent to repeat the very behavior the critic condemns.

- **P0 – The interface lacks a deterministic recovery path.** Player or agent complaints about invalid choices reportedly fall through without re-grounding the scene or regenerating legal options.[1] A player who says "none of these options fit who is actually here" is providing high-value correction data. Ignoring it converts a recoverable generation error into a durable loop.

- **P1 – Quest and narrative pressure are too weak to form a spine.** The XP totals show some numeric movement, but low-level XP accumulation is not the same as quest progression, world change, or narrative payoff.[1] Gemini's wording of "zero progression" is too absolute if interpreted numerically, but it is fair if interpreted as **no meaningful objective arc completed**.

- **P1 – Requested voices are not perceptible enough to count as successful features.** The packet states that Dry Wit, Friendly Guide, and Army Quartermaster are wired but weak in the delivered prose.[1] Technically present and experientially absent can both be true. The correct defect label is **weak or non-audible cadence**, not missing implementation.

- **P1 – Prompt-only loop prevention is architecturally inadequate.** The calibration notes confirm that no hard same-action interrupt exists.[1] Long-session control requires stateful orchestration, counters, validation, and fallbacks. A model instruction that says "avoid repetition" is not a reliability mechanism.

## Severity synthesis

| Failure | Evidence strength | Player impact | Recommended priority |
|---|---|---|---|
| Entity/reference mush | Confirmed | Catastrophic readability and grounding loss | **P0** |
| No effective escalation or danger | Confirmed | No stakes, urgency, or dramatic movement | **P0** |
| Semantic option recycling | Confirmed | Fake choice and long-session stagnation | **P0** |
| Inspect-XP exploit | Confirmed | Incentivizes non-progress | **P0** |
| No correction/re-grounding route | Confirmed | Traps players after option failures | **P0** |
| Weak objective/quest pressure | Confirmed directionally | Numeric activity without payoff | **P1** |
| Voice not audible in normal prose | Confirmed directionally | Personality promise is not delivered | **P1** |
| Inventory mutation/duplication | Plausible, not cleanly demonstrated here | Potentially severe continuity loss | **Instrument now; keep bag lock** |
| Missing tabletop roll mechanics | Alleged, not verified in calibration notes | Genre-critical if confirmed | **Targeted replay required** |

---

# 2. Gemini Overstatements and Calibration Errors

Gemini should be treated as a **useful defect detector but an unreliable auditor** in this review. Its conclusions cannot be accepted at quote level without run-grounded verification.

| Gemini claim or scoring tendency | Evidence-based correction | Practical consequence |
|---|---|---|
| Worst turns include R1:424, R1:494, and R2:486 in 300-turn runs | Those citations cannot exist.[1] | Discard the cited turns and require transcript-resolvable evidence for future reviews. |
| DnD repeatedly offers battlement/gate-queue choices | Calibration reports zero gate-queue hits and identifies these as LitRPG banks.[1] | Treat this as cross-run contamination, not a DnD bug. |
| PYOA contains Mask Scarf and Earth-junk-price contamination | Calibration reports zero matching PYOA hits; Mask Scarf is legitimate RPG kit.[1] | Do not use these examples to score PYOA inventory fidelity. |
| One DnD review reflects the cited run | `gemini-06` appears mislabeled and describes a Summoned Pact LitRPG run instead.[1] | Re-score only after run identity is bound to immutable metadata. |
| 100+ identical-action loops | Exact maximum intent streaks are only 2–3.[1] | Replace "consecutive identical loops" with "high-frequency semantic recycling across a window." |
| No NPCs | The packet also discusses static NPCs repeating dialogue.[1] | The supported defect is **non-reactive/repetitive NPCs**, not universal NPC absence. |
| Voices are entirely absent | Voice configuration exists but is not sufficiently audible.[1] | Score the user-visible result harshly, but diagnose weak realization rather than missing wiring. |
| Zero progression | XP totals are nonzero, but narrative/quest payoff is effectively absent.[1] | Distinguish **numeric accumulation** from **meaningful progression**. |
| Every category deserves 1/10 | The packet does not isolate evidence for every axis. | Keep 1–2/10 for the central failed loops; re-test English polish, invented presence, inventory truth, and related axes separately. |

### Is 1/10 fair for "Invented presence"?

**Only conditionally.** If nonexistent actors repeatedly appear in narration and actionable options, 1/10 is fair because the player cannot trust the scene roster. If the problem is limited to occasional filterable crowd pads while the underlying roster is correct, **2–3/10** is more defensible. The current packet proves severe reference corruption, but it does not isolate a clean invented-presence rate; therefore the axis should not inherit a 1/10 solely from the overall failure impression.

### Is "unplayable" fair?

For the **specific reviewed runs**, yes: the combination of unreadable references, no stakes, repeated options, no reliable correction path, and no satisfying progression can reasonably make the sessions not worth continuing. As a universal judgment about every build or mode, no: contaminated examples and mislabeled runs make that broader conclusion unsound.

### Correct way to use Gemini's review

Keep the diagnosis of **mush, passivity, semantic repetition, reward misalignment, weak voice, and missing recovery behavior**. Discard quoted frequencies unless telemetry reproduces them. Re-run all scoring with a manifest containing **mode, run ID, agent, seed, build hash, transcript checksum, and valid turn references**.

---

# 3. Honest Score Uplift Matrix

The table below gives **calibrated engineering projections**, not observed post-fix measurements. Pre-fix values reflect the shared scorecard and mode verdicts rather than independent clean-room rescoring of each transcript. The ranges assume the P0/P1 plan is enforced in code and state transitions. Prompt-only versions should be expected to land one or two points lower.

| Mode | Axis | Pre-fix | Honest post-fix | Why it improves | Why it remains capped |
|---|---|---:|---:|---|---|
| Tabletop Fantasy | Pace | 1/10 | **4–5/10** | Hard interrupts, threat decay, and quest pressure bound loitering. | Poorly contextualized interruptions can create whiplash rather than flow. |
| Tabletop Fantasy | Option quality | 1/10 | **4–5/10** | Presence filters and recycle locks remove invalid and overexposed choices. | Dedupe does not guarantee tactically or causally distinct choices. |
| Tabletop Fantasy | Combat / danger | 1/10 | **4–5/10** | A deterministic threat clock can guarantee encounters. | Spawning a threat is not enough; rolls, choices, failure, cost, resolution, and aftermath must work. |
| Tabletop Fantasy | Voice consistency | 1/10 | **4/10** | Dry Wit rails can become audible in ordinary narration. | Repeated jokes or catchphrases will feel synthetic. |
| Tabletop Fantasy | Hallucinations / mush | 1/10 | **6–7/10** | Typed entity validation plus regeneration/fallback can eliminate most visible corruption. | A blacklist alone does not repair wrong identity, continuity, or reference resolution. |
| Tabletop Fantasy | Long-session durability | 1/10 | **4/10** | Loop breakers and state locks prevent the worst collapse. | Content exhaustion, NPC memory, and quest coherence remain unresolved. |
| Tabletop Fantasy | Keep playing? | 1/10 | **4–5/10** | Readability, danger, and forward motion create a viable loop. | Tabletop expectations remain unmet if challenge and resolution stay shallow. |
| Story RPG | Pace | 1/10 | **4/10** | Goal pressure and escalation should stop travel ping-pong. | Forced events can feel railroaded if not tied to characters and prior causes. |
| Story RPG | Option quality | 1/10 | **4/10** | Semantic recycle controls and scene filters remove the worst choices. | Generic options persist without relationships, motives, and unresolved facts. |
| Story RPG | Combat / danger | 1/10 | **3–4/10** | Threat decay adds stakes. | Story RPG also needs social, moral, relational, and resource consequences—not only combat. |
| Story RPG | Voice consistency | 1/10 | **4–5/10** | Friendly Guide tone can improve orientation and warmth. | Excess guidance can flatten drama and reduce player ownership. |
| Story RPG | Hallucinations / mush | 1/10 | **6–7/10** | State-aware entity rendering directly attacks the largest reported corruption source. | Relationship and identity continuity require more than phrase filtering. |
| Story RPG | Long-session durability | 1/10 | **3–4/10** | Repetition control helps, but durable plot and NPC evolution remain thin. | Forgotten promises and static relationships can still collapse immersion. |
| Story RPG | Keep playing? | 1/10 | **4/10** | Coherent prose and consistent movement produce a workable baseline. | Thin character arcs and generic quests cap retention. |
| PYOA | Pace | 1/10 | **4/10** | Crisis pressure and anti-loop rules force scene movement. | Movement without irreversible branch consequences is not true PYOA progress. |
| PYOA | Option quality | 1/10 | **3–4/10** | Pad filtering reduces overexposed objects and invalid targets. | The current plan does not guarantee genuinely divergent choices. |
| PYOA | Combat / danger | 1/10 | **3–4/10** | A threat clock supplies urgency. | Repeated ambushes would become a replacement loop; dilemmas and non-combat crises are also needed. |
| PYOA | Voice consistency | 1/10 | **4–5/10** | A concise logistics-oriented Quartermaster voice is easy to make perceptible. | The narrow register can become monotonous during long sessions. |
| PYOA | Hallucinations / mush | 1/10 | **6–7/10** | Entity and inventory validation remove conspicuous nonsense. | Hidden branch-state contamination may survive clean wording. |
| PYOA | Long-session durability | 1/10 | **3–4/10** | Interrupts and recycle limits prevent visible stalls. | Branch reconvergence and weak consequence memory remain major risks. |
| PYOA | Keep playing? | 1/10 | **3–4/10** | The mode becomes usable when scenes move and options are readable. | Retention stays low if choices reconverge or produce no delayed payoff. |

## Cross-mode readout

| Axis | Realistic post-fix band | Confidence | Key dependency |
|---|---:|---|---|
| Pace | **4–5/10** | Medium-high | Escalation must be deterministic, bounded, and context-sensitive. |
| Option quality | **3–5/10** | Medium | Dedupe must be semantic; replacement options must be legal and consequence-distinct. |
| Combat / danger | **3–5/10** | Medium-low | Encounters require resolution and persistent costs or gains. |
| Voice consistency | **4–5/10** | Medium | Voice must appear in normal prose and avoid catchphrase loops. |
| Hallucinations / mush | **6–7/10** | Medium-high | Typed validation and safe fallback are required; regex-only scrubbing earns roughly **3–4/10**. |
| Long-session durability | **3–4/10** | Medium-low | Recent-window loop controls, ledgers, and quest closure must survive 300 turns. |
| Keep playing? | **3–5/10** | Medium-low | At least one complete objective–obstacle–consequence–reward arc must occur. |

The headline estimate is therefore: **P0/P1 can credibly lift the product into the 4/10 neighborhood, with isolated 5s and a 6–7 for visible mush, but it cannot honestly promise a stable 6/10 overall yet.** The largest risk is confusing fewer bad strings and more interruptions with better play.

---

# 4. Maximization Opportunities

## Biggest bang-for-buck: Forward-Progress Governor

The current board can suppress bad outputs and inject activity, but it does not guarantee that activity changes the game. Add a deterministic contract that compares authoritative state before and after each turn. During an active objective, the system should permit no more than **3–5 turns without a meaningful persistent delta**, except in an explicitly entered rest, planning, or conversation scene.

A meaningful delta changes at least one of the following:

| State domain | Examples of valid progress |
|---|---|
| Quest | Stage advanced, obstacle resolved, deadline worsened, objective failed, or next objective unlocked. |
| Knowledge | New actionable fact discovered and recorded; repeated inspection of the same state does not count. |
| Access/location | Route opened, area closed, position materially changed, or travel cost paid. |
| NPC/world | Relationship, commitment, suspicion, availability, faction position, or NPC condition changed. |
| Threat | Threat escalated, was avoided at a cost, was resolved, or created a persistent complication. |
| Resources | Item consumed/acquired/lost, health or time changed, debt incurred, or leverage gained. |
| Character | Condition, ability state, reputation, injury, or meaningful progression changed. |

Every forced delta must be **causally linked** to the player's action, an already telegraphed threat, or an established NPC agenda. Otherwise the governor will feel like arbitrary punishment. The delta must be written to the authoritative ledger **before** prose rendering and remain visible five turns later.

## Additional low-cost/high-impact work

| Priority | Addition | Effort | Why it pays off |
|---:|---|---|---|
| 1 | **Semantic recent-window loop detector** | Low–medium | Canonicalize action type + target + purpose over the last 8–12 turns. It detects rephrased loops that exact streak counters miss. |
| 2 | **Option-set diversity contract** | Low | Require distinct action–target–consequence profiles: objective-forward, risky/high-upside, social/world, and retreat/reposition when legal. |
| 3 | **One-time discovery and XP ledger** | Low | First discovery, risk, and resolution earn XP; repeated inspection of unchanged state earns zero. |
| 4 | **Typed entity validator with fallback** | Medium | Select from the scene roster, validate references, regenerate once, then render an explicit noun. Do not merely delete suspect phrases. |
| 5 | **Encounter resolution contract** | Medium | Every threat needs stakes, legal responses, success/failure, resource or relationship effects, and aftermath. |
| 6 | **Quest completion schema** | Low–medium | Every quest gets entry, obstacle, progress signal, terminal success/failure, reward/cost, and follow-on hook. |
| 7 | **Meta-input recovery route** | Low | Acknowledge option mismatch, re-ground from state, and regenerate legal options instead of treating the complaint as an in-world action. |
| 8 | **Narrative novelty budget** | Low | Track repeated beats and sentence fingerprints so paragraph clones cannot survive as paraphrases. |
| 9 | **Immutable evaluation manifest** | Low | Bind each quote and score to run/mode/seed/build/turn/checksum to stop cross-genre and cross-run contamination. |

## Implementation cautions for the existing board

| Existing fix | Superficial version to avoid | Version that can earn the projected uplift |
|---|---|---|
| Mush scrub | Delete or substitute banned strings after generation. | Generate from typed entities, validate referents, regenerate once, and use explicit-noun fallback with telemetry. |
| Hard interrupt | Spawn combat after five identical text strings. | Detect semantic non-progress, use a proportional escalation ladder, and commit a persistent consequence. |
| Pad dedupe | Compare exact option text. | Canonicalize semantic role and require replacement choices with distinct likely outcomes. |
| XP retarget | Lower inspect XP globally. | Use a one-time discovery ledger; reward novelty, risk, quest movement, and resolution. |
| Threat decay | Add a random ambush timer. | Telegraph pressure, choose genre-appropriate crises, preserve causality, and resolve consequences. |
| Voice rails | Insert recurring catchphrases or style labels. | Alter diction, compression, attitude, and framing while applying cooldowns and scene-tone suppression. |
| Quest pressure | Reprint the objective in every STATUS block. | Make world actors, deadlines, access, and consequences move the objective forward or toward failure. |
| Bag lock | Maintain a list of item names. | Track ownership, quantity, equipped/consumed/dropped/loaned state, provenance, and conservation. |

---

# 5. Blind Spots – Failures That Can Still Sink Post-Fix Scores

| Blind spot | What a human player experiences | Residual risk | Needed mitigation |
|---|---|---|---|
| **Threat spawn without playable resolution** | "Combat" is decorative if there are no meaningful choices, rolls, loss states, costs, or aftermath. | Critical | Test complete encounters from initiation through three decisions, resolution, persistent cost/gain, and aftermath. |
| **Interruption without progress** | The scene changes, then returns to the same unchanged hub and objective. | Critical | Enforce the Forward-Progress Governor and verify the delta persists five turns later. |
| **Semantic loops** | "Leave," "walk away," and "take another road" are cosmetically different but functionally identical. | Critical | Score canonical action families over rolling windows, not only exact strings or consecutive selections. |
| **Fake PYOA branching** | Choices reconverge immediately and preserve no unique cost, access, fact, or delayed payoff. | Critical | Maintain branch-specific state and compare paired divergent replays. |
| **Missing mode fantasy** | Tabletop lacks transparent challenge; Story RPG lacks relationships and arcs; PYOA lacks irreversible branching. | Critical | Use separate mode acceptance suites rather than only shared anti-loop metrics. |
| **Static NPC memory** | NPCs repeat introductions, forget promises, and reset emotionally. | High | Store goals, knowledge, disposition, commitments, relationship deltas, and last interaction summaries. |
| **Quest movement without closure** | Counters rise, but objectives never resolve or pay off. | High | Require success/failure terminals, rewards/costs, and a follow-on hook. |
| **Spatial and presence inconsistency** | Actors teleport, exits change, doors relock, or options target absent entities. | High | Validate against a location graph, scene roster, exits, object ownership, and transition history. |
| **Action–outcome mismatch** | The player chooses negotiation but receives unrelated travel or combat. | High | Assert that the next response addresses the selected verb, target, and purpose before complications are added. |
| **Punitive anti-loop behavior** | The GM attacks the player for pausing, inspecting, or rejecting bad options. | High | Escalate proportionally, telegraph pressure, tie events to established causes, and preserve a viable disengage route. |
| **No failure economy** | "Danger" cannot consume health, time, access, reputation, relationships, or resources. | High | Define reversible setbacks, bounded irreversible losses, recovery paths, and difficulty limits. |
| **Inventory lock without state transitions** | Items do not materialize, but consumed, equipped, dropped, or loaned objects still behave incorrectly. | Medium-high | Add transition semantics and conservation assertions, not just a name whitelist. |
| **Over-aggressive phrase filtering** | Sentences become broken or a wrong reference becomes a confident but incorrect noun. | Medium-high | Audit identity correctness and grammar after fallback, not only residual banned-string counts. |
| **Voice as a new repetition loop** | Dry Wit becomes constant snark; Quartermaster becomes repetitive jargon. | Medium | Add phrase cooldowns, variation targets, and suppression for grief, danger, and revelation. |
| **No satisfying endpoint** | A session avoids loops but still feels endless and purposeless. | High | Measure complete arcs per 50/100 turns and emit consequence summaries at chapter boundaries. |
| **Evaluation contamination** | Engineering chases defects from the wrong mode, run, or turn. | High for prioritization | Reject any qualitative citation that does not resolve against the immutable run manifest. |

## Underestimated risk: combat is not synonymous with consequence

The fix plan places substantial weight on hard interrupts, threat decay, and ambushes. That is appropriate for Tabletop Fantasy, but it can damage Story RPG and PYOA if combat becomes the universal answer to inactivity. A social betrayal, expiring opportunity, faction move, resource loss, environmental hazard, or irreversible branch closure may produce better genre-appropriate pressure. The shared primitive should be **consequence**, with combat as one implementation.

## Underestimated risk: surface cleaning can conceal state corruption

Removing `the stranger` and `this place` will improve visible prose immediately, but a fluent sentence can still refer to the wrong NPC, wrong location, or nonexistent object. The real success metric is not "zero banned strings." It is **zero invalid entity references and zero impossible state transitions**, manually spot-checked on clean long runs.

## Underestimated risk: progress metrics can be gamed

An engine can satisfy an event count, XP count, or quest-stage count while remaining unsatisfying. Post-fix evaluation must ask whether the player's action caused an understandable change, whether the change persisted, and whether it produced payoff. Otherwise the system will optimize for telemetry movement rather than play quality.

---

# Recommended Ship Order and Release Gates

## Ship order

| Order | Workstream | Exit condition |
|---:|---|---|
| 1 | Entity grounding and inventory/state authority | No invalid references or state-conservation failures in targeted replay. |
| 2 | Semantic loop detection, option diversity, and meta recovery | Rephrased loops are detected; invalid-choice complaints produce grounded replacement options. |
| 3 | XP anti-farm and Forward-Progress Governor | Repeated inspection yields no reward; active objectives receive durable deltas within the turn budget. |
| 4 | Threat escalation plus full encounter/consequence resolution | Pressure is telegraphed, genre-appropriate, resolvable, and persistent. |
| 5 | Quest closure and mode-specific vertical slices | Each mode completes at least one representative arc that satisfies its genre promise. |
| 6 | Voice pass and long-run durability evaluation | Voice is identifiable without labels and remains varied over 50+ turns. |

## Minimum defensible gates for claiming "4–6/10 playable"

| Gate | Suggested acceptance threshold in a 300-turn automated run |
|---|---|
| Rendering integrity | Zero unresolved placeholder phrases and fewer than one manually verified invalid entity reference per 100 turns. |
| Loop control | No semantic option family exceeds 25% of offered options in a rolling 50-turn window; no active-objective non-progress window exceeds five turns. |
| Progress | At least one durable meaningful state delta every 3–5 active turns and at least one completed or failed objective arc within 50 turns. |
| Danger/consequence | At least one fully resolved high-stakes encounter or equivalent non-combat crisis within the configured pacing window. |
| Reward integrity | Zero repeat XP for inspecting unchanged state; rewards map to discovery, risk, objective movement, or resolution. |
| State consistency | Zero invented scene participants, impossible location transitions, and inventory conservation violations in the test suite. |
| Voice | Blind reviewers can identify the intended personality in a majority of ordinary sampled turns without seeing mode labels or STATUS blocks. |
| Evaluation hygiene | Every quote resolves to an existing turn in the correct mode/run/build; no cross-genre artifact leakage. |

These are starting thresholds rather than universal truths, but they force evaluation to measure **causal play quality** rather than the disappearance of a few conspicuous strings.

---

# Final recommendation

Proceed with the P0 board, but tighten its definitions before implementation. The **mush scrub must become entity validation**, the **hard interrupt must become context-sensitive consequence**, the **pad filter must become semantic option diversity**, and the **XP retarget must become a one-time discovery/reward ledger**. Keep voice rails and quest pressure in P1, but add the **Forward-Progress Governor** as the single highest-value extra item.

With those changes, an honest target is:

- **4–5/10** for pace and basic playability;
- **3–5/10** for option quality and danger, depending on encounter and consequence depth;
- **4–5/10** for perceptible voice;
- **6–7/10** for visible mush only if repaired at the state/entity level;
- **3–4/10** for long-session durability until NPC memory, branch persistence, quest closure, and content novelty are proven;
- **3–5/10** for "keep playing," with Tabletop Fantasy likely strongest and PYOA most constrained by the current plan.

The product can plausibly reach **honest rough playability** after P0/P1. It will not reach reliable mid-tier quality by interrupting loops alone. The decisive shift is from "something different happened" to **"the player caused a persistent, legible, genre-appropriate consequence."**

## Reference

[1]: ./source_packet.txt "User-supplied Gemini scorecard, executive verdicts, calibration notes, and proposed fix plan"
