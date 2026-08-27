# Draft D — Original panel-layout pointer-card banks

> These cards describe code-selectable content only. They use no franchise layouts or assets. The final package will incorporate them as section D.

## D) Panel layout banks

### D.1 Shared vocabulary and selection laws

Every card has an explicit order. **Paged LTR** fills left-to-right and then top-to-bottom. **Vertical** fills only top-to-bottom. Optional RTL should be a separately tested future bank, not an automatic CSS mirror, because camera entry, bubble tails, and overlay anchors also need semantic remapping. Academic reading-order evidence supports conservative layouts: overlap, blockage, and large departures from a grid can redirect readers, so P0/P1 cards avoid all three.

The card's lettering zones are reservations, not instructions to put text in pixels. They map only to the existing anchors: `top-left`, `top-right`, `bottom-left`, `bottom-right`, and `bottom-center`. Prompt compilation asks the image model to leave low-detail negative space in the reserved region; HTML/SVG overlays occupy that region later. If the art does not provide usable space, the overlay adds a contrast scrim or moves to a card-approved fallback anchor.

| Gutter token | Visual meaning | Selection rule |
|---|---|---|
| `compact` | Immediate time, rapid exchange, or one continuous action | Use only when adjacent panels share place, roster, and moment |
| `standard` | Normal beat boundary | Default between dialogue, reaction, and small action changes |
| `pause` | Reflection, reveal, aftermath, or scene transition | Use sparingly; never separate two halves of one required action |

### D.2 Two-panel cards

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones by panel | When to use | When **not** to use |
|---|---|---|---|---|---|---|
| **Equal Echo** | `P2-LTR-EQUAL-ECHO`; two equal side-by-side panels; `standard` gutter | 1 left → 2 right | P1 medium/wide establishes the beat; P2 matching medium or close reaction preserves screen direction | P1 `top-left`, fallback `bottom-left`; P2 `top-right`, fallback `bottom-right` | Dialogue/reaction, question/answer, before/after with no large time jump | Phone widths that make each panel too narrow; more than two speakers; high-speed action needing vertical space |
| **Lead and Answer** | `P2-LTR-LEAD-ANSWER`; wide 60% left + narrow 40% right; `compact` or `standard` | 1 left → 2 right | P1 wide or medium action; P2 close reaction/detail | P1 `top-left` or `bottom-left`; P2 `top-right` or `bottom-center` | Action/reaction, reveal/detail, speaker/listener | When panel 2 carries a complex outcome, a full-body pose, or two required characters |
| **Approach and Reveal** | `V2-APPROACH-REVEAL`; two full-width vertical panels; `pause` before panel 2 | 1 top ↓ 2 bottom | P1 wide/over-shoulder approach; P2 medium/low-angle reveal or object close-up | P1 `top-left` or `bottom-center`; P2 `top-right` or `bottom-right` | Webtoon reveal, door opening, place discovery, identity reveal already committed in text | Ordinary dialogue, repeated look-around, or a reveal the art might contradict |
| **Strike and Reaction** | `V2-ACTION-REACTION`; two full-width vertical panels; `compact` gutter | 1 top ↓ 2 bottom | P1 dynamic medium/diagonal action with one focal actor; P2 close reaction or aftermath detail | P1 `top-left` or `top-right`; P2 `bottom-center` or `bottom-right` | Validated webtoon action/reaction, one approved action boundary, one or two characters | Complex choreography, invented damage, more than one attacker/target pair, or when outcome is not yet committed |

