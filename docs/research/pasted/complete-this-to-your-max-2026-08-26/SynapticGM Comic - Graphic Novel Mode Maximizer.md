# SynapticGM Comic / Graphic Novel Mode Maximizer

**LIVE consumer app only · Research and build package · 26 August 2026 · Manus AI**

## Ten-line executive

> 1. **Ship comic-lite this month:** one hosted Klein scene-art plate on selected committed beats, always paired with existing HTML/SVG lettering, plus comic chrome around valid Memorable plates.
> 2. **Keep Director hard-disabled for P0** and replace its planning role with deterministic BeatSpec and layout templates; accept GM `<panel>` tags only when they are well formed, within budget, safe, and rebound to ledger truth.
> 3. **Never wait for art:** commit text and ledger first, keep input live, show a pending tile, and degrade to prose, Memorable chrome, or a deterministic portrait/background composite on failure.
> 4. **Treat overlay lettering as settled architecture:** live images contain no dialogue, captions, SFX glyphs, logos, watermarks, or UI; export may bake overlays only after the fact.
> 5. **Make Free “comic-lite,” not every-turn comic:** target one Klein panel on about 20% of eligible committed beats, after thin-turn, duplicate, Kid, capacity, and operations skips.
> 6. **Use references carefully:** current OpenRouter endpoints accept up to four references on Klein and eight on Pro, but references improve probability rather than providing a pixel-perfect face or costume lock.[18] [19]
> 7. **Bind consistency to canonical fields first:** roster, equipped slots, visible injury state, place anchors, action boundary, and revision ID outrank style technique; a stored seed is an experiment control, not an identity lock.[7]
> 8. **Validate one panel before strips:** P1 adds conservative two-panel action/reaction and dialogue/reaction cards, then selective three-panel pages only if adherence, retry, latency, preference, and COGS gates hold.
> 9. **Make alternatives first-class:** kinetic typography, Memorable chrome, deterministic composites, asynchronous recaps, and a capacity-metered “illustrate this beat” control remain valuable even if full comic never clears its gates.
> 10. **Do not build near-term:** every-turn multi-panel webtoon, a Continuity-Warden/second critic, live baked lettering, Free-player LoRA, protected-style imitation, player BYOK as the primary path, or any art-to-ledger feedback loop.

## A) Gap analysis vs industry comic generators — technique shapes only

SynapticGM should not compete with offline authoring suites on “generate a whole comic from one prompt.” A live game has a stricter problem: it must preserve committed story state, return control immediately, and bound spend. Public creator workflows expose useful **technique shapes**—format-specific layout banks, shot contracts, local repair, reference conditioning, viewport preview, and layered composition—but their autonomous script expansion and whole-page generation are unsafe defaults for live play.

| Public technique family | Effect bought | Public method | Cost/latency implication | Consistency failure mode | What SynapticGM should steal as a technique | What SynapticGM must never copy |
|---|---|---|---|---|---|---|
| Vertical-scroll creator tools | Mobile readability, pacing, and dramatic pause | Panels are arranged mostly top-to-bottom; inter-panel space changes perceived rhythm; creators preview the visible phone area and split a long production canvas only for publication.[1] | DOM layout is effectively free; every additional generated panel remains a paid job | Rhythm breaks when panels are too tall, gaps are arbitrary, or text density exceeds a phone viewport | A responsive DOM stack, semantic `compact/standard/pause` gutters, mobile viewport fixtures, and independently repairable panels | One baked tall image; universal pixel gutter “standards”; creator-platform upload dimensions treated as live-app requirements; text baked into art |
| Layout-first AI comic tools | Fast concept-to-page flow and local iteration | Public systems separate a story/planning layer from replaceable rendering; tools advertise format selection, character setup, panel generation, local revision, reference sheets, LoRA, and editable lettering.[2] [3] | Planning is cheaper than image generation; local panel replacement avoids re-spending on correct neighbours; reference and LoRA paths add compute and storage | Autonomous breakdown invents beats; identity, clothing, and place drift; whole-page generation couples failures | Accepted BeatSpec → pointer card → PanelSpec → hosted render → editable overlay; one-panel repair | Vendor asset libraries, private code, protected style presets, autonomous planner authority, all-in-one live pages, or “unlimited regeneration” economics |
| Official reference-image workflows | Better recurring-subject resemblance and visual-theme stability | Comparable public systems distinguish subject reference from style reference, expose strength controls, and recommend text prompts alongside references; seeds are documented as weak experiment controls, not identity storage.[5] [6] [7] | Conditioning can raise compute and disable other edit modes; seed storage is cheap | Fine details, clothing, and multi-character binding drift; references can conflict with text; high strength can distort | Rights-cleared character/place references where the chosen endpoint supports them; original technique boards; seed logging; provider-neutral priorities | Seed-as-identity claims; unlicensed references; franchise/living-artist targets; foreign provider flags leaked into product prompts |
| Storyboard and script-to-shot systems | Inspectable conversion from text to shots, camera control, and local revision | Public storyboard workflows go from script to shot list to one image per shot, with editable intermediate stages and bounded camera choices.[4] | Shot metadata is cheap; local repair controls re-spend | A shot planner can add uncommitted action, props, damage, or cinematic “improvements” | A deterministic shot contract containing role, roster, place, kit, action boundary, camera family, and overlay-safe zone | Assuming another product's 3D camera exists in Klein/Flux; letting camera planning decide story outcomes |
| Academic reading-order and closure research | Predictable reading path and meaningful panel transitions | Readers commonly expect an LTR/downward path, while separation, overlap, blockage, and irregularity can redirect order; **closure** is the reader's inference of unseen movement or change across gutters.[9] [10] | Conservative layout rules are cheap; visual interpretation in the live path is not | Decorative pages scramble order; images imply the wrong bridge between states | Monotonic LTR/top-to-bottom templates; encode the state change in accepted text/ledger; depict approved boundary states | Overlaps, blockers, and decorative insets in P0/P1; image interpretation as canonical truth |
| Modular visual-narrative generators | Reusable sequence, composition, transition, and render layers | Research prototypes separate narrative role, panel composition, inter-panel transition, overlays, and rendering.[11] | Deterministic rule layers are cheap and testable | A generative action layer may select content not present in the story | Map committed beats to establishing/action/reaction/reveal/aftermath/dialogue/transition roles; role selects presentation only | Sample assets or any refinement layer that creates entities, actions, outcomes, wounds, or places |
| Visual-novel and VTT layering | Immediate visual storytelling from reusable assets | Public engines separate backgrounds, tagged portraits/sprite attributes, UI text, foreground layers, positioned tiles, z-order, opacity, and stored scene state.[12] [13] [14] [15] [16] | Near-zero marginal model spend after assets are cached | A stale layer can preserve the wrong character, weapon, wound, or place; attribute combinations may conflict | Deterministic Free fallback; atomic scene replacement; mutually exclusive equipped-slot layers; explicit z-order and cache keys | Treating visual state as canonical; speculative image generation during preload; showing an absent prop merely because an asset exists |

### A.1 Verdict

**Where SynapticGM is behind.** It lacks a validated layout bank, local panel repair UX, reference-conditioned character/place workflow, deterministic fallback library, mobile pacing fixtures, and tier-aware economic policy. Its text-only `visualConsistency` block cannot reliably bind multiple recurring characters, equipment, and places across changing shots. The unreliable GM `<panel>` fallback also couples story wording to presentation markup without a guaranteed planning contract.

**Where SynapticGM is ahead.** It already has the architecture a live game most needs: text/ledger truth, separate HTML/SVG lettering, post-commit non-blocking jobs, explicit Kid pre-spend policy, hard panel budgets, and a hosted player path. Research showing that gutters require reader inference and that neither image nor text alone solved the tested comic narrative tasks reinforces the decision to keep accepted text authoritative.[10]

**Highest-leverage gaps for hosted Klein/Flux.** First, replace Director dependence with deterministic BeatSpec/layout templates. Second, send rights-cleared references only through capability-checked model adapters. Third, add immutable overlay receipts and local panel repair. Fourth, provide a deterministic portrait/background composite when generation is skipped or fails. Fifth, measure eligible-turn and paid-retry rates before widening panel frequency.

## B) Recommended pipeline — end to end

### B.1 Player-facing contract

A player chooses **Classic** or **Comic**, then paged or webtoon layout and a frequency policy. Comic settings do not promise an image every turn. When an accepted beat is eligible, the UI renders canonical text and choices immediately and may show a pending art tile. Input remains available. A completed image replaces only that tile if its job still matches the current beat revision. A failed, stale, unsafe, or contradictory image collapses to prose, comic chrome, a valid Memorable plate, or a deterministic composite.

