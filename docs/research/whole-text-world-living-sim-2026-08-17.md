PART 0 â€” Executive: are we research-complete to code?
0.1 Verdict by pillar
Pillar
Verdict
Why
Net-new coding gap
Turn smoothness & speed
Yes-with-gaps
Turn authority, scene controls, speculative retry and capacity research are already covered.
A budgeted runtime orchestrator with explicit writer/no-writer decision, caching and cancellable jobs.
Consistency/memory moat
Yes-with-gaps
SceneManifest, StateTx, permits and provenance are enough for active scenes.
Region/arc paging, lineage-preserving legend tiers, world-scale projection oracles.
Massive world-building authoring
No
Bible/Custom surfaces exist but are not yet a typed runnable world compiler.
Versioned WorldModel, semantic validation, import/export and simulation-rule compiler.
Offscreen simulation
Yes-with-gaps
worldSim, NPC memory and timeline exist.
Deterministic discrete-event scheduler, LOD tiers, return receipts, fairness invariants.
Whole-text-world coherence at long run
Yes-with-gaps
Core authority order is strong.
Cross-region causality/knowledge, snapshots/replay, succession, world-scale red team.
0.2 Coding backlog â€” net-new or sharper
Priority
Work
Concrete outcome
Must
worldSim deterministic event kernel
Integer world clock, ordered queue, named RNG streams, replay hash, snapshot.
Must
WorldModel compiler
Typed authored/custom world package â†’ validated runtime definitions/indexes/rules.
Must
Region paging and return-receipt reducer
Enter/leave region never dumps full world or silently rewrites it.
Must
Offscreen fairness guard
Knowledge latency, grace/deadline, no hidden loot/teleport/instant rival rule.
Must
World-scale memory tier and lineage
Truth/evidence/color tiers with source range and observer scope.
Should
NPC/faction/plot-clock state machines
Bounded agendas, resource costs, staged plans, interruption.
Should
Cross-region causality and item/location uniqueness oracle
Prevent double-location, duplicated ownership and time inversion.
Should
Expert world preflight/import validation
Detect unreachable map, invalid law, duplicate ID, illegal rule.
Later
Scarcity/dungeon aggregate simulator
Bounded optional layer with safety floors.
Later
Succession/dynasty events
Only after actors/quests/timeline prove stable.
0.3 Beyond rivals â€” demonstrable one-pager
Demonstrable capability
What SynapticGM does
World facts survive scale
A location, debt, injury, oath, ownership transfer or death exists in an event ledger, not a summary paragraph.
Distance has rules
NPC action, rumor and travel occur only after typed route/time/knowledge predicates.
Absence is fair
Offscreen simulation emits an inspectable receipt before return prose; it cannot manufacture an unexplained loss.
Custom lore runs
Premise/bible/custom rules compile to typed constraints used by maps, quests, NPC clocks and validators.
History has layers, not replacements
Myth, rumor and memory are provenance-bearing views of events; they cannot overwrite canonical debts or ownership.
Long campaigns stay inspectable
Current working set is small; Expert can trace an important claim from prose â†’ receipt â†’ events â†’ authored rule.
0.4 Do-not-build list for false living world
Do not tick every named NPC every player turn.
Do not let the writer invent an offscreen win, death, travel, level or rumor transmission.
Do not treat all distant regions as equally detailed or all playersâ€™ absences as punishment.
Do not fast-forward through a promised deadline, protected actor or player commitment without a logged causal path.
Do not convert a compressed legend, NPC memory or rumor into canonical state.
Do not give villains omniscient player location/intent unless an explicit information channel exists.
Do not bulk-inject a continent bible or world history into every writer call.
Do not make dynamic economy or rival scaling a hidden rubber-band system.



PART 1 â€” Smooth, fast, consistent turn runtime (coding readiness)
Already covered â€” coding task only: active-scene authority, claim gate, expected revision, cancellation/refund, speculative retry and capacity guardrails. The remaining requirement is an explicit runtime budget controller.

