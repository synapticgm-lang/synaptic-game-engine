# WOF Scale Era: Full Start-Depth Pack

> **Release truth.** Scale Era is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `scale_era` |
| Display name | **Scale Era** |
| One-line pitch | A field-expedition valley where cataloguers, trail hands, shelter readers, and boneglass cutters learn how original giant animals reshape a changing landscape. |
| Maturity | **teen** |
| rulesModuleId | `hunt_part` |
| Theme Kit | **Scale Era Theme Kit**, included with world entitlement |
| Genre pattern and fence | Prehistoric expedition and habitat hunt. It is not a dinosaur franchise park, a survival-crafting clone, or a fossil museum reconstruction. |

Scale Era is a WOF text world about a field-expedition valley where cataloguers, trail hands, shelter readers, and boneglass cutters learn how original giant animals reshape a changing landscape. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Jurassic Park named place |
| 2 | Jurassic World hero silhouette |
| 3 | ARK logo geometry |
| 4 | Pokemon fossil catchphrase |
| 5 | The Land Before Time signature costume |
| 6 | Dino Crisis proprietary creature |
| 7 | Monster Hunter map layout |
| 8 | Primal faction title |
| 9 | Walking with Dinosaurs weapon profile |
| 10 | Dino Riders UI chrome |
| 11 | Jurassic Park quest premise |
| 12 | Jurassic World title typography |
| 13 | ARK color-coded insignia |
| 14 | Pokemon fossil music motif |
| 15 | The Land Before Time vehicle or mount profile |
| 16 | Dino Crisis companion anatomy |
| 17 | Monster Hunter named artifact |
| 18 | Primal school or agency badge |
| 19 | Walking with Dinosaurs real sacred practice as minigame |
| 20 | Dino Riders stereotyped cultural shorthand |
| 21 | Jurassic Park real-person likeness |
| 22 | Jurassic World copied dialogue cadence |
| 23 | ARK fan-server slogan |
| 24 | Pokemon fossil paid power framing |
| 25 | The Land Before Time loot-box presentation |
| 26 | Dino Crisis named place |
| 27 | Monster Hunter hero silhouette |
| 28 | Primal logo geometry |
| 29 | Walking with Dinosaurs catchphrase |
| 30 | Dino Riders signature costume |
| 31 | Jurassic Park proprietary creature |
| 32 | Jurassic World map layout |
| 33 | ARK faction title |
| 34 | Pokemon fossil weapon profile |
| 35 | The Land Before Time UI chrome |
| 36 | Dino Crisis quest premise |
| 37 | Monster Hunter title typography |
| 38 | Primal color-coded insignia |
| 39 | Walking with Dinosaurs music motif |
| 40 | Dino Riders vehicle or mount profile |
| 41 | Jurassic Park companion anatomy |
| 42 | Jurassic World named artifact |
| 43 | ARK school or agency badge |
| 44 | Pokemon fossil real sacred practice as minigame |
| 45 | The Land Before Time stereotyped cultural shorthand |
| 46 | Dino Crisis real-person likeness |
| 47 | Monster Hunter copied dialogue cadence |
| 48 | Primal fan-server slogan |
| 49 | Walking with Dinosaurs paid power framing |
| 50 | Dino Riders loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared part-state, camp, tracking, supplies and personal-loot contract. |
| Wipe and checkpoint | Wipe returns the party to `scale_era_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Scale Era • {{turn}} • committed |
| 2 | [Route] Scale Era • {{placeId}} • committed |
| 3 | [Work] Scale Era • {{lastAction}} • committed |
| 4 | [Talk] Scale Era • {{npcId}} • committed |
| 5 | [Kit] Scale Era • {{kitId}} • committed |
| 6 | [Pack] Scale Era • {{partySize}} • committed |
| 7 | [Rest] Scale Era • {{checkpoint}} • committed |
| 8 | [Safety] Scale Era • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| scale_era_kit_01 | Track Scribe | lichen field cape | log multi-day tracks | Never bait a nesting herd. | Name terrain first, then hazard, then a careful option. | track_scribe mantle; track_scribe tool; scale_era_map_01 | scale_era_place_01; scale_era_q_01 | scale_era_ability_01 |
| scale_era_kit_02 | Shelter Reader | layered rain mantle | predict safe storm cover | Never claim a shelter before checking its old marks. | Name terrain first, then hazard, then a careful option. | shelter_reader vest; shelter_reader tool; scale_era_map_02 | scale_era_place_02; scale_era_q_02 | scale_era_ability_02 |
| scale_era_kit_03 | Forage Marshal | reed-pack harness | provision field teams | Never take more forage than the camp count. | Name terrain first, then hazard, then a careful option. | forage_marshal jacket; forage_marshal tool; scale_era_map_03 | scale_era_place_01; scale_era_q_03 | scale_era_ability_03 |
| scale_era_kit_04 | Boneglass Cutter | amber goggles | shape nonlethal specimen tools | Never cut a living scale ridge. | Name terrain first, then hazard, then a careful option. | boneglass_cutter sash; boneglass_cutter tool; scale_era_map_04 | scale_era_place_02; scale_era_q_04 | scale_era_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `scale_era_place_01` is a shared hub rather than a capital analogue; `scale_era_place_04` is the mid-join; `scale_era_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scale_era_place_01 | Basalt Shelter | shared hub | street | safe | yes | scale_era_place_02, scale_era_place_04 | A public notice at Basalt Shelter has been posted with one crucial line washed away. |
| scale_era_place_02 | Fern Basin | start hub | street | safe | yes | scale_era_place_01, scale_era_place_03 | A work roster at Fern Basin leaves two neighbours believing they were promised the same task. |
| scale_era_place_03 | Amber Crossing | street route | street | safe | yes | scale_era_place_02, scale_era_place_04 | A route marker at Amber Crossing points visitors toward a closed gate and needs a safe correction. |
| scale_era_place_04 | Thunderstep | mid join | street | low | yes | scale_era_place_03, scale_era_place_05, scale_era_place_01 | A newcomer at Thunderstep needs a local introduction before a small obligation becomes embarrassing. |
| scale_era_place_05 | Boneglass Ravine | work district | interior | low | no | scale_era_place_04, scale_era_place_06 | A shared tool at Boneglass Ravine has been returned without its care tag. |
| scale_era_place_06 | Long Dawn Camp | instance door | dungeon | medium | no | scale_era_place_05, scale_era_place_07 | The entry record at Long Dawn Camp names an unfinished errand, not a monster or apocalypse. |
| scale_era_place_07 | Pollen Shelf | wild edge | street | medium | yes | scale_era_place_06, scale_era_place_08 | A weather change at Pollen Shelf threatens a community plan unless someone reads the signs. |
| scale_era_place_08 | Rumbling Weir | housing approach | interior | low | no | scale_era_place_07 | A resident at Rumbling Weir has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| scale_era_npc_01 | Jori Wren | scale_era_place_01 | quest | Jori Wren says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Jori Wren offers a specific task at Basalt Shelter: settle the practical mismatch before it costs someone a shift. | Jori Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_02 | Alden Morrow | scale_era_place_02 | profession | Alden Morrow says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Alden Morrow offers a specific task at Fern Basin: settle the practical mismatch before it costs someone a shift. | Alden Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_03 | Bryn Rowan | scale_era_place_03 | hub | Bryn Rowan says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Bryn Rowan offers a specific task at Amber Crossing: settle the practical mismatch before it costs someone a shift. | Bryn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_04 | Cato Nook | scale_era_place_04 | merchant | Cato Nook says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Cato Nook offers a specific task at Thunderstep: settle the practical mismatch before it costs someone a shift. | Cato Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_05 | Dessa Cress | scale_era_place_01 | local | Dessa Cress says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Dessa Cress offers a specific task at Basalt Shelter: settle the practical mismatch before it costs someone a shift. | Dessa Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_06 | Eris Silt | scale_era_place_02 | host | Eris Silt says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Eris Silt offers a specific task at Fern Basin: settle the practical mismatch before it costs someone a shift. | Eris Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_07 | Fenn Pryce | scale_era_place_03 | quest | Fenn Pryce says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Fenn Pryce offers a specific task at Amber Crossing: settle the practical mismatch before it costs someone a shift. | Fenn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_08 | Gala Vane | scale_era_place_04 | profession | Gala Vane says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Gala Vane offers a specific task at Thunderstep: settle the practical mismatch before it costs someone a shift. | Gala Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_09 | Holl Quill | scale_era_place_01 | local | Holl Quill says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Holl Quill offers a specific task at Basalt Shelter: settle the practical mismatch before it costs someone a shift. | Holl Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| scale_era_npc_10 | Ivo Vale | scale_era_place_02 | merchant | Ivo Vale says, ‘Scale Era keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vale offers a specific task at Fern Basin: settle the practical mismatch before it costs someone a shift. | Ivo Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Thunderstep, if that is useful. |
| 2 | Scale Era feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Long Dawn Camp. |
| 5 | Let’s keep the route clear for whoever comes after. |
| 6 | A good note saves a long explanation. |
| 7 | I have room for one more careful pair of hands. |
| 8 | The local rule is simple; the reason is not. |
| 9 | I can wait while you check your ledger. |
| 10 | That is kind of you to ask first. |
| 11 | We can take the safer path without making a scene. |
| 12 | I will remember that help came from this direction. |


