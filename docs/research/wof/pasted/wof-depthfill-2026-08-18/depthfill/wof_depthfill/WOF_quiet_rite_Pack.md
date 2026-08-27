# WOF Quiet Rite: Full Start-Depth Pack

> **Release truth.** Quiet Rite is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `quiet_rite` |
| Display name | **Quiet Rite** |
| One-line pitch | Household haunt care and original ritekeeping. |
| Maturity | **teen** |
| rulesModuleId | `steadfast` |
| Theme Kit | **Quiet Rite Theme Kit**, included with world entitlement |
| Genre pattern and fence | Household haunt care and original ritekeeping. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Quiet Rite is a WOF text world about household haunt care and original ritekeeping. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Ghostbusters named place |
| 2 | The Conjuring hero silhouette |
| 3 | Insidious logo geometry |
| 4 | Supernatural TV catchphrase |
| 5 | Jujutsu Kaisen signature costume |
| 6 | Bleach proprietary creature |
| 7 | Phasmophobia map layout |
| 8 | Poltergeist faction title |
| 9 | The Exorcist weapon profile |
| 10 | Casper UI chrome |
| 11 | Ghostbusters quest premise |
| 12 | The Conjuring title typography |
| 13 | Insidious color-coded insignia |
| 14 | Supernatural TV music motif |
| 15 | Jujutsu Kaisen vehicle or mount profile |
| 16 | Bleach companion anatomy |
| 17 | Phasmophobia named artifact |
| 18 | Poltergeist school or agency badge |
| 19 | The Exorcist real sacred practice as minigame |
| 20 | Casper stereotyped cultural shorthand |
| 21 | Ghostbusters real-person likeness |
| 22 | The Conjuring copied dialogue cadence |
| 23 | Insidious fan-server slogan |
| 24 | Supernatural TV paid power framing |
| 25 | Jujutsu Kaisen loot-box presentation |
| 26 | Bleach named place |
| 27 | Phasmophobia hero silhouette |
| 28 | Poltergeist logo geometry |
| 29 | The Exorcist catchphrase |
| 30 | Casper signature costume |
| 31 | Ghostbusters proprietary creature |
| 32 | The Conjuring map layout |
| 33 | Insidious faction title |
| 34 | Supernatural TV weapon profile |
| 35 | Jujutsu Kaisen UI chrome |
| 36 | Bleach quest premise |
| 37 | Phasmophobia title typography |
| 38 | Poltergeist color-coded insignia |
| 39 | The Exorcist music motif |
| 40 | Casper vehicle or mount profile |
| 41 | Ghostbusters companion anatomy |
| 42 | The Conjuring named artifact |
| 43 | Insidious school or agency badge |
| 44 | Supernatural TV real sacred practice as minigame |
| 45 | Jujutsu Kaisen stereotyped cultural shorthand |
| 46 | Bleach real-person likeness |
| 47 | Phasmophobia copied dialogue cadence |
| 48 | Poltergeist fan-server slogan |
| 49 | The Exorcist paid power framing |
| 50 | Casper loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared steadfast, clue, ward and safety contract. |
| Wipe and checkpoint | Wipe returns the party to `quiet_rite_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Quiet Rite • {{turn}} • committed |
| 2 | [Route] Quiet Rite • {{placeId}} • committed |
| 3 | [Work] Quiet Rite • {{lastAction}} • committed |
| 4 | [Talk] Quiet Rite • {{npcId}} • committed |
| 5 | [Kit] Quiet Rite • {{kitId}} • committed |
| 6 | [Pack] Quiet Rite • {{partySize}} • committed |
| 7 | [Rest] Quiet Rite • {{checkpoint}} • committed |
| 8 | [Safety] Quiet Rite • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| quiet_rite_kit_01 | Rite Listener | rite listener workwear | practice rite listener | Never use rite listener authority to remove another person’s choice. | Use the local rhythm of Quiet Rite and make every offer concrete. | rite_listener mantle; rite_listener tool; quiet_rite_map_01 | quiet_rite_place_01; quiet_rite_q_01 | quiet_rite_ability_01 |
| quiet_rite_kit_02 | Bell Sweeper | bell sweeper workwear | practice bell sweeper | Never use bell sweeper authority to remove another person’s choice. | Use the local rhythm of Quiet Rite and make every offer concrete. | bell_sweeper vest; bell_sweeper tool; quiet_rite_map_02 | quiet_rite_place_02; quiet_rite_q_02 | quiet_rite_ability_02 |
| quiet_rite_kit_03 | Sigh Gardener | sigh gardener workwear | practice sigh gardener | Never use sigh gardener authority to remove another person’s choice. | Use the local rhythm of Quiet Rite and make every offer concrete. | sigh_gardener jacket; sigh_gardener tool; quiet_rite_map_03 | quiet_rite_place_01; quiet_rite_q_03 | quiet_rite_ability_03 |
| quiet_rite_kit_04 | Porch Witness | porch witness workwear | practice porch witness | Never use porch witness authority to remove another person’s choice. | Use the local rhythm of Quiet Rite and make every offer concrete. | porch_witness sash; porch_witness tool; quiet_rite_map_04 | quiet_rite_place_02; quiet_rite_q_04 | quiet_rite_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `quiet_rite_place_01` is a shared hub rather than a capital analogue; `quiet_rite_place_04` is the mid-join; `quiet_rite_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| quiet_rite_place_01 | Rite House | shared hub | street | safe | yes | quiet_rite_place_02, quiet_rite_place_04 | A public notice at Rite House has been posted with one crucial line washed away. |
| quiet_rite_place_02 | Candle Street | start hub | street | safe | yes | quiet_rite_place_01, quiet_rite_place_03 | A work roster at Candle Street leaves two neighbours believing they were promised the same task. |
| quiet_rite_place_03 | Sigh Garden | street route | street | safe | yes | quiet_rite_place_02, quiet_rite_place_04 | A route marker at Sigh Garden points visitors toward a closed gate and needs a safe correction. |
| quiet_rite_place_04 | Bell Cellar | mid join | street | low | yes | quiet_rite_place_03, quiet_rite_place_05, quiet_rite_place_01 | A newcomer at Bell Cellar needs a local introduction before a small obligation becomes embarrassing. |
| quiet_rite_place_05 | Porch Row | work district | interior | low | no | quiet_rite_place_04, quiet_rite_place_06 | A shared tool at Porch Row has been returned without its care tag. |
| quiet_rite_place_06 | Thread Chapel | instance door | dungeon | medium | no | quiet_rite_place_05, quiet_rite_place_07 | The entry record at Thread Chapel names an unfinished errand, not a monster or apocalypse. |
| quiet_rite_place_07 | Saltless Well | wild edge | street | medium | yes | quiet_rite_place_06, quiet_rite_place_08 | A weather change at Saltless Well threatens a community plan unless someone reads the signs. |
| quiet_rite_place_08 | Hearth Room | housing approach | interior | low | no | quiet_rite_place_07 | A resident at Hearth Room has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| quiet_rite_npc_01 | Alden Vane | quiet_rite_place_01 | quest | Alden Vane says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Rite House: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_02 | Bryn Quill | quiet_rite_place_02 | profession | Bryn Quill says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Candle Street: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_03 | Cato Vale | quiet_rite_place_03 | hub | Cato Vale says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Sigh Garden: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_04 | Dessa Wren | quiet_rite_place_04 | merchant | Dessa Wren says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Bell Cellar: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_05 | Eris Morrow | quiet_rite_place_01 | local | Eris Morrow says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Rite House: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_06 | Fenn Rowan | quiet_rite_place_02 | host | Fenn Rowan says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Candle Street: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_07 | Gala Nook | quiet_rite_place_03 | quest | Gala Nook says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Sigh Garden: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_08 | Holl Cress | quiet_rite_place_04 | profession | Holl Cress says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Bell Cellar: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_09 | Ivo Silt | quiet_rite_place_01 | local | Ivo Silt says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Rite House: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_rite_npc_10 | Jori Pryce | quiet_rite_place_02 | merchant | Jori Pryce says, ‘Quiet Rite keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Candle Street: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Bell Cellar, if that is useful. |
| 2 | Quiet Rite feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Thread Chapel. |
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
| Rite Listener | At Rite House, you arrive in rite_listener mantle carrying quiet_rite_map_01. A small obligation is already late. | Give up one turn to help now. | Quiet Rite: Name a Working Promise |
| Bell Sweeper | At Candle Street, you arrive in bell_sweeper vest carrying quiet_rite_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Quiet Rite: Set the First Tool Aside |
| Sigh Gardener | At Rite House, you arrive in sigh_gardener jacket carrying quiet_rite_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Quiet Rite: Carry the Right Record |
| Porch Witness | At Candle Street, you arrive in porch_witness sash carrying quiet_rite_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Quiet Rite: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_quiet_rite_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Rite House’s small mismatch | ask | missing tag | A local need at Bell Cellar is connected but not catastrophic. | alternate talk |
| 2 | Resolve Candle Street’s small mismatch | repair | closed path | A local need at Porch Row is connected but not catastrophic. | new route |
| 3 | Resolve Sigh Garden’s small mismatch | carry | unclear note | A local need at Thread Chapel is connected but not catastrophic. | recorded favor |
| 4 | Resolve Bell Cellar’s small mismatch | listen | late guest | A local need at Saltless Well is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Porch Row’s small mismatch | map | wet weather | A local need at Hearth Room is connected but not catastrophic. | slower reward |
| 6 | Resolve Thread Chapel’s small mismatch | prepare | busy shift | A local need at Rite House is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Saltless Well’s small mismatch | wait | quiet boundary | A local need at Candle Street is connected but not catastrophic. | solo option |
| 8 | Resolve Hearth Room’s small mismatch | return | wrong room | A local need at Sigh Garden is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Bell Cellar Listening` and `Candle Street Homecoming`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| quiet_rite_q_01 | Quiet Rite: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| quiet_rite_q_02 | Quiet Rite: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| quiet_rite_q_03 | Quiet Rite: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| quiet_rite_q_04 | Quiet Rite: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| quiet_rite_q_05 | Quiet Rite: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| quiet_rite_q_06 | Quiet Rite: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| quiet_rite_q_07 | Quiet Rite: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| quiet_rite_q_08 | Quiet Rite: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| quiet_rite_q_09 | Quiet Rite: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| quiet_rite_q_10 | Quiet Rite: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| quiet_rite_q_11 | Quiet Rite: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| quiet_rite_q_12 | Quiet Rite: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| quiet_rite_q_13 | Quiet Rite: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| quiet_rite_q_14 | Quiet Rite: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| quiet_rite_q_15 | Quiet Rite: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| quiet_rite_q_16 | Quiet Rite: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| quiet_rite_q_17 | Quiet Rite: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| quiet_rite_q_18 | Quiet Rite: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| quiet_rite_q_19 | Quiet Rite: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| quiet_rite_q_20 | Quiet Rite: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| quiet_rite_q_21 | Quiet Rite: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| quiet_rite_q_22 | Quiet Rite: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| quiet_rite_q_23 | Quiet Rite: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| quiet_rite_q_24 | Quiet Rite: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| quiet_rite_q_25 | Quiet Rite: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Rite House`: write `quiet_rite_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Bell Cellar`: write `quiet_rite_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `quiet_rite_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| quiet_rite_species_01 | Bell Moth | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_02 | Salt Dog | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_03 | Porch Owl | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_04 | Thread Fish | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_05 | Quiet Rite Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_06 | Quiet Rite Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_07 | Quiet Rite Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_08 | Quiet Rite Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_09 | Quiet Rite Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_10 | Quiet Rite Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_11 | Quiet Rite Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_12 | Quiet Rite Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_13 | Quiet Rite Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_14 | Quiet Rite Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_15 | Quiet Rite Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_16 | Quiet Rite Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_17 | Quiet Rite Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_rite_species_18 | Quiet Rite Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Rite Pennies**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Bell Threads**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Rite House token, Candle Street tool, Sigh Garden thread, Bell Cellar seal, Porch Row bundle, Thread Chapel token. |
| Instance and cosmetic templates | Saltless Well tool, Hearth Room thread, Rite House seal, Candle Street bundle, Sigh Garden token, Bell Cellar tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `quiet_rite_vendor_01` at `quiet_rite_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| quiet_rite_dungeon_room_01 | The Bell Cellar Listening: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: quiet_rite_species_01, quiet_rite_species_02; elite: none |   |
| quiet_rite_dungeon_room_02 | The Bell Cellar Listening: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: quiet_rite_species_03, quiet_rite_species_04; elite: none |   |
| quiet_rite_dungeon_room_03 | The Bell Cellar Listening: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: quiet_rite_species_05, quiet_rite_species_06; elite: quiet_rite_species_09 |   |
| quiet_rite_dungeon_room_04 | The Bell Cellar Listening: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: quiet_rite_species_07, quiet_rite_species_08; elite: none | checkpoint  |
| quiet_rite_dungeon_room_05 | The Bell Cellar Listening: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: quiet_rite_species_09, quiet_rite_species_10; elite: none |  boss: quiet_rite_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`quiet_rite_trap_01`), jammed latch (`quiet_rite_trap_02`), wet threshold (`quiet_rite_trap_03`), false shelf (`quiet_rite_trap_04`), quiet bell (`quiet_rite_trap_05`), sealed drawer (`quiet_rite_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Candle Street Homecoming** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| quiet_rite_talent_01 | Quiet Rite Local Ear | 1 | none | quiet_rite_effect_01 |
| quiet_rite_talent_02 | Quiet Rite Careful Hand | 2 | none | quiet_rite_effect_02 |
| quiet_rite_talent_03 | Quiet Rite Route Sense | 3 | none | quiet_rite_effect_03 |
| quiet_rite_talent_04 | Quiet Rite Shared Measure | 4 | none | quiet_rite_effect_04 |
| quiet_rite_talent_05 | Quiet Rite Quiet Craft | 1 | quiet_rite_talent_04 | quiet_rite_effect_05 |
| quiet_rite_talent_06 | Quiet Rite Open Invitation | 2 | none | quiet_rite_effect_06 |
| quiet_rite_talent_07 | Quiet Rite Safe Return | 3 | none | quiet_rite_effect_07 |
| quiet_rite_talent_08 | Quiet Rite Field Note | 4 | none | quiet_rite_effect_08 |
| quiet_rite_talent_09 | Quiet Rite Steady Pace | 1 | quiet_rite_talent_08 | quiet_rite_effect_09 |
| quiet_rite_talent_10 | Quiet Rite Clear Signal | 2 | none | quiet_rite_effect_10 |
| quiet_rite_talent_11 | Quiet Rite Warm Welcome | 3 | none | quiet_rite_effect_11 |
| quiet_rite_talent_12 | Quiet Rite Small Courage | 4 | none | quiet_rite_effect_12 |
| quiet_rite_talent_13 | Quiet Rite Repair Habit | 1 | quiet_rite_talent_12 | quiet_rite_effect_13 |
| quiet_rite_talent_14 | Quiet Rite Trust Mark | 2 | none | quiet_rite_effect_14 |
| quiet_rite_talent_15 | Quiet Rite Second Look | 3 | none | quiet_rite_effect_15 |
| quiet_rite_talent_16 | Quiet Rite Closing Grace | 4 | none | quiet_rite_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| quiet_rite_contract_01 | Quiet Rite Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| quiet_rite_contract_02 | Quiet Rite Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| quiet_rite_contract_03 | Quiet Rite Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| quiet_rite_contract_04 | Quiet Rite Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| quiet_rite_contract_05 | Quiet Rite Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| quiet_rite_contract_06 | Quiet Rite Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| quiet_rite_contract_07 | Quiet Rite Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| quiet_rite_contract_08 | Quiet Rite Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| quiet_rite_interact_01 | Rite House bench | rest | quiet_rite_place_01 |
| quiet_rite_interact_02 | Candle Street cabinet | repair | quiet_rite_place_02 |
| quiet_rite_interact_03 | Sigh Garden rack | tend | quiet_rite_place_03 |
| quiet_rite_interact_04 | Bell Cellar kettle | craft | quiet_rite_place_04 |
| quiet_rite_interact_05 | Porch Row ledger | cook | quiet_rite_place_05 |
| quiet_rite_interact_06 | Thread Chapel rail | bind_inn | quiet_rite_place_06 |
| quiet_rite_interact_07 | Saltless Well bell | inspect | quiet_rite_place_07 |
| quiet_rite_interact_08 | Hearth Room board | open | quiet_rite_place_08 |
| quiet_rite_interact_09 | Rite House table | carry | quiet_rite_place_01 |
| quiet_rite_interact_10 | Candle Street lamp | clean | quiet_rite_place_02 |
| quiet_rite_interact_11 | Sigh Garden gate | signal | quiet_rite_place_03 |
| quiet_rite_interact_12 | Bell Cellar shelf | record | quiet_rite_place_04 |


