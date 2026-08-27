# WOF Leafrail: Full Start-Depth Pack

> **Release truth.** Leafrail is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `leafrail` |
| Display name | **Leafrail** |
| One-line pitch | A sun-catching rail network of gardens and repair co-ops where people keep public transit gentle, beautiful, and useful through shared maintenance. |
| Maturity | **all-ages** |
| rulesModuleId | `cozy_tick` |
| Theme Kit | **Leafrail Theme Kit**, included with world entitlement |
| Genre pattern and fence | Solarpunk rail-garden cooperative. It is not a real transit map, a dystopian rail franchise, or a salvaged-machine wasteland. |

Leafrail is a WOF text world about a sun-catching rail network of gardens and repair co-ops where people keep public transit gentle, beautiful, and useful through shared maintenance. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Sunless Skies named place |
| 2 | Snowpiercer hero silhouette |
| 3 | Thomas the Tank Engine logo geometry |
| 4 | Animal Crossing train catchphrase |
| 5 | Studio Ghibli train signature costume |
| 6 | Solarpunk trademark proprietary creature |
| 7 | Horizon Zero Dawn map layout |
| 8 | Fallout train faction title |
| 9 | Metro 2033 weapon profile |
| 10 | Sunloom Circuit UI chrome |
| 11 | Sunless Skies quest premise |
| 12 | Snowpiercer title typography |
| 13 | Thomas the Tank Engine color-coded insignia |
| 14 | Animal Crossing train music motif |
| 15 | Studio Ghibli train vehicle or mount profile |
| 16 | Solarpunk trademark companion anatomy |
| 17 | Horizon Zero Dawn named artifact |
| 18 | Fallout train school or agency badge |
| 19 | Metro 2033 real sacred practice as minigame |
| 20 | Sunloom Circuit stereotyped cultural shorthand |
| 21 | Sunless Skies real-person likeness |
| 22 | Snowpiercer copied dialogue cadence |
| 23 | Thomas the Tank Engine fan-server slogan |
| 24 | Animal Crossing train paid power framing |
| 25 | Studio Ghibli train loot-box presentation |
| 26 | Solarpunk trademark named place |
| 27 | Horizon Zero Dawn hero silhouette |
| 28 | Fallout train logo geometry |
| 29 | Metro 2033 catchphrase |
| 30 | Sunloom Circuit signature costume |
| 31 | Sunless Skies proprietary creature |
| 32 | Snowpiercer map layout |
| 33 | Thomas the Tank Engine faction title |
| 34 | Animal Crossing train weapon profile |
| 35 | Studio Ghibli train UI chrome |
| 36 | Solarpunk trademark quest premise |
| 37 | Horizon Zero Dawn title typography |
| 38 | Fallout train color-coded insignia |
| 39 | Metro 2033 music motif |
| 40 | Sunloom Circuit vehicle or mount profile |
| 41 | Sunless Skies companion anatomy |
| 42 | Snowpiercer named artifact |
| 43 | Thomas the Tank Engine school or agency badge |
| 44 | Animal Crossing train real sacred practice as minigame |
| 45 | Studio Ghibli train stereotyped cultural shorthand |
| 46 | Solarpunk trademark real-person likeness |
| 47 | Horizon Zero Dawn copied dialogue cadence |
| 48 | Fallout train fan-server slogan |
| 49 | Metro 2033 paid power framing |
| 50 | Sunloom Circuit loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared energy, season, neighbor and authored-tick contract. |
| Wipe and checkpoint | Wipe returns the party to `leafrail_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Leafrail • {{turn}} • committed |
| 2 | [Route] Leafrail • {{placeId}} • committed |
| 3 | [Work] Leafrail • {{lastAction}} • committed |
| 4 | [Talk] Leafrail • {{npcId}} • committed |
| 5 | [Kit] Leafrail • {{kitId}} • committed |
| 6 | [Pack] Leafrail • {{partySize}} • committed |
| 7 | [Rest] Leafrail • {{checkpoint}} • committed |
| 8 | [Safety] Leafrail • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| leafrail_kit_01 | Canopy Conductor | leaf-green conductor coat | coordinate garden carriages | Never close a rail for a private picnic. | Use bright practical language and invite repair before complaint. | canopy_conductor mantle; canopy_conductor tool; leafrail_map_01 | leafrail_place_01; leafrail_q_01 | leafrail_ability_01 |
| leafrail_kit_02 | Glass Orchardist | apricot orchard smock | prune light-catching trees | Never shade a community panel for a prize. | Use bright practical language and invite repair before complaint. | glass_orchardist vest; glass_orchardist tool; leafrail_map_02 | leafrail_place_02; leafrail_q_02 | leafrail_ability_02 |
| leafrail_kit_03 | Sunspoke Mechanic | solar cloth tool vest | repair sunspoke brakes | Never sell a repair slot to the highest bidder. | Use bright practical language and invite repair before complaint. | sunspoke_mechanic jacket; sunspoke_mechanic tool; leafrail_map_03 | leafrail_place_01; leafrail_q_03 | leafrail_ability_03 |
| leafrail_kit_04 | Lattice Mediator | woven lattice cape | settle platform schedules | Never schedule over an accessibility stop. | Use bright practical language and invite repair before complaint. | lattice_mediator sash; lattice_mediator tool; leafrail_map_04 | leafrail_place_02; leafrail_q_04 | leafrail_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `leafrail_place_01` is a shared hub rather than a capital analogue; `leafrail_place_04` is the mid-join; `leafrail_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| leafrail_place_01 | Canopy Terminal | shared hub | street | safe | yes | leafrail_place_02, leafrail_place_04 | A public notice at Canopy Terminal has been posted with one crucial line washed away. |
| leafrail_place_02 | Glass Orchard | start hub | street | safe | yes | leafrail_place_01, leafrail_place_03 | A work roster at Glass Orchard leaves two neighbours believing they were promised the same task. |
| leafrail_place_03 | Sunspoke Yard | street route | street | safe | yes | leafrail_place_02, leafrail_place_04 | A route marker at Sunspoke Yard points visitors toward a closed gate and needs a safe correction. |
| leafrail_place_04 | Fern Viaduct | mid join | street | low | yes | leafrail_place_03, leafrail_place_05, leafrail_place_01 | A newcomer at Fern Viaduct needs a local introduction before a small obligation becomes embarrassing. |
| leafrail_place_05 | Lattice Commons | work district | interior | low | no | leafrail_place_04, leafrail_place_06 | A shared tool at Lattice Commons has been returned without its care tag. |
| leafrail_place_06 | Dawn Depot | instance door | dungeon | medium | no | leafrail_place_05, leafrail_place_07 | The entry record at Dawn Depot names an unfinished errand, not a monster or apocalypse. |
| leafrail_place_07 | Moss Platform | wild edge | street | medium | yes | leafrail_place_06, leafrail_place_08 | A weather change at Moss Platform threatens a community plan unless someone reads the signs. |
| leafrail_place_08 | Apricot Switch | housing approach | interior | low | no | leafrail_place_07 | A resident at Apricot Switch has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| leafrail_npc_01 | Ivo Nook | leafrail_place_01 | quest | Ivo Nook says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Ivo Nook offers a specific task at Canopy Terminal: settle the practical mismatch before it costs someone a shift. | Ivo Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_02 | Jori Cress | leafrail_place_02 | profession | Jori Cress says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Jori Cress offers a specific task at Glass Orchard: settle the practical mismatch before it costs someone a shift. | Jori Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_03 | Alden Silt | leafrail_place_03 | hub | Alden Silt says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Alden Silt offers a specific task at Sunspoke Yard: settle the practical mismatch before it costs someone a shift. | Alden Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_04 | Bryn Pryce | leafrail_place_04 | merchant | Bryn Pryce says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Bryn Pryce offers a specific task at Fern Viaduct: settle the practical mismatch before it costs someone a shift. | Bryn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_05 | Cato Vane | leafrail_place_01 | local | Cato Vane says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Cato Vane offers a specific task at Canopy Terminal: settle the practical mismatch before it costs someone a shift. | Cato Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_06 | Dessa Quill | leafrail_place_02 | host | Dessa Quill says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Dessa Quill offers a specific task at Glass Orchard: settle the practical mismatch before it costs someone a shift. | Dessa Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_07 | Eris Vale | leafrail_place_03 | quest | Eris Vale says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Eris Vale offers a specific task at Sunspoke Yard: settle the practical mismatch before it costs someone a shift. | Eris Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_08 | Fenn Wren | leafrail_place_04 | profession | Fenn Wren says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Fenn Wren offers a specific task at Fern Viaduct: settle the practical mismatch before it costs someone a shift. | Fenn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_09 | Gala Morrow | leafrail_place_01 | local | Gala Morrow says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Gala Morrow offers a specific task at Canopy Terminal: settle the practical mismatch before it costs someone a shift. | Gala Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| leafrail_npc_10 | Holl Rowan | leafrail_place_02 | merchant | Holl Rowan says, ‘Leafrail keeps its promises in small places. Tell me which one you noticed.’ | Holl Rowan offers a specific task at Glass Orchard: settle the practical mismatch before it costs someone a shift. | Holl Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Fern Viaduct, if that is useful. |
| 2 | Leafrail feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Dawn Depot. |
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
| Canopy Conductor | At Canopy Terminal, you arrive in canopy_conductor mantle carrying leafrail_map_01. A small obligation is already late. | Give up one turn to help now. | Leafrail: Name a Working Promise |
| Glass Orchardist | At Glass Orchard, you arrive in glass_orchardist vest carrying leafrail_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Leafrail: Set the First Tool Aside |
| Sunspoke Mechanic | At Canopy Terminal, you arrive in sunspoke_mechanic jacket carrying leafrail_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Leafrail: Carry the Right Record |
| Lattice Mediator | At Glass Orchard, you arrive in lattice_mediator sash carrying leafrail_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Leafrail: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_leafrail_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Canopy Terminal’s small mismatch | ask | missing tag | A local need at Fern Viaduct is connected but not catastrophic. | alternate talk |
| 2 | Resolve Glass Orchard’s small mismatch | repair | closed path | A local need at Lattice Commons is connected but not catastrophic. | new route |
| 3 | Resolve Sunspoke Yard’s small mismatch | carry | unclear note | A local need at Dawn Depot is connected but not catastrophic. | recorded favor |
| 4 | Resolve Fern Viaduct’s small mismatch | listen | late guest | A local need at Moss Platform is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Lattice Commons’s small mismatch | map | wet weather | A local need at Apricot Switch is connected but not catastrophic. | slower reward |
| 6 | Resolve Dawn Depot’s small mismatch | prepare | busy shift | A local need at Canopy Terminal is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Moss Platform’s small mismatch | wait | quiet boundary | A local need at Glass Orchard is connected but not catastrophic. | solo option |
| 8 | Resolve Apricot Switch’s small mismatch | return | wrong room | A local need at Sunspoke Yard is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Viaduct Bloom Jam` and `Dawn Depot Lightshare`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| leafrail_q_01 | Leafrail: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| leafrail_q_02 | Leafrail: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| leafrail_q_03 | Leafrail: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| leafrail_q_04 | Leafrail: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| leafrail_q_05 | Leafrail: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| leafrail_q_06 | Leafrail: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| leafrail_q_07 | Leafrail: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| leafrail_q_08 | Leafrail: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| leafrail_q_09 | Leafrail: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| leafrail_q_10 | Leafrail: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| leafrail_q_11 | Leafrail: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| leafrail_q_12 | Leafrail: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| leafrail_q_13 | Leafrail: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| leafrail_q_14 | Leafrail: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| leafrail_q_15 | Leafrail: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| leafrail_q_16 | Leafrail: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| leafrail_q_17 | Leafrail: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| leafrail_q_18 | Leafrail: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| leafrail_q_19 | Leafrail: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| leafrail_q_20 | Leafrail: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| leafrail_q_21 | Leafrail: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| leafrail_q_22 | Leafrail: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| leafrail_q_23 | Leafrail: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| leafrail_q_24 | Leafrail: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| leafrail_q_25 | Leafrail: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Canopy Terminal`: write `leafrail_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Fern Viaduct`: write `leafrail_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `leafrail_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| leafrail_species_01 | Leaf Skimmer | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_02 | Pollen Jay | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_03 | Vine Tortoise | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_04 | Dew Fox | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_05 | Moss Beetle | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_06 | Glass Bee | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_07 | Sun Hare | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_08 | Fern Crow | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_09 | Lattice Lizard | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_10 | Orchard Wren | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_11 | Petal Snail | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_12 | Rail Cricket | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_13 | Apricot Bat | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_14 | Shade Carp | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_15 | Canopy Vole | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| leafrail_species_16 | Light Moth | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Rail Leaves**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Sun Buttons**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Canopy Terminal token, Glass Orchard tool, Sunspoke Yard thread, Fern Viaduct seal, Lattice Commons bundle, Dawn Depot token. |
| Instance and cosmetic templates | Moss Platform tool, Apricot Switch thread, Canopy Terminal seal, Glass Orchard bundle, Sunspoke Yard token, Fern Viaduct tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `leafrail_vendor_01` at `leafrail_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| leafrail_dungeon_room_01 | The Viaduct Bloom Jam: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: leafrail_species_01, leafrail_species_02; elite: none |   |
| leafrail_dungeon_room_02 | The Viaduct Bloom Jam: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: leafrail_species_03, leafrail_species_04; elite: none |   |
| leafrail_dungeon_room_03 | The Viaduct Bloom Jam: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: leafrail_species_05, leafrail_species_06; elite: leafrail_species_09 |   |
| leafrail_dungeon_room_04 | The Viaduct Bloom Jam: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: leafrail_species_07, leafrail_species_08; elite: none | checkpoint  |
| leafrail_dungeon_room_05 | The Viaduct Bloom Jam: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: leafrail_species_09, leafrail_species_10; elite: none |  boss: leafrail_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`leafrail_trap_01`), jammed latch (`leafrail_trap_02`), wet threshold (`leafrail_trap_03`), false shelf (`leafrail_trap_04`), quiet bell (`leafrail_trap_05`), sealed drawer (`leafrail_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Dawn Depot Lightshare** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| leafrail_talent_01 | Leafrail Local Ear | 1 | none | leafrail_effect_01 |
| leafrail_talent_02 | Leafrail Careful Hand | 2 | none | leafrail_effect_02 |
| leafrail_talent_03 | Leafrail Route Sense | 3 | none | leafrail_effect_03 |
| leafrail_talent_04 | Leafrail Shared Measure | 4 | none | leafrail_effect_04 |
| leafrail_talent_05 | Leafrail Quiet Craft | 1 | leafrail_talent_04 | leafrail_effect_05 |
| leafrail_talent_06 | Leafrail Open Invitation | 2 | none | leafrail_effect_06 |
| leafrail_talent_07 | Leafrail Safe Return | 3 | none | leafrail_effect_07 |
| leafrail_talent_08 | Leafrail Field Note | 4 | none | leafrail_effect_08 |
| leafrail_talent_09 | Leafrail Steady Pace | 1 | leafrail_talent_08 | leafrail_effect_09 |
| leafrail_talent_10 | Leafrail Clear Signal | 2 | none | leafrail_effect_10 |
| leafrail_talent_11 | Leafrail Warm Welcome | 3 | none | leafrail_effect_11 |
| leafrail_talent_12 | Leafrail Small Courage | 4 | none | leafrail_effect_12 |
| leafrail_talent_13 | Leafrail Repair Habit | 1 | leafrail_talent_12 | leafrail_effect_13 |
| leafrail_talent_14 | Leafrail Trust Mark | 2 | none | leafrail_effect_14 |
| leafrail_talent_15 | Leafrail Second Look | 3 | none | leafrail_effect_15 |
| leafrail_talent_16 | Leafrail Closing Grace | 4 | none | leafrail_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| leafrail_contract_01 | Leafrail Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| leafrail_contract_02 | Leafrail Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| leafrail_contract_03 | Leafrail Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| leafrail_contract_04 | Leafrail Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| leafrail_contract_05 | Leafrail Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| leafrail_contract_06 | Leafrail Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| leafrail_contract_07 | Leafrail Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| leafrail_contract_08 | Leafrail Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| leafrail_interact_01 | Canopy Terminal bench | rest | leafrail_place_01 |
| leafrail_interact_02 | Glass Orchard cabinet | repair | leafrail_place_02 |
| leafrail_interact_03 | Sunspoke Yard rack | tend | leafrail_place_03 |
| leafrail_interact_04 | Fern Viaduct kettle | craft | leafrail_place_04 |
| leafrail_interact_05 | Lattice Commons ledger | cook | leafrail_place_05 |
| leafrail_interact_06 | Dawn Depot rail | bind_inn | leafrail_place_06 |
| leafrail_interact_07 | Moss Platform bell | inspect | leafrail_place_07 |
| leafrail_interact_08 | Apricot Switch board | open | leafrail_place_08 |
| leafrail_interact_09 | Canopy Terminal table | carry | leafrail_place_01 |
| leafrail_interact_10 | Glass Orchard lamp | clean | leafrail_place_02 |
| leafrail_interact_11 | Sunspoke Yard gate | signal | leafrail_place_03 |
| leafrail_interact_12 | Fern Viaduct shelf | record | leafrail_place_04 |