Stage
Already-researched fix
Remaining code gap
p50 / p95 target
Safely cache / skip
Failure recovery
Input / IntentContract
Normalize player intent, authority order.
Idempotency key + cancel token bound to expected revision.
10 / 30 ms
Cached command grammar / entity aliases.
Return draft to composer; no StateTx.
Load world working set
SceneManifest and current facts.
Deterministic WorldWorkingSet loader with tier/token budgets.
20 / 80 ms
Region snapshot/projections keyed by revision.
Load last valid snapshot + tail; never use stale snapshot over ledger.
Resolve rules
Code owns check/combat/inventory/quest.
Writer/no-writer policy and batchable read-only queries.
15 / 75 ms
Rule tables, indexes, route checks.
Atomic rejection or compensating event; no partial write.
Offscreen due events
worldSim exists.
Bounded queue drain before writer.
10 / 100 ms normal; cap 300 ms
Aggregate cold-region events.
Stop at deterministic frontier; return receipt may say â€œworld updates pending,â€ never invent.
Context assembly
Scene/claim grounding.
Reservation compiler by 8k/16k/32k model context.
10 / 40 ms
Hashable context fragments by revision.
Drop color before evidence; never drop current authoritative facts.
Writer call
Speculative retry/wardens.
Do-not-call gate; parallel safe preview only.
provider-bound / provider-bound
Do not call for UI only, deterministic receipts, rejected input, no-op.
Text fallback from rule templates/last valid scene.
Validate / commit
Claim/wardens.
ReturnReceipt validation before SceneManifest update.
15 / 80 ms
Cached schema validator.
Reject draft; preserve previous revision.
Present / persist
Capacity, cloud save.
Async projections/images after commit.
10 / 50 ms
View models by ledger revision.
Persist authoritative event first; retry presentation separately.
Context reservation
Context budget
Reservation
Deterministic ordering
8k
35% active scene/intent/state; 20% active quest/combat; 15% region facts; 15% author/style; 15% response headroom.
Current facts â†’ direct causal dependencies â†’ player-visible evidence â†’ color.
16k
Add 15% arc/region summaries and 10% selected entity memories.
Same order; no historic free-for-all.
32k
Add capped timeline/legend slices only when causal query demands them.
Still page by source/event relevance; no full bible.
Writer no-call rule: do not call when the player asks a deterministic UI/status/map/inventory question, when an action fails before admission, when a catch-up batch has no player-visible consequence, or when the state transaction can be explained by a pre-authored receipt. The writer receives a committed WorldDelta and may narrate it; it never obtains an authority to manufacture one.



PART 2 â€” Memory moat beyond anyone else
2.1 Layer cake with caps
Layer
Scope / cap
Stores
May inject into writer
Never stores as fact
Working set
One turn; â‰¤2.5k tokens / typed fields.
Intent, current scene, active actors, immediate constraints, current delta.
Yes, always.
Untyped old prose.
Scene
Current site; â‰¤80 hard facts + 30 evidence/color pointers.
Presence, position, exits, visible kit, active threats, known local time.
Yes, selected.
Offscreen actor intent.
Region
Current/causal neighbor; â‰¤300 indexed facts + pending event summary.
Places/topology, factions, active clocks, local economy aggregate, resident actors.
Query-paged only.
Global legend unless relevant.
Campaign
All durable threads; typed projections not prose blob.
Debts, vows, ownership, deaths, quests, relationships, party milestones.
Specific causal query only.
Rumor as truth.
Legend
Cold history; source-range-backed, versioned compression.
Era facts, myths, verified histories, cultural color.
Only named/history query.
Canonical replacement for debt/injury/ownership.
2.2 Truth, evidence, color at world scale
Class
Example
Storage / behavior
Truth
â€œMerchant stall #A owns 7 iron ingots at ledger revision 400.â€
Event/snapshot projection; reducer-enforced.
Evidence
â€œTarin saw three carts leave Eastgate at dawn.â€
Observation with actor, time, confidence, scope and source event.
Color
â€œEastgate smells of wet rope.â€
Regional style/scene color; can vary, no causal authority.
Belief / myth
â€œOld bridge is cursed.â€
Agent/faction/legend claim with provenance and contradiction link.
2.3 Region/arc paging
interface RegionPage { regionId:string; revision:number; lastSimulatedAt:number;
  hardFactsRef:string[]; pendingEventIds:string[]; inboundDependencies:string[];
  outboundSummary:string[]; activeClockIds:string[]; simLod:'active'|'warm'|'cold'; }

