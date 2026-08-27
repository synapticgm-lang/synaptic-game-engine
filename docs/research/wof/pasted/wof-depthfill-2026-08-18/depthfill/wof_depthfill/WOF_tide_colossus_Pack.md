# WOF Tide Colossus: Full Start-Depth Pack

> **Release truth.** Tide Colossus is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `tide_colossus` |
| Display name | **Tide Colossus** |
| One-line pitch | Shore-titan hunt and coastal defense. |
| Maturity | **teen** |
| rulesModuleId | `colossus_part` |
| Theme Kit | **Tide Colossus Theme Kit**, included with world entitlement |
| Genre pattern and fence | Shore-titan hunt and coastal defense. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Tide Colossus is a WOF text world about shore-titan hunt and coastal defense. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Attack on Titan named place |
| 2 | Monster Hunter hero silhouette |
| 3 | Godzilla logo geometry |
| 4 | Pacific Rim catchphrase |
| 5 | Shadow of the Colossus signature costume |
| 6 | Dauntless proprietary creature |
| 7 | Kaiju No 8 map layout |
| 8 | ARK faction title |
| 9 | Horizon machines weapon profile |
| 10 | Troll Hunter UI chrome |
| 11 | Attack on Titan quest premise |
| 12 | Monster Hunter title typography |
| 13 | Godzilla color-coded insignia |
| 14 | Pacific Rim music motif |
| 15 | Shadow of the Colossus vehicle or mount profile |
| 16 | Dauntless companion anatomy |
| 17 | Kaiju No 8 named artifact |
| 18 | ARK school or agency badge |
| 19 | Horizon machines real sacred practice as minigame |
| 20 | Troll Hunter stereotyped cultural shorthand |
| 21 | Attack on Titan real-person likeness |
| 22 | Monster Hunter copied dialogue cadence |
| 23 | Godzilla fan-server slogan |
| 24 | Pacific Rim paid power framing |
| 25 | Shadow of the Colossus loot-box presentation |
| 26 | Dauntless named place |
| 27 | Kaiju No 8 hero silhouette |
| 28 | ARK logo geometry |
| 29 | Horizon machines catchphrase |
| 30 | Troll Hunter signature costume |
| 31 | Attack on Titan proprietary creature |
| 32 | Monster Hunter map layout |
| 33 | Godzilla faction title |
| 34 | Pacific Rim weapon profile |
| 35 | Shadow of the Colossus UI chrome |
| 36 | Dauntless quest premise |
| 37 | Kaiju No 8 title typography |
| 38 | ARK color-coded insignia |
| 39 | Horizon machines music motif |
| 40 | Troll Hunter vehicle or mount profile |
| 41 | Attack on Titan companion anatomy |
| 42 | Monster Hunter named artifact |
| 43 | Godzilla school or agency badge |
| 44 | Pacific Rim real sacred practice as minigame |
| 45 | Shadow of the Colossus stereotyped cultural shorthand |
| 46 | Dauntless real-person likeness |
| 47 | Kaiju No 8 copied dialogue cadence |
| 48 | ARK fan-server slogan |
| 49 | Horizon machines paid power framing |
| 50 | Troll Hunter loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | hp, partState, stagger, shelter, supplies, huntMarks, lockout, rescue |
| Wipe and checkpoint | Wipe returns the party to `tide_colossus_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Tide Colossus • {{turn}} • committed |
| 2 | [Route] Tide Colossus • {{placeId}} • committed |
| 3 | [Work] Tide Colossus • {{lastAction}} • committed |
| 4 | [Talk] Tide Colossus • {{npcId}} • committed |
| 5 | [Kit] Tide Colossus • {{kitId}} • committed |
| 6 | [Pack] Tide Colossus • {{partySize}} • committed |
| 7 | [Rest] Tide Colossus • {{checkpoint}} • committed |
| 8 | [Safety] Tide Colossus • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tide_colossus_kit_01 | Part Surveyor | part surveyor workwear | practice part surveyor | Never use part surveyor authority to remove another person’s choice. | Use the local rhythm of Tide Colossus and make every offer concrete. | part_surveyor mantle; part_surveyor tool; tide_colossus_map_01 | tide_colossus_place_01; tide_colossus_q_01 | tide_colossus_ability_01 |
| tide_colossus_kit_02 | Anchor Striker | anchor striker workwear | practice anchor striker | Never use anchor striker authority to remove another person’s choice. | Use the local rhythm of Tide Colossus and make every offer concrete. | anchor_striker vest; anchor_striker tool; tide_colossus_map_02 | tide_colossus_place_02; tide_colossus_q_02 | tide_colossus_ability_02 |
| tide_colossus_kit_03 | Foam Chirurgeon | foam chirurgeon workwear | practice foam chirurgeon | Never use foam chirurgeon authority to remove another person’s choice. | Use the local rhythm of Tide Colossus and make every offer concrete. | foam_chirurgeon jacket; foam_chirurgeon tool; tide_colossus_map_03 | tide_colossus_place_01; tide_colossus_q_03 | tide_colossus_ability_03 |
| tide_colossus_kit_04 | Buoy Caller | buoy caller workwear | practice buoy caller | Never use buoy caller authority to remove another person’s choice. | Use the local rhythm of Tide Colossus and make every offer concrete. | buoy_caller sash; buoy_caller tool; tide_colossus_map_04 | tide_colossus_place_02; tide_colossus_q_04 | tide_colossus_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `tide_colossus_place_01` is a shared hub rather than a capital analogue; `tide_colossus_place_04` is the mid-join; `tide_colossus_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tide_colossus_place_01 | Breakwater Camp | shared hub | street | safe | yes | tide_colossus_place_02, tide_colossus_place_04 | A public notice at Breakwater Camp has been posted with one crucial line washed away. |
| tide_colossus_place_02 | Titan Sound | start hub | street | safe | yes | tide_colossus_place_01, tide_colossus_place_03 | A work roster at Titan Sound leaves two neighbours believing they were promised the same task. |
| tide_colossus_place_03 | Anchor Cliff | street route | street | safe | yes | tide_colossus_place_02, tide_colossus_place_04 | A route marker at Anchor Cliff points visitors toward a closed gate and needs a safe correction. |
| tide_colossus_place_04 | Foam Chapel | mid join | street | low | yes | tide_colossus_place_03, tide_colossus_place_05, tide_colossus_place_01 | A newcomer at Foam Chapel needs a local introduction before a small obligation becomes embarrassing. |
| tide_colossus_place_05 | Gullbone Reach | work district | interior | low | no | tide_colossus_place_04, tide_colossus_place_06 | A shared tool at Gullbone Reach has been returned without its care tag. |
| tide_colossus_place_06 | Saltstone Yard | instance door | dungeon | medium | no | tide_colossus_place_05, tide_colossus_place_07 | The entry record at Saltstone Yard names an unfinished errand, not a monster or apocalypse. |
| tide_colossus_place_07 | Warden Buoy | wild edge | street | medium | yes | tide_colossus_place_06, tide_colossus_place_08 | A weather change at Warden Buoy threatens a community plan unless someone reads the signs. |
| tide_colossus_place_08 | Mastroot Cave | housing approach | interior | low | no | tide_colossus_place_07 | A resident at Mastroot Cave has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| tide_colossus_npc_01 | Dessa Quill | tide_colossus_place_01 | quest | Dessa Quill says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Dessa Quill offers a specific task at Breakwater Camp: settle the practical mismatch before it costs someone a shift. | Dessa Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_02 | Eris Vale | tide_colossus_place_02 | profession | Eris Vale says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Eris Vale offers a specific task at Titan Sound: settle the practical mismatch before it costs someone a shift. | Eris Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_03 | Fenn Wren | tide_colossus_place_03 | hub | Fenn Wren says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Fenn Wren offers a specific task at Anchor Cliff: settle the practical mismatch before it costs someone a shift. | Fenn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_04 | Gala Morrow | tide_colossus_place_04 | merchant | Gala Morrow says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Gala Morrow offers a specific task at Foam Chapel: settle the practical mismatch before it costs someone a shift. | Gala Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_05 | Holl Rowan | tide_colossus_place_01 | local | Holl Rowan says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Holl Rowan offers a specific task at Breakwater Camp: settle the practical mismatch before it costs someone a shift. | Holl Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_06 | Ivo Nook | tide_colossus_place_02 | host | Ivo Nook says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Ivo Nook offers a specific task at Titan Sound: settle the practical mismatch before it costs someone a shift. | Ivo Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_07 | Jori Cress | tide_colossus_place_03 | quest | Jori Cress says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Jori Cress offers a specific task at Anchor Cliff: settle the practical mismatch before it costs someone a shift. | Jori Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_08 | Alden Silt | tide_colossus_place_04 | profession | Alden Silt says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Alden Silt offers a specific task at Foam Chapel: settle the practical mismatch before it costs someone a shift. | Alden Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_09 | Bryn Pryce | tide_colossus_place_01 | local | Bryn Pryce says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Bryn Pryce offers a specific task at Breakwater Camp: settle the practical mismatch before it costs someone a shift. | Bryn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| tide_colossus_npc_10 | Cato Vane | tide_colossus_place_02 | merchant | Cato Vane says, ‘Tide Colossus keeps its promises in small places. Tell me which one you noticed.’ | Cato Vane offers a specific task at Titan Sound: settle the practical mismatch before it costs someone a shift. | Cato Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Foam Chapel, if that is useful. |
| 2 | Tide Colossus feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Saltstone Yard. |
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
| Part Surveyor | At Breakwater Camp, you arrive in part_surveyor mantle carrying tide_colossus_map_01. A small obligation is already late. | Give up one turn to help now. | Tide Colossus: Name a Working Promise |
| Anchor Striker | At Titan Sound, you arrive in anchor_striker vest carrying tide_colossus_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Tide Colossus: Set the First Tool Aside |
| Foam Chirurgeon | At Breakwater Camp, you arrive in foam_chirurgeon jacket carrying tide_colossus_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Tide Colossus: Carry the Right Record |
| Buoy Caller | At Titan Sound, you arrive in buoy_caller sash carrying tide_colossus_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Tide Colossus: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_tide_colossus_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Breakwater Camp’s small mismatch | ask | missing tag | A local need at Foam Chapel is connected but not catastrophic. | alternate talk |
| 2 | Resolve Titan Sound’s small mismatch | repair | closed path | A local need at Gullbone Reach is connected but not catastrophic. | new route |
| 3 | Resolve Anchor Cliff’s small mismatch | carry | unclear note | A local need at Saltstone Yard is connected but not catastrophic. | recorded favor |
| 4 | Resolve Foam Chapel’s small mismatch | listen | late guest | A local need at Warden Buoy is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Gullbone Reach’s small mismatch | map | wet weather | A local need at Mastroot Cave is connected but not catastrophic. | slower reward |
| 6 | Resolve Saltstone Yard’s small mismatch | prepare | busy shift | A local need at Breakwater Camp is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Warden Buoy’s small mismatch | wait | quiet boundary | A local need at Titan Sound is connected but not catastrophic. | solo option |
| 8 | Resolve Mastroot Cave’s small mismatch | return | wrong room | A local need at Anchor Cliff is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Hollow-Shelled Bell` and `Soundbreaker Vigil`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| tide_colossus_q_01 | Tide Colossus: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| tide_colossus_q_02 | Tide Colossus: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| tide_colossus_q_03 | Tide Colossus: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| tide_colossus_q_04 | Tide Colossus: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| tide_colossus_q_05 | Tide Colossus: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| tide_colossus_q_06 | Tide Colossus: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| tide_colossus_q_07 | Tide Colossus: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| tide_colossus_q_08 | Tide Colossus: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| tide_colossus_q_09 | Tide Colossus: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| tide_colossus_q_10 | Tide Colossus: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| tide_colossus_q_11 | Tide Colossus: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| tide_colossus_q_12 | Tide Colossus: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| tide_colossus_q_13 | Tide Colossus: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| tide_colossus_q_14 | Tide Colossus: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| tide_colossus_q_15 | Tide Colossus: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| tide_colossus_q_16 | Tide Colossus: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| tide_colossus_q_17 | Tide Colossus: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| tide_colossus_q_18 | Tide Colossus: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| tide_colossus_q_19 | Tide Colossus: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| tide_colossus_q_20 | Tide Colossus: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| tide_colossus_q_21 | Tide Colossus: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| tide_colossus_q_22 | Tide Colossus: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| tide_colossus_q_23 | Tide Colossus: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| tide_colossus_q_24 | Tide Colossus: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| tide_colossus_q_25 | Tide Colossus: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Breakwater Camp`: write `tide_colossus_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Foam Chapel`: write `tide_colossus_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `tide_colossus_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| tide_colossus_species_01 | Shell Titan | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_02 | Reed Giant | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_03 | Stormback | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_04 | Mud Oracle | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_05 | Tide Colossus Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_06 | Tide Colossus Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_07 | Tide Colossus Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_08 | Tide Colossus Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_09 | Tide Colossus Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_10 | Tide Colossus Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_11 | Tide Colossus Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_12 | Tide Colossus Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_13 | Tide Colossus Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_14 | Tide Colossus Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_15 | Tide Colossus Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_16 | Tide Colossus Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_17 | Tide Colossus Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| tide_colossus_species_18 | Tide Colossus Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Anchor Crowns**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Foam Pennants**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Breakwater Camp token, Titan Sound tool, Anchor Cliff thread, Foam Chapel seal, Gullbone Reach bundle, Saltstone Yard token. |
| Instance and cosmetic templates | Warden Buoy tool, Mastroot Cave thread, Breakwater Camp seal, Titan Sound bundle, Anchor Cliff token, Foam Chapel tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `tide_colossus_vendor_01` at `tide_colossus_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| tide_colossus_dungeon_room_01 | The Hollow-Shelled Bell: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: tide_colossus_species_01, tide_colossus_species_02; elite: none |   |
| tide_colossus_dungeon_room_02 | The Hollow-Shelled Bell: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: tide_colossus_species_03, tide_colossus_species_04; elite: none |   |
| tide_colossus_dungeon_room_03 | The Hollow-Shelled Bell: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: tide_colossus_species_05, tide_colossus_species_06; elite: tide_colossus_species_09 |   |
| tide_colossus_dungeon_room_04 | The Hollow-Shelled Bell: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: tide_colossus_species_07, tide_colossus_species_08; elite: none | checkpoint  |
| tide_colossus_dungeon_room_05 | The Hollow-Shelled Bell: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: tide_colossus_species_09, tide_colossus_species_10; elite: none |  boss: tide_colossus_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`tide_colossus_trap_01`), jammed latch (`tide_colossus_trap_02`), wet threshold (`tide_colossus_trap_03`), false shelf (`tide_colossus_trap_04`), quiet bell (`tide_colossus_trap_05`), sealed drawer (`tide_colossus_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Soundbreaker Vigil** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| tide_colossus_talent_01 | Tide Colossus Local Ear | 1 | none | tide_colossus_effect_01 |
| tide_colossus_talent_02 | Tide Colossus Careful Hand | 2 | none | tide_colossus_effect_02 |
| tide_colossus_talent_03 | Tide Colossus Route Sense | 3 | none | tide_colossus_effect_03 |
| tide_colossus_talent_04 | Tide Colossus Shared Measure | 4 | none | tide_colossus_effect_04 |
| tide_colossus_talent_05 | Tide Colossus Quiet Craft | 1 | tide_colossus_talent_04 | tide_colossus_effect_05 |
| tide_colossus_talent_06 | Tide Colossus Open Invitation | 2 | none | tide_colossus_effect_06 |
| tide_colossus_talent_07 | Tide Colossus Safe Return | 3 | none | tide_colossus_effect_07 |
| tide_colossus_talent_08 | Tide Colossus Field Note | 4 | none | tide_colossus_effect_08 |
| tide_colossus_talent_09 | Tide Colossus Steady Pace | 1 | tide_colossus_talent_08 | tide_colossus_effect_09 |
| tide_colossus_talent_10 | Tide Colossus Clear Signal | 2 | none | tide_colossus_effect_10 |
| tide_colossus_talent_11 | Tide Colossus Warm Welcome | 3 | none | tide_colossus_effect_11 |
| tide_colossus_talent_12 | Tide Colossus Small Courage | 4 | none | tide_colossus_effect_12 |
| tide_colossus_talent_13 | Tide Colossus Repair Habit | 1 | tide_colossus_talent_12 | tide_colossus_effect_13 |
| tide_colossus_talent_14 | Tide Colossus Trust Mark | 2 | none | tide_colossus_effect_14 |
| tide_colossus_talent_15 | Tide Colossus Second Look | 3 | none | tide_colossus_effect_15 |
| tide_colossus_talent_16 | Tide Colossus Closing Grace | 4 | none | tide_colossus_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| tide_colossus_contract_01 | Tide Colossus Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| tide_colossus_contract_02 | Tide Colossus Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| tide_colossus_contract_03 | Tide Colossus Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| tide_colossus_contract_04 | Tide Colossus Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| tide_colossus_contract_05 | Tide Colossus Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| tide_colossus_contract_06 | Tide Colossus Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| tide_colossus_contract_07 | Tide Colossus Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| tide_colossus_contract_08 | Tide Colossus Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| tide_colossus_interact_01 | Breakwater Camp bench | rest | tide_colossus_place_01 |
| tide_colossus_interact_02 | Titan Sound cabinet | repair | tide_colossus_place_02 |
| tide_colossus_interact_03 | Anchor Cliff rack | tend | tide_colossus_place_03 |
| tide_colossus_interact_04 | Foam Chapel kettle | craft | tide_colossus_place_04 |
| tide_colossus_interact_05 | Gullbone Reach ledger | cook | tide_colossus_place_05 |
| tide_colossus_interact_06 | Saltstone Yard rail | bind_inn | tide_colossus_place_06 |
| tide_colossus_interact_07 | Warden Buoy bell | inspect | tide_colossus_place_07 |
| tide_colossus_interact_08 | Mastroot Cave board | open | tide_colossus_place_08 |
| tide_colossus_interact_09 | Breakwater Camp table | carry | tide_colossus_place_01 |
| tide_colossus_interact_10 | Titan Sound lamp | clean | tide_colossus_place_02 |
| tide_colossus_interact_11 | Anchor Cliff gate | signal | tide_colossus_place_03 |
| tide_colossus_interact_12 | Foam Chapel shelf | record | tide_colossus_place_04 |


