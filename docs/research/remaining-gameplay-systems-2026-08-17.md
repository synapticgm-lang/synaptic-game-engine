PART 0 â€” Executive remaining-systems scorecard
Area
SynapticGM current
Best comparable pattern
Gap diagnosis
90-day call
Combat/encounter feel
6/10
9/10
Ledger substrate exists; telegraph, counterplay and aftermath readability are incomplete.
Harden.
Map/place/travel
6/10
9/10
Maps/fog exist; place authority, interior entry and provenance need a single contract.
Harden.
Quest/what-next
7/10
9/10
Journal/Guide Book exist; state/rationale/anti-spoil needs refinement.
Harden.
Inventory/salvage
6/10
9/10
Paper doll and Salvage exist; readability, capacity and receipt UX need work.
Harden.
LitRPG System diegesis
5/10
8/10
Windows exist; cadence/visibility/never-lines not yet productized.
Build narrow protocol.
PYOA/mystery/ending
5/10
9/10
Evidence/ending fairness is a distinct capability.
Spike then build.
Tabletop mode
5/10
9/10
Check math exists; disclosure and custom-rules boundary need trust UX.
Harden.
GM/System personality
6/10
8/10
Simple/Expert custom exists; shippable profile picker/persistence missing.
Build narrow.
Tutorial/first hour
5/10
9/10
HookArc/honeymoon exists; teaching is not yet a genre beat system.
Build.
Accessibility/readability
4/10
9/10
Must-have web accessibility work remains.
Must.
Saves/continue/cloud
6/10
9/10
Cloud save exists; active/archived/pending/conflict language needs hardening.
Harden.
Expert author tools
5/10
8/10
Simple/Expert exists; preflight/inspector/testability missing.
Spike.
Audio lite
2/10
7/10
No 90-day core need.
Defer unless thin wedge passes.
Top 15 experience gaps, ranked by Severity Ã— Frequency
Rank
Gap
Severity
Frequency
Player feels X because system did Y
1
Consequential combat lacks a compact declared-threat/receipt loop.
5
5
â€œI lost fairlyâ€ because the system showed intent, legal counters, roll and state change.
2
Place knowledge is not explicitly separated from map geometry and travel.
5
5
â€œI know what I earnedâ€ because pins have source/confidence/audience.
3
First hour teaches too much by prose or too little by action.
5
5
â€œI know what I can doâ€ because each new verb appears after a safe meaningful use.
4
Keyboard/text-scale/screen-reader treatment is not a release gate.
5
5
â€œI can play my wayâ€ because every turn, HUD and inventory control is operable/readable.
5
System notices can be either invisible or jargon-heavy.
4
5
â€œThe system belongs in the fictionâ€ because notices have a stated cadence/visibility role.
6
Quest journal lacks explicit provenance/block rationale.
4
4
â€œI know what nextâ€ because the journal says why an objective exists or is blocked.
7
Loot/capacity/salvage decisions need pre-commit receipts.
4
4
â€œMy bag is a game, not choresâ€ because capacity and conversion results are shown first.
8
Map pins can appear before the player has justified knowledge.
5
3
â€œDiscovery is realâ€ because only derived/pinned knowledge appears.
9
Save/campaign status and conflict recovery can be mentally expensive.
4
4
â€œMy story is safeâ€ because Continue, archive, draft restore and choose-version are explicit.
10
Mystery endings can feel arbitrary without ending provenance.
5
3
â€œMy case matteredâ€ because the ending cites accumulated evidence and decisions.
11
Dice/check disclosure is not consistently proportional to stakes.
4
4
â€œThe roll was honestâ€ because meaningful checks show expression, modifiers and result.
12
Voice choice risks altering rules rather than presentation.
4
4
â€œThis GM has personality, not secret powersâ€ because profile only controls phrasing/cadence.
13
Social skip/autofight needs declared use boundaries.
3
4
â€œSkip respected my decisionâ€ because it previews costs/injuries/reputation before resolving.
14
Expert custom lacks a safe preflight/contradiction loop.
4
3
â€œMy custom world holdsâ€ because the builder finds unresolved or conflicting declarations.
15
Audio may be either unavailable or overbuilt.
2
3
â€œI can hear the line I needâ€ because selective playback is opt-in and replayable.
Top 15 highest-ROI upgrades, ranked by Impact Ã— Effort
Rank
Upgrade
Impact
Effort
Recommendation
1
Consequence receipt for combat/check/quest/loot.
5
2
Do now.
2
Place authority and player-pin provenance.
5
2
Do now.
3
First-hour genre tutorial beat table.
5
2
Do now.
4
Keyboard/focus/text-scale/reduced-motion baseline.
5
3
Do now.
5
Quest â€œwhy / blocked / nextâ€ projection.
4
2
Do now.
6
Inventory compare/capacity/salvage-preview receipts.
4
2
Do now.
7
SystemProtocol templates and cadence guard.
4
2
Do next.
8
Combat declared-intent/countermeasure preview.
5
3
Do next.
9
Save conflict and lost-draft recovery flow.
4
2
Do next.
10
VoiceProfile picker/persistence.
3
2
Do next.
11
Mystery clue record / ending evaluator.
5
4
Spike.
12
Tabletop roll receipt/hidden-roll visibility policy.
4
3
Do next.
13
Expert preflight and context inspector.
4
4
Spike.
14
Routine combat auto-resolve forecast.
3
3
Spike.
15
Selective Hear controls.
2
2
Later.
Research complete / build only: receipt UX, place authority, fog distinction, quest projection, paper-doll slots, salvage previews, SystemProtocol, voice picker, tutorial beats, web a11y baseline, save conflict and pending-turn handling. Still needs spikes: two-panel combat preview, mystery clue board/ending evaluator, custom-rules compiler, expert preflight, auto-resolve, audio-lite value.



