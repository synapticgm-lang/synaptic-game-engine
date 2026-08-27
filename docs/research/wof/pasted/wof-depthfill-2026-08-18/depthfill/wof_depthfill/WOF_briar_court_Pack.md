# WOF Briar Court: Full Start-Depth Pack

> **Release truth.** Briar Court is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `briar_court` |
| Display name | **Briar Court** |
| One-line pitch | Dark fairy bargains and remembered promises. |
| Maturity | **teen** |
| rulesModuleId | `veil_glamour` |
| Theme Kit | **Briar Court Theme Kit**, included with world entitlement |
| Genre pattern and fence | Dark fairy bargains and remembered promises. It is an original WOF setting and not a licensed, historical, or platform-derived recreation. |

Briar Court is a WOF text world about dark fairy bargains and remembered promises. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Fable named place |
| 2 | The Witcher hero silhouette |
| 3 | A Court of Thorns and Roses logo geometry |
| 4 | Disney fairy catchphrase |
| 5 | Maleficent signature costume |
| 6 | Labyrinth proprietary creature |
| 7 | Pan’s Labyrinth map layout |
| 8 | Faerie Queene faction title |
| 9 | Neverland weapon profile |
| 10 | Grimm adaptation UI chrome |
| 11 | Fable quest premise |
| 12 | The Witcher title typography |
| 13 | A Court of Thorns and Roses color-coded insignia |
| 14 | Disney fairy music motif |
| 15 | Maleficent vehicle or mount profile |
| 16 | Labyrinth companion anatomy |
| 17 | Pan’s Labyrinth named artifact |
| 18 | Faerie Queene school or agency badge |
| 19 | Neverland real sacred practice as minigame |
| 20 | Grimm adaptation stereotyped cultural shorthand |
| 21 | Fable real-person likeness |
| 22 | The Witcher copied dialogue cadence |
| 23 | A Court of Thorns and Roses fan-server slogan |
| 24 | Disney fairy paid power framing |
| 25 | Maleficent loot-box presentation |
| 26 | Labyrinth named place |
| 27 | Pan’s Labyrinth hero silhouette |
| 28 | Faerie Queene logo geometry |
| 29 | Neverland catchphrase |
| 30 | Grimm adaptation signature costume |
| 31 | Fable proprietary creature |
| 32 | The Witcher map layout |
| 33 | A Court of Thorns and Roses faction title |
| 34 | Disney fairy weapon profile |
| 35 | Maleficent UI chrome |
| 36 | Labyrinth quest premise |
| 37 | Pan’s Labyrinth title typography |
| 38 | Faerie Queene color-coded insignia |
| 39 | Neverland music motif |
| 40 | Grimm adaptation vehicle or mount profile |
| 41 | Fable companion anatomy |
| 42 | The Witcher named artifact |
| 43 | A Court of Thorns and Roses school or agency badge |
| 44 | Disney fairy real sacred practice as minigame |
| 45 | Maleficent stereotyped cultural shorthand |
| 46 | Labyrinth real-person likeness |
| 47 | Pan’s Labyrinth copied dialogue cadence |
| 48 | Faerie Queene fan-server slogan |
| 49 | Neverland paid power framing |
| 50 | Grimm adaptation loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | hp, glamour, promise, favor, thorn, veil, courtStanding, memory |
| Wipe and checkpoint | Wipe returns the party to `briar_court_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Briar Court • {{turn}} • committed |
| 2 | [Route] Briar Court • {{placeId}} • committed |
| 3 | [Work] Briar Court • {{lastAction}} • committed |
| 4 | [Talk] Briar Court • {{npcId}} • committed |
| 5 | [Kit] Briar Court • {{kitId}} • committed |
| 6 | [Pack] Briar Court • {{partySize}} • committed |
| 7 | [Rest] Briar Court • {{checkpoint}} • committed |
| 8 | [Safety] Briar Court • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| briar_court_kit_01 | Bargain Gardener | bargain gardener workwear | practice bargain gardener | Never use bargain gardener authority to remove another person’s choice. | Use the local rhythm of Briar Court and make every offer concrete. | bargain_gardener mantle; bargain_gardener tool; briar_court_map_01 | briar_court_place_01; briar_court_q_01 | briar_court_ability_01 |
| briar_court_kit_02 | Thimble Herald | thimble herald workwear | practice thimble herald | Never use thimble herald authority to remove another person’s choice. | Use the local rhythm of Briar Court and make every offer concrete. | thimble_herald vest; thimble_herald tool; briar_court_map_02 | briar_court_place_02; briar_court_q_02 | briar_court_ability_02 |
| briar_court_kit_03 | Moon Orchardist | moon orchardist workwear | practice moon orchardist | Never use moon orchardist authority to remove another person’s choice. | Use the local rhythm of Briar Court and make every offer concrete. | moon_orchardist jacket; moon_orchardist tool; briar_court_map_03 | briar_court_place_01; briar_court_q_03 | briar_court_ability_03 |
| briar_court_kit_04 | Mirror Scribe | mirror scribe workwear | practice mirror scribe | Never use mirror scribe authority to remove another person’s choice. | Use the local rhythm of Briar Court and make every offer concrete. | mirror_scribe sash; mirror_scribe tool; briar_court_map_04 | briar_court_place_02; briar_court_q_04 | briar_court_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `briar_court_place_01` is a shared hub rather than a capital analogue; `briar_court_place_04` is the mid-join; `briar_court_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| briar_court_place_01 | Briar Gate | shared hub | street | safe | yes | briar_court_place_02, briar_court_place_04 | A public notice at Briar Gate has been posted with one crucial line washed away. |
| briar_court_place_02 | Thimble Hall | start hub | street | safe | yes | briar_court_place_01, briar_court_place_03 | A work roster at Thimble Hall leaves two neighbours believing they were promised the same task. |
| briar_court_place_03 | Moon Orchard | street route | street | safe | yes | briar_court_place_02, briar_court_place_04 | A route marker at Moon Orchard points visitors toward a closed gate and needs a safe correction. |
| briar_court_place_04 | Hollow Mirror | mid join | street | low | yes | briar_court_place_03, briar_court_place_05, briar_court_place_01 | A newcomer at Hollow Mirror needs a local introduction before a small obligation becomes embarrassing. |
| briar_court_place_05 | Mothwell | work district | interior | low | no | briar_court_place_04, briar_court_place_06 | A shared tool at Mothwell has been returned without its care tag. |
| briar_court_place_06 | Bramble Stair | instance door | dungeon | medium | no | briar_court_place_05, briar_court_place_07 | The entry record at Bramble Stair names an unfinished errand, not a monster or apocalypse. |
| briar_court_place_07 | Candle Nook | wild edge | street | medium | yes | briar_court_place_06, briar_court_place_08 | A weather change at Candle Nook threatens a community plan unless someone reads the signs. |
| briar_court_place_08 | Thorn Choir | housing approach | interior | low | no | briar_court_place_07 | A resident at Thorn Choir has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| briar_court_npc_01 | Bryn Cress | briar_court_place_01 | quest | Bryn Cress says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Bryn Cress offers a specific task at Briar Gate: settle the practical mismatch before it costs someone a shift. | Bryn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_02 | Cato Silt | briar_court_place_02 | profession | Cato Silt says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Cato Silt offers a specific task at Thimble Hall: settle the practical mismatch before it costs someone a shift. | Cato Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_03 | Dessa Pryce | briar_court_place_03 | hub | Dessa Pryce says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Dessa Pryce offers a specific task at Moon Orchard: settle the practical mismatch before it costs someone a shift. | Dessa Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_04 | Eris Vane | briar_court_place_04 | merchant | Eris Vane says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Eris Vane offers a specific task at Hollow Mirror: settle the practical mismatch before it costs someone a shift. | Eris Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_05 | Fenn Quill | briar_court_place_01 | local | Fenn Quill says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Fenn Quill offers a specific task at Briar Gate: settle the practical mismatch before it costs someone a shift. | Fenn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_06 | Gala Vale | briar_court_place_02 | host | Gala Vale says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Gala Vale offers a specific task at Thimble Hall: settle the practical mismatch before it costs someone a shift. | Gala Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_07 | Holl Wren | briar_court_place_03 | quest | Holl Wren says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Holl Wren offers a specific task at Moon Orchard: settle the practical mismatch before it costs someone a shift. | Holl Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_08 | Ivo Morrow | briar_court_place_04 | profession | Ivo Morrow says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Ivo Morrow offers a specific task at Hollow Mirror: settle the practical mismatch before it costs someone a shift. | Ivo Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_09 | Jori Rowan | briar_court_place_01 | local | Jori Rowan says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Jori Rowan offers a specific task at Briar Gate: settle the practical mismatch before it costs someone a shift. | Jori Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| briar_court_npc_10 | Alden Nook | briar_court_place_02 | merchant | Alden Nook says, ‘Briar Court keeps its promises in small places. Tell me which one you noticed.’ | Alden Nook offers a specific task at Thimble Hall: settle the practical mismatch before it costs someone a shift. | Alden Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Hollow Mirror, if that is useful. |
| 2 | Briar Court feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Bramble Stair. |
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
| Bargain Gardener | At Briar Gate, you arrive in bargain_gardener mantle carrying briar_court_map_01. A small obligation is already late. | Give up one turn to help now. | Briar Court: Name a Working Promise |
| Thimble Herald | At Thimble Hall, you arrive in thimble_herald vest carrying briar_court_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Briar Court: Set the First Tool Aside |
| Moon Orchardist | At Briar Gate, you arrive in moon_orchardist jacket carrying briar_court_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Briar Court: Carry the Right Record |
| Mirror Scribe | At Thimble Hall, you arrive in mirror_scribe sash carrying briar_court_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Briar Court: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_briar_court_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Briar Gate’s small mismatch | ask | missing tag | A local need at Hollow Mirror is connected but not catastrophic. | alternate talk |
| 2 | Resolve Thimble Hall’s small mismatch | repair | closed path | A local need at Mothwell is connected but not catastrophic. | new route |
| 3 | Resolve Moon Orchard’s small mismatch | carry | unclear note | A local need at Bramble Stair is connected but not catastrophic. | recorded favor |
| 4 | Resolve Hollow Mirror’s small mismatch | listen | late guest | A local need at Candle Nook is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Mothwell’s small mismatch | map | wet weather | A local need at Thorn Choir is connected but not catastrophic. | slower reward |
| 6 | Resolve Bramble Stair’s small mismatch | prepare | busy shift | A local need at Briar Gate is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Candle Nook’s small mismatch | wait | quiet boundary | A local need at Thimble Hall is connected but not catastrophic. | solo option |
| 8 | Resolve Thorn Choir’s small mismatch | return | wrong room | A local need at Moon Orchard is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Hollow Mirror Wake` and `Thorn Choir Masque`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| briar_court_q_01 | Briar Court: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| briar_court_q_02 | Briar Court: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| briar_court_q_03 | Briar Court: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| briar_court_q_04 | Briar Court: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| briar_court_q_05 | Briar Court: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| briar_court_q_06 | Briar Court: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| briar_court_q_07 | Briar Court: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| briar_court_q_08 | Briar Court: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| briar_court_q_09 | Briar Court: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| briar_court_q_10 | Briar Court: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| briar_court_q_11 | Briar Court: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| briar_court_q_12 | Briar Court: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| briar_court_q_13 | Briar Court: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| briar_court_q_14 | Briar Court: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| briar_court_q_15 | Briar Court: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| briar_court_q_16 | Briar Court: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| briar_court_q_17 | Briar Court: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| briar_court_q_18 | Briar Court: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| briar_court_q_19 | Briar Court: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| briar_court_q_20 | Briar Court: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| briar_court_q_21 | Briar Court: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| briar_court_q_22 | Briar Court: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| briar_court_q_23 | Briar Court: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| briar_court_q_24 | Briar Court: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| briar_court_q_25 | Briar Court: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Briar Gate`: write `briar_court_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Hollow Mirror`: write `briar_court_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `briar_court_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| briar_court_species_01 | Thistle Doe | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_02 | Glass Wren | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_03 | Moss Hare | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_04 | Candle Toad | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_05 | Briar Court Field Type 5 | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_06 | Briar Court Field Type 6 | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_07 | Briar Court Field Type 7 | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_08 | Briar Court Field Type 8 | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_09 | Briar Court Field Type 9 | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_10 | Briar Court Field Type 10 | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_11 | Briar Court Field Type 11 | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_12 | Briar Court Field Type 12 | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_13 | Briar Court Field Type 13 | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_14 | Briar Court Field Type 14 | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_15 | Briar Court Field Type 15 | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_16 | Briar Court Field Type 16 | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_17 | Briar Court Field Type 17 | opponent | 24 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| briar_court_species_18 | Briar Court Field Type 18 | opponent | 25 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Briar Pennies**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Veil Petals**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Briar Gate token, Thimble Hall tool, Moon Orchard thread, Hollow Mirror seal, Mothwell bundle, Bramble Stair token. |
| Instance and cosmetic templates | Candle Nook tool, Thorn Choir thread, Briar Gate seal, Thimble Hall bundle, Moon Orchard token, Hollow Mirror tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `briar_court_vendor_01` at `briar_court_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| briar_court_dungeon_room_01 | The Hollow Mirror Wake: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: briar_court_species_01, briar_court_species_02; elite: none |   |
| briar_court_dungeon_room_02 | The Hollow Mirror Wake: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: briar_court_species_03, briar_court_species_04; elite: none |   |
| briar_court_dungeon_room_03 | The Hollow Mirror Wake: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: briar_court_species_05, briar_court_species_06; elite: briar_court_species_09 |   |
| briar_court_dungeon_room_04 | The Hollow Mirror Wake: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: briar_court_species_07, briar_court_species_08; elite: none | checkpoint  |
| briar_court_dungeon_room_05 | The Hollow Mirror Wake: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: briar_court_species_09, briar_court_species_10; elite: none |  boss: briar_court_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`briar_court_trap_01`), jammed latch (`briar_court_trap_02`), wet threshold (`briar_court_trap_03`), false shelf (`briar_court_trap_04`), quiet bell (`briar_court_trap_05`), sealed drawer (`briar_court_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Thorn Choir Masque** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| briar_court_talent_01 | Briar Court Local Ear | 1 | none | briar_court_effect_01 |
| briar_court_talent_02 | Briar Court Careful Hand | 2 | none | briar_court_effect_02 |
| briar_court_talent_03 | Briar Court Route Sense | 3 | none | briar_court_effect_03 |
| briar_court_talent_04 | Briar Court Shared Measure | 4 | none | briar_court_effect_04 |
| briar_court_talent_05 | Briar Court Quiet Craft | 1 | briar_court_talent_04 | briar_court_effect_05 |
| briar_court_talent_06 | Briar Court Open Invitation | 2 | none | briar_court_effect_06 |
| briar_court_talent_07 | Briar Court Safe Return | 3 | none | briar_court_effect_07 |
| briar_court_talent_08 | Briar Court Field Note | 4 | none | briar_court_effect_08 |
| briar_court_talent_09 | Briar Court Steady Pace | 1 | briar_court_talent_08 | briar_court_effect_09 |
| briar_court_talent_10 | Briar Court Clear Signal | 2 | none | briar_court_effect_10 |
| briar_court_talent_11 | Briar Court Warm Welcome | 3 | none | briar_court_effect_11 |
| briar_court_talent_12 | Briar Court Small Courage | 4 | none | briar_court_effect_12 |
| briar_court_talent_13 | Briar Court Repair Habit | 1 | briar_court_talent_12 | briar_court_effect_13 |
| briar_court_talent_14 | Briar Court Trust Mark | 2 | none | briar_court_effect_14 |
| briar_court_talent_15 | Briar Court Second Look | 3 | none | briar_court_effect_15 |
| briar_court_talent_16 | Briar Court Closing Grace | 4 | none | briar_court_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| briar_court_contract_01 | Briar Court Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| briar_court_contract_02 | Briar Court Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| briar_court_contract_03 | Briar Court Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| briar_court_contract_04 | Briar Court Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| briar_court_contract_05 | Briar Court Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| briar_court_contract_06 | Briar Court Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| briar_court_contract_07 | Briar Court Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| briar_court_contract_08 | Briar Court Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| briar_court_interact_01 | Briar Gate bench | rest | briar_court_place_01 |
| briar_court_interact_02 | Thimble Hall cabinet | repair | briar_court_place_02 |
| briar_court_interact_03 | Moon Orchard rack | tend | briar_court_place_03 |
| briar_court_interact_04 | Hollow Mirror kettle | craft | briar_court_place_04 |
| briar_court_interact_05 | Mothwell ledger | cook | briar_court_place_05 |
| briar_court_interact_06 | Bramble Stair rail | bind_inn | briar_court_place_06 |
| briar_court_interact_07 | Candle Nook bell | inspect | briar_court_place_07 |
| briar_court_interact_08 | Thorn Choir board | open | briar_court_place_08 |
| briar_court_interact_09 | Briar Gate table | carry | briar_court_place_01 |
| briar_court_interact_10 | Thimble Hall lamp | clean | briar_court_place_02 |
| briar_court_interact_11 | Moon Orchard gate | signal | briar_court_place_03 |
| briar_court_interact_12 | Hollow Mirror shelf | record | briar_court_place_04 |


