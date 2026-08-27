# WOF Neon Docket: Full Start-Depth Pack

> **Release truth.** Neon Docket is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `neon_docket` |
| Display name | **Neon Docket** |
| One-line pitch | Restitution-focused city case crews. |
| Maturity | **teen+** |
| rulesModuleId | `heat_wanted` |
| Theme Kit | **Neon Docket Theme Kit**, included with world entitlement |
| Genre pattern and fence | Restitution-focused city case crews. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Neon Docket is a WOF text world about restitution-focused city case crews. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Grand Theft Auto named place |
| 2 | Saints Row hero silhouette |
| 3 | Payday logo geometry |
| 4 | Yakuza catchphrase |
| 5 | Mafia game signature costume |
| 6 | Sleeping Dogs proprietary creature |
| 7 | Watch Dogs map layout |
| 8 | The Wire police likeness faction title |
| 9 | CSI weapon profile |
| 10 | Ocean’s Eleven UI chrome |
| 11 | Grand Theft Auto quest premise |
| 12 | Saints Row title typography |
| 13 | Payday color-coded insignia |
| 14 | Yakuza music motif |
| 15 | Mafia game vehicle or mount profile |
| 16 | Sleeping Dogs companion anatomy |
| 17 | Watch Dogs named artifact |
| 18 | The Wire police likeness school or agency badge |
| 19 | CSI real sacred practice as minigame |
| 20 | Ocean’s Eleven stereotyped cultural shorthand |
| 21 | Grand Theft Auto real-person likeness |
| 22 | Saints Row copied dialogue cadence |
| 23 | Payday fan-server slogan |
| 24 | Yakuza paid power framing |
| 25 | Mafia game loot-box presentation |
| 26 | Sleeping Dogs named place |
| 27 | Watch Dogs hero silhouette |
| 28 | The Wire police likeness logo geometry |
| 29 | CSI catchphrase |
| 30 | Ocean’s Eleven signature costume |
| 31 | Grand Theft Auto proprietary creature |
| 32 | Saints Row map layout |
| 33 | Payday faction title |
| 34 | Yakuza weapon profile |
| 35 | Mafia game UI chrome |
| 36 | Sleeping Dogs quest premise |
| 37 | Watch Dogs title typography |
| 38 | The Wire police likeness color-coded insignia |
| 39 | CSI music motif |
| 40 | Ocean’s Eleven vehicle or mount profile |
| 41 | Grand Theft Auto companion anatomy |
| 42 | Saints Row named artifact |
| 43 | Payday school or agency badge |
| 44 | Yakuza real sacred practice as minigame |
| 45 | Mafia game stereotyped cultural shorthand |
| 46 | Sleeping Dogs real-person likeness |
| 47 | Watch Dogs copied dialogue cadence |
| 48 | The Wire police likeness fan-server slogan |
| 49 | CSI paid power framing |
| 50 | Ocean’s Eleven loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared heat, wanted, cache, cover and checkpoint contract. |
| Wipe and checkpoint | Wipe returns the party to `neon_docket_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Neon Docket • {{turn}} • committed |
| 2 | [Route] Neon Docket • {{placeId}} • committed |
| 3 | [Work] Neon Docket • {{lastAction}} • committed |
| 4 | [Talk] Neon Docket • {{npcId}} • committed |
| 5 | [Kit] Neon Docket • {{kitId}} • committed |
| 6 | [Pack] Neon Docket • {{partySize}} • committed |
| 7 | [Rest] Neon Docket • {{checkpoint}} • committed |
| 8 | [Safety] Neon Docket • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| neon_docket_kit_01 | Restitution Broker | restitution broker workwear | practice restitution broker | Never use restitution broker authority to remove another person’s choice. | Use the local rhythm of Neon Docket and make every offer concrete. | restitution_broker mantle; restitution_broker tool; neon_docket_map_01 | neon_docket_place_01; neon_docket_q_01 | neon_docket_ability_01 |
| neon_docket_kit_02 | Case Runner | case runner workwear | practice case runner | Never use case runner authority to remove another person’s choice. | Use the local rhythm of Neon Docket and make every offer concrete. | case_runner vest; case_runner tool; neon_docket_map_02 | neon_docket_place_02; neon_docket_q_02 | neon_docket_ability_02 |
| neon_docket_kit_03 | Witness Steward | witness steward workwear | practice witness steward | Never use witness steward authority to remove another person’s choice. | Use the local rhythm of Neon Docket and make every offer concrete. | witness_steward jacket; witness_steward tool; neon_docket_map_03 | neon_docket_place_01; neon_docket_q_03 | neon_docket_ability_03 |
| neon_docket_kit_04 | Meter Auditor | meter auditor workwear | practice meter auditor | Never use meter auditor authority to remove another person’s choice. | Use the local rhythm of Neon Docket and make every offer concrete. | meter_auditor sash; meter_auditor tool; neon_docket_map_04 | neon_docket_place_02; neon_docket_q_04 | neon_docket_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `neon_docket_place_01` is a shared hub rather than a capital analogue; `neon_docket_place_04` is the mid-join; `neon_docket_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| neon_docket_place_01 | Docket Row | shared hub | street | safe | yes | neon_docket_place_02, neon_docket_place_04 | A public notice at Docket Row has been posted with one crucial line washed away. |
| neon_docket_place_02 | Night Clerk | start hub | street | safe | yes | neon_docket_place_01, neon_docket_place_03 | A work roster at Night Clerk leaves two neighbours believing they were promised the same task. |
| neon_docket_place_03 | Underbridge | street route | street | safe | yes | neon_docket_place_02, neon_docket_place_04 | A route marker at Underbridge points visitors toward a closed gate and needs a safe correction. |
| neon_docket_place_04 | Casefile Court | mid join | street | low | yes | neon_docket_place_03, neon_docket_place_05, neon_docket_place_01 | A newcomer at Casefile Court needs a local introduction before a small obligation becomes embarrassing. |
| neon_docket_place_05 | Meter Alley | work district | interior | low | no | neon_docket_place_04, neon_docket_place_06 | A shared tool at Meter Alley has been returned without its care tag. |
| neon_docket_place_06 | Quiet Garage | instance door | dungeon | medium | no | neon_docket_place_05, neon_docket_place_07 | The entry record at Quiet Garage names an unfinished errand, not a monster or apocalypse. |
| neon_docket_place_07 | Witness Steps | wild edge | street | medium | yes | neon_docket_place_06, neon_docket_place_08 | A weather change at Witness Steps threatens a community plan unless someone reads the signs. |
| neon_docket_place_08 | Glass Booth | housing approach | interior | low | no | neon_docket_place_07 | A resident at Glass Booth has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| neon_docket_npc_01 | Bryn Cress | neon_docket_place_01 | quest | Bryn Cress says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Bryn Cress offers a specific task at Docket Row: settle the practical mismatch before it costs someone a shift. | Bryn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_02 | Cato Silt | neon_docket_place_02 | profession | Cato Silt says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Cato Silt offers a specific task at Night Clerk: settle the practical mismatch before it costs someone a shift. | Cato Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_03 | Dessa Pryce | neon_docket_place_03 | hub | Dessa Pryce says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Dessa Pryce offers a specific task at Underbridge: settle the practical mismatch before it costs someone a shift. | Dessa Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_04 | Eris Vane | neon_docket_place_04 | merchant | Eris Vane says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Eris Vane offers a specific task at Casefile Court: settle the practical mismatch before it costs someone a shift. | Eris Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_05 | Fenn Quill | neon_docket_place_01 | local | Fenn Quill says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Fenn Quill offers a specific task at Docket Row: settle the practical mismatch before it costs someone a shift. | Fenn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_06 | Gala Vale | neon_docket_place_02 | host | Gala Vale says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Gala Vale offers a specific task at Night Clerk: settle the practical mismatch before it costs someone a shift. | Gala Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_07 | Holl Wren | neon_docket_place_03 | quest | Holl Wren says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Holl Wren offers a specific task at Underbridge: settle the practical mismatch before it costs someone a shift. | Holl Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_08 | Ivo Morrow | neon_docket_place_04 | profession | Ivo Morrow says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Ivo Morrow offers a specific task at Casefile Court: settle the practical mismatch before it costs someone a shift. | Ivo Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_09 | Jori Rowan | neon_docket_place_01 | local | Jori Rowan says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Jori Rowan offers a specific task at Docket Row: settle the practical mismatch before it costs someone a shift. | Jori Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| neon_docket_npc_10 | Alden Nook | neon_docket_place_02 | merchant | Alden Nook says, ‘Neon Docket keeps its promises in small places. Tell me which one you noticed.’ | Alden Nook offers a specific task at Night Clerk: settle the practical mismatch before it costs someone a shift. | Alden Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Casefile Court, if that is useful. |
| 2 | Neon Docket feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Quiet Garage. |
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
| Restitution Broker | At Docket Row, you arrive in restitution_broker mantle carrying neon_docket_map_01. A small obligation is already late. | Give up one turn to help now. | Neon Docket: Name a Working Promise |
| Case Runner | At Night Clerk, you arrive in case_runner vest carrying neon_docket_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Neon Docket: Set the First Tool Aside |
| Witness Steward | At Docket Row, you arrive in witness_steward jacket carrying neon_docket_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Neon Docket: Carry the Right Record |
| Meter Auditor | At Night Clerk, you arrive in meter_auditor sash carrying neon_docket_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Neon Docket: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_neon_docket_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Docket Row’s small mismatch | ask | missing tag | A local need at Casefile Court is connected but not catastrophic. | alternate talk |
| 2 | Resolve Night Clerk’s small mismatch | repair | closed path | A local need at Meter Alley is connected but not catastrophic. | new route |
| 3 | Resolve Underbridge’s small mismatch | carry | unclear note | A local need at Quiet Garage is connected but not catastrophic. | recorded favor |
| 4 | Resolve Casefile Court’s small mismatch | listen | late guest | A local need at Witness Steps is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Meter Alley’s small mismatch | map | wet weather | A local need at Glass Booth is connected but not catastrophic. | slower reward |
| 6 | Resolve Quiet Garage’s small mismatch | prepare | busy shift | A local need at Docket Row is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Witness Steps’s small mismatch | wait | quiet boundary | A local need at Night Clerk is connected but not catastrophic. | solo option |
| 8 | Resolve Glass Booth’s small mismatch | return | wrong room | A local need at Underbridge is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Closed Account` and `Casefile Court Night Session`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| neon_docket_q_01 | Neon Docket: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| neon_docket_q_02 | Neon Docket: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| neon_docket_q_03 | Neon Docket: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| neon_docket_q_04 | Neon Docket: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| neon_docket_q_05 | Neon Docket: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| neon_docket_q_06 | Neon Docket: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| neon_docket_q_07 | Neon Docket: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| neon_docket_q_08 | Neon Docket: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| neon_docket_q_09 | Neon Docket: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| neon_docket_q_10 | Neon Docket: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| neon_docket_q_11 | Neon Docket: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| neon_docket_q_12 | Neon Docket: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| neon_docket_q_13 | Neon Docket: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| neon_docket_q_14 | Neon Docket: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| neon_docket_q_15 | Neon Docket: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| neon_docket_q_16 | Neon Docket: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| neon_docket_q_17 | Neon Docket: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| neon_docket_q_18 | Neon Docket: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| neon_docket_q_19 | Neon Docket: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| neon_docket_q_20 | Neon Docket: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| neon_docket_q_21 | Neon Docket: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| neon_docket_q_22 | Neon Docket: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| neon_docket_q_23 | Neon Docket: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| neon_docket_q_24 | Neon Docket: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| neon_docket_q_25 | Neon Docket: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Docket Row`: write `neon_docket_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Casefile Court`: write `neon_docket_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `neon_docket_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| neon_docket_species_01 | Alley Pigeon | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_02 | Receipt Ferret | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_03 | Lamp Gecko | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_04 | Archive Moth | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_05 | Neon Docket Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_06 | Neon Docket Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_07 | Neon Docket Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_08 | Neon Docket Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_09 | Neon Docket Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_10 | Neon Docket Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_11 | Neon Docket Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_12 | Neon Docket Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_13 | Neon Docket Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_14 | Neon Docket Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_15 | Neon Docket Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_16 | Neon Docket Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_17 | Neon Docket Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| neon_docket_species_18 | Neon Docket Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Docket Cash**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Neon Tabs**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Docket Row token, Night Clerk tool, Underbridge thread, Casefile Court seal, Meter Alley bundle, Quiet Garage token. |
| Instance and cosmetic templates | Witness Steps tool, Glass Booth thread, Docket Row seal, Night Clerk bundle, Underbridge token, Casefile Court tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `neon_docket_vendor_01` at `neon_docket_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| neon_docket_dungeon_room_01 | The Closed Account: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: neon_docket_species_01, neon_docket_species_02; elite: none |   |
| neon_docket_dungeon_room_02 | The Closed Account: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: neon_docket_species_03, neon_docket_species_04; elite: none |   |
| neon_docket_dungeon_room_03 | The Closed Account: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: neon_docket_species_05, neon_docket_species_06; elite: neon_docket_species_09 |   |
| neon_docket_dungeon_room_04 | The Closed Account: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: neon_docket_species_07, neon_docket_species_08; elite: none | checkpoint  |
| neon_docket_dungeon_room_05 | The Closed Account: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: neon_docket_species_09, neon_docket_species_10; elite: none |  boss: neon_docket_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`neon_docket_trap_01`), jammed latch (`neon_docket_trap_02`), wet threshold (`neon_docket_trap_03`), false shelf (`neon_docket_trap_04`), quiet bell (`neon_docket_trap_05`), sealed drawer (`neon_docket_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Casefile Court Night Session** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| neon_docket_talent_01 | Neon Docket Local Ear | 1 | none | neon_docket_effect_01 |
| neon_docket_talent_02 | Neon Docket Careful Hand | 2 | none | neon_docket_effect_02 |
| neon_docket_talent_03 | Neon Docket Route Sense | 3 | none | neon_docket_effect_03 |
| neon_docket_talent_04 | Neon Docket Shared Measure | 4 | none | neon_docket_effect_04 |
| neon_docket_talent_05 | Neon Docket Quiet Craft | 1 | neon_docket_talent_04 | neon_docket_effect_05 |
| neon_docket_talent_06 | Neon Docket Open Invitation | 2 | none | neon_docket_effect_06 |
| neon_docket_talent_07 | Neon Docket Safe Return | 3 | none | neon_docket_effect_07 |
| neon_docket_talent_08 | Neon Docket Field Note | 4 | none | neon_docket_effect_08 |
| neon_docket_talent_09 | Neon Docket Steady Pace | 1 | neon_docket_talent_08 | neon_docket_effect_09 |
| neon_docket_talent_10 | Neon Docket Clear Signal | 2 | none | neon_docket_effect_10 |
| neon_docket_talent_11 | Neon Docket Warm Welcome | 3 | none | neon_docket_effect_11 |
| neon_docket_talent_12 | Neon Docket Small Courage | 4 | none | neon_docket_effect_12 |
| neon_docket_talent_13 | Neon Docket Repair Habit | 1 | neon_docket_talent_12 | neon_docket_effect_13 |
| neon_docket_talent_14 | Neon Docket Trust Mark | 2 | none | neon_docket_effect_14 |
| neon_docket_talent_15 | Neon Docket Second Look | 3 | none | neon_docket_effect_15 |
| neon_docket_talent_16 | Neon Docket Closing Grace | 4 | none | neon_docket_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| neon_docket_contract_01 | Neon Docket Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| neon_docket_contract_02 | Neon Docket Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| neon_docket_contract_03 | Neon Docket Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| neon_docket_contract_04 | Neon Docket Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| neon_docket_contract_05 | Neon Docket Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| neon_docket_contract_06 | Neon Docket Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| neon_docket_contract_07 | Neon Docket Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| neon_docket_contract_08 | Neon Docket Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| neon_docket_interact_01 | Docket Row bench | rest | neon_docket_place_01 |
| neon_docket_interact_02 | Night Clerk cabinet | repair | neon_docket_place_02 |
| neon_docket_interact_03 | Underbridge rack | tend | neon_docket_place_03 |
| neon_docket_interact_04 | Casefile Court kettle | craft | neon_docket_place_04 |
| neon_docket_interact_05 | Meter Alley ledger | cook | neon_docket_place_05 |
| neon_docket_interact_06 | Quiet Garage rail | bind_inn | neon_docket_place_06 |
| neon_docket_interact_07 | Witness Steps bell | inspect | neon_docket_place_07 |
| neon_docket_interact_08 | Glass Booth board | open | neon_docket_place_08 |
| neon_docket_interact_09 | Docket Row table | carry | neon_docket_place_01 |
| neon_docket_interact_10 | Night Clerk lamp | clean | neon_docket_place_02 |
| neon_docket_interact_11 | Underbridge gate | signal | neon_docket_place_03 |
| neon_docket_interact_12 | Casefile Court shelf | record | neon_docket_place_04 |