Enter: load checkpoint + replay tail; drain due events affecting player/cause chain; build ReturnReceipt; then update SceneManifest; only then writer narrates arrival. Leave: commit departure/travel event; create durable region checkpoint; schedule applicable aggregate/state-machine events; retain dependency summary, not full cast prose. Continent: never page unless named causal dependency or historical request.

2.4 Legend/myth compression
LegendRecord must have sourceEventRange, effectiveStart/end, observerScope, confidence, contradictionIds, compilerVersion, and supersedes[]. Compaction is a projection with an audit cursor. It can say â€œthe copper revolt emptied the northern minesâ€ but cannot delete Debt#17, Injury#33, Oath#9 or ownership event records. A new evidence event can mark legend confidence lower without rewriting prior witness belief.

2.5 Player UX
Simple
Expert
Here: current place, people, pressure, available travel.
Working-set/region page with revisions and pending clocks.
Threads: 3â€“5 player-known active consequences.
Campaign/arc graph with source events and dependency path.
Why: a human sentence: â€œThe market is sparse because the west road closed two days ago.â€
Exact ReturnReceipt, tick policy, seed stream, event IDs and sim mode.
2.6 Evaluation: 100 / 300 / 1000 turn suite
Run length
Oracle
Required pass
100
Active scene/region coherence.
No absent actor/item/place appears; save/reload state hash equal.
300
Paging / quest / travel.
Leave-return produces same state whether region loaded early or late; no duplicate route/ownership.
1000
Legend / succession / compaction.
Canonical debt/injury/ownership preserved; myth claim source remains traceable; p95 page-in within target.
2.7 Why this beats rivals even with larger context
Common rival pattern
Larger context does
SynapticGM moat
Chat transcript / summary
Delays forgetting but leaves facts untyped.
State reducer, event ID, location/ownership/knowledge invariants.
Lore card / keyword retrieval
Brings back relevant description.
Compiled world rules and pages determine what can happen.
Vector/chat memory
Finds semantically similar past text.
Bitemporal causal history distinguishes truth, observation, rumor and color.
Character card
Stabilizes persona.
Actor schedule, resources, knowledge latency, travel and plot clock explain actions.
Bigger model
Improves inference but can still invent.
Writer is a read-only narrator after deterministic commit.


PART 3 â€” Massive world-building (authored + custom)
3.1 World compiler
interface WorldModel { schemaVersion:string; worldId:string; premise:Premise;
  places:PlaceDef[]; entities:EntityDef[]; factions:FactionDef[]; rules:WorldRule[];
  resources:ResourceDef[]; plots:PlotDef[]; openings:OpeningDef[]; imports:ImportRef[]; }
interface WorldRule { id:string; scope:'travel'|'economy'|'magic'|'law'|'social'|'sim';
  predicate:string; effect:string; visibility:'public'|'hidden'|'author'; }

Compiler pipeline: parse â†’ schema validate â†’ ID/link resolve â†’ map/topology validate â†’ semantic invariant validate â†’ normalize/sort â†’ compile runtime indexes/rule AST/seed allocation â†’ emit manifest + fixtures. The compiler rejects dangling references, duplicate IDs, invalid containment, unreachable required openings, rule cycles, illegal custom formula access, map edge contradiction, and author-defined â€œtruthâ€ that conflicts with opening invariants. JSON Schema and typed map formats demonstrate the value of separating validation and normalized runtime artifacts. [1] [2]

