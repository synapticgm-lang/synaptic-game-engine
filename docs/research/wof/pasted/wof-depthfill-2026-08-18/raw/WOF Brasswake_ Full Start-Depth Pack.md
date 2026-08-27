# WOF Brasswake: Full Start-Depth Pack

> **Release truth.** Brasswake is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `brasswake` |
| Display name | **Brasswake** |
| One-line pitch | A smoke-bright chain of rail moorings where mail-riggers, boiler hands, lift engineers, and signal printers keep sky islands connected without letting profit cut loose the people below. |
| Maturity | **teen** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Brasswake Theme Kit**, included with world entitlement |
| Genre pattern and fence | Clockwork airship and rail adventure. It is not a borrowed Victorian city, a known floating academy, or a familiar steampunk revolution. |

Brasswake is a WOF text world about a smoke-bright chain of rail moorings where mail-riggers, boiler hands, lift engineers, and signal printers keep sky islands connected without letting profit cut loose the people below. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Bioshock Infinite named place |
| 2 | Dishonored hero silhouette |
| 3 | Arcane logo geometry |
| 4 | Mortal Engines catchphrase |
| 5 | Final Fantasy airship signature costume |
| 6 | Steamboy proprietary creature |
| 7 | The Order 1886 map layout |
| 8 | League of Extraordinary Gentlemen faction title |
| 9 | Skies of Arcadia weapon profile |
| 10 | Sunless Skies UI chrome |
| 11 | Bioshock Infinite quest premise |
| 12 | Dishonored title typography |
| 13 | Arcane color-coded insignia |
| 14 | Mortal Engines music motif |
| 15 | Final Fantasy airship vehicle or mount profile |
| 16 | Steamboy companion anatomy |
| 17 | The Order 1886 named artifact |
| 18 | League of Extraordinary Gentlemen school or agency badge |
| 19 | Skies of Arcadia real sacred practice as minigame |
| 20 | Sunless Skies stereotyped cultural shorthand |
| 21 | Bioshock Infinite real-person likeness |
| 22 | Dishonored copied dialogue cadence |
| 23 | Arcane fan-server slogan |
| 24 | Mortal Engines paid power framing |
| 25 | Final Fantasy airship loot-box presentation |
| 26 | Steamboy named place |
| 27 | The Order 1886 hero silhouette |
| 28 | League of Extraordinary Gentlemen logo geometry |
| 29 | Skies of Arcadia catchphrase |
| 30 | Sunless Skies signature costume |
| 31 | Bioshock Infinite proprietary creature |
| 32 | Dishonored map layout |
| 33 | Arcane faction title |
| 34 | Mortal Engines weapon profile |
| 35 | Final Fantasy airship UI chrome |
| 36 | Steamboy quest premise |
| 37 | The Order 1886 title typography |
| 38 | League of Extraordinary Gentlemen color-coded insignia |
| 39 | Skies of Arcadia music motif |
| 40 | Sunless Skies vehicle or mount profile |
| 41 | Bioshock Infinite companion anatomy |
| 42 | Dishonored named artifact |
| 43 | Arcane school or agency badge |
| 44 | Mortal Engines real sacred practice as minigame |
| 45 | Final Fantasy airship stereotyped cultural shorthand |
| 46 | Steamboy real-person likeness |
| 47 | The Order 1886 copied dialogue cadence |
| 48 | League of Extraordinary Gentlemen fan-server slogan |
| 49 | Skies of Arcadia paid power framing |
| 50 | Sunless Skies loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `brasswake_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Brasswake • {{turn}} • committed |
| 2 | [Route] Brasswake • {{placeId}} • committed |
| 3 | [Work] Brasswake • {{lastAction}} • committed |
| 4 | [Talk] Brasswake • {{npcId}} • committed |
| 5 | [Kit] Brasswake • {{kitId}} • committed |
| 6 | [Pack] Brasswake • {{partySize}} • committed |
| 7 | [Rest] Brasswake • {{checkpoint}} • committed |
| 8 | [Safety] Brasswake • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brasswake_kit_01 | Mail-Rigger | waxed rope coat | retie storm-mail routes | Never cut a line that someone is still climbing. | Speak in clipped work orders softened by weather metaphors. | mail_rigger mantle; mail_rigger tool; brasswake_map_01 | brasswake_place_01; brasswake_q_01 | brasswake_ability_01 |
| brasswake_kit_02 | Boiler-Hand | heatproof sleeve apron | balance a hungry boiler | Never take heat before the pressure gauge is read. | Speak in clipped work orders softened by weather metaphors. | boiler_hand vest; boiler_hand tool; brasswake_map_02 | brasswake_place_02; brasswake_q_02 | brasswake_ability_02 |
| brasswake_kit_03 | Lift Engineer | brass-cornered harness | certify a public lift | Never stamp a lift clear for a bribe. | Speak in clipped work orders softened by weather metaphors. | lift_engineer jacket; lift_engineer tool; brasswake_map_03 | brasswake_place_01; brasswake_q_03 | brasswake_ability_03 |
| brasswake_kit_04 | Signal Printer | indigo ink smock | set safe semaphore sheets | Never print a false all-clear. | Speak in clipped work orders softened by weather metaphors. | signal_printer sash; signal_printer tool; brasswake_map_04 | brasswake_place_02; brasswake_q_04 | brasswake_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `brasswake_place_01` is a shared hub rather than a capital analogue; `brasswake_place_04` is the mid-join; `brasswake_place_06` is the instance door. `brasswake_place_07` and `brasswake_place_08` are sky-isle POIs with packet-skiff airship exits recorded in YAML.

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| brasswake_place_01 | Cinder Dock | shared hub | street | safe | yes | brasswake_place_02, brasswake_place_04 | A public notice at Cinder Dock has been posted with one crucial line washed away. |
| brasswake_place_02 | Aerial Brassway | start hub | street | safe | yes | brasswake_place_01, brasswake_place_03 | A work roster at Aerial Brassway leaves two neighbours believing they were promised the same task. |
| brasswake_place_03 | Orchard Mast | street route | street | safe | yes | brasswake_place_02, brasswake_place_04 | A route marker at Orchard Mast points visitors toward a closed gate and needs a safe correction. |
| brasswake_place_04 | Clockwind Exchange | mid join | street | low | yes | brasswake_place_03, brasswake_place_05, brasswake_place_01 | A newcomer at Clockwind Exchange needs a local introduction before a small obligation becomes embarrassing. |
| brasswake_place_05 | Rivet Court | work district | interior | low | no | brasswake_place_04, brasswake_place_06 | A shared tool at Rivet Court has been returned without its care tag. |
| brasswake_place_06 | The Soot Meridian | instance door | dungeon | medium | no | brasswake_place_05, brasswake_place_07 | The entry record at The Soot Meridian names an unfinished errand, not a monster or apocalypse. |
| brasswake_place_07 | Wicker Cloudstep | wild edge | street | medium | yes | brasswake_place_06, brasswake_place_08 | A weather change at Wicker Cloudstep threatens a community plan unless someone reads the signs. |
| brasswake_place_08 | Marmot Key | housing approach | interior | low | no | brasswake_place_07 | A resident at Marmot Key has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| brasswake_npc_01 | Jori Wren | brasswake_place_01 | quest | Jori Wren says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Jori Wren offers a specific task at Cinder Dock: settle the practical mismatch before it costs someone a shift. | Jori Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_02 | Alden Morrow | brasswake_place_02 | profession | Alden Morrow says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Alden Morrow offers a specific task at Aerial Brassway: settle the practical mismatch before it costs someone a shift. | Alden Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_03 | Bryn Rowan | brasswake_place_03 | hub | Bryn Rowan says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Bryn Rowan offers a specific task at Orchard Mast: settle the practical mismatch before it costs someone a shift. | Bryn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_04 | Cato Nook | brasswake_place_04 | merchant | Cato Nook says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Cato Nook offers a specific task at Clockwind Exchange: settle the practical mismatch before it costs someone a shift. | Cato Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_05 | Dessa Cress | brasswake_place_01 | local | Dessa Cress says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Dessa Cress offers a specific task at Cinder Dock: settle the practical mismatch before it costs someone a shift. | Dessa Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_06 | Eris Silt | brasswake_place_02 | host | Eris Silt says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Eris Silt offers a specific task at Aerial Brassway: settle the practical mismatch before it costs someone a shift. | Eris Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_07 | Fenn Pryce | brasswake_place_03 | quest | Fenn Pryce says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Fenn Pryce offers a specific task at Orchard Mast: settle the practical mismatch before it costs someone a shift. | Fenn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_08 | Gala Vane | brasswake_place_04 | profession | Gala Vane says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Gala Vane offers a specific task at Clockwind Exchange: settle the practical mismatch before it costs someone a shift. | Gala Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_09 | Holl Quill | brasswake_place_01 | local | Holl Quill says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Holl Quill offers a specific task at Cinder Dock: settle the practical mismatch before it costs someone a shift. | Holl Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| brasswake_npc_10 | Ivo Vale | brasswake_place_02 | merchant | Ivo Vale says, ‘Brasswake keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vale offers a specific task at Aerial Brassway: settle the practical mismatch before it costs someone a shift. | Ivo Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Clockwind Exchange, if that is useful. |
| 2 | Brasswake feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at The Soot Meridian. |
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
| Mail-Rigger | At Cinder Dock, you arrive in mail_rigger mantle carrying brasswake_map_01. A small obligation is already late. | Give up one turn to help now. | Brasswake: Name a Working Promise |
| Boiler-Hand | At Aerial Brassway, you arrive in boiler_hand vest carrying brasswake_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Brasswake: Set the First Tool Aside |
| Lift Engineer | At Cinder Dock, you arrive in lift_engineer jacket carrying brasswake_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Brasswake: Carry the Right Record |
| Signal Printer | At Aerial Brassway, you arrive in signal_printer sash carrying brasswake_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Brasswake: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_brasswake_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Cinder Dock’s small mismatch | ask | missing tag | A local need at Clockwind Exchange is connected but not catastrophic. | alternate talk |
| 2 | Resolve Aerial Brassway’s small mismatch | repair | closed path | A local need at Rivet Court is connected but not catastrophic. | new route |
| 3 | Resolve Orchard Mast’s small mismatch | carry | unclear note | A local need at The Soot Meridian is connected but not catastrophic. | recorded favor |
| 4 | Resolve Clockwind Exchange’s small mismatch | listen | late guest | A local need at Wicker Cloudstep is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Rivet Court’s small mismatch | map | wet weather | A local need at Marmot Key is connected but not catastrophic. | slower reward |
| 6 | Resolve The Soot Meridian’s small mismatch | prepare | busy shift | A local need at Cinder Dock is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Wicker Cloudstep’s small mismatch | wait | quiet boundary | A local need at Aerial Brassway is connected but not catastrophic. | solo option |
| 8 | Resolve Marmot Key’s small mismatch | return | wrong room | A local need at Orchard Mast is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Misfiled Elevator` and `Sky-Patch Supper`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| brasswake_q_01 | Brasswake: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| brasswake_q_02 | Brasswake: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| brasswake_q_03 | Brasswake: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| brasswake_q_04 | Brasswake: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| brasswake_q_05 | Brasswake: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| brasswake_q_06 | Brasswake: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| brasswake_q_07 | Brasswake: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| brasswake_q_08 | Brasswake: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| brasswake_q_09 | Brasswake: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| brasswake_q_10 | Brasswake: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| brasswake_q_11 | Brasswake: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| brasswake_q_12 | Brasswake: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| brasswake_q_13 | Brasswake: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| brasswake_q_14 | Brasswake: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| brasswake_q_15 | Brasswake: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| brasswake_q_16 | Brasswake: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| brasswake_q_17 | Brasswake: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| brasswake_q_18 | Brasswake: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| brasswake_q_19 | Brasswake: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| brasswake_q_20 | Brasswake: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| brasswake_q_21 | Brasswake: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| brasswake_q_22 | Brasswake: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| brasswake_q_23 | Brasswake: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| brasswake_q_24 | Brasswake: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| brasswake_q_25 | Brasswake: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Cinder Dock`: write `brasswake_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Clockwind Exchange`: write `brasswake_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `brasswake_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| brasswake_species_01 | Soot Martin | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_02 | Coil Crab | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_03 | Brass Moth | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_04 | Tug Beetle | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_05 | Copper Vole | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_06 | Wind Gull | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_07 | Furnace Newt | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_08 | Mossy Ram | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_09 | Rail Lizard | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_10 | Pocket Owl | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_11 | Spark Trout | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_12 | Haze Hare | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_13 | Cable Spider | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_14 | Tinfin | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_15 | Orchard Bat | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| brasswake_species_16 | Cloud Carp | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Cinder Crowns**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Cloud Ribbons**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Cinder Dock token, Aerial Brassway tool, Orchard Mast thread, Clockwind Exchange seal, Rivet Court bundle, The Soot Meridian token. |
| Instance and cosmetic templates | Wicker Cloudstep tool, Marmot Key thread, Cinder Dock seal, Aerial Brassway bundle, Orchard Mast token, Clockwind Exchange tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `brasswake_vendor_01` at `brasswake_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| brasswake_dungeon_room_01 | The Misfiled Elevator: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: brasswake_species_01, brasswake_species_02; elite: none |   |
| brasswake_dungeon_room_02 | The Misfiled Elevator: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: brasswake_species_03, brasswake_species_04; elite: none |   |
| brasswake_dungeon_room_03 | The Misfiled Elevator: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: brasswake_species_05, brasswake_species_06; elite: brasswake_species_09 |   |
| brasswake_dungeon_room_04 | The Misfiled Elevator: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: brasswake_species_07, brasswake_species_08; elite: none | checkpoint  |
| brasswake_dungeon_room_05 | The Misfiled Elevator: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: brasswake_species_09, brasswake_species_10; elite: none |  boss: brasswake_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`brasswake_trap_01`), jammed latch (`brasswake_trap_02`), wet threshold (`brasswake_trap_03`), false shelf (`brasswake_trap_04`), quiet bell (`brasswake_trap_05`), sealed drawer (`brasswake_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Sky-Patch Supper** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| brasswake_talent_01 | Brasswake Local Ear | 1 | none | brasswake_effect_01 |
| brasswake_talent_02 | Brasswake Careful Hand | 2 | none | brasswake_effect_02 |
| brasswake_talent_03 | Brasswake Route Sense | 3 | none | brasswake_effect_03 |
| brasswake_talent_04 | Brasswake Shared Measure | 4 | none | brasswake_effect_04 |
| brasswake_talent_05 | Brasswake Quiet Craft | 1 | brasswake_talent_04 | brasswake_effect_05 |
| brasswake_talent_06 | Brasswake Open Invitation | 2 | none | brasswake_effect_06 |
| brasswake_talent_07 | Brasswake Safe Return | 3 | none | brasswake_effect_07 |
| brasswake_talent_08 | Brasswake Field Note | 4 | none | brasswake_effect_08 |
| brasswake_talent_09 | Brasswake Steady Pace | 1 | brasswake_talent_08 | brasswake_effect_09 |
| brasswake_talent_10 | Brasswake Clear Signal | 2 | none | brasswake_effect_10 |
| brasswake_talent_11 | Brasswake Warm Welcome | 3 | none | brasswake_effect_11 |
| brasswake_talent_12 | Brasswake Small Courage | 4 | none | brasswake_effect_12 |
| brasswake_talent_13 | Brasswake Repair Habit | 1 | brasswake_talent_12 | brasswake_effect_13 |
| brasswake_talent_14 | Brasswake Trust Mark | 2 | none | brasswake_effect_14 |
| brasswake_talent_15 | Brasswake Second Look | 3 | none | brasswake_effect_15 |
| brasswake_talent_16 | Brasswake Closing Grace | 4 | none | brasswake_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| brasswake_contract_01 | Brasswake Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| brasswake_contract_02 | Brasswake Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| brasswake_contract_03 | Brasswake Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| brasswake_contract_04 | Brasswake Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| brasswake_contract_05 | Brasswake Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| brasswake_contract_06 | Brasswake Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| brasswake_contract_07 | Brasswake Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| brasswake_contract_08 | Brasswake Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| brasswake_interact_01 | Cinder Dock bench | rest | brasswake_place_01 |
| brasswake_interact_02 | Aerial Brassway cabinet | repair | brasswake_place_02 |
| brasswake_interact_03 | Orchard Mast rack | tend | brasswake_place_03 |
| brasswake_interact_04 | Clockwind Exchange kettle | craft | brasswake_place_04 |
| brasswake_interact_05 | Rivet Court ledger | cook | brasswake_place_05 |
| brasswake_interact_06 | The Soot Meridian rail | bind_inn | brasswake_place_06 |
| brasswake_interact_07 | Wicker Cloudstep bell | inspect | brasswake_place_07 |
| brasswake_interact_08 | Marmot Key board | open | brasswake_place_08 |
| brasswake_interact_09 | Cinder Dock table | carry | brasswake_place_01 |
| brasswake_interact_10 | Aerial Brassway lamp | clean | brasswake_place_02 |
| brasswake_interact_11 | Orchard Mast gate | signal | brasswake_place_03 |
| brasswake_interact_12 | Clockwind Exchange shelf | record | brasswake_place_04 |


**Default interior graph.** `brasswake_interior_01` enters from `brasswake_place_08` and contains 7 connected rooms: Brasswake Entry, Brasswake Main Room, Brasswake Work Nook, Brasswake Window Room, Brasswake Quiet Room, Brasswake Storage, Brasswake Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | cinder, aerial, orchard, clockwind materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Brasswake` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Speak in clipped work orders softened by weather metaphors. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Brasswake: distant work, a room tone, a gentle rhythm that belongs to Cinder Dock, and a second layer that makes the route toward The Soot Meridian feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Brasswake Ledger |
| 2 | Brasswake Route |
| 3 | Brasswake Work |
| 4 | Brasswake Talk |
| 5 | Brasswake Kit |
| 6 | Brasswake Pack |
| 7 | Brasswake Rest |
| 8 | Brasswake Safety |
| 9 | Brasswake Map |
| 10 | Brasswake Notice |
| 11 | Brasswake Favour |
| 12 | Brasswake Gold |
| 13 | Brasswake Token |
| 14 | Brasswake Record |
| 15 | Brasswake Instance |
| 16 | Brasswake Checkpoint |
| 17 | Brasswake Choice |
| 18 | Brasswake Help |
| 19 | Brasswake Calendar |
| 20 | Brasswake Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Cinder Dock, a small promise has your name on it. |
| 2 | At Aerial Brassway, a small promise has your name on it. |
| 3 | At Orchard Mast, a small promise has your name on it. |
| 4 | At Clockwind Exchange, a small promise has your name on it. |
| 5 | At Rivet Court, a small promise has your name on it. |
| 6 | At The Soot Meridian, a small promise has your name on it. |
| 7 | At Wicker Cloudstep, a small promise has your name on it. |
| 8 | At Marmot Key, a small promise has your name on it. |
| 9 | At Cinder Dock, a small promise has your name on it. |
| 10 | At Aerial Brassway, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is clockwork airship and rail adventure. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
