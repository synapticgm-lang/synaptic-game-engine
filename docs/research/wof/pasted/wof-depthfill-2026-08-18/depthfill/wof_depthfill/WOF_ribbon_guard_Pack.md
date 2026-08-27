# WOF Ribbon Guard: Full Start-Depth Pack

> **Release truth.** Ribbon Guard is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `ribbon_guard` |
| Display name | **Ribbon Guard** |
| One-line pitch | Color-team rescue show and civic cheer. |
| Maturity | **all-ages** |
| rulesModuleId | `show_pose` |
| Theme Kit | **Ribbon Guard Theme Kit**, included with world entitlement |
| Genre pattern and fence | Color-team rescue show and civic cheer. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Ribbon Guard is a WOF text world about color-team rescue show and civic cheer. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Power Rangers named place |
| 2 | Sailor Moon hero silhouette |
| 3 | Precure logo geometry |
| 4 | My Hero Academia catchphrase |
| 5 | Miraculous Ladybug signature costume |
| 6 | Kamen Rider proprietary creature |
| 7 | Super Sentai map layout |
| 8 | Winx Club faction title |
| 9 | She-Ra weapon profile |
| 10 | Teen Titans UI chrome |
| 11 | Power Rangers quest premise |
| 12 | Sailor Moon title typography |
| 13 | Precure color-coded insignia |
| 14 | My Hero Academia music motif |
| 15 | Miraculous Ladybug vehicle or mount profile |
| 16 | Kamen Rider companion anatomy |
| 17 | Super Sentai named artifact |
| 18 | Winx Club school or agency badge |
| 19 | She-Ra real sacred practice as minigame |
| 20 | Teen Titans stereotyped cultural shorthand |
| 21 | Power Rangers real-person likeness |
| 22 | Sailor Moon copied dialogue cadence |
| 23 | Precure fan-server slogan |
| 24 | My Hero Academia paid power framing |
| 25 | Miraculous Ladybug loot-box presentation |
| 26 | Kamen Rider named place |
| 27 | Super Sentai hero silhouette |
| 28 | Winx Club logo geometry |
| 29 | She-Ra catchphrase |
| 30 | Teen Titans signature costume |
| 31 | Power Rangers proprietary creature |
| 32 | Sailor Moon map layout |
| 33 | Precure faction title |
| 34 | My Hero Academia weapon profile |
| 35 | Miraculous Ladybug UI chrome |
| 36 | Kamen Rider quest premise |
| 37 | Super Sentai title typography |
| 38 | Winx Club color-coded insignia |
| 39 | She-Ra music motif |
| 40 | Teen Titans vehicle or mount profile |
| 41 | Power Rangers companion anatomy |
| 42 | Sailor Moon named artifact |
| 43 | Precure school or agency badge |
| 44 | My Hero Academia real sacred practice as minigame |
| 45 | Miraculous Ladybug stereotyped cultural shorthand |
| 46 | Kamen Rider real-person likeness |
| 47 | Super Sentai copied dialogue cadence |
| 48 | Winx Club fan-server slogan |
| 49 | She-Ra paid power framing |
| 50 | Teen Titans loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | energy, poseChain, cue, audienceJoy, rescueMarks, costume, sceneClock, bond |
| Wipe and checkpoint | Wipe returns the party to `ribbon_guard_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Ribbon Guard • {{turn}} • committed |
| 2 | [Route] Ribbon Guard • {{placeId}} • committed |
| 3 | [Work] Ribbon Guard • {{lastAction}} • committed |
| 4 | [Talk] Ribbon Guard • {{npcId}} • committed |
| 5 | [Kit] Ribbon Guard • {{kitId}} • committed |
| 6 | [Pack] Ribbon Guard • {{partySize}} • committed |
| 7 | [Rest] Ribbon Guard • {{checkpoint}} • committed |
| 8 | [Safety] Ribbon Guard • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ribbon_guard_kit_01 | Pose Captain | pose captain workwear | practice pose captain | Never use pose captain authority to remove another person’s choice. | Use the local rhythm of Ribbon Guard and make every offer concrete. | pose_captain mantle; pose_captain tool; ribbon_guard_map_01 | ribbon_guard_place_01; ribbon_guard_q_01 | ribbon_guard_ability_01 |
| ribbon_guard_kit_02 | Ribbon Rigger | ribbon rigger workwear | practice ribbon rigger | Never use ribbon rigger authority to remove another person’s choice. | Use the local rhythm of Ribbon Guard and make every offer concrete. | ribbon_rigger vest; ribbon_rigger tool; ribbon_guard_map_02 | ribbon_guard_place_02; ribbon_guard_q_02 | ribbon_guard_ability_02 |
| ribbon_guard_kit_03 | Mirror Medic | mirror medic workwear | practice mirror medic | Never use mirror medic authority to remove another person’s choice. | Use the local rhythm of Ribbon Guard and make every offer concrete. | mirror_medic jacket; mirror_medic tool; ribbon_guard_map_03 | ribbon_guard_place_01; ribbon_guard_q_03 | ribbon_guard_ability_03 |
| ribbon_guard_kit_04 | Cue Archivist | cue archivist workwear | practice cue archivist | Never use cue archivist authority to remove another person’s choice. | Use the local rhythm of Ribbon Guard and make every offer concrete. | cue_archivist sash; cue_archivist tool; ribbon_guard_map_04 | ribbon_guard_place_02; ribbon_guard_q_04 | ribbon_guard_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `ribbon_guard_place_01` is a shared hub rather than a capital analogue; `ribbon_guard_place_04` is the mid-join; `ribbon_guard_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ribbon_guard_place_01 | Bright Base | shared hub | street | safe | yes | ribbon_guard_place_02, ribbon_guard_place_04 | A public notice at Bright Base has been posted with one crucial line washed away. |
| ribbon_guard_place_02 | Mirror Street | start hub | street | safe | yes | ribbon_guard_place_01, ribbon_guard_place_03 | A work roster at Mirror Street leaves two neighbours believing they were promised the same task. |
| ribbon_guard_place_03 | Ribbon Pier | street route | street | safe | yes | ribbon_guard_place_02, ribbon_guard_place_04 | A route marker at Ribbon Pier points visitors toward a closed gate and needs a safe correction. |
| ribbon_guard_place_04 | Stage Vault | mid join | street | low | yes | ribbon_guard_place_03, ribbon_guard_place_05, ribbon_guard_place_01 | A newcomer at Stage Vault needs a local introduction before a small obligation becomes embarrassing. |
| ribbon_guard_place_05 | Prism Park | work district | interior | low | no | ribbon_guard_place_04, ribbon_guard_place_06 | A shared tool at Prism Park has been returned without its care tag. |
| ribbon_guard_place_06 | Beacon Roof | instance door | dungeon | medium | no | ribbon_guard_place_05, ribbon_guard_place_07 | The entry record at Beacon Roof names an unfinished errand, not a monster or apocalypse. |
| ribbon_guard_place_07 | Curtain Alley | wild edge | street | medium | yes | ribbon_guard_place_06, ribbon_guard_place_08 | A weather change at Curtain Alley threatens a community plan unless someone reads the signs. |
| ribbon_guard_place_08 | Glow Tunnel | housing approach | interior | low | no | ribbon_guard_place_07 | A resident at Glow Tunnel has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| ribbon_guard_npc_01 | Cato Morrow | ribbon_guard_place_01 | quest | Cato Morrow says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Cato Morrow offers a specific task at Bright Base: settle the practical mismatch before it costs someone a shift. | Cato Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_02 | Dessa Rowan | ribbon_guard_place_02 | profession | Dessa Rowan says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Dessa Rowan offers a specific task at Mirror Street: settle the practical mismatch before it costs someone a shift. | Dessa Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_03 | Eris Nook | ribbon_guard_place_03 | hub | Eris Nook says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Eris Nook offers a specific task at Ribbon Pier: settle the practical mismatch before it costs someone a shift. | Eris Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_04 | Fenn Cress | ribbon_guard_place_04 | merchant | Fenn Cress says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Fenn Cress offers a specific task at Stage Vault: settle the practical mismatch before it costs someone a shift. | Fenn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_05 | Gala Silt | ribbon_guard_place_01 | local | Gala Silt says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Gala Silt offers a specific task at Bright Base: settle the practical mismatch before it costs someone a shift. | Gala Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_06 | Holl Pryce | ribbon_guard_place_02 | host | Holl Pryce says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Holl Pryce offers a specific task at Mirror Street: settle the practical mismatch before it costs someone a shift. | Holl Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_07 | Ivo Vane | ribbon_guard_place_03 | quest | Ivo Vane says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vane offers a specific task at Ribbon Pier: settle the practical mismatch before it costs someone a shift. | Ivo Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_08 | Jori Quill | ribbon_guard_place_04 | profession | Jori Quill says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Jori Quill offers a specific task at Stage Vault: settle the practical mismatch before it costs someone a shift. | Jori Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_09 | Alden Vale | ribbon_guard_place_01 | local | Alden Vale says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Alden Vale offers a specific task at Bright Base: settle the practical mismatch before it costs someone a shift. | Alden Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ribbon_guard_npc_10 | Bryn Wren | ribbon_guard_place_02 | merchant | Bryn Wren says, ‘Ribbon Guard keeps its promises in small places. Tell me which one you noticed.’ | Bryn Wren offers a specific task at Mirror Street: settle the practical mismatch before it costs someone a shift. | Bryn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Stage Vault, if that is useful. |
| 2 | Ribbon Guard feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Beacon Roof. |
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
| Pose Captain | At Bright Base, you arrive in pose_captain mantle carrying ribbon_guard_map_01. A small obligation is already late. | Give up one turn to help now. | Ribbon Guard: Name a Working Promise |
| Ribbon Rigger | At Mirror Street, you arrive in ribbon_rigger vest carrying ribbon_guard_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Ribbon Guard: Set the First Tool Aside |
| Mirror Medic | At Bright Base, you arrive in mirror_medic jacket carrying ribbon_guard_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Ribbon Guard: Carry the Right Record |
| Cue Archivist | At Mirror Street, you arrive in cue_archivist sash carrying ribbon_guard_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Ribbon Guard: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_ribbon_guard_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Bright Base’s small mismatch | ask | missing tag | A local need at Stage Vault is connected but not catastrophic. | alternate talk |
| 2 | Resolve Mirror Street’s small mismatch | repair | closed path | A local need at Prism Park is connected but not catastrophic. | new route |
| 3 | Resolve Ribbon Pier’s small mismatch | carry | unclear note | A local need at Beacon Roof is connected but not catastrophic. | recorded favor |
| 4 | Resolve Stage Vault’s small mismatch | listen | late guest | A local need at Curtain Alley is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Prism Park’s small mismatch | map | wet weather | A local need at Glow Tunnel is connected but not catastrophic. | slower reward |
| 6 | Resolve Beacon Roof’s small mismatch | prepare | busy shift | A local need at Bright Base is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Curtain Alley’s small mismatch | wait | quiet boundary | A local need at Mirror Street is connected but not catastrophic. | solo option |
| 8 | Resolve Glow Tunnel’s small mismatch | return | wrong room | A local need at Ribbon Pier is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Stage Vault Blackout` and `Prism Park Rescue Revue`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| ribbon_guard_q_01 | Ribbon Guard: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| ribbon_guard_q_02 | Ribbon Guard: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| ribbon_guard_q_03 | Ribbon Guard: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| ribbon_guard_q_04 | Ribbon Guard: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| ribbon_guard_q_05 | Ribbon Guard: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| ribbon_guard_q_06 | Ribbon Guard: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| ribbon_guard_q_07 | Ribbon Guard: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| ribbon_guard_q_08 | Ribbon Guard: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| ribbon_guard_q_09 | Ribbon Guard: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| ribbon_guard_q_10 | Ribbon Guard: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| ribbon_guard_q_11 | Ribbon Guard: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| ribbon_guard_q_12 | Ribbon Guard: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| ribbon_guard_q_13 | Ribbon Guard: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| ribbon_guard_q_14 | Ribbon Guard: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| ribbon_guard_q_15 | Ribbon Guard: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| ribbon_guard_q_16 | Ribbon Guard: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| ribbon_guard_q_17 | Ribbon Guard: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| ribbon_guard_q_18 | Ribbon Guard: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| ribbon_guard_q_19 | Ribbon Guard: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| ribbon_guard_q_20 | Ribbon Guard: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| ribbon_guard_q_21 | Ribbon Guard: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| ribbon_guard_q_22 | Ribbon Guard: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| ribbon_guard_q_23 | Ribbon Guard: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| ribbon_guard_q_24 | Ribbon Guard: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| ribbon_guard_q_25 | Ribbon Guard: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Bright Base`: write `ribbon_guard_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Stage Vault`: write `ribbon_guard_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `ribbon_guard_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| ribbon_guard_species_01 | Spark Pigeon | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_02 | Prism Pup | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_03 | Ribbon Koi | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_04 | Glow Beetle | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_05 | Ribbon Guard Field Type 5 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_06 | Ribbon Guard Field Type 6 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_07 | Ribbon Guard Field Type 7 | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_08 | Ribbon Guard Field Type 8 | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_09 | Ribbon Guard Field Type 9 | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_10 | Ribbon Guard Field Type 10 | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_11 | Ribbon Guard Field Type 11 | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_12 | Ribbon Guard Field Type 12 | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_13 | Ribbon Guard Field Type 13 | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_14 | Ribbon Guard Field Type 14 | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_15 | Ribbon Guard Field Type 15 | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_16 | Ribbon Guard Field Type 16 | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_17 | Ribbon Guard Field Type 17 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ribbon_guard_species_18 | Ribbon Guard Field Type 18 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Bright Tickets**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Prism Pins**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Bright Base token, Mirror Street tool, Ribbon Pier thread, Stage Vault seal, Prism Park bundle, Beacon Roof token. |
| Instance and cosmetic templates | Curtain Alley tool, Glow Tunnel thread, Bright Base seal, Mirror Street bundle, Ribbon Pier token, Stage Vault tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `ribbon_guard_vendor_01` at `ribbon_guard_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| ribbon_guard_dungeon_room_01 | The Stage Vault Blackout: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: ribbon_guard_species_01, ribbon_guard_species_02; elite: none |   |
| ribbon_guard_dungeon_room_02 | The Stage Vault Blackout: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: ribbon_guard_species_03, ribbon_guard_species_04; elite: none |   |
| ribbon_guard_dungeon_room_03 | The Stage Vault Blackout: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: ribbon_guard_species_05, ribbon_guard_species_06; elite: ribbon_guard_species_09 |   |
| ribbon_guard_dungeon_room_04 | The Stage Vault Blackout: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: ribbon_guard_species_07, ribbon_guard_species_08; elite: none | checkpoint  |
| ribbon_guard_dungeon_room_05 | The Stage Vault Blackout: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: ribbon_guard_species_09, ribbon_guard_species_10; elite: none |  boss: ribbon_guard_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`ribbon_guard_trap_01`), jammed latch (`ribbon_guard_trap_02`), wet threshold (`ribbon_guard_trap_03`), false shelf (`ribbon_guard_trap_04`), quiet bell (`ribbon_guard_trap_05`), sealed drawer (`ribbon_guard_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Prism Park Rescue Revue** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| ribbon_guard_talent_01 | Ribbon Guard Local Ear | 1 | none | ribbon_guard_effect_01 |
| ribbon_guard_talent_02 | Ribbon Guard Careful Hand | 2 | none | ribbon_guard_effect_02 |
| ribbon_guard_talent_03 | Ribbon Guard Route Sense | 3 | none | ribbon_guard_effect_03 |
| ribbon_guard_talent_04 | Ribbon Guard Shared Measure | 4 | none | ribbon_guard_effect_04 |
| ribbon_guard_talent_05 | Ribbon Guard Quiet Craft | 1 | ribbon_guard_talent_04 | ribbon_guard_effect_05 |
| ribbon_guard_talent_06 | Ribbon Guard Open Invitation | 2 | none | ribbon_guard_effect_06 |
| ribbon_guard_talent_07 | Ribbon Guard Safe Return | 3 | none | ribbon_guard_effect_07 |
| ribbon_guard_talent_08 | Ribbon Guard Field Note | 4 | none | ribbon_guard_effect_08 |
| ribbon_guard_talent_09 | Ribbon Guard Steady Pace | 1 | ribbon_guard_talent_08 | ribbon_guard_effect_09 |
| ribbon_guard_talent_10 | Ribbon Guard Clear Signal | 2 | none | ribbon_guard_effect_10 |
| ribbon_guard_talent_11 | Ribbon Guard Warm Welcome | 3 | none | ribbon_guard_effect_11 |
| ribbon_guard_talent_12 | Ribbon Guard Small Courage | 4 | none | ribbon_guard_effect_12 |
| ribbon_guard_talent_13 | Ribbon Guard Repair Habit | 1 | ribbon_guard_talent_12 | ribbon_guard_effect_13 |
| ribbon_guard_talent_14 | Ribbon Guard Trust Mark | 2 | none | ribbon_guard_effect_14 |
| ribbon_guard_talent_15 | Ribbon Guard Second Look | 3 | none | ribbon_guard_effect_15 |
| ribbon_guard_talent_16 | Ribbon Guard Closing Grace | 4 | none | ribbon_guard_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| ribbon_guard_contract_01 | Ribbon Guard Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_02 | Ribbon Guard Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_03 | Ribbon Guard Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_04 | Ribbon Guard Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_05 | Ribbon Guard Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_06 | Ribbon Guard Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_07 | Ribbon Guard Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| ribbon_guard_contract_08 | Ribbon Guard Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| ribbon_guard_interact_01 | Bright Base bench | rest | ribbon_guard_place_01 |
| ribbon_guard_interact_02 | Mirror Street cabinet | repair | ribbon_guard_place_02 |
| ribbon_guard_interact_03 | Ribbon Pier rack | tend | ribbon_guard_place_03 |
| ribbon_guard_interact_04 | Stage Vault kettle | craft | ribbon_guard_place_04 |
| ribbon_guard_interact_05 | Prism Park ledger | cook | ribbon_guard_place_05 |
| ribbon_guard_interact_06 | Beacon Roof rail | bind_inn | ribbon_guard_place_06 |
| ribbon_guard_interact_07 | Curtain Alley bell | inspect | ribbon_guard_place_07 |
| ribbon_guard_interact_08 | Glow Tunnel board | open | ribbon_guard_place_08 |
| ribbon_guard_interact_09 | Bright Base table | carry | ribbon_guard_place_01 |
| ribbon_guard_interact_10 | Mirror Street lamp | clean | ribbon_guard_place_02 |
| ribbon_guard_interact_11 | Ribbon Pier gate | signal | ribbon_guard_place_03 |
| ribbon_guard_interact_12 | Stage Vault shelf | record | ribbon_guard_place_04 |