Repair controls are literal. **Retry art** repeats the approved PanelSpec; **Simplify art** reduces roster or camera complexity; **Use portrait scene** selects deterministic composition; **Hide art** keeps the story and overlays. None changes accepted dialogue, outcome, injury, inventory, relationship, or location.

### B.2 System pipeline

| Stage | Input | Deterministic work | Optional model work | Hard output or guardrail |
|---|---|---|---|---|
| 1. Commit truth | Accepted GM/player turn and ledger delta | Commit text, speaker IDs, entity IDs, place ID, equipped slots, safety class, and revision ID | None | Play continues if every later stage fails |
| 2. Eligibility gate | Committed beat metadata, tier, settings, capacity, Kid result, recent-art history | Apply skip rules, kill switch, panel budget, caps, and duplicate suppression | None | Ineligible beats spend zero |
| 3. Select plan source | Valid GM tags or deterministic BeatSpec | Enforce source precedence; reject unsafe, inventive, or over-budget tags | Optional P1+ light planner | Bounded PanelPlan with one to three approved panels |
| 4. Select pointer card | Beat roles, layout mode, panel count | Choose card ID, explicit reading order, gutter token, camera family, and permitted anchors | None | No overlap/blockage in live P0/P1 cards |
| 5. Compile PanelSpec | Ledger entities/place/kit plus card | Bind roster, action boundary, references, aspect ratio, text-safe zone, and negatives | None | Immutable, schema-valid art contract; no prose invention |
| 6. Kid/safety preflight | PanelSpec and accepted text | Rewrite camera/framing or skip before capacity reservation and provider call | Existing safety service if already part of product, not a continuity critic | Safe PanelSpec or zero-spend fallback |
| 7. Compile pure-art prompt | PanelSpec, `visualConsistency`, original technique bundle | Emit ordered visual sections and `PURE_ART_DIRECTIVE`; adapter maps supported fields | None | No dialogue, captions, SFX glyphs, logos, watermarks, or UI |
| 8. Reserve and enqueue | Model tier, request ID, capacity record | Atomic idempotent reservation, then post-commit job | Hosted OpenRouter image endpoint | No double debit; story and input are already live |
| 9. Generate and transport-check | Prompt, optional references, seed, aspect ratio, output format | Capability allowlist, timeout, retry class, provenance, and revision check | Klein 4B or Pro | One image per request; late/stale result never attaches |
| 10. Present image plus overlay | Accepted text and current valid asset | Render `ComicGrid` and `SpeechBubble`/`NarrativeText`/`ActionOverlay`; bind utterance and speaker IDs | None | Overlay is canonical, legible, accessible, and independent of pixels |
| 11. Repair or degrade | Failure reason, complexity, capacity | Retry once if transient; simplify/composite if semantic; collapse if exhausted | Optional paid retry by tier | No hidden loop, no new fact, bounded spend |
| 12. Reuse and recap | Validated panels/Memorable plates and provenance | Cache by entity/place/revision/technique family; invalidate on relevant change | Optional later recap generation | Corrected or superseded art cannot reappear |

### B.3 Panel-plan source precedence

| Situation | Source | Rule |
|---|---|---|
| Committed GM response contains well-formed `<panel>` tags that parse, reference only accepted roster/place/kit/action, fit `panelBudget`, and pass safety | **Validated GM tags** | Tags may supply candidate beat role and visual intent, but canonical fields are rebound from the ledger. Unknown entities, outcomes, wounds, or excess panels invalidate the art plan—not the story turn. |
| Tags are absent, malformed, unsafe, contradictory, over budget, or too verbose | **Deterministic BeatSpec plus layout bank** | Select one salient committed beat and map it to an approved one-, two-, or three-panel role sequence. This is the P0/P1 default. |
| Future Mid/High experiment has passed strip gates | **Optional light presentation planner** | It may choose approved beat roles, cards, and camera families under a strict schema. It cannot add nouns, actions, outcomes, damage, or text. Failure falls back to templates. |
| No eligible visual beat or no capacity | **No generated PanelPlan** | Show prose, comic chrome, a semantically valid Memorable plate, or a deterministic portrait/background scene. |

### B.4 Director decision

**Keep Director hard-disabled for P0.** Re-enabling it would add latency, spend, nondeterminism, and a second failure surface before the image path is trustworthy. Deterministic BeatSpec and layout templates replace its P0 presentation-planning function.

In P1, a light planner may be tested on Mid/High only, behind an experiment flag and strict ledger binding. It is neither a Continuity-Warden nor a truth critic. It may select a template and camera family; it may not create content. If it does not beat deterministic templates on player preference, roster/place/kit adherence, repair rate, latency, and COGS, it stays off.

### B.5 Classic and Memorable reuse

Classic and Memorable share **presentation chrome**, not comic layout behavior. A Memorable opener or rare plate may receive the same accessible caption/bubble/receipt components, border treatment, zoom, and pending/error state. Classic remains prose-first, never becomes a multi-panel page, and never mounts `ComicGrid`. This gives P0 broad UX reuse without harming Classic players.

### B.6 Failure semantics

Transport errors, timeouts, moderation blocks, malformed responses, and provider outages show a non-blocking failure/composite state. Semantic contradictions—extra NPC, wrong weapon, wrong place, impossible wound, or unsafe Kid framing—are prevented through constrained inputs and exposed through human rollout review or player repair; they do not justify a second live critic model. Art is never parsed back into the ledger.

## C) Character consistency techniques for hosted OpenRouter Klein/Flux

The achievable target is **recognisable enough to trust**, not pixel-perfect identity. OpenRouter's current image API exposes model and endpoint capability records rather than one universal feature set.[17] The current Klein endpoint accepts up to four input references, while Pro accepts up to eight; both support seed, fixed aspect-ratio choices, PNG/JPEG output, and exactly one image per request.[18] [19] The Klein model card still warns that output may miss the prompt, distorted text may appear, and prompting style materially affects results.[20]

### C.1 Ranked practical methods

| Rank | Method | Effect bought | Limits and degradation modes | Cost/latency | Recommendation |
|---:|---|---|---|---|---|
| 1 | **Canonical costume/kit lock fields** | Protects trust-sensitive weapon, armour, clothing, carried item, and visible injury state | Model may omit, duplicate, swap, or attach an item to the wrong person | Negligible compiler cost | All tiers, every generated panel; equipped slots are hard prompt fields |
| 2 | **Structured prompt locks (`visualConsistency`)** | Stabilises count, silhouette, age band, face/hair cues, palette, body type, kit, place, and lore anchors | Long prose dilutes salience; similar people merge; detail falls with camera/pose changes | No extra model call | All tiers; compile ordered canonical sections instead of free prose |
| 3 | **Rights-cleared reference sheet or portrait** | Stronger resemblance for focal character, object, or place than text alone | Fine detail, hands, logos, costume geometry, and multi-character binding still drift; references can conflict | Payload, storage, moderation, and possible retry overhead | Mid/High first; begin with one clean focal reference |
| 4 | **Deterministic sprite/portrait composite** | Exact reuse of approved portraits, backgrounds, and selected equipment layers | Limited pose vocabulary; library needs rights-managed asset work | Near-zero marginal COGS and low latency after setup | Free default fallback and all-tier outage/skip path |
| 5 | **Seed storage** | Auditability and controlled same-contract experiments | Seeds do not store a character or style and may change with prompt/model/settings.[7] | Negligible when supported | Store opportunistically; never expose as identity lock |
| 6 | **LoRA or fine-tune later** | Potentially stronger association for original recurring characters or a house technique | Rights, consent, data quality, deletion, versioning, safety, routing, and overfit burden | Training and serving cost; slow setup | P2+ Admin/High experiment only after references and composites are measured |

### C.2 Prompt-lock contract

| Section | Required fields | Compiler behaviour | Failure preference |
|---|---|---|---|
| Canonical roster | Stable entity ID, appearance description, age band, silhouette, skin/hair/face cues, body type | Emit only characters in the committed beat; state exact count and focal subject | Omit a secondary person rather than add an unknown one |
| Kit and weapon | Equipped slot IDs, material/colour/shape, handedness if canonical, visible carried item, approved injury marker | Repeat focal equipment near both person and action clauses; forbid substitutes | Show less kit rather than wrong kit; no uncommitted wound |
| Place | Stable place ID, three to five persistent environmental anchors, committed time/weather/lighting | Repeat unique anchors; remove generic clutter that invites invention | Neutral background rather than wrong landmark |
| Beat boundary | Approved visible state before/after action, not inferred consequence | Depict one frozen moment and one camera intent | No new damage, defeat, transfer, opened door, or discovered NPC |
| Composition | Shot size, angle family, focal order, negative-space anchor, aspect ratio | Use bounded tested tokens | Simpler shot if roster and overlay cannot fit safely |
| Technique | Original palette, medium, line, light, texture, depth, screentone/ink/cel tokens | Select one internal rights-cleared bundle; never a franchise or living artist | House-neutral technique |
| Hard negatives | Text, letters, captions, bubbles, SFX glyphs, logos, watermarks, extra people, duplicate limbs, sexualised framing, gore glamour | Adapter translates into supported provider semantics | Kid rewrite/skip before spend; hide output if leakage occurs |

