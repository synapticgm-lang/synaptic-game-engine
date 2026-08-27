# WOF Redline Hour: Full Start-Depth Pack

> **Release truth.** Redline Hour is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `redline_hour` |
| Display name | **Redline Hour** |
| One-line pitch | Closed-course time trials and clean racing. |
| Maturity | **all-ages** |
| rulesModuleId | `lap_time` |
| Theme Kit | **Redline Hour Theme Kit**, included with world entitlement |
| Genre pattern and fence | Closed-course time trials and clean racing. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Redline Hour is a WOF text world about closed-course time trials and clean racing. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Mario Kart named place |
| 2 | Need for Speed hero silhouette |
| 3 | Forza logo geometry |
| 4 | Gran Turismo catchphrase |
| 5 | Cars Pixar signature costume |
| 6 | F1 proprietary creature |
| 7 | Initial D map layout |
| 8 | Fast and Furious faction title |
| 9 | Trackmania weapon profile |
| 10 | Wipeout UI chrome |
| 11 | Mario Kart quest premise |
| 12 | Need for Speed title typography |
| 13 | Forza color-coded insignia |
| 14 | Gran Turismo music motif |
| 15 | Cars Pixar vehicle or mount profile |
| 16 | F1 companion anatomy |
| 17 | Initial D named artifact |
| 18 | Fast and Furious school or agency badge |
| 19 | Trackmania real sacred practice as minigame |
| 20 | Wipeout stereotyped cultural shorthand |
| 21 | Mario Kart real-person likeness |
| 22 | Need for Speed copied dialogue cadence |
| 23 | Forza fan-server slogan |
| 24 | Gran Turismo paid power framing |
| 25 | Cars Pixar loot-box presentation |
| 26 | F1 named place |
| 27 | Initial D hero silhouette |
| 28 | Fast and Furious logo geometry |
| 29 | Trackmania catchphrase |
| 30 | Wipeout signature costume |
| 31 | Mario Kart proprietary creature |
| 32 | Need for Speed map layout |
| 33 | Forza faction title |
| 34 | Gran Turismo weapon profile |
| 35 | Cars Pixar UI chrome |
| 36 | F1 quest premise |
| 37 | Initial D title typography |
| 38 | Fast and Furious color-coded insignia |
| 39 | Trackmania music motif |
| 40 | Wipeout vehicle or mount profile |
| 41 | Mario Kart companion anatomy |
| 42 | Need for Speed named artifact |
| 43 | Forza school or agency badge |
| 44 | Gran Turismo real sacred practice as minigame |
| 45 | Cars Pixar stereotyped cultural shorthand |
| 46 | F1 real-person likeness |
| 47 | Initial D copied dialogue cadence |
| 48 | Fast and Furious fan-server slogan |
| 49 | Trackmania paid power framing |
| 50 | Wipeout loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | speed, grip, boost, lapTimeMs, sector, cleanMarks, tune, focus |
| Wipe and checkpoint | Wipe returns the party to `redline_hour_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, lap time values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Redline Hour • {{turn}} • committed |
| 2 | [Route] Redline Hour • {{placeId}} • committed |
| 3 | [Work] Redline Hour • {{lastAction}} • committed |
| 4 | [Talk] Redline Hour • {{npcId}} • committed |
| 5 | [Kit] Redline Hour • {{kitId}} • committed |
| 6 | [Pack] Redline Hour • {{partySize}} • committed |
| 7 | [Rest] Redline Hour • {{checkpoint}} • committed |
| 8 | [Safety] Redline Hour • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| redline_hour_kit_01 | Apex Caller | apex caller workwear | practice apex caller | Never use apex caller authority to remove another person’s choice. | Use the local rhythm of Redline Hour and make every offer concrete. | apex_caller mantle; apex_caller tool; redline_hour_map_01 | redline_hour_place_01; redline_hour_q_01 | redline_hour_ability_01 |
| redline_hour_kit_02 | Rain Tyrewright | rain tyrewright workwear | practice rain tyrewright | Never use rain tyrewright authority to remove another person’s choice. | Use the local rhythm of Redline Hour and make every offer concrete. | rain_tyrewright vest; rain_tyrewright tool; redline_hour_map_02 | redline_hour_place_02; redline_hour_q_02 | redline_hour_ability_02 |
| redline_hour_kit_03 | Sector Marshal | sector marshal workwear | practice sector marshal | Never use sector marshal authority to remove another person’s choice. | Use the local rhythm of Redline Hour and make every offer concrete. | sector_marshal jacket; sector_marshal tool; redline_hour_map_03 | redline_hour_place_01; redline_hour_q_03 | redline_hour_ability_03 |
| redline_hour_kit_04 | Garage Listener | garage listener workwear | practice garage listener | Never use garage listener authority to remove another person’s choice. | Use the local rhythm of Redline Hour and make every offer concrete. | garage_listener sash; garage_listener tool; redline_hour_map_04 | redline_hour_place_02; redline_hour_q_04 | redline_hour_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `redline_hour_place_01` is a shared hub rather than a capital analogue; `redline_hour_place_04` is the mid-join; `redline_hour_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| redline_hour_place_01 | Starter Bay | shared hub | street | safe | yes | redline_hour_place_02, redline_hour_place_04 | A public notice at Starter Bay has been posted with one crucial line washed away. |
| redline_hour_place_02 | Copper Loop | start hub | street | safe | yes | redline_hour_place_01, redline_hour_place_03 | A work roster at Copper Loop leaves two neighbours believing they were promised the same task. |
| redline_hour_place_03 | Rain Circuit | street route | street | safe | yes | redline_hour_place_02, redline_hour_place_04 | A route marker at Rain Circuit points visitors toward a closed gate and needs a safe correction. |
| redline_hour_place_04 | Hourglass Garage | mid join | street | low | yes | redline_hour_place_03, redline_hour_place_05, redline_hour_place_01 | A newcomer at Hourglass Garage needs a local introduction before a small obligation becomes embarrassing. |
| redline_hour_place_05 | Switchback Shed | work district | interior | low | no | redline_hour_place_04, redline_hour_place_06 | A shared tool at Switchback Shed has been returned without its care tag. |
| redline_hour_place_06 | Marble Apex | instance door | dungeon | medium | no | redline_hour_place_05, redline_hour_place_07 | The entry record at Marble Apex names an unfinished errand, not a monster or apocalypse. |
| redline_hour_place_07 | Wind Tunnel | wild edge | street | medium | yes | redline_hour_place_06, redline_hour_place_08 | A weather change at Wind Tunnel threatens a community plan unless someone reads the signs. |
| redline_hour_place_08 | Finish Green | housing approach | interior | low | no | redline_hour_place_07 | A resident at Finish Green has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| redline_hour_npc_01 | Cato Morrow | redline_hour_place_01 | quest | Cato Morrow says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Cato Morrow offers a specific task at Starter Bay: settle the practical mismatch before it costs someone a shift. | Cato Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_02 | Dessa Rowan | redline_hour_place_02 | profession | Dessa Rowan says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Dessa Rowan offers a specific task at Copper Loop: settle the practical mismatch before it costs someone a shift. | Dessa Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_03 | Eris Nook | redline_hour_place_03 | hub | Eris Nook says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Eris Nook offers a specific task at Rain Circuit: settle the practical mismatch before it costs someone a shift. | Eris Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_04 | Fenn Cress | redline_hour_place_04 | merchant | Fenn Cress says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Fenn Cress offers a specific task at Hourglass Garage: settle the practical mismatch before it costs someone a shift. | Fenn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_05 | Gala Silt | redline_hour_place_01 | local | Gala Silt says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Gala Silt offers a specific task at Starter Bay: settle the practical mismatch before it costs someone a shift. | Gala Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_06 | Holl Pryce | redline_hour_place_02 | host | Holl Pryce says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Holl Pryce offers a specific task at Copper Loop: settle the practical mismatch before it costs someone a shift. | Holl Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_07 | Ivo Vane | redline_hour_place_03 | quest | Ivo Vane says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vane offers a specific task at Rain Circuit: settle the practical mismatch before it costs someone a shift. | Ivo Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_08 | Jori Quill | redline_hour_place_04 | profession | Jori Quill says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Jori Quill offers a specific task at Hourglass Garage: settle the practical mismatch before it costs someone a shift. | Jori Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_09 | Alden Vale | redline_hour_place_01 | local | Alden Vale says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Alden Vale offers a specific task at Starter Bay: settle the practical mismatch before it costs someone a shift. | Alden Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| redline_hour_npc_10 | Bryn Wren | redline_hour_place_02 | merchant | Bryn Wren says, ‘Redline Hour keeps its promises in small places. Tell me which one you noticed.’ | Bryn Wren offers a specific task at Copper Loop: settle the practical mismatch before it costs someone a shift. | Bryn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Hourglass Garage, if that is useful. |
| 2 | Redline Hour feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Marble Apex. |
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
| Apex Caller | At Starter Bay, you arrive in apex_caller mantle carrying redline_hour_map_01. A small obligation is already late. | Give up one turn to help now. | Redline Hour: Name a Working Promise |
| Rain Tyrewright | At Copper Loop, you arrive in rain_tyrewright vest carrying redline_hour_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Redline Hour: Set the First Tool Aside |
| Sector Marshal | At Starter Bay, you arrive in sector_marshal jacket carrying redline_hour_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Redline Hour: Carry the Right Record |
| Garage Listener | At Copper Loop, you arrive in garage_listener sash carrying redline_hour_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Redline Hour: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_redline_hour_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Starter Bay’s small mismatch | ask | missing tag | A local need at Hourglass Garage is connected but not catastrophic. | alternate talk |
| 2 | Resolve Copper Loop’s small mismatch | repair | closed path | A local need at Switchback Shed is connected but not catastrophic. | new route |
| 3 | Resolve Rain Circuit’s small mismatch | carry | unclear note | A local need at Marble Apex is connected but not catastrophic. | recorded favor |
| 4 | Resolve Hourglass Garage’s small mismatch | listen | late guest | A local need at Wind Tunnel is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Switchback Shed’s small mismatch | map | wet weather | A local need at Finish Green is connected but not catastrophic. | slower reward |
| 6 | Resolve Marble Apex’s small mismatch | prepare | busy shift | A local need at Starter Bay is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Wind Tunnel’s small mismatch | wait | quiet boundary | A local need at Copper Loop is connected but not catastrophic. | solo option |
| 8 | Resolve Finish Green’s small mismatch | return | wrong room | A local need at Rain Circuit is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Copper Loop Relay` and `Hourglass Night Run`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| redline_hour_q_01 | Redline Hour: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| redline_hour_q_02 | Redline Hour: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| redline_hour_q_03 | Redline Hour: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| redline_hour_q_04 | Redline Hour: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| redline_hour_q_05 | Redline Hour: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| redline_hour_q_06 | Redline Hour: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| redline_hour_q_07 | Redline Hour: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| redline_hour_q_08 | Redline Hour: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| redline_hour_q_09 | Redline Hour: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| redline_hour_q_10 | Redline Hour: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| redline_hour_q_11 | Redline Hour: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| redline_hour_q_12 | Redline Hour: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| redline_hour_q_13 | Redline Hour: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| redline_hour_q_14 | Redline Hour: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| redline_hour_q_15 | Redline Hour: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| redline_hour_q_16 | Redline Hour: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| redline_hour_q_17 | Redline Hour: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| redline_hour_q_18 | Redline Hour: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| redline_hour_q_19 | Redline Hour: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| redline_hour_q_20 | Redline Hour: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| redline_hour_q_21 | Redline Hour: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| redline_hour_q_22 | Redline Hour: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| redline_hour_q_23 | Redline Hour: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| redline_hour_q_24 | Redline Hour: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| redline_hour_q_25 | Redline Hour: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Starter Bay`: write `redline_hour_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Hourglass Garage`: write `redline_hour_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `redline_hour_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| redline_hour_species_01 | Spark Hare | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_02 | Brake Beetle | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_03 | Sprint Gull | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_04 | Paddock Dog | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_05 | Redline Hour Field Type 5 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_06 | Redline Hour Field Type 6 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_07 | Redline Hour Field Type 7 | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_08 | Redline Hour Field Type 8 | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_09 | Redline Hour Field Type 9 | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_10 | Redline Hour Field Type 10 | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_11 | Redline Hour Field Type 11 | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_12 | Redline Hour Field Type 12 | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_13 | Redline Hour Field Type 13 | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_14 | Redline Hour Field Type 14 | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_15 | Redline Hour Field Type 15 | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_16 | Redline Hour Field Type 16 | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_17 | Redline Hour Field Type 17 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| redline_hour_species_18 | Redline Hour Field Type 18 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Lap Credits**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Flag Stitches**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Starter Bay token, Copper Loop tool, Rain Circuit thread, Hourglass Garage seal, Switchback Shed bundle, Marble Apex token. |
| Instance and cosmetic templates | Wind Tunnel tool, Finish Green thread, Starter Bay seal, Copper Loop bundle, Rain Circuit token, Hourglass Garage tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `redline_hour_vendor_01` at `redline_hour_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| redline_hour_dungeon_room_01 | The Copper Loop Relay: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: redline_hour_species_01, redline_hour_species_02; elite: none |   |
| redline_hour_dungeon_room_02 | The Copper Loop Relay: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: redline_hour_species_03, redline_hour_species_04; elite: none |   |
| redline_hour_dungeon_room_03 | The Copper Loop Relay: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: redline_hour_species_05, redline_hour_species_06; elite: redline_hour_species_09 |   |
| redline_hour_dungeon_room_04 | The Copper Loop Relay: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: redline_hour_species_07, redline_hour_species_08; elite: none | checkpoint  |
| redline_hour_dungeon_room_05 | The Copper Loop Relay: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: redline_hour_species_09, redline_hour_species_10; elite: none |  boss: redline_hour_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`redline_hour_trap_01`), jammed latch (`redline_hour_trap_02`), wet threshold (`redline_hour_trap_03`), false shelf (`redline_hour_trap_04`), quiet bell (`redline_hour_trap_05`), sealed drawer (`redline_hour_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Hourglass Night Run** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| redline_hour_talent_01 | Redline Hour Local Ear | 1 | none | redline_hour_effect_01 |
| redline_hour_talent_02 | Redline Hour Careful Hand | 2 | none | redline_hour_effect_02 |
| redline_hour_talent_03 | Redline Hour Route Sense | 3 | none | redline_hour_effect_03 |
| redline_hour_talent_04 | Redline Hour Shared Measure | 4 | none | redline_hour_effect_04 |
| redline_hour_talent_05 | Redline Hour Quiet Craft | 1 | redline_hour_talent_04 | redline_hour_effect_05 |
| redline_hour_talent_06 | Redline Hour Open Invitation | 2 | none | redline_hour_effect_06 |
| redline_hour_talent_07 | Redline Hour Safe Return | 3 | none | redline_hour_effect_07 |
| redline_hour_talent_08 | Redline Hour Field Note | 4 | none | redline_hour_effect_08 |
| redline_hour_talent_09 | Redline Hour Steady Pace | 1 | redline_hour_talent_08 | redline_hour_effect_09 |
| redline_hour_talent_10 | Redline Hour Clear Signal | 2 | none | redline_hour_effect_10 |
| redline_hour_talent_11 | Redline Hour Warm Welcome | 3 | none | redline_hour_effect_11 |
| redline_hour_talent_12 | Redline Hour Small Courage | 4 | none | redline_hour_effect_12 |
| redline_hour_talent_13 | Redline Hour Repair Habit | 1 | redline_hour_talent_12 | redline_hour_effect_13 |
| redline_hour_talent_14 | Redline Hour Trust Mark | 2 | none | redline_hour_effect_14 |
| redline_hour_talent_15 | Redline Hour Second Look | 3 | none | redline_hour_effect_15 |
| redline_hour_talent_16 | Redline Hour Closing Grace | 4 | none | redline_hour_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| redline_hour_contract_01 | Redline Hour Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| redline_hour_contract_02 | Redline Hour Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| redline_hour_contract_03 | Redline Hour Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| redline_hour_contract_04 | Redline Hour Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| redline_hour_contract_05 | Redline Hour Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| redline_hour_contract_06 | Redline Hour Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| redline_hour_contract_07 | Redline Hour Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| redline_hour_contract_08 | Redline Hour Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| redline_hour_interact_01 | Starter Bay bench | rest | redline_hour_place_01 |
| redline_hour_interact_02 | Copper Loop cabinet | repair | redline_hour_place_02 |
| redline_hour_interact_03 | Rain Circuit rack | tend | redline_hour_place_03 |
| redline_hour_interact_04 | Hourglass Garage kettle | craft | redline_hour_place_04 |
| redline_hour_interact_05 | Switchback Shed ledger | cook | redline_hour_place_05 |
| redline_hour_interact_06 | Marble Apex rail | bind_inn | redline_hour_place_06 |
| redline_hour_interact_07 | Wind Tunnel bell | inspect | redline_hour_place_07 |
| redline_hour_interact_08 | Finish Green board | open | redline_hour_place_08 |
| redline_hour_interact_09 | Starter Bay table | carry | redline_hour_place_01 |
| redline_hour_interact_10 | Copper Loop lamp | clean | redline_hour_place_02 |
| redline_hour_interact_11 | Rain Circuit gate | signal | redline_hour_place_03 |
| redline_hour_interact_12 | Hourglass Garage shelf | record | redline_hour_place_04 |