PART A â€” Combat & encounter feel
Turn-based systems earn trust when hostile intent is legible before the player commits, and multiple counters can alter that intent rather than only dealing damage. [1] SynapticGM should retain free-form verbs but compile them into explicit encounter phases.

Encounter contract
interface EncounterIntent {
  encounterId: string; round: number; actorId: string; targetSpec: string;
  verb: 'strike'|'grapple'|'guard'|'flee'|'cast'|'summon'|'search'|'negotiate'|'reinforce';
  telegraph: 'clear'|'partial'|'hidden'; counterTags: string[];
  stakes: 'routine'|'risky'|'irreversible';
}
interface OutcomeToken {
  sourceEventId: string; kind:'damage'|'condition'|'position'|'resource'|'corpse'|'loot'|'escape';
  targetId?:string; before: unknown; after: unknown; visibility:'player'|'delayed';
}

Phase
Ledger writes
Player sees
Rule
Declare
Enemy intent/target/counter tags.
â€œThe ash hound coils to pin your left arm.â€
No resolution yet.
Preview
Legal verbs, known costs, unknowns.
Counter chips plus free text.
Non-damage answers are visible.
Choose
Player intent/commit.
Chosen approach and stakes.
High-stakes irreversible action asks once.
Resolve
Rolls/checks/damage/status/position.
Short receipt; expand for math.
Prose cannot add extra hit/loot.
Aftermath
Corpse, threat, reinforcements, safe state.
â€œThe hall is not yet safe.â€
Victory â‰  automatic search.
Search/loot
Container/corpse claims, time/tool/risk.
Preview before claim.
Capacity and danger gate transfer.
Verb allowlists and anti-patterns
Context
Allow first-class verbs
Never let prose do
Trash
Strike, guard, shove, disengage, focus, negotiate, flee, inspect.
Invent a new enemy attack after choice.
Elite
All above plus interrupt, terrain use, spend resource, concede objective.
Make an untelegraphed immunity or phase shift.
Boss
Objective, phase, counter, sacrifice, retreat, social/riddle route.
Reduce to DPS race or silently ignore a valid plan.
Corpse/loot
Search, harvest, secure, leave, burn, identify, salvage.
Auto-transfer rare item or erase body without outcome.
Social skip
Negotiate, bribe, threaten, deceive, retreat, pay cost.
Resolve offscreen without forecast.
First Blood graph hardening: graph nodes require entryPredicate, threatTelegraph, legalCounterTags, exitStates, corpsePolicy, and teachingTag; boss nodes add phaseVisibleAt, retreatAllowed, and noSameTurnReward. A sticky fail fires only after StateTx changed and teaches one causal counter, never after look-only or prose rejection.

Module
Verdict
Change
ledgerCombat
HARDEN
Add declared intent, counter tags, corpse/search projection and complete receipt.
combat
EXTEND
Render phase bar, HP/condition delta, short auto-resolve forecast.
choicePipeline
HARDEN
Reject choices that skip declaration for consequential encounter action.
outcomeToken
EXTEND
Type every mechanical change and feed System/quest/inventory views.
Ten spikes
Telegraph one elite intent; measure counter-verb use versus damage-only use.
Add â€œaccept one lossâ€ mitigation choice in unwinnable turn fixture.
Separate defeated from safe_to_search in ten combat tests.
Run corpse persists/blocks line-of-sight fixture.
Add social skip forecast showing gold/time/reputation/risk.
Add low-stakes auto-resolve only for repeated tagged graph nodes.
Display raw roll/modifier/threshold receipt for boss actions.
Sticky fail lesson accepts a different corrective verb in next encounter.
Test retreat maintains enemy/quest state rather than erasing encounter.
Test VITE_OPS_IMAGES_OFF and prose-only combat retains full receipt clarity.



PART B â€” Map, place, travel, fog
Maps should give orientation without converting rumors into truth. VTTs distinguish current visibility from explored/revealed state; landmark-led navigation can support discovery without an always-on arrow. [2] [3]

Place authority
interface PlaceRecord { id:string; kind:'region'|'street'|'landmark'|'interior'|'room'|'route';
  parentId?:string; exits: Array<{to:string; bearing?:string; predicate?:string}>;
  landmarkIds:string[]; accessPredicate?:string; }
