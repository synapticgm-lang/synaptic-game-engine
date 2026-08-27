0. Executive: best path for SynapticGM (thin wedge â†’ full) + what NOT to build
Best path: make Classic + Memorable feel deliberately comic before making it generate more art. The first wedge is not â€œcomic mode.â€ It is a continuity-safe illustrated beat renderer: one accepted event produces an optional, non-blocking, ledger-specified plate with HTML lettering, a visible event receipt, and a stable visual identity. The second wedge is a 2â€“3 panel strip for one validated beat or an end-of-chapter recap page, generated asynchronously after the relevant text has already committed. Full every-turn panels stay gated behind proof that the thinner modes add return, comprehension, or share intent without harming cost, latency, continuity, correction rate, or first-session completion.

Rank
Recommended sequence
Player effect
Why it works
Gate
1
Harden Memorable plates + comic chrome.
â€œI can see the moment.â€
One excellent plate, a caption, border, event title, and causal receipt can feel like a CG/page.
Do now.
2
Event-tied single plate.
â€œThe picture matches what just happened.â€
Source comes from accepted StateTx/SceneManifest, not an image modelâ€™s improvisation.
Do next.
3
Deterministic portrait/background/token layer.
â€œI recognize my party and this place.â€
Reuses canonical assets and overlays rather than rerendering identity every turn.
Do next.
4
2â€“3 panel validated-beat strip.
â€œThis was a comic scene.â€
Layout creates pacing; one beat limits spatial and identity drift.
Spike only.
5
End-of-chapter recap comic.
â€œI can look back on my arc.â€
Art is generated from selected accepted event IDs after the fact; no turn latency.
Spike only.
6
Full every-turn comic.
â€œI am playing a webtoon.â€
Highest potential delight but cost, queue, correction, and identity load compound.
No-Go until gates pass.
Explicitly do not build
No unlimited every-turn panels as the main loop.
No panel that can create an NPC, prop, injury, location, victory, or relationship fact.
No in-image generated dialogue balloons for core reading; render editable HTML/SVG overlays.
No blanket â€œface lockâ€ or seed as a false promise of exact identity.
No required story beat behind an image, image credit, or rewarded ad.
No full comic before classic text, Memorable queue, visual anchors, Kid Mode rewrite/skip, and per-panel fail UX meet their gates.

The comic effect can be faked well: a source-linked plate plus border, caption, pacing gutter, speaker badge, event title, and a right-sized crop creates â€œI saw the sceneâ€ at a fraction of a full AI comicâ€™s generation count. The player feels visual continuity because the system reused canonical assets and showed the consequence, not because it generated a new wallpaper.

