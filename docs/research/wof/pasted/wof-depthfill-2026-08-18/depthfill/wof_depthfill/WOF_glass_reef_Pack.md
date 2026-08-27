# WOF Glass Reef: Full Start-Depth Pack

> **Release truth.** Glass Reef is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `glass_reef` |
| Display name | **Glass Reef** |
| One-line pitch | A luminous underwater city where tidecraft workers mend reef lattices, read currents, and solve pressure-safe civic problems before the living coral loses its memory. |
| Maturity | **all-ages** |
| rulesModuleId | `depth_gauge` |
| Theme Kit | **Glass Reef Theme Kit**, included with world entitlement |
| Genre pattern and fence | Underwater civic repair fantasy. It is not a branded ocean kingdom, a mermaid copy, or a lost-continent reconstruction. |

Glass Reef is a WOF text world about a luminous underwater city where tidecraft workers mend reef lattices, read currents, and solve pressure-safe civic problems before the living coral loses its memory. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Atlantis Disney named place |
| 2 | The Little Mermaid hero silhouette |
| 3 | Aquaman logo geometry |
| 4 | Bioshock Rapture catchphrase |
| 5 | Subnautica signature costume |
| 6 | Finding Nemo proprietary creature |
| 7 | SeaQuest map layout |
| 8 | Avatar Way of Water faction title |
| 9 | SpongeBob weapon profile |
| 10 | Ariel silhouette UI chrome |
| 11 | Atlantis Disney quest premise |
| 12 | The Little Mermaid title typography |
| 13 | Aquaman color-coded insignia |
| 14 | Bioshock Rapture music motif |
| 15 | Subnautica vehicle or mount profile |
| 16 | Finding Nemo companion anatomy |
| 17 | SeaQuest named artifact |
| 18 | Avatar Way of Water school or agency badge |
| 19 | SpongeBob real sacred practice as minigame |
| 20 | Ariel silhouette stereotyped cultural shorthand |
| 21 | Atlantis Disney real-person likeness |
| 22 | The Little Mermaid copied dialogue cadence |
| 23 | Aquaman fan-server slogan |
| 24 | Bioshock Rapture paid power framing |
| 25 | Subnautica loot-box presentation |
| 26 | Finding Nemo named place |
| 27 | SeaQuest hero silhouette |
| 28 | Avatar Way of Water logo geometry |
| 29 | SpongeBob catchphrase |
| 30 | Ariel silhouette signature costume |
| 31 | Atlantis Disney proprietary creature |
| 32 | The Little Mermaid map layout |
| 33 | Aquaman faction title |
| 34 | Bioshock Rapture weapon profile |
| 35 | Subnautica UI chrome |
| 36 | Finding Nemo quest premise |
| 37 | SeaQuest title typography |
| 38 | Avatar Way of Water color-coded insignia |
| 39 | SpongeBob music motif |
| 40 | Ariel silhouette vehicle or mount profile |
| 41 | Atlantis Disney companion anatomy |
| 42 | The Little Mermaid named artifact |
| 43 | Aquaman school or agency badge |
| 44 | Bioshock Rapture real sacred practice as minigame |
| 45 | Subnautica stereotyped cultural shorthand |
| 46 | Finding Nemo real-person likeness |
| 47 | SeaQuest copied dialogue cadence |
| 48 | Avatar Way of Water fan-server slogan |
| 49 | SpongeBob paid power framing |
| 50 | Ariel silhouette loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | hp, air, depth, pressure, current, reefTrust, tideToken, salvage |
| Wipe and checkpoint | Wipe returns the party to `glass_reef_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Glass Reef • {{turn}} • committed |
| 2 | [Route] Glass Reef • {{placeId}} • committed |
| 3 | [Work] Glass Reef • {{lastAction}} • committed |
| 4 | [Talk] Glass Reef • {{npcId}} • committed |
| 5 | [Kit] Glass Reef • {{kitId}} • committed |
| 6 | [Pack] Glass Reef • {{partySize}} • committed |
| 7 | [Rest] Glass Reef • {{checkpoint}} • committed |
| 8 | [Safety] Glass Reef • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| glass_reef_kit_01 | Tide Weaver | translucent thread mantle | splice living tide lines | Never pull a living coral thread for decoration. | Let sentences rise and fall like a calm current. | tide_weaver mantle; tide_weaver tool; glass_reef_map_01 | glass_reef_place_01; glass_reef_q_01 | glass_reef_ability_01 |
| glass_reef_kit_02 | Pressure Bellkeeper | pearl-rimmed pressure collar | maintain safe descent bells | Never ring a pressure bell as a joke. | Let sentences rise and fall like a calm current. | pressure_bellkeeper vest; pressure_bellkeeper tool; glass_reef_map_02 | glass_reef_place_02; glass_reef_q_02 | glass_reef_ability_02 |
| glass_reef_kit_03 | Reef Notary | ink-blue shell vest | certify reef stewardship records | Never seal a reef claim without witnesses. | Let sentences rise and fall like a calm current. | reef_notary jacket; reef_notary tool; glass_reef_map_03 | glass_reef_place_01; glass_reef_q_03 | glass_reef_ability_03 |
| glass_reef_kit_04 | Current Mason | coral-clay sleeve coat | set current-safe masonry | Never divert a current through a nursery. | Let sentences rise and fall like a calm current. | current_mason sash; current_mason tool; glass_reef_map_04 | glass_reef_place_02; glass_reef_q_04 | glass_reef_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `glass_reef_place_01` is a shared hub rather than a capital analogue; `glass_reef_place_04` is the mid-join; `glass_reef_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| glass_reef_place_01 | Lumen Quay | shared hub | street | safe | yes | glass_reef_place_02, glass_reef_place_04 | A public notice at Lumen Quay has been posted with one crucial line washed away. |
| glass_reef_place_02 | Pearlward | start hub | street | safe | yes | glass_reef_place_01, glass_reef_place_03 | A work roster at Pearlward leaves two neighbours believing they were promised the same task. |
| glass_reef_place_03 | Current Garden | street route | street | safe | yes | glass_reef_place_02, glass_reef_place_04 | A route marker at Current Garden points visitors toward a closed gate and needs a safe correction. |
| glass_reef_place_04 | Hush Trench | mid join | street | low | yes | glass_reef_place_03, glass_reef_place_05, glass_reef_place_01 | A newcomer at Hush Trench needs a local introduction before a small obligation becomes embarrassing. |
| glass_reef_place_05 | Coral Archive | work district | interior | low | no | glass_reef_place_04, glass_reef_place_06 | A shared tool at Coral Archive has been returned without its care tag. |
| glass_reef_place_06 | Glasswake Gate | instance door | dungeon | medium | no | glass_reef_place_05, glass_reef_place_07 | The entry record at Glasswake Gate names an unfinished errand, not a monster or apocalypse. |
| glass_reef_place_07 | Tremor Kelp | wild edge | street | medium | yes | glass_reef_place_06, glass_reef_place_08 | A weather change at Tremor Kelp threatens a community plan unless someone reads the signs. |
| glass_reef_place_08 | Blue Bell Mouth | housing approach | interior | low | no | glass_reef_place_07 | A resident at Blue Bell Mouth has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| glass_reef_npc_01 | Alden Vane | glass_reef_place_01 | quest | Alden Vane says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Lumen Quay: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_02 | Bryn Quill | glass_reef_place_02 | profession | Bryn Quill says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Pearlward: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_03 | Cato Vale | glass_reef_place_03 | hub | Cato Vale says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Current Garden: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_04 | Dessa Wren | glass_reef_place_04 | merchant | Dessa Wren says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Hush Trench: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_05 | Eris Morrow | glass_reef_place_01 | local | Eris Morrow says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Lumen Quay: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_06 | Fenn Rowan | glass_reef_place_02 | host | Fenn Rowan says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Pearlward: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_07 | Gala Nook | glass_reef_place_03 | quest | Gala Nook says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Current Garden: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_08 | Holl Cress | glass_reef_place_04 | profession | Holl Cress says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Hush Trench: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_09 | Ivo Silt | glass_reef_place_01 | local | Ivo Silt says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Lumen Quay: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| glass_reef_npc_10 | Jori Pryce | glass_reef_place_02 | merchant | Jori Pryce says, ‘Glass Reef keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Pearlward: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Hush Trench, if that is useful. |
| 2 | Glass Reef feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Glasswake Gate. |
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
| Tide Weaver | At Lumen Quay, you arrive in tide_weaver mantle carrying glass_reef_map_01. A small obligation is already late. | Give up one turn to help now. | Glass Reef: Name a Working Promise |
| Pressure Bellkeeper | At Pearlward, you arrive in pressure_bellkeeper vest carrying glass_reef_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Glass Reef: Set the First Tool Aside |
| Reef Notary | At Lumen Quay, you arrive in reef_notary jacket carrying glass_reef_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Glass Reef: Carry the Right Record |
| Current Mason | At Pearlward, you arrive in current_mason sash carrying glass_reef_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Glass Reef: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_glass_reef_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Lumen Quay’s small mismatch | ask | missing tag | A local need at Hush Trench is connected but not catastrophic. | alternate talk |
| 2 | Resolve Pearlward’s small mismatch | repair | closed path | A local need at Coral Archive is connected but not catastrophic. | new route |
| 3 | Resolve Current Garden’s small mismatch | carry | unclear note | A local need at Glasswake Gate is connected but not catastrophic. | recorded favor |
| 4 | Resolve Hush Trench’s small mismatch | listen | late guest | A local need at Tremor Kelp is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Coral Archive’s small mismatch | map | wet weather | A local need at Blue Bell Mouth is connected but not catastrophic. | slower reward |
| 6 | Resolve Glasswake Gate’s small mismatch | prepare | busy shift | A local need at Lumen Quay is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Tremor Kelp’s small mismatch | wait | quiet boundary | A local need at Pearlward is connected but not catastrophic. | solo option |
| 8 | Resolve Blue Bell Mouth’s small mismatch | return | wrong room | A local need at Current Garden is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Hushglass Siphon` and `Pearlward Driftlight`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| glass_reef_q_01 | Glass Reef: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| glass_reef_q_02 | Glass Reef: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| glass_reef_q_03 | Glass Reef: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| glass_reef_q_04 | Glass Reef: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| glass_reef_q_05 | Glass Reef: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| glass_reef_q_06 | Glass Reef: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| glass_reef_q_07 | Glass Reef: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| glass_reef_q_08 | Glass Reef: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| glass_reef_q_09 | Glass Reef: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| glass_reef_q_10 | Glass Reef: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| glass_reef_q_11 | Glass Reef: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| glass_reef_q_12 | Glass Reef: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| glass_reef_q_13 | Glass Reef: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| glass_reef_q_14 | Glass Reef: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| glass_reef_q_15 | Glass Reef: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| glass_reef_q_16 | Glass Reef: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| glass_reef_q_17 | Glass Reef: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| glass_reef_q_18 | Glass Reef: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| glass_reef_q_19 | Glass Reef: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| glass_reef_q_20 | Glass Reef: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| glass_reef_q_21 | Glass Reef: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| glass_reef_q_22 | Glass Reef: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| glass_reef_q_23 | Glass Reef: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| glass_reef_q_24 | Glass Reef: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| glass_reef_q_25 | Glass Reef: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Lumen Quay`: write `glass_reef_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Hush Trench`: write `glass_reef_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `glass_reef_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| glass_reef_species_01 | Glint Eel | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_02 | Shellfin | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_03 | Drift Ray | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_04 | Sponge Crab | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_05 | Bell Jelly | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_06 | Reef Skater | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_07 | Coral Finch | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_08 | Kelp Mouse | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_09 | Bubble Snail | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_10 | Current Fox | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_11 | Pearl Hare | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_12 | Tide Moth | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_13 | Hush Shrimp | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_14 | Glass Anemone | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_15 | Blue Pipefish | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_16 | Lattice Turtle | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_17 | Saltless Star | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| glass_reef_species_18 | Gloom Wrasse | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Tide Shells**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Lumen Glints**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Lumen Quay token, Pearlward tool, Current Garden thread, Hush Trench seal, Coral Archive bundle, Glasswake Gate token. |
| Instance and cosmetic templates | Tremor Kelp tool, Blue Bell Mouth thread, Lumen Quay seal, Pearlward bundle, Current Garden token, Hush Trench tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `glass_reef_vendor_01` at `glass_reef_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| glass_reef_dungeon_room_01 | The Hushglass Siphon: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: glass_reef_species_01, glass_reef_species_02; elite: none |   |
| glass_reef_dungeon_room_02 | The Hushglass Siphon: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: glass_reef_species_03, glass_reef_species_04; elite: none |   |
| glass_reef_dungeon_room_03 | The Hushglass Siphon: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: glass_reef_species_05, glass_reef_species_06; elite: glass_reef_species_09 |   |
| glass_reef_dungeon_room_04 | The Hushglass Siphon: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: glass_reef_species_07, glass_reef_species_08; elite: none | checkpoint  |
| glass_reef_dungeon_room_05 | The Hushglass Siphon: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: glass_reef_species_09, glass_reef_species_10; elite: none |  boss: glass_reef_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`glass_reef_trap_01`), jammed latch (`glass_reef_trap_02`), wet threshold (`glass_reef_trap_03`), false shelf (`glass_reef_trap_04`), quiet bell (`glass_reef_trap_05`), sealed drawer (`glass_reef_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Pearlward Driftlight** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| glass_reef_talent_01 | Glass Reef Local Ear | 1 | none | glass_reef_effect_01 |
| glass_reef_talent_02 | Glass Reef Careful Hand | 2 | none | glass_reef_effect_02 |
| glass_reef_talent_03 | Glass Reef Route Sense | 3 | none | glass_reef_effect_03 |
| glass_reef_talent_04 | Glass Reef Shared Measure | 4 | none | glass_reef_effect_04 |
| glass_reef_talent_05 | Glass Reef Quiet Craft | 1 | glass_reef_talent_04 | glass_reef_effect_05 |
| glass_reef_talent_06 | Glass Reef Open Invitation | 2 | none | glass_reef_effect_06 |
| glass_reef_talent_07 | Glass Reef Safe Return | 3 | none | glass_reef_effect_07 |
| glass_reef_talent_08 | Glass Reef Field Note | 4 | none | glass_reef_effect_08 |
| glass_reef_talent_09 | Glass Reef Steady Pace | 1 | glass_reef_talent_08 | glass_reef_effect_09 |
| glass_reef_talent_10 | Glass Reef Clear Signal | 2 | none | glass_reef_effect_10 |
| glass_reef_talent_11 | Glass Reef Warm Welcome | 3 | none | glass_reef_effect_11 |
| glass_reef_talent_12 | Glass Reef Small Courage | 4 | none | glass_reef_effect_12 |
| glass_reef_talent_13 | Glass Reef Repair Habit | 1 | glass_reef_talent_12 | glass_reef_effect_13 |
| glass_reef_talent_14 | Glass Reef Trust Mark | 2 | none | glass_reef_effect_14 |
| glass_reef_talent_15 | Glass Reef Second Look | 3 | none | glass_reef_effect_15 |
| glass_reef_talent_16 | Glass Reef Closing Grace | 4 | none | glass_reef_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| glass_reef_contract_01 | Glass Reef Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| glass_reef_contract_02 | Glass Reef Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| glass_reef_contract_03 | Glass Reef Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| glass_reef_contract_04 | Glass Reef Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| glass_reef_contract_05 | Glass Reef Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| glass_reef_contract_06 | Glass Reef Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| glass_reef_contract_07 | Glass Reef Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| glass_reef_contract_08 | Glass Reef Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| glass_reef_interact_01 | Lumen Quay bench | rest | glass_reef_place_01 |
| glass_reef_interact_02 | Pearlward cabinet | repair | glass_reef_place_02 |
| glass_reef_interact_03 | Current Garden rack | tend | glass_reef_place_03 |
| glass_reef_interact_04 | Hush Trench kettle | craft | glass_reef_place_04 |
| glass_reef_interact_05 | Coral Archive ledger | cook | glass_reef_place_05 |
| glass_reef_interact_06 | Glasswake Gate rail | bind_inn | glass_reef_place_06 |
| glass_reef_interact_07 | Tremor Kelp bell | inspect | glass_reef_place_07 |
| glass_reef_interact_08 | Blue Bell Mouth board | open | glass_reef_place_08 |
| glass_reef_interact_09 | Lumen Quay table | carry | glass_reef_place_01 |
| glass_reef_interact_10 | Pearlward lamp | clean | glass_reef_place_02 |
| glass_reef_interact_11 | Current Garden gate | signal | glass_reef_place_03 |
| glass_reef_interact_12 | Hush Trench shelf | record | glass_reef_place_04 |