3.2 Scale ladders
Scale
Must be simulated
May be sketched / materialized on entry
Room
Occupants, exits, containers, hazards, immediate time.
Decorative color.
Building
Access, owner, active occupants, key resources.
Unvisited subrooms.
Street
Landmarks, businesses, local travel edges, daily pressure.
Individual passers-by.
District
Faction influence, stock aggregate, active clocks.
Routine residents.
City
Factions, markets, routes, named actor schedules.
Unnamed microevents.
Region
Travel, weather class, supply/hostility, major clocks.
Detailed street life.
Realm
Laws, eras, macro resources, major factions/legends.
NPC schedules or exact stock.
3.3 Empty-space permission policy
Scale
gm_invent allowed
player_define allowed
Forbidden without authored/evidence basis
Room
Color, non-mechanical dressing.
Minor personal detail.
New exits, loot, named NPC.
Building/street
Small unnamed shop/crowd only where policy allows.
Personal landmark/rumor label.
New faction, route, owned property.
District/city
Minor color or delegated unimportant cohort.
Player-safe nickname/annotation.
New major district, law, villain resource.
Region/realm
None except explicitly blank author slots.
Author-approved custom expansion.
Geography, war, economy or lore truth.
3.4 Expert preflight
Probe
Error / warning
Two entities claim same canonical ID/name role.
Error / alias warning.
Opening location has no legal exit/return/safety rule.
Error.
Faction clock uses impossible resource/travel condition.
Error.
Author uses undefined term / variable in law.
Error.
Two place edges disagree on direction/cost.
Error.
200 named NPCs have no faction/location/clock/role.
Warning; convert to cohort.
Continent lore has no places, routes or player-facing hooks.
Warning.
3.5 Premade packs
Pack
Minimum runnable kit
Whole world
Premise, 3 regions, 2 settlements, 8 places, 4 factions, 12 named actors, 3 plots, 2 resource chains, travel graph, opening, laws, 30 blank-space slots, 20 fixtures.
Thin adventure
One region, 5 sites, 4 actors, 1 antagonist clock, 1 dungeon/restock policy, opening, 8 fixtures.
3.6 Import/export
Export WorldModel JSON + manifest/hash + human-readable bible. Import accepts only schema-validated data, bounded sizes, content-addressed assets or workspace-relative references, extension namespace, no scripts/tools/URLs to execute, no raw prompt/system instructions. Round-trip oracle: canonicalize(import(export(world))) == canonicalize(world).

3.7 Anti-patterns
Encyclopedia dump; 200 named NPCs with no locations, roles, resources or clocks; map art without topology; lore that cannot become a rule; quest without actor/place/time; history without event sources; simulator values with no player-visible consequence.



PART 4 â€” Behind-the-scenes maths: living world simulation
4.1 Time, actors, clocks and receipts
interface WorldClock { tick:number; calendarDay:number; phase:'scene'|'travel'|'rest'|'downtime'; schemaVersion:string; }
interface ActorSheet { id:string; regionId:string; locationId:string; level:number; xp:number;
 skill:number; reputation:Record<string,number>; wealth:number; injury:number; knowledge:KnowledgeRef[];
 commitment?:Commitment; status:'active'|'dormant'|'dead'|'retired'; }
interface PlotClock { id:string; ownerId:string; stage:number; maxStage:number; pressure:number;
 nextDueTick:number; triggers:string[]; cancelPredicates:string[]; visibility:'rumor'|'known'|'hidden'; }
interface FactionSim { id:string; resources:Record<string,number>; influence:Record<string,number>;
 goals:string[]; treaties:string[]; activeClockIds:string[]; }
interface OffscreenTick { id:string; at:number; priority:number; targetIds:string[]; ruleId:string;
 rngStream:string; precondition:string; }
interface ReturnReceipt { regionId:string; sinceTick:number; events:Array<{id:string; kind:string; playerVisible:boolean; why:string}>;
 hardDeltaIds:string[]; pendingThreatIds:string[]; }

4.2 Formula policy
All math uses integers/fixed-point values where a result affects replay. Formula output is capped and versioned; narrative labels come later.