1. Competitor / adjacent teardown table
Category / named public example
Effect bought
Public method
Cost / latency implication
Consistency / failure handling
Steal
Never copy
AI Dungeon image/story ecosystem
Illustration enriches an ongoing text adventure.
Story memory, lore retrieval, optional image generation alongside text. [1]
Images are optional/compute-intensive; context systems can distort old facts.
Summary/lore edits help but do not make generated art canonical.
Optional beat art and explicit story controls.
Let summaries/art override scene truth.
NovelAI image + Lorebook
Player can steer prose/art with lore, references, branches.
Triggered lore; editable memory/Authorâ€™s Note; image references; undo/retry branches. [2] [3]
Large lore sets slow context; retries and image references cost time/compute.
References guide, not guarantee; branches can multiply.
Separate durable canon from near-scene steering; per-item edit.
Flat prompt bag or manual correction as normal continuity workflow.
Midjourney character/style references
Repeated character/style appearance.
Reference image plus weight; style reference separately; seed for experiments. [4] [5]
Omni/strong reference can increase GPU time and restrict mode options.
Explicitly approximate; fine details drift.
Separate character, style, and structure anchors.
Promise pixel-perfect face/outfit or use seed as identity.
Storyboarder.ai / story-to-panel tools
Script becomes shot list, storyboard, animatic-like sequence.
Script â†’ scene breakdown â†’ shot/panel generation; camera adjustments. [6]
Multi-stage workflow and queue; high-volume panels cost.
Panel/camera edits rather than full page restart.
Plan panel script before art; panel-level repair.
Opaque one-prompt whole-page generation.
Anifusion / AI Comic Factory
Page layout, bubbles, panel editing, character refs.
Layout-first canvas, panel descriptions, inpainting, pose control, credits. [7] [8]
Credit/operation costs; final render queue.
User can repair one panel/layout.
Layout-first, async jobs, per-panel accept/retry.
Credit-wall a required narrative moment.
Visual novels / Renâ€™Py
Stable cast, emotional readability, milestone CGs.
Layered sprites; backgrounds; expression/outfit variants; event CG; save/rollback. [9] [10]
Asset production not GPU per turn; preload/cache predictable.
Renderer is scene graph, separate from story state.
Visual manifest, layered entity assets, milestone CG, pure renderer.
Asset explosion or rendering side effects mutating game state.
RPG Maker
Clear text/choice/event presentation.
Ordered event commands; picture IDs; show/move/tint/erase. [11] [12]
Cheap deterministic picture transforms.
Stable IDs and ordered event path.
Event-tied panel commands, transforms, z-order.
Brittle untyped numeric asset state.
Webtoon / vertical comics
â€œI am reading a mobile comic.â€
Single downward read path, sliced vertical images, intentional gutters, concise text. [13] [14]
Long pages require slicing/compression/prefetch.
Reading order must be explicit; bad panels can hide action at folds.
Mobile vertical beat stream, controlled whitespace, paged fallback.
Copy licensed styles, unreadable art lettering, infinite scroll assets.
VTTs: Foundry/Roll20/Owlbear
Stable spatial recognition and changing game state.
Canonical actor plus placed token; persistent scene; overlays/fog/attachments. [15] [16] [17]
Reusable assets/cache rather than unique art.
Scene/entity state is explicit; assets are layers.
Entity visual anchor + scene instance + deterministic overlays.
Let a scene image determine mechanics or secret visibility.
Graphic-novel grammar
Deliberate pace/reveal/closure.
Panel order, caption, visual focal point, gutter omission. [18]
Low generation cost if layout/chrome reused.
Text/image together clarify plot; neither alone is always sufficient.
Beat type drives panel/gutter/transition.
Let AI choose reading order or invent omitted action.
2. Effect library: 12 player effects and the cheapest method that achieves each
#
Player effect
Cheapest reliable method
Optional richer method
Ledger requirement
1
â€œI can see my character.â€
Approved portrait + outfit/condition overlay.
Event-tied half-body plate.
entityId, visualAnchorId, outfitIds, condition IDs.
2
â€œI can see who is in the room.â€
Here Now roster chips with portrait silhouettes.
Wide scene plate with only manifest actors.
SceneManifest roster and visibility.
3
â€œI can see the place.â€
Reusable location/background plate + time/weather tint.
Establishing-shot plate.
locationId, time/weather/palette.
4
â€œI can see the fight.â€
Token layer with positions, effects, camera shake/transition.
2-panel action/reaction strip.
Combat outcome, positions/range, conditions.
5
â€œI can see the twist.â€
Full-width captioned frame from accepted reveal.
Reveal/reaction two-panel strip.
Evidence/reveal event and player knowledge scope.
6
â€œIt reads like a comic.â€
Border, gutter, speaker label, HTML caption, panel number.
Vertical scroll strip.
Ordered beat IDs, not generated text in pixels.
7
â€œMy gear stays correct.â€
Deterministic equipment icon layer.
Plate generated with validated outfit/prop manifest.
Inventory and equipped-slot IDs.
8
â€œMy relationship changed.â€
Portrait tint/expression/relationship badge + receipt.
Close-up reaction plate.
Relationship StateTx and public knowledge.
9
â€œI can replay the chapter.â€
Chapter cover uses accepted Memorable plate.
3â€“6 panel recap comic.
Selected accepted event IDs / no raw draft.
10
â€œI chose the shot.â€
Camera chips: close / medium / wide; crop existing asset.
Pose/layout draft conditioning.
Must not alter actor/scene facts.
11
â€œThe world moved.â€
Parallax, pan, zoom, fade, tint, weather overlay.
One transition plate.
Time/location transition state.
12
â€œArt failure did not break play.â€
Text with stable background/token fallback.
Retry image asynchronously from same BeatSpec.
Text/ledger already committed; image status separate.
3. Architecture options
Scoring scale
Impact: player visual delight/comprehension. Cost: generation/storage/authoring burden, where lower is better. Continuity-fit: degree to which existing ledger guarantees can constrain it. Latency: player-facing delay risk, where lower is better. Scores: 1 weak/unfavourable, 5 strong/favourable.

