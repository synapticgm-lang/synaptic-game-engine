# WOF Mesa Codex: Full Start-Depth Pack

> **Release truth.** Mesa Codex is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `mesa_codex` |
| Display name | **Mesa Codex** |
| One-line pitch | Original highland calendar-city stewardship. |
| Maturity | **all-ages** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Mesa Codex Theme Kit**, included with world entitlement |
| Genre pattern and fence | Original highland calendar-city stewardship. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Mesa Codex is a WOF text world about original highland calendar-city stewardship. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Mesoamerican temple reconstruction named place |
| 2 | Maya calendar hero silhouette |
| 3 | Aztec glyph logo geometry |
| 4 | Inca road catchphrase |
| 5 | El Dorado signature costume |
| 6 | Indiana Jones proprietary creature |
| 7 | Apocalypto map layout |
| 8 | Coco faction title |
| 9 | real sacred ceremony weapon profile |
| 10 | colonial explorer UI chrome |
| 11 | Mesoamerican temple reconstruction quest premise |
| 12 | Maya calendar title typography |
| 13 | Aztec glyph color-coded insignia |
| 14 | Inca road music motif |
| 15 | El Dorado vehicle or mount profile |
| 16 | Indiana Jones companion anatomy |
| 17 | Apocalypto named artifact |
| 18 | Coco school or agency badge |
| 19 | real sacred ceremony real sacred practice as minigame |
| 20 | colonial explorer stereotyped cultural shorthand |
| 21 | Mesoamerican temple reconstruction real-person likeness |
| 22 | Maya calendar copied dialogue cadence |
| 23 | Aztec glyph fan-server slogan |
| 24 | Inca road paid power framing |
| 25 | El Dorado loot-box presentation |
| 26 | Indiana Jones named place |
| 27 | Apocalypto hero silhouette |
| 28 | Coco logo geometry |
| 29 | real sacred ceremony catchphrase |
| 30 | colonial explorer signature costume |
| 31 | Mesoamerican temple reconstruction proprietary creature |
| 32 | Maya calendar map layout |
| 33 | Aztec glyph faction title |
| 34 | Inca road weapon profile |
| 35 | El Dorado UI chrome |
| 36 | Indiana Jones quest premise |
| 37 | Apocalypto title typography |
| 38 | Coco color-coded insignia |
| 39 | real sacred ceremony music motif |
| 40 | colonial explorer vehicle or mount profile |
| 41 | Mesoamerican temple reconstruction companion anatomy |
| 42 | Maya calendar named artifact |
| 43 | Aztec glyph school or agency badge |
| 44 | Inca road real sacred practice as minigame |
| 45 | El Dorado stereotyped cultural shorthand |
| 46 | Indiana Jones real-person likeness |
| 47 | Apocalypto copied dialogue cadence |
| 48 | Coco fan-server slogan |
| 49 | real sacred ceremony paid power framing |
| 50 | colonial explorer loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `mesa_codex_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Mesa Codex • {{turn}} • committed |
| 2 | [Route] Mesa Codex • {{placeId}} • committed |
| 3 | [Work] Mesa Codex • {{lastAction}} • committed |
| 4 | [Talk] Mesa Codex • {{npcId}} • committed |
| 5 | [Kit] Mesa Codex • {{kitId}} • committed |
| 6 | [Pack] Mesa Codex • {{partySize}} • committed |
| 7 | [Rest] Mesa Codex • {{checkpoint}} • committed |
| 8 | [Safety] Mesa Codex • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mesa_codex_kit_01 | Calendar Keeper | calendar keeper workwear | practice calendar keeper | Never use calendar keeper authority to remove another person’s choice. | Use the local rhythm of Mesa Codex and make every offer concrete. | calendar_keeper mantle; calendar_keeper tool; mesa_codex_map_01 | mesa_codex_place_01; mesa_codex_q_01 | mesa_codex_ability_01 |
| mesa_codex_kit_02 | Well Painter | well painter workwear | practice well painter | Never use well painter authority to remove another person’s choice. | Use the local rhythm of Mesa Codex and make every offer concrete. | well_painter vest; well_painter tool; mesa_codex_map_02 | mesa_codex_place_02; mesa_codex_q_02 | mesa_codex_ability_02 |
| mesa_codex_kit_03 | Terrace Caller | terrace caller workwear | practice terrace caller | Never use terrace caller authority to remove another person’s choice. | Use the local rhythm of Mesa Codex and make every offer concrete. | terrace_caller jacket; terrace_caller tool; mesa_codex_map_03 | mesa_codex_place_01; mesa_codex_q_03 | mesa_codex_ability_03 |
| mesa_codex_kit_04 | Dawn Scribe | dawn scribe workwear | practice dawn scribe | Never use dawn scribe authority to remove another person’s choice. | Use the local rhythm of Mesa Codex and make every offer concrete. | dawn_scribe sash; dawn_scribe tool; mesa_codex_map_04 | mesa_codex_place_02; mesa_codex_q_04 | mesa_codex_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `mesa_codex_place_01` is a shared hub rather than a capital analogue; `mesa_codex_place_04` is the mid-join; `mesa_codex_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mesa_codex_place_01 | Stone Calendar | shared hub | street | safe | yes | mesa_codex_place_02, mesa_codex_place_04 | A public notice at Stone Calendar has been posted with one crucial line washed away. |
| mesa_codex_place_02 | Cactus Gate | start hub | street | safe | yes | mesa_codex_place_01, mesa_codex_place_03 | A work roster at Cactus Gate leaves two neighbours believing they were promised the same task. |
| mesa_codex_place_03 | Painted Well | street route | street | safe | yes | mesa_codex_place_02, mesa_codex_place_04 | A route marker at Painted Well points visitors toward a closed gate and needs a safe correction. |
| mesa_codex_place_04 | Dawn Mesa | mid join | street | low | yes | mesa_codex_place_03, mesa_codex_place_05, mesa_codex_place_01 | A newcomer at Dawn Mesa needs a local introduction before a small obligation becomes embarrassing. |
| mesa_codex_place_05 | Terrace Walk | work district | interior | low | no | mesa_codex_place_04, mesa_codex_place_06 | A shared tool at Terrace Walk has been returned without its care tag. |
| mesa_codex_place_06 | Shade Court | instance door | dungeon | medium | no | mesa_codex_place_05, mesa_codex_place_07 | The entry record at Shade Court names an unfinished errand, not a monster or apocalypse. |
| mesa_codex_place_07 | Rain Archive | wild edge | street | medium | yes | mesa_codex_place_06, mesa_codex_place_08 | A weather change at Rain Archive threatens a community plan unless someone reads the signs. |
| mesa_codex_place_08 | Copper Steps | housing approach | interior | low | no | mesa_codex_place_07 | A resident at Copper Steps has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| mesa_codex_npc_01 | Alden Vane | mesa_codex_place_01 | quest | Alden Vane says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Stone Calendar: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_02 | Bryn Quill | mesa_codex_place_02 | profession | Bryn Quill says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Cactus Gate: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_03 | Cato Vale | mesa_codex_place_03 | hub | Cato Vale says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Painted Well: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_04 | Dessa Wren | mesa_codex_place_04 | merchant | Dessa Wren says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Dawn Mesa: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_05 | Eris Morrow | mesa_codex_place_01 | local | Eris Morrow says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Stone Calendar: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_06 | Fenn Rowan | mesa_codex_place_02 | host | Fenn Rowan says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Cactus Gate: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_07 | Gala Nook | mesa_codex_place_03 | quest | Gala Nook says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Painted Well: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_08 | Holl Cress | mesa_codex_place_04 | profession | Holl Cress says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Dawn Mesa: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_09 | Ivo Silt | mesa_codex_place_01 | local | Ivo Silt says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Stone Calendar: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| mesa_codex_npc_10 | Jori Pryce | mesa_codex_place_02 | merchant | Jori Pryce says, ‘Mesa Codex keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Cactus Gate: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Dawn Mesa, if that is useful. |
| 2 | Mesa Codex feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Shade Court. |
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
| Calendar Keeper | At Stone Calendar, you arrive in calendar_keeper mantle carrying mesa_codex_map_01. A small obligation is already late. | Give up one turn to help now. | Mesa Codex: Name a Working Promise |
| Well Painter | At Cactus Gate, you arrive in well_painter vest carrying mesa_codex_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Mesa Codex: Set the First Tool Aside |
| Terrace Caller | At Stone Calendar, you arrive in terrace_caller jacket carrying mesa_codex_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Mesa Codex: Carry the Right Record |
| Dawn Scribe | At Cactus Gate, you arrive in dawn_scribe sash carrying mesa_codex_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Mesa Codex: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_mesa_codex_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Stone Calendar’s small mismatch | ask | missing tag | A local need at Dawn Mesa is connected but not catastrophic. | alternate talk |
| 2 | Resolve Cactus Gate’s small mismatch | repair | closed path | A local need at Terrace Walk is connected but not catastrophic. | new route |
| 3 | Resolve Painted Well’s small mismatch | carry | unclear note | A local need at Shade Court is connected but not catastrophic. | recorded favor |
| 4 | Resolve Dawn Mesa’s small mismatch | listen | late guest | A local need at Rain Archive is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Terrace Walk’s small mismatch | map | wet weather | A local need at Copper Steps is connected but not catastrophic. | slower reward |
| 6 | Resolve Shade Court’s small mismatch | prepare | busy shift | A local need at Stone Calendar is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Rain Archive’s small mismatch | wait | quiet boundary | A local need at Cactus Gate is connected but not catastrophic. | solo option |
| 8 | Resolve Copper Steps’s small mismatch | return | wrong room | A local need at Painted Well is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Rain Archive Door` and `Dawn Mesa Countday`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| mesa_codex_q_01 | Mesa Codex: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| mesa_codex_q_02 | Mesa Codex: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| mesa_codex_q_03 | Mesa Codex: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| mesa_codex_q_04 | Mesa Codex: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| mesa_codex_q_05 | Mesa Codex: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| mesa_codex_q_06 | Mesa Codex: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| mesa_codex_q_07 | Mesa Codex: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| mesa_codex_q_08 | Mesa Codex: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| mesa_codex_q_09 | Mesa Codex: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| mesa_codex_q_10 | Mesa Codex: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| mesa_codex_q_11 | Mesa Codex: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| mesa_codex_q_12 | Mesa Codex: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| mesa_codex_q_13 | Mesa Codex: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| mesa_codex_q_14 | Mesa Codex: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| mesa_codex_q_15 | Mesa Codex: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| mesa_codex_q_16 | Mesa Codex: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| mesa_codex_q_17 | Mesa Codex: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| mesa_codex_q_18 | Mesa Codex: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| mesa_codex_q_19 | Mesa Codex: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| mesa_codex_q_20 | Mesa Codex: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| mesa_codex_q_21 | Mesa Codex: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| mesa_codex_q_22 | Mesa Codex: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| mesa_codex_q_23 | Mesa Codex: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| mesa_codex_q_24 | Mesa Codex: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| mesa_codex_q_25 | Mesa Codex: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Stone Calendar`: write `mesa_codex_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Dawn Mesa`: write `mesa_codex_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `mesa_codex_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| mesa_codex_species_01 | Sun Lizard | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_02 | Quill Fox | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_03 | Rain Hare | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_04 | Stone Ibis | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_05 | Mesa Codex Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_06 | Mesa Codex Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_07 | Mesa Codex Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_08 | Mesa Codex Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_09 | Mesa Codex Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_10 | Mesa Codex Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_11 | Mesa Codex Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_12 | Mesa Codex Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_13 | Mesa Codex Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_14 | Mesa Codex Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_15 | Mesa Codex Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_16 | Mesa Codex Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_17 | Mesa Codex Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| mesa_codex_species_18 | Mesa Codex Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Mesa Shells**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Calendar Ribbons**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Stone Calendar token, Cactus Gate tool, Painted Well thread, Dawn Mesa seal, Terrace Walk bundle, Shade Court token. |
| Instance and cosmetic templates | Rain Archive tool, Copper Steps thread, Stone Calendar seal, Cactus Gate bundle, Painted Well token, Dawn Mesa tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `mesa_codex_vendor_01` at `mesa_codex_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| mesa_codex_dungeon_room_01 | The Rain Archive Door: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: mesa_codex_species_01, mesa_codex_species_02; elite: none |   |
| mesa_codex_dungeon_room_02 | The Rain Archive Door: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: mesa_codex_species_03, mesa_codex_species_04; elite: none |   |
| mesa_codex_dungeon_room_03 | The Rain Archive Door: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: mesa_codex_species_05, mesa_codex_species_06; elite: mesa_codex_species_09 |   |
| mesa_codex_dungeon_room_04 | The Rain Archive Door: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: mesa_codex_species_07, mesa_codex_species_08; elite: none | checkpoint  |
| mesa_codex_dungeon_room_05 | The Rain Archive Door: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: mesa_codex_species_09, mesa_codex_species_10; elite: none |  boss: mesa_codex_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`mesa_codex_trap_01`), jammed latch (`mesa_codex_trap_02`), wet threshold (`mesa_codex_trap_03`), false shelf (`mesa_codex_trap_04`), quiet bell (`mesa_codex_trap_05`), sealed drawer (`mesa_codex_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Dawn Mesa Countday** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| mesa_codex_talent_01 | Mesa Codex Local Ear | 1 | none | mesa_codex_effect_01 |
| mesa_codex_talent_02 | Mesa Codex Careful Hand | 2 | none | mesa_codex_effect_02 |
| mesa_codex_talent_03 | Mesa Codex Route Sense | 3 | none | mesa_codex_effect_03 |
| mesa_codex_talent_04 | Mesa Codex Shared Measure | 4 | none | mesa_codex_effect_04 |
| mesa_codex_talent_05 | Mesa Codex Quiet Craft | 1 | mesa_codex_talent_04 | mesa_codex_effect_05 |
| mesa_codex_talent_06 | Mesa Codex Open Invitation | 2 | none | mesa_codex_effect_06 |
| mesa_codex_talent_07 | Mesa Codex Safe Return | 3 | none | mesa_codex_effect_07 |
| mesa_codex_talent_08 | Mesa Codex Field Note | 4 | none | mesa_codex_effect_08 |
| mesa_codex_talent_09 | Mesa Codex Steady Pace | 1 | mesa_codex_talent_08 | mesa_codex_effect_09 |
| mesa_codex_talent_10 | Mesa Codex Clear Signal | 2 | none | mesa_codex_effect_10 |
| mesa_codex_talent_11 | Mesa Codex Warm Welcome | 3 | none | mesa_codex_effect_11 |
| mesa_codex_talent_12 | Mesa Codex Small Courage | 4 | none | mesa_codex_effect_12 |
| mesa_codex_talent_13 | Mesa Codex Repair Habit | 1 | mesa_codex_talent_12 | mesa_codex_effect_13 |
| mesa_codex_talent_14 | Mesa Codex Trust Mark | 2 | none | mesa_codex_effect_14 |
| mesa_codex_talent_15 | Mesa Codex Second Look | 3 | none | mesa_codex_effect_15 |
| mesa_codex_talent_16 | Mesa Codex Closing Grace | 4 | none | mesa_codex_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| mesa_codex_contract_01 | Mesa Codex Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| mesa_codex_contract_02 | Mesa Codex Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| mesa_codex_contract_03 | Mesa Codex Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| mesa_codex_contract_04 | Mesa Codex Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| mesa_codex_contract_05 | Mesa Codex Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| mesa_codex_contract_06 | Mesa Codex Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| mesa_codex_contract_07 | Mesa Codex Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| mesa_codex_contract_08 | Mesa Codex Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| mesa_codex_interact_01 | Stone Calendar bench | rest | mesa_codex_place_01 |
| mesa_codex_interact_02 | Cactus Gate cabinet | repair | mesa_codex_place_02 |
| mesa_codex_interact_03 | Painted Well rack | tend | mesa_codex_place_03 |
| mesa_codex_interact_04 | Dawn Mesa kettle | craft | mesa_codex_place_04 |
| mesa_codex_interact_05 | Terrace Walk ledger | cook | mesa_codex_place_05 |
| mesa_codex_interact_06 | Shade Court rail | bind_inn | mesa_codex_place_06 |
| mesa_codex_interact_07 | Rain Archive bell | inspect | mesa_codex_place_07 |
| mesa_codex_interact_08 | Copper Steps board | open | mesa_codex_place_08 |
| mesa_codex_interact_09 | Stone Calendar table | carry | mesa_codex_place_01 |
| mesa_codex_interact_10 | Cactus Gate lamp | clean | mesa_codex_place_02 |
| mesa_codex_interact_11 | Painted Well gate | signal | mesa_codex_place_03 |
| mesa_codex_interact_12 | Dawn Mesa shelf | record | mesa_codex_place_04 |