interface PlaceKnowledge { placeId:string; claimant:'player'|'npc'|'map'|'witness';
  confidence:'confirmed'|'approximate'|'rumored'; audience:'player'|'party'|'gm'; sourceEventId:string; }

Map object
Allow
Deny
Confirmed pin
Stable ID, discovered/visited receipt, player label.
Name/location fabricated from story prose alone.
Rumor pin
? label, source NPC, confidence, approximate region.
Exact route/coordinates or false certainty.
Landmark
Visible cue, relation/bearing, known/unknown tag.
Landmark not present in locality SceneManifest.
Interior
Entry event, transition/return edge, room graph.
Teleporting into a room with no enterInterior event.
Fog
visibleNow, explored, heardOf, hidden.
Re-hiding without audit or forgetting explored space.
UX flow
Player sees a street/dungeon map projection derived from places and PlaceKnowledge.
Tap a pin: known fact, how known, last confirmed, travel choices.
Choose travel: origin, destination, mode, duration/cost, known hazard and uncertainty scope are previewed.
travel StateTx commits arrival/interrupt/discovery; map then updates from records, not from prose.
Entering an interior writes parent, entrance, facing, companions and visibility; leaving writes return edge.

Module
Verdict
Change
mapEngine
HARDEN
Four-layer knowledge rendering and pin provenance.
placeAuthority
EXTEND
Validate place IDs, edges, source confidence and locality.
places
HARDEN
Separate geometry/topology from player knowledge.
enterInterior
EXTEND
Require typed transition/arrival receipt.
locality
HARDEN
Reject narrative place harvest without evidence/event.


PART C â€” Quests, journal, Guide Book, â€œwhat nextâ€
A good journal is a canonical projection: it tells the player what is active, why it appeared, what is blocked, and what changed, without turning hidden narrative into a checklist. Quality-based narrative patterns permit different discovery order while requiring inspectable synthesis prerequisites. [4]

State
Player copy
Guard
Hidden hook
Nothing or diegetic hint.
No map pin/objective.
Rumored
â€œA dockhand mentioned a lantern beneath the west bridge.â€
Mark source/uncertain; do not title as objective.
Active
Title, current actionable lead, reason/unlock receipt.
No same-turn created â†’ complete except explicit microtask.
Blocked
â€œBlocked: need a tide key or another route.â€
Explain predicate category, not spoiler solution.
Completed
What changed, proof/source, next unlocked if already player-known.
Preserve history; do not replace prior wording.
Failed/expired
Reason, time/choice source, remaining paths.
Never vague â€œquest failedâ€ with no cause.
Journal IA
Simple
Expert
Now / Later / Completed, one tracked card, Guide Book suggestion.
Filters by thread, location, faction, deadline, source, state; timeline and prerequisite explanation.
â€œWhat can I do?â€ shows 2â€“3 player-known leads.
Reveal/provenance log and pin/route relationship.
Rails: no objective title from an unverified clue; no automated culprit conclusion; vague travel-worn item must name the observed property and use category; Quest Unlocked fires after prose consequence and StateTx, not before it; rival threads show rival goal / last evidence / pressure, not omniscient progress.

Module
Verdict
Change
questPlay
HARDEN
Add reveal ledger, state transition guard, blocked rationale and no same-turn complete rule.
questGuards
EXTEND
Validate spoiler class, source/evidence and objective timing.
Guide Book lock
EXTEND
Project player-known next actions only.


PART D â€” Inventory, paper-doll, Salvage, loot readability
Paper dolls work because slot location communicates function, while explicit stack/tooltip and bulk operations reduce administration. [5] Salvage is compelling when it is a declared conversion rather than unexplained deletion. [6]

Surface
Required UX
Ledger rule
Worn gear
Head / torso / hands / feet / accessory / main/off hand with compatibility.
Equip predicate validates class/body/slot/state.
Bag extras
Stack, bulk/weight, container, favorite/quest/reserved labels.
Overflow is blocked/claimed, never silently dropped.
Loot toast
Name, rarity/quality reason, slot/use, projected capacity, actions.
Item instance/provenance exists before narration.
Compare
Current vs candidate delta plus rule tags.
No invented numeric stats.
Salvage
Preview materials/currency, confirm irreversible conversion.
salvaged event retains source instance and outputs.
Merchant
Sell/buy price, source/sink delta, merchant availability.
Currency transaction receipt.
Salvage loop beats
Loot receipt exposes Keep, Equip, Inspect, Store, Salvage later.
At any safe inventory surface, player selects instances; protected/quest/locked gear needs explicit unlock/confirm.
Preview says exact outputs, capacity relief and irreversible rule.
StateTx transfers input to salvaged, creates materials/currency and prints compact receipt.
Craft/upgrade surface cites material provenance where useful; no fake rarity/pity text.

Module
Verdict
Change
inventory
HARDEN
Explicit location/stack/capacity/provenance and bulk verbs.
wornGear
EXTEND
Slot predicates, compare and portrait overlay source.
salvage
HARDEN
Preview/confirm/output receipt/undo policy.
inventoryArt
EXTEND
Art reads existing item/gear state only; no new truth.