Option
Core method
Impact
Cost score
Continuity-fit
Latency score
Verdict
A. Memorable-only hardening
Existing plate, source receipt, comic border/overlay, chapter reuse.
4
5
5
5
Now.
B. Sprite + background composite
Stable entity portrait layers plus location plate and deterministic effects.
4
5
5
5
Now/next.
C. Event-tied single plate
One generated image for accepted high-value beat.
4
4
5
4
Next.
D. 2â€“3 panel beat strip
Thumbnail storyboard then selected final panel group for one accepted beat.
5
3
4
3
Spike only.
E. End-of-chapter recap comic
Generate after selected accepted event IDs; no in-turn wait.
5
3
5
5
Spike only.
F. Full every-turn comic
Generate page/panel after every accepted turn.
5
1
1
1
No-Go.
G. HTML/SVG comic overlay on existing art
Reuse art with gutters, captions, balloons, panel crops, motion/tint.
4
5
5
5
Now.
H. Player-directed storyboard scratch layer
Layout/shot selection before a final image batch.
4
3
4
3
Later.
A. Memorable-only hardening
Mechanism: extend memorableMoments with beatId, eventIds[], sourceReceipt, visualCanonVersion, presentationTemplate, caption, and approvalStatus. Render plate in a full-bleed but text-first card: top caption, subtle frame, location/time slug, one optional clickable â€œwhat changedâ€ receipt. Reuse approved art as a chapter cover or gallery card.

Why it is the first wedge: it creates perceived production value without introducing panel sequence/reading-order/state-drift problems. It needs only the existing failure contract: queue does not block text; fail holds story; Kids prompt rewrite/skip happens before spend.

B. Sprite + background composite
Mechanism: render SceneVisualManifest from deterministic assets:

interface SceneVisualManifest {
  sceneId: string; beatId: string; backgroundAssetId: string;
  participants: Array<{entityId:string; portraitId:string; outfitIds:string[];
    expression:'neutral'|'tense'|'hurt'|'joy'|'angry'; pose:'idle'|'ready'|'wounded';
    x:number; y:number; scale:number; z:number; visible:boolean}>;
  props: Array<{inventoryId:string; assetId:string; x:number;y:number;z:number}>;
  overlays: Array<'rain'|'fog'|'heat'|'damage'|'spell'|'known-map'|'unknown-map'>;
  paletteId:string; camera:{crop:'close'|'medium'|'wide'; focusEntityId?:string};
  version:string;
}

The renderer is pure: a changed SceneManifest changes the composite, but a composite never changes the SceneManifest. This borrows VTT actor-versus-token separation and visual-novel layered images. [9] [15]

C. Event-tied single plate
Mechanism: acceptedStateTx â†’ BeatSpec â†’ visual prompt compiler â†’ low-cost validation thumbnail â†’ final image job â†’ optional overlay. The allowed actor list, outfit IDs, props, location, event verb and knowledge scope are hard fields, not mere prose hints. Required-field failure sets needsRepair; it does not accept the image.

D. Twoâ€“three panel beat strip
Mechanism: use a single validated beat, not a full free-form turn. Panel 1 establishes/sets choice outcome; panel 2 shows action/reaction; panel 3 is consequence/aftermath. Generate low-resolution contact sheet or separate thumbnails; user/system accepts individual panel candidates; final uses fixed panel templates. All dialogue/captions are HTML overlays.

Gate: only after Options Aâ€“C show that visual anchors, job queue, Kid rewrite/skip, per-panel repair, and cost telemetry work. Panel count must remain bounded by beat taxonomy.

E. End-of-chapter recap comic
Mechanism: at chapter close, select 3â€“6 acceptedEventIds by player importance/pinned anchors/quest milestoneâ€”not model salience alone. Create a recap script after the fact, with source links. Render asynchronously, then add to gallery/export. The player may replace a panel with an existing Memorable plate. Because it is not on the action path, this produces a strong comic effect with the safest latency and correction model.

