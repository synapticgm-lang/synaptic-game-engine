# WOF Star Canoe: Full Start-Depth Pack

> **Release truth.** Star Canoe is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `star_canoe` |
| Display name | **Star Canoe** |
| One-line pitch | Original ocean voyaging and reciprocal canoe care. |
| Maturity | **all-ages** |
| rulesModuleId | `ship_board` |
| Theme Kit | **Star Canoe Theme Kit**, included with world entitlement |
| Genre pattern and fence | Original ocean voyaging and reciprocal canoe care. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Star Canoe is a WOF text world about original ocean voyaging and reciprocal canoe care. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Moana named place |
| 2 | Disney Polynesia hero silhouette |
| 3 | Vaiana logo geometry |
| 4 | Sea of Thieves catchphrase |
| 5 | Wind Waker signature costume |
| 6 | real Polynesian navigation proprietary creature |
| 7 | Tiki bar map layout |
| 8 | Hawaii tourism ad faction title |
| 9 | Lilo and Stitch weapon profile |
| 10 | Pirates of Caribbean UI chrome |
| 11 | Moana quest premise |
| 12 | Disney Polynesia title typography |
| 13 | Vaiana color-coded insignia |
| 14 | Sea of Thieves music motif |
| 15 | Wind Waker vehicle or mount profile |
| 16 | real Polynesian navigation companion anatomy |
| 17 | Tiki bar named artifact |
| 18 | Hawaii tourism ad school or agency badge |
| 19 | Lilo and Stitch real sacred practice as minigame |
| 20 | Pirates of Caribbean stereotyped cultural shorthand |
| 21 | Moana real-person likeness |
| 22 | Disney Polynesia copied dialogue cadence |
| 23 | Vaiana fan-server slogan |
| 24 | Sea of Thieves paid power framing |
| 25 | Wind Waker loot-box presentation |
| 26 | real Polynesian navigation named place |
| 27 | Tiki bar hero silhouette |
| 28 | Hawaii tourism ad logo geometry |
| 29 | Lilo and Stitch catchphrase |
| 30 | Pirates of Caribbean signature costume |
| 31 | Moana proprietary creature |
| 32 | Disney Polynesia map layout |
| 33 | Vaiana faction title |
| 34 | Sea of Thieves weapon profile |
| 35 | Wind Waker UI chrome |
| 36 | real Polynesian navigation quest premise |
| 37 | Tiki bar title typography |
| 38 | Hawaii tourism ad color-coded insignia |
| 39 | Lilo and Stitch music motif |
| 40 | Pirates of Caribbean vehicle or mount profile |
| 41 | Moana companion anatomy |
| 42 | Disney Polynesia named artifact |
| 43 | Vaiana school or agency badge |
| 44 | Sea of Thieves real sacred practice as minigame |
| 45 | Wind Waker stereotyped cultural shorthand |
| 46 | real Polynesian navigation real-person likeness |
| 47 | Tiki bar copied dialogue cadence |
| 48 | Hawaii tourism ad fan-server slogan |
| 49 | Lilo and Stitch paid power framing |
| 50 | Pirates of Caribbean loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared hull, crew, route, cargo, weather, berth and party contract. |
| Wipe and checkpoint | Wipe returns the party to `star_canoe_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Star Canoe • {{turn}} • committed |
| 2 | [Route] Star Canoe • {{placeId}} • committed |
| 3 | [Work] Star Canoe • {{lastAction}} • committed |
| 4 | [Talk] Star Canoe • {{npcId}} • committed |
| 5 | [Kit] Star Canoe • {{kitId}} • committed |
| 6 | [Pack] Star Canoe • {{partySize}} • committed |
| 7 | [Rest] Star Canoe • {{checkpoint}} • committed |
| 8 | [Safety] Star Canoe • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| star_canoe_kit_01 | Star Reader | star reader workwear | practice star reader | Never use star reader authority to remove another person’s choice. | Use the local rhythm of Star Canoe and make every offer concrete. | star_reader mantle; star_reader tool; star_canoe_map_01 | star_canoe_place_01; star_canoe_q_01 | star_canoe_ability_01 |
| star_canoe_kit_02 | Canoe Lashkeeper | canoe lashkeeper workwear | practice canoe lashkeeper | Never use canoe lashkeeper authority to remove another person’s choice. | Use the local rhythm of Star Canoe and make every offer concrete. | canoe_lashkeeper vest; canoe_lashkeeper tool; star_canoe_map_02 | star_canoe_place_02; star_canoe_q_02 | star_canoe_ability_02 |
| star_canoe_kit_03 | Reef Host | reef host workwear | practice reef host | Never use reef host authority to remove another person’s choice. | Use the local rhythm of Star Canoe and make every offer concrete. | reef_host jacket; reef_host tool; star_canoe_map_03 | star_canoe_place_01; star_canoe_q_03 | star_canoe_ability_03 |
| star_canoe_kit_04 | Wind Prover | wind prover workwear | practice wind prover | Never use wind prover authority to remove another person’s choice. | Use the local rhythm of Star Canoe and make every offer concrete. | wind_prover sash; wind_prover tool; star_canoe_map_04 | star_canoe_place_02; star_canoe_q_04 | star_canoe_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `star_canoe_place_01` is a shared hub rather than a capital analogue; `star_canoe_place_04` is the mid-join; `star_canoe_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| star_canoe_place_01 | Wayfinder Bay | shared hub | street | safe | yes | star_canoe_place_02, star_canoe_place_04 | A public notice at Wayfinder Bay has been posted with one crucial line washed away. |
| star_canoe_place_02 | Star Mat | start hub | street | safe | yes | star_canoe_place_01, star_canoe_place_03 | A work roster at Star Mat leaves two neighbours believing they were promised the same task. |
| star_canoe_place_03 | Reef Rest | street route | street | safe | yes | star_canoe_place_02, star_canoe_place_04 | A route marker at Reef Rest points visitors toward a closed gate and needs a safe correction. |
| star_canoe_place_04 | Far Lantern | mid join | street | low | yes | star_canoe_place_03, star_canoe_place_05, star_canoe_place_01 | A newcomer at Far Lantern needs a local introduction before a small obligation becomes embarrassing. |
| star_canoe_place_05 | Shell Reach | work district | interior | low | no | star_canoe_place_04, star_canoe_place_06 | A shared tool at Shell Reach has been returned without its care tag. |
| star_canoe_place_06 | Wind Palm | instance door | dungeon | medium | no | star_canoe_place_05, star_canoe_place_07 | The entry record at Wind Palm names an unfinished errand, not a monster or apocalypse. |
| star_canoe_place_07 | Blue Anchor | wild edge | street | medium | yes | star_canoe_place_06, star_canoe_place_08 | A weather change at Blue Anchor threatens a community plan unless someone reads the signs. |
| star_canoe_place_08 | Tide Memory | housing approach | interior | low | no | star_canoe_place_07 | A resident at Tide Memory has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| star_canoe_npc_01 | Alden Vane | star_canoe_place_01 | quest | Alden Vane says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Wayfinder Bay: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_02 | Bryn Quill | star_canoe_place_02 | profession | Bryn Quill says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Star Mat: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_03 | Cato Vale | star_canoe_place_03 | hub | Cato Vale says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Reef Rest: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_04 | Dessa Wren | star_canoe_place_04 | merchant | Dessa Wren says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Far Lantern: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_05 | Eris Morrow | star_canoe_place_01 | local | Eris Morrow says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Wayfinder Bay: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_06 | Fenn Rowan | star_canoe_place_02 | host | Fenn Rowan says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Star Mat: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_07 | Gala Nook | star_canoe_place_03 | quest | Gala Nook says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Reef Rest: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_08 | Holl Cress | star_canoe_place_04 | profession | Holl Cress says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Far Lantern: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_09 | Ivo Silt | star_canoe_place_01 | local | Ivo Silt says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Wayfinder Bay: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| star_canoe_npc_10 | Jori Pryce | star_canoe_place_02 | merchant | Jori Pryce says, ‘Star Canoe keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Star Mat: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Far Lantern, if that is useful. |
| 2 | Star Canoe feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Wind Palm. |
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
| Star Reader | At Wayfinder Bay, you arrive in star_reader mantle carrying star_canoe_map_01. A small obligation is already late. | Give up one turn to help now. | Star Canoe: Name a Working Promise |
| Canoe Lashkeeper | At Star Mat, you arrive in canoe_lashkeeper vest carrying star_canoe_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Star Canoe: Set the First Tool Aside |
| Reef Host | At Wayfinder Bay, you arrive in reef_host jacket carrying star_canoe_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Star Canoe: Carry the Right Record |
| Wind Prover | At Star Mat, you arrive in wind_prover sash carrying star_canoe_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Star Canoe: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_star_canoe_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Wayfinder Bay’s small mismatch | ask | missing tag | A local need at Far Lantern is connected but not catastrophic. | alternate talk |
| 2 | Resolve Star Mat’s small mismatch | repair | closed path | A local need at Shell Reach is connected but not catastrophic. | new route |
| 3 | Resolve Reef Rest’s small mismatch | carry | unclear note | A local need at Wind Palm is connected but not catastrophic. | recorded favor |
| 4 | Resolve Far Lantern’s small mismatch | listen | late guest | A local need at Blue Anchor is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Shell Reach’s small mismatch | map | wet weather | A local need at Tide Memory is connected but not catastrophic. | slower reward |
| 6 | Resolve Wind Palm’s small mismatch | prepare | busy shift | A local need at Wayfinder Bay is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Blue Anchor’s small mismatch | wait | quiet boundary | A local need at Star Mat is connected but not catastrophic. | solo option |
| 8 | Resolve Tide Memory’s small mismatch | return | wrong room | A local need at Reef Rest is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Far Lantern Crossing` and `Star Mat Return Feast`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| star_canoe_q_01 | Star Canoe: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| star_canoe_q_02 | Star Canoe: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| star_canoe_q_03 | Star Canoe: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| star_canoe_q_04 | Star Canoe: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| star_canoe_q_05 | Star Canoe: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| star_canoe_q_06 | Star Canoe: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| star_canoe_q_07 | Star Canoe: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| star_canoe_q_08 | Star Canoe: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| star_canoe_q_09 | Star Canoe: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| star_canoe_q_10 | Star Canoe: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| star_canoe_q_11 | Star Canoe: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| star_canoe_q_12 | Star Canoe: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| star_canoe_q_13 | Star Canoe: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| star_canoe_q_14 | Star Canoe: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| star_canoe_q_15 | Star Canoe: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| star_canoe_q_16 | Star Canoe: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| star_canoe_q_17 | Star Canoe: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| star_canoe_q_18 | Star Canoe: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| star_canoe_q_19 | Star Canoe: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| star_canoe_q_20 | Star Canoe: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| star_canoe_q_21 | Star Canoe: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| star_canoe_q_22 | Star Canoe: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| star_canoe_q_23 | Star Canoe: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| star_canoe_q_24 | Star Canoe: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| star_canoe_q_25 | Star Canoe: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Wayfinder Bay`: write `star_canoe_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Far Lantern`: write `star_canoe_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `star_canoe_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| star_canoe_species_01 | Star Tern | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_02 | Sailfin | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_03 | Coconut Crab | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_04 | Wave Fox | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_05 | Star Canoe Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_06 | Star Canoe Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_07 | Star Canoe Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_08 | Star Canoe Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_09 | Star Canoe Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_10 | Star Canoe Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_11 | Star Canoe Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_12 | Star Canoe Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_13 | Star Canoe Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_14 | Star Canoe Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_15 | Star Canoe Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_16 | Star Canoe Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_17 | Star Canoe Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| star_canoe_species_18 | Star Canoe Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Canoe Shells**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Wayfinding Beads**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Wayfinder Bay token, Star Mat tool, Reef Rest thread, Far Lantern seal, Shell Reach bundle, Wind Palm token. |
| Instance and cosmetic templates | Blue Anchor tool, Tide Memory thread, Wayfinder Bay seal, Star Mat bundle, Reef Rest token, Far Lantern tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `star_canoe_vendor_01` at `star_canoe_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| star_canoe_dungeon_room_01 | The Far Lantern Crossing: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: star_canoe_species_01, star_canoe_species_02; elite: none |   |
| star_canoe_dungeon_room_02 | The Far Lantern Crossing: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: star_canoe_species_03, star_canoe_species_04; elite: none |   |
| star_canoe_dungeon_room_03 | The Far Lantern Crossing: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: star_canoe_species_05, star_canoe_species_06; elite: star_canoe_species_09 |   |
| star_canoe_dungeon_room_04 | The Far Lantern Crossing: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: star_canoe_species_07, star_canoe_species_08; elite: none | checkpoint  |
| star_canoe_dungeon_room_05 | The Far Lantern Crossing: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: star_canoe_species_09, star_canoe_species_10; elite: none |  boss: star_canoe_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`star_canoe_trap_01`), jammed latch (`star_canoe_trap_02`), wet threshold (`star_canoe_trap_03`), false shelf (`star_canoe_trap_04`), quiet bell (`star_canoe_trap_05`), sealed drawer (`star_canoe_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Star Mat Return Feast** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| star_canoe_talent_01 | Star Canoe Local Ear | 1 | none | star_canoe_effect_01 |
| star_canoe_talent_02 | Star Canoe Careful Hand | 2 | none | star_canoe_effect_02 |
| star_canoe_talent_03 | Star Canoe Route Sense | 3 | none | star_canoe_effect_03 |
| star_canoe_talent_04 | Star Canoe Shared Measure | 4 | none | star_canoe_effect_04 |
| star_canoe_talent_05 | Star Canoe Quiet Craft | 1 | star_canoe_talent_04 | star_canoe_effect_05 |
| star_canoe_talent_06 | Star Canoe Open Invitation | 2 | none | star_canoe_effect_06 |
| star_canoe_talent_07 | Star Canoe Safe Return | 3 | none | star_canoe_effect_07 |
| star_canoe_talent_08 | Star Canoe Field Note | 4 | none | star_canoe_effect_08 |
| star_canoe_talent_09 | Star Canoe Steady Pace | 1 | star_canoe_talent_08 | star_canoe_effect_09 |
| star_canoe_talent_10 | Star Canoe Clear Signal | 2 | none | star_canoe_effect_10 |
| star_canoe_talent_11 | Star Canoe Warm Welcome | 3 | none | star_canoe_effect_11 |
| star_canoe_talent_12 | Star Canoe Small Courage | 4 | none | star_canoe_effect_12 |
| star_canoe_talent_13 | Star Canoe Repair Habit | 1 | star_canoe_talent_12 | star_canoe_effect_13 |
| star_canoe_talent_14 | Star Canoe Trust Mark | 2 | none | star_canoe_effect_14 |
| star_canoe_talent_15 | Star Canoe Second Look | 3 | none | star_canoe_effect_15 |
| star_canoe_talent_16 | Star Canoe Closing Grace | 4 | none | star_canoe_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| star_canoe_contract_01 | Star Canoe Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| star_canoe_contract_02 | Star Canoe Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| star_canoe_contract_03 | Star Canoe Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| star_canoe_contract_04 | Star Canoe Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| star_canoe_contract_05 | Star Canoe Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| star_canoe_contract_06 | Star Canoe Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| star_canoe_contract_07 | Star Canoe Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| star_canoe_contract_08 | Star Canoe Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| star_canoe_interact_01 | Wayfinder Bay bench | rest | star_canoe_place_01 |
| star_canoe_interact_02 | Star Mat cabinet | repair | star_canoe_place_02 |
| star_canoe_interact_03 | Reef Rest rack | tend | star_canoe_place_03 |
| star_canoe_interact_04 | Far Lantern kettle | craft | star_canoe_place_04 |
| star_canoe_interact_05 | Shell Reach ledger | cook | star_canoe_place_05 |
| star_canoe_interact_06 | Wind Palm rail | bind_inn | star_canoe_place_06 |
| star_canoe_interact_07 | Blue Anchor bell | inspect | star_canoe_place_07 |
| star_canoe_interact_08 | Tide Memory board | open | star_canoe_place_08 |
| star_canoe_interact_09 | Wayfinder Bay table | carry | star_canoe_place_01 |
| star_canoe_interact_10 | Star Mat lamp | clean | star_canoe_place_02 |
| star_canoe_interact_11 | Reef Rest gate | signal | star_canoe_place_03 |
| star_canoe_interact_12 | Far Lantern shelf | record | star_canoe_place_04 |


