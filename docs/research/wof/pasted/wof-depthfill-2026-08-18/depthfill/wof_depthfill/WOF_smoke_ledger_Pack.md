# WOF Smoke Ledger: Full Start-Depth Pack

> **Release truth.** Smoke Ledger is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `smoke_ledger` |
| Display name | **Smoke Ledger** |
| One-line pitch | Period-flavored noir cases and moral debts. |
| Maturity | **teen** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Smoke Ledger Theme Kit**, included with world entitlement |
| Genre pattern and fence | Period-flavored noir cases and moral debts. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Smoke Ledger is a WOF text world about period-flavored noir cases and moral debts. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | LA Noire named place |
| 2 | Mafia game hero silhouette |
| 3 | Bioshock logo geometry |
| 4 | The Untouchables catchphrase |
| 5 | Boardwalk Empire signature costume |
| 6 | Peaky Blinders proprietary creature |
| 7 | Chinatown film map layout |
| 8 | Dick Tracy faction title |
| 9 | Batman noir weapon profile |
| 10 | real 1920s politician UI chrome |
| 11 | LA Noire quest premise |
| 12 | Mafia game title typography |
| 13 | Bioshock color-coded insignia |
| 14 | The Untouchables music motif |
| 15 | Boardwalk Empire vehicle or mount profile |
| 16 | Peaky Blinders companion anatomy |
| 17 | Chinatown film named artifact |
| 18 | Dick Tracy school or agency badge |
| 19 | Batman noir real sacred practice as minigame |
| 20 | real 1920s politician stereotyped cultural shorthand |
| 21 | LA Noire real-person likeness |
| 22 | Mafia game copied dialogue cadence |
| 23 | Bioshock fan-server slogan |
| 24 | The Untouchables paid power framing |
| 25 | Boardwalk Empire loot-box presentation |
| 26 | Peaky Blinders named place |
| 27 | Chinatown film hero silhouette |
| 28 | Dick Tracy logo geometry |
| 29 | Batman noir catchphrase |
| 30 | real 1920s politician signature costume |
| 31 | LA Noire proprietary creature |
| 32 | Mafia game map layout |
| 33 | Bioshock faction title |
| 34 | The Untouchables weapon profile |
| 35 | Boardwalk Empire UI chrome |
| 36 | Peaky Blinders quest premise |
| 37 | Chinatown film title typography |
| 38 | Dick Tracy color-coded insignia |
| 39 | Batman noir music motif |
| 40 | real 1920s politician vehicle or mount profile |
| 41 | LA Noire companion anatomy |
| 42 | Mafia game named artifact |
| 43 | Bioshock school or agency badge |
| 44 | The Untouchables real sacred practice as minigame |
| 45 | Boardwalk Empire stereotyped cultural shorthand |
| 46 | Peaky Blinders real-person likeness |
| 47 | Chinatown film copied dialogue cadence |
| 48 | Dick Tracy fan-server slogan |
| 49 | Batman noir paid power framing |
| 50 | real 1920s politician loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `smoke_ledger_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Smoke Ledger • {{turn}} • committed |
| 2 | [Route] Smoke Ledger • {{placeId}} • committed |
| 3 | [Work] Smoke Ledger • {{lastAction}} • committed |
| 4 | [Talk] Smoke Ledger • {{npcId}} • committed |
| 5 | [Kit] Smoke Ledger • {{kitId}} • committed |
| 6 | [Pack] Smoke Ledger • {{partySize}} • committed |
| 7 | [Rest] Smoke Ledger • {{checkpoint}} • committed |
| 8 | [Safety] Smoke Ledger • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| smoke_ledger_kit_01 | Debt Enumerator | debt enumerator workwear | practice debt enumerator | Never use debt enumerator authority to remove another person’s choice. | Use the local rhythm of Smoke Ledger and make every offer concrete. | debt_enumerator mantle; debt_enumerator tool; smoke_ledger_map_01 | smoke_ledger_place_01; smoke_ledger_q_01 | smoke_ledger_ability_01 |
| smoke_ledger_kit_02 | Fog Runner | fog runner workwear | practice fog runner | Never use fog runner authority to remove another person’s choice. | Use the local rhythm of Smoke Ledger and make every offer concrete. | fog_runner vest; fog_runner tool; smoke_ledger_map_02 | smoke_ledger_place_02; smoke_ledger_q_02 | smoke_ledger_ability_02 |
| smoke_ledger_kit_03 | Velvet Host | velvet host workwear | practice velvet host | Never use velvet host authority to remove another person’s choice. | Use the local rhythm of Smoke Ledger and make every offer concrete. | velvet_host jacket; velvet_host tool; smoke_ledger_map_03 | smoke_ledger_place_01; smoke_ledger_q_03 | smoke_ledger_ability_03 |
| smoke_ledger_kit_04 | Case Lampist | case lampist workwear | practice case lampist | Never use case lampist authority to remove another person’s choice. | Use the local rhythm of Smoke Ledger and make every offer concrete. | case_lampist sash; case_lampist tool; smoke_ledger_map_04 | smoke_ledger_place_02; smoke_ledger_q_04 | smoke_ledger_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `smoke_ledger_place_01` is a shared hub rather than a capital analogue; `smoke_ledger_place_04` is the mid-join; `smoke_ledger_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| smoke_ledger_place_01 | Cinder Station | shared hub | street | safe | yes | smoke_ledger_place_02, smoke_ledger_place_04 | A public notice at Cinder Station has been posted with one crucial line washed away. |
| smoke_ledger_place_02 | Velvet Block | start hub | street | safe | yes | smoke_ledger_place_01, smoke_ledger_place_03 | A work roster at Velvet Block leaves two neighbours believing they were promised the same task. |
| smoke_ledger_place_03 | Ledger House | street route | street | safe | yes | smoke_ledger_place_02, smoke_ledger_place_04 | A route marker at Ledger House points visitors toward a closed gate and needs a safe correction. |
| smoke_ledger_place_04 | Fog Dock | mid join | street | low | yes | smoke_ledger_place_03, smoke_ledger_place_05, smoke_ledger_place_01 | A newcomer at Fog Dock needs a local introduction before a small obligation becomes embarrassing. |
| smoke_ledger_place_05 | Tin Roofs | work district | interior | low | no | smoke_ledger_place_04, smoke_ledger_place_06 | A shared tool at Tin Roofs has been returned without its care tag. |
| smoke_ledger_place_06 | Ash Arcade | instance door | dungeon | medium | no | smoke_ledger_place_05, smoke_ledger_place_07 | The entry record at Ash Arcade names an unfinished errand, not a monster or apocalypse. |
| smoke_ledger_place_07 | Midnight Office | wild edge | street | medium | yes | smoke_ledger_place_06, smoke_ledger_place_08 | A weather change at Midnight Office threatens a community plan unless someone reads the signs. |
| smoke_ledger_place_08 | Clover Steps | housing approach | interior | low | no | smoke_ledger_place_07 | A resident at Clover Steps has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| smoke_ledger_npc_01 | Cato Morrow | smoke_ledger_place_01 | quest | Cato Morrow says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Cato Morrow offers a specific task at Cinder Station: settle the practical mismatch before it costs someone a shift. | Cato Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_02 | Dessa Rowan | smoke_ledger_place_02 | profession | Dessa Rowan says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Dessa Rowan offers a specific task at Velvet Block: settle the practical mismatch before it costs someone a shift. | Dessa Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_03 | Eris Nook | smoke_ledger_place_03 | hub | Eris Nook says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Eris Nook offers a specific task at Ledger House: settle the practical mismatch before it costs someone a shift. | Eris Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_04 | Fenn Cress | smoke_ledger_place_04 | merchant | Fenn Cress says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Fenn Cress offers a specific task at Fog Dock: settle the practical mismatch before it costs someone a shift. | Fenn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_05 | Gala Silt | smoke_ledger_place_01 | local | Gala Silt says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Gala Silt offers a specific task at Cinder Station: settle the practical mismatch before it costs someone a shift. | Gala Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_06 | Holl Pryce | smoke_ledger_place_02 | host | Holl Pryce says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Holl Pryce offers a specific task at Velvet Block: settle the practical mismatch before it costs someone a shift. | Holl Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_07 | Ivo Vane | smoke_ledger_place_03 | quest | Ivo Vane says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vane offers a specific task at Ledger House: settle the practical mismatch before it costs someone a shift. | Ivo Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_08 | Jori Quill | smoke_ledger_place_04 | profession | Jori Quill says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Jori Quill offers a specific task at Fog Dock: settle the practical mismatch before it costs someone a shift. | Jori Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_09 | Alden Vale | smoke_ledger_place_01 | local | Alden Vale says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Alden Vale offers a specific task at Cinder Station: settle the practical mismatch before it costs someone a shift. | Alden Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| smoke_ledger_npc_10 | Bryn Wren | smoke_ledger_place_02 | merchant | Bryn Wren says, ‘Smoke Ledger keeps its promises in small places. Tell me which one you noticed.’ | Bryn Wren offers a specific task at Velvet Block: settle the practical mismatch before it costs someone a shift. | Bryn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Fog Dock, if that is useful. |
| 2 | Smoke Ledger feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Ash Arcade. |
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
| Debt Enumerator | At Cinder Station, you arrive in debt_enumerator mantle carrying smoke_ledger_map_01. A small obligation is already late. | Give up one turn to help now. | Smoke Ledger: Name a Working Promise |
| Fog Runner | At Velvet Block, you arrive in fog_runner vest carrying smoke_ledger_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Smoke Ledger: Set the First Tool Aside |
| Velvet Host | At Cinder Station, you arrive in velvet_host jacket carrying smoke_ledger_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Smoke Ledger: Carry the Right Record |
| Case Lampist | At Velvet Block, you arrive in case_lampist sash carrying smoke_ledger_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Smoke Ledger: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_smoke_ledger_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Cinder Station’s small mismatch | ask | missing tag | A local need at Fog Dock is connected but not catastrophic. | alternate talk |
| 2 | Resolve Velvet Block’s small mismatch | repair | closed path | A local need at Tin Roofs is connected but not catastrophic. | new route |
| 3 | Resolve Ledger House’s small mismatch | carry | unclear note | A local need at Ash Arcade is connected but not catastrophic. | recorded favor |
| 4 | Resolve Fog Dock’s small mismatch | listen | late guest | A local need at Midnight Office is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Tin Roofs’s small mismatch | map | wet weather | A local need at Clover Steps is connected but not catastrophic. | slower reward |
| 6 | Resolve Ash Arcade’s small mismatch | prepare | busy shift | A local need at Cinder Station is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Midnight Office’s small mismatch | wait | quiet boundary | A local need at Velvet Block is connected but not catastrophic. | solo option |
| 8 | Resolve Clover Steps’s small mismatch | return | wrong room | A local need at Ledger House is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Fog Dock Account` and `Cinder Station After-Hours`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| smoke_ledger_q_01 | Smoke Ledger: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| smoke_ledger_q_02 | Smoke Ledger: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| smoke_ledger_q_03 | Smoke Ledger: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| smoke_ledger_q_04 | Smoke Ledger: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| smoke_ledger_q_05 | Smoke Ledger: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| smoke_ledger_q_06 | Smoke Ledger: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| smoke_ledger_q_07 | Smoke Ledger: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| smoke_ledger_q_08 | Smoke Ledger: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| smoke_ledger_q_09 | Smoke Ledger: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| smoke_ledger_q_10 | Smoke Ledger: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| smoke_ledger_q_11 | Smoke Ledger: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| smoke_ledger_q_12 | Smoke Ledger: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| smoke_ledger_q_13 | Smoke Ledger: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| smoke_ledger_q_14 | Smoke Ledger: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| smoke_ledger_q_15 | Smoke Ledger: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| smoke_ledger_q_16 | Smoke Ledger: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| smoke_ledger_q_17 | Smoke Ledger: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| smoke_ledger_q_18 | Smoke Ledger: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| smoke_ledger_q_19 | Smoke Ledger: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| smoke_ledger_q_20 | Smoke Ledger: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| smoke_ledger_q_21 | Smoke Ledger: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| smoke_ledger_q_22 | Smoke Ledger: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| smoke_ledger_q_23 | Smoke Ledger: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| smoke_ledger_q_24 | Smoke Ledger: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| smoke_ledger_q_25 | Smoke Ledger: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Cinder Station`: write `smoke_ledger_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Fog Dock`: write `smoke_ledger_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `smoke_ledger_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| smoke_ledger_species_01 | Ink Gull | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_02 | Cigarbox Mouse | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_03 | Lamp Cat | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_04 | Wire Fox | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_05 | Smoke Ledger Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_06 | Smoke Ledger Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_07 | Smoke Ledger Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_08 | Smoke Ledger Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_09 | Smoke Ledger Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_10 | Smoke Ledger Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_11 | Smoke Ledger Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_12 | Smoke Ledger Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_13 | Smoke Ledger Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_14 | Smoke Ledger Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_15 | Smoke Ledger Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_16 | Smoke Ledger Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_17 | Smoke Ledger Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| smoke_ledger_species_18 | Smoke Ledger Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Ledger Notes**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Smoke Rosettes**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Cinder Station token, Velvet Block tool, Ledger House thread, Fog Dock seal, Tin Roofs bundle, Ash Arcade token. |
| Instance and cosmetic templates | Midnight Office tool, Clover Steps thread, Cinder Station seal, Velvet Block bundle, Ledger House token, Fog Dock tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `smoke_ledger_vendor_01` at `smoke_ledger_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| smoke_ledger_dungeon_room_01 | The Fog Dock Account: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: smoke_ledger_species_01, smoke_ledger_species_02; elite: none |   |
| smoke_ledger_dungeon_room_02 | The Fog Dock Account: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: smoke_ledger_species_03, smoke_ledger_species_04; elite: none |   |
| smoke_ledger_dungeon_room_03 | The Fog Dock Account: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: smoke_ledger_species_05, smoke_ledger_species_06; elite: smoke_ledger_species_09 |   |
| smoke_ledger_dungeon_room_04 | The Fog Dock Account: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: smoke_ledger_species_07, smoke_ledger_species_08; elite: none | checkpoint  |
| smoke_ledger_dungeon_room_05 | The Fog Dock Account: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: smoke_ledger_species_09, smoke_ledger_species_10; elite: none |  boss: smoke_ledger_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`smoke_ledger_trap_01`), jammed latch (`smoke_ledger_trap_02`), wet threshold (`smoke_ledger_trap_03`), false shelf (`smoke_ledger_trap_04`), quiet bell (`smoke_ledger_trap_05`), sealed drawer (`smoke_ledger_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Cinder Station After-Hours** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| smoke_ledger_talent_01 | Smoke Ledger Local Ear | 1 | none | smoke_ledger_effect_01 |
| smoke_ledger_talent_02 | Smoke Ledger Careful Hand | 2 | none | smoke_ledger_effect_02 |
| smoke_ledger_talent_03 | Smoke Ledger Route Sense | 3 | none | smoke_ledger_effect_03 |
| smoke_ledger_talent_04 | Smoke Ledger Shared Measure | 4 | none | smoke_ledger_effect_04 |
| smoke_ledger_talent_05 | Smoke Ledger Quiet Craft | 1 | smoke_ledger_talent_04 | smoke_ledger_effect_05 |
| smoke_ledger_talent_06 | Smoke Ledger Open Invitation | 2 | none | smoke_ledger_effect_06 |
| smoke_ledger_talent_07 | Smoke Ledger Safe Return | 3 | none | smoke_ledger_effect_07 |
| smoke_ledger_talent_08 | Smoke Ledger Field Note | 4 | none | smoke_ledger_effect_08 |
| smoke_ledger_talent_09 | Smoke Ledger Steady Pace | 1 | smoke_ledger_talent_08 | smoke_ledger_effect_09 |
| smoke_ledger_talent_10 | Smoke Ledger Clear Signal | 2 | none | smoke_ledger_effect_10 |
| smoke_ledger_talent_11 | Smoke Ledger Warm Welcome | 3 | none | smoke_ledger_effect_11 |
| smoke_ledger_talent_12 | Smoke Ledger Small Courage | 4 | none | smoke_ledger_effect_12 |
| smoke_ledger_talent_13 | Smoke Ledger Repair Habit | 1 | smoke_ledger_talent_12 | smoke_ledger_effect_13 |
| smoke_ledger_talent_14 | Smoke Ledger Trust Mark | 2 | none | smoke_ledger_effect_14 |
| smoke_ledger_talent_15 | Smoke Ledger Second Look | 3 | none | smoke_ledger_effect_15 |
| smoke_ledger_talent_16 | Smoke Ledger Closing Grace | 4 | none | smoke_ledger_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| smoke_ledger_contract_01 | Smoke Ledger Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_02 | Smoke Ledger Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_03 | Smoke Ledger Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_04 | Smoke Ledger Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_05 | Smoke Ledger Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_06 | Smoke Ledger Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_07 | Smoke Ledger Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| smoke_ledger_contract_08 | Smoke Ledger Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| smoke_ledger_interact_01 | Cinder Station bench | rest | smoke_ledger_place_01 |
| smoke_ledger_interact_02 | Velvet Block cabinet | repair | smoke_ledger_place_02 |
| smoke_ledger_interact_03 | Ledger House rack | tend | smoke_ledger_place_03 |
| smoke_ledger_interact_04 | Fog Dock kettle | craft | smoke_ledger_place_04 |
| smoke_ledger_interact_05 | Tin Roofs ledger | cook | smoke_ledger_place_05 |
| smoke_ledger_interact_06 | Ash Arcade rail | bind_inn | smoke_ledger_place_06 |
| smoke_ledger_interact_07 | Midnight Office bell | inspect | smoke_ledger_place_07 |
| smoke_ledger_interact_08 | Clover Steps board | open | smoke_ledger_place_08 |
| smoke_ledger_interact_09 | Cinder Station table | carry | smoke_ledger_place_01 |
| smoke_ledger_interact_10 | Velvet Block lamp | clean | smoke_ledger_place_02 |
| smoke_ledger_interact_11 | Ledger House gate | signal | smoke_ledger_place_03 |
| smoke_ledger_interact_12 | Fog Dock shelf | record | smoke_ledger_place_04 |