**Default interior graph.** `neon_docket_interior_01` enters from `neon_docket_place_08` and contains 7 connected rooms: Neon Docket Entry, Neon Docket Main Room, Neon Docket Work Nook, Neon Docket Window Room, Neon Docket Quiet Room, Neon Docket Storage, Neon Docket Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | docket, night, underbridge, casefile materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Neon Docket` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Neon Docket and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Neon Docket: distant work, a room tone, a gentle rhythm that belongs to Docket Row, and a second layer that makes the route toward Quiet Garage feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Neon Docket Ledger |
| 2 | Neon Docket Route |
| 3 | Neon Docket Work |
| 4 | Neon Docket Talk |
| 5 | Neon Docket Kit |
| 6 | Neon Docket Pack |
| 7 | Neon Docket Rest |
| 8 | Neon Docket Safety |
| 9 | Neon Docket Map |
| 10 | Neon Docket Notice |
| 11 | Neon Docket Favour |
| 12 | Neon Docket Gold |
| 13 | Neon Docket Token |
| 14 | Neon Docket Record |
| 15 | Neon Docket Instance |
| 16 | Neon Docket Checkpoint |
| 17 | Neon Docket Choice |
| 18 | Neon Docket Help |
| 19 | Neon Docket Calendar |
| 20 | Neon Docket Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Docket Row, a small promise has your name on it. |
| 2 | At Night Clerk, a small promise has your name on it. |
| 3 | At Underbridge, a small promise has your name on it. |
| 4 | At Casefile Court, a small promise has your name on it. |
| 5 | At Meter Alley, a small promise has your name on it. |
| 6 | At Quiet Garage, a small promise has your name on it. |
| 7 | At Witness Steps, a small promise has your name on it. |
| 8 | At Glass Booth, a small promise has your name on it. |
| 9 | At Docket Row, a small promise has your name on it. |
| 10 | At Night Clerk, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is restitution-focused city case crews. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
