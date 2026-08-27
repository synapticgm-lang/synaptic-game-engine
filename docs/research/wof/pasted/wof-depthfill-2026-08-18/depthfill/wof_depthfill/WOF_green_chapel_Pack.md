# WOF Green Chapel: Full Start-Depth Pack

> **Release truth.** Green Chapel is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `green_chapel` |
| Display name | **Green Chapel** |
| One-line pitch | Original chapel-green questing, service, and measured vows. |
| Maturity | **teen** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Green Chapel Theme Kit**, included with world entitlement |
| Genre pattern and fence | Original chapel-green questing, service, and measured vows. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Green Chapel is a WOF text world about original chapel-green questing, service, and measured vows. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Camelot named place |
| 2 | Excalibur hero silhouette |
| 3 | Lancelot logo geometry |
| 4 | Merlin catchphrase |
| 5 | Round Table signature costume |
| 6 | King Arthur proprietary creature |
| 7 | Monty Python Holy Grail map layout |
| 8 | The Green Knight character faction title |
| 9 | Avalon weapon profile |
| 10 | Holy Grail UI chrome |
| 11 | Camelot quest premise |
| 12 | Excalibur title typography |
| 13 | Lancelot color-coded insignia |
| 14 | Merlin music motif |
| 15 | Round Table vehicle or mount profile |
| 16 | King Arthur companion anatomy |
| 17 | Monty Python Holy Grail named artifact |
| 18 | The Green Knight character school or agency badge |
| 19 | Avalon real sacred practice as minigame |
| 20 | Holy Grail stereotyped cultural shorthand |
| 21 | Camelot real-person likeness |
| 22 | Excalibur copied dialogue cadence |
| 23 | Lancelot fan-server slogan |
| 24 | Merlin paid power framing |
| 25 | Round Table loot-box presentation |
| 26 | King Arthur named place |
| 27 | Monty Python Holy Grail hero silhouette |
| 28 | The Green Knight character logo geometry |
| 29 | Avalon catchphrase |
| 30 | Holy Grail signature costume |
| 31 | Camelot proprietary creature |
| 32 | Excalibur map layout |
| 33 | Lancelot faction title |
| 34 | Merlin weapon profile |
| 35 | Round Table UI chrome |
| 36 | King Arthur quest premise |
| 37 | Monty Python Holy Grail title typography |
| 38 | The Green Knight character color-coded insignia |
| 39 | Avalon music motif |
| 40 | Holy Grail vehicle or mount profile |
| 41 | Camelot companion anatomy |
| 42 | Excalibur named artifact |
| 43 | Lancelot school or agency badge |
| 44 | Merlin real sacred practice as minigame |
| 45 | Round Table stereotyped cultural shorthand |
| 46 | King Arthur real-person likeness |
| 47 | Monty Python Holy Grail copied dialogue cadence |
| 48 | The Green Knight character fan-server slogan |
| 49 | Avalon paid power framing |
| 50 | Holy Grail loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `green_chapel_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Green Chapel • {{turn}} • committed |
| 2 | [Route] Green Chapel • {{placeId}} • committed |
| 3 | [Work] Green Chapel • {{lastAction}} • committed |
| 4 | [Talk] Green Chapel • {{npcId}} • committed |
| 5 | [Kit] Green Chapel • {{kitId}} • committed |
| 6 | [Pack] Green Chapel • {{partySize}} • committed |
| 7 | [Rest] Green Chapel • {{checkpoint}} • committed |
| 8 | [Safety] Green Chapel • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| green_chapel_kit_01 | Vow Gardener | vow gardener workwear | practice vow gardener | Never use vow gardener authority to remove another person’s choice. | Use the local rhythm of Green Chapel and make every offer concrete. | vow_gardener mantle; vow_gardener tool; green_chapel_map_01 | green_chapel_place_01; green_chapel_q_01 | green_chapel_ability_01 |
| green_chapel_kit_02 | Ford Keeper | ford keeper workwear | practice ford keeper | Never use ford keeper authority to remove another person’s choice. | Use the local rhythm of Green Chapel and make every offer concrete. | ford_keeper vest; ford_keeper tool; green_chapel_map_02 | green_chapel_place_02; green_chapel_q_02 | green_chapel_ability_02 |
| green_chapel_kit_03 | Bell Reeve | bell reeve workwear | practice bell reeve | Never use bell reeve authority to remove another person’s choice. | Use the local rhythm of Green Chapel and make every offer concrete. | bell_reeve jacket; bell_reeve tool; green_chapel_map_03 | green_chapel_place_01; green_chapel_q_03 | green_chapel_ability_03 |
| green_chapel_kit_04 | Green Pilgrim | green pilgrim workwear | practice green pilgrim | Never use green pilgrim authority to remove another person’s choice. | Use the local rhythm of Green Chapel and make every offer concrete. | green_pilgrim sash; green_pilgrim tool; green_chapel_map_04 | green_chapel_place_02; green_chapel_q_04 | green_chapel_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `green_chapel_place_01` is a shared hub rather than a capital analogue; `green_chapel_place_04` is the mid-join; `green_chapel_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| green_chapel_place_01 | Green Nave | shared hub | street | safe | yes | green_chapel_place_02, green_chapel_place_04 | A public notice at Green Nave has been posted with one crucial line washed away. |
| green_chapel_place_02 | Apple Ford | start hub | street | safe | yes | green_chapel_place_01, green_chapel_place_03 | A work roster at Apple Ford leaves two neighbours believing they were promised the same task. |
| green_chapel_place_03 | Bell Meadow | street route | street | safe | yes | green_chapel_place_02, green_chapel_place_04 | A route marker at Bell Meadow points visitors toward a closed gate and needs a safe correction. |
| green_chapel_place_04 | Hearth Vale | mid join | street | low | yes | green_chapel_place_03, green_chapel_place_05, green_chapel_place_01 | A newcomer at Hearth Vale needs a local introduction before a small obligation becomes embarrassing. |
| green_chapel_place_05 | Moss Vestry | work district | interior | low | no | green_chapel_place_04, green_chapel_place_06 | A shared tool at Moss Vestry has been returned without its care tag. |
| green_chapel_place_06 | Crownless Hill | instance door | dungeon | medium | no | green_chapel_place_05, green_chapel_place_07 | The entry record at Crownless Hill names an unfinished errand, not a monster or apocalypse. |
| green_chapel_place_07 | Wellspring Path | wild edge | street | medium | yes | green_chapel_place_06, green_chapel_place_08 | A weather change at Wellspring Path threatens a community plan unless someone reads the signs. |
| green_chapel_place_08 | Harrow Gate | housing approach | interior | low | no | green_chapel_place_07 | A resident at Harrow Gate has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| green_chapel_npc_01 | Cato Morrow | green_chapel_place_01 | quest | Cato Morrow says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Cato Morrow offers a specific task at Green Nave: settle the practical mismatch before it costs someone a shift. | Cato Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_02 | Dessa Rowan | green_chapel_place_02 | profession | Dessa Rowan says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Dessa Rowan offers a specific task at Apple Ford: settle the practical mismatch before it costs someone a shift. | Dessa Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_03 | Eris Nook | green_chapel_place_03 | hub | Eris Nook says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Eris Nook offers a specific task at Bell Meadow: settle the practical mismatch before it costs someone a shift. | Eris Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_04 | Fenn Cress | green_chapel_place_04 | merchant | Fenn Cress says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Fenn Cress offers a specific task at Hearth Vale: settle the practical mismatch before it costs someone a shift. | Fenn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_05 | Gala Silt | green_chapel_place_01 | local | Gala Silt says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Gala Silt offers a specific task at Green Nave: settle the practical mismatch before it costs someone a shift. | Gala Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_06 | Holl Pryce | green_chapel_place_02 | host | Holl Pryce says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Holl Pryce offers a specific task at Apple Ford: settle the practical mismatch before it costs someone a shift. | Holl Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_07 | Ivo Vane | green_chapel_place_03 | quest | Ivo Vane says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vane offers a specific task at Bell Meadow: settle the practical mismatch before it costs someone a shift. | Ivo Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_08 | Jori Quill | green_chapel_place_04 | profession | Jori Quill says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Jori Quill offers a specific task at Hearth Vale: settle the practical mismatch before it costs someone a shift. | Jori Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_09 | Alden Vale | green_chapel_place_01 | local | Alden Vale says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Alden Vale offers a specific task at Green Nave: settle the practical mismatch before it costs someone a shift. | Alden Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| green_chapel_npc_10 | Bryn Wren | green_chapel_place_02 | merchant | Bryn Wren says, ‘Green Chapel keeps its promises in small places. Tell me which one you noticed.’ | Bryn Wren offers a specific task at Apple Ford: settle the practical mismatch before it costs someone a shift. | Bryn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Hearth Vale, if that is useful. |
| 2 | Green Chapel feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Crownless Hill. |
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
| Vow Gardener | At Green Nave, you arrive in vow_gardener mantle carrying green_chapel_map_01. A small obligation is already late. | Give up one turn to help now. | Green Chapel: Name a Working Promise |
| Ford Keeper | At Apple Ford, you arrive in ford_keeper vest carrying green_chapel_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Green Chapel: Set the First Tool Aside |
| Bell Reeve | At Green Nave, you arrive in bell_reeve jacket carrying green_chapel_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Green Chapel: Carry the Right Record |
| Green Pilgrim | At Apple Ford, you arrive in green_pilgrim sash carrying green_chapel_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Green Chapel: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_green_chapel_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Green Nave’s small mismatch | ask | missing tag | A local need at Hearth Vale is connected but not catastrophic. | alternate talk |
| 2 | Resolve Apple Ford’s small mismatch | repair | closed path | A local need at Moss Vestry is connected but not catastrophic. | new route |
| 3 | Resolve Bell Meadow’s small mismatch | carry | unclear note | A local need at Crownless Hill is connected but not catastrophic. | recorded favor |
| 4 | Resolve Hearth Vale’s small mismatch | listen | late guest | A local need at Wellspring Path is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Moss Vestry’s small mismatch | map | wet weather | A local need at Harrow Gate is connected but not catastrophic. | slower reward |
| 6 | Resolve Crownless Hill’s small mismatch | prepare | busy shift | A local need at Green Nave is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Wellspring Path’s small mismatch | wait | quiet boundary | A local need at Apple Ford is connected but not catastrophic. | solo option |
| 8 | Resolve Harrow Gate’s small mismatch | return | wrong room | A local need at Bell Meadow is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Crownless Hill Trial` and `Bell Meadow Service Day`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| green_chapel_q_01 | Green Chapel: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| green_chapel_q_02 | Green Chapel: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| green_chapel_q_03 | Green Chapel: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| green_chapel_q_04 | Green Chapel: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| green_chapel_q_05 | Green Chapel: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| green_chapel_q_06 | Green Chapel: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| green_chapel_q_07 | Green Chapel: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| green_chapel_q_08 | Green Chapel: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| green_chapel_q_09 | Green Chapel: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| green_chapel_q_10 | Green Chapel: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| green_chapel_q_11 | Green Chapel: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| green_chapel_q_12 | Green Chapel: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| green_chapel_q_13 | Green Chapel: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| green_chapel_q_14 | Green Chapel: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| green_chapel_q_15 | Green Chapel: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| green_chapel_q_16 | Green Chapel: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| green_chapel_q_17 | Green Chapel: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| green_chapel_q_18 | Green Chapel: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| green_chapel_q_19 | Green Chapel: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| green_chapel_q_20 | Green Chapel: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| green_chapel_q_21 | Green Chapel: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| green_chapel_q_22 | Green Chapel: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| green_chapel_q_23 | Green Chapel: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| green_chapel_q_24 | Green Chapel: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| green_chapel_q_25 | Green Chapel: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Green Nave`: write `green_chapel_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Hearth Vale`: write `green_chapel_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `green_chapel_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| green_chapel_species_01 | Chapel Stag | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_02 | Apple Rook | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_03 | Green Hound | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_04 | Well Carp | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_05 | Green Chapel Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_06 | Green Chapel Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_07 | Green Chapel Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_08 | Green Chapel Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_09 | Green Chapel Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_10 | Green Chapel Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_11 | Green Chapel Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_12 | Green Chapel Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_13 | Green Chapel Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_14 | Green Chapel Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_15 | Green Chapel Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_16 | Green Chapel Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_17 | Green Chapel Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| green_chapel_species_18 | Green Chapel Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Chapel Pence**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Apple Ribbons**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Green Nave token, Apple Ford tool, Bell Meadow thread, Hearth Vale seal, Moss Vestry bundle, Crownless Hill token. |
| Instance and cosmetic templates | Wellspring Path tool, Harrow Gate thread, Green Nave seal, Apple Ford bundle, Bell Meadow token, Hearth Vale tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `green_chapel_vendor_01` at `green_chapel_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| green_chapel_dungeon_room_01 | The Crownless Hill Trial: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: green_chapel_species_01, green_chapel_species_02; elite: none |   |
| green_chapel_dungeon_room_02 | The Crownless Hill Trial: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: green_chapel_species_03, green_chapel_species_04; elite: none |   |
| green_chapel_dungeon_room_03 | The Crownless Hill Trial: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: green_chapel_species_05, green_chapel_species_06; elite: green_chapel_species_09 |   |
| green_chapel_dungeon_room_04 | The Crownless Hill Trial: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: green_chapel_species_07, green_chapel_species_08; elite: none | checkpoint  |
| green_chapel_dungeon_room_05 | The Crownless Hill Trial: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: green_chapel_species_09, green_chapel_species_10; elite: none |  boss: green_chapel_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`green_chapel_trap_01`), jammed latch (`green_chapel_trap_02`), wet threshold (`green_chapel_trap_03`), false shelf (`green_chapel_trap_04`), quiet bell (`green_chapel_trap_05`), sealed drawer (`green_chapel_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Bell Meadow Service Day** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| green_chapel_talent_01 | Green Chapel Local Ear | 1 | none | green_chapel_effect_01 |
| green_chapel_talent_02 | Green Chapel Careful Hand | 2 | none | green_chapel_effect_02 |
| green_chapel_talent_03 | Green Chapel Route Sense | 3 | none | green_chapel_effect_03 |
| green_chapel_talent_04 | Green Chapel Shared Measure | 4 | none | green_chapel_effect_04 |
| green_chapel_talent_05 | Green Chapel Quiet Craft | 1 | green_chapel_talent_04 | green_chapel_effect_05 |
| green_chapel_talent_06 | Green Chapel Open Invitation | 2 | none | green_chapel_effect_06 |
| green_chapel_talent_07 | Green Chapel Safe Return | 3 | none | green_chapel_effect_07 |
| green_chapel_talent_08 | Green Chapel Field Note | 4 | none | green_chapel_effect_08 |
| green_chapel_talent_09 | Green Chapel Steady Pace | 1 | green_chapel_talent_08 | green_chapel_effect_09 |
| green_chapel_talent_10 | Green Chapel Clear Signal | 2 | none | green_chapel_effect_10 |
| green_chapel_talent_11 | Green Chapel Warm Welcome | 3 | none | green_chapel_effect_11 |
| green_chapel_talent_12 | Green Chapel Small Courage | 4 | none | green_chapel_effect_12 |
| green_chapel_talent_13 | Green Chapel Repair Habit | 1 | green_chapel_talent_12 | green_chapel_effect_13 |
| green_chapel_talent_14 | Green Chapel Trust Mark | 2 | none | green_chapel_effect_14 |
| green_chapel_talent_15 | Green Chapel Second Look | 3 | none | green_chapel_effect_15 |
| green_chapel_talent_16 | Green Chapel Closing Grace | 4 | none | green_chapel_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| green_chapel_contract_01 | Green Chapel Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| green_chapel_contract_02 | Green Chapel Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| green_chapel_contract_03 | Green Chapel Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| green_chapel_contract_04 | Green Chapel Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| green_chapel_contract_05 | Green Chapel Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| green_chapel_contract_06 | Green Chapel Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| green_chapel_contract_07 | Green Chapel Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| green_chapel_contract_08 | Green Chapel Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| green_chapel_interact_01 | Green Nave bench | rest | green_chapel_place_01 |
| green_chapel_interact_02 | Apple Ford cabinet | repair | green_chapel_place_02 |
| green_chapel_interact_03 | Bell Meadow rack | tend | green_chapel_place_03 |
| green_chapel_interact_04 | Hearth Vale kettle | craft | green_chapel_place_04 |
| green_chapel_interact_05 | Moss Vestry ledger | cook | green_chapel_place_05 |
| green_chapel_interact_06 | Crownless Hill rail | bind_inn | green_chapel_place_06 |
| green_chapel_interact_07 | Wellspring Path bell | inspect | green_chapel_place_07 |
| green_chapel_interact_08 | Harrow Gate board | open | green_chapel_place_08 |
| green_chapel_interact_09 | Green Nave table | carry | green_chapel_place_01 |
| green_chapel_interact_10 | Apple Ford lamp | clean | green_chapel_place_02 |
| green_chapel_interact_11 | Bell Meadow gate | signal | green_chapel_place_03 |
| green_chapel_interact_12 | Hearth Vale shelf | record | green_chapel_place_04 |


