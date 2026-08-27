# WOF Threshold Rooms: Full Start-Depth Pack

> **Release truth.** Threshold Rooms is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `threshold_rooms` |
| Display name | **Threshold Rooms** |
| One-line pitch | Consentful liminal navigation and grounded scares. |
| Maturity | **teen+** |
| rulesModuleId | `liminal_steadfast` |
| Theme Kit | **Threshold Rooms Theme Kit**, included with world entitlement |
| Genre pattern and fence | Consentful liminal navigation and grounded scares. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Threshold Rooms is a WOF text world about consentful liminal navigation and grounded scares. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Backrooms named place |
| 2 | SCP Foundation hero silhouette |
| 3 | Control game logo geometry |
| 4 | Silent Hill catchphrase |
| 5 | P.T. signature costume |
| 6 | Five Nights at Freddy’s proprietary creature |
| 7 | The Stanley Parable map layout |
| 8 | Liminal Spaces trademark faction title |
| 9 | House of Leaves weapon profile |
| 10 | Stranger Things UI chrome |
| 11 | Backrooms quest premise |
| 12 | SCP Foundation title typography |
| 13 | Control game color-coded insignia |
| 14 | Silent Hill music motif |
| 15 | P.T. vehicle or mount profile |
| 16 | Five Nights at Freddy’s companion anatomy |
| 17 | The Stanley Parable named artifact |
| 18 | Liminal Spaces trademark school or agency badge |
| 19 | House of Leaves real sacred practice as minigame |
| 20 | Stranger Things stereotyped cultural shorthand |
| 21 | Backrooms real-person likeness |
| 22 | SCP Foundation copied dialogue cadence |
| 23 | Control game fan-server slogan |
| 24 | Silent Hill paid power framing |
| 25 | P.T. loot-box presentation |
| 26 | Five Nights at Freddy’s named place |
| 27 | The Stanley Parable hero silhouette |
| 28 | Liminal Spaces trademark logo geometry |
| 29 | House of Leaves catchphrase |
| 30 | Stranger Things signature costume |
| 31 | Backrooms proprietary creature |
| 32 | SCP Foundation map layout |
| 33 | Control game faction title |
| 34 | Silent Hill weapon profile |
| 35 | P.T. UI chrome |
| 36 | Five Nights at Freddy’s quest premise |
| 37 | The Stanley Parable title typography |
| 38 | Liminal Spaces trademark color-coded insignia |
| 39 | House of Leaves music motif |
| 40 | Stranger Things vehicle or mount profile |
| 41 | Backrooms companion anatomy |
| 42 | SCP Foundation named artifact |
| 43 | Control game school or agency badge |
| 44 | Silent Hill real sacred practice as minigame |
| 45 | P.T. stereotyped cultural shorthand |
| 46 | Five Nights at Freddy’s real-person likeness |
| 47 | The Stanley Parable copied dialogue cadence |
| 48 | Liminal Spaces trademark fan-server slogan |
| 49 | House of Leaves paid power framing |
| 50 | Stranger Things loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | steadfast, orientation, clue, roomShift, comfort, exitMarks, battery, anchor |
| Wipe and checkpoint | Wipe returns the party to `threshold_rooms_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Threshold Rooms • {{turn}} • committed |
| 2 | [Route] Threshold Rooms • {{placeId}} • committed |
| 3 | [Work] Threshold Rooms • {{lastAction}} • committed |
| 4 | [Talk] Threshold Rooms • {{npcId}} • committed |
| 5 | [Kit] Threshold Rooms • {{kitId}} • committed |
| 6 | [Pack] Threshold Rooms • {{partySize}} • committed |
| 7 | [Rest] Threshold Rooms • {{checkpoint}} • committed |
| 8 | [Safety] Threshold Rooms • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| threshold_rooms_kit_01 | Anchor Monitor | anchor monitor workwear | practice anchor monitor | Never use anchor monitor authority to remove another person’s choice. | Use the local rhythm of Threshold Rooms and make every offer concrete. | anchor_monitor mantle; anchor_monitor tool; threshold_rooms_map_01 | threshold_rooms_place_01; threshold_rooms_q_01 | threshold_rooms_ability_01 |
| threshold_rooms_kit_02 | Map Foldkeeper | map foldkeeper workwear | practice map foldkeeper | Never use map foldkeeper authority to remove another person’s choice. | Use the local rhythm of Threshold Rooms and make every offer concrete. | map_foldkeeper vest; map_foldkeeper tool; threshold_rooms_map_02 | threshold_rooms_place_02; threshold_rooms_q_02 | threshold_rooms_ability_02 |
| threshold_rooms_kit_03 | Comfort Attendant | comfort attendant workwear | practice comfort attendant | Never use comfort attendant authority to remove another person’s choice. | Use the local rhythm of Threshold Rooms and make every offer concrete. | comfort_attendant jacket; comfort_attendant tool; threshold_rooms_map_03 | threshold_rooms_place_01; threshold_rooms_q_03 | threshold_rooms_ability_03 |
| threshold_rooms_kit_04 | Exit Registrar | exit registrar workwear | practice exit registrar | Never use exit registrar authority to remove another person’s choice. | Use the local rhythm of Threshold Rooms and make every offer concrete. | exit_registrar sash; exit_registrar tool; threshold_rooms_map_04 | threshold_rooms_place_02; threshold_rooms_q_04 | threshold_rooms_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `threshold_rooms_place_01` is a shared hub rather than a capital analogue; `threshold_rooms_place_04` is the mid-join; `threshold_rooms_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| threshold_rooms_place_01 | Welcome Desk | shared hub | street | safe | yes | threshold_rooms_place_02, threshold_rooms_place_04 | A public notice at Welcome Desk has been posted with one crucial line washed away. |
| threshold_rooms_place_02 | Carpet Hall | start hub | street | safe | yes | threshold_rooms_place_01, threshold_rooms_place_03 | A work roster at Carpet Hall leaves two neighbours believing they were promised the same task. |
| threshold_rooms_place_03 | Blue Stair | street route | street | safe | yes | threshold_rooms_place_02, threshold_rooms_place_04 | A route marker at Blue Stair points visitors toward a closed gate and needs a safe correction. |
| threshold_rooms_place_04 | Exit Light | mid join | street | low | yes | threshold_rooms_place_03, threshold_rooms_place_05, threshold_rooms_place_01 | A newcomer at Exit Light needs a local introduction before a small obligation becomes embarrassing. |
| threshold_rooms_place_05 | Vending Niche | work district | interior | low | no | threshold_rooms_place_04, threshold_rooms_place_06 | A shared tool at Vending Niche has been returned without its care tag. |
| threshold_rooms_place_06 | Mauve Lift | instance door | dungeon | medium | no | threshold_rooms_place_05, threshold_rooms_place_07 | The entry record at Mauve Lift names an unfinished errand, not a monster or apocalypse. |
| threshold_rooms_place_07 | Service Corridor | wild edge | street | medium | yes | threshold_rooms_place_06, threshold_rooms_place_08 | A weather change at Service Corridor threatens a community plan unless someone reads the signs. |
| threshold_rooms_place_08 | Quiet Atrium | housing approach | interior | low | no | threshold_rooms_place_07 | A resident at Quiet Atrium has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| threshold_rooms_npc_01 | Fenn Rowan | threshold_rooms_place_01 | quest | Fenn Rowan says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Welcome Desk: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_02 | Gala Nook | threshold_rooms_place_02 | profession | Gala Nook says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Carpet Hall: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_03 | Holl Cress | threshold_rooms_place_03 | hub | Holl Cress says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Blue Stair: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_04 | Ivo Silt | threshold_rooms_place_04 | merchant | Ivo Silt says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Exit Light: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_05 | Jori Pryce | threshold_rooms_place_01 | local | Jori Pryce says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Welcome Desk: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_06 | Alden Vane | threshold_rooms_place_02 | host | Alden Vane says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Carpet Hall: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_07 | Bryn Quill | threshold_rooms_place_03 | quest | Bryn Quill says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Blue Stair: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_08 | Cato Vale | threshold_rooms_place_04 | profession | Cato Vale says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Exit Light: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_09 | Dessa Wren | threshold_rooms_place_01 | local | Dessa Wren says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Welcome Desk: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| threshold_rooms_npc_10 | Eris Morrow | threshold_rooms_place_02 | merchant | Eris Morrow says, ‘Threshold Rooms keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Carpet Hall: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Exit Light, if that is useful. |
| 2 | Threshold Rooms feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Mauve Lift. |
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
| Anchor Monitor | At Welcome Desk, you arrive in anchor_monitor mantle carrying threshold_rooms_map_01. A small obligation is already late. | Give up one turn to help now. | Threshold Rooms: Name a Working Promise |
| Map Foldkeeper | At Carpet Hall, you arrive in map_foldkeeper vest carrying threshold_rooms_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Threshold Rooms: Set the First Tool Aside |
| Comfort Attendant | At Welcome Desk, you arrive in comfort_attendant jacket carrying threshold_rooms_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Threshold Rooms: Carry the Right Record |
| Exit Registrar | At Carpet Hall, you arrive in exit_registrar sash carrying threshold_rooms_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Threshold Rooms: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_threshold_rooms_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Welcome Desk’s small mismatch | ask | missing tag | A local need at Exit Light is connected but not catastrophic. | alternate talk |
| 2 | Resolve Carpet Hall’s small mismatch | repair | closed path | A local need at Vending Niche is connected but not catastrophic. | new route |
| 3 | Resolve Blue Stair’s small mismatch | carry | unclear note | A local need at Mauve Lift is connected but not catastrophic. | recorded favor |
| 4 | Resolve Exit Light’s small mismatch | listen | late guest | A local need at Service Corridor is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Vending Niche’s small mismatch | map | wet weather | A local need at Quiet Atrium is connected but not catastrophic. | slower reward |
| 6 | Resolve Mauve Lift’s small mismatch | prepare | busy shift | A local need at Welcome Desk is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Service Corridor’s small mismatch | wait | quiet boundary | A local need at Carpet Hall is connected but not catastrophic. | solo option |
| 8 | Resolve Quiet Atrium’s small mismatch | return | wrong room | A local need at Blue Stair is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Wrong-Floor Return` and `Quiet Atrium Lights-Out`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| threshold_rooms_q_01 | Threshold Rooms: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| threshold_rooms_q_02 | Threshold Rooms: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| threshold_rooms_q_03 | Threshold Rooms: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| threshold_rooms_q_04 | Threshold Rooms: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| threshold_rooms_q_05 | Threshold Rooms: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| threshold_rooms_q_06 | Threshold Rooms: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| threshold_rooms_q_07 | Threshold Rooms: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| threshold_rooms_q_08 | Threshold Rooms: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| threshold_rooms_q_09 | Threshold Rooms: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| threshold_rooms_q_10 | Threshold Rooms: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| threshold_rooms_q_11 | Threshold Rooms: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| threshold_rooms_q_12 | Threshold Rooms: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| threshold_rooms_q_13 | Threshold Rooms: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| threshold_rooms_q_14 | Threshold Rooms: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| threshold_rooms_q_15 | Threshold Rooms: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| threshold_rooms_q_16 | Threshold Rooms: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| threshold_rooms_q_17 | Threshold Rooms: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| threshold_rooms_q_18 | Threshold Rooms: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| threshold_rooms_q_19 | Threshold Rooms: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| threshold_rooms_q_20 | Threshold Rooms: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| threshold_rooms_q_21 | Threshold Rooms: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| threshold_rooms_q_22 | Threshold Rooms: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| threshold_rooms_q_23 | Threshold Rooms: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| threshold_rooms_q_24 | Threshold Rooms: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| threshold_rooms_q_25 | Threshold Rooms: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Welcome Desk`: write `threshold_rooms_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Exit Light`: write `threshold_rooms_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `threshold_rooms_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| threshold_rooms_species_01 | Paper Moth | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_02 | Lost Hound | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_03 | Clock Beetle | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_04 | Hush Crow | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_05 | Threshold Rooms Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_06 | Threshold Rooms Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_07 | Threshold Rooms Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_08 | Threshold Rooms Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_09 | Threshold Rooms Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_10 | Threshold Rooms Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_11 | Threshold Rooms Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_12 | Threshold Rooms Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_13 | Threshold Rooms Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_14 | Threshold Rooms Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_15 | Threshold Rooms Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_16 | Threshold Rooms Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_17 | Threshold Rooms Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| threshold_rooms_species_18 | Threshold Rooms Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Exit Stamps**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Comfort Threads**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Welcome Desk token, Carpet Hall tool, Blue Stair thread, Exit Light seal, Vending Niche bundle, Mauve Lift token. |
| Instance and cosmetic templates | Service Corridor tool, Quiet Atrium thread, Welcome Desk seal, Carpet Hall bundle, Blue Stair token, Exit Light tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `threshold_rooms_vendor_01` at `threshold_rooms_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| threshold_rooms_dungeon_room_01 | The Wrong-Floor Return: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: threshold_rooms_species_01, threshold_rooms_species_02; elite: none |   |
| threshold_rooms_dungeon_room_02 | The Wrong-Floor Return: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: threshold_rooms_species_03, threshold_rooms_species_04; elite: none |   |
| threshold_rooms_dungeon_room_03 | The Wrong-Floor Return: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: threshold_rooms_species_05, threshold_rooms_species_06; elite: threshold_rooms_species_09 |   |
| threshold_rooms_dungeon_room_04 | The Wrong-Floor Return: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: threshold_rooms_species_07, threshold_rooms_species_08; elite: none | checkpoint  |
| threshold_rooms_dungeon_room_05 | The Wrong-Floor Return: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: threshold_rooms_species_09, threshold_rooms_species_10; elite: none |  boss: threshold_rooms_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`threshold_rooms_trap_01`), jammed latch (`threshold_rooms_trap_02`), wet threshold (`threshold_rooms_trap_03`), false shelf (`threshold_rooms_trap_04`), quiet bell (`threshold_rooms_trap_05`), sealed drawer (`threshold_rooms_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Quiet Atrium Lights-Out** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| threshold_rooms_talent_01 | Threshold Rooms Local Ear | 1 | none | threshold_rooms_effect_01 |
| threshold_rooms_talent_02 | Threshold Rooms Careful Hand | 2 | none | threshold_rooms_effect_02 |
| threshold_rooms_talent_03 | Threshold Rooms Route Sense | 3 | none | threshold_rooms_effect_03 |
| threshold_rooms_talent_04 | Threshold Rooms Shared Measure | 4 | none | threshold_rooms_effect_04 |
| threshold_rooms_talent_05 | Threshold Rooms Quiet Craft | 1 | threshold_rooms_talent_04 | threshold_rooms_effect_05 |
| threshold_rooms_talent_06 | Threshold Rooms Open Invitation | 2 | none | threshold_rooms_effect_06 |
| threshold_rooms_talent_07 | Threshold Rooms Safe Return | 3 | none | threshold_rooms_effect_07 |
| threshold_rooms_talent_08 | Threshold Rooms Field Note | 4 | none | threshold_rooms_effect_08 |
| threshold_rooms_talent_09 | Threshold Rooms Steady Pace | 1 | threshold_rooms_talent_08 | threshold_rooms_effect_09 |
| threshold_rooms_talent_10 | Threshold Rooms Clear Signal | 2 | none | threshold_rooms_effect_10 |
| threshold_rooms_talent_11 | Threshold Rooms Warm Welcome | 3 | none | threshold_rooms_effect_11 |
| threshold_rooms_talent_12 | Threshold Rooms Small Courage | 4 | none | threshold_rooms_effect_12 |
| threshold_rooms_talent_13 | Threshold Rooms Repair Habit | 1 | threshold_rooms_talent_12 | threshold_rooms_effect_13 |
| threshold_rooms_talent_14 | Threshold Rooms Trust Mark | 2 | none | threshold_rooms_effect_14 |
| threshold_rooms_talent_15 | Threshold Rooms Second Look | 3 | none | threshold_rooms_effect_15 |
| threshold_rooms_talent_16 | Threshold Rooms Closing Grace | 4 | none | threshold_rooms_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| threshold_rooms_contract_01 | Threshold Rooms Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_02 | Threshold Rooms Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_03 | Threshold Rooms Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_04 | Threshold Rooms Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_05 | Threshold Rooms Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_06 | Threshold Rooms Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_07 | Threshold Rooms Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| threshold_rooms_contract_08 | Threshold Rooms Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| threshold_rooms_interact_01 | Welcome Desk bench | rest | threshold_rooms_place_01 |
| threshold_rooms_interact_02 | Carpet Hall cabinet | repair | threshold_rooms_place_02 |
| threshold_rooms_interact_03 | Blue Stair rack | tend | threshold_rooms_place_03 |
| threshold_rooms_interact_04 | Exit Light kettle | craft | threshold_rooms_place_04 |
| threshold_rooms_interact_05 | Vending Niche ledger | cook | threshold_rooms_place_05 |
| threshold_rooms_interact_06 | Mauve Lift rail | bind_inn | threshold_rooms_place_06 |
| threshold_rooms_interact_07 | Service Corridor bell | inspect | threshold_rooms_place_07 |
| threshold_rooms_interact_08 | Quiet Atrium board | open | threshold_rooms_place_08 |
| threshold_rooms_interact_09 | Welcome Desk table | carry | threshold_rooms_place_01 |
| threshold_rooms_interact_10 | Carpet Hall lamp | clean | threshold_rooms_place_02 |
| threshold_rooms_interact_11 | Blue Stair gate | signal | threshold_rooms_place_03 |
| threshold_rooms_interact_12 | Exit Light shelf | record | threshold_rooms_place_04 |