System
Formula / cap
Visibility
Time
scene + actionCost; travel routeDuration; rest/downtime declared duration.
Player sees time passage/route/rest before commit.
NPC skill
xp += activityXP Ã— access Ã— health Ã— opportunity; level when xp >= threshold(level); cap by archetype/tier.
Known only via observation/rumor/encounter.
Wealth
wealth += income âˆ’ upkeep âˆ’ obligation; floor 0, no hidden negative theft.
Market/behavior can imply; exact only Expert/admin.
Injury recovery
injury = max(0, injury âˆ’ recoveryRate Ã— restQuality Ã— care); no recovery while travelling/under threat unless rule says.
Visible when observed/known.
Reputation
rep' = clamp(rep + witnessedEffect + credibleReport, -100,100); decay toward 0 only by rule/time.
Faction-facing summary, not interpersonal omniscience.
Rival training
gain = base Ã— trainingAccess Ã— resourceFactor Ã— safeTime; cap one advancement band per chapter unless explicit event.
Return receipt only if player can learn it.
Economy
stock' = clamp(stock + production + imports âˆ’ consumption âˆ’ loss, 0, cap); price is bounded projection of stock/demand/risk.
Player sees availability/price/rumor, never fake global exactness.
Dungeon
pressure' = clamp(pressure + elapsed/restock âˆ’ playerClearance,0,cap); spawn from authored pool/seed.
On return, â€œtracks/repairs/new dangerâ€ only after sim event.
Relationship
edge' = clamp(edge + witnessed + report âˆ’ decay, min,max) with named reason/evidence.
Summarize threshold change, not constant hidden scoring.
4.3 Plot clocks and fairness
Clock stage
Example effect
Player interruption
Fairness guard
0â€“1
Rumor/mobilization.
Investigate, ignore, negotiate, gather evidence.
No irreversible loss while only hidden.
2
Concrete pressure/route change.
Counter-plan, ally, sabotage, pay cost.
Give player-known warning if commitment is affected.
3
Confrontation/turning point.
Direct action, deliberate retreat, sacrifice.
No same-tick surprise resolution after player leaves unrelated scene.
4
Aftermath.
Repair, exploit, mourn, pursue successor.
Receipt names causal triggers, never â€œbecause you were away.â€
4.4 Tick algorithm and budget
on accepted turn: advance WorldClock by declared actionCost
on travel/rest/downtime: advance by typed duration
collect due events from priority queue ordered by (tick, priority, stableEventId)
select target LOD: active if nearby/quest-relevant/villain/causal; warm if region dependent; cold aggregate otherwise
for each due event within budget:
  load target aggregate/checkpoint; validate precondition and knowledge/travel constraints
  derive rng from campaignSeed + ruleId + eventId (never global RNG)
  apply deterministic reducer once; append event; schedule follow-ons; update projections
  if player-visible/casual: append ReturnReceipt candidate
if budget exhausted: persist deterministic frontier and continue next system batch; do not skip
before scene prose: validate receipt â†’ commit StateTx/SceneManifest deltas â†’ writer narrates allowed facts

Trigger
Active actor cap
Warm/cold cap
Policy
Ordinary turn
12 actors / 16 due events
4 aggregate region events
Only causal/nearby/deadline work.
Travel
30 actors / 40 due events
10 aggregate events
Resolve route and affected origin/destination clocks.
Rest
40 actors / 80 due events
20 aggregate events
Receipt groups routine changes.
Chapter close
80 actors / 150 due events
50 aggregate events
Snapshot/checkpoint and legend projection.
Never advance offscreen: player inventory, unaccepted player action, unrevealed culprit truth as player knowledge, Kid-unsafe escalation without a content gate, protected promise/deadline without warning/grace, or a major NPC death that has no causal event path. The writer may narrate simulator output with event source links; it cannot invent an offscreen victory.

PART 5 â€” Whole text world coherence rules
Rule
Hard invariant
Reducer / validator
Causality
Event time cannot precede causal parent; state transition requires typed precondition.
Reject time inversion / missing parent.
No teleport
Actor has one locationId; any change needs route/portal/travel event.
Location uniqueness + route predicate oracle.
No double-location
Actor projection belongs to exactly one region/scene at revision.
Cross-region occupancy index.
No item duplication
Item instance has one owner/location state; transfers conserve quantity.
Ownership conservation oracle.
Knowledge
Actor/player/GM scope separate from truth; receipt only exposes allowed observations.
World-scale leak scanner.
Travel / rumor lag
Information has route/channel/delivery duration; actor cannot respond earlier.
Knowledge timestamp vs action check.
Quest threads
Every hard prerequisite has at least one viable player-known or revealable path.
Reachability / soft-lock oracle.
Death / succession
Death closes actor activity; successor must have authored/derived succession event.
Dead actor cannot schedule/move/speak; lineage graph.
Custom law
A law compiles to typed predicate/effect or remains color-only.
Compiler rejects â€œlawâ€ only in prompt prose.
5.1 Knowledge at world scale
interface KnowledgeRef { claimId:string; actorId:string; acquiredAt:number; source:'observe'|'report'|'rumor'|'record';
 confidence:'confirmed'|'likely'|'rumored'; expiresAt?:number; }

A villain cannot react to player travel until its actor/faction has a valid observation, report or magic rule that carries sourceEventId, channel, and elapsed delivery time. Rumors propagate as beliefs, not truth. The player can learn a past event later; the event does not become newly true when discovered.

