1. SynapticGM module map
Wedge / capability
Primary module(s)
Verdict
Implementation sentence
Comic chrome on existing Memorable plates
memorableMoments.ts, ComicGrid, comicScriptAdapter.ts, ComicTextAnchor
EXTEND
Add ComicChromeSpec and a text-overlay render path around already-attached Memorable images; do not alter the existing image trigger or capacity decision.
Source receipt on a plate
memorableMoments.ts, SceneManifest, StateTx receipt surface
HARDEN
Persist the accepted event/StateTx IDs and a short player-safe receipt beside every plate so the UI can disclose exactly what art is illustrating.
Event-tied single plate
visualCanon.ts, generate-image edge proxy, SceneManifest, kit/inventory/portrait pipeline
EXTEND
Compile a BeatSpec only after an accepted state commit, then call the existing proxy with a bounded manifest slice and profile-specific image policy.
Prompt safety and Kid rewrite
prepareKidSafeImagePrompt, softenPrompt, visualCanon.ts
HARDEN
Make `allow
Sprite/background composite
SceneManifest + kit/inventory/portrait pipeline, ComicGrid
NEW FILE
Add sceneVisualManifest.ts as a pure projector from canonical scene, visual anchors, kit and condition data into reusable layers; ComicGrid only consumes that projection.
Two-panel accepted-beat strip
comicScriptAdapter.ts, ComicTextAnchor, generate-image edge proxy, ComicGrid
EXTEND
Add fixed diptych panel template support to the existing adapter and generate only after a single accepted BeatSpec; lettering remains overlay data.
Chapter recap comic
memorableMoments.ts, comicScriptAdapter.ts, ComicGrid
NEW FILE
Add recapScript.ts to select accepted event IDs and write a source-linked RecapScript; reuse approved Memorable assets before new generation.
Visual anchors for entity/outfit/place
visualCanon.ts, kit/inventory/portrait pipeline
EXTEND
Store canonical reference asset IDs and versioned appearance tokens by entity, kit slot, and location; never infer anchors from a generated image.
Image-job persistence and capacity reconciliation
generate-image edge proxy, capacity memorable spend/refund, Ops images kill switch
HARDEN
Give every attempt an ImageJob with reservation, moderation, retry, attach and refund states; only one terminal capacity action is permitted.
Targeted visual repair
generate-image edge proxy, visualCanon.ts, ComicGrid
NEW FILE
Add visualRepair.ts to compile only allowed repair deltasâ€”jacket, face, prop, cameraâ€”against the prior accepted BeatSpec and render key.
Stale-art markings after correction
StateTx/correction handler, ComicGrid, memorableMoments.ts
HARDEN
A correction invalidates future use where required fields changed and adds an â€œearlier campaign recordâ€ banner to already-accepted historical art; it does not delete evidence.
Feature flags / emergency stop
VITE_OPS_IMAGES_OFF, Ops images kill switch, ComicGrid
HARDEN
The kill switch must stop job creation and hide pending queues while preserving text, receipts, already-attached assets, and deterministic composite fallback.
2. Copy-paste schemas
export type BeatType =
  | 'opening' | 'first_blood' | 'boss' | 'death' | 'writer_offer'
  | 'beauty_offer' | 'ruler_audience' | 'chapter_close'
  | 'portrait_request' | 'ending' | 'action' | 'reaction' | 'reveal' | 'aftermath';

export type ImageJobStatus =
  | 'not_requested' | 'policy_skipped' | 'pending' | 'rendering'
  | 'needs_repair' | 'failed' | 'moderated' | 'attached' | 'stale';

export interface BeatSpec {
  id: string;
  campaignId: string;
  branchId: string;
  beatType: BeatType;
  acceptedEventIds: string[];
  stateTxIds: string[];
  sceneManifestVersion: string;
  visibleEntityIds: string[];
  requiredEntityIds: string[];
  requiredItemIds: string[];
  locationId: string;
  knowledgeScope: 'player_known' | 'public';
  panelTemplate: 'single' | 'diptych' | 'recap';
  camera: 'close' | 'medium' | 'wide' | 'over_shoulder';
  allowedInference: string[];
  forbiddenDepictions: string[];
  textAnchorIds: string[];
  createdAt: string;
}

export interface SceneVisualManifest {
  sceneId: string;
  sceneManifestVersion: string;
  background: VisualAnchor | null;
  participants: Array<{
    entityId: string;
    anchor: VisualAnchor;
    outfitAnchorIds: string[];
    expression: 'neutral' | 'tense' | 'hurt' | 'joy' | 'angry';
    pose: 'idle' | 'ready' | 'wounded';
    visible: boolean;
    x: number; y: number; z: number; scale: number;
  }>;
  props: Array<{ itemId: string; anchorId: string; x: number; y: number; z: number }>;
  overlays: Array<'rain' | 'fog' | 'heat' | 'damage' | 'spell' | 'known_map'>;
  paletteId: string;
}

export interface VisualAnchor {
  id: string;
  kind: 'entity' | 'outfit' | 'place' | 'prop';
  canonicalId: string;
  assetIds: string[];
  referenceAssetIds: string[];
  traits: string[];
  excludedTraits: string[];
  styleProfileId: string;
  version: string;
  approvedAt: string;
}

export interface PanelReceipt {
  panelId: string;
  beatId: string;
  acceptedEventIds: string[];
  stateTxIds: string[];
  playerSafeSummary: string;
  sceneManifestVersion: string;
  renderKey: string;
  status: 'current' | 'earlier_record' | 'repaired';
}

export interface ComicChromeSpec {
  template: 'classic_plate' | 'single_panel' | 'diptych' | 'vertical_recap';
  panelOrder: number;
  caption?: string;
  speakerLabels: Array<{ anchorId: string; entityId?: string; text: string }>;
  gutter: 'compact' | 'standard' | 'pause' | 'chapter_break';
  paletteId: string;
  reducedMotion: boolean;
}

export interface RepairSpec {
  jobId: string;
  panelId: string;
  repairKind: 'jacket' | 'face' | 'prop' | 'camera' | 'background' | 'other';
  preserve: Array<'roster' | 'kit' | 'place' | 'pose' | 'palette' | 'lettering'>;
  requestedChange: string;
  sourceRenderKey: string;
  approvedByPlayer: boolean;
}

export interface RecapScript {
  id: string;
  campaignId: string;
  chapterId: string;
  eventIds: string[];
  panels: Array<{ beatId: string; eventIds: string[]; caption: string; template: 'single' | 'diptych' }>;
  selectedBy: 'player' | 'policy';
  sourceVersion: string;
}

export interface ImageJob {
  id: string;
  campaignId: string;
  beatId: string;
  status: ImageJobStatus;
  renderKey: string;
  profile: 'kid' | 'adult';
  capacityClass: 'free_trial' | 'weekly' | 'paid' | 'ad_extra' | 'none';
  reservationId?: string;
  assetId?: string;
  failureCode?: 'provider' | 'timeout' | 'moderated' | 'validator' | 'ops_off' | 'stale';
  repairOfJobId?: string;
  createdAt: string;
  updatedAt: string;
}

3. Fire contract table vs CURRENT memorable beats
Current / proposed beat
Fire now?
Chrome only?
Generate plate?
Strip eligible later?
Kid rewrite / skip
Capacity class
Never-block-story rule
Opening
Yes, existing opener logic.
Yes.
Existing opener policy only; no second automatic request.
No.
Rewrite background/figures or skip.
Existing opener/free policy.
Opening text appears even if all image routes are off.
First Blood / dungeon final boss
Yes, existing First Blood/boss logic.
Yes.
Yes if current cap/policy allows after accepted combat receipt.
Later, boss only.
Symbolic action/reaction or skip.
Existing weekly / earned capacity.
Combat result, loot and XP commit before job.
Death
Yes, existing death logic.
Yes.
Yes only after death StateTx survives all correction/revival handling.
Later, not in Kid Mode by default.
Consequence/aftermath rewrite or skip graphic frame.
Existing memorable allowance.
Death/revival flow never waits for art.
Writer-tag
Yes, writer-offer remains explicit.
Yes, when selected.
Only on accepted writer offer; no hidden auto-fire.
No.
Apply rewrite/skip before reservation.
Existing writer-offer allocation.
Declining or failing the offer changes no story state.
Beauty / stunning offer
Yes, beauty offer remains explicit.
Yes.
Only if consented/eligible and visual policy permits.
No.
Conservative portrait rewrite or skip.
Existing beauty-offer allocation.
Never imply attraction, consent or identity in art beyond accepted text.
Ruler audience
Proposed trigger, not automatic launch trigger.
Yes.
Later, if a durable audience/reputation StateTx exists.
Later, reaction diptych only.
Court-symbol/setting rewrite or skip.
Paid/earned, no free automatic spend.
The rulerâ€™s presence, promise and audience result are text-first.
Chapter close
No auto-generation in wedge 1.
Yes: chapter cover chrome on existing plate.
Later recap/cover only.
Recap, not live strip.
Safe recap selection or text-only.
Mid/High later or explicit earned allocation.
Chapter saves/next chapter always proceed.
Player-requested portrait
Explicit request only.
N/A.
Yes if permitted and capacity available.
No.
Rewrite to safe silhouette/outfit or skip.
Trial / paid visual request.
Portrait request must not mutate character traits.
Ending plate
Yes, end milestone only after ending receipt.
Yes.
Yes under ending policy.
Later recap only.
Rewrite symbolic conclusion or skip.
Ending allocation / earned.
Ending text, rewards, archive and export do not depend on image completion.
4. Prompt compiler recipes (Flux schnell / OpenRouter path)
Compiler contract
function compileImagePrompt(input: {
  beat: BeatSpec;
  scene: Pick<SceneVisualManifest, 'background' | 'participants' | 'props' | 'overlays' | 'paletteId'>;
  anchors: VisualAnchor[];
  profile: 'kid' | 'adult';
}): { prompt: string; avoid: string[]; policy: 'allow' | 'rewrite' | 'skip' } {
  // 1. Reject missing required anchors / non-player-known facts.
  // 2. Run prepareKidSafeImagePrompt or softenPrompt before capacity reservation.
  // 3. Compile only required roster, kit, place, action, camera, palette and no-text rules.
  // 4. Return allow/rewrite/skip; edge proxy receives only allow/rewrite content.
  throw new Error('implementation placeholder');
}

Prompt grammar: [original visual medium profile]. [camera]. Depict exactly [required roster] at [canonical place], with [required kit/props], illustrating [accepted consequence]. [Palette/lighting]. No written words, no captions, no speech bubbles, no logos.

Always append to avoid list: unlisted people, extra hands, absent party members, alternate outfit, different weapon, invented vehicle, invented location, readable dialogue, speech bubble text, logos, watermark, copyrighted character, named living artist style, recognisable franchise style, sexualised minor, graphic child harm.

Example BeatSpec
Compiled final image prompt
Extra avoid / enforcement
opening, Bramblegate, player anchor Mira, lantern + travel cloak, over-shoulder
Original ink-wash fantasy illustration with restrained teal and amber palette. Over-the-shoulder medium shot from Mira's travel-cloaked viewpoint at the known Bramblegate entrance, lantern in her left hand, showing only the rain-wet gate and the player-known road beyond. Establishing mood, no action beyond arrival. No written words, captions, dialogue or logos.
Require Mira cloak/lantern anchors; reject added guard or new building.
first_blood, Glassroot Cavern, Mira + known glass wolf, iron spear
Original high-contrast fantasy comic plate. Medium action framing in the known Glassroot Cavern: Mira in her recorded travel cloak holds the recorded iron spear after the accepted defeat of the single glass wolf. Show aftermath, fractured crystal dust, no new enemies, no loot beyond the ledger. No written words or speech balloons.
Kit must include spear; result must be accepted before fire.
death, Ash Bridge, known NPC Toren, broken bridge token
Original sombre painterly fantasy plate. Wide aftermath view at the known Ash Bridge: Toren's recorded blue coat beside the recorded broken bridge railing, with Mira visible only as an over-shoulder silhouette. Depict loss without injury detail, no new characters, no readable text.
Kid profile rewrites to abandoned blue coat/lantern or skips.
writer_offer, Starling Archive, Mira, silver key, desk
Original clean line-and-watercolour illustration. Close table-level view in the known Starling Archive: Mira's recorded gloved hand holds the recorded silver key above the archive desk. Illustrate the accepted decision moment only; no face invention, no extra documents, no written text.
Overlay supplies accepted caption; no invented library lore.
ruler_audience, Sun Court, Mira + Queen Aveline, formal cloak + crown
Original ceremonial fantasy comic plate, warm gold and indigo palette. Symmetrical medium-wide view of Mira in the recorded formal cloak facing the known Queen Aveline in the known Sun Court, illustrating the accepted audience. Both figures remain separated by the recorded dais distance. No written words, banners with text, or additional courtiers.
Only fires after audience is canonical and public to player.
chapter_close, selected accepted events at Moonwell, Mira + companion Jae
Original vertical recap cover, soft moonlit blue palette. A single quiet aftermath scene at the known Moonwell: Mira and the known companion Jae in their recorded current outfits, standing beside the recorded moonwell after the accepted chapter milestone. No new plot action, no written words, no speech balloons.
Prefer approved existing plates before new render; captions are HTML.
Flux schnell / OpenRouter execution rules
Rule
Enforcement
Fast model is not a truth model.
Edge proxy receives a signed BeatSpec/render key and only returns provisional pixels/job status.
No free-form client prompt.
Client chooses a permitted camera/template/repair option; compiler owns final prompt.
No readable story dialogue in image.
Compiler ban plus post-generation OCR/vision check where available; any detected core lettering is rejected or obscured and overlay remains source.
No roster/kit/place invention.
Validator compares required IDs to manifest/reference checklist; hard field mismatch is needs_repair, not attach.
No licensed style clone.
visualCanon uses owned/generic medium profiles and blocks named franchise/artist inputs.
Kid filtering before spend.
prepareKidSafeImagePrompt result persists on ImageJob; skip creates no provider call.
5. Lettering / overlay spec aligned to ComicTextAnchor
Element
Data source
UI location
Edit behavior
Caption
ComicTextAnchor linked to accepted event/receipt.
Top or bottom caption rail outside artwork crop.
Edit line break, emphasis, placement and accessibility text without rerender.
Speaker label
ComicTextAnchor.entityId and entity display name.
Adjacent to bubble/line, never embedded in pixels.
Rename only through entity canonical-name correction path.
Dialogue
Accepted player/NPC text anchor ID.
HTML/SVG balloon or transcript under panel.
Reflow/shorten presentation without changing accepted dialogue content.
Gutter
ComicChromeSpec.gutter.
CSS spacing between panels/beat blocks.
Template-only; no image request.
Receipt
PanelReceipt.playerSafeSummary.
Expandable â€œWhat changedâ€ below panel.
Reads source StateTx; cannot be edited as art text.
Status
ImageJob.status.
Small non-blocking badge: pending, draft, earlier record.
No story-state effect.
Accessibility rules: every illustrated panel exposes a text alternative built from BeatSpec and receipt; all overlay dialogue exists in DOM order; focus moves to the next accepted text turn, not a delayed image; reduced-motion disables parallax/pan/shake and replaces transitions with an instant state change; font size and contrast honor global accessibility controls.

Mobile vertical rules for wedges 1â€“3: one dominant vertical reading order; panel image max-width is viewport-safe; captions appear outside the image; no required visual fact sits below a fold without text; placeholder has fixed aspect ratio; tapped panels open receipt/transcript rather than a fresh generation.

Paged rules for wedges 1â€“3: use only single, two-column or two-row templates; page navigation is independent of image availability; cached image, deterministic composite or text card occupies the same panel slot; no masonry layout or generated panel-order inference.

6. Failure + repair UX flows (step lists)
Pending while story continues
Text adjudication writes StateTx and SceneManifest; player sees consequence and next input immediately.
Eligibility creates BeatSpec; policy runs before capacity reserve.
If allowed, UI adds a fixed-size â€œIllustrating this accepted beatâ€ tile beneath the receipt.
Queue/render runs through the edge proxy. Player can continue, switch modes, or leave; no input is disabled.
On attach, tile becomes an optional panel with receipt. If player advanced, it appears in timeline/gallery without jumping scroll.

Failed, moderated, or Kid-skip
Provider timeout/error sets failed; reservation is released/refunded under existing capacity rules exactly once.
Moderation sets moderated; show text-first fallback and a neutral explanation without exposing blocked prompt content.
Kid policy skip never creates a provider job; show safe explanatory text only if useful.
Existing accepted text, HUD, portrait/background composite and receipt remain playable.
Retry is delayed/backoff for provider failure, while policy/missing-anchor failures show a targeted route: â€œvisual unavailable because [outfit reference is missing / this moment is family-text-only].â€

Targeted repair versus full reroll
Player taps Repair visual, then chooses restore jacket, restore face, restore prop, restore camera, or start over.
UI creates RepairSpec with explicit preserved fields. restore jacket preserves roster/place/pose/palette/lettering and changes only outfit anchor constraints.
Compiler uses source renderKey, BeatSpec, anchors and requested delta; a repair cannot add actors, alter result or revise dialogue.
Returned output is a draft revision. Player accepts it or retains prior approved panel; no automatic replacement.
Full reroll requires confirmation and uses same BeatSpec, not a new story prompt. It is capacity-metered separately from a no-spend validator failure.

Stale art after correction or StateTx
Change class
Action
Cosmetic correction that does not change required BeatSpec fields
Keep asset current; update display metadata if needed.
Later present-state change, e.g. jacket equipped now but not then
Keep historical art as current for its original event; no invalidation.
Correction changes an eventâ€™s roster, kit, place, outcome or identity
Mark connected artwork stale; future views show â€œEarlier campaign recordâ€”later correction changed this scene.â€ Recompile only if player requests/capacity allows.
Correction retracts event/branch
Keep audit asset accessible only in branch history where product policy allows; never show it in current recap/gallery.
User reports mismatch
Tag needs_repair, preserve image and source receipt, never modify ledger from report.
7. Migration from todayâ€™s Comic toggle
Player state
Week 1 of wedge
Later, after gated plate/composite work
Comic view ON
Toggle becomes Illustrated reading (beta). It renders existing Memorable assets with comic chrome, source receipt, HTML captions and text/card fallback; it does not promise a live panel per turn.
Eligible accepted beats may show an event-tied single plate or deterministic composite under the published allocation; strips/recaps appear only behind dedicated flags.
Classic + Memorable ON
Existing Classic experience remains unchanged; Memorable cards gain optional chrome only when player selects the illustrated presentation preference.
Same safe plate/composite assets can appear as optional timeline cards without changing Classic input/read flow.
Classic + Memorable OFF
No new visual jobs. Existing text, HUD, receipts and correction remain identical.
Player can opt in later; no hidden image spend.
Kid Mode
Existing policy applies; comic toggle renders only approved safe legacy asset/chrome or text fallback.
Allow/rewrite/skip remains pre-spend; no visual ad extras.
Ops images off
Toggle remains available as text/chrome/composite-only if static assets work; pending job tiles turn to text fallback.
No provider calls, no capacity debit, no lost story progress.
Flag order
VITE_OPS_IMAGES_OFF
  > kidVisualPolicy.skip
  > campaign/image entitlement
  > wedge flag (chrome | eventPlate | composite | strip | recap)
  > capacity reservation
  > provider route

VITE_OPS_IMAGES_OFF must be evaluated server/edge-side as well as being reflected in the client build configuration. A client flag alone is not a spend or safety control.

8. Fixture + QA pack
#
Fixture
Setup
Expected hard outcome
1
Wrong roster
Scene has Mira only; provider draft adds Jae.
needs_repair; never attach.
2
Missing roster
Required Queen Aveline absent from ruler-audience plate.
needs_repair; no receipt change.
3
Empty-room invention
Manifest has empty archive; image adds librarian.
Reject/repair; no new entity record.
4
Wrong kit
Iron spear not equipped but image shows it.
Reject/repair; inventory unchanged.
5
Missing kit
Required silver key absent.
Reject/repair; no item transfer.
6
Wrong place
Bramblegate scene rendered as castle hall.
Reject/repair; place remains Bramblegate.
7
Kid leak
Family profile receives adult/graphic output path.
Pre-spend skip or safe rewrite; zero provider request for skip.
8
In-image balloon invention
Render contains readable â€œI surrenderâ€ balloon absent from text.
Reject or mask; overlay only; no dialogue record.
9
Death then heal
Death plate job pending; revival correction commits before attach.
Job becomes stale/cancelled; no current death plate.
10
Outcome reversal
Failed boss plate attached; later state correction says boss escaped.
Mark stale and remove from current recap; ledger unchanged.
11
Pending continuity
Player submits two more turns while job pending.
Both text turns accepted; tile does not steal focus/scroll.
12
Provider timeout
Edge proxy times out after capacity reservation.
failed; one refund/release; text continues.
13
Moderated request
Player portrait request is blocked.
moderated; neutral fallback; no character mutation.
14
Ops off race
Job is pending then image kill switch activates.
No new retries; safe terminal state; no late attach.
15
Repair jacket
Source panel has wrong jacket.
Repair preserves roster/place/pose/receipt; only outfit may change.
16
Repair camera
Player asks wide â†’ close.
No actor/kit/place changes; new draft only.
17
Branch isolation
Different branch has different outfit.
Asset/render key never crosses branch.
18
Anchor version invalidation
Portrait anchor updates from player correction.
Future jobs use new version; prior historical panel banner rule applies.
19
Screen reader
Panel/caption/readout with reduced motion enabled.
DOM transcript and alt text are complete; no semantic loss.
20
Capacity duplicate
Retry request arrives twice/network replay.
One ImageJob/reservation terminal path; no double debit/refund.
Done-when: chrome wedge ready
Requirement
Evidence
No provider dependence
Chrome works with images off and on existing approved assets.
Receipt source
Every panel/card renders source event/StateTx link and player-safe receipt.
Accessible overlay
Caption, labels, transcript, focus and reduced-motion checks pass.
Non-blocking
Text input/turn advancement works while any image tile is pending or unavailable.
Toggle migration
Comic-on, Classic-only, Kid and ops-off fixtures pass.
No story mutation
Test asserts chrome renderer has no StateTx write capability.
Done-when: event-tied plate ready
Requirement
Evidence
Signed source contract
Every job references immutable BeatSpec, SceneManifest and anchor versions.
Hard-field validator
Roster, kit, place, visible knowledge and Kid fixtures pass with reject/repair behavior.
Capacity correctness
Reservation/refund idempotency passes provider failure, moderation, retry and kill-switch fixtures.
Stale behavior
Correction/revival/branch-isolation fixtures pass.
Failure fallbacks
Timeout, moderation, skip and provider-off all preserve accepted text and clear status.
Repair isolation
Jacket/face/prop/camera repairs cannot alter receipts, event IDs or ledger state.
9. Open decisions only if new
New decision
Why it is newly required by this gap-fill
Recommended default
Where ImageJob is authoritative
Existing capacity/refund logic needs an idempotent job identity across client, edge proxy and provider callbacks.
Server-side persisted job and reservation; client is display-only.
Historical stale-art retention
Correction policy needs a visible treatment for prior accepted art without rewriting evidence.
Keep branch/history record with banner; exclude stale art from current gallery/recap.
Validation strictness
Automatic visual recognition can be imperfect; product needs a hard boundary for missing required facts.
Fail closed on required roster, equipped kit, place and Kid/rights policy; allow style-only variance.
Portrait consent / ownership metadata
Reference anchors add identity/rights exposure not covered by generic prompt policy.
Require explicit player approval/source label for each reusable portrait/reference; no implicit use of uploaded images outside campaign scope.
VITE_OPS_IMAGES_OFF deployment scope
Front-end flags cannot reliably stop already-issued or direct provider work.
Treat as mirrored server/edge policy with immediate queue cancellation and no-new-spend semantics.
