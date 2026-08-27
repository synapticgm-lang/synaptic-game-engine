# WOF Ink Banner: Full Start-Depth Pack

> **Release truth.** Ink Banner is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `ink_banner` |
| Display name | **Ink Banner** |
| One-line pitch | Banner houses settle duty through dispatches, formal bouts, and public witness while the cost of a family emblem is measured in service rather than bloodline destiny. |
| Maturity | **teen** |
| rulesModuleId | `hp_check` |
| Theme Kit | **Ink Banner Theme Kit**, included with world entitlement |
| Genre pattern and fence | Feudal duty and ceremonial duels. It is not a licensed ninja village, a historical Japanese reconstruction, or a samurai brand imitation. |

Ink Banner is a WOF text world about banner houses settle duty through dispatches, formal bouts, and public witness while the cost of a family emblem is measured in service rather than bloodline destiny. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Naruto named place |
| 2 | Bleach hero silhouette |
| 3 | Demon Slayer logo geometry |
| 4 | Samurai Champloo catchphrase |
| 5 | Ghost of Tsushima signature costume |
| 6 | Sekiro proprietary creature |
| 7 | Avatar Fire Nation map layout |
| 8 | Shogun historical likeness faction title |
| 9 | Ninja Gaiden weapon profile |
| 10 | Hokage UI chrome |
| 11 | Naruto quest premise |
| 12 | Bleach title typography |
| 13 | Demon Slayer color-coded insignia |
| 14 | Samurai Champloo music motif |
| 15 | Ghost of Tsushima vehicle or mount profile |
| 16 | Sekiro companion anatomy |
| 17 | Avatar Fire Nation named artifact |
| 18 | Shogun historical likeness school or agency badge |
| 19 | Ninja Gaiden real sacred practice as minigame |
| 20 | Hokage stereotyped cultural shorthand |
| 21 | Naruto real-person likeness |
| 22 | Bleach copied dialogue cadence |
| 23 | Demon Slayer fan-server slogan |
| 24 | Samurai Champloo paid power framing |
| 25 | Ghost of Tsushima loot-box presentation |
| 26 | Sekiro named place |
| 27 | Avatar Fire Nation hero silhouette |
| 28 | Shogun historical likeness logo geometry |
| 29 | Ninja Gaiden catchphrase |
| 30 | Hokage signature costume |
| 31 | Naruto proprietary creature |
| 32 | Bleach map layout |
| 33 | Demon Slayer faction title |
| 34 | Samurai Champloo weapon profile |
| 35 | Ghost of Tsushima UI chrome |
| 36 | Sekiro quest premise |
| 37 | Avatar Fire Nation title typography |
| 38 | Shogun historical likeness color-coded insignia |
| 39 | Ninja Gaiden music motif |
| 40 | Hokage vehicle or mount profile |
| 41 | Naruto companion anatomy |
| 42 | Bleach named artifact |
| 43 | Demon Slayer school or agency badge |
| 44 | Samurai Champloo real sacred practice as minigame |
| 45 | Ghost of Tsushima stereotyped cultural shorthand |
| 46 | Sekiro real-person likeness |
| 47 | Avatar Fire Nation copied dialogue cadence |
| 48 | Shogun historical likeness fan-server slogan |
| 49 | Ninja Gaiden paid power framing |
| 50 | Hokage loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | Reference only: shared HP, guard, gold, lockout, checkpoint and party contract. |
| Wipe and checkpoint | Wipe returns the party to `ink_banner_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Ink Banner • {{turn}} • committed |
| 2 | [Route] Ink Banner • {{placeId}} • committed |
| 3 | [Work] Ink Banner • {{lastAction}} • committed |
| 4 | [Talk] Ink Banner • {{npcId}} • committed |
| 5 | [Kit] Ink Banner • {{kitId}} • committed |
| 6 | [Pack] Ink Banner • {{partySize}} • committed |
| 7 | [Rest] Ink Banner • {{checkpoint}} • committed |
| 8 | [Safety] Ink Banner • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ink_banner_kit_01 | Seal Runner | vermillion seal cloak | carry sealed dispatches | Never break a seal in private. | Speak with precise courtesy and name the duty before the desire. | seal_runner mantle; seal_runner tool; ink_banner_map_01 | ink_banner_place_01; ink_banner_q_01 | ink_banner_ability_01 |
| ink_banner_kit_02 | Reed Magistrate | reed-gray court robe | read civil provisions | Never cite a law you cannot name. | Speak with precise courtesy and name the duty before the desire. | reed_magistrate vest; reed_magistrate tool; ink_banner_map_02 | ink_banner_place_02; ink_banner_q_02 | ink_banner_ability_02 |
| ink_banner_kit_03 | Kite Quartermaster | kite-blue supply jacket | ration banner stores | Never withhold rations to win a bow. | Speak with precise courtesy and name the duty before the desire. | kite_quartermaster jacket; kite_quartermaster tool; ink_banner_map_03 | ink_banner_place_01; ink_banner_q_03 | ink_banner_ability_03 |
| ink_banner_kit_04 | Cedar Duellist | cedar-brown duel coat | judge ceremonial footing | Never draw steel before the bell phrase. | Speak with precise courtesy and name the duty before the desire. | cedar_duellist sash; cedar_duellist tool; ink_banner_map_04 | ink_banner_place_02; ink_banner_q_04 | ink_banner_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `ink_banner_place_01` is a shared hub rather than a capital analogue; `ink_banner_place_04` is the mid-join; `ink_banner_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ink_banner_place_01 | Banner Gate | shared hub | street | safe | yes | ink_banner_place_02, ink_banner_place_04 | A public notice at Banner Gate has been posted with one crucial line washed away. |
| ink_banner_place_02 | Reed Court | start hub | street | safe | yes | ink_banner_place_01, ink_banner_place_03 | A work roster at Reed Court leaves two neighbours believing they were promised the same task. |
| ink_banner_place_03 | Kite Barracks | street route | street | safe | yes | ink_banner_place_02, ink_banner_place_04 | A route marker at Kite Barracks points visitors toward a closed gate and needs a safe correction. |
| ink_banner_place_04 | Red Seal Road | mid join | street | low | yes | ink_banner_place_03, ink_banner_place_05, ink_banner_place_01 | A newcomer at Red Seal Road needs a local introduction before a small obligation becomes embarrassing. |
| ink_banner_place_05 | Cedar Watch | work district | interior | low | no | ink_banner_place_04, ink_banner_place_06 | A shared tool at Cedar Watch has been returned without its care tag. |
| ink_banner_place_06 | The Quiet Standard | instance door | dungeon | medium | no | ink_banner_place_05, ink_banner_place_07 | The entry record at The Quiet Standard names an unfinished errand, not a monster or apocalypse. |
| ink_banner_place_07 | Lacquer Bridge | wild edge | street | medium | yes | ink_banner_place_06, ink_banner_place_08 | A weather change at Lacquer Bridge threatens a community plan unless someone reads the signs. |
| ink_banner_place_08 | Willow Muster | housing approach | interior | low | no | ink_banner_place_07 | A resident at Willow Muster has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| ink_banner_npc_01 | Alden Vane | ink_banner_place_01 | quest | Alden Vane says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Banner Gate: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_02 | Bryn Quill | ink_banner_place_02 | profession | Bryn Quill says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Reed Court: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_03 | Cato Vale | ink_banner_place_03 | hub | Cato Vale says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Kite Barracks: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_04 | Dessa Wren | ink_banner_place_04 | merchant | Dessa Wren says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Red Seal Road: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_05 | Eris Morrow | ink_banner_place_01 | local | Eris Morrow says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Banner Gate: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_06 | Fenn Rowan | ink_banner_place_02 | host | Fenn Rowan says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Reed Court: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_07 | Gala Nook | ink_banner_place_03 | quest | Gala Nook says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Kite Barracks: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_08 | Holl Cress | ink_banner_place_04 | profession | Holl Cress says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Red Seal Road: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_09 | Ivo Silt | ink_banner_place_01 | local | Ivo Silt says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Banner Gate: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| ink_banner_npc_10 | Jori Pryce | ink_banner_place_02 | merchant | Jori Pryce says, ‘Ink Banner keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Reed Court: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Red Seal Road, if that is useful. |
| 2 | Ink Banner feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at The Quiet Standard. |
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
| Seal Runner | At Banner Gate, you arrive in seal_runner mantle carrying ink_banner_map_01. A small obligation is already late. | Give up one turn to help now. | Ink Banner: Name a Working Promise |
| Reed Magistrate | At Reed Court, you arrive in reed_magistrate vest carrying ink_banner_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Ink Banner: Set the First Tool Aside |
| Kite Quartermaster | At Banner Gate, you arrive in kite_quartermaster jacket carrying ink_banner_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Ink Banner: Carry the Right Record |
| Cedar Duellist | At Reed Court, you arrive in cedar_duellist sash carrying ink_banner_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Ink Banner: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_ink_banner_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Banner Gate’s small mismatch | ask | missing tag | A local need at Red Seal Road is connected but not catastrophic. | alternate talk |
| 2 | Resolve Reed Court’s small mismatch | repair | closed path | A local need at Cedar Watch is connected but not catastrophic. | new route |
| 3 | Resolve Kite Barracks’s small mismatch | carry | unclear note | A local need at The Quiet Standard is connected but not catastrophic. | recorded favor |
| 4 | Resolve Red Seal Road’s small mismatch | listen | late guest | A local need at Lacquer Bridge is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Cedar Watch’s small mismatch | map | wet weather | A local need at Willow Muster is connected but not catastrophic. | slower reward |
| 6 | Resolve The Quiet Standard’s small mismatch | prepare | busy shift | A local need at Banner Gate is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Lacquer Bridge’s small mismatch | wait | quiet boundary | A local need at Reed Court is connected but not catastrophic. | solo option |
| 8 | Resolve Willow Muster’s small mismatch | return | wrong room | A local need at Kite Barracks is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Quiet Standard Vault` and `The Reed Court Muster`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| ink_banner_q_01 | Ink Banner: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| ink_banner_q_02 | Ink Banner: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| ink_banner_q_03 | Ink Banner: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| ink_banner_q_04 | Ink Banner: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| ink_banner_q_05 | Ink Banner: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| ink_banner_q_06 | Ink Banner: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| ink_banner_q_07 | Ink Banner: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| ink_banner_q_08 | Ink Banner: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| ink_banner_q_09 | Ink Banner: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| ink_banner_q_10 | Ink Banner: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| ink_banner_q_11 | Ink Banner: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| ink_banner_q_12 | Ink Banner: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| ink_banner_q_13 | Ink Banner: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| ink_banner_q_14 | Ink Banner: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| ink_banner_q_15 | Ink Banner: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| ink_banner_q_16 | Ink Banner: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| ink_banner_q_17 | Ink Banner: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| ink_banner_q_18 | Ink Banner: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| ink_banner_q_19 | Ink Banner: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| ink_banner_q_20 | Ink Banner: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| ink_banner_q_21 | Ink Banner: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| ink_banner_q_22 | Ink Banner: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| ink_banner_q_23 | Ink Banner: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| ink_banner_q_24 | Ink Banner: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| ink_banner_q_25 | Ink Banner: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Banner Gate`: write `ink_banner_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Red Seal Road`: write `ink_banner_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `ink_banner_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| ink_banner_species_01 | Koi Hound | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_02 | Paper Crane | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_03 | Reed Cat | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_04 | Lantern Stag | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_05 | Cedar Beetle | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_06 | Ink Swallow | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_07 | Kite Carp | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_08 | Willow Fox | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_09 | Seal Moth | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_10 | Lacquer Toad | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_11 | Court Hare | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_12 | Ribbon Eel | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_13 | Watch Heron | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_14 | Bamboo Vole | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_15 | Mist Turtle | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| ink_banner_species_16 | Drum Sparrow | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Seal Coin**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Banner Threads**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Banner Gate token, Reed Court tool, Kite Barracks thread, Red Seal Road seal, Cedar Watch bundle, The Quiet Standard token. |
| Instance and cosmetic templates | Lacquer Bridge tool, Willow Muster thread, Banner Gate seal, Reed Court bundle, Kite Barracks token, Red Seal Road tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `ink_banner_vendor_01` at `ink_banner_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| ink_banner_dungeon_room_01 | The Quiet Standard Vault: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: ink_banner_species_01, ink_banner_species_02; elite: none |   |
| ink_banner_dungeon_room_02 | The Quiet Standard Vault: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: ink_banner_species_03, ink_banner_species_04; elite: none |   |
| ink_banner_dungeon_room_03 | The Quiet Standard Vault: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: ink_banner_species_05, ink_banner_species_06; elite: ink_banner_species_09 |   |
| ink_banner_dungeon_room_04 | The Quiet Standard Vault: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: ink_banner_species_07, ink_banner_species_08; elite: none | checkpoint  |
| ink_banner_dungeon_room_05 | The Quiet Standard Vault: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: ink_banner_species_09, ink_banner_species_10; elite: none |  boss: ink_banner_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`ink_banner_trap_01`), jammed latch (`ink_banner_trap_02`), wet threshold (`ink_banner_trap_03`), false shelf (`ink_banner_trap_04`), quiet bell (`ink_banner_trap_05`), sealed drawer (`ink_banner_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**The Reed Court Muster** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| ink_banner_talent_01 | Ink Banner Local Ear | 1 | none | ink_banner_effect_01 |
| ink_banner_talent_02 | Ink Banner Careful Hand | 2 | none | ink_banner_effect_02 |
| ink_banner_talent_03 | Ink Banner Route Sense | 3 | none | ink_banner_effect_03 |
| ink_banner_talent_04 | Ink Banner Shared Measure | 4 | none | ink_banner_effect_04 |
| ink_banner_talent_05 | Ink Banner Quiet Craft | 1 | ink_banner_talent_04 | ink_banner_effect_05 |
| ink_banner_talent_06 | Ink Banner Open Invitation | 2 | none | ink_banner_effect_06 |
| ink_banner_talent_07 | Ink Banner Safe Return | 3 | none | ink_banner_effect_07 |
| ink_banner_talent_08 | Ink Banner Field Note | 4 | none | ink_banner_effect_08 |
| ink_banner_talent_09 | Ink Banner Steady Pace | 1 | ink_banner_talent_08 | ink_banner_effect_09 |
| ink_banner_talent_10 | Ink Banner Clear Signal | 2 | none | ink_banner_effect_10 |
| ink_banner_talent_11 | Ink Banner Warm Welcome | 3 | none | ink_banner_effect_11 |
| ink_banner_talent_12 | Ink Banner Small Courage | 4 | none | ink_banner_effect_12 |
| ink_banner_talent_13 | Ink Banner Repair Habit | 1 | ink_banner_talent_12 | ink_banner_effect_13 |
| ink_banner_talent_14 | Ink Banner Trust Mark | 2 | none | ink_banner_effect_14 |
| ink_banner_talent_15 | Ink Banner Second Look | 3 | none | ink_banner_effect_15 |
| ink_banner_talent_16 | Ink Banner Closing Grace | 4 | none | ink_banner_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| ink_banner_contract_01 | Ink Banner Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| ink_banner_contract_02 | Ink Banner Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| ink_banner_contract_03 | Ink Banner Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| ink_banner_contract_04 | Ink Banner Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| ink_banner_contract_05 | Ink Banner Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| ink_banner_contract_06 | Ink Banner Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| ink_banner_contract_07 | Ink Banner Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| ink_banner_contract_08 | Ink Banner Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| ink_banner_interact_01 | Banner Gate bench | rest | ink_banner_place_01 |
| ink_banner_interact_02 | Reed Court cabinet | repair | ink_banner_place_02 |
| ink_banner_interact_03 | Kite Barracks rack | tend | ink_banner_place_03 |
| ink_banner_interact_04 | Red Seal Road kettle | craft | ink_banner_place_04 |
| ink_banner_interact_05 | Cedar Watch ledger | cook | ink_banner_place_05 |
| ink_banner_interact_06 | The Quiet Standard rail | bind_inn | ink_banner_place_06 |
| ink_banner_interact_07 | Lacquer Bridge bell | inspect | ink_banner_place_07 |
| ink_banner_interact_08 | Willow Muster board | open | ink_banner_place_08 |
| ink_banner_interact_09 | Banner Gate table | carry | ink_banner_place_01 |
| ink_banner_interact_10 | Reed Court lamp | clean | ink_banner_place_02 |
| ink_banner_interact_11 | Kite Barracks gate | signal | ink_banner_place_03 |
| ink_banner_interact_12 | Red Seal Road shelf | record | ink_banner_place_04 |


