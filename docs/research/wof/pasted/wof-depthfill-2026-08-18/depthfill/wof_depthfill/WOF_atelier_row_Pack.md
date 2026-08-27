# WOF Atelier Row: Full Start-Depth Pack

> **Release truth.** Atelier Row is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `atelier_row` |
| Display name | **Atelier Row** |
| One-line pitch | Fashion studio and kind critique runway. |
| Maturity | **all-ages** |
| rulesModuleId | `atelier_score` |
| Theme Kit | **Atelier Row Theme Kit**, included with world entitlement |
| Genre pattern and fence | Fashion studio and kind critique runway. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Atelier Row is a WOF text world about fashion studio and kind critique runway. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Project Runway named place |
| 2 | Barbie hero silhouette |
| 3 | Devil Wears Prada logo geometry |
| 4 | Fashion Dreamer catchphrase |
| 5 | Bratz signature costume |
| 6 | Winx Club proprietary creature |
| 7 | Vogue logo map layout |
| 8 | Gucci logo faction title |
| 9 | Chanel logo weapon profile |
| 10 | Sims fashion UI chrome |
| 11 | Project Runway quest premise |
| 12 | Barbie title typography |
| 13 | Devil Wears Prada color-coded insignia |
| 14 | Fashion Dreamer music motif |
| 15 | Bratz vehicle or mount profile |
| 16 | Winx Club companion anatomy |
| 17 | Vogue logo named artifact |
| 18 | Gucci logo school or agency badge |
| 19 | Chanel logo real sacred practice as minigame |
| 20 | Sims fashion stereotyped cultural shorthand |
| 21 | Project Runway real-person likeness |
| 22 | Barbie copied dialogue cadence |
| 23 | Devil Wears Prada fan-server slogan |
| 24 | Fashion Dreamer paid power framing |
| 25 | Bratz loot-box presentation |
| 26 | Winx Club named place |
| 27 | Vogue logo hero silhouette |
| 28 | Gucci logo logo geometry |
| 29 | Chanel logo catchphrase |
| 30 | Sims fashion signature costume |
| 31 | Project Runway proprietary creature |
| 32 | Barbie map layout |
| 33 | Devil Wears Prada faction title |
| 34 | Fashion Dreamer weapon profile |
| 35 | Bratz UI chrome |
| 36 | Winx Club quest premise |
| 37 | Vogue logo title typography |
| 38 | Gucci logo color-coded insignia |
| 39 | Chanel logo music motif |
| 40 | Sims fashion vehicle or mount profile |
| 41 | Project Runway companion anatomy |
| 42 | Barbie named artifact |
| 43 | Devil Wears Prada school or agency badge |
| 44 | Fashion Dreamer real sacred practice as minigame |
| 45 | Bratz stereotyped cultural shorthand |
| 46 | Winx Club real-person likeness |
| 47 | Vogue logo copied dialogue cadence |
| 48 | Gucci logo fan-server slogan |
| 49 | Chanel logo paid power framing |
| 50 | Sims fashion loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | energy, briefFit, silhouette, material, craft, audience, lookbook, reputation |
| Wipe and checkpoint | Wipe returns the party to `atelier_row_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Atelier Row • {{turn}} • committed |
| 2 | [Route] Atelier Row • {{placeId}} • committed |
| 3 | [Work] Atelier Row • {{lastAction}} • committed |
| 4 | [Talk] Atelier Row • {{npcId}} • committed |
| 5 | [Kit] Atelier Row • {{kitId}} • committed |
| 6 | [Pack] Atelier Row • {{partySize}} • committed |
| 7 | [Rest] Atelier Row • {{checkpoint}} • committed |
| 8 | [Safety] Atelier Row • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| atelier_row_kit_01 | Silhouette Cutter | silhouette cutter workwear | practice silhouette cutter | Never use silhouette cutter authority to remove another person’s choice. | Use the local rhythm of Atelier Row and make every offer concrete. | silhouette_cutter mantle; silhouette_cutter tool; atelier_row_map_01 | atelier_row_place_01; atelier_row_q_01 | atelier_row_ability_01 |
| atelier_row_kit_02 | Dye Librarian | dye librarian workwear | practice dye librarian | Never use dye librarian authority to remove another person’s choice. | Use the local rhythm of Atelier Row and make every offer concrete. | dye_librarian vest; dye_librarian tool; atelier_row_map_02 | atelier_row_place_02; atelier_row_q_02 | atelier_row_ability_02 |
| atelier_row_kit_03 | Hem Judge | hem judge workwear | practice hem judge | Never use hem judge authority to remove another person’s choice. | Use the local rhythm of Atelier Row and make every offer concrete. | hem_judge jacket; hem_judge tool; atelier_row_map_03 | atelier_row_place_01; atelier_row_q_03 | atelier_row_ability_03 |
| atelier_row_kit_04 | Lookbook Curator | lookbook curator workwear | practice lookbook curator | Never use lookbook curator authority to remove another person’s choice. | Use the local rhythm of Atelier Row and make every offer concrete. | lookbook_curator sash; lookbook_curator tool; atelier_row_map_04 | atelier_row_place_02; atelier_row_q_04 | atelier_row_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `atelier_row_place_01` is a shared hub rather than a capital analogue; `atelier_row_place_04` is the mid-join; `atelier_row_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| atelier_row_place_01 | Thread Square | shared hub | street | safe | yes | atelier_row_place_02, atelier_row_place_04 | A public notice at Thread Square has been posted with one crucial line washed away. |
| atelier_row_place_02 | Drape Hall | start hub | street | safe | yes | atelier_row_place_01, atelier_row_place_03 | A work roster at Drape Hall leaves two neighbours believing they were promised the same task. |
| atelier_row_place_03 | Color Yard | street route | street | safe | yes | atelier_row_place_02, atelier_row_place_04 | A route marker at Color Yard points visitors toward a closed gate and needs a safe correction. |
| atelier_row_place_04 | Runway Roof | mid join | street | low | yes | atelier_row_place_03, atelier_row_place_05, atelier_row_place_01 | A newcomer at Runway Roof needs a local introduction before a small obligation becomes embarrassing. |
| atelier_row_place_05 | Button Arcade | work district | interior | low | no | atelier_row_place_04, atelier_row_place_06 | A shared tool at Button Arcade has been returned without its care tag. |
| atelier_row_place_06 | Hem Garden | instance door | dungeon | medium | no | atelier_row_place_05, atelier_row_place_07 | The entry record at Hem Garden names an unfinished errand, not a monster or apocalypse. |
| atelier_row_place_07 | Pattern Vault | wild edge | street | medium | yes | atelier_row_place_06, atelier_row_place_08 | A weather change at Pattern Vault threatens a community plan unless someone reads the signs. |
| atelier_row_place_08 | Lightwell Loft | housing approach | interior | low | no | atelier_row_place_07 | A resident at Lightwell Loft has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| atelier_row_npc_01 | Bryn Cress | atelier_row_place_01 | quest | Bryn Cress says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Bryn Cress offers a specific task at Thread Square: settle the practical mismatch before it costs someone a shift. | Bryn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_02 | Cato Silt | atelier_row_place_02 | profession | Cato Silt says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Cato Silt offers a specific task at Drape Hall: settle the practical mismatch before it costs someone a shift. | Cato Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_03 | Dessa Pryce | atelier_row_place_03 | hub | Dessa Pryce says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Dessa Pryce offers a specific task at Color Yard: settle the practical mismatch before it costs someone a shift. | Dessa Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_04 | Eris Vane | atelier_row_place_04 | merchant | Eris Vane says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Eris Vane offers a specific task at Runway Roof: settle the practical mismatch before it costs someone a shift. | Eris Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_05 | Fenn Quill | atelier_row_place_01 | local | Fenn Quill says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Fenn Quill offers a specific task at Thread Square: settle the practical mismatch before it costs someone a shift. | Fenn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_06 | Gala Vale | atelier_row_place_02 | host | Gala Vale says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Gala Vale offers a specific task at Drape Hall: settle the practical mismatch before it costs someone a shift. | Gala Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_07 | Holl Wren | atelier_row_place_03 | quest | Holl Wren says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Holl Wren offers a specific task at Color Yard: settle the practical mismatch before it costs someone a shift. | Holl Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_08 | Ivo Morrow | atelier_row_place_04 | profession | Ivo Morrow says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Ivo Morrow offers a specific task at Runway Roof: settle the practical mismatch before it costs someone a shift. | Ivo Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_09 | Jori Rowan | atelier_row_place_01 | local | Jori Rowan says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Jori Rowan offers a specific task at Thread Square: settle the practical mismatch before it costs someone a shift. | Jori Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| atelier_row_npc_10 | Alden Nook | atelier_row_place_02 | merchant | Alden Nook says, ‘Atelier Row keeps its promises in small places. Tell me which one you noticed.’ | Alden Nook offers a specific task at Drape Hall: settle the practical mismatch before it costs someone a shift. | Alden Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Runway Roof, if that is useful. |
| 2 | Atelier Row feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Hem Garden. |
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
| Silhouette Cutter | At Thread Square, you arrive in silhouette_cutter mantle carrying atelier_row_map_01. A small obligation is already late. | Give up one turn to help now. | Atelier Row: Name a Working Promise |
| Dye Librarian | At Drape Hall, you arrive in dye_librarian vest carrying atelier_row_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Atelier Row: Set the First Tool Aside |
| Hem Judge | At Thread Square, you arrive in hem_judge jacket carrying atelier_row_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Atelier Row: Carry the Right Record |
| Lookbook Curator | At Drape Hall, you arrive in lookbook_curator sash carrying atelier_row_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Atelier Row: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_atelier_row_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Thread Square’s small mismatch | ask | missing tag | A local need at Runway Roof is connected but not catastrophic. | alternate talk |
| 2 | Resolve Drape Hall’s small mismatch | repair | closed path | A local need at Button Arcade is connected but not catastrophic. | new route |
| 3 | Resolve Color Yard’s small mismatch | carry | unclear note | A local need at Hem Garden is connected but not catastrophic. | recorded favor |
| 4 | Resolve Runway Roof’s small mismatch | listen | late guest | A local need at Pattern Vault is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Button Arcade’s small mismatch | map | wet weather | A local need at Lightwell Loft is connected but not catastrophic. | slower reward |
| 6 | Resolve Hem Garden’s small mismatch | prepare | busy shift | A local need at Thread Square is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Pattern Vault’s small mismatch | wait | quiet boundary | A local need at Drape Hall is connected but not catastrophic. | solo option |
| 8 | Resolve Lightwell Loft’s small mismatch | return | wrong room | A local need at Color Yard is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Pattern Vault Reveal` and `Runway Roof Night Edit`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| atelier_row_q_01 | Atelier Row: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| atelier_row_q_02 | Atelier Row: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| atelier_row_q_03 | Atelier Row: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| atelier_row_q_04 | Atelier Row: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| atelier_row_q_05 | Atelier Row: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| atelier_row_q_06 | Atelier Row: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| atelier_row_q_07 | Atelier Row: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| atelier_row_q_08 | Atelier Row: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| atelier_row_q_09 | Atelier Row: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| atelier_row_q_10 | Atelier Row: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| atelier_row_q_11 | Atelier Row: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| atelier_row_q_12 | Atelier Row: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| atelier_row_q_13 | Atelier Row: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| atelier_row_q_14 | Atelier Row: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| atelier_row_q_15 | Atelier Row: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| atelier_row_q_16 | Atelier Row: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| atelier_row_q_17 | Atelier Row: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| atelier_row_q_18 | Atelier Row: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| atelier_row_q_19 | Atelier Row: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| atelier_row_q_20 | Atelier Row: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| atelier_row_q_21 | Atelier Row: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| atelier_row_q_22 | Atelier Row: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| atelier_row_q_23 | Atelier Row: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| atelier_row_q_24 | Atelier Row: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| atelier_row_q_25 | Atelier Row: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Thread Square`: write `atelier_row_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Runway Roof`: write `atelier_row_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `atelier_row_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| atelier_row_species_01 | Silk Moth | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_02 | Button Quail | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_03 | Ribbon Cat | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_04 | Dye Koi | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_05 | Atelier Row Field Type 5 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_06 | Atelier Row Field Type 6 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_07 | Atelier Row Field Type 7 | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_08 | Atelier Row Field Type 8 | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_09 | Atelier Row Field Type 9 | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_10 | Atelier Row Field Type 10 | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_11 | Atelier Row Field Type 11 | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_12 | Atelier Row Field Type 12 | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_13 | Atelier Row Field Type 13 | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_14 | Atelier Row Field Type 14 | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_15 | Atelier Row Field Type 15 | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_16 | Atelier Row Field Type 16 | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_17 | Atelier Row Field Type 17 | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| atelier_row_species_18 | Atelier Row Field Type 18 | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Thread Notes**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Drape Flowers**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Thread Square token, Drape Hall tool, Color Yard thread, Runway Roof seal, Button Arcade bundle, Hem Garden token. |
| Instance and cosmetic templates | Pattern Vault tool, Lightwell Loft thread, Thread Square seal, Drape Hall bundle, Color Yard token, Runway Roof tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `atelier_row_vendor_01` at `atelier_row_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| atelier_row_dungeon_room_01 | The Pattern Vault Reveal: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: atelier_row_species_01, atelier_row_species_02; elite: none |   |
| atelier_row_dungeon_room_02 | The Pattern Vault Reveal: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: atelier_row_species_03, atelier_row_species_04; elite: none |   |
| atelier_row_dungeon_room_03 | The Pattern Vault Reveal: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: atelier_row_species_05, atelier_row_species_06; elite: atelier_row_species_09 |   |
| atelier_row_dungeon_room_04 | The Pattern Vault Reveal: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: atelier_row_species_07, atelier_row_species_08; elite: none | checkpoint  |
| atelier_row_dungeon_room_05 | The Pattern Vault Reveal: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: atelier_row_species_09, atelier_row_species_10; elite: none |  boss: atelier_row_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`atelier_row_trap_01`), jammed latch (`atelier_row_trap_02`), wet threshold (`atelier_row_trap_03`), false shelf (`atelier_row_trap_04`), quiet bell (`atelier_row_trap_05`), sealed drawer (`atelier_row_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Runway Roof Night Edit** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| atelier_row_talent_01 | Atelier Row Local Ear | 1 | none | atelier_row_effect_01 |
| atelier_row_talent_02 | Atelier Row Careful Hand | 2 | none | atelier_row_effect_02 |
| atelier_row_talent_03 | Atelier Row Route Sense | 3 | none | atelier_row_effect_03 |
| atelier_row_talent_04 | Atelier Row Shared Measure | 4 | none | atelier_row_effect_04 |
| atelier_row_talent_05 | Atelier Row Quiet Craft | 1 | atelier_row_talent_04 | atelier_row_effect_05 |
| atelier_row_talent_06 | Atelier Row Open Invitation | 2 | none | atelier_row_effect_06 |
| atelier_row_talent_07 | Atelier Row Safe Return | 3 | none | atelier_row_effect_07 |
| atelier_row_talent_08 | Atelier Row Field Note | 4 | none | atelier_row_effect_08 |
| atelier_row_talent_09 | Atelier Row Steady Pace | 1 | atelier_row_talent_08 | atelier_row_effect_09 |
| atelier_row_talent_10 | Atelier Row Clear Signal | 2 | none | atelier_row_effect_10 |
| atelier_row_talent_11 | Atelier Row Warm Welcome | 3 | none | atelier_row_effect_11 |
| atelier_row_talent_12 | Atelier Row Small Courage | 4 | none | atelier_row_effect_12 |
| atelier_row_talent_13 | Atelier Row Repair Habit | 1 | atelier_row_talent_12 | atelier_row_effect_13 |
| atelier_row_talent_14 | Atelier Row Trust Mark | 2 | none | atelier_row_effect_14 |
| atelier_row_talent_15 | Atelier Row Second Look | 3 | none | atelier_row_effect_15 |
| atelier_row_talent_16 | Atelier Row Closing Grace | 4 | none | atelier_row_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| atelier_row_contract_01 | Atelier Row Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| atelier_row_contract_02 | Atelier Row Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| atelier_row_contract_03 | Atelier Row Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| atelier_row_contract_04 | Atelier Row Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| atelier_row_contract_05 | Atelier Row Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| atelier_row_contract_06 | Atelier Row Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| atelier_row_contract_07 | Atelier Row Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| atelier_row_contract_08 | Atelier Row Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| atelier_row_interact_01 | Thread Square bench | rest | atelier_row_place_01 |
| atelier_row_interact_02 | Drape Hall cabinet | repair | atelier_row_place_02 |
| atelier_row_interact_03 | Color Yard rack | tend | atelier_row_place_03 |
| atelier_row_interact_04 | Runway Roof kettle | craft | atelier_row_place_04 |
| atelier_row_interact_05 | Button Arcade ledger | cook | atelier_row_place_05 |
| atelier_row_interact_06 | Hem Garden rail | bind_inn | atelier_row_place_06 |
| atelier_row_interact_07 | Pattern Vault bell | inspect | atelier_row_place_07 |
| atelier_row_interact_08 | Lightwell Loft board | open | atelier_row_place_08 |
| atelier_row_interact_09 | Thread Square table | carry | atelier_row_place_01 |
| atelier_row_interact_10 | Drape Hall lamp | clean | atelier_row_place_02 |
| atelier_row_interact_11 | Color Yard gate | signal | atelier_row_place_03 |
| atelier_row_interact_12 | Runway Roof shelf | record | atelier_row_place_04 |