**Default interior graph.** `glass_reef_interior_01` enters from `glass_reef_place_08` and contains 7 connected rooms: Glass Reef Entry, Glass Reef Main Room, Glass Reef Work Nook, Glass Reef Window Room, Glass Reef Quiet Room, Glass Reef Storage, Glass Reef Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | lumen, pearlward, current, hush materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Glass Reef` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Let sentences rise and fall like a calm current. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Glass Reef: distant work, a room tone, a gentle rhythm that belongs to Lumen Quay, and a second layer that makes the route toward Glasswake Gate feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Glass Reef Ledger |
| 2 | Glass Reef Route |
| 3 | Glass Reef Work |
| 4 | Glass Reef Talk |
| 5 | Glass Reef Kit |
| 6 | Glass Reef Pack |
| 7 | Glass Reef Rest |
| 8 | Glass Reef Safety |
| 9 | Glass Reef Map |
| 10 | Glass Reef Notice |
| 11 | Glass Reef Favour |
| 12 | Glass Reef Gold |
| 13 | Glass Reef Token |
| 14 | Glass Reef Record |
| 15 | Glass Reef Instance |
| 16 | Glass Reef Checkpoint |
| 17 | Glass Reef Choice |
| 18 | Glass Reef Help |
| 19 | Glass Reef Calendar |
| 20 | Glass Reef Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Lumen Quay, a small promise has your name on it. |
| 2 | At Pearlward, a small promise has your name on it. |
| 3 | At Current Garden, a small promise has your name on it. |
| 4 | At Hush Trench, a small promise has your name on it. |
| 5 | At Coral Archive, a small promise has your name on it. |
| 6 | At Glasswake Gate, a small promise has your name on it. |
| 7 | At Tremor Kelp, a small promise has your name on it. |
| 8 | At Blue Bell Mouth, a small promise has your name on it. |
| 9 | At Lumen Quay, a small promise has your name on it. |
| 10 | At Pearlward, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is underwater civic repair fantasy. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
