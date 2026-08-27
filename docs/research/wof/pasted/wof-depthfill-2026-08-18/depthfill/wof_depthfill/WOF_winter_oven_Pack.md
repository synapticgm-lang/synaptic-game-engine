# WOF Winter Oven: Full Start-Depth Pack

> **Release truth.** Winter Oven is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `winter_oven` |
| Display name | **Winter Oven** |
| One-line pitch | Original winter kitchens, neighborhood feasts, and lightly spooky warmth. |
| Maturity | **all-ages** |
| rulesModuleId | `cozy_tick` |
| Theme Kit | **Winter Oven Theme Kit**, included with world entitlement |
| Genre pattern and fence | Original winter kitchens, neighborhood feasts, and lightly spooky warmth. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Winter Oven is a WOF text world about original winter kitchens, neighborhood feasts, and lightly spooky warmth. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Frozen Disney named place |
| 2 | Narnia hero silhouette |
| 3 | Baba Yaga logo geometry |
| 4 | Slavic sacred rite catchphrase |
| 5 | Hansel and Gretel signature costume |
| 6 | Hogwarts feast proprietary creature |
| 7 | Overcooked map layout |
| 8 | Stardew Valley kitchen faction title |
| 9 | Moomins weapon profile |
| 10 | Nutcracker UI chrome |
| 11 | Frozen Disney quest premise |
| 12 | Narnia title typography |
| 13 | Baba Yaga color-coded insignia |
| 14 | Slavic sacred rite music motif |
| 15 | Hansel and Gretel vehicle or mount profile |
| 16 | Hogwarts feast companion anatomy |
| 17 | Overcooked named artifact |
| 18 | Stardew Valley kitchen school or agency badge |
| 19 | Moomins real sacred practice as minigame |
| 20 | Nutcracker stereotyped cultural shorthand |
| 21 | Frozen Disney real-person likeness |
| 22 | Narnia copied dialogue cadence |
| 23 | Baba Yaga fan-server slogan |
| 24 | Slavic sacred rite paid power framing |
| 25 | Hansel and Gretel loot-box presentation |
| 26 | Hogwarts feast named place |
| 27 | Overcooked hero silhouette |
| 28 | Stardew Valley kitchen logo geometry |
| 29 | Moomins catchphrase |
| 30 | Nutcracker signature costume |
| 31 | Frozen Disney proprietary creature |
| 32 | Narnia map layout |
| 33 | Baba Yaga faction title |
| 34 | Slavic sacred rite weapon profile |
| 35 | Hansel and Gretel UI chrome |
| 36 | Hogwarts feast quest premise |
| 37 | Overcooked title typography |
| 38 | Stardew Valley kitchen color-coded insignia |
| 39 | Moomins music motif |
| 40 | Nutcracker vehicle or mount profile |
| 41 | Frozen Disney companion anatomy |
| 42 | Narnia named artifact |
| 43 | Baba Yaga school or agency badge |
| 44 | Slavic sacred rite real sacred practice as minigame |
| 45 | Hansel and Gretel stereotyped cultural shorthand |
| 46 | Hogwarts feast real-person likeness |
| 47 | Overcooked copied dialogue cadence |
| 48 | Stardew Valley kitchen fan-server slogan |
| 49 | Moomins paid power framing |
| 50 | Nutcracker loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared energy, season, neighbor and authored-tick contract. |
| Wipe and checkpoint | Wipe returns the party to `winter_oven_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Winter Oven • {{turn}} • committed |
| 2 | [Route] Winter Oven • {{placeId}} • committed |
| 3 | [Work] Winter Oven • {{lastAction}} • committed |
| 4 | [Talk] Winter Oven • {{npcId}} • committed |
| 5 | [Kit] Winter Oven • {{kitId}} • committed |
| 6 | [Pack] Winter Oven • {{partySize}} • committed |
| 7 | [Rest] Winter Oven • {{checkpoint}} • committed |
| 8 | [Safety] Winter Oven • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| winter_oven_kit_01 | Oven Tender | oven tender workwear | practice oven tender | Never use oven tender authority to remove another person’s choice. | Use the local rhythm of Winter Oven and make every offer concrete. | oven_tender mantle; oven_tender tool; winter_oven_map_01 | winter_oven_place_01; winter_oven_q_01 | winter_oven_ability_01 |
| winter_oven_kit_02 | Birch Gatherer | birch gatherer workwear | practice birch gatherer | Never use birch gatherer authority to remove another person’s choice. | Use the local rhythm of Winter Oven and make every offer concrete. | birch_gatherer vest; birch_gatherer tool; winter_oven_map_02 | winter_oven_place_02; winter_oven_q_02 | winter_oven_ability_02 |
| winter_oven_kit_03 | Kettle Caller | kettle caller workwear | practice kettle caller | Never use kettle caller authority to remove another person’s choice. | Use the local rhythm of Winter Oven and make every offer concrete. | kettle_caller jacket; kettle_caller tool; winter_oven_map_03 | winter_oven_place_01; winter_oven_q_03 | winter_oven_ability_03 |
| winter_oven_kit_04 | Wool Mender | wool mender workwear | practice wool mender | Never use wool mender authority to remove another person’s choice. | Use the local rhythm of Winter Oven and make every offer concrete. | wool_mender sash; wool_mender tool; winter_oven_map_04 | winter_oven_place_02; winter_oven_q_04 | winter_oven_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `winter_oven_place_01` is a shared hub rather than a capital analogue; `winter_oven_place_04` is the mid-join; `winter_oven_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| winter_oven_place_01 | Oven Square | shared hub | street | safe | yes | winter_oven_place_02, winter_oven_place_04 | A public notice at Oven Square has been posted with one crucial line washed away. |
| winter_oven_place_02 | Snow Lane | start hub | street | safe | yes | winter_oven_place_01, winter_oven_place_03 | A work roster at Snow Lane leaves two neighbours believing they were promised the same task. |
| winter_oven_place_03 | Birch Pantry | street route | street | safe | yes | winter_oven_place_02, winter_oven_place_04 | A route marker at Birch Pantry points visitors toward a closed gate and needs a safe correction. |
| winter_oven_place_04 | Ember Bridge | mid join | street | low | yes | winter_oven_place_03, winter_oven_place_05, winter_oven_place_01 | A newcomer at Ember Bridge needs a local introduction before a small obligation becomes embarrassing. |
| winter_oven_place_05 | Dough Cellar | work district | interior | low | no | winter_oven_place_04, winter_oven_place_06 | A shared tool at Dough Cellar has been returned without its care tag. |
| winter_oven_place_06 | Frost Porch | instance door | dungeon | medium | no | winter_oven_place_05, winter_oven_place_07 | The entry record at Frost Porch names an unfinished errand, not a monster or apocalypse. |
| winter_oven_place_07 | Kettle Hall | wild edge | street | medium | yes | winter_oven_place_06, winter_oven_place_08 | A weather change at Kettle Hall threatens a community plan unless someone reads the signs. |
| winter_oven_place_08 | Wool Window | housing approach | interior | low | no | winter_oven_place_07 | A resident at Wool Window has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| winter_oven_npc_01 | Bryn Cress | winter_oven_place_01 | quest | Bryn Cress says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Bryn Cress offers a specific task at Oven Square: settle the practical mismatch before it costs someone a shift. | Bryn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_02 | Cato Silt | winter_oven_place_02 | profession | Cato Silt says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Cato Silt offers a specific task at Snow Lane: settle the practical mismatch before it costs someone a shift. | Cato Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_03 | Dessa Pryce | winter_oven_place_03 | hub | Dessa Pryce says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Dessa Pryce offers a specific task at Birch Pantry: settle the practical mismatch before it costs someone a shift. | Dessa Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_04 | Eris Vane | winter_oven_place_04 | merchant | Eris Vane says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Eris Vane offers a specific task at Ember Bridge: settle the practical mismatch before it costs someone a shift. | Eris Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_05 | Fenn Quill | winter_oven_place_01 | local | Fenn Quill says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Fenn Quill offers a specific task at Oven Square: settle the practical mismatch before it costs someone a shift. | Fenn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_06 | Gala Vale | winter_oven_place_02 | host | Gala Vale says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Gala Vale offers a specific task at Snow Lane: settle the practical mismatch before it costs someone a shift. | Gala Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_07 | Holl Wren | winter_oven_place_03 | quest | Holl Wren says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Holl Wren offers a specific task at Birch Pantry: settle the practical mismatch before it costs someone a shift. | Holl Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_08 | Ivo Morrow | winter_oven_place_04 | profession | Ivo Morrow says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Ivo Morrow offers a specific task at Ember Bridge: settle the practical mismatch before it costs someone a shift. | Ivo Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_09 | Jori Rowan | winter_oven_place_01 | local | Jori Rowan says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Jori Rowan offers a specific task at Oven Square: settle the practical mismatch before it costs someone a shift. | Jori Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| winter_oven_npc_10 | Alden Nook | winter_oven_place_02 | merchant | Alden Nook says, ‘Winter Oven keeps its promises in small places. Tell me which one you noticed.’ | Alden Nook offers a specific task at Snow Lane: settle the practical mismatch before it costs someone a shift. | Alden Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Ember Bridge, if that is useful. |
| 2 | Winter Oven feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Frost Porch. |
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
| Oven Tender | At Oven Square, you arrive in oven_tender mantle carrying winter_oven_map_01. A small obligation is already late. | Give up one turn to help now. | Winter Oven: Name a Working Promise |
| Birch Gatherer | At Snow Lane, you arrive in birch_gatherer vest carrying winter_oven_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Winter Oven: Set the First Tool Aside |
| Kettle Caller | At Oven Square, you arrive in kettle_caller jacket carrying winter_oven_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Winter Oven: Carry the Right Record |
| Wool Mender | At Snow Lane, you arrive in wool_mender sash carrying winter_oven_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Winter Oven: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_winter_oven_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Oven Square’s small mismatch | ask | missing tag | A local need at Ember Bridge is connected but not catastrophic. | alternate talk |
| 2 | Resolve Snow Lane’s small mismatch | repair | closed path | A local need at Dough Cellar is connected but not catastrophic. | new route |
| 3 | Resolve Birch Pantry’s small mismatch | carry | unclear note | A local need at Frost Porch is connected but not catastrophic. | recorded favor |
| 4 | Resolve Ember Bridge’s small mismatch | listen | late guest | A local need at Kettle Hall is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Dough Cellar’s small mismatch | map | wet weather | A local need at Wool Window is connected but not catastrophic. | slower reward |
| 6 | Resolve Frost Porch’s small mismatch | prepare | busy shift | A local need at Oven Square is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Kettle Hall’s small mismatch | wait | quiet boundary | A local need at Snow Lane is connected but not catastrophic. | solo option |
| 8 | Resolve Wool Window’s small mismatch | return | wrong room | A local need at Birch Pantry is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Dough Cellar Thaw` and `Ember Bridge Feast`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| winter_oven_q_01 | Winter Oven: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| winter_oven_q_02 | Winter Oven: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| winter_oven_q_03 | Winter Oven: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| winter_oven_q_04 | Winter Oven: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| winter_oven_q_05 | Winter Oven: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| winter_oven_q_06 | Winter Oven: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| winter_oven_q_07 | Winter Oven: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| winter_oven_q_08 | Winter Oven: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| winter_oven_q_09 | Winter Oven: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| winter_oven_q_10 | Winter Oven: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| winter_oven_q_11 | Winter Oven: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| winter_oven_q_12 | Winter Oven: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| winter_oven_q_13 | Winter Oven: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| winter_oven_q_14 | Winter Oven: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| winter_oven_q_15 | Winter Oven: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| winter_oven_q_16 | Winter Oven: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| winter_oven_q_17 | Winter Oven: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| winter_oven_q_18 | Winter Oven: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| winter_oven_q_19 | Winter Oven: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| winter_oven_q_20 | Winter Oven: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| winter_oven_q_21 | Winter Oven: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| winter_oven_q_22 | Winter Oven: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| winter_oven_q_23 | Winter Oven: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| winter_oven_q_24 | Winter Oven: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| winter_oven_q_25 | Winter Oven: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Oven Square`: write `winter_oven_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Ember Bridge`: write `winter_oven_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `winter_oven_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| winter_oven_species_01 | Flour Fox | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_02 | Birch Owl | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_03 | Kettle Hare | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_04 | Frost Carp | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_05 | Winter Oven Field Type 5 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_06 | Winter Oven Field Type 6 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_07 | Winter Oven Field Type 7 | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_08 | Winter Oven Field Type 8 | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_09 | Winter Oven Field Type 9 | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_10 | Winter Oven Field Type 10 | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_11 | Winter Oven Field Type 11 | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_12 | Winter Oven Field Type 12 | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_13 | Winter Oven Field Type 13 | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_14 | Winter Oven Field Type 14 | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_15 | Winter Oven Field Type 15 | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_16 | Winter Oven Field Type 16 | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_17 | Winter Oven Field Type 17 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| winter_oven_species_18 | Winter Oven Field Type 18 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Oven Pennies**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Frost Buttons**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Oven Square token, Snow Lane tool, Birch Pantry thread, Ember Bridge seal, Dough Cellar bundle, Frost Porch token. |
| Instance and cosmetic templates | Kettle Hall tool, Wool Window thread, Oven Square seal, Snow Lane bundle, Birch Pantry token, Ember Bridge tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `winter_oven_vendor_01` at `winter_oven_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| winter_oven_dungeon_room_01 | The Dough Cellar Thaw: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: winter_oven_species_01, winter_oven_species_02; elite: none |   |
| winter_oven_dungeon_room_02 | The Dough Cellar Thaw: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: winter_oven_species_03, winter_oven_species_04; elite: none |   |
| winter_oven_dungeon_room_03 | The Dough Cellar Thaw: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: winter_oven_species_05, winter_oven_species_06; elite: winter_oven_species_09 |   |
| winter_oven_dungeon_room_04 | The Dough Cellar Thaw: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: winter_oven_species_07, winter_oven_species_08; elite: none | checkpoint  |
| winter_oven_dungeon_room_05 | The Dough Cellar Thaw: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: winter_oven_species_09, winter_oven_species_10; elite: none |  boss: winter_oven_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`winter_oven_trap_01`), jammed latch (`winter_oven_trap_02`), wet threshold (`winter_oven_trap_03`), false shelf (`winter_oven_trap_04`), quiet bell (`winter_oven_trap_05`), sealed drawer (`winter_oven_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Ember Bridge Feast** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| winter_oven_talent_01 | Winter Oven Local Ear | 1 | none | winter_oven_effect_01 |
| winter_oven_talent_02 | Winter Oven Careful Hand | 2 | none | winter_oven_effect_02 |
| winter_oven_talent_03 | Winter Oven Route Sense | 3 | none | winter_oven_effect_03 |
| winter_oven_talent_04 | Winter Oven Shared Measure | 4 | none | winter_oven_effect_04 |
| winter_oven_talent_05 | Winter Oven Quiet Craft | 1 | winter_oven_talent_04 | winter_oven_effect_05 |
| winter_oven_talent_06 | Winter Oven Open Invitation | 2 | none | winter_oven_effect_06 |
| winter_oven_talent_07 | Winter Oven Safe Return | 3 | none | winter_oven_effect_07 |
| winter_oven_talent_08 | Winter Oven Field Note | 4 | none | winter_oven_effect_08 |
| winter_oven_talent_09 | Winter Oven Steady Pace | 1 | winter_oven_talent_08 | winter_oven_effect_09 |
| winter_oven_talent_10 | Winter Oven Clear Signal | 2 | none | winter_oven_effect_10 |
| winter_oven_talent_11 | Winter Oven Warm Welcome | 3 | none | winter_oven_effect_11 |
| winter_oven_talent_12 | Winter Oven Small Courage | 4 | none | winter_oven_effect_12 |
| winter_oven_talent_13 | Winter Oven Repair Habit | 1 | winter_oven_talent_12 | winter_oven_effect_13 |
| winter_oven_talent_14 | Winter Oven Trust Mark | 2 | none | winter_oven_effect_14 |
| winter_oven_talent_15 | Winter Oven Second Look | 3 | none | winter_oven_effect_15 |
| winter_oven_talent_16 | Winter Oven Closing Grace | 4 | none | winter_oven_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| winter_oven_contract_01 | Winter Oven Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| winter_oven_contract_02 | Winter Oven Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| winter_oven_contract_03 | Winter Oven Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| winter_oven_contract_04 | Winter Oven Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| winter_oven_contract_05 | Winter Oven Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| winter_oven_contract_06 | Winter Oven Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| winter_oven_contract_07 | Winter Oven Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| winter_oven_contract_08 | Winter Oven Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| winter_oven_interact_01 | Oven Square bench | rest | winter_oven_place_01 |
| winter_oven_interact_02 | Snow Lane cabinet | repair | winter_oven_place_02 |
| winter_oven_interact_03 | Birch Pantry rack | tend | winter_oven_place_03 |
| winter_oven_interact_04 | Ember Bridge kettle | craft | winter_oven_place_04 |
| winter_oven_interact_05 | Dough Cellar ledger | cook | winter_oven_place_05 |
| winter_oven_interact_06 | Frost Porch rail | bind_inn | winter_oven_place_06 |
| winter_oven_interact_07 | Kettle Hall bell | inspect | winter_oven_place_07 |
| winter_oven_interact_08 | Wool Window board | open | winter_oven_place_08 |
| winter_oven_interact_09 | Oven Square table | carry | winter_oven_place_01 |
| winter_oven_interact_10 | Snow Lane lamp | clean | winter_oven_place_02 |
| winter_oven_interact_11 | Birch Pantry gate | signal | winter_oven_place_03 |
| winter_oven_interact_12 | Ember Bridge shelf | record | winter_oven_place_04 |