5.2 Multi-thread / anti-softlock rules
Rail
Requirement
Critical path
Each essential plot stage has â‰¥2 authored discovery sources or one recoverable alternate.
Time pressure
Deadline start/visibility is logged; blocked action offers inspectable category.
Faction failure
Failed alliance changes available route/resources, but does not erase all next actions.
Dungeon depletion
Keep at least one recovery/restock/alternate content path where a quest depends on it.
Succession
Actor death/retirement changes owners/roles via explicit queued event, never unrelated prose.


PART 6 â€” Module map to SynapticGM code
Existing area
Verdict
One-sentence coding task
worldSim
HARDEN
Convert to deterministic discrete-event kernel with named RNG, LOD, queue, snapshots, hashes and return receipts.
npcMemory
EXTEND
Split actor beliefs/observations from truth; add schedule, commitment and source/expiry.
timeline
HARDEN
Own integer world clock, causal parents, bitemporal observation and canonical ordering.
places
EXTEND
Compile hierarchy/topology/landmarks/region boundary and durable place state.
placeAuthority
HARDEN
Enforce place/route/knowledge provenance and prohibit untyped generated locations.
mapEngine
EXTEND
Render confirmed/rumored/explored/current layers from projections.
dungeonSeed
EXTEND
Add seeded restock profile, depletion, source pool, pressure and permanence flags.
campaignMemory
HARDEN
Store projections and lineage pointers, not growing canonical prose summaries.
sceneManifest / sceneFacts
EXTEND
Consume validated ReturnReceipt and current region page before prose.
questPlay
HARDEN
Link threads to plot clocks, viable prerequisites, deadlines and causal receipts.
ledgerCombat
EXTEND
Advance typed world time and emit location/faction/resource consequences.
openingEstablishment
EXTEND
Compile opening facts to WorldModel roots and starter region/actors/clocks.
customExpertDraft / campaignSeed
HARDEN
Emit versioned WorldModel and run semantic/simulation preflight fixtures.
systemPrompt
HARDEN
Treat simulator/projection output as read-only facts and forbid offscreen invention.
capacityLedger
EXTEND
Meter world page/cache/snapshot and sim-event budgets, never core continuity access.
worldCompiler
NEW FILE
Parser, validator, normalizer, rule compiler, manifest and import/export gates.
worldScheduler
NEW FILE
Priority queue, catch-up batch, deterministic seed derivation, LOD policy.
worldProjections
NEW FILE
Region/actor/faction/timeline/knowledge/legend read models keyed by revision.
worldInvariants
NEW FILE
Property/oracle pack for causality, ownership, knowledge, travel and replay.
returnReceipt
NEW FILE
Groups player-visible offscreen deltas with why/source/visibility.


PART 7 â€” 90-day living-world build plan (parallel-safe with continuity/Stripe)
MVP versus v2
Scope
What player notices
MVP living world
Within 20 turns away from a site: named NPC follows a known schedule, a villain clock advances only by eligible time/predicate, a market/dungeon state changes within bounded rules, and return provides a fair â€œSince you leftâ€ receipt.
V2 realm sim
Multiple regions advance in LOD; factions, routes, scarcity, succession, legends and cross-region rumors all run from compiled constraints.
Weeks
Shippable outcome
Metric
Kill / hold criterion
1â€“2
Audit/extend worldSim; freeze integer time, event schema, RNG naming, deterministic queue.
Same seed/input = same event/state hash across 100 replays.
Any hidden wall-clock/unordered iteration dependency.
3â€“4
Region page/checkpoint + return receipt for one town/dungeon.
Leave-return equivalence and page-in p95 <150 ms local target.
Snapshot/replay mismatch or receipt creates ungrounded fact.
5â€“6
WorldModel minimal compiler for opening/places/NPC/faction/plot.
20 pack fixtures compile; invalid link/law rejected.
Need free-form prompt exception for core fact.
7â€“8
NPC schedule, one plot clock, rival progression and knowledge-lag guard.
100-seed actor/clock tests; zero impossible reaction.
Rival appears to cheat or catches up without resources/time.
9â€“10
Dungeon restock + optional scarcity aggregate + legend projection.
Conservation / no-softlock / source lineage tests.
Aggregate expansion violates named actor/item facts.
11â€“12
300-turn playtest, red team, Expert inspector, MVP polish / go-no-go.
â‰¥95% return receipts judged causal; zero P0 world invariant failure.
World adds support burden or latency without observed player value.
Parallel-safe: compiler, pure reducers, fixtures, projections and inspector can be built beside continuity/Stripe work. Not parallel-safe: changing authority order, payment/capacity policy, launch safety controls, or hot turn pipeline without owner coordination.