**Default interior graph.** `tide_colossus_interior_01` enters from `tide_colossus_place_08` and contains 7 connected rooms: Tide Colossus Entry, Tide Colossus Main Room, Tide Colossus Work Nook, Tide Colossus Window Room, Tide Colossus Quiet Room, Tide Colossus Storage, Tide Colossus Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | breakwater, titan, anchor, foam materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Tide Colossus` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Tide Colossus and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Tide Colossus: distant work, a room tone, a gentle rhythm that belongs to Breakwater Camp, and a second layer that makes the route toward Saltstone Yard feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Tide Colossus Ledger |
| 2 | Tide Colossus Route |
| 3 | Tide Colossus Work |
| 4 | Tide Colossus Talk |
| 5 | Tide Colossus Kit |
| 6 | Tide Colossus Pack |
| 7 | Tide Colossus Rest |
| 8 | Tide Colossus Safety |
| 9 | Tide Colossus Map |
| 10 | Tide Colossus Notice |
| 11 | Tide Colossus Favour |
| 12 | Tide Colossus Gold |
| 13 | Tide Colossus Token |
| 14 | Tide Colossus Record |
| 15 | Tide Colossus Instance |
| 16 | Tide Colossus Checkpoint |
| 17 | Tide Colossus Choice |
| 18 | Tide Colossus Help |
| 19 | Tide Colossus Calendar |
| 20 | Tide Colossus Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Breakwater Camp, a small promise has your name on it. |
| 2 | At Titan Sound, a small promise has your name on it. |
| 3 | At Anchor Cliff, a small promise has your name on it. |
| 4 | At Foam Chapel, a small promise has your name on it. |
| 5 | At Gullbone Reach, a small promise has your name on it. |
| 6 | At Saltstone Yard, a small promise has your name on it. |
| 7 | At Warden Buoy, a small promise has your name on it. |
| 8 | At Mastroot Cave, a small promise has your name on it. |
| 9 | At Breakwater Camp, a small promise has your name on it. |
| 10 | At Titan Sound, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is shore-titan hunt and coastal defense. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
