# WOF Saddle Sky: Full Start-Depth Pack

> **Release truth.** Saddle Sky is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `saddle_sky` |
| Display name | **Saddle Sky** |
| One-line pitch | A high-aerie rescue culture where people earn the trust of original sky mounts by learning care, route reading, and the responsibility to turn back. |
| Maturity | **teen** |
| rulesModuleId | `bond_mount` |
| Theme Kit | **Saddle Sky Theme Kit**, included with world entitlement |
| Genre pattern and fence | Sky-mount partnership and rescue. It is not a dragon-rider franchise, a monster-capture game, or a dragon school copy. |

Saddle Sky is a WOF text world about a high-aerie rescue culture where people earn the trust of original sky mounts by learning care, route reading, and the responsibility to turn back. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Pern named place |
| 2 | How to Train Your Dragon hero silhouette |
| 3 | Eragon logo geometry |
| 4 | Dragonriders of Pern catchphrase |
| 5 | Pokemon signature costume |
| 6 | Monster Hunter Rathalos proprietary creature |
| 7 | Skyrim dragon map layout |
| 8 | Dragon Prince faction title |
| 9 | Wings of Fire weapon profile |
| 10 | Dragon Tales UI chrome |
| 11 | Pern quest premise |
| 12 | How to Train Your Dragon title typography |
| 13 | Eragon color-coded insignia |
| 14 | Dragonriders of Pern music motif |
| 15 | Pokemon vehicle or mount profile |
| 16 | Monster Hunter Rathalos companion anatomy |
| 17 | Skyrim dragon named artifact |
| 18 | Dragon Prince school or agency badge |
| 19 | Wings of Fire real sacred practice as minigame |
| 20 | Dragon Tales stereotyped cultural shorthand |
| 21 | Pern real-person likeness |
| 22 | How to Train Your Dragon copied dialogue cadence |
| 23 | Eragon fan-server slogan |
| 24 | Dragonriders of Pern paid power framing |
| 25 | Pokemon loot-box presentation |
| 26 | Monster Hunter Rathalos named place |
| 27 | Skyrim dragon hero silhouette |
| 28 | Dragon Prince logo geometry |
| 29 | Wings of Fire catchphrase |
| 30 | Dragon Tales signature costume |
| 31 | Pern proprietary creature |
| 32 | How to Train Your Dragon map layout |
| 33 | Eragon faction title |
| 34 | Dragonriders of Pern weapon profile |
| 35 | Pokemon UI chrome |
| 36 | Monster Hunter Rathalos quest premise |
| 37 | Skyrim dragon title typography |
| 38 | Dragon Prince color-coded insignia |
| 39 | Wings of Fire music motif |
| 40 | Dragon Tales vehicle or mount profile |
| 41 | Pern companion anatomy |
| 42 | How to Train Your Dragon named artifact |
| 43 | Eragon school or agency badge |
| 44 | Dragonriders of Pern real sacred practice as minigame |
| 45 | Pokemon stereotyped cultural shorthand |
| 46 | Monster Hunter Rathalos real-person likeness |
| 47 | Skyrim dragon copied dialogue cadence |
| 48 | Dragon Prince fan-server slogan |
| 49 | Wings of Fire paid power framing |
| 50 | Dragon Tales loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | hp, mountTrust, wind, altitude, routeMarks, care, tack, rescue |
| Wipe and checkpoint | Wipe returns the party to `saddle_sky_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Saddle Sky • {{turn}} • committed |
| 2 | [Route] Saddle Sky • {{placeId}} • committed |
| 3 | [Work] Saddle Sky • {{lastAction}} • committed |
| 4 | [Talk] Saddle Sky • {{npcId}} • committed |
| 5 | [Kit] Saddle Sky • {{kitId}} • committed |
| 6 | [Pack] Saddle Sky • {{partySize}} • committed |
| 7 | [Rest] Saddle Sky • {{checkpoint}} • committed |
| 8 | [Safety] Saddle Sky • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| saddle_sky_kit_01 | Aerie Groom | down-lined groom coat | care for tired mounts | Never mount a creature that has not offered its crest. | Use calm flight terms and make care sound skilled, never cute. | aerie_groom mantle; aerie_groom tool; saddle_sky_map_01 | saddle_sky_place_01; saddle_sky_q_01 | saddle_sky_ability_01 |
| saddle_sky_kit_02 | Gale Cartographer | wind-map sash | map safe wind turns | Never falsify a wind chart. | Use calm flight terms and make care sound skilled, never cute. | gale_cartographer vest; gale_cartographer tool; saddle_sky_map_02 | saddle_sky_place_02; saddle_sky_q_02 | saddle_sky_ability_02 |
| saddle_sky_kit_03 | Nest Medic | nest-medic satchel | treat nest injuries | Never take an egg from a rescue nest. | Use calm flight terms and make care sound skilled, never cute. | nest_medic jacket; nest_medic tool; saddle_sky_map_03 | saddle_sky_place_01; saddle_sky_q_03 | saddle_sky_ability_03 |
| saddle_sky_kit_04 | Cloud Harnesser | cloud leather harness | certify flight tack | Never tighten tack against a flinch. | Use calm flight terms and make care sound skilled, never cute. | cloud_harnesser sash; cloud_harnesser tool; saddle_sky_map_04 | saddle_sky_place_02; saddle_sky_q_04 | saddle_sky_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `saddle_sky_place_01` is a shared hub rather than a capital analogue; `saddle_sky_place_04` is the mid-join; `saddle_sky_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| saddle_sky_place_01 | Wingrest | shared hub | street | safe | yes | saddle_sky_place_02, saddle_sky_place_04 | A public notice at Wingrest has been posted with one crucial line washed away. |
| saddle_sky_place_02 | Kestrel Steps | start hub | street | safe | yes | saddle_sky_place_01, saddle_sky_place_03 | A work roster at Kestrel Steps leaves two neighbours believing they were promised the same task. |
| saddle_sky_place_03 | Cloud Orchard | street route | street | safe | yes | saddle_sky_place_02, saddle_sky_place_04 | A route marker at Cloud Orchard points visitors toward a closed gate and needs a safe correction. |
| saddle_sky_place_04 | Gale Bridge | mid join | street | low | yes | saddle_sky_place_03, saddle_sky_place_05, saddle_sky_place_01 | A newcomer at Gale Bridge needs a local introduction before a small obligation becomes embarrassing. |
| saddle_sky_place_05 | Nestfall Hollow | work district | interior | low | no | saddle_sky_place_04, saddle_sky_place_06 | A shared tool at Nestfall Hollow has been returned without its care tag. |
| saddle_sky_place_06 | High Aerie | instance door | dungeon | medium | no | saddle_sky_place_05, saddle_sky_place_07 | The entry record at High Aerie names an unfinished errand, not a monster or apocalypse. |
| saddle_sky_place_07 | Windwell Shelf | wild edge | street | medium | yes | saddle_sky_place_06, saddle_sky_place_08 | A weather change at Windwell Shelf threatens a community plan unless someone reads the signs. |
| saddle_sky_place_08 | Sunglass Crag | housing approach | interior | low | no | saddle_sky_place_07 | A resident at Sunglass Crag has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| saddle_sky_npc_01 | Alden Vane | saddle_sky_place_01 | quest | Alden Vane says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Wingrest: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_02 | Bryn Quill | saddle_sky_place_02 | profession | Bryn Quill says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Kestrel Steps: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_03 | Cato Vale | saddle_sky_place_03 | hub | Cato Vale says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Cloud Orchard: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_04 | Dessa Wren | saddle_sky_place_04 | merchant | Dessa Wren says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Gale Bridge: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_05 | Eris Morrow | saddle_sky_place_01 | local | Eris Morrow says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Wingrest: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_06 | Fenn Rowan | saddle_sky_place_02 | host | Fenn Rowan says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Kestrel Steps: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_07 | Gala Nook | saddle_sky_place_03 | quest | Gala Nook says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Cloud Orchard: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_08 | Holl Cress | saddle_sky_place_04 | profession | Holl Cress says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Gale Bridge: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_09 | Ivo Silt | saddle_sky_place_01 | local | Ivo Silt says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Wingrest: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| saddle_sky_npc_10 | Jori Pryce | saddle_sky_place_02 | merchant | Jori Pryce says, ‘Saddle Sky keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Kestrel Steps: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Gale Bridge, if that is useful. |
| 2 | Saddle Sky feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at High Aerie. |
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
| Aerie Groom | At Wingrest, you arrive in aerie_groom mantle carrying saddle_sky_map_01. A small obligation is already late. | Give up one turn to help now. | Saddle Sky: Name a Working Promise |
| Gale Cartographer | At Kestrel Steps, you arrive in gale_cartographer vest carrying saddle_sky_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Saddle Sky: Set the First Tool Aside |
| Nest Medic | At Wingrest, you arrive in nest_medic jacket carrying saddle_sky_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Saddle Sky: Carry the Right Record |
| Cloud Harnesser | At Kestrel Steps, you arrive in cloud_harnesser sash carrying saddle_sky_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Saddle Sky: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_saddle_sky_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Wingrest’s small mismatch | ask | missing tag | A local need at Gale Bridge is connected but not catastrophic. | alternate talk |
| 2 | Resolve Kestrel Steps’s small mismatch | repair | closed path | A local need at Nestfall Hollow is connected but not catastrophic. | new route |
| 3 | Resolve Cloud Orchard’s small mismatch | carry | unclear note | A local need at High Aerie is connected but not catastrophic. | recorded favor |
| 4 | Resolve Gale Bridge’s small mismatch | listen | late guest | A local need at Windwell Shelf is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Nestfall Hollow’s small mismatch | map | wet weather | A local need at Sunglass Crag is connected but not catastrophic. | slower reward |
| 6 | Resolve High Aerie’s small mismatch | prepare | busy shift | A local need at Wingrest is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Windwell Shelf’s small mismatch | wait | quiet boundary | A local need at Kestrel Steps is connected but not catastrophic. | solo option |
| 8 | Resolve Sunglass Crag’s small mismatch | return | wrong room | A local need at Cloud Orchard is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Nestfall Rescue Run` and `High Aerie Returnflight`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| saddle_sky_q_01 | Saddle Sky: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| saddle_sky_q_02 | Saddle Sky: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| saddle_sky_q_03 | Saddle Sky: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| saddle_sky_q_04 | Saddle Sky: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| saddle_sky_q_05 | Saddle Sky: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| saddle_sky_q_06 | Saddle Sky: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| saddle_sky_q_07 | Saddle Sky: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| saddle_sky_q_08 | Saddle Sky: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| saddle_sky_q_09 | Saddle Sky: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| saddle_sky_q_10 | Saddle Sky: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| saddle_sky_q_11 | Saddle Sky: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| saddle_sky_q_12 | Saddle Sky: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| saddle_sky_q_13 | Saddle Sky: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| saddle_sky_q_14 | Saddle Sky: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| saddle_sky_q_15 | Saddle Sky: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| saddle_sky_q_16 | Saddle Sky: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| saddle_sky_q_17 | Saddle Sky: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| saddle_sky_q_18 | Saddle Sky: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| saddle_sky_q_19 | Saddle Sky: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| saddle_sky_q_20 | Saddle Sky: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| saddle_sky_q_21 | Saddle Sky: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| saddle_sky_q_22 | Saddle Sky: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| saddle_sky_q_23 | Saddle Sky: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| saddle_sky_q_24 | Saddle Sky: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| saddle_sky_q_25 | Saddle Sky: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Wingrest`: write `saddle_sky_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Gale Bridge`: write `saddle_sky_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `saddle_sky_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| saddle_sky_species_01 | Emberwing | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_02 | Mistral Drake | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_03 | Cloud Ram | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_04 | Ribbon Gryph | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_05 | Bristle Kite | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_06 | Gale Loper | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_07 | Sunglass Wyre | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_08 | Nest Skimmer | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_09 | Thunder Quill | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_10 | Wind Mare | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_11 | Cinder Glider | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_12 | Moss Talon | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_13 | Crest Finch | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_14 | Vapour Stoat | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_15 | Ridge Soarer | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| saddle_sky_species_16 | Bloom Hawk | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Aerie Marks**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Wing Beads**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Wingrest token, Kestrel Steps tool, Cloud Orchard thread, Gale Bridge seal, Nestfall Hollow bundle, High Aerie token. |
| Instance and cosmetic templates | Windwell Shelf tool, Sunglass Crag thread, Wingrest seal, Kestrel Steps bundle, Cloud Orchard token, Gale Bridge tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `saddle_sky_vendor_01` at `saddle_sky_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| saddle_sky_dungeon_room_01 | The Nestfall Rescue Run: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: saddle_sky_species_01, saddle_sky_species_02; elite: none |   |
| saddle_sky_dungeon_room_02 | The Nestfall Rescue Run: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: saddle_sky_species_03, saddle_sky_species_04; elite: none |   |
| saddle_sky_dungeon_room_03 | The Nestfall Rescue Run: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: saddle_sky_species_05, saddle_sky_species_06; elite: saddle_sky_species_09 |   |
| saddle_sky_dungeon_room_04 | The Nestfall Rescue Run: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: saddle_sky_species_07, saddle_sky_species_08; elite: none | checkpoint  |
| saddle_sky_dungeon_room_05 | The Nestfall Rescue Run: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: saddle_sky_species_09, saddle_sky_species_10; elite: none |  boss: saddle_sky_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`saddle_sky_trap_01`), jammed latch (`saddle_sky_trap_02`), wet threshold (`saddle_sky_trap_03`), false shelf (`saddle_sky_trap_04`), quiet bell (`saddle_sky_trap_05`), sealed drawer (`saddle_sky_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**High Aerie Returnflight** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| saddle_sky_talent_01 | Saddle Sky Local Ear | 1 | none | saddle_sky_effect_01 |
| saddle_sky_talent_02 | Saddle Sky Careful Hand | 2 | none | saddle_sky_effect_02 |
| saddle_sky_talent_03 | Saddle Sky Route Sense | 3 | none | saddle_sky_effect_03 |
| saddle_sky_talent_04 | Saddle Sky Shared Measure | 4 | none | saddle_sky_effect_04 |
| saddle_sky_talent_05 | Saddle Sky Quiet Craft | 1 | saddle_sky_talent_04 | saddle_sky_effect_05 |
| saddle_sky_talent_06 | Saddle Sky Open Invitation | 2 | none | saddle_sky_effect_06 |
| saddle_sky_talent_07 | Saddle Sky Safe Return | 3 | none | saddle_sky_effect_07 |
| saddle_sky_talent_08 | Saddle Sky Field Note | 4 | none | saddle_sky_effect_08 |
| saddle_sky_talent_09 | Saddle Sky Steady Pace | 1 | saddle_sky_talent_08 | saddle_sky_effect_09 |
| saddle_sky_talent_10 | Saddle Sky Clear Signal | 2 | none | saddle_sky_effect_10 |
| saddle_sky_talent_11 | Saddle Sky Warm Welcome | 3 | none | saddle_sky_effect_11 |
| saddle_sky_talent_12 | Saddle Sky Small Courage | 4 | none | saddle_sky_effect_12 |
| saddle_sky_talent_13 | Saddle Sky Repair Habit | 1 | saddle_sky_talent_12 | saddle_sky_effect_13 |
| saddle_sky_talent_14 | Saddle Sky Trust Mark | 2 | none | saddle_sky_effect_14 |
| saddle_sky_talent_15 | Saddle Sky Second Look | 3 | none | saddle_sky_effect_15 |
| saddle_sky_talent_16 | Saddle Sky Closing Grace | 4 | none | saddle_sky_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| saddle_sky_contract_01 | Saddle Sky Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| saddle_sky_contract_02 | Saddle Sky Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| saddle_sky_contract_03 | Saddle Sky Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| saddle_sky_contract_04 | Saddle Sky Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| saddle_sky_contract_05 | Saddle Sky Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| saddle_sky_contract_06 | Saddle Sky Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| saddle_sky_contract_07 | Saddle Sky Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| saddle_sky_contract_08 | Saddle Sky Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| saddle_sky_interact_01 | Wingrest bench | rest | saddle_sky_place_01 |
| saddle_sky_interact_02 | Kestrel Steps cabinet | repair | saddle_sky_place_02 |
| saddle_sky_interact_03 | Cloud Orchard rack | tend | saddle_sky_place_03 |
| saddle_sky_interact_04 | Gale Bridge kettle | craft | saddle_sky_place_04 |
| saddle_sky_interact_05 | Nestfall Hollow ledger | cook | saddle_sky_place_05 |
| saddle_sky_interact_06 | High Aerie rail | bind_inn | saddle_sky_place_06 |
| saddle_sky_interact_07 | Windwell Shelf bell | inspect | saddle_sky_place_07 |
| saddle_sky_interact_08 | Sunglass Crag board | open | saddle_sky_place_08 |
| saddle_sky_interact_09 | Wingrest table | carry | saddle_sky_place_01 |
| saddle_sky_interact_10 | Kestrel Steps lamp | clean | saddle_sky_place_02 |
| saddle_sky_interact_11 | Cloud Orchard gate | signal | saddle_sky_place_03 |
| saddle_sky_interact_12 | Gale Bridge shelf | record | saddle_sky_place_04 |


