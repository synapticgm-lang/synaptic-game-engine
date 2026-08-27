# WOF First Clay: Full Start-Depth Pack

> **Release truth.** First Clay is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `first_clay` |
| Display name | **First Clay** |
| One-line pitch | Original river, hill, and star cultures in mythic antiquity. |
| Maturity | **teen** |
| rulesModuleId | `hp_check` |
| Theme Kit | **First Clay Theme Kit**, included with world entitlement |
| Genre pattern and fence | Original river, hill, and star cultures in mythic antiquity. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

First Clay is a WOF text world about original river, hill, and star cultures in mythic antiquity. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Ancient Greece named place |
| 2 | Ancient Egypt hero silhouette |
| 3 | Rome logo geometry |
| 4 | Assassins Creed Origins catchphrase |
| 5 | Percy Jackson signature costume |
| 6 | Hades game proprietary creature |
| 7 | Troy film map layout |
| 8 | Mummy film faction title |
| 9 | Mesopotamia reconstruction weapon profile |
| 10 | Silk Road history UI chrome |
| 11 | Ancient Greece quest premise |
| 12 | Ancient Egypt title typography |
| 13 | Rome color-coded insignia |
| 14 | Assassins Creed Origins music motif |
| 15 | Percy Jackson vehicle or mount profile |
| 16 | Hades game companion anatomy |
| 17 | Troy film named artifact |
| 18 | Mummy film school or agency badge |
| 19 | Mesopotamia reconstruction real sacred practice as minigame |
| 20 | Silk Road history stereotyped cultural shorthand |
| 21 | Ancient Greece real-person likeness |
| 22 | Ancient Egypt copied dialogue cadence |
| 23 | Rome fan-server slogan |
| 24 | Assassins Creed Origins paid power framing |
| 25 | Percy Jackson loot-box presentation |
| 26 | Hades game named place |
| 27 | Troy film hero silhouette |
| 28 | Mummy film logo geometry |
| 29 | Mesopotamia reconstruction catchphrase |
| 30 | Silk Road history signature costume |
| 31 | Ancient Greece proprietary creature |
| 32 | Ancient Egypt map layout |
| 33 | Rome faction title |
| 34 | Assassins Creed Origins weapon profile |
| 35 | Percy Jackson UI chrome |
| 36 | Hades game quest premise |
| 37 | Troy film title typography |
| 38 | Mummy film color-coded insignia |
| 39 | Mesopotamia reconstruction music motif |
| 40 | Silk Road history vehicle or mount profile |
| 41 | Ancient Greece companion anatomy |
| 42 | Ancient Egypt named artifact |
| 43 | Rome school or agency badge |
| 44 | Assassins Creed Origins real sacred practice as minigame |
| 45 | Percy Jackson stereotyped cultural shorthand |
| 46 | Hades game real-person likeness |
| 47 | Troy film copied dialogue cadence |
| 48 | Mummy film fan-server slogan |
| 49 | Mesopotamia reconstruction paid power framing |
| 50 | Silk Road history loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `first_clay_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] First Clay • {{turn}} • committed |
| 2 | [Route] First Clay • {{placeId}} • committed |
| 3 | [Work] First Clay • {{lastAction}} • committed |
| 4 | [Talk] First Clay • {{npcId}} • committed |
| 5 | [Kit] First Clay • {{kitId}} • committed |
| 6 | [Pack] First Clay • {{partySize}} • committed |
| 7 | [Rest] First Clay • {{checkpoint}} • committed |
| 8 | [Safety] First Clay • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| first_clay_kit_01 | River Measure | river measure workwear | practice river measure | Never use river measure authority to remove another person’s choice. | Use the local rhythm of First Clay and make every offer concrete. | river_measure mantle; river_measure tool; first_clay_map_01 | first_clay_place_01; first_clay_q_01 | first_clay_ability_01 |
| first_clay_kit_02 | Hill Envoy | hill envoy workwear | practice hill envoy | Never use hill envoy authority to remove another person’s choice. | Use the local rhythm of First Clay and make every offer concrete. | hill_envoy vest; hill_envoy tool; first_clay_map_02 | first_clay_place_02; first_clay_q_02 | first_clay_ability_02 |
| first_clay_kit_03 | Star Kilnwright | star kilnwright workwear | practice star kilnwright | Never use star kilnwright authority to remove another person’s choice. | Use the local rhythm of First Clay and make every offer concrete. | star_kilnwright jacket; star_kilnwright tool; first_clay_map_03 | first_clay_place_01; first_clay_q_03 | first_clay_ability_03 |
| first_clay_kit_04 | Caravan Listener | caravan listener workwear | practice caravan listener | Never use caravan listener authority to remove another person’s choice. | Use the local rhythm of First Clay and make every offer concrete. | caravan_listener sash; caravan_listener tool; first_clay_map_04 | first_clay_place_02; first_clay_q_04 | first_clay_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `first_clay_place_01` is a shared hub rather than a capital analogue; `first_clay_place_04` is the mid-join; `first_clay_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| first_clay_place_01 | Clay Harbor | shared hub | street | safe | yes | first_clay_place_02, first_clay_place_04 | A public notice at Clay Harbor has been posted with one crucial line washed away. |
| first_clay_place_02 | Sun Court | start hub | street | safe | yes | first_clay_place_01, first_clay_place_03 | A work roster at Sun Court leaves two neighbours believing they were promised the same task. |
| first_clay_place_03 | Reed Archive | street route | street | safe | yes | first_clay_place_02, first_clay_place_04 | A route marker at Reed Archive points visitors toward a closed gate and needs a safe correction. |
| first_clay_place_04 | Star Kiln | mid join | street | low | yes | first_clay_place_03, first_clay_place_05, first_clay_place_01 | A newcomer at Star Kiln needs a local introduction before a small obligation becomes embarrassing. |
| first_clay_place_05 | Caravan Fold | work district | interior | low | no | first_clay_place_04, first_clay_place_06 | A shared tool at Caravan Fold has been returned without its care tag. |
| first_clay_place_06 | Hill Ladder | instance door | dungeon | medium | no | first_clay_place_05, first_clay_place_07 | The entry record at Hill Ladder names an unfinished errand, not a monster or apocalypse. |
| first_clay_place_07 | River Mirror | wild edge | street | medium | yes | first_clay_place_06, first_clay_place_08 | A weather change at River Mirror threatens a community plan unless someone reads the signs. |
| first_clay_place_08 | Night Granary | housing approach | interior | low | no | first_clay_place_07 | A resident at Night Granary has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| first_clay_npc_01 | Alden Vane | first_clay_place_01 | quest | Alden Vane says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Clay Harbor: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_02 | Bryn Quill | first_clay_place_02 | profession | Bryn Quill says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Sun Court: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_03 | Cato Vale | first_clay_place_03 | hub | Cato Vale says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Reed Archive: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_04 | Dessa Wren | first_clay_place_04 | merchant | Dessa Wren says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Star Kiln: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_05 | Eris Morrow | first_clay_place_01 | local | Eris Morrow says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Clay Harbor: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_06 | Fenn Rowan | first_clay_place_02 | host | Fenn Rowan says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Sun Court: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_07 | Gala Nook | first_clay_place_03 | quest | Gala Nook says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Reed Archive: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_08 | Holl Cress | first_clay_place_04 | profession | Holl Cress says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Star Kiln: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_09 | Ivo Silt | first_clay_place_01 | local | Ivo Silt says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Clay Harbor: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| first_clay_npc_10 | Jori Pryce | first_clay_place_02 | merchant | Jori Pryce says, ‘First Clay keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Sun Court: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Star Kiln, if that is useful. |
| 2 | First Clay feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Hill Ladder. |
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
| River Measure | At Clay Harbor, you arrive in river_measure mantle carrying first_clay_map_01. A small obligation is already late. | Give up one turn to help now. | First Clay: Name a Working Promise |
| Hill Envoy | At Sun Court, you arrive in hill_envoy vest carrying first_clay_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | First Clay: Set the First Tool Aside |
| Star Kilnwright | At Clay Harbor, you arrive in star_kilnwright jacket carrying first_clay_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | First Clay: Carry the Right Record |
| Caravan Listener | At Sun Court, you arrive in caravan_listener sash carrying first_clay_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | First Clay: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_first_clay_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Clay Harbor’s small mismatch | ask | missing tag | A local need at Star Kiln is connected but not catastrophic. | alternate talk |
| 2 | Resolve Sun Court’s small mismatch | repair | closed path | A local need at Caravan Fold is connected but not catastrophic. | new route |
| 3 | Resolve Reed Archive’s small mismatch | carry | unclear note | A local need at Hill Ladder is connected but not catastrophic. | recorded favor |
| 4 | Resolve Star Kiln’s small mismatch | listen | late guest | A local need at River Mirror is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Caravan Fold’s small mismatch | map | wet weather | A local need at Night Granary is connected but not catastrophic. | slower reward |
| 6 | Resolve Hill Ladder’s small mismatch | prepare | busy shift | A local need at Clay Harbor is connected but not catastrophic. | safer shortcut |
| 7 | Resolve River Mirror’s small mismatch | wait | quiet boundary | A local need at Sun Court is connected but not catastrophic. | solo option |
| 8 | Resolve Night Granary’s small mismatch | return | wrong room | A local need at Reed Archive is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Star Kiln Accord` and `Caravan Fold Assembly`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| first_clay_q_01 | First Clay: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| first_clay_q_02 | First Clay: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| first_clay_q_03 | First Clay: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| first_clay_q_04 | First Clay: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| first_clay_q_05 | First Clay: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| first_clay_q_06 | First Clay: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| first_clay_q_07 | First Clay: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| first_clay_q_08 | First Clay: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| first_clay_q_09 | First Clay: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| first_clay_q_10 | First Clay: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| first_clay_q_11 | First Clay: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| first_clay_q_12 | First Clay: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| first_clay_q_13 | First Clay: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| first_clay_q_14 | First Clay: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| first_clay_q_15 | First Clay: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| first_clay_q_16 | First Clay: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| first_clay_q_17 | First Clay: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| first_clay_q_18 | First Clay: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| first_clay_q_19 | First Clay: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| first_clay_q_20 | First Clay: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| first_clay_q_21 | First Clay: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| first_clay_q_22 | First Clay: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| first_clay_q_23 | First Clay: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| first_clay_q_24 | First Clay: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| first_clay_q_25 | First Clay: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Clay Harbor`: write `first_clay_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Star Kiln`: write `first_clay_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `first_clay_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| first_clay_species_01 | Clay Ibis | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_02 | Sun Ram | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_03 | River Lion | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_04 | Star Tortoise | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_05 | First Clay Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_06 | First Clay Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_07 | First Clay Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_08 | First Clay Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_09 | First Clay Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_10 | First Clay Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_11 | First Clay Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_12 | First Clay Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_13 | First Clay Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_14 | First Clay Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_15 | First Clay Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_16 | First Clay Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_17 | First Clay Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| first_clay_species_18 | First Clay Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Clay Shells**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Star Tesserae**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Clay Harbor token, Sun Court tool, Reed Archive thread, Star Kiln seal, Caravan Fold bundle, Hill Ladder token. |
| Instance and cosmetic templates | River Mirror tool, Night Granary thread, Clay Harbor seal, Sun Court bundle, Reed Archive token, Star Kiln tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `first_clay_vendor_01` at `first_clay_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| first_clay_dungeon_room_01 | The Star Kiln Accord: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: first_clay_species_01, first_clay_species_02; elite: none |   |
| first_clay_dungeon_room_02 | The Star Kiln Accord: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: first_clay_species_03, first_clay_species_04; elite: none |   |
| first_clay_dungeon_room_03 | The Star Kiln Accord: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: first_clay_species_05, first_clay_species_06; elite: first_clay_species_09 |   |
| first_clay_dungeon_room_04 | The Star Kiln Accord: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: first_clay_species_07, first_clay_species_08; elite: none | checkpoint  |
| first_clay_dungeon_room_05 | The Star Kiln Accord: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: first_clay_species_09, first_clay_species_10; elite: none |  boss: first_clay_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`first_clay_trap_01`), jammed latch (`first_clay_trap_02`), wet threshold (`first_clay_trap_03`), false shelf (`first_clay_trap_04`), quiet bell (`first_clay_trap_05`), sealed drawer (`first_clay_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Caravan Fold Assembly** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| first_clay_talent_01 | First Clay Local Ear | 1 | none | first_clay_effect_01 |
| first_clay_talent_02 | First Clay Careful Hand | 2 | none | first_clay_effect_02 |
| first_clay_talent_03 | First Clay Route Sense | 3 | none | first_clay_effect_03 |
| first_clay_talent_04 | First Clay Shared Measure | 4 | none | first_clay_effect_04 |
| first_clay_talent_05 | First Clay Quiet Craft | 1 | first_clay_talent_04 | first_clay_effect_05 |
| first_clay_talent_06 | First Clay Open Invitation | 2 | none | first_clay_effect_06 |
| first_clay_talent_07 | First Clay Safe Return | 3 | none | first_clay_effect_07 |
| first_clay_talent_08 | First Clay Field Note | 4 | none | first_clay_effect_08 |
| first_clay_talent_09 | First Clay Steady Pace | 1 | first_clay_talent_08 | first_clay_effect_09 |
| first_clay_talent_10 | First Clay Clear Signal | 2 | none | first_clay_effect_10 |
| first_clay_talent_11 | First Clay Warm Welcome | 3 | none | first_clay_effect_11 |
| first_clay_talent_12 | First Clay Small Courage | 4 | none | first_clay_effect_12 |
| first_clay_talent_13 | First Clay Repair Habit | 1 | first_clay_talent_12 | first_clay_effect_13 |
| first_clay_talent_14 | First Clay Trust Mark | 2 | none | first_clay_effect_14 |
| first_clay_talent_15 | First Clay Second Look | 3 | none | first_clay_effect_15 |
| first_clay_talent_16 | First Clay Closing Grace | 4 | none | first_clay_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| first_clay_contract_01 | First Clay Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| first_clay_contract_02 | First Clay Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| first_clay_contract_03 | First Clay Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| first_clay_contract_04 | First Clay Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| first_clay_contract_05 | First Clay Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| first_clay_contract_06 | First Clay Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| first_clay_contract_07 | First Clay Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| first_clay_contract_08 | First Clay Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| first_clay_interact_01 | Clay Harbor bench | rest | first_clay_place_01 |
| first_clay_interact_02 | Sun Court cabinet | repair | first_clay_place_02 |
| first_clay_interact_03 | Reed Archive rack | tend | first_clay_place_03 |
| first_clay_interact_04 | Star Kiln kettle | craft | first_clay_place_04 |
| first_clay_interact_05 | Caravan Fold ledger | cook | first_clay_place_05 |
| first_clay_interact_06 | Hill Ladder rail | bind_inn | first_clay_place_06 |
| first_clay_interact_07 | River Mirror bell | inspect | first_clay_place_07 |
| first_clay_interact_08 | Night Granary board | open | first_clay_place_08 |
| first_clay_interact_09 | Clay Harbor table | carry | first_clay_place_01 |
| first_clay_interact_10 | Sun Court lamp | clean | first_clay_place_02 |
| first_clay_interact_11 | Reed Archive gate | signal | first_clay_place_03 |
| first_clay_interact_12 | Star Kiln shelf | record | first_clay_place_04 |


