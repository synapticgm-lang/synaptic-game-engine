# Draft H — First-class alternatives if full comic remains expensive

## H) Alternative techniques

These are not consolation modes. Each solves a distinct player need with lower cost or lower continuity risk than generating multiple fresh panels on every turn. Scores use a five-point scale where **5 is best**: Impact 5 = strongest perceived delight; Cost 5 = lowest marginal COGS; Continuity-fit 5 = strongest alignment with ledger truth; Latency 5 = fastest or non-blocking player experience. The weighted score is 30% Impact, 25% Cost, 30% Continuity-fit, and 15% Latency.

### H.1 Comparative scorecard

| Alternative | Impact | Cost | Continuity-fit | Latency | Weighted score / 5 | Best role |
|---|---:|---:|---:|---:|---:|---|
| **1. Comic-lite: one illustration + overlay** | 4 | 4 | 4 | 3 | **3.85** | Sparse generated delight on high-salience committed beats |
| **2. Kinetic typography on Classic** | 3 | 5 | 5 | 5 | **4.40** | Immediate motion/emphasis for prose without image spend |
| **3. Memorable-only + comic chrome** | 3 | 5 | 5 | 5 | **4.40** | Lowest-risk P0 foundation and consistent visual identity |
| **4. Deterministic sprite/portrait + background composite** | 4 | 5 | 5 | 5 | **4.70** | Best Free fallback/default visual scene after asset setup |
| **5. End-of-chapter async recap** | 5 | 2 | 5 | 4 | **4.10** | Concentrated reward where completion need not block play |
| **6. Player-triggered “illustrate this beat”** | 5 | 4 | 5 | 3 | **4.45** | Spend only where player intent signals value |

### H.2 Alternative 1 — Comic-lite

Comic-lite renders one pure scene-art illustration for an eligible committed beat, then applies `SpeechBubble`, `NarrativeText`, or `ActionOverlay`. It buys the emotional lift of a splash without multiplying panel jobs. The one-panel contract is also easier to keep roster-, kit-, and place-correct than a crowded strip.

| Element | Design |
|---|---|
| Source | Valid ledger-safe GM tag or deterministic BeatSpec |
| Eligibility | Character entrance, place reveal, decisive approved action boundary, aftermath, emotional landing, or player-triggered beat |
| Model | Klein by default; Pro only on High hero/reveal or repair |
| Failure | Keep accepted text; switch to Memorable plate, deterministic composite, or chrome |
| Primary risk | Arrives too late or shows wrong roster/kit/place |
| Control | Non-blocking tile, one semantic repair cap, simple one-focal-subject composition |

**Recommendation:** This is the generated-image component of the P0 thin wedge, but not the only Free presentation.

### H.3 Alternative 2 — Kinetic typography on Classic

Kinetic typography adds restrained motion to canonical prose and overlay components: line-by-line reveal, emphasis pulses, short camera-safe panel wipe, caption slide, or ActionOverlay movement. It uses accepted text, so continuity fit is excellent and no image is required. Motion must respect reduced-motion preferences, self-voicing, selection/copy, and reading speed.

| Element | Design |
|---|---|
| Source | Accepted narration, dialogue, and action labels only |
| Eligible use | Reveal word, scene transition, impact beat, initiative/action receipt, or emotional emphasis |
| Cost | Zero marginal model spend |
| Failure | Disable motion and display static text immediately |
| Primary risk | Gimmickry, motion sickness, delayed reading, or duplicate screen-reader announcements |
| Control | Short semantic presets, reduced-motion fallback, no animation that gates the next input |

**Recommendation:** Make this a Classic enhancement shared with comic overlays. It protects non-comic users and increases perceived production value while the image path is sparse.

### H.4 Alternative 3 — Memorable-only plus comic chrome

This mode wraps existing opener and rare Memorable plates in original borders, gutters, accessible captions, speaker bubbles, zoom, generation receipts, and failure states. It adds **zero incremental model calls** when only existing plates are reused. It can be the immediate baseline even if hosted generation is killed.

| Element | Design |
|---|---|
| Source | Valid Memorable asset plus current accepted overlay receipt |
| Eligible use | Opener, rare plate, chapter marker, recap header, or unchanged callback |
| Cost | Zero additional image model spend |
| Failure | Revert to the current Memorable presentation or prose-only Classic |
| Primary risk | Reusing a plate after equipment, injury, place, or relationship state changed |
| Control | Provenance and semantic reuse key; invalidation on relevant ledger revision |