PART E â€” LitRPG System window & diegesis
Diegetic feedback increases thematic coherence, but urgency/readability must win when information changes a decision. [7] SynapticGMâ€™s System must be a renderer of committed mechanics, never a second narrator that introduces rules/facts.

interface SystemNotice { eventId:string; templateId:string; visibility:'inline'|'toast'|'window'|'log';
 priority:'ambient'|'decision'|'consequence'|'milestone'; payload:Record<string,string|number>; }

Class
Fires when
Template
Never line
Ambient
Low-stakes tracked stat changes.
SYSTEM // Endurance +1
â€œYou feel strongerâ€ without StateTx.
Decision
A player must choose due to a rule/cost.
SYSTEM // Pack full: salvage, store, or leave.
Hiding actionable cost in flavor.
Consequence
Check/combat/quest/inventory result commits.
SYSTEM // Guarded: 2 turns.
Repeating prose/roll details in a giant meta wall.
Milestone
First Blood, quest phase, level, ending receipt.
SYSTEM // First Blood recorded.
Reward before graph/StateTx commits.
Hidden/GM
Secret threshold, enemy roll policy.
No player window until visibility changes.
Pretending no event exists; retain audited visibility.
Cadence and progressive reveal
Cadence
Rule
Default
One concise System notice per state-changing turn; combine related deltas.
Combat
One decision/one consequence compact receipt; details expandable.
Loot
One stack/transfer receipt, not an extra story paragraph.
Milestone
Full window only on first/major/durable threshold.
Kid Mode
Plain language template, no coercive grind/loot language, no unsafe visual prompt spill.
Module
Verdict
Change
systemLog
HARDEN
Typed notices, collapse rules and source-event expansion.
systemPrompt
EXTEND
Voice may select diction, not notice facts/templates.
structuralEvents
HARDEN
Emit source event before notice and enforce visibility.
PART F â€” PYOA, mystery, ending honesty
Contract
Mechanism
Player feels X because system did Y
Clue visibility
ClueRecord stores source/time/place/entity/claim/confidence/audience.
â€œI may have missed something, but I know what I actually saw.â€
Hypothesis
Player links clues into named hypothesis; it is not truth.
â€œI am solving itâ€ because the board preserves my reasoning.
Accusation
Requires a displayed minimum evidence class, but allows risky premature accusation with known stakes.
â€œThe accusation was my call,â€ not a hidden correct button.
Branch pressure
soft, hard, interrupt, decay class with visible start/event.
â€œThe clock was fairâ€ because pressure was legible.
Ending
Deterministic evaluator reads ending flags, decisive choices, unresolved threads and knowledge.
â€œThis ending remembers my run.â€
interface ClueRecord { id:string; observation:string; sourceEventId:string; entityIds:string[];
 placeId?:string; claimIds:string[]; confidence:'confirmed'|'suggestive'|'rumored'; playerVisible:boolean; }
interface EndingReceipt { endingId:string; decisiveEventIds:string[]; resolvedThreadIds:string[];
 unresolvedThreadIds:string[]; knowledgeState:'partial'|'sufficient'|'complete'; }

Anti-gotcha rails: clues are discoverable by multiple valid routes; a blocked deduction says category of missing evidence; an accusation label names intent and known risk; endings never retroactively demand an untelegraphed action; true-ending Memorable plate derives only from EndingReceipt, and failure to render never blocks text ending.

Module
Verdict
Change
mysteryCulprit
HARDEN
Separate culprit truth, player evidence, hypotheses and accusation eligibility.
Campaign bibles
EXTEND
Mark intended clue sources and anti-soft-lock alternates.
Memorable ending
EXTEND
Bind plate request to ending receipt / selected event IDs.
PART G â€” Tabletop fantasy mode
A roll receipt earns trust by exposing what was attempted, raw result, modifiers, total, relevant target, and committed result; hidden rolls require a declared visibility policy rather than silent substitution. [8]

Roll type
Player sees
Log stores
Never do
Routine revealed check
Formula, raw die, visible modifiers, total, outcome class.
Rule version, seed/roll ID, StateTx.
Hide a penalty then narrate it as luck.
Opposed check
Player formula; opposed value after reveal policy.
Both records / visibility.
Fake independent dice if luck protection applies.
Hidden GM check
â€œRisk assessedâ€ plus outcome; later reveal if story policy permits.
Immutable hidden result/commitment.
Change result after seeing player prose.
Deterministic rule
Requirement/cost/outcome.
Predicate/version.
Dress a hard gate as dice.
Custom-rules compiler bounds
interface CustomRule { id:string; scope:'check'|'combat'|'inventory'|'travel'; trigger:string;
 inputs:string[]; formula:string; output:'modifier'|'advantage'|'condition'|'cost'; source:'author'; }