F. Full every-turn comic
Why No-Go: model variations mean each turn must solve cast identity, wardrobe, props, location, spatial relations, comic layout, dialogue legibility, chronology, and safety; retries/corrections multiply work. It creates an expensive parallel narrative that players will treat as factual even when the text ledger says otherwise. If ever revisited, it needs a fully proven visual manifest, sprite fallback, panel provenance, per-panel correction, batch queue, cost cap, accessibility transcript, and a hard text-first truth rule.

4. Consistency stack mapped to SynapticGM ledger
Layer
Source-of-truth input
Data written
What renderer may do
What renderer may not do
Campaign visual canon
Opening canon + accepted visual choices.
VisualCanon: palette, medium, silhouette rules, location styles, exclusions.
Select persistent style tokens.
Override world/campaign canon or use protected/licensed style.
Entity visual anchor
Entity ID, player-approved portrait/reference, canonical traits.
VisualAnchor: face/silhouette/outfit baselines, reference asset IDs, model/version/rights.
Condition image or choose sprite.
Infer a new identity/age/relationship/physical trait as fact.
Kit / condition
Inventory/equipment/status StateTx.
OutfitManifest / PropManifest, condition overlays.
Draw known equipped items/visible wounds.
Invent a weapon, armour, wound, or remove item.
Scene
SceneManifest and locality/visibility wardens.
SceneVisualManifest, actors, known exits, weather, palette.
Frame only present/visible actors and permitted setting.
Add absent people/places, reveal secrets, move actors.
Beat
Accepted event / combat result / quest receipt.
BeatSpec: type, causal receipt, allowed inference, camera, panel count.
Illustrate a defined action/reaction/aftermath.
Change success/failure, causality, damage, loot, dialogue fact.
Image generation
Prompt compiler + reference/structure controls.
RenderJob, prompt hash, model/seed/reference versions, status.
Create provisional pixels.
Commit a StateTx or change ledger fields.
Review / repair
Visual validator + user repair action.
VisualRevision, issue tags, accepted/rejected reason.
Targeted re-render/crop/inpaint.
Silently replace an approved chapter asset.
Presentation
HTML/SVG overlay and webtoon/page renderer.
PanelLayout/cached asset derivatives.
Add captions/gutters/camera/tint/transitions.
Generate new story text or reorder causality.
Visual anchors: practical hierarchy
Anchor type
Use
Cost / risk
Launch recommendation
Deterministic portrait/sprite
Identity, expression, outfit layer.
Lowest cost; needs authored/approved assets.
Core.
Approved Memorable plate
Chapter cover/recall/reuse crop.
Low incremental cost.
Core.
Character reference embedding/image
Single event plate.
Better identity, still approximate.
Use after consent/rights/quality check.
Structure/pose guide
Multi-character panel composition.
More latency/complexity.
Spike only.
Seed
Debug/reproducibility metadata.
Does not preserve appearance across version/settings.
Store but never rely on it.
Inpainting
Repair one validated visual issue.
Can drift surrounding image.
Later, guarded.
Required visual generation key:

renderKey = hash(
  acceptedEventIds + sceneManifestVersion + visualCanonVersion +
  entityVisualAnchorVersions + outfitManifestVersions + panelLayoutVersion +
  modelVersion + generatorPolicyVersion
)

A cached result is valid only if its complete render key matches. A text correction or StateTx that changes a required visual field invalidates the asset for new presentation but preserves historical approved panels with their original event/version label.

