# V7 — Themes, Typography, and Audio-Lite

## Theme is a state language, not a cosmetic mask

Every theme must preserve one shared semantic vocabulary: **confirmed canon**, **current state**, **observed evidence**, **uncertain inference**, **player correction**, and **new invention**. Theme kits may change material, frame shape, animation character, and font personality, but cannot remap or hide that vocabulary. Important distinctions use text label plus icon/shape and, where useful, motion or audio—not color alone. Game accessibility guidance and WCAG both support redundant channels, readable text, scalable UI, and user-controlled pacing. [1] [2]

| Semantic state | Default label | Theme may vary | Must remain stable |
|---|---|---|---|
| Player correction | `Corrected by you` | Seal, stitch, ink, rune. | Clear source and supersession. |
| Pinned canon | `Pinned canon` | Archive tab, banner, field note. | Readable permanent/active status. |
| StateTx | `Changed` | Gear shift, ledger pulse, quest notch. | Exact delta available on inspect. |
| Evidence | `Observed` | Lens, footprint, witness mark. | Not presented as certainty beyond its support. |
| Invention | `Unconfirmed` | Mist, dotted line, faint notation. | Never visually indistinguishable from canon. |

## Typography guidance

Choose a readable default body face and let themes express voice principally through display treatment, rules-panel chrome, and section rhythm. Do not use decorative type to encode a critical mechanic.

| Layer | Rule | Player control |
|---|---|---|
| Main prose | Comfortable line length; generous leading; high contrast. | Text scale and reading width. |
| System notices | Short, clear, stable hierarchy. | Density and summary mode. |
| State receipts | Distinct but non-intrusive. | Persistent / auto-dismiss / screen-reader announce. |
| Evidence labels | Plain language and clear uncertainty. | High-contrast and reduced-motion variant. |
| Kid Mode | Larger defaults, simpler vocabulary, fewer concurrent labels. | Caregiver-appropriate accessibility settings. |

Run each theme through grayscale, 200% text scale, screen reader, muted audio, reduced motion, and narrow-device checks. Text must not be a timing gate; replay and pause should be available for narrative instructions. [1]

## Selective TTS policy

TTS can improve access, intimacy, and delivery of a **memorable line**. It can also erode pace, introduce pronunciation/quality failures, constrain private play, and burn cost if treated as default narration. Use it as an opt-in accessibility and atmosphere feature, never as a truth channel.

| Use case | Recommendation | Guardrail |
|---|---|---|
| Main story prose | Off by default; opt-in replay or “read scene” mode. | Text equivalent always primary and complete. |
| Critical System receipt | Short optional spoken cue only. | Same information visible in text; distinct sound. |
| NPC introduction / milestone | Candidate for selective TTS. | Trigger after actual StateTx/scene threshold, not every turn. |
| Long combat | Avoid continuous readout. | Offer summary/replay instead. |
| Kid Mode | Opt-in, clear controls, no persuasive voice personality. | No hidden audio, external prompts, or pressured engagement. |

## Optional ambient one-liners

Ambient writing is a **thin wedge**, not a dialogue generator. It can appear at a shop, camp, transit hub, or repeated location when a player pauses there. It must be short, skippable, source-appropriate, and never masquerade as evidence.

**Policy:** maximum one ambient line per non-combat pause; suppress after a player has seen the same semantic fingerprint; do not introduce quests, characters, price changes, world facts, or offers without an authorized hook; no external notification or ad coupling. If ambient copy implies a fact, tag it as rumor or character speech rather than system truth.

## Cadence and interruption budget

Classify effects as `blocking`, `actionable`, `passive`, or `digestible`. Only safety, consent, and imminent state-loss risks may block. Bundle ordinary receipts at the end of a resolution. Queue optional theme/help/recap controls for a scene boundary. Notification research links interruptions with resumption cost and reduced performance; permission should follow demonstrated value and be easily reversible. [3] [4]

**SPECULATIVE:** The default theme palette and exact TTS trigger thresholds require qualitative testing, including accessibility participants and household/privacy context.  
**COUNSEL:** Speech data handling, age-assurance, and accessibility compliance require legal and platform review before shipping.

## References

[1]: https://gameaccessibilityguidelines.com/full-list/ "Game Accessibility Guidelines"
[2]: https://www.w3.org/WAI/WCAG22/quickref/ "W3C — WCAG 2.2 Quick Reference"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10244611/ "Ohly & Bastin — Effects of Notification Interruptions"
[4]: https://www.nngroup.com/articles/push-notification/ "NN/g — Five Mistakes in Designing Mobile Push Notifications"
[5]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "UK ICO — Age Appropriate Design Code"