Allow declarative bounded formulas/conditions, typed variables, limits, tests and versioning. Deny arbitrary code, new hidden currencies, mutation of immutable history, access to secret entities, unbounded loops, network calls and instructions that modify safety/authority order. customTabletopRules compiles to sandboxed rule AST; it never edits prose prompt or ledger directly.

Module
Verdict
Change
checkMath
HARDEN
Receipt/visibility/modified-randomness labels.
outcomeToken
EXTEND
Link each consequence to roll/deterministic predicate.
customTabletopRules
NEW FILE
Bounded DSL, compiler, fixture suite, version registry.
PART H â€” Story personality / GM + System voice picker
Shippable picker
NEW GAME > How should the guide sound?
[Clear & Grounded]  [Warm & Adventurous]
[Dry & Tactical]    [Lyrical & Mysterious]
You can change this later. Voice affects wording and pacing, never rules or outcomes.
[More options] > sentence length / humor / detail / System intensity / second-person strength

Profile
Rail
Example instruction to renderer
Clear & Grounded
Plain, concise, concrete evidence first.
â€œUse short sensory details; name known costs.â€
Warm & Adventurous
Encouraging, vivid but not saccharine.
â€œCelebrate earned wins without inventing praise.â€
Dry & Tactical
Crisp, spatial, decision-forward.
â€œLead with threat/position/available counter.â€
Lyrical & Mysterious
Atmospheric, restrained ambiguity.
â€œPoetic imagery may not hide a rule/result.â€
VoiceProfile persists per campaign, has systemLexicon, proseVerbosity, humor, mysteryDensity, and secondPersonStrength; no field controls outcome, content-policy, authority or stored facts. Kid Mode clamps profile to clear/safe vocabulary and reduces menace; it never removes receipts.

Module
Verdict
Change
systemPrompt
EXTEND
Compile profile rails after authority/rule rails.
NewGameModal
EXTEND
Four-profile picker with â€œchange laterâ€ explanation.
settings
EXTEND
Campaign-scoped profile, preview paragraph, reset.
PART I â€” Tutorial, teaching, sticky-fail, first-hour clarity
Teach after a player has a reason to care and a safe action to take, not on look-only. Good onboarding escalates from constrained demonstration to player-led application. [9]

Genre
Beat 1
Beat 2
Beat 3
Sticky-fail trigger
LitRPG
Inspect visible System cue.
Choose one safe action.
Read outcome receipt / equip or spend.
First ledger change with misunderstood cost.
Isekai
Identify self/kit/location.
Accept/refuse first offer.
Travel/quest lead.
First rule mismatch or overload.
Story RPG
Choose approach to social/physical obstacle.
Check/receipt.
Journal/what next.
First failed approach changes status.
PYOA
Observe clue.
Form/inspect hypothesis.
Choose under legible pressure.
First blocked deduction.
Tabletop
Declare intent.
Roll/receipt.
Use condition/gear/retreat.
First modifier/counter rule.
Toast policy
Event
Toast?
Copy rule
Look-only
No.
Do not interrupt reading.
First meaningful state change
Yes, one line.
â€œYou can inspect why this changed.â€
First available counter/verb
Yes, contextual chip.
Offer one action, not a command list.
Sticky fail
Yes, after committed change.
Explain cause + newly legal alternative.
Repeated mechanic
No unless outcome novel/critical.
Avoid tutorial spam.
Module
Verdict
Change
tutorialBeats
NEW FILE
Genre/state-tagged curriculum; one-time completion ledger.
Hud
HARDEN
Toast queue, help/replay, focus-safe context controls.
PART J â€” Accessibility & readability
WCAG and game-accessibility guidance support keyboard-operable controls, visible focus, text that remains usable at 200% enlargement, redundant status encoding, paced/replayable content, and reduced-motion options. [10] [11]

Priority
Must / Should
Requirement
Components
P0
Must
Keyboard path through turn, choices, map, inventory, journal, settings; no focus trap.
Hud, map, dialogs, NewGameModal.
P0
Must
Visible focus with contrast; semantic buttons/labels, not canvas-only interaction.
All interactive surfaces.
P0
Must
Text/UI scale; wrap/reflow at 200%; no clipped log/choice labels.
Log, choice chips, System, paper doll.
P0
Must
Status is text/icon/shape plus color; high contrast theme.
Combat, rarity, map, condition badges.
P0
Must
Screen-reader landmarks, heading hierarchy, concise polite result announcements, full transcript.
Turn log, System notices, modal stack.
P1
Must
prefers-reduced-motion, disable typewriter/shake/autoadvance/flashing.
Themes, combat, comic chrome.
P1
Should
Dyslexia-friendly font/spacing option, paragraph width control, verbosity control.
Settings, prose renderer.
P1
Should
Per-channel audio volume, selective Hear/replay/pause/rate.
useVoice, themes.
P1
Should
Remappable shortcuts and command palette.
Hud, settings.
Live-region rule: empty aria-live="polite" is populated only for concise state summaries; use assertive solely for critical interruption. Full resolution remains in the reviewable transcript. [12]

