# F14 — Research-complete checklist and founder 7-day plan

## Research-complete checklist

| Area | Done enough to code tomorrow | Needs playtest | Needs counsel |
|---|---|---|---|
| Authority and continuity | Authority order, StateTx commit boundary, correction precedence, receipt policy are specified. | Whether players understand chips/Why? without prose interruption. | Data provenance, retention, deletion, and correction guarantees. |
| Turn feel | Input classes, coverage dispositions, answer-first rules, and engine templates are specified. | Length bands, hook density, and whether players feel “heard.” | None beyond safety policy. |
| Repair | State machine, contrastive prompts, Kid Mode tone, and copy bank exist. | When silent inference is welcome versus creepy. | Kid Mode escalation and reporting policy. |
| Voice | Renderer firewall, 10 voices, and blind A/B protocol exist. | Preference and fatigue over 50+ turns. | Any persona/companion marketing claims. |
| Streaming | Post-commit decision, lifecycle, cancel semantics, and mobile rules exist. | Perceived latency / readability / interruption frequency. | Moderation and user-notice posture. |
| Audio future | Text parity and Hear pilot constraints exist. | Listener comprehension and controls. | Accessibility claims and voice-rights/vendor terms. |
| Content | Original skeletons, repairs, notices, openings, and bad→good examples exist. | Tone fit across engines and player preferences. | Safety review for mature content if added later. |

## Seven-day founder plan: chat/story feel only

| Day | Objective | Deliverable | Pass signal |
|---|---|---|---|
| 1 | Lock the turn boundary | `IntentContract` schema, coverage gate, authority trace | Five compound messages cannot lose a clause. |
| 2 | Make prose subordinate to adjudication | Semantic render plan and StateTx receipt mapping | Same plan yields valid LitRPG, Story RPG, Tabletop, PYOA turns. |
| 3 | Build repair that feels human | Repair state machine, 40-line bank, correction UI | Testers correct a misread clause without restating the scene. |
| 4 | Add voice without semantic drift | Six baseline profiles, equivalence fixture runner | All frozen facts/receipts equal across voices. |
| 5 | Implement guarded streaming | Lifecycle events, cancel/abort UI, bubble persistence | Abort produces no uncommitted state mutation. |
| 6 | Playtest first 10 turns | Two chapter-one packs; human rubric session | Players can name a consequence and an available next action. |
| 7 | Triage with evidence | Run 40+ fixture suite and 6–10 moderated sessions | Fix top 3 immersion kills; do not add features. |

## Launch decision questions

Do not greenlight on prose samples alone. Ask: Can a player accurately report what changed? Can they correct a misread intent locally? Do two voices produce the same truth? Does the system answer a direct question before drifting into atmosphere? Does a long-session return open with consequence rather than recap? Does Kid Mode decline and redirect plainly? If any answer is no, keep the work in closed beta.

## References

This plan is a **SPECULATIVE implementation sequence** grounded in the evidence and artifacts in the package. See [citations.md](citations.md). [R01] [R04] [R05] [R08] [R09] [R18]
