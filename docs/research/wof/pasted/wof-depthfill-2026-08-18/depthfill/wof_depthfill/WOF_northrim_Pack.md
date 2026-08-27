# WOF Northrim: Full Start-Depth Pack

> **Release truth.** Northrim is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `northrim` |
| Display name | **Northrim** |
| One-line pitch | Winter covenant and sea-king fellowship. |
| Maturity | **teen** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Northrim Theme Kit**, included with world entitlement |
| Genre pattern and fence | Winter covenant and sea-king fellowship. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Northrim is a WOF text world about winter covenant and sea-king fellowship. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | God of War Norse named place |
| 2 | Assassins Creed Valhalla hero silhouette |
| 3 | Skyrim logo geometry |
| 4 | Vikings TV catchphrase |
| 5 | How to Train Your Dragon signature costume |
| 6 | The Northman proprietary creature |
| 7 | Marvel Thor map layout |
| 8 | Frozen faction title |
| 9 | RuneScape Fremennik weapon profile |
| 10 | Valheim UI chrome |
| 11 | God of War Norse quest premise |
| 12 | Assassins Creed Valhalla title typography |
| 13 | Skyrim color-coded insignia |
| 14 | Vikings TV music motif |
| 15 | How to Train Your Dragon vehicle or mount profile |
| 16 | The Northman companion anatomy |
| 17 | Marvel Thor named artifact |
| 18 | Frozen school or agency badge |
| 19 | RuneScape Fremennik real sacred practice as minigame |
| 20 | Valheim stereotyped cultural shorthand |
| 21 | God of War Norse real-person likeness |
| 22 | Assassins Creed Valhalla copied dialogue cadence |
| 23 | Skyrim fan-server slogan |
| 24 | Vikings TV paid power framing |
| 25 | How to Train Your Dragon loot-box presentation |
| 26 | The Northman named place |
| 27 | Marvel Thor hero silhouette |
| 28 | Frozen logo geometry |
| 29 | RuneScape Fremennik catchphrase |
| 30 | Valheim signature costume |
| 31 | God of War Norse proprietary creature |
| 32 | Assassins Creed Valhalla map layout |
| 33 | Skyrim faction title |
| 34 | Vikings TV weapon profile |
| 35 | How to Train Your Dragon UI chrome |
| 36 | The Northman quest premise |
| 37 | Marvel Thor title typography |
| 38 | Frozen color-coded insignia |
| 39 | RuneScape Fremennik music motif |
| 40 | Valheim vehicle or mount profile |
| 41 | God of War Norse companion anatomy |
| 42 | Assassins Creed Valhalla named artifact |
| 43 | Skyrim school or agency badge |
| 44 | Vikings TV real sacred practice as minigame |
| 45 | How to Train Your Dragon stereotyped cultural shorthand |
| 46 | The Northman real-person likeness |
| 47 | Marvel Thor copied dialogue cadence |
| 48 | Frozen fan-server slogan |
| 49 | RuneScape Fremennik paid power framing |
| 50 | Valheim loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `northrim_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Northrim • {{turn}} • committed |
| 2 | [Route] Northrim • {{placeId}} • committed |
| 3 | [Work] Northrim • {{lastAction}} • committed |
| 4 | [Talk] Northrim • {{npcId}} • committed |
| 5 | [Kit] Northrim • {{kitId}} • committed |
| 6 | [Pack] Northrim • {{partySize}} • committed |
| 7 | [Rest] Northrim • {{checkpoint}} • committed |
| 8 | [Safety] Northrim • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| northrim_kit_01 | Oar Cantor | oar cantor workwear | practice oar cantor | Never use oar cantor authority to remove another person’s choice. | Use the local rhythm of Northrim and make every offer concrete. | oar_cantor mantle; oar_cantor tool; northrim_map_01 | northrim_place_01; northrim_q_01 | northrim_ability_01 |
| northrim_kit_02 | Rime Accountant | rime accountant workwear | practice rime accountant | Never use rime accountant authority to remove another person’s choice. | Use the local rhythm of Northrim and make every offer concrete. | rime_accountant vest; rime_accountant tool; northrim_map_02 | northrim_place_02; northrim_q_02 | northrim_ability_02 |
| northrim_kit_03 | Pine Hearthguard | pine hearthguard workwear | practice pine hearthguard | Never use pine hearthguard authority to remove another person’s choice. | Use the local rhythm of Northrim and make every offer concrete. | pine_hearthguard jacket; pine_hearthguard tool; northrim_map_03 | northrim_place_01; northrim_q_03 | northrim_ability_03 |
| northrim_kit_04 | Whale-Road Listener | whale-road listener workwear | practice whale-road listener | Never use whale-road listener authority to remove another person’s choice. | Use the local rhythm of Northrim and make every offer concrete. | whale_road_listener sash; whale_road_listener tool; northrim_map_04 | northrim_place_02; northrim_q_04 | northrim_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `northrim_place_01` is a shared hub rather than a capital analogue; `northrim_place_04` is the mid-join; `northrim_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| northrim_place_01 | Frostwharf | shared hub | street | safe | yes | northrim_place_02, northrim_place_04 | A public notice at Frostwharf has been posted with one crucial line washed away. |
| northrim_place_02 | Whale Road | start hub | street | safe | yes | northrim_place_01, northrim_place_03 | A work roster at Whale Road leaves two neighbours believing they were promised the same task. |
| northrim_place_03 | Pine Hall | street route | street | safe | yes | northrim_place_02, northrim_place_04 | A route marker at Pine Hall points visitors toward a closed gate and needs a safe correction. |
| northrim_place_04 | Rime Barrow | mid join | street | low | yes | northrim_place_03, northrim_place_05, northrim_place_01 | A newcomer at Rime Barrow needs a local introduction before a small obligation becomes embarrassing. |
| northrim_place_05 | Fathom Steps | work district | interior | low | no | northrim_place_04, northrim_place_06 | A shared tool at Fathom Steps has been returned without its care tag. |
| northrim_place_06 | Hearth Ice | instance door | dungeon | medium | no | northrim_place_05, northrim_place_07 | The entry record at Hearth Ice names an unfinished errand, not a monster or apocalypse. |
| northrim_place_07 | Oarstone Quay | wild edge | street | medium | yes | northrim_place_06, northrim_place_08 | A weather change at Oarstone Quay threatens a community plan unless someone reads the signs. |
| northrim_place_08 | Wolfglass Point | housing approach | interior | low | no | northrim_place_07 | A resident at Wolfglass Point has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| northrim_npc_01 | Ivo Nook | northrim_place_01 | quest | Ivo Nook says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Ivo Nook offers a specific task at Frostwharf: settle the practical mismatch before it costs someone a shift. | Ivo Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_02 | Jori Cress | northrim_place_02 | profession | Jori Cress says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Jori Cress offers a specific task at Whale Road: settle the practical mismatch before it costs someone a shift. | Jori Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_03 | Alden Silt | northrim_place_03 | hub | Alden Silt says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Alden Silt offers a specific task at Pine Hall: settle the practical mismatch before it costs someone a shift. | Alden Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_04 | Bryn Pryce | northrim_place_04 | merchant | Bryn Pryce says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Bryn Pryce offers a specific task at Rime Barrow: settle the practical mismatch before it costs someone a shift. | Bryn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_05 | Cato Vane | northrim_place_01 | local | Cato Vane says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Cato Vane offers a specific task at Frostwharf: settle the practical mismatch before it costs someone a shift. | Cato Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_06 | Dessa Quill | northrim_place_02 | host | Dessa Quill says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Dessa Quill offers a specific task at Whale Road: settle the practical mismatch before it costs someone a shift. | Dessa Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_07 | Eris Vale | northrim_place_03 | quest | Eris Vale says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Eris Vale offers a specific task at Pine Hall: settle the practical mismatch before it costs someone a shift. | Eris Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_08 | Fenn Wren | northrim_place_04 | profession | Fenn Wren says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Fenn Wren offers a specific task at Rime Barrow: settle the practical mismatch before it costs someone a shift. | Fenn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_09 | Gala Morrow | northrim_place_01 | local | Gala Morrow says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Gala Morrow offers a specific task at Frostwharf: settle the practical mismatch before it costs someone a shift. | Gala Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| northrim_npc_10 | Holl Rowan | northrim_place_02 | merchant | Holl Rowan says, ‘Northrim keeps its promises in small places. Tell me which one you noticed.’ | Holl Rowan offers a specific task at Whale Road: settle the practical mismatch before it costs someone a shift. | Holl Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Rime Barrow, if that is useful. |
| 2 | Northrim feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Hearth Ice. |
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
| Oar Cantor | At Frostwharf, you arrive in oar_cantor mantle carrying northrim_map_01. A small obligation is already late. | Give up one turn to help now. | Northrim: Name a Working Promise |
| Rime Accountant | At Whale Road, you arrive in rime_accountant vest carrying northrim_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Northrim: Set the First Tool Aside |
| Pine Hearthguard | At Frostwharf, you arrive in pine_hearthguard jacket carrying northrim_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Northrim: Carry the Right Record |
| Whale-Road Listener | At Whale Road, you arrive in whale_road_listener sash carrying northrim_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Northrim: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_northrim_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Frostwharf’s small mismatch | ask | missing tag | A local need at Rime Barrow is connected but not catastrophic. | alternate talk |
| 2 | Resolve Whale Road’s small mismatch | repair | closed path | A local need at Fathom Steps is connected but not catastrophic. | new route |
| 3 | Resolve Pine Hall’s small mismatch | carry | unclear note | A local need at Hearth Ice is connected but not catastrophic. | recorded favor |
| 4 | Resolve Rime Barrow’s small mismatch | listen | late guest | A local need at Oarstone Quay is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Fathom Steps’s small mismatch | map | wet weather | A local need at Wolfglass Point is connected but not catastrophic. | slower reward |
| 6 | Resolve Hearth Ice’s small mismatch | prepare | busy shift | A local need at Frostwharf is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Oarstone Quay’s small mismatch | wait | quiet boundary | A local need at Whale Road is connected but not catastrophic. | solo option |
| 8 | Resolve Wolfglass Point’s small mismatch | return | wrong room | A local need at Pine Hall is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Barrow of Borrowed Warmth` and `Frostwharf Oathnight`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| northrim_q_01 | Northrim: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| northrim_q_02 | Northrim: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| northrim_q_03 | Northrim: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| northrim_q_04 | Northrim: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| northrim_q_05 | Northrim: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| northrim_q_06 | Northrim: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| northrim_q_07 | Northrim: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| northrim_q_08 | Northrim: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| northrim_q_09 | Northrim: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| northrim_q_10 | Northrim: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| northrim_q_11 | Northrim: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| northrim_q_12 | Northrim: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| northrim_q_13 | Northrim: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| northrim_q_14 | Northrim: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| northrim_q_15 | Northrim: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| northrim_q_16 | Northrim: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| northrim_q_17 | Northrim: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| northrim_q_18 | Northrim: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| northrim_q_19 | Northrim: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| northrim_q_20 | Northrim: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| northrim_q_21 | Northrim: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| northrim_q_22 | Northrim: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| northrim_q_23 | Northrim: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| northrim_q_24 | Northrim: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| northrim_q_25 | Northrim: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Frostwharf`: write `northrim_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Rime Barrow`: write `northrim_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `northrim_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| northrim_species_01 | Ice Gull | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_02 | Fjord Elk | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_03 | Sealwolf | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_04 | Ember Tern | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_05 | Northrim Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_06 | Northrim Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_07 | Northrim Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_08 | Northrim Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_09 | Northrim Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_10 | Northrim Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_11 | Northrim Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_12 | Northrim Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_13 | Northrim Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_14 | Northrim Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_15 | Northrim Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_16 | Northrim Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_17 | Northrim Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| northrim_species_18 | Northrim Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Fjord Pennies**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Rime Runes**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Frostwharf token, Whale Road tool, Pine Hall thread, Rime Barrow seal, Fathom Steps bundle, Hearth Ice token. |
| Instance and cosmetic templates | Oarstone Quay tool, Wolfglass Point thread, Frostwharf seal, Whale Road bundle, Pine Hall token, Rime Barrow tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `northrim_vendor_01` at `northrim_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| northrim_dungeon_room_01 | The Barrow of Borrowed Warmth: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: northrim_species_01, northrim_species_02; elite: none |   |
| northrim_dungeon_room_02 | The Barrow of Borrowed Warmth: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: northrim_species_03, northrim_species_04; elite: none |   |
| northrim_dungeon_room_03 | The Barrow of Borrowed Warmth: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: northrim_species_05, northrim_species_06; elite: northrim_species_09 |   |
| northrim_dungeon_room_04 | The Barrow of Borrowed Warmth: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: northrim_species_07, northrim_species_08; elite: none | checkpoint  |
| northrim_dungeon_room_05 | The Barrow of Borrowed Warmth: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: northrim_species_09, northrim_species_10; elite: none |  boss: northrim_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`northrim_trap_01`), jammed latch (`northrim_trap_02`), wet threshold (`northrim_trap_03`), false shelf (`northrim_trap_04`), quiet bell (`northrim_trap_05`), sealed drawer (`northrim_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Frostwharf Oathnight** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| northrim_talent_01 | Northrim Local Ear | 1 | none | northrim_effect_01 |
| northrim_talent_02 | Northrim Careful Hand | 2 | none | northrim_effect_02 |
| northrim_talent_03 | Northrim Route Sense | 3 | none | northrim_effect_03 |
| northrim_talent_04 | Northrim Shared Measure | 4 | none | northrim_effect_04 |
| northrim_talent_05 | Northrim Quiet Craft | 1 | northrim_talent_04 | northrim_effect_05 |
| northrim_talent_06 | Northrim Open Invitation | 2 | none | northrim_effect_06 |
| northrim_talent_07 | Northrim Safe Return | 3 | none | northrim_effect_07 |
| northrim_talent_08 | Northrim Field Note | 4 | none | northrim_effect_08 |
| northrim_talent_09 | Northrim Steady Pace | 1 | northrim_talent_08 | northrim_effect_09 |
| northrim_talent_10 | Northrim Clear Signal | 2 | none | northrim_effect_10 |
| northrim_talent_11 | Northrim Warm Welcome | 3 | none | northrim_effect_11 |
| northrim_talent_12 | Northrim Small Courage | 4 | none | northrim_effect_12 |
| northrim_talent_13 | Northrim Repair Habit | 1 | northrim_talent_12 | northrim_effect_13 |
| northrim_talent_14 | Northrim Trust Mark | 2 | none | northrim_effect_14 |
| northrim_talent_15 | Northrim Second Look | 3 | none | northrim_effect_15 |
| northrim_talent_16 | Northrim Closing Grace | 4 | none | northrim_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| northrim_contract_01 | Northrim Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| northrim_contract_02 | Northrim Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| northrim_contract_03 | Northrim Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| northrim_contract_04 | Northrim Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| northrim_contract_05 | Northrim Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| northrim_contract_06 | Northrim Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| northrim_contract_07 | Northrim Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| northrim_contract_08 | Northrim Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| northrim_interact_01 | Frostwharf bench | rest | northrim_place_01 |
| northrim_interact_02 | Whale Road cabinet | repair | northrim_place_02 |
| northrim_interact_03 | Pine Hall rack | tend | northrim_place_03 |
| northrim_interact_04 | Rime Barrow kettle | craft | northrim_place_04 |
| northrim_interact_05 | Fathom Steps ledger | cook | northrim_place_05 |
| northrim_interact_06 | Hearth Ice rail | bind_inn | northrim_place_06 |
| northrim_interact_07 | Oarstone Quay bell | inspect | northrim_place_07 |
| northrim_interact_08 | Wolfglass Point board | open | northrim_place_08 |
| northrim_interact_09 | Frostwharf table | carry | northrim_place_01 |
| northrim_interact_10 | Whale Road lamp | clean | northrim_place_02 |
| northrim_interact_11 | Pine Hall gate | signal | northrim_place_03 |
| northrim_interact_12 | Rime Barrow shelf | record | northrim_place_04 |