PART 8 â€” Red-team & evaluation
Forty adversarial cases
#
Case
Expected automated outcome
1
Player time-skips 7 days beside deadline.
Clock advances by documented rule; receipt names warning/trigger.
2
Villain reacts before report can travel.
Leak/knowledge oracle rejects action.
3
NPC levels after no time/resources.
Progression reducer rejects.
4
NPC levels twice in one chapter cap.
Cap oracle rejects.
5
Rival gains item owned by player.
Ownership conservation rejects.
6
Item exists in two regions.
Unique instance oracle rejects.
7
Actor appears in town and dungeon.
Single-location oracle rejects.
8
Actor returns before route duration.
Travel-time oracle rejects.
9
Player receives offscreen loot without source.
Receipt provenance required.
10
Dungeon resets after player cleared permanent boss.
Restock permanence policy rejects.
11
Aggregate region creates named actor before authored introduction.
Introduction permit required.
12
NPC speaks with player knowledge not observed.
Actor knowledge scope rejects.
13
Rumor elevates itself to truth.
Epistemic class invariant rejects.
14
Legend loses historical debt.
Lineage/obligation oracle rejects compaction.
15
Snapshot differs from replay.
CI state hash fails.
16
Same events shuffled at same tick alter result.
Stable priority/tie test; only defined noncommuting order allowed.
17
Schema migration changes past ownership.
Upcaster/replay fixture fails.
18
Save/load at tick boundary doubles event.
Idempotency event ID rejects.
19
Travel interrupted but origin/destination both active.
Transaction rollback/arrival state test.
20
Faction acts with negative resource.
Resource floor rejects.
21
Market price diverges outside bounds.
Bounded price projection clamps/alerts.
22
Scarcity blocks all food/route paths.
Safety-floor/reachability test.
23
Relationship changes without witnessed/report source.
Evidence reference required.
24
Death actor remains on schedule.
Status scheduler filter fails test.
25
Successor inherits role without succession event.
Lineage required.
26
Child/age-inappropriate offscreen escalation occurs.
Content gate holds/scopes outcome.
27
Custom rule accesses hidden GM state.
Rule compiler rejects.
28
Import has duplicate IDs/path traversal/script prompt.
Schema/import gate rejects.
29
Map geometry and route edge disagree.
Compiler fails semantic validation.
30
Place name prose invents a city.
PlaceAuthority rejects claim.
31
Context page overflow drops current injury/debt.
Reservation oracle retains hard facts.
32
Cold-region compression loses stock total.
Aggregate conservation fails.
33
Active/warm/cold LOD yields different event outcome.
Paging invariance test fails.
34
Player leaves/returns repeatedly to farm restock.
Policy/seed/cooldown makes outcome bounded.
35
Return receipt spoils hidden culprit.
Visibility class filter blocks.
36
Writer says rival won when no sim event exists.
Claim gate rejects draft.
37
Writer omits necessary consequence.
Required receipt coverage fails.
38
Pending world batch times out.
Deterministic frontier saved; text reports no false completion.
39
Extreme 1000-turn run causes page-in timeout.
Snapshot/compaction budget alarm.
40
Two identical campaign replays differ after prose provider changes.
Hard ledger hash equal; prose decoupled.
Automated oracles and playtests
Oracle
Runs
Pass criteria
Replay hash
Every reducer CI.
Same seed/input/version â†’ identical hard state/event hash.
Snapshot equivalence
100/300/1000 turn fixtures.
Snapshot + tail == full replay.
Paging invariance
Region enter/leave permutations.
Local state same except explicit observed timing.
Knowledge leak
All renderer/return receipt outputs.
No claim exceeds observer scope.
Conservation
Inventory/economy/dungeon pools.
Sum/owner/location constraints hold.
Reachability
Quest/map/custom compile.
Required path or declared fail route remains reachable.
Narrative grounding
Writer outputs.
Significant claim maps to truth/evidence/color source.
Fairness
Rival/faction scenario matrix.
Same resource/time/knowledge gets same resolution; differences explainable.
Playtest script: start a town quest; leave on travel; rest twice; return; inspect Here/Threads/Why; challenge a rumor; trace a rival change; reload on another device; compare to receipt; force an interrupted departure; then complete/abandon a clock. Observe whether player can explain what happened without seeing an Expert trace.



