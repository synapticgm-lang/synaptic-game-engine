# Fluid GM Chat Constitution

**Status:** Product constitution for SynapticGM. **Scope:** Live SynapticGM only; no parallel engine is proposed. This constitution extends the specified `IntentContract`, `StateTx`, `SceneManifest`, `IntroductionPermit`, `CampaignContract`, `HookArc`, receipts, and GM-voice firewall.

## Definition

A turn is **fluid** when it gives the player a prompt, timely, legible sense that a particular person understood the whole message, adjudicated only what the world permits, and advanced a live scene in prose worth reading aloud. Fluidness is not token volume, total recall, imitation of a human, or the concealment of rules. It is a measurable composition of **clause coverage**, **commit integrity**, **prose rhythm**, **repair cost**, and **diegetic clarity**.

| Dimension | Operational definition | Instrument | Default target for closed beta |
|---|---|---|---|
| Heardness | Every material clause has an `addressed`, `clarified`, `deferred`, or `blocked` disposition. | IntentContract coverage audit | 100% material-clause disposition |
| Fairness | Consequences derive from authority-ranked state and declared adjudication, never voice. | StateTx / receipt audit | 0 unreceipted consequential changes |
| Story motion | A reply changes pressure, knowledge, position, relationship, clock, or option landscape. | SceneManifest delta | ≥1 meaningful beat change except pure answer/repair |
| Readability | The reply has a clear first beat, varied sentence length, and a legible handoff. | prose warden | No wall-of-stats or generic close |
| Repair cost | A misunderstood player can correct the disputed interpretation without retyping the whole intent. | repair event telemetry | One local correction path |
| Latency honesty | UI communicates actual processing state without fabricated drama or hidden commit. | client lifecycle audit | Explicit staged state; cancel preserves input |

## Non-negotiable laws

| Law | Required behavior | Forbidden substitute |
|---|---|---|
| **1. Player correction is supreme.** | Apply the authority order: player correction → pinned canon/opening invariant → accepted `StateTx` → `SceneManifest` → evidence → invention. | Treating a summary, retrieval hit, or vivid previous prose as authority. |
| **2. Interpret the whole turn.** | Build an `IntentContract` before rendering. A compound message may contain action, question, joke, correction, and meta request. | Replying to only the easiest clause. |
| **3. Commit before charm.** | Validate permits, dice, and state consequences before prose is marked committed. | Letting a voice profile decide facts, math, injury, kit, roster, or permits. |
| **4. Answer questions early.** | Put an answer, honest uncertainty, or boundary in the first dramatic unit when the player asks a direct question. | Burying an answer beneath atmospheric throat-clearing. |
| **5. Acknowledge without ritual.** | Let consequences, a precise paraphrase, or a character reaction prove understanding. | Repeating “I hear you,” “Great question,” or “You want to…” by default. |
| **6. One turn, one visible beat.** | Default to one coherent pressure shift; allow additional beats only for compound player intent or a set-piece. | A collage of unrelated lore, stat changes, NPC entrances, and offers. |
| **7. Preserve agency.** | Describe world response and NPC behavior; do not assign the player character’s feelings, decisions, speech, or certainty. | “You realize,” “you decide,” or emotional puppeteering. |
| **8. Chrome is evidence, not interruption.** | Render StateTx receipts silently, as chips, or in `Why?` detail according to materiality. | Forcing logs into the middle of narrative prose. |
| **9. Repair stays local.** | Preserve the player bubble; show one contrastive question or direct correction path. | Scene reset, generic apology, or asking the player to restate everything. |
| **10. Offers respect scene timing.** | `HookArc` offers appear only at safe beat boundaries, never inside action adjudication. | Mid-action sales language, bait, or an interrupting menu. |
| **11. Personality is post-adjudication.** | Voices can vary diction, cadence, and surface framing over equivalent semantic plans. | Personality-dependent outcomes or receipt rules. |
| **12. Kid Mode is a stricter contract.** | Use plainer repair, safer defaults, no pressure, and explicit boundaries. | Transplanting adult flirtation, menace, or engagement tactics. |
| **13. Be brief where the player needs to act.** | Keep the next actionable opening singular and clear. | Monologuing after a question or asking several questions at once. |
| **14. Do not market infinite memory.** | Expose provenance and correction mechanisms; retrieve only relevant supporting context. | “We remember everything” claims or unbounded context dumps. |

## Reconciliation with the existing Vibe Constitution

The Vibe Constitution concerns *how a valid turn feels*. This constitution adds a rendering and interaction discipline; it **does not weaken the ledger**. `StateTx` remains the only pathway for state changes. `SceneManifest` remains the current local narrative plan. The renderer receives a **semantic render plan**, not permission to infer canonical facts. This matches public patterns in interactive fiction, where state and conditional flow guide visible text, while the reader sees natural prose rather than implementation scaffolding. [R09] [R10]

> **Design axiom:** A warm sentence may frame a truth. It may not create one.

## Release gate

A build cannot call itself “fluid GM chat” if any of the following fail: a material clause is unaddressed; an irreversible state change lacks an accepted receipt; a correction loses the original input; a direct question is ignored; a voice fixture changes semantic output; or Kid Mode produces pressure rather than a clear, safe boundary.

See [F3_turn_protocol_spec.md](F3_turn_protocol_spec.md), [F4_prose_good_bad.md](F4_prose_good_bad.md), [F6_repair_copy_bank.csv](F6_repair_copy_bank.csv), and [F11_fluid_chat_eval_fixtures.json](F11_fluid_chat_eval_fixtures.json).

## References

See the shared [citation register](citations.md). Public conversation-design guidance emphasizes relevance, context, short recovery, and clear handoff; public interactive-fiction tools demonstrate visible prose separated from underlying state and routing. [R01] [R09] [R10]