### D.3 Three-panel cards

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones by panel | When to use | When **not** to use |
|---|---|---|---|---|---|---|
| **Establish–Exchange** | `P3-LTR-ESTABLISH-EXCHANGE`; one full-width top + two equal bottom; `standard` gutters | 1 top → 2 bottom-left → 3 bottom-right | P1 wide establishment; P2 medium speaker; P3 medium listener/reaction | P1 `top-left`; P2 `bottom-left` or `top-left`; P3 `bottom-right` or `top-right` | Place introduction followed by a two-person exchange; paged 3-beat | Crowded locations, more than two speakers, or when establishment can reuse a valid plate instead |
| **Act–Witness–Settle** | `P3-LTR-ACT-WITNESS-SETTLE`; three equal columns; `compact` then `standard` | 1 left → 2 centre → 3 right | P1 medium action; P2 close witness/reaction; P3 wide/medium aftermath | P1 `top-left`; P2 `top-right`; P3 `bottom-center` | Short action with committed aftermath; visual rhythm across a landscape page | Small phone viewport without horizontal paging; heavy dialogue; complex props or location change |
| **Statement–Counter–Decision** | `P3-LTR-DIALOGUE-TRIAD`; one wide left 50% + two stacked right; `standard` gutters | 1 left → 2 top-right → 3 bottom-right | P1 two-shot or medium speaker; P2 close counterpoint; P3 close decision/reaction | P1 `bottom-left`; P2 `top-right`; P3 `bottom-right` or `bottom-center` | Three-beat dialogue where one statement anchors two shorter responses | Any sequence whose third panel is a new action/outcome; layouts with uncertain order; mobile without paged mode |
| **Enter–Turn–Land** | `V3-ENTER-TURN-LAND`; three full-width vertical panels; `standard`, then `pause` | 1 top ↓ 2 middle ↓ 3 bottom | P1 wide entry/establish; P2 medium turn or discovery; P3 close reveal/aftermath | P1 `top-left`; P2 `top-right` or `bottom-left`; P3 `bottom-center` | Webtoon approach/reveal/aftermath, quiet discovery, emotional descent | Every-turn default; thin info-only beats; more than one location; action needing immediate compact spacing |

### D.4 Four-panel cards