**Default interior graph.** `saddle_sky_interior_01` enters from `saddle_sky_place_08` and contains 7 connected rooms: Saddle Sky Entry, Saddle Sky Main Room, Saddle Sky Work Nook, Saddle Sky Window Room, Saddle Sky Quiet Room, Saddle Sky Storage, Saddle Sky Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | wingrest, kestrel, cloud, gale materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Saddle Sky` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use calm flight terms and make care sound skilled, never cute. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Saddle Sky: distant work, a room tone, a gentle rhythm that belongs to Wingrest, and a second layer that makes the route toward High Aerie feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Saddle Sky Ledger |
| 2 | Saddle Sky Route |
| 3 | Saddle Sky Work |
| 4 | Saddle Sky Talk |
| 5 | Saddle Sky Kit |
| 6 | Saddle Sky Pack |
| 7 | Saddle Sky Rest |
| 8 | Saddle Sky Safety |
| 9 | Saddle Sky Map |
| 10 | Saddle Sky Notice |
| 11 | Saddle Sky Favour |
| 12 | Saddle Sky Gold |
| 13 | Saddle Sky Token |
| 14 | Saddle Sky Record |
| 15 | Saddle Sky Instance |
| 16 | Saddle Sky Checkpoint |
| 17 | Saddle Sky Choice |
| 18 | Saddle Sky Help |
| 19 | Saddle Sky Calendar |
| 20 | Saddle Sky Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Wingrest, a small promise has your name on it. |
| 2 | At Kestrel Steps, a small promise has your name on it. |
| 3 | At Cloud Orchard, a small promise has your name on it. |
| 4 | At Gale Bridge, a small promise has your name on it. |
| 5 | At Nestfall Hollow, a small promise has your name on it. |
| 6 | At High Aerie, a small promise has your name on it. |
| 7 | At Windwell Shelf, a small promise has your name on it. |
| 8 | At Sunglass Crag, a small promise has your name on it. |
| 9 | At Wingrest, a small promise has your name on it. |
| 10 | At Kestrel Steps, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is sky-mount partnership and rescue. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
