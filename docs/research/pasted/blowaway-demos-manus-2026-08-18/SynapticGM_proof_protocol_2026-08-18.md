# SynapticGM proof protocol — recording standard

## Purpose

This protocol converts the requested ledger stack into filmable proof. Each clip must establish a **precondition**, show the player’s action, expose the authoritative ledger decision, and confirm the resulting state. A good demo never asks the viewer to trust evocative prose alone.

## Required recording layout

Use a 70/30 split screen. The player-facing scene occupies about 70% of the frame. The remaining 30% is a readable Evidence Drawer, pinned open only at the decisive moment. Zoom once into the drawer where necessary; do not redact the decisive identifiers.

| Proof component | Visible evidence | Minimum verification | What does not count as proof |
|---|---|---|---|
| StateTx | Transaction ID, entity, before/after values, reason/authority, status | The claimed value is present in the post-state | A narration sentence saying it happened |
| SceneManifest | Scene ID/version and allowed NPC/object IDs | Claim target is listed; an unlisted target is rejected or absent | A generic scene description |
| IntentContract | Contract ID, parsed intent, targets/constraints, outcome | Player input maps to a visible contract before narration | A model paraphrase with no contract |
| HookArc | Arc ID, state, opening event, eligibility | Soft offer is absent while closed and appears only after opening event | An offer that merely happens later |
| Why? | Decision basis, cited state/manifest/contract references | Viewer can identify why the system allowed, denied, or changed something | “Because the AI decided” |
| Combat receipt | Receipt ID, inputs, resolution/roll basis, HP/resources before/after | Result and deltas agree; loss is retained after return | A dramatic combat line without mechanics |

## Baseline acceptance rule

For every script, the founder should capture a clear **setup frame**, record all written turns, open the Evidence Drawer immediately after the decisive turn, and perform the named verification step. A take passes only if the ledger identifier, decisive evidence, and post-state are simultaneously readable or shown in consecutive uncut frames.

## Neutral rival-language rule

Describe failure modes as a **common risk in prompt-only or unledgered AI GMs**, not as a blanket accusation against a named company. The sources below establish why the categories are real; they do not supply market shares or comparative rates. Research identifies cross-turn state coherence, rule adherence, NPC continuity, and hallucinated content as live design problems for LLM game masters. [1] [2]

> “Proof” in this package means a reproducible, on-screen acceptance demonstration of a SynapticGM build. It is not a claim that another product never succeeds, nor a claim of universal reliability.

## Metric conventions

| Metric label | Calculation / pass condition | Reporting unit |
|---|---|---|
| Ledger match | Required before/after claim matches evidence shown | Pass / fail per take |
| Session-return retention | Correct record is retrieved after explicit return/reload | Pass / fail per return probe |
| Manifest integrity | Claimed NPC/object set equals manifest set; prohibited addition is denied | Pass / fail per probe |
| Protest resolution | Explicit player objection changes or preserves outcome according to the recorded contract, with reason | Pass / fail per protest |
| Combat audit completeness | Receipt displays inputs, resolution basis, and deltas | 0–3 fields present; pass = 3 |
| Offer-gating integrity | Offer absent while hook is closed and present only after qualifying open state | Pass / fail per arc test |
| Time to evidence | Seconds from decisive action to readable proof panel | Seconds; report median after P0 only |

## P0 telemetry prerequisites

Before publishing aggregate statistics, instrument immutable event IDs, build/version, scenario seed, capture timestamp, return/reload probe result, and failure reason. Report the denominator, exclusions, and study window beside any percentage. No performance, reliability, or latency percentage belongs in marketing until this telemetry is collected and reviewed.

## Sources

[1] Song, J., Zhu, A., and Callison-Burch, C. (2024). *You Have Thirteen Hours in Which to Solve the Labyrinth: Enhancing AI Game Masters with Function Calling*. https://arxiv.org/html/2409.06949v1

[2] Gallotta, R. et al. (2024). *Large Language Models and Games: A Survey and Roadmap*. https://arxiv.org/html/2402.18659v4