**Default interior graph.** `threshold_rooms_interior_01` enters from `threshold_rooms_place_08` and contains 7 connected rooms: Threshold Rooms Entry, Threshold Rooms Main Room, Threshold Rooms Work Nook, Threshold Rooms Window Room, Threshold Rooms Quiet Room, Threshold Rooms Storage, Threshold Rooms Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | welcome, carpet, blue, exit materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Threshold Rooms` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Threshold Rooms and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Threshold Rooms: distant work, a room tone, a gentle rhythm that belongs to Welcome Desk, and a second layer that makes the route toward Mauve Lift feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Threshold Rooms Ledger |
| 2 | Threshold Rooms Route |
| 3 | Threshold Rooms Work |
| 4 | Threshold Rooms Talk |
| 5 | Threshold Rooms Kit |
| 6 | Threshold Rooms Pack |
| 7 | Threshold Rooms Rest |
| 8 | Threshold Rooms Safety |
| 9 | Threshold Rooms Map |
| 10 | Threshold Rooms Notice |
| 11 | Threshold Rooms Favour |
| 12 | Threshold Rooms Gold |
| 13 | Threshold Rooms Token |
| 14 | Threshold Rooms Record |
| 15 | Threshold Rooms Instance |
| 16 | Threshold Rooms Checkpoint |
| 17 | Threshold Rooms Choice |
| 18 | Threshold Rooms Help |
| 19 | Threshold Rooms Calendar |
| 20 | Threshold Rooms Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Welcome Desk, a small promise has your name on it. |
| 2 | At Carpet Hall, a small promise has your name on it. |
| 3 | At Blue Stair, a small promise has your name on it. |
| 4 | At Exit Light, a small promise has your name on it. |
| 5 | At Vending Niche, a small promise has your name on it. |
| 6 | At Mauve Lift, a small promise has your name on it. |
| 7 | At Service Corridor, a small promise has your name on it. |
| 8 | At Quiet Atrium, a small promise has your name on it. |
| 9 | At Welcome Desk, a small promise has your name on it. |
| 10 | At Carpet Hall, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is consentful liminal navigation and grounded scares. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