**Default interior graph.** `mesa_codex_interior_01` enters from `mesa_codex_place_08` and contains 7 connected rooms: Mesa Codex Entry, Mesa Codex Main Room, Mesa Codex Work Nook, Mesa Codex Window Room, Mesa Codex Quiet Room, Mesa Codex Storage, Mesa Codex Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | stone, cactus, painted, dawn materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Mesa Codex` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Mesa Codex and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Mesa Codex: distant work, a room tone, a gentle rhythm that belongs to Stone Calendar, and a second layer that makes the route toward Shade Court feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Mesa Codex Ledger |
| 2 | Mesa Codex Route |
| 3 | Mesa Codex Work |
| 4 | Mesa Codex Talk |
| 5 | Mesa Codex Kit |
| 6 | Mesa Codex Pack |
| 7 | Mesa Codex Rest |
| 8 | Mesa Codex Safety |
| 9 | Mesa Codex Map |
| 10 | Mesa Codex Notice |
| 11 | Mesa Codex Favour |
| 12 | Mesa Codex Gold |
| 13 | Mesa Codex Token |
| 14 | Mesa Codex Record |
| 15 | Mesa Codex Instance |
| 16 | Mesa Codex Checkpoint |
| 17 | Mesa Codex Choice |
| 18 | Mesa Codex Help |
| 19 | Mesa Codex Calendar |
| 20 | Mesa Codex Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Stone Calendar, a small promise has your name on it. |
| 2 | At Cactus Gate, a small promise has your name on it. |
| 3 | At Painted Well, a small promise has your name on it. |
| 4 | At Dawn Mesa, a small promise has your name on it. |
| 5 | At Terrace Walk, a small promise has your name on it. |
| 6 | At Shade Court, a small promise has your name on it. |
| 7 | At Rain Archive, a small promise has your name on it. |
| 8 | At Copper Steps, a small promise has your name on it. |
| 9 | At Stone Calendar, a small promise has your name on it. |
| 10 | At Cactus Gate, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is original highland calendar-city stewardship. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