## 5. Premade choices and first hour

### Opening establishment deck

| Kit | Look and origin | Visible stake | First quest |
| --- | --- | --- | --- |
| Track Scribe | At Basalt Shelter, you arrive in track_scribe mantle carrying scale_era_map_01. A small obligation is already late. | Give up one turn to help now. | Scale Era: Name a Working Promise |
| Shelter Reader | At Fern Basin, you arrive in shelter_reader vest carrying scale_era_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Scale Era: Set the First Tool Aside |
| Forage Marshal | At Basalt Shelter, you arrive in forage_marshal jacket carrying scale_era_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Scale Era: Carry the Right Record |
| Boneglass Cutter | At Fern Basin, you arrive in boneglass_cutter sash carrying scale_era_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Scale Era: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_scale_era_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Basalt Shelter’s small mismatch | ask | missing tag | A local need at Thunderstep is connected but not catastrophic. | alternate talk |
| 2 | Resolve Fern Basin’s small mismatch | repair | closed path | A local need at Boneglass Ravine is connected but not catastrophic. | new route |
| 3 | Resolve Amber Crossing’s small mismatch | carry | unclear note | A local need at Long Dawn Camp is connected but not catastrophic. | recorded favor |
| 4 | Resolve Thunderstep’s small mismatch | listen | late guest | A local need at Pollen Shelf is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Boneglass Ravine’s small mismatch | map | wet weather | A local need at Rumbling Weir is connected but not catastrophic. | slower reward |
| 6 | Resolve Long Dawn Camp’s small mismatch | prepare | busy shift | A local need at Basalt Shelter is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Pollen Shelf’s small mismatch | wait | quiet boundary | A local need at Fern Basin is connected but not catastrophic. | solo option |
| 8 | Resolve Rumbling Weir’s small mismatch | return | wrong room | A local need at Amber Crossing is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Thunderstep Traverse` and `Long Dawn Migration`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| scale_era_q_01 | Scale Era: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| scale_era_q_02 | Scale Era: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| scale_era_q_03 | Scale Era: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| scale_era_q_04 | Scale Era: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| scale_era_q_05 | Scale Era: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| scale_era_q_06 | Scale Era: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| scale_era_q_07 | Scale Era: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| scale_era_q_08 | Scale Era: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| scale_era_q_09 | Scale Era: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| scale_era_q_10 | Scale Era: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| scale_era_q_11 | Scale Era: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| scale_era_q_12 | Scale Era: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| scale_era_q_13 | Scale Era: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| scale_era_q_14 | Scale Era: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| scale_era_q_15 | Scale Era: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| scale_era_q_16 | Scale Era: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| scale_era_q_17 | Scale Era: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| scale_era_q_18 | Scale Era: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| scale_era_q_19 | Scale Era: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| scale_era_q_20 | Scale Era: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| scale_era_q_21 | Scale Era: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| scale_era_q_22 | Scale Era: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| scale_era_q_23 | Scale Era: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| scale_era_q_24 | Scale Era: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| scale_era_q_25 | Scale Era: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Basalt Shelter`: write `scale_era_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Thunderstep`: write `scale_era_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `scale_era_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| scale_era_species_01 | Ribbonback | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_02 | Thunder Elk | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_03 | Sailjaw | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_04 | Mire Tusker | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_05 | Fern Neck | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_06 | Cinder Grazer | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_07 | Amber Paw | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_08 | Drumtail | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_09 | Reed Runner | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_10 | Cliff Snout | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_11 | Glass Hide | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_12 | Burrow Crest | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_13 | Pollen Flier | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_14 | Basalt Horn | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_15 | Sun Frill | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_16 | Mud Paddle | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_17 | Long Stride | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| scale_era_species_18 | Slope Mouser | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Dawn Marks**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Fossil Flakes**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Basalt Shelter token, Fern Basin tool, Amber Crossing thread, Thunderstep seal, Boneglass Ravine bundle, Long Dawn Camp token. |
| Instance and cosmetic templates | Pollen Shelf tool, Rumbling Weir thread, Basalt Shelter seal, Fern Basin bundle, Amber Crossing token, Thunderstep tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `scale_era_vendor_01` at `scale_era_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| scale_era_dungeon_room_01 | The Thunderstep Traverse: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: scale_era_species_01, scale_era_species_02; elite: none |   |
| scale_era_dungeon_room_02 | The Thunderstep Traverse: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: scale_era_species_03, scale_era_species_04; elite: none |   |
| scale_era_dungeon_room_03 | The Thunderstep Traverse: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: scale_era_species_05, scale_era_species_06; elite: scale_era_species_09 |   |
| scale_era_dungeon_room_04 | The Thunderstep Traverse: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: scale_era_species_07, scale_era_species_08; elite: none | checkpoint  |
| scale_era_dungeon_room_05 | The Thunderstep Traverse: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: scale_era_species_09, scale_era_species_10; elite: none |  boss: scale_era_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`scale_era_trap_01`), jammed latch (`scale_era_trap_02`), wet threshold (`scale_era_trap_03`), false shelf (`scale_era_trap_04`), quiet bell (`scale_era_trap_05`), sealed drawer (`scale_era_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Long Dawn Migration** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| scale_era_talent_01 | Scale Era Local Ear | 1 | none | scale_era_effect_01 |
| scale_era_talent_02 | Scale Era Careful Hand | 2 | none | scale_era_effect_02 |
| scale_era_talent_03 | Scale Era Route Sense | 3 | none | scale_era_effect_03 |
| scale_era_talent_04 | Scale Era Shared Measure | 4 | none | scale_era_effect_04 |
| scale_era_talent_05 | Scale Era Quiet Craft | 1 | scale_era_talent_04 | scale_era_effect_05 |
| scale_era_talent_06 | Scale Era Open Invitation | 2 | none | scale_era_effect_06 |
| scale_era_talent_07 | Scale Era Safe Return | 3 | none | scale_era_effect_07 |
| scale_era_talent_08 | Scale Era Field Note | 4 | none | scale_era_effect_08 |
| scale_era_talent_09 | Scale Era Steady Pace | 1 | scale_era_talent_08 | scale_era_effect_09 |
| scale_era_talent_10 | Scale Era Clear Signal | 2 | none | scale_era_effect_10 |
| scale_era_talent_11 | Scale Era Warm Welcome | 3 | none | scale_era_effect_11 |
| scale_era_talent_12 | Scale Era Small Courage | 4 | none | scale_era_effect_12 |
| scale_era_talent_13 | Scale Era Repair Habit | 1 | scale_era_talent_12 | scale_era_effect_13 |
| scale_era_talent_14 | Scale Era Trust Mark | 2 | none | scale_era_effect_14 |
| scale_era_talent_15 | Scale Era Second Look | 3 | none | scale_era_effect_15 |
| scale_era_talent_16 | Scale Era Closing Grace | 4 | none | scale_era_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| scale_era_contract_01 | Scale Era Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| scale_era_contract_02 | Scale Era Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| scale_era_contract_03 | Scale Era Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| scale_era_contract_04 | Scale Era Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| scale_era_contract_05 | Scale Era Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| scale_era_contract_06 | Scale Era Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| scale_era_contract_07 | Scale Era Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| scale_era_contract_08 | Scale Era Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| scale_era_interact_01 | Basalt Shelter bench | rest | scale_era_place_01 |
| scale_era_interact_02 | Fern Basin cabinet | repair | scale_era_place_02 |
| scale_era_interact_03 | Amber Crossing rack | tend | scale_era_place_03 |
| scale_era_interact_04 | Thunderstep kettle | craft | scale_era_place_04 |
| scale_era_interact_05 | Boneglass Ravine ledger | cook | scale_era_place_05 |
| scale_era_interact_06 | Long Dawn Camp rail | bind_inn | scale_era_place_06 |
| scale_era_interact_07 | Pollen Shelf bell | inspect | scale_era_place_07 |
| scale_era_interact_08 | Rumbling Weir board | open | scale_era_place_08 |
| scale_era_interact_09 | Basalt Shelter table | carry | scale_era_place_01 |
| scale_era_interact_10 | Fern Basin lamp | clean | scale_era_place_02 |
| scale_era_interact_11 | Amber Crossing gate | signal | scale_era_place_03 |
| scale_era_interact_12 | Thunderstep shelf | record | scale_era_place_04 |


