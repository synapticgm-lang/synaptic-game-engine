# WOF Third Cup: Full Start-Depth Pack

> **Release truth.** Third Cup is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `third_cup` |
| Display name | **Third Cup** |
| One-line pitch | Café service, regulars, and gentle hospitality. |
| Maturity | **all-ages** |
| rulesModuleId | `hospitality_tick` |
| Theme Kit | **Third Cup Theme Kit**, included with world entitlement |
| Genre pattern and fence | Café service, regulars, and gentle hospitality. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Third Cup is a WOF text world about café service, regulars, and gentle hospitality. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Starbucks named place |
| 2 | Central Perk hero silhouette |
| 3 | Luke’s Diner logo geometry |
| 4 | Cafe Nervosa catchphrase |
| 5 | Animal Crossing Brewster signature costume |
| 6 | Palia café proprietary creature |
| 7 | Coffee Talk map layout |
| 8 | Persona Leblanc faction title |
| 9 | Friends set weapon profile |
| 10 | Dunkin UI chrome |
| 11 | Starbucks quest premise |
| 12 | Central Perk title typography |
| 13 | Luke’s Diner color-coded insignia |
| 14 | Cafe Nervosa music motif |
| 15 | Animal Crossing Brewster vehicle or mount profile |
| 16 | Palia café companion anatomy |
| 17 | Coffee Talk named artifact |
| 18 | Persona Leblanc school or agency badge |
| 19 | Friends set real sacred practice as minigame |
| 20 | Dunkin stereotyped cultural shorthand |
| 21 | Starbucks real-person likeness |
| 22 | Central Perk copied dialogue cadence |
| 23 | Luke’s Diner fan-server slogan |
| 24 | Cafe Nervosa paid power framing |
| 25 | Animal Crossing Brewster loot-box presentation |
| 26 | Palia café named place |
| 27 | Coffee Talk hero silhouette |
| 28 | Persona Leblanc logo geometry |
| 29 | Friends set catchphrase |
| 30 | Dunkin signature costume |
| 31 | Starbucks proprietary creature |
| 32 | Central Perk map layout |
| 33 | Luke’s Diner faction title |
| 34 | Cafe Nervosa weapon profile |
| 35 | Animal Crossing Brewster UI chrome |
| 36 | Palia café quest premise |
| 37 | Coffee Talk title typography |
| 38 | Persona Leblanc color-coded insignia |
| 39 | Friends set music motif |
| 40 | Dunkin vehicle or mount profile |
| 41 | Starbucks companion anatomy |
| 42 | Central Perk named artifact |
| 43 | Luke’s Diner school or agency badge |
| 44 | Cafe Nervosa real sacred practice as minigame |
| 45 | Animal Crossing Brewster stereotyped cultural shorthand |
| 46 | Palia café real-person likeness |
| 47 | Coffee Talk copied dialogue cadence |
| 48 | Persona Leblanc fan-server slogan |
| 49 | Friends set paid power framing |
| 50 | Dunkin loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | energy, hospitality, stock, recipeNotes, guestMood, shiftTick, regulars, cleanliness |
| Wipe and checkpoint | Wipe returns the party to `third_cup_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Third Cup • {{turn}} • committed |
| 2 | [Route] Third Cup • {{placeId}} • committed |
| 3 | [Work] Third Cup • {{lastAction}} • committed |
| 4 | [Talk] Third Cup • {{npcId}} • committed |
| 5 | [Kit] Third Cup • {{kitId}} • committed |
| 6 | [Pack] Third Cup • {{partySize}} • committed |
| 7 | [Rest] Third Cup • {{checkpoint}} • committed |
| 8 | [Safety] Third Cup • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| third_cup_kit_01 | Steep Keeper | steep keeper workwear | practice steep keeper | Never use steep keeper authority to remove another person’s choice. | Use the local rhythm of Third Cup and make every offer concrete. | steep_keeper mantle; steep_keeper tool; third_cup_map_01 | third_cup_place_01; third_cup_q_01 | third_cup_ability_01 |
| third_cup_kit_02 | Table Host | table host workwear | practice table host | Never use table host authority to remove another person’s choice. | Use the local rhythm of Third Cup and make every offer concrete. | table_host vest; table_host tool; third_cup_map_02 | third_cup_place_02; third_cup_q_02 | third_cup_ability_02 |
| third_cup_kit_03 | Pastry Binder | pastry binder workwear | practice pastry binder | Never use pastry binder authority to remove another person’s choice. | Use the local rhythm of Third Cup and make every offer concrete. | pastry_binder jacket; pastry_binder tool; third_cup_map_03 | third_cup_place_01; third_cup_q_03 | third_cup_ability_03 |
| third_cup_kit_04 | Window Greeter | window greeter workwear | practice window greeter | Never use window greeter authority to remove another person’s choice. | Use the local rhythm of Third Cup and make every offer concrete. | window_greeter sash; window_greeter tool; third_cup_map_04 | third_cup_place_02; third_cup_q_04 | third_cup_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `third_cup_place_01` is a shared hub rather than a capital analogue; `third_cup_place_04` is the mid-join; `third_cup_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| third_cup_place_01 | Third Cup | shared hub | street | safe | yes | third_cup_place_02, third_cup_place_04 | A public notice at Third Cup has been posted with one crucial line washed away. |
| third_cup_place_02 | Market Steps | start hub | street | safe | yes | third_cup_place_01, third_cup_place_03 | A work roster at Market Steps leaves two neighbours believing they were promised the same task. |
| third_cup_place_03 | Brew Lane | street route | street | safe | yes | third_cup_place_02, third_cup_place_04 | A route marker at Brew Lane points visitors toward a closed gate and needs a safe correction. |
| third_cup_place_04 | Window Garden | mid join | street | low | yes | third_cup_place_03, third_cup_place_05, third_cup_place_01 | A newcomer at Window Garden needs a local introduction before a small obligation becomes embarrassing. |
| third_cup_place_05 | Pastry Arch | work district | interior | low | no | third_cup_place_04, third_cup_place_06 | A shared tool at Pastry Arch has been returned without its care tag. |
| third_cup_place_06 | Quiet Booth | instance door | dungeon | medium | no | third_cup_place_05, third_cup_place_07 | The entry record at Quiet Booth names an unfinished errand, not a monster or apocalypse. |
| third_cup_place_07 | Steam Court | wild edge | street | medium | yes | third_cup_place_06, third_cup_place_08 | A weather change at Steam Court threatens a community plan unless someone reads the signs. |
| third_cup_place_08 | Cinnamon Walk | housing approach | interior | low | no | third_cup_place_07 | A resident at Cinnamon Walk has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| third_cup_npc_01 | Jori Wren | third_cup_place_01 | quest | Jori Wren says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Jori Wren offers a specific task at Third Cup: settle the practical mismatch before it costs someone a shift. | Jori Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_02 | Alden Morrow | third_cup_place_02 | profession | Alden Morrow says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Alden Morrow offers a specific task at Market Steps: settle the practical mismatch before it costs someone a shift. | Alden Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_03 | Bryn Rowan | third_cup_place_03 | hub | Bryn Rowan says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Bryn Rowan offers a specific task at Brew Lane: settle the practical mismatch before it costs someone a shift. | Bryn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_04 | Cato Nook | third_cup_place_04 | merchant | Cato Nook says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Cato Nook offers a specific task at Window Garden: settle the practical mismatch before it costs someone a shift. | Cato Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_05 | Dessa Cress | third_cup_place_01 | local | Dessa Cress says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Dessa Cress offers a specific task at Third Cup: settle the practical mismatch before it costs someone a shift. | Dessa Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_06 | Eris Silt | third_cup_place_02 | host | Eris Silt says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Eris Silt offers a specific task at Market Steps: settle the practical mismatch before it costs someone a shift. | Eris Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_07 | Fenn Pryce | third_cup_place_03 | quest | Fenn Pryce says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Fenn Pryce offers a specific task at Brew Lane: settle the practical mismatch before it costs someone a shift. | Fenn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_08 | Gala Vane | third_cup_place_04 | profession | Gala Vane says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Gala Vane offers a specific task at Window Garden: settle the practical mismatch before it costs someone a shift. | Gala Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_09 | Holl Quill | third_cup_place_01 | local | Holl Quill says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Holl Quill offers a specific task at Third Cup: settle the practical mismatch before it costs someone a shift. | Holl Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| third_cup_npc_10 | Ivo Vale | third_cup_place_02 | merchant | Ivo Vale says, ‘Third Cup keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vale offers a specific task at Market Steps: settle the practical mismatch before it costs someone a shift. | Ivo Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Window Garden, if that is useful. |
| 2 | Third Cup feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Quiet Booth. |
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
| Steep Keeper | At Third Cup, you arrive in steep_keeper mantle carrying third_cup_map_01. A small obligation is already late. | Give up one turn to help now. | Third Cup: Name a Working Promise |
| Table Host | At Market Steps, you arrive in table_host vest carrying third_cup_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Third Cup: Set the First Tool Aside |
| Pastry Binder | At Third Cup, you arrive in pastry_binder jacket carrying third_cup_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Third Cup: Carry the Right Record |
| Window Greeter | At Market Steps, you arrive in window_greeter sash carrying third_cup_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Third Cup: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_third_cup_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Third Cup’s small mismatch | ask | missing tag | A local need at Window Garden is connected but not catastrophic. | alternate talk |
| 2 | Resolve Market Steps’s small mismatch | repair | closed path | A local need at Pastry Arch is connected but not catastrophic. | new route |
| 3 | Resolve Brew Lane’s small mismatch | carry | unclear note | A local need at Quiet Booth is connected but not catastrophic. | recorded favor |
| 4 | Resolve Window Garden’s small mismatch | listen | late guest | A local need at Steam Court is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Pastry Arch’s small mismatch | map | wet weather | A local need at Cinnamon Walk is connected but not catastrophic. | slower reward |
| 6 | Resolve Quiet Booth’s small mismatch | prepare | busy shift | A local need at Third Cup is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Steam Court’s small mismatch | wait | quiet boundary | A local need at Market Steps is connected but not catastrophic. | solo option |
| 8 | Resolve Cinnamon Walk’s small mismatch | return | wrong room | A local need at Brew Lane is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Last Table Service` and `Steam Court Evening Rush`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| third_cup_q_01 | Third Cup: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| third_cup_q_02 | Third Cup: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| third_cup_q_03 | Third Cup: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| third_cup_q_04 | Third Cup: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| third_cup_q_05 | Third Cup: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| third_cup_q_06 | Third Cup: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| third_cup_q_07 | Third Cup: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| third_cup_q_08 | Third Cup: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| third_cup_q_09 | Third Cup: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| third_cup_q_10 | Third Cup: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| third_cup_q_11 | Third Cup: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| third_cup_q_12 | Third Cup: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| third_cup_q_13 | Third Cup: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| third_cup_q_14 | Third Cup: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| third_cup_q_15 | Third Cup: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| third_cup_q_16 | Third Cup: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| third_cup_q_17 | Third Cup: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| third_cup_q_18 | Third Cup: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| third_cup_q_19 | Third Cup: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| third_cup_q_20 | Third Cup: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| third_cup_q_21 | Third Cup: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| third_cup_q_22 | Third Cup: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| third_cup_q_23 | Third Cup: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| third_cup_q_24 | Third Cup: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| third_cup_q_25 | Third Cup: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Third Cup`: write `third_cup_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Window Garden`: write `third_cup_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `third_cup_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| third_cup_species_01 | Sugar Sparrow | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_02 | Biscuit Dog | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_03 | Tea Snail | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_04 | Cocoa Bat | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_05 | Third Cup Field Type 5 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_06 | Third Cup Field Type 6 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_07 | Third Cup Field Type 7 | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_08 | Third Cup Field Type 8 | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_09 | Third Cup Field Type 9 | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_10 | Third Cup Field Type 10 | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_11 | Third Cup Field Type 11 | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_12 | Third Cup Field Type 12 | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_13 | Third Cup Field Type 13 | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_14 | Third Cup Field Type 14 | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_15 | Third Cup Field Type 15 | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_16 | Third Cup Field Type 16 | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_17 | Third Cup Field Type 17 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| third_cup_species_18 | Third Cup Field Type 18 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Cup Coins**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Saucer Stars**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Third Cup token, Market Steps tool, Brew Lane thread, Window Garden seal, Pastry Arch bundle, Quiet Booth token. |
| Instance and cosmetic templates | Steam Court tool, Cinnamon Walk thread, Third Cup seal, Market Steps bundle, Brew Lane token, Window Garden tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `third_cup_vendor_01` at `third_cup_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| third_cup_dungeon_room_01 | The Last Table Service: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: third_cup_species_01, third_cup_species_02; elite: none |   |
| third_cup_dungeon_room_02 | The Last Table Service: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: third_cup_species_03, third_cup_species_04; elite: none |   |
| third_cup_dungeon_room_03 | The Last Table Service: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: third_cup_species_05, third_cup_species_06; elite: third_cup_species_09 |   |
| third_cup_dungeon_room_04 | The Last Table Service: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: third_cup_species_07, third_cup_species_08; elite: none | checkpoint  |
| third_cup_dungeon_room_05 | The Last Table Service: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: third_cup_species_09, third_cup_species_10; elite: none |  boss: third_cup_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`third_cup_trap_01`), jammed latch (`third_cup_trap_02`), wet threshold (`third_cup_trap_03`), false shelf (`third_cup_trap_04`), quiet bell (`third_cup_trap_05`), sealed drawer (`third_cup_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Steam Court Evening Rush** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| third_cup_talent_01 | Third Cup Local Ear | 1 | none | third_cup_effect_01 |
| third_cup_talent_02 | Third Cup Careful Hand | 2 | none | third_cup_effect_02 |
| third_cup_talent_03 | Third Cup Route Sense | 3 | none | third_cup_effect_03 |
| third_cup_talent_04 | Third Cup Shared Measure | 4 | none | third_cup_effect_04 |
| third_cup_talent_05 | Third Cup Quiet Craft | 1 | third_cup_talent_04 | third_cup_effect_05 |
| third_cup_talent_06 | Third Cup Open Invitation | 2 | none | third_cup_effect_06 |
| third_cup_talent_07 | Third Cup Safe Return | 3 | none | third_cup_effect_07 |
| third_cup_talent_08 | Third Cup Field Note | 4 | none | third_cup_effect_08 |
| third_cup_talent_09 | Third Cup Steady Pace | 1 | third_cup_talent_08 | third_cup_effect_09 |
| third_cup_talent_10 | Third Cup Clear Signal | 2 | none | third_cup_effect_10 |
| third_cup_talent_11 | Third Cup Warm Welcome | 3 | none | third_cup_effect_11 |
| third_cup_talent_12 | Third Cup Small Courage | 4 | none | third_cup_effect_12 |
| third_cup_talent_13 | Third Cup Repair Habit | 1 | third_cup_talent_12 | third_cup_effect_13 |
| third_cup_talent_14 | Third Cup Trust Mark | 2 | none | third_cup_effect_14 |
| third_cup_talent_15 | Third Cup Second Look | 3 | none | third_cup_effect_15 |
| third_cup_talent_16 | Third Cup Closing Grace | 4 | none | third_cup_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| third_cup_contract_01 | Third Cup Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| third_cup_contract_02 | Third Cup Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| third_cup_contract_03 | Third Cup Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| third_cup_contract_04 | Third Cup Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| third_cup_contract_05 | Third Cup Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| third_cup_contract_06 | Third Cup Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| third_cup_contract_07 | Third Cup Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| third_cup_contract_08 | Third Cup Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| third_cup_interact_01 | Third Cup bench | rest | third_cup_place_01 |
| third_cup_interact_02 | Market Steps cabinet | repair | third_cup_place_02 |
| third_cup_interact_03 | Brew Lane rack | tend | third_cup_place_03 |
| third_cup_interact_04 | Window Garden kettle | craft | third_cup_place_04 |
| third_cup_interact_05 | Pastry Arch ledger | cook | third_cup_place_05 |
| third_cup_interact_06 | Quiet Booth rail | bind_inn | third_cup_place_06 |
| third_cup_interact_07 | Steam Court bell | inspect | third_cup_place_07 |
| third_cup_interact_08 | Cinnamon Walk board | open | third_cup_place_08 |
| third_cup_interact_09 | Third Cup table | carry | third_cup_place_01 |
| third_cup_interact_10 | Market Steps lamp | clean | third_cup_place_02 |
| third_cup_interact_11 | Brew Lane gate | signal | third_cup_place_03 |
| third_cup_interact_12 | Window Garden shelf | record | third_cup_place_04 |