5. Panel grammar + fire contracts (when to generate)
Beat taxonomy and panel treatment
Beat type
Fire condition
Cheapest treatment
Optional illustrated treatment
Must not fire when
Establishing
New meaningful location or changed return state, accepted in SceneManifest.
Existing background + location slug/palette transition.
One wide plate.
Mere mention of a place; unknown/secret location.
Reaction
Accepted consequence changes one identified participantâ€™s public emotional state.
Portrait expression/relationship badge.
Close-up single panel.
Emotion inferred without StateTx/evidence.
Action
Combat/check/physical move resolved in ledger.
Token/effect overlay + camera shake.
2-panel action/reaction strip.
Before result is adjudicated.
Reveal
Player-visible evidence resolves or changes a case/quest/identity fact.
Full-width caption/reveal frame.
Reveal + reaction pair.
GM-only information; unresolved suspicion.
Aftermath
A durable consequence is written: injury, item transfer, route change, promise, death.
State receipt + reused assets.
Memorable consequence plate.
Pure dialogue/no lasting outcome.
Transition
Accepted time/place transition.
Fade/pan/palette/gutter.
New background/cover.
No actual state transition.
Player portrait
Explicit player request at safe boundary.
Reuse approved visual anchor.
New portrait plate.
Kid safety/rights/visual policy rejects it.
Chapter close
Chapter threshold/quest phase or player saves at clear boundary.
Cover reuse + selected receipts.
3â€“6 panel recap.
During unresolved action.
BeatSpec contract
interface BeatSpec {
  beatId: string; acceptedEventIds: string[]; type:
    'establishing'|'reaction'|'action'|'reveal'|'aftermath'|'transition'|'chapter_recap';
  truthReceipt: {whatChanged:string; sourceIds:string[]};
  visibleEntityIds: string[]; requiredEntityIds: string[]; requiredPropIds: string[];
  locationId: string; timeStateId: string; knowledgeScope:'player_known'|'public';
  panelTemplate:'single_wide'|'single_close'|'diptych'|'triptych'|'vertical_recap';
  allowedInference:string[]; forbiddenDepictions:string[];
  textOverlay:{caption?:string; dialogueIds?:string[]}; visualCanonVersion:string;
}

BeatSpec is emitted only after the text/ledger commit. allowedInference permits visual closure, such as a hand tightening around an already-held key; it never permits an unrecorded attack, new character, new item, secret clue, or changed outcome.

Lettering and second-person framing
Problem
Rule
In-image text errors
Use HTML/SVG overlay: caption, speech bubble, sound effect, speaker label, transcript ID.
Second-person protagonist
Default camera is over-shoulder, hands/kit in foreground, reflected/silhouette portrait, or player-selected avatar. Do not invent face/identity unless VisualAnchor permits it.
Player dialogue
Quote only accepted player input or a short rewritten line explicitly approved by text interface; do not fabricate intent in a balloon.
NPC dialogue
Use already accepted/provenance-linked dialogue text; truncate into readable overlay without altering meaning.
Accessibility
Every panel has alt text from BeatSpec and full text transcript; overlay scales/reflows.
Reading order
Panel IDs and sequence are assigned deterministically; page/vertical renderer never infers order from pixels.
Webtoon grammar
Use fixed, tested templates: single_wide, two_vertical, action_diptych, reveal_pause, three_beat_strip, chapter_recap. Gutter size maps to time/beat metadata: compact = immediate action; medium = reaction; large = location/time jump/reveal pause. This borrows controlled vertical pacing without pretending the renderer understands comic causality. Public webtoon guidance emphasises mobile slicing and previewing, while comic-navigation research shows that irregular layouts can confuse reading order. [13] [18]

6. Failure UX (pending/fail holds story) + Kid Mode
Render lifecycle
ACCEPTED_TEXT_AND_STATE
  â†’ BEAT_ELIGIBLE
  â†’ KID/RIGHTS/POLICY REWRITE_OR_SKIP (before spend)
  â†’ RENDER_SPEC_COMPILED
  â†’ OPTIONAL_THUMBNAIL_QUEUED
  â†’ FINAL_RENDER_QUEUED
  â†’ VALIDATE_REQUIRED_FIELDS
  â†’ ACCEPTED_VISUAL | NEEDS_REPAIR | SKIPPED | FAILED