**Default interior graph.** `scale_era_interior_01` enters from `scale_era_place_08` and contains 7 connected rooms: Scale Era Entry, Scale Era Main Room, Scale Era Work Nook, Scale Era Window Room, Scale Era Quiet Room, Scale Era Storage, Scale Era Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | basalt, fern, amber, thunderstep materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Scale Era` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Name terrain first, then hazard, then a careful option. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Scale Era: distant work, a room tone, a gentle rhythm that belongs to Basalt Shelter, and a second layer that makes the route toward Long Dawn Camp feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Scale Era Ledger |
| 2 | Scale Era Route |
| 3 | Scale Era Work |
| 4 | Scale Era Talk |
| 5 | Scale Era Kit |
| 6 | Scale Era Pack |
| 7 | Scale Era Rest |
| 8 | Scale Era Safety |
| 9 | Scale Era Map |
| 10 | Scale Era Notice |
| 11 | Scale Era Favour |
| 12 | Scale Era Gold |
| 13 | Scale Era Token |
| 14 | Scale Era Record |
| 15 | Scale Era Instance |
| 16 | Scale Era Checkpoint |
| 17 | Scale Era Choice |
| 18 | Scale Era Help |
| 19 | Scale Era Calendar |
| 20 | Scale Era Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Basalt Shelter, a small promise has your name on it. |
| 2 | At Fern Basin, a small promise has your name on it. |
| 3 | At Amber Crossing, a small promise has your name on it. |
| 4 | At Thunderstep, a small promise has your name on it. |
| 5 | At Boneglass Ravine, a small promise has your name on it. |
| 6 | At Long Dawn Camp, a small promise has your name on it. |
| 7 | At Pollen Shelf, a small promise has your name on it. |
| 8 | At Rumbling Weir, a small promise has your name on it. |
| 9 | At Basalt Shelter, a small promise has your name on it. |
| 10 | At Fern Basin, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is prehistoric expedition and habitat hunt. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
