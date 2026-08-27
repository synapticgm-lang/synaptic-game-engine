# Draft C — Character consistency techniques for hosted OpenRouter Klein/Flux

> This is an intermediate synthesis. The final package will renumber citations and rewrite it into the A–H document.

## C) Character consistency techniques that fit the hosted stack

The realistic target is **recognisable enough to trust**, not pixel-perfect identity. FLUX.2 Klein 4B currently accepts up to four reference images and FLUX.2 Pro up to eight through their OpenRouter endpoint records, but the model card still warns that outputs may miss prompts and that prompting style materially affects results. Reference images improve the odds; they do not convert a probabilistic image generator into an identity renderer.

### C.1 Ranked practical methods

| Rank | Method | What it buys | Limits and degradation modes | Marginal cost/latency | Recommended use |
|---:|---|---|---|---|---|
| 1 | **Costume/kit lock fields compiled from canonical equipped slots** | Prevents prompt drift at the most trust-sensitive level: weapon, armour, clothing, carried quest item, and visible injury state | The model may omit, duplicate, swap, or stylise an item; multi-character scenes can bind one character's kit to another | Negligible prompt cost; modest prompt-length complexity | All tiers, every generated panel; future deterministic validator fields should be prepared now |
| 2 | **Prompt locks using current `visualConsistency`** | Stable names, silhouette, age band, hair, face cues, palette, body type, equipment, weapon, place, and lore anchors across jobs | Natural-language attributes compete; long prompts dilute salience; two similar characters can merge; detail consistency falls with pose/camera changes | No extra model call; no material latency increase | All tiers; compile into ordered canonical sections rather than free prose |
| 3 | **Rights-cleared reference sheet or portrait conditioning** | Stronger resemblance for a recurring character, signature object, or place than text alone; current Klein/Pro endpoints accept input references | Fine details, hands, logos, exact costume geometry, and multi-character binding can drift; references can conflict with text/style; bad references propagate errors | Same endpoint has reference support, but payload, processing, storage, moderation, and retries add overhead; provider/model changes can alter behavior | Mid and High first; one clean character sheet or portrait per focal subject, plus place/kit only when measured value exceeds collision risk |
| 4 | **Deterministic sprite/portrait composite** | Exact reuse of an approved portrait, background, and selected equipment layers; immediate fallback with zero marginal generation spend | Limited pose/camera expressiveness; layer library and art direction require rights-managed asset production; composites can look less cinematic | Near-zero per use after creation; low client rendering latency | Free default fallback and all-tier failure mode; first-class alternative, not hidden error art |
| 5 | **Seed storage** | Reproducible experiment inputs, audit trail, and same-contract retry control where the provider honours the seed | Official public documentation for comparable systems explicitly states seeds do not save identity/style and may vary across prompt/model/session changes; a seed cannot repair a changed roster or camera | Negligible | Store for every generated job if supported; expose only as diagnostics, never as a consistency promise |
| 6 | **LoRA or fine-tune later** | Potentially stronger learned association for a recurring original character or house technique | Training rights, consent, dataset quality, storage, model versioning, safety, deletion, routing, and ongoing compatibility; a LoRA may overfit one outfit/angle and still fail multi-character binding | Training and serving cost; slow setup; additional governance and operational burden | P2+ Admin/High experiment only, after reference conditioning and deterministic fallback have measurable limits |

### C.2 Prompt-lock contract

The current `visualConsistency` block should become a structured, provider-neutral contract whose fields are ordered by canonical importance. The image prompt remains pure visual description and contains no dialogue or captions.

| Section | Required fields | Compiler behavior | Failure preference |
|---|---|---|---|
| Canonical roster | Stable entity ID, display description, age band, silhouette, skin/hair/face cues, body type | Emit only characters present in the committed beat; state exact count and focal subject | Omit a secondary character rather than add an unknown person |
| Kit and weapon | Equipped slot IDs, material/colour/shape cues, handedness if canonical, visible carried item, allowed injury marker | Repeat focal equipment near both character and action clauses; declare forbidden substitutes | Show less kit rather than wrong kit; no uncommitted wound |
| Place | Stable place ID, 3–5 persistent environmental anchors, time/weather/lighting if committed | Repeat unique place anchors; remove generic genre clutter that invites invention | Neutral background rather than wrong landmark |
| Beat boundary | Approved visible state before/after the action, not inferred consequences | Depict one frozen moment and one camera intent | No new outcome, damage, object transfer, or defeated foe |
| Composition | Shot size, angle family, focal order, negative-space anchor, aspect ratio | Keep composition vocabulary bounded to tested tokens | Choose a simpler shot if it cannot fit roster and overlay safely |
| Technique | Original palette, medium, line treatment, lighting, texture, depth, screentone/ink/cel tokens | Select one named internal bundle; avoid artist/franchise names | Fall back to house-neutral treatment |
| Hard negatives | Text, letters, captions, bubbles, SFX glyphs, logos, watermarks, extra people, duplicate limbs, sexualised framing, gore glamour | Adapter translates to supported negative/prompt semantics | Skip before spend for Kid or unsafe framing; hide output if leakage occurs |