**Default interior graph.** `atelier_row_interior_01` enters from `atelier_row_place_08` and contains 7 connected rooms: Atelier Row Entry, Atelier Row Main Room, Atelier Row Work Nook, Atelier Row Window Room, Atelier Row Quiet Room, Atelier Row Storage, Atelier Row Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | thread, drape, color, runway materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Atelier Row` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Atelier Row and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Atelier Row: distant work, a room tone, a gentle rhythm that belongs to Thread Square, and a second layer that makes the route toward Hem Garden feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Atelier Row Ledger |
| 2 | Atelier Row Route |
| 3 | Atelier Row Work |
| 4 | Atelier Row Talk |
| 5 | Atelier Row Kit |
| 6 | Atelier Row Pack |
| 7 | Atelier Row Rest |
| 8 | Atelier Row Safety |
| 9 | Atelier Row Map |
| 10 | Atelier Row Notice |
| 11 | Atelier Row Favour |
| 12 | Atelier Row Gold |
| 13 | Atelier Row Token |
| 14 | Atelier Row Record |
| 15 | Atelier Row Instance |
| 16 | Atelier Row Checkpoint |
| 17 | Atelier Row Choice |
| 18 | Atelier Row Help |
| 19 | Atelier Row Calendar |
| 20 | Atelier Row Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Thread Square, a small promise has your name on it. |
| 2 | At Drape Hall, a small promise has your name on it. |
| 3 | At Color Yard, a small promise has your name on it. |
| 4 | At Runway Roof, a small promise has your name on it. |
| 5 | At Button Arcade, a small promise has your name on it. |
| 6 | At Hem Garden, a small promise has your name on it. |
| 7 | At Pattern Vault, a small promise has your name on it. |
| 8 | At Lightwell Loft, a small promise has your name on it. |
| 9 | At Thread Square, a small promise has your name on it. |
| 10 | At Drape Hall, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is fashion studio and kind critique runway. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