PART 9 â€” Open founder decisions
Decision
Recommendation
Alternative
Cost if wrong
Living-world aggression
Standard: advance declared clocks/eligible schedules, give grace for player-known commitments.
Gentle / ruthless.
Too gentle feels static; ruthless feels like absence punishment.
Absence harm
No irreversible player-critical loss without warning, visible clock or opt-in ruthless mode.
Sim full consequences always.
Support/retention harm if player returns â€œrobbed.â€
Sim visibility
Simple Here/Threads/Why + detailed Expert receipt.
Full log default.
Too little feels fake; too much spoils/overwhelms.
Rivals in Free tier
Yes, bounded one active rival/clock; basic fairness never paid.
Static Free rivals.
No free living-world proof; high sim cost if unbounded.
Custom world sim caps
3 regions / 12 named active actors / 4 factions in Free authoring; compile/paging not continuity gated.
Unlimited author model.
Unbounded costs and confusing worlds.
Economy
Start scarcity-light with floors/substitutes.
Full market sim.
Full sim distracts/creates softlocks.
Death/succession
Critical named deaths require explicit player-visible causal route unless mode says otherwise.
Pure simulation.
Surprise grief/plot collapse versus loss of stakes.
Legend
Expert opt-in historical depth and player-visible summaries only on relevant queries.
Always show.
Verbosity, accidental false authority.


PART 10 â€” Master â€œready to code a whole text worldâ€ definition
Must-green checklist before â€œliving worldâ€ claims
worldSim has integer clock, stable event queue, named seed streams, versioned event schemas and replay hashes.
Region leave/enter is checkpoint + tail replay + validated return receipt, not prompt summary.
SceneManifest receives offscreen StateTx before prose.
World compiler accepts typed premise/place/entity/faction/rule/plot/opening definitions and rejects semantic contradiction.
A hard fact, observation, rumor and legend have separate types, scopes, source links and UI labels.
Actor location, ownership, travel time, knowledge latency, causal order and resource totals have automated invariants.
NPC schedules, faction actions and plot clocks consume time/resources/knowledge and respect caps.
Player-critical commitments use visible warning/grace and absence fairness policy.
Cold-region aggregation preserves named facts and conservation totals; LOD mode is logged.
100/300/1000 turn replay, paging, compaction, custom-world and writer-grounding suites pass.
Expert can trace a major world change; Simple can understand â€œwhat changed / whyâ€ without spoilers.
p95 active turn and page-in remain within product budget; batch exhaustion stops at deterministic frontier.
No writer output can invent offscreen truth, and no paid tier gates basic continuity or fairness.

References
[1]: https://json-schema.org/specification ; https://doc.mapeditor.org/en/stable/reference/json-map-format/"Typed schemas and map data"[2]:https://martinfowler.com/eaaDev/EventSourcing.html ; https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing ; https://www.kurrent.io/blog/snapshots-in-event-sourcing/"Event sourcing and snapshots"[3]:https://simpy.readthedocs.io/en/latest/topical_guides/time_and_scheduling.html ; https://gafferongames.com/post/fix_your_timestep/ ; https://gafferongames.com/post/deterministic_lockstep/"Scheduling, time steps and deterministic simulation"[4]:https://antithesis.com/docs/resources/deterministic_simulation_testing/ ; https://github.com/ivanyu/awesome-deterministic-simulation-testing"Deterministic simulation testing"[5]:https://unity.com/ecs ; https://www.ifaamas.org/Proceedings/aamas2011/papers/C5_B67.pdf"Data-oriented and agent-simulation scale trade-offs"[6]:https://csrc.nist.gov/csrc/media/Projects/automated-combinatorial-testing-for-software/documents/preprint-iwct-22-fairness.pdf"Fairness-testing methods"[7]:https://www.rockpapershotgun.com/the-joy-of-npc-schedules ; https://dl.acm.org/doi/fullHtml/10.1145/3649921.3650012 "NPC schedules and procedural world research"