**Default interior graph.** `briar_court_interior_01` enters from `briar_court_place_08` and contains 7 connected rooms: Briar Court Entry, Briar Court Main Room, Briar Court Work Nook, Briar Court Window Room, Briar Court Quiet Room, Briar Court Storage, Briar Court Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | briar, thimble, moon, hollow materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Briar Court` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use the local rhythm of Briar Court and make every offer concrete. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Briar Court: distant work, a room tone, a gentle rhythm that belongs to Briar Gate, and a second layer that makes the route toward Bramble Stair feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Briar Court Ledger |
| 2 | Briar Court Route |
| 3 | Briar Court Work |
| 4 | Briar Court Talk |
| 5 | Briar Court Kit |
| 6 | Briar Court Pack |
| 7 | Briar Court Rest |
| 8 | Briar Court Safety |
| 9 | Briar Court Map |
| 10 | Briar Court Notice |
| 11 | Briar Court Favour |
| 12 | Briar Court Gold |
| 13 | Briar Court Token |
| 14 | Briar Court Record |
| 15 | Briar Court Instance |
| 16 | Briar Court Checkpoint |
| 17 | Briar Court Choice |
| 18 | Briar Court Help |
| 19 | Briar Court Calendar |
| 20 | Briar Court Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Briar Gate, a small promise has your name on it. |
| 2 | At Thimble Hall, a small promise has your name on it. |
| 3 | At Moon Orchard, a small promise has your name on it. |
| 4 | At Hollow Mirror, a small promise has your name on it. |
| 5 | At Mothwell, a small promise has your name on it. |
| 6 | At Bramble Stair, a small promise has your name on it. |
| 7 | At Candle Nook, a small promise has your name on it. |
| 8 | At Thorn Choir, a small promise has your name on it. |
| 9 | At Briar Gate, a small promise has your name on it. |
| 10 | At Thimble Hall, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is dark fairy bargains and remembered promises. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
