# WOF Drumline Coast: Full Start-Depth Pack

> **Release truth.** Drumline Coast is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `drumline_coast` |
| Display name | **Drumline Coast** |
| One-line pitch | Original coastal praise-house and message-route community. |
| Maturity | **all-ages** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Drumline Coast Theme Kit**, included with world entitlement |
| Genre pattern and fence | Original coastal praise-house and message-route community. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Drumline Coast is a WOF text world about original coastal praise-house and message-route community. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | West African sacred rite named place |
| 2 | Black Panther Wakanda hero silhouette |
| 3 | Lion King logo geometry |
| 4 | Jumanji catchphrase |
| 5 | real drum language signature costume |
| 6 | colonial safari proprietary creature |
| 7 | tribal stereotype map layout |
| 8 | African mask souvenir faction title |
| 9 | Tarzan weapon profile |
| 10 | Mufasa UI chrome |
| 11 | West African sacred rite quest premise |
| 12 | Black Panther Wakanda title typography |
| 13 | Lion King color-coded insignia |
| 14 | Jumanji music motif |
| 15 | real drum language vehicle or mount profile |
| 16 | colonial safari companion anatomy |
| 17 | tribal stereotype named artifact |
| 18 | African mask souvenir school or agency badge |
| 19 | Tarzan real sacred practice as minigame |
| 20 | Mufasa stereotyped cultural shorthand |
| 21 | West African sacred rite real-person likeness |
| 22 | Black Panther Wakanda copied dialogue cadence |
| 23 | Lion King fan-server slogan |
| 24 | Jumanji paid power framing |
| 25 | real drum language loot-box presentation |
| 26 | colonial safari named place |
| 27 | tribal stereotype hero silhouette |
| 28 | African mask souvenir logo geometry |
| 29 | Tarzan catchphrase |
| 30 | Mufasa signature costume |
| 31 | West African sacred rite proprietary creature |
| 32 | Black Panther Wakanda map layout |
| 33 | Lion King faction title |
| 34 | Jumanji weapon profile |
| 35 | real drum language UI chrome |
| 36 | colonial safari quest premise |
| 37 | tribal stereotype title typography |
| 38 | African mask souvenir color-coded insignia |
| 39 | Tarzan music motif |
| 40 | Mufasa vehicle or mount profile |
| 41 | West African sacred rite companion anatomy |
| 42 | Black Panther Wakanda named artifact |
| 43 | Lion King school or agency badge |
| 44 | Jumanji real sacred practice as minigame |
| 45 | real drum language stereotyped cultural shorthand |
| 46 | colonial safari real-person likeness |
| 47 | tribal stereotype copied dialogue cadence |
| 48 | African mask souvenir fan-server slogan |
| 49 | Tarzan paid power framing |
| 50 | Mufasa loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `drumline_coast_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Drumline Coast • {{turn}} • committed |
| 2 | [Route] Drumline Coast • {{placeId}} • committed |
| 3 | [Work] Drumline Coast • {{lastAction}} • committed |
| 4 | [Talk] Drumline Coast • {{npcId}} • committed |
| 5 | [Kit] Drumline Coast • {{kitId}} • committed |
| 6 | [Pack] Drumline Coast • {{partySize}} • committed |
| 7 | [Rest] Drumline Coast • {{checkpoint}} • committed |
| 8 | [Safety] Drumline Coast • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| drumline_coast_kit_01 | Praise Caller | praise caller workwear | practice praise caller | Never use praise caller authority to remove another person’s choice. | Use the local rhythm of Drumline Coast and make every offer concrete. | praise_caller mantle; praise_caller tool; drumline_coast_map_01 | drumline_coast_place_01; drumline_coast_q_01 | drumline_coast_ability_01 |
| drumline_coast_kit_02 | Drum Mapper | drum mapper workwear | practice drum mapper | Never use drum mapper authority to remove another person’s choice. | Use the local rhythm of Drumline Coast and make every offer concrete. | drum_mapper vest; drum_mapper tool; drumline_coast_map_02 | drumline_coast_place_02; drumline_coast_q_02 | drumline_coast_ability_02 |
| drumline_coast_kit_03 | Clay Porter | clay porter workwear | practice clay porter | Never use clay porter authority to remove another person’s choice. | Use the local rhythm of Drumline Coast and make every offer concrete. | clay_porter jacket; clay_porter tool; drumline_coast_map_03 | drumline_coast_place_01; drumline_coast_q_03 | drumline_coast_ability_03 |
| drumline_coast_kit_04 | Grove Host | grove host workwear | practice grove host | Never use grove host authority to remove another person’s choice. | Use the local rhythm of Drumline Coast and make every offer concrete. | grove_host sash; grove_host tool; drumline_coast_map_04 | drumline_coast_place_02; drumline_coast_q_04 | drumline_coast_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `drumline_coast_place_01` is a shared hub rather than a capital analogue; `drumline_coast_place_04` is the mid-join; `drumline_coast_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| drumline_coast_place_01 | Palm Quay | shared hub | street | safe | yes | drumline_coast_place_02, drumline_coast_place_04 | A public notice at Palm Quay has been posted with one crucial line washed away. |
| drumline_coast_place_02 | Echo Market | start hub | street | safe | yes | drumline_coast_place_01, drumline_coast_place_03 | A work roster at Echo Market leaves two neighbours believing they were promised the same task. |
| drumline_coast_place_03 | Red Clay Steps | street route | street | safe | yes | drumline_coast_place_02, drumline_coast_place_04 | A route marker at Red Clay Steps points visitors toward a closed gate and needs a safe correction. |
| drumline_coast_place_04 | Lantern Grove | mid join | street | low | yes | drumline_coast_place_03, drumline_coast_place_05, drumline_coast_place_01 | A newcomer at Lantern Grove needs a local introduction before a small obligation becomes embarrassing. |
| drumline_coast_place_05 | Tide Drum | work district | interior | low | no | drumline_coast_place_04, drumline_coast_place_06 | A shared tool at Tide Drum has been returned without its care tag. |
| drumline_coast_place_06 | Mango Yard | instance door | dungeon | medium | no | drumline_coast_place_05, drumline_coast_place_07 | The entry record at Mango Yard names an unfinished errand, not a monster or apocalypse. |
| drumline_coast_place_07 | Saffron Pier | wild edge | street | medium | yes | drumline_coast_place_06, drumline_coast_place_08 | A weather change at Saffron Pier threatens a community plan unless someone reads the signs. |
| drumline_coast_place_08 | Longshade Hall | housing approach | interior | low | no | drumline_coast_place_07 | A resident at Longshade Hall has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| drumline_coast_npc_01 | Eris Silt | drumline_coast_place_01 | quest | Eris Silt says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Eris Silt offers a specific task at Palm Quay: settle the practical mismatch before it costs someone a shift. | Eris Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_02 | Fenn Pryce | drumline_coast_place_02 | profession | Fenn Pryce says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Fenn Pryce offers a specific task at Echo Market: settle the practical mismatch before it costs someone a shift. | Fenn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_03 | Gala Vane | drumline_coast_place_03 | hub | Gala Vane says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Gala Vane offers a specific task at Red Clay Steps: settle the practical mismatch before it costs someone a shift. | Gala Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_04 | Holl Quill | drumline_coast_place_04 | merchant | Holl Quill says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Holl Quill offers a specific task at Lantern Grove: settle the practical mismatch before it costs someone a shift. | Holl Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_05 | Ivo Vale | drumline_coast_place_01 | local | Ivo Vale says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vale offers a specific task at Palm Quay: settle the practical mismatch before it costs someone a shift. | Ivo Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_06 | Jori Wren | drumline_coast_place_02 | host | Jori Wren says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Jori Wren offers a specific task at Echo Market: settle the practical mismatch before it costs someone a shift. | Jori Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_07 | Alden Morrow | drumline_coast_place_03 | quest | Alden Morrow says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Alden Morrow offers a specific task at Red Clay Steps: settle the practical mismatch before it costs someone a shift. | Alden Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_08 | Bryn Rowan | drumline_coast_place_04 | profession | Bryn Rowan says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Bryn Rowan offers a specific task at Lantern Grove: settle the practical mismatch before it costs someone a shift. | Bryn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_09 | Cato Nook | drumline_coast_place_01 | local | Cato Nook says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Cato Nook offers a specific task at Palm Quay: settle the practical mismatch before it costs someone a shift. | Cato Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| drumline_coast_npc_10 | Dessa Cress | drumline_coast_place_02 | merchant | Dessa Cress says, ‘Drumline Coast keeps its promises in small places. Tell me which one you noticed.’ | Dessa Cress offers a specific task at Echo Market: settle the practical mismatch before it costs someone a shift. | Dessa Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Lantern Grove, if that is useful. |
| 2 | Drumline Coast feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Mango Yard. |
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
| Praise Caller | At Palm Quay, you arrive in praise_caller mantle carrying drumline_coast_map_01. A small obligation is already late. | Give up one turn to help now. | Drumline Coast: Name a Working Promise |
| Drum Mapper | At Echo Market, you arrive in drum_mapper vest carrying drumline_coast_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Drumline Coast: Set the First Tool Aside |
| Clay Porter | At Palm Quay, you arrive in clay_porter jacket carrying drumline_coast_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Drumline Coast: Carry the Right Record |
| Grove Host | At Echo Market, you arrive in grove_host sash carrying drumline_coast_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Drumline Coast: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_drumline_coast_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Palm Quay’s small mismatch | ask | missing tag | A local need at Lantern Grove is connected but not catastrophic. | alternate talk |
| 2 | Resolve Echo Market’s small mismatch | repair | closed path | A local need at Tide Drum is connected but not catastrophic. | new route |
| 3 | Resolve Red Clay Steps’s small mismatch | carry | unclear note | A local need at Mango Yard is connected but not catastrophic. | recorded favor |
| 4 | Resolve Lantern Grove’s small mismatch | listen | late guest | A local need at Saffron Pier is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Tide Drum’s small mismatch | map | wet weather | A local need at Longshade Hall is connected but not catastrophic. | slower reward |
| 6 | Resolve Mango Yard’s small mismatch | prepare | busy shift | A local need at Palm Quay is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Saffron Pier’s small mismatch | wait | quiet boundary | A local need at Echo Market is connected but not catastrophic. | solo option |
| 8 | Resolve Longshade Hall’s small mismatch | return | wrong room | A local need at Red Clay Steps is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Tide Drum Answer` and `Longshade Welcome Feast`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| drumline_coast_q_01 | Drumline Coast: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| drumline_coast_q_02 | Drumline Coast: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| drumline_coast_q_03 | Drumline Coast: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| drumline_coast_q_04 | Drumline Coast: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| drumline_coast_q_05 | Drumline Coast: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| drumline_coast_q_06 | Drumline Coast: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| drumline_coast_q_07 | Drumline Coast: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| drumline_coast_q_08 | Drumline Coast: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| drumline_coast_q_09 | Drumline Coast: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| drumline_coast_q_10 | Drumline Coast: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| drumline_coast_q_11 | Drumline Coast: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| drumline_coast_q_12 | Drumline Coast: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| drumline_coast_q_13 | Drumline Coast: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| drumline_coast_q_14 | Drumline Coast: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| drumline_coast_q_15 | Drumline Coast: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| drumline_coast_q_16 | Drumline Coast: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| drumline_coast_q_17 | Drumline Coast: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| drumline_coast_q_18 | Drumline Coast: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| drumline_coast_q_19 | Drumline Coast: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| drumline_coast_q_20 | Drumline Coast: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| drumline_coast_q_21 | Drumline Coast: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| drumline_coast_q_22 | Drumline Coast: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| drumline_coast_q_23 | Drumline Coast: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| drumline_coast_q_24 | Drumline Coast: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| drumline_coast_q_25 | Drumline Coast: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Palm Quay`: write `drumline_coast_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Lantern Grove`: write `drumline_coast_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `drumline_coast_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| drumline_coast_species_01 | Palm Civet | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_02 | Drum Heron | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_03 | Copper Antelope | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_04 | Rain Gecko | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_05 | Drumline Coast Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_06 | Drumline Coast Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_07 | Drumline Coast Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_08 | Drumline Coast Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_09 | Drumline Coast Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_10 | Drumline Coast Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_11 | Drumline Coast Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_12 | Drumline Coast Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_13 | Drumline Coast Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_14 | Drumline Coast Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_15 | Drumline Coast Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_16 | Drumline Coast Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_17 | Drumline Coast Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| drumline_coast_species_18 | Drumline Coast Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Coast Shells**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Drum Beads**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Palm Quay token, Echo Market tool, Red Clay Steps thread, Lantern Grove seal, Tide Drum bundle, Mango Yard token. |
| Instance and cosmetic templates | Saffron Pier tool, Longshade Hall thread, Palm Quay seal, Echo Market bundle, Red Clay Steps token, Lantern Grove tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `drumline_coast_vendor_01` at `drumline_coast_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| drumline_coast_dungeon_room_01 | The Tide Drum Answer: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: drumline_coast_species_01, drumline_coast_species_02; elite: none |   |
| drumline_coast_dungeon_room_02 | The Tide Drum Answer: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: drumline_coast_species_03, drumline_coast_species_04; elite: none |   |
| drumline_coast_dungeon_room_03 | The Tide Drum Answer: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: drumline_coast_species_05, drumline_coast_species_06; elite: drumline_coast_species_09 |   |
| drumline_coast_dungeon_room_04 | The Tide Drum Answer: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: drumline_coast_species_07, drumline_coast_species_08; elite: none | checkpoint  |
| drumline_coast_dungeon_room_05 | The Tide Drum Answer: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: drumline_coast_species_09, drumline_coast_species_10; elite: none |  boss: drumline_coast_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`drumline_coast_trap_01`), jammed latch (`drumline_coast_trap_02`), wet threshold (`drumline_coast_trap_03`), false shelf (`drumline_coast_trap_04`), quiet bell (`drumline_coast_trap_05`), sealed drawer (`drumline_coast_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Longshade Welcome Feast** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| drumline_coast_talent_01 | Drumline Coast Local Ear | 1 | none | drumline_coast_effect_01 |
| drumline_coast_talent_02 | Drumline Coast Careful Hand | 2 | none | drumline_coast_effect_02 |
| drumline_coast_talent_03 | Drumline Coast Route Sense | 3 | none | drumline_coast_effect_03 |
| drumline_coast_talent_04 | Drumline Coast Shared Measure | 4 | none | drumline_coast_effect_04 |
| drumline_coast_talent_05 | Drumline Coast Quiet Craft | 1 | drumline_coast_talent_04 | drumline_coast_effect_05 |
| drumline_coast_talent_06 | Drumline Coast Open Invitation | 2 | none | drumline_coast_effect_06 |
| drumline_coast_talent_07 | Drumline Coast Safe Return | 3 | none | drumline_coast_effect_07 |
| drumline_coast_talent_08 | Drumline Coast Field Note | 4 | none | drumline_coast_effect_08 |
| drumline_coast_talent_09 | Drumline Coast Steady Pace | 1 | drumline_coast_talent_08 | drumline_coast_effect_09 |
| drumline_coast_talent_10 | Drumline Coast Clear Signal | 2 | none | drumline_coast_effect_10 |
| drumline_coast_talent_11 | Drumline Coast Warm Welcome | 3 | none | drumline_coast_effect_11 |
| drumline_coast_talent_12 | Drumline Coast Small Courage | 4 | none | drumline_coast_effect_12 |
| drumline_coast_talent_13 | Drumline Coast Repair Habit | 1 | drumline_coast_talent_12 | drumline_coast_effect_13 |
| drumline_coast_talent_14 | Drumline Coast Trust Mark | 2 | none | drumline_coast_effect_14 |
| drumline_coast_talent_15 | Drumline Coast Second Look | 3 | none | drumline_coast_effect_15 |
| drumline_coast_talent_16 | Drumline Coast Closing Grace | 4 | none | drumline_coast_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| drumline_coast_contract_01 | Drumline Coast Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| drumline_coast_contract_02 | Drumline Coast Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| drumline_coast_contract_03 | Drumline Coast Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| drumline_coast_contract_04 | Drumline Coast Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| drumline_coast_contract_05 | Drumline Coast Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| drumline_coast_contract_06 | Drumline Coast Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| drumline_coast_contract_07 | Drumline Coast Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| drumline_coast_contract_08 | Drumline Coast Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| drumline_coast_interact_01 | Palm Quay bench | rest | drumline_coast_place_01 |
| drumline_coast_interact_02 | Echo Market cabinet | repair | drumline_coast_place_02 |
| drumline_coast_interact_03 | Red Clay Steps rack | tend | drumline_coast_place_03 |
| drumline_coast_interact_04 | Lantern Grove kettle | craft | drumline_coast_place_04 |
| drumline_coast_interact_05 | Tide Drum ledger | cook | drumline_coast_place_05 |
| drumline_coast_interact_06 | Mango Yard rail | bind_inn | drumline_coast_place_06 |
| drumline_coast_interact_07 | Saffron Pier bell | inspect | drumline_coast_place_07 |
| drumline_coast_interact_08 | Longshade Hall board | open | drumline_coast_place_08 |
| drumline_coast_interact_09 | Palm Quay table | carry | drumline_coast_place_01 |
| drumline_coast_interact_10 | Echo Market lamp | clean | drumline_coast_place_02 |
| drumline_coast_interact_11 | Red Clay Steps gate | signal | drumline_coast_place_03 |
| drumline_coast_interact_12 | Lantern Grove shelf | record | drumline_coast_place_04 |