> Four-panel cards are **P1 recap/prototype cards**, not live-turn defaults, because the present hard ceiling is three panels and webtoon is at most two.

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones by panel | When to use | When **not** to use |
|---|---|---|---|---|---|---|
| **Steady Four** | `P4-LTR-STEADY-GRID`; conservative 2×2 grid; `standard` gutters | 1 top-left → 2 top-right → 3 bottom-left → 4 bottom-right | Wide/medium/medium/close, or medium alternation with stable screen direction | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-right` | Recap of establish/action/reaction/aftermath; dialogue with at most two speakers | Live turn under current budget; decorative staggering; more than one place transition |
| **Header and Three** | `P4-LTR-HEADER-THREE`; one full-width top + three equal bottom; `pause` after header, then `compact` | 1 top → 2 bottom-left → 3 bottom-centre → 4 bottom-right | P1 wide chapter/place plate; P2–P4 medium/close sequence | P1 `top-left`; P2 `bottom-left`; P3 `bottom-center`; P4 `bottom-right` | Chapter recap opening plus three key beats; Memorable plate as header | When the header is not semantically reusable; dense dialogue in the three narrow panels |
| **Two Beats, Two Reactions** | `P4-LTR-PAIRED-ECHO`; two rows of two equal panels; `compact` within rows, `pause` between rows | 1 top-left → 2 top-right → 3 bottom-left → 4 bottom-right | P1/P3 medium actions or statements; P2/P4 reaction close-ups | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-right` | Recap comparing two parallel committed beats or two rounds of dialogue | If rows occur in different places without explicit transition; if visual similarity would confuse chronology |
| **Vertical Four-Step** | `V4-FOUR-STEP`; four full-width stacked panels; `standard`, `compact`, `pause` | 1 top ↓ 2 ↓ 3 ↓ 4 bottom | Wide establish → medium action → close reaction → wide/close release | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-center` | Async recap, tutorial-like sequence, or deliberate emotional cadence | Live webtoon under current ≤2 cap; ordinary turns; long dialogues that produce excessive scroll |

### D.5 Six-panel cards

> Six-panel cards are **P2 recap/export cards only** until explicit gates permit them. They are included now so engineering can prepare stable IDs without implying near-term live use.

| Card | ID and shape | Reading order | Camera suggestions | Lettering zones by panel | When to use | When **not** to use |
|---|---|---|---|---|---|---|
| **Beat Sheet Six** | `P6-LTR-BEAT-SHEET`; 3 columns × 2 rows; `standard` gutters | 1–3 left-to-right top row, then 4–6 left-to-right bottom row | Wide establish, medium initial, close rise, medium peak, reaction close, wide release | P1 `top-left`; P2 `top-right`; P3 `bottom-center`; P4 `bottom-left`; P5 `top-right`; P6 `bottom-right` | End-of-chapter recap with six already validated images; concise overlays | New generation of six panels for one live turn; phones without page zoom; more than two recurring characters per panel |
| **Peak Centre** | `P6-LTR-PEAK-CENTRE`; two panels top, one full-width centre, three panels bottom; `standard`, then `pause`, then `compact` | 1 top-left → 2 top-right → 3 centre → 4 bottom-left → 5 bottom-centre → 6 bottom-right | P1 establish, P2 initial, P3 wide/medium peak, P4–P5 reactions/details, P6 release | P1 `top-left`; P2 `top-right`; P3 `bottom-center`; P4 `bottom-left`; P5 `top-right`; P6 `bottom-right` | Recap where one committed climax deserves scale; print/export | If centre panel art is unavailable or unvalidated; complex order; live generation; outcome still uncertain |
| **Three Paired Turns** | `P6-LTR-THREE-PAIRS`; three rows of two; `compact` within each pair, `standard` between rows | 1 left → 2 right, then rows 2 and 3 | Alternating speaker/reaction or action/reaction with stable camera axis | Odd panels `top-left` or `bottom-left`; even panels `top-right` or `bottom-right`; final panel may use `bottom-center` | Dialogue recap, three approved exchanges, or three action/reaction pairs | More than two speakers, location changes without transition, or visual repetition with no new beat |
| **Vertical Chapter Thread** | `V6-CHAPTER-THREAD`; six stacked full-width panels; gutters `standard`, `compact`, `pause`, `standard`, `pause` | 1 top ↓ 2 ↓ 3 ↓ 4 ↓ 5 ↓ 6 bottom | Establish → initial → action → peak → reaction → release, using simple single-subject shots | P1 `top-left`; P2 `top-right`; P3 `bottom-left`; P4 `bottom-center`; P5 `top-right`; P6 `bottom-right` | End-of-chapter async recap where panels are reused or generated outside turn latency | Live play, Kid Mode ad gating, weak chapters, info-only summaries, or any case where six fresh generations exceed cap |

### D.6 Beat-type mapping

| Beat type | Preferred two-panel card | Preferred three-panel card | Recap-only expansion | Default gutter behavior |
|---|---|---|---|---|
| Establishing | `V2-APPROACH-REVEAL` only when a reveal follows; otherwise one splash | `P3-LTR-ESTABLISH-EXCHANGE` | `P4-LTR-HEADER-THREE` | `pause` after establishment only when place/time changes |
| Action | `V2-ACTION-REACTION` or `P2-LTR-LEAD-ANSWER` | `P3-LTR-ACT-WITNESS-SETTLE` | `P6-LTR-THREE-PAIRS` | `compact` action→reaction; `standard` reaction→aftermath |
| Reaction | `P2-LTR-EQUAL-ECHO` | `P3-LTR-ACT-WITNESS-SETTLE` | `P4-LTR-PAIRED-ECHO` | `standard`; `pause` for emotional landing |
| Reveal | `V2-APPROACH-REVEAL` | `V3-ENTER-TURN-LAND` | `P6-LTR-PEAK-CENTRE` | `pause` immediately before reveal, not after every panel |
| Aftermath | One splash or `P2-LTR-LEAD-ANSWER` | `V3-ENTER-TURN-LAND` | `P6-LTR-BEAT-SHEET` | `pause` before final release when earned |
| Dialogue | `P2-LTR-EQUAL-ECHO` | `P3-LTR-DIALOGUE-TRIAD` | `P6-LTR-THREE-PAIRS` | `compact` for rapid exchange; otherwise `standard` |
| Transition | One splash preferred; `V2-APPROACH-REVEAL` only if both boundary states matter | `V3-ENTER-TURN-LAND` | `V6-CHAPTER-THREAD` | `pause` between places or time periods |

### D.7 Operational selection constraints

A pointer card is selected only after the panel plan is within `panelBudget`. A panel with more than two required people, multiple simultaneous actions, or no safe overlay anchor should be simplified or skipped. Webtoon live mode remains capped at two panels; paged live mode remains within the existing one/two/three ceiling. Four- and six-panel cards can be used for recap composition from already validated assets before they are permitted to trigger fresh generation.