**Default interior graph.** `green_chapel_interior_01` enters from `green_chapel_place_08` and contains 7 connected rooms: Green Chapel Entry, Green Chapel Main Room, Green Chapel Work Nook, Green Chapel Window Room, Green Chapel Quiet Room, Green Chapel Storage, Green Chapel Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | green, apple, bell, hearth materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Green Chapel` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Green Chapel and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Green Chapel: distant work, a room tone, a gentle rhythm that belongs to Green Nave, and a second layer that makes the route toward Crownless Hill feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Green Chapel Ledger |
| 2 | Green Chapel Route |
| 3 | Green Chapel Work |
| 4 | Green Chapel Talk |
| 5 | Green Chapel Kit |
| 6 | Green Chapel Pack |
| 7 | Green Chapel Rest |
| 8 | Green Chapel Safety |
| 9 | Green Chapel Map |
| 10 | Green Chapel Notice |
| 11 | Green Chapel Favour |
| 12 | Green Chapel Gold |
| 13 | Green Chapel Token |
| 14 | Green Chapel Record |
| 15 | Green Chapel Instance |
| 16 | Green Chapel Checkpoint |
| 17 | Green Chapel Choice |
| 18 | Green Chapel Help |
| 19 | Green Chapel Calendar |
| 20 | Green Chapel Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Green Nave, a small promise has your name on it. |
| 2 | At Apple Ford, a small promise has your name on it. |
| 3 | At Bell Meadow, a small promise has your name on it. |
| 4 | At Hearth Vale, a small promise has your name on it. |
| 5 | At Moss Vestry, a small promise has your name on it. |
| 6 | At Crownless Hill, a small promise has your name on it. |
| 7 | At Wellspring Path, a small promise has your name on it. |
| 8 | At Harrow Gate, a small promise has your name on it. |
| 9 | At Green Nave, a small promise has your name on it. |
| 10 | At Apple Ford, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is original chapel-green questing, service, and measured vows. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