**Default interior graph.** `drumline_coast_interior_01` enters from `drumline_coast_place_08` and contains 7 connected rooms: Drumline Coast Entry, Drumline Coast Main Room, Drumline Coast Work Nook, Drumline Coast Window Room, Drumline Coast Quiet Room, Drumline Coast Storage, Drumline Coast Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | palm, echo, red, lantern materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Drumline Coast` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Drumline Coast and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Drumline Coast: distant work, a room tone, a gentle rhythm that belongs to Palm Quay, and a second layer that makes the route toward Mango Yard feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Drumline Coast Ledger |
| 2 | Drumline Coast Route |
| 3 | Drumline Coast Work |
| 4 | Drumline Coast Talk |
| 5 | Drumline Coast Kit |
| 6 | Drumline Coast Pack |
| 7 | Drumline Coast Rest |
| 8 | Drumline Coast Safety |
| 9 | Drumline Coast Map |
| 10 | Drumline Coast Notice |
| 11 | Drumline Coast Favour |
| 12 | Drumline Coast Gold |
| 13 | Drumline Coast Token |
| 14 | Drumline Coast Record |
| 15 | Drumline Coast Instance |
| 16 | Drumline Coast Checkpoint |
| 17 | Drumline Coast Choice |
| 18 | Drumline Coast Help |
| 19 | Drumline Coast Calendar |
| 20 | Drumline Coast Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Palm Quay, a small promise has your name on it. |
| 2 | At Echo Market, a small promise has your name on it. |
| 3 | At Red Clay Steps, a small promise has your name on it. |
| 4 | At Lantern Grove, a small promise has your name on it. |
| 5 | At Tide Drum, a small promise has your name on it. |
| 6 | At Mango Yard, a small promise has your name on it. |
| 7 | At Saffron Pier, a small promise has your name on it. |
| 8 | At Longshade Hall, a small promise has your name on it. |
| 9 | At Palm Quay, a small promise has your name on it. |
| 10 | At Echo Market, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is original coastal praise-house and message-route community. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
