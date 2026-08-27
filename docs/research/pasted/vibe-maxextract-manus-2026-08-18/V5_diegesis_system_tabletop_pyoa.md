# V5 — Diegesis: System, Tabletop, and PYOA Chrome

## Chrome doctrine

Diegetic presentation should help the player understand **why** information exists in the fiction, but it cannot be the sole truth surface. Research on diegetic UI treats immersion, clarity, and usability as a trade-off rather than a binary. [1] SynapticGM uses a dual surface: evocative in-world chrome for mood, plus an accessible, inspectable ledger view for facts, checks, inventory, and correction.

| Message class | Voice / visual role | Truth rule |
|---|---|---|
| `NARRATOR` | Scene, sensation, pacing. | May invent bounded flavor; label no facts as evidence unless supported. |
| `CHARACTER` | Dialogue and disposition. | A character can lie or be mistaken; claim status is not canon. |
| `SYSTEM` | In-world rule cadence, milestones, permits. | Must remain concise and semantically exact. |
| `RULES` | Check/readiness disclosure. | Direct, accessible, no fiction required to understand. |
| `CORRECTION` | Player correction confirmation. | Exact scope and supersession are visible. |
| `RECEIPT` | State outcome. | Links to StateTx; never reveals hidden future. |

## LitRPG System notice cadence

| Trigger | Visibility | Example template | Never-line |
|---|---|---|---|
| New permitted verb after safe use | Inline, brief. | `System: You can now attempt [Stabilize].` | “You have been chosen because you are special.” |
| State transition with gameplay relevance | Inline receipt. | `Status changed: Dock access suspended.` | “The story needs this.” |
| Evidence discovered | Inline only if actionable. | `Observed: salt on the lock. Meaning unknown.` | “Evidence confirms [unsupported theory].” |
| Optional optimization / deep rules | Scene boundary or explicit inspect. | `Details available in your field notes.` | Mid-action unsolicited tutorial. |
| Failure with readable cause | Result + safe next beat. | `Attempt failed: the seal needs a living witness.` | “Invalid action.” |

The System should not narrate every turn. It appears at **thresholds**: new affordance, material state change, authority change, fair failure, or acknowledged correction. A notice that merely repeats narration is noise.

## Tabletop trust UX

Before a consequential check, display a compact card. It may use in-world language but must be comprehensible with all flavor turned off.

| Field | Required treatment |
|---|---|
| Intent | Player’s intended action, in neutral terms. |
| Basis | Relevant capability / skill and visible modifier sources. |
| Stakes | What success, partial success, or failure can change now. |
| Difficulty | Exact value when allowed; otherwise a truthful band such as `standard`, `risky`, `formidable`. |
| Consent / reversibility | Mark irreversible or costly action; require confirmation only if warranted. |
| Resolution | Result, relevant roll/logic, and applied StateTx delta. |

Telegraphing makes difficulty a question the player can understand and act upon, rather than a concealed trap. [2] A failed check should identify the failed condition and consequent world change. It must not transform into a moral judgment or generic “no.”

## PYOA voice rules

Main prose retains forward movement and character perspective. The `aside` is a brief, optional lens that clarifies known stakes, intent categories, or state changes. It must not spoil unknown consequences or pretend a cosmetic choice has profound divergence.

| Surface | Use | Example |
|---|---|---|
| Main prose | Lived moment. | “The bridge groans beneath the weight of the storm.” |
| Choice label | Intent plus known immediate risk. | `Cross now — risk the flood.` |
| Aside | Plain, optional scope clarification. | `Known: the river route may close. Unknown: who watches it.` |
| Receipt | Consequence after selection. | `Changed: river route closed; ferryman trust improved.` |

Present two to four materially distinct options when options are shown. Freeform input remains available. If narrative branches later reconverge, preserve a difference in state, relationships, access, information, resources, or framing. Meaningful agency depends on the player being able to perceive consequences, not on limitless branching. [3]

## Memorable Moment splash policy

A **Memorable Splash** is an event-driven visual punctuation, not a parallel comic runtime. Trigger only when a real threshold has occurred: a location first becomes personally meaningful; a durable companion bond shifts; a major discovery rewrites a supported belief; a fair defeat recasts the campaign; or a quest promise is irreversibly accepted.

| Rule | Implementation |
|---|---|
| Frequency | Default ceiling: one splash per scene; no splash on ordinary turn resolution. |
| Authority | Consume StateTx/SceneManifest after resolution; never invent canon. |
| Orientation | Preserve location, actor, active objective, and next player input. |
| Control | Skip/reduce-motion/alt text available; no lost information if skipped. |
| Aftermath | Return to one-line “what changed” receipt. |

Short cinematic research suggests orientation and spatial awareness matter more than mere brevity. [4] The splash should therefore maintain the player’s place and immediately restore agency.

**SPECULATIVE:** Difficulty bands and splash frequency should vary by engine and player accessibility settings.  
**COUNSEL:** Visual depiction, content-rating boundaries, and any mature fiction assets need review before release.

## References

[1]: https://unity.com/blog/games/how-to-immerse-your-players-through-effective-ui-and-game-design "Unity — Effective UI and Game Design"
[2]: https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing "Game Developer — Enemy Attacks and Telegraphing"
[3]: https://gamestudies.org/1901/articles/stang "Stang — Interactivity and Player Agency"
[4]: https://www.theseus.fi/handle/10024/921712 "Integration of Short Cinematics into Gameplay Flow"
[5]: https://www.w3.org/WAI/WCAG22/quickref/ "W3C — WCAG 2.2 Quick Reference"