### C.3 Reference-image policy

Start with **one reference per focal panel**, although the endpoints permit more.[18] [19] Available slots are not equivalent to reliable identity binding. A usable reference is an original or rights-cleared portrait/sheet with a neutral pose, stable palette, no embedded text, no protected marks, and the default kit. The registry records source/owner, licence or consent, model-use permission, character/place ID, version, crop, safety state, and deletion/retirement state.

A second reference may represent a signature item or place only when fixtures show an adherence gain without subject mixing. Avoid multi-character sheets in P1. When two named characters matter, prefer an over-the-shoulder shot or split action/reaction panels over a crowded full-body group.

### C.4 Recommended stacks by tier

| Tier | Baseline stack | Eligible complexity | Repair path | Honest promise |
|---|---|---|---|---|
| **Free** | Canonical prompt locks + equipped-slot lock + optional seed + Klein on sparse beats; deterministic composite for skip/failure | One focal person preferred; at most two approved people in a simple shot; one generated panel | One transport retry if idempotent; otherwise simplify to composite/chrome | “Recognisable recurring look on selected moments,” not face lock |
| **Mid** | Free stack + one rights-cleared focal reference; optional place/item reference after evaluation | One or two people; validated two-panel action/reaction; rare three-panel page only after gates | At most one paid semantic repair within cap; split group scene into focal/reaction | “Improved recurring character and kit resemblance” with visible fallback |
| **High** | Mid stack + Pro for hero/reveal/repair; small tested reference bundle | Validated two-character hero shots, two-panel strips, selective three-panel pages; four/six are recap/export | One selective Pro escalation, then deterministic fallback | “Highest available adherence and local repair,” never pixel-perfect identity |

### C.5 Consistency gates

| Method | Gate before widening | Kill or downgrade condition |
|---|---|---|
| Prompt locks | At least 95% correct roster, place, and major weapon in sampled simple plates | Major contradiction exceeds 5% or displayed-panel repair/hide exceeds 15% |
| Focal reference | Practical blind-review identity uplift over prompt-only without more contradictions | Marginal uplift, material latency/cost increase, or more kit/place errors |
| Multiple references | Two-character trait binding holds across tested camera families | Systematic face, clothing, or weapon swap |
| Seed reuse | Same-contract retry produces useful controlled variation | Provider does not honour seed or reruns remain unrelated |
| Deterministic composite | Correct canonical bindings and fast load on target devices | Stale state, impossible attribute combination, or accessibility failure |
| LoRA | Rights-complete data, deletion/version path, isolated model, clear uplift | Rights uncertainty, training leakage, overfit, or excessive operating burden |

**Recommendation:** canonical fields first, reference images second, deterministic reuse always available. Do not spend P0 on LoRA. Reduce the consistency problem through composition policy: fewer people, simpler cameras, one visible action boundary, explicit kit slots, and separate action/reaction panels.

## D) Panel layout banks — original pointer cards

### D.1 Shared vocabulary and selection laws

Every card has an explicit order. **Paged LTR** fills left-to-right, then top-to-bottom. **Vertical** fills only top-to-bottom. Optional RTL is a separately tested future bank, not an automatic CSS mirror, because camera entry, bubble tails, and overlay anchors also require semantic remapping. Research supports conservative early layouts: overlap, blockage, and large grid departures can redirect readers.[9]

Lettering zones are reservations, never instructions to put text in pixels. They use only the existing anchors: `top-left`, `top-right`, `bottom-left`, `bottom-right`, and `bottom-center`. Prompt compilation asks for low-detail negative space there; HTML/SVG overlays occupy it later. If the art fails to preserve space, the overlay adds its own contrast scrim or moves only to a card-approved fallback.

| Gutter token | Meaning | Selection rule |
|---|---|---|
| `compact` | Immediate time, rapid exchange, or one continuing action | Adjacent panels share place, roster, and moment |
| `standard` | Normal beat boundary | Default for dialogue, reaction, and small changes |
| `pause` | Reflection, reveal, aftermath, or scene transition | Use sparingly; never separate two halves of one required action |

### D.2 Two-panel cards

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones | Use when | Do **not** use when |
|---|---|---|---|---|---|---|
| **Equal Echo** | `P2-LTR-EQUAL-ECHO`; two equal side-by-side panels; `standard` | 1 left → 2 right | P1 medium/wide establishes; P2 matching medium or close reaction; preserve screen direction | P1 `top-left`, fallback `bottom-left`; P2 `top-right`, fallback `bottom-right` | Dialogue/reaction, question/answer, simple before/after | Phone makes panels too narrow; more than two speakers; vertical action needs height |
| **Lead and Answer** | `P2-LTR-LEAD-ANSWER`; 60% left + 40% right; `compact` or `standard` | 1 left → 2 right | P1 wide/medium action; P2 close reaction or detail | P1 `top-left`/`bottom-left`; P2 `top-right`/`bottom-center` | Action/reaction, reveal/detail, speaker/listener | Panel 2 needs a complex outcome, full-body pose, or two required people |
| **Approach and Reveal** | `V2-APPROACH-REVEAL`; two full-width vertical panels; `pause` before P2 | 1 top ↓ 2 bottom | P1 wide/over-shoulder approach; P2 medium reveal or object close-up | P1 `top-left`/`bottom-center`; P2 `top-right`/`bottom-right` | Webtoon discovery, door opening, committed identity/place reveal | Ordinary dialogue, look-around spam, or a reveal the art may contradict |
| **Strike and Reaction** | `V2-ACTION-REACTION`; two full-width vertical panels; `compact` | 1 top ↓ 2 bottom | P1 dynamic medium with one focal actor; P2 close reaction/aftermath detail | P1 `top-left`/`top-right`; P2 `bottom-center`/`bottom-right` | One committed action boundary and reaction, at most two people | Complex choreography, invented damage, multiple attacker/target pairs, unresolved outcome |

### D.3 Three-panel cards

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones | Use when | Do **not** use when |
|---|---|---|---|---|---|---|
| **Establish–Exchange** | `P3-LTR-ESTABLISH-EXCHANGE`; full-width top + two equal bottom; `standard` | 1 top → 2 bottom-left → 3 bottom-right | Wide establishment; medium speaker; medium listener/reaction | P1 `top-left`; P2 `bottom-left`/`top-left`; P3 `bottom-right`/`top-right` | Place introduction followed by a two-person exchange | Crowded location, more than two speakers, or an existing valid plate can establish |
| **Act–Witness–Settle** | `P3-LTR-ACT-WITNESS-SETTLE`; three equal columns; `compact`, then `standard` | 1 left → 2 centre → 3 right | Medium action; close witness/reaction; wide/medium aftermath | P1 `top-left`; P2 `top-right`; P3 `bottom-center` | Short action with committed aftermath | Small phone without horizontal paging; heavy dialogue; complex props/place change |
| **Statement–Counter–Decision** | `P3-LTR-DIALOGUE-TRIAD`; wide left + two stacked right; `standard` | 1 left → 2 top-right → 3 bottom-right | Two-shot/medium statement; close counter; close decision | P1 `bottom-left`; P2 `top-right`; P3 `bottom-right`/`bottom-center` | Three-beat dialogue where one statement anchors two short responses | Third panel introduces a new uncommitted action; mobile without paged mode |
| **Enter–Turn–Land** | `V3-ENTER-TURN-LAND`; three full-width vertical panels; `standard`, then `pause` | 1 top ↓ 2 middle ↓ 3 bottom | Wide entry; medium turn/discovery; close reveal/aftermath | P1 `top-left`; P2 `top-right`/`bottom-left`; P3 `bottom-center` | Quiet discovery, approach/reveal/aftermath, emotional descent | Current live webtoon cap; every-turn default; thin/info-only beat; multiple places |

### D.4 Four-panel cards