**Default interior graph.** `leafrail_interior_01` enters from `leafrail_place_08` and contains 7 connected rooms: Leafrail Entry, Leafrail Main Room, Leafrail Work Nook, Leafrail Window Room, Leafrail Quiet Room, Leafrail Storage, Leafrail Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | canopy, glass, sunspoke, fern materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Leafrail` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use bright practical language and invite repair before complaint. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Leafrail: distant work, a room tone, a gentle rhythm that belongs to Canopy Terminal, and a second layer that makes the route toward Dawn Depot feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Leafrail Ledger |
| 2 | Leafrail Route |
| 3 | Leafrail Work |
| 4 | Leafrail Talk |
| 5 | Leafrail Kit |
| 6 | Leafrail Pack |
| 7 | Leafrail Rest |
| 8 | Leafrail Safety |
| 9 | Leafrail Map |
| 10 | Leafrail Notice |
| 11 | Leafrail Favour |
| 12 | Leafrail Gold |
| 13 | Leafrail Token |
| 14 | Leafrail Record |
| 15 | Leafrail Instance |
| 16 | Leafrail Checkpoint |
| 17 | Leafrail Choice |
| 18 | Leafrail Help |
| 19 | Leafrail Calendar |
| 20 | Leafrail Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Canopy Terminal, a small promise has your name on it. |
| 2 | At Glass Orchard, a small promise has your name on it. |
| 3 | At Sunspoke Yard, a small promise has your name on it. |
| 4 | At Fern Viaduct, a small promise has your name on it. |
| 5 | At Lattice Commons, a small promise has your name on it. |
| 6 | At Dawn Depot, a small promise has your name on it. |
| 7 | At Moss Platform, a small promise has your name on it. |
| 8 | At Apricot Switch, a small promise has your name on it. |
| 9 | At Canopy Terminal, a small promise has your name on it. |
| 10 | At Glass Orchard, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is solarpunk rail-garden cooperative. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