**Default interior graph.** `winter_oven_interior_01` enters from `winter_oven_place_08` and contains 7 connected rooms: Winter Oven Entry, Winter Oven Main Room, Winter Oven Work Nook, Winter Oven Window Room, Winter Oven Quiet Room, Winter Oven Storage, Winter Oven Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | oven, snow, birch, ember materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Winter Oven` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Winter Oven and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Winter Oven: distant work, a room tone, a gentle rhythm that belongs to Oven Square, and a second layer that makes the route toward Frost Porch feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Winter Oven Ledger |
| 2 | Winter Oven Route |
| 3 | Winter Oven Work |
| 4 | Winter Oven Talk |
| 5 | Winter Oven Kit |
| 6 | Winter Oven Pack |
| 7 | Winter Oven Rest |
| 8 | Winter Oven Safety |
| 9 | Winter Oven Map |
| 10 | Winter Oven Notice |
| 11 | Winter Oven Favour |
| 12 | Winter Oven Gold |
| 13 | Winter Oven Token |
| 14 | Winter Oven Record |
| 15 | Winter Oven Instance |
| 16 | Winter Oven Checkpoint |
| 17 | Winter Oven Choice |
| 18 | Winter Oven Help |
| 19 | Winter Oven Calendar |
| 20 | Winter Oven Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Oven Square, a small promise has your name on it. |
| 2 | At Snow Lane, a small promise has your name on it. |
| 3 | At Birch Pantry, a small promise has your name on it. |
| 4 | At Ember Bridge, a small promise has your name on it. |
| 5 | At Dough Cellar, a small promise has your name on it. |
| 6 | At Frost Porch, a small promise has your name on it. |
| 7 | At Kettle Hall, a small promise has your name on it. |
| 8 | At Wool Window, a small promise has your name on it. |
| 9 | At Oven Square, a small promise has your name on it. |
| 10 | At Snow Lane, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is original winter kitchens, neighborhood feasts, and lightly spooky warmth. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