**Default interior graph.** `third_cup_interior_01` enters from `third_cup_place_08` and contains 7 connected rooms: Third Cup Entry, Third Cup Main Room, Third Cup Work Nook, Third Cup Window Room, Third Cup Quiet Room, Third Cup Storage, Third Cup Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | third, market, brew, window materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Third Cup` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Third Cup and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Third Cup: distant work, a room tone, a gentle rhythm that belongs to Third Cup, and a second layer that makes the route toward Quiet Booth feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Third Cup Ledger |
| 2 | Third Cup Route |
| 3 | Third Cup Work |
| 4 | Third Cup Talk |
| 5 | Third Cup Kit |
| 6 | Third Cup Pack |
| 7 | Third Cup Rest |
| 8 | Third Cup Safety |
| 9 | Third Cup Map |
| 10 | Third Cup Notice |
| 11 | Third Cup Favour |
| 12 | Third Cup Gold |
| 13 | Third Cup Token |
| 14 | Third Cup Record |
| 15 | Third Cup Instance |
| 16 | Third Cup Checkpoint |
| 17 | Third Cup Choice |
| 18 | Third Cup Help |
| 19 | Third Cup Calendar |
| 20 | Third Cup Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Third Cup, a small promise has your name on it. |
| 2 | At Market Steps, a small promise has your name on it. |
| 3 | At Brew Lane, a small promise has your name on it. |
| 4 | At Window Garden, a small promise has your name on it. |
| 5 | At Pastry Arch, a small promise has your name on it. |
| 6 | At Quiet Booth, a small promise has your name on it. |
| 7 | At Steam Court, a small promise has your name on it. |
| 8 | At Cinnamon Walk, a small promise has your name on it. |
| 9 | At Third Cup, a small promise has your name on it. |
| 10 | At Market Steps, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is café service, regulars, and gentle hospitality. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