PART K â€” Saves, Continue, cloud conflict, multi-campaign mental model
Surface
Player-facing copy
Contract
Continue
â€œContinue Ashfall Market â€” last choice saved 2 minutes ago.â€
Open latest acknowledged branch; never silently replay pending send.
Active Free campaign
â€œYour free active campaign is Ashfall Market. Archive it to begin another free campaign.â€
One active policy is explicit; archive preserves read-only history.
Archive
â€œArchived campaigns stay readable. Restore one to make it active.â€
Restore asks policy-confirmation and does not delete another run.
Device conflict
â€œTwo versions changed. Choose This device, Cloud, or Review changes.â€
No automatic merge of divergent StateTx; preserve both references.
Lost send
â€œYour last action was not confirmed. Restore it to the composer?â€
Draft is local/non-authoritative until resend.
Pending image
â€œStory saved. Illustration is still preparing.â€
Reload attaches status to existing job; text remains final.
Module
Verdict
Change
cloudSync
HARDEN
Version/vector metadata, choose-version flow, explicit branch preservation.
drive
EXTEND
Archive/read-only/export/recovery metadata.
db
HARDEN
Immutable turn/state IDs and pending job association.
pendingTurn
EXTEND
Send acknowledgement, local draft restore, idempotency key.
PART L â€” Expert Custom & author power tools
Feature
Phase
Contract
Preflight
1
Detect missing opener, contradictory authority, duplicate entity/place names, undefined terms, impossible starting gear/quest.
Contradiction probes
1
Ask max three resolution questions; permit â€œleave intentionally unknown.â€
Context inspector
1
Show seed/bible/opening/scene injection categories and byte/token budget; no hidden chain-of-thought.
Blank-space declaration
1
Author marks unknowns as discover, gm_invent, player_define, or forbidden.
Permission policy
2
Fields player may customize, cannot customize, or may unlock later.
Randomize quality
2
Randomize from typed compatible bundles; preview/cancel; never randomize safety/authority.
Bible test run
2
Ten deterministic fixture prompts: opening, travel, combat, loot, contradiction, Kid rewrite, ending.
Module
Verdict
Change
NewGameModal
EXTEND
Expert v2 tabs, preflight summary, unresolved declaration review.
customExpertDraft
HARDEN
Typed schema/version/history and blank-space policy.
campaignSeed
EXTEND
Compiled preview, fixtures, injection-budget report.
PART M â€” Audio lite (selective only)
90-day call: No-Go unless the accessibility quick-win harness already exists. If it passes, ship only Hear last prose, Hear latest System line, Hear focused choice, and Stop/replay/rate/volume. Audio is derived presentation; it never replaces text, reveals hidden information, autoplays a long chapter, or changes narrative pace. Theme voice packs are later and may not alter Kid/safety routing.