**Default interior graph.** `smoke_ledger_interior_01` enters from `smoke_ledger_place_08` and contains 7 connected rooms: Smoke Ledger Entry, Smoke Ledger Main Room, Smoke Ledger Work Nook, Smoke Ledger Window Room, Smoke Ledger Quiet Room, Smoke Ledger Storage, Smoke Ledger Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | cinder, velvet, ledger, fog materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Smoke Ledger` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Smoke Ledger and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Smoke Ledger: distant work, a room tone, a gentle rhythm that belongs to Cinder Station, and a second layer that makes the route toward Ash Arcade feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Smoke Ledger Ledger |
| 2 | Smoke Ledger Route |
| 3 | Smoke Ledger Work |
| 4 | Smoke Ledger Talk |
| 5 | Smoke Ledger Kit |
| 6 | Smoke Ledger Pack |
| 7 | Smoke Ledger Rest |
| 8 | Smoke Ledger Safety |
| 9 | Smoke Ledger Map |
| 10 | Smoke Ledger Notice |
| 11 | Smoke Ledger Favour |
| 12 | Smoke Ledger Gold |
| 13 | Smoke Ledger Token |
| 14 | Smoke Ledger Record |
| 15 | Smoke Ledger Instance |
| 16 | Smoke Ledger Checkpoint |
| 17 | Smoke Ledger Choice |
| 18 | Smoke Ledger Help |
| 19 | Smoke Ledger Calendar |
| 20 | Smoke Ledger Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Cinder Station, a small promise has your name on it. |
| 2 | At Velvet Block, a small promise has your name on it. |
| 3 | At Ledger House, a small promise has your name on it. |
| 4 | At Fog Dock, a small promise has your name on it. |
| 5 | At Tin Roofs, a small promise has your name on it. |
| 6 | At Ash Arcade, a small promise has your name on it. |
| 7 | At Midnight Office, a small promise has your name on it. |
| 8 | At Clover Steps, a small promise has your name on it. |
| 9 | At Cinder Station, a small promise has your name on it. |
| 10 | At Velvet Block, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is period-flavored noir cases and moral debts. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