State
Player sees
System does
Capacity rule
Not eligible
Normal text / existing composite.
No job.
No visual spend.
Pending
Text scene and â€œIllustrating this beatâ€ non-blocking tile.
Queue with exact BeatSpec/render key.
Reserve only if policy permits; release if no attempt.
Draft ready
Blurred/marked â€œDraft visualâ€”does not change the story.â€
Run validator; offer approve/repair/cancel.
Finalize only on accepted job policy.
Accepted
Panel with receipt/caption; gallery/recap eligibility.
Cache/version source key.
Debit according to plan.
Needs repair
Last approved panel/composite remains; issue: outfit, actor count, prop, unsafe content, unreadable art.
Targeted repair only; no global reroll.
Failed-quality attempt follows published no-spend/refund rule.
Failed
Text remains, stable fallback visual, â€œTry laterâ€ / no image controls.
Log job error safely; backoff.
No debit or automatic reversal.
Invalidated by correction
Historical panel marked â€œearlier recordâ€; current scene uses updated visual manifest.
Invalidate future cache key, not history.
No surprise re-charge.
Kid Mode rules
Rule
Mechanism
Rewrite/skip before spend
kidVisualPolicy(BeatSpec) returns allow, safe_rewrite, or skip; unsafe beats remain text-only.
Asset separation
Kid profile cannot address adult reference, cached artifact, prompt, gallery, or model route.
Safer framing
No sexualisation, graphic injury, terror close-ups, weapons glamour, adult props, or unsafe visual context; use symbolic/aftermath/reaction framing.
No pressure
No image reward ad, no â€œwatch to seeâ€ gate, no upsell on skipped image.
Parent-facing clarity
â€œThis moment stays in text because your family-safe visual rules are active.â€
7. UX flows: Classic / Memorable / Comic toggle; mobile webtoon vs paged
Mode model
Mode
Default content
Generation behavior
Who it is for
Classic
Text, HUD, deterministic portrait/map tokens optional.
No automatic image.
Players who want fastest text-first play.
Memorable
Classic plus existing curated event plates/gallery.
Low-frequency eligible/requested plates.
Most launch users.
Illustrated (thin wedge)
Classic plus event-tied single plate or compact strip at selected beats.
Async and capped.
Opt-in beta cohort.
Comic (future)
Same ledger/text with vertical/paged panel rendering.
Only validated beat groups / recap pages.
Gated after evidence, never a separate canon.
Mobile vertical flow
Player reads accepted prose and makes a choice.
Text/state commits and HUD receipt appears.
At eligible beat, a panel tile may arrive below the receipt; the player can continue immediately.
Vertical view renders one beat chunk, with skeleton placeholder only; long recap is sliced/paged and cached.
Tap switches to transcript, grid/page, or â€œwhat changedâ€ receipt without altering campaign.
Swiping a panel never creates a retry branch; repair opens explicit per-panel controls.

Paged/grid flow
Use for recap, desktop, gallery, and export. Page templates are deterministic 1/2/3/6 panel layouts; grid click opens full panel plus transcript/provenance. No image is required to traverse pages; retained accepted text is the accessibility/backstop layer.

Visual inspector
Simple
Expert
â€œThis illustration is based on: [short consequence receipt].â€
Event IDs, SceneManifest version, entity/outfit anchors, layout, model/version, seed, reference assets, status, repair history.
â€œThe story continued while art was prepared.â€
Render key, prompt compiler version, validator warnings, cache/invalidation reason.
â€œThis art is from an earlier version of the campaign.â€
Branch/take/version relationship and source diff.
8. SKU & caps recommendation (90-day vs later)
90-day policy
Tier
Keep forever
90-day visual offer
Hard cap / fairness
Free
Classic text, visual-token HUD, existing approved plates in campaign history, text-first fallback.
One trial-once event-tied Illustrated beat only after HookArc; optional existing opener/Memorable policy.
No story gate, no required-ad beat; per-week visual trial/cap disclosed.
Mid Â£14.99
Same continuity, correction, safety, Classic/Memorable history.
Higher Memorable allocation; beta opt-in for one limited strip/recap queue.
Cap based on measured COGS; no skip of safety/queue.
High Â£29.99
Same truth/safety plus higher creation allowance/priority queue.
More chapter recap or panel-beat allowance after quality gate.
No unlimited panels; fairness budget published.
Packs
Accepted text capacity / optional visual packs only if existing product policy supports.
Buy more elective visuals, not a missing ending/required scene.
Failed/blocked image is refunded/no-spend.
Admin BYOK
No special visual safety/continuity bypass.
Later adult-web-only implementation if approved.
Not a 90-day comic answer.
Kid Mode
Text, safe existing UI assets, sanctioned Memorable only if policy allows.
No visual ads; conservative rewrite/skip.
Never less continuity or safety because tier/mode.
Cost formula and gates
visual_cost_per_eligible_user =
  (thumbnail_jobs Ã— thumbnail_cost + final_jobs Ã— final_cost + storage/egress
   + moderation + failed_jobs_not_recovered) / eligible_users