**Default interior graph.** `ink_banner_interior_01` enters from `ink_banner_place_08` and contains 7 connected rooms: Ink Banner Entry, Ink Banner Main Room, Ink Banner Work Nook, Ink Banner Window Room, Ink Banner Quiet Room, Ink Banner Storage, Ink Banner Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | banner, reed, kite, red materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Ink Banner` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Speak with precise courtesy and name the duty before the desire. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Ink Banner: distant work, a room tone, a gentle rhythm that belongs to Banner Gate, and a second layer that makes the route toward The Quiet Standard feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Ink Banner Ledger |
| 2 | Ink Banner Route |
| 3 | Ink Banner Work |
| 4 | Ink Banner Talk |
| 5 | Ink Banner Kit |
| 6 | Ink Banner Pack |
| 7 | Ink Banner Rest |
| 8 | Ink Banner Safety |
| 9 | Ink Banner Map |
| 10 | Ink Banner Notice |
| 11 | Ink Banner Favour |
| 12 | Ink Banner Gold |
| 13 | Ink Banner Token |
| 14 | Ink Banner Record |
| 15 | Ink Banner Instance |
| 16 | Ink Banner Checkpoint |
| 17 | Ink Banner Choice |
| 18 | Ink Banner Help |
| 19 | Ink Banner Calendar |
| 20 | Ink Banner Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Banner Gate, a small promise has your name on it. |
| 2 | At Reed Court, a small promise has your name on it. |
| 3 | At Kite Barracks, a small promise has your name on it. |
| 4 | At Red Seal Road, a small promise has your name on it. |
| 5 | At Cedar Watch, a small promise has your name on it. |
| 6 | At The Quiet Standard, a small promise has your name on it. |
| 7 | At Lacquer Bridge, a small promise has your name on it. |
| 8 | At Willow Muster, a small promise has your name on it. |
| 9 | At Banner Gate, a small promise has your name on it. |
| 10 | At Reed Court, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is feudal duty and ceremonial duels. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
