# T9 — Honest Score-Ceiling Model

**Baseline:** External Gemini-style scores reported at approximately 1/10 on the four worst cells  
**Author:** Manus AI

## Conclusion

A **4.5–6.5/10 outcome on the targeted worst cells is a defensible 29a ambition**, because the batch directly removes the reported structural floor: encounters that never end, branches that never lock, bound nouns destroyed by cleanup, and internal tags shown to players.[1] A **6/10 portfolio average may be achievable in one batch**, but it should be treated as an upside case rather than the ship promise. An **8/10 portfolio average is not a credible one-batch commitment**.

The ranges below are architecture forecasts, not measured results. No raw evaluator outputs, variance estimates, or complete portfolio distribution were supplied, and Gemini cross-run bleed may distort the apparent baseline or uplift.

## Ceiling table

| Horizon | Required scope | Targeted worst-cell range | Plausible portfolio-average range | Confidence | What still limits the score |
|---|---|---:|---:|---|---|
| **29a** | Terminal FSM, paired clear receipt, encounter choice lock, topic/branch commit, PYOA enforcement, entity protection, STATUS firewall, resolution/branch/T12/replay gates | **4.5–6.5** | **3.5–6.0** | Medium-low until same-seed reruns | Prose quality, pacing variety, long-horizon continuity, evaluator variance, untested cells |
| **29b** | Tune terminal pacing; broaden registry coverage; improve post-terminal consequence rendering; repair medium-horizon NPC/world memory; calibrate choice diversity without weakening legality | **5.8–7.3** | **5.5–7.0** | Low-medium | Long sessions, multi-actor coherence, style repetition, sparse or misconfigured BeatContracts |
| **Three-batch** | Generalize across portfolio; long-term consequence and memory coherence; richer scene composition; adversarial leak/scrub coverage; evaluator calibration | **6.8–8.3** | **6.5–8.0** | Low | Model creativity ceiling, edge-case combinatorics, subjective evaluator preferences |

The upper ends assume the new gates pass without merely forcing abrupt or repetitive outcomes. A deterministic clear that feels arbitrary may remove a 1/10 failure but still cap the experience below the top of the range.

## Scenario model for 29a

| Scenario | Preconditions | Targeted worst-cell expectation | Portfolio implication |
|---|---|---:|---|
| **Downside** | Terminal receipts exist but pacing is abrupt; registry gaps cause frequent fallbacks; scrub/leak defects remain | 2.5–4.5 | Structural improvement is visible but presentation failures remain; no 6 average |
| **Base** | All P0 invariants pass on four worst seeds; most terminal outcomes are natural; protected nouns and STATUS are clean | 4.5–5.8 | Broad average improves, but untested cells and prose ceilings keep portfolio below 6 |
| **Upside** | Base conditions plus good registry coverage, low fallback rate, clean post-terminal choices, and no evaluator contamination | 5.8–6.5 | A portfolio average near 6 becomes plausible if failures are concentrated in the same repaired classes |

## Why 28c telemetry did not translate into score

The reported evidence shows event presence without reader-visible completion. LitRPG s18 had a combat receipt and early arc XP but remained in combat for hundreds of turns. DnD s69 reached L2 and 235 XP but repeated Wraith flee/parley and STATUS. RPG s137 reached L3 and recorded a crisis while dialogue, pronoun, and prompt-leak defects remained. PYOA s188 had three crises and XP growth but no branch lock.[1]

An external evaluator judging playability, agency, and coherence is likely to penalize the unresolved loop more heavily than it rewards telemetry that is invisible or contradicted by the next turns. Batch 29a raises the floor by aligning receipts with terminal state, legal choices, and player-facing output.

## Conditions required for the 29a upper bound

| Condition | Required evidence |
|---|---|
| Encounters truly terminate | Every evaluable combat spawn has one linked `encounterCleared` by T50, with no active encounter at T15 for early-hook fixtures |
| Choices reinforce terminality | Zero forbidden encounter pads and zero flee/parley emissions after threshold |
| Consequences persist | Topic commits and PYOA branch locks survive the next turn, reload, and same-seed replay |
| Text remains coherent | Zero scrub-generated collateral tokens and no required bound entity loss |
| Player surface is clean | Zero denied STATUS/prompt patterns after normalization |
| Evaluation is trustworthy | Run/seed/mode identity is consistent; foreign artifacts are quarantined; same-seed normalized receipts match |
| Fallbacks do not dominate | Fallback usage is measured and low enough that most outcomes are contextually grounded; threshold requires calibration from reruns |

## Why 8/10 is not a 29a promise

Batch 29a intentionally does not add a second LLM critic, default to a stronger Free model, or prioritize a stagnation Mid writer.[1] It also does not solve all dimensions associated with high evaluator scores. Even after terminal authority is correct, the product can remain repetitive, tonally uneven, under-described, mechanically shallow, or weak at recalling consequences many turns later.

An 8/10 promise would additionally require evidence across more than the four worst cells, stable score distributions over repeated evaluator runs, low fallback rates, strong post-terminal continuation, and quality improvements that are not reducible to structural gating. Those are multi-batch validation and experience-quality tasks.

## Evaluation design for honest attribution

Run the original worst-cell seeds and action streams under 28c and 29a with the same model/evaluator configuration. Record structural gate outcomes before obtaining the subjective score. Repeat the evaluator pass enough times to observe judgment variance, but do not create a second in-product critic path. Store an evaluator-context id and isolate each run’s transcript.

| Attribution check | Interpretation |
|---|---|
| Structural gates improve and score improves | 29a likely fixed a dominant evaluator-visible failure |
| Structural gates improve but score does not | Prose/pacing or evaluator contamination remains; do not add random mechanics before inspecting evidence |
| Score improves but structural gates fail | Treat score as unreliable; do not ship on score alone |
| Same transcript receives materially inconsistent judgments | Quantify evaluator variance and inspect context isolation |
| Foreign entity/tag appears in evaluator input or explanation | Mark cross-run bleed; exclude the score from aggregate and quarantine artifacts |

## Score reporting rules

Report medians and ranges by mode/seed rather than one blended point estimate. Separate **targeted worst-cell score** from **portfolio average**. Publish gate pass rates alongside subjective scores. Do not describe the upper bound of a forecast as an achieved result.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