**Default interior graph.** `star_canoe_interior_01` enters from `star_canoe_place_08` and contains 7 connected rooms: Star Canoe Entry, Star Canoe Main Room, Star Canoe Work Nook, Star Canoe Window Room, Star Canoe Quiet Room, Star Canoe Storage, Star Canoe Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | wayfinder, star, reef, far materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Star Canoe` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Star Canoe and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Star Canoe: distant work, a room tone, a gentle rhythm that belongs to Wayfinder Bay, and a second layer that makes the route toward Wind Palm feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Star Canoe Ledger |
| 2 | Star Canoe Route |
| 3 | Star Canoe Work |
| 4 | Star Canoe Talk |
| 5 | Star Canoe Kit |
| 6 | Star Canoe Pack |
| 7 | Star Canoe Rest |
| 8 | Star Canoe Safety |
| 9 | Star Canoe Map |
| 10 | Star Canoe Notice |
| 11 | Star Canoe Favour |
| 12 | Star Canoe Gold |
| 13 | Star Canoe Token |
| 14 | Star Canoe Record |
| 15 | Star Canoe Instance |
| 16 | Star Canoe Checkpoint |
| 17 | Star Canoe Choice |
| 18 | Star Canoe Help |
| 19 | Star Canoe Calendar |
| 20 | Star Canoe Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Wayfinder Bay, a small promise has your name on it. |
| 2 | At Star Mat, a small promise has your name on it. |
| 3 | At Reef Rest, a small promise has your name on it. |
| 4 | At Far Lantern, a small promise has your name on it. |
| 5 | At Shell Reach, a small promise has your name on it. |
| 6 | At Wind Palm, a small promise has your name on it. |
| 7 | At Blue Anchor, a small promise has your name on it. |
| 8 | At Tide Memory, a small promise has your name on it. |
| 9 | At Wayfinder Bay, a small promise has your name on it. |
| 10 | At Star Mat, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is original ocean voyaging and reciprocal canoe care. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