> Four-panel cards are **P1 recap/prototype cards, not live-turn defaults**. The present live hard ceiling is three panels and webtoon is at most two.

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones | Use when | Do **not** use when |
|---|---|---|---|---|---|---|
| **Steady Four** | `P4-LTR-STEADY-GRID`; conservative 2×2; `standard` | 1 top-left → 2 top-right → 3 bottom-left → 4 bottom-right | Wide/medium/medium/close or stable medium alternation | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-right` | Recap of establish/action/reaction/aftermath; two-speaker dialogue | Live turn under current budget; decorative stagger; multiple place transitions |
| **Header and Three** | `P4-LTR-HEADER-THREE`; full-width top + three equal bottom; `pause`, then `compact` | 1 top → 2–4 left-to-right | Wide chapter/place header; three medium/close beats | P1 `top-left`; P2 `bottom-left`; P3 `bottom-center`; P4 `bottom-right` | Recap opening plus three key beats; valid Memorable plate as header | Header is stale; three narrow panels need dense dialogue |
| **Two Beats, Two Reactions** | `P4-LTR-PAIRED-ECHO`; two rows of two; `compact` within rows, `pause` between | 1 TL → 2 TR → 3 BL → 4 BR | Medium action/statement paired with reaction close-up | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-right` | Compare two parallel committed beats or exchanges | Different places lack explicit transition; visual similarity confuses chronology |
| **Vertical Four-Step** | `V4-FOUR-STEP`; four stacked full-width panels; `standard`, `compact`, `pause` | 1 top ↓ 4 bottom | Wide establish → medium action → close reaction → release | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-center` | Async recap or deliberate emotional cadence | Current live webtoon; ordinary turn; long dialogue causing excessive scroll |

### D.5 Six-panel cards

> Six-panel cards are **P2 recap/export cards only** until explicit gates permit them. Stable IDs are defined now without implying live generation.

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones | Use when | Do **not** use when |
|---|---|---|---|---|---|---|
| **Beat Sheet Six** | `P6-LTR-BEAT-SHEET`; 3 columns × 2 rows; `standard` | 1–3 top LTR, then 4–6 bottom LTR | Establish, initial, rise, peak, reaction, release | P1 `top-left`; P2 `top-right`; P3 `bottom-center`; P4 `bottom-left`; P5 `top-right`; P6 `bottom-right` | End-of-chapter recap with validated images and concise overlays | Six fresh jobs for one live turn; phone page without zoom; crowded panels |
| **Peak Centre** | `P6-LTR-PEAK-CENTRE`; two top, full-width centre, three bottom; `standard`, `pause`, `compact` | 1 TL → 2 TR → 3 centre → 4–6 bottom LTR | Establish, initial, large committed peak, reactions/details, release | P1 `top-left`; P2 `top-right`; P3 `bottom-center`; P4 `bottom-left`; P5 `top-right`; P6 `bottom-right` | Recap where one climax deserves scale; print/export | Centre art unavailable/unvalidated; live generation; outcome uncertain |
| **Three Paired Turns** | `P6-LTR-THREE-PAIRS`; three rows of two; `compact` within pair, `standard` between | Each row left → right, rows top → bottom | Alternating statement/reaction or action/reaction on stable camera axis | Odd panels left anchors; even panels right anchors; final may use `bottom-center` | Dialogue recap or three approved action/reaction pairs | More than two speakers; unexplained location change; repetition without a new beat |
| **Vertical Chapter Thread** | `V6-CHAPTER-THREAD`; six stacked panels; `standard`, `compact`, `pause`, `standard`, `pause` | 1 top ↓ 6 bottom | Establish → initial → action → peak → reaction → release | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-center`; P5 `top-right`; P6 `bottom-right` | Async end-of-chapter recap using reused or off-turn assets | Live play; Kid ad gate; weak chapter; info-only summary; six fresh jobs over cap |

### D.6 Beat-type mapping

| Beat type | Preferred two-panel card | Preferred three-panel card | Recap-only expansion | Gutter default |
|---|---|---|---|---|
| Establishing | `V2-APPROACH-REVEAL` only if reveal follows; otherwise one splash | `P3-LTR-ESTABLISH-EXCHANGE` | `P4-LTR-HEADER-THREE` | `pause` only after real place/time change |
| Action | `V2-ACTION-REACTION` or `P2-LTR-LEAD-ANSWER` | `P3-LTR-ACT-WITNESS-SETTLE` | `P6-LTR-THREE-PAIRS` | `compact` action→reaction; `standard` to aftermath |
| Reaction | `P2-LTR-EQUAL-ECHO` | `P3-LTR-ACT-WITNESS-SETTLE` | `P4-LTR-PAIRED-ECHO` | `standard`; `pause` for earned landing |
| Reveal | `V2-APPROACH-REVEAL` | `V3-ENTER-TURN-LAND` | `P6-LTR-PEAK-CENTRE` | `pause` immediately before reveal |
| Aftermath | One splash or `P2-LTR-LEAD-ANSWER` | `V3-ENTER-TURN-LAND` | `P6-LTR-BEAT-SHEET` | `pause` before final release when earned |
| Dialogue | `P2-LTR-EQUAL-ECHO` | `P3-LTR-DIALOGUE-TRIAD` | `P6-LTR-THREE-PAIRS` | `compact` only for rapid exchange |
| Transition | One splash; `V2-APPROACH-REVEAL` only if both boundary states matter | `V3-ENTER-TURN-LAND` | `V6-CHAPTER-THREAD` | `pause` between place/time states |

A card is selected only after the plan fits `panelBudget`. A panel requiring more than two people, several simultaneous actions, or no safe overlay anchor is simplified or skipped. Four- and six-panel cards may compose recaps from validated assets before they are allowed to trigger new generation.

## E) Cost model — Free, Mid, and High

### E.1 Price basis and formula

Current OpenRouter endpoint records list **FLUX.2 Klein 4B at $0.014 per output megapixel** and **FLUX.2 Pro at $0.030 per output megapixel**; both return exactly one image per request.[18] [19] For an approximately one-megapixel panel:

> **Raw image-model COGS per turn** = eligible-turn rate × average panels per eligible turn × (1 + paid retry rate) × blended price per panel.

The result excludes storage, egress, moderation, orchestration, taxes, support, and provider-price changes. Planning therefore adds a **25% operating reserve** until telemetry justifies another factor. This reserve is a SynapticGM assumption, not a vendor fee.

For an eligible turn with `p` panels, model price `m`, and paid retry probability `r`:

> **Eligible-turn image COGS** = `p × m × (1 + r)`.

At a 10% paid-retry rate, one, two, and three Klein panels cost approximately $0.0154, $0.0308, and $0.0462. At a 20% rate, they cost $0.0168, $0.0336, and $0.0504. One Pro panel at a 15% rate costs $0.0345. Silent semantic rerolls therefore matter more than layout computation.

### E.2 Planning scenarios

| Scenario | Eligible turns | Panels / eligible turn | Model mix | Paid retry | Raw / turn | Raw / 25-turn session | Raw / 100 turns | With 25% reserve / 100 turns |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| Classic + Memorable baseline | 12% | 1.0 | 100% Klein | 10% | $0.00185 | $0.046 | $0.185 | $0.231 |
| **Free comic-lite** | 20% | 1.0 | 100% Klein | 10% | $0.00308 | $0.077 | $0.308 | $0.385 |
| **Mid balanced** | 50% | 1.4 | 100% Klein | 12% | $0.01098 | $0.274 | $1.098 | $1.372 |
| **High selective premium** | 70% | 1.8 | 80% Klein / 20% Pro | 15% | $0.02492 | $0.623 | $2.492 | $3.115 |

