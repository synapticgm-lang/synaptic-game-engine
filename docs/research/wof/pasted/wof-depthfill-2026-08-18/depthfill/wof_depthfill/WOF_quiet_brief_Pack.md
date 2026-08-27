# WOF Quiet Brief: Full Start-Depth Pack

> **Release truth.** Quiet Brief is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `quiet_brief` |
| Display name | **Quiet Brief** |
| One-line pitch | Cover-story investigation and careful extraction. |
| Maturity | **teen** |
| rulesModuleId | `heat_cover` |
| Theme Kit | **Quiet Brief Theme Kit**, included with world entitlement |
| Genre pattern and fence | Cover-story investigation and careful extraction. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Quiet Brief is a WOF text world about cover-story investigation and careful extraction. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | James Bond named place |
| 2 | Mission Impossible hero silhouette |
| 3 | Kingsman logo geometry |
| 4 | CIA seal catchphrase |
| 5 | MI6 signature costume |
| 6 | Jason Bourne proprietary creature |
| 7 | Metal Gear map layout |
| 8 | Splinter Cell faction title |
| 9 | Get Smart weapon profile |
| 10 | The Man from UNCLE UI chrome |
| 11 | James Bond quest premise |
| 12 | Mission Impossible title typography |
| 13 | Kingsman color-coded insignia |
| 14 | CIA seal music motif |
| 15 | MI6 vehicle or mount profile |
| 16 | Jason Bourne companion anatomy |
| 17 | Metal Gear named artifact |
| 18 | Splinter Cell school or agency badge |
| 19 | Get Smart real sacred practice as minigame |
| 20 | The Man from UNCLE stereotyped cultural shorthand |
| 21 | James Bond real-person likeness |
| 22 | Mission Impossible copied dialogue cadence |
| 23 | Kingsman fan-server slogan |
| 24 | CIA seal paid power framing |
| 25 | MI6 loot-box presentation |
| 26 | Jason Bourne named place |
| 27 | Metal Gear hero silhouette |
| 28 | Splinter Cell logo geometry |
| 29 | Get Smart catchphrase |
| 30 | The Man from UNCLE signature costume |
| 31 | James Bond proprietary creature |
| 32 | Mission Impossible map layout |
| 33 | Kingsman faction title |
| 34 | CIA seal weapon profile |
| 35 | MI6 UI chrome |
| 36 | Jason Bourne quest premise |
| 37 | Metal Gear title typography |
| 38 | Splinter Cell color-coded insignia |
| 39 | Get Smart music motif |
| 40 | The Man from UNCLE vehicle or mount profile |
| 41 | James Bond companion anatomy |
| 42 | Mission Impossible named artifact |
| 43 | Kingsman school or agency badge |
| 44 | CIA seal real sacred practice as minigame |
| 45 | MI6 stereotyped cultural shorthand |
| 46 | Jason Bourne real-person likeness |
| 47 | Metal Gear copied dialogue cadence |
| 48 | Splinter Cell fan-server slogan |
| 49 | Get Smart paid power framing |
| 50 | The Man from UNCLE loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | hp, cover, heat, evidence, contacts, caseClock, gear, trust |
| Wipe and checkpoint | Wipe returns the party to `quiet_brief_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Quiet Brief • {{turn}} • committed |
| 2 | [Route] Quiet Brief • {{placeId}} • committed |
| 3 | [Work] Quiet Brief • {{lastAction}} • committed |
| 4 | [Talk] Quiet Brief • {{npcId}} • committed |
| 5 | [Kit] Quiet Brief • {{kitId}} • committed |
| 6 | [Pack] Quiet Brief • {{partySize}} • committed |
| 7 | [Rest] Quiet Brief • {{checkpoint}} • committed |
| 8 | [Safety] Quiet Brief • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| quiet_brief_kit_01 | Cover Tailor | cover tailor workwear | practice cover tailor | Never use cover tailor authority to remove another person’s choice. | Use the local rhythm of Quiet Brief and make every offer concrete. | cover_tailor mantle; cover_tailor tool; quiet_brief_map_01 | quiet_brief_place_01; quiet_brief_q_01 | quiet_brief_ability_01 |
| quiet_brief_kit_02 | Signal Listener | signal listener workwear | practice signal listener | Never use signal listener authority to remove another person’s choice. | Use the local rhythm of Quiet Brief and make every offer concrete. | signal_listener vest; signal_listener tool; quiet_brief_map_02 | quiet_brief_place_02; quiet_brief_q_02 | quiet_brief_ability_02 |
| quiet_brief_kit_03 | Paper Forger | paper forger workwear | practice paper forger | Never use paper forger authority to remove another person’s choice. | Use the local rhythm of Quiet Brief and make every offer concrete. | paper_forger jacket; paper_forger tool; quiet_brief_map_03 | quiet_brief_place_01; quiet_brief_q_03 | quiet_brief_ability_03 |
| quiet_brief_kit_04 | Rain Extractor | rain extractor workwear | practice rain extractor | Never use rain extractor authority to remove another person’s choice. | Use the local rhythm of Quiet Brief and make every offer concrete. | rain_extractor sash; rain_extractor tool; quiet_brief_map_04 | quiet_brief_place_02; quiet_brief_q_04 | quiet_brief_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `quiet_brief_place_01` is a shared hub rather than a capital analogue; `quiet_brief_place_04` is the mid-join; `quiet_brief_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| quiet_brief_place_01 | Civic Annex | shared hub | street | safe | yes | quiet_brief_place_02, quiet_brief_place_04 | A public notice at Civic Annex has been posted with one crucial line washed away. |
| quiet_brief_place_02 | Paper Hotel | start hub | street | safe | yes | quiet_brief_place_01, quiet_brief_place_03 | A work roster at Paper Hotel leaves two neighbours believing they were promised the same task. |
| quiet_brief_place_03 | Rain Platform | street route | street | safe | yes | quiet_brief_place_02, quiet_brief_place_04 | A route marker at Rain Platform points visitors toward a closed gate and needs a safe correction. |
| quiet_brief_place_04 | Signal Room | mid join | street | low | yes | quiet_brief_place_03, quiet_brief_place_05, quiet_brief_place_01 | A newcomer at Signal Room needs a local introduction before a small obligation becomes embarrassing. |
| quiet_brief_place_05 | Crate Garden | work district | interior | low | no | quiet_brief_place_04, quiet_brief_place_06 | A shared tool at Crate Garden has been returned without its care tag. |
| quiet_brief_place_06 | Tollhouse Roof | instance door | dungeon | medium | no | quiet_brief_place_05, quiet_brief_place_07 | The entry record at Tollhouse Roof names an unfinished errand, not a monster or apocalypse. |
| quiet_brief_place_07 | Archive Lift | wild edge | street | medium | yes | quiet_brief_place_06, quiet_brief_place_08 | A weather change at Archive Lift threatens a community plan unless someone reads the signs. |
| quiet_brief_place_08 | Blanket Café | housing approach | interior | low | no | quiet_brief_place_07 | A resident at Blanket Café has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| quiet_brief_npc_01 | Bryn Cress | quiet_brief_place_01 | quest | Bryn Cress says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Bryn Cress offers a specific task at Civic Annex: settle the practical mismatch before it costs someone a shift. | Bryn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_02 | Cato Silt | quiet_brief_place_02 | profession | Cato Silt says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Cato Silt offers a specific task at Paper Hotel: settle the practical mismatch before it costs someone a shift. | Cato Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_03 | Dessa Pryce | quiet_brief_place_03 | hub | Dessa Pryce says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Dessa Pryce offers a specific task at Rain Platform: settle the practical mismatch before it costs someone a shift. | Dessa Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_04 | Eris Vane | quiet_brief_place_04 | merchant | Eris Vane says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Eris Vane offers a specific task at Signal Room: settle the practical mismatch before it costs someone a shift. | Eris Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_05 | Fenn Quill | quiet_brief_place_01 | local | Fenn Quill says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Fenn Quill offers a specific task at Civic Annex: settle the practical mismatch before it costs someone a shift. | Fenn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_06 | Gala Vale | quiet_brief_place_02 | host | Gala Vale says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Gala Vale offers a specific task at Paper Hotel: settle the practical mismatch before it costs someone a shift. | Gala Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_07 | Holl Wren | quiet_brief_place_03 | quest | Holl Wren says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Holl Wren offers a specific task at Rain Platform: settle the practical mismatch before it costs someone a shift. | Holl Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_08 | Ivo Morrow | quiet_brief_place_04 | profession | Ivo Morrow says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Ivo Morrow offers a specific task at Signal Room: settle the practical mismatch before it costs someone a shift. | Ivo Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_09 | Jori Rowan | quiet_brief_place_01 | local | Jori Rowan says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Jori Rowan offers a specific task at Civic Annex: settle the practical mismatch before it costs someone a shift. | Jori Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| quiet_brief_npc_10 | Alden Nook | quiet_brief_place_02 | merchant | Alden Nook says, ‘Quiet Brief keeps its promises in small places. Tell me which one you noticed.’ | Alden Nook offers a specific task at Paper Hotel: settle the practical mismatch before it costs someone a shift. | Alden Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Signal Room, if that is useful. |
| 2 | Quiet Brief feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Tollhouse Roof. |
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
| Cover Tailor | At Civic Annex, you arrive in cover_tailor mantle carrying quiet_brief_map_01. A small obligation is already late. | Give up one turn to help now. | Quiet Brief: Name a Working Promise |
| Signal Listener | At Paper Hotel, you arrive in signal_listener vest carrying quiet_brief_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Quiet Brief: Set the First Tool Aside |
| Paper Forger | At Civic Annex, you arrive in paper_forger jacket carrying quiet_brief_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Quiet Brief: Carry the Right Record |
| Rain Extractor | At Paper Hotel, you arrive in rain_extractor sash carrying quiet_brief_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Quiet Brief: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_quiet_brief_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Civic Annex’s small mismatch | ask | missing tag | A local need at Signal Room is connected but not catastrophic. | alternate talk |
| 2 | Resolve Paper Hotel’s small mismatch | repair | closed path | A local need at Crate Garden is connected but not catastrophic. | new route |
| 3 | Resolve Rain Platform’s small mismatch | carry | unclear note | A local need at Tollhouse Roof is connected but not catastrophic. | recorded favor |
| 4 | Resolve Signal Room’s small mismatch | listen | late guest | A local need at Archive Lift is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Crate Garden’s small mismatch | map | wet weather | A local need at Blanket Café is connected but not catastrophic. | slower reward |
| 6 | Resolve Tollhouse Roof’s small mismatch | prepare | busy shift | A local need at Civic Annex is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Archive Lift’s small mismatch | wait | quiet boundary | A local need at Paper Hotel is connected but not catastrophic. | solo option |
| 8 | Resolve Blanket Café’s small mismatch | return | wrong room | A local need at Rain Platform is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Unsent Dispatch` and `Paper Hotel Exchange`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| quiet_brief_q_01 | Quiet Brief: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| quiet_brief_q_02 | Quiet Brief: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| quiet_brief_q_03 | Quiet Brief: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| quiet_brief_q_04 | Quiet Brief: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| quiet_brief_q_05 | Quiet Brief: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| quiet_brief_q_06 | Quiet Brief: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| quiet_brief_q_07 | Quiet Brief: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| quiet_brief_q_08 | Quiet Brief: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| quiet_brief_q_09 | Quiet Brief: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| quiet_brief_q_10 | Quiet Brief: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| quiet_brief_q_11 | Quiet Brief: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| quiet_brief_q_12 | Quiet Brief: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| quiet_brief_q_13 | Quiet Brief: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| quiet_brief_q_14 | Quiet Brief: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| quiet_brief_q_15 | Quiet Brief: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| quiet_brief_q_16 | Quiet Brief: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| quiet_brief_q_17 | Quiet Brief: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| quiet_brief_q_18 | Quiet Brief: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| quiet_brief_q_19 | Quiet Brief: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| quiet_brief_q_20 | Quiet Brief: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| quiet_brief_q_21 | Quiet Brief: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| quiet_brief_q_22 | Quiet Brief: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| quiet_brief_q_23 | Quiet Brief: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| quiet_brief_q_24 | Quiet Brief: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| quiet_brief_q_25 | Quiet Brief: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Civic Annex`: write `quiet_brief_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Signal Room`: write `quiet_brief_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `quiet_brief_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| quiet_brief_species_01 | Courier Crow | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_02 | Keycat | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_03 | Window Lizard | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_04 | Tape Moth | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_05 | Quiet Brief Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_06 | Quiet Brief Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_07 | Quiet Brief Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_08 | Quiet Brief Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_09 | Quiet Brief Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_10 | Quiet Brief Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_11 | Quiet Brief Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_12 | Quiet Brief Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_13 | Quiet Brief Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_14 | Quiet Brief Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_15 | Quiet Brief Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_16 | Quiet Brief Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_17 | Quiet Brief Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| quiet_brief_species_18 | Quiet Brief Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Brief Notes**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Ink Ciphers**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Civic Annex token, Paper Hotel tool, Rain Platform thread, Signal Room seal, Crate Garden bundle, Tollhouse Roof token. |
| Instance and cosmetic templates | Archive Lift tool, Blanket Café thread, Civic Annex seal, Paper Hotel bundle, Rain Platform token, Signal Room tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `quiet_brief_vendor_01` at `quiet_brief_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| quiet_brief_dungeon_room_01 | The Unsent Dispatch: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: quiet_brief_species_01, quiet_brief_species_02; elite: none |   |
| quiet_brief_dungeon_room_02 | The Unsent Dispatch: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: quiet_brief_species_03, quiet_brief_species_04; elite: none |   |
| quiet_brief_dungeon_room_03 | The Unsent Dispatch: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: quiet_brief_species_05, quiet_brief_species_06; elite: quiet_brief_species_09 |   |
| quiet_brief_dungeon_room_04 | The Unsent Dispatch: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: quiet_brief_species_07, quiet_brief_species_08; elite: none | checkpoint  |
| quiet_brief_dungeon_room_05 | The Unsent Dispatch: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: quiet_brief_species_09, quiet_brief_species_10; elite: none |  boss: quiet_brief_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`quiet_brief_trap_01`), jammed latch (`quiet_brief_trap_02`), wet threshold (`quiet_brief_trap_03`), false shelf (`quiet_brief_trap_04`), quiet bell (`quiet_brief_trap_05`), sealed drawer (`quiet_brief_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Paper Hotel Exchange** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| quiet_brief_talent_01 | Quiet Brief Local Ear | 1 | none | quiet_brief_effect_01 |
| quiet_brief_talent_02 | Quiet Brief Careful Hand | 2 | none | quiet_brief_effect_02 |
| quiet_brief_talent_03 | Quiet Brief Route Sense | 3 | none | quiet_brief_effect_03 |
| quiet_brief_talent_04 | Quiet Brief Shared Measure | 4 | none | quiet_brief_effect_04 |
| quiet_brief_talent_05 | Quiet Brief Quiet Craft | 1 | quiet_brief_talent_04 | quiet_brief_effect_05 |
| quiet_brief_talent_06 | Quiet Brief Open Invitation | 2 | none | quiet_brief_effect_06 |
| quiet_brief_talent_07 | Quiet Brief Safe Return | 3 | none | quiet_brief_effect_07 |
| quiet_brief_talent_08 | Quiet Brief Field Note | 4 | none | quiet_brief_effect_08 |
| quiet_brief_talent_09 | Quiet Brief Steady Pace | 1 | quiet_brief_talent_08 | quiet_brief_effect_09 |
| quiet_brief_talent_10 | Quiet Brief Clear Signal | 2 | none | quiet_brief_effect_10 |
| quiet_brief_talent_11 | Quiet Brief Warm Welcome | 3 | none | quiet_brief_effect_11 |
| quiet_brief_talent_12 | Quiet Brief Small Courage | 4 | none | quiet_brief_effect_12 |
| quiet_brief_talent_13 | Quiet Brief Repair Habit | 1 | quiet_brief_talent_12 | quiet_brief_effect_13 |
| quiet_brief_talent_14 | Quiet Brief Trust Mark | 2 | none | quiet_brief_effect_14 |
| quiet_brief_talent_15 | Quiet Brief Second Look | 3 | none | quiet_brief_effect_15 |
| quiet_brief_talent_16 | Quiet Brief Closing Grace | 4 | none | quiet_brief_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| quiet_brief_contract_01 | Quiet Brief Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| quiet_brief_contract_02 | Quiet Brief Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| quiet_brief_contract_03 | Quiet Brief Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| quiet_brief_contract_04 | Quiet Brief Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| quiet_brief_contract_05 | Quiet Brief Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| quiet_brief_contract_06 | Quiet Brief Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| quiet_brief_contract_07 | Quiet Brief Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| quiet_brief_contract_08 | Quiet Brief Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| quiet_brief_interact_01 | Civic Annex bench | rest | quiet_brief_place_01 |
| quiet_brief_interact_02 | Paper Hotel cabinet | repair | quiet_brief_place_02 |
| quiet_brief_interact_03 | Rain Platform rack | tend | quiet_brief_place_03 |
| quiet_brief_interact_04 | Signal Room kettle | craft | quiet_brief_place_04 |
| quiet_brief_interact_05 | Crate Garden ledger | cook | quiet_brief_place_05 |
| quiet_brief_interact_06 | Tollhouse Roof rail | bind_inn | quiet_brief_place_06 |
| quiet_brief_interact_07 | Archive Lift bell | inspect | quiet_brief_place_07 |
| quiet_brief_interact_08 | Blanket Café board | open | quiet_brief_place_08 |
| quiet_brief_interact_09 | Civic Annex table | carry | quiet_brief_place_01 |
| quiet_brief_interact_10 | Paper Hotel lamp | clean | quiet_brief_place_02 |
| quiet_brief_interact_11 | Rain Platform gate | signal | quiet_brief_place_03 |
| quiet_brief_interact_12 | Signal Room shelf | record | quiet_brief_place_04 |