**Recommendation:** Ship this in P0 regardless of generated-image rollout. Classic may use the shared chrome without mounting `ComicGrid`.

### H.5 Alternative 4 — Deterministic sprite/portrait and background composite

A rights-cleared scene library combines a stable background or neutral plate, one or two approved portraits/sprites, optional equipped-item layers, original effects, and existing overlays. Ren'Py and VTT systems demonstrate the broad technique of attribute-driven sprites, separate UI text, background/foreground layers, and positioned tiles. The result is immediate, cacheable, and exact in identity because it reuses approved assets rather than sampling a new face.

| Element | Design |
|---|---|
| Source | Ledger entity/place/equipped-slot IDs mapped to approved asset variants |
| Eligible use | Free visual default, provider outage, Kid-safe fallback, dialogue, inventory/equipment acknowledgement, repeated locations |
| Cost | Asset production/storage upfront; near-zero marginal model cost |
| Failure | Omit the uncertain layer or fall back to one portrait on neutral background |
| Primary risk | Stale or impossible layer combinations; limited pose vocabulary |
| Control | Mutually exclusive equipment groups, atomic scene replacement, provenance, and an “omit rather than contradict” rule |

**Recommendation:** This is the highest-scoring Free technique and should be treated as a product surface, not an error illustration. Start with player portrait + five common place families + a small expression/kit vocabulary.

### H.6 Alternative 5 — End-of-chapter asynchronous recap

The recap selects four or six committed beats after a chapter, reuses validated Memorable/comic-lite assets, and generates only missing hero panels under an async budget. It can use the four/six pointer cards because it is not part of turn latency. Accepted captions and dialogue overlays remain editable; PDF/export may bake them later through `comicPageCompositor`.

| Element | Design |
|---|---|
| Source | Chapter ledger, accepted text, validated image provenance, Memorable moments |
| Eligible use | Chapter closure, shareable session memory, return-to-game summary |
| Cost | Potentially high if it generates every panel; modest if it reuses most assets |
| Failure | Deliver text recap with reused plates; omit missing panel rather than wait indefinitely |
| Primary risk | Recap reinterprets story, includes stale art, or generates six fresh expensive jobs |
| Control | Deterministic beat selection, provenance/revision checks, cap new jobs to one or two, async completion |

**Recommendation:** P2 reward. Its perceived impact is high because it concentrates visual value at a natural boundary.

### H.7 Alternative 6 — Player-triggered “illustrate this beat”

After a committed eligible beat, a button lets the player spend included or pack capacity to request one illustration. This converts uncertain automatic frequency into explicit player intent and provides a clean value signal. The button is absent for unsafe Kid cases, thin/info-only beats, duplicate already-illustrated beats, empty capacity, or an operations kill switch.

| Element | Design |
|---|---|
| Source | Frozen committed BeatSpec and revision ID |
| Eligible use | Player-selected emotional, action, discovery, or character moment |
| Cost | Predictable and capacity-metered; no speculative automatic generation |
| Failure | Return/release unused reservation when no billable job starts; offer composite/chrome if provider fails |
| Primary risk | Click spam, double debit, stale result after correction, or perceived paywall |
| Control | One active request per beat revision, idempotency, clear unit receipt, story already complete without art |

**Recommendation:** Add in P1 after accounting and stale-revision fixtures pass. It is the best Mid/High upgrade lever because user intent justifies spend.

### H.8 Free default and upgrade path

| Tier | Always-on presentation | Generated art | Player control | Recap |
|---|---|---|---|---|
| **Free** | Memorable chrome + kinetic typography; deterministic composite when assets exist | Sparse comic-lite Klein, about 20% of eligible beats under cap | Hide art and switch to composite; triggered illustration may be a scarce included action later | Text + reused plates only |
| **Mid** | Free presentation plus richer composite variants | One-panel comic-lite plus validated two-panel Klein strips | Included “illustrate this beat” and one bounded semantic repair | Four-panel async recap, mostly reused assets |
| **High** | Full presentation library | Frequent Klein; selective Pro hero/reveal/repair; validated three-panel paged strips | More illustration capacity and explicit Pro upgrade on eligible hero moments | Four/six-panel async recap with at most a small number of new panels |

### H.9 Recommendation

The strongest portfolio is **not one mode**. Free should combine Memorable chrome, kinetic typography, deterministic composite, and sparse comic-lite. Mid should add player-triggered illustration and validated two-panel strips. High should add selective Pro and async recap. If full comic never becomes economical, this portfolio still delivers readable, continuous, and delightful illustrated play while keeping text canonical and spend bounded.