visual_incremental_value = lift_in_return + lift_in_comprehension + lift_in_share_intent
                           + lift_in_paid_conversion âˆ’ churn/support/safety_cost

Kill / do-not-scale gates:

Gate
Stop/hold rule
Text latency
Visual beta causes accepted-text p95 latency increase >0 by coupling jobs to turn path.
Truth
Any confirmed visual-caused player misconception/correction that changes state or a high-severity leak.
Safety
Any Kid/adult asset boundary fault or unsafe visual policy miss.
Cost
Visual cost exceeds approved tier/session envelope for two consecutive cohorts without measurable value lift.
Queue
Pending visual is still unresolved after player has advanced two accepted beats at unacceptable frequency.
Retention
No meaningful lift in pre-registered return/comprehension metric and a decline in first-session completion.
Support
Repair/failure tickets exceed capacity or perceived â€œbroken storyâ€ complaints rise.
9. Evaluation: how to A/B â€œsame effectâ€ without vanity image count
North-star metric
Verified visual consequence recall: on a later return, player correctly identifies a consequence, actor, item, or route from a visual/text prompt and the answer matches the ledger. This measures comprehension and continuity, not art consumption.

Metric
Definition
Guardrail
Beat comprehension
Correct answer to low-friction â€œwhat changed?â€ or choice relevance.
Must match accepted event.
Visual consequence recall
Return-session recall of event/actor/item aided by panel.
No spoiler leakage.
Narrative continuation
Next accepted turn after an eligible visual/skip.
Image cannot delay turn.
D1/D7 qualified return
Return after HookArc/accepted consequence.
Segment by genre/tier/mode.
Visual approval rate
Player retains/uses accepted panel or chapter cover.
Not a proxy for truth.
Repair rate by failure type
Outfit, actor, prop, composition, safety, lettering.
Trend should fall with visual anchors.
Correction/misconception rate
Player says visual contradicted text/ledger.
Any high-impact contradiction is P0.
Incremental share/export intent
Player chooses recap/export, not auto-generated social share.
Privacy/consent respects.
Cost per qualified returning user
Incremental visual cost divided by eligible-return lift.
Never optimize with less safety.
Experiment designs
Test
Variant A
Variant B
Primary metric
Kill rule
Comic chrome
Memorable plate plain.
Same plate + caption/frame/receipt/gutter.
Approval/comprehension.
If chrome confuses text reading.
Anchor type
Generated portrait each event.
Stable sprite + event plate.
Identity error/repair rate.
Generated route produces drift.
Plate timing
Immediately after commit.
Deferred at next natural scroll/return.
Continuation and perceived interruption.
Any text latency/increased exit.
Strip
Single event plate.
2-panel accepted-beat strip.
Recall/comprehension.
Cost/queue without lift.
Recap
Text recap.
Text recap + 3-panel chapter recap.
Return/chapter completion.
Spoiler or correction incident.
Lettering
Image-generated text.
HTML/SVG overlay.
Readability/accessibility/repair.
Image text is not a production contender if it fails.
10. 60-day spike plan (max 6 spikes)
Spike
Hypothesis
Build slice
Success metric
Kill criteria
1
Comic chrome makes existing Memorable plates feel panel-like with no model cost.
Template frame/caption/receipt/gutter/gallery cover.
+comprehension/approval with zero turn latency.
Users report chrome obscures prose or no lift.
2
Deterministic scene composites achieve â€œI see the roomâ€ more safely than generation.
SceneVisualManifest, portraits, background plates, effects, pure renderer.
Roster/kit correctness â‰¥99% fixture suite; positive usability.
Overlay maintenance/composite load hurts mobile.
3
Event-tied single plate retains credibility.
BeatSpec/prompt compiler/queue/validator/source inspector.
Zero state mutation; panel source trace 100%; acceptance/repair targets.
Required actor/prop drift or Kid fault.
4
One 2-panel action/reaction strip adds comprehension beyond one plate.
Low-res storyboard + fixed diptych + HTML captions.
Measured comprehension/return lift vs single plate.
Cost/queue/repair > budget.
5
Recap comic makes long campaigns easier to return to.
Select event IDs; chapter script; 3â€“6 panel async recap; grid/vertical views.
Return/resume and recall lift.
Spoiler/recap contradiction/low usage.
6
Targeted repair is cheaper and more trusted than full reroll.
â€œrestore jacket/face/prop/cameraâ€ repair spec and per-panel history.
Repair success vs reroll cost; lower discard rate.
Repair drifts adjacent canonical fields.
11. Open founder decisions
Decision
Recommendation
Alternative
Cost if wrong
90-day visual headline
â€œMemorable scenes with comic presentation,â€ not full Comic Mode.
Promise webtoon play.
Overpromise creates queue/consistency debt.
First thin wedge
Comic chrome + event receipt on existing plates.
2-panel generation first.
Starting with strips complicates layout/repair before basics.
Character identity
Start deterministic portrait/sprite anchors; add image reference only to event plate.
Fully generated character every time.
Drift destroys recognition/trust.
Perspective
Over-shoulder/hands/silhouette by default for second person.
Invent protagonist face.
Player identity mismatch/consent issue.
Lettering
HTML/SVG overlay only.
Generated text in art.
Legibility/localization/accessibility failure.
Visual repair
Explicit per-panel repair after approval.
Silent auto-reroll.
Player loses beloved art/canâ€™t explain change.
Free trial
One HookArc-complete Illustrated beat, text-first fallback.
No free trial.
Too generous harms cost; none hides product effect.
Recap comic
Build only after event plate telemetry; use selected accepted IDs.
Immediate auto recap every chapter.
Auto-selection/safety cost and false importance.
Full comic gate
Require 2 consecutive cohorts meeting cost, recall, latency, safety, repair, and D1/D7 thresholds.
Roadmap commitment now.
Full stack distracts from ledger/text product.
References
[1]: https://help.aidungeon.com/faq/the-memory-system ; https://help.aidungeon.com/faq/story-cards"AI Dungeon memory and Story Cards"[2]:https://docs.novelai.net/en/text/lorebook/ ; https://docs.novelai.net/en/text/editor/storysettings/"NovelAI lore and story settings"[3]:https://developers.openai.com/api/docs/guides/image-generation"Image-generation and editing workflow"[4]:https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference ; https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference"Reference-image guidance"[5]:https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference ; https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds"Style references and seed limitations"[6]:https://www.storyboarder.ai/"Storyboarding workflow"[7]:https://anifusion.ai/"Layout-first AI comic workflow"[8]:https://aicomicfactory.com/"Panel/credit/character-reference workflow"[9]:https://www.renpy.org/doc/html/layeredimage.html ; https://www.renpy.org/doc/html/screens.html"Layered sprites and pure UI screens"[10]:https://www.renpy.org/doc/html/transitions.html ; https://www.renpy.org/doc/html/save_load_rollback.html"Transitions and rollback state"[11]:https://rpgmakerofficial.com/product/MZ_help-en/01_10_01.html"RPG Maker message and choice events"[12]:https://rpgmakerofficial.com/product/MZ_help-en/01_10_08.html"RPG Maker picture commands"[13]:https://m.webtoons.com/en/notice/detail?noticeNo=1766 ; https://www.clipstudio.net/how-to-draw/archives/157055"Vertical webtoon layout patterns"[14]:https://pmc.ncbi.nlm.nih.gov/articles/PMC3629985/ ; https://openaccess.thecvf.com/content_cvpr_2017/html/Iyyer_The_Amazing_Mysteries_CVPR_2017_paper.html"Comic navigation and closure research"[15]:https://foundryvtt.com/article/tokens/ ; https://foundryvtt.com/article/scenes/"Actors, tokens, and persistent scenes"[16]:https://help.roll20.net/hc/en-us/articles/4403861702679-How-To-Set-Up-Dynamic-Lighting"VTT visibility state"[17]:https://docs.owlbear.rodeo/docs/getting-started/ ; https://docs.owlbear.rodeo/docs/scenes/"Layered VTT scene patterns"[18]:https://github.com/tencent-ailab/IP-Adapter ; https://arxiv.org/abs/2302.05543 "IP-Adapter and ControlNet"