**Default interior graph.** `quiet_rite_interior_01` enters from `quiet_rite_place_08` and contains 7 connected rooms: Quiet Rite Entry, Quiet Rite Main Room, Quiet Rite Work Nook, Quiet Rite Window Room, Quiet Rite Quiet Room, Quiet Rite Storage, Quiet Rite Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | rite, candle, sigh, bell materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Quiet Rite` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Quiet Rite and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Quiet Rite: distant work, a room tone, a gentle rhythm that belongs to Rite House, and a second layer that makes the route toward Thread Chapel feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Quiet Rite Ledger |
| 2 | Quiet Rite Route |
| 3 | Quiet Rite Work |
| 4 | Quiet Rite Talk |
| 5 | Quiet Rite Kit |
| 6 | Quiet Rite Pack |
| 7 | Quiet Rite Rest |
| 8 | Quiet Rite Safety |
| 9 | Quiet Rite Map |
| 10 | Quiet Rite Notice |
| 11 | Quiet Rite Favour |
| 12 | Quiet Rite Gold |
| 13 | Quiet Rite Token |
| 14 | Quiet Rite Record |
| 15 | Quiet Rite Instance |
| 16 | Quiet Rite Checkpoint |
| 17 | Quiet Rite Choice |
| 18 | Quiet Rite Help |
| 19 | Quiet Rite Calendar |
| 20 | Quiet Rite Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Rite House, a small promise has your name on it. |
| 2 | At Candle Street, a small promise has your name on it. |
| 3 | At Sigh Garden, a small promise has your name on it. |
| 4 | At Bell Cellar, a small promise has your name on it. |
| 5 | At Porch Row, a small promise has your name on it. |
| 6 | At Thread Chapel, a small promise has your name on it. |
| 7 | At Saltless Well, a small promise has your name on it. |
| 8 | At Hearth Room, a small promise has your name on it. |
| 9 | At Rite House, a small promise has your name on it. |
| 10 | At Candle Street, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is household haunt care and original ritekeeping. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