**Default interior graph.** `northrim_interior_01` enters from `northrim_place_08` and contains 7 connected rooms: Northrim Entry, Northrim Main Room, Northrim Work Nook, Northrim Window Room, Northrim Quiet Room, Northrim Storage, Northrim Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | frostwharf, whale, pine, rime materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Northrim` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Northrim and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Northrim: distant work, a room tone, a gentle rhythm that belongs to Frostwharf, and a second layer that makes the route toward Hearth Ice feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Northrim Ledger |
| 2 | Northrim Route |
| 3 | Northrim Work |
| 4 | Northrim Talk |
| 5 | Northrim Kit |
| 6 | Northrim Pack |
| 7 | Northrim Rest |
| 8 | Northrim Safety |
| 9 | Northrim Map |
| 10 | Northrim Notice |
| 11 | Northrim Favour |
| 12 | Northrim Gold |
| 13 | Northrim Token |
| 14 | Northrim Record |
| 15 | Northrim Instance |
| 16 | Northrim Checkpoint |
| 17 | Northrim Choice |
| 18 | Northrim Help |
| 19 | Northrim Calendar |
| 20 | Northrim Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Frostwharf, a small promise has your name on it. |
| 2 | At Whale Road, a small promise has your name on it. |
| 3 | At Pine Hall, a small promise has your name on it. |
| 4 | At Rime Barrow, a small promise has your name on it. |
| 5 | At Fathom Steps, a small promise has your name on it. |
| 6 | At Hearth Ice, a small promise has your name on it. |
| 7 | At Oarstone Quay, a small promise has your name on it. |
| 8 | At Wolfglass Point, a small promise has your name on it. |
| 9 | At Frostwharf, a small promise has your name on it. |
| 10 | At Whale Road, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is winter covenant and sea-king fellowship. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