Module
Verdict
Change
useVoice
NEW FILE
Opt-in queue, cancellation, focus/last-response scopes, no auto-play.
themes
EXTEND
Voice theme metadata and accessibility-safe defaults.
PART N â€” Cross-cutting anti-patterns & delight backlog
Forty anti-patterns
#
Anti-pattern
#
Anti-pattern
1
Prose changes HP.
21
Color-only poison/rarity state.
2
Boss attack has no telegraph.
22
Focus disappears after modal close.
3
Same-turn quest open/complete.
23
Text clips at 200%.
4
Corpse auto-loots.
24
Auto-advancing tutorial.
5
Map pin becomes fact from rumor.
25
Hidden timer starts silently.
6
Fog erases explored room.
26
Choice label hides commitment.
7
Interior has no return edge.
27
Ending ignores prior ledger.
8
Travel omits cost/risk.
28
Hypothesis becomes clue truth.
9
Item drops with no capacity preview.
29
Custom rule executes arbitrary code.
10
Salvage has no output preview.
30
Voice profile changes rules.
11
Quest item can be accidental bulk-salvaged.
31
System jargon buries action.
12
Rarity has no source/rule.
32
Required beat gated by ad/art.
13
System repeats prose.
33
Pending image blocks play.
14
Hidden GM roll rewrites after action.
34
Save conflict auto-overwrites.
15
Auto-resolve hides injuries/cost.
35
Lost send duplicates turn.
16
Tutorial fires on look-only.
36
Kid Mode removes vital receipt.
17
Sticky fail with no state change.
37
Expert seed cannot be tested.
18
Map labels leak secret factions.
38
TTS auto-reads every paragraph.
19
Combat toast is a novel.
39
Theme motion ignores user preference.
20
Place is invented to bridge prose.
40
Accessibility settings reset by theme.
Forty delight ideas
#
Idea
Effort
Impact
Risk
Depends
Timing
1
One-line combat threat receipt.
S
H
L
outcomeToken
Now
2
â€œWhy available?â€ objective drawer.
S
H
L
questPlay
Now
3
Rumor/confirmed pin badge.
S
H
L
placeAuthority
Now
4
Pack-full suggested action.
S
H
L
inventory
Now
5
Gear compare delta.
S
M
L
wornGear
Now
6
Salvage preview.
S
H
L
salvage
Now
7
First Blood counter chip.
M
H
M
ledgerCombat
Next
8
Corpse search risk card.
S
M
L
combat
Next
9
Active/archived campaign shelf.
S
H
L
cloudSync
Next
10
Lost-send restore composer.
S
H
L
pendingTurn
Next
11
System compact/expanded toggle.
S
M
L
systemLog
Next
12
Four voice previews.
S
M
L
settings
Next
13
First-hour replayable lessons.
M
H
L
tutorialBeats
Next
14
Keyboard command palette.
M
H
M
Hud
Next
15
Text scale quick buttons.
S
H
L
settings
Now
16
Reduced-motion switch.
S
H
L
themes
Now
17
â€œHear latest line.â€
S
M
M
useVoice
Later
18
Clue source chips.
M
H
L
mysteryCulprit
Spike
19
Player hypothesis board.
M
H
M
mysteryCulprit
Spike
20
Ending causal receipt.
M
H
M
campaign bible
Spike
21
Auto-resolve forecast.
M
M
M
ledgerCombat
Spike
22
Travel route preview.
M
H
M
mapEngine
Next
23
Landmark-guided â€œlook toward.â€
M
M
L
locality
Later
24
Interior return breadcrumb.
S
M
L
enterInterior
Next
25
Quest rival pressure card.
M
M
M
questPlay
Later
26
Deadline clarity badge.
S
H
L
questGuards
Next
27
Typed objective filters.
M
M
L
questPlay
Later
28
Inventory bulk action bar.
M
M
L
inventory
Next
29
Item provenance drawer.
S
M
L
inventory
Later
30
Outfit/condition portrait overlay.
M
H
M
wornGear
Later
31
Rule version in Expert test.
M
M
L
campaignSeed
Spike
32
Blank-space policy chips.
S
M
L
customExpertDraft
Spike
33
Ten-seed Expert fixture run.
M
H
M
campaignSeed
Spike
34
Hidden-roll later reveal.
M
M
M
checkMath
Later
35
Player-facing branch residue recap.
M
H
M
questPlay
Later
36
No-spoiler clue board export.
M
M
M
mysteryCulprit
Later
37
Scene recap in screen-reader landmark.
S
H
L
Hud
Now
38
Palette-independent condition labels.
S
H
L
combat
Now
39
Pending art preserve-story label.
S
M
L
comic adapter
Already dependency
40
True-ending receipt + Memorable offer.
M
H
M
memorableMoments
Later