### C.3 Reference-image policy for current hosted endpoints

The current OpenRouter endpoint records support up to four input references for Klein 4B and eight for Pro. SynapticGM should start with **one reference per focal panel** because available slots are not equivalent to reliable subject binding. A high-quality reference is a rights-cleared portrait or compact sheet with a neutral pose, stable palette, no embedded text, no franchise marks, and the exact default kit. The stored record includes owner/source, consent or licence, model-use allowance, character ID, version, crop, safety status, and retirement/deletion state.

A second reference may represent a signature weapon or place when tests show it improves adherence without mixing subjects. Multi-character sheets should be avoided in P1 because the model may swap traits. If two named characters are required, use separate references only behind a tested prompt pattern and prefer a reaction close-up, over-the-shoulder, or split two-panel sequence to a crowded full-body group shot.

### C.4 Tier stacks

| Tier | Baseline stack | Eligible complexity | Repair path | Explicit promise |
|---|---|---|---|---|
| **Free** | Canonical prompt locks + equipped-slot kit lock + optional stored seed + Klein 4B on sparse eligible beats; deterministic portrait/background composite for skip/failure | One focal character preferred; at most two approved people in a simple shot; one generated panel per eligible turn | One transport retry only when no duplicate debit; otherwise simplify to composite or chrome | “Recognisable recurring look on selected moments,” not face lock |
| **Mid** | Free stack + one rights-cleared focal reference; optional place or signature-item reference after evaluation; Klein 4B for ordinary panels | One or two characters; validated two-panel action/reaction strips; simple 3-panel pages only after gates | One paid semantic repair within cap; split a failed group scene into focal/reaction panels | “Improved recurring character and kit resemblance,” with visible retry/fallback controls |
| **High** | Mid stack + Pro for hero/reveal/repair panels; up to a small tested reference bundle; premium recap candidates | Two-character hero shots only when fixture-tested; three-panel strips; 4/6 templates are recap/export-only until validated | Selective Pro escalation, then deterministic fallback; no endless rerolls | “Highest available adherence and local repair,” never pixel-perfect identity |

### C.5 Method-specific test gates

| Method | Gate before wider rollout | Kill or downgrade condition |
|---|---|---|
| Prompt locks | ≥95% correct roster/place/major weapon in sampled simple one-character plates; no prompt text leakage | Wrong roster/place/major weapon exceeds 5% or repair rate exceeds 15% |
| Focal reference | Statistically and practically improves blind identity preference over prompt-only without raising contradiction rate | Improvement is marginal, cost/latency rises materially, or kit/place errors increase |
| Multiple references | Trait-binding accuracy holds for two-character fixtures across tested camera families | Any systematic face/kit swap or reference contamination |
| Seed reuse | Same-contract retry yields useful controlled variation without misleading users | Provider does not honour seed or reruns remain effectively unrelated |
| Deterministic composite | Loads within the UI budget and always binds canonical place/entity/equipment state | Asset combinations produce contradictions, accessibility failures, or stale-state leakage |
| LoRA | Rights-complete dataset, deletion path, isolated model version, and clear uplift over references | Rights uncertainty, training-data leakage, high operational burden, or narrow overfit |

### C.6 Recommendation

The best near-term consistency stack is **canonical fields first, reference images second, deterministic reuse always available**. Do not spend P0 on LoRA. Store seeds but treat them as diagnostics. Most importantly, reduce the problem before asking the model to solve it: fewer people per panel, simpler cameras, one visible action boundary, stable equipped slots, and panel sequences that separate action from reaction. Consistency improves as much through composition policy as through model features.
