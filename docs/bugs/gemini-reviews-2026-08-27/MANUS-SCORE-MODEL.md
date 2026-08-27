# Calibrated Score Model

## Interpretation

The projections below are **engineering estimates, not measured post-fix results**. They assume the P0/P1 items are enforced in code or validated state transitions rather than added only as prompt language. The lower end applies when a fix merely suppresses a symptom; the upper end applies when it also repairs the underlying state and is verified over long runs.

A score of **4/10** means the mode is recognizably playable but rough and repetitive. **5/10** means an ordinary session can produce a coherent, moderately engaging arc, although the system still lacks depth or variety. **6/10** means the issue is no longer a dominant defect in most runs. Nothing in the stated P0/P1 plan credibly supports an 8/10 projection because combat depth, NPC memory, branching quality, quest resolution, and content novelty remain underdeveloped or unverified.

## Mode × axis projection

| Mode | Axis | Pre-fix | Post-fix projection | Why the uplift is credible | Remaining ceiling |
|---|---|---:|---:|---|---|
| Tabletop Fantasy | Pace | 1/10 | **4–5/10** | Hard interrupts, quest pressure, and threat decay should end indefinite loitering. | Random or poorly contextualized interruptions can replace stagnation with whiplash. |
| Tabletop Fantasy | Option quality | 1–2/10 | **4–5/10** | Context filters and recycle limits remove visibly invalid and overexposed pads. | Dedupe alone does not create tactically distinct or causally meaningful choices. |
| Tabletop Fantasy | Combat / danger | 1/10 | **4–5/10** | A deterministic threat clock can guarantee encounters within a bounded turn window. | Encounter spawning is not a combat system; rolls, tactical choices, failure, resource cost, resolution, and aftermath must work. |
| Tabletop Fantasy | Voice consistency | 1/10 | **4/10** | Strong Dry Wit rails can make the voice perceptible in narration and transitions. | Repeated catchphrases or jokes will feel templated unless voice is varied and subordinate to scene tone. |
| Tabletop Fantasy | Hallucinations / mush | 1/10 | **6–7/10** | Typed entity validation plus safe regeneration/fallback can eliminate most visible placeholder corruption. | A string blacklist alone will not fix wrong referents, omitted nouns, or broader continuity errors. |
| Tabletop Fantasy | Long-session durability | 1/10 | **4/10** | Loop breaks and state locks should prevent the worst 300-turn collapse. | Content exhaustion, semantic loops, quest incoherence, and NPC memory remain likely after dozens of turns. |
| Tabletop Fantasy | Keep playing? | 1/10 | **4–5/10** | Readability, danger, and forward motion should create a minimally satisfying play loop. | Tabletop expectations remain unmet if dice, consequence, character capabilities, and encounter resolution are shallow. |
| Story RPG | Pace | 1/10 | **4/10** | Quest pressure and escalation should stop city/path ping-pong. | Forced events without character-motivated causality can feel like railroading. |
| Story RPG | Option quality | 1/10 | **4/10** | Semantic recycle controls and presence filters should remove the worst repeated or impossible options. | Options may remain generic unless they are generated from active goals, relationships, and unresolved scene facts. |
| Story RPG | Combat / danger | 1/10 | **3–4/10** | Threat decay introduces stakes even if combat is not the mode's only dramatic mechanism. | Story RPG also needs social, moral, relational, and resource consequences; combat-only pressure is too narrow. |
| Story RPG | Voice consistency | 1/10 | **4–5/10** | A visible Friendly Guide cadence can improve tone and orientation. | Over-guidance may flatten character drama or reduce player ownership. |
| Story RPG | Hallucinations / mush | 1/10 | **6–7/10** | Entity-safe rendering can sharply improve readability in the mode with the highest reported stranger corruption. | Continuity, identity, relationship, and pronoun correctness need state-aware checks beyond banned phrases. |
| Story RPG | Long-session durability | 1/10 | **3–4/10** | Loop prevention improves survival, but the mode still needs durable NPC and plot-state evolution. | Static relationships, forgotten promises, and unresolved arcs can still collapse immersion. |
| Story RPG | Keep playing? | 1/10 | **4/10** | Coherent prose and reliable movement create a viable baseline experience. | Generic quests and thin character arcs will cap retention even if catastrophic defects disappear. |
| PYOA | Pace | 1/10 | **4/10** | Crisis injection and anti-loop rules should force branch movement. | Pacing is not enough if choices do not create irreversible divergence. |
| PYOA | Option quality | 1/10 | **3–4/10** | Pad filtering should reduce Millstone Charter-style overexposure and impossible social targets. | The plan does not yet guarantee mutually distinct branches with different costs and outcomes. |
| PYOA | Combat / danger | 1/10 | **3–4/10** | A threat clock adds danger and interrupts passive examination. | PYOA needs broader crises and dilemmas; repeated ambushes would become a new loop. |
| PYOA | Voice consistency | 1/10 | **4–5/10** | Army Quartermaster rails can be made audible through concise, logistics-oriented briefings. | A narrow voice template can become monotonous over long runs. |
| PYOA | Hallucinations / mush | 1/10 | **6–7/10** | Entity and inventory validation should remove the most conspicuous nonsense. | Branch-state contamination can persist even when surface wording is clean. |
| PYOA | Long-session durability | 1/10 | **3–4/10** | Hard interrupts and recycle limits prevent obvious stalls. | Without branch-state closure, consequence memory, and novelty budgets, the run can still become a disguised linear loop. |
| PYOA | Keep playing? | 1/10 | **3–4/10** | The mode can become playable once choices are readable and scenes move. | Retention stays low if "different" choices reconverge immediately or lack visible consequences. |

## Cross-mode summary

| Axis | Honest cross-mode post-fix band | Confidence | Required implementation condition |
|---|---:|---|---|
| Pace | **4–5/10** | Medium-high | Escalation is deterministic, context-aware, and bounded by a turn budget. |
| Option quality | **3–5/10** | Medium | Dedupe is semantic and options are grounded in the current scene, active goal, and legal targets. |
| Combat / danger | **3–5/10** | Medium-low | Encounters include resolution and consequences, not merely a threat-spawn event. |
| Voice consistency | **4–5/10** | Medium | Voice appears in ordinary prose and is tested for perceptibility without repetitive catchphrases. |
| Hallucinations / mush | **6–7/10** | Medium-high | Rendering validates typed entities and regenerates or falls back safely; simple phrase replacement earns only **3–4/10**. |
| Long-session durability | **3–4/10** | Medium-low | Recent-history loop detection, state ledgers, and bounded escalation all survive at least 300 turns. |
| Keep playing? | **3–5/10** | Medium-low | The resulting sessions demonstrate at least one complete objective/encounter/reward arc rather than only fewer obvious bugs. |

## What the plan can and cannot honestly claim

If implemented robustly, the plan can credibly move SynapticGM from **catastrophically broken to rough but playable**, with most reviewed axes landing in the **4–5/10 range** and surface mush reaching **6–7/10**. It cannot yet credibly claim a broad 6/10 experience because long-run causal memory, meaningful branch divergence, NPC reactivity, tactical resolution, and quest completion are not guaranteed by the current board.

The most likely failure of optimistic scoring is to confuse **loop interruption** with **meaningful progression**. A forced ambush changes the turn; it does not automatically advance a quest, alter the world, consume a resource, reveal information, or create a lasting consequence. Post-fix evaluation must therefore score completed causal arcs, not just lower repetition counts.
