# SynapticGM — Executive Win Conditions Memo

**As of:** 2026-08-18 (GMT+1)  
**Status:** Fresh research + supplied product snapshot; no live build, screenshots, or telemetry were available. Claims about SynapticGM are therefore marked **EVIDENCED BY SNAPSHOT** or **UNVERIFIED**, not observed behavior.

## Decision

**SynapticGM can win, but only if it makes a ledger-first causal chain visible and demonstrably durable.** The category already contains serious products with memory/context machinery, editable lore, structured game state, player-managed campaign data, AI-assisted tabletop workflows, and relatively transparent usage gates. AI Dungeon publicly documents summaries, embedding-based memory retrieval, context tiers, and manual summary correction after historic edits. Friends & Fables publicly documents player/AI context blocks, retrieval over lore/memories/entities, and manual context intervention when automated relevance misses. Hidden Door publicly describes a structured engine maintaining character/item/location state alongside authored beats. [1] [2] [3]

The result is not an empty market. The defendable promise is narrower and stronger:

> **“When you say what happened, SynapticGM can show what became true, why the game accepted it, what it changed, and how that survives.”**

That promise must be provable in a first session, at turn 100, after a correction, and after a return from a save. A private ledger moat that looks like generic chat is not a moat.

## Five Camera-Proof Differentiators

| Proof clip | What the player sees | Why it beats category expectations | Release gate |
|---|---|---|---|
| **1. Correction survives** | Player corrects a core fact, sees a concise confirmation, reloads, and gets the corrected fact with provenance. | Competitors may expose summaries/context controls; durable player-authoritative correction is a clearer trust demonstration. | No correction loss in golden trace, replay, recap, or HUD. |
| **2. “Why?” causality** | A combat result, quest marker, or inventory change opens a human-readable cause chain. | Shows fair consequence rather than model confidence. | Receipt/state reconciliation is exact; no internal jargon. |
| **3. Freeform refusal of a hook** | Player ignores the obvious quest, acts elsewhere, and later sees the offer remained optional. | Proves the GM heard the action rather than steering to a script. | IntentContract covers the action first; HookArc remains soft. |
| **4. Kit truth under pressure** | Player claims a missing tool; UI calmly shows the actual kit and offers legal options. | Converts continuity from a back-end abstraction into a memorable moment of fairness. | No invented asset, negative count, or prose/HUD divergence. |
| **5. Voice changes without reality changing** | Same state/action replayed under two voices has different prose but identical fact hash and receipt. | Demonstrates personality without sacrificing trust. | Style packet has no adjudication authority. |

## What to Ship Before Seeking More Architecture Research

Ship a small adult-web closed beta only when the five proof clips can be captured without retakes and the P0 fixtures pass. The paid experience should be framed as **more capacity and richer presentation, not payment to repair broken continuity.** Public competitors have normalized tiered context/memory, credits, free-turn limits, or feature gates; the commercial question is not whether to gate, but whether the gate is visible before it interrupts an action. [4] [5] [6]

The highest-value build sequence is:

| Rank | Build outcome | Done when |
|---|---|---|
| 1 | **One player-visible source of truth** | Current kit, identity, quest status, and “Why?” all trace to accepted StateTx/revision; retrieval never determines fact. |
| 2 | **Correction and stale-write integrity** | Revision, reload, retry, and two-tab conflict fixtures are green; no speculative draft renders against an old revision. |
| 3 | **Intent/obligation clarity** | Player can ignore a hook, make a three-part freeform action, and see every part resolved, blocked, clarified, or deferred. |
| 4 | **Fairness and safety proof** | Combat receipt matches state; Kid Mode redirects safely; internal leak scanner blocks jargon; kill switches preserve text play. |
| 5 | **CostEvent instrumentation before scale** | Each attempted and accepted action has attributable cost, retries, cache, images, safety, entitlement, and outcome labels. |

## Non-Negotiables

The audit preserves the supplied product law: **player correction → pinned canon/opening invariant → accepted StateTx → SceneManifest → supporting evidence → draft invention.** Retrieval, summaries, and voice must remain supporting tools. No recommendation here calls for WOF, hybrid climate, patent work, MMO redesign, or building a proprietary general-purpose narrator now. Warden GPU work remains a later, measured decision—not a premise.

A Kid Mode filter must not be marketed as a complete children’s product posture until legal review covers audience, age/knowledge, consent, data, ads, SDKs, retention, parental tools, and jurisdiction. The FTC’s COPPA materials illustrate why filtering alone cannot settle those questions. [7]

## Immediate Founder Message

Stop collecting more generic “AI memory” ideas. Run the supplied 90-minute test tonight. If testers cannot independently say **“it kept my correction,” “it showed why,” and “it let me do my thing,”** then make those visible before adding content volume, model changes, or GPU speculation.

## References

[1]: https://help.aidungeon.com/faq/the-memory-system "AI Dungeon — All About the Memory System (accessed 2026-08-18)"
[2]: https://help.fables.gg/articles/8560008-working-context-blocks "Friends & Fables — Working Context Blocks (accessed 2026-08-18)"
[3]: https://www.hiddendoor.co/help/faq "Hidden Door — FAQ (accessed 2026-08-18)"
[4]: https://help.aidungeon.com/memberships-benefits "AI Dungeon — Memberships & Benefits (accessed 2026-08-18)"
[5]: https://fables.gg/pricing "Friends & Fables — Pricing (accessed 2026-08-18)"
[6]: https://www.hiddendoor.co/pricing "Hidden Door — Pricing (accessed 2026-08-18)"
[7]: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions "FTC — Complying with COPPA: Frequently Asked Questions (accessed 2026-08-18)"

[Back to project index](../README.md)
