# WOF Homestead Ring: Full Start-Depth Pack

> **Release truth.** Homestead Ring is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `homestead_ring` |
| Display name | **Homestead Ring** |
| One-line pitch | A peaceful, player-built circular town whose public works advance on a shared server clock and whose deeds reward maintenance, hospitality, and consentful collaboration rather than conquest. |
| Maturity | **all-ages** |
| rulesModuleId | `build_tick` |
| Theme Kit | **Homestead Ring Theme Kit**, included with world entitlement |
| Genre pattern and fence | Civic homestead construction world. It is not a salvage apocalypse, a contested survival server, or an imported block-building game. |

Homestead Ring is a WOF text world about a peaceful, player-built circular town whose public works advance on a shared server clock and whose deeds reward maintenance, hospitality, and consentful collaboration rather than conquest. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Minecraft named place |
| 2 | Terraria hero silhouette |
| 3 | Rust logo geometry |
| 4 | Valheim catchphrase |
| 5 | Animal Crossing island signature costume |
| 6 | Stardew Valley farm proprietary creature |
| 7 | Pax Dei map layout |
| 8 | BitCraft faction title |
| 9 | Fallout settlement weapon profile |
| 10 | Hearth Ruin UI chrome |
| 11 | Minecraft quest premise |
| 12 | Terraria title typography |
| 13 | Rust color-coded insignia |
| 14 | Valheim music motif |
| 15 | Animal Crossing island vehicle or mount profile |
| 16 | Stardew Valley farm companion anatomy |
| 17 | Pax Dei named artifact |
| 18 | BitCraft school or agency badge |
| 19 | Fallout settlement real sacred practice as minigame |
| 20 | Hearth Ruin stereotyped cultural shorthand |
| 21 | Minecraft real-person likeness |
| 22 | Terraria copied dialogue cadence |
| 23 | Rust fan-server slogan |
| 24 | Valheim paid power framing |
| 25 | Animal Crossing island loot-box presentation |
| 26 | Stardew Valley farm named place |
| 27 | Pax Dei hero silhouette |
| 28 | BitCraft logo geometry |
| 29 | Fallout settlement catchphrase |
| 30 | Hearth Ruin signature costume |
| 31 | Minecraft proprietary creature |
| 32 | Terraria map layout |
| 33 | Rust faction title |
| 34 | Valheim weapon profile |
| 35 | Animal Crossing island UI chrome |
| 36 | Stardew Valley farm quest premise |
| 37 | Pax Dei title typography |
| 38 | BitCraft color-coded insignia |
| 39 | Fallout settlement music motif |
| 40 | Hearth Ruin vehicle or mount profile |
| 41 | Minecraft companion anatomy |
| 42 | Terraria named artifact |
| 43 | Rust school or agency badge |
| 44 | Valheim real sacred practice as minigame |
| 45 | Animal Crossing island stereotyped cultural shorthand |
| 46 | Stardew Valley farm real-person likeness |
| 47 | Pax Dei copied dialogue cadence |
| 48 | BitCraft fan-server slogan |
| 49 | Fallout settlement paid power framing |
| 50 | Hearth Ruin loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | stamina, plotId, materials, permitMarks, wardTrust, buildTick, contribution, weather |
| Wipe and checkpoint | Wipe returns the party to `homestead_ring_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Homestead Ring • {{turn}} • committed |
| 2 | [Route] Homestead Ring • {{placeId}} • committed |
| 3 | [Work] Homestead Ring • {{lastAction}} • committed |
| 4 | [Talk] Homestead Ring • {{npcId}} • committed |
| 5 | [Kit] Homestead Ring • {{kitId}} • committed |
| 6 | [Pack] Homestead Ring • {{partySize}} • committed |
| 7 | [Rest] Homestead Ring • {{checkpoint}} • committed |
| 8 | [Safety] Homestead Ring • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| homestead_ring_kit_01 | Deed Surveyor | blueprint vest and chalk cord | measure lawful plot edges | Never place a wall across an agreed path. | Speak in plans, seasons, and invitations rather than commands. | deed_surveyor mantle; deed_surveyor tool; homestead_ring_map_01 | homestead_ring_place_01; homestead_ring_q_01 | homestead_ring_ability_01 |
| homestead_ring_kit_02 | Kiln Tender | clay-dusted wrap jacket | fire shared brick allotments | Never fire another player’s reserved clay. | Speak in plans, seasons, and invitations rather than commands. | kiln_tender vest; kiln_tender tool; homestead_ring_map_02 | homestead_ring_place_02; homestead_ring_q_02 | homestead_ring_ability_02 |
| homestead_ring_kit_03 | Canal Caller | waterproof half-cape | schedule water turns | Never open a water turn out of sequence. | Speak in plans, seasons, and invitations rather than commands. | canal_caller jacket; canal_caller tool; homestead_ring_map_03 | homestead_ring_place_01; homestead_ring_q_03 | homestead_ring_ability_03 |
| homestead_ring_kit_04 | Orchard Graftkeeper | apple-green work smock | preserve fruit-root lines | Never graft without the root-owner’s consent. | Speak in plans, seasons, and invitations rather than commands. | orchard_graftkeeper sash; orchard_graftkeeper tool; homestead_ring_map_04 | homestead_ring_place_02; homestead_ring_q_04 | homestead_ring_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `homestead_ring_place_01` is a shared hub rather than a capital analogue; `homestead_ring_place_04` is the mid-join; `homestead_ring_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| homestead_ring_place_01 | Ring Green | shared hub | street | safe | yes | homestead_ring_place_02, homestead_ring_place_04 | A public notice at Ring Green has been posted with one crucial line washed away. |
| homestead_ring_place_02 | Pebble Ward | start hub | street | safe | yes | homestead_ring_place_01, homestead_ring_place_03 | A work roster at Pebble Ward leaves two neighbours believing they were promised the same task. |
| homestead_ring_place_03 | Orchard Rise | street route | street | safe | yes | homestead_ring_place_02, homestead_ring_place_04 | A route marker at Orchard Rise points visitors toward a closed gate and needs a safe correction. |
| homestead_ring_place_04 | Canal Gate | mid join | street | low | yes | homestead_ring_place_03, homestead_ring_place_05, homestead_ring_place_01 | A newcomer at Canal Gate needs a local introduction before a small obligation becomes embarrassing. |
| homestead_ring_place_05 | Common Kiln | work district | interior | low | no | homestead_ring_place_04, homestead_ring_place_06 | A shared tool at Common Kiln has been returned without its care tag. |
| homestead_ring_place_06 | Bell Assembly | instance door | dungeon | medium | no | homestead_ring_place_05, homestead_ring_place_07 | The entry record at Bell Assembly names an unfinished errand, not a monster or apocalypse. |
| homestead_ring_place_07 | Sparrow Span | wild edge | street | medium | yes | homestead_ring_place_06, homestead_ring_place_08 | A weather change at Sparrow Span threatens a community plan unless someone reads the signs. |
| homestead_ring_place_08 | Woolyard Steps | housing approach | interior | low | no | homestead_ring_place_07 | A resident at Woolyard Steps has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| homestead_ring_npc_01 | Eris Silt | homestead_ring_place_01 | quest | Eris Silt says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Eris Silt offers a specific task at Ring Green: settle the practical mismatch before it costs someone a shift. | Eris Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_02 | Fenn Pryce | homestead_ring_place_02 | profession | Fenn Pryce says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Fenn Pryce offers a specific task at Pebble Ward: settle the practical mismatch before it costs someone a shift. | Fenn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_03 | Gala Vane | homestead_ring_place_03 | hub | Gala Vane says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Gala Vane offers a specific task at Orchard Rise: settle the practical mismatch before it costs someone a shift. | Gala Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_04 | Holl Quill | homestead_ring_place_04 | merchant | Holl Quill says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Holl Quill offers a specific task at Canal Gate: settle the practical mismatch before it costs someone a shift. | Holl Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_05 | Ivo Vale | homestead_ring_place_01 | local | Ivo Vale says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vale offers a specific task at Ring Green: settle the practical mismatch before it costs someone a shift. | Ivo Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_06 | Jori Wren | homestead_ring_place_02 | host | Jori Wren says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Jori Wren offers a specific task at Pebble Ward: settle the practical mismatch before it costs someone a shift. | Jori Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_07 | Alden Morrow | homestead_ring_place_03 | quest | Alden Morrow says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Alden Morrow offers a specific task at Orchard Rise: settle the practical mismatch before it costs someone a shift. | Alden Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_08 | Bryn Rowan | homestead_ring_place_04 | profession | Bryn Rowan says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Bryn Rowan offers a specific task at Canal Gate: settle the practical mismatch before it costs someone a shift. | Bryn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_09 | Cato Nook | homestead_ring_place_01 | local | Cato Nook says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Cato Nook offers a specific task at Ring Green: settle the practical mismatch before it costs someone a shift. | Cato Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| homestead_ring_npc_10 | Dessa Cress | homestead_ring_place_02 | merchant | Dessa Cress says, ‘Homestead Ring keeps its promises in small places. Tell me which one you noticed.’ | Dessa Cress offers a specific task at Pebble Ward: settle the practical mismatch before it costs someone a shift. | Dessa Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Canal Gate, if that is useful. |
| 2 | Homestead Ring feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Bell Assembly. |
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
| Deed Surveyor | At Ring Green, you arrive in deed_surveyor mantle carrying homestead_ring_map_01. A small obligation is already late. | Give up one turn to help now. | Homestead Ring: Name a Working Promise |
| Kiln Tender | At Pebble Ward, you arrive in kiln_tender vest carrying homestead_ring_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Homestead Ring: Set the First Tool Aside |
| Canal Caller | At Ring Green, you arrive in canal_caller jacket carrying homestead_ring_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Homestead Ring: Carry the Right Record |
| Orchard Graftkeeper | At Pebble Ward, you arrive in orchard_graftkeeper sash carrying homestead_ring_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Homestead Ring: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_homestead_ring_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Ring Green’s small mismatch | ask | missing tag | A local need at Canal Gate is connected but not catastrophic. | alternate talk |
| 2 | Resolve Pebble Ward’s small mismatch | repair | closed path | A local need at Common Kiln is connected but not catastrophic. | new route |
| 3 | Resolve Orchard Rise’s small mismatch | carry | unclear note | A local need at Bell Assembly is connected but not catastrophic. | recorded favor |
| 4 | Resolve Canal Gate’s small mismatch | listen | late guest | A local need at Sparrow Span is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Common Kiln’s small mismatch | map | wet weather | A local need at Woolyard Steps is connected but not catastrophic. | slower reward |
| 6 | Resolve Bell Assembly’s small mismatch | prepare | busy shift | A local need at Ring Green is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Sparrow Span’s small mismatch | wait | quiet boundary | A local need at Pebble Ward is connected but not catastrophic. | solo option |
| 8 | Resolve Woolyard Steps’s small mismatch | return | wrong room | A local need at Orchard Rise is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Bellworks Jam` and `Founding Week`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| homestead_ring_q_01 | Homestead Ring: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| homestead_ring_q_02 | Homestead Ring: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| homestead_ring_q_03 | Homestead Ring: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| homestead_ring_q_04 | Homestead Ring: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| homestead_ring_q_05 | Homestead Ring: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| homestead_ring_q_06 | Homestead Ring: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| homestead_ring_q_07 | Homestead Ring: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| homestead_ring_q_08 | Homestead Ring: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| homestead_ring_q_09 | Homestead Ring: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| homestead_ring_q_10 | Homestead Ring: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| homestead_ring_q_11 | Homestead Ring: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| homestead_ring_q_12 | Homestead Ring: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| homestead_ring_q_13 | Homestead Ring: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| homestead_ring_q_14 | Homestead Ring: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| homestead_ring_q_15 | Homestead Ring: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| homestead_ring_q_16 | Homestead Ring: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| homestead_ring_q_17 | Homestead Ring: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| homestead_ring_q_18 | Homestead Ring: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| homestead_ring_q_19 | Homestead Ring: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| homestead_ring_q_20 | Homestead Ring: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| homestead_ring_q_21 | Homestead Ring: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| homestead_ring_q_22 | Homestead Ring: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| homestead_ring_q_23 | Homestead Ring: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| homestead_ring_q_24 | Homestead Ring: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| homestead_ring_q_25 | Homestead Ring: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Ring Green`: write `homestead_ring_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Canal Gate`: write `homestead_ring_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `homestead_ring_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| homestead_ring_species_01 | Moss Hen | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_02 | Parcel Goat | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_03 | Pond Carp | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_04 | Amber Bee | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_05 | Hedge Mouse | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_06 | Canal Duck | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_07 | Tile Beetle | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_08 | Orchard Dormouse | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_09 | Wool Moth | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_10 | Clay Lark | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_11 | Seed Snail | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_12 | Pond Skater | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_13 | Wind Vole | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_14 | Garden Frog | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_15 | Thatch Wren | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| homestead_ring_species_16 | Root Grub | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Ring Groats**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Bell Petals**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Ring Green token, Pebble Ward tool, Orchard Rise thread, Canal Gate seal, Common Kiln bundle, Bell Assembly token. |
| Instance and cosmetic templates | Sparrow Span tool, Woolyard Steps thread, Ring Green seal, Pebble Ward bundle, Orchard Rise token, Canal Gate tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `homestead_ring_vendor_01` at `homestead_ring_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| homestead_ring_dungeon_room_01 | The Bellworks Jam: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: homestead_ring_species_01, homestead_ring_species_02; elite: none |   |
| homestead_ring_dungeon_room_02 | The Bellworks Jam: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: homestead_ring_species_03, homestead_ring_species_04; elite: none |   |
| homestead_ring_dungeon_room_03 | The Bellworks Jam: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: homestead_ring_species_05, homestead_ring_species_06; elite: homestead_ring_species_09 |   |
| homestead_ring_dungeon_room_04 | The Bellworks Jam: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: homestead_ring_species_07, homestead_ring_species_08; elite: none | checkpoint  |
| homestead_ring_dungeon_room_05 | The Bellworks Jam: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: homestead_ring_species_09, homestead_ring_species_10; elite: none |  boss: homestead_ring_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`homestead_ring_trap_01`), jammed latch (`homestead_ring_trap_02`), wet threshold (`homestead_ring_trap_03`), false shelf (`homestead_ring_trap_04`), quiet bell (`homestead_ring_trap_05`), sealed drawer (`homestead_ring_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Founding Week** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| homestead_ring_talent_01 | Homestead Ring Local Ear | 1 | none | homestead_ring_effect_01 |
| homestead_ring_talent_02 | Homestead Ring Careful Hand | 2 | none | homestead_ring_effect_02 |
| homestead_ring_talent_03 | Homestead Ring Route Sense | 3 | none | homestead_ring_effect_03 |
| homestead_ring_talent_04 | Homestead Ring Shared Measure | 4 | none | homestead_ring_effect_04 |
| homestead_ring_talent_05 | Homestead Ring Quiet Craft | 1 | homestead_ring_talent_04 | homestead_ring_effect_05 |
| homestead_ring_talent_06 | Homestead Ring Open Invitation | 2 | none | homestead_ring_effect_06 |
| homestead_ring_talent_07 | Homestead Ring Safe Return | 3 | none | homestead_ring_effect_07 |
| homestead_ring_talent_08 | Homestead Ring Field Note | 4 | none | homestead_ring_effect_08 |
| homestead_ring_talent_09 | Homestead Ring Steady Pace | 1 | homestead_ring_talent_08 | homestead_ring_effect_09 |
| homestead_ring_talent_10 | Homestead Ring Clear Signal | 2 | none | homestead_ring_effect_10 |
| homestead_ring_talent_11 | Homestead Ring Warm Welcome | 3 | none | homestead_ring_effect_11 |
| homestead_ring_talent_12 | Homestead Ring Small Courage | 4 | none | homestead_ring_effect_12 |
| homestead_ring_talent_13 | Homestead Ring Repair Habit | 1 | homestead_ring_talent_12 | homestead_ring_effect_13 |
| homestead_ring_talent_14 | Homestead Ring Trust Mark | 2 | none | homestead_ring_effect_14 |
| homestead_ring_talent_15 | Homestead Ring Second Look | 3 | none | homestead_ring_effect_15 |
| homestead_ring_talent_16 | Homestead Ring Closing Grace | 4 | none | homestead_ring_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| homestead_ring_contract_01 | Homestead Ring Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| homestead_ring_contract_02 | Homestead Ring Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| homestead_ring_contract_03 | Homestead Ring Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| homestead_ring_contract_04 | Homestead Ring Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| homestead_ring_contract_05 | Homestead Ring Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| homestead_ring_contract_06 | Homestead Ring Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| homestead_ring_contract_07 | Homestead Ring Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| homestead_ring_contract_08 | Homestead Ring Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| homestead_ring_interact_01 | Ring Green bench | rest | homestead_ring_place_01 |
| homestead_ring_interact_02 | Pebble Ward cabinet | repair | homestead_ring_place_02 |
| homestead_ring_interact_03 | Orchard Rise rack | tend | homestead_ring_place_03 |
| homestead_ring_interact_04 | Canal Gate kettle | craft | homestead_ring_place_04 |
| homestead_ring_interact_05 | Common Kiln ledger | cook | homestead_ring_place_05 |
| homestead_ring_interact_06 | Bell Assembly rail | bind_inn | homestead_ring_place_06 |
| homestead_ring_interact_07 | Sparrow Span bell | inspect | homestead_ring_place_07 |
| homestead_ring_interact_08 | Woolyard Steps board | open | homestead_ring_place_08 |
| homestead_ring_interact_09 | Ring Green table | carry | homestead_ring_place_01 |
| homestead_ring_interact_10 | Pebble Ward lamp | clean | homestead_ring_place_02 |
| homestead_ring_interact_11 | Orchard Rise gate | signal | homestead_ring_place_03 |
| homestead_ring_interact_12 | Canal Gate shelf | record | homestead_ring_place_04 |