PART O â€” Master synthesis
1. Single ranked backlog
Priority
Backlog
Reason
Must
A11y baseline: keyboard, focus, scale, contrast, motion, transcript.
Public web adult Free readiness.
Must
Combat/check/System/loot receipt standard.
Makes code-owned outcomes legible and trusted.
Must
Place authority + fog/knowledge + travel receipt.
Stops fake place and map truth failures.
Must
Quest projection: why/blocked/next/no same-turn completion.
Solves â€œwhat nextâ€ without spoilers.
Must
Inventory/salvage/capacity preview.
Core RPG clarity and monetization-safe economy.
Should
First-hour genre tutorial beat system.
Converts HookArc into competence.
Should
Save/active/archive/conflict/lost-send flows.
Protects investment in a campaign.
Should
SystemProtocol + VoiceProfile UI.
Stronger identity without state risk.
Should
Tabletop roll disclosure/hidden-roll policy.
Trust for tabletop audience.
Should
Interior transition/breadcrumb/landmark modes.
Travel coherence.
Later
Mystery board/ending evaluator.
High upside, requires dedicated fixtures.
Later
Expert v2 preflight/compiler.
Creator power after core play is clear.
Later
Auto-resolve forecast.
Pacing enhancement, not basic play.
Later
Audio lite.
Accessibility benefit only after baseline.
2. 90-day calendar that fits beside continuity + Stripe + safety work
Weeks
Parallel-safe gameplay work
Do not touch
1â€“2
Receipt schema, a11y audit, place/quest/inventory UX specs.
Core continuity pipeline, payment/security ownership.
3â€“4
HUD/System receipt renderer; keyboard/focus/text-scale; map/quest projections.
Comic full mode, multiplayer, WOF.
5â€“6
Combat declaration preview; salvage/capacity; save/lost-send flows.
Payment logic except agreed capacity surface.
7â€“8
Genre tutorial beats; VoiceProfile picker; interior/travel receipt.
Safety policy rework.
9â€“10
Mystery/ending spike; custom-rules compiler spike; a11y regression suite.
Any broad new world system.
11â€“12
Field test fixes; no-go/go decisions for auto-resolve/audio/Expert v2.
Scope expansion.
3. Module map master table
File / surface
Verdict
Primary responsibility
ledgerCombat
HARDEN
Encounter phases, intent, outcome/corpse state.
combat
EXTEND
Player-readable telegraphs, receipt, conditions.
choicePipeline
HARDEN
Consequential choice/reversibility/pressure validation.
outcomeToken
EXTEND
Typed state-diff receipt links.
mapEngine
HARDEN
Knowledge/fog/pin/travel projection.
placeAuthority
EXTEND
Place/landmark provenance validation.
places
HARDEN
Topology independent of knowledge.
enterInterior
EXTEND
Typed interior transition/return.
locality
HARDEN
Locality guards and no fake place harvest.
questPlay
HARDEN
Journal projection/rival/thread/why-next.
questGuards
EXTEND
Reveal/spoiler/same-turn/deadline rules.
inventory
HARDEN
Slots/stacks/capacity/bulk state.
wornGear
EXTEND
Paper doll/compare/visual overlay source.
salvage
HARDEN
Preview/confirm/output receipt.
inventoryArt
EXTEND
Read-only art projection.
systemLog
HARDEN
Typed diegetic notices.
systemPrompt
EXTEND
Voice rails, no rule authority.
structuralEvents
HARDEN
State-event-first System contract.
checkMath
HARDEN
Roll visibility/receipt/rule version.
customTabletopRules
NEW FILE
Bounded DSL/compiler/fixtures.
NewGameModal
EXTEND
Voice picker/Expert preflight.
settings
EXTEND
Voice/a11y/verbosity controls.
tutorialBeats
NEW FILE
Genre learning state machine.
Hud
HARDEN
Toast/focus/command/transcript.
cloudSync
HARDEN
Conflict/version UX.
drive
EXTEND
Archive/read-only campaign shelf.
db
HARDEN
Immutable IDs/pending-job associations.
pendingTurn
EXTEND
Idempotency/draft restore.
customExpertDraft
HARDEN
Typed seed and contradictions.
campaignSeed
EXTEND
Preflight/fixture/context projection.
mysteryCulprit
HARDEN
Clues, hypotheses, ending evidence.
useVoice
NEW FILE
Selective accessible speech only.
themes
EXTEND
Reduced motion/voice metadata.
4. Founder decision pack
Decision
Default
Revisit only when
Adult Free gameplay bar
Text-first, accessible, auditable combat/map/quest/inventory.
First-hour completion and safety measures stable.
Combat style
Telegraphed tactical prose with free-text verbs.
Preview proves it slows routine play.
Map authority
Confirmation/provenance over visual completeness.
Place graphs make browsing too sparse.
System style
Sparse receipt renderer, not constant game jargon.
Genre cohort requests higher cadence.
Tutorial
State-change teaching, not command walkthrough.
New players still fail first decision.
Mystery
Spike before platform investment.
Fixture evidence shows fairness/ending demand.
Expert tools
Preflight first, authoring canvas later.
Creator cohort completes seed tests.
Audio
Accessibility thin wedge only.
Baseline web a11y is signed off.
5. Definition of â€œgameplay feel ready for public web adult Freeâ€
A player can begin, understand their immediate situation, choose an action in natural language or accessible controls, see exactly what consequential mechanics changed, recover from a failed plan, orient on a map without unearned facts, understand their active lead and capacity, save/continue/recover a pending send, and change reading/accessibility settings without breaking the campaign. The Game Master voice feels distinct but never changes a rule; System notices clarify rather than expose implementation jargon; images and audio remain optional presentation. Required fixture suites show no prose-created state, fake place, unsafe map reveal, silent loot overflow, unexplained consequential roll, save overwrite, keyboard trap, or Kid-mode receipt loss.

References
[1]: https://atomicbobomb.home.blog/2020/05/17/into-the-breach-enemy-intentions/ ; https://theangrygm.com/manage-combat-like-a-master/"Telegraphed encounters and pacing"[2]:https://help.roll20.net/hc/en-us/articles/360037774513-Fog-of-War-Classic-VTT ; https://foundryvtt.com/api/v10/classes/client.FogManager.html"Fog/reveal patterns"[3]:https://www.theseus.fi/handle/10024/904850 ; https://fogofworld.app/en/"Landmarks and persistent exploration"[4]:https://docs.gamecreator.io/quests/journal/ ; https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/"Quest state and quality-based narrative"[5]:https://minecraft.wiki/w/Inventory ; https://minecraft.wiki/w/Item"Slots, stacks and item information"[6]:https://wiki.isleward.com/Inventory ; https://www.poewiki.net/wiki/Vendor_recipe_system"Salvage and conversion patterns"[7]:https://unity.com/blog/games/how-to-immerse-your-players-through-effective-ui-and-game-design ; https://www.gamedeveloper.com/design/diegesis-and-designing-for-immersion"Diegetic UI trade-offs"[8]:https://www.dndbeyond.com/posts/939-share-your-dice-results-with-the-brand-new-game"Auditable dice log pattern"[9]:https://developer.valvesoftware.com/wiki/Level_Design_Introduction_(Portal_2)/Your_First_Level ; https://clarity.design/documentation/onboarding"Progressive teaching and onboarding"[10]:https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html ; https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html"WCAG web accessibility"[11]:https://gameaccessibilityguidelines.com/full-list/ ; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion"Game accessibility and reduced motion"[12]:https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions "ARIA live-region guidance"