**Default interior graph.** `ribbon_guard_interior_01` enters from `ribbon_guard_place_08` and contains 7 connected rooms: Ribbon Guard Entry, Ribbon Guard Main Room, Ribbon Guard Work Nook, Ribbon Guard Window Room, Ribbon Guard Quiet Room, Ribbon Guard Storage, Ribbon Guard Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | bright, mirror, ribbon, stage materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Ribbon Guard` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Ribbon Guard and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Ribbon Guard: distant work, a room tone, a gentle rhythm that belongs to Bright Base, and a second layer that makes the route toward Beacon Roof feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Ribbon Guard Ledger |
| 2 | Ribbon Guard Route |
| 3 | Ribbon Guard Work |
| 4 | Ribbon Guard Talk |
| 5 | Ribbon Guard Kit |
| 6 | Ribbon Guard Pack |
| 7 | Ribbon Guard Rest |
| 8 | Ribbon Guard Safety |
| 9 | Ribbon Guard Map |
| 10 | Ribbon Guard Notice |
| 11 | Ribbon Guard Favour |
| 12 | Ribbon Guard Gold |
| 13 | Ribbon Guard Token |
| 14 | Ribbon Guard Record |
| 15 | Ribbon Guard Instance |
| 16 | Ribbon Guard Checkpoint |
| 17 | Ribbon Guard Choice |
| 18 | Ribbon Guard Help |
| 19 | Ribbon Guard Calendar |
| 20 | Ribbon Guard Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Bright Base, a small promise has your name on it. |
| 2 | At Mirror Street, a small promise has your name on it. |
| 3 | At Ribbon Pier, a small promise has your name on it. |
| 4 | At Stage Vault, a small promise has your name on it. |
| 5 | At Prism Park, a small promise has your name on it. |
| 6 | At Beacon Roof, a small promise has your name on it. |
| 7 | At Curtain Alley, a small promise has your name on it. |
| 8 | At Glow Tunnel, a small promise has your name on it. |
| 9 | At Bright Base, a small promise has your name on it. |
| 10 | At Mirror Street, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is color-team rescue show and civic cheer. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