**Default interior graph.** `homestead_ring_interior_01` enters from `homestead_ring_place_08` and contains 7 connected rooms: Homestead Ring Entry, Homestead Ring Main Room, Homestead Ring Work Nook, Homestead Ring Window Room, Homestead Ring Quiet Room, Homestead Ring Storage, Homestead Ring Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | ring, pebble, orchard, canal materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Homestead Ring` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Speak in plans, seasons, and invitations rather than commands. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Homestead Ring: distant work, a room tone, a gentle rhythm that belongs to Ring Green, and a second layer that makes the route toward Bell Assembly feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Homestead Ring Ledger |
| 2 | Homestead Ring Route |
| 3 | Homestead Ring Work |
| 4 | Homestead Ring Talk |
| 5 | Homestead Ring Kit |
| 6 | Homestead Ring Pack |
| 7 | Homestead Ring Rest |
| 8 | Homestead Ring Safety |
| 9 | Homestead Ring Map |
| 10 | Homestead Ring Notice |
| 11 | Homestead Ring Favour |
| 12 | Homestead Ring Gold |
| 13 | Homestead Ring Token |
| 14 | Homestead Ring Record |
| 15 | Homestead Ring Instance |
| 16 | Homestead Ring Checkpoint |
| 17 | Homestead Ring Choice |
| 18 | Homestead Ring Help |
| 19 | Homestead Ring Calendar |
| 20 | Homestead Ring Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Ring Green, a small promise has your name on it. |
| 2 | At Pebble Ward, a small promise has your name on it. |
| 3 | At Orchard Rise, a small promise has your name on it. |
| 4 | At Canal Gate, a small promise has your name on it. |
| 5 | At Common Kiln, a small promise has your name on it. |
| 6 | At Bell Assembly, a small promise has your name on it. |
| 7 | At Sparrow Span, a small promise has your name on it. |
| 8 | At Woolyard Steps, a small promise has your name on it. |
| 9 | At Ring Green, a small promise has your name on it. |
| 10 | At Pebble Ward, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is civic homestead construction world. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