**Default interior graph.** `redline_hour_interior_01` enters from `redline_hour_place_08` and contains 7 connected rooms: Redline Hour Entry, Redline Hour Main Room, Redline Hour Work Nook, Redline Hour Window Room, Redline Hour Quiet Room, Redline Hour Storage, Redline Hour Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | starter, copper, rain, hourglass materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Redline Hour` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Redline Hour and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Redline Hour: distant work, a room tone, a gentle rhythm that belongs to Starter Bay, and a second layer that makes the route toward Marble Apex feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Redline Hour Ledger |
| 2 | Redline Hour Route |
| 3 | Redline Hour Work |
| 4 | Redline Hour Talk |
| 5 | Redline Hour Kit |
| 6 | Redline Hour Pack |
| 7 | Redline Hour Rest |
| 8 | Redline Hour Safety |
| 9 | Redline Hour Map |
| 10 | Redline Hour Notice |
| 11 | Redline Hour Favour |
| 12 | Redline Hour Gold |
| 13 | Redline Hour Token |
| 14 | Redline Hour Record |
| 15 | Redline Hour Instance |
| 16 | Redline Hour Checkpoint |
| 17 | Redline Hour Choice |
| 18 | Redline Hour Help |
| 19 | Redline Hour Calendar |
| 20 | Redline Hour Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Starter Bay, a small promise has your name on it. |
| 2 | At Copper Loop, a small promise has your name on it. |
| 3 | At Rain Circuit, a small promise has your name on it. |
| 4 | At Hourglass Garage, a small promise has your name on it. |
| 5 | At Switchback Shed, a small promise has your name on it. |
| 6 | At Marble Apex, a small promise has your name on it. |
| 7 | At Wind Tunnel, a small promise has your name on it. |
| 8 | At Finish Green, a small promise has your name on it. |
| 9 | At Starter Bay, a small promise has your name on it. |
| 10 | At Copper Loop, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is closed-course time trials and clean racing. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