**Default interior graph.** `quiet_brief_interior_01` enters from `quiet_brief_place_08` and contains 7 connected rooms: Quiet Brief Entry, Quiet Brief Main Room, Quiet Brief Work Nook, Quiet Brief Window Room, Quiet Brief Quiet Room, Quiet Brief Storage, Quiet Brief Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | civic, paper, rain, signal materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Quiet Brief` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Quiet Brief and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Quiet Brief: distant work, a room tone, a gentle rhythm that belongs to Civic Annex, and a second layer that makes the route toward Tollhouse Roof feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Quiet Brief Ledger |
| 2 | Quiet Brief Route |
| 3 | Quiet Brief Work |
| 4 | Quiet Brief Talk |
| 5 | Quiet Brief Kit |
| 6 | Quiet Brief Pack |
| 7 | Quiet Brief Rest |
| 8 | Quiet Brief Safety |
| 9 | Quiet Brief Map |
| 10 | Quiet Brief Notice |
| 11 | Quiet Brief Favour |
| 12 | Quiet Brief Gold |
| 13 | Quiet Brief Token |
| 14 | Quiet Brief Record |
| 15 | Quiet Brief Instance |
| 16 | Quiet Brief Checkpoint |
| 17 | Quiet Brief Choice |
| 18 | Quiet Brief Help |
| 19 | Quiet Brief Calendar |
| 20 | Quiet Brief Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Civic Annex, a small promise has your name on it. |
| 2 | At Paper Hotel, a small promise has your name on it. |
| 3 | At Rain Platform, a small promise has your name on it. |
| 4 | At Signal Room, a small promise has your name on it. |
| 5 | At Crate Garden, a small promise has your name on it. |
| 6 | At Tollhouse Roof, a small promise has your name on it. |
| 7 | At Archive Lift, a small promise has your name on it. |
| 8 | At Blanket Café, a small promise has your name on it. |
| 9 | At Civic Annex, a small promise has your name on it. |
| 10 | At Paper Hotel, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is cover-story investigation and careful extraction. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
