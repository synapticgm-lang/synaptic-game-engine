# F9 — Streaming, latency, and “alive” chrome: v1 closed-beta decision memo

## Decision

**Ship guarded post-commit streaming in closed beta.** Do not stream raw model output before adjudication, permit checks, `StateTx` acceptance, and semantic-plan validation. Start streaming only after `turn.committed`; emit sentence-safe or paragraph-safe chunks; preserve the player bubble on abort. This protects correction, receipt integrity, and content review while retaining the perception that the GM is present.

This is a **SPECULATIVE product decision**, not an inference about any competitor. The technical basis is that streaming APIs expose typed lifecycle events but make partial-output moderation harder. [R05]

| Option | Benefit | Risk | Decision |
|---|---|---|---|
| Full response only | Simple and safe commit boundary | Long waits feel inert; no progressive reading | Keep as fallback / accessibility preference |
| Raw token streaming | Fastest perceived start | Half-sentences, pre-commit contradiction, moderation and cancel ambiguity | Refuse |
| Post-commit sentence streaming | Perceived aliveness plus plan integrity | Small first-token delay; buffering implementation | **Ship** |
| Paragraph streaming only | Clean reading cadence | Feels slow for long set-pieces | Use on mobile / low-bandwidth preference |
| Hybrid prose + live receipts | Rich transparency | Chrome can interrupt story | Receipts remain after prose unless player opens `Why?` |

## Timing model

| Time window | UI | Semantics |
|---|---|---|
| 0–300 ms | Player bubble locks visually; send icon confirms receipt. | No claim that the system understands yet. |
| 300–900 ms | Subtle “Reading your move…” if still pending. | Intent parsing only. |
| 0.9–2.5 s | “Resolving the scene…” if still pending. | Adjudication / checks; no fictional progress status. |
| Commit | Status fades; first prose begins when sentence boundary is ready. | State and semantic plan locked. |
| >8 s no commit | “This scene is taking longer than usual. Your move is safe.” | Offer cancel/retry with input preserved. |
| Streaming | Small caret at current paragraph end. | No new state beyond committed plan. |

The specific timings are provisional UX targets requiring device and network measurement. Do **not** fake a “GM is thinking” animation with changing story content. Public research on conversation identifies timing and handoff as meaningful, but does not prove these exact thresholds. [R15] [R17]

## Cancellation semantics

| Player action | Before commit | During stream | After complete |
|---|---|---|---|
| Cancel | Cancels request; keeps original bubble and draft intent; no StateTx change. | Stops display; keeps committed turn as `display_aborted`, resumable from first unread sentence. | No-op; edit/regenerate under existing product rules. |
| Retry | Re-run adjudication only if state snapshot unchanged; otherwise repair. | Resume same body or render alternate prose from same plan; never reroll silently. | Offer regeneration only when it cannot alter accepted facts. |
| Edit player input | Replaces pending message. | Opens correction / fork path; cannot silently overwrite committed consequence. | New turn or explicit correction. |

## Chrome rules

| Surface | Desktop | Mobile |
|---|---|---|
| Progress | One compact line below player bubble; never overlays prose. | Same line; omit if response begins fast. |
| Receipt | Chip row below GM prose, collapsed by default. | Horizontal chip; `Why?` opens bottom sheet. |
| Cancel | Text button after 2 seconds pending. | Icon + accessible label after 2 seconds pending. |
| End-of-turn | No generic “What do you do?” card. | Same; use a diegetic pressure or a single accessible action affordance. |

## Experiment design

Randomize at the **session** level between full-response and post-commit streaming. Measure time-to-first-readable-sentence, turn completion, voluntary interruption, repair rate, perceived fairness, “felt heard,” and whether players can correctly report a material state change. Reject streaming if it increases misunderstood commits, state-recall errors, or safety complaints even if engagement rises.

## References

See [citations.md](citations.md). [R05] [R15] [R17] [R18]