**Default interior graph.** `first_clay_interior_01` enters from `first_clay_place_08` and contains 7 connected rooms: First Clay Entry, First Clay Main Room, First Clay Work Nook, First Clay Window Room, First Clay Quiet Room, First Clay Storage, First Clay Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | clay, sun, reed, star materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `First Clay` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of First Clay and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of First Clay: distant work, a room tone, a gentle rhythm that belongs to Clay Harbor, and a second layer that makes the route toward Hill Ladder feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | First Clay Ledger |
| 2 | First Clay Route |
| 3 | First Clay Work |
| 4 | First Clay Talk |
| 5 | First Clay Kit |
| 6 | First Clay Pack |
| 7 | First Clay Rest |
| 8 | First Clay Safety |
| 9 | First Clay Map |
| 10 | First Clay Notice |
| 11 | First Clay Favour |
| 12 | First Clay Gold |
| 13 | First Clay Token |
| 14 | First Clay Record |
| 15 | First Clay Instance |
| 16 | First Clay Checkpoint |
| 17 | First Clay Choice |
| 18 | First Clay Help |
| 19 | First Clay Calendar |
| 20 | First Clay Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Clay Harbor, a small promise has your name on it. |
| 2 | At Sun Court, a small promise has your name on it. |
| 3 | At Reed Archive, a small promise has your name on it. |
| 4 | At Star Kiln, a small promise has your name on it. |
| 5 | At Caravan Fold, a small promise has your name on it. |
| 6 | At Hill Ladder, a small promise has your name on it. |
| 7 | At River Mirror, a small promise has your name on it. |
| 8 | At Night Granary, a small promise has your name on it. |
| 9 | At Clay Harbor, a small promise has your name on it. |
| 10 | At Sun Court, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is original river, hill, and star cultures in mythic antiquity. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