![SynapticGM cost scenarios](https://private-us-east-1.manuscdn.com/sessionFile/JPPnd85nUUSUn2tfykOD3E/sandbox/0ucJitM7oMxgqghoOGj5Ln-images_1787732505058_na1fn_L2hvbWUvdWJ1bnR1L3N5bmFwdGljZ21fY29taWNfcmVzZWFyY2gvY29zdF9tb2RlbF9wZXJfMTAwX3R1cm5z.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSlBQbmQ4NW5VVVNVbjJ0ZnlrT0QzRS9zYW5kYm94LzB1Y0ppdE03b014Z3FnaG9PR2o1TG4taW1hZ2VzXzE3ODc3MzI1MDUwNThfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzTjVibUZ3ZEdsaloyMWZZMjl0YVdOZmNtVnpaV0Z5WTJndlkyOXpkRjl0YjJSbGJGOXdaWEpmTVRBd1gzUjFjbTV6LnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4OTQzMDQwMH19fV19&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEUCIQDFs6kMN7TewHboajuYOVKov2K--GPrEGb-BIvkiyg8EgIgQ~WOXF2YEO0zVXP~FdTa7gQuj-2A5mPgln05bhcOSxM_)

The Classic/Memorable baseline assumes one opener plus two rare plates in a 25-turn session. Under these assumptions, Free comic-lite is about **1.67×**, Mid **5.94×**, and High **13.49×** the raw Classic/Memorable image-model baseline. These ratios are hypotheses to test against opt-in engagement and retention, never a reason to weaken story quality or make images mandatory.

### E.3 Splash, strip, or skip

| Choice | Use when | Tier policy | Do not use when |
|---|---|---|---|
| **One splash** | High-salience committed beat, place reveal, entrance, aftermath, emotional landing, or player trigger | Free default generated form; common on Mid/High | Info-only turn, repeated look-around, duplicate beat, unsafe Kid framing, no focal subject |
| **Two-panel strip** | Both approved boundary states matter: action/reaction, approach/reveal, statement/response | Mid default on eligible pairs; High common; Free only as scarce event/cached pair | Outcome unresolved, more than two required people, or webtoon over cap |
| **Three-panel page/strip** | Establish/action/aftermath or statement/counter/decision is already committed | Mid experiment after P1 gates; High selective | Free default, safety uncertainty, long queue, crowded scene, weak middle panel |
| **Four/six composition** | Async recap using validated assets and at most a small number of new jobs | P2 recap/export | Live turn, current budget, unresolved continuity |
| **Skip** | Thin story, information/settings/inventory, repeated inspection, no state change, capacity empty, kill switch, duplicate, Kid reject, stale beat, provider degradation | All tiers | Never hide or delay required story text because art is skipped |

### E.4 Default frequency and model policy

| Tier | `panelFrequency` intent | Effective eligible-turn target | Live ceiling | Model default | Player-facing promise |
|---|---|---:|---:|---|---|
| **Free** | `sparse` / comic-lite | 20% after all skips | 1 generated panel | Klein only; deterministic fallback | One illustration plus overlay on selected beats; Memorable chrome between |
| **Mid** | `balanced` | 45–50% | Usually 1; validated 2; rare 3 | Klein; focal reference when eligible | One-panel rhythm with occasional two-panel strip |
| **High** | `rich`, not every turn | 65–70% | Usually 1–2; selective 3 | Klein routine; Pro hero/reveal/repair | Frequent illustration with selective premium treatment |

Frequency applies to **eligible committed beats after skips**, not raw turns. Repeated look-around and inventory views are removed before the frequency rule.

### E.5 Capacity, caps, and packs

Use **Klein-equivalent panel units**. One Klein one-megapixel request costs 1 unit; one Pro request costs 3 units. Pro's listed price ratio is about 2.14×, while three units provides operating room for premium latency and retries. A preflight skip uses zero units. A second unit is spent only if a second billable job actually begins.

| Tier | Session cap | Daily cap | Weekly cap | Premium use | Exhaustion behaviour |
|---|---:|---:|---:|---|---|
| Free | 6 | 8 | 32 | None included | Continue with chrome, valid plate, or deterministic composite |
| Mid | 18 | 24 | 120 | Normally Klein | Degrade 3→2→1 panels, then composite/chrome |
| High | 40 | 60 | 300 | Selective Pro at 3 units | Degrade Pro→Klein, then panel count, then composite/chrome |

These are launch guardrails, not final entitlements. Add global hourly budgets, per-model circuit breakers, queue-depth kill switches, abuse controls, and remote configuration.

Optional packs add **illustration capacity**, never story access. They may fund a triggered illustration, recap, or extra repair, while accepted text, choices, clues, and outcomes remain available without art. Kid Mode never offers “watch an ad to see the panel.”

A capacity receipt records requested panel count, model class, units reserved, units spent, retry, and release/refund state. Use an idempotency key spanning `gameId + turnId + beatRevision + panelIndex + attemptClass`.

### E.6 Retry and stop-loss rules

A **transport retry** occurs once for timeout, 5xx, or malformed transport, subject to idempotency and health. A **semantic repair** deliberately simplifies roster/camera/reference or changes model. Free has no automatic paid semantic loop; Mid has at most one within cap; High may escalate one hero/reveal panel from Klein to Pro. No tier silently rerolls until an image looks pleasing.

| Metric | Warning threshold | Kill or downgrade action |
|---|---:|---|
| Billable retry rate | >12% Free/Mid or >15% High over 500 jobs | Disable semantic auto-retry; inspect timeout/provider classes |
| Wrong roster/place/major kit | >5% in sampled simple panels | Reduce panel complexity/reference count; pause strips |
| P95 end-to-end pending duration | >15 s Klein live plate or >25 s Pro hero plate | Reduce frequency; move Pro to async-only |
| Stale attachment | Any successful attach | Incident; enforce revision guard before render |
| Double debit | Any confirmed case | Stop generation until accounting is repaired |
| COGS / 100 turns | >25% above tier model for seven days | Tighten eligibility, frequency, and caps before touching story experience |

Latency measures the full path—queue, preflight, reference retrieval, provider processing, storage, and tile replacement—not a model-page benchmark.

**Recommendation:** launch Free comic-lite at one Klein panel on roughly one in five eligible beats, capped at 6 session / 8 daily / 32 weekly units, with zero-cost Memorable chrome and deterministic fallback. Mid adds validated strips and focal references. High uses Pro selectively, not universally.

## F) Eval fixtures — good and must-reject cases

These are deterministic contracts. Image-semantic cases are evaluated through a fixed human-reviewed rollout set or explicit player repair; they do not require a Continuity-Warden or second live critic.

### F.1 GOOD — must pass

| ID | Level | Setup | Expected hard outcome | Owning module(s) |
|---|---|---|---|---|
| **G01 Correct roster** | Contract + sampled image | Ledger contains only `c_ana`; short dark curls, red field coat, no companions | PanelSpec contains exactly `c_ana`; prompt says one person and forbids extras; asset attaches only to matching revision | `comicScriptAdapter`, `visualConsistency`, `comicImagePrompt`, `generateComicImage` |
| **G02 Equipped-kit lock** | Contract + sample | `c_ana` equips `brass_spear`; unequipped bow is in inventory | Prompt includes only brass spear and excludes bow; repair cannot change accepted equipment | equipped-slot source, `visualConsistency`, `comicImagePrompt` |
| **G03 Correct place** | Contract + sample | Place `glasshouse_north`; fogged panes, iron ribs, blue grow-lamps | PanelSpec binds place and anchors; no previous-place anchor; stale art cannot attach | `comicScriptAdapter`, `visualConsistency`, revision guard |
| **G04 Speaker match** | Component/integration | Utterance `u17` belongs to `c_ana`; two people visible; anchor `top-left` | `SpeechBubble` displays exact accepted text and binds `u17/c_ana`; image metadata cannot change speaker | `SpeechBubble`, `ComicGrid`, accepted text store |
| **G05 Readable overlay** | Visual/accessibility | Busy art at reserved `top-right` | Overlay applies contrast surface, remains selectable/self-voicing, and may move only to approved fallback | overlay components, `ComicGrid` |
| **G06 Pending is non-blocking** | E2E | Eligible beat commits; image remains pending 20 seconds | Text/choices render immediately; input stays enabled; late success replaces only tile | `useGame`, `ComicGrid`, `generateComicImage` |
| **G07 Failure holds story** | E2E | Provider 5xx after allowed transport retry | Story/ledger/input remain; tile offers retry/composite/hide; no rollback | `useGame`, `generateComicImage`, `ComicGrid` |
| **G08 Kid rewrite before spend** | Safety/integration | Safe prose but camera sexualises a young-looking character | Neutral framing is compiled before capacity/provider call; audit records rewrite | Kid gate, `comicImagePrompt`, `generateComicImage` |
| **G09 Kid skip before spend** | Safety/integration | Gore-glamour cannot be reframed safely | No provider call or debit; story continues with prose/chrome/composite; no ad unlock | Kid gate, `panelBudget`, `generateComicImage` |
| **G10 Webtoon action/reaction** | Contract/component | One committed strike; surprised but uninjured reaction | Exactly two top-to-bottom panels, `compact` gutter, no invented wound, valid anchors | adapter, layout bank, `panelBudget`, `ComicGrid`, `ActionOverlay` |
| **G11 Paged three-beat** | Contract/component | Establishment, statement, and decision; tier permits three panels | Approved three-panel card, explicit order, at most three jobs, no accepted text in art prompt | layout bank, `panelBudget`, `comicImagePrompt`, `ComicGrid` |
| **G12 Splash-only turn** | Integration | One high-salience place reveal; no useful second state | One splash; planner does not pad; caption remains overlay | BeatSpec selector, `panelBudget`, `ComicGrid`, `NarrativeText` |
| **G13 Recap plate reuse** | Integration | Recap beat matches unchanged opener place/entity/kit revision | Valid Memorable plate reused with no model call; new caption overlay allowed; provenance retained | `memorableMoments`, recap selector, `comicPageCompositor` export-only |
| **G14 Classic gets chrome, not grid** | Regression | `visualMode=classic`; Memorable plate exists | Prose layout remains; chrome/zoom may wrap plate; `ComicGrid` does not mount | Settings, Classic renderer, `memorableMoments`, `useZoomGesture` |
| **G15 Idempotent transport retry** | Integration | First call times out after acceptance; one retry allowed | One logical capacity record; at most two linked billable attempts; one tile/asset may attach | `generateComicImage`, edge `generate-image`, capacity ledger |

### F.2 FAIL — must reject or degrade

| ID | Level | Setup | Expected hard outcome | Owning module(s) |
|---|---|---|---|---|
| **R01 Baked text in pixels** | Sample + UI | Art contains bubble-like text, captions, SFX glyphs, logo, or watermark | Hide/reject for live use; canonical overlay remains; increment text-leak metric | `PURE_ART_DIRECTIVE`, `generateComicImage`, `ComicGrid` |
| **R02 Wrong speaker** | Component | Payload binds `u17` to `c_ben`; accepted store says `c_ana` | Fail closed or rebind from accepted record; never show Ben as speaker | `SpeechBubble`, accepted text store |
| **R03 Empty panel** | Integration | Success response has missing/zero-byte/undecodable image | Tile becomes failed/composite; no blank panel; attempt recorded once | edge `generate-image`, `generateComicImage`, `ComicGrid` |
| **R04 Invented NPC in tags** | Contract | GM tag names “masked guide,” absent from roster/ledger | Reject tag plan; deterministic fallback excludes guide; story remains valid | `parsePanels`, `comicScriptAdapter`, roster binder |
| **R05 Invented NPC in art** | Sample/player repair | Prompt asks for one person; art adds another | Hide or simplify/retry; art cannot create entity, speaker, target, or relationship | `generateComicImage`, repair UX, ledger boundary |
| **R06 Wrong weapon** | Sample/player repair | Equipped brass spear; art shows bow | Reject/hide or simplify; equipment unchanged; wrong asset barred from recap reuse | kit compiler, `visualConsistency`, `generateComicImage`, `memorableMoments` |
| **R07 Wrong place** | Sample/player repair | Glasshouse beat; art shows desert | Do not attach or make immediately removable; no place mutation; retry/composite allowed | `visualConsistency`, `generateComicImage`, `ComicGrid` |
| **R08 Kid leak** | Safety/E2E | Unsafe framing or gore glamour survives preflight | Never render to child; quarantine/fail; incident telemetry; no automatic reroll without safe new PanelSpec | Kid gate, edge, `generateComicImage` |
| **R09 Planner invents damage** | Contract | Optional planner outputs “broken arm”; ledger has no injury | Reject plan; deterministic/no-art fallback; ledger/prose untouched | planner adapter, `comicScriptAdapter`, ledger binder |
| **R10 Art blocks input** | E2E | Image promise never resolves | Test fails if input/choices disable, focus traps, or turn waits for art | `useGame`, pending `ComicGrid` |
| **R11 Double debit** | Accounting/integration | Retry double-click, network POST replay, two workers | One logical reservation/debit; duplicate returns existing state; any duplicate debit blocks release | `generateComicImage`, edge, capacity ledger |
| **R12 Stale art after correction** | E2E | Revision 1 queues; revision 2 corrects; R1 art finishes late | R1 asset marked stale/discarded and never attaches/reuses | `useGame`, revision guard, `memorableMoments` |
| **R13 Protected style leak** | Contract/safety | User/tag requests publisher, franchise, title, or living artist | Replace with original technique bundle or skip; term never reaches provider | `parsePanels`, style compiler, `comicImagePrompt` |
| **R14 Over-budget plan** | Contract | Webtoon emits three or live paged emits four | Reject/clamp before spend: webtoon ≤2; live global ≤3; removed panels reserve zero | `panelBudget`, adapter, scheduler |
| **R15 Art adds outcome** | E2E/ledger | Image shows defeated enemy, opened vault, or transferred item absent from text | Hide/reject; no parser writes to ledger; choices stay based on accepted state | `generateComicImage`, `ComicGrid`, ledger boundary |
| **R16 Invalid anchor** | Contract/component | Planner emits `center-left` or arbitrary x/y | Schema failure or explicit card fallback; only five existing anchors reach components | `comicScript` types, adapter, overlays |
| **R17 Duplicate beat spend** | Integration | Repeated look-around; no relevant state change; valid plate exists | Skip new job; reuse plate/chrome or prose; zero debit | beat dedupe, `memorableMoments`, `panelBudget` |
| **R18 Classic regression** | Regression | Classic mode with stale comic settings | Fail if grid, panel queue, or comic layout appears; shared plate chrome only | Settings, `useGame`, Classic renderer |

### F.3 Execution matrix and release invariants

| Fixture class | Every-change CI | Release candidate | Human rollout sample |
|---|---|---|---|
| Schema, source precedence, panel budget, anchors | Yes | Yes | No |
| Overlay speaker/text/accessibility | Yes | Target devices | Spot-check |
| Non-blocking, idempotency, stale revision | Mocked provider | Staging provider | Telemetry audit |
| Prompt roster/kit/place compilation | Golden structured snapshots | Yes | Generated-output review |
| Semantic adherence and text leakage | No live critic | Fixed generation fixture set | Blinded review plus repair/hide telemetry |
| Kid pre-spend and quarantine | Policy fixtures | Mandatory | Safety review before widening |

Any confirmed **double debit, stale attachment, Kid unsafe render, input-blocking wait, Classic regression, or art-to-ledger mutation** is a release blocker. Roster/place/major-kit contradiction above the threshold pauses frequency or panel-count expansion even when transport is healthy.

## G) Phased build board — P0 this month → P1 → P2

Owner names below are limited to modules supplied in the live-state brief; repository paths should be confirmed when tickets are created. This package supplies no implementation code.

### G.1 P0 product decision

**Ship an opt-in comic-lite thin wedge:** one hosted Klein scene-art plate on selected committed beats, always with overlay lettering, plus comic chrome around valid Memorable plates. Do not promise every-turn art or multi-panel webtoon. Keep Director hard-disabled. Let strictly validated GM tags or deterministic BeatSpec feed the one-panel path.

### G.2 P0 build board

| Seq. | Work item | Owner file/module(s) | Dependency | Main risk | Kill criterion or fallback |
|---:|---|---|---|---|---|
| 1 | Freeze one-panel contract: focal beat, revision, pure-art prompt, overlay receipt, capacity record | `comicScript` types, adapter, `useGame` | Accepted turn/ledger shape | Scope expands into free-form planning | Reduce to Memorable-only chrome if contract needs invention |
| 2 | Keep Director disabled; implement source precedence | `useGame`, `parsePanels`, adapter | Roster/place/kit binding | Tags smuggle unknown facts; sources race | Reject art plan, not story; use deterministic template/skip |
| 3 | Add salience eligibility and duplicate suppression | `panelBudget`, `useGame`, `memorableMoments` | Tier/settings/capacity | Free spends on thin/repeated turns | Remote eligible rate to zero; retain chrome/composite |
| 4 | Compile ledger-bound pure-art prompt and original technique bundle | `comicImagePrompt`, `visualConsistency` | PanelSpec and style allowlist | Text/style leak, wrong kit/place, prompt dilution | Disable bundle or job class; fallback |
| 5 | Kid rewrite/skip before reservation/provider | Kid gate in `useGame`/`generateComicImage`, prompt compiler | Kid policy inputs | Unsafe framing leaves edge or renders | Stop Kid generation; prose/chrome only |
| 6 | Make jobs atomic, idempotent, non-blocking, revision-scoped | `generateComicImage`, edge `generate-image`, `useGame` | Queue and capacity ledger | Double debit, stale attach, input wait | Any confirmed case stops generation globally |
| 7 | Render one replaceable pending/success/fail tile | `ComicGrid`, `useZoomGesture`, `useGame` | Job status contract | Layout shift, focus trap, unresolved promise | Collapse to chrome/plate; keep text/input |
| 8 | Bind overlays to accepted utterance/caption IDs | bubble/narrative/action overlays, `ComicGrid` | Accepted text store and anchors | Wrong speaker or unreadable bubble | Fail closed to approved caption rail/anchor with contrast surface |
| 9 | Add shared chrome to Memorable plates without Classic `ComicGrid` | `memorableMoments`, Classic renderer, overlays, zoom | Plate provenance | Classic becomes comic; stale reuse | Disable shared chrome per mode; preserve original Classic |
| 10 | Add remote model/tier/Kid/frequency kill switches and caps | Settings, `panelBudget`, edge | Operational config | Incident requires client release | Global off preserves prose/Classic/Memorable/composite |
| 11 | Instrument eligibility, skip reason, model, panel, attempts, retry, latency, attachment, repair, capacity | job path, edge, grid, moments | Stable event IDs | Sensitive prompt logging or irreconcilable accounting | Structured reason codes and IDs; pause widening |
| 12 | Run fixtures and 5%→20% opt-in rollout | All P0 owners | Items 1–11 | Low delight or concentrated errors | Roll back generation frequency; retain chrome/overlays |

### G.3 Four-week cadence

| Week | Deliverable | Exit condition |
|---|---|---|
| **1 — Contract and safety** | PanelSpec/source precedence, deterministic eligible templates, Kid gate, pure-art compiler, kill-switch design | No provider call for skip, Kid reject, over-budget, or contradictory tags |
| **2 — Reliable async path** | Idempotent reservation/job/attempt, revision guard, pending/fail tile, overlay binding | Mock tests prove no input block, double debit, or stale attach |
| **3 — Chrome and canary** | Memorable chrome, Classic regression protection, one-panel Klein canary, dashboards | Internal sessions keep canonical text available and hard invariants intact |
| **4 — Limited opt-in** | Remote-controlled 5%→20% comic-user rollout | Metrics hold seven days or rollout pauses/rolls back |

### G.4 P0 done-when metrics

| Metric | Done-when |
|---|---:|
| Story/input availability while art pending/failed | **100%** of tests and samples |
| Double debit | **0 confirmed** |
| Stale art attachment | **0** |
| Kid unsafe render | **0** |
| Classic `ComicGrid` or comic queue regression | **0** |
| Deterministic overlay speaker/text mismatch | **0 fixture failures** |
| Correct roster + place + major equipped item in sampled simple plates | **≥95%** |
| Billable retry rate | **≤10% target; 12% warning** |
| P95 committed-turn → Klein tile replacement | **≤15 s** end to end |
| Free raw COGS / 100 turns | **≤$0.31 model / ≤$0.39 with reserve** under launch assumptions |
| Displayed-panel hide/repair | **≤15%** |
| Comic-component crash/error regression | **No material increase** versus Classic control |

### G.5 P1 — validated strips, references, and repair UX

| Work item | Owner module(s) | Dependency | Risk | Kill/fallback |
|---|---|---|---|---|
| Add original two-/three-panel IDs, order, gutter, anchors | types, adapter, `ComicGrid`, `panelBudget` | P0 stability | Ambiguous order/mobile crowding | Keep only conservative LTR and `V2-ACTION-REACTION`; one splash fallback |
| Permit webtoon action/reaction and paged dialogue/reaction | grid, layout bank, budget | Correct BeatSpec boundary states | Art implies uncommitted outcome | Disable card/beat pairing |
| Add selective paged three-panel experiments | layout bank, budget, job path | Two-panel gates | Latency/spend multiply; weak middle | Clamp to two or one |
| Send one rights-cleared focal reference through Klein | consistency, prompt, job path, edge | Reference registry | Weak uplift; trait conflict | Remove reference; reuse approved portrait in composite |
| Add retry/simplify/portrait/hide controls | grid, job path, overlays | Failure taxonomy and receipt | Reroll addiction/hidden spend | Cap attempts; prefer simplify/composite |
| Add deterministic portrait/background composite | moments/shared plate layer, grid, overlays | Rights-cleared asset set | Stale attributes/combinatorics | Omit uncertain layers; neutral backdrop |
| Add mobile/accessibility matrix for every live card | grid, overlays, zoom | Stable card IDs | Text obscures art; focus/zoom issue | Remove card/anchor pairing |
| Test optional light planner on Mid/High | planner adapter, script adapter | Deterministic baseline | Invents facts or adds latency without uplift | Keep disabled unless it wins every agreed gate |

**P1 gate:** do not widen from one panel until two-panel fixtures maintain at least 95% roster/place/major-kit correctness, P95 completion stays within the live budget, paid retries remain below threshold, and opt-in players prefer the strip to the same beat as one splash. Three-panel work begins only after two-panel evidence.

### G.6 P2 — recap, advanced consistency, gated full comic

| Work item | Owner module(s) | Dependency | Risk | Kill/fallback |
|---|---|---|---|---|
| Async four/six-panel chapter recap using validated reuse | `memorableMoments`, recap selector, compositor, grid for viewing | P1 cards/provenance | Six fresh jobs recreate every-turn economics | Reuse most panels; cap new hero jobs to one or two |
| Export-only overlay bake | `comicPageCompositor` | Canonical overlay receipt/provenance | Live path depends on baked text | Keep export-only; baked output never returns to live turn |
| Pro reference bundles for hero/reveal/repair | job path, edge, consistency | Proven P1 uplift and High capacity | Trait swap, cost, slow completion | Pro selective/async; Klein/composite fallback |
| Optional LoRA experiment | Future model registry plus prompt/reference path | Rights-complete original data, deletion/version/safety | Rights, overfit, storage, routing | Stop without material uplift or complete governance |
| Full comic behind explicit gates | Settings, budget, all owners | Sustained strip/recap metrics | Every-turn cost/latency/trust damage | Thin wedge/strip/recap remain permanent products |

### G.7 Explicit near-term No-Go list

| No-Go | Reason | Reconsider when |
|---|---|---|
| Every-turn six-panel webtoon/full page | Violates current budget, cap, and latency envelope | Thin wedge → strip → recap gates all sustain |
| Director as P0 dependency | Nondeterminism and second failure surface | Optional planner beats templates under strict schema |
| Continuity-Warden/second LLM critic | Prohibited; adds spend/latency and risks art-as-truth | **Do not reconsider under this brief** |
| Live baked bubbles/captions/SFX | Product-law conflict; model text may distort.[20] | **Do not reconsider for live turns** |
| Free P0/P1 LoRA | Rights, storage, training, versioning, operations | P2+ rights-complete High/Admin experiment |
| Default >2 required people in live generated panel | Identity/kit binding risk | Fixed fixtures prove reliable multi-reference binding |
| Four/six fresh live panels | Linear jobs/failures | Recap evidence and a newly approved budget |
| Player BYOK/consumer SaaS primary path | Violates hosted-player-path requirement | Outside this brief |
| Protected franchise/living-artist targets | Rights/product-law violation | **Never; use original technique bundles** |
| Art-derived ledger update | Art is noncanonical | **Never** |
| Kid ad gate for required visual | Product-law violation | **Never** |

The board order stays **thin wedge → strip → recap → gated full comic**. If full comic never clears economics or trust, the first three remain complete products.

## H) First-class alternatives if full comic remains expensive

These are product modes, not consolation prizes. Scores use five points where **5 is best**: Impact 5 = strongest delight; Cost 5 = lowest marginal COGS; Continuity-fit 5 = strongest ledger alignment; Latency 5 = fastest/non-blocking experience. Weighted score = 30% Impact + 25% Cost + 30% Continuity-fit + 15% Latency.

### H.1 Scorecard

| Alternative | Impact | Cost | Continuity-fit | Latency | Weighted / 5 | Best role |
|---|---:|---:|---:|---:|---:|---|
| **1. Comic-lite: one illustration + overlay** | 4 | 4 | 4 | 3 | **3.85** | Sparse generated delight on high-salience committed beats |
| **2. Kinetic typography on Classic** | 3 | 5 | 5 | 5 | **4.40** | Immediate prose emphasis with no image spend |
| **3. Memorable-only + comic chrome** | 3 | 5 | 5 | 5 | **4.40** | Lowest-risk P0 foundation and stable visual identity |
| **4. Deterministic sprite/portrait + background** | 4 | 5 | 5 | 5 | **4.70** | Best Free fallback/default after asset setup |
| **5. End-of-chapter async recap** | 5 | 2 | 5 | 4 | **4.10** | Concentrated reward outside turn latency |
| **6. Player-triggered “illustrate this beat”** | 5 | 4 | 5 | 3 | **4.45** | Spend only where explicit player intent signals value |

### H.2 Comic-lite

Comic-lite renders one pure scene-art illustration for an eligible committed beat, then applies existing overlays. It delivers the lift of a splash without multiplying panel jobs and is easier to keep roster-, kit-, and place-correct than a crowded strip.

| Element | Design |
|---|---|
| Source | Ledger-safe GM tag or deterministic BeatSpec |
| Eligibility | Entrance, reveal, approved action boundary, aftermath, emotional landing, or player trigger |
| Model | Klein by default; Pro only for High hero/reveal/repair |
| Failure | Keep text; switch to plate, deterministic composite, or chrome |
| Main risk | Late arrival or wrong roster/kit/place |
| Control | Non-blocking tile, one semantic repair cap, one focal subject |

**Use:** generated component of the P0 thin wedge, not the whole Free experience.

### H.3 Kinetic typography on Classic

Kinetic typography adds restrained motion to canonical prose and overlays: line reveal, brief emphasis pulse, caption slide, transition wipe, or ActionOverlay movement. It uses accepted text, has zero image COGS, and must respect reduced-motion, self-voicing, copy/selection, and reading speed.

| Element | Design |
|---|---|
| Source | Accepted narration, dialogue, and action labels only |
| Eligible use | Reveal word, scene transition, impact receipt, emotional emphasis |
| Cost | Zero marginal model spend |
| Failure | Disable motion; show static text immediately |
| Main risk | Gimmickry, motion sickness, delayed reading, duplicate announcements |
| Control | Short semantic presets; reduced-motion; animation never gates input |

**Use:** Classic enhancement shared with comic overlays; it protects non-comic players while art remains sparse.

### H.4 Memorable-only plus comic chrome

Wrap existing opener and rare Memorable plates in original borders, gutters, accessible captions, bubbles, zoom, receipts, and failure states. Reuse adds no image-model call.

| Element | Design |
|---|---|
| Source | Valid Memorable asset plus current accepted overlay receipt |
| Eligible use | Opener, rare plate, chapter marker, recap header, unchanged callback |
| Cost | Zero additional model spend |
| Failure | Revert to current plate or prose-only Classic |
| Main risk | Plate reused after equipment, injury, place, or other visible state changes |
| Control | Provenance/semantic key and invalidation on relevant revision |

**Use:** ship in P0 regardless of hosted-generation rollout. Classic may share chrome without `ComicGrid`.

### H.5 Deterministic portrait/sprite and background composite

A rights-cleared library combines a stable background or neutral plate, one or two approved portraits/sprites, optional equipped-item layers, original effects, and existing overlays. Layered visual-novel and VTT systems demonstrate the underlying pattern of attribute-selected sprites, separate UI text, background/foreground layers, positioned tiles, and z-order.[13] [14] [15] [16]

| Element | Design |
|---|---|
| Source | Ledger entity/place/equipped-slot IDs mapped to approved asset variants |
| Eligible use | Free default visual, provider outage, Kid-safe fallback, dialogue, equipment acknowledgement, repeated place |
| Cost | Upfront asset production/storage; near-zero marginal COGS |
| Failure | Omit uncertain layer or use one portrait on neutral background |
| Main risk | Stale/impossible combinations and limited pose vocabulary |
| Control | Mutually exclusive equipment groups, atomic replacement, provenance, “omit rather than contradict” |

**Use:** highest-scoring Free technique and a first-class product surface. Start with player portrait, a small common-place library, and a bounded expression/kit vocabulary.

### H.6 End-of-chapter asynchronous recap

After a chapter, select four or six committed beats, reuse validated Memorable/comic-lite assets, and generate only missing hero panels under an async budget. Accepted captions/dialogue remain editable; `comicPageCompositor` may bake them for export only.

| Element | Design |
|---|---|
| Source | Chapter ledger, accepted text, validated provenance, Memorable moments |
| Eligible use | Chapter closure, session memory, return-to-game summary |
| Cost | High if every panel is new; modest if most are reused |
| Failure | Deliver text recap with reused assets; omit missing panel rather than wait indefinitely |
| Main risk | Recap reinterprets story, uses stale art, or launches six fresh jobs |
| Control | Deterministic beat selection, revision checks, one/two new-panel cap, async completion |

**Use:** P2 reward with strong perceived impact and no turn-blocking requirement.

### H.7 Player-triggered “illustrate this beat”

After a committed eligible beat, a button lets the player spend included or pack capacity on one illustration. It converts uncertain automatic frequency into explicit intent and supplies a clean value signal. The control is absent for unsafe Kid cases, thin/info-only beats, duplicates, empty capacity, or operations kill switch.

| Element | Design |
|---|---|
| Source | Frozen committed BeatSpec and revision |
| Eligible use | Player-selected emotional, action, discovery, or character moment |
| Cost | Predictable and capacity-metered; no speculative job |
| Failure | Release unused reservation if no billable job starts; offer composite/chrome |
| Main risk | Click spam, double debit, stale result, or perceived story paywall |
| Control | One active request per beat revision, idempotency, unit receipt, story already complete |

**Use:** P1 after accounting and stale-revision fixtures pass; strongest Mid/High upgrade lever.

### H.8 Free default and upgrade path

| Tier | Always-on presentation | Generated art | Player control | Recap |
|---|---|---|---|---|
| **Free** | Memorable chrome + kinetic typography; deterministic composite when available | Sparse one-panel Klein comic-lite on about 20% of eligible beats | Hide and switch to composite; scarce triggered illustration may come later | Text plus reused plates |
| **Mid** | Free presentation plus richer composite variants | Comic-lite plus validated two-panel Klein strips | Included “illustrate this beat” and one bounded repair | Four-panel async recap, mostly reuse |
| **High** | Full presentation library | Frequent Klein; selective Pro hero/reveal/repair; validated three-panel paged strips | More capacity and explicit premium choice on eligible hero moments | Four/six async recap with few new panels |

**Recommendation:** the strongest portfolio is not one mode. Free combines Memorable chrome, kinetic typography, deterministic composite, and sparse comic-lite. Mid adds triggered illustration and two-panel strips. High adds selective Pro and async recap. If full comic never becomes economical, this portfolio still delivers readable, continuous, delightful illustrated play while keeping text canonical and spend bounded.

## Open founder decisions — maximum eight

| # | Decision | Recommended default | Evidence needed to change it |
|---:|---|---|---|
| 1 | Exact P0 wedge | **One eligible Klein plate + overlay, plus Memorable chrome** | If canary adherence or latency misses gates, launch Memorable chrome only |
| 2 | Director status | **Keep disabled for P0; templates own planning** | P1 Mid/High planner must beat templates on preference, adherence, repair, latency, and COGS |
| 3 | Free comic-lite caps | **6/session, 8/day, 32/week Klein-equivalent units** | Replace after observed turn volume, abuse, engagement, and unit economics |
| 4 | Pro exposure | **High hero/reveal/repair only; three units** | Broaden only if player preference and adherence justify the 2.14× listed model price |
| 5 | First deterministic asset scope | **Player portrait + small common-place set + bounded expression/kit layers** | Expand from usage concentration and contradiction telemetry |
| 6 | Player-triggered illustration | **P1, included capacity first** | Decide pack pricing only after idempotency, repair, and demand telemetry are stable |
| 7 | Optional RTL | **Later separate card bank** | Build after LTR/vertical comprehension and overlay-anchor tests; do not auto-mirror |
| 8 | Full-comic gate | **No date commitment** | Require sustained strip/recap trust, latency, preference, and COGS gates |

## References

[1]: https://www.clipstudio.net/how-to-draw/archives/157055 "Clip Studio Paint / Art Rocket — Tips for Creating Vertical Scrolling Webtoons"
[2]: https://github.com/jbilcke-hf/ai-comic-factory "jbilcke-hf — AI Comic Factory README"
[3]: https://anifusion.ai/features/ "Anifusion — All Features"
[4]: https://www.storyboarder.ai/ "Storyboarder.ai — From Script to Storyboard"
[5]: https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference "Midjourney Help Center — Omni Reference"
[6]: https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference "Midjourney Help Center — Style Reference"
[7]: https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds "Midjourney Help Center — Seeds"
[8]: https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights "Midjourney Help Center — Multi-Prompts & Weights"
[9]: https://research.tilburguniversity.edu/en/publications/navigating-comics-ii-constraints-on-the-reading-order-of-comic-pa/ "Cohn & Campbell — Navigating Comics II: Constraints on the Reading Order of Comic Page Layouts"
[10]: https://openaccess.thecvf.com/content_cvpr_2017/html/Iyyer_The_Amazing_Mysteries_CVPR_2017_paper.html "Iyyer et al. — The Amazing Mysteries of the Gutter (CVPR 2017)"
[11]: https://arxiv.org/html/2401.02863v1 "Chen & Jhala — A Customizable Generator for Comic-Style Visual Narrative"
[12]: https://www.renpy.org/doc/html/displaying_images.html "Ren'Py Documentation — Displaying Images"
[13]: https://www.renpy.org/doc/html/layeredimage.html "Ren'Py Documentation — Layered Images"
[14]: https://www.renpy.org/doc/html/screens.html "Ren'Py Documentation — Screens and Screen Language"
[15]: https://foundryvtt.com/article/scenes/ "Foundry Virtual Tabletop — Scenes"
[16]: https://foundryvtt.com/article/tiles/ "Foundry Virtual Tabletop — Tiles"
[17]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "OpenRouter Documentation — Image Generation"
[18]: https://openrouter.ai/api/v1/images/models/black-forest-labs/flux.2-klein-4b/endpoints "OpenRouter Image Models API — FLUX.2 Klein 4B endpoints"
[19]: https://openrouter.ai/api/v1/images/models/black-forest-labs/flux.2-pro/endpoints "OpenRouter Image Models API — FLUX.2 Pro endpoints"
[20]: https://huggingface.co/black-forest-labs/FLUX.2-klein-4B "Black Forest Labs — FLUX.2 Klein 4B model card"
